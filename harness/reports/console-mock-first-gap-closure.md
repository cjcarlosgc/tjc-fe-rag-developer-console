# Cierre de gaps mock-first — MVP control plane completo

**Estado:** DONE
**Repository:** `tjc-fe-rag-developer-console`
**Story IDs:** HU25, HU30, HU32, HU37, HU38, HU39, HU40

## Contexto

El usuario pidió terminar todo lo que faltaba del flujo mock-first del control
plane (SDD 2.1) antes de seguir con más adapters live ("terminemos con el
resto de las implementaciones de manera que tengamos todo el flujo funcional
MVP mockeado y al final hacemos las integraciones"). Un research en
background compiló el inventario completo de gaps citando archivo/línea
(no de memoria); cada ítem se clasificó contra
`spec/contracts/interoperability-contract.md` antes de implementarlo — **si
el dato no existía en el contrato, no se inventó**, se implementó con lo ya
aprobado o se dejó fuera explícitamente.

## Corte A — 5 escenarios mock nuevos (commit `d67f499`)

Todos usan solo datos que ya existen en `AnalysisRunDetailResponse`
(`indexMode`, `symbols`) o en `TestProposalStatus` (`STALE`, ya tipado sin
fixture):

- **`INFRASTRUCTURE_FAILURE`** (`arun_checkout_pr48`) — la UI ya lo
  renderizaba genéricamente vía `FAILURE_STATUSES`, solo faltaba el fixture.
- **Bootstrap** (`arun_billing_pr23`, `indexMode: BOOTSTRAP`) — nuevo panel
  en `AnalysisRunDetailPage`. Se omitió el conteo de archivos/porcentaje del
  mockup original del handoff (`1,742 relevant files`, `68%`) — no está en
  el contrato.
- **"PR grande"** (`arun_checkout_pr49`, 14 símbolos) — resumen de conteos
  `DIRECTLY_CHANGED`/`POTENTIALLY_IMPACTED` derivado del array `symbols` ya
  existente. Se omitió conteo de archivos y "batches" por la misma razón.
- **`STALE` proposals** (`arun_checkout_pr50`, `attemptCount: 2`) — un
  intento anterior queda `STALE`, el vigente `AVAILABLE`.
- **Caso 5 "respuesta revela inconsistencia"** (`arun_billing_pr24`) —
  `mockSubmitFunctionalAnswer` muta el `AnalysisRun` a `BEHAVIORAL_MISMATCH`
  solo para este id específico al responder su pregunta.

Total de `AnalysisRun` demo: 9 → 14.

## Corte B — Navegación (commit `a215b14`)

- Badge de conteo en "Action Required" del nav global (`AppShell.tsx`).
- `ProjectTabs` (nuevo, `ui/ProjectTabs.tsx`): sub-nav persistente
  Overview/Runs/Functional Knowledge/Integrations por proyecto, montada en
  `ProjectDetailPage`, `RunsPage` (con `?projectId=`), `FunctionalKnowledgePage`
  e `IntegrationsPage`. "History" quedó fuera a propósito: no hay timeline de
  `AnalysisRun` en el contrato. `ProjectDetailPage` perdió sus 3 links de
  acción redundantes con los tabs.

## Corte C — Selector de repositorio en el mock GitHub App (commit `ccf9c3c`)

`DEMO_INSTALLABLE_REPOSITORIES` (nuevo `control-plane/demoRepositories.ts`)
simula la pantalla de selección de repos que en la GitHub App real ocurre en
GitHub, no en la Console (el contrato §6.8 no define un endpoint para
"listar repos instalables"). `mockCompleteGitHubInstallation` ahora resuelve
`repositoryName` a partir del `repositoryId` elegido en vez de siempre usar
el repo por defecto del proyecto.

## Fuera de alcance (genuinamente bloqueado, documentado, no se tocó)

- Caso 2 "tests existentes parciales" — no hay campo de cobertura previa en
  `AnalysisRunDetailResponse` (ver `console-15-case-walkthrough-findings.md`).
- Conflicto de Functional Knowledge (§39 del handoff) — requiere una señal
  que Core no expone (ver `console-functional-knowledge.md`).
- Timeline/history de Run — solo hay 3 timestamps reales
  (`createdAt`/`updatedAt`/`completedAt`), no un historial de transiciones.
- Experiments P1/P4 — diferido explícitamente por el usuario tras el handoff
  `experimentos.md` (ver `console-experiments-analysisrun-classification.md`).

## Verificación

- `npx tsc --noEmit`, `pnpm run lint`, `pnpm test -- --run` (**235 pruebas**,
  todas en verde) y `pnpm run build` — limpios tras cada corte.
- Recorrido manual en navegador (Claude in Chrome) de los 8 escenarios
  nuevos: INFRASTRUCTURE_FAILURE, Bootstrap, PR grande, STALE proposals,
  Caso 5 (confirmado end-to-end: responder la pregunta en Focus Mode y volver
  al Run vía navegación in-app muestra `BEHAVIORAL_MISMATCH` con el
  `resultSummary` correcto y la propuesta `HELD`), ProjectTabs (tab activo
  correcto por ruta), y el selector de repositorio (ofrece 3 candidatos,
  vincula el repo elegido — verificado con `acme/billing-engine` y
  `acme/notifications-service`, no solo el default).
  - Nota metodológica: el `navigate()` del harness de browser hace una
    recarga completa de página, lo que resetea el estado en memoria del mock
    backend — para verificar una mutación entre dos pantallas (Caso 5) hubo
    que navegar con el botón "Volver" (routing in-app), no con `navigate()`.

## Commits de este corte

`d67f499`, `a215b14`, `ccf9c3c` (más este mismo commit de cierre). Ninguno
pusheado — igual que el resto de la sesión, push solo a pedido explícito.
