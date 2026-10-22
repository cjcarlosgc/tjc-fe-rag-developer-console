import { useEffect, useRef } from 'react'
import { titledDocument } from '../ui/routeTitles'

const TITLE = 'No se pudo cargar la aplicación'

/**
 * Pantalla local de `main.tsx` cuando falla la carga diferida de `router` o de `AuthProvider` (corte de red o una versión nueva
 * publicada mientras la pestaña seguía abierta). Se muestra en lugar de una página en blanco. No tiene enlaces al router.
 */
export function AppLoadErrorScreen() {
  const containerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    document.title = titledDocument(TITLE)
    containerRef.current?.focus()
  }, [])
  return (
    <main className="content" tabIndex={-1} ref={containerRef}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Carga</p>
          <h1>{TITLE}</h1>
        </div>
      </div>
      <div className="feedback error-state" role="alert">
        <strong>Falta un módulo de la aplicación.</strong>
        <p>Puede deberse a un corte de red o a una versión nueva publicada mientras tenías esta pestaña abierta.</p>
        <p>Recarga la página. Si el problema continúa, revisa tu conexión y vuelve a intentarlo más tarde.</p>
        <div className="run-actions">
          <button className="button primary" type="button" onClick={() => window.location.reload()}>
            Recargar página
          </button>
        </div>
      </div>
    </main>
  )
}
