import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { setDataSourceForTests } from '../../api/dataSource'
import { mockStartExperiment, resetMockBackend } from '../../api/mockBackend'
import { renderApp } from '../../test/render'
import { getContextTrace } from '../api'
import type { AgentContextTraceDetail } from '../types'
import { AgentSidePanel } from './AgentSidePanel'
import { agentStepNodeId } from './agentLabels'

beforeEach(() => {
  setDataSourceForTests('mock')
  resetMockBackend()
})

async function seedAgentDetail(): Promise<AgentContextTraceDetail> {
  const accepted = await mockStartExperiment('prj_checkout_demo', 'ver_checkout_7-method-total')
  const detail = await getContextTrace(`${accepted.experimentId}-agent-r1`)
  if (detail.kind !== 'AGENT') throw new Error('se esperaba una traza AGENT')
  return detail
}

describe('AgentSidePanel', () => {
  it('muestra argumentos, hash del resultado y el resumen del paso seleccionado', async () => {
    const detail = await seedAgentDetail()
    renderApp(<AgentSidePanel detail={detail} selectedId={agentStepNodeId(3)} />)
    expect(screen.getByText('Declaración localizada con 1 referencia')).toBeInTheDocument()
    expect(screen.getByText('Hash del resultado')).toBeInTheDocument()
  })

  it('"Mostrar descubiertos" pagina las rutas de list_files bajo demanda', async () => {
    const detail = await seedAgentDetail()
    const user = userEvent.setup()
    renderApp(<AgentSidePanel detail={detail} selectedId={agentStepNodeId(1)} />)
    await user.click(screen.getByRole('button', { name: 'Mostrar descubiertos' }))
    await screen.findByText('src/domain/discovered/file-1.ts')
    expect(screen.queryByText('src/domain/discovered/file-51.ts')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Cargar más' }))
    await screen.findByText('src/domain/discovered/file-51.ts')
  })

  it('un paso FAILED sin observaciones se comunica por texto, no queda vacío', async () => {
    const detail = await seedAgentDetail()
    renderApp(<AgentSidePanel detail={detail} selectedId={agentStepNodeId(4)} />)
    expect(screen.getByText('Este paso no aportó contexto observado por el agente.')).toBeInTheDocument()
  })
})
