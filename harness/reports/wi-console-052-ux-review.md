# WI-CONSOLE-052 — revisión UX

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Veredicto: APPROVED** (con 2 observaciones no bloqueantes)

## Método
Dev server en modo mock (`VITE_DATA_SOURCE=mock`, `VITE_AUTH_MODE=mock`), navegador integrado, ruta `/projects/prj_checkout_demo/runs/arun_checkout_pr45` (traza `trace_rag_order_total`; el panel RAG vive en el detalle del Run). Viewports 1280 y 375 px. Estado actual del árbol, sin comparación antes/después (no se tocó el árbol).

## Mediciones
| Caso | 1280 px | 375 px |
|---|---|---|
| Documento `scrollWidth`/`clientWidth` (target, SELECTED con capa, OrderItem sin capa, chunk-012) | 1280/1280 en los 3 medidos | 375/375 en los 4 |
| Target: «Estrategia de contexto» = «Por capas» | presente, 59/59 | presente, 42/42 |
| chunk-001 «Capa: Clase declarante»; chunk-002 «Semántico relevante» | presentes, sin recorte (100/100) | presentes (100/100) |
| `OrderItem` (SELECTED sin capa) | sin fila «Capa» (sin fila vacía) | sin fila «Capa» |
| chunk-012 «Descartado: por debajo del umbral de relevancia» | dd 168/168, sin desborde | dd 61/61 sin desborde, pero 61 px de ancho y 102 px de alto (envuelve a ~6 líneas) |
| Nodo del grafo (`.node-badge`) con el rótulo largo | 214/214, dentro del nodo | 214/214 (nodo 9 px dentro del padre); el lienzo del grafo recorta por diseño (pan/zoom) |
| Hover del grafo (`node-hover-preview`) | solo muestra señal, ruta y stats; no incluye el motivo | igual |
| Leyenda | «Descartado (opacidad reducida)», sin nuevas entradas | sin desborde |

Un elemento `CODE` excede el ancho en el probe de bounding box a 1280 px; está dentro de un contenedor con scroll interno propio (el documento no desborda) y no es parte de este WI.

## Hallazgos
1. **Media (no bloqueante, 375 px):** en el panel el `dd` del motivo de descarte queda en 61 px (el `dt` ocupa 114 px) y el texto largo envuelve en ~6 líneas alineado a la derecha. No desborda y es legible, pero es la etiqueta más larga del conjunto. Sugerencia para un WI de pulido: apilar `dt`/`dd` en columna bajo ~480 px. El patrón `dt`/`dd` lateral es previo a este WI.
2. **Baja:** el hover/nodo del grafo no incluye capa ni motivo de descarte; el motivo se ve en el badge del nodo y en el panel. Coherente con el alcance aprobado (solo panel); anotar si se quiere paridad.
3. **Baja:** el foco por teclado no se verificó visualmente (en este harness `.focus()` programático no activa `:focus-visible`); los nodos son `<button>` nativos, sin cambios del WI en esa parte.

## Honestidad del mock y glosario
- Las filas nuevas solo aparecen si el dato existe; sin filas vacías ni «undefined».
- Glosario en español: Capa (Clase declarante, Evidencia del target, Semántico relevante), Estrategia de contexto (Por capas / Por ranking), «umbral de relevancia». Términos de dominio (Target, Score, Top-K) permitidos.
- Fallback: valores desconocidos se muestran crudos o «Descartado»; nunca cadena vacía.
- El mock sigue rotulado «DEMO · IDENTIDAD SIMULADA»; capas y estrategia se asignan solo a `trace_rag_order_total` (documentado en el código) y no se presentan como dato real.
- Contraste: texto `rgb(234,231,247)` sobre fondo `rgb(5,5,6)` (ratio alto); sin colores nuevos.

## Limpieza
Dev server detenido (puerto 5173 libre) y viewport restablecido a desktop.
