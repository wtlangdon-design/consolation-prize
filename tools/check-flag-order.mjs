import {
  allDialogueOptions, allResponseCarriers, loadContent, Report, runCheck,
} from './lib/content.mjs';

/**
 * No flag is read before it can be written.
 *
 * Concretely: every gate must be satisfiable. A condition that no initial
 * value and no write in the whole content set can ever make true is a dead
 * branch -- content the player can never reach. Since the player can never
 * make the game unwinnable, an unsatisfiable gate is always an authoring bug.
 *
 * Scope note: this is the static half. The ordering-aware half -- proving no
 * gate is reached earlier than its write in actual play -- is
 * check-puzzle-graph.mjs's (`unwrittenReads`, errata 219): a gate at a site
 * the player can stand at, reading a value nothing reachable from a fresh
 * save writes. Until errata 219 that half was deferred to a graph that was
 * never filled, and this note said so on every run.
 */

function collectWrites(content) {
  const sets = new Map();
  const adds = new Set();

  const record = (writes, addends) => {
    for (const [id, value] of Object.entries(writes ?? {})) {
      if (!sets.has(id)) sets.set(id, new Set());
      sets.get(id).add(JSON.stringify(value));
    }
    for (const id of Object.keys(addends ?? {})) {
      adds.add(id);
    }
  };

  for (const { target } of allResponseCarriers(content)) {
    for (const rules of Object.values(target.responses ?? {})) {
      for (const rule of rules) record(rule.set, rule.add);
    }
  }
  for (const { option } of allDialogueOptions(content)) {
    record(option.set, option.add);
  }
  // A NODE'S OPENING IS A WRITER TOO (errata 239): the runner sets `openingOnce` when the tree opens on the node, and
  // performs `onOpen.set` with it. Nothing gated on one until the tent's table asked whether the séance had been heard.
  for (const { data } of content.dialogue) {
    for (const node of Object.values(data.nodes ?? {})) {
      if (node.openingOnce) record({ [node.openingOnce]: true }, undefined);
      if (node.openingOnce && node.onOpen?.set) record(node.onOpen.set, undefined);
    }
  }
  // A sequence beat is a writer like any other. Doc 17 v3 took the driver's
  // tree away, and with it the only content-side writer for the coach
  // departing and Hob crossing -- both of which Room 1 gates hotspots on. The
  // writes did not disappear, they moved to the beats; not counting them here
  // would report Room 1's gates as unsatisfiable, which is exactly backwards.
  for (const { data } of content.sequences ?? []) {
    for (const beat of data.beats ?? []) record(beat.set, beat.add);
  }
  // Errata 31c's room-entry writes. Standing somewhere is a write like any
  // other, and it is the only one no hotspot response can make.
  for (const { data } of content.rooms) record(data.onEnter?.set, undefined);
  for (const { data } of content.rooms) record(data.onEnter?.saySet, undefined);
  // Doc 35's auto-open: a character who opens on the player writes his
  // once-only flags when he does.
  for (const { data } of content.rooms) record(data.onEnter?.accost?.set, undefined);
  // Writes made on entry under a condition, and an arrival scene's outcome (doc 57 C6, D4, D6, F4).
  for (const { data } of content.rooms) for (const rule of data.onEnter?.setWhen ?? []) record(rule.set, undefined);
  for (const { data } of content.rooms) for (const scene of data.onEnter?.scenes ?? []) record(scene.after?.set, undefined);
  // A WAY IS A WRITER TOO (Fiddler's Gulch): taking it writes its `setOnTransit` (the mine's first crossing), and a
  // beat said at the door writes its `set` (BACK WHERE HE STARTED's count, THE WAY THROUGH). Uncounted, the
  // washout's way to the ledge read as gated on a flag nothing writes.
  for (const { data } of content.rooms) {
    for (const exit of data.exits ?? []) {
      record(exit.setOnTransit, undefined);
      for (const rule of exit.transitScene ?? []) record(rule.set, rule.add);
    }
  }
  // An item used on something is a writer too: a pair's own `set`, and each of
  // its cases' (Room 18's stairs open on the piano pair's T_ROOM_GRANTED).
  const combos = content.combinations?.data ?? content.combinations;
  for (const pair of combos?.pairs ?? []) {
    record(pair.set, undefined);
    for (const rule of pair.rules ?? []) record(rule.set, rule.add);
  }

  return { sets, adds };
}

function collectReads(content) {
  const reads = [];
  for (const { roomId, target } of allResponseCarriers(content)) {
    // Ruling 19a puts a gate on the target itself, not only on its lines: a
    // hotspot that does not exist yet is not a hotspot. Missing these meant a
    // whole class of gate went unchecked -- the one deciding whether the
    // player can see the object at all.
    for (const [id, expected] of Object.entries(target.when ?? {})) {
      reads.push({ id, expected, where: `${roomId}/${target.id}` });
    }
    for (const [verb, rules] of Object.entries(target.responses ?? {})) {
      for (const rule of rules) {
        for (const [id, expected] of Object.entries(rule.when ?? {})) {
          reads.push({ id, expected, where: `${roomId}/${target.id}/${verb}` });
        }
      }
    }
  }
  for (const { treeId, nodeId, option } of allDialogueOptions(content)) {
    for (const [id, expected] of Object.entries(option.when ?? {})) {
      reads.push({ id, expected, where: `${treeId}/${nodeId}/${option.id}` });
    }
    // A `whenAny` ALTERNATIVE IS A GATE TOO, and a tree's entries decide which
    // node it opens on (errata 143: the dialogue reveal audit). Neither was
    // read, so an option or a node behind an unwritable flag passed.
    for (const [index, any] of (option.whenAny ?? []).entries()) {
      for (const [id, expected] of Object.entries(any)) {
        reads.push({ id, expected, where: `${treeId}/${nodeId}/${option.id} (whenAny ${index + 1})` });
      }
    }
  }
  for (const { data } of content.dialogue) {
    for (const [index, entry] of (data.entries ?? []).entries()) {
      for (const [id, expected] of Object.entries(entry.when ?? {})) {
        reads.push({ id, expected, where: `${data.id}/entries[${index}] -> ${entry.node}` });
      }
    }
  }
  for (const { data } of content.rooms) {
    for (const [id, expected] of Object.entries(data.onEnter?.accost?.when ?? {})) {
      reads.push({ id, expected, where: `${data.id}/onEnter/accost` });
    }
    // A beat said at a door reads its own condition (the mine's wrong ways count by it).
    for (const exit of data.exits ?? []) {
      for (const [index, rule] of (exit.transitScene ?? []).entries()) {
        for (const [id, expected] of Object.entries(rule.when ?? {})) {
          reads.push({ id, expected, where: `${data.id}/${exit.id}/transitScene[${index}]` });
        }
      }
    }
  }
  return reads;
}

function satisfiable(expected, initial, writtenValues, canIncrement) {
  const matchesScalar = (value) =>
    typeof expected === 'boolean' || typeof expected === 'number'
      ? value === expected
      : matchesNumeric(value, expected);

  if (matchesScalar(initial)) return true;
  for (const encoded of writtenValues) {
    if (matchesScalar(JSON.parse(encoded))) return true;
  }
  // An `add` can grow an integer without bound, so an atLeast gate is reachable.
  if (canIncrement && typeof expected === 'object' && expected.atLeast !== undefined) return true;
  return false;
}

function matchesNumeric(value, test) {
  if (typeof value !== 'number') return false;
  if (test.atLeast !== undefined && value < test.atLeast) return false;
  if (test.atMost !== undefined && value > test.atMost) return false;
  if (test.equals !== undefined && value !== test.equals) return false;
  return true;
}

export function check() {
  const report = new Report('No flag is read before it can be written');
  const content = loadContent();

  const declared = new Map(content.flags.flags.map((flag) => [flag.id, flag]));
  const { sets, adds } = collectWrites(content);
  const reads = collectReads(content);

  for (const id of [...sets.keys(), ...adds]) {
    if (!declared.has(id)) {
      report.fail(`write to undeclared flag "${id}"`);
    }
  }

  // A flag some beat of the engine sets -- an animation finishing, a fade
  // ending -- has no `set` anywhere in content and would read as an
  // unsatisfiable gate. `writtenBy` on the declaration is where that is
  // recorded, and it is named here rather than trusted silently: every one is
  // reported on every run, so the list stays short and visible instead of
  // becoming a way to quiet the check.
  const byEngine = new Set(
    content.flags.flags
      .filter((flag) => (flag.writtenBy ?? []).some((source) => source.startsWith('engine:')))
      .map((flag) => flag.id),
  );

  // A flag whose writer is DESIGNED but not yet built. The letter's second
  // state is gated on the moment Thad learns Pike is dead, and that beat is
  // in Act I's unbuilt run -- so the gate is unsatisfiable today and will not
  // be later. Marked on the declaration, listed on every run for the same
  // reason the engine list is: an exemption nobody can see becomes a way to
  // quiet the check.
  const pending = new Set(
    content.flags.flags.filter((flag) => flag.pending).map((flag) => flag.id),
  );

  for (const { id, expected, where } of reads) {
    const definition = declared.get(id);
    if (!definition) {
      report.fail(`${where}: reads undeclared flag "${id}"`);
      continue;
    }
    const writtenValues = sets.get(id) ?? new Set();
    if (byEngine.has(id) || pending.has(id)) continue;
    if (!satisfiable(expected, definition.initial, writtenValues, adds.has(id))) {
      report.fail(`${where}: gate on "${id}" can never be satisfied -- nothing writes a passing value`);
    }
  }

  const readIds = new Set(reads.map((read) => read.id));
  const unread = [...declared.keys()].filter((id) => !readIds.has(id));
  report.note(`${declared.size} flags declared, ${reads.length} gates, ${sets.size + adds.size} written`);
  if (unread.length > 0) {
    report.note(`declared but never gated on: ${unread.join(', ')}`);
  }
  for (const id of pending) {
    const flag = declared.get(id);
    report.note(`gated on but its writer is not built yet: "${id}" -- `
      + `${(flag.writtenBy ?? ['unattributed']).join(', ')}`);
  }
  for (const id of byEngine) {
    const source = declared.get(id).writtenBy.find((entry) => entry.startsWith('engine:'));
    report.note(`gated on but written by no content: "${id}" -- ${source} must exist for it to fire`);
  }
  report.note('the ordering-aware half is check-puzzle-graph.mjs\'s (errata 219)');

  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
