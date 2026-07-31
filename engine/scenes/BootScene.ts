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

    // Composed images, discovered through the rooms rather than listed
    // anywhere in code. Two per room: the background, and ruling 21a's near
    // plane, which is drawn on the other side of the actor.
    const pending: Promise<void>[] = [];
    const want = (key: string, path: string) => {
      this.load.image(key, new URL(path, document.baseURI).toString());
      pending.push(new Promise((resolve) => this.load.once(`filecomplete-image-${key}`, () => resolve())));
    };
    for (const room of bundle.rooms.values()) {
      if (room.background) want(`bg:${room.id}`, room.background);
      if (room.foreground) want(`fg:${room.id}`, room.foreground);
      if (room.idles?.sheet) want(`idle:${room.id}`, room.idles.sheet);
      // Occlusion masks are keyed by their content path, like character
      // sheets, because the renderer asks for one by the string the plane
      // used to name it.
      for (const plane of room.occlusionPlanes ?? []) {
        if (!this.textures.exists(plane.mask)) want(plane.mask, plane.mask);
      }
    }
    // Character sheets, keyed by their content path so the renderer can ask
    // for one by the same string the content used to name it.
    const sheets = new Set<string>([bundle.actor.sizes.near.sheet, bundle.actor.sizes.far.sheet]);
    for (const npc of bundle.ambient.values()) {
      if (npc.sprite) sheets.add(npc.sprite.sheet);
    }
    for (const path of sheets) want(path, path);
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
