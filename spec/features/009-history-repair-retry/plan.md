# 009-history-repair-retry — Plan

## Dependencias

- `INTEROP-2.0`, contrato local de RAG Core y transversales de async state, errores, testing y accesibilidad.

## Diseño técnico

History table + run detail. Adapter Socket.IO por ids con fallback a polling. Retry manual sobre un target del mismo run; el cliente genera/reutiliza una key UUID para esa acción y refresca estado/resultados al aceptar Core.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
- Verificar reconexión/fallback, replay del retry sin doble acción y ausencia total de UI de autorreparación.
