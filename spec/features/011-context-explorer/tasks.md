# 011-context-explorer — Tareas

- [ ] Implementar adapters live/mock para los endpoints de trazas `INTEROP-2.1`.
- [ ] Construir shell del explorador, selector RAG/agente, búsqueda, filtros y navegación run/artifact/experimento.
- [ ] Implementar grafo horizontal RAG con nodos seleccionados/descartados y todas las conexiones terminadas.
- [ ] Implementar trayectoria cronológica del agente y expansión paginada “Mostrar descubiertos”.
- [ ] Implementar hover/focus y panel lateral con excerpt, líneas circundantes, hash y truncamiento.
- [ ] Implementar pan/zoom, minimap, virtualización/colapso y deep links.
- [ ] Cubrir loading, vacío, error, retry y últimos/intentos anteriores.

## Propuesta sin implementar (HU54 — `PROPOSED`, registrada 2026-09-14)

- [ ] HU54: nodos/paneles de conocimiento funcional y evidencia de tests
      existentes en el árbol de contexto. Bloqueado: sin forma de contrato
      para esto en `AnalysisRun` todavía. Ver `spec.md` y
      `harness/reports/console-backlog-formalization.md`.

## Calidad

- [ ] Agregar pruebas unitarias, integración y navegación.
- [ ] Auditar teclado, lector de pantalla, contraste y reduced motion.
- [ ] Ejecutar lint/test/build/SDD check.
- [ ] Registrar evidencia de revisión visual y funcional.
