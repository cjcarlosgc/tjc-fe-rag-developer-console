import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { useAuth } from '../auth/useAuth'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { ProjectTabs } from '../ui/ProjectTabs'
import { RepoChip } from '../ui/RepoChip'
import { useCreateRepositoryBinding, useDisconnectRepository, useGitHubRepositoryBranches, useGitHubUserRepositories, useRepositoryBinding, useVerifyGitHubAppAccess } from './queries'
import type { GitHubAppAccessResponse, GitHubUserRepositoryResponse } from './types'

/**
 * HU30 — repository binding user-centric (INTEROP-2.2 §6.8). La instalación real de la GitHub App
 * y el popup de OAuth no pueden reproducirse en este mock: se simulan en 4 pasos explícitos
 * (descubrir → verificar acceso de la App → elegir rama → vincular), siempre etiquetados DEMO.
 */
export function IntegrationsPage() {
  const { projectId = '' } = useParams()
  const mock = isMockDataSource()
  const { session: authSession, linkGitHub } = useAuth()
  const projectQuery = useProject(projectId)
  const bindingQuery = useRepositoryBinding(projectId)
  const disconnect = useDisconnectRepository(projectId)
  const hasGitHub = Boolean(authSession?.githubProviderToken)
  const reposQuery = useGitHubUserRepositories(hasGitHub)
  const verifyAccess = useVerifyGitHubAppAccess()
  const createBinding = useCreateRepositoryBinding(projectId)

  const [linkPending, setLinkPending] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<GitHubUserRepositoryResponse | null>(null)
  const [accessResult, setAccessResult] = useState<GitHubAppAccessResponse | null>(null)
  const [integrationBranch, setIntegrationBranch] = useState('')
  const branchesQuery = useGitHubRepositoryBranches(accessResult?.status === 'AUTHORIZED' ? selectedRepo?.repositoryName ?? null : null)

  if (bindingQuery.isPending || projectQuery.isPending) return <LoadingState label="Cargando integración…" />
  if (bindingQuery.isError) return <ErrorState message={bindingQuery.error.message} onRetry={() => void bindingQuery.refetch()} />

  const binding = bindingQuery.data

  function selectRepo(repo: GitHubUserRepositoryResponse) {
    setSelectedRepo(repo)
    setAccessResult(null)
    setIntegrationBranch('')
    verifyAccess.mutate({ repositoryId: repo.repositoryId, repositoryName: repo.repositoryName }, { onSuccess: setAccessResult })
  }

  function revalidateAccess() {
    if (!selectedRepo) return
    verifyAccess.mutate({ repositoryId: selectedRepo.repositoryId, repositoryName: selectedRepo.repositoryName }, { onSuccess: setAccessResult })
  }

  function resetFlow() {
    setSelectedRepo(null)
    setAccessResult(null)
    setIntegrationBranch('')
  }

  const filteredRepos = (reposQuery.data?.items ?? []).filter((repo) => repo.repositoryName.toLowerCase().includes(search.trim().toLowerCase()))

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: projectQuery.data?.name ?? projectId, to: `/projects/${projectId}` }, { label: 'Integrations / GitHub' }]} />
    <ProjectTabs projectId={projectId} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">Integrations / GitHub</p>
        <h1>Repository binding</h1>
        <p>Descubre un repositorio visible con tu cuenta de GitHub y vincúlalo para habilitar análisis PR-driven. La GitHub App es quien autoriza y automatiza el repositorio, no tu login.</p>
      </div>
      {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
    </div>

    {binding ? (
      <div className="panel integration-panel">
        <dl className="metadata">
          <div><dt>Repositorio</dt><dd><RepoChip repositoryName={binding.repositoryName} /></dd></div>
          <div><dt>Integration branch</dt><dd><code>{binding.integrationBranch}</code></dd></div>
          <div><dt>Estado</dt><dd><span className="status-badge status-success">{binding.status}</span></dd></div>
        </dl>
        <button type="button" className="button secondary" disabled={disconnect.isPending} onClick={() => disconnect.mutate(undefined, { onSuccess: resetFlow })}>
          {disconnect.isPending ? 'Desconectando…' : 'Desconectar'}
        </button>
        <p className="empty-inline-note">Desconectar deja de aceptar eventos nuevos del repositorio; no borra Runs ni Functional Knowledge ya generados.</p>
      </div>
    ) : !hasGitHub ? (
      <div className="panel integration-panel">
        <div className="empty-inline"><strong>Conecta tu cuenta de GitHub</strong><p>Necesitamos tu identidad de GitHub para descubrir los repositorios que puedes vincular. Esto no autoriza automatización todavía — eso lo decide la GitHub App en el siguiente paso.</p></div>
        <button
          type="button"
          className="button primary"
          disabled={linkPending}
          onClick={() => {
            setLinkPending(true)
            linkGitHub().finally(() => setLinkPending(false))
          }}
        >
          {linkPending ? 'Conectando…' : 'Conectar GitHub'}
        </button>
      </div>
    ) : (
      <div className="panel integration-panel">
        {!selectedRepo && (
          <>
            <div className="field">
              <label htmlFor="repo-search">Buscar repositorio</label>
              <input id="repo-search" type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="owner/repo" />
            </div>
            {reposQuery.isPending && <LoadingState label="Descubriendo repositorios…" />}
            {reposQuery.isError && <ErrorState message={reposQuery.error.message} onRetry={() => void reposQuery.refetch()} />}
            {reposQuery.data && (
              filteredRepos.length === 0 ? (
                <p className="empty-inline-note">Sin repositorios visibles que coincidan con la búsqueda.</p>
              ) : (
                <ul className="action-required-list">
                  {filteredRepos.map((repo) => (
                    <li key={repo.repositoryId}>
                      <button type="button" className="button secondary repo-picker-item" onClick={() => selectRepo(repo)}>
                        <RepoChip repositoryName={repo.repositoryName} />
                        <span className="status-badge status-muted">{repo.private ? 'Privado' : 'Público'}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )
            )}
          </>
        )}

        {selectedRepo && !accessResult && verifyAccess.isPending && <LoadingState label={`Verificando acceso de la App a ${selectedRepo.repositoryName}…`} />}

        {selectedRepo && accessResult?.status === 'NOT_AUTHORIZED' && (
          <div className="panel contract-note">
            <div>
              <strong>{accessResult.app.displayName} no tiene acceso a {selectedRepo.repositoryName}</strong>
              <p>Configura el acceso desde GitHub y vuelve a intentarlo.</p>
              <p className="empty-inline-note"><a href={accessResult.app.configureUrl} target="_blank" rel="noreferrer">Configurar acceso en GitHub →</a></p>
            </div>
            <button type="button" className="button secondary" disabled={verifyAccess.isPending} onClick={revalidateAccess}>
              {verifyAccess.isPending ? 'Revalidando…' : 'Revalidar'}
            </button>
          </div>
        )}

        {selectedRepo && accessResult?.status === 'AUTHORIZED' && (
          <div className="panel success-note contract-note">
            <div>
              <strong>Acceso autorizado a {selectedRepo.repositoryName}</strong>
              {branchesQuery.isPending && <p>Cargando ramas…</p>}
              {branchesQuery.isError && <p className="inline-error" role="alert">{branchesQuery.error.message}</p>}
              {branchesQuery.data && (
                <div className="field">
                  <label htmlFor="integration-branch">Integration branch</label>
                  <select id="integration-branch" value={integrationBranch} onChange={(event) => setIntegrationBranch(event.target.value)}>
                    <option value="">Elige una rama…</option>
                    {branchesQuery.data.items.map((branch) => <option key={branch.name} value={branch.name}>{branch.name}{branch.protected ? ' (protegida)' : ''}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="run-actions">
              <button type="button" className="button secondary" onClick={resetFlow}>Elegir otro repositorio</button>
              <button
                type="button"
                className="button primary"
                disabled={!integrationBranch || createBinding.isPending}
                onClick={() => createBinding.mutate({ repositoryId: selectedRepo.repositoryId, repositoryName: selectedRepo.repositoryName, integrationBranch })}
              >
                {createBinding.isPending ? 'Vinculando…' : 'Vincular repositorio'}
              </button>
            </div>
            {createBinding.isError && <p className="inline-error" role="alert">{createBinding.error.message}</p>}
          </div>
        )}
      </div>
    )}
  </section>
}
