import { describe, expect, it } from 'vitest'
import { resolveConfigurationError } from './configurationError'

describe('resolveConfigurationError', () => {
  it('en live, una URL no válida nombra la variable y el motivo', () => {
    expect(resolveConfigurationError({ dataSource: 'live', coreApiUrl: 'core.example.test' })).toEqual({
      variable: 'VITE_CORE_API_URL',
      reason: 'invalid-url',
    })
  })

  it('en live, un protocolo no permitido se distingue de una URL mal formada', () => {
    expect(resolveConfigurationError({ dataSource: 'live', coreApiUrl: 'ftp://core.test' })).toEqual({
      variable: 'VITE_CORE_API_URL',
      reason: 'unsupported-protocol',
    })
    expect(resolveConfigurationError({ dataSource: 'live', coreApiUrl: 'javascript:alert(1)' })?.reason).toBe('unsupported-protocol')
  })

  it('el error no contiene el valor de la variable, ni siquiera con credenciales', () => {
    const issue = resolveConfigurationError({ dataSource: 'live', coreApiUrl: 'ftp://user:secret@host' })
    expect(issue).not.toBeNull()
    expect(JSON.stringify(issue)).not.toMatch(/secret|user|ftp|host/)
  })

  it('en live, vacía, ausente o válida no es error', () => {
    expect(resolveConfigurationError({ dataSource: 'live', coreApiUrl: undefined })).toBeNull()
    expect(resolveConfigurationError({ dataSource: 'live', coreApiUrl: '   ' })).toBeNull()
    expect(resolveConfigurationError({ dataSource: 'live', coreApiUrl: 'https://core.example.test/' })).toBeNull()
  })

  it('en mock nunca bloquea, aunque la URL sea inválida', () => {
    expect(resolveConfigurationError({ dataSource: 'mock', coreApiUrl: 'ftp://user:secret@host' })).toBeNull()
    expect(resolveConfigurationError({ dataSource: 'mock', coreApiUrl: 'core.example.test' })).toBeNull()
    expect(resolveConfigurationError({ dataSource: 'mock', coreApiUrl: undefined })).toBeNull()
  })
})
