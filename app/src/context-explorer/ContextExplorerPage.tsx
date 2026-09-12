import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useProject } from '../projects/queries'
import { Breadcrumbs } from '../ui/Breadcrumbs'
import { ErrorState } from '../ui/Feedback'
import { AgentSidePanel } from './agent/AgentSidePanel'
import { agentStatusLabel, agentStepNodeId, agentToolLabel } from './agent/agentLabels'
import { AgentTrajectory } from './agent/AgentTrajectory'
import { ContextTraceLoadingState } from './ContextTraceLoadingState'
import { contextTraceErrorMessage, isContextTraceNotFinished } from './errors'
import { useContextTraceDetail, useExperimentContextTraces, useRunContextTraces } from './queries'
import { StructuredAlternativeView } from './graph/StructuredAlternativeView'
import type { StructuredRow } from './graph/StructuredAlternativeView'
import { RagGraph } from './rag/RagGraph'
import { discardReasonLabel, filterRagCandidates, ragSignalLabel } from './rag/ragLabels'
import type { RagSignalKind } from './rag/ragLabels'
import { RagSidePanel } from './rag/RagSidePanel'
import type { AgentContextTraceDetail, ContextTraceStrategy, ContextTraceSummary, RagCandidateNode, RagContextTraceDetail } from './types'

const ALL_SIGNAL_KINDS: Exclude<RagSignalKind, 'NONE'>[] = ['SEMANTIC', 'STRUCTURAL', 'DUAL']
const signalPillLabel: Record<Exclude<RagSignalKind, 'NONE'>, string> = { SEMANTIC: 'Semántica', STRUCTURAL: 'Estructural', DUAL: 'Dual' }

interface TargetGroup { targetId: string; traces: ContextTraceSummary[] }

function groupByTarget(traces: ContextTraceSummary[]): TargetGroup[] {
  const map = new Map<string, ContextTraceSummary[]>()
  for (const trace of traces) map.set(trace.targetId, [...(map.get(trace.targetId) ?? []), trace])
  return Array.from(map.entries()).map(([targetId, list]) => ({ targetId, traces: list.sort((a, b) => b.attempt - a.attempt) }))
}

function resolveSelectedTraceId(
  traceParam: string | null,
  allTraces: ContextTraceSummary[],
  targets: TargetGroup[],
  strategyParam: ContextTraceStrategy | null,
  repetitionParam: number | null,
): string | null {
  if (traceParam && allTraces.some((trace) => trace.id === traceParam)) return traceParam
  if (strategyParam || repetitionParam) {
    const match = allTraces.find((trace) => (!strategyParam || trace.strategy === strategyParam) && (!repetitionParam || trace.repetition === repetitionParam))
    if (match) return match.id
  }
  const first = targets[0]
  if (!first) return allTraces[0]?.id ?? null
  return first.traces.find((trace) => trace.current)?.id ?? first.traces[0]?.id ?? null
}

function buildRagRows(detail: RagContextTraceDetail, candidates: RagCandidateNode[]): StructuredRow[] {
  const rows: StructuredRow[] = [{
    id: detail.targetId,
    primary: detail.target.excerpt.symbolName ?? detail.target.excerpt.filePath,
    secondary: detail.target.excerpt.filePath,
    status: 'Target',
    meta: `${detail.target.tokenCount} tokens`,
  }]
  for (const candidate of [...candidates].sort((a, b) => a.rank - b.rank)) {
    const discarded = candidate.decision === 'DISCARDED'
    rows.push({
      id: candidate.chunkId,
      primary: candidate.excerpt.symbolName ?? candidate.excerpt.filePath.split('/').at(-1) ?? candidate.chunkId,
      secondary: candidate.excerpt.filePath,
      status: discarded ? (discardReasonLabel[candidate.discardReason ?? ''] ?? 'Descartado') : 'Retenido',
      meta: ragSignalLabel(candidate),
    })
  }
  return rows
}

function buildAgentRows(detail: AgentContextTraceDetail): StructuredRow[] {
  return [...detail.trajectory].sort((a, b) => a.step - b.step).map((step) => ({
    id: agentStepNodeId(step.step),
    primary: agentToolLabel[step.toolName],
    secondary: step.observations[0]?.filePath ?? undefined,
    status: agentStatusLabel[step.status],
    meta: step.resultSummary,
  }))
}

export function ContextExplorerPage() {
  const { projectId = '', runId, experimentId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const projectQuery = useProject(projectId)

  const artifactId = searchParams.get('artifactId') ?? undefined
  const includeSuperseded = searchParams.get('includeSuperseded') === 'true'
  const view = searchParams.get('view') === 'list' ? 'list' : 'graph'
  const traceParam = searchParams.get('trace')
  const nodeParam = searchParams.get('node')
  const strategyRaw = searchParams.get('strategy')
  const strategyParam: ContextTraceStrategy | null = strategyRaw === 'RAG' || strategyRaw === 'GENERALIST_AGENT' ? strategyRaw : null
  const repetitionRaw = Number(searchParams.get('repetition'))
  const repetitionParam = repetitionRaw === 1 || repetitionRaw === 2 || repetitionRaw === 3 ? repetitionRaw : null

  // Aplica varios cambios de query params en una sola actualización: dos llamadas seguidas a setSearchParams
  // parten del mismo snapshot previo y la segunda pisaría a la primera.
  const updateParams = useCallback((patch: Record<string, string | null>) => {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      for (const [key, value] of Object.entries(patch)) {
        if (value === null) next.delete(key)
        else next.set(key, value)
      }
      return next
    }, { replace: true })
  }, [setSearchParams])
  const updateParam = useCallback((key: string, value: string | null) => updateParams({ [key]: value }), [updateParams])

  // strategy/repetition de la URL solo eligen la traza inicial (resolveSelectedTraceId); el listado trae todas las repeticiones para poder alternar entre ellas.
  const runTracesQuery = useRunContextTraces(runId ?? '', { artifactId, includeSuperseded }, Boolean(runId))
  const experimentTracesQuery = useExperimentContextTraces(experimentId ?? '', { includeSuperseded }, Boolean(experimentId))
  const tracesQuery = experimentId ? experimentTracesQuery : runTracesQuery
  const allTraces = useMemo(() => tracesQuery.data?.pages.flatMap((page) => page.items) ?? [], [tracesQuery.data])
  const targets = useMemo(() => groupByTarget(allTraces), [allTraces])
  const selectedTraceId = useMemo(
    () => resolveSelectedTraceId(traceParam, allTraces, targets, strategyParam, repetitionParam),
    [traceParam, allTraces, targets, strategyParam, repetitionParam],
  )
  useEffect(() => {
    if (selectedTraceId && selectedTraceId !== traceParam) updateParam('trace', selectedTraceId)
  }, [selectedTraceId, traceParam, updateParam])

  const detailQuery = useContextTraceDetail(selectedTraceId)
  const ragDetail = detailQuery.data?.kind === 'RAG' ? detailQuery.data : null
  const agentDetail = detailQuery.data?.kind === 'AGENT' ? detailQuery.data : null

  const defaultNodeId = ragDetail ? ragDetail.targetId : agentDetail ? agentStepNodeId([...agentDetail.trajectory].sort((a, b) => a.step - b.step)[0]?.step ?? 1) : null
  useEffect(() => {
    if (detailQuery.data && !nodeParam && defaultNodeId) updateParam('node', defaultNodeId)
  }, [detailQuery.data, nodeParam, defaultNodeId, updateParam])
  const selectedNodeId = nodeParam ?? defaultNodeId
  const currentTargetGroup = targets.find((group) => group.traces.some((trace) => trace.id === selectedTraceId))

  const [nodeSearch, setNodeSearch] = useState('')
  const [signalKinds, setSignalKinds] = useState<Set<Exclude<RagSignalKind, 'NONE'>>>(() => new Set(ALL_SIGNAL_KINDS))
  const [showDiscarded, setShowDiscarded] = useState(true)
  // spec.md: la búsqueda/filtros son estado de UI local, no query params estables; se reinician al cambiar de traza (ajuste durante el render, no en un efecto).
  const [filtersTraceId, setFiltersTraceId] = useState(selectedTraceId)
  if (filtersTraceId !== selectedTraceId) {
    setFiltersTraceId(selectedTraceId)
    setNodeSearch('')
    setSignalKinds(new Set(ALL_SIGNAL_KINDS))
    setShowDiscarded(true)
  }
  const toggleSignalKind = useCallback((kind: Exclude<RagSignalKind, 'NONE'>) => {
    setSignalKinds((previous) => {
      const next = new Set(previous)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }, [])

  const discardedCount = ragDetail?.candidates.filter((candidate) => candidate.decision === 'DISCARDED').length ?? 0
  const filteredCandidates = useMemo(
    () => ragDetail ? filterRagCandidates(ragDetail.candidates, { search: nodeSearch, signalKinds, showDiscarded }) : [],
    [ragDetail, nodeSearch, signalKinds, showDiscarded],
  )

  if (tracesQuery.isPending) return <ContextTraceLoadingState label="Cargando trazas de contexto…" />
  if (tracesQuery.isError) return <ErrorState message={contextTraceErrorMessage(tracesQuery.error)} onRetry={() => void tracesQuery.refetch()} />

  const breadcrumbItems = experimentId
    ? [
      { label: 'Proyectos', to: '/' },
      { label: projectQuery.data?.name ?? projectId, to: `/projects/${projectId}` },
      { label: 'Modo experimental', to: `/projects/${projectId}/experimental` },
      { label: 'Explorar contexto' },
    ]
    : [
      { label: 'Proyectos', to: '/' },
      { label: projectQuery.data?.name ?? projectId, to: `/projects/${projectId}` },
      { label: `Run ${runId}`, to: `/projects/${projectId}/runs/${runId}` },
      { label: 'Explorar contexto' },
    ]

  return <section>
    <Breadcrumbs items={breadcrumbItems} />
    <div className="page-heading"><div><p className="eyebrow">{experimentId ? `Contexto / Experimento ${experimentId}` : `Contexto / Run ${runId}`}</p><h1>Explorador de contexto</h1><p>Evidencia de contexto recolectada para esta generación.</p></div></div>

    {allTraces.length === 0 ? <div className="empty-state"><div className="empty-icon">{'{ }'}</div><h2>Sin trazas de contexto</h2><p>{experimentId ? 'Este experimento todavía no registró evidencia de contexto para mostrar.' : 'Este run todavía no registró evidencia de contexto para mostrar.'}</p></div> : <>
      <div className="list-toolbar">
        {!experimentId && targets.length > 1 && <nav className="target-switch" aria-label="Targets con contexto">
          {targets.map((group) => {
            const active = group.traces.some((trace) => trace.id === selectedTraceId)
            const defaultTraceId = group.traces.find((trace) => trace.current)?.id ?? group.traces[0].id
            return <button type="button" key={group.targetId} aria-pressed={active} onClick={() => updateParams({ trace: defaultTraceId, node: null })}>{group.targetId}</button>
          })}
        </nav>}
        {experimentId && allTraces.length > 1 && <nav className="target-switch" aria-label="Repeticiones del experimento">
          {allTraces.map((trace) => <button type="button" key={trace.id} aria-pressed={trace.id === selectedTraceId} onClick={() => updateParams({ trace: trace.id, node: null })}>{`${trace.strategy === 'RAG' ? 'RAG' : 'Agente'} · rep ${trace.repetition}`}</button>)}
        </nav>}
        {!experimentId && <label className="checkbox-toggle"><input type="checkbox" checked={includeSuperseded} onChange={(event) => updateParam('includeSuperseded', event.target.checked ? 'true' : null)} /> Incluir intentos anteriores</label>}
        <fieldset className="segmented"><legend>Vista</legend>
          <button type="button" aria-pressed={view === 'graph'} onClick={() => updateParam('view', 'graph')}>Vista de grafo</button>
          <button type="button" aria-pressed={view === 'list'} onClick={() => updateParam('view', 'list')}>Vista de lista</button>
        </fieldset>
      </div>

      {!experimentId && includeSuperseded && currentTargetGroup && currentTargetGroup.traces.length > 1 && <fieldset className="segmented attempt-switch"><legend>Intento</legend>
        {currentTargetGroup.traces.map((trace) => <button type="button" key={trace.id} aria-pressed={trace.id === selectedTraceId} onClick={() => updateParams({ trace: trace.id, node: null })}>{`Intento ${trace.attempt}${trace.current ? ' · vigente' : ''}`}</button>)}
      </fieldset>}

      {detailQuery.isPending && <ContextTraceLoadingState label="Cargando detalle de la traza…" />}
      {detailQuery.isError && (isContextTraceNotFinished(detailQuery.error)
        ? <ContextTraceLoadingState label="La traza todavía se está procesando…" />
        : <ErrorState message={contextTraceErrorMessage(detailQuery.error)} onRetry={() => void detailQuery.refetch()} />)}
      {ragDetail && <div className="list-toolbar rag-filter-bar">
        <div className="field list-search"><label htmlFor="rag-node-search">Buscar nodo, símbolo o hash</label><input id="rag-node-search" value={nodeSearch} onChange={(event) => setNodeSearch(event.target.value)} placeholder="símbolo, archivo o chunk…" /></div>
        <div className="signal-filter-pills" role="group" aria-label="Filtrar candidatos por señal">
          {ALL_SIGNAL_KINDS.map((kind) => <button type="button" key={kind} className={`signal-pill signal-pill-${kind.toLowerCase()}`} aria-pressed={signalKinds.has(kind)} onClick={() => toggleSignalKind(kind)}>{signalPillLabel[kind]}</button>)}
        </div>
        <label className="checkbox-toggle"><input type="checkbox" checked={showDiscarded} onChange={(event) => setShowDiscarded(event.target.checked)} /> Descartados ({discardedCount})</label>
      </div>}
      {detailQuery.data && <div className="context-explorer-body">
        {ragDetail ? <>
          {filteredCandidates.length === 0
            ? <div className="empty-inline"><strong>Sin candidatos coincidentes</strong><p>Ajusta la búsqueda o los filtros de señal/descartados.</p></div>
            : view === 'graph'
              ? <RagGraph detail={ragDetail} candidates={filteredCandidates} selectedId={selectedNodeId} onSelect={(id) => updateParam('node', id)} />
              : <StructuredAlternativeView caption="Candidatos RAG (vista de lista)" rows={buildRagRows(ragDetail, filteredCandidates)} selectedId={selectedNodeId} onSelect={(id) => updateParam('node', id)} />}
          <RagSidePanel detail={ragDetail} selectedId={selectedNodeId} />
        </> : agentDetail ? <>
          {view === 'graph'
            ? <AgentTrajectory detail={agentDetail} selectedId={selectedNodeId} onSelect={(id) => updateParam('node', id)} />
            : <StructuredAlternativeView caption="Trayectoria del agente (vista de lista)" rows={buildAgentRows(agentDetail)} selectedId={selectedNodeId} onSelect={(id) => updateParam('node', id)} />}
          <AgentSidePanel detail={agentDetail} selectedId={selectedNodeId} />
        </> : null}
      </div>}
    </>}
  </section>
}
