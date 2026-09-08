# Evidencia de revisión — Historial, tiempo real y retry manual

**Historias:** HU20, HU21, HU22, HU24 (HU23/autorreparación descartada)
**Fecha:** 2026-09-06
**Estado:** DONE

## Alcance verificado

- Historial de generaciones por ProjectVersion (`GET /project-versions/{projectVersionId}/test-runs`), paginado por cursor, ordenado por `createdAt` descendente. Adapter mock stateful + adapter live contra `INTEROP-1.5`. Nueva página `RunHistoryPage` en `/projects/:projectId/runs` y `/projects/:projectId/versions/:projectVersionId/runs`, enlazada desde el detalle de proyecto.
- Adapter Socket.IO reutilizable (`api/socket.ts`) con suscripción/desuscripción por `projectVersionId`/`testRunId`, resuscripción automática ante reconexión, filtrado por id en cliente. Cableado como complemento (nunca reemplazo) del polling existente en `useAnalysisOperation` (HU21) y `RunPage` (HU22) mediante invalidación de la query correspondiente; en modo mock no abre transporte alguno.
- Retry manual (`POST /test-runs/{runId}/targets/{targetId}/retry`) habilitado solo para un target `INVALID`/`FAILED` de un run terminal (`canRetryTarget`). Genera y conserva una `Idempotency-Key` por target (`api/idempotency.ts`) hasta que el retry tiene éxito; no la regenera ante `IDEMPOTENCY_CONFLICT`. El run vuelve a mostrar progreso (reutiliza `RunProgress`/polling) mientras el target se reprocesa, y `ValidationResults` refleja el resultado actualizado sin asumir filas/artifacts nuevos.
- Mensajes accionables para `TEST_RUN_NOT_FINISHED`, `TARGET_RETRY_NOT_ALLOWED`, errores de idempotencia y `UNSUPPORTED_PACKAGE_MANAGER` (`runs/errors.ts`).
- Ninguna UI, tipo o copy de autorreparación/attempts automáticos (HU23 descartada, confirmado por ausencia y por pruebas explícitas).
- `spec/transversal/demo-mode/spec.md` amplía su alcance mock a HU20/HU24 (ya demostrables sin backend real); HU21/HU22 quedan explícitamente fuera del mock porque el modo mock no abre transporte de ningún tipo.

## Verificación

- `npm run lint`: OK.
- `npm test`: OK, 23 archivos y 59 pruebas (21 nuevas: historial, retry en mock backend, UI de `RunHistoryPage`/`ValidationResults`/`RunPage`, adapter Socket.IO y wiring de tiempo real en HU21/HU22, lifecycle de `Idempotency-Key`).
- `npm run build`: OK.
- Navegador: no se pudo verificar visualmente en esta sesión (extensión Claude in Chrome desconectada); la cobertura de integración con Testing Library renderiza el árbol real de componentes, rutas y clics (incluye el flujo completo de retry en `RunPage.test.tsx`).

## Fuera de alcance (explícitamente no tocado)

- Adapters live de listado de proyectos/versiones, generación, artifacts y experimentos (features 001, 002, 004-008): siguen PENDING, no forman parte de este work item.
- `getRun` live (`GET /test-runs/{runId}`): sigue rechazando con `PendingContractError`; es responsabilidad de la feature 005/006. El complemento WebSocket de HU22 ya está cableado y se activará sin cambios adicionales cuando esa pieza se implemente.
