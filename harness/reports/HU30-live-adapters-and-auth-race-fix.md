# HU30 — Adapters live activados + fix de carrera en AuthProvider

**Estado:** DONE
**Repository:** `tjc-fe-rag-developer-console`

## Contexto

Tras cerrar el mock-first de HU30 (`HU30-github-app-centric-binding.md`), el
usuario pidió empezar a integrar de verdad contra el backend. Se confirmó
que:

- Core (`tjc-be-rag-core-api`) ya tiene un backend real desplegado en Render
  y ya implementó HU30 (`repository-bindings.controller.ts`, verificado
  leyendo el código fuente del repo hermano) — los DTOs coinciden byte a
  byte con los tipos ya escritos en Console.
- Existe un proyecto Supabase real compartido (`hhapysqvomhvquylhwvt`) que
  Core ya usa; Console nunca lo había cableado (`VITE_SUPABASE_URL`/
  `VITE_SUPABASE_ANON_KEY` vacíos en `.env`).

Con permiso explícito del usuario se conectó Console contra ambos (Supabase
real + Render real) y se probó login GitHub OAuth real en el navegador
(clic manual del usuario porque el botón de GitHub no respondía a
automatización).

## Cambios

- **`control-plane/api.ts`**: los 6 métodos de repository binding
  (`getRepositoryBinding`, `listGitHubUserRepositories`,
  `verifyGitHubAppAccess`, `listGitHubRepositoryBranches`,
  `createRepositoryBinding`, `disconnectRepository`) dejan de rechazar con
  `PendingContractError` en modo live y llaman a `apiRequest` de verdad,
  contra las rutas exactas de INTEROP-2.2 §6.8. `getRepositoryBinding`
  traduce el `404 REPOSITORY_BINDING_NOT_FOUND` real de Core a `null`.
- **`control-plane/queries.ts`/`IntegrationsPage.tsx`**: `listGitHubUserRepositories`
  pasa a recibir el `githubProviderToken` como parámetro explícito (antes no
  hacía falta porque el mock lo ignoraba) — se envía como header
  `X-GitHub-Provider-Token`.
- **`api/client.ts`**: `apiRequest` gana manejo de `204` sin cuerpo
  (`disconnectRepository` es el primer caller real de un `DELETE` en este
  cliente; antes intentaba `response.json()` sobre una respuesta vacía).
- **`control-plane/api.test.ts`**: describe nuevo con `fetch` mockeado para
  los 6 adapters live (URL, método, headers, body exactos), reemplaza el
  test viejo que asumía `PendingContractError`.

## Bug real encontrado y corregido: carrera en `AuthProvider`

Al probar en vivo, cualquier proyecto real deslogueaba a la Console
inmediatamente al abrirlo. Se diagnosticó con logs temporales (removidos
antes de comitear):

```
[1] apiRequest /projects sale                    ← sin token
[2] setAuthTokenProvider recién registra el token ← demasiado tarde
```

**Causa:** `AuthProvider` sincronizaba el Bearer de `apiRequest` vía
`useEffect(() => setAuthTokenProvider(...), [session])`. React ejecuta los
efectos de componentes **hijos antes que los del padre** dentro del mismo
commit. La primera vez que `status` pasa a `authenticated` (justo cuando
`getSession()` resuelve), `RequireAuth` monta por primera vez la ruta hija
protegida (p. ej. `ProjectsPage`) **en ese mismo commit**, y el efecto de
montaje de esa página (que dispara su query) corre antes que el efecto de
`AuthProvider` que recién iba a registrar el token real. Resultado: la
primera petición sale sin `Authorization`, Core responde `401`, y eso
dispara `unauthorizedHandler` (logout automático) de inmediato — antes de
que el token, ya registrado un instante después, tuviera oportunidad de
usarse en un reintento.

Se descartó como causa un hallazgo cruzado de Core, que había reproducido
el mismo 401 enviando el header con comillas de más (`Bearer "<token>"`):
se confirmó con logs que Console nunca agrega comillas (el token nunca pasa
por `JSON.stringify`) — la causa real fue exclusivamente esta carrera de
efectos.

**Corrección:** mover la sincronización del proveedor de Bearer al cuerpo
del componente (durante el render), no a un efecto. Es una simple
actualización de un valor externo mutable que no afecta lo renderizado, por
lo que es seguro ejecutarla en cada render — incluida la doble invocación
de `StrictMode` en desarrollo — y queda lista antes de que cualquier hijo
pueda montar en el mismo commit.

## Verificación

`tsc -b --noEmit`/lint/build limpios, 308 pruebas en verde. En vivo contra
Render+Supabase+GitHub reales:

- Login GitHub OAuth real (scope `repo`), identidad real
  `cjcarlosgc@outlook.com` en la Console.
- `GET /projects` ya no desloguea — proyecto real listado sin problemas.
- Discovery real de repositorios (`GET /integrations/github/repositories`)
  — **paso que ni Core había probado todavía** — lista los repos reales del
  usuario, incluido este mismo repositorio.
- El usuario conectó manualmente `cjcarlosgc/tjc-fe-ts-repo-test`, rama
  `development`. Verificado leyendo directo de la base de datos de Core
  (`GET /projects/{id}/integrations/github`): `status: ENABLED`,
  `installationId` resuelto por Core, nunca enviado por el navegador.

## Fuera de alcance

- El resto de adapters de la feature 013 (Checks/propuestas/publicación,
  Action Required, Functional Knowledge, context-traces) siguen sin
  controller en Core — continúan `PendingContractError`.
- No se investigó por qué el botón "Authorize" de GitHub no respondía a
  clics automatizados (posible protección anti-bot de GitHub); se resolvió
  pidiéndole al usuario el clic manual, sin bloquear el resto de la prueba.
