import { useEffect } from 'react'
import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { NOT_FOUND_TITLE, titledDocument } from './routeTitles'

/** Página para rutas inexistentes (404). Vive dentro del `AppShell`, así que conserva la navegación. */
export function NotFoundPage() {
  useEffect(() => {
    document.title = titledDocument(NOT_FOUND_TITLE)
  }, [])
  return (
    <section aria-labelledby="not-found-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Error 404</p>
          <h1 id="not-found-title">{NOT_FOUND_TITLE}</h1>
        </div>
      </div>
      <div className="empty-state" role="status">
        <p>La dirección que abriste no existe o ya no está disponible.</p>
        <Link className="button primary button-link" to="/">
          Volver a Projects
        </Link>
      </div>
    </section>
  )
}

/** `errorElement` del router: un fallo de render o de ruta muestra un mensaje en español en lugar de la pantalla técnica por defecto. */
export function RouteError() {
  const error = useRouteError()
  useEffect(() => {
    document.title = titledDocument('Algo salió mal')
  }, [])
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  return (
    <main className="content" tabIndex={-1}>
      <div className="feedback error-state" role="alert">
        <strong>Algo salió mal</strong>
        <p>La página tuvo un error inesperado. Puedes volver al inicio e intentarlo de nuevo.</p>
        <Link className="button primary button-link" to="/">
          Volver a Projects
        </Link>
      </div>
    </main>
  )
}
