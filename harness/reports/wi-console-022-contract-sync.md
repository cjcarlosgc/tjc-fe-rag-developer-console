# WI-CONSOLE-022 — Sincronización de contratos

Modelo: leader · configurado gpt-6-luna · atendido unknown · esfuerzo xhigh

**Estado:** `W-IN_PROGRESS`; eventos importados, comparados y resueltos por el WI local.

## Alcance

- `CS-CORE-20261011-001` (source revision `187b0383817e341aa7c82e91cb36d7dcce343479`) y `CS-CORE-20261011-004` (source revision `0adbede3e89b154dc720115189822333748c1d2a`) se importaron desde Core.
- Los tres espejos se compararon con Core `7789f54fe0bc65faf37576f8562e844d826e98ac`; sus SHA-256 locales y canónicos coinciden:
  - SYSTEM-2.7: `50d9dcc03f2af0337c3b11824df8a2c9fdee4c189e8df84bccea3e85cc827f76`
  - INTEROP-2.8: `755c3357ca047ede9fb318a40a594cc68a63fc63f2b9f4c58af93c28f51a8d90`
  - GH-INTEROP-1.5: `fbbda9603c0ac4f881287a713603246e69c7518875b3d8a2e0631842cedf37bc`
- La decisión del usuario conserva un repositorio por Project. No habrá selector de Project/aplicación en Console. El evento `-001` no requiere trabajo de UI: `projectRoot` solo se puede mostrar como dato informativo en una vista técnica existente.
- `CS-CORE-20261011-004` no requiere cambios de UI, endpoint ni DTO en Console. No se toca `app/`.

La resolución acredita recepción, comparación y adopción documental de los contratos;
no afirma implementación de UI. Los dos eventos están `C-RESOLVED` con evidencia
en `wi-console-022-implementation.md`.
