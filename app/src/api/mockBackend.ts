import type { ArtifactViewModel } from '../artifacts/types'
import type { ExperimentAccepted, ExperimentOperation, ExperimentResultViewModel } from '../experiments/types'
import type { GenerationAccepted, GenerationConfiguration } from '../generation/types'
import type { InventoryTargetViewModel, TestInventoryResponse } from '../inventory/types'
import type { AnalysisHistoryItem, AnalysisOperation, AnalysisResult, CreateProjectInput, Project, UploadAccepted } from '../projects/types'
import type { GenerationMode, RunViewModel, TargetRetryAccepted, TargetRunViewModel, TestRunHistoryPage, TestRunSummary } from '../runs/types'
import { ApiError } from './client'

interface MockVersionState {
  operation: AnalysisOperation
  result?: AnalysisResult
  inventory?: TestInventoryResponse
  polls: number
}

interface MockRunState {
  run: RunViewModel
  projectVersionId: string
  mode: GenerationMode
  createdAt: string
  completedAt: string | null
  polls: number
  /** HU24: el target en curso de reintento y su propio contador de pasos, independiente de `polls`. */
  retryingTargetId: string | null
  retryPolls: number
}

interface MockExperimentState {
  operation: ExperimentOperation
  polls: number
}

const projects = new Map<string, Project>()
const versions = new Map<string, MockVersionState>()
const runs = new Map<string, MockRunState>()
const artifacts = new Map<string, ArtifactViewModel[]>()
const experiments = new Map<string, MockExperimentState>()
let sequence = 2000

const clone = <T>(value: T): T => structuredClone(value)
const nowIso = () => new Date().toISOString()
const latency = () => new Promise<void>((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : 180))

function notFound(message: string, code: string): never {
  throw new ApiError(message, 404, 'demo-correlation-id', code)
}

function buildInventory(projectVersionId: string, revision = 7): TestInventoryResponse {
  const allTargets: TestInventoryResponse['targets'] = [
    { id: `${projectVersionId}-class-order`, filePath: 'src/domain/OrderService.ts', symbolName: 'OrderService', methodName: null, targetType: 'CLASS', hasTest: true, testFilePaths: ['src/domain/OrderService.spec.ts'] },
    { id: `${projectVersionId}-method-create`, filePath: 'src/domain/OrderService.ts', symbolName: 'OrderService', methodName: 'createOrder', targetType: 'METHOD', hasTest: true, testFilePaths: ['src/domain/OrderService.spec.ts'] },
    { id: `${projectVersionId}-method-total`, filePath: 'src/domain/OrderService.ts', symbolName: 'OrderService', methodName: 'calculateTotal', targetType: 'METHOD', hasTest: false, testFilePaths: [] },
    { id: `${projectVersionId}-class-coupon`, filePath: 'src/domain/CouponPolicy.ts', symbolName: 'CouponPolicy', methodName: null, targetType: 'CLASS', hasTest: false, testFilePaths: [] },
    { id: `${projectVersionId}-function-money`, filePath: 'src/shared/money.ts', symbolName: 'formatCurrency', methodName: null, targetType: 'FUNCTION', hasTest: false, testFilePaths: [] },
  ]
  const targets = revision === 5 ? [allTargets[0], allTargets[2], allTargets[3]] : revision === 6 ? allTargets.slice(0, 4) : allTargets
  const targetsWithTest = targets.filter((target) => target.hasTest).length
  return { projectVersionId, detectedFramework: 'VITEST', targetsTotal: targets.length, targetsWithTest, targetsMissingTest: targets.length - targetsWithTest, targets }
}

function seed(): void {
  const completedAt = '2026-08-31T14:18:00.000Z'
  const project: Project = { id: 'prj_checkout_demo', name: 'checkout-service', currentVersionId: 'ver_checkout_7', createdAt: '2026-08-24T09:30:00.000Z', updatedAt: completedAt }
  const emptyProject: Project = { id: 'prj_billing_demo', name: 'billing-engine', currentVersionId: null, createdAt: '2026-08-30T16:45:00.000Z', updatedAt: '2026-08-30T16:45:00.000Z' }
  projects.set(project.id, project)
  projects.set(emptyProject.id, emptyProject)
  versions.set('ver_checkout_7', {
    polls: 0,
    operation: { id: 'ver_checkout_7', projectId: project.id, status: 'COMPLETED', originalFileName: 'checkout-service-v7.zip', sizeBytes: 3_842_110, filesProcessed: 47, chunksCount: 186, failureReason: null, startedAt: '2026-08-31T14:17:12.000Z', completedAt, createdAt: '2026-08-31T14:17:10.000Z', updatedAt: completedAt },
    result: { id: 'ver_checkout_7', projectId: project.id, status: 'COMPLETED', filesProcessed: 47, chunksCount: 186, detectedFramework: 'VITEST', targetsTotal: 5, targetsWithTest: 2, targetsMissingTest: 3, completedAt },
    inventory: buildInventory('ver_checkout_7'),
  })
  versions.set('ver_checkout_6', {
    polls: 0,
    operation: { id: 'ver_checkout_6', projectId: project.id, status: 'COMPLETED', originalFileName: 'checkout-service-v6.zip', sizeBytes: 3_614_220, filesProcessed: 43, chunksCount: 164, failureReason: null, startedAt: '2026-08-28T10:05:04.000Z', completedAt: '2026-08-28T10:06:21.000Z', createdAt: '2026-08-28T10:05:00.000Z', updatedAt: '2026-08-28T10:06:21.000Z' },
    result: { id: 'ver_checkout_6', projectId: project.id, status: 'COMPLETED', filesProcessed: 43, chunksCount: 164, detectedFramework: 'VITEST', targetsTotal: 4, targetsWithTest: 2, targetsMissingTest: 2, completedAt: '2026-08-28T10:06:21.000Z' },
    inventory: buildInventory('ver_checkout_6', 6),
  })
  versions.set('ver_checkout_5', {
    polls: 0,
    operation: { id: 'ver_checkout_5', projectId: project.id, status: 'COMPLETED', originalFileName: 'checkout-service-v5.zip', sizeBytes: 3_198_440, filesProcessed: 38, chunksCount: 141, failureReason: null, startedAt: '2026-08-24T09:34:08.000Z', completedAt: '2026-08-24T09:35:30.000Z', createdAt: '2026-08-24T09:34:00.000Z', updatedAt: '2026-08-24T09:35:30.000Z' },
    result: { id: 'ver_checkout_5', projectId: project.id, status: 'COMPLETED', filesProcessed: 38, chunksCount: 141, detectedFramework: 'VITEST', targetsTotal: 3, targetsWithTest: 1, targetsMissingTest: 2, completedAt: '2026-08-24T09:35:30.000Z' },
    inventory: buildInventory('ver_checkout_5', 5),
  })
  const seededTargets: TargetRunViewModel[] = [
    { id: 'ver_checkout_7-method-total', label: 'calculateTotal', filePath: 'src/domain/OrderService.ts', status: 'VALID', compiled: true, executed: true, passed: true, valid: true, failureType: 'NONE' },
    { id: 'ver_checkout_7-class-coupon', label: 'CouponPolicy', filePath: 'src/domain/CouponPolicy.ts', status: 'INVALID', compiled: true, executed: true, passed: false, valid: false, failureType: 'TEST_ASSERTION', errorSummary: 'Expected discount to be 20, received 15.', errorDetail: 'AssertionError: expected 15 to be 20\n  at CouponPolicy.spec.ts:10:42' },
  ]
  runs.set('run_checkout_seed', {
    polls: 3,
    run: { id: 'run_checkout_seed', status: 'PARTIAL', processed: 2, total: 2, targets: seededTargets },
    projectVersionId: 'ver_checkout_7',
    mode: 'PROJECT_MISSING',
    createdAt: '2026-08-31T15:00:00.000Z',
    completedAt: '2026-08-31T15:02:40.000Z',
    retryingTargetId: null,
    retryPolls: 0,
  })
  artifacts.set('run_checkout_seed', buildArtifacts('run_checkout_seed', inventoryViewTargets(buildInventory('ver_checkout_7'))))
}

export function resetMockBackend(): void {
  projects.clear()
  versions.clear()
  runs.clear()
  artifacts.clear()
  experiments.clear()
  sequence = 2000
  seed()
}

resetMockBackend()

export async function mockListProjects(): Promise<Project[]> {
  await latency()
  return Array.from(projects.values()).map(clone)
}

export async function mockGetProject(projectId: string): Promise<Project> {
  await latency()
  const project = projects.get(projectId)
  if (!project) notFound(`No existe el proyecto demo "${projectId}".`, 'PROJECT_NOT_FOUND')
  return clone(project)
}

export async function mockListAnalysisHistory(projectId: string): Promise<AnalysisHistoryItem[]> {
  await latency()
  const project = projects.get(projectId)
  if (!project) notFound(`No existe el proyecto demo "${projectId}".`, 'PROJECT_NOT_FOUND')
  return Array.from(versions.values())
    .filter((state) => state.operation.projectId === projectId)
    .map((state): AnalysisHistoryItem => ({
      id: state.operation.id,
      projectId,
      status: state.operation.status,
      originalFileName: state.operation.originalFileName,
      filesProcessed: state.operation.filesProcessed,
      chunksCount: state.operation.chunksCount,
      detectedFramework: state.result?.detectedFramework ?? null,
      targetsTotal: state.result?.targetsTotal ?? null,
      targetsWithTest: state.result?.targetsWithTest ?? null,
      targetsMissingTest: state.result?.targetsMissingTest ?? null,
      createdAt: state.operation.createdAt,
      completedAt: state.operation.completedAt,
      current: project.currentVersionId === state.operation.id,
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(clone)
}

export async function mockCreateProject(input: CreateProjectInput): Promise<Project> {
  await latency()
  sequence += 1
  const createdAt = nowIso()
  const project: Project = { id: `prj_demo_${sequence}`, name: input.name.trim(), currentVersionId: null, createdAt, updatedAt: createdAt }
  projects.set(project.id, project)
  return clone(project)
}

export async function mockUploadProjectVersion(projectId: string, file: File): Promise<UploadAccepted> {
  await latency()
  const project = projects.get(projectId)
  if (!project) notFound(`No existe el proyecto demo "${projectId}".`, 'PROJECT_NOT_FOUND')
  sequence += 1
  const id = `ver_demo_${sequence}`
  const createdAt = nowIso()
  versions.set(id, {
    polls: 0,
    operation: { id, projectId, status: 'PENDING', originalFileName: file.name, sizeBytes: file.size, filesProcessed: null, chunksCount: null, failureReason: null, startedAt: null, completedAt: null, createdAt, updatedAt: createdAt },
  })
  return { projectId, projectVersionId: id, status: 'PENDING', pollAfterMs: 320 }
}

function completeVersion(state: MockVersionState): void {
  const completedAt = nowIso()
  state.operation = { ...state.operation, status: 'COMPLETED', filesProcessed: 39, chunksCount: 152, completedAt, updatedAt: completedAt }
  state.result = { id: state.operation.id, projectId: state.operation.projectId, status: 'COMPLETED', filesProcessed: 39, chunksCount: 152, detectedFramework: 'VITEST', targetsTotal: 5, targetsWithTest: 2, targetsMissingTest: 3, completedAt }
  state.inventory = buildInventory(state.operation.id)
  const project = projects.get(state.operation.projectId)
  if (project) projects.set(project.id, { ...project, currentVersionId: state.operation.id, updatedAt: completedAt })
}

export async function mockGetAnalysisOperation(projectVersionId: string): Promise<AnalysisOperation> {
  await latency()
  const state = versions.get(projectVersionId)
  if (!state) notFound(`No existe la ProjectVersion demo "${projectVersionId}".`, 'PROJECT_VERSION_NOT_FOUND')
  if (state.operation.status !== 'COMPLETED' && state.operation.status !== 'FAILED') {
    const stages: AnalysisOperation['status'][] = ['EXTRACTING', 'ANALYZING', 'CHUNKING', 'EMBEDDING', 'PERSISTING', 'COMPLETED']
    const status = stages[Math.min(state.polls, stages.length - 1)]
    state.polls += 1
    state.operation = { ...state.operation, status, startedAt: state.operation.startedAt ?? nowIso(), updatedAt: nowIso() }
    if (status === 'COMPLETED') completeVersion(state)
  }
  return clone(state.operation)
}

export async function mockGetAnalysisResult(projectVersionId: string): Promise<AnalysisResult> {
  await latency()
  const state = versions.get(projectVersionId)
  if (!state) notFound(`No existe la ProjectVersion demo "${projectVersionId}".`, 'PROJECT_VERSION_NOT_FOUND')
  if (!state.result) throw new ApiError('La versión demo todavía no finalizó.', 409, 'demo-correlation-id', 'ANALYSIS_NOT_FINISHED')
  return clone(state.result)
}

export async function mockGetTestInventory(projectVersionId: string): Promise<TestInventoryResponse> {
  await latency()
  const state = versions.get(projectVersionId)
  if (!state) notFound(`No existe la ProjectVersion demo "${projectVersionId}".`, 'PROJECT_VERSION_NOT_FOUND')
  if (!state.inventory) throw new ApiError('El inventario demo todavía no está disponible.', 409, 'demo-correlation-id', 'ANALYSIS_NOT_FINISHED')
  return clone(state.inventory)
}

function inventoryViewTargets(inventory: TestInventoryResponse): InventoryTargetViewModel[] {
  return inventory.targets.map((target) => ({ id: target.id, filePath: target.filePath, symbolName: target.symbolName, methodName: target.methodName ?? undefined, kind: target.targetType, hasExistingTest: target.hasTest, testFilePaths: target.testFilePaths }))
}

function selectTargets(configuration: GenerationConfiguration, inventory: TestInventoryResponse): InventoryTargetViewModel[] {
  const all = inventoryViewTargets(inventory)
  if (configuration.mode === 'TARGET') return configuration.target ? [configuration.target] : []
  if (configuration.mode.startsWith('CLASS_')) {
    const symbolName = configuration.target?.symbolName
    return all.filter((target) => target.symbolName === symbolName && (configuration.mode === 'CLASS_ALL' || !target.hasExistingTest))
  }
  return all.filter((target) => configuration.mode === 'PROJECT_ALL' || !target.hasExistingTest)
}

function buildArtifacts(runId: string, selected: InventoryTargetViewModel[]): ArtifactViewModel[] {
  const primary = selected[0]
  const output: ArtifactViewModel[] = [{
    id: `${runId}-artifact-1`, runId, relativePath: primary ? primary.filePath.replace(/\.ts$/, '.spec.ts') : 'src/generated/demo.spec.ts', artifactType: 'CREATED', valid: true,
    lines: [
      { type: 'ADDED', newLineNumber: 1, content: "import { describe, expect, it } from 'vitest'" },
      { type: 'ADDED', newLineNumber: 2, content: "import { OrderService } from './OrderService'" },
      { type: 'ADDED', newLineNumber: 3, content: '' },
      { type: 'ADDED', newLineNumber: 4, content: "describe('OrderService', () => {" },
      { type: 'ADDED', newLineNumber: 5, content: "  it('calcula el total con descuentos', () => {" },
      { type: 'ADDED', newLineNumber: 6, content: '    expect(new OrderService().calculateTotal([])).toBe(0)' },
      { type: 'ADDED', newLineNumber: 7, content: '  })' },
      { type: 'ADDED', newLineNumber: 8, content: '})' },
    ],
  }]
  if (selected.length > 1) output.push({
    id: `${runId}-artifact-2`, runId, relativePath: 'src/domain/CouponPolicy.spec.ts', artifactType: 'MODIFIED', valid: false,
    lines: [
      { type: 'CONTEXT', oldLineNumber: 8, newLineNumber: 8, content: "describe('CouponPolicy', () => {" },
      { type: 'REMOVED', oldLineNumber: 9, content: "  it('applies coupon', () => {})" },
      { type: 'ADDED', newLineNumber: 9, content: "  it('rechaza cupones expirados', async () => {" },
      { type: 'ADDED', newLineNumber: 10, content: '    await expect(policy.apply(expired)).rejects.toThrow()' },
      { type: 'ADDED', newLineNumber: 11, content: '  })' },
      { type: 'CONTEXT', oldLineNumber: 10, newLineNumber: 12, content: '})' },
    ],
  })
  return output
}

export async function mockStartGeneration(configuration: GenerationConfiguration): Promise<GenerationAccepted> {
  await latency()
  const project = projects.get(configuration.projectId)
  if (!project?.currentVersionId) throw new ApiError('El proyecto demo no tiene una versión lista.', 409, 'demo-correlation-id', 'PROJECT_NOT_READY')
  const inventory = versions.get(project.currentVersionId)?.inventory
  if (!inventory) throw new ApiError('El inventario demo no está disponible.', 409, 'demo-correlation-id', 'PROJECT_NOT_READY')
  const selected = selectTargets(configuration, inventory)
  if (!selected.length) throw new ApiError('La configuración demo no resolvió targets.', 400, 'demo-correlation-id', 'INVALID_GENERATION_TARGET')
  sequence += 1
  const runId = `run_demo_${sequence}`
  const targets: TargetRunViewModel[] = selected.map((target) => ({ id: target.id, label: target.methodName ?? target.symbolName, filePath: target.filePath, status: 'PENDING' }))
  runs.set(runId, {
    polls: 0,
    run: { id: runId, status: 'PENDING', processed: 0, total: targets.length, targets },
    projectVersionId: project.currentVersionId,
    mode: configuration.mode,
    createdAt: nowIso(),
    completedAt: null,
    retryingTargetId: null,
    retryPolls: 0,
  })
  artifacts.set(runId, buildArtifacts(runId, selected))
  return { runId, projectId: project.id, projectVersionId: project.currentVersionId, status: 'PENDING', pollAfterMs: 420 }
}

function runTargetTotals(targets: TargetRunViewModel[]) {
  return {
    validTargets: targets.filter((target) => target.status === 'VALID').length,
    invalidTargets: targets.filter((target) => target.status === 'INVALID').length,
    failedTargets: targets.filter((target) => target.status === 'FAILED').length,
  }
}

export async function mockGetRun(runId: string): Promise<RunViewModel> {
  await latency()
  const state = runs.get(runId)
  if (!state) notFound(`No existe el run demo "${runId}".`, 'TEST_RUN_NOT_FOUND')
  if (state.retryingTargetId) {
    // HU24: un retry en curso avanza con su propio contador, sin reabrir el guion de generación inicial.
    state.retryPolls += 1
    const retryingId = state.retryingTargetId
    if (state.retryPolls === 1) {
      state.run = { ...state.run, status: 'GENERATING', targets: state.run.targets.map((target) => target.id === retryingId ? { ...target, status: 'GENERATING' } : target) }
    } else if (state.retryPolls === 2) {
      state.run = { ...state.run, status: 'VALIDATING', targets: state.run.targets.map((target) => target.id === retryingId ? { ...target, status: 'VALIDATING' } : target) }
    } else {
      const targets = state.run.targets.map((target) => target.id === retryingId
        ? { ...target, status: 'VALID' as const, compiled: true, executed: true, passed: true, valid: true, failureType: 'NONE' as const, errorSummary: undefined, errorDetail: undefined }
        : target)
      state.run = { ...state.run, status: targets.some((target) => target.status === 'INVALID' || target.status === 'FAILED') ? 'PARTIAL' : 'COMPLETED', targets }
      state.completedAt = nowIso()
      state.retryingTargetId = null
      state.retryPolls = 0
    }
  } else if (state.run.status !== 'COMPLETED' && state.run.status !== 'PARTIAL' && state.run.status !== 'FAILED') {
    state.polls += 1
    if (state.polls === 1) state.run = { ...state.run, status: 'GENERATING', processed: 0, targets: state.run.targets.map((target, index) => ({ ...target, status: index === 0 ? 'GENERATING' : 'PENDING' })) }
    else if (state.polls === 2) state.run = { ...state.run, status: 'VALIDATING', processed: Math.max(1, Math.floor(state.run.total / 2)), targets: state.run.targets.map((target) => ({ ...target, status: 'VALIDATING' })) }
    else {
      const terminalTargets: TargetRunViewModel[] = state.run.targets.map((target, index) => index === 1
        ? { ...target, status: 'INVALID', compiled: true, executed: true, passed: false, valid: false, failureType: 'TEST_ASSERTION', errorSummary: 'Expected discount to be 20, received 15.', errorDetail: 'AssertionError: expected 15 to be 20\n  at CouponPolicy.spec.ts:10:42' }
        : { ...target, status: 'VALID', compiled: true, executed: true, passed: true, valid: true, failureType: 'NONE' })
      state.run = { ...state.run, status: terminalTargets.some((target) => !target.valid) ? 'PARTIAL' : 'COMPLETED', processed: state.run.total, targets: terminalTargets }
      state.completedAt = nowIso()
    }
  }
  return clone(state.run)
}

/** HU20: `GET /project-versions/{projectVersionId}/test-runs?cursor&limit` — orden `createdAt` descendente. */
export async function mockListTestRunHistory(projectVersionId: string, cursor: string | null): Promise<TestRunHistoryPage> {
  await latency()
  if (!versions.has(projectVersionId)) notFound(`No existe la ProjectVersion demo "${projectVersionId}".`, 'PROJECT_VERSION_NOT_FOUND')
  const items: TestRunSummary[] = Array.from(runs.entries())
    .filter(([, state]) => state.projectVersionId === projectVersionId)
    .map(([id, state]) => ({
      id,
      mode: state.mode,
      status: state.run.status,
      totalTargets: state.run.total,
      ...runTargetTotals(state.run.targets),
      createdAt: state.createdAt,
      completedAt: state.completedAt,
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  void cursor
  return { items: items.map(clone), nextCursor: null }
}

/** HU24: `POST /test-runs/{runId}/targets/{targetId}/retry` sobre un target `INVALID`/`FAILED` de un run terminal. */
export async function mockRetryTarget(runId: string, targetId: string): Promise<TargetRetryAccepted> {
  await latency()
  const state = runs.get(runId)
  if (!state) notFound(`No existe el run demo "${runId}".`, 'TEST_RUN_NOT_FOUND')
  if (state.run.status !== 'COMPLETED' && state.run.status !== 'PARTIAL' && state.run.status !== 'FAILED') {
    throw new ApiError('El run demo todavía no llegó a un estado terminal.', 409, 'demo-correlation-id', 'TEST_RUN_NOT_FINISHED')
  }
  const target = state.run.targets.find((item) => item.id === targetId)
  if (!target || (target.status !== 'INVALID' && target.status !== 'FAILED')) {
    throw new ApiError('Este target no admite reintento en su estado actual.', 409, 'demo-correlation-id', 'TARGET_RETRY_NOT_ALLOWED')
  }
  state.retryingTargetId = targetId
  state.retryPolls = 0
  state.run = { ...state.run, status: 'GENERATING', targets: state.run.targets.map((item) => item.id === targetId ? { ...item, status: 'PENDING' } : item) }
  return { testRunId: runId, targetId, status: 'PENDING', pollAfterMs: 420 }
}

export async function mockGetArtifacts(runId: string): Promise<ArtifactViewModel[]> {
  await latency()
  const result = artifacts.get(runId)
  if (!result) notFound(`No existen artifacts para el run demo "${runId}".`, 'TEST_RUN_NOT_FOUND')
  return clone(result)
}

function experimentResult(target: string): ExperimentResultViewModel {
  return {
    baseline: { strategy: 'GENERALIST_AGENT', validRate: .5, compilationRate: .67, executionRate: .5, passedRate: .5, totalDurationMs: 4_820, totalTokens: 2_940, estimatedCost: .018, failures: { COMPILATION: 1, TEST_ASSERTION: 1 }, toolCalls: 6, filesInspected: 4 },
    rag: { strategy: 'RAG', validRate: .83, compilationRate: 1, executionRate: .83, passedRate: .83, totalDurationMs: 5_460, totalTokens: 4_180, estimatedCost: .027, failures: { TEST_ASSERTION: 1 }, retrievedChunks: 24, selectedChunks: 7, contextTokens: 2_180 },
    repetitions: [
      { target, repetition: 1, strategy: 'GENERALIST_AGENT', valid: false, failureType: 'COMPILATION', durationMs: 810, totalTokens: 480 },
      { target, repetition: 2, strategy: 'GENERALIST_AGENT', valid: true, failureType: 'NONE', durationMs: 760, totalTokens: 470 },
      { target, repetition: 3, strategy: 'GENERALIST_AGENT', valid: false, failureType: 'TEST_ASSERTION', durationMs: 840, totalTokens: 520 },
      { target, repetition: 1, strategy: 'RAG', valid: true, failureType: 'NONE', durationMs: 910, totalTokens: 680 },
      { target, repetition: 2, strategy: 'RAG', valid: true, failureType: 'NONE', durationMs: 890, totalTokens: 700 },
      { target, repetition: 3, strategy: 'RAG', valid: false, failureType: 'TEST_ASSERTION', durationMs: 930, totalTokens: 710 },
    ],
  }
}

export async function mockStartExperiment(projectId: string, targetId: string): Promise<ExperimentAccepted> {
  await latency()
  const project = projects.get(projectId)
  if (!project) notFound(`No existe el proyecto demo "${projectId}".`, 'PROJECT_NOT_FOUND')
  const inventory = project.currentVersionId ? versions.get(project.currentVersionId)?.inventory : undefined
  const target = inventory?.targets.find((item) => item.id === targetId)
  const label = target?.methodName ?? target?.symbolName ?? targetId
  sequence += 1
  const experimentId = `exp_demo_${sequence}`
  experiments.set(experimentId, { polls: 0, operation: { id: experimentId, status: 'PENDING', progress: 0, result: experimentResult(label) } })
  return { experimentId, status: 'PENDING', pollAfterMs: 460 }
}

export async function mockGetExperiment(experimentId: string): Promise<ExperimentOperation> {
  await latency()
  const state = experiments.get(experimentId)
  if (!state) notFound(`No existe el experimento demo "${experimentId}".`, 'INVALID_REQUEST')
  state.polls += 1
  if (state.polls === 1) state.operation = { ...state.operation, status: 'RUNNING', progress: 34 }
  else if (state.polls === 2) state.operation = { ...state.operation, status: 'RUNNING', progress: 72 }
  else state.operation = { ...state.operation, status: 'COMPLETED', progress: 100 }
  return clone(state.operation)
}
