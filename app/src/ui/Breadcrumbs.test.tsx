import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, test } from 'vitest'
import { Breadcrumbs } from './Breadcrumbs'

test('HU26: enlaza cada nivel salvo el actual, que queda marcado como página', () => {
  render(<MemoryRouter><Breadcrumbs items={[{ label: 'Proyectos', to: '/' }, { label: 'checkout-service', to: '/projects/p-1' }, { label: 'Historial de generaciones' }]} /></MemoryRouter>)

  const proyectosLink = screen.getByRole('link', { name: 'Proyectos' })
  expect(proyectosLink).toHaveAttribute('href', '/')
  const projectLink = screen.getByRole('link', { name: 'checkout-service' })
  expect(projectLink).toHaveAttribute('href', '/projects/p-1')

  const current = screen.getByText('Historial de generaciones')
  expect(current.tagName).toBe('SPAN')
  expect(current).toHaveAttribute('aria-current', 'page')
  expect(screen.queryByRole('link', { name: 'Historial de generaciones' })).not.toBeInTheDocument()
})

test('un único nivel se muestra como página actual, sin separador', () => {
  render(<MemoryRouter><Breadcrumbs items={[{ label: 'Proyectos' }]} /></MemoryRouter>)
  expect(screen.getByText('Proyectos')).toHaveAttribute('aria-current', 'page')
  expect(screen.queryByText('/')).not.toBeInTheDocument()
})
