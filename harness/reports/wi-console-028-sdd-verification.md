Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-028 — verificación de suficiencia SDD

Fecha: 2026-10-12. WI: `WI-CONSOLE-028`, ST-CONSOLE-030 (`spec/transversal/accessibility/tasks.md`). Solo lectura; no se editó `app/` ni specs. Líneas de `app/src/styles.css` (572 líneas, un único archivo CSS) y TSX según el árbol actual.

## Veredicto: APPROVED

Alcance suficiente, concreto y sin cambios de comportamiento funcional, contrato ni copy (salvo el «—» ya aprobado). Ninguna decisión DEC PENDING/PROPOSED con `Blocks` alcanza este WI (coincide con `decisionGate` del WI). Ninguna parte exige decisión del usuario; solo hay dos ambigüedades menores con recomendación (sección Ambigüedades).

## Tokens CSS compartidos existentes (`:root`, styles.css:1)

No introducir hex nuevos. Disponibles: `--accent #c9b4fa`, `--muted #bcbac9`, `--text-dim #716f82`, `--signal-focus #ffffff`, `--border #2c2748`, `--border-subtle #1f1d2b`, `--surface-1/2/3`, `--accent-dark`, `--signal-agent`. Patrones de foco ya sólidos en el repo: `var(--accent)` (líneas 34, 499, 569) y `var(--signal-focus)` (259, 361). Contraste aproximado sobre `#050506`/`#0b0b0d`: `--accent` ≈10:1, `--muted` ≈9:1, `--text-dim` ≈4.0:1.

## Punto 1 — Anillo de foco global ≈2.7:1

- Causa: `styles.css:32` `.button:focus-visible, input:focus-visible, a:focus-visible { outline: 3px solid rgba(201,180,250,.42) }`; mismo `rgba(...,.42)` en 51 (`.field select`), 333 (`.graph-node`), 395 (`.focus-mode-card`). Líneas 49 y 59 (`.field input/textarea:focus-visible`) solo cambian `border-color` (no hay outline propio; heredan el 32 para input, el textarea queda sin anillo global: revisar). Las páginas 34/499/569 ya sobreescriben con `var(--accent)`; el comentario de la línea 33 documenta explícitamente el ≈2.7:1.
- Corrección mínima: sustituir `rgba(201,180,250,.42)` por `var(--accent)` en las líneas 32, 51, 333, 395 (y, si se quiere, retirar las sobreescrituras redundantes 34/499/569 más el comentario 33; opcional, no necesario). Sin tokens nuevos. Añadir `textarea:focus-visible` al selector 32 si hoy no muestra anillo (verificar en navegador; es corrección de foco dentro del mismo punto).
- Prueba: jsdom no computa contraste ni `outline`. Prueba automatizada viable solo de lectura de la hoja (p. ej. leer `styles.css` y afirmar que ningún `:focus-visible` usa `rgba(`); frágil y dependiente de texto del CSS; **recomiendo no añadirla** o dejarla como comprobación ligera opcional. La verificación real es en navegador: contraste computado antes/después del anillo sobre los fondos reales (canvas, surface-1/2/3, panel). Criterio de aceptación 1 ya lo pide así.

## Punto 2 — Contrastes

| Elemento | Archivo:línea | Medido | Corrección mínima |
|---|---|---|---|
| «VS» | `experiments/ExperimentComparison.tsx:94` `<span className="versus">VS</span>`; CSS `.versus` styles.css:234 `color: var(--text-dim)` | 4.02:1 | `color: var(--muted)` |
| Separador breadcrumbs | `ui/Breadcrumbs.tsx:31` `aria-hidden="true"`; CSS styles.css:139 `.breadcrumbs-sep { color: var(--border) }` | 1.45:1 | decorativo; `color: var(--text-dim)` (≈4:1, supera 3:1 sin cambiar el diseño) |
| `repo-sep` | `ui/RepoChip.tsx:12` `<span className="repo-sep">/</span>` (NO aria-hidden; forma parte de «org/repo» leído); CSS styles.css:436 `color: var(--text-dim)` | 3.89:1 | es texto informativo, no decorativo: `color: var(--muted)` (≥4.5:1). Alternativa: dejarlo y `aria-hidden` no procede porque el lector perdería la «/» |
| Borde botón evidencia | `evidence/EvidenceDownload.tsx:97,105` `button secondary evidence-button`; `.button.secondary` styles.css:36 borde `--border-subtle` | 1.15:1 | ver 1.4.11 abajo: sin cambio |
| Borde P@10/R@10 | `retrieval-comparison/RetrievalComparisonPage.tsx:284-285` `.retrieval-metric-key`; CSS styles.css:512 `border-color: #5b4d86` (hex fuera de tokens) | ≈2.7:1 | ver 1.4.11 abajo: sin cambio exigido |

### Evaluación WCAG 1.4.11 (Contraste no textual)

- Aplica a componentes de interfaz «necesarios para identificar» el control y a objetos gráficos necesarios para entender el contenido. El criterio no exige borde cuando el componente se identifica por su etiqueta de texto o por otro indicador.
- Botón de evidencia: tiene etiqueta de texto visible con ≥4.5:1, forma por fondo `#0f0f14` y el estado de foco (punto 1). El borde no es necesario para identificarlo; es el mismo estilo de todo `.button.secondary`. Recomendación: no tocar (documentar). Cambiar solo este botón rompería la consistencia, y cambiar `.button.secondary` globalmente es rediseño (fuera de alcance, es terreno de WI-005/006).
- P@10/R@10: no son controles; son tarjetas estáticas cuya prominencia ya es redundante con negrita y tamaño (`.retrieval-metric-key dd { font-size: 17px }` y `<strong>`). El borde es sólo énfasis, no el único portador de información. Recomendación: no exigido; documentar. Si el diseñador quisiera, el único cambio mínimo y sin hex sería `border-color: var(--accent)`, pero no lo recomiendo (sobrecorrección); sí se podría sustituir `#5b4d86` por token en WI-005 (grep de colores arbitrarios).
- Separadores decorativos con `aria-hidden`: exentos de 1.4.11 por ser puramente decorativos; la regla del alcance aprobado permite el «mínimo razonable»: subir a `--text-dim` en el breadcrumb es suficiente y sin riesgo.

Prueba automatizada: ninguna para contraste (jsdom no resuelve CSS de la hoja). Sí viable en `Breadcrumbs.test.tsx` afirmar que el separador conserva `aria-hidden="true"` (ya implícito por el diseño; comprobar si el test actual lo cubre) y en RepoChip que la «/» sigue en el texto accesible. Contraste: solo navegador (computado real).

## Punto 3 — Desbordes

CSS en `styles.css`; no se requiere tocar TSX. No quitar contenido.

| Superficie | Archivo:línea | Causa | Corrección mínima |
|---|---|---|---|
| `.analysis-run-summary` (RunDetail, RunComparison, FK detail) | CSS 467 `display:flex; flex-direction:column; align-items:flex-start`; TSX `control-plane/AnalysisRunDetailPage.tsx:159`, `run-comparison/RunComparisonPage.tsx:131`, `action-required/FunctionalKnowledgeDetailPage.tsx:46` | con `align-items:flex-start` los hijos toman ancho de contenido (código largo, `metadata` de 3 columnas) y exceden 375 px | `.analysis-run-summary > * { max-width: 100%; min-width: 0 }` y `code { overflow-wrap: anywhere }` dentro; `.metadata` ya pasa a 1 columna en ≤680 (294) |
| Botón de cabecera, +13 px a 1024 px | `.run-heading-actions` CSS 21 `display:flex` sin `flex-wrap`; TSX `AnalysisRunDetailPage.tsx:136-147` con 3 enlaces largos («Comparar retrieval SE vs SEM») + sello DEMO dentro de `.page-heading` | suma de anchos > contenedor a 1024 | `.run-heading-actions { flex-wrap: wrap; justify-content: flex-end }` (mantener `min-width: 0`) |
| `symbol-list` | CSS 474-475 `li { display:flex; align-items:center }` sin wrap; TSX `AnalysisRunDetailPage.tsx:169-177` (`code` + `target-ref` + `proposal-stamp` con `margin-left:auto`, CSS 23) | `qualifiedName` largo en `code` no rompe | `.symbol-list li { flex-wrap: wrap }` y `.symbol-list code { overflow-wrap: anywhere; min-width: 0 }` |
| `test-proposal-item` | CSS 478 `display:flex; justify-content:space-between` sin wrap; TSX `AnalysisRunDetailPage.tsx:61-64` | `relativePath` largo + badge | `.test-proposal-item { flex-wrap: wrap }`, `.test-proposal-item code { overflow-wrap: anywhere; min-width: 0 }` |
| `status-badge` | CSS 148 (sin `max-width`/wrap); usado en `test-proposal-item` y otros; también `status-success/...` 455-458 | etiqueta larga en `white-space` normal ya envuelve, pero el flex padre no lo encoge | `.status-badge { max-width: 100%; overflow-wrap: anywhere }` (el desborde real se confirma en el navegador; probablemente lo resuelve el padre con wrap) |
| Tabla de experimentos con datos | `experiments/ExperimentComparison.tsx:171-215` dentro de `.table-frame[role="region"] tabIndex={0}` (CSS 189 `overflow-x:auto`) | la tabla tiene 12-13 columnas; el contenedor ya hace scroll pero el desborde reportado es del documento: falta `max-width/min-width:0` en padres flex/grid (`.repetition-detail`, `.experiment-results`, `.panel`) | `.repetition-detail, .experiment-results { min-width: 0; max-width: 100% }`; mantener `tabIndex=0` (operable por teclado, ya probado en test línea 188). Ancho de celda de errores: `.repetition-error-summary { max-width: 260px }` (CSS 262) se mantiene. Verificar en navegador con datos reales del mock (13 columnas) |
| Sellos DEMO / PROPUESTA estirados a 375 px | `.demo-stamp` CSS 116, `.proposal-stamp` 117; TSX `action-required/FunctionalKnowledgeDetailPage.tsx:99` (`<span className="proposal-stamp">PROPUESTA</span>` dentro de `.section-heading` flex; en ≤375 se apila/estira), `run-comparison/CaptureNextPrPanel.tsx:46`, `control-plane/AnalysisRunDetailPage.tsx:175` | hijos de contenedores columna con `align-items: stretch` (p. ej. media 294 `.page-heading … flex-direction:column; align-items:stretch`, `.run-heading-actions` `align-items:stretch`) | `.demo-stamp, .proposal-stamp { align-self: flex-start; width: fit-content; max-width: 100% }`; no cambia el diseño en escritorio. Ya existe `.run-heading-actions .demo-stamp { align-self:flex-start }` (294) y `.retrieval-page .demo-stamp` (496) como precedentes del patrón |

Prueba automatizada: ninguna fiable (jsdom no calcula layout). Verificación solo en navegador: 375/768/1024 px, `document.documentElement.scrollWidth <= clientWidth` en cada pantalla afectada (RunDetail PR#45 y uno con símbolos largos, RunComparison, FK detail, Experimentos con resultado completado, Estrategias). Evitar pruebas que afirmen nombres de clase CSS (ver riesgos).

## Punto 4 — Comportamiento accesible

### 4a. Foco en `onError` y `ABSTAINED` por `resolveConflict` (Focus Mode)

- Archivo: `action-required/FocusModePage.tsx`.
- `submit` (líneas 60-70): en `onSuccess` con `ABSTAINED` llama `cardRef.current?.focus()` (test 190-206 lo cubre para el botón «No lo sé»). **No existe `onError`**: tras un error (409 que no sea conflicto, 5xx, 429) el botón queda `disabled` durante `isPending` y el foco se pierde en `body`.
- `resolveConflict` (75-80): `onSuccess` hace `if (result.outcome !== 'ABSTAINED') setAnswerText('')` y `setPendingAnswer(null)`, **sin** llamar `cardRef.current?.focus()` cuando `ABSTAINED` llega por conflicto; además los botones de resolución están dentro del bloque `conflict`, que desaparece al éxito → el foco se pierde.
- Corrección mínima: (i) añadir `else cardRef.current?.focus()` en el `onSuccess` de `resolveConflict` (misma línea que en `submit`); (ii) añadir `onError` que devuelva el foco a un destino estable: para error simple, el `<p role="alert" className="inline-error">` no es focusable; el destino coherente es `cardRef.current?.focus()` (contenedor de la pregunta, `tabIndex={-1}`, ya usado). Para error de conflicto, el bloque `.focus-mode-conflict` (role=alert) sigue presente; enfocar `cardRef` también es consistente. Recomendación: `onError: () => cardRef.current?.focus()` en ambos mutate. Es el mínimo y reutiliza el patrón ya aprobado (comentario línea 41-42).
- Prueba automatizada viable (RTL + userEvent, semántica/foco, sin clases): en `FocusModePage.test.tsx`: (a) mockear fallo 500 en submit y afirmar `toHaveFocus()` sobre el contenedor de la pregunta (se localiza como en test 206, `screen.getByText(PREGUNTA).closest(...)`; preferible añadir `data-testid` o `getByRole('group')`... ver riesgos); (b) flujo HU51: provocar conflicto con la respuesta que lo dispara, hacer clic en «Reemplazar regla vigente» con respuesta `UNKNOWN` (outcome ABSTAINED) y afirmar foco. Verificar que el mock `mockBackend.ts:1565-1577` soporta `ABSTAINED` por resolución (línea 1577 devuelve `outcome: 'ABSTAINED'` en una rama; confirmar que es la rama de `conflictResolution`). Si no, se hace con `vi.spyOn`/`fetch` como en el test live (línea 49-70).
- Solo navegador: orden real de foco con lector de pantalla (no verificable aquí; documentar como no verificado).

### 4b. Wrapper `role="status"` de Functional Knowledge

- Archivo: `action-required/FunctionalKnowledgePage.tsx:~49` `<div role={knowledgeQuery.isSuccess ? 'status' : undefined}>`. El rol se monta solo tras el éxito: una región live que aparece ya con contenido no se anuncia fiablemente; por eso HU35/HU36 (test línea 85) exige que se «mantenga montada».
- Corrección mínima: `<div role="status">` fijo (siempre montado; vacío mientras carga/error).
- Prueba: ajustar `FunctionalKnowledgePage.test.tsx`. **Riesgo:** `LoadingState` ya renderiza `role="status"` (`ui/Feedback.tsx:21-23`), de modo que mientras carga habrá dos `role="status"`; el test de carga (línea 116, «muestra el estado de carga con role="status»») y el de la línea 85 (`getByRole('status')` tras `findByRole('heading')`, ya sin carga: sigue habiendo uno solo) deben revisarse; el de 116 con `getByRole` fallaría por duplicado → usar `getAllByRole`/`within`. Añadir test: durante la carga existe una región `status` vacía con el texto del wrapper (afirmar que el nodo `status` que no contiene el spinner existe). Totalmente viable en jsdom.

### 4c. Jerarquía H3 antes de H2 en el detalle del Run

- Archivo: `control-plane/AnalysisRunDetailPage.tsx:167` `<h3>Símbolos cambiados</h3>` dentro de `.panel.analysis-run-summary` (línea 159), situado tras el `h1` (139) y antes de cualquier `h2` (los h2 están en `PublishSection` 58, «Contexto recolectado» 103, «Evidencia versionada» 232, y «Trace operativo» `OperationalTraceSection.tsx:211`). Es el único h3 previo a un h2.
- Corrección mínima: cambiar a `<h2>Símbolos cambiados</h2>` y ajustar el estilo para no cambiar la apariencia: `.result-title h3` (CSS 166) no aplica; no hay estilo `h3` específico para este título dentro de `.analysis-run-summary`, de modo que el cambio a h2 hereda estilos globales de `h2` (revisar `styles.css` líneas 1-30 para `h2` global; verificar visualmente que el tamaño no salta). Si salta, añadir `.analysis-run-summary h2 { font-size: <igual al h3 previo> }` (valor existente, sin token nuevo) o clase local.
- Los `h3` de `OperationalTraceSection` (73, 126, 150, 157, 162) quedan bajo el `h2 id="operational-trace-title"` (211): correctos. Verificar que la sección «Contexto recolectado» no tenga h3 sin h2 previo (en 108-115 el test usa `heading { name:'formatCurrency' }`).
- Prueba viable: en `AnalysisRunDetailPage.test.tsx`, recorrer `screen.getAllByRole('heading')` y afirmar que ningún encabezado salta más de un nivel y que el primero tras el h1 es nivel 2 (semántica, sin clases).

### 4d. «—» en Intento / Evaluable en corrida mixta

- Archivo: `experiments/ExperimentComparison.tsx:200` `{item.attempt === null ? '' : \`${item.attempt}.º\`}` y 203 `{item.technicallyEvaluable === null ? '' : ...}`. Las columnas se muestran solo si alguna repetición trae el dato (`showRunColumns`, línea 86): ese comportamiento se conserva.
- Corrección mínima: sustituir `''` por `'—'` en ambos casos (existe ya el literal `'—'` en 207-212 para duración/tokens; no hay constante `NO_DATA` aplicable: `NO_DATA='sin datos'` y `UNAVAILABLE='no disponible'` tienen otro propósito y no deben reutilizarse para no cambiar el copy aprobado).
- Prueba viable: en `ExperimentComparison.test.tsx` fixture mixto (una repetición con `attempt:1, technicallyEvaluable:true`, otra con ambos `null`): afirmar celdas con «—» en las posiciones de Intento/Evaluable de la segunda fila, y que las columnas siguen presentes; el test existente (línea 134) con todo `null` sigue pasando (no hay columnas). Añadir comprobación de que «—» no aparece en la corrida íntegramente sin datos.
- Atención a accesibilidad: «—» sin texto alternativo se anuncia como «guion» o se omite; es coherente con los «—» ya existentes en la misma tabla; no añadir copy nuevo.

## Ambigüedades (con recomendación; ninguna bloquea)

1. Regla «—»: el reporte de alcance dice «—» en corrida mixta y omitir columnas solo cuando NINGUNA repetición trae el dato; el código ya implementa lo segundo (línea 86). Interpretación recomendada: mantener `showRunColumns` y solo rellenar celdas nulas con «—». Sin ambigüedad real.
2. «Mínimo razonable» de separadores decorativos: se interpreta como `--text-dim` (≈4:1) en breadcrumbs; `repo-sep` no es decorativo (no tiene `aria-hidden`) y se trata como texto (`--muted`). Si el implementer prefiere `aria-hidden` en `repo-sep`, cambia lo que anuncia el lector: no hacerlo.
3. Anillo de foco: el alcance dice «tokens CSS compartidos»; no hay un token `--focus-ring`. Recomendación: usar `var(--accent)` directamente (ya es patrón del repo) en vez de crear un token nuevo (crear `--focus-ring` es válido pero ensancha el diff; opcional si el implementer lo juzga más limpio, sin valor nuevo: `--focus-ring: var(--accent)`).
4. `textarea` sin anillo global (líneas 49/59 dejan solo `border-color`): confirmar en navegador; si no hay anillo, es parte del punto 1.

## Riesgos

- Regresión visual al subir foco (`--accent` más contrastado, mismo grosor 3 px): revisar en `.graph-node`, `.focus-mode-card`, `.segmented`; el anillo blanco `--signal-focus` en `.rag-node.is-focused` (361) no se toca.
- `h3 → h2` puede cambiar tamaño/espaciado del título «Símbolos cambiados» (CSS global de `h2`); revisar en navegador.
- Pruebas que dependan de clases: el test de foco (190-206) usa `.closest('.focus-mode-card')`; los nuevos tests deben preferir roles/nombres accesibles. No se añadan aserciones sobre `styles.css`. No cambiar nombres de clase (los tests existentes y otros WI las usan).
- Doble `role="status"` durante la carga en Functional Knowledge (ver 4b): ajustar los tests que usan `getByRole('status')` en esa fase; no cambiar `LoadingState` (compartido).
- `flex-wrap` en `.run-heading-actions` puede cambiar el layout en ancho intermedio (768-1023): verificar a 768 px, además de 375 y 1024.
- Las pruebas de jsdom no cubren contraste ni desborde: la evidencia de los puntos 1, 2 y 3 es solo de navegador (aceptación ya lo exige; `ux-reviewer`).
- La suite completa de vitest es intermitente bajo carga (reporte D): usar `--maxWorkers=2` y re-ejecutar aislados; no atribuir fallos intermitentes a este WI.

## Discrepancia de storyIds y relación con WI-005/006

- WI-CONSOLE-005 y 006 declaran `HU01, HU12, HU14` (work-items.json ~línea 263-267 y 333-337); este WI declara `HU12, HU14, HU15` por orden del usuario. Todos son HU01–HU18 válidos (cumple la regla del rol). HU15 no está en 005/006 pero el trabajo concreto (detalle del Run, FK) toca superficies de HU15; HU01 queda sin tocar porque este WI no rehace el sistema visual completo. Se recomienda mantenerlo como está declarado (orden del usuario) y dejar constancia en el reporte de cierre.
- 005 y 006 permanecen `W-PLANNED` y no resultan afectados: ST-CONSOLE-005/006 siguen sin marcar (`tasks.md` línea 3 de accesibilidad; ST-CONSOLE-030 lo declara «sin sustituir»), este WI no marca ni modifica sus `taskIds`, specPaths ni gates. Cuando 005/006 corran, auditarán desde este estado; sin solape de archivos fuera de `styles.css` (conflicto de merge posible en `styles.css` si se trabaja en paralelo).

## Cambios que exigirían decisión (ninguno)

- Comportamiento funcional: ninguno nuevo. La restauración de foco es comportamiento accesible, no funcional; no cambia flujos ni resultados.
- Copy: solo «—» (aprobado). No cambiar textos existentes.
- Contrato/DTO/API/adapters: ninguno. `contractImpact: false` correcto; no se requiere `contract-reviewer`.
- Decisión del usuario: ninguna pendiente.

## Corte recomendado para el implementer (orden)

1. `styles.css`: foco global (32, 51, 333, 395; revisar textarea), `.versus` (234), `.breadcrumbs-sep` (139), `.repo-sep` (436), desbordes y sellos (21, 116-117, 148, 467, 474-475, 478, `.repetition-detail`/`.experiment-results`).
2. `FocusModePage.tsx`: foco en `onError` y en `resolveConflict` ABSTAINED.
3. `FunctionalKnowledgePage.tsx`: `role="status"` fijo; ajustar `FunctionalKnowledgePage.test.tsx`.
4. `AnalysisRunDetailPage.tsx:167`: h3 → h2 (+ ajuste visual si salta).
5. `ExperimentComparison.tsx:200,203`: «—».
6. Tests nuevos: `FocusModePage.test.tsx` (2), `FunctionalKnowledgePage.test.tsx` (1 + ajuste), `AnalysisRunDetailPage.test.tsx` (jerarquía), `ExperimentComparison.test.tsx` (mixto). Verificación manual 375/768/1024 px, teclado y contraste computado en navegador (`ux-reviewer`). Gates: lint, `tsc -b --noEmit`, vitest (`--maxWorkers=2`), build, `node harness/validate-harness.mjs`.

## Resumen

status: APPROVED. blockers: ninguno. findings: ver tablas y ambigüedades. filesAffected (previstos): `app/src/styles.css`, `app/src/action-required/FocusModePage.tsx`, `app/src/action-required/FunctionalKnowledgePage.tsx`, `app/src/control-plane/AnalysisRunDetailPage.tsx`, `app/src/experiments/ExperimentComparison.tsx` y sus tests (`FocusModePage.test.tsx`, `FunctionalKnowledgePage.test.tsx`, `AnalysisRunDetailPage.test.tsx`, `ExperimentComparison.test.tsx`; opcional `Breadcrumbs.test.tsx`). recommendedNextStep: marcar `sddVerified`, correr `node harness/validate-harness.mjs` y delegar a `implementer` (sin escalar), con revisión de `ux-reviewer` y reviewer/Human Reviewer.
