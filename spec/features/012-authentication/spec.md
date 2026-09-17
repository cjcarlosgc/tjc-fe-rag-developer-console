# 012-authentication — Especificación

> **Adaptación SDD 2.2:** Supabase Auth admite correo/contraseña y GitHub OAuth para identidad y discovery user-centric. La GitHub App conserva en Core la autorización y automatización; cualquier flujo installation-centric anterior queda superseded.

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
- Correo y GitHub son proveedores de identidad de Supabase Auth. No se implementa linking propio; para una sesión iniciada por correo, la Console usa el linking oficial de Supabase para añadir GitHub con scope `repo`, sin crear otro usuario de plataforma.
- GitHub OAuth de login solicita scope `repo` y su `provider_token`, si existe, se conserva solo en el estado de sesión para enviarlo como `X-GitHub-Provider-Token` durante discovery. No se muestra, registra ni incorpora en fixtures; permanece separado del Bearer de Supabase.
- GitHub OAuth permite descubrir repositorios visibles, no autoriza repositorios ni automatización. La GitHub App y el repository binding de Core validan acceso, listan ramas y operan el repositorio.

## Fuera de alcance

- Persistir provider tokens, sincronización de repositorios o creación real de PR desde el navegador.
- Organizaciones, RBAC, equipos, proyectos compartidos y SSO adicional.
- Auto-registro público o administración completa de usuarios.
