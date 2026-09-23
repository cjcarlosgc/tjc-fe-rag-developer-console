# 014 — Plan Console

## Dependencias

- `SYSTEM-2.4` / `INTEROP-2.4`, `DEC-ORG-001`, `DEC-ORG-002` y `CS-20260921-003` ACKNOWLEDGED.
- `api-client`, `async-state`, `demo-mode`, `errors-notifications` y `accessibility`.
- La versión de Core del entorno debe incluir el bundle B antes de enviar `workspaceId` o consumir `workspace`/`role`; Core confirma el despliegue y `GET /workspaces` real.

## Diseño técnico

- DTOs explícitos de `WorkspaceResponse`, `WorkspaceListResponse`, `WorkspaceRefResponse` y el `ProjectResponse` extendido.
- API/queries tipadas para workspaces, Project listado por workspace, creación/renombre y discovery filtrado por workspace.
- El Overview conserva el workspace en la URL, consulta Projects por ese ID y deriva el subconjunto de Runs/Action Required desde los listados globales.
- Capabilities de UI derivadas de workspace role y project role; Core mantiene la validación final. Manejar códigos de error del contrato mediante mensajes accionables.
- Ampliar el backend demo stateful con cuenta personal + tres organizaciones, Projects/roles/activity fixtures y repository discovery separado por workspace; nunca compartir fixtures de demo con adaptadores live.

## Validación

- Revisar respuestas live y requests (incluido `workspaceId`) contra INTEROP-2.4; validar org personal y organizacional y errores de rol/pertenencia.
- Recorrer selector, carga/empty/error, creación, discovery, vista por rol y retorno tras navegar; asegurar indicador DEMO y cero requests mock.
- Revisión de UX, teclado, foco, labels y zoom; lint, build y SDD check. Las pruebas automatizadas no se ejecutan en este ciclo salvo solicitud explícita del usuario.
