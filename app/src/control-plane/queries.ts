import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRepositoryBinding,
  createTestPublication,
  disconnectRepository,
  getAnalysisRun,
  getRepositoryBinding,
  listAnalysisRuns,
  listGitHubRepositoryBranches,
  listGitHubUserRepositories,
  listTestProposals,
  verifyGitHubAppAccess,
} from './api'
import type { AnalysisRunStatus, CreateRepositoryBindingRequest, CreateTestPublicationRequest, VerifyGitHubAppAccessRequest } from './types'

export const controlPlaneKeys = {
  binding: (projectId: string) => ['control-plane', 'binding', projectId] as const,
  githubRepositories: () => ['control-plane', 'github-repositories'] as const,
  githubBranches: (repositoryName: string) => ['control-plane', 'github-branches', repositoryName] as const,
  runs: (projectId?: string, status?: AnalysisRunStatus) => ['control-plane', 'runs', projectId ?? null, status ?? null] as const,
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

export function useGitHubUserRepositories(githubProviderToken: string | null) {
  return useQuery({
    queryKey: controlPlaneKeys.githubRepositories(),
    queryFn: () => listGitHubUserRepositories(githubProviderToken as string),
    enabled: Boolean(githubProviderToken),
  })
}

export function useVerifyGitHubAppAccess() {
  return useMutation({ mutationFn: (input: VerifyGitHubAppAccessRequest) => verifyGitHubAppAccess(input) })
}

export function useGitHubRepositoryBranches(repositoryName: string | null) {
  const [owner = '', repo = ''] = repositoryName?.split('/') ?? []
  return useQuery({
    queryKey: controlPlaneKeys.githubBranches(repositoryName ?? ''),
    queryFn: () => listGitHubRepositoryBranches(owner, repo),
    enabled: Boolean(owner && repo),
  })
}

export function useCreateRepositoryBinding(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRepositoryBindingRequest) => createRepositoryBinding(projectId, input),
    onSuccess: (binding) => queryClient.setQueryData(controlPlaneKeys.binding(projectId), binding),
  })
}

export function useAnalysisRuns(projectId?: string, status?: AnalysisRunStatus) {
  return useQuery({
    queryKey: controlPlaneKeys.runs(projectId, status),
    queryFn: () => listAnalysisRuns(projectId, status),
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
    onSuccess: () => queryClient.setQueryData(controlPlaneKeys.binding(projectId), null),
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
