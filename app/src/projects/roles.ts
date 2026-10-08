import type { ProjectRole } from './types'

/** Orden de la jerarquía de roles de Project: READER < WRITER < MAINTAINER < ADMIN. */
const PROJECT_ROLE_RANK: Record<ProjectRole, number> = {
  READER: 0,
  WRITER: 1,
  MAINTAINER: 2,
  ADMIN: 3,
}

/** Devuelve true si `role` alcanza el rol mínimo `min`. Helper único para comprobaciones de rol de Project. */
export function hasRole(role: ProjectRole | null | undefined, min: ProjectRole): boolean {
  if (!role) return false
  return PROJECT_ROLE_RANK[role] >= PROJECT_ROLE_RANK[min]
}
