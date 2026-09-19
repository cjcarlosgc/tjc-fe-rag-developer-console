import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

interface RenderAppOptions {
  initialEntry?: string
  routePath?: string
}

export function renderApp(ui: ReactElement, options: RenderAppOptions = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const content = options.routePath ? <Routes><Route path={options.routePath} element={ui} /></Routes> : ui
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[options.initialEntry ?? '/']}>{content}</MemoryRouter></QueryClientProvider>)
}

/**
 * React Flow mantiene cada nodo con `pointer-events: none` hasta medirlo vía ResizeObserver, y en
 * jsdom ese estado no se estabiliza de forma determinista entre renders (no hay layout real) — un
 * `user.click` realista falla ahí por el chequeo de `pointer-events` que hace `@testing-library/
 * user-event`. En un navegador real la medición ocurre en el primer frame, mucho antes de que
 * cualquier interacción humana o automatizada llegue a ocurrir, así que no es un caso a simular:
 * usar `fireEvent.click` (sin chequeo de `pointer-events`) al clickear un nodo del grafo.
 */
export function clickGraphNode(element: HTMLElement): void {
  fireEvent.click(element)
}
