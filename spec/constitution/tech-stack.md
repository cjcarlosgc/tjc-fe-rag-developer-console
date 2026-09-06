# Tech stack

**Estado:** aprobado para implementación

- React + Vite + TypeScript como SPA.
- React Router para navegación.
- TanStack Query para server state, caché y polling.
- Cliente HTTP tipado y centralizado.
- Vitest + Testing Library para pruebas.
- npm como package manager.

No se requiere SSR para el alcance actual.

TypeScript aparece en dos fronteras distintas: es el lenguaje de implementación de esta SPA y, por contrato del producto, el único lenguaje de proyectos objetivo en V1 (`.ts`/`.tsx`). No aceptar ni presentar JavaScript puro como compatible.

El navegador consume exclusivamente la API propia de RAG Core. No se conecta directamente a Supabase Storage, no incorpora `@supabase/supabase-js` por esta infraestructura y no recibe `SUPABASE_SECRET_KEY`, `DATABASE_URL`, `DATABASE_PASSWORD` ni `SUPABASE_PUBLISHABLE_KEY`. La publishable key solo podría incorporarse en una feature futura aprobada que lo requiera, por ejemplo Supabase Auth.
