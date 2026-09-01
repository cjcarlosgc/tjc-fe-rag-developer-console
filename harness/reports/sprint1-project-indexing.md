# Evidencia de revisión — Gestión e indexación Sprint 1

**Historias:** HU01, HU02, HU03, HU04, HU05, HU07  
**Fecha:** 2026-08-31  
**Estado:** DONE

## Alcance verificado

- Landing, creación y detalle de Project; el listado remoto permanece fuera del contrato disponible.
- Carga de ZIP con selección, drag and drop y validación preventiva.
- Errores estructurados para ZIP inválido, tamaño y proyecto incompatible.
- Manejo de aceptación 202 y seguimiento de operación.
- Polling que usa `pollAfterMs`, termina en COMPLETED/FAILED y se cancela al desmontar.
- Status tipado y resumen de ProjectVersion con framework, archivos, chunks y cobertura agregada.
- Nueva carga crea un flujo de versión independiente sin mutar la versión anterior.
- Correlation ID visible cuando RAG Core lo entrega.

## Evidencia automatizada

- `npm run lint`: OK.
- `npm test`: OK, 12 archivos y 29 pruebas.
- `npm run build`: OK.
- `node scripts/sdd-check.mjs`: OK.
- `git diff --check`: OK.

## Contrato aún no disponible

`GET /projects` continúa PENDING en RAG Core. La UI no lo consulta ni acepta
shapes alternativos; creación, detalle e indexación no dependen de ese listado.
