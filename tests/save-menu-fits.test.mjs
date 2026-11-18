/**
 * ERRATA 373: A SAVE SLOT'S ROW FITS THE MENU, AND NAMES A PLACE (the Act II playtest). "Slot 1  THE CLAIMS REGISTRAR -
 * just now" ran past the panel over the room, and a save in Fiddler's Gulch read "grog_tent": ten rooms had no name.
 * The menu now grows to its widest row, up to the screen less a margin (Renderer's `menuBox`: 1920 less 12 cells,
 * text inset 8 cells each side, at the play area's six times). Every room the game can save in is held to a name
 * and to a row that fits. Fails on main before errata 373 (the Gulch rooms have no name).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ROOT = new URL('../', import.meta.url);
const json = (path) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8'));
const SCALE = 6;
const TEXT_ROOM = 1920 - 12 * SCALE - 2 * 8 * SCALE;
const font = json('art/ui/font-5x7.json');
const width = (text) => [...text].reduce((sum, ch) => sum + (font.advances?.[ch] ?? font.advance) * SCALE, 0);
const fill = (template, vars) => template.replace(/\{(\w+)\}/g, (whole, key) => vars[key] ?? whole);

test('every room a game can be saved in has a name, and its save row fits the menu', () => {
  const { slots } = json('content/ui/menu.json');
  const whens = Object.values(slots.time).map((one) => fill(one, { n: '59' }));
  const longest = whens.sort((a, b) => width(b) - width(a))[0];
  const problems = [];
  for (const path of json('content/manifest.json').rooms) {
    const room = json(path);
    // The two review candidates (doc 36 Q128's staging rooms) are in the manifest for `?room=` and nothing leads to them.
    if (room.id.endsWith('_candidate')) continue;
    if (!room.name) { problems.push(`${room.id}: no name (a save here shows its id)`); continue; }
    const row = `${fill(slots.nameTemplate, { number: String(slots.count) })}  ${fill(slots.usedTemplate, { room: room.name, when: longest })}`;
    if (width(row) > TEXT_ROOM) problems.push(`${room.id}: "${row}" is ${width(row)} px, the menu holds ${TEXT_ROOM}`);
  }
  assert.deepEqual(problems, []);
});
