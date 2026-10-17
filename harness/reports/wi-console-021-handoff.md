# WI-CONSOLE-021 — Handoff (2026-10-10)

Estado: **W-IN_PROGRESS** (no se pasó a W-IN_REVIEW: faltan ux-reviewer y contract-reviewer). Rama `feature/jean`, HEAD `b6e0c3e`, **sin commit de código, sin push**. `awayMode` desactivado: el reviewer independiente es el usuario.

## Gates (`harness/state.json`)
- G-PASSED: sddVerified, implementationCompleted, technicalChecksPassed, noBlockingDecisions.
- G-NOT_RUN: uxReviewed, contractReviewed, canonicalContractSynced, independentReviewPassed, interopSyncChecked, noMocksPresentedAsLive, retryLimitRespected. contractSyncPublished: N/A.
- Checkpoints Contract Sync registrados: `start` y `implementation-delivery` (14:59Z; ya no puede repetirse, "una vez y en orden"). **`before-review` NO registrado**; su `check` sin `--record` hoy da 0 pendientes. `before-done` no corrido (lo corre el cierre con el WI activo).
- ST-CONSOLE-023 en `T-IN_PROGRESS` (`spec/features/014-analysisrun-experiments/tasks.md`); `T-DONE` solo al cerrar.

## Qué contiene el árbol (sin commit)
- `spec/contracts/*`: espejos SYSTEM-2.6, INTEROP-2.7, GH-INTEROP-1.3. INTEROP se refrescó a Core `a7c04cef` (= `825e417`, publicada en origin/feature/jean). SHA-256: system `670a1ef0…7dc2`, interop `a70782eb…988f`, gh `d1779bbd…0b964` (completos en `wi-console-021-contract-sync-php-acknowledgement.md`). Comparados con `git show 825e417:…` (no working tree de Core).
- `app/src/**`: cortes A/B (OE5 nulls, FAILED, 422/503, OE2, trace, escenarios DEMO), y corte C de esta sesión: relaciones PHP en Context Explorer, OE2 sin 422 por PHP, copy `UNSUPPORTED_PROJECT` (JEST/VITEST/PHPUNIT), fila «Runner» en Configuración del experimento, tipos de `/evidence` alineados a §6.16, mock con nulls, `displayScenarioKey` en la lista de Functional Knowledge.
- Reportes: `wi-console-021-{sdd-verification,contract-sync-scope-review,implementation(+Corte C),contract-review,contract-sync-php-acknowledgement,handoff}.md`.
- `harness/contract-sync/inbox/*`: eventos -002..-018 acusados y resueltos (resolutionEvidence: implementation.md). `.claude/launch.json` sin seguimiento (config console-mock).

## Verificación hecha (todo verde, reejecutada por el leader tras el corte C)
```
cd app && npx eslint .                                   # exit 0
cd app && npx tsc -b --noEmit                            # exit 0
cd app && node node_modules/vitest/vitest.mjs run --maxWorkers=2   # 67 files, 716 tests
cd app && npm run build                                  # ok (aviso de chunk preexistente)
node harness/validate-harness.mjs; node harness/validate-work-items.mjs; node harness/validate-completions.mjs   # passed
node harness/contract-sync.mjs check --checkpoint before-review --work-item WI-CONSOLE-021   # 0 pendientes (sin --record)
```
No hubo verificación visual en navegador ni contraste computado.

## Hallazgos de Contract Sync -016 a -018
- Los `sourceRevision` (123f8ed, 8f4ddd1, c1343cf) están en la rama PHP de Core, con base anterior a WI-CORE-027: su INTEROP no trae `/evidence` ni tasas nulas. Usar esos commits habría regresionado el espejo. La revisión canónica correcta es `a7c04cef`. Core debería alinear el `sourceRevision` de los eventos o confirmarlo.
- -016: aditivo de Sandbox/§7 (failureKind, phase); sin cambio funcional en Console.
- -017: tres relaciones PHP en `matchedVia`/`structuralMatch`, OE2 sin 422 PHP: adoptado.
- -018: experimentos PHP/PHPUnit (`runnerHint` PHPUNIT, perfil PHP_LARAVEL_PHPUNIT), 422 solo sin JEST/VITEST/PHPUNIT: adoptado en mock y copy. Live sigue en WI-CONSOLE-020.
- -013/-014: el contract-review (CHANGES_REQUESTED) objetaba cerrar -014 sin tipar `/evidence`; el corte C lo hizo (tipos y mock, adapter live sigue `PendingContractError`). Del -013 permanece la obligación de emitir `CS-CONSOLE-…` al completar WI-CONSOLE-020 (no es de este WI). El contract-review NO se ha repetido sobre el delta: el reporte existente es previo.

## Falta, en orden
1. `ux-reviewer` (obligatorio; hay UI visible: «—» duración, «sin datos evaluables», 422/503, fila Runner, relaciones PHP, FAILED). Mock `http://localhost:5173` (config `console-mock`), con contraste computado real. Máx. 2 ciclos.
2. `contract-reviewer` sobre el delta (corte C, -014, -016..-018) y registrar handoff.
3. Registrar gates con evidencia (uxReviewed, contractReviewed, canonicalContractSynced, interopSyncChecked, noMocksPresentedAsLive, retryLimitRespected) y `reviewAgent: human-reviewer`; `check --checkpoint before-review --record`; pasar a W-IN_REVIEW.
4. Veredicto humano (usuario).
5. `before-done --record` con el WI activo, `T-DONE` de ST-CONSOLE-023, CHANGELOG ya tocado, commit de cierre con `Refs: HU05, HU07, HU12, HU15, HU17` y `Co-Authored-By`; sin push hasta pedirlo.
6. Después: WI-CONSOLE-020 (ya no dependería de -021 abierto; conserva `/evidence` live, adapters y CS-CONSOLE).

## Decisiones/preguntas abiertas para el usuario
1. Ampliación de alcance hecha por el leader previo: -014/-015 se resuelven en este WI (AC1 enmendado) y WI-CONSOLE-020 AC5 aún los lista; reconciliar. ¿Aprueba el alcance ampliado (corte C incluye PHP y tipos de evidencia)?
2. Mock: `attempt` y `technicallyEvaluable` no admiten null; en corridas previas el mock usa 1 y false. ¿Confirmar con Core u omitir esas filas?
3. Semilla DEMO PHP (`rcmp_demo_seed_php`) cuelga de un Run TypeScript; ¿proyecto DEMO PHP propio?
4. ¿Copy distinto de `UNSUPPORTED_PROJECT` para OE5 y OE2?
5. `EXPERIMENT_WORKER_LOST` dice «puede reanudarse» pero el contrato no define ruta de reanudación (solo texto).
6. Escenarios DEMO: `demo-scenario-{legacy,mixed-sandbox,no-evaluable,failed-experiment-failed,failed-worker-lost,failed-unknown,phpunit}`, `demo-error-{reasoning-effort,unsupported-project,llm-unavailable}`; OE2 `rcmp_demo_seed_php`.
