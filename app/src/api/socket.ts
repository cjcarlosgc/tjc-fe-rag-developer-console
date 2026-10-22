import { io, type Socket } from 'socket.io-client'
import type { AnalysisRunDetailResponse, ExperimentStatusResponse, SubscribeAck } from '../contracts/generated/contract-types'
import { baseUrl, getAuthToken, notifyAuthError } from './client'

/**
 * Tiempo real de Developer Console (INTEROP-2.18 §6.6, DEC-RT-001). Es complemento: el polling HTTP de §6.2, §6.5 y §6.10 sigue
 * siendo la base y el único mecanismo garantizado. No hay replay ni orden garantizado, así que cada consumidor reconcilia con su
 * GET tras reconectar (`onReconcile`). Nunca se registra el token.
 */

/** `connect_error` de un rechazo de middleware trae `err.data = { code, message, retryable }` (INTEROP-2.18 §6.6). */
interface HandshakeError extends Error {
  data?: { code?: string; retryable?: boolean }
}

/**
 * Rechazos de identidad no reintentables que cierran la sesión igual que HTTP (mismo conjunto que `SESSION_ENDING_401_CODES`).
 * Los códigos genéricos de §4.1 y los desconocidos no aparecen aquí: se toleran sin cerrar sesión.
 */
const SESSION_ENDING_HANDSHAKE_CODES: ReadonlySet<string> = new Set(['AUTH_REQUIRED', 'INVALID_ACCESS_TOKEN', 'GITHUB_IDENTITY_REQUIRED'])

// Backoff acotado para `retryable: true`: `IDENTITY_UNAVAILABLE` (handshake) y `GITHUB_VERIFICATION_UNAVAILABLE` (ack).
// Agotado, HTTP (polling) sigue de fallback.
const RETRY_BASE_MS = 1_000
const RETRY_MAX_MS = 30_000
const RETRY_MAX_ATTEMPTS = 5

/** Ritmo de progreso por experimento (INTEROP-2.18 §6.6: `completedRepetitions` tiene límite de 1500 ms). */
const PROGRESS_WINDOW_MS = 1_500

let socket: Socket | null = null
let retryAttempts = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null
/** Suscripciones vivas. `resetSocket` las desactiva (listeners y timers) junto con el socket que las sostenía. */
const liveSubscriptions = new Set<() => void>()

/**
 * Descarta el socket, sus suscripciones y los timers pendientes para que la próxima suscripción cree uno nuevo con el token vigente.
 * `AuthProvider` lo llama al cerrar sesión o cambiar de usuario: el token solo se lee en el handshake, así que una
 * conexión de la sesión anterior no debe reutilizarse.
 */
export function resetSocket(): void {
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = null
  retryAttempts = 0
  for (const teardown of [...liveSubscriptions]) teardown()
  socket?.disconnect()
  socket = null
}

/**
 * Un rechazo desde middleware desactiva la reconexión automática de socket.io-client. Con `retryable: true`
 * (`IDENTITY_UNAVAILABLE`: Admin API de Supabase no disponible) hay que llamar a `connect()` a mano, con backoff acotado; el
 * `retryable` del propio rechazo manda y, si falta, solo `IDENTITY_UNAVAILABLE` se considera reintentable. Los rechazos de
 * identidad no reintentables (`AUTH_REQUIRED`, `INVALID_ACCESS_TOKEN`, `GITHUB_IDENTITY_REQUIRED`) siguen el mismo manejo de sesión
 * que HTTP. Un fallo de transporte (sin `data`) lo sigue reintentando socket.io por sí mismo. Nunca se registra el token.
 */
function handleConnectError(client: Socket, error: HandshakeError): void {
  const code = error.data?.code
  if (!code || client !== socket) return
  const retryable = error.data?.retryable ?? code === 'IDENTITY_UNAVAILABLE'
  if (retryable) {
    if (retryTimer) return
    if (retryAttempts >= RETRY_MAX_ATTEMPTS) {
      resetSocket()
      return
    }
    const delay = Math.min(RETRY_BASE_MS * 2 ** retryAttempts, RETRY_MAX_MS)
    retryAttempts += 1
    retryTimer = setTimeout(() => {
      retryTimer = null
      client.connect()
    }, delay)
    return
  }
  if (SESSION_ENDING_HANDSHAKE_CODES.has(code)) {
    resetSocket()
    notifyAuthError({ status: 401, code })
  }
  // Códigos genéricos de §4.1 (el handshake no los usa) y desconocidos: se toleran sin cerrar sesión; HTTP sigue como base.
}

/**
 * Mismo usuario con un access token renovado: reconecta el mismo socket (el handshake vuelve a leer el token vigente) sin
 * perder las suscripciones, porque cada suscripción vuelve a emitir `subscribe` en cada `connect` y reconcilia. Sin socket no hace nada.
 */
export function renewSocketAuth(): void {
  if (!socket) return
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = null
  retryAttempts = 0
  socket.disconnect()
  socket.connect()
}

/**
 * Socket de la sesión vigente. Sin token no se abre la conexión: el handshake sin sesión se rechaza con `AUTH_REQUIRED`
 * (INTEROP-2.18 §6.6), así que devuelve `null` y las suscripciones son no-op. El `auth` envía siempre `{ token }` no vacío;
 * si el token desaparece entre reconexiones, el socket se descarta y no vuelve a conectar. El token nunca va en la query.
 */
function getSocket(): Socket | null {
  if (!socket) {
    if (!getAuthToken()) return null
    const client: Socket = io(baseUrl, {
      reconnection: true,
      auth: (callback) => {
        const token = getAuthToken()
        if (!token) {
          // Nunca `{}`: sin credencial no se completa el handshake; la conexión se descarta sin reconectar.
          if (client === socket) resetSocket()
          else client.disconnect()
          return
        }
        callback({ token })
      },
    })
    client.on('connect', () => {
      retryAttempts = 0
    })
    client.on('connect_error', (error: HandshakeError) => handleConnectError(client, error))
    socket = client
  }
  return socket
}

/** Coalescing de progreso: como mucho una entrega por ventana; un estado terminal entrega al momento y cancela lo pendiente. */
interface ProgressLimiter<T> {
  push: (payload: T) => void
  cancel: () => void
}

/**
 * Limita las actualizaciones de progreso de un experimento (INTEROP-2.18 §6.6). La primera de una ventana se entrega al momento;
 * las siguientes se agrupan y, al cerrar la ventana, se entrega la última pendiente (y se abre otra). Un cambio de estado no
 * espera a la ventana y un estado terminal cancela lo pendiente. El reloj son timers, no fechas: testeable con fake timers.
 */
function createProgressLimiter<T extends { status: string }>(deliver: (payload: T) => void, windowMs: number): ProgressLimiter<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: T | null = null
  let lastStatus: string | null = null

  function cancel(): void {
    if (timer) clearTimeout(timer)
    timer = null
    pending = null
  }

  function openWindow(): void {
    timer = setTimeout(closeWindow, windowMs)
  }

  function closeWindow(): void {
    timer = null
    if (!pending) return
    const next = pending
    pending = null
    deliver(next)
    openWindow()
  }

  return {
    push(payload: T) {
      const status = payload.status
      const terminal = status === 'COMPLETED' || status === 'FAILED'
      const changed = lastStatus !== null && status !== lastStatus
      lastStatus = status
      if (terminal) {
        cancel()
        deliver(payload)
        return
      }
      if (changed) {
        pending = null
        deliver(payload)
        if (!timer) openWindow()
        return
      }
      if (timer) {
        pending = payload
        return
      }
      deliver(payload)
      openWindow()
    },
    cancel,
  }
}

interface SubscriptionSpec<T extends { id: string }> {
  subscribeEvent: string
  unsubscribeEvent: string
  updateEvent: string
  idField: string
  id: string
  onUpdate: (payload: T) => void
  onReconcile?: () => void
  /** Limitador de la suscripción; su timer se cancela al desuscribir o al resetear el socket. */
  limiter?: { cancel: () => void }
}

/**
 * Suscripción a un recurso por id. Sin socket (sin sesión) devuelve un unsubscribe inocuo. Cada `subscribe:*` lleva
 * acknowledgment `SubscribeAck` (§6.6): suscrito; `GITHUB_VERIFICATION_UNAVAILABLE` reintenta con backoff acotado; denegado o
 * inexistente (sin distinguirlos) no reintenta ni muestra error, y el polling HTTP sigue. Cada conexión posterior a la primera
 * re-emite `subscribe` y llama a `onReconcile`, para que el consumidor reconcilie con su GET.
 */
function subscribeById<T extends { id: string }>(spec: SubscriptionSpec<T>): () => void {
  const client = getSocket()
  return client ? attachSubscription(client, spec) : () => {}
}

function attachSubscription<T extends { id: string }>(client: Socket, spec: SubscriptionSpec<T>): () => void {
  const payload = { [spec.idField]: spec.id }
  let active = true
  let seenConnect = client.connected
  let verificationAttempts = 0
  let verificationPending = false
  let verificationTimer: ReturnType<typeof setTimeout> | null = null

  function clearVerificationTimer(): void {
    if (verificationTimer) clearTimeout(verificationTimer)
    verificationTimer = null
  }

  function emitSubscribe(): void {
    if (!active) return
    client.emit(spec.subscribeEvent, payload, handleAck)
  }

  function scheduleVerificationRetry(): void {
    if (verificationTimer || verificationAttempts >= RETRY_MAX_ATTEMPTS) return
    const delay = Math.min(RETRY_BASE_MS * 2 ** verificationAttempts, RETRY_MAX_MS)
    verificationAttempts += 1
    verificationTimer = setTimeout(() => {
      verificationTimer = null
      emitSubscribe()
    }, delay)
  }

  function handleAck(ack: SubscribeAck | undefined): void {
    if (!active) return
    if (ack?.subscribed) {
      // Una suscripción que se confirma tras reintentar pudo perderse avisos: se reconcilia con el GET.
      if (verificationPending) {
        verificationPending = false
        spec.onReconcile?.()
      }
      return
    }
    if (ack?.code === 'GITHUB_VERIFICATION_UNAVAILABLE' && ack.retryable) {
      verificationPending = true
      scheduleVerificationRetry()
    }
    // Denegado o inexistente: sin error visible; la pantalla sigue con HTTP.
  }

  function handleConnect(): void {
    // Cada conexión posterior a la primera es una reconexión: re-suscribe y reconcilia (sin replay en el servidor).
    const reconnect = seenConnect
    seenConnect = true
    clearVerificationTimer()
    verificationAttempts = 0
    emitSubscribe()
    if (reconnect) spec.onReconcile?.()
  }

  function handleUpdate(update: T): void {
    if (update?.id === spec.id) spec.onUpdate(update)
  }

  function teardown(): void {
    if (!active) return
    active = false
    client.off('connect', handleConnect)
    client.off(spec.updateEvent, handleUpdate)
    clearVerificationTimer()
    spec.limiter?.cancel()
    liveSubscriptions.delete(teardown)
  }

  liveSubscriptions.add(teardown)
  client.on('connect', handleConnect)
  client.on(spec.updateEvent, handleUpdate)
  if (client.connected) emitSubscribe()

  return () => {
    if (!active) return
    const live = client.connected
    teardown()
    if (live) client.emit(spec.unsubscribeEvent, payload)
  }
}

/** HU21: complemento en tiempo real de `GET /project-versions/{id}`; el polling sigue como fallback. */
export function subscribeProjectVersionUpdates<T extends { id: string }>(
  projectVersionId: string,
  onUpdate: (payload: T) => void,
): () => void {
  return subscribeById<T>({
    subscribeEvent: 'subscribe:project-version',
    unsubscribeEvent: 'unsubscribe:project-version',
    updateEvent: 'project-version:update',
    idField: 'projectVersionId',
    id: projectVersionId,
    onUpdate,
  })
}

/**
 * Complemento de `GET /analysis-runs/{id}` (§6.6). Sin limitador de ritmo: el límite de 1500 ms es de progreso de experimento.
 * Lo consume `useAnalysisRunRealtime` en `AnalysisRunDetailPage`, único consumidor por id: las demás pantallas que usan el Run son
 * rutas hermanas que no coexisten con el detalle, por eso `unsubscribe` no cuenta referencias.
 */
export function subscribeAnalysisRunUpdates(
  analysisRunId: string,
  onUpdate: (payload: AnalysisRunDetailResponse) => void,
  onReconcile?: () => void,
): () => void {
  return subscribeById<AnalysisRunDetailResponse>({
    subscribeEvent: 'subscribe:analysis-run',
    unsubscribeEvent: 'unsubscribe:analysis-run',
    updateEvent: 'analysis-run:update',
    idField: 'analysisRunId',
    id: analysisRunId,
    onUpdate,
    onReconcile,
  })
}

/**
 * Complemento de `GET /experiments/{id}` (§6.6). El progreso se limita a una entrega por ventana de 1500 ms; los estados
 * terminales y los cambios de estado entregan al momento. Cada entrega es un aviso: el consumidor reconcilia con su GET.
 */
export function subscribeExperimentUpdates(
  experimentId: string,
  onUpdate: (payload: ExperimentStatusResponse) => void,
  onReconcile?: () => void,
): () => void {
  const limiter = createProgressLimiter<ExperimentStatusResponse>(onUpdate, PROGRESS_WINDOW_MS)
  return subscribeById<ExperimentStatusResponse>({
    subscribeEvent: 'subscribe:experiment',
    unsubscribeEvent: 'unsubscribe:experiment',
    updateEvent: 'experiment:update',
    idField: 'experimentId',
    id: experimentId,
    onUpdate: limiter.push,
    onReconcile,
    limiter,
  })
}

export function resetSocketForTests(): void {
  resetSocket()
}
