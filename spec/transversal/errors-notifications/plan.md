# errors-notifications — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

Mapear error codes a mensajes técnicos claros; no ocultar correlationId en detalle de soporte. Toasts solo para eventos breves, no reemplazan estados persistentes.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
