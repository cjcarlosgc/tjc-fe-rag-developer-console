# 011-context-explorer — Especificación

**Estado:** aprobado para implementar.
**Historias:** HU27, HU28

## Objetivo

Mostrar en una pantalla amplia y navegable la evidencia de contexto recolectada para una generación, con dos modos que comparten shell y panel lateral pero mantienen semánticas distintas: `Contexto RAG` y `Exploración del agente`.

## Entradas

- Desde el resultado o los artifacts de un run: abrir el contexto general del run.
- Desde un artifact creado/modificado: abrir el mismo explorador filtrado por los targets asociados a ese archivo mediante `ArtifactResponse.targetIds`.
- Desde un experimento: abrir una repetición concreta `RAG` o `GENERALIST_AGENT`.
- Mostrar el último intento por defecto; permitir consultar intentos anteriores conservados tras retry.

## Contexto RAG — HU27

- Grafo horizontal con target raíz y todos los candidatos recuperados. Cada conexión termina en un nodo visible; no se dibujan caminos huérfanos.
- Amarillo `#F2C94C` identifica señal semántica; turquesa `#34D6D3` señal estructural; coincidencia dual usa anillo turquesa y núcleo amarillo; blanco marca selección/foco.
- Candidatos descartados permanecen visibles a 30% de opacidad y/o borde discontinuo. Hover/focus explica `BELOW_MINIMUM_SCORE`, `TOP_K_LIMIT` o `TOKEN_BUDGET`.
- El detalle lateral muestra path, símbolo, rango, score, tokens, señales, decisión, hash, truncamiento, snippet exacto y hasta tres líneas anteriores/posteriores desvanecidas progresivamente.
- El score nunca se rotula como probabilidad o confianza científica.

## Exploración del agente — HU28

- Organizar por repetición → target → trayectoria ordenada → herramienta → archivo/símbolo observado.
- Usar violeta/lavanda `#A78BFA`; no reutilizar amarillo/turquesa RAG como decoración.
- `list_files` muestra un nodo resumen (por ejemplo “146 archivos disponibles”); no dibuja todas las rutas inicialmente. “Mostrar descubiertos” abre el listado paginado.
- `search_text` muestra coincidencias; `inspect_symbol`, declaración y referencias; `read_file`, contenido efectivamente entregado. Vacíos/errores se atenúan.
- No usar categorías seleccionado/descartado. La etiqueta es “contexto observado por el agente” o “contenido entregado al agente”, nunca “contexto utilizado”.
- El panel lateral muestra herramienta/paso, argumentos, archivo/símbolo, rango, snippet, tres líneas circundantes, truncamiento y hash.

## Interacción común

- Canvas con pan/zoom, reencuadre, minimap discreto y navegación por teclado. Seleccionar un nodo abre panel lateral liquid glass; hover ofrece resumen sin reemplazar el panel.
- Búsqueda y filtros cambian según el modo: RAG filtra señal/decisión/motivo; agente filtra herramienta/estado/path.
- Estados loading, vacío, error y retry siguen `design-system` y `accessibility`.
- El frontend consume únicamente `INTEROP-1.6` sección 6.7; no reconstruye scores, motivos ni observaciones desde strings.

## Fuera de alcance

- Inferir influencia interna o mostrar chain-of-thought.
- Mezclar RAG y agente en una estructura conceptual falsa.
- Editar código desde el explorador.
