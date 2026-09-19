# accessibility — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

Auditar por ruta y por primitive: labels/errores, foco, headings, tablas, dialogs/drawers, contraste, targets, zoom, estados no basados solo en color y reduced motion. Para el explorador, mantener un árbol/listado semántico sincronizado con la selección visual.

## Validación

- Pruebas automatizadas de semántica, focus management y reduced motion.
- Recorrido manual solo-teclado, lector de pantalla básico, 200% zoom y contraste sobre glass.
- `lint`, `test`, `build` y SDD check antes de cierre.
