import { io, type Socket } from 'socket.io-client'

const baseUrl = (import.meta.env.VITE_CORE_API_URL ?? '').replace(/\/$/, '')

let socket: Socket | null = null

function getSocket(): Socket {
  if (!socket) socket = io(baseUrl, { reconnection: true })
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
  socket?.disconnect()
  socket = null
}
