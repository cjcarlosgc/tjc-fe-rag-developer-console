import type { ReactNode } from 'react'

export type StatusTone = 'success' | 'warn' | 'danger' | 'muted'

interface StatusBadgeProps {
  /** Tono semántico (design-system): éxito/validado, advertencia/revisión humana, falla, neutro. Sin tono, estilo base. */
  tone?: StatusTone
  /** Clase `status-*` ya resuelta (p. ej. por `analysisRunStatusClass`); se aplica además del tono. */
  statusClass?: string
  className?: string
  children: ReactNode
}

/** Insignia de estado: concentra la clase base `status-badge` y la semántica de color para no repetirla en cada pantalla. */
export function StatusBadge({ tone, statusClass, className, children }: StatusBadgeProps) {
  const classes = ['status-badge', tone ? `status-${tone}` : '', statusClass ?? '', className ?? ''].filter(Boolean).join(' ')
  return <span className={classes}>{children}</span>
}
