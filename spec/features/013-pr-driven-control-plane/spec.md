# 013 — Control plane PR-driven

**Estado:** APROBADO (HU30, HU32, HU35-HU40, HU44-HU45). HU51/HU53/HU55 tienen contrato **definido** desde 2026-09-15 (INTEROP-2.1, pendiente de implementación en Core) — mock-first normal, ya no especulativo. HU50/HU52 siguen `PROPOSED` (sin contrato). Ver sección propia abajo.
**Story IDs:** HU30, HU32, HU35-HU40, HU44-HU45, HU50, HU51, HU52, HU53, HU55
**Contrato:** SYSTEM-2.1 / INTEROP-2.1

## Objetivo

Representar el ciclo de un repositorio vinculado y sus `AnalysisRun` por PR/HEAD, haciendo accionables el contexto faltante, los resultados y la publicación revisada sin duplicar reglas de Core.

## Navegación y estados

- Navegación principal: Projects, Runs, Action Required, Experiments e Integrations/GitHub.
- Un proyecto muestra repository binding, `integrationBranch`, PR/HEAD vigente, checks y runs; el upload ZIP no es el camino principal.
- Focus Mode es una página dedicada, no un modal. Presenta una sola pregunta adaptativa, evidencia visual acotada, opción `No lo sé` y retorno seguro mediante `returnTo`.
- `No lo sé` equivale a `UNKNOWN` y nunca se presenta como conocimiento funcional persistido.
- Las propuestas se revisan antes de publicar. La UI muestra freshness y nunca promete escritura directa, auto-merge o autorepair.
- El login permite correo/contraseña y GitHub OAuth mediante Supabase Auth. La conexión de una GitHub App es un flujo separado.

## Mock-first

La primera entrega usa adapters `mock` con fixtures que respetan INTEROP-2.1 y una etiqueta visible de demo. `mock` y `live` permanecen separados y la UI no simula efectos externos como reales.

Debe cubrir nueve escenarios navegables: success, action required, behavioral mismatch, correction/new HEAD, existing tests sufficient, baseline failed, technical generation failure, no relevant changes y publication/freshness.

## Seguridad

El navegador solo consume Core para dominio. Nunca recibe secretos de GitHub App, `SANDBOX_SERVICE_TOKEN`, URLs firmadas internas ni reglas para verificar webhooks. Ownership y roles se reflejan desde el servidor.

## Fuera de alcance de T-001

- adapters live o integración GitHub real;
- colaboración Owner/Maintainer/Reviewer antes de HU45;
- iniciar automáticamente otra HU después de aprobar esta baseline.

## Pendiente de implementar (registradas 2026-09-14; contrato de HU51/53/55 definido 2026-09-15)

Capacidades identificadas como necesarias durante el uso/auditoría de esta
feature. Detalle completo en `harness/reports/console-backlog-formalization.md`.

- **HU50** — indicador de cobertura previa (ninguna/parcial/suficiente) de un
  símbolo en `AnalysisRunDetailPage`. Sigue `PROPOSED`, sin contrato:
  `AnalysisRunDetailResponse` no tiene ese campo. **Implementado en Console**
  como capa especulativa (`control-plane/speculative/priorCoverage.ts`,
  `ProposedCapabilityError` en live) — puede requerir rediseño si Core define
  una forma distinta a la fabricada localmente.
- **HU51** — Focus Mode avisa si la regla que se va a fijar contradice una
  `FunctionalKnowledge` `ACTIVE` existente. Contrato **definido** 2026-09-15
  (INTEROP-2.1 §6.11): `SubmitFunctionalAnswerRequest.conflictResolution?
  {conflictId, action: 'SUPERSEDE'|'KEEP_EXISTING'}`; sin resolución y con
  conflicto responde `409 FUNCTIONAL_KNOWLEDGE_CONFLICT` con
  `details: FunctionalKnowledgeConflictResponse`. **Implementado en Console**
  (mock-first normal, `PendingContractError` en live): caso demo dedicado
  `arun_checkout_pr52`/`fq_checkout_pr52_1` vs. `fk_shipping_zone` (ACTIVE) —
  la detección de conflicto es explícita por pregunta demo, no un chequeo
  genérico por `targetRef` (varias preguntas HU37/38 ya comparten `targetRef`
  con FK seedeadas y romperían su propio flujo si se evaluara siempre).
  Pendiente de implementación real en Core.
- **HU52** — en `FunctionalKnowledgeDetailPage`, qué Analysis Runs usaron
  esa regla. Sigue `PROPOSED`, sin contrato — no está en INTEROP-2.1 §6.11.
- **HU53** — historial de transiciones de estado de un `AnalysisRun`. Contrato
  **definido** 2026-09-15 (INTEROP-2.1 §6.10): `AnalysisRunDetailResponse.history:
  AnalysisRunTransitionResponse[]` append-only, con los 8 valores de
  `AnalysisRunTransitionReason` derivados 1:1 de los call sites reales del
  service de Core. **Implementado en Console**: `history?` opcional en el
  mirror (`control-plane/types.ts`) porque `getAnalysisRun` sí tiene adapter
  live hoy contra el controller real, que todavía no devuelve el campo — el
  mock lo deriva de status/timestamps ya seedeados
  (`deriveRunHistory` en `mockBackend.ts`) en vez de autorarlo por cada uno
  de los ~20 fixtures. `<details>` colapsable en `AnalysisRunDetailPage`.
  Pendiente de implementación real en Core.
- **HU55** — listado de Analysis Runs cross-proyecto. Contrato **definido**
  2026-09-15: `GET /analysis-runs?status&cursor&limit` (mismo shape, mismo
  ownership por token). **Sin código nuevo**: el mock ya cubría esto
  completamente (`RunsPage`/`ProjectsPage` funcionan sin `projectId`); solo
  se corrigió el mensaje de `PendingContractError` en `control-plane/api.ts`
  (decía "INTEROP-2.1 §6.10 solo aprueba el listado por proyecto", ya
  desactualizado — ahora refleja que el contrato existe y Core no lo
  implementó). El adapter live sigue rechazando ese caso hasta que Core
  publique la ruta nueva.
