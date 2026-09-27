# 003-test-inventory — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

Tree/table/filter simple, sin editor completo obligatorio. Mantener filePath/symbolName/methodName como identidad técnica visible cuando ayude.

## Validación

- Pruebas automatizadas para reglas determinísticas y contratos.
- Los DTO compartidos cubren `ProjectLanguage` y `TestFramework`, incluidos `PHP`/`PHPUNIT`, en historial e inventario.
- Con una respuesta `PHP`/`PHPUNIT`, la vista sigue siendo evidencia de cobertura y no ofrece ni afirma que la generación/ejecución esté lista antes de `WI-CORE-013`.
- Casos positivos, negativos y estados terminales relevantes.
- `lint`, `test` y `build` antes de cierre.
