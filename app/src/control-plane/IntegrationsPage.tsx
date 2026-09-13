import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { useAuth } from '../auth/useAuth'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { useCompleteGitHubInstallation, useDisconnectRepository, useRepositoryBinding, useStartGitHubInstallation } from './queries'

/** HU30 — repository binding. La instalación real de la GitHub App requiere un popup de GitHub que este mock no puede reproducir: se simula en 2 pasos explícitos, siempre etiquetados DEMO. */
export function IntegrationsPage() {
  const { projectId = '' } = useParams()
  const mock = isMockDataSource()
  const { session: authSession } = useAuth()
  const projectQuery = useProject(projectId)
  const bindingQuery = useRepositoryBinding(projectId)
  const startInstallation = useStartGitHubInstallation(projectId)
  const completeInstallation = useCompleteGitHubInstallation(projectId)
  const disconnect = useDisconnectRepository(projectId)
  const [installationSession, setInstallationSession] = useState<{ installationUrl: string; state: string } | null>(null)

  if (bindingQuery.isPending || projectQuery.isPending) return <LoadingState label="Cargando integración…" />
  if (bindingQuery.isError) return <ErrorState message={bindingQuery.error.message} onRetry={() => void bindingQuery.refetch()} />

  const binding = bindingQuery.data
  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: projectQuery.data?.name ?? projectId, to: `/projects/${projectId}` }, { label: 'Integrations / GitHub' }]} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Integrations / GitHub</p>
        <h1>Repository binding</h1>
        <p>Vincula un repositorio para habilitar análisis PR-driven. La conexión de la GitHub App es un flujo separado del login.</p>
      </div>
      {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
    </div>

    {binding ? (
      <div className="panel integration-panel">
        <dl className="metadata">
          <div><dt>Repositorio</dt><dd>{binding.repositoryName}</dd></div>
          <div><dt>Integration branch</dt><dd><code>{binding.integrationBranch}</code></dd></div>
          <div><dt>Estado</dt><dd><span className="status-badge status-success">{binding.status}</span></dd></div>
        </dl>
        <button type="button" className="button secondary" disabled={disconnect.isPending} onClick={() => disconnect.mutate()}>
          {disconnect.isPending ? 'Desconectando…' : 'Desconectar'}
        </button>
        <p className="empty-inline-note">Desconectar deja de aceptar eventos nuevos del repositorio; no borra Runs ni Functional Knowledge ya generados.</p>
      </div>
    ) : (
      <div className="panel integration-panel">
        <div className="empty-inline"><strong>Sin repositorio vinculado</strong><p>Conecta la GitHub App para que los PR hacia la rama de integración disparen análisis automáticos.</p></div>
        {!installationSession ? (
          <button
            type="button"
            className="button primary"
            disabled={startInstallation.isPending}
            onClick={() => startInstallation.mutate(undefined, { onSuccess: (result) => setInstallationSession({ installationUrl: result.installationUrl, state: result.installationUrl.split('state=')[1] ?? '' }) })}
          >
            {startInstallation.isPending ? 'Iniciando…' : 'Conectar GitHub App'}
          </button>
        ) : (
          <div className="panel success-note contract-note">
            <div>
              <strong>Instalación simulada iniciada</strong>
              <p>En un flujo real, se abriría <code>{installationSession.installationUrl}</code> en GitHub{authSession ? ` como ${authSession.user.email}` : ''}. Esta demo no realiza la instalación real.</p>
            </div>
            <button
              type="button"
              className="button primary"
              disabled={completeInstallation.isPending}
              onClick={() => completeInstallation.mutate({ installationId: `inst_demo_${installationSession.state}`, repositoryId: 'demo', state: installationSession.state }, { onSuccess: () => setInstallationSession(null) })}
            >
              {completeInstallation.isPending ? 'Vinculando…' : 'Simular instalación completada'}
            </button>
          </div>
        )}
      </div>
    )}
  </section>
}
