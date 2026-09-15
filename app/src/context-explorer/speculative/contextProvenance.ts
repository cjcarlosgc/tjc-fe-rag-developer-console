import { getDataSource, ProposedCapabilityError } from '../../api/dataSource'
import { mockGetContextProvenance } from '../../api/mockBackend'

/**
 * PROPUESTA — HU54, sin forma de contrato aprobada en INTEROP. Ver
 * spec/features/013-pr-driven-control-plane/spec.md (sección "Pendiente de
 * implementar") y harness/reports/console-backlog-formalization.md. No
 * reemplaza el grafo RAG real (HU27, `RagGraph`) — lo complementa mostrando
 * qué reglas de Functional Knowledge y qué evidencia de tests existentes
 * habrían "alimentado" el contexto, para responder "¿por qué se generó (o
 * no) esta prueba, más allá de los nodos recuperados?".
 */
export interface ContextProvenanceFunctionalKnowledgeRef {
  id: string
  normalizedRule: string
}

export interface ContextProvenanceTestEvidence {
  filePath: string
  testName: string
}

export interface ContextProvenance {
  functionalKnowledgeRefs: ContextProvenanceFunctionalKnowledgeRef[]
  existingTestEvidence: ContextProvenanceTestEvidence[]
}

export function getContextProvenance(analysisRunId: string): Promise<ContextProvenance> {
  if (getDataSource() === 'mock') return mockGetContextProvenance(analysisRunId)
  return Promise.reject(new ProposedCapabilityError('Procedencia del contexto — FK y tests existentes (HU54)'))
}
