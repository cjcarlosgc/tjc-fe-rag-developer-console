# 004-test-generation — Tareas

- [x] Mode selector.
- [x] target validation.
- [x] submit y navegación a run mediante adapter mock stateful.
- [x] Submit `POST /test-runs` y manejo de `TestRunAcceptedResponse` según `INTEROP-1.6`. Verificado contra RAG Core local real.
- [x] Generar `Idempotency-Key` UUID al confirmar la acción (`api/idempotency.ts`, `createIdempotencyKey`); cada `mutate()` explícito crea una key nueva.
- [x] Navegar a `runId` desde la respuesta 202 aprobada.

## Calidad

- [x] Agregar/actualizar pruebas.
- [x] Verificar manejo de errores.
- [x] Verificar observabilidad mínima.
- [x] Ejecutar lint/test/build.
- [x] Registrar evidencia de revisión en `harness/reports/`.
