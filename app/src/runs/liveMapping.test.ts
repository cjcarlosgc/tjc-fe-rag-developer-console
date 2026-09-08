import { expect, test } from 'vitest'
import { toRunViewModel, type TestRunResultsResponse, type TestRunStatusResponse } from './liveMapping'

const baseStatus: TestRunStatusResponse = {
  id: 'run-1',
  projectId: 'project-1',
  projectVersionId: 'version-1',
  mode: 'PROJECT_ALL',
  status: 'PROCESSING_TARGETS',
  totalTargets: 2,
  processedTargets: 1,
  validTargets: 0,
  invalidTargets: 0,
  failedTargets: 0,
  reason: null,
  failureCode: null,
  failureMessage: null,
  startedAt: '2026-09-07T00:00:00.000Z',
  completedAt: null,
  createdAt: '2026-09-07T00:00:00.000Z',
  updatedAt: '2026-09-07T00:00:01.000Z',
}

test('mapea los estados granulares de Core a la vista simplificada del run', () => {
  expect(toRunViewModel({ ...baseStatus, status: 'PENDING' }, null).status).toBe('PENDING')
  expect(toRunViewModel({ ...baseStatus, status: 'RESOLVING_TARGETS' }, null).status).toBe('GENERATING')
  expect(toRunViewModel({ ...baseStatus, status: 'PROCESSING_TARGETS' }, null).status).toBe('GENERATING')
  expect(toRunViewModel({ ...baseStatus, status: 'BATCH_VALIDATING' }, null).status).toBe('VALIDATING')
  expect(toRunViewModel({ ...baseStatus, status: 'FINALIZING' }, null).status).toBe('VALIDATING')
})

test('sin resultados todavía (no terminal), targets queda vacío y no hay failureMessage', () => {
  const view = toRunViewModel(baseStatus, null)
  expect(view.targets).toEqual([])
  expect(view.failureMessage).toBeUndefined()
  expect(view.processed).toBe(1)
  expect(view.total).toBe(2)
})

test('en terminal, combina status + results y mapea cada target', () => {
  const status: TestRunStatusResponse = { ...baseStatus, status: 'PARTIAL', processedTargets: 2, completedAt: '2026-09-07T00:00:05.000Z' }
  const results: TestRunResultsResponse = {
    id: 'run-1',
    status: 'PARTIAL',
    totalTargets: 2,
    validTargets: 1,
    invalidTargets: 1,
    failedTargets: 0,
    completedAt: '2026-09-07T00:00:05.000Z',
    targets: [
      { targetId: 't-1', filePath: 'src/a.ts', symbolName: 'a', methodName: null, targetType: 'FUNCTION', status: 'VALID', artifactIds: ['art-1'], validation: { compiled: true, executed: true, passed: true, valid: true, failureType: 'NONE', errorSummary: null, evidenceIds: [] } },
      { targetId: 't-2', filePath: 'src/b.ts', symbolName: 'b', methodName: 'run', targetType: 'METHOD', status: 'INVALID', artifactIds: [], validation: { compiled: true, executed: true, passed: false, valid: false, failureType: 'TEST_ASSERTION', errorSummary: 'expected 1 to be 2', evidenceIds: [] } },
    ],
  }

  const view = toRunViewModel(status, results)

  expect(view.status).toBe('PARTIAL')
  expect(view.targets).toHaveLength(2)
  expect(view.targets[0]).toMatchObject({ id: 't-1', label: 'a', status: 'VALID', valid: true })
  expect(view.targets[1]).toMatchObject({ id: 't-2', label: 'run', status: 'INVALID', valid: false, errorSummary: 'expected 1 to be 2' })
  expect(view.failureMessage).toBeUndefined()
})

test('un run que falla antes de resolver targets expone failureMessage', () => {
  const status: TestRunStatusResponse = { ...baseStatus, status: 'FAILED', failureCode: 'GENERATION_FAILED', failureMessage: 'No se pudo descargar el snapshot.' }
  const results: TestRunResultsResponse = { id: 'run-1', status: 'FAILED', totalTargets: 2, validTargets: 0, invalidTargets: 0, failedTargets: 0, completedAt: '2026-09-07T00:00:05.000Z', targets: [] }

  const view = toRunViewModel(status, results)

  expect(view.status).toBe('FAILED')
  expect(view.targets).toEqual([])
  expect(view.failureMessage).toBe('No se pudo descargar el snapshot.')
})
