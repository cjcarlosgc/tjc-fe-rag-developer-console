# WI-CONSOLE-028 — revisión de alcance de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

WI de producto sin impacto contractual: `contractImpact=false`, `publishesContract=false`, sin `syncScopePaths`. Corrige estilos CSS (foco, contraste, desbordes), comportamiento accesible de cuatro pantallas y un marcador «—» en la tabla de experimentos; no toca DTO, rutas, errores del contrato, adapters live, binding, identidad ni seguridad.

Checkpoint `start` corrido de verdad por el Leader previo con `node harness/contract-sync.mjs check --work-item WI-CONSOLE-028 --checkpoint start --record`: `relevantPendingSyncIds: []`.

Eventos `C-PENDING` del inbox (CS-CORE-20261009-012, 20261010-001/-002, 20261011-002/-003 y CS-CORE-20261012-002/-003/-004): ninguno es relevante para este WI. No se acusa ni se resuelve ninguno; su estado global no cambia.

## Eventos históricos sin `scopePaths`

Los cuatro eventos históricos sin `scopePaths` (`CS-20260920-003`, `CS-20260921-001`, `-002`, `-003`) cuentan como relevantes por compatibilidad global. Se clasifican `NOT_RELEVANT` solo para `WI-CONSOLE-028` (`contractSyncReview`, mismos digests y método usados en WI-CONSOLE-021, -025, -026 y -027), porque el WI no cubre lifecycle del binding, identidad, workspaces, autenticación ni seguridad.
