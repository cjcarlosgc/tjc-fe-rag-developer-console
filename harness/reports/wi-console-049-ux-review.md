# WI-CONSOLE-049 — revisión UX (ciclo 1 de 2)

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Veredicto: APPROVED** (sin hallazgos bloqueantes; 2 menores no atribuibles al WI).

## Método
Modo demo (`VITE_DATA_SOURCE=mock`, `pnpm dev --port 5199`), navegador integrado, 1280 y 375 px. Mediciones con `scrollWidth` frente a `clientWidth` y búsqueda del elemento que sobrepasa el ancho. Base comparada leyendo `git show 900307a:` (sin tocar el árbol).

## Pantallas recorridas y copy observado
- Inventario: «Targets detectados por RAG Core…», «Buscar target» (label asociado al input), columna «Target», «Sin targets coincidentes / Ajusta el texto o el filtro…».
- Historial de análisis: dt «Chunks» y «Targets» (186 / 5), coherentes con Inventario.
- Context Explorer (grafo y panel): badge «Target», panel `aside` «Detalle del target», región «Grafo RAG del target calculateTotal», «Chunks 1».
- Experimento: label «Target experimental», «Selecciona un target…», tabla `aria-label="Tabla de repeticiones por target"` con cabecera «Target», «24 chunks / 7 chunks», «Ver detalle por target y repetición».
- Run (arun_checkout_pr49): «Changeset grande: 6 símbolo(s) con cambio directo, 8 potencialmente impactado(s).»; Trace operativo: h3 «Changeset», «Target:», y con billing_pr22 «Sin targets / El changeset no tiene símbolos con enlaces por target (targetCount: 0)».
- Functional Knowledge: título/tab «Functional Knowledge», lista, detalle (dt «Target»), vacío «Todavía no hay Functional Knowledge persistido para este filtro.»

## Legibilidad y coherencia
La concordancia es consistente con la convención del glosario: masculino y plural en «-s» («Target experimental», «Sin targets coincidentes», «Changeset grande», «N chunks», «Detalle del target»). Mayúscula solo en rótulos, minúscula en frase; `Functional Knowledge` siempre capitalizado. Un mismo concepto se escribe igual en todas las pantallas. No quedan «Conjunto de cambios», «objetivo» ni «fragmento(s)» en el texto visible recorrido.

## Mediciones (scrollWidth / clientWidth)
| Ruta | 1280 | 375 |
|---|---|---|
| Inventario | 1280/1280 | 375/375 |
| Historial de análisis | 1280/1280 | 375/375 |
| Context Explorer | 1280/1280 | 375/375 |
| Run con changeset grande (pr49) | 1280/1280 | 375/375 |
| Run con «Sin targets» (billing_pr22) | 1280/1280 | 375/375 |
| Functional Knowledge lista / detalle / vacío | 1280/1280 | 375/375 |
| Experimento con resultado (exp_demo_2001, tabla) | **1355**/1280 | **1355**/375 |

Los elementos que sobrepasan el ancho en Inventario, Historial, FK y grafo están dentro de contenedores con `overflow:auto` (`table-frame`, `project-tabs`, lienzo del grafo): no hay desborde de documento.

## Hallazgos
1. **Menor, preexistente (no atribuible a WI-049):** en la página de Experimento con resultado el documento mide 1355 px a 1280 y a 375. Causa: `<span class="visually-hidden">Contexto</span>` del `<th>` de la última columna (posición absoluta sin ancestro posicionado) escapa del `.table-frame` (`overflow:auto`). Ese `th` ya existía en `900307a` (ExperimentComparison.tsx:258) y el diff no lo toca. Recomendación: abrir pendiente aparte (p. ej. `position:relative` en `.table-frame`). Si WI-047 declaró 375 px sin desborde, este caso (tabla con resultado) quedó sin cubrir.
2. **Menor, informativo:** coexisten «Target» (FK detalle, Context Explorer) y «Destino de la regla» (Focus Mode); es decisión aprobada (regla 8 del glosario), no se pide cambio.

Sin hallazgos bloqueantes. Sin desbordes nuevos.

## Nombres accesibles
Correctos y en la convención: `Tabla de repeticiones por target`, `Detalle del target`, `Grafo RAG del target …`, input «Buscar target» con `<label>`. Sin nombres accesibles que mezclen los términos antiguos.

## No probado
Anchos de 320 px; Focus Mode; Retrieval Comparison; Integraciones; mensaje demo de mockBackend:4305 (regla contradicha); lectores de pantalla reales; estados DEMO de error del Experimento; modo claro/contraste; objetivos táctiles (fuera de alcance WI-047).
