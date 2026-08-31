# tjc-fe-rag-developer-console

Cliente web orientado a desarrolladores para registrar proyectos, cargar ZIP, seguir indexaciones/generaciones, revisar resultados y ejecutar la comparación experimental RAG vs baseline.

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
4. Seleccionar trabajo en `harness/state.json`.
