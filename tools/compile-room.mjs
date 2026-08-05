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
 * Usage: node tools/compile-room.mjs <room number> [--write|--check]
 * Without --write it prints a reconciliation against the live file and touches
 * nothing, which is how it was built and how it should be run first. --check
 * is the registered-generator mode: build, compare, print `stale: <path>` and
 * exit non-zero, never write.
 *
 * IT IS NOT THE ONLY WRITER OF ITS OUTPUT. `extract-content.mjs` carries doc
 * 14's assay-office exit into the same room file, and the two compose because
 * each preserves what it does not own -- and because they serialise the same
 * way, which is a fact this file has to keep true rather than one it can
 * assume. See the write at the bottom.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { roomWidth } from './lib/content.mjs';

const room = process.argv[2];
// --check OUTRANKS --write, so the registered command can carry both. It is
// how `check-generated` runs every generator: it appends --check to whatever
// the registration says, and a tool that wrote anyway would make a validation
// pass unsafe to run on a dirty branch.
const CHECKING = process.argv.includes('--check');
const WRITE = process.argv.includes('--write') && !CHECKING;
if (!room) {
  console.error('usage: compile-room.mjs <room number> [--write|--check]');
  process.exit(2);
}

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

/**
 * Doc 13 Part Three: `**LOOK** — 1 ... · 2 "x" · 3 "y"`.
 *
 * VARIANT 1 IS THE FIRST LOOK, NOT A REPEAT, and it is numbered alongside the
 * repeats because a reader counting clicks does not care where the engine
 * keeps them. Doc 13 writes it two ways: `1 *(existing)*` when doc 05 already
 * has it, and spelled out when doc 13 is REPLACING it -- which THE MUD says in
 * as many words, "Reordered — supersedes doc 05's Room 2 mud entry", because
 * doc 05's Room 2 mud opens "The same mud" and Main Street may now be the
 * first mud a player sees.
 *
 * READING ALL THREE AS REPEATS PUT THE SECOND CLICK'S LINE ON THE FIRST. The
 * old parser took every quoted string in the row and left the base line as doc
 * 05's, so THE MUD answered a first look with "The same mud. I have begun to
 * recognise individual portions of it." -- about mud he had not yet seen --
 * and the joke, which is that the second look is wearier than the first,
 * played backwards. No line was missing. Every one was present, in the wrong
 * order, which is the failure this project keeps saying is the expensive one.
 *
 * Returns `{ first, rest }` per verb: `first` is variant 1's text when it was
 * spelled out and null when it was `*(existing)*`, `rest` is variants 2..N.
 */
function repeatVariants(text) {
  const out = new Map();
  const part = text.slice(text.indexOf('# PART THREE'));
  let current = null;
  for (const line of part.split('\n')) {
    const head = /^##\s+(.+?)\s*$/.exec(line);
    if (head) { current = head[1].trim(); continue; }
    const row = /^\*\*(LOOK|LISTEN)\*\*\s*—\s*(.+)$/.exec(line);
    if (!row || !current) continue;
    // Numbered, so variant 1 is identifiable whichever form it took. Splitting
    // on the separator would break on a line containing one.
    const numbered = [...row[2].matchAll(/(\d+)\s*(?:"([^"]*)"|\*\(existing\)\*)/g)]
      .map((m) => ({ n: Number(m[1]), say: m[2] ?? null }));
    if (!numbered.length) continue;
    if (!out.has(current)) out.set(current, {});
    out.get(current)[VERBS[row[1]]] = {
      first: numbered.find((v) => v.n === 1)?.say ?? null,
      rest: numbered.filter((v) => v.n > 1).map((v) => v.say).filter((say) => say !== null),
    };
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
// THE ROOM IS AS BIG AS ITS PLATE, and it is the annotation that knows how big
// that is -- every rect below was drawn in the same coordinates. A room that
// declared no size was assumed to be the window's 1920, which for Main Street
// is not a smaller room but the same room squashed into half its width.
if (Array.isArray(ann.plateSize)) built.size = ann.plateSize;
built.generated = {
  by: 'tools/compile-room.mjs',
  from: ['docs/05-examine-layer.md', ROOM_DOC ?? 'docs/49-wrong-answers.md', annPath],
  note: 'GENERATED. Edit the documents or the annotation, never this file.',
};
// TWO REPRESENTATIONS, BOTH REQUIRED, AND THAT IS NOT DUPLICATION. `walkable`
// carries the DEPTH ZONES every room shares (near/mid/far, fixed drawn
// heights); `walkBoxes` carries the ROUTING quads the walker actually walks.
// An earlier pass here emitted only the first and every check passed while
// the router still used the 1920-era boxes underneath -- two walk systems in
// one file, one of them decorative.
//
// THE QUADS ARE LEVEL EVEN THOUGH THE POLYGON IS NOT. Boxes are quads by
// rule, so the far band takes the polygon's HIGHEST point rather than
// following its slope: a band that traced the boardwalk line would need ten
// points, and a band that took the lowest would leave every door's approach
// point outside the floor. Levelling upward includes a little ground he
// cannot reach; levelling downward excludes ground he must.
{
  const pts = ann.walkable;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const left = Math.min(...xs), right = Math.max(...xs);
  const top = Math.min(...ys), bottom = Math.max(...ys);
  const cut = (f) => Math.round(top + (bottom - top) * f);
  const quad = (y0, y1) => [{ x: left, y: y0 }, { x: right, y: y0 },
    { x: right, y: y1 }, { x: left, y: y1 }];
  const scale = {
    kind: 'curve',
    farY: ann.scaling.far.y, farHeight: ann.scaling.far.height,
    nearY: ann.scaling.near.y, nearHeight: ann.scaling.near.height,
  };
  const bands = [['mud_far', top, cut(0.34), 2], ['mud_mid', cut(0.34), cut(0.67), 1],
    ['mud_near', cut(0.67), bottom, 0]];
  built.walkBoxes = bands.map(([id, y0, y1], n) => ({
    id, points: quad(y0, y1), surface: 'mud', clipPlane: 12, scaleMode: scale,
    neighbours: [bands[n - 1]?.[0], bands[n + 1]?.[0]].filter(Boolean),
  }));
  built.walkable = bands.map(([id, y0, y1, zone]) =>
    ({ id, zone, surface: 'mud', rect: [left, y0, right - left, y1 - y0] }));
  built.walkBoxNote = 'GENERATED from reference/room-02/annotation.json by '
    + 'tools/compile-room.mjs. walkableOutline keeps the annotation\u2019s own polygon, which '
    + 'follows the boardwalk line and the rise to the road; the quads are its levelled bands.';
  built.walkableOutline = ann.walkable;
}
built.entrance = ann.entrance;

// ---- geometry the live file was carrying for a DIFFERENT ROOM ---------------
//
// EVERY COORDINATE IN THE OLD FILE WAS DRAWN AGAINST A 1920-WIDE MAIN STREET,
// and the plate is 3700. `outside_nugget` sits at x786; the Nugget's door is at
// x2268. That is not a mark six pixels out of place, it is a mark in front of a
// different building -- and four of the six per-door arrivals were the same.
//
// THE ONES THAT SURVIVE A FLOOR TEST ARE THE DANGEROUS ONES. Five of these
// stand on the new walk box by y and would have shipped: `street_east` at
// x1836 is the middle of a 3700 street, and its own name says where it is
// supposed to be. A validator that only asks "is it on the floor" cannot see
// that, which is why the rule here is about PROVENANCE and not position.
//
// So the compiler carries none of it, and names all of it. Refusing to carry
// geometry it cannot source is the same rule as refusing a hotspot the
// annotation has no rect for -- the alternative is a room that looks composed
// and puts the player in front of the wrong door.
//
// WHERE THEY COME BACK FROM: the annotator, into the annotation, as
// `staging` and `entrances`. Read here the moment they exist.
const staleGeometry = [];
/** Every `walkTo` dropped for the same reason, collected as the hotspots build. */
const staleWalkTo = [];
if (ann.staging) {
  built.staging = ann.staging;
} else if ((live.staging ?? []).length) {
  staleGeometry.push(`  ${live.staging.length} staging mark(s): `
    + live.staging.map((m) => `${m.id}@${m.at.join(',')}`).join(', '));
  delete built.staging;
}
if (ann.entrances) {
  built.entrances = ann.entrances;
} else if ((live.entrances ?? []).length) {
  staleGeometry.push(`  ${live.entrances.length} per-source arrival(s): `
    + live.entrances.map((e) => `from ${e.from}@${e.at.join(',')}`).join(', '));
  delete built.entrances;
}

built.hotspots = [...byId.entries()].map(([id, entry]) => {
  const responses = {};
  for (const [verb, lines] of Object.entries(entry.responses)) {
    // REPEATS ARE A FIELD INSIDE THE FIRST RULE, NOT LATER RULES. Emitting
    // them as siblings put an unguarded rule at index 0 and made every
    // variant unreachable -- the engine takes the first match, so a second
    // rule with no `when` is dead content the validator names on sight.
    const variants = repeats.get(entry.docName)?.[verb];
    // A SPELLED-OUT VARIANT 1 REPLACES DOC 05'S LINE, and doc 05's must then
    // still be reachable. Superseding is what doc 13 says it is doing; DROPPING
    // is what it would be doing if the line it replaced appeared nowhere in the
    // chain, and that is a line the writing pass would never see gone -- the
    // hotspot still answers, in one fewer voice.
    const chain = variants ? [variants.first, ...variants.rest].filter(Boolean) : [];
    if (variants?.first && !chain.includes(lines[0].say)) {
      fail(`"${entry.docName}" ${verb}: ${ROOM_DOC ?? 'doc 49'} replaces variant 1 and doc 05's `
        + 'line survives nowhere in the chain.\n'
        + `  doc 05: ${lines[0].say}\n`
        + `  ${ROOM_DOC ?? 'doc 49'}: ${chain.map((s, i) => `${i + 1} ${s}`).join('\n              ')}\n`
        + '  Carry it as a later variant, or strike it from doc 05.');
    }
    // Variant 1 is the base; everything after it repeats. `lines[0]` keeps any
    // fields doc 05 put on the response beyond the words themselves.
    const base = variants?.first ? { ...lines[0], say: variants.first } : lines[0];
    responses[verb] = variants?.rest.length ? [{ ...base, repeat: variants.rest }] : [base];
  }
  // DOC 13'S VERB ROWS ARE `overrides`, AND THEY ARE NOT `responses`. Doc 13
  // note 4 draws the line itself: "Global pools rotate; object overrides do
  // not. An override fires every time for that verb-object pair." A response
  // goes through `nextLine`, which advances through repeat variants and then
  // holds; an override is one line, forever, and `resolveWith` deliberately
  // never falls back to it for a USE-with-item.
  //
  // WRITING THEM AS RESPONSES LOST BOTH HALVES AT ONCE. USE THE MUD became a
  // rotating response, and `overrides` vanished from the file entirely -- so
  // doc 24's rule that "On what." is not the answer to USE THE TUNING FORK ON
  // THE MUD had nothing left to be true of. One field name, two mechanisms.
  const objectOverrides = { ...(overrides.get(entry.docName) ?? {}) };
  const old = (live.hotspots ?? []).find((h) => h.id === id);
  // THE DEFAULT VERB CARRIES OVER, FOR THE SAME REASON THE ID DOES. It is not
  // in doc 05 and it is not in the annotation -- errata 28b makes it the verb
  // a bare click resolves to, and a person chose it per hotspot: THE MUD is
  // WALK_TO so clicking the road walks, everything else is LOOK_AT. Dropped,
  // every hotspot in the room falls back to the global default and the street
  // stops being walkable by clicking it, which is not a line of dialogue
  // changing and so nothing about the writing pass would have caught it.
  // `walkTo` DOES NOT CARRY OVER. See the stale-geometry block above: it is a
  // coordinate, drawn against the old width, and doc 22's staged chain prefers
  // an authored one over the fallback -- so a wrong one is used in preference
  // to the right answer. Without it the object answers where the player
  // stands, which is the documented fallback and is never in front of the
  // wrong building.
  if (old?.walkTo) staleWalkTo.push(`${id}@${old.walkTo.x},${old.walkTo.y}`);
  return {
    id,
    name: entry.docName,
    rect: ann.hotspots[id],
    ...(old?.colour ? { colour: old.colour } : {}),
    ...(old?.defaultVerb ? { defaultVerb: old.defaultVerb } : {}),
    responses,
    ...(Object.keys(objectOverrides).length ? { overrides: objectOverrides } : {}),
  };
});

// SMALLEST RECT FIRST, because resolution takes the first hit and the writing
// gives no order at all. false_fronts is 3040x290 and covers the sign, the
// steeple and the notices; listed before them it swallows all three and the
// sign becomes unclickable -- which is exactly what the first compile did.
// Area order is not a preference, it is the only order that lets a small
// hotspot inside a large one ever be reached.
built.hotspots.sort((a, b) => (a.rect[2] * a.rect[3]) - (b.rect[2] * b.rect[3]));

built.exits = (live.exits ?? []).map((e) => {
  const { walkTo, ...rest } = e;
  if (walkTo) staleWalkTo.push(`${e.id}@${walkTo.x},${walkTo.y}`);
  // AND THE REPLACEMENT COMES FROM THE ANNOTATION. Stripping the stale point
  // was right; leaving none is not, because an exit without a walkTo sends
  // him to the rect's centre, and a door's centre is the middle of a wall.
  // These are computed against the walk box's own upper edge with a margin,
  // so he stands clear of the boardwalk lip rather than on it.
  return {
    ...rest,
    ...(ann.exits[e.id] ? { rect: ann.exits[e.id] } : {}),
    ...(ann.exitWalkTo?.[e.id] ? { walkTo: ann.exitWalkTo[e.id] } : {}),
  };
});
if (ann.arrivalBySource) built.arrivalBySource = ann.arrivalBySource;
const noWalkTo = built.exits.filter((e) => !e.walkTo).map((e) => e.id);
if (noWalkTo.length) {
  fail(`no walkTo for exit(s): ${noWalkTo.join(', ')}. Add them to the annotation.`);
}
const exitsMissing = built.exits.filter((e) => !ann.exits[e.id]).map((e) => e.id);
if (exitsMissing.length) fail(`no rect for exit(s): ${exitsMissing.join(', ')}.`);
if (staleWalkTo.length) {
  staleGeometry.push(`  ${staleWalkTo.length} staged approach point(s): ${staleWalkTo.join(', ')}`);
}

// ---- report ----------------------------------------------------------------
// COUNT THE OVERRIDES TOO, or the tally silently halves the moment they move
// into their own field -- which is exactly what happened, and 38 became 18
// with no line lost. A number that only counts one of two places words live is
// a number that reports a correct build as a regression and a real loss as
// nothing at all.
const verbsOn = (h) => Object.keys(h.responses).length + Object.keys(h.overrides ?? {}).length;
const counts = built.hotspots.map((h) => `${h.id}:${verbsOn(h)}`);
console.log(`\nROOM ${room} compiled from the documents\n`);
console.log(`  ${built.hotspots.length} hotspots, verbs each: ${counts.join('  ')}`);
console.log(`  ${built.exits.length} exits, all with rects`);
console.log(`  walk box ${ann.walkable.length} points · depth ${ann.scaling.far.height}`
  + `→${ann.scaling.near.height}px · arrival ${ann.entrance.join(',')}`);
// AND COUNT THE REPEATS, which are a FIELD ON a rule and not rules of their
// own. `Object.values(responses)` yields rule ARRAYS, so reading `.repeat` off
// one is reading it off an array: undefined, every time, silently. Half the
// words in the room -- 36 of 74 -- were invisible to the tally that exists to
// notice words going missing.
let totalLines = 0;
for (const h of built.hotspots) {
  for (const rules of Object.values(h.responses)) {
    for (const rule of rules) totalLines += 1 + (rule.repeat?.length ?? 0);
  }
  totalLines += Object.keys(h.overrides ?? {}).length;
}
console.log(`  ${totalLines} authored lines carried\n`);

// SAID EVERY RUN, NOT ONCE. A drop reported at the moment it happened and
// never again is a drop nobody remembers by the time it matters, and this one
// costs the player the ability to come out of a door in the right place.
if (staleGeometry.length) {
  console.log(`  DROPPED — drawn against a ${roomWidth(live)}-wide Main Street, and the plate `
    + `is ${ann.plateSize?.[0]}:\n`);
  for (const line of staleGeometry) console.log(line);
  console.log('\n  Every one of these is a point on the OLD street. Some of them still land on'
    + '\n  the new walk box, which makes them worse rather than better: street_east at x1836'
    + '\n  is the middle of a 3700 street and no floor test can say so.'
    + '\n\n  Re-draw them in tools/annotate/room.html as `staging` and `entrances`, and this'
    + '\n  reads them instead. Until then the room has one arrival -- the annotation\'s --'
    + '\n  and objects are approached from wherever the player is standing.\n');
}

// TWO SPACES, BECAUSE THIS FILE HAS A SECOND WRITER. `extract-content.mjs`
// carries doc 14's assay-office exit into the same room file and serialises at
// two, so a compiler emitting one would leave the two generators permanently
// disagreeing about a file neither had anything wrong with -- each rewriting
// the other's whitespace, and `check-generated` calling both stale forever.
const OUT = 'content/rooms/main-street.json';
const wanted = `${JSON.stringify(built, null, 2)}\n`;

if (CHECKING) {
  if (read(OUT) !== wanted) {
    console.log(`stale: ${OUT}`);
    process.exit(1);
  }
  console.log(`  ${OUT} is current\n`);
} else if (WRITE) {
  writeFileSync(OUT, wanted);
  console.log(`  written to ${OUT}\n`);
} else {
  console.log('  (dry run — pass --write to emit)\n');
}
