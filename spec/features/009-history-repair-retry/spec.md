# 009-history-repair-retry — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU20, HU21, HU22, HU24. HU23 está descartada.

## Objetivo

Consultar historial, mostrar progreso en tiempo real y permitir el reintento manual de un target fallido.

## Reglas y comportamiento

- Historial usa `GET /project-versions/{projectVersionId}/test-runs?cursor&limit`, ordenado por `createdAt` descendente y paginado con cursor opaco.
- Progreso usa los eventos Socket.IO `project-version:update` y `test-run:update`, con suscripción por id. Los payloads son exactamente los DTO HTTP y el polling sigue siendo fallback obligatorio.
- HU23 está descartada definitivamente: no existen autorreparación, attempts automáticos, timeline de reparación ni corrección vía LLM en modo normal o experimental.
- Retry se habilita únicamente para un target `INVALID`/`FAILED` de un run terminal. Invoca `POST /test-runs/{runId}/targets/{targetId}/retry`, conserva su `Idempotency-Key` durante retries de transporte y muestra el estado/resultados actualizados del mismo run.
- La UI no supone que retry crea un run/artefacto nuevo: Core actualiza el resultado y artefacto del target en su lugar.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
- No reintroducir HU23 ni representar estados/contadores de reparación inexistentes.
