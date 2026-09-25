# demo-mode — Especificación

Los escenarios mock siguen INTEROP-2.4 y el modelo Project/RepositoryBinding/PR/HEAD/AnalysisRun. El login GitHub permanece simulado y rotulado en modo demo. Los componentes de UI y estado reutilizables se aplican al flujo PR-driven; no se conserva un mock de producto separado para ZIP, generación manual, artefactos o historial manual.

**Estado:** aprobado.  
**Historias:** soporte transversal para demostración de HU01–HU18; un mock no prueba aceptación live.

## Objetivo

Permitir una demostración navegable end-to-end aunque RAG Core todavía no haya publicado todos sus contratos HTTP, sin confundir resultados simulados con resultados reales.

## Reglas y comportamiento

- `VITE_DATA_SOURCE=mock|live` selecciona una única fuente de datos por ejecución; el valor por defecto para la demo es `mock`.
- La interfaz muestra de forma persistente y visible cuando usa datos simulados.
- Componentes y páginas consumen servicios/adapters; no contienen datasets mock ni bifurcaciones de transporte.
- Los adapters `live` conservan solo los contratos vigentes de [`../../contracts/system-contract.md`](../../contracts/system-contract.md) y [`../../contracts/interoperability-contract.md`](../../contracts/interoperability-contract.md).
- Los adapters `mock` simulan proyectos, RepositoryBinding, PR/HEAD, AnalysisRun, Action Required, propuestas, pruebas publicadas, trazas disponibles y comparación experimental de forma coherente entre pantallas. No simulan como flujo de producto una subida ZIP, una generación o un test-run manual, ni una descarga agrupada de artefactos legacy.
- El escenario experimental puede incluir candidatos RAG descartados, snippets acotados, trayectoria del agente y archivos descubiertos paginados solo donde existe contrato de traza vigente; no inventa un endpoint de trazas de `test-runs`.
- El escenario de workspaces incluye la cuenta personal y una organización ficticia con varios Projects, roles distintos y Analysis Runs/Action Required coherentes para demostrar selección, visibilidad y acciones permitidas. Ninguna identidad, membresía ni rol simulado se presenta como dato de GitHub real.
- `VITE_AUTH_MODE=mock` proporciona una identidad demostrativa GitHub estable solo cuando la fuente de datos también es mock/local. El CTA «Continuar con GitHub» puede recorrerse sin contactar Supabase ni GitHub; no hay UI de correo/contraseña. El mock no simula `GITHUB_IDENTITY_REQUIRED` ni `IDENTITY_UNAVAILABLE` como si fueran Core.
- La trayectoria GitHub mock sigue INTEROP-2.4: discovery de repositorios limitado al workspace, validación `AUTHORIZED|NOT_AUTHORIZED`, ramas y RepositoryBinding; muestra PR/HEAD, AnalysisRun y companion PR.
- Toda superficie GitHub mock mantiene visible `DEMO · GITHUB SIMULADO`. No ejecuta OAuth ni almacena tokens; representa el provider token únicamente como precondición de sesión y no produce efectos externos.
- El modo mock no abre transporte HTTP ni WebSocket; simula el avance asíncrono localmente. No prueba el transporte de tiempo real de Core.
- Las operaciones asíncronas mock atraviesan estados intermedios antes de finalizar, respetan cancelación del consumidor y ofrecen estados terminales. Las transiciones respetan reduced motion.
- El modo mock no realiza requests HTTP y no convierte rutas backend `PENDING` en contratos reales.
- Los identificadores, métricas, errores y artifacts simulados deben estar claramente presentados como demostrativos.
- Los datos mock no pueden exportarse, mezclarse ni contabilizarse como evidencia experimental o de validación en empresa.
- Cambiar a `live` no debe requerir reescribir componentes; sólo cambia la selección del adapter.

## Fuera de alcance

- El mock no pretende reproducir performance, seguridad ni exactitud estadística del backend.
- La persistencia del escenario entre recargas no es obligatoria.
- Los contratos mock para capacidades backend `PENDING` no son autoridad para implementar RAG Core.
- La integración GitHub real y la verificación de permisos organizacionales permanecen fuera del mock; los roles y workspaces de demostración son fixtures locales. Su contrato productivo pertenece a Core.
