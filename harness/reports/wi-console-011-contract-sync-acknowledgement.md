# WI-CONSOLE-011 — Acuse de Contract Sync

`CS-CORE-20261008-001` (fuente Core `WI-CORE-017`, `breaking: true`, revisión fuente `0e2cd1c1a35b5b6b59f1d5c5787e424293ce278f`) se importó a `harness/contract-sync/inbox/` el 2026-10-08 y está dirigido a Console. Este WI lo cubre: su alcance (`spec/contracts/system-contract.md` e `spec/contracts/interoperability-contract.md`) coincide con `syncScopePaths`. El acuse significa que Console aceptó hacerse cargo y enlazó `WI-CONSOLE-011`; no afirma que los espejos ya se sincronizaron ni que la UI adoptó los cambios.

Acción requerida: sincronizar byte a byte SYSTEM-2.6 e INTEROP-2.7 en `WI-CONSOLE-011` y adoptar los cambios de roles, `UNKNOWN`, Functional Knowledge, OE2, OE5, trace y evidencia en `WI-CONSOLE-012` a `WI-CONSOLE-019` y `WI-CONSOLE-020`.
