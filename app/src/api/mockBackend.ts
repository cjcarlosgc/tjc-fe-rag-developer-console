import type { ActionRequiredListPage, FunctionalAnswerAcceptedResponse, FunctionalKnowledgeListPage, FunctionalKnowledgeResponse, FunctionalKnowledgeStatus, FunctionalQuestionResponse, FunctionalQuestionSetResponse, SubmitFunctionalAnswerRequest } from '../action-required/types'
import type { ArtifactViewModel } from '../artifacts/types'
import type { AgentTrajectoryStep, ContextTraceDetail, ContextTracePage, ContextTraceSummary, DiscoveredFilePage, ExperimentContextTraceFilters, RagCandidateNode, RagContextTraceDetail, RunContextTraceFilters, SourceExcerpt } from '../context-explorer/types'
import type { ExperimentAccepted, ExperimentOperation, ExperimentResultViewModel } from '../experiments/types'
import type { GenerationAccepted, GenerationConfiguration } from '../generation/types'
import type { InventoryTargetViewModel, TestInventoryResponse } from '../inventory/types'
import type { AnalysisHistoryItem, AnalysisOperation, AnalysisResult, CreateProjectInput, Project, UploadAccepted } from '../projects/types'
import type { GenerationMode, RunViewModel, TargetRetryAccepted, TargetRunViewModel, TestRunHistoryPage, TestRunSummary } from '../runs/types'
import type {
  AnalysisRunDetailResponse,
  AnalysisRunListPage,
  AnalysisRunStatus,
  AnalysisRunSummaryResponse,
  CompleteGitHubInstallationRequest,
  CreateTestPublicationRequest,
  GeneratedTestProposalResponse,
  GeneratedTestProposalSetResponse,
  GitHubInstallationSessionResponse,
  ProjectRepositoryBindingResponse,
  TestPublicationAcceptedResponse,
  TestPublicationResponse,
} from '../control-plane/types'
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

interface MockContextTraceState {
  detail: ContextTraceDetail
  /** HU27: cuántas llamadas a `getContextTrace` deben responder `409 CONTEXT_TRACE_NOT_FINISHED` antes de servir el detalle. */
  notFinishedUntilPolls: number
  polls: number
}

/** HU37/HU38: preguntas de un `AnalysisRun` (control plane PR-driven), ordenadas — solo una `PENDING` a la vez está vigente. `headChanged` simula que llegó un HEAD nuevo mientras se respondía: la pregunta pasa a `OBSOLETE` en vez de `ANSWERED` y el Run no se reanuda. */
interface MockActionRequiredRunState {
  analysisRunId: string
  projectId: string
  questions: FunctionalQuestionResponse[]
  headChanged: boolean
}

const projects = new Map<string, Project>()
const versions = new Map<string, MockVersionState>()
const runs = new Map<string, MockRunState>()
const artifacts = new Map<string, ArtifactViewModel[]>()
const experiments = new Map<string, MockExperimentState>()
const contextTraces = new Map<string, MockContextTraceState>()
/** No es parte de INTEROP-2.0 (§6.7 sigue legacy) — mapeo demo-only de AnalysisRun a la traza RAG que "explica" sus pruebas generadas. */
const analysisRunContextTraceId: Record<string, string> = { arun_checkout_pr45: 'trace_rag_order_total' }
const actionRequiredRuns = new Map<string, MockActionRequiredRunState>()
const repositoryBindings = new Map<string, ProjectRepositoryBindingResponse | null>()
const analysisRuns = new Map<string, AnalysisRunDetailResponse>()
const testProposals = new Map<string, GeneratedTestProposalResponse[]>()
const testPublications = new Map<string, TestPublicationResponse>()
const functionalKnowledge = new Map<string, FunctionalKnowledgeResponse>()
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

/** No es un hash real; solo produce un string con forma hexadecimal estable para la demo. */
function fakeSha256(label: string): string {
  let hash = 0
  for (let index = 0; index < label.length; index += 1) hash = (hash * 31 + label.charCodeAt(index)) >>> 0
  return hash.toString(16).padStart(8, '0').repeat(8).slice(0, 64)
}

interface ExcerptSeed {
  filePath: string
  symbolName: string | null
  parentSymbolName?: string | null
  startLine: number | null
  endLine: number | null
  snippet: string
  before?: { lineNumber: number; content: string }[]
  after?: { lineNumber: number; content: string }[]
  truncated?: boolean
}

function buildExcerpt(seed: ExcerptSeed): SourceExcerpt {
  return {
    filePath: seed.filePath,
    symbolName: seed.symbolName,
    parentSymbolName: seed.parentSymbolName ?? null,
    startLine: seed.startLine,
    endLine: seed.endLine,
    snippet: seed.snippet,
    before: seed.before ?? [],
    after: seed.after ?? [],
    contentSha256: fakeSha256(`${seed.filePath}:${seed.symbolName ?? ''}:${seed.startLine ?? 0}`),
    truncated: seed.truncated ?? false,
  }
}

function toContextTraceSummary(detail: ContextTraceDetail): ContextTraceSummary {
  const { id, kind, projectVersionId, targetId, testRunId, experimentId, strategy, repetition, attempt, current, artifactIds, createdAt } = detail
  return { id, kind, projectVersionId, targetId, testRunId, experimentId, strategy, repetition, attempt, current, artifactIds, createdAt }
}

/** HU27: ~12 candidatos para `trace_rag_order_total` cubriendo SELECTED solo-semántico, SELECTED dual y las 3 razones de descarte. */
function buildOrderTotalCandidates(): RagCandidateNode[] {
  return [
    { chunkId: 'chunk-001', rank: 1, tokenCount: 120, semanticScore: .91, structuralMatch: null, combinedScore: .91, matchedVia: ['SEMANTIC'], decision: 'SELECTED', discardReason: null, excerpt: buildExcerpt({ filePath: 'src/domain/OrderService.ts', symbolName: 'OrderService', startLine: 1, endLine: 18, snippet: 'export class OrderService {\n  constructor(private readonly coupons: CouponPolicy) {}\n}', before: [], after: [] }) },
    { chunkId: 'chunk-002', rank: 2, tokenCount: 48, semanticScore: .77, structuralMatch: 'IMPORTS', combinedScore: .85, matchedVia: ['SEMANTIC', 'IMPORTS'], decision: 'SELECTED', discardReason: null, excerpt: buildExcerpt({ filePath: 'src/shared/money.ts', symbolName: 'formatCurrency', startLine: 1, endLine: 9, snippet: "export function formatCurrency(amount: number): string {\n  return `$${amount.toFixed(2)}`\n}", before: [{ lineNumber: 1, content: "import { CURRENCY_SYMBOL } from './constants'" }] }) },
    { chunkId: 'chunk-003', rank: 3, tokenCount: 96, semanticScore: null, structuralMatch: 'IMPORTED_BY', combinedScore: .58, matchedVia: ['IMPORTED_BY'], decision: 'SELECTED', discardReason: null, excerpt: buildExcerpt({ filePath: 'src/domain/CouponPolicy.ts', symbolName: 'CouponPolicy', startLine: 1, endLine: 14, snippet: 'export class CouponPolicy {\n  apply(order: Order, code: string): number { /* ... */ }\n}' }) },
    { chunkId: 'chunk-004', rank: 4, tokenCount: 40, semanticScore: .68, structuralMatch: null, combinedScore: .68, matchedVia: ['SEMANTIC'], decision: 'SELECTED', discardReason: null, excerpt: buildExcerpt({ filePath: 'src/domain/OrderItem.ts', symbolName: 'OrderItem', startLine: 1, endLine: 10, snippet: 'export interface OrderItem {\n  price: number\n  quantity: number\n}' }) },
    { chunkId: 'chunk-005', rank: 5, tokenCount: 84, semanticScore: .81, structuralMatch: 'IMPORTS', combinedScore: .9, matchedVia: ['SEMANTIC', 'IMPORTS'], decision: 'SELECTED', discardReason: null, excerpt: buildExcerpt({ filePath: 'src/domain/DiscountEngine.ts', symbolName: 'applyDiscount', parentSymbolName: 'DiscountEngine', startLine: 12, endLine: 20, snippet: 'applyDiscount(total: number, coupon: Coupon): number {\n  return total - coupon.amount\n}' }) },
    { chunkId: 'chunk-006', rank: 6, tokenCount: 70, semanticScore: .55, structuralMatch: null, combinedScore: .55, matchedVia: ['SEMANTIC'], decision: 'DISCARDED', discardReason: 'BELOW_MINIMUM_SCORE', excerpt: buildExcerpt({ filePath: 'src/domain/Inventory.ts', symbolName: 'reserveStock', startLine: 5, endLine: 15, snippet: 'reserveStock(sku: string, quantity: number): void { /* ... */ }' }) },
    { chunkId: 'chunk-007', rank: 7, tokenCount: 60, semanticScore: .49, structuralMatch: null, combinedScore: .49, matchedVia: ['SEMANTIC'], decision: 'DISCARDED', discardReason: 'BELOW_MINIMUM_SCORE', excerpt: buildExcerpt({ filePath: 'src/domain/TaxCalculator.ts', symbolName: 'computeTax', startLine: 3, endLine: 9, snippet: 'computeTax(amount: number): number { /* ... */ }' }) },
    { chunkId: 'chunk-008', rank: 8, tokenCount: 30, semanticScore: .62, structuralMatch: null, combinedScore: .62, matchedVia: ['SEMANTIC'], decision: 'DISCARDED', discardReason: 'TOP_K_LIMIT', excerpt: buildExcerpt({ filePath: 'src/shared/logger.ts', symbolName: 'createLogger', startLine: 1, endLine: 6, snippet: 'export function createLogger(scope: string) { /* ... */ }' }) },
    { chunkId: 'chunk-009', rank: 9, tokenCount: 66, semanticScore: .6, structuralMatch: null, combinedScore: .6, matchedVia: ['SEMANTIC'], decision: 'DISCARDED', discardReason: 'TOP_K_LIMIT', excerpt: buildExcerpt({ filePath: 'src/domain/ShippingPolicy.ts', symbolName: 'estimateShipping', startLine: 8, endLine: 16, snippet: 'estimateShipping(order: Order): number { /* ... */ }' }) },
    { chunkId: 'chunk-010', rank: 10, tokenCount: 210, semanticScore: .58, structuralMatch: null, combinedScore: .58, matchedVia: ['SEMANTIC'], decision: 'DISCARDED', discardReason: 'TOKEN_BUDGET', excerpt: buildExcerpt({ filePath: 'src/domain/RefundPolicy.ts', symbolName: 'RefundPolicy', startLine: 1, endLine: 22, snippet: 'export class RefundPolicy {\n  // contenido extenso truncado para la demo\n}', truncated: true, after: [{ lineNumber: 23, content: '}' }] }) },
    { chunkId: 'chunk-011', rank: 11, tokenCount: 190, semanticScore: .52, structuralMatch: null, combinedScore: .52, matchedVia: ['SEMANTIC'], decision: 'DISCARDED', discardReason: 'TOKEN_BUDGET', excerpt: buildExcerpt({ filePath: 'src/domain/AuditTrail.ts', symbolName: 'record', startLine: 4, endLine: 9, snippet: 'record(event: AuditEvent): void { /* ... */ }' }) },
    { chunkId: 'chunk-012', rank: 12, tokenCount: 44, semanticScore: .41, structuralMatch: null, combinedScore: .41, matchedVia: ['SEMANTIC'], decision: 'DISCARDED', discardReason: 'BELOW_MINIMUM_SCORE', excerpt: buildExcerpt({ filePath: 'src/domain/CurrencyConverter.ts', symbolName: 'convert', startLine: 2, endLine: 8, snippet: 'convert(amount: number, currency: Currency): number { /* ... */ }' }) },
  ]
}

function seedContextTraces(): void {
  const orderTotalTarget: SourceExcerpt = buildExcerpt({
    filePath: 'src/domain/OrderService.ts',
    symbolName: 'calculateTotal',
    parentSymbolName: 'OrderService',
    startLine: 24,
    endLine: 26,
    snippet: '  calculateTotal(items: OrderItem[]): number {\n    return items.reduce((total, item) => total + item.price * item.quantity, 0)\n  }',
    before: [{ lineNumber: 21, content: 'class OrderService {' }, { lineNumber: 22, content: '  constructor(private readonly coupons: CouponPolicy) {}' }, { lineNumber: 23, content: '' }],
    after: [{ lineNumber: 27, content: '' }, { lineNumber: 28, content: '  createOrder(items: OrderItem[]): Order {' }, { lineNumber: 29, content: '    const total = this.calculateTotal(items)' }],
  })
  const orderTotalCandidates = buildOrderTotalCandidates()
  const selected = orderTotalCandidates.filter((candidate) => candidate.decision === 'SELECTED')

  const currentTrace: ContextTraceDetail = {
    id: 'trace_rag_order_total', kind: 'RAG', projectVersionId: 'ver_checkout_7', targetId: 'ver_checkout_7-method-total', testRunId: 'run_checkout_seed', experimentId: null,
    strategy: 'RAG', repetition: null, attempt: 2, current: true, artifactIds: ['run_checkout_seed-artifact-1'], createdAt: '2026-08-31T15:01:10.000Z',
    target: { chunkIds: ['chunk-target-order-total'], excerpt: orderTotalTarget, tokenCount: 38 },
    candidates: orderTotalCandidates,
    retrievedChunks: orderTotalCandidates.length,
    selectedChunks: selected.length,
    contextTokens: selected.reduce((total, candidate) => total + candidate.tokenCount, 0),
    configuration: { minimumScore: .5, topK: 5, maxContextTokens: 4_000, semanticWeight: .7, structuralWeight: .3 },
  }
  contextTraces.set(currentTrace.id, { detail: currentTrace, notFinishedUntilPolls: 0, polls: 0 })

  /** Intento previo conservado tras retry; se oculta salvo `includeSuperseded=true`. */
  const supersededTrace: ContextTraceDetail = {
    ...currentTrace,
    id: 'trace_rag_order_total_attempt1',
    attempt: 1,
    current: false,
    artifactIds: [],
    createdAt: '2026-08-31T15:00:20.000Z',
    candidates: orderTotalCandidates.slice(0, 4),
    retrievedChunks: 4,
    selectedChunks: orderTotalCandidates.slice(0, 4).filter((candidate) => candidate.decision === 'SELECTED').length,
  }
  contextTraces.set(supersededTrace.id, { detail: supersededTrace, notFinishedUntilPolls: 0, polls: 0 })

  const couponTarget: SourceExcerpt = buildExcerpt({
    filePath: 'src/domain/CouponPolicy.ts', symbolName: 'CouponPolicy', startLine: 1, endLine: 14,
    snippet: 'export class CouponPolicy {\n  apply(order: Order, code: string): number { /* ... */ }\n}',
  })
  const couponCandidates: RagCandidateNode[] = [
    { chunkId: 'chunk-coupon-001', rank: 1, tokenCount: 52, semanticScore: .88, structuralMatch: null, combinedScore: .88, matchedVia: ['SEMANTIC'], decision: 'SELECTED', discardReason: null, excerpt: buildExcerpt({ filePath: 'src/domain/DiscountEngine.ts', symbolName: 'applyDiscount', parentSymbolName: 'DiscountEngine', startLine: 12, endLine: 20, snippet: 'applyDiscount(total: number, coupon: Coupon): number { /* ... */ }' }) },
    { chunkId: 'chunk-coupon-002', rank: 2, tokenCount: 60, semanticScore: .74, structuralMatch: 'IMPORTS', combinedScore: .82, matchedVia: ['SEMANTIC', 'IMPORTS'], decision: 'SELECTED', discardReason: null, excerpt: buildExcerpt({ filePath: 'src/domain/OrderService.ts', symbolName: 'createOrder', parentSymbolName: 'OrderService', startLine: 28, endLine: 34, snippet: 'createOrder(items: OrderItem[]): Order { /* ... */ }' }) },
    { chunkId: 'chunk-coupon-003', rank: 3, tokenCount: 40, semanticScore: .58, structuralMatch: null, combinedScore: .58, matchedVia: ['SEMANTIC'], decision: 'DISCARDED', discardReason: 'TOP_K_LIMIT', excerpt: buildExcerpt({ filePath: 'src/domain/LoyaltyProgram.ts', symbolName: 'grantPoints', startLine: 6, endLine: 12, snippet: 'grantPoints(customerId: string, amount: number): void { /* ... */ }' }) },
    { chunkId: 'chunk-coupon-004', rank: 4, tokenCount: 180, semanticScore: .5, structuralMatch: null, combinedScore: .5, matchedVia: ['SEMANTIC'], decision: 'DISCARDED', discardReason: 'TOKEN_BUDGET', excerpt: buildExcerpt({ filePath: 'src/domain/PromotionCatalog.ts', symbolName: 'PromotionCatalog', startLine: 1, endLine: 30, snippet: 'export class PromotionCatalog { /* ... */ }' }) },
  ]
  const couponSelected = couponCandidates.filter((candidate) => candidate.decision === 'SELECTED')
  const couponTrace: ContextTraceDetail = {
    id: 'trace_rag_coupon', kind: 'RAG', projectVersionId: 'ver_checkout_7', targetId: 'ver_checkout_7-class-coupon', testRunId: 'run_checkout_seed', experimentId: null,
    strategy: 'RAG', repetition: null, attempt: 1, current: true, artifactIds: ['run_checkout_seed-artifact-2'], createdAt: '2026-08-31T15:01:30.000Z',
    target: { chunkIds: ['chunk-target-coupon'], excerpt: couponTarget, tokenCount: 22 },
    candidates: couponCandidates,
    retrievedChunks: couponCandidates.length,
    selectedChunks: couponSelected.length,
    contextTokens: couponSelected.reduce((total, candidate) => total + candidate.tokenCount, 0),
    configuration: { minimumScore: .5, topK: 5, maxContextTokens: 4_000, semanticWeight: .7, structuralWeight: .3 },
  }
  /** Simula un `409 CONTEXT_TRACE_NOT_FINISHED` transitorio: las primeras 2 consultas fallan, la 3ª sirve el detalle. */
  contextTraces.set(couponTrace.id, { detail: couponTrace, notFinishedUntilPolls: 2, polls: 0 })
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
  seedContextTraces()
  seedActionRequired()
  seedControlPlane()
  seedFunctionalKnowledge()
}

/** HU37/HU38: dos escenarios — `arun_checkout_pr42` (action required normal, dos preguntas adaptativas encadenadas) y `arun_billing_pr17` (corrección/HEAD nuevo: cualquier respuesta deja la pregunta `OBSOLETE` sin reanudar el Run). */
function seedActionRequired(): void {
  actionRequiredRuns.set('arun_checkout_pr42', {
    analysisRunId: 'arun_checkout_pr42',
    projectId: 'prj_checkout_demo',
    headChanged: false,
    questions: [
      {
        id: 'fq_checkout_pr42_1',
        analysisRunId: 'arun_checkout_pr42',
        projectId: 'prj_checkout_demo',
        repositoryName: 'acme/checkout-service',
        pullRequestNumber: 42,
        headSha: 'a1b2c3d',
        target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'CouponPolicy.apply', filePath: 'src/domain/CouponPolicy.ts', changeKind: 'DIRECTLY_CHANGED' },
        question: '¿"apply" debe rechazar un cupón vencido aunque el pedido ya esté marcado como pagado?',
        rationale: 'El PR modifica la validación de vigencia de "apply" pero no hay una prueba existente que fije el comportamiento cuando el pedido ya está pagado.',
        status: 'PENDING',
        visualAid: { kind: 'MINI_DIFF', title: 'CouponPolicy.ts — cambio en apply', language: 'typescript', content: '- apply(order: Order, code: string): number {\n-   return this.discountFor(code)\n+ apply(order: Order, code: string): number {\n+   if (this.isExpired(code)) throw new ExpiredCouponError(code)\n+   return this.discountFor(code)' },
        createdAt: '2026-09-12T18:20:00.000Z',
      },
      {
        id: 'fq_checkout_pr42_2',
        analysisRunId: 'arun_checkout_pr42',
        projectId: 'prj_checkout_demo',
        repositoryName: 'acme/checkout-service',
        pullRequestNumber: 42,
        headSha: 'a1b2c3d',
        target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.calculateTotal', filePath: 'src/domain/OrderService.ts', changeKind: 'POTENTIALLY_IMPACTED' },
        question: '¿El redondeo de "calculateTotal" debe truncar o redondear al centavo más cercano?',
        rationale: '"calculateTotal" invoca a "CouponPolicy.apply" y el PR introduce un nuevo cálculo de descuento; el redondeo no está documentado en el código ni en pruebas previas.',
        status: 'PENDING',
        visualAid: { kind: 'CODE_FRAGMENT', title: 'OrderService.ts:42', language: 'typescript', content: 'calculateTotal(order: Order): number {\n  const discount = this.coupons.apply(order, order.couponCode)\n  return order.subtotal - discount // redondeo pendiente de definir\n}' },
        createdAt: '2026-09-12T18:20:00.000Z',
      },
    ],
  })
  actionRequiredRuns.set('arun_billing_pr17', {
    analysisRunId: 'arun_billing_pr17',
    projectId: 'prj_billing_demo',
    headChanged: true,
    questions: [
      {
        id: 'fq_billing_pr17_1',
        analysisRunId: 'arun_billing_pr17',
        projectId: 'prj_billing_demo',
        repositoryName: 'acme/billing-engine',
        pullRequestNumber: 17,
        headSha: 'f9e8d7c',
        target: { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'DiscountEngine', filePath: 'src/domain/DiscountEngine.ts', changeKind: 'DIRECTLY_CHANGED' },
        question: '¿"DiscountEngine.applyDiscount" puede dejar el total en negativo si el cupón excede el subtotal?',
        rationale: '"applyDiscount" cambia su firma en este PR y "OrderService" depende de su resultado para el total final.',
        status: 'PENDING',
        visualAid: { kind: 'SYMBOL_RELATION', title: 'DiscountEngine ↔ OrderService', language: null, content: 'OrderService.calculateTotal() --usa--> DiscountEngine.applyDiscount()\nDiscountEngine.applyDiscount() --modificado en PR#17-->' },
        createdAt: '2026-09-11T09:05:00.000Z',
      },
    ],
  })
}

interface AnalysisRunSeed extends AnalysisRunDetailResponse {
  __proposals?: GeneratedTestProposalResponse[]
}

/** HU30/HU32/HU39/HU40: repository bindings de los dos proyectos demo y los 9 escenarios mock-first de `spec.md` de la feature 013 (un `AnalysisRun` por escenario, más el par pr17/pr17-2 para "corrección/HEAD nuevo"). */
function seedControlPlane(): void {
  repositoryBindings.set('prj_checkout_demo', { projectId: 'prj_checkout_demo', installationId: 'inst_checkout_1', repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service', integrationBranch: 'develop', status: 'ENABLED', createdAt: '2026-08-20T10:00:00.000Z', updatedAt: '2026-08-20T10:00:00.000Z' })
  repositoryBindings.set('prj_billing_demo', { projectId: 'prj_billing_demo', installationId: 'inst_billing_1', repositoryId: 'repo_billing', repositoryName: 'acme/billing-engine', integrationBranch: 'develop', status: 'ENABLED', createdAt: '2026-08-22T10:00:00.000Z', updatedAt: '2026-08-22T10:00:00.000Z' })

  function pr(repositoryId: string, repositoryName: string, number: number, title: string, headRef: string, headSha: string, actorLogin: string) {
    return { repositoryId, repositoryName, number, title, baseRef: 'develop', headRef, baseSha: 'c1c1c1c', headSha, draft: false, state: 'OPEN' as const, actorLogin }
  }

  const seeds: AnalysisRunSeed[] = [
    {
      id: 'arun_checkout_pr42', projectId: 'prj_checkout_demo',
      pullRequest: pr('repo_checkout', 'acme/checkout-service', 42, 'Rechazar cupones vencidos en checkout', 'feature/coupon-expiry', 'a1b2c3d', 'devA'),
      status: 'ACTION_REQUIRED', current: true, actionRequiredCount: 2, generatedTestsCount: 0,
      createdAt: '2026-09-12T18:15:00.000Z', updatedAt: '2026-09-12T18:20:00.000Z', completedAt: null,
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: 'a1b2c3d', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [
        { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'CouponPolicy.apply', filePath: 'src/domain/CouponPolicy.ts', changeKind: 'DIRECTLY_CHANGED' },
        { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.calculateTotal', filePath: 'src/domain/OrderService.ts', changeKind: 'POTENTIALLY_IMPACTED' },
      ],
      functionalBehaviorValidated: false, resultSummary: null, detailsUrl: '/projects/prj_checkout_demo/runs/arun_checkout_pr42',
    },
    {
      id: 'arun_checkout_pr45', projectId: 'prj_checkout_demo',
      pullRequest: pr('repo_checkout', 'acme/checkout-service', 45, 'Modo de redondeo configurable en OrderService', 'feature/rounding-mode', 'e5e5e5e', 'devB'),
      status: 'SUCCESS', current: true, actionRequiredCount: 0, generatedTestsCount: 3,
      createdAt: '2026-09-12T09:00:00.000Z', updatedAt: '2026-09-12T09:12:00.000Z', completedAt: '2026-09-12T09:12:00.000Z',
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: 'e5e5e5e', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [{ language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.calculateTotal', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: true, resultSummary: '3 pruebas generadas y validadas contra el HEAD vigente.', detailsUrl: '/projects/prj_checkout_demo/runs/arun_checkout_pr45',
      __proposals: [
        { id: 'prop_pr45_1', relativePath: 'src/domain/OrderService.rounding.spec.ts', target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.calculateTotal', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr45_1'), status: 'AVAILABLE' },
        { id: 'prop_pr45_2', relativePath: 'src/domain/OrderService.rounding.edgecases.spec.ts', target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.calculateTotal', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr45_2'), status: 'AVAILABLE' },
        { id: 'prop_pr45_3', relativePath: 'src/shared/money.spec.ts', target: { language: 'TYPESCRIPT', kind: 'FUNCTION', qualifiedName: 'formatCurrency', filePath: 'src/shared/money.ts', changeKind: 'POTENTIALLY_IMPACTED' }, contentSha256: fakeSha256('prop_pr45_3'), status: 'AVAILABLE' },
      ],
    },
    {
      id: 'arun_checkout_pr46', projectId: 'prj_checkout_demo',
      pullRequest: pr('repo_checkout', 'acme/checkout-service', 46, 'Tope máximo de descuento acumulado', 'feature/discount-cap', 'f6f6f6f', 'devA'),
      status: 'BEHAVIORAL_MISMATCH', current: true, actionRequiredCount: 0, generatedTestsCount: 1,
      createdAt: '2026-09-11T15:00:00.000Z', updatedAt: '2026-09-11T15:20:00.000Z', completedAt: '2026-09-11T15:20:00.000Z',
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: 'f6f6f6f', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [{ language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'CouponPolicy.apply', filePath: 'src/domain/CouponPolicy.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: true, resultSummary: 'La prueba generada contradice el comportamiento observado: "apply" permite un descuento mayor al tope declarado.', detailsUrl: '/projects/prj_checkout_demo/runs/arun_checkout_pr46',
      __proposals: [
        { id: 'prop_pr46_1', relativePath: 'src/domain/CouponPolicy.cap.spec.ts', target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'CouponPolicy.apply', filePath: 'src/domain/CouponPolicy.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr46_1'), status: 'HELD' },
      ],
    },
    {
      id: 'arun_checkout_pr47', projectId: 'prj_checkout_demo',
      pullRequest: pr('repo_checkout', 'acme/checkout-service', 47, 'Limpieza de lint en utilidades de formato', 'chore/lint-fixes', '777aaa7', 'devC'),
      status: 'NO_ADDITIONAL_TESTS_REQUIRED', current: true, actionRequiredCount: 0, generatedTestsCount: 0,
      createdAt: '2026-09-10T11:00:00.000Z', updatedAt: '2026-09-10T11:05:00.000Z', completedAt: '2026-09-10T11:05:00.000Z',
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: '777aaa7', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [{ language: 'TYPESCRIPT', kind: 'FUNCTION', qualifiedName: 'formatCurrency', filePath: 'src/shared/money.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: true, resultSummary: 'La cobertura existente ya ejercita el comportamiento observable de "formatCurrency"; el cambio es solo de estilo.', detailsUrl: '/projects/prj_checkout_demo/runs/arun_checkout_pr47',
    },
    {
      id: 'arun_billing_pr17', projectId: 'prj_billing_demo',
      pullRequest: pr('repo_billing', 'acme/billing-engine', 17, 'Firma nueva de DiscountEngine.applyDiscount', 'feature/discount-engine-v2', 'f9e8d7c', 'devD'),
      status: 'OBSOLETE', current: false, actionRequiredCount: 0, generatedTestsCount: 0,
      createdAt: '2026-09-11T09:00:00.000Z', updatedAt: '2026-09-11T09:40:00.000Z', completedAt: null,
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: 'f9e8d7c', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [{ language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'DiscountEngine', filePath: 'src/domain/DiscountEngine.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: false, resultSummary: 'Un HEAD nuevo llegó a PR#17 mientras se resolvía el contexto funcional — este Run quedó obsoleto y no se reanuda.', detailsUrl: '/projects/prj_billing_demo/runs/arun_billing_pr17',
    },
    {
      id: 'arun_billing_pr17_2', projectId: 'prj_billing_demo',
      pullRequest: pr('repo_billing', 'acme/billing-engine', 17, 'Firma nueva de DiscountEngine.applyDiscount', 'feature/discount-engine-v2', '17b17b1', 'devD'),
      status: 'SUCCESS', current: true, actionRequiredCount: 0, generatedTestsCount: 2,
      createdAt: '2026-09-11T09:45:00.000Z', updatedAt: '2026-09-11T10:00:00.000Z', completedAt: '2026-09-11T10:00:00.000Z',
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: '17b17b1', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [{ language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'DiscountEngine', filePath: 'src/domain/DiscountEngine.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: true, resultSummary: 'El HEAD nuevo de PR#17 ya no deja el total en negativo; 2 pruebas generadas y validadas.', detailsUrl: '/projects/prj_billing_demo/runs/arun_billing_pr17_2',
      __proposals: [
        { id: 'prop_pr17_2_1', relativePath: 'src/domain/DiscountEngine.applyDiscount.spec.ts', target: { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'DiscountEngine', filePath: 'src/domain/DiscountEngine.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr17_2_1'), status: 'AVAILABLE' },
        { id: 'prop_pr17_2_2', relativePath: 'src/domain/DiscountEngine.negative.spec.ts', target: { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'DiscountEngine', filePath: 'src/domain/DiscountEngine.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr17_2_2'), status: 'AVAILABLE' },
      ],
    },
    {
      id: 'arun_billing_pr20', projectId: 'prj_billing_demo',
      pullRequest: pr('repo_billing', 'acme/billing-engine', 20, 'Ajuste de moneda base en InvoiceService', 'feature/invoice-currency', '202020a', 'devE'),
      status: 'BASELINE_FAILED', current: true, actionRequiredCount: 0, generatedTestsCount: 0,
      createdAt: '2026-09-10T08:00:00.000Z', updatedAt: '2026-09-10T08:10:00.000Z', completedAt: '2026-09-10T08:10:00.000Z',
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: '202020a', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [{ language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'InvoiceService', filePath: 'src/domain/InvoiceService.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: false, resultSummary: 'La suite existente ya falla contra el HEAD del PR antes de generar pruebas nuevas — revisar el baseline.', detailsUrl: '/projects/prj_billing_demo/runs/arun_billing_pr20',
    },
    {
      id: 'arun_billing_pr21', projectId: 'prj_billing_demo',
      pullRequest: pr('repo_billing', 'acme/billing-engine', 21, 'Política de reembolsos parciales', 'feature/partial-refunds', '212121b', 'devE'),
      status: 'TECHNICAL_GENERATION_FAILURE', current: true, actionRequiredCount: 0, generatedTestsCount: 0,
      createdAt: '2026-09-09T13:00:00.000Z', updatedAt: '2026-09-09T13:08:00.000Z', completedAt: '2026-09-09T13:08:00.000Z',
      attemptCount: 2, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: '212121b', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [{ language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'RefundPolicy', filePath: 'src/domain/RefundPolicy.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: false, resultSummary: 'El generador no produjo una prueba compilable para "RefundPolicy" tras 2 intentos — falla técnica, no de comportamiento.', detailsUrl: '/projects/prj_billing_demo/runs/arun_billing_pr21',
    },
    {
      id: 'arun_billing_pr22', projectId: 'prj_billing_demo',
      pullRequest: pr('repo_billing', 'acme/billing-engine', 22, 'Actualiza README y comentarios de PaymentGateway', 'docs/payment-gateway-notes', '222222c', 'devF'),
      status: 'NO_TEST_RELEVANT_CHANGES', current: true, actionRequiredCount: 0, generatedTestsCount: 0,
      createdAt: '2026-09-08T16:00:00.000Z', updatedAt: '2026-09-08T16:02:00.000Z', completedAt: '2026-09-08T16:02:00.000Z',
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: '222222c', indexDeltaBaseSha: null,
      symbols: [],
      functionalBehaviorValidated: true, resultSummary: 'El PR solo cambia documentación; no hay símbolos testables afectados.', detailsUrl: '/projects/prj_billing_demo/runs/arun_billing_pr22',
    },
  ]

  for (const { __proposals, ...run } of seeds) {
    analysisRuns.set(run.id, run)
    if (__proposals) testProposals.set(run.id, __proposals)
  }
}

/** HU35/HU36: 4 reglas sobre los dos proyectos demo — 3 ACTIVE y un par ACTIVE/SUPERSEDED sobre el mismo target (OrderService.calculateTotal) para demostrar la supersesión del handoff. */
function seedFunctionalKnowledge(): void {
  const items: FunctionalKnowledgeResponse[] = [
    {
      id: 'fk_coupon_expiry', projectId: 'prj_checkout_demo', scope: 'METHOD', targetRef: 'CouponPolicy.apply',
      originalQuestion: '¿"apply" debe rechazar un cupón vencido aunque el pedido ya esté marcado como pagado?',
      originalAnswer: 'Sí',
      normalizedRule: 'Un cupón vencido nunca debe aplicarse, incluso si el pedido ya está marcado como pagado.',
      source: 'HUMAN_ANSWER', status: 'ACTIVE', supersedesId: null, createdAt: '2026-09-12T18:22:00.000Z',
    },
    {
      id: 'fk_discount_engine', projectId: 'prj_billing_demo', scope: 'METHOD', targetRef: 'DiscountEngine.applyDiscount',
      originalQuestion: '¿"DiscountEngine.applyDiscount" puede dejar el total en negativo si el cupón excede el subtotal?',
      originalAnswer: 'No',
      normalizedRule: 'El descuento aplicado nunca debe dejar el total del pedido en negativo.',
      source: 'HUMAN_ANSWER', status: 'ACTIVE', supersedesId: null, createdAt: '2026-09-11T09:50:00.000Z',
    },
    {
      id: 'fk_rounding_v1', projectId: 'prj_checkout_demo', scope: 'METHOD', targetRef: 'OrderService.calculateTotal',
      originalQuestion: '¿El redondeo de "calculateTotal" debe truncar o redondear al centavo más cercano?',
      originalAnswer: 'Trunca al centavo inferior',
      normalizedRule: 'El total calculado trunca al centavo inferior; no redondea.',
      source: 'HUMAN_ANSWER', status: 'SUPERSEDED', supersedesId: null, createdAt: '2026-08-20T10:00:00.000Z',
    },
    {
      id: 'fk_rounding_v2', projectId: 'prj_checkout_demo', scope: 'METHOD', targetRef: 'OrderService.calculateTotal',
      originalQuestion: '¿El redondeo de "calculateTotal" debe truncar o redondear al centavo más cercano?',
      originalAnswer: 'Redondea al centavo más cercano',
      normalizedRule: 'El total calculado redondea al centavo más cercano (no trunca).',
      source: 'HUMAN_ANSWER', status: 'ACTIVE', supersedesId: 'fk_rounding_v1', createdAt: '2026-09-12T09:05:00.000Z',
    },
  ]
  for (const item of items) functionalKnowledge.set(item.id, item)
}

export function resetMockBackend(): void {
  projects.clear()
  versions.clear()
  runs.clear()
  artifacts.clear()
  experiments.clear()
  contextTraces.clear()
  actionRequiredRuns.clear()
  repositoryBindings.clear()
  analysisRuns.clear()
  testProposals.clear()
  testPublications.clear()
  functionalKnowledge.clear()
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
      { target, repetition: 1, strategy: 'GENERALIST_AGENT', valid: false, failureType: 'COMPILATION', durationMs: 810, totalTokens: 480, errorSummary: 'jest.config.js: Cannot find module ts-jest' },
      { target, repetition: 2, strategy: 'GENERALIST_AGENT', valid: true, failureType: 'NONE', durationMs: 760, totalTokens: 470, errorSummary: null },
      { target, repetition: 3, strategy: 'GENERALIST_AGENT', valid: false, failureType: 'TEST_ASSERTION', durationMs: 840, totalTokens: 520, errorSummary: 'Expected discount to be 20, received 15.' },
      { target, repetition: 1, strategy: 'RAG', valid: true, failureType: 'NONE', durationMs: 910, totalTokens: 680, errorSummary: null },
      { target, repetition: 2, strategy: 'RAG', valid: true, failureType: 'NONE', durationMs: 890, totalTokens: 700, errorSummary: null },
      { target, repetition: 3, strategy: 'RAG', valid: false, failureType: 'TEST_ASSERTION', durationMs: 930, totalTokens: 710, errorSummary: 'Expected discount to be 20, received 15.' },
    ],
  }
}

const DISCOVERED_FILES_TOTAL = 146

/** HU28: el agente generalista explora con las 4 herramientas del contrato; incluye un paso `EMPTY` y uno `FAILED` (spec.md). */
function buildAgentTrajectory(targetFilePath: string): AgentTrajectoryStep[] {
  const symbolExcerpt = buildExcerpt({ filePath: targetFilePath, symbolName: 'OrderService', startLine: 1, endLine: 18, snippet: 'export class OrderService {\n  constructor(private readonly coupons: CouponPolicy) {}\n}' })
  const matchExcerpt = buildExcerpt({ filePath: targetFilePath, symbolName: null, startLine: 24, endLine: 26, snippet: '  calculateTotal(items: OrderItem[]): number {' })
  const fileExcerpt = buildExcerpt({ filePath: targetFilePath, symbolName: null, startLine: 1, endLine: 34, snippet: '/* contenido completo entregado al agente */', truncated: true })
  return [
    { step: 1, toolName: 'list_files', arguments: { path: 'src/domain' }, status: 'SUCCEEDED', resultSummary: `${DISCOVERED_FILES_TOTAL} archivos disponibles en src/domain`, resultSha256: fakeSha256('list_files:src/domain'), truncated: false, observations: [{ kind: 'FILE_LIST_SUMMARY', filePath: null, symbolName: null, excerpt: null, discoveredFilesCount: DISCOVERED_FILES_TOTAL }] },
    { step: 2, toolName: 'search_text', arguments: { query: 'calculateTotal' }, status: 'SUCCEEDED', resultSummary: '1 coincidencia encontrada', resultSha256: fakeSha256('search_text:calculateTotal'), truncated: false, observations: [{ kind: 'TEXT_MATCH', filePath: targetFilePath, symbolName: null, excerpt: matchExcerpt, discoveredFilesCount: null }] },
    { step: 3, toolName: 'inspect_symbol', arguments: { symbolName: 'OrderService' }, status: 'SUCCEEDED', resultSummary: 'Declaración localizada con 1 referencia', resultSha256: fakeSha256('inspect_symbol:OrderService'), truncated: false, observations: [{ kind: 'SYMBOL', filePath: targetFilePath, symbolName: 'OrderService', excerpt: symbolExcerpt, discoveredFilesCount: null }] },
    { step: 4, toolName: 'inspect_symbol', arguments: { symbolName: 'PricingStrategy' }, status: 'FAILED', resultSummary: 'El símbolo no se pudo resolver en esta versión', resultSha256: fakeSha256('inspect_symbol:PricingStrategy'), truncated: false, observations: [] },
    { step: 5, toolName: 'search_text', arguments: { query: 'applyCoupon' }, status: 'EMPTY', resultSummary: 'Sin coincidencias en el proyecto', resultSha256: fakeSha256('search_text:applyCoupon'), truncated: false, observations: [] },
    { step: 6, toolName: 'read_file', arguments: { filePath: targetFilePath }, status: 'SUCCEEDED', resultSummary: 'Contenido entregado al agente', resultSha256: fakeSha256(`read_file:${targetFilePath}`), truncated: true, observations: [{ kind: 'FILE_CONTENT', filePath: targetFilePath, symbolName: null, excerpt: fileExcerpt, discoveredFilesCount: null }] },
  ]
}

/** HU27/HU28: las 6 repeticiones de un experimento (3 RAG + 3 agente) también tienen traza de contexto propia. */
function seedExperimentContextTraces(experimentId: string, projectVersionId: string, targetId: string, targetFilePath: string, targetSymbol: string | null): void {
  const targetExcerpt = buildExcerpt({ filePath: targetFilePath, symbolName: targetSymbol, startLine: 1, endLine: 3, snippet: '/* target del experimento */' })
  const ragCandidates = buildOrderTotalCandidates().slice(0, 4)
  const ragSelected = ragCandidates.filter((candidate) => candidate.decision === 'SELECTED')
  for (const repetition of [1, 2, 3] as const) {
    const ragId = `${experimentId}-rag-r${repetition}`
    const ragDetail: ContextTraceDetail = {
      id: ragId, kind: 'RAG', projectVersionId, targetId, testRunId: null, experimentId,
      strategy: 'RAG', repetition, attempt: 1, current: true, artifactIds: [], createdAt: nowIso(),
      target: { chunkIds: ['chunk-target-exp'], excerpt: targetExcerpt, tokenCount: 30 },
      candidates: ragCandidates,
      retrievedChunks: ragCandidates.length,
      selectedChunks: ragSelected.length,
      contextTokens: ragSelected.reduce((total, candidate) => total + candidate.tokenCount, 0),
      configuration: { minimumScore: .5, topK: 5, maxContextTokens: 4_000, semanticWeight: .7, structuralWeight: .3 },
    }
    contextTraces.set(ragId, { detail: ragDetail, notFinishedUntilPolls: 0, polls: 0 })

    const agentId = `${experimentId}-agent-r${repetition}`
    const trajectory = buildAgentTrajectory(targetFilePath)
    const filesInspected = new Set(trajectory.flatMap((step) => step.observations.map((observation) => observation.filePath).filter((path): path is string => path !== null))).size
    const agentDetail: ContextTraceDetail = {
      id: agentId, kind: 'AGENT', projectVersionId, targetId, testRunId: null, experimentId,
      strategy: 'GENERALIST_AGENT', repetition, attempt: 1, current: true, artifactIds: [], createdAt: nowIso(),
      trajectory, toolCalls: trajectory.length, filesInspected,
    }
    contextTraces.set(agentId, { detail: agentDetail, notFinishedUntilPolls: 0, polls: 0 })
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
  if (project.currentVersionId) seedExperimentContextTraces(experimentId, project.currentVersionId, targetId, target?.filePath ?? 'src/domain/OrderService.ts', target?.methodName ?? target?.symbolName ?? null)
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

/** HU27/HU28: `INTEROP-1.6 §6.7`. */
export async function mockListRunContextTraces(runId: string, filters: RunContextTraceFilters): Promise<ContextTracePage> {
  await latency()
  const items = Array.from(contextTraces.values())
    .map((state) => state.detail)
    .filter((detail) => detail.testRunId === runId)
    .filter((detail) => filters.artifactId ? detail.artifactIds.includes(filters.artifactId) : true)
    .filter((detail) => filters.targetId ? detail.targetId === filters.targetId : true)
    .filter((detail) => filters.includeSuperseded ? true : detail.current)
    .sort((a, b) => a.targetId === b.targetId ? b.attempt - a.attempt : a.createdAt.localeCompare(b.createdAt))
    .map(toContextTraceSummary)
  void filters.cursor
  return { items: items.map(clone), nextCursor: null }
}

export async function mockListExperimentContextTraces(experimentId: string, filters: ExperimentContextTraceFilters): Promise<ContextTracePage> {
  await latency()
  const items = Array.from(contextTraces.values())
    .map((state) => state.detail)
    .filter((detail) => detail.experimentId === experimentId)
    .filter((detail) => filters.strategy ? detail.strategy === filters.strategy : true)
    .filter((detail) => filters.repetition ? detail.repetition === filters.repetition : true)
    .filter((detail) => filters.includeSuperseded ? true : detail.current)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(toContextTraceSummary)
  void filters.cursor
  return { items: items.map(clone), nextCursor: null }
}

export async function mockGetContextTrace(traceId: string): Promise<ContextTraceDetail> {
  await latency()
  const state = contextTraces.get(traceId)
  if (!state) notFound(`No existe la traza de contexto demo "${traceId}".`, 'CONTEXT_TRACE_NOT_FOUND')
  if (state.polls < state.notFinishedUntilPolls) {
    state.polls += 1
    throw new ApiError('La traza de contexto demo todavía no está lista.', 409, 'demo-correlation-id', 'CONTEXT_TRACE_NOT_FINISHED')
  }
  return clone(state.detail)
}

/** Demo-only: no hay forma de contrato para "contexto de un AnalysisRun" todavía (§6.7 sigue legacy). */
export async function mockGetAnalysisRunContextTrace(analysisRunId: string): Promise<RagContextTraceDetail | null> {
  await latency()
  const traceId = analysisRunContextTraceId[analysisRunId]
  const state = traceId ? contextTraces.get(traceId) : undefined
  if (!state || state.detail.kind !== 'RAG') return null
  return clone(state.detail)
}

const DISCOVERED_FILES_PAGE_SIZE = 50

export async function mockListDiscoveredFiles(traceId: string, step: number, cursor: string | null): Promise<DiscoveredFilePage> {
  await latency()
  const state = contextTraces.get(traceId)
  if (!state || state.detail.kind !== 'AGENT') notFound(`No existen archivos descubiertos para la traza demo "${traceId}".`, 'CONTEXT_TRACE_NOT_FOUND')
  const targetStep = state.detail.trajectory.find((item) => item.step === step && item.toolName === 'list_files')
  if (!targetStep) notFound(`El paso ${step} no corresponde a "list_files" en la traza demo "${traceId}".`, 'CONTEXT_TRACE_NOT_FOUND')
  const start = cursor ? Number(cursor) : 0
  const end = Math.min(start + DISCOVERED_FILES_PAGE_SIZE, DISCOVERED_FILES_TOTAL)
  const items = Array.from({ length: Math.max(0, end - start) }, (_, index) => ({ filePath: `src/domain/discovered/file-${start + index + 1}.ts` }))
  return { items, nextCursor: end < DISCOVERED_FILES_TOTAL ? String(end) : null }
}

function currentActionRequiredQuestion(state: MockActionRequiredRunState): FunctionalQuestionResponse | null {
  return state.questions.find((question) => question.status === 'PENDING') ?? null
}

/** HU38: `GET /action-required?projectId&cursor&limit` — una entrada por Run vigente con pregunta pendiente. */
export async function mockListActionRequired(projectId?: string): Promise<ActionRequiredListPage> {
  await latency()
  const items = Array.from(actionRequiredRuns.values())
    .filter((state) => !projectId || state.projectId === projectId)
    .map(currentActionRequiredQuestion)
    .filter((question): question is FunctionalQuestionResponse => question !== null)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  return { items: clone(items), nextCursor: null }
}

/** HU37: `GET /analysis-runs/{analysisRunId}/context-questions`. */
export async function mockGetContextQuestionSet(analysisRunId: string): Promise<FunctionalQuestionSetResponse> {
  await latency()
  const state = actionRequiredRuns.get(analysisRunId)
  if (!state) notFound(`No existe el Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  const currentQuestion = currentActionRequiredQuestion(state)
  const functionalBehaviorValidated = currentQuestion === null && state.questions.every((question) => question.status === 'ANSWERED')
  return clone({ analysisRunId, currentQuestion, functionalBehaviorValidated })
}

/** HU37: `POST /analysis-runs/{analysisRunId}/context-questions/{questionId}/answers`. `headChanged` simula que un HEAD nuevo llegó mientras se respondía: la pregunta queda `OBSOLETE`, no `ANSWERED`, y el Run no se reanuda (`continuationAttemptId: null`). */
export async function mockSubmitFunctionalAnswer(analysisRunId: string, questionId: string, input: SubmitFunctionalAnswerRequest): Promise<FunctionalAnswerAcceptedResponse> {
  await latency()
  const state = actionRequiredRuns.get(analysisRunId)
  if (!state) notFound(`No existe el Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  const question = state.questions.find((item) => item.id === questionId)
  if (!question) notFound(`No existe la pregunta demo "${questionId}".`, 'QUESTION_NOT_FOUND')
  if (question.status !== 'PENDING') throw new ApiError('La pregunta demo ya no está pendiente.', 409, 'demo-correlation-id', 'QUESTION_NOT_PENDING')

  if (state.headChanged) {
    question.status = 'OBSOLETE'
    return { status: 'PENDING', pollAfterMs: 400, analysisRunId, questionId, continuationAttemptId: null, knowledgeId: null }
  }

  question.status = 'ANSWERED'
  sequence += 1
  const knowledgeId = input.choice === 'UNKNOWN' ? null : `fk_demo_${sequence}`
  return { status: 'PENDING', pollAfterMs: 300, analysisRunId, questionId, continuationAttemptId: `attempt_demo_${sequence}`, knowledgeId }
}

function requireProject(projectId: string): Project {
  const project = projects.get(projectId)
  if (!project) notFound(`No existe el proyecto demo "${projectId}".`, 'PROJECT_NOT_FOUND')
  return project
}

/** HU30: `GET /projects/{projectId}/integrations/github`. `null` cuando el proyecto nunca se vinculó o fue desconectado. */
export async function mockGetRepositoryBinding(projectId: string): Promise<ProjectRepositoryBindingResponse | null> {
  await latency()
  requireProject(projectId)
  return clone(repositoryBindings.get(projectId) ?? null)
}

const DEFAULT_REPOSITORY_BY_PROJECT: Record<string, { repositoryId: string; repositoryName: string }> = {
  prj_checkout_demo: { repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service' },
  prj_billing_demo: { repositoryId: 'repo_billing', repositoryName: 'acme/billing-engine' },
}

/** HU30: `POST /projects/{projectId}/integrations/github/installations`. */
export async function mockStartGitHubInstallation(projectId: string): Promise<GitHubInstallationSessionResponse> {
  await latency()
  requireProject(projectId)
  sequence += 1
  return {
    projectId,
    installationUrl: `https://github.com/apps/rag-test-studio-demo/installations/new?state=demo_state_${sequence}`,
    stateExpiresAt: new Date(Date.now() + 10 * 60_000).toISOString(),
  }
}

/** HU30: `POST /projects/{projectId}/integrations/github/callback`. Demo: siempre vincula el repositorio por defecto del proyecto (no hay selector real de repos). */
export async function mockCompleteGitHubInstallation(projectId: string, input: CompleteGitHubInstallationRequest): Promise<ProjectRepositoryBindingResponse> {
  await latency()
  requireProject(projectId)
  const fallback = DEFAULT_REPOSITORY_BY_PROJECT[projectId] ?? { repositoryId: input.repositoryId, repositoryName: input.repositoryId }
  const createdAt = nowIso()
  sequence += 1
  const binding: ProjectRepositoryBindingResponse = {
    projectId,
    installationId: input.installationId || `inst_demo_${sequence}`,
    repositoryId: fallback.repositoryId,
    repositoryName: fallback.repositoryName,
    integrationBranch: input.integrationBranch?.trim() || 'develop',
    status: 'ENABLED',
    createdAt,
    updatedAt: createdAt,
  }
  repositoryBindings.set(projectId, binding)
  return clone(binding)
}

/** HU30: `DELETE /projects/{projectId}/integrations/github`. Simplificación de demo: limpia el binding en vez de marcarlo `DISABLED` — deja de aceptar eventos nuevos y no borra los Runs/fixtures ya creados. */
export async function mockDisconnectRepository(projectId: string): Promise<void> {
  await latency()
  requireProject(projectId)
  repositoryBindings.set(projectId, null)
}

function toAnalysisRunSummary(run: AnalysisRunDetailResponse): AnalysisRunSummaryResponse {
  const { id, projectId, pullRequest, status, current, actionRequiredCount, generatedTestsCount, createdAt, updatedAt, completedAt } = run
  return { id, projectId, pullRequest, status, current, actionRequiredCount, generatedTestsCount, createdAt, updatedAt, completedAt }
}

/** HU32: `GET /projects/{projectId}/analysis-runs?status&cursor&limit` (aquí `projectId` es opcional para ofrecer también un listado global). */
export async function mockListAnalysisRuns(projectId: string | undefined, status: AnalysisRunStatus | undefined): Promise<AnalysisRunListPage> {
  await latency()
  const items = Array.from(analysisRuns.values())
    .filter((run) => !projectId || run.projectId === projectId)
    .filter((run) => !status || run.status === status)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(toAnalysisRunSummary)
  return { items: clone(items), nextCursor: null }
}

/** HU32: `GET /analysis-runs/{analysisRunId}`. */
export async function mockGetAnalysisRun(analysisRunId: string): Promise<AnalysisRunDetailResponse> {
  await latency()
  const run = analysisRuns.get(analysisRunId)
  if (!run) notFound(`No existe el Analysis Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  return clone(run)
}

/** HU40: `GET /analysis-runs/{analysisRunId}/test-proposals`. */
export async function mockListTestProposals(analysisRunId: string): Promise<GeneratedTestProposalSetResponse> {
  await latency()
  const run = analysisRuns.get(analysisRunId)
  if (!run) notFound(`No existe el Analysis Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  const items = testProposals.get(analysisRunId) ?? []
  return clone({ analysisRunId, headSha: run.pullRequest.headSha, items })
}

/** HU40: `POST /analysis-runs/{analysisRunId}/test-publications`. Simplificación de demo: publica de inmediato (`PUBLISHED`) en vez de simular un job asíncrono adicional — el companion PR mock ya está listo en la primera consulta de `mockGetTestPublication`. */
export async function mockCreateTestPublication(analysisRunId: string, input: CreateTestPublicationRequest): Promise<TestPublicationAcceptedResponse> {
  await latency()
  const run = analysisRuns.get(analysisRunId)
  if (!run) notFound(`No existe el Analysis Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  if (run.status !== 'SUCCESS') throw new ApiError('Solo un Run SUCCESS admite publicación.', 409, 'demo-correlation-id', 'RUN_NOT_PUBLISHABLE')
  const proposals = testProposals.get(analysisRunId) ?? []
  const selected = proposals.filter((proposal) => input.proposalIds.includes(proposal.id))
  if (selected.length === 0 || selected.some((proposal) => proposal.status !== 'AVAILABLE')) {
    throw new ApiError('Las propuestas seleccionadas ya no están disponibles para publicar.', 409, 'demo-correlation-id', 'PROPOSAL_NOT_AVAILABLE')
  }
  selected.forEach((proposal) => { proposal.status = 'PUBLISHED' })
  sequence += 1
  const publicationId = `pub_demo_${sequence}`
  const createdAt = nowIso()
  const publication: TestPublicationResponse = {
    id: publicationId,
    analysisRunId,
    sourceHeadSha: run.pullRequest.headSha,
    status: 'PUBLISHED',
    branchName: `rag-tests/pr-${run.pullRequest.number}-${run.pullRequest.headSha.slice(0, 7)}`,
    companionPullRequestNumber: run.pullRequest.number + 100,
    companionPullRequestUrl: `https://github.com/${run.pullRequest.repositoryName}/pull/${run.pullRequest.number + 100}`,
    failureMessage: null,
    createdAt,
    updatedAt: createdAt,
  }
  testPublications.set(publicationId, publication)
  return { status: 'PENDING', pollAfterMs: 300, publicationId, analysisRunId }
}

/** HU40: `GET /test-publications/{publicationId}`. */
export async function mockGetTestPublication(publicationId: string): Promise<TestPublicationResponse> {
  await latency()
  const publication = testPublications.get(publicationId)
  if (!publication) notFound(`No existe la publicación demo "${publicationId}".`, 'PUBLICATION_NOT_FOUND')
  return clone(publication)
}

/** HU35/HU36: `GET /projects/{projectId}/functional-knowledge?status&cursor&limit`. */
export async function mockListFunctionalKnowledge(projectId: string, status?: FunctionalKnowledgeStatus): Promise<FunctionalKnowledgeListPage> {
  await latency()
  requireProject(projectId)
  const items = Array.from(functionalKnowledge.values())
    .filter((item) => item.projectId === projectId)
    .filter((item) => !status || item.status === status)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
  return { items: clone(items), nextCursor: null }
}
