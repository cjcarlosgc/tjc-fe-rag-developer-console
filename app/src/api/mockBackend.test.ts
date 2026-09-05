import { expect, test, vi } from 'vitest'
import { uploadProjectVersion, getAnalysisOperation, getAnalysisResult, listAnalysisHistory } from '../analysis/api'
import { getArtifacts } from '../artifacts/api'
import { getExperiment, startExperiment } from '../experiments/api'
import { startGeneration } from '../generation/api'
import type { GenerationConfiguration, GenerationMode } from '../generation/types'
import { getTestInventory, toInventoryTargets } from '../inventory/api'
import { createProject, listProjects } from '../projects/api'
import { getRun } from '../runs/api'
import { isTerminalRunStatus } from '../runs/types'
import { setDataSourceForTests } from './dataSource'
import { resetMockBackend } from './mockBackend'

test('recorre el flujo demo completo sin requests HTTP', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const fetchMock = vi.spyOn(globalThis, 'fetch')

  expect((await listProjects()).map((project) => project.name)).toContain('checkout-service')
  const project = await createProject({ name: 'demo-on-stage' })
  const acceptedVersion = await uploadProjectVersion(project.id, new File(['source'], 'demo.zip', { type: 'application/zip' }))

  let status = await getAnalysisOperation(acceptedVersion.projectVersionId)
  for (let index = 0; index < 6 && status.status !== 'COMPLETED'; index += 1) status = await getAnalysisOperation(acceptedVersion.projectVersionId)
  expect(status.status).toBe('COMPLETED')

  const result = await getAnalysisResult(acceptedVersion.projectVersionId)
  expect(result.targetsMissingTest).toBeGreaterThan(0)
  const inventory = await getTestInventory(acceptedVersion.projectVersionId)
  const history = await listAnalysisHistory(project.id)
  expect(history).toHaveLength(1)
  expect(history[0]).toMatchObject({ id: acceptedVersion.projectVersionId, current: true, status: 'COMPLETED' })
  const target = toInventoryTargets(inventory).find((item) => item.kind === 'FUNCTION')
  expect(target).toBeDefined()

  const acceptedRun = await startGeneration({ projectId: project.id, mode: 'TARGET', target })
  let run = await getRun(acceptedRun.runId)
  for (let index = 0; index < 4 && !isTerminalRunStatus(run.status); index += 1) run = await getRun(acceptedRun.runId)
  expect(isTerminalRunStatus(run.status)).toBe(true)
  expect(await getArtifacts(run.id)).not.toHaveLength(0)

  const acceptedExperiment = await startExperiment(project.id, target?.symbolName ?? 'formatCurrency')
  let experiment = await getExperiment(acceptedExperiment.experimentId)
  for (let index = 0; index < 3 && experiment.status !== 'COMPLETED'; index += 1) experiment = await getExperiment(acceptedExperiment.experimentId)
  expect(experiment.result?.rag.validRate).toBeGreaterThan(experiment.result?.baseline.validRate ?? 1)
  expect(fetchMock).not.toHaveBeenCalled()
})

test('el escenario checkout conserva tres ProjectVersions coherentes', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const history = await listAnalysisHistory('prj_checkout_demo')

  expect(history.map((version) => version.id)).toEqual(['ver_checkout_7', 'ver_checkout_6', 'ver_checkout_5'])
  expect(history.filter((version) => version.current)).toHaveLength(1)
  expect(history.every((version) => version.status === 'COMPLETED')).toBe(true)
  for (const version of history) {
    const inventory = await getTestInventory(version.id)
    expect(inventory.targetsTotal).toBe(version.targetsTotal)
    expect(inventory.targetsWithTest + inventory.targetsMissingTest).toBe(inventory.targetsTotal)
  }
})

test('resuelve los cinco modos de generación del Sprint 2', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  const projects = await listProjects()
  const project = projects.find((item) => item.id === 'prj_checkout_demo')!
  const inventory = await getTestInventory(project.currentVersionId!)
  const targets = toInventoryTargets(inventory)
  const methodTarget = targets.find((target) => target.kind === 'METHOD' && !target.hasExistingTest)!
  const classTarget = targets.find((target) => target.kind === 'CLASS' && target.symbolName === 'OrderService')!
  const scenarios: Array<{ mode: GenerationMode; target?: typeof methodTarget; expectedTargets: number }> = [
    { mode: 'TARGET', target: methodTarget, expectedTargets: 1 },
    { mode: 'CLASS_ALL', target: classTarget, expectedTargets: 3 },
    { mode: 'CLASS_MISSING', target: classTarget, expectedTargets: 1 },
    { mode: 'PROJECT_MISSING', expectedTargets: 3 },
    { mode: 'PROJECT_ALL', expectedTargets: 5 },
  ]

  for (const scenario of scenarios) {
    const configuration: GenerationConfiguration = { projectId: project.id, mode: scenario.mode, target: scenario.target }
    const accepted = await startGeneration(configuration)
    const run = await getRun(accepted.runId)
    expect(run.total, scenario.mode).toBe(scenario.expectedTargets)
  }

  expect(fetchMock).not.toHaveBeenCalled()
})
