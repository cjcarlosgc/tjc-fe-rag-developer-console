# 005-generation-progress — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU13, HU21, HU22

## Objetivo

Mostrar avance asíncrono de indexación/generación, con polling V1 y WebSockets Sprint 3.

## Reglas y comportamiento

- Polling respeta `pollAfterMs` y se detiene en estado terminal.
- Sprint 3 usa los eventos Socket.IO contractuales por id; push actualiza sin duplicar eventos y polling permanece como fallback.
- Mostrar global status y progreso por target cuando backend lo provea.
- PARTIAL/FAILED visibles.
- Reconexión no vuelve a crear el run: recupera estado por el id existente.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
