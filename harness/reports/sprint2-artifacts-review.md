# Evidencia de revisión — Artifacts Sprint 2

**Historias:** HU15, HU16, HU17, HU18  
**Fecha:** 2026-08-30  
**Estado:** IN_REVIEW por contrato HTTP parcial

## Alcance verificado

- Bandeja y selección de artifacts por path.
- Etiquetas CREATED/MODIFIED y estado valid/invalid independientes.
- CREATED se presenta como archivo nuevo y no solicita diff.
- MODIFIED muestra líneas contextuales, agregadas y removidas con doble numeración.
- Estado vacío explícito.
- Controles de descarga individual y total presentes pero deshabilitados.
- View model separado de los DTO de transporte pendientes.

## Verificación

- `npm run lint`: OK.
- `npm test`: OK, 8 archivos y 20 pruebas.
- `npm run build`: OK.
- `node scripts/sdd-check.mjs`: OK.
- `git diff --check`: OK.

## Bloqueo externo

RAG Core aún no fijó rutas de listado, diff y descarga, content types ni filenames
vía headers. El frontend no reconstruye ZIP ni inventa esos contratos.
