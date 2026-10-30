# WI-CONSOLE-053 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-30
**Autoriza:** usuario (Human Reviewer), en el chat, vía la sesión coordinadora cross (`[TN]-Cross`, Sprint 4, demo con el PO del 02/11/2026).

## Cita literal

> «Aprobar WI-053»

Propuesta aprobada (literal): «WI-CONSOLE-053 (HU18): espejo directo a INTEROP-2.25 (digest b2f3845296451bd3e593c00cb1e5955029f3d77ef4d69d1fd9326d07f1fdb651), tipos experimentCapture y ExperimentCaptureResponse, botones «Armar captura» / «Desarmar» con aviso visible para Maintainer o superior, badge «Reservado para experimentación» en la lista y el detalle del Run; reviewer y ux-reviewer.» Cross informó además que el usuario aprobó la UI de HU18 el 2026-10-30 («conforme»).

## Alcance aprobado

1. **Contrato:** `interoperability-contract.md` INTEROP-2.25 byte a byte desde Core `55bf4241431329a50db4ab85676b68c5888c01b8` (`git show`), un solo paso directo desde 2.23 (subsume INTEROP-2.24, `CS-CORE-20261026-001`); SYSTEM-2.16, GH-INTEROP-1.9 y `schemas/` sin cambio; `contracts:check` limpio.
2. **Contract Sync:** acusar y resolver `CS-CORE-20261030-001` y `CS-CORE-20261026-001` con evidencia real (lo pendiente del segundo —`BELOW_RELEVANCE_THRESHOLD`, `dependencyContext` hasta 500— ya lo cubrió WI-CONSOLE-052).
3. **API/tipos:** `ExperimentCaptureStatus`, `ExperimentCaptureResponse`, `experimentCapture` en el resumen del Run (tolerando ausencia); armar/desarmar/listar con 409/404 mapeados.
4. **UI:** control en el Project (Maintainer/Admin) «Armar captura» / «Desarmar» con aviso visible y persistente mientras haya una captura `ARMED`; badge «Reservado para experimentación» en la lista y el detalle del Run; mock DEMO rotulado.
5. **Pruebas y evidencia:** vitest sin reloj real (ROJAS al revertir), capturas de pantalla en `harness/reports/wi-console-053-captura-NN.png`.

## Fuera de alcance

Realtime, rutas de producto, primitives nuevas, `reasoningEffortMessage`, DR-1..4/pr52/WI-005/006, el panel especulativo HU49 (`run-comparison/speculative`), push, PR, merge, deploy y `main` (el orden de despliegue es Core → Console y Core aún no está confirmado live; la sesión principal coordinará el push cuando Cross avise). Revisión: `contract-reviewer`, `reviewer` y `ux-reviewer` independientes (máximo 2 ciclos). Una decisión no cubierta es `DECISION_REQUIRED`, aparcada.
