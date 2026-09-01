# api-client — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

Base URL/config, correlation IDs, parsing de `ErrorEnvelope` y responses tipadas desde [`../../contracts/rag-core-api.md`](../../contracts/rag-core-api.md). Mantener los DTO de transporte separados de los view models cuando la UI necesite composición. Sandbox no es endpoint cliente.

La sincronización debe ser explícita: cambio de contrato en RAG Core -> actualización de la copia local + `CHANGELOG.md` -> adapter/types/tests del frontend. No usar tolerancia de shapes como sustituto de un contrato pendiente.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
