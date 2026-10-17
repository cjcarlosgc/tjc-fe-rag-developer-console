# WI-CONSOLE-030 — revisión de alcance de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

WI de producto sin impacto contractual: `contractImpact=false`, `publishesContract=false`, sin `syncScopePaths`. Solo cambia datos del mock y sus pruebas (proyecto demo PHP, Runs en cola, criterio del 409 de reglas y un caso demo de `UNSUPPORTED_PROJECT`); no toca DTO, rutas, errores del contrato, adapters live, binding, identidad ni seguridad.

Checkpoint `start` corrido de verdad con `node harness/contract-sync.mjs check --work-item WI-CONSOLE-030 --checkpoint start --record`: `relevantPendingSyncIds: []`.

Eventos `C-PENDING` del inbox restantes (CS-CORE-20261009-012, 20261010-001/-002, 20261011-002/-003): ninguno apunta a Console ni es relevante para este WI. No se acusa ni se resuelve ninguno; su estado global no cambia.

## Eventos históricos sin `scopePaths`

Los cuatro eventos históricos sin `scopePaths` (`CS-20260920-003`, `CS-20260921-001`, `-002`, `-003`) cuentan como relevantes por compatibilidad global. Se clasifican `NOT_RELEVANT` solo para `WI-CONSOLE-030` (`contractSyncReview`, mismos digests y método que WI-CONSOLE-026 a 029), porque el WI no cubre lifecycle del binding, identidad, workspaces, autenticación ni seguridad.
