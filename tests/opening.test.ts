import assert from 'node:assert/strict';
import test from 'node:test';

import { playfieldClick, segmentsOf, stepsFor } from '../engine/core/Opening.ts';
import { SequenceRunner, type SequenceHost } from '../engine/core/Sequence.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) =>
  JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/**
 * Q25. A CLICK DURING A CUTSCENE MUST NOT STOP THE OPENING ADVANCING.
 *
 * This is a miniature of the two pieces that disagreed, and it is deliberately
 * shaped like the update loop rather than like the fix:
 *
 *   - the loop samples `isRunning` BEFORE ticking and calls the advance on the
 *     running-to-stopped transition, exactly as GameScene.update does;
 *   - a click asks `playfieldClick` what it may do, exactly as the pointer
 *     handler does.
 *
 * That shape is the whole point. The defect was never visible from either
 * piece alone: `cancel()` cleared `started`, so `isRunning` went false INSIDE
 * the click handler, the next tick's `wasRunning` read false, the transition
 * never happened and the segment counter froze -- with no error, nothing on
 * screen, and every unit test passing. Only the two together show it.
 *
 * It asserts the PROPERTY -- the opening still advances -- and not any number,
 * which is why it survives beats being re-authored, durations changing, or the
 * verdict growing a third case.
 */
class OpeningHarness {
  at = 0;
  private readonly runner = new SequenceRunner();
  private now = 0;
  private readonly host: SequenceHost;
  // Written out rather than as constructor parameter properties: the tests run
  // under node --experimental-strip-types, which refuses anything needing emit.
  private readonly segments: ReturnType<typeof segmentsOf>;
  /** Swappable, so the pre-fix behaviour can be reinstated and watched fail. */
  private readonly decide: typeof playfieldClick;

  constructor(segments: ReturnType<typeof segmentsOf>, decide: typeof playfieldClick) {
    this.segments = segments;
    this.decide = decide;
    this.host = {
      say: () => 0.5,
      walk: () => {},
      move: () => {},
      isWalking: () => false,
      face: () => {},
      isTurning: () => false,
      chore: () => 0.5,
      isChoring: () => false,
      setState: () => {},
    } as unknown as SequenceHost;
    this.play();
  }

  get finished(): boolean {
    return this.at >= this.segments.length;
  }

  /** The scene's own rule: automatic segments run, everything else waits. */
  private play(): void {
    while (!this.finished) {
      const segment = this.segments[this.at]!;
      if (segment.kind === 'automatic') {
        this.runner.start(stepsFor(segment));
        return;
      }
      // A carried or player segment is driven by something this harness does
      // not model; treat it as immediately handed on so the automatic beats
      // either side of it are exercised.
      this.at += 1;
    }
  }

  /** GameScene.update, in the order that matters. */
  tick(seconds = 0.25): void {
    const wasRunning = this.runner.isRunning;
    this.now += seconds;
    this.runner.update(this.now, this.host);
    if (!this.finished && wasRunning && !this.runner.isRunning) {
      this.at += 1;
      this.play();
    }
  }

  /** The pointer handler, in the order that matters. */
  click(): void {
    const verdict = this.decide({
      sequenceRunning: this.runner.isRunning,
      openingActive: !this.finished,
    });
    if (verdict === 'consume') return;
    if (verdict === 'cancel') this.runner.cancel();
  }
}

/** What the click handler did before Q25 was ruled: always cancel. */
const alwaysCancel: typeof playfieldClick = (options) =>
  (options.sequenceRunning ? 'cancel' : 'pass');

test('Q25: clicking through every beat still lets the opening finish', async () => {
  const content = await loadContent(fsReader);
  const opening = content.sequences.get('opening');
  assert.ok(opening, 'the opening sequence is in the manifest');
  const segments = segmentsOf(opening);
  assert.ok(segments.some((s) => s.kind === 'automatic'),
    'and it has automatic segments, or this test proves nothing');

  const harness = new OpeningHarness(segments, playfieldClick);
  // A click on every single tick -- harsher than any player, and the pattern
  // that wedged the real game at 700ms intervals.
  for (let i = 0; i < 4000 && !harness.finished; i += 1) {
    harness.click();
    harness.tick();
  }
  assert.ok(harness.finished,
    `the opening stalled at segment ${harness.at} of ${segments.length}`);
});

test('Q25: and it stalls with the pre-fix verdict, so the test can fail', async () => {
  const content = await loadContent(fsReader);
  const segments = segmentsOf(content.sequences.get('opening')!);

  // The same harness with the OLD decision reinstated. If this ever finishes,
  // the test above has stopped proving anything -- either the click no longer
  // reaches the runner, or the opening no longer has an automatic segment to
  // be interrupted, and in both cases the guard above is passing vacuously.
  const harness = new OpeningHarness(segments, alwaysCancel);
  for (let i = 0; i < 4000 && !harness.finished; i += 1) {
    harness.click();
    harness.tick();
  }
  assert.ok(!harness.finished,
    'cancelling on click must wedge the opening -- if it does not, the guard above is vacuous');
  // WHERE it wedges is not asserted, deliberately. The first draft of this
  // said `at === 0` and failed at 1, because the harness steps straight past
  // the menu segment: a number about the beat sheet's shape rather than about
  // the defect. What matters is that it stops on an automatic segment -- the
  // only kind a click can interrupt -- and never reaches the end.
  assert.equal(segments[harness.at]?.kind, 'automatic',
    'and it wedges on an automatic segment, which is the only kind a click can stop');
});

test('Q25: the verdict itself, stated once', () => {
  assert.equal(playfieldClick({ sequenceRunning: true, openingActive: true }), 'consume',
    'a cutscene beat is playing: the click is spent, and does not touch the sequence');
  assert.equal(playfieldClick({ sequenceRunning: true, openingActive: false }), 'cancel',
    "ordinary play keeps doc 22's deterministic cancellation");
  assert.equal(playfieldClick({ sequenceRunning: false, openingActive: true }), 'pass',
    'an opening segment nothing is performing -- the player has control and may act');
  assert.equal(playfieldClick({ sequenceRunning: false, openingActive: false }), 'pass');
});
