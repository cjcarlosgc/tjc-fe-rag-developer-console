import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import { toInventoryTargets } from '../inventory/api'
import { useTestInventory } from '../inventory/queries'
import { useProject } from '../projects/queries'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { getExperiment, startExperiment } from './api'
import { ExperimentComparison } from './ExperimentComparison'

export function ExperimentPage() {
  const { projectId = '' } = useParams()
  const [targetId, setTargetId] = useState('')
  const [experimentId, setExperimentId] = useState<string | null>(null)
  const projectQuery = useProject(projectId)
  const versionId = projectQuery.data?.currentVersionId ?? null
  const inventoryQuery = useTestInventory(versionId)
  const targets = inventoryQuery.data ? toInventoryTargets(inventoryQuery.data).filter((target) => target.kind !== 'CLASS') : []
  const selectedTarget = targets.find((target) => target.id === targetId) ?? targets[0]
  const startMutation = useMutation({ mutationFn: () => startExperiment(projectId, selectedTarget?.methodName ?? selectedTarget?.symbolName ?? 'target'), onSuccess: (accepted) => setExperimentId(accepted.experimentId) })
  const experimentQuery = useQuery({ queryKey: ['experiments', experimentId], queryFn: () => getExperiment(experimentId!), enabled: Boolean(experimentId), refetchInterval: (query) => query.state.data?.status === 'COMPLETED' || query.state.data?.status === 'FAILED' ? false : import.meta.env.MODE === 'test' ? 10 : 560 })

  if (projectQuery.isPending || inventoryQuery.isPending) return <LoadingState label="Preparando laboratorio…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />
  if (inventoryQuery.isError) return <ErrorState message={inventoryQuery.error.message} onRetry={() => void inventoryQuery.refetch()} />

  const operation = experimentQuery.data
  return <section><Link className="back-link" to={`/projects/${projectId}`}>← Volver al proyecto</Link><div className="experimental-heading"><div><span className="experimental-label">Modo experimental</span><h1>RAG <i>vs</i> Baseline</h1><p>Compara el efecto del contexto recuperado bajo las mismas condiciones.</p></div><div className="repeat-stamp"><strong>3×</strong><span>repeticiones<br />por estrategia</span></div></div><div className="lab-boundary"><div><p className="eyebrow">Única capacidad V1</p><h2>Comparar RAG vs Baseline</h2><p>Selecciona un target. Autorepair está excluido para ambas estrategias.</p><div className="field experiment-field"><label htmlFor="experiment-target">Target experimental</label><select id="experiment-target" value={selectedTarget?.id ?? ''} onChange={(event) => setTargetId(event.target.value)}>{targets.map((target) => <option value={target.id} key={target.id}>{target.methodName ?? target.symbolName} · {target.kind}</option>)}</select></div><button className="button primary" disabled={!selectedTarget || startMutation.isPending || Boolean(experimentId)} onClick={() => startMutation.mutate()}>{startMutation.isPending ? 'Creando comparación…' : 'Ejecutar comparación'}</button></div><div className={`contract-note ${isMockDataSource() ? 'success-note' : 'pending-note'}`}><span className="contract-glyph">{isMockDataSource() ? 'DEMO' : 'API'}</span><div><strong>{isMockDataSource() ? 'Laboratorio simulado' : 'Ejecución live pendiente de contrato'}</strong><p>{isMockDataSource() ? 'Las métricas son narrativas para demostrar el flujo; no constituyen evidencia de tesis.' : 'RAG Core aún no fijó rutas, DTO o estados del experimento.'}</p></div></div></div>{startMutation.isError && <div className="structured-error" role="alert"><strong>No se pudo iniciar el experimento</strong><p>{startMutation.error.message}</p></div>}{experimentId && (!operation || operation.status !== 'COMPLETED') && <div className="experiment-progress" role="status"><div><span className="live-indicator" /><strong>{operation?.status === 'RUNNING' ? 'Ejecutando estrategias pareadas' : 'Preparando experimento'}</strong><p>Experiment <code>{experimentId}</code></p></div><span>{operation?.progress ?? 0}%</span><i><b style={{ width: `${operation?.progress ?? 0}%` }} /></i></div>}{operation?.status === 'COMPLETED' && operation.result && <><div className="flow-connector" aria-hidden="true"><span>RESULT</span><i /></div><ExperimentComparison result={operation.result} /></>}</section>
}
