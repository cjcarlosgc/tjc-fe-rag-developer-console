import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { RagGraph } from '../context-explorer/rag/RagGraph'
import { RagSidePanel } from '../context-explorer/rag/RagSidePanel'
import { useAnalysisRunContextTrace } from '../context-explorer/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { getTestPublication } from './api'
import { useAnalysisRun, usePublishTests, useTestProposals } from './queries'
import { ANALYSIS_RUN_STATUS_LABELS, analysisRunStatusClass } from './status'
import { getPriorCoverage, PRIOR_COVERAGE_LABELS } from './speculative/priorCoverage'
import { findEligibleSymbol } from '../run-comparison/types'
import type { AnalysisRunTransitionReason } from './types'

const FAILURE_STATUSES = new Set(['BASELINE_FAILED', 'TECHNICAL_GENERATION_FAILURE', 'INFRASTRUCTURE_FAILURE'])

/** HU53 (INTEROP-2.1 §6.10, definido/no implementado). */
const RUN_TRANSITION_REASON_LABELS: Record<AnalysisRunTransitionReason, string> = {
  RUN_CREATED: 'Run creado',
  SNAPSHOT_PROCESSING_STARTED: 'Snapshot indexado, análisis iniciado',
  FUNCTIONAL_CONTEXT_REQUIRED: 'Contexto funcional requerido',
  FUNCTIONAL_ANSWER_CONTINUATION: 'Respuesta funcional recibida, continúa el análisis',
  GENERATION_COMPLETED: 'Generación completada',
  GITHUB_HEAD_SUPERSEDED: 'HEAD nuevo reemplazó este Run',
  PULL_REQUEST_CLOSED: 'Pull Request cerrado',
  MANUAL_OBSOLETE: 'Marcado obsoleto manualmente',
}
const INFORMATIONAL_STATUSES = new Set(['NO_ADDITIONAL_TESTS_REQUIRED', 'NO_TEST_RELEVANT_CHANGES'])

function PublishSection({ analysisRunId, targetBranch }: { analysisRunId: string; targetBranch: string }) {
  const proposalsQuery = useTestProposals(analysisRunId)
  const publishMutation = usePublishTests(analysisRunId)
  const [publicationId, setPublicationId] = useState<string | null>(null)
  const publicationQuery = useQuery({
    queryKey: ['control-plane', 'publication', publicationId],
    queryFn: () => getTestPublication(publicationId as string),
    enabled: Boolean(publicationId),
  })

  if (proposalsQuery.isPending) return <LoadingState label="Cargando propuestas…" />
  if (proposalsQuery.isError) return <ErrorState message={proposalsQuery.error.message} onRetry={() => void proposalsQuery.refetch()} />

  const available = proposalsQuery.data.items.filter((item) => item.status === 'AVAILABLE')
  const published = proposalsQuery.data.items.filter((item) => item.status === 'PUBLISHED')

  return <div className="panel">
    <div className="section-heading"><div><h2>Propuestas de prueba</h2><p>{available.length > 0 ? `Freshness verificado contra el HEAD vigente (${proposalsQuery.data.headSha}). Publicar nunca hace merge ni escribe directo en la rama del PR.` : 'Sin propuestas disponibles para publicar en este Run.'}</p></div></div>
    <ul className="test-proposal-list">
      {proposalsQuery.data.items.map((item) => (
        <li key={item.id} className="test-proposal-item">
          <code>{item.relativePath}</code>
          <span className={`status-badge ${item.status === 'PUBLISHED' ? 'status-success' : item.status === 'STALE' ? 'status-muted' : ''}`}>{item.status}</span>
        </li>
      ))}
    </ul>
    {published.length > 0 && publicationQuery.data && (
      <div className="panel success-note contract-note">
        <div>
          <strong>Companion PR publicado</strong>
          <p className="branch-flow-line">Rama <code>{publicationQuery.data.branchName}</code><span aria-hidden="true">→</span><code>{targetBranch}</code></p>
          <p className="empty-inline-note">Se mergea a la rama que ya vas a mergear a <code>develop</code> — de ahí en adelante lo maneja GitHub.</p>
        </div>
      </div>
    )}
    {available.length > 0 && (
      <div className="run-actions">
        <button
          type="button"
          className="button primary"
          disabled={publishMutation.isPending}
          onClick={() => publishMutation.mutate({ proposalIds: available.map((item) => item.id) }, { onSuccess: (accepted) => setPublicationId(accepted.publicationId) })}
        >
          {publishMutation.isPending ? 'Publicando…' : `Publicar ${available.length} propuesta(s)`}
        </button>
      </div>
    )}
    {publishMutation.isError && <p className="inline-error" role="alert">{publishMutation.error.message}</p>}
  </div>
}

/** Reusa el árbol de nodos de contexto de Context Explorer (HU27, pre-SDD-2.0); sin forma de contrato aún, ver §6.7. */
function ContextSection({ analysisRunId }: { analysisRunId: string }) {
  const traceQuery = useAnalysisRunContextTrace(analysisRunId)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (traceQuery.isPending) return <div className="panel"><LoadingState label="Cargando contexto recolectado…" /></div>
  if (!traceQuery.data) return null

  const trace = traceQuery.data
  return <div className="panel">
    <div className="section-heading"><div><h2>Contexto recolectado</h2><p>Nodos de contexto (RAG) usados para generar estas pruebas.</p></div></div>
    <div className="context-explorer-body">
      <RagGraph detail={trace} selectedId={selectedId ?? trace.targetId} onSelect={setSelectedId} />
      <RagSidePanel detail={trace} selectedId={selectedId ?? trace.targetId} />
    </div>
  </div>
}

export function AnalysisRunDetailPage() {
  const { analysisRunId = '' } = useParams()
  const mock = isMockDataSource()
  const runQuery = useAnalysisRun(analysisRunId)
  const priorCoverageQuery = useQuery({
    queryKey: ['control-plane', 'speculative', 'prior-coverage', analysisRunId],
    queryFn: () => getPriorCoverage(analysisRunId),
    enabled: Boolean(analysisRunId),
  })

  if (runQuery.isPending) return <LoadingState label="Cargando Analysis Run…" />
  if (runQuery.isError) return <ErrorState message={runQuery.error.message} onRetry={() => void runQuery.refetch()} />

  const run = runQuery.data
  const directCount = run.symbols.filter((symbol) => symbol.changeKind === 'DIRECTLY_CHANGED').length
  const impactedCount = run.symbols.length - directCount
  const isLargeChangeset = run.symbols.length > 8
  const canCompare = run.status !== 'ACTION_REQUIRED' && Boolean(findEligibleSymbol(run.symbols))
  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: 'Runs', to: '/analysis-runs' }, { label: `PR #${run.pullRequest.number}` }]} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Analysis Run</p>
        <div className="run-heading-meta"><RepoChip repositoryName={run.pullRequest.repositoryName} /><span className="pr-number">PR #{run.pullRequest.number}</span></div>
        <h1>{run.pullRequest.title}</h1>
        <p className="branch-flow-line"><code>{run.pullRequest.headRef}</code><span aria-hidden="true">→</span><code>{run.pullRequest.baseRef}</code></p>
      </div>
      <div className="run-heading-actions">
        {canCompare && <Link className="button secondary button-link" to={`/projects/${run.projectId}/runs/${run.id}/comparison`}>Run comparison →</Link>}
        {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
      </div>
    </div>

    {run.indexMode === 'BOOTSTRAP' && (
      <div className="panel success-note contract-note">
        <div>
          <strong>Primer análisis de este repositorio</strong>
          <p>No había un ProjectVersion previo para este proyecto — se indexó el repositorio completo (bootstrap) en vez de aplicar un índice incremental.</p>
        </div>
      </div>
    )}

    <div className="panel analysis-run-summary">
      <span className={`status-badge ${analysisRunStatusClass(run.status)}`}>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</span>
      <dl className="metadata">
        <div><dt>HEAD</dt><dd><code>{run.pullRequest.headSha}</code></dd></div>
        <div><dt>Vigente</dt><dd>{run.current ? 'Sí' : 'No — un HEAD nuevo lo reemplazó'}</dd></div>
        <div><dt>Intentos</dt><dd>{run.attemptCount}</dd></div>
      </dl>
      {run.symbols.length > 0 && <>
        <h3>Símbolos cambiados</h3>
        {isLargeChangeset && <p className="empty-inline-note">Changeset grande: {directCount} símbolo(s) con cambio directo, {impactedCount} potencialmente impactado(s).</p>}
        <ul className="symbol-list">
          {run.symbols.map((symbol) => {
            const coverage = priorCoverageQuery.data?.[symbol.qualifiedName]
            return <li key={symbol.qualifiedName}>
              <code>{symbol.qualifiedName}</code>
              <span className="target-ref">{symbol.changeKind === 'DIRECTLY_CHANGED' ? 'cambio directo' : 'potencialmente impactado'}</span>
              {coverage && <span className="proposal-stamp prior-coverage-stamp" title="HU50 — propuesta sin contrato aprobado, cobertura fabricada localmente">{PRIOR_COVERAGE_LABELS[coverage]}</span>}
            </li>
          })}
        </ul>
      </>}
    </div>

    {run.history && run.history.length > 0 && (
      <details className="panel run-history">
        <summary>Historial de transiciones ({run.history.length})</summary>
        <ol className="run-history-timeline">
          {run.history.map((transition, index) => (
            <li key={index}>
              <span className="run-history-status">{transition.fromStatus ? ANALYSIS_RUN_STATUS_LABELS[transition.fromStatus] : 'Creación'} → {ANALYSIS_RUN_STATUS_LABELS[transition.toStatus]}</span>
              <span className="run-history-reason">{RUN_TRANSITION_REASON_LABELS[transition.reason]}</span>
              <time dateTime={transition.occurredAt}>{new Date(transition.occurredAt).toLocaleString()}</time>
            </li>
          ))}
        </ol>
      </details>
    )}

    {run.status === 'ACTION_REQUIRED' && (
      <div className="panel success-note contract-note">
        <div>
          <strong>Este Run necesita contexto funcional</strong>
          <p>Hay {run.actionRequiredCount} pregunta(s) pendiente(s) antes de continuar el análisis.</p>
        </div>
        <Link className="button primary button-link" to={`/action-required/${run.id}?returnTo=${encodeURIComponent(`/projects/${run.projectId}/runs/${run.id}`)}`}>Abrir Focus Mode →</Link>
      </div>
    )}

    {run.status === 'OBSOLETE' && (
      <div className="panel contract-note">
        <div><strong>Run obsoleto</strong><p>{run.resultSummary}</p></div>
      </div>
    )}

    {FAILURE_STATUSES.has(run.status) && (
      <div className="structured-error" role="alert"><strong>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</strong><p>{run.resultSummary}</p></div>
    )}

    {INFORMATIONAL_STATUSES.has(run.status) && (
      <div className="panel success-note contract-note"><div><strong>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</strong><p>{run.resultSummary}</p></div></div>
    )}

    {run.status === 'BEHAVIORAL_MISMATCH' && (
      <div className="panel contract-note">
        <div><strong>Behavioral mismatch</strong><p>{run.resultSummary} Las propuestas quedan retenidas (<code>HELD</code>) y no se ofrecen para publicar.</p></div>
      </div>
    )}
    {run.status === 'BEHAVIORAL_MISMATCH' && <PublishSection analysisRunId={run.id} targetBranch={run.pullRequest.headRef} />}

    {run.status === 'SUCCESS' && <PublishSection analysisRunId={run.id} targetBranch={run.pullRequest.headRef} />}

    <ContextSection analysisRunId={run.id} />
  </section>
}
