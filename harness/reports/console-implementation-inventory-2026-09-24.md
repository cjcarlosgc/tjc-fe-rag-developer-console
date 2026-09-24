# Inventario de implementación y priorización — Console

- Fecha: 2026-09-24
- Work item: `T-005-console-implementation-inventory` (`HARNESS`, Sprint H)
- Alcance: Developer Console y evidencia visible desde este repositorio. No afirma que Core o Sandbox estén terminados cuando la evidencia local solo demuestra el adapter o la demo.
- Método: contrastar backlog vigente, contratos, tareas de feature, código y reportes de cierre. Una casilla abierta no basta para declarar trabajo pendiente; una demo tampoco cuenta como integración live.

## Estados usados

- **HECHA (Console):** implementación de Console acreditada por código/reporte. La etiqueta no sustituye la validación de Core o de GitHub cuando aplique.
- **PARCIAL:** existe una parte funcional, mock o especulativa, pero falta live, contrato o evidencia de extremo a extremo.
- **PENDIENTE EN CONSOLE:** hay un criterio vigente de Console verificablemente incumplido.
- **PENDIENTE SEGÚN CONTRATO (owner externo):** la spec vigente dice que falta implementación en Core/Sandbox; el estado desplegado más reciente aún debe confirmarse.
- **ESTADO EXTERNO NO VERIFICADO:** este repositorio no tiene evidencia suficiente para decir si Core/Sandbox ya lo implementó.
- **SUPERSEDIDA/RETIRADA:** la ruta o definición ya no pertenece al producto vigente; no debe implementarse de nuevo.
- **DESCARTADA:** decisión definitiva de no implementar.

Las tareas abiertas en `tasks.md` son una señal para investigar, no una orden de implementación. La clasificación usa la spec/contrato vigente y contrasta cada checkbox con el código y la evidencia de cierre. Las HUs históricas supersedidas no se reactivan por conservar pantallas, fixtures o tareas antiguas.

## Inventario por historia

| HU | Estado en Console | Evidencia y límite |
|---|---|---|
| HU01–HU18 | SUPERSEDIDAS/RETIRADAS | El backlog retira el flujo ZIP, inventario por `ProjectVersion`, generación manual y artifacts de esos runs como rutas del producto PR-driven. Las páginas históricas que permanezcan no reactivan esas historias. |
| HU19 | PARCIAL / REORIENTADA | Se conserva la comparación RAG vs agente, pero la unidad pasa de target manual a `AnalysisRun` (HU48). El flujo antiguo depende de ZIP/targets retirados. Ver `spec/backlog.md` y `spec/features/014-analysisrun-experiments/`. |
| HU20 | SUPERSEDIDA/RETIRADA | Historial de generación manual por `ProjectVersion`; no es el historial operativo vigente de AnalysisRuns. |
| HU21–HU22 | SUPERSEDIDAS en su forma original | Los eventos de progreso de ProjectVersion/test-run manual se retiraron con esa ruta. La autenticación del socket no demuestra que exista un canal PR-driven equivalente. |
| HU23 | DESCARTADA | La arquitectura prohíbe autoreparación automática; `spec/backlog.md` lo declara explícitamente. |
| HU24 | SUPERSEDIDA/RETIRADA | Retry de generación manual; no es un retry del AnalysisRun PR-driven. |
| HU25–HU26 | PARCIALES; T-006 cerró marca y shell global | T-006 ya muestra “RAG Test Studio” y consolida canvas, topbar y navegación. Sigue pendiente la homologación visual de las demás superficies y el recorrido GitHub mock. T-004 acreditó el alcance previo de navegación/tabs y un smoke limitado; la auditoría integral de accesibilidad se mantiene pospuesta por su transversal. |
| HU27–HU28 | PARCIALES; mocks/UI implementados, contrato de entrada Run/artefacto por reconciliar | Reportes acreditan exploradores mock completos en Console. INTEROP §6.7 conserva únicamente las rutas de trazas por `experiments` y retiró la ruta equivalente por `test-runs`. El adapter de esas tres rutas puede implementarse contra el contrato vigente aunque Core aún no lo despliegue; la aceptación E2E requiere endpoints Core y un experimento real (HU48). Sigue sin resolverse la diferencia entre la entrada Run/artefacto pedida por la spec local y el contrato actual: no quitar esa experiencia ni reactivar la ruta retirada por inferencia. Ver `HU27-context-explorer-rag.md`, `HU28-agent-trajectory.md`, `spec/features/011-context-explorer/spec.md`, `spec/contracts/interoperability-contract.md` §6.7 y `app/src/context-explorer/api.ts`. |
| HU29 | SUPERSEDIDA | Login por correo pertenece al alcance anterior; HU62/`DEC-ORG-001` establecen GitHub como único login. |
| HU30 | HECHA (Console) | Discovery, binding y adapters live constan en `013-pr-driven-control-plane/tasks.md` y reportes HU30. |
| HU31 | IMPLEMENTADA CON VERIFICACIÓN LIVE PARCIAL (Core) | El reporte T-003 documenta un webhook real que creó un `AnalysisRun` y un Run posterior completado con Check en GitHub. Esto prueba el camino básico, no la matriz completa de eventos relevantes ni todos los casos de deduplicación/reentrega. La siguiente tarea es confirmar cobertura actual con Core; no partir de la hipótesis de que el controller no existe. Ver `harness/reports/HU35-HU36-HU39-HU40-live-adapters.md`. |
| HU32 | PARCIAL | Mock completo y adapters live de listado/detalle de AnalysisRun; la creación, deduplicación y obsolescencia por eventos son responsabilidad de Core. Ver `console-analysisrun-live-adapters.md` y tareas de feature 013. |
| HU33 | PENDIENTE SEGÚN CONTRATO (Core); despliegue actual por confirmar | INTEROP §6.2 aún indica que el snapshot derivado de `AnalysisRun` está pendiente. Un reporte histórico observó un commit Core `8bfec5b` no publicado en ese momento; eso no permite inferir el estado actual. Confirmar con Core antes de abrir implementación Console. |
| HU34 | PENDIENTE SEGÚN CONTRATO (Core); despliegue actual por confirmar | El contrato §6.2 agrupa el snapshot de `AnalysisRun` y la detección de símbolos bajo HU33/34. El reporte histórico menciona símbolos reales añadidos en el mismo commit no publicado entonces. Confirmar el estado actual del changeset, delta y símbolos con Core; Console solo consume resultados y no los reconstruye. |
| HU35–HU36 | HECHAS (Console) | Adapters live de Functional Knowledge, preguntas y continuación del Run constan en `HU35-HU36-HU39-HU40-live-adapters.md`. |
| HU37–HU38 | IMPLEMENTACIÓN CONSOLE HECHA; aceptación E2E live pendiente | Focus Mode, `returnTo`, inbox y adapters live están implementados. Falta probar con un AnalysisRun real que genere `ACTION_REQUIRED`, responder y verificar continuación/HEAD obsoleto. La tarea está separada para que el estado del consumidor no se confunda con el trabajo de Core. Ver reportes HU37–HU38, live adapters y T-004. |
| HU39–HU40 | HECHAS (Console) | Adapters live de propuestas/publicación y experiencia human-in-the-loop constan en `HU35-HU36-HU39-HU40-live-adapters.md`. Core publica el Check. |
| HU41–HU43 | ESTADO EXTERNO NO VERIFICADO | Soporte estructural PHP/Laravel, generación PHPUnit y perfil aislado PHP/PHPUnit pertenecen a Core/Sandbox. La Console no aporta evidencia actual de sus repositorios; revisar con los owners antes de planear cortes o declarar deuda pendiente. El orden lógico, si siguen pendientes, es HU41 → HU42 → HU43. |
| HU44 | PENDIENTE (P4) | Retiro controlado de adapters/mocks históricos GitHub que ya no tengan consumidores. Auditar referencias antes de borrar. |
| HU45 | SUPERSEDIDA | El modelo Owner/Maintainer/Reviewer se reemplazó por roles Admin/Maintainer/Reader derivados de GitHub (HU60). |
| HU46 | PENDIENTE / BLOQUEADA POR DECISIÓN | Mutation testing; `DEC-MET-001` solo bloquea investigación/implementación de esta capacidad. |
| HU47 | PENDIENTE / BLOQUEADA POR DECISIÓN | Sandbox remoto; `DEC-INF-001` bloquea aprovisionamiento remoto, no el desarrollo local. |
| HU48 | PARCIAL | Mock-first, selector y replay implementados. El adapter live devuelve `PendingContractError`; el controller Core está definido pero pendiente. Ver `spec/features/014-analysisrun-experiments/tasks.md`. |
| HU49 | PARCIAL / PROPUESTA P4 | Demo `ARMED/OFF` implementada, pero “próximo PR” se simula; no hay mecanismo/contrato live y depende de HU48. |
| HU50 | PARCIAL / ESPECULATIVA | Indicador mock derivado localmente; no hay campo contractual para cobertura previa en `AnalysisRunDetailResponse`. No presentar el cálculo local como dato de Core. |
| HU51 | IMPLEMENTADA (Core + adapter Console); aceptación E2E actual por confirmar | INTEROP §6.11 declara HU51 implementada por Core (2026-09-18); el reporte de adapters confirma manejo live de `409 FUNCTIONAL_KNOWLEDGE_CONFLICT` y `conflictResolution`. No es deuda de implementación. Si se prioriza, que sea solo una prueba E2E vigente del ciclo de conflicto, no reimplementar la capacidad. |
| HU52 | PARCIAL / PROPUESTA P2 | Panel demo usa coincidencia local por símbolo; no hay contrato ni vínculo persistido Run↔versión de la regla. Ver `HU49-HU52-speculative-closure.md`. |
| HU53 | PARCIAL | La UI muestra historia mock derivada de fixtures; el campo `history` aún no llega del controller live de Core. Contrato definido. |
| HU54 | PARCIAL / ESPECULATIVA | Lista mock de procedencia FK/tests en Run Detail; no son nodos del árbol y live rechaza la capacidad. Falta contrato adaptado a AnalysisRun. |
| HU55 | HECHA (Console) | Listado global live de Runs y agregación por workspace entregados en T-004; Core Bundle B se reporta desplegado. |
| HU56–HU57 | HECHAS en Console; validación live pendiente | UI, mock y adapters live de borrado lógico, pausa/reactivación y repositorio duplicado están implementados. El reporte T-002 dejó pendiente validar contra Core desplegado; no se marca como aceptación end-to-end hasta cerrar esa evidencia. El backlog conserva un estado histórico `PROPOSED` que debe reconciliarse con la aprobación consignada en el reporte. |
| HU58–HU60 | HECHAS en Console; aceptación real pendiente | Workspaces, roles y scoping entregados en T-004; Bundle B de Core se reporta desplegado. La revisión no validó membresías reales, webhooks ni reconciliación con una organización GitHub real. |
| HU61 | HECHA en la Console como consumo; verificación Core pendiente | La Console consume visibilidad derivada por servidor. Webhooks/reconciliación horaria son Core-owned y T-004 no los probó en vivo. |
| HU62 | HECHA (Console) | Login solo GitHub, errores de identidad y socket autenticado cerrados en T-003; HU29/email quedó retirado. |
| HU63–HU64 | HECHAS en Console; aceptación real pendiente | Creación/renombre/scoping y discovery/permiso por workspace entregados en T-004. La prueba con organizaciones reales sigue pendiente según el reporte T-004. |

## Discrepancias de documentación

1. `012-authentication/tasks.md` mantiene abiertas tareas genéricas pese a que C0–C5 de T-003 y su evidencia registran su implementación. No usar esas casillas como deuda sin contrastar cada criterio.
2. `013-pr-driven-control-plane/tasks.md` aún agrupa HU44–HU45 como pendientes; HU45 está supersedida por HU58–HU60.
3. `011-context-explorer/tasks.md` mantiene abiertas las tareas del explorador aunque HU27/HU28 tienen reportes de implementación mock; el pendiente concreto es la ruta live y la adaptación vigente.
4. `014-analysisrun-experiments/tasks.md` separa correctamente demo y live pendiente para HU48/HU49, pero `HU49-HU52-speculative-closure.md` llama “DONE” al cierre de sus demos. Para este inventario, el producto live sigue parcial.
5. Backlog y reportes discrepan en el estado formal de HU56–HU57; este informe conserva ambas evidencias sin resolver la decisión por inferencia.
6. HU58–HU64 siguen etiquetadas `Future/P4` en la tabla histórica aunque su implementación de Console se cerró en T-004. No se cambia la prioridad o el hito compartido en este informe.

## Priorización y work items candidatos

La prioridad del backlog se conserva. Lo siguiente es una secuencia propuesta por evidencia, ownership y dependencias; no crea HUs ni cambia su prioridad. Las HUs ya están registradas en `spec/backlog.md`; `harness/state.json` registra el work item activo y sus handoffs, no un duplicado de todo el backlog. Por eso los cortes siguientes son propuestas, no work items activos ni autorización para implementar. Al seleccionar uno, el líder lo abrirá conforme al formato vigente, pasará su `decisionGate` y ejecutará los roles/fan-out definidos por Harness V2.

### Fase actual — terminar T-005

`T-005-console-implementation-inventory` reconcilia el legado con la spec vigente, corrige discrepancias y deja la priorización lista para el siguiente work item de producto. La entrega no implementa cambios de producto. Los agentes ya participaron en paralelo bajo este work item y sus resultados se registran mediante los handoffs estándar de `execution.handoffs`; no se modificó la definición de Harness V2.

### Work items preparados para ejecutar en Harness V2

Estos son cortes derivados de HUs que ya existen en el backlog. No agregan historias nuevas ni cambian prioridades. Harness conserva un único `activeWorkItem`: T-006 fue activado, aprobado y cerrado; T-007 en adelante siguen preparados como siguientes cortes para activarse secuencialmente, cada uno con su propio `decisionGate` y handoffs. La lista no duplica el backlog: conserva `storyIds`, sprint/hito, paths, impactos y dependencias para abrir cada corte sin reconstruir el análisis.

| ID propuesto | Tipo; HUs; sprint/hito; impactos | Spec paths y alcance | Dependencia / salida verificable |
|---|---|---|---|
| `T-006-console-experience-foundation` — cerrado, `DONE` | PRODUCT; `storyIds: [HU25, HU26]`; Sprint 4; `uiImpact: true`, `contractImpact: false` | Paths: `spec/features/010-product-experience/spec.md`, `plan.md`, `tasks.md`; `spec/transversal/design-system/spec.md`, `tasks.md`; `spec/transversal/accessibility/spec.md`. Se actualizó el nombre visible a “RAG Test Studio” y se consolidó el shell global con primitives Black Glass existentes. No incluye auditoría WCAG integral ni migración de otras pantallas. | Análisis SDD y aprobación humana registrados; reviewer y ux-reviewer aprobaron. Tests/lint/build/validator pasan; Vite mantiene warning de bundle >500 kB. |
| `T-007-context-explorer-scope-alignment` | HARNESS (análisis); `storyIds: [HU27, HU28]`; Sprint 4; `uiImpact: false`, `contractImpact: false` mientras sea solo análisis | Paths: `spec/features/011-context-explorer/spec.md`, `tasks.md`, `spec/contracts/interoperability-contract.md`. Resolver cómo se satisface la entrada Run/artefacto de la spec local cuando el contrato vigente solo conserva trazas por `experiments` y retiró `test-runs`. No editar el comportamiento ni retirar requisitos por inferencia. | Debe producir conclusión aprobada o pregunta/decisión concreta. Bloquea declarar completa la entrada Run/artefacto; no bloquea un corte adapter limitado a las rutas experimentales contractuales. |
| `T-008-context-traces-experiment-adapter` | PRODUCT; `storyIds: [HU27, HU28]`; Sprint 4; `uiImpact: true`, `contractImpact: true` | Paths: `spec/features/011-context-explorer/spec.md`, `plan.md`, `tasks.md`, `spec/contracts/interoperability-contract.md`. Implementar solo las tres rutas experimentales vigentes, manteniendo el mock. No inventar DTOs ni activar endpoints run-scoped. | El adapter puede desarrollarse contra el contrato sin esperar despliegue Core. La aceptación E2E requiere endpoints disponibles y un experimento real vía HU48. La entrada Run/artefacto queda como alcance aparte hasta cerrar T-007. |
| `CORE-WI-HU31-verification` | Work item Core; HU31; Hito B; fuera del estado Console | El owner Core registra las specs/paths de su repo; verificar matriz de eventos, idempotencia y reentregas. | Ya hay evidencia de webhook real y AnalysisRun exitoso. Abrir implementación solo si Core confirma un criterio incumplido; registrar en el harness propietario de Core. |
| `CORE-WI-HU33-HU34-status` | Work item Core; HU33, HU34; Hito C; fuera del estado Console | El owner Core registra INTEROP §6.2 y paths de su repo; confirmar snapshot/changeset, index delta y símbolos en la versión actual. | La spec vigente aún marca pendiente. Core confirma brecha/implementación; Console no reconstruye estas capacidades. Registrar en el harness Core. |
| `T-009-console-hu48-live-adapter` | PRODUCT Console; `storyIds: [HU48]`; Hito G; `uiImpact: true`, `contractImpact: true` | Paths: `spec/features/014-analysisrun-experiments/spec.md`, `plan.md`, `tasks.md`, `spec/contracts/interoperability-contract.md` §6.5. Implementar solo el adapter live Console conforme al contrato existente. | Su desarrollo puede correr en paralelo con `CORE-WI-HU48-controller`; aceptación E2E requiere API publicada y AnalysisRun real/estable (HU30/HU32). |
| `CORE-WI-HU48-controller` | Work item Core; HU48; Hito G; fuera del estado Console | El owner Core registra controller/DTO paths conforme a INTEROP §6.5. | Puede desarrollarse en paralelo con el adapter Console; aceptación E2E requiere un AnalysisRun real/estable. |
| `CORE-WI-HU53-history-endpoint` | Work item Core; HU53; Hito H; fuera del estado Console | El owner Core registra sus paths y define/implementa historial persistido conforme a INTEROP §6.10. | Precede a la aceptación live Console; primero confirmar estado actual Core. |
| `T-010-console-hu53-history-live` | PRODUCT Console; `storyIds: [HU53]`; Hito H; `uiImpact: true`, `contractImpact: true` | Paths: `spec/features/014-analysisrun-experiments/spec.md`, `plan.md`, `tasks.md`, `spec/contracts/interoperability-contract.md`; consumir el historial contractual live en Console. | Depende de que Core confirme o publique el endpoint/persistencia correspondiente. El mock no acredita persistencia ni endpoint live. |

El harness de Core debe abrir sus propios work items; no se modifica desde este repositorio. HU41–HU43 también pertenecen a Core/Sandbox, pero quedan en **estado externo no verificado**: no crearles work items de implementación hasta confirmar el estado actual de esos owners.

### Siguiente desbloqueo por dependencia

1. **HU48 live (P1):** Core y Console pueden trabajar en paralelo contra el contrato existente de INTEROP §6.5: controller Core y adapter Console son cortes separados. La aceptación E2E espera que Core publique la API y que HU30/HU32 produzcan un `AnalysisRun` real y estable. La Console ya tiene mock-first.
2. **HU27–HU28 aceptación live (P0):** el adapter contractual de trazas puede avanzar en paralelo, pero la prueba E2E necesita endpoints Core disponibles y experimentos reales de HU48. La reconciliación pendiente de la entrada Run/artefacto es separada y no se resuelve declarando obsoleta la spec local.
3. **HU53 live (P1):** confirmar/implementar el historial de transiciones en Core y después verificar el consumo Console. La historia mock no acredita persistencia ni endpoint live.

### P1/P2/P4 después de confirmar el estado de sus owners

- **HU51:** ya implementada según INTEROP §6.11 y evidencia del adapter live. No crear trabajo de implementación; como máximo, una prueba E2E actual del 409 y de `SUPERSEDE`/`KEEP_EXISTING`.
- **HU41–HU43:** primero preguntar/confirmar estado en Core y Sandbox. Si siguen pendientes, separar HU41 → HU42 → HU43 en work items por owner, con HU42 dependiente de HU41 y HU43 de la capacidad PHPUnit acordada.
- **HU50 y HU54:** propuestas sin contrato completo; no reemplazar sus mocks con una integración inventada. Requieren definición/aprobación canónica antes del trabajo live.
- **HU52:** P2 y sin vínculo/versionado contractual Run↔regla; posponer hasta aprobar esa forma.
- **HU46 / HU47:** siguen condicionadas respectivamente por `DEC-MET-001` / `DEC-INF-001`. **HU49** depende de HU48 live y de un disparador aprobado. **HU44** es limpieza P4 después de comprobar consumidores.

### Paralelismo de agentes

Al seleccionar el siguiente work item, el líder asigna los roles compatibles en paralelo según Harness V2: `sdd-analyst` antes de implementar y, en `before-review`, `reviewer` junto con `ux-reviewer` o `contract-reviewer` según impacto. El informe propone cortes que podrían avanzar en paralelo —por ejemplo HU25–HU26 en Console y verificación de HU31/HU33–HU34 por Core—; al abrir cada work item real, sus agentes devuelven handoffs estándar en `execution.handoffs` y el líder consolida el fan-in. Una propuesta de corte no reemplaza selección, decision gate ni aprobación.

## Decision gate y CONTRACT_SYNC

- Work item HARNESS sin impacto funcional, UI ni contrato.
- `DEC-MET-001`, `DEC-INF-001`, `DEC-VAL-001` y `DEC-EXP-FK-001` se revisaron; ninguno bloquea este inventario. Cada uno conserva su `Blocks` para los work items que sí le aplican.
- CONTRACT_SYNC `start` e `implementation-delivery`: sin eventos relevantes `PENDING` para Console.
- No se modificaron `spec/`, contratos, código de producto, backlog compartido ni prioridades oficiales.

## Cierre de T-005

- `reviewer`: APPROVED, sin findings ni blockers abiertos; se corrigieron las discrepancias de HU31, HU33–HU34, HU41–HU43 y HU51 y se documentó el conflicto de alcance Run/artefacto de HU27–HU28 sin resolverlo por inferencia.
- `CONTRACT_SYNC before-done`: sin eventos relevantes PENDING (`2026-09-24T04:47:00.527Z`).
- `node harness/validate-harness.mjs` y `git diff --check`: pasaron. No se ejecutaron pruebas de aplicación porque T-005 solo modifica inventario/priorización.
- `T-005-console-implementation-inventory` queda DONE. El siguiente corte priorizado fue `T-006-console-experience-foundation` (HU25/HU26), abierto como único work item activo mientras se ejecutó.

## Cierre de T-006 — 2026-09-24

- `sdd-analyst`: APPROVED, sin blockers. Confirmó que el corte solo corrige el nombre visible y consolida canvas/topbar/navegación del shell usando tokens Black Glass existentes; no reimplementa lo cubierto por T-004 ni añade auditoría WCAG integral.
- `decisionGate`: revisado; cero decisiones bloqueantes. `DEC-MET-001`, `DEC-INF-001`, `DEC-VAL-001` y `DEC-EXP-FK-001` quedan registrados como no bloqueantes para T-006.
- La usuaria aprobó el alcance el 2026-09-24. El work item completó `start`, `implementation-delivery`, `before-review` y `before-done`, sin sync relevante pendiente.
- El implementer actualizó el título del documento, el login y la marca a RAG Test Studio; consolidó canvas, topbar y navegación con tokens existentes; preservó rutas, semántica y responsive. Archivos: `app/index.html`, `app/src/auth/LoginPage.tsx`, `app/src/styles.css`, `app/src/ui/AppShell.tsx` y `app/src/ui/AppShell.test.tsx`.
- Fan-out paralelo: `reviewer` y `ux-reviewer` APPROVED, sin blockers. Reviewer observó un primer fallo intermitente de HU28, no relacionado con este diff; la prueba aislada y una segunda ejecución completa pasaron. UX verificó nombre, landmarks, navegación, foco visible y breakpoints de 900/680 px.
- Verificación: `npm test` (69 archivos/475 pruebas), test puntual AppShell (6/6), `npm run lint`, `npm run build`, `git diff --check` y `node harness/validate-harness.mjs` pasaron. Build conserva warning de Vite por chunk principal >500 kB.
- No fue posible hacer smoke visual en navegador: el servidor local pudo iniciar con permiso, pero la superficie CUA no tenía navegador disponible. La revisión UX estática aprobó sin blockers; no equivale a auditoría WCAG integral.
- No se modificaron especificaciones, contratos ni la definición del Harness V2. Al cerrar, `harness/state.json` vuelve a `activeWorkItem: null`; T-007 y los siguientes quedan preparados en este informe para activación secuencial.
