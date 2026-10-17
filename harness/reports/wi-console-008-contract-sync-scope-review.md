# WI-CONSOLE-008 — Revisión de alcance de Contract Sync históricos

Estos eventos `ACKNOWLEDGED` preceden a `planningBaseline: 2026-09-24-core-console-transition`. Se revisaron por separado porque sus snapshots no están `C-RESOLVED`; se excluyen únicamente de los checkpoints de WI-CONSOLE-008. La clasificación no altera sus eventos ni los cierra para otros WIs.

| Evento | Alcance de la solicitud histórica | Motivo de no aplicabilidad a WI-CONSOLE-008 |
| --- | --- | --- |
| `CS-20260920-003` | Ciclo de vida del Project/binding: baja lógica, reactivación y orden de validaciones del binding bajo INTEROP-2.3. | El WI cubre elegibilidad temporal de PR respecto de `RepositoryBinding.createdAt` y ocultamiento de Runs anteriores; no modifica operaciones de ciclo de vida del binding. |
| `CS-20260921-001` | Identidad GitHub, workspaces/roles, errores de autorización y compatibilidad de rutas bajo SYSTEM/INTEROP-2.4. | El WI no cambia login, roles, workspaces, permisos ni esos DTOs; las rutas y formas de respuesta quedan iguales. |
| `CS-20260921-002` | Comportamiento del bundle de identidad GitHub y seguridad del binding. | El WI no cambia autenticación, permisos ni autorización de bindings; trata solo fecha de creación del PR y visibilidad de Runs. |
| `CS-20260921-003` | Implementación del bundle organizacional: workspaces, roles, membresía, acceso y eventos de acceso. | El WI no cambia la superficie organizacional, membresía, workspace ni eventos de acceso; trata elegibilidad temporal y ocultamiento de Runs. |

La fecha de los cuatro eventos es anterior a la línea base indicada. Los campos `contractSyncReview` de `WI-CONSOLE-008` registran sus digests estables y enlazan a este reporte según el protocolo del Harness.
