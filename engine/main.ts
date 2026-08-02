import Phaser from 'phaser';

import { BootScene } from './scenes/BootScene.ts';
import { GameScene } from './scenes/GameScene.ts';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from './render/Screen.ts';
import { setAssertionChecking } from './core/Assertions.ts';
import './style.css';

// Doc 34 section 4.6's illegal-state assertions run in development and fold
// away in the production bundle: Vite resolves import.meta.env.DEV to a
// literal, so every guard's body becomes unreachable and each call site is
// left with one dead boolean test. They are programming-error guards, never
// content or player errors, so shipping them live would only convert an
// engine bug into a crash in front of a player.
setAssertionChecking(import.meta.env.DEV);

/**
 * ERRATA 54 VOIDS THE INTEGER UPSCALE, and this file cannot keep it.
 *
 * The old rule took the largest whole-number multiple of 320x200 that fit the
 * window. At a 1920x1080 native frame there is nothing to multiply: the first
 * multiple is the frame itself, and on any window smaller than 1920x1080 --
 * a Chromebook at 1366x768, or a browser with a bookmarks bar -- the integer
 * calculation returns zero and clamps to 1, which does not shrink the canvas.
 * It crops it. The panel goes off the bottom of the screen and the game is
 * unplayable while every test still passes.
 *
 * So the frame FITS instead: scaled down to the window, aspect preserved,
 * letterboxed. Errata 54 supersedes errata 39's integer-scaling rule by name
 * and replaces decimation with "ordinary filtered resampling", so a fractional
 * display scale is no longer the thing the art direction forbade -- it is the
 * mechanism the ruling chose.
 *
 * `pixelArt`, `roundPixels` and `antialias: false` stay. They govern how
 * TEXTURES are sampled when the engine draws them, which errata 54 did not
 * revisit and CLAUDE.md still states after it.
 */
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: NATIVE_WIDTH,
  height: NATIVE_HEIGHT,
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, GameScene],
};

const game = new Phaser.Game(config);

// A handle for driving the game from outside it, in dev builds only.
//
// Unit tests cannot see a sprite, a depth change or a frame rate, and the
// external audit's fair complaint was that the pieces had been proven
// separately and never proven to combine. Proving that means opening the
// game in a browser and clicking on it, and reading the real state back
// rather than inferring it from pixels. Stripped from the production bundle
// by the import.meta.env.DEV guard, which Vite resolves at build time.
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}

// Phaser.Scale.FIT handles the resize itself; refresh so a window change that
// does not fire the scale manager's own listener still re-letterboxes.
window.addEventListener('resize', () => {
  game.scale.refresh();
});
