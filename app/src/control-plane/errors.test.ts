import { expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { bindingErrorMessage, errorCorrelationId, isGitHubAccessRenewalRequired, isLlmProviderUnavailable, isProjectNotFound, isVerificationUnavailable, reactivateErrorMessage } from './errors'

it('mapea los códigos de dominio de binding y de Project a un mensaje propio', () => {
  expect(bindingErrorMessage(new ApiError('x', 409, 'c', 'REPOSITORY_ALREADY_BOUND'))).toBe('Este repositorio ya está vinculado a otro proyecto. Elige otro repositorio.')
  expect(bindingErrorMessage(new ApiError('x', 409, 'c', 'REPOSITORY_BINDING_ALREADY_EXISTS'))).toBe('Este proyecto ya tiene un repositorio vinculado.')
  expect(bindingErrorMessage(new ApiError('x', 404, 'c', 'PROJECT_NOT_FOUND'))).toBe('El proyecto ya no existe.')
})

it('un 5xx muestra un mensaje genérico y los códigos no mapeados conservan el mensaje original', () => {
  expect(bindingErrorMessage(new ApiError('P2002 unique constraint', 500, 'c', 'INTERNAL_ERROR'))).toMatch(/no pudo completar la operación/)
  expect(bindingErrorMessage(new ApiError('mensaje original', 422, 'c', 'OTRO'))).toBe('mensaje original')
})

it('errorCorrelationId e isProjectNotFound solo aplican a ApiError', () => {
  expect(errorCorrelationId(new ApiError('x', 500, 'corr-1'))).toBe('corr-1')
  expect(errorCorrelationId(new Error('x'))).toBeUndefined()
  expect(isProjectNotFound(new ApiError('x', 404, 'c', 'PROJECT_NOT_FOUND'))).toBe(true)
  expect(isProjectNotFound(new ApiError('x', 404, 'c', 'REPOSITORY_BINDING_NOT_FOUND'))).toBe(false)
  expect(isProjectNotFound(new Error('x'))).toBe(false)
})

it.each([
  [404, 'GITHUB_REPOSITORY_NOT_FOUND', 'No encontramos ese repositorio o no tienes permiso sobre él. Vuelve a elegirlo de la lista.'],
  [400, 'REPOSITORY_OUTSIDE_WORKSPACE', 'Este repositorio no pertenece a tu cuenta; en un proyecto personal solo puedes vincular repositorios propios.'],
  [403, 'REPOSITORY_PERMISSION_INSUFFICIENT', 'Necesitas permiso maintain, write o admin sobre este repositorio.'],
  [503, 'GITHUB_VERIFICATION_UNAVAILABLE', 'No pudimos verificar el permiso en GitHub ahora; inténtalo de nuevo.'],
  [503, 'GITHUB_UPSTREAM_UNAVAILABLE', 'GitHub no está disponible ahora; inténtalo de nuevo en unos minutos.'],
  [403, 'GITHUB_APP_ACCESS_REQUIRED', 'La GitHub App no tiene acceso al repositorio. Configura el acceso en GitHub y vuelve a intentarlo.'],
])('HU64: %s %s se mapea a su mensaje, con y sin correlationId', (status, code, message) => {
  expect(bindingErrorMessage(new ApiError('mensaje crudo de Core', status, 'corr-64', code))).toBe(message)
  expect(bindingErrorMessage(new ApiError('mensaje crudo de Core', status, undefined, code))).toBe(message)
  expect(errorCorrelationId(new ApiError('x', status, 'corr-64', code))).toBe('corr-64')
  expect(errorCorrelationId(new ApiError('x', status, undefined, code))).toBeUndefined()
})

it('HU64: el 404 GITHUB_REPOSITORY_NOT_FOUND no distingue motivos y el 503 no afirma que el repositorio no exista ni que falte el permiso', () => {
  expect(bindingErrorMessage(new ApiError('x', 404, 'c', 'GITHUB_REPOSITORY_NOT_FOUND'))).not.toMatch(/identificador/)
  const unavailable = bindingErrorMessage(new ApiError('x', 503, 'c', 'GITHUB_VERIFICATION_UNAVAILABLE'))
  expect(unavailable).not.toMatch(/no existe|no encontramos|no tienes|necesitas/i)
})

it('isVerificationUnavailable reconoce errores 503 reintentables de Integration/Core', () => {
  expect(isVerificationUnavailable(new ApiError('x', 503, 'c', 'GITHUB_VERIFICATION_UNAVAILABLE'))).toBe(true)
  expect(isVerificationUnavailable(new ApiError('x', 503, 'c', 'GITHUB_UPSTREAM_UNAVAILABLE'))).toBe(true)
  expect(isVerificationUnavailable(new ApiError('x', 503, 'c', 'CORE_AUTHORIZATION_UNAVAILABLE'))).toBe(true)
  expect(isVerificationUnavailable(new ApiError('x', 503, 'c', 'IDENTITY_UNAVAILABLE'))).toBe(false)
  expect(isVerificationUnavailable(new ApiError('x', 404, 'c', 'GITHUB_REPOSITORY_NOT_FOUND'))).toBe(false)
  expect(isVerificationUnavailable(new Error('x'))).toBe(false)
})

it.each([
  [404, 'GITHUB_REPOSITORY_NOT_FOUND'],
  [400, 'REPOSITORY_OUTSIDE_WORKSPACE'],
])('Reactivar: %s %s no dice «Vuelve a elegirlo de la lista» (no se puede revincular) y apunta a crear un proyecto nuevo', (status, code) => {
  const message = reactivateErrorMessage(new ApiError('crudo', status, 'c', code))
  expect(message).toBe('El repositorio ya no está disponible para este proyecto; si necesitas otro, elimina el proyecto y crea uno nuevo.')
  expect(message).not.toMatch(/lista/)
})

it('Reactivar: el resto de códigos conserva el mapeo de binding (403 App, 5xx…)', () => {
  expect(reactivateErrorMessage(new ApiError('x', 403, 'c', 'GITHUB_APP_ACCESS_REQUIRED'))).toBe(bindingErrorMessage(new ApiError('x', 403, 'c', 'GITHUB_APP_ACCESS_REQUIRED')))
  expect(reactivateErrorMessage(new ApiError('x', 500, 'c'))).toMatch(/no pudo completar la operación/)
})

it.each(['GITHUB_ACCOUNT_REQUIRED', 'GITHUB_USER_TOKEN_INVALID'])('401 %s es de renovación de acceso a GitHub y tiene mensaje propio', (code) => {
  const error = new ApiError('crudo', 401, 'c', code)
  expect(isGitHubAccessRenewalRequired(error)).toBe(true)
  expect(bindingErrorMessage(error)).toMatch(/Renuévalo/)
  expect(isGitHubAccessRenewalRequired(new ApiError('x', 401, 'c', 'AUTH_REQUIRED'))).toBe(false)
  expect(isGitHubAccessRenewalRequired(new Error('x'))).toBe(false)
})

it('WI-CONSOLE-014 (INTEROP-2.7 §6.15): los errores de comparación de retrieval tienen mensaje propio en español', () => {
  const cases: Array<[number, string]> = [
    [404, 'ANALYSIS_SYMBOL_NOT_FOUND'],
    [422, 'UNSUPPORTED_SYMBOL_KIND'],
    [404, 'RETRIEVAL_COMPARISON_NOT_FOUND'],
    [409, 'RETRIEVAL_COMPARISON_NOT_FINISHED'],
    [409, 'IDEMPOTENCY_CONFLICT'],
  ]
  for (const [status, code] of cases) {
    const message = bindingErrorMessage(new ApiError('mensaje crudo de Core', status, 'corr-rc', code))
    expect(message).not.toBe('mensaje crudo de Core')
    expect(message).not.toMatch(/ganador|mejor|peor/i)
    expect(errorCorrelationId(new ApiError('x', status, 'corr-rc', code))).toBe('corr-rc')
  }
  expect(bindingErrorMessage(new ApiError('x', 422, 'c', 'UNSUPPORTED_SYMBOL_KIND'))).toBe('Solo se pueden comparar métodos o funciones con cambio directo en este Run.')
  expect(bindingErrorMessage(new ApiError('x', 409, 'c', 'IDEMPOTENCY_CONFLICT'))).toMatch(/clave de idempotencia/)
})

it('WI-CONSOLE-014: un 403 de rol en comparaciones usa el mensaje de rol con requiredRole/currentRole', () => {
  expect(bindingErrorMessage(new ApiError('x', 403, 'c', 'PROJECT_ROLE_INSUFFICIENT', { requiredRole: 'WRITER', currentRole: 'READER' })))
    .toBe('Tu rol actual (READER) no alcanza para esta acción; se requiere WRITER.')
})

it('WI-CONSOLE-021: REASONING_EFFORT_UNSUPPORTED lista details.supportedEfforts cuando es string[]', () => {
  expect(bindingErrorMessage(new ApiError('crudo', 422, 'c', 'REASONING_EFFORT_UNSUPPORTED', { supportedEfforts: ['low', 'medium'] }))).toBe(
    'El modelo no admite el esfuerzo de razonamiento configurado; el experimento no se creó. Esfuerzos admitidos: low, medium.',
  )
})

it.each([
  ['details ausente', undefined],
  ['supportedEfforts no es lista', { supportedEfforts: 'high' }],
  ['supportedEfforts con no cadenas', { supportedEfforts: ['low', 3] }],
  ['supportedEfforts vacío', { supportedEfforts: [] }],
])('WI-CONSOLE-021: REASONING_EFFORT_UNSUPPORTED tolera %s sin inventar esfuerzos', (_label, details) => {
  const message = bindingErrorMessage(new ApiError('crudo', 422, 'c', 'REASONING_EFFORT_UNSUPPORTED', details))
  expect(message).toBe('El modelo no admite el esfuerzo de razonamiento configurado; el experimento no se creó.')
  expect(message).not.toMatch(/Esfuerzos admitidos/)
})

it('WI-CONSOLE-021: 422 UNSUPPORTED_PROJECT, 503 LLM_PROVIDER_UNAVAILABLE indicando reintento, y los 409 de OE2 tienen mensaje propio', () => {
  expect(bindingErrorMessage(new ApiError('crudo', 422, 'c', 'UNSUPPORTED_PROJECT'))).toBe('Este proyecto no tiene framework JEST, VITEST o PHPUNIT detectado.')
  const llm = bindingErrorMessage(new ApiError('crudo', 503, 'c', 'LLM_PROVIDER_UNAVAILABLE'))
  expect(llm).toMatch(/Inténtalo de nuevo/)
  expect(llm).not.toMatch(/no pudo completar/)
  expect(bindingErrorMessage(new ApiError('crudo', 409, 'c', 'ANALYSIS_NOT_FINISHED'))).toMatch(/todavía no terminó/)
  expect(bindingErrorMessage(new ApiError('crudo', 409, 'c', 'RETRIEVAL_COMPARISON_FAILED'))).toMatch(/detalle del estado/)
})

it('isLlmProviderUnavailable solo reconoce el 503 de la creación de experimentos', () => {
  expect(isLlmProviderUnavailable(new ApiError('x', 503, 'c', 'LLM_PROVIDER_UNAVAILABLE'))).toBe(true)
  expect(isLlmProviderUnavailable(new ApiError('x', 422, 'c', 'LLM_PROVIDER_UNAVAILABLE'))).toBe(false)
  expect(isLlmProviderUnavailable(new Error('x'))).toBe(false)
})
