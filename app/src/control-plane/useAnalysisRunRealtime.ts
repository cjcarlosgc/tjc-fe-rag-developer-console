import { useContext, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isMockDataSource } from '../api/dataSource'
import { subscribeAnalysisRunUpdates } from '../api/socket'
import { AuthContext } from '../auth/authContext'
import { controlPlaneKeys } from './queries'

/**
 * Complemento en tiempo real del detalle de un AnalysisRun (INTEROP-2.19 §6.6). Cada aviso `analysis-run:update`, y cada
 * reconexión, solo invalida la consulta `controlPlaneKeys.run(id)`: la fuente de verdad es el GET `/analysis-runs/{id}` y el
 * DTO del aviso no se escribe en la caché. Propuestas y traza no se invalidan. El detalle no tiene polling HTTP del Run, así que
 * el tiempo real es su única actualización en vivo (best effort, sin replay). En modo mock o sin sesión no hace nada; al
 * desmontar, cambiar de Run o cerrar sesión la suscripción se libera.
 */
export function useAnalysisRunRealtime(analysisRunId: string | null | undefined): void {
  const queryClient = useQueryClient()
  const userId = useContext(AuthContext)?.session?.user.id ?? null

  useEffect(() => {
    if (!analysisRunId || !userId || isMockDataSource()) return
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: controlPlaneKeys.run(analysisRunId) })
    }
    return subscribeAnalysisRunUpdates(analysisRunId, refresh, refresh)
  }, [analysisRunId, userId, queryClient])
}
