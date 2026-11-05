/**
 * A LINK FROM PROSE MUST START THE GAME, NEVER STOP IT (2026-11-05).
 *
 * Tyler opened `?fixture=r11-b` from a chat message whose link ran on into the
 * em dash after it. `?fixture=` threw on anything but a bare id, the throw
 * came out of the scene's `create`, and the game sat on a black screen for
 * good. `idFromQuery` now takes the leading id and reports the rest, for
 * `?fixture=` and `?room=` alike; a value with no id at its start is ignored.
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import { idFromQuery } from '../engine/dev/Fixture.ts';

test('a link that ran on into the next character keeps its id', () => {
  assert.equal(idFromQuery('?fixture=r11-b%E2%80%94', 'fixture'), 'r11-b');
  assert.equal(idFromQuery('?room=fanshawe_office%E2%80%94', 'room'), 'fanshawe_office');
  assert.equal(idFromQuery('?fixture=r11-b.', 'fixture'), 'r11-b');
});

test('a bare id is taken as it is', () => {
  assert.equal(idFromQuery('?fixture=r11-b', 'fixture'), 'r11-b');
  assert.equal(idFromQuery('?room=company_lobby&fixture=r10-a', 'room'), 'company_lobby');
});

test('nothing usable is ignored, never thrown', () => {
  assert.doesNotThrow(() => idFromQuery('?fixture=%E2%80%94', 'fixture'));
  assert.equal(idFromQuery('?fixture=%E2%80%94', 'fixture'), null);
  assert.equal(idFromQuery('?fixture=', 'fixture'), null);
  assert.equal(idFromQuery('', 'fixture'), null);
});
