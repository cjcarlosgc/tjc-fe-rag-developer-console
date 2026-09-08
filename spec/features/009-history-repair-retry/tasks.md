# 009-history-repair-retry — Tareas

- [x] Historial paginado con `GET /project-versions/{projectVersionId}/test-runs` y navegación al detalle.
- [x] Adapter Socket.IO y suscripción/desuscripción por `projectVersionId`/`testRunId`, con polling como fallback.
- [x] Retry manual para target `INVALID`/`FAILED` con `Idempotency-Key` UUID estable durante retries de transporte.
- [x] Refrescar el mismo run/target tras `202` sin asumir filas o artifacts nuevos.
- [x] Eliminar/evitar cualquier UI, tipo o copy de autorreparación/attempts automáticos.
- [x] Manejar `TARGET_RETRY_NOT_ALLOWED`, `TEST_RUN_NOT_FINISHED`, errores de idempotencia y caída de WebSocket de forma accionable (mensajes en `runs/errors.ts`; la caída de WS se resuelve con reconexión automática + polling de respaldo, sin bloquear la UI).

## Calidad

- [x] Agregar/actualizar pruebas.
- [x] Verificar manejo de errores.
- [x] Verificar observabilidad mínima.
- [x] Ejecutar lint/test/build.
- [x] Registrar evidencia de revisión en `harness/reports/`.
