# 014 — Experimentos ligados a AnalysisRun

**Historias:** HU17, HU18 (EP06).
**Estado:** contrato de comparación HU17 definido en INTEROP-2.6 §6.5; adaptación live y aceptación pendientes. HU18 requiere contrato de captura antes de implementación productiva.

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

## Alineación SMART V3 (SDD 2026-10-08; implementación pendiente)

Contrato objetivo: SYSTEM-2.6 / INTEROP-2.7 (canónico en Core, `WI-CORE-017`). Console lo adopta en `WI-CONSOLE-011`; hasta entonces su copia sigue siendo INTEROP-2.6 y nada de lo descrito se presenta como live.

### OE2 — comparación de retrieval SE vs SEM (`WI-CONSOLE-014`)

Capacidad experimental de solo retrieval, separada de OE5 y del flujo operacional. La entrada es un `AnalysisRun` y un símbolo `DIRECTLY_CHANGED` de tipo `METHOD`/`FUNCTION` elegido explícitamente por el usuario; Console rotula `Modo experimental` y ofrece **«Comparar retrieval SE vs SEM»**, que llama a `POST /retrieval-comparisons` con una `Idempotency-Key` UUID estable en los retries (INTEROP-2.7 §6.15; rol Writer o superior). Puede adjuntarse opcionalmente una verdad de terreno externa; sin ella, Precision/Recall se muestran como «no disponible» y nunca como cero.

El resultado muestra lado a lado los dos modos: ranking, `semanticScore`, relación estructural (solo SE), `combinedScore` (solo SE) y selección, además de P@10/R@10 como métricas principales y P@5/R@5 secundarias cuando existan. No se presentan SE y SEM como estrategias equivalentes a RAG o al agente generalista, no se declara ganador, no hay selector permanente de modo en el producto y no se calculan bootstrap, Wilcoxon ni kappa en la interfaz. La operación no llama a LLM, Functional Knowledge, `ACTION_REQUIRED`, generación ni Sandbox.

### OE5 — presentación y wording (`WI-CONSOLE-018`, `WI-CONSOLE-019`)

El texto de la interfaz usa «condiciones experimentales externas controladas» y no «paridad estricta de información»: RAG usa recuperación SE, `ContextBuilder` y el conocimiento funcional aplicable; el agente generalista explora en solo lectura sin conocimiento persistente; ambos comparten snapshot, target, proveedor, modelo, esfuerzo de razonamiento, perfil de Sandbox y presupuesto. `WI-CONSOLE-018` presenta, cuando Core los expone, repetición, par, posición en el par, estrategia, configuración del modelo, tope de herramientas, presupuesto de contexto, perfil de ejecución, resultados técnicos y eficiencia, y marca «técnicamente no evaluable» cuando corresponde. Jerarquía: CF primaria, CO secundaria y VT guardrail; mientras CF/CO sean externos, Console no los inventa ni los deriva de `valid`/`passed`, y no muestra un ganador automático ni afirma superioridad. Precision/Recall pertenecen solo a OE2. `WI-CONSOLE-019` puede ejecutarse antes: solo corrige copy y verifica que no haya veredictos automáticos.

## Decisiones acotadas

`DEC-EXP-FK-001` quedó `APROBADO` (2026-10-08): RAG recibe el conocimiento funcional `ACTIVE` aplicable y el agente generalista no recibe conocimiento persistente; la comparación se presenta bajo condiciones experimentales externas controladas. `DEC-EXP-003` (`APROBADO`) permite al agente descubrir y leer las pruebas existentes.
