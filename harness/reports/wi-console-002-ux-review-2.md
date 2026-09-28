# Revisión UX — WI-CONSOLE-002 (ciclo 2)

Fecha: 2026-09-25. UX reviewer independiente: agente `console_ux_review`. Veredicto: `CHANGES_REQUESTED`.

## Hallazgo bloqueante

- **P2 — navegación persistente ausente en la página de historial.** El enlace visible desde ProjectTabs de Overview resuelve descubribilidad; sin embargo, `AnalysisHistoryPage` no incluye ProjectTabs. Al navegar al historial desaparece la navegación del proyecto y no se indica la pestaña activa. Montar la navegación en la página real y cubrirlo con prueba de integración que compruebe «Historial» activo.

## Verificaciones y límites

- `workspaceId` se conserva en el link y el historial sigue siendo de solo lectura, sin ZIP, generación ni descargas manuales.
- No hubo navegador disponible para inspección visual o verificación de teclado; la revisión es estática. El subnav horizontal debe seguir utilizable en viewport estrecho.
- La limitación previa a 100 versiones y otros hallazgos UX siguen fuera de este WI.

## Cierre

Blocker: mantener navegación y tab activo en la composición real del historial; re-revisar tras la corrección.
