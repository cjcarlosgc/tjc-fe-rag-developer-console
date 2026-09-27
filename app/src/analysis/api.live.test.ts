import { expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import type { ProjectVersionSummaryResponse } from '../projects/types'
import { listAnalysisHistory } from './api'

test('listAnalysisHistory live: pide GET /projects/{id}/versions y mapea Page<ProjectVersionSummaryResponse>', async () => {
  setDataSourceForTests('live')
  const page: { items: ProjectVersionSummaryResponse[]; nextCursor: string | null } = {
    items: [
      {
        id: 'ver-1', projectId: 'p-1', status: 'COMPLETED', originalFileName: null, sizeBytes: 1024,
        filesProcessed: 10, chunksCount: 40, failureReason: null, startedAt: '2026-09-01T00:00:00.000Z',
        completedAt: '2026-09-01T00:05:00.000Z', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:05:00.000Z',
        language: 'TYPESCRIPT', detectedFramework: 'VITEST', targetsTotal: 5, targetsWithTest: 3, targetsMissingTest: 2, current: true,
      },
    ],
    nextCursor: null,
  }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(page), { status: 200 }))

  const items = await listAnalysisHistory('p-1')

  expect(items).toEqual([
    { id: 'ver-1', projectId: 'p-1', status: 'COMPLETED', language: 'TYPESCRIPT', originalFileName: null, filesProcessed: 10, chunksCount: 40, detectedFramework: 'VITEST', targetsTotal: 5, targetsWithTest: 3, targetsMissingTest: 2, createdAt: '2026-09-01T00:00:00.000Z', completedAt: '2026-09-01T00:05:00.000Z', current: true },
  ])
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/projects/p-1/versions'), expect.anything())
})

test('mapea PHP/PHPUNIT como lenguaje y framework detectados en el historial', async () => {
  setDataSourceForTests('live')
  const page: { items: ProjectVersionSummaryResponse[]; nextCursor: string | null } = {
    items: [{
      id: 'ver-php', projectId: 'p-1', status: 'COMPLETED', language: 'PHP', originalFileName: null,
      sizeBytes: 1024, filesProcessed: 8, chunksCount: 20, failureReason: null,
      startedAt: '2026-09-02T00:00:00.000Z', completedAt: '2026-09-02T00:01:00.000Z',
      createdAt: '2026-09-02T00:00:00.000Z', updatedAt: '2026-09-02T00:01:00.000Z',
      detectedFramework: 'PHPUNIT', targetsTotal: 2, targetsWithTest: 1, targetsMissingTest: 1, current: true,
    }],
    nextCursor: null,
  }
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(page), { status: 200 }))

  await expect(listAnalysisHistory('p-1')).resolves.toMatchObject([
    { id: 'ver-php', language: 'PHP', detectedFramework: 'PHPUNIT' },
  ])
})
