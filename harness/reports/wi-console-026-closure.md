# Cierre — WI-CONSOLE-026

**Fecha:** 2026-10-12
**Estado:** `W-DONE`
**Historias:** HU12, HU15, HU17
**Subtarea:** ST-CONSOLE-028

## Resultado

- `EXPERIMENT_WORKER_LOST` muestra «El experimento se interrumpió; vuelve a crearlo.»; `EXPERIMENT_FAILED` y los códigos desconocidos sin cambio.
- `UNSUPPORTED_PROJECT`: una sola constante (`UNSUPPORTED_PROJECT_MESSAGE`, `app/src/control-plane/errors.ts`) compartida por la creación de experimentos, la comparación OE2 y el mock.
- Corridas antiguas del mock sin `attempt` ni `technicallyEvaluable`: el mock omite las filas `sandbox[]`/`experimental[]` y la comparación omite las columnas Intento/Evaluable si ninguna repetición trae el dato; donde existe se muestra, incluido `technicallyEvaluable=false` con `attempt=2`.
- Sin cambios de contratos, DTO, API ni adapters live. El proyecto demo PHP propio queda en backlog.

## Decisiones del Human Reviewer

Ver `wi-console-026-user-review.md`: APPROVED; se mantiene la omisión de filas (lectura del Leader del «si»; la alternativa de alinear con el contrato, 1/true, sigue disponible si el usuario la pide). La desviación respecto de INTEROP §6.16 es del mock, no del live.

## Verificación

lint, `tsc -b --noEmit`, vitest completo (67 archivos, 726 pruebas) y build verdes, reejecutados al cierre. SDD, decisionGate (`blockingDecisionIds: []`), UX (`APPROVED`, contraste computado >= 9.5:1) y revisión independiente del usuario: `APPROVED`. Contract Sync `before-done`: ejecución real con `--record`, sin eventos relevantes pendientes (`contractImpact: false`).

## Observaciones no bloqueantes (sin abrir WI)

a. Las celdas Intento/Evaluable sin dato quedan vacías en una corrida mixta (podrían llevar «—»).
b. `RETRIEVAL_COMPARISON_WORKER_LOST` no dice «vuelve a crearlo» (fuera de alcance).
c. El texto de INTEROP §6.5.1 sigue diciendo «puede reanudarse»; es espejo canónico y no se edita aquí; plantearlo a Core.
d. La tabla de comparación desborda en horizontal con datos (preexistente).
e. `UNSUPPORTED_PROJECT` en OE2 solo está cubierto por `RetrievalComparisonPage.test.tsx`, porque el mock no lo dispara.
f. Los eventos `CS-CORE-20261012-002`, `-003` y `-004` siguen sin acusar (fuera de alcance; requieren un WI documental de sync).
g. El proyecto demo PHP propio queda en backlog.

## Siguiente

1. WI documental de sync para acusar `CS-CORE-20261012-002/-003/-004` y otros `C-PENDING` relevantes.
2. Reanudar `WI-CONSOLE-004` con las decisiones del usuario sobre OC02, OC10, OC11 y OC14.

No se abre ni selecciona otro WI. Sin push.
