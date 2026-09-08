# async-state — Tareas

- [x] polling abstraction.
- [x] cache keys.
- [x] cancellation.
- [x] WS adapter/fallback (`api/socket.ts`, usado por HU21/HU22; el polling nunca se reemplaza).
- [x] Lifecycle reutilizable de `Idempotency-Key` para submit/retry (`api/idempotency.ts`, usado por HU24). Pruebas de timeout/replay/conflict quedan pendientes hasta que exista un backend live real contra el que ejercitarlas.

## Calidad

- [ ] Agregar/actualizar pruebas.
- [ ] Verificar manejo de errores.
- [ ] Verificar observabilidad mínima.
- [ ] Ejecutar lint/test/build.
- [ ] Registrar evidencia de revisión en `harness/reports/`.
