# WI-CONSOLE-050 — implementación

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

**Fecha:** 2026-10-22. Rama `feature/jean`. Sin push ni PR.

## Problema

El `.visually-hidden` (`position: absolute`) del `th` de la última columna de la tabla de Experimento (`ExperimentComparison.tsx`, span «Contexto») no tenía ancestro posicionado dentro de `.table-frame` (`overflow-x: auto`, sin `position`). El span escapaba del contenedor y generaba scroll horizontal del documento.

## Archivos tocados

| Archivo | Cambio |
|---|---|
| `app/src/styles/components.css` | `.table-frame` añade `position: relative;` con comentario CSS de una línea. Único cambio de producto. |
| `app/src/styles/cssRegressionGuards.test.ts` | Nuevo `describe` (guarda débil). Import de `readdirSync` y `join`. |

## Guardas añadidas

1. `.table-frame` declara `position: relative` y conserva `overflow-x: auto`.
2. `.visually-hidden` sigue siendo `position: absolute`.
3. Escaneo estático de todo `.tsx` de `app/src` (excluye tests) con `visually-hidden` dentro de `<th>`/`<td>`: debe usar `table-frame`. Lista de excepciones vacía (`VISUALLY_HIDDEN_CELL_EXCEPTIONS`).
4. `ExperimentComparison.tsx` contiene `className="table-frame"` y `visually-hidden` dentro de `<th>`.

Nota: jsdom no mide layout. Estas guardas son débiles; la evidencia de layout está en la sección «Mediciones en navegador».

## Verificación ROJA / VERDE

Se quitó temporalmente solo la línea `position: relative;` y se ejecutó `pnpm exec vitest run src/styles/cssRegressionGuards.test.ts`:

```
× .table-frame declara position: relative (ancestro posicionado) y conserva overflow-x: auto
FAIL  ... > .table-frame declara position: relative (ancestro posicionado) y conserva overflow-x: auto
AssertionError: expected '\n  overflow-x: auto;\n' to contain 'position: relative'
Tests  1 failed | 12 passed (13)
```

Se restauró la línea y se volvió a ejecutar:

```
Test Files  1 passed (1)
Tests  13 passed (13)
```

## Gates (en app/, resultado real)

| Gate | Comando | Resultado |
|---|---|---|
| Lint | `pnpm lint` | exit 0 (eslint sin errores) |
| Typecheck | `pnpm exec tsc -b --noEmit` | exit 0 |
| Tests | `pnpm test --maxWorkers=4` | exit 0 — 94 ficheros, 963 tests passed |
| Build | `pnpm build` | exit 0 (`✓ built in 406ms`) |
| Format | `pnpm format:check` | exit 0 — "All matched files use Prettier code style!" |
| Contratos | `pnpm contracts:check` | exit 0 (`generate-contract-types.mjs --check`) |

## Fuera de alcance (no tocado)

Sin cambios de copy, DTO, rutas, contratos ni primitives. Los pendientes de WI-CONSOLE-047 (DR-1..4, H5/H6), `reasoningEffortMessage`, WI-005/006 no se tocan.

## Mediciones en navegador (leader; modo demo mock, Vite en :5188, navegador integrado)

Método: iframes same-origin a 1280, 375 y 320 CSS px; por ruta se mide `documentElement.scrollWidth/clientWidth`, `.table-frame` y todo contenedor con `overflow-x:auto|scroll` desbordado. Experimento: clic en «Ejecutar comparación» y espera de 12 s (resultado `exp_demo_2001`, `<details>` abiertos); Retrieval Comparison: clic en «Ver resultado». ANTES = árbol con `components.css` restaurado a HEAD (sin `position:relative`); DESPUÉS = con el arreglo. Proyecto `prj_checkout_demo`. Rutas medidas: `/action-required`, `/analysis-runs`, Project, Historial, Inventario (2 rutas), Run `arun_checkout_pr49`, comparación de estrategias, comparación de recuperación, FK lista y detalle, Integraciones, Experimento con resultado y Context Explorer.

| Ruta (doc scrollWidth/clientWidth) | 1280 antes | 1280 después | 375 antes | 375 después | 320 antes | 320 después |
|---|---|---|---|---|---|---|
| **Experimento con resultado** | **1342/1280** | 1280/1280 | **1342/375** | 375/375 | **1342/320** | 320/320 |
| `.table-frame` de Experimento (scroll/client) | 1461/1238 | 1461/1238 | 1461/333 | 1461/333 | 1461/278 | 1461/278 |
| Inventario (`.table-frame`) | 1280/1280 (1238/1238) | igual | 375/375 (627/333) | igual | 320/320 (627/288) | igual |
| Retrieval Comparison (`.retrieval-table-wrap`) | 1280/1280 | igual | 375/375 | igual | 320/320 | igual |
| Resto de rutas (13 de 14) | sin desborde de documento | igual | sin desborde | igual | sin desborde salvo FK lista | igual |
| FK lista a 320 | 320/320 a 1280 y 375 | igual | 375/375 | igual | **328/320** | **328/320** (no cambia) |

Lectura:
- Solo Experimento con resultado desbordaba por este patrón; con `position: relative` en `.table-frame` el documento queda en `clientWidth` a los tres anchos y la tabla conserva su scroll interno (1461/1238, 1461/333, 1461/278).
- El patrón `visually-hidden` dentro de `th`/`td` en contenedor con overflow solo existe en `ExperimentComparison.tsx`. Los demás `visually-hidden` (Retrieval Comparison «Ver resultado», Run «Abrir en GitHub», FK detalle «commit completo», Integraciones) están fuera de contenedores con overflow y no desbordan (medido).
- Inventario y la tabla de alternativa estructurada usan `.table-frame` y no cambian (sin `visually-hidden` dentro).
- FK lista a 320 px (328/320) es preexistente, sin tabla ni `visually-hidden`; no coincide con este desborde y queda fuera del WI (pendientes de WI-CONSOLE-047, H5/H6).
- Una primera pasada se descartó por contaminación: el implementer editaba el CSS mientras corría la medición (HMR); las cifras de arriba son una pasada limpia ANTES y otra DESPUÉS.
