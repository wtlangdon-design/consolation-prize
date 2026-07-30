import Phaser from 'phaser';

/**
 * Loads anything the game needs before the first playable scene.
 * Nothing to load yet — it hands straight off to MainScene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    // Asset loading goes here.
  }

  create(): void {
    this.scene.start('Main');
  }
}
