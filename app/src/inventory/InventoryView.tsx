import { useMemo, useState } from 'react'
import type { InventoryTargetViewModel } from './types'

type CoverageFilter = 'ALL' | 'MISSING' | 'TESTED'

interface Props {
  targets: InventoryTargetViewModel[]
  onSelect?: (target: InventoryTargetViewModel) => void
}

export function InventoryView({ targets, onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [coverage, setCoverage] = useState<CoverageFilter>('ALL')
  const filtered = useMemo(() => targets.filter((target) => {
    const matchesQuery = `${target.filePath} ${target.symbolName} ${target.methodName ?? ''}`.toLowerCase().includes(query.trim().toLowerCase())
    const matchesCoverage = coverage === 'ALL' || (coverage === 'TESTED' ? target.hasExistingTest : !target.hasExistingTest)
    return matchesQuery && matchesCoverage
  }), [coverage, query, targets])

  return <div className="inventory-stack"><div className="inventory-toolbar"><div className="field inventory-search"><label htmlFor="inventory-query">Buscar target</label><input id="inventory-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="path, clase o método" /></div><fieldset className="segmented"><legend>Cobertura existente</legend>{(['ALL', 'MISSING', 'TESTED'] as const).map((value) => <button type="button" aria-pressed={coverage === value} onClick={() => setCoverage(value)} key={value}>{value === 'ALL' ? 'Todos' : value === 'MISSING' ? 'Sin test' : 'Con test'}</button>)}</fieldset></div>{filtered.length === 0 ? <div className="empty-inline"><strong>Sin targets coincidentes</strong><p>Ajusta el texto o el filtro de cobertura.</p></div> : <div className="table-frame"><table><thead><tr><th scope="col">Target</th><th scope="col">Tipo</th><th scope="col">Archivo</th><th scope="col">Cobertura</th><th scope="col"><span className="visually-hidden">Acciones</span></th></tr></thead><tbody>{filtered.map((target) => <tr key={target.id}><td><strong>{target.methodName ?? target.symbolName}</strong>{target.methodName && <small>{target.symbolName}</small>}</td><td><code>{target.kind}</code></td><td className="path-cell">{target.filePath}</td><td><span className={`coverage-mark ${target.hasExistingTest ? 'tested' : 'missing'}`}><i />{target.hasExistingTest ? 'Con test' : 'Sin test'}</span></td><td>{onSelect && <button className="target-action" type="button" onClick={() => onSelect(target)}>Usar target →</button>}</td></tr>)}</tbody></table></div>}</div>
}
