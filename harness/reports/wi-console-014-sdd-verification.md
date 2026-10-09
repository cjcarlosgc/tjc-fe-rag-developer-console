# WI-CONSOLE-014 — Verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido claude-sonnet-5-5 · esfuerzo low

Work item: WI-CONSOLE-014 «UI de comparación de retrieval OE2 (SE vs SEM)» (ST-CONSOLE-016, HU05/HU17, sprint SMART V3, dependsOn WI-CONSOLE-011, externalDependencyGate G-PASSED sobre WI-CORE-017, W-SELECTED, `contractImpact:false`). Solo verificación; no se editó código, state.json ni work-items.json.

## Veredicto: SUFFICIENT

Los 6 AC y INTEROP-2.7 §6.15 bastan para implementar contra mocks. Sin decisiones bloqueantes. Hay puntos no definidos por el contrato que el WI ya excluye o difiere (ver "Campos faltantes" y "Contradicciones"); ninguno exige decisión nueva si el implementer respeta los límites.

## Decision gate
- Fuente: `spec/contracts/system-contract.md`.
- blockingDecisionIds: [].
- Aplicables y APROBADO (2026-10-08, usuario), `Blocks` no bloquea: `DEC-ORG-003` (Writer: crea comparaciones de retrieval; Reader no), `DEC-EXP-FK-001` (condiciones experimentales externas controladas; afecta el wording de OE5, aquí solo contexto), `DEC-EXP-004` (modelo/esfuerzo los fija Core; OE2 no invoca LLM, nada que mostrar), `DEC-IDEMP-001` (keys durables, `Blocks: NONE`).
- No aplicables: `DEC-EXP-003` (agente generalista, OE5), `DEC-FK-*` (OE2 no usa Functional Knowledge).
- `DEC-VAL-001` es `PENDING` con `Blocks`: «ingestión/despliegue con código empresarial y producción de evidencia empresarial; no bloquea trabajo con código de demostración autorizado». No alcanza este WI (mocks de demo). Regla derivada: los datos mock no se presentan ni exportan como evidencia empresarial o de tesis (spec/transversal/demo-mode).
- `DEC-INF-001` `PENDING` (`Blocks: aprovisionamiento remoto`): no alcanza.
- decisionGate sugerido: blockingDecisionIds [], nonBlocking [], approvedApplicable [DEC-ORG-003, DEC-IDEMP-001, DEC-EXP-FK-001, DEC-EXP-004]; DEC-VAL-001 y DEC-INF-001 evaluadas como no alcanzadas.
- Contract Sync: los 4 eventos ya tienen disposición `NOT_RELEVANT` en `contractSyncReview` con reporte `wi-console-014-contract-sync-scope-review.md` (sin cambios de contrato). No hace falta contract-reviewer ahora; la integración real se verifica en WI-CONSOLE-020.

## Spec aplicable (citas literales)

INTEROP-2.7 §6.15 (`interoperability-contract.md`, líneas 1030-1121):
- «**Definido en INTEROP-2.7, pendiente de implementar y verificar** (`WI-CORE-022`; la Console la consume en `WI-CONSOLE-014`). Es una capacidad experimental separada de OE5 y del producto operativo, con alcance HU05 y HU17. El producto normal usa siempre `SE`; no existe un selector permanente de modo en la interfaz.»
- «`POST /retrieval-comparisons` → `202 RetrievalComparisonAcceptedResponse`. Exige `Idempotency-Key` (scope `RETRIEVAL_COMPARISON_CREATE`) y rol Writer.»
- «`GET /retrieval-comparisons/{retrievalComparisonId}` → `200 RetrievalComparisonStatusResponse`.»
- «`GET /retrieval-comparisons/{retrievalComparisonId}/results` → `200 RetrievalComparisonResultsResponse`; antes de un estado terminal, `409 RETRIEVAL_COMPARISON_NOT_FINISHED`.»
- «`GET /analysis-runs/{analysisRunId}/retrieval-comparisons?cursor&limit` → `200 Page<RetrievalComparisonStatusResponse>`.»
- «ausente: `404 ANALYSIS_SYMBOL_NOT_FOUND`; tipo no elegible: `422 UNSUPPORTED_SYMBOL_KIND`; comparación inexistente o no visible: `404 RETRIEVAL_COMPARISON_NOT_FOUND`; un `AnalysisRun` inexistente o no visible responde el mismo `404` que `GET /analysis-runs/{analysisRunId}`; rol insuficiente: `403 PROJECT_ROLE_INSUFFICIENT`; validación de cuerpo y `Idempotency-Key`: los errores `400` de §4.»
- «La operación es asíncrona (§5) y de solo retrieval: no invoca LLM, Functional Knowledge, `ACTION_REQUIRED`, generación, Sandbox ni publicación, y no cambia el estado del `AnalysisRun`.»
- «`SEM` es solo semántico (coseno), conserva `semanticScore`, no aplica refuerzo estructural y selecciona los 10 primeros. `SE` une y deduplica los 20 semánticos con los candidatos estructurales, pondera `0.7·semántico + 0.3·estructural` (configurable, sin presentarse como verdad científica)… Para PHP, las relaciones estructurales son `IMPORTS`, `IMPORTED_BY`, `SAME_NAMESPACE`, `FULLY_QUALIFIED_REFERENCE` y `DECLARING_CLASS` (su implementación PHP queda diferida con `WI-CORE-028`).»
- «`Precision@10` y `Recall@10` son las métricas principales; `Precision@5` y `Recall@5`, secundarias… Core calcula P@k y R@k solo si la solicitud trae `groundTruth` y, si no, `metrics` es `null`. Nunca se inventa una verdad de terreno ni se declara un ganador.»
- Tipos: `RetrievalMode 'SE'|'SEM'`; `StructuralRelation` (5 valores); `RetrievalComparisonStatus 'PENDING'|'RUNNING'|'COMPLETED'|'FAILED'`; `CreateRetrievalComparisonRequest {analysisRunId, symbolFilePath, symbolQualifiedName, groundTruth?}`; `RetrievalComparisonAcceptedResponse extends AsyncAccepted {analysisRunId, retrievalComparisonId, projectVersionId}` (AsyncAccepted = `{status:'PENDING', pollAfterMs:number}`, §5); `RetrievalComparisonStatusResponse {id, analysisRunId, projectId, projectVersionId, symbol: AnalysisSymbolResponse, status, failureCode|null, failureMessage|null, startedAt|null, completedAt|null}`; `RetrievalCandidateResponse {rank, chunkId, filePath, symbolQualifiedName|null, semanticScore|null, structuralRelation|null, combinedScore|null // solo SE, selected}`; `RetrievalMetricsResponse {precisionAt5, recallAt5, precisionAt10, recallAt10}`; `RetrievalModeResultResponse {mode, retrievalId, config{semanticTopK 20, finalTopK 10, semanticWeight|null, structuralWeight|null, embeddingModel}, candidates, metrics|null}`; `RetrievalComparisonResultsResponse {retrievalComparisonId, analysisRunId, projectVersionId, symbol, modes (exactamente SE y SEM), completedAt}`.
- §4 (líneas 45-46, 1355-1356): `Idempotency-Key` UUID por acción lógica, mismo valor en todo reintento de transporte; mismo par devuelve la respuesta original; misma key con huella distinta `409 IDEMPOTENCY_CONFLICT`; `400 IDEMPOTENCY_KEY_REQUIRED`/`INVALID_IDEMPOTENCY_KEY`/`IDEMPOTENCY_KEY_MISMATCH`. §5 (línea 93-95): resultados antes de estado terminal `409 *_NOT_FINISHED`; `FAILED` conserva código/mensaje resumido y timestamps.
- Matriz de roles (línea 973-974): GET de retrieval-comparisons son Reader; `POST /retrieval-comparisons` es Writer.

`spec/features/014-analysisrun-experiments/spec.md` (sección «OE2»):
- «Capacidad experimental de solo retrieval, separada de OE5 y del flujo operacional. La entrada es un `AnalysisRun` y un símbolo `DIRECTLY_CHANGED` de tipo `METHOD`/`FUNCTION` elegido explícitamente por el usuario; Console rotula `Modo experimental` y ofrece **«Comparar retrieval SE vs SEM»**, que llama a `POST /retrieval-comparisons` con una `Idempotency-Key` UUID estable en los retries… Puede adjuntarse opcionalmente una verdad de terreno externa; sin ella, Precision/Recall se muestran como «no disponible» y nunca como cero.»
- «El resultado muestra lado a lado los dos modos: ranking, `semanticScore`, relación estructural (solo SE), `combinedScore` (solo SE) y selección, además de P@10/R@10 como métricas principales y P@5/R@5 secundarias cuando existan. No se presentan SE y SEM como estrategias equivalentes a RAG o al agente generalista, no se declara ganador, no hay selector permanente de modo en el producto y no se calculan bootstrap, Wilcoxon ni kappa en la interfaz. La operación no llama a LLM, Functional Knowledge, `ACTION_REQUIRED`, generación ni Sandbox.»
- plan.md: «OE2 vive en el módulo nuevo `app/src/retrieval-comparison` (tipos, api, queries y página) con un CTA junto a «Run comparison →» en `AnalysisRunDetailPage`; no reutiliza `RunComparisonPage`, que auto-inicia con un único símbolo elegible. OE2 no usa los gates de OE5 y solo requiere un Run visible y rol Writer.» y «los adapters live no se escriben contra campos que Core no haya publicado.»
- HU17 (OE5, no OE2): «No se ejecuta mientras el Run esté `ACTION_REQUIRED`, obsoleto o sin contexto suficiente.» No aplica a OE2 (AC2).
- tasks.md: ST-CONSOLE-016 `T-BACKLOGGED` (pasa a T-READY/T-DONE solo con evidencia).

Feature 013: `tasks.md`/`spec.md` definen el patrón de control plane (Run, símbolos, roles, PendingContractError en live para lo no publicado). INTEROP-2.7 §6.13 y `DEC-ORG-003` fijan Writer para operar experimentos y comparaciones de retrieval; adoptado en WI-CONSOLE-011/013 (`hasRole`).

## Inventario del código actual (`app/src`)

- `control-plane/AnalysisRunDetailPage.tsx` l.123-137: `canCompare = run.status !== 'ACTION_REQUIRED' && Boolean(findEligibleSymbol(run.symbols))`; botón `Link ... Run comparison →` hacia `/projects/{projectId}/runs/{id}/comparison` dentro de `div.run-heading-actions`, junto al sello `DEMO · DATOS SIMULADOS` (`mock`). El nuevo CTA no puede reutilizar `canCompare` (OE2 sí debe estar disponible con `ACTION_REQUIRED` y `OBSOLETE`; solo exige que el Run sea visible y haya al menos un símbolo elegible para que el selector tenga contenido; con 0 elegibles mostrar la página con estado vacío explicativo o deshabilitar con motivo). `PublishSection` (l.40-51) ya usa `useProject(projectId)` + `hasRole(role,'WRITER')`; esta página no consulta el rol en el nivel superior, así que el CTA necesita `useProject`.
- `router.tsx`: ruta existente `projects/:projectId/runs/:analysisRunId/comparison` (`RunComparisonPage`). Agregar `projects/:projectId/runs/:analysisRunId/retrieval-comparison` (sin chocar).
- `control-plane/errors.ts`: `codeMessages` por `ApiError.code`; `bindingErrorMessage` ya trata `PROJECT_ROLE_INSUFFICIENT` (usa `details.requiredRole/currentRole`), y cualquier `status>=500`. Hoy NO tiene `ANALYSIS_SYMBOL_NOT_FOUND`, `UNSUPPORTED_SYMBOL_KIND`, `RETRIEVAL_COMPARISON_NOT_FOUND`, `RETRIEVAL_COMPARISON_NOT_FINISHED`, `IDEMPOTENCY_CONFLICT` (hay también `errorCorrelationId`). AC4 exige mensajes propios; se agregan ahí (o un helper `retrievalComparisonErrorMessage` en el módulo que delegue en `bindingErrorMessage`; el AC dice control-plane/errors.ts, seguir el AC) con pruebas en `errors.test.ts`.
- `api/client.ts`: `ApiError(message,status,correlationId,code,details)`; `apiRequest(path,{method,headers,body})`.
- `api/idempotency.ts`: `createIdempotencyKey()` y `useIdempotencyKeys()` (`getOrCreate(id)`/`clear(id)`: key por acción lógica, se conserva si falla). `experiments/api.ts` es el patrón de `POST` con header `Idempotency-Key`.
- `projects/roles.ts`: `hasRole(role, min)`, rank READER<WRITER<MAINTAINER<ADMIN; `useProject(projectId)` en `projects/queries.ts`.
- `api/dataSource.ts`: `getDataSource()`, `PendingContractError(capability)` (contrato aprobado pero no disponible live) vs `ProposedCapabilityError`. Para OE2 el contrato está definido en INTEROP-2.7, por lo que el adapter live usa `PendingContractError` (patrón `run-comparison/api.ts`, `context-explorer/api.ts`, `action-required/api.ts` l.49/66).
- Patrón de módulo a imitar: `run-comparison/{types,api,RunComparisonPage}.tsx` (no existe `queries.ts` allí; los hooks están en la página); `context-explorer/queries.ts` y `projects/queries.ts` sí tienen queries separados. `RunComparisonPage`: `useQuery` con `refetchInterval` que corta en estados terminales (`MODE==='test' ? 10 : 560`), `useMutation` de inicio, selector `<select id="comparison-symbol">` mostrado solo con más de un símbolo elegible y auto-inicio con exactamente uno (comportamiento que OE2 NO debe copiar), `ErrorState` con `onRetry`, `bindingErrorMessage` + `errorCorrelationId` en `p.inline-error role="alert"`, `Breadcrumbs`, `RepoChip`, sello `DEMO`/`API`.
- `run-comparison/types.ts`: `findEligibleSymbols(symbols)` (DIRECTLY_CHANGED y METHOD/FUNCTION) reutilizable (importar, no duplicar). `useAnalysisRun(analysisRunId)` y `getAnalysisRun` → `AnalysisRunDetailResponse.symbols: AnalysisSymbolResponse[]` (live: `GET /analysis-runs/{id}`, ya vigente).
- Cómo obtener la lista para el selector: del detalle del Run (`run.symbols` filtrado con `findEligibleSymbols`), no hay endpoint propio de símbolos. Enviar al POST `symbolFilePath = symbol.filePath` y `symbolQualifiedName = symbol.qualifiedName` (la clave del `<option>` debe ser filePath+qualifiedName, no solo qualifiedName, porque dos archivos pueden repetir nombre).
- `api/mockBackend.ts`: `mockStartRunComparison` (l.~913-925) valida `findVisibleRun`, `requireProjectRole(projectId,'WRITER')` (403 `PROJECT_ROLE_INSUFFICIENT` con `details`), 409 `RUN_NOT_ELIGIBLE` en ACTION_REQUIRED (NO aplica a OE2), 422 `UNSUPPORTED_SYMBOL_KIND`; estado en `Map` con `polls` (avanza PENDING→RUNNING→RUNNING→COMPLETED por GET); lista `mockListRunComparisons` (lectura pura). Helpers: `latency()`, `notFound(msg, code)`, `clone`, `sequence`, `hideRunOfDeletedProject`, `isProjectDeleted`, `requireProject`.
- Runs sembrados con símbolos DIRECTLY_CHANGED METHOD/FUNCTION (disponibles para el selector): `arun_checkout_pr42` (ACTION_REQUIRED, CouponPolicy.apply METHOD), `pr45` (SUCCESS, OrderService.calculateTotal METHOD + formatCurrency FUNCTION), `pr46` (BEHAVIORAL_MISMATCH, CouponPolicy.apply), `pr49` (SUCCESS, tres elegibles: OrderService.calculateTotal, OrderService.createOrder, formatCurrency; el resto CLASS no elegible), `pr50`, `arun_billing_pr24` (ACTION_REQUIRED), `arun_org_*`. Con símbolos solo CLASS (sin elegibles): `arun_checkout_pr47`, `pr48`, `arun_billing_pr17`/`pr17_2`/`pr20`/`pr21`/`pr22`/`pr23`. Con `symbols: []`: la semilla de l.492. OBSOLETE: `arun_billing_pr17` (solo CLASS, no sirve para OE2; conviene un Run OBSOLETE con símbolo elegible o validar con el selector de `pr49`). ACTION_REQUIRED con símbolo elegible: `arun_checkout_pr42`, `arun_billing_pr24`, `arun_org_metrics_pr15` (READER), `arun_org_writer_pr21` (WRITER). Verificar los kinds exactos al sembrar (las líneas citadas están en `mockBackend.ts` ~400-600).
- Proyectos por rol: `prj_org_metrics_demo` = READER; `prj_org_writer_demo` = WRITER; `prj_checkout_demo`/`prj_billing_demo` del owner (rol alto). Para cubrir MAINTAINER/ADMIN basta cualquiera de los de alto rol.

## Campos publicados vs. faltantes

Publicados y mostrables: de status — `id`, `analysisRunId`, `projectId`, `projectVersionId`, `symbol{language,kind,qualifiedName,filePath,changeKind}`, `status`, `failureCode`, `failureMessage`, `startedAt`, `completedAt`; de resultados — `modes[]` (exactamente SE y SEM) con `mode`, `retrievalId`, `config{semanticTopK,finalTopK,semanticWeight,structuralWeight,embeddingModel}`, `candidates[]{rank,chunkId,filePath,symbolQualifiedName|null,semanticScore|null,structuralRelation|null,combinedScore|null,selected}`, `metrics{precisionAt5,recallAt5,precisionAt10,recallAt10}|null`, y `completedAt`. Aceptación: `status:'PENDING'`, `pollAfterMs`, `analysisRunId`, `retrievalComparisonId`, `projectVersionId`.

NO publicado (no mostrar ni inventar semántica):
- `progress` (porcentaje): no existe en `RetrievalComparisonStatusResponse`. No usar barra de porcentaje; solo estado textual (a diferencia de `RunComparisonOperation.progress`).
- Ganador, deltas SE−SEM, diferencias de rank, solapamiento entre modos, test estadístico, kappa/bootstrap/Wilcoxon: no publicados y prohibidos por el WI.
- Contenido/snippet del chunk, línea/rango, score de relación estructural por separado (solo `structuralRelation` nominal y `combinedScore`), peso por candidato, motivo de exclusión/descarte, candidatos fuera del top 10 (no se sabe si `candidates` incluye los 20 y `selected` marca el top 10, o solo los 10; el contrato no lo dice: mostrar lo recibido sin asumir tamaño ni calcular «descartados»).
- Significado/escala de `semanticScore` (rango 0-1 coseno no está declarado como cota): mostrar el número con formato fijo, sin barras normalizadas ni «mejor/peor»; `combinedScore` solo SE (null en SEM).
- La verdad de terreno cargada (`groundTruth` es solo del request; la respuesta no la devuelve) y qué elementos cuentan como relevantes: no se puede resaltar «hit» ni «relevante» en candidatos.
- Identidad de quien creó la comparación (`createdBy`), `createdAt` (solo `startedAt`/`completedAt`), la clave de idempotencia, el modelo LLM (OE2 no usa LLM; `embeddingModel` sí se publica).
- Labels en español para `StructuralRelation` y `FAILED` `failureCode` (enum cerrado solo en StructuralRelation; `failureCode` es `string` libre): definir etiquetas de las 5 relaciones centralizadas y mostrar `failureCode` literal sin traducir ni mapear.
- Paginación del listado de previas: `Page<...>{items,nextCursor}` publicado; tamaño por defecto/`limit` máximo no declarado. El listado trae `Status`, NO resultados: ver la comparación completa de una previa requiere `GET /results` solo si está terminal.
- Orden del listado (¿más reciente primero?): no declarado; ordenar en cliente por `startedAt`/`completedAt` de forma estable o no ordenar, y documentarlo. DECISION_REQUIRED menor (no bloqueante): confirmar con Core en WI-CONSOLE-020.

## Contradicciones spec/código y spec/spec

1. `spec/features/014-.../spec.md` OE2: «Puede adjuntarse opcionalmente una verdad de terreno externa» vs AC3 del WI: «La UI no ofrece cargar verdad de terreno en este corte». El WI prevalece (alcance aprobado, `smart-v3-scope-approval.md`); consecuencia: la Console nunca envía `groundTruth`, así que en live `metrics` será siempre `null` (el estado «con metrics» es contractualmente válido, solo alcanzable si otro cliente crea la comparación o al activar la carga en un WI futuro). Se debe sembrar el caso con metrics en el mock y rotularlo como demo, sin sugerir que la Console permite producirlo.
2. `RunComparisonPage` auto-inicia con un símbolo elegible; AC1 exige «sin auto-inicio aunque haya uno solo». No reutilizar ni copiar ese `useEffect`.
3. `AnalysisRunDetailPage` oculta «Run comparison →» en `ACTION_REQUIRED` (gate de OE5); OE2 «no usa los gates de OE5». El CTA nuevo vive junto al viejo pero con condición propia.
4. Mock `mockStartRunComparison` devuelve 409 `RUN_NOT_ELIGIBLE` y `ApiError` para Run no elegible; ese 409 NO existe en §6.15. Los 409 de §6.15 son `RETRIEVAL_COMPARISON_NOT_FINISHED` (en `/results`) e `IDEMPOTENCY_CONFLICT` (§4). El mock OE2 nuevo no debe devolver `RUN_NOT_ELIGIBLE`.
5. AC4 habla de «cada error 404/409/422 de §6.15»; §6.15 lista 404 (`ANALYSIS_SYMBOL_NOT_FOUND`, `RETRIEVAL_COMPARISON_NOT_FOUND`, y el 404 del Run), 409 (`RETRIEVAL_COMPARISON_NOT_FINISHED`; `IDEMPOTENCY_CONFLICT` viene de §4) y 422 (`UNSUPPORTED_SYMBOL_KIND`). `RETRIEVAL_COMPARISON_NOT_FINISHED` no debería llegar a la UI si solo se pide `/results` tras estado terminal; igual necesita mensaje por si hay una carrera. El 404 del Run reutiliza el mensaje existente de Run no encontrado (código de `GET /analysis-runs/{id}`; verificar `code` en el mock: hoy `ANALYSIS_RUN_NOT_FOUND`).
6. `spec.md` 014 cabecera habla de «INTEROP-2.7 §6.5» para la comparación; el estado de comentarios en `run-comparison/*.ts` cita INTEROP-2.1; el módulo nuevo debe citar INTEROP-2.7 §6.15 y no tocar los comentarios viejos.
7. `ST-CONSOLE-016` sigue `T-BACKLOGGED` en tasks.md aunque el WI está W-SELECTED; el estado de la tarea se actualiza con evidencia al cerrar (regla del repo).

## Riesgos

1. Idempotencia: una key por acción lógica (clic en «Comparar retrieval SE vs SEM» con símbolo elegido), estable ante reintentos de transporte/errores; nueva key para otra comparación (repetir, o cambiar de símbolo). Usar `useIdempotencyKeys().getOrCreate(clave)` con clave derivada de `analysisRunId+filePath+qualifiedName+intento` y `clear` tras éxito. Riesgo: reusar la key tras un 202 exitoso y volver a pulsar devolvería la comparación original (el replay es válido pero confunde si el usuario espera una nueva); definir en UI «Comparar de nuevo» = key nueva y estados claros. `IDEMPOTENCY_CONFLICT` (misma key con símbolo distinto) debe tener mensaje propio.
2. Doble submit: deshabilitar mientras `isPending`; no dejar dos mutaciones.
3. Polling: usar `pollAfterMs` de la respuesta 202 como intervalo inicial (no hardcodear 560), cortar en `COMPLETED`/`FAILED`, tolerar `pollAfterMs` ausente o 0 con un mínimo defensivo (sin inventar valor mágico fuera de un default documentado), cancelar al desmontar, intervalo de prueba corto en `MODE==='test'` como en el resto. Pedir `/results` solo tras `COMPLETED` (no en FAILED). Cuidar el 404 durante polling (comparación eliminada con el Project): mostrar error terminal, no reintentar sin fin.
4. Accesibilidad: región `role="status"` (aria-live polite) para PENDING/RUNNING, `role="alert"` para FAILED y errores; no solo color (texto del estado); tablas con `<caption>`/`th scope`; lado a lado debe colapsar bien en móvil y ser operable por teclado; selector con `<label>` asociado; foco devuelto al resultado o a la región tras completar; respetar `prefers-reduced-motion` (sin animación en el avance).
5. Honestidad de mocks: sello `DEMO · DATOS SIMULADOS` visible en CTA/página, nota «Modo experimental», texto de que SE y SEM no equivalen a RAG ni a GA, sin ganador, sin colores semáforo de «mejor», sin cálculo estadístico, sin cargar verdad de terreno, sin prometer relaciones PHP (el mock debe usar TypeScript; `structuralRelation` en candidatos puede quedar `null` aunque se muestre el enum; la nota debe decir que las relaciones PHP dependen de Core y no se prometen). Los datos mock no son evidencia de tesis (demo-mode).
6. Live: el adapter debe rechazar con `PendingContractError` en POST/GET/results/lista hasta WI-CONSOLE-020; los tipos de la feature deben reflejar §6.15 sin extras. Si se escribiera un parser live «tolerante» se estaría adivinando; no hacerlo.
7. Rol: Reader no ve la acción (o se deshabilita con motivo accesible) pero la página de lectura de previas puede abrirse; el 403 de Core manda siempre. No inferir rol de `AnalysisRun`. Mientras `useProject` carga o falla, no mostrar la acción habilitada.
8. Estado de Run: con `OBSOLETE`/`ACTION_REQUIRED` el CTA existe y la comparación se permite; evitar texto que sugiera que el Run se desbloquea o cambia (la operación no cambia el Run).
9. Prueba de regresión: tests de `AnalysisRunDetailPage` que cuentan botones/enlaces del encabezado pueden romperse con el nuevo CTA; `errors.test.ts` y `api.test.ts` de run-comparison no deben cambiar de comportamiento.
10. Previas: el listado trae solo status; cargar `/results` por cada previa COMPLETED genera N+1; limitar a bajo demanda (expandir/«Ver resultado») o a la comparación seleccionada, y paginar con `nextCursor` sin bucles (como `listAnalysisRuns` aggregate con `seenCursors`).

## Propuesta de cortes para el implementer

Recomendado: **un corte** para `implementer` (Low), escalable a `implementer-high` si el volumen del mock o los tests exceden la capacidad; el trabajo es coherente y no tiene dependencia externa. Si el Leader prefiere dos entregas revisables:

Corte A (datos y contrato):
- `app/src/retrieval-comparison/types.ts` (tipos de §6.15, `RetrievalComparisonStatus`, etiquetas de `StructuralRelation`, helpers de estado terminal y de formato de score/metric; reutiliza `findEligibleSymbols` de `run-comparison/types`).
- `app/src/retrieval-comparison/api.ts` (`startRetrievalComparison(analysisRunId, symbol, idempotencyKey)`, `getRetrievalComparison`, `getRetrievalComparisonResults`, `listRetrievalComparisons(analysisRunId, cursor?)`; mock real / live `PendingContractError`) y `api.test.ts` (live → `PendingContractError` en las 4; mock: shapes de §6.15, key obligatoria, 403/404/422).
- `app/src/retrieval-comparison/queries.ts` (`useRetrievalComparisons`, `useRetrievalComparison` con `refetchInterval` por `pollAfterMs`, `useRetrievalComparisonResults`, `useStartRetrievalComparison`).
- `app/src/api/mockBackend.ts` (funciones `mockStartRetrievalComparison`, `mockGetRetrievalComparison`, `mockGetRetrievalComparisonResults`, `mockListRetrievalComparisons` + semillas; no mutar las de HU48).
- `app/src/control-plane/errors.ts` y `errors.test.ts` (mensajes nuevos).

Corte B (UI):
- `app/src/retrieval-comparison/RetrievalComparisonPage.tsx` (+ `.test.tsx`), componentes locales para el lado a lado (p. ej. `ModeResultPanel`, `StatusRegion`), CSS en `styles.css` reutilizando tokens (design-system).
- `app/src/router.tsx` (ruta `/projects/:projectId/runs/:analysisRunId/retrieval-comparison`).
- `app/src/control-plane/AnalysisRunDetailPage.tsx` (+ test): botón «Comparar retrieval SE vs SEM» junto a «Run comparison →», condiciones propias, rol Writer.
- `spec/features/014-analysisrun-experiments/tasks.md` (ST-CONSOLE-016 solo con evidencia).

Gate final: `npm run lint`, `npm test`, `npm run build` en `app/`, `node harness/validate-harness.mjs`, validadores SDD, revisión `ux-reviewer` (UI), luego revisión humana. Commit con `Refs: HU05, HU17`.

## Casos del mock a sembrar

Estados (cada uno alcanzable y probado):
- PENDING (primer GET tras el 202 devuelve PENDING o RUNNING; el 202 siempre trae `status:'PENDING'` y `pollAfterMs` propio, p. ej. 460).
- RUNNING con `startedAt` y `completedAt:null`.
- COMPLETED sin `metrics` (ambos modos `metrics:null`; caso que la UI de la Console produce): P@5/R@5/P@10/R@10 se muestran «no disponible», nunca 0.
- COMPLETED con `metrics` (ambos modos; P@10/R@10 destacadas, P@5/R@5 secundarias): sembrado como comparación previa «creada con verdad de terreno externa» para no sugerir que la Console puede cargarla.
- FAILED con `failureCode` y `failureMessage` (cualquier código string; p. ej. un código de infraestructura demo) y `correlationId` en el `ApiError`/nota.
- Previas del Run: al menos 3 comparaciones en el mismo Run (una COMPLETED sin metrics, una COMPLETED con metrics, una FAILED) que se listan sin reemplazarse; al crear una nueva, aparece junto a las anteriores.

Resultados: `modes` con exactamente SE y SEM; SE con `semanticWeight 0.7`, `structuralWeight 0.3`, candidatos con `structuralRelation` (algunos null) y `combinedScore`; SEM con pesos null, `structuralRelation:null` y `combinedScore:null`; `semanticTopK 20`, `finalTopK 10`, `embeddingModel` demo; `selected` marcando el top 10; símbolos TypeScript (sin relaciones PHP) y al menos un candidato con `symbolQualifiedName:null`; los dos modos con rankings distintos para que el lado a lado sea informativo, sin ganador implícito.

Errores:
- 404 `ANALYSIS_SYMBOL_NOT_FOUND` (símbolo que no está en el Run), 404 `RETRIEVAL_COMPARISON_NOT_FOUND` (id desconocido o proyecto eliminado), 404 de Run inexistente (como `GET /analysis-runs/{id}`), 409 `RETRIEVAL_COMPARISON_NOT_FINISHED` en `/results` antes del estado terminal, 409 `IDEMPOTENCY_CONFLICT` (misma key con otro símbolo), 422 `UNSUPPORTED_SYMBOL_KIND` (símbolo CLASS o IMPACTED), 403 `PROJECT_ROLE_INSUFFICIENT` con `details{requiredRole:'WRITER',currentRole:'READER'}`, 400 `IDEMPOTENCY_KEY_REQUIRED`/`INVALID_IDEMPOTENCY_KEY` (header ausente/no UUID). Todos con `correlationId` demo.
- Idempotencia en el mock: misma key y mismo cuerpo → mismo `retrievalComparisonId` sin crear otro; misma key y cuerpo distinto → 409.

Roles y Runs:
- Writer/Maintainer/Admin: pueden iniciar (p. ej. `prj_checkout_demo` con `arun_checkout_pr49` de tres símbolos elegibles para probar el selector sin auto-inicio, y `arun_checkout_pr45` de dos); `prj_org_writer_demo` (WRITER, `arun_org_writer_pr21` en ACTION_REQUIRED con símbolo elegible: OE2 permitido pese al estado).
- Reader: `prj_org_metrics_demo` / `arun_org_metrics_pr15` (ACTION_REQUIRED): ve las previas pero no inicia (el mock responde 403 si se fuerza).
- Un Run con un único elegible (`arun_checkout_pr46`, `pr42`) para probar que NO auto-inicia.
- Un Run con 0 elegibles (`arun_checkout_pr47`, solo CLASS) para el estado vacío.
- Run OBSOLETE con símbolo elegible: sembrar uno nuevo o ajustar uno existente sin romper pruebas que cuentan semillas (ver Riesgo 9 y la dependencia de contadores literales en pruebas existentes).

## Pruebas requeridas (resumen)
- Tipos/helpers: formato de score/métrica, etiquetas de `StructuralRelation`, estado terminal.
- API: mock y live (`PendingContractError`), `Idempotency-Key` presente y estable en reintentos, nueva key para otra acción.
- Página: selector sin auto-inicio (con uno y con varios), botón deshabilitado sin símbolo, estados PENDING/RUNNING/COMPLETED/FAILED con `role=status`/`alert`, metrics null → «no disponible», metrics presentes con P@10/R@10 destacadas, lado a lado SE/SEM, previas no reemplazadas, errores 404/409/422/403 con mensajes propios y `correlationId`, Reader sin acción, sello DEMO, sin texto de ganador/estadística ni carga de verdad de terreno ni promesas PHP.
- `AnalysisRunDetailPage`: CTA nuevo visible en ACTION_REQUIRED y OBSOLETE, navega a la ruta nueva; el CTA viejo mantiene su gate.
- Accesibilidad: teclado, foco visible, reduced motion.

## Entregable para el Leader
- status: SUFFICIENT
- findings: ver Contradicciones (1: verdad de terreno excluida por el WI ⇒ metrics siempre null desde la Console; 4: no reutilizar el 409 `RUN_NOT_ELIGIBLE`) y Campos faltantes (sin `progress`, sin ganador, orden/tamaño de listas no definidos).
- blockers: ninguno. Puntos menores a confirmar con Core en WI-CONSOLE-020 (no bloquean): orden del listado, si `candidates` incluye los 20 o solo los 10, `limit` máximo, rango de `semanticScore`.
- filesAffected: `app/src/retrieval-comparison/{types,api,queries}.ts`, `RetrievalComparisonPage.tsx` (+ tests), `app/src/api/mockBackend.ts`, `app/src/control-plane/{errors.ts,errors.test.ts,AnalysisRunDetailPage.tsx,AnalysisRunDetailPage.test.tsx}`, `app/src/router.tsx`, `app/src/styles.css`, `spec/features/014-analysisrun-experiments/tasks.md` (solo con evidencia).
- evidence: citas literales de INTEROP-2.7 §4/§5/§6.15 y feature 014 arriba; inventario con rutas y líneas.
- recommendedNextStep: Leader registra decisionGate (blockingDecisionIds [], approvedApplicable [DEC-ORG-003, DEC-IDEMP-001, DEC-EXP-FK-001, DEC-EXP-004]; DEC-VAL-001 y DEC-INF-001 no alcanzadas), pasa el WI a W-SPEC_VERIFIED y delega a `implementer` (un corte o A+B); después ux-reviewer, validadores y revisión humana.
