import type { GitHubUserRepositoryResponse } from './types'

/**
 * Demo-only: simula la respuesta de `GET /integrations/github/repositories` (discovery
 * user-centric, INTEROP-2.2 §6.8) — los repositorios visibles del usuario autenticado vía OAuth,
 * no los que la GitHub App puede automatizar (eso lo resuelve `mockVerifyGitHubAppAccess` aparte).
 * `repo_checkout`/`repo_billing` ya tienen binding en el seed de `mockBackend.ts`.
 * `repo_notifications` está `AUTHORIZED` desde la primera verificación (camino feliz corto).
 * `repo_playground` empieza `NOT_AUTHORIZED` y pasa a `AUTHORIZED` recién en la segunda
 * verificación, para demostrar el CTA de configuración + "Revalidar".
 */
export const DEMO_GITHUB_REPOSITORIES: GitHubUserRepositoryResponse[] = [
  {
    repositoryId: 'repo_checkout', name: 'checkout-service', repositoryName: 'acme/checkout-service',
    owner: { login: 'acme', type: 'Organization', avatarUrl: null }, private: true, defaultBranch: 'main',
    permissions: { admin: false, maintain: true, push: true, pull: true },
  },
  {
    repositoryId: 'repo_billing', name: 'billing-engine', repositoryName: 'acme/billing-engine',
    owner: { login: 'acme', type: 'Organization', avatarUrl: null }, private: true, defaultBranch: 'main',
    permissions: { admin: false, maintain: true, push: true, pull: true },
  },
  {
    repositoryId: 'repo_notifications', name: 'notifications-service', repositoryName: 'acme/notifications-service',
    owner: { login: 'acme', type: 'Organization', avatarUrl: null }, private: false, defaultBranch: 'main',
    permissions: { admin: true, maintain: true, push: true, pull: true },
  },
  {
    repositoryId: 'repo_playground', name: 'integration-playground', repositoryName: 'demo-user/integration-playground',
    owner: { login: 'demo-user', type: 'User', avatarUrl: null }, private: false, defaultBranch: 'main',
    permissions: { admin: true, maintain: true, push: true, pull: true },
  },
]
