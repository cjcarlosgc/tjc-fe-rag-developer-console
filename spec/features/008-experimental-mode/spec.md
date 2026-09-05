# 008-experimental-mode — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU19

## Objetivo

Ofrecer una sección de evaluación experimental con una única acción RAG vs agente generalista.

## Reglas y comportamiento

- Etiqueta visible `Modo experimental`.
- Única opción V1: `Comparar RAG vs Agente generalista`.
- Permitir seleccionar alcance/target compatible y mostrar que la comparación ejecuta 3 repeticiones por estrategia por defecto.
- No ofrecer RAG+autorepair.
- El agente generalista puede explorar el repositorio y reunir sus propias referencias mediante las herramientas disponibles; no se modela como un LLM aislado ni sin contexto.
- Mostrar Agente generalista vs RAG: tasa de valid, compilación, ejecución, passed, tiempos, tokens, costo estimado y distribución de failureType.
- Mostrar diferencia en puntos porcentuales para tasas y diferencias absolutas/relativas donde corresponda.
- Métricas RAG (retrievedChunks, selectedChunks, contextTokens) aparecen como explicación de la recuperación especializada, no como columna equivalente del agente generalista.
- Coverage puede añadirse en Sprint 4 si backend lo provee.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
