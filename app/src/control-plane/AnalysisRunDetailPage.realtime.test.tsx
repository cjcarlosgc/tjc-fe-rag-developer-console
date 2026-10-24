import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { setDataSourceForTests } from '../api/dataSource'
import { subscribeAnalysisRunUpdates } from '../api/socket'
import { AuthContext, type AuthContextValue } from '../auth/authContext'
import { AnalysisRunDetailPage } from './AnalysisRunDetailPage'

vi.mock('../api/socket', () => ({ subscribeAnalysisRunUpdates: vi.fn() }))

const authValue: AuthContextValue = {
  status: 'authenticated',
  session: { user: { id: 'user-1', email: 'reviewer@example.test' }, accessToken: 'jwt-test', githubProviderToken: null },
  signInWithGitHub: vi.fn(),
  oauthError: null,
  dismissOAuthError: vi.fn(),
  sessionNotice: null,
  dismissSessionNotice: vi.fn(),
  signOut: vi.fn(),
}
const unsubscribe = vi.fn()

beforeEach(() => {
  setDataSourceForTests('live')
  unsubscribe.mockClear()
  vi.mocked(subscribeAnalysisRunUpdates).mockReset()
  vi.mocked(subscribeAnalysisRunUpdates).mockReturnValue(unsubscribe)
  // El HTTP live no es objeto de esta prueba: toda petición falla y la página muestra su estado de error.
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => Promise.reject(new Error('sin red en la prueba'))),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  setDataSourceForTests(null)
})

test('en live con sesión el detalle se suscribe al tiempo real con el id de la ruta y libera al desmontar', () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const { unmount } = render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={authValue}>
        <MemoryRouter initialEntries={['/projects/prj_1/runs/arun_ruta_1']}>
          <Routes>
            <Route path="/projects/:projectId/runs/:analysisRunId" element={<AnalysisRunDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>,
  )

  expect(subscribeAnalysisRunUpdates).toHaveBeenCalledTimes(1)
  expect(subscribeAnalysisRunUpdates).toHaveBeenCalledWith('arun_ruta_1', expect.any(Function), expect.any(Function))
  unmount()
  expect(unsubscribe).toHaveBeenCalledTimes(1)
})
