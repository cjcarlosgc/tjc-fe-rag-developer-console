# 010-product-experience — Tareas

- [x] Shell/navigation: componente `Breadcrumbs` (jerarquía Proyecto > Versión > Run/Artifacts/Experimento) en las 8 páginas internas que antes solo tenían un enlace "← Volver".
- [x] filters/search: buscador de proyectos por nombre (aparece con más de 4 proyectos) y filtro de estado (Todos/Completados/Parciales/Fallidos) en el historial de generaciones.
- [ ] design tokens/components: parcial. Se agregó `Breadcrumbs` como patrón de dominio reutilizable y se consolidó `.inventory-toolbar`/`.inventory-search` en `.list-toolbar`/`.list-search` (usado ahora por inventario e historial de generaciones). Tablas, diff viewer y dialogs siguen sin una revisión de patrón dedicada.
- [ ] responsive/accessibility: pospuesto deliberadamente al final del backlog (checkpoint 2026-09-06, `spec/constitution/roadmap.md`). Los elementos nuevos llevan `aria-label`/`aria-current` básicos, pero no hubo auditoría de teclado, contraste ni formularios.
- [ ] UX tests/manual review: pruebas automatizadas agregadas (ver Calidad). La revisión manual en navegador no pudo completarse en esta sesión por desconexión de la extensión Claude in Chrome.

## Calidad

- [x] Agregar/actualizar pruebas.
- [x] Verificar manejo de errores.
- [x] Verificar observabilidad mínima.
- [x] Ejecutar lint/test/build.
- [x] Registrar evidencia de revisión en `harness/reports/`.
