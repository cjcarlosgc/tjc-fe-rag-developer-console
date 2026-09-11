# 010-product-experience — Plan

## Dependencias

- Constitución y transversales aplicables.

## Diseño técnico

- Inventariar rutas/estados vigentes y migrarlos por capas al shell Black Glass sin alterar contratos de dominio.
- Construir primitives y patterns compartidos antes de migrar páginas: shell, navegación, cards, tablas, formularios, code/diff, dialogs, drawers, estados asíncronos y partículas.
- Usar los diseños aprobados de Stitch como referencia visual y verificar cada pantalla funcional contra la SDD.
- Implementar el recorrido GitHub simulado exclusivamente sobre el adapter demo en memoria; componentes de dominio no realizan llamadas externas.
- Mantener responsive desktop-first, accesibilidad y reduced motion desde los primitives.

## Validación

- Pruebas automatizadas de navegación, señalización demo y ausencia de requests GitHub en mock.
- Revisión visual de todas las rutas en desktop y viewport reducido.
- Auditoría de teclado, contraste y reduced motion.
- `lint`, `test`, `build` y SDD check antes de cierre.
