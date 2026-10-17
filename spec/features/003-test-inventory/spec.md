# 003-test-inventory — Especificación

**Estado:** el inventario por versión interna apoya HU04; no es un selector de generación manual.
**Historias:** HU04

## Objetivo

Visualizar objetivos testables y presencia/ausencia de pruebas existentes.

## Reglas y comportamiento

- Mostrar clases/métodos/funciones según datos del Core.
- Diferenciar con test/sin test.
- Representar el lenguaje de la `ProjectVersion` (`TYPESCRIPT|PHP`) y el framework detectado (`JEST|VITEST|PHPUNIT`) conforme al contrato vigente.
- `PHPUNIT` confirma detección del inventario, no disponibilidad de generación o ejecución. La Console no infiere readiness a partir de `language` o `detectedFramework`; esa capacidad no se presenta antes de que Core la publique en `WI-CORE-013`.
- Mostrar la asociación de tests existentes como evidencia del `AnalysisRun`; no iniciar generación manual desde un target.
- Consumir `GET /project-versions/{projectVersionId}/test-inventory` solo si el contrato vigente lo mantiene para la versión interna asociada al Run; no inferir una versión subida por el usuario.
- `targetType` es `CLASS|METHOD|FUNCTION`; `methodName` sólo aplica a `METHOD`.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
