import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { COPY_STATUS_RESET_MS, CopyButton } from './CopyButton'

const writeText = vi.fn<(value: string) => Promise<void>>()

beforeEach(() => {
  vi.useFakeTimers()
  writeText.mockReset().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true, writable: true })
})

afterEach(() => {
  vi.useRealTimers()
})

async function flush() {
  await act(async () => { await vi.advanceTimersByTimeAsync(0) })
}

test('Copiar: no referencia la región status con aria-describedby', () => {
  render(<CopyButton value="ret_demo" label="retrieval_id" />)
  expect(screen.getByRole('button', { name: 'Copiar retrieval_id ret_demo' })).not.toHaveAttribute('aria-describedby')
})

test('Copiar: la confirmación vuelve a idle tras el tiempo de reset y se reanuncia al copiar otra vez', async () => {
  render(<CopyButton value="ret_demo" label="retrieval_id" />)
  const button = screen.getByRole('button', { name: 'Copiar retrieval_id ret_demo' })
  const status = screen.getByRole('status')

  fireEvent.click(button)
  await flush()
  expect(status).toHaveTextContent('Copiado')

  await act(async () => { await vi.advanceTimersByTimeAsync(COPY_STATUS_RESET_MS) })
  expect(status).toHaveTextContent('')

  fireEvent.click(button)
  await flush()
  expect(writeText).toHaveBeenCalledTimes(2)
  expect(status).toHaveTextContent('Copiado')
})

test('Copiar: una segunda copia dentro de la ventana reinicia el temporizador', async () => {
  render(<CopyButton value="ret_demo" label="retrieval_id" />)
  const button = screen.getByRole('button', { name: 'Copiar retrieval_id ret_demo' })
  fireEvent.click(button)
  await flush()
  await act(async () => { await vi.advanceTimersByTimeAsync(COPY_STATUS_RESET_MS - 500) })
  fireEvent.click(button)
  await flush()
  await act(async () => { await vi.advanceTimersByTimeAsync(COPY_STATUS_RESET_MS - 500) })
  expect(screen.getByRole('status')).toHaveTextContent('Copiado')
})

test('Copiar: desmontar antes del reset no deja temporizadores pendientes', async () => {
  const { unmount } = render(<CopyButton value="ret_demo" label="retrieval_id" />)
  fireEvent.click(screen.getByRole('button', { name: 'Copiar retrieval_id ret_demo' }))
  await flush()
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
