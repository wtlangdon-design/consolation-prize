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

/**
 * The content file the manifest already loads for this room id.
 *
 * REFUSES RATHER THAN GUESSES. A room the manifest does not list is one the
 * engine will not load, so compiling to a slugged filename beside it would
 * produce a file that passes every check and is read by nothing -- R5l, the
 * shape this project keeps finding. The refusal says to add it to the
 * manifest, which is a decision somebody makes once.
 */
function roomFileFor(id) {
  if (!id) {
    fail('the annotation declares no `room` id, so there is nothing to compile it into.');
  }
  const manifest = JSON.parse(read('content/manifest.json'));
  const found = manifest.rooms.find((path) => JSON.parse(read(path) || '{}').id === id);
  if (!found) {
    fail(`the annotation is for room "${id}" and content/manifest.json loads no room with `
      + `that id. Add its file to the manifest first: a room the engine does not load is a `
      + `room every check will happily validate and nobody will ever see.`);
  }
  return found;
}

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
    // A LINE MAY SIT ON THE LINE BELOW ITS MARKER. Doc 05 writes THE
    // HANDBILL's LOOK as `> **LOOK:** *(full text)*` with the rules quoted
    // underneath, because it is long enough to want its own line. The pattern
    // above requires the quote on the marker's own line, so the handbill
    // compiled with a LISTEN and no LOOK -- the one hotspot in Room 3 that
    // doc 02 calls critical, silent on the verb that matters.
    for (const m of b.matchAll(
      /^>\s*\*\*(LOOK|LISTEN):\*\*\s*\*\([^)]*\)\*\s*\n>\s*"([\s\S]*?)"\s*$/gm)) {
      const verb = VERBS[m[1]];
      if (!entry.responses[verb]) {
        entry.responses[verb] = [{ say: m[2].replace(/\s*\n\s*/g, ' ') }];
      }
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
  // FOUND BY ITS HEADING, NOT ITS NUMBER. Doc 13 puts repeat variants in PART
  // THREE and doc 16 puts them in PART TWO, because the two documents have
  // different things to say and numbered their sections independently.
  // Hardcoding the number meant Room 3's twenty repeat lines were read as
  // object overrides or not at all.
  const heading = /^#\s+PART [A-Z]+\s*—\s*REPEAT VARIANTS.*$/mi.exec(text);
  const from = heading ? heading.index : text.indexOf('# PART THREE');
  const after = text.slice(from + 1).search(/^#\s+PART /mi);
  const part = after < 0 ? text.slice(from) : text.slice(from, from + 1 + after);
  let current = null;
  for (const line of part.split('\n')) {
    const head = /^##\s+(.+?)\s*$/.exec(line);
    if (head) { current = head[1].trim(); continue; }
    // The dash is optional: doc 13 writes `**LOOK** — 2 "..."` and doc 16
    // writes `**LOOK** 2 "..."`. Requiring it dropped every one of Room 3's
    // twenty repeat lines on the floor, and the content check caught it as
    // "20 lines, not yet in /docs" -- which was wrong about the cause. They
    // were in the docs. They were unreadable to this.
    const row = /^\*\*(LOOK|LISTEN)\*\*\s*(?:—\s*)?(.+)$/.exec(line);
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
//
// FOUND BY THE ROOM'S OWN NUMBER, NOT BY A TABLE OF TWO. `{2: ..., 3: ...}`
// answered for the only two rooms that had ever been compiled and returned
// `undefined` for every other, which then fell through to doc 49's section --
// silently, with the room's real content document sitting unread beside it.
// Doc 46's factory is meant to take a room number as a parameter; a two-entry
// literal is a parameter that has been answered in advance.
//
// The naming rule is the documents' own: `NN-room-NN-...`. Discovered by
// listing docs/ rather than by constructing a filename, so a document whose
// title nobody predicted is still found, and a room with none gets doc 49's
// section as it always did.
const ROOM_DOCS = readdirSync('docs')
  .filter((name) => new RegExp(`^\\d+-room-0*${room}\\b`, 'i').test(name))
  .map((name) => `docs/${name}`)
  .sort();
// A ROOM MAY HAVE SEVERAL DOCUMENTS AND ONLY ONE OF THEM HOLDS ITS LINES.
// Room 2 has both `13-room-02-content` and `14-room-02-exits`, and taking the
// first alphabetically happens to be right -- which is luck, not a rule, and
// the next room to acquire a second document would find out the hard way.
// `-content` is the convention the documents already follow; anything else
// ambiguous is refused with both names rather than resolved by sorting.
const ROOM_DOC = ROOM_DOCS.find((path) => /-content\.md$/.test(path))
  ?? (ROOM_DOCS.length <= 1 ? ROOM_DOCS[0] : undefined);
if (ROOM_DOCS.length > 1 && !ROOM_DOC) {
  fail(`several documents name room ${room} and none is a "-content" one: `
    + `${ROOM_DOCS.join(', ')}. Which holds its written lines is a fact about the writing, `
    + 'not something a sort order should decide.');
}
const wrongDoc = ROOM_DOC ? read(ROOM_DOC) : section(read('docs/49-wrong-answers.md'), room);
// TWO DIGITS, NOT ONE. `room-0${room}` cannot express room 13, and the rooms
// after 9 are most of the game.
const annPath = `reference/room-${String(room).padStart(2, '0')}/annotation.json`;
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
//
// THE MANIFEST NAMES THE OUTPUT FILE, and the annotation names which room it
// is. Another two-entry literal, and the more dangerous of the two: an
// unlisted room compiled to `content/rooms/undefined.json`, which is a path
// that writes cleanly and is loaded by nothing.
//
// `ann.room` is the room id the annotator recorded, so the annotation and the
// manifest have to agree before anything is written -- and if they do not, the
// refusal names both rather than picking one.
const ROOM_FILE = roomFileFor(ann.room);
const live0 = JSON.parse(read(ROOM_FILE) || '{}');
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
  // THE POLYGON'S OWN WIDTH AT A DEPTH, NOT THE BOUNDING BOX'S.
  //
  // Room 2's floor is 3630 pixels wide at every depth -- it is a street -- so
  // taking L and R from the bounding box was right there and wrong the moment
  // a room's floor was any other shape. The Nugget's floor runs from 1011
  // wide at the back to 1546 at the front, because the bar cuts across it
  // diagonally, and full-width bands would have let Thad walk through the bar.
  //
  // A band is still a quad. It is just clipped to the floor it belongs to,
  // which for a street returns exactly the bounding box and changes nothing.
  const spanAt = (y) => {
    const xs = [];
    for (let i = 0; i < pts.length; i += 1) {
      const [x1, y1] = pts[i];
      const [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= y && y < y2) || (y2 <= y && y < y1)) {
        xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    return xs.length ? [Math.min(...xs), Math.max(...xs)] : null;
  };
  // The NARROWEST span the band covers, so a quad never reaches outside the
  // floor at any depth within it -- a box that fits at its middle but overhangs
  // at its far edge is a box he can stand outside the room in.
  // OPT-IN, BECAUSE IT IS WRONG FOR A STREET. Clipping takes a band's
  // NARROWEST span so no quad reaches outside the floor -- correct for the
  // Nugget, whose floor narrows evenly against the bar. Room 2's floor is full
  // width everywhere except a sloping top edge, so its topmost band's
  // narrowest row is nearly a point and clipping collapsed mud_far from 3630
  // wide to 51, cutting the street in half.
  //
  // A room declares `walkModel: "clipped"` when its floor is not a rectangle.
  // Doing it by measurement instead would be guessing at which of two correct
  // behaviours a room wants.
  const clipped = ann.walkModel === 'clipped';
  const bandSpan = (y0, y1) => {
    if (!clipped) return null;
    let left = -Infinity;
    let right = Infinity;
    for (let y = y0; y <= y1; y += 2) {
      const span = spanAt(y);
      // A DEGENERATE ROW IS NOT A NARROW FLOOR. The topmost band contains the
      // polygon's apex, where the span is a single point; taking that as the
      // band's narrowest made the whole band collapse and fall back to the
      // bounding box -- the one band that most needed clipping got none.
      if (!span || span[1] - span[0] < 8) continue;
      left = Math.max(left, span[0]);
      right = Math.min(right, span[1]);
    }
    return Number.isFinite(left) && right > left
      ? [Math.round(left), Math.round(right)] : null;
  };
  const quad = (y0, y1) => {
    const span = bandSpan(y0, y1) ?? [L, R];
    return [{ x: span[0], y: y0 }, { x: span[1], y: y0 },
      { x: span[1], y: y1 }, { x: span[0], y: y1 }];
  };
  const c1 = Math.round(T + (B - T) * 0.34), c2 = Math.round(T + (B - T) * 0.67);
  const scale = {
    kind: 'curve',
    farY: ann.scaling.far.y, farHeight: ann.scaling.far.height,
    nearY: ann.scaling.near.y, nearHeight: ann.scaling.near.height,
  };
  // HOW MANY BANDS: three for a floor of constant width, more where it
  // narrows, because each band is a rectangle and a rectangle can only follow
  // a slanted edge in steps. Measured from the floor itself rather than
  // declared, so a street gets three and the Nugget gets enough.
  // MEASURED BY PERCENTILE, because a polygon tapers to a point at its
  // topmost vertex and that taper is not variation a player can stand in.
  // Room 2's floor is 3630 wide at every depth that matters and 0 at the apex;
  // taking the raw range gave it twelve bands for a straight street. The
  // middle eighty per cent ignores the taper at both ends and answers the
  // question actually being asked -- does this floor change width as it comes
  // toward the camera.
  const widths = [];
  for (let y = T; y <= B; y += 4) {
    const span = spanAt(y);
    if (span) widths.push(span[1] - span[0]);
  }
  widths.sort((a, b) => a - b);
  const at = (q) => widths[Math.min(widths.length - 1, Math.floor(widths.length * q))] ?? 0;
  // MEDIAN TO p90, not p10 to p90. The taper at a polygon's apex covers about
  // a seventh of Room 2's rows, so p10 still landed inside it and the street
  // measured a spread of 1811 on a floor that never changes width. From the
  // median upward there is no taper to fall into: Room 2 measures 0 and the
  // Nugget measures 370, which is the difference the count should turn on.
  const spread = widths.length ? at(0.9) - at(0.5) : 0;
  const count = (!clipped || spread < 40) ? 3 : Math.min(12, 3 + Math.ceil(spread / 120));
  const bands = [];
  for (let i = 0; i < count; i += 1) {
    const y0 = i === 0 ? T : Math.round(T + ((B - T) * i) / count);
    const y1 = i === count - 1 ? B : Math.round(T + ((B - T) * (i + 1)) / count);
    const zone = count === 3 ? 2 - i : Math.min(2, Math.floor(((count - 1 - i) * 3) / count));
    bands.push([count === 3 ? ['mud_far', 'mud_mid', 'mud_near'][i] : `floor_${i}`, y0, y1, zone]);
  }
  /** Every band name asked about, so the room file can publish the list. */
  const askedBands = new Set();

  /**
   * The occlusion plane the ANNOTATION gives this band. Doc 36 Q14.
   *
   * REFUSES RATHER THAN GUESSING, and that is the whole ruling. The previous
   * version wrote `12` into every box -- one number, no room's, naming no
   * plane -- so `Renderer.masked()` resolved it against Main Street's levels
   * 1 and 2, found neither, and drew straight through. Two masks loaded and
   * occluded nobody for as long as the room has existed.
   *
   * A DEFAULT HERE WOULD BE THE SAME MISTAKE IN A NEW SUIT. Every room's
   * occlusion geometry is its own reading of its own picture: which band is
   * in front of the trough is not derivable from a band's name or its depth
   * index. So a band with no authored value is a build failure that names the
   * band, and the fix is one line in the annotation.
   */
  const authoredPlane = (band) => {
    askedBands.add(band);
    const table = ann.occlusion?.clipPlane;
    if (!table) {
      fail('the annotation declares no `occlusion.clipPlane`. Every walk box needs the plane '
        + 'that masks an actor standing in it, authored per band -- boardwalk, mud_far, '
        + 'mud_mid, mud_near. 0 means masked by nothing. Doc 36 Q14.');
    }
    // BY BAND, NOT BY CARVED PIECE, and this is only ever called with a band
    // name. `mud_far` becomes mud_far_0..2 around the trough and every piece
    // is at the same depth, so the band is where the decision belongs and the
    // pieces inherit it.
    //
    // NAMED EXACTLY, WITH NO STRIPPING RULE. A first version fell back to the
    // band name minus a trailing `_N`, which is right for `mud_far_0` and
    // WRONG for the Nugget, whose bands are themselves `floor_0`..`floor_6` --
    // it would have read `floor` for all seven and matched one entry to seven
    // different depths. A convenience that cannot tell a band from a piece is
    // a convenience that will eventually answer for the wrong one.
    const found = table[band];
    if (found === undefined) {
      fail(`the annotation's occlusion.clipPlane has no entry for the band "${band}". `
        + `It names: ${Object.keys(table).join(', ')}. A band with no authored plane is a `
        + 'band whose occlusion nobody has decided, and a default would decide it silently.');
    }
    if (!Number.isInteger(found) || found < 0) {
      fail(`occlusion.clipPlane.${key} is ${JSON.stringify(found)}; it must be a plane level, `
        + 'or 0 for masked by nothing.');
    }
    return found;
  };

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
      // AUTHORED, NOT INHERITED FROM THE LIVE BOX. Spreading `...lip` carried
      // whatever clipPlane the previous compile had written, which is how a
      // constant nobody chose survived every regeneration.
      clipPlane: authoredPlane('boardwalk'),
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
      // FROM THE FLOOR'S OWN SPAN AT THIS DEPTH, not the bounding box. This
      // line is where the polygon clipping was being thrown away: quad() was
      // taught to clip and then the bands never called it, so the Nugget's
      // middle bands came out 1690 wide across a floor 1120 wide and Thad
      // could walk through the bar after all.
      const span = bandSpan(y0, y1) ?? [L, R];
      const pieces = carve([span[0], y0, span[1] - span[0], y1 - y0]);
      const name = (index) => (pieces.length === 1 ? id : `${id}_${index}`);
      return pieces.map((piece, index) => ({
        id: name(index),
        points: [{ x: piece[0], y: piece[1] }, { x: piece[0] + piece[2], y: piece[1] },
          { x: piece[0] + piece[2], y: piece[1] + piece[3] },
          { x: piece[0], y: piece[1] + piece[3] }],
        surface: 'mud',
        clipPlane: authoredPlane(id),
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
        // BOTH DIRECTIONS. Testing only a's right edge against b's left made
        // adjacency depend on the order the boxes happen to be generated in:
        // the strip below the Nugget's spittoon touches the strip beside it
        // exactly at x1454, and was called unreachable because it came second
        // in the list. Carving is what exposed it -- before obstacles, bands
        // were always emitted left to right.
        const sideBySide = overlapY > TOUCH
          && (Math.abs(ax1 - bx0) <= TOUCH || Math.abs(bx1 - ax0) <= TOUCH);
        const stacked = overlapX > TOUCH
          && (Math.abs(ay1 - by0) <= TOUCH || Math.abs(by1 - ay0) <= TOUCH);
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

  // THE ZONE BANDS ARE CLIPPED TOO, and were not. They kept the bounding box
  // while the walk boxes learned the floor's real shape, so the Nugget's
  // topmost zone band ran x40-1690 across a floor 115 wide at that depth and
  // its own centre was not walkable. Two descriptions of one floor have to
  // agree, or a check that asks either of them is asking the wrong one.
  built.walkable = bands.map(([id, y0, y1, zone]) => {
    const span = bandSpan(y0, y1) ?? [L, R];
    return { id, zone, surface: 'mud', rect: [span[0], y0, span[1] - span[0], y1 - y0] };
  });
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
  // Whole-plate animation, where a room declares it.
  if (ann.backgroundFrames) {
    built.backgroundFrames = ann.backgroundFrames;
    built.backgroundRate = ann.backgroundRate ?? 0.5;
  } else {
    // Cleared when the annotation stops declaring them, or a room that has
    // moved to sprites keeps animating a plate it no longer has.
    delete built.backgroundFrames;
    delete built.backgroundRate;
  }
  // Cleared when the annotation stops declaring one, for the same reason as
  // backgroundFrames: a room that has moved on should not keep loading a file
  // its previous shape needed.
  if (ann.foreground) built.foreground = ann.foreground;
  else delete built.foreground;
  if (ann.onEnterWalkTo) {
    built.onEnter = { ...(built.onEnter ?? {}), walkTo: ann.onEnterWalkTo };
  }
  if (ann.onEnterSay) {
    built.onEnter = { ...(built.onEnter ?? {}), ...ann.onEnterSay };
  }
  // OCCLUSION PLANES, WHERE THE ANNOTATION AUTHORS THEM. Geometry read off the
  // plate belongs with the rest of the geometry, and a room file this tool
  // rewrites is not a place a hand edit survives. A room whose annotation
  // declares none keeps whatever it already had, so nothing is lost by not
  // having been converted yet.
  if (ann.occlusion?.planes) built.occlusionPlanes = ann.occlusion.planes;
  // The authored points a proof stands the actor on, and the plane each is
  // meant to be masked by. Carried so `check-occlusion` and the room proof
  // read ONE set of numbers a person wrote down rather than each deriving its
  // own convenient ones -- gate 8C's whole argument, one level down.
  if (ann.occlusion?.proofPoints) built.occlusionProofs = ann.occlusion.proofPoints;
  // THE EXACT KEYS `authoredPlane` ASKED FOR, published so nothing has to
  // guess them. The annotator needs this list to show a row per band, and it
  // cannot derive it: a carved piece is `mud_far_0` and a band can itself be
  // `floor_5`, so no suffix rule tells the two apart. Deriving it there would
  // be a second copy of the carving logic, disagreeing with this one the first
  // time either moved -- and the disagreement would show up as Tyler authoring
  // a plane for a band the compiler never asks about.
  built.occlusionBands = [...askedBands].sort();

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
const OUT = ROOM_FILE;
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
