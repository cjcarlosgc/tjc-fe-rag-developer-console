# Reorientación de Console a SDD 2.0 + login GitHub mock

**Estado:** DONE
**Repository:** `tjc-fe-rag-developer-console`
**Story IDs:** HU29 (ampliado), HU30, HU44 (mapa de confirmación)

## Contexto

Tras revisar en navegador la demo completa de HU30/32/39/40 (control plane mock),
el usuario pidió dos cosas: (1) que el flujo ZIP deje de ser la navegación/UX
principal de la Console, sin borrar capacidades reutilizables, y (2) un mock más
completo de login + binding GitHub. Se le presentó primero un mapa
KEEP/ADAPT/DEFER/DROP para acordar el alcance exacto antes de tocar código.

## Mapa KEEP / ADAPT / DEFER / DROP (acordado antes de implementar)

Verificado por grep: **no existe código del demo GitHub viejo** (login→listar
repos→importar) en `src/` — solo se mencionaba como exploración en specs/Stitch,
nunca implementada. Nada que `DROP` a nivel de código.

| Capacidad | Clasificación | Resultado |
|---|---|---|
| Projects (listar/crear) | ADAPT | Banner y copy ahora apuntan al tour SDD 2.0 |
| Repository binding (Integrations) | KEEP | Sin cambios de fondo; refuerzo narrativo con la identidad de sesión |
| Project detail | ADAPT | Solo binding + link a Runs + link discreto a legacy |
| ZIP/análisis/inventario/generación/artifacts/experimentos/context explorer | DEFER | Código, rutas y pruebas intactos; se reubica el punto de entrada a `LegacyToolsPage` |
| Analysis Runs, Action Required | KEEP | Sin cambios |
| Demo GitHub viejo | N/A | No existía código; nada que borrar |

**Ningún archivo de dominio se eliminó ni perdió cobertura de pruebas** — la
reorientación fue puramente de navegación/entrada, no de eliminación de capacidad.

## Cambios implementados

- **Login GitHub mock (HU29 ampliado):** `AuthAdapter.signInWithGitHub()`.
  `mockAuthAdapter` simula una identidad instantánea (sin popup, sin credenciales).
  `supabaseAuthAdapter` implementa el método real (`signInWithOAuth({provider:
  'github'})`) — código correcto y usable, pero no probado en vivo (igual que el
  resto de ese adapter, sin proyecto Supabase real todavía). Botón "Continuar con
  GitHub" en `LoginPage`, mismo `returnTo`/`state.from` que el login por contraseña.
  `IntegrationsPage` referencia la identidad de sesión activa al simular la
  instalación.
- **`LegacyToolsPage.tsx`** (nueva, `/projects/:projectId/legacy`): recibe intacto
  el contenido que antes vivía en `ProjectDetailPage` — versión actual, upload ZIP,
  y los 4 links a experimental/análisis/generaciones/generar. Etiquetada `LEGACY ·
  DESARROLLO`.
- **`ProjectDetailPage.tsx`**: recortada a breadcrumbs + heading + panel de
  repository binding + un único link discreto a Herramientas legacy.
- **`ProjectsPage.tsx`**: el banner de demo ahora presenta el control plane
  PR-driven y enlaza a `/analysis-runs`; el copy de la tarjeta sin `ProjectVersion`
  ya no menciona "demostrar la carga ZIP".

## Fuera de alcance (explícito)

- Integración real de GitHub OAuth/App — requiere credenciales del usuario en su
  propio proyecto Supabase/GitHub, declarado fuera de alcance de T-001 en la propia
  SDD; el código del lado `supabaseAuthAdapter` queda listo para cuando esas
  credenciales existan.
- Adaptar context-explorer/experiments al modelo `AnalysisRun` (HU27/28, feature
  aparte, no pedida en este corte).
- Borrado de código/rutas/pruebas legacy — se reubicaron, no se eliminaron.

## Verificación

- `npx tsc --noEmit`, `pnpm run lint`, `pnpm test -- --run` (**190 pruebas**, +7:
  `mockAuthAdapter`/`supabaseAuthAdapter` GitHub, `LoginPage` GitHub,
  `LegacyToolsPage.test.tsx` nuevo, `ProjectDetailPage`/`ProjectsPage` ampliados) y
  `pnpm run build` — todo en verde. Dos tests no relacionados (`AppShell`,
  `ContextExplorerPage` en corridas previas) fueron flaky bajo carga completa del
  runner y pasaron en aislamiento y en la corrida final completa.
- Recorrido manual en navegador (Claude in Chrome): login sin sesión → "Continuar
  con GitHub" → aterriza en Proyectos con el nuevo banner apuntando a Runs →
  `checkout-service` sin ZIP visible, solo binding + link legacy → "Herramientas
  legacy" → flujo ZIP completo intacto ahí. Sin errores de consola.

## Commits de este corte

`071c944` (mapa + apertura), `5f6e8da` (login GitHub mock), `1f7fe7b` (mueve ZIP a
LegacyToolsPage), `5bcb813` (banner/copy ProjectsPage). Ninguno pusheado.
