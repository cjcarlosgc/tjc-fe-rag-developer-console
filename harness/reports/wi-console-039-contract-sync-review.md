# WI-CONSOLE-039 — revisión de Contract Sync

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Eventos leídos enteros en `harness/contract-sync/inbox/` (untracked, importados por cross el 2026-10-18T23:59Z). Revisión canónica: Core `67519a20a5e061bd81a880fe539693c9a364bba3` (`git merge-base --is-ancestor 67519a20 HEAD` en Core: sí, HEAD actual `ae96def`). `git show 67519a20:spec/contracts/interoperability-contract.md | shasum -a 256` = `b9ed40dc8d15a414b7cca4ccee4f320ba9da8f7444ef426b8321d17bdc0dea05` (igual al working tree de Core y al digest declarado por el evento).

| Evento | WI Core | targets | Decisión |
|---|---|---|---|
| CS-CORE-20261018-002 | WI-CORE-069 | console | Relevante: acusar; espejar INTEROP-2.17 (SYSTEM-2.13, GH-INTEROP-1.8 y schemas ya coinciden); `ApiError.retryable`/`ErrorEnvelope` ya adoptados (a464b61), tolerar `retryable?` y campos desconocidos; resolver tras la evidencia |
| CS-CORE-20261018-001 | WI-CORE-069 | github-integration | No apunta a Console: NOT_RELEVANT, sin acusar (el CLI lo rechaza) |
| CS-CORE-20261018-003 | WI-CORE-069 | sandbox | No apunta a Console: NOT_RELEVANT, sin acusar |
| CS-CORE-20261012-008 | WI-CORE-047 | github-integration | No apunta a Console: NOT_RELEVANT, sin acusar |
| CS-CORE-20261012-010 | WI-CORE-049 | sandbox | No apunta a Console: NOT_RELEVANT, sin acusar |
| CS-CORE-20261012-012 | WI-CORE-049 | sandbox | No apunta a Console: NOT_RELEVANT, sin acusar |

El Harness solo evalúa y admite acuse de eventos con `console` en `targets`; los cinco restantes quedan como archivos de inbox sin estado de Console y no afectan los gates. Sin `contractSyncReview` (solo aplica a eventos con target Console).

Nota sobre CORS: la acción requerida del evento -002 incluye definir `CONSOLE_CORS_ORIGINS` en Core cuando el usuario la defina; es del usuario/Core, no de Console (sin ella CORS sigue abierto).

Diferencia previa de la copia local de INTEROP: el espejo anterior de cross (2.17 preliminar, `4bab54e8…`) difería de Core en dos líneas: §2 (frase sobre `pollAfterMs` opcional y reintentos de Core del Sandbox) y §10 (transitoriedad de la validación de Core).

## Eventos históricos sin `scopePaths` (alcance global)

`CS-20260920-003`, `CS-20260921-001`, `CS-20260921-002` y `CS-20260921-003` (lifecycle del binding, identidad/roles, autenticación y membresía) se consideran globales por compatibilidad; se clasifican NOT_RELEVANT para este WI con los mismos digests de WI-CONSOLE-038 (contenido sin cambios). Este WI solo espeja contratos de Core y no toca bindings, autorización, login ni Projects.
