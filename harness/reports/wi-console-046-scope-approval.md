# WI-CONSOLE-046 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-21
**Autoriza:** usuario (Human Reviewer), en el chat de Console (vía la sesión coordinadora cross).

## Cita literal

> «conectar AnalysisRunDetailPage al tiempo real (HU12), (2) WI-CONSOLE-045 de espejo documental de INTEROP-2.19, (3) el WI de mejoras de UX después de la 1. Continúa en ese orden.»

El punto (2) cerró como WI-CONSOLE-045. Este WI ejecuta el punto (1). El punto (3), el WI de mejoras de UX, **no se abre aquí**: sigue pendiente y es posterior a este WI.

## Origen: DECISION_REQUIRED D2 de WI-CONSOLE-044

WI-CONSOLE-044 dejó aparcada la decisión **D2**: enganchar `AnalysisRunDetailPage` al tiempo real era un cambio de comportamiento visible que su aprobación (`harness/reports/wi-console-044-scope-approval.md`) no cubría, y `subscribeAnalysisRunUpdates` quedó sin consumidor de pantalla. La cita de arriba es la aprobación del usuario que resuelve D2 a favor de conectarlo.

## Alcance aprobado para WI-CONSOLE-046 (ancla HU12)

1. Hook análogo a `useExperimentRealtime` (p. ej. `useAnalysisRunRealtime`) que, con `subscribeAnalysisRunUpdates`, invalida/reconcilia el GET `/analysis-runs/{id}` ante cada aviso `analysis-run:update` y tras cada reconexión; sin sesión (o en mock) no abre el socket; al desmontar o cerrar sesión libera la suscripción.
2. Engancharlo en `AnalysisRunDetailPage` (solo el detalle de un AnalysisRun). El polling HTTP no se elimina ni se relaja; sin cambio de DTO ni de rutas.
3. Evaluar si el WI crea un segundo consumidor del mismo id (observación del reviewer de WI-044: conteo de referencias en `unsubscribe`) y, solo si lo crea, resolverlo con prueba.
4. Pruebas vitest con fake timers y mock del socket, incluida la ausencia de fugas al limpiar. `ux-reviewer` solo si la pantalla cambia visualmente; si no, se justifica y se omite.

## Fuera de alcance

Primitives UI nuevas, mejoras de UX, ajuste de `reasoningEffortMessage` y los hallazgos menores de WI-044 (salvo el conteo de referencias si aplica). No se reinterpreta la autoridad MAINTAINER/ADMIN sobre Functional Knowledge.

## Reglas

- Una decisión de alcance o arquitectura no cubierta se registra como `DECISION_REQUIRED` y se aparca, sin inventar aprobación.
- Revisión independiente por `reviewer` (máximo 2 ciclos); si se agotan, queda pendiente para el usuario. No hay push, PR ni merge; `main` no se toca.
