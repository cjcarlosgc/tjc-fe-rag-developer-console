# WI-CONSOLE-010 — Checkpoint Contract Sync `start`

- **Work item:** `WI-CONSOLE-010` / `ST-CONSOLE-012`.
- **Resultado:** aprobado; no había eventos relevantes pendientes al inicio.
- **Eventos resueltos visibles:** `CS-20260920-002`, `CS-20260924-001`, `CS-CORE-20260927-001`, `CS-CORE-20260927-003`, `CS-GH-20260926-001`, `CS-GH-20260927-001`.
- **Eventos históricos no relevantes:** los cuatro eventos previos a la baseline están excluidos solo para este WI mediante `contractSyncReview` y el reporte de alcance asociado.
- **Eventos nuevos de corrección canónica:** aún no recibidos en esta rama; se volverá a importar y comprobar en el siguiente checkpoint antes de copiar los contratos.

Comando ejecutado:

```sh
node harness/contract-sync.mjs check --checkpoint start --work-item WI-CONSOLE-010 --record
```

```json
{"checkpoint":"start","workItem":"WI-CONSOLE-010","relevantPendingSyncIds":[],"acknowledgedSyncIds":[],"resolvedSyncIds":["CS-20260920-002","CS-20260924-001","CS-CORE-20260927-001","CS-CORE-20260927-003","CS-GH-20260926-001","CS-GH-20260927-001"],"deferredSyncIds":[],"notRelevantSyncIds":[],"checkedAt":"2026-09-28T02:02:41.580Z"}
```
