# Evidencia de revisión — HU01

**Fecha:** 2026-08-30  
**Estado:** IN_REVIEW

## Alcance verificado

- SPA React/TypeScript con navegación de listado a detalle de proyecto.
- Formulario accesible de creación con validación de nombre vacío.
- Estados explícitos de carga, vacío y error con reintento.
- Estado remoto aislado en TanStack Query y cliente HTTP centralizado.
- Project y ProjectVersion representados como entidades distintas.
- URL de RAG Core configurable mediante `VITE_CORE_API_URL`.

## Evidencia automatizada

- `npm run lint`: OK.
- `npm test`: OK, 1 archivo y 3 pruebas.
- `npm run build`: OK, build de producción generado por Vite.
- `node scripts/sdd-check.mjs`: OK.
- `git diff --check`: OK.

## Estado del contrato

`POST /projects` y `GET /projects/:id` fueron contrastados y alineados con RAG
Core. `GET /projects` no existe todavía; la landing no realiza ese request.
