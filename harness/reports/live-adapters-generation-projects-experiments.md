# Evidencia de revisión — Adapters live: generación, proyectos, experimentos

**Historias:** HU01 (listado), HU08-14 (generación/progreso/resultados), HU19 (experimento)
**Fecha:** 2026-09-07
**Estado:** DONE

## Contexto

Surgió durante una sesión de prueba manual real (RAG Core en `localhost:3000`, Test Execution
Sandbox en `localhost:3001`, ambos con Docker Desktop) del trabajo de HU20/21/22/24. El usuario
pidió conectar, en la misma sesión, los adapters live restantes que hasta entonces solo
funcionaban en modo mock: envío/progreso/resultados de generación, listado de proyectos y el
experimento RAG vs agente generalista.

## Alcance verificado (contra backend real, no solo mocks)

- **Listado de proyectos** (`GET /projects?cursor&limit`): `projects/api.ts` devuelve
  `Page<ProjectResponse>`; `useProjects` pasa a `useInfiniteQuery` con "Cargar más". Verificado
  con proyectos reales ya creados por el usuario.
- **Envío de generación** (`POST /test-runs`): `generation/api.ts` recibe `configuration` +
  `idempotencyKey` (`createIdempotencyKey()` por cada confirmación explícita). Verificado
  end-to-end: creación de proyecto, upload real, generación real, fallo real de un target y
  mensaje accionable.
- **Estado + resultados de generación** (`GET /test-runs/{runId}` + `/results`):
  `runs/liveMapping.ts` combina ambas respuestas en el mismo `RunViewModel` que ya consumía el
  adapter mock (los componentes no cambiaron). Mapea los estados granulares de Core
  (`RESOLVING_TARGETS`/`PROCESSING_TARGETS`/`BATCH_VALIDATING`/`FINALIZING`) a los 3 estados
  intermedios que ya entendía la UI. Agrega `failureMessage` a nivel de run para el caso (real,
  observado) de que falle antes de resolver cualquier target.
- **Experimento RAG vs agente generalista** (`POST /experiments` + `GET /experiments/{id}` +
  `/results`): `experiments/liveMapping.ts` separa `strategies: StrategyMetricsResponse[]` en
  `RAG`/`GENERALIST_AGENT` y los proyecta al mismo `{baseline, rag}` que ya usaba
  `ExperimentComparison`. Se retira `'BASELINE'` del vocabulario interno (prohibido por
  `INTEROP-1.5`); se agrega `toolCalls`/`filesInspected` del agente, ausentes hasta ahora.
  Corregido además: `startExperiment` recibía una **etiqueta** de target, no su `id` real
  (funcionaba en mock por casualidad; hubiera fallado siempre contra Core real). Verificado
  end-to-end con un experimento real completo (6/6 repeticiones, RAG y agente con fallos reales
  distintos — ver hallazgos).

## Verificación

- `npm run lint` / `npm test` (28 archivos, 77 pruebas, 15 nuevas) / `npm run build`: OK.
- Verificación manual contra RAG Core + Sandbox reales corriendo en local: creación de proyecto,
  upload, indexación con WebSocket en vivo, generación real (con fallo real de LLM/dependencia),
  listado de proyectos real, experimento real completo con resultados reales.

## Hallazgos durante la verificación (no son código de este repo)

- Un run real puede fallar con `failureType: DEPENDENCY` incluso cuando el LLM sí respondió
  (tokens reales observados) — el test generado usa una dependencia no disponible en el Sandbox.
  No es el mismo problema que el reportado antes ("proveedor LLM no respondió"); ese caso
  específico ocurrió con un proyecto de prueba sin `pnpm-lock.yaml`.
- En el experimento real, la estrategia `GENERALIST_AGENT` falló las 3 repeticiones con
  `failureType: UNKNOWN` en ~200-300ms cada una (sin tokens, `executionDurationMs: 0`) — sugiere
  que el agente no llegó a ejecutar su ciclo real. Es un hallazgo de `tjc-be-rag-core-api`, fuera
  de este repo; no se investigó ni se tocó código allí en esta sesión (acordado explícitamente
  con el usuario después del incidente de la sesión anterior).

## Fuera de alcance

- Descarga de artifacts por las rutas live (feature 007) sigue PENDING.
- El bug de retry diagnosticado en la sesión anterior (`retry-target-job.handler.ts`, Core) sigue
  sin commitear en ese repo, a la espera de que el usuario decida.
