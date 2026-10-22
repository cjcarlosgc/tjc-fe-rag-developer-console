/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * GUARDA DE GLOSARIO (WI-CONSOLE-047, corte B · observación 3).
 * Escaneo estático del código fuente de la app (sin pruebas): protege el texto visible en español y los términos de dominio
 * de `spec/transversal/design-system/spec.md` («Idioma y glosario de la interfaz»). No sustituye la revisión visual (ux-reviewer).
 */

// Vitest se ejecuta desde app/ (cwd del paquete); no se usa import.meta.url porque en jsdom no es file://.
const SRC_DIR = join(process.cwd(), 'src')

// Rótulos en inglés que no deben aparecer como texto visible ni como valor de UI (encadenados entre comillas, `>` o `<`).
const FORBIDDEN_VISIBLE: Array<{ term: string; pattern: RegExp }> = [
  { term: 'CONNECTED / NOT CONNECTED', pattern: /\b(NOT )?CONNECTED\b/ },
  { term: 'Integration branch', pattern: /Integration branch/ },
  { term: 'Active PRs / ACTIVE PRS', pattern: /Active PRs|ACTIVE PRS/ },
  { term: 'Latest:', pattern: /Latest:/ },
  { term: 'Overview (pestaña o encabezado)', pattern: /(['">])Overview(['"<:])/ },
  { term: 'Integrations (pestaña o breadcrumb)', pattern: /(['">])Integrations( \/|['"<])/ },
  { term: 'Trace operativo', pattern: /[Tt]race operativo/ },
  { term: 'Proyectos (plural)', pattern: /Proyectos/ },
  { term: 'Control plane (visible)', pattern: /Control plane/ },
  { term: 'Target (visible)', pattern: /(['">])Target(['"<:\s])/ },
  { term: 'Changeset (visible)', pattern: /(['">])Changeset(['"<\s])/ },
  { term: 'Freshness / Outcome / Scope (visible)', pattern: /(['">])(Freshness|Outcome|Scope)(['"<])/ },
  { term: 'Failure type', pattern: /Failure type/ },
  { term: 'Capture next PR', pattern: /Capture next PR/ },
  { term: 'Sin test / Con test', pattern: /(['">])(Sin|Con) test(['"<])/ },
  { term: 'LIVE · CORE API', pattern: /LIVE · CORE API/ },
]

// Términos de dominio que deben seguir en inglés (glosario), y rótulos en español que deben existir.
const MUST_CONTAIN = [
  'Action Required',
  'Focus Mode',
  'Repository binding',
  'Workspace',
  'Rama de integración',
  'PR activos',
  'Resumen',
  'EN VIVO · CORE API',
]

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      if (name !== 'generated' && name !== 'speculative' && name !== 'node_modules') sourceFiles(path, out)
    } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.(ts|tsx)$/.test(name)) {
      out.push(path)
    }
  }
  return out
}

describe('glosario de la interfaz (WI-CONSOLE-047, observación 3)', () => {
  const files = sourceFiles(SRC_DIR)

  it('no hay rótulos en inglés fuera del glosario en el código visible de la app', () => {
    const hits: string[] = []
    for (const file of files) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, index) => {
          const code = line.trim()
          if (code.startsWith('//') || code.startsWith('*') || code.startsWith('/*')) return
          for (const { term, pattern } of FORBIDDEN_VISIBLE) {
            if (pattern.test(line)) hits.push(`${relative(SRC_DIR, file)}:${index + 1} → ${term}`)
          }
        })
    }
    expect(hits).toEqual([])
  })

  it('los términos de dominio y los rótulos traducidos del corte B siguen presentes en el código', () => {
    const all = files.map((file) => readFileSync(file, 'utf8')).join('\n')
    for (const term of MUST_CONTAIN) expect(all).toContain(term)
  })
})
