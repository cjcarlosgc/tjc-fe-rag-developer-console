# AGENTS.md

Este repositorio usa Specification-Driven Development (SDD). Este archivo es deliberadamente breve y neutral respecto del proveedor de IA.

## Fuente de verdad

1. Leer `spec/README.md`.
2. Leer `spec/contracts/system-contract.md`, `spec/contracts/interoperability-contract.md`, `spec/constitution/project-context.md` y la constitución aplicable en `spec/constitution/`. `spec/constitution/delivery-workflow.md` es siempre aplicable para commits, revisión y push.
3. Leer `spec/backlog.md` para `storyIds`, sprint y prioridad.
4. Para trabajo funcional, leer el trío `spec.md` + `plan.md` + `tasks.md` de la feature y las especificaciones transversales referenciadas.
5. `spec/` contiene el comportamiento vigente. `CHANGELOG.md` conserva la historia; no reconstruir reglas actuales a partir de enmiendas antiguas.

## Reglas de trabajo

- Antes de tocar código de producto, seleccionar un `WI-<COMP>-<NNN>` local en `harness/work-items.json`, enlazado desde `ST-<COMP>-<NNN>` en el `tasks.md` dueño; ejecutar `node harness/validate-harness.mjs`. Las casillas y HU antiguas no son autorización de implementación.
- No inventar como cerrada una decisión marcada `PENDING` o `PROPOSED`.
- Antes de implementar, evaluar únicamente las decisiones cuyo campo `Blocks` alcance el work item activo y registrar el resultado en `decisionGate`.
- Un cambio funcional aprobado se consolida en la spec canónica y se registra en `CHANGELOG.md`.
- SDD 3.0 es la línea base solicitada para Core/Console; `planningBaseline` marca que Sandbox continúa en 2.1 y la homologación global sigue pendiente. No declarar ni publicar una línea base común de los tres antes de esa homologación. `SYSTEM-*` e `INTEROP-*` conservan versionado independiente.
- Mantener `storyIds`, `taskIds`, `component` y `sprint` en el WI activo; cada subtarea nueva de `tasks.md` enlaza un WI de `harness/work-items.json`.
- Implementar por cortes coherentes; dos desarrolladores pueden trabajar en paralelo.
- Cada commit debe ser un cambio coherente y declarar en el cuerpo `Refs: HU...` con todas las historias afectadas.
- No marcar una tarea como terminada sin evidencia verificable.
- Antes de declarar un WI terminado, el usuario es el reviewer técnico independiente por defecto; presenta diff y evidencia y espera su veredicto. Solo delega esa revisión a un agente si el usuario lo pide explícitamente. El implementer no puede autoaprobarse; la revisión delegada tampoco sustituye la aprobación humana de alcance/arquitectura. Para cambios UI se mantiene la revisión obligatoria de `ux-reviewer`.
- Antes de cerrar: lint, test y build; agregar pruebas para correcciones cuando sea viable.
- Antes de hacer push al cierre del sprint, el reviewer debe aprobar el rango completo que se publicará y registrar la evidencia de revisión.
- No hacer commit, push, PR, merge o cambios de infraestructura externa sin solicitud explícita.
- No almacenar secretos en el repositorio.

## Código

El código fuente generado vive exclusivamente en `app/`. La raíz contiene SDD, harness y adaptadores de agentes.

## Agentes

Los roles neutrales están en `harness/roles/`. Los perfiles de modelos están en `harness/agent-profiles.yaml`; los adaptadores específicos de proveedor no pueden redefinir la verdad funcional.
