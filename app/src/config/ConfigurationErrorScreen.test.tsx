import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ConfigurationErrorScreen } from './ConfigurationErrorScreen'
import { resolveConfigurationError } from './configurationError'

describe('ConfigurationErrorScreen', () => {
  it('anuncia el error con role alert, en español, y da el paso a seguir', () => {
    render(<ConfigurationErrorScreen issue={{ variable: 'VITE_CORE_API_URL', reason: 'invalid-url' }} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('VITE_CORE_API_URL no es una URL válida')
    expect(alert).toHaveTextContent('http(s)://host[:puerto]')
    expect(alert).toHaveTextContent('reinicia pnpm dev o vuelve a construir')
    expect(alert).toHaveTextContent('VITE_DATA_SOURCE=mock')
  })

  it('describe el protocolo no permitido sin mostrar el valor', () => {
    render(<ConfigurationErrorScreen issue={{ variable: 'VITE_CORE_API_URL', reason: 'unsupported-protocol' }} />)
    expect(screen.getByRole('alert')).toHaveTextContent('usa un protocolo no permitido')
  })

  it('no muestra el valor crudo de una URL con credenciales', () => {
    const issue = resolveConfigurationError({ dataSource: 'live', coreApiUrl: 'ftp://user:secret@host' })
    if (!issue) throw new Error('se esperaba un error de configuración')
    const { container } = render(<ConfigurationErrorScreen issue={issue} />)
    const text = container.textContent ?? ''
    expect(text).not.toContain('secret')
    expect(text).not.toContain('ftp://')
    expect(text).not.toContain('user:')
  })

  it('usa el título de documento en español y mueve el foco al contenedor', () => {
    render(<ConfigurationErrorScreen issue={{ variable: 'VITE_CORE_API_URL', reason: 'invalid-url' }} />)
    expect(document.title).toBe('Configuración no válida · RAG Test Studio')
    expect(screen.getByRole('main')).toHaveFocus()
    expect(screen.getByRole('heading', { level: 1, name: 'Configuración no válida' })).toBeInTheDocument()
  })
})
