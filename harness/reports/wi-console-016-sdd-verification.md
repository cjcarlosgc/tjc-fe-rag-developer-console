# WI-CONSOLE-016 — Verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido claude-sonnet-5-5 · esfuerzo low

Work item: WI-CONSOLE-016 «Vista de trace operativo de nueve enlaces» (ST-CONSOLE-018, HU12/HU15, sprint SMART V3, P1, dependsOn WI-CONSOLE-011 W-DONE, externalDependencyGate G-PASSED, W-SELECTED, `contractImpact:false`). Solo verificación; no se editó código, state.json ni work-items.json.

## Veredicto: SUFFICIENT

Los 5 AC y el contrato INTEROP-2.7 §6.16 bastan para implementar con mocks y adapter live en `PendingContractError`. No hay decisiones bloqueantes. Quedan ambigüedades menores (ver sección propia) que se resuelven con la regla «no inventar semántica»; ninguna exige `DECISION_REQUIRED`.

## Decision gate
- Fuente: `spec/contracts/system-contract.md`.
- Decisiones con campo `Blocks` explícito (DEC-GH-001, WEB-AUTH-001, INT-001, AUTH-001, IDEMP-001: NONE; DEC-INF-001, DEC-VAL-001: remoto/empresarial; DEC-ORG-001/002: NONE): ninguna alcanza este WI.
- Decisiones V3 (DEC-EXP-FK-001, EXP-003, FK-001..004, EXP-004, ORG-003): todas APROBADO, sin campo `Blocks`. Relevantes de forma indirecta: `DEC-ORG-003` (Writer; el trace es Reader, no restringe), `DEC-FK-001/004` (varias reglas ACTIVE por target; `functionalRuleIds` es una lista). No bloquean.
- blockingDecisionIds: [].
- decisionGate sugerido: blockingDecisionIds [], nonBlocking [], approvedApplicable [DEC-FK-001, DEC-ORG-003] (informativas; el WI no depende de ellas para el render).
- Contract Sync: los 4 eventos (CS-20260920-003, CS-20260921-001/002/003) tienen disposición NOT_RELEVANT con reporte `harness/reports/wi-console-016-contract-sync-scope-review.md` (aún sin commitear en el árbol). No requiere contract-reviewer.

## Transcripción de INTEROP-2.7 §6.16 (trace)

Estado: «Definido en INTEROP-2.7, pendiente de implementar y verificar» (`WI-CORE-026`, `WI-CORE-027`; Console los consume en WI-CONSOLE-016 y -017). El trace operativo del `AnalysisRun` (HU15) es distinto del `ContextTrace` experimental de §6.7. Core introduce `retrieval_id` y `context_id` y reutiliza el `execution_id` del Sandbox; no crea otros identificadores ni `EV-OE*`.

- `GET /analysis-runs/{analysisRunId}/trace` → `200 AnalysisRunTraceResponse` (Reader).

Mapeo de los nueve enlaces: (1) repositorio/PR/HEAD → `repositoryName`, `pullRequestNumber`, `headSha`; (2) `AnalysisRun` → `analysisRunId`; (3) changeset/targets → `changeset` y `targets[].symbol`; (4) retrieval → `targets[].retrieval`; (5) contexto → `targets[].context`; (6) generación → `targets[].generation`; (7) Sandbox y (8) resultados → `targets[].executions` (`executionId` y `outcome`); (9) publicación → `publication`. Un enlace es `NOT_APPLICABLE` solo cuando el flujo termina legítimamente antes (p. ej. un Run sin targets no tiene retrieval). La traza y la evidencia de un `AnalysisRun` están disponibles en cualquier estado salvo `QUEUED` y `PROCESSING` (`409 EVIDENCE_NOT_FINISHED`), incluido `ACTION_REQUIRED`, donde los enlaces posteriores constan `NOT_APPLICABLE`. «La traza responde ese mismo 409.» La evidencia no incluye chain-of-thought ni credenciales; los fragmentos de código son datos potencialmente confidenciales (§6.7).

```ts
type TraceLinkStatus = 'PRESENT' | 'NOT_APPLICABLE'

interface TraceExecutionResponse {
  executionId: string // identificador del Sandbox
  proposalId: Id
  attempt: number
  executionProfile: string
  outcome: string // clasificación técnica ya expuesta en el Run
}

interface TraceTargetResponse {
  symbol: AnalysisSymbolResponse
  retrieval: { status: TraceLinkStatus; retrievalId: Id | null }
  context: { status: TraceLinkStatus; contextId: Id | null; functionalRuleIds: Id[] }
  generation: { status: TraceLinkStatus; proposalIds: Id[] }
  executions: { status: TraceLinkStatus; items: TraceExecutionResponse[] }
}

interface TracePublicationResponse {
  status: TraceLinkStatus
  checkId: string | null
  companionBranch: string | null
  companionPullRequestUrl: string | null
  sourceHeadSha: string | null
  freshness: 'CURRENT' | 'STALE' | null
}

interface AnalysisRunTraceResponse {
  analysisRunId: Id
  repositoryName: string
  pullRequestNumber: number
  headSha: string
  changeset: { status: TraceLinkStatus; targetCount: number }
  targets: TraceTargetResponse[]
  publication: TracePublicationResponse
}
```

- Roles: Reader (tabla de roles §línea 973 incluye `GET /analysis-runs/{id}/trace` en Reader, por tanto visible para todos los roles; rol insuficiente documentado como `403 PROJECT_ROLE_INSUFFICIENT` solo para el endpoint de evidencia).
- Errores: `409 EVIDENCE_NOT_FINISHED` (QUEUED/PROCESSING) explícito. Para el trace, el 404 no está nombrado: el texto dice «inexistente o no visible responde el 404 de su ruta de estado» (es la redacción de evidencia); el mock del repo usa `ANALYSIS_RUN_NOT_FOUND` para runs inexistentes.
- `functionalRuleIds` está solo en `context` por target (Id[]), sin DTO de regla incluido; resolver detalle de reglas requeriría `GET /projects/{id}/functional-knowledge` (§6.11).

## Qué existe en `app/src` y qué se reutiliza

- `control-plane/AnalysisRunDetailPage.tsx`: ya renderiza cabecera con PR/HEAD (`run.pullRequest`), resumen de estado, símbolos, historial, `PublishSection` y `ContextSection` (reutiliza `RagGraph`; es el Context Explorer experimental, debe permanecer distinto). La sección «Trace operativo» debe agregarse junto a `ContextSection` (así lo dice plan.md de 013). El bloque especulativo de procedencia YA fue retirado por WI-CONSOLE-015 (no hay `context-explorer/speculative/contextProvenance*` ni `useQuery` de procedencia); `control-plane/speculative/priorCoverage` (HU50) sigue y no se toca.
- `control-plane/queries.ts`: `controlPlaneKeys` y hooks `useAnalysisRun`; ahí encaja `useAnalysisRunTrace` y la key `trace(analysisRunId)`. `control-plane/api.ts` usa el patrón mock/live; `control-plane/types.ts` ya define `AnalysisRunStatus` con `QUEUED` y `PROCESSING`.
- `api/dataSource.ts`: `PendingContractError` (patrón idéntico a `retrieval-comparison/api.ts` y `context-explorer/api.ts`: live responde `PendingContractError`). `ProposedCapabilityError` NO aplica (el contrato existe).
- `api/mockBackend.ts`: runs `arun_checkout_pr42` (ACTION_REQUIRED), `_pr45` (SUCCESS, 3 propuestas, 2 targets), `_pr46` (BEHAVIORAL_MISMATCH), `_pr47` (NO_ADDITIONAL_TESTS_REQUIRED), billing `pr17` (OBSOLETE), `_pr17_2` (SUCCESS), `pr20` (BASELINE_FAILED), `pr21` (TECHNICAL_GENERATION_FAILURE), `pr22` (NO_TEST_RELEVANT_CHANGES), `pr48`, más org writer/metrics. Helpers `findVisibleRun`, `notFound(...,'ANALYSIS_RUN_NOT_FOUND')`, `hideRunOfDeletedProject`. No existe mock de trace operativo ni run en QUEUED/PROCESSING: hay que sembrar uno para probar el 409.
- `context-explorer/errors.ts` y `context-explorer/queries.ts`: patrón de 409 «no terminado» (`isContextTraceNotFinished`, `refetchInterval` 900 ms / 10 ms en test) reutilizable; el código es distinto (`EVIDENCE_NOT_FINISHED`), así que va en un módulo propio de la feature, no se mezcla con `CONTEXT_TRACE_NOT_FINISHED`.
- `ui/Feedback.tsx`: `LoadingState`, `ErrorState` (con correlationId), `ErrorNote`. NOT_APPLICABLE debe ser informativo (no `ErrorNote`/`ErrorState`).
- Botón «Copiar»: no existe (`navigator.clipboard`/`Copiar` sin coincidencias); hay que crearlo (componente pequeño accesible en la feature).
- Accesibilidad (`spec/transversal/accessibility/spec.md`): teclado, foco ≥2 px, AA, estado no solo por color, área ≥40×40, `prefers-reduced-motion`, tablas con headers.
- Tests: `control-plane/AnalysisRunDetailPage.test.tsx` (sin cobertura de trace hoy), `control-plane/api.test.ts`.

## Contradicciones spec/código
1. No hay contradicción dura. El adapter live aún no existe; AC4/AC5 ya fijan `PendingContractError` hasta WI-CONSOLE-020 (coherente con §6.16 «pendiente»).
2. `plan.md` 013 y `tasks.md` (T-BACKLOGGED) aún no reflejan que el WI está seleccionado y que 015 retiró la procedencia; actualizar solo con evidencia al cerrar.
3. `AnalysisRunDetailPage` ya muestra repo/PR/HEAD y símbolos desde `GET /analysis-runs/{id}`; el trace repite los enlaces 1-3 desde su propio DTO. No es conflicto: la sección debe pintar lo que entrega el trace, no reutilizar `run`.

## Ambigüedades (diferir a Core o resolver sin inventar)
1. Código del 404: la redacción de §6.16 no nombra el código del trace. Tratar cualquier 404 como «Run no encontrado o sin acceso» genérico; el mock usa `ANALYSIS_RUN_NOT_FOUND` (consistente con `GET /analysis-runs/{id}`). No requiere decisión; confirmar en WI-CONSOLE-020.
2. `outcome` es «clasificación técnica ya expuesta en el Run» sin enum cerrado: renderizar el string tal cual, sin mapear ni derivar CUMPLE/NO CUMPLE (AC2). `executionProfile` igual.
3. `freshness` `CURRENT`/`STALE`/null y `checkId`/`companion*` null: mostrar solo los valores recibidos; null = «sin dato» y no se interpreta como fallo.
4. Cuántas veces se muestra «NOT_APPLICABLE» cuando `targets` es vacío: el enlace «Retrieval… Ejecuciones» no tiene filas; mostrar un estado informativo «Sin targets» + `changeset.targetCount` (no inventar filas).
5. `functionalRuleIds`: el DTO entrega ids, no reglas. Mostrar los ids (rotulados) y, si se quiere enlazar al detalle FK, hacerlo solo cuando la ruta `projects/:projectId/functional-knowledge/:knowledgeId` aplique (requiere `projectId`, disponible en la página). Resolver contenido de reglas queda a Core/futuro; no inventar un endpoint.
6. «Cada enlace muestra PRESENT o NOT_APPLICABLE» vs. enlaces 1-2 que no tienen `status` en el DTO (repositorio/PR/HEAD y AnalysisRun siempre existen): mostrarlos como presentes derivados de la presencia de datos del DTO, o sin badge; elegir una y documentarlo en la prueba (no es decisión de producto). `changeset` y los de target sí tienen `status`.
7. Polling: spec solo dice que la vista maneja el 409 sin tratarlo como fallo (AC3) y exige `role="status"/"alert"` para polling. Frecuencia no fijada; seguir el patrón existente (≈900 ms, 10 ms en test) con parada en cuanto el status deje de ser QUEUED/PROCESSING.

## Riesgos
1. A11y: lista/árbol de nueve enlaces debe ser una estructura semántica (`ol`/`dl`, headings por target), badges con texto (PRESENT/NOT_APPLICABLE) no solo color, botón «Copiar» ≥40×40 con nombre accesible («Copiar retrieval_id») y anuncio de confirmación en `role="status"`; foco visible; sin depender de `RagGraph`. Fallback de `navigator.clipboard` (HTTP/permisos) sin lanzar error.
2. 409 en QUEUED/PROCESSING: tratarlo como estado «El Run aún se procesa», con `role="status"`, sin `ErrorState`; el polling debe cancelarse al desmontar/terminar y no reintentar ante 404/403/5xx; cualquier otro error sí usa `ErrorState` con reintento y correlationId. Distinguir `EVIDENCE_NOT_FINISHED` de `CONTEXT_TRACE_NOT_FINISHED`.
3. Honestidad de mocks: `DEMO · DATOS SIMULADOS` ya se muestra en la cabecera de la página en mock; los ids de trace del mock (`ret_*`, `ctx_*`, `exec_*`) deben ser obviamente demo y no parecer reales. No fabricar veredictos. Live: `PendingContractError` visible como estado «contrato pendiente», no como crash ni como 409.
4. Procedencia por Run con `functionalRuleIds` (dejada por WI-CONSOLE-015): el WI debe mostrar las reglas FK usadas por el contexto de cada target (ids; enlace al detalle de FK si existe en mock). El mock debería referenciar ids existentes (`fk_*` sembrados en WI-015) para que el enlace resuelva; ids ausentes (reglas SUPERSEDED o de otro Project) deben degradar a texto sin romper. No reintroducir el panel especulativo retirado.
5. Colisión con Context Explorer experimental: la sección «Trace operativo» y `ContextSection` conviven; rotular claramente («Contexto recolectado» es experimental, ver §6.7).
6. Datos potencialmente confidenciales: no volcar símbolos/paths en logs ni en `title` excesivos; el trace no incluye código.
7. Datos grandes: muchos targets/ejecuciones → listas largas; usar `<details>` o agrupación por target con encabezados, sin virtualización por ahora (no hay paginación en el DTO).
8. Dependencia del 409 con rol/privilegios: Reader basta; no ocultar la sección por rol (mantener la sección para todos). Un 403 inesperado se muestra como error normal.
9. Tests existentes de `AnalysisRunDetailPage` dependen de labels de `ContextSection`; agregar la sección no debe duplicar `h2` con el mismo nombre.

## Plan de cortes sugerido (implementer, un WI, 2 cortes)

Corte A — datos y adapter (sin UI nueva):
1. Tipos en el módulo de la feature (`control-plane/trace/types.ts` o `control-plane/types.ts`): `TraceLinkStatus`, `TraceExecutionResponse`, `TraceTargetResponse`, `TracePublicationResponse`, `AnalysisRunTraceResponse` (copia fiel del contrato, `// INTEROP-2.7 §6.16`).
2. `control-plane/api.ts`: `getAnalysisRunTrace(id)`: mock → `mockGetAnalysisRunTrace`; live → `Promise.reject(new PendingContractError('el trace operativo de un Analysis Run'))`.
3. `api/mockBackend.ts`: `mockGetAnalysisRunTrace` con `hideRunOfDeletedProject`/404 `ANALYSIS_RUN_NOT_FOUND`, `409 EVIDENCE_NOT_FINISHED` para QUEUED/PROCESSING (sembrar un run `QUEUED` y otro `PROCESSING` en el mock, comprobando que no rompen listados/contadores existentes) y trazas derivadas por status: SUCCESS (varios targets, todo PRESENT, `functionalRuleIds` con ids FK sembrados), BEHAVIORAL_MISMATCH, ACTION_REQUIRED (enlaces posteriores NOT_APPLICABLE), Run sin targets (NO_TEST_RELEVANT_CHANGES: retrieval NOT_APPLICABLE), publicación PRESENT/NOT_APPLICABLE con `freshness`. Ids rotulados demo.
4. `control-plane/queries.ts`: `useAnalysisRunTrace(id)` con `refetchInterval` que sigue mientras el error sea `EVIDENCE_NOT_FINISHED` (900 ms; 10 ms en test) y se detiene con cualquier otro resultado; `retry:false` para 409/404.
5. Helper `isTraceNotFinished(error)` y mensajes de error (módulo propio, no mezclar con context-explorer).
6. Pruebas de api/mocks: shape, 404, 409, live → `PendingContractError`, ids FK existentes.

Corte B — UI:
7. Componente `OperationalTraceSection` (en `control-plane/`): estados loading (`role="status"`), 409 (status informativo + polling), 404/otros (`ErrorState` con reintento), contract pending (mensaje del adapter), éxito.
8. Render de los nueve enlaces en orden: repositorio/PR/HEAD → AnalysisRun → Cambios (`changeset.status`, `targetCount`) → por target: símbolo, Retrieval (`retrieval_id`), Contexto (`context_id` + `functionalRuleIds`), Generación (`proposalIds`), Ejecuciones (`execution_id`, intento, perfil, `outcome`) → Publicación. Badges texto PRESENT/NOT_APPLICABLE; NOT_APPLICABLE «No aplica: el flujo terminó antes de este paso» (estilo informativo).
9. Botón «Copiar» accesible (componente reutilizable), con fallback y anuncio.
10. Montar la sección en `AnalysisRunDetailPage` junto a `ContextSection`; CSS en `styles.css` reutilizando tokens (foco, tamaño 40 px, sin dependencia de color).
11. Pruebas: orden de enlaces, PRESENT/NOT_APPLICABLE, varios targets, QUEUED/PROCESSING (409 sin ErrorState; el polling llega a éxito), 404, live pending, copiar (éxito y fallo), ids con nombres del DTO, sin veredictos CUMPLE/NO CUMPLE, roles Reader/Writer/Admin (misma vista), a11y (roles, nombres accesibles, headings), DEMO stamp, `functionalRuleIds` con enlace y con id ausente.
12. Gate: lint, test, build, `node harness/validate-harness.mjs`, validadores SDD, revisión `ux-reviewer` (obligatoria, UI), luego revisión humana. Commit con `Refs: HU12, HU15`. Actualizar `tasks.md` (ST-CONSOLE-018) solo con evidencia.

## Entregable para el Leader
- status: SUFFICIENT
- blockers: ninguno
- filesAffected: `app/src/control-plane/{types.ts|trace/*, api.ts, queries.ts, errors.ts (o módulo propio), AnalysisRunDetailPage.tsx, *.test.*}`, `app/src/api/mockBackend.ts`, `app/src/styles.css`, componente «Copiar», `spec/features/013-pr-driven-control-plane/tasks.md` (ST-CONSOLE-018, solo con evidencia).
- recommendedNextStep: Leader registra decisionGate (blocking []), delega a `implementer` por cortes A y B, luego `ux-reviewer`, validadores y revisión humana. No requiere contract-reviewer.
