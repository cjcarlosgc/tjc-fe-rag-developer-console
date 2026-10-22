Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-044 — verificación de suficiencia SDD

Base: HEAD 894c5ae, árbol limpio. Solo análisis; no se editó código ni `harness/*.json`.

## 1. Veredicto

**SUFICIENTE con salvedades.** Alcance (a)-(d) aprobado literalmente en `harness/reports/wi-console-044-scope-approval.md`, contrato espejado (INTEROP-2.18 §6.6, esquema `realtime-events.schema.json`, ejemplos `realtime-*`, tipos generados `ExperimentStatusResponse` con `targetId`) y DEC-RT-001 APPROVED en Core. No hay decisión DEC con Blocks sobre el WI que lo frene (solo se cita DEC-RT-001/DEC-ERR-001 desde el contrato espejado).

Salvedades (ver §4): el alcance no dice qué pantallas consumen el realtime ni si el cliente aplica throttle propio. Se resuelven con la lectura mínima propuesta; si el implementer la excede, marcar `DECISION_REQUIRED` y aparcar.

## 2. Estado real del código

- `app/src/api/socket.ts`: `io(baseUrl, { reconnection: true, auth: cb })` con `callback(token ? { token } : {})`. Ya existen `handleConnectError` (backoff `retryable`, `INVALID_ACCESS_TOKEN` y `GITHUB_IDENTITY_REQUIRED` -> `resetSocket` + `notifyAuthError`), `resetSocket`, `renewSocketAuth` y `subscribeProjectVersionUpdates`. Falta: no abrir sin sesión, `AUTH_REQUIRED`, ack, `analysis-run`/`experiment`.
- Comentario obsoleto: sigue vigente, en **`socket.ts:75`** (dentro de `getSocket`; no cambió de línea): «sin token el handshake se acepta y cada `subscribe:*` exige credencial». Es falso desde INTEROP-2.18 (el handshake sin token se rechaza con `AUTH_REQUIRED`). Además el JSDoc de línea 4 cita «INTEROP-2.4 §6.6» y las líneas 28-33 deben reflejar `AUTH_REQUIRED`; la lista de `HandshakeError` ya está bien.
- `subscribeProjectVersionUpdates` **no tiene consumidores** fuera de `socket.test.ts` (es API sin uso en pantallas). `project-version:update` está reservado en Core (ningún flujo lo emite).
- No hay hooks de realtime. El polling vive en `ExperimentPage.tsx` (`useQuery` con `refetchInterval`, `getExperiment`), `control-plane/queries.ts` (`useAnalysisRun`: sin polling) y `RunComparisonPage.tsx`.
- `ExperimentStatusResponse` (`app/src/experiments/liveMapping.ts:17`) está **desalineada**: declara `analysisRunId` y `symbol` (no llegan en el GET real) y no declara `targetId`. El tipo generado (`contracts/generated/contract-types.ts:194`) ya tiene la forma real (`targetId`; `model/budget/executionProfile/runnerHint/randomizationSeed` requeridos y nullables). Consumidores de `status.analysisRunId`/`status.symbol`: `toExperimentOperation`/`toExperimentConfiguration` no los leen (solo `ExperimentResultsResponse` los lleva, sin cambio). `liveMapping.test.ts` construye fixtures con esos campos (líneas 4, 120, 260, 276) y hay un `as unknown as` en 252: hay que ajustarlos.
- `history?` pertenece a `AnalysisRunDetailResponse` local (`control-plane/types.ts`, usado por `AnalysisRunDetailPage.tsx:391`); ya es opcional. El tipo generado no lo declara. No requiere cambio; solo no romperlo.
- `AuthProvider` ya llama `resetSocket()`/`renewSocketAuth()` en cambios de sesión y `setAuthTokenProvider(() => session?.accessToken ?? null)`; `getAuthToken()` en `client.ts:57`.

## 3. Plan de corte archivo por archivo

1. **`app/src/api/socket.ts`**
   - `getSocket(): Socket | null`: si `getAuthToken()` es vacío/`null` devuelve `null` y no llama a `io()` (cumple «no abrir el socket sin sesión»). `auth` siempre `{ token }` con token no vacío; si en una reconexión el token ya no existe, no conectar (`callback` no debe entregar `{}`; preferible `autoConnect: false` + `connect()` explícito tras verificar token, o cancelar vía `resetSocket`).
   - `subscribeById` devuelve unsubscribe no-op cuando no hay socket. Emitir con ack: `client.emit(ev, payload, (ack: SubscribeAck) => ...)`; tipar con `SubscribeAck` de `contracts/generated/contract-types.ts`. Manejar los tres resultados: suscrito; `GITHUB_VERIFICATION_UNAVAILABLE` retryable (reintento acotado con el mismo backoff, no bloquea: sigue HTTP); denegado/inexistente sin distinguir (no reintentar, sigue polling).
   - Añadir `subscribeAnalysisRunUpdates(id, onUpdate)` (`subscribe:analysis-run` `{analysisRunId}`, `analysis-run:update`) y `subscribeExperimentUpdates(id, onUpdate)` (`subscribe:experiment` `{experimentId}`, `experiment:update`) reutilizando `subscribeById`; payloads tipados con `AnalysisRunDetailResponse`/`ExperimentStatusResponse` (generados). Parametrizar el filtro `update.id === id`.
   - Añadir un callback `onReconnect` (o reutilizar el evento `connect` ya re-emitiendo `subscribe`): tras el primer `connect` de cada suscripción, cada `connect` posterior invoca `onReconcile()` para que el consumidor haga GET (sin replay, §6.6 «Garantías»).
   - `handleConnectError`: añadir `AUTH_REQUIRED` -> no retryable; `resetSocket()` y `notifyAuthError({status:401, code:'AUTH_REQUIRED'})` solo si procede (`AUTH_REQUIRED` ya está en `SESSION_ENDING_401_CODES`, `client.ts:48`, por lo que `notifyAuthError` lo trata como fin de sesión; ver D3). Códigos desconocidos/genéricos §4.1 (`UNAUTHORIZED`, etc.) y `code` abierto: tolerar sin romper (no resetear la sesión; el handshake no usa genéricos pero el code es string abierto). Mantener `retryable` -> backoff.
   - Corregir el comentario de `getSocket` (línea 75) y el JSDoc de línea 4 (INTEROP-2.18).
2. **Hooks de consumo** (nuevo `app/src/api/useRealtime.ts` o junto a `control-plane/queries.ts` y `experiments/`): `useExperimentRealtime(experimentId)` y `useAnalysisRunRealtime(analysisRunId)`. En `useEffect` con dependencia en `useAuth().status`/token (para suscribir cuando la sesión aparezca y limpiar al cerrarla), suscriben y, ante cada `*:update` o reconexión, hacen `queryClient.invalidateQueries({ queryKey: ['experiments', id] })` / `controlPlaneKeys.run(id)`. Recomendado invalidar (GET como fuente de verdad) en lugar de escribir el DTO en cache: `ExperimentOperation` exige `/results` y `targetLabel`, y el orden de eventos no está garantizado. Sin `enabled` en mock: `getDataSource()==='mock'` => el hook no hace nada (no hay Core ni socket; evita abrir socket a `baseUrl` en demo).
3. **`ExperimentPage.tsx`**: invocar `useExperimentRealtime(experimentId)` junto a `experimentQuery`; **no tocar** `refetchInterval` (el polling queda como base; no eliminarlo ni relajarlo). **`useAnalysisRun`/`AnalysisRunDetailPage`**: invocar `useAnalysisRunRealtime(analysisRunId)` (ver §4-D2).
4. **`app/src/experiments/liveMapping.ts`**: `ExperimentStatusResponse` -> eliminar `analysisRunId`/`symbol`, añadir `targetId: string`; documentar «analysisRunId y symbol no llegan, pendientes de HU17». Preferible reexportar/alias del tipo generado si compatible (los campos `model/budget/...` locales son opcionales; mantener tolerancia a ausencia, §6.5.1). Ajustar `liveMapping.test.ts` (fixtures, y el cast de la línea 252). `ExperimentResultsResponse` no cambia.
5. **Mocks** (`api/mockBackend.ts`): no deben requerir cambio; no se debe tocar la forma del mock (es `ExperimentOperation`, otra capa). Si el tipo local se reduce y algún mock lo usa como `ExperimentStatusResponse`, ajustar mínimo (no se halló uso).
6. **Pruebas** (`socket.test.ts` ya mockea `socket.io-client` con `handlers`/`emitted` y `trigger`): ampliar (ver §5). Tests de los hooks con QueryClient de prueba y socket mock.
7. Documentación: entrada en `CHANGELOG.md`; informe de implementación/cierre del WI citando `CS-CORE-20261021-001` y verificando cada ítem de su `requiredAction` (recomendación del reviewer de WI-043); decidir en el cierre el estado de Contract Sync según la regla del workflow (la incompatibilidad conocida con Core 5c82853c termina al cerrar este WI).

## 4. uiImpact y decisiones no cubiertas

**uiImpact:** *no* para el cambio mínimo (socket + hooks que invalidan queries + tipos): no cambia markup, texto, estilos ni mocks; las pantallas se actualizan con los mismos datos. `ux-reviewer` no se requiere en ese caso. Cambia a *sí* si el implementer añade indicadores visibles (estado «en vivo/conectado»), cambios de texto o de cadencia perceptible, o quita/relaja polling; eso excede el alcance aprobado.

DECISION_REQUIRED / aclaraciones (registrar y no inventar aprobación):

- **D1 (menor, resoluble en el corte):** throttle de 1500 ms es una garantía del servidor (§6.6 «Cuándo se emite»); el cliente no necesita throttle propio. El criterio «pruebas de throttle» debe leerse como: el cliente tolera ráfagas (varios `experiment:update` de progreso) sin romper y converge con el GET. Si el usuario quiere un coalescing de cliente (p. ej. invalidar como máximo cada 1500 ms), es una decisión de alcance: proponer y aparcar. Recomendación: implementar invalidación con coalescing sencillo y reloj inyectable solo si el reviewer lo pide; por defecto, sin throttle de cliente.
- **D2:** el alcance aprobado no nombra pantallas consumidoras. Lectura mínima propuesta: `ExperimentPage` (donde ya hay polling) y `AnalysisRunDetailPage` (hoy sin polling: añadir invalidación por evento sería una mejora visible de comportamiento). Si se quiere evitar cualquier cambio visible, limitar el WI a `socket.ts` + hooks + `ExperimentPage`, y dejar `AnalysisRunDetailPage` aparcada. Requiere confirmación del usuario si se incluye.
- **D3:** si `AUTH_REQUIRED` debe cerrar sesión (`notifyAuthError`) o solo degradar a HTTP. Con sesión normal no debería ocurrir; propuesta: tratarlo como no retryable, `resetSocket()`, sin forzar logout (el token ausente indica estado de sesión ya gestionado por `AuthProvider`). Ojo: `notifyAuthError({status:401, code:'AUTH_REQUIRED'})` sí cierra sesión según `client.ts:48`; decidir si se invoca.
- **D4:** `project-version` queda con su API actual sin consumidores; no se amplía (§6.6: reservado).
- Sin DTO nuevo: la alineación de `ExperimentStatusResponse` es corrección de tipo local a la forma ya contractual; no es cambio de DTO. Si el implementer descubre que algún consumidor depende de `analysisRunId`/`symbol` de status (no se halló), sería `DECISION_REQUIRED` (HU17 pendiente).
- No reinterpretar la autoridad MAINTAINER/ADMIN sobre Functional Knowledge: no hay contacto con ese flujo.

## 5. Riesgos y pruebas

Riesgos:
- Race sesión/socket: suscribir antes de que exista token (hook debe depender del estado de auth); logout que deja listeners (usar cleanup + `resetSocket`).
- Doble suscripción en React StrictMode (efecto montado dos veces): el unsubscribe debe ser idempotente y no emitir `unsubscribe` si no conectado (ya es así).
- Reconexión: `connect` repetido re-emite `subscribe` (ya) y debe disparar GET (nuevo); evitar tormenta de GET con coalescing.
- Backoff `retryable` con `resetSocket` tras `RETRY_MAX_ATTEMPTS` deja la sesión sin socket (HTTP sigue); aceptable, documentarlo.
- Fuga del token: nunca loguear; nunca en query (`io` options: no `query`).
- Mock/demo: `baseUrl` puede ser inválido (`VITE_CORE_API_URL` inválida es tema aparte): no abrir socket con `VITE_DATA_SOURCE=mock`.

Pruebas vitest (`vi.mock('socket.io-client')`, `vi.useFakeTimers()`; reloj inyectable solo si se añade coalescing):
- handshake sin sesión: `io` no se llama y el unsubscribe es no-op; con sesión: opciones `auth` entrega `{ token }` no vacío y no hay `query`; tras logout/`resetSocket` no se reconecta.
- `connect_error` por código: `AUTH_REQUIRED`, `INVALID_ACCESS_TOKEN`, `GITHUB_IDENTITY_REQUIRED` (no retryable; sin `connect()`), `IDENTITY_UNAVAILABLE` (retryable; backoff con fake timers, agotado tras 5), código genérico §4.1 y desconocido (tolerados sin cierre de sesión), error de transporte sin `data`.
- subscribe/unsubscribe de `analysis-run` y `experiment`: emisión con payload correcto, callback de `SubscribeAck` en los tres resultados (`retryable` acotado), filtrado por id, eventos `*:update` entregados.
- reconciliación: segundo `connect` re-emite `subscribe` e invoca el reconcile/invalidate; ráfaga de updates de progreso no rompe y converge con GET.
- hooks: invalidan la query correcta; no suscriben en mock ni sin sesión; polling de `ExperimentPage` sigue intacto.
- `liveMapping.test.ts` con la forma real (`targetId`, sin `analysisRunId`/`symbol`).
- Gates: lint, tsc, test, build, format:check, contracts:check (pnpm, Node 22).

## 6. Resumen de estado de los puntos pedidos

- Comentario de `socket.ts`: obsoleto, vigente en línea 75.
- `ExperimentStatusResponse` local: desalineada (`analysisRunId`/`symbol` declarados, falta `targetId`); el tipo generado ya es correcto.
- Sin consumidores actuales del socket en pantallas; no hay hooks de AnalysisRun/experiment para realtime todavía.

## Resolución del leader sobre D1–D4 (dentro del alcance aprobado, sin inventar aprobación)

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

- **D1 (throttle):** el alcance aprobado pide «throttle de progreso 1500 ms» y una prueba de throttle con reloj controlado: se implementa en el cliente un coalescing no visible de las actualizaciones de progreso (máx. una cada 1500 ms; estados terminales sin demora), con fake timers. No cambia DTO ni UI.
- **D2 (pantallas):** el consumo en pantalla se limita a `ExperimentPage` mediante un hook que solo invalida la consulta del GET (el polling queda intacto). Enganchar `AnalysisRunDetailPage` cambiaría el comportamiento visible (hoy sin polling) y NO está aprobado: se expone `subscribeAnalysisRunUpdates` (cliente) sin consumidor de pantalla y queda como **DECISION_REQUIRED para el usuario** (no bloquea el cierre de este WI).
- **D3 (`AUTH_REQUIRED`):** se trata igual que `INVALID_ACCESS_TOKEN`/`GITHUB_IDENTITY_REQUIRED` (mismo manejo de sesión que HTTP, no retryable), coherente con `SESSION_ENDING_401_CODES`.
- **D4 (`project-version`):** sin cambio.
- `uiImpact=false` (sin texto, indicadores ni componentes visibles nuevos); `ux-reviewer` no aplica. Si el implementer añadiera UI visible, se vuelve a clasificar.
