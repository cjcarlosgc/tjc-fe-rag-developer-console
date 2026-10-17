# WI-CONSOLE-026 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-12
**Autoriza:** usuario (Human Reviewer), en el chat.

Pregunta del leader: «¿confirmas A o B, y aprobamos en este chat el alcance de ese WI mínimo (las tres decisiones, el proyecto demo PHP fuera)?». Respuesta literal del usuario: «B». Confirmación posterior del usuario: «sí, aplica la opción 1».

## Alcance aprobado

1. `EXPERIMENT_WORKER_LOST`: cambiar el texto para no prometer reanudación (p. ej. «El experimento se interrumpió; vuelve a crearlo.») y actualizar sus pruebas. Hoy `app/src/experiments/failureMessages.ts` dice «Se interrumpió el procesamiento y puede reanudarse.» y `ExperimentPage.test.tsx` lo asserta.
2. `UNSUPPORTED_PROJECT`: un solo texto claro para experimentos y OE2 (retrieval-comparison), sin variantes, con una única fuente compartida.
3. Mock: omitir las filas `attempt` y `technicallyEvaluable` en corridas antiguas (previas a OE5), sin mostrar `1`/`false` inventados; donde el dato no exista se omite la fila, no se muestra «no disponible» salvo que la spec lo pida.

## Fuera de alcance

- El proyecto DEMO PHP propio: queda en el backlog y no está incluido en este WI.
- Contratos, DTO, API, adapters live y cualquier cambio de comportamiento.
- Esta aprobación no cubre commit de código, push, PR, merge ni despliegue.

La revisión técnica independiente de este WI la hace el usuario (`human-reviewer`); no se delega al agente `reviewer`.
