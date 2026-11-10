import type { Condition, RoomFile } from './types.ts';

/**
 * WHAT THE ROOM SAYS HE IS HOLDING (Room.actorPoses; errata 246).
 *
 * A rule's `holds` puts a clip of his over that rule's lines and lets go with the last of them. The collection plate
 * (doc 115 II-1) stops in his hands and stays there until the player pulls: between the line that puts it there and
 * the verb that settles it he stood empty-handed, with a hotspot called the plate floating on his waistcoat. The
 * picture has to last as long as the state does, so the state names it.
 *
 * The first entry whose condition holds is the one. Its frames are taken in turn, `rate` to a second, so a rest and a
 * breath read as a man standing and not as a cut-out.
 */
export interface RoomPose {
  clip: string;
  frame: number;
  rooted: boolean;
}

export function roomPose(poses: RoomFile['actorPoses'], holds: (when: Condition) => boolean, seconds: number): RoomPose | null {
  const pose = poses?.find((one) => one.frames.length > 0 && holds(one.when));
  if (!pose) return null;
  const turn = Math.floor(Math.max(0, seconds) * (pose.rate ?? 0.5)) % pose.frames.length;
  return { clip: pose.clip, frame: pose.frames[turn]!, rooted: pose.rooted === true };
}
