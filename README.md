# tjc-fe-rag-developer-console

Control plane web PR-driven para proyectos con repositorios vinculados, AnalysisRuns, Action Required, trazabilidad, revisión/publicación de pruebas y comparación opcional RAG vs GENERALIST_AGENT. No ofrece carga manual de código ZIP; el snapshot ZIP interno pertenece al backend/Sandbox.

## Estructura

- `spec/`: fuente funcional/técnica vigente.
- `harness/`: workflow, estado y evidencia de implementación.
- `scripts/`: validadores neutrales de SDD.
- `.claude/` y `.agents/`: adaptadores opcionales; no son fuente de verdad.
- `app/`: código fuente generado.

## Inicio

1. Leer `AGENTS.md`.
2. Leer `spec/README.md`.
3. Ejecutar `node scripts/sdd-check.mjs`.
4. Seleccionar un WI local de `harness/work-items.json` enlazado desde `tasks.md`, registrarlo en `harness/state.json` y ejecutar `node harness/validate-harness.mjs`.
