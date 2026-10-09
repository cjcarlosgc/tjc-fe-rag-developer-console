# WI-CONSOLE-014 — Implementación, Corte A (datos y contrato)

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

Work item: WI-CONSOLE-014 «UI de comparación de retrieval OE2 (SE vs SEM)» (ST-CONSOLE-016, HU05/HU17). Este reporte cubre solo el **Corte A** (tipos, api, queries, mock, errores). El Corte B (`RetrievalComparisonPage`, ruta, CTA en `AnalysisRunDetailPage`) **no se implementó**. No se hizo commit, push, ni se editaron `harness/state.json`, `harness/work-items.json` ni `spec/`.

Fuentes leídas: `harness/work-items.json` (WI-CONSOLE-014), `harness/reports/wi-console-014-sdd-verification.md`, `spec/contracts/interoperability-contract.md` §4, §5 y §6.15, y los patrones `run-comparison/{types,api}.ts`, `experiments/api.ts`, `api/idempotency.ts`, `context-explorer/queries.ts`, `api/dataSource.ts`.

## Archivos

Nuevos (`app/src/retrieval-comparison/`):
- `types.ts`: tipos de §6.15 sin campos extra (`RetrievalMode`, `StructuralRelation`, `RetrievalComparisonStatus`, `RetrievalComparisonAcceptedResponse`, `CreateRetrievalComparisonRequest`, `RetrievalComparisonStatusResponse`, `RetrievalCandidateResponse`, `RetrievalMetricsResponse`, `RetrievalModeResultResponse`, `RetrievalComparisonResultsResponse`, `RetrievalComparisonListPage`). Helpers: `STRUCTURAL_RELATION_LABELS` (etiquetas en español de las 5 relaciones), `structuralRelationLabel`, `formatRetrievalScore` y `formatRetrievalMetric` (`null` → «no disponible», nunca 0), `isTerminalRetrievalStatus`. Re-exporta `findEligibleSymbols` desde `run-comparison/types` (no se duplica).
- `api.ts`: `startRetrievalComparison(analysisRunId, symbol, idempotencyKey)`, `getRetrievalComparison`, `getRetrievalComparisonResults`, `listRetrievalComparisons(analysisRunId, cursor?)`, y `buildRetrievalComparisonRequest` (cuerpo del POST con solo `analysisRunId`, `symbolFilePath`, `symbolQualifiedName`). En modo live las cuatro lanzan `PendingContractError`.
- `queries.ts`: `useRetrievalComparisons` (infinita por cursor), `useRetrievalComparison(id, pollAfterMs?)`, `useRetrievalComparisonResults(id, status)`, `useStartRetrievalComparison(analysisRunId)`.
- `api.test.ts`: 17 pruebas (ver evidencia).

Modificados:
- `app/src/api/mockBackend.ts`: estado propio `retrievalComparisons` y mapa `retrievalComparisonByIdempotencyKey` (separados de `runComparisons` de HU48); funciones `mockStartRetrievalComparison`, `mockGetRetrievalComparison`, `mockGetRetrievalComparisonResults`, `mockListRetrievalComparisons`; semillas `seedRetrievalComparisons()`; un símbolo METHOD añadido a `arun_billing_pr17` (único Run OBSOLETE).
- `app/src/control-plane/errors.ts`: mensajes propios para `ANALYSIS_SYMBOL_NOT_FOUND`, `UNSUPPORTED_SYMBOL_KIND`, `RETRIEVAL_COMPARISON_NOT_FOUND`, `RETRIEVAL_COMPARISON_NOT_FINISHED` e `IDEMPOTENCY_CONFLICT`.
- `app/src/control-plane/errors.test.ts`: dos pruebas nuevas (los cinco códigos, y el 403 de rol con `requiredRole`/`currentRole`).

## Decisiones

1. **Sin `groundTruth`.** `buildRetrievalComparisonRequest` construye el cuerpo con solo tres campos. El tipo `CreateRetrievalComparisonRequest` conserva `groundTruth?` porque así lo declara §6.15, pero la Console nunca lo envía (AC3).
2. **Idempotencia en el mock.** Key ausente → 400 `IDEMPOTENCY_KEY_REQUIRED`; no UUID → 400 `INVALID_IDEMPOTENCY_KEY`. Misma key y misma huella (`analysisRunId|filePath|qualifiedName`) → mismo `retrievalComparisonId` sin crear otra comparación. Misma key con otra huella → 409 `IDEMPOTENCY_CONFLICT`.
3. **Orden de validación del POST:** key → Run visible (404) → rol WRITER (403) → replay/conflicto de key (409) → símbolo en el Run (404 `ANALYSIS_SYMBOL_NOT_FOUND`) → tipo elegible (422 `UNSUPPORTED_SYMBOL_KIND`, con `changeKind` y `kind` tomados del símbolo del Run, no del request).
4. **Sin 409 `RUN_NOT_ELIGIBLE`.** OE2 no usa los gates de OE5: un Run `ACTION_REQUIRED` u `OBSOLETE` con símbolo elegible admite la comparación (hay prueba para `arun_billing_pr17`).
5. **Polling.** `pollAfterMs` de la 202 se pasa como intervalo. Sin valor utilizable (ausente, 0 o negativo) se usa `RETRIEVAL_FALLBACK_POLL_MS = 1000`, documentado como fallback de cliente y no como dato del contrato. El polling se detiene en `COMPLETED`/`FAILED` y ante cualquier error. En `MODE==='test'` el intervalo es 10 ms.
6. **Resultados solo tras `COMPLETED`.** `useRetrievalComparisonResults` se habilita solo con `status === 'COMPLETED'`.
7. **Lista sin avance de estado.** `mockListRetrievalComparisons` es lectura pura (no avanza `polls`). Pagina con cursor opaco (offset en la implementación mock, tamaño 20) y devuelve el más reciente primero.
8. **Semillas en `arun_checkout_pr49`.** Cinco previas: PENDING (avanza), RUNNING (avanza), COMPLETED sin métricas, COMPLETED con métricas (rotulada en el código como demo de verdad de terreno externa, no creable desde la Console en este corte), y FAILED con `failureCode` `DEMO_EMBEDDING_INDEX_UNAVAILABLE`. Los resultados usan solo TypeScript (sin relaciones PHP), SE con pesos 0.7/0.3 y `combinedScore`, SEM con pesos `null`, `structuralRelation` `null` y `combinedScore` `null`. Hay un candidato con `symbolQualifiedName: null` y el ranking de SE y SEM difiere a propósito, sin ganador implícito.
9. **Run OBSOLETE con símbolo elegible.** Se añadió a `arun_billing_pr17` un METHOD `LateFeePolicy.evaluate` en un archivo propio (`src/domain/LateFeePolicy.ts`). No se reutiliza `DiscountEngine.ts`: un primer intento con `DiscountEngine.applyDiscount` rompió `ruleUsage` y otras pruebas de trazabilidad por archivo compartido. No se creó ningún Run nuevo, así que los conteos literales (17 Runs, 7 de checkout, 17 chips) no cambian.
10. **Semillas HU48 intactas.** `runComparisons`, `mockStartRunComparison`, `mockGetRunComparison` y `mockListRunComparisons` no se tocaron.
11. **Módulo sin ciclo de runtime.** `mockBackend.ts` importa de `retrieval-comparison/types` solo tipos, y `types.ts` re-exporta `findEligibleSymbols` desde `run-comparison/types`, que solo tiene imports de tipo.
12. **Constantes antes de la inicialización del módulo.** Las constantes del bloque OE2 se movieron junto a los `Map` (arriba del archivo) porque `resetMockBackend()` se ejecuta al cargar el módulo y las semillas las leen antes de su declaración (TDZ). Corregido tras el primer intento fallido.

## Gaps de contrato detectados (a confirmar con Core en WI-CONSOLE-020)

- **Resultados de un FAILED.** §6.15 no define `GET .../results` para `FAILED`. El mock responde 409 con el código propio `RETRIEVAL_COMPARISON_FAILED`, que **no está en el contrato**. Este código sale de la semántica del mock y no de INTEROP-2.7; hay que confirmarlo antes de que la UI dependa de él. La UI no pide resultados para FAILED.
- **Mensaje de `RETRIEVAL_COMPARISON_FAILED`.** No tiene entrada propia en `errors.ts`; cae en el mensaje del error del mock, en español. Pendiente de decisión.
- **Tamaño y orden del listado, y `candidates` (20 o 10).** No declarados por el contrato. El mock usa 20 por página y orden más reciente primero.
- **Rango de `semanticScore`.** No declarado; el formato es decimal fijo a 3 cifras, sin interpretación.
- **`progress`.** No existe en el DTO de §6.15; el mock no lo expone (a diferencia de `RunComparisonOperation`).

## Lo que no se hizo (fuera del Corte A)

- `RetrievalComparisonPage`, ruta `/projects/:projectId/runs/:analysisRunId/retrieval-comparison`, CTA en `AnalysisRunDetailPage` y sus pruebas.
- Pruebas de `queries.ts` (hooks). El AC no las exige por nombre y el polling se verificará en el Corte B mediante la página.
- Escritura del header `Idempotency-Key` en HTTP real: el mock recibe la key como argumento; el header live queda para WI-CONSOLE-020.
- `tasks.md` (`ST-CONSOLE-016`) no se actualiza: sigue `T-BACKLOGGED` hasta tener evidencia de cierre.

## Comandos y resultados (en `app/`)

- `npx eslint src/retrieval-comparison src/api/mockBackend.ts src/control-plane/errors.ts src/control-plane/errors.test.ts`: exit 0.
- `npx vitest run --maxWorkers=2 src/retrieval-comparison src/control-plane src/run-comparison src/context-explorer src/action-required`: primera ejecución fallida por TDZ (corregida, decisión 12). Después, 4 fallos, todos causados por el símbolo de `DiscountEngine` en `arun_billing_pr17` (decisión 9) y el caso CLASS de `pr47`. Corregidos.
- `npx vitest run --maxWorkers=2` (suite completa): **58 archivos, 527 pruebas, todas pasan**.
- `npx eslint .` (suite completa): **exit 0**.
- `npx tsc -b --noEmit`: **exit 0**. (Se usa `tsc -b --noEmit`, no `tsc --noEmit`, según la nota del proyecto.)
- `npm run build` no se ejecutó en este corte; el AC lo exige antes del cierre del WI, no del Corte A.

## Archivos afectados

- `app/src/retrieval-comparison/types.ts` (nuevo)
- `app/src/retrieval-comparison/api.ts` (nuevo)
- `app/src/retrieval-comparison/queries.ts` (nuevo)
- `app/src/retrieval-comparison/api.test.ts` (nuevo)
- `app/src/api/mockBackend.ts` (modificado)
- `app/src/control-plane/errors.ts` (modificado)
- `app/src/control-plane/errors.test.ts` (modificado)
- `harness/reports/wi-console-014-implementation.md` (este reporte)

Sin commit. Los archivos de `harness/reports/wi-console-014-contract-sync-scope-review.md` y `wi-console-014-sdd-verification.md` ya estaban sin trackear y no se tocaron.

---

# WI-CONSOLE-014 — Implementación, Corte B (UI y ruta)

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

Este corte cubre la página, la ruta, el CTA en `AnalysisRunDetailPage` y los estilos. No hay commit, push ni cambios en `harness/state.json`, `harness/work-items.json` ni `spec/`.

## Archivos

Nuevos:
- `app/src/retrieval-comparison/RetrievalComparisonPage.tsx`: página. Un único h1; h2 «Iniciar comparación», «Estado de la comparación», «Resultado de …» (tabIndex -1) y «Comparaciones previas del Run»; h3 por modo.
- `app/src/retrieval-comparison/RetrievalComparisonPage.test.tsx`: 12 pruebas.

Modificados:
- `app/src/router.tsx`: ruta `projects/:projectId/runs/:analysisRunId/retrieval-comparison` dentro de las rutas protegidas.
- `app/src/control-plane/AnalysisRunDetailPage.tsx`: CTA «Comparar retrieval SE vs SEM» junto a «Run comparison →». Visible solo si `hasRole(project.role, 'WRITER')` con el rol ya cargado y hay un símbolo elegible. No depende de ACTION_REQUIRED.
- `app/src/control-plane/AnalysisRunDetailPage.test.tsx`: 2 pruebas del CTA (Writer ve el enlace con href correcto; Reader no lo ve).
- `app/src/api/mockBackend.ts` (ajuste previo): para pedir resultados de una comparación no COMPLETED, o COMPLETED sin resultados, responde 409 `RETRIEVAL_COMPARISON_NOT_FINISHED`. Se eliminó `RETRIEVAL_COMPARISON_FAILED`. Verificado: no queda ninguna referencia a ese código en `src/`.
- `app/src/retrieval-comparison/api.test.ts`: la prueba del FAILED espera `RETRIEVAL_COMPARISON_NOT_FINISHED`.
- `app/src/styles.css`: bloque propio al final, con tokens existentes. No usa `--text-dim` para texto informativo. Foco de los elementos nuevos con `var(--accent)` sólido (3 px) para superar el problema de contraste del anillo global 0.42 señalado en la revisión UX de WI-CONSOLE-015 (N1). La tabla va en un contenedor desplazable con `tabIndex=0`.

## Decisiones

1. Selector: `value = filePath::qualifiedName`; sin efecto de auto-inicio aunque haya un solo símbolo. Opción vacía «Elige un símbolo».
2. Botón: deshabilitado sin símbolo o mientras `isPending`. El motivo va en `aria-describedby` («Motivo: falta elegir un símbolo.» / «Motivo: la comparación se está creando.»). Tras completar, cuando el símbolo coincide, la etiqueta pasa a «Comparar de nuevo».
3. Rol: mientras carga el proyecto se muestra «Comprobando tu rol…» en lugar del botón. Reader ve la nota de rol (`role-note`), sin selector ni botón, y sí ve las previas.
4. Idempotencia: `getOrCreate('start:{runId}:{symbolKey}')`. La key se reutiliza en reintentos; al éxito se limpia, así que la siguiente comparación recibe una key nueva. Ante `IDEMPOTENCY_CONFLICT` también se limpia.
5. Estado: un único `<div role="status">` siempre montado; solo cambia su texto. FAILED: `role="alert"` con `failureCode` y `failureMessage` literales. Errores de API: `ErrorNote` con `correlationId`.
6. Foco: al llegar los resultados tras una acción del usuario (iniciar o «Ver resultado») se mueve el foco al h2 de resultado.
7. Resultado: dos tablas (`<caption>`, `th scope`). `combinedScore` en SEM muestra «no aplica». «Seleccionado» como texto. Si `metrics` es null, las cuatro métricas muestran «no disponible»; si existen, P@10 y R@10 van en negrita.
8. Previas: `useInfiniteQuery` por `nextCursor`, con botón «Cargar más» y sin bucles. Orden: el que devuelve Core (más reciente primero). Solo COMPLETED tiene «Ver resultado».
9. Lenguaje: sin ganador, deltas, estadística, barras, porcentajes ni verdad de terreno. La nota dice «Esta vista no ofrece conclusiones comparativas.»
10. Tests: el mock no puede producir 404/409/422/403 ni FAILED desde la UI, así que el archivo de pruebas sustituye, con `vi.mock('./api')`, solo `startRetrievalComparison` y `getRetrievalComparison` mediante un override controlado. Sin override, todo es el mock real.

## Cómo ver cada estado en el mock (http://localhost:5173)

- Varios símbolos, selector y previas (5 items: PENDING, RUNNING, COMPLETED sin métricas, COMPLETED con métricas, FAILED): `/projects/prj_checkout_demo/runs/arun_checkout_pr49/retrieval-comparison`
- Un solo símbolo, sin auto-inicio: `/projects/prj_checkout_demo/runs/arun_checkout_pr45/retrieval-comparison`
- Reader (nota de rol, sin acción): `/projects/prj_org_metrics_demo/runs/arun_org_metrics_pr15/retrieval-comparison`
- Iniciar, PENDING → RUNNING → COMPLETED sin métricas: en la ruta de pr49, elegir «OrderService.createOrder» (valor `src/domain/OrderService.ts::OrderService.createOrder`) y pulsar el botón.
- COMPLETED con métricas: en la ruta de pr49, «Ver resultado» de `rcmp_demo_seed_completed_con_metricas`.
- FAILED: solo desde los tests (override). En el mock hay una previa FAILED en la lista, sin acción «Ver resultado».

## Comandos y resultados (en `app/`)

- `npx vitest run --maxWorkers=2 src/retrieval-comparison`: 34/34 pasan (22 previas y 12 nuevas).
- `npx vitest run --maxWorkers=2 src/control-plane/AnalysisRunDetailPage.test.tsx`: 21/21 pasan.
- `npx vitest run --maxWorkers=2` (suite completa): 59 archivos, 543 pruebas, todas pasan.
- `npm run lint`: sin errores.
- `npx tsc -b --noEmit`: sin errores.
- `npm run build`: correcto. El aviso de chunk > 500 kB ya existía.

## Verificación en navegador (mock, `RAG Test Studio`)

- Color computado: `#select` y `#btn` son `rgb(234,231,247)` sobre `rgb(11,11,13)`, con contraste superior a 4.5:1. El botón deshabilitado usa `rgb(188,186,201)` sobre `rgb(24,24,30)`. El único elemento con `rgb(113,111,130)` (`--text-dim`) es el separador `.repo-sep` de `RepoChip`, que es global y no es texto de esta página.
- Encabezados: H1 → H2 → H3, sin saltos.
- 375 px: `scrollWidth` 375 = `innerWidth` (sin scroll horizontal en la página); el sello DEMO mide 180 px y no se estira. Viewport restablecido a escritorio.
- No verificado en vivo: foco de teclado real con Tab y lectura por lector de pantalla. Queda para el ux-reviewer.

## Gaps y pendientes

- `RETRIEVAL_COMPARISON_NOT_FINISHED` para FAILED sigue siendo un gap de contrato a confirmar con Core en WI-CONSOLE-020. La UI nunca pide resultados para FAILED.
- Sin `progress` en el DTO de §6.15: no se muestra porcentaje.

## Archivos afectados (corte B)

- `app/src/retrieval-comparison/RetrievalComparisonPage.tsx` (nuevo)
- `app/src/retrieval-comparison/RetrievalComparisonPage.test.tsx` (nuevo)
- `app/src/retrieval-comparison/api.test.ts` (código de error del FAILED)
- `app/src/router.tsx`
- `app/src/control-plane/AnalysisRunDetailPage.tsx`
- `app/src/control-plane/AnalysisRunDetailPage.test.tsx`
- `app/src/api/mockBackend.ts` (código de error del FAILED)
- `app/src/styles.css`
- `harness/reports/wi-console-014-implementation.md` (esta sección)
