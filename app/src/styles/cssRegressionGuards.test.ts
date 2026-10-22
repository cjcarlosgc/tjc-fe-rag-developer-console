/// <reference types="node" />
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/*
 * GUARDA DÉBIL (WI-CONSOLE-047, corte A).
 * jsdom no calcula layout: estas pruebas solo comprueban que la declaración CSS
 * fuente existe en el bloque del selector. La medición real (getBoundingClientRect,
 * scrollWidth a 375 y 1280 px) se hizo en el navegador y está en
 * harness/reports/wi-console-047-implementation.md. No sustituyen esa evidencia.
 */

const readStyle = (relativePath: string) => readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')

// Devuelve el cuerpo del primer bloque cuyo selector es exactamente `selector {`.
const ruleBody = (css: string, selector: string): string => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = new RegExp(`(?:^|\\n)${escaped} \\{([^}]*)\\}`).exec(css)
  return match ? match[1] : ''
}

describe('guarda débil: objetivos táctiles mínimos (CSS fuente)', () => {
  const baseCss = readStyle('./base.css')
  const actionRequiredCss = readStyle('./action-required.css')

  it('.brand declara min-height: var(--target-min)', () => {
    expect(ruleBody(baseCss, '.brand')).toContain('min-height: var(--target-min)')
  })

  it('.skip-link declara min-height: var(--target-min)', () => {
    expect(ruleBody(baseCss, '.skip-link')).toContain('min-height: var(--target-min)')
  })

  it('.project-tabs a declara min-height: var(--target-min)', () => {
    expect(ruleBody(actionRequiredCss, '.project-tabs a')).toContain('min-height: var(--target-min)')
  })
})

describe('guarda débil: Focus Mode sin desbordamiento por texto largo (CSS fuente)', () => {
  const actionRequiredCss = readStyle('./action-required.css')

  it('.focus-mode-card h2 parte tokens largos con overflow-wrap: anywhere', () => {
    expect(ruleBody(actionRequiredCss, '.focus-mode-card h2')).toContain('overflow-wrap: anywhere')
  })

  it('.action-required-list usa una pista minmax(0, 1fr) para no desbordar a 320 CSS px (corte D)', () => {
    expect(ruleBody(actionRequiredCss, '.action-required-list')).toContain('grid-template-columns: minmax(0, 1fr)')
  })

  it('.pr-ref parte el qualifiedName largo y puede encogerse en flex (320 CSS px, corte D)', () => {
    const body = ruleBody(actionRequiredCss, '.pr-ref')
    expect(body).toContain('overflow-wrap: anywhere')
    expect(body).toContain('min-width: 0')
  })
})

describe('guarda débil: detalle de Run sin desbordamiento por símbolos y títulos largos (CSS fuente, ciclo 2)', () => {
  const baseCss = readStyle('./base.css')
  const traceCss = readStyle('./trace.css')
  const actionRequiredCss = readStyle('./action-required.css')

  it('.operational-trace h3 code (objetivo con ShippingAddressValidator.validate) parte tokens largos y puede encogerse', () => {
    const body = ruleBody(traceCss, '.operational-trace h3 code')
    expect(body).toContain('overflow-wrap: anywhere')
    expect(body).toContain('min-width: 0')
  })

  it('h1 (título de Run con DiscountEngine.applyDiscount) parte tokens largos con overflow-wrap: anywhere', () => {
    expect(ruleBody(baseCss, 'h1')).toContain('overflow-wrap: anywhere')
  })

  it('.symbol-list code parte el símbolo cambiado con overflow-wrap: anywhere', () => {
    const body = ruleBody(actionRequiredCss, '.symbol-list code')
    expect(body).toContain('overflow-wrap: anywhere')
    expect(body).toContain('min-width: 0')
  })
})

/*
 * GUARDA DÉBIL (WI-CONSOLE-050).
 * El .visually-hidden es position: absolute. Dentro de una tabla sin ancestro posicionado
 * escapa de .table-frame (overflow-x: auto) y provoca scroll horizontal del documento.
 * jsdom no mide layout: estas pruebas solo comprueban declaraciones CSS y una
 * comprobación estática de los .tsx. La evidencia de layout va en
 * harness/reports/wi-console-050-implementation.md.
 */

// Excepciones explícitas: ficheros con visually-hidden dentro de th/td que no usan table-frame. Debe estar vacía.
const VISUALLY_HIDDEN_CELL_EXCEPTIONS: readonly string[] = []

const listTsxFiles = (dirRelativePath: string): string[] => {
  const root = fileURLToPath(new URL(dirRelativePath, import.meta.url))
  const out: string[] = []
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.name.endsWith('.tsx') && !/\.test\.tsx$/.test(entry.name)) out.push(full)
    }
  }
  walk(root)
  return out
}

describe('guarda débil: tablas con visually-hidden dentro de .table-frame (WI-CONSOLE-050, CSS fuente)', () => {
  const componentsCss = readStyle('./components.css')

  it('.table-frame declara position: relative (ancestro posicionado) y conserva overflow-x: auto', () => {
    const body = ruleBody(componentsCss, '.table-frame')
    expect(body).toContain('position: relative')
    expect(body).toContain('overflow-x: auto')
  })

  it('.visually-hidden sigue siendo position: absolute', () => {
    expect(ruleBody(componentsCss, '.visually-hidden')).toContain('position: absolute')
  })

  it('todo .tsx de app/src con visually-hidden dentro de th/td usa table-frame (o está en la lista de excepciones vacía)', () => {
    const srcDir = '../'
    const offenders: string[] = []
    const cellWithHidden = /<(th|td)\b[\s\S]*?visually-hidden[\s\S]*?<\/\1>/
    for (const file of listTsxFiles(srcDir)) {
      const source = readFileSync(file, 'utf8')
      if (!cellWithHidden.test(source)) continue
      const relative = file.slice(file.indexOf('/src/') + 1)
      if (VISUALLY_HIDDEN_CELL_EXCEPTIONS.includes(relative)) continue
      if (!source.includes('table-frame')) offenders.push(relative)
    }
    expect(offenders).toEqual([])
  })

  it('ExperimentComparison.tsx envuelve su tabla en table-frame y tiene visually-hidden dentro de th', () => {
    const source = readStyle('../experiments/ExperimentComparison.tsx')
    expect(source).toContain('className="table-frame"')
    expect(source).toMatch(/<th\b[\s\S]*?visually-hidden[\s\S]*?<\/th>/)
  })
})
