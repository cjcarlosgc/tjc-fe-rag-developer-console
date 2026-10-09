import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { ANALYSIS_RUN_STATUS_LABELS, analysisRunStatusClass } from '../control-plane/status'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { confirmingRoleLabel, MISSING_PROVENANCE_LABEL, scenarioLabel, shortSha, supersessionChain } from './knowledgeScenarios'
import { useFunctionalKnowledge } from './queries'
import { getRuleUsage } from './speculative/ruleUsage'

/** HU07/HU09 · INTEROP-2.7 §6.11 — detalle de una regla: procedencia, escenario y cadena de supersesión completa. */
export function FunctionalKnowledgeDetailPage() {
  const { projectId = '', knowledgeId = '' } = useParams()
  const mock = isMockDataSource()
  const projectQuery = useProject(projectId)
  const knowledgeQuery = useFunctionalKnowledge(projectId)
  const usageQuery = useQuery({
    queryKey: ['action-required', 'speculative', 'rule-usage', knowledgeId],
    queryFn: () => getRuleUsage(knowledgeId),
    enabled: Boolean(knowledgeId),
  })

  if (knowledgeQuery.isPending) return <LoadingState label="Cargando regla…" />
  if (knowledgeQuery.isError) return <ErrorState message={knowledgeQuery.error.message} onRetry={() => void knowledgeQuery.refetch()} />

  const items = knowledgeQuery.data.items
  const item = items.find((entry) => entry.id === knowledgeId)
  if (!item) return <div className="empty-inline"><strong>Regla no encontrada</strong><p>No existe esta regla de Functional Knowledge en este proyecto.</p></div>

  const chain = supersessionChain(items, item.id)
  const workspaceQuery = projectQuery.data ? `?workspaceId=${encodeURIComponent(projectQuery.data.workspace.id)}` : ''
  const role = confirmingRoleLabel(item.confirmedRole)

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: projectQuery.data ? `/?workspaceId=${encodeURIComponent(projectQuery.data.workspace.id)}` : '/' }, { label: projectQuery.data?.name ?? projectId, to: projectQuery.data ? `/projects/${projectId}?workspaceId=${encodeURIComponent(projectQuery.data.workspace.id)}` : `/projects/${projectId}` }, { label: 'Functional Knowledge', to: `/projects/${projectId}/functional-knowledge${workspaceQuery}` }, { label: item.targetRef ?? item.scope }]} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Functional Knowledge</p>
        <h1>{item.normalizedRule}</h1>
      </div>
      {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
    </div>

    <div className="panel analysis-run-summary">
      <span className={`status-badge ${item.status === 'ACTIVE' ? 'status-success' : 'status-muted'}`}>{item.status}</span>
      <dl className="metadata">
        <div><dt>Scope</dt><dd>{item.scope}</dd></div>
        <div><dt>Target</dt><dd><code>{item.targetRef ?? '—'}</code></dd></div>
        <div><dt>Creado</dt><dd>{new Date(item.createdAt).toLocaleString('es-PE')}</dd></div>
        <div><dt>Escenario</dt><dd>{scenarioLabel(item.scenarioKind)}</dd></div>
        <div><dt>Clave de escenario</dt><dd><code>{item.scenarioKey}</code></dd></div>
      </dl>
    </div>

    <div className="panel">
      <div className="section-heading"><div><h2>Procedencia</h2><p>Quién confirmó la regla y desde qué commit. Es trazabilidad, no vencimiento.</p></div></div>
      <dl className="metadata">
        <div><dt>Confirmada por</dt><dd>{item.confirmedByUserId ? <code>{item.confirmedByUserId}</code> : <span className="fk-missing">{MISSING_PROVENANCE_LABEL}</span>}</dd></div>
        <div><dt>Rol</dt><dd>{role ?? <span className="fk-missing">{MISSING_PROVENANCE_LABEL}</span>}</dd></div>
        <div><dt>Commit de origen</dt><dd>{item.originHeadSha ? <><code title={item.originHeadSha}>{shortSha(item.originHeadSha)}</code><span className="visually-hidden">commit completo: {item.originHeadSha}</span></> :<span className="fk-missing">{MISSING_PROVENANCE_LABEL}</span>}</dd></div>
        <div><dt>Fuente</dt><dd>{item.source === 'HUMAN_ANSWER' ? 'Respuesta humana' : 'Importación aprobada'}</dd></div>
        {item.source === 'APPROVED_IMPORT' && (
          <div><dt>Referencia de importación</dt><dd>{item.sourceRef ? <code>{item.sourceRef}</code> : <span className="fk-missing">{MISSING_PROVENANCE_LABEL}</span>}</dd></div>
        )}
      </dl>
    </div>

    <div className="panel">
      <div className="section-heading"><div><h2>Pregunta y respuesta originales</h2></div></div>
      <p><strong>Pregunta:</strong> {item.originalQuestion}</p>
      <p><strong>Respuesta:</strong> {item.originalAnswer}</p>
    </div>

    {chain.length > 1 && (
      <section className="panel" aria-labelledby="fk-chain-title">
        <div className="section-heading"><div><h2 id="fk-chain-title">Cadena de reemplazo</h2><p>De la regla más antigua a la más reciente. Se indica cuál estás viendo y cuál está vigente.</p></div></div>
        <ol className="fk-chain" aria-labelledby="fk-chain-title">
          {chain.map((link) => {
            const current = link.id === item.id
            const active = link.status === 'ACTIVE'
            return (
              <li key={link.id} aria-current={current ? 'step' : undefined} className={current ? 'fk-chain-current' : undefined}>
                <span className={`status-badge ${active ? 'status-success' : 'status-muted'}`}>{link.status}</span>
                <span className="fk-chain-rule">{link.normalizedRule}</span>
                {current && <span className="fk-chain-note">Estás viendo esta regla</span>}
                {active && <span className="fk-chain-note">Vigente</span>}
                {!current && <Link to={`/projects/${projectId}/functional-knowledge/${link.id}${workspaceQuery}`}>Ver regla →</Link>}
              </li>
            )
          })}
        </ol>
      </section>
    )}

    {usageQuery.isSuccess && (
      <div className="panel">
        <div className="section-heading"><div><h2>Runs que usaron esta regla</h2><p>Analysis Runs cuyo símbolo cambiado coincide con el target de esta regla.</p></div><span className="proposal-stamp" title="HU52 — propuesta sin contrato aprobado, coincidencia inferida localmente por símbolo">PROPUESTA</span></div>
        {usageQuery.data.length === 0
          ? <p className="empty-inline-note">Ningún Analysis Run demo tocó este símbolo todavía.</p>
          : <ul className="context-provenance-list">
              {usageQuery.data.map((run) => (
                <li key={run.id}>
                  <RepoChip repositoryName={run.pullRequest.repositoryName} />
                  <Link to={`/projects/${run.projectId}/runs/${run.id}`}>PR #{run.pullRequest.number}</Link>
                  <span className={`status-badge ${analysisRunStatusClass(run.status)}`}>{ANALYSIS_RUN_STATUS_LABELS[run.status]}</span>
                </li>
              ))}
            </ul>}
      </div>
    )}
  </section>
}
