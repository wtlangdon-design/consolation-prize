import { figureSpeaking } from './Ambient.ts';
import type { Utterance } from './DialoguePerformance.ts';
import type { ActorFile, AmbientFile, Facing, PerformedDirection } from './types.ts';

/**
 * ACTED DIRECTIONS (doc 95; errata 131 B and 141).
 *
 * A stage direction is printed in parentheses (doc 58) unless a figure in the
 * room acts it: then the figure plays his frames, nothing is printed, and the
 * beat cannot be clicked through. Which directions are acted, by whom and in
 * which frames, is doc 95's table, which the loader has already put on each
 * figure as `sprite.performs`. Nothing here knows a direction's words.
 *
 * One reading for every channel a direction can come down -- a conversation's
 * exchange, a verb's queued lines, a room's arrival scene -- so a direction
 * acted in one is acted in all of them.
 */

/** A figure holding one of his frames. */
export interface HeldPose {
  /** The figure's ambient id, or the protagonist's actor id. */
  id: string;
  frame: number;
  /** The protagonist's: the clip the frame is of, and the facing it is drawn in (errata 148). */
  clip?: string;
  facing?: Facing;
}

/** Whoever can act a direction: an ambient figure, or the protagonist with his acts beside him. */
export interface Performer {
  id: string;
  sprite?: { performs?: Record<string, PerformedDirection> } | undefined;
}

/**
 * THE FIGURES PRESENT AND THE PROTAGONIST (errata 148). Thad is in every room
 * he speaks in, so his acts (doc 95 rows naming him) go with whoever stands
 * there; an ambient figure acts only where he stands.
 */
export function performersWith(present: readonly AmbientFile[], actor: ActorFile): Performer[] {
  return actor.performs ? [...present, { id: actor.id, sprite: { performs: actor.performs } }] : [...present];
}

/** One beat of an acted direction: the frames held in it, for how long, and the cue it sounds. */
export interface ActStep {
  seconds: number;
  poses: HeldPose[];
  cue?: string;
  /** The frame each performer keeps once the act is over, while he goes on speaking (doc 95 Holds). */
  holds?: HeldPose[];
}

/** A performed direction's frames, in order: errata 131's single `frame` or doc 95's `frames`. */
export function framesOf(act: PerformedDirection): number[] {
  return act.frames?.length ? act.frames : [act.frame ?? 0];
}

/** The figures present who act these words, each with his act. */
export function performersOf(present: readonly Performer[], words: string): { npc: Performer; act: PerformedDirection }[] {
  const key = words.trim();
  const out: { npc: Performer; act: PerformedDirection }[] = [];
  for (const npc of present) {
    const act = npc.sprite?.performs?.[key];
    if (act) out.push({ npc, act });
  }
  return out;
}

/**
 * The beats a direction is acted in, or null when nobody present acts it --
 * which leaves it printed, as doc 58 rules. Every performer steps through his
 * frames together; one with fewer frames holds his last.
 */
export function actOf(present: readonly Performer[], words: string): ActStep[] | null {
  const who = performersOf(present, words);
  if (!who.length) return null;
  const steps = Math.max(...who.map(({ act }) => framesOf(act).length));
  const seconds = Math.max(...who.map(({ act }) => act.seconds));
  const out: ActStep[] = [];
  for (let step = 0; step < steps; step += 1) {
    const poses = who.map(({ npc, act }) => {
      const frames = framesOf(act);
      return { id: npc.id, frame: frames[Math.min(step, frames.length - 1)]!,
        ...(act.clip ? { clip: act.clip, ...(act.facing ? { facing: act.facing } : {}) } : {}) };
    });
    const cue = who.find(({ act }) => act.cue && act.cue.frame === step + 1)?.act.cue?.id;
    out.push({ seconds: seconds / steps, poses, ...(cue ? { cue } : {}) });
  }
  const holds = who.filter(({ act }) => act.holds !== undefined).map(({ npc, act }) => ({ id: npc.id, frame: act.holds!,
    ...(act.clip ? { clip: act.clip, ...(act.facing ? { facing: act.facing } : {}) } : {}) }));
  if (holds.length) out[out.length - 1]!.holds = holds;
  return out;
}

/** An exchange's line as performed: an acted beat, or a line still to be held through (doc 95 Holds). */
export type PerformedUtterance = Utterance & { holdsAfter?: HeldPose[] };

/**
 * A REPLY AS IT IS PERFORMED. A stage direction is printed in parentheses (doc
 * 58, `printed` adds them) -- unless a figure in the room ACTS it (doc 95):
 * then nothing is printed, his frames play across the beat it takes, one
 * beat per frame, and no beat can be clicked through (`rest`).
 */
export function performedLine(present: readonly Performer[], spoken: Utterance,
                              printed: (words: string) => string): PerformedUtterance[] {
  if (!spoken.direction) return [spoken];
  const steps = actOf(present, spoken.line);
  if (!steps) return [{ ...spoken, line: printed(spoken.line) }];
  return steps.map((step) => ({
    ...spoken,
    silent: true,
    rest: step.seconds,
    poses: step.poses,
    ...(step.cue ? { cue: step.cue } : {}),
    ...(step.holds ? { holdsAfter: step.holds } : {}),
  }));
}

/**
 * A FRAME KEPT WHILE HE GOES ON SPEAKING (doc 95 Holds): Ozymandia says her
 * line with her eyes still closed. Each line after an act that holds is said
 * over the held frame, by the figure who speaks it, until his next act.
 */
export function heldThrough(present: readonly AmbientFile[], lines: PerformedUtterance[]): Utterance[] {
  const held = new Map<string, number>();
  return lines.map(({ holdsAfter, ...line }) => {
    if (line.silent) {
      for (const pose of line.poses ?? []) held.delete(pose.id);
      for (const pose of holdsAfter ?? []) held.set(pose.id, pose.frame);
      return line;
    }
    const figure = figureSpeaking(present, line.speaker);
    const frame = figure ? held.get(figure.id) : undefined;
    return frame === undefined ? line : { ...line, poses: [{ id: figure!.id, frame }] };
  });
}

/** What the speech channel shows for a line: nothing for an acted beat. */
export function shownText(line: Utterance): string {
  return line.silent ? '' : line.line;
}
