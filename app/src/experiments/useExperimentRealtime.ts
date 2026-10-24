import { useContext, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isMockDataSource } from '../api/dataSource'
import { subscribeExperimentUpdates } from '../api/socket'
import { AuthContext } from '../auth/authContext'

/**
 * Complemento en tiempo real de la pantalla de experimento (INTEROP-2.18 §6.6). Cada aviso, y cada reconexión, solo invalida la
 * consulta `['experiments', id]`: la fuente de verdad es el GET `/experiments/{id}` y el DTO no se escribe en la caché. El
 * `refetchInterval` de `ExperimentPage` sigue como base. En modo mock o sin sesión no hace nada; al desmontar o cerrar sesión
 * la suscripción se libera.
 */
export function useExperimentRealtime(experimentId: string | null | undefined): void {
  const queryClient = useQueryClient()
  const userId = useContext(AuthContext)?.session?.user.id ?? null

  useEffect(() => {
    if (!experimentId || !userId || isMockDataSource()) return
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: ['experiments', experimentId] })
    }
    return subscribeExperimentUpdates(experimentId, refresh, refresh)
  }, [experimentId, userId, queryClient])
}
