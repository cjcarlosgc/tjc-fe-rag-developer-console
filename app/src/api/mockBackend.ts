import type { ActionRequiredListPage, FunctionalAnswerAcceptedResponse, FunctionalKnowledgeConflictResponse, FunctionalKnowledgeListPage, FunctionalKnowledgeResponse, FunctionalKnowledgeStatus, FunctionalQuestionResponse, FunctionalQuestionSetResponse, SubmitFunctionalAnswerRequest } from '../action-required/types'
import type { AgentTrajectoryStep, ContextTraceDetail, ContextTracePage, ContextTraceSummary, DiscoveredFilePage, ExperimentContextTraceFilters, RagCandidateNode, RagContextTraceDetail, SourceExcerpt } from '../context-explorer/types'
import type { ExperimentAccepted, ExperimentOperation, ExperimentResultViewModel } from '../experiments/types'
import type { RunComparisonAccepted, RunComparisonListPage, RunComparisonOperation } from '../run-comparison/types'
import type { CaptureNextPrState } from '../run-comparison/speculative/captureNextPr'
import type { ContextProvenance } from '../context-explorer/speculative/contextProvenance'
import type { PriorCoverageLevel } from '../control-plane/speculative/priorCoverage'
import type { TestInventoryResponse } from '../inventory/types'
import type { AnalysisHistoryItem, CreateProjectInput, Project, ProjectRole, UpdateProjectInput, Workspace, WorkspaceListResponse } from '../projects/types'
import { DEMO_FOREIGN_OWNER_LOGINS, DEMO_GITHUB_REPOSITORIES } from '../control-plane/demoRepositories'
import { canBindRepository } from '../control-plane/repositoryPermissions'
import type {
  AnalysisRunDetailResponse,
  AnalysisRunListPage,
  AnalysisRunStatus,
  AnalysisRunSummaryResponse,
  AnalysisRunTransitionResponse,
  AnalysisSymbolResponse,
  CreateRepositoryBindingRequest,
  CreateTestPublicationRequest,
  GeneratedTestProposalResponse,
  GeneratedTestProposalSetResponse,
  GitHubAppAccessResponse,
  GitHubUserRepositoryResponse,
  GitHubRepositoryBranchResponse,
  GitHubRepositoryBranchesResponse,
  GitHubUserRepositoryPage,
  ProjectRepositoryBindingResponse,
  TestPublicationAcceptedResponse,
  TestPublicationResponse,
  VerifyGitHubAppAccessRequest,
} from '../control-plane/types'
import { ApiError } from './client'

interface MockVersionState {
  history: AnalysisHistoryItem
  inventory: TestInventoryResponse
}

interface MockExperimentState {
  operation: ExperimentOperation
  polls: number
  /** Para ocultar el experimento cuando su Project se borra (HU56). */
  projectId: string
}

interface MockContextTraceState {
  detail: ContextTraceDetail
  /** HU27: cuántas llamadas a `getContextTrace` deben responder `409 CONTEXT_TRACE_NOT_FINISHED` antes de servir el detalle. */
  notFinishedUntilPolls: number
  polls: number
}

/** HU37/HU38: preguntas de un `AnalysisRun` (control plane PR-driven), ordenadas — solo una `PENDING` a la vez está vigente. `headChanged` simula que llegó un HEAD nuevo mientras se respondía: la pregunta pasa a `OBSOLETE` en vez de `ANSWERED` y el Run no se reanuda. `conflictQuestionId` (HU51, INTEROP-2.1 §6.11) marca la única pregunta demo cuyo primer envío choca con una `FunctionalKnowledge` `ACTIVE` existente — intencionalmente no es un chequeo genérico por `targetRef`: varias preguntas HU37/38 ya comparten `targetRef` con FK seedeadas y romperían su propio flujo si el conflicto se evaluara siempre. */
interface MockActionRequiredRunState {
  analysisRunId: string
  projectId: string
  questions: FunctionalQuestionResponse[]
  headChanged: boolean
  conflictQuestionId?: string
}

const projects = new Map<string, Project>()
const DEMO_WORKSPACES: Workspace[] = [
  { kind: 'PERSONAL', id: '1000001', login: 'acme', avatarUrl: null, role: 'ADMIN' },
  { kind: 'ORGANIZATION', id: '2000002', login: 'observability-lab', avatarUrl: null, role: 'MEMBER' },
  { kind: 'ORGANIZATION', id: '2000001', login: 'rag-tesis-org', avatarUrl: null, role: 'MEMBER' },
  { kind: 'ORGANIZATION', id: '2000003', login: 'team-sandbox', avatarUrl: null, role: 'ADMIN' },
]
/** HU56 (INTEROP-2.3 §6.1, implementado en Core — CS-20260920-003): Projects con borrado lógico. Se conservan sus datos internos (Runs, versions, Functional Knowledge) pero dejan de ser visibles por cualquier lectura del mock. */
const deletedProjects = new Map<string, Project>()
const versions = new Map<string, MockVersionState>()
const experiments = new Map<string, MockExperimentState>()
/** INTEROP-2.1 §6.5 (HU48, definido/no implementado), ver run-comparison/types.ts. Mapa aparte de `experiments` a propósito: no es la misma capacidad. */
const runComparisons = new Map<string, { polls: number; operation: RunComparisonOperation }>()
const contextTraces = new Map<string, MockContextTraceState>()
/** Vista de contexto RAG simulada para un AnalysisRun PR-driven. */
const analysisRunContextTraceId: Record<string, string> = { arun_checkout_pr45: 'trace_rag_order_total' }
const actionRequiredRuns = new Map<string, MockActionRequiredRunState>()
const repositoryBindings = new Map<string, ProjectRepositoryBindingResponse | null>()
/** HU30 user-centric (INTEROP-2.3 §6.8): intentos de verificación de acceso de la App por repo, para simular NOT_AUTHORIZED->revalidar->AUTHORIZED. */
const githubAppAccessVerifications = new Map<string, number>()
const analysisRuns = new Map<string, AnalysisRunDetailResponse>()
const testProposals = new Map<string, GeneratedTestProposalResponse[]>()
const testPublications = new Map<string, TestPublicationResponse>()
const functionalKnowledge = new Map<string, FunctionalKnowledgeResponse>()
/** PROPUESTA — HU49, ver run-comparison/speculative/captureNextPr.ts. Estado por proyecto, no global: "el próximo PR elegible" se arma sobre el repositorio vinculado a un proyecto puntual. */
const captureNextPrStates = new Map<string, CaptureNextPrState>()
let captureNextPrSeq = 0
let sequence = 2000

const clone = <T>(value: T): T => structuredClone(value)
const nowIso = () => new Date().toISOString()
const latency = () => new Promise<void>((resolve) => setTimeout(resolve, import.meta.env.MODE === 'test' ? 0 : 180))

function isProjectDeleted(projectId: string): boolean {
  return deletedProjects.has(projectId)
}

/** Un Run de un Project borrado deja de existir para la API (listados, detalle, Action Required), aunque el mock lo conserve internamente. */
function findVisibleRun(analysisRunId: string): AnalysisRunDetailResponse | undefined {
  const run = analysisRuns.get(analysisRunId)
  return run && !isProjectDeleted(run.projectId) ? run : undefined
}

/** Un Run existente de un Project borrado se comporta como inexistente; un id desconocido conserva el comportamiento propio de cada lectura. */
function hideRunOfDeletedProject(analysisRunId: string): void {
  const run = analysisRuns.get(analysisRunId)
  if (run && isProjectDeleted(run.projectId)) notFound(`No existe el Analysis Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
}

function findVisibleActionRequiredRun(analysisRunId: string): MockActionRequiredRunState | undefined {
  const state = actionRequiredRuns.get(analysisRunId)
  return state && !isProjectDeleted(state.projectId) ? state : undefined
}

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
    id: 'trace_rag_order_total', kind: 'RAG', projectVersionId: 'ver_checkout_7', targetId: 'ver_checkout_7-method-total', testRunId: null, experimentId: null,
    strategy: 'RAG', repetition: null, attempt: 1, current: true, artifactIds: [], createdAt: '2026-08-31T15:01:10.000Z',
    target: { chunkIds: ['chunk-target-order-total'], excerpt: orderTotalTarget, tokenCount: 38 },
    candidates: orderTotalCandidates,
    retrievedChunks: orderTotalCandidates.length,
    selectedChunks: selected.length,
    contextTokens: selected.reduce((total, candidate) => total + candidate.tokenCount, 0),
    configuration: { minimumScore: .5, topK: 5, maxContextTokens: 4_000, semanticWeight: .7, structuralWeight: .3 },
  }
  contextTraces.set(currentTrace.id, { detail: currentTrace, notFinishedUntilPolls: 0, polls: 0 })

}

function seed(): void {
  const completedAt = '2026-08-31T14:18:00.000Z'
  const project: Project = { id: 'prj_checkout_demo', name: 'checkout-service', currentVersionId: 'ver_checkout_7', workspace: DEMO_WORKSPACES[0], role: 'ADMIN', createdAt: '2026-08-24T09:30:00.000Z', updatedAt: completedAt }
  const emptyProject: Project = { id: 'prj_billing_demo', name: 'billing-engine', currentVersionId: null, workspace: DEMO_WORKSPACES[0], role: 'ADMIN', createdAt: '2026-08-30T16:45:00.000Z', updatedAt: '2026-08-30T16:45:00.000Z' }
  const maintainerProject: Project = { id: 'prj_org_orders_demo', name: 'orders-api', currentVersionId: null, workspace: DEMO_WORKSPACES[2], role: 'MAINTAINER', createdAt: '2026-09-12T08:30:00.000Z', updatedAt: '2026-09-13T12:00:00.000Z' }
  const readerProject: Project = { id: 'prj_org_metrics_demo', name: 'metrics-console', currentVersionId: null, workspace: DEMO_WORKSPACES[1], role: 'READER', createdAt: '2026-09-13T10:15:00.000Z', updatedAt: '2026-09-13T10:15:00.000Z' }
  projects.set(project.id, project)
  projects.set(emptyProject.id, emptyProject)
  projects.set(maintainerProject.id, maintainerProject)
  projects.set(readerProject.id, readerProject)
  versions.set('ver_checkout_7', {
    history: { id: 'ver_checkout_7', projectId: project.id, status: 'COMPLETED', originalFileName: null, filesProcessed: 47, chunksCount: 186, detectedFramework: 'VITEST', targetsTotal: 5, targetsWithTest: 2, targetsMissingTest: 3, createdAt: '2026-08-31T14:17:10.000Z', completedAt, current: true },
    inventory: buildInventory('ver_checkout_7'),
  })
  versions.set('ver_checkout_6', {
    history: { id: 'ver_checkout_6', projectId: project.id, status: 'COMPLETED', originalFileName: null, filesProcessed: 43, chunksCount: 164, detectedFramework: 'VITEST', targetsTotal: 4, targetsWithTest: 2, targetsMissingTest: 2, createdAt: '2026-08-28T10:05:00.000Z', completedAt: '2026-08-28T10:06:21.000Z', current: false },
    inventory: buildInventory('ver_checkout_6', 6),
  })
  versions.set('ver_checkout_5', {
    history: { id: 'ver_checkout_5', projectId: project.id, status: 'COMPLETED', originalFileName: null, filesProcessed: 38, chunksCount: 141, detectedFramework: 'VITEST', targetsTotal: 3, targetsWithTest: 1, targetsMissingTest: 2, createdAt: '2026-08-24T09:34:00.000Z', completedAt: '2026-08-24T09:35:30.000Z', current: false },
    inventory: buildInventory('ver_checkout_5', 5),
  })
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
  /** Caso "respuesta revela inconsistencia": responder esta pregunta muta el AnalysisRun a BEHAVIORAL_MISMATCH — ver mockSubmitFunctionalAnswer. */
  actionRequiredRuns.set('arun_billing_pr24', {
    analysisRunId: 'arun_billing_pr24',
    projectId: 'prj_billing_demo',
    headChanged: false,
    questions: [
      {
        id: 'fq_billing_pr24_1',
        analysisRunId: 'arun_billing_pr24',
        projectId: 'prj_billing_demo',
        repositoryName: 'acme/billing-engine',
        pullRequestNumber: 24,
        headSha: 'e4e4e4e',
        target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'InvoiceService.applyLateFee', filePath: 'src/domain/InvoiceService.ts', changeKind: 'DIRECTLY_CHANGED' },
        question: '¿"applyLateFee" debe aplicarse si la factura ya fue marcada como pagada parcialmente?',
        rationale: '"applyLateFee" no tiene pruebas existentes que fijen su comportamiento cuando ya hubo un pago parcial antes de la fecha de mora.',
        status: 'PENDING',
        visualAid: { kind: 'CODE_FRAGMENT', title: 'InvoiceService.ts:88', language: 'typescript', content: 'applyLateFee(invoice: Invoice): Invoice {\n  // ¿debe saltarse si invoice.paidAmount > 0?\n  return { ...invoice, total: invoice.total + this.feeFor(invoice) }\n}' },
        createdAt: '2026-09-13T21:05:00.000Z',
      },
    ],
  })
  /** Caso HU51 (INTEROP-2.1 §6.11, definido/no implementado): responder esta pregunta choca con `fk_shipping_zone` (ACTIVE) — ver mockSubmitFunctionalAnswer. Solo demo en Focus Mode: sin `AnalysisRun` propio en control-plane. */
  actionRequiredRuns.set('arun_checkout_pr52', {
    analysisRunId: 'arun_checkout_pr52',
    projectId: 'prj_checkout_demo',
    headChanged: false,
    conflictQuestionId: 'fq_checkout_pr52_1',
    questions: [
      {
        id: 'fq_checkout_pr52_1',
        analysisRunId: 'arun_checkout_pr52',
        projectId: 'prj_checkout_demo',
        repositoryName: 'acme/checkout-service',
        pullRequestNumber: 52,
        headSha: 'b2c3d4e',
        target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'ShippingAddressValidator.validate', filePath: 'src/domain/ShippingAddressValidator.ts', changeKind: 'DIRECTLY_CHANGED' },
        question: '¿"validate" debe aceptar direcciones con código postal fuera de las zonas habilitadas si el cliente es corporativo?',
        rationale: 'El PR agrega una excepción para clientes corporativos, pero ya existe una regla vigente sobre zonas de envío habilitadas para este símbolo.',
        status: 'PENDING',
        visualAid: null,
        createdAt: '2026-09-15T10:00:00.000Z',
      },
    ],
  })
  actionRequiredRuns.set('arun_org_metrics_pr15', {
    analysisRunId: 'arun_org_metrics_pr15',
    projectId: 'prj_org_metrics_demo',
    headChanged: false,
    questions: [{
      id: 'fq_org_metrics_pr15_1', analysisRunId: 'arun_org_metrics_pr15', projectId: 'prj_org_metrics_demo',
      repositoryName: 'observability-lab/metrics-console', pullRequestNumber: 15, headSha: '15f15f1',
      target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'MetricsQuery.range', filePath: 'src/metrics/MetricsQuery.ts', changeKind: 'DIRECTLY_CHANGED' },
      question: '¿Los límites de fecha se interpretan en UTC o en la zona horaria del usuario?',
      rationale: 'El PR agrega filtros temporales sin definir la zona horaria que debe usar la consulta.',
      status: 'PENDING', visualAid: null, createdAt: '2026-09-14T09:05:00.000Z',
    }],
  })
}

interface AnalysisRunSeed extends AnalysisRunDetailResponse {
  __proposals?: GeneratedTestProposalResponse[]
}

/** HU30/HU32/HU39/HU40: repository bindings de los dos proyectos demo y los 9 escenarios mock-first de `spec.md` de la feature 013 (un `AnalysisRun` por escenario, más el par pr17/pr17-2 para "corrección/HEAD nuevo"). */
function seedControlPlane(): void {
  repositoryBindings.set('prj_checkout_demo', { projectId: 'prj_checkout_demo', installationId: 'inst_checkout_1', repositoryId: 'repo_checkout', repositoryName: 'acme/checkout-service', integrationBranch: 'develop', status: 'ENABLED', createdAt: '2026-08-20T10:00:00.000Z', updatedAt: '2026-08-20T10:00:00.000Z' })
  repositoryBindings.set('prj_billing_demo', { projectId: 'prj_billing_demo', installationId: 'inst_billing_1', repositoryId: 'repo_billing', repositoryName: 'acme/billing-engine', integrationBranch: 'develop', status: 'ENABLED', createdAt: '2026-08-22T10:00:00.000Z', updatedAt: '2026-08-22T10:00:00.000Z' })
  repositoryBindings.set('prj_org_orders_demo', { projectId: 'prj_org_orders_demo', installationId: 'inst_rag_orders', repositoryId: 'repo_rag_orders', repositoryName: 'rag-tesis-org/orders-api', integrationBranch: 'main', status: 'ENABLED', createdAt: '2026-09-12T08:30:00.000Z', updatedAt: '2026-09-12T08:30:00.000Z' })
  repositoryBindings.set('prj_org_metrics_demo', { projectId: 'prj_org_metrics_demo', installationId: 'inst_observability_metrics', repositoryId: 'repo_observability_metrics', repositoryName: 'observability-lab/metrics-console', integrationBranch: 'main', status: 'ENABLED', createdAt: '2026-09-13T10:15:00.000Z', updatedAt: '2026-09-13T10:15:00.000Z' })

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
    {
      id: 'arun_checkout_pr48', projectId: 'prj_checkout_demo',
      pullRequest: pr('repo_checkout', 'acme/checkout-service', 48, 'Normaliza validación de direcciones de envío', 'feature/shipping-address-validation', '888bbb8', 'devB'),
      status: 'INFRASTRUCTURE_FAILURE', current: true, actionRequiredCount: 0, generatedTestsCount: 0,
      createdAt: '2026-09-13T10:00:00.000Z', updatedAt: '2026-09-13T10:04:00.000Z', completedAt: '2026-09-13T10:04:00.000Z',
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: '888bbb8', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [{ language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'ShippingAddressValidator', filePath: 'src/domain/ShippingAddressValidator.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: false, resultSummary: 'La GitHub Compare API no respondió al materializar el snapshot del HEAD — falla de infraestructura, no del código. El Run puede reintentarse.', detailsUrl: '/projects/prj_checkout_demo/runs/arun_checkout_pr48',
    },
    {
      id: 'arun_billing_pr23', projectId: 'prj_billing_demo',
      pullRequest: pr('repo_billing', 'acme/billing-engine', 23, 'Agrega cálculo de impuestos regionales', 'feature/regional-tax', 'b0b0b0b', 'devA'),
      status: 'SUCCESS', current: true, actionRequiredCount: 0, generatedTestsCount: 2,
      createdAt: '2026-09-05T08:00:00.000Z', updatedAt: '2026-09-05T08:22:00.000Z', completedAt: '2026-09-05T08:22:00.000Z',
      attemptCount: 1, indexMode: 'BOOTSTRAP', changesetBaseSha: '000c1c1', changesetHeadSha: 'b0b0b0b', indexDeltaBaseSha: null,
      symbols: [{ language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'TaxCalculator', filePath: 'src/domain/TaxCalculator.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: true, resultSummary: 'Primer AnalysisRun de este proyecto tras conectar el repositorio — bootstrap completo. 2 pruebas generadas y validadas.', detailsUrl: '/projects/prj_billing_demo/runs/arun_billing_pr23',
      __proposals: [
        { id: 'prop_pr23_1', relativePath: 'src/domain/TaxCalculator.spec.ts', target: { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'TaxCalculator', filePath: 'src/domain/TaxCalculator.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr23_1'), status: 'AVAILABLE' },
        { id: 'prop_pr23_2', relativePath: 'src/domain/TaxCalculator.regional.spec.ts', target: { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'TaxCalculator', filePath: 'src/domain/TaxCalculator.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr23_2'), status: 'AVAILABLE' },
      ],
    },
    {
      id: 'arun_checkout_pr49', projectId: 'prj_checkout_demo',
      pullRequest: pr('repo_checkout', 'acme/checkout-service', 49, 'Refactor grande del pipeline de checkout', 'feature/checkout-pipeline-refactor', 'c9c9c9c', 'devC'),
      status: 'SUCCESS', current: true, actionRequiredCount: 0, generatedTestsCount: 4,
      createdAt: '2026-09-13T16:00:00.000Z', updatedAt: '2026-09-13T16:40:00.000Z', completedAt: '2026-09-13T16:40:00.000Z',
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: 'c9c9c9c', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [
        { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.calculateTotal', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' },
        { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.createOrder', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' },
        { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'CouponPolicy', filePath: 'src/domain/CouponPolicy.ts', changeKind: 'DIRECTLY_CHANGED' },
        { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'DiscountEngine', filePath: 'src/domain/DiscountEngine.ts', changeKind: 'DIRECTLY_CHANGED' },
        { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'ShippingAddressValidator', filePath: 'src/domain/ShippingAddressValidator.ts', changeKind: 'DIRECTLY_CHANGED' },
        { language: 'TYPESCRIPT', kind: 'FUNCTION', qualifiedName: 'formatCurrency', filePath: 'src/shared/money.ts', changeKind: 'DIRECTLY_CHANGED' },
        { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'InvoiceService', filePath: 'src/domain/InvoiceService.ts', changeKind: 'POTENTIALLY_IMPACTED' },
        { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'RefundPolicy', filePath: 'src/domain/RefundPolicy.ts', changeKind: 'POTENTIALLY_IMPACTED' },
        { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'TaxCalculator', filePath: 'src/domain/TaxCalculator.ts', changeKind: 'POTENTIALLY_IMPACTED' },
        { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'PaymentGateway.charge', filePath: 'src/domain/PaymentGateway.ts', changeKind: 'POTENTIALLY_IMPACTED' },
        { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'PaymentGateway.refund', filePath: 'src/domain/PaymentGateway.ts', changeKind: 'POTENTIALLY_IMPACTED' },
        { language: 'TYPESCRIPT', kind: 'INTERFACE', qualifiedName: 'OrderItem', filePath: 'src/domain/OrderItem.ts', changeKind: 'POTENTIALLY_IMPACTED' },
        { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'Inventory', filePath: 'src/domain/Inventory.ts', changeKind: 'POTENTIALLY_IMPACTED' },
        { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'AuditTrail', filePath: 'src/domain/AuditTrail.ts', changeKind: 'POTENTIALLY_IMPACTED' },
      ],
      functionalBehaviorValidated: true, resultSummary: 'Changeset grande: 6 símbolos con cambio directo y 8 potencialmente impactados. 4 pruebas generadas y validadas contra el HEAD vigente.', detailsUrl: '/projects/prj_checkout_demo/runs/arun_checkout_pr49',
      __proposals: [
        { id: 'prop_pr49_1', relativePath: 'src/domain/OrderService.pipeline.spec.ts', target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.calculateTotal', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr49_1'), status: 'AVAILABLE' },
        { id: 'prop_pr49_2', relativePath: 'src/domain/CouponPolicy.pipeline.spec.ts', target: { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'CouponPolicy', filePath: 'src/domain/CouponPolicy.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr49_2'), status: 'AVAILABLE' },
        { id: 'prop_pr49_3', relativePath: 'src/domain/DiscountEngine.pipeline.spec.ts', target: { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'DiscountEngine', filePath: 'src/domain/DiscountEngine.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr49_3'), status: 'AVAILABLE' },
        { id: 'prop_pr49_4', relativePath: 'src/domain/ShippingAddressValidator.pipeline.spec.ts', target: { language: 'TYPESCRIPT', kind: 'CLASS', qualifiedName: 'ShippingAddressValidator', filePath: 'src/domain/ShippingAddressValidator.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr49_4'), status: 'AVAILABLE' },
      ],
    },
    {
      id: 'arun_checkout_pr50', projectId: 'prj_checkout_demo',
      pullRequest: pr('repo_checkout', 'acme/checkout-service', 50, 'Ajusta política de reintentos de pago', 'feature/payment-retry-policy', 'd0d0d0d', 'devA'),
      status: 'SUCCESS', current: true, actionRequiredCount: 0, generatedTestsCount: 3,
      createdAt: '2026-09-13T20:00:00.000Z', updatedAt: '2026-09-13T20:35:00.000Z', completedAt: '2026-09-13T20:35:00.000Z',
      attemptCount: 2, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: 'd0d0d0d', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [{ language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'PaymentGateway.charge', filePath: 'src/domain/PaymentGateway.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: true, resultSummary: 'El primer intento generó una prueba contra un HEAD que luego recibió un push adicional; el segundo intento la regeneró junto con dos más, ya frescas.', detailsUrl: '/projects/prj_checkout_demo/runs/arun_checkout_pr50',
      __proposals: [
        { id: 'prop_pr50_1_stale', relativePath: 'src/domain/PaymentGateway.retry.spec.ts', target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'PaymentGateway.charge', filePath: 'src/domain/PaymentGateway.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr50_1_stale'), status: 'STALE' },
        { id: 'prop_pr50_2', relativePath: 'src/domain/PaymentGateway.retry.spec.ts', target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'PaymentGateway.charge', filePath: 'src/domain/PaymentGateway.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr50_2'), status: 'AVAILABLE' },
        { id: 'prop_pr50_3', relativePath: 'src/domain/PaymentGateway.retry.edgecases.spec.ts', target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'PaymentGateway.charge', filePath: 'src/domain/PaymentGateway.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr50_3'), status: 'AVAILABLE' },
      ],
    },
    {
      id: 'arun_billing_pr24', projectId: 'prj_billing_demo',
      pullRequest: pr('repo_billing', 'acme/billing-engine', 24, 'Recargo por mora en facturas', 'feature/late-fee', 'e4e4e4e', 'devE'),
      status: 'ACTION_REQUIRED', current: true, actionRequiredCount: 1, generatedTestsCount: 0,
      createdAt: '2026-09-13T21:00:00.000Z', updatedAt: '2026-09-13T21:05:00.000Z', completedAt: null,
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: 'e4e4e4e', indexDeltaBaseSha: 'c1c1c1c',
      symbols: [{ language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'InvoiceService.applyLateFee', filePath: 'src/domain/InvoiceService.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: false, resultSummary: null, detailsUrl: '/projects/prj_billing_demo/runs/arun_billing_pr24',
    },
    {
      id: 'arun_org_orders_pr8', projectId: 'prj_org_orders_demo',
      pullRequest: pr('repo_rag_orders', 'rag-tesis-org/orders-api', 8, 'Valida reintentos idempotentes de pedidos', 'feature/idempotent-orders', '8a8a8a8', 'demo-maintainer'),
      status: 'SUCCESS', current: true, actionRequiredCount: 0, generatedTestsCount: 2,
      createdAt: '2026-09-13T12:00:00.000Z', updatedAt: '2026-09-13T12:18:00.000Z', completedAt: '2026-09-13T12:18:00.000Z',
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: '6a6a6a6', changesetHeadSha: '8a8a8a8', indexDeltaBaseSha: '6a6a6a6',
      symbols: [{ language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.submit', filePath: 'src/orders/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: true, resultSummary: '2 pruebas generadas y validadas contra el HEAD vigente.', detailsUrl: '/projects/prj_org_orders_demo/runs/arun_org_orders_pr8',
    },
    {
      id: 'arun_org_metrics_pr15', projectId: 'prj_org_metrics_demo',
      pullRequest: pr('repo_observability_metrics', 'observability-lab/metrics-console', 15, 'Agrega filtros de rango temporal', 'feature/time-range-filter', '15f15f1', 'demo-reader'),
      status: 'ACTION_REQUIRED', current: true, actionRequiredCount: 1, generatedTestsCount: 0,
      createdAt: '2026-09-14T09:00:00.000Z', updatedAt: '2026-09-14T09:05:00.000Z', completedAt: null,
      attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: '5a5a5a5', changesetHeadSha: '15f15f1', indexDeltaBaseSha: '5a5a5a5',
      symbols: [{ language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'MetricsQuery.range', filePath: 'src/metrics/MetricsQuery.ts', changeKind: 'DIRECTLY_CHANGED' }],
      functionalBehaviorValidated: false, resultSummary: null, detailsUrl: '/projects/prj_org_metrics_demo/runs/arun_org_metrics_pr15',
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
      id: 'fk_shipping_zone', projectId: 'prj_checkout_demo', scope: 'METHOD', targetRef: 'ShippingAddressValidator.validate',
      originalQuestion: '¿"validate" debe rechazar direcciones fuera de las zonas de envío habilitadas?',
      originalAnswer: 'Sí',
      normalizedRule: 'Ninguna dirección fuera de las zonas de envío habilitadas debe pasar "validate", sin excepciones por tipo de cliente.',
      source: 'HUMAN_ANSWER', status: 'ACTIVE', supersedesId: null, createdAt: '2026-09-10T14:00:00.000Z',
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
  deletedProjects.clear()
  versions.clear()
  experiments.clear()
  runComparisons.clear()
  contextTraces.clear()
  actionRequiredRuns.clear()
  repositoryBindings.clear()
  githubAppAccessVerifications.clear()
  analysisRuns.clear()
  testProposals.clear()
  testPublications.clear()
  functionalKnowledge.clear()
  captureNextPrStates.clear()
  captureNextPrSeq = 0
  sequence = 2000
  seed()
}

resetMockBackend()

function findDemoWorkspace(workspaceId: string): Workspace {
  const workspace = DEMO_WORKSPACES.find((item) => item.id === workspaceId)
  if (!workspace) notFound('No encontramos ese workspace para la identidad demo. Actualiza la lista.', 'WORKSPACE_NOT_FOUND')
  return workspace
}

/** Projects de organización sin binding o REVOKED solo son visibles al Admin, según INTEROP-2.4 §6.13. */
function canSeeProject(project: Project): boolean {
  if (project.workspace.kind === 'PERSONAL' || project.role === 'ADMIN') return true
  const binding = repositoryBindings.get(project.id)
  return Boolean(binding && binding.status !== 'REVOKED')
}

function requireProjectRole(projectId: string, requiredRole: ProjectRole): Project {
  const project = requireProject(projectId)
  const rank: Record<ProjectRole, number> = { READER: 0, MAINTAINER: 1, ADMIN: 2 }
  if (rank[project.role] < rank[requiredRole]) {
    throw new ApiError(`Tu rol ${project.role} no permite esta acción; se requiere ${requiredRole}.`, 403, 'demo-correlation-id', 'PROJECT_ROLE_INSUFFICIENT', { requiredRole, currentRole: project.role })
  }
  return project
}

export async function mockListWorkspaces(): Promise<WorkspaceListResponse> {
  await latency()
  return { items: clone(DEMO_WORKSPACES) }
}

export async function mockListProjects(workspaceId: string): Promise<Project[]> {
  await latency()
  findDemoWorkspace(workspaceId)
  return Array.from(projects.values()).filter((project) => project.workspace.id === workspaceId && canSeeProject(project)).map(clone)
}

export async function mockGetProject(projectId: string): Promise<Project> {
  await latency()
  const project = projects.get(projectId)
  if (!project || !canSeeProject(project)) notFound(`No existe el proyecto demo "${projectId}".`, 'PROJECT_NOT_FOUND')
  return clone(project)
}

export async function mockListAnalysisHistory(projectId: string): Promise<AnalysisHistoryItem[]> {
  await latency()
  const project = projects.get(projectId)
  if (!project) notFound(`No existe el proyecto demo "${projectId}".`, 'PROJECT_NOT_FOUND')
  return Array.from(versions.values())
    .filter((state) => state.history.projectId === projectId)
    .map((state) => ({ ...state.history, current: project.currentVersionId === state.history.id }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(clone)
}

export async function mockCreateProject(input: CreateProjectInput): Promise<Project> {
  await latency()
  const workspace = findDemoWorkspace(input.workspaceId ?? DEMO_WORKSPACES[0].id)
  if (workspace.kind === 'ORGANIZATION' && workspace.role !== 'ADMIN') {
    throw new ApiError('Solo un owner activo de la organización puede crear Projects en ese workspace.', 403, 'demo-correlation-id', 'WORKSPACE_ADMIN_REQUIRED')
  }
  sequence += 1
  const createdAt = nowIso()
  const project: Project = { id: `prj_demo_${sequence}`, name: input.name.trim(), currentVersionId: null, workspace, role: 'ADMIN', createdAt, updatedAt: createdAt }
  projects.set(project.id, project)
  return clone(project)
}

export async function mockRenameProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
  await latency()
  const project = requireProjectRole(projectId, 'ADMIN')
  const updated: Project = { ...project, name: input.name.trim(), updatedAt: nowIso() }
  projects.set(projectId, updated)
  return clone(updated)
}

export async function mockGetTestInventory(projectVersionId: string): Promise<TestInventoryResponse> {
  await latency()
  const state = versions.get(projectVersionId)
  if (!state) notFound(`No existe la ProjectVersion demo "${projectVersionId}".`, 'PROJECT_VERSION_NOT_FOUND')
  return clone(state.inventory)
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
  const project = requireProjectRole(projectId, 'MAINTAINER')
  const inventory = project.currentVersionId ? versions.get(project.currentVersionId)?.inventory : undefined
  const target = inventory?.targets.find((item) => item.id === targetId)
  if (!target) notFound('El TestTarget no existe o no pertenece a este Project.', 'UNRESOLVABLE_TARGET')
  const label = target?.methodName ?? target?.symbolName ?? targetId
  sequence += 1
  const experimentId = `exp_demo_${sequence}`
  experiments.set(experimentId, { projectId, polls: 0, operation: { id: experimentId, status: 'PENDING', progress: 0, result: experimentResult(label) } })
  if (project.currentVersionId) seedExperimentContextTraces(experimentId, project.currentVersionId, targetId, target?.filePath ?? 'src/domain/OrderService.ts', target?.methodName ?? target?.symbolName ?? null)
  return { experimentId, status: 'PENDING', pollAfterMs: 460 }
}

export async function mockGetExperiment(experimentId: string): Promise<ExperimentOperation> {
  await latency()
  const state = experiments.get(experimentId)
  if (!state || isProjectDeleted(state.projectId)) notFound(`No existe el experimento demo "${experimentId}".`, 'INVALID_REQUEST')
  state.polls += 1
  if (state.polls === 1) state.operation = { ...state.operation, status: 'RUNNING', progress: 34 }
  else if (state.polls === 2) state.operation = { ...state.operation, status: 'RUNNING', progress: 72 }
  else state.operation = { ...state.operation, status: 'COMPLETED', progress: 100 }
  return clone(state.operation)
}

/** Comparación definida, con adaptación live pendiente. Reusa experimentResult y cambia la identidad a analysisRunId más símbolo. */
export async function mockStartRunComparison(analysisRunId: string, symbol: AnalysisSymbolResponse): Promise<RunComparisonAccepted> {
  await latency()
  const run = findVisibleRun(analysisRunId)
  if (!run) notFound(`No existe el Analysis Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  requireProjectRole(run.projectId, 'MAINTAINER')
  if (run.status === 'ACTION_REQUIRED') throw new ApiError('Este Run todavía necesita contexto funcional antes de compararse — resuelve las preguntas pendientes primero.', 409, 'demo-correlation-id', 'RUN_NOT_ELIGIBLE')
  if (symbol.changeKind !== 'DIRECTLY_CHANGED' || (symbol.kind !== 'METHOD' && symbol.kind !== 'FUNCTION')) throw new ApiError(`"${symbol.qualifiedName}" no es un símbolo METHOD/FUNCTION con cambio directo — no es una unidad experimental válida.`, 422, 'demo-correlation-id', 'UNSUPPORTED_SYMBOL_KIND')
  sequence += 1
  const comparisonId = `runcmp_demo_${sequence}`
  runComparisons.set(comparisonId, { polls: 0, operation: { id: comparisonId, analysisRunId, projectId: run.projectId, projectVersionId: `ver_${run.projectId}`, symbol, status: 'PENDING', progress: 0, result: experimentResult(symbol.qualifiedName) } })
  return { analysisRunId, comparisonId, projectVersionId: `ver_${run.projectId}`, status: 'PENDING', pollAfterMs: 460 }
}

/** El contrato real separa `GET /experiments/{id}` (sin `result`) de `GET .../results` (409 hasta estado terminal, §5). Esta vista compuesta simula esa regla: `result` no viaja hasta `COMPLETED`, igual que exigiría un adapter live real. */
export async function mockGetRunComparison(comparisonId: string): Promise<RunComparisonOperation> {
  await latency()
  const state = runComparisons.get(comparisonId)
  if (!state || isProjectDeleted(state.operation.projectId)) notFound(`No existe la comparación demo "${comparisonId}".`, 'INVALID_REQUEST')
  state.polls += 1
  if (state.polls === 1) state.operation = { ...state.operation, status: 'RUNNING', progress: 34 }
  else if (state.polls === 2) state.operation = { ...state.operation, status: 'RUNNING', progress: 72 }
  else state.operation = { ...state.operation, status: 'COMPLETED', progress: 100 }
  const snapshot = clone(state.operation)
  return snapshot.status === 'COMPLETED' ? snapshot : { ...snapshot, result: undefined }
}

/** HU48: `GET /analysis-runs/{analysisRunId}/experiments`. Lectura pura (no avanza `polls`, a diferencia de `mockGetRunComparison`) — permite listar todos los trials de un Run sin interferir con el polling individual de cada uno. */
export async function mockListRunComparisons(analysisRunId: string): Promise<RunComparisonListPage> {
  await latency()
  hideRunOfDeletedProject(analysisRunId)
  const items = Array.from(runComparisons.values())
    .filter((state) => state.operation.analysisRunId === analysisRunId)
    .map((state) => state.operation.status === 'COMPLETED' ? state.operation : { ...state.operation, result: undefined })
  return { items: clone(items), nextCursor: null }
}

function defaultCaptureNextPrState(projectId: string): CaptureNextPrState {
  return { projectId, status: 'OFF', armedAt: null }
}

/** PROPUESTA — HU49, ver run-comparison/speculative/captureNextPr.ts. */
export async function mockGetCaptureNextPrState(projectId: string): Promise<CaptureNextPrState> {
  await latency()
  requireProject(projectId)
  return clone(captureNextPrStates.get(projectId) ?? defaultCaptureNextPrState(projectId))
}

export async function mockArmCaptureNextPr(projectId: string): Promise<CaptureNextPrState> {
  await latency()
  requireProject(projectId)
  const state: CaptureNextPrState = { projectId, status: 'ARMED', armedAt: new Date().toISOString() }
  captureNextPrStates.set(projectId, state)
  return clone(state)
}

export async function mockDisarmCaptureNextPr(projectId: string): Promise<CaptureNextPrState> {
  await latency()
  requireProject(projectId)
  const state = defaultCaptureNextPrState(projectId)
  captureNextPrStates.set(projectId, state)
  return clone(state)
}

/**
 * Demo-only, sin equivalente en el handoff: no hay un webhook real que
 * dispare "el próximo PR elegible", así que el mock expone un disparador
 * explícito para poder demostrar la captura en vivo en vez de esperar
 * pasivamente. Reusa `AnalysisRunDetailResponse` con un símbolo `METHOD`
 * `DIRECTLY_CHANGED` fabricado por proyecto — el mismo modelo de HU48, no un
 * motor experimental paralelo.
 */
const CAPTURE_SYMBOL_BY_PROJECT: Record<string, AnalysisSymbolResponse> = {
  prj_checkout_demo: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'OrderService.calculateTotal', filePath: 'src/domain/OrderService.ts', changeKind: 'DIRECTLY_CHANGED' },
  prj_billing_demo: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'InvoiceService.applyLateFee', filePath: 'src/domain/InvoiceService.ts', changeKind: 'DIRECTLY_CHANGED' },
}

export async function mockSimulateNextEligiblePullRequest(projectId: string): Promise<AnalysisRunSummaryResponse> {
  await latency()
  requireProject(projectId)
  const state = captureNextPrStates.get(projectId)
  if (!state || state.status !== 'ARMED') throw new ApiError('"Capture next PR" no está armado para este proyecto.', 409, 'demo-correlation-id', 'CAPTURE_NOT_ARMED')
  const binding = repositoryBindings.get(projectId)
  if (!binding) notFound(`El proyecto demo "${projectId}" no tiene un repositorio vinculado.`, 'REPOSITORY_BINDING_NOT_FOUND')
  const symbol = CAPTURE_SYMBOL_BY_PROJECT[projectId]
  if (!symbol) notFound(`No hay un símbolo demo configurado para capturar en el proyecto "${projectId}".`, 'CAPTURE_NOT_CONFIGURED')
  captureNextPrSeq += 1
  const number = 900 + captureNextPrSeq
  const sha = `cap${captureNextPrSeq}`.padEnd(7, '0')
  const runId = `arun_captured_${captureNextPrSeq}`
  const now = new Date().toISOString()
  const run: AnalysisRunDetailResponse = {
    id: runId, projectId,
    pullRequest: { repositoryId: binding.repositoryId, repositoryName: binding.repositoryName, number, title: 'Capturado en vivo por "Capture next PR"', baseRef: binding.integrationBranch, headRef: `capture/pr-${number}`, baseSha: 'c1c1c1c', headSha: sha, draft: false, state: 'OPEN', actorLogin: 'demo-presenter' },
    status: 'SUCCESS', current: true, actionRequiredCount: 0, generatedTestsCount: 1,
    createdAt: now, updatedAt: now, completedAt: now,
    attemptCount: 1, indexMode: 'INCREMENTAL', changesetBaseSha: 'c1c1c1c', changesetHeadSha: sha, indexDeltaBaseSha: 'c1c1c1c',
    symbols: [symbol],
    functionalBehaviorValidated: true, resultSummary: 'Run capturado en vivo para demostrar HU49 — generó 1 prueba nueva sobre el símbolo elegible.', detailsUrl: `/projects/${projectId}/runs/${runId}`,
  }
  analysisRuns.set(runId, run)
  captureNextPrStates.set(projectId, defaultCaptureNextPrState(projectId))
  return clone(toAnalysisRunSummary(run))
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

/** Devuelve la vista RAG simulada asociada a un AnalysisRun PR-driven. */
export async function mockGetAnalysisRunContextTrace(analysisRunId: string): Promise<RagContextTraceDetail | null> {
  await latency()
  hideRunOfDeletedProject(analysisRunId)
  const traceId = analysisRunContextTraceId[analysisRunId]
  const state = traceId ? contextTraces.get(traceId) : undefined
  if (!state || state.detail.kind !== 'RAG') return null
  return clone(state.detail)
}

/** PROPUESTA — HU54, ver context-explorer/speculative/contextProvenance.ts. */
export async function mockGetContextProvenance(analysisRunId: string): Promise<ContextProvenance> {
  await latency()
  const run = findVisibleRun(analysisRunId)
  if (!run) notFound(`No existe el Analysis Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  const symbolNames = new Set(run.symbols.map((symbol) => symbol.qualifiedName))
  const functionalKnowledgeRefs = Array.from(functionalKnowledge.values())
    .filter((item) => item.projectId === run.projectId && item.status === 'ACTIVE' && item.targetRef !== null && symbolNames.has(item.targetRef))
    .map((item) => ({ id: item.id, normalizedRule: item.normalizedRule }))
  const existingTestEvidence = run.symbols.slice(0, 2).map((symbol) => ({
    filePath: symbol.filePath.replace(/\.ts$/, '.spec.ts'),
    testName: `${symbol.qualifiedName} — comportamiento existente`,
  }))
  return clone({ functionalKnowledgeRefs, existingTestEvidence })
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
  if (projectId) requireProjectRole(projectId, 'READER')
  const items = Array.from(actionRequiredRuns.values())
    .filter((state) => !isProjectDeleted(state.projectId) && projects.has(state.projectId) && canSeeProject(projects.get(state.projectId)!))
    .filter((state) => !projectId || state.projectId === projectId)
    .map(currentActionRequiredQuestion)
    .filter((question): question is FunctionalQuestionResponse => question !== null)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  return { items: clone(items), nextCursor: null }
}

/** HU37: `GET /analysis-runs/{analysisRunId}/context-questions`. */
export async function mockGetContextQuestionSet(analysisRunId: string): Promise<FunctionalQuestionSetResponse> {
  await latency()
  const state = findVisibleActionRequiredRun(analysisRunId)
  if (!state) notFound(`No existe el Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  const currentQuestion = currentActionRequiredQuestion(state)
  const functionalBehaviorValidated = currentQuestion === null && state.questions.every((question) => question.status === 'ANSWERED')
  return clone({ analysisRunId, currentQuestion, functionalBehaviorValidated })
}

/** HU51 (INTEROP-2.1 §6.11, definido/no implementado): regla `ACTIVE` en el mismo Project que ya cubre el símbolo de la pregunta — simplificación de demo de "scope compatible" (el contrato también contempla scope contenedor, no solo igualdad de targetRef). */
function findConflictingKnowledge(projectId: string, targetRef: string): FunctionalKnowledgeResponse | null {
  return Array.from(functionalKnowledge.values()).find((item) => item.projectId === projectId && item.status === 'ACTIVE' && item.targetRef === targetRef) ?? null
}

/** HU37: `POST /analysis-runs/{analysisRunId}/context-questions/{questionId}/answers`. `headChanged` simula que un HEAD nuevo llegó mientras se respondía: la pregunta queda `OBSOLETE`, no `ANSWERED`, y el Run no se reanuda (`continuationAttemptId: null`). */
export async function mockSubmitFunctionalAnswer(analysisRunId: string, questionId: string, input: SubmitFunctionalAnswerRequest): Promise<FunctionalAnswerAcceptedResponse> {
  await latency()
  const state = findVisibleActionRequiredRun(analysisRunId)
  if (!state) notFound(`No existe el Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  requireProjectRole(state.projectId, 'MAINTAINER')
  const question = state.questions.find((item) => item.id === questionId)
  if (!question) notFound(`No existe la pregunta demo "${questionId}".`, 'QUESTION_NOT_FOUND')
  if (question.status !== 'PENDING') throw new ApiError('La pregunta demo ya no está pendiente.', 409, 'demo-correlation-id', 'QUESTION_NOT_PENDING')

  if (state.headChanged) {
    question.status = 'OBSOLETE'
    return { status: 'PENDING', pollAfterMs: 400, analysisRunId, questionId, continuationAttemptId: null, knowledgeId: null }
  }

  const conflicting = questionId === state.conflictQuestionId ? findConflictingKnowledge(state.projectId, question.target.qualifiedName) : null
  if (conflicting && !input.conflictResolution) {
    sequence += 1
    const details: FunctionalKnowledgeConflictResponse = {
      conflictId: `conflict_demo_${sequence}`,
      analysisRunId,
      questionId,
      conflictingKnowledge: clone(conflicting),
      proposedNormalizedRule: `Regla propuesta a partir de la respuesta: "${input.answer?.trim() || question.question}".`,
    }
    throw new ApiError('La respuesta propuesta contradice una regla de conocimiento funcional vigente — resuelve el conflicto antes de continuar.', 409, 'demo-correlation-id', 'FUNCTIONAL_KNOWLEDGE_CONFLICT', details)
  }

  question.status = 'ANSWERED'
  sequence += 1

  if (conflicting && input.conflictResolution?.action === 'KEEP_EXISTING') {
    return { status: 'PENDING', pollAfterMs: 300, analysisRunId, questionId, continuationAttemptId: `attempt_demo_${sequence}`, knowledgeId: null }
  }

  let knowledgeId = input.choice === 'UNKNOWN' ? null : `fk_demo_${sequence}`
  if (conflicting && input.conflictResolution?.action === 'SUPERSEDE') {
    conflicting.status = 'SUPERSEDED'
    knowledgeId = `fk_demo_${sequence}`
    functionalKnowledge.set(knowledgeId, {
      id: knowledgeId, projectId: state.projectId, scope: conflicting.scope, targetRef: question.target.qualifiedName,
      originalQuestion: question.question, originalAnswer: input.answer?.trim() || input.choice,
      normalizedRule: `Regla propuesta a partir de la respuesta: "${input.answer?.trim() || question.question}".`,
      source: 'HUMAN_ANSWER', status: 'ACTIVE', supersedesId: conflicting.id, createdAt: nowIso(),
    })
  }

  /** Caso "respuesta revela inconsistencia": la regla que fija la respuesta contradice el comportamiento observado en Sandbox. */
  if (analysisRunId === 'arun_billing_pr24') {
    const run = findVisibleRun(analysisRunId)
    if (run) {
      run.status = 'BEHAVIORAL_MISMATCH'
      run.functionalBehaviorValidated = true
      run.resultSummary = 'La respuesta funcional estableció que "applyLateFee" no debe aplicarse a facturas con pago parcial previo, pero el comportamiento observado en Sandbox muestra que el recargo se aplica igual — contradice la regla recién fijada.'
      run.updatedAt = nowIso()
      run.completedAt = nowIso()
      testProposals.set(analysisRunId, [
        { id: 'prop_pr24_1', relativePath: 'src/domain/InvoiceService.lateFee.spec.ts', target: { language: 'TYPESCRIPT', kind: 'METHOD', qualifiedName: 'InvoiceService.applyLateFee', filePath: 'src/domain/InvoiceService.ts', changeKind: 'DIRECTLY_CHANGED' }, contentSha256: fakeSha256('prop_pr24_1'), status: 'HELD' },
      ])
    }
  }

  return { status: 'PENDING', pollAfterMs: 300, analysisRunId, questionId, continuationAttemptId: `attempt_demo_${sequence}`, knowledgeId }
}

function requireProject(projectId: string): Project {
  const project = projects.get(projectId)
  if (!project || !canSeeProject(project)) notFound(`No existe el proyecto demo "${projectId}".`, 'PROJECT_NOT_FOUND')
  return project
}

/** HU30: `GET /projects/{projectId}/integrations/github`. `null` cuando el proyecto nunca se vinculó (Core: 404 `REPOSITORY_BINDING_NOT_FOUND`); un binding desconectado se devuelve con status `DISABLED`. Un Project borrado responde 404 `PROJECT_NOT_FOUND` (vía `requireProject`). */
export async function mockGetRepositoryBinding(projectId: string): Promise<ProjectRepositoryBindingResponse | null> {
  await latency()
  requireProject(projectId)
  return clone(repositoryBindings.get(projectId) ?? null)
}

/** HU30 user-centric: ramas demo por repositorio (fixture, no derivadas de GitHub real). */
const DEMO_BRANCHES_BY_REPOSITORY: Record<string, GitHubRepositoryBranchResponse[]> = {
  repo_checkout: [{ name: 'main', protected: true }, { name: 'develop', protected: false }, { name: 'release/2.3', protected: true }],
  repo_billing: [{ name: 'main', protected: true }, { name: 'develop', protected: false }],
  repo_notifications: [{ name: 'main', protected: true }, { name: 'develop', protected: false }, { name: 'feature/webhooks-v2', protected: false }],
  repo_playground: [{ name: 'main', protected: false }],
  repo_legacy_docs: [{ name: 'main', protected: true }],
  repo_external_tools: [{ name: 'main', protected: true }],
  repo_rag_orders: [{ name: 'main', protected: true }, { name: 'develop', protected: false }],
  repo_observability_metrics: [{ name: 'main', protected: true }, { name: 'release/1.4', protected: true }],
  repo_team_sandbox: [{ name: 'main', protected: true }, { name: 'develop', protected: false }],
}

function isGitHubAppAuthorized(repositoryId: string): boolean {
  const attempts = githubAppAccessVerifications.get(repositoryId) ?? 0
  return repositoryId !== 'repo_playground' || attempts >= 2
}

/** HU64: `GET /integrations/github/repositories?workspaceId`. El fixture simula el filtro de workspace de Core. */
export async function mockListGitHubUserRepositories(workspaceId: string): Promise<GitHubUserRepositoryPage> {
  await latency()
  const workspace = DEMO_WORKSPACES.find((item) => item.id === workspaceId)
  if (!workspace) notFound('El workspace demo ya no está disponible. Actualiza la lista.', 'WORKSPACE_NOT_FOUND')
  return { items: clone(DEMO_GITHUB_REPOSITORIES.filter((repo) => repo.owner.login === workspace.login)), nextCursor: null }
}

function toGitHubAppAccessResponse(repo: GitHubUserRepositoryResponse): GitHubAppAccessResponse {
  const authorized = isGitHubAppAuthorized(repo.repositoryId)
  return {
    repositoryId: repo.repositoryId,
    repositoryName: repo.repositoryName,
    status: authorized ? 'AUTHORIZED' : 'NOT_AUTHORIZED',
    installationId: authorized ? `inst_demo_${repo.repositoryId}` : null,
    app: { displayName: 'RAG Test Studio (demo)', configureUrl: `https://github.com/apps/rag-test-studio-demo/installations/select_target?repository=${encodeURIComponent(repo.repositoryName)}` },
  }
}

function findDemoRepository(repositoryId: string): GitHubUserRepositoryResponse {
  const repo = DEMO_GITHUB_REPOSITORIES.find((item) => item.repositoryId === repositoryId)
  if (!repo) notFound(`No existe el repositorio demo "${repositoryId}".`, 'GITHUB_REPOSITORY_NOT_FOUND')
  return repo
}

/** HU30: `POST /integrations/github/repositories/verify-app-access`. `repo_playground` exige 2 llamadas para pasar a `AUTHORIZED` (demuestra el CTA de configuración + "Revalidar"); el resto de repos conocidos ya está `AUTHORIZED` desde la primera. */
export async function mockVerifyGitHubAppAccess(input: VerifyGitHubAppAccessRequest): Promise<GitHubAppAccessResponse> {
  await latency()
  const repo = findDemoRepository(input.repositoryId)
  githubAppAccessVerifications.set(input.repositoryId, (githubAppAccessVerifications.get(input.repositoryId) ?? 0) + 1)
  return toGitHubAppAccessResponse(repo)
}

/** Igual que `mockVerifyGitHubAppAccess` pero sin contar como una verificación: la UI lo usa para leer el estado y la URL de configuración de la App sin alterar el contador que determina `AUTHORIZED` (así Reactivar sigue siendo determinista). */
export async function mockPeekGitHubAppAccess(input: VerifyGitHubAppAccessRequest): Promise<GitHubAppAccessResponse> {
  await latency()
  return toGitHubAppAccessResponse(findDemoRepository(input.repositoryId))
}

/** HU30: `GET /integrations/github/repositories/{owner}/{repo}/branches`. Simula 403 si la App todavía no tiene acceso — "las ramas se consultan con el installation access token". */
export async function mockListGitHubRepositoryBranches(owner: string, repo: string): Promise<GitHubRepositoryBranchesResponse> {
  await latency()
  const repositoryName = `${owner}/${repo}`
  const found = DEMO_GITHUB_REPOSITORIES.find((item) => item.repositoryName === repositoryName)
  if (!found) notFound(`No existe el repositorio demo "${repositoryName}".`, 'GITHUB_REPOSITORY_NOT_FOUND')
  if (!isGitHubAppAuthorized(found.repositoryId)) throw new ApiError(`La GitHub App no tiene acceso a "${repositoryName}" todavía.`, 403, 'demo-correlation-id', 'GITHUB_APP_ACCESS_REQUIRED')
  return { items: clone(DEMO_BRANCHES_BY_REPOSITORY[found.repositoryId] ?? [{ name: found.defaultBranch, protected: true }]) }
}

/**
 * HU30/HU64: `POST /projects/{projectId}/integrations/github`. `installationId` no viaja desde el navegador: Core lo resuelve — acá se reconstruye a partir del estado de verificación ya guardado.
 * Orden de errores de INTEROP-2.4 §6.8: 404 proyecto, 409 binding propio (cualquier status), 403 acceso de la App, 404 `GITHUB_REPOSITORY_NOT_FOUND` (repositoryId inexistente o discordante con el nombre),
 * 400 `REPOSITORY_OUTSIDE_WORKSPACE`, 403 `REPOSITORY_PERMISSION_INSUFFICIENT` (solo pull), 409 repo ya vinculado a otro Project, 404 rama.
 * Los workspaces/roles también se verifican con fixtures locales, sin consultar GitHub.
 */
export async function mockCreateRepositoryBinding(projectId: string, input: CreateRepositoryBindingRequest): Promise<ProjectRepositoryBindingResponse> {
  await latency()
  const project = requireProjectRole(projectId, 'MAINTAINER')
  if (repositoryBindings.get(projectId)) throw new ApiError('Este proyecto ya tiene un repositorio vinculado.', 409, 'demo-correlation-id', 'REPOSITORY_BINDING_ALREADY_EXISTS')
  if (!isGitHubAppAuthorized(input.repositoryId)) throw new ApiError(`La GitHub App no tiene acceso a "${input.repositoryName}" todavía.`, 403, 'demo-correlation-id', 'GITHUB_APP_ACCESS_REQUIRED')
  // Un id falso, uno discordante con el nombre y un repositorio sin visibilidad responden lo mismo (un solo 404, sin distinguir motivos).
  const repository = DEMO_GITHUB_REPOSITORIES.find((item) => item.repositoryId === input.repositoryId && item.repositoryName === input.repositoryName)
  if (!repository) notFound('No encontramos ese repositorio o no tienes permiso sobre él.', 'GITHUB_REPOSITORY_NOT_FOUND')
  if (repository.owner.login !== project.workspace.login || DEMO_FOREIGN_OWNER_LOGINS.has(repository.owner.login)) throw new ApiError('El repositorio no pertenece al workspace de este Project.', 400, 'demo-correlation-id', 'REPOSITORY_OUTSIDE_WORKSPACE')
  if (!canBindRepository(repository)) throw new ApiError('Necesitas permiso maintain, write o admin sobre el repositorio.', 403, 'demo-correlation-id', 'REPOSITORY_PERMISSION_INSUFFICIENT')
  const boundElsewhere = Array.from(repositoryBindings.values()).some((other) => other && other.projectId !== projectId && other.repositoryId === input.repositoryId)
  if (boundElsewhere) throw new ApiError('Este repositorio ya está vinculado a otro proyecto.', 409, 'demo-correlation-id', 'REPOSITORY_ALREADY_BOUND')
  const branches = DEMO_BRANCHES_BY_REPOSITORY[input.repositoryId] ?? []
  if (!branches.some((branch) => branch.name === input.integrationBranch)) notFound(`La rama "${input.integrationBranch}" no existe en "${input.repositoryName}".`, 'INTEGRATION_BRANCH_NOT_FOUND')
  const createdAt = nowIso()
  const binding: ProjectRepositoryBindingResponse = {
    projectId,
    installationId: `inst_demo_${input.repositoryId}`,
    repositoryId: input.repositoryId,
    repositoryName: input.repositoryName,
    integrationBranch: input.integrationBranch,
    status: 'ENABLED',
    createdAt,
    updatedAt: createdAt,
  }
  repositoryBindings.set(projectId, binding)
  return clone(binding)
}

/** HU30/HU57: `DELETE /projects/{projectId}/integrations/github`. Como Core: pausa reversible — el binding queda `DISABLED` (fila y `repositoryId` se conservan), deja de aceptar eventos nuevos y no borra Runs ni Functional Knowledge. Sobre `REVOKED` no cambia nada; sin binding 404 `REPOSITORY_BINDING_NOT_FOUND` (INTEROP-2.3 §6.8). */
export async function mockDisconnectRepository(projectId: string): Promise<void> {
  await latency()
  requireProjectRole(projectId, 'MAINTAINER')
  const binding = repositoryBindings.get(projectId)
  if (!binding) notFound(`El proyecto demo "${projectId}" no tiene un repositorio vinculado.`, 'REPOSITORY_BINDING_NOT_FOUND')
  if (binding.status === 'REVOKED') return
  repositoryBindings.set(projectId, { ...binding, status: 'DISABLED', updatedAt: nowIso() })
}

/**
 * HU57 (INTEROP-2.3 §6.8, implementado en Core — CS-20260920-003): `POST /projects/{projectId}/integrations/github/enable`. Mock-only, NO modelado: el refresco de `installationId` que Core hace al revalidar. Idempotente si ya está `ENABLED`; `DISABLED` y `REVOKED` pasan a `ENABLED`, pero
 * `REVOKED` solo si la revalidación confirma que la App recuperó acceso (si no, 403 y el estado no cambia).
 */
export async function mockEnableRepository(projectId: string): Promise<ProjectRepositoryBindingResponse> {
  await latency()
  const project = requireProjectRole(projectId, 'MAINTAINER')
  const binding = repositoryBindings.get(projectId)
  if (!binding) notFound(`El proyecto demo "${projectId}" no tiene un repositorio vinculado.`, 'REPOSITORY_BINDING_NOT_FOUND')
  if (binding.status === 'ENABLED') return clone(binding)
  if (binding.status === 'REVOKED' && project.role !== 'ADMIN') notFound(`No existe el proyecto demo "${projectId}".`, 'PROJECT_NOT_FOUND')
  if (!isGitHubAppAuthorized(binding.repositoryId)) throw new ApiError(`La GitHub App no tiene acceso a "${binding.repositoryName}" todavía.`, 403, 'demo-correlation-id', 'GITHUB_APP_ACCESS_REQUIRED')
  const enabled: ProjectRepositoryBindingResponse = { ...binding, status: 'ENABLED', updatedAt: nowIso() }
  repositoryBindings.set(projectId, enabled)
  return clone(enabled)
}

/**
 * Helper SOLO para tests/demo, no contractual (ninguna ruta de INTEROP-2.3 lo expone): simula que la GitHub App perdió acceso al repositorio (webhook de instalación borrada/suspendida en Core) — no
 * hay ruta pública para esto. El binding pasa a `REVOKED` y se olvida la verificación previa de acceso: `repo_playground` vuelve a
 * `NOT_AUTHORIZED` hasta revalidar; el resto de repos demo siempre están `AUTHORIZED`, así que reactivarlos funciona.
 */
export function mockSimulateAppAccessLoss(projectId: string): void {
  const binding = repositoryBindings.get(projectId)
  if (!binding) return
  repositoryBindings.set(projectId, { ...binding, status: 'REVOKED', updatedAt: nowIso() })
  githubAppAccessVerifications.delete(binding.repositoryId)
}

/**
 * HU56 (INTEROP-2.3 §6.1, implementado en Core — CS-20260920-003): `DELETE /projects/{projectId}` — borrado lógico. El Project sale de las lecturas
 * (lista, detalle, Runs, Action Required), su binding se elimina y el `repositoryId` queda libre; los datos internos se
 * conservan. Repetir el DELETE responde 404 `PROJECT_NOT_FOUND` como en Core.
 */
export async function mockDeleteProject(projectId: string): Promise<void> {
  await latency()
  const project = requireProjectRole(projectId, 'ADMIN')
  projects.delete(projectId)
  deletedProjects.set(projectId, project)
  repositoryBindings.delete(projectId)
}

function toAnalysisRunSummary(run: AnalysisRunDetailResponse): AnalysisRunSummaryResponse {
  const { id, projectId, pullRequest, status, current, actionRequiredCount, generatedTestsCount, createdAt, updatedAt, completedAt } = run
  return { id, projectId, pullRequest, status, current, actionRequiredCount, generatedTestsCount, createdAt, updatedAt, completedAt }
}

/** HU32: `GET /projects/{projectId}/analysis-runs?status&cursor&limit` (aquí `projectId` es opcional para ofrecer también un listado global). */
export async function mockListAnalysisRuns(projectId: string | undefined, status: AnalysisRunStatus | undefined): Promise<AnalysisRunListPage> {
  await latency()
  if (projectId) requireProjectRole(projectId, 'READER')
  const items = Array.from(analysisRuns.values())
    .filter((run) => !isProjectDeleted(run.projectId) && projects.has(run.projectId) && canSeeProject(projects.get(run.projectId)!))
    .filter((run) => !projectId || run.projectId === projectId)
    .filter((run) => !status || run.status === status)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(toAnalysisRunSummary)
  return { items: clone(items), nextCursor: null }
}

/** HU53 (INTEROP-2.1 §6.10, definido/no implementado): deriva una secuencia plausible a partir de status/timestamps ya seedeados en vez de autorar `history` a mano por cada uno de los ~20 fixtures de AnalysisRun. */
function deriveRunHistory(run: AnalysisRunDetailResponse): AnalysisRunTransitionResponse[] {
  const history: AnalysisRunTransitionResponse[] = [
    { fromStatus: null, toStatus: 'QUEUED', reason: 'RUN_CREATED', occurredAt: run.createdAt },
    { fromStatus: 'QUEUED', toStatus: 'PROCESSING', reason: 'SNAPSHOT_PROCESSING_STARTED', occurredAt: run.createdAt },
  ]
  if (run.status === 'ACTION_REQUIRED') {
    history.push({ fromStatus: 'PROCESSING', toStatus: 'ACTION_REQUIRED', reason: 'FUNCTIONAL_CONTEXT_REQUIRED', occurredAt: run.updatedAt })
    return history
  }
  if (run.status === 'OBSOLETE') {
    history.push({ fromStatus: 'PROCESSING', toStatus: 'OBSOLETE', reason: 'GITHUB_HEAD_SUPERSEDED', occurredAt: run.updatedAt })
    return history
  }
  if (run.attemptCount > 1) {
    history.push({ fromStatus: 'PROCESSING', toStatus: 'ACTION_REQUIRED', reason: 'FUNCTIONAL_CONTEXT_REQUIRED', occurredAt: run.createdAt })
    history.push({ fromStatus: 'ACTION_REQUIRED', toStatus: 'PROCESSING', reason: 'FUNCTIONAL_ANSWER_CONTINUATION', occurredAt: run.updatedAt })
  }
  history.push({ fromStatus: 'PROCESSING', toStatus: run.status, reason: 'GENERATION_COMPLETED', occurredAt: run.completedAt ?? run.updatedAt })
  return history
}

/** HU32: `GET /analysis-runs/{analysisRunId}`. */
export async function mockGetAnalysisRun(analysisRunId: string): Promise<AnalysisRunDetailResponse> {
  await latency()
  const run = findVisibleRun(analysisRunId)
  if (!run) notFound(`No existe el Analysis Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  return { ...clone(run), history: deriveRunHistory(run) }
}

const PRIOR_COVERAGE_FIXTURES: Record<string, PriorCoverageLevel> = {
  'CouponPolicy.apply': 'NONE',
  'OrderService.calculateTotal': 'PARTIAL',
  'formatCurrency': 'SUFFICIENT',
}

function fallbackPriorCoverage(qualifiedName: string): PriorCoverageLevel {
  const levels: PriorCoverageLevel[] = ['NONE', 'PARTIAL', 'SUFFICIENT']
  let hash = 0
  for (let i = 0; i < qualifiedName.length; i += 1) hash = (hash * 31 + qualifiedName.charCodeAt(i)) >>> 0
  return levels[hash % levels.length]
}

/** PROPUESTA — HU50. `AnalysisRunDetailResponse` no expone esto hoy; se deriva localmente por símbolo. */
export async function mockGetPriorCoverage(analysisRunId: string): Promise<Record<string, PriorCoverageLevel>> {
  await latency()
  const run = findVisibleRun(analysisRunId)
  if (!run) notFound(`No existe el Analysis Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  const result: Record<string, PriorCoverageLevel> = {}
  for (const symbol of run.symbols) result[symbol.qualifiedName] = PRIOR_COVERAGE_FIXTURES[symbol.qualifiedName] ?? fallbackPriorCoverage(symbol.qualifiedName)
  return result
}

/** HU40: `GET /analysis-runs/{analysisRunId}/test-proposals`. */
export async function mockListTestProposals(analysisRunId: string): Promise<GeneratedTestProposalSetResponse> {
  await latency()
  const run = findVisibleRun(analysisRunId)
  if (!run) notFound(`No existe el Analysis Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  const items = testProposals.get(analysisRunId) ?? []
  return clone({ analysisRunId, headSha: run.pullRequest.headSha, items })
}

/** HU40: `POST /analysis-runs/{analysisRunId}/test-publications`. Simplificación de demo: publica de inmediato (`PUBLISHED`) en vez de simular un job asíncrono adicional — el companion PR mock ya está listo en la primera consulta de `mockGetTestPublication`. */
export async function mockCreateTestPublication(analysisRunId: string, input: CreateTestPublicationRequest): Promise<TestPublicationAcceptedResponse> {
  await latency()
  const run = findVisibleRun(analysisRunId)
  if (!run) notFound(`No existe el Analysis Run demo "${analysisRunId}".`, 'ANALYSIS_RUN_NOT_FOUND')
  requireProjectRole(run.projectId, 'MAINTAINER')
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
  hideRunOfDeletedProject(publication.analysisRunId)
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

/**
 * PROPUESTA — HU52, ver action-required/speculative/ruleUsage.ts. Coincidencia
 * local por símbolo == `targetRef` dentro del mismo proyecto, sin distinguir
 * qué versión de la regla estaba `ACTIVE` en el momento de cada Run.
 */
export async function mockGetRuleUsage(knowledgeId: string): Promise<AnalysisRunSummaryResponse[]> {
  await latency()
  const knowledge = functionalKnowledge.get(knowledgeId)
  if (!knowledge) notFound(`No existe la regla de Functional Knowledge demo "${knowledgeId}".`, 'FUNCTIONAL_KNOWLEDGE_NOT_FOUND')
  requireProject(knowledge.projectId)
  if (!knowledge.targetRef) return []
  const items = Array.from(analysisRuns.values())
    .filter((run) => run.projectId === knowledge.projectId)
    .filter((run) => run.symbols.some((symbol) => symbol.qualifiedName === knowledge.targetRef))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map(toAnalysisRunSummary)
  return clone(items)
}
