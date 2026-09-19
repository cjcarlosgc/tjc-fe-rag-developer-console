import type { AgentStepStatus, AgentToolName } from '../types'

/**
 * spec.md HU28 — protocolo de vocabulario estricto:
 * PERMITIDO: "contexto observado por el agente", "contenido entregado al agente", "trayectoria de exploración".
 * PROHIBIDO: "contexto utilizado/seleccionado", "chain-of-thought", "confianza". Nunca usar SELECTED/DISCARDED aquí.
 */
export const agentToolLabel: Record<AgentToolName, string> = {
  list_files: 'Listar archivos',
  search_text: 'Buscar texto',
  inspect_symbol: 'Inspeccionar símbolo',
  read_file: 'Leer archivo',
}

export const agentStatusLabel: Record<AgentStepStatus, string> = {
  SUCCEEDED: 'Completado',
  EMPTY: 'Sin resultados',
  FAILED: 'Error',
}

export function isAttenuatedStep(status: AgentStepStatus): boolean {
  return status !== 'SUCCEEDED'
}

export function agentStepNodeId(step: number): string {
  return `step-${step}`
}
