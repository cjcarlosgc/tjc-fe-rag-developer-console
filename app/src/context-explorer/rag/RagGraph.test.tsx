import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { RagGraph } from './RagGraph'
import type { RagContextTraceDetail, SourceExcerpt } from '../types'

function excerpt(overrides: Partial<SourceExcerpt> = {}): SourceExcerpt {
  return {
    filePath: 'src/domain/OrderService.ts',
    symbolName: 'calculateTotal',
    parentSymbolName: 'OrderService',
    startLine: 24,
    endLine: 26,
    snippet: 'return total',
    before: [],
    after: [],
    contentSha256: 'abc123',
    truncated: false,
    ...overrides,
  }
}

const detail: RagContextTraceDetail = {
  id: 'trace-1', kind: 'RAG', projectVersionId: 'v1', targetId: 'target-1', testRunId: 'run-1', experimentId: null,
  strategy: 'RAG', repetition: null, attempt: 1, current: true, artifactIds: [], createdAt: '2026-01-01T00:00:00.000Z',
  target: { chunkIds: ['c0'], excerpt: excerpt(), tokenCount: 10 },
  candidates: [
    { chunkId: 'c1', rank: 1, excerpt: excerpt({ symbolName: 'formatCurrency', filePath: 'src/shared/money.ts' }), tokenCount: 20, semanticScore: .9, structuralMatch: null, combinedScore: .9, matchedVia: ['SEMANTIC'], decision: 'SELECTED', discardReason: null },
    { chunkId: 'c2', rank: 2, excerpt: excerpt({ symbolName: 'CouponPolicy', filePath: 'src/domain/CouponPolicy.ts' }), tokenCount: 30, semanticScore: .8, structuralMatch: 'IMPORTS', combinedScore: .85, matchedVia: ['SEMANTIC', 'IMPORTS'], decision: 'SELECTED', discardReason: null },
    { chunkId: 'c3', rank: 3, excerpt: excerpt({ symbolName: 'Logger', filePath: 'src/shared/logger.ts' }), tokenCount: 15, semanticScore: .4, structuralMatch: null, combinedScore: .4, matchedVia: ['SEMANTIC'], decision: 'DISCARDED', discardReason: 'BELOW_MINIMUM_SCORE' },
  ],
  retrievedChunks: 3, selectedChunks: 2, contextTokens: 50,
  configuration: { minimumScore: .5, topK: 2, maxContextTokens: 1_000, semanticWeight: .7, structuralWeight: .3 },
}

describe('RagGraph', () => {
  it('renderiza el target y todos los candidatos como nodos alcanzables', () => {
    render(<RagGraph detail={detail} selectedId={null} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /calculateTotal/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /formatCurrency/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /CouponPolicy/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Logger/ })).toBeInTheDocument()
  })

  it('el motivo de descarte se comunica por texto, no solo por estilo', () => {
    render(<RagGraph detail={detail} selectedId={null} onSelect={() => {}} />)
    expect(screen.getByText(/por debajo del score mínimo/i)).toBeInTheDocument()
  })

  it('la coincidencia dual se etiqueta como tal en el nodo', () => {
    render(<RagGraph detail={detail} selectedId={null} onSelect={() => {}} />)
    expect(screen.getAllByText(/Señal dual/i).length).toBeGreaterThan(0)
  })

  it('selecciona un nodo al hacer click', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<RagGraph detail={detail} selectedId={null} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /CouponPolicy/ }))
    expect(onSelect).toHaveBeenCalledWith('c2')
  })

  it('navega con flechas entre columnas (roving tabindex) y activa con Enter', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<RagGraph detail={detail} selectedId={null} onSelect={onSelect} />)
    const targetButton = screen.getByRole('button', { name: /calculateTotal/ })
    targetButton.focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: /CouponPolicy/ })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onSelect).toHaveBeenCalledWith('c2')
  })
})
