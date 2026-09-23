# SDD 2.0 — RAG Developer Console

`spec/` es la fuente de verdad del proyecto.

Orden de lectura: `contracts/system-contract.md` -> `contracts/interoperability-contract.md` -> `constitution/project-context.md` -> constitución aplicable -> `backlog.md` -> feature `spec.md` -> `plan.md` -> `tasks.md` -> transversales aplicables -> contratos referenciados.

## Contratos entre servicios

- [`contracts/system-contract.md`](contracts/system-contract.md): copia espejo `SYSTEM-2.4` del contrato común de los tres componentes; su propietario canónico es RAG Core.
- [`contracts/interoperability-contract.md`](contracts/interoperability-contract.md): copia espejo `INTEROP-2.4` con rutas, DTOs, estados, errores y transporte universales.

La demostración local usa por defecto la fuente `mock` definida en [`transversal/demo-mode/spec.md`](transversal/demo-mode/spec.md). Sus fixtures siguen INTEROP-2.4, no modifican el contrato real de RAG Core ni constituyen integración GitHub.

## Versionado

La especificación vigente se consolida; no se acumulan enmiendas. Los cambios se registran en `CHANGELOG.md` y en Git. `sddVersion` representa la línea base conjunta de los tres repositorios.

## Estados de decisión

- **APROBADO:** implementable.
- **PROPOSED:** recomendación técnica aún no aprobada.
- **PENDING:** decisión requerida antes de implementar el punto afectado.

Toda decisión pendiente implementable debe tener ID estable, `Blocks` acotado y una pregunta concreta. `Blocks` indica qué trabajo debe detenerse; no bloquea globalmente el repositorio. `harness/state.json` registra en `decisionGate` solo los IDs aplicables al work item activo.

No existe un registro central adicional que duplique decisiones. Cada decisión vive en la spec dueña; `CHANGELOG.md` registra cuándo cambió.
