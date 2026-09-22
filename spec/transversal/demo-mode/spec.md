# demo-mode — Especificación

> **Adaptación SDD 2.2:** los escenarios mock usan INTEROP-2.2 y el modelo Project/RepositoryBinding/PR/HEAD/AnalysisRun. El recorrido GitHub login/import está retirado. Los componentes de UI y estado que eran reutilizables se aplican únicamente al flujo PR-driven; no se conserva un mock de producto separado para ZIP, generación manual, artefactos o historial manual.

**Estado:** aprobado.  
**Historias:** soporte transversal para demostración de HU01-HU20, HU24, HU26-HU29

## Objetivo

Permitir una demostración navegable end-to-end aunque RAG Core todavía no haya publicado todos sus contratos HTTP, sin confundir resultados simulados con resultados reales.

## Reglas y comportamiento

- `VITE_DATA_SOURCE=mock|live` selecciona una única fuente de datos por ejecución; el valor por defecto para la demo es `mock`.
- La interfaz muestra de forma persistente y visible cuando usa datos simulados.
- Componentes y páginas consumen servicios/adapters; no contienen datasets mock ni bifurcaciones de transporte.
- Los adapters `live` conservan los contratos de [`../../contracts/rag-core-api.md`](../../contracts/rag-core-api.md).
- Los adapters `mock` simulan proyectos, múltiples ProjectVersions, indexación,
  inventario por versión, generación, validación, artifacts, comparación RAG vs
  agente generalista, historial de generaciones por ProjectVersion (HU20) y
  reintento manual de un target inválido/fallido (HU24) de forma coherente entre pantallas.
- El escenario incluye trazas RAG y del agente conformes a `INTEROP-2.1`, incluidos candidatos descartados, intentos anteriores, snippets acotados y archivos descubiertos paginados. El endpoint de trazas run-scoped (HU27 sobre `test-runs`) quedó retirado junto con la generación manual; solo sobrevive el de trazas por `experiments`.
- `VITE_AUTH_MODE=mock` proporciona una identidad demostrativa GitHub estable solo cuando la fuente de datos también es mock/local. El CTA «Continuar con GitHub» puede recorrerse sin contactar Supabase ni GitHub; no hay UI de correo/contraseña (HU62). El mock no simula `GITHUB_IDENTITY_REQUIRED` ni `IDENTITY_UNAVAILABLE` como si fueran Core.
- La trayectoria GitHub mock sigue INTEROP-2.2: discovery de repositorios, validación `AUTHORIZED|NOT_AUTHORIZED`, ramas y RepositoryBinding; muestra PR/HEAD, AnalysisRun y companion PR.
- Toda superficie GitHub mock mantiene visible `DEMO · GITHUB SIMULADO`. No ejecuta OAuth ni almacena tokens; representa el provider token únicamente como precondición de sesión y no produce efectos externos.
- HU21/HU22 (progreso en tiempo real por WebSocket) no forman parte del mock: el
  modo mock no abre transporte de ningún tipo (HTTP ni WebSocket) y su polling ya
  simula el avance sin necesitar el complemento en tiempo real.
- Las operaciones asíncronas mock atraviesan estados intermedios antes de finalizar, respetan cancelación del consumidor y ofrecen estados terminales. Las transiciones respetan reduced motion.
- El modo mock no realiza requests HTTP y no convierte rutas backend `PENDING` en contratos reales.
- Los identificadores, métricas, errores y artifacts simulados deben estar claramente presentados como demostrativos.
- Los datos mock no pueden exportarse, mezclarse ni contabilizarse como evidencia experimental o de validación en empresa.
- Cambiar a `live` no debe requerir reescribir componentes; sólo cambia la selección del adapter.

## Fuera de alcance

- El mock no pretende reproducir performance, seguridad ni exactitud estadística del backend.
- La persistencia del escenario entre recargas no es obligatoria.
- Los contratos mock para capacidades backend `PENDING` no son autoridad para implementar RAG Core.
- La integración GitHub real y los permisos organizacionales permanecen fuera del mock; su contrato productivo pertenece a Core.
