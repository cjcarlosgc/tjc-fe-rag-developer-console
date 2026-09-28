# demo-mode — Plan

## Dependencias

- Contrato de RAG Core, api-client, async-state, testing y features demostradas.

## Diseño técnico

Selector de fuente centralizado. Cada módulo de dominio expone una API estable y delega en HTTP live o en un backend mock stateful en memoria. El escenario semilla incluye un proyecto con repositorio vinculado y permite explorar AnalysisRuns, Action Required, propuestas y experimentos ligados a Runs durante la sesión.

Las capacidades sin contrato HTTP live lanzan un error de contrato pendiente solo en modo `live`; en modo `mock` siguen el flujo demostrativo sin emitir requests. Auth mock y fuente mock se coordinan para evitar credenciales ficticias contra Core.

El dominio GitHub simulado reside en un adapter separado con repositorios, ramas y PR en memoria. Ningún componente importa un SDK GitHub ni reutiliza nombres que hagan pasar esa simulación por integración real.

## Validación

- Pruebas de que mock no invoca `fetch`.
- Pruebas de coherencia entre binding, AnalysisRun, inventario, propuestas y publicación.
- Pruebas de estados asíncronos y navegación.
- Pruebas de auth mock, trazas y recorrido GitHub; verificar que no se invoca Supabase, Core ni GitHub.
- `lint`, `test`, `build` y SDD check.
