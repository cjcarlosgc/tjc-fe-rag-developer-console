# Harness V2 — Developer Console

## Roles, contexto y handoff

Los únicos agentes permanentes son `leader`, `sdd-analyst`, `implementer`, `contract-reviewer`, `ux-reviewer` y `reviewer`. El `leader` es el único dueño de `harness/state.json`, orquesta la delegación y consolida el fan-in; no sustituye decisiones humanas ni una revisión independiente. Quien implementa nunca aprueba su propio corte final. No existe un `security-reviewer`: las comprobaciones pertinentes pertenecen al `reviewer`.

Cada subagente debe devolver este handoff, incluso si queda bloqueado:

```json
{
  "status": "APPROVED | CHANGES_REQUESTED | BLOCKED | DECISION_REQUIRED",
  "findings": [],
  "blockers": [],
  "filesAffected": [],
  "evidence": [],
  "recommendedNextStep": ""
}
```

El líder entrega a cada rol únicamente el contexto que necesita:

| Rol | Contexto mínimo |
| --- | --- |
| `sdd-analyst` | HU/SDD activa, estados funcionales de UI, dependencias y contratos pertinentes. |
| `implementer` | Corte aprobado, componentes/rutas afectados, criterios y contrato vigente. |
| `ux-reviewer` | Pantallas/componentes cambiados, flujo, estados y criterios UX; no internals del RAG. |
| `contract-reviewer` | Contrato Core consumido, adapters/clientes, `CONTRACT_SYNC` y diff. |
| `reviewer` | Diff, criterios aprobados, pruebas y evidencia de gates. |

## Estados, decisiones y delegación

`SELECTED -> SPEC_VERIFIED -> AWAITING_APPROVAL -> IN_PROGRESS -> IN_REVIEW -> DONE`. `BLOCKED` y `DECISION_REQUIRED` pueden alcanzarse desde cualquier estado no terminal. `DONE` depende de gates ejecutables, no de una afirmación en un handoff.

1. El líder registra el work item (incluidos `storyIds`, `sprint`, paths e impactos UI/contrato) y hace PULL de `CONTRACT_SYNC` en `start`.
2. `sdd-analyst` revisa solo backlog, constitución, feature, transversales y contratos del corte. Evalúa `PENDING`/`PROPOSED` por ID y campo `Blocks`; solo una decisión que alcanza el work item bloquea `SPEC_VERIFIED`. El resultado queda en `decisionGate`, sin duplicar decisiones.
3. Si se plantea cambio de comportamiento, contrato o arquitectura, el líder espera aprobación humana en `AWAITING_APPROVAL`. Si el contrato está en discusión, activa antes al `contract-reviewer`.
4. `implementer` realiza únicamente el corte aprobado y hace PULL en `implementation-delivery` antes de entregarlo. Si necesita una capacidad no soportada por Core, no inventa DTO, endpoint ni mock presentado como integración: escala `DECISION_REQUIRED` o emite sync hacia Core solo si la necesidad contractual ya fue aprobada.
5. El líder hace PULL en `before-review` y abre revisiones compatibles en paralelo; después consolida el fan-in:

   - Cambio no visual: `reviewer` + `contract-reviewer` si hay impacto contractual.
   - Cambio UI: `reviewer` + `ux-reviewer` + `contract-reviewer` si la UI consume o cambia integración real.

6. Si una revisión pide correcciones, el líder vuelve a `IN_PROGRESS`. Se permiten como máximo dos ciclos `implementer <-> reviewer`; el tercero pasa a `BLOCKED` o `DECISION_REQUIRED` con una pregunta concreta.
7. Antes de `DONE`, el líder hace PULL en `before-done`, actualiza gates/evidencia y ejecuta `node harness/validate-harness.mjs`. También conserva los comandos concretos de lint/test/build. Para un work item cerrado se registra el resultado y `activeWorkItem` vuelve a `null`.

El ejemplo ejecutable está en `harness/examples/fan-out-fan-in.json` y modela el fan-out UI+integración. El líder omite de ese fan-out únicamente roles cuyos impactos estén marcados como no aplicables.

## Gates ejecutables

Los valores permitidos son `PASSED`, `FAILED`, `NOT_APPLICABLE` y `NOT_RUN`.

- Siempre antes de `DONE`: `sddVerified`, `implementationCompleted`, `independentReviewPassed`, `technicalChecksPassed`, `interopSyncChecked`, `noMocksPresentedAsLive`, `noBlockingDecisions` y `retryLimitRespected` deben ser `PASSED`.
- Si `uiImpact=true`, `uxReviewed` debe ser `PASSED`; en caso contrario es `NOT_APPLICABLE`.
- Si `contractImpact=true`, `contractReviewed`, `canonicalContractSynced` y `contractSyncPublished` deben ser `PASSED`; en caso contrario son `NOT_APPLICABLE`.
- `interopSyncChecked` falla si el último PULL lista eventos relevantes `PENDING` o una incompatibilidad conocida. Un sync no relevante no bloquea el work item.

El validador comprueba estas relaciones, la forma del estado, los roles exactos, el protocolo y el ejemplo. No reemplaza las pruebas de la aplicación: su evidencia queda en `activeWorkItem.evidence` y en el reporte de cierre.

## CONTRACT_SYNC persistente

El protocolo vive en `harness/contract-sync/`. Console es principalmente consumidor de contratos de Core: importa eventos persistentes al `inbox` y ejecuta `check` en `start`, `implementation-delivery`, `before-review` y `before-done`. El resultado se guarda en `coordination.pullCheckpoints`.

Console puede publicar un evento persistente en su `outbox` dirigido a `core` solo cuando una necesidad contractual explícitamente aprobada exige intervención de Core. Publicar notifica; no modifica Core, Sandbox ni ningún servicio real. El emisor no cambia el estado de las copias importadas por los consumidores.

## Stitch, handoffs externos y entrega

Stitch no es agente ni gate. Puede permanecer como referencia visual histórica, pero la fuente de verdad de comportamiento, accesibilidad y contratos es la SDD. `ux-reviewer` comprueba la experiencia realmente implementada: patrones existentes, navegación, jerarquía, loading/error/empty/success, feedback, accesibilidad básica, responsive aplicable y que no se prometan capacidades ausentes de Core.

Un handoff externo es un insumo no confiable: el líder distingue decisiones aprobadas, propuestas y pendientes y consolida solo las primeras en la spec canónica. La política de commits, revisión acumulada y push sigue `spec/constitution/delivery-workflow.md`; este harness no autoriza push, PR, merge ni cambios de infraestructura.
