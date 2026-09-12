import type { ReactElement, ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../AuthProvider'

interface Options {
  initialEntry?: string
  routePath?: string
  extraRoutes?: ReactNode
}

/** Envuelve una pantalla de `auth/` con AuthProvider + router + query client, como pide cada test de formulario. */
export function renderAuthPage(ui: ReactElement, options: Options = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <AuthProvider>
        <MemoryRouter initialEntries={[options.initialEntry ?? '/']}>
          <Routes>
            <Route path={options.routePath ?? '/'} element={ui} />
            {options.extraRoutes}
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}
