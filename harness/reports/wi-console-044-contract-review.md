Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-044 revisión contractual (INTEROP-2.18 §4.1, §6.5, §6.6, §6.10)

Veredicto: APPROVED (sin hallazgos bloqueantes; 2 observaciones menores).

Evidencia ejecutada: `pnpm contracts:check` OK; vitest socket.test.ts + src/experiments: 136 pruebas OK.

## Conformidad
- Eventos y payloads: subscribe/unsubscribe `analysis-run` (`{analysisRunId}`) y `experiment` (`{experimentId}`), updates `analysis-run:update` / `experiment:update`: socket.ts:313-349 coinciden con §6.6 y el esquema. Se filtra por `update.id` (socket.ts:268).
- SubscribeAck: socket.ts:240-255 maneja los tres resultados (suscrito / GITHUB_VERIFICATION_UNAVAILABLE retryable con backoff / denegado-inexistente sin distinguir y sin error visible). Tipo importado del generado.
- Token solo en `auth.token`, nunca query ni `{}`: socket.ts:101-116 (sin token no abre el socket; si desaparece, descarta). Pruebas socket.test.ts:144-160.
- connect_error: socket.ts:58-81. AUTH_REQUIRED, INVALID_ACCESS_TOKEN, GITHUB_IDENTITY_REQUIRED cierran sesión (no reintentan); IDENTITY_UNAVAILABLE reintenta con backoff acotado; manda `err.data.retryable`. Código abierto/genérico §4.1 tolerado sin cerrar sesión (socket.ts:80).
- Throttle 1500 ms (socket.ts:29,133-187): aplicar solo a experiment es correcto; §6.6 limita solo `completedRepetitions` por experimento; cambio de estado inmediato y terminal cancela pendiente; analysis-run sin límite (socket.ts:310). Es coalescing adicional del cliente, inocuo porque cada aviso solo invalida el GET.
- Reconciliación sin replay: re-subscribe + `onReconcile` en cada reconexión y tras ack tardío (socket.ts:243-246, 257-265); useExperimentRealtime.ts:19-22 invalida `['experiments', id]` y no escribe el DTO en caché; el polling de ExperimentPage sigue como base. Sin socket en mock/sin sesión (useExperimentRealtime.ts:18).
- ExperimentStatusResponse: liveMapping.ts:21-40 con `targetId`, sin `analysisRunId` ni `symbol`; coincide con el tipo generado (contract-types.ts:194-). No se inventan DTO, campos ni rutas.
- Comentario obsoleto de socket.ts:75 actualizado; comentarios INTEROP-2.17 a 2.18 en client.ts y contract-validator.ts.

## requiredAction de CS-CORE-20261021-001
1. Token no vacío siempre / no abrir sin sesión: cumplido (socket.ts:103,106-113).
2. connect_error con los 4 códigos y retryable: cumplido (socket.ts:58-81).
3. subscribeAnalysisRunUpdates y subscribeExperimentUpdates (opcional): cumplido; el de experimento tiene consumidor, el de analysis-run sin consumidor de pantalla (decisión D2 pendiente, aceptable por ser opcional).
4. Comentario obsoleto: cumplido.
5. Tolerar códigos §4.1: cumplido.
6. Alinear ExperimentStatusResponse (targetId; sin analysisRunId/symbol): cumplido. `history?` opcional: no añadido; está pendiente en el contrato y el tipo generado no lo trae, así que omitirlo es correcto.
7. Re-espejo byte a byte: ya resuelto en WI-CONSOLE-043 (commit 894c5ae); `contracts:check` OK.
8. Contract tests / lint / build / test: pruebas de socket y experimentos OK en esta revisión; lint y build no ejecutados aquí.

## Observaciones (no bloqueantes)
- liveMapping.ts:21 mantiene un `ExperimentStatusResponse` local (campos 2.7 opcionales) distinto del generado que usa socket.ts:2; hoy compatible (superconjunto laxo), pero es una duplicación que puede divergir. Sugerido a futuro derivarlo del generado.
- socket.ts:61: si un rechazo de sesión trajera `retryable: true` con un código no reintentable se reintentaría; el contrato no lo define, comportamiento razonable ("manda el retryable del rechazo").
