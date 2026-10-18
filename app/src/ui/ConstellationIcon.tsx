import Particles, { ParticlesProvider } from '@tsparticles/react'
import type { Engine, ISourceOptions } from '@tsparticles/engine'
import { canAnimateCanvas } from './canAnimateCanvas'

// Ícono de ingesta aparte de `Loaders.tsx`: así `@tsparticles` solo entra al bundle de quien lo use, y no de todas las
// páginas que muestran un `Spinner`.

/** Fallback estático (sin animar) de la constelación: reduced-motion, entorno de test, o mientras carga el motor de partículas. */
function StaticConstellationIcon() {
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

const constellationOptions: ISourceOptions = {
  fullScreen: { enable: false },
  background: { color: { value: 'transparent' } },
  fpsLimit: 30,
  particles: {
    number: { value: 16 },
    color: { value: '#ff2b2b' },
    size: { value: { min: 1, max: 2.4 } },
    opacity: { value: { min: 0.35, max: 1 } },
    move: { enable: true, speed: 0.5, random: true, outModes: { default: 'bounce' } },
    links: { enable: true, color: '#7a1414', distance: 40, opacity: 0.55, width: 1 },
  },
  detectRetina: true,
}

/** Registra solo el motor "slim" (con soporte de links entre partículas), cargado dinámicamente. Debe ser una referencia estable: @tsparticles/react exige el mismo callback en cada render. */
async function registerConstellationEngine(engine: Engine): Promise<void> {
  const { loadSlim } = await import('@tsparticles/slim')
  await loadSlim(engine)
}

/**
 * Ingesta (análisis/indexación de una ProjectVersion): constelación discreta, roja
 * como en la referencia de Stitch (excepción documentada al rojo=error del design-system:
 * aquí es decorativo, no un estado, y no se reutiliza en ningún otro lugar de la app).
 * El motor de partículas (tsParticles) se importa dinámicamente solo al montar este ícono.
 */
export function ConstellationIcon() {
  if (!canAnimateCanvas()) return <StaticConstellationIcon />
  return (
    <span className="constellation-icon" aria-hidden="true">
      <ParticlesProvider init={registerConstellationEngine}>
        <Particles id="ingesta-constellation" className="constellation-icon" options={constellationOptions} />
      </ParticlesProvider>
    </span>
  )
}
