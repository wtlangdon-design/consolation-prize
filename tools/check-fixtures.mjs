import { loadContent, Report, runCheck } from './lib/content.mjs';

/**
 * PLAYTEST FIXTURES ARE LEGAL STATES OR THEY ARE NOT FIXTURES. Doc 36 Q111.
 *
 * A fixture is restored exactly as a save is, so anything it names must
 * exist: the room, every flag and counter, every item. And a state the real
 * game cannot reach is worse than no fixture -- it lets a review happen in
 * a situation no player will be in -- so the documented ordering of the
 * flags the fixtures use is written here as prerequisites, each with the
 * document that states it, and a fixture that sets a flag without the flags
 * that must precede it fails by name. The table grows as fixtures do; it is
 * not the puzzle graph and does not claim to be.
 */
const PREREQUISITES = [
  // ACT 2 is set at S1, the dinner at Fanshawe's, after the swindle -- docs/48-act-turn-beats.md:17-30; errata 60.
  { when: (f) => counter(f, 'ACT') >= 2, need: ['T_OPENING_DONE', 'T_SWINDLED'], why: 'ACT 2 is doc 48 S1, which sets T_SWINDLED; the opening is long over' },
  // ACT 3 is the funeral's opening (S2), ACT 4 is S4's close -- each after the previous act.
  { when: (f) => counter(f, 'ACT') >= 3, need: ['T_BORDERS_MOTT', 'T_ASSAY_QUEUE'], why: 'Act III follows the Act II chain: A9 (T_BORDERS_MOTT), then C1 (T_ASSAY_QUEUE) -- docs/02-puzzle-graph.md:32,64' },
  // T_ASSAY_QUEUE is WIN_B1 option 1, and WIN_B1 opens on T_BORDERS_MOTT -- docs/04-dialogue-trees.md:98,106.
  { when: (f) => f.flags.T_ASSAY_QUEUE === true, need: ['T_BORDERS_MOTT'], why: 'T_ASSAY_QUEUE is written in WIN_B1, which opens on T_BORDERS_MOTT' },
  // WIN_B2's rows follow C5, which follows C1 -- docs/02-puzzle-graph.md:64-68; docs/04-dialogue-trees.md:124-126.
  { when: (f) => f.flags.T_NO_MOTT_GOLD === true || f.flags.T_SECOND_LEDGER === true, need: ['T_ASSAY_QUEUE'], why: 'WIN_B2 (after C5) is reached after C1 wrote T_ASSAY_QUEUE' },
  // The strike is Act IV -- docs/04-dialogue-trees.md:24,170; F3 needs the pickaxe -- docs/02-puzzle-graph.md:118.
  { when: (f) => f.flags.T_STRIKE_FOUND === true, need: ['T_SWINDLED', 'T_BORDERS_MOTT'], counters: { ACT: 4 }, items: ['pickaxe'], why: 'T_STRIKE_FOUND is F3, Act IV, dug with the pickaxe' },
  // Anything past the opening has the opening's own flags -- docs/17-opening-sequence.md.
  { when: (f) => f.flags.T_OPENING_DONE === true, need: ['T_COACH_DEPARTED', 'T_HOB_GONE', 'T_CASE_TAKEN'], why: 'the opening is done only after the coach left, Hob went and the case was taken' },
  // The watch is traded at A3 and the four dollars spent -- docs/02-puzzle-graph.md:26,129-130: neither is held once swindled.
  { when: (f) => f.flags.T_SWINDLED === true, forbidItems: ['four_dollars'], why: 'the four dollars are spent at A3, before the swindle' },
];
const counter = (f, id) => (typeof f.flags[id] === 'number' ? f.flags[id] : 0);

export function check() {
  const report = new Report('Playtest fixtures are declared, legal, and say what they expect');
  const content = loadContent();
  const flagDefs = new Map((content.flags.flags ?? []).map((flag) => [flag.id, flag]));
  const roomIds = new Set(content.rooms.map(({ data }) => data.id));
  const itemIds = new Set(content.items.map(({ data }) => data.id));
  const trees = new Map(content.dialogue.map(({ data }) => [data.id, data]));
  const files = content.fixtures ?? [];
  if (!files.length) { report.note('no fixture files in the manifest'); return report; }
  const seen = new Set();
  for (const { path, data } of files) {
    for (const fixture of data.fixtures ?? []) {
      const where = `${path}: ${fixture.id}`;
      if (seen.has(fixture.id)) report.fail(`${where}: duplicate id`);
      seen.add(fixture.id);
      if (!/^[a-z][a-z0-9_-]{0,31}$/.test(fixture.id ?? '')) report.fail(`${where}: id is not a short lower-case name`);
      if (!fixture.label) report.fail(`${where}: no label`);
      if (!roomIds.has(fixture.room)) report.fail(`${where}: room "${fixture.room}" is not a room`);
      for (const [id, value] of Object.entries(fixture.flags ?? {})) {
        const def = flagDefs.get(id);
        if (!def) { report.fail(`${where}: flag "${id}" is not declared`); continue; }
        const numeric = typeof def.initial === 'number';
        if (numeric !== (typeof value === 'number')) report.fail(`${where}: ${id} is ${numeric ? 'a counter' : 'a flag'} and the fixture gives it ${JSON.stringify(value)}`);
      }
      for (const id of fixture.inventory ?? []) if (!itemIds.has(id)) report.fail(`${where}: item "${id}" is not an item`);
      for (const key of Object.keys(fixture.objectStates ?? {})) {
        const [room, object] = key.split('/');
        const found = content.rooms.find(({ data }) => data.id === room)?.data;
        const target = [...(found?.hotspots ?? []), ...(found?.exits ?? [])].find((one) => one.id === object);
        if (!target) report.fail(`${where}: objectStates key "${key}" names no object`);
        else if (!target.states?.[fixture.objectStates[key]]) report.fail(`${where}: ${key} has no state "${fixture.objectStates[key]}"`);
      }
      const held = new Set([...(fixture.inventory ?? []), ...content.items.filter(({ data }) => data.startsHeld).map(({ data }) => data.id)]);
      for (const rule of PREREQUISITES) {
        if (!rule.when(fixture)) continue;
        for (const id of rule.need ?? []) if (fixture.flags[id] !== true) report.fail(`${where}: sets a state that needs ${id} first -- ${rule.why}`);
        for (const [id, at] of Object.entries(rule.counters ?? {})) if (counter(fixture, id) !== at) report.fail(`${where}: needs ${id} ${at} -- ${rule.why}`);
        for (const id of rule.items ?? []) if (!held.has(id)) report.fail(`${where}: needs the item ${id} held -- ${rule.why}`);
        for (const id of rule.forbidItems ?? []) if (held.has(id)) report.fail(`${where}: must not hold ${id} -- ${rule.why}`);
      }
      // WHAT IT EXPECTS, checked against the tree's own entry table: the node
      // the named tree opens on under these flags.
      const expect = fixture.expect ?? {};
      if (expect.tree) {
        const tree = trees.get(expect.tree);
        if (!tree) report.fail(`${where}: expects tree "${expect.tree}", which is not a tree`);
        else {
          const opens = (tree.entries ?? []).find((entry) => Object.entries(entry.when ?? {}).every(([id, value]) => fixture.flags[id] === value))?.node ?? tree.start;
          if (expect.opensOn && opens !== expect.opensOn) report.fail(`${where}: ${expect.tree} opens on ${opens} under these flags, not ${expect.opensOn}`);
          else report.note(`${fixture.id}: ${expect.tree} opens on ${opens}`);
        }
      }
      const room = content.rooms.find(({ data }) => data.id === fixture.room)?.data;
      const targets = [...(room?.hotspots ?? []), ...(room?.exits ?? [])];
      for (const id of expect.interactables ?? []) {
        const target = targets.find((one) => one.id === id);
        if (!target) { report.fail(`${where}: expects interactable "${id}", which ${fixture.room} does not have`); continue; }
        if (target.when && !gateOpen(target.when, fixture.flags)) report.fail(`${where}: expects "${id}" but its gate ${JSON.stringify(target.when)} is shut under these flags`);
      }
      for (const id of expect.absent ?? []) {
        const target = targets.find((one) => one.id === id);
        if (target && (!target.when || gateOpen(target.when, fixture.flags))) report.fail(`${where}: expects "${id}" absent but it is a target under these flags`);
      }
      report.note(`${fixture.id}: ${Object.keys(fixture.flags ?? {}).length} flag(s), ${(fixture.inventory ?? []).length} item(s), ${(fixture.notBuilt ?? []).length} not-built note(s)`);
    }
  }
  return report;
}

/** Whether a `when` gate opens under a flag set: booleans equal, counters within atLeast/atMost. */
function gateOpen(when, flags) {
  return Object.entries(when).every(([id, cond]) => {
    const value = flags[id] ?? (typeof cond === 'object' ? 1 : false);
    if (typeof cond === 'object' && cond !== null) {
      const n = typeof value === 'number' ? value : 0;
      return (cond.atLeast === undefined || n >= cond.atLeast) && (cond.atMost === undefined || n <= cond.atMost);
    }
    return value === cond;
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
