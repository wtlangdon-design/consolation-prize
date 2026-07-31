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

  // v3.1 restores the tree without rewriting the beat sheet, so beats 4, 5
  // and 6 still carry lines that are now the tree's four options. Marked
  // rather than deleted: the beats are what the document says happens, and
  // deleting them here would be this file overruling doc 17 quietly.
  const carried = { 4: 'STAGE_DRIVER', 5: 'STAGE_DRIVER', 6: 'STAGE_DRIVER' };

  for (const entry of beats) {
    if (flags[entry.beat]) entry.set = flags[entry.beat];
    if (carried[entry.beat]) entry.carriedBy = carried[entry.beat];
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
    note: 'EXTRACTED from docs/17-opening-sequence.md by tools/extract-content.mjs. '
      + 'Do not edit: change doc 17 and re-run. Doc 17 v3 supersedes v2\'s beat sheet and the '
      + 'stage driver\'s tree, both of which are void -- the three-option opening line is one '
      + 'canonical line played sincerely, the driver is four beats with no tree, and the act '
      + 'card moved to after the coach leaves. The lines Thad and the driver speak are the '
      + 'quoted spans of the beat cells; the attribution is recorded in the extractor and is '
      + 'forced by the doc\'s prose, not chosen.',
    unplayed: 'Doc 15 lists the scripted sequence system as unbuilt, and errata 28a\'s runner has '
      + 'five step kinds with no timed wait -- so these beats are content waiting for a player, '
      + 'not a sequence the engine can run today. Beats 2 and 7 state durations the runner has '
      + 'no step for.',
    contradiction: 'v3.1 restores the driver\'s tree without rewriting the beat sheet. Beats 4, '
      + '5 and 6 are marked carriedBy STAGE_DRIVER and are listed here as "no" -- '
      + 'non-interactive -- while the tree that now carries their lines is interactive by '
      + 'definition. Beat 3 stays automatic: v3.1 confirms the lookout exchange is genuinely '
      + 'automatic and that is the one it is modelled on. Nobody has ruled on beats 4 to 6.',
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

const written = [opening(), stageDriver(), combinations()];
if (!CHECKING) {
  for (const path of written) process.stdout.write(`extracted ${path}\n`);
} else {
  for (const path of stale) process.stdout.write(`stale: ${path}\n`);
  process.stdout.write(`${written.length} extracted file(s) checked, ${stale.length} stale\n`);
  if (stale.length > 0) process.exit(1);
}
