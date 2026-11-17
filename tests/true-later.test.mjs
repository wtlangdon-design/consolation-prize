/**
 * WHAT IS TRUE LATER (errata 357; Tyler, 2026-11-16: "Go"). From the Acts II to IV review and its playtest:
 *
 * 1. No clock time where one was flagged (the archive "closes at four", the coach "at noon").
 * 2. Act II's two dollars are not THE FILING FEE, a fee spent in Act I.
 * 3. A person's look for a later state is reachable: the unconditioned look comes last.
 * 4. A way with nothing to say has a line; Thad arrives clear of a painted man; the street takes him from the
 *    Colonel's rooms at the Colonel's door; the Company's strongbox holds coin, as its lines say.
 *
 * Proved against the defect: each assertion below failed on main before errata 357.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { readPng } from '../tools/lib/png.mjs';

const json = (path) => JSON.parse(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
const room = (name) => json(`content/rooms/${name}.json`);

test('no clock time where one was flagged', () => {
  const all = readdirSync(new URL('../content/rooms/', import.meta.url)).map((name) => readFileSync(new URL(`../content/rooms/${name}`, import.meta.url), 'utf8')).join('')
    + readdirSync(new URL('../content/dialogue/', import.meta.url)).map((name) => readFileSync(new URL(`../content/dialogue/${name}`, import.meta.url), 'utf8')).join('');
  for (const phrase of ['archive closes at four', 'coach is at noon', 'till noon', 'claim contains a raccoon']) assert.ok(!all.toLowerCase().includes(phrase), phrase);
});

test('the two dollars of Act II are called what they are', () => {
  const fee = json('content/items/filing-fee.json');
  assert.deepEqual(fee.shortWhen?.[0]?.when, { T_BORDERS_MOTT: true });
  assert.notEqual(fee.shortWhen[0].short, fee.short);
});

test('a person\'s later look can be reached: the unconditioned look comes last', () => {
  for (const name of readdirSync(new URL('../content/rooms/', import.meta.url))) {
    const data = json(`content/rooms/${name}`);
    for (const [who, verbs] of Object.entries(data.peopleResponses ?? {})) {
      for (const [verb, rules] of Object.entries(verbs)) {
        const first = rules.findIndex((one) => !one.when);
        assert.ok(first === -1 || first === rules.length - 1 || rules.slice(first).every((one) => !one.when), `${data.id} ${who} ${verb}`);
      }
    }
  }
  assert.ok(room('assay-office').peopleResponses.winnie.LOOK_AT.some((one) => one.when?.T_ASSAY_RUN)); // errata 372: after the assay, not the strike
});

test('staging and pictures the playtest found wrong', () => {
  const closed = room('boot-hill').hotspots.find((one) => one.id === 'to_funeral_closed');
  assert.ok(closed.responses.LOOK_AT?.length && closed.responses.LISTEN_TO?.length, 'the closed way answers LOOK and LISTEN');
  const river = room('gulch-river');
  const [x, y, w, h] = river.hotspots.find((one) => one.id === 'rocker').rect;
  for (const e of river.entrances.filter((one) => one.from !== 'upstream')) assert.ok(e.at[0] > x + w + 50 || e.at[1] > y + h + 300, `${e.from} arrives clear of the rocker's man`);
  const street = room('main-street');
  const door = street.entrances.find((one) => one.from === 'company_lobby').at;
  assert.deepEqual(street.entrances.find((one) => one.from === 'fanshawe_office')?.at, door);
  const png = readPng(readFileSync(new URL('../art/backgrounds/room-35-company-vault.png', import.meta.url)));
  let gold = 0;
  for (let yy = 590; yy < 626; yy += 1) for (let xx = 1020; xx < 1135; xx += 1) {
    const i = (yy * png.width + xx) * 4;
    const [r, g, b] = [png.pixels[i], png.pixels[i + 1], png.pixels[i + 2]];
    if (r > 90 && r - b > 45 && g - b > 25) gold += 1;
  }
  assert.ok(gold < 20, `the strongbox holds ${gold} gold pixels`);
});
