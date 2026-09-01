import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
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
