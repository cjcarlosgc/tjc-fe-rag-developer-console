# 003-test-inventory — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU06

## Objetivo

Visualizar objetivos testables y presencia/ausencia de pruebas existentes.

## Reglas y comportamiento

- Mostrar clases/métodos/funciones según datos del Core.
- Diferenciar con test/sin test.
- Permitir usar un target como punto de entrada a generación cuando aplique.
- Consumir `GET /project-versions/:projectVersionId/test-inventory` según [`../../contracts/rag-core-api.md`](../../contracts/rag-core-api.md).
- `targetType` es `CLASS|METHOD|FUNCTION`; `methodName` sólo aplica a `METHOD`.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
