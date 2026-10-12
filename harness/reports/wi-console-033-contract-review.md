# WI-CONSOLE-033 — Revisión contractual independiente

Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido claude-sonnet-5-5 · esfuerzo low

Veredicto: APPROVED (observaciones menores, no bloqueantes)

## Verificaciones

1. Espejos: `git -C ../tjc-be-rag-core-api show 864aa837:spec/contracts/{system,interoperability,github-integration}-contract.md` coincide byte a byte (cmp) con los locales. SHA-256 locales: system d180d4b1…f507, interoperability 50f8bd53…7194, github-integration 584839c9…1b34 (este último sin cambio).
2. Ascendencia en Core: 30b9acdf < f501aef7 < b07d188a < 864aa837 confirmada con merge-base --is-ancestor (tres saltos). 864aa837 también es ancestro de HEAD de Core.
3. Contract Sync: 007 (sourceRevision f501aef7), 009 (b07d188a) y 011 (864aa837) tienen `targets: [console]`; 008 (github-integration), 010 y 012 (sandbox) no son de Console y no están en el inbox. Diff contra el outbox de Core: 007 y 009 solo agregan `consumerImportedAt`, `status`, `acknowledgementEvidence`, `resolutionEvidence`; 011 idem contra el HEAD de Core (no existe aún en 864aa837, se creó después, por eso sourceRevision apunta al contrato). 011 reemplaza a 009 sin conflicto.
4. Diff de contratos 30b9acdf..864aa837 (48 inserciones, 14 eliminaciones, solo SYSTEM e INTEROP): cabeceras 2.9 -> 2.12; §6.10 pasa el mensaje de compare UNVERIFIABLE (OC11) de objetivo a implementado (WI-CORE-046), `resultSummary` es texto libre; DEC-VAL-002 APROBADA e implementada (precedencia del estado del Run, Run INFRASTRUCTURE_FAILURE conserva propuestas AVAILABLE y no es publicable, 409 TEST_PUBLICATION_INVALID_RUN_STATUS ya existente); DEC-INF-002 APROBADA as-built (infra Core/Sandbox, Blocks NONE, "no autoriza nuevas operaciones"). Sin cambio de rutas, campos, DTOs, códigos ni estados; no obliga a código de Console. `git diff HEAD -- app` toca solo `mockBackend.ts` (campo `resultSummary` en el helper de pruebas y propuestas AVAILABLE demo) y `AnalysisRunDetailPage.test.tsx`.
5. Versiones: `spec/README.md`, `spec/constitution/architecture.md`, `013/plan.md` y `013/spec.md` dicen SYSTEM-2.12 / INTEROP-2.12. Las únicas menciones 2.8/2.9 restantes fuera de contratos están en `013/tasks.md` (ST-CONSOLE-026/027/033, tareas T-DONE históricas), correcto.
6. UI: grep de `DEC-INF-002` y `DEC-VAL-002` en `app/` (sin node_modules) sin resultados; no se muestran como regla de UI.

## Hallazgos

- Menor: Console no depende de la precedencia ni de la infraestructura; la prueba nueva cubre solo la presentación (alert con texto literal, sin botón Publicar) con datos simulados, no prueba comportamiento de Core.
- Informativo: el outbox de Core guarda 011/012 C-PENDING a 864aa837 solo en HEAD de Core, no en la revisión; no afecta el espejo.
