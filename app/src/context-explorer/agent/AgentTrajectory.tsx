import { useMemo } from 'react'
import { GraphCanvas } from '../graph/GraphCanvas'
import { Legend } from '../graph/Legend'
import { computeSequentialLayout } from '../graph/graphLayout'
import type { AgentContextTraceDetail } from '../types'
import { agentStatusLabel, agentStepNodeId, agentToolLabel, isAttenuatedStep } from './agentLabels'

interface Props {
  detail: AgentContextTraceDetail
  selectedId: string | null
  onSelect: (id: string) => void
}

/** HU28: trayectoria cronológica del agente. Nunca usa categorías seleccionado/descartado. */
export function AgentTrajectory({ detail, selectedId, onSelect }: Props) {
  const sortedSteps = useMemo(() => [...detail.trajectory].sort((a, b) => a.step - b.step), [detail.trajectory])
  const nodeIds = useMemo(() => sortedSteps.map((step) => agentStepNodeId(step.step)), [sortedSteps])
  const layout = useMemo(() => computeSequentialLayout(nodeIds), [nodeIds])
  const edges = useMemo(() => nodeIds.slice(1).map((id, index) => ({ from: nodeIds[index], to: id })), [nodeIds])
  const stepById = useMemo(() => new Map(sortedSteps.map((step) => [agentStepNodeId(step.step), step])), [sortedSteps])

  return <div className="rag-graph-shell">
    <Legend items={[
      { swatchClassName: 'legend-agent', label: 'Trayectoria del agente' },
      { swatchClassName: 'legend-focus', label: 'Foco (paso mostrado en el panel)' },
      { swatchClassName: 'legend-discarded', label: 'Vacío o con error (opacidad reducida)' },
    ]} />
    <GraphCanvas
      ariaLabel={`Trayectoria del agente para ${detail.targetId}`}
      nodes={layout.nodes}
      edges={edges}
      selectedId={selectedId}
      onSelect={onSelect}
      renderNode={(node, state) => {
        const step = stepById.get(node.id)
        if (!step) return null
        const attenuated = isAttenuatedStep(step.status)
        const primaryObservation = step.observations[0]
        return <span className={`agent-node${attenuated ? ' attenuated' : ''}${state.selected ? ' is-focused' : ''}`}>
          <strong className={attenuated ? 'is-discarded-label' : undefined}>{agentToolLabel[step.toolName]}</strong>
          <small>{primaryObservation?.filePath ?? `Paso ${step.step}`}</small>
          <span className="node-badge">{agentStatusLabel[step.status]}</span>
          <span className="node-signal">{step.resultSummary}</span>
          <span className="node-hover-preview" aria-hidden="true">
            <strong>{agentToolLabel[step.toolName]} · paso {step.step}</strong>
            <span className="hover-preview-path">{primaryObservation?.filePath ?? detail.targetId}</span>
            <span className="hover-preview-stats"><span>{agentStatusLabel[step.status]}</span></span>
            <span className="hover-preview-snippet">{step.resultSummary}</span>
          </span>
        </span>
      }}
    />
  </div>
}
