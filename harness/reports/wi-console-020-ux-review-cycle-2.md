# WI-CONSOLE-020 — Revisión UX, ciclo 2

Modelo: ux-reviewer · configurado Codex gpt-6-luna · atendido gpt-6-luna · esfuerzo high

Alcance: verificar los dos hallazgos del ciclo anterior y los criterios de UX indicados para AnalysisRunDetail y ExperimentPage. Revisión UX; no se modificó `app/` ni `harness/state.json`.

## Veredicto: APPROVED

## Findings

Ninguno. Las correcciones solicitadas están presentes y los flujos revisados son claros:

- `AnalysisRunDetailPage` no presenta el CTA OE5 para `OBSOLETE`; la prueba del fixture obsoleto comprueba la ausencia del enlace. Para un Run elegible, el enlace mantiene `analysisRunId` en la query string.
- En modo live, la ruta sin `analysisRunId`, un Run `OBSOLETE`, `ACTION_REQUIRED`, `QUEUED` o `PROCESSING`, y un Run sin símbolo elegible reciben mensajes con el siguiente paso o motivo. Para la ruta sin id y el Run sin símbolo elegible, las pruebas comprueban que no aparezcan ni selector ni botón de ejecución. El estado se anuncia con `role="status"`.
- El mock presenta el distintivo `DEMO` y el texto de laboratorio simulado. La prueba del flujo mock verifica que no se invoque `fetch`; los escenarios adicionales están identificados como DEMO en sus opciones/resultados.
- En móvil, las acciones del encabezado Run se apilan, ocupan el ancho disponible y no quedan restringidas a una fila horizontal (`styles.css`, breakpoint de 680 px). Revisión estática del CSS; no se tomó captura de viewport.
- Las pruebas de la página usan respuestas `fetch` simuladas para los casos live. No se hizo una llamada a Core real ni se declara verificación live.

## Blockers

Ninguno.

## filesAffected

Revisados, sin edición productiva:

- `app/src/control-plane/AnalysisRunDetailPage.tsx`
- `app/src/control-plane/AnalysisRunDetailPage.test.tsx`
- `app/src/experiments/ExperimentPage.tsx`
- `app/src/experiments/ExperimentPage.test.tsx`
- `app/src/styles.css`
- `app/src/api/mockBackend.ts`

## Evidence

- `cd app && npm test -- --run src/control-plane/AnalysisRunDetailPage.test.tsx src/experiments/ExperimentPage.test.tsx` — 2 archivos, 43 pruebas pasaron.
- `node harness/validate-harness.mjs` — `Harness V3 validation passed`.
- `AnalysisRunDetailPage.test.tsx`: el caso `OBSOLETE` no ofrece OE5 y el caso elegible navega con `?analysisRunId=arun_checkout_pr45`.
- `ExperimentPage.test.tsx`: la ruta live sin id y el Run live sin símbolo elegible muestran explicación y ocultan los controles vacíos; el flujo mock no llama `fetch`.
- `ExperimentPage.tsx`: mensajes diferenciados para ausencia de id, Run obsoleto, `ACTION_REQUIRED`, Run en procesamiento y ausencia de símbolo elegible.
- `styles.css`: `.run-heading-actions` cambia a columna y los botones del encabezado se expanden al 100 % hasta 680 px.
- No se verificó ejecución real contra Core.

## recommendedNextStep

Entregar este informe para la revisión técnica humana independiente de WI-CONSOLE-020.
