# WI-CONSOLE-014 — Revisión UX / accesibilidad / honestidad de mocks

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Estado: CHANGES_REQUESTED

Alcance: `RetrievalComparisonPage.tsx`, CTA en `AnalysisRunDetailPage.tsx`, bloque CSS final de `styles.css`, pruebas. Sin edición de código. Navegador: mock en `http://localhost:5173` (el servidor no estaba activo al iniciar; se levantó con `console-mock` de `.claude/launch.json`). Viewport restablecido a escritorio al terminar.

## Bloqueantes

- **B1. Previa obsoleta tras completar.** Al lanzar una comparación (pr49 y pr45) la lista «Comparaciones previas» muestra la nueva `rcmp_demo_2001` como «Pendiente (PENDING)» para siempre, aunque el panel ya muestra COMPLETED y los resultados; sin «Ver resultado». `useStartRetrievalComparison` invalida la lista solo en el éxito del POST (cuando está PENDING) y nada la invalida al pasar a COMPLETED/FAILED. Dos estados contradictorios en la misma pantalla. Corrección: invalidar `retrievalComparisonKeys.list` al llegar a estado terminal (efecto en la página o en el hook de detalle) y añadir prueba.
- **B2. CTA sin foco visible suficiente.** El enlace «Comparar retrieval SE vs SEM» en la página del Run no está bajo `.retrieval-page`, así que usa el anillo global `a:focus-visible` con `rgba(201,180,250,.42)`; compuesto sobre `#0b0b0d` da ≈ 2.7:1 (< 3:1, calculado desde el color real de `styles.css:32`). La página destino sí usa `var(--accent)` sólido (#c9b4fa, 3 px, verificado computado). Corrección: regla de foco sólido también para el CTA (o corregir el anillo global).
- **B3. Instrucción falsa para el Reader.** Con rol Reader (pr15) el `role="status"` dice «Elige un símbolo y pulsa «Comparar retrieval SE vs SEM»…» pero no existe selector ni botón. Corrección: mensaje de estado sin invitación a actuar cuando no hay acción (por ejemplo «Solo lectura: puedes consultar las comparaciones previas»).

## No bloqueantes

- **N1.** SEM muestra `semanticWeight` y `structuralWeight` como la cadena literal «null» (`String(null)`). Mostrar «no aplica» (como ya se hace con `combinedScore`).
- **N2.** En SEM la columna `structuralRelation` dice «Sin relación estructural» en todas las filas cuando el dato es `null` (no calculado). Es la misma etiqueta que SE usa para «sin relación»; afirma algo que SEM no evalúa. Usar «no aplica» para SEM.
- **N3.** Ambas tablas tienen el mismo `<caption>` «Candidatos por ranking» y los dos h3 «Métricas» se repiten; incluir el modo («Candidatos del modo SE»). El `div.retrieval-table-wrap` tiene `tabIndex=0` y `aria-label` sin `role` (el nombre no se anuncia de forma fiable): añadir `role="region"`.
- **N4.** Previa FAILED solo muestra «Fallida (FAILED)»: no hay forma de ver su `failureCode`/`failureMessage` (la alerta solo existe al activar una comparación propia). Además el AC pide `ErrorNote` con correlationId y el FAILED usa un `<p class="inline-error">`; confirmar con el reviewer humano que el DTO sin correlationId justifica la desviación.
- **N5.** Las métricas de la previa con métricas (P@5 0.60…) se muestran sin procedencia, mientras la nota dice que la vista no ofrece verdad de terreno. Está bajo rótulo DEMO, pero convendría un texto de origen (p. ej. «métricas de ejemplo con verdad de terreno externa»).
- **N6.** Borde de P@10/R@10 `#5b4d86` sobre `#0b0b0d` ≈ 2.7:1. Es redundante (negrita y mayor tamaño), por lo que no es solo color; aceptable, pero por debajo de 3:1 como componente UI.
- **N7.** A 375 px el CTA se parte en dos líneas y el sello DEMO queda comprimido a 114 px y estirado a la altura del botón (44 px, dos líneas). No hay scroll horizontal causado por esta WI; `/runs/:id` mide scrollWidth 418 por `.analysis-run-summary` (ya existente, no atribuible al CTA).
- **N8.** Pre-existentes, fuera de alcance: separadores `.breadcrumbs-sep` (1.45:1) y `.repo-sep` (3.89:1) de componentes globales; `.experiment-progress span` (clase heredada) renderiza el mensaje de estado a 24 px monoespaciado, sobredimensionado para una frase larga.

## Evidencia (color computado real y navegador)

- Contraste con `getComputedStyle` (fondo compuesto) sobre todos los nodos de texto de `<main>`: 279 nodos en resultado SE/SEM (tablas, `code`, notas, sello, estados, configuración, métricas, previas, hint, role-note): mínimo 9.5:1; ninguno por debajo de 4.5:1 salvo los separadores globales de N8. Aplica también a pr45 (375 px), Reader (pr15) y los textos de estado/FAILED (por código `#ffb4c0`).
- Teclado: Tab salta el botón deshabilitado; tras elegir símbolo, Tab llega al botón «Comparar retrieval SE vs SEM», Enter inicia. El anillo en la página es `rgb(201,180,250) solid 3px`, offset 2 px (`:focus-visible` true), alto contraste. Foco programático al h2 «Resultado de …» tanto al terminar una comparación propia como con «Ver resultado» (con foco visible 3 px).
- `role="status"` estable: mismo nodo durante todo el ciclo (MutationObserver): «Comparación pendiente de empezar.» → «Ejecutando retrieval SE y SEM… En ejecución» → «Comparación completada. Resultados disponibles abajo.». Sin `role=alert` en el ciclo normal; `role=alert` solo para FAILED (por prueba `RetrievalComparisonPage.test.tsx:134`; FAILED no es creable en el mock, revisado por código/prueba).
- Encabezados: H1 → H2 (Iniciar, Estado, Resultado, Previas) → H3 (Modo SE/SEM, Métricas); sin saltos. Tablas con `<caption>` y `th scope`.
- Sin scroll horizontal a 375 px en pr45 (scrollWidth = 375) y en pr15; las tablas desplazan dentro de su contenedor (235/761 px). Sello DEMO 180 px, no estirado, en esa página. pr45: un solo símbolo, sin auto-inicio.
- Rotulado «DEMO · DATOS SIMULADOS» presente. No hay ganador, deltas, estadística, PHP ni verdad de terreno cargable; «no disponible» ×4 por modo sin métricas; con métricas se muestran P@5/R@5 y P@10/R@10 destacadas.
- Reader (pr15): sin selector, botón ni CTA; nota de rol y previas. Writer en ACTION_REQUIRED (pr21): CTA visible (no depende del gate) y enlaza a `/projects/prj_org_writer_demo/runs/arun_org_writer_pr21/retrieval-comparison`.
- Reduced-motion: el bloque CSS nuevo no añade animaciones ni transiciones propias (solo la `transition` global de `.button`, no relevante). Sin cambios necesarios.
- No verificado: lector de pantalla real; FAILED en vivo (no producible desde el mock); estado «Comparando…» del POST (instantáneo en el mock).

## recommendedNextStep

Corregir B1, B2 y B3 (cambios pequeños, con prueba para B1 y B3), valorar N1–N3, repetir la revisión rápida de esos puntos y entonces pasar a la revisión humana.
