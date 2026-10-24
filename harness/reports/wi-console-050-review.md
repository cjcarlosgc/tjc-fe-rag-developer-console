# WI-CONSOLE-050 — revisión independiente (ciclo 1 de 2)

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Veredicto: APPROVED** (con observaciones menores no bloqueantes). Fecha: 2026-10-22. HEAD revisado: b17ca25.

## Alcance
- `git show bc17790`: solo `components.css` (+1 línea, `position: relative` en `.table-frame`) y `cssRegressionGuards.test.ts`. Sin copy, DTO, rutas, contratos ni primitives; no se tocan WI-047, `reasoningEffortMessage` ni WI-005/006. Respeta `wi-console-050-scope-approval.md`.
- `contractImpact=false` coherente (CSS + prueba); Contract Sync NOT_RELEVANT con motivo y digest para los 4 eventos.

## Guarda
- Roja verificada por mí: quité temporalmente la línea `position: relative` de `.table-frame` → `1 failed | 12 passed` (falla «.table-frame declara position: relative…»). Restaurado; `git status` limpio.
- Escaneo regex `<(th|td)\b[\s\S]*?visually-hidden[\s\S]*?</\1>`: razonable para una guarda débil. Observaciones (no bloqueantes): (a) puede dar falsos positivos si un `<th>` anterior sin hidden precede a un `visually-hidden` posterior y luego hay otro `</th>` en el mismo archivo (el lazy cruza celdas); sesgo hacia fallar, aceptable; (b) falso negativo posible: el chequeo es a nivel de archivo (`includes('table-frame')`), no por tabla, y no cubre estilos que no pasen por `.tsx` ni clases dinámicas; (c) `\b` evita `<thead`/`<tbody`. La lista de excepciones vacía y la guarda dura sobre CSS cubren la causa raíz. jsdom no mide layout; la evidencia de layout está en el reporte de implementación.

## Impacto visual de `position: relative`
- Usuarios de `.table-frame`: Inventario, StructuredAlternativeView y ExperimentComparison (único con `visually-hidden` dentro de th). `position: relative` no altera flujo; el focus ring `.table-frame[role='region']:focus-visible` usa outline (no depende de position). Sin `sticky`/`z-index` descendientes en estas tablas. Mediciones del leader (reportadas, no repetidas por mí): sin desborde del documento en 1280/375/320 tras el cambio; scroll interno de la tabla intacto.

## Registro del Harness
- `work-items.json` y `state.json`: WI-CONSOLE-050 `W-IN_REVIEW`, `activeWorkItem` consistente, storyIds HU17/HU18, taskIds ST-CONSOLE-052, `decisionGate` verificado, Contract Sync registrado. Gates: sddVerified, implementationCompleted, technicalChecksPassed, interopSyncChecked, noMocksPresentedAsLive, noBlockingDecisions = PASSED; independentReviewPassed, retryLimitRespected y uxReviewed = NOT_RUN (pendientes de cierre, el leader los actualiza tras mi veredicto y el ux-reviewer); gates de contrato N/A.
- `tasks.md` ST-CONSOLE-052 `T-IN_PROGRESS` enlazado al WI (debe pasar a T-DONE con CHANGELOG al cierre).
- Reportes con línea `Modelo:` presentes (scope-approval, sdd-verification, contract-sync-review, implementation).
- Pendiente de cierre (no hallazgo): entrada de `CHANGELOG.md` y cierre de ST-CONSOLE-052 / `uxReviewed` tras el ux-reviewer.

## Gates ejecutados por mí (PATH node22)
| Gate | Resultado |
|---|---|
| `pnpm lint` (app) | exit 0 |
| `pnpm exec tsc -b --noEmit` | exit 0 |
| `pnpm test --maxWorkers=4` | 94 archivos, 963 tests passed |
| `pnpm build` | exit 0 |
| `pnpm format:check` | exit 0 |
| `pnpm contracts:check` | exit 0 |
| `node scripts/sdd-check.mjs` | SDD check OK |
| `harness/validate-work-items.mjs` | passed (CONSOLE, 50 WI) |
| `harness/validate-harness.mjs` | Harness V3 validation passed |

No lancé dev servers. No edité código; árbol limpio tras la prueba roja.
