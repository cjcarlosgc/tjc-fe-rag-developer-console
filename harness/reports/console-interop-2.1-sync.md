# Sincronización SDD 2.1 / SYSTEM-2.1 / INTEROP-2.1

**Estado:** DONE (sincronización de contrato + docs; sin cambios de código en `app/`)
**Repository:** `tjc-fe-rag-developer-console`
**Origen:** handoff cross-session desde la sesión que trabaja
`tjc-be-rag-core-api` (rama `feature/T-001`, commits `c87186e`/`18b6152`/`93fb701`,
verificados localmente contra el checkout real antes de actuar). Autorizado
explícitamente por el usuario en esta sesión ("haz la sincronizacion ahora").

## Qué cambió en Core (resumen)

`INTEROP-2.1`/`SYSTEM-2.1` retira, como ruta de producto real (no como concepto
de mock), lo siguiente — sin compatibilidad legacy paralela, a diferencia de
`INTEROP-2.0` que sí la prometía:

- `POST /projects/index` (carga ZIP manual).
- Los 5 modos de generación manual (`TARGET|CLASS_ALL|CLASS_MISSING|PROJECT_MISSING|PROJECT_ALL`) y `POST /test-runs` + endpoints asociados (estado, resultados, historial HU20, retry manual HU24).
- Los 4 endpoints de artifacts (dependían de `test-runs`).
- El evento realtime `test-run:update` (`project-version:update` se conserva).
- El endpoint de trazas de contexto **run-scoped** (`GET /test-runs/{runId}/context-traces`, HU27) — el **experiment-scoped** (`GET /experiments/{experimentId}/context-traces`, HU27/HU28) sobrevive.

El único disparador de análisis real pasa a ser 100% PR-driven (`AnalysisRun`).
**Experiments (HU19) se conserva explícitamente**, pero `POST /experiments`
(`targetId`) queda sin ruta vigente para crear experimentos nuevos porque
`targetId` dependía de la indexación ZIP retirada — reapuntarlo a `AnalysisRun`
es un corte P1/P4 futuro, no bloquea nada ahora.

## Qué se hizo en este repo

### 1. Mirror byte-por-byte de los contratos canónicos

`spec/contracts/system-contract.md` e `interoperability-contract.md` copiados
tal cual desde `tjc-be-rag-core-api` (regla ya documentada en `spec/README.md`
y en los propios contratos: "copia espejo byte por byte"). Verificado con
`diff -q` tras copiar.

### 2. Bump de versión

`harness/state.json` (`sddVersion: "2.1"`) y toda referencia declarativa de
línea base vigente (no histórica) en `spec/`: `README.md`, `backlog.md`,
`constitution/mission.md`, `constitution/project-context.md`,
`constitution/architecture.md`, `constitution/tech-stack.md`, y las
`spec.md`/`plan.md`/`tasks.md` de `001, 002, 004-013` y transversales
(`api-client`, `demo-mode`) que citaban `SYSTEM-2.0`/`INTEROP-2.0` como su
contrato vigente.

**No se tocó** (deliberado, mismo criterio que usó Core en su propio bump):
`spec/backlog-migration-sdd-2.0.md` (reporte histórico de T-001),
`spec/constitution/roadmap.md` (título/nombre de hito), menciones tipo
"SUPERSEDED BY SDD 2.0 / T-001" o "escenarios/arquitectura SDD 2.0" (nombran
un hito pasado, no la línea base vigente), y el ítem ya marcado `[x] Adoptar
SYSTEM-2.0 e INTEROP-2.0` en `013-pr-driven-control-plane/tasks.md` (registra
una acción histórica puntual, no una cita vigente).

### 3. Auditoría de UI/mocks — KEEP / marcar superseded (sin borrar código)

| Superficie | Archivo(s) | Alcance del retiro | Decisión |
|---|---|---|---|
| Carga ZIP manual | `analysis/UploadVersion.tsx`, alcanzable desde `LegacyToolsPage` | `POST /projects/index` retirado | **KEEP el código, marcar superseded.** Callout agregado en `spec/features/002-upload-analysis/spec.md`. Ya estaba oculto del flujo principal desde el corte anterior de esta sesión (solo accesible vía "Herramientas legacy"). |
| Selector de modos manuales + generación | `generation/GenerationPage.tsx` | `POST /test-runs` + 5 modos retirados | **KEEP, marcar superseded.** Alcanzable solo desde `LegacyToolsPage` ("Configurar generación →"), pero su propia ruta (`/projects/:id/generate`) no está bajo el prefijo `/legacy/` como el resto — inconsistencia menor de naming, no se corrige en este corte. |
| Progreso/historial de generación | `runs/RunPage.tsx`, `runs/RunHistoryPage.tsx` | Polling/WebSocket de `test-runs`, historial HU20, retry HU24 — todos retirados | **KEEP, marcar superseded.** Ya viven bajo `/legacy/runs/...`. |
| Artifacts (diff/descarga) | `artifacts/ArtifactsPage.tsx`, `artifacts/ArtifactWorkspace.tsx` | Los 4 endpoints dependían de `test-runs`, retirados con él | **KEEP, marcar superseded.** Ya vive bajo `/legacy/runs/:runId/artifacts`. |
| Context Explorer run-scoped | `context-explorer/ContextExplorerPage.tsx` (modo `runId`), `context-explorer/api.ts` (`listRunContextTraces`) | Endpoint run-scoped de HU27 retirado; el experiment-scoped sobrevive | **KEEP, marcar superseded — con matiz.** Es la única superficie retirada que **no** es puramente legacy: el mismo componente/página también sirve el modo `experimentId` (HU27/HU28), que **sigue vigente**. Callout agregado en `spec/features/011-context-explorer/spec.md` y `spec/transversal/demo-mode/spec.md`. No se toca `ContextExplorerPage.tsx` ni `api.ts` — ambos ya declaran `PendingContractError` en su rama live para el modo run-scoped, así que el comportamiento no cambia, solo deja de ser "pendiente de implementar" para pasar a "retirado permanentemente". |
| `POST /experiments` (`targetId` nuevo) | `experiments/ExperimentPage.tsx` y su form | El experimento se conserva; crear uno nuevo vía `targetId` queda sin ruta | **KEEP, sin marcar como superseded** (el feature HU19 sigue vigente) — se agregó nota en `spec/features/008-experimental-mode/spec.md`/`tasks.md` aclarando que el adapter live de creación quedó sin ruta, para no confundir "verificado contra Core real" (registro histórico correcto en su momento) con "sigue funcionando hoy". |

### 4. Ambiguo — no se tocó, queda para decisión explícita

- **`spec/contracts/rag-core-api.md`**: describe endpoint por endpoint la
  implementación legacy de Core al 2026-09-11 (`POST /test-runs`, artifacts,
  etc.), ahora desactualizado en el detalle. Se le agregó un callout de
  advertencia en el header, pero **no se reescribió el contenido
  endpoint-por-endpoint** — decidir si vale la pena mantenerlo como referencia
  histórica de la implementación legacy o reescribirlo es una decisión de
  alcance mayor, no mecánica.
- **Naming de ruta `/projects/:id/generate`** (no vive bajo `/legacy/`, a
  diferencia de runs/artifacts/context): inconsistencia menor detectada, no
  corregida.
- **Ningún componente visual fue tocado.** Los callouts son solo en `spec/`;
  ninguna página muestra hoy un badge "RETIRADO"/"SUPERSEDED" en pantalla —
  si se quiere eso (p. ej. un aviso visible en `LegacyToolsPage`), es una
  decisión de UX explícita pendiente, no implícita en este corte.

## Verificación

- `python3 -c "import json; json.load(open('harness/state.json'))"` — JSON válido.
- `diff -q` confirma bytes idénticos entre los contratos de este repo y los de
  `tjc-be-rag-core-api` tras la copia.
- Sin cambios en `app/` — no aplica `tsc`/`lint`/`test`/`build` (son solo `spec/`
  y `harness/`).
