# WI-CONSOLE-039 · Revisión contractual (INTEROP-2.17)

Modelo: contract-reviewer · configurado claude-sonnet-5-5 · atendido unknown · esfuerzo low

Veredicto: APPROVED

## Verificación independiente

- SHA-256 de los 3 contratos locales coinciden con Core @67519a20: interoperability b9ed40dc…ea05, system b70f9358…a0444, github-integration 6c553ee8…5a (git show en Core vs archivo local).
- Árbol `spec/contracts/schemas`: hash c45e4513f4f8b3e8f2649f5b1c8f63fc4a187ddfb5fa0fb1232f85fb29fa1b31 (igual al esperado) y `diff -r` contra `git archive` de Core sin diferencias.
- Diff local vs HEAD en `spec/contracts` y `app`: solo `interoperability-contract.md` (2 líneas: nota editorial §5 de pollAfterMs/reintentos de GET y nota §10 de validación en frontera). Sin otros cambios de contratos ni de código en app.
- CS-CORE-20261018-002 (target console): C-RESOLVED, con acknowledgementEvidence (contract-sync-review) y resolutionEvidence (implementation), ambos archivos existentes; sourceRevision correcto.
- Los otros 5 eventos nuevos (20261012-008/010/012 y 20261018-001/003; targets github-integration/sandbox) siguen C-PENDING, sin evidencia añadida.
- `pnpm contracts:check` (Node 22): exit 0.
- `app/src/api/client.ts`: `ApiError` tiene `retryable?: boolean`; el cuerpo de error se lee como `Partial<ErrorEnvelope>` y se pasa `body?.retryable`; campos desconocidos no rompen (lectura por propiedad). Tolera retryable ausente o presente.

## Hallazgos

- Ninguno bloqueante. Observación menor: la nota CORS (`CONSOLE_CORS_ORIGINS`) es acción del usuario/Core, no verificable aquí.
