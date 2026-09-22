import { expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { bindingErrorMessage, errorCorrelationId, isGitHubAccessRenewalRequired, isProjectNotFound, isVerificationUnavailable, reactivateErrorMessage } from './errors'

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

it('isVerificationUnavailable solo aplica al 503 GITHUB_VERIFICATION_UNAVAILABLE', () => {
  expect(isVerificationUnavailable(new ApiError('x', 503, 'c', 'GITHUB_VERIFICATION_UNAVAILABLE'))).toBe(true)
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
