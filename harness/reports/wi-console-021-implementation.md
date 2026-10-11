# WI-CONSOLE-021 — Implementación

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

Fecha: 2026-10-10. Rama `feature/jean`. Sin commit ni push. Fuente del contrato: `spec/contracts/interoperability-contract.md` §6.5 y §6.5.1 (refrescada desde Core `3f06f44`). Eventos leídos: `CS-CORE-20261009-008`, `-009`, `-010`, `-015` (`C-ACKNOWLEDGED`). `CS-CORE-20261008-008` no existe en `harness/contract-sync/inbox/` (la lista llega a `-007` en ese prefijo): n/a.

## Corte B1 — experimentos OE5 (HU12, HU15, HU17)

### Alcance implementado

1. **Tipos y mapeo** (`experiments/types.ts`, `experiments/liveMapping.ts`)
   - `model`, `budget`, `executionProfile`, `runnerHint`, `randomizationSeed` son `| null` en status y configuración. La configuración es parcial: si Core trae algunos campos, cada campo ausente queda `null` y la UI lo marca «no disponible» por separado. Solo devuelve `null` el bloque entero cuando no llega ningún campo de OE5 (corrida previa).
   - Repeticiones: `generationDurationMs`, `executionDurationMs` (`number | null`) y `totalDurationMs`. `durationMs` se elimina; la columna «Duración» muestra `totalDurationMs`.
   - `StrategyMetrics`: `validRate`, `compilationRate`, `executionRate`, `passedRate`, `generationDurationMs`, `executionDurationMs`, `totalDurationMs` son `number | null`; `evaluableRepetitions` y `nonEvaluableRepetitions` son opcionales (respuestas previas a CS-015). El mapeo no convierte `null` en `0`.
   - `ExperimentOperation` añade `failureCode` y `failureMessage` (`toExperimentOperation` ya no los descarta).
2. **Comparación** (`experiments/ExperimentComparison.tsx`)
   - Columna «Ejecución en Sandbox» en la tabla de repeticiones: `—` si `executionDurationMs` es `null`, `formatDuration` con cualquier número, incluido `7 ms`. Nunca `0` para null.
   - Tasas y medias `null`: «sin datos» (nunca 0 %, 0 ms ni «null»), y sin delta (`n/d`) si algún lado es `null`.
   - Respaldo de evaluabilidad bajo cada estrategia: «sin datos evaluables» si `evaluableRepetitions === 0` o todas las tasas son `null`; «N evaluables · M no evaluables» cuando existen los contadores. Sin contadores no se muestra nada.
   - `technicallyEvaluable=false` y `attempt=2` siguen sin declarar ganador.
3. **Estado FAILED** (`experiments/ExperimentPage.tsx`, `experiments/failureMessages.ts` nuevo)
   - FAILED muestra `role="alert"` con «El experimento no se completó», el mensaje por código y `failureMessage` como «Detalle:». Ya no aparece «Preparando experimento» ni la barra de progreso.
   - `EXPERIMENT_FAILED` → «El experimento falló durante la ejecución.»; `EXPERIMENT_WORKER_LOST` → «Se interrumpió el procesamiento y puede reanudarse.» (solo texto, sin botón); otro código → «El experimento terminó con un error no reconocido (código X).».
   - Rótulo `DEMO · DATOS SIMULADOS` dentro del estado FAILED cuando el origen es mock.
4. **Errores de creación** (`control-plane/errors.ts`)
   - `422 REASONING_EFFORT_UNSUPPORTED`: lista `details.supportedEfforts` solo si es `string[]` no vacío; si falta `details` o no es válido, el mensaje no inventa esfuerzos.
   - `422 UNSUPPORTED_PROJECT`, `503 LLM_PROVIDER_UNAVAILABLE` (copy «Inténtalo de nuevo en unos minutos»), `409 ANALYSIS_NOT_FINISHED`, `409 RETRIEVAL_COMPARISON_FAILED` (remite al detalle del estado).
   - `isLlmProviderUnavailable(error)`: solo el 503 de creación. `ExperimentPage` ofrece un botón «Reintentar» solo en ese caso; reintenta la mutación con una nueva `Idempotency-Key`.
   - Los 422 y el 503 del formulario de creación usan `bindingErrorMessage`, el mismo bloque de error ya existente.
5. **Mock** (`api/mockBackend.ts`), rótulo DEMO en todos los escenarios

   Proyecto DEMO: `prj_checkout_demo`.

   | Escenario | `targetId` para `startExperiment` | `experimentId` | Qué muestra |
   | --- | --- | --- | --- |
   | (a) corrida previa | `demo-scenario-legacy` | `exp_demo_scenario_legacy` | configuración todo null, `executionDurationMs` null, `pairId`/`pairPosition` null |
   | (b) Sandbox mixto | `demo-scenario-mixed-sandbox` | `exp_demo_scenario_mixed-sandbox` | repetición con `executionDurationMs` 7 (llamada fallida) junto a otra con null; configuración parcial (`budget` y `runnerHint` null) |
   | (c) sin datos evaluables | `demo-scenario-no-evaluable` | `exp_demo_scenario_no-evaluable` | agente con tasas y medias null, `evaluableRepetitions` 0, `nonEvaluableRepetitions` 3 |
   | (d) FAILED | `demo-scenario-failed-experiment-failed` | `exp_demo_scenario_failed-experiment-failed` | `EXPERIMENT_FAILED` |
   | (d) FAILED | `demo-scenario-failed-worker-lost` | `exp_demo_scenario_failed-worker-lost` | `EXPERIMENT_WORKER_LOST` |
   | (d) FAILED | `demo-scenario-failed-unknown` | `exp_demo_scenario_failed-unknown` | `DEMO_UNKNOWN_FAILURE` |
   | (e) creación 422 | `demo-error-reasoning-effort` | — | `422 REASONING_EFFORT_UNSUPPORTED` con `supportedEfforts: ['low','medium']` |
   | (e) creación 422 | `demo-error-unsupported-project` | — | `422 UNSUPPORTED_PROJECT` |
   | (e) creación 503 | `demo-error-llm-unavailable` | — | `503 LLM_PROVIDER_UNAVAILABLE` (reintentable) |

   - Los escenarios son estado fijo (no avanzan con el polling). Los `targetId` de error y de escenario no están en el inventario y, por eso, no aparecen en el selector de la página. Se alcanzan desde las pruebas o llamando a `startExperiment` directamente.
   - `experimentResult` (el caso por defecto) pasa a los campos nuevos de duración. No cambia sus valores de tasas ni la lógica de polling.

6. **Pruebas**
   - `liveMapping.test.ts`: configuración parcial, todos null, corrida previa, `executionDurationMs` null vs número pequeño, tasas null con contadores, FAILED con `failureCode` conocido y desconocido.
   - `ExperimentComparison.test.tsx`: columna Sandbox (guion y `7 ms`), tasas y medias sin datos, delta `n/d`, respaldo «sin datos evaluables» y «N evaluables · M no evaluables», ausencia de respaldo sin contadores.
   - `noAutomaticVerdict.test.tsx`: caso sin datos evaluables con `assertNoAutomaticVerdict`.
   - `ExperimentPage.test.tsx`: FAILED worker-lost (role alert, sin «Preparando», sin botón de reanudar, rótulo DEMO), FAILED por código conocido y desconocido, 422 con `supportedEfforts`, 422 `UNSUPPORTED_PROJECT`, 503 con «Reintentar» por teclado. Un wrapper de `./api` solo intercepta cuando la prueba lo pide.
   - `errors.test.ts`: `REASONING_EFFORT_UNSUPPORTED` con y sin `supportedEfforts` válido, `UNSUPPORTED_PROJECT`, 503 reintentable, 409 de OE2, `isLlmProviderUnavailable`.
   - `mockBackend.test.ts`: escenarios (a) a (d) y errores (e) sin red y sin crear experimento.

### Archivos tocados

- `app/src/experiments/types.ts`
- `app/src/experiments/liveMapping.ts`
- `app/src/experiments/liveMapping.test.ts`
- `app/src/experiments/ExperimentComparison.tsx`
- `app/src/experiments/ExperimentComparison.test.tsx`
- `app/src/experiments/noAutomaticVerdict.test.tsx`
- `app/src/experiments/ExperimentPage.tsx`
- `app/src/experiments/ExperimentPage.test.tsx`
- `app/src/experiments/failureMessages.ts` (nuevo)
- `app/src/control-plane/errors.ts`
- `app/src/control-plane/errors.test.ts`
- `app/src/api/mockBackend.ts`
- `app/src/api/mockBackend.test.ts`

No se tocaron `evidence/api.ts`, `run-comparison` live, ni trace live. No se activó ningún adapter live nuevo.

### Evidencia (salida real)

- `cd app && node node_modules/vitest/vitest.mjs run --maxWorkers=2`: `Test Files 66 passed (66)`, `Tests 676 passed (676)`, exit 0.
- `cd app && npx eslint .`: sin salida, exit 0.
- `cd app && npx tsc -b --noEmit`: sin salida, exit 0.

### Fuera de este corte (B2)

- Tope de `groundTruth` a 200 y su rechazo local.
- OE2: lectura del detalle del estado para `RETRIEVAL_COMPARISON_FAILED` sin reintento, y mock de 409 en `/results`.
- Trace: `outcome: 'VALIDATED'` del mock fuera del vocabulario `SUCCESS | BEHAVIORAL_MISMATCH | TECHNICAL_GENERATION_FAILURE`.
- Contadores de evaluabilidad en la UI de OE2, y la verificación live (WI-CONSOLE-020).
- Refresco byte a byte de los espejos de contrato y acuse de eventos (corte A).

## Corte B2 — OE2, trace, escenarios DEMO y referencias

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

### Alcance implementado

1. **OE2 (`retrieval-comparison/`)**
   - `types.ts`: `MAX_GROUND_TRUTH_ITEMS = 200` (§6.15). La UI no envía `groundTruth`.
   - `api.ts`: `assertGroundTruthWithinLimit` y `buildRetrievalComparisonRequest(analysisRunId, symbol, groundTruth?)` rechazan con `RangeError` (201 elementos) antes de cualquier red. Con 200 pasan.
   - `queries.ts`: `shouldRetryRetrievalResults`: sin reintento para `RETRIEVAL_COMPARISON_FAILED`, `RETRIEVAL_COMPARISON_NOT_FINISHED`, 404 y 422; dos reintentos para el resto. `retrievalResultsRefetchInterval`: sondea con `pollAfterMs` (o el fallback) solo mientras responde `NOT_FINISHED`. `useRetrievalComparisonResults` recibe `pollAfterMs`.
   - `failureMessages.ts` (nuevo): texto legible para `RETRIEVAL_TARGET_UNRESOLVABLE`, `RETRIEVAL_COMPARISON_FAILED` y `RETRIEVAL_COMPARISON_WORKER_LOST` (los tres que §6.15 define). Cualquier otro código se muestra como «no reconocido (código X)». El código siempre se ve.
   - `RetrievalComparisonPage.tsx`: el bloque FAILED y la previa muestran el texto legible y el código. El detalle sale del status. Los errores de creación 409 `ANALYSIS_NOT_FINISHED` y 422 `UNSUPPORTED_PROJECT` ya pasaban por `bindingErrorMessage` (B1); ahora hay prueba de página.
   - Mock: `rcmp_demo_seed_failed` y el FAILED de la simulación usan `RETRIEVAL_COMPARISON_FAILED` (antes `DEMO_*`). `GET /results` de un FAILED responde 409 `RETRIEVAL_COMPARISON_FAILED`; PENDING/RUNNING, 409 `NOT_FINISHED`. Creación DEMO: `arun_demo_retrieval_not_finished` → 409 `ANALYSIS_NOT_FINISHED`; `arun_demo_retrieval_unsupported_project` → 422 `UNSUPPORTED_PROJECT`.
   - Comentarios obsoletos actualizados en `retrieval-comparison/api.ts` y `types.ts` («implementado en Core (WI-CORE-022); el adapter live sigue pendiente de WI-CONSOLE-020»).
2. **Trace (`control-plane/`, `api/mockBackend.ts`)**
   - `outcome: 'VALIDATED'` eliminado de mocks y pruebas; se usa `SUCCESS`. Los tipos (`operationalTraceTypes.ts`) ya documentan el vocabulario `SUCCESS | BEHAVIORAL_MISMATCH | TECHNICAL_GENERATION_FAILURE`, sin cambios.
   - Corregido el orden de `arun_checkout_pr42`: `CouponPolicy.apply` (`src/domain/CouponPolicy.ts`) va antes que `OrderService.calculateTotal` (`src/domain/OrderService.ts`), por `filePath` según §6.16. Antes estaba al revés.
   - Nuevo caso de publicación solo con Check en `arun_checkout_pr47`: `status: PRESENT`, `checkId: null`, rama/PR/`sourceHeadSha` null, `freshness: null`.
   - Pruebas: outcome dentro del vocabulario en todos los fixtures; orden por `filePath`/`qualifiedName` y `attempt` en todos; orden de la UI con ACTION_REQUIRED; publicación solo con Check y sin «omitid»/«knowledgeId» en la UI.
   - Se mantienen NOT_APPLICABLE, `freshness`/`checkId` null y 409 `EVIDENCE_NOT_FINISHED`.
3. **Escenarios DEMO alcanzables en el selector (`experiments/ExperimentPage.tsx`, `api/mockBackend.ts`)**
   - `DEMO_EXPERIMENT_SELECTOR_OPTIONS` (9 opciones) se añade al selector **solo** con `isMockDataSource()`. Con live, el selector no cambia.
   - Prueba que usa el selector real: `ExperimentPage.test.tsx`, «B2 selector DEMO».
4. **Procedencia y escenario (`action-required/`)**
   - `scenarioKey` `null` o `LEGACY` (INTEROP-2.7 §6.11) muestra «sin clave de escenario (regla histórica)». `scenarioKind` `null` muestra «sin escenario registrado» en vez de «Otros». Helpers `displayScenarioKey`, `MISSING_SCENARIO_LABEL`.
   - Hook de test `setMockFunctionalKnowledgeScenarioForTests` en `mockBackend.ts`.
5. **Referencias**: `GH-INTEROP-1.2` cambiado a `GH-INTEROP-1.3` solo en comentarios de `api/client.ts:40`, `control-plane/api.ts:43`, `control-plane/types.ts:6` y `control-plane/IntegrationsPage.tsx:20`.
6. **Verificación de WRITER, abstención y escenarios (CS-CORE-20261008-002/-003/-005)**, sin cambios de código salvo lo anterior:
   - Abstención: `action-required/api.test.ts` («UNKNOWN» devuelve `ABSTAINED`, deja la pregunta `PENDING`); `FocusModePage.test.tsx` («No lo sé» permanece, no avanza).
   - Writer: `action-required/api.test.ts` («un Writer no puede abstenerse ni responder», 403 de Core); `FocusModePage.test.tsx` (Writer no ve «No lo sé»).
   - Procedencia nula: `FunctionalKnowledgeDetailPage.test.tsx` («regla histórica con campos null», tres «sin procedencia registrada»). Escenario nulo o `LEGACY`: prueba nueva en `FunctionalKnowledgeDetailPage.test.tsx`.

### Rutas y pasos para ver cada estado DEMO

Servidor: `.claude/launch.json` lanza `console-mock` en `http://localhost:5173` (`VITE_DATA_SOURCE=mock`). Todos los estados DEMO son estado en memoria: **recargar la página reinicia el mock**. En el selector de experimentos, tras lanzar un escenario el botón «Ejecutar comparación» queda deshabilitado hasta recargar (así está desde B1).

| Estado | Ruta | Pasos |
| --- | --- | --- |
| Corrida previa (a) | `/projects/prj_checkout_demo/experimental` | Selector «Target experimental» → «DEMO · corrida previa sin datos OE5» → Ejecutar comparación. |
| Sandbox mixto y configuración parcial (b) | igual | «DEMO · Sandbox mixto y configuración parcial». |
| Sin datos evaluables (c) | igual | «DEMO · sin datos evaluables». |
| FAILED EXPERIMENT_FAILED (d) | igual | «DEMO · FAILED EXPERIMENT_FAILED». |
| FAILED EXPERIMENT_WORKER_LOST (d) | igual | «DEMO · FAILED EXPERIMENT_WORKER_LOST». Sin botón de reanudar. |
| FAILED código desconocido (d) | igual | «DEMO · FAILED código desconocido». |
| 422 REASONING_EFFORT_UNSUPPORTED (e) | igual | «DEMO · error 422 REASONING_EFFORT_UNSUPPORTED» → muestra los esfuerzos admitidos. |
| 422 UNSUPPORTED_PROJECT (e) | igual | «DEMO · error 422 UNSUPPORTED_PROJECT». |
| 503 LLM_PROVIDER_UNAVAILABLE (e) | igual | «DEMO · error 503 LLM_PROVIDER_UNAVAILABLE (reintentable)» → botón «Reintentar». |
| FAILED de OE2 con `RETRIEVAL_COMPARISON_FAILED` (seed) | `/projects/prj_checkout_demo/runs/arun_checkout_pr49/retrieval-comparison` | Previas: `rcmp_demo_seed_failed` (lista «Comparaciones previas del Run»). |
| 409 de creación OE2 `ANALYSIS_NOT_FINISHED` / 422 `UNSUPPORTED_PROJECT` | Sin ruta de UI | Solo por `startRetrievalComparison` con `arun_demo_retrieval_not_finished` o `arun_demo_retrieval_unsupported_project` (pruebas). El Run no aparece en listados, así que la página no lo alcanza. |
| Trace con Check sin publicación de pruebas | `/projects/prj_checkout_demo/runs/arun_checkout_pr47` | Sección «Trace operativo» → Publicación `PRESENT`, campos «sin dato». |
| Orden de targets (ACTION_REQUIRED) | `/projects/prj_checkout_demo/runs/arun_checkout_pr42` | Targets: `CouponPolicy.apply`, luego `OrderService.calculateTotal`. |

### Archivos tocados (B2)

- `app/src/retrieval-comparison/types.ts`, `api.ts`, `queries.ts`, `failureMessages.ts` (nuevo), `RetrievalComparisonPage.tsx`
- `app/src/retrieval-comparison/api.test.ts`, `RetrievalComparisonPage.test.tsx`
- `app/src/api/mockBackend.ts`
- `app/src/control-plane/operationalTrace.test.ts`, `OperationalTraceSection.test.tsx`
- `app/src/experiments/ExperimentPage.tsx`, `ExperimentPage.test.tsx`
- `app/src/action-required/knowledgeScenarios.ts`, `knowledgeScenarios.test.ts`, `FunctionalKnowledgeDetailPage.tsx`, `FunctionalKnowledgeDetailPage.test.tsx`
- `app/src/api/client.ts`, `app/src/control-plane/api.ts`, `app/src/control-plane/types.ts`, `app/src/control-plane/IntegrationsPage.tsx` (solo comentarios)

No se tocaron `control-plane/errors.ts` (ya tenía los mensajes de B1), `evidence/`, adapters live ni contratos. No se activó ningún adapter live.

### Evidencia (salida real)

- `cd app && node node_modules/vitest/vitest.mjs run --maxWorkers=2`: `Test Files 66 passed (66)`, `Tests 695 passed (695)`, exit 0.
- `cd app && npx eslint .`: sin salida, exit 0.
- `cd app && npx tsc -b --noEmit`: sin salida, exit 0.
- Suites focalizadas durante el corte: `retrieval-comparison` 49/49; `control-plane/operationalTrace*` y `OperationalTraceSection` 44/44; `experiments/ExperimentPage` 12/12; `action-required` 91/91.
- No se hizo verificación visual en el navegador: los estados DEMO están cubiertos por pruebas que usan el selector real.

### Preguntas abiertas (B2)

1. **`targetCount` en la UI de trace.** El DTO §6.16 incluye `changeset.targetCount` y la UI lo muestra desde WI-016 («Run sin targets»). La regla «no muestra conteos» de este corte la leo como conteos de Functional Knowledge (`omitidas`, reglas) y no como `targetCount`. ¿Lo mantengo?
2. **Creación DEMO de OE2 sin ruta de UI.** El selector de OE2 solo lista símbolos de Runs con símbolos. Los dos ids DEMO solo se alcanzan por código o pruebas. ¿Quieres un Run DEMO con símbolos que los dispare desde la página?
3. **`GET /results` en FAILED.** La página no pide resultados en FAILED (como ya indicaba su prueba). La política de reintento y el 409 FAILED quedan cubiertos en `queries`/mock, pero la UI no llega a provocar ese 409. ¿Lo quieres así o pedir `/results` también en FAILED?
4. **Grupos de procedencia.** `groupByScenarioKind` sigue mandando un `scenarioKind` nulo al grupo «Otros» en la lista de conocimiento. Solo cambié la página de detalle. ¿Debe la lista también mostrar estado vacío?
5. **`DEMO_UNKNOWN_FAILURE` de experimentos** se mantiene a propósito para ejercitar el código desconocido de experimentos. No es un código de OE2.
6. Del B1 siguen abiertas las preguntas 1 a 6 de la sección anterior.

## Preguntas abiertas

1. **Reanudación de FAILED.** CS-CORE-20261009-010 dice que un run FAILED puede reanudarse y que, al completar, `failureCode` vuelve a `null`. La página deja de hacer polling en FAILED y el contrato no define ruta de reanudar. ¿La Console debe seguir sondeando un FAILED, o basta con el estado terminal?
2. **Nuevo intento tras FAILED o 503.** Tras un FAILED el botón «Ejecutar comparación» queda deshabilitado porque `experimentId` ya está fijado. ¿Se permite iniciar otro experimento? Para el 503 reintento uso una nueva `Idempotency-Key`; el contrato no dice si debe reutilizarse.
3. **Repetición con `totalDurationMs` 0.** §6.5.1 mantiene `0` en `generationDurationMs` y `totalDurationMs` cuando no se observaron (IDEA-017). La UI muestra `0 ms` en la columna Duración para esos casos. ¿Debe tratarse como «sin datos»? Ahora mismo no lo hago.
4. **`generationDurationMs` por repetición** se tipa y mapea, pero no tiene columna propia en la tabla (no está en los criterios). ¿Lo quieres visible?
5. **Contadores como opcionales.** CS-CORE-20261009-015 los define como `number`. Los tipé opcionales por la instrucción de respuestas previas; si Core siempre los envía, pueden pasar a obligatorios.
6. **Escenarios DEMO no seleccionables.** El selector de la página solo lista targets del inventario, así que los escenarios de error y de FAILED no se ven desde la UI. ¿Quieres un selector DEMO oculto o basta con los tests?

## Estado

Corte B1 implementado en la rama `feature/jean`, sin commit. Puertas en verde. Revisión independiente pendiente: Human Reviewer y `ux-reviewer` (hay cambios de UI: columna, estado FAILED, botón Reintentar).

## Espejos de contrato y resolución de Contract Sync (leader)

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Copia mecánica (`git show 3f06f44543b5899d98232b757310ce6d481624ea:spec/contracts/<f>.md`, árbol de Core limpio; los contratos son idénticos en su HEAD `a533eb4`). SHA-256 coincide con la puerta externa:

| Espejo | SHA-256 |
| --- | --- |
| SYSTEM-2.6 | `670a1ef035d7c60be0a3385ca5f88e2a458b91f8ded2317e9dbbb97c58b07dc2` |
| INTEROP-2.7 | `fcfbd6d6301e7d15ad508b7745bd73c54a3ca06cba03f9372bd3fe9801ec109a` |
| GH-INTEROP-1.3 | `d1779bbdc2445be8760c6b3eea3b73da4663618bab8d471f4d6e932fd7d0b964` |

Precedencia aplicada: `-007` sobre `-006` (SYSTEM, DEC-FK-005 aprobado), `-009` acota `-008` (`executionDurationMs`), `-010` a `-015` sin conflicto.

Eventos resueltos con este reporte: `CS-CORE-20261008-002` a `-007`, `CS-CORE-20261009-008` a `-011`, `-013`, `-014` y `-015`. Alcance real de la adopción: espejos y UI de OE5/OE2/trace (`-002` a `-013`); `-014` (evidencia: tipos y mock de WI-CONSOLE-017, espejo refrescado aquí, `/evidence` live pendiente de WI-CONSOLE-020); `-015` (tasas y medias `number | null`, contadores `evaluableRepetitions`/`nonEvaluableRepetitions`, «sin datos»). Ningún adapter live fue activado.

## Corte C — PHP, bloque §6.16 de evidencia y hallazgos menores

Modelo: implementer · configurado claude-haiku-5-5 · esfuerzo low

Fecha: 2026-10-10. Rama `feature/jean`. Sin commit ni push. Eventos leídos: `CS-CORE-20261009-014` (forma de §6.16), `-016` (sin cambio funcional), `-017` (relaciones PHP y OE2), `-018` (experimentos PHP/PHPUnit). Fuente: `spec/contracts/interoperability-contract.md` §6.5, §6.15 y §6.16, sin cambios en `spec/`.

### C1 — PHP (CS-CORE-20261009-017 y -018)

1. **Relaciones estructurales** (`context-explorer/types.ts`, `context-explorer/rag/ragLabels.ts`): `RagStructuralMatch` = `IMPORTS | IMPORTED_BY | SAME_NAMESPACE | FULLY_QUALIFIED_REFERENCE | DECLARING_CLASS`; `RagMatchedVia` admite las mismas. `ragLabels` ya no trata cualquier `structuralMatch` distinto de IMPORTS como «importado por»: las etiquetas salen de `STRUCTURAL_RELATION_LABELS` (`retrieval-comparison/types.ts`), única fuente. Señal estructural: «Señal estructural · Mismo namespace»; dual: «Señal dual · semántica + mismo namespace».
2. **Comentario obsoleto** eliminado de `retrieval-comparison/types.ts`.
3. **OE2**: se retira `DEMO_RETRIEVAL_UNSUPPORTED_PROJECT_RUN_ID` y su rama en `mockStartRetrievalComparison` (`arun_demo_retrieval_unsupported_project` ya no existe). Nuevo escenario DEMO PHP: **`rcmp_demo_seed_php`** (exportado como `DEMO_RETRIEVAL_PHP_COMPARISON_ID`), COMPLETED, símbolo `CouponService::apply` (`app/Services/CouponService.php`), con candidatos `SAME_NAMESPACE`, `FULLY_QUALIFIED_REFERENCE`, `DECLARING_CLASS` y uno sin relación. Limitación: el mock no tiene proyecto PHP, así que la semilla cuelga del Run `arun_checkout_pr49` (TypeScript). Se ve en la lista de previas de ese Run (ahora 6 elementos, 3 con «Ver resultado»). La prueba `api.test.ts` («un proyecto PHP ya no responde 422») la usa.
4. **Experimentos**:
   - `control-plane/errors.ts`: `UNSUPPORTED_PROJECT` = «Este proyecto no tiene framework JEST, VITEST o PHPUNIT detectado.» (sirve a OE5 y OE2). Mock `demo-error-unsupported-project` con el mismo texto.
   - `runnerHint` ya se muestra: nueva fila «Runner» en Configuración (`ExperimentComparison.tsx`), cadena abierta tal cual. Antes estaba tipado pero oculto; sus dos pruebas que lo fijaban como oculto se actualizaron.
   - La UI no bloquea PHP: el selector de targets (`ExperimentPage.tsx`) no filtra por `language` ni `framework`, y el mock de creación solo rechaza el error DEMO explícito.
   - Escenario DEMO PHPUnit: **`demo-scenario-phpunit`** → experimento **`exp_demo_scenario_phpunit`**, `executionProfile` `PHP_LARAVEL_PHPUNIT`, `runnerHint` `PHPUNIT`, con una repetición `COMPILATION` sin reintento (`attempt` 1). Aparece en el selector DEMO (ahora 10 opciones).

### C2 — bloque §6.16 de /evidence (CS-CORE-20261009-014)

- `evidence/types.ts` reescrito contra el bloque de §6.16: `projectVersionId`, `snapshotRef`, `tokenCounts.selected`, `generation` (repetition, attempt, provider, model, durationMs, artifactHash), `agentExploration` (steps), `sandbox` (strategy, repetition, executionId, executionProfile, runnerHint, durationMs, requestId, correlationId), `experimental` (pairId, pairPosition, randomizationSeed, `technicallyEvaluable: boolean`) y `retrieval[].metrics`. Tipos propios para `EvidenceRetrievalCandidate` y `EvidenceRetrievalConfig`. No hay excerpt, código, testCases, groundTruth, knowledgeId, URLs ni claves de almacenamiento.
- `evidence/api.ts` sin cambios funcionales: el adapter live sigue en `PendingContractError` (WI-CONSOLE-020).
- Mock (`api/mockBackend.ts`, `mockGetEvidence`): el bundle de EXPERIMENT ahora trae `generation[]` y `sandbox[]` por repetición, y `experimental[]` incluye también las repeticiones sin pareado. Los datos no observados salen como `null`. Bundle con nulls: **`exp_demo_scenario_legacy`** (corrida previa): `provider`/`model` null, `executionId`/`requestId`/`durationMs`/`correlationId` null, `pairId`/`pairPosition` null. La comparación FAILED (`rcmp_demo_seed_failed`) responde `retrieval: []`. `analysisRun.projectVersionId` es null cuando no hay versión.
- Mock, datos no contractuales: `attempt` (sandbox y experimental) y `technicallyEvaluable` no admiten null en el contrato, así que sin dato el mock usa `attempt` 1 y `technicallyEvaluable` false. Es una decisión a confirmar (ver preguntas).
- Pruebas (`evidence/api.test.ts`): corrida previa con nulls y sin ceros; FAILED con `retrieval: []`; semilla PHP con las relaciones nuevas; PHPUnit con perfil y runner; ningún bundle con `excerpt`, `testCases`, `groundTruth`, `knowledgeId` ni claves de almacenamiento.
- La UI de evidencia solo muestra `schemaVersion` y la descarga, así que no hay campos que renderizar como «sin dato».

### C3 — hallazgos menores

- (a) `action-required/FunctionalKnowledgePage.tsx`: la clave de escenario de la lista usa `displayScenarioKey`/`MISSING_SCENARIO_KEY_LABEL` como el detalle. Prueba nueva: una regla con `scenarioKey: 'LEGACY'` muestra «sin clave de escenario (regla histórica)» y no el valor crudo.
- (b) `api/mockBackend.ts`: el comentario «Solo para pruebas: cambia estado o HEAD de un Run…» se reubica sobre `setMockAnalysisRunForTests`, que es la función que describe.
- (c) `experiments/failureMessages.ts`: comentario que deja claro que §6.5.1 no define ruta de reanudación y que la UI no ofrece botón ni sondeo en FAILED.

### Archivos tocados (C)

- `app/src/context-explorer/types.ts`, `app/src/context-explorer/rag/ragLabels.ts`, `app/src/context-explorer/rag/ragLabels.test.ts` (nuevo)
- `app/src/retrieval-comparison/types.ts` (comentario), `api.test.ts`, `RetrievalComparisonPage.test.tsx`
- `app/src/control-plane/errors.ts`, `errors.test.ts`
- `app/src/experiments/ExperimentComparison.tsx`, `ExperimentComparison.test.tsx`, `ExperimentPage.test.tsx`, `failureMessages.ts` (comentario)
- `app/src/evidence/types.ts`, `api.test.ts`
- `app/src/api/mockBackend.ts`, `mockBackend.test.ts`
- `app/src/action-required/FunctionalKnowledgePage.tsx`, `FunctionalKnowledgePage.test.tsx`

### Escenarios DEMO nuevos o cambiados (C)

| Id | Uso | Qué muestra |
| --- | --- | --- |
| `demo-scenario-phpunit` → `exp_demo_scenario_phpunit` | selector de experimentos | PHPUnit: `runnerHint` PHPUNIT, perfil PHP_LARAVEL_PHPUNIT, repetición COMPILATION sin reintento |
| `rcmp_demo_seed_php` | previas del Run `arun_checkout_pr49` y `/evidence` | OE2 PHP con SAME_NAMESPACE, FULLY_QUALIFIED_REFERENCE, DECLARING_CLASS |
| `exp_demo_scenario_legacy` (bundle) | `/evidence` del experimento | nulls de corrida previa, sin ceros |
| `demo-error-unsupported-project` | creación de experimento | 422 con el nuevo texto de framework |
| `arun_demo_retrieval_unsupported_project` | retirado | ya no existe; OE2 no devuelve 422 por PHP |

### Evidencia (salida real)

- `cd app && node node_modules/vitest/vitest.mjs run --maxWorkers=2`: `Test Files 67 passed (67)`, `Tests 716 passed (716)`, exit 0. Salida guardada en el scratchpad de la sesión (`vitest-c.txt`).
- `cd app && npx eslint .`: sin salida, exit 0. (Antes falló por una constante sin uso en `mockBackend.ts`, ya retirada.)
- `cd app && npx tsc -b --noEmit`: sin salida, exit 0.
- `cd app && npm run build`: `✓ built in 659ms`, exit 0 (solo aviso de tamaño de chunk, preexistente).

### Pendiente y no tocado

- No se sincronizaron los espejos de `spec/contracts/` ni se acusaron los eventos `CS-CORE-20261009-016`, `-017` y `-018` (siguen `C-PENDING` en el inbox). Esa sincronización y el acuse son del leader. `-017` y `-018` piden sincronizar INTEROP-2.7 byte a byte antes de declararlos resueltos.
- No se activó ningún adapter live. No se hizo verificación visual en navegador.

### Preguntas abiertas (C)

1. **Semilla PHP de OE2 sobre un Run TypeScript.** ¿Quieres un proyecto DEMO PHP con su propio Run para que la semilla sea coherente, o basta esta semilla?
2. **`attempt` y `technicallyEvaluable` en el mock.** El contrato no admite null, así que las corridas previas usan `attempt` 1 y `technicallyEvaluable` false. ¿Lo confirma Core, o prefieres que el mock omita esas repeticiones del bundle?
3. **Fila «Runner» en Configuración.** Es un cambio de UI. Según AGENTS.md necesita revisión de `ux-reviewer`. ¿Lo lanzo ahora?
4. **Espejo de INTEROP-2.7 y acuse de -017/-018.** ¿Lo sincroniza el leader antes del cierre del corte?
5. **Mensaje compartido de `UNSUPPORTED_PROJECT`.** Un mismo texto sirve a OE5 y OE2. ¿Quieres copy distinto por pantalla?
