# WI-CONSOLE-044 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-21
**Autoriza:** usuario (Human Reviewer), en el chat de Console (vía la sesión coordinadora cross).

## Cita literal

> «Apruebo WI-CONSOLE-043 y WI-CONSOLE-044 tal como los propones, en ese orden. Las mejoras de UX siguen aparte, pendientes.»

Con esta aprobación se levanta la espera de tiempo real **solo para el alcance de este WI**. Siguen en espera: primitives UI adicionales, tag `arch-v1.0` y el WI de mejoras de UX (objetivos <40 px, Focus Mode a 375 px, es/en, conteos demo, `VITE_CORE_API_URL` inválida, verificaciones a11y), que sigue pendiente de aprobación aparte y NO se abre aquí.

## Alcance aprobado para WI-CONSOLE-044 (depende de WI-CONSOLE-043; ancla HU12)

(a) Handshake: enviar siempre token no vacío en `auth.token` (nunca en la query), no abrir el socket sin sesión, manejar `connect_error` con `AUTH_REQUIRED`, `INVALID_ACCESS_TOKEN`, `GITHUB_IDENTITY_REQUIRED` (no retryable) e `IDENTITY_UNAVAILABLE` (retryable), tolerar los códigos genéricos de INTEROP §4.1 (code abierto).
(b) `subscribe`/`unsubscribe` de `analysis-run` y `experiment` con `SubscribeAck`; eventos `analysis-run:update` y `experiment:update`; throttle de progreso 1500 ms; sin replay ni orden garantizado: reconciliar con GET tras reconectar; el polling HTTP sigue como base.
(c) Alinear `ExperimentStatusResponse` live a la forma real (`targetId`; `analysisRunId` y `symbol` no llegan, pendientes de HU17; `history?` opcional) y actualizar el comentario obsoleto de `socket.ts`.
(d) Pruebas vitest (socket simulado, relojes falsos) de handshake sin sesión, cada código de error, subscribe/ack, reconciliación y throttle. Mantener Prettier, jsx-a11y y pnpm.

## Reglas

- `ux-reviewer` solo si el cambio toca UI visible. No se reinterpreta la autoridad MAINTAINER/ADMIN sobre Functional Knowledge.
- Una decisión de alcance/arquitectura no cubierta (p. ej. un cambio de DTO no descrito) se registra como `DECISION_REQUIRED` y se aparca, sin inventar aprobación.
- Revisión independiente por `reviewer` (máximo 2 ciclos); si se agotan, queda pendiente para el usuario. No hay push, PR ni merge; `main` no se toca.
