/**
 * A PERSON DRAWN IN FRONT OF A THING IS WHAT THE POINTER IS ON (errata 330).
 *
 * Tyler, 2026-11-15: "Most spots you point at the Fiddler don't register as being able to interact with the
 * Fiddler. Only when you point at his legs. His upper body and torso and head all should indicate an interaction with
 * the Fiddler." And: "TALK TO THE PIANIST has the tiniest little sliver of an interactable area." Both stand in front
 * of the piano, whose hotspot, a little smaller than either's box, took the pointer over most of them.
 *
 * Held here: over the fiddler's head, chest and legs the pointer finds him, with no verb and with LOOK AT; over the
 * pianist, the same; and a held item meant for the piano still reaches the piano through them (A8).
 */
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer } from '../engine/core/Ambient.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));
const content = await loadContent(fsReader);
const ROOM_3 = String(JSON.parse(await readFile(resolve(ROOT, 'reference/room-03/annotation.json'), 'utf8')).room);

function inRoom3() {
  const state = new GameState(content, new MemoryStorage());
  state.enterRoom(ROOM_3);
  return { state, ambient: new AmbientLayer(state) };
}

// The pianist, by his own file, so this test names no place.
const PIANIST = [...content.ambient.values()].find((one) => one.sprite?.sheet?.endsWith('-pianist.png'))!.id;
for (const who of ['fiddler', PIANIST]) {
  test(`over ${who}'s head, chest and legs, the pointer finds him`, () => {
    const { ambient } = inRoom3();
    const npc = ambient.present.find((one) => one.id === who)!;
    const [hx, hy, hw, hh] = ambient.hitBox(npc);
    for (const share of [0.15, 0.4, 0.75]) {
      const x = Math.round(hx + hw / 2); const y = Math.round(hy + hh * share);
      for (const verb of [null, 'LOOK_AT']) {
        assert.equal(ambient.personAt(x, y, verb)?.id, who, `at ${share} of his height, verb ${verb}`);
      }
    }
  });
}

test('a held item meant for the piano still goes to the piano, through the fiddler (A8)', () => {
  const { state, ambient } = inRoom3();
  const piano = state.findTarget('piano')!;
  const pair = (content.combinations?.pairs ?? []).find((one) => one.target === 'piano')!;
  const fiddler = ambient.present.find((one) => one.id === 'fiddler')!;
  const [hx, hy, hw, hh] = ambient.hitBox(fiddler);
  const x = Math.round(hx + hw / 2); const y = Math.round(hy + hh * 0.4);
  assert.equal(state.targetAt(x, y)?.id, piano.id, 'the piano is behind him there');
  assert.equal(ambient.itemTakerAt(x, y, 'USE', pair.item), undefined, 'and the fork goes to it');
});
