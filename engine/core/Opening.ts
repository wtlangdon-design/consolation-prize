import type { SequenceFile, SequenceBeat, SequenceStagingStep } from './types.ts';
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
    // A BEAT CARRYING AN ACT CARD STARTS ITS OWN SEGMENT. The card is raised
    // when its segment begins, so a beat that merely precedes it in the same
    // automatic run would raise it early -- and doc 17's beat 6b is exactly
    // that beat: the coach departing, immediately before the card. Without
    // this split the card would sit over the departure it is supposed to
    // follow.
    if (last && last.kind === kind && last.carriedBy === carriedBy && !beat.actCard) {
      last.beats.push(beat);
      continue;
    }
    out.push({ kind, beats: [beat], carriedBy });
  }
  return out;
}

/**
 * The steps for one automatic segment, in order: each beat's STAGING, then
 * its lines, then its stated duration.
 *
 * ISSUE X4 DEFECT 2 LIVED HERE. This emitted `say` and `wait` and nothing
 * else, so doc 17's visual descriptions -- the coach arriving, Thad climbing
 * down, the case landing in the mud, the departure, Hob crossing -- never
 * lowered to anything executable. The runtime held for eight seconds while a
 * beat announced an arrival and not one thing on screen moved.
 *
 * STAGING COMES FIRST because doc 22 section 6 puts the walk and the chore
 * ahead of the line: a man says "my name is Thaddeus Grubb" having got down
 * off the coach, not while still on it.
 *
 * THE STATED DURATION IS ONLY EMITTED FOR A BEAT THAT STAGES NOTHING. Doc
 * 17's seconds are how long the beat LASTS, and where the beat's action is
 * executable the action is what lasts -- a staged arrival that also waited
 * its eight seconds afterwards would play the arrival and then stand there
 * for the length of it again. An unstaged beat keeps the pause, because
 * something has to hold the screen while the thing the beat describes fails
 * to happen, and that pause is the visible shape of the gap.
 *
 * The duration comes AFTER the lines rather than before, because doc 17's
 * seconds are how long the beat lasts, not how long the game waits before
 * starting it.
 */
export function stepsFor(segment: Segment): SequenceStep[] {
  const automatic = segment.kind === 'automatic';
  if (!automatic) {
    for (const beat of segment.beats) {
      if (beat.seconds !== undefined) {
        throw new Error(
          `Beat ${beat.beat} states a duration but its control is ${beat.control}. `
          + 'Errata 30a: wait is legal only inside a beat whose control is none.',
        );
      }
    }
    // An interactive segment's lines and staging belong to whatever carries
    // it -- errata 30b's tree, or `carriedStepsFor` below -- and a runner
    // playing them here as a cutscene would offer them twice.
    return [];
  }

  const steps: SequenceStep[] = [];
  for (const beat of segment.beats) {
    // ERRATA 38's fence needs no test here: this branch IS `control: none`,
    // which is the only place a `move` is legal. `carriedStepsFor` refuses
    // one, and that is the other side of the same rule.
    for (const staged of beat.staging ?? []) steps.push(...lower(staged, beat));
    for (const spoken of unplacedLines(beat)) {
      steps.push({ kind: 'say', actor: spoken.speaker, line: spoken.line });
    }
    if (beat.seconds !== undefined && !(beat.staging?.length)) {
      steps.push({ kind: 'wait', seconds: beat.seconds });
    }
  }
  return steps;
}

/**
 * One staged action, as steps.
 *
 * THE WAIT IS ADDED HERE AND NOT BY THE AUTHOR. Doc 22 section 6's chain is
 * walk -> waitForActor -> face -> waitForActor -> chore -> say, and every
 * step of it that can be forgotten will be. A `chore` issued on the same
 * tick as the `walk` before it also claims a body the walk still owns, so
 * the omission does not merely look wrong -- it trips assertion 6.
 */
/**
 * The beat's lines that its staging did not place, in authored order.
 *
 * A beat that places ANY of its lines places all of them. Appending the rest
 * would put a line the author had scheduled next to one they had not, in an
 * order nobody chose -- and a beat that placed only its first line would play
 * the other two after everything had finished moving, which is the defect
 * this whole mechanism exists to remove.
 */
function unplacedLines(beat: SequenceBeat): { speaker: string; line: string }[] {
  const places = (beat.staging ?? []).some((staged) => staged.do === 'say');
  return places ? [] : (beat.lines ?? []);
}

/**
 * The line a staged `say` names, or a hard error naming the beat.
 *
 * An index with nothing behind it is a staging table that has drifted from
 * the document it is scheduling -- a line renumbered, removed, or never
 * written. It fails here rather than playing silence, because silence in a
 * cutscene looks exactly like a beat that had no line in the first place.
 */
function placedLine(beat: SequenceBeat, index: number): { speaker: string; line: string } {
  const found = (beat.lines ?? [])[index];
  if (!found) {
    throw new Error(
      `Beat ${beat.beat} stages say ${index} of ${(beat.lines ?? []).length} line(s)`,
    );
  }
  return found;
}

function lower(staged: SequenceStagingStep, beat: SequenceBeat): SequenceStep[] {
  switch (staged.do) {
    case 'walk':
      return [
        { kind: 'walk', actor: staged.actor, x: staged.to[0], y: staged.to[1] },
        { kind: 'waitForActor', actor: staged.actor },
      ];
    case 'move':
      return [
        {
          kind: 'move',
          actor: staged.actor,
          from: staged.from ? { x: staged.from[0], y: staged.from[1] } : undefined,
          x: staged.to[0],
          y: staged.to[1],
          seconds: staged.seconds,
        },
        { kind: 'waitForActor', actor: staged.actor },
      ];
    case 'face':
      return [
        { kind: 'face', actor: staged.actor, facing: staged.facing },
        { kind: 'waitForActor', actor: staged.actor },
      ];
    case 'say': {
      const spoken = placedLine(beat, staged.line);
      return [{ kind: 'say', actor: spoken.speaker, line: spoken.line }];
    }
    default:
      return [{ kind: 'chore', actor: staged.actor, chore: staged.clip }];
  }
}

/**
 * The lines and staging of a run of PLAYER beats nobody else carries.
 *
 * Doc 17 beat 9 -- Hob's lamp crosses -- is a player-control beat with three
 * lines, a flag write and a crossing, and it had no carrier at all: the
 * opening runner reached beat 8, found a player segment with no tree, and
 * finished. Its lines were never delivered, `T_HOB_CROSSING` was never set,
 * and the watchman's lamp hotspot that gate opens could not appear in the
 * game. See `GameScene.armPlayerBeats`, which is what carries it.
 *
 * It is NOT the same as an automatic segment: no `wait` may be emitted --
 * errata 30a forbids it outside `control: none` -- and it plays alongside
 * the player rather than instead of him.
 */
export function carriedStepsFor(beat: SequenceBeat): SequenceStep[] {
  const steps: SequenceStep[] = [];
  for (const staged of beat.staging ?? []) {
    if (staged.do === 'move') {
      throw new Error(
        `Beat ${beat.beat} stages a move but its control is ${beat.control}. `
        + 'Errata 38: move is legal only inside a beat whose control is none.',
      );
    }
    steps.push(...lower(staged, beat));
  }
  for (const spoken of unplacedLines(beat)) {
    steps.push({ kind: 'say', actor: spoken.speaker, line: spoken.line });
  }
  return steps;
}

/** Everything an automatic segment writes, applied when it completes. */
export function writesOf(segment: Segment): Record<string, boolean | number> {
  const out: Record<string, boolean | number> = {};
  for (const beat of segment.beats) Object.assign(out, beat.set ?? {});
  return out;
}

/**
 * What a play-area click may do to a running performance. Q25, as ruled.
 *
 * THE RULING: a click during a cutscene advances the pending line and nothing
 * else. Doc 17 decides it three ways over. The opening IS the tutorial and
 * every affordance is learned by using it, so a stray first click must not
 * skip it. Beat 6b's coach departure is three seconds BECAUSE errata found
 * that a coach vanishing on a click is not a coach leaving, so a click must
 * not cut it short either. And errata 30a's own reasoning is that an authored
 * duration IS the content, which leaves the beat's length untouchable.
 *
 * WHY IT IS A FUNCTION AND NOT AN `if`. The bug this replaces was invisible
 * from the update loop -- `cancel()` clears `started`, so `isRunning` went
 * false INSIDE the click handler, the next tick's `wasRunning` read false, the
 * running-to-stopped transition was never observed, and the opening's segment
 * counter froze with no error. Nothing in the loop could see it. Pulling the
 * decision out gives it a name and a test that does not need a browser, which
 * is the only reason the regression is now catchable.
 *
 * `cancel` remains right for ordinary play -- doc 22's deterministic
 * cancellation, a staged interaction the player has changed their mind about
 * stopping where it is. What the call site could not know is whether a
 * cutscene is running. They are two different things sharing one runner.
 */
export type ClickVerdict = 'consume' | 'cancel' | 'pass';

export function playfieldClick(
  options: { sequenceRunning: boolean; openingActive: boolean },
): ClickVerdict {
  // A cutscene beat is playing. The click is spent: it neither ends the beat
  // nor starts a walk underneath it. Any pending line has already been taken
  // by the caller before this is reached.
  if (options.openingActive && options.sequenceRunning) return 'consume';
  if (options.sequenceRunning) return 'cancel';
  return 'pass';
}

/** The act card a segment raises, if it raises one. */
export function actCardOf(segment: Segment): string | null {
  for (const beat of segment.beats) {
    if (beat.actCard) return beat.actCard;
  }
  return null;
}
