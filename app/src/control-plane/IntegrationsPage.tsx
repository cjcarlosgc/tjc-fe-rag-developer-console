import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { ApiError } from '../api/client'
import { isMockDataSource } from '../api/dataSource'
import { authErrorMessage } from '../auth/errors'
import { useAuth } from '../auth/useAuth'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorNote, ErrorState, LoadingState, ProjectNotFoundState } from '../ui/Feedback'
import { ProjectTabs } from '../ui/ProjectTabs'
import { RepoChip } from '../ui/RepoChip'
import { bindingErrorMessage, errorCorrelationId, isGitHubAccessRenewalRequired, isProjectNotFound, isVerificationUnavailable, reactivateErrorMessage } from './errors'
import { useCreateRepositoryBinding, useDisconnectRepository, useEnableRepository, useGitHubAppAccessInfo, useGitHubRepositoryBranches, useGitHubUserRepositories, useRepositoryBinding, useVerifyGitHubAppAccess } from './queries'
import { canBindRepository } from './repositoryPermissions'
import { BINDING_STATUS_BADGES } from './status'
import type { CreateRepositoryBindingRequest, GitHubAppAccessResponse, GitHubUserRepositoryResponse } from './types'

/**
 * HU30 — repository binding user-centric (INTEROP-2.3 §6.8). La instalación real de la GitHub App
 * y el popup de OAuth no pueden reproducirse en este mock: se simulan en 4 pasos explícitos
 * (descubrir → verificar acceso de la App → elegir rama → vincular), siempre etiquetados DEMO.
 */
export function IntegrationsPage() {
  const { projectId = '' } = useParams()
  const mock = isMockDataSource()
  const { session: authSession, signInWithGitHub } = useAuth()
  const location = useLocation()
  const projectQuery = useProject(projectId)
  const bindingQuery = useRepositoryBinding(projectId)
  const disconnect = useDisconnectRepository(projectId)
  const enable = useEnableRepository(projectId)
  const hasGitHub = Boolean(authSession?.githubProviderToken)
  const project = projectQuery.data
  const canManageBinding = project?.role === 'ADMIN' || project?.role === 'MAINTAINER'
  const canReactivateBinding = canManageBinding && (bindingQuery.data?.status !== 'REVOKED' || project?.role === 'ADMIN')
  const reposQuery = useGitHubUserRepositories(authSession?.githubProviderToken ?? null, project?.workspace ?? null)
  const verifyAccess = useVerifyGitHubAppAccess()
  const createBinding = useCreateRepositoryBinding(projectId)
  // Resultado de Desconectar/Reactivar para lectores de pantalla (aria-live polite): el botón cambia o desaparece al cambiar el estado.
  const [announcement, setAnnouncement] = useState('')

  const [renewPending, setRenewPending] = useState(false)
  const [renewError, setRenewError] = useState<string | null>(null)
  // Volver con Atrás desde GitHub restaura la página desde bfcache con el estado congelado: sin esto «Renovando…» quedaría para siempre.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => { if (event.persisted) setRenewPending(false) }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])
  const [search, setSearch] = useState('')
  const [selectedRepo, setSelectedRepo] = useState<GitHubUserRepositoryResponse | null>(null)
  const [accessResult, setAccessResult] = useState<GitHubAppAccessResponse | null>(null)
  const [integrationBranch, setIntegrationBranch] = useState('')
  const branchesQuery = useGitHubRepositoryBranches(accessResult?.status === 'AUTHORIZED' ? selectedRepo?.repositoryName ?? null : null)
  // El enlace a configurar la App se ofrece en REVOKED sin esperar a que Reactivar falle, y en DISABLED si Reactivar fue rechazado por falta de acceso.
  const enableNeedsAccess = enable.error instanceof ApiError && enable.error.code === 'GITHUB_APP_ACCESS_REQUIRED'
  const bindingForAccess = canReactivateBinding && bindingQuery.data && (bindingQuery.data.status === 'REVOKED' || enableNeedsAccess) ? bindingQuery.data : null
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
  if (bindingQuery.isError) return <ErrorState message={bindingErrorMessage(bindingQuery.error)} correlationId={errorCorrelationId(bindingQuery.error)} onRetry={() => void bindingQuery.refetch()} />

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

  /** POST del binding. La App perdió (o nunca tuvo) acceso: se revalida para mostrar el CTA de configuración que el mensaje promete; la selección se conserva. */
  function submitBinding(input: CreateRepositoryBindingRequest) {
    createBinding.mutate(input, { onError: (error) => { if (error instanceof ApiError && error.code === 'GITHUB_APP_ACCESS_REQUIRED') verifySelectedRepoAccess() } })
  }

  function resetFlow() {
    createBinding.reset()
    setSelectedRepo(null)
    setAccessResult(null)
    setIntegrationBranch('')
  }

  /** HU62: única vía para obtener de nuevo el token OAuth de GitHub (`signInWithOAuth`, no hay linking). Vuelve a esta misma ruta. */
  function renewGitHubAccess() {
    setRenewPending(true)
    setRenewError(null)
    // `redirectTo` en supabase, navegación en cliente en mock (no hay redirección).
    signInWithGitHub(`${location.pathname}${location.search}`)
      // Sin sesión inmediata el navegador ya está yendo a GitHub: el botón queda deshabilitado hasta salir de la página.
      .then((signedIn) => { if (signedIn) setRenewPending(false) })
      .catch((error: unknown) => {
        setRenewError(authErrorMessage(error))
        setRenewPending(false)
      })
  }

  function renewAccessPanel(description: string) {
    return <div className="panel integration-panel">
      <div className="empty-inline"><strong>Renueva tu acceso a GitHub</strong><p>{description}</p></div>
      <button type="button" className="button primary" disabled={renewPending} onClick={renewGitHubAccess}>
        {renewPending ? 'Renovando…' : 'Renovar acceso a GitHub'}
      </button>
      {renewError && <>
        <ErrorNote message={renewError} />
        <button type="button" className="button secondary" disabled={renewPending} onClick={renewGitHubAccess}>Reintentar</button>
      </>}
    </div>
  }

  const filteredRepos = (reposQuery.data?.items ?? []).filter((repo) => repo.repositoryName.toLowerCase().includes(search.trim().toLowerCase()))

  return <section>
    <Breadcrumbs items={[{ label: 'Proyectos', to: `/?workspaceId=${encodeURIComponent(project?.workspace.id ?? '')}` }, { label: project?.name ?? projectId, to: `/projects/${projectId}?workspaceId=${encodeURIComponent(project?.workspace.id ?? '')}` }, { label: 'Integrations / GitHub' }]} />
    <ProjectTabs projectId={projectId} />
    <div className="page-heading">
      <div>
        <p className="eyebrow">{project?.workspace.login ?? 'Cuenta personal'} · {project?.role} / Integrations</p>
        <h1>Repository binding</h1>
        <p>Repositorios disponibles solo en {project?.workspace.login ?? 'tu cuenta personal'}. La GitHub App es quien autoriza y automatiza el repositorio, no tu login.</p>
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
          canManageBinding ? <>
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
          </> : <p className="empty-inline-note">Tu rol permite consultar el vínculo, pero no pausarlo. Un Maintainer o Admin puede cambiarlo.</p>
        ) : (
          <>
            {binding.status === 'REVOKED' ? (
              <p className="empty-inline-note">La GitHub App perdió acceso al repositorio. Los eventos de PR no se procesan; los Runs y el Functional Knowledge ya generados se conservan. Al reactivar se revalida el acceso de la App.</p>
            ) : (
              <p className="empty-inline-note">La recepción de eventos de PR está pausada. Los Runs y el Functional Knowledge ya generados se conservan.</p>
            )}
            {canReactivateBinding && <div className="run-actions">
              {mock && <span className="demo-stamp">DEMO · REACTIVAR SIMULADO</span>}
              <button ref={reactivateButtonRef} type="button" className="button primary" disabled={enable.isPending} onClick={reactivate}>
                {enable.isPending ? 'Reactivando…' : 'Reactivar'}
              </button>
            </div>}
            {canReactivateBinding && enable.isError && <ErrorNote message={reactivateErrorMessage(enable.error)} correlationId={errorCorrelationId(enable.error)} />}
            {appAccessInfo.data?.status === 'NOT_AUTHORIZED' && (
              <p className="empty-inline-note"><a href={appAccessInfo.data.app.configureUrl} target="_blank" rel="noreferrer">Configurar acceso de la GitHub App →</a></p>
            )}
            {!canReactivateBinding && <p className="empty-inline-note">{binding.status === 'REVOKED' ? 'Solo un Admin puede reactivar un binding revocado.' : 'Tu rol permite consultar el vínculo, pero no reactivarlo. Un Maintainer o Admin debe hacerlo.'}</p>}
          </>
        )}
      </div>
    ) : !canManageBinding ? (
      <div className="panel integration-panel"><div className="empty-inline"><strong>Sin repositorio vinculado</strong><p>El contrato oculta Projects de organización sin repositorio a roles que no sean Admin. Si tu rol fue actualizado recientemente, vuelve al Overview y refresca.</p></div></div>
    ) : !hasGitHub ? (
      renewAccessPanel('Para descubrir los repositorios que puedes vincular necesitamos el acceso de GitHub de tu sesión. Supabase no lo conserva cuando la sesión se recarga o restaura, por eso hay que renovarlo. Esto no autoriza automatización todavía — eso lo decide la GitHub App en el siguiente paso.')
    ) : (
      <div className="panel integration-panel">
        {!selectedRepo && (
          <>
            <div className="field">
              <label htmlFor="repo-search">Buscar repositorio</label>
              <input id="repo-search" type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="owner/repo" />
            </div>
            {reposQuery.isPending && <LoadingState label="Descubriendo repositorios…" />}
            {reposQuery.isError && (isGitHubAccessRenewalRequired(reposQuery.error)
              ? renewAccessPanel(bindingErrorMessage(reposQuery.error))
              : <ErrorState message={bindingErrorMessage(reposQuery.error)} correlationId={errorCorrelationId(reposQuery.error)} onRetry={() => void reposQuery.refetch()} />)}
            {reposQuery.data && (
              filteredRepos.length === 0 ? (
                <p className="empty-inline-note">Sin repositorios visibles que coincidan con la búsqueda.</p>
              ) : (
                <ul className="action-required-list">
                  {filteredRepos.map((repo) => {
                    // HU64: read/triage no permiten vincular. Se explica con texto (no solo color); el rechazo autoritativo sigue siendo el POST.
                    const bindable = canBindRepository(repo)
                    return <li key={repo.repositoryId}>
                      <button type="button" className="button secondary repo-picker-item" disabled={!bindable} aria-describedby={bindable ? undefined : `repo-permission-${repo.repositoryId}`} onClick={() => selectRepo(repo)}>
                        <RepoChip repositoryName={repo.repositoryName} />
                        <span className="status-badge status-muted">{repo.private ? 'Privado' : 'Público'}</span>
                        {!bindable && <span className="status-badge status-warn">No vinculable</span>}
                      </button>
                      {!bindable && <p id={`repo-permission-${repo.repositoryId}`} className="empty-inline-note">Necesitas permiso maintain, write o admin sobre este repositorio para vincularlo; con tu permiso actual (solo lectura o triage) no es posible.</p>}
                    </li>
                  })}
                </ul>
              )
            )}
          </>
        )}

        {selectedRepo && !accessResult && verifyAccess.isPending && <LoadingState label={`Verificando acceso de la App a ${selectedRepo.repositoryName}…`} />}

        {selectedRepo && !accessResult && verifyAccess.isError && <>
          <ErrorNote message={bindingErrorMessage(verifyAccess.error)} correlationId={errorCorrelationId(verifyAccess.error)} />
          <div className="run-actions">
            <button type="button" className="button secondary" onClick={resetFlow}>Elegir otro repositorio</button>
            {isVerificationUnavailable(verifyAccess.error) && <button type="button" className="button primary" onClick={verifySelectedRepoAccess}>Reintentar</button>}
          </div>
        </>}

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
              {branchesQuery.isError && <>
                <ErrorNote message={bindingErrorMessage(branchesQuery.error)} correlationId={errorCorrelationId(branchesQuery.error)} />
                {isVerificationUnavailable(branchesQuery.error) && <button type="button" className="button secondary" onClick={() => void branchesQuery.refetch()}>Reintentar</button>}
              </>}
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
                onClick={() => submitBinding({ repositoryId: selectedRepo.repositoryId, repositoryName: selectedRepo.repositoryName, integrationBranch })}
              >
                {createBinding.isPending ? 'Vinculando…' : 'Vincular repositorio'}
              </button>
            </div>
          </div>
        )}

        {/* Fuera de los bloques por estado de acceso: tras un 403 la revalidación cambia de AUTHORIZED a NOT_AUTHORIZED y el error no debe perderse. */}
        {selectedRepo && createBinding.isError && <>
          <ErrorNote message={bindingErrorMessage(createBinding.error)} correlationId={errorCorrelationId(createBinding.error)} />
          {isVerificationUnavailable(createBinding.error) && createBinding.variables && (
            <button type="button" className="button secondary" disabled={createBinding.isPending} onClick={() => submitBinding(createBinding.variables)}>Reintentar</button>
          )}
        </>}
      </div>
    )}
  </section>
}
