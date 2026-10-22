import { parseBaseUrl } from '../api/baseUrl'
import type { BaseUrlIssue } from '../api/baseUrl'
import type { DataSource } from '../api/dataSource'

export const CORE_API_URL_VARIABLE = 'VITE_CORE_API_URL'

/** Problema de configuración que impide arrancar. Solo lleva el nombre de la variable y el motivo, nunca su valor. */
export interface ConfigurationIssue {
  variable: typeof CORE_API_URL_VARIABLE
  reason: BaseUrlIssue
}

export interface ConfigurationInput {
  dataSource: DataSource
  coreApiUrl: string | undefined
}

/**
 * Valida la configuración antes de cargar la aplicación. Solo bloquea en live: en mock la URL no se usa y nunca impide el demo.
 * Vacía, ausente o válida no es error (vacía = mismo origen).
 */
export function resolveConfigurationError(input: ConfigurationInput): ConfigurationIssue | null {
  if (input.dataSource === 'mock') return null
  const result = parseBaseUrl(input.coreApiUrl)
  return result.ok ? null : { variable: CORE_API_URL_VARIABLE, reason: result.issue }
}
