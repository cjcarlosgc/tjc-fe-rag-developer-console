# Progreso actual

Modo demo end-to-end en revisión. `VITE_DATA_SOURCE=mock` sirve un escenario
stateful y visible que enlaza proyectos, historial multiversión, indexación,
inventario por ProjectVersion, generación, progreso, validación, artifacts y
comparación RAG vs Agente generalista. Los componentes consumen los mismos servicios que
el modo live; el mock no realiza requests HTTP.

Los adapters live de ProjectVersion, resultados e inventario conservan los DTO
confirmados de RAG Core SDD 1.2. Generación, run, artifacts, experimentos y listado
de proyectos continúan explícitamente PENDING en live, sin inventar rutas. La
verificación final incluye 38 pruebas y recorrido manual en navegador sin errores
ni warnings de consola.
