import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  /** Contenido a la derecha del encabezado (sellos, acciones). */
  aside?: ReactNode
  className?: string
  titleId?: string
}

/** Encabezado estándar de página: sobretítulo, `h1`, descripción y un área lateral opcional. */
export function PageHeader({ eyebrow, title, description, aside, className, titleId }: PageHeaderProps) {
  return (
    <div className={['page-heading', className ?? ''].filter(Boolean).join(' ')}>
      <div>
        {eyebrow !== undefined && <p className="eyebrow">{eyebrow}</p>}
        <h1 id={titleId}>{title}</h1>
        {description !== undefined && <p>{description}</p>}
      </div>
      {aside}
    </div>
  )
}
