import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppLoadErrorScreen } from './AppLoadErrorScreen'

describe('AppLoadErrorScreen (WI-CONSOLE-047, ciclo 2)', () => {
  it('anuncia el fallo de carga con role alert, en español, y ofrece recargar la página', () => {
    render(<AppLoadErrorScreen />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Falta un módulo de la aplicación.')
    expect(alert).toHaveTextContent('Recarga la página.')
    expect(screen.getByRole('button', { name: 'Recargar página' })).toBeInTheDocument()
  })

  it('usa el título de documento en español, mueve el foco al contenedor y no muestra enlaces', () => {
    render(<AppLoadErrorScreen />)
    expect(document.title).toBe('No se pudo cargar la aplicación · RAG Test Studio')
    expect(screen.getByRole('main')).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1, name: 'No se pudo cargar la aplicación' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
