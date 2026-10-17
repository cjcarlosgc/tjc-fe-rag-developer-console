# WI-CONSOLE-033 — clasificación de eventos Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

| Evento | targets | Decisión | Motivo |
|---|---|---|---|
| CS-CORE-20261012-007 | console | Se acusa y resuelve en este WI | SYSTEM/INTEROP-2.10 de WI-CORE-047; ver el acuse y la implementación de este WI. |
| CS-CORE-20261012-009 | console | Se acusa y resuelve en este WI | SYSTEM/INTEROP-2.11 de WI-CORE-049; posterior a -007 y la acota; -011 a su vez la reemplaza (cadena lineal -007 < -009 < -011). |
| CS-CORE-20261012-011 | console | Se acusa y resuelve en este WI | SYSTEM/INTEROP-2.12 de WI-CORE-049 (DEC-INF-002 aprobada as-built, sin cambio de comportamiento); sucede a -009/-010 y es la revisión objetivo del espejo (`864aa837`). Importado durante el WI por pedido del orquestador. |
| CS-CORE-20261012-008 | github-integration | No aplicable a Console (queda C-PENDING) | Espejo y límite de 300 archivos son de Integration; el harness no admite acuse para eventos sin `console` en `targets`. |
| CS-CORE-20261012-010 y -012 | sandbox | No aplicables a Console (no se importan; quedan en el outbox de Core) | Solo `SYSTEM`, sin acción para Console; -012 reemplaza a -010. El importador los copió y se retiraron del buzón junto con -008, sin tocar los ya existentes. |
| CS-20260920-003, CS-20260921-001/-002/-003 | históricos (sin scopePaths) | NOT_RELEVANT | Mismos digests y motivos que `wi-console-031-contract-sync-scope-review.md` (binding, identidad/roles, seguridad de binding, membresía); este WI no toca bindings, autorización, login ni Projects. |

Los eventos anteriores dirigidos a `github-integration` o `sandbox` permanecen `C-PENDING`, igual que en `wi-console-031-contract-sync-scope-review.md`.
