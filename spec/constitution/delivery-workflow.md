# Entrega y trazabilidad Git

**Estado:** APROBADO
**Alcance:** RAG Core API, Developer Console y Test Execution Sandbox

## Versión SDD conjunta

- `sddVersion` identifica la línea base consolidada de toda la solución, no una versión local independiente de cada repositorio.
- La transición de planificación y Harness se hace primero en Core y Console con `sddVersion: 3.0` por decisión del usuario; Sandbox permanece intacto en 2.1 mientras otro desarrollador trabaja en PHP. `planningBaseline: 2026-09-24-core-console-transition` identifica esta adopción parcial, no compatibilidad desplegada ni homologación global.
- SDD 3.0 no se declara ni publica como línea base común de toda la solución hasta homologar Sandbox. El cuarto componente se incorpora a ese proceso una vez exista un contrato aprobado.
- `SYSTEM-*` e `INTEROP-*` mantienen versionado propio y solo cambian cuando cambia su contrato correspondiente.

## Unidad de commit

- Un commit representa un cambio coherente, revisable y verificable; no equivale mecánicamente a una HU.
- Una HU puede requerir varios commits y un commit puede abarcar varias HU cuando el corte sea realmente transversal.
- El commit no debe mezclar cambios independientes solo para reducir la cantidad de commits y debe dejar el repositorio en un estado verificable.

## Trazabilidad obligatoria

Todo commit creado por el equipo o por un agente debe usar un asunto compatible con Conventional Commits y declarar en el cuerpo todas las HU afectadas:

```text
<type>(<scope>): <resultado observable>

Refs: HUxx[, HUyy...]
```

- Los IDs de `Refs` deben existir en `spec/backlog.md`.
- Un cambio de SDD, arquitectura, refactor o infraestructura también referencia las HU cuyo diseño, implementación o verificación afecta.
- Si el cambio responde a decisiones, puede agregar `Decisions: DEC-...`; esa línea no sustituye `Refs`.
- Si no es posible identificar una HU afectada, el cambio debe asociarse primero a un work item del backlog; no se inventan IDs ni se hace el commit sin trazabilidad.

## Revisión

La entrega tiene dos niveles de revisión:

1. **Revisión del work item:** el estado `IN_REVIEW` verifica el corte de una o más HU antes de `DONE`, según `harness/WORKFLOW.md`.
2. **Revisión consolidada del sprint:** antes de cualquier push, el reviewer revisa de forma independiente el rango completo de commits que se pretende publicar, no solo cada commit por separado.

La revisión consolidada comprueba como mínimo:

- coherencia y trazabilidad `Refs` de cada commit;
- correspondencia del diff acumulado con las HU y specs aprobadas;
- ausencia de decisiones bloqueantes o ampliaciones silenciosas de alcance;
- pruebas, lint y build aplicables en verde;
- manejo de errores, seguridad, observabilidad y limpieza;
- resolución y nueva revisión de cualquier hallazgo.

El resultado se registra en `harness/reports/sprint-<N>-review.md` con el rango o commit final revisado, HU incluidas, verificaciones ejecutadas, hallazgos y veredicto `APPROVED` o `CHANGES_REQUESTED`. Para una entrega extraordinaria fuera del cierre se usa `harness/reports/delivery-<scope>-review.md`.

El reporte puede incorporarse después de la aprobación mediante un commit exclusivo de evidencia `docs(review): ...`. Esa única diferencia no invalida el veredicto si el reviewer comprueba antes del push que el commit solo modifica los reportes declarados y conserva las mismas HU; cualquier otro cambio sí exige repetir la revisión completa.

## Puerta de push

- Por defecto se realiza un push por repositorio al cierre de cada sprint.
- Solo puede publicarse el commit final exacto que recibió veredicto `APPROVED`, salvo el commit exclusivo de evidencia definido arriba; cualquier otro cambio posterior invalida la aprobación y requiere una nueva revisión.
- No se hace push con hallazgos abiertos, verificaciones requeridas fallidas ni cambios relevantes sin revisar.
- Un push extraordinario antes del cierre del sprint requiere autorización humana explícita y debe superar la misma revisión previa.
- En Console, el agente no crea commits sin solicitud explícita del usuario, conforme a `AGENTS.md`. Cuando se autorice, cada commit será un corte lógico y verificable; `push` exige otra solicitud explícita, incluso al cierre del sprint.
