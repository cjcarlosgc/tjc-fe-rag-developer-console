# WI-CONSOLE-043 — revisión de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Eventos leídos enteros en `harness/contract-sync/inbox/` (untracked, importados por cross el 2026-10-22T00:35Z). Revisión canónica: Core `5c82853c36a419e9839d5474ad9657f714aba4cb` (existe en Core; HEAD actual `cba2b83`).

| Evento | WI Core | targets | Decisión |
|---|---|---|---|
| CS-CORE-20261021-001 | WI-CORE-074 | console | Relevante (breaking en Core): acusar; re-espejar INTEROP-2.18, GH-INTEROP-1.8 (sin cambio), SYSTEM-2.13 (sin cambio) y el árbol `schemas/` (nuevo `realtime-events.schema.json` y ejemplos); regenerar tipos; la adopción de código (handshake con token, subscribe/ack, errores, `ExperimentStatusResponse`) corresponde a WI-CONSOLE-044 |
| CS-CORE-20261021-002 | WI-CORE-074 | github-integration | No apunta a Console: sin acuse (el CLI lo rechaza) |
| CS-CORE-20261021-003 | WI-CORE-074 | sandbox | No apunta a Console: sin acuse |

El Harness solo evalúa y admite acuse de eventos con `console` en `targets`; `-002` y `-003` quedan como archivos de inbox sin estado de Console y no afectan los gates.

## Eventos históricos sin `scopePaths` (alcance global)

`CS-20260920-003`, `CS-20260921-001`, `CS-20260921-002` y `CS-20260921-003` se clasifican NOT_RELEVANT para este WI con los mismos digests de WI-CONSOLE-039 (contenido sin cambios). Este WI solo espeja contratos de Core y no toca bindings, autorización, login ni Projects.
