# 004-test-generation — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

Generation form por contexto + adapter API aislado. Reutilizar target selection del inventory. La ruta y los DTO HTTP están `PENDING` en RAG Core; `POST /tests/generate` no se considera confirmado hasta actualizar [`../../contracts/rag-core-api.md`](../../contracts/rag-core-api.md).

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
