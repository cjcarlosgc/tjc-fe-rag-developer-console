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
  { term: 'Freshness / Outcome / Scope (visible)', pattern: /(['">])(Freshness|Outcome|Scope)(['"<])/ },
  { term: 'Failure type', pattern: /Failure type/ },
  { term: 'Capture next PR', pattern: /Capture next PR/ },
  { term: 'Sin test / Con test', pattern: /(['">])(Sin|Con) test(['"<])/ },
  { term: 'LIVE · CORE API', pattern: /LIVE · CORE API/ },
  // WI-CONSOLE-047 (ciclo 2, H3): residuos en inglés del demo y de los rótulos fuera del glosario.
  { term: 'Analysis Run (debe ser AnalysisRun)', pattern: /Analysis Runs?\b/ },
  { term: 'Run comparison', pattern: /Run comparison/ },
  { term: 'Retrieval (visible)', pattern: /[Cc]omparaci[oó]n de retrieval|[Cc]omparar retrieval|^\s*Retrieval\b|>Retrieval</ },
  { term: 'MINI DIFF (visible)', pattern: /MINI DIFF/ },
  { term: 'Buscar objetivo (usar Buscar target)', pattern: /Buscar objetivo/ },
  { term: 'Conjunto de cambios (usar Changeset)', pattern: /Conjunto de cambios/ },
  { term: 'Fragmentos (usar Chunks)', pattern: />Fragmentos</ },
  { term: 'N fragmentos (usar N chunks)', pattern: /\d+ fragmentos|\} fragmentos/ },
  { term: 'Objetivo experimental (usar Target experimental)', pattern: /Objetivo experimental/ },
  { term: 'Conocimiento funcional (usar Functional Knowledge)', pattern: /[Cc]onocimiento funcional/ },
  { term: 'DEMO TIMELINE', pattern: /DEMO TIMELINE/ },
  { term: 'Behavioral Mismatch (visible)', pattern: /Behavioral Mismatch/ },
  { term: 'sólo (usar solo)', pattern: /\bsólo\b/ },
  { term: 'Active / Superseded (filtro)', pattern: /label: '(Active|Superseded)'/ },
]

// Términos de dominio que deben seguir en inglés (glosario), y rótulos en español que deben existir.
const MUST_CONTAIN = [
  'Comparar recuperación SE vs SEM',
  'Buscar target',
  'Changeset',
  'Chunks',
  'Target experimental',
  'Functional Knowledge',
  'Detalle del target',
  'Discrepancia de comportamiento',
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

  it('los textos en inglés del corte WI-CONSOLE-049 están en los archivos concretos', () => {
    const read = (rel: string) => readFileSync(join(SRC_DIR, rel), 'utf8')
    expect(read('inventory/InventoryView.tsx')).toContain('Buscar target')
    expect(read('control-plane/OperationalTraceSection.tsx')).toContain('<h3>Changeset</h3>')
    expect(read('experiments/ExperimentPage.tsx')).toContain('Target experimental</label>')
    expect(read('experiments/ExperimentComparison.tsx')).toContain('chunks</dd>')
  })
})
