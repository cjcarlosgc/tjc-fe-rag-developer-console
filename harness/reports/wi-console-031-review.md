# WI-CONSOLE-031 — revisión independiente (ciclo 1 de 2)

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Veredicto: APPROVED** (con observaciones menores no bloqueantes)

Independencia: el implementer fue otro agente (claude-haiku-5-5); awayMode activo. No sustituye decisiones `DEC` ni la aprobación de alcance del usuario (`wi-console-031-scope-approval.md`).

## Verificado por cuenta propia

- Espejos: `cmp` de `git -C ../tjc-be-rag-core-api show 30b9acdf…:spec/contracts/{interoperability,system}-contract.md` contra `spec/contracts/*` → idénticos byte a byte.
- Referencias de versión INTEROP-2.8 → 2.9 actualizadas solo en `spec/README.md`, `spec/constitution/architecture.md`, `plan.md` y `spec.md`; no quedan menciones vigentes de 2.8 salvo `tasks.md:18` (ST-CONSOLE-027, histórico DONE, correcto).
- Alcance: no hay cambios de WI-CONSOLE-004 (permanece `W-READY` en work-items.json), ni DTO, rutas, cliente live ni CHANGELOG/históricos. `DEC-VAL-002` solo aparece en el espejo del contrato; ninguna cadena de `app/src` lo presenta como regla vigente.
- Inbox: `CS-CORE-20261012-005/006.yaml` coinciden con el outbox de Core salvo campos de consumidor (`consumerImportedAt`; -005 además `status: C-RESOLVED` + `acknowledgementEvidence`/`resolutionEvidence`). -006 queda `C-PENDING` (target github-integration). Correcto.
- `continuationAttemptId`: solo se declara en tipo (`types.ts:80`, con comentario «no consultable») y en el mock; ningún componente lo lee ni lo enlaza.
- Harness: `node harness/validate-harness.mjs` y `node harness/validate-work-items.mjs` pasan (31 WI CONSOLE).
- `npx tsc -b --noEmit`: sin errores. `vitest run src/action-required src/api`: 11 archivos, 151 pruebas OK. ESLint sobre los archivos tocados: sin salida/errores.

## Corrección del cambio de app/

- `errors.ts:99-105`: `isFunctionalQuestionObsolete` exige `status 404` + `code FUNCTIONAL_QUESTION_NOT_FOUND`; los 404 `ANALYSIS_RUN_NOT_FOUND`/403 no activan el aviso (cubierto por prueba).
- `queries.ts:63-69`: en ese error limpia la clave de idempotencia (no reenvía la misma pregunta con la misma clave) e invalida question-set e inbox. Correcto.
- `FocusModePage.tsx:48-77`: `obsoleteQuestionId` oculta la tarjeta de esa pregunta; `pendingAnswer` se limpia; el alert genérico se suprime y el foco va al aviso `role="status"`. Si el refetch trae otra pregunta, el aviso persiste porque deriva de `submitAnswer.error`, que sigue hasta el siguiente `mutate`; la nueva pregunta se muestra (id distinto). Al enviar de nuevo el error se resetea y el aviso desaparece.
- `mockBackend.ts:1649-1651`: 409 `QUESTION_NOT_PENDING`/404 `QUESTION_NOT_FOUND` → 404 `FUNCTIONAL_QUESTION_NOT_FOUND`. `grep` no halla otros consumidores de los códigos antiguos en `app/src`; sin regresión detectada.

## Observaciones menores (no bloqueantes)

1. `FocusModePage.tsx:48`: `obsoleteQuestionId` no se limpia nunca; es inocuo (solo oculta ese id, que el servidor declaró no accionable) pero un reset al cambiar de Run/pregunta sería más limpio. No requiere cambio ahora.
2. `FocusModePage.tsx:120-130`: con el aviso visible y sin pregunta vigente, el panel inferior puede decir «Contexto funcional confirmado» o «puede que el HEAD haya cambiado» junto al aviso; es coherente con el copy pero conviene que el UX reviewer (ya registrado en `wi-console-031-ux-review.md`) lo haya validado.
3. `CHANGELOG.md` figura en `specPaths` del WI pero no tiene diff; AGENTS.md exige registrar cambios funcionales aprobados en CHANGELOG. Confirmar en el cierre si este corte lo requiere (cambio de comportamiento de UI, sin contrato propio) o retirar la ruta de `specPaths`.
4. `state.json`/`work-items.json`: `tasks.md` mantiene `ST-CONSOLE-033` en `T-IN_PROGRESS` con casilla abierta; coherente con W-IN_REVIEW, debe pasar a DONE al cerrar.

Sin hallazgos bloqueantes ni decisiones abiertas.
