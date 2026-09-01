import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { renderApp } from '../test/render'
import { UploadVersion } from './UploadVersion'

test('rechaza archivos que no son ZIP antes de llamar al Core', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch')
  renderApp(<UploadVersion projectId="p-1" onAccepted={vi.fn()} />)
  fireEvent.change(screen.getByLabelText('Archivo ZIP'), { target: { files: [new File(['code'], 'project.txt', { type: 'text/plain' })] } })
  expect(screen.getByRole('alert')).toHaveTextContent('extensión .zip')
  expect(fetchMock).not.toHaveBeenCalled()
})

test('envía el ZIP como FormData y entrega la operación aceptada', async () => {
  const accepted = { projectId: 'p-1', projectVersionId: 'v-1', status: 'PENDING' as const, pollAfterMs: 800 }
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(accepted), { status: 202 }))
  const onAccepted = vi.fn()
  const user = userEvent.setup()
  renderApp(<UploadVersion projectId="p-1" onAccepted={onAccepted} />)
  await user.upload(screen.getByLabelText('Archivo ZIP'), new File(['code'], 'project.zip', { type: 'application/zip' }))
  await user.click(screen.getByRole('button', { name: 'Analizar versión' }))
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/projects/index'), expect.objectContaining({ method: 'POST', body: expect.any(FormData) }))
  const body = fetchMock.mock.calls[0][1]?.body as FormData
  expect(body.get('projectId')).toBe('p-1')
  expect(body.get('file')).toBeInstanceOf(File)
  expect(onAccepted).toHaveBeenCalledWith(accepted)
})
