import { useEffect, useState } from 'react'

interface Props { label: string }

/** spec.md "Estados y movimiento" (Stitch): loaders con fase textual y tiempo transcurrido, nunca un spinner ciego. */
export function ContextTraceLoadingState({ label }: Props) {
  const [elapsedMs, setElapsedMs] = useState(0)

  useEffect(() => {
    const startedAt = Date.now()
    const interval = setInterval(() => setElapsedMs(Date.now() - startedAt), 250)
    return () => clearInterval(interval)
  }, [])

  return <div className="analysis-progress" role="status" aria-live="polite">
    <div className="progress-header">
      <div><span className="live-indicator" /><strong>{label}</strong></div>
      <span className="progress-value">T+{(elapsedMs / 1000).toFixed(1)}s</span>
    </div>
  </div>
}
