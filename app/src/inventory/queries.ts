import { useQuery } from '@tanstack/react-query'
import { getTestInventory } from './api'

export const inventoryKeys = {
  detail: (projectVersionId: string) => ['project-versions', projectVersionId, 'test-inventory'] as const,
}

export function useTestInventory(projectVersionId: string | null, enabled = true) {
  return useQuery({
    queryKey: inventoryKeys.detail(projectVersionId ?? ''),
    queryFn: ({ signal }) => getTestInventory(projectVersionId!, signal),
    enabled: enabled && Boolean(projectVersionId),
  })
}
