# Formalización de capacidades discutidas sin historia asignada (HU48–HU55)

**Estado:** DONE (registro; ninguna de las 8 historias está implementada)
**Repository:** `tjc-fe-rag-developer-console`

## Contexto

Al preguntar "¿cómo entro a un experimento desde un Run?" se confirmó que
esa capacidad no tenía HU en `spec/backlog.md` — era input crudo de
`~/Downloads/experimentos.md`, nunca formalizado. El usuario, preocupado de
que hubiera "otros casos así", pidió una auditoría completa antes de
planear implementación.

Un research en background leyó los ~20 archivos de `harness/reports/` y los
3 handoffs del usuario (`Handoff Frontend — Pantallas objetivo SDD 2.0.md`,
`experimentos.md`, `HANDOFF_FRONTEND_INDEX_SDD_2.0.md`), cruzándolos contra
el HU01–HU47 completo de `spec/backlog.md`. Encontró **7 capacidades**
discutidas como necesarias sin HU asignado (una de ellas, Experiments↔
AnalysisRun, se partió en 2 historias por tener dos entregas independientes
P1/P4) → **8 historias nuevas: HU48–HU55**.

Explícitamente NO cuentan como hallazgo cosas que ya tienen HU aunque no
estén implementadas (HU35/HU36 Core-side, HU44/HU45 P4) — esas ya estaban
correctamente registradas, solo pendientes de trabajo.

## Las 8 historias registradas

| HU | Prioridad | Título | Carpeta | Bloqueada por |
|---|---|---|---|---|
| HU48 | P1 | Run comparison desde un AnalysisRun existente | `014-analysisrun-experiments` (nueva) | Core no publica la forma `AnalysisRun`↔`ExperimentRun` |
| HU49 | P4 | Capture next PR (demo en vivo) | `014-analysisrun-experiments` | Depende de HU48 |
| HU50 | P1 | Indicador de cobertura previa en Run Detail | `013-pr-driven-control-plane` | `AnalysisRunDetailResponse` sin ese campo |
| HU51 | P1 | Detección de conflicto de Functional Knowledge en Focus Mode | `013-pr-driven-control-plane` | Core no expone esa señal |
| HU52 | P2 | "Runs que usaron esta regla" (FK Detail) | `013-pr-driven-control-plane` | No está en INTEROP-2.1 §6.11 |
| HU53 | P1 | Historial de transiciones de estado de un AnalysisRun | `013-pr-driven-control-plane` | Solo hay 3 timestamps reales en el contrato |
| HU54 | P1 | Context Explorer con nodos de conocimiento funcional/tests existentes | `011-context-explorer` | Sin forma de contrato para esto en `AnalysisRun` |
| HU55 | P1 | Listado global de Analysis Runs cross-proyecto | `013-pr-driven-control-plane` | Core solo implementa `GET /projects/{id}/analysis-runs`, sin ruta global |

Todas registradas con estado **`PROPOSED`** — se formaliza la historia, no
se aprueba alcance de implementación. Ninguna pasa a `SPEC_VERIFIED` real
hasta que se resuelva su bloqueador (todos son de contrato/Core, no de
diseño de Console).

## Archivos tocados

- `spec/backlog.md`: 8 filas nuevas + nota de que quedan pendientes de
  homologar en `tjc-be-rag-core-api`/`tjc-be-test-execution-sandbox` (el
  backlog es "compartido conceptualmente por los tres repositorios").
- `spec/features/014-analysisrun-experiments/` (nueva carpeta):
  `spec.md`/`plan.md`/`tasks.md` para HU48/HU49, con las reglas y
  restricciones textuales del handoff `experimentos.md` preservadas.
- `spec/features/008-experimental-mode/spec.md`: el callout ya existente
  sobre "P1/P4 posterior" ahora referencia HU48/HU49 y la carpeta 014 por
  nombre, en vez de quedar como referencia vaga.
- `spec/features/013-pr-driven-control-plane/spec.md`+`tasks.md`: Story IDs
  ampliados con HU50/51/52/53/55; nueva sección "Pendiente de implementar
  (PROPOSED)" con 1-2 líneas por historia y su bloqueador.
- `spec/features/011-context-explorer/spec.md`+`tasks.md`: mismo tratamiento
  para HU54.

## Explícitamente fuera de alcance de este corte

No se implementó ninguna de las 8 historias — puro registro/documentación,
cero cambios en `app/`. No se decidió orden de implementación (eso es la
conversación siguiente). No se homologó todavía con los repos de Core/
Sandbox — se avisa por mensaje cross-session, sin bloquear en su respuesta.

## Verificación

- Revisión visual de formato: cada `spec.md`/`tasks.md` sigue el patrón ya
  establecido en el repo (Estado/Historias/Objetivo/Reglas, callouts
  `PROPOSED` en el mismo estilo que `002-upload-analysis`).
- No aplica tsc/lint/test/build — no se tocó código.
