# SDD — RAG Developer Console

`spec/` es la fuente de verdad del proyecto.

Orden de lectura: `contracts/system-contract.md` -> `contracts/interoperability-contract.md` -> `constitution/project-context.md` -> `constitution/planning-model.md` y constitución aplicable -> `backlog.md`/`operational-cases.md` -> feature `spec.md` -> `plan.md` -> `tasks.md` -> transversales aplicables -> `harness/work-items.json`.

## Contratos entre servicios

- [`contracts/system-contract.md`](contracts/system-contract.md): copia espejo `SYSTEM-2.4` del contrato común de los tres componentes; su propietario canónico es RAG Core.
- [`contracts/interoperability-contract.md`](contracts/interoperability-contract.md): copia espejo `INTEROP-2.4` con rutas, DTOs, estados, errores y transporte universales.

La demostración local usa por defecto la fuente `mock` definida en [`transversal/demo-mode/spec.md`](transversal/demo-mode/spec.md). Sus fixtures siguen INTEROP-2.4, no modifican el contrato real de RAG Core ni constituyen integración GitHub.

## Versionado

La numeración HU anterior se retiró de la especificación vigente. El mapa de capacidades históricas se conserva en `harness/reports/hu-rebaseline-audit.md`, `CHANGELOG.md` y Git; ninguna casilla histórica acredita `H-DONE`.

La especificación vigente se consolida; no se acumulan enmiendas. Los cambios se registran en `CHANGELOG.md` y en Git. `sddVersion: 3.0` identifica la línea base Core/Console solicitada por el usuario; `planningBaseline: 2026-09-24-core-console-transition` advierte que Sandbox continúa en SDD 2.1 y que la homologación global está pendiente. Los 18 IDs HU nuevos no heredan automáticamente el estado de las antiguas HU homónimas.

## Estados de decisión

- **APROBADO:** implementable.
- **PROPOSED:** recomendación técnica aún no aprobada.
- **PENDING:** decisión requerida antes de implementar el punto afectado.

Toda decisión pendiente implementable debe tener ID estable, `Blocks` acotado y una pregunta concreta. `Blocks` indica qué trabajo debe detenerse; no bloquea globalmente el repositorio. `harness/state.json` registra en `decisionGate` solo los IDs aplicables al work item activo.

No existe un registro central adicional que duplique decisiones. Cada decisión vive en la spec dueña; `CHANGELOG.md` registra cuándo cambió.
