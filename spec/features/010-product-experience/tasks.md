# 010-product-experience — Tareas

- [x] Shell/navigation: componente `Breadcrumbs` (jerarquía Proyecto > Versión > Run/Artifacts/Experimento) en las 8 páginas internas que antes solo tenían un enlace "← Volver".
- [x] filters/search: buscador de proyectos por nombre (aparece con más de 4 proyectos) y filtro de estado (Todos/Completados/Parciales/Fallidos) en el historial de generaciones.
- [ ] Migrar tokens y primitives al sistema Black Glass consolidado; el recoloreo previo queda supersedido como dirección vigente.
- [ ] Homologar shell y todas las rutas funcionales bajo RAG Test Studio.
- [ ] Revisar tablas, formularios, code/diff, dialogs, drawers y estados asíncronos.
- [ ] Implementar recorrido GitHub mock con señalización persistente y sin requests/efectos externos.
- [ ] Integrar los nuevos exploradores de contexto y autenticación con el shell.
- [ ] responsive/accessibility: pospuesto deliberadamente al final del backlog (checkpoint 2026-09-06, `spec/constitution/roadmap.md`). Los elementos nuevos llevan `aria-label`/`aria-current` básicos, pero no hubo auditoría de teclado, contraste ni formularios.
- [ ] Completar revisión visual contra Stitch en desktop y viewport reducido.

## Calidad

- [ ] Agregar/actualizar pruebas para la consolidación.
- [ ] Verificar manejo de errores y ausencia de requests GitHub en demo.
- [ ] Verificar observabilidad mínima.
- [ ] Ejecutar lint/test/build/SDD check.
- [ ] Registrar evidencia de revisión en `harness/reports/`.
