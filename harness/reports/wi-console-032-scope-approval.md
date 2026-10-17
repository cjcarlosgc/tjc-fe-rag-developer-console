# WI-CONSOLE-032 — aprobación de alcance

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

**Fecha:** 2026-10-12
**Autoriza:** usuario (Human Reviewer), en el chat de Console.

## Contexto y cita

Hallazgo verificado en E2E real con Core local: al pulsar «Publicar» Console no consume el `202` de `POST /analysis-runs/{id}/test-publications` ni hace polling de `GET /test-publications/{publicationId}`; la UI sigue ofreciendo el botón hasta recargar y un segundo clic produce `409 TEST_PUBLICATION_PROPOSAL_NOT_AVAILABLE`. El mock crea la publicación ya `PUBLISHED`, por eso no se ve en demo.

Pregunta al usuario: «¿apruebas este WI pequeño (P1) con ese alcance…?». Respuesta literal: «apruebo el WI de publicación».

## Alcance aprobado

1. Guardar `publicationId` del `202` y consultar `GET /test-publications/{publicationId}` cada `pollAfterMs` (fallback razonable) hasta un estado terminal del contrato (`PUBLISHED`, `FAILED`, `STALE`, `CLOSED`).
2. Mostrar `companionPullRequestUrl` (solo http/https), `branchName` y `failureMessage`; regiones `role="status"` para progreso y `role="alert"` para fallo.
3. Refrescar `test-proposals` y el Run al llegar a estado terminal.
4. Deshabilitar el botón («Publicando…», `aria-disabled`) con publicación `PENDING`/`PUBLISHING`; no ofrecer duplicados si ya hay publicación en curso o propuestas `PUBLISHED`.
5. Mock: `PENDING` → `PUBLISHING`/`PUBLISHED` con estado intermedio observable y un escenario `FAILED`/`STALE` rotulado «DEMO · DATOS SIMULADOS».
6. README y `app/.env.example`: en pruebas live `VITE_GITHUB_INTEGRATION_API_URL` debe apuntar al GitHub Integration real, sin secretos.

## Fuera de alcance

Contratos, DTO, rutas nuevas, merge automático, reintento automático de publicaciones fallidas, `WI-CONSOLE-004` y sus OC, accesibilidad global, push, PR, Core de Render.

Revisión independiente: mientras `awayMode.enabled` sea `true`, la hace el agente `reviewer`; no sustituye decisiones `DEC` ni aprobaciones de alcance o contrato.
