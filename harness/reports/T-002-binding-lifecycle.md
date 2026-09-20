# T-002 — Binding lifecycle: Desconectar/Reactivar, repositorio duplicado y eliminación lógica de Project

Repository: `tjc-fe-rag-developer-console`
Branch: `feature/T-002`
Work item: `T-002-binding-lifecycle` (PRODUCT, Sprint H) — HU30 (ajuste), HU56, HU57
Contrato: INTEROP-2.3 / SYSTEM-2.3 (canónicos en Core; espejos copiados byte a byte)

## Origen

Al probar contra Core real, vincular un repositorio ya usado por otro Project daba `500 INTERNAL_ERROR`: `RepositoryBinding.repositoryId` es `@unique` y `create()` solo comprobaba el binding del mismo proyecto. Además, el `DELETE .../integrations/github` de Core solo pausa (`DISABLED`), no existía ruta para reactivar y no existía eliminación de Project.

## Decisiones humanas aprobadas

- Desconectar = pausa reversible (`DISABLED`): deja de aceptar eventos de PR y conserva el binding, Runs y Functional Knowledge.
- Reactivar: `DISABLED → ENABLED`, y también `REVOKED → ENABLED` si la GitHub App recupera acceso (revalida el acceso).
- Eliminar Project = borrado lógico irreversible desde la API; oculta el Project y libera el binding para que el repo pueda vincularse a otro Project.
- Alcance sobre Core: solo `CONTRACT_SYNC` (Console no modifica Core).
- Activar live tras `CS-20260920-003`.

## CONTRACT_SYNC

| Evento | Sentido | Estado en Console |
| --- | --- | --- |
| `CS-20260920-001` | Console → Core (solicitud: 409 `REPOSITORY_ALREADY_BOUND`, `enable`, `DELETE /projects/{id}`, hallazgos de seguridad) | publicado |
| `CS-20260920-002` | Core → Console (contrato INTEROP-2.3 definido, implementación pendiente) | `RESOLVED` |
| `CS-20260920-003` | Core → Console (implementación completada) | `ACKNOWLEDGED` (falta validación live contra Core desplegado) |

Espejos `spec/contracts/{system,interoperability}-contract.md` idénticos a Core (`cmp`).

## Cambios en `app/`

- **Mock:** Desconectar deja `DISABLED`; crear binding valida en el orden del contrato (404 proyecto → 409 binding propio → 403 acceso App → 409 `REPOSITORY_ALREADY_BOUND` → 404 rama); `mockEnableRepository`; `mockDeleteProject` con ocultación en lecturas por id; `mockSimulateAppAccessLoss` documentado como helper solo de tests/demo.
- **Adapters live:** `enableRepository` (`POST .../enable`, sin body) y `deleteProject` (`DELETE /projects/{id}`, 204; un `404 PROJECT_NOT_FOUND` en reintento cuenta como éxito). `getRepositoryBinding` solo devuelve `null` para `REPOSITORY_BINDING_NOT_FOUND`.
- **UI:** estados `Activo`/`Pausado`/`Revocado`, Reactivar, zona de peligro con confirmación para eliminar, proyecto no encontrado con salida, aviso de eliminado, mensajes por `ApiError.code`, foco y anuncios accesibles.
- **Dominio auth (commit previo `5e4c2c3`, fuera del harness):** reautorización de GitHub si la identidad ya está vinculada y lectura del error del callback OAuth.

## Revisiones (fan-in, 2 ciclos de corrección)

| Rol | Ciclo 1 | Ciclo 2 |
| --- | --- | --- |
| `reviewer` | CHANGES_REQUESTED | APPROVED |
| `contract-reviewer` | APPROVED con cambios menores | APPROVED |
| `ux-reviewer` | CHANGES_REQUESTED | CHANGES_REQUESTED (ligero) → APPROVED en verificación final |

Hallazgos corregidos: HU56/HU57 intercambiadas en código, copy engañosa en live, foco y anuncios, proyecto no encontrado sin salida, aviso de eliminado, `createBinding` sin reset entre repos, 403 no anunciado, enlace de configuración condicionado a `NOT_AUTHORIZED`, alcance no pedido en el mock (`REPOSITORY_BINDING_NOT_ENABLED`), lecturas de Projects borrados en el mock.

## Evidencia

Comandos ejecutados por el leader (desde `app/`) tras el último cambio:

- `npx tsc -b --noEmit`: sin errores
- `npm run lint`: sin errores
- `npx vitest run`: 68 archivos, 383 tests
- `npm run build`: OK
- `node harness/validate-harness.mjs`: OK

## Riesgos y seguimiento

- **Tests intermitentes bajo carga:** `ContextExplorerPage`, `AnalysisRunDetailPage` y `ProjectsPage > lista proyectos live` fallan también sobre `HEAD` limpio con 3 suites en paralelo (verificado en un worktree temporal). El test nuevo de «sin parpadeo» al eliminar (`ProjectDetailPage.test.tsx`, `MutationObserver` + espera de 50 ms) falló 1 de 3 veces bajo esa carga.
- **Antes de probar live:** las migraciones de Core `20260920120000` y `20260920121000` figuran sin aplicar a Supabase en el `state.json` de Core, y su rama `feature/T-002` no estaba publicada. Aplicar migraciones y desplegar Core requiere autorización del usuario y no forma parte de este work item.
- **Importador de `CONTRACT_SYNC`:** `contract-sync.mjs import` aborta con `conflicting event` si la copia del inbox difiere del outbox (p. ej. tras marcar `ACKNOWLEDGED`), lo que impide importar eventos posteriores en la misma pasada. Requiere un corte de harness aparte.
- **`spec/backlog.md`:** HU56/HU57 permanecen `PROPOSED`; pasarlas a `APROBADO` es decisión humana.
- **Seguimiento UX no bloqueante:** limpieza defensiva de `pendingFocusRef`, refresco de `useGitHubAppAccessInfo` tras un 403 de Reactivar, ruido de «Revalidando…» dentro de `role=status`, errores no mapeados con `error.message`, `.demo-stamp` frente a `.proposal-stamp`.
- **Push:** no realizado; requiere revisión consolidada de sprint y solicitud explícita.
