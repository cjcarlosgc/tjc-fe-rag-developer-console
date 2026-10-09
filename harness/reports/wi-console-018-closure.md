# Cierre — WI-CONSOLE-018

**Fecha:** 2026-10-09
**Estado:** `W-DONE`
**Historias:** HU17
**Subtarea:** ST-CONSOLE-020

## Resultado

- Los campos de INTEROP-2.7 §6.5.1 se tipan y mapean (opcionales) en `experiments/types.ts` y `liveMapping.ts`; la tabla «Detalle por target y repetición» agrega Par, Posición, Intento y Evaluable, y el bloque «Configuración» muestra model, budget, executionProfile y randomizationSeed. Los `null` o ausentes se muestran «no disponible», nunca cero.
- «Técnicamente no evaluable» se marca en texto; las filas de tasas son diferencias neutras (sin `positive-delta`/`negative-delta`), sin ganador automático, sin CF/CO derivados y sin Precision/Recall en OE5.
- El adapter live NO pasa a `PendingContractError`; el mock sigue rotulado DEMO · DATOS SIMULADOS.
- `ST-CONSOLE-020` a `T-DONE`.

## Decisiones del Human Reviewer

Ver `wi-console-018-user-review.md`: adapter live opcional («el adapter no usa campos no publicados») y `reasoningEffort` `high` del mock ilustrativo.

## Revisión

SDD, decisionGate (`blockingDecisionIds: []`), UX (`APPROVED`, un ciclo de corrección) y revisión independiente del usuario: `APPROVED`. Contract Sync `before-done`: PASS; sin eventos publicados (`contractImpact: false`).

## Observaciones no bloqueantes (sin abrir WI)

a. «VS» de la cabecera de estrategias con contraste 4.02:1 (preexistente).
b. La medición automática de 2.19:1 en `errorSummary` es un artefacto del fondo semitransparente.
c. La activación y verificación live de los campos §6.5.1 contra Core sigue en `WI-CONSOLE-020`.
d. `runnerHint` se tipa y mapea, pero no se muestra.
e. Revisión UX en 1 de 2 ciclos.

Siguiente elegible por prioridad: `WI-CONSOLE-017`; `WI-CONSOLE-020` espera a Core.
