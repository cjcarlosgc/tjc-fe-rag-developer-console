import { beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { listAnalysisRuns } from '../control-plane/api'
import { countActivePullRequests, countRunsCreatedSince, latestRunByProject } from './workspaceOverview'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('workspaceOverview (contra los 16 Analysis Runs demo reales)', () => {
  it('countActivePullRequests cuenta PRs distintos entre runs vigentes y abiertos (excluye el attempt obsoleto de PR#17)', async () => {
    const { items } = await listAnalysisRuns()
    // checkout: 7 · billing: 6 (PR#17 cuenta una sola vez) · organizations: PR#8 y PR#15.
    expect(countActivePullRequests(items)).toBe(15)
  })

  it('countActivePullRequests con el subset de un proyecto', async () => {
    const { items } = await listAnalysisRuns('prj_checkout_demo')
    expect(countActivePullRequests(items)).toBe(7)
  })

  it('countRunsCreatedSince cuenta por fecha, incluye los 16 si la ventana los cubre a todos', async () => {
    const { items } = await listAnalysisRuns()
    expect(countRunsCreatedSince(items, '2026-01-01T00:00:00.000Z')).toBe(16)
    // pr48/pr49/pr50/pr24 son del 2026-09-13 en adelante; el resto (incluido pr23, bootstrap, del 09-05) queda antes.
    expect(countRunsCreatedSince(items, '2026-09-13T00:00:00.000Z')).toBe(6)
  })

  it('latestRunByProject toma el primer match por proyecto (el listado global ya viene ordenado desc)', async () => {
    const { items } = await listAnalysisRuns()
    const latest = latestRunByProject(items)
    expect(latest.get('prj_checkout_demo')?.id).toBe('arun_checkout_pr50')
    expect(latest.get('prj_billing_demo')?.id).toBe('arun_billing_pr24')
  })
})
