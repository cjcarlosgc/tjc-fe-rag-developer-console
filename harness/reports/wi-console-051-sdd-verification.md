# WI-CONSOLE-051 — verificación SDD

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Análisis breve del leader (sin sdd-analyst, precedentes WI-CONSOLE-039, 043 y 045: WI de espejo de contratos).

## Veredicto: SUFICIENTE

- Alcance aprobado por el usuario (`wi-console-051-scope-approval.md`). Criterios verificables por SHA-256 contra `git show 2318b9df:<ruta>` y `git archive 2318b9df spec/contracts/schemas`.
- `decisionGate`: ninguna `DEC` con `Blocks` alcanza este WI (la prosa de INTEROP-2.21 sobre reasoning/modelo es descriptiva; el 422 `REASONING_EFFORT_UNSUPPORTED`, `LLM_REASONING_EFFORT` y la regla de no degradar en silencio no cambian). `blockingDecisionIds` vacío.
- Contract Sync: `-003` (console) y `-004` (console, github-integration, sandbox) son relevantes; `-001` (github-integration) y `-002` (sandbox) no apuntan a Console.
- Riesgo de código: el esquema nuevo `github-webhook-event.schema.json` cambia `app/src/contracts/generated/` (solo tipos/esquemas generados, sin consumidores en Console). El ajuste opcional de `ExperimentResultsResponse` es un tipo local sin lectores de `analysisRunId`/`symbol` en producción; los fixtures de prueba deben incluir `targetId`.
- Pendiente anotado: `reasoningEffortMessage` (`app/src/control-plane/errors.ts`) atribuye el 422 al modelo; no se toca aquí.
