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
import { depthOrder, roomFigures } from '../engine/render/Renderer.ts';
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
    chore: () => 0,
    say: (step) => {
      if (step.line !== undefined) said.push(step.line);
      return 1;
    },
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
    assert.ok(Object.keys(carried.set ?? {}).length > 0,
      'the beat writes at least one flag, which was also being dropped');
  }
});

test('the carrier delivers every line and every flag write of those beats', async () => {
  const segment = await uncarriedSegment();
  const written: Record<string, boolean | number> = {};
  const said: string[] = [];
  const carrier = new CarriedBeats((writes) => Object.assign(written, writes));
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

test('a carried beat\'s flags are written as it begins, not once its subject has gone', async () => {
  const segment = await uncarriedSegment();
  const written: Record<string, boolean | number> = {};
  const carrier = new CarriedBeats((writes) => Object.assign(written, writes));
  const said: string[] = [];
  carrier.arm(segment.beats);
  carrier.update(0, recordingHost(said));

  // The hotspot the first of these flags gates carries written lines about a
  // man who is STILL crossing. Written at the end of his lines it would have
  // arrived describing an empty road.
  const first = segment.beats.find((beat) => Object.keys(beat.set ?? {}).length > 0)!;
  for (const flag of Object.keys(first.set ?? {})) {
    assert.ok(flag in written, `${flag} is set as its beat begins`);
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
  const declared = content.actor.sizes.near.clips[0]!;

  assert.ok(sprite.frameCount(declared.id, declared.facing, declared.surface, 40) > 0);

  // Two fallbacks used to stand here: keep the facing and give up the clip,
  // then `clips[0]`. Both drew a frame of something and reported success, and
  // doc 34 step C is commissioned to remove exactly this.
  assert.throws(
    () => sprite.frameCount('a_clip_nobody_drew', declared.facing, declared.surface, 40),
    (error: unknown) => {
      assert.ok(error instanceof IllegalStateError);
      assert.equal(error.code, 'CLIP_FALLBACK');
      assert.match(error.message, /a_clip_nobody_drew/, 'and the message names the clip');
      return true;
    },
  );
});

test('doc 40\'s idle-break plays only where the record declares it', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom(openingRoom(content));

  // Q9: `thad.json` does not declare it, and rewriting that file is not this
  // work's call. A character with no idle-break clip simply does not glance
  // aside -- nothing is substituted, and nothing pretends to be it.
  const without = new Actor(state, content.actor.id, 960, 780, { routed: true });
  without.update(0);
  without.update(60);
  assert.equal(without.clip, 'idle');

  // The mechanism is real and starts working the day the clip is declared.
  const with_ = new Actor(state, content.actor.id, 960, 780,
    { routed: true, hasIdleBreak: true });
  with_.update(0);
  with_.update(60);
  assert.equal(with_.clip, 'idle-break');
  with_.walkTo(360, 780);
  with_.update(60.1);
  assert.equal(with_.clip, 'walk', 'and it gives the body back the moment he moves');
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
