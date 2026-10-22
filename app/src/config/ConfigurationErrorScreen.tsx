import { useEffect, useRef } from 'react'
import type { BaseUrlIssue } from '../api/baseUrl'
import { titledDocument } from '../ui/routeTitles'
import type { ConfigurationIssue } from './configurationError'

const TITLE = 'Configuración no válida'

const REASON_TEXT: Record<BaseUrlIssue, string> = {
  'invalid-url': 'no es una URL válida',
  'unsupported-protocol': 'usa un protocolo no permitido',
}

/**
 * Pantalla local de `main.tsx` cuando la configuración live no es válida. Se muestra antes de cargar el router, así que no
 * tiene enlaces ni navegación. No recibe ni muestra el valor de la variable (puede traer credenciales).
 */
export function ConfigurationErrorScreen({ issue }: { issue: ConfigurationIssue }) {
  const containerRef = useRef<HTMLElement>(null)
  useEffect(() => {
    document.title = titledDocument(TITLE)
    containerRef.current?.focus()
  }, [])
  return (
    <main className="content" tabIndex={-1} ref={containerRef}>
      <div className="page-heading">
        <div>
          <p className="eyebrow">Configuración</p>
          <h1>{TITLE}</h1>
        </div>
      </div>
      <div className="feedback error-state" role="alert">
        <strong>
          {issue.variable} {REASON_TEXT[issue.reason]}
        </strong>
        <p>La Console necesita una URL con el formato http(s)://host[:puerto] para conectarse a RAG Core.</p>
        <p>
          Corrige el valor de {issue.variable} en el archivo .env o en la variable de entorno del despliegue, y después reinicia{' '}
          <code>pnpm dev</code> o vuelve a construir la aplicación.
        </p>
        <p>
          Para explorar la demostración sin RAG Core, define <code>VITE_DATA_SOURCE=mock</code>.
        </p>
      </div>
    </main>
  )
}
