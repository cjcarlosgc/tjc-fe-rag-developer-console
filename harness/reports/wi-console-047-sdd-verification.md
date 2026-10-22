# WI-CONSOLE-047 — verificación SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Solo lectura del código; no se ejecutaron pruebas ni mediciones en navegador. Todas las rutas son relativas a `app/src/`. Lo marcado "por medir" es hipótesis que el implementer debe confirmar en el navegador antes de tocar el CSS.

## 1. Suficiencia SDD y decisionGate

- Suficiente. El alcance está aprobado (`harness/reports/wi-console-047-scope-approval.md`) y el WI declara `contractImpact: false` y `publishesContract: false`. Los criterios son verificables. Las specs aplicables son `design-system` (sección «Idioma y glosario de la interfaz», `--target-min` 40 px), `accessibility`, `demo-mode` y `errors-notifications`.
- `decisionGate`: no hay DEC con `Blocks` pendiente que alcance este WI. Las DEC con `Blocks` que encontré en `spec/contracts/system-contract.md` (líneas 221-245) son `Blocks: NONE`. `spec/constitution/planning-model.md` solo define los estados D-PROPOSED/D-PENDING. La búsqueda de D-PENDING/D-PROPOSED con `Blocks` en `spec/` no encontró ninguna que toque UI, glosario, demo o configuración. Valor propuesto: `decisionGate: []`.
- Matiz: el glosario no incluye «Functional Knowledge», «Overview», «Integrations», «Integration branch», «Trace», «Historial» ni «Modo experimental». Elegir su escritura es traducción de UI dentro del alcance aprobado («se buscan más casos con criterio»), no una DEC nueva. Se recomienda anotar la tabla de decisiones de texto en el informe de implementación.
- Matiz (observación 5, ver §5): si el implementer considera que la pantalla de error de configuración exige una primitive nueva, queda `DECISION_REQUIRED` y esa parte se aparca.

## 2. Observaciones 1-6

### Obs. 1 — Objetivos táctiles < 40 px

`--target-min: 40px` ya existe (`styles/base.css:57`).

| Elemento | Código | Causa probable | Criterio |
|---|---|---|---|
| Enlace de marca | `ui/AppShell.tsx:44-49` (`Link.brand`); CSS `styles/base.css:102-112` (`display:flex`, sin `min-height`); `.brand-mark` 32×32 en `base.css:113-123` | La altura la fija el icono de 32 px | `getBoundingClientRect()` del `a.brand` ≥ 40 alto y ≥ 40 ancho. Basta `min-height: var(--target-min)` en `.brand`; el icono no cambia |
| «Saltar al contenido» | `ui/AppShell.tsx:33-40`; CSS `styles/base.css:447-462` (padding `--space-2`/`--space-4`, sin `min-height`) | Mide 37 px por padding + línea | Medir con `:focus` (es `top:-64px` fuera de foco): alto ≥ 40. Añadir `min-height: var(--target-min)` con `display:inline-flex; align-items:center` |
| Pestañas de proyecto | `ui/ProjectTabs.tsx:39-50` (`nav.project-tabs > a`); CSS `styles/action-required.css:108-131` (`padding: 10px 14px`, `font 13px mono`, `border-bottom: 2px`) | 39 px por padding + línea + borde | Cada `a` ≥ 40 alto (ancho ya > 40). `min-height: var(--target-min)` con `inline-flex; align-items:center`. Ojo: el borde inferior activo cuenta dentro de `min-height` solo con `box-sizing: border-box`; verificar |
| Fila «Historial de transiciones» (18 px, obs. 1 del cierre WI-042) | No está en el alcance aprobado de la obs. 1 (solo marca, saltar y pestañas) | — | Declarar fuera de alcance o preguntarlo; no ampliar sin aprobación. Está en `control-plane/AnalysisRunDetailPage.tsx` (por localizar) |

- Pruebas jsdom no miden layout: son las de existencia de rol/nombre (`ui/AppShell.test.tsx`, `ui/ProjectTabs.test.tsx`, `ui/navigationAccessibility.test.tsx`). La medición va con evidencia de navegador a 1280 y 375 px, antes y después.
- Una prueba barata que sí cabe en jsdom: leer los CSS con `readFileSync` y comprobar que `.brand`, `.skip-link` y `.project-tabs a` declaran `min-height: var(--target-min)`. Es una guarda de regresión débil; declararla como tal.

### Obs. 2 — Focus Mode a 375 px (scrollWidth 413)

- Código: `action-required/FocusModePage.tsx:173-282` (`.panel.focus-mode-card`), con `.content` de `width: min(1320px, calc(100% - 40px))` (`styles/base.css:163`). A 375 px el contenido útil es 335 px, y `scrollWidth 413` indica un hijo de ≈ 78 px de exceso.
- Candidatos (por medir; hallarlos con `[...document.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth)`):
  1. `.pr-ref` (`FocusModePage.tsx:176-178`, `styles/action-required.css:264-268`): texto `PR #N · qualifiedName` sin `overflow-wrap`; el padre `.run-heading-meta` (`action-required.css:296-301`) es flex sin `flex-wrap` ni `min-width:0`. Es el sospechoso principal por el `qualifiedName` largo.
  2. `.metadata` del conflicto (`FocusModePage.tsx:230-238`): `grid-template-columns: repeat(3, 1fr)` (`styles/components.css:153-157`). Colapsa a 1 columna solo en `@media (max-width: 680px)` (`components.css:964`), así que a 375 px sí colapsa; las reglas largas en `dd` pueden desbordar si faltan `overflow-wrap`/`min-width:0`.
  3. `.visual-aid-content` (`action-required.css:360-368`) ya tiene `pre-wrap` y `break-word`; descartable.
  4. `.rule-target dd` (`action-required.css:~405`) ya usa `overflow-wrap:anywhere`; descartable.
- Criterio medible: `document.documentElement.scrollWidth <= 375` (equivale a `clientWidth`) a 375 px en `/action-required/.../focus` (ruta del Focus Mode) con la pregunta demo de nombre más largo, y también con `conflict`. Sin regresión a 1280 px: comparar capturas antes y después.
- Corrección probable acotada: `flex-wrap: wrap` y `min-width:0` en `.run-heading-meta`; `overflow-wrap: anywhere` en `.pr-ref`. Lo decide la medición.

### Obs. 3 — Glosario es/en
Ver §3.

### Obs. 4 — Conteos 6/4/3
Ver §4.

### Obs. 5 — `VITE_CORE_API_URL` inválida
Ver §5.

### Obs. 6 — Verificación pendiente
Ver §6.

## 3. Obs. 3 — textos visibles en inglés fuera del glosario

Método: grep por texto JSX y atributos (`label=`, `aria-label=`, `title=`, `label:`) en `app/src` sin pruebas ni `speculative/`. El grep multilínea no es exhaustivo (texto JSX partido en varias líneas, constantes en `.ts` de mensajes de error, `failureMessages.ts`, `errors.ts`, `mockBackend.ts` con ~5000 líneas de datos). El implementer debe repetir con `rg -n "[A-Z][a-z]+ [a-z]+" ` sobre `*.tsx` y `*Messages.ts` antes de cerrar, y revisar los datos del mock que se muestran como texto.

### Traducir (UI, fuera de glosario)

| Texto | Ubicación | Propuesta |
|---|---|---|
| `NOT CONNECTED` | `projects/ProjectsPage.tsx:141` | «SIN CONECTAR» (o «Sin conectar») |
| `CONNECTED` | `projects/ProjectsPage.tsx:190` | «CONECTADO» |
| `Integration branch` | `projects/ProjectsPage.tsx:200`, `projects/ProjectDetailPage.tsx:165`, `control-plane/IntegrationsPage.tsx:247` y `:489` (`<label htmlFor="integration-branch">`) | «Rama de integración». El `id` `integration-branch` no cambia; sí cambia el nombre accesible (afecta consultas por label) |
| `Active PRs` (`ACTIVE PRS` sale de `text-transform: uppercase`, `styles/components.css:55-58`) | `projects/ProjectsPage.tsx:204` | «PR activos» (el KPI ya dice «PR activos», `ProjectsPage.tsx:~400`) |
| `Latest: PR #…` | `projects/ProjectsPage.tsx:216` | «Último: PR #…» |
| `Projects conectados` | `projects/ProjectsPage.tsx:441` | Mezcla según glosario: «Projects» se mantiene; el adjetivo va en español, así que «Projects conectados» es válido. La obs. del cierre lo marcó por inconsistencia con otras etiquetas; resolver con una sola escritura («Projects con repositorio vinculado» o dejarlo) |
| `Overview` | `ui/ProjectTabs.tsx:11` | «Resumen» |
| `Integrations` | `ui/ProjectTabs.tsx:28` | «Integraciones» |
| `Workspace / Overview` | `projects/ProjectsPage.tsx:323` | «Workspace / Resumen» |
| `Trace operativo` | `control-plane/OperationalTraceSection.tsx:353` | Mezcla: `Trace` no está en el glosario; «Traza operativa». Verificar `trace.css` y pruebas |
| `RAG Test Studio` / `LIVE · CORE API` | `ui/AppShell.tsx:44-49`, `:~62` | `RAG Test Studio` es nombre de producto, no traducir. `LIVE · CORE API` es un rótulo de entorno análogo a `DEMO · DATOS SIMULADOS`; propuesta «EN VIVO · CORE API». Decisión menor del implementer, documentarla |
| `Repository binding` como título (`control-plane/IntegrationsPage.tsx:225`, `projects/ProjectDetailPage.tsx:151`) | — | Es término de glosario (`Repository binding`): se queda |

### Mantener (dominio o contrato; NO traducir)

- Glosario: `Project(s)`, `Workspace`, `Run(s)`, `AnalysisRun`/`Analysis Runs`, `Action Required`, `Focus Mode`, `PR`/`Pull Request`, `HEAD`, `RAG`, `Sandbox`, `Check`, `companion PR`, `Baseline`, `Repository binding`.
- Literales de contrato con Core que deben quedar tal cual cuando se muestran como valor: `project.role` (`READER`/`WRITER`/`MAINTAINER`/`ADMIN`; `ProjectsPage.tsx:~144` renderiza `{project.role}`), `target.kind` (`METHOD`, `CLASS`, `FUNCTION`…; `action-required/RuleTargetSummary.tsx:33`), `scenarioKind`/`scenarioKey` (`LEGACY` y similares), enums de estado de `AnalysisRun` (ya rotulados con `ANALYSIS_RUN_STATUS_LABELS`), `visualAid.kind` (`FocusModePage.tsx:39`, solo se sustituyen `_` por espacio), `code`/`correlationId` de errores, nombres de rama y repositorio (`binding.integrationBranch`, `repositoryName`), `qualifiedName`.
- Rótulos de entorno DEMO (`DEMO · DATOS SIMULADOS`, `DEMO · IDENTIDAD SIMULADA`, `demoExperimentOptions.ts:3`): no se tocan (explícito en el alcance).
- Término de producto «Functional Knowledge» (pestaña `ProjectTabs.tsx:23`, título `FunctionalKnowledgePage.tsx:49`, texto `FunctionalKnowledgeDetailPage.tsx:41`): no está en el glosario pero es nombre de entidad/ruta con Core (`/functional-knowledge`). Recomendación: mantener y, si el Human Reviewer lo quiere, ampliar el glosario en `design-system/spec.md` (cambio de spec, no de código).
- Texto con mezcla ya aceptable bajo el glosario: «Comprobando tu rol en el Project…», «Nombre del Project», «Runs esperando una respuesta funcional…», «Sin Runs», «Modo experimental».

### Pruebas que dependen de esos textos (a actualizar en el mismo corte)

Archivos de prueba que contienen alguno de `Overview`, `'Runs'`, `Integrations`, `CONNECTED`, `Integration branch`, `Latest:`, `Active PRs` (grep sobre `*.test.*`):
`ui/sharedComponents.test.tsx`, `ui/AppShell.test.tsx`, `ui/ProjectTabs.test.tsx`, `ui/navigationAccessibility.test.tsx`, `projects/workspaceOverview.test.ts`, `projects/ProjectsPage.test.tsx`, `projects/ProjectDetailPage.test.tsx`, `control-plane/bindingLifecycle.live.test.tsx`, `control-plane/IntegrationsRoles.test.tsx`, `control-plane/IntegrationsPage.test.tsx`.
Notas: `'Runs'` y `Action Required` se mantienen (glosario), así que `AppShell.test.tsx` probablemente solo cambia si usa `Overview`/`Integrations`. `workspaceOverview.test.ts` puede ser falso positivo (nombres de funciones). Cualquier `getByLabelText('Integration branch')` cambia de nombre accesible.

## 4. Obs. 4 — conteos 6 / 4 / 3

Origen: tres cálculos distintos con dos colecciones de seeds independientes en `api/mockBackend.ts`.

| Valor | Dónde se calcula | Alcance |
|---|---|---|
| Badge `6` (nav) | `ui/AppShell.tsx:28-29` → `useActionRequiredList()` sin `projectId` → `mockListActionRequired` (`api/mockBackend.ts:4125-4136`): una entrada por Run de `actionRequiredRuns` (`seedActionRequired`, `mockBackend.ts:962+`, 6 Runs: checkout_pr42, billing_pr17, billing_pr24, checkout_pr52, org_writer_pr21, org_metrics_pr15) con pregunta `PENDING` | **Global**: todos los proyectos visibles de todos los workspaces |
| KPI `4` y tarjetas | `projects/ProjectsPage.tsx:239-296`: `useAllActionRequiredList` filtrado por `projectIds` del workspace seleccionado (`:270-272`); por proyecto, `actionRequiredByProject` (`:292-296`) | **Un workspace** (los demás proyectos org_* viven en otro workspace) |
| `3 Runs` | Seeds de Runs con `status: 'ACTION_REQUIRED'` en `mockBackend.ts:1306, 2118, 2192, 2229` (la lista de Runs / «Latest»). Además cada seed lleva su propio `actionRequiredCount` (p. ej. `:1308` = 2), no derivado de `actionRequiredRuns` | Colección de Runs |
| Vista previa de 3 | `ProjectsPage.tsx:22` (`ACTION_REQUIRED_PREVIEW_LIMIT = 3`, `:72`), solo un límite visual, pero puede leerse como "3 pendientes" | Presentación |

Causa: el demo mantiene a mano la lista de Runs y la de preguntas pendientes, y la UI mezcla ámbito global (badge) con ámbito de workspace (KPI) sin rotularlo.

Fuente única propuesta, sin cambiar contratos ni DTO:
1. La verdad es `actionRequiredRuns` (las preguntas `PENDING`). En el mock, derivar `status` y `actionRequiredCount` de los seeds de Run (`:1296+`, `:2118`, `:2192`, `:2229`) desde `actionRequiredRuns` (por `analysisRunId`), o al revés, en una única función de seed. Resultado: el Run es `ACTION_REQUIRED` si y solo si aparece en `mockListActionRequired`.
2. Rotular el ámbito en la UI en vez de ocultar la diferencia: el badge del nav es global («en todos tus Workspaces») y el KPI es del workspace. Es honesto con el modelo real de Core (`GET /action-required` es cross-project, `action-required/api.ts:16`). Opción alternativa: acotar el badge al workspace activo, pero eso cambia comportamiento real, no solo demo; no recomendada.
3. Prueba de coherencia en `api/mockBackend.test.ts`: `mockListActionRequired().items.length` igual al número de Runs `ACTION_REQUIRED` vigentes visibles, y para el workspace por defecto, igual al KPI de `ProjectsPage`.

Sin cambios en `workspaceOverview.ts` (solo cuenta PR activos y no interviene en Action Required).

## 5. Obs. 5 — `VITE_CORE_API_URL` inválida

- Fallo: `api/baseUrl.ts:6-20` lanza `Error` ante URL no parseable o protocolo distinto de http/https. `api/client.ts:19` ejecuta `resolveBaseUrl(...)` en el nivel de módulo (`export const baseUrl`). `main.tsx:4-5` importa `AuthProvider` y `router`, que arrastran `client.ts` por imports estáticos; el error se lanza al evaluar módulos, antes de `createRoot(...).render(...)` (`main.tsx:11`). No existe error boundary que lo capture, de modo que queda `#root` vacío y solo la consola muestra el error. `RouteError` no ayuda: solo vive dentro del router.
- Hecho relevante: `baseUrl` se evalúa también en modo mock, así que hoy una URL inválida rompe el demo. El alcance pide no romper mock/demo.
- Encaje con primitives existentes: sí cabe sin primitive nueva. El markup de error ya existe como clases (`feedback error-state` con `<strong>` y `<p>`, `RouteError.tsx:25-34`; `.content`; `.eyebrow`/`.page-heading` de `PageHeader`; `.button.primary`). Una pantalla de configuración puede componerse con esas clases, sin enlace al router, porque no hay router montado. No se recomienda reutilizar `RouteError` tal cual (depende de `useRouteError` y `Link`).
- Diseño mínimo viable:
  1. `main.tsx` valida la variable antes de cargar el resto, con `try { resolveBaseUrl(...) } catch`, y renderiza la pantalla de error de configuración; en el caso válido usa `import('./router')` y `import('./auth/AuthProvider')` dinámicos (los imports estáticos se evalúan primero, así que un `try` posterior no basta).
  2. Texto en español, accionable y sin secretos: nombre de la variable (`VITE_CORE_API_URL`), la regla («debe ser http(s)://host[:puerto]») y el paso a seguir («corrige `.env` y reinicia el servidor de desarrollo o reconstruye»). No mostrar el valor completo (puede traer credenciales en la URL); como mucho mostrar el esquema o un fragmento saneado.
  3. Con la fuente `mock` activa, no lanzar: decidir si la validación solo aplica en modo `live`. Es una decisión de comportamiento menor; si se toma, documentarla (el modo `mock` ignora la URL). Debe poder demostrarse: con `mock` y URL inválida la app arranca.
  4. `role="alert"`, `document.title` en español y foco en el contenedor, igual que `RouteError`.
- Clasificación: no requiere primitive nueva si el componente es una composición local (`ConfigurationErrorScreen` junto a `main.tsx`) con clases existentes. Si el reviewer la considerase primitive (nuevo archivo en `ui/` con API reutilizable), se registra `DECISION_REQUIRED` y esa parte se aparca. Recomendación: ubicarla fuera de `ui/` y sin props genéricas.
- Pruebas: `main.tsx` no es testeable tal cual; extraer una función `resolveConfigError()` o el componente a un módulo con prueba `render` (jsdom) que comprueba `role="alert"`, texto en español, ausencia del valor crudo, y que con URL válida o vacía no hay pantalla de error. `api/baseUrl.test.ts` ya cubre el lanzamiento. Prueba manual: `VITE_CORE_API_URL=ftp://x` y `=no-es-url` en build/dev.

## 6. Obs. 6 — verificación de lo no probado

Ya cubierto (hallado en el código):
- Restauración de foco: `projects/ProjectDetailPage.test.tsx:130-134` (confirmación en línea de borrado de proyecto: foco inicial en «Cancelar», retorno a «Eliminar proyecto»); `ui/AppShell.test.tsx:90,101` (foco a `main` al cerrar el aviso de identidad, `ui/AppShell.tsx:16-21`).
- No existe ningún diálogo modal real (`role="dialog"`, `<dialog>`, `aria-modal` no aparecen fuera de pruebas). Por tanto el «foco atrapado» no aplica a modales; la confirmación de borrado es en línea. Declararlo así en la evidencia, en lugar de forzar un focus trap inexistente. Si se quiere probar `Tab` cíclico, solo sería para la confirmación en línea, que no atrapa foco por diseño (verificar que no lo pretende).
- Reduced motion: CSS en `styles/motion.css:154-165` (anima a `animation: none`), `styles/components.css:1045-1052` (global: `animation-duration`/`transition-duration: 0.01ms`) y `styles/trace.css:176`; en JS `ui/canAnimateCanvas.ts` (false en `MODE === 'test'` y con `prefers-reduced-motion: reduce`), usado en `ui/Loaders.tsx` y `ui/ConstellationIcon.tsx`.
- Roles/nombres: `ui/navigationAccessibility.test.tsx`, `ui/AppShell.test.tsx`, `ui/Breadcrumbs.test.tsx`, `ui/ProjectTabs.test.tsx`; lint `jsx-a11y` activo (`eslint.config.js`). No hay `axe`/`jest-axe` en el código ni en `package.json` (grep sin coincidencias).

A añadir:
- `canAnimateCanvas`: prueba con `window.matchMedia` simulado a `reduce`, y con modo no test (`vi.stubEnv('MODE', 'development')`): false con reduce, true sin reduce, true sin `matchMedia`.
- Reduced motion ≤ 120 ms (WI-CONSOLE-006): la regla global usa `0.01ms`, lo cual cumple el tope; añadir una prueba que lea el CSS y verifique que el bloque `prefers-reduced-motion` define `animation-duration`/`transition-duration` ≤ 120 ms. Es verificación estática, no ejecución real. Para el criterio "en ejecución", usar el navegador con `Emulation.setEmulatedMedia(prefers-reduced-motion: reduce)` y `getComputedStyle(...).animationDuration/transitionDuration`, con evidencia en `harness/reports/`.
- Árbol de accesibilidad: pruebas por rol/nombre en las pantallas sin cobertura (Focus Mode, Projects tras la traducción, pantalla de error de configuración). Evaluar añadir `axe-core` solo con aprobación (dependencia nueva fuera del alcance listado; si no, usar la instantánea del árbol de accesibilidad del navegador y documentarla).
- Fakes: pruebas con fake timers o reloj inyectado (regla del WI).

No viable en jsdom (declarar explícitamente en la evidencia manual como "no probado automáticamente"):
- Zoom 200 %: jsdom no calcula layout ni reflow. Hacerlo manualmente a 1280×800 con zoom 200 % (equivalente a 640 px CSS) y a 375 px: sin scroll horizontal (`scrollWidth <= clientWidth`), sin contenido recortado ni solapado, controles operables. Registrar capturas y tabla página × resultado.
- Lector de pantalla real (VoiceOver/NVDA): no automatizable. Declarar como no probado, o ejecutar un recorrido manual breve con VoiceOver y anotar versión y resultado.
- Tamaños reales de objetivos táctiles y contraste (jsdom devuelve 0): medición en navegador.
- Usar la fórmula: «lo no probado se declara» con tabla `criterio | método | resultado | motivo si no probado`, y confirmar que WI-CONSOLE-005 y 006 siguen `W-PLANNED`.

## 7. Riesgos y orden de cortes

Riesgos:
1. Traducir etiquetas cambia nombres accesibles y rompe pruebas por `getByText/getByLabelText`; actualizar pruebas en el mismo corte.
2. `main.tsx` con `import()` dinámico cambia el orden de carga (posible parpadeo, otro chunk); medir tamaño de bundle (WI-042 dejó índice 986.89 kB) y no romper la carga diferida del mock.
3. Desbordamiento de Focus Mode: causa por medir; no asumir.
4. Coherencia del demo: tocar seeds puede alterar otras pruebas que cuentan Runs o pendientes (`api/mockBackend.test.ts`, `ProjectsPage.test.tsx`, `ActionRequiredPage.test.tsx`).
5. `min-height` en pestañas puede mover el layout (alinear con `.topbar-nav a` y `.button`).
6. Primitives: no crear primitive nueva; `ConfigurationErrorScreen` queda como composición local.
7. WI-005/006 deben seguir `W-PLANNED`; la evidencia de a11y no los cierra.

Orden recomendado:
- A (obs. 1 y 2): táctiles + Focus Mode. Solo CSS (`styles/base.css`, `styles/action-required.css`), posible ajuste menor de `FocusModePage.tsx`.
- B (obs. 3 y 4): glosario + conteos demo. Toca `projects/*`, `ui/ProjectTabs.tsx`, `control-plane/*`, `api/mockBackend.ts` y sus pruebas.
- C (obs. 5): error de configuración. `main.tsx`, un componente local, `api/baseUrl.ts` (si se separa la validación) y pruebas.
- D (obs. 6): verificación a11y y reduced motion; pruebas nuevas y evidencia manual en `harness/reports/`. Va al final porque verifica el resultado de A-C (traducciones, tamaños, pantalla de error).

Fusión de cortes: no fusionar A con B. Conflictos de archivos: `styles/components.css` solo lo tocaría A si hay que ajustar `.project-stats`/`.metadata`; `styles/action-required.css` lo tocan A (pestañas, `.run-heading-meta`) y, en B, nada. `ProjectsPage.tsx` y `ProjectTabs.tsx` los toca B y A (si se cambia la altura de pestañas solo por CSS, A no los edita). C es independiente. Si A necesita editar `ProjectTabs.tsx`, aplicar B (rótulos) en la misma sesión para evitar conflicto; si no, el orden A→B→C→D no genera conflictos. No hay necesidad de fusionar C con otros.

## Handoff

| Campo | Valor |
|---|---|
| status | SUFFICIENT_WITH_NOTES (no DECISION_REQUIRED abierto) |
| findings | 1) Suficiencia SDD y `decisionGate: []`. 2) Conteos 6/4/3: dos colecciones de seeds y ámbitos distintos (global vs workspace). 3) `VITE_CORE_API_URL` falla al evaluar `client.ts:19` antes del render y también rompe el modo mock. 4) Sin diálogos modales reales: foco atrapado no aplica. 5) Traducciones necesarias: `CONNECTED`, `NOT CONNECTED`, `Integration branch`, `Active PRs`, `Latest:`, `Overview`, `Integrations`, `Workspace / Overview`, `Trace operativo`, `LIVE · CORE API` (decisión menor). 6) Fila «Historial de transiciones» (18 px) queda fuera del alcance aprobado salvo que el usuario la incluya. |
| blockers | Ninguno. Condicional: si la pantalla de error de configuración se considera primitive nueva, `DECISION_REQUIRED` y esa parte se aparca |
| filesAffected | A: `app/src/styles/base.css`, `app/src/styles/action-required.css`, posible `app/src/action-required/FocusModePage.tsx`. B: `app/src/projects/ProjectsPage.tsx`, `ProjectDetailPage.tsx`, `app/src/ui/ProjectTabs.tsx`, `app/src/control-plane/IntegrationsPage.tsx`, `OperationalTraceSection.tsx`, `app/src/ui/AppShell.tsx`, `app/src/api/mockBackend.ts`, y las pruebas listadas en §3. C: `app/src/main.tsx`, `app/src/api/client.ts`/`baseUrl.ts`, componente local nuevo y su prueba. D: pruebas nuevas, `harness/reports/` (evidencia manual) |
| evidence | Lecturas con rutas y líneas en este informe; no se ejecutaron pruebas ni mediciones de navegador (pendiente de implementer/ux-reviewer) |
| recommendedNextStep | Implementer en cortes A → B → C → D; medir en navegador antes y después (1280, 375 y zoom 200 %); registrar la tabla de decisiones de texto y la declaración de lo no probado; reviewer y ux-reviewer independientes (máx. 2 ciclos) |
