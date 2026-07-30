import Phaser from 'phaser';

/**
 * Placeholder scene. It exists so the project can be run and seen working;
 * replace it once the real design lands.
 */
export class MainScene extends Phaser.Scene {
  constructor() {
    super('Main');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add
      .text(width / 2, height / 2, 'Consolation Prize', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '48px',
        color: '#e8e6e3',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2 + 48, 'Phaser 3 + TypeScript', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#7c8195',
      })
      .setOrigin(0.5);
  }
}
