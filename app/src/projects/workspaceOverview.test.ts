import { beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { listAnalysisRuns } from '../control-plane/api'
import { countActivePullRequests, countRunsCreatedSince, latestRunByProject } from './workspaceOverview'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('workspaceOverview (contra los 21 Analysis Runs demo reales; WI-CONSOLE-030 suma 2 PHP de team-sandbox y 2 en curso)', () => {
  it('countActivePullRequests cuenta PRs distintos entre runs vigentes y abiertos (excluye el attempt obsoleto de PR#17)', async () => {
    const { items } = await listAnalysisRuns()
    // checkout: 8 (incluye PR#53 QUEUED) · billing: 7 (incluye PR#25 PROCESSING; PR#17 cuenta una sola vez) · organizations: PR#8, PR#15 y PR#21 (WRITER) · team-sandbox: PR#7 y PR#3 (WI-CONSOLE-030).
    expect(countActivePullRequests(items)).toBe(20)
  })

  it('countActivePullRequests con el subset de un proyecto', async () => {
    const { items } = await listAnalysisRuns('prj_checkout_demo')
    // WI-CONSOLE-030 (C2): + PR#53 en cola.
    expect(countActivePullRequests(items)).toBe(8)
  })

  it('countRunsCreatedSince cuenta por fecha, incluye los 21 si la ventana los cubre a todos', async () => {
    const { items } = await listAnalysisRuns()
    expect(countRunsCreatedSince(items, '2026-01-01T00:00:00.000Z')).toBe(21)
    // pr48/pr49/pr50/pr24 y writer pr21 (09-16) son del 2026-09-13 en adelante; el resto (incluido pr23, bootstrap, del 09-05) queda antes.
    // WI-CONSOLE-030 (C2): PR#53 y PR#25 se crearon el 2026-10-07, dentro de la ventana: 7 + 2 = 9.
    expect(countRunsCreatedSince(items, '2026-09-13T00:00:00.000Z')).toBe(9)
  })

  it('latestRunByProject toma el primer match por proyecto (el listado global ya viene ordenado desc)', async () => {
    const { items } = await listAnalysisRuns()
    const latest = latestRunByProject(items)
    // WI-CONSOLE-030 (C2): los Runs en curso (2026-10-07) pasan a ser los más recientes de cada proyecto.
    expect(latest.get('prj_checkout_demo')?.id).toBe('arun_checkout_pr53')
    expect(latest.get('prj_billing_demo')?.id).toBe('arun_billing_pr25')
  })
})
