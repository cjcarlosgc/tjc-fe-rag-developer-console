# 012-authentication — Especificación

> **Adaptación SDD 2.1:** Supabase Auth admite correo/contraseña y GitHub OAuth solo para identidad. La GitHub App, repository binding y permisos de repositorio pertenecen a Core; cualquier login/import mock anterior queda superseded.

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
- Correo y GitHub son proveedores de identidad de Supabase Auth. No se implementa linking propio; se acepta únicamente el linking seguro del proveedor para correos verificados y configuración explícita.
- GitHub OAuth de login está aprobado por `DEC-GH-001`. No enumera ni autoriza repositorios: esa función pertenece a la GitHub App y al repository binding de Core.

## Fuera de alcance

- Sincronización de repositorios o creación real de PR desde el navegador.
- Organizaciones, RBAC, equipos, proyectos compartidos y SSO adicional.
- Auto-registro público o administración completa de usuarios.
