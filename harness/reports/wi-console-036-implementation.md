Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

# WI-CONSOLE-036 — implementación

## Corte A

Alcance: solo B1 (`?experimentId=` en la misma ruta, reapertura por URL) y breadcrumb de contexto. Sin commit, sin push, sin tocar `harness/state.json`, `work-items.json`, `router.tsx`, `failureMessages.ts`, contratos ni Core. Sin sondeo en segundo plano.

### Archivos tocados

- `app/src/experiments/ExperimentPage.tsx`: `experimentId` derivado de `searchParams` (se elimina el `useState`); al lanzar con éxito se escribe `experimentId` con `setSearchParams` en forma funcional, `replace: true`, preservando `analysisRunId` y el resto de parámetros; se pasa `analysisRunId` a `ExperimentComparison`.
- `app/src/experiments/ExperimentComparison.tsx`: prop opcional `analysisRunId`; el enlace «Ver contexto →» añade `&analysisRunId=` cuando existe (sin cambio de rutas).
- `app/src/context-explorer/ContextExplorerPage.tsx`: el breadcrumb «Modo experimental» apunta a `/projects/:id/experimental?experimentId=…[&analysisRunId=…]`.
- `app/src/experiments/ExperimentPage.test.tsx`: 4 pruebas nuevas de B1 (+ `LocationProbe` y helper de fixtures live locales al bloque).
- `app/src/context-explorer/ContextExplorerPage.test.tsx`: 1 prueba nueva del breadcrumb.

### ROJO (antes del cambio)

Comando: `node node_modules/vitest/vitest.mjs run src/experiments/ExperimentPage.test.tsx src/context-explorer/ContextExplorerPage.test.tsx --maxWorkers=2`

```
 FAIL  src/context-explorer/ContextExplorerPage.test.tsx > WI-CONSOLE-036 B1: el breadcrumb «Modo experimental» conserva experimentId y analysisRunId
AssertionError: expected null to be 'exp_demo_2001' // Object.is equality
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B1: tras lanzar con éxito la URL contiene analysisRunId y experimentId
AssertionError: expected null to be 'exp-1' // Object.is equality
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B1: montar con experimentId reabre el experimento sin pulsar el botón y lo deja deshabilitado
TestingLibraryElementError: Unable to find an element with the text: Huella de exploración.
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B1: un experimentId inexistente (404) conserva el id en la URL
AssertionError: expected "fetch" to be called with arguments: [ StringContaining{…}, Anything ]
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B1: «Ver contexto →» conserva analysisRunId en la query y no se llama al listado de experimentos
TestingLibraryElementError: Unable to find an element with the text: Ver detalle por target y repetición.
Tests  5 failed | 22 passed (27)
```

Nota: un primer intento de ROJO falló por un import de `useLocation` que no se añadió (error de `sed`); se corrigió antes de registrar esta salida.

### VERDE (después del cambio)

- `node node_modules/vitest/vitest.mjs run src/experiments src/context-explorer --maxWorkers=2`: `Test Files 12 passed (12)`, `Tests 115 passed (115)`.
- `node node_modules/typescript/bin/tsc -b --noEmit`: salida vacía, código 0.
- `npm run lint`: sin errores, código 0.

Diff: 5 archivos, 114 inserciones, 7 eliminaciones (incluye pruebas).

### Decisiones

- `submittedLabel` se mantiene como estado; al reabrir por URL queda en `'target'` (tolerado según el sdd-verification, punto 2).
- La guarda de elegibilidad live no oculta los resultados reabiertos: el bloque de resultados no depende de `liveRunEligibilityMessage`; el botón queda deshabilitado por `Boolean(experimentId)`.
- El breadcrumb de vuelta toma `analysisRunId` de la URL del explorador si está presente; en el explorador no siempre existe, y entonces solo se conserva `experimentId` (el laboratorio reabre el experimento sin `analysisRunId`).

### Dudas y pendientes (fuera del corte A)

- Id inexistente (404): en este corte el id se conserva en la URL, pero la pantalla sigue mostrando «Preparando experimento» sin fin. El bloque de error con Reintentar y correlation id es del corte B (B3).
- B4 y `UNRESOLVABLE_TARGET` no se tocaron (corte B). Sin decisiones de producto nuevas: no hay `DECISION_REQUIRED` en este corte.
- Revisión independiente pendiente: Human Reviewer (el usuario). Sin commit ni push.

## Corte B

Alcance: B3 (nota de estado única y error de consulta), B4 (heurística de constructores) y copy de `UNRESOLVABLE_TARGET`. Sin commit, sin push, sin tocar `harness/state.json`, `work-items.json`, `router.tsx`, `failureMessages.ts`, contratos ni Core. Sin sondeo en segundo plano (WI-037). El corte A (B1) no se ha deshecho.

### Archivos tocados

- `app/src/experiments/ExperimentPage.tsx`: nota `role="status"` única (`#experiment-run-note`) bajo el botón, siempre montada, con `aria-describedby` desde el botón; motivos: solo lectura, Run no elegible, ya lanzado, en curso, sin target; vacía con el botón habilitado. Se unifica el `<p>` de solo lectura y la nota de elegibilidad en esa misma región. `experimentQuery.isError` muestra `role="alert"` con mensaje, correlation id y «Reintentar» (`refetch`); no se muestra «Preparando experimento» en ese caso. `refetchInterval` devuelve `false` si la query está en error. B4: `selectable` se ordena con `orderConstructorsLast`; `selectedTarget` usa `defaultTarget` y respeta `targetId`; si el seleccionado es constructor se muestra `<p id="experiment-constructor-hint">` (sin `role`) referenciado por `aria-describedby` del select. Heurística comentada como presentación; raíz en Core (backlog #4 / IDEA-024).
- `app/src/experiments/targetOrdering.ts` (nuevo): `isConstructorName`, `orderConstructorsLast`, `defaultTarget`.
- `app/src/experiments/targetOrdering.test.ts` (nuevo): pruebas del helper.
- `app/src/experiments/ExperimentPage.targets.test.tsx` (nuevo): B4 en live con `useAnalysisRun` mockeado (`[Foo::__construct, Foo::apply]`, `Bar.constructor`, único constructor, elegir constructor a mano y otro).
- `app/src/experiments/ExperimentPage.test.tsx`: pruebas B3 (rol de solo lectura, ya lanzado, en curso, Run no elegible, botón habilitado, rechazo de `getExperiment` con correlation id y Reintentar, sin sondeo tras error, Reintentar refetch) y B4 (POST 404 `UNRESOLVABLE_TARGET`). Dos ajustes de pruebas existentes (ver Decisiones).
- `app/src/control-plane/errors.ts`: `UNRESOLVABLE_TARGET` en `codeMessages`. Ningún otro código tocado.
- `app/src/control-plane/errors.test.ts`: prueba del copy de `UNRESOLVABLE_TARGET`.
- `app/src/api/mockBackend.ts`: opción DEMO `demo-error-unresolvable-target` con etiqueta «DEMO · DATOS SIMULADOS · Demo::__construct» en `DEMO_EXPERIMENT_SELECTOR_OPTIONS`, y rama explícita que responde 404 `UNRESOLVABLE_TARGET` (sin tocar contrato).

### ROJO (antes del cambio)

Pruebas de B3/B4/copy escritas primero. Comando: `node node_modules/vitest/vitest.mjs run src/experiments/ExperimentPage.test.tsx src/experiments/ExperimentPage.targets.test.tsx src/experiments/targetOrdering.test.ts src/control-plane/errors.test.ts --maxWorkers=2`

```
 FAIL  src/experiments/targetOrdering.test.ts [ src/experiments/targetOrdering.test.ts ]
Error: Failed to resolve import "./targetOrdering" from "src/experiments/targetOrdering.test.ts". Does the file exist?
 FAIL  src/control-plane/errors.test.ts > WI-CONSOLE-036 B4: UNRESOLVABLE_TARGET tiene copy propio y no muestra el mensaje crudo de Core
AssertionError: expected 'El TestTarget no existe o no pertenec…' to be 'No pudimos localizar el target elegid…' // Object.is equality
 FAIL  src/experiments/ExperimentPage.targets.test.tsx > B4: [Foo::__construct, Foo::apply] preselecciona Foo::apply y deja el constructor al final sin filtrarlo
AssertionError: expected 'Run arun-1 · Foo::__construct · src/f…' to contain 'Foo::apply'
 FAIL  src/experiments/ExperimentPage.targets.test.tsx > B4: variante TS `constructor` se ordena al final y el orden de los demás se conserva
AssertionError: expected 'Run arun-1 · Bar.constructor · src/fo…' to contain 'Bar.run'
 FAIL  src/experiments/ExperimentPage.targets.test.tsx > B4: si el único candidato es constructor queda preseleccionado y se muestra la nota de no ejecutable
Error: expect(received).toBeInTheDocument()
 FAIL  src/experiments/ExperimentPage.targets.test.tsx > B4: elegir a mano un constructor muestra la nota; elegir otro la oculta; la nota no es role="status"
Error: expect(received).toBeInTheDocument()
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B3: con rol de solo lectura, la única nota role="status" explica el motivo
Error: expect(element).toHaveTextContent()
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B3: con experimentId ya lanzado, el botón queda deshabilitado y su nota (aria-describedby) explica por qué
AssertionError: expected null to be 'experiment-run-note' // Object.is equality
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B3: mientras la creación está en curso, la nota lo dice y el botón queda ocupado
AssertionError: expected null to be 'experiment-run-note' // Object.is equality
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B3: un Run no elegible muestra el motivo en la única nota role="status" y no hay selector
TestingLibraryElementError: Found multiple elements with the role "status"
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B3: con botón habilitado, la nota persistente sigue montada y vacía y el botón la referencia
AssertionError: expected null to be 'experiment-run-note' // Object.is equality
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B3: getExperiment que rechaza muestra alert con mensaje, correlation id y Reintentar, sin «Preparando experimento»
TestingLibraryElementError: Unable to find role="alert"
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B3: tras el error no hay sondeo en bucle y Reintentar vuelve a pedir el experimento una vez
TestingLibraryElementError: Unable to find role="alert"
 FAIL  src/experiments/ExperimentPage.test.tsx > WI-CONSOLE-036 B4: POST 404 UNRESOLVABLE_TARGET muestra el copy propio, no el crudo de Core
Error: [2mexpect(element).toHaveTextContent()[22m
Tests  13 failed | 46 passed (59)
```

Nota: el primer ROJO del B4 de página falló también por un error de render (`runNote` usado antes de declarar `startMutation`, TDZ) introducido en mi primera pasada; se corrigió moviendo `runNote` antes de los retornos tempranos. No cuenta como ROJO válido.

### VERDE (después del cambio)

- `node node_modules/vitest/vitest.mjs run src/experiments/ExperimentPage.test.tsx src/experiments/ExperimentPage.targets.test.tsx src/experiments/targetOrdering.test.ts src/control-plane/errors.test.ts --maxWorkers=2`: `Test Files 4 passed (4)`, `Tests 62 passed (62)`.
- `node node_modules/vitest/vitest.mjs run src/experiments src/control-plane src/context-explorer --maxWorkers=2`: `Test Files 28 passed (28)`, `Tests 386 passed (386)`.
- `node node_modules/typescript/bin/tsc -b --noEmit`: sin salida, código 0.
- `npm run lint`: `eslint .` sin errores, código 0.

### Decisiones

- Ajuste de una prueba existente (FAILED visible, EXPERIMENT_WORKER_LOST): tenía `queryByRole('status')` a null. Con la nota persistente siempre montada eso ya no puede cumplirse; la aserción pasa a comprobar que la nota dice «ya se lanzó». Motivo: requisito «siempre montada» de B3.
- Ajuste de un conteo existente (B2 selector DEMO): `DEMO ·` de 10 pasa a 11 por el símbolo constructor DEMO añadido. Motivo: el propio alcance pide añadirlo al mock.
- Las pruebas B3 localizan la nota por `id` (`#experiment-run-note`) y no por `getByRole('status')`: la app ya tiene otra región `role="status"` global, por lo que el rol no identifica la nota de forma única en pantalla.
- Nota de «ya lanzado»: se muestra cuando hay `experimentId` y la creación no está en curso; el botón queda deshabilitado por `Boolean(experimentId)` como antes.
- Ante error de consulta, el bloque ofrece «Reintentar» (`refetch`) con `disabled` mientras `isFetching`. `refetchInterval` devuelve `false` si `status === 'error'`; la prueba de no-sondeo comprueba que el conteo de llamadas no crece tras el error.
- Heurística B4: por nombre, último segmento tras `::` o `.` (`constructor`/`__construct`), comparado sobre el `qualifiedName` del Run (no sobre la etiqueta, que contiene la ruta del archivo con puntos). Se preselecciona el primer no-constructor; si todos lo son, el primero, con nota.
- Copy `UNRESOLVABLE_TARGET`: «No pudimos localizar el target elegido en el código de este Run. Prueba con otro símbolo del Run.» Sin promesa de reanudación.

### Dudas y pendientes

- Rama «sin target seleccionado» de la nota: en la práctica es inalcanzable (live cae en la guarda de elegibilidad y mock siempre tiene opciones DEMO). Está implementada como salvaguarda; no tiene prueba propia por no poder llegar a ella con los datos actuales.
- El mensaje de constructor sigue siendo heurístico y por nombre: no cubre `__invoke`, métodos triviales ni constructores con otro nombre (Java/C#). Pendiente en Core (backlog #4 / IDEA-024).
- La revisión de UX (`ux-reviewer`) queda pendiente por cambio visible (nota de estado, foco y lectura en 375/768/1024). Revisión independiente final: Human Reviewer (usuario). Sin commit ni push.
- Sin decisiones de producto nuevas: no hay `DECISION_REQUIRED` en este corte.

## Corrección UX ciclo 1

Hallazgo MEDIO del ux-reviewer (`harness/reports/wi-console-036-ux-review.md`): con `experimentQuery.isError` la nota #experiment-run-note decía «ya se lanzó» sin salida visible.

### ROJO

- Dos pruebas nuevas en `app/src/experiments/ExperimentPage.test.tsx` (bloque «WI-CONSOLE-036 UX c1»): nota veraz ante error de consulta, y «Iniciar otra comparación» quita `experimentId`, conserva `analysisRunId` y rehabilita el botón.
- Resultado previo a implementar: 2 fallidas (`-t "UX c1"`), por ausencia de la nota veraz y del botón.

### VERDE

- Nota: con `experimentId && experimentQuery.isError` → «No se pudo cargar el experimento de la URL; reintenta o inicia otra comparación.» (antes de la rama «ya se lanzó»).
- Bloque de error de consulta: botón «Iniciar otra comparación» con `setSearchParams` funcional, `replace: true`, que elimina `experimentId` y conserva el resto (incluido `analysisRunId`). Sin rutas nuevas.
- `node node_modules/vitest/vitest.mjs run src/experiments --maxWorkers=2`: 7 ficheros, 85 pruebas en verde.
- `node node_modules/typescript/bin/tsc -b --noEmit`: código 0.
- `npm run lint`: `eslint .` sin errores.

### Pendiente

- Revisión UX posterior al cambio (Human Reviewer). Sin commit ni push. No se tocaron `state.json` ni `work-items.json`.

## Ciclo 3

Modelo: implementer · claude-haiku-5-5 · esfuerzo bajo

Alcance: reproducir el defecto «Preparando experimento… 0%» con `?experimentId=nope-404` usando el cliente de `main.tsx` (`retry: 1`, `refetchOnWindowFocus: false`), con el documento sin foco (`focusManager.setFocused(false)`, como el panel del navegador con `visibilityState=hidden`). Aplicar `retry: false` solo en la query del experimento. Sin tocar `main.tsx`, sondeos, `refetchIntervalInBackground` ni contratos. Sin commit ni push; sin tocar `harness/state.json` ni `work-items.json`.

### Archivos tocados

- `app/src/experiments/ExperimentPage.retry.test.tsx`: prueba original (con foco) más una nueva prueba «con el documento sin foco». Ambas usan `QueryClient` igual al de `main.tsx`, `getExperiment` que rechaza siempre con `ApiError` 404, `MODE` a `development` y `waitFor` de 5 s. La nueva restaura con `focusManager.setFocused(undefined)` en `finally`. Ambas afirman `harness.calls` igual a 1 (antes `>= 2`, que dependía del reintento automático).
- `app/src/experiments/ExperimentPage.tsx`: query del experimento con `retry: false` (y comentario WI-CONSOLE-036 ciclo 3). Nada más.

### ROJO

Comando: `node node_modules/vitest/vitest.mjs run src/experiments/ExperimentPage.retry.test.tsx --maxWorkers=2`, antes del cambio de producto.

```
 ❯ src/experiments/ExperimentPage.retry.test.tsx (2 tests | 1 failed)
   ✓ ... con el cliente de main.tsx, un experimentId que falla llega al alert ... (con foco)
   × WI-CONSOLE-036 ciclo 3 (hipótesis foco): con el documento sin foco ... llega al alert en 5 s
     Unable to find role="alert"  (timeout 5000 ms)
     DOM: «Preparando experimento», Experiment nope-404, progreso 0%
```

Con el documento sin foco, la query queda en pendiente, el alert no aparece en 5 s y se muestra «Preparando experimento». Es el síntoma reportado. Con foco (prueba original) el alert aparece, como antes.

### CAUSA (verificada en jsdom)

Con el documento sin foco, TanStack Query v5 pausa el reintento de la query (`focusManager`), así que la query no llega a `error` y la pantalla sigue en «Preparando experimento». Con `retry: false` no hay reintento que pausar y el error llega de inmediato. La causa queda demostrada en la prueba; que el panel del navegador del ux-reviewer tenga exactamente `visibilityState=hidden` por esta misma vía no se ha verificado en navegador real.

### VERDE

Tras aplicar `retry: false` en `ExperimentPage.tsx`:

- `node node_modules/vitest/vitest.mjs run src/experiments --maxWorkers=2`: 8 ficheros, 87 pruebas en verde (incluidas las 2 del fichero de reintento).
- `node node_modules/typescript/bin/tsc -b --noEmit`: código 0.
- `npm run lint`: `eslint .` sin errores, código 0.

### Pendiente

- Confirmar en navegador real (ux-reviewer o Browser pane con `?experimentId=nope-404`) que el alert aparece sin foco. La prueba cubre la mecánica, no el navegador concreto.
- Revisión humana del diff antes de cerrar el ciclo. Sin commit ni push.
