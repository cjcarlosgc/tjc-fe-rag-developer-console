import { Link } from 'react-router-dom'
import { useFunctionalKnowledge } from '../action-required/queries'
import { PendingContractError, isMockDataSource } from '../api/dataSource'
import { CopyButton } from '../ui/CopyButton'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { Spinner } from '../ui/Loaders'
import { errorCorrelationId } from './errors'
import { isTraceNotFinished } from './operationalTraceErrors'
import type { AnalysisRunTraceResponse, TraceLinkStatus, TraceTargetResponse } from './operationalTraceTypes'
import { useAnalysisRunTrace } from './queries'

const CHANGE_KIND_LABELS: Record<string, string> = {
  DIRECTLY_CHANGED: 'cambio directo',
  POTENTIALLY_IMPACTED: 'potencialmente impactado',
}

const FRESHNESS_LABELS: Record<'CURRENT' | 'STALE', string> = {
  CURRENT: 'Vigente respecto al HEAD (CURRENT)',
  STALE: 'Desactualizada: el HEAD cambió (STALE)',
}

/** Solo http/https: cualquier otro esquema (javascript:, data:, ...) no se enlaza. */
function safeHttpUrl(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? value : null
  } catch {
    return null
  }
}

function StatusBadge({ status }: { status: TraceLinkStatus }) {
  return <span className={`trace-badge ${status === 'PRESENT' ? 'trace-badge-present' : 'trace-badge-na'}`}>{status}</span>
}

/** NOT_APPLICABLE es informativo: el flujo terminó antes de este paso. Nunca es un error. */
function NotApplicableNote() {
  return <p className="trace-na-note">No aplica: el flujo terminó antes de este paso.</p>
}

function IdRow({ label, value, copyLabel }: { label: string; value: string | null; copyLabel?: string }) {
  return <div className="trace-field">
    <dt>{label}</dt>
    <dd>{value ? <><code>{value}</code>{copyLabel && <CopyButton value={value} label={copyLabel} />}</> : <span className="trace-no-data">sin dato</span>}</dd>
  </div>
}

interface RuleLookup {
  projectId: string
  ready: boolean
  knownIds: Set<string>
}

function RuleList({ ids, lookup }: { ids: string[]; lookup: RuleLookup }) {
  if (ids.length === 0) return <span className="trace-no-data">ninguna</span>
  return <ul className="trace-rule-list">
    {ids.map((id) => {
      const exists = lookup.ready && lookup.knownIds.has(id)
      return <li key={id}>
        {exists
          ? <Link className="trace-rule-link" to={`/projects/${lookup.projectId}/functional-knowledge/${id}`}><code>{id}</code></Link>
          : <code>{id}</code>}
      </li>
    })}
  </ul>
}

function TargetTrace({ target, index, lookup }: { target: TraceTargetResponse; index: number; lookup: RuleLookup }) {
  const headingId = `trace-target-${index}`
  const { symbol } = target
  return <article className="trace-target" aria-labelledby={headingId}>
    <h3 id={headingId}>Target: <code>{symbol.qualifiedName}</code></h3>
    <p className="trace-target-meta">{CHANGE_KIND_LABELS[symbol.changeKind] ?? symbol.changeKind} · <code>{symbol.filePath}</code></p>
    <ol className="trace-steps">
      <li className="trace-step">
        <h4>Retrieval <StatusBadge status={target.retrieval.status} /></h4>
        {target.retrieval.status === 'PRESENT'
          ? <dl className="trace-fields"><IdRow label="retrieval_id" value={target.retrieval.retrievalId} copyLabel="retrieval_id" /></dl>
          : <NotApplicableNote />}
      </li>
      <li className="trace-step">
        <h4>Contexto <StatusBadge status={target.context.status} /></h4>
        {target.context.status === 'PRESENT'
          ? <dl className="trace-fields">
              <IdRow label="context_id" value={target.context.contextId} copyLabel="context_id" />
              <div className="trace-field"><dt>functionalRuleIds</dt><dd><RuleList ids={target.context.functionalRuleIds} lookup={lookup} /></dd></div>
            </dl>
          : <NotApplicableNote />}
      </li>
      <li className="trace-step">
        <h4>Generación <StatusBadge status={target.generation.status} /></h4>
        {target.generation.status === 'PRESENT'
          ? target.generation.proposalIds.length > 0
            ? <ul className="trace-id-list">{target.generation.proposalIds.map((id) => <li key={id}><code>{id}</code></li>)}</ul>
            : <p className="trace-no-data">Sin propuestas generadas.</p>
          : <NotApplicableNote />}
      </li>
      <li className="trace-step">
        <h4>Ejecuciones <StatusBadge status={target.executions.status} /></h4>
        {target.executions.status === 'PRESENT'
          ? target.executions.items.length > 0
            ? <ol className="trace-execution-list">
                {target.executions.items.map((item) => (
                  <li key={item.executionId} className="trace-execution">
                    <dl className="trace-fields">
                      <IdRow label="execution_id" value={item.executionId} copyLabel="execution_id" />
                      <div className="trace-field"><dt>Intento</dt><dd>{item.attempt}</dd></div>
                      <div className="trace-field"><dt>Perfil</dt><dd><code>{item.executionProfile}</code></dd></div>
                      <div className="trace-field"><dt>Outcome</dt><dd><code>{item.outcome}</code></dd></div>
                      <div className="trace-field"><dt>Propuesta</dt><dd><code>{item.proposalId}</code></dd></div>
                    </dl>
                  </li>
                ))}
              </ol>
            : <p className="trace-no-data">Sin ejecuciones registradas.</p>
          : <NotApplicableNote />}
      </li>
    </ol>
  </article>
}

function PublicationTrace({ publication }: { publication: AnalysisRunTraceResponse['publication'] }) {
  const url = safeHttpUrl(publication.companionPullRequestUrl)
  return <section className="trace-publication" aria-labelledby="trace-publication-title">
    <h3 id="trace-publication-title">Publicación <StatusBadge status={publication.status} /></h3>
    {publication.status === 'PRESENT'
      ? <dl className="trace-fields">
          <div className="trace-field"><dt>checkId</dt><dd>{publication.checkId ? <code>{publication.checkId}</code> : <span className="trace-no-data">sin dato</span>}</dd></div>
          <div className="trace-field"><dt>companionBranch</dt><dd>{publication.companionBranch ? <code>{publication.companionBranch}</code> : <span className="trace-no-data">sin dato</span>}</dd></div>
          <div className="trace-field">
            <dt>companionPullRequestUrl</dt>
            <dd>
              {url
                ? <a href={url} target="_blank" rel="noopener noreferrer">Companion PR</a>
                : publication.companionPullRequestUrl
                  ? <><span className="trace-no-data">URL no válida, no se enlaza:</span> <code>{publication.companionPullRequestUrl}</code></>
                  : <span className="trace-no-data">sin dato</span>}
            </dd>
          </div>
          <div className="trace-field"><dt>sourceHeadSha</dt><dd>{publication.sourceHeadSha ? <code>{publication.sourceHeadSha}</code> : <span className="trace-no-data">sin dato</span>}</dd></div>
          <div className="trace-field"><dt>Freshness</dt><dd>{publication.freshness ? FRESHNESS_LABELS[publication.freshness] : <span className="trace-no-data">sin dato</span>}</dd></div>
        </dl>
      : <NotApplicableNote />}
  </section>
}

function TraceContent({ trace, lookup }: { trace: AnalysisRunTraceResponse; lookup: RuleLookup }) {
  return <>
    <h3>Repositorio y Pull Request</h3>
    <dl className="trace-fields">
      <div className="trace-field"><dt>Repositorio</dt><dd>{trace.repositoryName}</dd></div>
      <div className="trace-field"><dt>Pull Request</dt><dd>#{trace.pullRequestNumber}</dd></div>
      <IdRow label="HEAD" value={trace.headSha} copyLabel="headSha" />
    </dl>

    <h3>Analysis Run</h3>
    <dl className="trace-fields">
      <IdRow label="analysisRunId" value={trace.analysisRunId} copyLabel="analysisRunId" />
    </dl>

    <h3>Changeset</h3>
    <dl className="trace-fields">
      <div className="trace-field"><dt>Estado</dt><dd><StatusBadge status={trace.changeset.status} /></dd></div>
      <div className="trace-field"><dt>targetCount</dt><dd>{trace.changeset.targetCount}</dd></div>
    </dl>
    {trace.changeset.status === 'NOT_APPLICABLE' && <NotApplicableNote />}

    {trace.targets.length === 0
      ? <div className="panel contract-note trace-empty"><div><strong>Sin targets</strong><p>El changeset no tiene símbolos con enlaces por target (targetCount: {trace.changeset.targetCount}).</p></div></div>
      : trace.targets.map((target, index) => <TargetTrace key={`${target.symbol.qualifiedName}-${index}`} target={target} index={index} lookup={lookup} />)}

    <PublicationTrace publication={trace.publication} />
  </>
}

/**
 * INTEROP-2.7 §6.16 (HU15, WI-CONSOLE-016): trace operativo de nueve enlaces. No es el contexto recolectado experimental (§6.7).
 * Los enlaces 1-2 (repositorio/PR/HEAD y Run) no llevan badge: siempre existen cuando hay trace.
 */
export function OperationalTraceSection({ analysisRunId, projectId }: { analysisRunId: string; projectId: string }) {
  const traceQuery = useAnalysisRunTrace(analysisRunId)
  const rulesQuery = useFunctionalKnowledge(projectId)
  const mock = isMockDataSource()
  const lookup: RuleLookup = {
    projectId,
    ready: rulesQuery.isSuccess,
    knownIds: new Set((rulesQuery.data?.items ?? []).map((item) => item.id)),
  }

  let body
  if (traceQuery.isPending) {
    body = <LoadingState label="Cargando trace operativo…" />
  } else if (traceQuery.isError) {
    const error = traceQuery.error
    if (isTraceNotFinished(error)) {
      body = <div className="feedback trace-pending" role="status"><Spinner />El Run aún se procesa. El trace se actualizará automáticamente cuando termine.</div>
    } else if (error instanceof PendingContractError) {
      body = <div className="panel contract-note trace-contract-pending"><div><strong>Contrato pendiente</strong><p>{error.message}</p></div></div>
    } else {
      const message = error instanceof Error ? error.message : 'No se pudo cargar el trace operativo.'
      body = <ErrorState message={message} correlationId={errorCorrelationId(error)} onRetry={() => void traceQuery.refetch()} />
    }
  } else {
    body = <TraceContent trace={traceQuery.data} lookup={lookup} />
  }

  return <section className="panel operational-trace" aria-labelledby="operational-trace-title">
    <div className="section-heading">
      <div>
        <h2 id="operational-trace-title">Trace operativo</h2>
        <p>Cadena de evidencia de este Run: repositorio, changeset, retrieval, contexto, generación, ejecuciones y publicación.</p>
        {mock && <p className="trace-demo-note">Datos simulados: los ids de esta sección son de demo y no corresponden a ejecuciones reales.</p>}
      </div>
    </div>
    {body}
  </section>
}
