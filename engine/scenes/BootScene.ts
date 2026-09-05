import { askedCandidates, resolveAssetPath } from '../dev/CandidateArt.ts';
import Phaser from 'phaser';

import { planBoot } from '../core/BootAssets.ts';
import { fetchReader, loadContent } from '../core/ContentLoader.ts';
import { GameState } from '../core/GameState.ts';
import { askedFixture, FIXTURE_SAVE_KEY } from '../dev/Fixture.ts';
import { BOOT_SCENE, GAME_SCENE, REGISTRY_STATE } from './keys.ts';

/**
 * Resolves the content manifest, restores any existing save, and hands off.
 * Nothing about Consolation is known here -- only the manifest path.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(BOOT_SCENE);
  }

  /**
   * BOOT WAITS ON THE FIRST FRAME, NOT ON THE GAME.
   *
   * It used to await every declared image -- 170 files -- and the screen was
   * black for the whole download. `planBoot` decides what the first frame
   * genuinely needs; `GameScene` picks up the rest once it is drawing. The
   * split lives in one module both scenes call, because a loader that knows
   * which half is which, written out twice, drifts.
   */
  async create(): Promise<void> {
    const bundle = await loadContent(fetchReader(document.baseURI));

    const pending: Promise<void>[] = [];
    // ONE PLACE A CONTENT PATH BECOMES A URL. Ruling 10's candidate override
    // is applied here and in GameScene.loadDeferred, and nowhere else, so no
    // plate can reach the screen by a route the override cannot see.
    const swaps = askedCandidates();
    for (const { key, path } of planBoot(bundle).required) {
      if (this.textures.exists(key)) continue;
      this.load.image(key, new URL(resolveAssetPath(path, swaps), document.baseURI).toString());
      pending.push(new Promise((resolve) => this.load.once(`filecomplete-image-${key}`, () => resolve())));
    }
    if (pending.length > 0) {
      this.load.start();
      await Promise.all(pending);
    }

    // A fixture session keeps its saves apart from the player's game.
    const state = new GameState(bundle, window.localStorage, undefined,
      askedFixture() ? FIXTURE_SAVE_KEY : undefined);
    state.load();
    this.registry.set(REGISTRY_STATE, state);
    this.scene.start(GAME_SCENE);
  }
}
