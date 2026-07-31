import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { ROOT } from './lib/content.mjs';

/**
 * Regenerates the content files that are PARSED OUT OF /docs.
 *
 * CLAUDE.md makes this binding: every written line in /content is parsed out
 * of /docs, never transcribed, and a line that needs changing is changed in
 * /docs and re-extracted. Transcribing by hand is how a comma goes missing
 * from a joke, and the failure is silent -- the line still exists, still
 * passes every check, and is simply slightly worse than what was written.
 *
 * So this is one command rather than a series of one-off scripts. A pipeline
 * that only exists as "I ran something once" is a pipeline that will be
 * re-run by hand, differently, when the doc changes.
 *
 * WHAT IT DOES NOT DO: interpret. Where a document does not say who speaks a
 * line, this does not decide -- it carries the beat as written and the gap is
 * visible. Every attribution below is one the doc's own prose forces.
 */

function read(relative) {
  return readFileSync(resolve(ROOT, relative), 'utf8');
}

/**
 * In --check mode nothing is written; the file on disk is compared with what
 * the doc says it should be, and a difference is a failure.
 *
 * Without this the extraction rule is a habit rather than a rule: someone
 * edits /content directly, everything still passes, and the doc and the game
 * quietly disagree about a joke. This is the thing that notices.
 */
const CHECKING = process.argv.includes('--check');
const stale = [];

function write(relative, data) {
  const path = resolve(ROOT, relative);
  const wanted = `${JSON.stringify(data, null, 2)}\n`;
  if (CHECKING) {
    let found = null;
    try {
      found = readFileSync(path, 'utf8');
    } catch {
      found = null;
    }
    if (found !== wanted) stale.push(relative);
    return relative;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, wanted);
  return relative;
}

/** Strips markdown emphasis, leaving the words and their punctuation. */
function plain(text) {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
}

/** Every double-quoted span in a cell, in order. */
function quoted(text) {
  return [...text.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

/** A heading name as the id the content files already use for that thing. */
function slug(name) {
  return name.trim().toLowerCase().replace(/^(the|a) /, '').replace(/\s+/g, '_');
}

// ---------------------------------------------------------------------------

/**
 * Doc 17 v3's opening. The three-option line and the nine-exchange driver
 * tree are both VOID: v3 replaces them with one canonical line played
 * sincerely, four driver beats and no tree, and the act card moved to after
 * the coach leaves.
 *
 * SPEAKER ATTRIBUTION. The beat table does not tag speakers, so each one
 * below is forced by the doc's prose rather than chosen:
 *
 *   beat 3 -- the doc states both, in its own two blockquotes;
 *   beat 4 -- "Thad checks" sits between the question and the answer, so the
 *             driver asks, Thad answers, the driver lands the joke;
 *   beat 5 -- "Thad asks after Ezra Pike" is stage direction and the only
 *             quoted line in the beat is the reply;
 *   beat 6 -- "The driver climbs aboard" closes the beat, and a man who has
 *             four dollars is the one who says he has four;
 *   beat 9 -- note 1 attributes "Wouldn't stand there" to Hob by name, and
 *             the only other person on the road is Thad, so the alternation
 *             is fixed once the first line is.
 */
function opening() {
  const doc = read('docs/17-opening-sequence.md');

  const canonical = doc.match(/\*\*Thad's line, canonical:\*\*\s*\n\s*\n> \*\*"(.+?)"\*\*/);
  const punctured = doc.match(/The driver does not stop unloading:\s*\n\s*\n> \*\*"(.+?)"\*\*/);
  if (!canonical || !punctured) throw new Error('doc 17: cannot find the opening exchange');

  const beats = [];
  for (const line of doc.split('\n')) {
    const row = line.match(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/);
    if (!row) continue;
    const [, number, beat, control, notes] = row;
    // The control column is one of three words plus an optional duration, and
    // it is carried as the word rather than reduced to a boolean: beat 1 is
    // "menu", which is neither under the player's control nor a cutscene, and
    // a boolean has to call it one of them and be wrong.
    const word = plain(control).split('·')[0].trim();
    if (!['menu', 'no', 'yes'].includes(word)) {
      throw new Error(`doc 17 beat ${number}: unknown control "${word}"`);
    }
    const seconds = control.match(/~(\d+)/);
    beats.push({
      beat: Number(number),
      description: plain(beat),
      control: { menu: 'menu', no: 'none', yes: 'player' }[word],
      seconds: seconds ? Number(seconds[1]) : undefined,
      note: plain(notes),
      quoted: quoted(beat),
    });
  }
  if (beats.length !== 10) throw new Error(`doc 17: expected 10 beats, found ${beats.length}`);

  const DRIVER = 'stage_driver';
  const THAD = 'thad';
  const HOB = 'hob';
  const speech = {
    3: [[THAD, canonical[1]], [DRIVER, punctured[1]]],
    4: [[DRIVER, 0], [THAD, 1], [DRIVER, 2]],
    5: [[DRIVER, 0]],
    6: [[DRIVER, 0], [THAD, 1]],
    9: [[HOB, 0], [THAD, 1], [HOB, 2]],
  };

  // Which beat sets which flag. This is routing, not writing, and it is not
  // invented here either: each of these three flags already carries the beat
  // it belongs to in its own note in content/flags/flags.json, written when
  // the beats were v2's. v3 renumbers them -- Hob's crossing moved from 8 to
  // 9 when the act card was inserted -- and this is the renumbering.
  //
  // T_COACH_DEPARTED is NOT here. v3.1 restored the driver's tree and put the
  // departure on its EXIT option in so many words -- "He climbs aboard. The
  // coach goes. Beat 7." -- so the write belongs to the option and a second
  // writer on the beat would be a race with it.
  const flags = {
    3: { T_OPENING_SAID: true },
    9: { T_HOB_CROSSING: true },
  };

  // v3.1 restored the tree without rewriting the beat sheet around it, so the
  // table still calls beats 4, 5 and 6 non-interactive while the tree that
  // carries their lines is interactive by definition. ERRATA 30b corrects the
  // table: those three beats ARE interactive, carriedBy is the right
  // annotation, and beat 3 stays automatic. Applied here rather than in the
  // doc so the correction is one ruling in one place.
  const carried = { 4: 'STAGE_DRIVER', 5: 'STAGE_DRIVER', 6: 'STAGE_DRIVER' };

  for (const entry of beats) {
    if (flags[entry.beat]) entry.set = flags[entry.beat];
    if (carried[entry.beat]) {
      entry.carriedBy = carried[entry.beat];
      entry.control = 'player';
    }
    const plan = speech[entry.beat];
    if (!plan) continue;
    entry.lines = plan.map(([speaker, which]) => ({
      speaker,
      line: typeof which === 'number' ? entry.quoted[which] : which,
    }));
    for (const spoken of entry.lines) {
      if (!spoken.line) throw new Error(`doc 17 beat ${entry.beat}: a line went missing in extraction`);
    }
  }
  const card = beats.find((entry) => entry.description.includes('ACT CARD'));
  if (!card) throw new Error('doc 17: no beat carries the act card');
  card.actCard = card.note;

  for (const entry of beats) delete entry.quoted;

  return write('content/sequences/opening.json', {
    schema: 1,
    id: 'opening',
    // Which flag records that the opening has run. Routing, not content, and
    // named here rather than in the engine so no .ts file knows a flag id.
    doneFlag: 'T_OPENING_DONE',
    note: 'EXTRACTED from docs/17-opening-sequence.md by tools/extract-content.mjs. '
      + 'Do not edit: change doc 17 and re-run. Doc 17 v3 supersedes v2\'s beat sheet and the '
      + 'stage driver\'s tree, both of which are void -- the three-option opening line is one '
      + 'canonical line played sincerely, the driver is four beats with no tree, and the act '
      + 'card moved to after the coach leaves. The lines Thad and the driver speak are the '
      + 'quoted spans of the beat cells; the attribution is recorded in the extractor and is '
      + 'forced by the doc\'s prose, not chosen.',
    corrections: [
      'ERRATA 30a grants the runner a sixth step kind, `wait`, legal only inside a beat whose '
      + 'control is none. Beats 2 and 7 state durations, and without it the opening cannot run.',
      'ERRATA 30b corrects the beat sheet: beats 4, 5 and 6 are interactive, because the tree '
      + 'that carries their lines is. The table still says "no"; the ruling governs. Beat 3 '
      + 'stays automatic -- it is the exchange v3.1 models on the lookout, and that one is '
      + 'genuinely automatic.',
    ],
    speakers: {
      thad: { name: 'THADDEUS GRUBB' },
      stage_driver: {
        name: 'THE STAGE DRIVER',
        note: 'Four beats and he is gone. Everything else he said in v2 -- what the town is, '
          + 'Mott\'s strike, whether anyone has found it, how long the search has run -- is '
          + 'redistributed into town, where the sources contradict each other and no character '
          + 'in Act I gives a complete or correct account.',
      },
      hob: {
        name: 'HOB',
        note: 'Beat 9 is his crossing, and doc 17 note 1 is explicit that "Wouldn\'t stand '
          + 'there" is not a hint -- there is nothing wrong with where Thad is standing. Hob '
          + 'says small true-sounding things to strangers. A player who moves has lost nothing '
          + 'and a player who stays has lost nothing.',
      },
    },
    unwritten: [
      'Doc 17 note 0: Hob may be asked about Ezra Pike, once -- "Pike\'s up the hill." It is '
      + 'true, it is his only useful sentence in Act I, and it has no tree to live in yet. '
      + 'Extracted here so it is on file rather than only in the doc.',
    ],
    beats,
  });
}

// ---------------------------------------------------------------------------

/**
 * Doc 17 v3.1's driver tree, restored at four options after v3 cut it to zero.
 *
 * Four rows, one of each kind, and the doc's own tags. Nothing here is
 * chosen: the option text, the tag and the response are three columns of one
 * table, and the multi-speaker response in row 2 is carried as an exchange
 * rather than flattened into one string with dashes between the speakers --
 * which is what the v2 file did, and is the same failure as transcribing.
 *
 * The italics decide who speaks inside a response. The row's response is the
 * driver's unless the doc puts it in italics, which it does exactly once, for
 * Thad's "I have four." -- matching beat 6, where the same exchange appears
 * with the same emphasis.
 */
function stageDriver() {
  const doc = read('docs/17-opening-sequence.md');

  const section = doc.split('## The driver\'s tree')[1];
  if (!section) throw new Error('doc 17: no driver tree section');

  const rows = [];
  for (const line of section.split('\n')) {
    const row = line.match(/^\| "(.+?)" \| `\[(\w+)\]` \| (.+?) \|$/);
    if (row) rows.push({ text: row[1], tag: row[2], response: row[3] });
  }
  if (rows.length !== 4) throw new Error(`doc 17 v3.1: expected 4 options, found ${rows.length}`);

  const DRIVER = 'stage_driver';
  const THAD = 'thad';
  const options = rows.map((row, index) => {
    // Every quoted span in the response, with its emphasis, so the one
    // italicised line can be told from the ones that are not.
    const spans = [...row.response.matchAll(/(\*+)?"([^"]+)"(\*+)?/g)].map((match) => ({
      line: match[2],
      italic: match[1] === '*' && match[3] === '*',
    }));
    if (spans.length === 0) throw new Error(`doc 17 v3.1: option ${index + 1} has no response`);

    const option = {
      id: `drv${index + 1}`,
      text: row.text,
      tag: row.tag,
    };
    if (spans.length === 1) {
      option.say = spans[0].line;
    } else {
      option.exchange = spans.map((span) => (
        { speaker: span.italic ? THAD : DRIVER, line: span.line }));
    }
    return option;
  });

  // The two writes the doc states in the table itself: the PROGRESS option
  // that names the undertaker is the objective, and the EXIT option is
  // parenthesised "He climbs aboard. The coach goes. Beat 7."
  const undertaker = options.find((option) => (option.say ?? '').includes('undertaker'));
  if (!undertaker) throw new Error('doc 17 v3.1: no option names the undertaker');
  undertaker.set = { T_UNDERTAKER_NAMED: true };

  const exit = options.find((option) => option.tag === 'EXIT');
  if (!exit) throw new Error('doc 17 v3.1: the tree has no EXIT option');
  exit.set = { T_COACH_DEPARTED: true };
  exit.ends = true;

  return write('content/dialogue/stage-driver.json', {
    schema: 1,
    id: 'STAGE_DRIVER',
    name: 'THE STAGE DRIVER',
    note: 'EXTRACTED from docs/17-opening-sequence.md by tools/extract-content.mjs. Do not edit: '
      + 'change doc 17 and re-run. v3.1 restores the tree at FOUR options after v3 cut it to '
      + 'zero -- one of each kind, teaching that dialogue branches, that the comic option costs '
      + 'nothing and answers, and that one option ends a scene. v2\'s nine exchanges are void: '
      + 'Mott stays out, and the premise is redistributed into town where the sources disagree.',
    nodes: {
      root: {
        id: 'root',
        options,
        noPrompt: true,
        exceptionReason: 'The driver has no prompt of his own. Beat 3 is automatic -- Thad\'s '
          + 'canonical line and "Course you have." -- and the tree opens on what the player asks '
          + 'next. Doc 17 v3.1 writes four options and four responses and no opening line for '
          + 'the node itself.',
      },
    },
    start: 'root',
  });
}

// ---------------------------------------------------------------------------

/**
 * A "1 ... · 2 ... · 3 ..." variant run, as [v1, v2, v3].
 *
 * SPLIT ON THE SEPARATOR, then read each piece. The first version matched
 * `(?:^|·)\s*(\d)\s+"..."` across the whole run, which requires a bullet or
 * a line start before every number -- true in the "newly written" sections
 * and false in the repeat runs, where variant 2 follows the word LOOK. So
 * every repeat run silently lost its middle variant and wrote a null into
 * the array. It passed extraction, produced valid JSON, and only surfaced
 * because a downstream check noticed variant 3 equalled variant 1.
 */
function variants(text) {
  const out = [];
  for (const piece of text.split('·')) {
    const match = piece.match(/(\d)\s+"([^"]+)"/);
    if (match) out[Number(match[1]) - 1] = match[2];
  }
  return out;
}

/**
 * Doc 25: Rooms 5 and 7, complete.
 *
 * The first document written specifically to clear a failing check --
 * check-written-content had been red for many turns on exactly these
 * thirty-two lines, and it was red for the right reason. So this is the
 * shape every remaining room's content will arrive in, and the extractor
 * is written for the shape rather than for these two rooms.
 *
 * FOUR KINDS OF ENTRY, all of them the doc's own sections:
 *
 *   ### HEADING with LOOK and LISTEN runs   -- a new hotspot's lines
 *   **NAME** -- LOOK 2 "..." · 3 "..." | LISTEN ...  -- repeats for an
 *                                          existing hotspot
 *   > **NAME** · VERB -- "..."             -- an override
 *   **NAME -> Room N** with LOOK/LISTEN     -- an exit
 *
 * Nothing here decides which hotspot a heading belongs to by guessing: the
 * name is slugged and matched against ids already in the room file, and a
 * heading that matches nothing is reported rather than invented.
 */
function rooms0507() {
  const doc = read('docs/25-rooms-05-07.md');
  const sections = doc.split(/^# ROOM (\d+) · /m).slice(1);
  const written = [];

  const FILE = { 5: 'content/rooms/assay-office.json', 7: 'content/rooms/claims-registrar.json' };
  const shortened = new Set();
  const VERBS = { LOOK: 'LOOK_AT', LISTEN: 'LISTEN_TO' };

  for (let index = 0; index < sections.length; index += 2) {
    const number = Number(sections[index]);
    const body = sections[index + 1];
    const path = FILE[number];
    if (!path) throw new Error(`doc 25: no room file for room ${number}`);
    const room = JSON.parse(read(path));

    const byName = new Map();
    for (const target of [...room.hotspots, ...room.exits]) byName.set(target.name, target);

    // Exact name first, then a UNIQUE PREFIX. The doc heads a hotspot THE
    // CERTIFICATE ON THE WALL and calls it THE CERTIFICATE in the override
    // list, which is how anybody writes and is not an error. A prefix that
    // matches two hotspots is an error and says so -- the shortening is
    // allowed to be convenient, never ambiguous.
    const lineFor = (name) => {
      const exact = byName.get(name);
      if (exact) return exact;
      const near = [...byName.keys()].filter((full) => full.startsWith(name));
      if (near.length === 1) {
        shortened.add(`${name} -> ${near[0]}`);
        return byName.get(near[0]);
      }
      if (near.length > 1) {
        throw new Error(`doc 25 room ${number}: "${name}" matches ${near.length} hotspots`);
      }
      throw new Error(`doc 25 room ${number}: no hotspot named "${name}"`);
    };

    // --- new hotspots: a ### heading, then a LOOK run and a LISTEN run.
    for (const block of body.matchAll(/^### (.+?)\n\*\*LOOK\*\*(.+?)\n\*\*LISTEN\*\*(.+?)$/gm)) {
      const [, name, look, listen] = block;
      const target = byName.get(plain(name));
      if (!target) {
        // A heading the room has no hotspot for. Reported, never invented --
        // an id guessed here is a hotspot nobody can point at.
        throw new Error(`doc 25 room ${number}: "${plain(name)}" is written but the room `
          + 'has no hotspot with that name');
      }
      for (const [verb, run] of [[VERBS.LOOK, look], [VERBS.LISTEN, listen]]) {
        const said = variants(run);
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
      }
    }

    // --- repeat variants for hotspots doc 05 already wrote variant 1 for.
    for (const entry of body.matchAll(/^\*\*(.+?)\*\* — LOOK (.+?) \| LISTEN (.+?)$/gm)) {
      const [, name, look, listen] = entry;
      const target = lineFor(plain(name));
      for (const [verb, run] of [[VERBS.LOOK, look], [VERBS.LISTEN, listen]]) {
        // Indexed by the doc's own numbers, so variant 2 lands at index 1 --
        // and a run that skips a number leaves a hole rather than shifting
        // everything up one.
        const said = variants(run);
        if (said[0] !== undefined) {
          throw new Error(`doc 25: ${plain(name)} ${verb} repeat run restates variant 1`);
        }
        const rule = (target.responses?.[verb] ?? [])[0];
        if (!rule) throw new Error(`doc 25: ${plain(name)} has no ${verb} to add repeats to`);
        rule.repeat = said.slice(1);
        if (rule.repeat.some((line) => line === undefined)) {
          throw new Error(`doc 25: ${plain(name)} ${verb} repeats have a gap -- `
            + `got ${JSON.stringify(rule.repeat)}`);
        }
      }
    }

    // --- overrides.
    for (const entry of body.matchAll(/^> \*\*(.+?)\*\* · (.+)$/gm)) {
      const target = lineFor(plain(entry[1]));
      target.overrides = target.overrides ?? {};
      for (const pair of entry[2].split(' · ')) {
        const split = pair.match(/^(\w[\w ]*?) — "(.+)"$/);
        if (!split) throw new Error(`doc 25: cannot read override "${pair.slice(0, 40)}"`);
        target.overrides[split[1].trim().replace(/ /g, '_')] = split[2];
      }
    }

    // --- exits.
    for (const entry of body.matchAll(
      /^\*\*(.+?) → Room (\d+)\*\*\n\*\*LOOK\*\*(.+?)\n\*\*LISTEN\*\*(.+?)$/gm)) {
      const [, name, , look, listen] = entry;
      const target = lineFor(plain(name));
      for (const [verb, run] of [[VERBS.LOOK, look], [VERBS.LISTEN, listen]]) {
        const said = variants(run);
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
      }
    }

    // A target that now carries written lines is not a stub, and a stale
    // `stub` is not cosmetic: check-examine-lines SKIPS stubs, so leaving it
    // set on an exit doc 25 wrote three LOOK variants for quietly excluded
    // those lines from the game-wide uniqueness guarantee.
    for (const target of [...room.hotspots, ...room.exits]) {
      if (target.stub && target.responses?.LOOK_AT) delete target.stub;
    }

    room.note = `${(room.note ?? '').replace(/ Lines EXTRACTED.*$/, '')} `
      + 'Lines EXTRACTED from docs/25-rooms-05-07.md by tools/extract-content.mjs. Do not '
      + 'edit: change doc 25 and re-run.';
    written.push(write(path, room));
  }
  for (const pair of shortened) process.stderr.write(`  doc 25 short name: ${pair}\n`);
  return written;
}

// ---------------------------------------------------------------------------

/** Doc 24's combination table: three tiers, extracted whole. */
function combinations() {
  const doc = read('docs/24-combinations.md');
  const existing = JSON.parse(read('content/combinations.json'));

  const pairs = [];
  for (const line of doc.split('\n')) {
    const row = line.match(/^\| \*\*(A\d+)\*\* \| (.+?) \| (.+?) \|$/);
    if (!row) continue;
    const combo = row[2].match(/^([A-Z '’]+?) on \*\*(.+?)\*\*$/);
    const say = row[3].match(/^"(.+?)"/);
    pairs.push({ puzzle: row[1], item: combo[1].trim(), target: combo[2].trim(), say: say[1] });
  }
  const nulls = [];
  let inNulls = false;
  for (const line of doc.split('\n')) {
    if (line.startsWith('# 4 ')) { inNulls = true; continue; }
    if (line.startsWith('## Notes')) break;
    const entry = line.trim().match(/^> \*\*(.+?) on (.+?)\*\* — "(.+)"$/);
    if (inNulls && entry) nulls.push({ item: entry[1], target: entry[2], say: entry[3] });
  }

  // The routing -- which item id, which room, which target id -- is not in the
  // doc and is not invented here: it is read back off the file already
  // shipped, so only the LINES come from the extraction. If doc 24 grows a
  // pair this cannot place, it says so rather than guessing.
  const placed = new Map(existing.pairs.map((pair) => [pair.say, pair]));
  const rebuilt = [...pairs, ...nulls].map((pair) => {
    const routed = placed.get(pair.say);
    if (!routed) throw new Error(`doc 24: no routing on file for "${pair.say.slice(0, 40)}..."`);
    return { ...routed, say: pair.say };
  });
  if (rebuilt.length !== existing.pairs.length) {
    throw new Error(`doc 24: ${rebuilt.length} pairs extracted, ${existing.pairs.length} on file`);
  }

  const pools = {};
  let current = null;
  let inPools = false;
  for (const line of doc.split('\n')) {
    if (line.startsWith('# 2 ')) { inPools = true; continue; }
    if (line.startsWith('# 3 ')) { inPools = false; continue; }
    if (!inPools) continue;
    const head = line.match(/^## (.+?)(?: — .*)?$/);
    if (head) { current = head[1].split('·').map((name) => name.trim()); continue; }
    const quote = line.trim().match(/^> "(.+)"$/);
    if (quote && current) for (const name of current) (pools[name] ??= []).push(quote[1]);
  }
  const global = [];
  let inGlobal = false;
  for (const line of doc.split('\n')) {
    if (line.startsWith('# 3 ')) { inGlobal = true; continue; }
    if (line.startsWith('# 4 ')) break;
    const quote = line.trim().match(/^> "(.+)"$/);
    if (inGlobal && quote) global.push(quote[1]);
  }

  // Pool heads resolve to item ids by NAME, not by contents. Matching on the
  // lines looked equivalent and was not: "FOUR DOLLARS · THE FILING FEE" heads
  // one pool that two items share, so a contents-first match found the same id
  // twice and dropped the filing fee's pool without saying anything. The whole
  // point of extracting rather than transcribing is that content cannot go
  // missing quietly, so this resolves by name and fails loudly.
  const itemIds = new Set(JSON.parse(read('content/manifest.json')).items
    .map((path) => JSON.parse(read(path)).id));
  const itemPools = {};
  for (const [name, lines] of Object.entries(pools)) {
    const id = slug(name);
    if (!itemIds.has(id)) throw new Error(`doc 24: no item "${id}" for the pool headed "${name}"`);
    itemPools[id] = lines;
  }

  return write('content/combinations.json', {
    ...existing, pairs: rebuilt, itemPools, globalPool: global,
  });
}

// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------

/**
 * Doc 14's Room 2 exits. Only THE ASSAY OFFICE is extracted here.
 *
 * The other four were transcribed before the extraction rule was binding and
 * re-parsing them now would be a diff nobody asked for; this one arrived
 * after, and it is the shape the rest convert to when they are next touched.
 */
function room02Exits() {
  const doc = read('docs/14-room-02-exits.md');
  const path = 'content/rooms/main-street.json';
  const room = JSON.parse(read(path));

  const section = doc.split('## THE ASSAY OFFICE \u2192 Room 5')[1];
  if (!section) throw new Error('doc 14: no assay office section');

  const exit = room.exits.find((entry) => entry.id === 'to_assay_office');
  if (!exit) throw new Error('doc 14: main street has no to_assay_office exit');

  for (const [verb, heading] of [['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
    const block = section.split(`**${heading}**`)[1];
    if (!block) throw new Error(`doc 14: assay office has no ${heading} run`);
    const lines = [];
    for (const line of block.split('\n')) {
      const numbered = line.match(/^(\d)\. "(.+)"$/);
      if (numbered) lines[Number(numbered[1]) - 1] = numbered[2];
      else if (line.startsWith('**') && lines.length) break;
    }
    if (lines.length !== 3) throw new Error(`doc 14: assay ${heading} has ${lines.length} variants`);
    exit.responses = exit.responses ?? {};
    exit.responses[verb] = [{ say: lines[0], repeat: lines.slice(1) }];
  }

  exit.overrides = exit.overrides ?? {};
  for (const entry of section.matchAll(/^> (\w[\w ]*?) \u2014 "(.+)"$/gm)) {
    exit.overrides[entry[1].trim().replace(/ /g, '_')] = entry[2];
  }

  // THE STUB MARKING COMES OFF. `stub` means the destination exists so the
  // exit works with its examine layer honestly absent -- true of this door
  // until doc 14 covered it, and a lie the moment it did.
  delete exit.stub;
  return write(path, room);
}

// ---------------------------------------------------------------------------

/**
 * Docs 08 and 09, for the hotspots doc 26 writes REPEATS for.
 *
 * Doc 26 numbers those runs from 2, because variant 1 was written in the
 * examine-layer batches and stands. So the batch document alone cannot fill a
 * hotspot: the first line -- the only one most players will ever read -- lives
 * in the older doc and is fetched from it rather than restated.
 *
 * ACT-QUALIFIED LINES. Docs 08 and 09 write some LOOK lines per act:
 * `**LOOK Act I:**`, `**LOOK Acts I-III:**`, `**LOOK Act IV:**`. THERE IS NO
 * ACT MECHANISM -- no flag, no writer, and Phase 1 is explicit that Acts I to
 * IV are not being built. So the Act I line is wired and every other act's is
 * collected and reported by name. Inventing an ACT flag to gate lines nothing
 * can set would be building the act system in order to look complete.
 */
function priorVariantOne(docPath, roomNumber, name) {
  const doc = read(docPath);
  const sections = doc.split(/^## ROOM (\d+) — /m).slice(1);
  const unwired = [];
  for (let index = 0; index < sections.length; index += 2) {
    if (Number(sections[index]) !== roomNumber) continue;
    for (const entry of sections[index + 1].matchAll(/^\*\*(.+?)\*\*\n((?:> .*\n)+)/gm)) {
      if (plain(entry[1]) !== name) continue;
      const said = {};
      for (const row of entry[2].matchAll(/^> \*\*(LOOK|LISTEN)(.*?):\*\* "(.+)"$/gm)) {
        const [, verb, qualifier, line] = row;
        // The unqualified line, or the one whose qualifier covers Act I.
        // /Acts? I\b/ matches "Act I" and "Acts I-III" and NOT "Act III" --
        // the word boundary is doing real work and an /I/ without it wired
        // the Act III coat as the Act I coat.
        if (!qualifier || /Acts? I\b/.test(qualifier)) said[verb] = line;
        else unwired.push({ label: `${name} ${verb}${qualifier}`, line });
      }
      return { said, unwired };
    }
  }
  return null;
}

/**
 * Every act-qualified line in a room's prior section, attributed or not.
 *
 * priorVariantOne only sees entries written as a standalone `**NAME**`
 * heading. Doc 08 writes some hotspots as a parenthetical inside a group line
 * -- `> *(The coat — **LOOK Act I:** "..." **LOOK Act III:** "...")*` -- and
 * the Act III coat was invisible to the extractor for that reason alone:
 * written, unwired, and not on the list of things known to be unwired, which
 * is the worse of the two.
 *
 * This sweeps the whole section and the caller subtracts what it already
 * knows about, so an unattributed line is reported by its text rather than
 * silently absent.
 */
function actLinesIn(docPath, roomNumber) {
  const doc = read(docPath);
  const sections = doc.split(/^## ROOM (\d+) — /m).slice(1);
  const found = [];
  for (let index = 0; index < sections.length; index += 2) {
    if (Number(sections[index]) !== roomNumber) continue;
    for (const row of sections[index + 1].matchAll(/\*\*LOOK (Acts? [^:*]*?):\*\* "(.+?)"/g)) {
      const [, qualifier, line] = row;
      if (/^Acts? I\b/.test(qualifier)) continue;
      found.push({ label: `LOOK ${qualifier}`, line });
    }
  }
  return found;
}

/**
 * Doc 26: Rooms 18, 19 and 13, completing the hotspots docs 08 and 09 marked
 * "(working script)".
 *
 * Same four kinds of entry as doc 25, and four differences that are the
 * document being written by a person rather than to a grammar:
 *
 *   - a LOOK run can carry an act qualifier -- `**LOOK Acts I-II**`;
 *   - a repeat entry can have no LOOK run at all, when the LOOK lines are
 *     act-variant and live elsewhere;
 *   - an override can carry a trailing instruction in italics, and one of
 *     them is load-bearing: THE COFFINS' USE line must never gain a variant;
 *   - an exit can defer to a hotspot's lines instead of repeating them, and
 *     can lead to the map rather than to a numbered room.
 *
 * None of those is normalised away. The parser reads what is on the page.
 */
function roomsBatchA() {
  const doc = read('docs/26-batch-a.md');
  const sections = doc.split(/^# ROOM (\d+) · /m).slice(1);
  const written = [];

  const FILE = {
    18: 'content/rooms/hotel-lobby.json',
    19: 'content/rooms/thads-room.json',
    13: 'content/rooms/undertaker.json',
  };
  //: Which examine-layer batch wrote variant 1 for each room.
  const PRIOR = {
    18: 'docs/09-examine-batch-2.md',
    19: 'docs/08-examine-batch-1.md',
    13: 'docs/09-examine-batch-2.md',
  };
  const VERBS = { LOOK: 'LOOK_AT', LISTEN: 'LISTEN_TO' };
  const unwiredActLines = [];
  const coverage = [];
  const named = new Set();
  const gaps = [];

  for (let index = 0; index < sections.length; index += 2) {
    const number = Number(sections[index]);
    const body = sections[index + 1];
    const path = FILE[number];
    if (!path) throw new Error(`doc 26: no room file for room ${number}`);
    const room = JSON.parse(read(path));

    const byName = new Map();
    for (const target of [...room.hotspots, ...room.exits]) byName.set(target.name, target);
    const lineFor = (name) => {
      const exact = byName.get(name);
      if (exact) return exact;
      const near = [...byName.keys()].filter((full) => full.startsWith(name));
      if (near.length === 1) return byName.get(near[0]);
      throw new Error(`doc 26 room ${number}: "${name}" matches ${near.length} hotspots`);
    };

    // --- newly written hotspots: a ### heading, a LOOK run and a LISTEN run.
    for (const block of body.matchAll(
      /^### (.+?)\n\*\*LOOK(.*?)\*\*(.+?)\n\*\*LISTEN(.*?)\*\*(.+?)$/gm)) {
      const [, name, lookQualifier, look, listenQualifier, listen] = block;
      const target = byName.get(plain(name));
      if (!target) {
        throw new Error(`doc 26 room ${number}: "${plain(name)}" is written but the room `
          + 'has no hotspot with that name');
      }
      for (const [verb, run, qualifier] of [
        [VERBS.LOOK, look, lookQualifier], [VERBS.LISTEN, listen, listenQualifier],
      ]) {
        const said = variants(run);
        if (said.some((line) => line === undefined) || said.length < 1) {
          throw new Error(`doc 26 room ${number}: ${plain(name)} ${verb} run has a gap`);
        }
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
        if (qualifier.trim()) coverage.push(`${plain(name)} ${verb} covers${qualifier}`);
      }
    }

    // --- a NAMED BLOCK: a name, a correction in italics, then its own
    //     numbered runs starting at 1. The shape doc 26 reached for when a
    //     hotspot's variant 1 turned out not to exist in the earlier doc --
    //     the correction is prose, and the lines below it are the entry.
    //
    //     It is matched before the repeat form and cannot collide with it:
    //     a repeat entry carries " | LISTEN " on the name's own line and
    //     this one carries nothing but the correction.
    for (const block of body.matchAll(
      /^\*\*(.+?)\*\* — \*[^\n]*\*\n\n\*\*LOOK(.*?)\*\*(.+?)\n\*\*LISTEN(.*?)\*\*(.+?)$/gm)) {
      const [, rawName, lookQualifier, look, listenQualifier, listen] = block;
      const name = plain(rawName);
      const target = lineFor(name);
      named.add(name);
      // Consulted for what it does NOT wire. The prior doc still carries this
      // hotspot's other acts, and they are reported even though doc 26 now
      // writes Act I's three variants here.
      const prior = priorVariantOne(PRIOR[number], number, name);
      if (prior) unwiredActLines.push(...prior.unwired);

      for (const [verb, run, qualifier] of [
        [VERBS.LOOK, look, lookQualifier], [VERBS.LISTEN, listen, listenQualifier],
      ]) {
        const said = variants(run);
        if (said.length < 1 || said.some((line) => line === undefined)) {
          throw new Error(`doc 26 room ${number}: ${name} ${verb} run has a gap`);
        }
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
        if (qualifier.trim()) coverage.push(`${name} ${verb} covers${qualifier}`);
      }
    }

    // --- repeat variants: variant 1 comes from doc 08 or doc 09.
    for (const entry of body.matchAll(/^\*\*(.+?)\*\* — (.+?) \| LISTEN (.+?)$/gm)) {
      const [, rawName, lookPart, listen] = entry;
      const name = plain(rawName);
      const target = lineFor(name);
      const prior = priorVariantOne(PRIOR[number], number, name);
      if (!prior) {
        throw new Error(`doc 26 room ${number}: "${name}" has repeat variants but `
          + `${PRIOR[number]} never wrote its variant 1`);
      }
      unwiredActLines.push(...prior.unwired);

      const runs = [[VERBS.LISTEN, listen, 'LISTEN']];
      if (lookPart.startsWith('LOOK ')) {
        runs.unshift([VERBS.LOOK, lookPart.slice(5), 'LOOK']);
      } else {
        // A repeat entry with no LOOK run at all. Doc 26 no longer has one --
        // both were rewritten as named blocks above -- and this stays because
        // the next document that reaches for the shape should be reported
        // rather than parsed into a hotspot with one line.
        gaps.push(`${name} LOOK has repeat variants declared elsewhere and no run here`);
        if (prior.said.LOOK) {
          target.responses = target.responses ?? {};
          target.responses[VERBS.LOOK] = [{ say: prior.said.LOOK, repeat: [] }];
        }
      }

      for (const [verb, run, heading] of runs) {
        const said = variants(run);
        if (said[0] !== undefined) {
          throw new Error(`doc 26: ${name} ${verb} repeat run restates variant 1`);
        }
        const first = prior.said[heading];
        if (first === undefined) {
          // Doc 08 writes THE OUTGOING LETTER's LOOK as a stage direction --
          // "reflects whichever version the player last chose" -- not a line.
          // Nothing is wired: a rule whose first line is undefined shows the
          // player the word undefined, and inventing one here is the exact
          // thing CLAUDE.md forbids.
          gaps.push(`${name} ${heading} variant 1 is not a written line in ${PRIOR[number]}`);
          continue;
        }
        const repeat = said.slice(1);
        if (repeat.some((line) => line === undefined)) {
          throw new Error(`doc 26: ${name} ${verb} repeats have a gap -- `
            + `got ${JSON.stringify(repeat)}`);
        }
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: first, repeat }];
      }
    }

    // --- overrides, which may carry a trailing instruction in italics.
    for (const entry of body.matchAll(/^> \*\*(.+?)\*\* · (.+)$/gm)) {
      const target = lineFor(plain(entry[1]));
      target.overrides = target.overrides ?? {};
      const split = entry[2].match(/^(\w[\w ]*?) — "(.+?)"(?:\s*\*\((.+)\)\*)?$/);
      if (!split) throw new Error(`doc 26: cannot read override "${entry[2].slice(0, 40)}"`);
      target.overrides[split[1].trim().replace(/ /g, '_')] = split[2];
    }

    // --- exits. An exit may defer to a hotspot's lines rather than repeat
    //     them, and may lead to the map rather than to a numbered room.
    for (const entry of body.matchAll(
      /^\*\*(.+?) → (?:Room \d+|the map)\*\*\n(\*\*LOOK\*\*(.+?)\n\*\*LISTEN\*\*(.+?)|> .+?)$/gm)) {
      const [, rawName, , look, listen] = entry;
      const target = lineFor(plain(rawName));
      if (look === undefined) {
        // "Uses THE STAIRS' lines above." One object that is both a hotspot
        // and the way out, so its lines are already on this target.
        for (const verb of [VERBS.LOOK, VERBS.LISTEN]) {
          if (!target.responses?.[verb]) {
            throw new Error(`doc 26 room ${number}: ${plain(rawName)} defers to lines `
              + `written above and has no ${verb}`);
          }
        }
        continue;
      }
      for (const [verb, run] of [[VERBS.LOOK, look], [VERBS.LISTEN, listen]]) {
        const said = variants(run);
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
      }
    }

    // A target that now carries written lines is not a stub. `stub` means the
    // destination exists with its examine layer honestly absent, and it makes
    // check-examine-lines SKIP the target -- so a stale one is not a cosmetic
    // flag, it is a hole in the duplicate guarantee.
    for (const target of [...room.hotspots, ...room.exits]) {
      if (target.stub && target.responses?.LOOK_AT) delete target.stub;
    }

    // Act-qualified lines the prior doc carries that nothing above accounted
    // for. Doc 08 writes some hotspots inside a group parenthetical rather
    // than under their own heading, so an unwired line can be invisible to
    // every named lookup -- and a line that is unwired AND unlisted is the
    // one that gets forgotten.
    const claimed = new Set(unwiredActLines.map((entry) => entry.line));
    for (const entry of actLinesIn(PRIOR[number], number)) {
      if (claimed.has(entry.line)) continue;
      claimed.add(entry.line);
      unwiredActLines.push({ label: `${entry.label} (unattributed in ${PRIOR[number]})`, line: entry.line });
    }

    room.note = `${(room.note ?? '').replace(/ Lines EXTRACTED.*$/, '')} `
      + 'Lines EXTRACTED from docs/26-batch-a.md by tools/extract-content.mjs. Do not '
      + 'edit: change doc 26 and re-run.';
    written.push(write(path, room));
  }

  for (const line of coverage) process.stderr.write(`  doc 26 act coverage: ${line}\n`);
  for (const entry of unwiredActLines) {
    process.stderr.write(`  doc 26 act-gated, UNWIRED: ${entry.label} -- `
      + `"${entry.line.slice(0, 48)}${entry.line.length > 48 ? '...' : ''}"\n`);
  }
  for (const gap of gaps) process.stderr.write(`  doc 26 GAP: ${gap}\n`);
  if (named.size) process.stderr.write(`  doc 26 named blocks: ${[...named].join(', ')}\n`);
  return written;
}

// ---------------------------------------------------------------------------

/**
 * Doc 27's three Act I trees: the undertaker, the hotel clerk, Deke Vessel.
 *
 * SPEAKER ATTRIBUTION IS THE DOCUMENT'S OWN TYPOGRAPHY, not a decision made
 * here. A response cell alternates speakers and marks each one:
 *
 *   "..."      plain          -- the character whose tree this is
 *   *"..."*    italic         -- Thad
 *   **"..."**  bold           -- the character, emphasised
 *   *(...)*    italic bracket -- a stage direction, and nobody says it
 *
 * The rule holds across all three trees and all six multi-speaker cells, and
 * it is the same kind of forced reading doc 17's beat sheet needed. Note that
 * italic-with-quotes and italic-without are different things: `*"I'm sorry?"*`
 * is Thad and `*(pause)*` is nobody, so the parser cannot simply strip
 * emphasis and look at what is left.
 *
 * FLAG ROUTING. Two of the three flags are named in the document, in the cell
 * that writes them. The third is not, and it is not invented here either:
 *
 *   T_PIKE_DEAD      doc 27, undertaker option 2, in so many words
 *   T_SWINDLED       doc 27, Vessel option 6, in so many words
 *   T_TUNES_PIANOS   NOT named in doc 27. Doc 02's A2 row states the topic as
 *                    "I tune pianos"; doc 04 declares T_TUNES_PIANOS as an
 *                    Act I flag and gates an option in Winnie's tree on it
 *                    ("I tune pianos." req `T_TUNES_PIANOS`), which means
 *                    something earlier must set it; and the clerk's option 4
 *                    is the only place in Act I where Thad says he can tune a
 *                    piano. Three documents leave exactly one writer.
 *
 * The clerk's option 4 sets that flag AND NOTHING ELSE. It grants permission;
 * doc 24's A2 pair -- the fork on the parlour piano, in a room that is not
 * built -- is what earns the room. A tree that resolved A2 would make the
 * combination decorative.
 */
function minorTrees() {
  const doc = read('docs/27-minor-trees.md');
  const sections = doc.split(/^# (.+?) · Room (\d+)$/m).slice(1);
  const written = [];

  //: Tree id, speaker id and room, per character. The room is carried so the
  //: hotspot that opens the tree can be checked against it.
  const WHO = {
    'THE UNDERTAKER': { tree: 'UNDERTAKER', speaker: 'undertaker', room: 'undertaker' },
    'THE HOTEL CLERK': { tree: 'HOTEL_CLERK', speaker: 'hotel_clerk', room: 'hotel_lobby' },
    'DEKE VESSEL': { tree: 'DEKE_VESSEL', speaker: 'deke_vessel', room: 'nugget' },
  };
  //: Doc 27 leaves one writer unnamed. See the routing note above.
  const ROUTED = { 'THE HOTEL CLERK': { 4: 'T_TUNES_PIANOS' } };
  const THAD = 'thad';
  const unspoken = [];
  const directions = [];

  for (let index = 0; index < sections.length; index += 3) {
    const title = sections[index].trim();
    const body = sections[index + 2];
    const who = WHO[title];
    if (!who) throw new Error(`doc 27: no tree wired for "${title}"`);

    const rootCell = body.match(/^\*\*Root:\*\* (.+)$/m);
    if (!rootCell) throw new Error(`doc 27: ${title} has no root line`);
    const rootSpeech = speech(rootCell[1], who.speaker);
    if (rootSpeech.length !== 1) {
      throw new Error(`doc 27: ${title}'s root is ${rootSpeech.length} lines, not 1`);
    }
    for (const note of stageDirections(rootCell[1])) directions.push(`${title} root: ${note}`);

    const options = [];
    // The tag cell may be EMPTY, and an empty cell in this document is "| |"
    // with one space rather than two -- so the separators cannot carry their
    // own spaces or every EXIT row is silently skipped. It was: three trees
    // came out with no way to leave any of them, and nothing failed, because
    // no check requires an exit and the runner ends on a tag it never saw.
    const ROW = /^\| (\d+) \|\s*(.+?)\s*\|\s*(.*?)\s*\|\s*(.+?)\s*\|$/gm;
    for (const row of body.matchAll(ROW)) {
      const [, number, optionCell, tagCell, responseCell] = row;

      // The tag is normally its own column. An EXIT row leaves that column
      // empty and marks the option text instead, which is how the document
      // reads on the page and is not an error to be normalised.
      const tagged = `${tagCell} ${optionCell}`.match(/\[([A-Z]+)\]/);
      if (!tagged) throw new Error(`doc 27: ${title} option ${number} has no tag`);
      const tag = tagged[1];
      const text = quoted(optionCell)[0];
      if (!text) throw new Error(`doc 27: ${title} option ${number} has no option text`);

      // Everything before the arrow is spoken; everything after it is state.
      const [spoken, ...after] = responseCell.split('→');
      const lines = speech(spoken, who.speaker);
      for (const note of stageDirections(spoken)) {
        directions.push(`${title} option ${number}: ${note}`);
      }

      const option = { id: `${who.speaker}${number}`, text, tag };
      if (lines.length === 1 && lines[0].speaker === who.speaker) {
        option.say = lines[0].line;
      } else if (lines.length > 1) {
        option.exchange = lines;
      } else if (lines.length === 0) {
        // Doc 27's Vessel option 6 is "(The swindle. Four dollars and the
        // watch for the deed.)" -- a scene, not a line. Nothing is invented
        // to fill it: the DIRECTION ITSELF is carried as the option's beat,
        // so the document's words survive into the data and the engine has
        // something to play when the machinery for it exists. An option with
        // neither a line nor a direction is an error and says so.
        const direction = stageDirections(spoken)[0];
        if (!direction) {
          throw new Error(`doc 27: ${title} option ${number} has no line and no direction`);
        }
        option.beat = direction;
        unspoken.push(`${title} option ${number} "${text}" -- ${direction}`);
      } else {
        throw new Error(`doc 27: ${title} option ${number} is one line and Thad says it`);
      }

      const named = after.join('→').match(/\**`([A-Z][A-Z_0-9]+)`\**/);
      const routed = ROUTED[title]?.[Number(number)];
      if (named && routed) {
        throw new Error(`doc 27: ${title} option ${number} names ${named[1]} and is `
          + `also routed to ${routed} -- one of the two is now wrong`);
      }
      if (named || routed) option.set = { [named ? named[1] : routed]: true };
      options.push(option);
    }

    if (options.length < 3) throw new Error(`doc 27: ${title} has ${options.length} options`);

    written.push(write(`content/dialogue/${who.tree.toLowerCase().replace(/_/g, '-')}.json`, {
      schema: 1,
      id: who.tree,
      name: title,
      note: `EXTRACTED from docs/27-minor-trees.md by tools/extract-content.mjs. Do not `
        + `edit: change doc 27 and re-run. Speakers come from the document's own `
        + `typography -- plain quotes are ${who.speaker}, italic quotes are Thad, and `
        + `an italic bracket is a stage direction nobody says.`,
      nodes: {
        root: {
          id: 'root',
          prompt: rootSpeech[0].line,
          options,
        },
      },
      start: 'root',
    }));
  }

  for (const note of directions) process.stderr.write(`  doc 27 staging: ${note}\n`);
  for (const note of unspoken) process.stderr.write(`  doc 27 UNSPOKEN: ${note}\n`);
  return written;
}

/**
 * The speech in a response cell, in order, each line with its speaker.
 *
 * The three forms are tried most-specific first, in one pass, so a bold span
 * is not read as a plain one that happens to have asterisks around it.
 */
function speech(cell, npc) {
  const out = [];
  for (const span of cell.matchAll(/\*\*"([^"]+)"\*\*|\*"([^"]+)"\*|"([^"]+)"/g)) {
    const [, bold, italic, plainSpan] = span;
    if (italic !== undefined) out.push({ speaker: 'thad', line: italic });
    else out.push({ speaker: npc, line: bold ?? plainSpan });
  }
  return out;
}

/** Italic brackets: staging, carried out of the data and reported. */
function stageDirections(cell) {
  return [...cell.matchAll(/\*\(([^)]+)\)\*/g)].map((match) => match[1]);
}

const written = [opening(), stageDriver(), combinations(), ...rooms0507(), room02Exits(),
  ...roomsBatchA(), ...minorTrees()];
if (!CHECKING) {
  for (const path of written) process.stdout.write(`extracted ${path}\n`);
} else {
  for (const path of stale) process.stdout.write(`stale: ${path}\n`);
  process.stdout.write(`${written.length} extracted file(s) checked, ${stale.length} stale\n`);
  if (stale.length > 0) process.exit(1);
}
