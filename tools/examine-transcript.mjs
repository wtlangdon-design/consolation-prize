/**
 * THE EXAMINE HALF OF THE PLAYTHROUGH TRANSCRIPT (errata 227).
 *
 *   node --experimental-strip-types --no-warnings tools/examine-transcript.mjs [--out <dir>]
 *
 * Errata 221's transcript is what the walkthrough SAID, and the walkthrough
 * almost never says LOOK AT or LISTEN TO -- so the examine layer, most of the
 * script, was missing from the record the feel review judged. This plays the
 * same walkthrough (tests/data/full-game-walkthrough.json) headless through
 * GameState, with the player tests/full-game.test.ts uses, and on each arrival
 * in a room asks, for every hotspot, exit and person there, what LOOK AT and
 * LISTEN TO would answer right then.
 *
 * A PROBE CHANGES NOTHING. The answers come from GameState.resolveInteraction
 * -- the engine's own resolver, so act variants, flag gates, puzzle gates and
 * repeat variants (a `then` only on a first selection) are exactly what play
 * gives -- and nothing is committed. Resolving does advance the verb system's
 * line cursors (VerbSystem.resolve: "the chosen line IS the resolution"), so
 * the cursors, the selected verb, the held item and the people latch are taken
 * before the probe and put back after it. tests/examine-transcript.test.mjs
 * proves the state is the same before and after.
 *
 * WHAT COUNTS AS AN ARRIVAL WORTH WRITING DOWN: the first arrival in a room,
 * and every later one in a different act, or where what LOOK and LISTEN would
 * say has changed since the last one written down for that room.
 *
 * NOTHING IS MARKED. Every line is written the same way, in the room's own
 * order (exits and hotspots as GameState.targets lists them, then the people
 * present), with no tag, flag, count or ordering that could single one out:
 * CLAUDE.md design invariant 3. No effect of a response (a flag it sets, a
 * puzzle it completes, a conversation it opens) is recorded, for the same
 * reason. Only the words.
 *
 * Writes renders/playthrough/examine.md and renders/playthrough/examine.json.
 * No content strings live here: every line is read out of the content bundle.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { loadContent } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { personLines } from '../engine/core/PersonLines.ts';
import { PLAY_HEIGHT } from '../engine/render/Screen.ts';
import { HeadlessPlayer, playThrough } from '../tests/lib/headless-player.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
export const VERBS = ['LOOK_AT', 'LISTEN_TO'];

/* ---- state the probe must leave exactly as it found it ------------------ */

/**
 * Everything a probe could touch: the durable world (GameState's own purity
 * signature -- room, inventory, ownership, objects, flags, dialogue counts and
 * position, puzzles, reputation) and the non-durable selection state a
 * resolution advances or reads (line cursors, selected verb, held item, the
 * people latch).
 */
export function stateSnapshot(player) {
  const { state, ambient } = player;
  const verbs = state.verbs;
  const entries = (map) => [...map.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return JSON.stringify({
    world: JSON.parse(state.signature()),
    cursors: {
      repeat: entries(verbs.repeatCursor),
      fallback: entries(verbs.fallbackCursor),
      pool: entries(verbs.poolCursor),
    },
    selected: verbs.selectedVerb,
    held: state.heldItem,
    latch: { room: ambient.latchedRoom, ids: ambient.latched ? [...ambient.latched.keys()] : null },
  });
}

function takeAside(player) {
  const { state, ambient } = player;
  const verbs = state.verbs;
  return {
    repeat: new Map(verbs.repeatCursor),
    fallback: new Map(verbs.fallbackCursor),
    pool: new Map(verbs.poolCursor),
    selected: verbs.selectedVerb,
    held: state.heldItem,
    latched: ambient.latched === null ? null : new Map(ambient.latched),
    latchedRoom: ambient.latchedRoom,
  };
}

function putBack(player, kept) {
  const { state, ambient } = player;
  const verbs = state.verbs;
  // Copies, so the next resolution cannot advance what is being kept.
  verbs.repeatCursor = new Map(kept.repeat);
  verbs.fallbackCursor = new Map(kept.fallback);
  verbs.poolCursor = new Map(kept.pool);
  if (kept.selected === null) verbs.resetToDefault();
  else verbs.selectVerb(kept.selected);
  state.holdItem(kept.held);
  ambient.latched = kept.latched === null ? null : new Map(kept.latched);
  ambient.latchedRoom = kept.latchedRoom;
}

/* ---- the probe ---------------------------------------------------------- */

/** A resolution's words: what is said, who says it, and what follows on a first selection. */
function wordsOf(resolution) {
  const lines = [];
  if (resolution.say) {
    lines.push({
      ...(resolution.by ? { speaker: resolution.by } : {}),
      line: resolution.say,
      ...(resolution.direction ? { direction: true } : {}),
    });
  }
  for (const one of resolution.then ?? []) {
    if (typeof one === 'string') lines.push({ line: one });
    else lines.push({ speaker: one.speaker, line: one.line, ...(one.direction ? { direction: true } : {}) });
  }
  return lines;
}

/**
 * A verb on a hotspot or exit, as GameScene.applyInteraction resolves it. Room
 * 33's listening surface answers LISTEN TO with a tap and no line
 * (GameScene.listenAt), so it is resolved as that.
 */
function onTarget(state, target, verb) {
  const listening = state.room.listening;
  if (listening && target.id === listening.surface && verb === 'LISTEN_TO') return [];
  return wordsOf(state.resolveInteraction(target, verb));
}

/**
 * A verb other than TALK TO on a person, as GameScene resolves it: the room's
 * lines for them (PersonLines), then their own examine layer, then the
 * people pool's first line.
 */
function onPerson(state, npc, verb) {
  const test = (when) => state.flags.test(when);
  const personal = personLines(state.room, npc, verb, test, [0, 0, 1, 1], () => []);
  if (personal) return wordsOf(state.resolveInteraction(personal.target, verb));
  const layer = npc.tree ? state.content.dialogue.get(npc.tree)?.examine : undefined;
  if (layer?.[verb]?.length) {
    return wordsOf(state.resolveInteraction({ id: npc.id, name: npc.name, rect: [0, 0, 1, 1], colour: 0, responses: layer }, verb));
  }
  const pool = state.content.verbFallbacks?.people?.[verb];
  return Array.isArray(pool) && pool.length ? [{ line: pool[0] }] : [];
}

/**
 * The people a LOOK or a LISTEN can land on. GameScene asks the ambient
 * layer's personAt for the person under a click in the play area: scenery and
 * walkers on a loop answer nothing, and a figure with no tree standing under a
 * hotspot is that hotspot for every verb but TALK TO. So a person is listed
 * only when some point of his own hit box reaches him; one who is wholly
 * inside the hotspot drawn over him is examined through that hotspot, which
 * is listed already.
 */
const GRID = 16;
function reachablePeople(player) {
  const { ambient } = player;
  return ambient.present.filter((npc) => {
    const [x, y, w, h] = ambient.hitBox(npc);
    for (let i = 0; i <= GRID; i += 1) {
      for (let j = 0; j <= GRID; j += 1) {
        const px = x + (w * i) / GRID;
        const py = y + (h * j) / GRID;
        if (py >= PLAY_HEIGHT) continue;
        if (ambient.npcAt(px, py)?.id === npc.id && ambient.personAt(px, py, 'LOOK_AT')?.id === npc.id) return true;
      }
    }
    return false;
  });
}

/**
 * What LOOK AT and LISTEN TO answer right now, for everything in the room a
 * player can click. Each answer is resolved as if it were the first click
 * since arriving: the cursors are put back after every single resolution, so
 * looking at one thing never stands in for looking at another.
 */
export function probeRoom(player) {
  const { state } = player;
  const kept = takeAside(player);
  const entries = [];
  try {
    const once = (resolveOne) => {
      try { return resolveOne(); } finally { putBack(player, kept); }
    };
    state.holdItem(null);
    for (const target of state.targets) {
      const answers = {};
      for (const verb of VERBS) answers[verb] = once(() => onTarget(state, target, verb));
      entries.push({ id: target.id, name: state.nameOf(target), ...answers });
    }
    for (const npc of reachablePeople(player)) {
      const answers = {};
      for (const verb of VERBS) answers[verb] = once(() => onPerson(state, npc, verb));
      entries.push({ id: npc.id, name: npc.name, ...answers });
    }
  } finally {
    putBack(player, kept);
  }
  return entries;
}

/* ---- the run ------------------------------------------------------------ */

/**
 * Plays the walkthrough and probes every arrival worth writing down. Returns
 * the arrivals, and the breaks the run met (which should be the walkthrough's
 * own knownBreaks, exactly as tests/full-game.test.ts holds them).
 */
export async function examineRun() {
  const reader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
  const walkthrough = await reader('tests/data/full-game-walkthrough.json');
  const content = await loadContent(reader);
  const state = new GameState(content, new MemoryStorage());
  const player = new HeadlessPlayer(state);

  const arrivals = [];
  const last = new Map();
  let step = null;
  const arrival = player.arrival;
  player.arrival = function arrive(from) {
    arrival.call(this, from);
    if (state.isMap) return;
    const act = Number(state.flags.get('ACT'));
    const entries = probeRoom(player);
    const said = JSON.stringify(entries);
    const before = last.get(state.roomId);
    if (before && before.act === act && before.said === said) return;
    last.set(state.roomId, { act, said });
    arrivals.push({ room: state.roomId, roomName: state.room.name ?? state.roomId, act, step, entries });
  };

  const breaks = [];
  for (const one of walkthrough.steps) {
    step = one.id;
    breaks.push(...playThrough(player, [one]));
  }
  return { arrivals, breaks, knownBreaks: walkthrough.knownBreaks.map((one) => one.step) };
}

/* ---- writing it down ---------------------------------------------------- */

export function summarise(arrivals) {
  const distinct = new Set();
  let listed = 0;
  let silent = 0;
  let entries = 0;
  for (const arrival of arrivals) {
    for (const entry of arrival.entries) {
      entries += 1;
      for (const verb of VERBS) {
        const lines = entry[verb];
        if (lines.length) listed += 1;
        else silent += 1;
        for (const one of lines) distinct.add(one.line);
      }
    }
  }
  return {
    roomsVisited: new Set(arrivals.map((one) => one.room)).size,
    arrivalsWritten: arrivals.length,
    hotspotEntries: entries,
    responsesListed: listed,
    responsesWithNoLine: silent,
    distinctLines: distinct.size,
  };
}

const oneLine = (text) => text.replace(/\s*\n\s*/g, ' ');

function render(lines) {
  if (!lines.length) return '—';
  return lines.map((one) => {
    const words = one.direction ? `(${oneLine(one.line)})` : `"${oneLine(one.line)}"`;
    return one.speaker ? `${one.speaker.toUpperCase()}: ${words}` : words;
  }).join(' / ');
}

export function toMarkdown(arrivals, summary, commit) {
  const out = [
    '# The Last Claim in Consolation -- examine transcript',
    '',
    `Played headless by \`node --experimental-strip-types tools/examine-transcript.mjs\` at commit ${commit}, through the walkthrough in \`tests/data/full-game-walkthrough.json\` (errata 227).`,
    'On each arrival in a room -- the first, and every later one in a new act or where the answers have changed -- every hotspot, exit and person there, with what LOOK AT and LISTEN TO would say at that moment. Resolved by the engine and committed nowhere. A repeat variant shows only where the run had already asked; a first selection\'s follow-on lines are joined with " / ". "—" is no line. Every line is written the same way, in the room\'s own order.',
    '',
    `- Rooms visited: ${summary.roomsVisited}`,
    `- Room arrivals written down: ${summary.arrivalsWritten}`,
    `- Hotspots, exits and people listed: ${summary.hotspotEntries}`,
    `- Hotspot responses listed (LOOK AT and LISTEN TO, with a line): ${summary.responsesListed}`,
    `- Responses with no line: ${summary.responsesWithNoLine}`,
    `- Distinct lines: ${summary.distinctLines}`,
    '',
  ];
  let act = null;
  for (const arrival of arrivals) {
    if (arrival.act !== act) {
      act = arrival.act;
      out.push(`## ACT ${['', 'I', 'II', 'III', 'IV'][act] ?? act}`, '');
    }
    out.push(`### ${arrival.roomName} -- act ${arrival.act}, step ${arrival.step}`, '');
    if (!arrival.entries.length) out.push('*(nothing here to look at or listen to)*');
    for (const entry of arrival.entries) {
      out.push(`- ${entry.name} · LOOK: ${render(entry.LOOK_AT)} · LISTEN: ${render(entry.LISTEN_TO)}`);
    }
    out.push('');
  }
  return out.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf('--out');
  const dir = resolve(ROOT, at >= 0 && args[at + 1] ? args[at + 1] : 'renders/playthrough');
  const { arrivals, breaks, knownBreaks } = await examineRun();
  const found = breaks.map((one) => one.step);
  if (found.length !== knownBreaks.length || found.some((id) => !knownBreaks.includes(id))) {
    console.error(`the run broke where the walkthrough does not expect it: ${found.join(', ') || 'nowhere'} (known: ${knownBreaks.join(', ') || 'none'})`);
    for (const one of breaks) console.error(`  ${one.step} in ${one.room}: ${one.problem}`);
    process.exitCode = 1;
  }
  const { execSync } = await import('node:child_process');
  let commit = 'unknown';
  try { commit = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { /* not a checkout */ }
  const summary = summarise(arrivals);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'examine.md'), toMarkdown(arrivals, summary, commit));
  writeFileSync(resolve(dir, 'examine.json'), `${JSON.stringify({ commit, summary, arrivals }, null, 2)}\n`);
  console.log(`examine transcript: ${summary.roomsVisited} rooms, ${summary.arrivalsWritten} arrivals, `
    + `${summary.responsesListed} responses listed (${summary.responsesWithNoLine} with no line), ${summary.distinctLines} distinct lines`);
  console.log(`  ${resolve(dir, 'examine.md')}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
