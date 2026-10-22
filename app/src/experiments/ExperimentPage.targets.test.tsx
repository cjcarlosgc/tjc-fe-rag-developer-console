import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { renderApp } from '../test/render'
import { ExperimentPage } from './ExperimentPage'

// WI-CONSOLE-036 B4: heurística de presentación. Run live con useAnalysisRun mockeado.
const runHarness = vi.hoisted(() => ({ symbols: [] as unknown[] }))

vi.mock('../control-plane/queries', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../control-plane/queries')>()
  return {
    ...actual,
    useAnalysisRun: () => ({
      data: { id: 'arun-1', projectId: 'p-1', status: 'SUCCESS', pullRequest: { number: 1 }, symbols: runHarness.symbols },
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    }),
  }
})

const sym = (qualifiedName: string, kind = 'METHOD') => ({
  language: 'TYPESCRIPT',
  kind,
  qualifiedName,
  filePath: 'src/foo.ts',
  changeKind: 'DIRECTLY_CHANGED',
})

beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input)
    const body = url.includes('/test-inventory')
      ? { projectVersionId: 'v-1', detectedFramework: 'VITEST', targetsTotal: 0, targetsWithTest: 0, targetsMissingTest: 0, targets: [] }
      : {
          id: 'p-1',
          name: 'checkout',
          currentVersionId: 'v-1',
          workspace: { kind: 'PERSONAL', id: 'ws-1', login: 'demo-user' },
          role: 'ADMIN',
          createdAt: '2026-09-01',
          updatedAt: '2026-09-01',
        }
    return new Response(JSON.stringify(body), { status: 200 })
  })
})

async function renderLive(symbols: unknown[]) {
  runHarness.symbols = symbols
  setDataSourceForTests('live')
  renderApp(<ExperimentPage />, {
    initialEntry: '/projects/p-1/experimental?analysisRunId=arun-1',
    routePath: '/projects/:projectId/experimental',
  })
  return screen.findByLabelText('Target experimental')
}

const optionTexts = (select: HTMLElement) =>
  within(select)
    .getAllByRole('option')
    .map((option) => option.textContent ?? '')
const selectedText = (select: HTMLElement) => (select as HTMLSelectElement).selectedOptions[0]?.textContent ?? ''
const hint = () => screen.queryByText(/puede no ser ejecutable/)

test('B4: [Foo::__construct, Foo::apply] preselecciona Foo::apply y deja el constructor al final sin filtrarlo', async () => {
  const select = await renderLive([sym('Foo::__construct'), sym('Foo::apply')])
  expect(optionTexts(select)).toHaveLength(2)
  expect(optionTexts(select)[0]).toContain('Foo::apply')
  expect(optionTexts(select)[1]).toContain('Foo::__construct')
  expect(selectedText(select)).toContain('Foo::apply')
  expect(hint()).toBeNull()
})

test('B4: variante TS `constructor` se ordena al final y el orden de los demás se conserva', async () => {
  const select = await renderLive([sym('Bar.constructor'), sym('Bar.run'), sym('Baz.other')])
  const texts = optionTexts(select)
  expect(texts).toHaveLength(3)
  expect(texts[0]).toContain('Bar.run')
  expect(texts[1]).toContain('Baz.other')
  expect(texts[2]).toContain('Bar.constructor')
  expect(selectedText(select)).toContain('Bar.run')
})

test('B4: si el único candidato es constructor queda preseleccionado y se muestra la nota de no ejecutable', async () => {
  const select = await renderLive([sym('Foo::__construct')])
  expect(selectedText(select)).toContain('Foo::__construct')
  expect(hint()).toBeInTheDocument()
  expect(select.getAttribute('aria-describedby')).toBe(hint()!.id)
})

test('B4: elegir a mano un constructor muestra la nota; elegir otro la oculta; la nota no es role="status"', async () => {
  const select = await renderLive([sym('Foo::__construct'), sym('Foo::apply')])
  await userEvent.setup().selectOptions(select, within(select).getByRole('option', { name: /__construct/ }))
  expect(hint()).toBeInTheDocument()
  expect(hint()!.getAttribute('role')).toBeNull()

  await userEvent.setup().selectOptions(select, within(select).getByRole('option', { name: /Foo::apply/ }))
  expect(hint()).toBeNull()
})
