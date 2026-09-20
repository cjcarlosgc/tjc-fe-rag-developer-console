import { ApiError } from '../api/client'

/** spec.md HU29: los errores de credencial nunca revelan si una cuenta existe. */
export const invalidCredentialsMessage = 'No pudimos verificar tus credenciales. Revisa el correo y la contraseña.'

export const githubConnectionErrorMessage = 'No pudimos conectar tu cuenta de GitHub. Inténtalo de nuevo.'

const sessionExpiredMessage = 'Tu sesión expiró. Inicia sesión nuevamente para continuar.'

const codeMessages: Record<string, string> = {
  AUTH_REQUIRED: sessionExpiredMessage,
  INVALID_ACCESS_TOKEN: sessionExpiredMessage,
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code && codeMessages[error.code]) return codeMessages[error.code]
  if (error instanceof Error && error.message) return error.message
  return invalidCredentialsMessage
}
