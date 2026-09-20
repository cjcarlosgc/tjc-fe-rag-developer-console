import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const inbox = path.join(root, 'harness/contract-sync/inbox');
const outbox = path.join(root, 'harness/contract-sync/outbox');
const args = process.argv.slice(2);
const command = args.shift();

function option(name, required = false) {
  const index = args.indexOf(`--${name}`);
  const value = index === -1 ? undefined : args[index + 1];
  if (required && (!value || value.startsWith('--'))) throw new Error(`--${name} is required`);
  return value;
}

function events(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
    .map((entry) => {
      const file = path.join(directory, entry.name);
      const text = fs.readFileSync(file, 'utf8');
      const scalar = (name) => text.match(new RegExp(`^${name}:\\s*(.+)$`, 'm'))?.[1]?.trim();
      const targets = text.match(/^targets:\s*\[([^\]]*)\]$/m)?.[1].split(',').map((value) => value.trim()).filter(Boolean) ?? [];
      return { file, name: entry.name, text, id: scalar('id'), source: scalar('source'), status: scalar('status'), targets };
    });
}

function assertEvent(event) {
  if (!event.id || !/^CS-[A-Za-z0-9-]+$/.test(event.id) || !event.source || !event.status || !event.targets.length) throw new Error(`invalid event: ${event.name}`);
  if (!['core', 'console', 'sandbox'].includes(event.source)) throw new Error(`invalid source in ${event.name}`);
  if (!['PENDING', 'ACKNOWLEDGED', 'RESOLVED', 'REJECTED'].includes(event.status)) throw new Error(`invalid status in ${event.name}`);
}

function eventYaml({ id, changed, requiredAction, sourceRevision, breaking }) {
  return ['type: CONTRACT_SYNC', `id: ${id}`, 'source: console', 'targets: [core]', `breaking: ${breaking}`, 'changed:', `  - ${changed}`, 'requiredAction:', `  - ${requiredAction}`, `sourceRevision: ${sourceRevision}`, 'status: PENDING', ''].join('\n');
}

try {
  if (!['check', 'import', 'publish'].includes(command)) throw new Error('usage: check | import | publish');
  if (command === 'check') {
    const checkpoint = option('checkpoint', true);
    const workItem = option('work-item', true);
    if (!['start', 'implementation-delivery', 'before-review', 'before-done'].includes(checkpoint)) throw new Error('unknown checkpoint');
    const inboxEvents = events(inbox);
    inboxEvents.forEach(assertEvent);
    const pending = inboxEvents.filter((event) => event.targets.includes('console') && event.status === 'PENDING');
    console.log(JSON.stringify({ checkpoint, workItem, relevantPendingSyncIds: pending.map((event) => event.id), checkedAt: new Date().toISOString() }));
    process.exitCode = pending.length ? 2 : 0;
  }
  if (command === 'import') {
    const source = path.resolve(root, option('from', true));
    if (!fs.statSync(source).isDirectory()) throw new Error('--from must be a directory');
    let imported = 0;
    for (const event of events(source)) {
      assertEvent(event);
      const destination = path.join(inbox, event.name);
      if (fs.existsSync(destination) && fs.readFileSync(destination, 'utf8') !== event.text) throw new Error(`conflicting event: ${event.name}`);
      if (!fs.existsSync(destination)) { fs.copyFileSync(event.file, destination); imported += 1; }
    }
    console.log(JSON.stringify({ imported, inbox: path.relative(root, inbox) }));
  }
  if (command === 'publish') {
    const id = option('id', true);
    const changed = option('changed', true);
    const requiredAction = option('required-action', true);
    const sourceRevision = option('source-revision', true);
    const breaking = option('breaking', true);
    if (!/^CS-[A-Za-z0-9-]+$/.test(id)) throw new Error('--id must start with CS-');
    if (!['true', 'false'].includes(breaking)) throw new Error('--breaking must be true or false');
    const destination = path.join(outbox, `${id}.yaml`);
    if (fs.existsSync(destination)) throw new Error(`event already exists: ${id}`);
    fs.writeFileSync(destination, eventYaml({ id, changed, requiredAction, sourceRevision, breaking }), { encoding: 'utf8', flag: 'wx' });
    console.log(JSON.stringify({ published: id, file: path.relative(root, destination), target: 'core' }));
  }
} catch (error) {
  console.error(`CONTRACT_SYNC error: ${error.message}`);
  process.exitCode = 1;
}
