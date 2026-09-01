import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'
import { renderApp } from '../test/render'
import { AnalysisProgress } from './AnalysisProgress'

test('consulta y presenta el resumen al completar la ProjectVersion', async () => {
  const status = {
    id: 'v-1',
    projectId: 'p-1',
    status: 'COMPLETED',
    originalFileName: 'project.zip',
    sizeBytes: 1200,
    filesProcessed: 12,
    chunksCount: 31,
    failureReason: null,
    startedAt: '2026-08-31T10:00:00.000Z',
    completedAt: '2026-08-31T10:01:00.000Z',
    createdAt: '2026-08-31T10:00:00.000Z',
    updatedAt: '2026-08-31T10:01:00.000Z',
  }
  const result = {
    id: 'v-1',
    projectId: 'p-1',
    status: 'COMPLETED',
    filesProcessed: 12,
    chunksCount: 31,
    detectedFramework: 'VITEST',
    targetsTotal: 8,
    targetsWithTest: 5,
    targetsMissingTest: 3,
    completedAt: '2026-08-31T10:01:00.000Z',
  }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    return new Response(JSON.stringify(url.endsWith('/results') ? result : status), { status: 200 })
  })

  renderApp(<AnalysisProgress projectVersionId="v-1" initialPollAfterMs={800} />)

  expect(await screen.findByText('Resumen de ProjectVersion')).toBeInTheDocument()
  expect(screen.getByText('VITEST')).toBeInTheDocument()
  expect(screen.getByText('31')).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/project-versions/v-1/results'), expect.any(Object))
})

test('muestra el failureReason confirmado por RAG Core', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
    id: 'v-1',
    projectId: 'p-1',
    status: 'FAILED',
    originalFileName: 'project.zip',
    sizeBytes: 1200,
    filesProcessed: null,
    chunksCount: null,
    failureReason: 'No fue posible generar embeddings.',
    startedAt: null,
    completedAt: null,
    createdAt: '2026-08-31T10:00:00.000Z',
    updatedAt: '2026-08-31T10:01:00.000Z',
  }), { status: 200 }))

  renderApp(<AnalysisProgress projectVersionId="v-1" initialPollAfterMs={800} />)

  expect(await screen.findByRole('alert')).toHaveTextContent('No fue posible generar embeddings.')
})
