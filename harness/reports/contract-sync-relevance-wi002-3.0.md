# Relevancia Contract Sync — WI-CONSOLE-002

Fecha: 2026-09-24. Clasificación por alcance de WI, no cierre de eventos.

El WI-CONSOLE-002 elimina pantallas, rutas, adapters y fixtures de entrada manual ZIP, generación manual y descarga legacy. Los eventos siguientes no gobiernan esos flujos: se registran como `NOT_RELEVANT` solo para este WI. Los YAML de inbox permanecen sin modificar y sus estados `ACKNOWLEDGED` continúan abiertos para los trabajos a los que sí aplican.

| Evento | Estado | Relevancia en WI-CONSOLE-002 | Qué queda pendiente / próximo WI |
| --- | --- | --- | --- |
| CS-20260920-003 | ACKNOWLEDGED | No relevante: implementa el ciclo de vida de RepositoryBinding y baja lógica de Project; las pantallas retiradas no cambian ese contrato. | Revalidar consumo del binding cuando WI-CONSOLE-003 adapte Console a GitHub Integration. |
| CS-20260921-001 | ACKNOWLEDGED | No relevante: define login GitHub, workspaces, roles y seguridad de acceso; WI-CONSOLE-002 no toca autenticación ni acceso. | Es antecedente de CS-20260921-002/003; mantener el vínculo y revisar la frontera en WI-CONSOLE-003. |
| CS-20260921-002 | ACKNOWLEDGED | No relevante: implementa identidad GitHub y permisos/verificación de App; los adapters de ZIP y artefactos no participan en ese flujo. | El orden de despliegue y la validación real permanecen pendientes; revisar responsabilidades al extraer GitHub. |
| CS-20260921-003 | ACKNOWLEDGED | No relevante: implementa workspaces, roles, acceso organizacional y SubscribeAck; WI-CONSOLE-002 no cambia esos consumidores. | Mantener pendientes las verificaciones organizacionales externas y revisar contrato/adaptadores en WI-CONSOLE-003. |

CS-20260920-002 y CS-20260924-001 ya están `RESOLVED`/`C-RESOLVED`; no son bloqueantes. Los digests en `harness/work-items.json` cubren el contenido completo salvo el campo mutable `status`; cualquier cambio al requisito invalida la clasificación. La excepción solo reduce el bloqueo del WI indicado y nunca convierte `ACKNOWLEDGED` en `C-RESOLVED`.
