# testing — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

Unit tests para formatters/state; component tests para forms/status/results; integración mock API para polling/terminal states. E2E se puede añadir en Sprint 4 si tiempo lo permite.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
