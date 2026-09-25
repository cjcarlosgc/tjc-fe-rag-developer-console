# api-client — Especificación

**Estado:** vigente para el modelo PR-driven; rutas pendientes no son contratos implementados.
**Historias:** capacidad técnica transversal

## Objetivo

Centralizar contratos HTTP con RAG Core y evitar fetch disperso.

## Reglas y comportamiento

- Los contratos canónicos son [`../../contracts/system-contract.md`](../../contracts/system-contract.md) y [`../../contracts/interoperability-contract.md`](../../contracts/interoperability-contract.md). Las copias de contrato anteriores no autorizan rutas retiradas.
- El cliente usa `VITE_CORE_API_URL` y no llama directamente al Sandbox.
- Proyectos, RepositoryBinding, AnalysisRun, Action Required, propuestas, publicaciones y experimentos se solicitan al dueño del contrato vigente; la Console no sube código ZIP, no inicia generación manual ni llama directamente al Sandbox. No usa URLs, buckets ni SDK de Supabase.
- No declarar variables `VITE_SUPABASE_*` mientras no exista una feature aprobada de acceso directo. Nunca exponer secretos ni `DATABASE_URL` en variables de Vite.
- En errores normalizados consume `ErrorEnvelope` y expone `correlationId`; no renombra ni asume `requestId`.
- Envía y conserva el header `x-correlation-id` cuando esté disponible.
- Para operaciones mutables que el contrato vigente declara idempotentes —por ejemplo `POST /experiments`— recibe una `Idempotency-Key` del mutation lifecycle y la conserva durante retries de transporte. No crea una key distinta por intento HTTP.
- Nunca envía el `Authorization: Bearer` interno ni conoce `SANDBOX_SERVICE_TOKEN`.
- No admite respuestas alternativas especulativas para una misma operación salvo que el contrato las documente.
- Una ruta o DTO marcado `PENDING` no se trata como contrato definitivo.
- La selección `mock|live` ocurre detrás de los servicios de dominio según [`../demo-mode/spec.md`](../demo-mode/spec.md); los componentes no llaman directamente a un mock.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
