# WI-CONSOLE-021 — Acuse de Contract Sync

Los eventos `CS-CORE-20261008-002`, `CS-CORE-20261008-003`, `CS-CORE-20261008-004`, `CS-CORE-20261008-005`, `CS-CORE-20261008-006`, `CS-CORE-20261008-007`, `CS-CORE-20261009-008`, `CS-CORE-20261009-009`, `CS-CORE-20261009-010`, `CS-CORE-20261009-011`, `CS-CORE-20261009-013` (fuentes `WI-CORE-018`, `019`, `020`, `022`, `025` y `026`) están importados y dirigidos a Console. Este WI los cubre porque su alcance (`system-contract.md` e `interoperability-contract.md`) coincide con `syncScopePaths`. El acuse significa que Console aceptó hacerse cargo y enlazó `WI-CONSOLE-021`; no afirma que los espejos ni los ajustes de UI estén hechos.

Acción requerida: refrescar byte a byte los espejos SYSTEM, INTEROP y GH-INTEROP desde Core y adoptar lo ya implementado (guardas de `null`, `failureCode` abierto, límites y errores de OE2 y validación del trace) sin tocar `/evidence` ni las tasas, que dependen de `WI-CORE-027` y son de `WI-CONSOLE-020`.
