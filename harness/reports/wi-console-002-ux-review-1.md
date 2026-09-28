# Revisión UX — WI-CONSOLE-002 (ciclo 1)

Fecha: 2026-09-25. UX reviewer independiente: agente `console_ux_review`. Veredicto: `CHANGES_REQUESTED`.

## Hallazgo bloqueante

- **P1 — historial de ProjectVersion fuera de la navegación normal.** Este WI retiró el único CTA a `/projects/:id/analyses` junto con `LegacyToolsPage`, sin sustituirlo. La pantalla sigue siendo de solo lectura, pero queda huérfana. Agregar un acceso claro desde Overview o ProjectTabs, por ejemplo «Snapshots».

## Deuda previa, no bloqueante para este WI

- El adapter solicita como máximo 100 versiones e ignora `nextCursor`; no equivale a un historial completo. Seguirlo por separado.
- El bloque de contexto de AnalysisRun puede ocultar errores/no disponibilidad live; es ajeno al retiro de flujos manuales.
- Los enlaces de navegación tienen objetivo mínimo de 36 px frente a 40×40 px en la spec de accesibilidad; deuda previa.

## Verificaciones y límites

- Runs y detalles PR/HEAD mantienen sus rutas y estados; inventario y snapshots siguen en lectura.
- Mock/demo permanece señalizado en shell y pantallas revisadas.
- No hubo navegador disponible para smoke visual; revisión estática. No se afirma verificación visual de responsive, zoom ni tecnología asistiva.
- No se ejecutaron pruebas; la implementación previa registra 420 pruebas, lint y build satisfactorios.

## Cierre

Blocker: acceso visible de solo lectura al historial. Repetir revisión UX tras la corrección.
