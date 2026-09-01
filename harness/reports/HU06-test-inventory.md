# Evidencia de revisión — HU06

**Fecha:** 2026-08-31  
**Estado:** DONE

## Implementado

- Ruta de inventario bajo el contexto del proyecto.
- View model local separado de cualquier DTO de transporte.
- Tabla semántica con identidad técnica visible.
- Búsqueda por path, símbolo o método.
- Filtros `Todos`, `Sin test` y `Con test`.
- Adapter para `GET /project-versions/:id/test-inventory` y mapeo DTO → view model.
- Resumen de framework y cobertura agregada.
- Selección de target conectada a generación mediante `targetId`.
- Estados loading, error y proyecto sin versión actual.

## Verificación

- `npm run lint`: OK.
- `npm test`: OK, 12 archivos y 29 pruebas totales.
- `npm run build`: OK.
- `node scripts/sdd-check.mjs`: OK.
- `git diff --check`: OK.

## Contrato aplicado

RAG Core SDD 1.2 implementa el inventario con targets `CLASS|METHOD|FUNCTION`.
El modo puntual se alinea como `TARGET` y admite METHOD o FUNCTION.
