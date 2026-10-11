import { expect, test, vi } from 'vitest'
import { listAnalysisHistory } from '../analysis/api'
import { getExperiment, startExperiment } from '../experiments/api'
import { getTestInventory } from '../inventory/api'
import { createProject, listProjects } from '../projects/api'
import { setDataSourceForTests } from './dataSource'
import { resetMockBackend } from './mockBackend'

test('conserva historial e inventarios internos sin requests HTTP', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const fetchMock = vi.spyOn(globalThis, 'fetch')

  expect((await listProjects('1000001')).items.map((project) => project.name)).toContain('checkout-service')
  const project = await createProject({ name: 'demo-on-stage' })
  expect(await listAnalysisHistory(project.id)).toEqual([])

  const history = await listAnalysisHistory('prj_checkout_demo')
  expect(history.map((version) => version.id)).toEqual(['ver_checkout_7', 'ver_checkout_6', 'ver_checkout_5'])
  expect(history.filter((version) => version.current)).toHaveLength(1)
  expect(history.every((version) => version.status === 'COMPLETED')).toBe(true)
  expect(history.every((version) => version.originalFileName === null)).toBe(true)
  for (const version of history) {
    const inventory = await getTestInventory(version.id)
    expect(inventory.targetsTotal).toBe(version.targetsTotal)
    expect(inventory.targetsWithTest + inventory.targetsMissingTest).toBe(inventory.targetsTotal)
  }
  expect(fetchMock).not.toHaveBeenCalled()
})

test('mantiene la comparación experimental a partir de un snapshot disponible', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  const project = (await listProjects('1000001')).items.find((item) => item.id === 'prj_checkout_demo')!
  const target = (await getTestInventory(project.currentVersionId!)).targets.find((item) => item.targetType === 'FUNCTION')!

  const accepted = await startExperiment(project.id, target.id, crypto.randomUUID())
  let experiment = await getExperiment(accepted.experimentId, target.symbolName)
  for (let index = 0; index < 3 && experiment.status !== 'COMPLETED'; index += 1) experiment = await getExperiment(accepted.experimentId, target.symbolName)

  expect(experiment.result?.rag.validRate).toBeGreaterThan(experiment.result?.baseline.validRate ?? 1)
  expect(fetchMock).not.toHaveBeenCalled()
})

test('WI-CONSOLE-021: escenarios DEMO de experimento cubren corrida previa, Sandbox mixto, sin datos evaluables y FAILED', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const fetchMock = vi.spyOn(globalThis, 'fetch')

  const legacy = await getExperiment((await startExperiment('prj_checkout_demo', 'demo-scenario-legacy', crypto.randomUUID())).experimentId, 'DEMO')
  expect(legacy.status).toBe('COMPLETED')
  expect(legacy.configuration).toEqual({ model: null, budget: null, executionProfile: null, runnerHint: null, randomizationSeed: null })
  expect(legacy.result?.repetitions.every((item) => item.executionDurationMs === null && item.pairId === null && item.pairPosition === null)).toBe(true)

  const mixed = await getExperiment((await startExperiment('prj_checkout_demo', 'demo-scenario-mixed-sandbox', crypto.randomUUID())).experimentId, 'DEMO')
  expect(mixed.configuration?.budget).toBeNull()
  expect(mixed.configuration?.model?.provider).toBe('OpenAI')
  const durations = mixed.result?.repetitions.map((item) => item.executionDurationMs) ?? []
  expect(durations).toContain(7)
  expect(durations).toContain(null)
  expect(durations).not.toContain(0)

  const noEvaluable = await getExperiment((await startExperiment('prj_checkout_demo', 'demo-scenario-no-evaluable', crypto.randomUUID())).experimentId, 'DEMO')
  expect(noEvaluable.result?.baseline).toMatchObject({ validRate: null, passedRate: null, totalDurationMs: null, evaluableRepetitions: 0, nonEvaluableRepetitions: 3 })
  expect(noEvaluable.result?.rag.evaluableRepetitions).toBe(3)

  // WI-CONSOLE-021 C1: proyecto PHP con PHPUnit (CS-CORE-20261009-018). Sin 422 de lenguaje; perfil y runner tal cual.
  const phpunit = await getExperiment((await startExperiment('prj_checkout_demo', 'demo-scenario-phpunit', crypto.randomUUID())).experimentId, 'DEMO')
  expect(phpunit.configuration).toMatchObject({ executionProfile: 'PHP_LARAVEL_PHPUNIT', runnerHint: 'PHPUNIT' })
  expect(phpunit.result?.repetitions.some((row) => row.failureType === 'COMPILATION' && row.attempt === 1)).toBe(true)

  const failed = await getExperiment((await startExperiment('prj_checkout_demo', 'demo-scenario-failed-worker-lost', crypto.randomUUID())).experimentId, 'DEMO')
  expect(failed).toMatchObject({ status: 'FAILED', failureCode: 'EXPERIMENT_WORKER_LOST' })
  expect(failed.result).toBeUndefined()
  expect(failed.failureMessage).toMatch(/^DEMO:/)
  // Un escenario fijo no avanza con el polling: sigue FAILED en la siguiente lectura.
  expect((await getExperiment(failed.id, 'DEMO')).status).toBe('FAILED')

  expect(fetchMock).not.toHaveBeenCalled()
})

test.each([
  ['demo-error-reasoning-effort', 422, 'REASONING_EFFORT_UNSUPPORTED', { supportedEfforts: ['low', 'medium'] }],
  ['demo-error-unsupported-project', 422, 'UNSUPPORTED_PROJECT', undefined],
  ['demo-error-llm-unavailable', 503, 'LLM_PROVIDER_UNAVAILABLE', undefined],
])('WI-CONSOLE-021: la creación DEMO %s responde %i %s sin crear experimento', async (targetId, status, code, details) => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const project = 'prj_checkout_demo'
  await expect(startExperiment(project, targetId, crypto.randomUUID())).rejects.toMatchObject({ status, code, details })
})
