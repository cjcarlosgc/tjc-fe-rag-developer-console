# WI-CONSOLE-040 · Revisión independiente: pnpm como gestor único

Modelo: reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Veredicto: **APPROVED** (lane FAST; sin hallazgos bloqueantes).

## Verificaciones propias

| Punto | Resultado |
|---|---|
| Restos de npm vigentes | `git grep -E '\bnpm\b|package-lock'` fuera de reportes, CHANGELOG pasado, `spec/contracts/*`, `.agents/skills` y `app/pnpm-lock.yaml` solo devuelve texto del propio WI (`harness/work-items.json`, `harness/state.json`, `tasks.md`). Sin npm en `.github/`, `app/package.json`, `app/scripts`, `app/src`. `git ls-files` no contiene ningún `package-lock.json`/`yarn.lock`. |
| `app/pnpm-lock.yaml` | `git diff --numstat`: +158/-0. Solo añade un documento YAML previo (formato de lockfile de entorno de pnpm 12: `packageManagerDependencies` con `pnpm 12.14.0` y sus `@pnpm/exe.*` opcionales por plataforma). El lockfile de dependencias de la app queda intacto. Justificado: con `packageManager` declarado, pnpm 12 exige esa sección y `--frozen-lockfile` falla sin ella (el implementer lo comprobó con el lockfile de HEAD). Sin cambio de dependencias de la app. |
| `pnpm install --frozen-lockfile` | OK («Lockfile is up to date», pnpm 12.14.0). |
| `.claude/launch.json` | JSON válido (`python3 -m json.tool`). `pnpm --dir app dev -- --port 5173 --strictPort` equivalente al comando npm previo. |
| README | Sección «Desarrollo» correcta (corepack, `pnpm install --frozen-lockfile`, scripts existentes en `app/package.json`; Node 22 según `.nvmrc`). |
| `tech-stack.md` | Coherente: pnpm único, `pnpm-lock.yaml` único lockfile; el Sandbox V1 exige `pnpm-lock.yaml` en los proyectos objetivo, redactado como restricción de los proyectos, no de la SPA. |
| `tasks.md`, CHANGELOG | ST-CONSOLE-042 pasa a T-IN_PROGRESS; entrada de CHANGELOG precisa. |
| Comportamiento/contrato | Sin cambios en `app/src`, dependencias, rutas ni DTO. Solo tooling y documentación. |

## Gates (Node 22)

| Gate | Resultado |
|---|---|
| `node scripts/sdd-check.mjs` | SDD check OK |
| `node harness/validate-work-items.mjs` | OK (CONSOLE, 42 WI) |
| `node harness/validate-harness.mjs` | OK |
| `node harness/validate-completions.mjs` | OK (36 WI completados) |
| `pnpm lint` | OK |
| `pnpm exec tsc -b --noEmit` | OK (exit 0) |
| `pnpm test` | OK: 79 archivos, 840/840 pruebas (un primer intento se interrumpió por carga de la máquina, no por fallo; repetido con `--maxWorkers=4`) |
| `pnpm build` | OK; solo aviso preexistente de chunk >500 kB |
| `pnpm format:check` | OK |

## Observaciones no bloqueantes

- La regeneración de `pnpm-lock.yaml` no estaba prevista en el alcance; el implementer la declaró y queda para conocimiento del Human Reviewer. Es aditiva y necesaria para `packageManager`.
- `pnpm@12.14.0` en `packageManager` obliga a CI (`corepack enable`) a usar esa versión; `ci.yml` ya era pnpm-only y no requirió cambios.
- `app/package-lock.json` queda como deleción en el índice; el resto sin stagear. No hay commit.
