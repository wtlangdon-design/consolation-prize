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
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
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

/**
 * Hotspots a room document writes IN FULL, which doc 05 only names.
 *
 * repeatVariants reads from `# PART THREE` and wants `**LOOK** — 1 "..."`,
 * because its job is variants for hotspots doc 05 has already written. Doc
 * 16's PART ONE is a different thing in a different shape -- `**LOOK** 1
 * "..." · 2 "..."` -- and is where Room 3's six unwritten hotspots and THE
 * HAND OF CARDS actually live. Parsed here rather than by loosening that
 * function, because the two sections mean different things: one completes doc
 * 05, the other decorates it.
 */
function roomDocHotspots(text) {
  const out = new Map();
  const start = text.indexOf('# PART ONE');
  if (start < 0) return out;
  const end = text.indexOf('# PART TWO');
  let current = null;
  for (const line of text.slice(start, end < 0 ? undefined : end).split('\n')) {
    const head = /^##\s+(THE [A-Z' ]+?)(?:\s*\*|\s*$)/.exec(line);
    if (head) { current = head[1].trim(); continue; }
    const row = /^\*\*(LOOK|LISTEN)\*\*\s+(.+)$/.exec(line);
    if (!row || !current) continue;
    const numbered = [...row[2].matchAll(/(\d+)\s*"([^"]*)"/g)]
      .map((m) => ({ n: Number(m[1]), say: m[2] }));
    if (!numbered.length) continue;
    if (!out.has(current)) out.set(current, {});
    out.get(current)[VERBS[row[1]]] = {
      first: numbered.find((v) => v.n === 1)?.say ?? null,
      rest: numbered.filter((v) => v.n > 1).map((v) => v.say),
    };
  }
  return out;
}

/** How many lines a spoken block wraps to, at doc 30 section 5's block width. */
const GLYPH_W = 8 * 6;
const BLOCK = Math.round(1920 * (240 / 320));
function wraps(line) {
  let width = 0;
  let count = 1;
  for (const word of line.split(/\s+/)) {
    const add = (word.length + (width ? 1 : 0)) * GLYPH_W;
    if (width + add > BLOCK) { count += 1; width = word.length * GLYPH_W; }
    else width += add;
  }
  return count;
}

/**
 * DOC 30 SECTION 5, PERFORMED RATHER THAN ASKED FOR: "If wrapping would exceed
 * three lines, fail the content check and split the writing into two utterances
 * at a rhetorical break."
 *
 * The writing is not too wordy -- the median spoken line in the game is EIGHT
 * words. It is that sixty-one lines are ONE utterance where they should be two,
 * and every one has a period with a punchline after it. "Somebody carried this
 * here on purpose" lands twice as hard after a beat as it does trailing off the
 * end of a paragraph, and that beat is the rhythm the whole presentation is
 * borrowed from.
 *
 * The split changes NO WORDS: cut at the sentence break that leaves both halves
 * inside the ceiling, preferring the shortest tail, because the shortest tail
 * is the punchline. A line with no such break is left alone and REPORTED --
 * those want editing, which is a person's job.
 */
function splitUtterance(line) {
  if (wraps(line) <= 3) return null;
  const parts = line.split(/(?<=[.!?])\s+/);
  if (parts.length < 2) return null;
  let best = null;
  for (let i = 1; i < parts.length; i += 1) {
    const head = parts.slice(0, i).join(' ');
    const tail = parts.slice(i).join(' ');
    if (wraps(head) > 3 || wraps(tail) > 3) continue;
    const score = tail.split(/\s+/).length;
    if (!best || score < best.score) best = { head, tail, score };
  }
  return best ? { say: best.head, then: [best.tail] } : null;
}

let splits = 0;
const unsplit = [];

// ---- load ------------------------------------------------------------------
const examine = section(read('docs/05-examine-layer.md'), room);
if (!examine) fail('doc 05 has no scripted section. Run the writing pass first.');

// A ROOM'S OWN CONTENT DOCUMENT, WHERE ONE EXISTS. Room 3 had one -- doc 16,
// which completes doc 05's six unwritten hotspots and adds THE HAND OF CARDS
// -- and this map did not know it, so the compiler reported the six as
// missing and I wrote worse duplicates of finished lines into doc 05 rather
// than looking for the document that already had them.
const ROOM_DOC = {
  2: 'docs/13-room-02-content.md',
  3: 'docs/16-room-03-content.md',
}[room];
const wrongDoc = ROOM_DOC ? read(ROOM_DOC) : section(read('docs/49-wrong-answers.md'), room);
const annPath = `reference/room-0${room}/annotation.json`;
if (!existsSync(annPath)) fail(`no annotation at ${annPath}. Run tools/annotate/room.html first.`);
const ann = JSON.parse(readFileSync(annPath, 'utf8'));

const hotspots = examineLayer(examine);

const overrides = verbOverrides(wrongDoc);
const repeats = repeatVariants(wrongDoc);
const written = ROOM_DOC ? roomDocHotspots(read(ROOM_DOC)) : new Map();

// A ROOM DOCUMENT MAY WRITE HOTSPOTS DOC 05 ONLY NAMES. Doc 05 lists Room 3's
// six unwritten ones on a single line and says the full lines live elsewhere;
// doc 16 is elsewhere, and adds THE HAND OF CARDS besides. Reconciling rects
// against doc 05 alone therefore called nine of Room 3's twelve orphans.
//
// The room doc supplies a name and the lines; doc 05 stays the authority for
// any hotspot it writes in full, which is why these are added rather than
// merged over.
if (ROOM_DOC) {
  for (const line of read(ROOM_DOC).split('\n')) {
    const heading = /^##\s+(THE [A-Z' ]+?)(?:\s*\*|\s*$)/.exec(line);
    if (heading && !hotspots.has(heading[1].trim())) {
      // Its LINES come from the room doc too. repeatVariants has already
      // parsed them: variant 1 is what he says the first time, the rest are
      // what he says on looking again.
      const name = heading[1].trim();
      const parsed = written.get(name) ?? {};
      const responses = {};
      for (const [verb, variants] of Object.entries(parsed)) {
        if (!variants.first) continue;
        responses[verb] = variants.rest.length
          ? [{ say: variants.first, repeat: variants.rest }]
          : [{ say: variants.first }];
      }
      if (Object.keys(responses).length) hotspots.set(name, { responses, fromRoomDoc: true });
    }
  }
}

// THE ROOM'S OWN LIVE FILE, WHICH WAS HARDCODED TO ROOM 2'S. Compiling Room 3
// would have taken its id-for-name pairs from Main Street, so every Nugget
// hotspot whose name Room 2 does not share would have fallen back to the slug
// rule -- and the whole point of reading the live file is that a person chose
// those ids.
const ROOM_FILE = { 2: 'main-street', 3: 'nugget' }[room];
const live0 = JSON.parse(read(`content/rooms/${ROOM_FILE}.json`) || '{}');
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

// THE ROOM'S AMBIENT CAST IS WHOEVER DECLARES THEMSELVES IN IT. Reading it
// from content/ambient rather than restating it in the room file means a
// character who exists is a character who appears -- which the dog was not.
// He was cut as a sprite, composited into a picture by hand, shown, and never
// connected to anything: the file existed, the room never mentioned him, and
// he did not appear in the game for several hours while everyone believed he
// had. R5k -- the list is derived from the thing it describes.
{
  const dir = 'content/ambient';
  const cast = existsSync(dir)
    ? readdirSync(dir).map((file) => JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')))
      .filter((npc) => npc.room === built.id).map((npc) => npc.id).sort()
    : [];
  if (cast.length) built.ambient = cast;
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
    const whole = variants?.rest.length ? { ...base, repeat: variants.rest } : base;
    const split = splitUtterance(whole.say ?? '');
    responses[verb] = [split ? { ...whole, ...split } : whole];
    if (split) splits += 1;
    else if (wraps(whole.say ?? '') > 3) unsplit.push(`${entry.docName}/${verb}`);
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
    // ACT VARIANTS THAT REPAINT SOMETHING ARE OBJECT STATES, NOT CONDITIONS.
    // presentation() picks a state from objectStates or the declared default
    // and nothing evaluates a `when` there -- and errata 60 is why that is
    // right. ACT is written at exactly four places, so an act turn SETS these
    // rather than the room asking every frame. Doc 48's S2, the funeral, sets
    // both of Room 2's: the Company's gilt is repainted because the search
    // just outlived its most annoying obstacle, and the notice board carries
    // Thad's own funeral notice.
    ...(ann.hotspotStates?.[id]
      ? { state: ann.hotspotStates[id].default, states: ann.hotspotStates[id].states }
      : {}),
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
  return {
    ...rest,
    ...(ann.exits[e.id] ? { rect: ann.exits[e.id] } : {}),
    ...(ann.exitWalkTo?.[e.id] ? { walkTo: ann.exitWalkTo[e.id] } : {}),
  };
});
// THE FLOOR, THE APPROACH POINTS, AND WHY THE HEIGHTS ARE THE CANON ONES.
//
// The live walk boxes stopped at x1925 -- a 3700 street with floor under half
// of it, and an arrival at 3477 standing on nothing. These span the annotation
// polygon's full width as levelled quads, because boxes are quads by rule.
//
// FIGURE HEIGHTS COME FROM THE ANNOTATION, WHICH COMES FROM THE PLATE.
//
// These were errata 54's shared 222/240/263 while doc 36 Q10 was open, on
// purpose: emitting the room's own smaller numbers would have made it
// internally consistent and quietly different from every other room, hiding
// the question instead of asking it. Q10 is ruled now.
//
// The ruling is that Room 2 is not a half-scale room but a DEEPER one. Two
// measurements of the plate agree to the pixel -- the saloon porch deck is
// 40px for about 0.6m, its batwing doorway 134px for about 2.0m -- and both
// put a man at 117px at the building line. So he arrives small at the far end
// and grows to 206 at the front of frame, against Room 1's 222 near, and beat
// 11's seam is 222 to 206 rather than 222 to 120.
{
  const pts = ann.walkable;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const L = Math.min(...xs), R = Math.max(...xs);
  const T = Math.min(...ys), B = Math.max(...ys);
  const quad = (y0, y1) => [{ x: L, y: y0 }, { x: R, y: y0 }, { x: R, y: y1 }, { x: L, y: y1 }];
  const c1 = Math.round(T + (B - T) * 0.34), c2 = Math.round(T + (B - T) * 0.67);
  const scale = {
    kind: 'curve',
    farY: ann.scaling.far.y, farHeight: ann.scaling.far.height,
    nearY: ann.scaling.near.y, nearHeight: ann.scaling.near.height,
  };
  const bands = [['mud_far', T, c1, 2], ['mud_mid', c1, c2, 1], ['mud_near', c2, B, 0]];
  const lip = (live.walkBoxes ?? []).find((w) => w.id === 'boardwalk');
  // OBSTACLES CARVE THE BANDS. A band is a quad by rule, so a thing standing on
  // the floor cannot be a hole in one -- it has to become several quads around
  // the gap. Thad walked straight through the water trough because nothing in
  // a full-width band says a trough is there.
  //
  // Each obstacle splits any band it intrudes into: the piece left of it, the
  // piece right of it, and -- where the obstacle stops short of the band's
  // bottom -- the strip underneath, which is the mud in FRONT of the trough
  // and is genuinely walkable. The rect is the trough's own hotspot rect, so
  // the thing you can click and the thing you cannot walk through are one
  // truth and not two.
  const carve = (band) => {
    let pieces = [band];
    for (const obstacle of ann.obstacles ?? []) {
      const [ox, oy, ow, oh] = obstacle.rect;
      const next = [];
      for (const piece of pieces) {
        const [px, py, pw, ph] = piece;
        const hits = ox < px + pw && ox + ow > px && oy < py + ph && oy + oh > py;
        if (!hits) { next.push(piece); continue; }
        if (ox > px) next.push([px, py, ox - px, ph]);
        if (ox + ow < px + pw) next.push([ox + ow, py, px + pw - (ox + ow), ph]);
        if (oy + oh < py + ph) {
          const left = Math.max(px, ox);
          const right = Math.min(px + pw, ox + ow);
          next.push([left, oy + oh, right - left, py + ph - (oy + oh)]);
        }
      }
      pieces = next;
    }
    return pieces;
  };

  built.walkBoxes = [
    // ERRATA 28a: THE LIP IS FIXED AT THE FAR DRAWN SIZE, and 'far' is now
    // 222, not the 240 it carried. It sits ABOVE mud_far, so a lip taller
    // than the mud below it makes stepping down off the boardwalk -- moving
    // NEARER -- shrink him, which is the one thing the floor may never do.
    // THE LIP IS CARVED TOO, and was not. The trough spans y543 to 605 and
    // the boardwalk band is 532 to 582, so the half of the trough standing in
    // the lip was never cut out -- Tyler clicked LOOK AT and Thad walked into
    // the water. Carving only the mud bands carved only half the obstacle.
    ...(lip ? carve([L, T - 52, R - L, 50]).map((piece, index) => ({
      ...lip,
      id: index === 0 ? 'boardwalk' : `boardwalk_${index}`,
      points: [{ x: piece[0], y: piece[1] }, { x: piece[0] + piece[2], y: piece[1] },
        { x: piece[0] + piece[2], y: piece[1] + piece[3] },
        { x: piece[0], y: piece[1] + piece[3] }],
      // NAMED AFTER CARVING, AND MUTUALLY. Carving mud_far into pieces around
      // the trough left the lip pointing at a box that no longer existed, and
      // the router requires neighbours to name each other both ways -- a
      // one-way link is a floor he can leave and not return to.
      neighbours: [],
      // The lip is fixed at the FAR drawn size, errata 28a -- and 'far' is
      // now this room's own far, not the shared zones'. It sits above
      // mud_far, so a lip taller than the mud below it would shrink him for
      // stepping down off the boardwalk, which a floor may never do.
      scaleMode: { kind: 'fixed', height: ann.scaling.far.height },
    })) : []),
    ...bands.flatMap(([id, y0, y1], n) => {
      const near = [n === 0 ? 'boardwalk' : bands[n - 1][0], bands[n + 1]?.[0]].filter(Boolean);
      const pieces = carve([L, y0, R - L, y1 - y0]);
      const name = (index) => (pieces.length === 1 ? id : `${id}_${index}`);
      return pieces.map((piece, index) => ({
        id: name(index),
        points: [{ x: piece[0], y: piece[1] }, { x: piece[0] + piece[2], y: piece[1] },
          { x: piece[0] + piece[2], y: piece[1] + piece[3] },
          { x: piece[0], y: piece[1] + piece[3] }],
        surface: 'mud',
        clipPlane: 12,
        scaleMode: scale,
        neighbours: [...near, ...pieces.map((_, other) => (other === index ? null : name(other)))]
          .filter(Boolean),
      }));
    }),
  ];
  // NEIGHBOURS ARE DERIVED FROM THE GEOMETRY, NOT LISTED BY HAND.
  //
  // Carving broke the hand-written lists twice over: the lip named a mud_far
  // that no longer existed, and the piece in front of the trough named the lip
  // back across a trough. Two boxes are neighbours when their rectangles
  // actually touch along an edge with real overlap -- which is symmetric by
  // construction, so the router's requirement that a link be two-way cannot be
  // violated by an edit.
  {
    const box = (each) => {
      const xs = each.points.map((point) => point.x);
      const ys = each.points.map((point) => point.y);
      return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
    };
    const TOUCH = 6;
    for (const one of built.walkBoxes) one.neighbours = [];
    for (let a = 0; a < built.walkBoxes.length; a += 1) {
      for (let b = a + 1; b < built.walkBoxes.length; b += 1) {
        const [ax0, ay0, ax1, ay1] = box(built.walkBoxes[a]);
        const [bx0, by0, bx1, by1] = box(built.walkBoxes[b]);
        const overlapX = Math.min(ax1, bx1) - Math.max(ax0, bx0);
        const overlapY = Math.min(ay1, by1) - Math.max(ay0, by0);
        const sideBySide = overlapY > TOUCH && Math.abs(ax1 - bx0) <= TOUCH;
        const stacked = overlapX > TOUCH && Math.abs(ay1 - by0) <= TOUCH;
        if (!sideBySide && !stacked && !(overlapX > TOUCH && overlapY > TOUCH)) continue;
        built.walkBoxes[a].neighbours.push(built.walkBoxes[b].id);
        built.walkBoxes[b].neighbours.push(built.walkBoxes[a].id);
      }
    }
  }

  // WHERE HE STANDS TO EXAMINE A THING, which no hotspot had.
  //
  // Tyler clicked LOOK AT on the water trough and Thad walked INTO it. Two
  // faults met: the lip was uncarved, and no object carried an approach point,
  // so the walk resolved to the target itself. Doc 22's staged chain wants a
  // point to walk to and none was ever compiled.
  //
  // The point is directly below the rect, on the first walk box that actually
  // contains it -- in FRONT of the thing, never on it, and never inside an
  // obstacle, because the boxes have already had the obstacles cut out of
  // them. A hotspot high on a wall gets the nearest floor beneath it, which
  // is where a man stands to look up at a sign.
  {
    const inside = (x, y) => built.walkBoxes.some((box) => {
      const xs = box.points.map((point) => point.x);
      const ys = box.points.map((point) => point.y);
      return x >= Math.min(...xs) && x <= Math.max(...xs)
        && y >= Math.min(...ys) && y <= Math.max(...ys);
    });
    const floorBelow = (x, fromY) => {
      for (let y = Math.max(fromY, T); y <= B; y += 4) if (inside(x, y)) return y;
      return null;
    };
    for (const hotspot of built.hotspots) {
      const [hx, hy, hw, hh] = hotspot.rect;
      const centre = Math.round(hx + hw / 2);
      // Try the centre, then either side, for a thing standing on the floor.
      const candidates = [centre, Math.round(hx - 40), Math.round(hx + hw + 40)];
      for (const x of candidates) {
        if (x < L || x > R) continue;
        const first = floorBelow(x, hy + hh + 8);
        if (first === null) continue;
        // AND HE STANDS BACK FROM IT, for the same reason he stands back from
        // a person: the first walkable row below a thing is flush against it,
        // and a man examining a trough does not have his boots in it. A third
        // of his own drawn height at that depth is about half a metre, and it
        // scales with the room's curve. Clamped to a row that is still floor.
        const curve = ann.scaling;
        const at = (y) => curve.far.height
          + ((y - curve.far.y) / (curve.near.y - curve.far.y))
          * (curve.near.height - curve.far.height);
        let y = first;
        const wanted = first + Math.round(at(first) * 0.34);
        for (let step = wanted; step > first; step -= 4) {
          if (inside(x, step)) { y = step; break; }
        }
        hotspot.walkTo = { x, y, facing: 'back' };
        break;
      }
    }
  }

  built.walkable = bands.map(([id, y0, y1, zone]) =>
    ({ id, zone, surface: 'mud', rect: [L, y0, R - L, y1 - y0] }));
  built.walkableOutline = ann.walkable;
  // ENTRANCES, PLURAL, WHICH IS WHAT THE ENGINE READS. The compiler wrote a
  // bare `entrance: [x, y]` and GameState.entranceInto looks for a list of
  // { from, at, facing } -- so the field was ignored and Thad appeared
  // wherever the previous room had left him. Tyler saw it as arriving in the
  // middle of Main Street with his back to the camera instead of walking in
  // off the road.
  built.entrances = ann.entrances ?? [];
  // Doc 18's flicker, by the mechanism that works on a generated plate.
  if (ann.lamps) built.lamps = ann.lamps;
  if (ann.onEnterSay) {
    built.onEnter = { ...(built.onEnter ?? {}), ...ann.onEnterSay };
  }
  built.walkBoxNote = `GENERATED by tools/compile-room.mjs from ${annPath}. `
    + 'Heights come from that annotation\u2019s own depth curve, which each room derives from '
    + 'its own architecture -- doc 36 Q10.';
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
  + `→${ann.scaling.near.height}px · arrival `
  + `${(ann.entrances?.find((e) => e.at)?.at ?? ann.entrance ?? ['?']).join(',')}`);
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
// THE ROOM'S OWN OUTPUT PATH, AND THIS WAS HARDCODED. Compiling Room 3 wrote
// the Nugget over content/rooms/main-street.json -- Main Street lost its
// hotspots, its cast, its lamps and its walk boxes in one command, and 104
// tests failed at once.
//
// It was loud, which is the only good thing about it: a silent version of this
// would have been a room quietly replaced by another room. The lesson is the
// one the live-file read taught eight lines up -- a compiler parameterised by
// room number must be parameterised EVERYWHERE, and I changed the paths I
// happened to trip over rather than looking for all of them.
const OUT = `content/rooms/${ROOM_FILE}.json`;
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
