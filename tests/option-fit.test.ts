/**
 * EVERY DIALOGUE OPTION FITS THE PANEL (errata 132; the bookends audit,
 * finding 6). Option rows did not wrap, so the most important choice in the
 * game -- Duel Three's truth -- ran off the right edge mid-word: "...Obadiah
 * Mott invented it to rai". Rows now wrap, and every option the content can
 * offer is checked here at the panel's own scale.
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { BitmapFont, PANEL_GLYPH_SCALE } from '../engine/render/BitmapFont.ts';
import { CHOICE_WIDTH, OPTION_MAX_ROWS, optionRows, type ChoiceFit } from '../engine/render/Renderer.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/** Every string the list can draw as an option: tree options and their rephrasings, and the Assay's. */
function offered(content: Awaited<ReturnType<typeof loadContent>>): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  for (const [treeId, tree] of content.dialogue) {
    for (const [nodeId, node] of Object.entries(tree.nodes)) {
      for (const option of node.options) {
        out.push({ where: `${treeId}/${nodeId}/${option.id}`, text: option.text });
        const rephrase = (option as { rephrase?: { text?: string } }).rephrase;
        if (rephrase?.text) out.push({ where: `${treeId}/${nodeId}/${option.id} (rephrased)`, text: rephrase.text });
      }
    }
  }
  // The Assay's counters, wrong answers and offers: everything under `text` or `counter`.
  const walk = (value: unknown, path: string): void => {
    if (Array.isArray(value)) value.forEach((each, index) => walk(each, `${path}[${index}]`));
    else if (value && typeof value === 'object') {
      for (const [key, inner] of Object.entries(value)) {
        if ((key === 'text' || key === 'counter') && typeof inner === 'string') out.push({ where: `assay${path}.${key}`, text: inner });
        else walk(inner, `${path}.${key}`);
      }
    }
  };
  walk(content.assay, '');
  return out;
}

test(`every option fits the panel at PANEL_GLYPH_SCALE, in at most ${OPTION_MAX_ROWS} rows`, async () => {
  const content = await loadContent(fsReader);
  const font = new BitmapFont(content.font, PANEL_GLYPH_SCALE);
  const fit: ChoiceFit = { wrap: (text, width) => font.wrap(text, width), measure: (text) => font.measure(text), width: CHOICE_WIDTH };
  const prefix = content.ui.dialogue.optionPrefix;
  const all = offered(content);
  assert.ok(all.length > 300, `options checked: ${all.length}`);
  let wrapped = 0;
  for (const { where, text } of all) {
    const rows = optionRows(prefix, text, fit);
    assert.ok(rows.length <= OPTION_MAX_ROWS, `${where}: ${rows.length} rows`);
    for (const row of rows) assert.ok(font.measure(row) <= CHOICE_WIDTH, `${where}: a row ${font.measure(row)}px wide`);
    assert.equal(rows.map((row) => row.trim()).join(' ').replace(/^- /, ''), text.replace(/\s+/g, ' ').trim(), `${where}: every word, in order`);
    if (rows.length > 1) wrapped += 1;
  }
  // The defect: these did not fit on one row, and one row was all there was.
  assert.ok(wrapped > 0, 'some options need more than one row');
});
