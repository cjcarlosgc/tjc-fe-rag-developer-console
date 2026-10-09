import { useEffect, useRef, useState } from 'react'
import { copyToClipboard } from './clipboard'

type CopyState = 'idle' | 'copied' | 'failed'

/** Tiempo que la confirmación permanece visible antes de volver a idle. */
export const COPY_STATUS_RESET_MS = 2500

interface CopyButtonProps {
  /** Valor a copiar (id completo, sin truncar). */
  value: string
  /** Nombre del dato para el nombre accesible: «Copiar retrieval_id ret_…». Incluye el valor para que sea único entre targets. */
  label: string
}

/** Botón de copia accesible: área >= 40x40, confirmación anunciada en `role="status"` y fallback si el portapapeles falla.
 *  La confirmación vuelve a idle tras COPY_STATUS_RESET_MS; cada copia cambia la clave del mensaje para reanunciarse. */
export function CopyButton({ value, label }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>('idle')
  const [attempt, setAttempt] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      if (timerRef.current !== null) clearTimeout(timerRef.current)
    }
  }, [])

  async function handleCopy() {
    const ok = await copyToClipboard(value)
    if (!mountedRef.current) return
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    setAttempt((n) => n + 1)
    setState(ok ? 'copied' : 'failed')
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      if (mountedRef.current) setState('idle')
    }, COPY_STATUS_RESET_MS)
  }

  const message = state === 'copied' ? 'Copiado' : state === 'failed' ? 'No se pudo copiar' : ''

  return <span className="copy-control">
    <button type="button" className="copy-button" aria-label={`Copiar ${label} ${value}`} onClick={() => void handleCopy()}>
      Copiar
    </button>
    <span className="copy-status" role="status" aria-live="polite">
      {message ? <span key={attempt}>{message}</span> : null}
    </span>
  </span>
}
