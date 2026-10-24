import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'
import { PageHeader } from './PageHeader'
import { StatusBadge } from './StatusBadge'

describe('StatusBadge', () => {
  it('aplica la clase base, el tono y la clase de estado ya resuelta', () => {
    render(
      <StatusBadge tone="muted" statusClass="status-success">
        Activo
      </StatusBadge>,
    )
    expect(screen.getByText('Activo')).toHaveClass('status-badge', 'status-muted', 'status-success')
  })

  it('sin tono conserva solo el estilo base', () => {
    render(<StatusBadge>Neutro</StatusBadge>)
    expect(screen.getByText('Neutro').className).toBe('status-badge')
  })
})

describe('EmptyState', () => {
  it('muestra título, descripción y acciones', () => {
    render(
      <EmptyState title="Sin datos" description="Intenta otra búsqueda.">
        <button type="button">Reintentar</button>
      </EmptyState>,
    )
    expect(screen.getByText('Sin datos').tagName).toBe('STRONG')
    expect(screen.getByText('Intenta otra búsqueda.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('omite la descripción cuando no se da', () => {
    const { container } = render(<EmptyState title="Vacío" />)
    expect(container.querySelector('p')).toBeNull()
  })
})

describe('PageHeader', () => {
  it('renderiza sobretítulo, h1, descripción y el área lateral', () => {
    render(<PageHeader eyebrow="Control plane" title="Runs" description="Listado." aside={<span>sello</span>} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Runs' })).toBeInTheDocument()
    expect(screen.getByText('Control plane')).toHaveClass('eyebrow')
    expect(screen.getByText('Listado.')).toBeInTheDocument()
    expect(screen.getByText('sello')).toBeInTheDocument()
  })
})
