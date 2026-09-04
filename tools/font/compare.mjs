#!/usr/bin/env node
/**
 * THE SAME UI STATE, IN THE LIVE GAME, IN EVERY CANDIDATE FACE.
 *
 * Doc 36 Q16 is Tyler's to rule and errata 54 forbids anyone else picking a
 * face. What this produces is the thing the ruling needs and nobody has had: a
 * full frame of the real interface, at the real size, over the real art, in
 * each candidate, with the control beside them.
 *
 * A SPECIMEN SHEET CANNOT ANSWER THIS. The question is not whether a typeface
 * is handsome at 200px on white; it is whether five lines of verbs fit 216
 * rows of panel, whether a sentence line stays readable over mud at night, and
 * whether a spoken line holds up outlined over a lit doorway. Doc 46 part
 * three: render before judging, three times in one evening.
 *
 * TWO STATES, CHOSEN BECAUSE THEY ARE THE TWO SHAPES OF TEXT IN THIS GAME.
 * A dialogue frame -- prompt, four options, a spoken line over the art -- and
 * a play frame -- the sentence line, the verb grid, the inventory. Between
 * them they contain every text surface the interface has.
 *
 * THE SIZE IS MATCHED TO THE BITMAP'S OWN LINE BUDGET, not to a cap height.
 * The 5x7 face packs caps, x-height and descenders into seven rows, so
 * matching cap heights would make every candidate occupy half as much again
 * of a panel that is already tight (Q35 measured five lines at 210 of 216
 * rows). 42px in the play area and 28 in the panel is exactly the vertical
 * budget the layout is built on. Each candidate's MEASURED cap height is
 * printed beside it, because that is the number Tyler will want if he decides
 * they read small.
 *
 * IT VOTES FOR NOTHING. There is no score, no ranking and no recommendation in
 * the output. Four faces and a control, side by side, in the game.
 *
 * Usage: node tools/font/compare.mjs [--out renders/font-candidates]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { browser } from '../lib/chromium.mjs';
import { readJson, ROOT } from '../lib/content.mjs';
import { runRoute } from '../gauntlet/route.mjs';

const PORT = 5196;
const DIR = 'art/ui/fonts/candidates';
const WINDOW = { width: 1920, height: 1080 };

/**
 * The candidates, and the control.
 *
 * FOUR FACES ACROSS THE RANGE A PAINTED ADVENTURE GAME COULD PLAUSIBLY WEAR,
 * chosen for the brief and not for a preference: two humanist sans, one screen
 * slab, one text serif. Every one is SIL Open Font Licence, which is the
 * licence Google Fonts ships them under and which permits embedding and
 * redistribution in a commercial game.
 *
 * NONE IS A PIXEL FACE. Tyler's brief rules out "a novelty 8-bit font", and it
 * is the right call twice over: errata 54 replaced the whole 320x200
 * presentation, and a bitmap face at 1920x1080 either scales up into blocks or
 * sits so small nobody can read it -- which is the defect that voided the 5x7
 * in the first place.
 */
const CANDIDATES = [
  {
    id: 'ibm-plex-sans',
    family: 'IBM Plex Sans',
    weight: '500',
    licence: 'SIL OFL 1.1',
    note: 'HUMANIST SANS, DRAWN FOR SCREENS. The most neutral of the four: open '
      + 'apertures, unambiguous I/l/1, and a 500 weight that holds up outlined over '
      + 'artwork. It brings no period of its own, which is either the safest choice '
      + 'or the dullest one.',
  },
  {
    id: 'alegreya-sans',
    family: 'Alegreya Sans',
    weight: '500',
    licence: 'SIL OFL 1.1',
    note: 'HUMANIST SANS WITH A WRITING HAND IN IT. Slightly calligraphic, warmer '
      + 'than Plex, drawn as a literary companion face -- so it reads as a book '
      + 'rather than an operating system. Narrower, which buys room in the panel.',
  },
  {
    id: 'bitter',
    family: 'Bitter',
    weight: '400',
    licence: 'SIL OFL 1.1',
    note: 'A SCREEN SLAB. Slab serifs are 19th-century American wood type, which is '
      + 'the register of a gold-rush town and of every handbill in it -- and this one '
      + 'was drawn for screen reading rather than for posters, so it stays legible '
      + 'small. The most of-the-place of the four, and the most opinionated.',
  },
  {
    id: 'vollkorn',
    family: 'Vollkorn',
    weight: '400',
    licence: 'SIL OFL 1.1',
    note: 'A WARM TEXT SERIF. The examine layer is ~890 lines of prose a player '
      + 'reads rather than scans, and a serif is what prose is set in. Softer and '
      + 'less mechanical than Bitter; the question is whether it survives the panel '
      + 'at 28px.',
  },
];

async function serve() {
  const child = spawn('npm', ['run', 'dev', '--', '--port', String(PORT), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let said = '';
  child.stdout.on('data', (c) => { said += String(c); });
  child.stderr.on('data', (c) => { said += String(c); });
  const url = `http://127.0.0.1:${PORT}`;
  const deadline = Date.now() + 45_000;
  for (;;) {
    try { if ((await fetch(`${url}/`, { signal: AbortSignal.timeout(2000) })).ok) break; }
    catch { /* not up */ }
    if (Date.now() > deadline) { child.kill('SIGTERM'); throw new Error(`dev never came up\n${said}`); }
    await new Promise((w) => setTimeout(w, 250));
  }
  return { url, stop: () => child.kill('SIGTERM') };
}

/**
 * A face's cap height as a fraction of its em, measured once.
 *
 * NEEDED BEFORE NAVIGATION, because the size goes in the query string. So it
 * is measured in a blank page with the same @font-face, rather than derived
 * from a rule of thumb: cap ratios across these four run 0.64 to 0.72, which
 * is a 12% spread and exactly the difference between "reads the same size" and
 * "reads smaller than the others".
 */
async function capRatio(engine, candidate) {
  const page = await engine.newPage();
  await page.goto('about:blank');
  const faces = facesOf(candidate.id);
  const ratio = await page.evaluate(async ({ list, family, weight }) => {
    const style = document.createElement('style');
    style.textContent = list.map(({ data, weight: w }) =>
      `@font-face{font-family:'${family}';font-weight:${w};src:url(${data}) format('truetype')}`)
      .join('\n');
    document.head.appendChild(style);
    await document.fonts.load(`${weight} 100px '${family}'`);
    await document.fonts.ready;
    if (!document.fonts.check(`${weight} 100px '${family}'`)) return null;
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${weight} 100px '${family}'`;
    return ctx.measureText('H').actualBoundingBoxAscent / 100;
  }, {
    family: candidate.family,
    weight: candidate.weight,
    list: faces.map((face) => ({
      weight: face.weight,
      data: `data:font/ttf;base64,${readFileSync(resolve(ROOT, DIR, face.name)).toString('base64')}`,
    })),
  });
  await page.close();
  if (!ratio) throw new Error(`${candidate.family} would not load for measurement`);
  return ratio;
}

/** The face files on disk for a candidate, by weight. */
function facesOf(id) {
  return readdirSync(resolve(ROOT, DIR))
    .filter((name) => name.startsWith(`${id}-`) && name.endsWith('.ttf'))
    .map((name) => ({ name, weight: /-(\d+)\.ttf$/.exec(name)?.[1] ?? '400' }));
}

/**
 * One candidate, driven to both states, captured twice.
 *
 * THE FACE IS INJECTED BEFORE NAVIGATION and awaited before anything is
 * captured. A frame taken while a webfont is still in flight shows the
 * fallback, which looks like a rendered candidate and is a different typeface
 * entirely -- the exact class of silent substitution this whole exercise is
 * arranged around.
 */
async function shoot(engine, url, candidate, route, size) {
  const page = await engine.newPage({ viewport: WINDOW });
  const query = candidate.family
    ? `?font=${encodeURIComponent(candidate.family)}&fontWeight=${candidate.weight}`
      + `&fontPx=${size.play}&panelPx=${size.panel}`
    : '';
  if (candidate.family) {
    // INJECTED WHEN THERE IS SOMETHING TO INJECT INTO. An init script runs
    // before any page script, and at that moment `document.documentElement`
    // can still be null -- the append throws, the whole init script dies
    // silently, and every candidate renders in the SAME fallback face. Which
    // is what happened: four faces, four identical frames, one measured cap
    // height of 28px across all of them. A substitution that looks like a
    // result is the exact failure this comparison exists to avoid.
    await page.addInitScript(({ faces, family }) => {
      const inject = () => {
        const root = document.head || document.documentElement;
        if (!root) return false;
        const style = document.createElement('style');
        style.textContent = faces.map(({ name, weight }) =>
          `@font-face{font-family:'${family}';font-weight:${weight};`
          + `src:url('/art/ui/fonts/candidates/${name}') format('truetype');font-display:block}`)
          .join('\n');
        root.appendChild(style);
        return true;
      };
      if (!inject()) {
        const timer = setInterval(() => { if (inject()) clearInterval(timer); }, 4);
      }
    }, { faces: facesOf(candidate.id), family: candidate.family });
  }
  await page.addInitScript(() => {
    const go = () => { if (!window.__gauntlet) return false; window.__gauntlet.arm({}); return true; };
    if (!go()) { const t = setInterval(() => { if (go()) clearInterval(t); }, 4); }
  });
  await page.goto(url + query);

  if (candidate.family) {
    // AWAITED, NOT ASSUMED. `document.fonts.ready` resolves once every declared
    // face has loaded or failed, and the load is forced first because nothing
    // has drawn with it yet.
    // BOTH WEIGHTS AND BOTH SIZES, and the result is CHECKED. `fonts.load`
    // resolves happily for a face that never arrived, so what proves it is
    // `fonts.check` -- and a candidate that silently fell back is a frame of
    // the wrong typeface with the right label on it.
    const loaded = await page.evaluate(async ({ family, weight, play, panel }) => {
      const faces = [];
      for (const size of [`${play}px`, `${panel}px`]) {
        for (const w of new Set([weight, '400', '500'])) faces.push(`${w} ${size} ${family}`);
      }
      await Promise.all(faces.map((font) => document.fonts.load(font).catch(() => null)));
      await document.fonts.ready;
      return faces.every((font) => document.fonts.check(font));
    }, { ...candidate, play: size.play, panel: size.panel });
    if (!loaded) {
      throw new Error(`${candidate.family} never loaded, so its frames would be the fallback `
        + 'face wearing its name. Check that the .ttf files are in ' + DIR + ' and served.');
    }
  }

  const snap = async () => page.evaluate(() => window.__gauntlet?.snapshot() ?? null);
  const shots = {};

  // STATE A: the driver's tree. Prompt, options, and a line over the art.
  await runRoute(page, { actions: route.upToDialogue });
  await page.waitForTimeout(1200);
  shots.dialogue = await snap();

  // STATE B: play. The sentence line, the verb grid, the inventory.
  await runRoute(page, { actions: route.toPlay });
  await page.waitForTimeout(800);
  // Hovered so the sentence line has something in it: an empty sentence line
  // says nothing about a typeface.
  const rect = readJson('content/rooms/stage-road.json').hotspots
    .find((h) => h.id === 'town_sign')?.rect;
  if (rect) {
    const at = await page.evaluate(([x, y]) => {
      const canvas = document.querySelector('canvas');
      const box = canvas.getBoundingClientRect();
      const scale = Math.min(box.width / 1920, box.height / 1080);
      return { x: box.left + (box.width - 1920 * scale) / 2 + x * scale,
        y: box.top + (box.height - 1080 * scale) / 2 + y * scale };
    }, [rect[0] + rect[2] / 2, rect[1] + rect[3] / 2]);
    await page.mouse.move(at.x, at.y);
    await page.waitForTimeout(500);
  }
  shots.play = await snap();

  // The measured cap height, which is the number a resize argument needs.
  const cap = candidate.family ? await page.evaluate(({ family, weight, play }) => {
    const ctx = document.createElement('canvas').getContext('2d');
    ctx.font = `${weight} ${play}px '${family}'`;
    return Math.round(ctx.measureText('H').actualBoundingBoxAscent);
  }, { ...candidate, play: size.play }) : 42;

  await page.close();
  return { shots, cap, size };
}

/** Stacks the frames for one state into one labelled sheet. */
async function sheet(page, frames, title) {
  return page.evaluate(async ({ items, heading }) => {
    const images = await Promise.all(items.map(({ url }) => new Promise((done, fail) => {
      const i = new Image(); i.onload = () => done(i); i.onerror = fail; i.src = url;
    })));
    const scale = 0.62;
    const w = Math.round(images[0].width * scale);
    const h = Math.round(images[0].height * scale);
    const pad = 10; const label = 30; const top = 44;
    const canvas = document.createElement('canvas');
    canvas.width = w + pad * 2;
    canvas.height = top + images.length * (h + label + pad) + pad;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#14141a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e8e8ee'; ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText(heading, pad, 30);
    ctx.imageSmoothingQuality = 'high';
    images.forEach((image, index) => {
      const y = top + index * (h + label + pad);
      ctx.fillStyle = '#ffd9a0'; ctx.font = '600 17px system-ui, sans-serif';
      ctx.fillText(items[index].label, pad, y + 20);
      ctx.drawImage(image, pad, y + label, w, h);
    });
    for (const [type, ext] of [['image/webp', 'webp'], ['image/jpeg', 'jpg']]) {
      const url = canvas.toDataURL(type, 0.92);
      if (url.startsWith(`data:${type}`)) return { ext, url };
    }
    return null;
  }, { items: frames, heading: title });
}

async function main() {
  const outDir = process.argv.includes('--out')
    ? process.argv[process.argv.indexOf('--out') + 1] : 'renders/font-candidates';
  mkdirSync(resolve(ROOT, outDir), { recursive: true });
  const full = readJson('tools/gauntlet/routes/stage-road.json').actions;
  const cut = full.findIndex((a) => a.do === 'option');
  const route = { upToDialogue: full.slice(0, cut), toPlay: full.slice(cut) };

  const server = await serve();
  const engine = await browser();
  const taken = [];
  try {
    const control = { id: 'current', family: null, weight: '', licence: "the project's own",
      note: 'THE CONTROL: the 5x7 bitmap face, void under errata 54 and still what the game '
        + 'draws with.' };

    /*
     * TWO SIZES, AND THE SECOND ONE IS WHY THE FIRST IS NOT ENOUGH.
     *
     * `budget` gives every candidate the vertical space the bitmap face
     * occupies today -- 42px in the play area, 28 in the panel. That is the
     * layout's real constraint and it is the size the panel is built for.
     *
     * `cap` sizes each face so its CAPITALS are as tall as the bitmap's, which
     * is what the eye reads as "the same size". They are not the same number,
     * because the 5x7 packs caps, x-height and descenders into seven rows and
     * a real face spends a third of its em below the baseline. At the budget
     * size every candidate reads visibly smaller than the control -- which is
     * a true thing about the trade and not a fault in any of them, and it is
     * only visible with both sheets side by side.
     *
     * The cap size is what a five-line panel then has to survive. Q35 measured
     * the bitmap at 210 of the panel's 216 rows, so this is the number that
     * decides whether a face fits at all.
     */
    const SIZES = [
      { id: 'budget', play: 42, panel: 28,
        title: "the bitmap face's own line budget -- 42px play, 28px panel" },
      { id: 'cap', title: "cap heights matched to the bitmap's -- the size the eye reads as equal" },
    ];

    for (const size of SIZES) {
      console.log(`\n${size.id}: ${size.title}`);
      const row = [];
      for (const candidate of [control, ...CANDIDATES]) {
        // THE CONTROL HAS ONE SIZE AND IT IS NOT NEGOTIABLE: the bitmap face
        // draws at GLYPH_SCALE 6 and PANEL_GLYPH_SCALE 4, which is 42 and 28
        // units, in both sheets. Reading `size.play` for it produced a label
        // saying "undefinedpx", which is the sort of thing that reaches a
        // decision sheet because nobody reads their own captions.
        let use = candidate.family
          ? { play: size.play, panel: size.panel }
          : { play: 42, panel: 28 };
        if (candidate.family && size.id === 'cap') {
          const ratio = await capRatio(engine, candidate);
          use = { play: Math.round(42 / ratio), panel: Math.round(28 / ratio) };
        }
        process.stdout.write(`  ${candidate.id} at ${use.play}/${use.panel} ... `);
        const result = await shoot(engine, server.url, candidate, route, use);
        row.push({ ...candidate, ...result });
        console.log(`cap ${result.cap}px`);
      }
      taken.push({ size, row });
    }

    const page = await engine.newPage({ viewport: WINDOW });
    await page.goto('about:blank');
    for (const { size, row } of taken) {
      for (const [state, title] of [
        ['dialogue', 'DIALOGUE — prompt, options, and a spoken line over the art'],
        ['play', 'PLAY — the sentence line, the verb grid, the inventory'],
      ]) {
        const frames = row.filter((one) => one.shots[state]).map((one) => ({
          url: one.shots[state],
          label: `${one.id}${one.family ? ` — ${one.family} ${one.weight}` : ''}`
            + `  ·  ${one.family ? `${one.size.play}px play / ${one.size.panel}px panel`
              : 'the 5x7 at scale 6 and 4 — 42 and 28 units'}`
            + `  ·  cap ${one.cap}px  ·  ${one.licence}`,
        }));
        const made = await sheet(page, frames, `${title}  —  ${size.title}`);
        if (!made) throw new Error(`could not compose the ${state} sheet`);
        const bytes = Buffer.from(made.url.split(',')[1], 'base64');
        writeFileSync(resolve(ROOT, outDir, `${state}-${size.id}.${made.ext}`), bytes);
        console.log(`  ${outDir}/${state}-${size.id}.${made.ext}  `
          + `${(bytes.length / 1024).toFixed(0)} KB`);
      }
    }

    writeFileSync(resolve(ROOT, outDir, 'candidates.json'), `${JSON.stringify({
      note: 'A DECISION SHEET FOR DOC 36 Q16, AND NOT A DECISION. Errata 54 voided the 5x7 '
        + 'face and forbids anyone but Tyler choosing what replaces it. Nothing here ranks, '
        + 'scores or recommends.',
      capturedAt: new Date().toISOString(),
      sizes: taken.map(({ size }) => ({ id: size.id, note: size.title })),
      sizeNote: 'THE TWO SIZES ARE NOT THE SAME QUESTION. `budget` gives each face the '
        + 'vertical space the bitmap occupies now, which is what the panel is built for; '
        + '`cap` matches capital heights, which is what the eye reads as equal size. They '
        + 'differ because the 5x7 packs caps, x-height and descenders into seven rows and a '
        + 'real face spends a third of its em below the baseline. At `budget` every candidate '
        + 'reads smaller than the control; at `cap` the panel gets tighter, and Q35 already '
        + 'measured the bitmap at 210 of its 216 rows.',
      candidates: taken[0].row.map((one) => {
        const capRow = taken[1]?.row.find((other) => other.id === one.id);
        return { id: one.id, family: one.family, weight: one.weight, licence: one.licence,
          budgetPx: one.size, capMatchedPx: capRow ? capRow.size : null, note: one.note };
      }),
    }, null, 1)}\n`);
  } finally {
    await engine.close();
    server.stop();
  }
  console.log('\nFOUR CANDIDATES AND THE CONTROL, in the live UI. The choice is Tyler\'s.\n');
  return 0;
}

main().then((code) => process.exit(code), (error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exit(1);
});
