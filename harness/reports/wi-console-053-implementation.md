# WI-CONSOLE-053 (HU18) — implementación

Modelo: implementer-high · configurado claude-haiku-5-5 · atendido unknown · esfuerzo high
Nota: escalado directo por el leader: UI multiarchivo con contrato, roles, mock y pruebas.

**Estado:** implementado en `feature/jean`, sin commit, sin push, sin PR. Gates en verde. Pendiente de revisión independiente (`reviewer`, `ux-reviewer`) y de la decisión del usuario sobre push.

## Alcance cubierto

| Punto del brief | Resultado |
|---|---|
| 1. Tipos | `experimentCapture?: { captureId; reservedAt } | null` en `AnalysisRunSummaryResponse`. `ExperimentCaptureStatus`, `ExperimentCaptureResponse` y `ExperimentCapturePage` en `projects/types.ts`. |
| 2. API | `listExperimentCaptures` (GET con `cursor`/`limit`), `armExperimentCapture` (POST sin cuerpo ni `Idempotency-Key`), `disarmExperimentCapture` (DELETE `/current`). Mock y live. |
| 3. Hooks | `useExperimentCaptures`, `useArmExperimentCapture`, `useDisarmExperimentCapture` en `projects/queries.ts`. Clave `['projects', id, 'experiment-captures']`, dentro de `projectKeys.detail`, así `usePurgeProjectQueries` la limpia. Sin realtime ni polling. |
| 4. UI | `ExperimentCapturePanel.tsx`, entre «Repository binding» y «Zona de peligro». |
| 5. Badge | «Reservado para experimentación» (`StatusBadge tone="warn"`) en `RunsPage` y en el resumen de `AnalysisRunDetailPage`, solo si `experimentCapture` es truthy. |
| 6. Mock | Estado propio por Project, sin tocar el mock de HU49. |
| 7. Pruebas | 34 pruebas nuevas, con mutaciones en rojo (sección «Mutaciones»). |
| 8. Gates | lint, tsc, test, build, format:check y contracts:check en verde. |

## Archivos tocados

Nuevos:
- `app/src/projects/ExperimentCapturePanel.tsx`
- `app/src/projects/ExperimentCapturePanel.test.tsx` (12 pruebas)
- `app/src/projects/experimentCapture.test.ts` (15 pruebas: live con `fetch` simulado y mock)

Modificados:
- `app/src/control-plane/types.ts`: campo `experimentCapture` en el resumen del Run.
- `app/src/projects/types.ts`: tipos de captura.
- `app/src/projects/api.ts`: tres funciones de captura (mock/live).
- `app/src/projects/queries.ts`: clave, query y dos mutaciones.
- `app/src/projects/ProjectDetailPage.tsx`: inserta el panel (3 líneas).
- `app/src/control-plane/errors.ts`: dos códigos en `codeMessages` y helpers `experimentCaptureErrorMessage`, `isExperimentCaptureUnsupported`, `isExperimentCaptureStale`, y la constante `EXPERIMENT_CAPTURE_WARNING`.
- `app/src/control-plane/RunsPage.tsx`: badge (1 línea).
- `app/src/control-plane/AnalysisRunDetailPage.tsx`: badge y nota «No se publica Check en el PR.» (6 líneas).
- `app/src/api/mockBackend.ts`: estado de capturas, seed, funciones mock y `experimentCapture` en el resumen.
- `app/src/styles/components.css`: 36 líneas de CSS nuevo para el aviso (tokens `--warning-*` existentes).
- `app/src/test/roleGating.test.tsx`: 2 pruebas de rol sobre `ProjectDetailPage`.
- `app/src/control-plane/RunsPage.test.tsx`: 2 pruebas de badge.
- `app/src/control-plane/AnalysisRunDetailPage.test.tsx`: 3 pruebas de badge.

Este informe es el único archivo nuevo bajo `harness/`. No se tocaron `harness/state.json`, `harness/work-items.json`, `spec/` ni `contracts/generated`; los cambios que ya aparecían en `harness/` y `spec/` al iniciar son del leader.

## Decisiones tomadas (alcance no cubierto por el brief o aprobado en SDD)

1. **Estado derivado:** `items[0]` manda. `ARMED` = armada; `RESERVED`, `DISARMED` o lista vacía = no armada.
2. **Aviso y «Desarmar»:** un único botón «Desarmar», dentro del aviso (`role="status"`). Lo ven todos los roles con captura `ARMED`; solo Maintainer o superior puede pulsarlo.
3. **Foco:** tras armar, el foco pasa a «Desarmar»; tras desarmar, a «Armar captura». Se gestiona con una ref y un efecto sobre el id de la captura armada. Si la mutación falla, la ref se limpia.
4. **Reintentos de la consulta:** los 4xx no se reintentan; los 5xx, uno solo. Un 404 que no es `PROJECT_NOT_FOUND` muestra «no disponible en esta versión de Core» y oculta los botones.
5. **Estado desconocido:** durante la carga o el error, «Armar captura» se muestra deshabilitado, como pide la especificación.
6. **Actualización optimista acotada:** tras éxito, `setQueryData` pone la captura devuelta al frente y después se invalida la lista. Tras 409 o 404 se invalida para mostrar el estado real.
7. **Enlace al Run reservado:** usa la ruta existente `/projects/:projectId/runs/:analysisRunId?workspaceId=…`. No hay rutas nuevas.
8. **Badge en lista:** `ProjectsPage` no se rotuló. Muestra el estado del último Run de cada tarjeta, no un listado de Runs.
9. **Mock:**
   - `prj_checkout_demo` tiene una captura `RESERVED` (`cap_demo_checkout_2`, Run `arun_checkout_pr47`) y una `DISARMED` (`cap_demo_checkout_1`). Sin captura `ARMED` por defecto.
   - `arun_checkout_pr47` es el único Run con `experimentCapture`; el resto lleva `null`.
   - Armar y desarmar usan el reloj real (`nowIso`). Las pruebas solo comprueban el formato de la fecha.
   - El listado mock no pagina: `nextCursor` es siempre `null`.
   - El mock de HU49 (`captureNextPr`) no se tocó.

## Verificación

Resultados reales, ejecutados en `app/` con Node 22:

| Gate | Comando | Resultado |
|---|---|---|
| Lint | `pnpm lint` | exit 0 |
| Tipos | `pnpm exec tsc -b --noEmit` | exit 0 |
| Pruebas | `pnpm test --maxWorkers=4` | exit 0: 97 archivos, 1019 pruebas en verde (34 nuevas) |
| Build | `pnpm build` | exit 0 |
| Formato | `pnpm format:check` | exit 0 (tras `prettier --write` solo sobre 6 archivos míos) |
| Contratos | `pnpm contracts:check` | exit 0 |

Pruebas nuevas por archivo: `experimentCapture.test.ts` (15), `ExperimentCapturePanel.test.tsx` (12), `roleGating.test.tsx` (+2), `RunsPage.test.tsx` (+2), `AnalysisRunDetailPage.test.tsx` (+3).

Cubren: método, ruta, ausencia de cuerpo e `Idempotency-Key` en las tres llamadas; 409, 404 y 403 con sus mensajes; 404 de Core sin soporte sin romper el Project; estados de carga, error y vacío; aviso solo con `ARMED`; roles; badge con y sin campo (live y mock); mock (409, 404, orden, reserva, reset y roles).

## Mutaciones (lógica clave revertida y restaurada)

Cada archivo se restauró desde copia y se verificó con `cmp`.

| Mutación | Pruebas en rojo |
|---|---|
| M1 gating: `canManage = true` | 3: panel «aviso visible para Reader y Writer», panel «Reader ve el estado», roleGating «Reader y Writer ven solo el estado» |
| M2 aviso sin `ARMED`: `{known && (` | 4: panel «sin captura armada», «desarmar: el aviso desaparece», «Reader ve el estado», live «404 al desarmar» |
| M3 badge incondicional, `RunsPage` | 2: «el Run reservado lleva el badge…», «un Run sin el campo… se lista sin badge» |
| M3 badge incondicional, detalle | 2: «un Run que no fue reservado no muestra el badge…», «un Run sin el campo…» |
| M4a sin mensaje de 409 | 2: api «409 … se traduce…», live «409 al armar relee la lista» |
| M4b `isExperimentCaptureStale` = false | 4: api 409 y 404, live 409 y live 404 (refresco) |
| M4c sin mensaje de 404 `NOT_ARMED` | 2: api «404 … se traduce…», live «404 al desarmar» |

Mutación de 403 no ejecutada por tiempo; la prueba de 403 se mantiene en verde en la ejecución normal.

## Lo no probado

- **Navegador y 375 px:** no se levantó servidor de desarrollo (instrucción de la sesión). No hay medición de desbordes, ni capturas `wi-console-053-captura-NN.png`, ni prueba de foco en navegador real. El foco solo se comprobó en jsdom.
- **Core real:** la ruta live se probó con `fetch` simulado. No hay prueba contra un Core desplegado con INTEROP-2.25.
- **Accesibilidad:** no hay auditoría de contraste ni de lector de pantalla; el aviso usa `role="status"` y texto, sin depender del color.

## Riesgos y puntos para revisión

- **Rótulo duplicado en la app:** «Armar captura» también existe en `run-comparison/CaptureNextPrPanel.tsx` (HU49, en `ExperimentPage`). Son páginas distintas, pero el usuario verá dos controles con el mismo nombre. Decisión para `ux-reviewer` y el usuario.
- **Spec pendiente del leader:** `spec/features/014-analysisrun-experiments/spec.md` sigue con «HU18 requiere contrato antes de implementación productiva» y ST-CONSOLE-055 sin marcar. No lo toqué.
- **Commit y push:** pendientes. Según el orden del leader, Core debe estar desplegado antes del push de Console.

## Espejo de contrato y Contract Sync (leader)

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

- `spec/contracts/interoperability-contract.md` espejado byte a byte con `git -C tjc-be-rag-core-api show 55bf4241431329a50db4ab85676b68c5888c01b8:spec/contracts/interoperability-contract.md`: sha256 `b2f3845296451bd3e593c00cb1e5955029f3d77ef4d69d1fd9326d07f1fdb651`, 161 728 bytes (INTEROP-2.25, un solo paso desde 2.23). En ese rev: SYSTEM-2.16 `d0a492b4…`, GH-INTEROP-1.9 `dedf00fa…` y árbol `schemas` `8079ab73…` (idénticos al repo local); `contracts:check` limpio sin cambio de `generated/`.
- Referencias vigentes 2.23 → 2.25 en `spec/README.md`, `spec/constitution/architecture.md` y `spec/features/013-pr-driven-control-plane/{plan,spec}.md`.
- `CS-CORE-20261030-001` y `CS-CORE-20261026-001` acusados y resueltos con este reporte: el del 30 subsume al del 26 (INTEROP-2.24 documental); lo pendiente del 26 (`BELOW_RELEVANCE_THRESHOLD` con fallback, `dependencyContext` hasta 500) lo cubrió WI-CONSOLE-052 (`ragLabels.ts`, `types.ts`; Console no consume `dependencyContext`).
- Gates reproducidos por el leader: lint, `tsc -b --noEmit`, 97 archivos y 1019 pruebas, build, `format:check` y `contracts:check` en verde.
