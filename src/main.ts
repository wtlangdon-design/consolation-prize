import Phaser from 'phaser';

import { BootScene } from '@/scenes/BootScene';
import { MainScene } from '@/scenes/MainScene';
import '@/style.css';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#11131a',
  width: 1280,
  height: 720,
  pixelArt: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MainScene],
};

new Phaser.Game(config);
