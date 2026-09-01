# demo-mode — Plan

## Dependencias

- Contrato de RAG Core, api-client, async-state, testing y features demostradas.

## Diseño técnico

Selector de fuente centralizado. Cada módulo de dominio expone una API estable y delega en HTTP live o en un backend mock stateful en memoria. El escenario semilla incluye un proyecto indexado y permite crear proyectos, cargar versiones, generar runs y ejecutar experimentos durante la sesión.

Las capacidades sin contrato HTTP live lanzan un error de contrato pendiente sólo en modo `live`; en modo `mock` siguen el flujo demostrativo sin emitir requests.

## Validación

- Pruebas de que mock no invoca `fetch`.
- Pruebas de coherencia entre creación, indexación, inventario, run y artifacts.
- Pruebas de estados asíncronos y navegación.
- `lint`, `test`, `build` y SDD check.
