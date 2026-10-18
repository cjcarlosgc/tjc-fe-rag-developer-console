import { describe, expect, it } from 'vitest'
import { safePublicationUrl } from './publicationView'

describe('safePublicationUrl', () => {
  it('acepta solo http y https', () => {
    expect(safePublicationUrl('https://github.com/acme/checkout-service/pull/145')).toBe(
      'https://github.com/acme/checkout-service/pull/145',
    )
    expect(safePublicationUrl('http://localhost:8080/pull/1')).toBe('http://localhost:8080/pull/1')
  })

  it('no enlaza protocolos ajenos, URLs inválidas ni valores vacíos', () => {
    expect(safePublicationUrl('javascript:alert(1)')).toBeNull()
    expect(safePublicationUrl('data:text/html,hola')).toBeNull()
    expect(safePublicationUrl('ftp://example.com/pr')).toBeNull()
    expect(safePublicationUrl('no es una url')).toBeNull()
    expect(safePublicationUrl(null)).toBeNull()
    expect(safePublicationUrl('')).toBeNull()
  })
})
