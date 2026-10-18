# Harness V3 — Console

El Harness ejecuta **work items locales** registrados en `harness/work-items.json`. La planificación de épicas, HU, casos, ideas y subtareas vive en `spec/`; `harness/state.json` guarda el WI activo y snapshots verificables de los WI cerrados. Ver `spec/constitution/planning-model.md` para IDs y estados de cada nivel.

## Ciclo de un WI

`W-PLANNED → W-READY → W-SELECTED → W-SPEC_VERIFIED → W-AWAITING_APPROVAL → W-IN_PROGRESS → W-IN_REVIEW → W-DONE`. `W-BLOCKED`, `W-DECISION_REQUIRED` y `W-CANCELLED` conservan causa y evidencia. Un WI terminado sale de `activeWorkItem`, pero su snapshot completo persiste en `completedWorkItems`, además del reporte y Git. `W-READY` exige taskIds, HU, componente, criterios, dependencias y rutas; `W-SELECTED` designa el corte activo.

1. **Pre-tarea:** leader selecciona WI, verifica `dependsOn`, hace PULL `start` de Contract Sync y encarga a sdd-analyst la revisión de spec, decisiones `Blocks`, aceptación y riesgos de datos. Contract-reviewer evalúa contratos si aplica. Un cambio funcional o arquitectónico espera aprobación humana en `W-AWAITING_APPROVAL`. Solo decisiones que bloquean este WI impiden `W-SPEC_VERIFIED`.
2. **Durante la tarea:** implementer trabaja el corte aprobado. Subtareas independientes pueden dividirse entre implementers en paralelo; una dependencia real se respeta y no se marca completa antes de su precedente. Leader consolida los handoffs. Antes de entregar, PULL `implementation-delivery`, checks técnicos y evidencia.
3. **Post-tarea:** PULL `before-review`, revisión independiente y ux-reviewer para UI, más contract-reviewer si afecta contrato; roles compatibles pueden revisar en paralelo. Antes de declarar el WI terminado, la revisión independiente la hace el agente `reviewer`: leader presenta diff, criterios de aceptación, pruebas y evidencia, y consolida su veredicto. El usuario revisa un WI cuando lo pide. El rol `ux-reviewer` permanece como revisión especializada obligatoria para cambios UI. Leader hace fan-in, corrige hallazgos (máximo dos ciclos), PULL `before-done`, valida gates y registra el cierre. Después hay revisión acumulada del rango antes de cualquier push solicitado.

Las asignaciones pueden quedar vacías hasta que se designen sus responsables. Al entrar en `W-IN_REVIEW`, `implementationAgent` debe identificar al implementer y `reviewAgent` al revisor independiente: usa `reviewer` por defecto y `human-reviewer` si el usuario pidió revisar ese WI él mismo. El implementer nunca puede revisarse a sí mismo. Los cortes con UI siguen requiriendo el rol separado `ux-reviewer`; no lo sustituye la revisión técnica independiente. Una delegación de revisión no sustituye la aprobación humana de alcance/arquitectura exigida en `W-AWAITING_APPROVAL`.

El implementer no aprueba su propio corte. Registra el veredicto técnico humano como handoff con `agent: human-reviewer`; si el usuario delegó, registra el handoff del `reviewer`. El handoff tiene `status` de veredicto (`APPROVED|CHANGES_REQUESTED|BLOCKED|DECISION_REQUIRED`), `findings`, `blockers`, `filesAffected`, `evidence` y `recommendedNextStep`; `evidence` enlaza el reporte verificable en `harness/reports/`. El handoff separado de `ux-reviewer` sigue siendo obligatorio para UI; el veredicto no sustituye los gates.

**Trazabilidad de modelo.** Todo handoff de agente IA y todo reporte nuevo en `harness/reports/` generado por un agente declara con qué modelo se hizo la tarea: en handoffs, el objeto `executedBy: { agent, configuredModel, servedModel, effort }`; en reportes Markdown, la línea `Modelo: <agent> · configurado <exactModelId> · atendido <exactModelId|unknown> · esfuerzo <low|medium|high|xhigh>`. `configuredModel` y `effort` se copian del proveedor seleccionado en `harness/agent-profiles.yaml` (`claude` o `codex`). `servedModel` es el modelo realmente observado; si no se pudo observar, se escribe `unknown`, nunca se asume igual al configurado. Una escalada `implementer → implementer-high` se anota con motivo breve. El handoff del `human-reviewer` no lleva modelo. El campo es informativo, no sustituye gates ni la revisión humana y el validador no lo exige.

**Nombre visible de subagentes por proveedor.** En Codex, delega cada WI con `task_name` en el formato `rol_gpt6_luna_esfuerzo___wi_componente_numero_corte`; usa solo minúsculas, dígitos y `_`, exactamente tres `_` como separador antes de `wi`. El modelo actual es `gpt6_luna`; el esfuerzo se copia del perfil Codex activo (`medium`, `high` o `xhigh`). Convierte guiones del rol a `_` (`sdd_analyst`, `contract_reviewer`, `ux_reviewer`, `implementer_high`, `merge_reviewer`); usa `console` como componente, el número WI con tres dígitos y un slug breve de corte (`a`, `b`, etc.). Ejemplo: `contract_reviewer_gpt6_luna_high___wi_console_020_b`. El `task_name` es solo la etiqueta visible: selecciona el perfil por su `name` en `~/.codex/agents/<rol>.toml` y conserva el primer reporte con el formato humano `[contract-reviewer::GPT-6 Luna / high] · WI-CONSOLE-020 · Corte B`. No uses `nickname_candidates` para titular tareas. En Claude, conserva `description` = `[<rol>::<modelo>] · WI-… · <corte>`; el hook `.claude/hooks/check-subagent-title.mjs` sigue validando ese formato.

**Delegación de implementación.** El leader delega toda implementación de `app/` a `implementer` o `implementer-high` con el perfil del proveedor seleccionado, salvo un **cambio mínimo**: hasta 10 líneas en no más de 2 archivos, solo pruebas, fixtures, configuración de pruebas o texto, y sin lógica de producto, migraciones, contratos, autorización, concurrencia ni seguridad. Todo lo demás, y cualquier duda, se delega. Un cambio mínimo hecho por el leader se declara: `executedBy` con `agent: leader`, motivo `cambio mínimo`, archivos y líneas tocados, y la línea `Modelo:` del reporte. No se fragmenta un cambio mayor en varios mínimos. Ver `harness/roles/leader.md` y `AGENTS.md`.

**Revisión independiente.** por defecto la hace el agente `reviewer` (perfil del proveedor seleccionado), nunca el implementer. El usuario (`human-reviewer`) aprueba alcance, arquitectura y contratos, resuelve las decisiones `DEC` y puede revisar cualquier WI si lo pide. La revisión del `reviewer` no sustituye esas aprobaciones: ante una decisión abierta o un cambio de alcance/contrato no aprobado, `DECISION_REQUIRED` y esa parte queda aparcada, sin `W-DONE`. No autoriza push, PR ni infraestructura externa y no relaja ningún gate. El máximo de 2 ciclos de revisión sigue vigente y al agotarse queda pendiente para el usuario, sin inventar aprobación. Un reviewer que no sea independiente del implementer no cuenta.

**Merge reviewer.** Toda fusión de una rama de tercero o de integración se revisa con el agente `merge-reviewer` y el perfil del proveedor seleccionado antes de entrar en `feature/jean`, `develop` o `main` y antes de publicarla. Revisa la fusión completa (no el trabajo de un WI), escribe `harness/reports/merge-review-<scope>.md` y no hace push ni merge: el usuario ordena la fusión. Ningún otro revisor lo sustituye ni lo relaja; no sustituye decisiones `DEC` ni aprobaciones del usuario.

## Vía rápida (`lane: FAST`)

Carril liviano para cambios **pequeños o de limpieza** que no alteran el comportamiento observable del producto ni ningún contrato. Un WI lo declara con el campo opcional `lane` en `harness/work-items.json` (`"STANDARD"` por defecto, `"FAST"`).

- **Aplica solo si:** `contractImpact=false` y `publishesContract=false`, sin migraciones, autorización, seguridad ni concurrencia, y sin cambio de UI relevante. Si el trabajo crece o toca alguno de esos puntos, el leader lo pasa a `STANDARD` antes de seguir.
- **Qué se simplifica:** el WI sigue registrado (ID, subtarea `ST-*`, HU, un solo WI activo), pero el `sdd-analyst` es opcional (el leader verifica la spec) y la evidencia puede ser **un único reporte compartido** (`harness/reports/fast-lane-<alcance>.md`) en lugar de uno por WI.
- **Qué no se simplifica:** lint, tests y build en verde; checkpoints de Contract Sync; revisión independiente del `reviewer` con handoff aprobado; `noBlockingDecisions`; commits coherentes con `Refs:`.
- El validador (`validate-work-items.mjs`) rechaza `lane: FAST` con impacto de contrato.

## Reviewers bajo demanda

`sdd-analyst`: obligatorio salvo en vía rápida. `contract-reviewer`: solo si el WI tiene `contractImpact=true`. `ux-reviewer` (solo Console): solo si el WI tiene `uiImpact=true`. `reviewer`: siempre, para todo WI. `merge-reviewer`: solo para fusiones.

## Gates

`WI-CONSOLE-001` es una migración del propio Harness y SDD (`workItemType: HARNESS`): durante este único corte, la spec y el validador se construyen dentro de `W-IN_PROGRESS`, y `sddVerified` debe pasar antes de `W-IN_REVIEW`. Esto no autoriza a un WI de producto a implementar antes de `W-SPEC_VERIFIED` y aprobación humana.

Los valores son `G-NOT_RUN`, `G-PASSED`, `G-FAILED` y `G-NOT_APPLICABLE`. Para `W-DONE` deben pasar `sddVerified`, `implementationCompleted`, `independentReviewPassed`, `technicalChecksPassed`, `interopSyncChecked`, `noBlockingDecisions` y `retryLimitRespected`, además de `noMocksPresentedAsLive`. Si `contractImpact=true`, también `contractReviewed` y `canonicalContractSynced`. `contractSyncPublished` pasa solo cuando `publishesContract=true` y hay un evento en outbox; los demás casos usan `G-NOT_APPLICABLE`. Si `uiImpact=true`, `uxReviewed` debe pasar; si no, es `G-NOT_APPLICABLE`.

Contract Sync corre en `start`, `implementation-delivery`, `before-review` y `before-done`. Todo evento relevante no `C-RESOLVED` o incompatibilidad conocida impide `interopSyncChecked=G-PASSED`. Para un evento histórico sin `scopePaths`, que por compatibilidad se considera global, el registry puede registrar `contractSyncReview` por WI con `NOT_RELEVANT`, motivo y digest estable del contenido. Eso permite excluirlo solo del gate de ese WI; no cambia el estado del evento ni sus acciones pendientes. Cambiar el contenido invalida el digest. Un evento notifica una necesidad contractual; no autoriza implementar un endpoint no aprobado ni cambia otro repositorio.

`consumerImportedAt` conserva cuándo un evento Contract Sync entró a este repo. El validador ignora eventos importados después del `closedAt` de un snapshot, pero continúan aplicando a todos los WIs activos o futuros.

## Validación local

```sh
node scripts/sdd-check.mjs
node harness/validate-work-items.mjs
node harness/validate-harness.mjs
node harness/contract-sync.mjs check --checkpoint start --work-item WI-CONSOLE-001
```

También se ejecutan lint, tests y build del componente antes de cerrar. Los archivos históricos en `harness/reports/` son evidencia, no reglas vigentes. No se hace push, PR, merge ni cambios de infraestructura externa sin solicitud explícita del usuario.

**Perfiles y escalamiento:** los perfiles de agentes viven en `harness/agent-profiles.yaml` y se materializan en `.claude/agents/` o `~/.codex/agents/`. El leader puede escalar `implementer` a `implementer-high` dentro del mismo proveedor, con motivo trazado; no escala automáticamente a otro rol o modelo (`BLOCKED`/`DECISION_REQUIRED`). El reviewer independiente por defecto es el agente `reviewer`; el `human-reviewer` (usuario) aprueba alcance, arquitectura, contratos y decisiones `DEC`.
