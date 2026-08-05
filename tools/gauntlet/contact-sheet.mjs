/**
 * DOC 46'S THIRD BUILD: the room gauntlet, as a contact sheet.
 *
 * The week's most consistent finding is that every serious defect passed every
 * check and was found by LOOKING -- the stacked map labels, the frozen wheels,
 * the coach's purple wedge, Room 1's cast standing in Room 2, captions in the
 * middle of the frame. A validator cannot judge a picture. But it can PRODUCE
 * the looking, in one batch, so a person does it once instead of discovering
 * faults one deploy at a time.
 *
 * This walks a room's own content -- every hotspot, every exit -- hovers each
 * one where the room says it is, captures the frame the renderer actually
 * drew, and writes a captioned page.
 *
 * IT CAPTURES THROUGH THE PROBE, and that is the whole reason it can exist.
 * The game draws into a Phaser CanvasTexture, an offscreen 2D canvas, which
 * Phaser blits to WebGL; headless WebGL composites nothing, so page
 * screenshots, CDP captures and canvas.toDataURL all return black. Nothing in
 * this project had ever captured a real frame headlessly -- the gauntlet's own
 * smoke test checks that a JPEG exceeds four thousand bytes and says in its
 * comment that this "does not claim the picture is right". `snapshot()` reads
 * the 2D canvas directly, which is both the only capture that works and the
 * truest one: the frame as drawn, before scaling or presentation.
 *
 * WHAT IT DOES NOT YET DO, and the first run said so plainly: it reaches the
 * room the game hands it, which is Room 1, because getting to Main Street
 * means PLAYING the opening -- asking the driver three questions, taking the
 * case, walking out the gap in the fence. Every later room is behind more of
 * the same. So the next increment is a ROUTE per room: a short authored list
 * of clicks that gets there, in the gauntlet's existing script format, which
 * already knows how to drive the game.
 *
 * The first run was still worth having. It captured the driver's tree with
 * three options and no fourth, which is the exit gate holding until the other
 * three are asked -- correct, and previously visible only by playing.
 *
 * Usage: node tools/gauntlet/contact-sheet.mjs <room id> [--out dir]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';

import { browser } from '../lib/chromium.mjs';
import { readJson } from '../lib/content.mjs';

const room = process.argv[2] ?? 'main_street';
const outDir = process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1] : 'renders/contact';
const PORT = 5199;

/** Where a native play-area point lands on the letterboxed canvas. */
async function toScreen(page, x, y) {
  return page.evaluate(([nx, ny]) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    // Phaser.Scale.FIT against the 1920x1080 design size.
    const scale = Math.min(rect.width / 1920, rect.height / 1080);
    return {
      x: rect.left + (rect.width - 1920 * scale) / 2 + nx * scale,
      y: rect.top + (rect.height - 1080 * scale) / 2 + ny * scale,
    };
  }, [x, y]);
}

const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'],
  { stdio: 'ignore', detached: false });
await new Promise((done) => setTimeout(done, 9000));

const shots = [];
try {
  const content = readJson(`content/rooms/${room.replace(/_/g, '-')}.json`);
  const targets = [
    ...(content.hotspots ?? []).map((h) => ({ ...h, kind: 'hotspot' })),
    ...(content.exits ?? []).map((e) => ({ ...e, kind: 'exit' })),
  ];

  const engine = await browser();
  const page = await engine.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`http://localhost:${PORT}/`);

  // Wait for the scene, then for the opening to hand control over.
  for (let i = 0; i < 40; i += 1) {
    await page.waitForTimeout(1500);
    const probe = await page.evaluate(() => window.__gauntlet?.probe?.() ?? null);
    if (probe?.control === 'player' || probe?.control === 'full') break;
    if (i === 1) await page.mouse.click(960, 500);
  }

  const grab = async (name) => {
    const url = await page.evaluate(() => window.__gauntlet?.snapshot?.() ?? null);
    if (!url) return null;
    const file = `${name}.png`;
    writeFileSync(`${outDir}/${file}`, Buffer.from(url.split(',')[1], 'base64'));
    return file;
  };

  mkdirSync(outDir, { recursive: true });
  shots.push({ caption: 'On entry', file: await grab('00-entry') });

  for (const [index, target] of targets.entries()) {
    const [x, y, w, h] = target.rect;
    const point = await toScreen(page, x + w / 2, y + h / 2);
    if (!point) continue;
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(320);
    const file = await grab(`${String(index + 1).padStart(2, '0')}-${target.id}`);
    shots.push({
      caption: `${target.kind === 'exit' ? '→ ' : ''}${target.name}`,
      detail: `${target.id} · rect ${target.rect.join(',')} · `
        + `verbs ${Object.keys(target.responses ?? {}).join(' ') || 'none'}`,
      file,
    });
  }

  await engine.close();
} finally {
  server.kill();
}

const cards = shots.filter((shot) => shot.file).map((shot) => `
  <figure>
    <img src="${shot.file}" alt="">
    <figcaption><b>${shot.caption}</b>${shot.detail ? `<span>${shot.detail}</span>` : ''}</figcaption>
  </figure>`).join('');

writeFileSync(`${outDir}/index.html`, `<!DOCTYPE html><meta charset="utf-8">
<title>${room} — contact sheet</title>
<style>
 body{background:#14141a;color:#e8e8ee;font:14px/1.5 system-ui,sans-serif;margin:0;padding:20px}
 h1{font-size:17px;margin:0 0 4px}
 p.lede{color:#9a9aae;margin:0 0 18px;max-width:60em}
 figure{margin:0 0 22px}
 img{width:100%;display:block;border-radius:5px;border:1px solid #2c2c38}
 figcaption{padding:7px 2px;font-size:13px}
 figcaption span{display:block;color:#8a8a9e;font:11.5px ui-monospace,monospace}
</style>
<h1>${room} — ${shots.length - 1} hotspots and exits, hovered</h1>
<p class="lede">Each frame is what the renderer actually drew with the cursor over that
target's own rect. A rect in the wrong place, a name that does not appear, a hotspot
swallowed by a larger one behind it, and anything simply ugly all show here and in
no validator.</p>
${cards}
`);

console.log(`\ncontact sheet: ${outDir}/index.html  (${shots.length} frames)\n`);
