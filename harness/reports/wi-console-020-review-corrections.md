# WI-CONSOLE-020 — Correcciones de revisión

**Implementer:** `implementer` · **Modelo:** GPT-6 Luna / medium
**Alcance:** correcciones formales de OE5, estado vacío live de OE5 e idempotencia de respuestas funcionales. Sin cambios a Core ni commits.

## Cambios

- El encabezado de AnalysisRun conserva las acciones previas permitidas, pero oculta «Comparar RAG vs GA» cuando el Run está `OBSOLETE`. Se añadió una regresión de UI para el Run obsoleto de demo.
- En el laboratorio live, falta de `analysisRunId`, Run `ACTION_REQUIRED`/`OBSOLETE`/en procesamiento o ausencia de un símbolo `DIRECTLY_CHANGED` `METHOD`/`FUNCTION` muestra una explicación accionable y no presenta un selector vacío ni el botón de inicio. La selección y los escenarios de demo continúan disponibles en mock.
- `submitFunctionalAnswer` envía `Idempotency-Key` UUID en live. `useSubmitFunctionalAnswer` conserva la clave para reintentos de la misma pregunta y payload, y la elimina al confirmar éxito; una respuesta con resolución de conflicto queda como otra acción lógica. Auth y errores siguen pasando por `apiRequest`/`ApiError`.

## Evidencia

- Pruebas focales: `npm test -- --run src/control-plane/AnalysisRunDetailPage.test.tsx src/experiments/ExperimentPage.test.tsx src/action-required/api.test.ts src/action-required/FocusModePage.test.tsx` — 4 archivos, 85 pruebas aprobadas. Incluye ausencia de CTA OE5 en Run `OBSOLETE`, ambos estados vacíos live, headers UUID en `UNKNOWN` y `YES`, y reutilización de clave al reintentar `UNKNOWN`.
- `npm run lint` — aprobado.
- `npm run build` — aprobado. Vite mantiene el aviso de chunk de más de 500 kB.

## Archivos afectados por estas correcciones

- `app/src/control-plane/AnalysisRunDetailPage.tsx`
- `app/src/control-plane/AnalysisRunDetailPage.test.tsx`
- `app/src/experiments/ExperimentPage.tsx`
- `app/src/experiments/ExperimentPage.test.tsx`
- `app/src/action-required/api.ts`
- `app/src/action-required/api.test.ts`
- `app/src/action-required/queries.ts`
- `app/src/action-required/FocusModePage.test.tsx`
