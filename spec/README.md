# SDD — RAG Developer Console

`spec/` es la fuente de verdad del proyecto.

Orden de lectura: `constitution/` -> `backlog.md` -> feature `spec.md` -> `plan.md` -> `tasks.md` -> transversales aplicables -> contratos referenciados.

## Contratos entre servicios

- [`contracts/rag-core-api.md`](contracts/rag-core-api.md): contrato HTTP y semántico que el frontend consume de RAG Core, con disponibilidad implementada/aprobada/PENDING.

La demostración local usa por defecto la fuente `mock` definida en [`transversal/demo-mode/spec.md`](transversal/demo-mode/spec.md); esto no modifica el contrato real de RAG Core.

## Versionado

La especificación vigente se consolida; no se acumulan enmiendas. Los cambios se registran en `CHANGELOG.md` y en Git.

## Estados de decisión

- **APROBADO:** implementable.
- **PROPOSED:** recomendación técnica aún no aprobada.
- **PENDING:** decisión requerida antes de implementar el punto afectado.
