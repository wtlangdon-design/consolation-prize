import { readFileSync } from 'node:fs';
import { loadContent, Report } from './lib/content.mjs';

/**
 * EVERY MOVER IS PLACED BEFORE IT IS USED.
 *
 * WHY THIS EXISTS. The coach was placed by beat 6b's `from` -- the beat where
 * it LEAVES. Through beats 2 to 6 it stood wherever the mover happened to be
 * created, so the protagonist alighted at the doorway's correct coordinates,
 * measured against a coach at x1390, while the coach was somewhere else
 * entirely. It took a screenshot to find.
 *
 * A MOVER WITH NO PLACEMENT IS NOT AT THE ORIGIN. It is wherever the last
 * thing to touch it left it, which is worse than the origin because it looks
 * deliberate. Same family as R5f: a value borrowed from whatever ran last,
 * filled in by the most plausible thing to hand.
 *
 * WHY NOTHING ELSE CAUGHT IT. Every check in this suite looks at one thing at
 * one moment. The staging was valid per beat -- every step well-formed, every
 * actor named, every clip present. The fault only exists ACROSS beats, and
 * "placed at 6b, first seen at 2" is not a contradiction visible anywhere
 * unless somebody holds eleven beats in their head and diffs them by actor.
 *
 * Every fault in the session that produced this was of that kind: right at one
 * moment and wrong across time. A stale generated record, a height field
 * nothing read, a clock starting at zero, a mover placed too late. A check
 * that looks at one frame cannot see any of them.
 *
 * WHAT COUNTS AS PLACING. `move` with a `from`, and nothing else. `walk`
 * requires a mover and never creates one; `face` and `chore` need one already
 * standing there. Errata 38, in its own words: "places the mover first when
 * the step says where from, which is how anything that is not the player
 * arrives in the room at all."
 *
 * THE PROTAGONIST IS EXEMPT. He is placed by the room's entrance before any
 * sequence runs, which is why he alone can be walked without being moved
 * first.
 */

/** Steps that need a mover to already exist. */
/** The play area, and how far past its edge still counts as "in frame". */
const PLAY_WIDTH = 1920;
const PLAY_MARGIN = 200;
/** How close in x two movers must be for a shared feet Y to actually overlap. */
const TIE_SPAN = 700;

const NEEDS_A_MOVER = new Set(['walk', 'face', 'chore']);

export function check() {
  const report = new Report('Every mover is placed before it is used');
  const content = loadContent();
  const player = content.actor?.id;

  let sequences = 0;
  let placements = 0;
  let uses = 0;
  let chores = 0;

  // The actor records, read straight from the manifest: loadContent does not
  // carry them and a chore's clip cannot be checked without them.
  const actors = new Map();
  for (const path of content.manifest.actors ?? []) {
    const record = JSON.parse(readFileSync(path, 'utf8'));
    if (record?.id) actors.set(record.id, record);
  }

  for (const { path, data } of content.sequences ?? []) {
    sequences += 1;
    /** actor -> the beat that placed them. */
    const placed = new Map();
    if (player) placed.set(player, 'the room entrance');

    for (const beat of data.beats ?? []) {
      for (const staged of beat.staging ?? []) {
        const who = staged.actor;
        if (!who) continue;

        // A CHORE NAMES A CLIP IN `clip`, AND NOTHING CHECKED THAT IT DOES.
        //
        // The mud beat shipped written as `{ do: 'chore', chore: 'strain' }`.
        // Opening.ts reads `staged.clip`, so the step lowered with an
        // undefined clip, choreSeconds looked one up by that name and threw
        // inside the update loop -- the game froze on the frame after his
        // line. Every one of 38 validators and 144 tests passed on it, and
        // there was a correct example six lines away in the same file.
        //
        // Two halves, because either alone still ships a freeze: the field has
        // to be there, and the clip it names has to be one the actor declares.
        if (staged.do === 'chore') {
          chores += 1;
          if (typeof staged.clip !== 'string' || staged.clip.length === 0) {
            report.fail(
              `${path} beat ${beat.beat}: ${who}'s chore names no clip. The field is `
              + '`clip`; a step carrying the clip under any other name lowers with `undefined` '
              + 'and throws in the draw loop.',
            );
          } else {
            const record = actors.get(who);
            const declared = (record?.clips ?? []).some((clip) => clip.id === staged.clip);
            if (record && !declared) {
              report.fail(
                `${path} beat ${beat.beat}: ${who} has no clip "${staged.clip}". A chore `
                + 'staged for a clip nobody drew throws when the beat reaches it, not when '
                + 'the content is loaded.',
              );
            }
          }
        }

        if (staged.do === 'move' && staged.from) {
          if (placed.has(who) && placed.get(who) !== 'the room entrance') {
            report.note(
              `${path} beat ${beat.beat}: ${who} is placed again `
              + `(first placed in beat ${placed.get(who)})`,
            );
          }
          placed.set(who, String(beat.beat));
          placements += 1;
          continue;
        }

        // A `move` without a `from` moves something that must already be here.
        if (NEEDS_A_MOVER.has(staged.do) || staged.do === 'move') {
          uses += 1;
          if (!placed.has(who)) {
            report.fail(
              `${path} beat ${beat.beat}: ${staged.do} names "${who}", who has not been `
              + 'placed. Only `move` with a `from` places a mover -- walk, face and chore '
              + 'all require one already standing there. An unplaced mover is not at the '
              + 'origin; it is wherever the last thing to touch it left it. Place it with '
              + 'a `move` in the EARLIEST beat it is seen, not the one that needs it.',
            );
          }
        }
      }
    }

    // A MOVER THAT LEAVES MUST HAVE ARRIVED IN AN EARLIER BEAT.
    //
    // This is the rule the coach actually broke, and the one worth having.
    // Its only staging was its own departure -- placed by beat 6b's `from`,
    // moved off frame by the same step. Nothing in the data said it should be
    // standing there from beat 2, because the beats that need it standing
    // there do not mention it: Thad's coordinates were derived from where the
    // coach is, and a derivation is not a reference.
    //
    // But a thing that exits was somewhere first. If a mover's destination is
    // outside the play area and its placement is in the SAME beat, it was
    // placed at the moment it left -- so for every beat before that it stood
    // wherever it happened to be created.
    for (const beat of data.beats ?? []) {
      for (const staged of beat.staging ?? []) {
        if (staged.do !== 'move' || !staged.to) continue;
        const [x] = staged.to;
        const leaves = x < -PLAY_MARGIN || x > PLAY_WIDTH + PLAY_MARGIN;
        if (leaves && staged.from) {
          report.fail(
            `${path} beat ${beat.beat}: ${staged.actor} is placed and sent off frame `
            + 'in the SAME step. A thing that leaves was standing somewhere first -- '
            + 'so for every beat before this one it stood wherever the mover happened '
            + 'to be created, which is not the origin and looks deliberate. Place it '
            + 'in the earliest beat it is seen, and drop the `from` here.',
          );
        }
      }
    }

    // NO TWO MOVERS MAY STAND AT THE SAME FEET Y WITH OVERLAPPING X.
    //
    // depthOrder sorts by feet Y, correctly -- doc 22 section 5 step 3 -- and
    // a stable sort keeps insertion order on a tie. Insertion order is
    // arbitrary and invisible: the protagonist is constructed in create() and
    // everyone else is placed by a beat, so he draws FIRST and anything placed
    // later draws OVER him.
    //
    // That is how the black figure happened. He was placed at the coach's own
    // y742 and drew behind it; the only part of him clearing the body was his
    // legs between the wheels, two dark bars, which at a glance is a figure
    // standing under a stagecoach.
    //
    // The engine cannot fix a true tie and should not try. Equal feet Y means
    // equal depth and the answer is genuinely undefined -- so it is caught
    // here instead, where a person can move one of them.
    const standing = new Map();
    for (const beat of data.beats ?? []) {
      for (const staged of beat.staging ?? []) {
        const at = staged.to ?? staged.from;
        if (!staged.actor || !at) continue;
        const [x, y] = at;
        for (const [other, spot] of standing) {
          if (other === staged.actor) continue;
          if (spot.y !== y) continue;
          if (Math.abs(spot.x - x) > TIE_SPAN) continue;
          report.fail(
            `${path} beat ${beat.beat}: ${staged.actor} stands at the same feet Y as `
            + `${other} (y${y}, ${Math.abs(spot.x - x)}px apart). Feet Y is depth, so a `
            + 'tie is a draw order nobody chose -- whoever was constructed first draws '
            + 'behind. Move one of them nearer or further; the difference does not have '
            + 'to be large, only real.',
          );
        }
        standing.set(staged.actor, { x, y });
      }
    }

    // A mover placed and never used is dead staging: something arrives and
    // does nothing, which is either a cut beat or a typo in an actor name.
    for (const [who, where] of placed) {
      if (where === 'the room entrance') continue;
      const used = (data.beats ?? []).some((beat) => (beat.staging ?? []).some(
        (staged) => staged.actor === who && staged.do !== 'move',
      ));
      const moved = (data.beats ?? []).some((beat) => (beat.staging ?? []).some(
        (staged) => staged.actor === who && staged.do === 'move' && !staged.from,
      ));
      if (!used && !moved) {
        report.fail(
          `${path}: ${who} is placed in beat ${where} and never does anything. `
          + 'Either the beat that used them was cut, or the actor name is wrong.',
        );
      }
    }
  }

  report.note(
    `${sequences} sequence(s): ${placements} placement(s), ${uses} use(s) of a placed mover, `
    + `${chores} chore(s) checked against the clips their actor declares`,
  );
  return report;
}
