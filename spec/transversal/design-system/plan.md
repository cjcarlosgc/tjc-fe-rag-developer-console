# design-system — Plan

## Dependencias

- Product experience, accessibility, context explorer y authentication.

## Diseño técnico

- Definir variables CSS para color, tipografía, spacing, radios, elevación, glass y motion.
- Construir primitives accesibles y patterns de dominio antes de migrar páginas.
- Mantener colores RAG como variantes semánticas encapsuladas en el explorador.
- Implementar motion con CSS/animación desacoplada y fallback `prefers-reduced-motion`.
- Adaptar los conceptos de partículas con bajo costo de CPU/GPU y sin bloquear el hilo principal.

## Validación

- Galería de estados y contraste en fondos reales.
- Revisión responsive, teclado, zoom de navegador y reduced motion.
- Presupuesto de rendimiento para blur/partículas y ausencia de layout shift.
- `lint`, `test`, `build` y SDD check.
