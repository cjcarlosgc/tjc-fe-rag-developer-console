import { expect, it } from 'vitest'
import { canBindRepository } from './repositoryPermissions'

const perms = (admin: boolean, maintain: boolean, push: boolean, pull = true) => ({ permissions: { admin, maintain, push, pull } })

it('HU64: maintain, write (push) y admin permiten vincular; read/triage (solo pull) no', () => {
  expect(canBindRepository(perms(true, true, true))).toBe(true)
  expect(canBindRepository(perms(false, true, true))).toBe(true)
  expect(canBindRepository(perms(false, false, true))).toBe(true)
  expect(canBindRepository(perms(false, false, false))).toBe(false)
})
