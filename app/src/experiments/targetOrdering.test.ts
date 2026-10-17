import { describe, expect, it } from 'vitest'
import { defaultTarget, isConstructorName, orderConstructorsLast } from './targetOrdering'

describe('targetOrdering (WI-CONSOLE-036 B4, heurística de presentación)', () => {
  it('isConstructorName reconoce constructor y __construct tras :: o .', () => {
    expect(isConstructorName('Foo::__construct')).toBe(true)
    expect(isConstructorName('Bar.constructor')).toBe(true)
    expect(isConstructorName('__construct')).toBe(true)
    expect(isConstructorName('Foo::apply')).toBe(false)
    expect(isConstructorName('constructorHelper')).toBe(false)
  })

  it('orderConstructorsLast ordena de forma estable sin filtrar', () => {
    const names = ['A::__construct', 'A::run', 'B.constructor', 'B.other']
    expect(orderConstructorsLast(names, (name) => name)).toEqual(['A::run', 'B.other', 'A::__construct', 'B.constructor'])
  })

  it('defaultTarget elige el primer no-constructor y cae en el único constructor', () => {
    expect(defaultTarget(['A::__construct', 'A::run'], (name) => name)).toBe('A::run')
    expect(defaultTarget(['A::__construct'], (name) => name)).toBe('A::__construct')
    expect(defaultTarget([], (name: string) => name)).toBeUndefined()
  })
})
