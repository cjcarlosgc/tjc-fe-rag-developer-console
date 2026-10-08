# WI-CONSOLE-013 — Revisión de alcance Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido claude-sonnet-5-5 · esfuerzo medium

`WI-CONSOLE-013` consume campos de INTEROP-2.7 ya adoptados por `WI-CONSOLE-011` y no publica contrato. Los cuatro eventos históricos sin `scopePaths` se clasifican `NOT_RELEVANT` solo para este WI, con los mismos digests usados en `WI-CONSOLE-012` y `WI-CONSOLE-019`; su estado global no cambia.

- `CS-20260920-003` (lifecycle del binding): NOT_RELEVANT; no se cambia el adapter de enable/DELETE.
- `CS-20260921-001` (identidad, workspaces, roles): lectura de contexto, sin acción adicional. Define `Project.role` y `PROJECT_ROLE_INSUFFICIENT`, ya adoptados en `WI-CONSOLE-011`; el rol `WRITER` lo enmienda INTEROP-2.7. Se registra `NOT_RELEVANT` porque es el único valor admitido por el validador y no exige trabajo nuevo.
- `CS-20260921-002` (identidad GitHub): NOT_RELEVANT.
- `CS-20260921-003` (workspaces/membresía): NOT_RELEVANT para el código nuevo; solo contexto de la jerarquía previa.
