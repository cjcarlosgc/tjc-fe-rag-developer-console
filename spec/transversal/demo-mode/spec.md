# demo-mode — Especificación

**Estado:** aprobado.  
**Historias:** soporte transversal para demostración de HU01-HU19

## Objetivo

Permitir una demostración navegable end-to-end aunque RAG Core todavía no haya publicado todos sus contratos HTTP, sin confundir resultados simulados con resultados reales.

## Reglas y comportamiento

- `VITE_DATA_SOURCE=mock|live` selecciona una única fuente de datos por ejecución; el valor por defecto para la demo es `mock`.
- La interfaz muestra de forma persistente y visible cuando usa datos simulados.
- Componentes y páginas consumen servicios/adapters; no contienen datasets mock ni bifurcaciones de transporte.
- Los adapters `live` conservan los contratos de [`../../contracts/rag-core-api.md`](../../contracts/rag-core-api.md).
- Los adapters `mock` simulan proyectos, múltiples ProjectVersions, indexación,
  inventario por versión, generación, validación, artifacts y comparación RAG vs
  agente generalista de forma coherente entre pantallas.
- Las operaciones asíncronas mock atraviesan estados intermedios antes de finalizar, respetan cancelación del consumidor y ofrecen estados terminales.
- El modo mock no realiza requests HTTP y no convierte rutas backend `PENDING` en contratos reales.
- Los identificadores, métricas, errores y artifacts simulados deben estar claramente presentados como demostrativos.
- Los datos mock no pueden exportarse, mezclarse ni contabilizarse como evidencia experimental o de validación en empresa.
- Cambiar a `live` no debe requerir reescribir componentes; sólo cambia la selección del adapter.

## Fuera de alcance

- El mock no pretende reproducir performance, seguridad ni exactitud estadística del backend.
- La persistencia del escenario entre recargas no es obligatoria.
- Los contratos mock para capacidades backend `PENDING` no son autoridad para implementar RAG Core.
