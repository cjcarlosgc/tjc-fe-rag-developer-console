/// <reference types="node" />
import { readFileSync } from 'node:fs'
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
})
