import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { getTestPublication } from './api'
import { useAnalysisRun, usePublishTests, useTestProposals } from './queries'
import { ANALYSIS_RUN_STATUS_LABELS, analysisRunStatusClass } from './status'

const FAILURE_STATUSES = new Set(['BASELINE_FAILED', 'TECHNICAL_GENERATION_FAILURE', 'INFRASTRUCTURE_FAILURE'])
const INFORMATIONAL_STATUSES = new Set(['NO_ADDITIONAL_TESTS_REQUIRED', 'NO_TEST_RELEVANT_CHANGES'])

function PublishSection({ analysisRunId, repositoryName, targetBranch }: { analysisRunId: string; repositoryName: string; targetBranch: string }) {
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
          <span className={`status-badge ${item.status === 'PUBLISHED' ? 'status-success' : ''}`}>{item.status}</span>
        </li>
      ))}
    </ul>
    {published.length > 0 && publicationQuery.data && (
      <div className="panel success-note contract-note">
        <div>
          <strong>Companion PR publicado</strong>
          <p className="branch-flow-line">Rama <code>{publicationQuery.data.branchName}</code><span aria-hidden="true">→</span><code>{targetBranch}</code></p>
          <p><a href={publicationQuery.data.companionPullRequestUrl ?? '#'} target="_blank" rel="noreferrer">PR #{publicationQuery.data.companionPullRequestNumber}</a> en <RepoChip repositoryName={repositoryName} />. No hacia <code>develop</code> directamente — recién cuando el PR original se mergee, estos tests viajan con él. Requiere revisión y merge humano.</p>
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

export function AnalysisRunDetailPage() {
  const { analysisRunId = '' } = useParams()
  const mock = isMockDataSource()
  const runQuery = useAnalysisRun(analysisRunId)

  if (runQuery.isPending) return <LoadingState label="Cargando Analysis Run…" />
  if (runQuery.isError) return <ErrorState message={runQuery.error.message} onRetry={() => void runQuery.refetch()} />

  const run = runQuery.data
  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: 'Runs', to: '/analysis-runs' }, { label: `PR #${run.pullRequest.number}` }]} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Analysis Run</p>
        <div className="run-heading-meta"><RepoChip repositoryName={run.pullRequest.repositoryName} /><span className="pr-number">PR #{run.pullRequest.number}</span></div>
        <h1>{run.pullRequest.title}</h1>
        <p className="branch-flow-line"><code>{run.pullRequest.headRef}</code><span aria-hidden="true">→</span><code>{run.pullRequest.baseRef}</code></p>
      </div>
      {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
    </div>

    <div className="panel analysis-run-summary">
      <span className={`status-badge ${analysisRunStatusClass(run.status)}`}>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</span>
      <dl className="metadata">
        <div><dt>HEAD</dt><dd><code>{run.pullRequest.headSha}</code></dd></div>
        <div><dt>Vigente</dt><dd>{run.current ? 'Sí' : 'No — un HEAD nuevo lo reemplazó'}</dd></div>
        <div><dt>Intentos</dt><dd>{run.attemptCount}</dd></div>
      </dl>
      {run.symbols.length > 0 && <>
        <h3>Símbolos cambiados</h3>
        <ul className="symbol-list">
          {run.symbols.map((symbol) => <li key={symbol.qualifiedName}><code>{symbol.qualifiedName}</code><span className="target-ref">{symbol.changeKind === 'DIRECTLY_CHANGED' ? 'cambio directo' : 'potencialmente impactado'}</span></li>)}
        </ul>
      </>}
    </div>

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
    {run.status === 'BEHAVIORAL_MISMATCH' && <PublishSection analysisRunId={run.id} repositoryName={run.pullRequest.repositoryName} targetBranch={run.pullRequest.headRef} />}

    {run.status === 'SUCCESS' && <PublishSection analysisRunId={run.id} repositoryName={run.pullRequest.repositoryName} targetBranch={run.pullRequest.headRef} />}
  </section>
}
