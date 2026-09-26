import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const script = path.resolve('harness/contract-sync.mjs');

function createRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tjc-console-contract-sync-'));
  fs.mkdirSync(path.join(root, 'harness/contract-sync/inbox'), { recursive: true });
  fs.mkdirSync(path.join(root, 'harness/contract-sync/outbox'), { recursive: true });
  fs.mkdirSync(path.join(root, 'harness/reports'), { recursive: true });
  fs.writeFileSync(path.join(root, 'harness/work-items.json'), JSON.stringify({ workItems: [{
    id: 'WI-CONSOLE-999', component: 'CONSOLE', workItemType: 'PRODUCT', status: 'W-IN_PROGRESS',
    storyIds: ['HU01'], taskIds: ['ST-CONSOLE-999'], caseIds: [], sprint: 'Test', dependsOn: [],
    contractImpact: true, publishesContract: false, specPaths: ['spec/contracts/github-integration-contract.md'],
  }] }));
  fs.writeFileSync(path.join(root, 'harness/state.json'), JSON.stringify({ activeWorkItem: {
    id: 'WI-CONSOLE-999', status: 'W-IN_PROGRESS',
    gates: { implementationCompleted: 'G-PASSED' },
    gateEvidence: { implementationCompleted: ['harness/reports/implementation.md'] },
    coordination: { pullCheckpoints: [] },
  } }));
  fs.writeFileSync(path.join(root, 'harness/reports/review.md'), 'Reviewed contract and compatibility.\n');
  fs.writeFileSync(path.join(root, 'harness/reports/implementation.md'), 'Verified consumer implementation.\n');
  return root;
}

function run(root, ...args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' });
}

const event = [
  'type: CONTRACT_SYNC',
  'id: CS-GH-20260926-999',
  'source: github-integration',
  'sourceWorkItem: WI-GH-006',
  'targets: [console]',
  'scopePaths: [spec/contracts/github-integration-contract.md]',
  'breaking: false',
  'changed:',
  '  - Add an authenticated user API.',
  'requiredAction:',
  '  - Verify authorization and compatibility.',
  'sourceRevision: test',
  'status: C-PENDING',
  '',
].join('\n');

test('import records local time and preserves consumer lifecycle on re-import', () => {
  const root = createRepo();
  try {
    const source = path.join(root, 'source');
    fs.mkdirSync(source);
    fs.writeFileSync(path.join(source, 'CS-GH-20260926-999.yaml'), event);
    assert.equal(run(root, 'import', '--from', source).status, 0);
    const inboxPath = path.join(root, 'harness/contract-sync/inbox/CS-GH-20260926-999.yaml');
    const imported = fs.readFileSync(inboxPath, 'utf8');
    assert.match(imported, /^consumerImportedAt: \d{4}-\d\d-\d\dT/m);
    assert.match(imported, /^status: C-PENDING$/m);
    const acknowledged = run(root, 'acknowledge', '--id', 'CS-GH-20260926-999', '--work-item', 'WI-CONSOLE-999', '--evidence', 'harness/reports/review.md');
    assert.equal(acknowledged.status, 0, acknowledged.stderr);
    assert.match(fs.readFileSync(inboxPath, 'utf8'), /^status: C-ACKNOWLEDGED$/m);
    assert.equal(run(root, 'import', '--from', source).status, 0);
    assert.match(fs.readFileSync(inboxPath, 'utf8'), /^status: C-ACKNOWLEDGED$/m);
    assert.match(fs.readFileSync(inboxPath, 'utf8'), /^acknowledgementEvidence: harness\/reports\/review\.md$/m);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('resolve requires implementation evidence and enables later checkpoints', () => {
  const root = createRepo();
  try {
    const inboxPath = path.join(root, 'harness/contract-sync/inbox/CS-GH-20260926-999.yaml');
    fs.writeFileSync(inboxPath, `${event.trimEnd()}\nconsumerImportedAt: 2026-09-26T07:48:21.433Z\n`);
    const acknowledged = run(root, 'acknowledge', '--id', 'CS-GH-20260926-999', '--work-item', 'WI-CONSOLE-999', '--evidence', 'harness/reports/review.md');
    assert.equal(acknowledged.status, 0, acknowledged.stderr);
    const resolved = run(root, 'resolve', '--id', 'CS-GH-20260926-999', '--work-item', 'WI-CONSOLE-999', '--evidence', 'harness/reports/implementation.md');
    assert.equal(resolved.status, 0, resolved.stderr);
    assert.match(fs.readFileSync(inboxPath, 'utf8'), /^status: C-RESOLVED$/m);
    assert.equal(run(root, 'check', '--checkpoint', 'before-review', '--work-item', 'WI-CONSOLE-999').status, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
