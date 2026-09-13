import { beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import {
  completeGitHubInstallation,
  createTestPublication,
  disconnectRepository,
  getAnalysisRun,
  getRepositoryBinding,
  getTestPublication,
  listAnalysisRuns,
  listTestProposals,
  startGitHubInstallation,
} from './api'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('control-plane api (mock) — HU30 repository binding', () => {
  it('devuelve el binding ENABLED de un proyecto vinculado', async () => {
    const binding = await getRepositoryBinding('prj_checkout_demo')
    expect(binding).toMatchObject({ repositoryName: 'acme/checkout-service', integrationBranch: 'develop', status: 'ENABLED' })
  })

  it('desconectar limpia el binding y luego se puede reconectar', async () => {
    await disconnectRepository('prj_checkout_demo')
    expect(await getRepositoryBinding('prj_checkout_demo')).toBeNull()

    const session = await startGitHubInstallation('prj_checkout_demo')
    expect(session.installationUrl).toContain('github.com')

    const binding = await completeGitHubInstallation('prj_checkout_demo', { installationId: 'inst_x', repositoryId: 'repo_checkout', state: session.installationUrl.split('state=')[1] })
    expect(binding).toMatchObject({ repositoryName: 'acme/checkout-service', status: 'ENABLED' })
    expect(await getRepositoryBinding('prj_checkout_demo')).toMatchObject({ status: 'ENABLED' })
  })
})

describe('control-plane api (mock) — HU32 Analysis Runs, los 9 escenarios', () => {
  it('lista los 9 Analysis Runs (incluye el par obsoleto/nuevo HEAD de PR#17)', async () => {
    const page = await listAnalysisRuns()
    expect(page.items).toHaveLength(9)
  })

  it('filtra por proyecto y por status', async () => {
    const checkoutRuns = await listAnalysisRuns('prj_checkout_demo')
    expect(checkoutRuns.items.every((run) => run.projectId === 'prj_checkout_demo')).toBe(true)
    expect(checkoutRuns.items).toHaveLength(4)

    const successRuns = await listAnalysisRuns(undefined, 'SUCCESS')
    expect(successRuns.items.map((run) => run.id).sort()).toEqual(['arun_billing_pr17_2', 'arun_checkout_pr45'])
  })

  it('el par pr17/pr17_2 representa la corrección por HEAD nuevo', async () => {
    const old = await getAnalysisRun('arun_billing_pr17')
    const fresh = await getAnalysisRun('arun_billing_pr17_2')
    expect(old.status).toBe('OBSOLETE')
    expect(old.current).toBe(false)
    expect(fresh.status).toBe('SUCCESS')
    expect(fresh.current).toBe(true)
    expect(fresh.pullRequest.number).toBe(old.pullRequest.number)
    expect(fresh.pullRequest.headSha).not.toBe(old.pullRequest.headSha)
  })

  it('cada uno de los 9 escenarios existe con su status esperado', async () => {
    const expected: Record<string, string> = {
      arun_checkout_pr42: 'ACTION_REQUIRED',
      arun_checkout_pr45: 'SUCCESS',
      arun_checkout_pr46: 'BEHAVIORAL_MISMATCH',
      arun_checkout_pr47: 'NO_ADDITIONAL_TESTS_REQUIRED',
      arun_billing_pr17: 'OBSOLETE',
      arun_billing_pr17_2: 'SUCCESS',
      arun_billing_pr20: 'BASELINE_FAILED',
      arun_billing_pr21: 'TECHNICAL_GENERATION_FAILURE',
      arun_billing_pr22: 'NO_TEST_RELEVANT_CHANGES',
    }
    for (const [id, status] of Object.entries(expected)) {
      const run = await getAnalysisRun(id)
      expect(run.status).toBe(status)
    }
  })
})

describe('control-plane api (mock) — HU39/HU40 propuestas y companion PR', () => {
  it('lista propuestas AVAILABLE de un Run SUCCESS y las publica', async () => {
    const set = await listTestProposals('arun_checkout_pr45')
    expect(set.items).toHaveLength(3)
    expect(set.items.every((item) => item.status === 'AVAILABLE')).toBe(true)

    const accepted = await createTestPublication('arun_checkout_pr45', { proposalIds: set.items.map((item) => item.id) })
    const publication = await getTestPublication(accepted.publicationId)
    expect(publication.status).toBe('PUBLISHED')
    expect(publication.companionPullRequestUrl).toContain('acme/checkout-service/pull/')

    const after = await listTestProposals('arun_checkout_pr45')
    expect(after.items.every((item) => item.status === 'PUBLISHED')).toBe(true)
  })

  it('rechaza publicar sobre un Run que no está SUCCESS', async () => {
    await expect(createTestPublication('arun_checkout_pr46', { proposalIds: ['prop_pr46_1'] })).rejects.toThrow(/SUCCESS/)
  })

  it('BEHAVIORAL_MISMATCH mantiene sus propuestas HELD', async () => {
    const set = await listTestProposals('arun_checkout_pr46')
    expect(set.items).toEqual([expect.objectContaining({ status: 'HELD' })])
  })
})

describe('control-plane api (live, INTEROP-2.0 aún no publicado)', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('cada función rechaza con PendingContractError', async () => {
    await expect(getRepositoryBinding('prj_checkout_demo')).rejects.toThrow(/todavía no publicó/)
    await expect(listAnalysisRuns()).rejects.toThrow(/todavía no publicó/)
    await expect(getAnalysisRun('arun_checkout_pr45')).rejects.toThrow(/todavía no publicó/)
    await expect(listTestProposals('arun_checkout_pr45')).rejects.toThrow(/todavía no publicó/)
  })
})
