# api-client — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** capacidad técnica transversal

## Objetivo

Centralizar contratos HTTP con RAG Core y evitar fetch disperso.

## Reglas y comportamiento

- El contrato canónico local de integración es [`../../contracts/rag-core-api.md`](../../contracts/rag-core-api.md).
- El cliente usa `VITE_CORE_API_URL` y no llama directamente al Sandbox.
- En errores normalizados consume `ErrorEnvelope` y expone `correlationId`; no renombra ni asume `requestId`.
- Envía y conserva el header `x-correlation-id` cuando esté disponible.
- No admite respuestas alternativas especulativas para una misma operación salvo que el contrato las documente.
- Una ruta o DTO marcado `PENDING` no se trata como contrato definitivo.
- La selección `mock|live` ocurre detrás de los servicios de dominio según [`../demo-mode/spec.md`](../demo-mode/spec.md); los componentes no llaman directamente a un mock.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
