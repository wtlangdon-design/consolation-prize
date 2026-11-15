// THAD KNOWS ONLY WHAT HE HAS BEEN SHOWN (errata 334).
//
// Tyler, 2026-11-15, of the Nugget's patrons: "Thad seems to be saying things about the bar patrons that he couldn't
// possible know when he's just arriving in town. He needs to learn things from other people, not make judgement calls
// of his own based on no info that's been revealed in the game yet." The game-wide sweep that followed found the
// worst case was a spoiler: the Nugget's portrait and the Clarion's "only known likeness of Obadiah Mott" were called
// "a man in Ohio" from the first hour, before Fanshawe's drawer of stock portraits (C4) shows that Mott's face was never
// known.
//
// Held here: no description outside the photographer's studio (where the photographer says so himself) and the
// Company's vault (after C4) calls the portrait a man in Ohio, unless its rule is gated on C4's flag.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ROOT = new URL('../', import.meta.url);
const manifest = JSON.parse(readFileSync(new URL('content/manifest.json', ROOT), 'utf8'));
const WHERE_IT_IS_SAID = new Set(['photographers_studio', 'company_vault']);
const KNOWN = 'T_MOTT_FACE_UNKNOWN';

export function spoilers(rooms) {
  const found = [];
  for (const room of rooms) {
    if (WHERE_IT_IS_SAID.has(room.id) || room.fixture) continue;
    for (const spot of [...(room.hotspots ?? []), ...(room.exits ?? [])]) {
      for (const [verb, rules] of Object.entries(spot.responses ?? {})) {
        for (const rule of rules) {
          const said = [rule.say, ...(rule.repeat ?? []), ...(rule.then ?? [])].filter((one) => typeof one === 'string').join(' ');
          if (/\bOhio\b/.test(said) && !(rule.when && KNOWN in rule.when)) found.push(`${room.id}/${spot.id} ${verb}: ${said.slice(0, 80)}`);
        }
      }
      for (const [verb, line] of Object.entries(spot.overrides ?? {})) {
        if (typeof line === 'string' && /\bOhio\b/.test(line)) found.push(`${room.id}/${spot.id} ${verb}: ${line.slice(0, 80)}`);
      }
    }
  }
  return found;
}

test('nobody calls the Mott likeness a man in Ohio before C4 shows it', () => {
  const rooms = manifest.rooms.filter((path) => !path.includes('candidate')).map((path) => JSON.parse(readFileSync(new URL(path, ROOT), 'utf8')));
  assert.ok(rooms.length > 40);
  assert.deepEqual(spoilers(rooms), []);
});

test('the check catches the line the sweep found', () => {
  const room = { id: 'x', hotspots: [{ id: 'portrait', responses: { LISTEN_TO: [{ say: 'Silent.', repeat: ["Nothing. He's a man in Ohio, and nobody here is asking him."] }] } }] };
  assert.equal(spoilers([room]).length, 1);
});
