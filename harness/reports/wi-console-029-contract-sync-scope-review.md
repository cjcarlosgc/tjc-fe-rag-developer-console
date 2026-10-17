# WI-CONSOLE-029 — clasificación de eventos Contract Sync pendientes

Modelo: leader · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo medium

WI documental: `contractImpact=false`, `publishesContract=false`, sin UI, API, DTO ni espejos. `syncScopePaths: [spec/contracts/interoperability-contract.md]` solo hace relevantes (para `acknowledge`/`resolve`) los eventos dirigidos a Console con ese `scopePath`.

## Mecánica del harness (evidencia)

- `acknowledge`/`resolve` rechazan con `does not target CONSOLE` cualquier evento cuyo `targets` no incluya `console` (`harness/contract-sync.mjs`, líneas 203-207); `check` solo considera eventos con `targets` que incluyan `console`.
- Por tanto un evento dirigido solo a `github-integration` o `sandbox` no tiene vía válida de `acknowledge` ni de `NOT_RELEVANT` en Console (la clasificación `contractSyncReview` exige `targets.includes('console')`), y tampoco bloquea ningún checkpoint de Console. Permanece `C-PENDING` en el inbox porque es un espejo importado del buzón de Core, y su ciclo de vida pertenece a los receptores indicados.

## Clasificación

| Evento | targets | Decisión | Motivo |
|---|---|---|---|
| CS-CORE-20261009-012 | github-integration | No aplicable (queda C-PENDING) | GH-INTEROP-1.3 `POST /internal/v1/github/checks` 200 `{checkId}` es implementación de GitHub Integration; no apunta a Console. |
| CS-CORE-20261010-001 | github-integration | No aplicable (queda C-PENDING) | Identidad durable de Check (GH-INTEROP-1.4): trabajo de GitHub Integration. |
| CS-CORE-20261010-002 | github-integration | No aplicable (queda C-PENDING) | Espejos SYSTEM/INTEROP alineados con GH-INTEROP-1.4 para GitHub Integration; los espejos de Console ya son posteriores (SYSTEM-2.9/INTEROP-2.8, Core `76053463`). |
| CS-CORE-20261011-002 | sandbox | No aplicable (queda C-PENDING) | `projectRoot` Core→Sandbox: trabajo exclusivo del Sandbox (WI local, cwd Composer/PHPUnit). |
| CS-CORE-20261011-003 | github-integration | No aplicable (queda C-PENDING) | Refresco de espejos para GitHub Integration; sin cambio de producto/API; Console ya espeja SYSTEM-2.9/INTEROP-2.8. |
| CS-CORE-20261012-002 | console, sandbox | Acusar y resolver (parte Console) | Corrección de procedencia de CS-016; ver evidencia siguiente. La parte Sandbox es suya. |
| CS-CORE-20261012-003 | console | Acusar y resolver | Corrección de procedencia de CS-017; ver evidencia siguiente. |
| CS-CORE-20261012-004 | console | Acusar y resolver | Corrección de procedencia de CS-018; ver evidencia siguiente. |

Ninguno exige trabajo de producto, decisión del usuario ni sincronizar espejos nuevos.

## Evidencia de los tres eventos de Console

`requiredAction` (idéntica en -002/-003/-004): al espejar INTEROP-2.7, tomar `spec/contracts/interoperability-contract.md` del commit `a7c04cef12740941d8559c743f84ed287fb57ced` y no de la revisión original de la rama PHP, para no regresionar `/evidence` ni las tasas nulas. Solo cambia procedencia; sin cambio de contrato.

Verificado en `../tjc-be-rag-core-api` (rama `feature/jean`, HEAD `fedd787`):

1. `git merge-base --is-ancestor a7c04cef… 76053463e1b073364861d417bc9c2217dccd11a2` → verdadero: la revisión corregida es ancestro de la revisión de la que provienen los espejos actuales de Console (WI-CONSOLE-025).
2. SHA-256 de los espejos de Console == `git show 76053463…:spec/contracts/<archivo>`: INTEROP `703f65472c1d12e4e2303df15fa2e006ac5a956ef96f9ac820fb9cb2bdb0174e` (INTEROP-2.8), SYSTEM `925bfc63c4bc83a9d169ad5d982bf566fc7fcc56144cf023827c705bd7cab238` (SYSTEM-2.9), GH-INTEROP `584839c91a088918028bbe80cbf209d8d341246bcf3536288cff1ad0b02c1b34`. El espejo de Console nunca proviene de la rama PHP anterior a WI-CORE-027.
3. `git diff a7c04cef 76053463 -- interoperability-contract.md` (solo contrato INTEROP): actualización posterior del contrato con reemplazos no normativos (no «solo aditiva»): versión/fecha, línea de historia condensada que omite `/trace` y `/evidence`, referencias GH-INTEROP-1.3→1.5, `projectRoot`/`effectiveProjectRoot`, idempotencia Sandbox y DEC-INF-001 PENDING→APROBADO (lista hunk por hunk en `harness/reports/wi-console-029-implementation.md`); los cuerpos §6.16 de `/trace` y `/evidence` son idénticos salvo GH-INTEROP-1.3→1.5 y no se retira `failureKind`, `TEST_COMPILATION_FAILED`, `IMAGE_UNAVAILABLE`, `RagMatchedVia`/`structuralMatch`, ni los endpoints `/trace` y `/evidence` de §6.16. Las ocurrencias de esos términos son iguales en `a7c04cef` y en el espejo.
4. Los originales CS-CORE-20261009-016/-017/-018 ya están `C-RESOLVED` en Console.

Conclusión: el espejo vigente contiene la corrección y no regresiona; Console no necesita sincronizar nada. Se acusan y resuelven -002 (parte Console), -003 y -004 con este reporte y el reporte de implementación del WI.
