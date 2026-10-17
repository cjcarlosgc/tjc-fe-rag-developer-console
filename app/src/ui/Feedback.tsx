import { Link } from 'react-router-dom'
import { Spinner } from './Loaders'

interface ErrorStateProps {
  message: string
  onRetry: () => void
  /** Referencia para soporte: solo existe en errores que vinieron de Core (o del mock). */
  correlationId?: string
}

export function ErrorState({ message, onRetry, correlationId }: ErrorStateProps) {
  return (
    <div className="feedback error-state" role="alert">
      <strong>No pudimos cargar esta información</strong>
      <p>{message}{correlationId && <> <span className="correlation-ref">Referencia: <code>{correlationId}</code></span></>}</p>
      <button className="button secondary" type="button" onClick={onRetry}>Reintentar</button>
    </div>
  )
}

export function LoadingState({ label }: { label: string }) {
  return <div className="feedback" role="status"><Spinner />{label}</div>
}

interface ErrorNoteProps {
  message: string
  correlationId?: string
}

/** Error inline de una acción (no de una carga de página): mensaje + `correlationId` para poder rastrearlo en Core. */
export function ErrorNote({ message, correlationId }: ErrorNoteProps) {
  return (
    <p className="inline-error" role="alert">
      {message}
      {correlationId && <> <span className="correlation-ref">Referencia: <code>{correlationId}</code></span></>}
    </p>
  )
}

/** Project eliminado o inexistente: sin "Reintentar" (no volverá), solo el camino de regreso a la lista. */
export function ProjectNotFoundState() {
  return (
    <div className="feedback error-state" role="alert">
      <strong>El proyecto ya no existe</strong>
      <p>Fue eliminado o nunca existió para tu cuenta.</p>
      <Link className="button secondary button-link" to="/">Volver a Proyectos</Link>
    </div>
  )
}
