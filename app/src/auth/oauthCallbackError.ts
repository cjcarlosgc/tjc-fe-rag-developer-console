import { githubConnectionErrorMessage } from './errors'

const identityAlreadyLinkedMessage = 'Esa cuenta de GitHub ya está vinculada a otro usuario de la plataforma. Inicia sesión con ese usuario o usa otra cuenta de GitHub.'

/**
 * Supabase devuelve los fallos del callback OAuth (p.ej. `identity_already_exists` de `linkIdentity`)
 * en el hash o en el query de la URL de retorno, no como error de la llamada original. Es una lectura
 * pura para poder usarla en un inicializador de estado; la URL se limpia aparte con `clearOAuthCallbackError`.
 */
export function readOAuthCallbackError(): string | null {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const search = new URLSearchParams(window.location.search)
  const code = params.get('error_code') ?? search.get('error_code')
  if (!code && !params.get('error') && !search.get('error')) return null
  return code === 'identity_already_exists' ? identityAlreadyLinkedMessage : githubConnectionErrorMessage
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
