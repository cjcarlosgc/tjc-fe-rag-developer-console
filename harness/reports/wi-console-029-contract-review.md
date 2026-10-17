# WI-CONSOLE-029 — revisión contractual independiente (contract-reviewer)

Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo unknown

Veredicto: APPROVED

## Verificaciones propias (repo Core `/Users/jean/Tesis/workspaces/tjc-be-rag-core-api`)

- (a) Targets de los 8 eventos leídos de los YAML: -009-012, -010-001, -010-002, -011-003 → `github-integration`; -011-002 → `sandbox`; -012-002 → `console, sandbox`; -012-003 y -012-004 → `console`. Los 5 no dirigidos a Console tienen `requiredAction` solo para otros receptores (GH-INTEROP checkId/identidad durable, projectRoot Sandbox, refresco de espejos GitHub Integration). `contract-sync.mjs` rechaza `acknowledge`/`resolve` sin `console` en targets; no requieren acción en Console y siguen C-PENDING legítimamente.
- (b) `a7c04cef` es ancestro de `76053463` (`merge-base --is-ancestor` verdadero). SHA-256 de Console == Core@76053463: system `925bfc63…ab238`, interoperability `703f6547…0174e`, github-integration `584839c9…c1b34`.
- (c) `git diff a7c04cef 76053463 -- interoperability-contract.md` (22+/11-): diff por palabras revisado. Conjunto de rutas HTTP y de códigos de error (tokens MAYUS_SNAKE) idéntico en ambas revisiones; ocurrencias de `failureKind`, `TEST_COMPILATION_FAILED`, `IMAGE_UNAVAILABLE`, `RagMatchedVia`, `structuralMatch` iguales. `/trace` 5→4 y `/evidence` 9→8 bajan solo por la omisión en la línea de versión (viñeta INTEROP-2.8, ahora «trace/evidencia (§6.16)»); §6.16 y la fila Reader conservan `GET /analysis-runs/{id}/trace` y las tres rutas `/evidence` íntegras. Caracterización «actualización posterior con reemplazos no normativos» exacta: lo normativo/de estado nuevo es aditivo (projectRoot/effectiveProjectRoot, huella de idempotencia con projectRoot, DEC-INF-001 PENDING→APROBADO, GH-INTEROP-1.3→1.5), ya espejado por WI-CONSOLE-025 y no introducido por este WI. Sin pérdida normativa.
- (d) `git diff harness/contract-sync`: solo -012-002/-003/-004 cambian, únicamente `status: C-PENDING→C-RESOLVED` y los campos `acknowledgementEvidence`/`resolutionEvidence`; `git status` no muestra ningún otro evento tocado.
- (e) Resolver -002 por la parte Console es coherente: Console es receptor válido (targets incluye console), el espejo actual ya proviene de un commit descendiente de `a7c04cef` y no regresiona. La parte Sandbox queda para Sandbox (su propio buzón/espejo).

## Hallazgos menores (no bloqueantes)

1. El campo `status` es único por evento: -002 queda C-RESOLVED en Console aunque su parte Sandbox no esté resuelta en Console; es correcto porque el ciclo es por receptor, pero conviene que el cierre del WI lo mencione (ya figura en el scope-review).
2. Las evidencias de -002/-003/-004 apuntan a reportes del propio WI; sin objeción dado que no hay cambio de producto.
