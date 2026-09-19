import { afterEach, describe, expect, it } from 'vitest'
import { getAuthMode, isMockAuth, setAuthModeForTests } from './authMode'

afterEach(() => setAuthModeForTests(null))

describe('authMode', () => {
  it('en modo test, sin override, usa supabase por defecto (espejo de dataSource.ts)', () => {
    expect(getAuthMode()).toBe('supabase')
    expect(isMockAuth()).toBe(false)
  })

  it('permite forzar mock en tests', () => {
    setAuthModeForTests('mock')
    expect(getAuthMode()).toBe('mock')
    expect(isMockAuth()).toBe(true)
  })

  it('permite forzar supabase explícitamente', () => {
    setAuthModeForTests('supabase')
    expect(getAuthMode()).toBe('supabase')
    expect(isMockAuth()).toBe(false)
  })
})
