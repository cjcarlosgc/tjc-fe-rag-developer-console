# 002-upload-analysis — Plan

## Dependencias

- Constitución y transversales aplicables.
- `spec/contracts/interoperability-contract.md` para historial de ProjectVersions.

## Diseño técnico

Upload component + index operation state. Página de versión con progress/status
y results summary. Para la demo, timeline de ProjectVersions sobre un servicio de
dominio mock y acceso read-only al inventario de cada versión. No leer/extraer ZIP
en navegador salvo necesidad UX mínima. El adapter live usará `GET /projects/{projectId}/versions` cuando RAG Core lo implemente.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
