import { useState } from 'react'
import { hasRole } from '../projects/roles'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useParams, useSearchParams } from 'react-router-dom'
import { createIdempotencyKey } from '../api/idempotency'
import { isMockDataSource } from '../api/dataSource'
import { DEMO_EXPERIMENT_SELECTOR_OPTIONS } from '../api/mockBackend'
import { toInventoryTargets } from '../inventory/api'
import { useTestInventory } from '../inventory/queries'
import { useProject } from '../projects/queries'
import { useAnalysisRun } from '../control-plane/queries'
import { findEligibleSymbols } from '../run-comparison/types'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState, LoadingState } from '../ui/Feedback'
import { buildCreateExperimentInput, getExperiment, startExperiment, type CreateExperimentInput } from './api'
import { ExperimentComparison } from './ExperimentComparison'
import { ExperimentConditionsNote } from './ExperimentConditionsNote'
import { CaptureNextPrPanel } from '../run-comparison/CaptureNextPrPanel'
import { bindingErrorMessage, errorCorrelationId, isLlmProviderUnavailable } from '../control-plane/errors'
import { experimentFailureMessage, experimentFailureTitle } from './failureMessages'
import { EvidenceDownload } from '../evidence/EvidenceDownload'

export function ExperimentPage() {
  const { projectId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const analysisRunId = searchParams.get('analysisRunId') ?? ''
  const [targetId, setTargetId] = useState('')
  const [experimentId, setExperimentId] = useState<string | null>(null)
  const [submittedLabel, setSubmittedLabel] = useState('target')
  const projectQuery = useProject(projectId)
  const canCreateExperiment = hasRole(projectQuery.data?.role, 'WRITER')
  const versionId = projectQuery.data?.currentVersionId ?? null
  const inventoryQuery = useTestInventory(versionId)
  const runQuery = useAnalysisRun(analysisRunId)
  const isMock = isMockDataSource()
  const targets = inventoryQuery.data ? toInventoryTargets(inventoryQuery.data).filter((target) => target.kind !== 'CLASS') : []
  // DEMO · solo con mock: escenarios y errores de creación de B1 (WI-CONSOLE-021, corte B2). Con live no se añaden.
  type ExperimentOption = { id: string; label: string; name: string; input: CreateExperimentInput }
  // DEMO conserva sus escenarios propios. En live, la selección siempre proviene de símbolos elegibles del Run publicado.
  const eligibleRunSymbols = runQuery.data ? findEligibleSymbols(runQuery.data.symbols) : []
  const selectable: ExperimentOption[] = isMock
    ? [
        ...targets.map((target) => ({ id: target.id, label: `${target.methodName ?? target.symbolName} · ${target.kind}`, name: target.methodName ?? target.symbolName ?? 'target', input: { analysisRunId: projectId, symbolFilePath: target.id, symbolQualifiedName: target.id } })),
        ...DEMO_EXPERIMENT_SELECTOR_OPTIONS.map((option) => ({ ...option, name: option.label, input: { analysisRunId: projectId, symbolFilePath: option.id, symbolQualifiedName: option.id } })),
      ]
    : eligibleRunSymbols.map((symbol) => ({
        id: `${analysisRunId}:${symbol.filePath}:${symbol.qualifiedName}`,
        label: `Run ${analysisRunId} · ${symbol.qualifiedName} · ${symbol.filePath}`,
        name: symbol.qualifiedName,
        input: buildCreateExperimentInput(analysisRunId, symbol),
      }))
  const selectedTarget = selectable.find((option) => option.id === targetId) ?? selectable[0]
  const liveRunEligibilityMessage = isMock
    ? null
    : !analysisRunId
      ? 'Abre esta comparación desde un Analysis Run vigente con un método o función cambiado directamente.'
      : runQuery.data?.status === 'OBSOLETE'
        ? 'Este Run quedó obsoleto por un HEAD nuevo. Abre el Analysis Run vigente del PR para comparar.'
        : runQuery.data?.status === 'ACTION_REQUIRED'
          ? 'Responde primero las preguntas funcionales pendientes de este Run para habilitar la comparación.'
          : runQuery.data && (runQuery.data.status === 'QUEUED' || runQuery.data.status === 'PROCESSING')
            ? 'Espera a que termine el análisis para que el Run tenga contexto suficiente para comparar.'
            : analysisRunId && runQuery.data && !eligibleRunSymbols.length
              ? 'Este Run no tiene un símbolo METHOD o FUNCTION con cambio DIRECTLY_CHANGED. Abre un Run que sí tenga uno para comparar.'
              : null
  const canStartFromRun = isMock || (!liveRunEligibilityMessage && Boolean(selectedTarget))
  const startMutation = useMutation({
    mutationFn: () => startExperiment(selectedTarget!.input, createIdempotencyKey()),
    onSuccess: (accepted) => {
      setSubmittedLabel(selectedTarget?.name ?? 'target')
      setExperimentId(accepted.experimentId)
    },
  })
  const experimentQuery = useQuery({ queryKey: ['experiments', experimentId], queryFn: () => getExperiment(experimentId!, submittedLabel), enabled: Boolean(experimentId), refetchInterval: (query) => query.state.data?.status === 'COMPLETED' || query.state.data?.status === 'FAILED' ? false : import.meta.env.MODE === 'test' ? 10 : 560 })

  if (projectQuery.isPending || inventoryQuery.isPending || (!isMock && analysisRunId && runQuery.isPending)) return <LoadingState label="Preparando laboratorio…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />
  if (inventoryQuery.isError) return <ErrorState message={inventoryQuery.error.message} onRetry={() => void inventoryQuery.refetch()} />
  if (analysisRunId && runQuery.isError) return <ErrorState message={runQuery.error.message} onRetry={() => void runQuery.refetch()} />

  const operation = experimentQuery.data
  return <section><Breadcrumbs items={[{ label: 'Proyectos', to: `/?workspaceId=${encodeURIComponent(projectQuery.data.workspace.id)}` }, { label: projectQuery.data.name, to: `/projects/${projectId}?workspaceId=${encodeURIComponent(projectQuery.data.workspace.id)}` }, { label: 'Modo experimental' }]} /><div className="experimental-heading"><div><span className="experimental-label">Modo experimental</span><h1>RAG <i>vs</i> Agente generalista</h1><p>Compara la recuperación RAG con un agente que explora el código y reúne sus propias referencias.</p></div><div className="repeat-stamp"><strong>3×</strong><span>repeticiones<br />por estrategia</span></div></div><ExperimentConditionsNote />{canCreateExperiment && <CaptureNextPrPanel projectId={projectId} />}<div className="lab-boundary"><div><p className="eyebrow">Única capacidad V1</p><h2>Comparar RAG vs Agente generalista</h2><p>Selecciona un target. Autorepair está excluido para ambas estrategias.</p>{canCreateExperiment ? liveRunEligibilityMessage ? <p className="empty-inline-note" role="status">{liveRunEligibilityMessage}</p> : <><div className="field experiment-field"><label htmlFor="experiment-target">Target experimental</label><select id="experiment-target" value={selectedTarget?.id ?? ''} onChange={(event) => setTargetId(event.target.value)}>{selectable.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select></div><button className="button primary" disabled={!canStartFromRun || startMutation.isPending || Boolean(experimentId)} onClick={() => startMutation.mutate()}>{startMutation.isPending ? 'Creando comparación…' : 'Ejecutar comparación'}</button></> : <p className="empty-inline-note">Tu rol es de solo lectura; un Writer, Maintainer o Admin puede crear experimentos.</p>}</div><div className={`contract-note ${isMock ? 'success-note' : ''}`}><span className="contract-glyph">{isMock ? 'DEMO' : 'API'}</span><div><strong>{isMock ? 'Laboratorio simulado' : 'Ejecución live'}</strong><p>{isMock ? 'Las métricas son narrativas para demostrar el flujo; no constituyen evidencia de tesis.' : 'Cada repetición se ejecuta de verdad en RAG Core y en el Sandbox; puede tardar varios minutos.'}</p></div></div></div>{startMutation.isError && <div className="structured-error" role="alert"><strong>No se pudo iniciar el experimento</strong><p>{bindingErrorMessage(startMutation.error)}{errorCorrelationId(startMutation.error) && <> · Correlation ID: <code>{errorCorrelationId(startMutation.error)}</code></>}</p>{isLlmProviderUnavailable(startMutation.error) && <button className="button" disabled={startMutation.isPending} onClick={() => startMutation.mutate()}>Reintentar</button>}</div>}{experimentId && operation?.status === 'FAILED' && <div className="structured-error" role="alert"><strong>{experimentFailureTitle()}</strong><p>{experimentFailureMessage(operation.failureCode)}</p>{operation.failureMessage && <p>Detalle: {operation.failureMessage}</p>}{isMock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}</div>}{experimentId && (!operation || operation.status !== 'COMPLETED') && operation?.status !== 'FAILED' && <div className="experiment-progress" role="status"><div><span className="live-indicator" /><strong>{operation?.status === 'RUNNING' ? 'Ejecutando estrategias pareadas' : 'Preparando experimento'}</strong><p>Experiment <code>{experimentId}</code></p></div><span>{operation?.progress ?? 0}%</span><i><b style={{ width: `${operation?.progress ?? 0}%` }} /></i></div>}{operation?.status === 'COMPLETED' && operation.result && <><div className="flow-connector" aria-hidden="true"><span>RESULT</span><i /></div><ExperimentComparison result={operation.result} projectId={projectId} experimentId={experimentId ?? ''} /></>}{experimentId && (operation?.status === 'COMPLETED' || operation?.status === 'FAILED') && <div className="panel evidence-panel"><div className="section-heading"><div><h2>Evidencia versionada</h2><p>Descarga el paquete técnico de este experimento tal como lo devuelve Core.</p></div></div><EvidenceDownload kind="EXPERIMENT" subjectId={experimentId} terminal /></div>}</section>
}
