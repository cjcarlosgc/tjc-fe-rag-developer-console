import type { RunViewModel, TargetRunViewModel } from './types'

const boolLabel = (value?: boolean) => value === undefined ? '—' : value ? 'Sí' : 'No'
const isPlatformFailure = (target: TargetRunViewModel) => target.status === 'FAILED' || target.failureType === 'INFRASTRUCTURE'

export function ValidationResults({ run }: { run: RunViewModel }) {
  const valid = run.targets.filter((target) => target.valid).length
  const invalid = run.targets.filter((target) => target.valid === false && !isPlatformFailure(target)).length
  const platform = run.targets.filter(isPlatformFailure).length
  return <section className="validation-stack"><div className="validation-summary"><div><span>{valid}</span><small>Válidas</small></div><div><span>{invalid}</span><small>Inválidas</small></div><div><span>{platform}</span><small>Fallo plataforma</small></div></div><div className="table-frame"><table><thead><tr><th>Target</th><th>Compila</th><th>Ejecuta</th><th>Pasa</th><th>Válida</th><th>Failure type</th></tr></thead><tbody>{run.targets.map((target) => <tr key={target.id}><td><strong>{target.label}</strong><small>{target.filePath}</small></td><td>{boolLabel(target.compiled)}</td><td>{boolLabel(target.executed)}</td><td>{boolLabel(target.passed)}</td><td><span className={`coverage-mark ${target.valid ? 'tested' : 'missing'}`}><i />{boolLabel(target.valid)}</span></td><td><code>{target.failureType ?? '—'}</code>{target.errorSummary && <details><summary>Ver error</summary><p>{target.errorSummary}</p>{target.errorDetail && <pre>{target.errorDetail}</pre>}</details>}</td></tr>)}</tbody></table></div></section>
}
