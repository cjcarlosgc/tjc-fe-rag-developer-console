# async-state — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** capacidad técnica transversal

## Objetivo

Manejar server state, polling y luego WebSockets sin duplicar reglas.

## Reglas y comportamiento

- Respetar `pollAfterMs`, cancelar consultas obsoletas y cachear por identidad de proyecto, versión, run o experimento.
- WebSocket complementa, no reemplaza, los GET de estado. Ante desconexión/reconexión, conservar el id y continuar con polling sin duplicar la operación.
- Para `POST /test-runs`, `POST /experiments` y retry manual, crear una `Idempotency-Key` al confirmar la acción y asociarla al mutation state. Retries de transporte reutilizan la key; una nueva acción humana crea otra.
- Un replay que devuelve el recurso original se procesa como éxito normal. Nunca generar silenciosamente otra key para ocultar `IDEMPOTENCY_CONFLICT`.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
