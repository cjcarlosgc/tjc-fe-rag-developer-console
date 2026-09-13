# Ruta canónica de Analysis Run Detail + Experiments visible

**Estado:** DONE
**Repository:** `tjc-fe-rag-developer-console`
**Story IDs:** HU19, HU32, HU44 (parcial — libera la ruta, no retira el resto del legacy)

## Contexto

El usuario compartió un handoff frontend (`Handoff Frontend — Pantallas objetivo
SDD 2.0.md`) con las pantallas objetivo de la Console. Se hizo primero un inventario
comparándolo contra lo ya construido (HU37/38, HU30/32/39/40) y contra el contrato
ratificado `INTEROP-2.0`, identificando 3 puntos a resolver antes de seguir
implementando pantallas nuevas. El usuario decidió los tres. Este reporte cubre la
ejecución de esas 3 decisiones.

## Decisiones y resultado

1. **Vocabulario de propuestas de test** (`READY_FOR_REVIEW/HELD/STALE/PUBLISHED/
   REJECTED` del handoff vs. `AVAILABLE/HELD/STALE/PUBLISHED` de INTEROP-2.0 §6.12):
   se mantiene el contrato. Sin cambios de código — ya estaba implementado así.
   `REJECTED` no existe en INTEROP-2.0 y no se inventa en el frontend.
2. **Ruta canónica del Run Detail**: `AnalysisRunDetailPage` pasa de
   `/analysis-runs/:analysisRunId` a `/projects/:projectId/runs/:analysisRunId` —
   coincide con el handoff (§10) y con el `details_url` literal de INTEROP-2.0
   §6.12. El Run de generación legacy (ZIP-based, `RunPage`/`RunHistoryPage`/
   `ArtifactsPage`/`ContextExplorerPage`) se mudó a
   `/projects/:projectId/legacy/runs/...` para liberar esa ruta — mismo código,
   mismas pruebas, solo el prefijo cambia. El listado global `/analysis-runs` no
   cambió.
3. **Experiments fuera de "legacy"**: el link "Modo experimental" salió de
   `LegacyToolsPage` y ahora vive en `ProjectDetailPage` como acción propia
   (`/projects/:id/experimental`), separado del panel de binding y de la nota a
   herramientas legacy — HU19 es capacidad de tesis vigente, no ZIP-first. Queda
   pendiente, documentado y fuera de este corte, dónde vivirá un eventual ítem
   "Experiments" en la **nav global** — el handoff lo pide ahí pero no define una
   pantalla destino (no aparece en las 7 pantallas principales ni en la sub-nav de
   proyecto que el mismo handoff describe).

## Archivos actualizados (solo referencias de ruta, sin tocar lógica)

`router.tsx`, `runs/RunPage.tsx`, `runs/RunHistoryPage.tsx`,
`artifacts/ArtifactsPage.tsx`, `artifacts/ArtifactWorkspace.tsx`,
`context-explorer/ContextExplorerPage.tsx`, `generation/GenerationPage.tsx`,
`projects/LegacyToolsPage.tsx`, `projects/ProjectDetailPage.tsx`,
`control-plane/RunsPage.tsx`, `control-plane/AnalysisRunDetailPage.tsx`,
`api/mockBackend.ts` (9 `detailsUrl` de fixtures). Pruebas correspondientes
actualizadas en cada módulo tocado.

## Gaps identificados en el inventario, explícitamente diferidos (sin implementar)

- **`Functional Knowledge`** (list/detail/ACTIVE-SUPERSEDED/conflicto) — el gap más
  grande del handoff; INTEROP-2.0 §6.11 ya define `FunctionalKnowledgeResponse` y
  `GET /projects/{projectId}/functional-knowledge`, sin implementar todavía en el
  frontend.
- `INFRASTRUCTURE_FAILURE` como fixture/escenario (valor válido de
  `AnalysisRunStatus`, sin cubrir).
- Sub-nav por proyecto (Overview/Pull Requests/Functional Knowledge/Integrations/
  History), badge de conteo en "Action Required", timeline/history por Run,
  bootstrap de primer repo / PR grande como estados dentro de Run Detail.
- Escenarios ampliados del handoff (`large-pr`, `bootstrap`,
  `functional-rule-conflict`) y reconciliar el conteo "12/15" del handoff con las
  "nueve escenarios" que dice literalmente `spec.md`.
- Destino de "Experiments" en la nav global.

## Verificación

- `npx tsc --noEmit`, `pnpm run lint`, `pnpm test -- --run` (**191 pruebas**, todas
  en verde) y `pnpm run build` — limpios.
- Recorrido manual en navegador (Claude in Chrome): Runs → abrir PR #45 → URL
  `/projects/prj_checkout_demo/runs/arun_checkout_pr45` (ruta canónica);
  `ProjectDetailPage` muestra "Modo experimental →" como acción propia; "Herramientas
  legacy" → "Historial de generaciones" → Run → Artifacts, todo bajo el prefijo
  `/legacy/runs/...` intacto. Sin errores de consola.

## Commits de este corte

`f346803` (migración de ruta + Experiments visible) y este mismo commit de cierre.
El inventario/mapa que motivó estas decisiones se acordó por chat con el usuario
antes de escribir código (sin un commit propio, ya que no modificó archivos). Ninguno
pusheado.
