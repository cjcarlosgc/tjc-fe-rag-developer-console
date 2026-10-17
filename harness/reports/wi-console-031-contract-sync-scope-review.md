# WI-CONSOLE-031 — clasificación de eventos Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

| Evento | targets | Decisión | Motivo |
|---|---|---|---|
| CS-CORE-20261012-005 | console | Acusado y resuelto en este WI | INTEROP-2.9 y SYSTEM espejados desde `30b9acdf`; ver `wi-console-031-contract-sync-review.md` y `wi-console-031-implementation.md`. |
| CS-CORE-20261012-006 | github-integration | No aplicable a Console (queda C-PENDING) | Revisión del límite de 300 archivos del compare como propiedad de Integration; el harness no admite acuse ni NOT_RELEVANT para eventos sin `console` en `targets`. |
| CS-20260920-003 | histórico (sin scopePaths) | NOT_RELEVANT | Lifecycle del binding; este WI no toca bindings, UI de integraciones ni endpoints. |
| CS-20260921-001 | histórico | NOT_RELEVANT | Identidad, workspaces y roles; este WI no cambia autorización (solo el tratamiento de un 404 al responder). |
| CS-20260921-002 | histórico | NOT_RELEVANT | Autenticación y seguridad de binding; sin cambios de login, sesión ni cliente HTTP. |
| CS-20260921-003 | histórico | NOT_RELEVANT | Membresía y eventos organizacionales; sin cambios de Projects ni visibilidad. |

Los demás eventos del buzón dirigidos a `github-integration` o `sandbox` (`CS-CORE-20261009-012`, `20261010-001/-002`, `20261011-002/-003`) permanecen `C-PENDING`, igual que en `wi-console-029-contract-sync-scope-review.md`; no apuntan a Console.
