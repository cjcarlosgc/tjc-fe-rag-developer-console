# Contract Sync heredado — alcance de WI-CONSOLE-001

Este WI modifica planificación, specs y Harness, no despliega ni verifica de nuevo el runtime. Los siguientes inbox siguen en `ACKNOWLEDGED` y **no** se convierten a `C-RESOLVED`: sus acciones de implementación/despliegue deben revisarse al seleccionar un WI de producto o publicación relacionado.

| Evento | Motivo de diferimiento solo para WI-CONSOLE-001 |
| --- | --- |
| CS-20260920-003 | Lifecycle de binding y adaptación live; los contratos están espejados, pero este corte no certifica entorno desplegado. |
| CS-20260921-001 | Orden de publicación de login GitHub frente a Core bundle A; no se ejecuta despliegue aquí. |
| CS-20260921-002 | Identidad GitHub y binding seguro del bundle A; mantiene verificación de entorno fuera del corte documental. |
| CS-20260921-003 | Consumo de workspaces/roles bundle B y verificaciones reales; no se presume que todos los puntos de despliegue quedaron cerrados. |

El diferimiento se limita al WI HARNESS 001, se reporta en cada checkpoint y no equivale a resolver la acción. Cualquier WI de producto debe volver a evaluar estos eventos. Si una contradicción contractual nueva aparece, se detiene el corte.

## Checkpoints invalidados

El `start` de 2026-09-24T21:38:49.664Z y `implementation-delivery` de 2026-09-24T21:59:36.787Z registraron `relevantPendingSyncIds: []` con la semántica anterior, que omitía `ACKNOWLEDGED`. No son evidencia válida. Se retiraron del estado activo y se repitieron en orden a las 23:03:14.176Z y 23:03:14.334Z, ahora con los cuatro `deferredSyncIds` explícitos; las marcas originales se conservan aquí y en el diff de Git.
