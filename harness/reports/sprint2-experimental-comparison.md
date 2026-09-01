# Evidencia de revisión — RAG vs Baseline

**Historia:** HU19  
**Fecha:** 2026-08-30  
**Estado:** IN_REVIEW por contrato HTTP PENDING

## Alcance verificado

- Sección etiquetada visiblemente como Modo experimental.
- Única capacidad V1: Comparar RAG vs Baseline.
- Indicación de tres repeticiones por estrategia y exclusión de autorepair.
- Comparación de valid, compilación, ejecución y passed con delta en pp.
- Comparación de tiempos, tokens y costo marcado como estimado.
- Distribución visual de failureType.
- Panel explicativo exclusivo de RAG para chunks y context tokens.
- Tabla expandible por target, estrategia y repetición.
- No se muestran métricas de coverage no aprobadas.

## Verificación

- `npm run lint`: OK.
- `npm test`: OK, 9 archivos y 23 pruebas.
- `npm run build`: OK.
- `node scripts/sdd-check.mjs`: OK.
- `git diff --check`: OK.

## Bloqueo externo

RAG Core aún no definió rutas, DTO ni estados del experimento. La creación y el
progreso permanecen deshabilitados; no se producen resultados simulados.
