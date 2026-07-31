import type { SequenceFile, SequenceBeat } from './types.ts';
import type { SequenceStep } from './Sequence.ts';

/**
 * Lowers a beat sheet into steps the SequenceRunner can perform.
 *
 * A BEAT IS NOT A STEP. A beat is what the document says happens; a step is
 * what the engine can do. Doc 17's ten beats are three different things --
 * a title screen, runs of automatic cutscene, and stretches where the player
 * is in charge -- and only the middle kind lowers to steps at all.
 *
 * So this splits the sheet into SEGMENTS at every change of control, and the
 * scene plays the automatic ones and hands the interactive ones to whatever
 * carries them. Beats 4 to 6 are carried by the driver's tree (errata 30b),
 * and the tree's EXIT option is what resumes the sheet at beat 7.
 *
 * NO CONTENT IS DECIDED HERE. Every line comes out of the file, and the file
 * comes out of doc 17 -- this only decides ordering, which is engineering.
 *
 * ERRATA 30a's RESTRICTION LIVES HERE. `wait` is legal only inside a beat
 * whose control is `none`, and that is a fact about the beat, which the
 * runner cannot see. This is the one place that can see both, so this is
 * where it is refused. The build check catches it earlier and in the open.
 */

export type SegmentKind = 'menu' | 'automatic' | 'player';

export interface Segment {
  kind: SegmentKind;
  beats: SequenceBeat[];
  /** The tree that carries this segment's lines, if one does. */
  carriedBy: string | null;
}

export function segmentsOf(file: SequenceFile): Segment[] {
  const out: Segment[] = [];
  for (const beat of file.beats) {
    const kind: SegmentKind = beat.control === 'menu'
      ? 'menu'
      : (beat.control === 'none' ? 'automatic' : 'player');
    const carriedBy = beat.carriedBy ?? null;
    const last = out[out.length - 1];
    // A run continues only while both the control and the carrier hold. Two
    // adjacent player beats carried by different things are two segments:
    // the driver's tree and Hob's crossing are not one stretch of play.
    if (last && last.kind === kind && last.carriedBy === carriedBy) {
      last.beats.push(beat);
      continue;
    }
    out.push({ kind, beats: [beat], carriedBy });
  }
  return out;
}

/**
 * The steps for one automatic segment, in order: each beat's lines, then its
 * stated duration.
 *
 * The duration comes AFTER the lines rather than before, because doc 17's
 * seconds are how long the beat lasts, not how long the game waits before
 * starting it -- beat 2's six seconds are Thad stepping down, straightening
 * his coat and looking at the town, and none of that happens during a pause
 * that precedes it.
 */
export function stepsFor(segment: Segment): SequenceStep[] {
  if (segment.kind !== 'automatic') {
    for (const beat of segment.beats) {
      if (beat.seconds !== undefined) {
        throw new Error(
          `Beat ${beat.beat} states a duration but its control is ${beat.control}. `
          + 'Errata 30a: wait is legal only inside a beat whose control is none.',
        );
      }
    }
    return [];
  }

  const steps: SequenceStep[] = [];
  for (const beat of segment.beats) {
    for (const spoken of beat.lines ?? []) {
      steps.push({ kind: 'say', actor: spoken.speaker, line: spoken.line });
    }
    if (beat.seconds !== undefined) {
      steps.push({ kind: 'wait', seconds: beat.seconds });
    }
  }
  return steps;
}

/** Everything an automatic segment writes, applied when it completes. */
export function writesOf(segment: Segment): Record<string, boolean | number> {
  const out: Record<string, boolean | number> = {};
  for (const beat of segment.beats) Object.assign(out, beat.set ?? {});
  return out;
}

/** The act card a segment raises, if it raises one. */
export function actCardOf(segment: Segment): string | null {
  for (const beat of segment.beats) {
    if (beat.actCard) return beat.actCard;
  }
  return null;
}
