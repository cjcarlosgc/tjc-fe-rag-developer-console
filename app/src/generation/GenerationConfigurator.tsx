import { useState } from 'react'
import type { InventoryTargetViewModel } from '../inventory/types'
import type { GenerationConfiguration, GenerationMode } from './types'

const modes: Array<{ id: GenerationMode; label: string; scope: string; description: string; mass: boolean }> = [
  { id: 'TARGET', label: 'Target puntual', scope: 'TARGET', description: 'Genera pruebas para un método o función seleccionada.', mass: false },
  { id: 'CLASS_ALL', label: 'Clase completa', scope: 'CLASS', description: 'Cubre todos los objetivos testables de la clase.', mass: true },
  { id: 'CLASS_MISSING', label: 'Faltantes de clase', scope: 'CLASS', description: 'Conserva las pruebas existentes y completa brechas.', mass: false },
  { id: 'PROJECT_MISSING', label: 'Faltantes del proyecto', scope: 'PROJECT', description: 'Trabaja únicamente sobre targets sin cobertura.', mass: true },
  { id: 'PROJECT_ALL', label: 'Proyecto completo', scope: 'PROJECT', description: 'Propone una suite para todos los targets testables.', mass: true },
]

interface Props { projectId: string; target?: InventoryTargetViewModel; onConfirm: (configuration: GenerationConfiguration) => void }

export function GenerationConfigurator({ projectId, target, onConfirm }: Props) {
  const [mode, setMode] = useState<GenerationMode>('PROJECT_MISSING')
  const [acknowledged, setAcknowledged] = useState(false)
  const selected = modes.find((item) => item.id === mode)!
  const needsTarget = mode === 'TARGET'
  const needsClass = mode.startsWith('CLASS_')
  const targetIsValid = (!needsTarget || target?.kind === 'METHOD' || target?.kind === 'FUNCTION') && (!needsClass || target?.kind === 'CLASS' || target?.kind === 'METHOD')
  const canConfirm = targetIsValid && (!selected.mass || acknowledged)

  return <div className="generation-layout"><div><fieldset className="mode-fieldset"><legend>Modo de generación</legend>{modes.map((item, index) => { const unavailable = (item.scope === 'TARGET' && target?.kind !== 'METHOD' && target?.kind !== 'FUNCTION') || (item.scope === 'CLASS' && (!target || target.kind === 'FUNCTION')); return <label className={`mode-card ${mode === item.id ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`} key={item.id}><input type="radio" name="generation-mode" value={item.id} checked={mode === item.id} disabled={unavailable} onChange={() => { setMode(item.id); setAcknowledged(false) }} /><span className="mode-index">0{index + 1}</span><span><strong>{item.label}</strong><small>{item.description}</small></span><code>{item.scope}</code></label>})}</fieldset></div><aside className="scope-console"><p className="eyebrow">Resumen de alcance</p><h2>{selected.label}</h2><dl><div><dt>Proyecto</dt><dd><code>{projectId}</code></dd></div><div><dt>Estrategia</dt><dd>RAG</dd></div><div><dt>Contexto</dt><dd>{target ? target.methodName ?? target.symbolName : 'ProjectVersion actual'}</dd></div></dl>{!targetIsValid && <div className="scope-warning" role="alert">Selecciona {needsTarget ? 'un método o una función' : 'una clase'} desde el inventario para usar este modo.</div>}{selected.mass && targetIsValid && <label className="acknowledge"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} /><span>Confirmo el alcance masivo de esta generación.</span></label>}<button className="button primary wide" type="button" disabled={!canConfirm} onClick={() => onConfirm({ projectId, mode, target })}>Confirmar configuración</button><p className="rag-note">El modo normal siempre usa recuperación RAG.</p></aside></div>
}
