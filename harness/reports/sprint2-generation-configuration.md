# Evidencia de revisión — Configuración de generación Sprint 2

**Historias:** HU08, HU09, HU10, HU11, HU12  
**Fecha:** 2026-08-31  
**Estado:** IN_REVIEW por contrato HTTP PENDING

## Alcance verificado

- Selector exclusivo para TARGET, CLASS_ALL, CLASS_MISSING, PROJECT_MISSING y PROJECT_ALL.
- TARGET requiere un target de método o función top-level.
- CLASS_* requiere contexto de clase o un método perteneciente a ella.
- PROJECT_* utiliza el proyecto y su versión actual sin requerir target.
- Los alcances masivos requieren confirmación explícita.
- El resumen muestra proyecto, estrategia RAG y contexto técnico.
- No se ofrece toggle RAG/baseline en el flujo normal.
- La configuración confirmada no dispara requests especulativos.
- La selección desde inventario se resuelve por `targetId` contra la ProjectVersion actual.

## Evidencia automatizada

- `npm run lint`: OK.
- `npm test`: OK, 12 archivos y 29 pruebas.
- `npm run build`: OK.
- `node scripts/sdd-check.mjs`: OK.
- `git diff --check`: OK.

## Bloqueo externo

RAG Core todavía no confirmó ruta, request DTO ni response 202 de generación.
Por ello el adapter, la creación de run y su navegación permanecen pendientes.
