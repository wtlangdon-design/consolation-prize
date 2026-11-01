import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { ROOT } from './content.mjs';
import { resolveIssueRef } from './issueref.mjs';

/**
 * IS EVERY PIECE OF WRITING A PUZZLE NEEDS ACTUALLY WRITTEN? Errata 74.
 *
 * The readiness gate used to ask only whether a room's puzzles were NAMED in
 * doc 02's section. Room 4 answered YES and then stopped its builder, because
 * the duels it hosts needed sixty-nine wrong answers nobody had written (doc
 * 36 Q146). A name is not a script.
 *
 * So every puzzle now has an entry in proofs/readiness/puzzles.json, written
 * by an audit, listing what the puzzle needs -- the dialogue nodes, the items,
 * the duel pairs, the scenes, the verb-on-object lines, the rulings -- and
 * this module checks each one is really there, in the shape a builder can
 * use. A puzzle with no entry has not been audited, and that is a NO.
 *
 * Like the gate, it cites and counts; it never copies a line and has no
 * opinion about whether one is good.
 */

const MANIFEST = 'proofs/readiness/puzzles.json';
const ITEM_DOCS = ['docs/23-inventory-act1.md', 'docs/54-batch-c.md'];
const NODE_DOCS = ['docs/04-dialogue-trees.md', 'docs/27-minor-trees.md'];

function read(path) {
  return readFileSync(resolve(ROOT, path), 'utf8');
}

/** The body of one heading, up to the next heading of <= its depth. */
function section(reference) {
  const found = resolveIssueRef(reference);
  if (!found.ok) return { ok: false, why: found.why };
  const lines = read(found.path).split('\n');
  const start = found.line - 1;
  const depth = /^(#{1,6})/.exec(lines[start])[1].length;
  let end = lines.length;
  for (let at = start + 1; at < lines.length; at += 1) {
    const next = /^(#{1,6})\s/.exec(lines[at]);
    if (next && next[1].length <= depth) { end = at; break; }
  }
  return { ok: true, body: lines.slice(start + 1, end).join('\n') };
}

/** Variant numbers written on a `**LOOK**` / `**LISTEN**` run line. */
function variants(line) {
  return new Set([...line.matchAll(/(?:^|·)\s*(\d)\s+["“]/g)].map((m) => Number(m[1])));
}

/** An item: a `## NAME` heading with LOOK 1–3 and LISTEN 1–3. */
function item(name) {
  for (const path of ITEM_DOCS) {
    const lines = read(path).split('\n');
    const at = lines.findIndex((line) => line.trim() === `## ${name}`);
    if (at < 0) continue;
    const body = [];
    for (let i = at + 1; i < lines.length && !/^#{1,2}\s/.test(lines[i]); i += 1) body.push(lines[i]);
    const look = new Set(); const listen = new Set();
    for (const line of body) {
      const l = /\*\*LOOK\*\*(.*?)(?:\*\*LISTEN\*\*|$)/.exec(line);
      if (l) for (const n of variants(l[1])) look.add(n);
      const h = /\*\*LISTEN\*\*(.*)$/.exec(line);
      if (h) for (const n of variants(h[1])) listen.add(n);
    }
    const missing = [1, 2, 3].flatMap((n) => [...(look.has(n) ? [] : [`LOOK ${n}`]), ...(listen.has(n) ? [] : [`LISTEN ${n}`])]);
    return missing.length ? { ok: false, why: `item ${name} (${path}) lacks ${missing.join(', ')}` }
      : { ok: true, why: `item ${name}: LOOK and LISTEN 1–3 (${path})` };
  }
  return { ok: false, why: `item ${name}: no "## ${name}" in ${ITEM_DOCS.join(' or ')}` };
}

/**
 * A dialogue node: its backticked id introduces a TABLE of at least three
 * written options, at least one [COMIC]. A node described in prose ("one
 * option per document") is not written, whatever it promises.
 */
function node(id) {
  for (const path of NODE_DOCS) {
    const lines = read(path).split('\n');
    const at = lines.findIndex((line) => line.includes(`\`${id}\``) && /^(#{1,6}\s|\*\*)/.test(line.trim()));
    if (at < 0) continue;
    const rows = [];
    for (let i = at + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (/^#{1,6}\s/.test(line) || (/^\*\*`[A-Z]{3}_[A-Z0-9]+`/.test(line.trim()))) break;
      if (/^\|\s*\d+\s*\|/.test(line)) rows.push(line);
    }
    const unwritten = rows.filter((row) => !/"[^"]+"/.test(row.split('|')[2] ?? ''));
    const comic = rows.some((row) => /\[COMIC/.test(row));
    if (rows.length < 3) return { ok: false, why: `node ${id} (${path}): ${rows.length} written option row(s), needs 3` };
    if (!comic) return { ok: false, why: `node ${id} (${path}): no [COMIC] option` };
    if (unwritten.length) return { ok: false, why: `node ${id} (${path}): ${unwritten.length} option(s) with no written text` };
    return { ok: true, why: `node ${id}: ${rows.length} options (${path})` };
  }
  return { ok: false, why: `node ${id}: not found as a heading or bold line in ${NODE_DOCS.join(' or ')}` };
}

/** Doc 03 Part Three: three wrong answers, each with a reply, for every pair named. */
function duel(pairs) {
  const doc = read('docs/03-liars-assay.md');
  const part = doc.slice(doc.indexOf('# PART THREE — WRONG ANSWERS'), doc.indexOf('# PART FOUR'));
  const answers = (body) => [...body.matchAll(/^> \*\*"[^"]+"\*\* — \*[A-Za-z]+: "[^"]+"\*$/gm)].length;
  const missing = [];
  for (const pair of pairs) {
    let body;
    if (pair === 1) body = part.slice(0, part.indexOf('## Wrong answers, pairs'));
    else if (pair === 'fifth') body = part.slice(part.indexOf('**Duel Three, the fifth exchange**'));
    else {
      const from = part.indexOf(`\n**${pair}.**`);
      if (from < 0) { missing.push(`pair ${pair}: no section`); continue; }
      const next = part.slice(from + 1).search(/\n\*\*(\d+\.|Duel Three)/);
      body = next < 0 ? part.slice(from) : part.slice(from, from + 1 + next);
    }
    if (pair === 'fifth' && part.indexOf('**Duel Three, the fifth exchange**') < 0) { missing.push('fifth exchange: no section'); continue; }
    const count = answers(pair === 'fifth' ? body.split('\n').slice(0, 5).join('\n') : body.split('\n## Wrong')[0]);
    if (count !== 3) missing.push(`pair ${pair}: ${count} wrong answer(s) with replies, needs 3`);
  }
  return missing.length ? { ok: false, why: `duel: ${missing.join('; ')}` }
    : { ok: true, why: `duel: pairs ${pairs.join(', ')} each have three wrong answers and replies` };
}

/** A section that resolves and is not empty; optionally containing a marker. */
function sectionNeed(reference, contains) {
  const found = section(reference);
  if (!found.ok) return { ok: false, why: `section ${reference}: ${found.why}` };
  if (!found.body.trim()) return { ok: false, why: `section ${reference} is empty` };
  if (contains && !found.body.includes(contains)) return { ok: false, why: `section ${reference} does not contain "${contains}"` };
  return { ok: true, why: `section ${reference}` };
}

function need(entry) {
  switch (entry.kind) {
    case 'item': return item(entry.name);
    case 'node': return node(entry.id);
    case 'duel': return duel(entry.pairs);
    case 'section': return sectionNeed(entry.ref, entry.contains);
    default: return { ok: false, why: `unknown need kind "${entry.kind}"` };
  }
}

/** Whether a puzzle's content is all written, with a reason per need. */
export function puzzleContent(id) {
  if (!existsSync(resolve(ROOT, MANIFEST))) return { ok: false, why: [`${MANIFEST} is missing`] };
  const manifest = JSON.parse(read(MANIFEST));
  const entry = manifest.puzzles?.[id];
  if (!entry) return { ok: false, why: [`${id} has not been audited for content (no entry in ${MANIFEST})`] };
  if (entry.blocked) return { ok: false, why: [`${id} is blocked: ${entry.blocked}`] };
  const results = (entry.needs ?? []).map(need);
  const failed = results.filter((r) => !r.ok);
  return { ok: failed.length === 0 && results.length > 0,
    why: results.length === 0 ? [`${id}: the audit listed no needs`] : (failed.length ? failed : results).map((r) => r.why) };
}

export function manifestPuzzles() {
  if (!existsSync(resolve(ROOT, MANIFEST))) return {};
  return JSON.parse(read(MANIFEST)).puzzles ?? {};
}
