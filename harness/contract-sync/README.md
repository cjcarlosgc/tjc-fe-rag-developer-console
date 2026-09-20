# CONTRACT_SYNC

`CONTRACT_SYNC` es el protocolo persistente entre los tres harnesses. Cada evento se versiona como YAML en el `outbox` del emisor; el receptor lo importa a su `inbox`. No depende de sesiones activas, no autoriza cambios funcionales y nunca modifica automáticamente otro repositorio.

```yaml
type: CONTRACT_SYNC
id: CS-20260919-001
source: core
targets: [console]
breaking: false
changed:
  - INTEROP-2.2 §6.8 repository binding
requiredAction:
  - Review Console adapter compatibility.
sourceRevision: 0123abc
status: PENDING
```

Los valores de `status` son `PENDING`, `ACKNOWLEDGED`, `RESOLVED` y `REJECTED`. Console consume eventos de Core y solo publica hacia `core` cuando una necesidad contractual está explícitamente aprobada; no inventa endpoints/DTOs para satisfacer una UI.

```sh
node harness/contract-sync.mjs check --checkpoint start --work-item HU30-repository-binding
node harness/contract-sync.mjs check --checkpoint implementation-delivery --work-item HU30-repository-binding
node harness/contract-sync.mjs check --checkpoint before-review --work-item HU30-repository-binding
node harness/contract-sync.mjs check --checkpoint before-done --work-item HU30-repository-binding
node harness/contract-sync.mjs import --from /ruta/al/harness/contract-sync/outbox
node harness/contract-sync.mjs publish --id CS-20260919-001 --breaking false --changed 'Need approved Core capability X.' --required-action 'Evaluate and publish canonical contract if approved.' --source-revision 0123abc
```

La salida del check se conserva en `activeWorkItem.coordination.pullCheckpoints`. Un evento `PENDING` dirigido a `console` es relevante: añade su ID a `pendingRelevantSyncIds`, falla `interopSyncChecked` y bloquea `DONE` hasta evaluación contractual. Los checkpoints requeridos son `start`, `implementation-delivery`, `before-review` y `before-done`.
