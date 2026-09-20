import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { isMockDataSource } from '../api/dataSource'
import { authErrorMessage } from '../auth/errors'
import { useAuth } from '../auth/useAuth'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorNote, ErrorState, LoadingState, ProjectNotFoundState } from '../ui/Feedback'
import { ProjectTabs } from '../ui/ProjectTabs'
import { RepoChip } from '../ui/RepoChip'
import { bindingErrorMessage, errorCorrelationId, isProjectNotFound } from './errors'
import { useCreateRepositoryBinding, useDisconnectRepository, useEnableRepository, useGitHubAppAccessInfo, useGitHubRepositoryBranches, useGitHubUserRepositories, useRepositoryBinding, useVerifyGitHubAppAccess } from './queries'
import { BINDING_STATUS_BADGES } from './status'
import type { GitHubAppAccessResponse, GitHubUserRepositoryResponse } from './types'

/**
 * HU30 — repository binding user-centric (INTEROP-2.3 §6.8). La instalación real de la GitHub App
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
  const enable = useEnableRepository(projectId)
  const hasGitHub = Boolean(authSession?.githubProviderToken)
  const reposQuery = useGitHubUserRepositories(authSession?.githubProviderToken ?? null)
  const verifyAccess = useVerifyGitHubAppAccess()
  const createBinding = useCreateRepositoryBinding(projectId)
  // Resultado de Desconectar/Reactivar para lectores de pantalla (aria-live polite): el botón cambia o desaparece al cambiar el estado.
  const [announcement, setAnnouncement] = useState('')

  const [linkPending, setLinkPending] = useState(false)
  const [linkError, setLinkError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<GitHubUserRepositoryResponse | null>(null)
  const [accessResult, setAccessResult] = useState<GitHubAppAccessResponse | null>(null)
  const [integrationBranch, setIntegrationBranch] = useState('')
  const branchesQuery = useGitHubRepositoryBranches(accessResult?.status === 'AUTHORIZED' ? selectedRepo?.repositoryName ?? null : null)
  // El enlace a configurar la App se ofrece en REVOKED sin esperar a que Reactivar falle, y en DISABLED si Reactivar fue rechazado por falta de acceso.
  const enableNeedsAccess = enable.error instanceof ApiError && enable.error.code === 'GITHUB_APP_ACCESS_REQUIRED'
  const bindingForAccess = bindingQuery.data && (bindingQuery.data.status === 'REVOKED' || enableNeedsAccess) ? bindingQuery.data : null
  const appAccessInfo = useGitHubAppAccessInfo(bindingForAccess)

  // Foco tras Desconectar/Reactivar: el botón pulsado desaparece al cambiar el estado, así que el foco pasa al botón opuesto.
  const reactivateButtonRef = useRef<HTMLButtonElement>(null)
  const disconnectButtonRef = useRef<HTMLButtonElement>(null)
  const pendingFocusRef = useRef<'reactivate' | 'disconnect' | null>(null)
  const bindingStatus = bindingQuery.data?.status
  useEffect(() => {
    if (pendingFocusRef.current === 'reactivate' && bindingStatus !== 'ENABLED') reactivateButtonRef.current?.focus()
    else if (pendingFocusRef.current === 'disconnect' && bindingStatus === 'ENABLED') disconnectButtonRef.current?.focus()
    else return
    pendingFocusRef.current = null
  }, [bindingStatus])

  if (isProjectNotFound(bindingQuery.error) || isProjectNotFound(projectQuery.error)) return <ProjectNotFoundState />
  if (bindingQuery.isPending || projectQuery.isPending) return <LoadingState label="Cargando integración…" />
  if (bindingQuery.isError) return <ErrorState message={bindingQuery.error.message} onRetry={() => void bindingQuery.refetch()} />

  const binding = bindingQuery.data

  function selectRepo(repo: GitHubUserRepositoryResponse) {
    createBinding.reset()
    setSelectedRepo(repo)
    setAccessResult(null)
    setIntegrationBranch('')
    verifyAccess.mutate({ repositoryId: repo.repositoryId, repositoryName: repo.repositoryName }, { onSuccess: setAccessResult })
  }

  function verifySelectedRepoAccess() {
    if (!selectedRepo) return
    verifyAccess.mutate({ repositoryId: selectedRepo.repositoryId, repositoryName: selectedRepo.repositoryName }, { onSuccess: setAccessResult })
  }

  /** «Revalidar» manual: un error de vinculación previo ya no aplica al nuevo intento. */
  function revalidateAccess() {
    createBinding.reset()
    verifySelectedRepoAccess()
  }

  function reactivate() {
    setAnnouncement('')
    enable.mutate(undefined, {
      onSuccess: () => {
        pendingFocusRef.current = 'disconnect'
        setAnnouncement('Repositorio reactivado: la recepción de eventos de PR volvió a estar activa.')
      },
    })
  }

  function resetFlow() {
    createBinding.reset()
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
    <p role="status" className="visually-hidden">{announcement}</p>

    {binding ? (
      <div className="panel integration-panel">
        <dl className="metadata">
          <div><dt>Repositorio</dt><dd><RepoChip repositoryName={binding.repositoryName} /></dd></div>
          <div><dt>Integration branch</dt><dd><code>{binding.integrationBranch}</code></dd></div>
          <div><dt>Estado</dt><dd><span className={`status-badge ${BINDING_STATUS_BADGES[binding.status].className}`}>{BINDING_STATUS_BADGES[binding.status].label}</span></dd></div>
        </dl>
        {binding.status === 'ENABLED' ? (
          <>
            <button ref={disconnectButtonRef} type="button" className="button secondary" disabled={disconnect.isPending} onClick={() => {
              setAnnouncement('')
              disconnect.mutate(undefined, {
                onSuccess: () => {
                  resetFlow()
                  pendingFocusRef.current = 'reactivate'
                  setAnnouncement('Repositorio desconectado: la recepción de eventos de PR quedó pausada.')
                },
              })
            }}>
              {disconnect.isPending ? 'Desconectando…' : 'Desconectar'}
            </button>
            <p className="empty-inline-note">Desconectar pausa la recepción de eventos de PR; no borra Runs ni Functional Knowledge y puedes reactivarlo.</p>
            {disconnect.isError && <ErrorNote message={bindingErrorMessage(disconnect.error)} correlationId={errorCorrelationId(disconnect.error)} />}
          </>
        ) : (
          <>
            {binding.status === 'REVOKED' ? (
              <p className="empty-inline-note">La GitHub App perdió acceso al repositorio. Los eventos de PR no se procesan; los Runs y el Functional Knowledge ya generados se conservan. Al reactivar se revalida el acceso de la App.</p>
            ) : (
              <p className="empty-inline-note">La recepción de eventos de PR está pausada. Los Runs y el Functional Knowledge ya generados se conservan.</p>
            )}
            <div className="run-actions">
              {mock && <span className="demo-stamp">DEMO · REACTIVAR SIMULADO</span>}
              <button ref={reactivateButtonRef} type="button" className="button primary" disabled={enable.isPending} onClick={reactivate}>
                {enable.isPending ? 'Reactivando…' : 'Reactivar'}
              </button>
            </div>
            {enable.isError && <ErrorNote message={bindingErrorMessage(enable.error)} correlationId={errorCorrelationId(enable.error)} />}
            {appAccessInfo.data?.status === 'NOT_AUTHORIZED' && (
              <p className="empty-inline-note"><a href={appAccessInfo.data.app.configureUrl} target="_blank" rel="noreferrer">Configurar acceso de la GitHub App →</a></p>
            )}
          </>
        )}
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
            setLinkError(null)
            linkGitHub()
              .catch((error: unknown) => setLinkError(authErrorMessage(error)))
              .finally(() => setLinkPending(false))
          }}
        >
          {linkPending ? 'Conectando…' : 'Conectar GitHub'}
        </button>
        {linkError && <p className="empty-inline-note" role="alert">{linkError}</p>}
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
          <div className="panel contract-note" role="status">
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
                onClick={() => createBinding.mutate(
                  { repositoryId: selectedRepo.repositoryId, repositoryName: selectedRepo.repositoryName, integrationBranch },
                  // La App perdió (o nunca tuvo) acceso: se revalida para mostrar el CTA de configuración que el mensaje promete. La selección se conserva.
                  { onError: (error) => { if (error instanceof ApiError && error.code === 'GITHUB_APP_ACCESS_REQUIRED') verifySelectedRepoAccess() } },
                )}
              >
                {createBinding.isPending ? 'Vinculando…' : 'Vincular repositorio'}
              </button>
            </div>
          </div>
        )}

        {/* Fuera de los bloques por estado de acceso: tras un 403 la revalidación cambia de AUTHORIZED a NOT_AUTHORIZED y el error no debe perderse. */}
        {selectedRepo && createBinding.isError && <ErrorNote message={bindingErrorMessage(createBinding.error)} correlationId={errorCorrelationId(createBinding.error)} />}
      </div>
    )}
  </section>
}
