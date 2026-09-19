import { Link } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { RepoChip } from '../ui/RepoChip'
import { useActionRequiredList } from './queries'

/** HU38 — bandeja de Runs con contexto funcional pendiente; cada fila abre Focus Mode con retorno seguro. */
export function ActionRequiredPage() {
  const mock = isMockDataSource()
  const listQuery = useActionRequiredList()

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: 'Action Required' }]} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Control plane / human-in-the-loop</p>
        <h1>Action Required</h1>
        <p>Runs que necesitan una respuesta funcional antes de continuar el análisis.</p>
      </div>
      {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
    </div>
    {listQuery.isPending && <LoadingState label="Cargando bandeja…" />}
    {listQuery.isError && <ErrorState message={listQuery.error.message} onRetry={() => void listQuery.refetch()} />}
    {listQuery.data && (listQuery.data.items.length === 0
      ? <div className="empty-inline"><strong>Sin pendientes</strong><p>No hay Runs esperando contexto funcional en este momento.</p></div>
      : <ul className="action-required-list">
          {listQuery.data.items.map((question) => (
            <li key={question.id} className="panel action-required-item">
              <Link to={`/action-required/${question.analysisRunId}?returnTo=${encodeURIComponent('/action-required')}`}>
                <div className="action-required-item-heading">
                  <RepoChip repositoryName={question.repositoryName} />
                  <span className="pr-ref">PR #{question.pullRequestNumber}</span>
                  <span className="target-ref">{question.target.qualifiedName}</span>
                </div>
                <p>{question.question}</p>
                <span className="card-link">Abrir Focus Mode →</span>
              </Link>
            </li>
          ))}
        </ul>)}
  </section>
}
