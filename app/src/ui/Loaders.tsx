/**
 * Motivos de movimiento Black Glass (spec/transversal/design-system "Movimiento"):
 * ingesta -> constelación discreta, generación -> forma orbital, espera genérica -> nube granular.
 * Recreados en CSS/SVG con los tokens del sistema; no son reproducción literal de los GIF de Stitch de referencia.
 */

/** Espera genérica: nube granular. */
export function Spinner() {
  return (
    <span className="spinner" aria-hidden="true">
      <i /><i /><i /><i /><i />
    </span>
  )
}

/** Ingesta (análisis/indexación de una ProjectVersion): constelación discreta. */
export function GraphPulseIcon() {
  return (
    <svg className="graph-pulse-icon" viewBox="0 0 64 40" aria-hidden="true">
      <line x1="8" y1="20" x2="26" y2="8" />
      <line x1="8" y1="20" x2="26" y2="32" />
      <line x1="26" y1="8" x2="44" y2="14" />
      <line x1="26" y1="32" x2="44" y2="26" />
      <line x1="44" y1="14" x2="56" y2="20" />
      <line x1="44" y1="26" x2="56" y2="20" />
      <circle cx="8" cy="20" r="4" />
      <circle cx="26" cy="8" r="3" />
      <circle cx="26" cy="32" r="3" />
      <circle cx="44" cy="14" r="3" />
      <circle cx="44" cy="26" r="3" />
      <circle cx="56" cy="20" r="4" />
    </svg>
  )
}

/** Generación (creación/ejecución de un run): forma orbital. */
export function OrbitalIcon() {
  return (
    <span className="orbital-icon" aria-hidden="true">
      <i className="orbit-ring outer"><b /></i>
      <i className="orbit-ring inner"><b /></i>
    </span>
  )
}
