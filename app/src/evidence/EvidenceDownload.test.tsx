import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { PendingContractError, setDataSourceForTests } from '../api/dataSource'
import { getEvidence } from './api'
import { EvidenceDownload, EVIDENCE_NOT_FINISHED_MESSAGE } from './EvidenceDownload'
import { EVIDENCE_NOT_FINISHED_MAX_RETRIES } from './queries'

vi.mock('./api', () => ({ getEvidence: vi.fn() }))

const getEvidenceMock = vi.mocked(getEvidence)
const BUTTON = { name: 'Descargar evidencia (JSON)' }
const RETRY = { name: 'Reintentar' }

const bundle = {
  schemaVersion: '1' as const,
  kind: 'ANALYSIS_RUN' as const,
  subjectId: 'arun_checkout_pr45',
  generatedAt: '2026-10-01T10:00:00.000Z',
  correlationId: 'cid-1',
  analysisRun: null,
  retrieval: [],
  context: [],
  generation: [],
  agentExploration: [],
  sandbox: [],
  experimental: [],
  publication: null,
}

const okResult = () => ({ raw: JSON.stringify(bundle, null, 2), bundle })

let createObjectURL: ReturnType<typeof vi.fn>
let revokeObjectURL: ReturnType<typeof vi.fn>
let anchorClick: ReturnType<typeof vi.spyOn>
let downloadedName: string | null
let downloadedBlob: Blob | null

beforeEach(() => {
  setDataSourceForTests('mock')
  getEvidenceMock.mockReset()
  downloadedName = null
  downloadedBlob = null
  createObjectURL = vi.fn((blob: Blob) => {
    downloadedBlob = blob
    return 'blob:evidence-test'
  })
  revokeObjectURL = vi.fn()
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createObjectURL })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revokeObjectURL })
  anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    downloadedName = this.download
  })
})

afterEach(() => {
  anchorClick.mockRestore()
  setDataSourceForTests(null)
})

function apiError(status: number, code: string, message = 'error'): ApiError {
  return new ApiError(message, status, 'cid-err', code)
}

const renderDownload = (terminal = true, kind: 'ANALYSIS_RUN' | 'EXPERIMENT' | 'RETRIEVAL_COMPARISON' = 'ANALYSIS_RUN') =>
  render(<EvidenceDownload kind={kind} subjectId="arun_checkout_pr45" terminal={terminal} />)

describe('EvidenceDownload', () => {
  it('antes del estado terminal el botón está deshabilitado con texto explicativo y no llama a Core', async () => {
    const user = userEvent.setup()
    renderDownload(false)
    const button = screen.getByRole('button', BUTTON)
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('Disponible cuando el proceso termine.')).toBeInTheDocument()
    await user.click(button)
    expect(getEvidenceMock).not.toHaveBeenCalled()
  })

  it('en terminal descarga evidence-analysis-run-{id}.json con Blob JSON y muestra schemaVersion', async () => {
    getEvidenceMock.mockResolvedValue(okResult())
    const user = userEvent.setup()
    renderDownload()

    await user.click(screen.getByRole('button', BUTTON))

    expect(getEvidenceMock).toHaveBeenCalledWith('ANALYSIS_RUN', 'arun_checkout_pr45')
    await waitFor(() => expect(downloadedName).toBe('evidence-analysis-run-arun_checkout_pr45.json'))
    expect(downloadedBlob?.type).toBe('application/json')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:evidence-test')
    expect(await screen.findByText('Esquema de evidencia: v1')).toBeInTheDocument()
  })

  it('usa el nombre de archivo esperado para experimentos y comparaciones de retrieval', async () => {
    getEvidenceMock.mockResolvedValue({ ...okResult(), bundle: { ...bundle, kind: 'EXPERIMENT' } } as never)
    const user = userEvent.setup()
    renderDownload(true, 'EXPERIMENT')
    await user.click(screen.getByRole('button', BUTTON))
    await waitFor(() => expect(downloadedName).toBe('evidence-experiment-arun_checkout_pr45.json'))
  })

  it('mientras genera muestra role=status «Generando evidencia…»', async () => {
    let resolve!: (value: ReturnType<typeof okResult>) => void
    getEvidenceMock.mockReturnValue(new Promise((done) => { resolve = done }))
    const user = userEvent.setup()
    renderDownload()
    await user.click(screen.getByRole('button', BUTTON))
    expect(screen.getByRole('status')).toHaveTextContent('Generando evidencia…')
    resolve(okResult())
    await waitFor(() => expect(downloadedName).not.toBeNull())
  })

  it('409 EVIDENCE_NOT_FINISHED tras el reintento acotado: role=status, texto exacto, sin alert, y Reintentar', async () => {
    getEvidenceMock.mockRejectedValue(apiError(409, 'EVIDENCE_NOT_FINISHED'))
    const user = userEvent.setup()
    renderDownload()
    await user.click(screen.getByRole('button', BUTTON))

    expect(await screen.findByRole('button', RETRY)).toBeInTheDocument()
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(EVIDENCE_NOT_FINISHED_MESSAGE)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getEvidenceMock).toHaveBeenCalledTimes(EVIDENCE_NOT_FINISHED_MAX_RETRIES + 1)
    expect(downloadedName).toBeNull()
  })

  it('Reintentar tras 409 vuelve a pedir la evidencia y mantiene el foco en el botón', async () => {
    for (let index = 0; index <= EVIDENCE_NOT_FINISHED_MAX_RETRIES; index += 1) getEvidenceMock.mockRejectedValueOnce(apiError(409, 'EVIDENCE_NOT_FINISHED'))
    getEvidenceMock.mockReturnValueOnce(new Promise(() => {}))
    const user = userEvent.setup()
    renderDownload()
    await user.click(screen.getByRole('button', BUTTON))
    const retry = await screen.findByRole('button', RETRY)

    await user.click(retry)

    expect(getEvidenceMock).toHaveBeenCalledTimes(EVIDENCE_NOT_FINISHED_MAX_RETRIES + 2)
    expect(screen.getByRole('status')).toHaveTextContent('Generando evidencia…')
    expect(document.activeElement).toBe(retry)
  })

  it('Reintentar tras 409 descarga cuando Core ya terminó', async () => {
    getEvidenceMock.mockRejectedValueOnce(apiError(409, 'EVIDENCE_NOT_FINISHED'))
    for (let index = 0; index < EVIDENCE_NOT_FINISHED_MAX_RETRIES; index += 1) getEvidenceMock.mockRejectedValueOnce(apiError(409, 'EVIDENCE_NOT_FINISHED'))
    getEvidenceMock.mockResolvedValue(okResult())
    const user = userEvent.setup()
    renderDownload()
    await user.click(screen.getByRole('button', BUTTON))
    await user.click(await screen.findByRole('button', RETRY))
    await waitFor(() => expect(downloadedName).toBe('evidence-analysis-run-arun_checkout_pr45.json'))
  })

  it('un error real (403) muestra role=alert en español con Correlation ID, sin robar el foco, y reintento manual', async () => {
    getEvidenceMock.mockRejectedValue(apiError(403, 'PROJECT_ROLE_INSUFFICIENT'))
    const user = userEvent.setup()
    renderDownload()
    const button = screen.getByRole('button', BUTTON)
    await user.click(button)

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Correlation ID: cid-err')
    expect(screen.getByRole('button', RETRY)).toBeInTheDocument()
    expect(document.activeElement).toBe(button)
    expect(getEvidenceMock).toHaveBeenCalledTimes(1)
  })

  it('404 y red son errores reales (role=alert), no reintentan', async () => {
    getEvidenceMock.mockRejectedValueOnce(apiError(404, 'ANALYSIS_RUN_NOT_FOUND', 'No existe'))
    const user = userEvent.setup()
    renderDownload()
    await user.click(screen.getByRole('button', BUTTON))
    expect(await screen.findByRole('alert')).toHaveTextContent('No existe')
    expect(getEvidenceMock).toHaveBeenCalledTimes(1)
  })

  it('PendingContractError (live pendiente) es un error real con role=alert y no reintenta', async () => {
    getEvidenceMock.mockRejectedValueOnce(new PendingContractError('la exportación de evidencia'))
    const user = userEvent.setup()
    renderDownload()
    await user.click(screen.getByRole('button', BUTTON))
    expect(await screen.findByRole('alert')).toHaveTextContent('la exportación de evidencia')
    expect(getEvidenceMock).toHaveBeenCalledTimes(1)
  })

  it('muestra el rótulo DEMO · DATOS SIMULADOS en mock, el alcance fijo y ningún identificador EV-OE', async () => {
    renderDownload()
    expect(screen.getByText('DEMO · DATOS SIMULADOS')).toBeInTheDocument()
    expect(screen.getByText('Paquete técnico de Core; no es el registro académico.')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/EV-OE/)
    expect(document.body.textContent).not.toMatch(/científica|empresarial/i)
  })

  it('no muestra el rótulo mock fuera del modo mock', () => {
    setDataSourceForTests('live')
    renderDownload()
    expect(screen.queryByText('DEMO · DATOS SIMULADOS')).not.toBeInTheDocument()
  })

  it('Enter y Espacio activan el botón con teclado', async () => {
    getEvidenceMock.mockResolvedValue(okResult())
    const user = userEvent.setup()
    renderDownload()
    const button = screen.getByRole('button', BUTTON)
    button.focus()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(getEvidenceMock).toHaveBeenCalledTimes(1))
    await user.keyboard(' ')
    await waitFor(() => expect(getEvidenceMock).toHaveBeenCalledTimes(2))
  })

  it('no depende de un rol: un Reader puede descargar (el componente no recibe rol)', async () => {
    getEvidenceMock.mockResolvedValue(okResult())
    const user = userEvent.setup()
    renderDownload()
    await user.click(screen.getByRole('button', BUTTON))
    await waitFor(() => expect(downloadedName).not.toBeNull())
  })
})
