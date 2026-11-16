/**
 * WHAT THE CLARION PROMISES, IT PRINTS (errata 359). After the séance, Frame says the dead man's words will be on
 * the front page within the hour, and Thad tells the Registrar it is in the paper; the headline board, which carries
 * every other edition of the running gag, carried none for it. Proved against the defect: on main before errata 359
 * the board has no edition after E1.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));

test('the headline board prints the séance once it has happened', () => {
  const board = json('content/rooms/clarion.json').hotspots.find((one) => one.id === 'schedule_board');
  const edition = board.responses.LOOK_AT.find((rule) => rule.afterPuzzles?.includes('E1'));
  assert.ok(edition, 'an edition follows E1');
  const promise = JSON.stringify(json('content/dialogue/seance.json'));
  const quoted = /'([A-Z][A-Z ,.!]+)'/.exec(edition.say)?.[1];
  assert.ok(quoted && promise.includes(quoted.replace(/[.,!]$/, '')), `the edition prints the words promised (${quoted})`);
  const flags = new Set(json('content/flags/flags.json').flags.map((flag) => flag.id));
  for (const flag of Object.keys(edition.when ?? {})) assert.ok(flags.has(flag), `${flag} is declared`);
});
