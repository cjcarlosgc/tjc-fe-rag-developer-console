# Evidencia de revisión — Historial de análisis demo

**Historia:** HU07  
**Fecha:** 2026-09-01  
**Estado:** DONE; demo completa. Adapter live de listado de versiones (`INTEROP-1.1`) queda fuera de esta tarea: bloqueado por backend, no aplicable hasta que RAG Core publique la ruta.

## Alcance verificado

- `checkout-service` conserva v5, v6 y v7 como ProjectVersions completadas.
- El acceso principal se denomina `Historial de análisis`, evitando confusión con
  el historial de generation runs de Sprint 3.
- La timeline ordena versiones por fecha, identifica la actual y presenta
  archivos, chunks, targets y cobertura existente.
- Cada ProjectVersion abre su propio inventario.
- Los snapshots anteriores se identifican como históricos y de sólo lectura;
  generación continúa usando `currentVersionId`.
- Una nueva indexación se incorpora al historial y pasa a ser la versión actual.
- El adapter live falla explícitamente como contrato pendiente y no inventa ruta.

## Verificación

- `npm run lint`: OK.
- `npm test`: OK, 16 archivos y 38 pruebas.
- `npm run build`: OK.
- `node scripts/sdd-check.mjs`: OK.
- `git diff --check`: OK.
- Navegador: tres versiones, inventario histórico y navegación correctos.
- Consola del navegador: cero errores y cero warnings.
