# WI-CONSOLE-044 · Revisión independiente (ciclo 1)

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Veredicto: APPROVED** (sin hallazgos bloqueantes; 4 observaciones no bloqueantes, ver abajo).

## Gates reales (Node 22)

- `node scripts/sdd-check.mjs`, `harness/validate-work-items.mjs`, `harness/validate-harness.mjs`: exit 1; el ÚNICO motivo son las 3 rutas inexistentes `wi-console-044-contract-review.md`, `-review.md` (este informe lo cubre) y `-closure.md`. Ningún otro error.
- `pnpm lint` 0; `pnpm exec tsc -b --noEmit` 0; `pnpm test --maxWorkers=4` 0 (80 archivos, 874 pruebas, todo en verde); `pnpm build` 0 (solo el aviso previo de chunk >500 kB); `pnpm format:check` 0; `pnpm contracts:check` 0.
- Subconjunto del WI (socket.test.ts, useExperimentRealtime.test.tsx, liveMapping.test.ts): 63 pruebas verdes.

## Estado Harness

- `state.json`/`work-items.json`: WI-044 en `W-IN_REVIEW`, `reviewCycles` 0/2. Gates en `G-PASSED` solo los de implementación (sddVerified, implementationCompleted, technicalChecksPassed, interopSyncChecked, noMocksPresentedAsLive, noBlockingDecisions, retryLimitRespected); `independentReviewPassed`, `contractReviewed`, `canonicalContractSynced` en `G-NOT_RUN` (no adelantados); `uxReviewed` y `contractSyncPublished` `G-NOT_APPLICABLE` (uiImpact=false, publishesContract=false). Checkpoints `start`, `implementation-delivery` y `before-review` presentes, sin pendientes relevantes. Decisión D2 registrada como parqueada en `decisionGate.note`.
- Pendiente para el leader tras este informe: contract-reviewer (contractImpact=true, gate `contractReviewed`) y cierre.

## Verificación de los puntos pedidos

- **Socket sin sesión / token vacío:** `getSocket()` devuelve `null` sin llamar a `io()` si no hay token (socket.ts:102-103); `auth` es función que envía solo `{ token }` no vacío y, si desaparece, no invoca el callback y descarta la conexión (nunca `{}`). Sin `query`; sin `console.*` ni logs del token. El proveedor de token se asigna en render (AuthProvider), así que el efecto del hook hijo ya lo ve. Probado.
- **Token renovado / logout / cambio de usuario:** `AuthProvider` llama a `resetSocket()` (logout o usuario distinto) o `renewSocketAuth()` (mismo usuario, token nuevo; reconecta, cada suscripción re-emite `subscribe` y reconcilia). El hook depende de `user.id`, no del token: no se re-suscribe en cada renovación. Tras `applySession(null)` el cleanup del hook es idempotente.
- **Fugas (StrictMode, reset, logout):** cada suscripción registra `teardown` en `liveSubscriptions`; `resetSocket` los ejecuta (off de listeners, cancela timers de verificación y de throttle) y cancela `retryTimer`. `unsubscribe` idempotente. Mount→cleanup→mount de StrictMode produce emits ordenados subscribe/unsubscribe/subscribe sin fuga.
- **Backoff acotado:** handshake retryable y ack `GITHUB_VERIFICATION_UNAVAILABLE`: 1 s duplicando hasta 30 s, máximo 5 intentos; agotado, descarta el socket y HTTP sigue. Un `connect` exitoso reinicia el backoff.
- **connect_error:** `AUTH_REQUIRED`, `INVALID_ACCESS_TOKEN`, `GITHUB_IDENTITY_REQUIRED` → `resetSocket()` + `notifyAuthError({status:401, code})`, mismo conjunto que `SESSION_ENDING_401_CODES` de HTTP (D3); `IDENTITY_UNAVAILABLE` reintenta con backoff y no cierra sesión (igual que el socket, aviso es asunto de HTTP); genéricos y desconocidos se toleran sin cerrar sesión; error de transporte (sin `data`) lo reintenta socket.io. Sin riesgo de cierre de sesión indebido.
- **Throttle:** primera de la ventana inmediata, resto agrupado y se entrega la última al cerrar (se abre otra ventana), cambio de estado y terminal inmediatos, terminal cancela lo pendiente, `cancel` en unsubscribe/reset. Correcto frente a §6.6; `analysis-run` sin límite (correcto).
- **Reconciliación sin tormenta:** una invalidación por reconexión (más una si un ack con verificación reintentada confirma); los avisos ya están limitados a 1 por 1500 ms y la invalidación de React Query deduplica. La primera conexión no reconcilia (el polling cubre).
- **Polling intacto:** `ExperimentPage.tsx` solo suma import y una llamada; `refetchInterval` no se tocó. Modo mock y sin sesión: el hook no se suscribe, no hay socket. Sin UI nueva ni cambios en `AnalysisRunDetailPage` (D2 aparcada; `git status` no lo lista).
- **liveMapping.ts:** `ExperimentStatusResponse` con `targetId`, sin `analysisRunId`/`symbol`; sin consumidores rotos (tsc 0). Comentario obsoleto actualizado; los demás cambios son solo comentarios INTEROP-2.17→2.18.
- **Calidad de pruebas:** relojes falsos para todo timer del socket; verifican de verdad (límites 999/1000 ms, 1499/1500 ms, conteos de emit, `io` no llamado sin sesión, ausencia de `query`, unsubscribe limpia timer). Sin tautologías relevantes (ver observación 4).

## Observaciones no bloqueantes

1. **Media/latente — varios suscriptores del mismo id** (socket.ts:290). El `unsubscribe` de una suscripción emite `unsubscribe:*` al servidor aunque otra suscripción local del mismo id siga viva; el servidor saca el socket de la sala y la otra deja de recibir avisos (el polling HTTP la sostiene). Hoy no ocurre: el único consumidor es `useExperimentRealtime` (una instancia por pantalla) y `subscribeProjectVersionUpdates` no tiene consumidores. Recomendado antes de que haya un segundo consumidor (p. ej. D2): conteo de referencias por `(evento, id)`.
2. **Baja — socket muerto tras un rechazo tolerado** (socket.ts:60 y 121). Un `connect_error` con código desconocido/genérico no retryable deja el socket sin reconexión automática (socket.io no reintenta tras error de middleware) pero `socket` sigue no nulo, así que las siguientes suscripciones lo reutilizan sin conectar hasta el próximo `resetSocket`/`renewSocketAuth`. Es coherente con «tolerar» y con el polling como base; documentarlo o descartar el socket en ese caso sería más claro.
3. **Baja — `verificationPending` no se limpia en `handleConnect`** (socket.ts:217,244). Tras agotar o interrumpir reintentos, un ack `subscribed: true` posterior de otra conexión provoca una reconciliación extra (un GET adicional, ya deduplicado por React Query). Además, el temporizador de reintento puede emitir mientras el socket está desconectado (socket.io lo bufferiza) y duplicar el `subscribe` de `handleConnect`; ambos inocuos si el servidor es idempotente.
4. **Baja — prueba del hook con reloj parcialmente real** (useExperimentRealtime.test.tsx:150). `shouldAdvanceTime: true` mezcla reloj real, y el `refetchInterval` de la prueba de polling lo define el propio test, no `ExperimentPage`; prueba que el hook no detiene un polling, no que el de la página siga igual (eso lo garantiza el diff, que no lo toca). Sin impacto en corrección.

## Conclusión

Alcance (a)-(d) cumplido, sin cambios fuera de alcance, sin UI visible, `ux-reviewer` no aplica. Ninguna decisión DEC abierta ni cambio de contrato no aprobado. APPROVED; observaciones 1-3 pueden registrarse como deuda técnica o resolverse en el WI que añada un segundo consumidor.
