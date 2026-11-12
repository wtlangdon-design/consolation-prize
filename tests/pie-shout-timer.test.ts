import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { breakAt } from '../engine/core/Ambient.ts';

/**
 * THE PIE WOMAN CALLS OUT NO MORE THAN ONCE A MINUTE (errata 224). Tyler, on the feel review's note that she
 * crowded the empty street: "maybe she yells it on a longer timer? Like every minute?" Measured, she was
 * already on one: three breaks rotating on a 26-second cycle put her shout every 78 seconds. What made her
 * feel constant was the same line said two and three times at once, which errata 222 fixed.
 *
 * This runs her own sprite through the break arithmetic the renderer and the scene share, for ten minutes,
 * and holds the gap between shouts to at least a minute, so a later change to her breaks cannot quietly
 * bring her back.
 */
const sprite = JSON.parse(readFileSync(new URL('../content/ambient/pie-woman.json', import.meta.url), 'utf8')).sprite;

export function shoutGaps(declared: { breaks: number[][]; breakEvery?: number; phase?: number; breaksThatSpeak?: number[] }): number[] {
  const lengths = declared.breaks.map((one) => one.length);
  const speaks = declared.breaksThatSpeak ?? [];
  const times: number[] = [];
  let lastCycle = Number.NaN;
  for (let frame = 0; frame < 60 * 600; frame += 1) {
    const now = frame / 60;
    const playing = breakAt(now, declared.breakEvery ?? 26, declared.phase ?? 0, lengths);
    if (!playing || playing.step !== 0 || !speaks.includes(playing.index) || playing.cycle === lastCycle) continue;
    lastCycle = playing.cycle;
    times.push(now);
  }
  return times.slice(1).map((t, i) => t - (times[i] ?? 0));
}

test('she calls out at least a minute apart', () => {
  const gaps = shoutGaps(sprite);
  assert.ok(gaps.length >= 4, `ten minutes held only ${gaps.length + 1} shouts; is she still calling out at all?`);
  const short = gaps.filter((gap) => gap < 60);
  assert.deepEqual(short.map((g) => g.toFixed(1)), [], 'shouts closer than a minute');
});

test('the check catches a faster timer', () => {
  // Five breaks since errata 296, so a 6 s cycle is the one that brings her call round in 30 s.
  assert.ok(shoutGaps({ ...sprite, breakEvery: 6 }).some((gap) => gap < 60), 'a 6 s cycle passed, so this proves nothing');
});
