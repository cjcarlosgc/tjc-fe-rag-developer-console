import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { RagSidePanel } from './RagSidePanel'
import type { RagCandidateNode, RagContextTraceDetail, RagDiscardReason, SourceExcerpt } from '../types'

function excerpt(overrides: Partial<SourceExcerpt> = {}): SourceExcerpt {
  return {
    filePath: 'src/domain/OrderService.ts',
    symbolName: 'calculateTotal',
    parentSymbolName: 'OrderService',
    startLine: 24,
    endLine: 26,
    snippet: 'calculateTotal() {}',
    before: [],
    after: [],
    contentSha256: 'abc',
    truncated: false,
    ...overrides,
  }
}

function candidate(overrides: Partial<RagCandidateNode> = {}): RagCandidateNode {
  return {
    chunkId: 'chunk-001',
    rank: 1,
    excerpt: excerpt(),
    tokenCount: 120,
    semanticScore: 0.91,
    structuralMatch: null,
    combinedScore: 0.91,
    matchedVia: ['SEMANTIC'],
    decision: 'SELECTED',
    discardReason: null,
    ...overrides,
  }
}

function detail(
  candidates: RagCandidateNode[],
  configuration: Partial<RagContextTraceDetail['configuration']> = {},
): RagContextTraceDetail {
  return {
    id: 'trace-test',
    kind: 'RAG',
    projectVersionId: 'ver',
    targetId: 'target-1',
    testRunId: null,
    experimentId: null,
    strategy: 'RAG',
    repetition: null,
    attempt: 1,
    current: true,
    artifactIds: [],
    createdAt: '2026-08-31T15:01:10.000Z',
    target: { chunkIds: ['t-1'], excerpt: excerpt({ symbolName: 'target', parentSymbolName: null }), tokenCount: 38 },
    candidates,
    retrievedChunks: candidates.length,
    selectedChunks: candidates.filter((item) => item.decision === 'SELECTED').length,
    contextTokens: 0,
    configuration: { minimumScore: 0.5, topK: 5, maxContextTokens: 4000, semanticWeight: 0.7, structuralWeight: 0.3, ...configuration },
  }
}

function renderCandidate(item: RagCandidateNode, config: Partial<RagContextTraceDetail['configuration']> = {}) {
  return render(<RagSidePanel detail={detail([item], config)} selectedId={item.chunkId} />)
}

function row(term: string) {
  return screen.queryByText(term, { selector: 'dt' })
}

describe('RagSidePanel · capa del candidato (WI-CONSOLE-052)', () => {
  it.each([
    ['DECLARING_CLASS', 'Clase declarante'],
    ['TARGET_EVIDENCE', 'Evidencia del target'],
    ['RELEVANT_SEMANTIC', 'Semántico relevante'],
  ] as const)('muestra la fila «Capa» con la etiqueta de %s', (layer, label) => {
    renderCandidate(candidate({ layer }))
    const dt = row('Capa')
    expect(dt).not.toBeNull()
    expect(within(dt!.parentElement!).getByText(label, { selector: 'dd' })).toBeInTheDocument()
  })

  it('no muestra la fila «Capa» cuando layer está ausente, es null o vacío', () => {
    const { unmount } = renderCandidate(candidate())
    expect(row('Capa')).toBeNull()
    unmount()
    const { unmount: unmountNull } = renderCandidate(candidate({ layer: null }))
    expect(row('Capa')).toBeNull()
    unmountNull()
    renderCandidate(candidate({ layer: '' as never }))
    expect(row('Capa')).toBeNull()
  })

  it('muestra el valor crudo cuando la capa es desconocida, sin fila vacía', () => {
    renderCandidate(candidate({ layer: 'NUEVA_CAPA' as never }))
    const dt = row('Capa')
    expect(within(dt!.parentElement!).getByText('NUEVA_CAPA', { selector: 'dd' })).toBeInTheDocument()
  })

  it('coloca «Capa» entre «Decisión» y «Motivo de descarte» cuando existe el motivo', () => {
    const discarded = candidate({ decision: 'DISCARDED', discardReason: 'TOP_K_LIMIT', layer: null })
    renderCandidate(discarded)
    expect(row('Capa')).toBeNull()
    expect(row('Motivo de descarte')).not.toBeNull()
  })
})

describe('RagSidePanel · motivo de descarte', () => {
  it('etiqueta BELOW_RELEVANCE_THRESHOLD con el rótulo del glosario', () => {
    renderCandidate(candidate({ decision: 'DISCARDED', discardReason: 'BELOW_RELEVANCE_THRESHOLD' }))
    expect(screen.getByText('Descartado: por debajo del umbral de relevancia')).toBeInTheDocument()
  })

  it('un motivo desconocido se renderiza como «Descartado», nunca vacío', () => {
    renderCandidate(candidate({ decision: 'DISCARDED', discardReason: 'MOTIVO_FUTURO' as RagDiscardReason }))
    const dt = row('Motivo de descarte')
    expect(dt).not.toBeNull()
    expect(within(dt!.parentElement!).getByText('Descartado', { selector: 'dd' })).toBeInTheDocument()
  })

  it('un motivo con nombre de propiedad de Object no cae en el prototipo', () => {
    renderCandidate(candidate({ decision: 'DISCARDED', discardReason: 'constructor' as RagDiscardReason }))
    const dt = row('Motivo de descarte')
    expect(within(dt!.parentElement!).getByText('Descartado', { selector: 'dd' })).toBeInTheDocument()
  })
})

describe('RagSidePanel · estrategia de contexto en el target', () => {
  it('muestra «Por capas» cuando configuration.strategy es LAYERED', () => {
    render(<RagSidePanel detail={detail([], { strategy: 'LAYERED' })} selectedId={null} />)
    const dt = row('Estrategia de contexto')
    expect(within(dt!.parentElement!).getByText('Por capas', { selector: 'dd' })).toBeInTheDocument()
  })

  it('no muestra la fila cuando la estrategia falta (no infiere RANKED)', () => {
    render(<RagSidePanel detail={detail([])} selectedId={null} />)
    expect(row('Estrategia de contexto')).toBeNull()
  })

  it('muestra el valor crudo para una estrategia desconocida', () => {
    render(<RagSidePanel detail={detail([], { strategy: 'HIBRIDA' as never })} selectedId={null} />)
    const dt = row('Estrategia de contexto')
    expect(within(dt!.parentElement!).getByText('HIBRIDA', { selector: 'dd' })).toBeInTheDocument()
  })
})
