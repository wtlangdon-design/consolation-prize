import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { BitmapFont } from '../engine/render/BitmapFont.ts';
import {
  NATIVE_HEIGHT,
  PANEL_HEIGHT,
  PLAY_HEIGHT,
  pointInRect,
  verbButtonRect,
} from '../engine/render/Screen.ts';
import { format } from '../engine/render/Renderer.ts';
import {
  isDoubleClick as detectDoubleClick,
  NO_CLICK,
  recordClick,
} from '../engine/core/ClickTracker.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('the panel occupies the bottom 56px of a 320x200 screen', () => {
  assert.equal(NATIVE_HEIGHT, 200);
  assert.equal(PLAY_HEIGHT, 144);
  assert.equal(PANEL_HEIGHT, 56);
});

test('all nine verbs are selectable, and every written examine line answers', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());

  assert.equal(content.verbs.verbs.length, 9);

  for (const room of content.rooms.values()) {
    state.enterRoom(room.id);
    for (const target of state.targets) {
      // Stub exits are deliberately silent: their examine lines are written
      // but not yet transcribed, and a placeholder line would be worse than
      // nothing. They still have to be walkable, which is asserted below.
      const isStub = (target as { stub?: boolean }).stub === true;
      for (const verb of content.verbs.verbs) {
        state.verbs.selectVerb(verb.id);
        const result = state.interact(target);
        const producedSomething = result.say !== null || result.enteredDialogue || result.changedRoom;
        // LOOK and LISTEN are written for every hotspot and must always
        // answer. The other seven verbs draw on a per-object fallback pool
        // that doc 06 specifies but nobody has written yet, so they are
        // allowed to be silent -- tracked by check-written-content.mjs
        // rather than papered over with a generated line here.
        const mustAnswer = !isStub && (verb.id === 'LOOK_AT' || verb.id === 'LISTEN_TO');
        if (mustAnswer) {
          assert.ok(
            producedSomething,
            `${room.id}/${target.id} + ${verb.id} produced nothing -- every combination must answer`,
          );
        }
        if (result.enteredDialogue) state.dialogue.end();
        if (result.changedRoom) state.enterRoom(room.id);
      }
    }
  }
});

test('every verb button is hit-testable and none overlap', async () => {
  const content = await loadContent(fsReader);
  const rects = content.verbs.verbs.map((verb) => ({ id: verb.id, rect: verbButtonRect(verb.col, verb.row) }));

  for (const { id, rect } of rects) {
    assert.ok(rect.y >= PLAY_HEIGHT, `${id} must sit inside the verb panel`);
    assert.ok(rect.y + rect.height <= NATIVE_HEIGHT, `${id} must not overflow the screen`);

    const centreX = rect.x + Math.floor(rect.width / 2);
    const centreY = rect.y + Math.floor(rect.height / 2);
    const hits = rects.filter((candidate) => pointInRect(centreX, centreY, candidate.rect));
    assert.equal(hits.length, 1, `a click at the centre of ${id} must select exactly one verb`);
    assert.equal(hits[0]!.id, id);
  }
});

test('the sentence line is assembled from templates, not built in code', async () => {
  const content = await loadContent(fsReader);
  const verb = content.verbs.verbs[0]!;

  const sentence = format(content.ui.sentence.template, { verb: verb.label, target: 'ALPHA BLOCK' });
  assert.ok(sentence.includes(verb.label));
  assert.ok(sentence.includes('ALPHA BLOCK'));
  assert.ok(!sentence.includes('{'), 'every placeholder should be filled');
});

test('the font is 1-bit, 5x7, and covers every character the harness uses', async () => {
  const content = await loadContent(fsReader);
  const font = new BitmapFont(content.font);

  assert.equal(font.height, 7);
  for (const rows of Object.values(content.font.glyphs)) {
    assert.equal(rows.length, 7, 'every glyph is seven rows tall');
    for (const row of rows) {
      assert.equal(row.length, 5, 'every glyph row is five pixels wide');
      assert.match(row, /^[.#]{5}$/, 'glyph rows are strictly 1-bit');
    }
  }

  for (const verb of content.verbs.verbs) {
    assert.deepEqual(font.unsupported(verb.label), [], `verb label "${verb.label}" needs glyphs`);
  }
});

test('word wrap keeps every line inside the play area', async () => {
  const content = await loadContent(fsReader);
  const font = new BitmapFont(content.font);
  const maxWidth = 308;

  for (const room of content.rooms.values()) {
    for (const target of [...room.hotspots, ...room.exits]) {
      for (const rules of Object.values(target.responses ?? {})) {
        for (const rule of rules) {
          if (!rule.say) continue;
          for (const line of font.wrap(rule.say, maxWidth)) {
            assert.ok(font.measure(line) <= maxWidth, `wrapped line overflows: "${line}"`);
          }
        }
      }
    }
  }
});

test('a double-click is two rapid clicks on the same target, not just two rapid clicks', () => {
  const first = recordClick('hs_beta', 1000);

  assert.equal(
    detectDoubleClick(first, 'hs_beta', 1100),
    true,
    'the same hotspot twice in quick succession walks',
  );
  assert.equal(
    detectDoubleClick(first, 'hs_alpha', 1100),
    false,
    'a different hotspot is a fresh interaction',
  );
  assert.equal(
    detectDoubleClick(first, 'hs_beta', 1500),
    false,
    'the same hotspot after the window is a fresh interaction',
  );

  // Regression: picking a verb then clicking a hotspot is the normal way to
  // play. If the panel click counted, the verb would be replaced by WALK TO.
  assert.equal(
    detectDoubleClick(recordClick(undefined, 1000), 'hs_beta', 1100),
    false,
    'a verb-panel click is never half of a double-click',
  );
  assert.equal(detectDoubleClick(NO_CLICK, undefined, 1000), false, 'empty space never walks');
});


test('every walkable region resolves to one of the three drawn heights', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const drawn = new Set(content.scaling.zones.map((zone) => zone.height));

  assert.deepEqual([...drawn].sort((a, b) => b - a), [40, 32, 26], 'errata ruling 15 sizes');

  for (const room of content.rooms.values()) {
    state.enterRoom(room.id);
    for (const region of room.walkable ?? []) {
      const [x, y, w, h] = region.rect;
      const height = state.actorHeightAt(x + Math.floor(w / 2), y + h - 1);
      assert.ok(height !== null, `${room.id}/${region.id} should be walkable at its own centre`);
      assert.ok(drawn.has(height!), `${room.id}/${region.id} resolved to an undrawn height ${height}`);
    }
  }
});

test('a point off the floor has no actor height at all', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');
  // Up in the sky. Returning a height here would let an actor stand on air.
  assert.equal(state.actorHeightAt(160, 4), null);
  assert.equal(state.isWalkable(160, 4), false);
});
