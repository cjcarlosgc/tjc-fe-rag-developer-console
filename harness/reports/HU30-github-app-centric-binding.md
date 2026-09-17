# HU30 — Repository binding user-centric (INTEROP-2.2 §6.8)

**Estado:** DONE (mock-first reconciliado; live sigue sin activar)
**Repository:** `tjc-fe-rag-developer-console`

## Contexto

Core reemplazó en SYSTEM-2.2/INTEROP-2.2 (2026-09-17, solo especificación) el
flujo de repository binding "installation-centric" (instalar la GitHub App
desde la Console → completar con un repo elegido en un `<select>` de
fixtures) por uno "user-centric": discovery de repositorios visibles del
usuario vía OAuth (provider token efímero) → verificación de si la GitHub App
ya tiene acceso a ese repo concreto (`AUTHORIZED`/`NOT_AUTHORIZED`, con CTA de
configuración y revalidación) → listado de sus ramas reales → creación del
binding sin que el navegador envíe `installationId` (lo resuelve Core). El
sync de contrato se comiteó aparte (`971b997`, solo `spec/`). Este work item
es la reconciliación del mock-first de Console — el propio `tasks.md` de la
feature 013 lo marcaba explícitamente "requiere selección humana" y "sin
activar live hasta aprobación humana explícita", que sigue sin darse.

El usuario pidió explícitamente comitear el sync de SDD antes de tocar
código, luego aprobó un plan detallado (`EnterPlanMode`/`ExitPlanMode`) antes
de ejecutar, siguiendo el patrón ya establecido para cortes grandes.

## Cambios

- **`control-plane/types.ts`**: reemplaza `GitHubInstallationSessionResponse`/
  `CompleteGitHubInstallationRequest` por `GitHubUserRepositoryResponse`,
  `GitHubUserRepositoryPage`, `GitHubAppAccessStatus`/`VerifyGitHubAppAccessRequest`/
  `GitHubAppAccessResponse`, `GitHubRepositoryBranchResponse`/
  `GitHubRepositoryBranchesResponse`, `CreateRepositoryBindingRequest` — copiados
  de INTEROP-2.2 §6.8. `ProjectRepositoryBindingResponse` no cambió de forma.
- **`api/mockBackend.ts`**: `mockListGitHubUserRepositories` (sin paginación
  real, fixture pequeño), `mockVerifyGitHubAppAccess` (`repo_playground`
  necesita 2 verificaciones para pasar a `AUTHORIZED`, demuestra el CTA de
  configuración + "Revalidar"; el resto de repos conocidos autorizan desde la
  primera), `mockListGitHubRepositoryBranches` (403
  `GITHUB_APP_ACCESS_REQUIRED` si el repo nunca verificó acceso — refleja
  "las ramas se consultan con el installation access token"),
  `mockCreateRepositoryBinding` (409 si el proyecto ya tiene binding
  `ENABLED`, 403 si el repo no está autorizado, 404 si la rama no existe en
  el fixture). Se retiraron `mockStartGitHubInstallation`/
  `mockCompleteGitHubInstallation`.
- **`control-plane/demoRepositories.ts`**: `DEMO_GITHUB_REPOSITORIES` (4
  repos: `checkout`/`billing` ya vinculados en el seed, `notifications`
  camino feliz corto, `playground` NOT_AUTHORIZED→AUTHORIZED).
- **`control-plane/api.ts`/`queries.ts`**: 4 funciones/hooks nuevos
  (`listGitHubUserRepositories`, `verifyGitHubAppAccess`,
  `listGitHubRepositoryBranches`, `createRepositoryBinding`), todas
  `PendingContractError` en modo live — sin excepción, no se activa nada
  contra Core real.
- **Auth** (`auth/types.ts`, `auth/adapters/{mock,supabase}AuthAdapter.ts`,
  `authContext.ts`, `AuthProvider.tsx`): `AuthSession` gana
  `githubProviderToken: string | null`; nuevo método `linkGitHub()` que
  vincula GitHub (scope `repo`) a una sesión de correo ya iniciada sin
  cambiar de usuario de plataforma (HU29, INTEROP-2.2). El adapter real usa
  `auth.linkIdentity` de `@supabase/supabase-js` (no probado en vivo, mismo
  patrón que el resto de la integración Supabase).
- **`control-plane/IntegrationsPage.tsx`**: reescritura del bloque "sin
  binding" en 4 pasos (CTA "Conectar GitHub" si la sesión no tiene el
  provider token → buscador + lista de repos descubiertos → verificación de
  acceso de la App, con CTA de configuración/revalidación si
  `NOT_AUTHORIZED` → selector de rama real y botón "Vincular repositorio" si
  `AUTHORIZED`). El bloque "con binding" (resumen + desconectar) no cambió.

## Decisiones de simplificación de demo (documentadas en código)

- El mock no valida el header `X-GitHub-Provider-Token` del contrato — es la
  propia UI quien decide mostrar el CTA de conexión según
  `authSession.githubProviderToken`, evitando duplicar una validación que no
  tiene servidor real detrás.
- Discovery no pagina de verdad (`nextCursor` siempre `null`): el fixture es
  de 4 repos.
- `linkGitHub()` en mock simplemente marca la sesión existente con un
  provider token ficticio, sin popup real de GitHub — mismo patrón ya usado
  para `signInWithGitHub`.
- "Revalidar" es instantáneo (sin espera real de que el usuario configure
  algo en GitHub entre medio) — el mock cuenta intentos, no verifica un
  estado externo real.

## Verificación

`pnpm exec tsc -b --noEmit`, `pnpm lint`, `pnpm exec vitest run` (298 pruebas
en verde, +16 sobre las 282 previas) y `pnpm build` limpios. Recorrido manual
en navegador confirmado esta vez (la extensión Claude in Chrome sí conectó,
a diferencia de sesiones recientes): CTA "Conectar GitHub" con una sesión de
correo sin token, discovery de los 4 repos, camino feliz
(`acme/notifications-service`, `AUTHORIZED` de una, elige rama `develop`,
crea el binding), y camino NOT_AUTHORIZED→"Revalidar"→`AUTHORIZED`
(`demo-user/integration-playground`, rama `main`) — sin errores de consola
en ningún paso.

## Nota de proceso

Durante este corte se detectó que `pnpm exec tsc --noEmit` (sin `-b`) no
verificaba nada en este repo: `tsconfig.json` raíz tiene `"files": []` y usa
`references` a `tsconfig.app.json`/`tsconfig.node.json`, así que sin `-b` no
sigue esas referencias y termina en verde aunque haya errores reales (se
confirmó dejando código roto adrede y viendo que `tsc --noEmit` no lo
detectaba, mientras `tsc -b --noEmit` sí). El script `build` del repo
(`tsc -b && vite build`) siempre fue correcto porque ya usa `-b`, así que los
cortes anteriores cuyo cierre corrió `pnpm build` completo no están
afectados — el hallazgo es específico de usar `tsc --noEmit` como atajo
intermedio durante la implementación. De ahora en adelante, usar
`tsc -b --noEmit` para chequeos intermedios.

## Fuera de alcance

- Adapter live de las 4 rutas nuevas — sigue `PendingContractError` hasta
  aprobación humana explícita.
- Multi-org, RBAC — ya diferido en `spec/backlog.md` ("Evoluciones
  posteriores de repository binding").
- Cambios a `LoginPage.tsx` — el botón "Continuar con GitHub" no cambió de
  UI, solo pide `scope: repo` por debajo.
