# api-client — Tareas

- [x] API client.
- [x] DTO/types sync strategy.
- [x] error normalization.
- [x] Copiar y contrastar el contrato disponible de RAG Core.
- [x] Alinear adapters Sprint 1 con rutas/DTO implementados y aprobados.
- [x] Bloquear o aislar capacidades cuyo contrato RAG Core está PENDING.
- [x] Sincronizar adapters live con `INTEROP-1.5` para historial, WebSockets y retry (HU20/HU21/HU22/HU24). El resto de adapters live (proyectos, generación, artifacts, experimentos) permanece PENDING, fuera de este work item.
- [x] Propagar `Idempotency-Key` estable sin introducir credenciales Core↔Sandbox (`api/idempotency.ts`, usado en `retryTarget`).

## Calidad

- [x] Agregar/actualizar pruebas.
- [x] Verificar manejo de errores.
- [x] Verificar observabilidad mínima.
- [x] Ejecutar lint/test/build.
- [x] Registrar evidencia de revisión en `harness/reports/`.
