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

const MAX_ZOOM = 6;

/**
 * Largest whole-number upscale that fits the window. Never fractional --
 * a non-integer scale reintroduces the resampling the art direction forbids.
 * At 4x this is 1280x800, the target in errata ruling 12.
 */
function integerZoom(): number {
  const byWidth = Math.floor(window.innerWidth / NATIVE_WIDTH);
  const byHeight = Math.floor(window.innerHeight / NATIVE_HEIGHT);
  return Phaser.Math.Clamp(Math.min(byWidth, byHeight), 1, MAX_ZOOM);
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: NATIVE_WIDTH,
  height: NATIVE_HEIGHT,
  zoom: integerZoom(),
  pixelArt: true,
  roundPixels: true,
  antialias: false,
  scale: {
    mode: Phaser.Scale.NONE,
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

window.addEventListener('resize', () => {
  const zoom = integerZoom();
  game.scale.setZoom(zoom);
  game.scale.refresh();
});
