import { useEffect, useRef, useState } from 'react'
import { isMockDataSource } from '../api/dataSource'
import { bindingErrorMessage, errorCorrelationId } from '../control-plane/errors'
import { isTraceNotFinished } from '../control-plane/operationalTraceErrors'
import { getEvidence } from './api'
import { downloadEvidenceJson, evidenceFileName } from './download'
import { evidenceRetryDelayMs, shouldRetryEvidence } from './queries'
import type { EvidenceKind } from './types'

export const EVIDENCE_NOT_FINISHED_MESSAGE = 'La evidencia estará disponible cuando termine el proceso'
export const EVIDENCE_SCOPE_NOTE = 'Paquete técnico de Core; no es el registro académico.'
export const EVIDENCE_PENDING_NOTE = 'Disponible cuando el proceso termine.'
const DEFAULT_MOCK_LABEL = 'DEMO · DATOS SIMULADOS'

type Phase = 'idle' | 'loading' | 'ready' | 'notFinished' | 'error'

export interface EvidenceDownloadProps {
  kind: EvidenceKind
  subjectId: string
  /** Solo en estado terminal se puede descargar; antes el botón queda deshabilitado con texto explicativo. */
  terminal: boolean
  /** Rótulo que se muestra cuando la fuente es mock. */
  mockLabel?: string
}

const wait = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms) })

/**
 * INTEROP-2.7 §6.16 (WI-CONSOLE-017, Corte B). Descarga de evidencia JSON versionada para cualquier rol de Project (Reader incluido).
 * La carga no usa la caché de React Query: el bundle puede contener fragmentos de código y se descarga y se descarta.
 */
export function EvidenceDownload({ kind, subjectId, terminal, mockLabel = DEFAULT_MOCK_LABEL }: EvidenceDownloadProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [retryable, setRetryable] = useState(false)
  const [schemaVersion, setSchemaVersion] = useState<string | null>(null)
  const [failure, setFailure] = useState<unknown>(null)
  const busy = useRef(false)
  const mounted = useRef(true)
  const hintId = `evidence-hint-${kind.toLowerCase()}`
  const isMock = isMockDataSource()

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  async function load() {
    if (!terminal || busy.current) return
    busy.current = true
    setPhase('loading')
    let failures = 0
    try {
      for (;;) {
        try {
          const { raw, bundle } = await getEvidence(kind, subjectId)
          downloadEvidenceJson(raw, evidenceFileName(kind, subjectId))
          if (!mounted.current) return
          setSchemaVersion(bundle.schemaVersion)
          setFailure(null)
          setRetryable(false)
          setPhase('ready')
          return
        } catch (caught) {
          if (shouldRetryEvidence(failures, caught)) {
            failures += 1
            await wait(evidenceRetryDelayMs())
            if (!mounted.current) return
            continue
          }
          if (!mounted.current) return
          setRetryable(true)
          if (isTraceNotFinished(caught)) {
            setFailure(null)
            setPhase('notFinished')
          } else {
            setFailure(caught)
            setPhase('error')
          }
          return
        }
      }
    } finally {
      busy.current = false
    }
  }

  const loading = phase === 'loading'
  const unavailable = !terminal

  // La región de estado solo existe con texto: las páginas de resultado ya tienen su propio role=status único.
  const statusText = loading ? 'Generando evidencia…' : phase === 'notFinished' ? EVIDENCE_NOT_FINISHED_MESSAGE : phase === 'ready' ? `Descarga preparada: ${evidenceFileName(kind, subjectId)}` : null

  return <div className="evidence-download">
    <div className="evidence-download-actions">
      <button
        type="button"
        className="button secondary evidence-button"
        aria-disabled={unavailable || loading ? true : undefined}
        aria-describedby={unavailable ? hintId : undefined}
        onClick={() => void load()}
      >
        Descargar evidencia (JSON)
      </button>
      {retryable && (
        <button type="button" className="button secondary evidence-button" aria-disabled={loading ? true : undefined} onClick={() => void load()}>
          Reintentar
        </button>
      )}
      {isMock && <span className="demo-stamp">{mockLabel}</span>}
    </div>
    {unavailable && <p id={hintId} className="field-hint">{EVIDENCE_PENDING_NOTE}</p>}
    <p className="field-hint">{EVIDENCE_SCOPE_NOTE}</p>
    {statusText && <div role="status" className="evidence-status">{statusText}</div>}
    {phase === 'ready' && schemaVersion && <p className="field-hint">Esquema de evidencia: v{schemaVersion}</p>}
    {phase === 'error' && <p className="inline-error" role="alert">{bindingErrorMessage(failure)}{errorCorrelationId(failure) && <> · Correlation ID: <code>{errorCorrelationId(failure)}</code></>}</p>}
  </div>
}
