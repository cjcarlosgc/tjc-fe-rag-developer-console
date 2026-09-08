# design-system — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** capacidad técnica transversal

## Objetivo

Mantener coherencia visual de una consola técnica orientada a desarrolladores.

## Reglas y comportamiento

- El tema vigente es **oscuro**. La paleta de color, tipografía y escalas de spacing/radio vigentes son las definidas en [`plan.md`](plan.md) ("Diseño técnico"); ningún componente introduce colores, tamaños de texto o espaciados fuera de ese conjunto.
- Los estados (éxito, error, advertencia, pendiente) no dependen solo del color; se refuerzan con texto o ícono.
- La tipografía primaria (root `font-family` en `app/src/styles.css`) y su escala documentada se preservan tal como están definidas; no se aproximan valores.
- El texto principal (root `color`) y el fondo de página (root `background`) no se sustituyen por neutros arbitrarios ajenos a la familia índigo/violeta adoptada.
- Los colores de estado (ámbar para advertencia/demo, rojo para error/inválido) son independientes de la paleta de marca y no se recolorean junto con ella.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
- Componentes de landing/marketing (hero editorial, pricing, footer de marketing, banda CTA) y los tokens que solo servían a esos componentes (`--color-surface-teal-deep`, `--color-surface-teal-mid`, escala `display-*`, spacing `huge`) no aplican a la consola y quedan fuera de esta spec.
