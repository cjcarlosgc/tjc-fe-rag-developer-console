# WI-CONSOLE-032 — clasificación de eventos Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

El WI no cambia contrato (`contractImpact: false`). Los cuatro eventos históricos sin `scopePaths` se tratan como globales; se clasifican `NOT_RELEVANT` para este WI con el mismo digest que en `wi-console-031-contract-sync-scope-review.md` (contenido sin cambios).

| Evento | Decisión | Motivo |
|---|---|---|
| CS-20260920-003 | NOT_RELEVANT | Lifecycle del binding; este WI solo consume la publicación de tests del Run. |
| CS-20260921-001 | NOT_RELEVANT | Identidad, workspaces y roles; sin cambios de autorización. |
| CS-20260921-002 | NOT_RELEVANT | Autenticación y seguridad de binding; sin cambios de login, sesión ni cliente HTTP. |
| CS-20260921-003 | NOT_RELEVANT | Membresía y eventos organizacionales; sin cambios de Projects ni visibilidad. |

Los eventos dirigidos a `github-integration` o `sandbox` permanecen `C-PENDING`; no apuntan a Console.
