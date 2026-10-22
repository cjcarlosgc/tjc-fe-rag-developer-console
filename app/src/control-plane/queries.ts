import { useEffect, useRef } from 'react'
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import { isMockDataSource } from '../api/dataSource'
import type { Project } from '../projects/types'
import {
  createRepositoryBinding,
  createTestPublication,
  disconnectRepository,
  enableRepository,
  getAnalysisRun,
  getAnalysisRunTrace,
  getGitHubAppAccess,
  getGitHubAppInfo,
  getRepositoryBinding,
  getTestPublication,
  listAnalysisRuns,
  listAllAnalysisRuns,
  listGitHubRepositoryBranches,
  listGitHubUserRepositories,
  listTestProposals,
  verifyGitHubAppAccess,
} from './api'
import { isTraceNotFinished, shouldRetryOperationalTrace } from './operationalTraceErrors'
import type {
  AnalysisRunStatus,
  CreateRepositoryBindingRequest,
  CreateTestPublicationRequest,
  TestPublicationResponse,
  TestPublicationStatus,
  VerifyGitHubAppAccessRequest,
} from './types'
import { pollDelayMs } from '../api/polling'

export const controlPlaneKeys = {
  binding: (projectId: string) => ['control-plane', 'binding', projectId] as const,
  githubRepositories: (projectId: string, userId: string | null) => ['control-plane', 'github-repositories', userId, projectId] as const,
  githubApp: ['control-plane', 'github-app'] as const,
  githubAppAccess: (projectId: string, repositoryId: string, userId: string | null) =>
    ['control-plane', 'github-app-access', userId, projectId, repositoryId] as const,
  githubBranches: (projectId: string, repositoryName: string, userId: string | null) =>
    ['control-plane', 'github-branches', userId, projectId, repositoryName] as const,
  runs: (projectId?: string, status?: AnalysisRunStatus) => ['control-plane', 'runs', projectId ?? null, status ?? null] as const,
  allRuns: ['control-plane', 'runs', 'all'] as const,
  run: (analysisRunId: string) => ['control-plane', 'run', analysisRunId] as const,
  proposals: (analysisRunId: string) => ['control-plane', 'proposals', analysisRunId] as const,
  trace: (analysisRunId: string) => ['control-plane', 'trace', analysisRunId] as const,
  publication: (publicationId: string) => ['control-plane', 'publication', publicationId] as const,
}

/** Estados terminales de `TestPublication` (INTEROP §5: permanecen consultables; no se vuelve a sondear). */
export function isTerminalPublicationStatus(status: TestPublicationStatus | null | undefined): boolean {
  return status === 'PUBLISHED' || status === 'FAILED' || status === 'STALE' || status === 'CLOSED'
}

/** Estados en curso: la publicación sigue en Core y conviene sondearla. */
export function isInProgressPublicationStatus(status: TestPublicationStatus | null | undefined): boolean {
  return status === 'PENDING' || status === 'PUBLISHING'
}

const PUBLICATION_POLL_FALLBACK_MS = 2000
const PUBLICATION_POLL_TEST_MS = 10
const PUBLICATION_MAX_NETWORK_RETRIES = 2

/**
 * Intervalo de sondeo de una publicación. `false` (sin intervalo) en terminal o tras un error; en curso usa
 * `pollAfterMs` del `202` si es un número positivo, y si no el fallback. En tests, intervalo corto como el resto de polling.
 */
export function publicationPollIntervalMs(
  state: { status?: TestPublicationStatus | null; hasError: boolean; pollAfterMs?: number | null },
  testMode = import.meta.env.MODE === 'test',
): number | false {
  if (state.hasError || isTerminalPublicationStatus(state.status)) return false
  if (testMode) return PUBLICATION_POLL_TEST_MS
  return typeof state.pollAfterMs === 'number' && state.pollAfterMs > 0 ? state.pollAfterMs : PUBLICATION_POLL_FALLBACK_MS
}

/** Consulta `GET /test-publications/{publicationId}` con sondeo derivado del estado; no reintenta errores 4xx de dominio. */
export function usePublication(publicationId: string | null | undefined, pollAfterMs?: number | null) {
  return useQuery({
    queryKey: controlPlaneKeys.publication(publicationId ?? ''),
    queryFn: () => getTestPublication(publicationId as string),
    enabled: Boolean(publicationId),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false
      return failureCount < PUBLICATION_MAX_NETWORK_RETRIES
    },
    refetchInterval: (query) =>
      publicationPollIntervalMs({ status: query.state.data?.status, hasError: query.state.error !== null, pollAfterMs }),
  })
}

/**
 * Al llegar la publicación a terminal invalida propuestas y Run una sola vez por `publicationId`
 * (no en el POST: el estado todavía no es definitivo).
 */
export function useRefreshOnPublicationTerminal(analysisRunId: string, publication: TestPublicationResponse | undefined) {
  const queryClient = useQueryClient()
  const refreshedFor = useRef<string | null>(null)
  const publicationId = publication?.id ?? null
  const status = publication?.status
  useEffect(() => {
    if (!publicationId || !isTerminalPublicationStatus(status) || refreshedFor.current === publicationId) return
    refreshedFor.current = publicationId
    void queryClient.invalidateQueries({ queryKey: controlPlaneKeys.proposals(analysisRunId) })
    void queryClient.invalidateQueries({ queryKey: controlPlaneKeys.run(analysisRunId) })
  }, [analysisRunId, publicationId, status, queryClient])
}

export function useRepositoryBinding(projectId: string) {
  return useQuery({
    queryKey: controlPlaneKeys.binding(projectId),
    queryFn: () => getRepositoryBinding(projectId),
    enabled: Boolean(projectId),
  })
}

export function useGitHubUserRepositories(githubProviderToken: string | null, project: Project | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: controlPlaneKeys.githubRepositories(project?.id ?? '', userId ?? null),
    queryFn: () => listGitHubUserRepositories(githubProviderToken as string, project!.workspace.id, project!.id),
    enabled: Boolean(githubProviderToken && project),
  })
}

export function useVerifyGitHubAppAccess(projectId: string, githubProviderToken: string | null) {
  return useMutation({ mutationFn: (input: VerifyGitHubAppAccessRequest) => verifyGitHubAppAccess(input, projectId, githubProviderToken) })
}

export function useGitHubAppInfo(enabled = true) {
  return useQuery({
    queryKey: controlPlaneKeys.githubApp,
    queryFn: getGitHubAppInfo,
    enabled: enabled && !isMockDataSource(),
    staleTime: 60_000,
  })
}

/** Estado de acceso y URL de configuración de la GitHub App para un repositorio ya vinculado (REVOKED, o Reactivar rechazado por falta de acceso). */
export function useGitHubAppAccessInfo(
  projectId: string,
  repository: { repositoryId: string; repositoryName: string } | null,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: controlPlaneKeys.githubAppAccess(projectId, repository?.repositoryId ?? '', userId ?? null),
    queryFn: () => getGitHubAppAccess({ repositoryId: repository!.repositoryId, repositoryName: repository!.repositoryName }, projectId),
    enabled: Boolean(repository),
    // La verificación directa se limita a una consulta reciente y no se repite al enfocar la ventana.
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  })
}

export function useGitHubRepositoryBranches(projectId: string, repositoryName: string | null, userId: string | undefined) {
  const [owner = '', repo = ''] = repositoryName?.split('/') ?? []
  return useQuery({
    queryKey: controlPlaneKeys.githubBranches(projectId, repositoryName ?? '', userId ?? null),
    queryFn: () => listGitHubRepositoryBranches(owner, repo, projectId),
    enabled: Boolean(owner && repo),
  })
}

/**
 * Códigos de error que indican que la pantalla quedó desfasada respecto del servidor: se relee el binding para mostrar lo real.
 * `PROJECT_NOT_FOUND` (Project borrado o ajeno) hace que la lectura devuelva 404 y la pantalla muestre "el Project ya no existe";
 * `REPOSITORY_BINDING_ALREADY_EXISTS` muestra el binding que otro cliente creó; `REPOSITORY_BINDING_NOT_FOUND` vuelve al flujo de vincular.
 */
const STALE_BINDING_ERROR_CODES = ['PROJECT_NOT_FOUND', 'REPOSITORY_BINDING_ALREADY_EXISTS', 'REPOSITORY_BINDING_NOT_FOUND']

function refreshBindingOnStaleError(queryClient: QueryClient, projectId: string, error: unknown) {
  if (error instanceof ApiError && error.code && STALE_BINDING_ERROR_CODES.includes(error.code))
    void queryClient.invalidateQueries({ queryKey: controlPlaneKeys.binding(projectId) })
}

export function useCreateRepositoryBinding(projectId: string, githubProviderToken: string | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRepositoryBindingRequest) => createRepositoryBinding(projectId, input, githubProviderToken),
    onSuccess: (binding) => queryClient.setQueryData(controlPlaneKeys.binding(projectId), binding),
    onError: (error) => refreshBindingOnStaleError(queryClient, projectId, error),
  })
}

export function useAnalysisRuns(projectId?: string, status?: AnalysisRunStatus, enabled = true) {
  return useQuery({
    queryKey: controlPlaneKeys.runs(projectId, status),
    queryFn: () => listAnalysisRuns(projectId, status),
    enabled,
  })
}

/** Todos los Analysis Runs globales para aplicar el workspace sobre el listado completo. */
export function useAllAnalysisRuns(enabled = true) {
  return useQuery({
    queryKey: controlPlaneKeys.allRuns,
    queryFn: listAllAnalysisRuns,
    enabled,
  })
}

export function useAnalysisRun(analysisRunId: string) {
  return useQuery({
    queryKey: controlPlaneKeys.run(analysisRunId),
    queryFn: () => getAnalysisRun(analysisRunId),
    enabled: Boolean(analysisRunId),
  })
}

/**
 * HU15 / INTEROP-2.7 §6.16: mientras el Run está en `QUEUED`/`PROCESSING` la traza responde `409 EVIDENCE_NOT_FINISHED`;
 * se reintenta por polling y se detiene con cualquier otro resultado (éxito, 404, error o contrato pendiente).
 */
export function useAnalysisRunTrace(analysisRunId: string) {
  return useQuery({
    queryKey: controlPlaneKeys.trace(analysisRunId),
    queryFn: () => getAnalysisRunTrace(analysisRunId),
    enabled: Boolean(analysisRunId),
    retry: shouldRetryOperationalTrace,
    refetchInterval: (query) => (isTraceNotFinished(query.state.error) ? pollDelayMs() : false),
  })
}

export function useTestProposals(analysisRunId: string) {
  return useQuery({
    queryKey: controlPlaneKeys.proposals(analysisRunId),
    queryFn: () => listTestProposals(analysisRunId),
    enabled: Boolean(analysisRunId),
  })
}

export function useDisconnectRepository(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => disconnectRepository(projectId),
    // Core deja el binding en `DISABLED` (pausa reversible), no lo borra: se relee en vez de fijar `null`.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: controlPlaneKeys.binding(projectId) }),
    onError: (error) => refreshBindingOnStaleError(queryClient, projectId, error),
  })
}

/** HU57 (INTEROP-2.3, implementado en Core — CS-20260920-003): reactiva el binding (`.../integrations/github/enable`). */
export function useEnableRepository(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => enableRepository(projectId),
    onSuccess: (binding) => queryClient.setQueryData(controlPlaneKeys.binding(projectId), binding),
    // `GITHUB_APP_ACCESS_REQUIRED` no entra aquí: el binding no cambia y la pantalla ofrece la configureUrl.
    onError: (error) => refreshBindingOnStaleError(queryClient, projectId, error),
  })
}

export function usePublishTests(analysisRunId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTestPublicationRequest) => createTestPublication(analysisRunId, input),
    // El POST solo acepta la publicación (202 PENDING): propuestas y Run se invalidan al llegar a terminal (ver useRefreshOnPublicationTerminal).
    onError: (error) => {
      // 409/422 de dominio: las propuestas o el Run cambiaron; se relee para mostrar lo real.
      if (
        error instanceof ApiError &&
        (error.code === 'TEST_PUBLICATION_PROPOSAL_NOT_AVAILABLE' || error.code === 'TEST_PUBLICATION_INVALID_RUN_STATUS')
      ) {
        void queryClient.invalidateQueries({ queryKey: controlPlaneKeys.proposals(analysisRunId) })
        void queryClient.invalidateQueries({ queryKey: controlPlaneKeys.run(analysisRunId) })
      }
    },
  })
}
