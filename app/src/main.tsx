import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { getDataSource } from './api/dataSource'
import { ConfigurationErrorScreen } from './config/ConfigurationErrorScreen'
import { resolveConfigurationError } from './config/configurationError'
import './styles.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

const root = createRoot(document.getElementById('root')!)

// La configuración se valida antes de cargar el resto de la app. `api/client.ts` lee VITE_CORE_API_URL al evaluarse, y un import
// estático se evalúa antes que cualquier código de este módulo. Por eso router y AuthProvider solo se cargan con import() cuando
// la configuración es válida; si no, se muestra una pantalla de error en lugar de una página en blanco.
const configurationError = resolveConfigurationError({
  dataSource: getDataSource(),
  coreApiUrl: import.meta.env.VITE_CORE_API_URL,
})

if (configurationError) {
  root.render(
    <StrictMode>
      <ConfigurationErrorScreen issue={configurationError} />
    </StrictMode>,
  )
} else {
  void Promise.all([import('./router'), import('./auth/AuthProvider')]).then(([{ router }, { AuthProvider }]) => {
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </StrictMode>,
    )
  })
}
