# WI-CONSOLE-052 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-25
**Autoriza:** usuario (Human Reviewer), en el chat, vía la sesión coordinadora cross (`[TN]-Cross`, Piloto v2 del OE5).

## Cita literal

> «Apruebo WI-CONSOLE-052 con el corte opcional (mostrar layer e inclusionReason en el panel). En feature/jean; push/PR/merge solo después de que Core esté desplegado en Render, y avisa a [TN]-Cross al terminar.»

## Alcance aprobado

1. **Contrato:** espejar en un solo paso directo `interoperability-contract.md` a INTEROP-2.23 byte a byte desde Core `8c3eb0f73b805492ee46887e6024dc33254dbe6d` (`git show <rev>:<ruta>`, no el working tree), sha256 `5de10cb7c9717e10fed8ae34f462d4646f1ee768e60e8660feb61dfc6a468d83`. INTEROP-2.22 (`76f5e774…`, revisión `e4d6dd8b…`) es un paso intermedio solo para cruce; 2.23 lo subsume. SYSTEM-2.16 (`d0a492b4…`), GH-INTEROP-1.9 (`dedf00fa…`) y el árbol `schemas` (`8079ab73…`) no cambian (se verifica idénticos en ambas revisiones); `pnpm contracts:check` limpio sin cambio de `generated/`.
2. **Contract Sync:** acusar y resolver `CS-CORE-20261025-001` y `-002` solo con evidencia real; `-002` subsume a `-001` en INTEROP.
3. **Etiquetado:** `BELOW_RELEVANCE_THRESHOLD` en `RagDiscardReason`, etiqueta en español coherente con el glosario en `discardReasonLabel` y fallback robusto (`?? 'Descartado'`) en `RagSidePanel`.
4. **Tipos:** campos opcionales de INTEROP-2.22/2.23 en los tipos locales de la traza RAG (`layer`, `inclusionReason`, `configuration.strategy`, `relevanceThreshold`, `declaringClassMaxTokens`, `targetEvidenceMaxTokens`); `dependencyContext` no se consume.
5. **UI (corte opcional aprobado):** mostrar `layer` e `inclusionReason` del candidato en el panel RAG solo cuando existan, con etiquetas en español y fallback al valor crudo; mostrar `configuration.strategy` si el espacio y la UX lo justifican; mock con un candidato con `layer`/`inclusionReason` y un descarte `BELOW_RELEVANCE_THRESHOLD`.

## Fuera de alcance

`reasoningEffortMessage` (WI aparte), pendientes DR-1..4 de WI-047, desborde `pr52` a 320 px, WI-005/006, rutas, DTO de producto, realtime, primitives nuevas, polling; autoridad MAINTAINER/ADMIN sobre Functional Knowledge y rótulos DEMO sin cambios; push, PR, merge y `main` (solo después de que Core esté desplegado en Render, por orden del usuario). Revisión: `contract-reviewer`, `reviewer` y `ux-reviewer` independientes (máximo 2 ciclos). Una decisión no cubierta es `DECISION_REQUIRED`, aparcada.

> Nota del leader (hallazgo): `inclusionReason` NO existe en INTEROP-2.22/2.23 ni en el código de Core `8c3eb0f` (búsqueda en el contrato espejado y en `git grep` de Core: 0 resultados). Por «no inventes», no se añade ese campo. La razón de inclusión de un candidato la expresa en el contrato `layer` (capa que lo seleccionó); el corte opcional aprobado se cumple mostrando `layer` con rótulos en español. La parte «inclusionReason» queda aparcada y se informa a `[TN]-Cross`: si Core lo añade en un contrato futuro, será un WI aparte.
