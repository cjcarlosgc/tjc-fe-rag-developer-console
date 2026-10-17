# WI-CONSOLE-026 — revisión de alcance de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

WI de producto sin impacto contractual: `contractImpact=false`, `publishesContract=false`, sin `syncScopePaths`, y `specPaths` solo en la Feature 014 y el reporte de aprobación. No cambia DTO, rutas, errores del contrato ni adapters live: solo el texto que la UI muestra para códigos que ya existen y la omisión de dos campos en corridas antiguas del mock.

Checkpoint `start` corrido de verdad: `node harness/contract-sync.mjs check --work-item WI-CONSOLE-026 --checkpoint start --record` devuelve `relevantPendingSyncIds: []` (acusados `CS-20260920-003`, `CS-20260921-001`, `-002`, `-003`; resuelto `CS-20260920-002`).

Eventos `C-PENDING` en el inbox, ninguno relevante para este WI (no tocan sus rutas ni exigen cambio de código de esta pantalla):

| Evento | Origen | Efecto | Clasificación para WI-CONSOLE-026 |
| --- | --- | --- | --- |
| CS-CORE-20261009-012 | WI-CORE-026 | GH-INTEROP-1.3, `checkId` de checks (GitHub Integration) | Fuera de alcance |
| CS-CORE-20261010-001 | WI-CORE-034 | GH-INTEROP-1.4, identidad durable del Check | Fuera de alcance |
| CS-CORE-20261010-002 | WI-CORE-034 | alinea SYSTEM-2.6/INTEROP-2.7 con GH-INTEROP-1.4 | Fuera de alcance |
| CS-CORE-20261011-002 | WI-CORE-037 | `projectRoot` opcional Core→Sandbox | Fuera de alcance |
| CS-CORE-20261011-003 | WI-CORE-036 | refresco de espejos SYSTEM-2.7/INTEROP-2.8 | Fuera de alcance |
| CS-CORE-20261012-002 a -004 | WI-CORE-013/028/029 | corrigen solo `sourceRevision` de `-016` a `-018` (procedencia) | Fuera de alcance; no cambian copy ni comportamiento |

No se crea entrada `contractSyncReview` ni se acusa o resuelve ninguno: el validador no los considera relevantes para este WI y su estado global no cambia. No se inventa relevancia. Los textos de error (`EXPERIMENT_WORKER_LOST`, `UNSUPPORTED_PROJECT`) son copy de Console sobre códigos ya documentados; el contrato no prescribe su redacción.

## Eventos históricos sin `scopePaths`

Al correr `implementation-delivery` los cuatro eventos históricos sin `scopePaths` (`CS-20260920-003`, `CS-20260921-001`, `-002`, `-003`) aparecen como relevantes por compatibilidad global (el checkpoint `start` los había dejado fuera). Se clasifican `NOT_RELEVANT` solo para `WI-CONSOLE-026`, con los mismos digests ya usados en `WI-CONSOLE-021` y `-025` (`contractSyncReview`); su estado global no cambia. El WI no toca binding, identidad, workspaces ni seguridad.
