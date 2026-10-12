# 013 — Subtareas actuales

- [x] **ST-CONSOLE-004 · T-DONE · WI-CONSOLE-004 · HU03–HU16:** especificar la experiencia de OC01–OC15 desde happy paths; subcasos y evidencia se agregan solo tras aprobación.
- [x] **ST-CONSOLE-014 [T-DONE] · WI-CONSOLE-012 · HU12, HU14:** reproducir la prueba reportada como rota de `RunsPage`, registrar comando y mensaje, determinar su causa y corregir la causa (no el conteo de aserciones) o cerrar con evidencia si no reproduce.
- [x] **ST-CONSOLE-015 [T-DONE] · WI-CONSOLE-013 · HU07, HU08, HU14:** rol `WRITER` y abstención `UNKNOWN` en Focus Mode y Action Required según `DEC-FK-002` y `DEC-ORG-003`; la pregunta sigue pendiente y no se muestra como resuelta.
- [x] **ST-CONSOLE-017 [T-DONE] · WI-CONSOLE-015 · HU07, HU09:** mostrar varias reglas `ACTIVE` por target agrupadas por escenario y su procedencia, y retirar el panel especulativo de procedencia.
- [x] **ST-CONSOLE-018 [T-DONE] · WI-CONSOLE-016 · HU12, HU15:** vista de trace operativo de nueve enlaces con `retrieval_id`, `context_id` y `execution_id` según INTEROP-2.7 §6.16.
- [x] **ST-CONSOLE-019 [T-DONE] · WI-CONSOLE-017 · HU12, HU15, HU17:** descarga de evidencia JSON versionada del Run, del experimento y de la comparación de retrieval; los mocks permanecen rotulados como simulados.

- [x] **ST-CONSOLE-022 · T-DONE · WI-CONSOLE-020 · HU05, HU07, HU08, HU12, HU15, HU17:** activar y verificar contra Core los adapters live de SMART V3 una vez que los WI de Core estén `W-DONE`.

- [x] **ST-CONSOLE-024 · T-DONE · WI-CONSOLE-022 · HU01:** adoptar los contratos canónicos actuales y registrar `CS-CORE-20261011-001` y `CS-CORE-20261011-004`; no crear selector de Project/aplicación ni cambiar DTOs/UI. `projectRoot` es informativo si una vista técnica ya lo muestra.

- [x] **ST-CONSOLE-025 · T-DONE · WI-CONSOLE-023 · HU14, HU15:** adoptar los espejos canónicos SYSTEM/GH-INTEROP-1.6 de Core y resolver `CS-CORE-20261011-005`; no implementar el comportamiento 422/reconciliación en Console ni cambiar UI, DTOs, endpoints, selectores o despliegue.

- [x] **ST-CONSOLE-026 · T-DONE · WI-CONSOLE-024 · HU14, HU15:** adoptar SYSTEM-2.8/GH-INTEROP-1.7 desde Core y registrar `CS-CORE-20261011-006`; sin UI, DTOs, endpoints ni código de producto.

- [x] **ST-CONSOLE-027 · T-DONE · WI-CONSOLE-025 · HU11:** espejar SYSTEM-2.9 e INTEROP-2.8 de Core; sin UI, producto ni GCE.

- [x] **ST-CONSOLE-031 · T-DONE · WI-CONSOLE-029 · HU01, HU11, HU14, HU15:** acusar y clasificar los eventos de Contract Sync de Core pendientes (`CS-CORE-20261009-012`, `20261010-001/-002`, `20261011-002/-003`, `20261012-002/-003/-004`) con evidencia verificable; sin UI, DTOs, endpoints, espejos ni código de producto. Aprobación: `harness/reports/wi-console-029-scope-approval.md`.

- [x] **ST-CONSOLE-033 · T-DONE · WI-CONSOLE-031 · HU01, HU11, HU14, HU15:** sincronizar INTEROP-2.9 y SYSTEM desde el Contract Sync de WI-CORE-045 (`CS-CORE-20261012-005`): espejar byte a byte, tratar `404 FUNCTIONAL_QUESTION_NOT_FOUND` al responder como pregunta obsoleta y no asumir consultable un `continuationAttemptId` no nulo; sin DTO, rutas ni live; no reanuda WI-CONSOLE-004. Aprobación: `harness/reports/wi-console-031-scope-approval.md`.

- [x] **ST-CONSOLE-034 · T-DONE · WI-CONSOLE-032 · HU12, HU16:** publicar tests con seguimiento de la publicación asíncrona: guardar `publicationId` del `202`, consultar `GET /test-publications/{id}` hasta estado terminal, mostrar companion PR/rama/fallo, bloquear duplicados y simular PENDING/PUBLISHED/FAILED en el mock; sin DTO, rutas ni contrato. Aprobación: `harness/reports/wi-console-032-scope-approval.md`.
- [x] **ST-CONSOLE-035 · T-DONE · WI-CONSOLE-033 · HU01, HU11, HU14, HU15:** sincronizar SYSTEM/INTEROP 2.10, 2.11 y 2.12 desde los Contract Sync de WI-CORE-047 y WI-CORE-049 (`CS-CORE-20261012-007`, `-009` y `-011`): espejar byte a byte, mostrar `resultSummary` de OC11 como texto libre y no ofrecer publicar un Run `INFRASTRUCTURE_FAILURE`; sin DTO, rutas ni live; no reanuda WI-CONSOLE-004. Aprobación: `harness/reports/wi-console-033-scope-approval.md`.

La implementación antigua y sus IDs HU se conservan en `CHANGELOG.md`, `harness/reports/` y Git, no como backlog ejecutable actual.
