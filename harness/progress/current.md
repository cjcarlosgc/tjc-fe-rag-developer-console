# Progreso actual — CONSOLE

## Secuencia vigente SMART V3 (2026-10-08)

El usuario aprobó el alcance de `WI-CONSOLE-011` a `WI-CONSOLE-019` (`harness/reports/smart-v3-scope-approval.md`). El Leader los toma por prioridad y dependencias, sin pedir aprobación por corte; los cambios visibles exigen `ux-reviewer`.

1. **Ya elegibles, sin depender de Core:** `WI-CONSOLE-012` (prueba de `RunsPage`; hoy pasa 6/6 y la suite 428/428, así que se espera cierre con evidencia) y `WI-CONSOLE-019` (copy de OE5, sin veredictos automáticos).
2. **P0 al publicar Core `WI-CORE-017`:** `WI-CONSOLE-011` importa el Contract Sync y sincroniza SYSTEM-2.6/INTEROP-2.7; habilita al resto.
3. **P1 según Core:** `WI-CONSOLE-013` (tras Core 018 y 019), `WI-CONSOLE-015` (tras 019 y 020), `WI-CONSOLE-014` (OE2, tras 022), `WI-CONSOLE-018` (tras 025 y `WI-CONSOLE-019`), `WI-CONSOLE-016` (tras 026) y `WI-CONSOLE-017` (tras 027). Mientras Core no cierre un WI, el Leader sigue con los elegibles y no espera.
4. **P2 al final:** `WI-CONSOLE-004` a `007`.


**Último corte cerrado:** `WI-CONSOLE-008`, `W-DONE`, con revisión independiente delegada y evidencia registrada. El cierre de WI-CONSOLE-003 tampoco implica aceptación de las 18 HU ni despliegue/cutover. Ver `harness/state.json` y `harness/work-items.json`.

**Cierre más reciente:** `WI-CONSOLE-010` / `ST-CONSOLE-012`, `W-DONE`, corte exclusivamente documental. Se actualizaron las referencias vigentes a WI-CONSOLE-008 y se importaron y resolvieron `CS-CORE-20260927-004/005/006`. SYSTEM-2.5, INTEROP-2.6 y GH-INTEROP-1.2 coinciden byte a byte entre Console, Core y GitHub Integration. La puerta externa pasó con WI-CORE-015 y WI-GH-008 en `W-DONE`; revisión contractual y aprobación humana registradas. No cambió la aplicación. No se hizo push ni PR. Ver `harness/reports/wi-console-010-closure.md`.

**Hecho en este corte:** Console consume GitHub Integration directamente para capacidades GitHub de interfaz; Core conserva Projects, bindings, autorización de dominio, RAG y análisis. Migración revisada y cerrada localmente con validadores y evidencia. No hubo deploy/cutover ni cambios en Sandbox.

**Hecho en WI-CONSOLE-008:** sincronización de contratos SYSTEM/INTEROP/GH y verificación del consumidor de Runs por Project, sin cambios de UI. Sus dependencias `WI-GH-007` y `WI-CORE-011` están cerradas; los tres espejos coinciden byte a byte, los checks técnicos/Harness pasan y el reviewer independiente aprobó el corte. Los WI P2 de casos y accesibilidad permanecen planificados.

**Contract Sync:** `CS-CORE-20260927-003` y `CS-GH-20260927-001` fueron importados y resueltos con evidencia en `WI-CONSOLE-008`; los checkpoints `before-review` y `before-done` no encontraron eventos relevantes pendientes. Cuatro eventos anteriores a la baseline quedaron como `NOT_RELEVANT` para este WI, sin cambiar su estado global.

El progreso anterior, incluido T-004 / Bundle B Console, se conserva en `harness/reports/`, `CHANGELOG.md` y Git; no es la planificación vigente.
