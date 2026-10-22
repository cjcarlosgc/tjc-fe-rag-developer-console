# WI-CONSOLE-047 — revisión UX independiente (ciclo 1 de 2)

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Veredicto: CHANGES_REQUESTED** (un hallazgo menor-medio dentro de la superficie tocada; ningún bloqueante de alcance). Rango `6049f3b..HEAD`. Medido en Chrome del Browser pane (dev server mock :5173; iframes same-origin de 640, 375 y 320 px; 1280 px en iframe). Servidores :5174 y :5175 cerrados; viewport del pane no se modificó.

## Mediciones

1. **Objetivos táctiles (375/320/640):** `a.brand` 161×40; skip link 184×40, visible con Tab real (foco top 12 px, outline sólido 3 px, `:focus-visible` true); `.project-tabs a` 85×40, 61×40, 102×40, 192×40, 134×40 (5 de 5 ≥ 40). PASS. Debajo de 40 px (declarados): migas de pan 17 px de alto (en todas las páginas de detalle), «Ver todos →» 18 px. **No declarados en los reportes:** botones «Ver inventario →» de Historial a 34 px de alto (×3, 259 px de ancho). Coincido en que migas y «Ver todos» están fuera del alcance aprobado; no son bloqueantes del WI (son enlaces de texto en línea con alternativa de teclado), pero WCAG 2.2 SC 2.5.8 (24 px) sí los cumple solo por la excepción de enlaces en línea/espaciado; migas a 17 px sí quedan bajo 24 px: **recomiendo que el usuario decida un WI posterior**. Los botones de 34 px sí son controles autónomos bajo 40 px: añádelos a la lista DECISION_REQUIRED.
2. **Focus Mode:** `scrollWidth` 375 a 375 px, 320 a 320 px, 640 a 640 px y 1280 a 1280 px (sin scroll horizontal ni regresión). Proyecto, Projects, Action Required, Runs, Experimental, Functional Knowledge: igual, sin desborde.
3. **Glosario:** ver hallazgos; en general consistente (Projects/Workspace/Run/Action Required/Focus Mode/PR/HEAD/Baseline/Repository binding correctos; estados LIVE→«EN VIVO», pestañas «Resumen»/«Integraciones»).
4. **Conteos en demo (workspace acme):** badge del nav = **5** (todos los Workspaces; `aria-label` «Action Required, 5 pendientes en todos tus Workspaces»); `/action-required` sin filtro = 5 tarjetas, con `workspaceId=1000001` = 3; KPI de Projects = **3** («Workspace seleccionado»); tarjetas «Requieren tu atención» = 3; por Project: checkout 2 + billing 1 = 3; lista de Runs: 5 Runs en Action Required (3 en el Workspace). Coherente a nivel de Run. El PR #17 (STALE, escenario HEAD nuevo) queda fuera de bandeja, nav, KPI y lista: honesto y coherente con el glosario («Obsoleto (HEAD nuevo)»; no requiere acción).
5. **Error de configuración** (`live` + `ftp://x`, :5174): `h1` «Configuración no válida», `role="alert"` presente, título de documento «Configuración no válida · RAG Test Studio», foco en `main`, sin valor crudo («ftp» no aparece), sin scroll horizontal a 375 ni 640, español claro y accionable (qué falla, formato esperado `http(s)://host[:puerto]`, dónde corregir, reiniciar, alternativa `VITE_DATA_SOURCE=mock`). Mock con `ftp://x` (:5175): login mock y Projects funcionan. PASS.
6. **A11y (muestra propia):** árbol de `read_page` correcto: `banner`, `navigation "Navegación principal"`, enlace «Action Required, 5 pendientes en todos tus Workspaces», `navigation "Ruta de navegación"`, `main`, `group "Respuesta"`, `textbox "Aclaración (opcional)"`, `select` etiquetado «Workspace»; skip link primero en el orden de Tab.

## Hallazgos priorizados

- **H1 (media, corregible dentro de 047 o diferible por decisión del usuario): desborde horizontal en el detalle de Run a 320 px.** `/projects/prj_checkout_demo/runs/arun_checkout_pr52`: `scrollWidth` 376 a 320 px (56 px de desborde) y 376 a 375 px (1 px). Causa: `<code>` con `ShippingAddressValidator.validate` (sin `overflow-wrap`) en «Símbolos cambiados». Incumple reflow (WCAG 1.4.10) y es el mismo defecto que se corrigió en Focus Mode; la verificación D no cubrió esta pantalla a 320 px (a 640 px sí: 640).
- **H2 (baja): el rótulo de ámbito del badge no es visible.** «5» en el nav y «3» en el KPI conviven sin explicación visible para vidente en táctil/teclado: solo `title` (hover) y `aria-label`. El rótulo del KPI («Workspace seleccionado») es claro; el del nav es honesto pero solo para tecnología asistiva y hover. Sugerencia no bloqueante: texto visible en `/action-required` («N en todos tus Workspaces / filtrado por Workspace»); hoy esa página no muestra el ámbito (header sin ámbito aun con `workspaceId`).
- **H3 (baja): residuos en inglés fuera del glosario:** filtros «Active / Superseded» y chips `ACTIVE/SUPERSEDED/COMPLETED` (probables literales de contrato; conviene rotularlos), «Buscar target», «Retrieval», «MINI DIFF», «CHUNKS», «Comparar retrieval SE vs SEM», «DEMO TIMELINE», «Behavioral Mismatch» en el hero DEMO; «Analysis Run»/«ANALYSIS RUN» frente a «AnalysisRun» del glosario y «sólo/solo» inconsistente. Sin mezclas incomprensibles ni traducciones forzadas. «Functional Knowledge» sigue en inglés (pendiente del usuario).
- **H4 (baja, informativa):** título del documento de Focus Mode «Foco de contexto funcional» vs rótulo visible «Focus Mode»: dos nombres para lo mismo.

Rótulos DEMO (nav, páginas, tarjetas, identidad simulada) visibles; 1280 px sin regresión visual ni desborde en las 8 rutas medidas.

## No probado

Lector de pantalla real (VoiceOver/NVDA; solo árbol de accesibilidad); zoom 200 % real del navegador (se usó equivalente de 640 CSS px); pantalla de error en pestaña real a 200 %; reduced motion y foco en diálogos (me remito al reporte a11y, no re-medido); modo `live` con Core real; paridad de contraste.

## Siguiente paso recomendado

Implementer: corregir H1 (`overflow-wrap: anywhere` en el símbolo del Run y una guarda CSS/medición a 320 px), valorar H2/H3 y registrar los botones de 34 px como DECISION_REQUIRED. Ciclo 2 con nuevas mediciones.

Archivos: `/Users/cjcarlosgc/Development/Tesis/tjc-fe-rag-developer-console/app/src/styles/action-required.css`, `/Users/cjcarlosgc/Development/Tesis/tjc-fe-rag-developer-console/app/src/ui/AppShell.tsx`.

---

# Ciclo 2 de 2

Modelo: ux-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Veredicto: APPROVED con 2 hallazgos nuevos menores registrados (H5, H6) y la lista DECISION_REQUIRED de objetivos < 40 px pendiente del usuario (no bloqueante).** Medido en Browser pane sobre el dev server mock :5173 ya en marcha (no levanté ni cerré servidores; los iframes de medición se eliminaron). Anchos 320, 375, 640 (parcial) y 1280 px.

## Verificación de hallazgos del ciclo 1

- **H1 resuelto.** `scrollWidth` = ancho del viewport (320 y 375) en el detalle de `arun_checkout_pr52`, `arun_billing_pr17`, `arun_billing_pr17_2`, `arun_checkout_pr42/45/46/47/49` y `arun_billing_pr24` (9 Runs x 2 anchos). En pr45 un nodo del grafo (react-flow) queda fuera del recuadro pero no produce scroll de página. A 1280 px sin cambios.
- **H2 resuelto.** `/action-required` muestra «Pendientes en todos tus Workspaces.» con 5 tarjetas; con `?workspaceId=1000001` muestra «Pendientes del Workspace seleccionado.» con 3 tarjetas. Texto visible, discreto, y coherente con badge 5 (todos los Workspaces) y KPI 3 (Workspace seleccionado).
- **H3 mayormente resuelto.** Títulos y rótulos ahora en español: «Comparación de estrategias», «Comparación de recuperación», «Comparar recuperación SE vs SEM», «Recuperación», filtros «Todas / Activas / Reemplazadas», sin los residuos «Buscar target», «MINI DIFF», «CHUNKS». Recorridas Projects, Action Required, Focus Mode, Runs, detalle de Run, Experimental, Retrieval, Comparación, Functional Knowledge y Context Explorer: sin mezclas incomprensibles ni traducciones forzadas. Residuos menores, no bloqueantes: chips de estado `ACTIVE/SUPERSEDED` (literales de contrato) junto a filtros «Activas/Reemplazadas»; enums crudos `METHOD`, `EXCEPTION`, `EXPECTED_RESULT`, `NOT_APPLICABLE`, `PRESENT`; en Comparación, «trial» y «Replay» dentro de texto en español; «Functional Knowledge» sigue en inglés por decisión pendiente del usuario (coherente en toda la UI); eyebrow «ANALYSISRUN» (término del glosario).
- **H4 resuelto.** Título de documento «Focus Mode · RAG Test Studio» = rótulo visible «Focus Mode».
- **Fallo de carga diferida:** no provoqué el fallo en navegador (no bloqueé chunks). Evaluado por código y prueba: `AppLoadErrorScreen` con `h1` «No se pudo cargar la aplicación», `role="alert"`, foco en `main`, título en español, botón «Recargar página», sin enlaces al router; `main.tsx` lo monta en el `.catch` de la carga diferida. `vitest` de `AppLoadErrorScreen.test.tsx` y `main.test.tsx`: 5/5 pasan (incluye el caso de fallo del router).

## Hallazgos nuevos (barrido a 320 px)

- **H5 (baja):** `/projects/prj_checkout_demo/functional-knowledge` a 320 px: `scrollWidth` 328 (8 px). Causa: `fieldset.segmented` «Estado / Todas / Activas / Reemplazadas» se extiende a 328. A 375 y 640 sin desborde.
- **H6 (baja):** `/projects/prj_checkout_demo/runs/arun_checkout_pr52/comparison` a 320 px: `scrollWidth` 354 (34 px). Causa: la rejilla `HEAD / Símbolo` (`div`/`dt`/`dd`, símbolo largo sin romper). A 375 y 640 sin desborde.
Ambos solo a 320 px (reflow WCAG 1.4.10); no estaban en el ciclo 1 porque no se midieron esas pantallas a 320. No los atribuyo con certeza al WI-047 (pueden ser preexistentes). Recomendación: corregir con `flex-wrap`/`overflow-wrap: anywhere` en un corte pequeño, o diferir por decisión del usuario.

## DECISION_REQUIRED de objetivos < 40 px

Registradas en `harness/reports/wi-console-047-a11y-verification.md` (§5 D-a y tabla DR-1 a DR-4): migas 17 px (DR-1), «Ver todos →» 18 px (DR-2), «Ver inventario →» 34 px x3 (DR-3, el hallazgo del ciclo 1), fila «Historial de transiciones» 18 px (DR-4). Siguen sin implementar y son **no bloqueantes** por estar fuera del listado aprobado (marca, saltar, pestañas) y requerir cambio de layout global; decide el usuario.

## Sin regresión

Objetivos de 40 px de A intactos a 320 y 1280: `a.brand` 161x40; pestañas de Project 85x40, 61x40, 102x40, 192x40, 134x40. 1280 px: `scrollWidth` = 1280 en las 12 rutas barridas. Rótulos DEMO presentes (nav «DEMO · DATOS SIMULADOS», identidad simulada, páginas, tarjetas; 3 en la página de Project).

## No probado

Lector de pantalla real; zoom 200 % real; fallo de carga diferida en navegador; modo `live`; contraste; barrido de 320 px en las rutas no listadas (p. ej. detalle de Functional Knowledge, Inventario por versión); reduced motion (me remito al reporte a11y).
