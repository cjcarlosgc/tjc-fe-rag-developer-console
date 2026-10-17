import { afterEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { getAuthMode, isMockAuth, setAuthModeForTests } from './authMode'

afterEach(() => {
  setAuthModeForTests(null)
  setDataSourceForTests(null)
})

describe('authMode', () => {
  it('en modo test, sin override, usa supabase por defecto (espejo de dataSource.ts)', () => {
    expect(getAuthMode()).toBe('supabase')
    expect(isMockAuth()).toBe(false)
  })

  it('sin VITE_AUTH_MODE, deriva el modo de la fuente de datos', () => {
    setDataSourceForTests('mock')
    expect(getAuthMode()).toBe('mock')
    setDataSourceForTests('live')
    expect(getAuthMode()).toBe('supabase')
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
