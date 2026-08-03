import type { ContentBundle, RoomFile, SequenceFile } from './types.ts';
import { segmentsOf } from './Opening.ts';

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

/**
 * Everyone the opening puts on screen BEFORE IT ASKS THE PLAYER FOR ANYTHING,
 * AND EVERY CLIP IT NAMES FOR THEM.
 *
 * The protagonist is not the only thing in the first frame, and assuming he
 * was put a black rectangle beside him: the coach became a mover staged in
 * beat 2, its frames were in the deferred half, and for the second or two
 * before they landed a stagecoach drew as a graybox at half a second into a
 * new game. Working exactly as designed, and wrong.
 *
 * THE LINE IS THE FIRST PLAYER-CONTROL BEAT, not "everything the opening
 * stages". Hob is placed in beat 7, which is on the far side of the driver's
 * entire conversation -- a player-paced event of no fixed length, and always
 * at least one interaction away. There is time for him to arrive. There is
 * none for the coach, and no way to tell them apart by counting seconds,
 * because the only thing known statically is what happens before the player
 * is first asked to do something.
 *
 * Read from the manifest's named opening, like `beginOpening` does, so a
 * sequence belonging to some other room cannot drag its cast into boot.
 */
function firstFrameStaging(bundle: ContentBundle): Map<string, Set<string>> {
  const cast = new Map<string, Set<string>>();
  const id = bundle.manifest.openingSequence;
  const file: SequenceFile | undefined = id ? bundle.sequences.get(id) : undefined;
  if (!file) return cast;

  for (const segment of segmentsOf(file)) {
    if (segment.kind === 'menu') continue;
    if (segment.kind !== 'automatic') break;
    for (const beat of segment.beats) {
      for (const staged of beat.staging ?? []) {
        if (!('actor' in staged)) continue;
        const clips = cast.get(staged.actor) ?? new Set<string>();
        // A CHORE NAMES ITS OWN CLIP, so the list does not have to guess.
        // `aboard-coach` and `alight-coach` play a tenth of a second in and
        // were in the deferred half: the record declared them, `frameCount`
        // answered 5, `draw` returned false because the frame had not
        // arrived, and the protagonist was a placeholder for the whole of
        // beat 2 -- unthrottled, with the cache disabled, textureLoaded=false
        // at the moment each one played.
        if (staged.do === 'chore') clips.add(staged.clip);
        cast.set(staged.actor, clips);
      }
    }
  }
  return cast;
}

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
 * REQUIRED is the smallest set that draws the opening frame correctly: the
 * room the game starts in, and everyone standing in it before the player is
 * asked for anything.
 *
 * "Everyone" was "the protagonist" and that was an assumption, not a fact. The
 * coach is staged in beat 2 and drew as a black rectangle beside him for the
 * second its frames took to arrive.
 *
 * Everything else waits. Other rooms are not on screen. Hob is placed in beat
 * 7, on the far side of the driver's whole conversation, so his 27 frames
 * blocking the first frame buy nothing. Item icons draw in a panel that is
 * hidden until the opening hands over control.
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

  // The protagonist, and anyone else standing beside him before the player is
  // asked for anything -- plus every clip the staging NAMES for them, which is
  // derived rather than authored. `FIRST_FRAME_CLIPS` covers what can play
  // with nothing having happened; a staged chore is something that WILL play,
  // and the staging already says which and when.
  //
  // `pickup-low` stays deferred, correctly: beat 6 is on the far side of the
  // driver's whole conversation. And the idle-break argument is untouched,
  // because nothing stages an idle break -- it is a thing that happens when
  // nothing else is.
  const staged = firstFrameStaging(bundle);
  const cast = new Map<string, Set<string>>([[bundle.actor.id, new Set()], ...staged]);
  for (const [who, extra] of cast) {
    const record = bundle.actors.get(who);
    if (!record) continue;
    for (const clip of record.clips) {
      if (!FIRST_FRAME_CLIPS.includes(clip.id) && !extra.has(clip.id)) continue;
      for (const frame of clip.frames) required.set(frame, { key: frame, path: frame });
    }
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
