import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/client'
import type { WorkspaceRef } from '../projects/types'
import {
  createRepositoryBinding,
  createTestPublication,
  disconnectRepository,
  enableRepository,
  getAnalysisRun,
  getGitHubAppAccess,
  getRepositoryBinding,
  listAnalysisRuns,
  listAllAnalysisRuns,
  listGitHubRepositoryBranches,
  listGitHubUserRepositories,
  listTestProposals,
  verifyGitHubAppAccess,
} from './api'
import type { AnalysisRunStatus, CreateRepositoryBindingRequest, CreateTestPublicationRequest, VerifyGitHubAppAccessRequest } from './types'

export const controlPlaneKeys = {
  binding: (projectId: string) => ['control-plane', 'binding', projectId] as const,
  githubRepositories: (workspaceId: string) => ['control-plane', 'github-repositories', workspaceId] as const,
  githubAppAccess: (repositoryId: string) => ['control-plane', 'github-app-access', repositoryId] as const,
  githubBranches: (repositoryName: string) => ['control-plane', 'github-branches', repositoryName] as const,
  runs: (projectId?: string, status?: AnalysisRunStatus) => ['control-plane', 'runs', projectId ?? null, status ?? null] as const,
  allRuns: ['control-plane', 'runs', 'all'] as const,
  run: (analysisRunId: string) => ['control-plane', 'run', analysisRunId] as const,
  proposals: (analysisRunId: string) => ['control-plane', 'proposals', analysisRunId] as const,
}

export function useRepositoryBinding(projectId: string) {
  return useQuery({
    queryKey: controlPlaneKeys.binding(projectId),
    queryFn: () => getRepositoryBinding(projectId),
    enabled: Boolean(projectId),
  })
}

export function useGitHubUserRepositories(githubProviderToken: string | null, workspace: WorkspaceRef | null) {
  return useQuery({
    queryKey: controlPlaneKeys.githubRepositories(workspace?.id ?? ''),
    queryFn: () => listGitHubUserRepositories(githubProviderToken as string, workspace!.id),
    enabled: Boolean(githubProviderToken && workspace),
  })
}

export function useVerifyGitHubAppAccess() {
  return useMutation({ mutationFn: (input: VerifyGitHubAppAccessRequest) => verifyGitHubAppAccess(input) })
}

/** Estado de acceso y URL de configuración de la GitHub App para un repositorio ya vinculado (REVOKED, o Reactivar rechazado por falta de acceso). */
export function useGitHubAppAccessInfo(repository: { repositoryId: string; repositoryName: string } | null) {
  return useQuery({
    queryKey: controlPlaneKeys.githubAppAccess(repository?.repositoryId ?? ''),
    queryFn: () => getGitHubAppAccess({ repositoryId: repository!.repositoryId, repositoryName: repository!.repositoryName }),
    enabled: Boolean(repository),
    // Es un POST a Core (verify-app-access): no se repite en cada foco de ventana ni en cada montaje mientras el dato sea reciente.
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  })
}

export function useGitHubRepositoryBranches(repositoryName: string | null) {
  const [owner = '', repo = ''] = repositoryName?.split('/') ?? []
  return useQuery({
    queryKey: controlPlaneKeys.githubBranches(repositoryName ?? ''),
    queryFn: () => listGitHubRepositoryBranches(owner, repo),
    enabled: Boolean(owner && repo),
  })
}

/**
 * Códigos de error que indican que la pantalla quedó desfasada respecto del servidor: se relee el binding para mostrar lo real.
 * `PROJECT_NOT_FOUND` (Project borrado o ajeno) hace que la lectura devuelva 404 y la pantalla muestre "el proyecto ya no existe";
 * `REPOSITORY_BINDING_ALREADY_EXISTS` muestra el binding que otro cliente creó; `REPOSITORY_BINDING_NOT_FOUND` vuelve al flujo de vincular.
 */
const STALE_BINDING_ERROR_CODES = ['PROJECT_NOT_FOUND', 'REPOSITORY_BINDING_ALREADY_EXISTS', 'REPOSITORY_BINDING_NOT_FOUND']

function refreshBindingOnStaleError(queryClient: QueryClient, projectId: string, error: unknown) {
  if (error instanceof ApiError && error.code && STALE_BINDING_ERROR_CODES.includes(error.code)) void queryClient.invalidateQueries({ queryKey: controlPlaneKeys.binding(projectId) })
}

export function useCreateRepositoryBinding(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRepositoryBindingRequest) => createRepositoryBinding(projectId, input),
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
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: controlPlaneKeys.proposals(analysisRunId) })
      void queryClient.invalidateQueries({ queryKey: controlPlaneKeys.run(analysisRunId) })
    },
  })
}
