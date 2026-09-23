import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { listActionRequired } from '../action-required/api'
import { setAuthTokenProvider } from '../api/client'
import { setDataSourceForTests } from '../api/dataSource'
import { mockCreateProject, mockDeleteProject, mockGetAnalysisRunContextTrace, mockGetExperiment, mockGetRuleUsage, mockListRunComparisons, mockSimulateAppAccessLoss, mockStartExperiment, mockStartRunComparison, mockGetRunComparison, resetMockBackend } from '../api/mockBackend'
import { deleteProject, getProject, listProjects } from '../projects/api'
import {
  createRepositoryBinding,
  createTestPublication,
  disconnectRepository,
  enableRepository,
  getAnalysisRun,
  getGitHubAppAccess,
  getRepositoryBinding,
  getTestPublication,
  listAnalysisRuns,
  listAllAnalysisRuns,
  listGitHubRepositoryBranches,
  listGitHubUserRepositories,
  listTestProposals,
  verifyGitHubAppAccess,
} from './api'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

describe('control-plane api (mock) — HU30 repository binding user-centric (INTEROP-2.3 §6.8)', () => {
  it('devuelve el binding ENABLED de un proyecto vinculado', async () => {
    const binding = await getRepositoryBinding('prj_checkout_demo')
    expect(binding).toMatchObject({ repositoryName: 'acme/checkout-service', integrationBranch: 'develop', status: 'ENABLED' })
  })

  it('lista los repositorios descubiertos del usuario', async () => {
    const page = await listGitHubUserRepositories('gho_demo_token', '2000001')
    expect(page.items.map((repo) => repo.repositoryName)).toEqual(['rag-tesis-org/orders-api'])
    expect(page.nextCursor).toBeNull()
  })

  it('verifica acceso AUTHORIZED desde la primera llamada para un repo conocido', async () => {
    const access = await verifyGitHubAppAccess({ repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service' })
    expect(access).toMatchObject({ status: 'AUTHORIZED', installationId: 'inst_demo_repo_notifications' })
  })

  it('repo_playground: NOT_AUTHORIZED en la primera verificación, AUTHORIZED en la segunda (revalidar)', async () => {
    const first = await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'acme/integration-playground' })
    expect(first).toMatchObject({ status: 'NOT_AUTHORIZED', installationId: null })
    expect(first.app.configureUrl).toContain('github.com')

    const second = await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'acme/integration-playground' })
    expect(second).toMatchObject({ status: 'AUTHORIZED' })
  })

  it('las ramas de un repo sin acceso verificado rechazan con 403 GITHUB_APP_ACCESS_REQUIRED', async () => {
    await expect(listGitHubRepositoryBranches('acme', 'integration-playground')).rejects.toThrow(/no tiene acceso/)
  })

  it('las ramas de un repo ya autorizado se listan normalmente', async () => {
    await verifyGitHubAppAccess({ repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service' })
    const branches = await listGitHubRepositoryBranches('acme', 'notifications-service')
    expect(branches.items.map((branch) => branch.name)).toEqual(expect.arrayContaining(['main', 'develop']))
  })

  it('desconectar deja el binding en DISABLED (no lo borra) y conserva repositorio y rama', async () => {
    await disconnectRepository('prj_checkout_demo')
    expect(await getRepositoryBinding('prj_checkout_demo')).toMatchObject({ repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service', integrationBranch: 'develop', status: 'DISABLED' })
  })

  it('desconectar conserva los Runs del proyecto', async () => {
    const before = await listAnalysisRuns('prj_checkout_demo')
    await disconnectRepository('prj_checkout_demo')
    expect((await listAnalysisRuns('prj_checkout_demo')).items).toHaveLength(before.items.length)
  })

  it('desconectar un proyecto sin binding responde 404 REPOSITORY_BINDING_NOT_FOUND, como Core', async () => {
    const project = await mockCreateProject({ name: 'sin-binding' })
    await expect(disconnectRepository(project.id)).rejects.toMatchObject({ status: 404, code: 'REPOSITORY_BINDING_NOT_FOUND' })
  })

  it('un proyecto que nunca se vinculó no tiene binding (null)', async () => {
    const project = await mockCreateProject({ name: 'sin-binding' })
    expect(await getRepositoryBinding(project.id)).toBeNull()
  })

  it('un binding DISABLED no se puede recrear: 409 REPOSITORY_BINDING_ALREADY_EXISTS en cualquier status', async () => {
    await disconnectRepository('prj_checkout_demo')
    await verifyGitHubAppAccess({ repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service' })
    await expect(createRepositoryBinding('prj_checkout_demo', { repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service', integrationBranch: 'main' }))
      .rejects.toMatchObject({ status: 409, code: 'REPOSITORY_BINDING_ALREADY_EXISTS' })
  })

  it('crear binding con el proyecto ya vinculado rechaza con 409', async () => {
    await verifyGitHubAppAccess({ repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service' })
    await expect(createRepositoryBinding('prj_checkout_demo', { repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service', integrationBranch: 'main' })).rejects.toThrow(/ya tiene un repositorio vinculado/)
  })

  it('vincular un repo ya vinculado a otro Project rechaza con 409 REPOSITORY_ALREADY_BOUND', async () => {
    const project = await mockCreateProject({ name: 'sin-binding' })
    await verifyGitHubAppAccess({ repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service' })
    await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service', integrationBranch: 'develop' }))
      .rejects.toMatchObject({ status: 409, code: 'REPOSITORY_ALREADY_BOUND' })
  })

  it('un repo con binding DISABLED de otro Project sigue ocupado (desconectar no libera el repositorio)', async () => {
    await disconnectRepository('prj_checkout_demo')
    const project = await mockCreateProject({ name: 'sin-binding' })
    await verifyGitHubAppAccess({ repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service' })
    await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service', integrationBranch: 'develop' }))
      .rejects.toMatchObject({ code: 'REPOSITORY_ALREADY_BOUND' })
  })

  describe('HU64: orden de validación de POST binding en el mock (INTEROP-2.4 §6.8)', () => {
    it('repositoryId inexistente o discordante con el nombre responde el mismo 404 GITHUB_REPOSITORY_NOT_FOUND', async () => {
      const project = await mockCreateProject({ name: 'sin-binding' })
      await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_falso', repositoryName: 'acme/notifications-service', integrationBranch: 'main' }))
        .rejects.toMatchObject({ status: 404, code: 'GITHUB_REPOSITORY_NOT_FOUND' })
      await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_notifications', repositoryName: 'acme/otro-nombre', integrationBranch: 'main' }))
        .rejects.toMatchObject({ status: 404, code: 'GITHUB_REPOSITORY_NOT_FOUND' })
    })

    it('un repo de propietario ajeno responde 400 REPOSITORY_OUTSIDE_WORKSPACE', async () => {
      const project = await mockCreateProject({ name: 'sin-binding' })
      await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_external_tools', repositoryName: 'external-org/shared-tools', integrationBranch: 'main' }))
        .rejects.toMatchObject({ status: 400, code: 'REPOSITORY_OUTSIDE_WORKSPACE' })
    })

    it('un repo con permiso solo de lectura responde 403 REPOSITORY_PERMISSION_INSUFFICIENT', async () => {
      const project = await mockCreateProject({ name: 'sin-binding' })
      await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_legacy_docs', repositoryName: 'acme/legacy-docs', integrationBranch: 'main' }))
        .rejects.toMatchObject({ status: 403, code: 'REPOSITORY_PERMISSION_INSUFFICIENT' })
    })

    it('el orden es 404 proyecto → 409 binding propio → 403 App → 404 repo → 400 ajeno → 403 permiso → 409 ya vinculado → 404 rama', async () => {
      const project = await mockCreateProject({ name: 'sin-binding' })
      // 403 App antes que 404 repo: repo_playground sin autorizar pero con id/nombre válidos.
      await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_playground', repositoryName: 'acme/integration-playground', integrationBranch: 'main' }))
        .rejects.toMatchObject({ code: 'GITHUB_APP_ACCESS_REQUIRED' })
      // 400 ajeno antes que 403 permiso y que 404 rama (la rama 'no-existe' no llega a evaluarse).
      await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_external_tools', repositoryName: 'external-org/shared-tools', integrationBranch: 'no-existe' }))
        .rejects.toMatchObject({ code: 'REPOSITORY_OUTSIDE_WORKSPACE' })
      // 403 permiso antes que 409 ya vinculado y que 404 rama.
      await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_legacy_docs', repositoryName: 'acme/legacy-docs', integrationBranch: 'no-existe' }))
        .rejects.toMatchObject({ code: 'REPOSITORY_PERMISSION_INSUFFICIENT' })
      // 404 repo antes que 409 ya vinculado (repo_checkout está vinculado a otro Project pero el nombre no coincide).
      await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_checkout', repositoryName: 'acme/otro', integrationBranch: 'develop' }))
        .rejects.toMatchObject({ code: 'GITHUB_REPOSITORY_NOT_FOUND' })
      // 409 ya vinculado antes que 404 rama.
      await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service', integrationBranch: 'no-existe' }))
        .rejects.toMatchObject({ code: 'REPOSITORY_ALREADY_BOUND' })
      // 404 proyecto y 409 binding propio siguen primero.
      await expect(createRepositoryBinding('prj_inexistente', { repositoryId: 'repo_falso', repositoryName: 'x/y', integrationBranch: 'main' }))
        .rejects.toMatchObject({ code: 'PROJECT_NOT_FOUND' })
      await expect(createRepositoryBinding('prj_checkout_demo', { repositoryId: 'repo_falso', repositoryName: 'x/y', integrationBranch: 'main' }))
        .rejects.toMatchObject({ code: 'REPOSITORY_BINDING_ALREADY_EXISTS' })
    })
  })

  it('crear binding con una rama inexistente rechaza con 404', async () => {
    const project = await mockCreateProject({ name: 'sin-binding' })
    await verifyGitHubAppAccess({ repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service' })
    await expect(createRepositoryBinding(project.id, { repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service', integrationBranch: 'no-existe' })).rejects.toThrow(/no existe/)
  })

  it('crear binding en un proyecto sin binding funciona contra el flujo nuevo', async () => {
    const project = await mockCreateProject({ name: 'sin-binding' })
    await verifyGitHubAppAccess({ repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service' })
    const binding = await createRepositoryBinding(project.id, { repositoryId: 'repo_notifications', repositoryName: 'acme/notifications-service', integrationBranch: 'develop' })
    expect(binding).toMatchObject({ repositoryName: 'acme/notifications-service', status: 'ENABLED', integrationBranch: 'develop' })
    expect(await getRepositoryBinding(project.id)).toMatchObject({ status: 'ENABLED' })
  })

  describe('enableRepository (HU57, INTEROP-2.3)', () => {
    it('DISABLED pasa a ENABLED', async () => {
      await disconnectRepository('prj_checkout_demo')
      expect(await enableRepository('prj_checkout_demo')).toMatchObject({ status: 'ENABLED', repositoryId: 'repo_checkout' })
      expect(await getRepositoryBinding('prj_checkout_demo')).toMatchObject({ status: 'ENABLED' })
    })

    it('es idempotente si ya está ENABLED', async () => {
      const first = await getRepositoryBinding('prj_checkout_demo')
      expect(await enableRepository('prj_checkout_demo')).toEqual(first)
    })

    it('REVOKED pasa a ENABLED si la App recuperó acceso al repositorio', async () => {
      mockSimulateAppAccessLoss('prj_checkout_demo')
      expect(await getRepositoryBinding('prj_checkout_demo')).toMatchObject({ status: 'REVOKED' })
      expect(await enableRepository('prj_checkout_demo')).toMatchObject({ status: 'ENABLED' })
    })

    it('REVOKED sin acceso de la App responde 403 GITHUB_APP_ACCESS_REQUIRED y no cambia el estado; tras revalidar reactiva', async () => {
      const project = await mockCreateProject({ name: 'sin-binding' })
      await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'acme/integration-playground' })
      await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'acme/integration-playground' })
      await createRepositoryBinding(project.id, { repositoryId: 'repo_playground', repositoryName: 'acme/integration-playground', integrationBranch: 'main' })
      mockSimulateAppAccessLoss(project.id)

      await expect(enableRepository(project.id)).rejects.toMatchObject({ status: 403, code: 'GITHUB_APP_ACCESS_REQUIRED' })
      expect(await getRepositoryBinding(project.id)).toMatchObject({ status: 'REVOKED' })

      await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'acme/integration-playground' })
      await verifyGitHubAppAccess({ repositoryId: 'repo_playground', repositoryName: 'acme/integration-playground' })
      expect(await enableRepository(project.id)).toMatchObject({ status: 'ENABLED' })
    })

    it('desconectar sobre REVOKED no cambia el estado', async () => {
      mockSimulateAppAccessLoss('prj_checkout_demo')
      await disconnectRepository('prj_checkout_demo')
      expect(await getRepositoryBinding('prj_checkout_demo')).toMatchObject({ status: 'REVOKED' })
    })

    it('leer el acceso de la App con getGitHubAppAccess no cuenta como verificación (Reactivar sigue determinista)', async () => {
      const input = { repositoryId: 'repo_playground', repositoryName: 'acme/integration-playground' }
      for (let attempt = 0; attempt < 3; attempt += 1) {
        expect(await getGitHubAppAccess(input)).toMatchObject({ status: 'NOT_AUTHORIZED', app: { configureUrl: expect.stringContaining('github.com') } })
      }
      // En cambio `verifyGitHubAppAccess` sí cuenta: la segunda verificación autoriza.
      await verifyGitHubAppAccess(input)
      expect(await verifyGitHubAppAccess(input)).toMatchObject({ status: 'AUTHORIZED' })
    })

    it('un proyecto sin binding responde 404 REPOSITORY_BINDING_NOT_FOUND', async () => {
      const project = await mockCreateProject({ name: 'sin-binding' })
      await expect(enableRepository(project.id)).rejects.toMatchObject({ status: 404, code: 'REPOSITORY_BINDING_NOT_FOUND' })
    })

  it('un proyecto inexistente responde 404 PROJECT_NOT_FOUND', async () => {
    await expect(enableRepository('prj_no_existe')).rejects.toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
  })

  it('REVOKED oculta el Project de organización a Maintainer y bloquea reactivación sin visibilidad', async () => {
    mockSimulateAppAccessLoss('prj_org_orders_demo')

    expect((await listProjects('2000001')).items.some((item) => item.id === 'prj_org_orders_demo')).toBe(false)
    await expect(getProject('prj_org_orders_demo')).rejects.toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
    await expect(enableRepository('prj_org_orders_demo')).rejects.toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
  })

  it('Admin de Project puede ver y reactivar un binding REVOKED tras recuperar acceso', async () => {
    mockSimulateAppAccessLoss('prj_checkout_demo')
    expect(await getRepositoryBinding('prj_checkout_demo')).toMatchObject({ status: 'REVOKED' })
    expect(await enableRepository('prj_checkout_demo')).toMatchObject({ status: 'ENABLED' })
  })

  it('GETs project-scoped de Action Required y Runs ocultan ids inexistentes con 404 PROJECT_NOT_FOUND', async () => {
    await expect(listActionRequired('prj_missing')).rejects.toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
    await expect(listAnalysisRuns('prj_missing')).rejects.toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
  })

  it('POST experiment devuelve 404 UNRESOLVABLE_TARGET si el target no pertenece al Project del body', async () => {
    await expect(mockStartExperiment('prj_org_orders_demo', 'ver_checkout_7-method-total'))
      .rejects.toMatchObject({ status: 404, code: 'UNRESOLVABLE_TARGET' })
  })
})

  describe('deleteProject (HU56, INTEROP-2.3)', () => {
    it('oculta el Project, sus Runs y su Action Required; conserva los del resto', async () => {
      await deleteProject('prj_checkout_demo')

      await expect(getProject('prj_checkout_demo')).rejects.toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
      expect((await listProjects('1000001')).items.map((project) => project.id)).not.toContain('prj_checkout_demo')
      expect((await listAnalysisRuns()).items.some((run) => run.projectId === 'prj_checkout_demo')).toBe(false)
      expect((await listAnalysisRuns()).items.some((run) => run.projectId === 'prj_billing_demo')).toBe(true)
      expect((await listActionRequired()).items.some((question) => question.projectId === 'prj_checkout_demo')).toBe(false)
      await expect(getAnalysisRun('arun_checkout_pr45')).rejects.toMatchObject({ status: 404, code: 'ANALYSIS_RUN_NOT_FOUND' })
    })

    it('getRepositoryBinding de un Project borrado no se enmascara como "sin binding": 404 PROJECT_NOT_FOUND', async () => {
      await deleteProject('prj_checkout_demo')
      await expect(getRepositoryBinding('prj_checkout_demo')).rejects.toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
    })

    it('las lecturas por id de publicaciones, comparaciones, experimentos, trazas y uso de reglas también lo tratan como inexistente', async () => {
      const set = await listTestProposals('arun_checkout_pr45')
      const accepted = await createTestPublication('arun_checkout_pr45', { proposalIds: set.items.map((item) => item.id) })
      const symbol = { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.calculateTotal', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' } as const
      const comparison = await mockStartRunComparison('arun_checkout_pr45', symbol)
      const experiment = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
      expect(await getTestPublication(accepted.publicationId)).toMatchObject({ id: accepted.publicationId })
      expect(await mockGetAnalysisRunContextTrace('arun_checkout_pr45')).not.toBeNull()
      expect((await mockGetRuleUsage('fk_coupon_expiry')).length).toBeGreaterThan(0)

      await deleteProject('prj_checkout_demo')

      await expect(getTestPublication(accepted.publicationId)).rejects.toMatchObject({ status: 404, code: 'ANALYSIS_RUN_NOT_FOUND' })
      await expect(mockListRunComparisons('arun_checkout_pr45')).rejects.toMatchObject({ status: 404 })
      await expect(mockGetRunComparison(comparison.comparisonId)).rejects.toMatchObject({ status: 404 })
      await expect(mockGetExperiment(experiment.experimentId)).rejects.toMatchObject({ status: 404 })
      await expect(mockGetAnalysisRunContextTrace('arun_checkout_pr45')).rejects.toMatchObject({ status: 404, code: 'ANALYSIS_RUN_NOT_FOUND' })
      await expect(mockGetRuleUsage('fk_coupon_expiry')).rejects.toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
      // Los del resto de proyectos siguen visibles.
      await expect(mockGetRuleUsage('fk_discount_engine')).resolves.toEqual([])
    })

    it('libera el repositorio: otro Project puede vincularlo', async () => {
      await deleteProject('prj_checkout_demo')
      const project = await mockCreateProject({ name: 'sin-binding' })
      await verifyGitHubAppAccess({ repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service' })
      expect(await createRepositoryBinding(project.id, { repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service', integrationBranch: 'develop' })).toMatchObject({ status: 'ENABLED' })
    })

    it('el segundo DELETE del mock responde 404 PROJECT_NOT_FOUND, pero deleteProject trata ese reintento como éxito', async () => {
      await deleteProject('prj_checkout_demo')
      await expect(mockDeleteProject('prj_checkout_demo')).rejects.toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
      await expect(deleteProject('prj_checkout_demo')).resolves.toBeUndefined()
    })
  })
})

describe('control-plane api (mock) — HU32 Analysis Runs, los 16 escenarios', () => {
  it('lista los 16 Analysis Runs (incluye los escenarios de organizaciones)', async () => {
    const page = await listAnalysisRuns()
    expect(page.items).toHaveLength(16)
  })

  it('filtra por proyecto y por status', async () => {
    const checkoutRuns = await listAnalysisRuns('prj_checkout_demo')
    expect(checkoutRuns.items.every((run) => run.projectId === 'prj_checkout_demo')).toBe(true)
    expect(checkoutRuns.items).toHaveLength(7)

    const successRuns = await listAnalysisRuns(undefined, 'SUCCESS')
    expect(successRuns.items.map((run) => run.id).sort()).toEqual(['arun_billing_pr17_2', 'arun_billing_pr23', 'arun_checkout_pr45', 'arun_checkout_pr49', 'arun_checkout_pr50', 'arun_org_orders_pr8'])
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

describe('control-plane api (live) — listado global HU55 implementado en Core (bundle B)', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('HU55: el listado global pide GET /analysis-runs sin projectId', async () => {
    const page = { items: [], nextCursor: null }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(page), { status: 200 }))
    await expect(listAnalysisRuns()).resolves.toEqual(page)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/analysis-runs$/), expect.anything())
  })

  it('HU55 agregado: recorre cursores opacos con limit=100 hasta la última página', async () => {
    const firstPage = { items: [{ id: 'run-1', projectId: 'p-1' }], nextCursor: 'opaque-cursor' }
    const secondPage = { items: [{ id: 'run-2', projectId: 'p-2' }], nextCursor: null }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      return new Response(JSON.stringify(String(input).includes('cursor=opaque-cursor') ? secondPage : firstPage), { status: 200 })
    })
    await expect(listAllAnalysisRuns()).resolves.toEqual([...firstPage.items, ...secondPage.items])
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[0][0])).toContain('limit=100')
    expect(String(fetchMock.mock.calls[1][0])).toContain('cursor=opaque-cursor')
  })
})

describe('control-plane api (live) — HU39/HU40 test-proposals y companion PR, Core ya lo implementó (INTEROP-2.2 §6.12, handoff 2026-09-19)', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('listTestProposals pide GET /analysis-runs/{id}/test-proposals', async () => {
    const set = { analysisRunId: 'arun_real', headSha: 'abc123', items: [] }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(set), { status: 200 }))
    await expect(listTestProposals('arun_real')).resolves.toEqual(set)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/analysis-runs/arun_real/test-proposals'), expect.anything())
  })

  it('createTestPublication pide POST /analysis-runs/{id}/test-publications con proposalIds', async () => {
    const accepted = { status: 'PENDING', pollAfterMs: 500, publicationId: 'pub_1', analysisRunId: 'arun_real' }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(accepted), { status: 202 }))
    const input = { proposalIds: ['prop_1', 'prop_2'] }
    await expect(createTestPublication('arun_real', input)).resolves.toEqual(accepted)
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/analysis-runs/arun_real/test-publications'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
    )
  })

  it('getTestPublication pide GET /test-publications/{id}', async () => {
    const publication = { id: 'pub_1', analysisRunId: 'arun_real', sourceHeadSha: 'abc123', status: 'PUBLISHED', branchName: 'x', companionPullRequestNumber: 2, companionPullRequestUrl: 'https://x', failureMessage: null, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(publication), { status: 200 }))
    await expect(getTestPublication('pub_1')).resolves.toEqual(publication)
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/test-publications/pub_1'), expect.anything())
  })
})

describe('control-plane api (live) — HU30 repository binding, Core ya lo implementó (Render+Supabase+GitHub reales, handoff 2026-09-17)', () => {
  beforeEach(() => setDataSourceForTests('live'))

  it('getRepositoryBinding traduce 404 REPOSITORY_BINDING_NOT_FOUND a null', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 'REPOSITORY_BINDING_NOT_FOUND', message: 'x' }), { status: 404 }))
    await expect(getRepositoryBinding('prj_real')).resolves.toBeNull()
  })

  it('getRepositoryBinding NO enmascara otros 404: PROJECT_NOT_FOUND se propaga', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 'PROJECT_NOT_FOUND', message: 'x' }), { status: 404 }))
    await expect(getRepositoryBinding('prj_real')).rejects.toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
  })

  it('getRepositoryBinding devuelve un binding DISABLED tal cual (Core lo deja vivo al desconectar)', async () => {
    const binding = { projectId: 'prj_real', installationId: 'inst_1', repositoryId: 'repo_1', repositoryName: 'acme/repo', integrationBranch: 'main', status: 'DISABLED', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(binding), { status: 200 }))
    await expect(getRepositoryBinding('prj_real')).resolves.toMatchObject({ status: 'DISABLED' })
  })

  it('getRepositoryBinding distingue 404 REPOSITORY_BINDING_NOT_FOUND (Project vivo sin binding: null) de 404 PROJECT_NOT_FOUND (se propaga)', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ code: 'REPOSITORY_BINDING_NOT_FOUND', message: 'x' }), { status: 404 }))
    await expect(getRepositoryBinding('prj_real')).resolves.toBeNull()
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ code: 'PROJECT_NOT_FOUND', message: 'x' }), { status: 404 }))
    await expect(getRepositoryBinding('prj_real')).rejects.toMatchObject({ status: 404, code: 'PROJECT_NOT_FOUND' })
  })

  it('createRepositoryBinding propaga 404 GITHUB_REPOSITORY_NOT_FOUND y 409 REPOSITORY_ALREADY_BOUND con su código', async () => {
    const input = { repositoryId: 'repo_1', repositoryName: 'acme/repo', integrationBranch: 'main' }
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ code: 'GITHUB_REPOSITORY_NOT_FOUND', message: 'x', correlationId: 'corr-1' }), { status: 404 }))
    await expect(createRepositoryBinding('prj_real', input)).rejects.toMatchObject({ status: 404, code: 'GITHUB_REPOSITORY_NOT_FOUND', correlationId: 'corr-1' })
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ code: 'REPOSITORY_ALREADY_BOUND', message: 'x' }), { status: 409 }))
    await expect(createRepositoryBinding('prj_real', input)).rejects.toMatchObject({ status: 409, code: 'REPOSITORY_ALREADY_BOUND' })
  })

  describe('enableRepository (HU57, INTEROP-2.3 implementado en Core)', () => {
    afterEach(() => setAuthTokenProvider(null))

    it('pide POST /projects/{projectId}/integrations/github/enable sin cuerpo, con Authorization, y devuelve el binding 200', async () => {
      setAuthTokenProvider(() => 'token-123')
      const binding = { projectId: 'prj real', installationId: 'inst_2', repositoryId: 'repo_1', repositoryName: 'acme/repo', integrationBranch: 'main', status: 'ENABLED', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-02T00:00:00.000Z' }
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(binding), { status: 200 }))

      await expect(enableRepository('prj real')).resolves.toEqual(binding)

      expect(fetchMock).toHaveBeenCalledTimes(1)
      const [url, init] = fetchMock.mock.calls[0]
      expect(String(url)).toMatch(/\/projects\/prj%20real\/integrations\/github\/enable$/)
      expect(init).toMatchObject({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer token-123' }) })
      expect(init?.body).toBeUndefined()
    })

    it.each([
      [403, 'GITHUB_APP_ACCESS_REQUIRED'],
      [404, 'PROJECT_NOT_FOUND'],
      [404, 'REPOSITORY_BINDING_NOT_FOUND'],
    ])('propaga %i %s con su código', async (status, code) => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code, message: 'x', correlationId: 'corr-9' }), { status }))
      await expect(enableRepository('prj_real')).rejects.toMatchObject({ status, code, correlationId: 'corr-9' })
    })
  })

  describe('deleteProject (HU56, INTEROP-2.3 implementado en Core)', () => {
    afterEach(() => setAuthTokenProvider(null))

    it('pide DELETE /projects/{projectId} con Authorization y resuelve con el 204 sin cuerpo', async () => {
      setAuthTokenProvider(() => 'token-123')
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))

      await expect(deleteProject('prj_real')).resolves.toBeUndefined()

      const [url, init] = fetchMock.mock.calls[0]
      expect(String(url)).toMatch(/\/projects\/prj_real$/)
      expect(init).toMatchObject({ method: 'DELETE', headers: expect.objectContaining({ Authorization: 'Bearer token-123' }) })
    })

    it('un 404 PROJECT_NOT_FOUND (reintento sobre un Project ya borrado) se trata como éxito', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ code: 'PROJECT_NOT_FOUND', message: 'x' }), { status: 404 }))
      await expect(deleteProject('prj_real')).resolves.toBeUndefined()
    })

    it('otros errores no se tragan: 404 con otro código y 500 se propagan', async () => {
      const fetchMock = vi.spyOn(globalThis, 'fetch')
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ code: 'OTHER_NOT_FOUND', message: 'x' }), { status: 404 }))
      await expect(deleteProject('prj_real')).rejects.toMatchObject({ status: 404, code: 'OTHER_NOT_FOUND' })
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ code: 'INTERNAL_ERROR', message: 'x' }), { status: 500 }))
      await expect(deleteProject('prj_real')).rejects.toMatchObject({ status: 500 })
    })
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
    await expect(listGitHubUserRepositories('gho_demo_token', '2000001')).resolves.toEqual(page)
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
