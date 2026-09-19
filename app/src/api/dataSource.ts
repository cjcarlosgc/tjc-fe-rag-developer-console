export type DataSource = 'mock' | 'live'

let dataSourceOverride: DataSource | null = null

export class PendingContractError extends Error {
  constructor(capability: string) {
    super(`RAG Core todavía no publicó el contrato live para ${capability}. Usa VITE_DATA_SOURCE=mock para la demostración.`)
    this.name = 'PendingContractError'
  }
}

/**
 * Distinta de `PendingContractError`: esa implica que el contrato ya existe (aprobado en
 * INTEROP) y solo falta que Core lo implemente. Esta se usa para capacidades HU48-55
 * (`PROPOSED` en spec/backlog.md) que ni siquiera tienen una forma de contrato aprobada
 * todavía — no hay nada que "publicar en live" porque no hay nada acordado que publicar.
 */
export class ProposedCapabilityError extends Error {
  constructor(capability: string) {
    super(`${capability} es una propuesta de producto sin contrato aprobado todavía — no aplica a modo live. Usa VITE_DATA_SOURCE=mock para explorar la propuesta.`)
    this.name = 'ProposedCapabilityError'
  }
}

export function getDataSource(): DataSource {
  if (dataSourceOverride) return dataSourceOverride
  const configured = import.meta.env.VITE_DATA_SOURCE
  if (configured === 'live' || configured === 'mock') return configured
  // Sin variable: solo `vite dev` arranca en mock; build de producción (Render) y tests van live.
  return import.meta.env.MODE === 'development' ? 'mock' : 'live'
}

export function isMockDataSource(): boolean {
  return getDataSource() === 'mock'
}

export function setDataSourceForTests(value: DataSource | null): void {
  dataSourceOverride = value
}
