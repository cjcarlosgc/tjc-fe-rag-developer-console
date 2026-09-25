# 012-authentication — Especificación

El único método de acceso es GitHub OAuth mediante Supabase Auth (`DEC-ORG-001`). El correo, la contraseña, la recuperación de contraseña y la solicitud de acceso se retiran. La GitHub App autoriza la automatización del repositorio; la extracción de esa lógica desde Core aún no se ha implementado.

**Estado:** implementación histórica presente; aceptación live de HU01/HU02 pendiente de reauditar.
**Historias:** HU01, HU02
**Decisiones:** `DEC-WEB-AUTH-001` APROBADO; `DEC-ORG-001` APROBADO (login solo GitHub)

## Objetivo

Proteger el control plane PR-driven con identidad GitHub verificable y sesión Supabase Auth.

## Reglas y comportamiento

- Supabase Auth con GitHub OAuth crea y restaura la sesión. Las rutas privadas requieren sesión y el cliente HTTP envía el access token a RAG Core como Bearer.
- La pantalla de acceso (`/login`) ofrece un único CTA «Continuar con GitHub», con estado de carga y error con «Reintentar». No hay campos de correo o contraseña, recuperación de contraseña ni solicitud de acceso; las rutas `/reset-password` y `/request-access` no existen.
- El fallo del callback OAuth (parámetros `error*` de la URL de retorno) se muestra también en `/login`, no solo dentro del shell autenticado.
- El retorno tras el login se conserva con `redirectTo` de OAuth (origin + ruta interna validada, nunca un destino externo); en mock se conserva con la navegación posterior al login.
- La expiración de sesión conduce a reautenticación conservando, cuando sea seguro, la ruta de retorno.
- Errores de sesión de Core (INTEROP-2.4 §6.13): `401 AUTH_REQUIRED`/`INVALID_ACCESS_TOKEN` cierran la sesión (también en Supabase) y avisan que la sesión expiró. `401 GITHUB_IDENTITY_REQUIRED` cierra la sesión en Supabase y muestra en `/login` un mensaje terminal y persistente (la cuenta no tiene identidad GitHub verificada, p. ej. una cuenta antigua de solo correo), sin redirección automática ni bucle «inicia sesión con GitHub», y sin exponer `sub` ni datos de otra cuenta. `503 IDENTITY_UNAVAILABLE` no cierra la sesión ni afirma que la cuenta no existe: ofrece un mensaje reintentable con «Reintentar».
- El handshake WebSocket envía el access token en `auth.token`. `connect_error` con `data { code, retryable }`: `retryable: true` (`IDENTITY_UNAVAILABLE`) reintenta con `socket.connect()` con backoff acotado; `GITHUB_IDENTITY_REQUIRED` e `INVALID_ACCESS_TOKEN` disparan el mismo manejo de sesión que HTTP, sin bucle. `SubscribeAck` se ignora (la Console emite `subscribe` sin callback).
- La Console envía `workspaceId` y consume `workspace`/`role` solo a través de las rutas y secuencia de despliegue vigentes de `014-organizations-access`; no presume que el propietario de un Project organizacional sea el único autorizado. Core es la autoridad actual de esa autorización.
- `VITE_AUTH_MODE=mock` permite una identidad demostrativa GitHub únicamente junto con datos mock/locales y la rotula visiblemente (`DEMO · IDENTIDAD SIMULADA`). No fabrica un token para Core live ni simula `GITHUB_IDENTITY_REQUIRED`/`IDENTITY_UNAVAILABLE` como si fueran Core.
- GitHub es el único proveedor de identidad. No se implementa linking propio ni `linkIdentity`. Supabase no guarda ni refresca el `provider_token`: cuando el token de GitHub se pierde (sesión restaurada o recargada), la Integrations page ofrece «Renovar acceso a GitHub», que repite `signInWithOAuth` con scope `repo` y vuelve a la misma ruta.
- GitHub OAuth de login solicita scope `repo` y su `provider_token`, si existe, se conserva solo en el estado de sesión para enviarlo como `X-GitHub-Provider-Token` durante discovery. No se muestra, registra ni incorpora en fixtures; permanece separado del Bearer de Supabase.
- GitHub OAuth permite descubrir repositorios visibles, no autoriza repositorios ni automatización. La GitHub App y el repository binding de Core validan acceso, listan ramas y operan el repositorio.

## Fuera de alcance

- Persistir provider tokens, sincronización de repositorios o creación real de PR desde el navegador.
- Administrar organizaciones, equipos o permisos propios desde la Console; Google OAuth y SSO adicional.
- Correo/contraseña, recuperación de contraseña, solicitud de acceso, auto-registro público o administración completa de usuarios.
