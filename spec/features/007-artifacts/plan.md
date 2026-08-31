# 007-artifacts — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

Artifact list/detail + DiffViewer. Descarga usa endpoints del Core; no reconstruir ZIP en browser salvo cambio explícito.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
