import { browser } from '../lib/chromium.mjs';

/**
 * THE TITLE'S MUSIC STARTS ON A TAP (errata 165).
 *
 * Tyler's Chromebook: "The music on the main screen still isn't working" -- and the sky's music, one click later,
 * did. Chrome lets a page play sound once it has had a user activation, and a touch only activates the page when
 * the finger LIFTS (touchend / pointerup), never on touchstart / pointerdown. The game asked for the title's bed on
 * pointerdown, so a tap on "Click to begin" was refused; the lift then activated the page, and the next tap (NEW
 * GAME) played the opening's bed. A mouse click activates on press, which is why no desk test ever heard it fail.
 *
 * HEADLESS CHROMIUM CANNOT SHOW IT. It plays every play() with or without `--autoplay-policy`, and its synthetic
 * touch counts as an activation from the press. So the rule is applied in the page: before the game's own
 * listeners, the HTML standard's activation-triggering events -- keydown, mousedown, a mouse's pointerdown, any
 * other pointer's pointerup, touchend -- mark the page activated, and play() is refused until one has. Then the
 * begin card is tapped, and clicked, and the title's bed has to be playing a few seconds later.
 */
export async function titleMusic(url) {
  const failures = [];
  const engine = await browser();
  try {
    for (const how of ['tap', 'click']) {
      const context = await engine.newContext({ viewport: { width: 1920, height: 1080 }, hasTouch: how === 'tap' });
      const page = await context.newPage();
      await page.addInitScript(() => {
        window.__played = [];
        let activated = false;
        const activate = () => { activated = true; };
        window.addEventListener('keydown', activate, true);
        window.addEventListener('mousedown', activate, true);
        window.addEventListener('touchend', activate, true);
        window.addEventListener('pointerdown', (event) => { if (event.pointerType === 'mouse') activated = true; }, true);
        window.addEventListener('pointerup', (event) => { if (event.pointerType !== 'mouse') activated = true; }, true);
        const original = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function play() {
          const src = this.dataset.src ?? this.src;
          if (!activated) {
            window.__played.push(`refused ${src}`);
            return Promise.reject(new DOMException('play() before a user activation', 'NotAllowedError'));
          }
          const promise = original.call(this);
          promise.then(() => window.__played.push(src), () => window.__played.push(`failed ${src}`));
          return promise;
        };
      });
      await page.goto(url);
      await page.waitForFunction(() => window.__gauntlet?.probe()?.begin === true, null, { timeout: 45_000 });
      if (how === 'tap') await page.touchscreen.tap(960, 540);
      else await page.mouse.click(960, 540);
      await page.waitForTimeout(3000);
      const state = await page.evaluate(() => ({ bed: window.__gauntlet?.probe()?.bed ?? null, played: window.__played }));
      const title = state.played.some((src) => /^audio\/consolation-title/.test(src));
      console.log(`    ${how}: bed ${state.bed}; ${state.played.join(', ') || 'nothing asked to play'}`);
      if (!title || !state.bed) failures.push(`a ${how} on the begin card did not start the title's music`);
      await context.close();
    }
  } finally {
    await engine.close();
  }
  return failures;
}
