/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/*
 * GUARDA ESTÁTICA (WI-CONSOLE-047, corte D; criterio de WI-CONSOLE-006: ≤ 120 ms con reduced motion).
 * Lee los CSS fuente y comprueba que cada bloque `@media (prefers-reduced-motion: reduce)` de motion.css,
 * components.css y trace.css deja animation/transition en `none` o con duraciones ≤ 120 ms.
 * Es verificación ESTÁTICA: no ejecuta la media query. La ejecución real se midió en el navegador
 * (ver harness/reports/wi-console-047-a11y-verification.md).
 */

const MAX_MS = 120
const REDUCED_MEDIA = '@media (prefers-reduced-motion: reduce)'
const MOTION_PROPERTIES = new Set(['animation', 'animation-duration', 'transition', 'transition-duration'])

const readStyle = (relativePath: string) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

// Devuelve el cuerpo (sin llaves externas) de cada bloque @media de reduced motion, con emparejamiento de llaves.
function reducedMotionBodies(css: string): string[] {
  const bodies: string[] = []
  let from = 0
  for (;;) {
    const start = css.indexOf(REDUCED_MEDIA, from)
    if (start === -1) return bodies
    const open = css.indexOf('{', start)
    let depth = 0
    let end = open
    for (let index = open; index < css.length; index += 1) {
      if (css[index] === '{') depth += 1
      if (css[index] === '}') {
        depth -= 1
        if (depth === 0) {
          end = index
          break
        }
      }
    }
    bodies.push(css.slice(open + 1, end))
    from = end + 1
  }
}

interface Declaration {
  selector: string
  property: string
  value: string
}

// Reglas simples dentro de un bloque @media (sin anidamientos adicionales).
function declarationsOf(body: string): Declaration[] {
  const declarations: Declaration[] = []
  const rule = /([^{}]+)\{([^{}]*)\}/g
  for (const match of body.matchAll(rule)) {
    const selector = match[1].trim()
    for (const raw of match[2].split(';')) {
      const colon = raw.indexOf(':')
      if (colon === -1) continue
      const property = raw.slice(0, colon).trim().toLowerCase()
      const value = raw
        .slice(colon + 1)
        .replace(/!important/i, '')
        .trim()
      if (MOTION_PROPERTIES.has(property)) declarations.push({ selector, property, value })
    }
  }
  return declarations
}

// Devuelve el primer motivo de incumplimiento, o null si la declaración cumple ≤ MAX_MS (o `none`).
function violation({ property, value }: Declaration): string | null {
  if (value.toLowerCase() === 'none') return null
  const times = [...value.matchAll(/(-?\d*\.?\d+)(ms|s)\b/g)].map(([, amount, unit]) =>
    unit === 's' ? Number(amount) * 1000 : Number(amount),
  )
  if (times.length === 0) return `${property}: «${value}» sin duración explícita ni none`
  const over = times.find((ms) => ms > MAX_MS)
  return over === undefined ? null : `${property}: «${value}» supera ${MAX_MS} ms`
}

function checkCss(css: string) {
  return reducedMotionBodies(css)
    .flatMap(declarationsOf)
    .map((declaration) => ({ declaration, reason: violation(declaration) }))
}

describe('guarda estática: reduced motion ≤ 120 ms (CSS fuente)', () => {
  const files = ['./motion.css', './components.css', './trace.css']

  it.each(files)('%s tiene al menos un bloque prefers-reduced-motion: reduce', (file) => {
    expect(reducedMotionBodies(readStyle(file)).length).toBeGreaterThan(0)
  })

  it.each(files)('%s: toda animation/transition dentro del bloque reduced motion es none o ≤ 120 ms', (file) => {
    const failures = checkCss(readStyle(file))
      .filter((entry) => entry.reason !== null)
      .map((entry) => `${entry.declaration.selector} → ${entry.reason}`)
    expect(failures).toEqual([])
  })

  it('components.css fija la regla global (*) con animation-duration y transition-duration de 0.01 ms', () => {
    const globalDeclarations = checkCss(readStyle('./components.css')).filter(({ declaration }) => declaration.selector.startsWith('*'))
    const properties = globalDeclarations.map(({ declaration }) => `${declaration.property}=${declaration.value}`)
    expect(properties).toEqual(expect.arrayContaining(['animation-duration=0.01ms', 'transition-duration=0.01ms']))
  })

  it('el propio detector rechaza una duración de 300 ms y acepta none (autocomprobación de la guarda)', () => {
    const css = '@media (prefers-reduced-motion: reduce) { .x { transition-duration: 300ms; } .y { animation: none; } }'
    const reasons = checkCss(css).map((entry) => entry.reason)
    expect(reasons).toEqual(['transition-duration: «300ms» supera 120 ms', null])
  })
})
