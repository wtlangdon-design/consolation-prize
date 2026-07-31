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
import {
  mappingAt,
  offsetAt,
  resolve as resolveCycling,
  sameMapping,
  stateCount,
} from '../engine/core/PaletteCycling.ts';

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
      const isExit = (target as { to?: string }).to !== undefined;
      for (const verb of content.verbs.verbs) {
        state.verbs.selectVerb(verb.id);
        const result = state.interact(target);
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

  const first = state.interact(mud).say;
  const second = state.interact(mud).say;
  const third = state.interact(mud).say;

  // Doc 13, reordered: variant 1 has to work cold, because most players
  // listen once and never again. It used to be a bare "Nothing new.", which
  // is an answer to a question nobody had asked yet. This test guarded the
  // old shape -- variants 1 and 2 being character-for-character identical --
  // and had to be rewritten rather than deleted, because the sequence still
  // needs a guard and the tail of it is unchanged.
  assert.notEqual(second, first, 'variant 1 no longer leans on a look the player has not taken');
  assert.notEqual(third, second, 'variant 3 does move on');
  assert.equal(state.interact(mud).say, third, 'and the third repeats indefinitely thereafter');
});

test('object overrides repeat; global pools rotate', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom('main_street');

  // Doc 13 note 4. Two different behaviours, both correct.
  const dog = state.findTarget('dog')!;
  state.verbs.selectVerb('PUSH');
  const override = [state.interact(dog).say, state.interact(dog).say, state.interact(dog).say];
  assert.equal(override[0], 'I will not.');
  assert.ok(
    override.every((line) => line === override[0]),
    'an object override fires the same line every time for that verb-object pair',
  );

  // The hills have no PUSH override, so PUSH falls to the global pool.
  const hills = state.findTarget('hills')!;
  const pool = content.verbFallbacks.pools['PUSH']!;
  const drawn = [state.interact(hills).say, state.interact(hills).say, state.interact(hills).say];
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
      const result = state.interact(target);
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
      const result = state.interact(exit);
      assert.equal(result.changedRoom, true, `${exit.id} + ${verb} should transit`);
      assert.equal(result.say, null, `${exit.id} + ${verb} must produce no line`);
      assert.equal(state.roomId, exit.to);
    }

    // Everything else describes the doorway from the street and stays put.
    state.enterRoom('main_street');
    for (const verb of content.verbs.verbs) {
      if (state.verbs.isTransit(verb.id)) continue;
      state.verbs.selectVerb(verb.id);
      const result = state.interact(exit);
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
  // Driving state.interact(exit) directly cannot catch this; only a click can.
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
      state.verbs.selectVerb(verb);
      const seen = [
        state.interact(exit).say,
        state.interact(exit).say,
        state.interact(exit).say,
        state.interact(exit).say,
      ];
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
  assert.deepEqual(ids, ['resume', 'save', 'load', 'options', 'quit']);
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
        state.verbs.selectVerb(verb);
        const got = expected.map(() => state.interact(target).say);
        assert.deepEqual(
          got, expected,
          `${room.id}/${target.id}/${verb} did not return its variants in written order`,
        );
        // And the last one repeats indefinitely rather than wrapping round.
        assert.equal(state.interact(target).say, expected[expected.length - 1]);
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
  assert.equal(state.interact(assay).changedRoom, true);
  assert.equal(state.roomId, 'assay_office');

  // Ruling 20: four of the Nugget's eleven animate, and the man on the
  // landing is an explicit exception. He has no idle and must never get one.
  const nugget = content.rooms.get('nugget')!;
  const animated = nugget.idles?.figures ?? [];
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
