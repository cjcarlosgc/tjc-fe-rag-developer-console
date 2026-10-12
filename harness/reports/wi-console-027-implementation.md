# WI-CONSOLE-027 — implementación (cortes B1, B2, B3, D)

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

**Estado:** B1, B2 y B3 completos. D: suite estable en la matriz pedida (6/6 sin límite, 2/2 con `--maxWorkers=2`, 0 fallos en la última ronda). Pendiente de decisión humana: la carrera de `setSearchParams` en ContextExplorer es un posible hallazgo de producto aparte (no corregido).

## B1 — FAILED visible (verificación)
- `ExperimentPage.tsx` sin cambios: `role="alert"` con `experimentFailureMessage(failureCode)`; sin `role="status"` ni «Preparando experimento» en FAILED.
- `ExperimentPage.test.tsx` ya afirmaba alerta, mensaje, detalle, rótulo DEMO, ausencia de «Preparando», `role=status`, reanudar y «Huella de retrieval».
- Añadido: ausencia de `.live-indicator` y `.experiment-progress`.

## B2 — texto de RETRIEVAL_COMPARISON_WORKER_LOST
- `app/src/retrieval-comparison/failureMessages.ts`: «La comparación se interrumpió; vuelve a crearla.»
- `app/src/retrieval-comparison/api.test.ts`: `/interrumpió/` conservado y `/vuelve a crearla/` añadido.
- Sin otros literales antiguos en `app/src` ni `spec`.

## B3 — retirar useEvidence
- `useEvidence` y `evidenceKeys` sin consumidores fuera de `queries.ts` y su prueba: eliminados.
- `queries.test.tsx`: se conserva `shouldRetryEvidence` (2 pruebas).
- 409 (reintento) y 404 (sin reintento) ya cubiertos en `EvidenceDownload.test.tsx`.

## D — estabilización de Vitest

### Cambios aplicados (solo pruebas y configuración)
1. `app/src/test/setup.ts`: `configure({ asyncUtilTimeout: 5000 })`.
2. `app/vite.config.ts`: `testTimeout: 15000` (`vite.config.js`/`.d.ts` están en `.gitignore`, no se tocaron).
3. Timeouts explícitos `2000`/`3000` en `findBy`/`waitFor` subidos a `5000` en: `src/test/roleGating.test.tsx`, `src/experiments/noAutomaticVerdict.test.tsx`, `src/experiments/ExperimentPage.test.tsx`, `src/projects/ProjectsPage.test.tsx`, `src/retrieval-comparison/RetrievalComparisonPage.test.tsx`, `src/run-comparison/RunComparisonPage.test.tsx`. Sin cambios en aserciones.
4. `app/src/projects/ProjectDetailPage.test.tsx`: `toHaveFocus` del h1 dentro de `waitFor` (el foco se mueve en un `useEffect`).
5. `app/src/context-explorer/ContextExplorerPage.test.tsx`:
   - helper `waitForDefaultSelection()` que espera un nodo del grafo con `aria-pressed="true"` (selección por defecto fijada por efecto) antes de pulsar toggles; usado en «alterna…» y «cambia el renderer…».
   - «alterna…»: tras pulsar «Vista de lista», `waitFor` a que quede `aria-pressed="true"` antes del `findByRole('table')`.
   - «seleccionar un candidato…»: `getByRole` síncrono → `findByRole` tras clic (la navegación de react-router no siempre se asienta en el mismo tick).
   - No se usó `complementary` como espera por defecto: el panel no existe antes de seleccionar (verificado con una ronda fallida).

No hay `skip`, `retry` de vitest ni aserción debilitada. `ContextExplorerPage.tsx` no se tocó.

### Tabla acumulada (sin límite salvo indicación)

| Fase | Corrida | Resultado | Pruebas fallidas y causa |
|---|---|---|---|
| Antes | 1 | 721/723 | ContextExplorer ×2: findBy 1000 ms |
| Antes | 2 | 720/723 | ContextExplorer ×2; HU39/40: findBy 1000 ms; testTimeout 5000 ms |
| Antes | 3 | 717/723 | ContextExplorer ×4; HU39/40 timeout; HU56 foco |
| Antes | 4 | 720/723 | ContextExplorer ×3: findBy 1000 ms |
| Antes (maxWorkers=2) | 1-3 | 723/723 ×3 | — |
| Ronda 1 | 1-6 | 723, 723, 722, 722, 723, 723 | ProjectsPage «live-project» (findBy, timing); ContextExplorer «table» (toggle perdido) |
| Ronda 2 (previa a hardening) | 1-6 | 723, 722, 723, 723, 722, 722 | ContextExplorer «table» (toggle) y «complementary» síncrono (3 de 6)
| Ronda 2 (final) | 1-6 | 723 ×6 | — 
| Ronda 2 (maxWorkers=2) | 1-2 | 723/723 ×2 | — |

Matriz de la última ronda (con todos los ajustes): sin límite 6/6 verdes (723/723); `--maxWorkers=2` 2/2 verdes (723/723). Antes de los ajustes de la ronda 2, la misma matriz dio 3/6 con fallos en ContextExplorer.

### Causa de los fallos residuales (diagnosticados)
- «alterna…» (`findByRole('table')`): el clic en «Vista de lista» no se aplicaba en algunas corridas (`aria-pressed` seguía en grafo). Hipótesis de producto: `setSearchParams` de react-router 7.18.3 usa la forma funcional sobre el snapshot del último render; efectos que fijan `node`/`trace` pueden pisar `view=list`. Mitigado en prueba esperando la selección por defecto y el estado de toggle; **no corregido en producción**.
- «seleccionar un candidato…» (`complementary` síncrono): la navegación tras `fireEvent.click` no siempre estaba asentada en el mismo tick. Mitigado con `findByRole`.
- ProjectsPage «live-project» (ronda 1): `findBy` con timing bajo carga; no reapareció en la ronda 2.

### Hallazgo de producto aparte (no implementado)
`app/src/context-explorer/ContextExplorerPage.tsx` (`updateParams` sobre `setSearchParams` funcional) puede perder actualizaciones de query params cuando dos cambios ocurren antes de re-render. Requiere reproducción y aprobación como corte de producto.

## Archivos tocados
- `app/src/retrieval-comparison/failureMessages.ts`, `api.test.ts`
- `app/src/evidence/queries.ts`, `queries.test.tsx`
- `app/src/experiments/ExperimentPage.test.tsx`, `noAutomaticVerdict.test.tsx`
- `app/src/projects/ProjectDetailPage.test.tsx`, `ProjectsPage.test.tsx`
- `app/src/test/setup.ts`, `app/src/test/roleGating.test.tsx`
- `app/src/retrieval-comparison/RetrievalComparisonPage.test.tsx`, `app/src/run-comparison/RunComparisonPage.test.tsx`
- `app/src/context-explorer/ContextExplorerPage.test.tsx`
- `app/vite.config.ts`
- `harness/reports/wi-console-027-implementation.md`

No se tocaron `harness/state.json`, `work-items.json`, `tasks.md`, `CHANGELOG.md`. No hay commit.

## Comandos (en `app/`)
- `npm run lint` → exit 0
- `npx tsc -b --noEmit` → exit 0
- `npm run build` → exit 0 (aviso de chunk >500 kB preexistente)
- `node node_modules/vitest/vitest.mjs run` ×6 → 723/723 cada una
- `node node_modules/vitest/vitest.mjs run --maxWorkers=2` ×2 → 723/723 cada una

Logs: `/private/tmp/claude-501/-Users-jean-Tesis-workspaces-tjc-fe-rag-developer-console/3b54ef64-6264-4f34-9fbe-22d439c8bd9f/scratchpad/` (`r2-*.log`).

## Pendiente
1. Reviewer: revisar B1-B3 y el diff de D (solo pruebas y configuración).
2. Decidir si se abre un corte de producto para la carrera de `setSearchParams` en ContextExplorer.
3. `ux-reviewer` para el copy de B2.
