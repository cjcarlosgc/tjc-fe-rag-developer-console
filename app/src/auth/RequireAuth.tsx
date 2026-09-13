import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../ui/Feedback'
import { useAuth } from './useAuth'

/** Guard de rutas: exige sesión y conserva la ruta de origen en `state.from` (navegación en cliente) y en `?returnTo=` (sobrevive un deep-link con recarga completa, ej. HU38) para volver tras el login. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState label="Verificando sesión…" />
  if (status !== 'authenticated') {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?returnTo=${returnTo}`} replace state={{ from: location }} />
  }
  return <Outlet />
}
