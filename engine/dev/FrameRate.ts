/**
 * THE FRAME-RATE READING. `?fps` puts two numbers in the corner of the page: frames a second over the last half
 * second, and the lowest half second of the last ten. CLAUDE.md's acceptance is "60fps on a Chromebook", and until this
 * there was no way to read it on one: the playthrough's own figures come from a recording browser drawing in software
 * (errata 241), and say nothing about the machine it will be played on.
 *
 * It counts the browser's own frames (requestAnimationFrame), which is what a player's eye gets, whatever the scene
 * chose to redraw. With no `?fps` in the address nothing is installed, and the build is the same as one without this.
 *
 * LIVE IN THE PUBLISHED BUILD, like `?room=` and `?fixture=`, for the same reason: the reading is wanted on the
 * deployed site, from the Chromebook. It reads; it changes nothing in the game.
 */
const HALF = 500;
const WINDOW = 20;        // half-seconds kept: ten seconds

/** The reading from frame counts over successive half seconds: the latest, and the lowest kept. */
export function reading(samples: number[]): { now: number; low: number } | null {
  if (!samples.length) return null;
  return { now: samples[samples.length - 1]!, low: Math.min(...samples.slice(-WINDOW)) };
}

export function installFrameRate(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  if (!new URLSearchParams(window.location.search).has('fps')) return false;
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;top:4px;left:4px;z-index:9;padding:2px 6px;font:14px monospace;'
    + 'color:#fff;background:rgba(0,0,0,.6);pointer-events:none';
  document.body.appendChild(box);
  const samples: number[] = [];
  let since = performance.now();
  let frames = 0;
  const tick = (at: number) => {
    frames += 1;
    if (at - since >= HALF) {
      samples.push(Math.round((frames * 1000) / (at - since)));
      if (samples.length > WINDOW) samples.shift();
      const read = reading(samples)!;
      box.textContent = `${read.now} / ${read.low}`;
      since = at;
      frames = 0;
    }
    window.requestAnimationFrame(tick);
  };
  window.requestAnimationFrame(tick);
  return true;
}
