# accessibility — Especificación

**Estado:** aprobado para implementar.
**Historias:** HU25, HU26, HU27, HU28, HU29
**Prioridad:** deliberadamente al final del backlog (checkpoint 2026-09-06, `spec/constitution/roadmap.md`); no se ejecuta antes que el resto de Sprint 3/4.

## Objetivo

Garantizar uso básico por teclado y semántica correcta.

## Reglas y comportamiento

- Toda acción y navegación es alcanzable por teclado con orden de foco predecible. No existen traps salvo dialogs/drawers modales correctamente gestionados.
- El foco visible usa contorno de al menos 2 px y contraste suficiente; no se elimina sin alternativa.
- Texto y controles cumplen WCAG AA en su fondo real, incluido vidrio, hover, disabled y nodos atenuados.
- Ningún estado, señal RAG, decisión o error depende solo del color; usa label, patrón, icono o forma adicional.
- Tooltips activados por hover también se activan por foco y su información esencial está disponible en el panel o descripción accesible.
- Controles interactivos tienen área objetivo mínima de 40×40 px, salvo texto inline con alternativa equivalente.
- Canvas/grafos ofrecen navegación por teclado y una representación estructurada alternativa para lector de pantalla.
- Formularios tienen label, instrucciones y errores asociados; tablas declaran headers; dialogs y drawers anuncian título/estado y restauran foco.
- Zoom al 200% y viewports reducidos no pierden acciones ni contenido esencial.
- `prefers-reduced-motion` elimina partículas, órbitas y traslaciones; cualquier crossfade residual dura como máximo 120 ms.

## Fuera de alcance

- Conformidad formal superior a WCAG AA.
- Optimización para tecnologías asistivas no disponibles durante la auditoría, sin impedir mejoras posteriores.
