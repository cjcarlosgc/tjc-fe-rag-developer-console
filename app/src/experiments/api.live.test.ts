import { expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { getExperiment, startExperiment } from './api'

test('startExperiment live: envía Idempotency-Key y projectId/targetId', async () => {
  setDataSourceForTests('live')
  const accepted = { experimentId: 'exp-1', projectVersionId: 'v-1', status: 'PENDING', pollAfterMs: 460 }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(accepted), { status: 202 }))

  const result = await startExperiment('p-1', 't-1', 'key-1')

  expect(result).toMatchObject({ experimentId: 'exp-1' })
  expect(fetchMock).toHaveBeenCalledWith(
    expect.stringContaining('/experiments'),
    expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ 'Idempotency-Key': 'key-1' }), body: JSON.stringify({ projectId: 'p-1', targetId: 't-1' }) }),
  )
  setDataSourceForTests(null)
})

test('getExperiment live: no COMPLETED, no pide /results', async () => {
  setDataSourceForTests('live')
  const status = { id: 'exp-1', projectId: 'p-1', projectVersionId: 'v-1', targetId: 't-1', status: 'RUNNING', completedRepetitions: 2, totalRepetitions: 6, failureCode: null, failureMessage: null, startedAt: null, completedAt: null }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(status), { status: 200 }))

  const operation = await getExperiment('exp-1', 'calculateTotal')

  expect(operation.status).toBe('RUNNING')
  expect(operation.progress).toBe(33)
  expect(fetchMock).toHaveBeenCalledTimes(1)
  setDataSourceForTests(null)
})
