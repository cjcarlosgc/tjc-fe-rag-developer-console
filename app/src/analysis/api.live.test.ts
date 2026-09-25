import { expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { listAnalysisHistory } from './api'

test('listAnalysisHistory live: pide GET /projects/{id}/versions y mapea Page<ProjectVersionSummaryResponse>', async () => {
  setDataSourceForTests('live')
  const page = {
    items: [
      {
        id: 'ver-1', projectId: 'p-1', status: 'COMPLETED', originalFileName: null, sizeBytes: 1024,
        filesProcessed: 10, chunksCount: 40, failureReason: null, startedAt: '2026-09-01T00:00:00.000Z',
        completedAt: '2026-09-01T00:05:00.000Z', createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:05:00.000Z',
        detectedFramework: 'VITEST', targetsTotal: 5, targetsWithTest: 3, targetsMissingTest: 2, current: true,
      },
    ],
    nextCursor: null,
  }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(page), { status: 200 }))

  const items = await listAnalysisHistory('p-1')

  expect(items).toEqual([
    { id: 'ver-1', projectId: 'p-1', status: 'COMPLETED', originalFileName: null, filesProcessed: 10, chunksCount: 40, detectedFramework: 'VITEST', targetsTotal: 5, targetsWithTest: 3, targetsMissingTest: 2, createdAt: '2026-09-01T00:00:00.000Z', completedAt: '2026-09-01T00:05:00.000Z', current: true },
  ])
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/projects/p-1/versions'), expect.anything())
})
