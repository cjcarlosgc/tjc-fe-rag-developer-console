Modelo: implementer-high · configurado claude-haiku-5-5 · atendido unknown · esfuerzo high

# WI-CONSOLE-044 — implementación de tiempo real (INTEROP-2.18 §6.6)

**Estado:** implementado y verificado localmente. **No hay commit ni push** (instrucción expresa). Pendiente: revisión independiente por `reviewer` (máximo 2 ciclos) y decisiones del usuario (D2 abajo). No se marca `W-DONE` ni se edita `harness/work-items.json` ni `harness/state.json`.
**Base:** HEAD `894c5ae`, rama `feature/jean`. Alcance: `harness/reports/wi-console-044-scope-approval.md`; plan y resolución D1–D4: `harness/reports/wi-console-044-sdd-verification.md`.
**uiImpact:** no. Sin texto nuevo, markup, estilos, indicadores de conexión ni cambios de cadencia visibles. `ux-reviewer` no aplica.

## 1. Archivos tocados

| Archivo | Cambio |
|---|---|
| `app/src/api/socket.ts` | Reescrito el núcleo de tiempo real: handshake, `connect_error`, `subscribe`/ack, reconciliación, throttle de progreso y limpieza. |
| `app/src/api/socket.test.ts` | Ampliado (39 casos). Mock de `socket.io-client` con captura de acknowledgments. |
| `app/src/experiments/useExperimentRealtime.ts` | **Nuevo.** Hook que invalida `['experiments', id]` en avisos y reconexiones. |
| `app/src/experiments/useExperimentRealtime.test.tsx` | **Nuevo.** 9 casos del hook, incluido polling intacto con fake timers. |
| `app/src/experiments/ExperimentPage.tsx` | Solo 3 líneas: import y llamada `useExperimentRealtime(experimentId)`. `refetchInterval` sin cambios. |
| `app/src/experiments/liveMapping.ts` | `ExperimentStatusResponse` local: sin `analysisRunId` ni `symbol`; con `targetId`. |
| `app/src/experiments/liveMapping.test.ts` | Fixture `status` alineado a la forma real. |
| `app/src/contracts/contract-validator.ts`, `app/src/api/client.ts`, `app/src/api/errorEnvelope.contract.test.ts` | Solo comentarios: `INTEROP-2.17` → `INTEROP-2.18` (versión vigente). |
| `CHANGELOG.md` | Entrada `WI-CONSOLE-044` en `[Unreleased]`. |
| `harness/reports/wi-console-044-implementation.md` | Este informe. |

No se tocó `spec/contracts/`, `harness/work-items.json`, `harness/state.json`, `harness/contract-sync/`, ni `app/src/api/mockBackend.ts` (sin cambios de mock).

## 2. Decisiones de implementación

- **Handshake (a).** `getSocket()` devuelve `null` sin llamar a `io()` si `getAuthToken()` está vacío. El `auth` es una función que envía solo `{ token }` no vacío. Si el token desaparece en una reconexión, el socket se descarta (`resetSocket` o `disconnect`) y no se envía `{}`. Nunca se usa `query`.
- **`connect_error` (a).** `retryable` del propio rechazo manda. Si falta, solo `IDENTITY_UNAVAILABLE` se considera reintentable (fallback). `AUTH_REQUIRED`, `INVALID_ACCESS_TOKEN` y `GITHUB_IDENTITY_REQUIRED` hacen `resetSocket()` más `notifyAuthError({status:401, code})`, igual que HTTP (`SESSION_ENDING_401_CODES` de `client.ts`). Los genéricos de §4.1 y los códigos desconocidos se toleran sin cerrar sesión.
- **D1 (throttle).** Coalescing solo para `experiment:update`, con ventana de 1500 ms por suscripción y timers. La primera de una ventana se entrega al momento; las siguientes se agrupan y se entrega la última al cerrar la ventana. Un estado terminal entrega al momento y cancela lo pendiente. Un cambio de estado entrega al momento. `analysis-run:update` no se limita, porque §6.6 fija el ritmo de 1500 ms solo para el progreso de experimento.
- **Reconciliación (b).** Cada `connect` posterior al primero re-emite `subscribe` y llama a `onReconcile`. Si el socket ya estaba conectado al suscribir, la siguiente conexión cuenta como reconexión. Además, un `subscribed: true` que llega tras reintentos de verificación también dispara `onReconcile`. Esta última regla es decisión propia, no pedida explícitamente.
- **Ack (b).** `subscribed: true` no cambia nada. `GITHUB_VERIFICATION_UNAVAILABLE` con `retryable: true` reintenta el `subscribe` con backoff acotado (1 s, duplicando, máximo 5 intentos). Denegado o inexistente (`code: null`) no reintenta y no muestra error. Un ack `undefined` se ignora.
- **Limpieza (b).** Cada suscripción registra un `teardown` en un conjunto de suscripciones vivas. `resetSocket` lo ejecuta para todas, lo que desactiva listeners y cancela timers de verificación y de throttle. `unsubscribe` es idempotente y solo emite `unsubscribe:*` si el socket sigue conectado.
- **`subscribeProjectVersionUpdates`.** Su firma no cambia. Ahora también pasa por el ack, no emite sin sesión y es no-op sin socket. No tiene consumidores, así que no hay efecto visible.
- **Hook (c).** Usa `useContext(AuthContext)` en lugar de `useAuth()`, para tolerar render sin `AuthProvider` (los tests de página lo hacen). Depende de `session.user.id`, así que no se re-suscribe en cada renovación de token; `renewSocketAuth` ya provoca la reconciliación por `connect`. Solo invalida, sin `setQueryData`. No toca `refetchInterval`.
- **Tipos (d).** `ExperimentStatusResponse` local se mantiene como interfaz tolerante (`model`, `budget`, etc. siguen opcionales y nullables, §6.5.1). No se reexporta el tipo generado porque su `model`/`budget` son requeridos y rompería la tolerancia a corridas previas a OE5. `ExperimentResultsResponse` no cambia (su `analysisRunId`/`symbol` sí existen en `/results`).
- **Mock.** `subscribeExperimentUpdates` y el hook no actúan con `isMockDataSource()`. No hay socket en modo demo.

## 3. Verificación punto a punto de `CS-CORE-20261021-001` (requiredAction)

Fuente: `harness/contract-sync/inbox/CS-CORE-20261021-001.yaml`. Estado de origen: `C-RESOLVED` (parte contractual, WI-CONSOLE-043). Este WI cumple las acciones de código.

1. **Token no vacío siempre en el handshake y no abrir sin sesión (socket.ts enviaba `{}`).** Cumplido. `getSocket` no llama a `io()` sin token. `auth` solo llama `callback({ token })`. Tests: `sin sesión no se abre el socket…`, `sin sesión las suscripciones de analysis-run y experiment también son no-op`, `el handshake envía el access token vigente en auth.token…`, `si el token desaparece entre reconexiones no envía auth vacío…`.
2. **`connect_error` con `AUTH_REQUIRED`, `INVALID_ACCESS_TOKEN`, `GITHUB_IDENTITY_REQUIRED` (retryable false).** Cumplido. Cierre de sesión como HTTP, sin `connect()`. Tests: `connect_error AUTH_REQUIRED…` (y los dos restantes por `test.each`, ya existentes).
3. **`IDENTITY_UNAVAILABLE` (retryable true).** Cumplido. Backoff acotado de 1 s a 30 s, máximo 5 intentos, después HTTP de fallback. Tests: `HU62: connect_error retryable (IDENTITY_UNAVAILABLE)…`, `IDENTITY_UNAVAILABLE sin retryable en data…`.
4. **Opcional `subscribeAnalysisRunUpdates` y `subscribeExperimentUpdates` con el DTO del GET.** Cumplido. Ambas exportadas con `AnalysisRunDetailResponse` y `ExperimentStatusResponse` generados. Solo `experiment` tiene consumidor (hook); `analysis-run` queda sin consumidor por D2. Tests: `subscribe de analysis-run y experiment usa sus payloads…`.
5. **Actualizar el comentario obsoleto de `socket.ts:75`.** Cumplido. El texto «sin token el handshake se acepta…» y la cita a INTEROP-2.4 se eliminaron. El JSDoc y los comentarios ahora citan INTEROP-2.18 §6.6. Verificado con `grep` (sin coincidencias).
6. **Tolerar los genéricos de §4.1 (code abierto).** Cumplido. Tests: `connect_error UNAUTHORIZED/FORBIDDEN/UN_CODIGO_FUTURO… se tolera…`, `connect_error TOO_MANY_REQUESTS retryable true usa el backoff…`.
7. **Alinear `ExperimentStatusResponse` live (`targetId`; sin `analysisRunId`/`symbol`; `history?` opcional).** Cumplido en `liveMapping.ts` y su fixture. `history?` pertenece a `AnalysisRunDetailResponse` local (`control-plane/types.ts`) y ya es opcional; no se modificó. Ningún consumidor leía `analysisRunId` ni `symbol` del status.
8. **Re-espejar `interoperability-contract.md`, `github-integration-contract.md` y `spec/contracts/schemas/` por digest.** No aplica a este WI (lo hizo WI-CONSOLE-043). Verificado por solo lectura: `22b880d1…` (INTEROP), `6c553ee8…` (GH-INTEROP), `b70f9358…` (SYSTEM) y árbol de esquemas `a1ba9a19…` coinciden con el YAML. No se editó `spec/contracts/`.
9. **Ejecutar contract tests, lint, build y test.** Cumplido. Ver sección 4 (`contracts:check`, `errorEnvelope.contract.test.ts` dentro de la suite, lint, build y test).

## 4. Gates (resultado real, Node 22.23.3, pnpm)

| Gate | Comando | Resultado |
|---|---|---|
| Lint | `pnpm lint` | exit 0 |
| Tipos | `pnpm exec tsc -b --noEmit` | exit 0 |
| Tests | `pnpm test --maxWorkers=4` | exit 0 · 80 ficheros, 874 tests |
| Build | `pnpm build` | exit 0 (aviso de chunk >500 kB preexistente, no bloqueante) |
| Formato | `pnpm format:check` | exit 0 |
| Contratos | `pnpm contracts:check` | exit 0 |

Los tests de socket y de hook pasan con los relojes falsos de Vitest. No se depende del reloj real.

## 5. ROJO → VERDE

- **`socket.test.ts`:** antes de modificar `socket.ts`, con los tests nuevos ya escritos, la suite falló con **21 casos rojos y 18 verdes**. Tras implementar, **39/39 verdes**.
- **`useExperimentRealtime.test.tsx`:** escrito después del hook. No hubo fase roja real para el hook. Se cubren mock, sin sesión, sin id, live con sesión, invalidación por aviso, reconciliación, limpieza al desmontar, cierre de sesión y polling intacto.
- **`liveMapping.test.ts`:** el cambio de fixture es de tipos; el `tsc` de la fase ROJA lo valida.

## 6. Incidentes

- `tsc -b` marcó tres errores `'client' is possibly 'null'` dentro de funciones declaradas en `subscribeById`. Causa: las declaraciones de función no conservan el estrechamiento. Solución: `subscribeById` valida el socket y delega en `attachSubscription(client: Socket, …)`. Sin cambio de comportamiento; `tsc` pasó después.
- Un comando de diagnóstico creó un archivo residual `/tmp/none` por error. Se eliminó y se verificó que ya no existe.
- `harness/state.json`, `harness/work-items.json` y `spec/features/013-pr-driven-control-plane/tasks.md` ya estaban modificados antes de empezar. No se tocaron en este WI.

## 7. DECISION_REQUIRED (no resueltas por el implementer)

- **D2 — pantalla consumidora de `AnalysisRun`.** `AnalysisRunDetailPage` no se engancha. Hoy no tiene polling; engancharla cambiaría el comportamiento visible y no está aprobado. `subscribeAnalysisRunUpdates` queda exportada sin consumidor. Decisión del usuario: si se quiere, aprobar en un WI aparte (con `ux-reviewer` si cambia UI).
- **Consecuencia de D3 para el usuario.** `AUTH_REQUIRED` en el handshake cierra la sesión (mismo efecto que un 401 HTTP, vía `AuthProvider`). Es la resolución del leader; si se prefiere solo degradar a HTTP, es una decisión aparte.

## 8. Pendiente

- Revisión independiente por `reviewer` (máximo 2 ciclos). El implementer no se autoaprueba.
- Commit de cortes en `feature/jean` y cierre del WI por el leader. No hay push, PR ni merge.
