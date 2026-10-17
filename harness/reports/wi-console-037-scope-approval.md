# WI-CONSOLE-037 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-14
**Autoriza:** usuario (Human Reviewer), en el chat de Console.

## Cita literal

> «Apruebo un WI de Console que corrija F1 (ContextExplorer parte de la URL vigente, no del snapshot) y que PublishSection oculte «Publicar» cuando la publicación ya está PUBLISHED, con pruebas rojo→verde; sin cambiar contratos ni pantallas; sin push ni despliegue sin mi orden.»

## Alcance aprobado

1. F1 (hallazgo de `wi-console-027-review.md`): `ContextExplorerPage.updateParams` compone los parámetros nuevos a partir de la URL vigente (no del snapshot de `searchParams` del render), de modo que dos actualizaciones en el mismo ciclo no se pisan (`view=list` no se pierde). Prueba ROJO que reproduce la pérdida sin depender de la carga de la máquina; se quitan o reducen las esperas añadidas en WI-027 solo si enmascaraban el defecto, sin debilitar aserciones.
2. `PublishSection` (`AnalysisRunDetailPage.tsx`): ocultar «Publicar» y la oferta de publicar cuando la publicación ya está `PUBLISHED`, incluida la ventana entre `PUBLISHED` y el refetch de propuestas y tras recargar con propuestas ya `PUBLISHED`. PENDING/PUBLISHING siguen con «Publicando…» deshabilitado; FAILED/STALE/CLOSED no cambian.

## Fuera de alcance

Sondeo en segundo plano, UI informativa de campos nuevos, trazas live, accesibilidad global, contratos/DTO/rutas/mocks de listados/pantallas, cualquier otro hallazgo diferido, push, PR o despliegue.

## Notas de registro

- Orígenes: `harness/reports/wi-console-027-review.md` (F1), `harness/reports/wi-console-032-review.md` (hallazgo 2) y `harness/reports/console-deferred-corrections.md`.
- Revisión independiente: mientras `awayMode.enabled` sea `true`, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
