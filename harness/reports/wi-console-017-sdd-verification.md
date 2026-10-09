Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido claude-sonnet-5-5 · esfuerzo low

# WI-CONSOLE-017 — Verificación de suficiencia SDD

## Veredicto: SUFFICIENT

Con una nota: la fidelidad de bytes (ver punto 4) no es una decisión bloqueante, pero conviene fijarla en el handoff.

## Decision gate
- blockingDecisionIds: []
- nonBlockingDecisionIds, solo las cuyo `Blocks` alcanza este WI:
  - Ninguna decisión de `spec/contracts/system-contract.md` tiene un `Blocks` que alcance este WI. Las de `Blocks: NONE` no se listan (DEC-GH-001, DEC-WEB-AUTH-001, DEC-INT-001, DEC-AUTH-001, DEC-IDEMP-001, DEC-ORG-001/002, y las demás con NONE).
  - DEC-INF-001 bloquea solo el aprovisionamiento remoto y no alcanza a este WI.
  - DEC-VAL-001 bloquea la ingestión o despliegue con código empresarial y la producción de evidencia empresarial. No bloquea este WI, que solo descarga lo que Core entrega. Sí condiciona el riesgo de «no presentar como evidencia empresarial».
- `decisionGate` sugerido: G-PASSED, con motivo «ninguna decisión con Blocks alcanza ST-CONSOLE-019; DEC-VAL-001 acotada a no ofrecer evidencia empresarial».

## Contrato publicado (INTEROP-2.7 §6.16, líneas 1123-1131 y 1170-1186)
- Rutas, todas Reader y sin query params:
  - `GET /analysis-runs/{analysisRunId}/evidence`
  - `GET /experiments/{experimentId}/evidence`
  - `GET /retrieval-comparisons/{retrievalComparisonId}/evidence`
  - Todas responden `200 EvidenceBundleResponse`.
- Errores:
  - `409 EVIDENCE_NOT_FINISHED` antes del estado terminal.
  - `404` de la ruta de estado si el sujeto no existe o no es visible.
  - `403 PROJECT_ROLE_INSUFFICIENT`.
- Estados terminales:
  - AnalysisRun: disponible en cualquier estado salvo `QUEUED` y `PROCESSING`. Incluye `ACTION_REQUIRED`, `SUCCESS`, `BEHAVIORAL_MISMATCH`, `TECHNICAL_GENERATION_FAILURE`, `INFRASTRUCTURE_FAILURE`, `BASELINE_FAILED`, `NO_ADDITIONAL_TESTS_REQUIRED`, `NO_TEST_RELEVANT_CHANGES` y `OBSOLETE` (el contrato dice «cualquier estado salvo», así que OBSOLETE entra).
  - Experimento y comparación de retrieval: terminales en `COMPLETED` y `FAILED`.
- `EvidenceBundleResponse`, campos exactos:
  - `schemaVersion: '1'` (literal string).
  - `kind: 'ANALYSIS_RUN' | 'EXPERIMENT' | 'RETRIEVAL_COMPARISON'`.
  - `subjectId`, `generatedAt`, `correlationId`.
  - `analysisRun: {analysisRunId, repositoryName, pullRequestNumber, headSha, projectVersionId, snapshotRef, targets: AnalysisSymbolResponse[], createdAt} | null`. `snapshotRef` es una referencia opaca, nunca una URL firmada.
  - `retrieval[]: {retrievalId, mode, config, candidates[]}`.
  - `context[]: {contextId, selectedChunkIds, discardedChunkIds, tokenCounts:{selected, budget|null}, functionalRuleIds}`.
  - `generation[]: {strategy, provider, model, modelVersion|null, reasoningEffort|null, inputTokens|null, outputTokens|null, durationMs, artifactHash}`.
  - `agentExploration[]: {toolCallCap, steps:[{step, toolName, status}], filesInspected|null, contextTokenBudget}`.
  - `sandbox[]: {executionId, executionProfile, runnerHint, attempt, facts (claves cerradas), durationMs, requestId, correlationId}`.
  - `experimental[]: {experimentId, strategy, repetition, pairId, pairPosition:1|2, attempt, randomizationSeed}`.
  - `publication: TracePublicationResponse | null`.
- Garantías de contenido: la evidencia no incluye chain-of-thought ni credenciales. Los fragmentos de código son datos potencialmente confidenciales (§6.7).
- Core no crea identificadores `EV-OE*`.

## Estado live
- Publicado en INTEROP-2.7: las tres rutas y la forma `EvidenceBundleResponse`. Pero la propia §6.16 marca «definido, pendiente de implementar y verificar» (WI-CORE-026/027).
- La dependencia externa WI-CORE-017 está en G-PASSED (`externalDependencyGate`).
- En el código actual, `getAnalysisRunTrace` en `app/src/control-plane/api.ts` rechaza con `PendingContractError` en modo live. Por la misma regla, el AC4/AC5 pide que el adapter de evidencia haga lo mismo en live. Eso es lo esperado; la activación va en WI-CONSOLE-020.
- No hay nada que decidir sobre qué parte de live está publicada. Está publicada la forma del contrato y es pendiente la implementación en Core. En este WI todo live es `PendingContractError` y el mock refleja el contrato.

## «Tal como lo devuelve Core»
- `apiRequestTo` (`app/src/api/client.ts:89`) hace `response.json()` y descarta el texto original. Re-serializar con `JSON.stringify` cambia el orden de espacios y puede perder precisión numérica.
- Recomendación: añadir un transporte de texto crudo (o `apiRequestTo` con variante `parseAs:'text'`) para evidencia, y descargar ese texto en un Blob `application/json`. `schemaVersion` y `kind` se leen de un `JSON.parse` aparte, solo para mostrar.
- Con el mock no hay bytes de Core. El mock devuelve el objeto y la utilidad serializa con `JSON.stringify(obj, null, 2)`, y debe rotularse DEMO.
- Esto no está explícito en el contrato (no define bytes ni orden de claves), pero el AC lo fija. Se trata como decisión de implementación NO bloqueante, dentro del AC.

## Archivos de app/ a tocar (sin editar ahora)
- Nuevo módulo de la feature, por ejemplo `app/src/evidence/`:
  - `types.ts` (EvidenceKind, EvidenceBundleResponse).
  - `api.ts` (`getEvidence(kind, subjectId)`; mock → `mockGetEvidence`; live → `PendingContractError`).
  - `download.ts` (nombre de archivo, Blob y ancla).
  - `queries.ts`.
  - `EvidenceDownload.tsx` (botón con estados).
  - `evidenceErrors.ts` (reutilizar `isTraceNotFinished` de `control-plane/operationalTraceErrors.ts`).
- Tocar `app/src/api/mockBackend.ts`: `mockGetEvidence` por tipo. Debe reflejar el estado del sujeto y devolver `409 EVIDENCE_NOT_FINISHED` hasta el estado terminal, con el mismo mecanismo que `MockContextTraceState`.
- UI: `control-plane/AnalysisRunDetailPage.tsx`, `experiments/ExperimentPage.tsx`, `retrieval-comparison/RetrievalComparisonPage.tsx`, más `app/src/styles.css`.
- Pruebas por módulo y por página.

## Cortes sugeridos
- A: tipos, adapter, mock, utilidad de descarga y sus pruebas unitarias. Incluye filename, sanitización, Blob y ancla, 409 y live `PendingContractError`.
- B: botón y regiones en las tres páginas, CSS y pruebas de página. Va con revisión de `ux-reviewer` (obligatoria por AC4) antes de la revisión humana.

## contract-reviewer
No hace falta: `contractImpact:false` y `publishesContract:false`. Console solo consume §6.16. Basta con que el handoff declare que no inventa campos fuera de INTEROP-2.7. Los eventos Contract Sync CS-20260920-003, CS-20260921-001/002/003 están ya dispuestos como `NOT_RELEVANT`. Si alguna cadena nueva de Contract Sync aparece antes de implementar, se reabre.

## Reglas de UX derivadas del AC y de accessibility
- Botón «Descargar evidencia (JSON)», deshabilitado antes del estado terminal. Mantener `aria-disabled` o texto explicativo para que no dependa solo del color.
- En `409 EVIDENCE_NOT_FINISHED`: región `role="status"` con «La evidencia estará disponible cuando termine el proceso» y botón de reintento. No es `role="alert"` ni un fallo.
- Errores reales (403, 404, red): `role="alert"`.
- Foco visible, target mínimo 40×40 px, y estado no solo por color.
- Mostrar `schemaVersion` junto al botón o tras la descarga.
- Nombre de archivo: `evidence-{kind}-{subjectId}.json`.
  - `kind` en la forma del contrato, o minúsculas con guiones, según se decida. El AC dice `{kind}` literal y `EvidenceKind` está en mayúsculas con guion bajo.
  - Sanitizar `subjectId` con una lista permitida (por ejemplo `[A-Za-z0-9._-]`, el resto a `_`), sin separadores de ruta ni `..`, con longitud acotada. Los ids vienen de Core y son UUID; la sanitización es defensa en profundidad.
  - La forma exacta de `{kind}` no está definida por el contrato: es un detalle de la utilidad que el implementer debe fijar (propuesta: el valor `kind` del bundle tal cual, minúsculas con guion, p. ej. `analysis-run`) y cubrir con prueba. No es DECISION_REQUIRED.

## Riesgos
- No generar ni mostrar identificadores `EV-OE*`, ni nombrar el paquete como registro académico o evidencia científica o empresarial. Texto fijo en el control: «Paquete técnico de Core; no es el registro académico».
- Mock: rotular «DEMO · DATOS SIMULADOS» junto al botón y dentro del bundle descargado (rótulo del mock; conservar `schemaVersion:'1'` y la forma del contrato sin añadir campos). El rótulo en el archivo descargado por el mock es una opción de implementación; se recomienda reflejarlo en el nombre mostrado y en la UI, no mutar el bundle.
- Sin URLs firmadas: la descarga usa Blob y `URL.createObjectURL` con `revokeObjectURL` al terminar; `snapshotRef` es opaco.
- Confidencialidad: los candidatos pueden contener fragmentos de código; no registrar el bundle en consola, ni cachearlo en el query cache más tiempo del necesario (usar `gcTime` corto o mutación en lugar de query).
- Polling del 409: reutilizar el patrón de `useAnalysisRunTrace` (`refetchInterval` corto en test) y no reintentar 404/409/`PendingContractError` (patrón `shouldRetryOperationalTrace`).
- Experimento: en la comparación OE2 y en el experimento el estado `FAILED` es terminal y la evidencia sí se descarga.
- En AnalysisRun, `ACTION_REQUIRED` y `OBSOLETE` permiten descarga, no solo `SUCCESS`. No restringir por error.

## Semánticas no definidas
- Ninguna que bloquee. Pendientes de criterio del implementer (no inventan contrato): forma literal de `{kind}` en el nombre de archivo, y fidelidad de bytes en live. Ambas quedan acotadas arriba.
