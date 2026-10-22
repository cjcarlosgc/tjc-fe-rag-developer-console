# WI-CONSOLE-047 — implementación

Modelo: implementer-high · configurado claude-haiku-5-5 · atendido unknown · esfuerzo high

**Motivo de escalada:** el leader escala el corte C de `implementer` a `implementer-high` porque toca el arranque de la aplicación (`app/src/main.tsx`) y el orden de carga de módulos (imports estáticos a `import()` dinámico).

**Fecha:** 2026-10-21. Rama `feature/jean`. Sin commit, sin push, sin PR.

---

## Corte C — `VITE_CORE_API_URL` inválida (observación 5)

### Problema reproducido por lectura de código

`api/client.ts` ejecutaba `resolveBaseUrl(...)` al nivel de módulo. `main.tsx` importaba estáticamente `AuthProvider` y `router`, que arrastran `client.ts`. Con una URL inválida el error se lanzaba al evaluar módulos, antes de `createRoot(...).render(...)`, así que `#root` quedaba vacío. Además la validación también se ejecutaba con `VITE_DATA_SOURCE=mock`, de modo que una URL inválida rompía el demo.

### Diseño implementado

1. `app/src/api/baseUrl.ts`: se añade `parseBaseUrl(raw)`, que valida sin lanzar y devuelve `{ ok, value }` o `{ ok: false, issue }` con `issue` = `invalid-url` | `unsupported-protocol`. `resolveBaseUrl` se mantiene con los mismos mensajes y lanza igual que antes (los tests existentes no cambian).
2. `app/src/config/configurationError.ts` (nuevo, función pura): `resolveConfigurationError({ dataSource, coreApiUrl })`. Devuelve `null` en mock; en live devuelve `{ variable: 'VITE_CORE_API_URL', reason }` si la URL no es válida y `null` si está vacía, ausente o es válida. No incluye el valor.
3. `app/src/config/ConfigurationErrorScreen.tsx` (nuevo, componente local, fuera de `ui/`, sin props genéricas): recibe solo el `issue`. Compuesto con clases existentes (`main.content`, `page-heading`, `eyebrow`, `feedback error-state` con `role="alert"`). Sin enlaces al router. Título de documento «Configuración no válida · RAG Test Studio». Foco en el `main` al montar.
4. `app/src/main.tsx`: valida antes de cargar el resto. Si hay error renderiza `ConfigurationErrorScreen`. Si no, carga `./router` y `./auth/AuthProvider` con `import()` dinámico y renderiza la app como antes. `RouterProvider` sigue importándose estáticamente desde `react-router-dom`, que no lee la configuración.
5. `app/src/api/client.ts`: `baseUrl` se calcula con `coreApiBaseUrl()`. En live sigue usando `resolveBaseUrl` y lanza igual. En mock usa `parseBaseUrl` y, si la URL no es válida, cae a mismo origen (`''`). Un valor válido en mock se conserva igual.

### Decisión: comportamiento en modo mock

- Con `VITE_DATA_SOURCE=mock`, una `VITE_CORE_API_URL` inválida no bloquea nada: `main.tsx` no muestra la pantalla y `client.ts` no lanza. Cubierto por `main.test.tsx` y `api/clientBaseUrl.test.ts`.
- Con `VITE_DATA_SOURCE` ausente, `vite dev` resuelve a mock (como hasta ahora) y no bloquea; un build de producción resuelve a live y sí bloquea, igual que la lógica de `dataSource.ts`.
- En live no cambia ningún contrato, DTO, ruta ni comportamiento realtime. Solo cambia que la URL inválida se muestra en pantalla en lugar de dejar la página en blanco.

### Pantalla de error: texto y seguridad

- Nombra la variable `VITE_CORE_API_URL` y el motivo genérico: «no es una URL válida» o «usa un protocolo no permitido».
- Regla: «La Console necesita una URL con el formato http(s)://host[:puerto] para conectarse a RAG Core».
- Paso a seguir: corregir el valor en `.env` o en la variable de entorno del despliegue y reiniciar `pnpm dev` o volver a construir. Sugiere `VITE_DATA_SOURCE=mock` para explorar el demo sin Core.
- No muestra el valor crudo. Prueba con `ftp://user:secret@host`: el texto renderizado no contiene `secret`, `ftp://` ni `user:`.

### Primitives y CSS

- No se creó ninguna primitive en `ui/` ni se pidió `DECISION_REQUIRED`: la pantalla es una composición local con clases existentes.
- No se añadió CSS nuevo en este corte. No se tocaron `styles/base.css` ni `styles/action-required.css`, que pertenecen al otro corte en paralelo.

### Archivos

Modificados:
- `app/src/main.tsx`
- `app/src/api/client.ts`
- `app/src/api/baseUrl.ts`
- `app/src/api/baseUrl.test.ts` (prueba de `parseBaseUrl` añadida)

Nuevos:
- `app/src/config/configurationError.ts`
- `app/src/config/configurationError.test.ts`
- `app/src/config/ConfigurationErrorScreen.tsx`
- `app/src/config/ConfigurationErrorScreen.test.tsx`
- `app/src/api/clientBaseUrl.test.ts`
- `app/src/main.test.tsx`

### Pruebas añadidas

- `configurationError.test.ts`: live + URL inválida (`core.example.test`) → `invalid-url`; live + `ftp://` y `javascript:` → `unsupported-protocol`; el issue serializado no contiene credenciales; vacía, ausente o válida → sin error; mock → nunca error.
- `ConfigurationErrorScreen.test.tsx`: `role="alert"`, texto en español, paso a seguir, título de documento, foco en `main`, no muestra el valor crudo con credenciales.
- `clientBaseUrl.test.ts`: en mock con URL inválida `baseUrl === ''` sin lanzar; en mock con URL válida conserva el valor sin barra final; en live sigue lanzando al evaluar (la guarda está en `main.tsx`).
- `main.test.tsx`: en live con URL inválida aparece la pantalla de configuración en lugar de `#root` vacío; en mock con URL inválida la app arranca sin esa pantalla.
- Sin reloj real: no hay temporizadores.

### Tamaño del bundle (`pnpm build`)

| Chunk | Antes (línea base, antes de editar) | Después |
|---|---|---|
| Entrada principal (`index-*.js`) | 989.70 kB (989 695 bytes) | 343.20 kB (gzip 108.22 kB) |
| Router (`router-*.js`) | incluido en la entrada | 384.04 kB (gzip 111.11 kB) |
| AuthProvider (`AuthProvider-*.js`) | incluido en la entrada | 218.63 kB (gzip 56.68 kB) |
| `returnTo-*.js` | incluido en la entrada | 46.09 kB (gzip 15.02 kB) |
| Mock (`mockBackend-*.js`) | 107.95 kB (separado) | 107.97 kB (sigue separado) |

- Total JS: 1097.65 kB antes y 1100.03 kB después (+2.39 kB, +0.2 %, por el coste de los chunks diferidos).
- La entrada principal baja de 989.70 kB a 343.20 kB; el resto se carga con `import()` después de validar la configuración.
- CSS: el total pasa de 67.58 kB (línea base) a 52.42 kB en `index-*.css` más 15.41 kB en `router-*.css`. Esta comparación no aísla mi corte porque el otro corte edita CSS en paralelo.
- `pnpm build` no emitió advertencias de chunks grandes.

### Gates (en `app/`, resultado real)

| Gate | Comando | Resultado |
|---|---|---|
| Lint | `pnpm lint` | exit 0 |
| Tipos | `pnpm exec tsc -b --noEmit` | exit 0 |
| Pruebas | `pnpm test --maxWorkers=4` | exit 0: 87 ficheros, 903 pruebas en verde |
| Build | `pnpm build` | exit 0 |
| Formato | `pnpm format:check` | exit 0 |

Las pruebas incluyen el trabajo del otro corte CSS tal como estaba en el momento de ejecutarlas. No se detectó ningún fallo ajeno.

### No verificado

- No se usó el navegador ni el preview (lo ocupa el otro corte). La pantalla de error no se ha visto en un navegador real: la verificación es por jsdom (`main.test.tsx`, `ConfigurationErrorScreen.test.tsx`) y por build.
- No se ha medido el aspecto visual de la pantalla de error a 375 px ni con zoom: queda para la verificación de navegador del corte de UX.
- Riesgo residual, fuera de alcance: si falla la carga diferida del router o de AuthProvider (chunk no descargable), `main.tsx` no tiene `catch`. La página quedaría en blanco con el error en consola. Antes de este corte, el fallo era el mismo tipo (página vacía). Se deja anotado para una decisión posterior.

### Notas para revisión

- El cambio en `client.ts` mantiene la semántica live. El cambio en mock es intencional y está acotado a `baseUrl`.
- No se ha hecho commit. Los archivos pertenecientes al otro corte (`styles/base.css`, `styles/action-required.css`, `styles/cssRegressionGuards.test.ts`) no se han tocado en este corte.

## Corte A — objetivos táctiles y Focus Mode a 375 px (observaciones 1 y 2)

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

### Mediciones en navegador (demo mock, puerto 5173)

Método: `preview_start` no pudo arrancar `console-mock` (el `launch.json` invoca `pnpm` sin el PATH de Node 22), así que el servidor se levantó a mano con `VITE_DATA_SOURCE=mock VITE_AUTH_MODE=mock pnpm dev --port 5173`. El panel del navegador mide 413 px, por lo que `resize_window` no fija 375 px reales: las medidas a 375 px se hicieron en un iframe de 375 px del mismo origen, y las de 1280 px en un iframe de 1280 px. Son instrumentos de medición, no cambios de UI. El skip link se enfocó con Tab real (`computer key Tab`).

| Medición | Antes | Después |
|---|---|---|
| Focus Mode `/action-required/arun_billing_pr17` · `scrollWidth` a 375 px | **413** | **375** |
| Focus Mode · `scrollWidth` a 1280 px | 1280 | 1280 |
| Focus Mode · `h2` de la pregunta a 375 px (ancho × alto) | 277 × — (desbordaba: `scrollWidth` del h2 364) | 277 × 148,4 (texto partido en líneas) |
| Marca `a.brand` (ancho × alto) a 375 y 1280 px | 161,4 × 32 | 161,4 × 40 |
| Icono `.brand-mark` | 32 × 32 | 32 × 32 (sin cambio) |
| Skip link enfocado (ancho × alto) a 375 px | 184 × 37 | 184 × 40 |
| Pestañas `.project-tabs a` (alto) a 375 y 1280 px | 39 | 40 (ancho sin cambio, 60–192 px) |
| Barra superior `.topbar` alto a 1280 px | 73 | 73 |
| Barra superior `.topbar` alto a 375 px | 237 | 245 (+8 px: la marca de 40 px en modo apilado) |
| `scrollWidth` a 375 px en Projects, Action Required, Runs, detalle de Run, Functional Knowledge y foco de `arun_checkout_pr42` | 375 en todas | 375 en todas (sin regresión) |
| `scrollWidth` a 1280 px en esas mismas pantallas | 1280 en todas | 1280 en todas |

Lectura del +8 px: la marca ya no mide 32 px sino 40 px en el topbar apilado. La marca sigue alineada a la izquierda (`left` 20 px) y su borde superior no se mueve (12 px a 375 px). Se acepta como coste del objetivo de 40 px; si el reviewer lo considera desalineación, la alternativa es un `padding` negativo o un ajuste de la barra, que sería un cambio de layout distinto.

### Causa raíz del desbordamiento (Obs. 2)

No es `.pr-ref` ni `.run-heading-meta`: ambos caben a 375 px. El desbordamiento viene del `<h2>` de la pregunta (`FocusModePage.tsx`, el `h2` dentro de `.panel.focus-mode-card`). La pregunta contiene un identificador sin espacios (`"DiscountEngine.applyDiscount"`) que no tiene punto de corte, y `h2` no tenía `overflow-wrap`, así que el texto se salía de la caja (364 px de contenido en 277 px de caja) y arrastraba el `scrollWidth` del documento a 413 px. La regla `overflow-wrap: anywhere` ya es el patrón usado en el resto del CSS del proyecto. Se confirmó en el navegador inyectando la regla en el iframe antes de editar el archivo (413 → 375). Los candidatos `.pr-ref`, `.run-heading-meta` y `.metadata` se midieron y no desbordan.

### Archivos tocados (corte A)

- `app/src/styles/base.css`: `.brand` (`box-sizing: border-box; min-height: var(--target-min)`), `.skip-link` (`display: inline-flex; align-items: center; box-sizing: border-box; min-height: var(--target-min)`).
- `app/src/styles/action-required.css`: `.project-tabs a` (`display: inline-flex; align-items: center; box-sizing: border-box; min-height: var(--target-min)`), `.focus-mode-card h2` (`overflow-wrap: anywhere`).
- `app/src/styles/cssRegressionGuards.test.ts` (nuevo): guarda débil con `node:fs` que comprueba las cuatro declaraciones. Lleva `/// <reference types="node" />` local, porque el tsconfig de la app no incluye los tipos de Node y no se tocó la configuración. Sin reloj real.

No se tocó: `main.tsx`, pantalla de error de configuración, `ProjectTabs.tsx`, textos ni traducciones, DTOs, rutas ni primitives.

### Pruebas añadidas

- `cssRegressionGuards.test.ts`: 4 casos (min-height en `.brand`, `.skip-link`, `.project-tabs a`; `overflow-wrap` en `.focus-mode-card h2`). **Guarda débil**: jsdom no mide layout; solo verifica que la declaración existe en el CSS fuente. La evidencia real es la tabla de mediciones de arriba.

### Gates (en `app/`, resultado real)

- `pnpm lint`: exit 0.
- `pnpm exec tsc -b --noEmit`: exit 0 (tras añadir la referencia de tipos Node solo en el archivo de prueba; antes fallaba con TS2591).
- `pnpm test --maxWorkers=4`: exit 0, 88 archivos y 907 pruebas pasan.
- `pnpm build`: exit 0.
- `pnpm format:check`: exit 0.

### No verificado

- Tab real hasta el skip link: verificado en el navegador, pero solo en `/projects/prj_billing_demo`. La medición de la marca y las pestañas se hizo en esa misma pantalla; no se midió en otras pantallas con pestañas (p. ej. Functional Knowledge, que las comparte).
- No se hizo captura visual comparativa de Focus Mode a 1280 px; la comprobación es por métricas (`scrollWidth` y rectángulos). El `h2` a 1280 px no cambió de ancho (662 px tras el cambio; el antes no se registró), y `overflow-wrap: anywhere` solo actúa sobre tokens que exceden la línea.
- El `preview_start` con `console-mock` del `launch.json` falla por PATH; el servidor de 5173 quedó arrancado a mano y se detiene al cerrar la sesión.

### Notas para revisión

- Los tres objetivos ya tenían ancho ≥ 40 px (marca 161, skip link 184, pestañas 60–192); solo el alto cambió.
- El `user-email` de la barra superior desborda su contenedor (`scrollWidth` 188 frente a 128), pero tiene `overflow: hidden` y no afecta al documento. Se deja fuera de este corte.

---

## Corte B — glosario es/en y conteos de Action Required (observaciones 3 y 4)

Modelo: implementer-high · configurado claude-haiku-5-5 · atendido unknown · esfuerzo high

**Motivo de escalada:** el corte toca muchos textos y pruebas, y los seeds del mock (Runs, bandeja Action Required y mensajes de error). El leader lo marca como escalado.

**Fecha:** 2026-10-21. Rama `feature/jean`. Sin commit, sin push, sin PR. Cortes A y C no se han tocado.

### Observación 3 — decisiones de texto (antes → después)

| Texto antes | Texto después | Archivos principales | Motivo |
|---|---|---|---|
| `NOT CONNECTED` / `CONNECTED` | `SIN CONECTAR` / `CONECTADO` | `projects/ProjectsPage.tsx` | Estado en español (SDD §3) |
| `Integration branch` (4 sitios) | `Rama de integración` | `ProjectsPage`, `ProjectDetailPage`, `IntegrationsPage` (2) | SDD §3. El `id` `integration-branch` y `binding.integrationBranch` no cambian |
| `Active PRs` | `PR activos` | `ProjectsPage.tsx` | SDD §3 |
| `Latest: PR #` | `Último: PR #` | `ProjectsPage.tsx` | SDD §3 |
| `Overview` (pestaña) | `Resumen` | `ui/ProjectTabs.tsx` | SDD §3 |
| `Integrations` (pestaña, breadcrumb, eyebrow) | `Integraciones` | `ui/ProjectTabs.tsx`, `control-plane/IntegrationsPage.tsx` | SDD §3 |
| `Workspace / Overview` | `Workspace / Resumen` | `ProjectsPage.tsx` | SDD §3 |
| `Trace operativo`, `Cargando trace operativo…` | `Traza operativa`, `Cargando traza operativa…` | `OperationalTraceSection.tsx`, `api/mockBackend.ts`, `control-plane/api.ts` | SDD §3 |
| `LIVE · CORE API` | `EN VIVO · CORE API` | `ui/AppShell.tsx` | Equivalente a `DEMO · DATOS SIMULADOS` (decisión menor, SDD §3) |
| `Scope` | `Alcance` | `action-required/FunctionalKnowledgeDetailPage.tsx` | Rótulo de campo en español |
| `Target` (dt, eyebrow, badge, th, fallback) y `Targets` | `Objetivo` / `Objetivos` | `RagGraph`, `RagSidePanel`, `ExperimentComparison`, `InventoryView`, `InventoryPage`, `AnalysisHistoryPage`, `FunctionalKnowledgeDetailPage`, `ContextExplorerPage` | «Target» no está en el glosario: se traduce como rótulo visible. Los literales `target.kind` y los campos de datos se quedan |
| `Target experimental`, `Sin targets`, `Sin targets coincidentes`, `Detalle del target`, `Target:` (cabecera de traza), tabla «por target» | `Objetivo experimental`, `Sin objetivos`, `Sin objetivos coincidentes`, `Detalle del objetivo`, `Objetivo:`, «por objetivo» | `ExperimentPage`, `ExperimentComparison`, `InventoryView`, `RagSidePanel`, `OperationalTraceSection` | Misma regla |
| `Freshness` | `Vigencia` | `OperationalTraceSection.tsx`, `AnalysisRunDetailPage.tsx` («Freshness verificado…») | Campo visible en español |
| `Outcome` (dt) | `Resultado` | `OperationalTraceSection.tsx` | Rótulo visible; los valores `PRESENT`, `NOT_APPLICABLE`, etc. se quedan |
| `Failure type` | `Tipo de fallo` | `ExperimentComparison.tsx` | Rótulo de columna |
| `Tool calls` | `Llamadas a herramientas` | `ExperimentComparison.tsx` | Rótulo de campo |
| `RESULT` (conector de flujo) | `RESULTADO` | `ExperimentPage.tsx`, `RunComparisonPage.tsx` | Rótulo visible |
| `Changeset` (heading, dt, aviso «Changeset grande») | `Conjunto de cambios` | `OperationalTraceSection.tsx`, `AnalysisRunDetailPage.tsx`, `api/mockBackend.ts` | Término fuera del glosario |
| `Snapshot` / `snapshot` (texto visible) | `Instantánea` / `instantánea` | `AnalysisHistoryPage.tsx`, `InventoryPage.tsx`, `AnalysisRunDetailPage.tsx`, `api/mockBackend.ts` (`SNAPSHOT HISTÓRICO` → `INSTANTÁNEA HISTÓRICA`) | Término fuera del glosario. Identificadores (`snapshotRef`, `initialSnapshot`) no cambian |
| `Sin test` / `Con test` | `Sin pruebas` / `Con pruebas` | `InventoryView.tsx`, `InventoryPage.tsx`, `AnalysisHistoryPage.tsx` | Español |
| `Huella de retrieval` | `Huella de recuperación` | `ExperimentComparison.tsx`, `ExperimentPage.tsx`, `RunComparisonPage.tsx` | Término fuera del glosario |
| `Capture next PR` (título y mensaje de error) | `Capturar el próximo PR` | `run-comparison/CaptureNextPrPanel.tsx`, `api/mockBackend.ts` | Español |
| `Control plane / PR-driven`, `Control plane / human-in-the-loop`, `Control plane PR-driven` | `Plano de control / dirigido por PR`, `Plano de control / intervención humana`, `Plano de control dirigido por PR` | `RunsPage`, `ActionRequiredPage`, `FunctionalKnowledgePage`, `ProjectsPage`, `ProjectDetailPage` | Término fuera del glosario |
| `owner` (texto visible) | `propietario` | `ProjectsPage.tsx`, `api/mockBackend.ts`, `control-plane/errors.ts` | Español |
| `bootstrap` (texto visible) | `indexación inicial` | `AnalysisRunDetailPage.tsx`, `api/mockBackend.ts` | Español |
| `RAG Test Studio, proyectos` (aria-label del logo) | `RAG Test Studio, Projects` | `ui/AppShell.tsx` | Una sola escritura de Projects |
| `proyecto` / `proyectos` / `Proyecto «…»` (≈100 ocurrencias en texto visible, mensajes de error, placeholders, aria-labels, mock) | `Project` / `Projects` / `Project «…»` | `projects/*`, `control-plane/errors.ts`, `control-plane/api.ts`, `api/mockBackend.ts`, `ui/Feedback.tsx`, `retrieval-comparison/failureMessages.ts`, `inventory/*`, `action-required/*` | SDD §3 y el criterio «Projects nunca Proyectos». Los comentarios también se ajustaron |

**Dejado sin traducir, con motivo:**
- `Functional Knowledge` (pestaña, título, eyebrow, breadcrumb, texto de error): entidad de Core y ruta `/functional-knowledge`. No está en el glosario y no se amplía aquí. **Pendiente para el usuario:** ampliar el glosario en `spec/transversal/design-system/spec.md` o aceptarlo como nombre de entidad.
- `Runs` (nav, pestaña, títulos): plural del término de glosario `Run`.
- `Projects conectados`: término de glosario con adjetivo en español (regla de mezcla permitida).
- `Ranking` (cabecera de tabla de retrieval): palabra ya aceptada en español. Alternativa «Posición» si el usuario lo prefiere.
- `Tokens` (`${n} tokens`, columna de tokens): uso común en español para el consumo de modelo.
- Glosario sin cambio: `Action Required`, `Focus Mode`, `Repository binding`, `Workspace`, `Analysis Run`, `Companion PR`, `Pull Request`/`PR`, `HEAD`, `Check`, `Sandbox`, `Baseline`, `RAG`.
- Literales de contrato con Core: `READ` (glifo de contrato de solo lectura), `NOT_APPLICABLE`, `PRESENT` y otros valores de trace, `TestTarget` (entidad en el mensaje `UNRESOLVABLE_TARGET`), `target.kind` (`METHOD`, `CLASS`, `FUNCTION`), `project.role` (`READER`…`ADMIN`), `scenarioKind`/`scenarioKey`, `visualAid.kind`, nombres de campo (`functionalRuleIds`, `checkId`, `companionBranch`, `targetCount`, `semanticScore`, `combinedScore`, `embeddingModel`…), `owner/repo` (placeholder de formato), `GitHub Compare API` y `GitHub App` (nombres externos).
- Rótulos DEMO (`DEMO · DATOS SIMULADOS`, `DEMO · GITHUB SIMULADO`, etc.) sin cambio.

**Guarda nueva:** `app/src/ui/glossary.test.ts`. Escaneo estático de las fuentes no-test (excluye `generated` y `speculative`). Falla si aparece un rótulo en inglés fuera de glosario en contexto visible (`CONNECTED`, `Integration branch`, `Active PRs`, `Latest:`, `Overview`/`Integrations` como etiqueta, `Trace operativo`, `Proyectos`, `Control plane`, `Target`/`Changeset`/`Freshness`/`Outcome`/`Scope` como etiqueta, `Failure type`, `Capture next PR`, `Sin test`/`Con test`, `LIVE · CORE API`). Además comprueba que siguen presentes los términos de dominio y los rótulos nuevos. Es una guarda de texto, no sustituye la revisión visual.

### Observación 4 — conteos coherentes de Action Required

**Causa (antes):** había dos colecciones de seeds independientes en `api/mockBackend.ts`. La bandeja (`actionRequiredRuns`) listaba 6 Runs. Entre ellos estaba PR #17, que es `OBSOLETE` y no vigente (HEAD superado), y PR #52, que tenía pregunta pero no tenía registro de Run, así que no aparecía en el listado de Runs. Los Runs con `status: 'ACTION_REQUIRED'` eran 4 y estaban escritos a mano. El badge del nav es global y el KPI es del workspace, y la UI no lo indicaba.

**Fuente única (después):**
1. Se añade el seed del Run `arun_checkout_pr52` (`ACTION_REQUIRED`, vigente, `actionRequiredCount` 1).
2. `deriveActionRequiredRunStatus(seeds)` en `api/mockBackend.ts`. Las preguntas `PENDING` de `actionRequiredRuns` mandan: un Run **vigente** con pregunta pendiente queda `ACTION_REQUIRED` y su `actionRequiredCount` cuenta esas preguntas. Un seed `ACTION_REQUIRED` sin pregunta pendiente vigente falla al cargar.
3. `mockListActionRequired` lista solo los Runs visibles con `status === 'ACTION_REQUIRED'`, de modo que un Run está en ACTION_REQUIRED **sii** aparece en la bandeja.
4. Decisión de Corte B: el Run `arun_billing_pr17` (`OBSOLETE`, `current: false`) sale de la bandeja, porque la bandeja lista Runs vigentes (así lo dice el comentario de la HU38). Su escenario sigue accesible por URL de Focus Mode.
5. Ámbito rotulado en la UI, sin cambiar el comportamiento real:
   - Badge del nav: `title="Pendientes en todos tus Workspaces"` y texto oculto «pendientes en todos tus Workspaces».
   - KPI Action Required: `<small class="kpi-scope">Workspace seleccionado</small>` y regla CSS `.kpi-card .kpi-scope { display: block }` en `styles/components.css`. Es una regla de presentación y no añade primitives.

**Mediciones en navegador (demo mock, workspace por defecto `workspaceId=1000001`, acme). ANTES → DESPUÉS:**

| Medición | Antes | Después |
|---|---|---|
| Badge del nav «Action Required» (global) | 6 | 5 |
| KPI «Action Required» de Projects (workspace) | 4 | 3 (rotulado «Workspace seleccionado») |
| Suma de tarjetas por Project (checkout 2 + billing) | 2 + 2 = 4 | 2 + 1 = 3 |
| Runs con estado Action Required en `/analysis-runs` | 4 (#21, #15, #24, #42) | 5 (+ #52; #17 aparece como «Obsoleto NO VIGENTE») |
| Items de la bandeja `/action-required` | 6 | 5 (#42, #24, #52, #15, #21) |
| Vista previa «Requieren tu atención» (límite 3) | #42, #17, #24 | #42, #24, #52 |
| KPI «PR activos» | 15 | 16 (el PR #52 ya cuenta como PR activo, como los demás Runs ACTION_REQUIRED) |
| KPI «Runs esta semana» | 0 | 0 |

El «3» de la lista del leader es el límite de la vista previa de Projects (`ACTION_REQUIRED_PREVIEW_LIMIT = 3`), que se leía como «3 pendientes». No era un conteo de Runs.

**Texto visible (Projects, Detalle, Integraciones), ANTES → DESPUÉS:**
- Projects: `NOT CONNECTED` / `CONNECTED` / `Integration branch` / `ACTIVE PRS` / `Latest:` / `Workspace / Overview` → `SIN CONECTAR` / `CONECTADO` / `Rama de integración` / `PR ACTIVOS` (uppercase por CSS) / `Último:` / `Workspace / Resumen`.
- Detalle del Project (`/projects/prj_checkout_demo`): pestañas `Overview`, `Integrations` → `Resumen`, `Integraciones`; `INTEGRATION BRANCH` → `RAMA DE INTEGRACIÓN`; «Nombre del Project», «Repository binding» sin cambio.
- Integraciones (`/integrations/github`): breadcrumb `Integrations / GitHub` → `Integraciones / GitHub`; eyebrow `ACME · ADMIN / INTEGRATIONS` → `/ INTEGRACIONES`.
- Traza operativa en el detalle del Run (`arun_checkout_pr42`): `Trace operativo` → `Traza operativa`; `Changeset` → `Conjunto de cambios`; `Target:` → `Objetivo:`.

### Pruebas

- `api/mockBackend.test.ts`: nueva prueba de coherencia «un Run es ACTION_REQUIRED sii aparece en la bandeja», con `actionRequiredCount` esperado por Run.
- `projects/ProjectsPage.test.tsx`: nueva prueba «el KPI Action Required del workspace coincide con la suma de sus tarjetas y está rotulado». Se actualizan KPI (3), «PR activos» (16 y 9) y la vista previa (sin PR #17).
- `ui/glossary.test.ts`: nueva guarda de glosario (ver arriba).
- Actualizadas por textos: `ProjectsPage`, `ProjectDetailPage`, `ProjectTabs`, `AppShell`, `IntegrationsPage`, `bindingLifecycle.live`, `ExperimentPage`, `ExperimentComparison`, `noAutomaticVerdict`, `RunComparisonPage`, `roleGating`, `OperationalTraceSection`, `AnalysisRunDetailPage`, `AnalysisHistoryPage`, `InventoryPage`, `InventoryView`, `errors`, `retrieval-comparison/api`.
- Actualizadas por conteos (Corte B, obs. 4): `action-required/api.test.ts` (HU38 sin PR #17), `ActionRequiredPage.test.tsx` (PR #17 fuera; billing 1), `control-plane/api.test.ts` (22 Runs; checkout 9), `control-plane/RunsPage.test.tsx` (22), `projects/workspaceOverview.test.ts` (22; 21 activos; 9 de checkout; 10 desde 09-13), `ui/AppShell.test.tsx` (badge 5).
- Nombres de prueba con texto de UI renombrados en el mismo corte; las pruebas de nombres de datos (`proyecto-real`) se conservan.

### Gates (en `app/`, resultado real)

| Gate | Comando | Resultado |
|---|---|---|
| Lint | `pnpm lint` | exit 0 |
| Tipos | `pnpm exec tsc -b --noEmit` | exit 0 |
| Pruebas | `pnpm test --maxWorkers=4` | exit 0: 89 ficheros, 911 pruebas en verde |
| Build | `pnpm build` | exit 0 |
| Formato | `pnpm format:check` | exit 0 |

### No verificado / pendiente

- Verificación de navegador solo en escritorio. No se midió el ancho de 375 px ni el zoom 200 % en este corte. Los cambios de texto no alteran el layout salvo en la fila del KPI, que ya se ve bien en escritorio.
- El texto oculto del badge y el `title` no se han probado con lector de pantalla. Lo revisará ux-reviewer.
- `Functional Knowledge` y el resto de decisiones «dejado sin traducir» quedan para el usuario.
- El servidor de desarrollo en `localhost:5173` sigue levantado en segundo plano (`VITE_DATA_SOURCE=mock`).

---

## Corte D — verificación de accesibilidad, zoom, reduced motion y foco (observación 6)

Modelo: implementer-high · configurado claude-haiku-5-5 · atendido unknown · esfuerzo high

**Fecha:** 2026-10-21. Rama `feature/jean`. Sin commit, sin push, sin PR. Informe completo con tabla de criterios, números y pasos reproducibles: `harness/reports/wi-console-047-a11y-verification.md`.

### Defectos corregidos (dentro de alcance)

| # | Defecto | Corrección | Medida |
|---|---|---|---|
| D1 | Nombre accesible del enlace «Action Required» concatenado (jsdom: `Action Required5 pendientes…`) | `NavLink` con `aria-label` completo `Action Required, N pendientes en todos tus Workspaces` (solo si N > 0); badge `aria-hidden` | Chrome y jsdom: `Action Required, 5 pendientes en todos tus Workspaces` |
| D2 | Focus Mode a 320 CSS px: `.pr-ref` desborda | `.pr-ref { min-width: 0; overflow-wrap: anywhere }` | scrollWidth 323 → 320 |
| D3 | Projects, vista previa Action Required a 320 CSS px: pista `auto` del grid | `.action-required-list { grid-template-columns: minmax(0, 1fr) }` | scrollWidth 328 → 320; `ul` = `li` = 1182 px a 1280 px |

Archivos: `app/src/ui/AppShell.tsx`, `app/src/styles/action-required.css`, `app/src/styles/cssRegressionGuards.test.ts` (dos guardas débiles más).

### Pruebas nuevas

- `app/src/ui/canAnimateCanvas.test.ts` (4): MODE=test; reduce → false; sin reduce → true; sin `matchMedia` → true.
- `app/src/styles/reducedMotionGuards.test.ts` (8): guarda estática de los bloques `prefers-reduced-motion: reduce` de motion.css, components.css y trace.css (≤ 120 ms o `none`), con autocomprobación del detector.
- `app/src/ui/accessibleNames.test.tsx` (9): roles y nombres de Focus Mode, tarjetas y KPI de Projects, badge del nav, orden de Tab del shell y árbol de la pantalla de error.
- Sin reloj real: no hay temporizadores en las pruebas nuevas.

### Verificación en navegador (resumen)

- Zoom 200 % (640 CSS px): 8/8 páginas sin desborde (sw = 640).
- 375 CSS px: 8/8 sin desborde (sw = 375). 320 CSS px: 8/8 sin desborde tras D2 y D3; pantalla de error sin desborde a 640, 375 y 320.
- Reduced motion en ejecución (Chrome por CDP con `prefers-reduced-motion: reduce`): animaciones de los selectores CSS en `none` con 0.01 ms; barrido de 5 páginas con transición máxima de 0.01 ms.
- Foco por teclado: Tab sigue «Saltar al contenido» → marca → Runs → Action Required → Cerrar sesión → migas; restauración al cancelar la confirmación de borrado (Cancelar al abrir; «Eliminar Project» al cancelar).
- Árbol de accesibilidad (Chrome CDP): landmarks, encabezados, grupos y nombres de Projects, Focus Mode y pantalla de error.
- No hay diálogos modales (`role=dialog`, `<dialog>`, `aria-modal`: 0 coincidencias en `app/src`); «foco atrapado» no aplica.

### Pendiente (no implementado, ver informe §5)

- DECISION_REQUIRED D-a: objetivos táctiles de migas de pan (17 px de alto) y «Ver todos →» (18–36 px); fuera del listado aprobado.
- DECISION_REQUIRED D-b: mayúsculas por CSS que entran en el nombre accesible («DESTINO DE LA REGLA», «PR ACTIVOS»).
- DECISION_REQUIRED D-c: `user-email` truncado con elipsis a ≤ 375 px.
- No probado: lector de pantalla real, zoom real del navegador, confirmar borrado y aviso de identidad en navegador, loaders animados en ejecución.

### Gates (en `app/`, resultado real tras todos los cambios del corte D)

| Gate | Comando | Resultado |
|---|---|---|
| Lint | `pnpm lint` | exit 0 |
| Tipos | `pnpm exec tsc -b --noEmit` | exit 0 |
| Pruebas | `pnpm test --maxWorkers=4` | exit 0: 92 ficheros, 934 pruebas en verde |
| Build | `pnpm build` | exit 0 (entrada 343.20 kB; router 384.46 kB; AuthProvider 218.63 kB; mock 109.17 kB) |
| Formato | `pnpm format:check` | exit 0 |

### Entorno al cerrar

- Viewport del Browser pane restaurado a desktop.
- Servidor de configuración inválida (`localhost:5174`) cerrado.
- Chrome headless con CDP cerrado.
- El servidor de `localhost:5173` (mock) estaba levantado antes del corte y se deja activo.
