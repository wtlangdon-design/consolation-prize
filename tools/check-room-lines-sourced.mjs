import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { allInteractables, loadContent, readJson, Report, ROOT, runCheck } from './lib/content.mjs';

/**
 * EVERY LINE A ROOM SPEAKS IS WRITTEN IN /docs.
 *
 * The extraction check compares the files tools/extract-content.mjs writes
 * against their documents. Room files are compiled instead, and the compiler
 * CARRIES what it does not read: an exit's override it had no parser for
 * stayed as the live file had it. So when errata 100 rewrote the Nugget's back
 * room door in doc 16, ninety-nine lines reached the game and the door's PUSH
 * quietly kept the old words -- the line still existed, still passed every
 * other check, and disagreed with the document.
 *
 * This asks the question from the other end: every spoken line in every room
 * file must appear in the documents (sentence splits allowed, typography
 * normalised). A record of OLD lines -- doc 60's before-and-after -- is not a
 * source and is not read. Engine fixtures and candidate rooms are set aside.
 * Lines that predate the rule and have no document are listed, with their
 * reason, in proofs/unsourced-lines.json; that list may only shrink.
 */
const LEDGER = 'proofs/unsourced-lines.json';
const norm = (text) => text.replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
  .replace(/\*+/g, '').replace(/\\/g, '').replace(/\s+/g, ' ').trim();

// Keys whose values are conditions, ids or references to where a line lives, not lines.
const NOT_SPOKEN = new Set(['when', 'set', 'add', 'by', 'holding', 'dialogue', 'sceneLine', 'gives', 'takes', 'item', 'flag', 'goto', 'tree', 'sequence']);

function spoken(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const one of value) spoken(one, out);
  else if (value && typeof value === 'object') {
    for (const [key, inner] of Object.entries(value)) {
      if (NOT_SPOKEN.has(key)) continue;
      spoken(inner, out);
    }
  }
  return out;
}

export function check() {
  const report = new Report('Every line a room speaks is written in /docs');
  const raw = readdirSync(resolve(ROOT, 'docs'))
    .filter((name) => name.endsWith('.md') && !name.includes('voice-pass'))
    .map((name) => readFileSync(resolve(ROOT, 'docs', name), 'utf8')).join('\n');
  // A REPEAT WITH A BEAT IN IT -- 2 "I looked in the jar." *(beat)* "I'd like to go back ..." -- is extracted as
  // one line, its quotes in order (tools/extract-examine.mjs, errata 183). Read the docs a second way with each
  // direction between two quotes taken out, so that line is found as its document wrote it.
  const docs = norm(raw);
  const beats = norm(raw.replace(/"\s*\*\([^)]*\)\*\s*"/g, ' '));
  const known = new Map((readJson(LEDGER).lines ?? []).map((entry) => [`${entry.room}/${entry.target}::${entry.line}`, entry]));
  const content = loadContent();
  const setAside = new Set(content.rooms.filter(({ data }) => data.fixture || data.candidateOf).map(({ data }) => data.id));
  const used = new Set();
  let checked = 0;
  for (const { roomId, target } of allInteractables(content)) {
    if (setAside.has(roomId)) continue;
    for (const block of [target.responses, target.overrides]) {
      for (const line of spoken(block ?? {})) {
        if (line.length < 4 || /^[a-z_]+$/.test(line)) continue;
        checked += 1;
        if (docs.includes(norm(line)) || beats.includes(norm(line))) continue;
        const key = `${roomId}/${target.id}::${line}`;
        if (known.has(key)) { used.add(key); continue; }
        report.fail(`${roomId}/${target.id}: "${line.slice(0, 80)}" is in the room file and in no document -- `
          + 'change the doc and recompile, or teach the compiler to read the row it carried');
      }
    }
  }
  for (const key of known.keys()) {
    if (!used.has(key)) report.fail(`${LEDGER}: "${key.slice(0, 90)}" is sourced or gone now -- take it off the list`);
  }
  report.note(`${checked} room lines checked against /docs; ${setAside.size} fixture or candidate room(s) set aside; ${used.size} known unsourced line(s) in ${LEDGER}`);
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
