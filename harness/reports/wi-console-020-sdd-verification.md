# WI-CONSOLE-020 — Verificación SDD y preparación de adapters live

Modelo: sdd-analyst · configurado gpt-6-luna · atendido unknown · esfuerzo low

Work item: `WI-CONSOLE-020` «Activar y verificar los adapters live de SMART V3» (`ST-CONSOLE-022`, HU05/HU07/HU08/HU12/HU15/HU17, `CONSOLE`, P1, sprint SMART V3). Revisión previa a implementación: no se editó código de producto, `harness/state.json`, `harness/work-items.json` ni gates.

## Veredicto

**status: APPROVED para `W-SPEC_VERIFIED`**. El corte está autorizado en alcance y sus dependencias locales y externas están satisfechas. Su implementación debe conservar el límite: activar consumidores Console ya definidos contra Core local; no modificar Core, Sandbox, contratos ni añadir producto nuevo.

## Trazabilidad y comportamiento aprobado

- `ST-CONSOLE-022` pertenece a `spec/features/013-pr-driven-control-plane/tasks.md`, está `T-READY` y enlaza exactamente este WI. Los seis `storyIds` son HU vigentes del catálogo y el componente es local `CONSOLE`.
- `WI-CONSOLE-021` ya está cerrado y figura en `dependsOn`; la puerta externa de 020 está `G-PASSED` contra Core `129a9ab23886ade532071de389e5129a1e64f61f`. Sus WIs fuente requeridos (`018`, `019`, `020`, `022`, `025`, `026`, `027`) constan `W-DONE` y los Contract Sync están importados/acusados.
- Los consumers a activar son exclusivamente los publicados en INTEROP-2.7: roles `WRITER` y abstención `UNKNOWN`/respuestas funcionales y Functional Knowledge (§6.11); OE2 (`POST /retrieval-comparisons`, estado, resultados y listado, §6.15); OE5 (`POST /experiments`, estado y resultados, §6.5/§6.5.1); trace operativo (§6.16); y las tres descargas `/evidence` (§6.16).
- El transporte ya centraliza `Authorization`, `x-correlation-id`, errores y `VITE_CORE_API_URL`. Evidencia live debe conservar bytes crudos mediante `apiRequestText`, no reserializar el JSON descargado.
- Roles: lecturas de FK, trace, evidencia y resultados son Reader; `POST /retrieval-comparisons` y `POST /experiments` son Writer; responder o registrar `UNKNOWN` sigue limitado a Maintainer/Admin. La UI puede orientar, pero Core es autoridad de permisos.
- Semántica que no puede cambiar: `UNKNOWN` deja la pregunta `PENDING` y el Run `ACTION_REQUIRED`; Console no calcula `scenarioKey`; `failureCode` es abierto; `null` significa «sin dato», nunca cero; CF/CO no se deducen de `technicallyEvaluable`, `valid` ni `passed`; OE2 no declara ganador; los mocks siguen visibles como `DEMO · DATOS SIMULADOS`.
- La validación live debe comprobar rutas, cuerpo, `Idempotency-Key` estable en POST, estado/errores publicados (`409 EVIDENCE_NOT_FINISHED`, `409` de resultados no terminales o comparación fallida, `403`, `404`, `422` y `503` aplicables), polling y que un `FAILED` terminal siga pudiendo consultarse donde el contrato lo permite.

## Decisiones evaluadas por `Blocks`

No hay decisión `PENDING` ni `PROPOSED` cuyo `Blocks` alcance `WI-CONSOLE-020` o `ST-CONSOLE-022`.

- `DEC-INF-001` bloquea aprovisionamiento remoto, no desarrollo ni prevalidación local.
- `DEC-VAL-001` bloquea código empresarial/despliegue/evidencia empresarial, no la verificación local autorizada.
- Las decisiones SMART V3 relevantes están aprobadas, entre ellas `DEC-FK-001` a `DEC-FK-005`, `DEC-EXP-FK-001`, `DEC-EXP-003`, `DEC-EXP-004` y `DEC-ORG-003`.

Por tanto, se recomienda registrar `decisionGate` sin bloqueantes; no hay `DECISION_REQUIRED`.

## Preparación real y hallazgos

1. La configuración local de Console declara `VITE_CORE_API_URL=http://localhost:3000` y fuente live. La sonda de `GET http://localhost:3000/health` ejecutada en esta revisión devolvió conexión rechazada (`curl` 7, HTTP `000`): Core local no está levantado ahora. Es un prerrequisito operativo para la comprobación manual live, **no un bloqueo SDD** ni motivo para iniciar infraestructura externa.
2. Los adapters pendientes son identificables y acotados: `action-required/api.ts` rechaza `UNKNOWN` y Functional Knowledge, `control-plane/api.ts` rechaza trace, `evidence/api.ts` rechaza evidencia y `retrieval-comparison/api.ts` rechaza sus cuatro operaciones en live. Deben pasar a las rutas de contrato sin leer campos no publicados.
3. El adapter de OE5 existente ya hace llamadas live heredadas; el implementer debe cotejar request/DTO con §6.5/§6.5.1 y las respuestas actuales de Core antes de declarar paridad. En particular no debe conservar cuerpos heredados que usen `projectId`/`targetId` si la ruta actual exige `analysisRunId`, `symbolFilePath` y `symbolQualifiedName`.
4. La comprobación live necesita una sesión Supabase válida, datos Core elegibles y un Run/experimento/comparación de prueba. Si esos datos no existen, puede verificarse la suite de contrato de Core y registrar la limitación exacta; no se sustituye con mock ni se simulan credenciales.
5. El árbol de trabajo ya contiene cambios de otros cortes. El implementer debe aislar su diff y no sobrescribir cambios ajenos.

## Evidencia revisada

- `spec/README.md`; `spec/contracts/system-contract.md`; `spec/contracts/interoperability-contract.md` (§6.5, §6.5.1, §6.11, §6.15, §6.16); `spec/constitution/project-context.md`; `spec/constitution/delivery-workflow.md`; `spec/backlog.md`.
- Trío 013 y 014; transversales de cliente API/estados/errores/demo/testing aplicables; `harness/work-items.json`, `harness/state.json`, `harness/WORKFLOW.md` y `harness/reports/wi-console-020-external-dependency-gate.md`.
- Inventario estático de adapters y prueba operativa de disponibilidad local (`GET /health`, conexión rechazada).

## Handoff

- **findings:** alcance suficiente; sin decisiones bloqueantes; Core fuente y Contract Sync están listos; Core local debe levantarse antes de la validación manual real.
- **blockers:** ninguno de SDD. Bloqueo operativo temporal para la prueba live mientras `localhost:3000` no responda.
- **filesAffected:** `harness/reports/wi-console-020-sdd-verification.md`.
- **evidence:** este reporte y `harness/reports/wi-console-020-external-dependency-gate.md`.
- **recommendedNextStep:** el leader registra el gate SDD y delega a `implementer` un corte único de activación y pruebas contractuales de los adapters enumerados; después levanta/verifica Core local y ejecuta la validación real antes de UX/contract review y revisión humana.
