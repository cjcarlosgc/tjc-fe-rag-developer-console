Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-026 — implementación

**Estado:** W-IN_PROGRESS → pendiente de revisión humana. Sin commit, sin push.

## Cambios

1. `EXPERIMENT_WORKER_LOST` (`app/src/experiments/failureMessages.ts`): «Se interrumpió el procesamiento y puede reanudarse.» → «El experimento se interrumpió; vuelve a crearlo.». Comentario ajustado. `EXPERIMENT_FAILED` y códigos desconocidos sin cambio.
2. `UNSUPPORTED_PROJECT`: fuente única `UNSUPPORTED_PROJECT_MESSAGE` exportada desde `app/src/control-plane/errors.ts` (texto sin variante): «Este proyecto no tiene framework JEST, VITEST o PHPUNIT detectado.». `codeMessages` la usa; `app/src/api/mockBackend.ts` la reutiliza (antes «… (DEMO).»). Sin ciclo de imports (`errors.ts` solo importa `api/client`). Grep: única definición fuera de tests.
3. Mock `evidenceExperimentRepetition` (`mockBackend.ts`): sin `?? 1` ni `=== true`. Si `attempt` o `technicallyEvaluable` son null, no se emiten las filas `sandbox[]` ni `experimental[]`; `generation[]` se emite con `attempt: null`. Donde hay dato se emite tal cual. Comentario actualizado.
   - Decisión de implementación: la condición es «ambos datos presentes» (no solo «ambos null»), para no emitir null en un campo no nulable del contrato en un caso mixto. Con los fixtures actuales es equivalente.
4. `ExperimentComparison.tsx`: columnas «Intento» y «Evaluable» (encabezado y celdas) solo si alguna repetición trae `attempt` o `technicallyEvaluable`. Celda vacía en la repetición sin dato. `technicallyEvaluable=false` con `attempt=2` sigue mostrando «No» y la marca «técnicamente no evaluable». Helper `evaluableText` eliminado por no uso. No se tocaron `liveMapping.ts`, `evidence/types.ts` ni contratos.

## Textos antes / después

- Worker lost: «Se interrumpió el procesamiento y puede reanudarse.» → «El experimento se interrumpió; vuelve a crearlo.»
- Unsupported project (errors.ts, experimentos y OE2): sin cambio de texto; ahora es constante única. Mock: «El proyecto no tiene framework JEST, VITEST o PHPUNIT detectado (DEMO).» → «Este proyecto no tiene framework JEST, VITEST o PHPUNIT detectado.»

## Pruebas

- `ExperimentPage.test.tsx`: texto worker-lost actualizado (2 aserciones); UNSUPPORTED usa la constante; nuevos tests: legacy sin columnas Intento/Evaluable ni «1.º»; `mixed-sandbox` con «2.º», columnas y «técnicamente no evaluable».
- `mockBackend.test.ts`: bundle legacy sin `experimental`/`sandbox`, `generation.attempt` null; bundle mixed con `attempt 2` y `technicallyEvaluable false`; 422 del mock con la constante.
- `evidence/api.test.ts`: legacy sin filas `sandbox`/`experimental` (antes asertaba null en esas filas).
- `ExperimentComparison.test.tsx`: caso null sin columnas Intento/Evaluable; par y posición siguen en «no disponible».
- `errors.test.ts`, `RetrievalComparisonPage.test.tsx`: aserción contra la constante.

## Resultados

- `npm run lint`: sin errores.
- `npx tsc -b --noEmit`: sin errores.
- `node node_modules/vitest/vitest.mjs run --maxWorkers=2`: 67 archivos, 726 tests, todos pasan.
- `npm run build`: OK (aviso preexistente de chunk > 500 kB).

## Fuera de alcance / notas

- `app/src/retrieval-comparison/failureMessages.ts` mantiene `RETRIEVAL_COMPARISON_WORKER_LOST` («Se interrumpió el procesamiento de la comparación antes de terminar.»). No promete reanudar; no se tocó porque el alcance aprobado cubre solo `EXPERIMENT_WORKER_LOST`.
- El espejo INTEROP §6.5.1 (nota «puede reanudarse») no se editó.
- Riesgo a verificar en revisión: consumidores de `experimental[]`/`sandbox[]` que unen por `repetition` ante la ausencia de filas en el mock (`EvidenceDownload`). Las pruebas de evidencia pasan.
- Pendiente de decisión humana: la interpretación de «omitir» (sección c de `wi-console-026-sdd-verification.md`).
- Sin cambios en `harness/` salvo este reporte; `harness/state.json`, `harness/work-items.json` y `tasks.md` ya estaban modificados antes de esta sesión.
