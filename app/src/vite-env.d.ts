/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CORE_API_URL?: string
  readonly VITE_GITHUB_INTEGRATION_API_URL?: string
  readonly VITE_DATA_SOURCE?: 'mock' | 'live'
  readonly VITE_AUTH_MODE?: 'mock' | 'supabase'
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
