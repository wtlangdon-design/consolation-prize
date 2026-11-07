/**
 * THE WHOLE GAME, PLAYED IN A REAL BROWSER. Title screen to THE END.
 *
 *   npm run gauntlet:full [-- --out <dir>] [--pace <n>] [--headed]
 *
 * tests/full-game.test.ts plays tests/data/full-game-walkthrough.json headless,
 * through GameState and a MIRROR of what GameScene does. A mirror cannot see
 * what only the scene does: scene timing, input routing and pending lines,
 * walking and pathing, exits and transits, the timelines (the coffin, the
 * listening chamber's ninety seconds, the filing, the close), the title, the
 * duels' on-screen flow, rendering and asset loads. This plays the SAME
 * walkthrough through the actual game, by real input:
 *
 *   go     the exits and the map, by clicking them -- the way chosen over the
 *          exits and map places open now, as the headless player chooses it
 *   talk   TALK TO, then a click on the person; the tree opens when he arrives
 *   choose a click on the option's row (scrolled to, if it must be)
 *   leave  a click on the open node's EXIT row
 *   verb   the verb's cell in the panel, then the target
 *   use    USE, the item's inventory slot, then the target
 *   duel   the right counter whenever it is on the list, else the first
 *   tap    LISTEN TO on the rock, at the void
 *   wait   nothing: the timeline runs out on its own clock
 *
 * AIM COMES FROM THE CONTENT (route.mjs): a hotspot's rect, a person's feet.
 * Lines are read the way a player reads them -- a line waiting for a click is
 * clicked after doc 30's minimum hold, and every other line plays out on its
 * own. Nothing is written into the game: no flag, no item, no room. A step
 * that breaks is recorded with a screenshot and the run goes on from wherever
 * play is, so one run names every break it can reach.
 *
 * Each step's `expect` is checked against the live probe once play has gone
 * quiet. A frame is captured at every act turn, at every break, and at THE END.
 *
 * TOO SLOW FOR CI (it plays the coffin's minutes and the listening chamber's
 * ninety seconds in real time): a manual run before a playthrough, doc 55 §8.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { FlagStore } from '../../engine/core/FlagStore.ts';
import { browser } from '../lib/chromium.mjs';
import { ROOT, readJson, roomWidth } from '../lib/content.mjs';
import { readPng } from '../lib/png.mjs';
import { serve } from './proof.mjs';
import {
  chooseOption, clickScreen, clickWorld, pastTitle, probe, targetRect, verbRect,
} from './route.mjs';

const arg = (name) => (process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null);
const OUT = resolve(arg('--out') ?? resolve(ROOT, 'renders/proofs/full-game/raw-captures-ignored'));
const PACE = arg('--pace');
const ONLY_TO = arg('--to');
// RESUMING, FOR WORKING ON A BREAK: every step's save is kept, and `--from X`
// loads the save left after the step before X and CONTINUEs from the title.
// It is a convenience for whoever is fixing something; the run that counts
// starts from NEW GAME.
const FROM = arg('--from');
const CHECKPOINTS = resolve(OUT, 'checkpoints');
const RESUME_FROM = resolve(arg('--checkpoints') ?? CHECKPOINTS);
const SAVE_KEY = 'consolation.save.v1';


const NATIVE = { width: 1920, height: 1080 };
const PLAY = { width: 1920, height: 864 };
const manifest = readJson('content/manifest.json');
const PLAYER = readJson(manifest.actor).id;
const UI = readJson('content/ui/ui.json');
const READ_MS = ((UI.timing ?? {}).holdMinimumSeconds ?? 1.8) * 1000;
const VERBS = readJson('content/ui/verbs.json');
const TRANSIT = VERBS.transitVerbs ?? [VERBS.walkVerb.id];
const PANEL = readJson('content/ui/panel.json');
const walkthrough = readJson('tests/data/full-game-walkthrough.json');

const rooms = new Map(manifest.rooms.map((path) => readJson(path)).filter((room) => room.id).map((room) => [room.id, room]));
const trees = new Map(manifest.dialogue.map((path) => readJson(path)).map((tree) => [tree.id, tree]));
const ambient = new Map((manifest.ambient ?? []).map((path) => readJson(path)).map((npc) => [npc.id, npc]));
const MAP_ID = [...rooms.values()].find((room) => room.kind === 'map')?.id ?? null;
const flagsFile = readJson(manifest.flags);

class StepError extends Error {}

/* ---- reading the game ------------------------------------------------------ */

/** A FlagStore holding what the probe says is true now, for choosing a way (never for writing). */
function flagsOf(p) {
  const store = new FlagStore(flagsFile);
  const snapshot = {};
  for (const def of flagsFile.flags) {
    if (typeof def.initial === 'number') snapshot[def.id] = p.counters[def.id] ?? 0;
    else snapshot[def.id] = p.flags.includes(def.id);
  }
  store.restore(snapshot);
  return store;
}

const holding = (rule, carried) => Object.entries(rule.holding ?? {}).every(([item, held]) => carried.includes(item) === held);

/** The shortest way there by exits and the map (HeadlessPlayer.route, read against the live game). */
export function plan(p, to) {
  const flags = flagsOf(p);
  const carried = p.inventory;
  const exitsOf = (id) => (rooms.get(id)?.exits ?? []).filter((exit) => flags.test(exit.when) && holding(exit, carried));
  const mapRoom = MAP_ID ? rooms.get(MAP_ID) : null;
  const seen = new Map([[p.room, []]]);
  const queue = [p.room];
  while (queue.length) {
    const at = queue.shift();
    const path = seen.get(at);
    if (at === to) return path;
    const edges = [];
    for (const exit of exitsOf(at)) {
      if (exit.travelWhenTold) continue;
      const scene = exit.transitScene?.find((rule) => flags.test(rule.when));
      if (scene?.stays) continue;
      edges.push({ kind: 'exit', from: at, exit, to: exit.to });
    }
    if (mapRoom && at === MAP_ID) {
      for (const location of mapRoom.locations ?? []) {
        if (!flags.test(location.when) || !holding(location, carried) || !rooms.has(location.room)) continue;
        edges.push({ kind: 'map', from: at, location, to: location.room });
      }
    } else if (mapRoom && !rooms.get(at)?.kind) {
      edges.push({ kind: 'mapButton', from: at, to: MAP_ID });
    }
    for (const edge of edges) {
      if (seen.has(edge.to)) continue;
      seen.set(edge.to, [...path, edge]);
      queue.push(edge.to);
    }
  }
  return null;
}

/** What a step expected and the live game does not show (headless-player.ts `unmet`, against the probe). */
export async function unmetLive(page, p, expect) {
  if (!expect) return [];
  const out = [];
  const tree = p.dialogueAt?.tree ?? null;
  if (expect.room !== undefined && p.room !== expect.room) out.push(`room is ${p.room}, expected ${expect.room}`);
  if (expect.act !== undefined && (p.counters.ACT ?? 0) !== expect.act) out.push(`ACT is ${p.counters.ACT}, expected ${expect.act}`);
  for (const id of expect.puzzles ?? []) if (p.puzzles[id] !== 'complete') out.push(`puzzle ${id} is ${p.puzzles[id] ?? 'not started'}, expected complete`);
  for (const id of expect.puzzlesPending ?? []) if (p.puzzles[id] !== 'pending') out.push(`puzzle ${id} is ${p.puzzles[id] ?? 'not started'}, expected pending`);
  for (const [flag, value] of Object.entries(expect.flags ?? {})) {
    const actual = typeof value === 'number' ? (p.counters[flag] ?? 0) : p.flags.includes(flag);
    if (actual !== value) out.push(`${flag} is ${actual}, expected ${value}`);
  }
  for (const item of expect.carrying ?? []) if (!p.inventory.includes(item)) out.push(`not carrying ${item}`);
  for (const item of expect.notCarrying ?? []) if (p.inventory.includes(item)) out.push(`still carrying ${item}`);
  for (const id of expect.present ?? []) if (!p.present.includes(id)) out.push(`${id} is not present`);
  for (const id of expect.absent ?? []) if (p.present.includes(id)) out.push(`${id} is present`);
  if (expect.dialogue !== undefined && tree !== expect.dialogue) out.push(`conversation open is ${tree ?? 'none'}, expected ${expect.dialogue ?? 'none'}`);
  if (expect.node !== undefined && (tree ? p.dialogueAt.node : null) !== expect.node) out.push(`node is ${p.dialogueAt?.node ?? 'none'}, expected ${expect.node}`);
  if (expect.offered || expect.notOffered) {
    const offered = await offeredIds(page);
    for (const id of expect.offered ?? []) if (!offered.includes(id)) out.push(`${id} is not offered (offered: ${offered.join(', ')})`);
    for (const id of expect.notOffered ?? []) if (offered.includes(id)) out.push(`${id} is offered`);
  }
  for (const id of expect.targets ?? []) if (!p.targets.includes(id)) out.push(`${id} is not a target here`);
  for (const id of expect.noTargets ?? []) if (p.targets.includes(id)) out.push(`${id} is a target here`);
  return out;
}

async function offeredIds(page) {
  return page.evaluate(() => {
    const out = [];
    for (let index = 1; index <= 16; index += 1) {
      const row = window.__gauntlet?.optionRow(index);
      if (row) out.push(row.id);
    }
    return out;
  });
}

/* ---- waiting like a player ------------------------------------------------- */

const playerOf = (p) => p?.movers?.[PLAYER];

/**
 * Waits until `done(p)` holds and play is quiet, reading lines as a player
 * does: a line waiting for a click is clicked once it has been up for the
 * minimum hold; any other line plays on its own. Quiet is nothing said or
 * queued, no exchange performing, and Thad standing still for `stillMs`.
 * Returns the last probe; `timedOut` when the deadline passed first.
 */
async function waitQuiet(page, { done = () => true, upTo = 90, stillMs = 900, readLines = true } = {}) {
  const deadline = Date.now() + upTo * 1000;
  let lineSince = Date.now();
  let lastSays = null;
  let quietSince = null;
  let lastAt = null;
  let p = null;
  for (;;) {
    p = await probe(page);
    if (p) {
      if (p.says !== lastSays) { lastSays = p.says; lineSince = Date.now(); }
      if (readLines && p.waiting && Date.now() - lineSince >= READ_MS) {
        await clickScreen(page, NATIVE.width / 2, PLAY.height / 2);
        lineSince = Date.now();
      }
      const me = playerOf(p);
      const at = JSON.stringify(me?.at ?? null);
      const moved = at !== lastAt;
      lastAt = at;
      const listOpen = p.options > 0 && !p.performing && !p.waiting;
      // A CUTSCENE BEAT PLAYING IS NOT QUIET: a click under one is spent and
      // does nothing (GameScene.carriedCutscene) -- the opening's Hob crossing
      // the road took the run's LOOK AT on his lamp.
      const quiet = !p.performing && p.pending === 0 && (p.says === null || listOpen) && p.beat === null
        // NOR IS AN ACT CARD OR A ROOM FADE: a click under either is spent on nothing.
        && !p.card && !p.fading
        // NOR IS A CUT-AWAY (errata 158): the probe's room is the cut-away's while it plays, and a click inside
        // one is swallowed -- the Clarion's press after the swindle took the run to "clarion" (errata 161).
        && !p.cutaway
        && !moved && me?.clip !== 'walk' && !(p.ending && p.ending !== 'title');
      if (quiet) quietSince ??= Date.now(); else quietSince = null;
      if (quietSince !== null && Date.now() - quietSince >= stillMs && done(p)) return p;
    }
    if (Date.now() > deadline) return { ...(p ?? {}), timedOut: true };
    await page.waitForTimeout(120);
  }
}

/** Waits for a conversation's list to be up (or for the conversation to have gone). */
async function waitForList(page, upTo = 90) {
  return waitQuiet(page, { done: (p) => (p.options > 0 && !p.performing) || !p.dialogueAt?.tree, upTo, stillMs: 400 });
}

/* ---- clicking like a player ------------------------------------------------ */

async function clickVerb(page, verb) {
  const rect = verbRect(verb);
  // A CLICK CAN BE SPENT ON SOMETHING ELSE FIRST, and a player clicks again:
  // seated in the listening chamber after the ninety seconds, the first click
  // anywhere stands him up and does nothing more (GameScene.riseIfSeated).
  for (let tries = 0; tries < 2; tries += 1) {
    await clickScreen(page, rect.x + rect.width / 2, rect.y + rect.height / 2);
    await page.waitForTimeout(150);
    const p = await probe(page);
    if (p?.verb === verb) return;
    if (tries === 0) await waitQuiet(page, { upTo: 20 });
    else throw new StepError(`the ${verb} cell was clicked twice and the panel holds ${p?.verb ?? 'no verb'}`);
  }
}

/** A person's box in a room, from content: the file's feet, or the room's placement. */
function personRect(roomId, id) {
  const room = rooms.get(roomId);
  return targetRect(room, id);
}

/** The point to click on a target in the room he is in: a hotspot or exit rect's centre, a person's body. */
function aim(p, id) {
  const room = rooms.get(p.room);
  if (!room) throw new StepError(`the game is in "${p.room}", which no manifest room names`);
  const [x, y, w, h] = personRect(p.room, id);
  const width = roomWidth(room);
  const cx = Math.min(width - 1, Math.max(0, x + w / 2));
  // A person is clicked at the chest, not the middle of a box that may be mostly legs.
  const isPerson = ![...(room.exits ?? []), ...(room.hotspots ?? [])].some((one) => one.id === id);
  const cy = isPerson ? y + h * 0.35 : y + h / 2;
  return [cx, Math.min(PLAY.height - 1, Math.max(0, cy))];
}

/**
 * Brings a world x into the camera's view by walking toward it, as a player
 * scrolls a wide room. The floor point clicked avoids every exit (a click on a
 * doorway would travel) and every person (a click on one would speak).
 */
async function bringIntoView(page, wx) {
  for (let tries = 0; tries < 10; tries += 1) {
    const p = await probe(page);
    const room = rooms.get(p.room);
    const width = roomWidth(room);
    if (width <= NATIVE.width) return;
    // A margin only where the camera can still scroll: the back lots' door is
    // at x0-58 and the camera stops at 0 (the first draft walked for ever).
    const left = p.camera > 0 ? 120 : 0;
    const right = p.camera < width - NATIVE.width ? 120 : 0;
    if (wx >= p.camera + left && wx <= p.camera + NATIVE.width - right) return;
    const me = playerOf(p);
    const feet = me?.at?.[1] ?? 760;
    const west = wx < p.camera;
    // GROUND, ASKED OF THE SENTENCE LINE. With nothing selected a click on a
    // hotspot performs its default verb: a click on ground scenery walks
    // (THE BOARDWALK looked until errata 154 C), on a doorway travels, on a
    // person speaks. A point is ground when the line
    // names nothing there, or names scenery whose default is to walk on it.
    let clicked = false;
    for (const dy of [-10, 30, -60, 60]) {
      for (let step = 0; step < 16 && !clicked; step += 1) {
        const x = west ? p.camera + 160 + step * 60 : p.camera + NATIVE.width - 160 - step * 60;
        const y = Math.min(PLAY.height - 4, feet + dy);
        const at = await pagePoint(page, x, y);
        await page.mouse.move(at.x, at.y);
        await page.waitForTimeout(40);
        const named = (await probe(page))?.hovered ?? null;
        const target = named ? (room.hotspots ?? []).find((one) => one.id === named) : null;
        if (named === null || (!p.verb && target && (target.defaultVerb ?? VERBS.defaultVerb) === VERBS.walkVerb.id)) {
          await page.mouse.click(at.x, at.y);
          clicked = true;
        }
      }
      if (clicked) break;
    }
    if (!clicked) throw new StepError(`no ground to walk on toward x${Math.round(wx)} in ${p.room}`);
    await waitQuiet(page, { upTo: 30, stillMs: 800 });
  }
}

/** A world point's place on the page, through the camera. */
async function pagePoint(page, wx, wy) {
  const cameraX = (await probe(page))?.camera ?? 0;
  const box = await page.evaluate(() => document.querySelector('canvas')?.getBoundingClientRect().toJSON());
  const scale = Math.min(box.width / NATIVE.width, box.height / NATIVE.height);
  return {
    x: box.left + (box.width - NATIVE.width * scale) / 2 + (wx - cameraX) * scale,
    y: box.top + (box.height - NATIVE.height * scale) / 2 + wy * scale,
  };
}

/** Targets no point of which the sentence line named: recorded, and clicked at their centre anyway. */
const unnamed = [];

/**
 * POINTS UNTIL THE SENTENCE LINE NAMES IT, then clicks there -- as a player
 * does. A rect's centre can sit on a smaller thing or a person: the
 * registrar's counter's centre is SUMP'S PEN, and the Nugget piano's is the
 * fiddler. The centre is tried first, then a grid across the rect. A target
 * no point of which names it is recorded: a player could not click it either.
 */
async function clickTarget(page, id, { button = 'left' } = {}) {
  let p = await probe(page);
  const room = rooms.get(p.room);
  const [cx, cy] = aim(p, id);
  await bringIntoView(page, cx);
  p = await probe(page);
  const [rx, ry, rw, rh] = personRect(p.room, id);
  const width = roomWidth(room);
  const candidates = [[cx, cy]];
  for (const fy of [0.5, 0.3, 0.7, 0.15, 0.85]) {
    for (const fx of [0.5, 0.3, 0.7, 0.15, 0.85, 0.05, 0.95]) candidates.push([rx + rw * fx, ry + rh * fy]);
  }
  let chosen = null;
  for (const [x, y] of candidates) {
    if (x < p.camera || x >= p.camera + NATIVE.width || x >= width || y < 0 || y >= PLAY.height) continue;
    const at = await pagePoint(page, x, y);
    await page.mouse.move(at.x, at.y);
    await page.waitForTimeout(40);
    const named = (await probe(page))?.hovered;
    if (process.env.FULL_GAME_DEBUG) console.log(`    point ${Math.round(x)},${Math.round(y)} (camera ${p.camera}) names ${named}`);
    if (named === id) { chosen = [x, y]; break; }
  }
  if (!chosen) {
    chosen = [cx, cy];
    unnamed.push(`${p.room}/${id}`);
  }
  const at = await pagePoint(page, chosen[0], chosen[1]);
  await page.mouse.click(at.x, at.y, { button });
  return chosen;
}

/** The inventory slot of an item, scrolling the grid by its arrows as a player would. */
async function clickItem(page, item) {
  for (let tries = 0; tries < 12; tries += 1) {
    const slot = await page.evaluate((id) => window.__gauntlet?.inventorySlot(id), item);
    if (slot) {
      await clickScreen(page, slot.x + slot.width / 2, slot.y + slot.height / 2);
      await page.waitForTimeout(150);
      return;
    }
    const p = await probe(page);
    if (!p.inventory.includes(item)) throw new StepError(`he is not carrying "${item}" (carrying: ${p.inventory.join(', ')})`);
    // Down first, then up: the grid scrolls by rows and the item is somewhere on it.
    const inv = PANEL.inventory;
    const half = Math.floor((inv.cell[1] * inv.rows) / 2);
    const down = tries < 6;
    await clickScreen(page, inv.arrows.x + inv.arrows.width / 2, inv.y + (down ? half + half / 2 : half / 2));
    await page.waitForTimeout(150);
  }
  throw new StepError(`"${item}" never showed in the inventory grid`);
}

/** Leaves the open node by its EXIT row: the option tagged EXIT, or one that ends. */
async function leave(page) {
  const p = await waitForList(page);
  const tree = p.dialogueAt?.tree;
  if (!tree) return;
  if (p.duel) throw new StepError('no way out of a duel but through it');
  const node = trees.get(tree)?.nodes?.[p.dialogueAt.node];
  const offered = await offeredIds(page);
  const exit = offered.find((id) => {
    const option = node?.options?.find((one) => one.id === id);
    return option && (option.tag === 'EXIT' || option.ends === true);
  });
  if (!exit) throw new StepError(`no EXIT row at ${tree}/${p.dialogueAt.node} (offered: ${offered.join(', ')})`);
  await chooseOption(page, exit);
  await waitQuiet(page, { done: (q) => !q.dialogueAt?.tree || q.dialogueAt.tree !== tree || q.options > 0, upTo: 90 });
}

async function choose(page, ids) {
  for (const id of ids) {
    const p = await waitForList(page);
    if (!p.dialogueAt?.tree) throw new StepError(`no conversation is open to choose "${id}" in`);
    const offered = await offeredIds(page);
    if (!offered.includes(id)) {
      throw new StepError(`"${id}" is not offered at ${p.dialogueAt.tree}/${p.dialogueAt.node} (offered: ${offered.join(', ')})`);
    }
    await chooseOption(page, id);
    await page.waitForTimeout(200);
  }
}

async function requireIdle(page, what) {
  const p = await waitQuiet(page, { upTo: 60 });
  if (p.dialogueAt?.tree) throw new StepError(`cannot ${what}: a conversation is open (${p.dialogueAt.tree}/${p.dialogueAt.node})`);
  return p;
}

/* ---- the steps -------------------------------------------------------------- */

async function go(page, to, log) {
  let p = await requireIdle(page, `go to ${to}`);
  if (p.room === to) return;
  const legs = plan(p, to);
  if (!legs) throw new StepError(`no way from ${p.room} to ${to} with the exits and map places open now`);
  for (const leg of legs) {
    p = await probe(page);
    const from = p.room;
    if (leg.kind === 'mapButton') {
      const { cols, rows, width, height } = PANEL.verbs;
      const button = PANEL.mapButton;
      await clickScreen(page, cols[button.col] + width / 2, rows[button.row] + height / 2);
      log.push(`  map button from ${from}`);
    } else if (leg.kind === 'map') {
      await clickScreen(page, leg.location.at[0], leg.location.at[1]);
      log.push(`  map: ${leg.location.id}`);
    } else {
      const exit = leg.exit;
      const fallback = exit.defaultVerb ?? VERBS.defaultVerb;
      // A doorway is walked through by its own default verb when that is a
      // transit (nothing selected, or a right click past a selection); else USE.
      if (TRANSIT.includes(fallback)) {
        await clickTarget(page, exit.id, { button: p.verb && p.verb !== fallback ? 'right' : 'left' });
      } else {
        await clickVerb(page, 'USE');
        await clickTarget(page, exit.id);
      }
      log.push(`  exit ${exit.id} from ${from}`);
    }
    const arrived = await waitQuiet(page, { done: (q) => q.room !== from || q.dialogueAt?.tree, upTo: 90, stillMs: 600 });
    if (arrived.room === from) {
      throw new StepError(`${leg.kind === 'exit' ? `the exit ${leg.exit.id}` : leg.kind} in ${from} did not go anywhere`
        + `${arrived.says ? ` (${arrived.says} answered instead)` : ''}`);
    }
    if (arrived.room !== leg.to) log.push(`  arrived in ${arrived.room}, not ${leg.to}`);
    if (arrived.dialogueAt?.tree) break;
  }
}

async function talk(page, npc) {
  let p = await waitQuiet(page, { upTo: 60 });
  const file = ambient.get(npc);
  if (file?.tree && p.dialogueAt?.tree === file.tree) return;
  if (p.dialogueAt?.tree) throw new StepError(`cannot TALK TO ${npc}: a conversation is open (${p.dialogueAt.tree}/${p.dialogueAt.node})`);
  if (!p.present.includes(npc)) throw new StepError(`nobody called "${npc}" is in ${p.room} (present: ${p.present.join(', ') || 'nobody'})`);
  await clickVerb(page, 'TALK_TO');
  await clickTarget(page, npc);
  if (!file?.tree) { await waitQuiet(page, { upTo: 60 }); return; }
  p = await waitQuiet(page, { done: (q) => q.dialogueAt?.tree && q.options > 0 && !q.performing, upTo: 90, stillMs: 300 });
  if (p.dialogueAt?.tree !== file.tree) throw new StepError(`TALK TO ${npc} opened ${p.dialogueAt?.tree ?? 'nothing'}, not ${file.tree}`);
}

async function verbOn(page, verb, on) {
  const p = await requireIdle(page, `${verb} ${on}`);
  if (verb === VERBS.walkVerb.id) {
    // WALK TO has no cell: it is what a click with nothing selected does on a target whose default it is.
    const target = [...(rooms.get(p.room)?.exits ?? []), ...(rooms.get(p.room)?.hotspots ?? [])].find((one) => one.id === on);
    if ((target?.defaultVerb ?? VERBS.defaultVerb) !== verb) throw new StepError(`${on}'s default verb is not ${verb}`);
    await clickTarget(page, on, { button: p.verb ? 'right' : 'left' });
  } else {
    if (!p.targets.includes(on) && !p.present.includes(on)) {
      throw new StepError(`no "${on}" to ${verb} in ${p.room} (targets: ${p.targets.join(', ')})`);
    }
    await clickVerb(page, verb);
    await clickTarget(page, on);
  }
}

async function use(page, item, on) {
  const p = await requireIdle(page, `USE ${item} ON ${on}`);
  if (!p.inventory.includes(item)) throw new StepError(`he is not carrying "${item}" (carrying: ${p.inventory.join(', ')})`);
  if (!p.targets.includes(on) && !p.present.includes(on)) {
    throw new StepError(`no "${on}" to use ${item} on in ${p.room} (targets: ${p.targets.join(', ')}; present: ${p.present.join(', ')})`);
  }
  await clickVerb(page, 'USE');
  await clickItem(page, item);
  const held = await probe(page);
  if (held.held !== item) throw new StepError(`a USE click on ${item}'s slot left ${held.held ?? 'nothing'} in hand`);
  await clickTarget(page, on);
}

async function duel(page) {
  for (let guard = 0; guard < 60; guard += 1) {
    const p = await waitForList(page, 120);
    if (!p.duel) return;
    const offered = await offeredIds(page);
    if (!offered.length) throw new StepError('a duel offered no counters');
    await chooseOption(page, offered.includes('right') ? 'right' : offered[0]);
    await page.waitForTimeout(250);
  }
  throw new StepError('the duel did not end');
}

async function tap(page) {
  const p = await requireIdle(page, 'tap');
  const listening = rooms.get(p.room)?.listening;
  if (!listening) throw new StepError(`${p.room} is not a listening room`);
  await clickVerb(page, 'LISTEN_TO');
  await clickWorld(page, listening.void.at[0], listening.void.at[1]);
}

/* ---- watching for what looks wrong ------------------------------------------- */

function darkness(dataUrl) {
  const png = readPng(Buffer.from(dataUrl.split(',')[1], 'base64'));
  let sum = 0; let n = 0;
  for (let y = 0; y < Math.min(png.height, PLAY.height); y += 12) {
    for (let x = 0; x < png.width; x += 12) {
      const i = (y * png.width + x) * 4;
      sum += png.pixels[i] + png.pixels[i + 1] + png.pixels[i + 2];
      n += 1;
    }
  }
  return sum / (n * 3);
}

/* ---- the run ------------------------------------------------------------------ */

async function main() {
  mkdirSync(OUT, { recursive: true });
  mkdirSync(CHECKPOINTS, { recursive: true });
  const t0 = Date.now();
  const server = await serve();
  const chrome = await browser();
  const page = await chrome.newPage({ viewport: NATIVE });
  const network = [];
  const consoleErrors = [];
  page.on('response', (response) => { if (response.status() >= 400) network.push(`${response.status()} ${response.url()}`); });
  // An ABORTED request is the page changing its mind (a music bed swapped
  // before its file arrived), not a missing file; a 4xx/5xx or any other
  // failure is.
  page.on('requestfailed', (request) => {
    const why = request.failure()?.errorText ?? '';
    if (!why.includes('ERR_ABORTED')) network.push(`FAILED ${request.url()} ${why}`);
  });
  page.on('pageerror', (error) => consoleErrors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  const report = { started: new Date().toISOString(), steps: [], breaks: [], oddities: [], shots: [] };
  const shot = async (name) => {
    const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
    if (!url) return null;
    const file = resolve(OUT, `${name}.png`);
    writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    report.shots.push(file);
    return url;
  };
  const oddity = (step, room, what) => {
    if (report.oddities.some((one) => one.what === what && one.room === room)) return;
    report.oddities.push({ step, room, what });
    console.log(`  ODD ${step} in ${room}: ${what}`);
  };
  try {
    let steps = walkthrough.steps;
    if (FROM) {
      let at = steps.findIndex((one) => one.id === FROM);
      if (at < 1) throw new Error(`--from ${FROM}: no such step after the first`);
      // ONLY AN ARRIVAL'S SAVE IS THE STATE: the game autosaves on entering a
      // room and on closing a conversation, not after an item is used, so the
      // save after A8.3 did not hold the fee it gave. Resume after the last
      // `go` before the step asked for, and replay from there.
      while (at > 1 && steps[at - 1].do !== 'go') at -= 1;
      const save = readFileSync(resolve(RESUME_FROM, `${steps[at - 1].id}.json`), 'utf8');
      await page.addInitScript(([key, value]) => { if (!sessionStorage.getItem('resumed')) { localStorage.setItem(key, value); sessionStorage.setItem('resumed', '1'); } }, [SAVE_KEY, save]);
      steps = steps.slice(at);
      report.resumedFrom = steps[0].id;
    }
    await page.goto(`${server.url}/${PACE ? `?pace=${PACE}` : ''}`);
    if (FROM) {
      for (let tries = 0; tries < 200; tries += 1) {
        // ERRATA 155: past "Click to begin" first.
        if ((await probe(page))?.begin) { await clickScreen(page, 960, 432); await page.waitForTimeout(200); continue; }
        const item = await page.evaluate(() => window.__gauntlet?.titleItem('continue') ?? null);
        if (item) { await clickScreen(page, item.x + item.width / 2, item.y + item.height / 2); break; }
        await page.waitForTimeout(200);
      }
      await waitQuiet(page, { upTo: 60 });
    } else {
      await pastTitle(page, 90);
    }
    let act = null;
    let seenNetwork = 0; let seenConsole = 0;
    for (const step of steps) {
      const began = Date.now();
      const log = [];
      let problem = null;
      try {
        switch (step.do) {
          case 'opening': break;
          case 'go': await go(page, step.room, log); break;
          case 'talk': await talk(page, step.npc); break;
          case 'choose': break;
          case 'leave': await leave(page); break;
          case 'use': await use(page, step.item, step.on); break;
          case 'verb': await verbOn(page, step.verb, step.on); break;
          case 'duel': await duel(page); break;
          case 'tap': await tap(page); break;
          case 'wait': break;
          case 'check': break;
          default: throw new StepError(`unknown step kind ${step.do}`);
        }
        if (step.choose?.length) await choose(page, step.choose);
        if (step.leave && step.do !== 'leave') await leave(page);
      } catch (error) {
        if (!(error instanceof StepError) && !String(error.message).startsWith('route:') && !String(error.message).startsWith('option')) throw error;
        problem = error.message;
      }
      // The step's changes, once play has gone quiet: timelines and lines run out on their own.
      const long = ['wait', 'tap', 'opening'].includes(step.do) || step.id.startsWith('F5') || step.id.startsWith('END');
      let p = await waitQuiet(page, { upTo: long ? 420 : 90 });
      let missing = await unmetLive(page, p, step.expect);
      // Expectations that land after quiet (a timeline's next beat, an act card): give them their time.
      if (missing.length) {
        const deadline = Date.now() + (long ? 420 : 25) * 1000;
        while (missing.length && Date.now() < deadline) {
          p = await waitQuiet(page, { upTo: 10, stillMs: 300 });
          missing = await unmetLive(page, p, step.expect);
        }
      }
      if (missing.length) problem = problem ? `${problem}; ${missing.join('; ')}` : missing.join('; ');
      const seconds = Number(((Date.now() - began) / 1000).toFixed(1));
      const entry = { id: step.id, puzzle: step.puzzle ?? null, do: step.do, room: p.room, seconds, log, problem };
      report.steps.push(entry);
      console.log(`${problem ? 'BREAK' : 'ok   '} ${step.id.padEnd(12)} ${String(seconds).padStart(6)}s  ${p.room}${problem ? `  -- ${problem}` : ''}`);
      for (const line of log) console.log(line);
      if (problem) {
        const url = await shot(`break-${step.id}`);
        // The whole probe goes with the break, bar the per-figure detail: most of a diagnosis.
        const { movers: _m, walkers: _w, assets: _a, ...seen } = p;
        report.breaks.push({ step: step.id, puzzle: step.puzzle ?? null, room: p.room, problem, shot: url ? resolve(OUT, `break-${step.id}.png`) : null, probe: seen });
      }
      // What works and looks wrong.
      while (unnamed.length) oddity(step.id, p.room, `no point of ${unnamed.shift()} named it on the sentence line`);
      for (const asset of p.assets ?? []) if (!asset.loaded) oddity(step.id, p.room, `asset not loaded: ${asset.path}`);
      for (const [id, mover] of Object.entries(p.movers ?? {})) {
        if (mover.fallback) oddity(step.id, p.room, `${id} drew a fallback pose for ${mover.clip}`);
        if (mover.drawn !== 'sprite' && mover.drawn !== 'not-drawn' && p.room !== MAP_ID) oddity(step.id, p.room, `${id} drew as ${mover.drawn}`);
      }
      if (p.room === 'coffin' && p.panel) oddity(step.id, p.room, 'the verb panel is drawn inside the coffin (invariant 2)');
      if (p.says && !p.waiting && p.pending === 0 && p.timedOut) oddity(step.id, p.room, `a line by ${p.says} stayed up past the step's deadline`);
      if (network.length > seenNetwork) { for (const one of network.slice(seenNetwork)) oddity(step.id, p.room, `network: ${one}`); seenNetwork = network.length; }
      if (consoleErrors.length > seenConsole) { for (const one of consoleErrors.slice(seenConsole)) oddity(step.id, p.room, `console: ${one}`); seenConsole = consoleErrors.length; }
      const url = await page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
      if (url && p.room !== 'coffin' && !p.ending && darkness(url) < 6) {
        oddity(step.id, p.room, 'the play area is black at the end of the step');
        await shot(`black-${step.id}`);
      }
      if (act !== (p.counters?.ACT ?? null)) {
        act = p.counters?.ACT ?? null;
        await shot(`act-${act}-${step.id}`);
      }
      const save = await page.evaluate((key) => localStorage.getItem(key), SAVE_KEY);
      if (save) writeFileSync(resolve(CHECKPOINTS, `${step.id}.json`), save);
      if (ONLY_TO && step.id === ONLY_TO) break;
    }
    // THE END: the close's page, the fade, the black, and the title again.
    if (!ONLY_TO) {
      const end = await waitQuiet(page, { done: (q) => q.title === true, upTo: 300, readLines: true, stillMs: 0 });
      await page.waitForTimeout(1500);
      await shot('the-end');
      const last = await probe(page);
      report.theEnd = { title: last?.title === true, theEnd: last?.theEnd === true, timedOut: end.timedOut === true };
      if (!last?.title) report.breaks.push({ step: 'THE END', room: last?.room, problem: 'the title never came back after the close', shot: resolve(OUT, 'the-end.png') });
      else if (!last.theEnd) report.oddities.push({ step: 'THE END', room: last.room, what: 'the title came back without THE END' });
      console.log(`THE END: title ${last?.title}, theEnd ${last?.theEnd}`);
    }
  } finally {
    report.seconds = Math.round((Date.now() - t0) / 1000);
    report.network = network;
    report.console = consoleErrors;
    writeFileSync(resolve(OUT, 'run.json'), `${JSON.stringify(report, null, 1)}\n`);
    console.log(`\n${report.breaks.length} break(s), ${report.oddities.length} oddit(ies), ${report.seconds}s. Report: ${resolve(OUT, 'run.json')}`);
    await chrome.close();
    server.stop();
  }
  process.exitCode = report.breaks.length ? 1 : 0;
}

// Run only when invoked, so tests can read `plan` and `unmetLive` without a browser.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // EXITS WHEN IT IS DONE: the dev server's own children can outlive
  // `server.stop()` and hold the event loop open for ever.
  main().then(() => process.exit(process.exitCode ?? 0), (error) => {
    console.error(error);
    process.exit(2);
  });
}
