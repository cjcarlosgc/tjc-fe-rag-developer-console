# errors-notifications — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** capacidad técnica transversal

## Objetivo

Mostrar fallos accionables y diferenciar invalid result de platform error.

## Reglas y comportamiento

- Consumir `ErrorEnvelope` y conservar `correlationId` para soporte sin mostrar detalles sensibles.
- `valid=false`/`INVALID` es resultado de negocio, no indisponibilidad de plataforma.
- Mostrar como acción corregible `UNSUPPORTED_PACKAGE_MANAGER`: Sandbox V1 requiere `pnpm-lock.yaml`.
- `IDEMPOTENCY_KEY_REQUIRED`/`INVALID_IDEMPOTENCY_KEY` indican un defecto del cliente; `IDEMPOTENCY_CONFLICT` no se resuelve automáticamente generando otra key.
- El frontend nunca solicita ni muestra `SANDBOX_SERVICE_TOKEN`, headers Core↔Sandbox o URLs firmadas.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
