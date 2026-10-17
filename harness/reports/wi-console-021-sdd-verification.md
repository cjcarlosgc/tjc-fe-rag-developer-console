# WI-CONSOLE-021 — Verificación de suficiencia SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Fecha: 2026-10-10. WI: `WI-CONSOLE-021` (ST-CONSOLE-023; HU05, HU07, HU12, HU15, HU17), estado `W-SELECTED`. Fuente canónica: Core `3f06f44543b5899d98232b757310ce6d481624ea` leída con `git show`. Los contratos de Core no cambian entre `3f06f44` y su HEAD actual `a533eb4` (solo docs/harness; `WI-CORE-027` cerrado en `129a9ab`).

## 1. Suficiencia y límites

**Veredicto: `SUFFICIENT_WITH_CONDITIONS`.** El WI tiene HU válidas (HU05/07/12/15/17), `taskId` en el `tasks.md` dueño (014), componente CONSOLE, puerta externa `G-PASSED`, sin casos OC y sin decisiones bloqueantes. Es implementable en dos cortes. Condiciones que el líder debe cerrar antes de `W-SPEC_VERIFIED`/implementar:

1. **Reconciliar AC1 con el Contract Sync (hallazgo bloqueante de proceso).** `node harness/contract-sync.mjs check --checkpoint implementation-delivery --work-item WI-CONSOLE-021` (solo lectura) devuelve 17 eventos pendientes de `C-RESOLVED`, no 11:
   - Los 11 de AC1 (`-20261008-002..007`, `-20261009-008..011`, `-013`): cubiertos por AC1.
   - `CS-CORE-20261009-014` y `-015` (scope `interoperability-contract.md`, `breaking: true`): relevantes para este WI (`contractImpact: true` y scope `spec/contracts/`), están `C-ACKNOWLEDGED` con evidencia de WI-CONSOLE-020 y bloquearían `implementation-delivery`, `before-review` y `before-done`. AC1 no los menciona y el AC5 de WI-020 dice que WI-020 los resuelve. Hay que decidir: (a) este WI también los resuelve (el espejo que refresca ya contiene su contenido) o (b) se enmienda el WI/gate para que no cuenten aquí. La opción (b) no tiene mecanismo en el harness (`contractSyncReview` NOT_RELEVANT solo admite eventos anteriores a la línea base 2026-09-24).
   - `CS-20260920-003`, `CS-20260921-001`, `-002`, `-003` (históricos, `ACKNOWLEDGED`, anteriores a la línea base): también aparecen pendientes; el WI no declara `contractSyncReview`. Requieren `contractSyncReview` NOT_RELEVANT con razón y SHA (como otros WI, p. ej. `work-items.json` líneas 89/162/431) o ser resueltos.
2. **El espejo ya arrastra las 3 piezas que AC5 deja en mock.** INTEROP en `3f06f44` ya dice «Implementado» para las tres rutas `/evidence` (§6.16) y trae las tasas `number | null` + `evaluableRepetitions`/`nonEvaluableRepetitions` (§6.5/6.5.1). Refrescar el espejo es correcto y obligatorio (byte por byte); no implica activar `/evidence` live. El texto de AC1 («si WI-CORE-027 modifica el contrato antes de cerrar…») quedó superado: WI-CORE-027 ya cerró y su contrato está en `3f06f44`. El informe de la puerta (`wi-console-021-external-dependency-gate.md`) todavía dice que 027 está `W-IN_REVIEW`; conviene anotarlo.
3. **`syncScopePaths` no incluye `github-integration-contract.md`** aunque AC1 y el acuse exigen refrescar GH-INTEROP-1.3. Ningún evento de Core lista ese path en `scopePaths` (el `-013` solo menciona GH-INTEROP-1.3 en el texto). El refresco es válido por AC1, pero el harness no lo detectará; registrarlo como acción manual con SHA.

Límites (fuera de este WI): activar adapters live (WI-CONSOLE-020), `/evidence` live, UI de `evaluableRepetitions`/«sin datos» con contadores (WI-020 AC2), emitir `CS-CONSOLE-...` a Core, tocar Core/Sandbox/GitHub Integration, `POST /experiments` con `analysisRunId`/símbolo (ver riesgos).

## 2. Decisiones aplicables (decisionGate)

Revisadas las decisiones del espejo SYSTEM de `3f06f44` y de las specs 013/014:

| ID | Estado | Blocks | ¿Alcanza este WI? |
| --- | --- | --- | --- |
| DEC-INF-001 | PENDING | aprovisionamiento remoto | No |
| DEC-VAL-001 | PENDING | ingestión/despliegue con código empresarial y evidencia empresarial | No |
| DEC-FK-002/-003/-004/-005, DEC-ORG-001/-002/-003, DEC-TRACE-001/-002, DEC-EXP-FK-001, DEC-EXP-003/-004, DEC-EVID-001, DEC-RC-001/-003 | APROBADO | NONE | No bloquean |

Resultado propuesto: `decisionGate.checked = true`, `blockingDecisionIds: []`, `nonBlockingDecisionIds: []` (los PENDING no alcanzan el WI), sin pregunta de decisión. `harness/state.json` aún tiene `checked:false`.

## 3. Inventario por criterio de aceptación

Leyenda: HECHO = ya en `app/src`; FALTA = a implementar.

### AC1 — Espejos y Contract Sync
- Estado: espejos locales distintos de la fuente (SHA locales vs. canónicos de `3f06f44`):
  - `spec/contracts/system-contract.md`: local `73cb0096…f913d2` vs canónico `670a1ef0…7dc2` (33 líneas de diff: GH-INTEROP-1.2→1.3, frase de Writer de -004, DEC-FK-005 de -006/-007).
  - `spec/contracts/interoperability-contract.md`: local `0c7bb971…06a` vs canónico `fcfbd6d6…ec109a` (274 líneas: §6.5/6.5.1 nullables, §6.15, §6.16 evidence, failureCode).
  - `spec/contracts/github-integration-contract.md`: local `1092ef36…5c45` vs canónico `d1779bbd…bd964` (20 líneas: 1.2→1.3, `POST /checks` 200 `{checkId}`).
  - Los SHA canónicos coinciden con la tabla de la puerta.
- FALTA: copiar los tres archivos con `git show 3f06f44:spec/contracts/<f>.md`, verificar SHA-256 y registrarlos en el reporte; `resolve` de los eventos con el WI en `W-IN_PROGRESS` (ver condición 1). Los 11 eventos de AC1 están `C-ACKNOWLEDGED` (evidencia `wi-console-021-contract-sync-acknowledgement.md`); ninguno `C-RESOLVED`.
- Precedencia confirmada: `-007` prevalece sobre `-006` para SYSTEM; el espejo canónico ya la refleja (DEC-FK-005 APROBADO). `-009` acota `-008` (solo executionDurationMs). `-010..-015` sin conflicto con lo anterior.

### AC2 — OE5 (-008/-009): null y evaluabilidad
- HECHO: `experiments/types.ts` y `ExperimentComparison.tsx` muestran `pairId`, `pairPosition`, `attempt` y `technicallyEvaluable` con «no disponible» para null y marca «técnicamente no evaluable» para `false` sin declarar ganador (`noAutomaticVerdict.test.tsx`). `liveMapping.toExperimentConfiguration` devuelve `null` si falta model/budget/executionProfile/runnerHint/randomizationSeed (toleración en runtime). El mock ya trae un caso `attempt: 2` + `technicallyEvaluable: false`.
- FALTA:
  - `executionDurationMs` no existe en ningún tipo ni vista: `ExperimentRepetitionResponse` local solo tiene `totalDurationMs`; `RepetitionResult.durationMs` = total. No hay guion para null, ni número cuando hubo llamada fallida. Hay que tipar `generationDurationMs`, `executionDurationMs: number | null`, `totalDurationMs`, mapear y mostrar una columna «Ejecución en Sandbox» (guion si null; `formatDuration` para número, incluidos valores pequeños; nunca sumar). Pregunta Q1.
  - Los tipos de status declaran `model?`, `budget?`, `executionProfile?`, `runnerHint?`, `randomizationSeed?` sin `| null` (el contrato los define `| null`); `ExperimentConfiguration.runnerHint/randomizationSeed` son `string`. Corregir a `| null` y decidir si la configuración parcial se muestra parcial (hoy basta un `null` para perder todo el bloque).
  - `ExperimentStatusResponse` local no tiene `analysisRunId` ni `symbol` (el contrato los incluye); no es regresión de OE5 pero es parte de «tipos según contrato».
  - Mocks: sin una repetición con `executionDurationMs: null` ni con valor tras fallo de Sandbox; sin experimento corrida previa (`model/budget/... null`, `pairId/pairPosition null`).

### AC3 — failureCode (-010)
- HECHO: OE2 muestra `failureCode`/`failureMessage` literales (`RetrievalComparisonPage.tsx:205,230`, tipo `string | null` en `retrieval-comparison/types.ts`).
- FALTA (experimentos): `ExperimentOperation`/`ExperimentStatusResponse` mapean `failureCode` pero `toExperimentOperation` lo descarta. `ExperimentPage.tsx` no tiene estado FAILED: `status !== 'COMPLETED'` pinta «Preparando experimento» para un `FAILED` y el polling se detiene (el usuario ve una carga eterna). Falta:
  - Tabla de mensajes (p. ej. en `experiments/` o junto a `control-plane/errors.ts`): `EXPERIMENT_FAILED` «el experimento falló durante la ejecución», `EXPERIMENT_WORKER_LOST` «se interrumpió el procesamiento y puede reanudarse», cualquier otro valor tolerado con mensaje genérico; `failureMessage` como detalle; `role="alert"`. No prometer botón de reanudar (no hay ruta en el contrato; Q2).
  - Mock: un experimento FAILED con cada código (y uno con código desconocido) rotulado DEMO.

### AC4 — OE2 (-011)
- HECHO: tipos de `retrieval-comparison/types.ts` coinciden con §6.15 (DTOs, `metrics: null`, `semanticWeight/structuralWeight` null, `failureCode` abierto); la UI no envía `groundTruth` (`buildRetrievalComparisonRequest`); polling por `pollAfterMs` del 202 con fallback (`queries.ts`); results solo con `COMPLETED`; mensajes propios de `ANALYSIS_SYMBOL_NOT_FOUND`, `UNSUPPORTED_SYMBOL_KIND`, `RETRIEVAL_COMPARISON_NOT_FOUND`, `RETRIEVAL_COMPARISON_NOT_FINISHED`, `IDEMPOTENCY_CONFLICT` (`control-plane/errors.ts`). Adapters live siguen en `PendingContractError` (correcto para WI-020).
- FALTA:
  - Sin mensaje propio para `409 ANALYSIS_NOT_FINISHED` ni `422 UNSUPPORTED_PROJECT` (también aplica a `POST /experiments`) ni `409 RETRIEVAL_COMPARISON_FAILED` (hoy mostraría el mensaje crudo de Core).
  - Tope `groundTruth` ≤ 200: no existe constante/guarda en el tipo ni en el builder (hoy es opcional y no se envía). Añadir `MAX_GROUND_TRUTH_ITEMS = 200` y rechazo local, con prueba, sin enviarlo desde la UI.
  - `RETRIEVAL_COMPARISON_FAILED` en `/results`: la capa de datos debe leer el detalle del status y no reintentar (hoy `useRetrievalComparisonResults` solo se habilita en `COMPLETED`, así que en la práctica no se pide; falta que el cliente tipado/mocks representen ese 409 y una prueba de que no hay reintento). El mock solo emite `NOT_FINISHED` en `/results`.
  - Valores `failureCode` conocidos de OE2 (`RETRIEVAL_TARGET_UNRESOLVABLE`, `RETRIEVAL_COMPARISON_FAILED`, `RETRIEVAL_COMPARISON_WORKER_LOST`) sin mensaje legible; el mock usa códigos `DEMO_*` ajenos al contrato.
  - Los comentarios de `api.ts`/`types.ts` afirman «Core aún no lo publica (WI-CORE-022)»; quedan obsoletos.

### AC5 — Trace y evento -002/-003/-005
- Trace HECHO: `operationalTraceTypes.ts` es copia fiel de §6.16 (mismos campos y nulabilidad); `NOT_APPLICABLE`, `freshness: null`, `checkId: null` («sin dato») y `409 EVIDENCE_NOT_FINISHED` con polling están cubiertos por `OperationalTraceSection.tsx`, `operationalTraceErrors.ts`, `operationalTrace.test.ts`. Adapter live de trace sigue en `PendingContractError` (WI-020).
- FALTA (validación contra DTO real): el mock usa `outcome: 'VALIDATED'` (`mockBackend.ts:1704,1705,1714`), fuera del vocabulario implementado `SUCCESS | BEHAVIORAL_MISMATCH | TECHNICAL_GENERATION_FAILURE`; corregir mocks/tests. Comprobar orden determinista de targets (`filePath`, `qualifiedName`, `id`) y de `executions` por `attempt`, y que no se muestre ningún conteo/omitida/`knowledgeId`. Un caso de publicación `PRESENT` con Check y sin publicación de pruebas (`companionBranch` etc. null, `freshness` null) no está en el mock.
- `/evidence` y tasas: permanecen en mock (HECHO por WI-CONSOLE-017); verificado que `evidence/api.ts` no llama a Core live.
- WRITER (-003/-004): HECHO. `projects/roles.ts` (READER<WRITER<MAINTAINER<ADMIN), `hasRole` en `ExperimentPage`, `ConfirmingRole = 'ADMIN' | 'MAINTAINER'`, mensaje 403 con `requiredRole/currentRole` en `bindingErrorMessage`, `repositoryPermissions`. Sin cambios requeridos.
- Abstención (-002): HECHO. `outcome: 'ABSTAINED'`, `continuationAttemptId/knowledgeId: null`, `abstention` con `abstentionLabel` (rol y fecha, sin `lastByUserId`), la pregunta sigue pendiente, `FocusModePage` no limpia la respuesta. Adapter live de UNKNOWN en `PendingContractError` (WI-020).
- scenarioKind/scenarioKey (-002/-005): HECHO en tipos (`action-required/types.ts`; históricas `EXPECTED_RESULT`/`LEGACY`), `knowledgeScenarios.ts` agrupa, la UI muestra la clave y no la envía al responder.
- Procedencia (-003): HECHO en `FunctionalKnowledgeResponse` (`confirmedByUserId`, `confirmedRole`, `originHeadSha`, `sourceRef`); `originHeadSha` no se trata como vencimiento. FALTA solo verificar con una prueba que `LEGACY`/`EXPECTED_RESULT` y nulls de procedencia muestran estado vacío (probablemente ya cubierto en `FunctionalKnowledgeDetailPage.test.tsx`; confirmar al implementar).

### AC6 — Puertas
Aplican `ux-reviewer` (hay cambios de UI: columna, estado FAILED, mensajes), lint, pruebas, build, `node harness/validate-harness.mjs` (hoy pasa) y `contract-sync` checkpoints. Mocks siguen con `DEMO · DATOS SIMULADOS` (`isMockDataSource()` ya rotula la configuración; añadir el sello en los nuevos estados FAILED).

## 4. Diferencias entre los eventos y el alcance del WI

- **Tasas y medias nullables (-015 / parte de -008):** WI-020 las declara suyas (AC2). Hecho verificable: la ruta live de experimentos YA existe (`experiments/api.ts` hace `apiRequest` a `/experiments/{id}` y `/results`; no es `PendingContractError`). Con Core `3f06f44`, un `validRate: null` hoy se renderiza `0 %` (`formatPercent` aplica `Math.max(0, null)`), `totalDurationMs: null` como «null ms» y los deltas se calculan con null→0. Eso viola el criterio común de -008/-009/-015 («no formatear null como 0») y el AC2 de este WI («sin formatear ni sumar sin guardas»). Recomendación: tolerancia defensiva mínima aquí (corte B): tipar las tasas y tres medias como `number | null` en `liveMapping`/`StrategyMetrics`, mostrar «sin datos» y suprimir el delta ante null; dejar a WI-020 los contadores `evaluableRepetitions/nonEvaluableRepetitions` y el copy final «sin datos» con respaldo numérico, más el resto de la verificación live. Confirmar con el usuario (Q3); si prefiere diferir, dejar nota explícita en el acuse, porque el riesgo de render engañoso existe ya en live.
- `evaluableRepetitions` / `nonEvaluableRepetitions` (-015): el WI no los toca. Opcional: tipar como opcionales (`number | undefined`) en el mapper sin mostrarlos, para no perderlos; su UI es de WI-020.
- `/evidence` y 6.16 en el espejo: ya están en `3f06f44`; el espejo debe copiarse completo. No hay trabajo de código nuevo; `evidence/types.ts` ya sigue el bloque 6.16 según WI-017.
- `-010` incluye «puede reanudarse» pero el contrato no ofrece ruta de reanudación: solo copy, sin acción.
- `-008` pide mostrar 422 `REASONING_EFFORT_UNSUPPORTED` (con `details.supportedEfforts`), 422 `UNSUPPORTED_PROJECT` y 503 `LLM_PROVIDER_UNAVAILABLE` «reintentable»; el AC del WI no los lista, pero el acuse y -008 sí. `bindingErrorMessage` hoy da un mensaje genérico para 5xx y crudo para los 422. Incluirlos en el corte B (mensajes + detalle `supportedEfforts` y reintento del 503) o declararlos fuera de alcance (Q4).
- `-014` (claves de evidencia, `checkId`/`| null` como sin dato): ya cubierto por WI-017; sin código nuevo.

## 5. Propuesta de cortes

**Corte A — espejos, docs y referencias (sin lógica de producto).**
- Archivos: `spec/contracts/system-contract.md`, `interoperability-contract.md`, `github-integration-contract.md` (copia byte por byte de `3f06f44`, SHA-256 en el reporte); `spec/features/014-analysisrun-experiments/tasks.md` (marcar `ST-CONSOLE-023` solo al cierre con evidencia); `CHANGELOG.md`; comentarios obsoletos «pendiente de implementar/Core aún no lo publica» en `retrieval-comparison/{api,types}.ts` y referencias `GH-INTEROP-1.2` en `api/client.ts`, `control-plane/{api,types}.ts`, `IntegrationsPage.tsx` (verificar si procede actualizar a 1.3); reporte con SHA y tabla de eventos; `contractSyncReview` NOT_RELEVANT para los 4 históricos (si el líder opta por ello) en `harness/work-items.json`.
- Pruebas: `node harness/validate-harness.mjs`, `node harness/contract-sync.mjs check ...` (sin pendientes salvo los resolubles), comparación `cmp` con `git show` por archivo.

**Corte B — guardas, errores, trace, tipos y mocks (implementer; sin tocar adapters live ni `/evidence`).**
1. `experiments/liveMapping.ts`, `experiments/types.ts`: tipos nullable (`model/budget/executionProfile/runnerHint/randomizationSeed | null`, `generationDurationMs`, `executionDurationMs: number | null`, `totalDurationMs`, tasas/medias `number | null` según decisión Q3), `failureCode/failureMessage` en `ExperimentOperation`. Pruebas: `liveMapping.test.ts` (corrida previa con nulls, executionDurationMs null vs número, status FAILED).
2. `experiments/ExperimentComparison.tsx`: columna «Ejecución en Sandbox» con guion; «sin datos» para tasas null y sin delta. Pruebas en `ExperimentComparison.test.tsx` y `noAutomaticVerdict.test.tsx`.
3. `experiments/ExperimentPage.tsx` (+ módulo de mensajes de failureCode): estado FAILED con mensaje, código desconocido tolerado. Pruebas en `ExperimentPage.test.tsx`.
4. `control-plane/errors.ts`: mensajes propios de `ANALYSIS_NOT_FINISHED`, `UNSUPPORTED_PROJECT`, `RETRIEVAL_COMPARISON_FAILED` (y, si Q4 sí, `REASONING_EFFORT_UNSUPPORTED` con `supportedEfforts` y `LLM_PROVIDER_UNAVAILABLE`). Pruebas en `errors.test.ts`.
5. `retrieval-comparison/{types,api}.ts`: `MAX_GROUND_TRUTH_ITEMS = 200` y guarda; mapeo de `failureCode` conocidos a texto. `api/mockBackend.ts`: 409 `RETRIEVAL_COMPARISON_FAILED` en `/results` de una comparación FAILED, `ANALYSIS_NOT_FINISHED`, `UNSUPPORTED_PROJECT`. Pruebas en `retrieval-comparison/api.test.ts` y `RetrievalComparisonPage.test.tsx` (sin reintento, sin pedir results en FAILED).
6. `api/mockBackend.ts`: `outcome` del trace a `SUCCESS/BEHAVIORAL_MISMATCH/TECHNICAL_GENERATION_FAILURE`; experimentos de mock con corrida previa (nulls), FAILED (`EXPERIMENT_FAILED`, `EXPERIMENT_WORKER_LOST`, desconocido) y repetición con `executionDurationMs` null/valor. Ajustar `mockBackend.test.ts`, `operationalTrace.test.ts`, `OperationalTraceSection.test.tsx`.
7. Cierre: `npm run lint`, pruebas, `tsc -b --noEmit`, build; `ux-reviewer`; `resolve` de eventos; `before-review`.

Los cortes son separables; A puede ir primero y en un commit propio (`Refs: HU05, HU07, HU12, HU15, HU17`). La puerta `implementationCompleted` exige que `resolve` ocurra con el WI en `W-IN_PROGRESS`.

## 6. Riesgos y preguntas

Riesgos:
- R1: AC1 vs gate de Contract Sync (-014/-015 y 4 históricos); sin resolverlo, `before-review` no pasa.
- R2: `ExperimentPage` ya llama live a Core con `POST /experiments {projectId, targetId}`; el contrato 3f06f44 define `CreateExperimentRequest {analysisRunId, symbolFilePath, symbolQualifiedName}` y `ExperimentStatusResponse` con `analysisRunId`/`symbol` (sin `targetId`). El flujo Run-based (`run-comparison/`) sigue en `PendingContractError`. Es una discrepancia live de WI-020 (no de este WI); debe quedar registrada para no darla por verificada.
- R3: FAILED de experimento hoy se ve como «Preparando experimento» sin fin (AC3 lo corrige).
- R4: render de `null` como `0 %`/«null ms» en live (ver sección 4).
- R5: el espejo de INTEROP declara `/evidence` «Implementado» y WI-017 dejó el adapter live en pendiente; consistente con AC5, pero conviene que el reporte lo explique para el reviewer.
- R6: GH mirror fuera de `syncScopePaths`; sin evento Core que lo cubra (solo texto de -013).

Preguntas para el usuario:
- Q1: ¿Mostrar `executionDurationMs` como columna nueva «Ejecución en Sandbox» en la tabla de repeticiones (recomendado para cumplir AC2) o se considera cumplido no mostrando ese dato?
- Q2: Para `EXPERIMENT_WORKER_LOST`, ¿solo el texto «puede reanudarse» sin acción (el contrato no define ruta de reanudar)?
- Q3: ¿Tolerancia defensiva de tasas/medias `null` («sin datos», sin delta) en este WI, dejando contadores y verificación a WI-020, o diferir todo a WI-020 aceptando el riesgo R4?
- Q4: ¿Incluir en el corte B los mensajes de creación de experimentos (`REASONING_EFFORT_UNSUPPORTED` con `supportedEfforts`, `UNSUPPORTED_PROJECT`, `LLM_PROVIDER_UNAVAILABLE` reintentable) aunque no estén en los AC?
- Q5: ¿Resolver aquí `CS-CORE-20261009-014/-015` (y ajustar AC1) o crear un mecanismo para excluirlos? ¿Y qué disposición para los 4 eventos históricos (NOT_RELEVANT con `contractSyncReview`)?

## Evidencia

- `git show 3f06f44:spec/contracts/{system,interoperability,github-integration}-contract.md` vs espejos locales: `cmp` difiere en los tres; SHA-256 listados arriba.
- `git diff 3f06f44 HEAD -- spec/contracts` en Core: vacío.
- `node harness/validate-harness.mjs`: passed. `node harness/contract-sync.mjs check --checkpoint implementation-delivery --work-item WI-CONSOLE-021` (sin `--record`): exit 2, 17 pendientes.
- Eventos leídos: `CS-CORE-20261008-002..007`, `CS-CORE-20261009-008..011`, `-013..-015` (todos `C-ACKNOWLEDGED`).
- Informes de Core: `harness/reports/wi-core-022-contract-final-review.md` (6 checkpoints OE2) y `wi-core-026-contract-final-review.md` (7 checkpoints del trace).
