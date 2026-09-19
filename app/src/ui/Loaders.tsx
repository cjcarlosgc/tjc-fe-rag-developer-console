import { useLayoutEffect, useRef } from 'react'
import Particles, { ParticlesProvider } from '@tsparticles/react'
import type { Engine, ISourceOptions } from '@tsparticles/engine'

/**
 * Motivos de movimiento Black Glass (spec/transversal/design-system "Movimiento"):
 * ingesta -> constelación discreta, generación -> forma orbital, espera genérica -> nube granular.
 * Inspirados en los GIF de Stitch de referencia, no una incrustación literal de esos archivos.
 */

const ACCENT_RGB = 'rgb(201, 180, 250)'

function canAnimateCanvas(): boolean {
  if (import.meta.env.MODE === 'test') return false
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Ajusta el canvas a su tamaño en pantalla (con devicePixelRatio) y arranca un loop de dibujo; devuelve el cleanup. */
function startCanvasLoop(canvas: HTMLCanvasElement, draw: (ctx: CanvasRenderingContext2D, size: number, elapsedMs: number) => void): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}
  const dpr = window.devicePixelRatio || 1
  const size = canvas.clientWidth
  canvas.width = size * dpr
  canvas.height = size * dpr
  ctx.scale(dpr, dpr)
  const startedAt = performance.now()
  let raf = requestAnimationFrame(function tick(now) {
    draw(ctx, size, now - startedAt)
    raf = requestAnimationFrame(tick)
  })
  return () => cancelAnimationFrame(raf)
}

// --- Espera genérica: nube granular (canvas, shimmer de puntos). ---

interface NoisePoint { x: number; y: number; r: number; seed: number }

function makeDiscPoints(count: number): NoisePoint[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.sqrt(Math.random())
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, r: .5 + Math.random() * .7, seed: Math.random() * 1000 }
  })
}

const granularPoints = makeDiscPoints(36)

function drawGranular(ctx: CanvasRenderingContext2D, size: number, elapsedMs: number) {
  ctx.clearRect(0, 0, size, size)
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2
  for (const point of granularPoints) {
    const flicker = Math.sin(elapsedMs / 220 + point.seed) * .5 + .5
    if (flicker < .3) continue
    ctx.globalAlpha = .2 + flicker * .75
    ctx.fillStyle = ACCENT_RGB
    ctx.beginPath()
    ctx.arc(cx + point.x * radius, cy + point.y * radius, point.r, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Espera genérica: nube granular (dispersión de puntos con shimmer, como transicion_3.gif). */
export function Spinner() {
  const canAnimate = canAnimateCanvas()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canAnimate) return
    return startCanvasLoop(canvas, drawGranular)
  }, [canAnimate])

  return (
    <span className="spinner" aria-hidden="true">
      {canAnimate ? <canvas ref={canvasRef} /> : <><i /><i /><i /><i /><i /></>}
    </span>
  )
}

// --- Ingesta: constelación discreta (tsParticles, roja). ---

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
    opacity: { value: { min: .35, max: 1 } },
    move: { enable: true, speed: .5, random: true, outModes: { default: 'bounce' } },
    links: { enable: true, color: '#7a1414', distance: 40, opacity: .55, width: 1 },
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

// --- Generación: forma orbital (canvas, esfera de puntos rotando). ---

interface SpherePoint { x: number; y: number; z: number }

function makeFibonacciSphere(count: number): SpherePoint[] {
  const golden = Math.PI * (3 - Math.sqrt(5))
  return Array.from({ length: count }, (_, i) => {
    const y = 1 - (i / (count - 1)) * 2
    const r = Math.sqrt(Math.max(0, 1 - y * y))
    const theta = golden * i
    return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r }
  })
}

const orbitalSpherePoints = makeFibonacciSphere(60)
const ORBITAL_PERIOD_MS = 4500

function drawOrbitalSphere(ctx: CanvasRenderingContext2D, size: number, elapsedMs: number) {
  ctx.clearRect(0, 0, size, size)
  const cx = size / 2
  const cy = size / 2
  const radius = size * .42
  const angle = (elapsedMs / ORBITAL_PERIOD_MS) * Math.PI * 2
  const cosA = Math.cos(angle)
  const sinA = Math.sin(angle)
  const projected = orbitalSpherePoints
    .map(({ x, y, z }) => {
      const rx = x * cosA - z * sinA
      const rz = x * sinA + z * cosA
      return { sx: cx + rx * radius, sy: cy + y * radius, depth: (rz + 1) / 2 }
    })
    .sort((a, b) => a.depth - b.depth)
  for (const point of projected) {
    ctx.globalAlpha = .25 + point.depth * .65
    ctx.fillStyle = ACCENT_RGB
    ctx.beginPath()
    ctx.arc(point.sx, point.sy, .5 + point.depth * 1.1, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Generación (creación/ejecución de un run): forma orbital (esfera de puntos rotando, como transicio_2.gif). */
export function OrbitalIcon() {
  const canAnimate = canAnimateCanvas()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !canAnimate) return
    return startCanvasLoop(canvas, drawOrbitalSphere)
  }, [canAnimate])

  return (
    <span className="orbital-icon" aria-hidden="true">
      {canAnimate ? <canvas ref={canvasRef} /> : <><i className="orbit-ring outer"><b /></i><i className="orbit-ring inner"><b /></i></>}
    </span>
  )
}
