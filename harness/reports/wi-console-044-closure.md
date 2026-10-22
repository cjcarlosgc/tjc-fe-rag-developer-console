# WI-CONSOLE-044 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. Cliente de tiempo real alineado con INTEROP-2.18 §6.6: el socket no se abre sin sesión y el handshake envía siempre `auth.token` no vacío (nunca query); `connect_error` con `AUTH_REQUIRED`, `INVALID_ACCESS_TOKEN`, `GITHUB_IDENTITY_REQUIRED` (cierran sesión como HTTP, no retryable) e `IDENTITY_UNAVAILABLE` (backoff acotado); códigos genéricos y desconocidos tolerados; `subscribeAnalysisRunUpdates`/`subscribeExperimentUpdates` con `SubscribeAck`; reconciliación con GET tras reconectar; coalescing de 1500 ms del progreso de experimento; `ExperimentStatusResponse` con `targetId` (sin `analysisRunId`/`symbol`). El polling HTTP sigue como base. Sin UI visible nueva (`uiImpact=false`, sin ux-reviewer).

Contract Sync: `CS-CORE-20261021-001` (ya `C-RESOLVED` en WI-CONSOLE-043) verificado ítem por ítem por el contract-reviewer y el reviewer; la incompatibilidad del handshake queda cerrada del lado Console.

Gates: lint, `tsc -b --noEmit`, 80 archivos y 874 pruebas, build, format:check y contracts:check. Revisiones: contract-reviewer APPROVED, reviewer APPROVED (ciclo 1).

## Pendientes para el usuario

- **DECISION_REQUIRED (D2):** enganchar `AnalysisRunDetailPage` al tiempo real cambia el comportamiento visible (hoy sin polling); `subscribeAnalysisRunUpdates` queda exportada sin consumidor de pantalla.
- Observaciones no bloqueantes del reviewer para un corte futuro: conteo de referencias en `unsubscribe` antes de añadir un segundo consumidor del mismo id (`socket.ts`), socket muerto tras un rechazo tolerado de código desconocido hasta el próximo reset, `verificationPending` no limpiado al reconectar, y prueba de polling con reloj parcialmente real.
- Siguen en espera el WI de mejoras de UX, primitives UI adicionales y el tag `arch-v1.0`.
