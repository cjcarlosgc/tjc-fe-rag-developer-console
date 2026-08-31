# 007-artifacts — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU15, HU16, HU17, HU18

## Objetivo

Revisar artifacts creados/modificados, diff y descargas.

## Reglas y comportamiento

- Etiqueta CREATED/MODIFIED y valid state.
- MODIFIED permite diff; CREATED no solicita diff y se muestra como archivo nuevo.
- Download individual y download all.
- Respetar filenames devueltos por servidor.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
