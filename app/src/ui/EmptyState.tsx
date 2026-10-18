import type { ReactNode } from 'react'

interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  /** Acciones o contenido adicional bajo la descripción (botones, enlaces). */
  children?: ReactNode
}

/** Estado vacío en línea (sin datos que mostrar): título, descripción opcional y acciones opcionales. */
export function EmptyState({ title, description, children }: EmptyStateProps) {
  return (
    <div className="empty-inline">
      <strong>{title}</strong>
      {description !== undefined && <p>{description}</p>}
      {children}
    </div>
  )
}
