# WI-CONSOLE-031 — Revisión contractual independiente

Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Veredicto: APPROVED (con una observación menor, no bloqueante)

## Verificaciones

1. Espejos: `git show 30b9acdf:spec/contracts/{interoperability,system}-contract.md` coincide byte a byte (cmp) con los locales. SHA-256 cf9c7c31…8ca25 y fe48d5d3…25a6 confirmados. `github-integration-contract.md` sin cambio (584839c9…1b34, sin diff contra HEAD). `30b9acdf` es descendiente de `76053463` (merge-base --is-ancestor verdadero).
2. Diff 76053463..30b9acdf (29 inserciones, 6 eliminaciones): versión INTEROP-2.9/SYSTEM-2.9, 404 `FUNCTIONAL_QUESTION_NOT_FOUND` y orden de errores de `POST …/answers`, `continuationAttemptId` null/opaco (comentario en el DTO, tipo `Id | null` ya existente), semántica de `functionalBehaviorValidated`/`resultSummary` (objetivo OC11 explícitamente no vigente) y DEC-VAL-002 PROPOSED sin efecto normativo. Ningún DTO, ruta ni enum nuevo para Console; solo el tratamiento del 404 como pregunta obsoleta.
3. Versión: `spec/README.md`, `architecture.md`, `013/plan.md` y `013/spec.md` referencian INTEROP-2.9 / SYSTEM-2.9; grep de `INTEROP-2.8` en esos archivos sin coincidencias vigentes.
4. Contract Sync: CS-CORE-20261012-005 (targets: console) pasa a C-RESOLVED con acknowledgementEvidence y resolutionEvidence reales (existen en harness/reports). CS-CORE-20261012-006 (targets: github-integration) queda C-PENDING, correctamente fuera de Console. Diff contra el outbox de Core: 005 solo agrega `consumerImportedAt`, `status`, `acknowledgementEvidence`, `resolutionEvidence`; 006 solo agrega `consumerImportedAt`; resto idéntico.
5. `app/`: no hay ninguna cita de `DEC-VAL-002`. `continuationAttemptId` solo aparece en el tipo, el mock y pruebas; el test de FocusModePage verifica que no se muestra ni se consulta.

## Hallazgos

- Menor (no bloqueante): 006 recibió `consumerImportedAt` aunque Console no es su destino; no es status/evidencia. Conviene que el leader confirme que es la convención del harness para eventos importados, o lo revierta.
- Informativo: el mock emite `continuationAttemptId` no nulo (`attempt_demo_*`); coherente con INTEROP-2.9 (opaco).
