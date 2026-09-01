import '@testing-library/jest-dom/vitest'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import { setDataSourceForTests } from '../api/dataSource'
import { resetMockBackend } from '../api/mockBackend'

afterEach(() => {
  cleanup()
  setDataSourceForTests(null)
  resetMockBackend()
  vi.restoreAllMocks()
})
