export interface StructuredRow {
  id: string
  primary: string
  secondary?: string
  status: string
  meta?: string
}

interface Props {
  caption: string
  rows: StructuredRow[]
  selectedId: string | null
  onSelect: (id: string) => void
}

/** Alternativa real al canvas: misma cantidad de nodos, mismo view model, sin duplicar el mapeo del grafo. */
export function StructuredAlternativeView({ caption, rows, selectedId, onSelect }: Props) {
  return <div className="table-frame structured-alternative"><table><caption>{caption}</caption><thead><tr><th scope="col">Nodo</th><th scope="col">Estado</th><th scope="col">Detalle</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={selectedId === row.id ? 'selected' : ''}><td><button type="button" className="structured-row-button" aria-current={selectedId === row.id ? 'true' : undefined} onClick={() => onSelect(row.id)}><strong>{row.primary}</strong>{row.secondary && <small>{row.secondary}</small>}</button></td><td>{row.status}</td><td>{row.meta}</td></tr>)}</tbody></table></div>
}
