# 002-upload-analysis — Tareas

- [x] Upload UI.
- [x] 202 handler/polling.
- [x] Progress states.
- [x] Results summary.
- [x] New version flow.
- [x] Historial demo con tres o más ProjectVersions indexadas.
- [x] Inventario histórico por ProjectVersion.
- [x] Adapter live de listado de versiones según `INTEROP-2.1` (`GET /projects/{id}/versions`, verificado contra el controller real; lectura de `ProjectVersion` sobrevive el retiro de la carga ZIP en `INTEROP-2.1` §6.2). Ver `harness/reports/console-analysisrun-live-adapters.md`.

## Calidad

- [x] Agregar/actualizar pruebas.
- [x] Verificar manejo de errores.
- [x] Verificar observabilidad mínima.
- [x] Ejecutar lint/test/build.
- [x] Registrar evidencia de revisión en `harness/reports/`.
