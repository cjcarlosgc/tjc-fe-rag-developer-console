# 005-generation-progress — Plan

## Dependencias

- Constitución y transversales aplicables.
- `spec/contracts/interoperability-contract.md` para `GET /test-runs/{runId}`.

## Diseño técnico

Hook/service de operation status separado de componentes. Diseñar interface transport para cambiar polling por WebSocket sin reescribir pantallas.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
