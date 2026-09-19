# 008-experimental-mode — Tareas

- [x] Experimental navigation.
- [x] Formulario, progreso y resultados conectados al adapter mock stateful.
- [x] Formulario live conectado a `POST /experiments` de `INTEROP-2.1` con `targetId` real e `Idempotency-Key` por acción. Verificado contra RAG Core local real (experimento completo 6/6 repeticiones) **antes** del retiro de la indexación ZIP; `targetId` dependía de esa indexación, así que este adapter live queda sin una ruta vigente para crear experimentos nuevos hasta que la unidad experimental se reapunte a `AnalysisRun` (P1/P4, ver `spec.md` y reporte de sincronización 2.1). No se toca código: el modo mock sigue funcionando igual.
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
