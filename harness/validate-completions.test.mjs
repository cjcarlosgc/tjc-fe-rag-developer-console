import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const validator = path.resolve('harness/validate-completions.mjs');
const id = 'WI-CONSOLE-999';
const item = { id, component: 'CONSOLE', workItemType: 'HARNESS', status: 'W-DONE', sprint: 'Test', storyIds: ['HU01'], taskIds: ['ST-CONSOLE-999'], caseIds: [], specPaths: [], contractImpact: false, publishesContract: false };
const checkpointNames = ['start', 'implementation-delivery', 'before-review', 'before-done'];
const completion = {
  ...item,
  closedAt: '2026-09-24T00:04:00.000Z',
  decisionGate: { checked: true, blockingDecisionIds: [] },
  execution: { leaderAgent: 'leader', implementationAgent: 'implementer', reviewAgent: 'reviewer', reviewCycles: 0, handoffs: [{ agent: 'reviewer', status: 'APPROVED', evidence: ['harness/reports/closure.md'] }] },
  gates: Object.fromEntries([
    ...['sddVerified', 'implementationCompleted', 'independentReviewPassed', 'technicalChecksPassed', 'interopSyncChecked', 'noBlockingDecisions', 'retryLimitRespected', 'noMocksPresentedAsLive'].map((gate) => [gate, 'G-PASSED']),
    ...['contractReviewed', 'canonicalContractSynced', 'contractSyncPublished', 'uxReviewed'].map((gate) => [gate, 'G-NOT_APPLICABLE']),
  ]),
  gateEvidence: Object.fromEntries(['sddVerified', 'implementationCompleted', 'independentReviewPassed', 'technicalChecksPassed', 'interopSyncChecked', 'noBlockingDecisions', 'retryLimitRespected', 'noMocksPresentedAsLive'].map((gate) => [gate, ['harness/reports/closure.md']])),
  coordination: { contractImpact: false, publishesContract: false, publishedSyncIds: [], uiImpact: false, knownIncompatibilities: [], pendingRelevantSyncIds: [], pullCheckpoints: checkpointNames.map((checkpoint, index) => ({ checkpoint, workItem: id, relevantPendingSyncIds: [], checkedAt: `2026-09-24T00:0${index}:00.000Z` })) },
  evidence: ['harness/reports/closure.md'],
};

function run(completions, inboxEvents = []) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'tjc-completion-test-'));
  try {
    fs.mkdirSync(path.join(directory, 'harness'));
    fs.mkdirSync(path.join(directory, 'harness/reports'));
    fs.mkdirSync(path.join(directory, 'harness/contract-sync/inbox'), { recursive: true });
    for (const [index, event] of inboxEvents.entries()) fs.writeFileSync(path.join(directory, 'harness/contract-sync/inbox', `CS-test-${index}.yaml`), event);
    fs.writeFileSync(path.join(directory, 'harness/reports/closure.md'), 'Verified test fixture.\n');
    fs.writeFileSync(path.join(directory, 'harness/state.json'), JSON.stringify({ completedWorkItems: completions }));
    fs.writeFileSync(path.join(directory, 'harness/work-items.json'), JSON.stringify({ workItems: [item] }));
    return spawnSync(process.execPath, [validator], { cwd: directory, encoding: 'utf8' });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test('W-DONE cannot omit its closure snapshot', () => {
  const result = run([]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /without a completion record/);
});

test('W-DONE needs an independent approved review', () => {
  assert.equal(run([completion]).status, 0);
  const tampered = structuredClone(completion);
  tampered.execution.handoffs = [];
  const result = run([tampered]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /reviewer handoff/);
});

test('W-DONE accepts the human technical reviewer while retaining the required UX review', () => {
  const humanReviewed = structuredClone(completion);
  humanReviewed.execution.reviewAgent = 'human-reviewer';
  humanReviewed.execution.handoffs[0].agent = 'human-reviewer';
  humanReviewed.execution.uxReviewAgent = 'ux-reviewer';
  humanReviewed.execution.handoffs.push({ agent: 'ux-reviewer', status: 'APPROVED', evidence: ['harness/reports/closure.md'] });
  humanReviewed.coordination.uiImpact = true;
  humanReviewed.gates.uxReviewed = 'G-PASSED';
  humanReviewed.gateEvidence.uxReviewed = ['harness/reports/closure.md'];
  assert.equal(run([humanReviewed]).status, 0);
});

test('W-DONE is rejected when a relevant inbox event is merely acknowledged', () => {
  const event = 'type: CONTRACT_SYNC\nid: CS-20260924-998\nsource: external\ntargets: [console]\nstatus: C-ACKNOWLEDGED\n';
  const result = run([completion], [event]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unresolved relevant CONTRACT_SYNC/);
});
