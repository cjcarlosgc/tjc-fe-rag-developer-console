import { describe, expect, it } from 'vitest'
import { documentTitleFor } from './routeTitles'

describe('documentTitleFor', () => {
  it.each([
    ['/', 'Projects · RAG Test Studio'],
    ['/analysis-runs', 'Runs · RAG Test Studio'],
    ['/projects/prj_1/runs/arun_9', 'Detalle del Run · RAG Test Studio'],
    ['/projects/prj_1/versions/v1/inventory', 'Inventario · RAG Test Studio'],
    ['/projects/prj_1/', 'Project · RAG Test Studio'],
    // WI-CONSOLE-047 (ciclo 2, H4): el título de Focus Mode usa el término del glosario, igual que el rótulo visible.
    ['/action-required/arun_9', 'Focus Mode · RAG Test Studio'],
    ['/projects/prj_1/runs/arun_9/retrieval-comparison', 'Comparación de recuperación · RAG Test Studio'],
    ['/ruta/que/no/existe', 'RAG Test Studio'],
  ])('%s → %s', (pathname, title) => {
    expect(documentTitleFor(pathname)).toBe(title)
  })
})
