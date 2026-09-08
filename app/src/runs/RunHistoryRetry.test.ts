import { expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { ApiError } from '../api/client'
import { startGeneration } from '../generation/api'
import { getRun, listTestRunHistory, retryTarget } from './api'
import { isTerminalRunStatus } from './types'

test('el historial de la ProjectVersion semilla trae el run precargado', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const fetchMock = vi.spyOn(globalThis, 'fetch')

  const page = await listTestRunHistory('ver_checkout_7')

  expect(page.items).toHaveLength(1)
  expect(page.items[0]).toMatchObject({ id: 'run_checkout_seed', mode: 'PROJECT_MISSING', status: 'PARTIAL', totalTargets: 2, validTargets: 1, invalidTargets: 1, failedTargets: 0 })
  expect(fetchMock).not.toHaveBeenCalled()
})

test('el historial ordena los runs por createdAt descendente', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()

  const accepted = await startGeneration({ projectId: 'prj_checkout_demo', mode: 'PROJECT_MISSING' }, crypto.randomUUID())
  const page = await listTestRunHistory('ver_checkout_7')

  expect(page.items.map((item) => item.id)).toEqual([accepted.runId, 'run_checkout_seed'])
  expect(page.nextCursor).toBeNull()
})

test('rechaza el historial de una ProjectVersion inexistente', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()

  await expect(listTestRunHistory('ver_nope')).rejects.toMatchObject({ code: 'PROJECT_VERSION_NOT_FOUND' })
})

test('HU24: reintenta un target inválido de un run terminal hasta que queda válido', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()

  const accepted = await retryTarget('run_checkout_seed', 'ver_checkout_7-class-coupon', crypto.randomUUID())
  expect(accepted).toMatchObject({ testRunId: 'run_checkout_seed', targetId: 'ver_checkout_7-class-coupon', status: 'PENDING' })

  let run = await getRun('run_checkout_seed')
  expect(run.status).toBe('GENERATING')
  for (let index = 0; index < 4 && !isTerminalRunStatus(run.status); index += 1) run = await getRun('run_checkout_seed')

  expect(run.status).toBe('COMPLETED')
  const retried = run.targets.find((target) => target.id === 'ver_checkout_7-class-coupon')
  expect(retried).toMatchObject({ status: 'VALID', valid: true })
  const untouched = run.targets.find((target) => target.id === 'ver_checkout_7-method-total')
  expect(untouched).toMatchObject({ status: 'VALID', valid: true })
})

test('HU24: rechaza reintentar un target que no está inválido/fallido', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()

  await expect(retryTarget('run_checkout_seed', 'ver_checkout_7-method-total', crypto.randomUUID()))
    .rejects.toMatchObject({ code: 'TARGET_RETRY_NOT_ALLOWED' })
})

test('HU24: rechaza reintentar mientras el run no llegó a un estado terminal', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const accepted = await startGeneration({ projectId: 'prj_checkout_demo', mode: 'PROJECT_MISSING' }, crypto.randomUUID())

  const error: unknown = await retryTarget(accepted.runId, 'any-target', crypto.randomUUID()).catch((thrown: unknown) => thrown)
  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).code).toBe('TEST_RUN_NOT_FINISHED')
})
