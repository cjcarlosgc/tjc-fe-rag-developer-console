# Auditoría de alcance — Sprint 1 y Sprint 2

**Historias:** HU01–HU19  
**Fecha:** 2026-08-31  
**Resultado:** demo completa; integración live parcial por contratos RAG Core `PENDING`

## Cobertura funcional demo

| Historias | Capacidad | Evidencia |
|---|---|---|
| HU01 | Crear y abrir proyecto | Formulario, listado semilla y detalle navegable |
| HU02–HU07 | ZIP, validación, progreso, resultados, inventario y reindexación | Flujo stateful por ProjectVersion con estados intermedios y terminales |
| HU08–HU12 | Cinco modos de generación | `TARGET`, `CLASS_ALL`, `CLASS_MISSING`, `PROJECT_MISSING`, `PROJECT_ALL` probados |
| HU13–HU14 | Progreso y validación | Polling mock, estados terminales, resultados por target y fallos diferenciados |
| HU15–HU18 | Artifacts | CREATED/MODIFIED, diff, archivo individual y lote ZIP real |
| HU19 | RAG vs Baseline | Tres repeticiones, tasas, deltas, fallos, tokens, costo y retrieval |

## Estado live

Los contratos confirmados de RAG Core están conectados para crear/detallar
proyectos, cargar y consultar ProjectVersion, resultados de análisis e inventario.
Permanecen pendientes en RAG Core: listado de proyectos, creación/status/resultados
de generation run, artifacts/downloads y experimento. El frontend no inventa esas
rutas; devuelve un error de contrato pendiente y permite demostrar el mismo flujo
con `VITE_DATA_SOURCE=mock`.

## Correcciones derivadas de la auditoría

- HU18: se reemplazó el lote `.txt` por un ZIP real `application/zip`.
- HU19: tiempo, tokens y costo muestran delta absoluto y relativo.
- HU08–HU12: se agregó una prueba de integración que recorre los cinco modos.
- Se retiró el inicio accidental de Sprint 3; no quedaron rutas ni tipos de historial.

## Verificación

- `npm run lint`: OK.
- `npm test`: OK, 15 archivos y 35 pruebas.
- `npm run build`: OK.
- Prueba end-to-end de servicios mock: cero requests HTTP.
