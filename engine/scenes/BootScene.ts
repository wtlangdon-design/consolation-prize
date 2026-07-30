import Phaser from 'phaser';

import { fetchReader, loadContent } from '../core/ContentLoader.ts';
import { GameState } from '../core/GameState.ts';
import { BOOT_SCENE, GAME_SCENE, REGISTRY_STATE } from './keys.ts';

/**
 * Resolves the content manifest, restores any existing save, and hands off.
 * Nothing about Consolation is known here -- only the manifest path.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(BOOT_SCENE);
  }

  async create(): Promise<void> {
    const bundle = await loadContent(fetchReader(document.baseURI));

    // Composed backgrounds, discovered through the rooms rather than listed
    // anywhere in code.
    const pending: Promise<void>[] = [];
    for (const room of bundle.rooms.values()) {
      if (!room.background) continue;
      const key = `bg:${room.id}`;
      this.load.image(key, new URL(room.background, document.baseURI).toString());
      pending.push(new Promise((resolve) => this.load.once(`filecomplete-image-${key}`, () => resolve())));
    }
    if (pending.length > 0) {
      this.load.start();
      await Promise.all(pending);
    }

    const state = new GameState(bundle, window.localStorage);
    state.load();
    this.registry.set(REGISTRY_STATE, state);
    this.scene.start(GAME_SCENE);
  }
}
