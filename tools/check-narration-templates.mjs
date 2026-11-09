/**
 * THAD'S NARRATION HABITS, COUNTED (errata 226).
 *
 * The feel review of errata 221's playthrough heard Thad reach for the same
 * shapes: "four minutes" five times, "The first X in Y" four, two lines in a
 * row built on "…which I am told is…". Each line is fine alone; a habit is a
 * thing only the whole game shows, so this reads the whole game.
 *
 * THAD'S LINES are everything he says in the content the game can reach from
 * its start room (so the engine's test harness rooms and tree are not his):
 * his verb lines with their repeats and overrides, the verb pools, his
 * arrival and act lines, the words of every option he picks or its echo, his
 * counters in the Assay, and every `{speaker, line}` that is his. A stage
 * direction is not narration.
 *
 * WHAT IS COUNTED IS SUBJECTS, NOT LINES. Every line belongs to the thing it
 * is said about: a hotspot, an item's verb, an item pair, a tree's node, an
 * arrival. Three LOOKs at the loose board all say "loose board", and that is
 * the board, not a habit; "four minutes" said of four pianos is a habit. A
 * line written twice (the same pair under two items) is one line.
 *
 * A PHRASE is a run of three to five words inside one line, with its leading
 * and trailing stopwords taken off ("in four minutes" and "four minutes ago"
 * are both "four minutes"), and at least two words left -- except that five
 * words around a single one are kept whole, because that is what a sentence
 * shape looks like ("which I am told is", "it is the only thing"). A phrase of nothing
 * but stopwords and names says nothing about a habit and is not counted. A
 * name is what Thad capitalises mid-sentence nearly every time: a word
 * ("Pike") or a run of words ("Main Street", "Boot Hill"). A shorter phrase
 * found under exactly the same subjects as a longer one is the longer one.
 *
 * REPORTED: every phrase under more than two subjects, ranked by count.
 * FAILED: a phrase under four or more, unless content/checks/narration-allowlist.json
 * lists it with a `why` that quotes a ruling.
 */
import { pathToFileURL } from 'node:url';

import { Report, readJson, runCheck } from './lib/content.mjs';

export const ALLOWLIST_PATH = 'content/checks/narration-allowlist.json';
/** Listed above this many subjects. */
export const REPORT_OVER = 2;
/** Failed at this many subjects, unless allowlisted. */
export const FAIL_AT = 4;
export const RULING = /errata \d+|doc \d+|Tyler/i;
/** Capitalised this often mid-sentence, a word or a run of words is a name. */
const NAME_SHARE = 0.8;

/** English function words. Not content: no word of the game's is here. */
const STOPWORDS = new Set(`a an the and or but nor so yet if then than that this these those there here
  i me my mine myself you your yours yourself he him his himself she her hers herself it its itself
  we us our ours they them their theirs what which who whom whose when where why how
  am is are was were be been being have has had having do does did doing done will would shall should
  can could may might must ought to of in on at by for with about against between into through during
  before after above below from up down out off over under again further once all any both each few
  more most other some such no not only own same too very just also as until while because
  i'm i've i'd i'll you're you've you'd you'll he's she's it's we're we've they're they've that's
  there's what's who's isn't aren't wasn't weren't hasn't haven't hadn't doesn't don't didn't
  won't wouldn't shan't shouldn't can't cannot couldn't mustn't let's mr mrs miss ms one`.split(/\s+/));

const VERB_KEY = /^[A-Z][A-Z_]+$/;
const SPEAKER_ID = /^[a-z][a-z0-9_]*$/;

/**
 * Every line Thad says in one content file, as { text, subject }. `dialogue`
 * says whose a bare `say` is: in a tree it is the tree's owner's; anywhere
 * else it is Thad's unless a `by` beside it names somebody else. A line's
 * subject is the file and the first two steps of its path into it
 * (`hotspots/3`, `pairs/12`, `nodes/HOB_A1`, `pools/USE`).
 */
export function thadLinesOf(data, actor, { dialogue = false, file = '' } = {}) {
  const out = [];
  const walk = (node, path, mine) => {
    const subject = `${file}#${path.slice(0, 2).join('/')}`;
    const take = (value) => {
      if (typeof value === 'string') out.push({ text: value, subject });
      else if (Array.isArray(value)) for (const one of value) if (typeof one === 'string') out.push({ text: one, subject });
    };
    const key = path[path.length - 1] ?? '';
    if (Array.isArray(node)) {
      // A verb's pool, or a list of lines under a verb, is his.
      if (!dialogue && VERB_KEY.test(key)) take(node);
      node.forEach((one, at) => walk(one, [...path, String(at)], mine));
      return;
    }
    if (!node || typeof node !== 'object') return;
    if (typeof node.speaker === 'string' && typeof node.line === 'string') {
      if (node.speaker === actor && node.direction !== true) take(node.line);
    }
    const byOther = typeof node.by === 'string' && SPEAKER_ID.test(node.by) && node.by !== actor;
    if (dialogue) {
      // The option is what he says; its echo, where it has one, is what he says aloud.
      if (typeof node.id === 'string' && typeof node.text === 'string' && (node.tag || node.goto || node.ends)) {
        if (node.echo !== false) take(node.echo ?? node.text);
      }
      if (key === 'rephrase' && typeof node.text === 'string') take(node.text);
    }
    if (mine && !byOther) { take(node.say); take(node.repeat); }
    for (const [inner, value] of Object.entries(node)) {
      if (inner === 'note' || inner.endsWith('Note')) continue;
      if (inner === 'overrides' && !dialogue && value && typeof value === 'object') {
        for (const [verb, line] of Object.entries(value)) if (VERB_KEY.test(verb)) take(line);
      }
      // In a tree, a person's LOOK and LISTEN layer (`examine`) is Thad's; the rest is the owner's.
      walk(value, [...path, inner], dialogue ? (mine || inner === 'examine') : !byOther);
    }
  };
  walk(data, [], !dialogue);
  return out;
}

/** His lines in the Assay: his counters and wrong answers; the boasts are the opponents'. */
function assayLines(data, actor, file) {
  const out = [];
  const walk = (node, path) => {
    if (Array.isArray(node)) { node.forEach((one, at) => walk(one, [...path, String(at)])); return; }
    if (!node || typeof node !== 'object') return;
    const subject = `${file}#${path.slice(0, 2).join('/')}`;
    if (typeof node.counter === 'string') out.push({ text: node.counter, subject });
    for (const wrong of Array.isArray(node.wrong) ? node.wrong : []) {
      if (typeof wrong?.text === 'string') out.push({ text: wrong.text, subject });
    }
    if (node.speaker === actor && typeof node.line === 'string' && node.direction !== true) out.push({ text: node.line, subject });
    for (const [inner, value] of Object.entries(node)) if (inner !== 'wrong') walk(value, [...path, inner]);
  };
  walk(data, []);
  return out;
}

function strings(node, out = new Set()) {
  if (typeof node === 'string') out.add(node);
  else if (Array.isArray(node)) for (const one of node) strings(one, out);
  else if (node && typeof node === 'object') for (const value of Object.values(node)) strings(value, out);
  return out;
}

/**
 * The rooms, trees, figures and items the game can reach: from the start
 * room and the map, anything whose id another reachable file names. The
 * engine's harness rooms name only each other, so they are not reached.
 */
export function reachableFiles(manifest) {
  const units = [];
  for (const kind of ['rooms', 'dialogue', 'ambient', 'items', 'sequences']) {
    for (const path of manifest[kind] ?? []) {
      const data = readJson(path);
      units.push({ kind, path, data, id: data.id, names: strings(data) });
    }
  }
  const always = ['combinations', 'verbFallbacks', 'actCards', 'cutaways', 'assay'].filter((key) => manifest[key]);
  const named = new Set([manifest.startRoom]);
  for (const key of always) for (const one of strings(readJson(manifest[key]))) named.add(one);
  for (const unit of units) {
    if (unit.kind === 'sequences' || (unit.kind === 'rooms' && unit.data.kind === 'map')) named.add(unit.id);
  }
  const reached = new Set();
  for (let grew = true; grew;) {
    grew = false;
    for (const unit of units) {
      if (reached.has(unit) || !named.has(unit.id)) continue;
      reached.add(unit);
      for (const one of unit.names) named.add(one);
      grew = true;
    }
  }
  return units.filter((unit) => reached.has(unit));
}

/** Thad's lines across the reachable game: [{ text, subject }], one per distinct line. */
export function gameThadLines() {
  const manifest = readJson('content/manifest.json');
  const actor = readJson(manifest.actor).id;
  const lines = [];
  for (const unit of reachableFiles(manifest)) {
    lines.push(...thadLinesOf(unit.data, actor, { dialogue: unit.kind === 'dialogue', file: unit.path }));
  }
  for (const key of ['combinations', 'verbFallbacks', 'actCards', 'cutaways']) {
    if (manifest[key]) lines.push(...thadLinesOf(readJson(manifest[key]), actor, { file: manifest[key] }));
  }
  if (manifest.assay) lines.push(...assayLines(readJson(manifest.assay), actor, manifest.assay));
  const seen = new Map();
  for (const line of lines) {
    const text = line.text.replace(/\s+/g, ' ').trim();
    if (text && !seen.has(text)) seen.set(text, { text, subject: line.subject });
  }
  return [...seen.values()];
}

/** The words of a line, lowercased, each with whether it was capitalised and whether it began a sentence. */
function words(line) {
  const out = [];
  for (const sentence of line.split(/[.!?…:;—–"“”‘’()]+/)) {
    const found = sentence.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu) ?? [];
    found.forEach((word, at) => out.push({
      word: word.toLowerCase().replace(/’/g, "'"), capital: /^\p{Lu}/u.test(word), opens: at === 0,
    }));
  }
  return out;
}

/** Whether each phrase reads as a name: its words capitalised mid-sentence nearly every time. */
function nameTest(occurrences) {
  let checked = 0;
  let named = 0;
  for (const run of occurrences) {
    const telling = run.filter((one, at) => !STOPWORDS.has(one.word) && !(at === 0 && one.opens));
    if (!telling.length) continue;
    checked += 1;
    if (telling.every((one) => one.capital)) named += 1;
  }
  return checked > 0 && named / checked >= NAME_SHARE;
}

/**
 * Every phrase under more than `over` subjects: [{ phrase, count, lines }],
 * ranked by count, then by length, then alphabetically. `lines` are
 * { text, subject } or plain strings (each its own subject).
 */
export function findTemplates(input, { over = REPORT_OVER } = {}) {
  const lines = input.map((one, at) => (typeof one === 'string' ? { text: one, subject: `#${at}` } : one));
  const parsed = lines.map((line) => words(line.text));
  // Names first: every single word and every run, by how it is capitalised wherever Thad says it.
  const runs = new Map();
  parsed.forEach((said) => {
    for (let size = 1; size <= 5; size += 1) {
      for (let at = 0; at + size <= said.length; at += 1) {
        const run = said.slice(at, at + size);
        const key = run.map((one) => one.word).join(' ');
        if (!runs.has(key)) runs.set(key, []);
        runs.get(key).push(run);
      }
    }
  });
  const nameCache = new Map();
  const isName = (key) => {
    if (!nameCache.has(key)) nameCache.set(key, nameTest(runs.get(key) ?? []));
    return nameCache.get(key);
  };
  // A phrase is all names if every one of its non-stopword words is in some name run inside it.
  const allNames = (gram) => {
    const covered = gram.map((word) => STOPWORDS.has(word));
    for (let size = gram.length; size >= 1; size -= 1) {
      for (let at = 0; at + size <= gram.length; at += 1) {
        if (covered.slice(at, at + size).every(Boolean)) continue;
        if (isName(gram.slice(at, at + size).join(' '))) for (let i = at; i < at + size; i += 1) covered[i] = true;
      }
    }
    return covered.every(Boolean);
  };

  const where = new Map();
  parsed.forEach((said, index) => {
    const tokens = said.map((one) => one.word);
    for (let size = 3; size <= 5; size += 1) {
      for (let at = 0; at + size <= tokens.length; at += 1) {
        let gram = tokens.slice(at, at + size);
        while (gram.length && STOPWORDS.has(gram[0])) gram = gram.slice(1);
        while (gram.length && STOPWORDS.has(gram[gram.length - 1])) gram = gram.slice(0, -1);
        // A FIVE-WORD SHAPE AROUND ONE WORD is kept whole: "which I am told is", "it is the only thing".
        if (gram.length < 2 && size === 5 && gram.length === 1) gram = tokens.slice(at, at + size);
        if (gram.length < 2) continue;
        const phrase = gram.join(' ');
        if (!where.has(phrase)) where.set(phrase, new Set());
        where.get(phrase).add(index);
      }
    }
  });
  const found = [];
  for (const [phrase, at] of where) {
    const subjects = new Set([...at].map((index) => lines[index].subject));
    if (subjects.size <= over || allNames(phrase.split(' '))) continue;
    found.push({ phrase, count: subjects.size, subjects, at });
  }
  // A phrase inside a longer one, under exactly the same subjects, is the longer one.
  const same = (a, b) => a.size === b.size && [...a].every((one) => b.has(one));
  const kept = found.filter((one) => !found.some((other) => other !== one
    && ` ${other.phrase} `.includes(` ${one.phrase} `) && same(one.subjects, other.subjects)));
  return kept
    .map(({ phrase, count, at }) => ({ phrase, count, lines: [...at].sort((a, b) => a - b).map((index) => lines[index].text) }))
    .sort((a, b) => b.count - a.count || b.phrase.split(' ').length - a.phrase.split(' ').length || a.phrase.localeCompare(b.phrase));
}

export function readAllowlist(path = ALLOWLIST_PATH) {
  return readJson(path).entries ?? [];
}

/** How many of the ranked phrases the run's note lists; run the check on its own for all of them. */
const LISTED = 40;

export function check({ lines, allowlist, all = false } = {}) {
  const report = new Report('Thad reaches for no phrase four times unless it is allowed');
  const entries = allowlist ?? readAllowlist();
  for (const entry of entries) {
    if (typeof entry.text !== 'string' || !entry.text.trim()) report.fail(`${ALLOWLIST_PATH}: an entry has no text`);
    if (typeof entry.why !== 'string' || !RULING.test(entry.why)) {
      report.fail(`${ALLOWLIST_PATH}: "${entry.text}" has no why quoting a ruling (an errata, a doc, or Tyler)`);
    }
  }
  const said = lines ?? gameThadLines();
  const allowed = new Set(entries.map((entry) => String(entry.text ?? '').toLowerCase().trim()));
  const templates = findTemplates(said);
  for (const one of templates) {
    if (one.count < FAIL_AT || allowed.has(one.phrase)) continue;
    const sample = one.lines.slice(0, 3).map((line) => `"${line.length > 70 ? `${line.slice(0, 67)}...` : line}"`).join(' / ');
    report.fail(`"${one.phrase}" x${one.count} -- ${sample}`);
  }
  const listed = templates.map((one) => `"${one.phrase}" x${one.count}${allowed.has(one.phrase) ? ' (allowed)' : ''}`);
  const shown = all ? listed : listed.slice(0, LISTED);
  report.note(`${said.length} distinct line(s) of Thad's; ${templates.length} phrase(s) under more than ${REPORT_OVER} `
    + `subjects, ranked: ${shown.join(', ') || 'none'}`
    + (shown.length < listed.length ? `, and ${listed.length - shown.length} more (node tools/check-narration-templates.mjs lists all)` : ''));
  const live = new Set(templates.filter((one) => one.count >= FAIL_AT).map((one) => one.phrase));
  for (const entry of entries) {
    const text = String(entry.text ?? '').toLowerCase().trim();
    if (text && !live.has(text)) report.note(`allowlisted and now under ${FAIL_AT}, so it can come off the list: "${entry.text}"`);
  }
  return report;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exit(runCheck(check({ all: true })) ? 0 : 1);
}
