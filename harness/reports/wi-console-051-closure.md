# WI-CONSOLE-051 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Estado:** W-DONE. Espeja en un solo paso INTEROP-2.21 (`7f946d55b24cf13dad180927108cf777b8dde036ce2185d37590e6c072d0d29d`), SYSTEM-2.16 (`d0a492b4484c8883d65e709f76d8c7ff2462b0eb8c832649cf75723b9543ea77`), GH-INTEROP-1.9 (`dedf00fa2f0f5be928cfaf1e5a12ff19f96e7579524a0a689757f1077bfc6e4e`) y el árbol `spec/contracts/schemas` (`8079ab73887e3a74b2dba57fa5ae5c146e47eb21231f9965718a85a3a2619718`) desde Core `2318b9df292b337db4998f04b66b0457f1df8e3f` (git show/git archive), sin pasar por 2.20/2.15. Digests intermedios de `208c3bdf` cruzados (INTEROP-2.20 `f0b39578…`, SYSTEM-2.15 `f3b61da5…`; GH y schemas idénticos). `generated/` regenerado con el esquema nuevo; `contracts:check` limpio. Tipo `ExperimentResultsResponse` alineado con INTEROP-2.20 con prueba mínima, sin cambio de comportamiento. Sin cambio de UI, rutas, DTOs de producto ni realtime.

Contract Sync: `CS-CORE-20261024-003` y `-004` acusados y resueltos; `-004` supera a `CS-CORE-20261021-001..004` y `20261024-001..003` en INTEROP/SYSTEM; `-001` (github-integration) y `-002` (sandbox) no apuntan a Console. Cuatro checkpoints grabados.

Revisiones: contract-reviewer APPROVED (ciclo único); reviewer APPROVED en el ciclo 1 (0 bloqueantes). Gates: validadores y lint, `tsc -b --noEmit`, 94 archivos y 964 pruebas, build, format:check y contracts:check, reproducidos por el reviewer y por el leader.

Pendientes: (1) `reasoningEffortMessage` (`app/src/control-plane/errors.ts`) atribuye el 422 `REASONING_EFFORT_UNSUPPORTED` al modelo; la prosa de INTEROP-2.21 presenta reasoning como comportamiento del adaptador: WI aparte con aprobación de alcance. (2) Comentarios de código `INTEROP-2.18/2.19 §…` conservados (secciones vigentes en 2.21).
