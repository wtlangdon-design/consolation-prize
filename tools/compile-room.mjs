#!/usr/bin/env node
/**
 * DOC 46'S ROOM COMPILER. Reads what the writing passes already produced and
 * emits a room's content file, so a line exists in exactly one place: the
 * document a person wrote it in.
 *
 *   doc 05   the hotspot roster, LOOK and LISTEN, act variants (Part Two-B)
 *   doc 13   Room 2's verb overrides and repeat variants (doc 49 for others)
 *   doc 49   every other room's wrong-answer layer
 *   the annotation   every rect, the walk box, the depth samples, the arrival
 *
 * THE THREE RULES, INHERITED FROM extract-content.mjs AND NOT NEGOTIABLE:
 *
 * 1. THE WORDS STAY IN THE DOCS. This file contains no line of the fiction and
 *    never will. It carries text; it does not hold it.
 * 2. REFUSE LOUDLY, NEVER GUESS. A hotspot doc 05 names but the annotation has
 *    no rect for is a build failure naming the hotspot. An annotation rect for
 *    a hotspot doc 05 never wrote is the same. The alternative -- inferring --
 *    is how a wrong line ships.
 * 3. THE OUTPUT SAYS IT IS GENERATED, so nobody edits it and loses the edit on
 *    the next run.
 *
 * Usage: node tools/compile-room.mjs <room number> [--write]
 * Without --write it prints a reconciliation against the live file and touches
 * nothing, which is how it was built and how it should be run first.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const room = process.argv[2];
const WRITE = process.argv.includes('--write');
if (!room) { console.error('usage: compile-room.mjs <room number> [--write]'); process.exit(2); }

const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
const fail = (msg) => { console.error(`\ncompile-room ${room}: ${msg}\n`); process.exit(1); };

/** A doc's section for one room: its heading to the next room heading. */
function section(text, n) {
  const m = new RegExp(`^## ROOM ${n}\\b[^\\n]*$`, 'mi').exec(text);
  if (!m) return '';
  const rest = text.slice(m.index + m[0].length);
  const next = /^## ROOM \d/mi.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

const VERBS = {
  'LOOK': 'LOOK_AT', 'LOOK AT': 'LOOK_AT', 'LISTEN': 'LISTEN_TO', 'LISTEN TO': 'LISTEN_TO',
  'PICK UP': 'PICK_UP', 'TALK TO': 'TALK_TO', 'USE': 'USE', 'OPEN': 'OPEN',
  'CLOSE': 'CLOSE', 'PUSH': 'PUSH', 'PULL': 'PULL',
};

/** Doc 05: bolded name, then quoted LOOK/LISTEN lines. */
function examineLayer(body) {
  const out = new Map();
  const blocks = body.split(/^\*\*/m).slice(1);
  for (const b of blocks) {
    const name = b.slice(0, b.indexOf('**')).trim();
    if (!name) continue;
    const entry = { name, responses: {} };
    for (const m of b.matchAll(/^>\s*\*\*(LOOK|LISTEN):\*\*\s*"([\s\S]*?)"\s*$/gm)) {
      entry.responses[VERBS[m[1]]] = [{ say: m[2].replace(/\s*\n\s*/g, ' ') }];
    }
    if (Object.keys(entry.responses).length) out.set(name, entry);
  }
  return out;
}

/** Doc 13/49: `> VERB — "line"` or `**NAME** · VERB — "line"`. */
function verbOverrides(text) {
  const out = new Map();
  let current = null;
  for (const line of text.split('\n')) {
    const head = /^\*\*([^*]+)\*\*\s*$/.exec(line);
    if (head) { current = head[1].trim(); continue; }
    const inline = /^\*\*([^*]+)\*\*\s*·\s*([A-Z_]+)\s*—\s*"([\s\S]*?)"/.exec(line);
    if (inline) {
      const verb = inline[2];
      if (!out.has(inline[1].trim())) out.set(inline[1].trim(), {});
      out.get(inline[1].trim())[verb] = inline[3];
      continue;
    }
    const row = /^>\s*(PICK UP|TALK TO|LOOK AT|LISTEN TO|USE|OPEN|CLOSE|PUSH|PULL)\s*—\s*"([\s\S]*?)"/.exec(line);
    if (row && current) {
      if (!out.has(current)) out.set(current, {});
      out.get(current)[VERBS[row[1]]] = row[2];
    }
  }
  return out;
}

/** Doc 13 Part Three: `**LOOK** — 1 ... · 2 "x" · 3 "y"`. */
function repeatVariants(text) {
  const out = new Map();
  const part = text.slice(text.indexOf('# PART THREE'));
  let current = null;
  for (const line of part.split('\n')) {
    const head = /^##\s+(.+?)\s*$/.exec(line);
    if (head) { current = head[1].trim(); continue; }
    const row = /^\*\*(LOOK|LISTEN)\*\*\s*—\s*(.+)$/.exec(line);
    if (!row || !current) continue;
    const says = [...row[2].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    if (!says.length) continue;
    if (!out.has(current)) out.set(current, {});
    out.get(current)[VERBS[row[1]]] = says;
  }
  return out;
}

// ---- load ------------------------------------------------------------------
const examine = section(read('docs/05-examine-layer.md'), room);
if (!examine) fail('doc 05 has no scripted section. Run the writing pass first.');

const ROOM_DOC = { 2: 'docs/13-room-02-content.md' }[room];
const wrongDoc = ROOM_DOC ? read(ROOM_DOC) : section(read('docs/49-wrong-answers.md'), room);
const annPath = `reference/room-0${room}/annotation.json`;
if (!existsSync(annPath)) fail(`no annotation at ${annPath}. Run tools/annotate/room.html first.`);
const ann = JSON.parse(readFileSync(annPath, 'utf8'));

const hotspots = examineLayer(examine);
const overrides = verbOverrides(wrongDoc);
const repeats = repeatVariants(wrongDoc);

const live0 = JSON.parse(read('content/rooms/main-street.json') || '{}');
const live = live0;

// ---- reconcile: names in the docs against ids in the annotation -------------
const slug = (name) => name.toLowerCase().replace(/^(the|a)\s+/, '').replace(/[^a-z]+/g, '_')
  .replace(/^_|_$/g, '');

// THE LIVE FILE IS THE AUTHORITY ON IDS, NOT A SLUG RULE. It already pairs
// every doc name with the id the engine, the annotation and the flags all
// use, and those ids were chosen by a person: THE IMPROVEMENT COMPANY SIGN is
// `company_sign`, which no mechanical slug of that name will ever produce.
// Slugging is the fallback for a hotspot the live file has never seen.
const liveIdByName = new Map((live0.hotspots ?? []).map((h) => [h.name, h.id]));
const byId = new Map();
for (const [name, entry] of hotspots) {
  byId.set(liveIdByName.get(name) ?? slug(name), { ...entry, docName: name });
}

const annIds = Object.keys(ann.hotspots);
const missingRect = [...byId.keys()].filter((id) => !annIds.includes(id));
const orphanRect = annIds.filter((id) => !byId.has(id));
if (missingRect.length) {
  fail(`doc 05 writes ${missingRect.length} hotspot(s) the annotation has no rect for: `
    + `${missingRect.join(', ')}. Draw them, or strike the lines.`);
}
if (orphanRect.length) {
  fail(`the annotation has rect(s) for ${orphanRect.join(', ')}, which doc 05 never writes. `
    + 'A rect with no lines is a hotspot that says nothing when clicked.');
}

// A NAME THAT MATCHES NOTHING IS A DROPPED LINE, AND SILENCE IS THE WORST
// OUTCOME. Doc 05 writes "A DOG"; doc 13 writes "THE DOG". Without this check
// the compiler carried two verbs for the dog instead of five and said nothing
// -- three authored lines gone, invisible in a green build. The documents must
// agree on the name or the build stops naming both.
const docNames = new Set([...hotspots.keys()]);
const strayNames = [...new Set([...overrides.keys(), ...repeats.keys()])]
  .filter((n) => !docNames.has(n) && !/^PART|^ROOM/i.test(n));
if (strayNames.length) {
  fail(`${ROOM_DOC ?? 'doc 49'} writes lines for ${strayNames.map((n) => `"${n}"`).join(', ')}, `
    + `which doc 05 does not name. doc 05 has: ${[...docNames].map((n) => `"${n}"`).join(', ')}. `
    + 'Those lines would be dropped in silence. Make the names agree.');
}

// ---- build -----------------------------------------------------------------

const built = { ...live };
built.generated = {
  by: 'tools/compile-room.mjs',
  from: ['docs/05-examine-layer.md', ROOM_DOC ?? 'docs/49-wrong-answers.md', annPath],
  note: 'GENERATED. Edit the documents or the annotation, never this file.',
};
// THE WALK BOX IS BANDS, NOT A POLYGON. The engine wants zoned rects, and
// the zones are the game's, not this room's: near/mid/far are fixed drawn
// heights every room shares. The annotation's polygon is the human-readable
// truth; this turns it into the bands the engine walks, by slicing the
// polygon's vertical span into the zones the scaling samples imply.
{
  const ys = ann.walkable.map((p) => p[1]);
  const top = Math.min(...ys), bottom = Math.max(...ys);
  const xs = ann.walkable.map((p) => p[0]);
  const left = Math.min(...xs), right = Math.max(...xs);
  const cuts = [top, top + (bottom - top) * 0.34, top + (bottom - top) * 0.67, bottom];
  built.walkable = [
    { id: 'mud_far', zone: 2, surface: 'mud', rect: [left, Math.round(cuts[0]), right - left, Math.round(cuts[1] - cuts[0])] },
    { id: 'mud_mid', zone: 1, surface: 'mud', rect: [left, Math.round(cuts[1]), right - left, Math.round(cuts[2] - cuts[1])] },
    { id: 'mud_near', zone: 0, surface: 'mud', rect: [left, Math.round(cuts[2]), right - left, Math.round(cuts[3] - cuts[2])] },
  ];
  built.walkableOutline = ann.walkable;
}
built.entrance = ann.entrance;

built.hotspots = [...byId.entries()].map(([id, entry]) => {
  const responses = {};
  for (const [verb, lines] of Object.entries(entry.responses)) {
    // REPEATS ARE A FIELD INSIDE THE FIRST RULE, NOT LATER RULES. Emitting
    // them as siblings put an unguarded rule at index 0 and made every
    // variant unreachable -- the engine takes the first match, so a second
    // rule with no `when` is dead content the validator names on sight.
    const variants = repeats.get(entry.docName)?.[verb];
    responses[verb] = variants ? [{ ...lines[0], repeat: variants }] : lines;
  }
  for (const [verb, say] of Object.entries(overrides.get(entry.docName) ?? {})) {
    if (!responses[verb]) responses[verb] = [{ say }];
  }
  const old = (live.hotspots ?? []).find((h) => h.id === id);
  return { id, name: entry.docName, rect: ann.hotspots[id], ...(old?.colour ? { colour: old.colour } : {}), responses };
});

// SMALLEST RECT FIRST, because resolution takes the first hit and the writing
// gives no order at all. false_fronts is 3040x290 and covers the sign, the
// steeple and the notices; listed before them it swallows all three and the
// sign becomes unclickable -- which is exactly what the first compile did.
// Area order is not a preference, it is the only order that lets a small
// hotspot inside a large one ever be reached.
built.hotspots.sort((a, b) => (a.rect[2] * a.rect[3]) - (b.rect[2] * b.rect[3]));

built.exits = (live.exits ?? []).map((e) => ({ ...e, ...(ann.exits[e.id] ? { rect: ann.exits[e.id] } : {}) }));
const exitsMissing = built.exits.filter((e) => !ann.exits[e.id]).map((e) => e.id);
if (exitsMissing.length) fail(`no rect for exit(s): ${exitsMissing.join(', ')}.`);

// ---- report ----------------------------------------------------------------
const counts = built.hotspots.map((h) => `${h.id}:${Object.keys(h.responses).length}`);
console.log(`\nROOM ${room} compiled from the documents\n`);
console.log(`  ${built.hotspots.length} hotspots, verbs each: ${counts.join('  ')}`);
console.log(`  ${built.exits.length} exits, all with rects`);
console.log(`  walk box ${ann.walkable.length} points · depth ${ann.scaling.far.height}`
  + `→${ann.scaling.near.height}px · arrival ${ann.entrance.join(',')}`);
const totalLines = built.hotspots.reduce((n, h) =>
  n + Object.values(h.responses).reduce((m, r) => m + r.length, 0), 0);
console.log(`  ${totalLines} authored lines carried\n`);

if (WRITE) {
  writeFileSync('content/rooms/main-street.json', `${JSON.stringify(built, null, 1)}\n`);
  console.log('  written to content/rooms/main-street.json\n');
} else {
  console.log('  (dry run — pass --write to emit)\n');
}
