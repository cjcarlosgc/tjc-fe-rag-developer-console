# Progreso actual — CONSOLE

## Secuencia vigente SMART V3 (2026-10-08)

El usuario aprobó el alcance de `WI-CONSOLE-011` a `WI-CONSOLE-019` (`harness/reports/smart-v3-scope-approval.md`). El Leader los toma por prioridad y dependencias, sin pedir aprobación por corte; los cambios visibles exigen `ux-reviewer`.

1. **Ya elegibles:** `WI-CONSOLE-011` (P0, sincroniza los espejos SYSTEM-2.6/INTEROP-2.7; el Contract Sync ya está importado y acusado, y habilita al resto), `WI-CONSOLE-012` (prueba de `RunsPage`; hoy pasa 6/6 y la suite 428/428, así que se espera cierre con evidencia) y `WI-CONSOLE-019` (copy de OE5, sin veredictos automáticos). Solo puede haber un WI activo, así que el Leader empieza por `WI-CONSOLE-011`.
2. **Tras `WI-CONSOLE-011`, sin esperar a Core:** `WI-CONSOLE-013` (roles y `UNKNOWN`), `WI-CONSOLE-015` (Functional Knowledge), `WI-CONSOLE-014` (OE2), `WI-CONSOLE-016` (trace), `WI-CONSOLE-018` (metadata de OE5, tras `WI-CONSOLE-019`) y `WI-CONSOLE-017` (evidencia, tras `WI-CONSOLE-014`). Se construyen contra el contrato canónico INTEROP-2.7 con mocks rotulados y el adapter live pendiente.
3. **Al final, cuando Core implemente:** `WI-CONSOLE-020` activa y verifica los adapters live contra Core (espera los WI de Core `018`, `019`, `020`, `022`, `025`, `026` y `027`).
4. **P2 al final:** `WI-CONSOLE-004` a `007`.


**Último corte cerrado:** `WI-CONSOLE-008`, `W-DONE`, con revisión independiente delegada y evidencia registrada. El cierre de WI-CONSOLE-003 tampoco implica aceptación de las 18 HU ni despliegue/cutover. Ver `harness/state.json` y `harness/work-items.json`.

**Cierre más reciente:** `WI-CONSOLE-010` / `ST-CONSOLE-012`, `W-DONE`, corte exclusivamente documental. Se actualizaron las referencias vigentes a WI-CONSOLE-008 y se importaron y resolvieron `CS-CORE-20260927-004/005/006`. SYSTEM-2.5, INTEROP-2.6 y GH-INTEROP-1.2 coinciden byte a byte entre Console, Core y GitHub Integration. La puerta externa pasó con WI-CORE-015 y WI-GH-008 en `W-DONE`; revisión contractual y aprobación humana registradas. No cambió la aplicación. No se hizo push ni PR. Ver `harness/reports/wi-console-010-closure.md`.

**Hecho en este corte:** Console consume GitHub Integration directamente para capacidades GitHub de interfaz; Core conserva Projects, bindings, autorización de dominio, RAG y análisis. Migración revisada y cerrada localmente con validadores y evidencia. No hubo deploy/cutover ni cambios en Sandbox.

**Hecho en WI-CONSOLE-008:** sincronización de contratos SYSTEM/INTEROP/GH y verificación del consumidor de Runs por Project, sin cambios de UI. Sus dependencias `WI-GH-007` y `WI-CORE-011` están cerradas; los tres espejos coinciden byte a byte, los checks técnicos/Harness pasan y el reviewer independiente aprobó el corte. Los WI P2 de casos y accesibilidad permanecen planificados.

**Contract Sync:** `CS-CORE-20260927-003` y `CS-GH-20260927-001` fueron importados y resueltos con evidencia en `WI-CONSOLE-008`; los checkpoints `before-review` y `before-done` no encontraron eventos relevantes pendientes. Cuatro eventos anteriores a la baseline quedaron como `NOT_RELEVANT` para este WI, sin cambiar su estado global.

El progreso anterior, incluido T-004 / Bundle B Console, se conserva en `harness/reports/`, `CHANGELOG.md` y Git; no es la planificación vigente.
