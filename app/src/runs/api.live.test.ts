import { expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { getRun } from './api'

test('getRun live: no terminal, solo consulta status y no pide /results', async () => {
  setDataSourceForTests('live')
  const status = { id: 'run-1', projectId: 'p-1', projectVersionId: 'v-1', mode: 'PROJECT_ALL', status: 'PROCESSING_TARGETS', totalTargets: 2, processedTargets: 1, validTargets: 0, invalidTargets: 0, failedTargets: 0, reason: null, failureCode: null, failureMessage: null, startedAt: null, completedAt: null, createdAt: '2026-09-07T00:00:00.000Z', updatedAt: '2026-09-07T00:00:00.000Z' }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(status), { status: 200 }))

  const run = await getRun('run-1')

  expect(run.status).toBe('GENERATING')
  expect(run.targets).toEqual([])
  expect(fetchMock).toHaveBeenCalledTimes(1)
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/test-runs/run-1'), expect.anything())
  setDataSourceForTests(null)
})

test('getRun live: terminal, combina status + results', async () => {
  setDataSourceForTests('live')
  const status = { id: 'run-1', projectId: 'p-1', projectVersionId: 'v-1', mode: 'PROJECT_ALL', status: 'COMPLETED', totalTargets: 1, processedTargets: 1, validTargets: 1, invalidTargets: 0, failedTargets: 0, reason: null, failureCode: null, failureMessage: null, startedAt: null, completedAt: '2026-09-07T00:00:05.000Z', createdAt: '2026-09-07T00:00:00.000Z', updatedAt: '2026-09-07T00:00:05.000Z' }
  const results = {
    id: 'run-1', status: 'COMPLETED', totalTargets: 1, validTargets: 1, invalidTargets: 0, failedTargets: 0, completedAt: '2026-09-07T00:00:05.000Z',
    targets: [{ targetId: 't-1', filePath: 'src/a.ts', symbolName: 'a', methodName: null, targetType: 'FUNCTION', status: 'VALID', artifactIds: [], validation: { compiled: true, executed: true, passed: true, valid: true, failureType: 'NONE', errorSummary: null, evidenceIds: [] } }],
  }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    return new Response(JSON.stringify(url.includes('/results') ? results : status), { status: 200 })
  })

  const run = await getRun('run-1')

  expect(run.status).toBe('COMPLETED')
  expect(run.targets).toHaveLength(1)
  expect(fetchMock).toHaveBeenCalledTimes(2)
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/test-runs/run-1/results'), expect.anything())
  setDataSourceForTests(null)
})
