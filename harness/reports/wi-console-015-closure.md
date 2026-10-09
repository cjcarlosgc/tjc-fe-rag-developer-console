# Cierre — WI-CONSOLE-015

**Fecha:** 2026-10-08
**Estado:** `W-DONE`
**Historias:** HU07, HU09
**Subtarea:** ST-CONSOLE-017

## Resultado

- `FunctionalKnowledgePage` agrupa las reglas por `scenarioKind` (Resultado esperado, Borde, Excepción, Transición de estado, Efecto observable, Precondición funcional) con varias reglas `ACTIVE` por target y filtro de estado; Console no calcula ni edita `scenarioKey`.
- `FunctionalKnowledgeDetailPage` muestra procedencia (`confirmedByUserId`, `confirmedRole`, `originHeadSha` de 7 caracteres con el valor completo en el título, `source`, `sourceRef` solo si `APPROVED_IMPORT`; «sin procedencia registrada» para campos `null`) y la cadena `SUPERSEDED` por `supersedesId` con «Estás viendo esta regla» / «Vigente».
- Se retiró `context-explorer/speculative/contextProvenance.ts`, su mock y el bloque «Qué más alimentó este contexto» de `AnalysisRunDetailPage`; la procedencia por Run la aporta `WI-CONSOLE-016`.
- Live: `listFunctionalKnowledge` responde `PendingContractError` hasta `WI-CONSOLE-020`. El mock queda rotulado DEMO · DATOS SIMULADOS.
- Tipos de INTEROP-2.7 §6.11 en `action-required/types.ts`; spec 011 ajustada; `ST-CONSOLE-017` a `T-DONE`.

## Revisión y dependencias

- SDD, decisionGate (`blockingDecisionIds: []`), contractual, UX (inicial `CHANGES_REQUESTED` B1, re-revisión `APPROVED`) y revisión independiente del usuario: `APPROVED`. Ciclos de corrección: 1 de 2.
- Contract Sync `before-done`: PASS; `CS-20260920-003`, `CS-20260921-001/002/003` quedan `NOT_RELEVANT` para este WI.

## Verificaciones (leader, 2026-10-08)

- `app/`: `npm run lint` OK; `vitest run --maxWorkers=2` 57 archivos / 505 pruebas verdes; `npm run build` OK (advertencia no bloqueante de bundle >500 kB).
- Validadores del Harness: ver commit de cierre. Sin push ni PR.

## Observaciones no bloqueantes

a. El conflicto 409 del mock compara solo `targetRef`; DEC-FK-001 pide `targetRef` + `scenarioKey`. Aceptado hasta `WI-CORE-020`.
b. El anillo de foco global mide ≈2.7:1 (<3:1): deuda transversal previa.
c. «sin procedencia registrada» se repite 3 veces en reglas históricas (ruido visual menor).
d. El wrapper `role="status"` del estado vacío pierde el rol al cargar el contenido.
e. En Run detail hay un H3 antes de un H2 (previo a este WI).
f. El sello PROPUESTA de `ruleUsage` se estira a 375 px (previo a este WI).
g. Pruebas flaky por timeout bajo carga (dos corridas en paralelo); pasan aisladas.
h. La lista de Functional Knowledge en live pasa a `PendingContractError` hasta `WI-CONSOLE-020` (aceptado por el usuario).

Siguiente elegible: `WI-CONSOLE-014`.
