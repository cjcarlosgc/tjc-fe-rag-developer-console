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

Tampoco recibe `SANDBOX_SERVICE_TOKEN`: Bearer es un detalle privado Core↔Sandbox. Para los POST idempotentes de `INTEROP-1.5`, el navegador genera UUIDs con una API estándar (`crypto.randomUUID()` o equivalente compatible), conserva cada key mientras la acción lógica esté pendiente y la descarta al iniciar una nueva acción intencional.

Aunque npm es el package manager de esta SPA, los proyectos que el producto envía a ejecutar deben incluir `pnpm-lock.yaml`; esa es una restricción del Sandbox V1, no un cambio del tooling del frontend.
