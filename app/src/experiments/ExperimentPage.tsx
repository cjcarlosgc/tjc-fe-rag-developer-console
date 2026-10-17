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
import { defaultTarget, isConstructorName, orderConstructorsLast } from './targetOrdering'

export function ExperimentPage() {
  const { projectId = '' } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const analysisRunId = searchParams.get('analysisRunId') ?? ''
  const [targetId, setTargetId] = useState('')
  // WI-CONSOLE-036 B1: el experimento vive en la URL (?experimentId=); al montar con él se reabre sin pulsar el botón.
  const experimentId = searchParams.get('experimentId')
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
  const selectableUnordered: ExperimentOption[] = isMock
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
  // WI-CONSOLE-036 B4: heurística de presentación (ver targetOrdering.ts; la raíz es de Core, backlog #4 / IDEA-024).
  // Los constructores se ordenan al final sin filtrarse; la preselección cae en el primer no-constructor y respeta targetId explícito.
  const selectable = orderConstructorsLast(selectableUnordered, (option) => option.name)
  const selectedTarget = selectable.find((option) => option.id === targetId) ?? defaultTarget(selectable, (option) => option.name)
  const selectedIsConstructor = Boolean(selectedTarget && isConstructorName(selectedTarget.name))
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
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous)
        next.set('experimentId', accepted.experimentId)
        return next
      }, { replace: true })
    },
  })
  // WI-CONSOLE-036 ciclo 3: sin reintento automático; TanStack pausa el reintento mientras el documento no tiene foco y dejaba la pantalla en «Preparando experimento». El usuario reintenta con el botón.
  const experimentQuery = useQuery({ queryKey: ['experiments', experimentId], queryFn: () => getExperiment(experimentId!, submittedLabel), enabled: Boolean(experimentId), retry: false, refetchInterval: (query) => {
    // WI-CONSOLE-036 B3: tras un error no se sondea en bucle; el usuario reintenta con el botón.
    if (query.state.status === 'error') return false
    return query.state.data?.status === 'COMPLETED' || query.state.data?.status === 'FAILED' ? false : import.meta.env.MODE === 'test' ? 10 : 560
  } })

  // WI-CONSOLE-036 B3: una única región role="status" bajo el botón; el texto cambia con el motivo concreto. Vacía cuando el botón está habilitado.
  const runNote = !canCreateExperiment
    ? 'Tu rol es de solo lectura; un Writer, Maintainer o Admin puede crear experimentos.'
    : liveRunEligibilityMessage
      ? liveRunEligibilityMessage
      : startMutation.isPending
        ? 'Creando comparación… espera a que termine antes de volver a pulsar.'
        : experimentId && experimentQuery.isError
          ? 'No se pudo cargar el experimento de la URL; reintenta o inicia otra comparación.'
          : experimentId
          ? 'Esta comparación ya se lanzó: su estado y resultados están abajo. Para lanzar otra, abre el laboratorio sin el id de experimento.'
          : !selectedTarget
            ? 'Selecciona un target experimental para poder comparar.'
            : ''

  if (projectQuery.isPending || inventoryQuery.isPending || (!isMock && analysisRunId && runQuery.isPending)) return <LoadingState label="Preparando laboratorio…" />
  if (projectQuery.isError) return <ErrorState message={projectQuery.error.message} onRetry={() => void projectQuery.refetch()} />
  if (inventoryQuery.isError) return <ErrorState message={inventoryQuery.error.message} onRetry={() => void inventoryQuery.refetch()} />
  if (analysisRunId && runQuery.isError) return <ErrorState message={runQuery.error.message} onRetry={() => void runQuery.refetch()} />

  const operation = experimentQuery.data
  return <section><Breadcrumbs items={[{ label: 'Proyectos', to: `/?workspaceId=${encodeURIComponent(projectQuery.data.workspace.id)}` }, { label: projectQuery.data.name, to: `/projects/${projectId}?workspaceId=${encodeURIComponent(projectQuery.data.workspace.id)}` }, { label: 'Modo experimental' }]} /><div className="experimental-heading"><div><span className="experimental-label">Modo experimental</span><h1>RAG <i>vs</i> Agente generalista</h1><p>Compara la recuperación RAG con un agente que explora el código y reúne sus propias referencias.</p></div><div className="repeat-stamp"><strong>3×</strong><span>repeticiones<br />por estrategia</span></div></div><ExperimentConditionsNote />{canCreateExperiment && <CaptureNextPrPanel projectId={projectId} />}<div className="lab-boundary"><div><p className="eyebrow">Única capacidad V1</p><h2>Comparar RAG vs Agente generalista</h2><p>Selecciona un target. Autorepair está excluido para ambas estrategias.</p>{canCreateExperiment && !liveRunEligibilityMessage && <><div className="field experiment-field"><label htmlFor="experiment-target">Target experimental</label><select id="experiment-target" value={selectedTarget?.id ?? ''} aria-describedby={selectedIsConstructor ? 'experiment-constructor-hint' : undefined} onChange={(event) => setTargetId(event.target.value)}>{selectable.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}</select>{selectedIsConstructor && <p id="experiment-constructor-hint" className="empty-inline-note">Este target parece un constructor y puede no ser ejecutable como experimento. Si falla, elige otro símbolo.</p>}</div><button className="button primary" aria-describedby="experiment-run-note" disabled={!canStartFromRun || startMutation.isPending || Boolean(experimentId)} onClick={() => startMutation.mutate()}>{startMutation.isPending ? 'Creando comparación…' : 'Ejecutar comparación'}</button></>}<p id="experiment-run-note" role="status" className="empty-inline-note">{runNote}</p></div><div className={`contract-note ${isMock ? 'success-note' : ''}`}><span className="contract-glyph">{isMock ? 'DEMO' : 'API'}</span><div><strong>{isMock ? 'Laboratorio simulado' : 'Ejecución live'}</strong><p>{isMock ? 'Las métricas son narrativas para demostrar el flujo; no constituyen evidencia de tesis.' : 'Cada repetición se ejecuta de verdad en RAG Core y en el Sandbox; puede tardar varios minutos.'}</p></div></div></div>{experimentId && experimentQuery.isError && <div className="structured-error" role="alert"><strong>No se pudo cargar el experimento</strong><p>Puede que este id ya no exista o que haya un fallo de conexión. Inténtalo de nuevo.</p>{errorCorrelationId(experimentQuery.error) && <p>Correlation ID: <code>{errorCorrelationId(experimentQuery.error)}</code></p>}<button className="button" disabled={experimentQuery.isFetching} onClick={() => void experimentQuery.refetch()}>Reintentar</button> <button className="button" onClick={() => setSearchParams((previous) => { const next = new URLSearchParams(previous); next.delete('experimentId'); return next }, { replace: true })}>Iniciar otra comparación</button></div>}{startMutation.isError && <div className="structured-error" role="alert"><strong>No se pudo iniciar el experimento</strong><p>{bindingErrorMessage(startMutation.error)}{errorCorrelationId(startMutation.error) && <> · Correlation ID: <code>{errorCorrelationId(startMutation.error)}</code></>}</p>{isLlmProviderUnavailable(startMutation.error) && <button className="button" disabled={startMutation.isPending} onClick={() => startMutation.mutate()}>Reintentar</button>}</div>}{experimentId && operation?.status === 'FAILED' && <div className="structured-error" role="alert"><strong>{experimentFailureTitle()}</strong><p>{experimentFailureMessage(operation.failureCode)}</p>{operation.failureMessage && <p>Detalle: {operation.failureMessage}</p>}{isMock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}</div>}{experimentId && !experimentQuery.isError && (!operation || operation.status !== 'COMPLETED') && operation?.status !== 'FAILED' && <div className="experiment-progress" role="status"><div><span className="live-indicator" /><strong>{operation?.status === 'RUNNING' ? 'Ejecutando estrategias pareadas' : 'Preparando experimento'}</strong><p>Experiment <code>{experimentId}</code></p></div><span>{operation?.progress ?? 0}%</span><i><b style={{ width: `${operation?.progress ?? 0}%` }} /></i></div>}{operation?.status === 'COMPLETED' && operation.result && <><div className="flow-connector" aria-hidden="true"><span>RESULT</span><i /></div><ExperimentComparison result={operation.result} projectId={projectId} experimentId={experimentId ?? ''} analysisRunId={analysisRunId} /></>}{experimentId && (operation?.status === 'COMPLETED' || operation?.status === 'FAILED') && <div className="panel evidence-panel"><div className="section-heading"><div><h2>Evidencia versionada</h2><p>Descarga el paquete técnico de este experimento tal como lo devuelve Core.</p></div></div><EvidenceDownload kind="EXPERIMENT" subjectId={experimentId} terminal /></div>}</section>
}
