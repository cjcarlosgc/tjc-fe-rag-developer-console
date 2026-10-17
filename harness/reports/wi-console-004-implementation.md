Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-004 — corte documental de casos operativos

**Fecha:** 2026-10-12
**Alcance:** solo documental. `spec/features/013-pr-driven-control-plane/spec.md` (sección «Casos operativos») y `spec/operational-cases.md`. Sin `app/`, UI, API, contratos ni espejos, `harness/state.json`, `harness/work-items.json`, subcasos `OCxx.a`. No hay commit ni push.
**Base de decisiones:** `harness/reports/wi-console-004-scope-reapproval.md` (cita literal del usuario).

## Cambios por caso

- **OC01:** citas de SYS, INT y `GeneratedTestProposalResponse`; sin cambio de contenido.
- **OC02:** sin `DECISION_REQUIRED`. Un test aportado en el PR cuenta como existente y no se ejecuta; sin «validado por ejecución» (INT §6.11, línea 874). Pendiente de cita contractual: tratamiento de un test nuevo del PR como «existente» y el caso de tests insuficientes.
- **OC03:** corregido. `functionalBehaviorValidated` no significa validación por ejecución (INT línea 874). `SKIPPED_HAS_TEST` queda «declarado por Core, pendiente de cita contractual» (no aparece en SYS, INT ni GH).
- **OC04:** corregido. `continuationAttemptId` es no nulo solo si Core encola continuación; es `null` mientras queden preguntas `PENDING` (INT línea 872). La respuesta válida es `202` con `FunctionalAnswerAcceptedResponse` (INT líneas 771, 835).
- **OC05:** sin cambios sustantivos.
- **OC06:** corregido. `history` y la transición `GITHUB_HEAD_SUPERSEDED` son «definidos, pendiente de implementación» (INT línea 765); no se afirman observables.
- **OC07:** corregido. Se quita la exigencia de regla `ACTIVE` en la entrada; el espejo (SYS línea 152) no la exige. La procedencia del comportamiento esperado queda pendiente de cita.
- **OC08:** formalizado con la precedencia de DEC-VAL-002 (SYS líneas 309–321), declarada como calculada por Core e implementada en Core (`WI-CORE-048`), no en Console. Propuestas `HELD` ante fallo técnico: pendiente de cita (INT línea 926 solo lo fija para `BEHAVIORAL_MISMATCH`).
- **OC09:** revisado con citas (SYS líneas 147, 149, 315; INT línea 1369).
- **OC10:** decisión confirmada, V1 mínimo: `indexMode: BOOTSTRAP` (INT línea 749) y texto de estado sin porcentajes. Umbral y progreso real: deuda «umbral de repo grande + progreso» (INT línea 761). Criterio de «snapshot suficiente»: pendiente de cita (SYS línea 114).
- **OC11:** decisión confirmada: Run `INFRASTRUCTURE_FAILURE` con Check `neutral` y `resultSummary` literal (INT línea 761, `WI-CORE-046`). Console lo muestra como texto libre (`AnalysisRunDetailPage.tsx:23, 257–258`; prueba `AnalysisRunDetailPage.test.tsx:153–169`). Se corrige la dependencia del «300»: el límite pertenece a GitHub Integration (GH línea 49). Batches con `SUCCESS`: fuera del happy path, no afirmado.
- **OC12:** revisado con citas (SYS líneas 143, 150, 321; `status.ts:13, 22`).
- **OC13:** revisado. La invariante «no pasa a `DIRECTLY_CHANGED` por estar relacionado» queda pendiente de cita.
- **OC14:** decisión confirmada, opción A: `BEHAVIORAL_MISMATCH` con evidencia, sin `ACTION_REQUIRED` (SYS línea 136, «clasifica con evidencia»; SYS línea 152). Selección de la regla contrastada y tratamiento de regla desactualizada: pendientes de cita. Contradicción semántica vía LLM: pendiente (INT línea 876).
- **OC15:** formalizado: respuesta tardía a pregunta `OBSOLETE` → `404 FUNCTIONAL_QUESTION_NOT_FOUND` (INT línea 774). Console: `FocusModePage.tsx:61, 118–119`; `errors.ts:100–105`; `action-required/queries.ts:63`; prueba `FocusModePage.test.tsx:296–314`. Se elimina la frase que decía que el código no estaba fijado.

## Afirmaciones pendientes de cita contractual

1. Tests aportados en el PR tratados como «existentes» (OC02).
2. Tratamiento de tests aportados insuficientes (OC02).
3. `SKIPPED_HAS_TEST` para símbolos con `hasTest` (OC03).
4. Criterio de «snapshot suficiente» del bootstrap (OC10).
5. Batches de PR grande y posible `SUCCESS` por batches (OC11).
6. Un símbolo no pasa a `DIRECTLY_CHANGED` por estar relacionado (OC13).
7. Selección entre pedir decisión humana o clasificar con evidencia, y tratamiento de regla desactualizada (OC14).
8. Regla `ACTIVE` contrastada cuando hay varias, y regla desactualizada (OC14).
9. Origen del comportamiento esperado en OC07.

## Hallazgos en Console (no corregidos; fuera de alcance)

- `AnalysisRunDetailPage.tsx:197–198`: el texto de bootstrap dice «se indexó el repositorio completo»; SYS línea 114 solo fija «snapshot suficiente». Requiere WI de código.
- `AnalysisRunDetailPage.tsx:270`: se monta `PublishSection` también para `BEHAVIORAL_MISMATCH`. El botón no aparece sin propuestas `AVAILABLE` (`AnalysisRunDetailPage.tsx:71`), y `AnalysisRunDetailPage.test.tsx:95–101` lo verifica. Conviene revisar que el montaje no sea innecesario.

## Verificación

- `node scripts/sdd-check.mjs`: OK.
- `node harness/validate-harness.mjs`: FALLA con «activeWorkItem contractSyncReview must match registry» (`harness/validate-harness.mjs:79`). Es un desajuste entre `harness/state.json` y `harness/work-items.json`, ficheros que este corte no toca y que ya estaban modificados al inicio. Lo debe resolver el Leader.

## Estado del corte

Corte documental completo según el alcance aprobado (A–D), con las pendientes listadas. El WI no queda terminado: falta la revisión independiente del usuario (Human Reviewer), y `validate-harness` no pasa por motivo ajeno a este corte. Ningún caso está declarado implementado, cubierto, `O-READY` ni `O-COVERED`.

## Correcciones ciclo 1

Solo texto en `spec/features/013-pr-driven-control-plane/spec.md` (Casos operativos); sin cambios de sentido ni de código.

- **H2 (OC15):** «reevaluación de cualquier regla potencial» sustituida por lo que dice el espejo: «el Run actual evalúa su propio contexto» (INT línea 880).
- **H3 (OC08):** `HELD` cubre `BEHAVIORAL_MISMATCH` y `TECHNICAL_GENERATION_FAILURE` según INT línea 928; citado y retirado de pendientes.
- **H4 (OC10):** rango de prueba corregido a `AnalysisRunDetailPage.test.tsx:171–176`.
- **H5 (OC13):** campos `qualifiedName`, `filePath`, `kind`, `changeKind` citados en `AnalysisSymbolResponse` (INT §6.10, líneas 722–728).
- **Contract-review 1 (OC04):** «no deja runners esperando» citado a SYS línea 135 (SYS línea 103 solo fija que `ACTION_REQUIRED` termina el job actual).
- **Contract-review 2 (OC08):** `status.ts:8–10`.
- **Contract-review 3 (OC14):** opción A marcada como decisión del usuario; la selección entre decisión humana o clasificación con evidencia queda «declarado por Core, pendiente de cita contractual» (SYS línea 136).
- **Contract-review 4 (OC15):** rutas completas `app/src/control-plane/errors.ts` (verificado con grep; existen tres `errors.ts`).

Pendientes de cita actualizadas: se retira `HELD` (OC08) y se añade la selección de OC14. `node scripts/sdd-check.mjs`: OK.
