# WI-CONSOLE-014 — Revisión contractual (INTEROP-2.7 §6.15 y §4)

Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Status: PASS_WITH_NOTES (sin blockers; no requiere Contract Sync)

## Verificación
- Tipos (`types.ts`): coinciden campo a campo con §6.15 (RetrievalComparisonAcceptedResponse = AsyncAccepted + 3 ids; StatusResponse, Candidate, Metrics, ModeResult con `config`, ResultsResponse, Request con `groundTruth?`). Sin campos extra ni faltantes. `RetrievalComparisonListPage` {items,nextCursor} es la forma Page<T> existente.
- POST: `api.ts` recibe `idempotencyKey`; el cuerpo lo arma `buildRetrievalComparisonRequest` con analysisRunId/symbolFilePath/symbolQualifiedName y nunca `groundTruth`. El mock exige la key (400 IDEMPOTENCY_KEY_REQUIRED / INVALID_IDEMPOTENCY_KEY, ambos en §4), replay idempotente y 409 IDEMPOTENCY_CONFLICT con huella distinta (§4).
- Rol: mock exige WRITER en POST; la UI usa `hasRole(..., 'WRITER')` y muestra nota para Reader. Conforme con §6.15.
- Estados: PENDING/RUNNING/COMPLETED/FAILED; terminales COMPLETED/FAILED (§5). FAILED conserva failureCode/failureMessage/timestamps.
- Métricas: `metrics: RetrievalMetricsResponse | null`; sin groundTruth el mock devuelve null y la UI muestra "no disponible", nunca 0. No hay ganador ni estadística.
- Modos: `modes` = exactamente SE y SEM. SEM: combinedScore null, structuralRelation null, pesos null; SE: 0.7/0.3, semanticTopK 20, finalTopK 10, 10 selected. Conforme.
- Errores 404/409/422 definidos en §6.15/§4: ANALYSIS_SYMBOL_NOT_FOUND (404), UNSUPPORTED_SYMBOL_KIND (422), RETRIEVAL_COMPARISON_NOT_FOUND (404), RETRIEVAL_COMPARISON_NOT_FINISHED (409), IDEMPOTENCY_CONFLICT (409), 400 de key. `errors.ts` solo añade mensajes para códigos definidos. PROJECT_ROLE_INSUFFICIENT ya existía.
- Live: las 4 operaciones rechazan con `PendingContractError` fuera de mock; no hay parsers live. Correcto mientras WI-CORE-022 siga pendiente.

## Findings
1. (Aceptable, provisorio) `GET .../results` de una comparación FAILED responde en el mock 409 `RETRIEVAL_COMPARISON_NOT_FINISHED`. §6.15 solo define ese 409 "antes de un estado terminal" y no especifica resultados de FAILED; FAILED es terminal, así que la semántica es estirada. Es aceptable como mock mientras sea código del contrato (no inventado) y quede marcado como provisorio. La UI no depende de él: `useRetrievalComparisonResults` solo se habilita con status COMPLETED y la página muestra failureCode/failureMessage del estado en FAILED. Recomendación: consultar a Core/WI-CORE-022 el comportamiento oficial (p. ej. 200 con modes vacíos, o un código propio) y registrarlo como pendiente, sin cerrarlo por inferencia.
2. (Menor) `ANALYSIS_RUN_NOT_FOUND` en los mocks no es un literal de §6.15; el contrato dice "el mismo 404 que GET /analysis-runs/{id}". Es consistente con los mocks previos del repo; sin acción.
3. (Menor) Mock devuelve 12 candidatos por modo; el contrato fija top-20 semánticos y 10 seleccionados (`selected` solo 10). Es dato demo sin impacto contractual.
4. (Menor) Los códigos de fallo demo `DEMO_RETRIEVAL_FAILED` / `DEMO_EMBEDDING_INDEX_UNAVAILABLE` son `failureCode: string` libre en el contrato y llevan prefijo DEMO; correcto.
5. (Info) El mock valida elegibilidad (METHOD/FUNCTION + DIRECTLY_CHANGED) tras el replay de key; orden no especificado por el contrato.

## Blockers
Ninguno.

## filesAffected (revisados, sin editar)
- app/src/retrieval-comparison/types.ts, api.ts, queries.ts
- app/src/api/mockBackend.ts (diff OE2)
- app/src/control-plane/errors.ts (diff)
- app/src/retrieval-comparison/RetrievalComparisonPage.tsx (solo rol/FAILED)
- Creado: harness/reports/wi-console-014-contract-review.md

## evidence
Lectura de spec/contracts/interoperability-contract.md §4, §5, §6.15 (líneas 1030-1121, 45-51, 85-95, 961, 1355-1356) contrastada con los archivos anteriores. No se ejecutaron tests.

## recommendedNextStep
Aceptar el 409 provisorio para FAILED, registrarlo como pregunta abierta hacia Core (WI-CORE-022) en el handoff, y continuar a revisión UX y a la revisión humana. Sin Contract Sync requerido.
