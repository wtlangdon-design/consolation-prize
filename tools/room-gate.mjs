#!/usr/bin/env node
/**
 * DOC 35'S GATE, EXECUTED RATHER THAN REMEMBERED.
 *
 * Doc 35 section 2 has classified objects correctly since the day it was
 * written: a MOVER is "a person, animal, or vehicle that moves or departs --
 * Sprite. Never in the plate." The dog in Room 2's plate is a MOVER by that
 * table, and he got baked in anyway, because the gate was a document someone
 * had to remember to open and nobody opened it. Eight companion generations
 * later Tyler asked whether the dog should be a sprite. He was reading the
 * rule off the picture; the rule was already written down.
 *
 * So the gate stops being prose. This derives each hotspot's class from what
 * the documents already say about it, and emits the sprite manifest a plate
 * brief must be written against. It answers four questions per hotspot:
 *
 *   1. Does doc 49 or doc 13 give it a REACTION verb? (talks, rolls over,
 *      comes up an inch) -> it does something -> sprite.
 *   2. Does doc 05 Part Two-B give it an ACT VARIANT? -> it changes across
 *      acts -> sprite or state image.
 *   3. Is it a door or window -- an opening? -> stateful, needs an open image.
 *   4. Is it in doc 02's item ledger? -> takeable -> sprite.
 *
 * What it cannot do is see the future: a hotspot that becomes a sprite
 * because a new beat gets invented later is nobody's validator's problem.
 * What it guarantees is that every requirement ALREADY WRITTEN DOWN is
 * honoured before a plate freezes, instead of discovered afterwards.
 */
import { readFileSync } from 'node:fs';

const room = process.argv[2];
if (!room) {
  console.error('usage: node tools/room-gate.mjs <room number>');
  process.exit(2);
}

const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return ''; } };
const examine = read('docs/05-examine-layer.md');
const wrong = read('docs/49-wrong-answers.md') + '\n' + read('docs/13-room-02-content.md');
const puzzles = read('docs/02-puzzle-graph.md');
// THIS ROOM'S NAME, from this room's own heading. The first version sliced
// the first 200 characters of the whole document, so it always read Room 1's
// heading or nothing, and the puzzle rows never matched -- which is why the
// gate found the piano but not Deke Vessel.
const roomName = (new RegExp(`^## ROOM ${room}\\b[^\\n]*`, 'mi')
  .exec(readFileSync('docs/05-examine-layer.md', 'utf8')) || [''])[0]
  .replace(/^## ROOM \d+\s*[—-]\s*/i, '').replace(/\*.*$/, '').trim();

/** The room's own section of a doc, from its heading to the next room heading. */
function section(text, n) {
  const re = new RegExp(`^## ROOM ${n}\\b[^\\n]*$`, 'mi');
  const m = re.exec(text);
  if (!m) return '';
  const rest = text.slice(m.index + m[0].length);
  const next = /^## ROOM \d/mi.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

const body = section(examine, room);
if (!body) {
  console.error(`doc 05 has no scripted section for room ${room}. Run the writing pass first.`);
  process.exit(1);
}

// Hotspots are the bolded names in the room's own section.
const hotspots = [...body.matchAll(/^\*\*([^*]+)\*\*/gm)].map((m) => m[1].trim());

// Part Two-B's act variants, which name their hotspot the same way.
const variants = new Set();
const twoB = examine.slice(examine.indexOf('# PART TWO-B'));
const vSection = section(twoB, room);
for (const m of vSection.matchAll(/^\*\*([^*]+)\*\*\s*\*\(act:/gm)) variants.add(m[1].trim());

// Doc 49/13's authored verbs, per hotspot.
const reactions = new Map();
const wBody = section(wrong, room) || wrong;
for (const m of wBody.matchAll(/^\*\*([^*]+)\*\*\s*·\s*([A-Z_]+)/gm)) {
  const k = m[1].trim();
  if (!reactions.has(k)) reactions.set(k, new Set());
  reactions.get(k).add(m[2]);
}

// PEOPLE TOO, WHICH THIS MISSED. It listed THE PATRONS as plate because it
// knew about animals and vehicles and not about persons -- and ruling 20's
// own words are "a person, animal, or vehicle". A crowd may still be drawn
// into the plate, but that is a RULING about whether anyone in it moves, and
// the gate's job is to make somebody make it rather than to assume.
const ACTS_ON_ITS_OWN =
  /\b(dog|cat|raccoon|mule|horse|grievance|coach|wheel|patrons|crowd|men|man|woman|people|barman|driver)\b/i;
const PEOPLE = /\b(patrons|crowd|men|man|woman|women|people|barman|driver|miners|customers|figures)\b/i;
const OPENS = /\b(door|doors|window|gate|lid|drawer|flap|cabinet|box)\b/i;
// Words in an act variant that mean the PICTURE changes, not just the line.
// "Fresh gilt on the lettering" repaints a sign; "the dog knows me now"
// changes only what Thad says about him.
const VISIBLE = /\b(fresh|new|empty|gone|removed|posted|ruled through|repainted|paint|open|shut|lit|dark|filled)\b/i;

const rows = [];
for (const h of hotspots) {
  const why = [];
  let cls = 'PLATE';

  // WHAT THE TOOL CAN KNOW ON ITS OWN.
  if (ACTS_ON_ITS_OWN.test(h)) {
    cls = 'MOVER';
    why.push('doc 35 §2: a person, animal or vehicle');
  }
  if (OPENS.test(h)) { cls = 'STATEFUL'; why.push('it opens — needs an open image'); }
  if (new RegExp(`\\|\\s*${h.replace(/^THE\s+/i, '')}\\s*\\|`, 'i').test(puzzles)) {
    cls = 'TAKEABLE'; why.push("doc 02's item ledger");
  }

  // WHAT NEEDS A RULING. An act variant may repaint the object or may only
  // change what Thad says about it, and only reading it decides which. The
  // tool proposes; it does not classify. Guessing here would have cost five
  // needless companion generations on Room 2 alone.
  let ruling = null;
  if (variants.has(h) && cls === 'PLATE') {
    const text = vSection.slice(vSection.indexOf(`**${h}**`), vSection.indexOf(`**${h}**`) + 400);
    ruling = VISIBLE.test(text)
      ? 'act variant reads as a VISIBLE change — probably stateful'
      : 'act variant may be words only — read it and rule';
  }
  // NO PERSON IS EVER PAINTED INTO A PLATE -- doc 35's standing rule, in
  // capitals there because it was broken once. There is no crowd exception,
  // no background-figure exception, and none for nine at a time. A person is
  // a sprite, and it is not a `?` for anybody to rule on.
  if (PEOPLE.test(h)) {
    cls = 'MOVER';
    why.length = 0;
    why.push('A PERSON. Never plate -- doc 35, and there is no crowd exception');
    ruling = null;
  }
  rows.push({ h, cls, why, ruling });
}


// ---- what the puzzle graph does to this room -------------------------------
//
// THE GATE READ THE EXAMINE LAYER AND NEVER THE PUZZLES, and that is how it
// passed the Nugget's piano. Doc 02's A8 is "tune the Bountiful Nugget's
// piano for money" -- the payoff of the tuning fork and a callback to A2 --
// and a man tuning a piano has its lid open. Doc 05 says only that a tuned
// piano sounds different, so the gate saw an act variant that changes words
// and ruled it plate. It was right about the variant and blind to the puzzle.
//
// Tyler asked how he stops having to ask. This is the answer: a hotspot a
// PUZZLE acts on is a hotspot that may have to look different while it is
// acted on, and the gate now says so rather than waiting to be asked.
const words = (text) => text.toLowerCase().replace(/[^a-z ]+/g, ' ').split(/\s+/).filter(Boolean);
const roomWords = new Set(words(roomName || ''));
const puzzleRows = puzzles.split('\n').filter((line) => /^\|\s*\*\*[A-F]\d/.test(line));
const acted = new Map();
const cast = new Set();
for (const row of puzzleRows) {
  const id = (/\*\*([A-F]\d+[a-z]?)\*\*/.exec(row) || [])[1];
  const lower = row.toLowerCase();
  const mentionsRoom = [...roomWords].some((w) => w.length > 3 && lower.includes(w));
  for (const { h: name } of rows) {
    const noun = name.replace(/^(THE|A)\s+/i, '').toLowerCase();
    if (!lower.includes(noun)) continue;
    if (!mentionsRoom && !lower.includes(noun)) continue;
    acted.set(name, `${id}: ${row.split('|')[2]?.trim().slice(0, 60)}`);
  }
  // A character named in a puzzle set in this room is IN this room, and no
  // examine layer mentions them, because they are not scenery.
  if (mentionsRoom) {
    for (const m of row.matchAll(/\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g)) cast.add(m[1]);
  }
}

// ---- things that emit light -------------------------------------------------
//
// Doc 18's palette cycling is the only background animation the game has, and
// Room 1 already uses it for Hob's lamp. A lit interior that does not breathe
// is a still photograph of a warm room. Costs palette entries, not art.
const LIGHT = /\b(lamp|lamps|candle|candles|chandelier|stove|fire|lantern|flame|hearth)\b/i;
const lights = rows.filter((entry) => LIGHT.test(entry.h));

const sprites = rows.filter((r) => r.cls !== 'PLATE');
console.log(`\nROOM ${room} — GATE §2, derived from the documents\n`);
for (const r of rows) {
  const mark = r.cls === 'PLATE' ? (r.ruling ? ' ? ' : '   ') : ' ! ';
  const note = r.why.length ? `  — ${r.why.join('; ')}` : (r.ruling ? `  — ${r.ruling}` : '');
  console.log(`${mark}${r.cls.padEnd(9)} ${r.h}${note}`);
}
const undecided = rows.filter((r) => r.ruling);
console.log(`\n${sprites.length} of ${rows.length} hotspots MUST NOT be baked into the plate.`);
if (sprites.length) {
  console.log('\nCompanion generations required, one per line:');
  for (const r of sprites) console.log(`  · identical image without: ${r.h}`);
}
if (undecided.length) {
  console.log(`\n${undecided.length} hotspot(s) marked ? need a ruling before the plate freezes.`);
}
if (acted.size) {
  console.log('\nACTED ON BY A PUZZLE -- does it look different while it happens?');
  for (const [name, why] of acted) console.log(`  · ${name} -- ${why}`);
}
if (cast.size) {
  console.log('\nCHARACTERS the puzzle graph puts in this room (never in the plate):');
  for (const who of cast) console.log(`  · ${who}`);
}
if (lights.length) {
  console.log('\nLIGHT SOURCES -- declare `cycling` (doc 18) so the room breathes:');
  for (const entry of lights) console.log(`  · ${entry.h}`);
}
console.log('\nThe plate brief is written from the PLATE rows only.\n');
