import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { readJson, Report, ROOT, runCheck } from './lib/content.mjs';
import { resolveIssueRef } from './lib/issueref.mjs';
import { puzzleContent } from './lib/puzzle-content.mjs';

/**
 * IS THIS ROOM BUILDABLE WITHOUT INVENTING ANYTHING? Tyler's ruling 6.
 *
 * CLAUDE.md used to say every line already exists. It does not, and the
 * overstatement was the dangerous part: a guarantee turns a genuine gap into
 * something that looks like a search failure -- so you look harder, and then
 * you reconstruct, and reconstruction of a comedy script is invention wearing
 * a plausible face. The corrected rule is that SOME rooms are fully written
 * and some are not, and the difference is established per room before a line
 * of it is built.
 *
 * BUILDABLE WITHOUT INVENTION = NO IS A HARD STOP. Not a warning, not a
 * caveat in a report somebody skims.
 *
 * WHAT THIS DOES NOT DO, and both halves matter:
 *
 *  - It does not copy the writing. Every answer cites a document path and an
 *    exact heading, or a qualified issue reference. A readiness record holding
 *    the prose would be a second copy of the script drifting from the first,
 *    which is the failure the extraction rule exists to prevent.
 *  - It does not judge whether the writing is GOOD. It counts subjects and
 *    variants and asks whether a section exists. Nothing here has an opinion.
 *
 * IT ANSWERS NO WHEN IT CANNOT ANSWER. Every test that cannot be evaluated
 * mechanically reports NO rather than assuming. The two errors are not
 * symmetrical: a false NO costs a conversation, and a false YES costs a room
 * built on invented comedy that passes every other check in the project,
 * because the line exists, reads well, and is simply not what was written.
 *
 * GEOMETRY IS REPORTED SEPARATELY AND NEVER MIXED IN. A missing annotation is
 * not creative incompleteness, and averaging the two would hide both. Room 5's
 * writing can be finished while its walk boxes do not exist, and the correct
 * report says exactly that.
 */

const OUT = (room) => `proofs/readiness/room-${String(room).padStart(2, '0')}.json`;
const SOURCES = (room) => `proofs/readiness/room-${String(room).padStart(2, '0')}.sources.json`;

/* ------------------------------------------------------ reading documents */

/** The body of one heading in a markdown file, up to the next heading of <= depth. */
function section(reference) {
  const found = resolveIssueRef(reference);
  if (!found.ok) return { ok: false, why: found.why };
  const lines = readFileSync(resolve(ROOT, found.path), 'utf8').split('\n');
  const start = found.line - 1;
  const depth = /^(#{1,6})/.exec(lines[start])[1].length;
  let end = lines.length;
  for (let at = start + 1; at < lines.length; at += 1) {
    const next = /^(#{1,6})\s/.exec(lines[at]);
    if (next && next[1].length <= depth) { end = at; break; }
  }
  return { ok: true, path: found.path, heading: found.heading, line: found.line,
    body: lines.slice(start + 1, end).join('\n') };
}

/**
 * Examine subjects in doc 05's shape.
 *
 * Doc 05 writes a subject as `**THE THING**` on its own line followed by
 * `> **LOOK:**` and `> **LISTEN:**` quote lines, and lists the ones it has not
 * written yet on a single line ending `*(working script)*`.
 */
function doc05Subjects(body) {
  const written = [];
  const pending = [];
  const lines = body.split('\n');
  for (let at = 0; at < lines.length; at += 1) {
    const line = lines[at].trim();
    const working = /\*\(working script\)\*\s*$/.test(line);
    if (working) {
      for (const name of line.replace(/—.*$/, '').split('·')) {
        const clean = name.replace(/\*/g, '').trim();
        if (clean) pending.push(clean);
      }
      continue;
    }
    const heading = /^\*\*(.+?)\*\*(.*)$/.exec(line);
    if (!heading) continue;
    const name = heading[1].trim();
    const rest = lines.slice(at + 1, at + 6).join('\n');
    const look = /^>\s*\*\*LOOK:?\*\*/m.test(rest);
    const listen = /^>\s*\*\*LISTEN:?\*\*/m.test(rest);
    if (!look && !listen) continue;
    const act = /\*\(act:\s*"?([^)"]+)"?\)\*/.exec(heading[2] ?? '');
    written.push({ name, look, listen, act: act ? act[1] : null });
  }
  return { written, pending };
}

/**
 * Subjects in doc 25's shape: `### THE THING` then `**LOOK** 1 "..." · 2 ...`.
 *
 * Counts variants without reading them. `1 "` through `3 "` is what a repeat
 * selection needs; the quotation marks are never opened.
 */
function doc25Subjects(body) {
  const out = [];
  const blocks = body.split(/^###\s+/m).slice(1);
  for (const block of blocks) {
    const name = block.split('\n')[0].trim();
    // `**LOOK**`, or `**LOOK Act I**` / `**LOOK Acts I–II**` (doc 26's Room 19):
    // an act-labelled run is still that act's three variants.
    const look = /^\*\*LOOK(?: Acts? [^*]+)?\*\*(.*)$/m.exec(block);
    const listen = /^\*\*LISTEN(?: Acts? [^*]+)?\*\*(.*)$/m.exec(block);
    const variants = (line) => (line ? (line[1].match(/(?:^|·)\s*\d+\s+"/g) ?? []).length : 0);
    out.push({ name, lookVariants: variants(look), listenVariants: variants(listen) });
  }
  // A SUBJECT REWRITTEN IN PROSE, its runs quoted. Doc 19 section 2 rewrites
  // Room 7's THE TWO LINES as "**THE TWO LINES is rewritten ...:**" followed by
  // "> **LOOK** 1 ... · 2 ... · 3 ..." -- three variants each, complete, and
  // read as missing because neither form above matched a quoted run. The name
  // is the capitalised run that opens the bold line.
  {
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const look = /^>\s*\*\*LOOK\*\*(.*)$/.exec(lines[i].trim());
      if (!look) continue;
      let name = null;
      for (let j = i - 1; j >= 0 && name === null; j -= 1) {
        const bold = /^\*\*([A-Z][A-Z0-9'’ ,.&-]*[A-Z0-9])\b/.exec(lines[j].trim());
        if (bold) name = bold[1].replace(/\s+(IS|ARE)$/, '').trim();
      }
      if (!name) continue;
      const listenLine = lines.slice(i + 1, i + 3).map((l) => /^>\s*\*\*LISTEN\*\*(.*)$/.exec(l.trim())).find(Boolean);
      const count = (text) => (text.match(/(?:^|·)\s*\d+\s+"/g) ?? []).length;
      out.push({ name, lookVariants: count(look[1]), listenVariants: listenLine ? count(listenLine[1]) : 0 });
    }
  }
  // A SUBJECT INTRODUCED BY A NOTE: `**HIS MOTHER'S LETTERS** — *Correction…*`
  // and then, a line or two later, unquoted numbered `**LOOK…**` and
  // `**LISTEN…**` runs (doc 26's Room 19). The note is not a variant.
  {
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const intro = /^\*\*([A-Z][^*]+?)\*\*\s*—\s*\*[^*]/.exec(lines[i].trim());
      if (!intro) continue;
      const window = lines.slice(i + 1, i + 6).map((l) => l.trim());
      const lookLine = window.map((l) => /^\*\*LOOK(?: Acts? [^*]+)?\*\*(.*)$/.exec(l)).find(Boolean);
      const listenLine = window.map((l) => /^\*\*LISTEN(?: Acts? [^*]+)?\*\*(.*)$/.exec(l)).find(Boolean);
      if (!lookLine && !listenLine) continue;
      const count = (text) => (text.match(/(?:^|·)\s*\d+\s+"/g) ?? []).length;
      out.push({ name: intro[1].trim(), lookVariants: lookLine ? count(lookLine[1]) : 0,
        listenVariants: listenLine ? count(listenLine[1]) : 0 });
    }
  }
  // AN EXIT, in doc 25/26's shape: `**THE DOOR → Room 18**` and then
  // unquoted `**LOOK** 1 "..."` and `**LISTEN** 1 "..."` lines. An exit is a
  // hotspot, and doc 05 sometimes names the same door as a subject.
  {
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const exit = /^\*\*(.+?)\s+→\s+Room\s+\d+\*\*\s*$/.exec(lines[i].trim());
      if (!exit) continue;
      const lookLine = /^\*\*LOOK\*\*(.*)$/.exec((lines[i + 1] ?? '').trim());
      const listenLine = /^\*\*LISTEN\*\*(.*)$/.exec((lines[i + 2] ?? '').trim());
      if (!lookLine && !listenLine) continue;
      const count = (text) => (text.match(/(?:^|·)\s*\d+\s+"/g) ?? []).length;
      out.push({ name: exit[1].trim(), lookVariants: lookLine ? count(lookLine[1]) : 0,
        listenVariants: listenLine ? count(listenLine[1]) : 0, exit: true });
    }
  }
  // Repeat variants for doc 05's own subjects are written as a bold run
  // rather than as `###` blocks.
  for (const line of body.split('\n')) {
    const found = /^\*\*(.+?)\*\*\s*(?:\*\(act:[^)]*\)\*)?\s*—\s*LOOK\s(.*)$/.exec(line.trim());
    if (!found) continue;
    const halves = found[2].split('|');
    const count = (text) => (text.match(/(?:^|·)\s*\d+\s+"/g) ?? []).length;
    // The LISTEN half arrives as " LISTEN 2 \"...\" · 3 \"...\"", so its FIRST
    // variant number is preceded by the word rather than by a separator. Left
    // alone it counted one variant short on every subject in the room and
    // reported four false gaps -- a checker inventing incompleteness, which is
    // the mirror of the failure this whole gate exists to prevent.
    const listenHalf = halves[1] ? halves[1].replace(/^\s*LISTEN\s*/, '') : null;
    out.push({
      name: found[1].trim(),
      // A CONTINUATION SUPPLIES EXACTLY THE VARIANTS IT LISTS. Variant 1 lives
      // in doc 05 or in a batch doc and is counted from there -- since the
      // merge ruling (errata 67) both can supply one, so "+1 for the line
      // elsewhere" would be a guess about how many lines elsewhere there are.
      lookVariants: count(halves[0]),
      listenVariants: listenHalf === null ? 0 : count(listenHalf),
      continuation: true,
    });
  }
  return out;
}

/**
 * ERRATA 67: THE TWO EXAMINE PASSES ARE MERGED. A completion section may say
 * that two names are one object -- `**THE TEETH** ≡ **THE JAR OF TEETH**`, the
 * first name the one the room keeps -- and their variants are counted together.
 * Declared, never guessed: two subjects with different names are two objects
 * unless a document says otherwise.
 */
function aliases(body) {
  const out = new Map();
  for (const line of body.split('\n')) {
    const found = /^\*\*(.+?)\*\*\s*≡\s*\*\*(.+?)\*\*/.exec(line.trim());
    if (found) out.set(found[2].trim(), found[1].trim());
  }
  return out;
}

/**
 * The batch docs (08, 09, 10) in their own shape: doc 05's quote lines for the
 * subjects they script in full, and a line of bold names joined by `·` for the
 * ones they only sketch. A sketched subject sometimes carries one LOOK in a
 * parenthesis under it -- `*(The road — **LOOK:** "...")*` -- which is counted.
 */
function batchSubjects(body) {
  const { written } = doc05Subjects(body);
  const sketched = [];
  const lines = body.split('\n');
  for (let at = 0; at < lines.length; at += 1) {
    const line = lines[at].trim();
    if (!/^\*\*[^*]+\*\*(\s*·\s*\*\*[^*]+\*\*)+\s*$/.test(line)) continue;
    const names = [...line.matchAll(/\*\*([^*]+)\*\*/g)].map((m) => m[1].trim());
    // `*(The road east — **LOOK:** "..." **LISTEN:** "...")*`, or either verb
    // alone (Room 18's stairs carry only a LISTEN).
    // One parenthesis per sketched subject that has a line, each on its own
    // line under the names (doc 08's Room 27 carries two).
    const notes = [];
    for (let k = at + 1; k < lines.length; k += 1) {
      const next = lines[k].trim();
      const note = /^>?\s*\*\((.+?)\s+—\s+\*\*(LOOK|LISTEN):?\*\*/.exec(next);
      if (!note) break;
      notes.push({ noted: note[1].trim().toUpperCase(),
        look: /\*\*LOOK:?\*\*/.test(next), listen: /\*\*LISTEN:?\*\*/.test(next) });
    }
    for (const name of names) {
      // "The board" names THE BOARD OF NAMES: a parenthesis may shorten.
      // And may change the article: "(The boot" is doc 08's A BOOT.
      const bare = (text) => text.replace(/^(THE|A|AN)\s+/, '');
      // Or name it by its last word: "(Cloth" is THE BOLTS OF CLOTH.
      const mine = notes.find((one) => bare(name) === bare(one.noted)
        || bare(name).startsWith(`${bare(one.noted)} `)
        || bare(name).endsWith(` ${bare(one.noted)}`));
      sketched.push({ name, look: Boolean(mine?.look), listen: Boolean(mine?.listen) });
    }
  }
  return [...written, ...sketched];
}

/* ----------------------------------------------------------- the questions */

function ask(room, sources, note) {
  const answers = [];
  const add = (id, question, answer, evidence, why) =>
    answers.push({ id, question, answer, evidence, why });

  /* 1 · LOOK / LISTEN ----------------------------------------------------- */
  const primary = section(sources.examine?.primary);
  let subjects = [];
  let declaredCount = null;
  if (!primary.ok) {
    add('look-listen', 'LOOK/LISTEN complete?', 'NO', [sources.examine?.primary ?? '(none declared)'],
      `the examine section could not be resolved: ${primary.why}`);
  } else {
    const parsed = doc05Subjects(primary.body);
    const counted = /^\*(\w+)\s+hotspots?\./mi.exec(primary.body.trim());
    const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
      nine: 9, ten: 10, eleven: 11, twelve: 12 };
    declaredCount = counted ? WORDS[counted[1].toLowerCase()] ?? null : null;

    const completions = [];
    const alias = new Map();
    for (const reference of sources.examine?.completions ?? []) {
      const found = section(reference);
      if (!found.ok) continue;
      completions.push(...doc25Subjects(found.body));
      for (const [from, to] of aliases(found.body)) alias.set(from, to);
    }
    const named = (name) => alias.get(name) ?? name;
    const byName = new Map();
    const slot = (name) => {
      const key = named(name);
      if (!byName.has(key)) byName.set(key, { name: key, look: 0, listen: 0 });
      return byName.get(key);
    };
    for (const one of parsed.written) {
      const at = slot(one.name);
      at.look += one.look ? 1 : 0;
      at.listen += one.listen ? 1 : 0;
    }
    // A SUBJECT ONLY THE ACT BLOCK DECLARES (Room 5's queue bench) has its
    // first line there, once. The continuation that follows it no longer adds
    // one for a line elsewhere, so the line elsewhere is counted here.
    {
      const reference = sources.examine?.actVariants;
      const block = reference && reference !== sources.examine?.primary ? section(reference) : null;
      const seen = new Set(parsed.written.map((one) => one.name));
      if (block?.ok) {
        for (const one of doc05Subjects(block.body).written) {
          if (!one.act || seen.has(one.name)) continue;
          seen.add(one.name);
          const at = slot(one.name);
          at.look += one.look ? 1 : 0;
          at.listen += one.listen ? 1 : 0;
        }
      }
    }
    // THE BATCH PASS, MERGED (errata 67). Each subject it writes adds its own
    // first line; a subject both passes wrote is one object with two.
    for (const reference of sources.examine?.merged ?? []) {
      const found = section(reference);
      if (!found.ok) continue;
      // A BATCH SUBJECT A RULING MOVED ELSEWHERE (errata 66 D: the second
      // ledger is Room 5's) is not this room's. The room must cite the
      // ruling, and the ruling must resolve.
      const retired = sources.examine?.retired;
      const retiredNames = retired && section(retired.ruling).ok ? retired.names : [];
      for (const one of batchSubjects(found.body)) {
        if (retiredNames.some((name) => one.name.startsWith(name))) continue;
        const at = slot(one.name);
        at.look += one.look ? 1 : 0;
        at.listen += one.listen ? 1 : 0;
      }
    }
    for (const one of completions) {
      const at = slot(one.name);
      if (one.continuation) {
        at.look += one.lookVariants;
        at.listen += one.listenVariants;
      } else {
        at.look = Math.max(at.look, one.lookVariants);
        at.listen = Math.max(at.listen, one.listenVariants);
      }
    }
    for (const name of parsed.pending) slot(name);
    subjects = [...byName.values()];

    const withoutBoth = subjects.filter((one) => one.look < 1 || one.listen < 1);
    // AN INDEPENDENT CROSS-CHECK, not a restatement: doc 05 states its own
    // hotspot count in prose, and a parser that found a different number has
    // misread the document rather than found a gap.
    //
    // THE PROSE COUNT IS THE EXAMINE LAYER'S, NOT THE ROOM'S. A subject doc 05
    // authors only in its act-variant block (Room 5's queue bench, `*(act:
    // "2-4")*`, 1200 lines below "Eight hotspots.") is a hotspot the room has
    // and the count never included -- so once its repeat variants arrived in
    // doc 25 this check found nine, compared them with eight, and called a
    // completed layer a misreading. Subjects the act block alone declares are
    // set beside the count, not against it.
    const actReferenceEarly = sources.examine?.actVariants ?? sources.examine?.primary;
    const actSectionEarly = actReferenceEarly === sources.examine?.primary
      ? primary : section(actReferenceEarly);
    const primaryNames = new Set(parsed.written.map((one) => one.name).concat(parsed.pending));
    const actOnlyNames = actSectionEarly.ok
      ? doc05Subjects(actSectionEarly.body).written
        .filter((one) => one.act && !primaryNames.has(one.name)).map((one) => one.name)
      : [];
    // DOC 05'S OWN SUBJECTS against doc 05's own count. The merged room is
    // larger by design (errata 67), and comparing the union with one pass's
    // prose count would call every merged room a misreading.
    const counted05 = [...primaryNames].filter((name) => !actOnlyNames.includes(name)).length;
    const countAgrees = declaredCount === null || declaredCount === counted05;
    // A SPECIAL-CASE ROOM, by doc 05's own words. Room 32 has no hotspots and
    // Room 33's LISTEN answers in pitch, not prose; three-and-three cannot be
    // asked of either. Only a room whose own doc 05 section says "Special
    // case", and whose sources point at the writing that completes it, is
    // answered this way -- and it is answered with that citation, not a pass.
    const special = sources.examine?.special;
    const specialSource = special ? section(special.source) : null;
    if (special && /\*\*\*Special case\./.test(primary.body) && specialSource?.ok) {
      for (const [id, question] of [['look-listen', 'LOOK/LISTEN complete?'],
        ['repeat-variants', 'Repeat-selection variants complete?']]) {
        add(id, question, 'YES', [sources.examine.primary, special.source],
          `special case (doc 05): ${special.why}`);
      }
    } else {
    add('look-listen', 'LOOK/LISTEN complete?',
      withoutBoth.length === 0 && countAgrees ? 'YES' : 'NO',
      [sources.examine.primary, ...(sources.examine.completions ?? [])],
      withoutBoth.length
        ? `${withoutBoth.length} subject(s) without both: ${withoutBoth.map((s) => s.name).join(', ')}`
        : countAgrees
          ? `${subjects.length} subject(s), each with a LOOK and a LISTEN`
          : `the document states ${declaredCount} hotspots and ${counted05} were parsed -- `
            + 'this check has misread it, which is not the same as a gap');

    /* 2 · repeat-selection variants -------------------------------------- */
    const thin = subjects.filter((one) => one.look < 3 || one.listen < 3);
    add('repeat-variants', 'Repeat-selection variants complete?',
      thin.length === 0 ? 'YES' : 'NO',
      [sources.examine.primary, ...(sources.examine.completions ?? [])],
      thin.length === 0
        ? `all ${subjects.length} subject(s) carry three LOOK and three LISTEN variants`
        : `${thin.length} subject(s) short of three: `
          + thin.map((s) => `${s.name} (LOOK ${s.look}, LISTEN ${s.listen})`).join('; '));
    }

    /* 3 · act / state variants -------------------------------------------- */
    //
    // PARSED FROM ITS OWN SECTION. Doc 05 keeps the act-gated lines in a
    // separate block 1200 lines below the room's examine layer, under an
    // identical heading -- which is why references here carry a #N occurrence.
    // Reading them off the primary section found none and reported the layer
    // unwritten, when it is written and merely somewhere else.
    const actReference = sources.examine?.actVariants ?? sources.examine?.primary;
    const actSection = actReference === sources.examine?.primary
      ? primary : section(actReference);
    const acts = actSection.ok
      ? doc05Subjects(actSection.body).written.filter((one) => one.act) : [];
    // A DECLARED NONE, CITED. Doc 05 Part Two-B's doctrine is that a hotspot
    // re-answers only "when the town's knowledge changes what Thad sees -- not
    // every hotspot, every act, which would be bloat", and Part Two-B is the
    // whole act-variant pass. A room that pass left out has none by that
    // doctrine. The declaration must name the doctrine, the doctrine must
    // resolve, and the pass must not name the room -- otherwise this is NO.
    const none = sources.examine?.actVariantsNone;
    const doctrine = none ? section(none.doctrine) : null;
    const passNamesRoom = doctrine?.ok
      && new RegExp(`^## ROOM ${room}\\b`, 'm').test(doctrine.body);
    // ACT-LABELLED RUNS, in the batch docs' shape (`**LOOK Act IV:**`,
    // `**LOOK Acts I–II**`): doc 08 writes Room 19's act variants that way,
    // not as Part Two-B's `*(act: N)*`. Counted where a room points at them.
    const labelled = (sources.examine?.actVariantsIn ?? []).flatMap((reference) => {
      const found = section(reference);
      return found.ok ? found.body.match(/^>?\s*\*\*(?:LOOK|LISTEN) Acts? [^*]+\*\*/gm) ?? [] : [];
    });
    if (acts.length === 0 && labelled.length > 0) {
      add('act-variants', 'Act/state variants complete?', 'YES', sources.examine.actVariantsIn,
        `${labelled.length} act-labelled run(s) authored in the batch shape`);
    } else if (acts.length === 0 && none && doctrine?.ok && !passNamesRoom) {
      add('act-variants', 'Act/state variants complete?', 'YES', [none.doctrine],
        `none, by doctrine: ${none.why}`);
    } else add('act-variants', 'Act/state variants complete?',
      acts.length > 0 ? 'YES' : 'NO',
      [sources.examine.actVariants ?? sources.examine.primary],
      acts.length > 0
        ? `${acts.length} act-gated subject(s) authored: `
          + acts.map((one) => `${one.name} (act ${one.act})`).join(', ')
        : 'no act-gated variant is authored for this room. Errata 60 makes ACT a number and '
          + 'the compiler checks act coverage; a room with none has either genuinely none or '
          + 'an unwritten layer, and nothing here can tell those apart');
  }

  /* 4 · wrong-verb layer -------------------------------------------------- */
  const wrong = section(sources.wrongVerbs);
  const wrongLines = wrong.ok
    ? (wrong.body.match(/^\*\*.+?\*\*\s*·\s*[A-Z_ ]+\s*—/gm) ?? []).length : 0;
  add('wrong-verbs', 'Wrong-verb layer complete?',
    wrong.ok && wrongLines > 0 ? 'YES' : 'NO',
    [sources.wrongVerbs ?? '(none declared)'],
    wrong.ok
      ? `${wrongLines} authored refusal(s)`
      : `not resolvable: ${wrong.why}`);

  /* 5 · dialogue used by this room ---------------------------------------- */
  const trees = sources.dialogue?.trees ?? [];
  const unresolved = trees.filter((reference) => !section(reference).ok);
  // NOBODY SPEAKS HERE, DECLARED AND CITED. A room no character is staged in
  // has no dialogue to be incomplete -- but only a room that SAYS so, with the
  // document that places nobody there. Silence is never the default.
  const silent = trees.length === 0 && sources.dialogue?.none && section(sources.dialogue.none.source).ok;
  if (silent) {
    add('dialogue', 'Dialogue used by this room complete?', 'YES', [sources.dialogue.none.source],
      `no character speaks in this room: ${sources.dialogue.none.why}`);
  } else add('dialogue', 'Dialogue used by this room complete?',
    trees.length > 0 && unresolved.length === 0 ? 'YES' : 'NO',
    trees,
    trees.length === 0
      ? 'no dialogue declared for this room'
      : unresolved.length === 0
        ? `${trees.length} node(s) resolve for ${(sources.dialogue.characters ?? []).join(', ')}`
        : `${unresolved.length} declared node(s) do not resolve: ${unresolved.join('; ')}`);

  /* 6 · puzzle requirements ----------------------------------------------- */
  // ONE SECTION OR SEVERAL. Doc 02 is cut by act and trial, and a room that
  // hosts an Act I puzzle and an Act III one has its puzzles in two sections.
  const puzzleRefs = [sources.puzzles?.source ?? null].flat();
  const puzzleParts = puzzleRefs.map((reference) => section(reference));
  const broken = puzzleParts.find((part) => !part.ok);
  const puzzleSource = broken ?? { ok: true, body: puzzleParts.map((part) => part.body).join('\n') };
  const ids = sources.puzzles?.ids ?? [];
  const absent = puzzleSource.ok
    ? ids.filter((id) => !new RegExp(`\\*\\*${id}\\*\\*`).test(puzzleSource.body)) : ids;
  // NO PUZZLE IS SITED HERE, declared and cited, as for dialogue: the source
  // must resolve and must not itself site a puzzle id in the declaration.
  const noPuzzle = ids.length === 0 && sources.puzzles?.none && section(sources.puzzles.none.source).ok;
  if (noPuzzle) {
    for (const [id, question] of [['puzzles', 'Puzzle requirements complete?'],
      ['items', 'Required items declared?'], ['flags', 'Required flags/state declared?']]) {
      add(id, question, 'YES', [sources.puzzles.none.source],
        `no puzzle is sited in this room: ${sources.puzzles.none.why}`);
    }
  } else {
  // ERRATA 74: NAMED IS NOT WRITTEN. Each puzzle sited here must also pass
  // its content audit (proofs/readiness/puzzles.json, read by
  // tools/lib/puzzle-content.mjs): every node, item, duel pair and scene it
  // needs, present in a shape a builder can use. Room 4 answered YES on names
  // alone and stopped its builder on sixty-nine missing lines (Q146).
  const content = ids.map((id) => ({ id, ...puzzleContent(id) }));
  const unwritten = content.filter((one) => !one.ok);
  add('puzzles', 'Puzzle requirements complete?',
    puzzleSource.ok && ids.length > 0 && absent.length === 0 && unwritten.length === 0 ? 'YES' : 'NO',
    [...(puzzleRefs.filter(Boolean).length ? puzzleRefs.filter(Boolean) : ['(none declared)']), 'proofs/readiness/puzzles.json'],
    !puzzleSource.ok ? `not resolvable: ${puzzleSource.why}`
      : ids.length === 0 ? 'no puzzles declared for this room'
        : absent.length > 0 ? `declared but not found in the section: ${absent.join(', ')}`
          : unwritten.length > 0 ? `content not all written -- ${unwritten.map((one) => `${one.id}: ${one.why.join('; ')}`).join(' | ')}`
            : `${ids.join(', ')} are specified, and every piece of their content is written`);

  /* 7 · required items ----------------------------------------------------- */
  /* 8 · required flags / state -------------------------------------------- */
  //
  // BOTH ANSWERED FROM THE PUZZLE SECTION, and answered NO when it is silent.
  // Doc 02's table carries the item ledger and the topic flags in its own
  // rows; a room whose puzzle section names neither has not declared them,
  // whatever a reader might infer from the prose around it.
  const itemsNamed = puzzleSource.ok && /Document [AB]|Topic:|item/i.test(puzzleSource.body);
  add('items', 'Required items declared?', itemsNamed ? 'YES' : 'NO',
    (puzzleRefs.filter(Boolean).length ? puzzleRefs.filter(Boolean) : ['(none declared)']),
    itemsNamed ? 'the puzzle section names the documents and topics this room issues and needs'
      : 'the declared puzzle section names no item or topic');
  const flagsNamed = puzzleSource.ok && /Topic:|`T_[A-Z_]+`|T_[A-Z_]+/.test(puzzleSource.body);
  add('flags', 'Required flags/state declared?', flagsNamed ? 'YES' : 'NO',
    (puzzleRefs.filter(Boolean).length ? puzzleRefs.filter(Boolean) : ['(none declared)']),
    flagsNamed ? 'the puzzle section names the topic flags this room sets'
      : 'the declared puzzle section names no flag or topic');
  }

  /* 9 · beat / staging script --------------------------------------------- */
  if (sources.staging?.required === false) {
    add('staging', 'Beat/staging script complete OR genuinely not required?', 'YES',
      [sources.exits ?? sources.examine?.primary ?? '(none declared)'],
      `not required: ${sources.staging.why}`);
  } else {
    const staging = section(sources.staging?.source);
    add('staging', 'Beat/staging script complete OR genuinely not required?',
      staging.ok ? 'YES' : 'NO', [sources.staging?.source ?? '(none declared)'],
      staging.ok ? 'a staging script resolves' : `declared as required and ${staging.why}`);
  }

  /* 10 · character behaviour ---------------------------------------------- */
  //
  // Deliberately conservative. "Sufficiently authored" means the character has
  // dialogue AND the room's writing describes how they behave in it -- doc
  // 25's overrides are exactly that ("Not with her at the counter" is a
  // statement about where Winnie is and what she permits). A tool cannot
  // judge sufficiency, so it asks whether both sources exist and says which.
  const overrides = sources.exits ? section(sources.exits) : { ok: false, why: 'none declared' };
  const behaviour = trees.length > 0 && unresolved.length === 0 && overrides.ok
    && /##\s*Overrides/m.test(overrides.body);
  if (silent) {
    add('character-behaviour', 'Character behaviour sufficiently authored?', 'YES',
      [sources.dialogue.none.source], 'no character is present to behave');
  } else add('character-behaviour', 'Character behaviour sufficiently authored?',
    behaviour ? 'YES' : 'NO',
    [...(trees.slice(0, 2)), sources.exits ?? '(no room content section declared)'],
    behaviour
      ? `${(sources.dialogue.characters ?? []).join(', ')} has authored dialogue, and the room `
        + 'content section carries verb overrides that state where they are and what they permit'
      : 'either the dialogue does not resolve or the room content section has no Overrides '
        + 'block -- and a character present in a room with no authored refusals has behaviour '
        + 'that would have to be invented at the first wrong verb');

  /* 11 · unresolved canon decisions --------------------------------------- */
  //
  // FOUND, NOT DECLARED. This one deliberately does not read the sources file:
  // a room cannot exempt itself from an open question by not listing it. Doc
  // 36's headings and the build ledger's blockers are swept for the room.
  const open = [];
  const issues = readFileSync(resolve(ROOT, 'docs/36-issue-list.md'), 'utf8').split('\n');
  const roomWords = new RegExp(`ROOM ${room}\\b|Room ${room}\\b`);
  issues.forEach((line, index) => {
    const heading = /^#{1,6}\s+(.*?)\s*$/.exec(line);
    if (!heading) return;
    if (!roomWords.test(heading[1])) return;
    if (/\*\*(FIXED|CLOSED|RULED|CALLED)/i.test(heading[1])) return;
    open.push(`docs/36-issue-list.md::${heading[1]}`);
  });
  const ledger = readJson('content/build-ledger.json');
  const row = ledger.items.find((item) => item.id === sources.id);
  for (const blocker of row?.blockers ?? []) if (!open.includes(blocker)) open.push(blocker);
  add('open-canon', 'Unresolved canon decisions affecting this room?',
    open.length === 0 ? 'NO' : 'YES', open,
    open.length === 0
      ? 'no open issue in docs/36-issue-list.md names this room and the build ledger lists no '
        + 'blocker'
      : `${open.length} open item(s) name this room`);

  return { answers, subjects, declaredCount, openCanon: open };
}

/* ------------------------------------------------------ geometry, separately */

function geometry(room, sources) {
  const two = String(room).padStart(2, '0');
  const out = [];
  const annotation = `reference/room-${two}/annotation.json`;
  const hasAnnotation = existsSync(resolve(ROOT, annotation));
  out.push({ id: 'annotation', question: 'Room annotation exists?',
    answer: hasAnnotation ? 'YES' : 'NO', evidence: [annotation],
    why: hasAnnotation ? 'authored geometry is on disk'
      : 'no annotation, so there are no walk boxes, no scale curve, no entrance, no exit '
        + 'geometry, no clip planes and no occlusion proof points' });

  const manifest = readJson('content/manifest.json');
  const compiled = manifest.rooms
    .map((path) => ({ path, data: readJson(path) }))
    .find((entry) => entry.data.id && sources.roomFile === entry.path);
  const room5 = compiled?.data ?? null;
  out.push({ id: 'compiled', question: 'Room JSON in the manifest?',
    answer: room5 ? 'YES' : 'NO',
    evidence: [sources.roomFile ?? '(no room file declared)'],
    why: room5 ? `${sources.roomFile} is loaded by the engine` : 'the room is not in the manifest' });

  // THE PLATE. Errata 63: a fixed room ships at exactly 1920x864.
  const plate = sources.plate ?? null;
  let plateWhy = 'no shipping plate declared';
  let plateOk = false;
  if (plate && existsSync(resolve(ROOT, plate))) {
    const bytes = readFileSync(resolve(ROOT, plate));
    const width = bytes.readUInt32BE(16);
    const height = bytes.readUInt32BE(20);
    const colour = bytes[25];
    plateOk = width === 1920 && height === 864 && colour !== 3;
    plateWhy = `${plate} is ${width}x${height}, PNG colour type ${colour}`
      + (plateOk ? '' : colour === 3
        ? ' -- indexed, which no pixel check in this project can read'
        : ' -- errata 63 requires exactly 1920x864 for a fixed room');
  }
  out.push({ id: 'plate', question: 'Shipping plate at the canonical size?',
    answer: plateOk ? 'YES' : 'NO', evidence: [plate ?? '(none declared)'], why: plateWhy });

  return out;
}

/* -------------------------------------------------------------------- main */

export async function readiness(room) {
  const sourcesPath = SOURCES(room);
  if (!existsSync(resolve(ROOT, sourcesPath))) {
    return { room, error: `no source declaration at ${sourcesPath}` };
  }
  const sources = readJson(sourcesPath);
  const asked = ask(room, sources);
  const geo = geometry(room, sources);

  // Every answer must cite something that resolves.
  const citations = [];
  for (const answer of asked.answers) {
    for (const reference of answer.evidence) {
      if (!/\.md::/.test(reference)) continue;
      const found = resolveIssueRef(reference);
      if (!found.ok) citations.push(`${answer.id}: ${found.why}`);
    }
  }

  const blocking = asked.answers.filter((one) =>
    (one.id === 'open-canon' ? one.answer === 'YES' : one.answer === 'NO'));
  const buildable = blocking.length === 0 && citations.length === 0;

  /* ------------------------------------------------- the seven dimensions */
  //
  // REPORTED SEPARATELY BECAUSE THEY FAIL SEPARATELY, and a single verdict
  // averages them into something useless. Room 5 is the case that proves it:
  // every line of its writing exists, and it still cannot be built. A report
  // that said only "NO" would read as "the script is short", which is the one
  // thing that is not true -- and the fix for a short script is the thing
  // nobody may ever do.
  const by = (id) => asked.answers.find((one) => one.id === id);
  const all = (...ids) => ids.every((id) => by(id)?.answer === 'YES');
  const cite = (...ids) => [...new Set(ids.flatMap((id) => by(id)?.evidence ?? []))];

  let visual = { answer: 'NO', evidence: [], why: 'not evaluated' };
  try {
    const { baselineFor } = await import('./art/baseline.mjs');
    const found = baselineFor(sources.id);
    visual = {
      answer: found.ok ? 'YES' : 'NO',
      evidence: found.references.map((one) => `${one.slot} ${one.path}`),
      why: found.ok
        ? `every baseline slot is satisfied: ${found.references.map((r) => r.slot).join(', ')}`
        : [...found.missing, ...found.pending].join(' | '),
    };
  } catch (error) {
    visual = { answer: 'NO', evidence: ['reference/global-baseline.json'],
      why: `the global visual baseline could not be read: ${error.message}` };
  }

  const dimensions = [
    { id: 'writing', question: 'Writing',
      answer: all('look-listen', 'repeat-variants', 'wrong-verbs', 'dialogue') ? 'YES' : 'NO',
      evidence: cite('look-listen', 'repeat-variants', 'wrong-verbs', 'dialogue'),
      why: 'examine lines, repeat variants, the wrong-verb layer and this room\'s dialogue' },
    { id: 'puzzle-behaviour', question: 'Puzzle behaviour',
      answer: all('puzzles', 'items', 'flags') ? 'YES' : 'NO',
      evidence: cite('puzzles', 'items', 'flags'),
      why: 'the puzzles sited here, the items they need and issue, and the flags they set' },
    { id: 'act-behaviour', question: 'Act/state behaviour',
      answer: by('act-variants')?.answer ?? 'NO', evidence: cite('act-variants'),
      why: by('act-variants')?.why ?? '' },
    { id: 'character-behaviour', question: 'Character behaviour',
      answer: by('character-behaviour')?.answer ?? 'NO', evidence: cite('character-behaviour'),
      why: by('character-behaviour')?.why ?? '' },
    { id: 'staging-behaviour', question: 'Staging behaviour',
      answer: by('staging')?.answer ?? 'NO', evidence: cite('staging'),
      why: by('staging')?.why ?? '' },
    { id: 'visual-subjects', question: 'Visual subject requirements', ...visual },
    { id: 'geometry', question: 'Geometry/placement',
      answer: geo.every((one) => one.answer === 'YES') ? 'YES' : 'NO',
      evidence: geo.flatMap((one) => one.evidence),
      why: geo.filter((one) => one.answer === 'NO').map((one) => one.why).join(' | ')
        || 'annotation, room file and plate are all present at the canonical size' },
  ];

  return {
    schema: 1,
    note: 'ROOM CONTENT READINESS. Whether this room can be BUILT WITHOUT INVENTING ANYTHING. '
      + 'It holds no creative prose -- every answer cites a document path and an exact heading, '
      + 'or a qualified issue reference. It says nothing about whether the writing is good.',
    room,
    id: sources.id,
    name: sources.name,
    content: asked.answers,
    subjectsFound: asked.subjects.length,
    subjectsDeclaredByDocument: asked.declaredCount,
    unresolvedCitations: citations,
    dimensions,
    dimensionsNote: 'Tyler\'s ruling 13: reported separately, because they fail separately. '
      + 'Writing being complete does not make a room buildable, and a room being unbuildable '
      + 'does not mean a line is missing.',
    buildableWithoutInvention: buildable ? 'YES' : 'NO',
    blocking: blocking.map((one) => `${one.id}: ${one.why}`),
    hardStopNote: 'BUILDABLE WITHOUT INVENTION = NO is a hard stop. Never generate replacement '
      + 'comedy, dialogue, puzzle solutions, story beats or character writing to clear it.',
    geometry: geo,
    geometryNote: 'REPORTED SEPARATELY AND NEVER FOLDED INTO THE ANSWER ABOVE. A missing '
      + 'annotation is not creative incompleteness, and a room may be fully written with no '
      + 'geometry at all. Missing geometry is also NOT permission to infer geometry: walk '
      + 'boxes and clip planes are readings of a PICTURE, so they cannot precede the plate.',
    geometryReady: geo.every((one) => one.answer === 'YES') ? 'YES' : 'NO',
    at: new Date().toISOString(),
  };
}

export async function check() {
  const report = new Report('Room readiness records are internally consistent');
  const declared = [5];
  for (const room of declared) {
    const result = await readiness(room);
    if (result.error) { report.fail(result.error); continue; }
    for (const line of result.unresolvedCitations) report.fail(`room ${room}: ${line}`);
    report.note(`room ${room} (${result.id}): buildable without invention = `
      + `${result.buildableWithoutInvention}, geometry ready = ${result.geometryReady}`);
    for (const line of result.blocking) report.note(`  blocking -- ${line}`);
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const room = Number(process.argv[2]);
  if (!room) { console.error('usage: check-room-readiness.mjs <room number>'); process.exit(2); }
  const result = await readiness(room);
  if (result.error) { console.error(result.error); process.exit(2); }

  const width = Math.max(...result.content.map((one) => one.question.length));
  process.stdout.write(`\nROOM ${room} — ${result.name}\n\nCONTENT\n`);
  for (const one of result.content) {
    process.stdout.write(`  ${one.question.padEnd(width)}  ${one.answer.padEnd(3)}  ${one.why}\n`);
    for (const reference of one.evidence) process.stdout.write(`  ${' '.repeat(width)}       ${reference}\n`);
  }
  process.stdout.write('\nTHE SEVEN DIMENSIONS — reported separately, because they fail '
    + 'separately\n');
  for (const one of result.dimensions) {
    process.stdout.write(`  ${one.question.padEnd(width)}  ${one.answer.padEnd(3)}  ${one.why}\n`);
  }
  process.stdout.write('\nGEOMETRY — reported separately, never folded into the answer above\n');
  for (const one of result.geometry) {
    process.stdout.write(`  ${one.question.padEnd(width)}  ${one.answer.padEnd(3)}  ${one.why}\n`);
  }
  mkdirSync(resolve(ROOT, 'proofs/readiness'), { recursive: true });
  writeFileSync(resolve(ROOT, OUT(room)), `${JSON.stringify(result, null, 1)}\n`);
  process.stdout.write(`\nBUILDABLE WITHOUT INVENTION: ${result.buildableWithoutInvention}\n`);
  process.stdout.write(`GEOMETRY READY: ${result.geometryReady}\n`);
  process.stdout.write(`\nwritten to ${OUT(room)}\n`);
  process.exit(0);
}
