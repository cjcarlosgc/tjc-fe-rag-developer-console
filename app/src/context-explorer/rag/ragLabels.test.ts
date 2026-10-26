import { describe, expect, it } from 'vitest'
import { STRUCTURAL_RELATION_LABELS } from '../../retrieval-comparison/types'
import type { RagCandidateNode, RagStructuralMatch } from '../types'
import {
  discardReasonLabel,
  discardReasonName,
  filterRagCandidates,
  ragLayerName,
  ragSignalKind,
  ragSignalLabel,
  ragStrategyName,
} from './ragLabels'

const PHP_RELATIONS: RagStructuralMatch[] = ['SAME_NAMESPACE', 'FULLY_QUALIFIED_REFERENCE', 'DECLARING_CLASS']
const ALL_RELATIONS: RagStructuralMatch[] = ['IMPORTS', 'IMPORTED_BY', ...PHP_RELATIONS]

function candidate(structuralMatch: RagStructuralMatch | null, semantic: boolean): RagCandidateNode {
  const matchedVia = [...(semantic ? ['SEMANTIC' as const] : []), ...(structuralMatch ? [structuralMatch] : [])]
  return {
    chunkId: `c-${structuralMatch ?? 'none'}-${semantic ? 'dual' : 'solo'}`,
    rank: 1,
    excerpt: {
      filePath: 'app/Services/CouponService.php',
      symbolName: 'apply',
      parentSymbolName: 'CouponService',
      startLine: 1,
      endLine: 2,
      snippet: '',
      before: [],
      after: [],
      contentSha256: 'abc',
      truncated: false,
    },
    tokenCount: 10,
    semanticScore: semantic ? 0.8 : null,
    structuralMatch,
    combinedScore: 0.8,
    matchedVia,
    decision: 'SELECTED',
    discardReason: null,
  }
}

describe('ragLabels · relaciones estructurales TypeScript y PHP (CS-CORE-20261009-017)', () => {
  it.each(ALL_RELATIONS)('solo estructural %s se etiqueta con la etiqueta centralizada, no con «importado por»', (relation) => {
    const label = ragSignalLabel(candidate(relation, false))
    expect(ragSignalKind(candidate(relation, false))).toBe('STRUCTURAL')
    expect(label).toBe(`Señal estructural · ${STRUCTURAL_RELATION_LABELS[relation]}`)
  })

  it.each(ALL_RELATIONS)('dual semántica + %s se etiqueta como dual con la relación concreta', (relation) => {
    const label = ragSignalLabel(candidate(relation, true))
    expect(ragSignalKind(candidate(relation, true))).toBe('DUAL')
    expect(label).toBe(`Señal dual · semántica + ${STRUCTURAL_RELATION_LABELS[relation].toLowerCase()}`)
  })

  it.each(PHP_RELATIONS)('la relación PHP %s nunca cae en el texto de importación', (relation) => {
    expect(ragSignalLabel(candidate(relation, false))).not.toMatch(/importad|importa\b/i)
    expect(ragSignalLabel(candidate(relation, true))).not.toMatch(/importad|importa\b/i)
  })

  it('el filtro de señal estructural incluye las relaciones PHP y excluye las semánticas puras', () => {
    const candidates = [candidate('DECLARING_CLASS', false), candidate('SAME_NAMESPACE', true), candidate(null, true)]
    const kept = filterRagCandidates(candidates, { search: '', signalKinds: new Set(['STRUCTURAL']), showDiscarded: true })
    expect(kept.map((item) => item.structuralMatch)).toEqual(['DECLARING_CLASS'])
  })
})

describe('ragLabels · capas, estrategia y motivos de descarte (WI-CONSOLE-052)', () => {
  it('etiqueta el motivo BELOW_RELEVANCE_THRESHOLD', () => {
    expect(discardReasonLabel.BELOW_RELEVANCE_THRESHOLD).toBe('Descartado: por debajo del umbral de relevancia')
    expect(discardReasonName('BELOW_RELEVANCE_THRESHOLD')).toBe('Descartado: por debajo del umbral de relevancia')
  })

  it('discardReasonName usa «Descartado» para motivos desconocidos o de prototipo', () => {
    expect(discardReasonName('MOTIVO_FUTURO')).toBe('Descartado')
    expect(discardReasonName('toString')).toBe('Descartado')
    expect(discardReasonName('')).toBe('Descartado')
  })

  it.each([
    ['DECLARING_CLASS', 'Clase declarante'],
    ['TARGET_EVIDENCE', 'Evidencia del target'],
    ['RELEVANT_SEMANTIC', 'Semántico relevante'],
  ])('ragLayerName(%s) devuelve la etiqueta en español', (value, label) => {
    expect(ragLayerName(value)).toBe(label)
  })

  it('ragLayerName devuelve el valor crudo para capas desconocidas y nunca vacío', () => {
    expect(ragLayerName('OTRA')).toBe('OTRA')
    expect(ragLayerName('   ')).toBe('No disponible')
    expect(ragLayerName('constructor')).toBe('constructor')
  })

  it('ragStrategyName etiqueta LAYERED y RANKED y devuelve el crudo para lo desconocido', () => {
    expect(ragStrategyName('LAYERED')).toBe('Por capas')
    expect(ragStrategyName('RANKED')).toBe('Por ranking')
    expect(ragStrategyName('HIBRIDA')).toBe('HIBRIDA')
  })
})
