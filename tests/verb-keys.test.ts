import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

/**
 * EVERY VERB HAS A KEY, AND THE KEYS ARE THE PANEL (errata 252; doc 122). The left hand's three rows of three are the
 * panel's three rows of three, as the first Monkey Island laid them out, so a player on a trackpad need not cross the
 * screen to change verb. Held here: each verb has one letter, no two share one, the letters sit on the keyboard where
 * the buttons sit on the panel, and no key is named in the scene's code.
 */
const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const verbs = JSON.parse(readFileSync(resolve(ROOT, 'content/ui/verbs.json'), 'utf8')) as
  { grid: { cols: number; rows: number }; verbs: { id: string; col: number; row: number; key?: string }[] };
const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

test('each verb has a key of its own', () => {
  const seen = new Map<string, string>();
  for (const verb of verbs.verbs) {
    assert.match(verb.key ?? '', /^[A-Z]$/, `${verb.id} has no key`);
    assert.equal(seen.get(verb.key!), undefined, `${verb.id} and ${seen.get(verb.key!)} share ${verb.key}`);
    seen.set(verb.key!, verb.id);
  }
});

test('the keys lie on the keyboard as the buttons lie on the panel', () => {
  for (const verb of verbs.verbs) {
    assert.equal(ROWS[verb.row]?.[verb.col], verb.key, `${verb.id} is at column ${verb.col}, row ${verb.row} of the panel`);
  }
});

test('no verb key is named in the scene', () => {
  const scene = readFileSync(resolve(ROOT, 'engine/scenes/GameScene.ts'), 'utf8');
  const handler = scene.slice(scene.indexOf('private onVerbKey'), scene.indexOf('private onModifiedKey'));
  assert.ok(handler.includes('one.key'), 'the scene reads the key from the verb');
  assert.doesNotMatch(handler, /'[A-Z]'/, 'a key is written into the scene');
  // And it does not answer where a click on the panel would not: the panel away, the menu, a conversation.
  for (const guard of ['panelHidden', 'menu.isOpen', 'dialogue.isActive']) assert.ok(handler.includes(guard), `a verb key is taken with ${guard}`);
});
