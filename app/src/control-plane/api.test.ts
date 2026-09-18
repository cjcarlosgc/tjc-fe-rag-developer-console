import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import {
  createRepositoryBinding,
  createTestPublication,
  disconnectRepository,
  getAnalysisRun,
  getRepositoryBinding,
  getTestPublication,
  listAnalysisRuns,
  listGitHubRepositoryBranches,
  listGitHubUserRepositories,
  listTestProposals,
  verifyGitHubAppAccess,
} from './api'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('control-plane api (mock) — HU30 repository binding user-centric (INTEROP-2.2 §6.8)', () => {
  it('devuelve el binding ENABLED de un proyecto vinculado', async () => {
    const binding = await getRepositoryBinding('prj_checkout_demo')
    expect(binding).toMatchObject({ repositoryName: 'acme/checkout-service', integrationBranch: 'develop', status: 'ENABLED' })
  })

  it('lista los repositorios descubiertos del usuario', async () => {
    const page = await listGitHubUserRepositories('gho_demo_token')
    expect(page.items.map((repo) => repo.repositoryName)).toEqual(expect.arrayContaining(['acme/checkout-service', 'acme/billing-engine', 'acme/notifications-service']))
    expect(page.nextCursor).toBeNull()
  })

  it('verifica acceso AUTHORIZED desde la primera llamada para un repo conocido', async () => {
    const access = await verifyGitHubAppAccess({ repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service' })
    expect(access).toMatchObject({ status: 'AUTHORIZED', installationId: 'inst_demo_repo_notifications' })
  })

  it('repo_playground: NOT_AUTHORIZED en la primera verificación, AUTHORIZED en la segunda (revalidar)', async () => {
    const first = await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'demo-user/integration-playground' })
    expect(first).toMatchObject({ status: 'NOT_AUTHORIZED', installationId: null })
    expect(first.app.configureUrl).toContain('github.com')

    const second = await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'demo-user/integration-playground' })
    expect(second).toMatchObject({ status: 'AUTHORIZED' })
  })

  it('las ramas de un repo sin acceso verificado rechazan con 403 GITHUB_APP_ACCESS_REQUIRED', async () => {
    await expect(listGitHubRepositoryBranches('demo-user', 'integration-playground')).rejects.toThrow(/no tiene acceso/)
  })

  it('las ramas de un repo ya autorizado se listan normalmente', async () => {
    await verifyGitHubAppAccess({ repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service' })
    const branches = await listGitHubRepositoryBranches('acme', 'notifications-service')
    expect(branches.items.map((branch) => branch.name)).toEqual(expect.arrayContaining(['main', 'develop']))
  })

  it('desconectar limpia el binding y luego se puede recrear contra el flujo nuevo', async () => {
    await disconnectRepository('prj_checkout_demo')
    expect(await getRepositoryBinding('prj_checkout_demo')).toBeNull()

    await verifyGitHubAppAccess({ repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service' })
    const binding = await createRepositoryBinding('prj_checkout_demo', { repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service', integrationBranch: 'develop' })
    expect(binding).toMatchObject({ repositoryName: 'acme/checkout-service', status: 'ENABLED', integrationBranch: 'develop' })
    expect(await getRepositoryBinding('prj_checkout_demo')).toMatchObject({ status: 'ENABLED' })
  })

  it('crear binding con el proyecto ya vinculado rechaza con 409', async () => {
    await verifyGitHubAppAccess({ repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service' })
    await expect(createRepositoryBinding('prj_checkout_demo', { repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service', integrationBranch: 'main' })).rejects.toThrow(/ya tiene un repositorio vinculado/)
  })

  it('crear binding con una rama inexistente rechaza con 404', async () => {
    await disconnectRepository('prj_checkout_demo')
    await verifyGitHubAppAccess({ repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service' })
    await expect(createRepositoryBinding('prj_checkout_demo', { repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service', integrationBranch: 'no-existe' })).rejects.toThrow(/no existe/)
  })
})

describe('control-plane api (mock) — HU32 Analysis Runs, los 14 escenarios', () => {
  it('lista los 14 Analysis Runs (incluye el par obsoleto/nuevo HEAD de PR#17)', async () => {
    const page = await listAnalysisRuns()
    expect(page.items).toHaveLength(14)
  })

  it('filtra por proyecto y por status', async () => {
    const checkoutRuns = await listAnalysisRuns('prj_checkout_demo')
    expect(checkoutRuns.items.every((run) => run.projectId === 'prj_checkout_demo')).toBe(true)
    expect(checkoutRuns.items).toHaveLength(7)

    const successRuns = await listAnalysisRuns(undefined, 'SUCCESS')
    expect(successRuns.items.map((run) => run.id).sort()).toEqual(['arun_billing_pr17_2', 'arun_billing_pr23', 'arun_checkout_pr45', 'arun_checkout_pr49', 'arun_checkout_pr50'])
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

  it('cada uno de los 14 escenarios existe con su status esperado', async () => {
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
      arun_checkout_pr48: 'INFRASTRUCTURE_FAILURE',
      arun_billing_pr23: 'SUCCESS',
      arun_checkout_pr49: 'SUCCESS',
      arun_checkout_pr50: 'SUCCESS',
      arun_billing_pr24: 'ACTION_REQUIRED',
    }
    for (const [id, status] of Object.entries(expected)) {
      const run = await getAnalysisRun(id)
      expect(run.status).toBe(status)
    }
  })
})

describe('control-plane api (mock) — HU53, historial de transiciones (INTEROP-2.1 §6.10, definido/no implementado)', () => {
  it('siempre empieza con la creación inicial (fromStatus null, toStatus QUEUED) en orden cronológico ascendente', async () => {
    const run = await getAnalysisRun('arun_checkout_pr45')
    expect(run.history?.[0]).toMatchObject({ fromStatus: null, toStatus: 'QUEUED', reason: 'RUN_CREATED' })
    const timestamps = run.history?.map((item) => item.occurredAt) ?? []
    expect([...timestamps].sort()).toEqual(timestamps)
  })

  it('un Run SUCCESS termina en GENERATION_COMPLETED', async () => {
    const run = await getAnalysisRun('arun_checkout_pr45')
    expect(run.history?.at(-1)).toMatchObject({ toStatus: 'SUCCESS', reason: 'GENERATION_COMPLETED' })
  })

  it('un Run ACTION_REQUIRED termina en FUNCTIONAL_CONTEXT_REQUIRED', async () => {
    const run = await getAnalysisRun('arun_checkout_pr42')
    expect(run.history?.at(-1)).toMatchObject({ toStatus: 'ACTION_REQUIRED', reason: 'FUNCTIONAL_CONTEXT_REQUIRED' })
  })

  it('un Run OBSOLETE termina en GITHUB_HEAD_SUPERSEDED', async () => {
    const run = await getAnalysisRun('arun_billing_pr17')
    expect(run.history?.at(-1)).toMatchObject({ toStatus: 'OBSOLETE', reason: 'GITHUB_HEAD_SUPERSEDED' })
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

describe('control-plane api (live) — lo que Core todavía no implementa (sin controller real)', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('propuestas de prueba siguen sin ruta: rechaza con PendingContractError', async () => {
    await expect(listTestProposals('arun_checkout_pr45')).rejects.toThrow(/todavía no publicó/)
  })

  it('HU55: el listado global de Analysis Runs (sin projectId) tiene contrato definido pero Core no lo implementó — PendingContractError', async () => {
    await expect(listAnalysisRuns()).rejects.toThrow(/todavía no lo implementó/)
  })
})

describe('control-plane api (live) — HU30 repository binding, Core ya lo implementó (Render+Supabase+GitHub reales, handoff 2026-09-17)', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('getRepositoryBinding traduce 404 REPOSITORY_BINDING_NOT_FOUND a null', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 'REPOSITORY_BINDING_NOT_FOUND', message: 'x' }), { status: 404 }))
    await expect(getRepositoryBinding('prj_real')).resolves.toBeNull()
  })

  it('getRepositoryBinding pide GET /projects/{projectId}/integrations/github y devuelve el binding', async () => {
    const binding = { projectId: 'prj_real', installationId: 'inst_1', repositoryId: 'repo_1', repositoryName: 'acme/repo', integrationBranch: 'main', status: 'ENABLED', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(binding), { status: 200 }))
    await expect(getRepositoryBinding('prj_real')).resolves.toEqual(binding)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/projects/prj_real/integrations/github'), expect.anything())
  })

  it('listGitHubUserRepositories pide GET /integrations/github/repositories con X-GitHub-Provider-Token', async () => {
    const page = { items: [], nextCursor: null }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(page), { status: 200 }))
    await expect(listGitHubUserRepositories('gho_demo_token')).resolves.toEqual(page)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/integrations/github/repositories'),
      expect.objectContaining({ headers: expect.objectContaining({ 'X-GitHub-Provider-Token': 'gho_demo_token' }) }),
    )
  })

  it('verifyGitHubAppAccess pide POST .../verify-app-access con repositoryId/repositoryName', async () => {
    const access = { repositoryId: 'repo_1', repositoryName: 'acme/repo', status: 'AUTHORIZED', installationId: 'inst_1', app: { displayName: 'App', configureUrl: 'https://x' } }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(access), { status: 200 }))
    await expect(verifyGitHubAppAccess({ repositoryId: 'repo_1', repositoryName: 'acme/repo' })).resolves.toEqual(access)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/integrations/github/repositories/verify-app-access'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ repositoryId: 'repo_1', repositoryName: 'acme/repo' }) }),
    )
  })

  it('listGitHubRepositoryBranches pide GET .../{owner}/{repo}/branches', async () => {
    const branches = { items: [{ name: 'main', protected: true }] }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(branches), { status: 200 }))
    await expect(listGitHubRepositoryBranches('acme', 'repo')).resolves.toEqual(branches)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/integrations/github/repositories/acme/repo/branches'), expect.anything())
  })

  it('createRepositoryBinding pide POST /projects/{projectId}/integrations/github', async () => {
    const binding = { projectId: 'prj_real', installationId: 'inst_1', repositoryId: 'repo_1', repositoryName: 'acme/repo', integrationBranch: 'main', status: 'ENABLED', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(binding), { status: 201 }))
    const input = { repositoryId: 'repo_1', repositoryName: 'acme/repo', integrationBranch: 'main' }
    await expect(createRepositoryBinding('prj_real', input)).resolves.toEqual(binding)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/projects/prj_real/integrations/github'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    )
  })

  it('disconnectRepository pide DELETE y no falla al parsear una respuesta 204 sin cuerpo', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
    await expect(disconnectRepository('prj_real')).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/projects/prj_real/integrations/github'), expect.objectContaining({ method: 'DELETE' }))
  })
})

describe('control-plane api (live) — HU32 Analysis Runs, Core ya lo implementa', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('getAnalysisRun pide GET /analysis-runs/{id}', async () => {
    const detail = { id: 'arun_checkout_pr45', projectId: 'prj_checkout_demo', status: 'SUCCESS', current: true, actionRequiredCount: 0, generatedTestsCount: 3, createdAt: '2026-09-12T09:00:00.000Z', updatedAt: '2026-09-12T09:12:00.000Z', completedAt: '2026-09-12T09:12:00.000Z', attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: 'e5e5e5e', indexDeltaBaseSha: 'c1c1c1c', symbols: [], functionalBehaviorValidated: true, resultSummary: '3 pruebas generadas.', detailsUrl: '/projects/prj_checkout_demo/runs/arun_checkout_pr45', pullRequest: { repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service', number: 45, title: 'x', baseRef: 'develop', headRef: 'feature/x', baseSha: 'c1c1c1c', headSha: 'e5e5e5e', draft: false, state: 'OPEN', actorLogin: null } }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(detail), { status: 200 }))

    const result = await getAnalysisRun('arun_checkout_pr45')

    expect(result.status).toBe('SUCCESS')
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/analysis-runs/arun_checkout_pr45'), expect.anything())
  })

  it('listAnalysisRuns(projectId) pide GET /projects/{projectId}/analysis-runs con status y cursor en la query', async () => {
    const page = { items: [], nextCursor: null }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(page), { status: 200 }))

    await listAnalysisRuns('prj_checkout_demo', 'SUCCESS', 'cur-1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/projects\/prj_checkout_demo\/analysis-runs\?.*status=SUCCESS.*cursor=cur-1|\/projects\/prj_checkout_demo\/analysis-runs\?.*cursor=cur-1.*status=SUCCESS/),
      expect.anything(),
    )
  })
})
