# WI-CONSOLE-027 — revisión de alcance de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

WI de producto sin impacto contractual: `contractImpact=false`, `publishesContract=false`, sin `syncScopePaths`. Cambia solo el texto de un error ya documentado de OE2, retira un hook sin consumidores y ajusta configuración y pruebas de Vitest; no toca DTO, rutas, errores del contrato ni adapters live.

Checkpoint `start` corrido de verdad: `node harness/contract-sync.mjs check --work-item WI-CONSOLE-027 --checkpoint start --record` devuelve `relevantPendingSyncIds: []`.

Eventos `C-PENDING` en el inbox (CS-CORE-20261009-012, 20261010-001/-002, 20261011-002/-003 y CS-CORE-20261012-002/-003/-004): ninguno es relevante para este WI (GitHub Integration, `checkId`, `projectRoot` Core→Sandbox, refresco de espejos y correcciones de `sourceRevision`). No se acusa ni se resuelve ninguno; su estado global no cambia.

## Eventos históricos sin `scopePaths`

Al correr `implementation-delivery`, los cuatro eventos históricos sin `scopePaths` (`CS-20260920-003`, `CS-20260921-001`, `-002`, `-003`) aparecen como relevantes por compatibilidad global. Se clasifican `NOT_RELEVANT` solo para `WI-CONSOLE-027` (`contractSyncReview`, mismos digests usados en WI-CONSOLE-021, -025 y -026); el WI no toca binding, identidad, workspaces ni seguridad.
