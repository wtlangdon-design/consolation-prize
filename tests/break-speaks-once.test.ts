import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { breakAt, spokenBreakKey } from '../engine/core/Ambient.ts';

/**
 * A SPOKEN BREAK IS SAID ONCE (errata 222). The pie woman shouts her line as her calling-out break begins. The
 * scene keyed "already said" on the wall-clock second, and a break's first frame lasts 0.34 s, so a first frame
 * that straddled a second boundary said it twice, about 90 ms apart. The overnight playthrough logged her
 * "Pie, Mr. Grubb. On the house." three times on one pass along the street.
 *
 * This plays the scene's own rule at 60 fps across many cycles: every break that reaches its first frame is
 * said exactly once.
 */
function timesSaid(keyFor: (playing: { cycle: number }, now: number) => string): Map<number, number> {
  const every = 7.3; const lengths = [3, 4];
  const said = new Map<number, number>();
  let last: string | null = null;
  for (let frame = 0; frame < 60 * every * 40; frame += 1) {
    const now = frame / 60;
    const playing = breakAt(now, every, 0.37, lengths);
    if (!playing || playing.step !== 0) continue;
    const key = keyFor(playing, now);
    if (key === last) continue;
    last = key;
    said.set(playing.cycle, (said.get(playing.cycle) ?? 0) + 1);
  }
  return said;
}

test('every spoken break is said exactly once', () => {
  const said = timesSaid((playing) => spokenBreakKey('pie_woman', playing));
  assert.ok(said.size >= 30, 'the sweep reached too few breaks to mean anything');
  const twice = [...said].filter(([, n]) => n !== 1);
  assert.deepEqual(twice, [], 'cycles said more than once: ' + twice.map(([c, n]) => c + ' x' + n).join(', '));
});

test('the check catches the wall-clock key errata 222 replaced', () => {
  const said = timesSaid((_playing, now) => 'pie_woman:' + String(Math.floor(now)));
  assert.ok([...said.values()].some((n) => n > 1), 'the old key never double-fired, so this test proves nothing');
});

test('the scene keys a spoken break with spokenBreakKey', () => {
  const scene = readFileSync(new URL('../engine/scenes/GameScene.ts', import.meta.url), 'utf8');
  const start = scene.indexOf('private speakingBreaks');
  const body = scene.slice(start, scene.indexOf('\n  /**', start));
  assert.match(body, /spokenBreakKey\(npc\.id, playing\)/);
  assert.doesNotMatch(body, /this\.time\.now \/ 1000/);
});
