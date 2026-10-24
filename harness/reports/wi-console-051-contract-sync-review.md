# WI-CONSOLE-051 — revisión de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Eventos leídos enteros en `harness/contract-sync/inbox/` (importados el 2026-10-24T17:18Z). Revisión canónica: Core `2318b9df292b337db4998f04b66b0457f1df8e3f` (existe en Core); revisión intermedia `208c3bdfe21bfc4b294da118d8ab1318f0432ca5` (existe).

| Evento | WI Core | targets | Decisión |
|---|---|---|---|
| CS-CORE-20261024-001 | WI-CORE-079 | github-integration | No apunta a Console: `NOT_RELEVANT` (acción de Integration: validar el normalizador contra `GithubWebhookEvent`; Console no emite ni consume ese payload) |
| CS-CORE-20261024-002 | WI-CORE-079 | sandbox | No apunta a Console: `NOT_RELEVANT` (acción de Sandbox; Console no consume `sandbox-result.failed.json` más allá del esquema espejado) |
| CS-CORE-20261024-003 | WI-CORE-079 | console | Relevante: re-espejar contratos y esquemas, regenerar tipos, alineación opcional de `ExperimentResultsResponse`; se acusa y resuelve |
| CS-CORE-20261024-004 | WI-CORE-089 | console, github-integration, sandbox | Relevante solo por el target Console: re-espejar INTEROP/SYSTEM directo a 2.21/2.16; se acusa y resuelve (no se acusa por Integration ni Sandbox) |

`-001` y `-002` no tienen `console` en `targets`: Contract Sync los excluye por destino (no aparecen en el checkpoint) y `contractSyncReview` solo admite eventos de Console anteriores a la línea base, por lo que su clasificación `NOT_RELEVANT` consta aquí y no como entrada del registro. Su contenido (WI-CORE-079) se refleja igualmente en el espejo porque comparte `schemas/` y contratos.

## Precedencia

`CS-CORE-20261024-004` SUPERA a `CS-CORE-20261021-001..004` y a `CS-CORE-20261024-001..003` en INTEROP y SYSTEM: el re-espejo va directo a INTEROP-2.21 y SYSTEM-2.16 sin pasar por 2.20/2.15 (`-003` solo fija GH-INTEROP-1.9, los esquemas y la nota de `ExperimentResultsResponse`). Cruce de digests de `-003` (revisión `208c3bdf`): INTEROP-2.20 `f0b39578…`, SYSTEM-2.15 `f3b61da5…` (intermedios, no espejados), GH-INTEROP-1.9 `dedf00fa…` y schemas `8079ab73…` idénticos a los de `2318b9df`.

## Eventos históricos sin `scopePaths` (alcance global)

`CS-20260920-003`, `CS-20260921-001`, `CS-20260921-002` y `CS-20260921-003` se registran `NOT_RELEVANT` solo para este WI, con los mismos digests que en WI-CONSOLE-045/050: lifecycle del binding, identidad y rutas, autenticación de binding y membresía; este WI espeja contratos y alinea un tipo local, sin tocar autorización, login, Projects ni bindings.
