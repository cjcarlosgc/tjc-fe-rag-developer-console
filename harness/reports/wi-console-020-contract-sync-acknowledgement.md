# WI-CONSOLE-020 — Acuse de Contract Sync

Los eventos `CS-CORE-20261009-014`, `CS-CORE-20261009-015` (fuente `WI-CORE-027`, `breaking: true`) están importados y dirigidos a Console. Este WI los cubre porque su alcance (`interoperability-contract.md`) coincide con `syncScopePaths`. El acuse significa que Console aceptó hacerse cargo; no afirma adopción. `WI-CORE-027` cerró `W-DONE` el 2026-10-10 sin emitir eventos nuevos; el contenido de estos eventos se verificó idéntico al outbox de Core.

Acción requerida: tipar y mockear `/evidence` contra el bloque congelado de §6.16 (`| null` es «sin dato», nunca 0), tipar las tasas y las medias de duración como `number | null`, mostrar «sin datos» y usar `evaluableRepetitions`/`nonEvaluableRepetitions`.

## CS-CORE-20261010-003

Importado del outbox de Core y acusado por `WI-CONSOLE-020`. Console acepta la actualización documental de GH-INTEROP-1.4 y de las referencias SYSTEM-2.6/INTEROP-2.7 sobre identidad durable, concurrencia y duplicados de Checks. El acuse no afirma que los tres espejos ya estén sincronizados ni activa rutas, despliegue o cutover; esas acciones siguen siendo las requeridas por el evento.

### Resolución

Los espejos `system-contract.md`, `interoperability-contract.md` y `github-integration-contract.md` se sincronizaron byte por byte contra la revisión canónica de Core `46c7046d015d18e49b0e737f6b61cceef1d6889c`. Se verificó igualdad exacta con `cmp`. No se modificaron rutas, código de producto, despliegue ni cutover.
