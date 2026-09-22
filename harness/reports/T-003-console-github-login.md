# T-003 — Console: login solo con GitHub (HU62) y preparación para SYSTEM-2.4/INTEROP-2.4

Repository: `tjc-fe-rag-developer-console`
Branch: `feature/T-002`
Work item: `T-003-console-github-login` (PRODUCT, HU62)
Contrato: SYSTEM-2.4 / INTEROP-2.4 (canónicos en Core; espejos copiados byte a byte)

## Decisiones humanas (2026-09-21)

- `DEC-ORG-001` es decisión final: login solo con GitHub, sin correo ni contraseña.
- Q1: una cuenta antigua de solo correo recibe un mensaje terminal claro, sin bucle.
- Q3: se incluye en este work item el token del handshake del WebSocket y el manejo de `connect_error`.
- Q4: «Conectar GitHub» pasa a «Renovar acceso a GitHub» y se retira `linkGitHub`/`linkIdentity`.
- Q5: se eliminan `/reset-password` y `/request-access`.

## CONTRACT_SYNC

| Evento | Sentido | Estado |
| --- | --- | --- |
| `CS-20260921-001` | Core → Console (contrato 2.4, orden de despliegue, DEC-ORG) | `ACKNOWLEDGED` |
| `CS-20260921-002` | Core → Console (bundle A implementado, aún no desplegado) | `ACKNOWLEDGED` |
| `CS-20260921-003` | Console → Core (Console solo-GitHub liberada para publicación) | `PENDING` en el outbox de Console; emitido a pedido del usuario, que publica la Console |

## Cortes

- **C0 docs:** `spec/features/012-authentication`, `013`, `demo-mode` reflejan login solo GitHub.
- **C1 login:** un único CTA «Continuar con GitHub», `redirectTo` con `returnTo` seguro, error de callback visible en `/login`, rótulo DEMO en mock, páginas de correo/recuperación/solicitud eliminadas.
- **C2 sesión:** solo `401` sin code, `AUTH_REQUIRED`, `INVALID_ACCESS_TOKEN` o `GITHUB_IDENTITY_REQUIRED` cierran sesión (con `signOut` local en la ruta 401); `GITHUB_IDENTITY_REQUIRED` es terminal, sin redirección automática; `503 IDENTITY_UNAVAILABLE` no cierra sesión y ofrece reintento; `GITHUB_ACCOUNT_REQUIRED`/`GITHUB_USER_TOKEN_INVALID` llevan a «Renovar acceso».
- **C3 Integrations:** «Renovar acceso a GitHub»; retirados `linkGitHub` y `linkIdentity`.
- **C4 WebSocket:** token en el handshake, `connect_error.data` con reintento acotado si `retryable`, `resetSocket()` al cerrar sesión o cambiar de usuario y `renewSocketAuth()` al renovar el token del mismo usuario.
- **C5 CS-002:** mensajes para `503 GITHUB_VERIFICATION_UNAVAILABLE`, `400 REPOSITORY_OUTSIDE_WORKSPACE`, `403 REPOSITORY_PERMISSION_INSUFFICIENT` y `404` neutral; repos read/triage no vinculables; mock alineado con el orden de validación.

## Revisiones

| Rol | Ronda 1 | Verificación tras ciclo 1 |
| --- | --- | --- |
| `reviewer` | CHANGES_REQUESTED | APPROVED |
| `ux-reviewer` | CHANGES_REQUESTED | APPROVED |
| `contract-reviewer` | APPROVED con observaciones | APPROVED |

## Evidencia

Comandos ejecutados por el leader desde `app/` tras el último cambio:

- `npx tsc -b --noEmit`: sin errores
- `npm run lint`: sin errores
- `npx vitest run`: 69 archivos, 460 tests
- `npm run build`: OK
- `node harness/validate-harness.mjs`: OK

## Riesgos y seguimiento

- **Orden de despliegue (obligatorio):** publicar esta Console primero, luego el bundle A de Core (tras migraciones y validación contra GitHub real), luego el bundle B. El proveedor de correo de Supabase se deshabilita solo después de publicar esta Console.
- **Supabase (acción humana):** agregar los orígenes de la Console a la lista de Redirect URLs (`<origen>/**`); sin ello Supabase vuelve al Site URL y el destino del deep link se pierde.
- **Usuarios existentes solo con correo:** Core responde `401 GITHUB_IDENTITY_REQUIRED` permanente; Core no define migración. Si entran con una cuenta de GitHub nueva obtienen otro `sub` y no ven sus Projects; requiere comunicación o decisión de producto.
- **Seguimiento UX/técnico (baja, aceptado):** foco al cerrar el banner de error de OAuth; rótulo DEMO de `/login` oculto bajo 680 px (`.environment` con `display:none`); `renewAccessPanel` anidado dentro de un panel; copy de Reactivar sin indicar dónde eliminar el proyecto; `renewSocketAuth` fija el token leyendo el estado en render (casi seguro sin efecto por ser asíncrono; blindar con `sessionRef`); un `401` tardío de un token previo puede cerrar una sesión nueva; banner 503 sin auto-limpieza; el mock de `enable` no modela 404/400 de REVOKED; el mock de verify/branches no modela permiso ni propietario ajeno; smoke test contra socket.io real de la renovación de token.
- **Push y despliegue:** no realizados. Requieren solicitud explícita y revisión consolidada de sprint.

## Cierre

Work item `DONE` el 2026-09-21. El usuario configuró las Redirect URLs de Supabase, publica la Console y borrará el usuario de prueba `smoke-test@tjc.dev`. Verificado por lectura en la base compartida: 3 usuarios (solo `smoke-test` sin GitHub, sin proyectos), 0 proyectos, 0 bindings, 0 identidades y las migraciones 20260921* ya aplicadas. Core debe desplegar el bundle A solo tras confirmar el despliegue de esta Console.
