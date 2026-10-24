# WI-CONSOLE-043 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-21
**Autoriza:** usuario (Human Reviewer), en el chat de Console (vía la sesión coordinadora cross).

## Cita literal

> «Apruebo WI-CONSOLE-043 y WI-CONSOLE-044 tal como los propones, en ese orden. Las mejoras de UX siguen aparte, pendientes.»

## Alcance aprobado para WI-CONSOLE-043: espejar INTEROP-2.18 y procesar Contract Sync

1. Espejar byte a byte desde Core, revisión `5c82853c36a419e9839d5474ad9657f714aba4cb` (`git show <rev>:<ruta>`, no el working tree): `interoperability-contract.md` (`22b880d1…`), `github-integration-contract.md` (`6c553ee8…`), `system-contract.md` (`b70f9358…`) y el árbol `spec/contracts/schemas` con `examples/` (`a1ba9a19…`, incluye el esquema nuevo `realtime-events.schema.json`).
2. Regenerar tipos (`contracts:generate`/`contracts:check`) y actualizar las referencias vigentes de versión (SYSTEM/INTEROP-2.18/GH) en `spec/`.
3. Acusar y resolver `CS-CORE-20261021-001` (INTEROP-2.18, breaking del lado Core) solo con evidencia real; `CS-CORE-20261021-002` (github-integration) y `-003` (sandbox) no apuntan a Console: sin acuse.
4. Requiere `contract-reviewer` y `reviewer` independientes.

## Fuera de alcance

Cambios de código de producto, DTO, rutas o UI (los cubre WI-CONSOLE-044, que depende de este WI); cambios en otros repositorios.

## Notas de registro

- Revisión independiente por el agente `reviewer` (el implementer nunca se revisa a sí mismo); no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
- No hay push, PR ni merge; `main` no se toca.
