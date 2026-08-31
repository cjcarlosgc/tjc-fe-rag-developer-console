# 009-history-repair-retry — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

History table + run detail. Repair attempt timeline. Retry action crea nueva operación según contrato Core.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
