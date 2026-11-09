import type { AmbienceBed } from './types.ts';

/** What the background player is asked to play: a bed and its layers, or nothing. */
export interface AmbiencePlay { src: string; gain?: number; layers: { src: string; gain?: number }[] }

/**
 * A ROOM'S BACKGROUND, AS IT SOUNDS NOW (errata 105, 204). The bed, with every
 * layer whose figure is in the room (`whenPresent`: the dog's breathing while
 * the dog is there, Grievance's while she is in her stall), and nothing at all
 * while a duel sounds in a room whose bed says `duringDuel: 'silent'` (doc 45,
 * Every room's bed, row 4: nothing in the back room during a duel but the
 * duel's own cues).
 *
 * Nothing else changes a bed: no flag, no puzzle state (doc 45 rule 3,
 * invariant 9). A figure leaving takes its layer with it, for any reason.
 */
export function ambienceFor(bed: AmbienceBed | undefined, present: ReadonlySet<string>,
  duel: string | null): AmbiencePlay | null {
  if (!bed) return null;
  if (duel && bed.duringDuel === 'silent') return null;
  const layers = (bed.layers ?? []).filter((layer) => !layer.whenPresent || present.has(layer.whenPresent))
    .map((layer) => ({ src: layer.src, gain: layer.gain }));
  return { src: bed.src, gain: bed.gain, layers };
}
