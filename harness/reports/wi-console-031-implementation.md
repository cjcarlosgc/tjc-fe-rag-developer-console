# WI-CONSOLE-031 — informe de implementación

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

## A. Espejos desde Core `30b9acdfbc063b027ad891799574b4553574559e`

- Ascendencia: `git merge-base --is-ancestor 76053463e1b073364861d417bc9c2217dccd11a2 30b9acdf…` → verdadero (descendiente).
- Espejos escritos con `git -C ../tjc-be-rag-core-api show "<rev>:spec/contracts/<archivo>"` (no el working tree).
- SHA-256 verificados tras copiar:
  - `spec/contracts/interoperability-contract.md` = `cf9c7c3167d99b67191caf9ec7c057a5ee3c7a0ccee8f303e55ba6708a08ca25` (esperado: igual)
  - `spec/contracts/system-contract.md` = `fe48d5d3f4980ce0e47d13b1750b3b827cf848184e9145086aeb07a81b0625a6` (esperado: igual)
  - `spec/contracts/github-integration-contract.md` = `584839c91a088918028bbe80cbf209d8d341246bcf3536288cff1ad0b02c1b34` (sin cambio, verificado)
- Diff de espejos (`git diff --stat`): interoperability 14 inserciones / 6 eliminaciones; system 15 inserciones. Hunks relevantes: cabecera `INTEROP-2.9` / `SYSTEM-2.9` (2026-10-12); aclaraciones §6.11 (404 `FUNCTIONAL_QUESTION_NOT_FOUND` y orden de errores de `POST …/answers`); `continuationAttemptId` nulo y opaco; semántica de `functionalBehaviorValidated`; línea de remisión de SYSTEM con `DEC-VAL-002` PROPOSED.

## B. Referencias de versión INTEROP-2.8 → INTEROP-2.9

- `spec/README.md:10`
- `spec/constitution/architecture.md:3`
- `spec/features/013-pr-driven-control-plane/plan.md:5`
- `spec/features/013-pr-driven-control-plane/spec.md:5` y `:41`
- Verificación: `grep INTEROP-2.8` restante solo en espejos (`system-contract.md`, `github-integration-contract.md`, `interoperability-contract.md` histórico) y en `tasks.md` (ST-CONSOLE-027, histórico; no tocado, lo hace el Leader). `CHANGELOG`, reports y `harness/` no tocados.

## C. Producto (archivo:línea clave)

- `app/src/control-plane/errors.ts`: nuevo `isFunctionalQuestionObsolete(error)` (status 404 y code `FUNCTIONAL_QUESTION_NOT_FOUND`) y `FUNCTIONAL_QUESTION_OBSOLETE_MESSAGE` = «Esta pregunta ya no aplica. El Run cambió o ya fue contestada; actualizamos el contexto pendiente.»
- `app/src/action-required/queries.ts`: `useSubmitFunctionalAnswer` añade `onError` que, solo ante ese 404, limpia la clave de idempotencia e invalida `actionRequiredKeys.questionSet` y `['action-required','list']`.
- `app/src/action-required/FocusModePage.tsx`: estado `obsoleteQuestionId`; la pregunta obsoleta deja de ofrecerse (no se reenvía la misma `questionId`); `pendingAnswer` se limpia; aviso `role="status"` con foco (`noticeRef`, `useEffect`); el alert genérico con Correlation ID se oculta para ese caso; ANALYSIS_RUN_NOT_FOUND y 403 siguen igual.
- `app/src/api/mockBackend.ts:1649-1650`: pregunta inexistente y no PENDING → `404 FUNCTIONAL_QUESTION_NOT_FOUND` (antes `QUESTION_NOT_FOUND` / 409 `QUESTION_NOT_PENDING`). `ANALYSIS_RUN_NOT_FOUND` intacto.
- `app/src/action-required/types.ts:77`: comentario INTEROP-2.9 (`continuationAttemptId` opaco, no consultable).
- Ningún cambio de DTO, rutas, enums ni live. `DEC-VAL-002` no aparece en `app/src` (grep: 0). `continuationAttemptId` no lo lee ningún componente.

## D. Pruebas

- `app/src/action-required/api.test.ts`: mock 404 `FUNCTIONAL_QUESTION_NOT_FOUND` para pregunta ya respondida y para pregunta inexistente; `ANALYSIS_RUN_NOT_FOUND` conservado; live 404 llega como `ApiError` con status y code.
- `app/src/action-required/FocusModePage.test.tsx`: 404 obsoleto (copy, foco en el aviso, sin alert ni Correlation ID, sin botón de la misma pregunta, refetch del question-set); 404 `ANALYSIS_RUN_NOT_FOUND` y 403 `PROJECT_ROLE_INSUFFICIENT` sin cambio; regresión de `continuationAttemptId` no nulo (`cont-opaque-7f3a`) no mostrado ni pedido en ninguna URL.
- Limitación: el refetch del inbox `['action-required','list']` no se asserta en la prueba (esa query no está montada en Focus Mode); queda cubierto por código y no por test. `ActionRequiredPage.test.tsx` no cambió.

## E. Gates (desde `app/`, todos con exit 0)

- `npm run lint` (`eslint .`): exit 0.
- `npx tsc -b --noEmit`: exit 0.
- `node node_modules/vitest/vitest.mjs run --maxWorkers=2`: 67 archivos, 748 tests passed.
- `npm run build` (`tsc -b && vite build`): exit 0 (aviso de chunks > 500 kB, preexistente, no bloqueante).
- Action Required aislado (`vitest run src/action-required`): 7 archivos, 109 tests passed.

## Conclusión

- Corte A-E: **COMPLETO** en su alcance técnico. Sin DECISION_REQUIRED: el evento no exigió cambio de DTO ni de ruta.
- Pendiente antes de cerrar el WI (no lo hago yo): revisión `ux-reviewer` obligatoria (cambio visible de UI); revisión independiente (Human Reviewer o `reviewer` por Modo fuera de casa); acuse de `CS-CORE-20261012-005` y actualización de `tasks.md`/`CHANGELOG.md` por el Leader; `CS-CORE-20261012-006` sigue `C-PENDING` (github-integration).
- No hice commit, push, PR ni toqué `harness/state.json`, `harness/work-items.json` ni `harness/contract-sync/`. No arranqué servidores de desarrollo; un proceso vite ya en ejecución no es mío y no lo detuve. No toqué WI-CONSOLE-004.
