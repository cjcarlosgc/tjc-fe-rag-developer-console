import { useLayoutEffect, useRef } from 'react'

/**
 * Motivos de movimiento Black Glass (spec/transversal/design-system "Movimiento"):
 * ingesta -> constelación discreta, generación -> forma orbital, espera genérica -> nube granular.
 * Inspirados en los GIF de Stitch de referencia, no una incrustación literal de esos archivos.
 */

import { canAnimateCanvas } from './canAnimateCanvas'

const ACCENT_RGB = 'rgb(201, 180, 250)'

/** Ajusta el canvas a su tamaño en pantalla (con devicePixelRatio) y arranca un loop de dibujo; devuelve el cleanup. */
function startCanvasLoop(
  canvas: HTMLCanvasElement,
  draw: (ctx: CanvasRenderingContext2D, size: number, elapsedMs: number) => void,
): () => void {
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

interface NoisePoint {
  x: number
  y: number
  r: number
  seed: number
}

function makeDiscPoints(count: number): NoisePoint[] {
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const radius = Math.sqrt(Math.random())
    return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius, r: 0.5 + Math.random() * 0.7, seed: Math.random() * 1000 }
  })
}

const granularPoints = makeDiscPoints(36)

function drawGranular(ctx: CanvasRenderingContext2D, size: number, elapsedMs: number) {
  ctx.clearRect(0, 0, size, size)
  const cx = size / 2
  const cy = size / 2
  const radius = size / 2
  for (const point of granularPoints) {
    const flicker = Math.sin(elapsedMs / 220 + point.seed) * 0.5 + 0.5
    if (flicker < 0.3) continue
    ctx.globalAlpha = 0.2 + flicker * 0.75
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
      {canAnimate ? (
        <canvas ref={canvasRef} />
      ) : (
        <>
          <i />
          <i />
          <i />
          <i />
          <i />
        </>
      )}
    </span>
  )
}

// --- Generación: forma orbital (canvas, esfera de puntos rotando). ---

interface SpherePoint {
  x: number
  y: number
  z: number
}

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
  const radius = size * 0.42
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
    ctx.globalAlpha = 0.25 + point.depth * 0.65
    ctx.fillStyle = ACCENT_RGB
    ctx.beginPath()
    ctx.arc(point.sx, point.sy, 0.5 + point.depth * 1.1, 0, Math.PI * 2)
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
      {canAnimate ? (
        <canvas ref={canvasRef} />
      ) : (
        <>
          <i className="orbit-ring outer">
            <b />
          </i>
          <i className="orbit-ring inner">
            <b />
          </i>
        </>
      )}
    </span>
  )
}
