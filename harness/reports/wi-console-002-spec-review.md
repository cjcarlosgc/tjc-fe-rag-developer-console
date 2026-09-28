# Revisión pre-tarea — WI-CONSOLE-002

Fecha: 2026-09-24. Estado inicial revisado: `W-SELECTED`; Contract Sync `start` vigente.

## Alcance y aceptación

- Retirar rutas, pantallas, APIs mock/live y fixtures de entrada manual ZIP, generación manual y TestRun/historial/reintento/descarga de artefactos.
- Mantener el historial de `ProjectVersion` y los inventarios actuales/históricos como lectura del snapshot interno; no deben ofrecer acciones que lleven a upload/generación manual.
- Mantener AnalysisRuns PR-driven, review/diff de propuestas, publicación mediante companion PR, trazas PR/experimentales y experimentos.
- No borrar evidencia ni alterar los contratos públicos SYSTEM-2.4/INTEROP-2.4. El ZIP interno para Docker/Sandbox no es una superficie de Console.

## Decisiones y riesgos

`DEC-INF-001` (infraestructura remota), `DEC-VAL-001` (ingestión/despliegue de código empresarial) y `DEC-EXP-FK-001` (experimentos con Functional Knowledge) siguen `PENDING`; sus campos `Blocks` no alcanzan este corte. No hay decisión bloqueante. Riesgo de datos: no se purgan snapshots ni registros almacenados; solo se eliminan experiencias de producto y simulaciones de acciones manuales.

## Resultado

Spec revisada contra `spec/features/013-pr-driven-control-plane/{spec,plan,tasks}.md`, SYSTEM-2.4 e INTEROP-2.4. La clasificación Contract Sync está anclada por digest en `harness/work-items.json` y explicada en `harness/reports/contract-sync-relevance-wi002-3.0.md`. El gate SDD y el gate de decisiones pasan; el usuario ya aprobó este alcance en la conversación.
