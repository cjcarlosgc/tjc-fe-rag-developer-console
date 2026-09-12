import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { LoadingState } from '../ui/Feedback'
import { useAuth } from './useAuth'

/** Guard de rutas: exige sesión y conserva la ruta de origen en `state.from` para volver tras el login. */
export function RequireAuth() {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') return <LoadingState label="Verificando sesión…" />
  if (status !== 'authenticated') return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
