import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const roles = ['leader.md', 'sdd-analyst.md', 'implementer.md', 'contract-reviewer.md', 'ux-reviewer.md', 'reviewer.md'];
const handoffFields = ['status', 'findings', 'blockers', 'filesAffected', 'evidence', 'recommendedNextStep'];
const statuses = new Set(['SELECTED', 'SPEC_VERIFIED', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED', 'DECISION_REQUIRED', 'DONE']);
const gateValues = new Set(['PASSED', 'FAILED', 'NOT_APPLICABLE', 'NOT_RUN']);
const gates = ['sddVerified', 'implementationCompleted', 'uxReviewed', 'contractReviewed', 'canonicalContractSynced', 'contractSyncPublished', 'independentReviewPassed', 'technicalChecksPassed', 'interopSyncChecked', 'noMocksPresentedAsLive', 'noBlockingDecisions', 'retryLimitRespected'];
const alwaysDone = ['sddVerified', 'implementationCompleted', 'independentReviewPassed', 'technicalChecksPassed', 'interopSyncChecked', 'noMocksPresentedAsLive', 'noBlockingDecisions', 'retryLimitRespected'];
const checkpoints = ['start', 'implementation-delivery', 'before-review', 'before-done'];

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(path.join(root, file), 'utf8')); }
  catch (error) { failures.push(`${file}: ${error.message}`); return null; }
}
function assert(condition, message) { if (!condition) failures.push(message); }
function hasHandoff(item, role) { return item.execution?.handoffs?.some((handoff) => handoff.agent === role); }

for (const role of roles) assert(fs.existsSync(path.join(root, 'harness/roles', role)), `missing role: ${role}`);
for (const deprecated of ['analyst.md', 'design-reviewer.md', 'stitch-reader.md', 'stitch-analyst.md']) assert(!fs.existsSync(path.join(root, 'harness/roles', deprecated)), `deprecated permanent role remains: ${deprecated}`);
for (const directory of ['harness/contract-sync/inbox', 'harness/contract-sync/outbox']) assert(fs.existsSync(path.join(root, directory)), `missing CONTRACT_SYNC directory: ${directory}`);

const state = readJson('harness/state.json');
if (state) {
  assert(state.schemaVersion === 3, 'state.schemaVersion must be 3');
  assert(Array.isArray(state.allowedStatuses) && [...statuses].every((status) => state.allowedStatuses.includes(status)), 'state allowedStatuses is incomplete');
  const item = state.activeWorkItem;
  if (item !== null) {
    assert(typeof item === 'object', 'activeWorkItem must be object or null');
    assert(['PRODUCT', 'HARNESS'].includes(item.workItemType), 'workItemType must be PRODUCT or HARNESS');
    assert(statuses.has(item.status), 'invalid work item status');
    assert(Array.isArray(item.storyIds) && typeof item.sprint === 'string' && item.sprint.length > 0, 'storyIds and sprint are required');
    assert(Array.isArray(item.specPaths) && Array.isArray(item.transversalPaths), 'spec/transversal paths must be arrays');
    assert(item.execution?.leaderAgent === 'leader', 'leader owns global state');
    assert(Number.isInteger(item.execution?.reviewCycles) && item.execution.reviewCycles >= 0 && item.execution.reviewCycles <= 2, 'reviewCycles must be 0..2');
    assert(item.execution?.maxReviewCycles === 2 && item.execution.reviewCycles <= item.execution.maxReviewCycles, 'retry control must cap at two cycles');
    assert(Array.isArray(item.execution?.handoffs), 'handoffs must be recorded');
    assert(item.execution?.implementationAgent !== item.execution?.reviewAgent, 'implementer cannot be final reviewer');
    for (const handoff of item.execution.handoffs ?? []) {
      assert(typeof handoff.agent === 'string', 'handoff agent is required');
      assert(['APPROVED', 'CHANGES_REQUESTED', 'BLOCKED', 'DECISION_REQUIRED'].includes(handoff.status), 'invalid handoff status');
      for (const field of handoffFields.slice(1)) assert(Object.hasOwn(handoff, field), `handoff ${handoff.agent} missing ${field}`);
    }
    for (const gate of gates) assert(gateValues.has(item.gates?.[gate]), `invalid or missing gate: ${gate}`);
    assert(Array.isArray(item.coordination?.pullCheckpoints), 'pull checkpoints must be recorded');
    assert(Array.isArray(item.coordination?.publishedSyncIds) && Array.isArray(item.coordination?.pendingRelevantSyncIds) && Array.isArray(item.coordination?.knownIncompatibilities), 'coordination arrays are required');
    if (['SPEC_VERIFIED', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(item.status)) {
      assert(item.decisionGate?.checked === true && typeof item.decisionGate?.checkedAt === 'string', 'decision gate must be checked after SELECTED');
      assert(item.decisionGate?.blockingDecisionIds?.length === 0, 'blocking decision prevents progress');
    }
    if (['IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(item.status) && item.workItemType === 'PRODUCT') assert(item.approved === true, 'product work in progress needs approval');
    if (['BLOCKED', 'DECISION_REQUIRED'].includes(item.status)) assert(typeof item.blockedReason === 'string' && item.blockedReason.length > 0, 'blocked work needs a concrete reason');
    if (item.coordination?.uiImpact) {
      assert(item.execution?.uxReviewAgent === 'ux-reviewer', 'UI impact requires ux-reviewer');
      assert(item.gates?.uxReviewed !== 'NOT_APPLICABLE', 'UI impact cannot skip UX gate');
    } else assert(item.gates?.uxReviewed === 'NOT_APPLICABLE', 'no UI impact must mark UX gate not applicable');
    if (item.coordination?.contractImpact) {
      assert(item.execution?.contractReviewAgent === 'contract-reviewer', 'contract impact requires contract-reviewer');
      for (const gate of ['contractReviewed', 'canonicalContractSynced', 'contractSyncPublished']) assert(item.gates?.[gate] !== 'NOT_APPLICABLE', `${gate} cannot be skipped for contract impact`);
    } else for (const gate of ['contractReviewed', 'canonicalContractSynced', 'contractSyncPublished']) assert(item.gates?.[gate] === 'NOT_APPLICABLE', `${gate} must be not applicable without contract impact`);
    if (item.status === 'DONE') {
      for (const gate of alwaysDone) assert(item.gates?.[gate] === 'PASSED', `${gate} must pass before DONE`);
      if (item.coordination?.uiImpact) assert(item.gates?.uxReviewed === 'PASSED', 'UX gate must pass before DONE');
      if (item.coordination?.contractImpact) for (const gate of ['contractReviewed', 'canonicalContractSynced', 'contractSyncPublished']) assert(item.gates?.[gate] === 'PASSED', `${gate} must pass before DONE`);
      const seen = new Set(item.coordination.pullCheckpoints.map((check) => check.checkpoint));
      for (const checkpoint of checkpoints) assert(seen.has(checkpoint), `DONE requires PULL checkpoint: ${checkpoint}`);
      assert(item.coordination.pendingRelevantSyncIds.length === 0 && item.coordination.knownIncompatibilities.length === 0, 'DONE cannot have pending syncs or known incompatibilities');
      assert(Array.isArray(item.evidence) && item.evidence.length > 0, 'DONE requires reproducible evidence');
    }
  }
}

const example = readJson('harness/examples/fan-out-fan-in.json');
if (example) {
  assert(Array.isArray(example.sequence?.[3]), 'example must model parallel fan-out');
  for (const role of ['sdd-analyst', 'implementer', 'reviewer', 'ux-reviewer', 'contract-reviewer']) {
    const handoff = example.handoffs?.[role];
    assert(handoff && ['APPROVED', 'CHANGES_REQUESTED', 'BLOCKED', 'DECISION_REQUIRED'].includes(handoff.status), `example handoff missing status: ${role}`);
    for (const field of handoffFields.slice(1)) assert(handoff && Object.hasOwn(handoff, field), `example handoff missing ${field}: ${role}`);
  }
}

if (failures.length) { console.error(`Harness V2 validation failed:\n- ${failures.join('\n- ')}`); process.exitCode = 1; }
else console.log('Harness V2 validation passed.');
