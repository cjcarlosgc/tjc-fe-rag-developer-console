export interface LegendItem {
  swatchClassName: string
  label: string
}

/** El color nunca es la única señal: cada entrada trae texto además del swatch. */
export function Legend({ items }: { items: LegendItem[] }) {
  return <ul className="graph-legend" aria-label="Leyenda del grafo">{items.map((item) => <li key={item.label}><span className={`legend-swatch ${item.swatchClassName}`} aria-hidden="true" />{item.label}</li>)}</ul>
}
