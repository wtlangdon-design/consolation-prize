import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { AmbientLayer } from '../engine/core/Ambient.ts';
import { loadContent, type JsonReader } from '../engine/core/ContentLoader.ts';
import { GameState } from '../engine/core/GameState.ts';
import { MemoryStorage } from '../engine/core/SaveManager.ts';
// @ts-expect-error -- a plain .mjs module with no declarations; it reads 8-bit RGBA PNGs.
import { readPng } from '../tools/lib/png.mjs';

/**
 * WHAT PLAYING FOUND, HELD MECHANICALLY (2026-11-01).
 *
 * Every defect below shipped past a green suite and was found by Tyler
 * playing, or by a review, and each test here would have failed on it. They
 * read the data the next thirty rooms will be built from, so a room that
 * repeats one fails the build rather than the playthrough. Doc 55 section 8
 * lists them with the ones no script can judge.
 */
const ROOT = resolve(fileURLToPath(new URL('../', import.meta.url)));
const read = (path: string) => JSON.parse(readFileSync(resolve(ROOT, path), 'utf8'));
const fsReader: JsonReader = async (path) => JSON.parse(await readFile(resolve(ROOT, path), 'utf8'));

// The rooms the build ledger calls built, by their annotation's room id and number.
const ledger = read('content/build-ledger.json') as { items: { id: string; kind: string; status: string }[] };
const builtNumbers = ledger.items
  .filter((item) => item.kind === 'room' && ['built', 'proven', 'accepted'].includes(item.status))
  .map((item) => Number(/^room-(\d\d)-/.exec(item.id)?.[1]))
  .filter((n) => Number.isFinite(n));
const builtIds = builtNumbers
  .map((n) => `reference/room-${String(n).padStart(2, '0')}/annotation.json`)
  .filter((path) => existsSync(resolve(ROOT, path)))
  .map((path) => read(path).room as string);

/* ---- 1. Nobody vanishes, nobody pops in ---------------------------------- */

test('a character whose condition ends while the player watches stays, unless he can walk out (Tyler: never just disappear)', async () => {
  const content = await loadContent(fsReader);
  for (const fixture of content.fixtures.values()) {
    const state = new GameState(content, new MemoryStorage());
    state.applyFixture(fixture);
    const layer = new AmbientLayer(state);
    layer.arrived();
    const before = layer.present;
    // Every flag any present character's condition names, turned the other way.
    for (const npc of before) {
      for (const [flag, value] of Object.entries(npc.placements?.[state.roomId]?.when ?? npc.when ?? {})) {
        if (typeof value === 'boolean') state.flags.set(flag, !value);
      }
    }
    const after = layer.present.map((npc) => npc.id);
    for (const npc of before) {
      if (npc.exit) continue;
      assert.ok(after.includes(npc.id), `${fixture.id}: ${npc.id} vanished in front of the player -- give him an exit walk or let him stay`);
    }
    // And once he has left and come back, the room is as the conditions say.
    layer.arrived();
    const live = layer.present.map((npc) => npc.id);
    for (const npc of before) {
      if (!state.flags.test(npc.placements?.[state.roomId]?.when ?? npc.when)) {
        assert.ok(!live.includes(npc.id), `${fixture.id}: ${npc.id} is still here after the player came back`);
      }
    }
  }
});

/* ---- 2. Every item the game can hand over is a real item ----------------- */

test('every item content can grant, require or yield is in the manifest and has an icon', () => {
  const manifest = read('content/manifest.json') as { items: string[] };
  const items = new Map(manifest.items.map((path) => { const item = read(path); return [item.id as string, item]; }));
  const icons = read('content/ui/item-icons.json').icons as Record<string, unknown>;
  const referenced = new Map<string, string>();
  const note = (id: unknown, where: string) => { if (typeof id === 'string') referenced.set(id, where); };
  const combinations = read('content/combinations.json');
  for (const pair of combinations.pairs) {
    note(pair.item, `combination ${pair.item} on ${pair.target}`);
    for (const rule of pair.rules ?? []) {
      for (const id of [...(rule.items ?? []), ...(rule.holds ?? [])]) note(id, `combination ${pair.item} on ${pair.target}`);
    }
  }
  const assay = read('content/assay/assay.json');
  for (const [duel, spec] of Object.entries(assay.duels as Record<string, { yields?: string[] }>)) {
    for (const id of spec.yields ?? []) note(id, `assay ${duel} yields`);
  }
  for (const path of read('content/manifest.json').rooms as string[]) {
    const room = read(path);
    for (const target of [...(room.hotspots ?? []), ...(room.exits ?? [])]) {
      note(target.item, `${room.id}/${target.id} item`);
      for (const rules of Object.values((target.responses ?? {}) as Record<string, { items?: string[] }[]>)) {
        for (const rule of rules) for (const id of rule.items ?? []) note(id, `${room.id}/${target.id} gives`);
      }
    }
  }
  for (const path of (read('content/manifest.json').fixtures ?? []) as string[]) {
    const file = read(path);
    for (const fixture of (file.fixtures ?? [file]) as { id: string; inventory?: string[] }[]) {
      for (const id of fixture.inventory ?? []) note(id, `fixture ${fixture.id}`);
    }
  }
  // AND WHAT A CONVERSATION OR AN ARRIVAL HANDS OVER (doc 57 C6, E0, E4, D4,
  // D6): Document B, the death certificate, the certificate and the
  // attestation were given by dialogue and by arrival scenes, which this test
  // did not read, and none of them was a loaded item.
  for (const path of read('content/manifest.json').dialogue as string[]) {
    const tree = read(path);
    for (const node of Object.values((tree.nodes ?? {}) as Record<string, { onOpen?: { gives?: string[] }; options?: { gives?: string[]; holds?: string[] }[] }>)) {
      for (const id of node.onOpen?.gives ?? []) note(id, `${tree.id} opening gives`);
      for (const option of node.options ?? []) {
        for (const id of [...(option.gives ?? []), ...(option.holds ?? [])]) note(id, `${tree.id} option`);
      }
    }
  }
  for (const path of read('content/manifest.json').rooms as string[]) {
    const room = read(path);
    for (const scene of (room.onEnter?.scenes ?? []) as { after?: { gives?: string[] } }[]) {
      for (const id of scene.after?.gives ?? []) note(id, `${room.id} arrival scene gives`);
    }
    for (const target of [...(room.hotspots ?? []), ...(room.exits ?? [])]) {
      for (const rules of Object.values((target.responses ?? {}) as Record<string, { grants?: string[] }[]>)) {
        for (const rule of rules) for (const id of rule.grants ?? []) note(id, `${room.id}/${target.id} grants`);
      }
    }
  }
  const missing = [...referenced].filter(([id]) => !items.has(id)).map(([id, where]) => `${id} (${where})`);
  assert.deepEqual(missing, [], 'items content hands over that the game does not load -- add them to the manifest');
  const noIcon = [...items.values()].filter((item) => !item.fixture && !icons[item.id]).map((item) => item.id);
  assert.deepEqual(noIcon, [], 'items with no icon -- draw one in tools/pixelart/item_icons.py');
});

test('an item doc 23 holds "from the start" is carried before anything happens', async () => {
  const content = await loadContent(fsReader);
  const state = new GameState(content, new MemoryStorage());
  for (const item of content.items.values()) {
    if (!/Held from the start/.test(item.note ?? '')) continue;
    assert.ok(state.carried.includes(item.id), `${item.id} says it is held from the start and is not carried in a new game`);
  }
});

/* ---- 3. A figure is one whole figure ------------------------------------- */

/** A sheet cut from the locked cast master on magenta: its provenance spec says derivedFrom master-02. */
const keyedFromMaster = (sprite: { provenance?: string } | undefined) => {
  const spec = sprite?.provenance;
  if (!spec?.endsWith('.spec.json')) return false;
  try { return (read(spec) as { derivedFrom?: string }).derivedFrom === 'art/staging/cast-master/master-02.png'; } catch { return false; }
};

test('every talking character in a built room is drawn whole: one piece, no holes', () => {
  const manifest = read('content/manifest.json') as { ambient: string[] };
  const faults: string[] = [];
  for (const path of manifest.ambient) {
    const npc = read(path);
    const placements = [{ room: npc.room, sprite: npc.sprite, posture: npc.posture },
      ...Object.entries(npc.placements ?? {}).map(([room, at]) => {
        const placed = at as { sprite?: unknown; posture?: string };
        return { room, sprite: placed.sprite ?? npc.sprite, posture: placed.posture ?? npc.posture };
      })];
    for (const { room, sprite, posture } of placements) {
      const declared = sprite as { sheet: string; frames: [number, number, number, number][]; provenance?: string } | undefined;
      if (!npc.tree || posture !== 'standing' || !builtIds.includes(room) || !declared?.frames?.length) continue;
      const image = readPng(readFileSync(resolve(ROOT, declared.sheet)));
      for (const [index, [sx, sy, w, h]] of declared.frames.entries()) {
        const on = (x: number, y: number) => image.pixels[((sy + y) * image.width + sx + x) * 4 + 3] > 0;
        // Pieces: the largest 4-connected run of opaque pixels against all of them.
        const seen = new Uint8Array(w * h);
        let total = 0; let largest = 0;
        for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
          if (!on(x, y) || seen[y * w + x]) continue;
          let size = 0; const stack = [[x, y]]; seen[y * w + x] = 1;
          while (stack.length) {
            const [cx, cy] = stack.pop() as [number, number];
            size += 1;
            for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
              if (nx! < 0 || ny! < 0 || nx! >= w || ny! >= h || seen[ny! * w + nx!] || !on(nx!, ny!)) continue;
              seen[ny! * w + nx!] = 1; stack.push([nx!, ny!]);
            }
          }
          total += size; largest = Math.max(largest, size);
        }
        // Holes: transparent pixels the outside cannot reach.
        const outside = new Uint8Array(w * h);
        const stack: number[][] = [];
        for (let x = 0; x < w; x += 1) { stack.push([x, 0], [x, h - 1]); }
        for (let y = 0; y < h; y += 1) { stack.push([0, y], [w - 1, y]); }
        while (stack.length) {
          const [x, y] = stack.pop()!;
          if (x! < 0 || y! < 0 || x! >= w || y! >= h || outside[y! * w + x!] || on(x!, y!)) continue;
          outside[y! * w + x!] = 1;
          stack.push([x! + 1, y!], [x! - 1, y!], [x!, y! + 1], [x!, y! - 1]);
        }
        // A GAP CLOSED OFF ONLY BY SOMETHING THIN IS NOT A HOLE. A rake held
        // against him closes off the ground between its handle, its head and
        // his boots, and the air between his arm and his body (Room 25,
        // Pratt). Thin parts -- a handle, a strap, tines, up to about 14 px --
        // are opened away, and a gap that then reaches the outside was seen
        // through a held thing. A coat keyed out with the wall is walled in by
        // the body itself and is still counted (a 30 px patch keyed out of
        // Pratt's shirt counts in full).
        const THIN = 7;
        let thick = new Uint8Array(w * h);
        for (let i = 0; i < w * h; i += 1) thick[i] = on(i % w, Math.floor(i / w)) ? 1 : 0;
        const step = (from: Uint8Array, grow: boolean) => {
          const to = new Uint8Array(w * h);
          for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
            const i = y * w + x;
            const near = [x > 0 ? from[i - 1]! : 0, x < w - 1 ? from[i + 1]! : 0, y > 0 ? from[i - w]! : 0, y < h - 1 ? from[i + w]! : 0];
            to[i] = grow ? (from[i] || near.some(Boolean) ? 1 : 0) : (from[i] && near.every(Boolean) ? 1 : 0);
          }
          return to;
        };
        for (let n = 0; n < THIN; n += 1) thick = step(thick, false);
        for (let n = 0; n < THIN; n += 1) thick = step(thick, true);
        const open = new Uint8Array(w * h);
        const fill: number[] = [];
        for (let x = 0; x < w; x += 1) fill.push(x, (h - 1) * w + x);
        for (let y = 0; y < h; y += 1) fill.push(y * w, y * w + w - 1);
        while (fill.length) {
          const i = fill.pop()!;
          if (open[i] || thick[i]) continue;
          open[i] = 1;
          const x = i % w;
          if (x > 0) fill.push(i - 1);
          if (x < w - 1) fill.push(i + 1);
          if (i >= w) fill.push(i - w);
          if (i < w * (h - 1)) fill.push(i + w);
        }
        let holes = 0;
        for (let i = 0; i < w * h; i += 1) if (!outside[i] && !on(i % w, Math.floor(i / w)) && !open[i]) holes += 1;
        if (largest < total * 0.97) faults.push(`${npc.id} in ${room}, frame ${index}: in pieces (${((1 - largest / total) * 100).toFixed(1)}% apart from the body)`);
        // An arm raised to a hat encloses a little floor (Vessel's frame 3: 0.6%);
        // a coat that keyed out with the wall behind it is several percent.
        // A FIGURE KEYED OFF MAGENTA FROM THE CAST MASTER (errata 111) can only
        // have a hole where its drawing had backdrop -- the air between
        // Fanshawe's raised arm and his face as he tips his hat (2.4%) -- which
        // is this test's own remedy; its pieces are still counted, and a keyed
        // coat is failed by tests/master-cut-edges.test.mjs.
        if (holes > total * 0.02 && !keyedFromMaster(declared)) faults.push(`${npc.id} in ${room}, frame ${index}: ${holes} px of holes`);
      }
    }
  }
  assert.deepEqual(faults, [], 'a cut figure carries holes or loose pieces -- generate him whole on magenta and key him (doc 55 section 8)');
});

/* ---- 3b. An act line the documents write reaches its room ---------------- */

test('every act line the examine extraction carries is compiled into its built room', () => {
  // Doc 54's merge carries Part Two-B's lines on a merged subject (`acts`);
  // the compiler never read them, and THE SITE's Act IV line and THE CLAIM
  // MARKER's compiled to nothing (errata 99 F).
  const missing: string[] = [];
  for (const name of readdirSync(resolve(ROOT, 'content/examine')).filter((one) => /^room-\d+\.json$/.test(one))) {
    const sources = resolve(ROOT, `proofs/readiness/${name.replace('.json', '.sources.json')}`);
    if (!existsSync(sources)) continue;
    const roomFile = read(`proofs/readiness/${name.replace('.json', '.sources.json')}`).roomFile as string | null;
    if (!roomFile || !existsSync(resolve(ROOT, roomFile))) continue;
    const room = readFileSync(resolve(ROOT, roomFile), 'utf8');
    for (const subject of (read(`content/examine/${name}`).subjects ?? []) as { name: string; acts?: Record<string, unknown>[] }[]) {
      for (const act of subject.acts ?? []) {
        for (const verb of ['LOOK_AT', 'LISTEN_TO']) {
          const line = (act[verb] as string[] | undefined)?.[0];
          // Its opening, not the whole: a long line is split into utterances.
          if (line && !room.includes(JSON.stringify(line.slice(0, 32)).slice(1, -1))) missing.push(`${roomFile}: ${subject.name} act ${String(act.act)} ${verb}`);
        }
      }
    }
  }
  assert.deepEqual(missing, [], 'an act line the documents write is not in its room');
});

/* ---- 4. A puzzle the game waits on can be completed ------------------------ */

const puzzles = read('proofs/readiness/puzzles.json').puzzles as Record<string, { rooms: number[] }>;
const contentFiles = (dir: string): string[] => readdirSync(resolve(ROOT, dir), { withFileTypes: true })
  .flatMap((entry) => entry.isDirectory() ? contentFiles(`${dir}/${entry.name}`)
    : entry.name.endsWith('.json') ? [`${dir}/${entry.name}`] : []);

test('every puzzle content waits on can be completed by content, once its rooms are built', () => {
  const waited = new Map<string, string>();
  const completed = new Set<string>();
  const walk = (node: unknown, file: string, key = ''): void => {
    if (Array.isArray(node)) { for (const item of node) walk(item, file, key); return; }
    if (!node || typeof node !== 'object') return;
    const object = node as Record<string, unknown>;
    for (const [k, v] of Object.entries(object)) {
      if (k === 'requiresPuzzles' && Array.isArray(v)) for (const id of v) waited.set(String(id), file);
      if (k === 'completes' && typeof v === 'string') completed.add(v);
      if (k === 'puzzle' && v && typeof v === 'object') {
        for (const [id, status] of Object.entries(v)) if (status === 'complete') completed.add(id);
      }
      walk(v, file, k);
    }
    // A dialogue entry gated on a puzzle, and a rephrase that waits for one.
    if (typeof object.puzzle === 'string' && typeof object.node === 'string') waited.set(object.puzzle, file);
    if (key === 'rephrase' && typeof object.after === 'string') waited.set(object.after, file);
  };
  for (const file of contentFiles('content').filter((path) => !path.includes('/fixtures/'))) walk(read(file), file);
  // The duel runner completes each duel's puzzle when it is fought.
  for (const spec of Object.values(read('content/assay/assay.json').duels as Record<string, { puzzle?: string }>)) {
    if (spec.puzzle) completed.add(spec.puzzle);
  }
  const unbuilt = (id: string) => (puzzles[id]?.rooms ?? []).some((n) => !builtNumbers.includes(n));
  const stuck = [...waited].filter(([id]) => !completed.has(id) && !unbuilt(id)).map(([id, file]) => `${id} (waited on in ${file})`);
  assert.deepEqual(stuck, [], 'content waits on a puzzle nothing completes, in rooms that are all built -- a gate that never opens');
});

/* ---- 5. Every puzzle in a built room is played by a test ------------------ */

test('every puzzle sited wholly in built rooms is played by a test, or says why not', () => {
  const declared = new Map<string, string>();
  for (const name of readdirSync(resolve(ROOT, 'tests')).filter((file) => /\.test\.(ts|mjs)$/.test(file))) {
    const source = readFileSync(resolve(ROOT, 'tests', name), 'utf8');
    for (const match of source.matchAll(/^\/\/ PLAYS: (.+)$/gm)) {
      for (const id of match[1]!.split(/[\s,]+/).filter(Boolean)) declared.set(id, name);
    }
  }
  const pending = read('proofs/played-pending.json').puzzles as Record<string, string>;
  const due = Object.entries(puzzles)
    .filter(([, spec]) => spec.rooms.length && spec.rooms.every((n) => builtNumbers.includes(n)))
    .map(([id]) => id);
  const unplayed = due.filter((id) => !declared.has(id) && !pending[id]);
  assert.deepEqual(unplayed, [], 'puzzles whose rooms are built and that no test plays -- write the test (// PLAYS: id) '
    + 'or record why it cannot be played yet in proofs/played-pending.json');
  for (const id of Object.keys(pending)) {
    assert.ok(!declared.has(id), `${id} is played by ${declared.get(id)} -- take it out of proofs/played-pending.json`);
  }
});

/* ---- A figure whose only words are barks is heard where one talks to it --- */

// Errata 188: the woman at the hole in Act IV has one line and no tree. Her
// stand for TALK TO was 200 px from her and her bark fired inside 120, so the
// player walked up, stood in front of her, and she said nothing. A figure with
// no tree speaks only through its barks: its radius takes in its own stand.
test('a figure with barks and no tree says them where the player stands to talk to it', () => {
  const manifest = read('content/manifest.json') as { ambient: string[] };
  const misses: string[] = [];
  for (const path of manifest.ambient) {
    const npc = read(path);
    if (npc.tree || !npc.walkTo) continue;
    if (!Object.values(npc.barks ?? {}).some((line) => line)) continue;
    const gap = Math.hypot(npc.walkTo.x - npc.x, npc.walkTo.y - npc.y);
    if (gap > (npc.approachRadius ?? 0)) {
      misses.push(`${npc.id}: its stand is ${Math.round(gap)} px off and its barks fire inside ${npc.approachRadius ?? 0}`);
    }
  }
  assert.deepEqual(misses, []);
});

/* ---- A prop in front of a figure paints only its objects over him ---------- */

// Errata 194 (Tyler, of the dinner: "the other guy's shoulder is partially missing behind the candle"). A prop
// cut from a plate keeps the plate's own pixels around its objects -- the wall lit by the candles -- and drawn
// in front of the man behind it, that wall cut his shoulders away. Where a prop overlaps a figure drawn behind
// it, its pixels must be its objects: no more than a handful may be the plate itself (within 75, and dark).
test('no prop paints the plate over a figure behind it', () => {
  const manifest = read('content/manifest.json') as { rooms: string[]; ambient: string[] };
  const ambient = manifest.ambient.map((path) => read(path)) as { id: string; room: string; x: number; y: number;
    sprite?: { sheet: string; frames: number[][]; figureHeight?: number }; spriteWhen?: { sprite: { sheet?: string; frames?: number[][] } }[] }[];
  const misses: string[] = [];
  for (const path of manifest.rooms) {
    const room = read(path) as { id: string; background: string; props?: { id: string; sheet: string; x: number; y: number; frame: number[] }[] };
    if (!room.props?.length || !existsSync(resolve(ROOT, room.background))) continue;
    const plate = readPng(readFileSync(resolve(ROOT, room.background)));
    for (const prop of room.props) {
      const img = readPng(readFileSync(resolve(ROOT, prop.sheet)));
      const [fx, fy, fw, fh] = prop.frame as [number, number, number, number];
      const px0 = Math.round(prop.x - fw / 2); const py0 = prop.y - fh;
      for (const npc of ambient.filter((one) => one.room === room.id && one.sprite && !one.sprite.figureHeight && one.y < prop.y)) {
        // The frames he shows WHILE this prop is drawn: the sheet a `spriteWhen` gives under the prop's own
        // condition, else his own.
        const during = (npc.spriteWhen ?? []).find((v) => JSON.stringify((v as { when?: unknown }).when) === JSON.stringify((prop as { when?: unknown }).when));
        for (const sprite of [during ? { ...npc.sprite!, ...during.sprite } : npc.sprite!]) {
          const [sx, sy, w, h] = sprite.frames![0]! as unknown as [number, number, number, number];
          const art = readPng(readFileSync(resolve(ROOT, sprite.sheet!)));
          const box: [number, number, number, number] = [Math.round(npc.x - w / 2), npc.y - h, Math.round(npc.x + w / 2), npc.y];
          let painted = 0;
          for (let y = Math.max(box[1], py0); y < Math.min(box[3], py0 + fh); y += 1) {
            for (let x = Math.max(box[0], px0); x < Math.min(box[2], px0 + fw); x += 1) {
              const i = ((fy + y - py0) * img.width + fx + x - px0) * 4;
              if (img.pixels[i + 3] < 128) continue;
              // Only where he is drawn: a prop over the empty corners of his frame hides nothing of him.
              if (art.pixels[((sy + y - box[1]) * art.width + sx + x - box[0]) * 4 + 3]! < 128) continue;
              const j = (y * plate.width + x) * 4;
              const diff = Math.abs(img.pixels[i] - plate.pixels[j]) + Math.abs(img.pixels[i + 1] - plate.pixels[j + 1]) + Math.abs(img.pixels[i + 2] - plate.pixels[j + 2]);
              const lum = 0.3 * img.pixels[i] + 0.59 * img.pixels[i + 1] + 0.11 * img.pixels[i + 2];
              if (diff < 75 && lum < 120) painted += 1;
            }
          }
          // A dark object in front of him (the wine bottle) can match the dark wall it stands against; the
          // dinner's lit wall was 2864 pixels over him, the bottle and the table's edge are 765.
          if (painted > 1500) misses.push(`${room.id}: ${prop.id} paints ${painted} pixels of the plate over ${npc.id} (${sprite.sheet})`);
        }
      }
    }
  }
  assert.deepEqual(misses, []);
});
