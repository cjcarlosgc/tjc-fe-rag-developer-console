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

## Desarrollo

Gestor de paquetes único: pnpm (versión fijada en `app/package.json`, campo `packageManager`). Node 22 según `app/.nvmrc`.

```sh
corepack enable
cd app && pnpm install --frozen-lockfile
pnpm dev        # servidor de desarrollo
pnpm lint
pnpm test
pnpm build
```

## Pruebas live: configuración de URLs

- `VITE_CORE_API_URL`: Core. Por aquí van todas las rutas de Console, incluidas la publicación de pruebas (`POST /analysis-runs/{id}/test-publications` y `GET /test-publications/{id}`).
- `VITE_GITHUB_INTEGRATION_API_URL`: GitHub Integration para las pantallas de capacidades GitHub directas. En pruebas live debe apuntar al GitHub Integration real (`https://tjc-be-github-integration-api.onrender.com`), no a `http://localhost:3002`, salvo que tengas un GitHub Integration local levantado. Con `localhost` sin ese servicio aparecen llamadas 404 «github».
- La publicación live de un companion PR depende además de que Core apunte a su propio GitHub Integration real; esa configuración vive en Core, fuera de este repositorio.
- No pongas secretos en estas variables ni en el repositorio. Los valores de ejemplo de `app/.env.example` son públicos.
