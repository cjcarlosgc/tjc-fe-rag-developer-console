# api-client — Tareas

- [x] API client.
- [x] DTO/types sync strategy.
- [x] error normalization.
- [x] Copiar y contrastar el contrato disponible de RAG Core.
- [x] Alinear adapters Sprint 1 con rutas/DTO implementados y aprobados.
- [x] Bloquear o aislar capacidades cuyo contrato RAG Core está PENDING.
- [x] Sincronizar adapters live con `INTEROP-2.1` para historial, WebSockets y retry (HU20/HU21/HU22/HU24). El resto de adapters live (generación, artifacts, experimentos) permanece PENDING, fuera de este work item. `INTEROP-2.1` retira historial de test-runs (HU20), el evento `test-run:update` (HU21/HU22) y el retry manual (HU24) como ruta de producto — estos adapters live quedan sin endpoint real detrás, ver reporte de sincronización 2.1.
- [x] Adapters live de Analysis Runs (HU32, `GET /analysis-runs/{id}` y `GET /projects/{projectId}/analysis-runs`) y de historial de `ProjectVersion` (HU25, `GET /projects/{id}/versions`) — verificados contra los controllers reales de `tjc-be-rag-core-api`, no solo el contrato aprobado. `listAnalysisRuns` sin `projectId` (la vista global que usan `RunsPage`/`ProjectsPage`) no tiene ruta en Core y sigue rechazando en vivo. Ver `harness/reports/console-analysisrun-live-adapters.md`.
- [x] Propagar `Idempotency-Key` estable sin introducir credenciales Core↔Sandbox (`api/idempotency.ts`, usado en `retryTarget`).

## Calidad

- [x] Agregar/actualizar pruebas.
- [x] Verificar manejo de errores.
- [x] Verificar observabilidad mínima.
- [x] Ejecutar lint/test/build.
- [x] Registrar evidencia de revisión en `harness/reports/`.
