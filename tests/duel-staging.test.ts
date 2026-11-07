import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer, figureSpeaking } from '../engine/core/Ambient.ts';
import { framesOf } from '../engine/core/ActedDirections.ts';
import { DuelSession, type AssayLine } from '../engine/core/Assay.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';

// PLAYS: F4

/**
 * THE DUELS AS STAGED (errata 131). The duel audit and the bookends audit
 * found that the words were right and the stage was not: the ring's mutter
 * came from nobody at the top of the frame; Duel Three's Fanshawe and Sowerby
 * spoke from the street's left edge, because their lines were written under
 * ids that belonged to figures in other rooms; and the climax was "just the
 * next line" -- no silence, no eruption, the hat printed as text, and everyone
 * left standing frozen afterwards.
 */

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

/** The game in a duel's room with its Assay sitting: Room 4 from r4-a, Main Street on the visit Fanshawe calls Duel Three. */
async function inDuelRoom(duelId: string) {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  if (duelId === 'duel_three') {
    assert.ok(state.applyFixture(content.fixtures.get('r2-f4')!));
    state.enterRoom('main_street');
    assert.equal(state.flags.get('T_DUEL_CROWD'), true, 'the duel crowd is out');
  } else {
    assert.ok(state.applyFixture(content.fixtures.get('r4-a')!));
    state.flags.set('T_DUEL_ONE_LOST', true);
  }
  const layer = new AmbientLayer(state);
  layer.arrived();
  return { content, state, layer };
}

/** Every line a duel can say, by whom. */
function everyLine(duel: NonNullable<Awaited<ReturnType<typeof loadContent>>['assay']>['duels'][string],
  bystander: string, pencil: string | undefined): AssayLine[] {
  return [
    ...(duel.opening ?? []), ...(duel.win ?? []), ...(duel.loss ?? []), ...(duel.rethrow ?? []),
    ...Object.values(duel.notebook ?? {}),
    { speaker: duel.opponent, line: 'boast' },
    // The ring mutters only in a duel that teaches (errata 73 D, 130 A).
    ...(duel.learns?.length || duel.learnsByLosing ? [{ speaker: bystander, line: 'mutter' }] : []),
    ...(pencil ? [{ speaker: pencil, line: '', mark: true }] : []),
  ];
}

test('every voice in every duel comes from somebody in the duel\'s room (doc 30 section 3.1; errata 131 A, C)', async () => {
  // Found by the duel audit: the ring's mutter fell back to the top of the
  // frame, and Duel Three's lines hung over Fanshawe's office and the back
  // room, clamped to Main Street's left edge.
  for (const duelId of ['duel_one', 'duel_two', 'duel_three']) {
    const { content, state, layer } = await inDuelRoom(duelId);
    const assay = content.assay!;
    const duel = assay.duels[duelId]!;
    for (const line of everyLine(duel, assay.bystander, assay.pencil)) {
      if (line.rest !== undefined && !line.mark) continue;
      const speaker = line.speaker;
      if (speaker === content.actor.id) continue;
      const figure = figureSpeaking(layer.present, speaker);
      const voice = state.room.voices?.[speaker];
      assert.ok(figure || voice, `${duelId} in ${state.room.id}: "${speaker}" speaks and stands nowhere here`);
    }
  }
});

test('the pencil\'s holder has a frame to write the point down in (doc 45 U-ASSAY-PENCIL; errata 130 B, 131 B)', async () => {
  for (const duelId of ['duel_one', 'duel_three']) {
    const { content, layer } = await inDuelRoom(duelId);
    const holder = figureSpeaking(layer.present, content.assay!.pencil ?? null);
    assert.ok(holder?.sprite?.markFrame !== undefined, `${duelId}: the pencil's holder has no mark frame`);
    assert.ok(holder!.sprite!.markFrame! < holder!.sprite!.frames.length);
  }
});

test('the pencil\'s holder reads the handbill before Duel Three, as before every match (doc 03 Part One; errata 131 D)', async () => {
  const content = await loadContent(fsReader);
  const assay = content.assay!;
  const three = assay.duels['duel_three']!.opening!.map((line) => line.line);
  for (const rule of assay.duels['duel_one']!.opening!) assert.ok(three.includes(rule.line), `Duel Three skips "${rule.line}"`);
});

test('Duel Three\'s release is staged: the silence, the pencil, the verdict, the street erupting, the hat performed (doc 03; errata 131 B, D, E)', async () => {
  // Found by the bookends audit: Sowerby followed the truth on the next click,
  // nothing erupted, and "(He puts on his hat.)" was printed over Fanshawe.
  const { content, layer } = await inDuelRoom('duel_three');
  const assay = content.assay!;
  const duel = new DuelSession(assay, 'duel_three', new Set([4, 9, 22, 23, 24]));
  let choice;
  for (let n = 0; n < 5; n += 1) choice = duel.commit('right');
  assert.equal(choice!.outcome, 'won');
  const [silence, mark, verdict, ...after] = choice!.lines;
  assert.ok(silence!.rest! >= 2 && silence!.quiet, 'a long held silence, the music cut, before the verdict');
  assert.ok(mark!.mark, 'the pencil goes down in it');
  assert.equal(verdict!.speaker, assay.pencil, 'the verdict is the pencil holder\'s');
  assert.equal(after[0]!.cue, 'F4-ERUPTS', 'the street erupts as the verdict lands');
  assert.ok(content.sounds?.cues['F4-ERUPTS']?.play?.length, 'and the eruption has a sound');
  const stirs = layer.present.filter((npc) => npc.stirsOn?.includes('F4-ERUPTS'));
  assert.ok(stirs.length >= 2, 'and the crowd moves with it');
  for (const npc of stirs) assert.ok((npc.sprite?.frames.length ?? 0) > 2, `${npc.id} has no break poses to stir in`);
  for (const line of choice!.lines.filter((one) => one.direction)) {
    const figure = figureSpeaking(layer.present, line.speaker);
    const act = figure?.sprite?.performs?.[line.line];
    assert.ok(act, `"${line.line}" is printed, not performed, by ${line.speaker}`);
    assert.ok(framesOf(act!).every((frame) => frame < figure!.sprite!.frames.length) && act!.seconds > 0);
  }
});

test('after the hat, the crowd and the judges go, fading, and the opponent\'s door closes off the frame (doc 03; errata 131 F)', async () => {
  // Found by the bookends audit: after "Well played", Fanshawe, the judges,
  // Sowerby and the town stood frozen, and the player was handed the panel
  // among statues. They have no walk (errata 99 N), and nobody vanishes.
  const { content, state, layer } = await inDuelRoom('duel_three');
  const cast = layer.present.filter((npc) => (npc.when as Record<string, unknown> | undefined)?.T_DUEL_CROWD === true);
  assert.ok(cast.length >= 5, 'the opponent, the pencil, the judges and the town are out');
  for (const npc of cast) assert.ok(npc.exit || npc.leaves, `${npc.id} would stand frozen after the duel`);
  layer.noteDepartures(100);
  state.flags.set('T_FANSHAWE_BEATEN', true);
  layer.noteDepartures(100.01);
  const fade = Math.max(...cast.map((npc) => npc.leaves?.fade ?? 0));
  layer.noteDepartures(100.01 + fade / 2);
  for (const npc of cast.filter((one) => one.leaves)) {
    assert.ok(layer.present.some((one) => one.id === npc.id), `${npc.id} vanished instead of fading`);
    const opacity = layer.opacity(npc.id);
    assert.ok(opacity > 0 && opacity < 1, `${npc.id} is not fading (${opacity})`);
  }
  assert.deepEqual(layer.takeCues(), [], 'nothing sounds until he has gone');
  layer.noteDepartures(100.02 + fade);
  layer.noteDepartures(100.03 + fade);
  for (const npc of cast.filter((one) => one.leaves)) {
    assert.ok(!layer.present.some((one) => one.id === npc.id), `${npc.id} is still there`);
  }
  const owed = layer.takeCues();
  assert.ok(owed.includes('F4-DOOR'), 'the door closes behind the opponent');
  assert.ok(content.sounds?.cues['F4-DOOR']?.play?.length, 'and the door has a sound');
  layer.noteDepartures(100.04 + fade);
  assert.deepEqual(layer.takeCues(), [], 'once');
});
