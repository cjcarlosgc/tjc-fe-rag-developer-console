# 012-authentication — Plan

## Dependencias

- `INTEROP-2.4` (§6.6 handshake WebSocket, §6.13 identidad y errores), Supabase Auth, `DEC-WEB-AUTH-001` y `DEC-ORG-001` (HU62).
- Transversales `api-client`, `async-state`, `design-system`, `accessibility`, `demo-mode` y `testing`.

## Diseño técnico

- Encapsular el SDK en un `AuthProvider` y un adapter `mock|supabase`; ningún componente de dominio consume Supabase directamente.
- Añadir guard de rutas, restauración/refresh de sesión y un interceptor Bearer en el cliente de Core.
- Mantener separados `VITE_AUTH_MODE` y `VITE_DATA_SOURCE`; rechazar combinaciones que pretendan usar bypass mock con datos live.
- Implementar la vista de login con un único CTA GitHub y estados loading/error accesibles; el adapter pasa `redirectTo` (origin + ruta interna validada) a `signInWithOAuth` y no lanza error tras iniciar la redirección (la sesión llega por `onAuthStateChange`).
- Cortes de `T-003-console-github-login`: C0 docs; C1 login solo GitHub (retira `signIn`, `requestPasswordReset`, `linkGitHub`, páginas y rutas de recuperación/solicitud); C2 errores de sesión (`api/client.ts` entrega el `code` del 401 al handler; `AuthProvider` hace `signOut` de Supabase y distingue expiración, `GITHUB_IDENTITY_REQUIRED` terminal e `IDENTITY_UNAVAILABLE` reintentable); C3 Integrations «Renovar acceso a GitHub»; C4 WebSocket con `auth.token` y manejo de `connect_error`.

## Validación

- Tests de guard, refresh/expiración, retorno seguro, interceptor, `401 GITHUB_IDENTITY_REQUIRED` sin bucle, `503 IDENTITY_UNAVAILABLE` reintentable, handshake WebSocket y ausencia de token en logs.
- Tests de incompatibilidad mock-auth/live-data.
- Auditoría de formularios, teclado y errores.
- `lint`, `test`, `build` y SDD check.
