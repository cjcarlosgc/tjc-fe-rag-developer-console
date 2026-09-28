import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canonicalContractSyncStatus,
  contractSyncImportTime,
  contractSyncTransitionText,
  stableContractSyncPayload,
  contractSyncWasKnownAt,
} from './contract-sync-lifecycle.mjs';

const pendingEvent = [
  'type: CONTRACT_SYNC',
  'id: CS-GH-20260926-001',
  'source: github-integration',
  'sourceWorkItem: WI-GH-006',
  'targets: [core, console]',
  'sourceRevision: feature/jean@working-tree',
  'status: C-PENDING',
  '',
].join('\n');

test('legacy status spellings normalize without rewriting source records', () => {
  assert.equal(canonicalContractSyncStatus('ACKNOWLEDGED'), 'C-ACKNOWLEDGED');
  assert.equal(canonicalContractSyncStatus('C-RESOLVED'), 'C-RESOLVED');
});

test('acknowledgement and resolution preserve evidence and do not regress', () => {
  const acknowledged = contractSyncTransitionText(pendingEvent, 'acknowledge', 'harness/reports/ack.md');
  assert.match(acknowledged, /status: C-ACKNOWLEDGED/);
  const resolved = contractSyncTransitionText(acknowledged, 'resolve', 'harness/reports/resolved.md');
  assert.match(resolved, /status: C-RESOLVED/);
  assert.equal(contractSyncTransitionText(resolved, 'resolve', 'harness/reports/resolved.md'), resolved);
  assert.throws(() => contractSyncTransitionText(pendingEvent, 'resolve', 'harness/reports/resolved.md'), /cannot resolve.*C-PENDING/);
  assert.throws(() => contractSyncTransitionText(resolved, 'resolve', 'harness/reports/other.md'), /cannot replace existing resolutionEvidence/);
});

test('local import time is excluded from payload identity and preserves closed snapshots', () => {
  const imported = `${pendingEvent.trimEnd()}\nconsumerImportedAt: 2026-09-26T07:48:21.433Z\n`;
  assert.equal(contractSyncImportTime(imported), Date.parse('2026-09-26T07:48:21.433Z'));
  assert.equal(contractSyncWasKnownAt(imported, '2026-09-24T23:12:49.515Z'), false);
  assert.equal(contractSyncWasKnownAt(imported, '2026-09-26T08:00:00.000Z'), true);
  assert.equal(contractSyncWasKnownAt(pendingEvent, '2026-09-24T23:12:49.515Z'), true);
  assert.equal(stableContractSyncPayload(imported), stableContractSyncPayload(pendingEvent));
  assert.equal(contractSyncImportTime(imported.replace('2026-09-26T07:48:21.433Z', 'invalid')), Number.NaN);
});
