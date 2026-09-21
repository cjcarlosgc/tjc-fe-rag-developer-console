import type { GitHubUserRepositoryResponse } from './types'

/**
 * HU64 (INTEROP-2.4 §6.8): solo `maintain`, `write` (`push` en el DTO) y `admin` permiten vincular un repositorio;
 * `read`/`triage` (solo `pull`) no. Es una ayuda de UI: el rechazo autoritativo es el `403 REPOSITORY_PERMISSION_INSUFFICIENT` del POST.
 * Sin `permissions` en la respuesta no se presume nada y el repositorio queda elegible.
 */
export function canBindRepository(repo: Pick<GitHubUserRepositoryResponse, 'permissions'>): boolean {
  const permissions = repo.permissions
  return permissions ? permissions.admin || permissions.maintain || permissions.push : true
}
