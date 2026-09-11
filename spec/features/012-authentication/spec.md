# 012-authentication — Especificación

**Estado:** aprobado para implementar.
**Historia:** HU29
**Decisión:** `DEC-WEB-AUTH-001` APROBADO

## Objetivo

Proteger el flujo vigente de proyectos ZIP con identidad de usuario, sin depender del posible alcance GitHub.

## Reglas y comportamiento

- Supabase Auth con correo y contraseña crea y restaura la sesión. Las rutas privadas requieren sesión y el cliente HTTP envía el access token a RAG Core como Bearer.
- La pantalla de acceso ofrece inicio de sesión, recuperación de contraseña y solicitud de acceso/invitación. HU29 no presume auto-registro público.
- Los errores de credencial no revelan si una cuenta existe. La expiración de sesión conduce a reautenticación conservando, cuando sea seguro, la ruta de retorno.
- La consola solo muestra proyectos cuyo propietario es el usuario autenticado; Core es la autoridad de esa autorización.
- `VITE_AUTH_MODE=mock` permite una identidad demostrativa únicamente junto con datos mock/locales y la rotula visiblemente. No fabrica un token para Core live.
- Correo y GitHub son identidades separadas; no existe vinculación de cuentas en este alcance.
- GitHub real permanece `PENDING` por `DEC-GH-001`. Su recorrido mock es parte de HU26 y no bloquea HU29 ni la demo.

## Fuera de alcance

- OAuth GitHub real, sincronización de repositorios o creación real de PR.
- Organizaciones, RBAC, equipos, proyectos compartidos y SSO adicional.
- Auto-registro público o administración completa de usuarios.
