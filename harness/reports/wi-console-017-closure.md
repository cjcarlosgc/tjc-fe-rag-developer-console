# Cierre — WI-CONSOLE-017

**Fecha:** 2026-10-09
**Estado:** `W-DONE`
**Historias:** HU12, HU15, HU17
**Subtarea:** ST-CONSOLE-019

## Resultado

- Descarga de evidencia JSON versionada (INTEROP-2.7 §6.16) desde el detalle del Run, `ExperimentPage` y `RetrievalComparisonPage`, solo con sujeto terminal; los bytes de Core se entregan crudos con `response.text()`. Módulo `app/src/evidence/` (tipos, api, descarga, componente `EvidenceDownload`), mock rotulado DEMO · DATOS SIMULADOS y adapter live con `PendingContractError` hasta `WI-CONSOLE-020`.
- `RunComparisonPage` no ofrece evidencia (la comparación de experimento se descarga desde `ExperimentPage`).
- La evidencia no usa caché de React Query; `useEvidence` queda sin uso en la UI (limpieza futura).
- `ST-CONSOLE-019` a `T-DONE`.

## Decisiones del Human Reviewer

Ver `wi-console-017-user-review.md`. Las dudas de contrato A–E quedan como preguntas abiertas para Core y como criterio/dependencia externa abierta de `WI-CONSOLE-020`.

## Verificación

lint, `tsc -b --noEmit`, vitest completo (66 archivos, 645 pruebas) y build verdes, reejecutados al cierre. SDD, decisionGate (`blockingDecisionIds: []`), UX (`APPROVED`, un ciclo de corrección) y revisión independiente del usuario: `APPROVED`. Contract Sync `before-done`: PASS (ejecución real con `--record`); sin eventos publicados (`contractImpact: false`).

## Observaciones no bloqueantes (sin abrir WI)

a. Un experimento FAILED sigue mostrando «Preparando experimento» sin mensaje de fallo (previo a este WI).
b. El borde del botón de evidencia tiene contraste 1.15:1.
c. Las rutas 409 y de error real solo están cubiertas por pruebas (el mock no tiene disparador).
d. La comparación de retrieval no se verificó en navegador (el polling se pausa en pestaña oculta).
e. El foco del botón de evidencia se corrigió con una regla propia (cambio mínimo del Leader, 3px).
f. Revisión UX en 1 de 2 ciclos.

Siguiente: `WI-CONSOLE-020` espera a Core (único WI restante de SMART V3); P2 al final: `WI-CONSOLE-004` a `007`. No se abre ni selecciona otro WI.
