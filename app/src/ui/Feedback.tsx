import { Spinner } from './Loaders'

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="feedback error-state" role="alert">
      <strong>No pudimos cargar esta información</strong>
      <p>{message}</p>
      <button className="button secondary" type="button" onClick={onRetry}>Reintentar</button>
    </div>
  )
}

export function LoadingState({ label }: { label: string }) {
  return <div className="feedback" role="status"><Spinner />{label}</div>
}
