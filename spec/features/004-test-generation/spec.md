# 004-test-generation — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU08, HU09, HU10, HU11, HU12

## Objetivo

Solicitar los cinco modos de generación sin exponer detalles internos de retrieval.

## Reglas y comportamiento

- TARGET exige un target METHOD o FUNCTION; CLASS_* exige contexto de clase; PROJECT_* usa proyecto/versión actual.
- Modo normal usa RAG; no ofrecer toggle RAG on/off fuera de Modo experimental.
- Mostrar confirmación/resumen de alcance antes de generaciones masivas cuando sea útil.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
