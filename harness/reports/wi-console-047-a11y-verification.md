# WI-CONSOLE-047 — verificación de accesibilidad, zoom, reduced motion y foco (corte D)

Modelo: implementer-high · configurado claude-haiku-5-5 · atendido unknown · esfuerzo high

**Fecha:** 2026-10-21. Rama `feature/jean`. Sin commit, sin push, sin PR. Cubre la observación 6 del alcance aprobado (`harness/reports/wi-console-047-scope-approval.md`). No cambia DTO, rutas, contratos ni tiempo real. No añade dependencias (sin axe-core).

**Resumen:** se automatizaron las comprobaciones razonables con vitest y se midió en navegador real (Browser pane y Chrome headless por CDP). Se corrigieron tres defectos dentro de alcance (nombre accesible del nav «Action Required»; desborde a 320 CSS px en Focus Mode y en la vista previa de Projects). Quedan sin resolver, por decisión del usuario, los objetivos táctiles de migas de pan y «Ver todos» (fuera del listado aprobado). La lectura con lector de pantalla no se pudo hacer.

## 1. Tabla de criterios

Leyenda: «PASS» = cumple con el número medido; «pendiente» = no resuelto y registrado en §5.

| criterio | método | resultado (números) | no probado y motivo |
|---|---|---|---|
| `canAnimateCanvas` (reduce, modo no test, sin matchMedia) | vitest `src/ui/canAnimateCanvas.test.ts`: `matchMedia` simulado con `Object.defineProperty`, `vi.stubEnv('MODE', 'development')`; sin reloj (no hay temporizadores) | 4/4 PASS: MODE=test → false aun sin reduce; reduce → false y consulta exactamente `(prefers-reduced-motion: reduce)`; sin reduce → true; sin `matchMedia` → true | Canvas animado en ejecución: en el mock no aparece ningún loader con canvas durante la medición (0 `canvas` en los 5 recorridos). Cubierto solo por la prueba unitaria |
| Reduced motion, CSS fuente (motion.css, components.css, trace.css) | vitest `src/styles/reducedMotionGuards.test.ts`: parsea cada `@media (prefers-reduced-motion: reduce)` con emparejamiento de llaves y valida animation/transition(-duration) | 8/8 PASS. motion.css: `animation: none`; components.css: regla global `*` con `animation-duration`/`transition-duration: 0.01ms !important`; trace.css: `transition: none`. Autocomprobación: el detector rechaza `300ms` y acepta `none` | **Verificación ESTÁTICA**: no ejecuta la media query. La ejecución se mide en la fila siguiente |
| Reduced motion en ejecución (≤ 120 ms, WI-CONSOLE-006) | Chrome 155 headless con `--remote-debugging-port=9333`, CDP `Emulation.setEmulatedMedia` `prefers-reduced-motion: reduce`; script `reduced-motion-cdp.mjs` y `inject-cdp.mjs` (ver §4) | `matchMedia` = true con reduce. Elementos animados del CSS inyectados en `/` (no aparecen solos en el mock): `.spinner i` 1.1 s infinite → `none` 0.01 ms; `.orbital-icon .orbit-ring` 2.4 s → 0.01 ms; `.graph-pulse-icon circle` 1.8 s → 0.01 ms; `.copy-button` sin animación (transición 0.01 ms con reduce). Barrido de 5 páginas (`/`, `/analysis-runs`, Focus Mode, detalle de Run, Integraciones) a 300 ms y 2.8 s: con reduce, `maxTransitionDurationMs` = 0.01 y 0 animaciones activas; sin reduce, transición máxima 150 ms | No se vio un loader real animándose (el mock responde antes de pintarlo). Se midió con elementos inyectados que usan las mismas clases del CSS de producción |
| Foco: orden de tabulación del shell (Tab real) | Browser pane: `computer` key Tab + `javascript_tool` (activeElement y outline) desde `/projects/prj_checkout_demo`; jsdom: `userEvent.tab()` en `accessibleNames.test.tsx` | Orden: «Saltar al contenido» (h 40 px, outline solid 3px rgb(201,180,250), focus-visible) → marca «RAG Test Studio» → «Runs» → «Action Required» → «Cerrar sesión» → migas «Projects» | — |
| Foco: restauración al cancelar la confirmación de borrado (ProjectDetailPage) | Browser pane, solo teclado: JS `focus()` en «Eliminar Project», Enter abre la confirmación → foco en «Cancelar» (grupo «Confirmar eliminación del Project» presente) → Enter en «Cancelar» → foco en «Eliminar Project» | PASS: foco inicial en Cancelar (no en el botón destructivo); tras cancelar, `deleteBtnFocused = true` | Confirmar el borrado en navegador: no se ejecutó (acción destructiva aunque sea simulada). Cubierto por la prueba existente HU56 (`ProjectDetailPage.test.tsx`) y por el `h1` de destino |
| Foco: restauración al cerrar el aviso de identidad (AppShell → `main`) | jsdom: `AppShell.test.tsx` (HU62 «Reintentar» y «Cerrar») | PASS en jsdom: el foco pasa a `main` tras ambos botones | En navegador no se pudo disparar `notifyAuthError` sin tocar código. Declarado «no probado en navegador» |
| «Foco atrapado» en diálogos | grep en `app/src`: `role="dialog"`, `<dialog`, `aria-modal`, `role=dialog` | 0 coincidencias. No hay diálogos modales; la confirmación de borrado es en línea | No aplica. No se forzó ningún focus trap |
| Escape para cerrar | grep `keydown`/`onKeyDown` en `src` (no test) | Solo `context-explorer/graph/GraphCanvas.tsx` (no es confirmación). La confirmación de borrado no cierra con Escape | No implementado. Sin diálogo modal no hay obligación; no se añadió |
| Zoom 200 % (reflow a 640 CSS px, DPR 2 en el pane) | Browser pane: `resize_window` 640×800; por página, iframe same-origin de 640 px; medido `documentElement.scrollWidth` vs `clientWidth`, elementos fuera del viewport sin ancestro con overflow, contenedores con `overflow:hidden` que recortan, y enlaces/botones < 40 px | 8/8 PASS, sw = 640 en todas: `/` (0 fuera, 0 recortes, 0 < 40 px), Projects detalle (1 < 40), Action Required (1), Focus Mode (2), Runs (1), detalle de Run (2), Integraciones (2), Functional Knowledge (2 < 40 px; 0 fuera; 1 recorte falso positivo: `<legend>Estado</legend>` de 4 px con `clip: rect(0,0,0,0)`, visualmente oculto) | Zoom del navegador real (Cmd/Ctrl +): la herramienta no lo admite. Se emula por ancho de viewport con DPR 2 (el pane ya reporta 2). Objetivos < 40 px: ver §5 (pendiente) |
| Zoom 200 % en la pantalla de error de configuración | Browser pane en `http://localhost:5174/` (build dev con `VITE_DATA_SOURCE=live VITE_CORE_API_URL=ftp://x`) a 640 px | PASS: sw = 640; título «Configuración no válida»; alerta visible | — |
| 375 CSS px (Focus Mode, Projects, Action Required, Runs, detalle de Run, Integraciones, Functional Knowledge) | Browser pane, iframe same-origin de 375 px | 8/8 PASS (sw = 375 en todas). Un único recorte en todas las páginas: `.user-email` de la topbar (`text-overflow: ellipsis`, sw 188 frente a cw 128), intencionado | — |
| 320 CSS px (criterio de reflow más estricto, extra) | Browser pane, iframe 320 px, mismas 8 páginas y pantalla de error | **Antes del corte D:** Focus Mode sw **323** (`.pr-ref` «PR #42 · CouponPolicy.apply» sale a x=323); home sw **328** (`li.action-required-item` a x=329, la pista `auto` del grid). **Después:** 8/8 PASS sw = 320; pantalla de error sw = 320 | — |
| 320 px, pantalla de error | iframe 320 px | PASS sw = 320; alerta 456 px de alto (sin desbordes) | — |
| Desktop 1280 (no regresión de los cambios CSS) | iframe 1280 px | Projects: `ul` = `li` = 1182 px; Action Required: 1240 px = 1240; Focus Mode sw = 1280 | Captura comparativa antes/después no hecha; la comparación es geométrica |
| Tamaño de objetivos táctiles | Browser pane: `getBoundingClientRect` de `a[href]`, `button`, controles | Corregidos en el corte A (marca, «Saltar al contenido» y pestañas a 40 px). En el corte D no se introdujo ningún objetivo nuevo < 40 px. Restantes < 40: migas de pan (Projects 49×17, Action Required 95×17, Runs 30×17, `checkout-service` 103×17) y «Ver todos →» (75×36 y 83×18 a 640 px; 40×54 y 73×36 a 320 px) | Sin decisión del usuario, no se amplía: el listado aprobado de la observación 1 son tres elementos. Ver §5 |
| Árbol de accesibilidad (Chrome, CDP `Accessibility.getFullAXTree`) | script `ax-cdp.mjs` (§4) con sesión mock | Projects: `banner`, `navigation «Navegación principal»`, `main`; enlace `RAG Test Studio, Projects`; enlace `Action Required, 5 pendientes en todos tus Workspaces` (corregido, ver §3); `heading 1 «Projects»`; `heading 2` «Requieren tu atención», «Projects conectados», «Actividad reciente»; tarjetas = enlaces con nombre (`checkout-service`, `billing-engine`). Focus Mode: `navigation «Ruta de navegación»`, `heading 1 «Contexto funcional»`, `heading 2` con la pregunta, `group «Respuesta»` con Sí/No/Depende/No lo sé, `textbox «Aclaración (opcional)»`, `link «Volver»`. Pantalla de error: `main` (focusable), `heading 1 «Configuración no válida»`, `alert`; sin enlaces ni navegación | Lector de pantalla real (VoiceOver/NVDA): no probado, ver §5 |
| KPI «Action Required» con rótulo de ámbito | vitest `accessibleNames.test.tsx` + DOM en navegador | El `.kpi-card` contiene «Action Required» y «Workspace seleccionado»; valor `strong` = 3 (coincide con la suma de tarjetas de ProjectsPage.test) | El KPI es un `div`, sin rol: su nombre sale del texto del contenedor, no de un rol propio. Aceptado |
| Badge del nav (ámbito global) | vitest `accessibleNames.test.tsx`; árbol Chrome | Nombre accesible: `Action Required, 5 pendientes en todos tus Workspaces` (Chrome y jsdom). El badge visible `5` es `aria-hidden` | — |

## 2. Defectos encontrados y corregidos en el corte D

| # | Defecto | Medida antes | Corrección mínima | Medida después |
|---|---|---|---|---|
| D1 | Nombre accesible del enlace «Action Required» sin separador entre el rótulo y el recuento (jsdom antes del cambio: `Action Required5 pendientes en todos tus Workspaces`; Chrome antes del cambio no se midió) | nombre concatenado | `NavLink` con `aria-label` completo `Action Required, N pendientes en todos tus Workspaces` (solo si N > 0). El badge sigue `aria-hidden` y el texto oculto se quita | Chrome: `Action Required, 5 pendientes en todos tus Workspaces`. jsdom: el mismo nombre (prueba `accessibleNames.test.tsx`) |
| D2 | Focus Mode: el `pr-ref` («PR #N · qualifiedName») no partía el token largo y desbordaba la tarjeta a 320 CSS px | scrollWidth **323** a 320 px | `.pr-ref { min-width: 0; overflow-wrap: anywhere }` en `styles/action-required.css` | scrollWidth **320**; `.pr-ref` 47 px de alto (partido en líneas) |
| D3 | Projects, vista previa «Requieren tu atención»: la pista `auto` del grid crecía con el contenido y el `li` se salía del `ul` (222 px frente a 280 px) | scrollWidth **328** a 320 px (`li` a x=329) | `.action-required-list { grid-template-columns: minmax(0, 1fr) }` | scrollWidth **320**; `ul` = `li` en 1280 px (1182 = 1182) |

Corte A (`h2` de Focus Mode con `overflow-wrap: anywhere`) ya cubría el desborde a 375 px. Corte D añade el de 320 px.

Archivos tocados en el corte D:
- `app/src/ui/AppShell.tsx` (nombre accesible del enlace Action Required).
- `app/src/styles/action-required.css` (`.pr-ref`, `.action-required-list`).
- `app/src/styles/cssRegressionGuards.test.ts` (dos guardas débiles más: `.pr-ref` y `.action-required-list`).
- Nuevos: `app/src/ui/canAnimateCanvas.test.ts`, `app/src/styles/reducedMotionGuards.test.ts`, `app/src/ui/accessibleNames.test.tsx`.

## 3. Hallazgos en el árbol de accesibilidad no corregidos

- **Nombres en mayúsculas por `text-transform`:** Chrome usa el texto transformado en el nombre accesible. En Focus Mode el grupo «Destino de la regla» se anuncia como `DESTINO DE LA REGLA` (heading y group); en Projects las tarjetas dicen `CONECTADO`, `PR ACTIVOS`, `ACTION REQUIRED`. Es un problema de presentación (cómo se anuncian palabras en mayúscula), no de contenido. Pendiente de decisión de diseño; no se cambió el estilo.
- **`user-email` truncado con elipsis** a 320-375 px: el correo queda cortado en la topbar. Está diseñado así (`text-overflow: ellipsis`); el correo completo no aparece en otro sitio de la topbar. Pendiente de decisión.
- **Breadcrumbs y «Ver todos»:** ver §5.

## 4. Pasos reproducibles

Entorno: Node 22 en `$HOME/.local/node22/bin` (`export PATH=$HOME/.local/node22/bin:$PATH`), pnpm 12, desde `app/`.

1. Pruebas nuevas y de regresión CSS:
   `pnpm exec vitest run src/ui/canAnimateCanvas.test.ts src/styles src/ui/accessibleNames.test.tsx src/ui/AppShell.test.tsx src/ui/navigationAccessibility.test.tsx` → 6 ficheros, 37 pruebas en verde (incluye las guardas de `.pr-ref` y `.action-required-list`).
2. Dev server del mock (ya estaba en `localhost:5173`, no se cerró):
   `cd app && VITE_DATA_SOURCE=mock VITE_AUTH_MODE=mock pnpm dev --port 5173 --strictPort`.
3. Dev server de configuración inválida (se cerró al terminar):
   `cd app && VITE_DATA_SOURCE=live VITE_CORE_API_URL=ftp://x pnpm dev --port 5174 --strictPort`.
4. Browser pane: `resize_window` 640×800 (zoom 200 %) o iframes same-origin de 640/375/320/1280 px; mediciones con `javascript_tool` (scrollWidth, rectángulos, `overflow:hidden`, tamaños < 40 px). Teclado: `computer` key Tab/Return. Al terminar: `resize_window` preset `desktop`.
5. Chrome headless con CDP (fuera del repo, en el scratchpad de la sesión):
   `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --remote-debugging-port=9333 --user-data-dir=<scratchpad>/chrome-profile about:blank`
   Scripts: `<scratchpad>/rm/reduced-motion-cdp.mjs` (barrido por página, con y sin reduce), `<scratchpad>/rm/inject-cdp.mjs` (selectores animados inyectados), `<scratchpad>/rm/ax-cdp.mjs` (árbol de accesibilidad; requiere `rag-console.mock-session` en localStorage, que el script fija).
   Ejecución: `node <scratchpad>/rm/<script>.mjs`. Resultados en `<scratchpad>/rm/*.json`.
6. Gates en `app/` (resultado real, último ciclo tras todos los cambios): `pnpm lint` exit 0; `pnpm exec tsc -b --noEmit` exit 0; `pnpm test --maxWorkers=4` exit 0, **92 ficheros y 934 pruebas en verde**; `pnpm build` exit 0; `pnpm format:check` exit 0.

## 5. No probado y pendiente de decisión

| Punto | Estado | Motivo |
|---|---|---|
| Lector de pantalla real (VoiceOver/NVDA): recorrido de Focus Mode, Projects y error de configuración | **No probado** | No hay lector disponible en el entorno de la sesión; el árbol de Chrome se verificó por CDP |
| Zoom real del navegador (Cmd/Ctrl +) y contraste de color | **No probado** | La herramienta no admite zoom de página; el contraste no se midió |
| Restauración de foco del aviso de identidad en navegador | **No probado en navegador** | Requiere disparar `notifyAuthError` sin tocar código; cubierto por jsdom (AppShell.test HU62) |
| Confirmar el borrado en navegador | **No probado en navegador** | Acción destructiva (aunque simulada); cubierto por HU56 en jsdom |
| Loaders animados en ejecución (canvas) | **No probado en ejecución** | El mock no muestra loaders durante la medición; cubierto por `canAnimateCanvas.test.ts` y por la comprobación CDP de los selectores CSS |
| **DECISION_REQUIRED (D-a):** objetivos táctiles de migas de pan (17 px de alto) y «Ver todos →» (18–36 px). Migas: 49×17, 95×17, 30×17 y 103×17 px; WCAG 2.2 2.5.8 pide 24 px y las migas son elementos independientes | **Pendiente, sin implementar** | El listado aprobado de la observación 1 son tres elementos (marca, saltar, pestañas). Subir las migas a 40 px cambia el layout de todas las páginas; requiere aprobación |
| **DECISION_REQUIRED (D-b):** mayúsculas por CSS que llegan al nombre accesible (§3) | **Pendiente** | Decisión de diseño sobre `text-transform` |
| **DECISION_REQUIRED (D-c):** `user-email` con elipsis a ≤ 375 px (§3) | **Pendiente** | Decisión de diseño |
| Fila «Historial de transiciones» (18 px, WI-042) | **Fuera de alcance** | Ya estaba anotada como fuera del listado aprobado |

Lo que no se toca en este corte, por el alcance: WI-CONSOLE-005 y WI-CONSOLE-006 siguen `W-PLANNED`; este informe no los cierra.

## 6. Ciclo 2 (2026-10-21): decisiones pendientes registradas

Modelo: implementer-high · configurado claude-haiku-5-5 · atendido unknown · esfuerzo high. Corrección del ciclo 2 tras `ux-reviewer` (CHANGES_REQUESTED). Las mediciones de desbordes del ciclo 2 están en `harness/reports/wi-console-047-implementation.md`, sección «Ciclo 2».

Los siguientes objetivos táctiles quedan **sin implementar** (DECISION_REQUIRED para el usuario). Subirlos a 40 px cambia el layout de todas las páginas y excede el listado aprobado de la observación 1:

| # | Elemento | Medida (ciclo 2, navegador) | Estado |
|---|---|---|---|
| DR-1 | Migas de pan (`Breadcrumbs`) en todas las páginas de detalle | 17 px de alto (Projects 49×17, Action Required 95×17, Runs 30×17, `checkout-service` 103×17) | DECISION_REQUIRED. Ya listado en §5 (D-a). WCAG 2.2 SC 2.5.8 pide 24 px; las migas son enlaces en línea |
| DR-2 | «Ver todos →» | 18 px de alto (ya listado en §5, D-a) | DECISION_REQUIRED |
| DR-3 | Botones «Ver inventario →» de la página Historial (3 ejemplares, 259 px de ancho) | **34 px de alto**. Hallazgo nuevo del `ux-reviewer` (no estaba en el informe del ciclo 1) | DECISION_REQUIRED. Son controles autónomos por debajo de 40 px |
| DR-4 | Fila «Historial de transiciones» del detalle de Run (`summary` del `details`) | 18 px de alto (ya listada en §5 como fuera de alcance) | DECISION_REQUIRED |

Lo declarado en §5 no cambia: lector de pantalla real, zoom del navegador real y contraste siguen sin probar.
