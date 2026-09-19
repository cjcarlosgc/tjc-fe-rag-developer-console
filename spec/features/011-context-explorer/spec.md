# 011-context-explorer — Especificación

**Estado:** aprobado para implementar (HU27, HU28) — HU54 sigue `PROPOSED`, sin contrato (implementada en Console como capa especulativa, ver sección propia abajo).
**Historias:** HU27, HU28, HU54

## Objetivo

Mostrar en una pantalla amplia y navegable la evidencia de contexto recolectada para una generación, con dos modos que comparten shell y panel lateral pero mantienen semánticas distintas: `Contexto RAG` y `Exploración del agente`.

## Entradas

- Desde el resultado o los artifacts de un run: abrir el contexto general del run.
- Desde un artifact creado/modificado: abrir el mismo explorador filtrado por los targets asociados a ese archivo mediante `ArtifactResponse.targetIds`.
- Desde un experimento: abrir una repetición concreta `RAG` o `GENERALIST_AGENT`.
- Mostrar el último intento por defecto; permitir consultar intentos anteriores conservados tras retry.

## Contexto RAG — HU27

- Grafo horizontal con target raíz y todos los candidatos recuperados. Cada conexión termina en un nodo visible; no se dibujan caminos huérfanos.
- Amarillo `#F2C94C` identifica señal semántica; turquesa `#34D6D3` señal estructural; coincidencia dual usa anillo turquesa y núcleo amarillo; blanco marca foco. Cada señal tiene además una forma propia (círculo/cuadrado/anillo+núcleo), no solo el color, para no depender de distinguir tonos (daltonismo).
- El estado de un nodo tiene tres ejes independientes que pueden coexistir en el mismo nodo: **decisión** (Retenido/Descartado — dato de negocio, si RAG Core mantuvo el chunk en el contexto), **señal** (semántica/estructural/dual — tipo de coincidencia derivado), y **foco** (si ese nodo es el que muestra el panel lateral en este momento — puramente de interfaz). La leyenda y el detalle lateral deben poder expresarlos por separado; ninguno sustituye a los otros.
- Candidatos descartados permanecen visibles a 30% de opacidad y/o borde discontinuo. Hover/focus explica `BELOW_MINIMUM_SCORE`, `TOP_K_LIMIT` o `TOKEN_BUDGET`. La atenuación no debe implementarse con `opacity` a nivel de elemento si el nodo tiene un tooltip hijo (heredaría la misma opacidad y quedaría ilegible); atenuar cada propiedad de color por separado.
- El detalle lateral muestra path, símbolo, rango, score, tokens, señales, decisión, hash, truncamiento, snippet exacto y hasta dos líneas anteriores/posteriores desvanecidas progresivamente. Cada línea de contexto se muestra en una sola fila, sin wrap; si no cabe se trunca con elipsis (no scroll ni ajuste de línea) — solo el snippet activo puede desplazarse horizontalmente.
- El score nunca se rotula como probabilidad o confianza científica.

## Exploración del agente — HU28

- Organizar por repetición → target → trayectoria ordenada → herramienta → archivo/símbolo observado.
- Usar violeta/lavanda `#A78BFA`; no reutilizar amarillo/turquesa RAG como decoración.
- `list_files` muestra un nodo resumen (por ejemplo “146 archivos disponibles”); no dibuja todas las rutas inicialmente. “Mostrar descubiertos” abre el listado paginado.
- `search_text` muestra coincidencias; `inspect_symbol`, declaración y referencias; `read_file`, contenido efectivamente entregado. Vacíos/errores se atenúan.
- No usar categorías seleccionado/descartado. La etiqueta es “contexto observado por el agente” o “contenido entregado al agente”, nunca “contexto utilizado”.
- El panel lateral muestra herramienta/paso, argumentos, archivo/símbolo, rango, snippet, dos líneas circundantes (mismo componente y misma regla de truncamiento que HU27), truncamiento y hash.

## Interacción común

- Canvas con pan/zoom, reencuadre, minimap discreto y navegación por teclado. Seleccionar un nodo abre panel lateral liquid glass; hover ofrece resumen sin reemplazar el panel.
- Búsqueda y filtros cambian según el modo: RAG filtra señal/decisión/motivo; agente filtra herramienta/estado/path.
- Estados loading, vacío, error y retry siguen `design-system` y `accessibility`. En concreto para esta pantalla: el loading debe mostrar fase textual y tiempo transcurrido (p. ej. "Cargando detalle de la traza… T+2.3s"), nunca un spinner sin fase ni fallback; una traza que sigue procesándose (`CONTEXT_TRACE_NOT_FINISHED`, reintentada por polling) es un estado de carga, no un error, y no debe mostrarse como tal.
- El frontend consume únicamente `INTEROP-2.1` sección 6.7; no reconstruye scores, motivos ni observaciones desde strings. `INTEROP-2.1` retiró el endpoint de trazas por `test-runs` (run-scoped, HU27) junto con la generación manual — solo sobrevive el de trazas por `experiments` (HU27/HU28); ver hallazgo en el reporte de sincronización 2.1.

## Pendiente de implementar — HU54 (PROPOSED, registrada 2026-09-14)

El árbol de contexto hoy solo representa señal RAG (semántica/estructural,
HU27) y trayectoria del agente (HU28) — nunca conocimiento funcional
persistido ni evidencia de tests existentes, aunque ambos alimentan el
Context Builder real de un `AnalysisRun` (§9 de la arquitectura objetivo).
Falta: representar esos dos orígenes como nodos/paneles propios en el mismo
árbol, distintos de los candidatos RAG — sin inventar campos: hoy no hay
forma de contrato para esto (§6.7 sigue sin adaptar al modelo `AnalysisRun`
más allá de lo ya cubierto por `AnalysisRunDetailPage`'s `ContextSection`,
que reusa HU27 mock-only). Hallazgo original en
`harness/reports/console-15-case-walkthrough-findings.md` (Caso 1, punto 2).
Sin alcance de implementación aprobado todavía.

**Implementado en Console (mock-first especulativo, `feature/T-001`):**
simplificación deliberada respecto al diseño completo de arriba — no son
nodos/paneles nuevos dentro del árbol de contexto (RagGraph/RagSidePanel
siguen intactos, HU27 sin tocar), sino un panel de lista aparte, debajo del
grafo, dentro del mismo `ContextSection` de `AnalysisRunDetailPage`:
`context-explorer/speculative/contextProvenance.ts` deriva qué reglas de
Functional Knowledge `ACTIVE` y qué evidencia de tests existentes
comparten símbolo con el Run, y los lista con el badge `.proposal-stamp`.
`ProposedCapabilityError` en modo live — sigue sin contrato real. Integrar
esto al árbol como nodos propios (el diseño original) queda pendiente si
Core llega a definir una forma.

## Fuera de alcance

- Inferir influencia interna o mostrar chain-of-thought.
- Mezclar RAG y agente en una estructura conceptual falsa.
- Editar código desde el explorador.

## Referencias de diseño

- Screen canónico en Stitch (proyecto `11524813659221805644`): `screens/5a9667a33e6a403498c6372bfa07894c` ("Explorador de contexto"), única referencia visual vigente para esta pantalla.
- Otras variantes de "Explorador de contexto" generadas en el mismo proyecto (`92c1ded50a61421689d9ccdee438b76e`, `a7133770a0854e13b82cb1d2f0760286`, `d56719f3acc84654a5904dc98a9acfd8`, y la versión mobile `7bcc082ab5394a2e8c6878408247179f`) quedan **superadas**: no consultar como referencia para evitar que el diseño vuelva a fragmentarse entre variantes divergentes.
- Las láminas de especificación `7fef8eee58b74e458c1351bbf7de214c` ("Semántica de nodos") y `7c6689c53a214653af4b00d962bdca18` ("Estados y movimiento") documentan estados/loaders y taxonomía de color con más detalle visual que este texto; sus reglas normativas ya están incorporadas arriba. No adoptar de esas láminas los patrones de partículas animadas ni el brillo/badge "ACTIVO": son decorativos, ya rechazados una vez en la revisión de HU27.
- Revisión de diseño contra Stitch: una sola vez al final de cada tanda de cambios, contra el screen canónico + las dos láminas — no una revisión por cada tarea individual.
