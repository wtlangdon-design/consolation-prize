/**
 * ERRATA 374: WHAT AN ARRIVAL WRITES IS SAVED (the Act III playtest). The funeral's arrival after the coffin writes
 * T_FUNERAL_DONE as its line is said; the room had been autosaved as it was entered, before that, and a load is a
 * resume, which says no arrival lines. CONTINUE after the coffin left the burial unwritten and the archive door said
 * he was not yet in the ground. The arrival saves again once its writes have landed. Fails on main before errata 374.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('an arrival line\'s writes are followed by an autosave', () => {
  const scene = readFileSync(new URL('../engine/scenes/GameScene.ts', import.meta.url), 'utf8');
  const at = scene.indexOf('this.state.flags.applyWrites(entry.saySet)');
  assert.ok(at > 0, 'the arrival applies its saySet');
  const block = scene.slice(at, scene.indexOf('\n    }\n', at));
  assert.match(block, /this\.state\.autosave\(\)/, 'and saves the game with them');
});
