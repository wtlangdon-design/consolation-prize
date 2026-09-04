#!/usr/bin/env node
/**
 * DOES A CANDIDATE FACE HAVE EVERY CHARACTER THE GAME ACTUALLY WRITES?
 *
 * ASKED OF THE FONT FILE, NOT OF A CANVAS, and that is the whole reason this
 * is a separate tool. A browser substitutes a missing glyph from another face
 * silently: `fillText` always draws SOMETHING, so a coverage question asked
 * through a canvas always answers yes, and the answer is a different
 * typeface's letter sitting in the middle of a word looking almost right.
 *
 * WHICH IS EXACTLY WHAT CLAUDE.md's TYPOGRAPHY RULE EXISTS TO PREVENT. The
 * design documents are written in prose typography -- curly quotes,
 * apostrophes, em dashes, en dashes, ellipses -- and the rule is to extend the
 * face to cover them rather than normalise the writing to ASCII, "because
 * straight-quoting a comedy script flattens it, and Thad's voice depends on
 * the dashes." A candidate that lacks `—` fails here rather than in a frame
 * nobody looked closely at.
 *
 * IT READS THE cmap DIRECTLY, with no font library, for the same reason
 * `check-key-fringe` decodes its own PNGs: a check that only runs on the
 * machine that happens to have a library is a check that stops running.
 *
 * Usage: node tools/font/check-candidates.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { allDialogueOptions, allResponseCarriers, loadContent, readJson,
  Report, ROOT, runCheck } from '../lib/content.mjs';

const DIR = 'art/ui/fonts/candidates';

/**
 * The punctuation CLAUDE.md names, listed here so a failure quotes the rule.
 * Everything else comes from the content itself.
 */
const PROSE = ['‘', '’', '“', '”', '—', '–', '…'];

/* ---------------------------------------------------------------- TrueType */

/** Every codepoint a TrueType/OpenType file's cmap maps to a glyph. */
export function codepointsOf(bytes) {
  const tables = new Map();
  const numTables = bytes.readUInt16BE(4);
  for (let at = 0; at < numTables; at += 1) {
    const record = 12 + at * 16;
    tables.set(bytes.toString('latin1', record, record + 4), bytes.readUInt32BE(record + 8));
  }
  const cmap = tables.get('cmap');
  if (cmap === undefined) throw new Error('no cmap table: this is not a usable font file');

  // THE BEST SUBTABLE, NOT THE FIRST. A face carries several encodings and the
  // first is often a Mac-Roman 8-bit one that maps 256 codepoints -- reading
  // it would report every candidate as missing every dash in the language.
  const count = bytes.readUInt16BE(cmap + 2);
  let best = null;
  for (let at = 0; at < count; at += 1) {
    const record = cmap + 4 + at * 8;
    const platform = bytes.readUInt16BE(record);
    const encoding = bytes.readUInt16BE(record + 2);
    const offset = cmap + bytes.readUInt32BE(record + 4);
    const format = bytes.readUInt16BE(offset);
    const unicode = (platform === 3 && (encoding === 1 || encoding === 10)) || platform === 0;
    if (!unicode) continue;
    const rank = format === 12 ? 3 : (format === 4 ? 2 : 1);
    if (!best || rank > best.rank) best = { offset, format, rank };
  }
  if (!best) throw new Error('no Unicode cmap subtable');

  const found = new Set();
  if (best.format === 4) {
    const segX2 = bytes.readUInt16BE(best.offset + 6);
    const segs = segX2 / 2;
    const ends = best.offset + 14;
    const starts = ends + segX2 + 2;
    const deltas = starts + segX2;
    const ranges = deltas + segX2;
    for (let seg = 0; seg < segs; seg += 1) {
      const end = bytes.readUInt16BE(ends + seg * 2);
      const start = bytes.readUInt16BE(starts + seg * 2);
      const delta = bytes.readInt16BE(deltas + seg * 2);
      const rangeOffset = bytes.readUInt16BE(ranges + seg * 2);
      if (start === 0xFFFF) continue;
      for (let code = start; code <= end && code !== 0x10000; code += 1) {
        let glyph;
        if (rangeOffset === 0) glyph = (code + delta) & 0xFFFF;
        else {
          const at = ranges + seg * 2 + rangeOffset + (code - start) * 2;
          if (at + 1 >= bytes.length) continue;
          glyph = bytes.readUInt16BE(at);
          if (glyph !== 0) glyph = (glyph + delta) & 0xFFFF;
        }
        if (glyph !== 0) found.add(code);
      }
    }
  } else if (best.format === 12) {
    const groups = bytes.readUInt32BE(best.offset + 12);
    for (let group = 0; group < groups; group += 1) {
      const at = best.offset + 16 + group * 12;
      const start = bytes.readUInt32BE(at);
      const end = bytes.readUInt32BE(at + 4);
      // Bounded: a corrupt group could otherwise claim the whole plane.
      for (let code = start; code <= end && code - start < 0x10000; code += 1) found.add(code);
    }
  } else {
    throw new Error(`cmap format ${best.format} is not read by this tool`);
  }
  return found;
}

/* ----------------------------------------------------------- what is drawn */

/**
 * Every character the game puts on screen, from the content itself.
 *
 * THE SAME SOURCES `check-glyph-coverage` USES, because the question is the
 * same one and a second list of what counts as drawn text would drift from the
 * first. This one asks it of a candidate file instead of the shipped face.
 */
export function drawnCharacters() {
  const content = loadContent();
  const strings = [];
  const push = (value) => { if (typeof value === 'string') strings.push(value); };

  for (const { target } of allResponseCarriers(content)) {
    push(target.name);
    for (const rules of Object.values(target.responses ?? {})) {
      for (const rule of rules ?? []) {
        push(rule.say);
        for (const line of rule.repeat ?? []) push(line);
      }
    }
    for (const line of Object.values(target.overrides ?? {})) push(line);
  }
  for (const { node, option } of allDialogueOptions(content)) {
    push(node.prompt);
    push(option.text);
    push(option.say);
    for (const said of option.exchange ?? []) push(said.line);
  }
  for (const { data } of content.sequences) {
    for (const beat of data.beats ?? []) {
      for (const line of beat.lines ?? []) push(line.line);
      for (const staged of beat.staging ?? []) push(staged.line);
      push(beat.actCard);
    }
  }
  for (const verb of content.verbs.verbs ?? []) push(verb.label);
  for (const { data } of content.items) { push(data.name); push(data.short); }
  const menu = readJson(content.manifest.menu);
  const walk = (node) => {
    if (typeof node === 'string') { push(node); return; }
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node && typeof node === 'object') Object.values(node).forEach(walk);
  };
  walk(menu);

  const chars = new Set();
  for (const value of strings) for (const char of value) chars.add(char);
  for (const char of PROSE) chars.add(char);
  return chars;
}

export function check() {
  const report = new Report('Every candidate face covers every character the game draws');
  let files;
  try {
    files = readdirSync(resolve(ROOT, DIR)).filter((name) => name.endsWith('.ttf')).sort();
  } catch {
    report.note(`${DIR} holds no candidate faces, so there is nothing to check. `
      + 'A ruling on Q16 is what fills it.');
    return report;
  }
  if (files.length === 0) {
    report.note(`${DIR} holds no candidate faces. Doc 36 Q16 is unruled.`);
    return report;
  }

  const wanted = drawnCharacters();
  report.note(`${wanted.size} distinct character(s) drawn by the current content, `
    + `plus the ${PROSE.length} CLAUDE.md names`);

  for (const file of files) {
    let codes;
    try {
      codes = codepointsOf(readFileSync(resolve(ROOT, DIR, file)));
    } catch (error) {
      report.fail(`${file}: ${error.message}`);
      continue;
    }
    const missing = [...wanted].filter((char) => {
      const code = char.codePointAt(0);
      // A newline is not a glyph and is never drawn as one.
      if (code < 0x20) return false;
      return !codes.has(code);
    });
    if (missing.length) {
      report.fail(`${file} is missing ${missing.length} character(s) the game draws: `
        + missing.map((char) => `"${char}" U+${char.codePointAt(0).toString(16).toUpperCase()}`)
          .join(', '));
    } else {
      report.note(`${file}: ${codes.size} codepoint(s), covers all ${wanted.size}`);
    }
  }
  report.note('COVERAGE IS NOT A CHOICE. Whether any of these is the right face for this game '
    + 'is Tyler\'s, on doc 36 Q16, and nothing here votes.');
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exit(runCheck(check()) ? 0 : 1);
}
