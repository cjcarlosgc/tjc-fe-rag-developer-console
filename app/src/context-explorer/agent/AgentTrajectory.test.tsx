import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AgentTrajectory } from './AgentTrajectory'
import type { AgentContextTraceDetail } from '../types'

const detail: AgentContextTraceDetail = {
  id: 'trace-agent-1', kind: 'AGENT', projectVersionId: 'v1', targetId: 'target-1', testRunId: null, experimentId: 'exp-1',
  strategy: 'GENERALIST_AGENT', repetition: 1, attempt: 1, current: true, artifactIds: [], createdAt: '2026-01-01T00:00:00.000Z',
  toolCalls: 3, filesInspected: 1,
  trajectory: [
    { step: 1, toolName: 'list_files', arguments: { path: 'src' }, status: 'SUCCEEDED', resultSummary: '146 archivos disponibles', resultSha256: 'a', truncated: false, observations: [{ kind: 'FILE_LIST_SUMMARY', filePath: null, symbolName: null, excerpt: null, discoveredFilesCount: 146 }] },
    { step: 2, toolName: 'search_text', arguments: { query: 'nope' }, status: 'EMPTY', resultSummary: 'Sin coincidencias', resultSha256: 'b', truncated: false, observations: [] },
    { step: 3, toolName: 'inspect_symbol', arguments: { symbolName: 'Missing' }, status: 'FAILED', resultSummary: 'No se pudo resolver', resultSha256: 'c', truncated: false, observations: [] },
  ],
}

describe('AgentTrajectory', () => {
  it('mapea cada paso de la trayectoria a un nodo, en orden', () => {
    render(<AgentTrajectory detail={detail} selectedId={null} onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /Listar archivos/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Buscar texto/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Inspeccionar símbolo/ })).toBeInTheDocument()
  })

  it('los pasos EMPTY y FAILED se comunican por texto, no solo por opacidad', () => {
    render(<AgentTrajectory detail={detail} selectedId={null} onSelect={() => {}} />)
    expect(screen.getAllByText('Sin resultados').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Error').length).toBeGreaterThan(0)
  })

  it('nunca usa vocabulario de selección/descarte propio de RAG', () => {
    const { container } = render(<AgentTrajectory detail={detail} selectedId={null} onSelect={() => {}} />)
    expect(container.textContent).not.toMatch(/seleccionado|descartado|chain-of-thought|confianza/i)
  })

  it('selecciona un paso al hacer click', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<AgentTrajectory detail={detail} selectedId={null} onSelect={onSelect} />)
    await user.click(screen.getByRole('button', { name: /Buscar texto/ }))
    expect(onSelect).toHaveBeenCalledWith('step-2')
  })
})
