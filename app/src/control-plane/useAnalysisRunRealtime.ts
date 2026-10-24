import { useContext, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { isMockDataSource } from '../api/dataSource'
import { subscribeAnalysisRunUpdates } from '../api/socket'
import { AuthContext } from '../auth/authContext'
import { controlPlaneKeys } from './queries'

/**
 * Complemento en tiempo real del detalle de un AnalysisRun (INTEROP-2.19 §6.6). Cada aviso `analysis-run:update`, y cada
 * reconexión, solo invalida la consulta `controlPlaneKeys.run(id)`: la fuente de verdad es el GET `/analysis-runs/{id}` y el
 * DTO del aviso no se escribe en la caché. Propuestas y traza no se invalidan. El detalle tiene además un polling de respaldo
 * mientras el Run está en curso (`useAnalysisRun` con `pollWhileInProgress`); el tiempo real sigue solo invalidando el GET (una
 * invalidación durante una lectura en vuelo la cancela y relanza: a lo sumo una petición extra, nunca concurrente; best effort,
 * sin replay). En modo mock o sin sesión no hace nada; al
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
