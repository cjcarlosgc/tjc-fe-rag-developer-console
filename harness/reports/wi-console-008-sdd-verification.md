# WI-CONSOLE-008 — Verificación SDD

- **WI/ST/HU:** `WI-CONSOLE-008` / `ST-CONSOLE-010` / `HU12, HU14`.
- **Componente/prioridad/sprint:** `CONSOLE` / `P2` / `Post-transition`.
- **Dependencia local:** `WI-CONSOLE-003` está `W-DONE`.
- **Dependencias externas:** `WI-CORE-011` y `WI-GH-007` están `W-DONE`; sus eventos fueron importados y acusados por Console. La evidencia cruzada está en `wi-console-008-external-dependency-gate.md`.
- **Alcance:** espejar byte por byte los contratos canónicos SYSTEM e INTEROP de Core y GitHub Integration de GH; revisar la compatibilidad del consumidor existente de Runs; no cambiar la UI ni el comportamiento del producto.
- **Decisiones:** no hay decisiones `PENDING` o `PROPOSED` cuyo campo `Blocks` alcance este WI. `DEC-INF-001` limita aprovisionamiento remoto, `DEC-VAL-001` ingestión/despliegue empresarial y `DEC-EXP-FK-001` experimentación con Functional Knowledge; ninguna bloquea sincronizar estos contratos ni verificar Runs.
- **Riesgos/invariantes:** no afirmar despliegue/cutover; no cambiar Sandbox; no usar fecha de recepción como fecha del PR; conservar el filtrado de Runs delegado a Core.
- **Resultado:** `G-PASSED`; se puede implementar el alcance autorizado.

## Evidencia de análisis

La revisión de `sdd-analyst` confirmó la trazabilidad WI↔ST↔HU, los estados de las dependencias y que el consumidor Console pasa `projectId` al endpoint de Core. No encontró blockers. Los espejos actuales todavía difieren de sus fuentes; el cambio previsto se limita a homologarlos y documentar la recepción de los eventos.

## Rutas canónicas

- Core: `spec/contracts/system-contract.md`, `spec/contracts/interoperability-contract.md`.
- GitHub Integration: `spec/contracts/github-integration-contract.md`.
- Fuente vigente y tareas Console: `spec/README.md`, `spec/features/016-github-integration/{spec,plan,tasks}.md`, `harness/work-items.json`.
