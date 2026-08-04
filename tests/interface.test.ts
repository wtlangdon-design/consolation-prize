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
  NATIVE_HEIGHT,
  NATIVE_WIDTH,
  PANEL_HEIGHT,
  PLAY_HEIGHT,
  pointInRect,
  PanelLayout,
} from '../engine/render/Screen.ts';
import { format } from '../engine/render/Renderer.ts';
import { ActorSprite } from '../engine/render/ActorSprite.ts';
import {
  isDoubleClick as detectDoubleClick,
  NO_CLICK,
  recordClick,
} from '../engine/core/ClickTracker.ts';
import { SequenceRunner, type SequenceHost } from '../engine/core/Sequence.ts';
import { carriedStepsFor, segmentsOf, stepsFor } from '../engine/core/Opening.ts';
import {
  mappingAt,
  offsetAt,
  resolve as resolveCycling,
  sameMapping,
  stateCount,
} from '../engine/core/PaletteCycling.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

test('errata 54: the panel occupies the bottom 216px of a 1920x1080 screen', () => {
  assert.equal(NATIVE_HEIGHT, 1080);
  assert.equal(PLAY_HEIGHT, 864);
  assert.equal(PANEL_HEIGHT, 216);

  // The play area is an exact 6x of the old one and the panel is not. That
  // asymmetry is the whole reason 1080 works: it is 5.4x of 200, and errata
  // 54 resolves it by shrinking the panel rather than stretching it. Asserted
  // because a later 'tidy-up' that made the panel 336 to match the 6x would
  // look consistent and would be wrong.
  assert.equal(PLAY_HEIGHT, 144 * 6);
  assert.equal(NATIVE_WIDTH, 320 * 6);
  assert.notEqual(PANEL_HEIGHT, 56 * 6);
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
      const isExit = (target as { to?: string }).to !== undefined;
      for (const verb of content.verbs.verbs) {
        state.verbs.selectVerb(verb.id);
        const result = state.interact(target, verb.id);
        const producedSomething = result.say !== null || result.enteredDialogue || result.changedRoom;
        // LOOK and LISTEN are written for every hotspot and must always
        // answer. The other seven verbs draw on a per-object fallback pool
        // that doc 06 specifies but nobody has written yet, so they are
        // allowed to be silent -- tracked by check-written-content.mjs
        // rather than papered over with a generated line here.
        // Transit verbs on an exit go through it and say nothing, on purpose.
        const transits = isExit && state.verbs.isTransit(verb.id);
        const mustAnswer = !isStub && !transits && (verb.id === 'LOOK_AT' || verb.id === 'LISTEN_TO');
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
  const panel = new PanelLayout(content.panel);
  const rects = content.verbs.verbs.map(
    (verb) => ({ id: verb.id, rect: panel.verbButton(verb.col, verb.row) }),
  );
  // Errata ruling 26 put the menu button in the verb grid's fourth row. It is
  // in this list because it is a button in the same grid, and because it used
  // to overlap LISTEN TO's bottom two rows -- which no test noticed, since
  // the two were laid out by different numbers in different files.
  rects.push({ id: 'menu', rect: panel.menuButton });

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

test('Q35: every line of panel text clears the line below it and the frame edge', async () => {
  const content = await loadContent(fsReader);
  const panel = new PanelLayout(content.panel);
  const font = new BitmapFont(content.font, PANEL_GLYPH_SCALE);

  // FOUR IS DERIVED, AND THIS IS THE DERIVATION. The play area migrated by six
  // because it IS six. The panel is 216 against the old 56, which is 3.857 --
  // errata 54 re-proportioned it rather than scaling it -- and the face came
  // along at six anyway. Asserted against the geometry rather than written
  // down, so the number cannot drift from the thing it came from.
  assert.equal(PANEL_GLYPH_SCALE, Math.round(PANEL_HEIGHT / 56));
  assert.notEqual(PANEL_GLYPH_SCALE, GLYPH_SCALE);

  // Every line of ink in the panel, top to bottom, at the y a label is really
  // drawn at rather than the y of the box around it.
  const labelY = (rect: { y: number; height: number }) => rect.y
    + Math.max(0, Math.floor((rect.height - font.height) / 2));
  const lines = [
    { id: 'sentence line', top: panel.sentence.y },
    ...[0, 1, 2, 3].map((row) => ({ id: `verb row ${row}`, top: labelY(panel.verbButton(0, row)) })),
  ];

  // ONE GLYPH PIXEL OF LEADING, MINIMUM. Not an arbitrary threshold: it is the
  // font's own unit of space, and at six the panel had less. TALK TO and MENU
  // had NONE -- one unbroken 83-row run of ink, which is what "printed on top
  // of each other" looks like when you measure it.
  for (let index = 1; index < lines.length; index += 1) {
    const above = lines[index - 1]!;
    const below = lines[index]!;
    const gap = below.top - (above.top + font.height);
    assert.ok(gap >= font.scale,
      `${above.id} leaves ${gap} units above ${below.id}, less than one glyph pixel`);
  }

  // AND THE LAST LINE MUST NOT SIT ON THE FRAME EDGE. At six it ended one unit
  // from the bottom, which is inside the frame at 1:1 and gone the moment the
  // canvas is FIT-scaled -- on a 1366x768 Chromebook, 0.711, MENU and MAP and
  // FULL were visibly cut off. This is the machine the game is played on, so
  // "technically inside the frame" is not the property worth asserting.
  const last = lines[lines.length - 1]!;
  const margin = NATIVE_HEIGHT - (last.top + font.height);
  assert.ok(margin >= font.scale,
    `${last.id} ends ${margin} units from the frame bottom, less than one glyph pixel`);
});

test('a staged say places one of the beat\'s own lines, and never duplicates it', async () => {
  const content = await loadContent(fsReader);
  const opening = content.sequences.get('opening')!;
  const beat = opening.beats.find((b) => b.beat === '9')!;

  // THE DEFECT: a beat's lines were appended after ALL of its staging, so
  // "speak, then walk on" could not be written. Hob spoke all three lines
  // from x2100 -- 180 units past the right edge of a 1920-wide frame, with
  // the words on screen and the man who says them off it.
  //
  // THE SHAPE CHANGED AND THE INVARIANT DID NOT. He no longer walks in: he is
  // staged STANDING at the roadside in beat 7, because a man who arrives,
  // says three sentences and leaves is an event rather than a neighbour, and
  // because the lamp he carries was gated on a window a few seconds wide. So
  // the test is no longer "he walks and then walks again" -- there is one
  // walk now, the one that takes him away. What must still hold is the thing
  // the defect broke: EVERY LINE LANDS BEFORE HE LEAVES.
  const kinds = carriedStepsFor(beat).map((step) => step.kind);
  const leaves = kinds.indexOf('walk');
  const said = kinds.map((k, i) => (k === 'say' ? i : -1)).filter((i) => i >= 0);
  assert.ok(said.length > 0, 'the beat speaks');
  assert.ok(leaves >= 0, 'and he leaves at the end of it');
  for (const at of said) {
    assert.ok(at < leaves, `a line at step ${at} is spoken after he has started to go`);
  }

  // AND EACH LINE ONCE. A beat that places any of its lines places all of
  // them -- appending the rest would play a scheduled line beside an
  // unscheduled one in an order nobody chose.
  assert.equal(said.length, beat.lines!.length);
  const spoken = carriedStepsFor(beat)
    .filter((step) => step.kind === 'say')
    .map((step) => (step as { line?: string }).line);
  assert.deepEqual(spoken, beat.lines!.map((l) => l.line));

  // The staging carries NO TEXT. The words live in doc 17; the step says only
  // when one of them lands, and an index is checkable where a string is not.
  for (const staged of beat.staging ?? []) {
    if (staged.do !== 'say') continue;
    assert.equal(typeof (staged as { line: unknown }).line, 'number');
  }
});

test('Q38: a clip may be chosen by object state, and no state behaves as before', async () => {
  const content = await loadContent(fsReader);
  const record = content.actors.get('coach')!;
  // STRIPPED OF ITS STATE CLIPS for the first half. The coach now DECLARES a
  // door-open idle, so it is no longer an example of "a record with no state"
  // -- and this test's whole first premise was that. Building the stateless
  // case explicitly says what is being tested instead of relying on the art
  // not to change, which it did.
  const plain = { ...record, clips: record.clips.filter((c) => !c.state) };
  const table = new ActorSprite(plain, () => null);

  // A record that declares no state resolves exactly as it always did. This
  // is the property that makes the second discriminator free: every character
  // in the game has no `state` on any clip.
  // ASSERTED AGAINST THE RECORD, NOT AGAINST A NUMBER. This used to say 1,
  // which was a fact about the coach's art rather than about the rule -- and
  // it broke the day its lamps were given a flicker and idle went to six
  // frames. R5e: a check written from the same understanding as the thing it
  // checks catches nothing.
  const stateless = plain.clips.find((c) => c.id === 'idle' && !c.state)!;
  assert.equal(table.frameCount('idle', 'right', ''), stateless.frames.length);
  assert.equal(table.frameCount('idle', 'right', '', 'door-open'), stateless.frames.length,
    'an unknown state falls back to the stateless clip, it does not vanish');

  // And with a state declared, the state wins and the stateless clip remains
  // the fallback -- the same exact-match-then-fall-back the surface variant
  // already used, which is why this adds no mechanism.
  const open = { ...stateless, state: 'door-open' };
  const both = new ActorSprite({ ...plain, clips: [...plain.clips, open] }, () => null);
  assert.equal(both.frameCount('idle', 'right', '', 'door-open'), open.frames.length);
  assert.equal(both.frameCount('idle', 'right', ''), stateless.frames.length,
    'no state still finds the stateless clip');
  assert.equal(both.frameCount('idle', 'right', '', 'no-such-state'), stateless.frames.length,
    'and so does an unknown one');
});

test('the sentence line is assembled from templates, not built in code', async () => {
  const content = await loadContent(fsReader);
  const verb = content.verbs.verbs[0]!;

  const sentence = format(content.ui.sentence.template, { verb: verb.label, target: 'ALPHA BLOCK' });
  assert.ok(sentence.includes(verb.label));
  assert.ok(sentence.includes('ALPHA BLOCK'));
  assert.ok(!sentence.includes('{'), 'every placeholder should be filled');
});

test('the font is 1-bit, 5x7 in data, drawn six units per glyph pixel', async () => {
  const content = await loadContent(fsReader);
  const font = new BitmapFont(content.font);

  // Q6, PARTIAL: the ruling scales the face and does not replace it. So the
  // GLYPH DATA is still strictly 5x7 -- asserted below, unchanged -- and only
  // the drawn size moved. Both halves are asserted because getting either one
  // alone is a way for this to go wrong quietly: a scaled face with edited
  // glyphs is a typeface decision nobody made, and unscaled glyph data is the
  // sixth-of-the-size bug this ruling exists to fix.
  assert.equal(GLYPH_SCALE, 6, 'the same integer the play-area geometry migrated by');
  assert.equal(font.height, 7 * GLYPH_SCALE);
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
  // The play area less a margin either side, in the frame the text is now
  // actually drawn in. Was 308 of 320.
  const maxWidth = NATIVE_WIDTH - 72;

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


test('the floor resolves everywhere, and a nearer point is never a smaller man', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const heights = content.scaling.zones.map((zone) => zone.height);
  const tallest = Math.max(...heights);
  const shortest = Math.min(...heights);

  // THIS TEST HAS NOW BEEN WRITTEN THREE TIMES AND THE HISTORY IS THE POINT.
  // Ruling 24's version asserted a RANGE between two drawn sizes with a
  // decimation threshold inside it; errata 54 removed both. The version after
  // it asserted every point resolved to ONE height, which was true only while
  // the zone table was a flat placeholder and would have gone on passing while
  // saying nothing the moment a real curve landed. Q4's measured curve is that
  // moment.
  //
  // So what is asserted now is the PROPERTY a depth curve has to have, in any
  // room, at any scale, however it is measured: the floor resolves wherever
  // the content says it is walkable, the answer stays inside the declared
  // range, and WALKING TOWARD THE CAMERA NEVER MAKES THE MAN SMALLER. A
  // sign-flipped curve, a zone table entered back to front, or a band whose
  // index does not match its depth all fail it, and none of them fails a test
  // that checks a number.
  assert.ok(tallest > shortest, 'the zone table describes a depth range at all');

  for (const room of content.rooms.values()) {
    state.enterRoom(room.id);
    for (const region of room.walkable ?? []) {
      const [x, y, w, h] = region.rect;
      const middle = x + Math.floor(w / 2);
      const height = state.actorHeightAt(middle, y + h - 1);
      assert.ok(height !== null, `${room.id}/${region.id} should be walkable at its own centre`);
      assert.ok(height! <= tallest && height! >= shortest,
        `${room.id}/${region.id} resolved to ${height}, outside the declared range`);
    }

    // Sampled down the whole floor rather than per band, so a discontinuity at
    // a band edge is caught as well as a wrong gradient inside one.
    let previous: number | null = null;
    let previousY = 0;
    for (let y = 0; y < PLAY_HEIGHT; y += 4) {
      const height = state.actorHeightAt(NATIVE_WIDTH / 2, y);
      if (height === null) continue;
      if (previous !== null) {
        assert.ok(height >= previous,
          `${room.id}: y ${previousY} -> ${y} took the man from ${previous} to ${height}`);
      }
      previous = height;
      previousY = y;
    }
  }
});

test('Room 2 declares one fixed box at the lip, and no step until Q6 draws one', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');

  // WHAT THIS USED TO ASSERT AND WHY IT CANNOT. Errata 28a placed ONE source
  // swap in the room, at the boardwalk lip: the fixed box drew at ruling 24's
  // far sheet and the mud below it at the near one, so there was a measurable
  // step. Errata 54 left one drawn size, Q9 removed the threshold that chose
  // between them, and Q6's per-room curve does not exist -- so there is
  // nothing to swap and no step to find. Asserting a step here would be a
  // test that cannot pass.
  //
  // What is still binding is 28a's GEOMETRY, and that is asserted instead:
  // exactly one box is fixed and it is the lip. It stays true when Q6 puts a
  // real step back, and this test grows the step assertion back with it.
  const room = content.rooms.get('main_street')!;
  const fixed = room.walkBoxes!.filter((box) => box.scaleMode.kind === 'fixed');
  assert.equal(fixed.length, 1, 'exactly one fixed box in the room');
  assert.equal(fixed[0]!.id, 'boardwalk', 'and it is the lip');

  const jumps: { y: number; from: number; to: number }[] = [];
  let previous: number | null = null;
  for (let y = 468; y < 864; y += 1) {
    const height = state.actorHeightAt(960, y);
    if (height === null) continue;
    if (previous !== null && Math.abs(height - previous) > 1) {
      jumps.push({ y, from: previous, to: height });
    }
    previous = height;
  }
  assert.deepEqual(jumps, [], 'a flat placeholder table has no step anywhere');
});

test('a point off the floor has no actor height at all', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');
  // Up in the sky. Returning a height here would let an actor stand on air.
  assert.equal(state.actorHeightAt(160, 4), null);
  assert.equal(state.isWalkable(160, 4), false);
});

test('a hotspot whose state gate fails is not there at all', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('stage_road');

  // Ruling 19a. Before Hob walks onto the road there is no lamp, so clicking
  // where the lamp will be must find nothing -- not a lamp with a caveat.
  const lampRect = content.rooms.get('stage_road')!.hotspots
    .find((hotspot) => hotspot.id === 'lamp')!.rect;
  const centre: [number, number] = [lampRect[0] + 2, lampRect[1] + 2];
  assert.equal(state.findTarget('lamp'), undefined);
  assert.equal(state.findTarget('lamp_gone'), undefined);
  assert.equal(state.targetAt(...centre), undefined);

  // The coach is here and so is its team; the road it left on is not.
  assert.ok(state.findTarget('coach'));
  assert.ok(state.findTarget('team'));
  assert.equal(state.findTarget('coach_gone'), undefined);

  state.flags.set('T_COACH_DEPARTED', true);
  state.flags.set('T_HOB_CROSSING', true);
  assert.equal(state.findTarget('coach'), undefined);
  assert.equal(state.findTarget('team'), undefined, 'the team leaves with the coach');
  assert.ok(state.findTarget('coach_gone'));

  // Both halves of a state change share a rect, so only one may ever answer.
  const crossing = state.targetAt(...centre);
  assert.equal(crossing?.id, 'lamp');
  state.flags.set('T_HOB_GONE', true);
  assert.equal(state.targetAt(...centre)?.id, 'lamp_gone');
});

test("the mud's first LISTEN stands alone, and the last one repeats forever", async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');
  const mud = state.findTarget('mud')!;
  state.verbs.selectVerb('LISTEN_TO');

  // ERRATA 28b AS AMENDED (Q74): THE VERB CLEARS ON USE, so a player hearing
  // three variants re-selects LISTEN TO three times. This test used to select
  // once and click three times, which is what the old rule allowed -- and the
  // mud is the object where the difference shows, because its own defaultVerb
  // is WALK TO, so an unselected second click walks instead of listening.
  const listen = () => {
    state.verbs.selectVerb('LISTEN_TO');
    return state.interact(mud, state.verbs.verbFor(mud)).say;
  };
  const first = listen();
  const second = listen();
  const third = listen();

  // Doc 13, reordered: variant 1 has to work cold, because most players
  // listen once and never again. It used to be a bare "Nothing new.", which
  // is an answer to a question nobody had asked yet. This test guarded the
  // old shape -- variants 1 and 2 being character-for-character identical --
  // and had to be rewritten rather than deleted, because the sequence still
  // needs a guard and the tail of it is unchanged.
  assert.notEqual(second, first, 'variant 1 no longer leans on a look the player has not taken');
  assert.notEqual(third, second, 'variant 3 does move on');
  assert.equal(listen(), third, 'and the third repeats indefinitely thereafter');
  // AND THE RULE ITSELF, asserted where the behaviour actually lives. The
  // change passed 132 tests when it was wired in the scene; nothing could see
  // it until it moved into the model.
  state.verbs.selectVerb('LOOK_AT');
  state.interact(mud, 'LOOK_AT');
  assert.equal(state.verbs.selectedVerb, null,
    'a verb clears on use, so the no-verb state is reachable after the first click of the game');
});

test('object overrides repeat; global pools rotate', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');

  // Doc 13 note 4. Two different behaviours, both correct.
  const dog = state.findTarget('dog')!;
  // Q74: re-selected per click, because the verb now clears on use.
  const push = () => {
    state.verbs.selectVerb('PUSH');
    return state.interact(dog, state.verbs.verbFor(dog)).say;
  };
  const override = [push(), push(), push()];
  assert.equal(override[0], 'I will not.');
  assert.ok(
    override.every((line) => line === override[0]),
    'an object override fires the same line every time for that verb-object pair',
  );

  // The hills have no PUSH override, so PUSH falls to the global pool.
  const hills = state.findTarget('hills')!;
  const pool = content.verbFallbacks.pools['PUSH']!;
  const drawn = [state.interact(hills, state.verbs.verbFor(hills)).say, state.interact(hills, state.verbs.verbFor(hills)).say, state.interact(hills, state.verbs.verbFor(hills)).say];
  assert.equal(new Set(drawn).size, Math.min(3, pool.length), 'the pool rotates rather than repeating');
  for (let index = 1; index < drawn.length; index += 1) {
    assert.notEqual(drawn[index], drawn[index - 1], 'and never repeats consecutively');
  }
});

test('every verb now answers on every Main Street hotspot', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');

  for (const target of content.rooms.get('main_street')!.hotspots) {
    for (const verb of content.verbs.verbs) {
      state.verbs.selectVerb(verb.id);
      const result = state.interact(target, verb.id);
      assert.ok(
        result.say !== null,
        `${target.id} + ${verb.id} is silent -- doc 06 allows no unanswered combination`,
      );
    }
  }
});


test('OPEN and USE walk through an exit and say nothing; every other verb answers', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const street = content.rooms.get('main_street')!;

  for (const exit of street.exits) {
    // A stub exit is a door whose examine layer is honestly absent -- doc 05
    // does not script the assay office's, and check-examine-lines skips them
    // for the same reason. Transit is still asserted below; only the lines
    // are exempt, because there are none to assert.
    if (exit.stub) continue;
    // Doc 14 engine note. Going through a door is not a question about it.
    for (const verb of ['OPEN', 'USE']) {
      state.enterRoom('main_street');
      state.verbs.selectVerb(verb);
      const result = state.interact(exit, state.verbs.verbFor(exit));
      assert.equal(result.changedRoom, true, `${exit.id} + ${verb} should transit`);
      assert.equal(result.say, null, `${exit.id} + ${verb} must produce no line`);
      assert.equal(state.roomId, exit.to);
    }

    // Everything else describes the doorway from the street and stays put.
    state.enterRoom('main_street');
    for (const verb of content.verbs.verbs) {
      if (state.verbs.isTransit(verb.id)) continue;
      state.verbs.selectVerb(verb.id);
      const result = state.interact(exit, state.verbs.verbFor(exit));
      assert.equal(result.changedRoom, false, `${exit.id} + ${verb.id} should not transit`);
      assert.ok(result.say, `${exit.id} + ${verb.id} is silent`);
    }
  }
});

test('every exit is reachable by clicking it, scenery notwithstanding', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');

  // Regression. Every Room 2 exit sits inside a much larger hotspot -- the
  // three doors inside THE FALSE FRONTS, the road inside THE MUD -- so with
  // scenery hit-testing first, no exit in the room could be clicked at all.
  // Driving state.interact(exit, state.verbs.verbFor(exit)) directly cannot catch this; only a click can.
  for (const exit of content.rooms.get('main_street')!.exits) {
    const [x, y, w, h] = exit.rect;
    const hit = state.targetAt(x + Math.floor(w / 2), y + Math.floor(h / 2));
    assert.equal(hit?.id, exit.id, `a click at the centre of ${exit.id} hit ${hit?.id} instead`);
  }
});

test('exits carry three LOOK and three LISTEN variants from doc 14', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');

  for (const exit of content.rooms.get('main_street')!.exits) {
    if (exit.stub) continue;
    for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
      // Q74: the verb clears on use, so each repeat re-selects -- which is
      // what a player now does. An exit's own defaultVerb is OPEN or WALK TO,
      // so an unselected second click would go THROUGH the door rather than
      // look at it again, and the third variant would never be reached.
      const ask = () => {
        state.verbs.selectVerb(verb);
        return state.interact(exit, state.verbs.verbFor(exit)).say;
      };
      const seen = [ask(), ask(), ask(), ask()];
      assert.equal(new Set(seen.slice(0, 3)).size, 3, `${exit.id}/${verb} needs three distinct variants`);
      assert.equal(seen[3], seen[2], 'the third repeats indefinitely thereafter');
    }
  }
});


test('no F-key is bound anywhere -- the Chromebook top row is browser keys', async () => {
  const { readdir } = await import('node:fs/promises');
  const engineFiles: string[] = [];
  const walk = async (dir: string): Promise<void> => {
    for (const entry of await readdir(resolve(ROOT, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) await walk(path);
      else if (entry.name.endsWith('.ts')) engineFiles.push(path);
    }
  };
  await walk('engine');

  for (const path of engineFiles) {
    const source = await readFile(resolve(ROOT, path), 'utf8');
    // A binding looks like `keydown-F5` or 'F5' as a key constant. Prose in
    // a comment explaining WHY there are no F-keys is allowed to say F5.
    const code = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    assert.doesNotMatch(
      code,
      /['"`]F(?:[1-9]|1[0-2])['"`]|keydown-F\d/,
      `${path} binds an F-key; the target machine's top row never reaches the game`,
    );
  }
});

test('every menu route is reachable by mouse, and load greys out with no save', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());

  assert.equal(state.menu.isOpen, false);
  state.menu.open();
  assert.equal(state.menu.isOpen, true);

  const root = state.menu.rows();
  const ids = root.map((row) => row.id);
  // ERRATA 39's fullscreen sits above Quit to Title: it is the only root item
  // that changes nothing about the game, so beside Resume it would read as a
  // state change and below Quit it would come after the exit.
  assert.deepEqual(ids, ['resume', 'save', 'load', 'options', 'fullscreen', 'quit']);
  assert.equal(state.menu.select('fullscreen').kind, 'fullscreen',
    'and it is reachable by mouse, which is the whole of the mouse-only requirement');
  assert.equal(state.menu.isOpen, true,
    'and it does not close the menu -- the player is looking at the thing that resized');
  state.menu.open();
  assert.equal(root.find((row) => row.id === 'load')!.enabled, false,
    'Load is dim with nothing saved, but still present');

  // Save into slot 2, then Load must come alive and name the room.
  state.menu.select('save');
  const slots = state.menu.rows().filter((row) => row.id.startsWith('slot:'));
  assert.equal(slots.length, content.menu.slots.count);
  const action = state.menu.select('slot:1');
  assert.equal(action.kind, 'save');
  assert.equal(action.slot, 1);
  state.save(1);

  state.menu.open();
  assert.equal(state.menu.rows().find((row) => row.id === 'load')!.enabled, true);
  state.menu.select('load');
  const loadRow = state.menu.rows().find((row) => row.id === 'slot:1')!;
  assert.ok(loadRow.enabled, 'a used slot can be loaded');
  assert.ok(
    loadRow.label.includes(content.rooms.get(content.manifest.startRoom)!.name),
    'the slot names the room, not the room id',
  );
  assert.equal(state.menu.rows().find((row) => row.id === 'slot:0')!.enabled, false,
    'an empty slot cannot be loaded');
});

test('ESC steps back out of a subpage rather than closing the menu', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());

  state.menu.escape();
  assert.equal(state.menu.page, 'root');
  state.menu.select('options');
  assert.equal(state.menu.page, 'options');
  state.menu.escape();
  assert.equal(state.menu.page, 'root', 'ESC in a subpage goes back, not out');
  state.menu.escape();
  assert.equal(state.menu.page, 'closed');
});

test('a save slot records which room it was made in', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  // Any room that is not the start room. Picked from content rather than
  // named here -- a test that hard-codes a room id is a test that knows
  // about the fiction, and check-no-content-in-code is right to reject it.
  const elsewhere = [...content.rooms.keys()].find(
    (id) => id !== content.manifest.startRoom && !content.rooms.get(id)!.fixture,
  )!;
  state.enterRoom(elsewhere);
  state.save(0);

  const [slot] = state.saves.listSlots(1, content.menu.slots.time);
  assert.equal(slot!.used, true);
  assert.equal(slot!.room, elsewhere);
  assert.ok(slot!.when.length > 0, 'and when it was made');
});


test('repeat variants cycle FORWARD, then hold on the last one', async () => {
  const content = await loadContent(fsReader);

  // Reported as a bug: variants appearing to arrive in reverse, so a hotspot
  // gives its third line first. It does not, and this asserts it across every
  // written sequence in the game rather than for the one hotspot that
  // prompted the report -- if the cycling were ever inverted it would be
  // inverted everywhere, and every escalating variant in every room would
  // land backwards.
  let sequences = 0;
  for (const room of content.rooms.values()) {
    if ((room as { fixture?: boolean }).fixture) continue;
    const state = new GameState(content, new MemoryStorage());
    state.enterRoom(room.id);
    for (const target of [...room.hotspots, ...room.exits]) {
      for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
        const rule = target.responses?.[verb]?.[0];
        if (!rule?.say) continue;
        const expected = [rule.say, ...(rule.repeat ?? [])];
        // Q74: the verb clears on use, so it is re-selected per repeat. The
        // targets that expose the difference are the ones whose own
        // defaultVerb is not the verb under test -- the mud, the case, every
        // exit -- where an unselected second click does something else
        // entirely instead of giving the next variant.
        const got = expected.map(() => {
          state.verbs.selectVerb(verb);
          return state.interact(target, state.verbs.verbFor(target)).say;
        });
        assert.deepEqual(
          got, expected,
          `${room.id}/${target.id}/${verb} did not return its variants in written order`,
        );
        // And the last one repeats indefinitely rather than wrapping round.
        // Re-selected, like the others: this line asked with NOTHING selected
        // and so asked the target's own defaultVerb -- which for the case is
        // LOOK AT, so the LISTEN sequence was checked for a LOOK line.
        state.verbs.selectVerb(verb);
        assert.equal(state.interact(target, state.verbs.verbFor(target)).say, expected[expected.length - 1]);
        sequences += 1;
      }
    }
  }
  assert.ok(sequences > 60, `expected to have checked the whole game, checked ${sequences}`);
});

test('palette cycling: rotate wraps, pingpong turns round, pulse clamps', async () => {
  const content = await loadContent(fsReader);
  const room = content.rooms.get('stage_road')!;
  const elements = (room.cycling ?? []).map((element) => resolveCycling(content.palette, element));
  const lamp = elements.find((element) => element.mode === 'pulse')!;
  const puddles = elements.find((element) => element.mode === 'pingpong')!;

  // Pingpong turns round rather than repeating: 0 1 2 1, then again.
  assert.deepEqual([0, 1, 2, 3, 4].map((step) => offsetAt(puddles, step)), [0, 1, 2, 1, 0]);
  assert.equal(stateCount(puddles), 4);

  // Pulse CLAMPS. Wrapping would drop the lamp's brightest entry to its
  // darkest every second beat, which is a strobe and not a flame -- and it
  // would do it to the only warm object in the only night exterior.
  const brightest = lamp.first + lamp.count - 1;
  const lit = mappingAt([lamp], 1 / lamp.rate + 0.01);
  assert.equal(lit.get(brightest), brightest, 'the core holds');
  assert.equal(lit.get(lamp.first), lamp.first + 1, 'everything under it comes up one step');

  // And it comes back. Two states, so one full period returns the base frame.
  assert.ok(sameMapping(mappingAt([lamp], 0), mappingAt([lamp], 2 / lamp.rate + 0.01)));
});

test('background motion is an option, on by default, and reversible', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());

  // Doc 18 note 2: decorative, disableable, defaulting on.
  assert.equal(state.menu.toggle('cycling'), true);

  state.menu.open();
  state.menu.select('options');
  const before = state.menu.rows().find((row) => row.id === 'cycling')!;
  state.menu.select('cycling');
  assert.equal(state.menu.toggle('cycling'), false);
  const after = state.menu.rows().find((row) => row.id === 'cycling')!;
  assert.notEqual(after.label, before.label, 'the row says which way it is set');

  state.menu.select('cycling');
  assert.equal(state.menu.toggle('cycling'), true);
});

test('a stub exit still transits, and ruling 20 keeps the landing man still', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());

  // Doc 20 rule 1. The assay office was composed, wired and audited while
  // nothing on Main Street opened onto it, so the one thing this exit has to
  // do -- with no lines at all -- is work.
  state.enterRoom('main_street');
  const assay = state.findTarget('to_assay_office')!;
  state.verbs.selectVerb('OPEN');
  assert.equal(state.interact(assay, state.verbs.verbFor(assay)).changedRoom, true);
  assert.equal(state.roomId, 'assay_office');

  // Ruling 20: four of a crowd of eleven animate, and the man on the landing
  // is an explicit exception. He has no idle and must never get one.
  //
  // The room is found by the fact that it declares idles rather than by name.
  // check-no-content-in-code counts a room's name as fiction leaking into the
  // engine, and a test that has to be renamed when a room is is a test tied
  // to something it does not care about.
  const withIdles = [...content.rooms.values()].filter((room) => room.idles?.figures?.length);
  assert.equal(withIdles.length, 1, 'one composed room declares idles so far');
  const animated = withIdles[0]!.idles!.figures;
  assert.equal(animated.length, 4, 'ruling 20 wants at least three of this crowd moving');
  assert.ok(!animated.some((figure) => figure.id.includes('landing')),
    'the man on the landing does not move, and that is his whole joke');
  for (const figure of animated) {
    assert.ok(figure.rate >= 0.3 && figure.rate <= 0.8, `${figure.id} outside 0.3-0.8 Hz`);
    assert.equal(figure.frames.length, 2, `${figure.id} is a two-frame idle, not a walk cycle`);
  }
  const rates = new Set(animated.map((figure) => figure.rate));
  assert.equal(rates.size, animated.length, 'nothing metronomic -- no two share a rate');
});

test('an item with two ruling 19a states keeps a cursor per state', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  const letter = content.items.get('letter')!;
  const target = state.itemTarget('letter')!;

  // Doc 23: the letter is the only Act I item with a 19a state change, and
  // both states carry a full set. Two rules over ONE item, because its
  // semantic identity does not change -- the coach's two-hotspot pattern is
  // for when the name changes too.
  assert.equal(letter.responses!.LOOK_AT!.length, 2, 'two states');
  for (const rule of letter.responses!.LOOK_AT!) {
    assert.ok(rule.when, 'each state declares its own gate');
    assert.equal((rule.repeat ?? []).length, 2, 'three lines per state');
  }

  state.verbs.selectVerb('LOOK_AT');
  const before = [
    state.verbs.resolve('LOOK_AT', target).say,
    state.verbs.resolve('LOOK_AT', target).say,
  ];
  state.flags.applyWrites({ T_PIKE_DEAD: true });
  const after = state.verbs.resolve('LOOK_AT', target).say;

  // The cursor is per state. Shared, this third selection would have been
  // the after-state's THIRD line -- the quiet one about his father -- served
  // out of order and as a punchline, which doc 23 note 1 forbids.
  const rules = letter.responses!.LOOK_AT!;
  const [dead, alive] = rules[0]!.when!.T_PIKE_DEAD === true
    ? [rules[0]!, rules[1]!] : [rules[1]!, rules[0]!];
  assert.deepEqual(before, [alive.say, alive.repeat![0]], 'the before-state runs in order');
  assert.equal(after, dead.say, 'the after-state starts at its own first line');
});

test("doc 24's three tiers resolve most specific first, and pools rotate", async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');
  const table = content.combinations;

  // TIER 1 -- the authored pair. The fork on the notices is doc 24 section 4,
  // and it is the acceptance interaction's line.
  const notices = state.findTarget('posted_notices')!;
  const pair = table.pairs.find(
    (candidate) => candidate.item === 'tuning_fork' && candidate.target === 'posted_notices')!;
  assert.equal(
    state.verbs.resolveWith('USE', 'tuning_fork', notices, 'main_street').say,
    pair.say,
    'an authored pair answers before any pool',
  );

  // TIER 2 -- the item's own pool, on a target with no pair. The trough has
  // none, and doc 24 says not to add one: the fork pool is funnier.
  const trough = state.findTarget('water_trough')!;
  const fork = table.itemPools.tuning_fork!;
  const drawn = fork.map(() => state.verbs.resolveWith('USE', 'tuning_fork', trough, 'main_street').say);
  assert.deepEqual(drawn, fork, 'the item pool comes out in order');
  for (let index = 1; index < drawn.length; index += 1) {
    assert.notEqual(drawn[index], drawn[index - 1], 'a pool line never follows itself');
  }
  assert.equal(
    state.verbs.resolveWith('USE', 'tuning_fork', trough, 'main_street').say, fork[0],
    'and then wraps',
  );

  // TIER 3 -- the global pool, for an item with no pool of its own. Nothing
  // in Act I is in that position, so this is asserted against the resolver
  // rather than against content.
  const orphan = { id: 'nothing_at_all', name: 'X', rect: [0, 0, 0, 0] as [number, number, number, number], colour: 0 };
  assert.equal(
    state.verbs.resolveWith('USE', 'no_such_item', orphan, 'main_street').say,
    table.globalPool[0],
    'an item with no pool falls to the global one',
  );

  // The target's OWN override is never reached. "On what." answers USE THE
  // MUD and is not the answer to USE THE TUNING FORK ON THE MUD.
  const mud = state.findTarget('mud')!;
  assert.equal(mud.overrides!.USE, 'On what.');
  assert.notEqual(
    state.verbs.resolveWith('USE', 'tuning_fork', mud, 'main_street').say, 'On what.',
  );
});

test('doc 24 rule 4: no authored pair exists without a written line', async () => {
  const content = await loadContent(fsReader);
  // The runtime half of the rule the build check enforces. A pair with no
  // line returns NOTHING rather than a pool line, so a gap cannot disguise
  // itself as content -- which is the whole of note 4.
  for (const pair of content.combinations.pairs) {
    assert.ok(typeof pair.say === 'string' && pair.say.length > 0,
      `${pair.item} on ${pair.room}/${pair.target} has no line`);
  }
});

test('doc 17 v3.1: one automatic opening line, a four-option driver tree, a late act card', async () => {
  const content = await loadContent(fsReader);
  const opening = content.sequences.get('opening');
  assert.ok(opening, 'the opening sequence loads through the manifest');

  // ONE line, played sincerely, not a choice. v2's three-option node is void.
  // What the line SAYS is not asserted here -- no .ts file may carry a line
  // of the fiction, and check-extraction already proves it against the doc.
  // The protagonist is never named here either -- he is "not the driver".
  // No .ts file may know who lives in this game.
  const DRIVER = 'stage_driver';
  const declaration = opening.beats.find((beat) => beat.beat === '3')!;
  const spoken = declaration.lines ?? [];
  assert.equal(spoken.filter((line) => line.speaker !== DRIVER).length, 1,
    'one opening line, not three to pick from');
  assert.equal(spoken.length, 2, 'sincere, then punctured');
  assert.equal(declaration.set?.T_OPENING_SAID, true);
  assert.equal(declaration.control, 'none', 'beat 3 is automatic, like the lookout it models');

  // The tree is RESTORED at four options after v3 cut it to zero: one of
  // each kind, and exactly one that ends the scene.
  const driver = content.dialogue.get('STAGE_DRIVER');
  assert.ok(driver, "the driver's tree is back in the manifest");
  const options = driver.nodes.root!.options;
  assert.equal(options.length, 4);
  assert.deepEqual(options.map((o) => o.tag), ['PROGRESS', 'PROGRESS', 'COMIC', 'EXIT']);
  assert.ok(!content.dialogue.has('OPENING_LINE'), 'the three-option line stays void');

  // A three-line response across two speakers is carried as an exchange, not
  // flattened into one string with dashes standing in for the speaker change.
  const exchanged = options.filter((o) => o.exchange);
  assert.equal(exchanged.length, 1);
  assert.equal(exchanged[0]!.exchange!.length, 3);
  assert.deepEqual(exchanged[0]!.exchange!.map((line) => line.speaker === DRIVER),
    [true, false, true], 'the driver is interrupted and then lands the joke');
  for (const option of options) {
    assert.ok(!(option.say && option.exchange), 'an option has one or the other, never both');
  }

  // The EXIT option departs the coach -- the doc says so in words -- and the
  // beat does not also write it. Two writers on one fact is a race.
  const exit = options.find((o) => o.tag === 'EXIT')!;
  assert.equal(exit.set?.T_COACH_DEPARTED, true);
  const beat7 = opening.beats.find((beat) => beat.beat === '7')!;
  assert.equal(beat7.set?.T_COACH_DEPARTED, undefined);

  // BEAT 6b EXISTS. The coach departs before the card; a beat number with a
  // letter in it was dropped by the extractor's row pattern and nothing
  // noticed, because the guard counted ten beats and still found ten.
  const departure = opening.beats.find((beat) => beat.beat === '6b')!;
  assert.ok(departure, 'the coach departs on its own beat');
  assert.equal(departure.control, 'none');
  assert.ok((departure.seconds ?? 0) > 0, 'the departure takes stated time');

  // The act card lands AFTER the coach leaves, on the view of the town --
  // not before Room 1 fades up. Beat 1 is the title and must not carry it.
  const carded = opening.beats.filter((beat) => beat.actCard);
  assert.equal(carded.length, 1);
  assert.equal(carded[0]!.beat, '7');
  assert.equal(opening.beats.find((beat) => beat.beat === '1')!.control, 'menu');

  // Room 1 gates hotspots on Hob being on screen, and BOTH ENDS OF THAT
  // WINDOW ARE NOW WRITTEN. The open was on beat 9, when he walked in; he is
  // staged standing from beat 7 instead, so the gate has to open there or the
  // lamp exists for less time than it takes to choose a verb. The close was
  // written nowhere at all, which is why the lamp stayed interactable after he
  // had gone and the response written for that moment could never appear.
  assert.equal(opening.beats.find((beat) => beat.set?.T_HOB_CROSSING)!.beat, '2');
  assert.equal(opening.beats.find((beat) => beat.set?.T_HOB_GONE)!.beat, '10');

  // AND THE BEAT BETWEEN THEM WAITS FOR THE PLAYER. He stands at the roadside
  // from the first beat that plays and speaks when he is SPOKEN TO, so beat 9
  // is a response rather than a moment on a clock. The words stay in doc 17
  // where the beat sheet has them; only when the beat begins changed.
  assert.equal(opening.beats.find((beat) => beat.awaitFlag)!.beat, '9');
});

test('a multi-speaker response plays one line at a time', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());

  state.dialogue.start('STAGE_DRIVER');
  const option = state.dialogue.presentOptions()
    .find((presented) => presented.option.exchange)!;
  const first = state.dialogue.select(option.option.id);

  // The first line comes back as the say; the rest queue behind it in order.
  assert.equal(first.say, option.option.exchange![0]!.line);
  assert.deepEqual(first.rest.map((line) => line.line),
    option.option.exchange!.slice(1).map((line) => line.line));
  assert.equal(first.ended, false);

  // A single-line option queues nothing, so nothing swallows the next click.
  const plain = state.dialogue.presentOptions()
    .find((presented) => presented.option.say && presented.option.tag !== 'EXIT')!;
  assert.deepEqual(state.dialogue.select(plain.option.id).rest, []);
});

test('errata 30a: a trailing wait takes its stated time', () => {
  const runner = new SequenceRunner();
  const host: SequenceHost = {
    walk: () => {}, move: () => {}, isWalking: () => false, face: () => {},
    isTurning: () => false, isChoring: () => false, chore: () => 0, say: () => 0,
    setState: () => {},
    followPath: () => 0,
    travel: () => {},
  };

  // The shape that failed: the LAST step is a wait. It was consumed, the
  // index reached the end of the list, and isRunning went false on the same
  // frame -- so a three-second act card lasted one frame. The unit tests
  // advanced the clock past the wait every time and never asked in between.
  runner.start([{ kind: 'say', line: 'x' }, { kind: 'wait', seconds: 3 }]);
  runner.update(0, host);
  assert.equal(runner.isRunning, true, 'still running the instant the wait begins');
  runner.update(1.5, host);
  assert.equal(runner.isRunning, true, 'still running halfway through');
  runner.update(3, host);
  assert.equal(runner.isRunning, false, 'finished once the stated time has passed');
});

test('errata 30a: a duration on a beat the player controls is refused', async () => {
  const content = await loadContent(fsReader);
  const opening = content.sequences.get('opening')!;

  // The whole reason the step kind was granted at all is the restriction.
  // Lowering refuses it, and so does the build check; this is the runtime
  // half, asserted against a beat the doc does not have so that the rule is
  // tested rather than the current content.
  const carried = segmentsOf(opening).find((segment) => segment.carriedBy);
  assert.ok(carried, 'the driver carries a segment');
  assert.throws(
    () => stepsFor({ ...carried, beats: carried.beats.map((b) => ({ ...b, seconds: 4 })) }),
    /control is player/,
  );

  // And an automatic segment lowers its stated seconds into a wait step --
  // asserted against a CONSTRUCTED beat, not one found in the content.
  //
  // It used to search the opening for a beat with `seconds`, which passed only
  // while some beat had a duration and no staging. Authoring the opening's
  // staging removed the last such beat and this failed, reporting a broken
  // rule when the rule was working: a beat that stages something does not need
  // a dead hold, which is exactly what Opening.ts asserts.
  const automatic = segmentsOf(opening).find((segment) => segment.kind === 'automatic')!;
  // Narrowed once, here. Spreading `beats[0]` directly spreads a possibly
  // undefined value, and the result carries `beat?: string` where a
  // SequenceBeat requires one -- which is what broke the build.
  const first = automatic.beats[0]!;
  const held = { ...automatic, beats: [{ ...first, seconds: 3, staging: [] }] };
  assert.ok(stepsFor(held).some((step) => step.kind === 'wait'), 'the duration became a wait');

  // And a beat whose staging TAKES TIME does not get one. The actor is the
  // protagonist by id from content -- a beat carries no `actor` of its own,
  // its STAGING STEPS do, which is the whole point of naming one per step.
  const walking = {
    ...automatic,
    beats: [{
      ...first,
      seconds: 3,
      staging: [{ do: 'walk' as const, actor: content.actor.id, to: [900, 800] as [number, number] }],
    }],
  };
  assert.ok(
    !stepsFor(walking).some((step) => step.kind === 'wait'),
    'timed staging replaces the hold rather than adding to it',
  );

  // BUT STAGING THAT TAKES NO TIME DOES NOT REPLACE IT, and the coarse rule
  // that said otherwise cost a beat. "Any staging at all" was near enough
  // while beat 7 glided Hob in from off frame over two seconds; the moment he
  // was placed standing instead -- a tenth of a second -- the beat collapsed
  // from three seconds to 0.12, taking the coach's recede, the piano and the
  // act card's own beat with it. Found by the gauntlet's timings.
  //
  // A `face` and a placement put something somewhere. They are not durations.
  const placed = {
    ...automatic,
    beats: [{
      ...first,
      seconds: 3,
      staging: [
        { do: 'face' as const, actor: content.actor.id, facing: 'right' as const },
        {
          do: 'move' as const,
          actor: content.actor.id,
          from: [900, 800] as [number, number],
          to: [900, 800] as [number, number],
          seconds: 0.1,
        },
      ],
    }],
  };
  assert.ok(
    stepsFor(placed).some((step) => step.kind === 'wait'),
    'a beat that only places things still lasts as long as the document says',
  );
});

test('two rooms may share an exit id without sharing its repeat cursor', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());

  // Doc 25 gives Room 5 and Room 7 a street door each, and the natural id
  // for both is the same. Keyed on the id alone they shared one cursor, so
  // walking out of one advanced the other and the two rooms handed each
  // other lines. It could not happen with one room in the game, which is why
  // it appeared the moment the second one landed.
  const linesFor = (room: string) => {
    state.enterRoom(room);
    const door = state.findTarget('back_to_street')!;
    return [0, 1, 2].map(() => state.verbs.resolve('LOOK_AT', door, room).say);
  };
  const assay = linesFor('assay_office');
  const registrar = linesFor('claims_registrar');

  assert.equal(new Set(assay).size, 3, 'the assay door cycles its own three');
  assert.equal(new Set(registrar).size, 3, 'and so does the registrar door');
  for (const line of registrar) {
    assert.ok(!assay.includes(line), 'and neither says the other room’s line');
  }
});
