import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    // Pruebas de flujo completo (p. ej. HU39/40) superan los 5 s por defecto con 16 workers en paralelo.
    testTimeout: 15000,
  },
})
