import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { ROOT } from './lib/content.mjs';
import { resolveIssueRef } from './lib/issueref.mjs';

/**
 * EVERY ROOM'S EXAMINE LAYER, EXTRACTED FROM THE DOCUMENTS -- one file per room.
 *
 * Batch C (doc 54) finished the writing for rooms 4 and 6-36, under errata 67
 * (the two examine passes are merged) and 68-70 (the decisions that merge
 * forced). The writing now lives in up to six documents per room: doc 05's
 * pass, a batch doc (08, 09 or 10), doc 25 or 26, doc 54, doc 05's act block,
 * and doc 49's wrong verbs. A room builder that had to stitch those together
 * by hand would be retyping, which is the thing CLAUDE.md forbids.
 *
 * So this does the stitching, mechanically, and writes
 * content/examine/room-NN.json: every subject with its LOOK and LISTEN
 * sequences in errata 67's order (doc 05's line, then the batch's, then the
 * repeats as written), its act variants, and its wrong-verb overrides. The
 * room's compiler takes lines from here by hotspot name when the room is
 * built. Geometry is not here, and nothing here is geometry.
 *
 * WHAT IT READS is each room's proofs/readiness/room-NN.sources.json -- the
 * same pointers the readiness gate reads -- so the gate and the extractor
 * cannot disagree about which documents make a room.
 *
 * WHAT IT REFUSES, loudly: a subject left with fewer than three of either
 * verb after errata 68 H's drops, an alias or drop naming nothing, and a
 * wrong-verb line for an object no pass places that no ruling retired.
 *
 *   node tools/extract-examine.mjs           write every room
 *   node tools/extract-examine.mjs --check   compare, write nothing
 */

const CHECKING = process.argv.includes('--check');
const ROOMS = [4, ...Array.from({ length: 31 }, (_, i) => i + 6)].filter((n) => n !== 7 && n !== 24);
//: Room 24 (the hole) is written as one section with Room 23 ("ROOM 23 & 24")
//: and is extracted once, as room-23.json.
//: Rooms 5 and 7 ship already, extracted by extract-content.mjs from doc 25
//: (and Room 7 from doc 19's rewrite of THE TWO LINES); they are not repeated.
const DECLARATIONS = 'docs/54-batch-c.md::MERGE DECLARATIONS';

const read = (relative) => readFileSync(resolve(ROOT, relative), 'utf8');

function section(reference) {
  if (!reference) return null;
  const found = resolveIssueRef(reference);
  if (!found.ok) throw new Error(`cannot resolve ${reference}: ${found.why}`);
  const lines = read(found.path).split('\n');
  const start = found.line - 1;
  const depth = /^(#{1,6})/.exec(lines[start])[1].length;
  let end = lines.length;
  for (let at = start + 1; at < lines.length; at += 1) {
    const next = /^(#{1,6})\s/.exec(lines[at]);
    if (next && next[1].length <= depth) { end = at; break; }
  }
  return { path: found.path, body: lines.slice(start + 1, end).join('\n') };
}

const plain = (text) => text.replace(/\*+/g, '').replace(/\s+/g, ' ').trim();
const firstQuote = (text) => /"([^"]+)"/.exec(text)?.[1] ?? null;

/** A numbered run, `1 "..." · 2 "..."`, in written order, keeping each number. */
function run(text) {
  const out = [];
  for (const piece of text.split('·')) {
    const match = /(\d+)\s+"([^"]+)"/.exec(piece);
    if (match) out.push({ n: Number(match[1]), text: match[2] });
  }
  return out;
}

/** Which act a label like "Act I", "Acts I–III" or "Act IV" begins at; null for none. */
function actOf(label) {
  const match = /Acts?\s+([IV]+)/.exec(label ?? '');
  if (!match) return null;
  return { I: 1, II: 2, III: 3, IV: 4 }[match[1]] ?? null;
}

/* --------------------------------------------------------------- per room */

function extract(room, declarations) {
  const sources = JSON.parse(read(`proofs/readiness/room-${String(room).padStart(2, '0')}.sources.json`));
  const examine = sources.examine ?? {};
  const errors = [];
  const notes = [];
  const alias = new Map();
  const subjects = new Map();
  const order = [];

  const completions = (examine.completions ?? []).map((reference) => ({ reference, ...section(reference) }));
  for (const one of completions) {
    for (const line of one.body.split('\n')) {
      const found = /^\*\*(.+?)\*\*\s*≡\s*\*\*(.+?)\*\*/.exec(line.trim());
      if (found) alias.set(plain(found[2]), plain(found[1]));
    }
  }
  const named = (name) => alias.get(plain(name)) ?? plain(name);
  const slot = (name) => {
    const key = named(name);
    if (!subjects.has(key)) {
      subjects.set(key, { name: key, aliases: [], LOOK_AT: [], LISTEN_TO: [], acts: new Map(), overrides: {} });
      order.push(key);
    }
    const at = subjects.get(key);
    if (plain(name) !== key && !at.aliases.includes(plain(name))) at.aliases.push(plain(name));
    return at;
  };
  const actAdd = (name, act, key, text) => {
    const at = slot(name);
    if (!at.acts.has(act)) at.acts.set(act, { LOOK_AT: [], LISTEN_TO: [] });
    at.acts.get(act)[key].push(text);
  };
  const pendingOverrides = [];
  const add = (name, verb, text, src, n = 1) => {
    if (text === null) return;
    slot(name)[verb].push({ text, src, n });
  };

  /* doc 05's pass, and the batch pass, in doc 05's shape -------------------- */
  const doc05Shape = (body, src, { retired = [] } = {}) => {
    const lines = body.split('\n');
    for (let at = 0; at < lines.length; at += 1) {
      const line = lines[at].trim();
      if (/\*\(working script\)\*\s*$/.test(line)) {
        for (const name of line.replace(/—.*$/, '').split('·')) if (plain(name)) slot(name);
        continue;
      }
      // A line of bold names joined by "·": sketched subjects, with any
      // parenthetical lines under them (doc 08-10).
      if (/^\*\*[^*]+\*\*(\s*·\s*\*\*[^*]+\*\*)+\s*$/.test(line)) {
        const names = [...line.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => plain(m[1]));
        const bare = (text) => text.toUpperCase().replace(/^(THE|A|AN)\s+/, '');
        for (const name of names) if (!retired.some((r) => name.startsWith(r))) slot(name);
        for (let k = at + 1; k < lines.length; k += 1) {
          const note = /^>?\s*\*\((.+?)\s+—\s+(.*)\)\*\s*$/.exec(lines[k].trim());
          if (!note) break;
          const noted = bare(note[1].trim());
          const owner = names.find((name) => bare(name) === noted
            || bare(name).startsWith(`${noted} `) || bare(name).endsWith(` ${noted}`));
          if (!owner) { errors.push(`room ${room}: a parenthesis names "${note[1]}", which is none of ${names.join(', ')}`); continue; }
          for (const verb of ['LOOK', 'LISTEN']) {
            const said = new RegExp(`\\*\\*${verb}( Acts? [^:*]+)?:\\*\\*\\s*"([^"]+)"`, 'g');
            for (const found of note[2].matchAll(said)) {
              const act = actOf(found[1]);
              if (act && act > 1) actAdd(owner, String(act), verb === 'LOOK' ? 'LOOK_AT' : 'LISTEN_TO', found[2]);
              else add(owner, verb === 'LOOK' ? 'LOOK_AT' : 'LISTEN_TO', found[2], src);
            }
          }
        }
        continue;
      }
      const heading = /^\*\*(.+?)\*\*(.*)$/.exec(line);
      if (!heading) continue;
      const name = plain(heading[1]);
      if (retired.some((r) => name.startsWith(r))) continue;
      const rest = lines.slice(at + 1, at + 7);
      const quotes = [];
      for (const row of rest) {
        const said = /^>\s*\*\*(LOOK|LISTEN)( Acts? [^:*]+)?:?\*\*\s*(.*)$/.exec(row.trim());
        if (!said) { if (row.trim() && !row.trim().startsWith('>')) break; continue; }
        quotes.push(said);
      }
      if (!quotes.length) continue;
      const act = /\*\(act:\s*"?([^)"]+)"?\)\*/.exec(heading[2] ?? '');
      for (const [, verb, qualifier, text] of quotes) {
        const key = verb === 'LOOK' ? 'LOOK_AT' : 'LISTEN_TO';
        const line = firstQuote(text);
        if (line === null) { notes.push(`room ${room}: ${name} ${verb} in ${src} is a stage direction, not a line`); slot(name); continue; }
        const labelled = actOf(qualifier);
        if (act) actAdd(name, act[1], key, line);
        else if (labelled && labelled > 1) actAdd(name, String(labelled), key, line);
        else add(name, key, line, src);
      }
    }
  };

  const primary = section(examine.primary);
  if (examine.special) {
    return special(room, sources, primary, [...completions, section(examine.special.source)]);
  }
  doc05Shape(primary.body, primary.path);
  if (examine.actVariants && examine.actVariants !== examine.primary) {
    const block = section(examine.actVariants);
    doc05Shape(block.body, block.path);
  }
  const retired = examine.retired?.names ?? [];
  for (const reference of examine.merged ?? []) {
    const batch = section(reference);
    doc05Shape(batch.body, batch.path, { retired });
  }

  /* completions: doc 25/26/54 shapes ---------------------------------------- */
  for (const one of completions) {
    const lines = one.body.split('\n');
    const appendRun = (name, verb, text, qualifier, full = true, actTag = null) => {
      const key = verb === 'LOOK' ? 'LOOK_AT' : 'LISTEN_TO';
      const act = actTag ?? (actOf(qualifier) > 1 ? String(actOf(qualifier)) : null);
      const said = run(text);
      if (act) {
        for (const line of said) actAdd(name, act, key, line.text);
        return;
      }
      const existing = new Set(slot(name)[key].map((line) => line.text));
      // A FULL RUN that restates a line already gathered (doc 26's newly
      // written PRICE LIST repeats doc 09's parenthetical LOOK as its 1) is
      // not a second line. Only a full run's leading lines are compared;
      // continuation runs, which carry deliberate repetitions, never are.
      let skipping = true;
      for (const line of said) {
        if (full && skipping && existing.has(line.text)) continue;
        skipping = false;
        add(name, key, line.text, one.path, line.n);
      }
    };
    for (let at = 0; at < lines.length; at += 1) {
      const line = lines[at].trim();
      // ### NAME, then **LOOK** and **LISTEN** runs.
      const block = /^###\s+(.+)$/.exec(line);
      if (block) {
        const name = block[1];
        if (/\*\(inventory\)\*/.test(name)) continue; // items, not room subjects
        for (const row of lines.slice(at + 1, at + 4)) {
          const said = /^\*\*(LOOK|LISTEN)((?: Acts? [^*]+)?)\*\*(.*)$/.exec(row.trim());
          if (said) appendRun(plain(name), said[1], said[3], said[2]);
        }
        continue;
      }
      // An exit: **THE DOOR → Room 18**, then unquoted runs.
      const exit = /^\*\*(.+?)\s+→\s+(?:Room\s+\d+|the map)\*\*\s*$/.exec(line);
      if (exit) {
        for (const row of lines.slice(at + 1, at + 3)) {
          const said = /^\*\*(LOOK|LISTEN)\*\*(.*)$/.exec(row.trim());
          if (said) appendRun(plain(exit[1]), said[1], said[2], '');
        }
        continue;
      }
      // A continuation: **NAME** — LOOK n "..." | LISTEN n "...".
      // An act-tagged continuation carries `*(act: "3-4")*` after the name.
      const continuation = /^\*\*(.+?)\*\*\s*(?:\*\(act:\s*"?([^)"]+)"?\)\*)?\s*—\s*LOOK\s(.*)$/.exec(line);
      if (continuation) {
        const [look, listen] = continuation[3].split('|');
        appendRun(plain(continuation[1]), 'LOOK', look, '', false, continuation[2] ?? null);
        if (listen) appendRun(plain(continuation[1]), 'LISTEN', listen.replace(/^\s*LISTEN\s*/, ''), '', false, continuation[2] ?? null);
        continue;
      }
      const listenOnly = /^\*\*(.+?)\*\*\s*(?:\*\(act:\s*"?([^)"]+)"?\)\*)?\s*—\s*LISTEN\s(.*)$/.exec(line);
      if (listenOnly) { appendRun(plain(listenOnly[1]), 'LISTEN', listenOnly[3], '', false, listenOnly[2] ?? null); continue; }
      // A note-introduced or quoted run: **NAME** — *note* (or a bold prose
      // line), then **LOOK…** / > **LOOK** runs within a few lines.
      const intro = /^\*\*([A-Z][^*]+?)\*\*\s*(?:—\s*\*[^*]|is rewritten)/.exec(line);
      if (intro) {
        for (const row of lines.slice(at + 1, at + 6)) {
          const said = /^>?\s*\*\*(LOOK|LISTEN)((?: Acts? [^*]+)?)\*\*(.*)$/.exec(row.trim());
          if (said && /\d+\s+"/.test(said[3])) appendRun(plain(intro[1]), said[1], said[3], said[2]);
        }
        continue;
      }
      // An override: > **NAME** · VERB[, *qualifier*] — "line".
      const override = /^>\s*\*\*(.+?)\*\*\s*·\s*(.+?)\s+—\s+"(.+)"/.exec(line);
      if (override) {
        // A qualified override (", *after B3*") is its own entry, keyed with
        // its condition, so "PICK UP, again" does not overwrite "PICK UP".
        const qualifier = /,?\s*\*(.+?)\*\s*$/.exec(override[2]);
        const verb = override[2].replace(/,?\s*\*.*$/, '').trim().replace(/ /g, '_')
          + (qualifier ? ` (${plain(qualifier[1])})` : '');
        for (const name of override[1].split(/\*\*\s+or\s+\*\*/)) {
          pendingOverrides.push({ name: plain(name), verb, line: override[3] });
        }
      }
    }
  }

  const unplaced = {};
  /* doc 49's wrong verbs ------------------------------------------------------ */
  const retire = declarations.retire.filter((one) => one.room === room).map((one) => one.name);
  const moved = declarations.move.filter((one) => one.room === room);
  const wrongBodies = [];
  if (sources.wrongVerbs) wrongBodies.push(section(sources.wrongVerbs).body);
  for (const one of moved) {
    const from = section(one.from).body;
    wrongBodies.push(from.split('\n').filter((line) => line.startsWith(`**${one.name}**`)).join('\n'));
  }
  for (const body of wrongBodies) {
    for (const found of body.matchAll(/^\*\*(.+?)\*\*\s*·\s*([A-Z_ ]+?)\s*—\s*"(.+)"\s*$/gm)) {
      const name = plain(found[1]);
      if (retire.includes(name)) continue;
      if (declarations.move.some((one) => one.name === name && one.room !== room)) continue;
      pendingOverrides.push({ name, verb: found[2].trim(), line: found[3] });
    }
  }

  // AN OVERRIDE FINDS ITS SUBJECT by declared name, then by being the start
  // of exactly one subject's name (doc 26's "THE COAT" is THE COAT ON THE
  // DOOR). One that finds none is a character's, an exit's, or another
  // room's object, and is kept apart rather than made into a subject.
  for (const one of pendingOverrides) {
    const key = named(one.name);
    const near = order.filter((name) => name.startsWith(`${key} `));
    const target = subjects.get(key) ?? (near.length === 1 ? subjects.get(near[0]) : null);
    if (target) target.overrides[one.verb] = one.line;
    else (unplaced[one.name] ??= {})[one.verb] = one.line;
  }

  /* errata 68 H's drops ------------------------------------------------------- */
  for (const drop of declarations.drop.filter((one) => one.room === room)) {
    const at = subjects.get(named(drop.name));
    if (!at) { errors.push(`room ${room}: a drop names "${drop.name}", which is no subject`); continue; }
    const key = drop.verb === 'LOOK' ? 'LOOK_AT' : 'LISTEN_TO';
    const before = at[key].length;
    at[key] = at[key].filter((line) => !(line.src === drop.src && (drop.n === null || line.n === drop.n)));
    if (at[key].length === before) errors.push(`room ${room}: the drop of ${drop.name} ${drop.verb} from ${drop.src}${drop.n ? ` #${drop.n}` : ''} removed nothing`);
  }

  /* the guarantee ------------------------------------------------------------- */
  const out = [];
  for (const key of order) {
    const at = subjects.get(key);
    const look = at.LOOK_AT.map((line) => line.text);
    const listen = at.LISTEN_TO.map((line) => line.text);
    const acts = [...at.acts.entries()].map(([act, lines]) => ({ act, ...lines }));
    const onlyActs = look.length === 0 && listen.length === 0 && acts.length > 0;
    const actsShort = acts.some((one) => one.LOOK_AT.length && one.LOOK_AT.length < 3
      || one.LISTEN_TO.length && one.LISTEN_TO.length < 3);
    if (onlyActs ? actsShort : (look.length < 3 || listen.length < 3)) {
      errors.push(`room ${room}: ${key} has ${look.length} LOOK and ${listen.length} LISTEN after the merge`);
    }
    out.push({
      name: key,
      ...(at.aliases.length ? { aliases: at.aliases } : {}),
      LOOK_AT: look,
      LISTEN_TO: listen,
      ...(acts.length ? { acts } : {}),
      ...(Object.keys(at.overrides).length ? { overrides: at.overrides } : {}),
    });
  }
  return {
    errors,
    notes,
    data: {
      room,
      name: plain(sources.name),
      note: 'EXTRACTED by tools/extract-examine.mjs from the documents its sources name -- '
        + 'errata 67\'s merge, in doc 05\'s, the batch\'s, then the repeats\' order, less errata '
        + '68 H\'s drops. Do not edit: change the documents and re-run.',
      sources: [examine.primary, ...(examine.merged ?? []), ...(examine.completions ?? []),
        ...(examine.actVariants && examine.actVariants !== examine.primary ? [examine.actVariants] : []),
        ...(sources.wrongVerbs ? [sources.wrongVerbs] : [])],
      subjects: out,
      ...(Object.keys(unplaced).length ? { exitsAndUnplaced: unplaced } : {}),
    },
  };
}

/**
 * Rooms 32 and 33, the two doc 05 calls "Special case". Room 32 has nothing
 * to examine. Room 33's rock LOOK is a ladder and its LISTEN is pitch, with
 * one prose line at the void.
 */
function special(room, sources, primary, completions) {
  const data = { room, name: plain(sources.name), special: sources.examine.special.why,
    note: 'EXTRACTED by tools/extract-examine.mjs. A doc 05 special case (errata 70).',
    sources: [sources.examine.primary, ...(sources.examine.completions ?? [])], subjects: [] };
  if (room === 33) {
    const ladder = [];
    const lines = primary.body.split('\n');
    const start = lines.findIndex((line) => /^\*\*EVERY ROCK SURFACE — LOOK:\*\*/.test(line.trim()));
    for (const line of lines.slice(start + 1)) {
      const said = /^>\s*"([^"]+)"\s*$/.exec(line.trim());
      if (said) ladder.push(said[1]); else if (line.trim() && !line.trim().startsWith('>')) break;
    }
    for (const one of completions) {
      const found = /^\*\*EVERY ROCK SURFACE\*\*\s*—\s*LOOK\s(.*)$/m.exec(one.body);
      if (found) ladder.push(...run(found[1]).map((line) => line.text));
    }
    const voidLine = /The only prose line[\s\S]*?>\s*\*\*LISTEN:\*\*\s*"([^"]+)"/.exec(primary.body)?.[1] ?? null;
    data.subjects.push({ name: 'EVERY ROCK SURFACE', aliases: ['THE WALLS'], LOOK_AT: ladder,
      LOOK_AT_repeatsLast: true, LISTEN_TO: [], LISTEN_TO_is: 'R33-TAP (pitch, no prose)' });
    data.subjects.push({ name: 'THE VOID', LISTEN_TO: [voidLine], LISTEN_TO_is: 'R33-VOID, once' });
    const errors = [];
    if (ladder.length !== 8) errors.push(`room 33: the LOOK ladder has ${ladder.length} rungs, not 8`);
    if (!voidLine) errors.push('room 33: the void line was not found in doc 05');
    return { errors, notes: [], data };
  }
  return { errors: [], notes: [], data };
}

/* ------------------------------------------------------------ declarations */

function declarations() {
  const body = section(DECLARATIONS).body;
  const out = { drop: [], retire: [], move: [] };
  for (const found of body.matchAll(/^- \*\*Drop\*\* · Room (\d+) · \*\*(.+?)\*\* · (LOOK|LISTEN) · (\S+?)(?: · (\d+))?\s*$/gm)) {
    out.drop.push({ room: Number(found[1]), name: plain(found[2]), verb: found[3], src: found[4], n: found[5] ? Number(found[5]) : null });
  }
  for (const found of body.matchAll(/^- \*\*Retire\*\* · Room (\d+) · \*\*(.+?)\*\*/gm)) {
    out.retire.push({ room: Number(found[1]), name: plain(found[2]) });
  }
  for (const found of body.matchAll(/^- \*\*Move\*\* · Room (\d+) · \*\*(.+?)\*\* · from (.+?)\s*$/gm)) {
    out.move.push({ room: Number(found[1]), name: plain(found[2]), from: found[3] });
  }
  return out;
}

/* ------------------------------------------------------------------- main */

const declared = declarations();
const stale = [];
const failures = [];
let written = 0;
for (const room of ROOMS) {
  if (!existsSync(resolve(ROOT, `proofs/readiness/room-${String(room).padStart(2, '0')}.sources.json`))) continue;
  const { errors, notes, data } = extract(room, declared);
  failures.push(...errors);
  for (const note of notes) process.stderr.write(`  ${note}\n`);
  const path = `content/examine/room-${String(room).padStart(2, '0')}.json`;
  const wanted = `${JSON.stringify(data, null, 2)}\n`;
  if (CHECKING) {
    const found = existsSync(resolve(ROOT, path)) ? read(path) : null;
    if (found !== wanted) stale.push(path);
  } else {
    mkdirSync(dirname(resolve(ROOT, path)), { recursive: true });
    writeFileSync(resolve(ROOT, path), wanted);
    written += 1;
  }
}
for (const failure of failures) process.stdout.write(`fail: ${failure}\n`);
for (const path of stale) process.stdout.write(`stale: ${path}\n`);
if (!CHECKING) process.stdout.write(`${written} room file(s) written\n`);
else process.stdout.write(`${ROOMS.length} room(s) checked, ${stale.length} stale\n`);
process.exit(failures.length || stale.length ? 1 : 0);
