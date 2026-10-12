import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup, configure } from '@testing-library/react'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'
import { mockReactFlow } from './mockReactFlow'

// Bajo carga (suite completa en paralelo) las pruebas con findBy/waitFor de 1 s por defecto dan falsos negativos;
// el timeout sigue acotado y una condición que nunca se cumple sigue fallando.
configure({ asyncUtilTimeout: 5000 })

mockReactFlow()

afterEach(() => {
  cleanup()
  setDataSourceForTests(null)
  resetMockBackend()
  vi.restoreAllMocks()
})
