# WI-CONSOLE-036 — verificación de suficiencia SDD

Modelo: sdd-analyst · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

**Veredicto: SUFICIENTE** (con 5 precisiones que el implementer debe tratar como parte del alcance, sin ampliar contrato).

## Decisiones y gates
- `decisionGate` ya registrado sin bloqueantes. En 014 solo constan `DEC-EXP-FK-001` y `DEC-EXP-003`, ambas APROBADO; ninguna PENDING/PROPOSED con `Blocks` que alcance ExperimentPage.
- Alcance aprobado por el usuario (`wi-console-036-scope-approval.md`); `contractImpact:false`, sin DTO/rutas/Core. Contract Sync 2.13–2.15 y sondeo fuera de alcance. B4 es heurística de presentación; raíz en Core (backlog #4 / IDEA-024).
- ST-CONSOLE-037 existe en tasks.md y enlaza WI-CONSOLE-036.

## Hallazgos y precisiones
1. **`setSearchParams` y `analysisRunId`:** hoy solo se usa `useSearchParams()[0]`. Escribir `experimentId` debe usar la forma funcional (`prev => new URLSearchParams(prev)`) con `replace: true` y preservar `analysisRunId` y cualquier otro parámetro.
2. **Fuente de verdad del id:** derivar `experimentId` de `searchParams` (eliminar `useState`) evita la carrera al montar. `submittedLabel` hoy llena `getExperiment(id, label)`; al reabrir por URL el label será `'target'`; debe tolerarse (o derivarse del resultado) y declararse.
3. **«Ver contexto →» y volver:** el enlace va a `/projects/:id/experimental/:experimentId/context` y el breadcrumb «Modo experimental» de `ContextExplorerPage.tsx:158` apunta a `/projects/:id/experimental` SIN query. Se pierde `experimentId`/`analysisRunId`. Criterio «volver conserva el id» exige cambiar ese enlace (o usar navigate(-1)); esto es cambio de Console, no de ruta nueva. Añadir prueba.
4. **Nota `role="status"`:** ya hay `role="status"` para `liveRunEligibilityMessage` y para progreso; la nueva nota debe ser una región persistente única (montada siempre, texto cambia) para que lectores la anuncien, referenciada con `aria-describedby` del botón; no duplicar con la nota de elegibilidad. `disabled` actual incluye `Boolean(experimentId)`: motivo «ya lanzado» y «en curso» deben distinguirse.
5. **UNRESOLVABLE_TARGET:** no existe en `codeMessages` de `control-plane/errors.ts`; hoy cae al `error.message` de Core. Añadir copy en `codeMessages` (afecta también otros consumidores de `bindingErrorMessage`; revisar). Mock: `mockBackend.ts:1209` ya emite 404 UNRESOLVABLE_TARGET.
6. **Error de consulta (B3):** `experimentQuery.isError` hoy ignorado → «Preparando…» eterno. Un 404 por id inexistente y un error de red usan el mismo bloque; `refetchInterval` no debe reintentar en bucle tras error (comprobar que `query.state.data` undefined no sigue sondeando indefinidamente; React Query pausa con error solo si retry agotado, validar en prueba).
7. **Heurística B4 (límites):** por nombre (`constructor`, `__construct`, también `Clase::__construct`/`Clase.constructor`: comparar el último segmento tras `::` o `.`). No cubre `__invoke`, métodos triviales ni constructores con otro nombre (Java/C#). Si todos son constructores, no se filtra: nota «puede no ser ejecutable». Orden estable (conservar orden relativo). Importante: `selectedTarget` hoy cae en `selectable[0]`; debe caer en el primer no-constructor y respetar `targetId` explícito.
8. **Mock (B4):** en modo mock `selectable` NO usa `eligibleRunSymbols`, usa inventario + `DEMO_EXPERIMENT_SELECTOR_OPTIONS`, y ningún Run mock contiene un constructor. La prueba ROJO de B4 debe ser en modo live con `useAnalysisRun` mockeado (como ya hace `ExperimentPage.test.tsx`) con símbolos `[__construct, apply]`. Si se quiere demostración manual en mock, añadir un símbolo constructor a un Run mock (DEMO) sin tocar contrato.
9. **Riesgo carrera/montaje:** con `?experimentId=` y `analysisRunId` ausente en live, el botón queda deshabilitado pero resultados deben mostrarse; la guarda `liveRunEligibilityMessage` no debe ocultar el experimento reabierto.

## Archivos afectados
- `app/src/experiments/ExperimentPage.tsx` (+ `ExperimentPage.test.tsx`)
- `app/src/control-plane/errors.ts` (+ su test)
- `app/src/context-explorer/ContextExplorerPage.tsx` (breadcrumb/volver; + test)
- Opcional: helper de orden (p. ej. `experiments/targetOrdering.ts` + test), `api/mockBackend.ts` (símbolo constructor DEMO).
- Docs al cierre: `spec/features/014-.../tasks.md`, `CHANGELOG.md`. No tocar `failureMessages.ts` (sin cambios necesarios), `router.tsx` (sin rutas nuevas).

## Pruebas ROJO sugeridas
**B1**
- Al lanzar con éxito, la URL contiene `?analysisRunId=arun-1&experimentId=exp-1` (ambos).
- Montar con `?analysisRunId=arun-1&experimentId=exp-1` invoca `getExperiment('exp-1')` y muestra resultados sin pulsar el botón; botón deshabilitado.
- `experimentId` inexistente (404) muestra error claro con correlation id.
- Desde resultados, `Ver contexto →` y el breadcrumb de vuelta regresan a la página conservando `experimentId` y `analysisRunId`.
- No se llama al listado de experimentos.

**B3**
- Un caso por motivo: sin target, rol de solo lectura, ya lanzado, en curso (`isPending`), Run no elegible; la nota `role="status"` contiene el texto concreto y el botón la referencia con `aria-describedby`.
- `getExperiment` rechaza: aparece bloque con mensaje, correlation id y «Reintentar»; no aparece «Preparando experimento…»; clic en Reintentar refetch.

**B4**
- Run live con símbolos `[Foo::__construct, Foo::apply]`: el select preselecciona `Foo::apply`; el constructor sigue en la lista al final.
- Variante `constructor` (TS) y orden estable de varios no-constructores.
- Único candidato constructor: se preselecciona y se muestra nota «puede no ser ejecutable».
- Elegir manualmente un constructor muestra la nota; elegir otro la oculta.
- POST rechaza 404 `UNRESOLVABLE_TARGET`: se muestra copy propio (test de `bindingErrorMessage` + de página), no el mensaje crudo.

## Siguiente paso recomendado
Implementer (cambio de 3 archivos de producto, nivel Implementer estándar). Sin contract-reviewer: no hay impacto de integración. UX review obligatoria (nota de estado, foco, 375/768/1024).

status: SUFICIENTE · blockers: ninguno
