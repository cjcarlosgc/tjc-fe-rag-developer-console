# WI-CONSOLE-020 — Pre-revisión contractual de adapters live SMART V3

Modelo: contract-reviewer · configurado gpt-6-luna · atendido unknown · esfuerzo low

En esta ejecución no se seleccionó explícitamente el perfil Codex por nombre; se aplicaron los defaults de subagente observados en `~/.codex/config.toml` (`gpt-6-luna` / `low`). `atendido` permanece `unknown` porque el runtime no expuso el ID servido en este handoff. El perfil actual por rol vive en `harness/agent-profiles.yaml` y `~/.codex/agents/`.

Estado: APPROVED_TO_IMPLEMENT

## Base comprobada

- `WI-CONSOLE-020` está seleccionado y su puerta externa es `G-PASSED`; los WIs Core requeridos constan como `W-DONE`.
- Los tres espejos de Console coinciden byte a byte con el checkout local de Core (`5e15577fe4ae6ba256a1cb00b61715b6c3d2874b`): SYSTEM-2.6 `670a1ef035d7c60be0a3385ca5f88e2a458b91f8ded2317e9dbbb97c58b07dc2`, INTEROP-2.7 `a70782ebc439f531765e26b03736f78e52049de081571aaa30e25c4cfb69988f` y GH-INTEROP-1.3 `d1779bbdc2445be8760c6b3eea3b73da4663618bab8d471f4d6e932fd7d0b964`.
- `CS-CORE-20261009-014` y `-015` figuran `C-RESOLVED`; no se detectó un Contract Sync relevante pendiente. Esta revisión no cambia su estado.
- No hay decisión `PENDING` cuyo `Blocks` alcance este WI: las decisiones de evidencia/producción no bloquean la prevalidación local con datos autorizados.

## Contrato que deben consumir los adapters

- Roles/UNKNOWN/Functional Knowledge (§6.11, §6.13): `WRITER` puede crear OE2/OE5, pero la respuesta y la abstención `UNKNOWN` siguen exigiendo `MAINTAINER`; `UNKNOWN` envía el `choice` publicado y recibe `202` con `outcome: ABSTAINED`, `continuationAttemptId: null` y `knowledgeId: null`. Functional Knowledge usa la ruta publicada y sus campos de escenario/procedencia, sin que Console compute `scenarioKey` ni derive autoridad.
- OE2 (§6.15): las cuatro rutas live son `POST /retrieval-comparisons` (con `Idempotency-Key` estable), `GET /retrieval-comparisons/{id}`, `GET .../{id}/results` y listado del Run. Debe propagar 409 `RETRIEVAL_COMPARISON_NOT_FINISHED`/`RETRIEVAL_COMPARISON_FAILED`, no inventar ganador ni verdad de terreno. PHP acepta las cinco relaciones estructurales y no se rechaza por lenguaje.
- OE5 (§6.5/§6.5.1): la request publicada de experimento es por `analysisRunId`, `symbolFilePath` y `symbolQualifiedName`; la respuesta/status/resultados conservan `symbol`. Tasas y tres medias son `number | null`; solo los dos contadores son números. `null` se presenta como «sin datos», y `technicallyEvaluable` no permite inferir CF/CO ni validez. PHP/PHPUnit es admisible si hay framework detectado y expone `PHP_LARAVEL_PHPUNIT`/`PHPUNIT`; el caso sin framework es `422 UNSUPPORTED_PROJECT`.
- Trace y evidencia (§6.16): trace usa `GET /analysis-runs/{id}/trace`; las tres rutas `/evidence` retornan el JSON de `EvidenceBundleResponse` `schemaVersion: '1'`. Antes de terminar es 409 `EVIDENCE_NOT_FINISHED`; evidencia de experimento/comparación `FAILED` es 200, y la comparación fallida admite `retrieval: []`. `snapshotRef` es opaco; no se esperan campos prohibidos ni se exponen secretos.

## Hallazgos y riesgos para la implementación

1. **Importante, no bloqueante.** `app/src/experiments/api.ts` ya intenta live, pero su payload actual (`projectId`, `targetId`) y `liveMapping.ts` (`targetId`) pertenecen al contrato previo. Deben alinearse con los campos de §6.5 antes de considerarlo verificado; de lo contrario, un Core real rechazará o devolverá una forma incompatible.
2. **Esperado.** `action-required/api.ts`, `control-plane/api.ts`, `retrieval-comparison/api.ts` y `evidence/api.ts` aún contienen el `PendingContractError` live. Su reemplazo ha de usar exclusivamente `apiRequest`/`apiRequestText`, conservando JWT, `x-correlation-id` y los errores `ApiError` ya centralizados.
3. **Riesgo de prueba.** No basta una suite unitaria del cliente: la evidencia de cierre debe ejercitar HTTP contra Core local o una suite de contrato de Core que cubra roles, rutas, DTOs y errores. Las credenciales, snapshots y datos semilla deben ser locales/efímeros; no se autoriza desplegar ni usar servicios externos.
4. **Fuera de alcance.** Las rutas de Context Explorer/Run Comparison que siguen pendientes corresponden a capacidades distintas y no deben activarse por arrastre.

## Plan mínimo de verificación contra Core local

1. Arrancar Core local con una base/fixtures efímeros y una sesión de prueba Reader, Writer y Maintainer; configurar únicamente `VITE_CORE_API_URL` local en Console.
2. Verificar por HTTP las rutas de lectura de Functional Knowledge, preguntas y trace/evidence, incluyendo `404` no revelador y `409 EVIDENCE_NOT_FINISHED`; comprobar que Console conserva `correlationId` y no reintenta un 409 de estado.
3. Con Maintainer, enviar `UNKNOWN` y comprobar `202 ABSTAINED` sin continuación ni conocimiento; con Writer, comprobar `403 PROJECT_ROLE_INSUFFICIENT`. Con Writer, crear OE2 y OE5 con `Idempotency-Key` estable, consultar/pollear estados y resultados; repetir contra fixture PHP/PHPUnit.
4. Descargar las tres variantes de evidencia como texto sin reserializar; validar `schemaVersion: '1'`, valores `null`, comparación failed con `retrieval: []`, ausencia de campos sensibles y PHP runner/profile cuando aplique.
5. Ejecutar las pruebas unitarias de adapters más la suite contractual/e2e focal de Core, y después lint, test, build, `validate-harness` y Contract Sync. Si cualquier diferencia se confirma, registrar `CS-CONSOLE-...` dirigido a Core: no cambiar Core en este WI.

## Handoff

- status: `APPROVED_TO_IMPLEMENT`
- findings: incompatibilidad preexistente de OE5 request/DTO; adapters SMART V3 pendientes de activar
- blockers: ninguno contractual
- filesAffected: `app/src/action-required/api.ts`, `app/src/experiments/{api.ts,liveMapping.ts,types.ts}`, `app/src/control-plane/api.ts`, `app/src/retrieval-comparison/api.ts`, `app/src/evidence/api.ts` y sus pruebas focales
- evidence: hashes de contratos, matriz de acceso/controles HTTP de Core y este informe
- recommendedNextStep: implementar los adapters como un único corte, añadir pruebas de contrato live contra Core local y publicar un Contract Sync Console→Core únicamente al concluir la verificación.
