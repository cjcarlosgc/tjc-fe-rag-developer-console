# Cierre — WI-CONSOLE-016

**Fecha:** 2026-10-08
**Estado:** `W-DONE`
**Historias:** HU12, HU15
**Subtarea:** ST-CONSOLE-018

## Resultado

- Sección «Trace operativo» en `AnalysisRunDetailPage` (`OperationalTraceSection`), que consume `GET /analysis-runs/{id}/trace` (INTEROP-2.7 §6.16) y muestra los nueve enlaces con PRESENT / NOT_APPLICABLE, varios targets, `retrieval_id`, `context_id` y `execution_id` con botón «Copiar» accesible (`CopyButton`), sin veredictos inventados.
- NOT_APPLICABLE informativo (no ErrorNote); 409 `EVIDENCE_NOT_FINISHED` con polling mientras el Run está QUEUED/PROCESSING.
- Live: el adapter responde `PendingContractError` hasta `WI-CONSOLE-020`. Mocks rotulados DEMO · DATOS SIMULADOS.
- `ST-CONSOLE-018` a `T-DONE`.

## Decisiones del Human Reviewer

Ver `wi-console-016-user-review.md`: 404 provisional `ANALYSIS_RUN_NOT_FOUND` (a confirmar en `WI-CONSOLE-020`) y Runs QUEUED/PROCESSING en un mapa solo-trace del mock.

## Revisión y dependencias

- SDD, decisionGate (`blockingDecisionIds: []`), UX (`APPROVED`, un ciclo de corrección) y revisión independiente del usuario: `APPROVED`. Contract Sync `before-done`: PASS; sin eventos publicados (`contractImpact: false`).
- Dependencia de `WI-CONSOLE-020`: confirmar el código 404 del trace y verificar el contrato real del trace contra Core.

## Verificaciones (leader, 2026-10-08)

- `app/`: `npm run lint` OK; `node node_modules/vitest/vitest.mjs run --maxWorkers=2` 62 archivos / 589 pruebas verdes; `npm run build` OK (advertencia no bloqueante de bundle >500 kB). Validadores: ver el commit de cierre. Sin push ni PR.

## Observaciones no bloqueantes (sin abrir WI)

a. N4 del UX: scroll horizontal previo a 375 px por `ul.symbol-list`, `li.test-proposal-item` y `status-badge` (secciones anteriores de la página, no del trace).
b. Sin prueba de equivalencia Reader/Writer/Admin en la sección: el componente no recibe rol; el mock fija el rol por proyecto y los Runs con trace son solo ADMIN.
c. `checkId` siempre `null` en el mock (no se inventa).
d. Las tres correcciones UX (N1 ámbar de la nota demo, N2 reset y re-anuncio de «Copiado», N3 sin `aria-describedby`) están verificadas solo por pruebas, no en navegador.
e. El éxito de «Copiar» no se verificó en un navegador real (portapapeles rechazado por el navegador de automatización).
f. Dependencia de `WI-CONSOLE-020`: confirmar el 404 y el contrato real del trace.

Siguientes elegibles por prioridad: `WI-CONSOLE-018`, `WI-CONSOLE-017`.
