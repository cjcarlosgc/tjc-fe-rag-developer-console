# 008-experimental-mode — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU19

## Objetivo

Ofrecer una sección de evaluación experimental con una única acción RAG vs agente generalista.

## Reglas y comportamiento

- Etiqueta visible `Modo experimental`.
- Única opción V1: `Comparar RAG vs Agente generalista`.
- Permitir seleccionar alcance/target compatible y mostrar que la comparación ejecuta 3 repeticiones por estrategia por defecto.
- No ofrecer RAG+autorepair: HU23 está descartada definitivamente en toda la arquitectura.
- El agente generalista puede explorar el repositorio y reunir sus propias referencias mediante las herramientas disponibles; no se modela como un LLM aislado ni sin contexto.
- Los nuevos contratos y modelos usan `GENERALIST_AGENT`; no usan `BASELINE` como identificador de estrategia.
- Mostrar Agente generalista vs RAG: tasa de valid, compilación, ejecución, passed, tiempos, tokens, costo estimado y distribución de failureType.
- Mostrar diferencia en puntos porcentuales para tasas y diferencias absolutas/relativas donde corresponda.
- Métricas RAG (retrievedChunks, selectedChunks, contextTokens) aparecen como explicación de la recuperación especializada, no como columna equivalente del agente generalista.
- Mostrar para el agente generalista `toolCalls`, `filesInspected` y contexto/tokens de exploración cuando RAG Core los pueda observar.
- Coverage puede añadirse en Sprint 4 si backend lo provee.
- Cada submit de experimento usa `Idempotency-Key` UUID estable durante retries del mismo intento lógico; un replay equivalente recupera el mismo `experimentId`.

### Puertas de decisión y disponibilidad

- `DEC-EXP-002` está APROBADO en RAG Core: HU19 ya no está bloqueada por decisión. Las herramientas, límites y paridad pertenecen al backend; el frontend solo consume el contrato experimental de `INTEROP-1.5` y no reproduce esa lógica.
- RAG Core ya implementa las rutas aprobadas; el adapter live del frontend sigue pendiente de implementación. El demo permanece claramente simulado hasta reemplazarlo.
- `DEC-MET-001` mantiene mutation score/StrykerJS PENDING después del núcleo de Sprint 2; solo bloquea una futura implementación de esa métrica.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
