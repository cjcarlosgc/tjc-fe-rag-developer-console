import { useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actionRequiredKeys } from '../action-required/queries'
import { controlPlaneKeys } from '../control-plane/queries'
import { createProject, deleteProject, getProject, listProjects } from './api'

export const projectKeys = {
  all: ['projects'] as const,
  detail: (id: string) => ['projects', id] as const,
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProject(projectId),
  })
}

export function useProjects(enabled = true) {
  return useInfiniteQuery({
    queryKey: projectKeys.all,
    queryFn: ({ pageParam }) => listProjects(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(project.id), project)
      void queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

/**
 * HU56 (INTEROP-2.3, implementado en Core — CS-20260920-003): borrado lógico. Aquí solo se marcan como vencidos los agregados (lista, Runs globales,
 * Action Required), sin refetch inmediato: el detalle del proyecto sigue montado hasta que la página navega y un refetch daría 404 visible.
 * La limpieza de lo propio del proyecto va aparte (`usePurgeProjectQueries`) y se ejecuta cuando la página ya se desmontó.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: projectKeys.all, exact: true })
      void queryClient.invalidateQueries({ queryKey: ['control-plane', 'runs'], refetchType: 'none' })
      void queryClient.invalidateQueries({ queryKey: ['action-required', 'list'], refetchType: 'none' })
    },
  })
}

/** Quita del caché todo lo propio de un Project ya borrado. Llamar después de navegar fuera, no mientras sus páginas siguen montadas. */
export function usePurgeProjectQueries() {
  const queryClient = useQueryClient()
  return useCallback((projectId: string) => {
    queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) }) // incluye ['projects', id, 'analysis-history']
    queryClient.removeQueries({ queryKey: controlPlaneKeys.binding(projectId) })
    queryClient.removeQueries({ queryKey: ['control-plane', 'runs', projectId] })
    queryClient.removeQueries({ queryKey: actionRequiredKeys.list(projectId) })
    queryClient.removeQueries({ queryKey: ['action-required', 'functional-knowledge', projectId] })
  }, [queryClient])
}
