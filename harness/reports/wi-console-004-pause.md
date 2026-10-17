# WI-CONSOLE-004 — pausa a `W-READY`

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha de esta anotación:** 2026-10-12. Es una anotación del leader, no una ejecución del harness: no contiene checkpoints, marcas de ejecución ni handoffs nuevos.
**Motivo:** orden del usuario en el chat («sí, aplica la opción 1») para liberar el lugar de WI activo y que se haga primero un WI mínimo de correcciones de experimentos, que abrirá otro Leader.

## Qué cambió en la pausa

- `harness/work-items.json`: `WI-CONSOLE-004` pasa de `W-IN_PROGRESS` a `W-READY`; se retiran `approved` y `evidence` (la aprobación quedó consumida por la ejecución pausada; ver más abajo).
- `harness/state.json`: `activeWorkItem: null`. El esquema solo conserva snapshots en `completedWorkItems` para WI `W-DONE`; no existe mecanismo del harness para snapshots de pausa, por eso el estado exacto se documenta aquí y vive en Git (commit `c4379ec`, `harness/state.json`).
- `spec/features/013-pr-driven-control-plane/tasks.md`: `ST-CONSOLE-004` pasa de `T-IN_PROGRESS` a `T-READY`.
- Sin cambios al validador ni a las reglas del harness. El trabajo documental de `c4379ec` (spec, `operational-cases.md`, reportes) se conserva intacto.

## Estado exacto antes de la pausa (de `c4379ec`)

- WI: `W-IN_PROGRESS`, `approved: true`, `evidence: [harness/reports/wi-console-004-scope-approval.md]`; `activeWorkItem` en `state.json` con el mismo estado.
- `decisionGate`: `checked: true`, sin decisiones bloqueantes ni no bloqueantes, `checkedAt 2026-10-12T08:55:00.000Z`.
- Gates: `sddVerified` G-PASSED, `noBlockingDecisions` G-PASSED; `implementationCompleted`, `independentReviewPassed`, `technicalChecksPassed`, `interopSyncChecked`, `noMocksPresentedAsLive`, `retryLimitRespected` G-NOT_RUN; `uxReviewed`, `contractReviewed`, `canonicalContractSynced`, `contractSyncPublished` G-NOT_APPLICABLE.
- Handoffs: (1) `sdd-analyst`, APPROVED, evidencia `wi-console-004-sdd-analysis.md`; (2) `implementer` (`claude-haiku-5-5`, effort low), `DECISION_REQUIRED`: OC01, OC03–OC09, OC12, OC13 y OC15 formalizados; OC02, OC10, OC11 y OC14 sin rellenar.
- `execution`: `reviewAgent: null`, `reviewCycles: 0`, `maxReviewCycles: 2`.
- Checkpoints Contract Sync grabados: solo `start` (`checkedAt 2026-10-12T14:59:45.117Z`, `relevantPendingSyncIds: []`; acusados `CS-20260920-003`, `CS-20260921-001`, `-002`, `-003`; resuelto `CS-20260920-002`). Faltaban `implementation-delivery`, `before-review` y `before-done`.
- Evidencia: `wi-console-004-sdd-analysis.md`, `wi-console-004-scope-approval.md` (usuario, «si», 2026-10-12), `wi-console-004-contract-sync-scope-review.md` (CS-CORE-20261012-002 a -004 fuera de alcance, siguen C-PENDING).

## Trabajo hecho (en `c4379ec`)

Happy paths formalizados en la Feature 013 (entrada, salida, invariantes, prueba propuesta, fuente) para OC01, OC03, OC04, OC05, OC06, OC07, OC08, OC09, OC12, OC13 y OC15. Solo documentación: sin `app/`, UI, API, contratos ni subcasos; los casos siguen `O-CATALOGUED`, sin cobertura declarada.

## Decisiones pendientes del usuario

1. **OC02:** ¿los tests aportados por el usuario se validan como candidatos, o cuentan como existentes (`NO_ADDITIONAL_TESTS_REQUIRED`)?
2. **OC10:** criterio de snapshot suficiente del bootstrap y de progreso visible.
3. **OC11:** filtrado, priorización y batches sin umbrales; ¿`SUCCESS` por batches?
4. **OC14:** vía para una regla `ACTIVE` contradicha: decisión humana frente a clasificación con evidencia.

## Cómo reanudar

1. Con otro WI no activo, re-seleccionar `WI-CONSOLE-004` (`W-READY` → `W-SELECTED`), repetir la verificación SDD y el gate de decisiones.
2. Volver a registrar la aprobación de alcance (la de `wi-console-004-scope-approval.md` queda como antecedente; `approved` se retiró) y pasar a `W-IN_PROGRESS`.
3. Correr de nuevo el checkpoint `start` de Contract Sync (el anterior pertenece a la ejecución pausada; no se reutiliza).
4. Traer las cuatro decisiones de arriba al usuario; el implementer completa OC02, OC10, OC11 y OC14 solo con decisión registrada.
5. Revisión humana del diff, checkpoints `implementation-delivery`, `before-review` y `before-done`, gates y cierre.
