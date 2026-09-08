# async-state — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

Polling según `pollAfterMs`, cancelación, cache por project/version/run/experiment, adapter WebSocket con fallback y lifecycle de keys idempotentes por mutation.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
