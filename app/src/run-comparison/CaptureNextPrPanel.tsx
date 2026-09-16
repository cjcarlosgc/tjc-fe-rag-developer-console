import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { armCaptureNextPr, disarmCaptureNextPr, getCaptureNextPrState, simulateNextEligiblePullRequest } from './speculative/captureNextPr'

const CAPTURE_NEXT_PR_QUERY_KEY = (projectId: string) => ['run-comparison', 'speculative', 'capture-next-pr', projectId]

/**
 * PROPUESTA — HU49, ver speculative/captureNextPr.ts. Vive en `ExperimentPage`
 * ("Modo experimental"), separado del flujo legacy de selección manual de
 * target (HU19) que sigue debajo — reusa el modelo de HU48 (`AnalysisRun`),
 * no un motor experimental paralelo. Al capturar, navega a
 * `RunComparisonPage` (HU48), que arranca la comparación sola.
 */
export function CaptureNextPrPanel({ projectId }: { projectId: string }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [captureError, setCaptureError] = useState<string | null>(null)
  const stateQuery = useQuery({
    queryKey: CAPTURE_NEXT_PR_QUERY_KEY(projectId),
    queryFn: () => getCaptureNextPrState(projectId),
    enabled: Boolean(projectId),
  })

  const armMutation = useMutation({
    mutationFn: () => armCaptureNextPr(projectId),
    onSuccess: (state) => queryClient.setQueryData(CAPTURE_NEXT_PR_QUERY_KEY(projectId), state),
  })
  const disarmMutation = useMutation({
    mutationFn: () => disarmCaptureNextPr(projectId),
    onSuccess: (state) => queryClient.setQueryData(CAPTURE_NEXT_PR_QUERY_KEY(projectId), state),
  })
  const captureMutation = useMutation({
    mutationFn: () => simulateNextEligiblePullRequest(projectId),
    onSuccess: (run) => navigate(`/projects/${projectId}/runs/${run.id}/comparison`),
    onError: (error: Error) => setCaptureError(error.message),
  })

  if (stateQuery.isPending || stateQuery.isError) return null
  const armed = stateQuery.data.status === 'ARMED'

  return <div className="panel">
    <div className="section-heading">
      <div>
        <h2>Capture next PR</h2>
        <p>Arma la captura del próximo Analysis Run elegible que dispare un PR real, para demostrar en vivo que la comparación no está precalculada. No es un modo permanente: se apaga solo tras capturar uno.</p>
      </div>
      <span className="proposal-stamp" title="HU49 — propuesta sin contrato aprobado, depende de HU48 (sin adapter live todavía)">PROPUESTA</span>
    </div>
    {!armed && <div className="run-actions"><button type="button" className="button secondary" onClick={() => armMutation.mutate()} disabled={armMutation.isPending}>{armMutation.isPending ? 'Armando…' : 'Armar captura'}</button></div>}
    {armed && <>
      <p className="empty-inline-note"><span className="live-indicator" /> Esperando el próximo PR elegible…</p>
      <div className="run-actions">
        <button type="button" className="button secondary" onClick={() => disarmMutation.mutate()} disabled={disarmMutation.isPending}>Cancelar</button>
        <button type="button" className="button primary" onClick={() => captureMutation.mutate()} disabled={captureMutation.isPending}>{captureMutation.isPending ? 'Capturando…' : 'Simular llegada del PR (demo)'}</button>
      </div>
    </>}
    {captureError && <p className="inline-error" role="alert">{captureError}</p>}
  </div>
}
