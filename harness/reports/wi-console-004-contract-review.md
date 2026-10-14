Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-004 — revisión contractual (OC04, OC06, OC07, OC08, OC11, OC15)

Veredicto: **APPROVED** (con 3 observaciones menores no bloqueantes).

Alcance: `git diff` de `spec/features/013-pr-driven-control-plane/spec.md` y `spec/operational-cases.md` contra SYSTEM-2.12, INTEROP-2.12, GH-INTEROP-1.7 y el código de Console. Sin cambios a `app/`, contratos ni espejos.

## Verificado sin hallazgos
- INT l.640, 680, 689, 720, 736, 749, 761, 763, 765, 769, 771, 774, 815, 835, 872, 874, 876, 880, 926, 1158, 1369 y secciones §6.9–§6.12/§7.2 existen y dicen lo afirmado (incl. `continuationAttemptId` nulo mientras queden preguntas, 404 `FUNCTIONAL_QUESTION_NOT_FOUND` para pregunta `OBSOLETE`, `history`/`GITHUB_HEAD_SUPERSEDED` «definido, pendiente de implementación», `HELD` solo para `BEHAVIORAL_MISMATCH`, texto de `resultSummary` OC11 literal).
- SYS l.35, 90, 91, 101, 107, 114, 116, 133, 136, 139, 140, 143, 147–158, 164, 309–321: correctas; la precedencia de OC08 coincide con SYS l.315 (incl. exclusiones de nivel job y de fallo de plataforma) y las consecuencias con l.321; «Razón» en l.319.
- GH l.49: compare `UNVERIFIABLE` en el límite de 300, «nunca un OK parcial»; el límite pertenece a GitHub Integration.
- Código Console: `AnalysisRunDetailPage.tsx:23` (FAILURE_STATUSES), `257–258` (alert con `resultSummary`), `267` (panel mismatch), `194–199`; test `AnalysisRunDetailPage.test.tsx:153–169` (con y sin «300») y `171–177`; `FocusModePage.tsx:61`, `118–119`; `control-plane/errors.ts:100–102` y `105`; `action-required/queries.ts:63`; `FocusModePage.test.tsx:296–314`. Todas correctas.
- Lo marcado «pendiente de cita contractual» (`SKIPPED_HAS_TEST`, test aportado como «existente» en OC02, selección de regla en OC14, snapshot suficiente en OC10, procedencia del comportamiento esperado en OC07, `HELD` en OC08, batches en OC11, «no pasa a DIRECTLY_CHANGED» en OC13) no se afirma como contrato en ningún lado; `SKIPPED_HAS_TEST` no existe en los espejos (grep vacío).
- Ningún caso se declara implementado, cubierto, `O-READY` ni `DECISION_REQUIRED`; todos quedan `O-CATALOGUED`. No hay porcentajes, progreso ni umbrales inventados (OC10 prohíbe explícitamente porcentajes; 300 solo como texto citado de INT l.761).
- Decisiones del usuario (`wi-console-004-scope-reapproval.md`: OC02, OC10, OC11, OC14 opción A, OC15, OC08 y el orden de prioridad) reflejadas fielmente; la cita literal coincide palabra por palabra en `operational-cases.md`.

## Observaciones menores (no bloqueantes)
1. OC04, invariante «el job termina y no deja runners esperando» cita SYS l.103; la frase literal está en SYS l.135 (l.103 solo dice que `ACTION_REQUIRED` termina el job actual). Corregir la cita a «SYS líneas 103 y 135».
2. OC08, `status.ts:9–10` para las etiquetas distintas de `BEHAVIORAL_MISMATCH` e `INFRASTRUCTURE_FAILURE`: `BEHAVIORAL_MISMATCH` está en l.8; usar `status.ts:8–10`.
3. OC14: la clasificación `BEHAVIORAL_MISMATCH` (opción A) es decisión del usuario y SYS l.136 admite también «solicitar decisión humana»; la sección ya la rotula «Decisión confirmada», pero conviene añadir «pendiente de cita contractual» a esa elección para ser consistente con OC02/OC10/OC11. Además OC15 atribuye a INT l.880 la «reevaluación de cualquier regla potencial» contra el Run actual; el texto dice que «el Run actual evalúa su propio contexto» (INT l.774/880), formulación algo más amplia que la fuente. Ajustar la redacción a la del espejo. Ambas son de redacción, no cambian el contrato.
4. Nota de ambigüedad: `errors.ts` existe en tres rutas; las citas de OC15 corresponden a `app/src/control-plane/errors.ts`. Conviene indicar la ruta.

## Recomendación
Aprobar el corte documental; aplicar opcionalmente las observaciones 1–4 (solo texto) antes del cierre. No requiere Contract Sync ni decisión nueva.
