# 014 — Tareas Console

- [x] Importar `CS-20260921-003`, marcarlo `ACKNOWLEDGED` y pasar checkpoints CONTRACT_SYNC start/implementation-delivery sin eventos relevantes pendientes.
- [x] Sincronizar byte por byte los mirrors SYSTEM-2.4 e INTEROP-2.4 desde Core.
- [x] Agregar DTO/API/query de workspaces; elegir workspace personal/organización desde Projects Overview.
- [x] Aplicar `workspaceId` a list/create Projects y al discovery de repositorios GitHub.
- [x] Consumir `workspace`/`role`, mostrar rol y limitar acciones de UI; soportar renombre Admin y mensajes de errores de membresía/rol/verificación.
- [x] Consumir GET global de Analysis Runs y Action Required, filtrando las métricas del Overview por los Projects del workspace activo.
- [x] Ampliar el escenario demo con workspace personal, tres organizaciones, Projects/roles/activity coherentes y señalización persistente.
- [x] Revisar responsive/teclado en smoke manual del mock y cubrir carga, errores parciales, retry y mensajes en pruebas; la revisión UX no reporta más hallazgos (no equivale a una auditoría integral WCAG).
- [x] Pasar checkpoints before-review/before-done y registrar evidencia de lint/build/SDD y revisiones; no hay sync saliente porque este cambio consume Bundle B y no modifica contratos backend.
