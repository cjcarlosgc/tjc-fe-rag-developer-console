# 005-generation-progress — Tareas

- [x] Polling del run mediante adapter mock stateful.
- [x] Polling hook para `GET /test-runs/{runId}` según `INTEROP-1.5` (combinado con `/results` en estado terminal; `runs/liveMapping.ts`). Verificado contra RAG Core local real.
- [x] terminal-state logic.
- [x] progress UI sobre view model desacoplado.
- [x] WebSocket adapter Sprint 3 según eventos de `INTEROP-1.5` (`api/socket.ts`, HU22). Verificado contra RAG Core local real.
- [x] reconnect/fallback a polling por el mismo id (resuscripción automática en reconexión; polling como fallback obligatorio).

## Calidad

- [x] Agregar/actualizar pruebas.
- [x] Verificar manejo de errores.
- [x] Verificar observabilidad mínima.
- [x] Ejecutar lint/test/build.
- [x] Registrar evidencia de revisión en `harness/reports/`.
