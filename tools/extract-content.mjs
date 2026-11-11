import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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

/**
 * QUIET EXITS (errata 225): doc 04's `## Quiet exits` table, by tree and node. While its gate holds, the node's
 * universal exit says the quiet line instead of the pool's next joke (DialogueNode.quietExit).
 */
let quietExitTable = null;
function quietExits(tree) {
  if (!quietExitTable) {
    const d04 = readFileSync(resolve(ROOT, 'docs/04-dialogue-trees.md'), 'utf8');
    const start = d04.indexOf('## Quiet exits');
    if (start < 0) throw new Error('doc 04: no ## Quiet exits section');
    const section = d04.slice(start, d04.indexOf('\n---', start));
    quietExitTable = [...section.matchAll(/^\| ([A-Z]+) \| `([A-Z0-9_]+)` \| (always|`([A-Z0-9_]+)`) \| "(.+)" \|$/gm)]
      .map((m) => ({ tree: m[1], node: m[2], flag: m[4], text: m[5] }));
    if (!quietExitTable.length) throw new Error('doc 04: ## Quiet exits has no rows');
  }
  for (const row of quietExitTable.filter((one) => one.tree === tree.id)) {
    const node = tree.nodes[row.node];
    if (!node) throw new Error(`doc 04 quiet exit: ${row.tree} has no node ${row.node}`);
    if (!(node.options ?? []).some((option) => option.universal)) throw new Error(`doc 04 quiet exit: ${row.node} has no universal exit`);
    node.quietExit = { ...(row.flag ? { when: { [row.flag]: true } } : {}), text: row.text };
  }
  return tree;
}

/**
 * GREETINGS SAID ONCE (errata 230). The repeat check (errata 226) found two openings said whole on every visit:
 * Ozymandia's "The rod has been expecting you." (three visits) and the panner's "If he sent you…" (two). Each is
 * the first visit's; later visits open on the choices.
 */
const GREETED_ONCE = { 'OZYMANDIA/OZY_A1': 'T_OZY_GREETED', 'PANNER/PAN_G1': 'T_PANNER_GREETED' };
function greetOnce(tree) {
  for (const [key, flag] of Object.entries(GREETED_ONCE)) {
    const [treeId, nodeId] = key.split('/');
    if (tree.id !== treeId) continue;
    const node = tree.nodes[nodeId];
    if (!node?.opening?.length) throw new Error(`errata 230: ${key} has no opening to say once`);
    node.openingOnce = flag;
  }
  return tree;
}

/** Errata 232: WIN_B2's first row says WIN_B4's opening after its own reply -- the assay, run at the window. */
function assayAtOnce(tree) {
  if (tree.id !== 'WINNIE') return tree;
  const row = tree.nodes.WIN_B2?.options?.find((option) => option.id === 'winnie1');
  const opening = tree.nodes.WIN_B4?.opening;
  if (!row || !opening?.length) throw new Error('errata 232: WIN_B2 option 1 or WIN_B4\'s opening is missing');
  row.exchange = [...(row.exchange ?? (row.say ? [{ speaker: tree.speaker ?? 'winnie', line: row.say }] : [])), ...opening];
  delete row.say;
  row.puzzle = { ...row.puzzle, C6: 'complete' };
  return tree;
}

function write(relative, data, indent = 2) {
  if (relative.startsWith('content/dialogue/') && data && typeof data === 'object' && data.nodes) data = asMonkeyIslandRan(assayAtOnce(greetOnce(quietExits(performDirections(data)))));
  const path = resolve(ROOT, relative);
  const wanted = `${JSON.stringify(data, null, indent)}\n`;
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

// ---------------------------------------------------------------------------
// CONVERSATIONS AS MONKEY ISLAND RAN THEM (doc 126, errata 280; Tyler,
// 2026-11-11: "I want it to be exactly like MI"). A line asked is a line gone;
// the list unfolds from the answers; a topic waits for what Thad knows. Read
// from doc 126 and applied to every tree as it is written, last, so every
// extractor's tree is run the same way.

const MI_DOC = 'docs/126-conversations-as-monkey-island-ran-them.md';
const MI_EXEMPT_TREES = new Set(['LETTERS_HOME', 'harness_tree']);
let miPlan = null;
function monkeyIslandPlan() {
  if (miPlan) return miPlan;
  const doc = read(MI_DOC);
  const trees = doc.split(/^## The trees$/m)[1];
  if (trees === undefined) throw new Error('doc 126: no "## The trees" section');
  miPlan = new Map();
  let current = null;
  for (const raw of trees.split('\n')) {
    const line = raw.trim();
    // A section that is not a tree (the read-through) ends the one before it.
    if (/^## /.test(line)) { current = null; continue; }
    const heading = /^### `?([A-Za-z0-9_]+)`?/.exec(line);
    if (heading) {
      // A tree named twice adds to what was said of it the first time (the keepers, below the trees).
      current = miPlan.get(heading[1]) ?? { waits: new Map(), flags: new Map(), stays: new Set(), goes: new Set(), added: [] };
      miPlan.set(heading[1], current);
      continue;
    }
    if (!current || !line.startsWith('- ')) continue;
    let m = /^- new `([^`]+)` in `([^`]+)` \((TOPIC|COMIC|PROGRESS)\)(?:, waits for ((?:`[^`]+`(?:, | and )?)+))?: "([^"]+)" → (.+)$/.exec(line);
    if (m) {
      const [, id, node, tag, waitsOn, text, said] = m;
      const speeches = said.split(/ \/ /).map((part) => {
        const thad = /^Thad: /.exec(part);
        const words = [...part.matchAll(/"([^"]+)"/g)].map((q) => q[1]).join(' ');
        if (!words) throw new Error(`doc 126: new ${id} has a speech with no quoted words: ${part}`);
        return { thad: Boolean(thad), line: words };
      });
      const gates = [...(waitsOn ?? '').matchAll(/`([^`]+)`/g)].map((q) => q[1]);
      current.added.push({ id, node, tag, text, speeches, gates });
      continue;
    }
    // An option is named alone, or in one node: `option` in `NODE` (ids repeat across a tree's nodes).
    m = /^- `([^`]+)`(?: in `([^`]+)`)? waits for ((?:`[^`]+`(?:, | and )?)+)/.exec(line);
    if (m) {
      const key = m[2] ? `${m[2]}/${m[1]}` : m[1];
      for (const gate of [...m[3].matchAll(/`([^`]+)`/g)].map((q) => q[1])) {
        const into = /^[A-Z][A-Z0-9_]+$/.test(gate) ? current.flags : current.waits;
        if (!into.has(key)) into.set(key, []);
        into.get(key).push(gate);
      }
      continue;
    }
    m = /^- `([^`]+)`(?: in `([^`]+)`)? stays\b/.exec(line);
    if (m) { current.stays.add(m[2] ? `${m[2]}/${m[1]}` : m[1]); continue; }
    m = /^- `([^`]+)`(?: in `([^`]+)`)? goes\b/.exec(line);
    if (m) { current.goes.add(m[2] ? `${m[2]}/${m[1]}` : m[1]); continue; }
    throw new Error(`doc 126: a line under ### that is none of the forms: ${line}`);
  }
  return miPlan;
}

function asMonkeyIslandRan(tree) {
  if (MI_EXEMPT_TREES.has(tree.id)) return tree;
  const plan = monkeyIslandPlan().get(tree.id) ?? { waits: new Map(), flags: new Map(), stays: new Set(), goes: new Set(), added: [] };
  const speaker = tree.speaker;
  const named = new Set();
  for (const add of plan.added) {
    const node = tree.nodes[add.node];
    if (!node) throw new Error(`doc 126: ${tree.id} has no node ${add.node} for new ${add.id}`);
    if (node.options.some((one) => one.id === add.id)) throw new Error(`doc 126: ${tree.id} already has ${add.id}`);
    const option = { id: add.id, tag: add.tag, afterUse: 'remove', text: add.text };
    const lines = add.speeches.map((one) => ({ speaker: one.thad ? 'thad' : speaker, line: one.line }));
    if (lines.length === 1 && !add.speeches[0].thad) option.say = lines[0].line;
    else option.exchange = lines;
    const waits = add.gates.filter((gate) => !/^[A-Z][A-Z0-9_]+$/.test(gate));
    const flags = add.gates.filter((gate) => /^[A-Z][A-Z0-9_]+$/.test(gate));
    if (waits.length) option.after = waits;
    if (flags.length) option.when = Object.fromEntries(flags.map((flag) => [flag, true]));
    option.note = 'Written by doc 126 (errata 280).';
    // Before the exits, which stay last.
    const exitAt = node.options.findIndex((one) => one.tag === 'EXIT');
    node.options.splice(exitAt < 0 ? node.options.length : exitAt, 0, option);
  }
  for (const [nodeId, node] of Object.entries(tree.nodes)) {
    for (const option of node.options ?? []) {
      const scoped = `${nodeId}/${option.id}`;
      named.add(option.id);
      named.add(scoped);
      const waits = [...(plan.waits.get(option.id) ?? []), ...(plan.waits.get(scoped) ?? [])];
      if (waits.length) option.after = [...new Set([...(option.after ?? []), ...waits])];
      const flags = [...(plan.flags.get(option.id) ?? []), ...(plan.flags.get(scoped) ?? [])];
      if (flags.length) option.when = { ...(option.when ?? {}), ...Object.fromEntries(flags.map((flag) => [flag, true])) };
      const goes = plan.goes.has(option.id) || plan.goes.has(scoped);
      if (!goes && !['TOPIC', 'COMIC'].includes(option.tag)) continue;
      if (!goes && option.afterUse && option.afterUse !== 'retain') continue;
      if (option.ends || option.end) continue;
      if (plan.stays.has(option.id) || plan.stays.has(scoped)) { option.afterUse = 'retain'; continue; }
      option.afterUse = 'remove';
      // Its second answer is no longer reached: the documents keep it (doc 126).
      delete option.repeat;
      delete option.repeats;
    }
  }
  // A follow-up is listed after what raises it, as the list unfolds (tests/follow-ups.test.ts).
  for (const node of Object.values(tree.nodes)) {
    const options = node.options ?? [];
    for (let moved = true, guard = 0; moved && guard < 50; guard += 1) {
      moved = false;
      for (const option of [...options]) {
        const at = options.indexOf(option);
        const last = Math.max(-1, ...(option.after ?? []).map((id) => options.findIndex((one) => one.id === id)));
        if (last > at) {
          options.splice(at, 1);
          options.splice(last, 0, option);
          moved = true;
        }
      }
    }
  }
  for (const id of [...plan.waits.keys(), ...plan.flags.keys(), ...plan.stays, ...plan.goes]) {
    if (!named.has(id)) throw new Error(`doc 126: ${tree.id} names ${id}, which it does not have`);
  }
  return tree;
}

// ---------------------------------------------------------------------------
// STAGE DIRECTIONS ON SCREEN (doc 58; Tyler, 2026-11-05). Every tree's reply
// that carries a performed direction plays it, in the document's order, as a
// quieter line over the character. Applied to every content/dialogue file as
// it is written, so all twelve tree extractors share one rule.

const NOTE_PATTERN = /\berrata\b|\breq\s|\bsets\s|\bdoc \d|\bpairs?\b|\bRULED\b|\bSuperseded\b|\bTyler,|→|\bthe player\b|^(second|third|fourth|fifth)\b/i;
let directionRules = null;
function directionRule() {
  if (directionRules) return directionRules;
  const doc = read('docs/58-stage-directions.md');
  const hidden = new Set();
  const section = doc.split(/^## Hidden by name$/m)[1]?.split(/^## /m)[0] ?? '';
  for (const line of section.split('\n')) {
    const item = /^- (.+)$/.exec(line.trim());
    if (item) hidden.add(item[1].trim());
  }
  if (!hidden.size) throw new Error('doc 58: no "Hidden by name" list');
  directionRules = { hidden };
  return directionRules;
}

/** One direction's fate: null (a note, hidden), '…' (a bare pause), or its words. */
function performedDirection(text) {
  const words = text.trim();
  if (NOTE_PATTERN.test(words) || directionRule().hidden.has(words)) return null;
  if (/^(beat|pause|long pause)$/i.test(words)) return { line: '…', direction: false };
  return { line: words, direction: true };
}

/** Docs 04 and 27, indexed: `${node or tree id}::${option text}` to the reply cell. */
let replyIndex = null;
function replyCells() {
  if (replyIndex) return replyIndex;
  replyIndex = new Map();
  const add = (keys, text, cell) => { for (const key of keys) if (!replyIndex.has(`${key}::${text}`)) replyIndex.set(`${key}::${text}`, cell); };
  for (const [file, treeHeading] of [['docs/04-dialogue-trees.md', false], ['docs/27-minor-trees.md', true]]) {
    let keys = [];
    for (const line of read(file).split('\n')) {
      const heading = /^(#+)\s+(.+)$/.exec(line);
      if (heading) {
        const ids = [...heading[2].matchAll(/`([A-Z]{2,4}_[A-Z0-9]+)`/g)].map((m) => m[1]);
        if (ids.length) keys = ids;
        else if (treeHeading && heading[1] === '#') {
          const title = heading[2].split('·')[0].trim();
          keys = [`${title.replace(/[^A-Z ]/g, '').trim().replace(/\s+/g, '_')}/root`];
        }
        continue;
      }
      const row = /^\|\s*\d+\s*\|(.*)$/.exec(line);
      if (!row || !keys.length) continue;
      const cells = row[1].split('|').map((cell) => cell.trim());
      const text = /"([^"]+)"/.exec(cells[0] ?? '')?.[1];
      if (text && cells[2] !== undefined) add(keys, text, cells[2]);
    }
  }
  return replyIndex;
}

/** A reply cell, in order: speech and performed directions. */
function performedSequence(cell, npc) {
  const first = cell.split(/\*\((?:again|second|third|fourth|fifth)\)\*/)[0].split('→')[0];
  const out = [];
  for (const span of first.matchAll(/\*\(([^)]+)\)\*|\*\*"([^"]+)"\*\*|\*"([^"]+)"\*|"([^"]+)"/g)) {
    const [, direction, bold, italic, plainSpan] = span;
    if (direction !== undefined) {
      const shown = performedDirection(direction);
      if (shown) out.push({ speaker: npc, line: shown.line, ...(shown.direction ? { direction: true } : {}), staged: true });
    } else if (italic !== undefined) out.push({ speaker: 'thad', line: italic });
    else out.push({ speaker: npc, line: bold ?? plainSpan });
  }
  return out;
}

const directionReport = [];
function performDirections(tree) {
  const index = replyCells();
  for (const [nodeId, node] of Object.entries(tree.nodes ?? {})) {
    for (const option of node.options ?? []) {
      // LINES ANOTHER DOCUMENT ADDS AFTER THE REPLY (errata 245: doc 118's notice handed over after doc 04's reply) are
      // laid on once doc 04's own directions are in, so the reply is still compared with its own cell.
      const tail = option.thenAfter;
      delete option.thenAfter;
      performOne(tree, nodeId, option, index);
      if (tail?.length) {
        option.exchange = [...(option.exchange ?? (option.say ? [{ speaker: tree.speaker ?? '', line: option.say }] : [])), ...tail];
        delete option.say;
      }
    }
  }
  return tree;
}
function performOne(tree, nodeId, option, index) {
  {
    {
      if (!option.text || option.beat || option.rephrase) return;
      const cell = index.get(`${nodeId}::${option.text}`) ?? index.get(`${tree.id}/${nodeId}::${option.text}`);
      if (!cell) return;
      const npc = tree.speaker ?? '';
      const sequence = performedSequence(cell, npc);
      if (!sequence.some((one) => one.staged)) return;
      const existing = option.exchange ?? (option.say ? [{ speaker: npc, line: option.say }] : []);
      const spoken = sequence.filter((one) => !one.staged);
      const agrees = spoken.length === existing.length && spoken.every((one, at) => one.line === existing[at].line);
      if (!agrees) {
        directionReport.push(`${tree.id}/${nodeId}/${option.id}: its extractor reads the reply differently; directions left off`);
        return;
      }
      let at = 0;
      const merged = sequence.map((one) => {
        if (one.staged) { const { staged, ...line } = one; return line; }
        return existing[at++];
      });
      delete option.say;
      option.exchange = merged;
    }
  }
}

/** Strips markdown emphasis, leaving the words and their punctuation. */
function plain(text) {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
}

/** Every double-quoted span in a cell, in order. */
function quoted(text) {
  return [...text.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

/**
 * FOLLOW-UP OPTIONS (Tyler, 2026-11-01). A tag cell may say `after 2` or
 * `after 2, 3`: the option is offered only once those options of the same
 * node have been asked. Returns the option ids, or undefined.
 */
function afterIds(tagCell, speaker) {
  const found = /\bafter ([0-9][0-9, ]*)/.exec(tagCell ?? '');
  if (!found) return undefined;
  return found[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => `${speaker}${n}`);
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
    // A BEAT NUMBER MAY CARRY A LETTER. Doc 17 added beat 6b -- the coach
    // departing -- and this pattern demanded \d+, so the new beat was
    // dropped without a word. The guard below counted ten beats and still
    // counted ten, because it was written against the old table and now
    // certifies a table it no longer describes: it counts the rows found,
    // not the rows present.
    const row = line.match(/^\| (\d+[a-z]?) \| (.+?) \| (.+?) \| (.+?) \|$/);
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
      // The id stays a STRING so "6b" survives. Sorting and the flag routing
      // below both key on it, and a Number("6b") is NaN.
      beat: number,
      description: plain(beat),
      control: { menu: 'menu', no: 'none', yes: 'player' }[word],
      seconds: seconds ? Number(seconds[1]) : undefined,
      note: plain(notes),
      quoted: quoted(beat),
    });
  }
  // Counted against the DOCUMENT rather than against a number written here.
  // A literal 10 is a claim about the table that stops being true the moment
  // somebody adds a beat, and it stayed true through beat 6b being dropped.
  const rows = (doc.match(/^\| \d+[a-z]? \| /gm) ?? []).length;
  if (beats.length !== rows) {
    throw new Error(`doc 17: ${rows} beat rows in the table, ${beats.length} extracted`);
  }

  const DRIVER = 'stage_driver';
  const THAD = 'thad';
  const HOB = 'hob';
  const speech = {
    // ERRATA 157's stars: the doc's note says the driver speaks first and
    // last and Thad asks, so the five alternate from the driver.
    '1b': [[DRIVER, 0], [THAD, 1], [DRIVER, 2], [THAD, 3], [DRIVER, 4]],
    3: [[THAD, canonical[1]], [DRIVER, punctured[1]]],
    4: [[DRIVER, 0], [THAD, 1], [DRIVER, 2]],
    5: [[DRIVER, 0]],
    6: [[DRIVER, 0], [THAD, 1]],
    9: [[HOB, 0], [THAD, 1], [HOB, 2]],
    // The mud beat. Both his, and both quoted in the doc's own beat 11 row.
    11: [[THAD, 0], [THAD, 1], [THAD, 2], [THAD, 3]],
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
  //
  // T_CASE_DOWN IS NOT HERE, AND ITS ABSENCE IS THE FIX. Doc 17 beat 6 opens
  // "The case goes in the mud", so the write was put on the beat -- but
  // NOTHING MOVES THE CASE. There is no mover for it and no state swap; it
  // sits on the roof through the whole opening. The flag gates `case_mud`, so
  // writing it made a suitcase in the mud interactable where there is no
  // suitcase, and `case_roof` -- gated on the same flag being false --
  // disappear from under the case that is actually there. Reported from a
  // play-through as "the case is interactable where it is not".
  //
  // A FLAG MUST NOT CLAIM SOMETHING THAT HAS NOT HAPPENED. The write belongs
  // to whatever puts the case in the mud, on the day something does; until
  // then the truthful state is the one the picture shows. Filed as the case
  // never leaving the roof, which is a separate and larger gap.
  const flags = {
    '3': { T_OPENING_SAID: true },
    // THE CASE COMES DOWN AT BEAT 6, and the write is honest again. It was
    // removed because nothing moved the case and a flag must not claim what
    // the picture does not show; the case is its own drawn layer now, gated on
    // this, so writing it IS the case moving. Q11 as ruled: roof to mud to
    // hand, and then it is inventory.
    '6': { T_CASE_DOWN: true },
    // HOB IS ON SCREEN FROM THE END OF BEAT 7, so the flag that says so is
    // written there rather than at beat 9. It was on beat 9 because he used to
    // walk in during it; he now stands at the roadside before the player is
    // given control, and `lamp` -- gated on this being true and T_HOB_GONE
    // false -- has to be live for as long as he is standing in the picture.
    //
    // An automatic segment's writes land when the segment COMPLETES, so this
    // arrives exactly as beat 8 hands over control.
    // HE IS ON SCREEN FROM BEAT 2, so the flag that says so is written there.
    // Beat 1 is the title screen and `beginOpening` filters the menu segment
    // out of the opening entirely, so BEAT 2 IS THE FIRST BEAT THAT PLAYS and
    // "place him in the first beat" means this one.
    '2': { T_HOB_CROSSING: true },
    // AND T_HOB_GONE WAS WRITTEN NOWHERE AT ALL, which is why the lamp stayed
    // interactable after he had left and `lamp_gone` -- the response written
    // for exactly that moment -- could never appear. Beat 10 is where he has
    // gone: the carrier applies a beat's writes as it reaches it, and it
    // reaches beat 10 when beat 9's last walk has finished carrying him off
    // frame right. The flag's lifetime now matches the object's.
    '10': { T_HOB_GONE: true },
  };

  // v3.1 restored the tree without rewriting the beat sheet around it, so the
  // table still calls beats 4, 5 and 6 non-interactive while the tree that
  // carries their lines is interactive by definition. ERRATA 30b corrects the
  // table: those three beats ARE interactive, carriedBy is the right
  // annotation, and beat 3 stays automatic. Applied here rather than in the
  // doc so the correction is one ruling in one place.
  const carried = { '4': 'STAGE_DRIVER', '5': 'STAGE_DRIVER', '6': 'STAGE_DRIVER' };

  // WHICH BEATS WAIT FOR THE PLAYER RATHER THAN FOR A CLOCK.
  //
  // Doc 17 beat 9 is Hob's exchange, and he no longer crosses the road saying
  // it at whoever happens to be standing there. He waits at the roadside and
  // speaks when he is SPOKEN TO, so the beat is a response.
  //
  // THE WORDS DO NOT MOVE. They stay in doc 17 beat 9 where the beat sheet has
  // them, and only WHEN the beat begins changes. A dialogue tree on Hob would
  // have been the cheaper mechanism and would have moved three lines out of
  // the document that owns the opening -- a content decision, not an
  // implementation one.
  //
  // HOLDING IT FOREVER BREAKS NOTHING, checked before it was built.
  // `playOpeningSegment` calls `finishOpening` -- control handed over, the
  // done flag written, autosaved -- and only THEN arms the carrier. The
  // opening is genuinely over at beat 8; 9 and 10 are ordinary play that the
  // carrier happens to be driving. A player who never speaks to him leaves a
  // man standing at the roadside with his lamp, which is the truthful state.
  // A beat that holds until a player action writes a flag. Beat 9 is Hob's
  // exchange; beat 11 is the departure, which waits on the player taking the
  // west exit -- an exit that no longer travels, because one that moves you the
  // instant you touch it cannot also be a departure you watch.
  //
  // NOTHING WRITES T_THAD_LEAVING YET. Beat 11 therefore holds forever, which
  // is the truthful state of an unbuilt beat rather than a stall: the opening
  // is over at beat 8 and everything after it is ordinary play the carrier
  // happens to be driving.
  const awaits = { '9': 'T_HOB_SPOKEN', '11': 'T_THAD_LEAVING' };

  /**
   * WHERE THE BEATS HAPPEN. Doc 17 says what occurs; these say where, and they
   * live here for the same reason `doneFlag` does -- so no .ts file carries a
   * coordinate and no prose document carries a pixel.
   *
   * Every beat carried NO staging until now, so the opening played as spoken
   * lines over a still picture: Thad never climbed down, the driver never
   * moved, Hob never crossed, and the coach vanished rather than leaving. The
   * mechanism was complete and tested the whole time. The marks were never
   * written.
   *
   * The numbers are measured, not invented. The walkable band is 660-864 and
   * the walk box x256-1629, both approved on sight. The coach is 956x389 at
   * x190 with its wheels on the road at y742, derived from 240px per man. The
   * depth curve runs 222 at y660 to 263 at y830. Q4 ruled Room 1's ORIGINAL
   * numbers not a specification; these are not those numbers.
   */
  const staging = {
    // THE COACH STANDS AT x1390, not 646. Its hotspot is x1152-1632 and
    // case_roof is at x1236; at 646 the sprite sat on the left of the frame
    // while clicking it targeted empty road on the right. Placed at 1390 with
    // anchor[0] 478 it spans world x912-1868, and its own features fall at:
    //
    //    doorway   x1008 - 1341
    //    driver    x1332 - 1364
    //    horses    x1485 - 1866
    //
    // Every position below is measured against those, not guessed.
    // ERRATA 106: THE OPENING'S SOUNDS (doc 45 O-02-S2, O-06-S1, O-06B-S,
    // O-09-M). The coach is already standing when beat 2 opens -- it is placed,
    // not driven in -- so the team's sound starts at the halt: breathing and
    // harness, held until the first stride of 6b. O-02-S1, the moving team, has
    // no arrival to go with and is not played.
    // ERRATA 157: THE FIRST SHOT IS THE SKY. Tyler, 2026-11-07, of the jump
    // from the title straight into the first line: "maybe the camera pans
    // down from a starry sky to find Thad standing there in the mud ... that
    // would be the coolest way to start", with voices in the dark before it.
    // Everyone is placed first, under the sky, so the view comes down onto a
    // scene that is standing there waiting; the team's breathing (O-02-S2,
    // moved here from beat 2) is heard from the stars.
    '1b': [
      { do: 'cue', cue: 'O-02-S2' },
      { do: 'move', actor: 'hob', from: [600, 720], to: [600, 720], seconds: 0.1 },
      { do: 'move', actor: 'coach', from: [1390, 742], to: [1390, 742], seconds: 0.1 },
      { do: 'setState', object: 'coach', state: 'door-open' },
      { do: 'move', actor: 'thad', from: [1180, 762], to: [1180, 762], seconds: 0.1 },
      { do: 'face', actor: 'thad', facing: 'front' },
      { do: 'sky' },
      // The stars, a held beat, before anyone speaks (Tyler, 2026-11-07: "The night sky at the beginning
      // needs to hold for a beat before the first dialogue line pops up").
      // Measured: at 4.5 the first line came 4.25 s after NEW GAME, because the wait runs under the fade in.
      { do: 'wait', seconds: 6.5 },
      { do: 'say', line: 0 },
      { do: 'say', line: 1 },
      { do: 'say', line: 2 },
      { do: 'say', line: 3 },
      { do: 'say', line: 4 },
      { do: 'wait', seconds: 0.8 },
    ],
    2: [
      // HE WALKS A FEW STEPS FORWARD BEFORE HE SPEAKS, once the view has come
      // down: errata 157's pan holds the beat, so he steps down only once the
      // camera has settled, and beat 3 keeps its 1.4 s before the first line.
      { do: 'pan', seconds: 5.5 },
      { do: 'walk', actor: 'thad', to: [1170, 812] },
      { do: 'face', actor: 'thad', facing: 'front' },
    ],
    // BEAT 3: forward and right, to IN FRONT OF the driver's box rather than
    // beside it. The driver sits at x1332-1364 and the horses begin at 1485;
    // there is no room to stand between them, so he stands ahead of both.
    3: [
      // A BEAT BEFORE HE SPEAKS. He walks forward in beat 2 and the line
      // arrived the instant he stopped, which reads as hurried -- and this is
      // the first line in the game.
      { do: 'wait', seconds: 1.4 },
      { do: 'say', line: 0 },
      // then a moment, then he crosses to the driver's right
      { do: 'wait', seconds: 1.2 },
      { do: 'walk', actor: 'thad', to: [1420, 830] },
      { do: 'face', actor: 'thad', facing: 'left' },
      // A HELD POSE, NOT A CHORE, and the difference is the whole beat. A
      // chore is a one-shot of frames/reactRate: `lookup` is 6 frames at 7,
      // so it raised his head for 0.86s and dropped it BEFORE THE DRIVER
      // ANSWERED. He has to still be looking up while the man he is looking
      // up at replies.
      //
      // Q75. The mechanism was already here and already proven one object
      // over: the coach's door is `setState` at beat 2, never cleared, held
      // through beat 6 -- a held pose across this same conversation. `lookup`
      // is registered as a STATE of the clip he is already playing rather
      // than as its own clip id, so it is the idle he stands in, at the
      // raised head, breathing.
      //
      // AND LEAVING THE OLD `chore lookup` HERE FROZE THE OPENING ON ITS
      // FIRST LINE. The step named a clip id that stopped existing the moment
      // the pose was made holdable: `lookup` became idle/left/lookup, and a
      // chore asking for it asked for a clip nothing declares. R5k in the
      // staging rather than in a coordinate -- a NAME that was correct when
      // written and stopped being correct when something else moved.
      { do: 'setState', object: 'thad', state: 'lookup' },
      { do: 'say', line: 1 },
    ],
    6: [
      // O-06-S1: the case hits the mud, and the fork inside rings its A.
      { do: 'cue', cue: 'O-06-S1' },
      { do: 'face', actor: 'thad', facing: 'right' },
      { do: 'chore', actor: 'thad', clip: 'pickup-low' },
    ],
    // BEAT 6b HOLDS HIM IN `carry` WHILE THE COACH GOES, and that one moment
    // is the whole reason the clip exists. Q11 ruled the case is an inventory
    // abstraction -- no carry locomotion, because that is 36 frames of stand
    // and walk in four facings and the next thing he does is walk away from us
    // at 98px tall where none of it would be seen -- with ONE exception, and
    // this is it.
    //
    // The bible's opening image is "a stage coach pulls away, revealing a
    // young man in a good coat standing in mud, holding a case." That is this
    // beat. `carry` is a single held pose and serves it exactly: he holds it
    // while the coach leaves, and it is in the panel afterwards.
    // BEAT 6b: errata 38's whole reason for existing. It LEAVES; it does not
    // vanish. `from` places the mover -- `walk` never places, only `move` does.
    // No `from` here: beat 2 placed it, and repeating the placement would
    // teleport it back to its mark if anything had nudged it.
    '6b': [
      // HE STOPS LOOKING UP WHEN THE COACH LEAVES. This clear was on beat 6
      // and could never fire: setState is fenced to beats whose control is
      // `none` and beat 6 is `player`, so the state was set and never unset.
      // He looked up permanently -- and because it lives on idle/left, it came
      // back every time he turned left for the rest of the game.
      { do: 'setState', object: 'thad' },
      { do: 'setState', object: 'coach' },
      // O-06B-S: the standing team's bed stops on the first stride, and the
      // team, the wheels and the axle go with the coach.
      { do: 'cue', cue: 'O-06B-S' },
      { do: 'move', actor: 'coach', to: [3000, 742], seconds: 3 },
    ],
    // BEAT 7 NO LONGER TOUCHES HIM -- he has stood at the roadside since beat
    // 2. Kept as an EMPTY list rather than deleted so the beat still lasts as
    // long as doc 17 says: `stagingTakesTime` is false for an empty list, so
    // the stated three seconds are emitted and the act card holds over them.
    //
    // WHAT WAS HERE, for the next person: he was placed off frame LEFT and
    // glided in.
    //
    // He used to be placed off frame left and glide to x60, then cross to
    // x1080 during beat 9 to speak. That put him on screen for about four
    // seconds around a three-line exchange, and a man who arrives, says three
    // sentences and leaves is an event rather than a neighbour. Ruled from a
    // play-through: he is part of the picture BEFORE he speaks.
    //
    // It also fixes the lamp. `lamp` is gated on T_HOB_CROSSING true and
    // T_HOB_GONE false, and while that window was the few seconds of a
    // crossing it was unreachable in practice -- the object existed for less
    // time than it takes to choose a verb.
    //
    // from == to PLACES HIM WITHOUT MOVING HIM, the same shape beat 2 uses for
    // the coach: `walk` never creates a mover, only `move` places one, and
    // errata 38 fences `move` to beats whose control is `none`. Beat 7 is the
    // last such beat before control, which is why it is here and not beat 8.
    7: [],
    // BEAT 9: he crosses, STOPS to speak, and goes on. Three lines from a man
    // who never breaks stride is not the beat -- and until `say` could be
    // STAGED, neither was this: a beat's lines were appended after all of its
    // staging, so he touched his mark for one tick, walked to 2100, and spoke
    // all three from 180px beyond the right edge of the frame.
    //
    // THE INDICES ARE THE LINES DOC 17 GIVES THIS BEAT, in its order: Hob,
    // Thad, Hob. No text here -- the words stay in the document, this says
    // only when each lands. An index with no line behind it throws at
    // extraction rather than playing silence.
    9: [
      // O-09-M: THE STRIKE, once, distant, as Hob begins to cross (doc 28 Room 1).
      { do: 'cue', cue: 'O-09-M' },
      // NO WALK IN, AND IT DOES NOT BEGIN UNTIL HE IS SPOKEN TO. He has been
      // standing since beat 2; the beat is what it says it is -- an exchange,
      // and then he goes on. See `awaits`.
      { do: 'say', line: 0 },
      { do: 'say', line: 1 },
      { do: 'say', line: 2 },
      // HE TURNS BEFORE HE WALKS, and this is the cheap half of a two-part
      // problem. His `stand` is a THREE-QUARTER pose and his `walk` is a right
      // PROFILE, so going straight from one to the other is a turn and a step
      // in the same frame -- reported as a snap. `setFacing` holds
      // TURN_SECONDS before a turn resolves, so a `face` here buys a fifth of
      // a second of standing in the new direction before the profile appears.
      //
      // TRIED FIRST BECAUSE IT IS FREE AND REVERSIBLE. One staged step, no
      // engine change, no art. If a fifth of a second is not enough the answer
      // is a three-quarter-to-profile turn frame, which is a generation --
      // so this is the thing to watch before commissioning that.
      { do: 'face', actor: 'hob', facing: 'right' },
      { do: 'walk', actor: 'hob', to: [2100, 700] },
    ],
    // BEAT 10 STAGES NOTHING, deliberately. Going west is the player's move to
    // make; it previously walked the protagonist during a player-control beat.
    //
    // BEAT 11 IS THE ENDING. It waits on T_THAD_LEAVING, which road_west
    // writes when the player takes it, and it does the travel itself at the
    // end -- which is why road_west declares `travelWhenTold` and does not go
    // anywhere on its own. An exit that moves you the instant you touch it
    // cannot also be a departure you watch.
    //
    // THE ROUTE LEAVES THE WALK BOX, so it is a `move` and not a `walk`:
    // errata 38's own case, a mover crossing no walk box at all. `move`
    // already plays the walk cycle -- `glideTo` sets the glide, `isWalking` is
    // true while it holds, and `clip` returns `walk` whenever `isWalking` --
    // and it faces toward the destination first, which up the hill is
    // dominant-vertical and resolves to `back`. thad-walk-back exists in all
    // four facings. No new step kind, and the gait advances from distance now,
    // which is why that fix came first.
    //
    // x575 IS THE GAP IN THE FENCE, measured off the plate with a ruler:
    // x500-650, centre 575. y500 is where the depth curve's third sample puts
    // him at 98px -- a man well up the road, still walking when Main Street
    // arrives rather than shrunk to nothing.
    //
    // SIX SECONDS. The title comes up over the mountains while he goes, and
    // the walk is what the credits are authored to rather than the other way
    // round.
    11: [
      // THE MUD BEAT, AND IT IS WHY THE PROLOGUE HAS AN ENDING RATHER THAN A
      // FADE. Tyler played the opening and reported that Thad simply drifts
      // off toward the town; there was no moment of setting out.
      //
      // He faces the road, says the earnest thing, tries to take the first
      // step of the rest of his life, and the mud has his boot.
      //
      // HE KEEPS HIS BACK TO US AND ROCKS, and it took three versions. Head-on
      // the first strain SANK him -- 8 source pixels, three at his drawn
      // height -- and read as nothing, because a man facing away has no
      // forward to lean into that a camera behind him can see. In profile it
      // read perfectly and looked wrong in the game: he turned away from the
      // town to get stuck, then turned back to leave.
      //
      // Working a boot free SIDEWAYS is the same action from the one angle
      // that shows it. 9 degrees each way about the hips, 107 source pixels of
      // head travel, 45 drawn, crossing centre both ways -- a rock that only
      // goes one way is a lean.
      //
      // He is already facing back when the beat starts, from the exit's own
      // walkTo, and the `face back` below is what holds him there.
      //
      // THE PHYSICAL ATTEMPT IS THE POINT. A pause with no movement in it
      // reads as the game having frozen, and that failure costs more than the
      // joke earns.
      // FACING FIRST, because `strain` is drawn back-facing only. He already
      // arrives this way from the exit's own walkTo, and leaving it implicit
      // would make the beat depend on a coordinate in another file.
      { do: 'face', actor: 'thad', facing: 'back' },
      { do: 'say', actor: 'thad', line: 0 },
      // A discreet one, which a man would rather nobody saw. 23 drawn pixels.
      { do: 'chore', actor: 'thad', clip: 'tug' },
      // THE SILENCES ARE THE CONTENT, which is errata 30a's own argument for
      // granting `wait` at all -- and beat 11's control is `none`, which is
      // the fence that makes it legal here. Without them the three attempts
      // run together into one animation and none of them is a decision.
      { do: 'wait', seconds: 0.7 },
      { do: 'say', actor: 'thad', line: 1 },
      // Determined, and still preserving his dignity. 45.
      { do: 'chore', actor: 'thad', clip: 'strain' },
      // Longer: this is the one where he looks down at it.
      { do: 'wait', seconds: 1.1 },
      { do: 'say', actor: 'thad', line: 2 },
      // Inelegant, and it works. 76 drawn pixels against the tug's 23.
      { do: 'chore', actor: 'thad', clip: 'wrench' },
      { do: 'say', actor: 'thad', line: 3 },

      // HE FACES AWAY AND STAYS THAT WAY. Errata 55: "with his back to us."
      // The path wanders left and right up the road -- x goes 575, 581, 537,
      // 464, 517, 598, 704, 772, 826 -- so a walk that re-faced itself on each
      // leg would turn him side-on four times on the way out of the game.
      // `path` never re-faces; this sets it once.
      // THE TRACED PATH, replacing a six-second glide to one fixed point.
      // The move took him to [575,500] at whatever height the depth curve's
      // provisional third sample gave, and stopped him in the field.
      { do: 'path', actor: 'thad', path: 'content/sequences/beat11-path.json' },
      // AND THEN THE TRAVEL, through the exit that declined to do it itself.
      //
      // IT WAS `interact road_west WALK_TO` AND THAT WALKED HIM BACK DOWN.
      // `interact` resolves the verb where it stands, and doc 22 section 6
      // walks to a target's own `walkTo` first -- road_west's is [575, 710],
      // just inside the band. So the beat spent forty seconds taking him up
      // the road and then walked him back to the fence before travelling.
      { do: 'travel', through: 'road_west' },
    ],
  };
  for (const entry of beats) {
    if (flags[entry.beat]) entry.set = flags[entry.beat];
    if (staging[entry.beat]) entry.staging = staging[entry.beat];
    if (awaits[entry.beat]) entry.awaitFlag = awaits[entry.beat];
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
  // A STAGED `say` NAMES ONE OF ITS OWN BEAT'S LINES BY INDEX, and this is
  // where that stops being a convention. The staging table lives in this file
  // so that no .ts holds a coordinate and no prose document holds a pixel; a
  // `say` carrying a string would invert it exactly, putting dialogue in a
  // tool and leaving doc 17 as one of two places the words live. Two places
  // holding the same fact is how every pair of documents in this project has
  // drifted.
  //
  // So the step holds a number, and a number can be checked. Run after the
  // lines are attached, because until then there is nothing to check against.
  for (const entry of beats) {
    for (const staged of entry.staging ?? []) {
      if (staged.do !== 'say') continue;
      const count = (entry.lines ?? []).length;
      if (!Number.isInteger(staged.line) || staged.line < 0 || staged.line >= count) {
        throw new Error(
          `doc 17 beat ${entry.beat}: staging says "say ${staged.line}" and the beat has `
          + `${count} line(s). A staged say names one of the beat's OWN lines by index and `
          + 'carries no text -- the words stay in doc 17. Renumber the staging, or write the '
          + 'line in the document.',
        );
      }
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
    // ASKED AGAIN (errata 172): a response may end with *(again)* "...", the driver's answer to the same question
    // twice, so nobody in the game's first conversation says the same thing word for word.
    const [first, again] = row.response.split('*(again)*');
    const repeat = again ? /"([^"]+)"/.exec(again)?.[1] : undefined;
    const spans = [...first.matchAll(/(\*+)?"([^"]+)"(\*+)?/g)].map((match) => ({
      line: match[2],
      italic: match[1] === '*' && match[3] === '*',
    }));
    if (spans.length === 0) throw new Error(`doc 17 v3.1: option ${index + 1} has no response`);

    const option = {
      id: `drv${index + 1}`,
      text: row.text,
      tag: row.tag,
      ...(repeat ? { repeat } : {}),
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

  // THE EXIT IS NOT THE FIRST THING YOU CAN CLICK. Doc 17 v3.1 gives this tree
  // four options to teach four things -- that dialogue branches, that a comic
  // option costs nothing and still answers, that one option ends a scene -- and
  // the fourth taught alone. A player who takes the exit first has been taught
  // that a conversation is a thing you leave, which is the opposite lesson, and
  // it is the FIRST conversation in the game.
  //
  // SO IT ARRIVES WHEN THE OTHERS HAVE BEEN ASKED. A gated option is not drawn
  // at all, so the list is three questions and then four; nothing greys, nothing
  // reshuffles, and doc 04 rule 4 is untouched -- an option that has never been
  // available is not an option that was removed.
  //
  // IT CANNOT STRAND HIM. Nothing removes an option once it is present (errata
  // 37 revoked), so the three are always askable and the fourth always arrives.
  // The count is the only reachability condition in the tree.
  //
  // AND THE COUNT IS A COUNT, NOT A SET. `add` applies on every selection --
  // the runner says so, deliberately, so counter-style options keep counting --
  // so asking one question three times opens the exit as surely as asking three
  // once. That is a live consequence rather than an oversight: it costs the
  // player nothing and it keeps this to one flag. Exactness here is three
  // booleans and Tyler's call, not the extractor's.
  const asked = options.filter((option) => option !== exit);
  if (asked.length !== 3) {
    throw new Error(`doc 17 v3.1: expected three options besides EXIT, found ${asked.length}`);
  }
  for (const option of asked) option.add = { ...option.add, T_DRIVER_ASKED: 1 };
  exit.when = { T_DRIVER_ASKED: { atLeast: asked.length } };

  return write('content/dialogue/stage-driver.json', {
    schema: 1,
    id: 'STAGE_DRIVER',
    name: 'THE STAGE DRIVER',
    // WHO ANSWERS, by speaker id. An option's `exchange` names a speaker per
    // line; its own `say` and `repeat` do not, and reported null -- so every
    // line in this tree drew in the fallback ink, which is Thad's. The tree
    // is the driver's and the answers are his; this says so once rather than
    // being inferred at each option.
    speaker: 'stage_driver',
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
    // ONE WRITER PER ROOM. Once a room has an annotation, tools/compile-room.mjs
    // builds its whole file from the documents -- doc 25 included, with doc 30
    // section 5's line splitting -- and a second writer laying the same lines
    // down unsplit would flip the file on every alternate run. Room 7 has no
    // annotation yet, so this still carries its lines until it does.
    if (existsSync(`reference/room-${String(number).padStart(2, '0')}/annotation.json`)) {
      process.stderr.write(`  doc 25 room ${number}: owned by compile-room (annotation exists), skipped\n`);
      continue;
    }
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

  // A PAIR THAT OPENS A TREE INSTEAD OF SAYING A LINE. Doc 24 rule 4 wants a
  // written line behind every pair; errata 66 A-C make C5's line WIN_B2's
  // authored opening, launched by the action itself, so its row carries a
  // direction and no quote. Its routing (ids, the puzzle it completes, the
  // tree it opens, what it needs first) is authored HERE, as the Winnie
  // tree's entry gates are, because the document names people and places
  // and the engine needs ids.
  const OPENING_PAIRS = {
    'C5|THE SUBMISSION LOG|Winnie': {
      item: 'padded_log', room: 'assay_office', target: 'winnie', puzzle: 'C5',
      // ERRATA 124 (the fairness audit): it waits on THE LOG -- what Winnie
      // was promised and the log's own LOOK says she will want -- not on C4,
      // which completes only on the portrait drawer, a funeral-day search
      // nothing points at. Gated on C4 the right item on the right person was
      // refused with "That accomplishes nothing I can see."
      requiresFlags: { T_QUEUE_PADDED: true }, completes: 'C5', opens: 'WINNIE',
      // SHE KEEPS IT (errata 247): she is reading it, and counting. The item follows this flag (GIVEN_AWAY).
      set: { T_LOG_WITH_WINNIE: true },
      note: 'ERRATA 66 A-C: SHOW / USE the submission log on Winnie is C5. The target is the room\'s ambient character, not a hotspot. No `say`: the pair\'s line is WIN_B2\'s opening, which the action launches at once. She keeps the log (errata 247). With C5 complete the pair yields to the ordinary pools (doc 36 Q113).',
    },
  };
  // ERRATA 274 (doc 124, proposal 1; Tyler, 2026-11-10: "You decide"): the obituary is asked for by handing Frame
  // the death certificate, the way the log is shown to Winnie. Only between the recorded death and the obituary;
  // after it, the certificate on Frame falls to the ordinary pools. TALK TO still opens FRA_E1.
  OPENING_PAIRS['E5|THE DEATH CERTIFICATE|Frame'] = {
    item: 'death_certificate', room: 'clarion', target: 'frame', puzzle: 'E5',
    requiresFlags: { T_DECEASED: true, T_OBITUARY: false }, opens: 'FRAME',
    note: 'ERRATA 274: THE DEATH CERTIFICATE on Frame opens FRA_E1, the obituary. The target is the room\'s ambient character. No `say`: the pair\'s line is FRA_E1\'s opening. He hands it back; it is wanted at the county window (F5). TALK TO opens the same node, for a player who does not think of it.',
  };
  const pairs = [];
  const opening = [];
  for (const line of doc.split('\n')) {
    const row = line.match(/^\| \*\*([A-F]\d+)\*\* \| (.+?) \| (.+?) \|$/);
    if (!row) continue;
    const combo = row[2].match(/^([A-Z '’]+?) on \*\*(.+?)\*\*$/);
    const say = row[3].match(/^"(.+?)"/);
    if (say) { pairs.push({ puzzle: row[1], item: combo[1].trim(), target: combo[2].trim(), say: say[1] }); continue; }
    const key = `${row[1]}|${combo[1].trim()}|${combo[2].trim()}`;
    const routed = OPENING_PAIRS[key];
    if (!routed) throw new Error(`doc 24: the pair "${key}" has no line and no routing that opens a tree`);
    const direction = /\*\(→ opens `([A-Z_0-9]+)`/.exec(row[3]);
    if (!direction) throw new Error(`doc 24: the pair "${key}" names no tree to open`);
    opening.push({ ...routed, opensNode: direction[1] });
  }
  // A PAIR A LATER DOCUMENT REWROTE keeps its routing here, because the file
  // on disk now holds the rewrite and no longer carries doc 24's line to find
  // it by. The rewrite replaces the pair further down (doc 54 A5's blanket).
  const SUPERSEDED_PAIRS = {
    'A5|HORSE BLANKET|the hole': { item: 'blanket', room: 'prosperity', target: 'hole', puzzle: 'A5' },
  };
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
  const rebuilt = [...[...pairs, ...nulls].map((pair) => {
    const routed = placed.get(pair.say) ?? SUPERSEDED_PAIRS[`${pair.puzzle}|${pair.item}|${pair.target}`];
    if (!routed) throw new Error(`doc 24: no routing on file for "${pair.say.slice(0, 40)}..."`);
    return { ...routed, say: pair.say };
  }), ...opening];
  // DOC 57 A8: THE NUGGET PIANO ANSWERS BY CIRCUMSTANCE. Its five cases are
  // the document's `> **THE PIANO** · USE THE TUNING FORK, *case* — ...`
  // lines; their WORDS are read from there. Which flag or item each case
  // tests, and what it gives, is routing, authored here the way OPENING_PAIRS
  // is, in the order the cases must be tried: a visit's tuning first (the
  // piano is flat again each time he comes back -- the room's onEnter clears
  // T_NUGGET_PIANO_TUNED), then the fee still in his pocket, then the count.
  const tuned = { T_NUGGET_PIANO_TUNED: true };
  const paid = { T_NUGGET_PIANO_PAID: 1 };
  const A8_CASES = [
    ['already tuned this visit', { when: { T_NUGGET_PIANO_TUNED: true } }],
    ['already holding THE FILING FEE', { holds: ['filing_fee'], set: tuned }],
    ['first time', { when: { T_NUGGET_PIANO_PAID: 0 }, items: ['filing_fee'], set: tuned, add: paid, completes: 'A8' }],
    ['second time', { when: { T_NUGGET_PIANO_PAID: 1 }, items: ['filing_fee'], set: tuned, add: paid }],
    ['third time and after', { when: { T_NUGGET_PIANO_PAID: { atLeast: 2 } }, items: ['filing_fee'], set: tuned, add: paid }],
  ];
  const a8 = (() => {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## A8 ');
    if (from < 0) throw new Error('doc 57: no A8 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const found = new Map();
    for (const line of body.split('\n')) {
      const m = /^> \*\*THE PIANO\*\* · USE THE TUNING FORK, \*(.+?)\* — (.+)$/.exec(line);
      if (!m) continue;
      const spoken = m[2].split('→')[0];
      const quotes = [...spoken.matchAll(/"([^"]+)"/g)].map((q) => q[1]);
      if (!quotes.length) throw new Error(`doc 57 A8: "${m[1]}" has no line`);
      found.set(m[1], quotes);
    }
    return A8_CASES.map(([label, routing]) => {
      const quotes = found.get(label);
      if (!quotes) throw new Error(`doc 57 A8: no case "${label}"`);
      return { case: label, ...routing, say: quotes[0], ...(quotes.length > 1 ? { then: quotes.slice(1) } : {}) };
    });
  })();
  for (const pair of rebuilt) {
    if (pair.item === 'tuning_fork' && pair.room === 'nugget' && pair.target === 'piano') {
      if (pair.say !== a8[2].say) throw new Error('doc 57 A8: the first time does not open on doc 24\'s line');
      pair.rules = a8;
    }
  }

  // Pairs a later block adds (doc 57's, doc 54 A5's bait and smoke, doc 108's rod at the line) are not doc 24's.
  const spoken = existing.pairs.filter((pair) => typeof pair.say === 'string' && !/^Doc 57 |^Doc 54 A5, the |^Doc 54 Room 33 |^Doc 108, |^Doc 109, |^Doc 110 |^Doc 111 |^Doc 113 |^Doc 115 |^Doc 118 |^Doc 120 |^Doc 121 /.test(pair.note ?? '')).length;
  if (rebuilt.length - opening.length !== spoken) {
    throw new Error(`doc 24: ${rebuilt.length - opening.length} spoken pairs extracted, ${spoken} on file`);
  }

  // DOC 57 A6 AND A9: THE REGISTRAR'S COUNTER, IN THE STATUTE'S ORDER (errata
  // 80 D). A6: the deed on the counter without a survey is Sump's refusal, the
  // words of SUM_A1 option 1 (doc 04). A9: the deed (with the survey in hand),
  // then the survey, then the fee to Sump, the last of which is the read-back
  // and the invitation. The WORDS are the documents'; which flag or item each
  // case tests, takes or gives is routing, authored here as A8_CASES is.
  const registrar = (() => {
    const d04 = read('docs/04-dialogue-trees.md');
    const a1 = d04.slice(d04.indexOf('**`SUM_A1`'), d04.indexOf('**`SUM_B1`'));
    const row = /^\| 1 \|[^|]*\|[^|]*\|(.+?)\|/m.exec(a1);
    if (!row) throw new Error('doc 04: SUM_A1 option 1 not found');
    const refusal = quoted(row[1].replace(/\*\([^)]*\)\*/g, ''));
    if (refusal.length < 1) throw new Error('doc 04: SUM_A1 option 1 has no reply');
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## A9 ');
    if (from < 0) throw new Error('doc 57: no A9 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const caseLine = (who, item, label) => {
      const re = new RegExp(`^> \\*\\*${who}\\*\\* · USE ${item}, \\*${label}\\* — (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`doc 57 A9: no case "${who} · USE ${item}, ${label}"`);
      const words = quoted(m[1].split('→')[0].replace(/\*\([^)]*\)\*/g, ''));
      if (!words.length) throw new Error(`doc 57 A9: "${label}" has no line`);
      return { line: words[0], sump: /^\*\*SUMP:\*\*/.test(m[1]) };
    };
    const readBack = [];
    const tail = body.slice(body.indexOf('**the read-back**'));
    let invitation = null;
    for (const m of tail.matchAll(/^> \*\*(SUMP|THAD):\*\* (.+)$/gm)) {
      const speaker = m[1] === 'SUMP' ? 'sump' : 'thad';
      const [spoken, after] = m[2].split('→');
      const words = quoted(spoken.replace(/\*\([^)]*\)\*/g, ''));
      if (after && /THE INVITATION/.test(after)) { invitation = words.map((line) => ({ speaker, line })); continue; }
      for (const line of words) readBack.push(speaker === 'thad' ? line : { speaker, line });
    }
    if (!readBack.length || !invitation) throw new Error('doc 57 A9: the read-back or the invitation line was not found');
    return {
      refusal,
      deedWith: caseLine('THE COUNTER', 'THE DEED', 'with THE SURVEY'),
      surveyAfter: caseLine('THE COUNTER', 'THE SURVEY', 'after the deed'),
      surveyBefore: caseLine('THE COUNTER', 'THE SURVEY', 'before the deed'),
      feeBefore: caseLine('REGISTRAR SUMP', 'THE FILING FEE', 'before the deed and the survey'),
      feeAfter: caseLine('REGISTRAR SUMP', 'THE FILING FEE', 'after both'),
      readBack, invitation,
    };
  })();
  const sumpSays = (line) => ({ by: 'sump', say: line });
  for (const pair of rebuilt) {
    if (pair.item === 'deed' && pair.room === 'claims_registrar' && pair.target === 'counter') {
      if (pair.say !== registrar.deedWith.line) throw new Error('doc 57 A9: the deed with the survey does not open on doc 24\'s line');
      delete pair.targetPending;
      pair.rules = [
        { case: 'with THE SURVEY', when: { T_DEED_LODGED: false }, holds: ['survey'], say: registrar.deedWith.line,
          set: { T_DEED_LODGED: true } },
        { case: 'without THE SURVEY (A6)', when: { T_DEED_LODGED: false }, ...sumpSays(registrar.refusal[0]),
          ...(registrar.refusal.length > 1 ? { then: registrar.refusal.slice(1).map((line) => ({ speaker: 'sump', line })) } : {}),
          set: { T_SURVEY_NEEDED: true }, completes: 'A6' },
      ];
    }
    if (pair.item === 'filing_fee' && pair.room === 'claims_registrar' && pair.target === 'sump') {
      if (pair.say !== registrar.feeAfter.line) throw new Error('doc 57 A9: the fee after both does not open on doc 24\'s line');
      delete pair.targetPending;
      pair.rules = [
        { case: 'after both', when: { T_SURVEY_LODGED: true, T_BORDERS_MOTT: false }, say: registrar.feeAfter.line,
          // Doc 109, A9 · THE THIRD COPY: after the read-back and THE INVITATION, Sump's third copy (the trip's survey).
          then: [...registrar.readBack, ...registrar.invitation, ...consolationScene('### A9 · THE THIRD COPY', { SUMP: 'sump' }).lines],
          takes: ['filing_fee'], items: ['invitation', 'third_copy'],
          set: { T_BORDERS_MOTT: true }, completes: 'A9' },
        { case: 'before the deed and the survey', when: { T_BORDERS_MOTT: false }, ...sumpSays(registrar.feeBefore.line) },
      ];
    }
  }
  // DOC 57 E9: THE EXECUTOR'S FORM on THE MOTT FILE, in the archive (Room 8).
  // One case, the same hand: T_SAME_HAND and E9. Its words are the document's.
  {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## E9 ');
    if (from < 0) throw new Error('doc 57: no E9 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const m = /^> \*\*THE MOTT FILE\*\* · USE THE EXECUTOR'S FORM — (.+)$/m.exec(body);
    if (!m) throw new Error('doc 57 E9: no "THE MOTT FILE · USE THE EXECUTOR\'S FORM" line');
    const [line] = quoted(m[1].split('→')[0]);
    if (!line) throw new Error('doc 57 E9: the form on the file has no line');
    rebuilt.push({
      item: 'executor_form', room: 'archive', target: 'mott_file', puzzle: 'E9', say: line,
      note: 'Doc 57 E9 (not doc 24): the executor\'s form on the Mott file -- the same hand.',
      rules: [{ case: 'the same hand', say: line, set: { T_SAME_HAND: true }, completes: 'E9' }],
    });
  }
  rebuilt.push({
    item: 'survey', room: 'claims_registrar', target: 'counter', puzzle: 'A9', say: registrar.surveyAfter.line,
    note: 'Doc 57 A9 (not doc 24): the survey on the counter, after the deed and before it.',
    rules: [
      { case: 'after the deed', when: { T_DEED_LODGED: true }, say: registrar.surveyAfter.line, takes: ['survey'],
        set: { T_SURVEY_LODGED: true } },
      { case: 'before the deed', ...sumpSays(registrar.surveyBefore.line) },
    ],
  });

  // DOC 57 E3, STEP 3: SHENG'S LOAN ON THE UNDERTAKER (errata 86 E). Three
  // cases, his words read from the section's `> **THE UNDERTAKER** · USE
  // SHENG'S LOAN, *case* -- **UNDERTAKER:** ...` lines; which flags each case
  // tests is routing, authored here as A8_CASES is. With the Reverend's figure
  // and the sizing, the loan is spent, the funeral booked (`T_FUNERAL_BOOKED`)
  // and E3 complete.
  const e3 = (() => {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## E3 ');
    if (from < 0) throw new Error('doc 57: no E3 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const line = (label) => {
      const re = new RegExp(`^> \\*\\*THE UNDERTAKER\\*\\* · USE SHENG'S LOAN, \\*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\* — \\*\\*UNDERTAKER:\\*\\* (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`doc 57 E3: no case "${label}"`);
      const words = quoted(m[1].split('→')[0].replace(/\*\([^)]*\)\*/g, ''));
      if (!words.length) throw new Error(`doc 57 E3: "${label}" has no line`);
      return words;
    };
    return {
      paid: line('with `T_SOWERBY_PRICE` and `T_COFFIN_SIZED`'),
      noFigure: line('before the Reverend\'s figure'),
      noSizing: line('before the sizing'),
    };
  })();
  const undertakerSays = ([first, ...rest]) => ({ by: 'undertaker', say: first,
    ...(rest.length ? { then: rest.map((one) => ({ speaker: 'undertaker', line: one })) } : {}) });
  rebuilt.push({
    item: 'loan', room: 'undertaker', target: 'undertaker', puzzle: 'E3', say: e3.paid[0],
    note: 'Doc 57 E3 (not doc 24): SHENG\'S LOAN on the undertaker -- paid once the Reverend\'s figure and the sizing are in.',
    rules: [
      { case: 'with T_SOWERBY_PRICE and T_COFFIN_SIZED', when: { T_SOWERBY_PRICE: true, T_COFFIN_SIZED: true, T_FUNERAL_BOOKED: false },
        ...undertakerSays(e3.paid), takes: ['loan'], set: { T_FUNERAL_BOOKED: true }, completes: 'E3' },
      { case: 'before the Reverend\'s figure', when: { T_SOWERBY_PRICE: false }, ...undertakerSays(e3.noFigure) },
      { case: 'before the sizing', when: { T_COFFIN_SIZED: false }, ...undertakerSays(e3.noSizing) },
    ],
  });

  // DOC 54 AND DOC 57 B3: THE TUNING FORK ON GRIEVANCE (errata 68 F, 88 E).
  // Four cases, every line the documents': doc 54's refusal before the hum,
  // doc 57's before Thad knows where Vessel is, the success with both -- the
  // livery man's "Twelve years.", then the ride, over black, and the Nugget --
  // and doc 54's line after B3. Which flags each case tests is routing.
  const b3 = (() => {
    const caseIn = (path, heading, label) => {
      const whole = read(path);
      const from = whole.indexOf(heading);
      if (from < 0) throw new Error(`${path}: no section "${heading}"`);
      const body = whole.slice(from, whole.indexOf('\n## ', from + heading.length));
      const re = new RegExp(`^> \\*\\*GRIEVANCE\\*\\* · USE THE TUNING FORK, \\*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\* — (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`${path} B3: no case "${label}"`);
      return m[1];
    };
    const only = (cell) => {
      const words = quoted(cell.split('→')[0].replace(/\*\([^)]*\)\*/g, ''));
      if (words.length !== 1) throw new Error(`B3: expected one line in "${cell.slice(0, 60)}"`);
      return words[0];
    };
    const success = caseIn('docs/54-batch-c.md', '## B3 — the Grievance puzzle', 'after `T_HUM_HEARD`');
    const livery = /\*\*LIVERY MAN:\*\* "([^"]+)"/.exec(success)?.[1];
    // ITS STAGING, BEFORE THE LINE (errata 189, 190): the fork, the corrected tune, her look; doc 95 acts it.
    const staging = /^\*\(([^)]*)\)\*/.exec(success.trim())?.[1];
    if (!staging) throw new Error('B3: the success has no staging before the livery man\'s line');
    // THE RIDE, CHANGED (doc 108, ## THE RIDE · B3, changed: "Replaces doc 57's B3 ride line when the trip is built"):
    // the trip is built, so B3 rides out to the washout on doc 108's line, not to the Nugget on doc 57's.
    const d108 = read('docs/108-the-washout-and-the-mine.md');
    const changed = d108.slice(d108.indexOf('## THE RIDE · B3, changed'), d108.indexOf('\n## ', d108.indexOf('## THE RIDE · B3, changed') + 5));
    const ride = /over black — "([^"]+)"/.exec(changed)?.[1];
    if (!livery || !ride) throw new Error('B3: the success line or doc 108\'s changed ride is missing');
    return {
      before: only(caseIn('docs/54-batch-c.md', '## B3 — the Grievance puzzle', 'before the livery man has hummed')),
      after: only(caseIn('docs/54-batch-c.md', '## B3 — the Grievance puzzle', 'after B3')),
      vague: only(caseIn('docs/57-puzzle-completion.md', '## B3 ', 'after `T_HUM_HEARD`, without `T_VESSEL_LOCATION`')),
      livery, ride, staging,
    };
  })();
  // DOC 57 A2: THE PARLOR PIANO ANSWERS BY CIRCUMSTANCE (errata 91 E). Doc 24's
  // line stays the success's first; doc 57 writes the clerk's after it, the
  // refusal before he has agreed, and the line after A2. `T_ROOM_GRANTED` is
  // the room given, which opens the stairs.
  {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## A2 ');
    if (from < 0) throw new Error('doc 57: no A2 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const caseOf = (label) => {
      const re = new RegExp(`^> \\*\\*THE PARLOR PIANO\\*\\* · USE THE TUNING FORK, \\*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\* — (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`doc 57 A2: no case "${label}"`);
      return m[1].split('→')[0];
    };
    const before = quoted(caseOf('before `T_TUNES_PIANOS`'))[0];
    const success = caseOf('after `T_TUNES_PIANOS`');
    const clerk = /\*\*CLERK:\*\* "([^"]+)"/.exec(success)?.[1];
    const after = quoted(caseOf('after A2'))[0];
    const pair = rebuilt.find((one) => one.item === 'tuning_fork' && one.room === 'hotel_lobby' && one.target === 'parlor_piano');
    if (!pair || !before || !clerk || !after) throw new Error('doc 57 A2: the piano\'s cases do not read');
    if (!success.includes(pair.say)) throw new Error('doc 57 A2: the success is not doc 24\'s line');
    pair.puzzle = 'A2';
    pair.rules = [
      { case: 'after A2', when: { T_ROOM_GRANTED: true }, say: after },
      { case: 'after T_TUNES_PIANOS', when: { T_TUNES_PIANOS: true }, say: pair.say,
        then: [{ speaker: 'hotel_clerk', line: clerk }], set: { T_ROOM_GRANTED: true }, completes: 'A2' },
      { case: 'before T_TUNES_PIANOS', when: { T_TUNES_PIANOS: false }, say: before },
    ];
  }
  // DOC 57 A7: MADAME OZYMANDIA'S FEE AND THE MAP (errata 89 E). Three cases,
  // the words read from the section; a reply after **OZYMANDIA:** alternates
  // speaker at each " — " between quotes (hers, then Thad's, then hers).
  const a7 = (() => {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## A7 ');
    if (from < 0) throw new Error('doc 57: no A7 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const caseOf = (item, label) => {
      const re = new RegExp(`^> \\*\\*MADAME OZYMANDIA\\*\\* · USE ${item}, \\*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\* — (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`doc 57 A7: no case "${item}, ${label}"`);
      const cell = m[1].split('→')[0].replace(/\*\([^)]*\)\*/g, '');
      const [before, after] = cell.split('**OZYMANDIA:**');
      const lines = quoted(before ?? '').map((line) => ({ speaker: 'thad', line: line.replace(/\*/g, '') }));
      if (after !== undefined) {
        after.split(/"\s+—\s+"/).forEach((turn, n) => {
          for (const line of quoted(`"${turn.trim().replace(/^"|"$/g, '')}"`)) {
            lines.push({ speaker: n % 2 === 0 ? 'ozymandia' : 'thad', line: line.replace(/\*/g, '') });
          }
        });
      }
      if (!lines.length) throw new Error(`doc 57 A7: "${label}" has no line`);
      return lines;
    };
    return {
      fee: caseOf('THE FILING FEE', 'after OZY_A1 option 1'),
      // Errata 189: before she has named her price, she does not take it.
      early: caseOf('THE FILING FEE', 'before OZY_A1 option 1'),
      map: caseOf('THE COMPANY MAP', 'after `T_OZY_PAID`'),
      unpaid: caseOf('THE COMPANY MAP', 'not yet paid'),
    };
  })();
  const spokenBy = ([first, ...rest]) => ({ ...(first.speaker === 'thad' ? {} : { by: first.speaker }), say: first.line,
    ...(rest.length ? { then: rest.map((one) => ({ speaker: one.speaker, line: one.line })) } : {}) });
  rebuilt.push({
    item: 'filing_fee', room: 'ozymandias_tent', target: 'ozymandia', puzzle: 'A7', say: a7.fee[0].line,
    note: 'Doc 57 A7, step 3: the filing fee becomes a divining fee, once she has named her price (OZY_A1 option 1).',
    rules: [
      { case: 'after OZY_A1 option 1', when: { T_OZY_ASKED: true, T_OZY_PAID: false }, ...spokenBy(a7.fee), takes: ['filing_fee'], set: { T_OZY_PAID: true } },
      { case: 'before OZY_A1 option 1', when: { T_OZY_ASKED: false }, ...spokenBy(a7.early) },
    ],
  });
  rebuilt.push({
    item: 'company_map', room: 'ozymandias_tent', target: 'ozymandia', puzzle: 'A7', say: a7.map[0].line,
    note: 'Doc 57 A7: the map divined -- THE SURVEY, on Form 12-C. She hands the map back.',
    rules: [
      // NOT ONCE THE SURVEY IS LODGED (the items audit, errata 140): Sump
      // keeps it at A9, and with no bound here the map on her again handed
      // a second survey back after the first was on file. After that she has
      // no case, and the map's own pool answers.
      // THE BOUNDARY, WALKED (doc 120 I-3; errata 251): she unrolls the map and gives him the rod. The survey, and A7,
      // are the map's own now (reference/room-16 docBullets: the stake, home), in doc 57's three lines; `a7.map` is
      // still read here so that a change to them in doc 57 is seen (boundaryWalked).
      boundaryWalked(a7.map),
      { case: 'not yet paid', when: { T_OZY_PAID: false }, ...spokenBy(a7.unpaid) },
      { case: 'the survey drawn', when: { T_OZY_PAID: true },
        ...papersRule(papersBullet('- USE THE COMPANY MAP, *the survey drawn* — ', 'docs/120-act-one-by-hand.md'), { OZYMANDIA: 'ozymandia' }) },
    ],
  });
  // DOC 57 E6: THE EXECUTOR'S FORM (errata 93 G). HOB_E6 option 1 gives it
  // (doc 04); Sump accepts it once the death is recorded (`T_DECEASED`) and
  // refuses it before. Anyone else asked is answered by the interest rule:
  // Winnie and Frame here; Sheng's room is not built, so his line waits.
  // A reply after **NAME:** alternates speaker at each " — " between quotes
  // (theirs, then Thad's, then theirs); italic directions are staging.
  {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## E6 ');
    if (from < 0) throw new Error('doc 57: no E6 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const esc = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const caseOf = (who, label, speaker, tag) => {
      const re = new RegExp(`^> \\*\\*${esc(who)}\\*\\* · USE THE EXECUTOR'S FORM${label ? `, \\*${esc(label)}\\*` : ''} — \\*\\*${tag}:\\*\\* (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`doc 57 E6: no case "${who} · USE THE EXECUTOR'S FORM${label ? `, ${label}` : ''}"`);
      const cell = m[1].split('→')[0].replace(/\*\([^)]*\)\*/g, '');
      const lines = [];
      cell.split(/"\s+—\s+"/).forEach((turn, n) => {
        for (const line of quoted(`"${turn.trim().replace(/^"|"$/g, '')}"`)) {
          lines.push({ speaker: n % 2 === 0 ? speaker : 'thad', line: line.replace(/\*/g, '') });
        }
      });
      if (!lines.length) throw new Error(`doc 57 E6: "${who}" has no line`);
      return lines;
    };
    const said = ([first, ...rest]) => ({ by: first.speaker, say: first.line,
      ...(rest.length ? { then: rest.map((one) => ({ speaker: one.speaker, line: one.line })) } : {}) });
    const accepted = caseOf('REGISTRAR SUMP', 'with `T_DECEASED`', 'sump', 'SUMP');
    const early = caseOf('REGISTRAR SUMP', 'before `T_DECEASED`', 'sump', 'SUMP');
    rebuilt.push({
      item: 'executor_form', room: 'claims_registrar', target: 'sump', puzzle: 'E6', say: accepted[0].line,
      note: 'Doc 57 E6, step 2: the form Hob signed (HOB_E6 option 1), to Sump. The form is handed back; it is never consumed.',
      rules: [
        { case: 'with T_DECEASED', when: { T_DECEASED: true }, ...said(accepted), set: { T_EXECUTOR_NAMED: true }, completes: 'E6' },
        { case: 'before T_DECEASED', when: { T_DECEASED: false }, ...said(early) },
      ],
    });
    // ERRATA 125: Sheng's, Pratt's and Sowerby's refusals waited for their
    // rooms (errata 93 G); the laundry, Pratt's claim and the church are built.
    // The fairness audit found E6 "an elimination puzzle with nothing to
    // eliminate" with only two of doc 57's five refusals shipped.
    for (const [who, tag, speaker, room] of [['WINNIE', 'WINNIE', 'winnie', 'assay_office'], ['IGNATIUS FRAME', 'FRAME', 'frame', 'clarion'],
      ['AH-LAM SHENG', 'SHENG', 'sheng', 'laundry'], ['NICKEL PRATT', 'PRATT', 'pratt', 'pratts_claim'], ['REVEREND SOWERBY', 'SOWERBY', 'sowerby', 'church']]) {
      const lines = caseOf(who, null, speaker, tag);
      rebuilt.push({
        item: 'executor_form', room, target: speaker, puzzle: 'E6', say: lines[0].line,
        note: `Doc 57 E6: asked to be executor, ${who.toLowerCase()} is answered by the interest rule. The form stays with Thad.`,
        rules: [{ case: 'any time', ...said(lines) }],
      });
    }
  }
  // DOC 54 A5 AND DOC 57 F1 ON THE HOLE (errata 68 A, errata 96 F). The bait,
  // the smoke and the blanket are doc 54's lines, each Thad's, the italic
  // brackets staging; while the fumes last, any verb on the hole is doc 54's
  // fumes line. The blanket's success is doc 54's (doc 24's row is superseded:
  // "doc 54's success line governs"); the hole is `hole` in Room 23/24,
  // `prosperity`. F1's pickaxe is doc 57's two cases; Room 34 is not built.
  {
    const d54 = read('docs/54-batch-c.md');
    const at = d54.indexOf('## A5 — the raccoon');
    if (at < 0) throw new Error('doc 54: no A5 section');
    const body = d54.slice(at, d54.indexOf('\n---', at));
    const attempt = (head) => {
      const line = body.split('\n').find((one) => one.startsWith(head));
      if (!line) throw new Error(`doc 54 A5: no line starting "${head}"`);
      const words = quoted(line.split(' — ').slice(1).join(' — ').split('→')[0].replace(/\*\([^)]*\)\*/g, ''));
      if (!words.length) throw new Error(`doc 54 A5: "${head}" has no line`);
      return words;
    };
    const bait = attempt('**The bait**');
    const smoke = attempt('**The smoke**');
    const fumes = attempt('> While the fumes last')[0];
    const blanket = attempt('**The blanket**');
    const after = attempt('> USE THE LIVERY BLANKET on THE HOLE, after')[0];
    const say = ([first, ...rest]) => ({ say: first, ...(rest.length ? { then: rest } : {}) });
    // ITS STAGING, BETWEEN THE LINES (errata 189: "the tonic's fumes and the raccoon's look"):
    // the direction written between a case's first line and its second is shown, and doc 95
    // decides whether it is acted. A direction after the last line ("The tonic is spent.") is
    // what the case does, and the case does it.
    const staged = (head, words) => {
      const line = body.split('\n').find((one) => one.startsWith(head));
      const between = line.slice(line.indexOf(`"${words[0]}"`) + words[0].length + 2, line.indexOf(`"${words[1]}"`));
      const direction = /\*\(([^)]*)\)\*/.exec(between)?.[1];
      if (!direction) throw new Error(`doc 54 A5: "${head}" has no staging between its lines`);
      const [first, ...rest] = words;
      return { say: first, then: [{ speaker: 'thad', line: direction, direction: true }, ...rest] };
    };
    const inFumes = { case: 'while the fumes last', when: { T_FUMES: true }, say: fumes };
    const old = rebuilt.findIndex((one) => one.item === 'blanket' && one.room === 'prosperity');
    if (old < 0) throw new Error('doc 24: no blanket pair for the hole');
    rebuilt.splice(old, 1, {
      item: 'blanket', room: 'prosperity', target: 'hole', puzzle: 'A5', say: blanket[0],
      note: 'Doc 54 A5 (errata 68 A): the blanket over the hole turns it cold and the raccoon leaves at a walk; Thad takes the blanket back. Doc 54\'s success line governs doc 24\'s.',
      rules: [
        inFumes,
        { case: 'after', when: { T_WARM_HOLE: true }, say: after },
        { case: 'with the raccoon in', when: { T_WARM_HOLE: false }, ...staged('**The blanket**', blanket), set: { T_WARM_HOLE: true }, completes: 'A5' },
      ],
    });
    rebuilt.push({
      item: 'eggs', room: 'prosperity', target: 'hole', puzzle: 'A5', say: bait[0],
      note: 'Doc 54 A5, the bait: three more raccoons arrive and settle in around the first; the eggs are spent; the three are gone the next time Thad enters (T_RACCOON_MEETING, cleared on leaving).',
      rules: [inFumes, { case: 'with the raccoon in', when: { T_WARM_HOLE: false }, ...say(bait), takes: ['eggs'], set: { T_RACCOON_MEETING: true } }],
    });
    rebuilt.push({
      item: 'tonic', room: 'prosperity', target: 'hole', puzzle: 'A5', say: smoke[0],
      note: 'Doc 54 A5, the smoke: it fumes; the tonic is spent; the hole and the raccoon refuse every verb until Thad leaves and returns (T_FUMES, cleared on leaving).',
      rules: [inFumes, { case: 'with the raccoon in', when: { T_WARM_HOLE: false }, ...staged('**The smoke**', smoke), takes: ['tonic'], set: { T_FUMES: true } }],
    });
    const d57 = read('docs/57-puzzle-completion.md');
    const f1 = d57.slice(d57.indexOf('## F1 '), d57.indexOf('\n## ', d57.indexOf('## F1 ') + 5));
    const pick = (label) => {
      const m = new RegExp(`^> \\*\\*THE HOLE\\*\\* · USE THE PICKAXE, \\*${label}\\* — (.+)$`, 'm').exec(f1);
      if (!m) throw new Error(`doc 57 F1: no pickaxe case "${label}"`);
      return quoted(m[1].split('→')[0])[0];
    };
    // The rest of a case's lines, said after the first with a beat between (errata 229: the arrival below was one
    // paragraph holding four ideas; doc 59 §8).
    const rest = (label) => {
      const m = new RegExp(`^> \\*\\*THE HOLE\\*\\* · USE THE PICKAXE, \\*${label}\\* — (.+)$`, 'm').exec(f1);
      return quoted(m[1].split('→')[0]).slice(1);
    };
    const afterRest = rest('after F1');
    rebuilt.push({
      item: 'pickaxe', room: 'prosperity', target: 'hole', puzzle: 'F1', say: pick('after F1'),
      note: 'Doc 57 F1: the pickaxe on the hole, after the draught is understood: three days, forty feet. "Room 34 opens below the hole": the line is read and he is in Room 34, and the hole is the way down from then on (T_DUG_DOWN, errata 99 H).',
      rules: [
        // Errata 245 (doc 117 O-7): with the hotel's lamp in hand; without it, doc 118's line sends him for it.
        { case: 'after F1', when: { T_DRAUGHT: true }, holds: ['hotel_lamp'], say: pick('after F1'), ...(afterRest.length ? { then: afterRest } : {}),
          set: { T_DUG_DOWN: true }, goto: 'under_prosperity' },
        { case: 'after F1, without the lamp', when: { T_DRAUGHT: true }, ...objectsRule('- *without the lamp* — ') },
        { case: 'before F1', when: { T_DRAUGHT: false }, say: pick('before F1') },
      ],
    });
    // DOC 54 ROOM 33's F3 (errata 70 E): the pickaxe on the rock, before the
    // void; on the void, three swings, the head flying off twice. Each case's
    // directions and words are read in the order the document writes them --
    // a direction performed as one (doc 58), a quote as Thad's line -- and the
    // third, which is all direction, carries doc 57 F3's too: the piece of
    // wall that is THE SAMPLE. The void is known from the ninety seconds on
    // (T_IN_TUNE): before it, the rock's case answers wherever he swings.
    const r33 = d54.slice(d54.indexOf('# ROOM 33 · THE LISTENING CHAMBER'));
    const f3Body = r33.slice(r33.indexOf('## F3'), r33.indexOf('\n## ', r33.indexOf('## F3') + 5));
    const performed = (text) => [...text.matchAll(/\*\(([^)]*)\)\*|"([^"]+)"/g)]
      .map((m) => (m[1] !== undefined ? { speaker: 'thad', line: m[1], direction: true } : m[2]));
    const swing = (subject, label) => {
      const m = new RegExp(`^> \\*\\*${subject}\\*\\* · USE THE PICKAXE, \\*${label}\\* — (.+)$`, 'm').exec(f3Body);
      if (!m) throw new Error(`doc 54 Room 33: no "${subject} · USE THE PICKAXE, ${label}"`);
      return performed(m[1].split('→')[0]);
    };
    const asRule = ([first, ...rest]) => ({
      ...(typeof first === 'string' ? { say: first } : { say: first.line, direction: true }),
      ...(rest.length ? { then: rest } : {}),
    });
    const f3 = d57.slice(d57.indexOf('## F3 '), d57.indexOf('\n## ', d57.indexOf('## F3 ') + 5));
    const piece = performed(/^> (\*\(.+?\)\*) →/m.exec(f3)?.[1] ?? '');
    if (!piece.length) throw new Error('doc 57 F3: no direction for the piece of wall');
    rebuilt.push({
      item: 'pickaxe', room: 'listening_chamber', target: 'every_rock_surface', puzzle: 'F3', say: swing('THE ROCK', 'before the void is found')[0],
      note: 'Doc 54 Room 33 (errata 70 E): the pickaxe on the rock before the void is found; on the void, three swings, then F3 -- THE SAMPLE, T_BROKE_THROUGH, T_STRIKE_FOUND -- and Room 34\'s second state (errata 69 A, 99 H).',
      rules: [
        { case: 'before the void is found', when: { T_IN_TUNE: false }, ...asRule(swing('THE ROCK', 'before the void is found')) },
        { case: 'first', when: { T_IN_TUNE: true, T_BROKE_THROUGH: false, PICK_SWINGS: 0 }, ...asRule(swing('THE VOID', 'first')), add: { PICK_SWINGS: 1 } },
        { case: 'second', when: { T_IN_TUNE: true, T_BROKE_THROUGH: false, PICK_SWINGS: 1 }, ...asRule(swing('THE VOID', 'second')), add: { PICK_SWINGS: 1 } },
        { case: 'third', when: { T_IN_TUNE: true, T_BROKE_THROUGH: false, PICK_SWINGS: 2 }, ...asRule([...swing('THE VOID', 'third'), ...piece]),
          items: ['sample'], set: { T_BROKE_THROUGH: true, T_STRIKE_FOUND: true }, completes: 'F3', goto: 'under_prosperity' },
      ],
    });
  }
  // DOC 57 C3, STEP 3: THE LETTER ON SOWERBY (errata 90 E), after SOW_A1
  // option 5. Thad's line, then every quote after **SOWERBY:** is his.
  const c3 = (() => {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## C3 ');
    if (from < 0) throw new Error('doc 57: no C3 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const m = /^> \*\*REVEREND SOWERBY\*\* · USE THE LETTER, \*after SOW_A1 option 5\* — (.+)$/m.exec(body);
    if (!m) throw new Error('doc 57 C3: no letter case');
    const cell = m[1].split('→')[0].replace(/\*\([^)]*\)\*/g, '');
    const [before, after] = cell.split('**SOWERBY:**');
    const thad = quoted(before);
    const his = quoted(after ?? '');
    if (thad.length !== 1 || !his.length) throw new Error('doc 57 C3: the letter case does not read');
    return { thad: thad[0], his };
  })();
  rebuilt.push({
    item: 'letter', room: 'church', target: 'sowerby', puzzle: 'C3', say: c3.thad,
    note: 'Doc 57 C3, step 3: the letter of introduction is his standing to arrange the memorial; Sowerby gives it back.',
    rules: [
      { case: 'after SOW_A1 option 5', when: { T_SOW_FUNERAL_ASKED: true, T_MEMORIAL_BOOKED: false }, say: c3.thad,
        then: c3.his.map((line) => ({ speaker: 'sowerby', line })), set: { T_MEMORIAL_BOOKED: true } },
    ],
  });
  rebuilt.push({
    item: 'tuning_fork', room: 'livery', target: 'grievance', puzzle: 'B3', say: b3.livery,
    note: 'Doc 57 B3 (with doc 54\'s lines): the fork on Grievance. With the hum and Vessel\'s whereabouts, the corrected tune, "Twelve years.", the ride over black (doc 108\'s, changed for the trip), and Thad placed at the washout (doc 107).',
    rules: [
      { case: 'after B3', when: { T_GULCH_TRIP: true }, say: b3.after },
      { case: 'after B3, Vessel back', when: { T_VESSEL_FOUND: true }, say: b3.after },
      // B3 ENDS AT THE WASHOUT (doc 107; the brief, 5): the ride out, and Thad placed at the washout. Vessel is found in
      // the Gulch (G4) and is in Room 4 only from the rematch (G9), so B3 no longer writes T_VESSEL_FOUND.
      { case: 'with both', when: { T_HUM_HEARD: true, T_VESSEL_LOCATION: true }, say: b3.staging, direction: true,
        then: [{ speaker: 'livery_man', line: b3.livery }, { speaker: 'thad', line: b3.ride, overBlack: true }],
        set: { T_GULCH_TRIP: true }, completes: 'B3', goto: 'washout' },
      { case: 'after T_HUM_HEARD, without T_VESSEL_LOCATION', when: { T_HUM_HEARD: true }, say: b3.vague },
      { case: 'before the livery man has hummed', when: { T_HUM_HEARD: false }, say: b3.before },
    ],
  });

  // DOC 57 F5, BEAT 1: THE DOCUMENTS ON THE COUNTER (doc 48 S6). After F4, each
  // laid down once, by USE on THE COUNTER, in any order; each line is doc 57's,
  // Sump's and Winnie's by their names and Thad's where the cell gives none; the
  // italic directions are performed. Laying the fourth makes the name line
  // (SUM_F1) the Registrar's. Anything else he has given the office before, or
  // a paper already down, is "Already on file". A case comes FIRST on a pair that
  // already exists (THE DEED's A9 filing), so Act IV's counter answers Act IV.
  const f5 = (() => {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## F5 ');
    if (from < 0) throw new Error('doc 57: no F5 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const WHO = { SUMP: 'sump', WINNIE: 'winnie' };
    const cases = {};
    for (const m of body.matchAll(/^> \*\*THE COUNTER\*\* · USE (.+?) — (.+)$/gm)) {
      const lines = [];
      let speaker = 'thad';
      for (const span of m[2].matchAll(/\*\*([A-Z]+):\*\*|\*\(([^)]+)\)\*|"([^"]+)"|— /g)) {
        if (span[1]) { speaker = WHO[span[1]] ?? (() => { throw new Error(`doc 57 F5: unknown speaker ${span[1]}`); })(); continue; }
        if (span[0] === '— ') { speaker = 'thad'; continue; }
        if (span[2] !== undefined) {
          const shown = performedDirection(span[2]);
          if (shown) lines.push({ speaker: lines.length ? lines[lines.length - 1].speaker : speaker, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
          continue;
        }
        lines.push({ speaker, line: span[3] });
      }
      cases[m[1].trim()] = lines;
    }
    return cases;
  })();
  const F5_ITEMS = { 'THE DEATH CERTIFICATE': 'death_certificate', 'THE DEED': 'deed', 'THE CERTIFICATE': 'document_c', 'THE SAMPLE': 'sample' };
  const onFile = f5['anything else Thad has given the office before'];
  if (!onFile || Object.keys(F5_ITEMS).some((name) => !f5[name])) throw new Error('doc 57 F5: the counter cases do not read');
  const asCase = (lines) => ({ by: lines[0].speaker === 'thad' ? undefined : lines[0].speaker, say: lines[0].line,
    ...(lines[0].direction ? { direction: true } : {}), then: lines.slice(1) });
  const counterPair = (item) => {
    let pair = rebuilt.find((one) => one.item === item && one.room === 'claims_registrar' && one.target === 'counter');
    if (!pair) {
      pair = { item, room: 'claims_registrar', target: 'counter', puzzle: 'F5', otherwise: 'pool',
        note: 'Doc 57 F5 beat 1: laid on the counter at the filing; otherwise the item\'s own pool answers (doc 24 tier 2).', rules: [] };
      rebuilt.push(pair);
    }
    pair.rules ??= [];
    return pair;
  };
  for (const [name, item] of Object.entries(F5_ITEMS)) {
    const laid = `T_F5_${item.toUpperCase()}`;
    const pair = counterPair(item);
    const clean = (rule) => Object.fromEntries(Object.entries(rule).filter(([, v]) => v !== undefined));
    pair.rules.unshift(
      clean({ case: 'at the filing', when: { T_FANSHAWE_BEATEN: true, T_FILED: false, [laid]: false }, ...asCase(f5[name]),
        set: { [laid]: true }, add: { F5_LAID: 1 } }),
      clean({ case: 'at the filing, already down', when: { T_FANSHAWE_BEATEN: true, T_FILED: false }, ...asCase(onFile) }),
    );
  }
  // EVERYTHING HE HAS GIVEN THE OFFICE BEFORE: the survey and the fee (A9),
  // the three documents (E0), and the executor's form (E6, accepted and
  // handed back). The form and a second fee fell to a pool here (the items
  // audit, errata 140).
  for (const item of ['survey', 'filing_fee', 'document_a', 'document_b', 'document_d', 'executor_form']) {
    const pair = counterPair(item);
    pair.rules.unshift(Object.fromEntries(Object.entries({ case: 'at the filing', when: { T_FANSHAWE_BEATEN: true, T_FILED: false }, ...asCase(onFile) }).filter(([, v]) => v !== undefined)));
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
  // DOC 57 A5: "doc 24's A5 row and blanket pool now name THE LIVERY BLANKET"
  // -- the one blanket (errata 75); doc 24 still heads it HORSE BLANKET.
  const RENAMED = { horse_blanket: 'blanket' };
  for (const [name, lines] of Object.entries(pools)) {
    const id = RENAMED[slug(name)] ?? slug(name);
    if (!itemIds.has(id)) throw new Error(`doc 24: no item "${id}" for the pool headed "${name}"`);
    itemPools[id] = lines;
  }

  const mine = gulchMine();
  const giving = gulchGiving();
  rebuilt.push(...mine.pairs, ...giving.pairs, ...gulchFiddle(), ...hearsePairs());
  // Act III's estate sale (doc 111, C; errata 237): its item tries, and the money at the undertaker's.
  rebuilt.push(...estateSalePairs(e3, undertakerSays));
  // Act II's three papers (doc 113; errata 242): the swap in Fanshawe's office, and the deed and the fork on Pratt.
  // Objects, first pass (doc 118; errata 245): the chalked turn, the notice posted, the tonic on the handkerchief.
  const objects = objectsPairs(prattTurnLines());
  rebuilt.push(...papersPairs(objects), ...objects.pairs);
  // Act I, by hand (doc 120; errata 248): the letter at Pike's board, the eggs improved, the card in the wreath.
  actOnePairs(rebuilt);
  // The not-done list (doc 121; errata 250): the letter delivered, the raccoon dressed, and where seven objects go.
  notDonePairs(rebuilt);
  // GIVE (doc 127; errata 282): the hand-overs answer GIVE, and GIVE has its own lines where nothing is written.
  const give = givePlan();
  applyGive(rebuilt, giving.targetPools, give);
  return write('content/combinations.json', {
    ...existing, pairs: rebuilt, itemPools, areaPools: mine.areaPools, targetPools: giving.targetPools, globalPool: global,
    givePools: { people: give.people, things: give.things },
    givePoolsNote: 'Errata 282, doc 127: GIVE with no pair -- to a person, or to a thing. Said in turn.',
  });
}

/**
 * FIDDLER'S GULCH: THE ROD AND THE FORK IN THE MINE (doc 108; reference/fiddlers-gulch/brief.md, "What the engine
 * needs" 3). Read from doc 108 where it is written, never typed here:
 *  - THE BRASS ROD · USE, *at the line*: a pair on each of the line's two passages, its three variants said in turn
 *    on a counter both share (ROD_AT_LINE), the first with its direction performed (the humming is shown, not heard);
 *  - THE BRASS ROD · USE, *anywhere but the line*, and THE TUNING FORK · USE: area pools across the mine's four rooms,
 *    after a pair and before the item's own pool (engine/core/VerbSystem.ts).
 * The room and passage ids are routing, authored here as OPENING_PAIRS is; the words are the document's.
 */
const MINE_ROOMS = ['mine_adit', 'mine_climb', 'mine_two_rocks', 'mine_line'];
const LINE_PASSAGES = ['left_passage', 'right_passage'];
function gulchMine() {
  const doc = read('docs/108-the-washout-and-the-mine.md');
  const section = (heading) => {
    const at = doc.indexOf(`## ${heading}`);
    if (at < 0) throw new Error(`doc 108: no section "${heading}"`);
    const rest = doc.slice(at + heading.length + 3);
    return rest.slice(0, (/\n## |\n---\n/.exec(rest) ?? { index: rest.length }).index);
  };
  const row = (body, startsWith) => {
    const line = body.split('\n').find((one) => one.startsWith(startsWith));
    if (!line) throw new Error(`doc 108: no line starting "${startsWith}"`);
    return line.slice(line.indexOf(' — ') + 3);
  };
  // `1 *(direction)* "words" · 2 "words" · 3 "words"`: each variant's direction and quotes, in order.
  const variants = (text) => text.split(' · ').map((piece) => ({
    direction: /\*\(([^)]+)\)\*/.exec(piece)?.[1]?.trim() ?? null,
    lines: [...piece.replace(/\*\([^)]*\)\*/g, '').matchAll(/"([^"]+)"/g)].map((m) => m[1]),
  }));
  const wrong = section('THE MINE · WRONG ANSWERS, ANYWHERE IN IT');
  const rodAnywhere = variants(row(wrong, '**THE BRASS ROD** · USE')).flatMap((one) => one.lines);
  const forkAnywhere = variants(row(wrong, '**THE TUNING FORK** · USE')).flatMap((one) => one.lines);
  const atLine = variants(row(section('THE MINE · THE LINE'), '**THE BRASS ROD** · USE'));
  if (rodAnywhere.length !== 3 || forkAnywhere.length !== 1 || atLine.length !== 3) {
    throw new Error(`doc 108: the mine's rod and fork lines read ${rodAnywhere.length}, ${forkAnywhere.length}, ${atLine.length}`);
  }
  const rules = atLine.map((one, n) => ({
    case: `the rod at the line, ${['first', 'second', 'third and after'][n]}`,
    when: { ROD_AT_LINE: n < 2 ? n : { atLeast: 2 } },
    ...(one.direction
      ? { say: one.direction, direction: true, then: one.lines.map((line) => ({ speaker: 'thad', line })) }
      : { say: one.lines[0], ...(one.lines.length > 1 ? { then: one.lines.slice(1).map((line) => ({ speaker: 'thad', line })) } : {}) }),
    ...(n < 2 ? { add: { ROD_AT_LINE: 1 } } : {}),
  }));
  const pairs = LINE_PASSAGES.map((target) => ({
    item: 'brass_rod', room: 'mine_line', target, puzzle: 'G2', say: atLine[0].lines[0],
    note: "Doc 108, THE MINE · THE LINE: THE BRASS ROD · USE, at the line -- either passage, one run (ROD_AT_LINE). It "
      + 'tells, it does not open: the right passage leads out with or without it (doc 107).',
    rules,
  }));
  const source = 'docs/108-the-washout-and-the-mine.md::THE MINE · WRONG ANSWERS, ANYWHERE IN IT';
  return {
    pairs,
    areaPools: [
      { id: 'mine-brass-rod', item: 'brass_rod', rooms: MINE_ROOMS, lines: rodAnywhere, source },
      { id: 'mine-tuning-fork', item: 'tuning_fork', rooms: MINE_ROOMS, lines: forkAnywhere, source },
    ],
  };
}

/**
 * FIDDLER'S GULCH'S PEOPLE (doc 109, THE PEOPLE; reference/fiddlers-gulch/brief.md): their trees, read from the one
 * table shape doc 109 writes for all five, and what an item does in their hands. Built a room at a time: GULCH_PEOPLE
 * names the people whose rooms are built.
 *
 * The table: `| n | "option" | `[TAG · aftermath]` | response |`. In the response, plain quotes are the person's,
 * an italic quote (`*"No."*`) is Thad's, an italic bracket is a direction, and ` — ` separates them; `*(second)*`
 * begins the answer to every later selection; a trailing `*(before Gn)*` or `*(after Gn)*` offers the option only
 * on that side of puzzle Gn, read through GULCH_GATES (the flag the puzzle writes; routing, as an id is). The
 * opening is `> **NAME:** *(before Gn)* "..."` lines: one node per side when the opening has sides, chosen by the
 * tree's entries. The way out is doc 04 part one's pool, as every tree's.
 */
const GULCH_GATES = { G3: 'T_CAMP_TRUSTS', G4: 'T_DEACON_FOUND', G5: 'T_PLANK_SEAT' };
const GULCH_PEOPLE = [
  { heading: 'THE LOOKOUT', node: 'LOO_G1', speaker: 'gulch_lookout', label: 'LOOKOUT', file: 'gulch-lookout', id: 'LOOKOUT' },
  { heading: 'THE RULE-KEEPER', node: 'RUL_G1', speaker: 'gulch_rule_keeper', label: 'RULE-KEEPER', file: 'gulch-rule-keeper', id: 'RULE_KEEPER' },
  { heading: 'THE DEACON, before he is found', node: 'DEA_G1', speaker: 'gulch_deacon', label: 'THE DEACON', file: 'gulch-deacon', id: 'DEACON', noBarks: true },
  { heading: 'THE PANNER', node: 'PAN_G1', speaker: 'gulch_panner', label: 'PANNER', file: 'gulch-panner', id: 'PANNER' },
  { heading: 'THE MAN UPSTREAM', node: 'UPS_G1', speaker: 'gulch_man_upstream', label: 'MAN UPSTREAM', file: 'gulch-man-upstream', id: 'MAN_UPSTREAM' },
];
function gulchSide(text, where) {
  // At the end of a response, or at the start of an opening line (`*(before G3)* "..."`).
  const m = /\*\((before|after) (G\d)\)\*\s*$/.exec(text.trim()) ?? /^\s*\*\((before|after) (G\d)\)\*/.exec(text);
  if (!m) return { text, when: undefined };
  const flag = GULCH_GATES[m[2]];
  if (!flag) throw new Error(`doc 109: ${where} is gated on ${m[2]}, which GULCH_GATES does not name`);
  return { text: text.replace(m[0], '').trim(), when: { [flag]: m[1] === 'after' } };
}
/** A response's pieces in order: the person's quotes, Thad's italic quotes and the directions. */
function gulchSpoken(text, speaker) {
  const out = [];
  for (const m of text.matchAll(/\*"([^"]+)"\*|"([^"]+)"|\*\(([^)]+)\)\*/g)) {
    if (m[1]) out.push({ speaker: 'thad', line: m[1] });
    else if (m[2]) out.push({ speaker, line: m[2] });
    // *(beat)* is a pause in the delivery, not a thing shown: dropped, as the town's barks drop it.
    else if (!/^beat$/i.test(m[3].trim())) out.push({ speaker, line: m[3].trim(), direction: true });
  }
  return out;
}
/**
 * VESSEL, FOUND, IN THE GULCH (doc 109, ### DEKE VESSEL, found): doc 04's VES_B1, extracted from doc 04 by
 * vesselActTwo(), with doc 109's Gulch differences, as a node of the Deacon's own tree, VES_G1, opened once he is found
 * (G4). Its opening was said at THE FIND, so it has none. Options 1, 2 and 4 are doc 04's. Option 3, the replay, is
 * offered only here and only before G9; 3 and 6 wait for the seat (G5) and answer doc 109's line before it. Option 6
 * adds doc 109's point down the bank and its line, then B4; it and the replay call Duel One to the bar
 * (`T_DUEL_ONE_CALLED`), where it is fought. Option 5, after Duel One, is G9.
 */
function gulchVessel(speaker) {
  const doc = read('docs/109-fiddlers-gulch-lines.md');
  const at = doc.indexOf('\n### DEKE VESSEL, found\n');
  if (at < 0) throw new Error('doc 109: no "### DEKE VESSEL, found"');
  const body = doc.slice(at, doc.indexOf('\n---', at));
  const bullet = (starts) => {
    const line = body.split('\n').find((one) => one.startsWith(`- **${starts}`));
    if (!line) throw new Error(`doc 109: DEKE VESSEL, found has no bullet "${starts}"`);
    return line;
  };
  const vb1 = vesselActTwo().node;
  const remap = (lines) => lines.map((one) => ({ ...one, speaker: one.speaker === 'deke_vessel' ? speaker : one.speaker }));
  const byN = (n) => {
    const found = vb1.options.find((one) => one.id === `ves_b1_${n}`);
    if (!found) throw new Error(`doc 04: VES_B1 has no option ${n}`);
    return JSON.parse(JSON.stringify(found));
  };
  const seat = bullet('Options 3 and 6 wait for the seat');
  const [before, again] = seat.slice(seat.indexOf('**VESSEL:**')).split('*(second)*').map((part) => quoted(part));
  if (!before?.length || !again?.length) throw new Error('doc 109: the seat line and its second did not read');
  const waiting = (option) => ({ id: `${option.id}_seat`, tag: option.tag, text: option.text, afterUse: 'retain',
    when: { ...(option.when ?? {}), T_PLANK_SEAT: false }, say: before.join(' '), repeat: again.join(' ') });
  const six = bullet('Option 6, in the Gulch');
  const pointed = gulchSpoken(six.slice(six.indexOf('and then:') + 9).split('→')[0].replace('**VESSEL:**', ''), speaker);
  if (pointed.length !== 2 || !pointed[0].direction) throw new Error('doc 109: option 6 did not read as a direction and a line');
  const g9 = [...body.matchAll(/^> \*\*(VESSEL|THAD):\*\* (.+)$/gm)].flatMap((m) => gulchSpoken(m[2].split('→')[0], m[1] === 'THAD' ? 'thad' : speaker));
  if (!/→ \*\*G9\*\*; `T_VESSEL_FOUND`/.test(body)) throw new Error('doc 109: option 5 no longer arrives at G9 and T_VESSEL_FOUND');
  const options = [];
  for (const n of [1, 2, 4]) {
    const one = byN(n);
    if (one.exchange) one.exchange = remap(one.exchange);
    options.push({ ...one, id: one.id.replace('ves_b1', 'ves_g1') });
  }
  const three = byN(3);
  // THE DUEL IS ON THE BAR (doc 109, DUEL ONE, ON THE BAR): the replay and the challenge call it there -- Vessel goes
  // down the bank and the conversation ends -- and it is fought when Thad comes down to the river (Room 53's accost).
  const toTheBar = (option) => { const out = { ...option, set: { ...(option.set ?? {}), T_DUEL_ONE_CALLED: true }, ends: true };
    delete out.duel; return out; };
  const threeHere = toTheBar({ ...three, id: 'ves_g1_3', when: { T_DUEL_ONE_LOST: true, T_VESSEL_FOUND: false, T_PLANK_SEAT: true } });
  options.splice(2, 0, waiting({ ...threeHere, when: { T_DUEL_ONE_LOST: true, T_VESSEL_FOUND: false } }), threeHere);
  const sixDoc = byN(6);
  const sixHere = toTheBar({ ...sixDoc, id: 'ves_g1_6', when: { ...(sixDoc.when ?? {}), T_PLANK_SEAT: true },
    exchange: [...remap(sixDoc.exchange ?? [{ speaker, line: sixDoc.say }]), ...pointed] });
  delete sixHere.say;
  options.push(waiting({ ...sixDoc, id: 'ves_g1_6' }), sixHere);
  const five = byN(5);
  options.push({ id: 'ves_g1_5', tag: five.tag, text: five.text, afterUse: 'remove', when: { T_DUEL_ONE_LOST: true, T_VESSEL_FOUND: false },
    // G9: the rematch agreed, and Vessel is in Room 4 from here (T_VESSEL_FOUND moves from B3 to G9, the brief, 5).
    exchange: g9, set: { T_VESSEL_FOUND: true }, puzzle: { G9: 'complete' }, ends: true });
  const exit = vb1.options.find((one) => one.tag === 'EXIT');
  if (exit) options.push({ ...exit, id: 'ves_g1_x' });
  return { id: 'VES_G1', noPrompt: true,
    exceptionReason: 'Doc 109: the opening, doc 03\'s Duel One opening, was said at THE FIND; TALK TO after it opens the list.',
    options };
}

/**
 * G8, THE MESSAGES (doc 109, ## G8 · THE MESSAGES, AND PAIRS 25 AND 26): the options doc 109 adds to a Gulch tree
 * outside its table, `**\`PAN_G1\`, option 6** — "text" · \`[PROGRESS · remove]\` · *req \`FLAG\`*` and the `> ` lines
 * under it. A line's `→ \`FLAG\`` sets that flag; Thad's `→ pair N` teaches pair N (its knowledge flag, ASSAY_PAIR_N);
 * `*(second, if asked again before it is carried)*` is the answer to asking again. "Both options need G3": every one
 * waits for the camp's trust. An option asked again before its message is carried stays until it is carried: the
 * message it gives is carried by the other man's option, whose flag ends it (the builder's reading of `remove` with a
 * second answer, errata 210).
 */
function gulchMessages(person) {
  const doc = read('docs/109-fiddlers-gulch-lines.md');
  const at = doc.indexOf('\n## G8 ·');
  if (at < 0) return [];
  const body = doc.slice(at, doc.indexOf('\n### The pairs, for doc 03 Part Two', at));
  if (!/Both options need G3/.test(body)) throw new Error('doc 109: G8 no longer says the messages need G3');
  const out = [];
  const heads = [...body.matchAll(new RegExp(`^\\*\\*\`${person.node}\`, option (\\d+)\\*\\* — (.+)$`, 'gm'))];
  for (const head of heads) {
    const [, n, rest] = head;
    const start = head.index + head[0].length;
    const after = body.slice(start);
    const block = after.slice(0, after.search(/^\*\*`|^### |^---$/m) < 0 ? after.length : after.search(/^\*\*`|^### |^---$/m));
    const text = quoted(rest)[0];
    const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(rest);
    if (!text || !tag) throw new Error(`doc 109: ${person.node} option ${n} has no text or tag`);
    const req = /\*req `([A-Z_]+)`\*/.exec(rest)?.[1];
    const set = {};
    const exchange = [];
    let again = null;
    for (const line of block.split('\n').filter((one) => one.startsWith('> '))) {
      const second = /^> \*\(second[^)]*\)\* (.+)$/.exec(line);
      if (second) { again = quoted(second[1]).join(' '); continue; }
      const m = /^> \*\*([A-Z ]+):\*\* (.+)$/.exec(line);
      if (!m) throw new Error(`doc 109: ${person.node} option ${n}: unreadable line ${line}`);
      const [said, effect] = m[2].split('→');
      const speaker = m[1] === 'THAD' ? 'thad' : person.speaker;
      if (m[1] !== 'THAD' && m[1] !== person.label) throw new Error(`doc 109: ${person.node} option ${n} has a line of ${m[1]}'s`);
      exchange.push(...gulchSpoken(said, speaker));
      if (effect) {
        const flag = /`([A-Z_]+)`/.exec(effect)?.[1];
        const pair = /pair (\d+)/.exec(effect)?.[1];
        if (flag) set[flag] = true;
        else if (pair) set[`ASSAY_PAIR_${pair.padStart(2, '0')}`] = true;
        else throw new Error(`doc 109: ${person.node} option ${n}: "→${effect}" names no flag and no pair`);
      }
    }
    if (!exchange.length) throw new Error(`doc 109: ${person.node} option ${n} says nothing`);
    // Carried by the other man's option: the flag it leaves is the one the other side's req does not read.
    const given = Object.keys(set).find((one) => one.startsWith('T_'));
    // G8 is done when both pairs are taught: the option that teaches the second (doc 109: the answer carried down).
    const last = Object.keys(set).some((one) => one === 'ASSAY_PAIR_26');
    out.push({
      ...(last ? { puzzle: { G8: 'complete' } } : {}),
      id: `${person.speaker}${n}`, tag: tag[1], text,
      afterUse: again ? 'retain' : (tag[2] ?? 'remove'),
      when: { [GULCH_GATES.G3]: true, ...(req ? { [req]: true } : {}),
        ...(again && given ? { [given.replace(/_UP$/, '_DOWN')]: false } : {}) },
      exchange, set,
      ...(again ? { repeat: again } : {}),
    });
  }
  return out;
}

/**
 * DOC 109, THE CHANGES IN CONSOLATION: a scene written under `### heading` as `> **NAME:** ...` lines (THAD's are his),
 * read with the Gulch's reader (gulchSpoken: quotes, directions, *(beat)* dropped). `→ THE ITEM` on a line is what the
 * scene hands over; the caller routes it, as the scene's home tree or pair does. Each moves to its home document when
 * the trip is built (doc 109): read from doc 109 until then, never retyped.
 */
function consolationScene(heading, speakers) {
  const doc = read('docs/109-fiddlers-gulch-lines.md');
  const at = doc.indexOf(`\n${heading}`);
  if (at < 0) throw new Error(`doc 109: no "${heading}"`);
  const rest = doc.slice(at + 1);
  const end = rest.slice(4).search(/^#{2,3} |^---$/m);
  const body = end < 0 ? rest : rest.slice(0, end + 4);
  const lines = [];
  const gives = [];
  for (const m of body.matchAll(/^> \*\*([A-Z ]+):\*\* (.+)$/gm)) {
    const speaker = m[1] === 'THAD' ? 'thad' : speakers[m[1]];
    if (!speaker) throw new Error(`doc 109 ${heading}: a line of ${m[1]}'s, and no speaker for it`);
    const [said, effect] = m[2].split('→');
    lines.push(...gulchSpoken(said, speaker));
    if (effect) gives.push(effect.trim());
  }
  if (!lines.length) throw new Error(`doc 109 ${heading}: no lines`);
  return { lines, gives, body };
}

function gulchPeople() {
  const doc = read('docs/109-fiddlers-gulch-lines.md');
  const POOL = (() => {
    const d4 = read('docs/04-dialogue-trees.md');
    return [...d4.slice(d4.indexOf('## Universal exit lines'), d4.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  })();
  const written = [];
  GULCH_PEOPLE.forEach((person, index) => {
    const at = doc.indexOf(`\n### ${person.heading}\n`);
    if (at < 0) throw new Error(`doc 109: no "### ${person.heading}"`);
    const rest = doc.slice(at + 1);
    const body = rest.slice(0, rest.slice(4).search(/^###? /m) + 4);
    // The opening is the `> **NAME:**` lines before the table; those after it are scenes (GIVE THE CLARION).
    const head = body.slice(0, body.search(/^\| # \|/m));
    const opening = [...head.matchAll(new RegExp(`^> \\*\\*${person.label}:\\*\\* (.+)$`, 'gm'))]
      .map((m) => gulchSide(m[1], `${person.node} opening`))
      .map((side) => ({ when: side.when, lines: gulchSpoken(side.text, person.speaker) }));
    if (!opening.length) throw new Error(`doc 109: ${person.node} has no opening`);
    const options = [];
    for (const [, n, optionCell, tagCell, response] of body.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+) \|$/gm)) {
      const where = `${person.node} option ${n}`;
      const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
      if (!tag) throw new Error(`doc 109: ${where} has no tag`);
      const side = gulchSide(response, where);
      const [first, second] = side.text.split('*(second)*').map((one) => one.trim());
      const lines = gulchSpoken(first, person.speaker);
      const again = second ? gulchSpoken(second, person.speaker) : [];
      if (!lines.length) throw new Error(`doc 109: ${where} has no answer`);
      if (again.some((one) => one.speaker !== person.speaker || one.direction)) {
        throw new Error(`doc 109: ${where}'s second answer is not one line of ${person.label}'s`);
      }
      const option = {
        id: `${person.speaker}${n}`, tag: tag[1], text: quoted(optionCell)[0],
        ...(tag[2] ? { afterUse: tag[2] } : {}),
        ...(side.when ? { when: side.when } : {}),
        ...(lines.length === 1 && !lines[0].direction && lines[0].speaker === person.speaker
          ? { say: lines[0].line } : { exchange: lines }),
        ...(again.length ? { repeat: again.map((one) => one.line).join(' ') } : {}),
      };
      if (!option.text) throw new Error(`doc 109: ${where} has no option text`);
      options.push(option);
    }
    if (options.length < 3 || !options.some((one) => one.tag === 'COMIC')) {
      throw new Error(`doc 109: ${person.node} has ${options.length} options, ${options.filter((o) => o.tag === 'COMIC').length} [COMIC]`);
    }
    options.push(...gulchMessages(person));
    options.push({ id: `${person.speaker}x`, tag: 'EXIT', text: POOL[index % POOL.length], universal: true, ends: true });
    // THE OPENING IS CARRIED WHOLE AND SPOKEN, as Frame's and Sump's are: the engine voices `opening` and nothing
    // else, so a line kept only in `prompt` was never heard (errata 218: four of the five openings, one line each,
    // and the last line of any longer one). The prompt is its last line, the caption; an opening that ends on a
    // direction (RUL_G1: *(Nobody asked.)*) has no line held over the options.
    const node = (id, side) => (side.lines.at(-1)?.direction
      ? { id, noPrompt: true, exceptionReason: 'Doc 109 ends the opening on a direction, which is performed, not held over the options.',
        opening: side.lines, options }
      : { id, ...(side.lines.length ? { prompt: side.lines.at(-1).line, opening: side.lines } : { noPrompt: true }), options });
    const nodes = {};
    const entries = [];
    opening.forEach((side, n) => {
      const id = n === 0 ? person.node : `${person.node}_${Object.values(side.when ?? {})[0] ? 'AFTER' : 'BEFORE'}`;
      nodes[id] = node(id, side);
      if (n > 0) entries.push({ when: side.when, node: id });
    });
    // HIS BARKS, IN TURN, ONE A VISIT (doc 109, THE PEOPLE): `**Barks, before G3** — 1 "..." · 2 ...`, or `**Barks** —`
    // with no sides. Written into his ambient file as `barkTurns`, one counter a side, his `barks` left `{}`.
    const turns = [...body.matchAll(/^\*\*Barks(?:, (before|after) (G\d))?\*\* — (.+)$/gm)].map((m) => {
      const lines = [...m[3].matchAll(/\d "([^"]+)"/g)].map((q) => q[1]);
      if (lines.length !== 3) throw new Error(`doc 109: ${person.heading}'s barks${m[1] ? `, ${m[1]} ${m[2]}` : ''} have ${lines.length} lines`);
      const flag = m[2] ? GULCH_GATES[m[2]] : null;
      if (m[2] && !flag) throw new Error(`doc 109: ${person.heading}'s barks are gated on ${m[2]}, which GULCH_GATES does not name`);
      return { counter: `${person.label.replace(/[^A-Z]/g, '_')}_BARKS${m[1] ? `_${m[1].toUpperCase()}_${m[2]}` : ''}`,
        ...(flag ? { when: { [flag]: m[1] === 'after' } } : {}), lines,
        source: `docs/109-fiddlers-gulch-lines.md::### ${person.heading}` };
    });
    if (!turns.length && !person.noBarks) throw new Error(`doc 109: ${person.heading} has no barks`);
    if (turns.length) {
      const ambientPath = `content/ambient/${person.file}.json`;
      const ambient = JSON.parse(read(ambientPath));
      ambient.barks = {};
      ambient.barkTurns = turns;
      ambient.barksNote = `EXTRACTED from docs/109-fiddlers-gulch-lines.md (### ${person.heading}) by tools/extract-content.mjs. `
        + 'Do not edit: change doc 109 and re-run. Said on approach, one a visit, in turn, the same in every reputation state.';
      written.push(write(ambientPath, ambient, 1));
      // The same man in another figure (the rule-keeper with the fiddle, from G5) says the same barks on the same count.
      for (const other of person.alsoAmbient ?? []) {
        const path = `content/ambient/${other}.json`;
        const file = JSON.parse(read(path));
        Object.assign(file, { barks: {}, barkTurns: turns, barksNote: ambient.barksNote });
        written.push(write(path, file, 1));
      }
    }
    // THE DEACON IS VESSEL: once he is found (G4), the same man's tree opens VES_G1 (doc 109, DEKE VESSEL, found).
    if (person.id === 'DEACON') {
      nodes.VES_G1 = gulchVessel(person.speaker);
      entries.unshift({ when: { [GULCH_GATES.G4]: true }, node: 'VES_G1' });
    }
    written.push(write(`content/dialogue/${person.file}.json`, {
      aftermathAuthored: true, schema: 1, id: person.id, speaker: person.speaker, name: person.label,
      note: `EXTRACTED from docs/109-fiddlers-gulch-lines.md (### ${person.heading}) by tools/extract-content.mjs. Do not `
        + 'edit: change doc 109 and re-run. An option gated *(before Gn)* or *(after Gn)* reads GULCH_GATES; the way '
        + 'out is doc 04 part one\'s pool.',
      ...(entries.length ? { entries } : {}), start: person.node, nodes,
    }));
  });
  return written;
}

/**
 * G5, THE FIDDLE TUNED (doc 109, ### THE FIDDLE): `**THE FIDDLE** · USE THE TUNING FORK — *(direction)*` and the `> `
 * lines under it to the arrow (THAD, RULE-KEEPER, and a last direction with no speaker, his), then the seat: G5 and
 * `T_PLANK_SEAT`. After it, `*After G5:* **THE FIDDLE** · USE THE TUNING FORK — "..."`, Thad's. The fiddle is the
 * room's hotspot `fiddle`.
 */
function gulchFiddle() {
  const doc = read('docs/109-fiddlers-gulch-lines.md');
  const keeper = 'gulch_rule_keeper';
  const head = doc.indexOf('**THE FIDDLE** · USE THE TUNING FORK — ');
  if (head < 0) throw new Error('doc 109: no **THE FIDDLE** · USE THE TUNING FORK');
  const block = doc.slice(head).split('\n');
  const first = gulchSpoken(block[0].split(' — ').slice(1).join(' — '), 'thad');
  const scene = [];
  let arrow = '';
  for (const line of block.slice(1)) {
    const m = /^> (?:\*\*(THAD|RULE-KEEPER):\*\* )?(.+)$/.exec(line);
    if (!m) { if (scene.length) break; continue; }
    const [spoken, after] = m[2].split('→');
    scene.push(...gulchSpoken(spoken, m[1] === 'THAD' ? 'thad' : keeper));
    if (after !== undefined) { arrow = after; break; }
  }
  if (!/\*\*G5\*\*, a seat at the plank/.test(arrow)) throw new Error(`doc 109: G5's arrow reads "${arrow}"`);
  if (first.length !== 1 || !first[0].direction || scene.length < 4) throw new Error('doc 109: G5 did not read as a direction and its scene');
  const afterLine = doc.split('\n').find((line) => line.startsWith('*After G5:* **THE FIDDLE** · USE THE TUNING FORK — '));
  const again = afterLine && quoted(afterLine)[0];
  if (!again) throw new Error('doc 109: no *After G5:* line for the fork on the fiddle');
  return [{
    item: 'tuning_fork', room: 'grog_tent', target: 'fiddle', puzzle: 'G5', say: again,
    note: 'Doc 109, THE FIDDLE · USE THE TUNING FORK (G5): Thad tunes it as he tunes the Nugget\'s piano, and is paid a '
      + 'pinch of dust: a seat at the plank. After it, Thad\'s line.',
    rules: [
      { case: 'G5', when: { [GULCH_GATES.G5]: false }, say: first[0].line, direction: true,
        then: scene.map((one) => ({ speaker: one.speaker, line: one.line, ...(one.direction ? { direction: true } : {}) })),
        set: { [GULCH_GATES.G5]: true }, completes: 'G5' },
      { case: 'after G5', when: { [GULCH_GATES.G5]: true }, say: again },
    ],
  }];
}

/**
 * WHAT AN ITEM DOES IN A GULCH PERSON'S HANDS (doc 109): `**THE LOOKOUT** · GIVE THE CLARION *(G3)* — *(direction)*`
 * and the `> **NAME:**` lines under it to the arrow (G3, and what leaves inventory), and `**THE LOOKOUT** · GIVE THE
 * DEED — **LOOKOUT:** "..." · GIVE anything else — "..."` (Thad's). GIVE is USE with the item held.
 */
function gulchGiving() {
  const doc = read('docs/109-fiddlers-gulch-lines.md');
  const lookout = 'gulch_lookout';
  const head = doc.indexOf('**THE LOOKOUT** · GIVE THE CLARION *(G3)* — ');
  if (head < 0) throw new Error('doc 109: no **THE LOOKOUT** · GIVE THE CLARION *(G3)*');
  const block = doc.slice(head).split('\n');
  const first = gulchSpoken(block[0].split(' — ').slice(1).join(' — '), lookout);
  const scene = [];
  for (const line of block.slice(1)) {
    const m = /^> \*\*(LOOKOUT|THAD):\*\* (.+)$/.exec(line);
    if (!m) { if (scene.length) break; continue; }
    const [spoken] = m[2].split('→');
    scene.push(...gulchSpoken(spoken, m[1] === 'THAD' ? 'thad' : lookout));
    if (m[2].includes('→')) {
      if (!/→ \*\*G3\*\*; THE CLARION leaves inventory\./.test(m[2])) throw new Error(`doc 109: G3's arrow reads "${m[2]}"`);
      break;
    }
  }
  if (first.length !== 1 || !first[0].direction || scene.length < 3) throw new Error('doc 109: G3 did not read as a direction and its exchange');
  const deedRow = doc.split('\n').find((line) => line.startsWith('**THE LOOKOUT** · GIVE THE DEED — '));
  if (!deedRow) throw new Error('doc 109: no **THE LOOKOUT** · GIVE THE DEED');
  const [deedPart, otherPart] = deedRow.split(' · GIVE anything else — ');
  const deed = quoted(deedPart)[0];
  const other = quoted(otherPart ?? '')[0];
  if (!deed || !other) throw new Error('doc 109: THE LOOKOUT · GIVE THE DEED / anything else did not read');
  const source = 'docs/109-fiddlers-gulch-lines.md::THE LOOKOUT';
  return {
    pairs: [
      { item: 'clarion', room: 'gulch_tents', target: lookout, puzzle: 'G3', say: first[0].line,
        note: 'Doc 109, THE LOOKOUT · GIVE THE CLARION (G3): the Clarion says his claim is worth nothing, whichever story '
          + 'Frame printed (B1), and a man who owns nothing is no threat. It leaves inventory.',
        rules: [{ case: 'GIVE THE CLARION', say: first[0].line, by: lookout, direction: true,
          then: scene.map((one) => ({ speaker: one.speaker, line: one.line, ...(one.direction ? { direction: true } : {}) })),
          takes: ['clarion'], set: { T_CAMP_TRUSTS: true }, completes: 'G3' }] },
      { item: 'deed', room: 'gulch_tents', target: lookout, say: deed, note: 'Doc 109, THE LOOKOUT · GIVE THE DEED.',
        rules: [{ case: 'GIVE THE DEED', say: deed, by: lookout }] },
    ],
    targetPools: [{ room: 'gulch_tents', target: lookout, verb: 'USE', lines: [other], except: ['clarion', 'deed'], source }],
  };
}

/**
 * FIDDLER'S GULCH'S THREE ITEMS (doc 109, THE CHANGES IN CONSOLATION): `**NAME** *(item)*` and its LOOK and LISTEN
 * runs, three numbered lines each, extracted from doc 109 where they are written (the brief: never copied into doc
 * 23). The id and the item's name are routing, as doc 23's table supplies them for its items.
 */
const GULCH_ITEMS = {
  'THE THIRD COPY': { id: 'third_copy', name: 'The third copy' },
  'THE BRASS ROD': { id: 'brass_rod', name: 'The brass rod' },
  'THE CLARION': { id: 'clarion', name: 'The Clarion' },
};
function gulchItems() {
  const doc = read('docs/109-fiddlers-gulch-lines.md');
  return Object.entries(GULCH_ITEMS).map(([display, { id, name }]) => {
    const at = doc.indexOf(`**${display}** *(item)*`);
    if (at < 0) throw new Error(`doc 109: no "**${display}** *(item)*"`);
    const body = doc.slice(at).split('\n').slice(1, 4).join('\n');
    const responses = {};
    for (const [verb, label] of [['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
      const line = new RegExp(`^\\*\\*${label}\\*\\* (.+)$`, 'm').exec(body);
      if (!line) throw new Error(`doc 109: ${display} has no ${label} run`);
      const lines = [...line[1].matchAll(/\d "([^"]+)"/g)].map((m) => m[1]);
      if (lines.length !== 3) throw new Error(`doc 109: ${display} ${label} has ${lines.length} lines, not 3`);
      responses[verb] = [{ say: lines[0], repeat: lines.slice(1) }];
    }
    return write(`content/items/${id.replace(/_/g, '-')}.json`, {
      schema: 1, id, name, short: display,
      note: 'EXTRACTED from docs/109-fiddlers-gulch-lines.md (THE CHANGES IN CONSOLATION) by tools/extract-content.mjs. '
        + 'Do not edit: change doc 109 and re-run.',
      responses,
      ...(GIVEN_AWAY[id] ?? {}),
    });
  });
}

// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------

/**
 * Doc 14's Room 2 exits, ALL FIVE.
 *
 * Only THE ASSAY OFFICE used to be read here: the other four "were
 * transcribed before the extraction rule was binding", so their lines lived in
 * main-street.json and nowhere read them again. That held until errata 100's
 * voice pass rewrote doc 14 and the game kept the old words -- and one of them
 * had already drifted, "storeys" in the room file against doc 14's "stories".
 * The rest were converted "when next touched", which is now.
 *
 * Each section heading names the doorway as the player sees it; the table
 * maps it to the exit's id. A heading not in the table, or an exit the table
 * names that the room does not have, is an error rather than a skip.
 */
const ROOM_02_EXITS = {
  "THE NUGGET'S DOORS \u2192 Room 3": 'to_nugget',
  'THE CLARION OFFICE \u2192 Room 9': 'to_clarion',
  'THE IMPROVEMENT COMPANY \u2192 Room 10': 'to_company',
  'THE ROAD TO THE CLAIMS \u2192 Room 22': 'to_claims_road',
  'THE ASSAY OFFICE \u2192 Room 5': 'to_assay_office',
};

function room02Exits() {
  // AND THE CANDIDATE STREET, whose lines are the shipping street's on a new
  // plate (doc 36 Q116). Its exits are carried by compile-room from its own
  // file, so without this they keep whatever words they were copied with --
  // "storeys" outlived the shipping room's fix there.
  return ['content/rooms/main-street.json', 'content/rooms/main-street-candidate.json']
    .filter((path) => existsSync(resolve(ROOT, path)))
    .map((path) => room02ExitsInto(path));
}

function room02ExitsInto(path) {
  const doc = read('docs/14-room-02-exits.md');
  const room = JSON.parse(read(path));

  for (const [heading, id] of Object.entries(ROOM_02_EXITS)) {
    const section = doc.split(`## ${heading}`)[1]?.split(/^---$|^## /m)[0];
    if (!section) throw new Error(`doc 14: no "${heading}" section`);
    const exit = room.exits.find((entry) => entry.id === id);
    if (!exit) throw new Error(`doc 14: ${path} has no ${id} exit`);

    for (const [verb, word] of [['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
      const block = section.split(`**${word}**`)[1];
      if (!block) throw new Error(`doc 14: ${id} has no ${word} run`);
      const lines = [];
      for (const line of block.split('\n')) {
        const numbered = line.match(/^(\d)\. "(.+)"$/);
        if (numbered) lines[Number(numbered[1]) - 1] = numbered[2];
        else if (line.startsWith('**') && lines.length) break;
      }
      if (lines.length !== 3 || lines.some((line) => line === undefined)) {
        throw new Error(`doc 14: ${id} ${word} has ${lines.filter(Boolean).length} of 3 variants`);
      }
      exit.responses = exit.responses ?? {};
      const rules = exit.responses[verb] ?? [{}];
      rules[0].say = lines[0];
      rules[0].repeat = lines.slice(1);
      exit.responses[verb] = rules;
    }

    const overrides = {};
    for (const entry of section.matchAll(/^> (\w[\w ]*?) \u2014 "(.+)"$/gm)) {
      overrides[entry[1].trim().replace(/ /g, '_')] = entry[2];
    }
    if (Object.keys(overrides).length) exit.overrides = { ...(exit.overrides ?? {}), ...overrides };

    // THE STUB MARKING COMES OFF. `stub` means the destination exists so the
    // exit works with its examine layer honestly absent -- a lie once doc 14
    // covers it.
    delete exit.stub;
  }
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
    // ROOM 13 IS COMPILED NOW (errata 86): tools/compile-room.mjs builds it
    // from content/examine/room-13.json, which carries doc 26's lines merged
    // with docs 05, 09 and 54. This pass would rewrite a file it no longer owns.
    if (number === 13 || number === 18 || number === 19) continue;   // compiled by compile-room from annotations (errata 86, 91, 92)
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

  // THE EXAMINE LAYERS: "Each character is a hotspot in their room like
  // anything else" (doc 27). LOOK and LISTEN, three variants each, carried on
  // the character's tree file in the hotspot response shape -- first line,
  // then the repeats -- so a verb pointed at the person reads his lines
  // through the same route, and the same repeat counting, as any object.
  const layers = {};
  const examineDoc = doc.split(/^# EXAMINE LAYERS$/m)[1]?.split(/^# (?!#)/m)[0] ?? '';
  for (const block of examineDoc.split(/^## /m).slice(1)) {
    const title = block.split('\n')[0].trim();
    const run = (label) => {
      const line = block.match(new RegExp(`^\\*\\*${label}\\*\\* (.+)$`, 'm'))?.[1];
      if (!line) throw new Error(`doc 27: ${title} has no ${label} run`);
      const said = [...line.matchAll(/\d "([^"]+)"/g)].map((m) => m[1]);
      if (said.length !== 3) throw new Error(`doc 27: ${title} ${label} has ${said.length} variants, not 3`);
      return [{ say: said[0], repeat: said.slice(1) }];
    };
    layers[title] = { LOOK_AT: run('LOOK'), LISTEN_TO: run('LISTEN') };
  }

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
      const [said, ...after] = responseCell.split('→');
      // ASKED AGAIN (errata 172, doc 99's rewrite): *(again)* "..." is the answer to the same question twice.
      const [spoken, againCell] = said.split('*(again)*');
      const again = againCell ? /"([^"]+)"/.exec(againCell)?.[1] : undefined;
      const lines = speech(spoken, who.speaker);
      for (const note of stageDirections(spoken)) {
        directions.push(`${title} option ${number}: ${note}`);
      }

      const option = { id: `${who.speaker}${number}`, text, tag, ...(again ? { repeat: again } : {}) };
      const follows = afterIds(tagCell, who.speaker);
      if (follows) option.after = follows;
      // A FLAG GATE IN THE TAG CELL (errata 172): `when FLAG` offers the option once the flag is set, `unless FLAG`
      // while it is not -- the Pike question before the undertaker has told him, "You knew Pike was dead." after.
      const gate = /\b(when|unless) `?([A-Z][A-Z_0-9]+)`?/.exec(tagCell ?? '');
      if (gate) option.when = { [gate[2]]: gate[1] === 'when' };
      // `ends` in the tag cell: the conversation closes after this exchange,
      // as an EXIT's does (doc 27's note; Vessel's option 6, doc 57 A3).
      if (/(^|·)\s*ends\s*(·|$)/.test(tagCell.replace(/`[^`]*`/g, ''))) option.ends = true;
      // A bold puzzle id after the arrow is the puzzle the option completes.
      const completes = after.join('→').match(/\*\*([A-F]\d+)\*\*/);
      if (completes) option.puzzle = { [completes[1]]: 'complete' };
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
      // A1 IS THE NEWS (doc 02: "the Undertaker finally states Pike died six
      // years ago"; doc 57 A1). The option that writes T_PIKE_DEAD completes it
      // (errata 86 D) -- routing, as A8_CASES is.
      if (option.set?.T_PIKE_DEAD) option.puzzle = { A1: 'complete' };
      options.push(option);
    }

    if (options.length < 3) throw new Error(`doc 27: ${title} has ${options.length} options`);
    // Vessel's Act II root is doc 04's, merged here so he is one tree.
    const actTwo = who.tree === 'DEKE_VESSEL' ? vesselActTwo() : null;
    // And his Act IV node, the hotel (errata 180).
    const actFour = who.tree === 'DEKE_VESSEL' ? vesselActFour() : null;
    // The undertaker's Act III node is doc 04's, merged here so he is one tree.
    const actThree = who.tree === 'UNDERTAKER' ? undertakerActThree() : null;

    written.push(write(`content/dialogue/${who.tree.toLowerCase().replace(/_/g, '-')}.json`, {
      schema: 1,
      id: who.tree,
      // WHO SPEAKS THE REPLIES, AND IT WAS KNOWN AND NEVER WRITTEN. The WHO
      // table above has carried a speaker id per tree all along; the emitted
      // file did not. With no `speaker`, DialogueRunner leaves `sayer` null,
      // so the renderer cannot find a head to put the words over and drops
      // them to the top-centre fallback -- and colours them as unattributed,
      // which is why Tyler saw the map seller's line at the top of the screen
      // in Thad's colour. Only stage-driver declared one, so every other
      // character in the game had this.
      speaker: who.speaker,
      name: title,
      note: `EXTRACTED from docs/27-minor-trees.md by tools/extract-content.mjs. Do not `
        + `edit: change doc 27 and re-run. Speakers come from the document's own `
        + `typography -- plain quotes are ${who.speaker}, italic quotes are Thad, and `
        + `an italic bracket is a stage direction nobody says.`,
      examine: layers[title] ?? (() => { throw new Error(`doc 27: ${title} has no examine layer`); })(),
      nodes: {
        root: {
          id: 'root',
          prompt: rootSpeech[0].line,
          // THE ROOT IS SAID, NOT CAPTIONED. Doc 30 section 14 stopped drawing
          // `prompt` anywhere, and a root line that lived only there was never
          // heard: Vessel's "You're the piano man." -- his whole opening, per
          // doc 27's "He opens" -- the undertaker's "Yes." and the clerk's
          // "Mr. Grubbe." all played as silence before the list. Carried as the
          // node's opening, the greeting is performed before the options, the
          // same route every act-root greeting already takes.
          opening: [rootSpeech[0]],
          options,
        },
        ...(actTwo ? { VES_B1: vesselBackFromTheGulch(actTwo.node) } : {}),
        ...(actFour ? { VES_F1: actFour.node } : {}),
        ...(actThree ? { UND_C1: actThree.node } : {}),
      },
      ...(actTwo ? { entries: [...(actFour?.entries ?? []), ...actTwo.entries] } : {}),
      // Doc 03's Duel One opening, said in the Gulch at THE FIND (doc 109; reference/room-52/annotation.json's scene).
      ...(actTwo ? { duelOneOpening: actTwo.node.opening } : {}),
      ...(actThree ? { entries: actThree.entries } : {}),
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

// ---------------------------------------------------------------------------

/**
 * ROOM 1'S OWN LINES, READ FROM THE DOCUMENTS THAT WRITE THEM.
 *
 * Room 1 predates the room compiler, and until errata 100 only its case was
 * extracted: every other line in stage-road.json was carried in the file, so
 * the voice pass rewrote doc 17 and the game did not change, and
 * check-room-lines-sourced said so. The sources, most specific first, are the
 * same ones the room file's own note names:
 *
 *   errata 19a  -- the coach present and gone, the team, the lamp crossing
 *                  (a full line set per state, which overrides the docs)
 *   doc 17      -- the sign, the mud and the road east (variants 2-3), both
 *                  ways west, and PART THREE's overrides
 *   doc 05      -- variant 1 of the mud and the road east, which doc 17 left
 *
 * Only `say` and `repeat` are written, on the response a line set already
 * has, so a flag the lamp writes or a gate a state carries is never touched.
 */
function roomOneLines(room, doc17) {
  const errata = read('docs/00-errata.md');
  const doc05 = read('docs/05-examine-layer.md');
  const target = (id) => {
    const found = [...room.hotspots, ...room.exits].find((entry) => entry.id === id);
    if (!found) throw new Error(`Room 1 has no "${id}" for its lines`);
    return found;
  };
  const write = (id, verb, said, where) => {
    if (said.length !== 3 || said.some((line) => line === undefined)) {
      throw new Error(`${where}: ${id} ${verb} has ${said.filter(Boolean).length} of 3 variants`);
    }
    const into = target(id);
    into.responses = into.responses ?? {};
    const rules = into.responses[verb] ?? [{}];
    if (rules.length !== 1) throw new Error(`${where}: ${id} ${verb} has ${rules.length} rules; Room 1 writes one`);
    rules[0].say = said[0];
    rules[0].repeat = said.slice(1);
    into.responses[verb] = rules;
  };
  const run = (text, heading) => {
    const found = text.match(new RegExp(`^>?\\s*(?:\\*\\*${heading}:?\\*\\*|${heading})\\s+(1\\s+".+)$`, 'm'));
    return found ? variants(found[1]) : [];
  };

  const canonical = errata.split('**Room 1, canonical:**')[1]?.split(/^## /m)[0];
  if (!canonical) throw new Error('errata 19a: no "Room 1, canonical" block');
  const block = (title) => {
    const start = canonical.indexOf(title);
    if (start < 0) throw new Error(`errata 19a: no ${title}`);
    return canonical.slice(start).split(/\n\*\*THE /)[0];
  };
  for (const [id, title] of [['coach', '**THE COACH — state A'], ['coach_gone', '**THE COACH — state B'], ['team', '**THE TEAM']]) {
    write(id, 'LOOK_AT', run(block(title), 'LOOK'), 'errata 19a');
    write(id, 'LISTEN_TO', run(block(title), 'LISTEN'), 'errata 19a');
  }
  const crossing = block("**THE WATCHMAN'S LAMP").split('**Gone:**')[0];
  write('lamp', 'LOOK_AT', run(crossing, '\\*\\*Crossing:\\*\\* LOOK'), 'errata 19a');
  write('lamp', 'LISTEN_TO', run(crossing, 'LISTEN'), 'errata 19a');

  const section17 = (heading) => {
    const part = doc17.split(new RegExp(`^## ${heading}.*$`, 'm'))[1]?.split(/^## |^---|^# /m)[0];
    if (!part) throw new Error(`doc 17: no "## ${heading}" section`);
    return part;
  };
  const room05 = doc05.split(/^## ROOM 1 — .*$/m)[1]?.split(/^## /m)[0] ?? '';
  const first05 = (title, heading) => {
    const part = room05.split(`**${title}**`)[1]?.split(/\n\*\*THE |\n\*\*HIS /)[0] ?? '';
    const found = part.match(new RegExp(`\\*\\*${heading}:\\*\\* "([^"]+)"`));
    if (!found) throw new Error(`doc 05 Room 1: no ${title} ${heading}`);
    return found[1];
  };
  write('town_sign', 'LOOK_AT', run(section17('THE TOWN SIGN'), 'LOOK'), 'doc 17');
  write('town_sign', 'LISTEN_TO', run(section17('THE TOWN SIGN'), 'LISTEN'), 'doc 17');
  for (const [id, title, heading] of [['mud', 'THE MUD', 'THE MUD'], ['road_east', 'THE ROAD EAST', 'THE ROAD EAST']]) {
    for (const [verb, word] of [['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
      const later = section17(heading).match(new RegExp(`^\\*\\*${word}\\*\\*(.+)$`, 'm'))?.[1] ?? '';
      const said = variants(`1 "${first05(title, word)}" · ${later}`);
      write(id, verb, said, 'docs 05 and 17');
    }
  }
  const westSection = section17('THE ROAD WEST → Room 2');
  write('road_west', 'LOOK_AT', run(westSection, 'LOOK'), 'doc 17');
  write('road_west', 'LISTEN_TO', run(westSection, 'LISTEN'), 'doc 17');
  const blocked = section17('THE ROAD WEST, BEFORE THE CASE');
  for (const [verb, word] of [['WALK_TO', 'WALK TO'], ['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
    write('road_west_blocked', verb, run(blocked, word), 'doc 17');
  }
  const fallback = run(blocked, 'ANY OTHER VERB');
  if (fallback.length !== 3) throw new Error('doc 17: road west before the case has no ANY OTHER VERB run');
  target('road_west_blocked').fallback = fallback;

  // PART THREE's overrides, by the name the document calls each thing.
  const NAMES = { 'THE SIGN': 'town_sign', 'THE MUD': 'mud', 'THE COACH': 'coach', 'THE LAMP': 'lamp', 'THE ROAD EAST': 'road_east' };
  const overrides = doc17.split(/^# PART THREE — OVERRIDES.*$/m)[1]?.split(/^## |^# /m)[0];
  if (!overrides) throw new Error('doc 17: no PART THREE — OVERRIDES');
  for (const row of overrides.matchAll(/^> \*\*([A-Z' ]+)\*\* · ([A-Z ]+?) — (?:\*\([^)]*\)\* )?"([^"]+)"/gm)) {
    const [, name, verb, line] = row;
    const id = NAMES[name.trim()];
    if (!id) continue;
    const into = target(id);
    into.overrides = { ...(into.overrides ?? {}), [verb.trim().replace(/ /g, '_')]: line };
  }

  // DOC 49'S ROOM 1, WHERE DOC 17 IS SILENT (errata 184). Room 1 predates the
  // compiler, which is where every other room with its own document reads doc
  // 49: "a verb only doc 49 writes is added; a verb both write keeps the room
  // doc's line". So THE TOWN SIGN's PUSH, THE MUD's USE and THE ROAD EAST's
  // TALK TO are added, and doc 17's TALK TO, PICK UP and OPEN stand.
  const NAMES49 = { 'THE TOWN SIGN': 'town_sign', 'THE MUD': 'mud', 'THE ROAD EAST': 'road_east', 'HIS CASE': 'case_mud' };
  const room49 = read('docs/49-wrong-answers.md').split(/^## ROOM 1 — .*$/m)[1]?.split(/^## /m)[0];
  if (!room49) throw new Error('doc 49: no "## ROOM 1" section');
  for (const row of room49.matchAll(/^\*\*([A-Z' ]+)\*\* · ([A-Z_]+) — "([^"]+)"/gm)) {
    const [, name, verb, line] = row;
    const id = NAMES49[name.trim()];
    if (!id) throw new Error(`doc 49 Room 1: "${name}" names no Room 1 hotspot`);
    const into = target(id);
    if (into.overrides?.[verb] || into.responses?.[verb]) continue;
    into.overrides = { ...(into.overrides ?? {}), [verb]: line };
  }
}

/**
 * Doc 17's HIS CASE, which now has THREE STATES and is the game's first PICK UP.
 *
 * The old single hotspot answered PICK UP with "I have it. I have had it the
 * entire time," which is false while the case is on the coach roof and false
 * again while it is lying in the mud. Doc 17 replaces it with a state per
 * place the case can be, and the third state is not a hotspot at all:
 *
 *   A  on the coach roof, beats 1-5   -- reaching for it is refused
 *   B  in the mud, from beat 6        -- PICK UP TAKES IT
 *   C  carried                        -- the hotspot is gone
 *
 * State C needs no data. GameState.targets already filters out anything the
 * actor owns -- doc 22 item 9, taking something is an ownership change -- so
 * `take: true` on state B's PICK UP is the whole of state C.
 *
 * The two drawn states follow ruling 19a's pattern exactly, the one the coach
 * already uses: two hotspots sharing a name, gated on one flag, rather than
 * one hotspot with two rule sets. The NAME does not change but the PLACE does,
 * and a hotspot is a rectangle before it is anything else.
 */
function openingCase() {
  const doc = read('docs/17-opening-sequence.md');
  const path = 'content/rooms/stage-road.json';
  const room = JSON.parse(read(path));

  const section = doc.split(/^## HIS CASE.*$/m)[1]?.split(/^## /m)[0];
  if (!section) throw new Error('doc 17: no HIS CASE section');

  // THE DOCUMENT MAY DESCRIBE MORE STATES THAN THE ROOM BUILDS, and this map
  // is the list of the ones it builds. Nothing else here needs to change when
  // doc 17 gains or loses a state: a letter that is not here has its lines
  // reported by name and dropped, which is exactly how state C -- "the hotspot
  // is gone" -- has always worked.
  //
  // A IS GONE BECAUSE THE CASE NO LONGER STARTS ON THE ROOF. The ruling is
  // that it is on the ground from the first frame, so "still up on the roof,
  // under the driver's hand" describes a place the case is never in.
  //
  // AND IT WAS NOT MERELY UNREACHABLE, IT WAS LIVE AND WRONG. `case_roof` was
  // gated `T_CASE_DOWN: true` and beat 6 writes that flag, so from beat 6
  // onward the roof hotspot switched ON -- at x1078 y341, eight feet up, with
  // the coach already gone -- and answered about a driver who had left. Two
  // hotspots named HIS CASE, live together, one of them over empty sky. The
  // gate had been inverted at some point from "while the case is NOT down" to
  // "while it is", and inverting a gate does not remove a state, it moves it.
  //
  // A STATE IS REMOVED BY REMOVING IT. Doc 17's state A prose is untouched and
  // is now a reported orphan, awaiting the revision that is the writer's.
  const STATES = { B: 'case_mud' };

  // AND THE HOTSPOT IS DELETED HERE RATHER THAN BY HAND, so it cannot come
  // back. Removing a letter from STATES stops the extractor WRITING to a
  // hotspot; it does not remove one already in the room, and a target nothing
  // writes to is a target nothing corrects either. Retiring it in the
  // generator makes the deletion idempotent and leaves a name to search for.
  const RETIRED = ['case_roof'];
  const before = room.hotspots.length;
  room.hotspots = room.hotspots.filter((entry) => !RETIRED.includes(entry.id));
  for (let gone = before - room.hotspots.length; gone > 0; gone -= 1) {
    process.stderr.write(`  doc 17 RETIRED: a case hotspot the design no longer has\n`);
  }
  const VERBS = { LOOK: 'LOOK_AT', LISTEN: 'LISTEN_TO' };
  const orphans = [];

  for (const block of section.matchAll(
    /^\*\*State ([ABC]) —(.*?)\*\*(.*)\n((?:(?:\*\*|>).*\n)*)/gm)) {
    const [, letter, label, tail, body] = block;
    const id = STATES[letter];
    if (!id) {
      // A STATE THE ROOM DOES NOT BUILD. Its lines belong to nothing -- a
      // hotspot that does not exist cannot answer LISTEN -- so they are
      // reported by name and dropped, never wired to the nearest thing.
      //
      // State C has always been one of these: "the hotspot is gone", carrying
      // two leftover LISTEN variants from the single-state version. State A
      // is one now. THE MESSAGE NAMES THE LETTER because it used to say
      // "state C" for every orphan regardless, and the moment a second state
      // was retired it began reporting A's lines under C's name -- a label
      // that was correct exactly as long as there was only one thing to
      // label, which is the whole R5k family in miniature.
      for (const line of quoted(body)) orphans.push({ letter, line });
      continue;
    }
    const target = room.hotspots.find((entry) => entry.id === id);
    if (!target) throw new Error(`doc 17: stage road has no hotspot "${id}"`);

    for (const [verb, heading] of [[VERBS.LOOK, 'LOOK'], [VERBS.LISTEN, 'LISTEN']]) {
      const run = body.match(new RegExp(`^\\*\\*${heading}\\*\\*(.+)$`, 'm'));
      if (!run) throw new Error(`doc 17: state ${letter} has no ${heading} run`);
      const said = variants(run[1]);
      if (said.length !== 3 || said.some((line) => line === undefined)) {
        throw new Error(`doc 17: state ${letter} ${heading} has ${said.length} variants`);
      }
      target.responses = target.responses ?? {};
      target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
    }

    target.overrides = {};
    for (const entry of body.matchAll(/^> (.+)$/gm)) {
      // Two forms. A plain refusal is `VERB — "line"`. The one that TAKES the
      // object is written with the verb in bold and the line in italics --
      // `**PICK UP — takes it.** *"I have it."*` -- because it is a different
      // kind of thing and doc 17 marks it as one. "takes it" is the flag.
      const takes = entry[1].match(/^\*\*(\w[\w ]*?) — takes it\.\*\*\s*\*"(.+?)"\*/);
      if (takes) {
        // `take: true` ALONE TAKES NOTHING. It is a claim that something was
        // taken, not an instruction to take anything -- so PICK UP said "I
        // have it", the inventory stayed empty and the case stayed on the
        // ground. The three items and the flag are what actually happens.
        //
        // THE CASE IS A CONTAINER, NOT AN ITEM. Its CONTENTS enter the
        // inventory and the case itself does not, so Thad never carries it
        // around town -- which is Q11 answered by there being nothing to
        // carry. The letter, the tuning fork and four dollars: what a piano
        // tuner arriving to make his fortune has, and the driver's tree turns
        // on him having exactly four.
        //
        // T_CASE_TAKEN gates this hotspot, so the write removes the case from
        // the ground.
        target.responses[takes[1].trim().replace(/ /g, '_')] = [
          {
            say: takes[2],
            take: true,
            items: ['letter', 'tuning_fork', 'four_dollars'],
            set: { T_CASE_TAKEN: true },
          },
        ];
        continue;
      }
      const plain_ = entry[1].match(/^(\w[\w ]*?) — "(.+?)"/);
      if (!plain_) throw new Error(`doc 17: cannot read case override "${entry[1].slice(0, 40)}"`);
      target.overrides[plain_[1].trim().replace(/ /g, '_')] = plain_[2];
    }
    if (Object.keys(target.overrides).length === 0) delete target.overrides;
    target.note = `Doc 17, state ${letter}:${label.replace(/\*/g, '')}${tail.replace(/\*/g, '')}`
      .replace(/\s+/g, ' ').trim();
  }

  for (const { letter, line } of orphans) {
    process.stderr.write(`  doc 17 ORPHAN: state ${letter} has no hotspot in the room and `
      + `still carries a line -- "${line.slice(0, 52)}..."\n`);
  }

  // THE LAMP IS HOW YOU SPEAK TO HOB, so every response on it writes the flag
  // that lets doc 17 beat 9 begin.
  //
  // HE IS A MOVER AND NOT A TARGET. There is no rect on him, `targetAt` never
  // returns him, and TALK_TO cannot reach him at all -- so the lamp he is
  // carrying is the only part of him a player can address. Its hotspot already
  // sits at x480-600, which is where he now stands: it was authored for a man
  // crossing the road and it lands on a man standing still.
  //
  // ON BOTH VERBS RATHER THAN ONE, because which of LOOK and LISTEN a player
  // tries first is not something to be right about. The LINES are untouched --
  // they are doc 05's and doc 17's, extracted above; this adds only the write,
  // which is routing and not writing.
  //
  // IT LIVES IN THE EXTRACTOR because the room file is regenerated whole. Hand
  // -editing it survives until the next extraction and then vanishes silently,
  // which is the same trap the speakers table sets for a colour.
  // THE WEST EXIT STARTS THE ENDING RATHER THAN TAKING IT. Taking it writes
  // T_THAD_LEAVING, which releases doc 17 beat 11; the beat walks him through
  // the gap and does the travel itself when it ends. An exit that moves you
  // the instant you touch it cannot also be a departure you watch.
  //
  // Both here rather than hand-edited into the room, because the room file is
  // regenerated whole and a hand edit survives until the next extraction.
  const west = room.exits.find((entry) => entry.id === 'road_west');
  if (!west) throw new Error('stage road has no "road_west" exit to start the ending from');
  // THE GAP IS THE OPENING IN THE FENCE, WHICH IS ABOVE THE BAND. The rect ran
  // y480-700 and reached down into the walkable ground, where it sat on top of
  // THE WATCHMAN'S LAMP -- and `targetAt` returned the exit, so clicking Hob's
  // lantern started the ending instead of speaking to him. Found by the
  // gauntlet: its lamp click wrote no flag and beat 9 held until the deadline.
  //
  // MEASURED: Hob stands at (475, 700) drawn 224 tall, and the flame in his own
  // frames lands at world x510-517, y595-615 -- inside the gap's x500-650.
  // They are in the same column of the picture, so the fix is the exit's
  // HEIGHT: the fence's opening is what you walk through, and the lantern
  // hangs below it.
  // THE WHOLE TOWN IS THE TARGET, NOT THE GAP IN THE FENCE. 150x110 was the
  // opening you walk through, which is correct as a doorway and wrong as a
  // click target -- Tyler could not reliably hit it. Consolation itself is
  // what a player aims at: the lit buildings below and west, which the room's
  // own lightSources put at x0-444, y336-468.
  //
  // It cannot swallow the road: the walkable bands begin at y660 and this
  // stops at y580, so clicking the ground still walks.
  //
  // AND IT STOPS SHORT OF THE TOWN SIGN, which stands at x204-396. The first
  // widening covered it, and check-occlusion caught what that means: this exit
  // declares travelWhenTold, so it does not open a door -- it starts a
  // scripted departure. A click meant for the sign would have left town.
  // Everything west of the sign is town and is the target; the sign keeps its
  // own rect and its own LOOK line.
  west.rect = [400, 330, 260, 250];
  // GATED ON THE CASE AS WELL AS ON HOB. He could walk out of Room 1 leaving
  // his letter, his tuning fork and his four dollars in the mud -- everything
  // he owns -- and nothing stopped him.
  //
  // A GATE CANNOT SPEAK: a `when` that fails removes the target entirely. So
  // the refusal is a second target over the same rect with the opposite gate,
  // ruling 19a's pattern, as coach/coach_gone and lamp/lamp_gone already do.
  //
  // AND IT COULD NOT BE A GATED RESPONSE ON THE EXIT ITSELF. resolveExit
  // returns before the response resolves -- its own comment says so, which is
  // why `set` on an exit response never fires -- so a WALK_TO branch carrying
  // `when` here would never be reached.
  west.when = { T_HOB_GONE: true, T_CASE_TAKEN: true };
  // The sentence line should say where he is going. Its own LOOK line is
  // "Consolation. There are lamps on in about a third of it": what is at the
  // end of that road is the town, not a compass point.
  west.name = 'CONSOLATION';
  room.hotspots = room.hotspots.filter((entry) => entry.id !== 'road_west_blocked');
  room.hotspots.push({
    id: 'road_west_blocked',
    name: 'CONSOLATION',
    rect: west.rect,
    colour: west.colour,
    when: { T_HOB_GONE: true, T_CASE_TAKEN: false },
    defaultVerb: 'WALK_TO',
    note: 'THE ROAD WEST BEFORE HE HAS HIS CASE. Same rect and name as the exit, opposite '
      + 'gate, and it does not travel. The refusal does not reuse the case\'s own joke -- '
      + 'case_mud\'s LOOK already carries "Everything I own. It is not heavy and that is the '
      + 'whole difficulty" -- and it counts, because he counts: the case grants exactly three '
      + 'items.',
    // ITS LINES ARE DOC 17'S, read by roomOneLines below. They were typed
    // here when the case became required, which made the extractor the only
    // source of nine spoken lines (errata 100's Room 1 pass moved them).
    responses: {},
    fallback: [],
  });
  west.rectNote = 'THE FULL GAP, x500-650, measured off the plate with a ruler. It was narrowed '
    + 'to x500-590 so it could coexist with the lamp, which left Hob NEITHER BLOCKING NOR CLEAR '
    + '-- a man in a doorway you walk around. Q63: he blocks it, and clearing him is the way '
    + 'out.\n\ny470-580 IS THE OPENING IN THE FENCE and stops above the lantern, which is the '
    + 'separation that survives him leaving. The gate closes the exit while he is there, so the '
    + 'two are never live together WHILE HE STANDS -- but lamp_gone is live at exactly the same '
    + "time as the exit, at the lamp's own rect, and it would inherit the collision. Splitting "
    + 'them VERTICALLY is what makes that impossible: the fence opening is what you walk '
    + 'through and the lantern hangs below it, and no sideways nudge is honest because they '
    + 'share a column.';
  // SET HERE RATHER THAN LEFT WHERE IT WAS. `note` said "NARROWED FROM 150
  // WIDE TO 90 BECAUSE HOB STANDS IN THIS GAP", which stopped being true when
  // the separation went vertical and the width went back to 150. Nothing in
  // this file was setting it, so it survived two rect changes describing
  // neither -- a field the generator does not own cannot be kept honest by
  // the generator, and the extractor merges into the room rather than writing
  // it fresh, so a stranded string stays stranded forever.
  west.note = 'THE FULL WIDTH OF THE GAP, x500-650. It was cut to 90 wide to dodge the lamp '
    + 'sideways; that is not the shape of the problem. Hob and the lantern are in the SAME '
    + 'COLUMN of the picture as the way out, so the only honest separation is vertical: the '
    + 'opening in the fence is what you walk through and the lantern hangs below it.\n\n'
    + 'Thad walks through at 575. Q63 gates it on T_HOB_GONE so it is shut while he stands '
    + 'there -- but lamp_gone is live at the same time as the exit, so the geometry has to '
    + 'hold on its own and not lean on the gate. tools/check-exit-collisions.mjs asserts that '
    + 'it does.';
  west.setOnTransit = { T_THAD_LEAVING: true };
  west.travelWhenTold = true;
  west.endingNote = 'Doc 17 beat 11. Taking this writes T_THAD_LEAVING and goes nowhere; '
    + 'the beat that flag releases walks him through the gap and travels at its end. '
    + 'setOnTransit exists because doc 14 says transit produces no line -- and a flag write '
    + 'is not a line, which is the same argument stateOnTransit is made from.';

  roomOneLines(room, doc);

  const lamp = room.hotspots.find((entry) => entry.id === 'lamp');
  if (!lamp) throw new Error('stage road has no "lamp" hotspot for Hob to be spoken to through');
  // AND IT IS WHERE THE LANTERN ACTUALLY IS. The rect was x480-600 y444-612,
  // authored for a man CROSSING the road; he stands still at (475, 700) now
  // and the flame in his own idle frames lands at world x510-517, y595-615 at
  // his drawn 224. The old rect was mostly empty sky above it.
  // MEASURED AT HIS CURRENT POSITION, NOT RECONCILED WITH AN OLD ONE. He was at
  // (475, 700) when the last rect was derived and he is at (600, 720) now; the
  // depth curve puts him at 230 tall there and the flame in his own idle frames
  // lands at world x636-643, y612-632. Both rects came from where he stood, and
  // he moved, so both were re-measured rather than argued about.
  // LAMP_GONE IS DELETED, BY TYLER'S RULING, AND HE ASKED FOR IT REPEATEDLY.
  //
  // It was a designed paired state -- ruling 19a, the shape coach/coach_gone
  // uses -- with authored lines about watching the lantern recede: "The lamp,
  // away up the street. It has not once looked back at me."
  //
  // WHY IT READ AS A BUG ANYWAY. It sat on the SAME RECT as the lamp, which is
  // where Hob stood, not up the street where the lines look. So after he left,
  // hovering the empty fence still said THE WATCHMAN'S LAMP and the hotspot
  // was indistinguishable from one that had failed to clear. The gate was
  // working perfectly and the room read as though it were not.
  //
  // The lines are not lost -- they are in the history at this commit, and in
  // doc 36's table -- and if the beat is wanted back it wants a rect where the
  // lamp actually went, which is off frame right.
  room.hotspots = room.hotspots.filter((entry) => entry.id !== 'lamp_gone');
  for (const target of [lamp]) {
    if (!target) continue;
    target.rect = [610, 586, 60, 73];
    target.rectNote = 'Around the lantern: the flame in his own idle frames is at world '
      + 'x636-643 y612-632 with him at (600, 720) drawn 230 tall, plus 26px of grab. It must '
      + 'clear road_west, which stops at y580 -- lamp_gone especially, because that one is live '
      + 'at the same time as the exit and would otherwise take a click meant for the lamp and '
      + 'start the ending.';
    // THREE READINGS OF THE SAME LANTERN, AND THE RECT HOLDS ALL THREE.
    // x626-653 y593-618 was the lantern housing; x636-643 y612-632 was the
    // flame at a loose threshold. They do not nest -- the second runs 14px
    // below the first, which cannot be true of a flame inside a lamp -- so
    // rather than pick one, it was measured a third time from something
    // neither used: the rig's own `figure` box, [632, 1365], scaled by
    // 230/1365 about the feet at (600, 720), taking the brightest 0.05% of
    // opaque pixels in idle-00. That lands at world x638-643, y612-624.
    // It agrees with the flame reading on x and on its top edge, and says
    // the loose one over-ran at the bottom. x610-670 y586-659 contains all
    // three, so no reading changes the rect -- which is why this is a note
    // and not a correction.
    target.rectMeasuredNote = 'Third reading, from the rig rather than from a composed frame: '
      + 'brightest 0.05% of opaque pixels in hob-idle-right/idle-00.png, mapped through '
      + "rig.figure [632, 1365] at scale 230/1365 about the feet, is world x638-643 y612-624. "
      + 'The rect contains this, the flame reading and the housing reading alike.';
  }
  const speaking = ['LOOK_AT', 'LISTEN_TO'];
  for (const verb of speaking) {
    const said = lamp.responses?.[verb];
    if (!said?.length) throw new Error(`the lamp has no ${verb} response to carry the write`);
    for (const rule of said) rule.set = { ...(rule.set ?? {}), T_HOB_SPOKEN: true };
  }
  // TALK TO IS SPEAKING TO HIM (errata 283). Doc 17 wrote THE LAMP · TALK TO "only before beat 8", and before beat 8
  // the player has no control, so the override was never legitimately reachable -- and once a click with no verb
  // only walks, as in the first Monkey Island, TALK TO is how a player speaks to anyone. After beat 8 it begins the
  // exchange, with no line of Thad's in front of it: beat 9 is the talk.
  if (lamp.overrides?.TALK_TO) delete lamp.overrides.TALK_TO;
  if (lamp.overrides && !Object.keys(lamp.overrides).length) delete lamp.overrides;
  lamp.responses.TALK_TO = [{ set: { T_HOB_SPOKEN: true } }];
  lamp.setNote = 'EVERY RESPONSE HERE WRITES T_HOB_SPOKEN, which is what holds doc 17 beat 9. '
    + 'Hob is a MOVER and not a target -- there is no rect on him and TALK_TO cannot reach him -- '
    + 'so the lamp he carries is the only part of him a player can address, and this hotspot '
    + 'already sits where he now stands. Looking at it or listening to it is speaking to him, and '
    + 'the exchange follows. Added by tools/extract-content.mjs: the lines are the document\'s, '
    + 'the write is routing.';
  // HIS BODY IS THE LAMP'S TOO (the bookends audit, finding 4; errata 129).
  // A click on him answers through this hotspot, so TALK TO plays the
  // override doc 17 wrote for him instead of nothing at all.
  lamp.heldBy = 'hob';
  lamp.heldByNote = 'A click on the figure who carries this (Hob, a mover with no rect of his own) is a '
    + 'click on it: LOOK and LISTEN speak to him as the lamp does, and TALK TO plays his written '
    + "override. Hovering him names the lamp. Errata 129.";

  return write(path, room);
}


/**
 * DOC 23, ACT II ITEMS: the submission log. Act I's eight items were written
 * into content/items by hand from the same document; this one is extracted,
 * so its words can only be the document's. The section is a `## THE ...`
 * heading, an italic acquisition line, and LOOK / LISTEN runs of three
 * numbered quoted lines: the first is `say`, the rest `repeat`, exactly the
 * shape the hand-written items carry. The full and display names come from
 * the section's table row.
 */
function actTwoItems() {
  const doc = read('docs/23-inventory-act1.md');
  const from = doc.indexOf('## Act II items');
  if (from < 0) throw new Error('doc 23: no Act II items section');
  const body = doc.slice(from, doc.indexOf('## Notes', from));
  const out = [];
  for (const row of body.matchAll(/^\| ([a-z_]+) \| (.+?) \| (.+?) \|$/gm)) {
    const [, id, fullName, display] = row;
    if (id === 'Item') continue;
    const heading = new RegExp(`^## ${display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n([\\s\\S]*?)(?=^## |^---)`, 'm');
    const section = heading.exec(body);
    if (!section) throw new Error(`doc 23: no section for ${display}`);
    const responses = {};
    for (const [verb, label] of [['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
      const line = new RegExp(`^\\*\\*${label}\\*\\* (.+)$`, 'm').exec(section[1]);
      if (!line) throw new Error(`doc 23: ${display} has no ${label} run`);
      const lines = [...line[1].matchAll(/\d "([^"]+)"/g)].map((m) => m[1]);
      if (lines.length !== 3) throw new Error(`doc 23: ${display} ${label} has ${lines.length} lines, not 3`);
      responses[verb] = [{ say: lines[0], repeat: lines.slice(1) }];
    }
    const acquired = /^\*(.+)\*$/m.exec(section[1])?.[1] ?? '';
    // ITEMS FOLLOW THE FLAG (doc 57 A3, doc 36 Q141 route 1). "Held from the
    // start. Traded at A3" is the watch's own acquisition line: carried from
    // a new game until the swindle, which is the flag T_SWINDLED. Its return
    // at B6 is the duel's grant, ordinary inventory.
    const held = /Held from the start\./.test(acquired) && /Traded at A3/.test(acquired)
      ? { heldWhen: { T_SWINDLED: false },
        heldNote: 'From doc 23\'s acquisition line: held from the start until A3 (T_SWINDLED), back at B6 by the duel\'s grant.' }
      : {};
    out.push(write(`content/items/${id.replace(/_/g, '-')}.json`, {
      schema: 1,
      id,
      name: fullName,
      short: display,
      // Errata 66 A is the submission log's ruling, and was stamped on every
      // item here -- the loan and the linen money among them, which are spent
      // and given (the items audit, errata 140).
      note: `EXTRACTED from docs/23-inventory-act1.md (Act II items) by tools/extract-content.mjs. Do not edit: change doc 23 and re-run. ${acquired}`,
      responses,
      ...held,
      ...(FILED_AT_F5.has(id) ? { lostWhen: { T_FILED: true }, lostNote: FILED_NOTE } : {}),
      ...(GIVEN_AWAY[id] ?? {}),
    }));
  }
  return out;
}

/**
 * WHAT IS LAID ON THE COUNTER AT F5 IS ON FILE AFTER IT (errata 133; the
 * bookends audit, finding 10, which Tyler agreed): items follow the flag, as
 * the watch and the four dollars do, so a save restores it by restoring
 * T_FILED. THE DEED is hand-written (content/items/deed.json) and says the
 * same; these three are written here.
 */
const FILED_AT_F5 = new Set(['death_certificate', 'document_c', 'sample']);

/**
 * WHAT IS HANDED OVER IN CONVERSATION FOLLOWS THE FLAG THE HANDING WRITES. A
 * tree may not write inventory (doc 36 Q141 route 1), so an item a character
 * takes in a conversation leaves by the flag that exchange sets, as the four
 * dollars leave by T_SWINDLED. Doc 23: THE LINEN MONEY is "Given to Sheng";
 * doc 57 D4: "SHE_D1 option 1′ — Sheng takes it", which writes T_PRATT_TRAIL.
 * It stayed in the inventory to the end of the game (the items audit, errata 140).
 */
const LODGED_AT_E0 = 'Lodged with Sump at E0 (doc 23; errata 247): SUM_B1\'s Document C option takes A, B and D together and issues C, '
  + 'and writes T_CLAIM1_BLANK. It leaves the inventory with that flag. "It took three pieces of paper to earn this one."';
const GIVEN_AWAY = {
  linen_money: { lostWhen: { T_PRATT_TRAIL: true },
    lostNote: 'Given to Sheng at SHE_D1 option 1′ (doc 23; doc 57 D4), which writes T_PRATT_TRAIL: it leaves the inventory with that flag (errata 140).' },
  // PAPERS THAT ONLY PROVE PROGRESS STOP SITTING IN THE INVENTORY (errata 247; Tyler, 2026-11-09).
  document_a: { lostWhen: { T_CLAIM1_BLANK: true }, lostNote: LODGED_AT_E0 },
  document_b: { lostWhen: { T_CLAIM1_BLANK: true }, lostNote: LODGED_AT_E0 },
  document_d: { lostWhen: { T_CLAIM1_BLANK: true }, lostNote: LODGED_AT_E0 },
  invitation: { lostWhen: { T_DINED: true },
    lostNote: 'Left on the Colonel\'s table (doc 23; doc 120; errata 248): it leaves the inventory when the dinner is over, with T_DINED.' },
  padded_log: { lostWhen: { T_LOG_WITH_WINNIE: true },
    lostNote: 'Given to Winnie at C5 (doc 23; errata 247): the pair that shows it to her writes T_LOG_WITH_WINNIE, and she is still counting. Errata 66 A kept it "unless a later authored source consumes it"; this is that source.' },
};
const PACKED_AT_ACT_FOUR = 'Packed (doc 121 N-5; errata 250): Act IV opens with his case packed on the bed (doc 57: "there was less to pack than there '
  + 'was to leave"), and a paper that is done with is in it. It leaves the inventory when ACT reaches 4.';
for (const id of ['executor_form', 'photograph', 'third_copy']) GIVEN_AWAY[id] = { lostWhen: { ACT: { atLeast: 4 } }, lostNote: PACKED_AT_ACT_FOUR };
const FILED_NOTE = 'Laid on the counter at the filing (doc 57 F5) and on file after it: it leaves the inventory '
  + 'with T_FILED (Tyler agreed, 2026-11-06; errata 133).';

/**
 * The lines of a response cell, in order, with their speakers: an italic
 * quote `*"..."*` is THAD's (doc 04's convention inside another man's reply),
 * a plain quote is the node's own speaker. Emphasis inside a line is dropped
 * (the face has no italic). Italic directions are returned as staging.
 */
function spokenIn(cell, speaker) {
  const lines = [];
  for (const m of cell.matchAll(/\*"([^"]+)"\*|"([^"]+)"/g)) {
    lines.push({ speaker: m[1] !== undefined ? 'thad' : speaker, line: (m[1] ?? m[2]).replace(/\*/g, '') });
  }
  const staging = [...cell.matchAll(/\*\(([^)]+)\)\*/g)].map((m) => m[1]);
  return { lines, staging };
}

/**
 * DOC 04, REGISTRAR CADWALLADER SUMP: Room 7's tree (errata 80).
 *
 * Doc 04 writes Sump's nodes as bold `SUM_XX` lines rather than headings,
 * numbers a rephrase chain's options 1, 1-prime, 1-double-prime and
 * 1-triple-prime (ids sump1, sump1a, sump1b, sump1c), and puts an option's
 * state either in a fifth State column or inside the response after the
 * reply. Read the same way from either: `sets` a backticked flag writes it,
 * `req` a backticked flag gates on it, `req THE SURVEY` gates on carrying it
 * (DialogueOption.holds), `req E1` follows option 1, and a bold puzzle id is
 * the puzzle the option completes.
 *
 * WHAT IS NOT EXTRACTED YET, AND WHY (doc 36 Q150): SUM_B1's option
 * 1-triple-prime needs Documents B and D in hand, and both come from rooms not
 * built (C6, D6); SUM_C1 opens on the death certificate (E4); SUM_F1 is Act
 * IV's filing (doc 48 S6), after F4. Each is extracted when the room that
 * makes it playable is built. Nothing is invented: every string is the
 * document's.
 *
 * ENTRIES: SUM_E1 from Act III ("Open from Act III", errata 75 H's ACT 3),
 * SUM_B1 from Act II ("Act II -- the three documents"), else SUM_A1.
 */
/**
 * DOC 04'S UNIVERSAL EXIT LINES, AS A POOL THE GAME ROTATES (errata 167; Tyler, 2026-11-07: "'I've taken enough of
 * your time. I'll take more later.' shouldn't be used multiple times"). Doc 04 calls them a "rotating pool available
 * at every node". Each tree's extractor dealt one line per node and froze it, so the same node said the same goodbye
 * every visit, and the most-dealt line came round again and again. The engine now draws every universal exit's
 * wording from this pool, the next line each time one is taken.
 */
function exitPool() {
  const doc = read('docs/04-dialogue-trees.md');
  const pool = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  if (pool.length < 3) throw new Error('doc 04: the universal exit pool was not found');
  return write('content/dialogue/exit-pool.json', {
    schema: 1,
    note: 'EXTRACTED from docs/04-dialogue-trees.md (## Universal exit lines) by tools/extract-content.mjs. Do not edit: change doc 04 and re-run. Every option marked `universal` shows the next of these in turn (EXIT_TURN), so no goodbye comes round until the others have.',
    pool,
  });
}

function sumpTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('## REGISTRAR CADWALLADER SUMP');
  const to = doc.indexOf('## DEKE VESSEL', from);
  if (from < 0 || to < 0) throw new Error('doc 04: cannot find the SUMP section');
  const body = doc.slice(from, to);
  const SPEAKER = 'sump';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');
  const DEFER = {};
  const DEFER_OPTION = {};
  // SUM_C1 from E4 (the signing writes T_DEATH_CERTIFIED) until the decease is
  // recorded (doc 57 E5), then Act III's root again.
  // SUM_F1 once the four documents are down (doc 57 F5: "SUM_F1 (doc 04), once
  // all four are down"), until the filing is made.
  const ENTRIES = [
    { when: { F5_LAID: { atLeast: 4 }, T_FILED: false }, node: 'SUM_F1' },
    { when: { T_DEATH_CERTIFIED: true, T_DECEASED: false }, node: 'SUM_C1' },
    { when: { ACT: { atLeast: 3 } }, node: 'SUM_E1' },
    { when: { ACT: { atLeast: 2 } }, node: 'SUM_B1' },
  ];
  // WHAT DOC 57 WRITES THAT DOC 04'S ROWS DO NOT. E0: "SUM_B1 option 1''',
  // holding THE AFFIDAVIT, THE ASSAY OF RECORD and THE ATTESTATION -> THE
  // CERTIFICATE (the three are kept, stamped SEEN), and the viewing ... ->
  // T_CLAIM1_BLANK, E0." E5: "SUM_C1 option 1, presenting the certificate,
  // records the decease -> T_DECEASED."
  const DOC57 = read('docs/57-puzzle-completion.md');
  const viewingAt = DOC57.indexOf('## E0 · The Certificate of Contiguity');
  const viewing = [];
  for (const m of DOC57.slice(viewingAt, DOC57.indexOf('\n## ', viewingAt + 5)).matchAll(/^> \*\*(SUMP|THAD):\*\* (.+)$/gm)) {
    const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
    for (const span of m[2].matchAll(/\*\(([^)]+)\)\*|"([^"]+)"/g)) {
      if (span[1] !== undefined) {
        const shown = performedDirection(span[1]);
        if (shown) viewing.push({ speaker, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
      } else viewing.push({ speaker, line: span[2] });
    }
  }
  if (viewing.length < 4) throw new Error('doc 57 E0: the viewing was not found');
  // THE FILING (doc 57 F5): after the name, WIN_F2 as doc 04 writes it, then
  // beat 4's read-back; T_FILED and F5, and the room hands on to the dawn.
  const scene = (text, names) => {
    const out = [];
    for (const m of text.matchAll(/^> \*\*([A-Z]+):\*\* (.+)$/gm)) {
      const speaker = names[m[1]];
      if (!speaker) throw new Error(`the filing: unknown speaker ${m[1]}`);
      for (const span of m[2].matchAll(/\*\(([^)]+)\)\*|"([^"]+)"/g)) {
        if (span[1] !== undefined) {
          const shown = performedDirection(span[1]);
          if (shown) out.push({ speaker, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
        } else out.push({ speaker, line: span[2] });
      }
    }
    return out;
  };
  const wf2At = doc.indexOf('**`WIN_F2` — the certification');
  const winF2 = scene(doc.slice(wf2At, doc.indexOf('\n---', wf2At)), { WINNIE: 'winnie', THAD: 'thad' });
  const f5At = DOC57.indexOf('**Beat 4 — the read-back:**');
  const readBack = scene(DOC57.slice(f5At, DOC57.indexOf('\n## ', f5At)), { SUMP: SPEAKER, THAD: 'thad' });
  if (winF2.length < 5 || readBack.length < 6) throw new Error('doc 04 WIN_F2 / doc 57 F5 beat 4: the filing does not read');
  const STATE = {
    'SUM_B1:1‴': { holds: ['document_a', 'document_b', 'document_d'], gives: ['document_c'],
      set: { T_CLAIM1_BLANK: true }, puzzle: { E0: 'complete' }, then: viewing },
    'SUM_C1:1': { holds: ['death_certificate'], set: { T_DECEASED: true } },
    // The filing ends the conversation: doc 48 S6 beat 5, "T_FILED. Main Street dawn opens".
    // BEAT 3, THE COUNTY SEAL (doc 48 S6): "One stamp. It is the loudest sound in
    // the game and the score rests under it." A beat with the seal, between WIN_F2 and the
    // read-back (errata 99 P): the cue S6-SEAL, which ducks the score under it (errata 106).
    'SUM_F1:1': { set: { T_FILED: true }, puzzle: { F5: 'complete' }, ends: true,
      then: [...winF2, { speaker: SPEAKER, line: '…', cue: 'S6-SEAL' }, ...readBack] },
    // Doc 04 gives this reply to Winnie by name: "**WINNIE:** "Don't you dare."".
    'SUM_F1:3': { speakerAll: 'winnie' },
    // Doc 111, B · At the Registrar's: "a new row, at the Registrar's, after `T_MOTT_SPOKE`" (errata 237).
    'SUM_E1:1‴': { when: { T_MOTT_SPOKE: true } },
  };
  const ITEM = { 'THE SURVEY': 'survey' };
  const PRIME = { '': '', '′': 'a', '″': 'b', '‴': 'c' };
  const unplayed = [];
  const nodes = {};
  let poolIndex = 0;
  const parts = body.split(/^\*\*`(SUM_[A-Z0-9]+)`/m);
  for (let at = 1; at < parts.length; at += 2) {
    const id = parts[at];
    // SUM_E1's new row is doc 111's (the séance's front page; errata 237), read with doc 04's.
    const text = id === 'SUM_E1' ? `${parts[at + 1]}\n${seanceSumpRows()}\n` : parts[at + 1];
    if (DEFER[id]) { unplayed.push(`${id} not extracted yet: ${DEFER[id]}`); continue; }
    const ROW = /^\| (\d+)(′|″|‴)? \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|(?:[ \t]*(.*?)[ \t]*\|)?[ \t]*$/gm;
    const rows = [...text.matchAll(ROW)];
    if (!rows.length) throw new Error(`doc 04: ${id} has no option rows`);
    const opening = [...text.matchAll(/^> \*\*(SUMP|THAD):\*\* (.+)$/gm)].map((m) => {
      const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
      for (const d of m[2].matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} opening (${speaker}) staging: ${d[1]}`);
      const line = quoted(m[2]).join(' ').replace(/\*/g, '');
      if (!line) throw new Error(`doc 04: ${id} opening line by ${speaker} has no quoted speech`);
      return { speaker, line };
    });
    const lastSump = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    const options = [];
    let hasExit = false;
    for (const [, number, prime, optionCell, tagCell, responseCell, stateCell] of rows) {
      const label = `${number}${prime ?? ''}`;
      if (DEFER_OPTION[`${id}:${label}`]) { unplayed.push(`${id} option ${label} not extracted yet: ${DEFER_OPTION[`${id}:${label}`]}`); continue; }
      const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
      if (!tagged) throw new Error(`doc 04: ${id} option ${label} has no tag`);
      const option = { id: `${SPEAKER}${number}${PRIME[prime ?? '']}`, tag: tagged[1] };
      const optionText = quoted(optionCell)[0];
      if (tagged[1] === 'EXIT') {
        hasExit = true;
        option.text = optionText ?? POOL[poolIndex % POOL.length];
        if (!optionText) { option.universal = true; poolIndex += 1; }
        option.ends = true;
      } else {
        if (!optionText) throw new Error(`doc 04: ${id} option ${label} has no option text`);
        option.text = optionText;
      }
      if (tagged[2]) option.afterUse = tagged[2];
      // The reply, split on *(second)* for a counted repeat; anything after an arrow is state.
      const ORDINALS = { second: 2, third: 3 };
      const [replyCell] = responseCell.split('→');
      const pieces = replyCell.split(/\*\((second|third)\)\*/);
      const first = spokenIn(pieces[0], SPEAKER);
      const stateText = `${stateCell ?? ''} ${responseCell}`;
      for (const d of first.staging) if (!/sets `|\*\*[A-F]\d+\*\*/.test(d)) unplayed.push(`${id} option ${label} staging: ${d}`);
      if (first.lines.length === 1 && first.lines[0].speaker === SPEAKER) option.say = first.lines[0].line;
      else if (first.lines.length) option.exchange = first.lines;
      else throw new Error(`doc 04: ${id} option ${label} has no reply`);
      for (let k = 1; k < pieces.length; k += 2) {
        const later = spokenIn(pieces[k + 1] ?? '', SPEAKER);
        for (const d of later.staging) unplayed.push(`${id} option ${label} selection ${ORDINALS[pieces[k]]} staging: ${d}`);
        if (later.lines.length) (option.repeats ??= []).push({ selection: ORDINALS[pieces[k]], say: later.lines.map((l) => l.line).join(' ') });
      }
      const sets = [...stateText.matchAll(/sets ((?:`[A-Z_0-9]+`(?:, )?)+)/g)]
        .flatMap((m) => [...m[1].matchAll(/`([A-Z_0-9]+)`/g)].map((f) => f[1]));
      if (sets.length) option.set = Object.fromEntries(sets.map((f) => [f, true]));
      const reqFlag = /req `([A-Z_0-9]+)`/.exec(stateText);
      if (reqFlag) option.when = { [reqFlag[1]]: true };
      const unlessGate = /unless `([A-Z_0-9]+)`/.exec(stateText);
      if (unlessGate) option.when = { ...option.when, [unlessGate[1]]: false };
      const reqItem = /req (THE [A-Z ]+?)(?:;|$|\s\*)/.exec(stateText);
      if (reqItem) {
        const item = ITEM[reqItem[1].trim()];
        if (!item) throw new Error(`doc 04: ${id} option ${label} requires "${reqItem[1]}", which has no item id`);
        option.holds = [item];
      }
      const reqPuzzle = /req ([A-F])(\d+)\b/.exec(stateText);
      if (reqPuzzle) option.after = [`${SPEAKER}${reqPuzzle[2]}`];
      const completes = /\*\*([A-F]\d+)\*\*/.exec(stateText);
      if (completes) option.puzzle = { [completes[1]]: 'complete' };
      const more = STATE[`${id}:${label}`];
      if (more?.speakerAll) {
        option.exchange = (option.exchange ?? [{ speaker: SPEAKER, line: option.say }]).map((l) => ({ ...l, speaker: more.speakerAll }));
        delete option.say;
        // Her second answer is hers too (errata 174): "**WINNIE:** "I said don't."".
        if (option.repeats) option.repeats = option.repeats.map(({ selection, say }) => ({ selection, exchange: [{ speaker: more.speakerAll, line: say }] }));
      } else if (more) {
        const { then, ...rest } = more;
        Object.assign(option, rest);
        if (then) {
          option.exchange = [...(option.exchange ?? (option.say ? [{ speaker: SPEAKER, line: option.say }] : [])), ...then];
          delete option.say;
        }
      }
      options.push(option);
    }
    if (!hasExit) {
      options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[poolIndex % POOL.length], universal: true, ends: true });
      poolIndex += 1;
    }
    nodes[id] = { id, ...(lastSump ? { prompt: lastSump.line } : { noPrompt: true,
      exceptionReason: 'Doc 04 writes this node as a table only -- no opening exchange -- so '
        + 'the conversation opens on the choices.' }),
      ...(opening.length ? { opening } : {}), options };
  }
  // THE DOCUMENTS ARE EXPLAINED ONCE (errata 224). SUM_B1's opening is Thad's request and Sump's A-B-D answer,
  // "circular… linear" and all; it played on every Act II visit, so the joke was told whole twice on the
  // walkthrough. It is said the first time; later visits open on the choices.
  if (nodes.SUM_B1?.opening?.length) nodes.SUM_B1.openingOnce = 'T_SUMP_DOCUMENTS_HEARD';
  // SECTION NINETEEN FOLLOWS WHICHEVER WAY E1 WAS BROUGHT (doc 111: "Section nineteen (E2) follows in the same visit, as
  // now"): doc 04's "req E1" is the petition (option 1) or the séance's front page (row 1‴), whichever came first.
  {
    const e1 = nodes.SUM_E1?.options ?? [];
    const front = e1.findIndex((option) => option.id === `${SPEAKER}1c`);
    const section = e1.find((option) => option.id === `${SPEAKER}2`);
    if (front < 0 || !section || JSON.stringify(section.after) !== JSON.stringify([`${SPEAKER}1`])) {
      throw new Error('doc 04/111 SUM_E1: the front page (1‴) or section nineteen\'s "req E1" (2) does not read');
    }
    section.afterAny = [`${SPEAKER}1`, `${SPEAKER}1c`];
    delete section.after;
    // Offered beside the petition, not after section nineteen.
    const [row] = e1.splice(front, 1);
    e1.splice(e1.findIndex((option) => option.id === `${SPEAKER}1`) + 1, 0, row);
  }
  if (!nodes.SUM_A1) throw new Error('doc 04: SUM_A1 was not extracted');
  const entries = ENTRIES.filter((one) => nodes[one.node]);
  for (const note of unplayed) process.stderr.write(`  doc 04 SUMP: ${note}\n`);
  return write('content/dialogue/sump.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'SUMP',
    speaker: SPEAKER,
    name: 'REGISTRAR SUMP',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (REGISTRAR CADWALLADER SUMP) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a reply are Sump\'s, italic quotes Thad\'s. '
      + 'SUM_F1 waits for F4 (see the extractor); SUM_B1\'s Document C option carries doc 57 E0\'s viewing '
      + '(see the extractor). Universal exit lines are doc 04 part one\'s pool.',
    entries,
    start: 'SUM_A1',
    nodes,
  });
}

/**
 * DOC 04, IGNATIUS FRAME: Room 9's tree (errata 82). Read the way Sump's is
 * (spokenIn, quoted, afterIds), with doc 04's Frame layout: nodes are
 * `## Root: \`FRA_A1\`` and `## \`FRA_B1\`` headings; option 4's later
 * answers are a block after the table ("Option 4 responses rotate and never
 * resolve"); FRA_B1's destination line sits in the State column after
 * `then:`. Every string is the document's.
 *
 * ROUTING THE PROSE NAMES IN WORDS, authored here as A8_CASES is: FRA_A1 1
 * "opens B1 trade" goes to FRA_B1; 6 "begins the funeral day -- C3" is
 * T_FUNERAL_DAY and C3 (doc 57 C3 step 4); 7's "pair 16" is ASSAY_PAIR_16
 * (errata 75 J: the character tells the story of the pair); FRA_B1 1 and 2
 * are B1 (doc 57 B1: "either story pays"); FRA_E1 1 gives THE OBITUARY, sets
 * T_OBITUARY and is E5 (doc 57 E5). FRA_E1 opens on the next TALK TO after
 * T_DECEASED (doc 57 E5).
 */
function frameTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# IGNATIUS FRAME');
  const to = doc.indexOf('## The misspelling gag', from);
  if (from < 0 || to < 0) throw new Error('doc 04: cannot find the IGNATIUS FRAME section');
  const body = doc.slice(from, to);
  const SPEAKER = 'frame';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');
  const ROUTE = {
    'FRA_A1:1': { goto: 'FRA_B1' },
    // Errata 245 (doc 117 O-2): the funeral day begins when Thad posts the notice (a pair on Main Street). Errata 249: Frame
    // sets it and stands back; the notice, and C3, are the press's, pulled by Thad (reference/room-09 docBullets).
    'FRA_A1:6': { set: { T_NOTICE_SET: true } },
    'FRA_A1:7': { set: { ASSAY_PAIR_16: true } },
    'FRA_B1:1': { puzzle: { B1: 'complete' } },
    'FRA_B1:2': { puzzle: { B1: 'complete' }, sameAs: 1 },
    'FRA_E1:1': { gives: ['obituary'], set: { T_OBITUARY: true }, puzzle: { E5: 'complete' } },
  };
  const ENTRY = { FRA_E1: { T_DECEASED: true } };
  const unplayed = [];
  const nodes = {};
  let poolIndex = 0;
  const parts = body.split(/^## (?:Root: )?`(FRA_[A-Z0-9]+)`.*$/m);
  for (let at = 1; at < parts.length; at += 2) {
    const id = parts[at];
    const text = parts[at + 1];
    const ROW = /^\| (\d+) \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|(?:[ \t]*(.*?)[ \t]*\|)?[ \t]*$/gm;
    const rows = [...text.matchAll(ROW)];
    if (!rows.length) throw new Error(`doc 04: ${id} has no option rows`);
    const opening = [...text.matchAll(/^> \*\*(FRAME|THAD):\*\* (.+)$/gm)].map((m) => {
      const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
      for (const d of m[2].matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} opening (${speaker}) staging: ${d[1]}`);
      const line = quoted(m[2]).join(' ').replace(/\*/g, '');
      if (!line) throw new Error(`doc 04: ${id} opening line by ${speaker} has no quoted speech`);
      return { speaker, line };
    });
    const lastFrame = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    const options = [];
    let hasExit = false;
    for (const [, number, optionCell, tagCell, responseCell, stateCell] of rows) {
      const route = ROUTE[`${id}:${number}`] ?? {};
      const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
      if (!tagged) throw new Error(`doc 04: ${id} option ${number} has no tag`);
      const option = { id: `${SPEAKER}${number}`, tag: tagged[1] };
      const optionText = quoted(optionCell)[0];
      if (tagged[1] === 'EXIT') {
        hasExit = true;
        option.text = optionText ?? POOL[poolIndex % POOL.length];
        if (!optionText) { option.universal = true; poolIndex += 1; }
        option.ends = true;
      } else {
        if (!optionText) throw new Error(`doc 04: ${id} option ${number} has no option text`);
        option.text = optionText;
      }
      if (tagged[2]) option.afterUse = tagged[2];
      const follows = afterIds(tagCell, SPEAKER);
      if (follows) option.after = follows;
      const ORDINALS = { second: 2, third: 3 };
      const [replyCell] = responseCell.split('→');
      const pieces = replyCell.split(/\*\((second|third)\)\*/);
      const first = spokenIn(pieces[0], SPEAKER);
      for (const d of first.staging) unplayed.push(`${id} option ${number} staging: ${d}`);
      // FRA_B1's destination: `then: "..."` in the State column is Frame's next line.
      const thenLine = /then: "([^"]+)"/.exec(stateCell ?? '')?.[1];
      let lines = first.lines;
      if (thenLine) lines = [...lines, { speaker: SPEAKER, line: thenLine }];
      if (route.sameAs) {
        const like = options.find((o) => o.id === `${SPEAKER}${route.sameAs}`);
        const tail = like?.exchange?.at(-1);
        if (!tail) throw new Error(`doc 04: ${id} option ${number} says "the same destination line" and option ${route.sameAs} has none`);
        lines = [...lines, tail];
        // "the same grant": what option N writes, this writes too.
        if (like.set) route.set = { ...like.set, ...(route.set ?? {}) };
      }
      if (lines.length === 1 && lines[0].speaker === SPEAKER) option.say = lines[0].line;
      else if (lines.length) option.exchange = lines;
      else if (first.staging.length) option.beat = first.staging.join(' ');
      else throw new Error(`doc 04: ${id} option ${number} has no reply`);
      for (let k = 1; k < pieces.length; k += 2) {
        const later = spokenIn(pieces[k + 1] ?? '', SPEAKER);
        for (const d of later.staging) unplayed.push(`${id} option ${number} selection ${ORDINALS[pieces[k]]} staging: ${d}`);
        if (later.lines.length) (option.repeats ??= []).push({ selection: ORDINALS[pieces[k]], say: later.lines.map((l) => l.line).join(' ') });
      }
      const state = `${stateCell ?? ''} ${responseCell.split('→').slice(1).join(' ')}`;
      const sets = [...state.matchAll(/sets `([A-Z_0-9]+)`/g)].map((m) => m[1]);
      const counter = /`([A-Z_0-9]+)` \+1/.exec(state);
      const req = /req `([A-Z_0-9]+)`/.exec(state);
      const flags = [...state.matchAll(/→ `([A-Z_0-9]+)`/g)].map((m) => m[1]);
      const set = { ...Object.fromEntries([...sets, ...flags].map((f) => [f, true])), ...(route.set ?? {}) };
      if (Object.keys(set).length) option.set = set;
      if (counter) option.add = { [counter[1]]: 1 };
      if (req) option.when = { [req[1]]: true };
      const unlessFlag = /unless `([A-Z_0-9]+)`/.exec(state);
      if (unlessFlag) option.when = { ...option.when, [unlessFlag[1]]: false };
      if (route.goto) option.goto = route.goto;
      if (route.gives) option.gives = route.gives;
      if (route.puzzle) option.puzzle = route.puzzle;
      options.push(option);
    }
    // "Option N responses rotate and never resolve:" -- its later answers, in order.
    const rotate = /\*\*Option (\d+) responses rotate[^*]*\*\*\s*\n((?:> .+\n?)+)/.exec(text);
    if (rotate) {
      const option = options.find((o) => o.id === `${SPEAKER}${rotate[1]}`);
      if (!option) throw new Error(`doc 04: ${id}'s rotating answers name option ${rotate[1]}, which it lacks`);
      const said = [...rotate[2].matchAll(/^> "([^"]+)"/gm)].map((m) => m[1]);
      for (const d of rotate[2].matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} option ${rotate[1]} rotation staging: ${d[1]}`);
      option.repeats = said.map((say, k) => ({ selection: k + 2, say }));
      unplayed.push(`${id} option ${rotate[1]}: "rotate and never resolve" -- the runner plays the three in order and then holds the last`);
    }
    if (!hasExit) {
      options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[poolIndex % POOL.length], universal: true, ends: true });
      poolIndex += 1;
    }
    nodes[id] = { id, ...(lastFrame ? { prompt: lastFrame.line } : { noPrompt: true,
      exceptionReason: 'Doc 04 writes this node as a table only.' }),
      ...(opening.length ? { opening } : {}), options };
  }
  if (!nodes.FRA_A1) throw new Error('doc 04: FRA_A1 was not extracted');
  // HE KNOWS HIM THE SECOND TIME (errata 225). FRA_A1's "You're new!" played on every visit through three acts. The
  // first visit is the exchange; every visit after says doc 04's return line instead.
  {
    const a1 = doc.slice(doc.indexOf('## Root: `FRA_A1`'));
    const again = /^> \*\*FRAME\*\* \*\(every visit after the first[^\n]*?\)\*: "(.+)"$/m.exec(a1.slice(0, a1.indexOf('| # |')));
    if (!again) throw new Error('doc 04: FRA_A1 has no return-visit line');
    Object.assign(nodes.FRA_A1, { openingOnce: 'T_FRAME_MET', returnOpening: [{ speaker: SPEAKER, line: again[1] }] });
  }
  // DOC 109, B1 · THE CLARION: after FRA_B1's destination line, whichever story, Frame presses this week's paper on him.
  {
    const clarion = consolationScene('### B1 · THE CLARION', { FRAME: SPEAKER });
    if (!clarion.gives.some((one) => /THE CLARION/.test(one))) throw new Error('doc 109 B1: the scene no longer gives THE CLARION');
    const b1 = (nodes.FRA_B1?.options ?? []).filter((option) => option.puzzle?.B1 === 'complete');
    if (b1.length !== 2) throw new Error(`doc 04: FRA_B1 has ${b1.length} options completing B1, not 2`);
    for (const option of b1) {
      option.exchange = [...(option.exchange ?? [{ speaker: SPEAKER, line: option.say }]), ...clarion.lines];
      delete option.say;
      option.gives = [...(option.gives ?? []), 'clarion'];
    }
  }
  // THE NOTICE, SET (errata 245, 249; doc 118 O-2): after doc 04's reply he locks the type and stands back. Offered while
  // nothing is set and Thad is not already holding one, so the day can be held again as before.
  {
    const notice = nodes.FRA_A1?.options.find((option) => option.set?.T_NOTICE_SET);
    if (!notice) throw new Error('doc 04 FRA_A1: no option sets the funeral notice');
    notice.thenAfter = objectsBlock('**`FRA_A1` option, "I need a funeral notice printed."**', { FRAME: SPEAKER });
    notice.when = { ...notice.when, T_NOTICE_IN_HAND: false, T_NOTICE_SET: false };
  }
  const entries = Object.entries(ENTRY).filter(([node]) => nodes[node]).map(([node, when]) => ({ when, node }));
  for (const note of unplayed) process.stderr.write(`  doc 04 FRAME: ${note}\n`);
  return write('content/dialogue/frame.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'FRAME',
    speaker: SPEAKER,
    name: 'IGNATIUS FRAME',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (IGNATIUS FRAME) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a reply are Frame\'s, italic quotes Thad\'s. '
      + 'Universal exit lines are doc 04 part one\'s pool.',
    entries,
    start: 'FRA_A1',
    nodes,
  });
}

/**
 * DOC 04, WINNIE LEDGER: the first principal's tree, extracted for Room 5.
 *
 * Doc 04's shape differs from doc 27's in four ways this parser reads rather
 * than normalises: nodes are `## ACT N — ... \`WIN_XX\`` headings with the id
 * in backticks; a node opens on an EXCHANGE of `> **WINNIE:**` / `> **THAD:**`
 * lines, not one root line; the tag cell carries errata 57's aftermath
 * (`[PROGRESS · remove]`); and the State cell names what an option opens,
 * sets or requires in prose with the id in backticks.
 *
 * WHAT IS CARRIED AND WHAT IS NOT, said here because both are decisions:
 *
 *   - The opening exchange is carried whole as `opening`, and the node's
 *     `prompt` is the LAST Winnie line of it, which is the line the choices
 *     are answers to. The renderer draws a prompt as one line; the machinery
 *     to perform an opening exchange does not exist yet, and the words are
 *     kept in the data rather than dropped -- doc 27's Vessel beat sets the
 *     precedent.
 *   - `repeat` carries the second selection's line. A third-selection line
 *     (errata 45's counted-repeat) has no field yet; it stays in the document
 *     and is reported below as unplayed.
 *   - A node with no `[EXIT]` row gets one from doc 04's UNIVERSAL EXIT POOL,
 *     rotating by node, because the document says the pool is "available at
 *     every node" and the runner has no other way out. The doorframe direction
 *     on the third line is not performed.
 *   - `WIN_B3` (one option) and `WIN_C1` (no [COMIC]) do not satisfy doc 04's
 *     own node rules 1 and 2 as written and are NOT extracted; both are Acts
 *     II-III. Reported by name.
 *   - `entries` gate the act roots on the flags doc 04 names. `WIN_B2` names no
 *     flag ("after the padded log") and opens on nothing -- reported.
 *
 * Nothing is invented: every string below is the document's.
 */
function winnieTree() {
  const sparringNodes = [];
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# WINNIE LEDGER');
  const to = doc.indexOf('# COLONEL ABSALOM FANSHAWE');
  if (from < 0 || to < 0) throw new Error('doc 04: cannot find the WINNIE LEDGER section');
  const body = doc.slice(from, to);
  const SPEAKER = 'winnie';
  const POOL = [...body.length ? doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm) : []]
    .map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');

  // WIN_B3 IS BUILT (errata 181): one [COMIC] row and the exit pool, rules 1 and 2 waived by errata 66 E,
  // reached from WIN_B2 option 3 ("opens `WIN_B3`"), not from an entry -- so WIN_B2's other rows stay reachable.
  const SKIP = {};
  const ONE_ROW = { WIN_B3: 'Errata 66 E: "a scene with one row, as written"; doc 04 rules 1 and 2 do not bar it.' };
  // WIN_C1, E4 (doc 57: "WIN_C1 opens once T_FUNERAL_BOOKED is set and C5 is
  // complete. Option 4 and the signing -> THE DEATH CERTIFICATE -> E4"). Doc 04
  // calls it "The relationship scene" and writes no [COMIC]: declared, as the
  // letters' node is (check-dialogue-nodes reads `noComic`). The scene after
  // "Then:" is option 4's exchange; the signing hands over the certificate.
  const NO_COMIC = { WIN_C1: 'Doc 04 Act III: "The relationship scene. Six exchanges, and the correct path is not persuasion." Its four rows are the persuasion and the dropping of it; none is a joke option.' };
  const SIGNING = { 'WIN_C1:4': { gives: ['death_certificate'], puzzle: { E4: 'complete' }, set: { T_DEATH_CERTIFIED: true } } };
  // WIN_B4, doc 04: "Opened by the first TALK TO after WIN_B2 option 1 has left
  // C6 pending and Thad has been out of the office and back." The asking writes
  // T_ASSAY_ASKED (below); Room 5's onEnter writes T_ASSAY_BACK on the way back
  // in while that holds (the compiler, doc 57 C6). Before the C5 entry, which
  // stays complete.
  // WIN_C1 on T_FUNERAL_BOOKED alone: C5 is long complete by then (the funeral
  // is booked after the Act II turn, which needs Document B, which needs C5).
  const ENTRY = { WIN_F1: { T_STRIKE_FOUND: true }, WIN_C1: { T_FUNERAL_BOOKED: true }, WIN_B4: { T_ASSAY_BACK: true }, WIN_B1: { T_BORDERS_MOTT: true } };
  // "The opening completes C6 and issues Document B" -- once.
  const ON_OPEN = { WIN_B4: { once: 'T_ASSAY_RETURNED', onOpen: { puzzle: { C6: 'complete' }, gives: ['document_b'] } } };
  const ASKED = { 'WIN_B2:1': { T_ASSAY_ASKED: true } };
  // A PUZZLE-GATED ENTRY: doc 04 heads WIN_B2 "after the padded log (C5)".
  // Errata 66 B-C: C5's completion is puzzle progress, and the action that
  // completes it opens this node and performs its opening; TALK TO afterwards
  // opens the list. Ordered after F1 (Act IV) and before B1 (Act II's root).
  const PUZZLE_ENTRY = { WIN_B2: 'C5' };
  // A ROW THAT MOVES A PUZZLE: doc 04's State cell "grants assay → C6" on
  // WIN_B2's first row; doc 53 reads it as C6 pending (the assay is granted,
  // its return is off screen and later -- errata 66 F).
  // C1 AND C2 ARE THE TOPICS ARRIVING. Doc 57: "C1 · WIN_B1 option 1 ->
  // T_ASSAY_QUEUE. Complete as written." and "C2 · WIN_B1 option 2 ... and
  // option 6 ... -> T_OFFICE_TOPIC, C2" -- option 6 is the row that writes it.
  const PUZZLE_WRITE = { 'WIN_B2:1': { C6: 'complete' }, 'WIN_B1:1': { C1: 'complete' }, 'WIN_B1:6': { C2: 'complete' } };
  // THE ASSAY, ON THE SPOT (errata 232). WIN_B2 option 1 used to leave C6 pending until Thad had left the office and
  // come back -- a step that existed only to make him leave. She runs it at the window: the row goes to WIN_B4,
  // whose opening is said after the reply (errata 181), hands over Document B and writes what the old return did.
  // The row stays in WIN_B2, and WIN_B2 stays her node until he leaves the office, as before, so its other
  // questions are still there to ask; after that WIN_B4 opens on its options, its opening already said
  // (assayAtOnce, after the directions are performed).
  const AT_ONCE = { 'WIN_B2:1': { gives: ['document_b'], set: { T_ASSAY_RETURNED: true } } };
  const unplayed = [];
  const nodes = {};
  let poolIndex = 0;

  // Node blocks: from a heading carrying a `WIN_XX` id to the next heading.
  const blocks = body.split(/^## /m).slice(1);
  const found = [];
  for (const block of blocks) {
    const idMatch = /`(WIN_[A-Z0-9]+)`/.exec(block.split('\n')[0]);
    if (idMatch) found.push({ id: idMatch[1], text: block });
    // Act IV's nodes sit under one heading as bold `WIN_F1` / `WIN_F2` lines.
    for (const grown of block.split(/^\*\*`(WIN_F\d)`/m).slice(1).reduce((acc, part, index, all) => {
      if (index % 2 === 0) acc.push({ id: part, text: all[index + 1] ?? '' });
      return acc;
    }, [])) found.push(grown);
  }

  for (const { id, text: whole } of found) {
    if (SKIP[id]) { unplayed.push(`${id} not extracted: ${SKIP[id]}`); continue; }
    // A SCENE AFTER THE ROWS: doc 04 WIN_C1 writes "Then:" and the exchange the
    // correct row leads to. It is not the node's opening.
    const [text, thenBlock] = whole.split(/^Then:$/m);
    const then = [];
    for (const m of (thenBlock ?? '').matchAll(/^> \*\*(WINNIE|THAD):\*\* (.+)$/gm)) {
      const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
      for (const span of m[2].matchAll(/\*\(([^)]+)\)\*|"([^"]+)"/g)) {
        if (span[1] !== undefined) {
          const shown = performedDirection(span[1]);
          if (shown) then.push({ speaker, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
        } else then.push({ speaker, line: span[2] });
      }
    }
    // `[ \t]*`, NOT `\s*`: a whitespace class that includes the newline let the
    // optional fifth cell of a four-column row run on into the next row, and
    // Act IV's option 1 came out carrying option 2 as its state.
    const ROW = /^\| (\d+) \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|(?:[ \t]*(.*?)[ \t]*\|)?[ \t]*$/gm;
    const rows = [...text.matchAll(ROW)].filter((r) => !/^#/.test(r[1]));
    if (!rows.length) {
      if (id === 'WIN_F2') { unplayed.push(`${id}: a scripted exchange with no options (doc 48 S6), not a node`); continue; }
      throw new Error(`doc 04: ${id} has no option rows`);
    }
    // THE OPENING IS SPOKEN, SO IT IS SPEECH. Each `> **WINNIE:**` line used to
    // be carried whole -- quote marks, italic directions and all -- because
    // nothing played it: the engine drew the node's last line as a caption
    // over the options and the exchange itself never reached the screen.
    // Tyler's playthrough (2026-09-04) asked for the exchange to play, so it
    // is carried the way an option's reply is: the quoted words, and any
    // italic direction reported as staging rather than spoken.
    const opening = [...text.matchAll(/^> \*\*(WINNIE|THAD):\*\* (.+)$/gm)]
      .map((m) => {
        const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
        for (const d of m[2].matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} opening (${speaker}) staging: ${d[1]}`);
        const line = quoted(m[2]).join(' ');
        if (!line) throw new Error(`doc 04: ${id} opening line by ${speaker} has no quoted speech`);
        return { speaker, line };
      });
    const lastWinnie = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    // A prompt is one drawn line: the quoted speech only, directions dropped
    // (they survive in `opening`).
    const promptText = lastWinnie?.line ?? null;
    const options = [];
    let hasExit = false;
    for (const [, number, optionCell, tagCell, responseCell, stateCell] of rows) {
      const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
      if (!tagged) throw new Error(`doc 04: ${id} option ${number} has no tag`);
      const tag = tagged[1];
      const afterUse = tagged[2] ?? null;
      const option = { id: `${SPEAKER}${number}`, tag };
      const follows = afterIds(tagCell, SPEAKER);
      if (follows) option.after = follows;
      const text = quoted(optionCell)[0];
      if (tag === 'EXIT') {
        hasExit = true;
        option.text = text ?? POOL[poolIndex % POOL.length];
        if (!text) { option.universal = true; poolIndex += 1; }
        option.ends = true;
      } else {
        if (!text) throw new Error(`doc 04: ${id} option ${number} has no option text`);
        option.text = text;
      }
      if (afterUse) option.afterUse = afterUse;
      // The response: directions in italics are kept as `beat`; the quoted
      // line is the reply. A rephrase direction names the replacement text.
      // LATER SELECTIONS, INLINE: doc 04 writes a counted-repeat's second and
      // third answers in the response cell after `*(second)*` / `*(third)*`
      // markers. Split on them: the first part is the first selection's, each
      // later part is that selection's `repeats` entry (errata 45, W1).
      const ORDINALS = { second: 2, third: 3, fourth: 4, fifth: 5 };
      const parts = responseCell.split(/\*\((second|third|fourth|fifth)\)\*/);
      const firstCell = parts[0];
      const laterCells = [];
      for (let at = 1; at < parts.length; at += 2) laterCells.push({ selection: ORDINALS[parts[at]], cell: parts[at + 1] ?? '' });
      const directions = [...firstCell.matchAll(/\*\(([^)]+)\)\*/g)].map((m) => m[1]);
      const rephrase = directions.find((d) => /^rephrases after/.test(d));
      const plainDirections = directions.filter((d) => !/^rephrases after/.test(d));
      const spoken = firstCell.replace(/\*\([^)]*\)\*/g, '');
      const lines = quoted(spoken);
      // EVERY QUOTED LINE IS SAID (errata 120). This kept the first and dropped
      // the rest, which lost WIN_F1's "File it. I'll be at the Registrar's when
      // you do." -- the only line that sends Thad to the last filing (F5).
      if (lines.length > 1) option.exchange = lines.map((line) => ({ speaker: SPEAKER, line }));
      else if (lines[0]) option.say = lines[0];
      for (const later of laterCells) {
        for (const d of later.cell.matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} option ${number} selection ${later.selection} staging: ${d[1]}`);
        const line = quoted(later.cell.replace(/\*\([^)]*\)\*/g, ''))[0];
        if (line) (option.repeats ??= []).push({ selection: later.selection, say: line });
      }
      // A DIRECTION BESIDE A LINE IS STAGING, NOT A BEAT. The schema allows an
      // option one or the other: a `beat` is what plays when there is no line
      // (doc 27's Vessel swindle). "(long pause) 'Congratulations.'" has a
      // line, so the pause is reported as staging exactly as doc 27's are,
      // and the words are what the option says.
      if (plainDirections.length && !lines[0]) option.beat = plainDirections.join(' ');
      else if (plainDirections.length) unplayed.push(`${id} option ${number} staging: ${plainDirections.join(' ')}`);
      if (rephrase) {
        const parts = /^rephrases after (\S+) to "(.+?)" → "(.+?)"$/.exec(rephrase);
        if (parts) option.rephrase = { after: parts[1], text: parts[2], say: parts[3] };
        else unplayed.push(`${id} option ${number}: rephrase direction not read: ${rephrase}`);
      }
      // State: opens / sets / req, by backticked id.
      const state = stateCell ?? '';
      const opens = /opens `(WIN_[A-Z0-9]+)`/.exec(state);
      // A write may sit in the response's own direction instead (doc 04 WIN_F1
      // option 1: "*(sets `T_ASSAY_RUN`; errata 75)*").
      const sets = /sets `([A-Z_0-9]+)`/.exec(state) ?? /\*\(sets `([A-Z_0-9]+)`/.exec(responseCell);
      const req = /req `([A-Z_0-9]+)`/.exec(state);
      // `unless FLAG` (errata 172): offered while the flag is not set -- the Pike question before he knows.
      const unless = /unless `([A-Z_0-9]+)`/.exec(state);
      if (opens) option.goto = opens[1];
      if (sets) option.set = { [sets[1]]: true };
      if (req) option.when = { [req[1]]: true };
      if (unless) option.when = { ...option.when, [unless[1]]: false };
      const puzzleWrite = PUZZLE_WRITE[`${id}:${number}`];
      if (puzzleWrite) option.puzzle = puzzleWrite;
      if (ASKED[`${id}:${number}`]) option.set = { ...option.set, ...ASKED[`${id}:${number}`] };
      const atOnce = AT_ONCE[`${id}:${number}`];
      if (atOnce) Object.assign(option, { gives: atOnce.gives, set: { ...option.set, ...atOnce.set } });
      const signing = SIGNING[`${id}:${number}`];
      if (signing) {
        if (!then.length) throw new Error(`doc 04: ${id} option ${number} leads to a scene with no lines`);
        Object.assign(option, signing);
        option.exchange = [...(option.exchange ?? (option.say ? [{ speaker: SPEAKER, line: option.say }] : [])), ...then];
        delete option.say;
      }
      // THE SPARRING (doc 57 C6): WIN_B4's teaching row, doc 03's exchange and pairs.
      if (tag === 'ASSAY' && /\bpairs? \d/.test(`${responseCell} ${state}`)) {
        option.backTo = id;
        teachingRow(option, `${responseCell} | ${state}`, { teacher: 'Winnie', owner: SPEAKER, sparring: 'Winnie' });
        sparringNodes.push(option.sparringNode);
        delete option.sparringNode;
      } else if (state && !opens && !sets && !req && !unless && !puzzleWrite && state !== '—') {
        unplayed.push(`${id} option ${number} state "${state}" names no flag; nothing set`);
      }
      options.push(option);
    }
    // LATER SELECTIONS, BY LINE. `**Repeat on option N:**` / `**Option N,
    // repeat:**` is the second selection's answer; `**Third selection:**`
    // (unnumbered) continues the option most recently named; `**Option N,
    // fifth selection:**` is the fifth's, an exchange whose quoted lines are
    // hers and whose directions are staging. W1 carries all of them as
    // `repeats`, by selection number; the runner clamps at the last.
    let named = null;
    for (const line of text.split('\n')) {
      const second = /^\*\*(?:Repeat on option|Option) (\d+),? ?(?:repeat)?:\*\* (.+)$/.exec(line);
      const third = /^\*\*Third selection:\*\* (.+)$/.exec(line);
      const fifth = /^\*\*Option (\d+), fifth selection:\*\* (.+)$/.exec(line);
      const hit = second ? { number: second[1], selection: 2, cell: second[2] }
        : third && named ? { number: named, selection: 3, cell: third[1] }
          : fifth ? { number: fifth[1], selection: 5, cell: fifth[2] } : null;
      if (!hit) continue;
      named = hit.number;
      const option = options.find((o) => o.id === `${SPEAKER}${hit.number}`);
      if (!option) { unplayed.push(`${id}: a selection ${hit.selection} line names option ${hit.number}, which the node lacks`); continue; }
      for (const d of hit.cell.matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} option ${hit.number} selection ${hit.selection} staging: ${d[1]}`);
      const spokenLines = quoted(hit.cell.replace(/\*\([^)]*\)\*/g, ''));
      if (!spokenLines.length) continue;
      const entry = spokenLines.length === 1 ? { selection: hit.selection, say: spokenLines[0] }
        : { selection: hit.selection, exchange: spokenLines.map((l) => ({ speaker: SPEAKER, line: l })) };
      option.repeats = [...(option.repeats ?? []).filter((r) => r.selection !== hit.selection), entry]
        .sort((a, b) => a.selection - b.selection);
    }
    if (!hasExit) {
      options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[poolIndex % POOL.length], universal: true, ends: true });
      poolIndex += 1;
    }
    nodes[id] = { id, ...(NO_COMIC[id] ? { noComic: true, noComicReason: NO_COMIC[id] } : {}), ...(ONE_ROW[id] ? { fewOptions: true, fewOptionsReason: ONE_ROW[id] } : {}), ...(promptText ? { prompt: promptText } : { noPrompt: true,
      exceptionReason: 'Doc 04 writes this node as a table only -- no opening exchange -- so '
        + 'the conversation continues from the previous node\'s line rather than opening on one.' }),
      ...(opening.length ? { opening } : {}), options };
  }

  // The practice node its teaching row opens (errata 243), with the pool's way out.
  for (const spar of sparringNodes) {
    nodes[spar.id] = { ...spar, options: [...spar.options, { id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[poolIndex % POOL.length], universal: true, ends: true }] };
    poolIndex += 1;
  }
  if (!nodes.WIN_A1) throw new Error('doc 04: WIN_A1 was not extracted');
  for (const [node, { once, onOpen }] of Object.entries(ON_OPEN)) {
    if (nodes[node]) Object.assign(nodes[node], { openingOnce: once, onOpen });
  }
  const entries = [];
  for (const [node, when] of Object.entries(ENTRY)) {
    if (!nodes[node]) continue;
    entries.push({ when, node });
    // The puzzle-gated entry sits after Act IV's and before Act II's root.
    if (node === 'WIN_B4') for (const [gated, puzzle] of Object.entries(PUZZLE_ENTRY)) if (nodes[gated]) entries.push({ puzzle, node: gated });
  }
  for (const note of unplayed) process.stderr.write(`  doc 04 WINNIE: ${note}\n`);

  return write('content/dialogue/winnie.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'WINNIE',
    speaker: SPEAKER,
    name: 'WINNIE LEDGER',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (WINNIE LEDGER) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a response are Winnie; the '
      + 'opening exchange is carried whole as `opening` and the prompt is its last Winnie line. '
      + 'WIN_B3 is reached from WIN_B2 option 3 (errata 181). Universal exit lines are doc '
      + '04 part one\'s pool.',
    entries,
    start: 'WIN_A1',
    nodes,
  });
}

/**
 * HOB, from doc 04's `# HOB` section: HOB_A1 (Acts I–II), HOB_C1 (after the
 * coffin, E8) and HOB_C2 (the confession, E10).
 *
 * The same typography Winnie's tree is read by -- a `> **HOB:**` / `> **THAD:**`
 * opening, a four-column table whose tag carries its aftermath (`[TOPIC ·
 * retain]`), plain quotes in a response are Hob's, italic brackets are
 * staging -- with two forms of Hob's own:
 *
 * - `*(nothing)*` is the whole reply on three Act I options. Doc 04: "Hob
 *   keeps walking." It is carried as the option's `beat`, the form Tyler
 *   ruled for a reply that is a direction (2026-10-31, option A).
 * - `Thad: "…"` after a dash is THAD'S aside, not Hob's line -- "Thad's aside
 *   supplies the joke". Carried as a one-line exchange spoken by Thad.
 *
 * The state is in the response cell, after the arrow: a backticked flag is
 * set; `pair 21` is the Liar's Assay, reported (doc 03 machinery is not
 * built). Emphasis inside a quoted line is dropped -- the face has no italic
 * -- and reported, never silently.
 *
 * ENTRIES (errata 71 D). HOB_C2 after E9 and HOB_C1 after E8, each a
 * puzzle-gated entry in errata 66 C's sense: the action that completes the
 * puzzle performs the node's opening once -- Room 32's lid (E8), doc 48 S4's
 * shack scene (E10's frame) -- and a TALK TO afterwards opens the list.
 */
function hobTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('\n# HOB\n');
  if (from < 0) throw new Error('doc 04: cannot find the HOB section');
  const rest = doc.slice(from + 1);
  const end = rest.slice(1).search(/^# /m);
  const body = end < 0 ? rest : rest.slice(0, end + 1);
  const SPEAKER = 'hob';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)]
    .map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');
  // HOB_E6 (doc 04): "Open once `T_EXECUTOR_RULE` is set and until E6 is
  // complete" -- E6 writes `T_EXECUTOR_NAMED` (doc 57 E6), which closes it.
  const PUZZLE_ENTRY = [{ puzzle: 'E9', node: 'HOB_C2' }, { puzzle: 'E8', node: 'HOB_C1' },
    { when: { T_EXECUTOR_RULE: true, T_EXECUTOR_NAMED: false }, node: 'HOB_E6' }];
  // A STATE COLUMN (HOB_E6's fifth): "gives THE EXECUTOR'S FORM" names an item
  // by its short name, read from the item files.
  const ITEMS = new Map(readdirSync(resolve(ROOT, 'content/items')).filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(read(`content/items/${f}`))).map((item) => [item.short, item.id]));
  const unplayed = [];
  const nodes = {};
  let poolIndex = 0;
  const said = (text, where) => {
    if (/\*/.test(text)) unplayed.push(`${where}: emphasis dropped from "${text}"`);
    return plain(text);
  };

  for (const block of body.split(/^## /m).slice(1)) {
    const id = /`(HOB_[A-Z0-9]+)`/.exec(block.split('\n')[0])?.[1];
    if (!id) continue;
    const opening = [...block.matchAll(/^> \*\*(HOB|THAD):\*\* (.+)$/gm)].map((m) => {
      const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
      const line = quoted(m[2]).map((q) => said(q, `${id} opening`)).join(' ');
      if (!line) throw new Error(`doc 04: ${id} opening line by ${speaker} has no quoted speech`);
      return { speaker, line };
    });
    const lastHob = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    const ROW = /^\| (\d+) \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*$/gm;
    const options = [];
    for (const [, number, optionCell, tagCell, responseCell] of block.matchAll(ROW)) {
      const where = `${id} option ${number}`;
      const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
      if (!tagged) throw new Error(`doc 04: ${where} has no tag`);
      const text = quoted(optionCell)[0];
      if (!text) throw new Error(`doc 04: ${where} has no option text`);
      const option = { id: `${SPEAKER}${number}`, tag: tagged[1], text: said(text, where) };
      const follows = afterIds(tagCell, SPEAKER);
      if (follows) option.after = follows;
      if (tagged[2]) option.afterUse = tagged[2];
      // HOB_E6's table has a fifth column, State: the response cell ends at
      // its pipe, and what the state gives is read from it.
      const [responseOnly, stateCell = ''] = responseCell.split(/[ \t]*\|[ \t]*/);
      const gives = /^gives (THE [A-Z' ]+)$/.exec(plain(stateCell).trim());
      if (gives) {
        const item = ITEMS.get(gives[1]);
        if (!item) throw new Error(`doc 04: ${where} gives "${gives[1]}", which no item is called`);
        option.gives = [item];
      } else if (stateCell.trim() && stateCell.trim() !== '—') {
        throw new Error(`doc 04: ${where} has a state "${stateCell}" this reader does not know`);
      }
      const [spoken, ...after] = responseOnly.split('→');
      // Thad's aside: everything after `Thad:` is his.
      const [hobPart, thadPart] = spoken.split(/\bThad:/);
      const hobLines = quoted(hobPart.replace(/\*\([^)]*\)\*/g, '')).map((q) => said(q, where));
      const thadLines = thadPart ? quoted(thadPart).map((q) => said(q, where)) : [];
      const directions = [...hobPart.matchAll(/\*\(([^)]+)\)\*/g)].map((m) => m[1]);
      if (thadLines.length && hobLines.length) throw new Error(`doc 04: ${where} has both Hob's line and Thad's aside`);
      if (thadLines.length) {
        option.exchange = thadLines.map((line) => ({ speaker: 'thad', line }));
        unplayed.push(`${where} staging: ${directions.join(' ')} (Hob does not answer; Thad's aside plays)`);
      } else if (hobLines.length === 1) {
        option.say = hobLines[0];
        if (directions.length) unplayed.push(`${where} staging: ${directions.join(' ')}`);
      } else if (hobLines.length > 1) {
        option.exchange = hobLines.map((line) => ({ speaker: SPEAKER, line }));
      } else if (directions.length) {
        option.beat = directions.join(' ');
      } else {
        throw new Error(`doc 04: ${where} has no line and no direction`);
      }
      const state = after.join('→');
      const flag = /`(T_[A-Z_0-9]+)`/.exec(state);
      if (flag) option.set = { [flag[1]]: true };
      // A TEACHING ROW (doc 57: pair 21 is Hob's, HOB_A1 option 6). The flag is
      // written quietly; the row keeps doc 04's tag and nothing marks it.
      const pair = /pair (\d+)/.exec(state);
      if (pair && option.tag === 'ASSAY') teachingRow(option, state, { teacher: 'Hob', owner: SPEAKER });
      else if (pair) unplayed.push(`${where}: Liar's Assay pair ${pair[1]} on a ${option.tag} row; nothing set`);
      if (state.trim() && !flag && !pair) unplayed.push(`${where}: state "${plain(state)}" names no flag; nothing set`);
      options.push(option);
    }
    if (options.length < 3) throw new Error(`doc 04: ${id} has ${options.length} options`);
    if (!options.some((o) => o.tag === 'EXIT')) {
      options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[poolIndex % POOL.length], universal: true, ends: true });
      poolIndex += 1;
    }
    nodes[id] = { id, ...(lastHob ? { prompt: lastHob.line } : { noPrompt: true,
      exceptionReason: 'Doc 04 writes HOB_A1 as a table only -- no opening exchange. Hob is a man walking past; '
        + 'TALK TO offers the list and he does not stop to greet.' }),
      ...(opening.length ? { opening } : {}), options };
  }
  for (const want of ['HOB_A1', 'HOB_C1', 'HOB_C2']) if (!nodes[want]) throw new Error(`doc 04: ${want} was not extracted`);
  // DOC 48 S4 AROUND HOB_C2 (doc 57 E10, errata 94 E). "Entering the shack
  // after E9 plays doc 48 S4 beat 1, then HOB_C2's opening": beat 1's line is
  // the opening's first. And beat 3, "after settle", is the conversation's end:
  // its flags (`T_STRIKE_WAS_LIE` is doc 04's `T_NO_GOLD_EVER`, errata 75 K),
  // Hob's line, and ACT 4, whose rise brings the Part Four card.
  {
    const s4 = read('docs/48-act-turn-beats.md');
    const at = s4.indexOf('## S4 · THE CONFESSION');
    if (at < 0) throw new Error('doc 48: no S4');
    const section = s4.slice(at, s4.indexOf('\n## ', at + 5));
    const beat = (n) => {
      const m = new RegExp(`^\\| ${n} \\| (.+?) \\| [a-z]+ \\|$`, 'm').exec(section);
      if (!m) throw new Error(`doc 48 S4: no beat ${n}`);
      const lines = quoted(m[1]);
      if (lines.length !== 1) throw new Error(`doc 48 S4 beat ${n}: ${lines.length} quoted lines, not 1`);
      return lines[0];
    };
    nodes.HOB_C2.opening = [{ speaker: SPEAKER, line: said(beat(1), 'S4 beat 1') }, ...(nodes.HOB_C2.opening ?? [])];
    const leave = nodes.HOB_C2.options.find((one) => one.tag === 'EXIT');
    if (!leave) throw new Error('doc 04: HOB_C2 has no way out');
    leave.say = said(beat(3), 'S4 beat 3');
    // The act turn owes Act IV's opening (errata 101 B): its `due` flag is
    // written with ACT, so a load before the cut still makes it.
    leave.set = { T_HOB_IS_MOTT: true, T_NO_GOLD_EVER: true, ACT: 4, [actOpenings()[4].due]: true };
  }
  // The "Running" lines are ambient barks, not this tree: hobRunning() below (errata 184).
  for (const note of unplayed) process.stderr.write(`  doc 04 HOB: ${note}\n`);

  return write('content/dialogue/hob.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'HOB',
    speaker: SPEAKER,
    name: 'HOB',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (HOB) by tools/extract-content.mjs. Do not edit: '
      + 'change doc 04 and re-run. Plain quotes in a response are Hob\'s; "Thad:" marks Thad\'s aside; '
      + 'an italic bracket alone is a beat. Entries are errata 71 D\'s. Universal exit lines are doc 04 '
      + 'part one\'s pool.',
    entries: PUZZLE_ENTRY,
    start: 'HOB_A1',
    nodes,
  });
}

/**
 * DOC 04's VES_B1: Vessel found again, in the Nugget's back room (errata 73 B).
 *
 * Merged into the DEKE_VESSEL tree doc 27 already writes, as a second node the
 * tree OPENS ON once Vessel has been found (B3): one man, one tree file, the
 * Act I root and the Act II root, which is the shape doc 04 gives Winnie and
 * Hob. Option 3 starts Duel One and option 5 Duel Two -- the `duel` field names
 * the duel in content/assay/assay.json, and the runner plays it after the
 * option's own reply. Option 5's gate is errata 73 H's "offered once Duel One
 * is lost", and it closes once Duel Two is won, because a won duel has nothing
 * left to yield.
 */
/**
 * VESSEL IN THE NUGGET, AFTER THE TRIP (doc 109, GOING HOME; the brief, 7 and 9). He is in Room 4 only from the
 * rematch agreed in the Gulch (G9), and three things are not as doc 04's VES_B1 writes them:
 * - his first TALK TO opens with doc 109's line, "In place of doc 03's opening, which is now said in the Gulch";
 * - option 3, the replay of Duel One, "is offered only in the Gulch, before G9. In the Nugget, option 3 is not offered"
 *   (doc 109, question 3);
 * - option 6, the challenge (B4) and Duel One, were the tent's and the bar's (G6, G7): "Duel One is no longer fought in
 *   Room 4" (the brief, 7).
 * The rematch (option 5, Duel Two) is the Nugget's, as before.
 */
function vesselBackFromTheGulch(node) {
  const doc = read('docs/109-fiddlers-gulch-lines.md');
  const line = /^\*\*VESSEL, in Room 4, after the trip\*\* — .*?opens with: "([^"]+)"/m.exec(doc)?.[1];
  if (!line) throw new Error('doc 109 GOING HOME: no line for Vessel in Room 4 after the trip');
  if (!/Option 3 is the replay, and is offered only here, before G9\. In the Nugget, it is not offered\./.test(doc)
    && !/In the Nugget, option 3 is not offered/.test(doc)) throw new Error('doc 109 no longer keeps option 3 out of the Nugget');
  const options = node.options.filter((option) => option.id !== 'ves_b1_3' && option.id !== 'ves_b1_6');
  if (options.length !== node.options.length - 2) throw new Error('doc 04: VES_B1 no longer has options 3 and 6 to take out');
  return { ...node, prompt: line, opening: [{ speaker: 'deke_vessel', line }], options,
    gulchNote: 'Doc 109: after the trip, "Grubb! You came all this way. Again." in place of doc 03\'s opening (said at THE FIND); options 3 and 6, the replay and the challenge, were the Gulch\'s.' };
}

function vesselActTwo() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('## DEKE VESSEL');
  if (from < 0) throw new Error('doc 04: cannot find the DEKE VESSEL section');
  const rest = doc.slice(from + 1);
  const body = rest.slice(0, rest.search(/^## /m) > 0 ? rest.search(/^## /m) : rest.length);
  const block = body.slice(body.indexOf('`VES_B1`'), body.indexOf('`VES_F1`'));
  if (!block.includes('VES_B1')) throw new Error('doc 04: VES_B1 not found');
  const SPEAKER = 'deke_vessel';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)]
    .map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');
  const notes = [];
  const said = (text, where) => {
    if (/\*/.test(text)) notes.push(`${where}: emphasis dropped from "${text}"`);
    return plain(text);
  };
  const ROW = /^\| (\d+) \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*$/gm;
  const options = [];
  for (const [, number, optionCell, tagCell, responseCell] of block.matchAll(ROW)) {
    const where = `VES_B1 option ${number}`;
    const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
    if (!tagged) throw new Error(`doc 04: ${where} has no tag`);
    const text = quoted(optionCell)[0];
    if (!text) throw new Error(`doc 04: ${where} has no option text`);
    const option = { id: `ves_b1_${number}`, tag: tagged[1], text: said(text, where) };
    if (tagged[2]) option.afterUse = tagged[2];
    const [spoken, ...after] = responseCell.split('→');
    // A counted-repeat writes its later answers after *(second)*, *(third)*.
    const runs = spoken.split(/\*\((second|third|fourth)\)\*/);
    const first = quoted(runs[0].replace(/\*\([^)]*\)\*/g, '')).map((q) => said(q, where));
    for (const direction of stageDirections(runs[0])) notes.push(`${where} staging: ${direction}`);
    if (first.length === 0) throw new Error(`doc 04: ${where} answers in no line`);
    // Two lines with a beat between them (option 6) are an exchange, both his.
    if (first.length === 1) option.say = first[0];
    else option.exchange = first.map((line) => ({ speaker: SPEAKER, line }));
    const ORDINAL = { second: 2, third: 3, fourth: 4 };
    for (let at = 1; at < runs.length; at += 2) {
      const line = quoted(runs[at + 1])[0];
      if (!line) throw new Error(`doc 04: ${where} ${runs[at]} selection has no line`);
      (option.repeats ??= []).push({ selection: ORDINAL[runs[at]], say: said(line, where) });
    }
    const state = after.join('→');
    const duel = /\*\*Duel (One|Two)\.?\*\*/.exec(state);
    if (duel) option.duel = duel[1] === 'One' ? 'duel_one' : 'duel_two';
    if (duel?.[1] === 'Two') option.when = { T_DUEL_ONE_LOST: true, T_DUEL_TWO_WON: false };
    // OPTION 3 IS THE REPLAY (errata 76 A: "Option 3 is the replay ('twice if
    // asked')"; doc 57 B5: "replays it for anyone who enjoys losing"). So it is
    // offered once Duel One is lost, which keeps B4 -- option 6 -- the way in
    // (errata 130 D), and not after Duel Two is won, when the judges have gone
    // home and there is no Assay left to sit.
    if (duel?.[1] === 'One' && !/\*\*B\d\*\*/.test(state)) option.when = { T_DUEL_ONE_LOST: true, T_DUEL_TWO_WON: false };
    // A PUZZLE THE ROW COMPLETES: option 6's "-> **B4**; **Duel One**" (errata 75).
    const puzzle = /\*\*(B\d)\*\*/.exec(state);
    if (puzzle) option.puzzle = { [puzzle[1]]: 'complete' };
    for (const direction of stageDirections(state)) notes.push(`${where} after: ${direction}`);
    if (state.trim() && !duel && !puzzle) notes.push(`${where}: state "${plain(state)}" names no duel; nothing set`);
    options.push(option);
  }
  if (options.length !== 6) throw new Error(`doc 04: VES_B1 has ${options.length} options, not 6`);
  if (!options.some((o) => o.tag === 'COMIC')) throw new Error('doc 04: VES_B1 has no [COMIC] option');
  options.push({ id: 'ves_b1_x', tag: 'EXIT', text: POOL[3 % POOL.length], universal: true, ends: true });
  for (const note of notes) process.stderr.write(`  doc 04 VES_B1: ${note}\n`);
  // ITS OPENING IS DOC 03'S DUEL ONE EXCHANGE (doc 04, errata 75: "Its opening
  // is doc 03's Duel One exchange"), played on the first TALK TO only (doc 57
  // B4: "The first TALK TO plays..."): `openingOnce` names the flag that
  // records it has been played.
  const three = read('docs/03-liars-assay.md');
  const duelOne = three.slice(three.indexOf('## DUEL ONE'), three.indexOf('## THE SPARRING'));
  const firstGroup = duelOne.split(/\n\n/).find((chunk) => /^> \*\*VESSEL:\*\*/m.test(chunk));
  const opening = [...firstGroup.matchAll(/^> \*\*([A-Z]+):\*\* "(.+?)"$/gm)]
    .map(([, who, line]) => ({ speaker: who === 'THAD' ? 'thad' : SPEAKER, line: plain(line) }));
  if (opening.length !== 3) throw new Error('doc 03: Duel One opening is not three lines');
  return {
    node: {
      id: 'VES_B1',
      prompt: opening[opening.length - 1].line,
      opening,
      openingOnce: 'T_VESSEL_GREETED',
      options,
    },
    entries: [{ when: { T_VESSEL_FOUND: true }, node: 'VES_B1' }],
  };
}

/**
 * DOC 04's VES_F1: Vessel in Act IV, owning the hotel (errata 180; Tyler, 2026-11-08: "Yes").
 *
 * Written in doc 04 since W1 and never extracted. He stands in the hotel lobby from Act IV
 * (content/ambient/deke-vessel.json `placements.hotel_lobby`), and TALK TO there opens this node: its
 * opening ("Grubb! You'll want a room.") once, then four questions, each with a second answer
 * (`*(second)*`), and the universal exit. The entry comes before VES_B1's, so in Act IV he opens here.
 */
function vesselActFour() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('`VES_F1` (Act IV');
  const to = doc.indexOf('## THE LIVERY MAN');
  if (from < 0 || to < from) throw new Error('doc 04: VES_F1 not found');
  const block = doc.slice(from, to);
  const SPEAKER = 'deke_vessel';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)]
    .map((m) => m[1]);
  const greeting = /^> \*\*VESSEL:\*\* "(.+?)"$/m.exec(block);
  if (!greeting) throw new Error('doc 04: VES_F1 has no opening');
  const table = block.slice(greeting.index);
  const ROW = /^\| (\d+) \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*$/gm;
  const options = [];
  for (const [, number, optionCell, tagCell, responseCell] of table.matchAll(ROW)) {
    const where = `VES_F1 option ${number}`;
    const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
    const text = quoted(optionCell)[0];
    if (!tagged || !text) throw new Error(`doc 04: ${where} does not read`);
    const [firstCell, againCell] = responseCell.split('*(second)*');
    const first = quoted(firstCell.replace(/\*\([^)]*\)\*/g, '')).map((q) => plain(q));
    if (first.length !== 1) throw new Error(`doc 04: ${where} answers in ${first.length} lines`);
    const again = againCell ? quoted(againCell.replace(/\*\([^)]*\)\*/g, '')).map((q) => plain(q))[0] : undefined;
    options.push({ id: `ves_f1_${number}`, tag: tagged[1], ...(tagged[2] ? { afterUse: tagged[2] } : {}), text: plain(text),
      say: first[0], ...(again ? { repeats: [{ selection: 2, say: again }] } : {}) });
  }
  if (options.length !== 4) throw new Error(`doc 04: VES_F1 has ${options.length} options, not 4`);
  if (!options.some((o) => o.tag === 'COMIC')) throw new Error('doc 04: VES_F1 has no [COMIC] option');
  options.push({ id: 'ves_f1_x', tag: 'EXIT', text: POOL[1 % POOL.length], universal: true, ends: true });
  const opening = [{ speaker: SPEAKER, line: plain(greeting[1]) }];
  return {
    node: { id: 'VES_F1', prompt: opening[0].line, opening, openingOnce: 'T_VESSEL_HOTEL_GREETED', options },
    entries: [{ when: { ACT: { atLeast: 4 } }, node: 'VES_F1' }],
  };
}

/**
 * DOC 03, THE LIAR'S ASSAY, as data the duel runner plays (errata 73).
 *
 * Every line here is the document's: the 23 boasts and counters, the three
 * wrong answers per pair with the reply each one gets (errata 73 A), the
 * standing mockery pool, and Duels One and Two's spoken scenes. Pair 24 is
 * Duel Four's and lives in its section; Duel Three's fifth exchange is the
 * Main Street duel's and is extracted when that duel is built.
 *
 * WHAT IS NOT TEXT is marked as a ruling and carries its source: Duel One's
 * sequence (errata 73 D), what Thad is offered (73 C), Duel Two's order and
 * threshold (73 E, errata 76 A). A reply's speaker is the document's own
 * attribution: Vessel and Reply are Vessel in Room 4's two duels; Fanshawe is
 * Fanshawe.
 */
/**
 * WHO TEACHES EACH PAIR, from doc 03's own tiers ("## Tier 2 — Learned from
 * Winnie Ledger (5)"), or the pair's own "(Frame)" note in Tier 4. The pair
 * table is assay()'s; this is the part a teaching row needs.
 */
function docThreeTeachers() {
  const doc = read('docs/03-liars-assay.md');
  const two = doc.slice(doc.indexOf('# PART TWO'), doc.indexOf('# PART THREE'));
  const out = new Map();
  for (const tier of two.split(/^## Tier /m).slice(1)) {
    const head = /^(\d) — (.+?) \((\d+)\)/.exec(tier);
    if (!head) throw new Error(`doc 03: unreadable tier heading "${tier.split('\n')[0]}"`);
    for (const [, n, who] of tier.matchAll(/^\*\*(\d+)\.\*\*(?: \*\((.+?)\)\*)?\n/gm)) {
      out.set(Number(n), { who: who ?? plain(head[2]).replace(/^Learned from /, ''), tier: Number(head[1]) });
    }
  }
  return out;
}

/**
 * A SPARRING, from doc 03 PART FOUR ("## THE SPARRING — Winnie (C6)"): the
 * exchange as written, each line by the speaker the document names, and each
 * italic direction through doc 58's rule (a bare pause is a held "…").
 */
function docThreeSparring(name, owner) {
  const doc = read('docs/03-liars-assay.md');
  const heading = `## THE SPARRING — ${name}`;
  const from = doc.indexOf(heading);
  if (from < 0) throw new Error(`doc 03: no "${heading}"`);
  const next = doc.indexOf('\n## ', from + heading.length);
  const lines = [];
  for (const raw of doc.slice(from, next < 0 ? undefined : next).split('\n')) {
    const spoken = /^> \*\*([A-Z]+):\*\* (.+)$/.exec(raw);
    const direction = /^> \*\(([^)]+)\)\*$/.exec(raw);
    if (spoken) {
      const speaker = spoken[1] === 'THAD' ? 'thad' : spoken[1].toLowerCase();
      if (speaker !== 'thad' && speaker !== owner) throw new Error(`doc 03: ${heading} has a line by ${spoken[1]}, not ${owner}`);
      for (const d of spoken[2].matchAll(/\*\(([^)]+)\)\*/g)) {
        const shown = performedDirection(d[1]);
        if (shown) lines.push({ speaker, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
      }
      const said = quoted(spoken[2].replace(/\*\([^)]*\)\*/g, ''));
      if (said.length !== 1) throw new Error(`doc 03: ${heading}: "${spoken[2]}" is not one line`);
      lines.push({ speaker, line: said[0].trimEnd() });
    } else if (direction) {
      const shown = performedDirection(direction[1]);
      if (shown) lines.push({ speaker: owner, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
    }
  }
  if (lines.length < 2) throw new Error(`doc 03: ${heading} has no exchange`);
  return lines;
}

/**
 * AN [ASSAY] ROW THAT TEACHES (doc 57's pair table; doc 04's own cell says
 * "pairs 5–9", "pair 21"). The pairs are read from the row, and doc 03 must
 * agree that this character teaches every one of them; the row then writes
 * their knowledge flags. Nothing is shown for it -- the row keeps doc 04's tag
 * and nothing else (invariant 7's rule for a row that sets something quietly).
 *
 * A row that names "**the Sparring** (doc 03)" performs that exchange after
 * the row's own reply; doc 03's sparring may open on the reply itself (Pratt's
 * "Try me."), which is then said once.
 */
function teachingRow(option, cells, { teacher, owner, sparring }) {
  const range = /\bpairs? (\d+)(?:\s*[–-]\s*(\d+))?/.exec(plain(cells));
  if (!range) throw new Error(`doc 04: ${owner} row "${option.text}" teaches no pairs it names`);
  const first = Number(range[1]);
  const last = Number(range[2] ?? range[1]);
  const teachers = docThreeTeachers();
  const set = {};
  for (let n = first; n <= last; n += 1) {
    const taught = teachers.get(n);
    if (!taught || !taught.who.toLowerCase().includes(teacher.toLowerCase())) {
      throw new Error(`doc 04 says ${teacher} teaches pair ${n}; doc 03 says ${taught?.who ?? 'nobody'}`);
    }
    set[`ASSAY_PAIR_${String(n).padStart(2, '0')}`] = true;
  }
  option.set = { ...option.set, ...set };
  if (sparring && /\*\*the Sparring\*\* \(doc 03\)/.test(cells)) {
    const exchange = docThreeSparring(sparring, owner);
    const reply = option.say ? [{ speaker: owner, line: option.say }] : (option.exchange ?? []);
    const opensOnReply = reply.length === 1 && exchange[0].speaker === owner && exchange[0].line === reply[0].line;
    // EVERY PAIR THE ROW GRANTS IS PERFORMED (errata 136 C; Tyler, 2026-11-06,
    // "Sparrings show every pair": the practice rounds perform each boast and
    // counter they grant, using existing lines only). Doc 03's sparring
    // performs one; the others are run through first, as the sparring itself
    // has them: Thad says the boast, the teacher says the counter. Every word
    // is doc 03 Part Two's. They come after the row's reply -- or after the
    // sparring's own first line where the sparring opens on it (Pratt's "Try
    // me.") -- and before the rest of the sparring, so Winnie's "Say it again."
    // and Pratt's astonishment land where doc 03 wrote them, at the end.
    const pairs = assayPairs();
    const said = exchange.filter((line) => line.speaker === 'thad').map((line) => line.line.replace(/\s*[—–-]+\s*$/, ''));
    const performed = (pair) => said.some((line) => line.length > 0 && pair.boast.startsWith(line));
    const run = [];
    for (let n = first; n <= last; n += 1) {
      const pair = pairs.find((one) => one.n === n);
      if (!pair) throw new Error(`doc 03: no pair ${n} to run through`);
      if (performed(pair)) continue;
      run.push({ speaker: 'thad', line: pair.boast }, { speaker: owner, line: pair.counter });
    }
    if (!pairs.some((pair) => pair.n >= first && pair.n <= last && performed(pair))) {
      throw new Error(`doc 03: ${heading(sparring)} performs none of pairs ${first}-${last}`);
    }
    // PLAYED, NOT WATCHED (errata 243; doc 114 II-4, Tyler, 2026-11-09: "All"). The row used to perform every pair in one
    // long exchange the player sat through. It now opens a practice node: each boast is an option the player picks, the
    // teacher answers it, and that pair is his; the pair doc 03's sparring itself performs comes last, with the scene
    // doc 03 wrote round it. Every word is doc 03's, as before -- only who picks has changed. `run` is boast, counter,
    // boast, counter; the row's own reply ("Sit.", "Try me.") is all the row says now.
    const flagOf = (n) => `ASSAY_PAIR_${String(n).padStart(2, '0')}`;
    const stem = option.id.replace(/\d+$/, '');
    const drills = [];
    for (let n = first; n <= last; n += 1) {
      const pair = pairs.find((one) => one.n === n);
      if (performed(pair)) continue;
      drills.push({ id: `${stem}_spar${n}`, tag: 'ASSAY', text: pair.boast, afterUse: 'remove', when: { [flagOf(n)]: false },
        exchange: [{ speaker: owner, line: pair.counter }], set: { [flagOf(n)]: true } });
    }
    const shown = pairs.filter((pair) => pair.n >= first && pair.n <= last && performed(pair));
    if (shown.length !== 1) throw new Error(`doc 03: ${heading(sparring)} performs ${shown.length} of pairs ${first}-${last}, not one`);
    // The scene doc 03 wrote: after the teacher's opening line where the row has already said it (Pratt's "Try me."),
    // and less Thad's own boast where the scene begins on it, since choosing the option says it.
    let scene = opensOnReply ? exchange.slice(1) : exchange;
    if (scene[0].speaker === 'thad' && shown[0].boast.startsWith(scene[0].line.replace(/\s*[—–-]+\s*$/, ''))) scene = scene.slice(1);
    const nodeId = `${sparring.toUpperCase().slice(0, 3)}_SPAR`;
    const finale = { id: `${stem}_spar${shown[0].n}`, tag: 'ASSAY', text: shown[0].boast, afterUse: 'remove',
      when: { [flagOf(shown[0].n)]: false }, after: drills.map((one) => one.id), exchange: scene,
      set: { [flagOf(shown[0].n)]: true }, goto: option.backTo };
    delete option.backTo;
    option.exchange = opensOnReply ? [exchange[0]] : reply;
    delete option.say;
    delete option.set;
    option.afterUse = 'retain';
    option.whenAny = [...drills, finale].map((one) => one.when);
    option.goto = nodeId;
    option.sparringNode = { id: nodeId, noPrompt: true,
      exceptionReason: 'Errata 243: a practice node, built from doc 03\'s pairs; doc 04 writes the row that opens it.',
      noComic: true, noComicReason: 'Errata 243: every option is a boast and every answer is the joke; none is a side remark.',
      options: [...drills, finale] };
  }
  return option;
}

/** A sparring's heading, for messages. */
function heading(name) {
  return `## THE SPARRING — ${name}`;
}

/**
 * PAIRS 25 AND 26 (doc 109, ## G8 · THE MESSAGES, AND PAIRS 25 AND 26): Tier 7, learned in the Gulch, in doc 03 Part
 * Two's shape (`**25.**` then the italic boast and the bold counter), with their wrong answers in Part Three's (`>
 * **"..."** — *Vessel: "..."*`), each answered by Vessel. Their knowledge flags are ASSAY_PAIR_25 and ASSAY_PAIR_26,
 * written by the messages carried (gulchMessages).
 */
function gulchPairs(WRONG, BY) {
  const doc = read('docs/109-fiddlers-gulch-lines.md');
  const at = doc.indexOf('\n### The pairs, for doc 03 Part Two');
  const wrongAt = doc.indexOf('\n### Their wrong answers, for doc 03 Part Three');
  if (at < 0 || wrongAt < 0) throw new Error('doc 109: G8\'s pairs or their wrong answers are not where they were');
  const head = /Tier (\d+): (.+?) \((\d+)\)/.exec(doc.slice(at, at + 200));
  if (!head) throw new Error('doc 109: G8\'s pairs name no tier');
  const two = doc.slice(at, wrongAt);
  const three = doc.slice(wrongAt, doc.indexOf('\n---', wrongAt));
  const pairs = [...two.matchAll(/^\*\*(\d+)\.\*\*\n> \*"(.+?)"\*\n> \*\*"(.+?)"\*\*/gm)].map(([, n, boast, counter]) => ({
    n: Number(n), tier: Number(head[1]), learnedFrom: head[2], boast: plain(boast), counter: plain(counter), wrong: [],
    flag: `ASSAY_PAIR_${String(n).padStart(2, '0')}`,
  }));
  if (pairs.length !== Number(head[3])) throw new Error(`doc 109: Tier ${head[1]} has ${pairs.length} pairs, not ${head[3]}`);
  for (const [, n, text] of three.split(/^\*\*(\d+)\.\*\* /m).slice(1)
    .reduce((acc, item, i, arr) => (i % 2 === 0 ? [...acc, [null, item, arr[i + 1]]] : acc), [])) {
    const pair = pairs.find((one) => one.n === Number(n));
    if (!pair) throw new Error(`doc 109: wrong answers for unknown pair ${n}`);
    pair.wrong = [...text.matchAll(WRONG)].map(([, said, by, reply]) => ({ text: plain(said), reply: plain(reply), by: BY[by], attribution: by }));
    if (pair.wrong.length !== 3) throw new Error(`doc 109: pair ${n} has ${pair.wrong.length} wrong answers, not 3`);
  }
  return pairs;
}

/** Doc 03 Part Two's pairs, boast and counter, as assay() reads them. */
function assayPairs() {
  const doc = read('docs/03-liars-assay.md');
  const two = doc.slice(doc.indexOf('# PART TWO'), doc.indexOf('# PART THREE'));
  return [...two.matchAll(/^\*\*(\d+)\.\*\*(?: \*\((.+?)\)\*)?\n> \*"(.+?)"\*\n> \*\*"(.+?)"\*\*/gm)]
    .map(([, n, , boast, counter]) => ({ n: Number(n), boast: plain(boast), counter: plain(counter) }));
}

function assay() {
  const doc = read('docs/03-liars-assay.md');
  const part = (heading, next) => {
    const from = doc.indexOf(heading);
    if (from < 0) throw new Error(`doc 03: no "${heading}"`);
    const to = next ? doc.indexOf(next, from + heading.length) : doc.length;
    return doc.slice(from, to < 0 ? doc.length : to);
  };

  // PART TWO: the pairs, by tier.
  const pairs = [];
  const two = part('# PART TWO', '# PART THREE');
  for (const tier of two.split(/^## Tier /m).slice(1)) {
    const head = /^(\d) — (.+?) \((\d+)\)/.exec(tier);
    if (!head) throw new Error(`doc 03: unreadable tier heading "${tier.split('\n')[0]}"`);
    const [, tierNumber, learned, count] = head;
    const found = [...tier.matchAll(/^\*\*(\d+)\.\*\*(?: \*\((.+?)\)\*)?\n> \*"(.+?)"\*\n> \*\*"(.+?)"\*\*/gm)];
    for (const [, n, who, boast, counter] of found) {
      pairs.push({
        n: Number(n), tier: Number(tierNumber), learnedFrom: who ?? plain(learned).replace(/^Learned from /, ''),
        boast: plain(boast), counter: plain(counter), wrong: [],
        // The knowledge flag (content/flags/flags.json). Fanshawe's tier is never Thad's to learn.
        ...(Number(tierNumber) <= 5 ? { flag: `ASSAY_PAIR_${String(n).padStart(2, '0')}` } : {}),
      });
    }
    const written = Number(count) - (tier.includes('*see Duel Four.*') ? 1 : 0);
    if (found.length !== written) throw new Error(`doc 03: Tier ${tierNumber} has ${found.length} pairs, not ${written}`);
  }
  if (pairs.length !== 23) throw new Error(`doc 03: ${pairs.length} pairs, not 23`);
  // FANSHAWE'S TIER IS LEARNED BY A PUZZLE, NOT A FLAG. Doc 57 E10: "Pairs 22,
  // 23 and 24 join: Thad now knows the truth" when the confession completes.
  for (const pair of pairs) if (pair.tier === 6) Object.assign(pair, { learnedAt: 'E10', learnedRuling: 'doc 57 E10 and its pair table: "22-24 | the truth | E10, the confession".' });

  // PART THREE: three wrong answers per pair, each with its reply.
  const three = part('# PART THREE', '# PART FOUR');
  const WRONG = /^> \*\*"(.+?)"\*\* — \*(Vessel|Reply|Fanshawe): "(.+?)"\*$/gm;
  const BY = { Vessel: 'deke_vessel', Reply: 'deke_vessel', Fanshawe: 'fanshawe' };
  const sample = three.slice(three.indexOf('Sample wrong answers for pair 1'), three.indexOf('## Wrong answers, pairs'));
  const blocks = [['1', sample],
    ...three.slice(three.indexOf('## Wrong answers, pairs')).split(/^\*\*(\d+)\.\*\* /m).slice(1)
      .reduce((acc, item, i, arr) => (i % 2 === 0 ? [...acc, [item, arr[i + 1]]] : acc), [])];
  for (const [n, text] of blocks) {
    const pair = pairs.find((p) => p.n === Number(n));
    if (!pair) throw new Error(`doc 03: wrong answers for unknown pair ${n}`);
    const body = text.split(/^\*\*Duel Three|^\*\*Standing mockery/m)[0];
    pair.wrong = [...body.matchAll(WRONG)].map(([, said, by, reply]) => ({
      text: plain(said), reply: plain(reply), by: BY[by], attribution: by,
    }));
    if (pair.wrong.length !== 3) throw new Error(`doc 03: pair ${n} has ${pair.wrong.length} wrong answers, not 3`);
  }
  for (const pair of pairs) if (pair.wrong.length !== 3) throw new Error(`doc 03: pair ${pair.n} has no wrong answers`);
  const seen = new Set();
  for (const pair of pairs) {
    for (const w of pair.wrong) {
      if (seen.has(w.text)) throw new Error(`doc 03: wrong answer reused: "${w.text}" (Part Five, note 1)`);
      seen.add(w.text);
    }
  }
  const mockery = [...three.slice(three.indexOf('**Standing mockery lines**')).matchAll(/^- \*"(.+?)"\*$/gm)]
    .map((m) => plain(m[1]));
  if (mockery.length !== 5) throw new Error(`doc 03: ${mockery.length} mockery lines, not 5`);
  // THE LAST OF THEM IS THE PLANT (doc 03: "That last one lands very differently
  // in Act IV."). Tyler, 2026-11-06 ("Use the unused mockery lines"): it closes
  // Duel One's loss, after "That's the trouble."; the other four turn, one per
  // lost Duel Two, after the reply that lost it (errata 136 B).
  if (!/That last one lands very differently in Act IV/.test(three)) throw new Error('doc 03: the mockery plant note has moved');
  const plant = mockery.length - 1;
  const jeers = mockery.map((_, i) => i).filter((i) => i !== plant);

  // PART FOUR: the spoken scenes, as groups of quoted lines.
  const SAYS = { VESSEL: 'deke_vessel', THAD: 'thad', SOWERBY: 'sowerby' };
  // THE HANDBILL'S FIVE RULES (Part One), which Sowerby reads before each of
  // Room 4's duels (errata 75). Read as the document lists them.
  const rulesAt = doc.indexOf('**The rules, as posted');
  const rules = [...doc.slice(rulesAt, doc.indexOf('Rule 3 is', rulesAt)).matchAll(/^> (\d\. .+)$/gm)]
    .map((m) => ({ speaker: 'sowerby', line: plain(m[1]) }));
  if (rules.length !== 5) throw new Error(`doc 03: ${rules.length} rules, not 5`);
  const groups = (section) => section.split(/\n(?!> )/).map((chunk) => [...chunk.matchAll(/^> \*\*([A-Z]+):\*\* "(.+?)"(?: \*\([^)]*\)\*)?$/gm)])
    .filter((g) => g.length).map((g) => g.map(([, who, line]) => {
      if (!SAYS[who]) throw new Error(`doc 03: unknown speaker ${who}`);
      return { speaker: SAYS[who], line: plain(line) };
    }));
  const one = groups(part('## DUEL ONE', '## THE SPARRING'));
  if (one.length !== 4) throw new Error(`doc 03: Duel One has ${one.length} spoken groups, not 4`);
  // The opening exchange is VES_B1's greeting now (doc 04, errata 75), not the duel's.
  const [, [notebook], others, duelOneLoss] = one;
  if (others.length !== 3) throw new Error('doc 03: Duel One writes the other three notebook lines as a group of three');
  const two2 = groups(part('## DUEL TWO', '## DUEL FOUR'));
  if (two2.length !== 2) throw new Error(`doc 03: Duel Two has ${two2.length} spoken groups, not 2`);
  const [duelTwoPreamble, duelTwoWin] = two2;

  // DUEL THREE, the Main Street duel (doc 03 "DUEL FOUR -- Colonel Absalom
  // Fanshawe"; doc 57 F4). Its spoken lines, in order, with their directions:
  // the challenge; the three lines after a lost exchange, in turn (errata 75:
  // "A lost exchange is thrown again"); the fifth boast and the truth (pair
  // 24); and the end. The three jokes beside pair 24 are Part Three's.
  const four = part('## DUEL FOUR', '# PART FIVE');
  const said = [...four.matchAll(/^> \*\*([A-Z]+):\*\* (?:\*\(([^)]+)\)\* )?"(.+?)"$/gm)]
    .map(([, who, direction, line]) => ({ who, direction, line: plain(line) }));
  const SAYS3 = { FANSHAWE: 'fanshawe', THAD: 'thad', SOWERBY: 'sowerby' };
  const spoken3 = (one) => {
    if (!SAYS3[one.who]) throw new Error(`doc 03 Duel Four: unknown speaker ${one.who}`);
    return [...(one.direction ? [{ speaker: SAYS3[one.who], line: plain(one.direction), direction: true }] : []),
      { speaker: SAYS3[one.who], line: one.line }];
  };
  if (said.length !== 10) throw new Error(`doc 03 Duel Four: ${said.length} spoken lines, not 10`);
  const [challenge, again1, again2, again3, fifth, truth, ...ending] = said;
  const jokes = three.slice(three.indexOf('**Duel Three, the fifth exchange**'), three.indexOf('**Standing mockery'));
  // THE RELEASE, AS DOC 03 STAGES IT (errata 131 D, E). Two prose directions
  // around the verdict are performed, not shown: "Silence on Main Street. Long.
  // Fanshawe does not move." is a held silence before Sowerby, with the duel's
  // music cut and everyone still; "The street erupts." is the crowd's cue on
  // the line after his verdict. Read from the document so they cannot drift.
  const silence = /^(Silence on Main Street\. Long\. .+)$/m.exec(four)?.[1];
  const erupts = /^(The street erupts\.)/m.exec(four)?.[1];
  if (!silence || !erupts) throw new Error('doc 03 Duel Four: the silence or the eruption is not where it was');
  const [verdict, ...afterVerdict] = ending.flatMap(spoken3);
  const release = [
    { speaker: verdict.speaker, line: '', rest: 3, quiet: true, staging: `doc 03: "${silence}"` },
    verdict,
    { ...afterVerdict[0], cue: 'F4-ERUPTS', staging: `doc 03: "${erupts}"` },
    ...afterVerdict.slice(1),
  ];
  const pair24 = {
    n: 24, tier: 6, learnedFrom: 'the ending', learnedAt: 'E10', boast: fifth.line, counter: truth.line,
    wrong: [...jokes.matchAll(WRONG)].map(([, text, by, reply]) => ({ text: plain(text), reply: plain(reply), by: BY[by], attribution: by })),
  };
  if (pair24.wrong.length !== 3) throw new Error(`doc 03: the fifth exchange has ${pair24.wrong.length} jokes, not 3`);
  pairs.push(pair24);
  // TIER 7, LEARNED IN THE GULCH (doc 109, G8: "### The pairs, for doc 03 Part Two, as Tier 7"): read from doc 109
  // directly in doc 03's own shapes, its boasts and counters and "### Their wrong answers", never copied into doc 03
  // (the brief, 1). Learned by carrying the messages between the panner and the man upstream.
  pairs.push(...gulchPairs(WRONG, BY));
  const duelThree = {
    puzzle: 'F4',
    opponent: 'fanshawe',
    opening: [...spoken3(challenge), ...rules],
    openingRuling: 'doc 57 F4: "doc 03\'s challenge plays"; then doc 03 Part One: Sowerby reads the handbill "at unbearable '
      + 'length before every match", Rule 3 among them (errata 131 D).',
    sequence: [4, 9, 22, 23, 24],
    sequenceRuling: 'errata 75 and doc 57 F4: "in the order 4, 9, 22, 23, then the fifth".',
    rethrow: [again1, again2, again3].flatMap(spoken3),
    rethrowRuling: 'errata 75: "A lost exchange is thrown again ... After the reply to a wrong answer, one of these, in turn." So the duel cannot be lost, and ends when the fifth is answered.',
    knows: [4, 9, 24],
    knowsRuling: 'doc 03: "The player is offered four counters. Three are jokes. The fourth is pair 24, and it is not a lie." It is always on offer. '
      + 'Pairs 4 and 9 too: errata 75 I calls them "guaranteed in Act II", and pair 9\'s one source (WIN_B4) can be walked past for good, '
      + 'after which a re-thrown exchange 2 never ends (invariant 6; errata 120).',
    win: release,
    winRuling: 'errata 131 D, E: the silence held before the verdict (3 s, nothing clickable, the music cut), the judges\' '
      + 'pencil in it, and the street erupting as the verdict lands.',
    setsOnWin: { T_FANSHAWE_BEATEN: true },
    calledByOpponent: true,
    calledRuling: 'doc 03: "Fanshawe calls the duel himself"; doc 57 F4: on Main Street after T_ASSAY_RUN, Fanshawe is waiting.',
  };

  return write('content/assay/assay.json', {
    schema: 1,
    id: 'ASSAY',
    note: 'EXTRACTED from docs/03-liars-assay.md by tools/extract-content.mjs. Do not edit: change doc 03 and '
      + 're-run. Lines are the document\'s; fields marked "ruling" are the errata\'s mechanism, carried as data.',
    exchangesToWin: 5,
    exchangesToWinRuling: 'docs/03-liars-assay.md How it plays: "First to five exchanges wins the duel."',
    offerRuling: 'errata 73 C: a boast whose counter Thad has not learned offers its three wrong answers; a learned '
      + 'one adds the right counter as a fourth, in a slot that varies by pair.',
    bystander: 'assay_ring',
    bystanderRuling: 'errata 73 F: a voice from the ring of chairs, unnamed.',
    pencil: 'sowerby',
    pencilRuling: 'doc 03 Part Four: "Sowerby holds the pencil"; doc 45 U-ASSAY-PENCIL: each point the judges write down.',
    markSeconds: 0.6,
    markRuling: 'errata 130 B: a point is written down in a held beat after the line that won it and before the next boast.',
    pairs,
    mockery,
    duels: {
      duel_one: {
        puzzle: 'B5',
        opponent: 'deke_vessel',
        opening: rules,
        openingRuling: 'errata 75: before the first exchange, Sowerby reads the handbill\'s five rules aloud, all of them.',
        sequence: [1, 2, 3, 4, 1],
        sequenceRuling: 'errata 73 D: pairs 1, 2, 3 and 4, then pair 1 again; nobody mutters on the repeat.',
        notebook: { 1: notebook, 2: others[0], 3: others[1], 4: others[2] },
        notebookRuling: 'errata 73 D and 75: Thad writes each counter down as he hears it, and the notebook joins his '
          + 'repertoire when the duel is over.',
        learns: [1, 2, 3, 4],
        sets: { T_DUEL_ONE_LOST: true },
        loss: [...duelOneLoss, { speaker: 'deke_vessel', line: mockery[plant] }],
        lossRuling: 'doc 03 Duel One\'s loss dialogue, then the standing mockery\'s last line (errata 136 B; Tyler, '
          + '2026-11-06: "Son, you\'ve told the truth. In front of people." closes Duel One\'s loss after "That\'s the trouble.").',
        offersMuttered: true,
        offersMutteredRuling: 'errata 136 D (Tyler, 2026-11-06, "Offer the counter just learned"): the repeat of pair 1 offers '
          + 'the counter he has just written down. Five boasts are thrown, so the duel still cannot be won.',
        winnable: false,
      },
      duel_two: {
        puzzle: 'B6',
        opponent: 'deke_vessel',
        // Doc 57 B6's "pairs 1–21", widened by doc 109's G8: "now 1–21, 25 and 26", read from doc 109's sentence.
        pool: (() => {
          const m = /\(doc 57 B6: "pairs 1–21", now (\d+)–(\d+), (\d+) and (\d+)\)/.exec(read('docs/109-fiddlers-gulch-lines.md'));
          if (!m) throw new Error('doc 109: G8 no longer says what Duel Two\'s pool is now');
          const [from, to, a, b] = m.slice(1).map(Number);
          return [...Array.from({ length: to - from + 1 }, (_, i) => from + i), a, b];
        })(),
        threshold: 14,
        opening: [...duelTwoPreamble, ...rules],
        openingRuling: 'doc 03 Duel Two (errata 75): Sowerby, Vessel, Sowerby, and then "(He reads all five.)".',
        orderRuling: 'errata 73 E, doc 57 B6 and errata 76 A: Tier 1 first, never repeating. Then, holding fourteen '
          + 'or more, the pairs Thad knows before the rest; holding fewer, the rest first (doc 02 B6: ">=14 pairs"). '
          + 'The pairs he knows are thrown latest tier first (errata 130 C).',
        learnsByLosing: true,
        learnsByLosingRuling: 'doc 03 Part One, "Learning": "When an opponent uses a boast Thad has no answer to, Thad hears '
          + 'the correct counter from the crowd." The ring mutters each counter he lacks the first time it is thrown, and it '
          + 'joins his repertoire when the duel is over, won or lost (errata 130 A).',
        win: duelTwoWin,
        setsOnWin: { T_DUEL_TWO_WON: true },
        yields: ['document_a', 'watch'],
        lossRuling: 'errata 73 H, amended by errata 136 B: a lost Duel Two ends on the reply that lost it, the judges\' mark, and '
          + 'Vessel\'s jeer -- doc 03\'s standing mockery, "rotated on any loss" -- before the ring teaches what he lacked.',
        mocks: { pool: jeers, counter: 'T_DUEL_TWO_LOSSES' },
      },
      duel_three: duelThree,
      duel_one_bar: gulchBarDuel({
        puzzle: 'B5', opponent: 'deke_vessel', sequence: [1, 2, 3, 4, 1],
        notebook: { 1: notebook, 2: others[0], 3: others[1], 4: others[2] }, learns: [1, 2, 3, 4],
        loss: [...duelOneLoss, { speaker: 'deke_vessel', line: mockery[plant] }],
      }),
    },
  });
}

/**
 * DUEL ONE, ON THE BAR (doc 109, ## DUEL ONE, ON THE BAR · G7 (B5); reference/fiddlers-gulch/brief.md, 7): doc 03's
 * Duel One -- Vessel's pairs 1, 2, 3, 4 and 1 again, Thad's notebook lines and the loss dialogue, all extracted from
 * doc 03 as duel_one's are -- fought on the bar in Room 53. What doc 109 changes: the rule-keeper recites the bar's
 * rules in place of Sowerby's handbill (the `> **RULE-KEEPER:**` lines before "*After each exchange"); he scores with
 * pebbles (the pencil is his, and a point sounds doc 45's R53-PEBBLE); the panner mutters each counter; and after the
 * loss dialogue the rule-keeper's line (the `> **RULE-KEEPER:**` lines after it). Vessel is the Deacon's figure here,
 * `gulch_deacon`. Vessel calls it on the bar (an accost), and it clears the call, `T_DUEL_ONE_CALLED`.
 */
function gulchBarDuel(one) {
  const doc = read('docs/109-fiddlers-gulch-lines.md');
  const at = doc.indexOf('\n## DUEL ONE, ON THE BAR');
  if (at < 0) throw new Error('doc 109: no "## DUEL ONE, ON THE BAR"');
  const body = doc.slice(at + 1, doc.indexOf('\n---', at + 1));
  const split = body.indexOf('*After each exchange');
  if (split < 0) throw new Error('doc 109: DUEL ONE, ON THE BAR no longer says what happens after each exchange');
  if (!/moves a pebble/.test(body.slice(split, split + 200))) throw new Error('doc 109: the bar is no longer scored with pebbles');
  const said = (part) => [...part.matchAll(/^> \*\*RULE-KEEPER:\*\* (.+)$/gm)]
    .flatMap((m) => gulchSpoken(m[1], 'gulch_rule_keeper'));
  const opening = said(body.slice(0, split));
  const after = said(body.slice(split));
  if (opening.filter((line) => !line.direction).length < 6 || after.length !== 1) {
    throw new Error(`doc 109: the bar's rules read ${opening.length} lines and the close ${after.length}`);
  }
  const here = (lines) => lines.map((line) => ({ ...line, speaker: line.speaker === 'deke_vessel' ? 'gulch_deacon' : line.speaker }));
  return {
    puzzle: one.puzzle,
    opponent: 'gulch_deacon',
    opening,
    openingRuling: 'doc 109, DUEL ONE, ON THE BAR: "the rule-keeper recites the rules in place of Sowerby\'s handbill".',
    sequence: one.sequence,
    sequenceRuling: 'doc 109: "Vessel\'s pairs 1, 2, 3, 4 and 1 again" (errata 73 D).',
    notebook: one.notebook,
    learns: one.learns,
    sets: { T_DUEL_ONE_LOST: true, T_DUEL_ONE_CALLED: false },
    loss: [...here(one.loss), ...after],
    lossRuling: 'doc 109: doc 03\'s loss dialogue, extracted from there; then "After the loss dialogue", the rule-keeper\'s line.',
    offersMuttered: true,
    winnable: false,
    calledByOpponent: true,
    bystander: 'gulch_panner',
    pencil: 'gulch_rule_keeper',
    markCue: 'R53-PEBBLE',
    stagingRuling: 'doc 109: "he scores with pebbles from his bag; the panner, in the river beside the bar, is the voice that '
      + 'mutters each counter" (doc 45 R53-PEBBLE). Duel One is fought here instead of in Room 4 once the trip is whole '
      + '(the brief, 7); until then duel_one is the Nugget\'s.',
  };
}

/**
 * DOC 04, COLONEL ABSALOM FANSHAWE: Room 11's tree (errata 84). Read as
 * Frame's is (spokenIn, quoted, afterIds), from doc 04's Fanshawe layout:
 * nodes are `## ACT I — Root: \`FAN_A1\`` and `## ACT II — \`FAN_B1\`: ...`
 * headings, each a table whose fifth column is a State or a Rule ledger; the
 * `## THE WAR` section between A1 and A2 is not a node. Doc 57 writes the
 * dinner's frame (A10) and the offer's turn (E0b): their lines are read from
 * doc 57 here. Every string is a document's.
 *
 * ROUTING THE PROSE NAMES IN WORDS, authored here as A8_CASES is: FAN_A1 1
 * and 2 both give THE COMPANY MAP (doc 04: "Gives map"; "He gives the map
 * anyway"); FAN_A2 6 is A10 (doc 57: beat 3's line, THE HANDKERCHIEF,
 * `T_DINED`) and ends the dinner; FAN_A2's universal exit is doc 57's "Leaving
 * the table" line; FAN_B1 1 goes on to FAN_B2 (the introduction, then the
 * card: errata 84 D); FAN_C1 1 is E0b, with Thad's aside and `ACT` 3 (doc 57).
 * FAN_D1 is not built: three of the war's five contradictions are written but
 * no node offers them, so it cannot be reached (doc 36 Q154).
 *
 * ENTRIES (doc 57, doc 04): FAN_C1 after E0 until the clause is read; FAN_A2
 * while Thad holds THE INVITATION (`T_BORDERS_MOTT`) until `T_DINED`; FAN_B1
 * from Act II; FAN_A1 once swindled; else FAN_A0.
 */
function fanshaweTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# COLONEL ABSALOM FANSHAWE');
  const to = doc.indexOf('\n# HOB', from);
  if (from < 0 || to < 0) throw new Error('doc 04: cannot find the FANSHAWE section');
  const body = doc.slice(from, to);
  const d57 = read('docs/57-puzzle-completion.md');
  const section57 = (heading) => {
    const at = d57.indexOf(heading);
    if (at < 0) throw new Error(`doc 57: no section "${heading}"`);
    const rest = d57.slice(at + heading.length);
    return rest.slice(0, (/\n## |\n---\n/.exec(rest) ?? { index: rest.length }).index);
  };
  const a10 = section57('## A10 · Survive dinner at Fanshawe\'s');
  const bullet = (label) => {
    const m = new RegExp(`^- \\*\\*${label}\\*\\*.*$`, 'm').exec(a10);
    if (!m) throw new Error(`doc 57 A10: no "${label}" bullet`);
    return m[0];
  };
  const leaving = /\*\*FANSHAWE:\*\* "([^"]+)"/.exec(bullet('Leaving the table'))?.[1];
  const beat3 = /\*\*FANSHAWE:\*\* "([^"]+)"/.exec(bullet('Beat 3, after option 6 settles:'))?.[1];
  if (!leaving || !beat3) throw new Error('doc 57 A10: the leaving line or beat 3\'s line was not found');
  const beat3Direction = /^- \*\*Beat 3, after option 6 settles:\*\* \*\(([^)]+)\)\*/m.exec(a10)?.[1];
  const beat3Staging = beat3Direction ? performedDirection(beat3Direction) : null;
  if (!beat3Staging) throw new Error('doc 57 A10: beat 3 lost its knocked glass');
  const turn = /\*\*The turn:\*\*[^*]*\*"([^"]+)"\*/.exec(body)?.[1];
  if (!turn) throw new Error('doc 04 FAN_C1: Thad\'s aside ("The turn") was not found');
  const SPEAKER = 'fanshawe';
  // DOC 120 I-1, the two FAN_A2 rows it rewrites, read from its THE LINES.
  const dinner = (() => {
    const rows = read('docs/120-act-one-by-hand.md').split('\n');
    const after = (start) => {
      const row = rows.find((one) => one.startsWith(start));
      if (!row) throw new Error(`doc 120: no line starting ${start}`);
      return row.slice(row.indexOf(' — ') + 3);
    };
    const six = scenesBCWords(after('**`FAN_A2` option 6**'), 'thad', { FANSHAWE: SPEAKER });
    const closing = scenesBCWords(after('**`FAN_A2`, leaving the conversation**'), 'thad', { FANSHAWE: SPEAKER }).first;
    if (six.first.length !== 2 || !six.first[1].direction || six.second.length !== 1 || closing.length !== 1) {
      throw new Error('doc 120 I-1: FAN_A2 option 6 or its closing does not read');
    }
    return { six: { then: [six.first[1]], repeat: six.second[0].line }, closing: closing[0].line };
  })();
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');
  const ROUTE = {
    // A4 IS THE MAP ARRIVING (doc 02 A4 yields "Company map"; doc 57 A4: "FAN_A1
    // gives THE COMPANY MAP ... The map is what finds Prosperity").
    'FAN_A1:1': { gives: ['company_map'], puzzle: { A4: 'complete' } },
    'FAN_A1:2': { gives: ['company_map'], puzzle: { A4: 'complete' } },
    // THE HANDKERCHIEF ARRIVES ON SCREEN (errata 228): doc 57's knocked glass is played before "Keep it. I have
    // dozens.", which otherwise named an object nobody had seen.
    // THE DINNER IS ENDED BY HAND (doc 120 I-1; errata 248): the cover put back over the contract (Room 11's CLOSE)
    // is what carries doc 57's beat 3, THE HANDKERCHIEF, T_DINED and A10 now. Option 6 is said, the Colonel agrees,
    // and the dish is still there: it stays on the menu and answers again (`dinner.six`).
    'FAN_A2:6': { then: dinner.six.then, retain: true, repeat: dinner.six.repeat },
    'FAN_B1:1': { goto: 'FAN_B2' },
    // THE WAR'S PAYOFF (errata 184): "available in Act III with all five" (doc 04, THE WAR).
    'FAN_B1:6': { when: { ACT: { atLeast: 3 }, WAR_CONTRADICTIONS: { atLeast: 5 } } },
    'FAN_C1:1': { then: [{ speaker: 'thad', line: turn }], set: { ACT: 3, ...(actOpenings()[3] ? { [actOpenings()[3].due]: true } : {}) }, puzzle: { E0b: 'complete' } },
  };
  // Leaving the conversation is no longer leaving the table (doc 120 I-1): doc 57's line for leaving is said at the
  // door (Room 11's transit), and the conversation closes on doc 120's.
  const EXIT_SAY = { FAN_A2: dinner.closing };
  void leaving;
  const ENTRY = [
    ['FAN_C1', { T_CLAIM1_BLANK: true, T_EXCAVATION_CLAUSE: false }],
    ['FAN_A2', { T_BORDERS_MOTT: true, T_DINED: false }],
    ['FAN_B1', { ACT: { atLeast: 2 } }],
    ['FAN_A1', { T_SWINDLED: true }],
  ];
  const unplayed = [];
  const nodes = {};
  let poolIndex = 0;
  const sections = body.split(/^(?=## )/m);
  for (const section of sections) {
    const head = /^## ACT [IV]+ — (?:Root: )?`(FAN_[A-Z0-9]+)`/.exec(section);
    if (!head) continue;
    const id = head[1];
    const text = section;
    const ROW = /^\| (\d+) \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|(?:[ \t]*(.*?)[ \t]*\|)?[ \t]*$/gm;
    const rows = [...text.matchAll(ROW)];
    if (!rows.length) {
      // FAN_D1 is played as FAN_B1 option 6's exchange (errata 184).
      if (!/played as `FAN_[A-Z0-9]+` option \d+/.test(text)) unplayed.push(`${id}: no option table -- not built (doc 36 Q154)`);
      continue;
    }
    const opening = [...text.matchAll(/^> \*\*(FANSHAWE|THAD):\*\* (.+)$/gm)].map((m) => {
      const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
      for (const d of m[2].matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} opening (${speaker}) staging: ${d[1]}`);
      const line = quoted(m[2].replace(/\*\([^)]*\)\*/g, '')).join(' ').replace(/\*/g, '');
      if (!line) throw new Error(`doc 04: ${id} opening line by ${speaker} has no quoted speech`);
      return { speaker, line };
    });
    const lastOwn = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    const options = [];
    let hasExit = false;
    for (const [, number, optionCell, tagCell, responseCell, stateCell] of rows) {
      const route = ROUTE[`${id}:${number}`] ?? {};
      const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
      if (!tagged) throw new Error(`doc 04: ${id} option ${number} has no tag`);
      const option = { id: `${SPEAKER}${number}`, tag: tagged[1] };
      const optionText = quoted(optionCell)[0];
      if (tagged[1] === 'EXIT') {
        hasExit = true;
        option.text = optionText ?? POOL[poolIndex % POOL.length];
        if (!optionText) { option.universal = true; poolIndex += 1; }
        option.ends = true;
      } else {
        if (!optionText) throw new Error(`doc 04: ${id} option ${number} has no option text`);
        option.text = optionText;
      }
      if (tagged[2]) option.afterUse = tagged[2];
      const follows = afterIds(tagCell, SPEAKER);
      if (follows) option.after = follows;
      const ORDINALS = { second: 2, third: 3 };
      const [replyCell] = responseCell.split('→');
      const pieces = replyCell.split(/\*\((second|third)\)\*/);
      const first = spokenIn(pieces[0], SPEAKER);
      for (const d of first.staging) unplayed.push(`${id} option ${number} staging: ${d}`);
      const lines = [...first.lines, ...(route.then ?? [])];
      if (lines.length === 1 && lines[0].speaker === SPEAKER) option.say = lines[0].line;
      else if (lines.length) option.exchange = lines;
      else throw new Error(`doc 04: ${id} option ${number} has no reply`);
      for (let k = 1; k < pieces.length; k += 2) {
        const later = spokenIn(pieces[k + 1] ?? '', SPEAKER);
        for (const d of later.staging) unplayed.push(`${id} option ${number} selection ${ORDINALS[pieces[k]]} staging: ${d}`);
        if (later.lines.length) (option.repeats ??= []).push({ selection: ORDINALS[pieces[k]], say: later.lines.map((l) => l.line).join(' ') });
      }
      const state = `${stateCell ?? ''} ${responseCell.split('→').slice(1).join(' ')}`;
      const counter = /`([A-Z_0-9]+)` \+1/.exec(state);
      const sets = [...state.matchAll(/sets `([A-Z_0-9]+)`/g)].map((m) => m[1]);
      const set = { ...Object.fromEntries(sets.map((f) => [f, true])), ...(route.set ?? {}) };
      if (Object.keys(set).length) option.set = set;
      if (counter) option.add = { [counter[1]]: 1 };
      // Gates (errata 172): `req FLAG` while it holds, `unless FLAG` while it does not.
      const reqFlag = /req `([A-Z_0-9]+)`/.exec(state);
      const unlessFlag = /unless `([A-Z_0-9]+)`/.exec(state);
      if (reqFlag) option.when = { ...option.when, [reqFlag[1]]: true };
      if (unlessFlag) option.when = { ...option.when, [unlessFlag[1]]: false };
      if (route.when) option.when = { ...option.when, ...route.when };
      if (route.goto) option.goto = route.goto;
      if (route.gives) option.gives = route.gives;
      if (route.puzzle) option.puzzle = route.puzzle;
      if (route.ends) option.ends = true;
      if (route.retain) { option.afterUse = 'retain'; option.tag = 'TOPIC'; }
      if (route.repeat) option.repeat = route.repeat;
      options.push(option);
    }
    if (!hasExit) {
      const exit = { id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[poolIndex % POOL.length], universal: true, ends: true };
      if (EXIT_SAY[id]) exit.say = EXIT_SAY[id];
      options.push(exit);
      poolIndex += 1;
    }
    nodes[id] = { id, ...(lastOwn ? { prompt: lastOwn.line } : { noPrompt: true,
      exceptionReason: 'Doc 04 writes this node as a table only.' }),
      ...(opening.length ? { opening } : {}), options };
  }
  for (const want of ['FAN_A0', 'FAN_A1', 'FAN_A2', 'FAN_B1', 'FAN_B2', 'FAN_C1']) {
    if (!nodes[want]) throw new Error(`doc 04: ${want} was not extracted`);
  }
  for (const note of unplayed) process.stderr.write(`  doc 04 FANSHAWE: ${note}\n`);
  return write('content/dialogue/fanshawe.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'FANSHAWE',
    speaker: SPEAKER,
    name: 'COLONEL ABSALOM FANSHAWE',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (COLONEL ABSALOM FANSHAWE) and docs/57-puzzle-completion.md (A10, E0b) '
      + 'by tools/extract-content.mjs. Do not edit: change the documents and re-run. Plain quotes in a reply are '
      + 'Fanshawe\'s, italic quotes Thad\'s. Universal exit lines are doc 04 part one\'s pool.',
    entries: ENTRY.map(([node, when]) => ({ when, node })),
    start: 'FAN_A0',
    nodes,
  });
}

/**
 * THE ACT CARDS AFTER THE OPENING (errata 84 C). Doc 57 names each act turn's
 * card in bold: A10's "the act card, **PART TWO — ...**" (doc 48 S1 beat 5)
 * and E0b's "the act card, **PART THREE — ...**". Keyed by the ACT value the
 * turn sets; the engine shows a card when ACT rises to its number in play.
 */
/**
 * HOW AN ACT OPENS, where doc 57 says it opens somewhere: "**Act IV opens in
 * Room 19, morning**, ..." and the line under it. Errata 101 B: after the
 * act's card the game cuts to that room and Thad says the line, once. The
 * room is named by number in the doc and found by the room's own annotation.
 *
 * `due` is the flag the act turn writes with ACT (doc 48 S4 beat 3's way out,
 * hobTree below) and the opening clears: a save taken between the two still
 * owes the opening, and a fixture that merely starts in the act does not.
 */
const ROMAN = { II: 2, III: 3, IV: 4 };
function actOpenings() {
  const d57 = read('docs/57-puzzle-completion.md');
  const out = {};
  for (const m of d57.matchAll(/^\*\*Act ([IV]+) opens in Room (\d+)[^*]*\*\*[^\n]*\n\n> "(.+?)"$/gm)) {
    const act = ROMAN[m[1]];
    if (!act) throw new Error(`doc 57: an opening for Act ${m[1]}, which is not an act turn`);
    const annotation = `reference/room-${m[2].padStart(2, '0')}/annotation.json`;
    const room = JSON.parse(read(annotation)).room;
    if (!room) throw new Error(`doc 57: Act ${m[1]} opens in Room ${m[2]}, and ${annotation} names no room`);
    out[act] = { room, say: [m[3]], due: `T_ACT_${m[1]}_OPENING` };
  }
  return out;
}

function actCards() {
  const d57 = read('docs/57-puzzle-completion.md');
  const cards = {};
  // E10 writes its card as "then **PART FOUR -- ...**, and `ACT` = 4" (errata 94 E).
  for (const m of d57.matchAll(/(?:the act card,|then) \*\*(PART [A-Z]+ — [^*]+)\*\*, and `ACT` = (\d)/g)) cards[m[2]] = m[1];
  if (!cards['2'] || !cards['3'] || !cards['4']) throw new Error('doc 57: the act cards for ACT 2, 3 and 4 were not found');
  const openings = actOpenings();
  if (!openings[4]) throw new Error('doc 57: "Act IV opens in Room 19" was not found');
  return write('content/act-cards.json', {
    schema: 1,
    note: 'EXTRACTED from docs/57-puzzle-completion.md (A10, E0b, E10) by tools/extract-content.mjs. The card shown when '
      + 'ACT rises to the key in play; and, where doc 57 says an act opens in a room, that opening (errata 101 B): '
      + 'once the card is down he is in `room` and says `say`, while `due` holds, and the opening clears it.',
    cards,
    openings,
  });
}

/**
 * DOC 23'S ACT I STORE ITEMS: THE PICKLED EGGS and DR. PURVIS'S TONIC (Room
 * 12, errata 85). Doc 23's other Act I items were transcribed into
 * content/items by hand before this extractor existed; these two were written
 * later (doc 57) and are extracted, in the same grammar actTwoItems reads.
 */
function storeItems() {
  const doc = read('docs/23-inventory-act1.md');
  const body = doc.slice(0, doc.indexOf('## Act II items'));
  const out = [];
  for (const want of ['eggs', 'tonic', 'blanket']) {
    const row = new RegExp(`^\\| ${want} \\| (.+?) \\| (.+?) \\|$`, 'm').exec(body);
    if (!row) throw new Error(`doc 23: no table row for ${want}`);
    const [, fullName, display] = row;
    const heading = new RegExp(`^## ${display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n([\\s\\S]*?)(?=^## |^---)`, 'm');
    const section = heading.exec(body);
    if (!section) throw new Error(`doc 23: no section for ${display}`);
    const responses = {};
    for (const [verb, label] of [['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
      const line = new RegExp(`^\\*\\*${label}\\*\\* (.+)$`, 'm').exec(section[1]);
      if (!line) throw new Error(`doc 23: ${display} has no ${label} run`);
      const lines = [...line[1].matchAll(/\d "([^"]+)"/g)].map((m) => m[1]);
      if (lines.length !== 3) throw new Error(`doc 23: ${display} ${label} has ${lines.length} lines, not 3`);
      responses[verb] = [{ say: lines[0], repeat: lines.slice(1) }];
    }
    const acquired = /^\*(.+)\*$/m.exec(section[1])?.[1] ?? '';
    out.push(write(`content/items/${want}.json`, {
      schema: 1,
      id: want,
      name: fullName,
      short: display,
      note: `EXTRACTED from docs/23-inventory-act1.md (Act I items) by tools/extract-content.mjs. Do not edit: change doc 23 and re-run. ${acquired}`,
      responses,
    }));
  }
  return out;
}

/**
 * DOC 04, THE UNDERTAKER'S ACT III NODE, UND_C1 (errata 86 D): the coffin
 * fitting, "grown to a node in Batch C". Doc 57 E3 routes it: open once E2 is
 * done (`T_NEED_TO_DIE`), and option 1 sizes the coffin (`T_COFFIN_SIZED`).
 * Doc 04 writes the node as a table only, so it has no prompt; a universal
 * exit from doc 04's pool closes it. Every string is the document's.
 */
function undertakerActThree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('## THE UNDERTAKER — two nodes');
  const to = doc.indexOf('\n---', from);
  if (from < 0 || to < 0) throw new Error('doc 04: no UNDERTAKER section');
  const body = doc.slice(doc.indexOf('**`UND_C1`', from), to);
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const options = [];
  for (const [, number, optionCell, tagCell, responseCell] of body.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)) {
    const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
    const text = quoted(optionCell)[0];
    // ASKED AGAIN (errata 174): *(second)* "..." is his answer to the same question twice.
    const [firstCell, againCell] = responseCell.split('*(second)*');
    const said = spokenIn(firstCell, 'undertaker');
    if (!tag || !text || said.lines.length !== 1) throw new Error(`doc 04 UND_C1: option ${number} does not read`);
    for (const d of said.staging) process.stderr.write(`  doc 04 UND_C1 option ${number} staging: ${d}\n`);
    const again = againCell ? spokenIn(againCell, 'undertaker').lines[0]?.line : undefined;
    options.push({ id: `undertaker_c${number}`, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text,
      say: said.lines[0].line, ...(again ? { repeats: [{ selection: 2, say: again }] } : {}),
      ...(number === '1' ? { set: { T_COFFIN_SIZED: true } } : {}) });
  }
  if (options.length !== 3) throw new Error(`doc 04 UND_C1: ${options.length} options, not 3`);
  options.push({ id: 'undertaker_cx', tag: 'EXIT', text: POOL[0], universal: true, ends: true });
  return {
    node: { id: 'UND_C1', noPrompt: true, exceptionReason: 'Doc 04 writes UND_C1 as a table only.', options },
    entries: [{ when: { T_NEED_TO_DIE: true }, node: 'UND_C1' }],
  };
}

/**
 * DOC 04, THE LIVERY MAN: Room 15's tree, LIV_A1 (errata 75, 88 E). One node,
 * a table only. Routing, as doc 57 writes it: option 1 is Grievance's refusal
 * (B2 begins); 6, the man she moved for, sets `T_GRIEVANCE_MOTT` and is B2;
 * 4, the tune, waits for it ("req") and sets `T_HUM_HEARD`; 5 lends THE LIVERY
 * BLANKET (doc 23) and marks it borrowed (`T_BLANKET_BORROWED`, so the bin is
 * drawn without it until A5 brings it back); 7 is pair 20. A universal exit
 * from doc 04's pool closes it. Every string is the document's.
 */
function liveryTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('## THE LIVERY MAN');
  const to = doc.indexOf('\n## ', from + 5);
  if (from < 0 || to < 0) throw new Error('doc 04: no LIVERY MAN section');
  const body = doc.slice(from, to);
  const SPEAKER = 'livery_man';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const ROUTE = {
    // Errata 245 (doc 117 O-5): he gives leave; Thad takes it off her himself (Room 15's hotspot).
    5: { set: { T_BLANKET_ALLOWED: true } },
    // Errata 278 (doc 125): he goes back to humming, which is what LISTEN then hears. The row's last direction is kept.
    6: { puzzle: { B2: 'complete' }, trailingDirection: true },
    7: { set: { ASSAY_PAIR_20: true } },
  };
  const options = [];
  for (const [, number, optionCell, tagCell, responseCell] of body.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)) {
    const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
    const text = quoted(optionCell)[0];
    const [replied, ...rest] = responseCell.split('→');
    // ASKED AGAIN (errata 172): *(second)* "..." is the answer to the same question twice.
    const [reply, againCell] = replied.split('*(second)*');
    const said = spokenIn(reply.replace(/\*\([^)]*\)\*/g, ''), SPEAKER);
    for (const d of spokenIn(responseCell, SPEAKER).staging) process.stderr.write(`  doc 04 LIV_A1 option ${number} staging: ${d}\n`);
    if (!tag || !text || !said.lines.length) throw new Error(`doc 04 LIV_A1: option ${number} does not read`);
    const state = rest.join(' ');
    const option = { id: `${SPEAKER}${number}`, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text };
    const route0 = ROUTE[number] ?? {};
    const trailing = route0.trailingDirection ? [...reply.matchAll(/\*\(([^)]*)\)\*/g)].map((m) => m[1]).filter((d) => d !== 'beat').pop() : undefined;
    const spokenLines = trailing ? [...said.lines, { speaker: SPEAKER, line: trailing, direction: true }] : said.lines;
    if (spokenLines.length === 1 && spokenLines[0].speaker === SPEAKER) option.say = spokenLines[0].line;
    else option.exchange = spokenLines;
    const flags = [...state.matchAll(/`([A-Z_0-9]+)`/g)].map((m) => m[1])
      .filter((f) => (!/req `/.test(state) || !state.includes(`req \`${f}\``)) && !state.includes(`unless \`${f}\``));
    const again = againCell ? /"([^"]+)"/.exec(againCell)?.[1] : undefined;
    if (again) option.repeat = again;
    const req = /req `([A-Z_0-9]+)`/.exec(state);
    const route = ROUTE[number] ?? {};
    const set = { ...Object.fromEntries(flags.map((f) => [f, true])), ...(route.set ?? {}) };
    if (Object.keys(set).length) option.set = set;
    if (req) option.when = { [req[1]]: true };
    const unlessFlag = /unless `([A-Z_0-9]+)`/.exec(state);
    if (unlessFlag) option.when = { ...option.when, [unlessFlag[1]]: false };
    if (route.gives) option.gives = route.gives;
    if (route.puzzle) option.puzzle = route.puzzle;
    options.push(option);
  }
  if (options.length < 7) throw new Error(`doc 04 LIV_A1: ${options.length} options, fewer than 7`);
  options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[1 % POOL.length], universal: true, ends: true });
  return write('content/dialogue/livery-man.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'LIVERY_MAN',
    speaker: SPEAKER,
    name: 'THE LIVERY MAN',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (THE LIVERY MAN) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a reply are his, italic quotes Thad\'s. '
      + 'The universal exit line is doc 04 part one\'s pool.',
    entries: [],
    start: 'LIV_A1',
    nodes: { LIV_A1: { id: 'LIV_A1', noPrompt: true, exceptionReason: 'Doc 04 writes LIV_A1 as a table only.', options } },
  });
}

/**
 * DOC 04, MADAME OZYMANDIA: Room 16's tree, OZY_A1 (errata 75, 89 E). Routing,
 * as doc 57 A7 writes it: option 1 waits for `T_SURVEY_NEEDED` (Sump's refusal,
 * A6) and names her price, which the filing fee then answers (`T_OZY_ASKED`);
 * 5 is pair 19. Option 4 plants the Act IV corroboration, which doc 04 says is
 * "never mentioned again", so it sets nothing. A universal exit from doc 04's
 * pool closes it. Every string is the document's.
 */
/**
 * DOC 109, G1 · THE ROD, HIRED: a new OZY_A1 row, `| 9 | "option" | [TAG · aftermath] | response |`, read from doc 109
 * (it moves to doc 04 when the trip is built). The response is her offer, then `*(with two dollars:)*` and
 * `*(without:)*`: two options, one held while he carries the two dollars the piano pays (THE FILING FEE, A8, which can
 * be earned again; doc 109: "Thad pays with two dollars from the Nugget's piano"), which takes them and gives THE
 * BRASS ROD (G1), and one while he does not. `*(req ACT ≥ 2)*` is from Act II.
 */
function rodHired(speaker) {
  const doc = read('docs/109-fiddlers-gulch-lines.md');
  const at = doc.indexOf('\n### G1 · THE ROD, HIRED');
  if (at < 0) throw new Error('doc 109: no "### G1 · THE ROD, HIRED"');
  const body = doc.slice(at, doc.indexOf('\n### ', at + 5));
  const row = /^\| (\d+) \| (.+?) \| (.+?) \| (.+) \|$/m.exec(body.split('\n').filter((line) => /^\| \d/.test(line)).join('\n'));
  if (!row) throw new Error('doc 109 G1: no table row');
  const [, n, optionCell, tagCell, response] = row;
  const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
  const text = quoted(optionCell)[0];
  const act = /\*\(req ACT ≥ (\d)\)\*/.exec(response);
  if (!tag || !text || !act) throw new Error('doc 109 G1: the row does not read (tag, text or req ACT)');
  const [head, rest] = response.split('*(with two dollars:)*');
  const [withPart, withoutPart] = (rest ?? '').split('*(without:)*');
  if (!withPart || !withoutPart) throw new Error('doc 109 G1: no "with two dollars" and "without" answers');
  if (!/→ THE BRASS ROD/.test(withPart)) throw new Error('doc 109 G1: the paid answer no longer gives THE BRASS ROD');
  const said = (part) => gulchSpoken(part.split('→')[0].replace(act[0], ''), speaker).map((one) => ({ ...one, line: plain(one.line) }));
  const offer = said(head);
  const when = { ACT: { atLeast: Number(act[1]) } };
  return [
    { id: `${speaker}${n}`, tag: tag[1], afterUse: tag[2] ?? 'remove', text, when, holds: ['filing_fee'],
      exchange: [...offer, ...said(withPart)], takes: ['filing_fee'], gives: ['brass_rod'], set: { T_ROD_HIRED: true },
      puzzle: { G1: 'complete' } },
    // Asked again without the money (errata 172: a question asked again is not answered word for word): her offer is
    // made, so she says only the refusal -- doc 109's own words, the part of the answer that is still news.
    { id: `${speaker}${n}_unpaid`, tag: tag[1], afterUse: 'retain', text, when: { ...when, T_ROD_HIRED: false }, lacks: ['filing_fee'],
      exchange: [...offer, ...said(withoutPart)], repeat: said(withoutPart).map((one) => one.line).join(' ') },
  ];
}

function ozymandiaTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# MADAME OZYMANDIA');
  const to = doc.indexOf('\n---', from);
  if (from < 0 || to < 0) throw new Error('doc 04: no MADAME OZYMANDIA section');
  const body = doc.slice(from, to);
  const SPEAKER = 'ozymandia';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const prompt = /^> \*\*OZYMANDIA:\*\* "([^"]+)"/m.exec(body)?.[1];
  if (!prompt) throw new Error('doc 04 OZY_A1: no opening line');
  const ROUTE = { 1: { set: { T_OZY_ASKED: true } }, 5: { set: { ASSAY_PAIR_19: true } } };
  const options = [];
  for (const [, number, optionCell, tagCell, responseCell] of body.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)) {
    const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
    const text = quoted(optionCell)[0];
    const [replied] = responseCell.split('→');
    // ASKED AGAIN (errata 172).
    const [reply, againCell] = replied.split('*(second)*');
    const said = spokenIn(reply.replace(/\*\([^)]*\)\*/g, ''), SPEAKER);
    for (const d of spokenIn(responseCell, SPEAKER).staging) process.stderr.write(`  doc 04 OZY_A1 option ${number} staging: ${d}\n`);
    if (!tag || !text || !said.lines.length) throw new Error(`doc 04 OZY_A1: option ${number} does not read`);
    const option = { id: `${SPEAKER}${number}`, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text };
    const route0 = ROUTE[number] ?? {};
    const trailing = route0.trailingDirection ? [...reply.matchAll(/\*\(([^)]*)\)\*/g)].map((m) => m[1]).filter((d) => d !== 'beat').pop() : undefined;
    const spokenLines = trailing ? [...said.lines, { speaker: SPEAKER, line: trailing, direction: true }] : said.lines;
    if (spokenLines.length === 1 && spokenLines[0].speaker === SPEAKER) option.say = spokenLines[0].line;
    else option.exchange = spokenLines;
    const req = /req `([A-Z_0-9]+)`/.exec(responseCell);
    if (req) option.when = { [req[1]]: true };
    const unlessFlag = /unless `([A-Z_0-9]+)`/.exec(responseCell);
    if (unlessFlag) option.when = { ...option.when, [unlessFlag[1]]: false };
    if (ROUTE[number]?.set) option.set = ROUTE[number].set;
    const again = againCell ? /"([^"]+)"/.exec(againCell)?.[1] : undefined;
    if (again) option.repeat = again;
    options.push(option);
  }
  if (options.length < 5) throw new Error(`doc 04 OZY_A1: ${options.length} options, fewer than 5`);
  options.push(...rodHired(SPEAKER));
  options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[2 % POOL.length], universal: true, ends: true });
  // AT THE SÉANCE (doc 111, B; errata 237): OZY_E1, while the séance is on and he is not under the table.
  const seance = seanceOzymandiaNode(SPEAKER, POOL);
  return write('content/dialogue/ozymandia.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'OZYMANDIA',
    speaker: SPEAKER,
    name: 'MADAME OZYMANDIA',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (MADAME OZYMANDIA) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a reply are hers, italic quotes Thad\'s. '
      + 'The universal exit line is doc 04 part one\'s pool.',
    entries: [seance.entry],
    start: 'OZY_A1',
    // Her opening is spoken (errata 218): the engine voices `opening`, and a line kept only in `prompt` was never heard.
    nodes: { OZY_A1: { id: 'OZY_A1', prompt, opening: [{ speaker: SPEAKER, line: prompt }], options }, OZY_E1: seance.node },
  });
}

/**
 * DOC 04, REVEREND SOWERBY: Room 17's tree, SOW_A1 and SOW_C1 (errata 75, 90 E).
 * Routing, as doc 57 writes it: SOW_A1 5 waits for `T_FANSHAWE_FUNERALS` and
 * `T_PIKE_DEAD` and asks who speaks for the deceased (`T_SOW_FUNERAL_ASKED`,
 * which the letter answers, C3); 6 waits for `T_SHENG_TASK`, not on a funeral
 * day (D4); 7, another service, waits for the memorial and for C4 or D4 not
 * done (`whenAny`); 8 is pair 17. SOW_C1, open once E2 is done
 * (`T_NEED_TO_DIE`) until the price is set: option 1 adds four adjectives,
 * option 3 sets `T_SOWERBY_PRICE` (E3 step 1). A universal exit from doc 04's
 * pool closes each node. Every string is the document's.
 */
/**
 * DOC 04 PART THREE, THE LETTERS HOME: Room 19's one choice (errata 92 E).
 * "Each act offers three versions of the letter to his mother: honest,
 * flattering, and flattering with a number in it. The player picks freely.
 * Nothing tracks it." One node per act, I to III. Its three options are the
 * document's own names for the versions (the headings after the act); the
 * letter itself is the option's ECHO (doc 30 section 6.2), the line Thad
 * speaks for the choice, and the node closes. Act IV is "the only version
 * offered. No choice." and is not a node: `actFour` holds its four lines, which
 * THE LETTERS HOME reads in Act IV (the room's annotation, `opensTree`).
 * Nothing is set, and nothing reads a choice (invariant 10).
 */
function lettersHome() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('## The letters, written');
  const to = doc.indexOf('\n---', from);
  if (from < 0 || to < 0) throw new Error('doc 04: no letters section');
  const body = doc.slice(from, to);
  const ROMAN = { I: 1, II: 2, III: 3, IV: 4 };
  const letters = [...body.matchAll(/^\*\*ACT (I|II|III|IV) — ([^*]+)\*\*\n((?:> .*\n?)+)/gm)].map((m) => ({
    act: ROMAN[m[1]],
    version: m[2].trim().replace(/\.$/, ''),
    lines: m[3].split('\n').map((line) => line.replace(/^> ?/, '').trim()).filter(Boolean),
  }));
  if (letters.length !== 10) throw new Error(`doc 04: ${letters.length} letters, not 10`);
  const unquote = (text) => {
    if (!text.startsWith('"') || !text.endsWith('"')) throw new Error(`doc 04: a letter is not one quotation: ${text.slice(0, 40)}`);
    return text.slice(1, -1);
  };
  const nodes = {};
  const entries = [];
  for (const act of [1, 2, 3]) {
    const three = letters.filter((one) => one.act === act);
    if (three.length !== 3) throw new Error(`doc 04: Act ${act} has ${three.length} letters`);
    const id = `LETTERS_${act}`;
    nodes[id] = {
      noPrompt: true,
      exceptionReason: 'Doc 04 Part Three: a parallel choice system, three versions of one letter, not a conversation. Nobody is spoken to.',
      noComic: true,
      noComicReason: 'Doc 04 Part Three: the three versions are the choice; none is a joke option.',
      noReply: true,
      noReplyReason: 'Doc 04 Part Three: the letter is the whole of it, written in his voice; nobody answers a letter here.',
      options: three.map((one, n) => {
        if (one.lines.length !== 1) throw new Error(`doc 04: Act ${act} ${one.version} is not one paragraph`);
        return { id: `letter${act}_${n + 1}`, tag: 'TOPIC', afterUse: 'retain', text: one.version, echo: unquote(one.lines[0]), ends: true };
      }),
    };
    entries.push({ when: { ACT: act }, node: id });
  }
  const last = letters.find((one) => one.act === 4);
  const four = [...last.lines];
  if (!four[0].startsWith('"') || !four.at(-1).endsWith('"')) throw new Error('doc 04: the Act IV letter is not one quotation');
  four[0] = four[0].slice(1);
  four[four.length - 1] = four.at(-1).slice(0, -1);
  return write('content/dialogue/letters-home.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'LETTERS_HOME',
    speaker: 'thad',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (PART THREE, the letters, written) by tools/extract-content.mjs. '
      + `Do not edit: change doc 04 and re-run. Act IV is not a node: ${JSON.stringify(last.version)}.`,
    actFour: four,
    entries,
    start: 'LETTERS_1',
    nodes,
  });
}

/**
 * DOC 04's RAC_A1: the raccoon's naming (errata 68 A, errata 96 E). "Opened by
 * the first TALK TO the raccoon. The raccoon does not speak; every response is
 * Thad's." Options 1-3 name him -- `T_RACCOON_NAMED`, and `RACCOON_NAME` 1-3,
 * which the hotspot and the figure read for the display name the row gives --
 * and close the node; option 4 is the [COMIC] refusal. An italic bracket
 * before a line is a beat, not spoken. Doc 04's universal exit pool gives the
 * way out, as Hob's tree does.
 */
function raccoonTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const at = doc.indexOf('## `RAC_A1`');
  if (at < 0) throw new Error('doc 04: no RAC_A1');
  const body = doc.slice(at, doc.indexOf('\n# ', at));
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)]
    .map((m) => m[1]);
  const opening = [...body.matchAll(/^> \*\*THAD:\*\* (.+)$/gm)].map((m) => ({ speaker: 'thad', line: quoted(m[1])[0] }));
  if (opening.length !== 1 || !opening[0].line) throw new Error('doc 04 RAC_A1: no opening line');
  const ROW = /^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm;
  const options = [];
  for (const [, number, optionCell, tagCell, responseCell] of body.matchAll(ROW)) {
    const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
    if (!tagged) throw new Error(`doc 04 RAC_A1 option ${number}: no tag`);
    const [spoken, state = ''] = responseCell.split('→');
    const lines = quoted(spoken.replace(/\*\([^)]*\)\*/g, '')).map((line) => plain(line));
    if (lines.length !== 1) throw new Error(`doc 04 RAC_A1 option ${number}: ${lines.length} lines`);
    const option = { id: `raccoon${number}`, tag: tagged[1], text: plain(quoted(optionCell)[0]), say: lines[0] };
    if (tagged[2]) option.afterUse = tagged[2];
    const named = /`T_RACCOON_NAMED`, display name ([A-Z]+)/.exec(state);
    if (named) {
      option.set = { T_RACCOON_NAMED: true, RACCOON_NAME: Number(number) };
      option.ends = true;
      option.displayName = named[1];
    }
    options.push(option);
  }
  if (options.length !== 4) throw new Error(`doc 04 RAC_A1: ${options.length} options`);
  options.push({ id: 'raccoonx', tag: 'EXIT', text: POOL[3 % POOL.length], universal: true, ends: true });
  return write('content/dialogue/raccoon.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'RACCOON',
    speaker: 'thad',
    name: 'THE RACCOON',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (RAC_A1) by tools/extract-content.mjs. Do not edit: change doc 04 and re-run. '
      + 'The raccoon does not speak: every line is Thad\'s. `displayName` on a naming option is the row\'s display name, '
      + 'read by the room (errata 96 E).',
    start: 'RAC_A1',
    nodes: { RAC_A1: { id: 'RAC_A1', noPrompt: true,
      exceptionReason: 'Doc 04 RAC_A1: the raccoon does not speak, and the opening is Thad\'s own line.',
      opening, options } },
  });
}

/**
 * DOC 04, NICKEL PRATT: Room 25's tree and Room 23's encounter (errata 97).
 *
 * Two files, one man. `pratt.json` is his own claim: PRA_A1 in Act I ("next
 * door", the first meeting, A5's "send Pratt"), PRA_B1 from Act II, PRA_D6
 * once he has turned. PRA_D5 is the turn itself -- no options, "arithmetic,
 * done out loud, slowly" -- so it is the exchange PRA_B1 option 7 plays, and
 * the conversation goes on to PRA_D6 (doc 57 D5: "PRA_D6 follows").
 * `pratt-jump.json` is PRA_D2, played as Thad arrives on Prosperity in Act II
 * (doc 57 D2). Both close on doc 04's offer run: "Every single conversation,
 * regardless of topic, ends with Pratt making an offer. It never stops."
 *
 * Routing that doc 04 states in prose rather than a backticked flag is the
 * table below, each row citing the line it reads: A1 1 is offered only while
 * the raccoon is in the hole (errata 75); D2 1 "D2 opens"; B1 7 sets
 * T_PRATT_TURNED and completes D5 (doc 57 D5); D6 5 sets the attestation in
 * motion for Room 7 (doc 57 D6). Plain quotes are his, italic quotes Thad's;
 * the italic stage directions are logged and not drawn, as in every tree.
 */
function prattTree() {
  const sparringNodes = [];
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# NICKEL PRATT');
  const to = doc.indexOf('\n# ', from + 5);
  if (from < 0 || to < 0) throw new Error('doc 04: no NICKEL PRATT section');
  const body = doc.slice(from, to);
  const SPEAKER = 'pratt';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const offerLine = body.slice(body.indexOf('## The offer')).split('\n').find((line) => line.startsWith('> "'));
  if (!offerLine) throw new Error('doc 04 PRATT: no offer run');
  const offers = offerLine.slice(2).split(' · ').map((one) => quoted(one));
  if (offers.length !== 6 || offers.some((one) => !one.length)) throw new Error(`doc 04 PRATT: ${offers.length} offers, not 6`);
  const closing = { lines: offers, counter: 'PRATT_OFFERS' };
  const section = (head) => {
    const at = body.indexOf(head);
    if (at < 0) throw new Error(`doc 04 PRATT: no "${head}"`);
    return body.slice(at, body.indexOf('\n## ', at + 5) < 0 ? undefined : body.indexOf('\n## ', at + 5));
  };
  const speakerOf = (name) => (name === 'THAD' ? 'thad' : SPEAKER);
  const script = (text) => [...text.matchAll(/^> \*\*([A-Z]+):\*\* (.+)$/gm)].map((m) => {
    const said = quoted(m[2].replace(/\*\([^)]*\)\*/g, ''));
    if (said.length !== 1) throw new Error(`doc 04 PRATT: "${m[2]}" is not one line`);
    return { speaker: speakerOf(m[1]), line: said[0] };
  });
  const ROUTE = {
    'PRA_A1 1': { when: { T_WARM_HOLE: false } },
    'PRA_D2 1': { set: { T_PRATT_STAKE: true }, puzzle: { D2: 'pending' } },
    'PRA_B1 6': { puzzle: { D2: 'complete' } },
    'PRA_B1 7': { set: { T_PRATT_TURNED: true }, puzzle: { D5: 'complete' }, goto: 'PRA_D6', script: '## `PRA_D5`' },
    'PRA_D6 5': { set: { T_PRATT_SWEARS: true } },
  };
  const node = (id, head, exitIndex) => {
    const text = section(head);
    const options = [];
    for (const [, number, optionCell, tagCell, responseCell] of text.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)) {
      const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
      const optionText = quoted(optionCell)[0];
      for (const d of spokenIn(responseCell, SPEAKER).staging) process.stderr.write(`  doc 04 ${id} option ${number} staging: ${d}\n`);
      // ASKED AGAIN (errata 172): *(second)* "..." is his answer to the same question twice.
      const [firstCell, againCell] = responseCell.split('*(second)*');
      const bare = firstCell.replace(/\*\([^)]*\)\*/g, '');
      const [reply, ...rest] = bare.split('→');
      let said = spokenIn(reply, SPEAKER).lines;
      if (!said.length) said = spokenIn(rest.join('→'), SPEAKER).lines.slice(0, 1);
      const route = ROUTE[`${id} ${number}`] ?? {};
      if (route.script) said = script(section(route.script).split('He signs.')[0]).concat(script(section(route.script).split('He signs.')[1] ?? ''));
      if (!tag || !optionText || !said.length) throw new Error(`doc 04 ${id}: option ${number} does not read`);
      const option = { id: `${SPEAKER}${number}`, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text: plain(optionText) };
      if (said.length === 1 && said[0].speaker === SPEAKER) option.say = said[0].line;
      else option.exchange = said;
      const after = afterIds(tagCell, SPEAKER);
      if (after) option.after = after;
      const reqs = [...responseCell.matchAll(/req `([A-Z_0-9]+)`/g)].map((m) => m[1]);
      const unlesses = [...responseCell.matchAll(/unless `([A-Z_0-9]+)`/g)].map((m) => m[1]);
      const sets = [...rest.join('→').matchAll(/`([A-Z_0-9]+)`/g)].map((m) => m[1]).filter((flag) => !reqs.includes(flag) && !unlesses.includes(flag));
      const when = { ...Object.fromEntries(reqs.map((flag) => [flag, true])), ...Object.fromEntries(unlesses.map((flag) => [flag, false])), ...(route.when ?? {}) };
      const again = againCell ? /"([^"]+)"/.exec(againCell)?.[1] : undefined;
      if (again) option.repeat = again;
      if (Object.keys(when).length) option.when = when;
      const set = { ...Object.fromEntries(sets.map((flag) => [flag, true])), ...(route.set ?? {}) };
      if (Object.keys(set).length) option.set = set;
      if (route.puzzle) option.puzzle = route.puzzle;
      if (route.goto) option.goto = route.goto;
      // THE SPARRING (doc 57 D5): PRA_D6's teaching row, doc 03's exchange and pairs.
      if (tag[1] === 'ASSAY' && /\bpairs? \d/.test(responseCell)) {
        option.backTo = id;
        teachingRow(option, responseCell, { teacher: 'Pratt', owner: SPEAKER, sparring: 'Pratt' });
        sparringNodes.push(option.sparringNode);
        delete option.sparringNode;
      }
      options.push(option);
    }
    if (!options.length) throw new Error(`doc 04 ${id}: no options`);
    options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[exitIndex % POOL.length], universal: true, ends: true });
    const opening = script(text.split('\n| #')[0]);
    return { id, noPrompt: true, exceptionReason: `Doc 04 writes ${id} as a table only.`, ...(opening.length ? { opening } : {}), options };
  };
  const A1 = node('PRA_A1', '## `PRA_A1`', 4);
  const B1 = node('PRA_B1', '## Root: `PRA_B1`', 4);
  const D6 = node('PRA_D6', '## `PRA_D6`', 4);
  const D2 = { ...node('PRA_D2', '## `PRA_D2`', 4), openingOnce: 'T_PRATT_JUMP_HEARD' };
  // THE ESTATE SALE (doc 111, C; errata 237): PRA_E3, at his claim after E3.1, until the sale.
  const E3 = estateSalePrattNode(SPEAKER, POOL);
  const counts = { PRA_A1: A1.options.length, PRA_B1: B1.options.length, PRA_D6: D6.options.length, PRA_D2: D2.options.length };
  if (counts.PRA_A1 !== 7 || counts.PRA_B1 !== 8 || counts.PRA_D6 !== 6 || counts.PRA_D2 !== 4) throw new Error(`doc 04 PRATT: option counts ${JSON.stringify(counts)}`);
  const note = 'EXTRACTED from docs/04-dialogue-trees.md (NICKEL PRATT) by tools/extract-content.mjs. Do not edit: change doc 04 and re-run. '
    + 'Plain quotes in a reply are his, italic quotes Thad\'s. `closing` is doc 04\'s offer run, "It never stops" (errata 97).';
  return [
    write('content/dialogue/pratt.json', {
      aftermathAuthored: true, schema: 1, id: 'PRATT', speaker: SPEAKER, name: 'NICKEL PRATT', note,
      entries: [E3.entry, { when: { T_PRATT_TURNED: true }, node: 'PRA_D6' }, { when: { ACT: { atLeast: 2 } }, node: 'PRA_B1' }],
      start: 'PRA_A1', closing, nodes: { PRA_A1: A1, PRA_B1: B1, PRA_D6: D6, PRA_E3: E3.node,
        // The practice node PRA_D6's teaching row opens (errata 243), with the pool's way out.
        ...Object.fromEntries(sparringNodes.map((spar) => [spar.id, { ...spar, options: [...spar.options, { id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[0], universal: true, ends: true }] }])) },
    }),
    write('content/dialogue/pratt-jump.json', {
      aftermathAuthored: true, schema: 1, id: 'PRATT_JUMP', speaker: SPEAKER, name: 'NICKEL PRATT', note,
      // HE STAYS ON THE CLAIM UNTIL HE IS TURNED (errata 244; doc 114 II-2, doc 115). PRA_D2 option 1 used to send him
      // home; now everything doc 04 has him say in Act II before the turn is said standing on Prosperity. PRA_B1 is
      // doc 04's own node, word for word; its turning row no longer walks the conversation on to PRA_D6, because that
      // node is said at his own claim, where he goes once he is turned.
      entries: [{ when: { T_PRATT_STAKE: true }, node: 'PRA_B1' }],
      start: 'PRA_D2', closing, nodes: { PRA_D2: D2, PRA_B1: { ...B1, options: B1.options.map((option) => (option.goto === 'PRA_D6' ? toldTheFigure(option) : option)) } },
    }),
  ];
}

/**
 * DOC 04, AH-LAM SHENG: Room 28's tree (errata 99 D).
 *
 * SHE_A1 is his root; SHE_D1, "the paper", opens on the business it is for and
 * only while that business is open, so A1's options -- pair 18 among them --
 * are never lost: from holding the paper (A1 option 1) until the Thursday
 * ledger is read (D4), and in Act III until the loan is taken (E3). Doc 57 D3
 * and D4 route it: D1 option 1 is Sheng's terms (D3, T_SHENG_TASK); 1-prime
 * needs THE LINEN MONEY and reads the ledger (D4, T_PRATT_TRAIL); option 2,
 * after it and once Thad needs to die, gives SHENG'S LOAN. A1 option 4 counts
 * a war contradiction; 5 is counted-repeat, its (second) and (third) the
 * repeats; 6 is pair 18. Plain quotes are his; staging is logged, not drawn.
 */
function shengTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# AH-LAM SHENG');
  const to = doc.indexOf('\n# ', from + 5);
  if (from < 0 || to < 0) throw new Error('doc 04: no AH-LAM SHENG section');
  const body = doc.slice(from, to);
  const SPEAKER = 'sheng';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const section = (head) => {
    const at = body.indexOf(head);
    if (at < 0) throw new Error(`doc 04 SHENG: no "${head}"`);
    const end = body.indexOf('\n## ', at + 5);
    return body.slice(at, end < 0 ? undefined : end);
  };
  const ROUTE = {
    'SHE_A1 1': { set: { T_SHENG_HOLDS_PAPER: true }, goto: 'SHE_D1' },
    'SHE_A1 4': { add: { WAR_CONTRADICTIONS: 1 } },
    'SHE_A1 6': { set: { ASSAY_PAIR_18: true } },
    'SHE_D1 1': { set: { T_SHENG_TASK: true }, puzzle: { D3: 'complete' } },
    "SHE_D1 1′": { holds: ['linen_money'], when: { T_SHENG_TASK: true }, set: { T_PRATT_TRAIL: true }, puzzle: { D4: 'complete' } },
    'SHE_D1 2': { when: { T_NEED_TO_DIE: true, T_PRATT_TRAIL: true }, gives: ['loan'], set: { T_SHENG_LOAN: true } },
  };
  const script = (text) => [...text.matchAll(/^> \*\*([A-Z]+):\*\* (.+)$/gm)].map((m) => ({
    speaker: m[1] === 'THAD' ? 'thad' : SPEAKER, line: quoted(m[2].replace(/\*\([^)]*\)\*/g, ''))[0] }));
  const node = (id, head, exitIndex) => {
    const text = section(head);
    const options = [];
    for (const m of text.matchAll(/^\| (\d+′?) \| (.+?) \| (.+?) \| (.+?) \|(?: (.+?) \|)?$/gm)) {
      const [, number, optionCell, tagCell, responseCell] = m;
      const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
      const optionText = quoted(optionCell)[0];
      for (const d of spokenIn(responseCell, SPEAKER).staging) process.stderr.write(`  doc 04 ${id} option ${number} staging: ${d}\n`);
      const route = ROUTE[`${id} ${number}`] ?? {};
      const optId = `${SPEAKER}${number.replace('′', 'a')}`;
      const option = { id: optId, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text: plain(optionText) };
      let said = spokenIn(responseCell.replace(/\*\([^)]*\)\*/g, '').split('→')[0], SPEAKER).lines;
      if (tag[2] === 'counted-repeat') {
        const parts = responseCell.split(/\*\((?:second|third)\)\*/);
        option.say = quoted(parts[0])[0];
        option.repeats = parts.slice(1).map((part, i) => ({ selection: i + 2, say: quoted(part)[0] }));
      } else {
        // ASKED AGAIN (errata 172): *(second)* "..." on any other row.
        const [firstCell, againCell] = responseCell.split('*(second)*');
        said = spokenIn(firstCell.replace(/\*\([^)]*\)\*/g, '').split('→')[0], SPEAKER).lines;
        if (said.length === 1 && said[0].speaker === SPEAKER) option.say = said[0].line;
        else option.exchange = said;
        const again = againCell ? /"([^"]+)"/.exec(againCell)?.[1] : undefined;
        if (again) option.repeat = again;
      }
      if (!tag || !optionText || !(option.say || option.exchange?.length)) throw new Error(`doc 04 ${id}: option ${number} does not read`);
      const reqs = [...responseCell.matchAll(/req `([A-Z_0-9]+)`/g)].map((r) => r[1]);
      const unlesses = [...responseCell.matchAll(/unless `([A-Z_0-9]+)`/g)].map((r) => r[1]);
      const when = { ...Object.fromEntries(reqs.map((flag) => [flag, true])), ...Object.fromEntries(unlesses.map((flag) => [flag, false])), ...(route.when ?? {}) };
      if (Object.keys(when).length) option.when = when;
      if (route.set) option.set = route.set;
      if (route.add) option.add = route.add;
      if (route.holds) option.holds = route.holds;
      const follows = afterIds(tagCell, SPEAKER);
      if (route.after || follows) option.after = route.after ?? follows;
      if (route.gives) option.gives = route.gives;
      if (route.puzzle) option.puzzle = route.puzzle;
      if (route.goto) option.goto = route.goto;
      options.push(option);
    }
    options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[exitIndex % POOL.length], universal: true, ends: true });
    const opening = script(text.split('\n| #')[0]);
    return { id, noPrompt: true, exceptionReason: `Doc 04 writes ${id} as a table only.`, ...(opening.length ? { opening, openingOnce: 'T_SHENG_PAPER_HEARD' } : {}), options };
  };
  const A1 = node('SHE_A1', '## Root: `SHE_A1`', 2);
  const D1 = node('SHE_D1', '## `SHE_D1`', 2);
  if (A1.options.length < 7 || D1.options.length !== 7) throw new Error(`doc 04 SHENG: ${A1.options.length} and ${D1.options.length} options`);
  return write('content/dialogue/sheng.json', {
    aftermathAuthored: true, schema: 1, id: 'SHENG', speaker: SPEAKER, name: 'AH-LAM SHENG',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (AH-LAM SHENG) by tools/extract-content.mjs. Do not edit: change doc 04 and re-run. '
      + 'SHE_D1 opens only while its business is open, so SHE_A1\'s options are never lost (errata 99 D).',
    // THE LOAN IS NO LONGER OFFERED (doc 110 section 1, doc 111 C; errata 237): the estate sale pays for the funeral, and
    // SHE_D1's Act III opening, which existed only to offer the loan, is gone. The row stays in doc 04 and in this tree,
    // and SHENG'S LOAN and its pair at the undertaker's stay, for a save already past it.
    entries: [
      { when: { T_SHENG_HOLDS_PAPER: true, T_PRATT_TRAIL: false }, node: 'SHE_D1' },
    ],
    start: 'SHE_A1', nodes: { SHE_A1: A1, SHE_D1: D1 },
  });
}

function sowerbyTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# REVEREND SOWERBY');
  const to = doc.indexOf('\n---', from);
  if (from < 0 || to < 0) throw new Error('doc 04: no REVEREND SOWERBY section');
  const whole = doc.slice(from, to);
  const SPEAKER = 'sowerby';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const ROUTE = {
    'SOW_A1:5': { set: { T_SOW_FUNERAL_ASKED: true }, when: { T_FANSHAWE_FUNERALS: true, T_PIKE_DEAD: true } },
    'SOW_A1:6': { when: { T_SHENG_TASK: true, T_FUNERAL_DAY: false } },
    'SOW_A1:7': { when: { T_MEMORIAL_BOOKED: true, T_FUNERAL_DAY: false },
      whenAny: [{ T_QUEUE_PADDED: false }, { T_PRATT_TRAIL: false }], set: { T_MEMORIAL_BOOKED: true } },
    'SOW_A1:8': { set: { ASSAY_PAIR_17: true } },
    'SOW_C1:1': { add: { SOWERBY_ADJECTIVES: 4 } },
    'SOW_C1:3': { set: { T_SOWERBY_PRICE: true } },
  };
  const nodes = {};
  for (const [index, id] of ['SOW_A1', 'SOW_C1'].entries()) {
    const at = whole.indexOf(`## \`${id}\``);
    if (at < 0) throw new Error(`doc 04: no ${id}`);
    const next = whole.indexOf('\n## ', at + 5);
    const body = whole.slice(at, next < 0 ? whole.length : next);
    const opening = [...body.matchAll(/^> \*\*(SOWERBY|THAD):\*\* (.+)$/gm)].map((m) => ({
      speaker: m[1] === 'THAD' ? 'thad' : SPEAKER, line: quoted(m[2].replace(/\*\([^)]*\)\*/g, '')).join(' ').replace(/\*/g, '') }));
    const options = [];
    for (const [, number, optionCell, tagCell, responseCell] of body.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)) {
      const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
      const text = quoted(optionCell)[0];
      // "(second, softer)" / "(third, ...)": the counted repeats, as frameTree reads them
      const pieces = responseCell.split(/\*\((second|third)[^)]*\)\*/);
      const said = spokenIn(pieces[0].replace(/\*\([^)]*\)\*/g, ''), SPEAKER);
      for (const d of spokenIn(responseCell, SPEAKER).staging) process.stderr.write(`  doc 04 ${id} option ${number} staging: ${d}\n`);
      if (!tag || !text || !said.lines.length) throw new Error(`doc 04 ${id}: option ${number} does not read`);
      const option = { id: `${SPEAKER}${index === 0 ? '' : '_c'}${number}`, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text };
      if (said.lines.length === 1 && said.lines[0].speaker === SPEAKER) option.say = said.lines[0].line;
      else option.exchange = said.lines;
      for (let k = 1; k < pieces.length; k += 2) {
        const later = spokenIn((pieces[k + 1] ?? '').replace(/\*\([^)]*\)\*/g, ''), SPEAKER);
        if (later.lines.length) (option.repeats ??= []).push({ selection: pieces[k] === 'second' ? 2 : 3, say: later.lines.map((l) => l.line).join(' ') });
      }
      const route = ROUTE[`${id}:${number}`] ?? {};
      if (route.when) option.when = route.when;
      // Gates written in the row (errata 172): `req FLAG` / `unless FLAG`, beside the routed ones.
      for (const g of responseCell.matchAll(/\b(req|unless) `([A-Z_0-9]+)`/g)) {
        if (route.when && g[2] in route.when) continue;
        option.when = { ...option.when, [g[2]]: g[1] === 'req' };
      }
      if (route.whenAny) option.whenAny = route.whenAny;
      if (route.set) option.set = route.set;
      if (route.add) option.add = route.add;
      options.push(option);
    }
    if (options.length < 3) throw new Error(`doc 04 ${id}: ${options.length} options`);
    options.push({ id: `${SPEAKER}${index === 0 ? '' : '_c'}x`, tag: 'EXIT', text: POOL[(3 + index) % POOL.length], universal: true, ends: true });
    const last = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    nodes[id] = { id, ...(last ? { prompt: last.line } : { noPrompt: true, exceptionReason: 'Doc 04 writes this node as a table only.' }),
      ...(opening.length ? { opening } : {}), options };
    // THE COUNTER (doc 04's Mechanic; errata 75, 189): "The counter shows the running total -- ADJECTIVES
    // and the price ... Two dollars an adjective; the minimum rate is fifty cents". The rate and the
    // minimum are READ from that sentence, so the screen cannot drift from the writing.
    if (id === 'SOW_C1') {
      const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, ten: 10, twenty: 20, fifty: 50 };
      const rule = /(\w+) dollars an adjective; the minimum rate is (\w+) cents/i.exec(body);
      const perUnit = rule && WORDS[rule[1].toLowerCase()];
      const cents = rule && WORDS[rule[2].toLowerCase()];
      if (!perUnit || !cents) throw new Error('doc 04 SOW_C1: the counter\'s rate ("… dollars an adjective; the minimum rate is … cents") does not read');
      const stops = ROUTE['SOW_C1:3'].set;
      nodes[id].counter = { counter: 'SOWERBY_ADJECTIVES', perUnit, minimum: cents / 100, stopsOn: Object.keys(stops)[0],
        note: `Doc 04 SOW_C1: "${rule[0]}". Shown while this node is open: ADJECTIVES is the counter, the price is perUnit times it; once the negotiation is settled (stopsOn) it stops at the minimum, "Four words, fifty cents. The counter stops." (option 3).` };
    }
  }
  return write('content/dialogue/sowerby.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'SOWERBY',
    speaker: SPEAKER,
    name: 'REVEREND SOWERBY',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (REVEREND SOWERBY) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a reply are his, italic quotes Thad\'s. '
      + 'The universal exit line is doc 04 part one\'s pool.',
    entries: [{ when: { T_NEED_TO_DIE: true, T_SOWERBY_PRICE: false }, node: 'SOW_C1' }],
    start: 'SOW_A1',
    nodes,
  });
}

// ---------------------------------------------------------------------------
// THE TOWN'S REPUTATION BARKS (doc 07 Part Two; errata 109). Every single-voice
// bark table is read here into the `barks` of that townsperson's ambient file.
// Until errata 109 five were typed in by hand and the hotel clerk's file said
// "Doc 07 writes no barks for the clerk" while doc 07 section 8 wrote nine.
//
// THE TRANSFORMS, all of them, because a bark is one string over a head and
// carries only words:
//   - an italic direction -- *(beat)*, *(He shakes his head.)* -- is dropped,
//     inside the quotes or out;
//   - emphasis asterisks go, the words stay;
//   - two quotes from the same mouth are one line, in order;
//   - an exchange written "A." — "B." — "C." is a conversation with Thad, and
//     the bark is its first line, the townsperson's (the pie woman's R_DEAD).
// The quote marks are the document's. Two-voice tables (the boundary men, the
// boarding-house women) and tables of directions alone (the bell-ringer, the
// fiddler) are not single barks and are not read here.
const BARK_SECTIONS = JSON.parse(read('tools/town-barks.json')).extract;

// A TABLE OF STRUCK BARKS (errata 161): the bell-ringer's rows are a blow on
// the bell, with words in some. The words are read here as any bark's; a row
// with none is the blow alone, and the file must play it (`barkCues`, his own
// file's: which cue a direction sounds is staging, not writing).
const STRUCK_SECTIONS = JSON.parse(read('tools/town-barks.json')).struck ?? {};

function townBarks() {
  const doc = read('docs/07-ambient-layer.md');
  const states = JSON.parse(read('content/reputation.json')).states;
  const written = [];
  const struck = new Set(Object.keys(STRUCK_SECTIONS));
  for (const [heading, file] of [...Object.entries(BARK_SECTIONS), ...Object.entries(STRUCK_SECTIONS)]) {
    const start = doc.indexOf(`\n## ${heading}\n`);
    if (start < 0) throw new Error(`doc 07: no section "## ${heading}"`);
    const end = doc.indexOf('\n## ', start + 4);
    const body = doc.slice(start, end < 0 ? undefined : end);
    const table = body.slice(body.indexOf('**Barks**'));
    const barks = {};
    for (const row of table.split('\n')) {
      const match = row.match(/^\| `(R_[A-Z_]+)` \| (.+) \|$/);
      if (!match) continue;
      let cell = match[2].replace(/\*\([^)]*\)\*/g, ' ');
      const exchange = cell.indexOf('" — "');
      if (exchange >= 0) cell = cell.slice(0, exchange + 1);
      const words = quoted(cell).map(plain).filter(Boolean);
      if (!words.length && struck.has(heading)) { barks[match[1]] = null; continue; }
      if (!words.length) throw new Error(`doc 07 ${heading} ${match[1]}: no quoted words`);
      barks[match[1]] = words.join(' ').replace(/\s+/g, ' ').trim();
    }
    const missing = states.filter((state) => !(state in barks));
    if (missing.length) throw new Error(`doc 07 ${heading}: no bark for ${missing.join(', ')}`);
    const path = `content/ambient/${file}.json`;
    const npc = JSON.parse(read(path));
    if (struck.has(heading)) {
      const silent = states.filter((state) => barks[state] === null && !npc.barkCues?.[state]);
      if (silent.length) throw new Error(`doc 07 ${heading}: ${silent.join(', ')} is a blow with no words, and ${path} plays no cue for it`);
      npc.barks = Object.fromEntries(states.filter((state) => barks[state] !== null).map((state) => [state, barks[state]]));
      npc.barksNote = `EXTRACTED from docs/07-ambient-layer.md (## ${heading}) by tools/extract-content.mjs. `
        + 'Do not edit: change doc 07 and re-run. Every row is a blow on the bell: its words, where the row has any, '
        + 'are the bark, and the blow is `barkCues` (errata 161).';
      written.push(write(path, npc, 1));
      continue;
    }
    npc.barks = Object.fromEntries(states.map((state) => [state, barks[state]]));
    npc.barksNote = `EXTRACTED from docs/07-ambient-layer.md (## ${heading}) by tools/extract-content.mjs. `
      + 'Do not edit: change doc 07 and re-run. Directions are dropped, emphasis is plain, and an exchange '
      + 'with Thad is its first line (errata 109).';
    written.push(write(path, npc, 1));
  }
  return written;
}

// ---------------------------------------------------------------------------
// OZYMANDIA AT PROSPERITY, ACT IV (errata 184). Doc 04's MADAME OZYMANDIA
// section: "**Act IV:** if Thad returns after `T_VOID`, she is at Prosperity
// ... Her only line: *"…It's loud here."*" She says nothing else, so it is
// her bark in every reputation state, as the funeral's eulogy is.
function ozymandiaAtProsperity() {
  const doc = read('docs/04-dialogue-trees.md');
  const section = doc.slice(doc.indexOf('# MADAME OZYMANDIA'));
  const para = /^\*\*Act IV:\*\*.*$/m.exec(section)?.[0];
  const line = para && /Her only line: \*"([^"]+)"\*/.exec(para)?.[1];
  if (!line) throw new Error('doc 04 OZYMANDIA: the Act IV line was not found');
  const path = 'content/ambient/prosperity-ozymandia.json';
  const npc = JSON.parse(read(path));
  const states = JSON.parse(read('content/reputation.json')).states;
  npc.barks = Object.fromEntries(states.map((state) => [state, line]));
  npc.barksNote = 'EXTRACTED from docs/04-dialogue-trees.md (MADAME OZYMANDIA, **Act IV:**) by tools/extract-content.mjs. '
    + 'Do not edit: change doc 04 and re-run. Her only line, the same in every state.';
  return write(path, npc, 1);
}

// ---------------------------------------------------------------------------
// THE WAYS OUT (errata 189, doc 106). Tyler, 2026-11-08, of forty doors and
// exits that answered LOOK and LISTEN with the generic line: "Write them all".
// Doc 106 writes each way as `> **NAME** — LOOK 1 "..." · 2 · 3 | LISTEN 1 ...`
// under `## ROOM N · ...`. A way the room compiler builds from an examined
// subject reads the same line through its annotation's `linesFrom`; every other
// way is written into its room file here, on the exit whose hover name it is.
// An exit that already has a LOOK of its own is refused: doc 106 only fills
// silence.
function waysOut() {
  const doc = read('docs/106-the-ways-out.md');
  const manifest = JSON.parse(read('content/manifest.json'));
  const written = [];
  for (const section of doc.split(/^(?=## ROOM \d+ · )/m).slice(1)) {
    const number = /^## ROOM (\d+) · /.exec(section)[1].padStart(2, '0');
    const roomId = JSON.parse(read(`reference/room-${number}/annotation.json`)).room;
    const subjects = new Set(Object.keys(JSON.parse(read(`reference/room-${number}/annotation.json`)).exitSubjects ?? {}));
    const path = manifest.rooms.find((one) => JSON.parse(read(one)).id === roomId);
    if (!path) throw new Error(`doc 106: room ${number} (${roomId}) is not in the manifest`);
    const room = JSON.parse(read(path));
    let touched = false;
    for (const m of section.matchAll(/^> \*\*(.+?)\*\* — (.+)$/gm)) {
      const [, name, body] = m;
      if (subjects.has(name)) continue; // compiled from linesFrom
      const exits = room.exits.filter((e) => e.name === name);
      if (!exits.length) throw new Error(`doc 106: room ${number} has no exit named ${name}`);
      const said = {};
      for (const half of body.split(' | ')) {
        const verb = /^LOOK\b/.test(half) ? 'LOOK_AT' : /^LISTEN\b/.test(half) ? 'LISTEN_TO' : null;
        if (!verb) throw new Error(`doc 106: ${name} has a run that is neither LOOK nor LISTEN`);
        const lines = [...half.matchAll(/"([^"]+)"/g)].map((q) => q[1]);
        if (lines.length !== 3) throw new Error(`doc 106: ${name} ${verb} has ${lines.length} lines, not 3`);
        said[verb] = [{ say: lines[0], repeat: lines.slice(1) }];
      }
      for (const exit of exits) {
        if (exit.responses?.LOOK_AT && !exit.waysOut) throw new Error(`doc 106: ${roomId}'s ${name} already has a LOOK of its own`);
        exit.responses = { ...(exit.responses ?? {}), ...said };
        exit.waysOut = `docs/106-the-ways-out.md, ROOM ${Number(number)} (errata 189)`;
        delete exit.stub;
      }
      touched = true;
    }
    const raw = read(path);
    if (touched) written.push(write(path, room, raw.startsWith('{\n  "') ? 2 : 1));
  }
  return written;
}

// ---------------------------------------------------------------------------
// HOB'S RUNNING LINES (errata 184; errata 71 D: "ambient barks, not the tree.
// They belong to the ambient layer when Hob is placed in a night room"). Doc 04
// HOB_A1's **Running:** paragraph, one bark per " · " segment, each segment's
// quoted words in order (the last is two lines with a pause between). A line
// the opening sequence already gives him (doc 17 beat 9) is said there, not
// again. They are said on his rounds in the back alley, in Acts I and II
// ("Acts I–II, forty words total"), one a visit, each once; `counter` counts
// them so a save keeps its place.
function hobRunning() {
  const doc = read('docs/04-dialogue-trees.md');
  const at = doc.indexOf('**Running:**');
  if (at < 0) throw new Error('doc 04: HOB_A1 has no **Running:** lines');
  const para = doc.slice(at).split('\n## ')[0];
  const quote = /^> (.+)$/m.exec(para)?.[1];
  if (!quote) throw new Error('doc 04: the Running lines are not quoted');
  const opening = read('docs/17-opening-sequence.md');
  const lines = quote.split(' · ')
    .map((segment) => quoted(segment.replace(/\*\([^)]*\)\*/g, '')).map((line) => ({ speaker: 'hob', line })))
    .filter((said) => said.length && !opening.includes(`"${said[0].line}"`));
  if (lines.length !== 4) throw new Error(`doc 04: expected four Running lines after the opening's, found ${lines.length}`);
  const path = 'content/ambient/hob.json';
  const npc = JSON.parse(read(path));
  npc.barkRun = { counter: 'HOB_RUNNING', when: { ACT: { atMost: 2 } }, lines };
  npc.barkRunNote = 'EXTRACTED from docs/04-dialogue-trees.md (HOB_A1, **Running:**) by tools/extract-content.mjs. '
    + 'Do not edit: change doc 04 and re-run. Errata 184: one a visit to his rounds, in order, each once, while '
    + 'ACT is at most 2; "Wouldn\'t stand there." is the opening\'s (doc 17 beat 9) and is not said again. Doc 04 '
    + 'says "every fourth night"; the game counts no nights, and a visit stands for one.';
  npc.barksNote = 'He has no reputation barks (doc 07 writes none for him). His Running lines are `barkRun`.';
  return write(path, npc, 1);
}

// ---------------------------------------------------------------------------
// THE TOWNSPEOPLE'S MICRO-TREES AND THE PAIR'S BARKS (doc 07 Part Two;
// errata 110). The five placed in errata 110 -- the boundary men, the message
// boy, the man leaving tomorrow, the fiddler, the dog's owner -- are read from
// doc 07 here, never typed. The grammar is doc 07's NOTATION:
//   > "Q" → reply                 an option, TOPIC
//   > `[COMIC]` "Q" → reply       an option, COMIC
//   > ↳ "Q" → reply               a FOLLOW-UP: offered once the option above has been asked
//   >   *Thad:* "x"               an INTERJECTION inside the reply above
//   >   → "y"                     and the reply goes on
// In a reply, **A:** and **B:** name which of a pair is speaking, a quote is
// the speaker's, and an italic parenthetical is a direction, performed or
// hidden by doc 58's rules. An option line with no quoted words for Thad --
// the message boy's *(pay)* -- has nothing to put on the menu and is left
// out and reported, never worded here. *(after)* is a gate the routes in
// tools/town-barks.json say the meaning of.
function townTrees() {
  const doc = read('docs/07-ambient-layer.md');
  const routing = JSON.parse(read('tools/town-barks.json'));
  const pool = [...read('docs/04-dialogue-trees.md').slice(read('docs/04-dialogue-trees.md').indexOf('## Universal exit lines')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const section = (heading) => {
    const start = doc.indexOf(`\n## ${heading}\n`);
    if (start < 0) throw new Error(`doc 07: no section "## ${heading}"`);
    const end = doc.indexOf('\n## ', start + 4);
    return doc.slice(start, end < 0 ? undefined : end);
  };
  /** A reply's spans in order: [{speaker, line, direction?}]. */
  const spoken = (text, speakers, first) => {
    const out = [];
    let who = first;
    for (const span of text.matchAll(/\*\*([AB]):\*\*|\*\(([^)]+)\)\*|"([^"]+)"/g)) {
      const [, voice, direction, words] = span;
      if (voice) { who = speakers[voice]; continue; }
      if (direction !== undefined) {
        const shown = performedDirection(plain(direction));
        if (shown) out.push({ speaker: who, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
        continue;
      }
      out.push({ speaker: who, line: plain(words) });
    }
    return out;
  };
  const written = [];
  const reported = [];
  let poolIndex = 0;
  for (const [heading, spec] of Object.entries(routing.trees)) {
    const body = section(heading);
    const tree = body.slice(body.indexOf('**Micro-tree**'), body.indexOf('**Barks**'));
    const speakers = spec.speakers ?? {};
    const routes = routing.treeRoutes?.[heading] ?? {};
    const options = [];
    let lastTop = null;
    // AN OPENING LINE (doc 07 NOTATION, errata 114): the stage line shown over the options when the conversation
    // opens. The letter-writer, the pie woman and the map seller have one (errata 170 brings their trees here).
    const opening = /^\*\*\*Opening:\*\*\*\s*\*(.+?)\*\s*$/m.exec(tree)?.[1] ?? null;
    for (const raw of tree.split('\n')) {
      if (!raw.startsWith('>')) continue;
      const line = raw.slice(1);
      const continuation = /^\s{2,}/.test(line);
      const text = line.trim();
      if (continuation) {
        const option = options.at(-1);
        if (!option) throw new Error(`doc 07 ${heading}: a continuation with no option above it`);
        // AN ASKED-AGAIN IN A NAMED VOICE (errata 183): the boarding-house women's is B's, as her first answer was,
        // so it is an exchange in the pair's voices, the engine's authored `repeats` form, not the one-voice `repeat`.
        const voiced = /^\*Asked again:\*\s*(\*\*[AB]:\*\*.+)$/.exec(text);
        if (voiced) { option.repeats = [{ selection: 2, exchange: spoken(voiced[1], speakers, spec.speaker) }]; continue; }
        const again = /^\*Asked again:\*\s*"([^"]+)"/.exec(text);
        if (again) { option.repeat = plain(again[1]); continue; }
        const thad = /^\*Thad:\*\s*"([^"]+)"/.exec(text);
        if (thad) { option.exchange.push({ speaker: 'thad', line: plain(thad[1]) }); continue; }
        const more = /^→\s*(.+)$/.exec(text);
        if (more) { option.exchange.push(...spoken(more[1], speakers, spec.speaker)); continue; }
        throw new Error(`doc 07 ${heading}: unread continuation "${text}"`);
      }
      const followUp = text.startsWith('↳');
      const comic = text.includes('`[COMIC]`');
      const arrow = text.indexOf('→');
      // AN [EXIT] OF THE CHARACTER'S OWN (errata 172): the card sharp's "Count your fingers on the way out." With a
      // reply it is his exit; without one it is doc 04's universal pool, which rotates in play.
      if (text.includes('`[EXIT]`')) {
        const said = /"([^"]+)"/.exec(arrow < 0 ? text : text.slice(0, arrow))?.[1];
        if (!said) throw new Error(`doc 07 ${heading}: an [EXIT] with no words`);
        const exitOption = { id: `${spec.prefix}x`, tag: 'EXIT', text: plain(said), ends: true };
        if (arrow < 0) exitOption.universal = true;
        else exitOption.exchange = spoken(text.slice(arrow + 1), speakers, spec.speaker);
        options.push(exitOption);
        continue;
      }
      if (arrow < 0) throw new Error(`doc 07 ${heading}: an option with no reply: "${text}"`);
      const asked = /"([^"]+)"/.exec(text.slice(0, arrow))?.[1];
      if (!asked) { reported.push(`${heading}: "${text.slice(0, arrow).trim()}" has no words for Thad to say -- left out`); continue; }
      const id = `${spec.prefix}${options.length + 1}`;
      const option = { id, text: plain(asked), tag: comic ? 'COMIC' : 'TOPIC',
        ...(followUp && lastTop ? { after: [lastTop] } : {}), exchange: spoken(text.slice(arrow + 1), speakers, spec.speaker) };
      Object.assign(option, routes[option.text] ?? {});
      if (!followUp) lastTop = id;
      options.push(option);
    }
    for (const text of Object.keys(routes)) {
      if (!options.some((option) => option.text === text)) throw new Error(`doc 07 ${heading}: a route for "${text}", which no option says`);
    }
    for (const option of options) {
      if (option.exchange?.length === 1 && option.exchange[0].speaker === spec.speaker && !option.exchange[0].direction) {
        option.say = option.exchange[0].line;
        delete option.exchange;
      }
    }
    if (!options.some((option) => option.tag === 'EXIT')) {
      options.push({ id: `${spec.prefix}x`, tag: 'EXIT', text: pool[poolIndex % 2], universal: true, ends: true });
      poolIndex += 1;
    }
    written.push(write(`content/dialogue/${spec.file}.json`, {
      schema: 1,
      id: spec.tree,
      speaker: spec.speaker,
      note: `EXTRACTED from docs/07-ambient-layer.md (## ${heading}) by tools/extract-content.mjs. Do not edit: change doc 07 and re-run. `
        + (opening ? 'The opening is doc 07\'s stage line. ' : 'Doc 07 writes no opening line; the character greets with his bark (greetsWithBark). ')
        + 'The exit is doc 04 part one\'s pool, rotated in play (errata 110, 167).',
      start: 'root',
      // The stage line is performed as the conversation opens, as a direction over the character (as RUL_G1's
      // *(Nobody asked.)* is), not kept as a `prompt` the renderer draws nowhere (errata 218).
      nodes: { root: opening
        ? { id: 'root', noPrompt: true, exceptionReason: 'Doc 07\'s opening is a stage line, performed as a direction, not held over the options.',
          opening: [{ speaker: spec.speaker, line: plain(opening), direction: true }], options }
        : { id: 'root', noPrompt: true, exceptionReason: 'Doc 07 writes the micro-tree as options only; the greeting is the bark.', options } },
    }));
  }
  // THE PAIR'S BARKS: one exchange per reputation, carried by the file named.
  const states = JSON.parse(read('content/reputation.json')).states;
  for (const [heading, spec] of Object.entries(routing.exchanges ?? {})) {
    const body = section(heading);
    const table = body.slice(body.indexOf('**Barks**'));
    const exchange = {};
    for (const row of table.split('\n')) {
      const match = row.match(/^\| `(R_[A-Z_]+)` \| (.+) \|$/);
      if (!match) continue;
      const lines = spoken(match[2], spec.speakers, null).filter((one) => !one.direction);
      if (lines.some((one) => !one.speaker)) throw new Error(`doc 07 ${heading} ${match[1]}: a line with no A or B`);
      exchange[match[1]] = lines;
    }
    const missing = states.filter((state) => !exchange[state]?.length);
    if (missing.length) throw new Error(`doc 07 ${heading}: no bark for ${missing.join(', ')}`);
    const path = `content/ambient/${spec.file}.json`;
    const npc = JSON.parse(read(path));
    npc.barkExchange = Object.fromEntries(states.map((state) => [state, exchange[state]]));
    npc.barksNote = `EXTRACTED from docs/07-ambient-layer.md (## ${heading}) by tools/extract-content.mjs, as \`barkExchange\`: `
      + 'the table is written in two voices, each line said over its own man. Directions are dropped (errata 110).';
    written.push(write(path, npc, 1));
  }
  for (const line of reported) process.stderr.write(`doc 07: ${line}\n`);
  return written;
}

// ---------------------------------------------------------------------------
// THE PROPAGATION ENGINE (doc 06; errata 116). Each reputation state and the
// puzzle whose headline sets it, read from doc 06's table into
// content/reputation.json's `setBy`. The ORDER of the states is errata 7's
// (doc 07 wins), and is the file's own; doc 06 lists BORDERS_MOTT before
// SURVEYED and its order is not used.
function reputation() {
  const doc = read('docs/06-technical-spec.md');
  const body = doc.slice(doc.indexOf('## The propagation engine'), doc.indexOf('## Ambient NPC roster'));
  const file = JSON.parse(read('content/reputation.json'));
  const setBy = {};
  for (const row of body.split('\n')) {
    const match = /^\| `(R_[A-Z_]+)` \| ([^|]+)\|/.exec(row);
    if (!match) continue;
    const puzzle = /\b([A-F]\d{1,2})\b/.exec(match[2])?.[1];
    if (puzzle) setBy[match[1]] = puzzle;
    else if (!/start/i.test(match[2])) throw new Error(`doc 06: ${match[1]} is set by "${match[2].trim()}", which names no puzzle`);
  }
  const unset = file.states.slice(1).filter((state) => !setBy[state]);
  if (unset.length) throw new Error(`doc 06's propagation table sets no puzzle for ${unset.join(', ')}`);
  return write('content/reputation.json', {
    schema: file.schema,
    note: file.note,
    states: file.states,
    setBy: Object.fromEntries(file.states.filter((state) => setBy[state]).map((state) => [state, setBy[state]])),
    setByNote: 'EXTRACTED from docs/06-technical-spec.md (The propagation engine) by tools/extract-content.mjs: the puzzle whose '
      + 'headline moves the town to each state. Reputation is the furthest state, in this order, whose puzzle is complete (errata 116).',
  });
}

// ---------------------------------------------------------------------------
// ACTED DIRECTIONS (doc 95; Tyler, 2026-11-06: "then let's do it? Lol"). Doc
// 95's table decides, for every shown stage direction, whether a figure acts
// it (A), whether it waits for a pose to be drawn (B), or whether it stays
// printed (C), and for an A row which figures act it with which frames. The
// class lives in the document and nowhere else; this carries it to the game.
function actedDirections() {
  const doc = read('docs/95-acted-directions.md');
  const cells = (row) => row.replace(/^\|/, '').replace(/\|\s*$/, '').split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'));
  const directions = [];
  for (const row of doc.split('\n')) {
    if (!/^\| \d+ \| [ABC] \|/.test(row)) continue;
    const [n, kind, speaker, words, where, by, frames, seconds, holds, cue] = cells(row);
    const entry = { n: Number(n), class: kind, speaker, words, where };
    if (kind === 'A') {
      const figures = by.split(',').map((one) => one.trim()).filter(Boolean);
      // ONE GROUP PER FIGURE when they act differently (errata 197: Grievance looks while her other self
      // waits, then she is out): "0 0 2 3 ; 0 0 0 1", in the order the figures are named. Holds alike.
      const groups = frames.split(';').map((group) => group.split(/\s+/).filter(Boolean).map(Number));
      if (groups.length > 1 && groups.length !== figures.length) throw new Error(`doc 95 row ${n}: ${groups.length} frame groups for ${figures.length} figures`);
      if (groups.some((group) => !group.length || group.some((one) => !Number.isInteger(one)))) throw new Error(`doc 95 row ${n}: a frame group does not read ("${words}")`);
      const holdGroups = holds ? holds.split(';').map((one) => Number(one.trim())) : [];
      if (holdGroups.length > 1 && holdGroups.length !== figures.length) throw new Error(`doc 95 row ${n}: ${holdGroups.length} holds for ${figures.length} figures`);
      const sequence = groups[0];
      const length = Number(seconds);
      if (!figures.length || !sequence.length || sequence.some((one) => !Number.isInteger(one)) || !(length > 0)) {
        throw new Error(`doc 95 row ${n}: an A row names its figures, its frames and its seconds ("${words}")`);
      }
      const sound = cue ? /^([A-Z0-9-]+) @(\d+)$/.exec(cue) : null;
      if (cue && !sound) throw new Error(`doc 95 row ${n}: the cue "${cue}" is not "<CUE> @<frame>"`);
      entry.performedBy = figures;
      entry.frames = sequence;
      if (groups.length > 1) entry.framesBy = groups;
      entry.seconds = length;
      if (holdGroups.length === 1) entry.holds = holdGroups[0];
      if (holdGroups.length > 1) entry.holdsBy = holdGroups;
      if (sound) entry.cue = { id: sound[1], frame: Number(sound[2]) };
    } else if (frames || seconds || holds || cue) {
      throw new Error(`doc 95 row ${n}: a ${kind} row is not acted, and names no frames ("${words}")`);
    }
    directions.push(entry);
  }
  if (!directions.length) throw new Error('doc 95: no directions table');
  return write('content/acted-directions.json', {
    schema: 1,
    note: 'EXTRACTED from docs/95-acted-directions.md by tools/extract-content.mjs (errata 141). Every shown stage direction '
      + 'and its class: A is performed by the figures named, in the frames named, and not printed; B waits for a pose to be drawn '
      + 'and is printed; C is narration and is printed (doc 58). Change a class in doc 95 and re-extract, never here.',
    directions,
  });
}

// ---------------------------------------------------------------------------
// THE CUT-AWAYS (errata 158; doc 96). Tyler, 2026-11-07: "You decide, and I
// want them included now so that they're part of my play through." The lines
// are doc 96's tables and nowhere else; WHERE and WHEN each plays is routing,
// and lives here, as the opening's staging does, so no .ts file names a flag
// and no prose document carries one.
function cutaways() {
  const doc = read('docs/96-cutaways.md');
  const SPEAKER = { FRAME: 'frame', PRATT: 'pratt', FANSHAWE: 'fanshawe', VOICE: 'cutaway_voice' };
  const ROUTE = {
    // After the swindle, which is the edition GRUBBS (errata 9).
    1: { id: 'clarion_press', room: 'clarion', when: { T_SWINDLED: true }, done: 'T_CUTAWAY_CLARION' },
    // After Thad has caught him pulling up the stake: D2 is open.
    // Errata 244: cut to Prosperity, where he is in fact still on it (doc 115 II-2), and only while he is.
    // The figure who says it there is the one drawn there, on the claim (pratt_jump), not the one at his own.
    2: { id: 'pratts_voice', room: 'prosperity', when: { T_PRATT_STAKE: true, T_PRATT_TURNED: false }, done: 'T_CUTAWAY_PRATT',
      speakers: { pratt: 'pratt_jump' } },
    // Part Three, and only Part Three: E0b writes ACT 3. He is in his office
    // only on a day that is not a funeral day (content/ambient/fanshawe.json).
    3: { id: 'fanshawe_chairs', room: 'fanshawe_office', when: { ACT: { atLeast: 3, atMost: 3 }, T_FUNERAL_DAY: false },
      done: 'T_CUTAWAY_FANSHAWE',
      // ERRATA 159: MONKEY ISLAND'S CLOSE-UP. Tyler, of LeChuck's scenes: "it
      // played like a video with a much better drawn version". Two frames,
      // at rest and mid-word, drawn by the image session from
      // reference/fanshawe-closeup/brief.md. Until both are here the scene
      // plays in the office, as it always has.
      closeup: { frames: ['art/cutaways/fanshawe-closeup-rest.png', 'art/cutaways/fanshawe-closeup-talk.png'],
        // ERRATA 160 (Tyler: "Go ahead" to making it play like a film): a blink
        // between lines, when drawn; a slow push of six per cent toward his face
        // over the scene; and the desk lamp, at the right of the frame as the
        // brief asks, breathing on him.
        blink: 'art/cutaways/fanshawe-closeup-blink.png',
        // WHERE THEY ARE DRAWN (errata 162). The face is where the brief asked, because the frames are
        // cropped from y 20 to put it there (tools/art/fanshawe-closeup.py); the lamp was drawn further
        // right and lower than 1500,430, and the brief says to move this to the drawing rather than
        // redraw it. Measured on the derived frames: between the eyes and the mouth, the flame's core.
        push: 0.06, pushSeconds: 22, focus: [955, 355], lamp: { x: 1690, y: 698, radius: 620, strength: 0.22 } },
      // ERRATA 160: THE GHOST SHIP BEFORE LECHUCK. Main Street at night, the
      // Improvement Company's front (its sign spans x535-800, its door x652),
      // the view creeping toward the door; then a hard cut inside.
      establishing: { image: 'art/backgrounds/room-02-main-street.png', x: 0, seconds: 4, push: 0.08, focus: [690, 470] },
      // The Company's own theme, slower and lower: THE COMPANY, darkened (doc 28 Rooms 10/11).
      music: { src: 'audio/the-company.wav', gain: 0.6, rate: 0.84 } },
  };
  const sections = doc.split(/^## /m).slice(1).filter((part) => /^\d+ · /.test(part));
  const out = sections.map((part) => {
    const number = Number(part.match(/^(\d+)/)[1]);
    const route = ROUTE[number];
    if (!route) throw new Error(`doc 96 section ${number}: no route for it in the extractor`);
    const lines = [];
    for (const row of part.split('\n')) {
      const cell = row.match(/^\| (\d+) \| ([A-Z]+) \| "(.+)" \|$/);
      if (!cell) continue;
      const named = SPEAKER[cell[2]];
      if (!named) throw new Error(`doc 96 section ${number} row ${cell[1]}: unknown speaker ${cell[2]}`);
      const speaker = route.speakers?.[named] ?? named;
      lines.push({ speaker, line: cell[3] });
    }
    if (!lines.length) throw new Error(`doc 96 section ${number}: no lines`);
    // ERRATA 159: A CLOSE-UP IS DECLARED ONLY ONCE ITS FRAMES ARE IN THE
    // REPOSITORY, so the game never waits in the dark on a file that does not
    // exist; when the image session's frames land, re-extracting adds it, and
    // --check calls this file stale until somebody does.
    const { closeup, speakers, ...rest } = route;
    void speakers;
    const drawn = closeup && closeup.frames.every((path) => existsSync(resolve(ROOT, path)));
    // The blink is the third frame, and only once it too is drawn.
    const { blink, ...shape } = closeup ?? {};
    const declared = drawn ? { ...shape, frames: [...closeup.frames, ...(blink && existsSync(resolve(ROOT, blink)) ? [blink] : [])] } : null;
    return { ...rest, ...(declared ? { closeup: declared } : {}), lines };
  });
  if (out.length !== Object.keys(ROUTE).length) throw new Error(`doc 96: ${out.length} cut-aways, ${Object.keys(ROUTE).length} routed`);
  return write('content/cutaways.json', {
    schema: 1,
    note: 'EXTRACTED from docs/96-cutaways.md by tools/extract-content.mjs (errata 158). Each cut-away shows `room` without '
      + 'Thad, says its lines, and comes back exactly where it was; it plays once, at the first quiet moment after `when` '
      + 'holds, with Thad in another room, and writes `done` and nothing else. Change a line in doc 96 and re-extract.',
    cutaways: out,
  });
}

/**
 * ACT III, SCENES B AND C: THE SÉANCE AND THE ESTATE SALE (doc 111, THE LINES; errata 237). Tyler, 2026-11-09: "Go".
 * Everything of the two scenes that is not a room's own hotspot lines (those are tools/extract-examine.mjs's and
 * tools/compile-room.mjs's, from the same section) is read here, never typed:
 *  - `OZY_E1` (TALK TO Madame Ozymandia at the séance) -> a node of content/dialogue/ozymandia.json (ozymandiaTree);
 *  - `SEA_E1` (Thad, as the voice of the dead, from under the table) and LEAVING THE TABLE -> content/dialogue/seance.json;
 *  - `SUM_E1`'s new row 1‴ -> content/dialogue/sump.json (sumpTree);
 *  - `PRA_E3` (TALK TO Pratt at his claim after E3.1) -> a node of content/dialogue/pratt.json (prattTree);
 *  - the items THE HEN, THE RACCOON, IN MY COAT and MR. PRATT'S TWO DOLLARS AND SIXTY CENTS -> content/items/;
 *  - the item tries: the fork and the hen at the hole, THE SALE, the money and the raccoon at the undertaker's, the
 *    raccoon at Sheng's, the hen to Pratt -> content/combinations.json (combinations).
 * Which flag each state is, which item each name is, and what each step does are routing, authored here as every tree's
 * ROUTE table is; doc 111's words are the document's.
 */
const SCENES_BC = 'docs/111-scenes-b-and-c.md';
const SCENES_BC_ITEMS = { 'THE HEN': 'hen', 'THE RACCOON, IN MY COAT': 'raccoon_in_coat',
  "MR. PRATT'S TWO DOLLARS AND SIXTY CENTS": 'pratt_money' };
function scenesBCLines() {
  const doc = read(SCENES_BC);
  const at = doc.indexOf('\n## THE LINES\n');
  if (at < 0) throw new Error('doc 111: no "## THE LINES"');
  const rest = doc.slice(at + 1);
  const end = rest.indexOf('\n---\n');
  return end < 0 ? rest : rest.slice(0, end);
}
/** The lines from the one starting `head` to the next bold label or heading (exclusive), as written. */
function scenesBCBlock(head) {
  const rows = scenesBCLines().split('\n');
  const at = rows.findIndex((one) => one.startsWith(head));
  if (at < 0) throw new Error(`doc 111: no line starting ${head}`);
  if (rows.findIndex((one, n) => n > at && one.startsWith(head)) > 0) throw new Error(`doc 111: two lines start ${head}`);
  const out = [rows[at]];
  for (const row of rows.slice(at + 1)) {
    if (/^\*\*|^#/.test(row)) break;
    out.push(row);
  }
  return out;
}
/**
 * One reply as doc 111 writes it, in order: a plain quote is `speaker`'s (or the last `**NAME:**`'s, by `speakers`), an
 * italic quote is Thad's, `*(beat)*` and `*(pause)*` are the speaker's "…", `*(second)*` begins the second time's words,
 * and any other bracket is a direction by whoever speaks next (doc 58's notes hidden, as in every tree).
 */
function scenesBCWords(cell, speaker, speakers = {}) {
  const first = [];
  const second = [];
  let into = first;
  let who = speaker;
  const tokens = [...cell.split('→')[0].matchAll(/\*\*([A-Z][A-Z.' -]*):\*\*|\*"([^"]+)"\*|\*\(([^)]+)\)\*|"([^"]+)"/g)];
  for (let n = 0; n < tokens.length; n += 1) {
    const [, name, italic, note, quote] = tokens[n];
    if (name !== undefined) {
      who = speakers[name];
      if (!who) throw new Error(`doc 111: "${name}" speaks and nobody is routed for the name`);
    } else if (italic !== undefined) into.push({ speaker: 'thad', line: plain(italic) });
    else if (note !== undefined) {
      if (/^second$/i.test(note.trim())) { into = second; continue; }
      // A direction is the next speaker's when it leads into his words, the last speaker's when a dash parts it from
      // them (doc 111 SEA_E1 2: `**FRAME:** "Mott tuned PIANOS?" *(He writes.)* — **OZYMANDIA:** ...` is Frame writing).
      const next = tokens.slice(n + 1).find((t) => t[1] !== undefined || t[2] !== undefined || t[4] !== undefined);
      const parted = next ? cell.slice(tokens[n].index + tokens[n][0].length, next.index).includes('—') : true;
      const by = parted ? who : next?.[1] !== undefined ? (speakers[next[1]] ?? who) : next?.[2] !== undefined ? 'thad' : who;
      // DOC 58's NOTES ARE HIDDEN, BUT "pair" HERE IS A PAIR OF BOOTS. The tree pattern hides "(pair 19; errata 75)"
      // and "(sets ...)", the builder's notes in docs 04 and 27, and so hid doc 111's "Two pairs of boots leave at a
      // run.", "the last pair of boots" and "Thad sets the hen at the mouth of the hole": doc 111 writes no builder's
      // note inside a reply, so only doc 58's list and the note words that cannot be staging hide one here.
      const words = note.trim();
      const shown = /^(beat|pause|long pause)$/i.test(words) ? { line: '…', direction: false }
        : /\berrata\b|\breq\s|\bsets `|\bdoc \d|\bTyler,|→/i.test(words) || directionRule().hidden.has(words) ? null
          : { line: words, direction: true };
      if (shown) into.push({ speaker: by, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
    } else into.push({ speaker: who, line: plain(quote) });
  }
  return { first, second };
}
/** A doc 111 table's rows, `| n | "option" | tag | response | state |`. */
function scenesBCRows(head) {
  const rows = [];
  for (const row of scenesBCBlock(head)) {
    const m = /^\| (\d+)(′|″|‴)? \| (.+?) \| (.+?) \| (.+?) \|\s*(.*?)\s*\|\s*$/.exec(row);
    if (m) rows.push({ number: m[1], prime: m[2] ?? '', option: m[3], tag: m[4], response: m[5], state: m[6] });
  }
  if (!rows.length) throw new Error(`doc 111: ${head} has no rows`);
  return rows;
}
/** One option of a doc 111 node: its words, its second time, and the state its last cell names. */
function scenesBCOption(row, { id, speaker, speakers, prefix }) {
  const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(row.tag);
  const text = quoted(row.option)[0];
  if (!tag || !text) throw new Error(`doc 111: option ${row.number}${row.prime} does not read`);
  const { first, second } = scenesBCWords(row.response, speaker, speakers);
  if (!first.length) throw new Error(`doc 111: option ${row.number}${row.prime} has no reply`);
  const option = { id, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text: plain(text) };
  if (first.length === 1 && first[0].speaker === speaker && !first[0].direction) option.say = first[0].line;
  else option.exchange = first;
  if (second.length === 1 && second[0].speaker === speaker && !second[0].direction) option.repeat = second[0].line;
  else if (second.length) option.repeats = [{ selection: 2, exchange: second }];
  const after = afterIds(row.tag, prefix);
  if (after) option.after = after;
  const sets = [...row.state.matchAll(/sets `([A-Z_0-9]+)`/g)].map((m) => m[1]);
  if (sets.length) option.set = Object.fromEntries(sets.map((flag) => [flag, true]));
  const gives = /gives (THE [A-Z, ]+?|MR\. [A-Z' ]+?)\s*$/.exec(row.state.trim());
  if (gives) {
    const item = SCENES_BC_ITEMS[gives[1].trim()];
    if (!item) throw new Error(`doc 111: option ${row.number} gives "${gives[1]}", which has no item id`);
    option.gives = [item];
  }
  return option;
}
/** A node's spoken opening: its `> **NAME:** "..."` line(s) under the label. */
function scenesBCOpening(head, speakers) {
  const out = [];
  for (const row of scenesBCBlock(head)) {
    if (!row.startsWith('> ')) continue;
    out.push(...scenesBCWords(row.slice(2), 'thad', speakers).first);
  }
  return out;
}

/** OZY_E1, at the séance: a node of her tree, opening while the séance is on and Thad is not under the table. */
function seanceOzymandiaNode(speaker, pool) {
  const head = '**`OZY_E1`**';
  const speakers = { OZYMANDIA: speaker };
  const opening = scenesBCOpening(head, speakers);
  if (opening.length !== 1) throw new Error('doc 111 OZY_E1: the opening is not one line of hers');
  const options = scenesBCRows(head).map((row) => scenesBCOption(row, {
    id: `${speaker}_e1_${row.number}`, speaker, speakers, prefix: `${speaker}_e1_` }));
  if (options.length !== 4) throw new Error(`doc 111 OZY_E1: ${options.length} options, not 4`);
  if (!options[1].set?.T_SEANCE_DARK) throw new Error('doc 111 OZY_E1: option 2 no longer sets T_SEANCE_DARK');
  options.push({ id: `${speaker}_e1x`, tag: 'EXIT', text: pool[2 % pool.length], universal: true, ends: true });
  return {
    // While the séance is on: also if he has left SEA_E1 by its way out and is still under the cloth.
    entry: { when: { T_SEANCE_ON: true }, node: 'OZY_E1' },
    node: { id: 'OZY_E1', prompt: opening[0].line, opening, options },
  };
}

/** SEA_E1 and LEAVING THE TABLE: Thad, as the voice of the dead; the fourth option ends the séance. */
function seanceTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const SPEAKER = 'ozymandia';
  const speakers = { OZYMANDIA: SPEAKER, FRAME: 'seance_frame' };
  const options = scenesBCRows('**`SEA_E1`**').map((row) => scenesBCOption(row, {
    id: `seance${row.number}`, speaker: SPEAKER, speakers, prefix: 'seance' }));
  if (options.length !== 4) throw new Error(`doc 111 SEA_E1: ${options.length} options, not 4`);
  const spoken = options.find((one) => one.set?.T_MOTT_SPOKE);
  if (!spoken || spoken.id !== 'seance4') throw new Error('doc 111 SEA_E1: option 4 no longer sets T_MOTT_SPOKE');
  const leaving = scenesBCOpening('**LEAVING THE TABLE**', speakers);
  if (!leaving.length) throw new Error('doc 111: LEAVING THE TABLE has no lines');
  spoken.exchange = [...(spoken.exchange ?? [{ speaker: SPEAKER, line: spoken.say }]), ...leaving];
  delete spoken.say;
  // The séance is over: the lamp comes up, the town goes home, and he comes out from under the table.
  spoken.set = { ...spoken.set, T_UNDER_TABLE: false, T_SEANCE_ON: false };
  spoken.ends = true;
  // Doc 04's universal exit, "available at every node": a tree is always leavable (errata 57). Leaving brings him out
  // from under the cloth (errata 239: he is not drawn while he is under it, and must not be left there), and USE THE
  // SÉANCE TABLE takes him under and opens SEA_E1 again (reference/room-16/annotation.json).
  options.push({ id: 'seancex', tag: 'EXIT', text: POOL[0], universal: true, ends: true, set: { T_UNDER_TABLE: false } });
  // THE SÉANCE, heard from under the table, is the node's opening (errata 239): said through before the list is
  // offered, and once (T_SEANCE_HEARD). It was the table's own answer, queued while the list was already up (errata
  // 238 D). A line that is only a direction is the last named speaker's ("*(A silence is held.)*" after her call).
  const opening = [];
  let last = SPEAKER;
  for (const row of scenesBCBlock('**THE SÉANCE**')) {
    if (!row.startsWith('> ')) continue;
    const said = scenesBCWords(row.slice(2), 'thad', speakers).first;
    const named = /^\*\*[A-Z][A-Z.' -]*:\*\*/.test(row.slice(2));
    const quotes = /"/.test(row.replace(/\*\([^)]*\)\*/g, ''));
    for (const word of said) opening.push(!named && !quotes && word.direction ? { ...word, speaker: last } : word);
    if (named) last = said.at(-1).speaker;
  }
  if (opening.length < 5 || opening.some((one) => one.speaker === 'thad')) throw new Error('doc 111: THE SÉANCE does not read as her calls and his line');
  return write('content/dialogue/seance.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'SEANCE',
    speaker: SPEAKER,
    note: 'EXTRACTED from docs/111-scenes-b-and-c.md (THE LINES, B: SEA_E1 and LEAVING THE TABLE) by tools/extract-content.mjs '
      + '(errata 237). Do not edit: change doc 111 and re-run. Opened by USE THE SÉANCE TABLE in the dark (Room 16), after THE '
      + 'SÉANCE is heard from under it: the node\'s opening, said once (T_SEANCE_HEARD; errata 239). Thad speaks the options as the voice of the dead; FRAME is `seance_frame`, his voice at '
      + 'the table (the tent\'s `voices`), not the Clarion\'s figure. Option 4 is always offered, so the séance can always be '
      + 'finished: it writes T_MOTT_SPOKE, ends the séance (T_SEANCE_ON, T_UNDER_TABLE) and plays LEAVING THE TABLE. Doc 04\'s '
      + 'universal exit brings him out from under the cloth (errata 239), and the table takes him back to SEA_E1.',
    entries: [],
    start: 'SEA_E1',
    nodes: { SEA_E1: { id: 'SEA_E1', noPrompt: true,
      exceptionReason: 'Doc 111 SEA_E1: the séance before it (THE SÉANCE, heard from under the table) is its opening, said '
        + 'once as he goes under; the list has no caption, and opens on his choice of what the dead will say.',
      opening, openingOnce: 'T_SEANCE_HEARD', options } },
  });
}

/** SUM_E1's new row (doc 111, B · At the Registrar's): the table's rows, for sumpTree to read with doc 04's. */
function seanceSumpRows() {
  return scenesBCBlock('**`SUM_E1`**').filter((row) => /^\| \d/.test(row)).join('\n');
}

/** PRA_E3, at his claim after E3.1: a node of his tree, until the sale. */
function estateSalePrattNode(speaker, pool) {
  const head = '**`PRA_E3`**';
  const speakers = { PRATT: speaker };
  const opening = scenesBCOpening(head, speakers);
  if (opening.length !== 1) throw new Error('doc 111 PRA_E3: the opening is not one line of his');
  const options = scenesBCRows(head).map((row) => scenesBCOption(row, {
    id: `${speaker}_e3_${row.number}`, speaker, speakers, prefix: `${speaker}_e3_` }));
  if (options.length !== 3) throw new Error(`doc 111 PRA_E3: ${options.length} options, not 3`);
  if (!options[0].set?.T_RACCOON_WANTED || options[1].gives?.[0] !== 'hen') throw new Error('doc 111 PRA_E3: options 1 and 2 no longer read');
  options.push({ id: `${speaker}_e3x`, tag: 'EXIT', text: pool[4 % pool.length], universal: true, ends: true });
  return {
    // After E3.1 (the Reverend's figure) and until the sale, in Act III, on the estate sale's way: not for a save that
    // already took Sheng's loan or booked the funeral with it (doc 110 section 1).
    entry: { when: { ACT: 3, T_SOWERBY_PRICE: true, T_RACCOON_SOLD: false, T_SHENG_LOAN: false, T_FUNERAL_BOOKED: false }, node: 'PRA_E3' },
    node: { id: 'PRA_E3', noPrompt: true, exceptionReason: 'Doc 111 writes PRA_E3 as a spoken opening and a table.', opening, options },
  };
}

/** THE HEN, THE RACCOON, IN MY COAT, and MR. PRATT'S TWO DOLLARS AND SIXTY CENTS. */
function estateSaleItems() {
  const lines = scenesBCLines().split('\n');
  const said = (name, verb) => {
    const row = lines.find((one) => one.startsWith(`- **${name}** · ${verb} — `));
    const line = row && quoted(row)[0];
    if (!line) throw new Error(`doc 111: no ${name} · ${verb} line`);
    return line;
  };
  const ICON = 'No icon is drawn for it yet: act3-estate-sale\'s brief asks for one (reference/act3-estate-sale/brief.md, "an item icon '
    + 'or two"); until it lands the panel draws its labelled box (Renderer.drawInventory).';
  // PENDING ONLY WHILE THE SHIPPING SHEET HAS NO CELL FOR IT (errata 238): act3-estate-sale delivered the hen's and the
  // coat's, moved in by tools/art/act3-estate-icons-place.py; the money's is still owed.
  const cells = JSON.parse(readFileSync(resolve(ROOT, 'content/ui/item-icons.json'), 'utf8')).icons;
  const pending = (id) => (cells[id] ? {} : { iconPending: ICON });
  const out = [];
  out.push(write('content/items/hen.json', {
    schema: 1, id: 'hen', name: 'THE HEN', short: 'THE HEN',
    note: 'EXTRACTED from docs/111-scenes-b-and-c.md (THE LINES, C) by tools/extract-content.mjs (errata 237). Do not edit: change '
      + 'doc 111 and re-run. Pratt\'s hen, on loan: PRA_E3 option 2 hands it over; it brings the raccoon halfway out of the hole, and '
      + 'goes back to Pratt at THE SALE. Doc 111 writes it one LOOK and one LISTEN.',
    responses: { LOOK_AT: [{ say: said('THE HEN', 'LOOK') }], LISTEN_TO: [{ say: said('THE HEN', 'LISTEN') }] },
    ...pending('hen'),
  }));
  out.push(write('content/items/raccoon-in-coat.json', {
    schema: 1, id: 'raccoon_in_coat', name: 'THE RACCOON, IN MY COAT', short: 'THE RACCOON, IN MY COAT',
    note: 'EXTRACTED from docs/111-scenes-b-and-c.md (THE LINES, C) by tools/extract-content.mjs (errata 237). Do not edit: change '
      + 'doc 111 and re-run. Thad\'s coat over the raccoon at the hole\'s mouth (USE, with him halfway out); sold to Pratt at THE '
      + 'SALE. Doc 111 writes it one LOOK and one LISTEN.',
    responses: { LOOK_AT: [{ say: said('THE RACCOON, IN MY COAT', 'LOOK') }], LISTEN_TO: [{ say: said('THE RACCOON, IN MY COAT', 'LISTEN') }] },
    ...pending('raccoon_in_coat'),
  }));
  out.push(write('content/items/pratt-money.json', {
    // THE SENTENCE LINE CANNOT HOLD THE WHOLE NAME (tools/check-item-names.mjs: "Listen to MR. PRATT'S TWO DOLLARS AND
    // SIXTY CENTS on THE CATALOGUE — MUSICAL INSTRUMENTS" is 108% of the line). Its short name is the name's own last
    // words, which are Pratt's at THE SALE ("Two dollars and sixty cents."): nothing new is written. For Tyler to confirm.
    schema: 1, id: 'pratt_money', name: "MR. PRATT'S TWO DOLLARS AND SIXTY CENTS", short: 'TWO DOLLARS AND SIXTY CENTS',
    note: 'Named by docs/111-scenes-b-and-c.md (THE SALE) and read by tools/extract-content.mjs (errata 237). Pratt\'s price for the '
      + 'raccoon, counted out at THE SALE; spent at the undertaker\'s exactly as SHENG\'S LOAN was (doc 57 E3.3). Doc 111 writes it one '
      + 'LOOK and one LISTEN.',
    responses: { LOOK_AT: [{ say: said("MR. PRATT'S TWO DOLLARS AND SIXTY CENTS", 'LOOK') }],
      LISTEN_TO: [{ say: said("MR. PRATT'S TWO DOLLARS AND SIXTY CENTS", 'LISTEN') }] },
    ...pending('pratt_money'),
  }));
  return out;
}

/**
 * THE ITEM TRIES (doc 111, C): at the hole, THE SALE, and the wrong tries with the coat and the hen. Pairs, each read from
 * its own line; the money at the undertaker's is doc 57 E3.3's own three cases, the loan's words unchanged.
 */
function estateSalePairs(e3, undertakerSays) {
  const lines = scenesBCLines().split('\n');
  const bullet = (start) => {
    const found = lines.filter((one) => one.startsWith(start));
    if (found.length !== 1) throw new Error(`doc 111: ${found.length} lines start ${start}`);
    return found[0].slice(start.length);
  };
  const ruleOf = (words, by = 'thad') => {
    const { first } = scenesBCWords(words, by, { PRATT: 'pratt', UNDERTAKER: 'undertaker', SHENG: 'sheng' });
    if (!first.length) throw new Error(`doc 111: "${words.slice(0, 40)}" has no words`);
    const [lead, ...rest] = first;
    return { say: lead.line, ...(lead.speaker !== 'thad' ? { by: lead.speaker } : {}), ...(lead.direction ? { direction: true } : {}),
      ...(rest.length ? { then: rest.map((one) => (one.speaker === 'thad' && !one.direction ? one.line : one)) } : {}) };
  };
  const NOTE = 'Doc 111 (THE LINES, C; errata 237)';
  const out = [];
  const raccoonIn = { T_RACCOON_WANTED: true, T_RACCOON_IN_COAT: false };
  const fork = ruleOf(bullet('- USE THE TUNING FORK — '));
  // Each of these answers only in its state; out of it, the item's pools answer (`otherwise`), as doc 57 F5's do.
  out.push({ item: 'tuning_fork', room: 'prosperity', target: 'raccoon', otherwise: 'pool', say: fork.say,
    note: `${NOTE}: the fork on the raccoon in the hole, once Pratt wants him; before that, the fork's own pool.`,
    rules: [{ case: 'in the hole, after T_RACCOON_WANTED', when: raccoonIn, ...fork }] });
  const bait = ruleOf(bullet('- USE THE HEN, *on THE HOLE* — '));
  out.push({ item: 'hen', room: 'prosperity', target: 'hole', otherwise: 'pool', say: bait.say,
    note: `${NOTE}: the hen at the hole's mouth brings the raccoon halfway out (T_RACCOON_OUT). The hen stays with Thad.`,
    rules: [{ case: 'on THE HOLE', when: { ...raccoonIn, T_RACCOON_OUT: false }, ...bait, set: { T_RACCOON_OUT: true } }] });
  const henAgain = ruleOf(bullet('- USE THE HEN, *with the raccoon halfway out* — '));
  out.push({ item: 'hen', room: 'prosperity', target: 'raccoon', otherwise: 'pool', say: henAgain.say,
    note: `${NOTE}: the hen to the raccoon without the coat.`,
    rules: [{ case: 'with the raccoon halfway out', when: { ...raccoonIn, T_RACCOON_OUT: true }, ...henAgain }] });
  // THE SALE: the raccoon in the coat to Pratt. He counts out the money and takes back the hen.
  const saleRows = scenesBCBlock('**THE SALE**').filter((one) => one.startsWith('> '));
  if (!saleRows.length) throw new Error('doc 111: THE SALE has no lines');
  const sale = [];
  let last = 'thad';
  for (const row of saleRows) {
    const named = /^\*\*[A-Z][A-Z.' -]*:\*\*/.test(row.slice(2));
    const words = scenesBCWords(row.slice(2), 'thad', { PRATT: 'pratt' }).first;
    const quotedHere = /"/.test(row.replace(/\*\([^)]*\)\*/g, ''));
    // A line that is only a direction belongs to whoever is acting in the scene, the last named speaker.
    for (const one of words) sale.push(!named && !quotedHere && one.direction ? { ...one, speaker: last } : one);
    if (named) last = words.at(-1).speaker;
  }
  if (!/→ MR\. PRATT'S TWO DOLLARS AND SIXTY CENTS; THE HEN and THE RACCOON, IN MY COAT leave inventory/.test(saleRows.at(-1))) {
    throw new Error('doc 111: THE SALE no longer ends in the money, the hen and the raccoon leaving inventory');
  }
  const [lead, ...rest] = sale;
  out.push({ item: 'raccoon_in_coat', room: 'pratts_claim', target: 'pratt', otherwise: 'pool', say: lead.line,
    note: `${NOTE}, THE SALE: the raccoon, in the coat, to Pratt. He counts out MR. PRATT'S TWO DOLLARS AND SIXTY CENTS and takes back `
      + 'the hen; the raccoon goes with him (T_RACCOON_SOLD).',
    rules: [{ case: 'THE SALE', when: { T_RACCOON_SOLD: false }, holds: ['hen'], say: lead.line,
      ...(lead.speaker !== 'thad' ? { by: lead.speaker } : {}), ...(lead.direction ? { direction: true } : {}),
      then: rest.map((one) => (one.speaker === 'thad' && !one.direction ? one.line : one)),
      takes: ['raccoon_in_coat', 'hen'], items: ['pratt_money'], set: { T_RACCOON_SOLD: true } }] });
  // THE UNDERTAKER, with the new money: doc 57 E3.3's lines, its gates and its outcome, unchanged.
  out.push({ item: 'pratt_money', room: 'undertaker', target: 'undertaker', puzzle: 'E3', say: e3.paid[0],
    note: `${NOTE}, THE UNDERTAKER: MR. PRATT'S TWO DOLLARS AND SIXTY CENTS on the undertaker, "as Sheng's loan today, doc 57 E3.3: `
      + 'the undertaker\'s lines unchanged" -- the loan\'s three cases, read from doc 57, with the new money spent.',
    rules: [
      { case: 'with T_SOWERBY_PRICE and T_COFFIN_SIZED', when: { T_SOWERBY_PRICE: true, T_COFFIN_SIZED: true, T_FUNERAL_BOOKED: false },
        ...undertakerSays(e3.paid), takes: ['pratt_money'], set: { T_FUNERAL_BOOKED: true }, completes: 'E3' },
      { case: 'before the Reverend\'s figure', when: { T_SOWERBY_PRICE: false }, ...undertakerSays(e3.noFigure) },
      { case: 'before the sizing', when: { T_COFFIN_SIZED: false }, ...undertakerSays(e3.noSizing) },
    ] });
  for (const [start, room, target, item] of [
    ['- **PRATT** · USE THE HEN — ', 'pratts_claim', 'pratt', 'hen'],
    ['- **THE UNDERTAKER** · USE THE RACCOON, IN MY COAT — ', 'undertaker', 'undertaker', 'raccoon_in_coat'],
    ['- **AH-LAM SHENG** · USE THE RACCOON, IN MY COAT — ', 'laundry', 'sheng', 'raccoon_in_coat'],
  ]) {
    const rule = ruleOf(bullet(start));
    out.push({ item, room, target, say: rule.say, note: `${NOTE}, THE WRONG TRIES: ${start.slice(2, -3).replace(/\*\*/g, '')}.`,
      rules: [{ case: 'any time', ...rule }] });
  }
  return out;
}

/**
 * ACT II, THE THREE PAPERS: THE DOUBLE AND THE STAKE (doc 113, THE LINES; errata 242). Tyler, 2026-11-09: "Let's build
 * the act 2 scenes you recommended." What of the scenes is not a room's own hotspot lines (those are
 * tools/extract-examine.mjs's and tools/compile-room.mjs's, from the same sections) is read here, never typed:
 *  - the item A COMPANY LEDGER, its LOOK and LISTEN -> content/items/company-ledger.json;
 *  - THE SWAP (the ledger on THE SUBMISSION LOG, on the funeral day): its direction, then doc 54's own line for the log,
 *    then its closing line -> a pair; the ledger back on THE LEDGERS; the deed and the fork on Pratt on the claim.
 * Which flag each state is and which item each name is are routing, authored here as every ROUTE table is.
 */
const PAPERS_DOC = 'docs/113-act-two-scenes.md';
function papersLines(path = PAPERS_DOC) {
  const doc = read(path);
  const at = doc.indexOf('\n## THE LINES\n');
  if (at < 0) throw new Error(`${path}: no "## THE LINES"`);
  const rest = doc.slice(at + 1);
  const end = rest.indexOf('\n---\n');
  return (end < 0 ? rest : rest.slice(0, end)).split('\n');
}
function papersBullet(start, path = PAPERS_DOC) {
  const found = papersLines(path).filter((one) => one.startsWith(start));
  if (found.length !== 1) throw new Error(`${path}: ${found.length} lines start ${start}`);
  const [words] = found[0].slice(start.length).split('→');
  return words;
}
function papersRule(words, speakers = {}) {
  const { first } = scenesBCWords(words, 'thad', speakers);
  if (!first.length) throw new Error(`doc 113: "${words.slice(0, 40)}" has no words`);
  const [lead, ...rest] = first;
  return { say: lead.line, ...(lead.speaker !== 'thad' ? { by: lead.speaker } : {}), ...(lead.direction ? { direction: true } : {}),
    ...(rest.length ? { then: rest.map((one) => (one.speaker === 'thad' && !one.direction ? one.line : one)) } : {}) };
}
function papersItems() {
  const lines = papersLines();
  const at = lines.findIndex((one) => one === '**A COMPANY LEDGER** *(item)*');
  if (at < 0) throw new Error('doc 113: no **A COMPANY LEDGER** under The item');
  const run = (label) => {
    const row = lines.slice(at + 1, at + 3).find((one) => one.startsWith(`**${label}** `));
    const said = row ? [...row.matchAll(/\d "([^"]+)"/g)].map((m) => m[1]) : [];
    if (said.length !== 3) throw new Error(`doc 113: A COMPANY LEDGER ${label} has ${said.length} lines, not 3`);
    return [{ say: said[0], repeat: said.slice(1) }];
  };
  return [write('content/items/company-ledger.json', {
    schema: 1, id: 'company_ledger', name: 'A COMPANY LEDGER', short: 'A COMPANY LEDGER',
    note: 'EXTRACTED from docs/113-act-two-scenes.md (THE LINES, The item) by tools/extract-content.mjs (errata 242). Do not edit: '
      + 'change doc 113 and re-run. Taken from THE LEDGERS in Fanshawe\'s empty office on the funeral day, and left on his desk in '
      + 'the log\'s place (THE SWAP). Its icon is the log\'s book in green with gilt bands (tools/art/act2-ledger-icon.py).',
    responses: { LOOK_AT: run('LOOK'), LISTEN_TO: run('LISTEN') },
  })];
}
function papersPairs(objects) {
  const NOTE = 'Doc 113 (THE LINES; errata 242)';
  const out = [];
  const NOTE_115 = 'Doc 115 (THE LINES, II-3; errata 244)';
  const office = { T_FUNERAL_DAY: true, T_QUEUE_PADDED: false };
  const refused = (start) => papersRule(papersBullet(start, 'docs/115-the-three-papers.md'));
  // THE SWAP. Doc 54's line for the log is said between the direction and the scene's closing line, unchanged.
  const c4 = read('docs/54-batch-c.md').split('\n').find((one) => one.startsWith('> **THE SUBMISSION LOG** · PICK UP, *empty office* — '));
  const logLine = c4 && quoted(c4)[0];
  if (!logLine) throw new Error('doc 54 C3/C4: no empty-office line for THE SUBMISSION LOG');
  const swap = papersRule(papersBullet('- USE A COMPANY LEDGER — '));
  if (!swap.direction || swap.then?.length !== 1) throw new Error('doc 113 THE SWAP: not a direction and one closing line');
  out.push({ item: 'company_ledger', room: 'fanshawe_office', target: 'submission_log', otherwise: 'pool', puzzle: 'C4', say: swap.say,
    note: `${NOTE}, THE SWAP: the ledger laid where the log lay, and the log taken (THE SUBMISSION LOG, T_QUEUE_PADDED). Doc 54's `
      + 'empty-office line for the log is said after the direction, as doc 113 says.',
    rules: [{ case: 'empty office', when: { ...office, T_LEDGER_PLAIN: true, T_LEDGER_CRACKED: true }, say: swap.say, direction: true,
      then: [logLine, ...swap.then], takes: ['company_ledger'], items: ['padded_log'], set: { T_QUEUE_PADDED: true } },
    // DOC 115, II-3 (errata 244): until the ledger is made ready it is refused, and the refusal says what is wrong.
    { case: 'refused: the gilt and the spine', when: { ...office, T_LEDGER_PLAIN: false, T_LEDGER_CRACKED: false }, ...refused('- *with the gilt on it and the spine whole* — ') },
    { case: 'refused: the spine', when: { ...office, T_LEDGER_PLAIN: true, T_LEDGER_CRACKED: false }, ...refused('- *with the gilt gone and the spine whole* — ') },
    { case: 'refused: the gilt', when: { ...office, T_LEDGER_PLAIN: false, T_LEDGER_CRACKED: true }, ...refused('- *with the spine broken and the gilt on it* — ') }] });
  // THE GILT (doc 115): the Colonel's handkerchief on the ledger, the game's first item on an item; written both ways
  // round (tests/items.test.ts), in his office, where the ledger is taken and left.
  const gilt = refused('- USE THE HANDKERCHIEF — ');
  const giltAgain = refused('- USE THE HANDKERCHIEF, *again* — ');
  for (const [item, target] of [['handkerchief', 'company_ledger'], ['company_ledger', 'handkerchief']]) {
    out.push({ item, room: 'fanshawe_office', target, otherwise: 'pool', say: gilt.say,
      note: `${NOTE_115}, THE GILT: the gilt date rubbed off the ledger's spine with the handkerchief (T_LEDGER_PLAIN).`,
      rules: [{ case: 'the gilt, with the tonic', when: { T_LEDGER_PLAIN: false, T_HANDKERCHIEF_DOSED: true }, ...objects.dosedGilt, set: { T_LEDGER_PLAIN: true } },
        { case: 'the gilt', when: { T_LEDGER_PLAIN: false }, ...gilt, set: { T_LEDGER_PLAIN: true } },
        { case: 'again', when: { T_LEDGER_PLAIN: true }, ...giltAgain }] });
  }
  // THE TONIC ON THE HANDKERCHIEF (doc 118, O-4): a second way to the gilt, in the same office; both ways round.
  for (const [item, target] of [['tonic', 'handkerchief'], ['handkerchief', 'tonic']]) {
    out.push({ item, room: 'fanshawe_office', target, otherwise: 'pool', say: objects.dose.say,
      note: 'Doc 118 (THE LINES, O-4; errata 245): Dr. Purvis on the Colonel\'s handkerchief (T_HANDKERCHIEF_DOSED); the bottle is spent.',
      rules: [{ case: 'dosed', when: { T_HANDKERCHIEF_DOSED: false }, ...objects.dose, takes: ['tonic'], set: { T_HANDKERCHIEF_DOSED: true } }] });
  }
  // THE SPINE (doc 115): the ledger on the chairs.
  const spine = refused('- USE A COMPANY LEDGER — ');
  out.push({ item: 'company_ledger', room: 'fanshawe_office', target: 'chairs', otherwise: 'pool', say: spine.say,
    note: `${NOTE_115}, THE SPINE: the ledger's spine broken in on a chair (T_LEDGER_CRACKED).`,
    rules: [{ case: 'the spine', when: { T_LEDGER_CRACKED: false }, ...spine, set: { T_LEDGER_CRACKED: true } },
      { case: 'again', when: { T_LEDGER_CRACKED: true }, ...refused('- USE A COMPANY LEDGER, *again* — ') }] });
  for (const [start, target] of [['- **THE SABRE** · USE A COMPANY LEDGER — ', 'sabre'], ['- **THE DECANTER** · USE A COMPANY LEDGER — ', 'decanter'],
    ['- **THE PORTRAIT** · USE A COMPANY LEDGER — ', 'portrait']]) {
    const rule = refused(start);
    out.push({ item: 'company_ledger', room: 'fanshawe_office', target, say: rule.say,
      note: `${NOTE_115}, THE WRONG TRIES: ${start.slice(2, -3).replace(/\*\*/g, '')}.`, rules: [{ case: 'any time', ...rule }] });
  }
  const back = papersRule(papersBullet('- **THE LEDGERS** · USE A COMPANY LEDGER — '));
  out.push({ item: 'company_ledger', room: 'fanshawe_office', target: 'ledgers', say: back.say,
    note: `${NOTE}, THE WRONG TRIES: the ledger back on its shelf.`, rules: [{ case: 'any time', ...back }] });
  // THE STAKE: the deed and the fork on Pratt while he is on the claim.
  for (const [start, item] of [['- USE THE DEED TO PROSPERITY — ', 'deed'], ['- USE THE TUNING FORK — ', 'tuning_fork']]) {
    const rule = papersRule(papersBullet(start), { PRATT: 'pratt_jump' });
    out.push({ item, room: 'prosperity', target: 'pratt_jump', otherwise: 'pool', say: rule.say,
      note: `${NOTE}, B · The stake: ${start.slice(2, -3)} on Pratt, on the claim.`, rules: [{ case: 'on the claim', ...rule }] });
  }
  return out;
}

/**
 * OBJECTS, FIRST PASS (doc 117 rows O-1 to O-7; doc 118, THE LINES; errata 245). Tyler, 2026-11-09: "All". What is not a
 * room's own hotspot lines is read here from doc 118, never typed: the items and their LOOK and LISTEN, the pairs, and
 * the two tree rows that change (PRA_B1 option 7 on the claim, FRA_A1's notice). Flags and ids are routing.
 */
const OBJECTS_DOC = 'docs/118-objects-the-lines.md';
const objectsRule = (start, speakers = {}) => papersRule(papersBullet(start, OBJECTS_DOC), speakers);
/** The `> ` lines under the line starting `head`, as an exchange; a line that is only a direction is the last speaker's. */
function objectsBlock(head, speakers = {}, doc = OBJECTS_DOC) {
  const rows = papersLines(doc);
  const at = rows.findIndex((one) => one.startsWith(head));
  if (at < 0) throw new Error(`doc 118: no line starting ${head}`);
  const block = [];
  for (const row of rows.slice(at + 1)) {
    if (!row.startsWith('> ')) { if (block.length) break; continue; }
    block.push(row.slice(2));
  }
  if (!block.length) throw new Error(`doc 118: ${head} has no lines`);
  const nameOf = (body) => /^\*\*([A-Z][A-Z.' -]*):\*\*/.exec(body)?.[1];
  const who = (name) => (name === 'THAD' ? 'thad' : speakers[name]);
  const out = [];
  block.forEach((body, n) => {
    const name = nameOf(body);
    const words = scenesBCWords(body.replace(/^\*\*THAD:\*\* /, ''), 'thad', speakers).first;
    const spoken = /"/.test(body.replace(/\*\([^)]*\)\*/g, ''));
    if (spoken) { out.push(...words); return; }
    // No words of anyone's: a direction or a pause, by whoever is named next (or last, at the end).
    const next = block.slice(n + 1).map(nameOf).find(Boolean) ?? block.slice(0, n).map(nameOf).filter(Boolean).at(-1);
    const by = (next && who(next)) || 'thad';
    out.push(...words.map((one) => ({ ...one, speaker: by })));
    void name;
  });
  return out;
}
/** PRA_B1 option 7 on the claim (doc 118, O-1): the figure told, and Pratt has never seen one. The turn is the chalk's. */
function toldTheFigure(option) {
  const said = objectsBlock('**`PRA_B1` option 7**', { PRATT: 'pratt' });
  const turn = option.exchange ?? [];
  if (said[0].line !== turn[0]?.line) throw new Error('doc 118 O-1: its first line is not doc 04 PRA_D5\'s first line');
  const { goto, set, puzzle, ...rest } = option;
  return { ...rest, afterUse: 'retain', exchange: said, repeat: said.at(-1).line, set: { T_FIGURE_TOLD: true } };
}
/** Doc 04's PRA_D5, the turn and what follows "He signs", as an exchange in order. */
function prattTurnLines() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('## `PRA_D5`');
  if (from < 0) throw new Error('doc 04: no PRA_D5');
  const body = doc.slice(from, doc.indexOf('\n---', from));
  const out = [];
  for (const row of body.split('\n').filter((one) => one.startsWith('> '))) {
    const spoken = /^> \*\*([A-Z]+):\*\* (.+)$/.exec(row);
    if (!spoken) continue;
    const speaker = spoken[1] === 'THAD' ? 'thad' : 'pratt';
    for (const d of spoken[2].matchAll(/\*\(([^)]+)\)\*/g)) {
      const shown = performedDirection(d[1]);
      // As PRA_B1's own extraction has it: a held beat is said ("…"); a staging note on a line is not shown.
      if (shown && !shown.direction) out.push({ speaker, line: shown.line });
    }
    const said = quoted(spoken[2].replace(/\*\([^)]*\)\*/g, ''));
    if (said.length !== 1) throw new Error(`doc 04 PRA_D5: "${spoken[2]}" is not one line`);
    out.push({ speaker, line: said[0] });
  }
  if (out.length < 8) throw new Error('doc 04 PRA_D5: the turn does not read');
  return out;
}
function objectsItems() {
  const rows = papersLines(OBJECTS_DOC);
  const item = (heading, id, name, about) => {
    const at = rows.findIndex((one) => one === `**${heading}** *(item)*`);
    if (at < 0) throw new Error(`doc 118: no **${heading}** *(item)*`);
    const run = (label) => {
      const row = rows.slice(at + 1, at + 3).find((one) => one.startsWith(`**${label}** `));
      const said = row ? [...row.matchAll(/\d "([^"]+)"/g)].map((m) => m[1]) : [];
      if (said.length !== 3) throw new Error(`doc 118: ${heading} ${label} has ${said.length} lines, not 3`);
      return [{ say: said[0], repeat: said.slice(1) }];
    };
    return write(`content/items/${id.replace(/_/g, '-')}.json`, {
      schema: 1, id, name: heading, short: heading,
      note: `EXTRACTED from ${OBJECTS_DOC} (THE LINES) by tools/extract-content.mjs (errata 245). Do not edit: change doc 118 and re-run. ${about}`,
      responses: { LOOK_AT: run('LOOK'), LISTEN_TO: run('LISTEN') },
    });
  };
  return [
    item('A STUB OF CHALK', 'chalk', 'A STUB OF CHALK', 'Taken from its tin in the Nugget\'s back room. What the turn of Pratt is written with, on Thad\'s own stake; kept.'),
    item('THE FUNERAL NOTICE', 'funeral_notice', 'THE FUNERAL NOTICE', 'Handed over by Frame; posted on Main Street, which begins the funeral day.'),
    item('THE HOTEL\'S LAMP', 'hotel_lamp', 'THE HOTEL\'S LAMP', 'Taken from Thad\'s room in Act IV for the dig; kept.'),
    item('A HYMNAL', 'hymnal', 'A HYMNAL', 'Taken from his pew in the church (errata 246). With it he can stand in the line of mourners on the hill; kept.'),
    item('THE COLONEL\'S WREATH', 'wreath', 'THE COLONEL\'S WREATH', 'Taken from Pike\'s marker once the town has gone down (errata 246); laid on his own coffin in Act III. Nothing depends on it.'),
  ];
}
/**
 * THE BOUNDARY, WALKED (doc 120 I-3, THE LINES; errata 251): the rule that begins it, on the pair of the map and Madame
 * Ozymandia. Doc 57 A7's direction as far as the rod not moving, then her handing him the rod. It holds until A7 is
 * done, so a save that already has its survey is never sent round again. Doc 120's home line must end in doc 57's
 * three lines, word for word.
 */
function boundaryWalked(doc57Lines) {
  const DOC = 'docs/120-act-one-by-hand.md';
  const [lead, ...rest] = objectsBlock('**MADAME OZYMANDIA** · USE THE COMPANY MAP, *once she is paid*', { OZYMANDIA: 'ozymandia' }, DOC);
  const a7 = read('docs/57-puzzle-completion.md');
  if (!a7.includes(lead.line)) throw new Error('doc 120 I-3: the unrolling is not doc 57 A7\'s own direction, word for word');
  const home = papersBullet('- USE, *home* — ', DOC);
  for (const one of doc57Lines) if (!home.includes(`"${one.line}"`)) throw new Error(`doc 120 I-3: home does not end in doc 57 A7's "${one.line}"`);
  return { case: 'the map unrolled', when: { T_OZY_PAID: true, T_SURVEYING: false }, untilPuzzles: ['A7'],
    say: lead.line, direction: true, by: 'ozymandia', then: rest.map((one) => (one.speaker === 'thad' && !one.direction ? one.line : one)),
    set: { T_SURVEYING: true, SURVEY_LEG: 0 } };
}
/**
 * THE NOT-DONE LIST (doc 121, THE LINES; errata 250). Seven objects, each `**NAME** *(item)*` with its LOOK and LISTEN
 * runs, and the places they go, read from doc 121 and never typed. Flags and ids are routing.
 */
const NOT_DONE_DOC = 'docs/121-the-not-done-list.md';
const NOT_DONE_ITEMS = [
  ['A NAIL', 'nail', 'One nail from the mercantile\'s keg. With it the letter of introduction is fixed to Pike\'s board; it leaves with the letter.'],
  ['A HANDFUL OF OATS', 'oats', 'From Grievance\'s feed bin at the livery. The hen eats them.'],
  ['A SPRIG OF PARSLEY', 'parsley', 'Off the contract at the Colonel\'s dinner. It goes in the raccoon\'s lapel in Act III.'],
  ['A CAPITAL B', 'capital_b', 'A worn sort from the Clarion\'s type case. Laid on his own coffin.'],
  ['MR. PIKE\'S COLLAR', 'pikes_collar', 'Six years uncollected at the laundry. It goes round the raccoon\'s neck in Act III.'],
  ['A BUTTON', 'button', 'Out of the church\'s bolted collection plate. It goes on the raccoon\'s coat in Act III.'],
  ['MY ROOM KEY', 'room_key', 'Off the hotel\'s key rack once he has a room. It locks the wardrobe; kept.'],
];
function notDoneItems() {
  const rows = papersLines(NOT_DONE_DOC);
  return NOT_DONE_ITEMS.map(([heading, id, about]) => {
    const at = rows.findIndex((one) => one === `**${heading}** *(item)*`);
    if (at < 0) throw new Error(`doc 121: no **${heading}** *(item)*`);
    const run = (label) => {
      const row = rows.slice(at + 1, at + 3).find((one) => one.startsWith(`**${label}** `));
      const said = row ? [...row.matchAll(/\d "([^"]+)"/g)].map((m) => m[1]) : [];
      if (said.length !== 3) throw new Error(`doc 121: ${heading} ${label} has ${said.length} lines, not 3`);
      return [{ say: said[0], repeat: said.slice(1) }];
    };
    return write(`content/items/${id.replace(/_/g, '-')}.json`, {
      schema: 1, id, name: heading, short: heading,
      note: `EXTRACTED from ${NOT_DONE_DOC} (THE LINES) by tools/extract-content.mjs (errata 250). Do not edit: change doc 121 and re-run. ${about}`,
      // Pending only while the shipping sheet has no cell for it (errata 238's rule; the seven arrived with errata 254).
      ...(JSON.parse(readFileSync(resolve(ROOT, 'content/ui/item-icons.json'), 'utf8')).icons[id] ? {} : { iconPending: 'reference/objects-second-pass/brief.md asks the image session for it (errata 250); the panel draws its labelled box meanwhile.' }),
      responses: { LOOK_AT: run('LOOK'), LISTEN_TO: run('LISTEN') },
    });
  });
}
/** Where the raccoon is carried in his coat: the claim, Mr. Pratt's, and the ground between. */
const RACCOON_ROOMS = ['prosperity', 'pratts_claim', 'claim_row', 'claims_road'];
/**
 * GIVE (doc 127; errata 282; Tyler, 2026-11-11: "Add GIVE as a 10th verb"). The hand-overs, by item and person,
 * and the verb each now answers; the lookout's "anything else"; and Thad's lines for a GIVE nothing answers. Read
 * from the document, never typed here.
 */
function givePlan() {
  const doc = read('docs/127-give.md');
  const rows = [...doc.matchAll(/^\| `([a-z0-9_]+)` \| `([a-z0-9_]+)` \| (GIVE|Either) \|$/gm)]
    .map(([, item, target, verb]) => ({ item, target, verbs: verb === 'Either' ? ['USE', 'GIVE'] : ['GIVE'] }));
  if (rows.length < 20) throw new Error(`doc 127: read ${rows.length} hand-overs, expected the table`);
  const bullets = (heading) => {
    const at = doc.indexOf(`**${heading}:**`);
    if (at < 0) throw new Error(`doc 127: no "${heading}"`);
    const rest = doc.slice(at).split('\n').slice(1);
    const lines = [];
    for (const line of rest) {
      if (!line.trim()) { if (lines.length) break; continue; }
      const m = /^- "(.+)"$/.exec(line.trim());
      if (!m) break;
      lines.push(m[1]);
    }
    if (!lines.length) throw new Error(`doc 127: "${heading}" has no lines`);
    return lines;
  };
  return {
    rows,
    people: bullets('GIVE, to a person'),
    things: bullets('GIVE, to a thing that is not a person'),
    emptyPerson: bullets('GIVE, with nothing in hand, to a person'),
    emptyThing: bullets('GIVE, with nothing in hand, to a thing'),
  };
}

function applyGive(pairs, targetPools, give) {
  for (const row of give.rows) {
    const found = pairs.filter((pair) => pair.item === row.item && pair.target === row.target);
    if (!found.length) throw new Error(`doc 127: no pair gives ${row.item} to ${row.target}`);
    for (const pair of found) pair.verbs = row.verbs;
  }
  // Doc 109's THE LOOKOUT · GIVE anything else, built as USE before the verb existed.
  for (const pool of targetPools) if (pool.target === 'gulch_lookout' && pool.verb === 'USE') pool.verb = 'GIVE';
  // GIVE with nothing in hand: the verb's own fallback, beside the other verbs' (content/ui/verb-fallbacks.json).
  const fallbacks = JSON.parse(read('content/ui/verb-fallbacks.json'));
  fallbacks.pools.GIVE = give.emptyThing;
  fallbacks.people.GIVE = give.emptyPerson;
  write('content/ui/verb-fallbacks.json', fallbacks);
}

function notDonePairs(pairs) {
  const NOTE = 'Doc 121 (THE LINES; errata 250)';
  const rule = (start, speakers = {}) => papersRule(papersBullet(start, NOT_DONE_DOC), speakers);
  // N-2 THE LETTER, DELIVERED: with a nail in hand and the memorial booked, ahead of doc 120's beat at the board.
  const board = pairs.find((one) => one.item === 'letter' && one.target === 'pike_s_marker' && one.room === 'boot_hill');
  if (!board) throw new Error('doc 121: no pair holds the letter out to Pike\'s board (doc 120) to put the delivery ahead of');
  const ready = { T_MEMORIAL_BOOKED: true, T_NAIL_TAKEN: true, T_LETTER_DELIVERED: false };
  const delivered = { case: 'delivered, with a nail', when: ready, ...rule('- USE THE LETTER, *with a nail* — '),
    takes: ['letter', 'nail'], set: { T_LETTER_DELIVERED: true } };
  board.rules.unshift(delivered);
  const idle = rule('- USE A NAIL — ');
  pairs.push({ item: 'nail', room: 'boot_hill', target: 'pike_s_marker', say: idle.say,
    note: `${NOTE}, N-2: the nail on Pike's board. With the letter done with at the church, it is the delivery, either way round.`,
    rules: [delivered, { case: 'without the letter\'s leave', ...idle }] });
  const posted = rule('- **THE POSTED NOTICES** · USE A NAIL — ');
  pairs.push({ item: 'nail', room: 'main_street', target: 'posted_notices', say: posted.say,
    note: `${NOTE}, N-2, THE WRONG TRIES: THE POSTED NOTICES · USE A NAIL.`, rules: [{ case: 'any time', ...posted }] });
  // N-4 THE OATS on the hen, either way round, where she is carried.
  const fed = rule('- USE A HANDFUL OF OATS — ');
  for (const room of RACCOON_ROOMS) {
    for (const [item, target] of [['oats', 'hen'], ['hen', 'oats']]) {
      pairs.push({ item, room, target, otherwise: 'pool', say: fed.say,
        note: `${NOTE}, N-4: the oats fed to the hen, either way round. They leave.`, rules: [{ case: 'fed', ...fed, takes: ['oats'] }] });
    }
  }
  // N-3 THE RACCOON, DRESSED: three things on the raccoon in his coat, either way round, once each.
  for (const [start, item] of [['- USE A BUTTON — ', 'button'], ['- USE MR. PIKE\'S COLLAR — ', 'pikes_collar'], ['- USE A SPRIG OF PARSLEY — ', 'parsley']]) {
    const dressed = rule(start);
    for (const room of RACCOON_ROOMS) {
      for (const [a, b] of [[item, 'raccoon_in_coat'], ['raccoon_in_coat', item]]) {
        pairs.push({ item: a, room, target: b, otherwise: 'pool', say: dressed.say,
          note: `${NOTE}, N-3: ${start.slice(6, -3)} on the raccoon in his coat, either way round. It leaves with him.`,
          rules: [{ case: 'dressed', ...dressed, takes: [item] }] });
      }
    }
  }
  // N-4 THE B on his own coffin, and shown to the man who wore it out.
  const buried = rule('- USE A CAPITAL B — ');
  pairs.push({ item: 'capital_b', room: 'funeral', target: 'coffin', say: buried.say,
    note: `${NOTE}, N-4: the worn B laid on his own coffin. It leaves. Nothing reads it.`, rules: [{ case: 'laid', ...buried, takes: ['capital_b'] }] });
  const kept = rule('- **IGNATIUS FRAME** · USE A CAPITAL B — ', { FRAME: 'frame' });
  pairs.push({ item: 'capital_b', room: 'clarion', target: 'frame', otherwise: 'pool', say: kept.say,
    note: `${NOTE}, N-4, THE WRONG TRIES: IGNATIUS FRAME · USE A CAPITAL B.`, rules: [{ case: 'any time', ...kept }] });
  // N-4 THE KEY in the wardrobe.
  pairs.push({ item: 'room_key', room: 'thads_room', target: 'wardrobe', say: rule('- USE MY ROOM KEY, *the first time* — ').say,
    note: `${NOTE}, N-4: his room key locks the wardrobe that drifts open in the night. Nothing reads T_WARDROBE_LOCKED but the second line.`,
    rules: [{ case: 'the first time', when: { T_WARDROBE_LOCKED: false }, ...rule('- USE MY ROOM KEY, *the first time* — '), set: { T_WARDROBE_LOCKED: true } },
      { case: 'again', when: { T_WARDROBE_LOCKED: true }, ...rule('- USE MY ROOM KEY, *again* — ') }] });
}
/**
 * ACT I, BY HAND (doc 120, THE LINES; errata 248). The small rows that are item pairs, read from doc 120 and never typed:
 *  - THE LETTER held out to PIKE'S MARKER (I-2): a beat; nothing is taken.
 *  - DR. PURVIS'S TONIC on THE PICKLED EGGS, either way round, at the hole: the eggs improved (the tonic is kept), and
 *    the improved eggs at the hole, ahead of the egg's own answer there.
 *  - THE OBITUARY tucked under THE COLONEL'S WREATH's ribbon, either way round, where the wreath is carried; and the
 *    undertaker's second line when it is laid with its card in.
 * Flags and ids are routing.
 */
const ACT_ONE_DOC = 'docs/120-act-one-by-hand.md';
function actOnePairs(pairs) {
  const NOTE = 'Doc 120 (THE LINES; errata 248)';
  const rule = (start, speakers = {}) => papersRule(papersBullet(start, ACT_ONE_DOC), speakers);
  pairs.push({ item: 'letter', room: 'boot_hill', target: 'pike_s_marker', say: rule('- USE THE LETTER, *the first time* — ').say,
    note: `${NOTE}, I-2: the letter of introduction held out to Pike's board. Nothing is written but that it was done; the letter stays (C3 wants it).`,
    rules: [{ case: 'the first time', when: { T_LETTER_OFFERED: false }, ...rule('- USE THE LETTER, *the first time* — '), set: { T_LETTER_OFFERED: true } },
      { case: 'again', when: { T_LETTER_OFFERED: true }, ...rule('- USE THE LETTER, *again* — ') }] });
  const improve = rule('- USE DR. PURVIS\'S TONIC — ');
  for (const [item, target] of [['tonic', 'eggs'], ['eggs', 'tonic']]) {
    pairs.push({ item, room: 'prosperity', target, otherwise: 'pool', say: improve.say,
      note: `${NOTE}: Dr. Purvis's tonic on the pickled eggs, either way round, at the claim. The tonic is not spent (doc 118's handkerchief wants it later).`,
      rules: [{ case: 'improved', when: { T_EGGS_IMPROVED: false }, ...improve, set: { T_EGGS_IMPROVED: true } }] });
  }
  const atHole = pairs.find((one) => one.item === 'eggs' && one.target === 'hole' && one.room === 'prosperity');
  if (!atHole) throw new Error('doc 120: no pair for the eggs at the hole to put the improved eggs ahead of');
  const meeting = atHole.rules.findIndex((one) => one.takes?.includes('eggs'));
  if (meeting < 0) throw new Error('doc 120: the eggs at the hole have no rule that spends them');
  atHole.rules.splice(meeting, 0, { case: 'improved, with the raccoon in', when: { ...atHole.rules[meeting].when, T_EGGS_IMPROVED: true },
    ...rule('- USE THE PICKLED EGGS, *improved* — '), takes: ['eggs'] });
  const card = rule('- USE THE OBITUARY — ');
  for (const room of ['boot_hill', 'funeral']) {
    for (const [item, target] of [['obituary', 'wreath'], ['wreath', 'obituary']]) {
      pairs.push({ item, room, target, otherwise: 'pool', say: card.say,
        note: `${NOTE}: the obituary tucked under the wreath's ribbon, where a card goes, either way round. It leaves with the wreath.`,
        rules: [{ case: 'the card', when: { T_WREATH_CARDED: false }, ...card, takes: ['obituary'], set: { T_WREATH_CARDED: true } }] });
    }
  }
  const laid = pairs.find((one) => one.item === 'wreath' && one.target === 'coffin');
  if (!laid) throw new Error('doc 120: no pair lays the wreath on the coffin');
  const more = objectsBlock('**THE COFFIN** · USE THE COLONEL\'S WREATH, *with the card in it*', { 'THE UNDERTAKER': 'funeral_undertaker' }, ACT_ONE_DOC);
  const [bare] = laid.rules;
  laid.rules = [{ ...bare, case: 'laid, with its card', when: { T_WREATH_CARDED: true },
    then: [...(bare.then ?? []), ...more.map((one) => (one.speaker === 'thad' ? one.line : one))] },
  { ...bare, when: { T_WREATH_CARDED: false } }];
}
function objectsPairs(prattTurn) {
  const NOTE = 'Doc 118 (THE LINES; errata 245)';
  const out = [];
  // O-1 THE TURN, CHALKED. Doc 04's PRA_D5 from "For the mud." on, word for word, with doc 118's two directions: the
  // first in place of the figure (said already, at option 7), the second before Pratt's sum.
  const [figure, ...turn] = prattTurn;
  const written = objectsBlock('**THE CLAIM MARKER** · USE A STUB OF CHALK, *after that, Pratt on the claim*', { PRATT: 'pratt_jump' });
  const directions = written.filter((one) => one.direction && !/pause/.test(one.line));
  if (directions.length !== 2) throw new Error(`doc 118 O-1: ${directions.length} directions in the chalked turn, not 2`);
  const sum = turn.findIndex((one) => /hundred and four/.test(one.line));
  if (sum < 0 || !figure) throw new Error('doc 04 PRA_D5: no sum to chalk');
  const who = (one) => (one.speaker === 'pratt' ? { ...one, speaker: 'pratt_jump' } : one);
  const lines = [...turn.slice(0, sum).map(who), { ...directions[1], speaker: 'pratt_jump' }, ...turn.slice(sum).map(who)];
  for (const one of written.filter((w) => !w.direction && w.line !== '…')) {
    if (!turn.some((t) => t.line === one.line)) throw new Error(`doc 118 O-1: "${one.line}" is not doc 04 PRA_D5's`);
  }
  const on = { ACT: { atLeast: 2 }, T_PRATT_TURNED: false };
  out.push({ item: 'chalk', room: 'prosperity', target: 'claim_marker', otherwise: 'pool', puzzle: 'D5', say: directions[0].line,
    note: `${NOTE}, O-1: the figure chalked on Thad's own stake, and Pratt's sum under it -- doc 04's PRA_D5, word for word, with the arithmetic where both can see it (T_PRATT_TURNED, D5).`,
    rules: [{ case: 'the turn', when: { ...on, T_FIGURE_TOLD: true }, say: directions[0].line, direction: true,
      then: lines.map((one) => (one.speaker === 'thad' && !one.direction ? one.line : one)), set: { T_PRATT_TURNED: true }, completes: 'D5' },
    { case: 'before the figure is told', when: { ...on, T_FIGURE_TOLD: false }, ...objectsRule('- USE A STUB OF CHALK — ') }] });
  for (const [start, target] of [['- **NICKEL PRATT** · USE A STUB OF CHALK — ', 'pratt_jump'], ['- **THE HOLE** · USE A STUB OF CHALK — ', 'hole']]) {
    const rule = objectsRule(start, { PRATT: 'pratt_jump' });
    out.push({ item: 'chalk', room: 'prosperity', target, ...(target === 'pratt_jump' ? { otherwise: 'pool' } : {}), say: rule.say,
      note: `${NOTE}, O-1, THE WRONG TRIES: ${start.slice(2, -3).replace(/\*\*/g, '')}.`, rules: [{ case: 'any time', ...rule }] });
  }
  // O-2 THE NOTICE, POSTED: the funeral day begins, and the street is come back to as it then is.
  const posted = objectsBlock('**THE POSTED NOTICES** · USE THE FUNERAL NOTICE');
  out.push({ item: 'funeral_notice', room: 'main_street', target: 'posted_notices', say: posted[0].line,
    note: `${NOTE}, O-2: the notice put up on Main Street begins the funeral day (T_FUNERAL_DAY), which Frame's printing used to.`,
    rules: [{ case: 'posted', say: posted[0].line, direction: true, then: posted.slice(1).map((one) => one.line),
      takes: ['funeral_notice'], set: { T_FUNERAL_DAY: true, T_NOTICE_IN_HAND: false, T_FUNERAL_HILL_SAID: false }, goto: 'main_street' }] });
  // The notice shown to the Reverend, before it is up (THE WRONG TRIES).
  const shown = objectsRule('- **REVEREND SOWERBY** · USE THE FUNERAL NOTICE — ', { SOWERBY: 'sowerby' });
  out.push({ item: 'funeral_notice', room: 'church', target: 'sowerby', otherwise: 'pool', say: shown.say,
    note: `${NOTE}, O-2, THE WRONG TRIES: REVEREND SOWERBY · USE THE FUNERAL NOTICE.`, rules: [{ case: 'any time', ...shown }] });
  // O-6 THE WREATH on his own coffin (errata 246). Nothing depends on it; the undertaker has a line.
  const laid = objectsBlock('**THE COFFIN** · USE THE COLONEL\'S WREATH', { 'THE UNDERTAKER': 'funeral_undertaker' });
  out.push({ item: 'wreath', room: 'funeral', target: 'coffin', say: laid[0].line,
    note: 'Doc 118 (THE LINES; errata 246), O-6: the Colonel\'s wreath laid on Thad\'s own coffin. Nothing reads T_WREATH_LAID.',
    rules: [{ case: 'laid', say: laid[0].line, direction: true, then: laid.slice(1).map((one) => (one.speaker === 'thad' ? one.line : one)),
      takes: ['wreath'], set: { T_WREATH_LAID: true } }] });
  // II-1 (doc 115): the fork rung against the plate as it goes by.
  const rung = papersRule(papersBullet('- USE THE TUNING FORK — ', 'docs/115-the-three-papers.md'), {});
  out.push({ item: 'tuning_fork', room: 'boot_hill', target: 'collection_plate', say: rung.say,
    note: 'Doc 115 (THE LINES; errata 246), II-1: the tuning fork on the collection plate in the line.', rules: [{ case: 'any time', ...rung }] });
  // O-4 THE TONIC on the handkerchief, both ways round, wherever he stands; then the dosed handkerchief on the ledger.
  const dose = objectsRule('- USE DR. PURVIS\'S TONIC — ');
  return { pairs: out, dose, dosedGilt: objectsRule('- USE THE HANDKERCHIEF, *dosed* — ') };
}

/**
 * SCENE A, THE HEARSE WON'T GO (doc 110 section 2, THE LINES; errata 233). What of the scene is not a room's own
 * hotspot lines (those are tools/extract-examine.mjs's and tools/compile-room.mjs's, from the same section):
 *  - THE PRAYER, `1. "..."` to `5. "..."` under `**THE PRAYER**`: Sowerby's barks at the gate while `T_HILL_PRAYER`
 *    holds, said on his speaking breaks in turn and round again (barkTurns `onBreaks`), on one counter so a save keeps
 *    its place. Written into content/ambient/procession-sowerby.json.
 *  - THE WRONG TRIES' `**GRIEVANCE, AT THE GATE** · USE THE TUNING FORK — the existing line: "..."`: a pair on her.
 *  - THE HEARSE AND GRIEVANCE as one figure, declared only once its picture is in the repository (errata 159's rule
 *    for the close-ups): reference/act3-hearse/brief.md asks for art/actors/room-14-hearse-grievance.png. Until then
 *    no file and no manifest entry exist, so nothing ships a missing or a wrong picture; the hotspots over where it
 *    stands are the room's (reference/room-14/annotation.json).
 */
const HEARSE_REF = 'docs/110-act-three-scenes.md';
const HEARSE_FIGURE = {
  sheet: 'art/actors/room-14-hearse-grievance.png',
  path: 'content/ambient/procession-hearse.json',
  // The brief's four frames, in its order: rest, a breath, her head turning back to the hearse, a foot stamped once.
  frames: 4,
};
function hearseLines() {
  const doc = read(HEARSE_REF);
  const at = doc.indexOf('\n### THE LINES\n');
  if (at < 0) throw new Error('doc 110: no "### THE LINES"');
  const rest = doc.slice(at + 1);
  return rest.slice(0, rest.indexOf('\n---\n'));
}
function hearsePairs() {
  const body = hearseLines();
  const fork = body.split('\n').find((line) => line.startsWith('- **GRIEVANCE, AT THE GATE** · USE THE TUNING FORK — '));
  const said = fork && /"([^"]+)"/.exec(fork)?.[1];
  if (!said) throw new Error('doc 110, THE WRONG TRIES: no line for the tuning fork on GRIEVANCE, AT THE GATE');
  return [{
    item: 'tuning_fork', room: 'boot_hill', target: 'grievance_at_the_gate', say: said,
    note: 'Doc 110 section 2, THE WRONG TRIES: the fork on Grievance at the gate is answered with B3\'s own line, which '
      + 'doc 110 calls "the existing line" (she has heard it). Read from doc 110 by tools/extract-content.mjs (errata 233).',
  }];
}
function hearseScene() {
  const out = [];
  const body = hearseLines();
  const rows = body.split('\n');
  const start = rows.findIndex((line) => line.startsWith('**THE PRAYER**'));
  if (start < 0) throw new Error('doc 110: no **THE PRAYER**');
  const prayer = [];
  for (const line of rows.slice(start + 1)) {
    const item = /^\d+\. "([^"]+)"\s*$/.exec(line);
    if (item) prayer.push(item[1]);
    else if (line.trim() && prayer.length) break;
  }
  if (prayer.length !== 5) throw new Error(`doc 110, THE PRAYER: ${prayer.length} lines, not the five it writes`);
  const sowerbyPath = 'content/ambient/procession-sowerby.json';
  const sowerby = JSON.parse(read(sowerbyPath));
  Object.assign(sowerby, {
    barks: {},
    barkTurns: [{ counter: 'HILL_PRAYER_SAID', when: { T_HILL_PRAYER: true }, onBreaks: true, lines: prayer,
      source: `${HEARSE_REF}::### THE LINES` }],
    barksNote: 'EXTRACTED from docs/110-act-three-scenes.md (THE PRAYER) by tools/extract-content.mjs. Do not edit: change '
      + 'doc 110 and re-run. While T_HILL_PRAYER holds, said on his speaking breaks, in turn, then round again.',
  });
  out.push(write(sowerbyPath, sowerby, 1));

  // THE FIGURE, ONCE ITS PICTURE IS HERE.
  const drawn = existsSync(resolve(ROOT, HEARSE_FIGURE.sheet));
  const manifestPath = resolve(ROOT, 'content/manifest.json');
  const manifest = readFileSync(manifestPath, 'utf8');
  const listed = manifest.includes(`"${HEARSE_FIGURE.path}"`);
  if (!drawn) {
    if (existsSync(resolve(ROOT, HEARSE_FIGURE.path)) || listed) {
      if (CHECKING) stale.push(HEARSE_FIGURE.path);
      else throw new Error(`${HEARSE_FIGURE.path} is declared and ${HEARSE_FIGURE.sheet} is not drawn: remove the file and its manifest line`);
    }
    return out;
  }
  // Frames side by side with the cast sheets' two-pixel gutter (tools/art/room31-cast.py's layout).
  const png = readFileSync(resolve(ROOT, HEARSE_FIGURE.sheet));
  const width = png.readUInt32BE(16);
  const height = png.readUInt32BE(20);
  const frameW = (width - 2 * (HEARSE_FIGURE.frames + 1)) / HEARSE_FIGURE.frames;
  if (!Number.isInteger(frameW)) throw new Error(`${HEARSE_FIGURE.sheet}: ${width} px is not ${HEARSE_FIGURE.frames} frames with a 2 px gutter`);
  const frames = Array.from({ length: HEARSE_FIGURE.frames }, (_, n) => [2 + n * (frameW + 2), 2, frameW, height - 4]);
  out.push(write(HEARSE_FIGURE.path, {
    schema: 1, id: 'procession_hearse', name: 'GRIEVANCE', posture: 'animal', room: 'boot_hill',
    when: { T_PROCESSION_STALLED: true },
    note: 'THE HEARSE AND GRIEVANCE AT THE GATE (doc 110 section 2; reference/act3-hearse/brief.md operation 1): the '
      + 'coffin inside, behind the glass; Grievance in her black harness, facing up the hill, her head turned back to the '
      + 'hearse. Examined through THE HEARSE and GRIEVANCE, AT THE GATE. Declared by tools/extract-content.mjs once the '
      + 'picture is in the repository (errata 233). Drawn at Room 14\'s man at the gate, 298 px (reference/act3-hearse/'
      + 'handback.md), and stood on the open grass right of Mott\'s obelisk, which the hitch would cover in the gate itself '
      + '(Tyler, 2026-11-09, of the first check render). Her size is ruled in content/scale-anchors.json.',
    x: 1215, y: 792, zone: 0, approachRadius: 0, tree: '', barks: {}, barksNote: 'She does not speak.',
    sprite: { sheet: HEARSE_FIGURE.sheet, frames, figureHeight: 298, stature: 1, rate: 0.2, phase: 0.7,
      breaks: [[2, 2, 2, 0], [3, 3, 0], [1, 1, 0]], breakEvery: 7, talkFrame: 0,
      frameNote: '0 rest, her head turned back a little toward the hearse · 1 a breath (derived) · 2 her head turned fully '
        + 'back, at the hearse · 3 a front hoof stamped once (reference/act3-hearse/handback.md). The hearse is the same in all four.' },
  }, 1));
  if (!listed) {
    const anchor = '"content/ambient/procession-mourners.json"';
    if (!manifest.includes(anchor)) throw new Error('content/manifest.json does not list the mourners to add the hearse after');
    if (CHECKING) stale.push('content/manifest.json');
    else writeFileSync(manifestPath, manifest.replace(anchor, `${anchor},\n  "${HEARSE_FIGURE.path}"`));
  }
  return out;
}

const written = [opening(), stageDriver(), combinations(), seanceTree(), ...estateSaleItems(), ...papersItems(), ...objectsItems(), ...notDoneItems(), ...hearseScene(), ...rooms0507(), ...room02Exits(),
  ...roomsBatchA(), ...minorTrees(), openingCase(), winnieTree(), hobTree(), hobRunning(), ozymandiaAtProsperity(), sumpTree(), frameTree(), fanshaweTree(), liveryTree(), ozymandiaTree(), sowerbyTree(), raccoonTree(), ...prattTree(), shengTree(), lettersHome(), actCards(), ...actTwoItems(), ...gulchItems(), ...gulchPeople(), ...storeItems(), assay(), exitPool(), ...townBarks(), ...townTrees(), reputation(), actedDirections(), cutaways(), ...waysOut()];
if (!CHECKING) {
  for (const path of written) process.stdout.write(`extracted ${path}\n`);
  // Doc 58 rule 5: a reply whose spoken lines this pass reads differently is
  // left as it was, and named here so the gap is never silent.
  for (const line of directionReport) process.stderr.write(`doc 58: ${line}\n`);
} else {
  for (const path of stale) process.stdout.write(`stale: ${path}\n`);
  process.stdout.write(`${written.length} extracted file(s) checked, ${stale.length} stale\n`);
  if (stale.length > 0) process.exit(1);
}
