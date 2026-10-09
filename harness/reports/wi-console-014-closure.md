# Cierre — WI-CONSOLE-014

**Fecha:** 2026-10-08
**Estado:** `W-DONE`
**Historias:** HU05, HU17
**Subtarea:** ST-CONSOLE-016

## Resultado

- Módulo `app/src/retrieval-comparison` (types, api, queries, `RetrievalComparisonPage`) y ruta `/projects/:projectId/runs/:analysisRunId/retrieval-comparison`, con el CTA «Comparar retrieval SE vs SEM» en `AnalysisRunDetailPage`.
- Selector explícito del símbolo DIRECTLY_CHANGED METHOD/FUNCTION (sin auto-inicio), `POST /retrieval-comparisons` con `Idempotency-Key` estable, polling con `pollAfterMs`, comparaciones previas sin reemplazar, rol mínimo Writer, rótulo Modo experimental, sin ganador ni estadística.
- Resultado SE vs SEM lado a lado (ranking, `semanticScore`, `structuralRelation`, `combinedScore` solo SE, selección); métricas P@5/R@5/P@10/R@10 o «no disponible» si `metrics` es null; estados PENDING/RUNNING/COMPLETED/FAILED accesibles; errores 404/409/422 de §6.15 en `control-plane/errors.ts`.
- Live: el adapter responde `PendingContractError` hasta `WI-CONSOLE-020`. Mocks rotulados DEMO · DATOS SIMULADOS.
- `ST-CONSOLE-016` a `T-DONE`.

## Decisiones del Human Reviewer

1. `correlationId` en FAILED: no se acepta la desviación; se pide a Core exponerlo en el DTO de estado (§6.15). Solicitud en `wi-console-014-core-request-correlationid.md` y dependencia externa abierta para `WI-CONSOLE-020`. **Ese criterio del AC4 queda pendiente de dependencia externa, no cumplido.**
2. Código de error de resultados FAILED (mock `409 RETRIEVAL_COMPARISON_NOT_FINISHED`): se deja; pregunta abierta para Core antes de `WI-CONSOLE-020` (incluida en la solicitud).
3. Verdad de terreno: la UI no la ofrece (AC3); en live `metrics` será `null`.

## Revisión y dependencias

- SDD, decisionGate (`blockingDecisionIds: []`), contractual (PASS_WITH_NOTES), UX (inicial `CHANGES_REQUESTED` B1–B3, re-revisión `APPROVED`) y revisión independiente del usuario: `APPROVED`. Ciclos de corrección: 1 de 2.
- Contract Sync `before-done`: PASS; `CS-20260920-003`, `CS-20260921-001/002/003` quedan `NOT_RELEVANT` para este WI. No se publicó ningún evento (`contractImpact: false`, `publishesContract: false`).
- Dependencia externa abierta: Core debe exponer `correlationId` en el DTO de estado de §6.15 y responder el código de resultados FAILED; consume `WI-CONSOLE-020`.

## Verificaciones (leader, 2026-10-08)

- `app/`: `npm run lint` OK; `node node_modules/vitest/vitest.mjs run --maxWorkers=2` 59 archivos / 547 pruebas verdes; `npm run build` OK (advertencia no bloqueante de bundle >500 kB).
- Validadores del Harness y SDD: ver el commit de cierre. Sin push ni PR.

## Observaciones no bloqueantes (diferidas por el usuario; sin abrir WI)

a. Anillo de foco global ≈2.7:1 (<3:1): deuda transversal.
b. Separadores globales de bajo contraste (breadcrumbs 1.45:1, repo-sep 3.89:1).
c. `.analysis-run-summary` desborda a 375 px y 13 px a 1024 px por el botón de cabecera.
d. El sello DEMO se estira a 375 px en el detalle de Run.
e. P@10/R@10 con borde ≈2.7:1 (redundante con la negrita).
f. Procedencia de las métricas de ejemplo.
g. Texto del Reader sin comparaciones previas.
h. Orden, tamaño de página y 12 candidatos del mock (vs 20) son demo; confirmar el contrato en `WI-CONSOLE-020`.
i. Pruebas flaky por carga.
j. Sin prueba con lector de pantalla real.
k. `npx vitest` da 127 en el shell del implementer; usar `node node_modules/vitest/vitest.mjs`.

Siguientes elegibles por prioridad: `WI-CONSOLE-016`, `WI-CONSOLE-018`, `WI-CONSOLE-017`.
