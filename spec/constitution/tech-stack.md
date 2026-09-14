# Tech stack

**Estado:** aprobado para implementación

- React + Vite + TypeScript como SPA.
- React Router para navegación.
- TanStack Query para server state, caché y polling.
- Cliente HTTP tipado y centralizado.
- Vitest + Testing Library para pruebas.
- npm como package manager.

No se requiere SSR para el alcance actual.

TypeScript es el lenguaje de implementación de esta SPA. Los proyectos objetivo pueden usar el profile TypeScript/Jest/Vitest existente o PHP/Laravel/PHPUnit según las capacidades publicadas por Core; la UI no infiere compatibilidad por extensión.

El navegador consume exclusivamente la API propia de RAG Core para datos de dominio. Puede incorporar `@supabase/supabase-js` únicamente para la feature aprobada de Supabase Auth y recibir la URL pública y publishable key requeridas por ese SDK. No accede a Supabase Storage o Database ni recibe `SUPABASE_SECRET_KEY`, `DATABASE_URL` o `DATABASE_PASSWORD`.

`VITE_AUTH_MODE=mock|supabase` separa la identidad local demostrativa de la autenticación real. `mock` solo es válido con datos mock/locales y nunca fabrica un Bearer para un Core live. La identidad GitHub se resuelve mediante Supabase Auth; la GitHub App y sus credenciales pertenecen a Core.

Tampoco recibe `SANDBOX_SERVICE_TOKEN`: ese Bearer es un detalle privado Core↔Sandbox. Para los POST idempotentes de `INTEROP-2.1`, el navegador genera UUIDs con una API estándar (`crypto.randomUUID()` o equivalente compatible), conserva cada key mientras la acción lógica esté pendiente y la descarta al iniciar una nueva acción intencional.

Aunque npm es el package manager de esta SPA, los proyectos que el producto envía a ejecutar deben incluir `pnpm-lock.yaml`; esa es una restricción del Sandbox V1, no un cambio del tooling del frontend.
