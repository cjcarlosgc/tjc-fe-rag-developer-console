# WI-CONSOLE-054 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-30
**Autoriza:** usuario (Human Reviewer), en el chat, vía la sesión coordinadora cross (`[TN]-Cross`, Sprint 4, demo con el PO del 02/11/2026).

## Alcance aprobado

Retirar ÚNICAMENTE el panel simulado `CaptureNextPrPanel` (HU49, propuesta sin contrato) de `ExperimentPage`, con sus restos huérfanos (`run-comparison/speculative/captureNextPr*` y las funciones del mock sin otro consumidor). Motivo: conviven dos «Armar captura» y el simulado confunde en la demo del 02/11.

## Fuera de alcance

`ExperimentPage` como pantalla (HU17); la captura real de HU18 (`app/src/projects/ExperimentCapturePanel.tsx`, badge «Reservado para experimentación», mock de `experiment-captures`, INTEROP-2.25); contratos y `spec/contracts`; push, PR, merge y deploy. Una decisión no cubierta es `DECISION_REQUIRED`.

Nota de trazabilidad: HU49 no figura en `spec/backlog.md`, por eso el WI enlaza `HU17` y `HU18`; HU49 se nombra en prosa.
