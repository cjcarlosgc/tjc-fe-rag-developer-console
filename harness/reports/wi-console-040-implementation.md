# WI-CONSOLE-040 · Implementación: pnpm como gestor único

Modelo: implementer · configurado claude-haiku-5-5 · atendido unknown · esfuerzo low

Alcance aprobado: `harness/reports/wi-console-040-scope-approval.md` (vía rápida). Sin commit, sin push, sin cambios en `harness/work-items.json`, `harness/state.json` ni `harness/contract-sync`.

## Archivos tocados

| Archivo | Cambio |
|---|---|
| `app/package-lock.json` | Eliminado con `git rm` (deleción en índice). |
| `app/package.json` | Añadido `"packageManager": "pnpm@12.14.0"` (salida de `pnpm -v`). Sin cambios en dependencias. |
| `app/pnpm-lock.yaml` | **Modificado por pnpm 12** (+158 líneas, 0 eliminadas). Ver «Punto de atención». |
| `.claude/launch.json` | `npm --prefix app run dev` → `pnpm --dir app dev` (resto de argumentos sin cambio: `--port 5173 --strictPort`). |
| `spec/constitution/tech-stack.md` | «npm como package manager» → pnpm como gestor único; reescrita la frase del Sandbox V1 (pnpm es el gestor de la SPA; el Sandbox exige `pnpm-lock.yaml` en los proyectos objetivo). |
| `README.md` | Nueva sección «Desarrollo» (`corepack enable`, `cd app && pnpm install --frozen-lockfile`, `pnpm dev|lint|test|build`). |
| `CHANGELOG.md` | Una línea nueva al inicio de `[Unreleased]` (WI-CONSOLE-040). |

No se modificó `.github/workflows/ci.yml`: ya usa `corepack enable`, `cache: pnpm`, `pnpm install --frozen-lockfile` y `pnpm <script>`; no contiene npm.

## Greps de restos de npm

Comando: `grep -rIn --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist -E "\bnpm\b|package-lock" .`

Revisión por categorías:

- **Corregidos (vigentes):** `.claude/launch.json`, `spec/constitution/tech-stack.md`. Sin hits en `README.md`, `.github/`, `app/package.json`, `app/scripts/`, `app/src/`.
- **Quedan, justificados:**
  - `app/pnpm-lock.yaml` (líneas `engines: {npm: ...}` de metadatos de dependencias de terceros): contenido generado de terceros, no referencia de tooling.
  - `app/package-lock.json`: eliminado; sus restos ya no existen en el árbol.
  - `spec/contracts/interoperability-contract.md` línea 1393: contrato espejado de Core (`NODE_TYPESCRIPT` exige `pnpm-lock.yaml`; npm produce `UNSUPPORTED_PACKAGE_MANAGER`). No se toca (`spec/contracts/*` fuera de alcance).
  - `.agents/skills/accessibility/SKILL.md` (`npm install @axe-core/cli -g`): skill de terceros; fuera de alcance (`.agents/skills/*`).
  - `spec/transversal/testing/tasks.md`: solo menciona npm en la descripción del propio WI-CONSOLE-040 (ya modificado por el harness).
  - `harness/work-items.json`, `harness/state.json`: texto del propio WI (criterios de aceptación); no se editan.
  - `CHANGELOG.md` (entradas pasadas) y `harness/reports/*` (históricos): no se reescriben.

## Punto de atención: `app/pnpm-lock.yaml`

Con `packageManager: "pnpm@12.14.0"`, pnpm 12 quiere registrar una sección `packageManagerDependencies` en el lockfile. Verificado:

1. Con el lockfile de HEAD, `pnpm install --frozen-lockfile` **falla** (exit 1): «Cannot update packageManagerDependencies with "frozen-lockfile" because the lockfile is not up to date».
2. Una instalación normal (sin frozen) reescribe el lockfile añadiendo la cabecera `lockfileVersion: '9.0'`, `importers` con `packageManagerDependencies` y los paquetes `@pnpm/exe.*@12.14.0` (solo adiciones, 158 líneas).
3. Con ese lockfile regenerado, `pnpm install --frozen-lockfile` pasa (exit 0).

Decisión tomada: se conserva el lockfile generado por pnpm 12 porque sin él CI y la instalación congelada fallan. Es una regeneración que el alcance no preveía; **requiere confirmación del Human Reviewer**. Copia del lockfile generado en el scratchpad de la sesión. Alternativa si no se acepta: quitar `packageManager` (incumple el objetivo) o fijar la versión de pnpm en CI sin `packageManager`.

Nota: `git rm` deja `app/package-lock.json` como deleción en el índice (staged); el resto de cambios está sin stagear.

## Gates (desde `app/`, con `PATH=$HOME/.local/node22/bin`)

| Gate | Resultado |
|---|---|
| `pnpm install --frozen-lockfile` | OK con el lockfile generado (exit 0). Con el de HEAD: exit 1 (ver arriba). |
| `pnpm contracts:check` | OK, exit 0. |
| `pnpm lint` (`eslint .`) | OK, exit 0, sin errores. |
| `pnpm exec tsc -b --noEmit` | OK, exit 0, sin salida. |
| `pnpm test` (`vitest run`) | OK: 79 archivos, 840/840 pruebas. |
| `pnpm build` (`tsc -b && vite build`) | OK, exit 0. Solo el aviso habitual de chunk >500 kB (preexistente). |
| `pnpm format:check` | OK: «All matched files use Prettier code style!», exit 0. |
| `pnpm --dir app dev --help` | Sintaxis válida (vite 8.2.2 acepta `--port` y `--strictPort`). No se dejó ningún servidor levantado. |

Nota sobre gates: la verificación de códigos de salida de lint/build/test se hizo por pipeline en parte del log; los resultados textuales son los reales de cada comando.

## Pendiente para el Human Reviewer

- Aceptar o rechazar la regeneración de `app/pnpm-lock.yaml` (ver «Punto de atención»).
- Decidir el commit (no se ha hecho commit ni push).
