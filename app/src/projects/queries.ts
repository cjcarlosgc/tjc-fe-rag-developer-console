import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createProject, getProject, listProjects } from './api'

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
  return useQuery({ queryKey: projectKeys.all, queryFn: listProjects, enabled })
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
