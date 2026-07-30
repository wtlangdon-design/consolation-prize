import Phaser from 'phaser';

import { BootScene } from './scenes/BootScene.ts';
import { GameScene } from './scenes/GameScene.ts';
import { NATIVE_HEIGHT, NATIVE_WIDTH } from './render/Screen.ts';
import './style.css';

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

window.addEventListener('resize', () => {
  const zoom = integerZoom();
  game.scale.setZoom(zoom);
  game.scale.refresh();
});
