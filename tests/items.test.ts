/**
 * EVERY ITEM, EVERY WAY IT IS HELD (the items audit, errata 140).
 *
 * Tyler asked whether every item in the inventory, and every item that can be
 * picked up, is "crafted correctly, able to be picked up, combined if/when
 * they need to be". Each test below holds one category for EVERY item the
 * manifest loads, so an item added later is held to it without anyone
 * remembering to: what it is as data, how it is got, what it is for, when it
 * leaves, and how the inventory answers it.
 *
 * Every defect the audit found fails one of these when it is put back.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { PanelLayout } from '../engine/render/Screen.ts';
import type { Condition, Interactable } from '../engine/core/types.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; it reads 8-bit RGBA PNGs.
import { readPng } from '../tools/lib/png.mjs';
import { HeadlessPlayer, playThrough, type Step } from './lib/headless-player.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const doc23 = readFileSync(resolve(ROOT, 'docs/23-inventory-act1.md'), 'utf8');
const doc57 = readFileSync(resolve(ROOT, 'docs/57-puzzle-completion.md'), 'utf8');
const walkthrough = JSON.parse(readFileSync(resolve(ROOT, 'tests/data/full-game-walkthrough.json'), 'utf8')) as { steps: Step[] };

/** The real items: everything the manifest loads but the playtest fixture's token. */
const items = [...content.items.values()].filter((item) => !(item as { fixture?: boolean }).fixture);
const ids = new Set(items.map((item) => item.id));
const pairs = content.combinations?.pairs ?? [];

/** Doc 23's sections by display name: its acquisition line and its LOOK / LISTEN runs. */
const doc23Sections = new Map<string, { acquired: string; runs: Record<string, string[][]> }>();
for (const section of doc23.split(/^## /m).slice(1)) {
  const head = section.split('\n')[0]!.trim();
  const runs: Record<string, string[][]> = { LOOK_AT: [], LISTEN_TO: [] };
  for (const [, verb, run] of section.matchAll(/\*\*(LOOK|LISTEN)\*\* (.+)$/gm)) {
    runs[verb === 'LOOK' ? 'LOOK_AT' : 'LISTEN_TO']!.push([...run!.matchAll(/\d "([^"]+)"/g)].map((m) => m[1]!));
  }
  doc23Sections.set(head, { acquired: /^\*(.+)\*$/m.exec(section)?.[1] ?? '', runs });
}
/**
 * FIDDLER'S GULCH'S ITEMS ARE DOC 109'S (reference/fiddlers-gulch/brief.md: extracted from doc 109 directly, never
 * copied into doc 23): `**NAME** *(item)*` and its LOOK and LISTEN runs, checked word for word as doc 23's are.
 */
// Doc 113's one item (errata 242) is written in the same form, and is read with them.
const doc109 = `${readFileSync(resolve(ROOT, 'docs/109-fiddlers-gulch-lines.md'), 'utf8')}\n${readFileSync(resolve(ROOT, 'docs/113-act-two-scenes.md'), 'utf8')}`;
const doc109Sections = new Map<string, Record<string, string[][]>>();
for (const block of doc109.split(/^(?=\*\*[^*]+\*\* \*\(item\)\*)/m).slice(1)) {
  const head = /^\*\*([^*]+)\*\*/.exec(block)![1]!;
  const runs: Record<string, string[][]> = { LOOK_AT: [], LISTEN_TO: [] };
  for (const [, verb, run] of block.split('\n').slice(1, 3).join('\n').matchAll(/\*\*(LOOK|LISTEN)\*\* (.+)$/gm)) {
    runs[verb === 'LOOK' ? 'LOOK_AT' : 'LISTEN_TO']!.push([...run!.matchAll(/\d "([^"]+)"/g)].map((m) => m[1]!));
  }
  doc109Sections.set(head, runs);
}
/**
 * ACT III'S SCENE C ITEMS ARE DOC 111'S (errata 237), read from its THE LINES as they are extracted: `- **NAME** · LOOK —
 * "..."` and LISTEN, one line each as the document writes them; an item doc 111 names and writes no line for is
 * `linesPending`. Its fate is doc 111's words: THE SALE's "THE HEN and THE RACCOON, IN MY COAT leave inventory", and the
 * money "as Sheng's loan" at the undertaker's (doc 57 E3.3, where the loan is spent).
 */
const doc111 = readFileSync(resolve(ROOT, 'docs/111-scenes-b-and-c.md'), 'utf8');
const doc111Lines = (name: string) => {
  const said = (verb: string) => [...doc111.matchAll(/^- \*\*([^*]+)\*\* · (LOOK|LISTEN) — "([^"]+)"$/gm)]
    .filter((m) => m[1] === name && m[2] === verb).map((m) => m[3]!);
  return { LOOK_AT: said('LOOK'), LISTEN_TO: said('LISTEN') };
};
const doc111Fate = (name: string) => {
  const sale = /→ MR\. PRATT'S TWO DOLLARS AND SIXTY CENTS; (.+) leave inventory\./.exec(doc111)?.[1] ?? '';
  if (sale.split(' and ').includes(name)) return 'Given to (doc 111: leave inventory)';
  if (doc111.includes(`· USE ${name} — as Sheng's loan today`)) return 'Spent (doc 111: as Sheng\'s loan, doc 57 E3.3)';
  return '';
};
/** Items whose hand-over is built later on the same trip, each with its reason (proofs/played-pending.json `items`). */
const pendingSource = (JSON.parse(readFileSync(resolve(ROOT, 'proofs/played-pending.json'), 'utf8')).items ?? {}) as Record<string, string>;
const doc23Rows = [...doc23.matchAll(/^\| ([a-z_]+) \| (.+?) \| (.+?) \|$/gm)]
  .filter((row) => row[1] !== 'Item').map(([, , full, display]) => ({ full: full!, display: display! }));
// A Gulch item's fate is doc 109's own words where it is handed on: "THE CLARION leaves inventory" (G3).
const sectionOf = (id: string) => {
  const short = content.items.get(id)?.short ?? '';
  const name = content.items.get(id)?.name ?? '';
  if (doc111.includes(`**${name}**`) || doc111.includes(`· USE ${name} `)) {
    const lines = doc111Lines(name);
    return { acquired: doc111Fate(name), runs: { LOOK_AT: lines.LOOK_AT.map((one) => [one]), LISTEN_TO: lines.LISTEN_TO.map((one) => [one]) } };
  }
  const runs = doc109Sections.get(short);
  return doc23Sections.get(short) ?? (runs
    ? { acquired: doc109.includes(`${short} leaves inventory`) ? 'Given to (doc 109: leaves inventory)' : '', runs }
    : undefined);
};

/** Every way content hands an item over, by item id. */
function sources(): Map<string, { where: string; once: boolean }[]> {
  const out = new Map<string, { where: string; once: boolean }[]>();
  const add = (id: string, where: string, once: boolean) => { out.set(id, [...(out.get(id) ?? []), { where, once }]); };
  const boundedBy = (when: Condition | undefined) => Object.values((when ?? {}) as Record<string, unknown>).some((v) => v === false || v === 0);
  for (const item of items) if (item.startsHeld || item.heldWhen) add(item.id, `${item.id} held by flag`, true);
  for (const room of content.rooms.values()) {
    for (const target of [...room.hotspots, ...room.exits]) {
      for (const rules of Object.values(target.responses ?? {})) {
        for (const rule of rules) {
          // `items` takes the source with it (the case is gone); `grants` leaves it, so the rule bounds itself.
          for (const id of rule.items ?? []) add(id, `${room.id}/${target.id} items`, true);
          for (const id of rule.grants ?? []) add(id, `${room.id}/${target.id} grants`, boundedBy(rule.when) || Boolean(rule.untilPuzzles?.length));
        }
      }
    }
    for (const scene of (room.onEnter?.scenes ?? []) as { when?: Condition; after?: { gives?: string[] } }[]) {
      for (const id of scene.after?.gives ?? []) add(id, `${room.id} arrival scene`, boundedBy(scene.when));
    }
  }
  for (const tree of content.dialogue.values()) {
    for (const [name, node] of Object.entries(tree.nodes ?? {})) {
      for (const id of node.onOpen?.gives ?? []) add(id, `${tree.id}/${name} opening`, true);
      for (const option of node.options ?? []) {
        for (const id of option.gives ?? []) add(id, `${tree.id}/${name}/${option.id}`, option.afterUse === 'remove' || boundedBy(option.when));
      }
    }
  }
  for (const pair of pairs) {
    for (const rule of pair.rules ?? []) {
      for (const id of rule.items ?? []) add(id, `${pair.item} on ${pair.room}/${pair.target} (${rule.case})`, boundedBy(rule.when));
    }
  }
  for (const [duel, spec] of Object.entries((content.assay?.duels ?? {}) as Record<string, { yields?: string[] }>)) {
    for (const id of spec.yields ?? []) add(id, `assay ${duel}`, true);
  }
  return out;
}

/** What spends an item: a pair that takes it, or the flag it is lost by. */
const takers = (id: string) => pairs.filter((pair) => pair.rules?.some((rule) => rule.takes?.includes(id)));

/** The continuous playthrough, with what he carried after every step. */
function playWhole() {
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);
  const carriedAt: { step: string; carried: string[] }[] = [];
  for (const step of walkthrough.steps) {
    playThrough(player, [step]);
    carriedAt.push({ step: step.id, carried: [...state.carried] });
  }
  return { state, player, carriedAt };
}
const whole = playWhole();
const everCarried = new Set(whole.carriedAt.flatMap((one) => one.carried));

/* ---- 1. It exists as data ------------------------------------------------- */

test('every item is doc 23\'s: one row and one section each, the names it gives, and its LOOK and LISTEN lines verbatim', () => {
  const rows = new Map(doc23Rows.map((row) => [row.display, row]));
  assert.deepEqual([...rows.keys()].filter((display) => !items.some((item) => item.short === display)), [],
    'doc 23 rows with no item in the manifest');
  for (const item of items) {
    // Doc 111's (errata 237): its one LOOK and one LISTEN, word for word, or none written and marked pending.
    if (doc111.includes(`· USE ${item.name} `) || doc111.includes(`**${item.name}**`)) {
      const lines = doc111Lines(item.name);
      if (!lines.LOOK_AT.length && !lines.LISTEN_TO.length) {
        assert.ok(item.linesPending, `${item.id}: doc 111 writes it no LOOK or LISTEN, and it is not marked linesPending`);
        continue;
      }
      for (const verb of ['LOOK_AT', 'LISTEN_TO'] as const) {
        assert.deepEqual((item.responses?.[verb] ?? []).map((rule) => rule.say), lines[verb], `${item.id}: ${verb} is not doc 111's, word for word`);
      }
      continue;
    }
    const gulch = doc109Sections.get(item.short ?? '');
    if (gulch) {
      for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
        const rules = item.responses?.[verb] ?? [];
        assert.deepEqual(rules.map((rule) => [rule.say, ...(rule.repeat ?? [])].join(' / ')).sort(),
          gulch[verb]!.map((run) => run.join(' / ')).sort(), `${item.id}: ${verb} is not doc 109's, word for word`);
        for (const rule of rules) assert.equal(1 + (rule.repeat?.length ?? 0), 3, `${item.id}: ${verb} has three variants (doc 05)`);
      }
      continue;
    }
    const row = rows.get(item.short ?? '');
    assert.ok(row, `${item.id}: no doc 23 row draws "${item.short}"`);
    assert.equal(item.name, row.full, `${item.id}: its full name is doc 23's`);
    const section = sectionOf(item.id);
    assert.ok(section, `${item.id}: no doc 23 section headed ${item.short}`);
    for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
      const rules = item.responses?.[verb] ?? [];
      assert.ok(rules.length, `${item.id}: no ${verb}`);
      const got = rules.map((rule) => [rule.say, ...(rule.repeat ?? [])].join(' / ')).sort();
      const want = section.runs[verb]!.map((run) => run.join(' / ')).sort();
      // Character for character: a curly quote typed over the document's
      // straight one is a hand edit, and the deed carried two.
      assert.deepEqual(got, want, `${item.id}: ${verb} is not doc 23's, word for word`);
      for (const rule of rules) assert.equal(1 + (rule.repeat?.length ?? 0), 3, `${item.id}: ${verb} has three variants (doc 05)`);
    }
  }
});

test('every item has an icon cell inside the sheet, with something drawn in it', () => {
  const table = content.itemIcons;
  const sheet = readPng(readFileSync(resolve(ROOT, table.sheet)));
  for (const item of items) {
    const cell = table.icons[item.id];
    // An icon another session is to draw says whose (errata 237), and the panel draws its labelled box meanwhile.
    if (!cell && typeof item.iconPending === 'string' && item.iconPending.length) continue;
    assert.ok(cell, `${item.id}: no icon`);
    const [x, y, w, h] = cell;
    assert.ok(x >= 0 && y >= 0 && x + w <= sheet.width && y + h <= sheet.height, `${item.id}: its cell is outside the sheet`);
    let opaque = 0;
    for (let row = y; row < y + h; row += 1) for (let col = x; col < x + w; col += 1) {
      if (sheet.pixels[(row * sheet.width + col) * 4 + 3] > 0) opaque += 1;
    }
    assert.ok(opaque >= (w * h) / 20, `${item.id}: its icon cell is (nearly) empty -- ${opaque} pixels`);
  }
});

/* ---- 2. It can be obtained, once ----------------------------------------- */

test('every item has a source, and the continuous playthrough carries every item it does not leave optional', () => {
  const all = sources();
  for (const item of items) {
    if (pendingSource[item.id]) {
      // A PENDING SOURCE COMES OFF THE LIST THE DAY IT IS BUILT: an item that is handed over and still listed fails.
      assert.ok(!all.get(item.id)?.length, `${item.id} is handed over now -- take it out of proofs/played-pending.json's items`);
      continue;
    }
    assert.ok(all.get(item.id)?.length, `${item.id}: nothing in the game hands it over`);
  }
  // Doc 54 A5's bait and smoke are the two attempts the player may skip
  // (errata 68 A: "Both attempts are optional").
  // SHENG'S LOAN is kept for a save already past it (doc 110 section 1; errata 237): the estate sale pays for the
  // funeral now, and a fresh game is never offered the loan.
  const optional = new Set(['eggs', 'tonic', 'loan']);
  assert.deepEqual(items.map((item) => item.id).filter((id) => !everCarried.has(id) && !optional.has(id) && !pendingSource[id]), [],
    'items the whole game, played through, never puts in his hand');
});

test('a source that hands over something spendable is bounded, so a spent item never comes back', () => {
  // The filing fee is the game's repeatable money by design (doc 57 A8: "the
  // piano is flat again every time Thad comes back").
  const repeatable = new Set(['filing_fee']);
  const all = sources();
  const loose: string[] = [];
  for (const item of items) {
    if (repeatable.has(item.id) || (!takers(item.id).length && !item.lostWhen)) continue;
    for (const one of all.get(item.id) ?? []) if (!one.once) loose.push(`${item.id}: ${one.where}`);
  }
  assert.deepEqual(loose, [], 'sources that can hand a spent item over again -- bound them with a flag the spending writes');
});

test('the map on the diviner after the survey is lodged does not hand back a second survey', () => {
  const state = whole.state;
  // Replay to just after A9, then ask again.
  const replay = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(replay);
  playThrough(player, walkthrough.steps.slice(0, walkthrough.steps.findIndex((step) => step.id === 'A9.4') + 1));
  assert.ok(replay.flags.test({ T_SURVEY_LODGED: true }) && !replay.carried.includes('survey'));
  const divining = pairs.find((pair) => pair.rules?.some((rule) => rule.items?.includes('survey')))!;
  player.go(divining.room);
  player.use(divining.item, divining.target);
  assert.ok(!replay.carried.includes('survey'), 'the survey came back after it was lodged');
  assert.ok(state.puzzleComplete('A7'));
});

/* ---- 3. Every use is wired ------------------------------------------------- */

test('every USE doc 57 writes for an item is a pair for that item, in a room that has the target', () => {
  const byDisplay = new Map(items.map((item) => [item.short!, item.id]));
  const nameOf = (room: string, target: string) => {
    const found = [...(content.rooms.get(room)?.hotspots ?? [])].find((one) => one.id === target);
    if (found) return found.name.toUpperCase();
    return content.ambient.get(target)?.name?.toUpperCase() ?? target.toUpperCase();
  };
  const missing: string[] = [];
  for (const [, target, itemName] of doc57.matchAll(/^> \*\*([A-Z' .-]+?)\*\* · USE ((?:THE |SHENG'S |DR\. )[A-Z' .]+?)(?:,| —)/gm)) {
    const id = byDisplay.get(itemName!.trim());
    if (!id) continue;
    const label = target!.trim();
    const found = pairs.some((pair) => pair.item === id && (nameOf(pair.room, pair.target).includes(label)
      || label.includes(nameOf(pair.room, pair.target))));
    if (!found) missing.push(`USE ${itemName} on ${label}`);
  }
  assert.deepEqual(missing, [], 'doc 57 USE lines with no pair');
});

test('at the filing, everything he has given the Registrar\'s office before is "Already on file"', () => {
  // Doc 57 F5: "USE anything else Thad has given the office before". Given the
  // office: an item a Registrar's pair takes or answers outside the filing, or
  // one the Registrar's own tree holds. The executor's form (E6) fell to the global pool.
  const office = content.rooms.get('claims_registrar')!;
  const clerk = [...content.ambient.values()].find((npc) => npc.room === office.id && npc.tree)!;
  const given = new Set<string>();
  for (const pair of pairs) {
    if (pair.room !== office.id) continue;
    if ((pair.rules ?? []).some((rule) => !(rule.when as Record<string, unknown> | undefined)?.T_FANSHAWE_BEATEN)) given.add(pair.item);
  }
  for (const node of Object.values(content.dialogue.get(clerk.tree!)!.nodes)) {
    for (const option of node.options ?? []) for (const id of option.holds ?? []) given.add(id);
  }
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);
  playThrough(player, walkthrough.steps.slice(0, walkthrough.steps.findIndex((step) => step.id === 'F5.1') + 1));
  const laid = pairs.filter((pair) => pair.room === office.id && pair.rules?.some((rule) => rule.add?.F5_LAID)).map((pair) => pair.item);
  const onFile = /USE anything else Thad has given the office before — \*\*[A-Z]+:\*\* "([^"]+)"/.exec(doc57)![1];
  const inventory = (state as unknown as { inventory: string[] }).inventory;
  if (!inventory.includes('filing_fee')) inventory.push('filing_fee'); // the repeatable money, earned again
  for (const id of [...given].filter((one) => !laid.includes(one) && state.carried.includes(one))) {
    assert.equal(player.use(id, 'counter').say, onFile, `${id} on the counter at the filing`);
  }
  assert.ok(given.has('executor_form') && given.has('filing_fee'));
});

test('an item doc 23 spends, lodges or gives leaves the inventory; one it keeps is never taken', () => {
  for (const item of items) {
    const acquired = sectionOf(item.id)?.acquired ?? '';
    const leaves = takers(item.id).length > 0 || item.lostWhen !== undefined;
    if (/Spent|Gone after|Lodged|Given to/.test(acquired)) {
      assert.ok(leaves, `${item.id}: doc 23 says "${acquired}", and nothing takes it`);
    } else {
      assert.equal(takers(item.id).length, 0, `${item.id}: doc 23 keeps it ("${acquired}"), and a pair takes it`);
      // The four papers laid on the counter are on file after F5 (errata 133).
      const lost = JSON.stringify(item.lostWhen ?? null);
      assert.ok(lost === 'null' || lost === JSON.stringify({ T_FILED: true }),
        `${item.id}: doc 23 keeps it ("${acquired}"), and it is lost by ${lost}`);
    }
  }
});

test('every item used on a person or another item with no pair answers from doc 24\'s pools, never the people pool', async () => {
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);
  playThrough(player, walkthrough.steps.slice(0, walkthrough.steps.findIndex((step) => step.id === 'C6.4') + 1));
  player.leave();
  const poolOf = (id: string) => [...(content.combinations?.itemPools[id] ?? []), ...(content.combinations?.globalPool ?? [])];
  const people = Object.values(content.verbFallbacks?.people ?? {}).flat();
  const keeper = [...content.ambient.values()].find((npc) => npc.room === state.roomId && npc.tree)!;
  for (const id of state.carried) {
    const said = player.use(id, keeper.id).say;
    const live = pairs.some((pair) => pair.item === id && pair.room === state.roomId && pair.target === keeper.id && !pair.opens);
    if (live) continue;
    assert.ok(said && poolOf(id).includes(said), `${id} on ${keeper.id}: "${said}" is not the item's pool or the global pool`);
    assert.ok(!people.includes(said!), `${id} on ${keeper.id}: the people pool answered an item`);
    assert.equal(state.heldItem, null, `${id}: the item is put down when the sentence is done`);
  }
  // Item on item, both ways round.
  const carried = state.carried;
  for (const [a, b] of [[carried[0]!, carried[1]!], [carried[1]!, carried[0]!]] as [string, string][]) {
    const said = player.useOnItem(a, b).say;
    assert.ok(said && poolOf(a).includes(said), `${a} on ${b}: "${said}" is not doc 24's`);
  }
});

test('an item-on-item pair, if one is ever written, is written both ways round', () => {
  const lopsided = pairs.filter((pair) => ids.has(pair.target)
    && !pairs.some((other) => other.item === pair.target && other.target === pair.item && other.room === pair.room));
  assert.deepEqual(lopsided.map((pair) => `${pair.item} on ${pair.target}`), []);
});

test('an item\'s repeat lines are the item\'s wherever he stands, and a room object with its id keeps its own', () => {
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);
  playThrough(player, walkthrough.steps.slice(0, walkthrough.steps.findIndex((step) => step.id === 'F1.6') + 1));
  const look = (target: Interactable) => state.interact(target, 'LOOK_AT').say;
  const fork = content.items.get('tuning_fork')!.responses!.LOOK_AT![0]!;
  assert.equal(look(state.itemTarget('tuning_fork')!), fork.say);
  // Room 34 has a hotspot called the tuning fork: it answers its own first line.
  const hotspot = state.findTarget('tuning_fork');
  assert.ok(hotspot && !state.isItemTarget(hotspot));
  assert.equal(look(hotspot), hotspot.responses!.LOOK_AT![0]!.say, 'the room\'s fork spoke the item\'s second line');
  // And the item, in another room, goes on to its second line.
  player.go(walkthrough.steps.find((step) => step.id === 'F1.5')!.room!);
  assert.equal(look(state.itemTarget('tuning_fork')!), fork.repeat![0], 'the item\'s lines started again in a new room');
});

/* ---- 4. It leaves when it should, and never strands ---------------------- */

test('the whole game ends carrying exactly what doc 23 keeps', () => {
  const end = new Set(whole.carriedAt.at(-1)!.carried);
  const filed = items.filter((item) => JSON.stringify(item.lostWhen) === JSON.stringify({ T_FILED: true })).map((item) => item.id);
  const spent = items.filter((item) => takers(item.id).length || (item.lostWhen && !filed.includes(item.id))).map((item) => item.id);
  const expected = [...everCarried].filter((id) => !filed.includes(id) && !spent.includes(id)).sort();
  assert.deepEqual([...end].sort(), expected);
  for (const id of filed) assert.ok(everCarried.has(id) && !end.has(id), `${id} is on file at the end`);
});

test('fixture r7-f5-held carries exactly what the whole game carries into the filing', () => {
  const fixture = content.fixtures.get('r7-f5-held');
  assert.ok(fixture, 'the well-stocked fixture the inventory is tried on in the running game');
  const at = whole.carriedAt.find((one) => one.step === 'F5.1')!.carried;
  assert.deepEqual([...(fixture.inventory ?? [])].sort(), [...at].sort());
});

test('on the well-stocked fixture the arrows move the grid a row at a time, and every item comes into view', () => {
  const state = new GameState(content, new MemoryStorage());
  assert.ok(state.applyFixture(content.fixtures.get('r7-f5-held')!));
  const panel = new PanelLayout(content.panel);
  const seen = new Set<string>();
  const window = () => state.carried.slice(state.inventoryScroll, state.inventoryScroll + panel.visibleRows);
  assert.ok(state.carried.length > panel.visibleRows, 'more items than slots, so the list must scroll');
  for (let press = 0; press < state.carried.length; press += 1) {
    for (const id of window()) seen.add(id);
    const before = state.inventoryScroll;
    state.scrollInventory(1, panel.visibleRows, panel.perRow);
    if (state.inventoryScroll === before) break;
    assert.equal(state.inventoryScroll - before, panel.perRow, 'one press moves one whole row');
  }
  assert.deepEqual(state.carried.filter((id) => !seen.has(id)), [], 'items the arrows never bring into view');
  assert.equal(state.inventoryScroll % panel.perRow, 0, 'the grid stops on a row');
  for (let press = 0; press < state.carried.length; press += 1) state.scrollInventory(-1, panel.visibleRows, panel.perRow);
  assert.equal(state.inventoryScroll, 0);
});

test('nothing the run needs later had already left: every USE in the walkthrough found its item in hand', () => {
  // playThrough throws on a USE of an item he is not carrying, and the full
  // game test holds the run to no breaks; this names the item if one leaves early.
  for (const [n, step] of walkthrough.steps.entries()) {
    const item = (step as { item?: string }).item;
    if (!item || step.do !== 'use') continue;
    const before = n === 0 ? [] : whole.carriedAt[n - 1]!.carried;
    assert.ok(before.includes(item), `${step.id}: ${item} was not in hand`);
  }
});
