# design-system — Especificación

**Estado:** aprobado para implementar.
**Historias:** HU25, HU26, HU27, HU28, HU29

## Objetivo

Definir una identidad visual Black Glass coherente para toda la consola RAG Test Studio: técnica, sobria, vanguardista y legible, sin apariencia de plantilla genérica.

## Fundamentos visuales

- Canvas negro `#050506`; superficies opacas `#0B0B0D` y `#101014`.
- Texto principal `#EAE7F7`, secundario `#BCBAC9`, borde `#2C2748`.
- Marca violeta: acento `#C9B4FA` y fondo acentuado `#17083B`.
- Vidrio base `rgba(18, 16, 24, 0.62)`, `backdrop-filter: blur(24px)`, borde fino y highlight interior. El blur se reserva para shell, overlays, drawer y superficies elevadas; no cubre cada card.
- Headlines: Space Grotesk; UI/cuerpo: Geist; código/datos: JetBrains Mono. Cada familia declara fallbacks distribuibles.
- Radios, spacing y densidad se centralizan como tokens; ningún feature introduce colores, fuentes o tiempos arbitrarios.

## Semántica de color

- Violeta/lavanda es marca, interacción y trayectoria del agente.
- Amarillo `#F2C94C` es señal semántica RAG.
- Turquesa `#34D6D3` es señal estructural RAG.
- Blanco es selección/foco en el grafo. Una coincidencia dual usa núcleo amarillo y anillo turquesa.
- Éxito, advertencia, error, pendiente y demo conservan colores de estado independientes y siempre incluyen texto o icono.
- Los colores del explorador son datos, no decoración global; fuera del grafo se usan solo en leyendas/chips que expresan esa misma semántica.

## Componentes y composición

- Shell, topbar y navegación preservan amplitud, jerarquía y superficies negras; el contenido técnico tiene prioridad sobre glow o vidrio.
- Cards y paneles usan profundidad por contraste, borde y sombra suave. Evitar mosaicos uniformes, gradientes indiscriminados y halos en todos los elementos.
- Formularios, tablas, métricas, code/diff, dialogs, drawers, tooltips y estados asíncronos comparten primitives.
- El drawer de detalle del explorador es liquid glass y mantiene contraste sobre el canvas.
- La vista de grafo es horizontal, respirada y con conectores orgánicos; todo camino termina en un nodo o grupo visible.

## Movimiento

- Hover/focus: 180 ms; drawer: 220 ms con slide/crossfade; aparición/reorganización de nodos: 240–420 ms.
- Easing preferido: `cubic-bezier(0.22, 1, 0.36, 1)`.
- Ingesta puede usar una constelación discreta; generación, una forma orbital; espera genérica, una nube granular. Son conceptos adaptados, no reproducción literal de los GIF de referencia.
- Las animaciones comunican progreso/relación y no bloquean interacción. No se fuerzan las tres en una misma pantalla.
- Con `prefers-reduced-motion: reduce` se eliminan órbita, partículas y traslaciones; solo queda crossfade de máximo 120 ms.
- Implementación (`app/src/ui/Loaders.tsx`): constelación → `ConstellationIcon` (ingesta/análisis de una ProjectVersion, `AnalysisProgress`); forma orbital → `OrbitalIcon` (creación y progreso de un run de generación, `GenerationPage`/`RunProgress`); nube granular → `Spinner` (`LoadingState` y cualquier otra espera genérica, incl. el explorador de contexto). Ningún componente combina más de uno de estos tres en la misma pantalla.
- **Excepción de color documentada:** la constelación (`ConstellationIcon`) es roja (`#ff2b2b`/`#7a1414`), fiel al GIF de referencia, aunque rojo es por lo demás reservado para error/danger. Es válida porque es decorativa (un motivo de carga puntual, no un estado) y no se reutiliza en ningún otro componente; si algún día se usa rojo fuera de `ConstellationIcon` como decoración, revisar esta excepción. Forma orbital y nube granular no tienen excepción de color: usan el acento violeta (`--accent`, `rgb(201,180,250)`).
- Constelación se implementa con `@tsparticles/react`/`@tsparticles/slim` (motor de partículas real, cargado dinámicamente solo al montar `AnalysisProgress`); forma orbital y nube granular se implementan con `<canvas>` a mano (sin dependencia nueva). Las tres tienen un fallback estático (SVG/CSS) para `prefers-reduced-motion: reduce` y entorno de test.

## Referencias y autoridad

Los diseños de Google Stitch y las imágenes entregadas son referencias visuales. No son contratos, no se copian literalmente y no reemplazan comportamiento, accesibilidad ni tokens definidos aquí.

## Fuera de alcance

- Landing/marketing, hero comercial, pricing o footer promocional.
- Copiar la interfaz o marca de Superhuman.
- Usar color, glass o movimiento de forma que reduzca legibilidad o accesibilidad.
