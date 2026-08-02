import type { ContentBundle, RoomFile } from './types.ts';

/**
 * What must exist before the first frame, and what may arrive after it.
 *
 * THE GAME WAS BLACK FOR FIFTEEN SECONDS ON LOCALHOST because boot awaited
 * every declared asset -- 170 files, 70 MB -- before starting the scene. Half
 * of that was the art being six times the size anything draws it at, and the
 * rig has since fixed it. This is the other half, and it is the half that
 * would have come back: the wait grows with every character added, and none of
 * them is in the first frame.
 *
 * TWO LISTS, AND THEY PARTITION. Every declared image is in exactly one of
 * them -- not both, and never neither. That is asserted by
 * `tools/check-boot-assets.mjs`, and it exists because of the third failure
 * this session produced: Hob's record parsed, his art was on disk, the clip
 * check passed, and he drew nothing, because the loader only ever asked for
 * the protagonist's frames. Present, valid, declared, and never loaded is a
 * category nothing could see. A partition makes it visible by construction --
 * an asset in neither list is a check failure rather than a character who
 * silently does not appear.
 *
 * IT IS A PLAIN MODULE ON PURPOSE. Phaser cannot be imported under node, so a
 * check that reasoned about BootScene's own code could only grep it. This is
 * the same function both scenes call, so what the check asserts is what the
 * game does.
 *
 * IT CARRIES TEXTURE KEYS, not just paths, for the same reason. Room images
 * are keyed by room -- `bg:stage-road` -- and everything else by its own
 * content path, because the renderer asks for a sheet by the string the
 * content used to name it. Splitting the load across two scenes with the
 * naming rule written out twice is how the halves drift; it is written once,
 * here.
 */
export interface BootAsset {
  /** The texture key the renderer will ask for. */
  key: string;
  /** The file, as content names it. */
  path: string;
}

export interface BootPlan {
  /** Awaited before `GameScene` starts. The first frame needs these. */
  required: BootAsset[];
  /** Loaded after the scene is up, without blocking it. */
  deferred: BootAsset[];
}

/**
 * The protagonist's clips that can play before anything has happened.
 *
 * He is standing when the scene starts, he breathes while he stands, and the
 * first thing the opening or the player does is move him. Everything else
 * needs time or an event first: an idle break needs seconds of stillness by
 * definition, and a recoil needs a beat or an interaction.
 *
 * That distinction is worth 5 MB, which is not a rounding error -- idle-break
 * is the single heaviest clip he owns at 3.68 MB, larger than stand, idle and
 * walk together, and it cannot possibly be on screen at second zero.
 */
export const FIRST_FRAME_CLIPS = ['stand', 'idle', 'walk'];

function roomImages(room: RoomFile): BootAsset[] {
  const out: BootAsset[] = [];
  if (room.background) out.push({ key: `bg:${room.id}`, path: room.background });
  if (room.foreground) out.push({ key: `fg:${room.id}`, path: room.foreground });
  if (room.idles?.sheet) out.push({ key: `idle:${room.id}`, path: room.idles.sheet });
  // Occlusion masks are keyed by their content path, like character sheets,
  // because the renderer asks for one by the string the plane used to name it.
  for (const plane of room.occlusionPlanes ?? []) out.push({ key: plane.mask, path: plane.mask });
  // Doc 22 item 9's per-state images, keyed by content path like the rest.
  for (const target of [...room.hotspots, ...room.exits]) {
    for (const shown of Object.values(target.states ?? {})) {
      if (shown.image) out.push({ key: shown.image, path: shown.image });
    }
  }
  return out;
}

/**
 * REQUIRED is the smallest set that draws the opening frame correctly:
 * the room the game starts in, and the protagonist standing and moving in it.
 *
 * Everything else waits. Other rooms are not on screen. Other characters are
 * not either -- Hob crosses the road in beat 9, a good half-minute after the
 * first frame, and his 27 frames blocking it bought nothing. Item icons draw
 * in a panel that is hidden until the opening hands over control.
 *
 * A deferred frame asked for before it arrives draws the graybox placeholder
 * the renderer already falls back to when a texture is absent, which is a
 * visible stand-in rather than a substituted clip -- Q20's distinction, and
 * the reason that fallback exists.
 */
export function planBoot(bundle: ContentBundle): BootPlan {
  const required = new Map<string, BootAsset>();
  const deferred = new Map<string, BootAsset>();

  const start = bundle.rooms.get(bundle.manifest.startRoom);
  for (const asset of start ? roomImages(start) : []) required.set(asset.key, asset);
  for (const clip of bundle.actor.clips) {
    if (!FIRST_FRAME_CLIPS.includes(clip.id)) continue;
    for (const frame of clip.frames) required.set(frame, { key: frame, path: frame });
  }

  const later = (asset: BootAsset) => {
    if (!required.has(asset.key)) deferred.set(asset.key, asset);
  };
  for (const room of bundle.rooms.values()) {
    for (const asset of roomImages(room)) later(asset);
  }
  for (const record of bundle.actors.values()) {
    for (const clip of record.clips) {
      for (const frame of clip.frames) later({ key: frame, path: frame });
    }
  }
  for (const npc of bundle.ambient.values()) {
    if (npc.sprite) later({ key: npc.sprite.sheet, path: npc.sprite.sheet });
  }
  later({ key: bundle.itemIcons.sheet, path: bundle.itemIcons.sheet });

  return { required: [...required.values()], deferred: [...deferred.values()] };
}
