// HE STAYS SIDE-ON FOR THE WHOLE CONVERSATION (errata 331).
//
// Errata 330 turned Thad left or right toward whoever he talks to as the conversation opened (Tyler, 2026-11-15, of
// the one-strike man: "It's awkward for him to stand here with his back to the game player while he talks to him").
// A second turn, as the menu came up after the opening line, still went by the larger axis, so anyone higher up the
// screen than Thad -- the barman behind his counter -- was talked to over Thad's shoulder blades once the options
// showed. Seen in the build while staging the barman.
//
// Held here: every turn toward a talker goes through one method, `turnToTalk`, so the greeting and the menu cannot
// disagree; and that method turns him side-on when the talker is off to one side.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const scene = readFileSync(new URL('../engine/scenes/GameScene.ts', import.meta.url), 'utf8');
const method = (() => {
  const from = scene.indexOf('  private turnToTalk(');
  assert.ok(from >= 0, 'GameScene has turnToTalk');
  return scene.slice(from, scene.indexOf('\n  }\n', from) + 4);
})();

test('the conversation turns him through turnToTalk, as it opens and as its menu does', () => {
  const opens = scene.slice(scene.indexOf('if (this.pendingTree && !this.actor.isWalking)'), scene.indexOf('this.state.dialogue.start(tree);'));
  assert.ok(opens.length > 0, 'the conversation-opening block is where it was');
  assert.equal((opens.match(/turnToTalk\(/g) ?? []).length, 2, 'once for the greeting, once for the menu');
  assert.ok(!/faceToward\(/.test(opens), 'no turn by the larger axis between the greeting and the menu');
});

test('turnToTalk turns him side-on to a talker off to one side', () => {
  assert.match(method, /setFacing\(declared\.facing\)/, 'an authored stand says which way');
  assert.match(method, /Math\.abs\(at\.x - this\.actor\.x\) >= SIDE_ON[\s\S]*setFacing\(at\.x < this\.actor\.x \? 'left' : 'right'\)/, 'left or right toward them');
  assert.equal(scene.split('this.actor.faceToward(at.x, at.y)').length - 1, 1, 'and the larger axis only inside it, for someone straight above or below');
});
