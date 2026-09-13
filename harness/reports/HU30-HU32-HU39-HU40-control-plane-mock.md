# HU30 + HU32 + HU39 + HU40 — Control plane mock completo

**Estado:** DONE
**Repository:** `tjc-fe-rag-developer-console`
**Story IDs:** HU30, HU32, HU39, HU40 (feature `013-pr-driven-control-plane`)
**Contrato:** SYSTEM-2.0 / INTEROP-2.0 §6.8, §6.10, §6.12

## Contexto

Corte grande, autónomo, a pedido explícito del usuario tras cerrar HU37/HU38: mostrar
una versión mockeada **completa** de la nueva dirección de SDD 2.0 en el Developer
Console (repository binding → PR/HEAD → Run → Check/Proposal), con los 9 escenarios de
`spec/features/013-pr-driven-control-plane/spec.md` representados. Ejecutado de punta a
punta sin pausas intermedias, commiteando por corte lógico (política ya codificada en
`harness/WORKFLOW.md`), sin `push`.

## Alcance implementado

- **Dominio nuevo** `app/src/control-plane/` (`types.ts`, `api.ts`, `queries.ts`,
  `status.ts`): tipos fieles a INTEROP-2.0 §6.8 (binding/GitHub App), §6.10
  (`AnalysisRun`), §6.12 (propuestas/companion PR). `action-required/types.ts` pasa a
  reexportar `AnalysisSymbolResponse` desde aquí (antes duplicado).
- **Mock-first**, sobre los dos proyectos demo existentes (`prj_checkout_demo` ↔
  `acme/checkout-service`, `prj_billing_demo` ↔ `acme/billing-engine`), **9 escenarios**:
  1. `arun_checkout_pr42` — **action required** (ya existía por HU37/38; el estado
     inicial del control plane es independiente y consistente, no derivado en vivo del
     estado interno de `action-required` — simplificación deliberada para no acoplar
     ambos mocks, documentada aquí).
  2. `arun_checkout_pr45` — **success**, con propuestas `AVAILABLE` publicables.
  3. `arun_checkout_pr46` — **behavioral mismatch**, propuestas `HELD`.
  4. `arun_checkout_pr47` — **existing tests sufficient**
     (`NO_ADDITIONAL_TESTS_REQUIRED`).
  5. `arun_billing_pr17` (`OBSOLETE`) → `arun_billing_pr17_2` (`SUCCESS`, `current`) —
     **corrección/HEAD nuevo**.
  6. `arun_billing_pr20` — **baseline failed**.
  7. `arun_billing_pr21` — **technical generation failure**.
  8. `arun_billing_pr22` — **no relevant changes**.
  9. **publication/freshness** — al publicar las propuestas de `pr45` se crea un
     companion PR mockeado (`TestPublicationResponse` `PUBLISHED` de inmediato; se
     documenta como simplificación de demo, sin el paso intermedio `PUBLISHING`).
- **Páginas**: `RunsPage` (`/analysis-runs`, listado global con filtro `?projectId=` y
  badges de estado semánticos), `AnalysisRunDetailPage` (`/analysis-runs/:id`, contenido
  según `status`: enlaza a Focus Mode en `ACTION_REQUIRED`, revisa/publica propuestas en
  `SUCCESS`, muestra `HELD` en `BEHAVIORAL_MISMATCH`, panel de fallo en
  `BASELINE_FAILED`/`TECHNICAL_GENERATION_FAILURE`, panel informativo en
  `NO_ADDITIONAL_TESTS_REQUIRED`/`NO_TEST_RELEVANT_CHANGES`, aviso sin acciones en
  `OBSOLETE`), `IntegrationsPage` (`/projects/:projectId/integrations/github`, HU30:
  ver/desconectar binding o flujo mock de 2 pasos para conectar).
- **`ProjectDetailPage`**: nuevo panel de repository binding arriba del flujo ZIP
  existente (coherente con "el upload ZIP no es el camino principal" de `spec.md`), con
  enlaces a Runs filtrados por proyecto y a Integrations.
- **Nav**: link "Runs" agregado en `AppShell.tsx` junto a "Action Required".
- Adapters `live` de todo lo anterior rechazan con `PendingContractError` — Core no
  publica estas rutas todavía.

## Decisión de diseño documentada: ruta de detalle de Run

INTEROP-2.0 §6.12 fija que el `details_url` de un Check apunta a
`/projects/{projectId}/runs/{analysisRunId}`. Esa ruta la ocupa hoy `RunPage`, el Run de
generación **legacy** (ZIP-based, `runs/types.ts`, con pruebas dependientes); retirarla
es HU44 (P4, fuera de alcance). Este corte usa `/analysis-runs/:analysisRunId` en su
lugar — desviación deliberada, a resolver cuando HU44 libere la ruta legacy.

## Fuera de alcance (explícito, no implementado)

- Adapters live / webhooks GitHub reales (HU31, Core-side).
- HU35/HU36 (persistencia real de Functional Knowledge y continuación de Run en Core).
- HU41-HU43 (soporte PHP/Laravel/PHPUnit).
- HU44/HU45 (retiro de navegación legacy, colaboración multiusuario).
- Selector real de repositorio en el flujo de instalación de GitHub App (el mock
  siempre vincula el repositorio por defecto del proyecto).

## Verificación

- `npx tsc --noEmit`, `pnpm run lint`, `pnpm test -- --run` (**183 pruebas**, +21 desde
  el cierre de HU37/38: `control-plane/api.test.ts`, `RunsPage.test.tsx`,
  `AnalysisRunDetailPage.test.tsx`, `IntegrationsPage.test.tsx`,
  `projects/ProjectDetailPage.test.tsx` nuevo) y `pnpm run build` — todo en verde. Una
  prueba de `ContextExplorerPage.test.tsx` (no tocada por este work item) falló una vez
  bajo carga completa del runner y pasó en aislamiento — flaky preexistente, no
  relacionada.
- Recorrido manual en navegador (Claude in Chrome) contra `pnpm run dev`: bandeja de
  Runs con los 9 estados y badges correctos → Run `SUCCESS` → publicar 3 propuestas →
  companion PR mockeado (`rag-tests/pr-45-e5e5e5e` → PR #145) → `ProjectDetailPage` con
  panel de binding → Integrations → desconectar → reconectar con el flujo de 2 pasos.
  Sin errores de consola.
- Gate de diseño (`stitch` MCP, proyecto `11524813659221805644`, `list_screens`
  consultado durante HU37/38 en esta misma sesión): no existe pantalla de referencia
  para "Runs"/"Analysis Run detail"/el nuevo "Repository binding" — las únicas
  pantallas relacionadas a GitHub ("Seleccionar repositorio GitHub", "Crear Pull
  Request") pertenecen a la exploración anterior marcada superseded por SDD 2.0 y no
  representan el flujo de binding actual. Se aplicaron los tokens Black Glass vigentes
  sin comparación 1:1, misma excepción documentada en el reporte de HU37/38.

## Commits de este corte

`dc26b4f` (apertura), `b2d9a0b` (dominio+mocks+9 escenarios), `d4f44b1`
(RunsPage+AnalysisRunDetailPage), `82b1d68` (IntegrationsPage+binding en
ProjectDetailPage). Ninguno pusheado.
