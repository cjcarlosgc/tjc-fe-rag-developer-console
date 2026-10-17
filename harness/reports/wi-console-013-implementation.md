# WI-CONSOLE-013 — Implementación

Modelo: implementer · configurado claude-haiku-5-5 · esfuerzo low (Corte A y Corte B secuenciales; sin escalamiento). Sin commit.

Corte A (rol WRITER): `ProjectRole` con WRITER, `projects/roles.ts` (`hasRole`) y `roles.test.ts`, reemplazo de comprobaciones en Experiment, RunComparison, AnalysisRunDetail, Integrations, ProjectDetail (`canOperate`) y FocusMode (`canAnswer` = MAINTAINER), rank y `requireProjectRole` del mock, seed `prj_org_writer_demo` / `arun_org_writer_pr21`.
Corte B (abstención): tipos `ScenarioKind`, `FunctionalAbstentionSummary`, `outcome`; `abstention.ts`; mock UNKNOWN -> ABSTAINED sin avanzar; Focus Mode y Action Required; live UNKNOWN -> `PendingContractError`.
Ajustes del leader tras ux-reviewer: fecha con `formatDate`, contenedor `role="status"` siempre montado; badge de AppShell.test 5 -> 6 por el nuevo seed.

Verificación (app/): `tsc -b --noEmit` ok; `npm run lint` ok; `npm run build` ok; `vitest run --maxWorkers=2` 55 archivos / 459 pruebas ok (corrida usada; una corrida previa con 1 fallo fue la regresión determinista del badge, ya corregida); `node harness/validate-harness.mjs` ok.
Mocks siguen rotulados DEMO · DATOS SIMULADOS; live no usa campos no publicados.
Revisión contractual (advisory, contractImpact=false): APPROVED; supuesto anotado: con HEAD cambiado y UNKNOWN el mock devuelve ABSTAINED/OBSOLETE sin registrar abstención (§6.11 no fija el outcome; confirmar en WI-CORE-018).
