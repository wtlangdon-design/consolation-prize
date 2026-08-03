import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
import { Actor } from '../engine/core/Actor.ts';
import { RoomActors } from '../engine/core/RoomActors.ts';
import { BodyOwners, SequenceWorld } from '../engine/core/SequenceWorld.ts';
import { SequenceRunner, type SequenceHost, type SequenceStep } from '../engine/core/Sequence.ts';
import { CarriedBeats } from '../engine/core/CarriedBeats.ts';
import { carriedStepsFor, segmentsOf, stepsFor } from '../engine/core/Opening.ts';
import { depthOrder, overlayRect, roomFigures } from '../engine/render/Renderer.ts';
import { depthTies } from '../engine/dev/Watch.ts';
import { ActorSprite } from '../engine/render/ActorSprite.ts';
import { IllegalStateError } from '../engine/core/Assertions.ts';
import type { ContentBundle, SequenceBeat, SequenceStagingStep } from '../engine/core/types.ts';

/**
 * Issue X4, as tests.
 *
 * Each of the three defects had the same shape: something plausible happened,
 * so nothing looked broken. A driver's chore animated the protagonist and a
 * man did move. A beat announced a coach arriving and the screen held for
 * eight seconds, which is what a beat lasting eight seconds looks like. A
 * mover that could not be drawn was simply not there, in a room nobody had
 * put one in yet.
 *
 * Every test here was watched to FAIL against the code as it was before it
 * passed against the code as it is. A test written after the fix, that only
 * ever ran green, proves that the fix and the test agree with each other.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/** The room the opening happens in, taken from the manifest and never named. */
function openingRoom(content: ContentBundle): string {
  return content.manifest.startRoom;
}

interface Stage {
  state: GameState;
  actors: RoomActors;
  bodies: BodyOwners;
  world: SequenceWorld;
  player: Actor;
  runner: SequenceRunner;
  /** Every clip a chore asked for, in order, with the mover it was asked of. */
  chores: string[];
}

/**
 * A room with the protagonist in it and a second mover beside him.
 *
 * `choreSeconds` is supplied by the caller in production and by this harness
 * here, which is the seam that lets the host be tested at all: a scene cannot
 * be constructed without a browser, and the defect this file exists for
 * shipped for exactly that reason.
 */
async function stage(extra = 'a_second_mover'): Promise<Stage> {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom(openingRoom(content));
  const player = new Actor(state, content.actor.id, 960, 780, { routed: true });
  const actors = new RoomActors(state, player);
  actors.place(extra, 240, 118, { height: 30 });
  const bodies = new BodyOwners();
  const chores: string[] = [];
  const world = new SequenceWorld({
    actors,
    bodies,
    choreSeconds: (mover, clip) => {
      chores.push(`${mover.id}:${clip}`);
      return 0.5;
    },
    say: () => 0,
  });
  return { state, actors, bodies, world, player, runner: new SequenceRunner(), chores };
}

/* =========================================================================
 * DEFECT 1 -- the host discarded the actor
 *
 * `GameScene.host()` implemented every motion method as
 * `(_actor, x, y) => { this.actor.… }`. The id arrived on the step, was
 * renamed to silence the linter, and was thrown away.
 *
 * WATCHED TO FAIL: with the host restored to its old body -- every method
 * ignoring its first argument and driving the player -- all three tests below
 * fail on the first assertion, reporting the protagonist doing the thing the
 * step asked of somebody else.
 * ====================================================================== */

test('a chore naming another actor animates THAT actor and leaves the player alone', async () => {
  const { world, actors, player, runner, chores } = await stage('the_driver');
  const driver = actors.get('the_driver')!;

  runner.start([{ kind: 'chore', actor: 'the_driver', chore: 'recoil' }]);
  runner.update(0, world);

  assert.equal(driver.clip, 'recoil', 'the actor the step named is the actor that moved');
  assert.equal(player.clip, 'idle', 'and the protagonist did not move at all');
  assert.deepEqual(chores, ['the_driver:recoil'], 'the clip was looked up against the named mover');
});

test('a walk naming another actor walks THAT actor', async () => {
  const { world, actors, player, runner } = await stage('the_driver');
  const driver = actors.get('the_driver')!;
  const stood = { x: player.x, y: player.y };

  runner.start([
    { kind: 'walk', actor: 'the_driver', x: 120, y: 118 },
    { kind: 'waitForActor', actor: 'the_driver' },
  ]);
  runner.update(0, world);

  assert.equal(driver.isWalking, true, 'the named actor is walking');
  assert.equal(player.isWalking, false, 'the protagonist is not');
  assert.equal(world.isWalking('the_driver'), true, 'and isWalking answers about the named actor');
  assert.equal(world.isWalking(player.id), false);
  assert.deepEqual({ x: player.x, y: player.y }, stood, 'the protagonist has not moved a pixel');
});

test('a face naming another actor turns THAT actor', async () => {
  const { world, actors, player, runner } = await stage('the_driver');
  const driver = actors.get('the_driver')!;
  player.setFacing('front');
  driver.setFacing('front');

  runner.start([{ kind: 'face', actor: 'the_driver', facing: 'left' }]);
  runner.update(0, world);

  assert.equal(driver.facing, 'left');
  assert.equal(player.facing, 'front', 'the protagonist is still facing the camera');
});

test('a step naming an actor with no mover is a named error, never the player', async () => {
  const { world, player, runner } = await stage();

  // The fallback that WOULD have hidden this is the defect itself: silently
  // driving the protagonist is exactly what the old host did, and it looked
  // like it worked because a man moved.
  runner.start([{ kind: 'walk', actor: 'nobody_here', x: 10, y: 130 }]);
  assert.throws(
    () => runner.update(0, world),
    /nobody_here/,
    'the error names the actor that was asked for',
  );
  assert.equal(player.isWalking, false);
});

/* =========================================================================
 * DEFECT 2 -- the opening lowered no choreography
 *
 * `Opening.stepsFor` emitted `say` and `wait` and nothing else, so doc 17's
 * visual descriptions never became anything executable.
 *
 * WATCHED TO FAIL: against the previous `stepsFor`, which ignored `staging`
 * entirely, the first two tests report `['say']` and `['wait']` where walk,
 * waitForActor, chore and move are expected.
 * ====================================================================== */

function beat(overrides: Partial<SequenceBeat> = {}): SequenceBeat {
  return {
    beat: 'x', description: 'd', control: 'none', ...overrides,
  } as SequenceBeat;
}

const kinds = (steps: SequenceStep[]) => steps.map((step) => step.kind);

/** A host that records what was said and answers every question flatly. */
function recordingHost(said: string[]): SequenceHost {
  return {
    walk: () => {},
    move: () => {},
    isWalking: () => false,
    face: () => {},
    isTurning: () => false,
    isChoring: () => false,
    chore: () => 0,
    say: (step) => {
      if (step.line !== undefined) said.push(step.line);
      return 1;
    },
    setState: () => {},
  };
}

test('a beat\'s staging lowers into real walk, face and chore steps', () => {
  const staging: SequenceStagingStep[] = [
    { do: 'walk', actor: 'a', to: [40, 130] },
    { do: 'face', actor: 'a', facing: 'left' },
    { do: 'chore', actor: 'a', clip: 'straighten' },
  ];
  const steps = stepsFor({
    kind: 'automatic', carriedBy: null, beats: [beat({ staging, lines: [{ speaker: 'a', line: 'L' }] })],
  });

  assert.deepEqual(kinds(steps), [
    'walk', 'waitForActor', 'face', 'waitForActor', 'chore', 'say',
  ], 'doc 22 section 6\'s chain, in its order, with the waits supplied by the lowering');
  const walk = steps[0] as Extract<SequenceStep, { kind: 'walk' }>;
  assert.deepEqual([walk.actor, walk.x, walk.y], ['a', 40, 130]);
});

test('errata 38: a move places its mover, and waits for it to arrive', () => {
  const steps = stepsFor({
    kind: 'automatic',
    carriedBy: null,
    beats: [beat({
      seconds: 3,
      staging: [{ do: 'move', actor: 'coach', from: [200, 100], to: [360, 100], seconds: 3 }],
    })],
  });

  assert.deepEqual(kinds(steps), ['move', 'waitForActor'],
    'the beat stages its own duration, so no separate wait is emitted for it');
  const move = steps[0] as Extract<SequenceStep, { kind: 'move' }>;
  assert.deepEqual(move.from, { x: 200, y: 100 });
  assert.equal(move.seconds, 3);
});

test('a beat that stages nothing still holds for its stated duration', () => {
  const steps = stepsFor({
    kind: 'automatic', carriedBy: null, beats: [beat({ seconds: 8 })],
  });
  // The gap is visible rather than papered over: nothing moves, and the
  // screen holds for exactly as long as doc 17 says the beat lasts.
  assert.deepEqual(kinds(steps), ['wait']);
});

test('errata 38: a move under player control is refused, like a wait', () => {
  assert.throws(
    () => carriedStepsFor(beat({
      beat: '9',
      control: 'player',
      staging: [{ do: 'move', actor: 'hob', to: [300, 110], seconds: 4 }],
    })),
    /control is player/,
  );
});

test('a staged move drives the named mover and nobody else', async () => {
  const { world, actors, player, runner } = await stage();
  const steps = stepsFor({
    kind: 'automatic',
    carriedBy: null,
    beats: [beat({ staging: [{ do: 'move', actor: 'coach', from: [200, 100], to: [300, 100], seconds: 2 }] })],
  });

  runner.start(steps);
  runner.update(0, world);
  const coach = actors.get('coach');
  assert.ok(coach, 'the move placed a mover that did not exist before');
  assert.equal(coach.x, 200, 'placed where the step said to place it');

  actors.update(1);
  assert.equal(coach.x, 250, 'halfway there at half the stated duration');
  assert.equal(player.x, 960, 'and the protagonist is where he was');
  assert.equal(runner.isRunning, true, 'the waitForActor is still holding');

  actors.update(2);
  assert.equal(coach.x, 300);
  runner.update(2, world);
  assert.equal(runner.isRunning, false, 'and released once it arrived');
});

/* =========================================================================
 * DEFECT 3 -- there was no general room mover
 *
 * `Renderer.drawPeople` built its list from the ambient set plus the single
 * player actor, so nothing else could be drawn, positioned, depth-sorted or
 * animated.
 * ====================================================================== */

test('a named mover other than the player is positioned, sized and animated', async () => {
  const { actors, player } = await stage('a_watchman');
  const watchman = actors.get('a_watchman')!;

  assert.notEqual(watchman.id, player.id);
  assert.deepEqual([watchman.x, watchman.y], [240, 118]);
  assert.equal(watchman.height, 30, 'a mover the depth bands do not govern keeps its own height');

  watchman.walkTo(60, 118);
  actors.update(0.1);
  assert.equal(watchman.isWalking, true);
  assert.equal(watchman.clip, 'walk', 'and it animates -- its own clip, on its own body');
  assert.equal(watchman.facing, 'left', 'facing the way it is going');
  assert.equal(player.clip, 'idle');
});

test('every mover reaches the draw list, depth-sorted against the ambient set', async () => {
  const { actors, player } = await stage('the_coach');
  actors.get('the_coach')!.placeAt(240, 100);
  const crowd = [{ id: 'pie_woman', x: 80, y: 118, zone: 1 }] as never[];

  // The list used to be "the ambient set, plus the player". A coach further
  // up the road draws first, the crowd next, the protagonist last -- and the
  // coach being in the list at all is the defect this is here for.
  const order = depthOrder(roomFigures(crowd, actors.all())).map((figure) => figure.id);
  assert.deepEqual(order, ['the_coach', 'pie_woman', player.id]);
});

test('every mover but the player is dropped when the room changes', async () => {
  const { actors, player } = await stage('the_coach');
  assert.equal(actors.all().length, 2);

  actors.clearRoom();
  assert.deepEqual(actors.all().map((mover) => mover.id), [player.id],
    'a coach does not follow anybody into an assay office');
  assert.equal(actors.get('the_coach'), undefined);
});

/* =========================================================================
 * BODY OWNERSHIP -- doc 34 assertion 6, and it is expected to fire
 * ====================================================================== */

test('BODY_ONE_OWNER fires when a chore takes a body a walk still owns', async () => {
  const { world, runner } = await stage('the_driver');

  // The illegal chain, and it is illegal for a reason a player would see: a
  // recoil playing while the feet are still crossing the road is one body
  // running two timelines. The lowering never emits this -- it supplies the
  // waitForActor itself -- so reaching it means something bypassed the
  // lowering, which is engine code and is what assertions are for.
  runner.start([
    { kind: 'walk', actor: 'the_driver', x: 40, y: 130 },
    { kind: 'chore', actor: 'the_driver', chore: 'recoil' },
  ]);
  assert.throws(() => runner.update(0, world), (error: unknown) => {
    assert.ok(error instanceof IllegalStateError);
    assert.equal(error.code, 'BODY_ONE_OWNER');
    return true;
  });
});

test('the canonical chain never trips it, and the body is handed back', async () => {
  const { world, actors, runner, bodies } = await stage('the_driver');

  runner.start([
    { kind: 'walk', actor: 'the_driver', x: 236, y: 118 },
    { kind: 'waitForActor', actor: 'the_driver' },
    { kind: 'chore', actor: 'the_driver', chore: 'recoil' },
  ]);
  // Advanced until the chore actually starts, rather than for a fixed number
  // of frames: the walk takes as long as it takes, and a loop that overshot
  // would run past the end of the clip and report a body nobody owns.
  let seconds = 0;
  while (bodies.bodyOwner('the_driver') !== 'chore' && seconds < 2) {
    seconds += 1 / 60;
    runner.update(seconds, world);
    actors.update(seconds);
    world.settleBodies();
  }
  assert.equal(bodies.bodyOwner('the_driver'), 'chore', 'the walk finished and the chore began');
  assert.equal(actors.get('the_driver')!.clip, 'recoil');

  // And the claim is released once the clip is over, rather than held for the
  // rest of the session -- which is what makes the NEXT chore legal.
  actors.update(2);
  world.settleBodies();
  assert.equal(bodies.bodyOwner('the_driver'), undefined);
});

test('abandoning one performance releases that body and no other', async () => {
  const { world, actors, bodies, player } = await stage('a_watchman');
  world.walk(player.id, 40, 130);
  world.walk('a_watchman', 300, 118);
  assert.equal(bodies.bodyOwner(player.id), 'walk');

  world.abandonActor(player.id);
  assert.equal(bodies.bodyOwner(player.id), undefined, 'the player let go');
  assert.equal(bodies.bodyOwner('a_watchman'), 'walk', 'and the watchman kept walking');
  assert.equal(actors.get('a_watchman')!.isWalking, true);
});

/* =========================================================================
 * BEAT 9 HAD NO CARRIER
 * ====================================================================== */

/** The beats after control: one player segment nobody else carries. */
async function uncarriedSegment() {
  const content = await loadContent(fsReader);
  const opening = content.sequences.get(content.manifest.openingSequence as string)!;
  const found = segmentsOf(opening)
    .filter((segment) => segment.kind === 'player' && segment.carriedBy === null);
  assert.equal(found.length, 1, 'one uncarried player segment, after control');
  return found[0]!;
}

test('doc 17\'s beats after control carry lines and flags that were being dropped', async () => {
  // The shape of the defect: beats 8, 9 and 10 are ONE player segment with no
  // `carriedBy`, so the runner that reached it handed over control and
  // finished, and every beat in it went with it.
  const segment = await uncarriedSegment();
  const withLines = segment.beats.filter((entry) => (entry.lines ?? []).length > 0);
  assert.ok(withLines.length > 0, 'a beat with lines that were never delivered');

  for (const carried of withLines) {
    const steps = carriedStepsFor(carried);
    assert.equal(steps.filter((step) => step.kind === 'say').length, (carried.lines ?? []).length,
      'every line of the beat is emitted');
    assert.ok(!steps.some((step) => step.kind === 'wait'),
      'errata 30a: and no wait, because the player is in control');
  }
  // AND THE SEGMENT'S FLAG WRITES SURVIVE, which is the other half of the
  // same defect. Asserted of the SEGMENT and not of each beat with lines: the
  // beat that speaks and the beat that writes need not be the same one, and
  // are not any more -- beat 9 is Hob's exchange and beat 10 is the write
  // that says he has gone.
  assert.ok(segment.beats.some((entry) => Object.keys(entry.set ?? {}).length > 0),
    'the segment writes at least one flag, which was also being dropped');
});

test('the carrier delivers every line and every flag write of those beats', async () => {
  const segment = await uncarriedSegment();
  const written: Record<string, boolean | number> = {};
  const said: string[] = [];
  // EVERY AWAITED FLAG ALREADY TRUE, so this stays a test about DELIVERY. The
  // hold has its own test below; conflating them would make this one fail for
  // a reason that has nothing to do with what it is checking.
  const carrier = new CarriedBeats((writes) => Object.assign(written, writes), () => true);
  const host = recordingHost(said);

  carrier.arm(segment.beats);
  // Advanced by hand for a generous stretch of game time: every line holds
  // for its own reading time, and the point is that they all land, not how
  // long they take.
  for (let seconds = 0; seconds < 60 && (carrier.isRunning || seconds === 0); seconds += 0.25) {
    carrier.update(seconds, host);
  }

  const expectedLines = segment.beats.flatMap((beat) => (beat.lines ?? []).map((l) => l.line));
  const expectedFlags = segment.beats.flatMap((beat) => Object.keys(beat.set ?? {}));
  assert.deepEqual(said, expectedLines, 'every line, in the order the beat sheet writes them');
  assert.deepEqual(Object.keys(written).sort(), [...expectedFlags].sort(),
    'and every flag the beats write');
  assert.equal(carrier.isRunning, false, 'and then it is done and the player is simply playing');
});

test('a carried beat\'s flags are written when the carrier REACHES it, not before', async () => {
  const segment = await uncarriedSegment();
  const written: Record<string, boolean | number> = {};
  const carrier = new CarriedBeats((writes) => Object.assign(written, writes), () => true);
  const said: string[] = [];
  carrier.arm(segment.beats);
  carrier.update(0, recordingHost(said));

  // WHICH WAY THIS CUTS CHANGED WITH THE STAGING, and the mechanism did not.
  // It used to guard an OPEN -- a hotspot describing a man who is still
  // crossing, written at the end of his lines would have arrived describing an
  // empty road. That flag has moved out of this segment entirely; he stands at
  // the roadside from beat 7 now.
  //
  // What is left here is a CLOSE, and it must not land early: the flag saying
  // he has gone belongs to the beat after the one where he goes. So at t=0,
  // with the first beat still playing, it is NOT yet written -- and by the end
  // of the run it is. A carrier that applied every beat's writes up front
  // would pass the old test and fail this one.
  const later = segment.beats.filter((beat) => Object.keys(beat.set ?? {}).length > 0);
  assert.ok(later.length > 0, 'the segment writes something');
  const last = later[later.length - 1]!;
  for (const flag of Object.keys(last.set ?? {})) {
    assert.ok(!(flag in written), `${flag} is not written before its beat is reached`);
  }
  for (let seconds = 0; seconds < 60 && (carrier.isRunning || seconds === 0); seconds += 0.25) {
    carrier.update(seconds, recordingHost(said));
  }
  for (const flag of Object.keys(last.set ?? {})) {
    assert.ok(flag in written, `${flag} is written once the carrier reaches its beat`);
  }
});

/* =========================================================================
 * ERRATA 54 IN THE SPRITE, AND NO CLIP FALLBACK
 * ====================================================================== */

test('errata 54: the sprite no longer decimates, and asks for the height it is given', async () => {
  const content = await loadContent(fsReader);
  const sprite = new ActorSprite(content.actor, () => null);

  // Decimation's table was not linear over short runs, so asking for 34 could
  // give 33 and anything that had to agree with the screen had to ask. A
  // filter gives what it is asked for.
  for (const height of [26, 31, 34, 37, 40, 233]) {
    assert.equal(sprite.drawnHeight(height), height);
  }

  const source = readFileSync(resolve(ROOT, 'engine/render/ActorSprite.ts'), 'utf8');
  assert.ok(!/from '.*Decimation/.test(source),
    'and it no longer imports the module that implements the voided spec');
});

test('a clip nobody has drawn is named, never substituted', async () => {
  const content = await loadContent(fsReader);
  const sprite = new ActorSprite(content.actor, () => null);
  const declared = content.actor.clips[0]!;

  assert.ok(sprite.frameCount(declared.id, declared.facing, declared.surface ?? '') > 0);

  // Two fallbacks used to stand here: keep the facing and give up the clip,
  // then `clips[0]`. Both drew a frame of something and reported success, and
  // doc 34 step C is commissioned to remove exactly this.
  assert.throws(
    () => sprite.frameCount('a_clip_nobody_drew', declared.facing, declared.surface ?? ''),
    (error: unknown) => {
      assert.ok(error instanceof IllegalStateError);
      assert.equal(error.code, 'CLIP_FALLBACK');
      assert.match(error.message, /a_clip_nobody_drew/, 'and the message names the clip');
      return true;
    },
  );
});

test('Q75: lookup is a HELD state of the left idle, and a turn drops it silently', async () => {
  const content = await loadContent(fsReader);
  const sprite = new ActorSprite(content.actor, () => null);

  // A CHORE COULD NOT DO THIS. `lookup` was its own clip id, so only a chore
  // could play it -- a one-shot of frames/reactRate, 6/7 = 0.86s, over before
  // the driver answered. As a STATE of the clip he already stands in, setState
  // holds it for as long as a beat says. Same mechanism as the coach's door.
  assert.equal(sprite.frameCount('idle', 'left', '', 'lookup'), 6);
  const plain = content.actor.clips.find(
    (clip) => clip.id === 'idle' && clip.facing === 'left' && !clip.state);
  const held = content.actor.clips.find(
    (clip) => clip.id === 'idle' && clip.facing === 'left' && clip.state === 'lookup');
  assert.ok(plain && held, 'both the plain left idle and its lookup variant are declared');
  assert.notEqual(plain.frames[0], held.frames[0], 'and they are different pictures');

  // AND A TURN DROPS IT RATHER THAN THROWING, which is what makes it need no
  // special case. He is placed facing FRONT in beat 2 and turns left in beat
  // 3; `lookup` exists in left only. clipOf is exact-match-then-fall-back, so
  // any other facing answers with the stateless clip -- he simply stops
  // looking up if anything ever turns him, which is correct.
  for (const facing of ['front', 'back', 'right'] as const) {
    assert.equal(sprite.frameCount('idle', facing, '', 'lookup'), 6,
      `${facing} falls back to the plain idle rather than failing`);
  }
});

test('doc 40\'s idle-break plays only where the record declares it', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom(openingRoom(content));

  // A MOVER WITH NO RECORD DOES NOT GLANCE ASIDE. Nothing is substituted for
  // a clip a character has not got. `hasIdleBreak` used to be an option and
  // GameScene set it in one place -- on the protagonist -- so Hob and the
  // coach declared the clip and could never reach it. It comes from each
  // mover's own record now (R5f), which is why this asks for an id that has
  // none rather than passing a flag.
  const without = new Actor(state, 'nobody_has_this_record', 960, 780, { routed: true });
  for (let t = 0; t <= 60; t += 0.5) without.update(t);
  assert.equal(without.clip, 'idle');

  // AND IT IS A ONE-SHOT ON A TIMER, NOT A STATE. Doc 40: "played
  // occasionally", "plays on a timer while idle and returns to it". It used
  // to latch after seven seconds and never come back, which this test could
  // not see because it sampled once at t=60 and found what it expected.
  const man = new Actor(state, content.actor.id, 960, 780, { routed: true });
  const seen = new Set<string>();
  let breaks = 0;
  let wasBreaking = false;
  for (let t = 0; t <= 120; t += 0.25) {
    man.update(t);
    seen.add(man.clip);
    const breaking = man.clip === 'idle-break';
    if (breaking && !wasBreaking) breaks += 1;
    wasBreaking = breaking;
  }
  assert.ok(seen.has('idle-break'), 'it fires at all');
  assert.ok(seen.has('idle'), 'and it returns to idle, which the latch never did');
  assert.ok(breaks >= 2, `it fires repeatedly over two minutes, not once (${breaks})`);

  // THE GAP IS RANDOMISED ABOVE A FLOOR, so it never reads as a tic -- and it
  // is randomised DETERMINISTICALLY from the id, so a replay of the same save
  // plays the same way and no clip a script asserts becomes a coin toss.
  const twin = new Actor(state, content.actor.id, 960, 780, { routed: true });
  const other = new Actor(state, 'hob', 960, 780, { routed: true });
  const trace = (mover: Actor): string => {
    let out = '';
    for (let t = 0; t <= 60; t += 0.25) { mover.update(t); out += mover.clip === 'idle-break' ? 'x' : '.'; }
    return out;
  };
  const first = trace(twin);
  const again = trace(new Actor(state, content.actor.id, 960, 780, { routed: true }));
  assert.equal(first, again, 'the same character always breaks at the same moments');
  assert.notEqual(first, trace(other), 'and two characters do not glance in unison');

  man.walkTo(360, 780);
  man.update(120.1);
  assert.equal(man.clip, 'walk', 'and it gives the body back the moment he moves');
});

/* =========================================================================
 * THE RIG DATA -- read the direction, do not infer it
 * ====================================================================== */

test('every walk clip\'s facing agrees with its own walk_dx', () => {
  // Doc 38 R4b: "translating a character the wrong way was got wrong on BOTH
  // characters -- a figure walking backwards through the scene, twice.
  // Anything that is got wrong twice belongs in the data." This is the check
  // that reads it rather than trusting a directory name.
  const root = resolve(ROOT, 'art/actors');
  let profiles = 0;
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    let rig: Record<string, unknown>;
    try {
      rig = JSON.parse(readFileSync(resolve(root, entry.name, 'rig.json'), 'utf8'));
    } catch {
      continue;
    }
    if (rig.walk_dx === undefined) continue;
    // Only a profile has a screen direction. Head-on and back-on walks travel
    // into and out of the frame, and their walk_dx says nothing about x.
    if (rig.view !== 'profile') continue;
    profiles += 1;
    const dx = rig.walk_dx as number;
    assert.equal(rig.facing === 'left', dx < 0,
      `${entry.name}: facing ${String(rig.facing)} disagrees with walk_dx ${dx}`);
    assert.ok(entry.name.endsWith(String(rig.facing)),
      `${entry.name}: the directory name disagrees with the rig's own facing`);
  }
  assert.ok(profiles >= 2, 'both profile walks were checked');
});


/*
 * DOC 44 PART TWO #4. Two movers at one feet Y with overlapping x is the one
 * ordering the depth sort genuinely leaves undefined: a stable sort keeps
 * insertion order, the protagonist is constructed in create() and everyone
 * else is placed by a beat, so he draws first and anything staged later draws
 * over him. That is a fact about construction order and not about the picture.
 *
 * TESTED WITHOUT A BROWSER, deliberately. The gauntlet needs a browser to see
 * this happen; the rule about when it counts as a tie is arithmetic, and
 * arithmetic that only runs inside a headless Chromium is arithmetic nobody
 * checks.
 */
test('depth ties: exactly equal feet Y with overlapping x is a tie', () => {
  const ties = depthTies([
    { id: 'a', feetX: 1000, feetY: 742, halfWidth: 40 },
    { id: 'b', feetX: 1030, feetY: 742, halfWidth: 40 },
  ]);
  assert.deepEqual(ties, [['a', 'b']]);
});

test('depth ties: near-equal feet Y is NOT a tie -- whoever is lower is nearer', () => {
  assert.deepEqual(depthTies([
    { id: 'a', feetX: 1000, feetY: 742, halfWidth: 40 },
    { id: 'b', feetX: 1030, feetY: 745, halfWidth: 40 },
  ]), []);
});

test('depth ties: one feet Y, no x overlap, is not a tie', () => {
  assert.deepEqual(depthTies([
    { id: 'a', feetX: 300, feetY: 742, halfWidth: 40 },
    { id: 'b', feetX: 1400, feetY: 742, halfWidth: 40 },
  ]), []);
});

test('depth ties: the real one -- a walker at a vehicle\'s own feet Y', () => {
  // The black figure, as it stood: the protagonist placed at the vehicle's
  // y742, inside its 956px span. Only his legs cleared the body, which at a
  // glance is a black figure standing underneath it. The ids here are
  // deliberately generic -- the engine must not name the fiction, and this
  // rule is arithmetic about two numbers, not about who they belong to.
  const ties = depthTies([
    { id: 'vehicle', feetX: 1390, feetY: 742, halfWidth: 478 },
    { id: 'walker', feetX: 1290, feetY: 742, halfWidth: 42 },
  ]);
  assert.deepEqual(ties, [['vehicle', 'walker']]);
});


/* =========================================================================
 * A BEAT THAT WAITS FOR THE PLAYER
 *
 * Doc 17 beat 9 is Hob's exchange. He no longer crosses the road saying it at
 * whoever happens to be standing there: he stands at the roadside from the
 * first beat that plays and speaks when he is SPOKEN TO. The words did not
 * move -- they are still doc 17's, in beat 9, where the beat sheet has them.
 * Only when the beat begins changed.
 * ====================================================================== */

test('a beat that awaits a flag does not begin, and nothing after it lands', async () => {
  const segment = await uncarriedSegment();
  const awaited = segment.beats.find((beat) => beat.awaitFlag);
  assert.ok(awaited, 'the segment has a beat that waits');

  const written: Record<string, boolean | number> = {};
  const said: string[] = [];
  const flags: Record<string, boolean> = {};
  const carrier = new CarriedBeats(
    (writes) => Object.assign(written, writes), (flag) => flags[flag]);

  carrier.arm(segment.beats);
  for (let seconds = 0; seconds < 30; seconds += 0.25) carrier.update(seconds, recordingHost(said));

  assert.deepEqual(said, [], 'not one of its lines has been spoken');
  // AND THE BEATS AFTER IT HAVE NOT RUN EITHER, which is the half that makes
  // the flag mean what it says: T_HOB_GONE belongs to the beat after he goes,
  // and he has not gone.
  const later = segment.beats.slice(segment.beats.indexOf(awaited!));
  for (const beat of later) {
    for (const flag of Object.keys(beat.set ?? {})) {
      assert.ok(!(flag in written), `${flag} has not been written while the beat waits`);
    }
  }
});

test('and it begins the moment the flag is written, without re-arming', async () => {
  const segment = await uncarriedSegment();
  const awaited = segment.beats.find((beat) => beat.awaitFlag)!;
  const written: Record<string, boolean | number> = {};
  const said: string[] = [];
  const flags: Record<string, boolean> = {};
  const carrier = new CarriedBeats(
    (writes) => Object.assign(written, writes), (flag) => flags[flag]);

  carrier.arm(segment.beats);
  for (let seconds = 0; seconds < 5; seconds += 0.25) carrier.update(seconds, recordingHost(said));
  assert.deepEqual(said, [], 'still waiting');

  // Written by something the player did -- a response on the lamp, in the
  // game. The carrier is not told; it asks, every tick.
  flags[awaited.awaitFlag as string] = true;
  for (let seconds = 5; seconds < 60; seconds += 0.25) carrier.update(seconds, recordingHost(said));

  assert.deepEqual(said, (awaited.lines ?? []).map((spoken) => spoken.line),
    'every line of the beat, in the order the beat sheet writes them');
  assert.equal(carrier.isRunning, false, 'and then it is done');
});


/* =========================================================================
 * AN OVERLAY'S RECT IS PER BODY FRAME
 *
 * One rect could not serve every frame, and believing it could survived a
 * correction: the height was fixed and there were still two heads. The
 * coach's door-open frame is a SEPARATE GENERATION -- 162,227 pixels differ
 * from the plain idle across the whole 956x389 canvas -- and its driver sits
 * twelve pixels right and nine up. The door is open for the whole of beats 2
 * to 6, which is the entire conversation, so the overlay drew at the
 * shut-door position over open-door art for every frame that mattered.
 * ====================================================================== */

test('an overlay rect resolves clip/state, then clip, then the default', () => {
  const overlay = {
    rect: [409, 10, 53, 45] as [number, number, number, number],
    rectFor: {
      'idle/door-open': [421, 1, 53, 45] as [number, number, number, number],
      walk: [400, 12, 53, 45] as [number, number, number, number],
    },
  };
  assert.deepEqual(overlayRect(overlay, 'idle', 'door-open'), [421, 1, 53, 45]);
  assert.deepEqual(overlayRect(overlay, 'walk'), [400, 12, 53, 45]);
  // A state with no entry of its own falls back to the clip's, then to the
  // default -- the same exact-match-then-fall-back `clipOf` uses.
  assert.deepEqual(overlayRect(overlay, 'walk', 'door-open'), [400, 12, 53, 45]);
  assert.deepEqual(overlayRect(overlay, 'idle'), [409, 10, 53, 45]);
  assert.deepEqual(overlayRect(overlay, 'idle', 'nonesuch'), [409, 10, 53, 45]);
});

test('a body with one frame needs no entries at all', () => {
  const overlay = { rect: [1, 2, 3, 4] as [number, number, number, number] };
  assert.deepEqual(overlayRect(overlay, 'idle'), [1, 2, 3, 4]);
  assert.deepEqual(overlayRect(overlay, 'idle', 'anything'), [1, 2, 3, 4]);
});
