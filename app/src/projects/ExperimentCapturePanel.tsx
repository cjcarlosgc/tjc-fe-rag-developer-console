import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { isMockDataSource } from '../api/dataSource'
import {
  EXPERIMENT_CAPTURE_WARNING,
  errorCorrelationId,
  experimentCaptureErrorMessage,
  isExperimentCaptureUnsupported,
} from '../control-plane/errors'
import { ErrorNote, ErrorState, LoadingState } from '../ui/Feedback'
import { StatusBadge } from '../ui/StatusBadge'
import { hasRole } from './roles'
import { useArmExperimentCapture, useDisarmExperimentCapture, useExperimentCaptures } from './queries'
import type { ProjectRole } from './types'

interface ExperimentCapturePanelProps {
  projectId: string
  workspaceId: string
  role: ProjectRole
}

/**
 * INTEROP-2.25 (§6.17, HU18): captura armada de experimentación del Project, con su propia consulta.
 * Si falla o Core no tiene la ruta, solo esta sección lo muestra; el resto del Project no depende de ella.
 */
export function ExperimentCapturePanel({ projectId, workspaceId, role }: ExperimentCapturePanelProps) {
  const mock = isMockDataSource()
  const canManage = hasRole(role, 'MAINTAINER')
  const captures = useExperimentCaptures(projectId)
  const arm = useArmExperimentCapture(projectId)
  const disarm = useDisarmExperimentCapture(projectId)
  const armButtonRef = useRef<HTMLButtonElement>(null)
  const disarmButtonRef = useRef<HTMLButtonElement>(null)
  // Foco tras la acción: el botón que aparece en su lugar (Desarmar tras armar; Armar captura tras desarmar).
  const focusNextRef = useRef<'arm' | 'disarm' | null>(null)

  // Estado derivado: la captura más reciente decide; RESERVED/DISARMED/ninguna = no armada.
  const latest = captures.data?.items[0]
  const armed = latest?.status === 'ARMED' ? latest : null
  const lastReserved = latest?.status === 'RESERVED' ? latest : null
  const known = captures.isSuccess
  const unsupported = captures.isError && isExperimentCaptureUnsupported(captures.error)
  const busy = arm.isPending || disarm.isPending
  const armedId = armed?.captureId ?? null

  useEffect(() => {
    if (focusNextRef.current === 'disarm') disarmButtonRef.current?.focus()
    else if (focusNextRef.current === 'arm') armButtonRef.current?.focus()
    focusNextRef.current = null
  }, [armedId])

  function handleArm() {
    focusNextRef.current = 'disarm'
    arm.mutate(undefined, {
      onError: () => {
        focusNextRef.current = null
      },
    })
  }

  function handleDisarm() {
    focusNextRef.current = 'arm'
    disarm.mutate(undefined, {
      onError: () => {
        focusNextRef.current = null
      },
    })
  }

  return (
    <section className="panel experiment-capture-panel" aria-labelledby="experiment-capture-heading">
      <div className="section-heading">
        <div>
          <h2 id="experiment-capture-heading">Captura de experimentación</h2>
          <p>Reserva el siguiente PR elegible de este Project para experimentación.</p>
        </div>
        {mock && <span className="demo-stamp">DEMO · DATOS SIMULADOS</span>}
      </div>

      {unsupported ? (
        <div className="empty-inline">
          <p>Captura de experimentación no disponible en esta versión de Core.</p>
        </div>
      ) : (
        <>
          {captures.isPending && <LoadingState label="Cargando captura de experimentación…" />}
          {captures.isError && (
            <ErrorState
              message="No se pudo cargar la captura de experimentación."
              correlationId={errorCorrelationId(captures.error)}
              onRetry={() => void captures.refetch()}
            />
          )}

          {known && (
            <div className="experiment-capture-status">
              <StatusBadge tone={armed ? 'warn' : 'muted'}>{armed ? 'Armada' : 'Sin captura armada'}</StatusBadge>
              {!latest && <p>Sin capturas armadas.</p>}
              {lastReserved && (
                <p className="field-hint">
                  Última captura reservada para un Run:{' '}
                  {lastReserved.reservedAnalysisRunId ? (
                    <Link
                      to={`/projects/${projectId}/runs/${lastReserved.reservedAnalysisRunId}?workspaceId=${encodeURIComponent(workspaceId)}`}
                    >
                      ver el Run reservado
                    </Link>
                  ) : (
                    'sin Run asociado'
                  )}
                  .
                </p>
              )}
            </div>
          )}

          {known && armed && (
            <div className="experiment-capture-warning" role="status">
              <p>{EXPERIMENT_CAPTURE_WARNING}</p>
              {canManage && (
                <button ref={disarmButtonRef} type="button" className="button secondary" disabled={busy} onClick={handleDisarm}>
                  {disarm.isPending ? 'Desarmando…' : 'Desarmar'}
                </button>
              )}
            </div>
          )}

          {!canManage && <p className="field-hint">Solo Maintainer o superior pueden armar o desarmar capturas.</p>}

          {canManage && !armed && (
            <div className="run-actions">
              <button ref={armButtonRef} type="button" className="button primary" disabled={!known || busy} onClick={handleArm}>
                {arm.isPending ? 'Armando…' : 'Armar captura'}
              </button>
            </div>
          )}

          {arm.isError && <ErrorNote message={experimentCaptureErrorMessage(arm.error)} correlationId={errorCorrelationId(arm.error)} />}
          {disarm.isError && (
            <ErrorNote message={experimentCaptureErrorMessage(disarm.error)} correlationId={errorCorrelationId(disarm.error)} />
          )}
        </>
      )}
    </section>
  )
}
