import { describe, expect, it } from 'vitest'
import { resolveBaseUrl } from './baseUrl'

describe('resolveBaseUrl', () => {
  it('una variable vacía o ausente significa mismo origen', () => {
    expect(resolveBaseUrl('VITE_X', undefined)).toBe('')
    expect(resolveBaseUrl('VITE_X', '   ')).toBe('')
  })

  it('acepta http(s) y quita la barra final', () => {
    expect(resolveBaseUrl('VITE_X', 'https://core.example.test/')).toBe('https://core.example.test')
    expect(resolveBaseUrl('VITE_X', 'http://localhost:3000')).toBe('http://localhost:3000')
  })

  it.each(['core.example.test', 'ftp://core.test', 'javascript:alert(1)', '//core.test'])('rechaza %s nombrando la variable', (value) => {
    expect(() => resolveBaseUrl('VITE_CORE_API_URL', value)).toThrow(/VITE_CORE_API_URL/)
  })
})
