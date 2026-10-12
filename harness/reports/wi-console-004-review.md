Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

# WI-CONSOLE-004 — revisión independiente (ciclo 1 de 2)

**Fecha:** 2026-10-12 · **Modo:** awayMode · **Veredicto: CHANGES_REQUESTED** (2 hallazgos a corregir, 3 menores; ninguno de alcance ni de fondo funcional).

## Resultado por punto

1. **Alcance: OK.** `git diff --name-only` fuera de `spec/` y `harness/` está vacío; `app/` sin cambios. El diff funcional toca solo `spec/features/013-pr-driven-control-plane/spec.md` (secciones «Casos operativos»), `spec/operational-cases.md` y la línea de estado de `ST-CONSOLE-004` en `tasks.md` (T-READY → T-IN_PROGRESS). Sin contratos, espejos, UI, API ni subcasos `OCxx.a`.
2. **Fidelidad a decisiones: OK.**
   - OC02 (`spec.md:56-64`): test aportado cuenta como existente, no se ejecuta, sin «validado por ejecución».
   - OC10 (`:137-145`): `indexMode: BOOTSTRAP` + texto de estado, sin porcentajes; umbral/progreso como deuda (INT:761). Sin números inventados.
   - OC11 (`:149-158`): `INFRASTRUCTURE_FAILURE`, Check `neutral`, texto literal en `resultSummary` (INT:761, verificado) sin depender de «300»; batches `SUCCESS` no afirmado.
   - OC14 (`:178-187`): opción A, `BEHAVIORAL_MISMATCH` con evidencia, sin `ACTION_REQUIRED`.
   - OC15 (`:191-196`): `404 FUNCTIONAL_QUESTION_NOT_FOUND` (INT:774, 880), Console no ofrece responderla.
   - OC03 (`:70`) `SKIPPED_HAS_TEST` marcado pendiente (grep confirma que no aparece en contratos); OC04 (`:78`) `continuationAttemptId` conforme a INT:872; OC06 (`:99`) `history`/`GITHUB_HEAD_SUPERSEDED` «definido, pendiente» (INT:736, 765); OC07 (`:106`) sin exigir regla `ACTIVE`; OC08 (`:116-118`) precedencia y 409 conformes con SYS:315 y 321 (verificados).
3. **Estados: OK.** Todos `O-CATALOGUED` (`operational-cases.md:7-21`); ningún caso `implementado/cubierto/O-READY/O-COVERED`; ninguno `DECISION_REQUIRED`.
4. **Prioridad y cita: OK.** `operational-cases.md:27-51`: cita literal del usuario idéntica a `wi-console-004-scope-reapproval.md`, orden 1–15 correcto y aclaración explícita (línea 33) de que no implica implementación.
5. **Citas: muestreadas con grep/sed, casi todas correctas.** SYS 35, 90, 91, 101, 103, 107, 114, 116, 133, 136, 139, 140, 143, 147–153, 155, 156, 158, 164, 309–321; INT 212, 640, 680, 689, 720, 736, 749, 761, 763, 765, 769, 771, 774, 815, 835, 872, 874, 876, 880, 926, 1158; GH 49; Console `AnalysisRunDetailPage.tsx:23,194–199,257–258,267,270`, `status.ts:9–10,13,22`, `FocusModePage.tsx:61,118–119`, `errors.ts:100–105`, `queries.ts:63–65`, pruebas `AnalysisRunDetailPage.test.tsx:95–101,153–169,171–176`, `FocusModePage.test.tsx:296–313`. Las 9 afirmaciones pendientes del reporte de implementación están marcadas «pendiente de cita contractual» y no afirmadas (incluye la de OC13, `spec.md:172`).
6. **Consistencia: parcial.** spec.md y operational-cases.md son coherentes entre sí y con `harness/state.json`/`work-items.json` (OC02/10/11/14 sin `DECISION_REQUIRED`, `W-IN_REVIEW`, 4 eventos NOT_RELEVANT). Excepción: hallazgo H1.
7. **Validadores: OK.** `node harness/validate-harness.mjs` → «Harness V3 validation passed» (el fallo reportado por el implementer ya no ocurre); `node harness/validate-work-items.mjs` → passed (CONSOLE, 33 WI); `node scripts/sdd-check.mjs` → SDD check OK.

## Hallazgos

**H1 (CHANGES_REQUESTED, medio) — `CHANGELOG.md:25` contradice la spec vigente.** La entrada «WI-CONSOLE-004» dice que OC02, OC10, OC11 y OC14 «quedan `DECISION_REQUIRED`», y la de `CHANGELOG.md:23` (pausa) dice que sus decisiones «siguen pendientes». El corte no añade entrada nueva (`git diff --stat -- CHANGELOG.md` vacío), pero ahora spec.md:41 y operational-cases.md:23 afirman «Ningún caso queda `DECISION_REQUIRED`». AGENTS.md exige registrar en `CHANGELOG.md` los cambios consolidados. Corrección: añadir entrada de cierre/reaprobación que registre las decisiones confirmadas, OC15 formalizado, las correcciones de OC03/04/06/07/08 y que sigue sin implementarse ni cubrirse nada (sin reescribir historia antigua). Si el leader considera `CHANGELOG.md` fuera del alcance aprobado (A–D), debe pedir aprobación; no es DECISION_REQUIRED de fondo.

**H2 (CHANGES_REQUESTED, bajo) — frase embellecida en OC15, `spec.md:194`.** «la reevaluación de cualquier regla potencial se hace contra el Run actual (INT línea 880)». INT:880 solo dice «El Run actual evalúa su propio contexto»; «regla potencial» y «reevaluación» no constan en el espejo. Reformular a la frase citada o marcarla pendiente de cita.

**H3 (menor, no bloqueante) — OC08 subestima el espejo, `spec.md:115`.** Marca «Propuestas `HELD`: pendiente de cita» y dice que INT:926 solo lo fija para `BEHAVIORAL_MISMATCH`; INT:928 sí lo cita: «`HELD` cubre tanto `BEHAVIORAL_MISMATCH` como `TECHNICAL_GENERATION_FAILURE`». Puede citarse y quitar el pendiente (y de la lista de pendientes del reporte de implementación).

**H4 (menor) — `spec.md:144`.** La prueba del bootstrap cubre `AnalysisRunDetailPage.test.tsx:171–176` (no 177). Cosmético.

**H5 (menor, observación) — OC13, `spec.md:171`.** «distinguibles ... en el detalle del Run (`qualifiedName`, `filePath`, `kind`)» no lleva cita de Console ni de espejo; por la regla de evidencia debería citarse (`AnalysisSymbolResponse`, INT ~línea 720) o marcarse pendiente.

## Observaciones no bloqueantes (ya señaladas por el implementer, fuera de alcance)

`AnalysisRunDetailPage.tsx:198` («se indexó el repositorio completo») y el montaje de `PublishSection` en `BEHAVIORAL_MISMATCH` (`:270`) requieren un WI de código aparte; el documento los registra correctamente como discrepancias y no los corrige.

## Estado

No se editó ninguna spec ni estado. Sin commit. Quedan H1 y H2 para el ciclo 2 (máx. 2).

---

# Ciclo 2 de 2 (2026-10-12) — **Veredicto: APPROVED**

Revisor independiente (no implementó). Sin ediciones de specs ni estado; sin commit.

## Verificación de hallazgos del ciclo 1

- **H1 — corregido.** `CHANGELOG.md:7` añade «Cierre `WI-CONSOLE-004`» con decisiones OC02/OC10/OC11/OC14/OC15/OC08, correcciones OC03/04/06/07/08, pendientes de cita y «casos siguen `O-CATALOGUED`, sin implementación ni cobertura». Las dos entradas antiguas (`CHANGELOG.md:25` y `:27`) quedan marcadas «histórico, superado por el cierre de arriba» sin reescribir su contenido. Observación menor: la entrada dice `W-DONE` mientras el WI está en `W-IN_REVIEW`; es la entrada de cierre que el leader consolida tras este veredicto, y debe quedar coherente con `state.json` al cerrar.
- **H2 — corregido.** `spec.md:196` (invariantes OC15) usa «el Run actual evalúa su propio contexto (INT línea 880)», texto literal del espejo (INT:880 verificado, incluido «no se conserva»).
- **H3 — corregido.** `spec.md:115` cita INT:928 («`HELD` cubre tanto `BEHAVIORAL_MISMATCH` como `TECHNICAL_GENERATION_FAILURE`», verificado) y ya no lo marca pendiente.
- **H4 — corregido.** `spec.md:144` cita `AnalysisRunDetailPage.test.tsx:171–176` (verificado: el bloque del test termina en 176).
- **H5 — corregido.** `spec.md:171` cita `AnalysisSymbolResponse` (INT §6.10, líneas 722–728; verificado: `qualifiedName`, `filePath`, `kind`, `changeKind`).

## Observaciones del contract-reviewer

1. OC04 `spec.md:82`: «SYS línea 135» (verificado: contiene «el job termina y no deja runners esperando») y aclara que l.103 solo fija que `ACTION_REQUIRED` termina el job actual. Corregido.
2. OC08 `spec.md:115`: `status.ts:8–10` (verificado: BEHAVIORAL_MISMATCH l.8, TECHNICAL l.9, INFRASTRUCTURE l.10 en `app/src/control-plane/status.ts`). Corregido.
3. OC14 `spec.md:179`: la elección opción A queda rotulada «pendiente de cita contractual» (SYS l.136 admite ambas). OC15: redacción ajustada (ver H2). Corregido.
4. OC15 `spec.md:193,196`: ruta completa `app/src/control-plane/errors.ts`. Corregido.

## Comprobaciones transversales

- **Alcance:** `git diff --name-only` solo toca `CHANGELOG.md`, `harness/*` y `spec/` (spec.md, tasks.md, operational-cases.md); `app/` y contratos/espejos sin cambios.
- **Sin contenido nuevo no respaldado:** las nuevas citas se verificaron contra INT/SYS/código; lo no citable sigue marcado «pendiente de cita contractual» (`spec.md:142,156,172,179`).
- **Estados:** ningún caso `implementado`/`cubierto`/`O-READY`/`O-COVERED`/`DECISION_REQUIRED` como estado; todos `O-CATALOGUED` (`operational-cases.md`, `spec.md:41`). Las menciones restantes son negaciones explícitas.
- **Validadores:** `node harness/validate-harness.mjs` → passed; `node harness/validate-work-items.mjs` → passed (CONSOLE, 33 WI); `node scripts/sdd-check.mjs` → SDD check OK.

## Estado

Sin hallazgos abiertos. Sin decisiones ni cambios de contrato o alcance pendientes. El cierre (`W-DONE`) corresponde al leader.
