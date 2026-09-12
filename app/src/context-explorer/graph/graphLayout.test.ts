import { describe, expect, it } from 'vitest'
import { computeGraphLayout, computeSequentialLayout } from './graphLayout'

describe('computeGraphLayout', () => {
  it('coloca la raíz en la columna 0 y cada candidato en su propia fila de la columna 1 cuando entran todos en una columna', () => {
    const layout = computeGraphLayout('target-1', ['c1', 'c2', 'c3'])
    const root = layout.nodes.find((node) => node.id === 'target-1')!
    const candidates = layout.nodes.filter((node) => node.id !== 'target-1')
    expect(root.column).toBe(0)
    expect(candidates.every((node) => node.column === 1)).toBe(true)
    expect(candidates.map((node) => node.id)).toEqual(['c1', 'c2', 'c3'])
  })

  it('reparte los candidatos en varias columnas cuando superan el máximo de filas por columna (no se apilan en una sola)', () => {
    const candidateIds = Array.from({ length: 14 }, (_, index) => `c${index + 1}`)
    const layout = computeGraphLayout('target-1', candidateIds)
    const candidates = layout.nodes.filter((node) => node.id !== 'target-1')
    const columnsUsed = new Set(candidates.map((node) => node.column))
    expect(columnsUsed.size).toBeGreaterThan(1)
    for (const column of columnsUsed) {
      const rowsInColumn = candidates.filter((node) => node.column === column).length
      expect(rowsInColumn).toBeLessThanOrEqual(6)
    }
  })

  it('es determinista: la misma entrada produce siempre el mismo layout', () => {
    const first = computeGraphLayout('target-1', ['c1', 'c2', 'c3'])
    const second = computeGraphLayout('target-1', ['c1', 'c2', 'c3'])
    expect(first).toEqual(second)
  })

  it('no genera solapes entre nodos de la misma columna', () => {
    const layout = computeGraphLayout('target-1', ['c1', 'c2', 'c3', 'c4'])
    const byColumn = new Map<number, number[]>()
    for (const node of layout.nodes) {
      const ys = byColumn.get(node.column) ?? []
      ys.push(node.y)
      byColumn.set(node.column, ys)
    }
    for (const ys of byColumn.values()) {
      const unique = new Set(ys)
      expect(unique.size).toBe(ys.length)
    }
  })

  it('mantiene el layout estable con un único candidato', () => {
    const layout = computeGraphLayout('target-1', ['only'])
    expect(layout.nodes).toHaveLength(2)
    expect(layout.width).toBeGreaterThan(0)
    expect(layout.height).toBeGreaterThan(0)
  })

  it('soporta cero candidatos sin lanzar', () => {
    const layout = computeGraphLayout('target-1', [])
    expect(layout.nodes).toHaveLength(1)
    expect(layout.nodes[0].id).toBe('target-1')
  })
})

describe('computeSequentialLayout', () => {
  it('coloca cada paso en su propia columna, en el orden recibido', () => {
    const layout = computeSequentialLayout(['step-1', 'step-2', 'step-3'])
    expect(layout.nodes.map((node) => node.id)).toEqual(['step-1', 'step-2', 'step-3'])
    expect(layout.nodes.map((node) => node.column)).toEqual([0, 1, 2])
    expect(layout.nodes.every((node) => node.row === 0)).toBe(true)
  })

  it('es determinista', () => {
    const first = computeSequentialLayout(['a', 'b'])
    const second = computeSequentialLayout(['a', 'b'])
    expect(first).toEqual(second)
  })
})
