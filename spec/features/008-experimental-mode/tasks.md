# 008-experimental-mode — Tareas

- [x] Experimental navigation.
- [x] Formulario, progreso y resultados conectados al adapter mock stateful.
- [x] Formulario live conectado a `POST /experiments` de `INTEROP-1.6` con `targetId` real e `Idempotency-Key` por acción. Verificado contra RAG Core local real (experimento completo 6/6 repeticiones).
- [x] Progreso live con `ExperimentStatusResponse` + `/results` (`experiments/liveMapping.ts`), separando `RAG`/`GENERALIST_AGENT` (`BASELINE` retirado del vocabulario interno). Incluye `toolCalls`/`filesInspected` del agente.
- [x] comparison summary sobre view model.
- [x] Deltas absolutos/relativos y tasas en puntos porcentuales.
- [x] failure distribution.
- [x] per repetition detail.
- [x] RAG retrieval metrics panel.
- [ ] optional coverage UI Sprint 4.

## Calidad

- [x] Agregar/actualizar pruebas.
- [x] Verificar manejo de errores.
- [x] Verificar observabilidad mínima.
- [x] Ejecutar lint/test/build.
- [x] Registrar evidencia de revisión en `harness/reports/`.
