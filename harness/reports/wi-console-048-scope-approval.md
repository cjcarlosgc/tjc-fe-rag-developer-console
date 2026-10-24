# WI-CONSOLE-048 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-21
**Autoriza:** usuario (Human Reviewer), en el chat de Console (vía la sesión coordinadora cross).

## Cita literal

> «Apruebo un WI chico de polling de respaldo para AnalysisRunDetailPage: refetch periódico solo mientras el Run no esté terminado, respetando pollAfterMs si existe. Ejecútalo después del WI de UX.»

El WI de UX cerró como WI-CONSOLE-047. WI-CONSOLE-046 había dejado el detalle del Run sin polling HTTP (el tiempo real solo invalida el GET y es best effort, sin replay); el usuario decide ahora añadir un polling de respaldo.

## Alcance aprobado (ancla HU12; STANDARD, `contractImpact=false`)

1. `useAnalysisRun` (o el punto equivalente) gana un `refetchInterval` **solo mientras el AnalysisRun no esté en estado terminal**, que se detiene al llegar a terminal. Se usa la definición existente de estados en curso del dominio (`QUEUED`/`PROCESSING`); no se inventan estados.
2. Respeta `pollAfterMs` si existe, con el tope y el comportamiento de INTEROP-2.19 §5 (opcional, tope 30 s); sin él, el intervalo por defecto del polling análogo del repositorio. La elección se documenta.
3. Convive con `useAnalysisRunRealtime` sin peticiones duplicadas innecesarias ni fugas (limpieza al desmontar, cambiar de Run o cerrar sesión).
4. Pruebas vitest con fake timers o reloj inyectado (nunca reloj real) y verificación de que alguna prueba falla al mutar la lógica clave.

## Fuera de alcance

Cambios de DTO, rutas, markup o copy; tiempo real nuevo o cambios en el socket; ajuste de `reasoningEffortMessage`; los pendientes DR-1..4, H5 y H6 de WI-CONSOLE-047; hallazgos menores de WI-CONSOLE-044; WI-CONSOLE-005 y 006 (siguen `W-PLANNED`). No se reinterpreta la autoridad MAINTAINER/ADMIN sobre Functional Knowledge.

## Reglas

- Una decisión de alcance o arquitectura no cubierta se registra como `DECISION_REQUIRED` y se aparca, sin inventar aprobación.
- Revisión independiente por `reviewer` (independiente del implementer), máximo 2 ciclos; si se agotan, queda pendiente para el usuario. `ux-reviewer` solo si cambia lo visible; si no, se justifica y se omite.
- Sin push, PR ni merge; `main` no se toca.
