# 004-test-generation — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

Generation form por contexto + API POST /tests/generate. Reutilizar target selection del inventory.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
