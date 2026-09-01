/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CORE_API_URL?: string
  readonly VITE_DATA_SOURCE?: 'mock' | 'live'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
