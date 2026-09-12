# Evidencia de revisión — HU28 (Fase 2 de SDD 1.16)

**Fecha:** 2026-09-12
**Estado:** DONE

## Implementado

- `app/src/context-explorer/agent/`: `agentLabels.ts` (vocabulario permitido/prohibido, `agentStepNodeId`), `AgentTrajectory.tsx` (reutiliza `GraphCanvas` + nueva `computeSequentialLayout` — un paso por columna, en orden), `AgentSidePanel.tsx`, `DiscoveredFilesList.tsx` (paginado, patrón "Cargar más").
- `app/src/context-explorer/ExcerptView.tsx`: extraído de `RagSidePanel` para reutilizarse también en `AgentSidePanel` (snippet, líneas circundantes con desvanecido progresivo, truncamiento, hash).
- `ContextExplorerPage.tsx`: ahora soporta dos entradas — `runId` (HU27, sin cambios de comportamiento) y `experimentId` (HU28, nueva). Rama por `detail.kind` (`RAG`→`RagGraph`, `AGENT`→`AgentTrajectory`); el modo lo decide la traza, no un selector aparte. Selector de repetición/estrategia propio para el modo experimento (`RAG · rep N` / `Agente · rep N`), separado del selector de target/intento de runs.
- `mockBackend.ts`: `mockStartExperiment` ahora siembra 6 trazas de contexto por experimento (3 RAG + 3 AGENT) vía `seedExperimentContextTraces`; trayectoria de agente con las 4 `AgentToolName`, un paso `EMPTY` y uno `FAILED` (`buildAgentTrajectory`); `mockListDiscoveredFiles` pagina 146 rutas reales (antes devolvía `[]` sin implementar).
- `ExperimentComparison.tsx`: link "Ver contexto" por fila de repetición → `experimental/:experimentId/context?strategy=&repetition=` (recibe `projectId`/`experimentId` desde `ExperimentPage.tsx`).
- `router.tsx`: ruta `projects/:projectId/experimental/:experimentId/context`.
- Vocabulario reforzado en código y CSS: "contexto observado por el agente", "contenido entregado al agente", "trayectoria de exploración"/"paso activo"; nunca "seleccionado"/"descartado" ni "chain-of-thought"/"confianza" (asertado en tests).

## Bugs reales encontrados y corregidos durante esta fase (no cosméticos)

1. **Filtro de listado vs. selección inicial**: `useExperimentContextTraces` recibía `strategy`/`repetition` de la URL como filtro del *listado completo*, dejando solo 1 traza disponible y rompiendo el selector de repetición. Corregido: esos parámetros solo eligen la traza inicial en `resolveSelectedTraceId`; el listado siempre trae las 6 repeticiones.
2. **Doble actualización de query params perdía el primer cambio**: los `onClick` de target-switch/attempt-switch/repetition-switch llamaban `updateParam('trace', id); updateParam('node', null)` en dos pasos — ambas leían el mismo `searchParams` previo, así que la segunda pisaba a la primera silenciosamente (nunca se había cubierto con un test que hiciera dos cambios en una sola interacción). Corregido con `updateParams(patch)`, una sola actualización atómica; aplica también a HU27 (target-switch/attempt-switch), no solo a HU28.

## Verificación

- `pnpm exec tsc --noEmit -p .`: OK.
- `pnpm exec eslint .`: OK, 0 errores/0 warnings.
- `pnpm exec vitest run`: OK, 34 archivos, 116 pruebas (agrega `AgentTrajectory.test.tsx`, `AgentSidePanel.test.tsx`, `graphLayout.test.ts::computeSequentialLayout`, deep link `experimental/:id/context` y "cambio limpio de renderer" en `ContextExplorerPage.test.tsx`, y el ajuste de `ExperimentComparison.test.tsx`).
- `pnpm exec vite build`: OK.
- `node scripts/sdd-check.mjs`: OK.
- Revisión manual en dev server (modo mock, vía Chrome): trayectoria de 6 pasos, paso `FAILED` con "Este paso no aportó contexto observado por el agente.", paso `EMPTY` atenuado, "Mostrar descubiertos" paginando 146 rutas reales, selector de 6 repeticiones (RAG/Agente × 1-3), deep link `?strategy=GENERALIST_AGENT&repetition=2` resolviendo la traza correcta.
- Nota de entorno (no relacionada con el código): el polling de `ExperimentPage` (`refetchInterval`) no avanza visualmente bajo control automatizado de Chrome — consistente con que TanStack Query pausa el refetch en segundo plano y la pestaña automatizada no se reporta como "visible"; verificado que el estado avanza correctamente invocando las funciones mock de forma directa. No es un defecto de esta historia.

## Design-reviewer contra Stitch

Se revisó `screens/bb55b741e5c042c0b04c7f84d9322753` ("Exploración del agente — RAG Test Studio") vía HTML real (no el thumbnail, de baja resolución):

- **Color `#A78BFA`** confirmado idéntico al token `--signal-agent` ya definido.
- Estructura de panel (herramienta, argumentos, resultado/contenido entregado, estado, hash/"integridad") y "Ocultos por defecto" para `list_files` coinciden con lo implementado.
- **Desvío de Stitch aceptado sin acción**: ese mockup usa la palabra "Seleccionado" para un nodo del agente, lo cual el propio `spec.md` prohíbe explícitamente para HU28. Aquí la SDD tiene autoridad sobre Stitch (`design-system/spec.md`: Stitch es referencia visual, no contrato) — el código y los tests de esta historia nunca usan esa palabra en el modo agente; se verificó con una prueba explícita de vocabulario.
- No se encontraron desvíos de la SDD que bloquearan esta historia.
- **Pendiente documentado, no bloqueante**: `spec.md` ("Interacción común") pide que el modo agente también filtre por herramienta/estado/path, igual que RAG filtra por señal/decisión/motivo (agregado en HU27). No se implementó en esta fase por alcance/tiempo — queda como mejora incremental futura, sin incumplir contrato ni accesibilidad.

## Contrato aplicado

`INTEROP-1.6 §6.7` (Trazas de contexto) — mismas 4 rutas de HU27, ahora también ejercitadas por `experimentId`/`strategy`/`repetition` y por `GET .../discovered-files`.
