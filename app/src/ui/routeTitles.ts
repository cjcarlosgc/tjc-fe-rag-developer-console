/** Título de documento por ruta (WCAG 2.4.2): cada página se distingue en la pestaña y para lectores de pantalla. */
const APP_NAME = 'RAG Test Studio'

const ROUTE_TITLES: ReadonlyArray<readonly [RegExp, string]> = [
  [/^\/login$/, 'Acceso'],
  [/^\/$/, 'Projects'],
  [/^\/action-required$/, 'Action Required'],
  [/^\/action-required\/[^/]+$/, 'Focus Mode'],
  [/^\/analysis-runs$/, 'Runs'],
  [/^\/projects\/[^/]+$/, 'Project'],
  [/^\/projects\/[^/]+\/runs\/[^/]+$/, 'Detalle del Run'],
  [/^\/projects\/[^/]+\/runs\/[^/]+\/comparison$/, 'Comparación de estrategias'],
  [/^\/projects\/[^/]+\/runs\/[^/]+\/retrieval-comparison$/, 'Comparación de recuperación'],
  [/^\/projects\/[^/]+\/functional-knowledge$/, 'Functional Knowledge'],
  [/^\/projects\/[^/]+\/functional-knowledge\/[^/]+$/, 'Regla de Functional Knowledge'],
  [/^\/projects\/[^/]+\/integrations\/github$/, 'Integración con GitHub'],
  [/^\/projects\/[^/]+\/analyses$/, 'Historial de análisis'],
  [/^\/projects\/[^/]+(\/versions\/[^/]+)?\/inventory$/, 'Inventario'],
  [/^\/projects\/[^/]+\/experimental$/, 'Experimentos'],
  [/^\/projects\/[^/]+\/experimental\/[^/]+\/context$/, 'Explorador de contexto'],
]

export const NOT_FOUND_TITLE = 'Página no encontrada'

/** Título completo de la pestaña para un `pathname`; sin coincidencia devuelve `fallback` (por defecto, solo el nombre de la aplicación). */
export function documentTitleFor(pathname: string): string
export function documentTitleFor(pathname: string, fallback: string | null): string | null
export function documentTitleFor(pathname: string, fallback: string | null = APP_NAME): string | null {
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  const match = ROUTE_TITLES.find(([pattern]) => pattern.test(normalized))
  return match ? `${match[1]} · ${APP_NAME}` : fallback
}

export function titledDocument(title: string): string {
  return `${title} · ${APP_NAME}`
}
