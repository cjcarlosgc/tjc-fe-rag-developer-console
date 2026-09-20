import { expect, it } from 'vitest'
import { ApiError } from '../api/client'
import { bindingErrorMessage, errorCorrelationId, isProjectNotFound } from './errors'

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
