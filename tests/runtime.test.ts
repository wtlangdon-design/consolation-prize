import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ASSERTION_CODES,
  assertCanonicalTopology,
  assertNoClockPositions,
  assertRequiredClip,
  assertSoleStorageWriter,
  clearFiredAssertions,
  firedAssertions,
  IllegalStateError,
  pureResolution,
  setAssertionChecking,
  type AssertionCode,
} from '../engine/core/Assertions.ts';
import { Clocks } from '../engine/core/Clocks.ts';
import { InputRouter, type RouterGeometry, type RouterState } from '../engine/core/InputRouter.ts';
import { RuntimeCoordinator } from '../engine/core/RuntimeCoordinator.ts';
import { JOURNAL_PHASES } from '../engine/core/TransactionJournal.ts';
import {
  isAtomicRoot,
  type ActionTransaction,
  type ChoreHandle,
  type CutsceneTransaction,
  type DialogueTransaction,
  type FinishReason,
  type GameplayClock,
  type PlayerIntent,
  type RuntimeParticipant,
  type RootOperation,
  type SaveGate,
  type ShellIntent,
  type StableCheckpoint,
  type TransitionTransaction,
} from '../engine/core/runtime-types.ts';

/**
 * Doc 34 section 4.6 and doc 34a's reconciliation, as tests that watch every
 * guard fail.
 *
 * The rule this file is written to: for each of the twenty-one assertions
 * there is a test that CONSTRUCTS the illegal state and proves the guard
 * catches it. The last test in the file asserts that every code in
 * ASSERTION_CODES was seen to fire during the run, so an assertion that
 * becomes unreachable -- because the API changed underneath it, or because a
 * caller stopped invoking it -- fails the suite rather than sitting there
 * looking reassuring.
 *
 * Doc 34 section 1.1 is blunt about why: the 42 passing tests "prove and do
 * not prove" a great deal, and the puzzle-graph validator is singled out for
 * praise because it says it traversed nothing instead of manufacturing a pass.
 * A guard nobody has watched fail is the opposite of that.
 */

/* -------------------------------------------------------------------------
 * Harness
 * ---------------------------------------------------------------------- */

interface FakeWorld {
  room: string;
  revision: number;
  flags: Record<string, number>;
}

function world(): FakeWorld {
  return { room: 'room_a', revision: 0, flags: {} };
}

function coordinator(state: FakeWorld = world(), gate?: SaveGate): RuntimeCoordinator {
  return new RuntimeCoordinator({
    worldHash: () => JSON.stringify(state),
    roomId: () => state.room,
    ...(gate ? { saveGate: gate } : {}),
  });
}

function actionRoot(c: RuntimeCoordinator, id = 'act_1'): RootOperation {
  const journal = c.newJournal(id);
  const tx: ActionTransaction = {
    id,
    phase: 'reserved',
    effects: journal.reserve(`${id}_bundle`, []),
    journal,
  };
  return { kind: 'action', tx };
}

function dialogueRoot(
  c: RuntimeCoordinator, id = 'dlg_1', phase: DialogueTransaction['phase'] = 'reply',
): { root: RootOperation; tx: DialogueTransaction } {
  const journal = c.newJournal(id);
  const tx: DialogueTransaction = {
    id,
    tree: 'tree_1',
    phase,
    effects: journal.reserve(`${id}_bundle`, []),
    journal,
  };
  return { root: { kind: 'dialogue', tx }, tx };
}

function transitionRoot(
  c: RuntimeCoordinator, id = 'trn_1', committed = false,
): { root: RootOperation; tx: TransitionTransaction } {
  const journal = c.newJournal(id);
  const tx: TransitionTransaction = {
    id,
    phase: committed ? 'committed' : 'approach',
    committed,
    from: 'room_a',
    to: 'room_b',
    journal,
  };
  return { root: { kind: 'transition', tx }, tx };
}

function cutsceneRoot(
  c: RuntimeCoordinator, id = 'cut_1', skippable = true,
): { root: RootOperation; tx: CutsceneTransaction } {
  const journal = c.newJournal(id);
  const tx: CutsceneTransaction = {
    id, phase: 'running', skippable, journal, finalCheckpoint: 'cp_1',
  };
  return { root: { kind: 'cutscene', tx }, tx };
}

/** A stand-in for step C's real handle: it records the reason and nothing else. */
function choreHandle(id: string, ownedByTransition = false): ChoreHandle {
  let reason: FinishReason | null = null;
  return {
    id,
    kind: 'chore',
    actor: 'actor_1',
    ownedByTransition,
    stable: () => reason !== null,
    finish: (given) => { reason = given; },
    finishedWith: () => reason,
  };
}

function livePath(id = 'path_1'): RuntimeParticipant {
  let live = true;
  return {
    id,
    kind: 'path',
    stable: () => !live,
    finish: () => { live = false; },
  };
}

function collectingGate(): { gate: SaveGate; writes: StableCheckpoint[] } {
  const writes: StableCheckpoint[] = [];
  return { gate: { releaseQueuedRequest: (cp) => { writes.push(cp); } }, writes };
}

/** Asserts the block throws the named assertion, and nothing else. */
function fires(code: AssertionCode, block: () => void): void {
  assert.throws(block, (error: unknown) => {
    assert.ok(error instanceof IllegalStateError, `expected IllegalStateError, got ${error}`);
    assert.equal(error.code, code);
    return true;
  });
}

const rect = (x: number, y: number, width: number, height: number) => ({ x, y, width, height });

function geometry(overrides: Partial<RouterGeometry> = {}): RouterGeometry {
  return {
    shellControl: () => rect(288, 144, 32, 14),
    choiceList: () => rect(0, 96, 320, 48),
    panel: () => rect(0, 144, 320, 56),
    playfield: () => rect(0, 0, 320, 144),
    ...overrides,
  };
}

const quiet: RouterState = {
  confirmationOpen: false, shellOpen: false, choicesActive: false, speechActive: false,
};

/* =========================================================================
 * The twenty-one, each made to fire
 * ====================================================================== */

test('1 ROOT_EXCLUSIVE: a second atomic root cannot be started', () => {
  const c = coordinator();
  c.begin(actionRoot(c, 'act_1'));
  fires('ROOT_EXCLUSIVE', () => c.begin(dialogueRoot(c, 'dlg_1').root));
  // The first root is still the root. A refused begin changes nothing.
  assert.equal(c.root.kind, 'action');

  // freeWalk is not atomic, so it may be replaced by one.
  const other = coordinator();
  other.begin({ kind: 'freeWalk', cancellable: true });
  other.begin(actionRoot(other, 'act_2'));
  assert.equal(other.root.kind, 'action');
});

test('2 EFFECT_ONE_OWNER: two transactions cannot reserve one durable effect', () => {
  const c = coordinator();
  const first = c.newJournal('tx_a');
  const second = c.newJournal('tx_b');
  first.reserve('bundle_a', [{ id: 'eff_1', kind: 'flag', flag: 'F_ONE', value: true }]);
  fires('EFFECT_ONE_OWNER', () => {
    second.reserve('bundle_b', [{ id: 'eff_1', kind: 'flag', flag: 'F_ONE', value: false }]);
  });
  assert.equal(c.ownership.ownerOf('eff_1'), 'tx_a');

  // Released at finish, and then claimable by the next transaction.
  first.release();
  assert.equal(c.ownership.ownerOf('eff_1'), undefined);
});

test('3 CHECKPOINT_WHILE_UNSTABLE: a checkpoint may not be published over a live path', () => {
  const c = coordinator();
  const path = livePath();
  c.addParticipant(path);
  assert.equal(c.checkpoint(), null, 'checkpoint() reports null rather than lying');
  fires('CHECKPOINT_WHILE_UNSTABLE', () => c.publishStable('idle'));

  path.finish('settled');
  assert.notEqual(c.checkpoint(), null);
});

test('4 TRANSITION_BEFORE_DRAIN: a transition cannot begin under an undrained exchange', () => {
  const c = coordinator();
  const { root, tx } = dialogueRoot(c, 'dlg_1', 'reply');
  c.begin(root);
  // The exchange releases the root without reaching `settled` -- section 4.3's
  // "its continuation requests a transition; it does not start under the last
  // line". The coordinator deliberately does not stamp the phase itself.
  c.finish('settled');
  fires('TRANSITION_BEFORE_DRAIN', () => c.begin(transitionRoot(c, 'trn_1').root));

  tx.phase = 'settled';
  c.begin(transitionRoot(c, 'trn_2').root);
  assert.equal(c.root.kind, 'transition');
});

test('5 HANDLE_UNSETTLED_AT_DISPOSAL: a live chore handle blocks participant disposal', () => {
  const c = coordinator();
  c.addParticipant(choreHandle('chore_1'));
  fires('HANDLE_UNSETTLED_AT_DISPOSAL', () => c.unloadParticipants());

  // The legal route: a reasoned finish first, then disposal.
  c.finishParticipants('roomUnloaded');
  c.unloadParticipants();

  // A transition-owned handle settles with its transition and is exempt.
  const other = coordinator();
  other.addParticipant(choreHandle('chore_2', true));
  other.unloadParticipants();
});

test('6 BODY_ONE_OWNER: two owners cannot advance one body', () => {
  const c = coordinator();
  c.claimBody('actor_1', 'walk');
  fires('BODY_ONE_OWNER', () => c.claimBody('actor_1', 'chore'));
  assert.equal(c.bodyOwner('actor_1'), 'walk');

  c.releaseBody('actor_1', 'walk');
  c.claimBody('actor_1', 'chore');
  assert.equal(c.bodyOwner('actor_1'), 'chore');
});

test('7 RESOLVER_MUTATED: resolution that writes is caught by the purity wrapper', () => {
  const state = world();
  const snapshot = () => JSON.stringify(state);

  fires('RESOLVER_MUTATED', () => {
    pureResolution(snapshot, () => {
      state.flags['F_ONE'] = 1;
      return 'line';
    });
  });

  const pure = pureResolution(snapshot, () => 'line');
  assert.equal(pure, 'line');
});

test('8 PHASE_ORDER: journal markers are exactly once and in section 9.1 order', () => {
  const c = coordinator();
  const twice = c.newJournal('tx_twice');
  twice.mark('flags');
  fires('PHASE_ORDER', () => twice.mark('flags'));

  const backwards = c.newJournal('tx_backwards');
  backwards.mark('flags');
  fires('PHASE_ORDER', () => backwards.mark('line'));

  const good = c.newJournal('tx_good');
  for (const phase of JOURNAL_PHASES) good.mark(phase);
  assert.deepEqual(good.trace, [...JOURNAL_PHASES]);
  assert.equal(good.committed, true);
});

test('9 SAVE_CAPTURE_WHILE_UNSTABLE: a capture during atomic work is refused', () => {
  const c = coordinator();
  c.begin(actionRoot(c));
  fires('SAVE_CAPTURE_WHILE_UNSTABLE', () => c.requestCapture());

  c.finish('settled');
  assert.notEqual(c.requestCapture(), null);
});

test('10 AUTOSAVE_BEFORE_INGRESS: only destination-settled may fire a transition autosave', () => {
  const c = coordinator();
  fires('AUTOSAVE_BEFORE_INGRESS', () => c.requestTransitionAutosave('roomIdChanged'));
  fires('AUTOSAVE_BEFORE_INGRESS', () => c.requestTransitionAutosave('onEnterApplied'));

  const { gate, writes } = collectingGate();
  const settled = coordinator(world(), gate);
  settled.requestTransitionAutosave('destinationSettled');
  assert.equal(writes.length, 1);
});

test('11 QUEUED_SAVE_STALLED: a queued save may not wait behind paused clocks', () => {
  const c = coordinator();
  c.begin(actionRoot(c));
  c.requestSave({ slot: 0, cancellable: false });
  c.openShell();
  fires('QUEUED_SAVE_STALLED', () => c.advance(0.1));

  // A cancellable request may sit under an open shell; it is not a deadlock
  // because the player can withdraw it.
  const ok = coordinator();
  ok.begin(actionRoot(ok));
  ok.requestSave({ slot: 0, cancellable: true });
  ok.openShell();
  ok.advance(0.1);
});

test('12 INPUT_ONE_LAYER: one event, one layer, and the shell stays reachable', () => {
  const router = new InputRouter(geometry());
  router.route(quiet, 10, 10);
  fires('INPUT_ONE_LAYER', () => router.record('shell'));

  // The other half of the strengthened rule: a panel that stops drawing the
  // shell control makes MENU unreachable, which doc 34 section 9.2 forbids.
  const blind = new InputRouter(geometry({ shellControl: () => null }));
  fires('INPUT_ONE_LAYER', () => blind.route({ ...quiet, speechActive: true }, 10, 10));
});

test('13 LOAD_MUTATED_LIVE: candidate validation may not touch the live session', () => {
  const state = world();
  const c = coordinator(state);
  fires('LOAD_MUTATED_LIVE', () => c.validateCandidate(() => {
    state.room = 'room_b';
    return false;
  }));

  const clean = c.validateCandidate(() => 'ok');
  assert.equal(clean, 'ok');
});

test('14 CLIP_FALLBACK: a required clip lookup fails instead of falling back', () => {
  fires('CLIP_FALLBACK', () => assertRequiredClip(undefined, 'react', 'left', 'mud'));
  assertRequiredClip({ row: 3 }, 'react', 'left', 'mud');
});

test('15 OBSOLETE_TOPOLOGY: forbidden edges and missing reciprocals are both rejected', () => {
  const contract = {
    reciprocal: [['a', 'b'], ['b', 'c']] as const,
    forbidden: [['a', 'z']] as const,
  };
  fires('OBSOLETE_TOPOLOGY', () => assertCanonicalTopology([['a', 'z']], contract));
  fires('OBSOLETE_TOPOLOGY', () => assertCanonicalTopology([['a', 'b'], ['b', 'a']], contract));
  assertCanonicalTopology(
    [['a', 'b'], ['b', 'a'], ['b', 'c'], ['c', 'b']], contract,
  );
});

test('16 STORAGE_SOLE_WRITER: nothing but the save coordinator writes storage', () => {
  fires('STORAGE_SOLE_WRITER', () => assertSoleStorageWriter('gameState', 'saveCoordinator'));
  assertSoleStorageWriter('saveCoordinator', 'saveCoordinator');
});

test('17 SAVE_ARBITRATED_COMMIT: the save coordinator may not decide a finish', () => {
  const c = coordinator();
  c.begin(actionRoot(c));
  fires('SAVE_ARBITRATED_COMMIT', () => c.finish('settled', 'save'));
  assert.equal(c.root.kind, 'action', 'the refused finish left the root alone');
  c.finish('settled', 'runtime');
});

test('18 DISPOSE_OFF_SWAP: the live coordinator goes only at the atomic swap', () => {
  const c = coordinator();
  fires('DISPOSE_OFF_SWAP', () => c.dispose(false));
  assert.equal(c.isDisposed, false);
  c.dispose(true);
  assert.equal(c.isDisposed, true);
});

test('19 WORLD_CANCELLED_COMMITTED: a committed transition survives world input', () => {
  const c = coordinator();
  const { root } = transitionRoot(c, 'trn_1', true);
  c.begin(root);
  fires('WORLD_CANCELLED_COMMITTED', () => c.finish('playerCancelled'));
  assert.equal(c.root.kind, 'transition');

  // G3: a session-replacement command may abandon the whole live world.
  c.finish('sessionAbandoned', 'load');
  assert.equal(c.root.kind, 'stable');
});

test('20 WALL_CLOCK_GAMEPLAY: the wall clock never drives gameplay state', () => {
  const clocks = new Clocks();
  clocks.advance(1);
  assert.equal(clocks.now('wall'), 1, 'a timestamp read is legal');
  // The cast is the point: the type forbids it at compile time and the guard
  // catches the engine code that reaches for it anyway.
  fires('WALL_CLOCK_GAMEPLAY', () => clocks.gameplay('wall' as unknown as GameplayClock));
  assert.equal(clocks.gameplay('simulation'), 1);
});

test('21 CLOCK_POSITION_PERSISTED: no live clock position reaches a save', () => {
  fires('CLOCK_POSITION_PERSISTED', () => assertNoClockPositions({
    room: 'room_a',
    clocks: { presentation: 12.5 },
  }));
  fires('CLOCK_POSITION_PERSISTED', () => assertNoClockPositions({ audioTransport: 4 }));

  // A wall-clock TIMESTAMP is not a clock position; section 4.5 keeps those.
  assertNoClockPositions({ room: 'room_a', savedAt: 1_722_000_000_000 });
  assertNoClockPositions(new Clocks().persistable());
});

/* =========================================================================
 * Section 9.1's property-style checks
 * ====================================================================== */

test('9.1 root exclusivity holds over a long random intent sequence', () => {
  const c = coordinator();
  // Deterministic so a failure is reproducible. A random seed in a test is a
  // failure you get to see once.
  let seed = 20260802;
  const next = (n: number): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed % n;
  };

  const players: PlayerIntent[] = [
    { kind: 'walk', x: 10, y: 10 },
    { kind: 'interact', target: 't', verb: 'v' },
    { kind: 'choose', option: 'o' },
    { kind: 'skipLine' },
    { kind: 'skipScene' },
    { kind: 'selectVerb', verb: 'v' },
    { kind: 'holdItem', item: null },
  ];
  const shells: ShellIntent[] = [
    { kind: 'openShell' }, { kind: 'closeShell' },
    { kind: 'save', slot: 0 }, { kind: 'options' },
  ];

  let previousAtomic: object | null = null;
  let counter = 0;

  for (let step = 0; step < 600; step += 1) {
    const choice = next(10);
    try {
      if (choice === 0) c.begin(actionRoot(c, `act_${counter += 1}`));
      else if (choice === 1) c.begin(dialogueRoot(c, `dlg_${counter += 1}`, 'settled').root);
      else if (choice === 2) c.begin(cutsceneRoot(c, `cut_${counter += 1}`).root);
      else if (choice === 3) c.begin({ kind: 'freeWalk', cancellable: true });
      else if (choice === 4) c.finish('settled');
      else if (choice === 5) c.claimBody('actor_1', `owner_${next(3)}`);
      else if (choice === 6) c.releaseBody('actor_1', `owner_${next(3)}`);
      else if (choice === 7) c.request(players[next(players.length)] as PlayerIntent);
      else if (choice === 8) c.request(shells[next(shells.length)] as ShellIntent);
      else c.advance(0.016);
    } catch (error) {
      // A refused illegal request is the guard working. Anything else is a bug.
      assert.ok(error instanceof IllegalStateError, `unexpected throw: ${error}`);
    }

    const root = c.root;
    if (isAtomicRoot(root.kind)) {
      const identity = root as object;
      if (previousAtomic !== null) {
        assert.equal(identity, previousAtomic, 'an atomic root was replaced in place');
      }
      previousAtomic = identity;
    } else {
      previousAtomic = null;
    }

    // One body owner per actor is structural: the map holds one value per key
    // and assertBodyUnowned is what stops a second claim overwriting it.
    const owner = c.bodyOwner('actor_1');
    assert.ok(owner === undefined || typeof owner === 'string');
  }
});

test('9.1 exactly-once trace: one action emits each phase once, in order', () => {
  const c = coordinator();
  const journal = c.newJournal('tx_trace');
  const tx: ActionTransaction = {
    id: 'tx_trace',
    phase: 'reserved',
    effects: journal.reserve('bundle_trace', [
      { id: 'eff_state', kind: 'objectState', object: 'obj_1', state: 'open' },
      { id: 'eff_flag', kind: 'flag', flag: 'F_ONE', value: true },
      { id: 'eff_item', kind: 'inventoryAdd', item: 'item_1' },
    ]),
    journal,
  };
  c.begin({ kind: 'action', tx });

  // Section 9.1's order, and the order section 3.1 rules D31/errata 48 win
  // with: visible performance first, durable state after.
  for (const phase of JOURNAL_PHASES) journal.mark(phase);

  assert.deepEqual(journal.trace, [
    'stage', 'choreContact', 'sound', 'choreSettle',
    'line', 'lineSettle', 'worldState', 'flags', 'inventory', 'stable',
  ]);
  for (const phase of JOURNAL_PHASES) {
    assert.equal(journal.trace.filter((seen) => seen === phase).length, 1, phase);
  }

  // The bundle is immutable, not merely conventionally immutable.
  assert.throws(() => {
    (tx.effects.effects as { length: number }).length = 0;
  });

  c.finish('settled');
  assert.equal(c.ownership.size, 0, 'settling released every effect id');
});

test('9.1 save sweep: a save requested at every phase queues once and writes once', () => {
  for (const phase of JOURNAL_PHASES) {
    const { gate, writes } = collectingGate();
    const c = coordinator(world(), gate);
    const journal = c.newJournal(`tx_${phase}`);
    const tx: ActionTransaction = {
      id: `tx_${phase}`,
      phase: 'reserved',
      effects: journal.reserve(`bundle_${phase}`, []),
      journal,
    };
    c.begin({ kind: 'action', tx });

    for (const marker of JOURNAL_PHASES) {
      journal.mark(marker);
      if (marker === phase) break;
    }

    // Section 4.4: queue one slot request, close the shell, resume the clocks.
    c.openShell();
    const result = c.request({ kind: 'save', slot: 1 });
    assert.equal(result.queued, true, phase);
    assert.equal(c.clocks.shellOpen, false, 'menu liveness: the shell closed');
    assert.equal(c.clocks.gameplayPaused, false, 'menu liveness: the clocks resumed');
    assert.equal(writes.length, 0, `no unstable snapshot write at ${phase}`);

    // The operation reaches its own settle, and exactly one write appears.
    const remaining = JOURNAL_PHASES.slice(JOURNAL_PHASES.indexOf(phase) + 1);
    for (const marker of remaining) journal.mark(marker);
    c.finish('settled');
    c.publishStable('actionSettled');
    assert.equal(writes.length, 1, `exactly one queued write at settle, from ${phase}`);
    assert.equal(c.pendingSave, null);
  }
});

/* =========================================================================
 * The contract's ordinary behaviour
 * ====================================================================== */

test('the router offers layers in section 10.7 order and consumes at exactly one', () => {
  const router = new InputRouter(geometry());

  assert.equal(router.route({ ...quiet, shellOpen: true }, 10, 10), 'shell');
  assert.equal(router.route({ ...quiet, confirmationOpen: true }, 10, 10), 'shell');
  // The reserved control takes its click before speech ever sees it -- G5.
  assert.equal(router.route({ ...quiet, speechActive: true }, 300, 150), 'shell');
  assert.equal(router.route({ ...quiet, choicesActive: true }, 10, 100), 'choice');
  // The playfield is skip-only during speech.
  assert.equal(router.route({ ...quiet, speechActive: true }, 10, 10), 'speechSkip');
  // And skip outranks the panel, which is section 10.7's stated order.
  assert.equal(router.route({ ...quiet, speechActive: true }, 10, 150), 'speechSkip');
  assert.equal(router.route(quiet, 10, 150), 'panel');
  assert.equal(router.route(quiet, 10, 10), 'world');

  for (const [x, y] of [[10, 10], [10, 150], [300, 150], [10, 100]] as const) {
    router.route({ ...quiet, speechActive: true }, x, y);
    assert.equal(router.consumers.length, 1, `${x},${y} was consumed once`);
  }
});

test('input mode is owned by the coordinator and follows the root', () => {
  const c = coordinator();
  assert.equal(c.inputMode, 'world');

  c.begin({ kind: 'freeWalk', cancellable: true });
  assert.equal(c.inputMode, 'world');
  c.finish('settled');

  c.begin(actionRoot(c));
  assert.equal(c.inputMode, 'none', 'ordinary world clicks are locked during atomic work');
  c.beginSpeech();
  assert.equal(c.inputMode, 'speechSkip');
  c.setChoices(true);
  assert.equal(c.inputMode, 'choice');
  c.openShell();
  assert.equal(c.inputMode, 'shell', 'the shell outranks everything');
  c.closeShell();
  c.setChoices(false);
  c.endSpeech();
  c.finish('settled');
  assert.equal(c.inputMode, 'world');
});

test('world input during a committed transition is refused, not obeyed', () => {
  const c = coordinator();
  c.begin(transitionRoot(c, 'trn_1', true).root);
  const result = c.request({ kind: 'walk', x: 5, y: 5 });
  assert.equal(result.accepted, false);
  assert.equal(result.refusal, 'committedTransition');
  assert.equal(result.layer, null);
  // The shell is still reachable while the transition owns the world.
  assert.equal(c.request({ kind: 'openShell' }).accepted, true);
});

test('whole-sequence skip belongs to a non-interactive cutscene only', () => {
  const skippable = coordinator();
  skippable.begin(cutsceneRoot(skippable, 'cut_1', true).root);
  assert.equal(skippable.request({ kind: 'skipScene' }).accepted, true);

  const ordinary = coordinator();
  ordinary.begin(transitionRoot(ordinary, 'trn_1', false).root);
  // G6: an ordinary room transition is not player-skippable.
  assert.equal(ordinary.request({ kind: 'skipScene' }).accepted, false);
});

test('clock domains pause as section 4.5 says, and the coffin keeps its transport', () => {
  const clocks = new Clocks();
  clocks.advance(1);
  for (const domain of ['wall', 'simulation', 'presentation', 'ambient', 'audioTransport'] as const) {
    assert.equal(clocks.now(domain), 1, domain);
  }

  clocks.openShell();
  clocks.advance(1);
  assert.equal(clocks.now('wall'), 2, 'the wall clock never pauses');
  assert.equal(clocks.now('simulation'), 1);
  assert.equal(clocks.now('presentation'), 1);
  assert.equal(clocks.now('ambient'), 1);
  assert.equal(clocks.now('audioTransport'), 1, 'the transport usually pauses under shell');

  // The coffin: the transport runs while nothing is audible, and section 10.10
  // still pauses it with the scene when the shell opens.
  clocks.setSilentTransport(true);
  assert.equal(clocks.transportSilent, true);
  assert.equal(clocks.paused('audioTransport'), true, 'shell pauses it even in the coffin');
  clocks.closeShell();
  clocks.advance(1);
  assert.equal(clocks.now('audioTransport'), 2, 'and it advances silently otherwise');
});

test('text speed scales reading holds only, never an authored beat', () => {
  const clocks = new Clocks();
  const options = { readingSpeed: 2, reading: true };

  assert.equal(clocks.hold('presentation', 3, options), 6, 'a reading hold scales');
  assert.equal(
    clocks.hold('presentation', 4, { readingSpeed: 2 }), 4,
    'an authored non-reading beat does not',
  );
  assert.equal(
    clocks.hold('simulation', 3, options), 3,
    'and no other clock scales at all',
  );
  assert.equal(clocks.hold('presentation', 3), 3, 'with no setting, nothing changes');
});

test('a checkpoint is null while any participant is live, and non-null after', () => {
  const c = coordinator();
  const path = livePath('path_1');
  const chore = choreHandle('chore_1');
  c.addParticipant(path);
  c.addParticipant(chore);
  assert.equal(c.checkpoint(), null);

  path.finish('settled');
  assert.equal(c.checkpoint(), null, 'one settled participant is not stability');
  chore.finish('settled');
  const checkpoint = c.checkpoint();
  assert.notEqual(checkpoint, null);
  assert.equal(checkpoint?.roomId, 'room_a');

  // An atomic root is itself a live participant.
  c.begin(actionRoot(c));
  assert.equal(c.checkpoint(), null);
});

test('published checkpoints carry a rising revision and reach every subscriber', () => {
  const c = coordinator();
  const seen: StableCheckpoint[] = [];
  c.subscribeStable((checkpoint) => seen.push(checkpoint));
  c.publishStable('idle');
  c.publishStable('destinationSettled');
  assert.equal(seen.length, 2);
  assert.equal(seen[0]?.revision, 1);
  assert.equal(seen[1]?.revision, 2);
  assert.equal(seen[1]?.reason, 'destinationSettled');
});

test('a queued save survives the whole atomic operation and writes once at settle', () => {
  const { gate, writes } = collectingGate();
  const c = coordinator(world(), gate);
  c.attachSaveGate(gate);
  c.begin(actionRoot(c));
  c.beginSpeech();

  c.request({ kind: 'openShell' });
  c.request({ kind: 'save', slot: 2 });
  assert.equal(c.clocks.shellOpen, false);
  assert.equal(writes.length, 0);

  for (let tick = 0; tick < 30; tick += 1) c.advance(0.016);
  assert.equal(writes.length, 0, 'still nothing captured mid-action');

  c.endSpeech();
  c.finish('settled');
  c.advance(0.016);
  assert.equal(writes.length, 1);
  // The gate receives a checkpoint. It is the coordinator that knows when, and
  // step D's SaveCoordinator that knows where -- section 4.1's split exactly.
  assert.equal(writes[0]?.reason, 'idle');
  assert.equal(writes[0]?.roomId, 'room_a');
});

test('assertions can be switched off, and every guard becomes a dead branch', () => {
  setAssertionChecking(false);
  try {
    const c = coordinator();
    c.begin(actionRoot(c, 'act_1'));
    // Every one of these is illegal and none of them throws with checking off.
    c.begin(dialogueRoot(c, 'dlg_1').root);
    c.claimBody('actor_1', 'walk');
    c.claimBody('actor_1', 'chore');
    c.dispose(false);
    assertRequiredClip(undefined, 'react', 'left', 'mud');
    assertNoClockPositions({ presentation: 3 });
  } finally {
    setAssertionChecking(true);
  }
  // And back on again, so the reachability check below still means something.
  const c = coordinator();
  c.begin(actionRoot(c, 'act_1'));
  fires('ROOT_EXCLUSIVE', () => c.begin(actionRoot(c, 'act_2')));
});

/* =========================================================================
 * Reachability -- this test is why the others are written the way they are
 * ====================================================================== */

test('every one of the twenty-one assertions was seen to fire in this run', () => {
  assert.equal(ASSERTION_CODES.length, 21, 'doc 34 section 4.6 fifteen plus doc 34a six');
  const seen = firedAssertions();
  const never = ASSERTION_CODES.filter((code) => !seen.has(code));
  assert.deepEqual(never, [], `assertions never watched to fail: ${never.join(', ')}`);
  clearFiredAssertions();
});
