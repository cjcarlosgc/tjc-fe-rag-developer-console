import { io, type Socket } from 'socket.io-client'
import { getAuthToken, notifyAuthError } from './client'

const baseUrl = (import.meta.env.VITE_CORE_API_URL ?? '').replace(/\/$/, '')

/** HU62 (INTEROP-2.4 §6.6): `connect_error` de un rechazo de middleware trae `err.data = { code, retryable }`. */
interface HandshakeError extends Error {
  data?: { code?: string; retryable?: boolean }
}

// Backoff acotado para `retryable: true` (`IDENTITY_UNAVAILABLE`); agotado, HTTP (polling) sigue de fallback.
const RETRY_BASE_MS = 1_000
const RETRY_MAX_MS = 30_000
const RETRY_MAX_ATTEMPTS = 5

let socket: Socket | null = null
let retryAttempts = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Descarta el socket (y su backoff pendiente) para que la próxima suscripción cree uno nuevo con el token vigente.
 * `AuthProvider` lo llama al cerrar sesión o cambiar de usuario: el token solo se lee en el handshake, así que una
 * conexión de la sesión anterior no debe reutilizarse.
 */
export function resetSocket(): void {
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = null
  retryAttempts = 0
  socket?.disconnect()
  socket = null
}

/**
 * Un rechazo desde middleware desactiva la reconexión automática de socket.io-client. Con `retryable: true`
 * (Admin API de Supabase no disponible) hay que llamar a `connect()` a mano; los rechazos de identidad
 * (`INVALID_ACCESS_TOKEN`, `GITHUB_IDENTITY_REQUIRED`) siguen el mismo manejo de sesión que HTTP y no se reintentan.
 * Un fallo de transporte (sin `data`) lo sigue reintentando socket.io por sí mismo. Nunca se registra el token.
 */
function handleConnectError(client: Socket, error: HandshakeError): void {
  const code = error.data?.code
  if (!code || client !== socket) return
  if (error.data?.retryable) {
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
  if (code === 'INVALID_ACCESS_TOKEN' || code === 'GITHUB_IDENTITY_REQUIRED') {
    resetSocket()
    notifyAuthError({ status: 401, code })
  }
}

/**
 * Mismo usuario con un access token renovado: reconecta el mismo socket (el handshake vuelve a leer el token vigente) sin
 * perder las suscripciones, porque `subscribeById` vuelve a emitir `subscribe` en cada `connect`. Sin socket no hace nada.
 */
export function renewSocketAuth(): void {
  if (!socket) return
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = null
  retryAttempts = 0
  socket.disconnect()
  socket.connect()
}

function getSocket(): Socket {
  if (!socket) {
    // El token se lee en cada (re)conexión; sin token el handshake se acepta y cada `subscribe:*` exige credencial.
    const client = io(baseUrl, {
      reconnection: true,
      auth: (callback) => {
        const token = getAuthToken()
        callback(token ? { token } : {})
      },
    })
    client.on('connect', () => { retryAttempts = 0 })
    client.on('connect_error', (error: HandshakeError) => handleConnectError(client, error))
    socket = client
  }
  return socket
}

function subscribeById<T extends { id: string }>(
  subscribeEvent: string,
  unsubscribeEvent: string,
  updateEvent: string,
  idField: string,
  id: string,
  onUpdate: (payload: T) => void,
): () => void {
  const client = getSocket()
  const payload = { [idField]: id }
  const emitSubscribe = () => client.emit(subscribeEvent, payload)
  const handleUpdate = (update: T) => {
    if (update?.id === id) onUpdate(update)
  }
  client.on('connect', emitSubscribe)
  client.on(updateEvent, handleUpdate)
  if (client.connected) emitSubscribe()

  return () => {
    client.off('connect', emitSubscribe)
    client.off(updateEvent, handleUpdate)
    if (client.connected) client.emit(unsubscribeEvent, payload)
  }
}

/** HU21: complemento en tiempo real de `GET /project-versions/{id}`; el polling sigue como fallback. */
export function subscribeProjectVersionUpdates<T extends { id: string }>(
  projectVersionId: string,
  onUpdate: (payload: T) => void,
): () => void {
  return subscribeById('subscribe:project-version', 'unsubscribe:project-version', 'project-version:update', 'projectVersionId', projectVersionId, onUpdate)
}

/** HU22: complemento en tiempo real de `GET /test-runs/{id}`; el polling sigue como fallback. */
export function subscribeTestRunUpdates<T extends { id: string }>(
  testRunId: string,
  onUpdate: (payload: T) => void,
): () => void {
  return subscribeById('subscribe:test-run', 'unsubscribe:test-run', 'test-run:update', 'testRunId', testRunId, onUpdate)
}

export function resetSocketForTests(): void {
  resetSocket()
}
