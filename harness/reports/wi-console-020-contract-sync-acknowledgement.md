# WI-CONSOLE-020 — Acuse de Contract Sync

Los eventos `CS-CORE-20261009-014`, `CS-CORE-20261009-015` (fuente `WI-CORE-027`, `breaking: true`) están importados y dirigidos a Console. Este WI los cubre porque su alcance (`interoperability-contract.md`) coincide con `syncScopePaths`. El acuse significa que Console aceptó hacerse cargo; no afirma adopción. `WI-CORE-027` sigue `W-IN_REVIEW`: si su revisión cambia el contrato, Core emitirá otro evento y el contenido de estos puede variar.

Acción requerida: tipar y mockear `/evidence` contra el bloque congelado de §6.16 (`| null` es «sin dato», nunca 0), tipar las tasas y las medias de duración como `number | null`, mostrar «sin datos» y usar `evaluableRepetitions`/`nonEvaluableRepetitions`.
