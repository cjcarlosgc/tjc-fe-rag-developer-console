# Roadmap de Console

La planificación de producto conserva las seis épicas y 18 HU fijas de `spec/backlog.md`. Los sprints S1–S4 son referencias para conversar con la planificación de la tesis, no certifican que la implementación o aceptación ya ocurrió. La ejecución real se selecciona por subtareas y work items locales con dependencias explícitas.

| Sprint de referencia | Objetivo de producto | HU | Incremento esperado |
| --- | --- | --- | --- |
| S1 | Representar un repositorio vinculado de manera semántico-estructural. | HU01–HU04 | Proyecto, binding, snapshot por commit, índice y tests existentes. |
| S2 | Generar y validar pruebas con contexto técnico. | HU05, HU10–HU12 | Retrieval, Context Builder, generación, Sandbox y evidencia. |
| S3 | Analizar cambios de PR con conocimiento funcional cuando haga falta. | HU06–HU08, HU13–HU14 | AnalysisRun, impacto, Action Required, clasificación y Check. |
| S4 | Consolidar operación y evaluación reproducible. | HU09, HU15–HU18 | Trace, publicación controlada y comparación experimental. |

## Cortes de transición actuales

1. `WI-CONSOLE-001` (P0, cerrado localmente): reordenar SDD/Harness, IDs, estados, gates y contratos sin asumir aceptación de HU antiguas.
2. `WI-CONSOLE-002` (P0, después del 001): retirar carga manual de código ZIP y descarga legacy de artefactos. Conservar snapshot ZIP interno y datos activos; migración/purga solo con inventario y respaldo.
3. `WI-CONSOLE-003` (P1, después de 001/002): establecer la frontera con `tjc-be-github-integration-api`. Actualizar clientes y pantallas solo si el contrato aprobado lo requiere; la Console no accede directamente a GitHub para automatización.
4. `WI-CONSOLE-004` (P2): formalizar OC01–OC15, happy paths primero y subcasos después. El catálogo de nombres no equivale a cobertura validada.

## Backlog técnico P2, no seleccionado

- `WI-CONSOLE-005`: consolidación visual de la interfaz vigente (HU01/HU12/HU14).
- `WI-CONSOLE-006`: accesibilidad tras el sistema visual (HU01/HU12/HU14).
- `WI-CONSOLE-007`: errores y notificaciones coherentes (HU01/HU12/HU14).

Estos cortes proceden del triage de casillas antiguas, no se ejecutan automáticamente y pueden repriorizarse sin abrir nuevas HU. Las pruebas de calidad genéricas permanecen en los gates del Harness.

Los WIs de componentes distintos pueden avanzar en paralelo si `dependsOn` y los contratos lo permiten; el Harness actual admite solo un WI activo por repositorio y sí permite agentes paralelos dentro de ese WI. No se abren nuevas épicas/HU por defecto. Mutation testing se descartó para este alcance. Sandbox conserva su SDD/Harness actual mientras el compañero implementa PHP; se homologará en un corte posterior coordinado.
