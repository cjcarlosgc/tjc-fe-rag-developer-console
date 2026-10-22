import { useEffect, useRef, useState } from 'react'
import { hasRole } from '../projects/roles'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { RagGraph } from '../context-explorer/rag/RagGraph'
import { RagSidePanel } from '../context-explorer/rag/RagSidePanel'
import { useAnalysisRunContextTrace } from '../context-explorer/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { OperationalTraceSection } from './OperationalTraceSection'
import {
  isInProgressPublicationStatus,
  isTerminalPublicationStatus,
  useAnalysisRun,
  usePublication,
  usePublishTests,
  useRefreshOnPublicationTerminal,
  useTestProposals,
} from './queries'
import { useAnalysisRunRealtime } from './useAnalysisRunRealtime'
import { safePublicationUrl } from './publicationView'
import { ANALYSIS_RUN_STATUS_LABELS, analysisRunStatusClass } from './status'
import { getPriorCoverage, PRIOR_COVERAGE_LABELS } from './speculative/priorCoverage'
import { findEligibleSymbol } from '../run-comparison/types'
import type { AnalysisRunTransitionReason } from './types'
import { useProject } from '../projects/queries'
import { bindingErrorMessage, errorCorrelationId } from './errors'
import { EvidenceDownload } from '../evidence/EvidenceDownload'
import { StatusBadge } from '../ui/StatusBadge'

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

type PendingPublication = { publicationId: string; pollAfterMs: number }

function PublishSection({ analysisRunId, projectId, targetBranch }: { analysisRunId: string; projectId: string; targetBranch: string }) {
  const projectQuery = useProject(projectId)
  const proposalsQuery = useTestProposals(analysisRunId)
  const publishMutation = usePublishTests(analysisRunId)
  const [pending, setPending] = useState<PendingPublication | null>(null)
  // Sondeo hasta terminal con el pollAfterMs del 202 (WI-CONSOLE-032).
  const publicationQuery = usePublication(pending?.publicationId ?? null, pending?.pollAfterMs ?? null)
  const publication = publicationQuery.data
  useRefreshOnPublicationTerminal(analysisRunId, publication)
  const mock = isMockDataSource()
  const publishButtonRef = useRef<HTMLButtonElement>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const publicationTerminal = publication !== undefined && isTerminalPublicationStatus(publication.status)
  // WI-CONSOLE-032 (corrección UX 1): al llegar a terminal, si el foco estaba en el botón (que puede desaparecer) o en body, pasa a la región de resultado.
  useEffect(() => {
    if (!publicationTerminal) return
    const active = document.activeElement
    if (active === null || active === document.body || active === publishButtonRef.current) resultRef.current?.focus()
  }, [publicationTerminal, publication?.status])

  if (projectQuery.isPending || proposalsQuery.isPending) return <LoadingState label="Cargando propuestas…" />
  if (projectQuery.isError)
    return (
      <ErrorState
        message={bindingErrorMessage(projectQuery.error)}
        correlationId={errorCorrelationId(projectQuery.error)}
        onRetry={() => void projectQuery.refetch()}
      />
    )
  if (proposalsQuery.isError) return <ErrorState message={proposalsQuery.error.message} onRetry={() => void proposalsQuery.refetch()} />

  const canPublish = hasRole(projectQuery.data.role, 'WRITER')
  const available = proposalsQuery.data.items.filter((item) => item.status === 'AVAILABLE')
  const published = proposalsQuery.data.items.filter((item) => item.status === 'PUBLISHED')
  const publicationInProgress =
    pending !== null && !publicationQuery.isError && (publication === undefined || isInProgressPublicationStatus(publication.status))
  const busy = publishMutation.isPending || publicationInProgress
  // Sin reintento automático ni botón que reenvíe lo mismo tras un fallo terminal (FAILED/STALE/CLOSED).
  const endedWithoutPublish =
    publication !== undefined && isTerminalPublicationStatus(publication.status) && publication.status !== 'PUBLISHED'
  // Publicación PUBLISHED en memoria: no se ofrece publicar, también en la ventana anterior al refetch de propuestas (aún AVAILABLE).
  const publishedNow = publication?.status === 'PUBLISHED'
  const showPublishButton = canPublish && !endedWithoutPublish && !publishedNow && (busy || available.length > 0)
  const statusText = publicationInProgress
    ? `Publicación en curso: ${publication?.status ?? 'PENDING'}…`
    : publication && isTerminalPublicationStatus(publication.status)
      ? `Publicación finalizada: ${publication.status}`
      : ''
  const publicationUrl = safePublicationUrl(publication?.companionPullRequestUrl)

  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <h2>Propuestas de prueba</h2>
          <p>
            {available.length > 0 && !publishedNow
              ? `Freshness verificado contra el HEAD vigente (${proposalsQuery.data.headSha}). Publicar nunca hace merge ni escribe directo en la rama del PR.`
              : 'Sin propuestas disponibles para publicar en este Run.'}
          </p>
        </div>
      </div>
      <ul className="test-proposal-list">
        {proposalsQuery.data.items.map((item) => (
          <li key={item.id} className="test-proposal-item">
            <code>{item.relativePath}</code>
            <StatusBadge statusClass={item.status === 'PUBLISHED' ? 'status-success' : item.status === 'STALE' ? 'status-muted' : ''}>
              {item.status}
            </StatusBadge>
          </li>
        ))}
      </ul>
      <div className="publication-status" role="status" aria-live="polite">
        {statusText}
      </div>
      <div className="publication-result" ref={resultRef} tabIndex={-1}>
        {mock && publication && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
        {publication?.status === 'PUBLISHED' && (
          <div className="panel success-note contract-note publication-panel">
            <div>
              <strong>Companion PR publicado</strong>
              <p className="branch-flow-line">
                Rama <code>{publication.branchName ?? '—'}</code>
                <span aria-hidden="true">→</span>
                <code>{targetBranch}</code>
              </p>
              {publication.companionPullRequestNumber !== null && (
                <p>
                  PR companion #{publication.companionPullRequestNumber}
                  {publicationUrl && (
                    <>
                      {' '}
                      ·{' '}
                      <a className="publication-url" href={publicationUrl} target="_blank" rel="noopener noreferrer">
                        Abrir en GitHub<span className="visually-hidden"> (se abre en una pestaña nueva)</span>
                      </a>
                    </>
                  )}
                </p>
              )}
              <p className="empty-inline-note">
                Se mergea a la rama que ya vas a mergear a <code>develop</code> — de ahí en adelante lo maneja GitHub.
              </p>
            </div>
          </div>
        )}
        {published.length > 0 && pending === null && (publication === undefined || publication.status !== 'PUBLISHED') && (
          <div className="panel success-note contract-note publication-panel">
            <p className="empty-inline-note">Las propuestas ya fueron publicadas en un companion PR.</p>
          </div>
        )}
        {publication?.status === 'FAILED' && (
          <div className="structured-error publication-alert" role="alert">
            <strong>Publicación fallida</strong>
            <p>{publication.failureMessage ?? 'Core no indicó el motivo del fallo.'}</p>
            <p className="publication-next-step">
              Revisa el motivo; Core no reintenta automáticamente. Cuando el problema se corrija, vuelve a abrir el Run o espera el
              siguiente HEAD del PR.
            </p>
          </div>
        )}
        {publication?.status === 'STALE' && (
          <div className="structured-error publication-alert" role="alert">
            <strong>Publicación obsoleta (STALE)</strong>
            <p>
              El HEAD del PR cambió y el Run vigente es otro, así que estas propuestas no se publican desde este Run. Console no reintenta
              automáticamente.
            </p>
            {publication.failureMessage && <p>{publication.failureMessage}</p>}
            <p className="publication-next-step">
              El HEAD del PR cambió: abre el Run vigente del Pull Request para publicar sus propuestas.
            </p>
          </div>
        )}
        {publication?.status === 'CLOSED' && (
          <div className="structured-error publication-alert" role="alert">
            <strong>Companion PR cerrado</strong>
            {publication.failureMessage && <p>{publication.failureMessage}</p>}
            <p className="publication-next-step">El companion PR se cerró y no se reabre.</p>
          </div>
        )}
      </div>
      {publicationQuery.isError && (
        <p className="inline-error" role="alert">
          No se pudo consultar el estado de la publicación. Recarga la página para verlo.
        </p>
      )}
      {showPublishButton && (
        <div className="run-actions">
          <button
            ref={publishButtonRef}
            type="button"
            className="button primary"
            aria-disabled={busy ? 'true' : undefined}
            onClick={() => {
              if (busy || available.length === 0) return
              publishMutation.mutate(
                { proposalIds: available.map((item) => item.id) },
                { onSuccess: (accepted) => setPending({ publicationId: accepted.publicationId, pollAfterMs: accepted.pollAfterMs }) },
              )
            }}
          >
            {busy ? 'Publicando…' : `Publicar ${available.length} propuesta(s)`}
          </button>
        </div>
      )}
      {available.length > 0 && !canPublish && !publishedNow && (
        <p className="empty-inline-note">Tu rol es de solo lectura. Un Writer, Maintainer o Admin puede publicar estas propuestas.</p>
      )}
      {publishMutation.isError && (
        <p className="inline-error" role="alert">
          {bindingErrorMessage(publishMutation.error)}
          {errorCorrelationId(publishMutation.error) && (
            <>
              {' '}
              · Correlation ID: <code>{errorCorrelationId(publishMutation.error)}</code>
            </>
          )}
        </p>
      )}
    </div>
  )
}

/** Reusa el árbol de nodos de contexto de Context Explorer (HU27, pre-SDD-2.0); sin forma de contrato aún, ver §6.7. */
function ContextSection({ analysisRunId }: { analysisRunId: string }) {
  const traceQuery = useAnalysisRunContextTrace(analysisRunId)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  if (traceQuery.isPending)
    return (
      <div className="panel">
        <LoadingState label="Cargando contexto recolectado…" />
      </div>
    )
  if (!traceQuery.data) return null

  const trace = traceQuery.data
  return (
    <div className="panel">
      <div className="section-heading">
        <div>
          <h2>Contexto recolectado</h2>
          <p>Nodos de contexto (RAG) usados para generar estas pruebas.</p>
        </div>
      </div>
      <div className="context-explorer-body">
        <RagGraph detail={trace} selectedId={selectedId ?? trace.targetId} onSelect={setSelectedId} />
        <RagSidePanel detail={trace} selectedId={selectedId ?? trace.targetId} />
      </div>
    </div>
  )
}

export function AnalysisRunDetailPage() {
  const { projectId = '', analysisRunId = '' } = useParams()
  const mock = isMockDataSource()
  const runQuery = useAnalysisRun(analysisRunId)
  useAnalysisRunRealtime(analysisRunId)
  const retrievalProjectQuery = useProject(projectId)
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
  const canCompareOe5 = canCompare && run.status !== 'OBSOLETE'
  // WI-CONSOLE-014: OE2 no usa el gate de ACTION_REQUIRED. Se muestra solo con rol Writer confirmado (nunca mientras carga).
  const canCompareRetrieval =
    !retrievalProjectQuery.isPending && hasRole(retrievalProjectQuery.data?.role, 'WRITER') && Boolean(findEligibleSymbol(run.symbols))
  return (
    <section>
      <Breadcrumbs
        items={[{ label: 'Projects', to: '/' }, { label: 'Runs', to: '/analysis-runs' }, { label: `PR #${run.pullRequest.number}` }]}
      />
      <div className="page-heading">
        <div>
          <p className="eyebrow">Analysis Run</p>
          <div className="run-heading-meta">
            <RepoChip repositoryName={run.pullRequest.repositoryName} />
            <span className="pr-number">PR #{run.pullRequest.number}</span>
          </div>
          <h1>{run.pullRequest.title}</h1>
          <p className="branch-flow-line">
            <code>{run.pullRequest.headRef}</code>
            <span aria-hidden="true">→</span>
            <code>{run.pullRequest.baseRef}</code>
          </p>
        </div>
        <div className="run-heading-actions">
          {canCompare && (
            <Link className="button secondary button-link" to={`/projects/${run.projectId}/runs/${run.id}/comparison`}>
              Run comparison →
            </Link>
          )}
          {canCompareOe5 && (
            <Link
              className="button secondary button-link"
              to={`/projects/${run.projectId}/experimental?analysisRunId=${encodeURIComponent(run.id)}`}
            >
              Comparar RAG vs GA
            </Link>
          )}
          {canCompareRetrieval && (
            <Link className="button secondary button-link" to={`/projects/${run.projectId}/runs/${run.id}/retrieval-comparison`}>
              Comparar retrieval SE vs SEM
            </Link>
          )}
          {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
        </div>
      </div>

      {run.indexMode === 'BOOTSTRAP' && (
        <div className="panel success-note contract-note">
          <div>
            <strong>Primer análisis de este repositorio</strong>
            <p>
              No había un ProjectVersion previo para este proyecto — se indexó el repositorio completo (bootstrap) en vez de aplicar un
              índice incremental.
            </p>
          </div>
        </div>
      )}

      <div className="panel analysis-run-summary">
        <StatusBadge statusClass={analysisRunStatusClass(run.status)}>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</StatusBadge>
        <dl className="metadata">
          <div>
            <dt>HEAD</dt>
            <dd>
              <code>{run.pullRequest.headSha}</code>
            </dd>
          </div>
          <div>
            <dt>Vigente</dt>
            <dd>{run.current ? 'Sí' : 'No — un HEAD nuevo lo reemplazó'}</dd>
          </div>
          <div>
            <dt>Intentos</dt>
            <dd>{run.attemptCount}</dd>
          </div>
        </dl>
        {run.symbols.length > 0 && (
          <>
            <h2>Símbolos cambiados</h2>
            {isLargeChangeset && (
              <p className="empty-inline-note">
                Changeset grande: {directCount} símbolo(s) con cambio directo, {impactedCount} potencialmente impactado(s).
              </p>
            )}
            <ul className="symbol-list">
              {run.symbols.map((symbol) => {
                const coverage = priorCoverageQuery.data?.[symbol.qualifiedName]
                return (
                  <li key={symbol.qualifiedName}>
                    <code>{symbol.qualifiedName}</code>
                    <span className="target-ref">
                      {symbol.changeKind === 'DIRECTLY_CHANGED' ? 'cambio directo' : 'potencialmente impactado'}
                    </span>
                    {coverage && (
                      <span
                        className="proposal-stamp prior-coverage-stamp"
                        title="HU50 — propuesta sin contrato aprobado, cobertura fabricada localmente"
                      >
                        {PRIOR_COVERAGE_LABELS[coverage]}
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {run.history && run.history.length > 0 && (
        <details className="panel run-history">
          <summary>Historial de transiciones ({run.history.length})</summary>
          <ol className="run-history-timeline">
            {run.history.map((transition, index) => (
              <li key={index}>
                <span className="run-history-status">
                  {transition.fromStatus ? ANALYSIS_RUN_STATUS_LABELS[transition.fromStatus] : 'Creación'} →{' '}
                  {ANALYSIS_RUN_STATUS_LABELS[transition.toStatus]}
                </span>
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
          <Link
            className="button primary button-link"
            to={`/action-required/${run.id}?returnTo=${encodeURIComponent(`/projects/${run.projectId}/runs/${run.id}`)}`}
          >
            Abrir Focus Mode →
          </Link>
        </div>
      )}

      {run.status === 'OBSOLETE' && (
        <div className="panel contract-note">
          <div>
            <strong>Run obsoleto</strong>
            <p>{run.resultSummary}</p>
          </div>
        </div>
      )}

      {FAILURE_STATUSES.has(run.status) && (
        <div className="structured-error" role="alert">
          <strong>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</strong>
          <p>{run.resultSummary}</p>
        </div>
      )}

      {INFORMATIONAL_STATUSES.has(run.status) && (
        <div className="panel success-note contract-note">
          <div>
            <strong>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</strong>
            <p>{run.resultSummary}</p>
          </div>
        </div>
      )}

      {run.status === 'BEHAVIORAL_MISMATCH' && (
        <div className="panel contract-note">
          <div>
            <strong>Discrepancia de comportamiento</strong>
            <p>
              {run.resultSummary} Las propuestas quedan retenidas (<code>HELD</code>) y no se ofrecen para publicar.
            </p>
          </div>
        </div>
      )}
      {run.status === 'BEHAVIORAL_MISMATCH' && (
        <PublishSection analysisRunId={run.id} projectId={run.projectId} targetBranch={run.pullRequest.headRef} />
      )}

      {run.status === 'SUCCESS' && (
        <PublishSection analysisRunId={run.id} projectId={run.projectId} targetBranch={run.pullRequest.headRef} />
      )}

      {run.status !== 'QUEUED' && run.status !== 'PROCESSING' && (
        <div className="panel evidence-panel">
          <div className="section-heading">
            <div>
              <h2>Evidencia versionada</h2>
              <p>Descarga el paquete técnico de este Run tal como lo devuelve Core.</p>
            </div>
          </div>
          <EvidenceDownload kind="ANALYSIS_RUN" subjectId={run.id} terminal />
        </div>
      )}

      <OperationalTraceSection analysisRunId={run.id} projectId={run.projectId} />

      <ContextSection analysisRunId={run.id} />
    </section>
  )
}
