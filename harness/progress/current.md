# Progreso actual — CONSOLE

## Secuencia vigente SMART V3 (2026-10-08)

El usuario aprobó el alcance de `WI-CONSOLE-011` a `WI-CONSOLE-019` (`harness/reports/smart-v3-scope-approval.md`). El Leader los toma por prioridad y dependencias, sin pedir aprobación por corte; los cambios visibles exigen `ux-reviewer`.

1. **Ya elegibles:** `WI-CONSOLE-011` quedó `W-DONE` (espejos SYSTEM-2.6/INTEROP-2.7 sincronizados). `WI-CONSOLE-012` quedó `W-DONE` (no reproduce). `WI-CONSOLE-019` quedó `W-DONE` (copy de OE5, sin veredictos automáticos). Solo puede haber un WI activo.
2. **Tras `WI-CONSOLE-011`, sin esperar a Core:** `WI-CONSOLE-013` (roles y `UNKNOWN`), `WI-CONSOLE-015` (Functional Knowledge), `WI-CONSOLE-014` (OE2), `WI-CONSOLE-016` (trace), `WI-CONSOLE-018` (metadata de OE5, tras `WI-CONSOLE-019`) y `WI-CONSOLE-017` (evidencia, tras `WI-CONSOLE-014`). Se construyen contra el contrato canónico INTEROP-2.7 con mocks rotulados y el adapter live pendiente.
3. **Al final, cuando Core implemente:** `WI-CONSOLE-020` activa y verifica los adapters live contra Core (espera los WI de Core `018`, `019`, `020`, `022`, `025`, `026` y `027`).
4. **P2 al final:** `WI-CONSOLE-004` a `007`.


**Último corte cerrado:** `WI-CONSOLE-008`, `W-DONE`, con revisión independiente delegada y evidencia registrada. El cierre de WI-CONSOLE-003 tampoco implica aceptación de las 18 HU ni despliegue/cutover. Ver `harness/state.json` y `harness/work-items.json`.

**Cierre más reciente:** `WI-CONSOLE-015` / `ST-CONSOLE-017`, `W-DONE`: Functional Knowledge agrupado por `scenarioKind` con varias reglas ACTIVE, procedencia y cadena SUPERSEDED; retirado el panel especulativo de procedencia (HU07, HU09). UX aprobado tras un ciclo de corrección, aprobación humana tras verlo en el mock, Contract Sync `before-done` PASS. Cambió `app/`. No se hizo push ni PR. Ver `harness/reports/wi-console-015-closure.md`. Cierres previos: `WI-CONSOLE-013`, `WI-CONSOLE-019`, `WI-CONSOLE-012`, `WI-CONSOLE-011`. No hay WI activo; siguiente elegible: `WI-CONSOLE-014`.

**Hecho en este corte:** Console consume GitHub Integration directamente para capacidades GitHub de interfaz; Core conserva Projects, bindings, autorización de dominio, RAG y análisis. Migración revisada y cerrada localmente con validadores y evidencia. No hubo deploy/cutover ni cambios en Sandbox.

**Hecho en WI-CONSOLE-008:** sincronización de contratos SYSTEM/INTEROP/GH y verificación del consumidor de Runs por Project, sin cambios de UI. Sus dependencias `WI-GH-007` y `WI-CORE-011` están cerradas; los tres espejos coinciden byte a byte, los checks técnicos/Harness pasan y el reviewer independiente aprobó el corte. Los WI P2 de casos y accesibilidad permanecen planificados.

**Contract Sync:** `CS-CORE-20260927-003` y `CS-GH-20260927-001` fueron importados y resueltos con evidencia en `WI-CONSOLE-008`; los checkpoints `before-review` y `before-done` no encontraron eventos relevantes pendientes. Cuatro eventos anteriores a la baseline quedaron como `NOT_RELEVANT` para este WI, sin cambiar su estado global.

El progreso anterior, incluido T-004 / Bundle B Console, se conserva en `harness/reports/`, `CHANGELOG.md` y Git; no es la planificación vigente.
