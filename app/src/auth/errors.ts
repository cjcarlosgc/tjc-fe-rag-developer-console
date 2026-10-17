import { ApiError } from '../api/client'

/** HU62: el fallo de OAuth/GitHub nunca expone el detalle del proveedor. */
export const githubLoginErrorMessage = 'No pudimos completar el acceso con GitHub. Inténtalo de nuevo.'

export const githubSignOutErrorMessage = 'No pudimos cerrar la sesión en el servidor. Cierra el navegador o inténtalo de nuevo.'

export const sessionExpiredMessage = 'Tu sesión expiró. Inicia sesión nuevamente para continuar.'

/** `GITHUB_IDENTITY_REQUIRED` es terminal (INTEROP-2.4 §6.13): no se ofrece reintento ni redirección automática. */
export const githubIdentityRequiredMessage = 'Tu cuenta anterior de acceso por correo ya no se usa. Entra con GitHub. Si vuelves a ver este aviso, esa cuenta de GitHub no quedó asociada a tu acceso: pide ayuda al equipo que administra la plataforma.'

export const identityUnavailableMessage = 'No pudimos verificar tu identidad en este momento. Tu sesión sigue activa; inténtalo de nuevo en unos segundos.'

const codeMessages: Record<string, string> = {
  AUTH_REQUIRED: sessionExpiredMessage,
  INVALID_ACCESS_TOKEN: sessionExpiredMessage,
  GITHUB_IDENTITY_REQUIRED: githubIdentityRequiredMessage,
  IDENTITY_UNAVAILABLE: identityUnavailableMessage,
}

export function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.code && codeMessages[error.code]) return codeMessages[error.code]
  if (error instanceof Error && error.message) return error.message
  return githubLoginErrorMessage
}
