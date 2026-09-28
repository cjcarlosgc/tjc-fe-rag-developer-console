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
