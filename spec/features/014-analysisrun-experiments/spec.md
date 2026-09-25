# 014 — Experimentos ligados a AnalysisRun

**Historias:** HU17, HU18 (EP06).
**Estado:** contrato de comparación HU17 definido en INTEROP-2.4 §6.5; adaptación live y aceptación pendientes. HU18 requiere contrato de captura antes de implementación productiva.

## Objetivo

Comparar RAG y GENERALIST_AGENT sobre el mismo `AnalysisRun` real, snapshot, símbolo elegible y entorno. El experimento es opcional y no cambia el flujo operacional del PR.

## HU17 — Comparación

- La entrada es un `AnalysisRun` con PR/HEAD fijado y un símbolo `DIRECTLY_CHANGED` de tipo `METHOD` o `FUNCTION`. Si hay varios, el usuario elige explícitamente; no se inventa un target.
- RAG y GENERALIST_AGENT comparten snapshot, target, configuración comparable y Sandbox. Se registran trials, límites, resultados, costo y trazas observables por brazo; no se presenta chain-of-thought.
- La Console rotula `Modo experimental`, ofrece `Comparar RAG vs Agente generalista` y explica que se hacen tres repeticiones por estrategia por defecto. El agente generalista puede explorar el repositorio mediante herramientas; no se representa como un LLM aislado. Los contratos nuevos usan `GENERALIST_AGENT`, nunca `BASELINE`.
- El resultado separa compilación, ejecución, pruebas pasadas, validez y distribución de `failureType`; muestra tiempos, tokens y costo estimado. Las tasas se comparan en puntos porcentuales y las magnitudes en diferencias absolutas o relativas según corresponda. `retrievedChunks`, `selectedChunks` y `contextTokens` explican solo el brazo RAG; para el agente se muestran `toolCalls`, `filesInspected` y contexto observable, sin fingir equivalencia entre ambas familias de métricas. Coverage queda condicionado a soporte backend explícito.
- Cada submit usa una `Idempotency-Key` UUID estable en los retries del mismo intento lógico; un replay equivalente recupera el mismo experimento.
- No se ejecuta mientras el Run esté `ACTION_REQUIRED`, obsoleto o sin contexto suficiente. Se pueden repetir comparaciones sobre el mismo Run sin reemplazar resultados anteriores.
- La Console distingue un resultado mock de evidencia real; no declara aceptada HU17 hasta probar el adapter live y la paridad experimental.

## HU18 — Captura del siguiente PR

- El usuario arma una captura one-shot; el siguiente `AnalysisRun` elegible se reserva para experimento y la captura vuelve a OFF. No es un toggle permanente ni ejecuta el agente en todos los PR.
- Los brazos experimentales no publican Checks separados ni generan un merge automático.
- El contrato de armado, elegibilidad, concurrencia, expiración y cancelación aún no está definido. Un simulador local no satisface HU18 ni puede presentarse como integración live.

## Decisiones acotadas

`DEC-EXP-FK-001` debe resolver qué conocimiento funcional recibe cada brazo cuando RAG utiliza una regla activa. Su `Blocks` se evalúa al seleccionar el WI de paridad experimental; no bloquea otras HU.
