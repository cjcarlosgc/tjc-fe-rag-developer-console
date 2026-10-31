# WI-CONSOLE-054 — implementación

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

Retirado `CaptureNextPrPanel` de `ExperimentPage` (import y uso), sus dos pruebas HU49, `CaptureNextPrPanel.tsx`, `run-comparison/speculative/captureNextPr.ts` y su test (directorio `speculative/` eliminado) y el estado/funciones huérfanos del mock (`captureNextPrStates`, `captureNextPrSeq`, `mockGet/Arm/DisarmCaptureNextPr`, `mockSimulateNextEligiblePullRequest`, `CAPTURE_SYMBOL_BY_PROJECT`). Sin CSS huérfano (clases genéricas). El mock de `experiment-captures` y `ExperimentCapturePanel` no se tocaron.

Gates en `app/` (Node 22): lint, `tsc -b --noEmit`, `test --maxWorkers=4` (96/96 archivos, 1010/1010), build, `format:check` y `contracts:check` OK. Nota: una primera corrida completa falló 2 pruebas de `src/main.test.tsx` (configuración de entorno) por carga en paralelo; el archivo aislado y la segunda corrida completa pasan.
