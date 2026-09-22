import { afterEach, describe, expect, it } from 'vitest'
import { clearOAuthCallbackError, readOAuthCallbackError } from './oauthCallbackError'

const callbackUrl = '/?error=access_denied&error_code=oauth_denied&error_description=The+user+denied+access#error=access_denied&error_code=oauth_denied&error_description=The+user+denied+access&sb='

afterEach(() => window.history.replaceState(null, '', '/'))

describe('oauthCallbackError', () => {
  it('sin error en la URL no devuelve aviso', () => {
    expect(readOAuthCallbackError()).toBeNull()
  })

  it('cualquier error del callback usa el mensaje genérico de GitHub, sin exponer el detalle del proveedor', () => {
    window.history.replaceState(null, '', callbackUrl)
    expect(readOAuthCallbackError()).toBe('No pudimos completar el acceso con GitHub. Inténtalo de nuevo.')
  })

  it('un error solo con `error` (sin error_code) también se avisa', () => {
    window.history.replaceState(null, '', '/#error=access_denied')
    expect(readOAuthCallbackError()).toBe('No pudimos completar el acceso con GitHub. Inténtalo de nuevo.')
  })

  it('clearOAuthCallbackError deja la ruta limpia para que un refresh no repita el aviso', () => {
    window.history.replaceState(null, '', callbackUrl)
    clearOAuthCallbackError()
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('')
    expect(readOAuthCallbackError()).toBeNull()
  })
})
