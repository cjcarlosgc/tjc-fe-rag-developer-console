import { afterEach, describe, expect, it } from 'vitest'
import { clearOAuthCallbackError, readOAuthCallbackError } from './oauthCallbackError'

const callbackUrl = '/?error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked#error=server_error&error_code=identity_already_exists&error_description=Identity+is+already+linked&sb='

afterEach(() => window.history.replaceState(null, '', '/'))

describe('oauthCallbackError', () => {
  it('sin error en la URL no devuelve aviso', () => {
    expect(readOAuthCallbackError()).toBeNull()
  })

  it('identity_already_exists explica que la cuenta de GitHub ya está vinculada a otro usuario', () => {
    window.history.replaceState(null, '', callbackUrl)
    expect(readOAuthCallbackError()).toContain('ya está vinculada a otro usuario')
  })

  it('cualquier otro error del callback usa el mensaje genérico de GitHub', () => {
    window.history.replaceState(null, '', '/#error=access_denied&error_code=oauth_denied')
    expect(readOAuthCallbackError()).toBe('No pudimos conectar tu cuenta de GitHub. Inténtalo de nuevo.')
  })

  it('clearOAuthCallbackError deja la ruta limpia para que un refresh no repita el aviso', () => {
    window.history.replaceState(null, '', callbackUrl)
    clearOAuthCallbackError()
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('')
    expect(readOAuthCallbackError()).toBeNull()
  })
})
