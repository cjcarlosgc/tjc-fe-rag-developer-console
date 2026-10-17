import { githubLoginErrorMessage } from './errors'

/**
 * Supabase devuelve los fallos del callback OAuth (p.ej. `access_denied`) en el hash o en el query de la
 * URL de retorno, no como error de la llamada original. Es una lectura pura para poder usarla en un
 * inicializador de estado; la URL se limpia aparte con `clearOAuthCallbackError`.
 */
export function readOAuthCallbackError(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const search = new URLSearchParams(window.location.search)
  if (!params.get('error_code') && !search.get('error_code') && !params.get('error') && !search.get('error')) return null
  return githubLoginErrorMessage
}

/** Quita `error*` de la URL para que un refresh no vuelva a mostrar el aviso. */
export function clearOAuthCallbackError() {
  const url = new URL(window.location.href)
  const hash = new URLSearchParams(url.hash.replace(/^#/, ''))
  for (const key of ['error', 'error_code', 'error_description', 'sb']) {
    url.searchParams.delete(key)
    hash.delete(key)
  }
  const nextHash = hash.toString()
  window.history.replaceState(null, '', `${url.pathname}${url.search}${nextHash ? `#${nextHash}` : ''}`)
}
