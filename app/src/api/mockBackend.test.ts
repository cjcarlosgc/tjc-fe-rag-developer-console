import { expect, test, vi } from 'vitest'
import { listAnalysisHistory } from '../analysis/api'
import { getExperiment, startExperiment } from '../experiments/api'
import { getTestInventory } from '../inventory/api'
import { createProject, listProjects } from '../projects/api'
import { setDataSourceForTests } from './dataSource'
import { mockGetEvidence, mockGetRepositoryBinding, resetMockBackend, DEMO_RETRIEVAL_PHP_COMPARISON_ID } from './mockBackend'
import { UNSUPPORTED_PROJECT_MESSAGE } from '../control-plane/errors'
import { getAnalysisRun } from '../control-plane/api'
import { listRetrievalComparisons, startRetrievalComparison } from '../retrieval-comparison/api'
import { ApiError } from './client'

const KEY_A = '3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f'

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

test('mantiene la comparación experimental a partir de una instantánea disponible', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  const project = (await listProjects('1000001')).items.find((item) => item.id === 'prj_checkout_demo')!
  const target = (await getTestInventory(project.currentVersionId!)).targets.find((item) => item.targetType === 'FUNCTION')!

  const accepted = await startExperiment(project.id, target.id, crypto.randomUUID())
  let experiment = await getExperiment(accepted.experimentId, target.symbolName)
  for (let index = 0; index < 3 && experiment.status !== 'COMPLETED'; index += 1)
    experiment = await getExperiment(accepted.experimentId, target.symbolName)

  expect(experiment.result?.rag.validRate).toBeGreaterThan(experiment.result?.baseline.validRate ?? 1)
  expect(fetchMock).not.toHaveBeenCalled()
})

test('WI-CONSOLE-021: escenarios DEMO de experimento cubren corrida previa, Sandbox mixto, sin datos evaluables y FAILED', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const fetchMock = vi.spyOn(globalThis, 'fetch')

  const legacy = await getExperiment(
    (await startExperiment('prj_checkout_demo', 'demo-scenario-legacy', crypto.randomUUID())).experimentId,
    'DEMO',
  )
  expect(legacy.status).toBe('COMPLETED')
  expect(legacy.configuration).toEqual({ model: null, budget: null, executionProfile: null, runnerHint: null, randomizationSeed: null })
  expect(
    legacy.result?.repetitions.every((item) => item.executionDurationMs === null && item.pairId === null && item.pairPosition === null),
  ).toBe(true)

  const mixed = await getExperiment(
    (await startExperiment('prj_checkout_demo', 'demo-scenario-mixed-sandbox', crypto.randomUUID())).experimentId,
    'DEMO',
  )
  expect(mixed.configuration?.budget).toBeNull()
  expect(mixed.configuration?.model?.provider).toBe('OpenAI')
  const durations = mixed.result?.repetitions.map((item) => item.executionDurationMs) ?? []
  expect(durations).toContain(7)
  expect(durations).toContain(null)
  expect(durations).not.toContain(0)

  const noEvaluable = await getExperiment(
    (await startExperiment('prj_checkout_demo', 'demo-scenario-no-evaluable', crypto.randomUUID())).experimentId,
    'DEMO',
  )
  expect(noEvaluable.result?.baseline).toMatchObject({
    validRate: null,
    passedRate: null,
    totalDurationMs: null,
    evaluableRepetitions: 0,
    nonEvaluableRepetitions: 3,
  })
  expect(noEvaluable.result?.rag.evaluableRepetitions).toBe(3)

  // WI-CONSOLE-026: bundle de una corrida legacy sin filas experimental[]/sandbox[] (sin attempt/technicallyEvaluable inventados); generation[] se conserva con attempt null.
  const legacyId = (await startExperiment('prj_checkout_demo', 'demo-scenario-legacy', crypto.randomUUID())).experimentId
  const legacyBundle = await mockGetEvidence('EXPERIMENT', legacyId)
  expect(legacyBundle.experimental).toEqual([])
  expect(legacyBundle.sandbox).toEqual([])
  expect(legacyBundle.generation.length).toBe(2)
  expect(legacyBundle.generation.every((row) => row.attempt === null)).toBe(true)
  expect(JSON.stringify(legacyBundle)).not.toMatch(/"technicallyEvaluable":false/)

  // WI-CONSOLE-026: con datos, las filas se emiten tal cual (attempt 2 y technicallyEvaluable false de la repetición RAG r1).
  const mixedId = (await startExperiment('prj_checkout_demo', 'demo-scenario-mixed-sandbox', crypto.randomUUID())).experimentId
  const mixedBundle = await mockGetEvidence('EXPERIMENT', mixedId)
  expect(mixedBundle.experimental.some((row) => row.attempt === 2 && row.technicallyEvaluable === false)).toBe(true)
  expect(mixedBundle.sandbox.some((row) => row.attempt === 2)).toBe(true)
  expect(mixedBundle.experimental.every((row) => typeof row.technicallyEvaluable === 'boolean')).toBe(true)

  // WI-CONSOLE-026 C2: el 422 UNSUPPORTED_PROJECT del mock reutiliza el texto compartido, sin variante DEMO.
  await expect(startExperiment('prj_checkout_demo', 'demo-error-unsupported-project', crypto.randomUUID())).rejects.toMatchObject({
    code: 'UNSUPPORTED_PROJECT',
    message: UNSUPPORTED_PROJECT_MESSAGE,
  })

  // WI-CONSOLE-021 C1: Project PHP con PHPUnit (CS-CORE-20261009-018). Sin 422 de lenguaje; perfil y runner tal cual.
  const phpunit = await getExperiment(
    (await startExperiment('prj_checkout_demo', 'demo-scenario-phpunit', crypto.randomUUID())).experimentId,
    'DEMO',
  )
  expect(phpunit.configuration).toMatchObject({ executionProfile: 'PHP_LARAVEL_PHPUNIT', runnerHint: 'PHPUNIT' })
  expect(phpunit.result?.repetitions.some((row) => row.failureType === 'COMPILATION' && row.attempt === 1)).toBe(true)

  const failed = await getExperiment(
    (await startExperiment('prj_checkout_demo', 'demo-scenario-failed-worker-lost', crypto.randomUUID())).experimentId,
    'DEMO',
  )
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

// WI-CONSOLE-030 (C1/C4): Projects PHP demo en team-sandbox (2000003, ADMIN).
test('WI-CONSOLE-030 (C1): team-sandbox lista shop-php-demo (PHP con PHPUnit) y legacy-php-admin', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()

  const projects = (await listProjects('2000003')).items
  expect(projects.map((project) => project.id).sort()).toEqual(['prj_legacy_php_demo', 'prj_shop_php_demo'])
  expect(projects.every((project) => project.role === 'ADMIN')).toBe(true)

  const shopHistory = await listAnalysisHistory('prj_shop_php_demo')
  const shopCurrent = shopHistory.find((version) => version.current)!
  expect(shopCurrent.id).toBe('ver_shop_php_1')
  expect(shopCurrent.language).toBe('PHP')
  expect(shopCurrent.detectedFramework).toBe('PHPUNIT')

  const inventory = await getTestInventory('ver_shop_php_1')
  expect(inventory.language).toBe('PHP')
  expect(inventory.detectedFramework).toBe('PHPUNIT')
  expect(inventory.targetsWithTest + inventory.targetsMissingTest).toBe(inventory.targetsTotal)
  expect(inventory.targets.every((target) => target.filePath.endsWith('.php'))).toBe(true)
  expect(inventory.targets.some((target) => target.methodName === 'apply' && target.hasTest)).toBe(true)
})

test('WI-CONSOLE-030 (C1): el Run PHP arun_php_pr7 trae símbolos PHP y la semilla rcmp_demo_seed_php cuelga de él', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()

  const run = await getAnalysisRun('arun_php_pr7')
  expect(run.projectId).toBe('prj_shop_php_demo')
  expect(run.status).toBe('SUCCESS')
  expect(run.symbols.length).toBeGreaterThan(0)
  expect(run.symbols.every((symbol) => symbol.language === 'PHP')).toBe(true)
  expect(run.symbols).toContainEqual({
    language: 'PHP',
    kind: 'METHOD',
    qualifiedName: 'CouponService::apply',
    filePath: 'app/Services/CouponService.php',
    changeKind: 'DIRECTLY_CHANGED',
  })
  expect(run.symbols.some((symbol) => symbol.changeKind === 'POTENTIALLY_IMPACTED')).toBe(true)
  expect(run.createdAt < '2026-09-13').toBe(true)

  const comparisons = await listRetrievalComparisons('arun_php_pr7')
  expect(comparisons.items.map((item) => item.id)).toContain(DEMO_RETRIEVAL_PHP_COMPARISON_ID)
  expect(comparisons.items.every((item) => item.analysisRunId === 'arun_php_pr7')).toBe(true)
  // La semilla ya no vive en arun_checkout_pr49.
  const checkout = await listRetrievalComparisons('arun_checkout_pr49')
  expect(checkout.items.map((item) => item.id)).not.toContain(DEMO_RETRIEVAL_PHP_COMPARISON_ID)
})

test('WI-CONSOLE-030 (C4): legacy-php-admin (PHP sin PHPUnit) responde 422 UNSUPPORTED_PROJECT en OE2 y no crea comparación', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()

  const legacy = await listProjects('2000003')
  const legacyProject = legacy.items.find((project) => project.id === 'prj_legacy_php_demo')!
  expect(legacyProject.currentVersionId).toBe('ver_legacy_php_1')
  expect((await getTestInventory('ver_legacy_php_1')).detectedFramework).toBeNull()

  const run = await getAnalysisRun('arun_legacy_php_pr3')
  const symbol = run.symbols[0]
  const error = await startRetrievalComparison('arun_legacy_php_pr3', symbol, KEY_A).then(
    () => null,
    (reason: unknown) => reason,
  )
  expect(error).toBeInstanceOf(ApiError)
  expect((error as ApiError).status).toBe(422)
  expect((error as ApiError).code).toBe('UNSUPPORTED_PROJECT')
  expect((error as ApiError).message).toBe(UNSUPPORTED_PROJECT_MESSAGE)
  expect((await listRetrievalComparisons('arun_legacy_php_pr3')).items).toHaveLength(0)

  // El mismo símbolo PHP en el Project con PHPUnit sí se acepta: el 422 depende del framework de la versión, no del lenguaje.
  const accepted = await startRetrievalComparison('arun_php_pr7', (await getAnalysisRun('arun_php_pr7')).symbols[0], KEY_A)
  expect(accepted.status).toBe('PENDING')
})

// WI-CONSOLE-030 (F4): sin framework de pruebas detectado, ningún target del inventario tiene test.
test('WI-CONSOLE-030 (F4): legacy-php-admin (sin framework) tiene todos los targets sin test y contadores coherentes', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()

  const inventory = await getTestInventory('ver_legacy_php_1')
  expect(inventory.detectedFramework).toBeNull()
  expect(inventory.targets.length).toBe(inventory.targetsTotal)
  expect(inventory.targets.every((target) => target.hasTest === false && target.testFilePaths.length === 0)).toBe(true)
  expect(inventory.targetsWithTest).toBe(0)
  expect(inventory.targetsMissingTest).toBe(inventory.targetsTotal)

  const legacy = (await listAnalysisHistory('prj_legacy_php_demo')).find((version) => version.current)!
  expect(legacy.targetsWithTest).toBe(0)
  expect(legacy.targetsMissingTest).toBe(legacy.targetsTotal)
})

// WI-CONSOLE-030 (F3): shop-php-demo tiene repositorio vinculado coherente con sus PRs (team-sandbox/demo-api).
test('WI-CONSOLE-030 (F3): shop-php-demo está vinculado a team-sandbox/demo-api, donde están sus PRs', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()

  const binding = await mockGetRepositoryBinding('prj_shop_php_demo')
  expect(binding).toMatchObject({
    projectId: 'prj_shop_php_demo',
    repositoryId: 'repo_team_sandbox',
    repositoryName: 'team-sandbox/demo-api',
    status: 'ENABLED',
  })
  expect((await getAnalysisRun('arun_php_pr7')).pullRequest.repositoryName).toBe(binding!.repositoryName)
})

// WI-CONSOLE-030 (F1): el historial de un Run en cola solo tiene la creación; uno en proceso no declara generación completada.
test('WI-CONSOLE-030 (F1): historial coherente para Runs QUEUED y PROCESSING', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()

  const queued = await getAnalysisRun('arun_checkout_pr53')
  expect(queued.status).toBe('QUEUED')
  expect(queued.attemptCount).toBe(0)
  expect(queued.history?.map((item) => item.toStatus)).toEqual(['QUEUED'])
  expect(queued.history?.some((item) => item.reason === 'GENERATION_COMPLETED')).toBe(false)

  const processing = await getAnalysisRun('arun_billing_pr25')
  expect(processing.status).toBe('PROCESSING')
  expect(processing.history?.at(-1)?.toStatus).toBe('PROCESSING')
  expect(processing.history?.some((item) => item.reason === 'GENERATION_COMPLETED')).toBe(false)
  expect(processing.history?.some((item) => item.fromStatus === 'PROCESSING' && item.toStatus === 'PROCESSING')).toBe(false)
})

// WI-CONSOLE-047 (obs. 4): fuente única de Action Required en el demo. Un Run está en ACTION_REQUIRED sii aparece en la bandeja.
test('WI-CONSOLE-047 (obs. 4): un Run es ACTION_REQUIRED sii aparece en la bandeja Action Required, con actionRequiredCount = preguntas PENDING', async () => {
  setDataSourceForTests('mock')
  resetMockBackend()
  const { listAnalysisRuns } = await import('../control-plane/api')
  const { listActionRequired } = await import('../action-required/api')
  const { items: runs } = await listAnalysisRuns()
  const waiting = runs.filter((run) => run.status === 'ACTION_REQUIRED')
  const inbox = (await listActionRequired()).items
  expect(inbox.map((item) => item.analysisRunId).sort()).toEqual(waiting.map((run) => run.id).sort())
  expect(waiting.map((run) => run.id).sort()).toEqual([
    'arun_billing_pr24',
    'arun_checkout_pr42',
    'arun_checkout_pr52',
    'arun_org_metrics_pr15',
    'arun_org_writer_pr21',
  ])
  // Run de HEAD superado (OBSOLETE): conserva su escenario, pero no está vigente y no entra en la bandeja.
  expect(runs.find((run) => run.id === 'arun_billing_pr17')?.status).toBe('OBSOLETE')
  const pendingPerRun: Record<string, number> = {
    arun_checkout_pr42: 2,
    arun_billing_pr24: 1,
    arun_checkout_pr52: 1,
    arun_org_metrics_pr15: 1,
    arun_org_writer_pr21: 1,
  }
  for (const run of waiting) expect(run.actionRequiredCount).toBe(pendingPerRun[run.id])
})
