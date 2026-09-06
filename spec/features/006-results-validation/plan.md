# 006-results-validation — Plan

## Dependencias

- Constitución y transversales aplicables.
- `spec/contracts/interoperability-contract.md` para resultados y `FailureType`.

## Diseño técnico

Run results page con summary cards + per-target table/detail. Formatear failure types y durations desde catálogos centrales.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
