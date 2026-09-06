# 008-experimental-mode — Plan

## Dependencias

- Constitución y transversales aplicables.
- `spec/contracts/interoperability-contract.md` para transporte; `DEC-EXP-002` continúa bloqueando la integración live.

## Diseño técnico

Experiment page -> POST experiment -> progress -> result comparison. Visualizaciones sobrias: cards/table y gráfico de fallos si aporta. Permitir drill-down por target/repetición para trazabilidad.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
