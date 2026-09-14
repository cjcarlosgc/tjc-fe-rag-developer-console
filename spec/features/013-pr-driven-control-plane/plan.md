# 013 — Plan

## Dependencias

- SYSTEM-2.1 e INTEROP-2.1 sincronizados.
- Supabase Auth aislado detrás de su adapter.
- sistema de diseño, routing, query cache y demo mode existentes.

## Cortes posteriores

1. Shell y fixtures INTEROP-2.1 para Projects, Runs e Integrations/GitHub.
2. Action Required y Focus Mode con `returnTo`, evidencia y `UNKNOWN`.
3. Detalle de Run, clasificación, Check y obsolescencia por HEAD.
4. Review/freshness/publication del companion PR.
5. Adapter live contra Core y retiro controlado de navegación legacy.

Cada corte mantiene adapters mock/live independientes y estados de carga/error/vacío. T-001 solo consolida el plan documental.
