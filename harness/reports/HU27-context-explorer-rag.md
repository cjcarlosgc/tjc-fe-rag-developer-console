# Evidencia de revisión — HU27 (Fase 1 de SDD 1.16)

**Fecha:** 2026-09-11
**Estado:** DONE

## Implementado

- `app/src/context-explorer/`: `types.ts`, `errors.ts`, `api.ts`, `queries.ts`, `ContextExplorerPage.tsx`.
- `graph/`: `graphLayout.ts` (layout puro en columnas, testeado), `GraphCanvas.tsx` (pan/zoom, minimapa discreto, roving-tabindex compartido con HU28), `useGraphKeyboardNav.ts`, `Legend.tsx`, `StructuredAlternativeView.tsx` (alternativa de lista con el mismo view model, sin duplicar mapeo).
- `rag/`: `RagGraph.tsx`, `RagSidePanel.tsx`, `ragLabels.ts`.
- Adapters live de las 4 rutas de `INTEROP-1.6 §6.7` rechazan con `PendingContractError` (RAG Core: "APROBADO; IMPLEMENTACIÓN PENDIENTE"); mock completo en `api/mockBackend.ts` con 12 candidatos cubriendo SELECTED semántico, SELECTED dual y las 3 razones de descarte (`BELOW_MINIMUM_SCORE`, `TOP_K_LIMIT`, `TOKEN_BUDGET`), un intento superseded (`includeSuperseded`) y un trace que simula `409 CONTEXT_TRACE_NOT_FINISHED` transitorio.
- Entradas: `RunPage.tsx` ("Explorar contexto"), `ArtifactWorkspace.tsx` ("Ver contexto" con `?artifactId=`). Ruta `projects/:projectId/runs/:runId/context`.
- Toggle real grafo/lista (`aria-pressed`, mismo conteo de nodos), selector de target y de intento anterior, todos por query params estables (`trace`, `node`, `includeSuperseded`, `view`).
- Motivo de descarte, señal semántica/estructural/dual y decisión siempre comunicados por texto además de color/estilo.
- Tokens Black Glass aditivos en `styles.css` (`--canvas`, `--surface-1/2`, `--glass-bg/blur`, `--signal-*`, `--motion-*`, `--ease-glass`); reduced-motion ya cubierto por la regla global existente.

## Verificación

- `pnpm exec tsc --noEmit -p .`: OK.
- `pnpm exec eslint .`: OK, 0 errores/0 warnings.
- `pnpm exec vitest run`: OK, 32 archivos, 104 pruebas tras el design-review (se agregaron pruebas de búsqueda, filtro por señal y toggle de descartados).
- `pnpm exec vite build`: OK.
- `node scripts/sdd-check.mjs`: OK.
- Revisión manual en dev server (`pnpm dev`, modo mock): grafo, vista de lista, panel lateral, motivos de descarte, señal dual, selector de intentos anteriores, estado vacío, búsqueda/filtros, vista previa en hover y desvanecido progresivo verificados visualmente vía Chrome. En modo `live` (sin RAG Core corriendo) la pantalla se comporta igual que otras pantallas ya existentes con `PendingContractError` (p. ej. `AnalysisHistoryPage`): reintenta y termina en error — comportamiento preexistente del repo, no introducido por esta historia.

## Design-reviewer contra Stitch

El MCP `stitch` requirió reautorización (token OAuth vencido); tras reconfigurar el server con una API key vigente (`X-Goog-Api-Key`) y reconectar (`/mcp reconnect stitch`), se comparó la implementación contra el proyecto `11524813659221805644`:

- Se identificó la pantalla marcada `isFavourite: true` (`screens/5a9667a33e6a403498c6372bfa07894c`, "Explorador de contexto") como la referencia vigente entre varias variantes generadas, y se descargó su HTML/CSS real (no solo el thumbnail, que es de baja resolución) para verificar tokens exactos.
- **Tokens de color confirmados idénticos**: `#F2C94C` semántico, `#34D6D3` estructural, `#C9B4FA` violeta/acento, `#EAE7F7` texto, `#2C2748` borde, `#050506`/`#0B0B0D`/`#101014` canvas/superficies — coinciden con los tokens ya definidos en `styles.css`.
- **Composición del nodo dual** (anillo estructural + núcleo semántico) coincide con `legend-dual`/`signal-dual` ya implementados.
- **Desvíos frente a Stitch aceptados sin acción** (Stitch es referencia visual, no contrato — `design-system/spec.md`): la cadena narrativa "Raíz de ejecución → Artefacto modificado → Target" como nodos propios no existe en `RagContextTraceDetailResponse` (solo `target`+`candidates`); no se fabricaron nodos sin respaldo en el DTO. Tampoco se replicó el glow/partículas SVG decorativo ni el badge "ACTIVO".
- **Desvíos frente a la SDD detectados y corregidos** (estos sí bloqueaban, independientemente de Stitch — la revisión visual fue lo que hizo notar la relectura de `spec.md`/`tasks.md`):
  1. Faltaba **búsqueda y filtros** (`spec.md` "Interacción común": *"Búsqueda y filtros cambian según el modo: RAG filtra señal/decisión/motivo"*; `tasks.md`: *"búsqueda, filtros"*). Se agregó `ragLabels.ts::filterRagCandidates` + input de búsqueda (símbolo/archivo/hash) + chips de señal (Semántica/Estructural/Dual) + toggle "Descartados (N)" en `ContextExplorerPage.tsx`, aplicados tanto al grafo como a la vista de lista.
  2. Faltaba el **resumen en hover** (`spec.md`: *"hover ofrece resumen sin reemplazar el panel"*). Se agregó `.node-hover-preview` (liquid glass, `aria-hidden` por ser redundante con el panel para lectores de pantalla) en `RagGraph.tsx`, mostrado vía CSS en `:hover`/`:focus-visible` del nodo.
  3. El desvanecido de líneas antes/después del panel lateral era uniforme; `spec.md` exige *"desvanecidas progresivamente"*. Se reemplazó la clase `.excerpt-lines.faded` (opacidad plana) por una función `fadeOpacity` en `RagSidePanel.tsx` que gradúa la opacidad por distancia al snippet.
- Evidencia visual: capturas y HTML de referencia descargados en el scratchpad de la sesión (`stitch/context-explorer-favourite.{png,html}`, `context-explorer-semantica.png`); no se versionan en el repo por ser assets externos de Stitch.
- Veredicto: **APROBADO** tras aplicar las 3 correcciones. Sin desvíos pendientes frente a la SDD.

## Contrato aplicado

`INTEROP-1.6 §6.7` (Trazas de contexto), sección `spec/contracts/interoperability-contract.md:465-593`. RAG Core no lo implementa todavía; esta fase solo puede probarse mock-backed, igual que otros adapters live pendientes en este repo.
