# Evidencia de revisión — HU29 (Fase 3 de SDD 1.16)

**Fecha:** 2026-09-12
**Estado:** DONE
**Decisión:** `DEC-WEB-AUTH-001` APROBADO (sin bloqueo)

## Implementado

- `app/src/auth/`: `types.ts`, `authMode.ts` (espejo exacto de `api/dataSource.ts`), `errors.ts` (mensaje genérico único, nunca revela si una cuenta existe), `authContext.ts` (contexto separado del provider para no romper Fast Refresh).
- `adapters/mockAuthAdapter.ts`: persona demostrativa fija `demo@rag-test-studio.local` (nunca el correo escrito), sesión persistida en `localStorage`.
- `adapters/supabaseAuthAdapter.ts`: envuelve `@supabase/supabase-js` (`signInWithPassword`, `getSession`, `onAuthStateChange`, `signOut`, `resetPasswordForEmail`); **cliente creado de forma perezosa** (no al importar el módulo) porque `AuthProvider` importa este adapter de forma estática incluso en modo mock — construir el cliente a nivel de módulo habría roto la app entera sin credenciales reales configuradas.
- `AuthProvider.tsx`: bloquea `VITE_AUTH_MODE=mock` + `VITE_DATA_SOURCE≠mock` con una pantalla `role="alert"` sin formulario alcanzable, verificado antes de montar cualquier ruta real (no por-ruta). Restaura sesión al montar y expone `signIn/signOut/requestPasswordReset`.
- `RequireAuth.tsx`: guard de rutas con retorno seguro vía `state.from`.
- `LoginPage.tsx`, `RequestPasswordResetPage.tsx`, `RequestAccessPage.tsx`: loading/error/éxito accesibles; recuperación y solicitud de acceso siempre muestran el mismo mensaje de éxito exista o no la cuenta.
- `api/client.ts`: `setAuthTokenProvider`/`setUnauthorizedHandler` a nivel de módulo (sin importar React); `apiRequest` agrega `Authorization: Bearer` cuando hay token y dispara el handler en `401`.
- `router.tsx`: `/login`, `/reset-password`, `/request-access` públicas; el árbol de `AppShell` envuelto en `RequireAuth`.
- `AppShell.tsx`: píldora `DEMO · IDENTIDAD SIMULADA` independiente de la píldora de `VITE_DATA_SOURCE` (nunca fusionadas, tal como pide la SDD), más menú de usuario/logout.
- `.env.example`/`.env`: `VITE_AUTH_MODE`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` documentados; `.env` local del usuario (live) actualizado a `VITE_AUTH_MODE=supabase` para no quedar bloqueado por la nueva combinación inválida mock+live.

## Bug crítico encontrado y corregido antes de integrar (no cosmético)

`supabaseAuthAdapter.ts` originalmente llamaba `createClient(...)` **a nivel de módulo**. Como `AuthProvider.tsx` importa ese módulo de forma estática (import ES) independientemente del modo activo, el cliente se habría construido siempre — y sin un proyecto Supabase real (`VITE_SUPABASE_URL` vacío), `createClient` lanza de inmediato, rompiendo la aplicación completa incluso en `VITE_AUTH_MODE=mock`. Corregido con inicialización perezosa (`getClient()`, memoizada en el primer uso real) y `try/catch` en `AuthProvider` alrededor de la suscripción síncrona, para que un fallo de configuración de Supabase nunca tumbe el árbol de React.

## Verificación

- `npx tsc --noEmit -p .`: OK.
- `npm run lint`: OK, 0 errores/0 warnings.
- `npm test`: OK, 44 archivos, 141 pruebas — agrega `authMode.test.ts`, `AuthProvider.test.tsx` (sign-in/out, restauración de sesión, bloqueo mock+live sin formulario alcanzable), `RequireAuth.test.tsx` (redirect + retorno seguro), `LoginPage.test.tsx` (login por teclado con Tab, mensaje genérico ante error), `RequestPasswordResetPage.test.tsx`/`RequestAccessPage.test.tsx`, `client.test.ts` (interceptor Bearer, disparo de 401, **ningún token aparece en `console.*`**), `mockAuthAdapter.test.ts`, `supabaseAuthAdapter.test.ts` (con `vi.mock('@supabase/supabase-js')`, nunca probado en vivo), `AppShell.test.tsx` (píldoras independientes, logout).
- `npm run build`: OK (el bundle crece por `@supabase/supabase-js`, esperado).
- `node scripts/sdd-check.mjs`: OK.
- **Nota de verificación manual**: la automatización de Chrome de esta sesión presentó una falla intermitente propia de la herramienta (clicks/tecleo no llegaban de forma fiable a los campos del formulario, incluso en pestañas nuevas) — no del código: se confirmó una corrida manual completa exitosa (login → `Proyectos` con ambas píldoras `DEMO · DATOS SIMULADOS`/`DEMO · IDENTIDAD SIMULADA` independientes, correo y "Cerrar sesión" renderizados correctamente) antes de que la herramienta empezara a fallar, y la cobertura automatizada (tests arriba) ejercita cada uno de esos mismos flujos de forma determinística vía `testing-library`/`jsdom`.

## Design-reviewer contra Stitch

Se revisó `screens/3df0c14ebcd5419fa8920772386a1e2f` ("Acceso — RAG Test Studio") vía HTML real:

- Colores confirmados: `#C9B4FA` violeta/acento coincide con el resto de la SDD; el ámbar (`#F59E0B`/`#FCD34D`) usado para la insignia "SIMULADO" coincide con el patrón ya existente de `.demo-stamp`/`.environment-demo` en este repo.
- El texto "Solicitar acceso" del mockup coincide literalmente con el título de `RequestAccessPage.tsx`.
- **Desvío de Stitch aceptado sin acción**: ese mockup mezcla un selector de canal "Continuar con GitHub"/"Continuar con correo" ("Principio de identidades independientes"). Por alcance de la SDD, GitHub es HU26 (`DEC-GH-001` `PENDING`, "no bloquea HU29 ni la demo") — HU29 es exclusivamente correo. No se agregó un botón de GitHub a `LoginPage.tsx`: hacerlo habría mezclado el alcance de dos historias distintas. La SDD manda sobre la composición visual de Stitch en este punto.
- No se encontraron desvíos de la SDD que bloquearan esta historia.

## Contrato aplicado

`spec/features/012-authentication/spec.md` (`DEC-WEB-AUTH-001`, APROBADO). Supabase Auth emite el JWT; `spec/contracts/interoperability-contract.md:47-49` fija `Authorization: Bearer <user-access-token>` en todo endpoint navegador→Core salvo `GET /health`, `401 AUTH_REQUIRED` sin credencial y `401 INVALID_ACCESS_TOKEN` ante token inválido/expirado — ambos mapeados en `auth/errors.ts` y disparados por el interceptor de `api/client.ts`.
