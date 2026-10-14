# WI-CONSOLE-037 — informe de implementación

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

**Estado del corte:** Punto 1 (F1) y Punto 2 (PublishSection) implementados con prueba ROJO→VERDE; gates verdes. Revisión pendiente del Human Reviewer. No hay commit ni push.

## 1. Cambios (archivo:línea sobre el estado final)

### Punto 1 — F1 (ContextExplorer parte de la URL vigente)

- `app/src/context-explorer/ContextExplorerPage.tsx`
  - L2: import `useLocation` y en L1 `useRef`.
  - L93-108: `updateParams` deja de usar el callback funcional de `setSearchParams` (que recibe `previous` del snapshot del render). Ahora compone desde `latestSearchRef.current` (ref con la última query escrita), escribe esa query con `setSearchParams(next, { replace: true })` y guarda `latestSearchRef.current = next.toString()`.
  - L96-99: `latestSearchRef` se inicializa con `location.search` y un `useEffect` la reconcilia con `location.search` cuando React confirma la ubicación (aterriza nuestra escritura o hay navegación externa). No se escriben refs durante el render (regla `react-hooks/refs` de ESLint; una primera versión que lo hacía fallaba lint).
  - Los escritores (`updateParam`, efectos L115-126 de trace/node, clics de repetición, checkbox `includeSuperseded`, botones de vista, `onSelect`) no cambian: todos pasan por `updateParams`.
- `app/src/context-explorer/ContextExplorerPage.test.tsx`
  - L3-4: imports `act`, `fireEvent` y `useLocation`.
  - L26-29 (antes): se elimina `waitForDefaultSelection` y sus usos en la prueba «alterna entre vista…» y «cambia el renderer…». Ninguna aserción se debilita (ver §4).
  - L85-108: nuevo `LocationProbe` y prueba `WI-CONSOLE-037 F1`: espera (`waitFor`) a que `node` esté escrito en la URL, y dentro de un único `act` dispara clic en un nodo del grafo (`formatCurrency`) y clic en «Vista de lista». Afirma `view=list` y que `node` ya no es el valor por defecto.

### Punto 2 — PublishSection

- `app/src/control-plane/AnalysisRunDetailPage.tsx`
  - L71-73: `publishedNow = publication?.status === 'PUBLISHED'` (en memoria); `showPublishButton` añade `&& !publishedNow`. PENDING/PUBLISHING siguen con `busy` y «Publicando…» `aria-disabled`; FAILED/STALE/CLOSED ya estaban fuera por `endedWithoutPublish` y no cambian.
  - L80: el párrafo de cabecera «Publicar nunca hace merge…» solo se muestra si `available.length > 0 && !publishedNow`; si no, el texto existente de «sin propuestas».
  - L134: la nota de rol de solo lectura («Un Writer… puede publicar») no se muestra cuando `publishedNow`.
- `app/src/control-plane/PublishSection.test.tsx`
  - L133-158: nueva prueba `WI-CONSOLE-037`. Espía `controlPlaneApi.listTestProposals`: la primera llamada es real; los refetch posteriores se retienen con una puerta y devuelven la lista previa (propuestas aún AVAILABLE). Afirma en la ventana PUBLISHED («Companion PR publicado» visible, `AVAILABLE` visible): sin botón «Publicar» ni «Publicar nunca hace merge». Tras liberar el refetch sigue sin botón.

No se tocan: DTO, rutas, mocks de listados, pantallas, timeouts de vitest, `harness/*.json`, spec, CHANGELOG.

## 2. Causa raíz

- **F1:** `setSearchParams(fn)` de react-router-dom 7.18.3 llama a `fn` con `searchParams` del render en el que se creó el callback. Si dos escrituras ocurren antes del siguiente render (un efecto de nodo y un clic, o dos clics en el mismo ciclo), la segunda parte del mismo snapshot y pisa a la primera. En la prueba ROJO la segunda escritura (`view=list`) reconstruye la URL sin `node`, así que la selección del clic anterior se pierde. El comentario L93-94 de WI-027 solo cubría dos llamadas en un mismo handler.
- **PublishSection:** `showPublishButton` no distinguía la publicación `PUBLISHED` en memoria. Entre el estado terminal y el refetch de propuestas (invalidado por `useRefreshOnPublicationTerminal`) las propuestas siguen `AVAILABLE`, así que `available.length > 0` volvía a ofrecer «Publicar N propuesta(s)».

## 3. Salidas ROJO y VERDE

### F1 — ROJO contra el código de HEAD (sin corregir), con la prueba final

Fichero: `scratchpad/red_f1_final_unfixed.txt` (resumen):
```
× WI-CONSOLE-037 F1: dos escrituras de URL en el mismo ciclo (nodo y vista) no se pisan
Failed Tests 1
Tests  1 failed | 6 passed (7)
```
Primera ejecución del ROJO (antes de la corrección y con la espera original): `scratchpad/red_f1.txt`, fallo en `expect(readParams().get('node')).not.toBe(defaultNode)` (el nodo vuelve al valor por defecto).

### F1 — VERDE (corrección final)

Fichero: `scratchpad/green_f1_final_fixed.txt` y repetición final. `Tests 7 passed (7)` en 8/8 ejecuciones consecutivas de `ContextExplorerPage.test.tsx` (`scratchpad/final_ce_1..8.txt`).

Nota de estabilidad: antes de quitar la espera, la prueba nueva fallaba de forma intermitente (1 de 6 ejecuciones) en la precondición `node !== null`: `waitForDefaultSelection` comprobaba el nodo pulsado, no que `node` estuviera escrito en la URL. Se sustituyó por `waitFor` sobre la URL (`scratchpad/ce2_run_*.txt`, ce_run_1.txt con el fallo).

### PublishSection — ROJO (sin corregir)

Fichero: `scratchpad/red_publish.txt`:
```
× WI-CONSOLE-037: PUBLISHED en memoria oculta Publicar y su oferta aunque el refetch de propuestas siga AVAILABLE
Error: expected document not to contain element, found <button class="button primary" ...>
Tests 1 failed | 6 passed (7)
```
El fallo está en la ventana PUBLISHED antes del refetch, en la aserción de ausencia del botón.

### PublishSection — VERDE

`PublishSection.test.tsx` y `AnalysisRunDetailPage.test.tsx` juntos: `Test Files 2 passed (2)`, `Tests 38 passed (38)`.

## 4. Esperas de WI-027 (`waitForDefaultSelection`)

Quitado. Con la corrección, las pruebas «alterna entre vista de grafo y lista conservando los nodos» y «cambia el renderer al alternar…» pasan 8/8 sin espera (`scratchpad/ce3_run_*.txt`). La espera enmascaraba la carrera: esperaba un estado visual (nodo pulsado) que no garantizaba que la escritura de URL del efecto de nodo ya hubiera ocurrido. Se elimina el helper porque ya no tiene usos. No se modifican aserciones ni timeouts globales (`setup.ts` `asyncUtilTimeout 5000` y `vite.config.ts` `testTimeout 15000` sin cambios).

## 5. Comandos y resultados (cwd `app/`)

| Gate | Comando | Resultado |
|---|---|---|
| Lint | `node node_modules/eslint/bin/eslint.js .` (equivalente a `npm run lint`) | exit 0, sin problemas (`scratchpad/final_lint.txt`) |
| Typecheck | `node node_modules/typescript/bin/tsc -b --noEmit` | exit 0 (`scratchpad/final_tsc.txt`) |
| Suite completa | `node node_modules/vitest/vitest.mjs run --maxWorkers=2` | `Test Files 73 passed (73)`, `Tests 805 passed (805)`, exit 0 (`scratchpad/final_vitest_full.txt`) |
| ContextExplorer x8 | `node node_modules/vitest/vitest.mjs run src/context-explorer/ContextExplorerPage.test.tsx` | 8/8 exit 0, 7/7 cada una |
| Build | `node node_modules/typescript/bin/tsc -b && node node_modules/vite/bin/vite.js build` | exit 0 (solo aviso de tamaño de chunk, preexistente) (`scratchpad/final_build.txt`) |

Nota: un lint ejecutado en una corrida anterior con la primera versión (ref escrita en render) fallaba con `react-hooks/refs`; la versión final pasa. Las salidas de esa corrida previa no se usan como evidencia.

Las salidas están en `/private/tmp/claude-501/-Users-jean-Tesis-workspaces-tjc-fe-rag-developer-console/3b54ef64-6264-4f34-9fbe-22d439c8bd9f/scratchpad/`.

## 6. Puntos abiertos para el reviewer y el leader

1. **Decisión de semántica (no bloqueante, no implementada):** con propuestas `PUBLISHED` mezcladas con algunas `AVAILABLE` y sin publicación en memoria (recarga), la UI sigue ofreciendo publicar las `AVAILABLE`. Así se implementó, como indica el alcance (la regla es por publicación en memoria, no por propuesta). Si el usuario quiere ocultarlo también en ese caso, es una decisión a confirmar.
2. **Recarga con propuestas ya PUBLISHED (available 0):** ya estaba cubierta por la prueba existente «tras recargar, propuestas ya PUBLISHED…» (`PublishSection.test.tsx`, bloque WI-CONSOLE-032), que afirma ausencia de botón. No se duplicó.
3. **Texto de cabecera** cuando `publishedNow` y `available > 0`: muestra «Sin propuestas disponibles para publicar en este Run.» (texto ya existente), aunque haya propuestas `AVAILABLE` en la lista. Es coherente con la oferta oculta, pero el reviewer debe verlo en UX (`ux-reviewer` obligatorio por ser UI).
4. No hay commit ni push. Los ficheros de harness/spec modificados que aparecen en `git status` (`harness/state.json`, `harness/work-items.json`, `spec/.../tasks.md`, informes 037 previos) no son de este corte.

## 7. Conclusión

El corte está **COMPLETO a nivel de implementación y gates**: F1 y PublishSection tienen prueba ROJO verificada contra el código sin corregir y VERDE tras la corrección; lint, typecheck, suite completa (805/805), ContextExplorer x8 y build pasan.

No lo declaro terminado a efectos de WI: falta la revisión independiente (Human Reviewer, o agente `reviewer` si el Modo fuera de casa está activo, según `harness/state.json`) y la revisión UX de `ux-reviewer` por el cambio de cabecera/oferta. Las decisiones de §6.1 y la actualización de CHANGELOG/tasks.md/work-items son del leader.
