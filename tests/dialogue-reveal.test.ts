/**
 * EVERY PROMPT IS REVEALED EXACTLY WHEN ITS TREE AND GATES SAY (errata 143;
 * Tyler, 2026-11-06: "...and that prompts are revealed correctly").
 *
 * Walks every node of every tree in the manifest, under every combination of
 * the values its options' gates test, through every order of selections the
 * node allows (counts capped where more selections cannot change the list),
 * leaving and coming back where an option ends the conversation. At every
 * list the runner offers it holds:
 *
 *  - the list against an ORACLE read straight from the data: an option is on
 *    it exactly when its `when`, `whenAny`, `holds` and `after` all hold and
 *    its aftermath has not taken it away (`remove` once taken, `replace` by
 *    what it names), in authored order -- so a gated option that shows early,
 *    an unlocked one that does not come back, and a used one that lingers all
 *    fail here by name;
 *  - no list is empty, no option shows twice, and there is always a way on
 *    (an exit, an option that ends, or one that moves to another node);
 *  - EXIT rows are last, and an ungated EXIT is always there;
 *  - a used `retain`/`rephrase` row greys, a `counted-repeat` row never does,
 *    and the answer to the k-th selection is the authored repeat for k,
 *    clamped at the last one;
 *  - every option is offered somewhere, and every node is reached.
 *
 * The flag half -- that a gate's passing value is written somewhere -- is
 * tools/check-flag-order.mjs's, which now reads `whenAny` and a tree's
 * `entries` too; and option text against its document is
 * `tools/extract-content.mjs --check`, which run-all runs.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { DialogueRunner, type PresentedOption } from '../engine/core/DialogueRunner.ts';
import { FlagStore } from '../engine/core/FlagStore.ts';
import type { Condition, ConditionValue, DialogueFile, DialogueNode, DialogueOption, FlagValue, PuzzleStatus } from '../engine/core/types.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
type Loaded = Awaited<ReturnType<typeof loadContent>>;

const EXIT = 'EXIT';
/** No list is explored past this many distinct states per node and setting: the largest node needs a few hundred. */
const STATE_CAP = 4000;

/** Every value a node's gates distinguish, per flag: the initial value and each side of each test. */
function domains(content: Loaded, node: DialogueNode): Map<string, FlagValue[]> {
  const initial = new Map(content.flags.flags.map((flag) => [flag.id, flag.initial] as const));
  const out = new Map<string, Set<string>>();
  const add = (id: string, value: FlagValue) => {
    if (!out.has(id)) out.set(id, new Set([JSON.stringify(initial.get(id))]));
    out.get(id)!.add(JSON.stringify(value));
  };
  const read = (condition?: Condition) => {
    for (const [id, expected] of Object.entries(condition ?? {})) {
      const value: ConditionValue = expected;
      if (typeof value === 'boolean') { add(id, true); add(id, false); continue; }
      if (typeof value === 'number') { add(id, value); add(id, value + 1); continue; }
      for (const n of [value.atLeast, value.atMost, value.equals]) {
        if (n === undefined) continue;
        add(id, n); add(id, n - 1 < 0 ? 0 : n - 1); add(id, n + 1);
      }
    }
  };
  const visit = (option: DialogueOption) => {
    read(option.when);
    for (const any of option.whenAny ?? []) read(any);
    if (option.replaceWith) visit(option.replaceWith);
  };
  node.options.forEach(visit);
  return new Map([...out].map(([id, values]) => [id, [...values].map((v) => JSON.parse(v) as FlagValue)]));
}

/** How many settings a node is walked under before the walk samples instead of enumerating. */
const FULL_PRODUCT = 16;

/** A value that passes one test of a gate. */
function passing(expected: ConditionValue): FlagValue {
  if (typeof expected === 'boolean' || typeof expected === 'number') return expected;
  return expected.atLeast ?? expected.equals ?? expected.atMost ?? 0;
}

/** A value that fails one test of a gate. */
function failing(expected: ConditionValue): FlagValue {
  if (typeof expected === 'boolean') return !expected;
  if (typeof expected === 'number') return expected + 1;
  if (expected.atLeast !== undefined) return Math.max(0, expected.atLeast - 1);
  if (expected.atMost !== undefined) return expected.atMost + 1;
  return (expected.equals ?? 0) + 1;
}

/**
 * The settings a node is walked under. Every combination of its gates' values
 * while there are few (a node with none has one setting, the initial one).
 * Past FULL_PRODUCT -- Sowerby's SOW_A1 reads seven flags, 128 combinations
 * and forty seconds -- the combinations that can matter to one option at a
 * time: the initial setting; each flag moved alone to each of its values;
 * each option's own gate (and each alternative of its `whenAny`) made to
 * pass; the same with every alternative of its `whenAny` made to fail; and
 * all of those passing together.
 */
function settings(domain: Map<string, FlagValue[]>, node: DialogueNode): Record<string, FlagValue>[] {
  let product: Record<string, FlagValue>[] = [{}];
  for (const [id, values] of domain) product = product.flatMap((partial) => values.map((value) => ({ ...partial, [id]: value })));
  if (product.length <= FULL_PRODUCT) return product;
  const out = new Map<string, Record<string, FlagValue>>();
  const keep = (setting: Record<string, FlagValue>) => out.set(JSON.stringify(Object.entries(setting).sort()), setting);
  keep({});
  for (const [id, values] of domain) for (const value of values) keep({ [id]: value });
  const all: Record<string, FlagValue> = {};
  const gates = node.options.flatMap((option) => {
    const own = Object.entries(option.when ?? {});
    const alternatives = (option.whenAny ?? []).map((any) => [...own, ...Object.entries(any)]);
    return alternatives.length ? alternatives : [own];
  });
  for (const gate of gates) {
    const setting = Object.fromEntries(gate.map(([id, expected]) => [id, passing(expected)]));
    keep(setting);
    Object.assign(all, setting);
  }
  for (const option of node.options) {
    if (!option.whenAny?.length) continue;
    const refused = Object.fromEntries(option.whenAny.flatMap((any) => Object.entries(any)).map(([id, expected]) => [id, failing(expected)]));
    keep({ ...Object.fromEntries(Object.entries(option.when ?? {}).map(([id, expected]) => [id, passing(expected)])), ...refused });
  }
  keep(all);
  return [...out.values()];
}

/** Whether a node's gate holds, read from the data and the flags alone: the oracle's half of `presentOptions`. */
function gateHolds(option: DialogueOption, flags: FlagStore, held: boolean, asked: (id: string) => boolean): boolean {
  if (!flags.test(option.when)) return false;
  if (option.whenAny && !option.whenAny.some((one) => flags.test(one))) return false;
  if ((option.holds ?? []).length > 0 && !held) return false;
  return (option.after ?? []).every(asked);
}

/** The repeat the k-th selection answers with: the last authored at or below k, else `repeat` from the second on. */
function expectedRepeat(option: DialogueOption, selection: number): string | null {
  if (selection < 2) return null;
  const at = [...(option.repeats ?? [])].filter((r) => r.selection <= selection).sort((a, b) => a.selection - b.selection).at(-1);
  if (at) return at.exchange?.[0]?.line ?? at.say ?? null;
  return option.repeat ?? null;
}

interface Walk {
  revealed: Set<string>;
  reachedNodes: Set<string>;
  failures: string[];
  /** Options whose own writes hide them from the list they `retain` in. Reported, not failed. */
  selfHiding: Set<string>;
  lists: number;
}

/** Walks one node of one tree under one setting of its gates. */
function walkNode(content: Loaded, tree: DialogueFile, nodeId: string, domain: Map<string, FlagValue[]>,
  setting: Record<string, FlagValue>, held: boolean, reached: boolean, walk: Walk): void {
  const node = tree.nodes[nodeId]!;
  const flags = new FlagStore(content.flags);
  for (const [id, value] of Object.entries(setting)) flags.set(id, value);
  const puzzles = new Map<string, PuzzleStatus>();
  const runner = new DialogueRunner(content.dialogue, flags, undefined, {
    reached: (puzzle) => reached || puzzles.get(puzzle) === 'complete',
    set: (puzzle, status) => { puzzles.set(puzzle, status); },
    holds: () => held,
    grant: () => {},
  }, content.assay ? { file: content.assay, grant: () => {} } : undefined);
  runner.restore({}, { tree: tree.id, node: nodeId });

  const where = `${tree.id}/${nodeId} ${JSON.stringify(setting)}${held ? ' holding' : ''}${reached ? ' milestones' : ''}`;
  // HOW FAR AN OPTION'S COUNT MATTERS TO THE LIST. A counted-repeat greys and counts; every other option is
  // only taken or not -- its asked-again answers change what is SAID, never what is OFFERED. Counting those
  // too (errata 172 gave nearly every question one) multiplied Frame's root past the cap for no new list.
  const caps = new Map(node.options.map((option) => [option.id,
    option.afterUse === 'counted-repeat'
      ? Math.max(2, ...(option.repeats ?? []).map((r) => r.selection)) + 1 : 1]));
  const seen = new Set<string>();
  type State = { flags: Record<string, FlagValue>; progress: ReturnType<DialogueRunner['progressSnapshot']>; puzzles: [string, PuzzleStatus][] };
  const queue: State[] = [{ flags: flags.snapshot(), progress: runner.progressSnapshot(), puzzles: [] }];

  const counts = (progress: State['progress'], id: string): number => progress[tree.id]?.[`${nodeId}:${id}`] ?? 0;
  // A STATE IS WHAT THE LIST CAN TELL APART: the flags this node's gates read
  // (a counter clamped past the largest value tested), the writes that end a
  // duel an option here starts, and each option's count up to where more
  // selections stop mattering. Anything else would let a counter that only
  // ever grows make every state new.
  const duelFlags = node.options.flatMap((o) => (o.duel ? Object.keys(content.assay?.duels[o.duel]?.sets ?? {}) : []));
  const ceiling = new Map([...domain].map(([id, values]) => [id,
    Math.max(0, ...values.filter((v): v is number => typeof v === 'number')) + 1]));
  const view = (values: Record<string, FlagValue>) => [...domain.keys(), ...duelFlags].map((id) => {
    const value = values[id];
    return typeof value === 'number' ? Math.min(value, ceiling.get(id) ?? value) : value;
  });
  const signature = (state: State) => JSON.stringify([view(state.flags), node.options.map((o) => Math.min(counts(state.progress, o.id), caps.get(o.id) ?? 1)),
    node.options.map((o) => (o.replaceWith ? Math.min(counts(state.progress, o.replaceWith.id), 2) : 0))]);
  // THE NODE AS A GRAPH, to prove nobody is ever trapped in it: a list may
  // have no way on yet (the stage driver's exit waits for his three
  // questions), but some order of choices from it must reach one.
  const OUT = '#out';
  const edges = new Map<string, Set<string>>();
  const load = (state: State) => {
    flags.restore(state.flags);
    puzzles.clear();
    for (const [id, status] of state.puzzles) puzzles.set(id, status);
    runner.restore(state.progress, { tree: tree.id, node: nodeId });
  };

  while (queue.length && seen.size < STATE_CAP) {
    const state = queue.shift()!;
    const key = signature(state);
    if (seen.has(key)) continue;
    seen.add(key);
    const onward = new Set<string>();
    edges.set(key, onward);
    load(state);
    const list = runner.presentOptions();
    walk.lists += 1;
    const asked = (id: string) => counts(state.progress, id) > 0;

    // THE ORACLE: what the data says is on this list, in authored order.
    const expected: { id: string; exhausted: boolean }[] = [];
    for (const option of node.options) {
      if (!gateHolds(option, flags, held, asked)) continue;
      const taken = counts(state.progress, option.id);
      if (option.afterUse === 'remove' && taken > 0) {
        // An option that starts a duel stays until the duel has written its result (invariant 6).
        const duelWrites = option.duel ? content.assay?.duels[option.duel]?.sets ?? {} : null;
        const done = !duelWrites || Object.entries(duelWrites).every(([flag, value]) => flags.get(flag) === value);
        if (done) continue;
      }
      const shown = option.afterUse === 'replace' && taken > 0 && option.replaceWith ? option.replaceWith : option;
      const selections = shown === option ? taken : counts(state.progress, shown.id);
      expected.push({ id: shown.id, exhausted: selections > 0 && shown.afterUse !== 'counted-repeat' });
    }
    const got = list.map((p) => ({ id: p.option.id, exhausted: p.exhausted }));
    if (JSON.stringify(got) !== JSON.stringify(expected)) {
      walk.failures.push(`${where} after ${JSON.stringify(state.progress[tree.id] ?? {})}: offered ${JSON.stringify(got)}, the data says ${JSON.stringify(expected)}`);
    }
    if (list.length === 0) { walk.failures.push(`${where}: an empty list`); continue; }
    const ids = list.map((p) => p.option.id);
    if (new Set(ids).size !== ids.length) walk.failures.push(`${where}: an option shows twice (${ids.join(', ')})`);
    const texts = list.map((p) => p.text);
    if (new Set(texts).size !== texts.length) walk.failures.push(`${where}: two rows read the same`);
    // EXIT LAST, and no list without a way on.
    const firstExit = list.findIndex((p) => p.option.tag === EXIT);
    if (firstExit >= 0 && list.slice(firstExit).some((p) => p.option.tag !== EXIT)) {
      walk.failures.push(`${where}: an option follows the exit (${ids.join(', ')})`);
    }
    for (const option of node.options) {
      const ungated = !option.when && !option.whenAny && !(option.after ?? []).length && !(option.holds ?? []).length;
      if (option.tag === EXIT && ungated && option.afterUse !== 'remove' && !ids.includes(option.id)) {
        walk.failures.push(`${where}: the ungated exit ${option.id} is missing`);
      }
    }

    for (const presented of list) {
      walk.revealed.add(`${tree.id}/${nodeId}/${presented.option.id}`);
      load(state);
      const option = presented.option;
      const selection = counts(state.progress, option.id) + 1;
      let said;
      try {
        said = runner.select(option.id);
      } catch (error) {
        walk.failures.push(`${where}: choosing ${option.id} throws: ${(error as Error).message}`);
        continue;
      }
      // THE K-TH ANSWER IS THE AUTHORED REPEAT FOR K, clamped at the last.
      const repeat = expectedRepeat(option, selection);
      const rephrased = option.afterUse === 'rephrase' && option.rephrase && reached;
      if (repeat !== null && !rephrased && said.say !== repeat) {
        walk.failures.push(`${where}: selection ${selection} of ${option.id} answers ${JSON.stringify(said.say)}, its repeat is ${JSON.stringify(repeat)}`);
      }
      // A duel takes the list over (its counters are the Assay's tests'); an
      // ending or a move to another node is a way on.
      if (option.duel || !runner.isActive || runner.positionSnapshot().node !== nodeId) onward.add(OUT);
      if (option.duel) continue;
      if (!runner.isActive) {
        // ENDED. Coming back to the tree must find what the conversation unlocked.
        runner.start(tree.id);
        if (runner.positionSnapshot().node !== nodeId) continue;
      } else if (runner.positionSnapshot().node !== nodeId) {
        walk.reachedNodes.add(`${tree.id}/${runner.positionSnapshot().node}`);
        continue;
      }
      const next: State = { flags: flags.snapshot(), progress: runner.progressSnapshot(), puzzles: [...puzzles] };
      // A ROW THAT RETAINS AND HIDES ITSELF BY ITS OWN WRITE: reported for the owner, not failed.
      const after = runner.presentOptions().map((p) => p.option.id);
      if ((option.afterUse ?? 'retain') !== 'remove' && option.afterUse !== 'replace' && !after.includes(option.id)) {
        walk.selfHiding.add(`${tree.id}/${nodeId}/${option.id}`);
      }
      onward.add(signature(next));
      queue.push(next);
    }
  }
  if (seen.size >= STATE_CAP) walk.failures.push(`${where}: more than ${STATE_CAP} states -- raise the cap or narrow the walk`);
  // NOBODY IS TRAPPED: every list can reach a way on.
  const free = new Set<string>([OUT]);
  for (let grew = true; grew;) {
    grew = false;
    for (const [state, next] of edges) {
      if (!free.has(state) && [...next].some((one) => free.has(one))) { free.add(state); grew = true; }
    }
  }
  const trapped = [...edges.keys()].filter((state) => !free.has(state));
  if (trapped.length) walk.failures.push(`${where}: ${trapped.length} state(s) from which no order of choices leaves the node`);
}

/** The nodes a tree can open on or move to, from its start and entries through every goto. */
function reachableNodes(tree: DialogueFile): Set<string> {
  const out = new Set<string>([tree.start, ...(tree.entries ?? []).map((entry) => entry.node)]);
  const queue = [...out];
  while (queue.length) {
    const node = tree.nodes[queue.shift()!];
    for (const option of node?.options ?? []) {
      for (const target of [option.goto, option.replaceWith?.goto]) {
        if (target && !out.has(target)) { out.add(target); queue.push(target); }
      }
    }
  }
  return out;
}

test('every option in every tree is offered exactly when its gates say, and every one can be', async () => {
  const content = await loadContent(fsReader);
  const walk: Walk = { revealed: new Set(), reachedNodes: new Set(), failures: [], selfHiding: new Set(), lists: 0 };
  const unreachable: string[] = [];
  for (const tree of content.dialogue.values()) {
    const reachable = reachableNodes(tree);
    for (const nodeId of Object.keys(tree.nodes)) {
      if (!reachable.has(nodeId)) { unreachable.push(`${tree.id}/${nodeId}`); continue; }
      const node = tree.nodes[nodeId]!;
      const holding = node.options.some((o) => (o.holds ?? []).length) ? [false, true] : [false];
      const milestones = node.options.some((o) => o.rephrase) ? [false, true] : [false];
      const domain = domains(content, node);
      for (const setting of settings(domain, node)) {
        for (const held of holding) for (const reached of milestones) walkNode(content, tree, nodeId, domain, setting, held, reached, walk);
      }
    }
  }
  assert.deepEqual(walk.failures.slice(0, 20), [], `${walk.failures.length} failure(s)`);
  assert.deepEqual(unreachable, [], 'every node is opened on or moved to by something');
  const never: string[] = [];
  for (const tree of content.dialogue.values()) {
    for (const [nodeId, node] of Object.entries(tree.nodes)) {
      for (const option of node.options) {
        if (!walk.revealed.has(`${tree.id}/${nodeId}/${option.id}`)) never.push(`${tree.id}/${nodeId}/${option.id}`);
        if (option.afterUse === 'replace' && option.replaceWith && !walk.revealed.has(`${tree.id}/${nodeId}/${option.replaceWith.id}`)) {
          never.push(`${tree.id}/${nodeId}/${option.replaceWith.id} (replacing ${option.id})`);
        }
      }
    }
  }
  assert.deepEqual(never, [], 'every option is offered in some state its gates allow');
  assert.ok(walk.lists > 300, `lists checked: ${walk.lists}`);
  // Reported, not failed: an option that keeps its row and hides it by its own write.
  if (walk.selfHiding.size) console.log(`options that hide themselves by their own write: ${[...walk.selfHiding].join(', ')}`);
});

test('the walker sees the defects it exists for', async () => {
  // A runner that left a `remove` row on the list, or offered a gated row
  // early, would fail the oracle above. Proved here on a tree built for it,
  // so the proof needs no edit to the engine.
  const content = await loadContent(fsReader);
  const flags = new FlagStore(content.flags);
  const gate = content.flags.flags.find((flag) => flag.initial === false)!.id;
  const tree: DialogueFile = {
    schema: 1, id: 'T', start: 'N', nodes: { N: { options: [
      { id: 'a', text: 'A', tag: 'PROGRESS', afterUse: 'remove' },
      { id: 'b', text: 'B', tag: 'TOPIC', after: ['a'] },
      { id: 'c', text: 'C', tag: 'COMIC', when: { [gate]: true } },
      { id: 'x', text: 'X', tag: EXIT },
    ] } },
  };
  const runner = new DialogueRunner(new Map([['T', tree]]), flags);
  runner.start('T');
  assert.deepEqual(runner.presentOptions().map((p: PresentedOption) => p.option.id), ['a', 'x'], 'b waits for a; c waits for its flag');
  runner.select('a');
  assert.deepEqual(runner.presentOptions().map((p: PresentedOption) => p.option.id), ['b', 'x'], 'a is gone; b is unlocked');
  runner.select('x');
  flags.set(gate, true);
  runner.start('T');
  assert.deepEqual(runner.presentOptions().map((p: PresentedOption) => p.option.id), ['b', 'c', 'x'], 'on return: b still unlocked, c now gated open, exit last');
});

test('a row the list would not offer cannot be chosen by id, `whenAny` included', async () => {
  const content = await loadContent(fsReader);
  const flags = new FlagStore(content.flags);
  const gate = content.flags.flags.find((flag) => flag.initial === false)!.id;
  const tree: DialogueFile = {
    schema: 1, id: 'T', start: 'N', nodes: { N: { options: [
      { id: 'any', text: 'Any', tag: 'TOPIC', whenAny: [{ [gate]: true }] },
      { id: 'x', text: 'X', tag: EXIT },
    ] } },
  };
  const runner = new DialogueRunner(new Map([['T', tree]]), flags);
  runner.start('T');
  assert.deepEqual(runner.presentOptions().map((p: PresentedOption) => p.option.id), ['x']);
  assert.throws(() => runner.select('any'), /Gated option selected/);
});
