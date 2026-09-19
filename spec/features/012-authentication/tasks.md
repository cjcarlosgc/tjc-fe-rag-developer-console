# 012-authentication — Tareas

- [ ] Implementar adapters de identidad `mock|supabase` y `AuthProvider`.
- [ ] Implementar login por correo, recuperación y solicitud de acceso/invitación.
- [ ] Proteger rutas y restaurar/refrescar sesión.
- [ ] Añadir Bearer al cliente de Core y manejar `AUTH_REQUIRED`/`INVALID_ACCESS_TOKEN`.
- [ ] Aplicar identidad mock solo a datos mock/locales y señalizarla.
- [ ] Mostrar únicamente recursos devueltos para el propietario autenticado, sin duplicar autorización local.

## Calidad

- [ ] Agregar pruebas unitarias, integración y navegación.
- [ ] Auditar teclado, formularios, contraste y mensajes.
- [ ] Verificar que tokens y claims no aparecen en logs ni UI.
- [ ] Ejecutar lint/test/build/SDD check y registrar evidencia.
