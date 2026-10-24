# WI-CONSOLE-051 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-24
**Autoriza:** usuario (Human Reviewer), en el chat, vía la sesión coordinadora cross.

## Cita literal

> «si» (respuesta a la propuesta literal de cross: WI-CONSOLE-051, STANDARD, `contractImpact`, sin cambio de UI; espejo en un solo paso directo a INTEROP-2.21 / SYSTEM-2.16 / GH-INTEROP-1.9 y esquemas, con regeneración de tipos, Contract Sync -003/-004 y alineación opcional de `ExperimentResultsResponse`).

## Alcance aprobado

1. Espejar byte a byte desde Core, revisión `2318b9df292b337db4998f04b66b0457f1df8e3f` (`git show <rev>:<ruta>`, no el working tree): `interoperability-contract.md` (INTEROP-2.21, `7f946d55…`), `system-contract.md` (SYSTEM-2.16, `d0a492b4…`), `github-integration-contract.md` (GH-INTEROP-1.9, `dedf00fa…`) y el árbol `spec/contracts/schemas` con `examples/` (`8079ab73…`), sin pasar por 2.20/2.15. Incluye el esquema nuevo `github-webhook-event.schema.json` y 15 ejemplos (`manifest.json`).
2. Cruzar los digests intermedios de `CS-CORE-20261024-003` (revisión `208c3bdf…`: INTEROP-2.20 `f0b39578…`, GH-1.9 `dedf00fa…`, SYSTEM-2.15 `f3b61da5…`, schemas `8079ab73…`); GH y schemas deben ser idénticos en `208c3bdf` y `2318b9df`.
3. Regenerar tipos (`pnpm contracts:generate`; `generated/` cambia por el esquema nuevo) hasta que `pnpm contracts:check` quede limpio.
4. Acusar y resolver `CS-CORE-20261024-003` y `-004` solo con evidencia real (`-004` SUPERA a `CS-CORE-20261021-001..004` y `CS-CORE-20261024-001..003` en INTEROP/SYSTEM; se documenta). `CS-CORE-20261024-001` (github-integration) y `-002` (sandbox) no apuntan a Console: se clasifican `NOT_RELEVANT` con motivo.
5. Actualizar referencias vigentes de versión (SYSTEM-2.14→2.16, INTEROP-2.19→2.21, GH-INTEROP-1.8→1.9) en `spec/` y solo comentarios de versión vigentes en el código; sin tocar reportes históricos.
6. Incluido (opcional aprobado): alinear el tipo local `ExperimentResultsResponse` de `app/src/experiments/liveMapping.ts` con INTEROP-2.20 (`targetId`; `analysisRunId` y `symbol` opcionales; ningún código los lee hoy) con prueba mínima; si cambia comportamiento o rompe consumidores, se aparta como `DECISION_REQUIRED` sin bloquear el espejo.

## Fuera de alcance

Cambios de UI, rutas, DTOs de producto o tiempo real; no se ajusta `reasoningEffortMessage` (WI aparte, aunque la prosa de INTEROP-2.21 cambie el marco de `reasoning_effort`: queda anotado como pendiente); push, PR y merge; `main`. Requiere `contract-reviewer` y `reviewer` independientes (máximo 2 ciclos); `ux-reviewer` no aplica (`uiImpact=false`).
