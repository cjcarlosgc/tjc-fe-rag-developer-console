# 014 — Workspaces, organizaciones y acceso en Console

**Estado:** aprobado para implementar (`T-004-console-workspaces`); el bundle B de Core está implementado y desplegado.
**Historias:** HU55, HU58, HU59, HU60, HU63, HU64. HU61 (revocación backend) y HU62 (login) son responsabilidad de Core/012.
**Contrato:** SYSTEM-2.4 / INTEROP-2.4 (§6.1, §6.8, §6.9, §6.10, §6.13), `CS-20260921-003`.
**Decisiones:** `DEC-ORG-001` APROBADO; `DEC-ORG-002` APROBADO.

## Objetivo

Permitir cambiar entre la cuenta personal y las organizaciones verificadas por Core, explorar sus Projects, vincular repositorios dentro del workspace elegido y respetar el rol que devuelve Core. El modo demo debe mostrar este flujo con datos explícitamente simulados; nunca se presenta como acceso real a GitHub.

## Reglas y comportamiento

- Obtener workspaces con `GET /workspaces`. Mostrar primero la cuenta personal y luego las organizaciones en el orden del contrato; no inferir membresías desde OAuth ni desde `user_metadata`.
- El workspace seleccionado delimita `GET /projects?workspaceId=...` y `POST /projects` (`workspaceId` es `WorkspaceResponse.id`). Mantener la selección al navegar/recargar mediante la URL; no enviar IDs de workspace hasta recibir un workspace válido.
- Todo `ProjectResponse` consume `workspace: {kind,id,login}` y `role: ADMIN|MAINTAINER|READER`. No replicar la autorización del servidor: ocultar/deshabilitar acciones que el rol no permite y mostrar los errores de Core como resultado autoritativo.
- Solo workspace `ADMIN` puede crear un Project de organización. Solo Project `ADMIN` puede renombrar o eliminar; `MAINTAINER` puede vincular, pausar/reactivar, responder preguntas, publicar tests y crear experimentos; `READER` solo lee.
- La creación incluye el `workspaceId` seleccionado. Repository discovery transmite `Project.workspace.id`; no permite vincular repositorios de otra organización ni ofrecer operaciones para las que el rol no alcanza.
- El nombre se cambia con `PATCH /projects/{projectId}` y `{name}`; no se envían campos adicionales.
- La vista Overview consume `GET /analysis-runs` y `GET /action-required` globales. Al mostrar un workspace, filtra en UI por los IDs de sus Projects; el endpoint global no se vuelve a presentar como endpoint live pendiente.
- `403 PROJECT_ROLE_INSUFFICIENT` informa el rol requerido/actual; `403 WORKSPACE_ADMIN_REQUIRED` explica que debe actuar un owner; `404 WORKSPACE_NOT_FOUND` actualiza la lista de workspaces; `404` de recurso no distingue entre inexistente y no visible. `503 GITHUB_VERIFICATION_UNAVAILABLE` ofrece reintento y nunca se traduce en «no existe».
- El mock ofrece el workspace personal y tres organizaciones (`observability-lab`, `rag-tesis-org` y `team-sandbox`), con Projects/roles/activity coherentes. Incluye un workspace Member/Reader sin capacidad de crear y uno Admin vacío para demostrar creación y repository discovery aislados por organización. El indicador persistente de demo identifica que identidad, organizaciones, repositorios y datos son simulados. No se hacen requests en modo mock.
- `SubscribeAck` sigue siendo opcional: el cliente actual puede ignorarlo y conserva polling/HTTP como fuente de estado.

## Fuera de alcance

- Administrar organizaciones, miembros, equipos, invitaciones o permisos; GitHub/Core son la fuente de verdad.
- Persistir o reutilizar tokens OAuth fuera de la sesión, verificar membresía en el navegador, o hacer llamadas directas a GitHub/Supabase desde esta feature.
- Cambios de backend, despliegue o alteración del contrato Core.
