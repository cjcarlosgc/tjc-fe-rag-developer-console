import type { RunViewModel } from './types'

const labels = { PENDING: 'Esperando capacidad', GENERATING: 'Generando pruebas', VALIDATING: 'Validando en Sandbox', COMPLETED: 'Ejecución completada', PARTIAL: 'Resultado parcial', FAILED: 'Ejecución fallida' }

export function RunProgress({ run }: { run: RunViewModel }) {
  const percent = run.total ? Math.round(run.processed / run.total * 100) : 0
  return <section className={`run-progress status-${run.status.toLowerCase()}`} aria-labelledby="run-status"><div className="run-progress-copy"><p className="eyebrow">Run / {run.id}</p><h2 id="run-status">{labels[run.status]}</h2><p>{run.processed} de {run.total} targets procesados</p></div><div className="run-dial" aria-label={`${percent}% completado`} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} style={{ '--run-progress': `${percent * 3.6}deg` } as React.CSSProperties}><span>{percent}<small>%</small></span></div><div className="target-pulse" aria-label="Estado por target">{run.targets.map((target) => <span title={`${target.label}: ${target.status}`} className={`pulse-${target.status.toLowerCase()}`} key={target.id} />)}</div></section>
}
