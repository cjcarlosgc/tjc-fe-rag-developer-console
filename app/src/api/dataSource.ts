export type DataSource = 'mock' | 'live'

let dataSourceOverride: DataSource | null = null

export class PendingContractError extends Error {
  constructor(capability: string) {
    super(`RAG Core todavía no publicó el contrato live para ${capability}. Usa VITE_DATA_SOURCE=mock para la demostración.`)
    this.name = 'PendingContractError'
  }
}

export function getDataSource(): DataSource {
  if (dataSourceOverride) return dataSourceOverride
  const configured = import.meta.env.VITE_DATA_SOURCE
  if (configured === 'live' || configured === 'mock') return configured
  return import.meta.env.MODE === 'test' ? 'live' : 'mock'
}

export function isMockDataSource(): boolean {
  return getDataSource() === 'mock'
}

export function setDataSourceForTests(value: DataSource | null): void {
  dataSourceOverride = value
}
