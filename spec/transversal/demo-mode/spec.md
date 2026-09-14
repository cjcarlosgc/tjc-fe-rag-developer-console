# demo-mode — Especificación

> **Adaptación SDD 2.1:** los nuevos escenarios mock usan INTEROP-2.1 y el modelo Project/RepositoryBinding/PR/HEAD/AnalysisRun. El recorrido GitHub login/import anterior se conserva únicamente como legacy hasta HU44. `INTEROP-2.1` retira ZIP/generación manual como ruta de producto real (no como mock: los mocks de indexación, generación, artifacts e historial pueden seguir existiendo para desarrollo/experimentos, ver `harness/reports/console-interop-2.1-sync.md`), pero ya no deben presentarse como el flujo principal del producto.

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
- `VITE_AUTH_MODE=mock` proporciona una identidad demostrativa estable solo cuando la fuente de datos también es mock/local. La UI de correo puede recorrerse sin contactar Supabase.
- La trayectoria GitHub vigente parte de una GitHub App instalada y un repository binding mock; muestra PR/HEAD, AnalysisRun y companion PR. La importación ligada al login queda superseded.
- Toda superficie GitHub mock mantiene visible `DEMO · GITHUB SIMULADO`. La creación de PR modifica únicamente estado efímero en memoria: no ejecuta OAuth, no almacena tokens, no hace requests y no produce efectos externos.
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
