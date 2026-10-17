# WI-CONSOLE-032 — cierre

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

Publicar tests con seguimiento de la publicación asíncrona. `W-DONE` tras revisión UX (ciclo 0 CHANGES_REQUESTED, corregido, re-revisión APPROVED) e independiente (`reviewer`, awayMode, ciclo 1 de 2).

- Antes: el `202` de `POST /analysis-runs/{id}/test-publications` no se consumía; la consulta de la publicación era única, la UI invalidaba propuestas al POST y seguía ofreciendo «Publicar» (un 2.º clic daba error de dominio). Después: `publicationId` y `pollAfterMs` del 202, sondeo hasta `PUBLISHED|FAILED|STALE|CLOSED` (fallback 2000 ms), refresco de propuestas y Run una sola vez al terminal, botón `aria-disabled` «Publicando…», `role=status`/`role=alert`, enlace http/https, rama y `failureMessage`, siguiente paso en FAILED/STALE/CLOSED y aviso «ya publicadas» tras recarga (sin enlace inventado: el contrato no lista publicaciones por Run).
- Mock (`VITE_DATA_SOURCE=mock`): `arun_checkout_pr45` PENDING→PUBLISHING→PUBLISHED; `arun_checkout_pr49` FAILED; `arun_billing_pr17_2` STALE (rotulado DEMO · DATOS SIMULADOS); códigos de error alineados a INTEROP §6.12.
- README y `app/.env.example`: test-publications van por `VITE_CORE_API_URL`; en live `VITE_GITHUB_INTEGRATION_API_URL` debe apuntar al GitHub Integration real.
- Gates (leader): lint, `tsc -b --noEmit`, vitest 770/770 con `--maxWorkers=2` y sin límite, build, validadores.
- Seguimientos no bloqueantes: `traceFor` del mock muestra `PRESENT` con PR companion aunque la publicación esté PENDING/FAILED/STALE; el `h1` de `arun_billing_pr17_2` desborda a 375 px (preexistente); sin botón tras FAILED/STALE/CLOSED (decisión de producto si se quiere reintento manual); ventana breve con botón habilitado entre PUBLISHED y el refetch (422 tratado).
- `WI-CONSOLE-004` permanece `W-READY`.
