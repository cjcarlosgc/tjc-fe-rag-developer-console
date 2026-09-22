import type { GitHubUserRepositoryResponse } from './types'

/**
 * Demo-only: simula la respuesta de `GET /integrations/github/repositories` (discovery
 * user-centric, INTEROP-2.2 §6.8) — los repositorios visibles del usuario autenticado vía OAuth,
 * no los que la GitHub App puede automatizar (eso lo resuelve `mockVerifyGitHubAppAccess` aparte).
 * `repo_checkout`/`repo_billing` ya tienen binding en el seed de `mockBackend.ts`.
 * `repo_notifications` está `AUTHORIZED` desde la primera verificación (camino feliz corto).
 * `repo_playground` empieza `NOT_AUTHORIZED` y pasa a `AUTHORIZED` recién en la segunda
 * verificación, para demostrar el CTA de configuración + "Revalidar".
 * HU64 (DEMO): `repo_legacy_docs` solo tiene permiso de lectura (no vinculable, 403 `REPOSITORY_PERMISSION_INSUFFICIENT`)
 * y `repo_external_tools` pertenece a un propietario ajeno (`DEMO_FOREIGN_OWNER_LOGINS`, 400 `REPOSITORY_OUTSIDE_WORKSPACE`).
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
  {
    repositoryId: 'repo_legacy_docs', name: 'legacy-docs', repositoryName: 'acme/legacy-docs',
    owner: { login: 'acme', type: 'Organization', avatarUrl: null }, private: false, defaultBranch: 'main',
    permissions: { admin: false, maintain: false, push: false, pull: true },
  },
  {
    repositoryId: 'repo_external_tools', name: 'shared-tools', repositoryName: 'external-org/shared-tools',
    owner: { login: 'external-org', type: 'Organization', avatarUrl: null }, private: false, defaultBranch: 'main',
    permissions: { admin: false, maintain: true, push: true, pull: true },
  },
]

/**
 * Mock-only (HU64): el mock no modela workspaces ni la cuenta real del usuario, así que "propietario ajeno" es una lista fija de
 * propietarios demo. `acme` y `demo-user` se consideran propios para no romper los caminos felices existentes.
 */
export const DEMO_FOREIGN_OWNER_LOGINS: ReadonlySet<string> = new Set(['external-org'])
