# api-client — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** capacidad técnica transversal

## Objetivo

Centralizar contratos HTTP con RAG Core y evitar fetch disperso.

## Reglas y comportamiento

- El contrato canónico local de integración es [`../../contracts/rag-core-api.md`](../../contracts/rag-core-api.md).
- El cliente usa `VITE_CORE_API_URL` y no llama directamente al Sandbox.
- Upload, indexación, exploración, generación, ejecución y resultados se solicitan exclusivamente a RAG Core; el cliente no usa URLs, buckets ni SDK de Supabase.
- No declarar variables `VITE_SUPABASE_*` mientras no exista una feature aprobada de acceso directo. Nunca exponer secretos ni `DATABASE_URL` en variables de Vite.
- En errores normalizados consume `ErrorEnvelope` y expone `correlationId`; no renombra ni asume `requestId`.
- Envía y conserva el header `x-correlation-id` cuando esté disponible.
- Para `POST /test-runs`, `POST /experiments` y el POST de retry, recibe una `Idempotency-Key` del mutation lifecycle, la envía y conserva durante cualquier retry de transporte. No genera una key distinta por intento HTTP.
- Nunca envía el `Authorization: Bearer` interno ni conoce `SANDBOX_SERVICE_TOKEN`.
- No admite respuestas alternativas especulativas para una misma operación salvo que el contrato las documente.
- Una ruta o DTO marcado `PENDING` no se trata como contrato definitivo.
- La selección `mock|live` ocurre detrás de los servicios de dominio según [`../demo-mode/spec.md`](../demo-mode/spec.md); los componentes no llaman directamente a un mock.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
