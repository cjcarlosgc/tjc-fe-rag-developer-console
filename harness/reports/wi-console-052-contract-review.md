# WI-CONSOLE-052 — revisión de contrato

Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Veredicto: APPROVED** (sin hallazgos bloqueantes; 2 observaciones menores).

## Verificaciones propias

| # | Comprobación | Resultado |
|---|---|---|
| 1 | `interoperability-contract.md` local == `git show 8c3eb0f:…` (cmp) y sha256 `5de10cb7…ea6468d83` | OK |
| 1 | `system-contract.md` `d0a492b4…` y `github-integration-contract.md` `dedf00fa…` idénticos en `8c3eb0f`, `e4d6dd8b`, `2318b9df` y local | OK |
| 1 | Árbol `schemas/` (receta indicada) `8079ab73…` idéntico en los 3 commits (git archive) y local; sin diff en `schemas/` ni `generated/` | OK |
| 1 | INTEROP-2.22 en `e4d6dd8b` = `76f5e77431969995d359fb973f58c9d94ccd43c12c3429557e45806a72a29c43` | OK |
| 1 | `pnpm contracts:check` | exit 0, limpio |
| 2 | `types.ts` vs §6.7 (líneas 524-526, 563, 579-582): `RagDiscardReason` (+`BELOW_RELEVANCE_THRESHOLD`), `RagContextStrategy`, `RagContextLayer`, `layer?: … \| null`, `strategy?`, `relevanceThreshold?`, `declaringClassMaxTokens?`, `targetEvidenceMaxTokens?` | coinciden en nombres, valores y opcionalidad |
| 2 | `inclusionReason` | no existe en el contrato ni en `app/src` (grep vacío) |
| 3 | `CS-CORE-20261025-001/-002`: `sourceRevision` `e4d6dd8b` / `8c3eb0f` correctos; ambos `C-RESOLVED` con acuse y resolución; `-002` subsume a `-001` y el espejo fue directo 2.21→2.23 (el contrato local no es 2.22; su digest es el de 2.23) | honesto con la evidencia |
| 4 | Referencias vigentes: `spec/README.md`, `constitution/architecture.md`, `013/spec.md`, `013/plan.md` en INTEROP-2.23; las demás menciones 2.20–2.22 están en el propio contrato (historial) y en `011/spec.md` (campos «de INTEROP-2.22», correcto); `013/tasks.md` ST-053 histórico intacto | OK |
| 5 | Rutas/DTO de producto: el diff de `app/src` no toca `api.ts` ni rutas; `mockBackend.ts` solo añade `layer`/`strategy` a la traza demo y cambia un motivo de descarte demo; el único cambio en tipos es aditivo y opcional | sin cambio |

## Observaciones (no bloquean)

1. `dependencyContext.tokenCount` hasta 500 (2.23): Console no lo consume ni lo tipa; correcto, solo conviene que el reporte lo siga diciendo así.
2. `CHANGELOG.md` no figura en el diff actual; el cierre del WI (leader) debe registrarlo, según AGENTS.md.

Los 2.21→2.23 se verificaron con `git show`/`git archive`, sin usar el working tree de Core.
