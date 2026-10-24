# WI-CONSOLE-051 — Revisión contractual

Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Veredicto: APPROVED

## Verificado con comandos propios (Core, `git show`/`git archive` sobre REV, no working tree)

- REV 2318b9df: sha256 de interoperability (7f946d55…), system (d0a492b4…) y github-integration (dedf00fa…) coinciden con el espejo local.
- Árbol `spec/contracts/schemas`: digest 8079ab73… coincide; `diff -r` contra `git archive` sin diferencias.
- Rev 208c3bdf: INTEROP-2.20 = f0b39578…, SYSTEM-2.15 = f3b61da5…, GH idéntico (dedf00fa…); schemas idénticos a los de 2318b9df.
- `pnpm contracts:check` en `app/`: rc=0 (limpio).
- `generated/`: 956 inserciones, 0 eliminaciones; solo se añade el esquema `github-webhook-event`.
- Contract Sync: -003 y -004 son `C-RESOLVED` con acknowledgementEvidence (contract-sync-review) y resolutionEvidence (implementation). -004 declara que supera a 20261021-001..004 y 20261024-001..003 en INTEROP/SYSTEM. -001 (targets: github-integration) y -002 (targets: sandbox) no apuntan a console.
- `liveMapping.ts`: `ExperimentResultsResponse` pasa a `targetId` requerido y `analysisRunId`/`symbol` opcionales, coherente con INTEROP-2.20 §6.5 (reportado por -003). Solo se cambió el tipo; sin cambio de DTO, rutas ni UI (diff de `app/` limitado a generated/, liveMapping.ts y su test).
- Referencias de versión vigentes en `spec/README.md`: INTEROP-2.21 y SYSTEM-2.16.

## Hallazgos

Bloqueantes: ninguno.

No bloqueantes:
1. Quedan referencias a INTEROP/SYSTEM antiguas (2.6, 2.7, 2.18, SYSTEM-2.6/2.7/2.11) en `spec/`; no se verificó exhaustivamente que todas sean históricas o de versión de origen de una regla y no "vigentes". Revisión por muestreo, sin evidencia de error.
2. No evalué si el campo `symbol` opcional afecta código consumidor; el evento -003 indica que ningún código lo lee, y `tsc`/build quedan bajo el gate del WI.
