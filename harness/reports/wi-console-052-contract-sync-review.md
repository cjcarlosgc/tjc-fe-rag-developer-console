# WI-CONSOLE-052 — revisión de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Eventos leídos enteros en `harness/contract-sync/inbox/` (importados el 2026-10-26T04:45Z). Revisión canónica: Core `8c3eb0f73b805492ee46887e6024dc33254dbe6d` (existe en Core); revisión intermedia `e4d6dd8bb02e3bb2d78b547cb3e41441a0511672` (existe).

| Evento | WI Core | targets | Decisión |
|---|---|---|---|
| CS-CORE-20261025-001 | WI-CORE-103 | console, github-integration, sandbox | Relevante por el target Console: INTEROP-2.22 (`76f5e774…`, intermedio); etiquetar `BELOW_RELEVANCE_THRESHOLD` con fallback; `layer`/`strategy` opcionales. SUBSUMIDO en INTEROP por `-002`. Se acusa y resuelve |
| CS-CORE-20261025-002 | WI-CORE-104 | console, github-integration, sandbox | Relevante por el target Console: INTEROP-2.23 (`5de10cb7…`); re-espejo directo; `dependencyContext.tokenCount` puede llegar a 500 (Console no lo consume). Se acusa y resuelve (no por Integration ni Sandbox) |

## Precedencia

`CS-CORE-20261025-002` SUBSUME a `CS-CORE-20261025-001` y, para INTEROP, a `CS-CORE-20261024-004` (2.21, ya resuelto por WI-CONSOLE-051): el re-espejo de `interoperability-contract.md` va directo de 2.21 a 2.23 sin espejar 2.22. SYSTEM-2.16 (`d0a492b4…`), GH-INTEROP-1.9 (`dedf00fa…`) y `schemas/` (`8079ab73…`) no cambian (idénticos en `8c3eb0f`, `e4d6dd8b` y `2318b9df`); `generated/` no cambia.

## Eventos históricos sin `scopePaths` (alcance global)

`CS-20260920-003`, `CS-20260921-001`, `CS-20260921-002` y `CS-20260921-003` se registran `NOT_RELEVANT` solo para este WI, con los mismos digests que en WI-CONSOLE-045/050/051: lifecycle del binding, identidad y rutas, autenticación de binding y membresía. Este WI espeja un contrato, añade tipos opcionales y un campo de lectura en el panel RAG, sin tocar autorización, login, Projects ni bindings.
