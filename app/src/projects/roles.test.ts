import { describe, expect, it } from 'vitest'
import { hasRole } from './roles'
import type { ProjectRole } from './types'

const roles: ProjectRole[] = ['READER', 'WRITER', 'MAINTAINER', 'ADMIN']

const expected: Record<ProjectRole, Record<ProjectRole, boolean>> = {
  READER: { READER: true, WRITER: false, MAINTAINER: false, ADMIN: false },
  WRITER: { READER: true, WRITER: true, MAINTAINER: false, ADMIN: false },
  MAINTAINER: { READER: true, WRITER: true, MAINTAINER: true, ADMIN: false },
  ADMIN: { READER: true, WRITER: true, MAINTAINER: true, ADMIN: true },
}

describe('hasRole', () => {
  for (const role of roles) {
    for (const min of roles) {
      it(`${role} ${expected[role][min] ? 'alcanza' : 'no alcanza'} ${min}`, () => {
        expect(hasRole(role, min)).toBe(expected[role][min])
      })
    }
  }

  it('sin rol nunca alcanza un mínimo', () => {
    expect(hasRole(null, 'READER')).toBe(false)
    expect(hasRole(undefined, 'WRITER')).toBe(false)
  })
})
