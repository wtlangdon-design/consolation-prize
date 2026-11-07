import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { BitmapFont, GLYPH_SCALE, PANEL_GLYPH_SCALE } from '../engine/render/BitmapFont.ts';
import {
  CHOICE_ARROW_X, CHOICE_LIST_TOP, CHOICE_ROWS, CHOICE_WIDTH, CONTINUE_MARK_EXTENT, choiceLines, clampSpeechX,
  panelShows, type ChoiceFit,
} from '../engine/render/Renderer.ts';
import { NATIVE_HEIGHT, NATIVE_WIDTH, PANEL_Y } from '../engine/render/Screen.ts';
import type { PresentedOption } from '../engine/core/DialogueRunner.ts';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const fresh = async () => new GameState(await loadContent(fsReader), new MemoryStorage());
/** The tree of the character the fifth room's proof spec talks to -- from the data, so no name of the fiction lives here. */
const roomFiveTree = (state: GameState): string => {
  const npc = [...state.content.ambient.values()].find((one) => one.room === 'assay_office' && one.tree);
  assert.ok(npc?.tree, 'the assay office has a character with a tree');
  return npc.tree;
};

/**
 * DOC 30 SECTION 14: "if the node has a greeting, enqueue it as a
 * speaker-labelled utterance; do not draw node.prompt". Section 16's binding
 * Room 1 proof: "no stale prompt is drawn".
 *
 * A node whose opening is performed line by line still carries `prompt` as
 * extracted metadata (the last line of that opening), and the renderer drew
 * it above the list -- so the line its speaker had just said stood a second
 * time over the choices. These guard the layout the renderer draws from:
 * the choices, and only the choices, for every tree in the manifest.
 */
test('the choice interface draws the options and never the node prompt', async () => {
  const state = await fresh();
  const ui = state.content.ui.dialogue;
  for (const [treeId, tree] of state.content.dialogue) {
    state.dialogue.start(treeId);
    const node = state.dialogue.currentNode;
    assert.ok(node, `${treeId} opens on a node`);
    const options = state.dialogue.presentOptions();
    assert.ok(options.length > 0, `${treeId} offers choices`);
    const layout = choiceLines(options, ui);
    assert.equal(layout.lines.length, options.length, `${treeId}: one line per option, nothing above them`);
    for (const [index, line] of layout.lines.entries()) {
      assert.ok(line.text.endsWith(options[index]!.option.text), `${treeId}: line ${index} is its option's text`);
      if (node.prompt) assert.ok(!line.text.includes(node.prompt), `${treeId}: the prompt "${node.prompt}" is not interface text`);
    }
    // The greeting, where the node has one, is spoken -- and its last line is
    // exactly what the prompt duplicates, which is why the prompt stays data.
    const opening = state.dialogue.openingOf(treeId);
    if (opening.length && node.prompt) assert.equal(opening.at(-1)?.line, node.prompt, `${treeId}: the prompt is the opening's last line, already spoken`);
    state.dialogue.end();
    void tree;
  }
});

test('the list is set from the top of the panel, so hitboxes and lines agree', async () => {
  const state = await fresh();
  const ui = state.content.ui.dialogue;
  state.dialogue.start(roomFiveTree(state));
  const options = state.dialogue.presentOptions();
  const layout = choiceLines(options, ui);
  // ERRATA 143: the panel's place, top-anchored, whatever the count -- a
  // prompt used to lift the backing by a line, and the count used to.
  assert.equal(layout.top, CHOICE_LIST_TOP);
  assert.equal(layout.backingTop, PANEL_Y, 'the backing is the panel band, and only the panel band');
  assert.equal(layout.backingTop, choiceLines([...options].reverse(), ui).backingTop);
  // An exhausted row is drawn dim with its own prefix; the rest are ink.
  assert.ok(layout.lines.every((line) => line.role === 'ink'), 'nothing is exhausted on a fresh tree');
  assert.ok(layout.lines.every((line) => line.text.startsWith(ui.optionPrefix)));
});

test('a goto node without a prompt lays out exactly as before: its rows and nothing else', async () => {
  const state = await fresh();
  const ui = state.content.ui.dialogue;
  state.dialogue.start(roomFiveTree(state));
  // The progress row that opens the second node, found by what it does.
  const opener = state.dialogue.presentOptions().find((p) => p.option.goto);
  assert.ok(opener, 'a row opens a second node at the first visit');
  state.dialogue.select(opener!.option.id);
  assert.equal(state.dialogue.positionSnapshot().node, opener!.option.goto);
  assert.equal(state.dialogue.currentNode?.noPrompt, true, 'the second node declares it has no prompt');
  const options = state.dialogue.presentOptions();
  assert.equal(options.length, 4);
  const layout = choiceLines(options, ui);
  assert.equal(layout.lines.length, 4);
  assert.equal(layout.top, CHOICE_LIST_TOP);
});

/* ---------------------------------------------------------------------------
 * ERRATA 143: THE LIST AS MONKEY ISLAND DREW IT (Tyler, 2026-11-06: "make
 * sure the way the dialogue trees are presented the same way they're
 * presented in MI and that they look as good as possible").
 * ------------------------------------------------------------------------- */

type Loaded = Awaited<ReturnType<typeof loadContent>>;

const panelFit = async (): Promise<{ fit: ChoiceFit; content: Loaded }> => {
  const content = await loadContent(fsReader);
  const font = new BitmapFont(content.font, PANEL_GLYPH_SCALE);
  return { content, fit: { wrap: (t, w) => font.wrap(t, w), measure: (t) => font.measure(t), width: CHOICE_WIDTH } };
};

/** Options as the list would present them: fresh, or every one used. */
const authored = (options: { id: string; text: string; tag: string }[], exhausted = false): PresentedOption[] =>
  options.map((option) => ({ option: option as PresentedOption['option'], text: option.text, exhausted, selections: exhausted ? 1 : 0 }));

/** The Assay's four longest counters, the truth in Duel Three among them: the rows that wrap. */
const longestCounters = (content: Loaded, fit: ChoiceFit): PresentedOption[] => {
  const texts: string[] = [];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === 'object') {
      for (const [key, inner] of Object.entries(value)) {
        if ((key === 'text' || key === 'counter') && typeof inner === 'string') texts.push(inner);
        else walk(inner);
      }
    }
  };
  walk(content.assay);
  const longest = [...new Set(texts)].sort((a, b) => fit.measure(b) - fit.measure(a)).slice(0, 4);
  return authored(longest.map((text, index) => ({ id: `c${index}`, text, tag: 'ASSAY' })));
};

test('THE ROOM KEEPS ITS HEIGHT: every node, at every scroll, draws only inside the panel', async () => {
  const { content, fit } = await panelFit();
  const ui = content.ui.dialogue;
  let scrolled = 0;
  const nodes: { where: string; options: PresentedOption[] }[] = [];
  for (const [treeId, tree] of content.dialogue) {
    for (const [nodeId, node] of Object.entries(tree.nodes)) nodes.push({ where: `${treeId}/${nodeId}`, options: authored(node.options) });
  }
  nodes.push({ where: 'the Assay\'s four longest', options: longestCounters(content, fit) });
  for (const { where, options } of nodes) {
    const rows = choiceLines(options, ui, fit).lines.reduce((sum, line) => sum + line.body.length, 0);
    const reached = new Set<number>();
    for (let scroll = 0; scroll < options.length; scroll += 1) {
      const layout = choiceLines(options, ui, fit, { scroll });
      assert.ok(layout.backingTop >= PANEL_Y, `${where}: the backing starts in the panel, not over the room`);
      const shown = layout.lines.filter((line) => line.shown);
      assert.ok(shown.length > 0, `${where}: something is in the window`);
      layout.lines.forEach((line, index) => { if (line.shown) reached.add(index); });
      for (const line of shown) {
        assert.ok(line.hitY >= PANEL_Y, `${where}: a row starts above the panel (${line.hitY})`);
        assert.ok(line.hitY + line.hitHeight <= NATIVE_HEIGHT, `${where}: a row runs off the frame`);
      }
      for (let at = 1; at < shown.length; at += 1) {
        assert.equal(shown[at]!.hitY, shown[at - 1]!.hitY + shown[at - 1]!.hitHeight, `${where}: rows abut, in authored order`);
      }
      // THE ARROWS APPEAR EXACTLY WHEN THE LIST IS LONGER THAN THE PANEL.
      assert.equal(layout.arrows.length > 0, rows > CHOICE_ROWS, `${where}: ${rows} rows against ${CHOICE_ROWS}; ${layout.arrows.length} arrows`);
      if (layout.arrows.length) {
        scrolled += 1;
        const [up, down] = layout.arrows;
        assert.equal(up!.live, layout.scroll > 0, `${where}: the up arrow is live exactly when the list is scrolled`);
        assert.equal(down!.live, layout.lines.at(-1)!.shown === false, `${where}: the down arrow is live exactly when the last option is out of view`);
        for (const arrow of layout.arrows) {
          assert.ok(arrow.x >= CHOICE_ARROW_X && arrow.x + arrow.width <= NATIVE_WIDTH
            && arrow.y >= PANEL_Y && arrow.y + arrow.height <= NATIVE_HEIGHT, `${where}: the arrow is in the panel`);
        }
      }
    }
    assert.equal(reached.size, options.length, `${where}: every option can be brought into view`);
  }
  // The defect: an eight-option tree grew up over Thad's feet, and nothing scrolled.
  assert.ok(scrolled > 0, 'some nodes are longer than the panel, and scroll');
});

test('A WRAPPED OPTION HANGS UNDER ITS TEXT, to the pixel, not under its marker', async () => {
  const { content, fit } = await panelFit();
  const ui = content.ui.dialogue;
  const advance = (text: string) => fit.measure(`${text}x`) - fit.measure('x');
  const layout = choiceLines(longestCounters(content, fit), ui, fit);
  assert.ok(layout.lines.some((line) => line.body.length > 1), 'the longest counters wrap');
  for (const line of layout.lines) {
    // The continuation was indented with spaces, and a space is narrower than
    // a dash in this face: it started eight pixels left of the text it continued.
    assert.equal(line.textX - 6 * GLYPH_SCALE, advance(ui.optionPrefix), `${line.text.slice(0, 30)}: text starts after the marker`);
    for (const row of line.body) assert.ok(line.textX + fit.measure(row) <= CHOICE_ARROW_X, 'a row stops short of the arrows');
  }
});

test('THE ROW UNDER THE POINTER LIGHTS, and a used one keeps its dim with a bright marker', async () => {
  const { content, fit } = await panelFit();
  const ui = content.ui.dialogue;
  const four = authored([0, 1, 2, 3].map((i) => ({ id: `o${i}`, text: `Option ${i}`, tag: 'TOPIC' })));
  const plain = choiceLines(four, ui, fit);
  const lit = choiceLines(four, ui, fit, { hovered: 'o2' });
  for (const [index, line] of lit.lines.entries()) {
    if (index === 2) {
      assert.equal(line.role, 'inkBright', 'MI: the row under the pointer is brighter');
      assert.equal(line.marker, ui.optionPrefixSelected, 'doc 30 6.1: focus uses optionPrefixSelected');
    } else {
      assert.deepEqual(line, plain.lines[index], 'the other rows are untouched');
    }
    assert.deepEqual(line.body, plain.lines[index]!.body, 'pointing never re-wraps a row');
  }
  const used = choiceLines(authored([{ id: 'u', text: 'Asked already', tag: 'COMIC' }], true), ui, fit, { hovered: 'u' }).lines[0]!;
  assert.equal(used.role, 'inkDim', 'doc 30 6.1: a used option stays dim under the pointer');
  assert.equal(used.markerRole, 'inkBright', 'with a bright marker, so the pointer can be seen');
  // A row out of the window is never lit, whatever the pointer says.
  const nine = authored(Array.from({ length: 9 }, (_, i) => ({ id: `n${i}`, text: `Row ${i}`, tag: 'TOPIC' })));
  const hidden = choiceLines(nine, ui, fit, { hovered: 'n8' }).lines[8]!;
  assert.equal(hidden.shown, false);
  assert.equal(hidden.role, 'ink');
});

test('NOTHING ABOUT A ROW SAYS WHAT IT DOES: its look is a function of used and pointed-at alone', async () => {
  const { content, fit } = await panelFit();
  const ui = content.ui.dialogue;
  // Invariants 1 and 7: [COMIC] is never marked, and HOB_C1 option 4 -- which
  // silently sets a critical flag -- looks exactly like its neighbours.
  assert.ok((content.dialogue.get('HOB')?.nodes.HOB_C1?.options.length ?? 0) >= 4, 'HOB_C1 is among the nodes checked');
  for (const [treeId, tree] of content.dialogue) {
    for (const [nodeId, node] of Object.entries(tree.nodes)) {
      for (const exhausted of [false, true]) {
        const looks = new Set(choiceLines(authored(node.options, exhausted), ui, fit).lines
          .map((line) => `${line.role}|${line.marker}|${line.markerRole}|${line.textX}`));
        assert.equal(looks.size, 1, `${treeId}/${nodeId}: rows that differ only in tag or effect are drawn alike (${[...looks].join(' / ')})`);
      }
    }
  }
});

test('THE WAITING TRIANGLE STAYS IN THE FRAME, however near the edge the speaker stands', () => {
  // Thad's echo by the coach sat at the right-hand clamp and the triangle
  // after it (errata 126) was sliced off by the frame.
  const half = 500;
  for (const screenX of [0, 400, 960, 1500, 1880, 1920, 2400]) {
    const x = clampSpeechX(screenX, half, half + CONTINUE_MARK_EXTENT);
    assert.ok(x + half + CONTINUE_MARK_EXTENT <= NATIVE_WIDTH - 6 * GLYPH_SCALE, `at ${screenX}: the mark ends at ${x + half + CONTINUE_MARK_EXTENT}`);
    assert.ok(x - half >= 6 * GLYPH_SCALE, `at ${screenX}: the block starts in the frame`);
  }
});

test('THE PANEL STAYS AWAY FOR ALL OF A CONVERSATION, as the list replaces it', () => {
  // It came back for every answer performed between choices -- verbs,
  // inventory and a sentence line still naming whoever was talked to.
  assert.equal(panelShows({ opening: false, conversation: true, panelHidden: false, cutscene: false }), false);
  assert.equal(panelShows({ opening: false, conversation: false, panelHidden: false, cutscene: false }), true);
  assert.equal(panelShows({ opening: true, conversation: false, panelHidden: false, cutscene: false }), false);
});
