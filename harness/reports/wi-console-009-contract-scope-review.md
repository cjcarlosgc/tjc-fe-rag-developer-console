# WI-CONSOLE-009 — Contract Sync de alcance legado

Este WI solo consume los DTOs de ProjectVersion/inventario de HU04. Los cuatro eventos listados abajo son anteriores a `planningBaseline: 2026-09-24-core-console-transition` y tratan límites de binding, identidad o roles; no modifican el contrato de idioma/framework ni el inventario. Se clasifican `NOT_RELEVANT` únicamente para este WI, sin cambiar sus estados/evidencias ni cerrarlos globalmente.

| Evento | Motivo para este WI |
| --- | --- |
| `CS-20260920-003` | Trata lifecycle de RepositoryBinding/Project; este corte solo sincroniza DTOs de inventario. |
| `CS-20260921-001` | Trata login y contrato de acceso, fuera del historial/inventario de ProjectVersion. |
| `CS-20260921-002` | Trata identidad/App y verificación GitHub, sin efecto en los DTOs consumidos por HU04. |
| `CS-20260921-003` | Trata workspaces, roles y permisos organizacionales, no cobertura de tests. |

`CS-CORE-20260927-001` no está clasificado como irrelevante: sigue siendo el evento en alcance, ACK y pendiente de RESOLVED tras completar la implementación verificada.
