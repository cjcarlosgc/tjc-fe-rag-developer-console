# WI-CONSOLE-015 — Revisión contractual

Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido claude-sonnet-5-5 · esfuerzo low

Alcance: `git diff HEAD` en `app/src` contra INTEROP-2.7 §6.11. Solo lectura.

Veredicto: APPROVED_WITH_NOTES (sin blockers).

## Conformidad
- `FunctionalKnowledgeResponse` (types.ts): nombres, nulabilidad y enums coinciden con §6.11 (`scenarioKind: ScenarioKind`, `scenarioKey: string`, `confirmedByUserId: string|null`, `confirmedRole: ConfirmingRole|null` con ADMIN|MAINTAINER, `originHeadSha: string|null`, `sourceRef: string|null`, `supersedesId`, `source`, `status`).
- `scenarioKey`: solo se muestra (`<code>`), no se calcula ni edita en la Console; el mock lo copia de la pregunta (derivada por Core).
- Adapter live `listFunctionalKnowledge`: rechaza con `PendingContractError` sin llamar a Core; no usa campos no publicados.
- Retirada de `contextProvenance`: sin referencias en `app/src`.
- Conflicto 409 (mock): compara solo scope+símbolo (`findConflictingKnowledge`). §6.11 línea 852 dice que "hasta WI-CORE-020 rige el match exacto por scope+símbolo". Diferir el refinamiento por `scenarioKey` a WI-CONSOLE-020 es aceptable y es lo que el contrato vigente describe.

## Notas (no bloqueantes)
1. `spec/features/011-context-explorer/spec.md` líneas 59 y 81 aún nombran `speculative/contextProvenance.ts` como existente. Actualizar en la consolidación de spec del WI (dueño SDD).
2. Mock: `scenarioKey` de `fk_discount_engine` ('discount.apply.negative-total') difiere del de la pregunta `fq_billing_pr17_1` ('discount.applyDiscount.negative-total'). Cosmético; alinear si se quiere coherencia pregunta-regla.
3. Mock SUPERSEDE asigna `confirmedRole` ADMIN o MAINTAINER según `project.role`; correcto mientras Writer/Reader no puedan responder. Verificar que lo garantice el guard de rol.
4. `sourceRef` se muestra solo cuando `source=APPROVED_IMPORT` (ver línea 65 del detalle), conforme.
