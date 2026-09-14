# 012-authentication — Plan

## Dependencias

- `INTEROP-2.1`, Supabase Auth y `DEC-WEB-AUTH-001`.
- Transversales `api-client`, `async-state`, `design-system`, `accessibility`, `demo-mode` y `testing`.

## Diseño técnico

- Encapsular el SDK en un `AuthProvider` y un adapter `mock|supabase`; ningún componente de dominio consume Supabase directamente.
- Añadir guard de rutas, restauración/refresh de sesión y un interceptor Bearer en el cliente de Core.
- Mantener separados `VITE_AUTH_MODE` y `VITE_DATA_SOURCE`; rechazar combinaciones que pretendan usar bypass mock con datos live.
- Implementar vistas de login, recuperación y solicitud de acceso con estados loading/error/success accesibles.

## Validación

- Tests de guard, refresh/expiración, retorno seguro, interceptor y ausencia de token en logs.
- Tests de incompatibilidad mock-auth/live-data.
- Auditoría de formularios, teclado y errores.
- `lint`, `test`, `build` y SDD check.
