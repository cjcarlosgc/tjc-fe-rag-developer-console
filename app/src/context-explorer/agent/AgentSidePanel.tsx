import { useState } from 'react'
import { ExcerptView } from '../ExcerptView'
import type { AgentContextTraceDetail } from '../types'
import { agentStatusLabel, agentStepNodeId, agentToolLabel, isAttenuatedStep } from './agentLabels'
import { DiscoveredFilesList } from './DiscoveredFilesList'

interface Props {
  detail: AgentContextTraceDetail
  selectedId: string | null
}

/** HU28: herramienta/paso, argumentos, archivo/símbolo, rango, snippet, truncamiento y hash — nunca "seleccionado/descartado". */
export function AgentSidePanel({ detail, selectedId }: Props) {
  const [discoveredStep, setDiscoveredStep] = useState<number | null>(null)
  const step = detail.trajectory.find((item) => agentStepNodeId(item.step) === selectedId) ?? detail.trajectory[0]
  if (!step) return <aside className="side-panel" aria-label="Detalle del paso"><p>Sin pasos registrados en esta trayectoria.</p></aside>

  const attenuated = isAttenuatedStep(step.status)
  return <aside className="side-panel" aria-label="Detalle del paso">
    <p className="eyebrow">Paso {step.step} · {agentToolLabel[step.toolName]}</p>
    <h3 className={attenuated ? 'is-discarded-label' : undefined}>{agentStatusLabel[step.status]}</h3>
    <dl className="side-panel-meta">
      <div><dt>Argumentos</dt><dd><code>{JSON.stringify(step.arguments)}</code></dd></div>
      <div><dt>Resultado</dt><dd>{step.resultSummary}</dd></div>
      <div><dt>Hash del resultado</dt><dd><code>{step.resultSha256}</code></dd></div>
      {step.truncated && <div><dt>Truncamiento</dt><dd>Contenido truncado</dd></div>}
    </dl>

    {step.observations.length === 0 && <p className="empty-inline-note">Este paso no aportó contexto observado por el agente.</p>}

    {step.observations.map((observation, index) => <div className="agent-observation" key={`${step.step}-${index}`}>
      {observation.filePath && <p className="observation-path"><strong>Archivo</strong> {observation.filePath}{observation.symbolName ? ` · ${observation.symbolName}` : ''}</p>}
      {observation.kind === 'FILE_LIST_SUMMARY' && observation.discoveredFilesCount != null && <div className="discovered-summary">
        <p>{observation.discoveredFilesCount} archivos disponibles</p>
        <button type="button" className="button secondary" onClick={() => setDiscoveredStep(step.step)}>Mostrar descubiertos</button>
      </div>}
      {observation.excerpt && <ExcerptView excerpt={observation.excerpt} />}
    </div>)}

    {discoveredStep === step.step && <DiscoveredFilesList traceId={detail.id} step={step.step} onClose={() => setDiscoveredStep(null)} />}
  </aside>
}
