# 004-test-generation — Plan

## Dependencias

- Constitución y transversales aplicables.
- `spec/contracts/interoperability-contract.md`.

## Diseño técnico

Generation form por contexto + adapter API aislado. Reutilizar target selection del inventory. Implementar `POST /test-runs` con `CreateTestRunRequest` y `TestRunAcceptedResponse`; no usar el nombre provisional `POST /tests/generate`.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
