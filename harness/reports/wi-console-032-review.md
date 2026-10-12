Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

# WI-CONSOLE-032 — revisión técnica independiente (awayMode)

**Veredicto: APPROVED** (con 3 observaciones de severidad baja, ninguna bloqueante; no hay DEC ni cambio de contrato).

## Evidencia ejecutada (app/)

- `npm run lint`: sin errores.
- `npx tsc -b --noEmit`: sin errores.
- `vitest run --maxWorkers=2`: 70 ficheros, 770 pruebas, todas en verde.

## Alcance aprobado (6 puntos)

1. Polling con `publicationId` y `pollAfterMs` del 202 hasta PUBLISHED/FAILED/STALE/CLOSED: cumple. `publicationPollIntervalMs` devuelve `false` en terminal o con error, `pollAfterMs` si es número >0, fallback 2000 ms si ≤0/null/ausente; reintentos finitos (2 en red/5xx, 0 en 4xx). Sin `setInterval` manual: el intervalo lo gestiona React Query, que lo cancela al desmontar (sin fugas).
2. URL solo http/https (`safePublicationUrl`, probada con javascript:/data:/ftp:/inválida), `branchName`, `failureMessage`, `role=status` (siempre montada, aria-live polite) y `role=alert` para FAILED/STALE/CLOSED: cumple. Enlace con `rel="noopener noreferrer"`.
3. Refresco de propuestas y Run solo al terminal, una vez por `publicationId` (ref); el POST ya no invalida (salvo onError de dominio 409/422): cumple y probado.
4. Botón con `aria-disabled` + «Publicando…», clic ignorado si `busy`; sin botón tras FAILED/STALE/CLOSED; aviso para propuestas ya PUBLISHED. Sin doble POST probado con spy (1 llamada): cumple.
5. Mock PENDING → PUBLISHING → terminal por lecturas, propuestas PUBLISHED solo en terminal exitoso, escenarios deterministas FAILED/STALE con `failureMessage` rotulado «DEMO · DATOS SIMULADOS» y `demo-stamp` en UI: cumple.
6. README y `.env.example`: correctos. Test-publications van por `VITE_CORE_API_URL`; `VITE_GITHUB_INTEGRATION_API_URL` apunta al GitHub Integration real para pruebas live; sin secretos.

## Contrato y honestidad

- Sin cambios de DTO, rutas ni tipos (`types.ts`/`api.ts` intactos). Los códigos de error del mock se alinean al contrato (`TEST_PUBLICATION_INVALID_RUN_STATUS` 409, `TEST_PUBLICATION_PROPOSAL_NOT_AVAILABLE` 422, `TEST_PUBLICATION_NOT_FOUND` 404).
- Rutas live: `getTestPublication`/`createTestPublication` solo derivan al mock con `getDataSource()==='mock'`; el sello DEMO solo aparece con `isMockDataSource()`.
- Sin secretos en el diff. `harness/state.json`, `work-items.json` y `tasks.md` solo muestran el registro del WI (no revisados en profundidad: fuera de mi alcance de edición).

## Hallazgos

| # | Severidad | Archivo | Descripción |
|---|-----------|---------|-------------|
| 1 | Baja (seguimiento) | `app/src/api/mockBackend.ts` (`traceFor`) | La traza mock devuelve `PRESENT` con `companionBranch`/`companionPullRequestUrl` aunque la publicación más reciente esté `PENDING`/`FAILED`/`STALE`, apuntando a un PR que en demo FAILED/STALE nunca existió. Es una desviación mock leve y la UI de la publicación no la usa; las pruebas de trace existentes dependen de ese comportamiento. Puede quedar como seguimiento (mock de trace por estado, junto con no exponer `companionPullRequestUrl` hasta PUBLISHED en el GET mock). No bloquea este WI porque el mock sigue rotulado como demo y el contrato live no se toca. |
| 2 | Baja | `AnalysisRunDetailPage.tsx` | Entre el terminal PUBLISHED y el refetch de propuestas, `available.length>0` aún muestra el botón habilitado unos instantes; un clic produciría 422 manejado (invalida y relee). Ventana mínima; sin daño. |
| 3 | Baja | `AnalysisRunDetailPage.tsx` | Si la consulta de la publicación falla (`isError`) el botón se rehabilita aunque la publicación siga en curso; un POST duplicado recibiría 422 de dominio, ya tratado. Aceptable; el mensaje pide recargar. |

## Siguiente paso recomendado

Cierre del WI por el leader tras este veredicto; push/PR solo bajo petición explícita del usuario. Registrar el hallazgo 1 como seguimiento si se desea.

filesAffected revisados: `app/src/control-plane/{queries.ts,AnalysisRunDetailPage.tsx,publicationView.ts,PublishSection.test.tsx,publicationPolling.test.tsx,publicationView.test.ts,api.test.ts}`, `app/src/api/mockBackend.ts`, `app/src/styles.css`, `README.md`, `app/.env.example`.
