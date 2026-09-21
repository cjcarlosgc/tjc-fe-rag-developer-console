import { describe, expect, it } from 'vitest'
import { safeReturnTo } from './returnTo'

describe('safeReturnTo', () => {
  it('acepta solo rutas internas', () => {
    expect(safeReturnTo('/projects/p1?tab=runs')).toBe('/projects/p1?tab=runs')
    expect(safeReturnTo(null)).toBeNull()
    expect(safeReturnTo('https://evil.example')).toBeNull()
    expect(safeReturnTo('//evil.example/phish')).toBeNull()
    expect(safeReturnTo('/\\evil.example')).toBeNull()
  })
})
