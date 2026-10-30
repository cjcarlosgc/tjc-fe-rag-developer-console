# WI-CONSOLE-053 — Revisión UX (HU18, captura de experimentación)

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

## Veredicto: APPROVED (con 3 observaciones menores, no bloqueantes)

Alcance: `ExperimentCapturePanel` (montado en ProjectDetailPage), badge «Reservado para experimentación» en RunsPage y AnalysisRunDetailPage, mock DEMO. Mediciones propias con Chrome headless (CDP) contra `pnpm dev` en modo mock (puerto 5174, detenido al terminar; sin procesos residuales).

## Hallazgos

### Menor
1. **Aviso `role="status"` montado ya con contenido.** Al armar, el foco pasa a «Desarmar», por lo que un lector de pantalla anuncia el botón y puede omitir la advertencia (el Check no se publicará en GitHub). Recomendación: `aria-describedby` en «Desarmar» apuntando al aviso, o conservar el contenedor `role="status"` montado y vacío antes de armar.
2. **Enlace «ver el Run reservado» de 16 px de alto a 1280 px** (inline en párrafo; a 375 px mide 35 px por el salto de línea). Es un enlace en prosa, tolerable (WCAG 2.2 permite inline); mejora opcional: más padding/línea.
3. **Redundancia en Reader/Writer:** el badge «Sin captura armada» más el texto «Sin capturas armadas.» se repiten (Project sin historial). Solo cosmético; basta con omitir la línea cuando el badge ya lo dice.

### Evaluación del nombre duplicado «Armar captura» (HU49 en la página de Experimento)
Es la misma acción verbal con efectos distintos (aquí reserva el siguiente PR real/Check suprimido; allí es especulativa). Las páginas y encabezados distinguen el contexto («Captura de experimentación» en el Project vs. página de Experimento), así que la confusión es baja. Recomendación (sin cambiarlo): si se desea, diferenciar el botón con `aria-label`/texto «Armar captura del siguiente PR» aquí.

### Sin hallazgos
- Honestidad demo: sello «DEMO · DATOS SIMULADOS» presente en el panel; no se presenta como live.
- Texto en español, sin duplicaciones confusas del aviso; mensaje de advertencia claro y accionable.
- Roles: Reader y Writer ven solo estado + «Solo Maintainer o superior pueden armar o desarmar capturas.» sin botones; Maintainer y Admin ven «Armar captura»/«Desarmar».

## Mediciones (reales)

| Prueba | 1280 px | 375 px |
|---|---|---|
| Desborde horizontal (scrollWidth/innerWidth) en Project, lista y detalle de Run | 1280/1280 | 375/375 |
| Sección del panel (scrollWidth/clientWidth) | 1238/1238 | 333/333 |
| Botones Armar captura / Desarmar (alto) | 42 px | 42 px |
| Botones Reader/Writer | 0 botones | 0 botones |
| Foco tras armar | en «Desarmar» | en «Desarmar» |
| Foco tras desarmar | en «Armar captura» | en «Armar captura» |
| Aviso armada | `role="status"` presente; solo existe armada | igual |
| Badge de Run reservado | span `status-badge status-warn`, 12 px, alto 26 px, presente en lista y detalle | presente en ambos, sin desborde |
| Contraste del aviso/badge (#f1ca7c sobre #1d1a10) | ~11:1 (>= AA) | igual |

Proyectos probados: prj_checkout_demo (ADMIN, armar/desarmar), prj_org_orders_demo (MAINTAINER), prj_org_writer_demo (WRITER), prj_org_metrics_demo (READER).

Capturas del leader (`wi-console-053-captura-0N.png`) no tocadas.
