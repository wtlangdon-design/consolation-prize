import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { Report, runCheck } from './lib/content.mjs';

/**
 * WRITTEN VERSUS BUILT (errata 182). Tyler, 2026-11-08, after two scenes turned up written and never built:
 * "I'm concerned that after multiple audits, you're just now finding multiple missing scenes." The audits read
 * the documents and judged them; none asked whether what they read was in the game.
 *
 * This asks it, mechanically. Every quoted line in the documents the game's writing is extracted from is looked
 * for in /content. A line counts as in the game if it is there word for word, or if a content line shares at
 * least SAME of its words -- the first voice pass (docs 60-93) reworded many lines in place, and a reworded line
 * is built. A line below that, of at least WORDS words, is written and not built.
 *
 * Every such line must be listed in proofs/written-not-built.json under a group with its reason: superseded,
 * cut by a ruling, waiting on art, or a gap reported to Tyler. A new one fails until it is built or explained;
 * a listed one that turns up in the game is reported so it can come off the list.
 */
const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const LEDGER = 'proofs/written-not-built.json';
const SAME = 0.6;
const WORDS = 4;

/** The documents /content is extracted or compiled from (tools/extract-*.mjs, tools/compile-room.mjs). */
export const SOURCES = [
  '03-liars-assay', '04-dialogue-trees', '05-examine-layer', '07-ambient-layer', '08-examine-batch-1',
  '09-examine-batch-2', '10-examine-batch-3', '13-room-02-content', '14-room-02-exits', '16-room-03-content',
  '17-opening-sequence', '19-19b-resolutions', '23-inventory-act1', '24-combinations', '25-rooms-05-07',
  '26-batch-a', '27-minor-trees', '43-room-01-staging-script', '48-act-turn-beats', '49-wrong-answers',
  '54-batch-c', '57-puzzle-completion', '94-clue-pass', '96-cutaways', '97-lower-street-and-the-lane',
  '98-main-street-pass', '105-the-six-interiors', '108-the-washout-and-the-mine', '109-fiddlers-gulch-lines',
  // Errata 237: scenes B and C's lines (doc 111, THE LINES).
  '111-scenes-b-and-c',
];

export const norm = (text) => text
  .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/\*\([^)]*\)\*/g, '').replace(/\*+/g, '')
  .replace(/\s+/g, ' ').trim().toLowerCase();
const words = (text) => new Set(text.match(/[a-z']+/g) ?? []);

/**
 * THE BUILD'S OWN PROSE IS NOT A LINE THE PLAYER HEARS (Tyler, 2026-11-08: "HOW did you miss so much?").
 * The first version of this check read every string in /content, notes included, so a written line that shared
 * most of its words with a builder's note -- a `note`, an `evidence` record, a sequence beat's `description` --
 * counted as built. A hundred lines were hidden that way. Strings under these keys are skipped.
 */
export const META = /(note|Note)$|^(evidence|why|provenance|proof|redrawn|contract|materialIdentity|gauntlet|scope|sources|reason|ruling|notBuilt|exception|corrections|staging|record|writtenBy|derivedFrom|description|label|exceptionReason|fewOptionsReason|noComicReason|awaitingArt|comment)$/;

function contentStrings() {
  const out = [];
  const walk = (value, key = '') => {
    if (META.test(key)) return;
    if (typeof value === 'string') { if (value.length > 8) out.push(norm(value)); }
    else if (Array.isArray(value)) value.forEach((one) => walk(one, key));
    else if (value && typeof value === 'object') {
      // A line split for speaking -- `say` and its `then` -- is one written line.
      if (typeof value.say === 'string' && Array.isArray(value.then)) {
        out.push(norm([value.say, ...value.then.filter((t) => typeof t === 'string')].join(' ')));
      }
      for (const [k, v] of Object.entries(value)) walk(v, k);
    }
  };
  const dir = (path) => {
    for (const name of readdirSync(path)) {
      const full = join(path, name);
      if (statSync(full).isDirectory()) dir(full);
      else if (name.endsWith('.json')) walk(JSON.parse(readFileSync(full, 'utf8')));
    }
  };
  dir(join(ROOT, 'content'));
  return out;
}

/** Every quoted line of WORDS words or more in the sources that no content line carries, as {doc, line, quote}. */
export function unbuilt() {
  const corpus = contentStrings();
  const blob = corpus.join('\n');
  const index = new Map();
  corpus.forEach((text, i) => { for (const w of words(text)) (index.get(w) ?? index.set(w, new Set()).get(w)).add(i); });
  const QUOTE = /["“]([^"“”\n]{12,}?)["”]/g;
  const found = [];
  for (const doc of SOURCES) {
    const lines = readFileSync(join(ROOT, 'docs', `${doc}.md`), 'utf8').split('\n');
    lines.forEach((text, at) => {
      for (const m of text.matchAll(QUOTE)) {
        const quote = norm(m[1]);
        if (quote.split(' ').length < WORDS || blob.includes(quote.replace(/[ .]+$/, ''))) continue;
        const mine = words(quote);
        if (!mine.size) continue;
        const near = new Set();
        for (const w of mine) { const hits = index.get(w); if (hits && hits.size < 400) for (const i of hits) near.add(i); }
        let best = 0;
        for (const i of near) {
          const theirs = words(corpus[i]);
          let shared = 0; for (const w of mine) if (theirs.has(w)) shared += 1;
          best = Math.max(best, shared / mine.size);
        }
        if (best < SAME) found.push({ doc, line: at + 1, quote: m[1].trim() });
      }
    });
  }
  return found;
}

export function check() {
  const report = new Report('Everything the documents write is in the game, or is listed with the reason it is not');
  const ledger = JSON.parse(readFileSync(join(ROOT, LEDGER), 'utf8'));
  const listed = new Map();
  for (const group of ledger.groups) for (const item of group.lines) listed.set(`${item.doc}|${norm(item.quote)}`, group.id);
  const found = unbuilt();
  const seen = new Set();
  const counts = new Map();
  for (const item of found) {
    const key = `${item.doc}|${norm(item.quote)}`;
    seen.add(key);
    const group = listed.get(key);
    if (group) counts.set(group, (counts.get(group) ?? 0) + 1);
    else report.fail(`docs/${item.doc}.md:${item.line} is written and not in the game, and ${LEDGER} gives no reason: "${item.quote.slice(0, 90)}"`);
  }
  for (const [key, group] of listed) if (!seen.has(key)) report.note(`now in the game, so off ${LEDGER} (${group}): ${key.slice(0, 100)}`);
  for (const group of ledger.groups) report.note(`${group.id} (${counts.get(group.id) ?? 0}): ${group.why.slice(0, 110)}`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
