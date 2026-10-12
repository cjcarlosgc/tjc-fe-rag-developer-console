Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-032 — verificación SDD

**Veredicto: SUFICIENTE** (sin `DECISION_REQUIRED`; una observación de redacción en README, ver F6).

## (a) Decisiones con `Blocks`

Revisadas las DEC de `spec/contracts/system-contract.md`. Solo `DEC-VAL-001` (PENDING, bloquea ingestión/despliegue con código empresarial) y `DEC-VAL-002` (PROPOSED, bloquea únicamente el WI de código que alinee OC08 en Core/Sandbox) están abiertas; ninguna alcanza una UI de publicación en Console. El resto tiene `Blocks: NONE` o está resuelto. `decisionGate`: `blockingDecisionIds: []`, `nonBlockingDecisionIds: ["DEC-VAL-001","DEC-VAL-002"]` (registrar en el WI al pasar a SPEC_VERIFIED). Ninguna constitución ni la feature 013 añade decisiones pendientes para HU12/HU16.

## (b) Contrato (INTEROP §5 y §6.12)

- `AsyncAccepted = { status: 'PENDING', pollAfterMs }`; `TestPublicationAcceptedResponse` añade `publicationId` y `analysisRunId`. Coincide con `types.ts`.
- `TestPublicationResponse`: `id, analysisRunId, sourceHeadSha, status, branchName, companionPullRequestNumber, companionPullRequestUrl, failureMessage, createdAt, updatedAt`; estados `PENDING|PUBLISHING|PUBLISHED|STALE|FAILED|CLOSED`. Coincide con `types.ts` (`TestPublicationStatus`).
- Terminales: `PUBLISHED`, `FAILED`, `STALE`, `CLOSED` (§5: los terminales permanecen consultables). El contrato no enumera formalmente los terminales de `TestPublication`, pero el alcance aprobado y el texto de §6.12 son coherentes.
- Errores de dominio (nota de implementación §6.12): `TEST_PUBLICATION_NOT_FOUND` 404, `TEST_PUBLICATION_INVALID_RUN_STATUS` 409, `TEST_PUBLICATION_PROPOSAL_NOT_AVAILABLE` 422. Nota: el hallazgo E2E del alcance cita 409 con `...PROPOSAL_NOT_AVAILABLE`; el contrato dice 422. La UI debe tratar el `code` y no depender del status HTTP.
- STALE solo se activa en la `TestPublication` (freshness al ejecutar el job); no hay barrido de propuestas.
- No hace falta cambio de DTO, ruta ni contrato: `contractImpact:false`, `publishesContract:false` es correcto.

## (c) Estado del código

- `AnalysisRunDetailPage.tsx` `PublishSection`: ya guarda `publicationId` (useState) y hace un `useQuery` de `getTestPublication` **sin** `refetchInterval` ni `pollAfterMs`; el aviso «Companion PR publicado» solo se muestra si hay propuestas `PUBLISHED` Y `publicationQuery.data`, no muestra `companionPullRequestUrl` ni `failureMessage`, ni estados `PENDING/PUBLISHING/FAILED/STALE/CLOSED`; el botón solo se deshabilita durante la mutación (`isPending`), no durante la publicación; usa `disabled` y no `aria-disabled`; no hay regiones `role="status"`; el `onSuccess` de la mutación invalida propuestas/Run de inmediato (antes de terminal).
- `queries.ts`: `usePublishTests` invalida `proposals` y `run` en `onSuccess` del POST; `useTestProposals` sin cambios necesarios. Ya existe el patrón `refetchInterval` con intervalo corto en `MODE === 'test'`.
- `api.ts`: `createTestPublication`/`getTestPublication` existen con mock/live; sin cambios.
- `mockBackend.ts` ~2259-2281: la publicación se crea ya `PUBLISHED`, marca propuestas `PUBLISHED` al instante, `pollAfterMs: 300`; `mockGetTestPublication` devuelve la fila tal cual. Errores mock usan códigos propios (`RUN_NOT_PUBLISHABLE`, `PROPOSAL_NOT_AVAILABLE`) distintos de los del contrato. No hay ruta de listado.
- Pruebas existentes: `api.test.ts` (mock y live) y `operationalTrace.test.ts`/`OperationalTraceSection.test.tsx` llaman `mockCreateTestPublication` y esperan `PUBLISHED`; hay que mantener compatibilidad (p. ej. que la publicación mock llegue a `PUBLISHED` tras N lecturas o tiempo, sin romper `api.test.ts:281,400`, que consultan inmediatamente). No existe prueba de componente de `PublishSection`.
- `app/.env.example` ya define `VITE_GITHUB_INTEGRATION_API_URL=http://localhost:3002`. No hay `app/README.md`; el README está en la raíz y no menciona esa variable.

## (d) Run con propuestas `PUBLISHED` al montar

El contrato no lista publicaciones por Run ni expone `publicationId` en `GeneratedTestProposalResponse`. Por tanto, tras recarga no existe forma de recuperar `publicationId`. Comportamiento requerido: si hay propuestas `PUBLISHED` y no hay `publicationId` en estado, mostrar solo «Propuestas ya publicadas» sin enlace, rama ni inventar rutas ni heurísticas; no ofrecer botón para esas propuestas. Persistir `publicationId` en `sessionStorage`/`localStorage` es opcional y solo conveniencia por viewer (con try/catch); no lo exijo y no debe presentarse como fuente de verdad. Si hay propuestas `AVAILABLE` y `PUBLISHED` mezcladas, el botón puede ofrecerse solo para las `AVAILABLE`.

## (e) Riesgos

1. HU16 vs HU12: la publicación es HU16; el detalle del Run es HU12. WI declara ambas; mantener aprobación humana explícita (el botón no hace merge). Backlog las lista como H-BACKLOGGED: la trazabilidad es por `storyIds` del WI, no por casillas.
2. Polling: `useQuery` con `refetchInterval: (q) => terminal ? false : (pollAfterMs ?? fallback)`; guardar `pollAfterMs` del 202 (p. ej. en estado) con fallback acotado (p. ej. 2000 ms); intervalo corto en `MODE === 'test'`. TanStack Query limpia el intervalo al desmontar; no usar `setInterval` manual. Ante error de red/5xx, no polling infinito: reintentos finitos y mensaje con reintento manual.
3. Refresco de `proposals` y Run al llegar a terminal, no en el `onSuccess` del POST (cambiar `usePublishTests` o añadir efecto sobre estado terminal, una sola vez).
4. 409/422 de dominio: `TEST_PUBLICATION_INVALID_RUN_STATUS` (Run ya no SUCCESS/vigente) y `TEST_PUBLICATION_PROPOSAL_NOT_AVAILABLE`: mostrar `role="alert"` con mensaje y refrescar propuestas/Run; no reintentar. Un 422/409 no es una publicación `FAILED`.
5. Run `STALE`/obsoleto: `PublishSection` solo se monta para `SUCCESS` y `BEHAVIORAL_MISMATCH`; un `STALE` de la publicación debe mostrarse como estado terminal sin éxito («el HEAD cambió; el Run vigente es otro»), sin reintento automático (fuera de alcance). `CLOSED`: companion PR cerrado, no se reabre.
6. `companionPullRequestUrl`: validar protocolo http/https antes de renderizar enlace (con `rel="noopener noreferrer"`); si no es válido, mostrar texto sin enlace.
7. Mock honesto: el escenario `FAILED`/`STALE` y la transición `PENDING→PUBLISHING→PUBLISHED` deben rotularse «DEMO · DATOS SIMULADOS» y ser deterministas (p. ej. por conteo de lecturas o propuesta fixture dedicada), sin tocar las fixtures que `api.test.ts`/trace tests usan.
8. Accesibilidad: un `role="status"` para progreso y un `role="alert"` para fallo, siempre montados o con cambio de contenido anunciable; `aria-disabled="true"` en el botón con foco conservado, ignorar clics (`onClick` guard) en vez de `disabled`.

## F6. Observación sobre `VITE_GITHUB_INTEGRATION_API_URL`

`POST /analysis-runs/{id}/test-publications` y `GET /test-publications/{id}` son rutas de Core (`VITE_CORE_API_URL` vía `apiRequest`); Console no llama a GitHub Integration para esto (`githubIntegrationApi.ts` cubre las rutas de capacidades GitHub directas). La publicación live depende de que **Core** apunte al GitHub Integration real (configuración de Core, fuera de este repo). El README/`.env.example` debe documentar ambas: `VITE_CORE_API_URL` para la publicación y `VITE_GITHUB_INTEGRATION_API_URL` real para las pantallas de integración, y aclarar que el hallazgo E2E depende además de la configuración de Core; sin secretos. Con esa redacción el punto 6 aprobado se cumple sin cambio de alcance.

## (f) Corte propuesto

**Corte A — datos/polling/mock (sin UI nueva):**
- `queries.ts`: hook `usePublication(publicationId, pollAfterMs)` con `refetchInterval` por estado terminal y fallback; export de `isTerminalPublicationStatus`; `usePublishTests` deja de invalidar en el POST (la invalidación pasa al terminal).
- `mockBackend.ts`: publicación `PENDING` → `PUBLISHING` → `PUBLISHED` observable; propuestas pasan a `PUBLISHED` solo al terminal exitoso; escenario `FAILED`/`STALE` rotulado (fixture dedicada).
- Pruebas: `api.test.ts` y trace tests actualizados; pruebas del hook y del mock (transiciones, terminal, error).

**Corte B — UI/README:**
- `PublishSection`: `publicationId` + `pollAfterMs`, estado de progreso `role="status"`, fallo `role="alert"`, enlace http/https, rama, `failureMessage`, botón `aria-disabled` con «Publicando…», sin duplicados, caso «ya publicado» sin enlace (d), rótulo DEMO en mock.
- README raíz y `app/.env.example` (F6).
- Revisión obligatoria de `ux-reviewer` (cambio visible).

## Entregable estructurado

- `status`: SUFICIENTE
- `blockers`: ninguno
- `filesAffected`: `app/src/control-plane/AnalysisRunDetailPage.tsx`, `app/src/control-plane/queries.ts`, `app/src/api/mockBackend.ts`, `app/src/control-plane/api.test.ts` (compat.), tests nuevos de `PublishSection`, `README.md`, `app/.env.example`, `CHANGELOG.md`, `spec/features/013-pr-driven-control-plane/tasks.md` (ST-CONSOLE-034)
- `evidence`: INTEROP §5 y §6.12; `types.ts` 187-210; `AnalysisRunDetailPage.tsx` 38-105; `queries.ts` 171-180; `mockBackend.ts` 2259-2299
- `recommendedNextStep`: pasar el WI a `W-SPEC_VERIFIED` registrando `decisionGate`; implementar A y luego B; no requiere `contract-reviewer` (sin cambio de contrato); UX review obligatorio tras B.
