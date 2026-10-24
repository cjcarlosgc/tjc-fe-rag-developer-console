# WI-CONSOLE-048 — verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Solo lectura; no se ejecutaron pruebas. Rutas relativas al repo.

## 1. pollAfterMs en el GET del Run
- `AnalysisRunDetailResponse` (`app/src/control-plane/types.ts:143`) y el contrato (§6.10) no declaran `pollAfterMs`. En `types.ts` solo aparece en `TestPublicationAcceptedResponse` (:193) y en el contrato en el 202 de creación (`spec/contracts/interoperability-contract.md:117,122`); en :117 solo el GET de Sandbox puede repetirlo.
- Implicación: no hay fuente real para el Run. Diseño: parámetro opcional del hook (`useAnalysisRun(id, { pollAfterMs? })`) o, más simple, sin parámetro; usar `clampPollMs(pollAfterMs, DEFAULT_POLL_MS)` (`app/src/api/polling.ts`, 250 ms–30 s, default 900 ms). Sin él, el default 900 ms. Documentar que "respetar pollAfterMs" es solo capacidad futura, sin DTO nuevo.

## 2. Estados
- Union de §6.10 (`interoperability-contract.md:762-773`): en curso solo `QUEUED`/`PROCESSING` (§6.16 :1235, `409 EVIDENCE_NOT_FINISHED`; `ExperimentPage.tsx:80`; `AnalysisRunDetailPage.tsx:469`). `ACTION_REQUIRED` y `OBSOLETE` no son "en curso" para el polling.
- Pero `ACTION_REQUIRED` se reanuda tras responder (§6.9, :954: continuación sobre el mismo Run). Hoy esa reanudación se refresca por invalidación de la mutación de respuesta y por el socket (§6.6, :471 emite en `ACTION_REQUIRED`/continuación). Tras la invalidación el status vuelve a `PROCESSING` y el `refetchInterval` (función sobre `query.state.data`) se reanuda solo. `OBSOLETE` es definitivo (un HEAD nuevo crea otro Run, :845).

## 3. Consumidores de useAnalysisRun
`queries.ts:202`; usado en `AnalysisRunDetailPage.tsx:267`, `ExperimentPage.tsx:40`, `RunComparisonPage.tsx:83`, `RetrievalComparisonPage.tsx:57`. Polling por defecto afectaría a las cuatro (también a quien solo lee el Run una vez y a `ExperimentPage.targets.test.tsx`, que lo mockea). Recomendación: opt-in (`{ poll: true }` o `refetchInterval` por opción) activado solo en `AnalysisRunDetailPage` (alcance aprobado), o por defecto solo si se acepta el efecto en las otras tres (el mensaje "Espera a que termine" de ExperimentPage mejoraría). Decisión del implementer, documentada; ambas caben en el alcance.

## 4. DEC, contrato, UX
- No hay DEC con `Blocks` no-NONE que alcance este WI (`grep Blocks` en `spec/`; las de `system-contract.md` son `Blocks: NONE`). `decisionGate: []`.
- `contractImpact=false` correcto: sin DTO, ruta ni socket. No requiere contract-reviewer.
- `ux-reviewer`: no cambia markup ni copy; lo visible (estado) se actualiza solo. Omitirlo con justificación es razonable.

## 5. Riesgos
- Test: `pollDelayMs` devuelve 10 ms en MODE test; `AnalysisRunDetailPage.test.tsx` y `RunsPage.test.tsx` usan Runs en QUEUED/PROCESSING: con polling activo harán refetch cada 10 ms, pueden agotar mocks de `fetch` de un solo uso, producir `act` warnings o cuentas de llamadas inestables. Revisar esos tests y usar fake timers / mocks persistentes. Para probar el acotado real usar `clampPollMs`; en test el intervalo debe ser determinista.
- Realtime: `useAnalysisRunRealtime` solo invalida (`useAnalysisRunRealtime.ts:20-23`); react-query deduplica fetches en vuelo, y tras cada fetch el intervalo se reprograma, sin duplicados relevantes. `useRefreshOnPublicationTerminal` (`queries.ts:97`) invalida una vez: compatible.
- Error: la función `refetchInterval` debe devolver `false` si `query.state.error` (spec de la tarea: parar ante error); si no, hay riesgo de bucle contra un backend caído.
- Mock: `isMockDataSource` / `mockBackend` pueden dejar Runs en QUEUED/PROCESSING y generar polling inútil o cambios de estado inesperados; desactivar o confirmar en mock. El realtime ya hace no-op en mock.
- Pestaña oculta: `refetchIntervalInBackground` por defecto es false (se pausa oculta); mantenerlo y confirmar que el focus refetch del QueryClient cubre el regreso.
- Limpieza: al desmontar/cambiar Run/cerrar sesión, react-query destruye el observer; la key incluye `analysisRunId`. Probar con fake timers que no queden timers.

## Veredicto
SUFFICIENT_WITH_NOTES. Notas: (1) `pollAfterMs` no existe en el GET del Run; parámetro opcional con default `DEFAULT_POLL_MS`; (2) elegir opt-in vs por defecto y documentarlo; (3) cortar polling ante error; (4) revisar tests existentes con Runs en curso por el modo test de 10 ms.
