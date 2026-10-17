# WI-CONSOLE-010 — Revisión de alcance de Contract Sync históricos

Estos eventos anteriores a `planningBaseline: 2026-09-24-core-console-transition` no aplican al corte documental de estados de contratos Core/GH. Se conservan con su estado global y se excluyen solo de los checkpoints de WI-CONSOLE-010, con los hashes estables registrados en `harness/work-items.json`.

| Evento | Alcance original | Motivo de no aplicabilidad a WI-CONSOLE-010 |
| --- | --- | --- |
| `CS-20260920-003` | Ciclo de vida de Projects y bindings de repositorio | WI-CONSOLE-010 no cambia ni documenta esas rutas; solo replica textos de estado vigentes de las fuentes. |
| `CS-20260921-001` | Identidad, workspaces, roles y endpoints de acceso | El corte no modifica autenticación, DTOs, acceso ni comportamiento de esos endpoints. |
| `CS-20260921-002` | Implementación de identidad GitHub y seguridad del binding | No cambia login, autorización, errores ni cliente. |
| `CS-20260921-003` | Implementación de workspaces, roles y acceso organizacional | No cambia workspaces, membresía, roles, eventos ni consumo funcional. |

La clasificación es solo para WI-CONSOLE-010 y no altera el estado de los cuatro eventos. Los eventos actuales resueltos y cualquier evento Contract Sync que llegue para las fuentes corregidas siguen aplicando normalmente.
