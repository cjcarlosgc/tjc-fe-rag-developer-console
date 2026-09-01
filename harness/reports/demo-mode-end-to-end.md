# Evidencia de revisión — Modo demo end-to-end

**Historias:** HU01, HU03, HU04, HU06, HU11, HU13, HU14, HU16, HU19  
**Fecha:** 2026-08-31  
**Estado:** IN_REVIEW; demo completa, adapters live PENDING donde RAG Core no publicó contrato

## Alcance verificado

- `VITE_DATA_SOURCE=mock|live` selecciona la fuente detrás de los servicios.
- El modo mock está identificado permanentemente como `DEMO · DATOS SIMULADOS`.
- Escenario semilla coherente: proyecto, ProjectVersion, inventario y brechas.
- Transiciones asíncronas simuladas para indexación, generación y experimento.
- Recorrido completo de inventario a run, validación y artifacts descargables.
- Comparación RAG vs Baseline con tres repeticiones y huella de retrieval.
- Las métricas experimentales se presentan como narrativas, no como evidencia.
- Los contratos live confirmados permanecen conectados y los PENDING fallan de
  forma explícita, sin rutas HTTP especulativas.

## Verificación automática

- `npm run lint`: OK.
- `npm test`: OK, 15 archivos y 35 pruebas.
- `npm run build`: OK.
- `node scripts/sdd-check.mjs`: OK.
- `git diff --check`: OK.
- Prueba de integración del flujo público: el mock no invoca `fetch`.

## Verificación en navegador

- Proyectos demo visibles y navegables.
- Inventario con cinco targets `CLASS|METHOD|FUNCTION` y filtros de cobertura.
- Generación puntual de `calculateTotal`, progreso hasta `COMPLETED` y resultado
  válido.
- Artifacts CREATED/MODIFIED visibles; descarga individual y lote ZIP verificadas.
- Experimento RAG vs Baseline completado con métricas y huella de retrieval.
- Consola del navegador: cero errores y cero warnings.
