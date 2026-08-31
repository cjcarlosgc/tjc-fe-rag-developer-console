# 008-experimental-mode — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU19

## Objetivo

Ofrecer una sección de evaluación experimental con una única acción RAG vs baseline.

## Reglas y comportamiento

- Etiqueta visible `Modo experimental`.
- Única opción V1: `Comparar RAG vs Baseline`.
- Permitir seleccionar alcance/target compatible y mostrar que la comparación ejecuta 3 repeticiones por estrategia por defecto.
- No ofrecer RAG+autorepair.
- Mostrar Baseline vs RAG: tasa de valid, compilación, ejecución, passed, tiempos, tokens, costo estimado y distribución de failureType.
- Mostrar diferencia en puntos porcentuales para tasas y diferencias absolutas/relativas donde corresponda.
- Métricas RAG (retrievedChunks, selectedChunks, contextTokens) aparecen como explicación, no como columna equivalente del baseline.
- Coverage puede añadirse en Sprint 4 si backend lo provee.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
