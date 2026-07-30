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
    const state = new GameState(bundle, window.localStorage);
    state.load();
    this.registry.set(REGISTRY_STATE, state);
    this.scene.start(GAME_SCENE);
  }
}
