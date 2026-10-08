# WI-CONSOLE-019 — Implementación

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

Work item: WI-CONSOLE-019 «Copy de OE5 y ausencia de veredictos automáticos» (ST-CONSOLE-021, HU17). Corte de solo copy y pruebas en `app/`. No se hizo commit, push ni se editaron `harness/state.json`, `harness/work-items.json` ni `tasks.md`.

## Cambios

1. Nuevo `app/src/experiments/ExperimentConditionsNote.tsx`: exporta `EXPERIMENT_CONDITIONS_NOTE` con el texto exacto aprobado y el componente `ExperimentConditionsNote`. Texto plano en `div.contract-note` con `role="note"`; sin tooltip ni color como portador de significado. No se añadieron estilos nuevos.
2. `app/src/experiments/ExperimentPage.tsx`: inserta `<ExperimentConditionsNote />` justo después del encabezado experimental (`experimental-heading`), antes del panel de captura y del `lab-boundary`.
3. `app/src/run-comparison/RunComparisonPage.tsx`: inserta `<ExperimentConditionsNote />` después del `page-heading`, antes del `contract-note` existente de laboratorio simulado.
4. `app/src/experiments/ExperimentPage.test.tsx` y `app/src/run-comparison/RunComparisonPage.test.tsx`: aserción `getByText(EXPERIMENT_CONDITIONS_NOTE)` en el primer test de cada archivo.
5. Nuevo `app/src/experiments/noAutomaticVerdict.test.tsx`:
   - Renderiza `ExperimentPage` y `RunComparisonPage` en mock con resultado completado, en dos variantes: RAG > agente (mock por defecto) e invertidas (agente > RAG). La inversión se hace con un wrapper de `ExperimentComparison` mediante `vi.mock`, sin editar el componente real.
   - Afirma que `textContent` no coincide con `/paridad|ganador|superior|winner|veredicto|outperform|gana\b/i`, que no hay elementos con clase de ganador/veredicto, que la nota exacta está presente.
   - Comprueba que `DEMO · DATOS SIMULADOS` sigue visible (renderizado con `AppShell`).
   - Comprueba que la tabla de estrategias no contiene términos prohibidos.

No se tocaron `ExperimentComparison.tsx`, `types.ts`, `api.ts`, `liveMapping.ts`, contratos, ni `positive-delta`/`negative-delta` (WI-CONSOLE-018). Los mocks siguen rotulados DEMO · DATOS SIMULADOS.

## Prueba negativa

Inyección temporal de `<span>ganador</span>` en `ExperimentConditionsNote.tsx`: `noAutomaticVerdict.test.tsx` falla en 4 de 6 casos (las dos pantallas en ambas variantes de tasas), como se esperaba. Después el archivo se restauró desde copia en scratchpad y `diff` confirma que quedó idéntico.

## Resultados de comandos (desde `app/`)

- `npx vitest run` sobre los tres archivos afectados: 3 archivos, 15 pruebas, todas en verde.
- `npm run lint`: exit 0.
- `npm test`: 54 archivos, 434 pruebas, todas en verde.
- `npm run build`: exit 0 (`tsc -b && vite build`). Solo aparece la advertencia habitual de tamaño de chunk (>500 kB), no es error.

## Archivos afectados

- `app/src/experiments/ExperimentConditionsNote.tsx` (nuevo)
- `app/src/experiments/noAutomaticVerdict.test.tsx` (nuevo)
- `app/src/experiments/ExperimentPage.tsx`
- `app/src/experiments/ExperimentPage.test.tsx`
- `app/src/run-comparison/RunComparisonPage.tsx`
- `app/src/run-comparison/RunComparisonPage.test.tsx`
- `harness/reports/wi-console-019-implementation.md` (este informe)

## Notas

- `harness/state.json`, `harness/work-items.json` y `spec/features/014-analysisrun-experiments/tasks.md` ya aparecían modificados en el snapshot inicial del repositorio; no fueron tocados en esta sesión.
- Pendiente de revisión: `ux-reviewer` (cambio de UI visible, obligatorio según AGENTS.md) y Human Reviewer antes de declarar el WI terminado.
- Riesgo residual: el color verde/rojo de los deltas en `ExperimentComparison` puede leerse como veredicto; queda a WI-CONSOLE-018.
