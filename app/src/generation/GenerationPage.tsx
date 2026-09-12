import { useMutation } from '@tanstack/react-query'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createIdempotencyKey } from '../api/idempotency'
import { isMockDataSource } from '../api/dataSource'
import { toInventoryTargets } from '../inventory/api'
import { useTestInventory } from '../inventory/queries'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { OrbitalIcon } from '../ui/Loaders'
import { startGeneration } from './api'
import { GenerationConfigurator } from './GenerationConfigurator'
import type { GenerationConfiguration } from './types'

export function GenerationPage() {
  const { projectId = '' } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetId = searchParams.get('targetId')
  const projectQuery = useProject(projectId)
  const projectVersionId = projectQuery.data?.currentVersionId ?? null
  const inventoryQuery = useTestInventory(projectVersionId, Boolean(targetId))
  const target = inventoryQuery.data ? toInventoryTargets(inventoryQuery.data).find((item) => item.id === targetId) : undefined
  const generationMutation = useMutation({
    // Cada confirmación explícita del usuario es una acción lógica nueva: se genera una
    // key por invocación de mutate(), no una compartida entre distintos envíos.
    mutationFn: (configuration: GenerationConfiguration) => startGeneration(configuration, createIdempotencyKey()),
    onSuccess: (accepted) => navigate(`/projects/${accepted.projectId}/runs/${accepted.runId}`),
  })

  if (projectQuery.isPending || (targetId && inventoryQuery.isPending)) return <LoadingState label="Preparando configuración…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />
  if (targetId && inventoryQuery.isError) return <ErrorState message={inventoryQuery.error.message} onRetry={() => void inventoryQuery.refetch()} />

  return <section><Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: projectQuery.data.name, to: `/projects/${projectId}` }, { label: 'Configurar generación' }]} /><div className="page-heading"><div><p className="eyebrow">Test generation</p><h1>Diseñar ejecución</h1><p>Define el alcance; el servicio resolverá retrieval, generación y validación.</p></div>{isMockDataSource() && <span className="demo-stamp">SIMULATED RUN</span>}</div>{targetId && !target && <div className="structured-error" role="alert"><strong>Target no disponible</strong><p>El target seleccionado ya no pertenece a la ProjectVersion actual.</p></div>}{generationMutation.isPending && <div className="contract-note success-note" role="status"><OrbitalIcon /><div><strong>Creando run</strong><p>Preparando targets y contexto RAG para la demostración…</p></div></div>}{generationMutation.isError && <div className="structured-error" role="alert"><strong>No se pudo crear el run</strong><p>{generationMutation.error.message}</p></div>}<GenerationConfigurator projectId={projectId} target={target} onConfirm={(configuration) => generationMutation.mutate(configuration)} /></section>
}
