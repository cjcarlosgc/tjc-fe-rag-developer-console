import { beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { listAnalysisRuns } from '../control-plane/api'
import { countActivePullRequests, countRunsCreatedSince, latestRunByProject } from './workspaceOverview'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('workspaceOverview (contra los 9 Analysis Runs demo reales)', () => {
  it('countActivePullRequests cuenta PRs distintos entre runs vigentes y abiertos (excluye el attempt obsoleto de PR#17)', async () => {
    const { items } = await listAnalysisRuns()
    // checkout: PR 42,45,46,47 vigentes · billing: PR 17(_2),20,21,22 vigentes — el intento obsoleto de PR#17 no debe duplicar el conteo.
    expect(countActivePullRequests(items)).toBe(8)
  })

  it('countActivePullRequests con el subset de un proyecto', async () => {
    const { items } = await listAnalysisRuns('prj_checkout_demo')
    expect(countActivePullRequests(items)).toBe(4)
  })

  it('countRunsCreatedSince cuenta por fecha, incluye los 9 si la ventana los cubre a todos', async () => {
    const { items } = await listAnalysisRuns()
    expect(countRunsCreatedSince(items, '2026-01-01T00:00:00.000Z')).toBe(9)
    expect(countRunsCreatedSince(items, '2026-09-13T00:00:00.000Z')).toBe(0)
  })

  it('latestRunByProject toma el primer match por proyecto (el listado global ya viene ordenado desc)', async () => {
    const { items } = await listAnalysisRuns()
    const latest = latestRunByProject(items)
    expect(latest.get('prj_checkout_demo')?.id).toBe('arun_checkout_pr42')
    expect(latest.get('prj_billing_demo')?.id).toBe('arun_billing_pr17_2')
  })
})
