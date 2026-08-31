# 009-history-repair-retry — Especificación

**Estado:** aprobado para SDD 1.0 salvo elementos marcados PENDING/PROPOSED.  
**Historias:** HU20, HU23, HU24

## Objetivo

Consultar historial y representar autorreparación/retry del modo normal.

## Reglas y comportamiento

- Historial por proyecto/version con fecha/mode/status.
- Autorepair UI solo refleja estados/attempts que envía Core; no decide cuándo reparar.
- Tras agotar attempts, mostrar revisión requerida y Retry si está permitido.
- Experimental mode nunca muestra reparación automática.

## Fuera de alcance

- No ampliar a capacidades no mencionadas en esta spec.
- No convertir decisiones PENDING en implementación definitiva sin aprobación.
