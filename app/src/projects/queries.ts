import { useCallback } from 'react'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { actionRequiredKeys } from '../action-required/queries'
import { ApiError } from '../api/client'
import { controlPlaneKeys } from '../control-plane/queries'
import { isExperimentCaptureStale } from '../control-plane/errors'
import {
  armExperimentCapture,
  createProject,
  deleteProject,
  disarmExperimentCapture,
  getProject,
  listAllProjects,
  listExperimentCaptures,
  listProjects,
  listWorkspaces,
  renameProject,
} from './api'
import type { ExperimentCapturePage, ExperimentCaptureResponse } from './types'

export const projectKeys = {
  all: ['projects'] as const,
  lists: ['projects', 'list'] as const,
  list: (workspaceId: string | null) => ['projects', 'list', workspaceId] as const,
  listsAll: ['projects', 'list-all'] as const,
  listAll: (workspaceId: string | null) => ['projects', 'list-all', workspaceId] as const,
  detail: (id: string) => ['projects', id] as const,
  /** INTEROP-2.25: dentro de `detail`, así `usePurgeProjectQueries` la limpia con el resto del Project. */
  experimentCaptures: (id: string) => ['projects', id, 'experiment-captures'] as const,
}

/** Cuántas capturas recientes se piden: el estado sale de la primera; las demás solo sirven para mostrar la última reservada. */
const EXPERIMENT_CAPTURE_PAGE_SIZE = 5

export const workspaceKeys = { all: ['workspaces'] as const }

export function useWorkspaces() {
  return useQuery({ queryKey: workspaceKeys.all, queryFn: listWorkspaces, staleTime: 60_000 })
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: Boolean(projectId),
  })
}

export function useProjects(workspaceId: string | null, enabled = true) {
  return useInfiniteQuery({
    queryKey: projectKeys.list(workspaceId),
    queryFn: ({ pageParam }) => listProjects(workspaceId!, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: enabled && Boolean(workspaceId),
  })
}

/** Todos los Projects visibles para filtrar y calcular KPIs sin depender de las tarjetas cargadas. */
export function useAllProjects(workspaceId: string | null, enabled = true) {
  return useQuery({
    queryKey: projectKeys.listAll(workspaceId),
    queryFn: () => listAllProjects(workspaceId!),
    enabled: enabled && Boolean(workspaceId),
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

export function useRenameProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ projectId, input }: { projectId: string; input: { name: string } }) => renameProject(projectId, input),
    onSuccess: (project) => {
      queryClient.setQueryData(projectKeys.detail(project.id), project)
      void queryClient.invalidateQueries({ queryKey: projectKeys.all })
    },
  })
}

/**
 * HU56 (INTEROP-2.3, implementado en Core — CS-20260920-003): borrado lógico. Aquí solo se marcan como vencidos los agregados (lista, Runs globales,
 * Action Required), sin refetch inmediato: el detalle del Project sigue montado hasta que la página navega y un refetch daría 404 visible.
 * La limpieza de lo propio del Project va aparte (`usePurgeProjectQueries`) y se ejecuta cuando la página ya se desmontó.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProject,
    onSuccess: () => {
      // No invalidar ['projects', projectId] mientras el detalle aún monta: provocaría un GET tras el DELETE y un 404 transitorio antes de navegar.
      void queryClient.invalidateQueries({ queryKey: projectKeys.lists })
      void queryClient.invalidateQueries({ queryKey: projectKeys.listsAll })
      void queryClient.invalidateQueries({ queryKey: ['control-plane', 'runs'], refetchType: 'none' })
      void queryClient.invalidateQueries({ queryKey: ['action-required', 'list'], refetchType: 'none' })
    },
  })
}

/** Quita del caché todo lo propio de un Project ya borrado. Llamar después de navegar fuera, no mientras sus páginas siguen montadas. */
export function usePurgeProjectQueries() {
  const queryClient = useQueryClient()
  return useCallback(
    (projectId: string) => {
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) }) // incluye ['projects', id, 'analysis-history']
      queryClient.removeQueries({ queryKey: controlPlaneKeys.binding(projectId) })
      queryClient.removeQueries({ queryKey: ['control-plane', 'runs', projectId] })
      queryClient.removeQueries({ queryKey: actionRequiredKeys.list(projectId) })
      queryClient.removeQueries({ queryKey: ['action-required', 'functional-knowledge', projectId] })
    },
    [queryClient],
  )
}

/**
 * INTEROP-2.25 (§6.17, HU18): capturas del Project, más reciente primero. Un 4xx no se reintenta (p. ej. Core sin esta ruta: 404).
 * Solo lectura; no entra en realtime ni en polling. Su fallo no bloquea el resto del Project.
 */
export function useExperimentCaptures(projectId: string) {
  return useQuery({
    queryKey: projectKeys.experimentCaptures(projectId),
    queryFn: () => listExperimentCaptures(projectId, null, EXPERIMENT_CAPTURE_PAGE_SIZE),
    enabled: Boolean(projectId),
    retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 1,
  })
}

/** Pone `capture` al frente de la lista (o sustituye la que tenga su mismo id) sin esperar al refetch. */
function upsertExperimentCapture(
  page: ExperimentCapturePage | undefined,
  capture: ExperimentCaptureResponse,
): ExperimentCapturePage | undefined {
  if (!page) return page
  return { ...page, items: [capture, ...page.items.filter((item) => item.captureId !== capture.captureId)] }
}

/** INTEROP-2.25: armar. Tras éxito muestra la captura `ARMED`; tras 409 relee la lista para mostrar el estado real. */
export function useArmExperimentCapture(projectId: string) {
  const queryClient = useQueryClient()
  const key = projectKeys.experimentCaptures(projectId)
  return useMutation({
    mutationFn: () => armExperimentCapture(projectId),
    onSuccess: (capture) => {
      queryClient.setQueryData<ExperimentCapturePage>(key, (page) => upsertExperimentCapture(page, capture))
      void queryClient.invalidateQueries({ queryKey: key })
    },
    onError: (error) => {
      if (isExperimentCaptureStale(error)) void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}

/** INTEROP-2.25: desarmar. Tras éxito la captura pasa a `DISARMED`; tras 404 relee la lista para mostrar el estado real. */
export function useDisarmExperimentCapture(projectId: string) {
  const queryClient = useQueryClient()
  const key = projectKeys.experimentCaptures(projectId)
  return useMutation({
    mutationFn: () => disarmExperimentCapture(projectId),
    onSuccess: (capture) => {
      queryClient.setQueryData<ExperimentCapturePage>(key, (page) => upsertExperimentCapture(page, capture))
      void queryClient.invalidateQueries({ queryKey: key })
    },
    onError: (error) => {
      if (isExperimentCaptureStale(error)) void queryClient.invalidateQueries({ queryKey: key })
    },
  })
}
