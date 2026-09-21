# 012-authentication — Tareas

- [ ] Implementar adapters de identidad `mock|supabase` y `AuthProvider`.
- [ ] Implementar login solo con GitHub (HU62, `DEC-ORG-001`): un único CTA, sin correo, contraseña, recuperación ni solicitud de acceso.
- [ ] Proteger rutas y restaurar/refrescar sesión.
- [ ] Añadir Bearer al cliente de Core y manejar `AUTH_REQUIRED`/`INVALID_ACCESS_TOKEN`.
- [ ] Manejar `401 GITHUB_IDENTITY_REQUIRED` (terminal, sin bucle) y `503 IDENTITY_UNAVAILABLE` (reintentable, sin cerrar sesión).
- [ ] Enviar el access token en el handshake WebSocket y manejar `connect_error` (`retryable`).
- [ ] Aplicar identidad mock solo a datos mock/locales y señalizarla.
- [ ] Mostrar únicamente recursos devueltos para el propietario autenticado, sin duplicar autorización local.

## Calidad

- [ ] Agregar pruebas unitarias, integración y navegación.
- [ ] Auditar teclado, formularios, contraste y mensajes.
- [ ] Verificar que tokens y claims no aparecen en logs ni UI.
- [ ] Ejecutar lint/test/build/SDD check y registrar evidencia.

## Estado de `T-003-console-github-login` (HU62)

- [x] C0 — documentación de Console actualizada (esta revisión).
- [x] C1 — login solo GitHub, retiro de correo/recuperación/solicitud de acceso, `redirectTo`, `oauthError` en `/login`.
- [x] C2 — errores de sesión 401/503 en `api/client.ts` y `AuthProvider`.
- [x] C3 — Integrations: «Renovar acceso a GitHub», retiro de `linkGitHub`.
- [x] C4 — WebSocket con `auth.token` y `connect_error`.
- [x] C5 — bundle A de Core (CS-20260921-002, HU64 parte de seguridad): mensajes por código (`GITHUB_VERIFICATION_UNAVAILABLE` reintentable con «Reintentar», `REPOSITORY_OUTSIDE_WORKSPACE`, `REPOSITORY_PERMISSION_INSUFFICIENT`, `GITHUB_REPOSITORY_NOT_FOUND` como un único caso neutral), repos read/triage no vinculables en la lista y orden de validación de POST binding en el mock. Sin `workspaceId` ni consumo de `workspace`/`role`.
