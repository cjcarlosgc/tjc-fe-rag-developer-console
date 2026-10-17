import { ApiError, apiRequestTo } from '../api/client'
import type {
  GitHubAppAccessResponse,
  GitHubRepositoryBranchesResponse,
  GitHubUserRepositoryPage,
  VerifyGitHubAppAccessRequest,
} from './types'

export function getGitHubAppInfo(): Promise<GitHubAppAccessResponse['app']> {
  return request('/v1/github/app')
}

export function listGitHubUserRepositories(projectId: string, providerToken: string): Promise<GitHubUserRepositoryPage> {
  const query = new URLSearchParams({ projectId })
  return request(`/v1/github/repositories?${query.toString()}`, providerToken)
}

export function verifyGitHubAppAccess(
  projectId: string,
  input: VerifyGitHubAppAccessRequest,
  providerToken?: string,
  integrationBranch?: string,
): Promise<GitHubAppAccessResponse> {
  if (integrationBranch && !providerToken) {
    throw new ApiError('Renueva tu acceso a GitHub para vincular el repositorio.', 401, undefined, 'GITHUB_ACCOUNT_REQUIRED')
  }
  return request('/v1/github/repositories/verify-access', providerToken, {
    method: 'POST',
    body: JSON.stringify({ projectId, ...input, ...(integrationBranch ? { integrationBranch } : {}) }),
  })
}

export function listGitHubRepositoryBranches(
  projectId: string,
  owner: string,
  repo: string,
): Promise<GitHubRepositoryBranchesResponse> {
  const query = new URLSearchParams({ projectId })
  return request(`/v1/github/repositories/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branches?${query.toString()}`)
}

function request<T>(path: string, providerToken?: string, init?: RequestInit): Promise<T> {
  const baseUrl = validateBaseUrl(import.meta.env.VITE_GITHUB_INTEGRATION_API_URL ?? '')
  if (providerToken !== undefined && (!providerToken.trim() || /\s/.test(providerToken))) {
    throw new ApiError('Renueva tu acceso a GitHub para continuar.', 401, undefined, 'GITHUB_ACCOUNT_REQUIRED')
  }
  return apiRequestTo<T>(baseUrl, path, {
    ...init,
    redirect: 'error',
    headers: {
      ...(providerToken ? { 'X-GitHub-Provider-Token': providerToken } : {}),
      ...init?.headers,
    },
  })
}

function validateBaseUrl(value: string): string {
  try {
    const url = new URL(value)
    const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
    const secureOrigin = url.protocol === 'https:' || (!import.meta.env.PROD && url.protocol === 'http:' && loopback)
    if (!secureOrigin ||
      url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('invalid origin')
    return url.origin
  } catch {
    throw new ApiError('La URL de GitHub Integration no está configurada correctamente.', 503, undefined, 'CORE_AUTHORIZATION_UNAVAILABLE')
  }
}
