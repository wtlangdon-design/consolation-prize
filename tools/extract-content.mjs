import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import { ROOT } from './lib/content.mjs';

/**
 * Regenerates the content files that are PARSED OUT OF /docs.
 *
 * CLAUDE.md makes this binding: every written line in /content is parsed out
 * of /docs, never transcribed, and a line that needs changing is changed in
 * /docs and re-extracted. Transcribing by hand is how a comma goes missing
 * from a joke, and the failure is silent -- the line still exists, still
 * passes every check, and is simply slightly worse than what was written.
 *
 * So this is one command rather than a series of one-off scripts. A pipeline
 * that only exists as "I ran something once" is a pipeline that will be
 * re-run by hand, differently, when the doc changes.
 *
 * WHAT IT DOES NOT DO: interpret. Where a document does not say who speaks a
 * line, this does not decide -- it carries the beat as written and the gap is
 * visible. Every attribution below is one the doc's own prose forces.
 */

function read(relative) {
  return readFileSync(resolve(ROOT, relative), 'utf8');
}

/**
 * In --check mode nothing is written; the file on disk is compared with what
 * the doc says it should be, and a difference is a failure.
 *
 * Without this the extraction rule is a habit rather than a rule: someone
 * edits /content directly, everything still passes, and the doc and the game
 * quietly disagree about a joke. This is the thing that notices.
 */
const CHECKING = process.argv.includes('--check');
const stale = [];

function write(relative, data, indent = 2) {
  if (relative.startsWith('content/dialogue/') && data && typeof data === 'object' && data.nodes) data = performDirections(data);
  const path = resolve(ROOT, relative);
  const wanted = `${JSON.stringify(data, null, indent)}\n`;
  if (CHECKING) {
    let found = null;
    try {
      found = readFileSync(path, 'utf8');
    } catch {
      found = null;
    }
    if (found !== wanted) stale.push(relative);
    return relative;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, wanted);
  return relative;
}

// ---------------------------------------------------------------------------
// STAGE DIRECTIONS ON SCREEN (doc 58; Tyler, 2026-11-05). Every tree's reply
// that carries a performed direction plays it, in the document's order, as a
// quieter line over the character. Applied to every content/dialogue file as
// it is written, so all twelve tree extractors share one rule.

const NOTE_PATTERN = /\berrata\b|\breq\s|\bsets\s|\bdoc \d|\bpairs?\b|\bRULED\b|\bSuperseded\b|\bTyler,|→|\bthe player\b|^(second|third|fourth|fifth)\b/i;
let directionRules = null;
function directionRule() {
  if (directionRules) return directionRules;
  const doc = read('docs/58-stage-directions.md');
  const hidden = new Set();
  const section = doc.split(/^## Hidden by name$/m)[1]?.split(/^## /m)[0] ?? '';
  for (const line of section.split('\n')) {
    const item = /^- (.+)$/.exec(line.trim());
    if (item) hidden.add(item[1].trim());
  }
  if (!hidden.size) throw new Error('doc 58: no "Hidden by name" list');
  directionRules = { hidden };
  return directionRules;
}

/** One direction's fate: null (a note, hidden), '…' (a bare pause), or its words. */
function performedDirection(text) {
  const words = text.trim();
  if (NOTE_PATTERN.test(words) || directionRule().hidden.has(words)) return null;
  if (/^(beat|pause|long pause)$/i.test(words)) return { line: '…', direction: false };
  return { line: words, direction: true };
}

/** Docs 04 and 27, indexed: `${node or tree id}::${option text}` to the reply cell. */
let replyIndex = null;
function replyCells() {
  if (replyIndex) return replyIndex;
  replyIndex = new Map();
  const add = (keys, text, cell) => { for (const key of keys) if (!replyIndex.has(`${key}::${text}`)) replyIndex.set(`${key}::${text}`, cell); };
  for (const [file, treeHeading] of [['docs/04-dialogue-trees.md', false], ['docs/27-minor-trees.md', true]]) {
    let keys = [];
    for (const line of read(file).split('\n')) {
      const heading = /^(#+)\s+(.+)$/.exec(line);
      if (heading) {
        const ids = [...heading[2].matchAll(/`([A-Z]{2,4}_[A-Z0-9]+)`/g)].map((m) => m[1]);
        if (ids.length) keys = ids;
        else if (treeHeading && heading[1] === '#') {
          const title = heading[2].split('·')[0].trim();
          keys = [`${title.replace(/[^A-Z ]/g, '').trim().replace(/\s+/g, '_')}/root`];
        }
        continue;
      }
      const row = /^\|\s*\d+\s*\|(.*)$/.exec(line);
      if (!row || !keys.length) continue;
      const cells = row[1].split('|').map((cell) => cell.trim());
      const text = /"([^"]+)"/.exec(cells[0] ?? '')?.[1];
      if (text && cells[2] !== undefined) add(keys, text, cells[2]);
    }
  }
  return replyIndex;
}

/** A reply cell, in order: speech and performed directions. */
function performedSequence(cell, npc) {
  const first = cell.split(/\*\((?:second|third|fourth|fifth)\)\*/)[0].split('→')[0];
  const out = [];
  for (const span of first.matchAll(/\*\(([^)]+)\)\*|\*\*"([^"]+)"\*\*|\*"([^"]+)"\*|"([^"]+)"/g)) {
    const [, direction, bold, italic, plainSpan] = span;
    if (direction !== undefined) {
      const shown = performedDirection(direction);
      if (shown) out.push({ speaker: npc, line: shown.line, ...(shown.direction ? { direction: true } : {}), staged: true });
    } else if (italic !== undefined) out.push({ speaker: 'thad', line: italic });
    else out.push({ speaker: npc, line: bold ?? plainSpan });
  }
  return out;
}

const directionReport = [];
function performDirections(tree) {
  const index = replyCells();
  for (const [nodeId, node] of Object.entries(tree.nodes ?? {})) {
    for (const option of node.options ?? []) {
      if (!option.text || option.beat || option.rephrase) continue;
      const cell = index.get(`${nodeId}::${option.text}`) ?? index.get(`${tree.id}/${nodeId}::${option.text}`);
      if (!cell) continue;
      const npc = tree.speaker ?? '';
      const sequence = performedSequence(cell, npc);
      if (!sequence.some((one) => one.staged)) continue;
      const existing = option.exchange ?? (option.say ? [{ speaker: npc, line: option.say }] : []);
      const spoken = sequence.filter((one) => !one.staged);
      const agrees = spoken.length === existing.length && spoken.every((one, at) => one.line === existing[at].line);
      if (!agrees) {
        directionReport.push(`${tree.id}/${nodeId}/${option.id}: its extractor reads the reply differently; directions left off`);
        continue;
      }
      let at = 0;
      const merged = sequence.map((one) => {
        if (one.staged) { const { staged, ...line } = one; return line; }
        return existing[at++];
      });
      delete option.say;
      option.exchange = merged;
    }
  }
  return tree;
}

/** Strips markdown emphasis, leaving the words and their punctuation. */
function plain(text) {
  return text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();
}

/** Every double-quoted span in a cell, in order. */
function quoted(text) {
  return [...text.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

/**
 * FOLLOW-UP OPTIONS (Tyler, 2026-11-01). A tag cell may say `after 2` or
 * `after 2, 3`: the option is offered only once those options of the same
 * node have been asked. Returns the option ids, or undefined.
 */
function afterIds(tagCell, speaker) {
  const found = /\bafter ([0-9][0-9, ]*)/.exec(tagCell ?? '');
  if (!found) return undefined;
  return found[1].split(',').map((n) => n.trim()).filter(Boolean).map((n) => `${speaker}${n}`);
}

/** A heading name as the id the content files already use for that thing. */
function slug(name) {
  return name.trim().toLowerCase().replace(/^(the|a) /, '').replace(/\s+/g, '_');
}

// ---------------------------------------------------------------------------

/**
 * Doc 17 v3's opening. The three-option line and the nine-exchange driver
 * tree are both VOID: v3 replaces them with one canonical line played
 * sincerely, four driver beats and no tree, and the act card moved to after
 * the coach leaves.
 *
 * SPEAKER ATTRIBUTION. The beat table does not tag speakers, so each one
 * below is forced by the doc's prose rather than chosen:
 *
 *   beat 3 -- the doc states both, in its own two blockquotes;
 *   beat 4 -- "Thad checks" sits between the question and the answer, so the
 *             driver asks, Thad answers, the driver lands the joke;
 *   beat 5 -- "Thad asks after Ezra Pike" is stage direction and the only
 *             quoted line in the beat is the reply;
 *   beat 6 -- "The driver climbs aboard" closes the beat, and a man who has
 *             four dollars is the one who says he has four;
 *   beat 9 -- note 1 attributes "Wouldn't stand there" to Hob by name, and
 *             the only other person on the road is Thad, so the alternation
 *             is fixed once the first line is.
 */
function opening() {
  const doc = read('docs/17-opening-sequence.md');

  const canonical = doc.match(/\*\*Thad's line, canonical:\*\*\s*\n\s*\n> \*\*"(.+?)"\*\*/);
  const punctured = doc.match(/The driver does not stop unloading:\s*\n\s*\n> \*\*"(.+?)"\*\*/);
  if (!canonical || !punctured) throw new Error('doc 17: cannot find the opening exchange');

  const beats = [];
  for (const line of doc.split('\n')) {
    // A BEAT NUMBER MAY CARRY A LETTER. Doc 17 added beat 6b -- the coach
    // departing -- and this pattern demanded \d+, so the new beat was
    // dropped without a word. The guard below counted ten beats and still
    // counted ten, because it was written against the old table and now
    // certifies a table it no longer describes: it counts the rows found,
    // not the rows present.
    const row = line.match(/^\| (\d+[a-z]?) \| (.+?) \| (.+?) \| (.+?) \|$/);
    if (!row) continue;
    const [, number, beat, control, notes] = row;
    // The control column is one of three words plus an optional duration, and
    // it is carried as the word rather than reduced to a boolean: beat 1 is
    // "menu", which is neither under the player's control nor a cutscene, and
    // a boolean has to call it one of them and be wrong.
    const word = plain(control).split('·')[0].trim();
    if (!['menu', 'no', 'yes'].includes(word)) {
      throw new Error(`doc 17 beat ${number}: unknown control "${word}"`);
    }
    const seconds = control.match(/~(\d+)/);
    beats.push({
      // The id stays a STRING so "6b" survives. Sorting and the flag routing
      // below both key on it, and a Number("6b") is NaN.
      beat: number,
      description: plain(beat),
      control: { menu: 'menu', no: 'none', yes: 'player' }[word],
      seconds: seconds ? Number(seconds[1]) : undefined,
      note: plain(notes),
      quoted: quoted(beat),
    });
  }
  // Counted against the DOCUMENT rather than against a number written here.
  // A literal 10 is a claim about the table that stops being true the moment
  // somebody adds a beat, and it stayed true through beat 6b being dropped.
  const rows = (doc.match(/^\| \d+[a-z]? \| /gm) ?? []).length;
  if (beats.length !== rows) {
    throw new Error(`doc 17: ${rows} beat rows in the table, ${beats.length} extracted`);
  }

  const DRIVER = 'stage_driver';
  const THAD = 'thad';
  const HOB = 'hob';
  const speech = {
    3: [[THAD, canonical[1]], [DRIVER, punctured[1]]],
    4: [[DRIVER, 0], [THAD, 1], [DRIVER, 2]],
    5: [[DRIVER, 0]],
    6: [[DRIVER, 0], [THAD, 1]],
    9: [[HOB, 0], [THAD, 1], [HOB, 2]],
    // The mud beat. Both his, and both quoted in the doc's own beat 11 row.
    11: [[THAD, 0], [THAD, 1], [THAD, 2], [THAD, 3]],
  };

  // Which beat sets which flag. This is routing, not writing, and it is not
  // invented here either: each of these three flags already carries the beat
  // it belongs to in its own note in content/flags/flags.json, written when
  // the beats were v2's. v3 renumbers them -- Hob's crossing moved from 8 to
  // 9 when the act card was inserted -- and this is the renumbering.
  //
  // T_COACH_DEPARTED is NOT here. v3.1 restored the driver's tree and put the
  // departure on its EXIT option in so many words -- "He climbs aboard. The
  // coach goes. Beat 7." -- so the write belongs to the option and a second
  // writer on the beat would be a race with it.
  //
  // T_CASE_DOWN IS NOT HERE, AND ITS ABSENCE IS THE FIX. Doc 17 beat 6 opens
  // "The case goes in the mud", so the write was put on the beat -- but
  // NOTHING MOVES THE CASE. There is no mover for it and no state swap; it
  // sits on the roof through the whole opening. The flag gates `case_mud`, so
  // writing it made a suitcase in the mud interactable where there is no
  // suitcase, and `case_roof` -- gated on the same flag being false --
  // disappear from under the case that is actually there. Reported from a
  // play-through as "the case is interactable where it is not".
  //
  // A FLAG MUST NOT CLAIM SOMETHING THAT HAS NOT HAPPENED. The write belongs
  // to whatever puts the case in the mud, on the day something does; until
  // then the truthful state is the one the picture shows. Filed as the case
  // never leaving the roof, which is a separate and larger gap.
  const flags = {
    '3': { T_OPENING_SAID: true },
    // THE CASE COMES DOWN AT BEAT 6, and the write is honest again. It was
    // removed because nothing moved the case and a flag must not claim what
    // the picture does not show; the case is its own drawn layer now, gated on
    // this, so writing it IS the case moving. Q11 as ruled: roof to mud to
    // hand, and then it is inventory.
    '6': { T_CASE_DOWN: true },
    // HOB IS ON SCREEN FROM THE END OF BEAT 7, so the flag that says so is
    // written there rather than at beat 9. It was on beat 9 because he used to
    // walk in during it; he now stands at the roadside before the player is
    // given control, and `lamp` -- gated on this being true and T_HOB_GONE
    // false -- has to be live for as long as he is standing in the picture.
    //
    // An automatic segment's writes land when the segment COMPLETES, so this
    // arrives exactly as beat 8 hands over control.
    // HE IS ON SCREEN FROM BEAT 2, so the flag that says so is written there.
    // Beat 1 is the title screen and `beginOpening` filters the menu segment
    // out of the opening entirely, so BEAT 2 IS THE FIRST BEAT THAT PLAYS and
    // "place him in the first beat" means this one.
    '2': { T_HOB_CROSSING: true },
    // AND T_HOB_GONE WAS WRITTEN NOWHERE AT ALL, which is why the lamp stayed
    // interactable after he had left and `lamp_gone` -- the response written
    // for exactly that moment -- could never appear. Beat 10 is where he has
    // gone: the carrier applies a beat's writes as it reaches it, and it
    // reaches beat 10 when beat 9's last walk has finished carrying him off
    // frame right. The flag's lifetime now matches the object's.
    '10': { T_HOB_GONE: true },
  };

  // v3.1 restored the tree without rewriting the beat sheet around it, so the
  // table still calls beats 4, 5 and 6 non-interactive while the tree that
  // carries their lines is interactive by definition. ERRATA 30b corrects the
  // table: those three beats ARE interactive, carriedBy is the right
  // annotation, and beat 3 stays automatic. Applied here rather than in the
  // doc so the correction is one ruling in one place.
  const carried = { '4': 'STAGE_DRIVER', '5': 'STAGE_DRIVER', '6': 'STAGE_DRIVER' };

  // WHICH BEATS WAIT FOR THE PLAYER RATHER THAN FOR A CLOCK.
  //
  // Doc 17 beat 9 is Hob's exchange, and he no longer crosses the road saying
  // it at whoever happens to be standing there. He waits at the roadside and
  // speaks when he is SPOKEN TO, so the beat is a response.
  //
  // THE WORDS DO NOT MOVE. They stay in doc 17 beat 9 where the beat sheet has
  // them, and only WHEN the beat begins changes. A dialogue tree on Hob would
  // have been the cheaper mechanism and would have moved three lines out of
  // the document that owns the opening -- a content decision, not an
  // implementation one.
  //
  // HOLDING IT FOREVER BREAKS NOTHING, checked before it was built.
  // `playOpeningSegment` calls `finishOpening` -- control handed over, the
  // done flag written, autosaved -- and only THEN arms the carrier. The
  // opening is genuinely over at beat 8; 9 and 10 are ordinary play that the
  // carrier happens to be driving. A player who never speaks to him leaves a
  // man standing at the roadside with his lamp, which is the truthful state.
  // A beat that holds until a player action writes a flag. Beat 9 is Hob's
  // exchange; beat 11 is the departure, which waits on the player taking the
  // west exit -- an exit that no longer travels, because one that moves you the
  // instant you touch it cannot also be a departure you watch.
  //
  // NOTHING WRITES T_THAD_LEAVING YET. Beat 11 therefore holds forever, which
  // is the truthful state of an unbuilt beat rather than a stall: the opening
  // is over at beat 8 and everything after it is ordinary play the carrier
  // happens to be driving.
  const awaits = { '9': 'T_HOB_SPOKEN', '11': 'T_THAD_LEAVING' };

  /**
   * WHERE THE BEATS HAPPEN. Doc 17 says what occurs; these say where, and they
   * live here for the same reason `doneFlag` does -- so no .ts file carries a
   * coordinate and no prose document carries a pixel.
   *
   * Every beat carried NO staging until now, so the opening played as spoken
   * lines over a still picture: Thad never climbed down, the driver never
   * moved, Hob never crossed, and the coach vanished rather than leaving. The
   * mechanism was complete and tested the whole time. The marks were never
   * written.
   *
   * The numbers are measured, not invented. The walkable band is 660-864 and
   * the walk box x256-1629, both approved on sight. The coach is 956x389 at
   * x190 with its wheels on the road at y742, derived from 240px per man. The
   * depth curve runs 222 at y660 to 263 at y830. Q4 ruled Room 1's ORIGINAL
   * numbers not a specification; these are not those numbers.
   */
  const staging = {
    // THE COACH STANDS AT x1390, not 646. Its hotspot is x1152-1632 and
    // case_roof is at x1236; at 646 the sprite sat on the left of the frame
    // while clicking it targeted empty road on the right. Placed at 1390 with
    // anchor[0] 478 it spans world x912-1868, and its own features fall at:
    //
    //    doorway   x1008 - 1341
    //    driver    x1332 - 1364
    //    horses    x1485 - 1866
    //
    // Every position below is measured against those, not guessed.
    // ERRATA 106: THE OPENING'S SOUNDS (doc 45 O-02-S2, O-06-S1, O-06B-S,
    // O-09-M). The coach is already standing when beat 2 opens -- it is placed,
    // not driven in -- so the team's sound starts at the halt: breathing and
    // harness, held until the first stride of 6b. O-02-S1, the moving team, has
    // no arrival to go with and is not played.
    2: [
      { do: 'cue', cue: 'O-02-S2' },
      { do: 'move', actor: 'hob', from: [600, 720], to: [600, 720], seconds: 0.1 },
      { do: 'move', actor: 'coach', from: [1390, 742], to: [1390, 742], seconds: 0.1 },
      { do: 'setState', object: 'coach', state: 'door-open' },
      // HE WALKS A FEW STEPS FORWARD BEFORE HE SPEAKS. Placed at the door and
      // then coming toward us gives the beat something to be -- it held 0.86s
      // of nothing while the player waited for a line, which is the first thing
      // anybody sees in the whole game.
      { do: 'move', actor: 'thad', from: [1180, 762], to: [1180, 762], seconds: 0.1 },
      { do: 'face', actor: 'thad', facing: 'front' },
      { do: 'walk', actor: 'thad', to: [1170, 812] },
      { do: 'face', actor: 'thad', facing: 'front' },
    ],
    // BEAT 3: forward and right, to IN FRONT OF the driver's box rather than
    // beside it. The driver sits at x1332-1364 and the horses begin at 1485;
    // there is no room to stand between them, so he stands ahead of both.
    3: [
      // A BEAT BEFORE HE SPEAKS. He walks forward in beat 2 and the line
      // arrived the instant he stopped, which reads as hurried -- and this is
      // the first line in the game.
      { do: 'wait', seconds: 1.4 },
      { do: 'say', line: 0 },
      // then a moment, then he crosses to the driver's right
      { do: 'wait', seconds: 1.2 },
      { do: 'walk', actor: 'thad', to: [1420, 830] },
      { do: 'face', actor: 'thad', facing: 'left' },
      // A HELD POSE, NOT A CHORE, and the difference is the whole beat. A
      // chore is a one-shot of frames/reactRate: `lookup` is 6 frames at 7,
      // so it raised his head for 0.86s and dropped it BEFORE THE DRIVER
      // ANSWERED. He has to still be looking up while the man he is looking
      // up at replies.
      //
      // Q75. The mechanism was already here and already proven one object
      // over: the coach's door is `setState` at beat 2, never cleared, held
      // through beat 6 -- a held pose across this same conversation. `lookup`
      // is registered as a STATE of the clip he is already playing rather
      // than as its own clip id, so it is the idle he stands in, at the
      // raised head, breathing.
      //
      // AND LEAVING THE OLD `chore lookup` HERE FROZE THE OPENING ON ITS
      // FIRST LINE. The step named a clip id that stopped existing the moment
      // the pose was made holdable: `lookup` became idle/left/lookup, and a
      // chore asking for it asked for a clip nothing declares. R5k in the
      // staging rather than in a coordinate -- a NAME that was correct when
      // written and stopped being correct when something else moved.
      { do: 'setState', object: 'thad', state: 'lookup' },
      { do: 'say', line: 1 },
    ],
    6: [
      // O-06-S1: the case hits the mud, and the fork inside rings its A.
      { do: 'cue', cue: 'O-06-S1' },
      { do: 'face', actor: 'thad', facing: 'right' },
      { do: 'chore', actor: 'thad', clip: 'pickup-low' },
    ],
    // BEAT 6b HOLDS HIM IN `carry` WHILE THE COACH GOES, and that one moment
    // is the whole reason the clip exists. Q11 ruled the case is an inventory
    // abstraction -- no carry locomotion, because that is 36 frames of stand
    // and walk in four facings and the next thing he does is walk away from us
    // at 98px tall where none of it would be seen -- with ONE exception, and
    // this is it.
    //
    // The bible's opening image is "a stage coach pulls away, revealing a
    // young man in a good coat standing in mud, holding a case." That is this
    // beat. `carry` is a single held pose and serves it exactly: he holds it
    // while the coach leaves, and it is in the panel afterwards.
    // BEAT 6b: errata 38's whole reason for existing. It LEAVES; it does not
    // vanish. `from` places the mover -- `walk` never places, only `move` does.
    // No `from` here: beat 2 placed it, and repeating the placement would
    // teleport it back to its mark if anything had nudged it.
    '6b': [
      // HE STOPS LOOKING UP WHEN THE COACH LEAVES. This clear was on beat 6
      // and could never fire: setState is fenced to beats whose control is
      // `none` and beat 6 is `player`, so the state was set and never unset.
      // He looked up permanently -- and because it lives on idle/left, it came
      // back every time he turned left for the rest of the game.
      { do: 'setState', object: 'thad' },
      { do: 'setState', object: 'coach' },
      // O-06B-S: the standing team's bed stops on the first stride, and the
      // team, the wheels and the axle go with the coach.
      { do: 'cue', cue: 'O-06B-S' },
      { do: 'move', actor: 'coach', to: [3000, 742], seconds: 3 },
    ],
    // BEAT 7 NO LONGER TOUCHES HIM -- he has stood at the roadside since beat
    // 2. Kept as an EMPTY list rather than deleted so the beat still lasts as
    // long as doc 17 says: `stagingTakesTime` is false for an empty list, so
    // the stated three seconds are emitted and the act card holds over them.
    //
    // WHAT WAS HERE, for the next person: he was placed off frame LEFT and
    // glided in.
    //
    // He used to be placed off frame left and glide to x60, then cross to
    // x1080 during beat 9 to speak. That put him on screen for about four
    // seconds around a three-line exchange, and a man who arrives, says three
    // sentences and leaves is an event rather than a neighbour. Ruled from a
    // play-through: he is part of the picture BEFORE he speaks.
    //
    // It also fixes the lamp. `lamp` is gated on T_HOB_CROSSING true and
    // T_HOB_GONE false, and while that window was the few seconds of a
    // crossing it was unreachable in practice -- the object existed for less
    // time than it takes to choose a verb.
    //
    // from == to PLACES HIM WITHOUT MOVING HIM, the same shape beat 2 uses for
    // the coach: `walk` never creates a mover, only `move` places one, and
    // errata 38 fences `move` to beats whose control is `none`. Beat 7 is the
    // last such beat before control, which is why it is here and not beat 8.
    7: [],
    // BEAT 9: he crosses, STOPS to speak, and goes on. Three lines from a man
    // who never breaks stride is not the beat -- and until `say` could be
    // STAGED, neither was this: a beat's lines were appended after all of its
    // staging, so he touched his mark for one tick, walked to 2100, and spoke
    // all three from 180px beyond the right edge of the frame.
    //
    // THE INDICES ARE THE LINES DOC 17 GIVES THIS BEAT, in its order: Hob,
    // Thad, Hob. No text here -- the words stay in the document, this says
    // only when each lands. An index with no line behind it throws at
    // extraction rather than playing silence.
    9: [
      // O-09-M: THE STRIKE, once, distant, as Hob begins to cross (doc 28 Room 1).
      { do: 'cue', cue: 'O-09-M' },
      // NO WALK IN, AND IT DOES NOT BEGIN UNTIL HE IS SPOKEN TO. He has been
      // standing since beat 2; the beat is what it says it is -- an exchange,
      // and then he goes on. See `awaits`.
      { do: 'say', line: 0 },
      { do: 'say', line: 1 },
      { do: 'say', line: 2 },
      // HE TURNS BEFORE HE WALKS, and this is the cheap half of a two-part
      // problem. His `stand` is a THREE-QUARTER pose and his `walk` is a right
      // PROFILE, so going straight from one to the other is a turn and a step
      // in the same frame -- reported as a snap. `setFacing` holds
      // TURN_SECONDS before a turn resolves, so a `face` here buys a fifth of
      // a second of standing in the new direction before the profile appears.
      //
      // TRIED FIRST BECAUSE IT IS FREE AND REVERSIBLE. One staged step, no
      // engine change, no art. If a fifth of a second is not enough the answer
      // is a three-quarter-to-profile turn frame, which is a generation --
      // so this is the thing to watch before commissioning that.
      { do: 'face', actor: 'hob', facing: 'right' },
      { do: 'walk', actor: 'hob', to: [2100, 700] },
    ],
    // BEAT 10 STAGES NOTHING, deliberately. Going west is the player's move to
    // make; it previously walked the protagonist during a player-control beat.
    //
    // BEAT 11 IS THE ENDING. It waits on T_THAD_LEAVING, which road_west
    // writes when the player takes it, and it does the travel itself at the
    // end -- which is why road_west declares `travelWhenTold` and does not go
    // anywhere on its own. An exit that moves you the instant you touch it
    // cannot also be a departure you watch.
    //
    // THE ROUTE LEAVES THE WALK BOX, so it is a `move` and not a `walk`:
    // errata 38's own case, a mover crossing no walk box at all. `move`
    // already plays the walk cycle -- `glideTo` sets the glide, `isWalking` is
    // true while it holds, and `clip` returns `walk` whenever `isWalking` --
    // and it faces toward the destination first, which up the hill is
    // dominant-vertical and resolves to `back`. thad-walk-back exists in all
    // four facings. No new step kind, and the gait advances from distance now,
    // which is why that fix came first.
    //
    // x575 IS THE GAP IN THE FENCE, measured off the plate with a ruler:
    // x500-650, centre 575. y500 is where the depth curve's third sample puts
    // him at 98px -- a man well up the road, still walking when Main Street
    // arrives rather than shrunk to nothing.
    //
    // SIX SECONDS. The title comes up over the mountains while he goes, and
    // the walk is what the credits are authored to rather than the other way
    // round.
    11: [
      // THE MUD BEAT, AND IT IS WHY THE PROLOGUE HAS AN ENDING RATHER THAN A
      // FADE. Tyler played the opening and reported that Thad simply drifts
      // off toward the town; there was no moment of setting out.
      //
      // He faces the road, says the earnest thing, tries to take the first
      // step of the rest of his life, and the mud has his boot.
      //
      // HE KEEPS HIS BACK TO US AND ROCKS, and it took three versions. Head-on
      // the first strain SANK him -- 8 source pixels, three at his drawn
      // height -- and read as nothing, because a man facing away has no
      // forward to lean into that a camera behind him can see. In profile it
      // read perfectly and looked wrong in the game: he turned away from the
      // town to get stuck, then turned back to leave.
      //
      // Working a boot free SIDEWAYS is the same action from the one angle
      // that shows it. 9 degrees each way about the hips, 107 source pixels of
      // head travel, 45 drawn, crossing centre both ways -- a rock that only
      // goes one way is a lean.
      //
      // He is already facing back when the beat starts, from the exit's own
      // walkTo, and the `face back` below is what holds him there.
      //
      // THE PHYSICAL ATTEMPT IS THE POINT. A pause with no movement in it
      // reads as the game having frozen, and that failure costs more than the
      // joke earns.
      // FACING FIRST, because `strain` is drawn back-facing only. He already
      // arrives this way from the exit's own walkTo, and leaving it implicit
      // would make the beat depend on a coordinate in another file.
      { do: 'face', actor: 'thad', facing: 'back' },
      { do: 'say', actor: 'thad', line: 0 },
      // A discreet one, which a man would rather nobody saw. 23 drawn pixels.
      { do: 'chore', actor: 'thad', clip: 'tug' },
      // THE SILENCES ARE THE CONTENT, which is errata 30a's own argument for
      // granting `wait` at all -- and beat 11's control is `none`, which is
      // the fence that makes it legal here. Without them the three attempts
      // run together into one animation and none of them is a decision.
      { do: 'wait', seconds: 0.7 },
      { do: 'say', actor: 'thad', line: 1 },
      // Determined, and still preserving his dignity. 45.
      { do: 'chore', actor: 'thad', clip: 'strain' },
      // Longer: this is the one where he looks down at it.
      { do: 'wait', seconds: 1.1 },
      { do: 'say', actor: 'thad', line: 2 },
      // Inelegant, and it works. 76 drawn pixels against the tug's 23.
      { do: 'chore', actor: 'thad', clip: 'wrench' },
      { do: 'say', actor: 'thad', line: 3 },

      // HE FACES AWAY AND STAYS THAT WAY. Errata 55: "with his back to us."
      // The path wanders left and right up the road -- x goes 575, 581, 537,
      // 464, 517, 598, 704, 772, 826 -- so a walk that re-faced itself on each
      // leg would turn him side-on four times on the way out of the game.
      // `path` never re-faces; this sets it once.
      // THE TRACED PATH, replacing a six-second glide to one fixed point.
      // The move took him to [575,500] at whatever height the depth curve's
      // provisional third sample gave, and stopped him in the field.
      { do: 'path', actor: 'thad', path: 'content/sequences/beat11-path.json' },
      // AND THEN THE TRAVEL, through the exit that declined to do it itself.
      //
      // IT WAS `interact road_west WALK_TO` AND THAT WALKED HIM BACK DOWN.
      // `interact` resolves the verb where it stands, and doc 22 section 6
      // walks to a target's own `walkTo` first -- road_west's is [575, 710],
      // just inside the band. So the beat spent forty seconds taking him up
      // the road and then walked him back to the fence before travelling.
      { do: 'travel', through: 'road_west' },
    ],
  };
  for (const entry of beats) {
    if (flags[entry.beat]) entry.set = flags[entry.beat];
    if (staging[entry.beat]) entry.staging = staging[entry.beat];
    if (awaits[entry.beat]) entry.awaitFlag = awaits[entry.beat];
    if (carried[entry.beat]) {
      entry.carriedBy = carried[entry.beat];
      entry.control = 'player';
    }
    const plan = speech[entry.beat];
    if (!plan) continue;
    entry.lines = plan.map(([speaker, which]) => ({
      speaker,
      line: typeof which === 'number' ? entry.quoted[which] : which,
    }));
    for (const spoken of entry.lines) {
      if (!spoken.line) throw new Error(`doc 17 beat ${entry.beat}: a line went missing in extraction`);
    }
  }
  // A STAGED `say` NAMES ONE OF ITS OWN BEAT'S LINES BY INDEX, and this is
  // where that stops being a convention. The staging table lives in this file
  // so that no .ts holds a coordinate and no prose document holds a pixel; a
  // `say` carrying a string would invert it exactly, putting dialogue in a
  // tool and leaving doc 17 as one of two places the words live. Two places
  // holding the same fact is how every pair of documents in this project has
  // drifted.
  //
  // So the step holds a number, and a number can be checked. Run after the
  // lines are attached, because until then there is nothing to check against.
  for (const entry of beats) {
    for (const staged of entry.staging ?? []) {
      if (staged.do !== 'say') continue;
      const count = (entry.lines ?? []).length;
      if (!Number.isInteger(staged.line) || staged.line < 0 || staged.line >= count) {
        throw new Error(
          `doc 17 beat ${entry.beat}: staging says "say ${staged.line}" and the beat has `
          + `${count} line(s). A staged say names one of the beat's OWN lines by index and `
          + 'carries no text -- the words stay in doc 17. Renumber the staging, or write the '
          + 'line in the document.',
        );
      }
    }
  }

  const card = beats.find((entry) => entry.description.includes('ACT CARD'));
  if (!card) throw new Error('doc 17: no beat carries the act card');
  card.actCard = card.note;

  for (const entry of beats) delete entry.quoted;

  return write('content/sequences/opening.json', {
    schema: 1,
    id: 'opening',
    // Which flag records that the opening has run. Routing, not content, and
    // named here rather than in the engine so no .ts file knows a flag id.
    doneFlag: 'T_OPENING_DONE',
    note: 'EXTRACTED from docs/17-opening-sequence.md by tools/extract-content.mjs. '
      + 'Do not edit: change doc 17 and re-run. Doc 17 v3 supersedes v2\'s beat sheet and the '
      + 'stage driver\'s tree, both of which are void -- the three-option opening line is one '
      + 'canonical line played sincerely, the driver is four beats with no tree, and the act '
      + 'card moved to after the coach leaves. The lines Thad and the driver speak are the '
      + 'quoted spans of the beat cells; the attribution is recorded in the extractor and is '
      + 'forced by the doc\'s prose, not chosen.',
    corrections: [
      'ERRATA 30a grants the runner a sixth step kind, `wait`, legal only inside a beat whose '
      + 'control is none. Beats 2 and 7 state durations, and without it the opening cannot run.',
      'ERRATA 30b corrects the beat sheet: beats 4, 5 and 6 are interactive, because the tree '
      + 'that carries their lines is. The table still says "no"; the ruling governs. Beat 3 '
      + 'stays automatic -- it is the exchange v3.1 models on the lookout, and that one is '
      + 'genuinely automatic.',
    ],
    speakers: {
      thad: { name: 'THADDEUS GRUBB' },
      stage_driver: {
        name: 'THE STAGE DRIVER',
        note: 'Four beats and he is gone. Everything else he said in v2 -- what the town is, '
          + 'Mott\'s strike, whether anyone has found it, how long the search has run -- is '
          + 'redistributed into town, where the sources contradict each other and no character '
          + 'in Act I gives a complete or correct account.',
      },
      hob: {
        name: 'HOB',
        note: 'Beat 9 is his crossing, and doc 17 note 1 is explicit that "Wouldn\'t stand '
          + 'there" is not a hint -- there is nothing wrong with where Thad is standing. Hob '
          + 'says small true-sounding things to strangers. A player who moves has lost nothing '
          + 'and a player who stays has lost nothing.',
      },
    },
    unwritten: [
      'Doc 17 note 0: Hob may be asked about Ezra Pike, once -- "Pike\'s up the hill." It is '
      + 'true, it is his only useful sentence in Act I, and it has no tree to live in yet. '
      + 'Extracted here so it is on file rather than only in the doc.',
    ],
    beats,
  });
}

// ---------------------------------------------------------------------------

/**
 * Doc 17 v3.1's driver tree, restored at four options after v3 cut it to zero.
 *
 * Four rows, one of each kind, and the doc's own tags. Nothing here is
 * chosen: the option text, the tag and the response are three columns of one
 * table, and the multi-speaker response in row 2 is carried as an exchange
 * rather than flattened into one string with dashes between the speakers --
 * which is what the v2 file did, and is the same failure as transcribing.
 *
 * The italics decide who speaks inside a response. The row's response is the
 * driver's unless the doc puts it in italics, which it does exactly once, for
 * Thad's "I have four." -- matching beat 6, where the same exchange appears
 * with the same emphasis.
 */
function stageDriver() {
  const doc = read('docs/17-opening-sequence.md');

  const section = doc.split('## The driver\'s tree')[1];
  if (!section) throw new Error('doc 17: no driver tree section');

  const rows = [];
  for (const line of section.split('\n')) {
    const row = line.match(/^\| "(.+?)" \| `\[(\w+)\]` \| (.+?) \|$/);
    if (row) rows.push({ text: row[1], tag: row[2], response: row[3] });
  }
  if (rows.length !== 4) throw new Error(`doc 17 v3.1: expected 4 options, found ${rows.length}`);

  const DRIVER = 'stage_driver';
  const THAD = 'thad';
  const options = rows.map((row, index) => {
    // Every quoted span in the response, with its emphasis, so the one
    // italicised line can be told from the ones that are not.
    const spans = [...row.response.matchAll(/(\*+)?"([^"]+)"(\*+)?/g)].map((match) => ({
      line: match[2],
      italic: match[1] === '*' && match[3] === '*',
    }));
    if (spans.length === 0) throw new Error(`doc 17 v3.1: option ${index + 1} has no response`);

    const option = {
      id: `drv${index + 1}`,
      text: row.text,
      tag: row.tag,
    };
    if (spans.length === 1) {
      option.say = spans[0].line;
    } else {
      option.exchange = spans.map((span) => (
        { speaker: span.italic ? THAD : DRIVER, line: span.line }));
    }
    return option;
  });

  // The two writes the doc states in the table itself: the PROGRESS option
  // that names the undertaker is the objective, and the EXIT option is
  // parenthesised "He climbs aboard. The coach goes. Beat 7."
  const undertaker = options.find((option) => (option.say ?? '').includes('undertaker'));
  if (!undertaker) throw new Error('doc 17 v3.1: no option names the undertaker');
  undertaker.set = { T_UNDERTAKER_NAMED: true };

  const exit = options.find((option) => option.tag === 'EXIT');
  if (!exit) throw new Error('doc 17 v3.1: the tree has no EXIT option');
  exit.set = { T_COACH_DEPARTED: true };
  exit.ends = true;

  // THE EXIT IS NOT THE FIRST THING YOU CAN CLICK. Doc 17 v3.1 gives this tree
  // four options to teach four things -- that dialogue branches, that a comic
  // option costs nothing and still answers, that one option ends a scene -- and
  // the fourth taught alone. A player who takes the exit first has been taught
  // that a conversation is a thing you leave, which is the opposite lesson, and
  // it is the FIRST conversation in the game.
  //
  // SO IT ARRIVES WHEN THE OTHERS HAVE BEEN ASKED. A gated option is not drawn
  // at all, so the list is three questions and then four; nothing greys, nothing
  // reshuffles, and doc 04 rule 4 is untouched -- an option that has never been
  // available is not an option that was removed.
  //
  // IT CANNOT STRAND HIM. Nothing removes an option once it is present (errata
  // 37 revoked), so the three are always askable and the fourth always arrives.
  // The count is the only reachability condition in the tree.
  //
  // AND THE COUNT IS A COUNT, NOT A SET. `add` applies on every selection --
  // the runner says so, deliberately, so counter-style options keep counting --
  // so asking one question three times opens the exit as surely as asking three
  // once. That is a live consequence rather than an oversight: it costs the
  // player nothing and it keeps this to one flag. Exactness here is three
  // booleans and Tyler's call, not the extractor's.
  const asked = options.filter((option) => option !== exit);
  if (asked.length !== 3) {
    throw new Error(`doc 17 v3.1: expected three options besides EXIT, found ${asked.length}`);
  }
  for (const option of asked) option.add = { ...option.add, T_DRIVER_ASKED: 1 };
  exit.when = { T_DRIVER_ASKED: { atLeast: asked.length } };

  return write('content/dialogue/stage-driver.json', {
    schema: 1,
    id: 'STAGE_DRIVER',
    name: 'THE STAGE DRIVER',
    // WHO ANSWERS, by speaker id. An option's `exchange` names a speaker per
    // line; its own `say` and `repeat` do not, and reported null -- so every
    // line in this tree drew in the fallback ink, which is Thad's. The tree
    // is the driver's and the answers are his; this says so once rather than
    // being inferred at each option.
    speaker: 'stage_driver',
    note: 'EXTRACTED from docs/17-opening-sequence.md by tools/extract-content.mjs. Do not edit: '
      + 'change doc 17 and re-run. v3.1 restores the tree at FOUR options after v3 cut it to '
      + 'zero -- one of each kind, teaching that dialogue branches, that the comic option costs '
      + 'nothing and answers, and that one option ends a scene. v2\'s nine exchanges are void: '
      + 'Mott stays out, and the premise is redistributed into town where the sources disagree.',
    nodes: {
      root: {
        id: 'root',
        options,
        noPrompt: true,
        exceptionReason: 'The driver has no prompt of his own. Beat 3 is automatic -- Thad\'s '
          + 'canonical line and "Course you have." -- and the tree opens on what the player asks '
          + 'next. Doc 17 v3.1 writes four options and four responses and no opening line for '
          + 'the node itself.',
      },
    },
    start: 'root',
  });
}

// ---------------------------------------------------------------------------

/**
 * A "1 ... · 2 ... · 3 ..." variant run, as [v1, v2, v3].
 *
 * SPLIT ON THE SEPARATOR, then read each piece. The first version matched
 * `(?:^|·)\s*(\d)\s+"..."` across the whole run, which requires a bullet or
 * a line start before every number -- true in the "newly written" sections
 * and false in the repeat runs, where variant 2 follows the word LOOK. So
 * every repeat run silently lost its middle variant and wrote a null into
 * the array. It passed extraction, produced valid JSON, and only surfaced
 * because a downstream check noticed variant 3 equalled variant 1.
 */
function variants(text) {
  const out = [];
  for (const piece of text.split('·')) {
    const match = piece.match(/(\d)\s+"([^"]+)"/);
    if (match) out[Number(match[1]) - 1] = match[2];
  }
  return out;
}

/**
 * Doc 25: Rooms 5 and 7, complete.
 *
 * The first document written specifically to clear a failing check --
 * check-written-content had been red for many turns on exactly these
 * thirty-two lines, and it was red for the right reason. So this is the
 * shape every remaining room's content will arrive in, and the extractor
 * is written for the shape rather than for these two rooms.
 *
 * FOUR KINDS OF ENTRY, all of them the doc's own sections:
 *
 *   ### HEADING with LOOK and LISTEN runs   -- a new hotspot's lines
 *   **NAME** -- LOOK 2 "..." · 3 "..." | LISTEN ...  -- repeats for an
 *                                          existing hotspot
 *   > **NAME** · VERB -- "..."             -- an override
 *   **NAME -> Room N** with LOOK/LISTEN     -- an exit
 *
 * Nothing here decides which hotspot a heading belongs to by guessing: the
 * name is slugged and matched against ids already in the room file, and a
 * heading that matches nothing is reported rather than invented.
 */
function rooms0507() {
  const doc = read('docs/25-rooms-05-07.md');
  const sections = doc.split(/^# ROOM (\d+) · /m).slice(1);
  const written = [];

  const FILE = { 5: 'content/rooms/assay-office.json', 7: 'content/rooms/claims-registrar.json' };
  const shortened = new Set();
  const VERBS = { LOOK: 'LOOK_AT', LISTEN: 'LISTEN_TO' };

  for (let index = 0; index < sections.length; index += 2) {
    const number = Number(sections[index]);
    const body = sections[index + 1];
    const path = FILE[number];
    if (!path) throw new Error(`doc 25: no room file for room ${number}`);
    // ONE WRITER PER ROOM. Once a room has an annotation, tools/compile-room.mjs
    // builds its whole file from the documents -- doc 25 included, with doc 30
    // section 5's line splitting -- and a second writer laying the same lines
    // down unsplit would flip the file on every alternate run. Room 7 has no
    // annotation yet, so this still carries its lines until it does.
    if (existsSync(`reference/room-${String(number).padStart(2, '0')}/annotation.json`)) {
      process.stderr.write(`  doc 25 room ${number}: owned by compile-room (annotation exists), skipped\n`);
      continue;
    }
    const room = JSON.parse(read(path));

    const byName = new Map();
    for (const target of [...room.hotspots, ...room.exits]) byName.set(target.name, target);

    // Exact name first, then a UNIQUE PREFIX. The doc heads a hotspot THE
    // CERTIFICATE ON THE WALL and calls it THE CERTIFICATE in the override
    // list, which is how anybody writes and is not an error. A prefix that
    // matches two hotspots is an error and says so -- the shortening is
    // allowed to be convenient, never ambiguous.
    const lineFor = (name) => {
      const exact = byName.get(name);
      if (exact) return exact;
      const near = [...byName.keys()].filter((full) => full.startsWith(name));
      if (near.length === 1) {
        shortened.add(`${name} -> ${near[0]}`);
        return byName.get(near[0]);
      }
      if (near.length > 1) {
        throw new Error(`doc 25 room ${number}: "${name}" matches ${near.length} hotspots`);
      }
      throw new Error(`doc 25 room ${number}: no hotspot named "${name}"`);
    };

    // --- new hotspots: a ### heading, then a LOOK run and a LISTEN run.
    for (const block of body.matchAll(/^### (.+?)\n\*\*LOOK\*\*(.+?)\n\*\*LISTEN\*\*(.+?)$/gm)) {
      const [, name, look, listen] = block;
      const target = byName.get(plain(name));
      if (!target) {
        // A heading the room has no hotspot for. Reported, never invented --
        // an id guessed here is a hotspot nobody can point at.
        throw new Error(`doc 25 room ${number}: "${plain(name)}" is written but the room `
          + 'has no hotspot with that name');
      }
      for (const [verb, run] of [[VERBS.LOOK, look], [VERBS.LISTEN, listen]]) {
        const said = variants(run);
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
      }
    }

    // --- repeat variants for hotspots doc 05 already wrote variant 1 for.
    for (const entry of body.matchAll(/^\*\*(.+?)\*\* — LOOK (.+?) \| LISTEN (.+?)$/gm)) {
      const [, name, look, listen] = entry;
      const target = lineFor(plain(name));
      for (const [verb, run] of [[VERBS.LOOK, look], [VERBS.LISTEN, listen]]) {
        // Indexed by the doc's own numbers, so variant 2 lands at index 1 --
        // and a run that skips a number leaves a hole rather than shifting
        // everything up one.
        const said = variants(run);
        if (said[0] !== undefined) {
          throw new Error(`doc 25: ${plain(name)} ${verb} repeat run restates variant 1`);
        }
        const rule = (target.responses?.[verb] ?? [])[0];
        if (!rule) throw new Error(`doc 25: ${plain(name)} has no ${verb} to add repeats to`);
        rule.repeat = said.slice(1);
        if (rule.repeat.some((line) => line === undefined)) {
          throw new Error(`doc 25: ${plain(name)} ${verb} repeats have a gap -- `
            + `got ${JSON.stringify(rule.repeat)}`);
        }
      }
    }

    // --- overrides.
    for (const entry of body.matchAll(/^> \*\*(.+?)\*\* · (.+)$/gm)) {
      const target = lineFor(plain(entry[1]));
      target.overrides = target.overrides ?? {};
      for (const pair of entry[2].split(' · ')) {
        const split = pair.match(/^(\w[\w ]*?) — "(.+)"$/);
        if (!split) throw new Error(`doc 25: cannot read override "${pair.slice(0, 40)}"`);
        target.overrides[split[1].trim().replace(/ /g, '_')] = split[2];
      }
    }

    // --- exits.
    for (const entry of body.matchAll(
      /^\*\*(.+?) → Room (\d+)\*\*\n\*\*LOOK\*\*(.+?)\n\*\*LISTEN\*\*(.+?)$/gm)) {
      const [, name, , look, listen] = entry;
      const target = lineFor(plain(name));
      for (const [verb, run] of [[VERBS.LOOK, look], [VERBS.LISTEN, listen]]) {
        const said = variants(run);
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
      }
    }

    // A target that now carries written lines is not a stub, and a stale
    // `stub` is not cosmetic: check-examine-lines SKIPS stubs, so leaving it
    // set on an exit doc 25 wrote three LOOK variants for quietly excluded
    // those lines from the game-wide uniqueness guarantee.
    for (const target of [...room.hotspots, ...room.exits]) {
      if (target.stub && target.responses?.LOOK_AT) delete target.stub;
    }

    room.note = `${(room.note ?? '').replace(/ Lines EXTRACTED.*$/, '')} `
      + 'Lines EXTRACTED from docs/25-rooms-05-07.md by tools/extract-content.mjs. Do not '
      + 'edit: change doc 25 and re-run.';
    written.push(write(path, room));
  }
  for (const pair of shortened) process.stderr.write(`  doc 25 short name: ${pair}\n`);
  return written;
}

// ---------------------------------------------------------------------------

/** Doc 24's combination table: three tiers, extracted whole. */
function combinations() {
  const doc = read('docs/24-combinations.md');
  const existing = JSON.parse(read('content/combinations.json'));

  // A PAIR THAT OPENS A TREE INSTEAD OF SAYING A LINE. Doc 24 rule 4 wants a
  // written line behind every pair; errata 66 A-C make C5's line WIN_B2's
  // authored opening, launched by the action itself, so its row carries a
  // direction and no quote. Its routing (ids, the puzzle it completes, the
  // tree it opens, what it needs first) is authored HERE, as the Winnie
  // tree's entry gates are, because the document names people and places
  // and the engine needs ids.
  const OPENING_PAIRS = {
    'C5|THE SUBMISSION LOG|Winnie': {
      item: 'padded_log', room: 'assay_office', target: 'winnie', puzzle: 'C5',
      // ERRATA 124 (the fairness audit): it waits on THE LOG -- what Winnie
      // was promised and the log's own LOOK says she will want -- not on C4,
      // which completes only on the portrait drawer, a funeral-day search
      // nothing points at. Gated on C4 the right item on the right person was
      // refused with "That accomplishes nothing I can see."
      requiresFlags: { T_QUEUE_PADDED: true }, completes: 'C5', opens: 'WINNIE',
      note: 'ERRATA 66 A-C: SHOW / USE the submission log on Winnie is C5. The target is the room\'s ambient character, not a hotspot. No `say`: the pair\'s line is WIN_B2\'s opening, which the action launches at once. The log is kept. With C5 complete the pair yields to the ordinary pools (doc 36 Q113).',
    },
  };
  const pairs = [];
  const opening = [];
  for (const line of doc.split('\n')) {
    const row = line.match(/^\| \*\*([A-F]\d+)\*\* \| (.+?) \| (.+?) \|$/);
    if (!row) continue;
    const combo = row[2].match(/^([A-Z '’]+?) on \*\*(.+?)\*\*$/);
    const say = row[3].match(/^"(.+?)"/);
    if (say) { pairs.push({ puzzle: row[1], item: combo[1].trim(), target: combo[2].trim(), say: say[1] }); continue; }
    const key = `${row[1]}|${combo[1].trim()}|${combo[2].trim()}`;
    const routed = OPENING_PAIRS[key];
    if (!routed) throw new Error(`doc 24: the pair "${key}" has no line and no routing that opens a tree`);
    const direction = /\*\(→ opens `([A-Z_0-9]+)`/.exec(row[3]);
    if (!direction) throw new Error(`doc 24: the pair "${key}" names no tree to open`);
    opening.push({ ...routed, opensNode: direction[1] });
  }
  // A PAIR A LATER DOCUMENT REWROTE keeps its routing here, because the file
  // on disk now holds the rewrite and no longer carries doc 24's line to find
  // it by. The rewrite replaces the pair further down (doc 54 A5's blanket).
  const SUPERSEDED_PAIRS = {
    'A5|HORSE BLANKET|the hole': { item: 'blanket', room: 'prosperity', target: 'hole', puzzle: 'A5' },
  };
  const nulls = [];
  let inNulls = false;
  for (const line of doc.split('\n')) {
    if (line.startsWith('# 4 ')) { inNulls = true; continue; }
    if (line.startsWith('## Notes')) break;
    const entry = line.trim().match(/^> \*\*(.+?) on (.+?)\*\* — "(.+)"$/);
    if (inNulls && entry) nulls.push({ item: entry[1], target: entry[2], say: entry[3] });
  }

  // The routing -- which item id, which room, which target id -- is not in the
  // doc and is not invented here: it is read back off the file already
  // shipped, so only the LINES come from the extraction. If doc 24 grows a
  // pair this cannot place, it says so rather than guessing.
  const placed = new Map(existing.pairs.map((pair) => [pair.say, pair]));
  const rebuilt = [...[...pairs, ...nulls].map((pair) => {
    const routed = placed.get(pair.say) ?? SUPERSEDED_PAIRS[`${pair.puzzle}|${pair.item}|${pair.target}`];
    if (!routed) throw new Error(`doc 24: no routing on file for "${pair.say.slice(0, 40)}..."`);
    return { ...routed, say: pair.say };
  }), ...opening];
  // DOC 57 A8: THE NUGGET PIANO ANSWERS BY CIRCUMSTANCE. Its five cases are
  // the document's `> **THE PIANO** · USE THE TUNING FORK, *case* — ...`
  // lines; their WORDS are read from there. Which flag or item each case
  // tests, and what it gives, is routing, authored here the way OPENING_PAIRS
  // is, in the order the cases must be tried: a visit's tuning first (the
  // piano is flat again each time he comes back -- the room's onEnter clears
  // T_NUGGET_PIANO_TUNED), then the fee still in his pocket, then the count.
  const tuned = { T_NUGGET_PIANO_TUNED: true };
  const paid = { T_NUGGET_PIANO_PAID: 1 };
  const A8_CASES = [
    ['already tuned this visit', { when: { T_NUGGET_PIANO_TUNED: true } }],
    ['already holding THE FILING FEE', { holds: ['filing_fee'], set: tuned }],
    ['first time', { when: { T_NUGGET_PIANO_PAID: 0 }, items: ['filing_fee'], set: tuned, add: paid, completes: 'A8' }],
    ['second time', { when: { T_NUGGET_PIANO_PAID: 1 }, items: ['filing_fee'], set: tuned, add: paid }],
    ['third time and after', { when: { T_NUGGET_PIANO_PAID: { atLeast: 2 } }, items: ['filing_fee'], set: tuned, add: paid }],
  ];
  const a8 = (() => {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## A8 ');
    if (from < 0) throw new Error('doc 57: no A8 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const found = new Map();
    for (const line of body.split('\n')) {
      const m = /^> \*\*THE PIANO\*\* · USE THE TUNING FORK, \*(.+?)\* — (.+)$/.exec(line);
      if (!m) continue;
      const spoken = m[2].split('→')[0];
      const quotes = [...spoken.matchAll(/"([^"]+)"/g)].map((q) => q[1]);
      if (!quotes.length) throw new Error(`doc 57 A8: "${m[1]}" has no line`);
      found.set(m[1], quotes);
    }
    return A8_CASES.map(([label, routing]) => {
      const quotes = found.get(label);
      if (!quotes) throw new Error(`doc 57 A8: no case "${label}"`);
      return { case: label, ...routing, say: quotes[0], ...(quotes.length > 1 ? { then: quotes.slice(1) } : {}) };
    });
  })();
  for (const pair of rebuilt) {
    if (pair.item === 'tuning_fork' && pair.room === 'nugget' && pair.target === 'piano') {
      if (pair.say !== a8[2].say) throw new Error('doc 57 A8: the first time does not open on doc 24\'s line');
      pair.rules = a8;
    }
  }

  // Pairs a later block adds (doc 57's, doc 54 A5's bait and smoke) are not doc 24's.
  const spoken = existing.pairs.filter((pair) => typeof pair.say === 'string' && !/^Doc 57 |^Doc 54 A5, the |^Doc 54 Room 33 /.test(pair.note ?? '')).length;
  if (rebuilt.length - opening.length !== spoken) {
    throw new Error(`doc 24: ${rebuilt.length - opening.length} spoken pairs extracted, ${spoken} on file`);
  }

  // DOC 57 A6 AND A9: THE REGISTRAR'S COUNTER, IN THE STATUTE'S ORDER (errata
  // 80 D). A6: the deed on the counter without a survey is Sump's refusal, the
  // words of SUM_A1 option 1 (doc 04). A9: the deed (with the survey in hand),
  // then the survey, then the fee to Sump, the last of which is the read-back
  // and the invitation. The WORDS are the documents'; which flag or item each
  // case tests, takes or gives is routing, authored here as A8_CASES is.
  const registrar = (() => {
    const d04 = read('docs/04-dialogue-trees.md');
    const a1 = d04.slice(d04.indexOf('**`SUM_A1`'), d04.indexOf('**`SUM_B1`'));
    const row = /^\| 1 \|[^|]*\|[^|]*\|(.+?)\|/m.exec(a1);
    if (!row) throw new Error('doc 04: SUM_A1 option 1 not found');
    const refusal = quoted(row[1].replace(/\*\([^)]*\)\*/g, ''));
    if (refusal.length < 1) throw new Error('doc 04: SUM_A1 option 1 has no reply');
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## A9 ');
    if (from < 0) throw new Error('doc 57: no A9 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const caseLine = (who, item, label) => {
      const re = new RegExp(`^> \\*\\*${who}\\*\\* · USE ${item}, \\*${label}\\* — (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`doc 57 A9: no case "${who} · USE ${item}, ${label}"`);
      const words = quoted(m[1].split('→')[0].replace(/\*\([^)]*\)\*/g, ''));
      if (!words.length) throw new Error(`doc 57 A9: "${label}" has no line`);
      return { line: words[0], sump: /^\*\*SUMP:\*\*/.test(m[1]) };
    };
    const readBack = [];
    const tail = body.slice(body.indexOf('**the read-back**'));
    let invitation = null;
    for (const m of tail.matchAll(/^> \*\*(SUMP|THAD):\*\* (.+)$/gm)) {
      const speaker = m[1] === 'SUMP' ? 'sump' : 'thad';
      const [spoken, after] = m[2].split('→');
      const words = quoted(spoken.replace(/\*\([^)]*\)\*/g, ''));
      if (after && /THE INVITATION/.test(after)) { invitation = words.map((line) => ({ speaker, line })); continue; }
      for (const line of words) readBack.push(speaker === 'thad' ? line : { speaker, line });
    }
    if (!readBack.length || !invitation) throw new Error('doc 57 A9: the read-back or the invitation line was not found');
    return {
      refusal,
      deedWith: caseLine('THE COUNTER', 'THE DEED', 'with THE SURVEY'),
      surveyAfter: caseLine('THE COUNTER', 'THE SURVEY', 'after the deed'),
      surveyBefore: caseLine('THE COUNTER', 'THE SURVEY', 'before the deed'),
      feeBefore: caseLine('REGISTRAR SUMP', 'THE FILING FEE', 'before the deed and the survey'),
      feeAfter: caseLine('REGISTRAR SUMP', 'THE FILING FEE', 'after both'),
      readBack, invitation,
    };
  })();
  const sumpSays = (line) => ({ by: 'sump', say: line });
  for (const pair of rebuilt) {
    if (pair.item === 'deed' && pair.room === 'claims_registrar' && pair.target === 'counter') {
      if (pair.say !== registrar.deedWith.line) throw new Error('doc 57 A9: the deed with the survey does not open on doc 24\'s line');
      delete pair.targetPending;
      pair.rules = [
        { case: 'with THE SURVEY', when: { T_DEED_LODGED: false }, holds: ['survey'], say: registrar.deedWith.line,
          set: { T_DEED_LODGED: true } },
        { case: 'without THE SURVEY (A6)', when: { T_DEED_LODGED: false }, ...sumpSays(registrar.refusal[0]),
          ...(registrar.refusal.length > 1 ? { then: registrar.refusal.slice(1).map((line) => ({ speaker: 'sump', line })) } : {}),
          set: { T_SURVEY_NEEDED: true }, completes: 'A6' },
      ];
    }
    if (pair.item === 'filing_fee' && pair.room === 'claims_registrar' && pair.target === 'sump') {
      if (pair.say !== registrar.feeAfter.line) throw new Error('doc 57 A9: the fee after both does not open on doc 24\'s line');
      delete pair.targetPending;
      pair.rules = [
        { case: 'after both', when: { T_SURVEY_LODGED: true, T_BORDERS_MOTT: false }, say: registrar.feeAfter.line,
          then: [...registrar.readBack, ...registrar.invitation], takes: ['filing_fee'], items: ['invitation'],
          set: { T_BORDERS_MOTT: true }, completes: 'A9' },
        { case: 'before the deed and the survey', when: { T_BORDERS_MOTT: false }, ...sumpSays(registrar.feeBefore.line) },
      ];
    }
  }
  // DOC 57 E9: THE EXECUTOR'S FORM on THE MOTT FILE, in the archive (Room 8).
  // One case, the same hand: T_SAME_HAND and E9. Its words are the document's.
  {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## E9 ');
    if (from < 0) throw new Error('doc 57: no E9 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const m = /^> \*\*THE MOTT FILE\*\* · USE THE EXECUTOR'S FORM — (.+)$/m.exec(body);
    if (!m) throw new Error('doc 57 E9: no "THE MOTT FILE · USE THE EXECUTOR\'S FORM" line');
    const [line] = quoted(m[1].split('→')[0]);
    if (!line) throw new Error('doc 57 E9: the form on the file has no line');
    rebuilt.push({
      item: 'executor_form', room: 'archive', target: 'mott_file', puzzle: 'E9', say: line,
      note: 'Doc 57 E9 (not doc 24): the executor\'s form on the Mott file -- the same hand.',
      rules: [{ case: 'the same hand', say: line, set: { T_SAME_HAND: true }, completes: 'E9' }],
    });
  }
  rebuilt.push({
    item: 'survey', room: 'claims_registrar', target: 'counter', puzzle: 'A9', say: registrar.surveyAfter.line,
    note: 'Doc 57 A9 (not doc 24): the survey on the counter, after the deed and before it.',
    rules: [
      { case: 'after the deed', when: { T_DEED_LODGED: true }, say: registrar.surveyAfter.line, takes: ['survey'],
        set: { T_SURVEY_LODGED: true } },
      { case: 'before the deed', ...sumpSays(registrar.surveyBefore.line) },
    ],
  });

  // DOC 57 E3, STEP 3: SHENG'S LOAN ON THE UNDERTAKER (errata 86 E). Three
  // cases, his words read from the section's `> **THE UNDERTAKER** · USE
  // SHENG'S LOAN, *case* -- **UNDERTAKER:** ...` lines; which flags each case
  // tests is routing, authored here as A8_CASES is. With the Reverend's figure
  // and the sizing, the loan is spent, the funeral booked (`T_FUNERAL_BOOKED`)
  // and E3 complete.
  const e3 = (() => {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## E3 ');
    if (from < 0) throw new Error('doc 57: no E3 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const line = (label) => {
      const re = new RegExp(`^> \\*\\*THE UNDERTAKER\\*\\* · USE SHENG'S LOAN, \\*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\* — \\*\\*UNDERTAKER:\\*\\* (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`doc 57 E3: no case "${label}"`);
      const words = quoted(m[1].split('→')[0].replace(/\*\([^)]*\)\*/g, ''));
      if (!words.length) throw new Error(`doc 57 E3: "${label}" has no line`);
      return words;
    };
    return {
      paid: line('with `T_SOWERBY_PRICE` and `T_COFFIN_SIZED`'),
      noFigure: line('before the Reverend\'s figure'),
      noSizing: line('before the sizing'),
    };
  })();
  const undertakerSays = ([first, ...rest]) => ({ by: 'undertaker', say: first,
    ...(rest.length ? { then: rest.map((one) => ({ speaker: 'undertaker', line: one })) } : {}) });
  rebuilt.push({
    item: 'loan', room: 'undertaker', target: 'undertaker', puzzle: 'E3', say: e3.paid[0],
    note: 'Doc 57 E3 (not doc 24): SHENG\'S LOAN on the undertaker -- paid once the Reverend\'s figure and the sizing are in.',
    rules: [
      { case: 'with T_SOWERBY_PRICE and T_COFFIN_SIZED', when: { T_SOWERBY_PRICE: true, T_COFFIN_SIZED: true, T_FUNERAL_BOOKED: false },
        ...undertakerSays(e3.paid), takes: ['loan'], set: { T_FUNERAL_BOOKED: true }, completes: 'E3' },
      { case: 'before the Reverend\'s figure', when: { T_SOWERBY_PRICE: false }, ...undertakerSays(e3.noFigure) },
      { case: 'before the sizing', when: { T_COFFIN_SIZED: false }, ...undertakerSays(e3.noSizing) },
    ],
  });

  // DOC 54 AND DOC 57 B3: THE TUNING FORK ON GRIEVANCE (errata 68 F, 88 E).
  // Four cases, every line the documents': doc 54's refusal before the hum,
  // doc 57's before Thad knows where Vessel is, the success with both -- the
  // livery man's "Twelve years.", then the ride, over black, and the Nugget --
  // and doc 54's line after B3. Which flags each case tests is routing.
  const b3 = (() => {
    const caseIn = (path, heading, label) => {
      const whole = read(path);
      const from = whole.indexOf(heading);
      if (from < 0) throw new Error(`${path}: no section "${heading}"`);
      const body = whole.slice(from, whole.indexOf('\n## ', from + heading.length));
      const re = new RegExp(`^> \\*\\*GRIEVANCE\\*\\* · USE THE TUNING FORK, \\*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\* — (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`${path} B3: no case "${label}"`);
      return m[1];
    };
    const only = (cell) => {
      const words = quoted(cell.split('→')[0].replace(/\*\([^)]*\)\*/g, ''));
      if (words.length !== 1) throw new Error(`B3: expected one line in "${cell.slice(0, 60)}"`);
      return words[0];
    };
    const success = caseIn('docs/54-batch-c.md', '## B3 — the Grievance puzzle', 'after `T_HUM_HEARD`');
    const livery = /\*\*LIVERY MAN:\*\* "([^"]+)"/.exec(success)?.[1];
    const both = caseIn('docs/57-puzzle-completion.md', '## B3 ', 'with both');
    const ride = /over black: "([^"]+)"/.exec(both)?.[1];
    if (!livery || !ride) throw new Error('B3: the success line or the ride is missing');
    return {
      before: only(caseIn('docs/54-batch-c.md', '## B3 — the Grievance puzzle', 'before the livery man has hummed')),
      after: only(caseIn('docs/54-batch-c.md', '## B3 — the Grievance puzzle', 'after B3')),
      vague: only(caseIn('docs/57-puzzle-completion.md', '## B3 ', 'after `T_HUM_HEARD`, without `T_VESSEL_LOCATION`')),
      livery, ride,
    };
  })();
  // DOC 57 A2: THE PARLOR PIANO ANSWERS BY CIRCUMSTANCE (errata 91 E). Doc 24's
  // line stays the success's first; doc 57 writes the clerk's after it, the
  // refusal before he has agreed, and the line after A2. `T_ROOM_GRANTED` is
  // the room given, which opens the stairs.
  {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## A2 ');
    if (from < 0) throw new Error('doc 57: no A2 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const caseOf = (label) => {
      const re = new RegExp(`^> \\*\\*THE PARLOR PIANO\\*\\* · USE THE TUNING FORK, \\*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\* — (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`doc 57 A2: no case "${label}"`);
      return m[1].split('→')[0];
    };
    const before = quoted(caseOf('before `T_TUNES_PIANOS`'))[0];
    const success = caseOf('after `T_TUNES_PIANOS`');
    const clerk = /\*\*CLERK:\*\* "([^"]+)"/.exec(success)?.[1];
    const after = quoted(caseOf('after A2'))[0];
    const pair = rebuilt.find((one) => one.item === 'tuning_fork' && one.room === 'hotel_lobby' && one.target === 'parlor_piano');
    if (!pair || !before || !clerk || !after) throw new Error('doc 57 A2: the piano\'s cases do not read');
    if (!success.includes(pair.say)) throw new Error('doc 57 A2: the success is not doc 24\'s line');
    pair.puzzle = 'A2';
    pair.rules = [
      { case: 'after A2', when: { T_ROOM_GRANTED: true }, say: after },
      { case: 'after T_TUNES_PIANOS', when: { T_TUNES_PIANOS: true }, say: pair.say,
        then: [{ speaker: 'hotel_clerk', line: clerk }], set: { T_ROOM_GRANTED: true }, completes: 'A2' },
      { case: 'before T_TUNES_PIANOS', when: { T_TUNES_PIANOS: false }, say: before },
    ];
  }
  // DOC 57 A7: MADAME OZYMANDIA'S FEE AND THE MAP (errata 89 E). Three cases,
  // the words read from the section; a reply after **OZYMANDIA:** alternates
  // speaker at each " — " between quotes (hers, then Thad's, then hers).
  const a7 = (() => {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## A7 ');
    if (from < 0) throw new Error('doc 57: no A7 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const caseOf = (item, label) => {
      const re = new RegExp(`^> \\*\\*MADAME OZYMANDIA\\*\\* · USE ${item}, \\*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\* — (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`doc 57 A7: no case "${item}, ${label}"`);
      const cell = m[1].split('→')[0].replace(/\*\([^)]*\)\*/g, '');
      const [before, after] = cell.split('**OZYMANDIA:**');
      const lines = quoted(before ?? '').map((line) => ({ speaker: 'thad', line: line.replace(/\*/g, '') }));
      if (after !== undefined) {
        after.split(/"\s+—\s+"/).forEach((turn, n) => {
          for (const line of quoted(`"${turn.trim().replace(/^"|"$/g, '')}"`)) {
            lines.push({ speaker: n % 2 === 0 ? 'ozymandia' : 'thad', line: line.replace(/\*/g, '') });
          }
        });
      }
      if (!lines.length) throw new Error(`doc 57 A7: "${label}" has no line`);
      return lines;
    };
    return {
      fee: caseOf('THE FILING FEE', 'after OZY_A1 option 1'),
      map: caseOf('THE COMPANY MAP', 'after `T_OZY_PAID`'),
      unpaid: caseOf('THE COMPANY MAP', 'not yet paid'),
    };
  })();
  const spokenBy = ([first, ...rest]) => ({ ...(first.speaker === 'thad' ? {} : { by: first.speaker }), say: first.line,
    ...(rest.length ? { then: rest.map((one) => ({ speaker: one.speaker, line: one.line })) } : {}) });
  rebuilt.push({
    item: 'filing_fee', room: 'ozymandias_tent', target: 'ozymandia', puzzle: 'A7', say: a7.fee[0].line,
    note: 'Doc 57 A7, step 3: the filing fee becomes a divining fee, once she has named her price (OZY_A1 option 1).',
    rules: [
      { case: 'after OZY_A1 option 1', when: { T_OZY_ASKED: true, T_OZY_PAID: false }, ...spokenBy(a7.fee), takes: ['filing_fee'], set: { T_OZY_PAID: true } },
    ],
  });
  rebuilt.push({
    item: 'company_map', room: 'ozymandias_tent', target: 'ozymandia', puzzle: 'A7', say: a7.map[0].line,
    note: 'Doc 57 A7: the map divined -- THE SURVEY, on Form 12-C. She hands the map back.',
    rules: [
      // NOT ONCE THE SURVEY IS LODGED (the items audit, errata 140): Sump
      // keeps it at A9, and with no bound here the map on her again handed
      // a second survey back after the first was on file. After that she has
      // no case, and the map's own pool answers.
      { case: 'after T_OZY_PAID', when: { T_OZY_PAID: true, T_SURVEY_LODGED: false }, ...spokenBy(a7.map), items: ['survey'], completes: 'A7' },
      { case: 'not yet paid', when: { T_OZY_PAID: false }, ...spokenBy(a7.unpaid) },
    ],
  });
  // DOC 57 E6: THE EXECUTOR'S FORM (errata 93 G). HOB_E6 option 1 gives it
  // (doc 04); Sump accepts it once the death is recorded (`T_DECEASED`) and
  // refuses it before. Anyone else asked is answered by the interest rule:
  // Winnie and Frame here; Sheng's room is not built, so his line waits.
  // A reply after **NAME:** alternates speaker at each " — " between quotes
  // (theirs, then Thad's, then theirs); italic directions are staging.
  {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## E6 ');
    if (from < 0) throw new Error('doc 57: no E6 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const esc = (v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const caseOf = (who, label, speaker, tag) => {
      const re = new RegExp(`^> \\*\\*${esc(who)}\\*\\* · USE THE EXECUTOR'S FORM${label ? `, \\*${esc(label)}\\*` : ''} — \\*\\*${tag}:\\*\\* (.+)$`, 'm');
      const m = re.exec(body);
      if (!m) throw new Error(`doc 57 E6: no case "${who} · USE THE EXECUTOR'S FORM${label ? `, ${label}` : ''}"`);
      const cell = m[1].split('→')[0].replace(/\*\([^)]*\)\*/g, '');
      const lines = [];
      cell.split(/"\s+—\s+"/).forEach((turn, n) => {
        for (const line of quoted(`"${turn.trim().replace(/^"|"$/g, '')}"`)) {
          lines.push({ speaker: n % 2 === 0 ? speaker : 'thad', line: line.replace(/\*/g, '') });
        }
      });
      if (!lines.length) throw new Error(`doc 57 E6: "${who}" has no line`);
      return lines;
    };
    const said = ([first, ...rest]) => ({ by: first.speaker, say: first.line,
      ...(rest.length ? { then: rest.map((one) => ({ speaker: one.speaker, line: one.line })) } : {}) });
    const accepted = caseOf('REGISTRAR SUMP', 'with `T_DECEASED`', 'sump', 'SUMP');
    const early = caseOf('REGISTRAR SUMP', 'before `T_DECEASED`', 'sump', 'SUMP');
    rebuilt.push({
      item: 'executor_form', room: 'claims_registrar', target: 'sump', puzzle: 'E6', say: accepted[0].line,
      note: 'Doc 57 E6, step 2: the form Hob signed (HOB_E6 option 1), to Sump. The form is handed back; it is never consumed.',
      rules: [
        { case: 'with T_DECEASED', when: { T_DECEASED: true }, ...said(accepted), set: { T_EXECUTOR_NAMED: true }, completes: 'E6' },
        { case: 'before T_DECEASED', when: { T_DECEASED: false }, ...said(early) },
      ],
    });
    // ERRATA 125: Sheng's, Pratt's and Sowerby's refusals waited for their
    // rooms (errata 93 G); the laundry, Pratt's claim and the church are built.
    // The fairness audit found E6 "an elimination puzzle with nothing to
    // eliminate" with only two of doc 57's five refusals shipped.
    for (const [who, tag, speaker, room] of [['WINNIE', 'WINNIE', 'winnie', 'assay_office'], ['IGNATIUS FRAME', 'FRAME', 'frame', 'clarion'],
      ['AH-LAM SHENG', 'SHENG', 'sheng', 'laundry'], ['NICKEL PRATT', 'PRATT', 'pratt', 'pratts_claim'], ['REVEREND SOWERBY', 'SOWERBY', 'sowerby', 'church']]) {
      const lines = caseOf(who, null, speaker, tag);
      rebuilt.push({
        item: 'executor_form', room, target: speaker, puzzle: 'E6', say: lines[0].line,
        note: `Doc 57 E6: asked to be executor, ${who.toLowerCase()} is answered by the interest rule. The form stays with Thad.`,
        rules: [{ case: 'any time', ...said(lines) }],
      });
    }
  }
  // DOC 54 A5 AND DOC 57 F1 ON THE HOLE (errata 68 A, errata 96 F). The bait,
  // the smoke and the blanket are doc 54's lines, each Thad's, the italic
  // brackets staging; while the fumes last, any verb on the hole is doc 54's
  // fumes line. The blanket's success is doc 54's (doc 24's row is superseded:
  // "doc 54's success line governs"); the hole is `hole` in Room 23/24,
  // `prosperity`. F1's pickaxe is doc 57's two cases; Room 34 is not built.
  {
    const d54 = read('docs/54-batch-c.md');
    const at = d54.indexOf('## A5 — the raccoon');
    if (at < 0) throw new Error('doc 54: no A5 section');
    const body = d54.slice(at, d54.indexOf('\n---', at));
    const attempt = (head) => {
      const line = body.split('\n').find((one) => one.startsWith(head));
      if (!line) throw new Error(`doc 54 A5: no line starting "${head}"`);
      const words = quoted(line.split(' — ').slice(1).join(' — ').split('→')[0].replace(/\*\([^)]*\)\*/g, ''));
      if (!words.length) throw new Error(`doc 54 A5: "${head}" has no line`);
      return words;
    };
    const bait = attempt('**The bait**');
    const smoke = attempt('**The smoke**');
    const fumes = attempt('> While the fumes last')[0];
    const blanket = attempt('**The blanket**');
    const after = attempt('> USE THE LIVERY BLANKET on THE HOLE, after')[0];
    const say = ([first, ...rest]) => ({ say: first, ...(rest.length ? { then: rest } : {}) });
    const inFumes = { case: 'while the fumes last', when: { T_FUMES: true }, say: fumes };
    const old = rebuilt.findIndex((one) => one.item === 'blanket' && one.room === 'prosperity');
    if (old < 0) throw new Error('doc 24: no blanket pair for the hole');
    rebuilt.splice(old, 1, {
      item: 'blanket', room: 'prosperity', target: 'hole', puzzle: 'A5', say: blanket[0],
      note: 'Doc 54 A5 (errata 68 A): the blanket over the hole turns it cold and the raccoon leaves at a walk; Thad takes the blanket back. Doc 54\'s success line governs doc 24\'s.',
      rules: [
        inFumes,
        { case: 'after', when: { T_WARM_HOLE: true }, say: after },
        { case: 'with the raccoon in', when: { T_WARM_HOLE: false }, ...say(blanket), set: { T_WARM_HOLE: true }, completes: 'A5' },
      ],
    });
    rebuilt.push({
      item: 'eggs', room: 'prosperity', target: 'hole', puzzle: 'A5', say: bait[0],
      note: 'Doc 54 A5, the bait: three more raccoons arrive and settle in around the first; the eggs are spent; the three are gone the next time Thad enters (T_RACCOON_MEETING, cleared on leaving).',
      rules: [inFumes, { case: 'with the raccoon in', when: { T_WARM_HOLE: false }, ...say(bait), takes: ['eggs'], set: { T_RACCOON_MEETING: true } }],
    });
    rebuilt.push({
      item: 'tonic', room: 'prosperity', target: 'hole', puzzle: 'A5', say: smoke[0],
      note: 'Doc 54 A5, the smoke: it fumes; the tonic is spent; the hole and the raccoon refuse every verb until Thad leaves and returns (T_FUMES, cleared on leaving).',
      rules: [inFumes, { case: 'with the raccoon in', when: { T_WARM_HOLE: false }, ...say(smoke), takes: ['tonic'], set: { T_FUMES: true } }],
    });
    const d57 = read('docs/57-puzzle-completion.md');
    const f1 = d57.slice(d57.indexOf('## F1 '), d57.indexOf('\n## ', d57.indexOf('## F1 ') + 5));
    const pick = (label) => {
      const m = new RegExp(`^> \\*\\*THE HOLE\\*\\* · USE THE PICKAXE, \\*${label}\\* — (.+)$`, 'm').exec(f1);
      if (!m) throw new Error(`doc 57 F1: no pickaxe case "${label}"`);
      return quoted(m[1].split('→')[0])[0];
    };
    rebuilt.push({
      item: 'pickaxe', room: 'prosperity', target: 'hole', puzzle: 'F1', say: pick('after F1'),
      note: 'Doc 57 F1: the pickaxe on the hole, after the draught is understood: three days, forty feet. "Room 34 opens below the hole": the line is read and he is in Room 34, and the hole is the way down from then on (T_DUG_DOWN, errata 99 H).',
      rules: [
        { case: 'after F1', when: { T_DRAUGHT: true }, say: pick('after F1'), set: { T_DUG_DOWN: true }, goto: 'under_prosperity' },
        { case: 'before F1', when: { T_DRAUGHT: false }, say: pick('before F1') },
      ],
    });
    // DOC 54 ROOM 33's F3 (errata 70 E): the pickaxe on the rock, before the
    // void; on the void, three swings, the head flying off twice. Each case's
    // directions and words are read in the order the document writes them --
    // a direction performed as one (doc 58), a quote as Thad's line -- and the
    // third, which is all direction, carries doc 57 F3's too: the piece of
    // wall that is THE SAMPLE. The void is known from the ninety seconds on
    // (T_IN_TUNE): before it, the rock's case answers wherever he swings.
    const r33 = d54.slice(d54.indexOf('# ROOM 33 · THE LISTENING CHAMBER'));
    const f3Body = r33.slice(r33.indexOf('## F3'), r33.indexOf('\n## ', r33.indexOf('## F3') + 5));
    const performed = (text) => [...text.matchAll(/\*\(([^)]*)\)\*|"([^"]+)"/g)]
      .map((m) => (m[1] !== undefined ? { speaker: 'thad', line: m[1], direction: true } : m[2]));
    const swing = (subject, label) => {
      const m = new RegExp(`^> \\*\\*${subject}\\*\\* · USE THE PICKAXE, \\*${label}\\* — (.+)$`, 'm').exec(f3Body);
      if (!m) throw new Error(`doc 54 Room 33: no "${subject} · USE THE PICKAXE, ${label}"`);
      return performed(m[1].split('→')[0]);
    };
    const asRule = ([first, ...rest]) => ({
      ...(typeof first === 'string' ? { say: first } : { say: first.line, direction: true }),
      ...(rest.length ? { then: rest } : {}),
    });
    const f3 = d57.slice(d57.indexOf('## F3 '), d57.indexOf('\n## ', d57.indexOf('## F3 ') + 5));
    const piece = performed(/^> (\*\(.+?\)\*) →/m.exec(f3)?.[1] ?? '');
    if (!piece.length) throw new Error('doc 57 F3: no direction for the piece of wall');
    rebuilt.push({
      item: 'pickaxe', room: 'listening_chamber', target: 'every_rock_surface', puzzle: 'F3', say: swing('THE ROCK', 'before the void is found')[0],
      note: 'Doc 54 Room 33 (errata 70 E): the pickaxe on the rock before the void is found; on the void, three swings, then F3 -- THE SAMPLE, T_BROKE_THROUGH, T_STRIKE_FOUND -- and Room 34\'s second state (errata 69 A, 99 H).',
      rules: [
        { case: 'before the void is found', when: { T_IN_TUNE: false }, ...asRule(swing('THE ROCK', 'before the void is found')) },
        { case: 'first', when: { T_IN_TUNE: true, T_BROKE_THROUGH: false, PICK_SWINGS: 0 }, ...asRule(swing('THE VOID', 'first')), add: { PICK_SWINGS: 1 } },
        { case: 'second', when: { T_IN_TUNE: true, T_BROKE_THROUGH: false, PICK_SWINGS: 1 }, ...asRule(swing('THE VOID', 'second')), add: { PICK_SWINGS: 1 } },
        { case: 'third', when: { T_IN_TUNE: true, T_BROKE_THROUGH: false, PICK_SWINGS: 2 }, ...asRule([...swing('THE VOID', 'third'), ...piece]),
          items: ['sample'], set: { T_BROKE_THROUGH: true, T_STRIKE_FOUND: true }, completes: 'F3', goto: 'under_prosperity' },
      ],
    });
  }
  // DOC 57 C3, STEP 3: THE LETTER ON SOWERBY (errata 90 E), after SOW_A1
  // option 5. Thad's line, then every quote after **SOWERBY:** is his.
  const c3 = (() => {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## C3 ');
    if (from < 0) throw new Error('doc 57: no C3 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const m = /^> \*\*REVEREND SOWERBY\*\* · USE THE LETTER, \*after SOW_A1 option 5\* — (.+)$/m.exec(body);
    if (!m) throw new Error('doc 57 C3: no letter case');
    const cell = m[1].split('→')[0].replace(/\*\([^)]*\)\*/g, '');
    const [before, after] = cell.split('**SOWERBY:**');
    const thad = quoted(before);
    const his = quoted(after ?? '');
    if (thad.length !== 1 || !his.length) throw new Error('doc 57 C3: the letter case does not read');
    return { thad: thad[0], his };
  })();
  rebuilt.push({
    item: 'letter', room: 'church', target: 'sowerby', puzzle: 'C3', say: c3.thad,
    note: 'Doc 57 C3, step 3: the letter of introduction is his standing to arrange the memorial; Sowerby gives it back.',
    rules: [
      { case: 'after SOW_A1 option 5', when: { T_SOW_FUNERAL_ASKED: true, T_MEMORIAL_BOOKED: false }, say: c3.thad,
        then: c3.his.map((line) => ({ speaker: 'sowerby', line })), set: { T_MEMORIAL_BOOKED: true } },
    ],
  });
  rebuilt.push({
    item: 'tuning_fork', room: 'livery', target: 'grievance', puzzle: 'B3', say: b3.livery,
    note: 'Doc 57 B3 (with doc 54\'s lines): the fork on Grievance. With the hum and Vessel\'s whereabouts, the corrected tune, "Twelve years.", the ride over black, and Thad placed in the Nugget (errata 73 B).',
    rules: [
      { case: 'after B3', when: { T_VESSEL_FOUND: true }, say: b3.after },
      { case: 'with both', when: { T_HUM_HEARD: true, T_VESSEL_LOCATION: true }, by: 'livery_man', say: b3.livery,
        then: [{ speaker: 'thad', line: b3.ride, overBlack: true }], set: { T_VESSEL_FOUND: true }, completes: 'B3', goto: 'nugget' },
      { case: 'after T_HUM_HEARD, without T_VESSEL_LOCATION', when: { T_HUM_HEARD: true }, say: b3.vague },
      { case: 'before the livery man has hummed', when: { T_HUM_HEARD: false }, say: b3.before },
    ],
  });

  // DOC 57 F5, BEAT 1: THE DOCUMENTS ON THE COUNTER (doc 48 S6). After F4, each
  // laid down once, by USE on THE COUNTER, in any order; each line is doc 57's,
  // Sump's and Winnie's by their names and Thad's where the cell gives none; the
  // italic directions are performed. Laying the fourth makes the name line
  // (SUM_F1) the Registrar's. Anything else he has given the office before, or
  // a paper already down, is "Already on file". A case comes FIRST on a pair that
  // already exists (THE DEED's A9 filing), so Act IV's counter answers Act IV.
  const f5 = (() => {
    const whole = read('docs/57-puzzle-completion.md');
    const from = whole.indexOf('## F5 ');
    if (from < 0) throw new Error('doc 57: no F5 section');
    const body = whole.slice(from, whole.indexOf('\n## ', from + 5));
    const WHO = { SUMP: 'sump', WINNIE: 'winnie' };
    const cases = {};
    for (const m of body.matchAll(/^> \*\*THE COUNTER\*\* · USE (.+?) — (.+)$/gm)) {
      const lines = [];
      let speaker = 'thad';
      for (const span of m[2].matchAll(/\*\*([A-Z]+):\*\*|\*\(([^)]+)\)\*|"([^"]+)"|— /g)) {
        if (span[1]) { speaker = WHO[span[1]] ?? (() => { throw new Error(`doc 57 F5: unknown speaker ${span[1]}`); })(); continue; }
        if (span[0] === '— ') { speaker = 'thad'; continue; }
        if (span[2] !== undefined) {
          const shown = performedDirection(span[2]);
          if (shown) lines.push({ speaker: lines.length ? lines[lines.length - 1].speaker : speaker, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
          continue;
        }
        lines.push({ speaker, line: span[3] });
      }
      cases[m[1].trim()] = lines;
    }
    return cases;
  })();
  const F5_ITEMS = { 'THE DEATH CERTIFICATE': 'death_certificate', 'THE DEED': 'deed', 'THE CERTIFICATE': 'document_c', 'THE SAMPLE': 'sample' };
  const onFile = f5['anything else Thad has given the office before'];
  if (!onFile || Object.keys(F5_ITEMS).some((name) => !f5[name])) throw new Error('doc 57 F5: the counter cases do not read');
  const asCase = (lines) => ({ by: lines[0].speaker === 'thad' ? undefined : lines[0].speaker, say: lines[0].line,
    ...(lines[0].direction ? { direction: true } : {}), then: lines.slice(1) });
  const counterPair = (item) => {
    let pair = rebuilt.find((one) => one.item === item && one.room === 'claims_registrar' && one.target === 'counter');
    if (!pair) {
      pair = { item, room: 'claims_registrar', target: 'counter', puzzle: 'F5', otherwise: 'pool',
        note: 'Doc 57 F5 beat 1: laid on the counter at the filing; otherwise the item\'s own pool answers (doc 24 tier 2).', rules: [] };
      rebuilt.push(pair);
    }
    pair.rules ??= [];
    return pair;
  };
  for (const [name, item] of Object.entries(F5_ITEMS)) {
    const laid = `T_F5_${item.toUpperCase()}`;
    const pair = counterPair(item);
    const clean = (rule) => Object.fromEntries(Object.entries(rule).filter(([, v]) => v !== undefined));
    pair.rules.unshift(
      clean({ case: 'at the filing', when: { T_FANSHAWE_BEATEN: true, T_FILED: false, [laid]: false }, ...asCase(f5[name]),
        set: { [laid]: true }, add: { F5_LAID: 1 } }),
      clean({ case: 'at the filing, already down', when: { T_FANSHAWE_BEATEN: true, T_FILED: false }, ...asCase(onFile) }),
    );
  }
  // EVERYTHING HE HAS GIVEN THE OFFICE BEFORE: the survey and the fee (A9),
  // the three documents (E0), and the executor's form (E6, accepted and
  // handed back). The form and a second fee fell to a pool here (the items
  // audit, errata 140).
  for (const item of ['survey', 'filing_fee', 'document_a', 'document_b', 'document_d', 'executor_form']) {
    const pair = counterPair(item);
    pair.rules.unshift(Object.fromEntries(Object.entries({ case: 'at the filing', when: { T_FANSHAWE_BEATEN: true, T_FILED: false }, ...asCase(onFile) }).filter(([, v]) => v !== undefined)));
  }


  const pools = {};
  let current = null;
  let inPools = false;
  for (const line of doc.split('\n')) {
    if (line.startsWith('# 2 ')) { inPools = true; continue; }
    if (line.startsWith('# 3 ')) { inPools = false; continue; }
    if (!inPools) continue;
    const head = line.match(/^## (.+?)(?: — .*)?$/);
    if (head) { current = head[1].split('·').map((name) => name.trim()); continue; }
    const quote = line.trim().match(/^> "(.+)"$/);
    if (quote && current) for (const name of current) (pools[name] ??= []).push(quote[1]);
  }
  const global = [];
  let inGlobal = false;
  for (const line of doc.split('\n')) {
    if (line.startsWith('# 3 ')) { inGlobal = true; continue; }
    if (line.startsWith('# 4 ')) break;
    const quote = line.trim().match(/^> "(.+)"$/);
    if (inGlobal && quote) global.push(quote[1]);
  }

  // Pool heads resolve to item ids by NAME, not by contents. Matching on the
  // lines looked equivalent and was not: "FOUR DOLLARS · THE FILING FEE" heads
  // one pool that two items share, so a contents-first match found the same id
  // twice and dropped the filing fee's pool without saying anything. The whole
  // point of extracting rather than transcribing is that content cannot go
  // missing quietly, so this resolves by name and fails loudly.
  const itemIds = new Set(JSON.parse(read('content/manifest.json')).items
    .map((path) => JSON.parse(read(path)).id));
  const itemPools = {};
  // DOC 57 A5: "doc 24's A5 row and blanket pool now name THE LIVERY BLANKET"
  // -- the one blanket (errata 75); doc 24 still heads it HORSE BLANKET.
  const RENAMED = { horse_blanket: 'blanket' };
  for (const [name, lines] of Object.entries(pools)) {
    const id = RENAMED[slug(name)] ?? slug(name);
    if (!itemIds.has(id)) throw new Error(`doc 24: no item "${id}" for the pool headed "${name}"`);
    itemPools[id] = lines;
  }

  return write('content/combinations.json', {
    ...existing, pairs: rebuilt, itemPools, globalPool: global,
  });
}

// ---------------------------------------------------------------------------


// ---------------------------------------------------------------------------

/**
 * Doc 14's Room 2 exits, ALL FIVE.
 *
 * Only THE ASSAY OFFICE used to be read here: the other four "were
 * transcribed before the extraction rule was binding", so their lines lived in
 * main-street.json and nowhere read them again. That held until errata 100's
 * voice pass rewrote doc 14 and the game kept the old words -- and one of them
 * had already drifted, "storeys" in the room file against doc 14's "stories".
 * The rest were converted "when next touched", which is now.
 *
 * Each section heading names the doorway as the player sees it; the table
 * maps it to the exit's id. A heading not in the table, or an exit the table
 * names that the room does not have, is an error rather than a skip.
 */
const ROOM_02_EXITS = {
  "THE NUGGET'S DOORS \u2192 Room 3": 'to_nugget',
  'THE CLARION OFFICE \u2192 Room 9': 'to_clarion',
  'THE IMPROVEMENT COMPANY \u2192 Room 10': 'to_company',
  'THE ROAD TO THE CLAIMS \u2192 Room 22': 'to_claims_road',
  'THE ASSAY OFFICE \u2192 Room 5': 'to_assay_office',
};

function room02Exits() {
  // AND THE CANDIDATE STREET, whose lines are the shipping street's on a new
  // plate (doc 36 Q116). Its exits are carried by compile-room from its own
  // file, so without this they keep whatever words they were copied with --
  // "storeys" outlived the shipping room's fix there.
  return ['content/rooms/main-street.json', 'content/rooms/main-street-candidate.json']
    .filter((path) => existsSync(resolve(ROOT, path)))
    .map((path) => room02ExitsInto(path));
}

function room02ExitsInto(path) {
  const doc = read('docs/14-room-02-exits.md');
  const room = JSON.parse(read(path));

  for (const [heading, id] of Object.entries(ROOM_02_EXITS)) {
    const section = doc.split(`## ${heading}`)[1]?.split(/^---$|^## /m)[0];
    if (!section) throw new Error(`doc 14: no "${heading}" section`);
    const exit = room.exits.find((entry) => entry.id === id);
    if (!exit) throw new Error(`doc 14: ${path} has no ${id} exit`);

    for (const [verb, word] of [['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
      const block = section.split(`**${word}**`)[1];
      if (!block) throw new Error(`doc 14: ${id} has no ${word} run`);
      const lines = [];
      for (const line of block.split('\n')) {
        const numbered = line.match(/^(\d)\. "(.+)"$/);
        if (numbered) lines[Number(numbered[1]) - 1] = numbered[2];
        else if (line.startsWith('**') && lines.length) break;
      }
      if (lines.length !== 3 || lines.some((line) => line === undefined)) {
        throw new Error(`doc 14: ${id} ${word} has ${lines.filter(Boolean).length} of 3 variants`);
      }
      exit.responses = exit.responses ?? {};
      const rules = exit.responses[verb] ?? [{}];
      rules[0].say = lines[0];
      rules[0].repeat = lines.slice(1);
      exit.responses[verb] = rules;
    }

    const overrides = {};
    for (const entry of section.matchAll(/^> (\w[\w ]*?) \u2014 "(.+)"$/gm)) {
      overrides[entry[1].trim().replace(/ /g, '_')] = entry[2];
    }
    if (Object.keys(overrides).length) exit.overrides = { ...(exit.overrides ?? {}), ...overrides };

    // THE STUB MARKING COMES OFF. `stub` means the destination exists so the
    // exit works with its examine layer honestly absent -- a lie once doc 14
    // covers it.
    delete exit.stub;
  }
  return write(path, room);
}

// ---------------------------------------------------------------------------

/**
 * Docs 08 and 09, for the hotspots doc 26 writes REPEATS for.
 *
 * Doc 26 numbers those runs from 2, because variant 1 was written in the
 * examine-layer batches and stands. So the batch document alone cannot fill a
 * hotspot: the first line -- the only one most players will ever read -- lives
 * in the older doc and is fetched from it rather than restated.
 *
 * ACT-QUALIFIED LINES. Docs 08 and 09 write some LOOK lines per act:
 * `**LOOK Act I:**`, `**LOOK Acts I-III:**`, `**LOOK Act IV:**`. THERE IS NO
 * ACT MECHANISM -- no flag, no writer, and Phase 1 is explicit that Acts I to
 * IV are not being built. So the Act I line is wired and every other act's is
 * collected and reported by name. Inventing an ACT flag to gate lines nothing
 * can set would be building the act system in order to look complete.
 */
function priorVariantOne(docPath, roomNumber, name) {
  const doc = read(docPath);
  const sections = doc.split(/^## ROOM (\d+) — /m).slice(1);
  const unwired = [];
  for (let index = 0; index < sections.length; index += 2) {
    if (Number(sections[index]) !== roomNumber) continue;
    for (const entry of sections[index + 1].matchAll(/^\*\*(.+?)\*\*\n((?:> .*\n)+)/gm)) {
      if (plain(entry[1]) !== name) continue;
      const said = {};
      for (const row of entry[2].matchAll(/^> \*\*(LOOK|LISTEN)(.*?):\*\* "(.+)"$/gm)) {
        const [, verb, qualifier, line] = row;
        // The unqualified line, or the one whose qualifier covers Act I.
        // /Acts? I\b/ matches "Act I" and "Acts I-III" and NOT "Act III" --
        // the word boundary is doing real work and an /I/ without it wired
        // the Act III coat as the Act I coat.
        if (!qualifier || /Acts? I\b/.test(qualifier)) said[verb] = line;
        else unwired.push({ label: `${name} ${verb}${qualifier}`, line });
      }
      return { said, unwired };
    }
  }
  return null;
}

/**
 * Every act-qualified line in a room's prior section, attributed or not.
 *
 * priorVariantOne only sees entries written as a standalone `**NAME**`
 * heading. Doc 08 writes some hotspots as a parenthetical inside a group line
 * -- `> *(The coat — **LOOK Act I:** "..." **LOOK Act III:** "...")*` -- and
 * the Act III coat was invisible to the extractor for that reason alone:
 * written, unwired, and not on the list of things known to be unwired, which
 * is the worse of the two.
 *
 * This sweeps the whole section and the caller subtracts what it already
 * knows about, so an unattributed line is reported by its text rather than
 * silently absent.
 */
function actLinesIn(docPath, roomNumber) {
  const doc = read(docPath);
  const sections = doc.split(/^## ROOM (\d+) — /m).slice(1);
  const found = [];
  for (let index = 0; index < sections.length; index += 2) {
    if (Number(sections[index]) !== roomNumber) continue;
    for (const row of sections[index + 1].matchAll(/\*\*LOOK (Acts? [^:*]*?):\*\* "(.+?)"/g)) {
      const [, qualifier, line] = row;
      if (/^Acts? I\b/.test(qualifier)) continue;
      found.push({ label: `LOOK ${qualifier}`, line });
    }
  }
  return found;
}

/**
 * Doc 26: Rooms 18, 19 and 13, completing the hotspots docs 08 and 09 marked
 * "(working script)".
 *
 * Same four kinds of entry as doc 25, and four differences that are the
 * document being written by a person rather than to a grammar:
 *
 *   - a LOOK run can carry an act qualifier -- `**LOOK Acts I-II**`;
 *   - a repeat entry can have no LOOK run at all, when the LOOK lines are
 *     act-variant and live elsewhere;
 *   - an override can carry a trailing instruction in italics, and one of
 *     them is load-bearing: THE COFFINS' USE line must never gain a variant;
 *   - an exit can defer to a hotspot's lines instead of repeating them, and
 *     can lead to the map rather than to a numbered room.
 *
 * None of those is normalised away. The parser reads what is on the page.
 */
function roomsBatchA() {
  const doc = read('docs/26-batch-a.md');
  const sections = doc.split(/^# ROOM (\d+) · /m).slice(1);
  const written = [];

  const FILE = {
    18: 'content/rooms/hotel-lobby.json',
    19: 'content/rooms/thads-room.json',
    13: 'content/rooms/undertaker.json',
  };
  //: Which examine-layer batch wrote variant 1 for each room.
  const PRIOR = {
    18: 'docs/09-examine-batch-2.md',
    19: 'docs/08-examine-batch-1.md',
    13: 'docs/09-examine-batch-2.md',
  };
  const VERBS = { LOOK: 'LOOK_AT', LISTEN: 'LISTEN_TO' };
  const unwiredActLines = [];
  const coverage = [];
  const named = new Set();
  const gaps = [];

  for (let index = 0; index < sections.length; index += 2) {
    const number = Number(sections[index]);
    const body = sections[index + 1];
    // ROOM 13 IS COMPILED NOW (errata 86): tools/compile-room.mjs builds it
    // from content/examine/room-13.json, which carries doc 26's lines merged
    // with docs 05, 09 and 54. This pass would rewrite a file it no longer owns.
    if (number === 13 || number === 18 || number === 19) continue;   // compiled by compile-room from annotations (errata 86, 91, 92)
    const path = FILE[number];
    if (!path) throw new Error(`doc 26: no room file for room ${number}`);
    const room = JSON.parse(read(path));

    const byName = new Map();
    for (const target of [...room.hotspots, ...room.exits]) byName.set(target.name, target);
    const lineFor = (name) => {
      const exact = byName.get(name);
      if (exact) return exact;
      const near = [...byName.keys()].filter((full) => full.startsWith(name));
      if (near.length === 1) return byName.get(near[0]);
      throw new Error(`doc 26 room ${number}: "${name}" matches ${near.length} hotspots`);
    };

    // --- newly written hotspots: a ### heading, a LOOK run and a LISTEN run.
    for (const block of body.matchAll(
      /^### (.+?)\n\*\*LOOK(.*?)\*\*(.+?)\n\*\*LISTEN(.*?)\*\*(.+?)$/gm)) {
      const [, name, lookQualifier, look, listenQualifier, listen] = block;
      const target = byName.get(plain(name));
      if (!target) {
        throw new Error(`doc 26 room ${number}: "${plain(name)}" is written but the room `
          + 'has no hotspot with that name');
      }
      for (const [verb, run, qualifier] of [
        [VERBS.LOOK, look, lookQualifier], [VERBS.LISTEN, listen, listenQualifier],
      ]) {
        const said = variants(run);
        if (said.some((line) => line === undefined) || said.length < 1) {
          throw new Error(`doc 26 room ${number}: ${plain(name)} ${verb} run has a gap`);
        }
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
        if (qualifier.trim()) coverage.push(`${plain(name)} ${verb} covers${qualifier}`);
      }
    }

    // --- a NAMED BLOCK: a name, a correction in italics, then its own
    //     numbered runs starting at 1. The shape doc 26 reached for when a
    //     hotspot's variant 1 turned out not to exist in the earlier doc --
    //     the correction is prose, and the lines below it are the entry.
    //
    //     It is matched before the repeat form and cannot collide with it:
    //     a repeat entry carries " | LISTEN " on the name's own line and
    //     this one carries nothing but the correction.
    for (const block of body.matchAll(
      /^\*\*(.+?)\*\* — \*[^\n]*\*\n\n\*\*LOOK(.*?)\*\*(.+?)\n\*\*LISTEN(.*?)\*\*(.+?)$/gm)) {
      const [, rawName, lookQualifier, look, listenQualifier, listen] = block;
      const name = plain(rawName);
      const target = lineFor(name);
      named.add(name);
      // Consulted for what it does NOT wire. The prior doc still carries this
      // hotspot's other acts, and they are reported even though doc 26 now
      // writes Act I's three variants here.
      const prior = priorVariantOne(PRIOR[number], number, name);
      if (prior) unwiredActLines.push(...prior.unwired);

      for (const [verb, run, qualifier] of [
        [VERBS.LOOK, look, lookQualifier], [VERBS.LISTEN, listen, listenQualifier],
      ]) {
        const said = variants(run);
        if (said.length < 1 || said.some((line) => line === undefined)) {
          throw new Error(`doc 26 room ${number}: ${name} ${verb} run has a gap`);
        }
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
        if (qualifier.trim()) coverage.push(`${name} ${verb} covers${qualifier}`);
      }
    }

    // --- repeat variants: variant 1 comes from doc 08 or doc 09.
    for (const entry of body.matchAll(/^\*\*(.+?)\*\* — (.+?) \| LISTEN (.+?)$/gm)) {
      const [, rawName, lookPart, listen] = entry;
      const name = plain(rawName);
      const target = lineFor(name);
      const prior = priorVariantOne(PRIOR[number], number, name);
      if (!prior) {
        throw new Error(`doc 26 room ${number}: "${name}" has repeat variants but `
          + `${PRIOR[number]} never wrote its variant 1`);
      }
      unwiredActLines.push(...prior.unwired);

      const runs = [[VERBS.LISTEN, listen, 'LISTEN']];
      if (lookPart.startsWith('LOOK ')) {
        runs.unshift([VERBS.LOOK, lookPart.slice(5), 'LOOK']);
      } else {
        // A repeat entry with no LOOK run at all. Doc 26 no longer has one --
        // both were rewritten as named blocks above -- and this stays because
        // the next document that reaches for the shape should be reported
        // rather than parsed into a hotspot with one line.
        gaps.push(`${name} LOOK has repeat variants declared elsewhere and no run here`);
        if (prior.said.LOOK) {
          target.responses = target.responses ?? {};
          target.responses[VERBS.LOOK] = [{ say: prior.said.LOOK, repeat: [] }];
        }
      }

      for (const [verb, run, heading] of runs) {
        const said = variants(run);
        if (said[0] !== undefined) {
          throw new Error(`doc 26: ${name} ${verb} repeat run restates variant 1`);
        }
        const first = prior.said[heading];
        if (first === undefined) {
          // Doc 08 writes THE OUTGOING LETTER's LOOK as a stage direction --
          // "reflects whichever version the player last chose" -- not a line.
          // Nothing is wired: a rule whose first line is undefined shows the
          // player the word undefined, and inventing one here is the exact
          // thing CLAUDE.md forbids.
          gaps.push(`${name} ${heading} variant 1 is not a written line in ${PRIOR[number]}`);
          continue;
        }
        const repeat = said.slice(1);
        if (repeat.some((line) => line === undefined)) {
          throw new Error(`doc 26: ${name} ${verb} repeats have a gap -- `
            + `got ${JSON.stringify(repeat)}`);
        }
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: first, repeat }];
      }
    }

    // --- overrides, which may carry a trailing instruction in italics.
    for (const entry of body.matchAll(/^> \*\*(.+?)\*\* · (.+)$/gm)) {
      const target = lineFor(plain(entry[1]));
      target.overrides = target.overrides ?? {};
      const split = entry[2].match(/^(\w[\w ]*?) — "(.+?)"(?:\s*\*\((.+)\)\*)?$/);
      if (!split) throw new Error(`doc 26: cannot read override "${entry[2].slice(0, 40)}"`);
      target.overrides[split[1].trim().replace(/ /g, '_')] = split[2];
    }

    // --- exits. An exit may defer to a hotspot's lines rather than repeat
    //     them, and may lead to the map rather than to a numbered room.
    for (const entry of body.matchAll(
      /^\*\*(.+?) → (?:Room \d+|the map)\*\*\n(\*\*LOOK\*\*(.+?)\n\*\*LISTEN\*\*(.+?)|> .+?)$/gm)) {
      const [, rawName, , look, listen] = entry;
      const target = lineFor(plain(rawName));
      if (look === undefined) {
        // "Uses THE STAIRS' lines above." One object that is both a hotspot
        // and the way out, so its lines are already on this target.
        for (const verb of [VERBS.LOOK, VERBS.LISTEN]) {
          if (!target.responses?.[verb]) {
            throw new Error(`doc 26 room ${number}: ${plain(rawName)} defers to lines `
              + `written above and has no ${verb}`);
          }
        }
        continue;
      }
      for (const [verb, run] of [[VERBS.LOOK, look], [VERBS.LISTEN, listen]]) {
        const said = variants(run);
        target.responses = target.responses ?? {};
        target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
      }
    }

    // A target that now carries written lines is not a stub. `stub` means the
    // destination exists with its examine layer honestly absent, and it makes
    // check-examine-lines SKIP the target -- so a stale one is not a cosmetic
    // flag, it is a hole in the duplicate guarantee.
    for (const target of [...room.hotspots, ...room.exits]) {
      if (target.stub && target.responses?.LOOK_AT) delete target.stub;
    }

    // Act-qualified lines the prior doc carries that nothing above accounted
    // for. Doc 08 writes some hotspots inside a group parenthetical rather
    // than under their own heading, so an unwired line can be invisible to
    // every named lookup -- and a line that is unwired AND unlisted is the
    // one that gets forgotten.
    const claimed = new Set(unwiredActLines.map((entry) => entry.line));
    for (const entry of actLinesIn(PRIOR[number], number)) {
      if (claimed.has(entry.line)) continue;
      claimed.add(entry.line);
      unwiredActLines.push({ label: `${entry.label} (unattributed in ${PRIOR[number]})`, line: entry.line });
    }

    room.note = `${(room.note ?? '').replace(/ Lines EXTRACTED.*$/, '')} `
      + 'Lines EXTRACTED from docs/26-batch-a.md by tools/extract-content.mjs. Do not '
      + 'edit: change doc 26 and re-run.';
    written.push(write(path, room));
  }

  for (const line of coverage) process.stderr.write(`  doc 26 act coverage: ${line}\n`);
  for (const entry of unwiredActLines) {
    process.stderr.write(`  doc 26 act-gated, UNWIRED: ${entry.label} -- `
      + `"${entry.line.slice(0, 48)}${entry.line.length > 48 ? '...' : ''}"\n`);
  }
  for (const gap of gaps) process.stderr.write(`  doc 26 GAP: ${gap}\n`);
  if (named.size) process.stderr.write(`  doc 26 named blocks: ${[...named].join(', ')}\n`);
  return written;
}

// ---------------------------------------------------------------------------

/**
 * Doc 27's three Act I trees: the undertaker, the hotel clerk, Deke Vessel.
 *
 * SPEAKER ATTRIBUTION IS THE DOCUMENT'S OWN TYPOGRAPHY, not a decision made
 * here. A response cell alternates speakers and marks each one:
 *
 *   "..."      plain          -- the character whose tree this is
 *   *"..."*    italic         -- Thad
 *   **"..."**  bold           -- the character, emphasised
 *   *(...)*    italic bracket -- a stage direction, and nobody says it
 *
 * The rule holds across all three trees and all six multi-speaker cells, and
 * it is the same kind of forced reading doc 17's beat sheet needed. Note that
 * italic-with-quotes and italic-without are different things: `*"I'm sorry?"*`
 * is Thad and `*(pause)*` is nobody, so the parser cannot simply strip
 * emphasis and look at what is left.
 *
 * FLAG ROUTING. Two of the three flags are named in the document, in the cell
 * that writes them. The third is not, and it is not invented here either:
 *
 *   T_PIKE_DEAD      doc 27, undertaker option 2, in so many words
 *   T_SWINDLED       doc 27, Vessel option 6, in so many words
 *   T_TUNES_PIANOS   NOT named in doc 27. Doc 02's A2 row states the topic as
 *                    "I tune pianos"; doc 04 declares T_TUNES_PIANOS as an
 *                    Act I flag and gates an option in Winnie's tree on it
 *                    ("I tune pianos." req `T_TUNES_PIANOS`), which means
 *                    something earlier must set it; and the clerk's option 4
 *                    is the only place in Act I where Thad says he can tune a
 *                    piano. Three documents leave exactly one writer.
 *
 * The clerk's option 4 sets that flag AND NOTHING ELSE. It grants permission;
 * doc 24's A2 pair -- the fork on the parlour piano, in a room that is not
 * built -- is what earns the room. A tree that resolved A2 would make the
 * combination decorative.
 */
function minorTrees() {
  const doc = read('docs/27-minor-trees.md');
  const sections = doc.split(/^# (.+?) · Room (\d+)$/m).slice(1);
  const written = [];

  //: Tree id, speaker id and room, per character. The room is carried so the
  //: hotspot that opens the tree can be checked against it.
  const WHO = {
    'THE UNDERTAKER': { tree: 'UNDERTAKER', speaker: 'undertaker', room: 'undertaker' },
    'THE HOTEL CLERK': { tree: 'HOTEL_CLERK', speaker: 'hotel_clerk', room: 'hotel_lobby' },
    'DEKE VESSEL': { tree: 'DEKE_VESSEL', speaker: 'deke_vessel', room: 'nugget' },
  };
  //: Doc 27 leaves one writer unnamed. See the routing note above.
  const ROUTED = { 'THE HOTEL CLERK': { 4: 'T_TUNES_PIANOS' } };
  const THAD = 'thad';
  const unspoken = [];
  const directions = [];

  // THE EXAMINE LAYERS: "Each character is a hotspot in their room like
  // anything else" (doc 27). LOOK and LISTEN, three variants each, carried on
  // the character's tree file in the hotspot response shape -- first line,
  // then the repeats -- so a verb pointed at the person reads his lines
  // through the same route, and the same repeat counting, as any object.
  const layers = {};
  const examineDoc = doc.split(/^# EXAMINE LAYERS$/m)[1]?.split(/^# (?!#)/m)[0] ?? '';
  for (const block of examineDoc.split(/^## /m).slice(1)) {
    const title = block.split('\n')[0].trim();
    const run = (label) => {
      const line = block.match(new RegExp(`^\\*\\*${label}\\*\\* (.+)$`, 'm'))?.[1];
      if (!line) throw new Error(`doc 27: ${title} has no ${label} run`);
      const said = [...line.matchAll(/\d "([^"]+)"/g)].map((m) => m[1]);
      if (said.length !== 3) throw new Error(`doc 27: ${title} ${label} has ${said.length} variants, not 3`);
      return [{ say: said[0], repeat: said.slice(1) }];
    };
    layers[title] = { LOOK_AT: run('LOOK'), LISTEN_TO: run('LISTEN') };
  }

  for (let index = 0; index < sections.length; index += 3) {
    const title = sections[index].trim();
    const body = sections[index + 2];
    const who = WHO[title];
    if (!who) throw new Error(`doc 27: no tree wired for "${title}"`);

    const rootCell = body.match(/^\*\*Root:\*\* (.+)$/m);
    if (!rootCell) throw new Error(`doc 27: ${title} has no root line`);
    const rootSpeech = speech(rootCell[1], who.speaker);
    if (rootSpeech.length !== 1) {
      throw new Error(`doc 27: ${title}'s root is ${rootSpeech.length} lines, not 1`);
    }
    for (const note of stageDirections(rootCell[1])) directions.push(`${title} root: ${note}`);

    const options = [];
    // The tag cell may be EMPTY, and an empty cell in this document is "| |"
    // with one space rather than two -- so the separators cannot carry their
    // own spaces or every EXIT row is silently skipped. It was: three trees
    // came out with no way to leave any of them, and nothing failed, because
    // no check requires an exit and the runner ends on a tag it never saw.
    const ROW = /^\| (\d+) \|\s*(.+?)\s*\|\s*(.*?)\s*\|\s*(.+?)\s*\|$/gm;
    for (const row of body.matchAll(ROW)) {
      const [, number, optionCell, tagCell, responseCell] = row;

      // The tag is normally its own column. An EXIT row leaves that column
      // empty and marks the option text instead, which is how the document
      // reads on the page and is not an error to be normalised.
      const tagged = `${tagCell} ${optionCell}`.match(/\[([A-Z]+)\]/);
      if (!tagged) throw new Error(`doc 27: ${title} option ${number} has no tag`);
      const tag = tagged[1];
      const text = quoted(optionCell)[0];
      if (!text) throw new Error(`doc 27: ${title} option ${number} has no option text`);

      // Everything before the arrow is spoken; everything after it is state.
      const [spoken, ...after] = responseCell.split('→');
      const lines = speech(spoken, who.speaker);
      for (const note of stageDirections(spoken)) {
        directions.push(`${title} option ${number}: ${note}`);
      }

      const option = { id: `${who.speaker}${number}`, text, tag };
      const follows = afterIds(tagCell, who.speaker);
      if (follows) option.after = follows;
      // `ends` in the tag cell: the conversation closes after this exchange,
      // as an EXIT's does (doc 27's note; Vessel's option 6, doc 57 A3).
      if (/(^|·)\s*ends\s*(·|$)/.test(tagCell.replace(/`[^`]*`/g, ''))) option.ends = true;
      // A bold puzzle id after the arrow is the puzzle the option completes.
      const completes = after.join('→').match(/\*\*([A-F]\d+)\*\*/);
      if (completes) option.puzzle = { [completes[1]]: 'complete' };
      if (lines.length === 1 && lines[0].speaker === who.speaker) {
        option.say = lines[0].line;
      } else if (lines.length > 1) {
        option.exchange = lines;
      } else if (lines.length === 0) {
        // Doc 27's Vessel option 6 is "(The swindle. Four dollars and the
        // watch for the deed.)" -- a scene, not a line. Nothing is invented
        // to fill it: the DIRECTION ITSELF is carried as the option's beat,
        // so the document's words survive into the data and the engine has
        // something to play when the machinery for it exists. An option with
        // neither a line nor a direction is an error and says so.
        const direction = stageDirections(spoken)[0];
        if (!direction) {
          throw new Error(`doc 27: ${title} option ${number} has no line and no direction`);
        }
        option.beat = direction;
        unspoken.push(`${title} option ${number} "${text}" -- ${direction}`);
      } else {
        throw new Error(`doc 27: ${title} option ${number} is one line and Thad says it`);
      }

      const named = after.join('→').match(/\**`([A-Z][A-Z_0-9]+)`\**/);
      const routed = ROUTED[title]?.[Number(number)];
      if (named && routed) {
        throw new Error(`doc 27: ${title} option ${number} names ${named[1]} and is `
          + `also routed to ${routed} -- one of the two is now wrong`);
      }
      if (named || routed) option.set = { [named ? named[1] : routed]: true };
      // A1 IS THE NEWS (doc 02: "the Undertaker finally states Pike died six
      // years ago"; doc 57 A1). The option that writes T_PIKE_DEAD completes it
      // (errata 86 D) -- routing, as A8_CASES is.
      if (option.set?.T_PIKE_DEAD) option.puzzle = { A1: 'complete' };
      options.push(option);
    }

    if (options.length < 3) throw new Error(`doc 27: ${title} has ${options.length} options`);
    // Vessel's Act II root is doc 04's, merged here so he is one tree.
    const actTwo = who.tree === 'DEKE_VESSEL' ? vesselActTwo() : null;
    // The undertaker's Act III node is doc 04's, merged here so he is one tree.
    const actThree = who.tree === 'UNDERTAKER' ? undertakerActThree() : null;

    written.push(write(`content/dialogue/${who.tree.toLowerCase().replace(/_/g, '-')}.json`, {
      schema: 1,
      id: who.tree,
      // WHO SPEAKS THE REPLIES, AND IT WAS KNOWN AND NEVER WRITTEN. The WHO
      // table above has carried a speaker id per tree all along; the emitted
      // file did not. With no `speaker`, DialogueRunner leaves `sayer` null,
      // so the renderer cannot find a head to put the words over and drops
      // them to the top-centre fallback -- and colours them as unattributed,
      // which is why Tyler saw the map seller's line at the top of the screen
      // in Thad's colour. Only stage-driver declared one, so every other
      // character in the game had this.
      speaker: who.speaker,
      name: title,
      note: `EXTRACTED from docs/27-minor-trees.md by tools/extract-content.mjs. Do not `
        + `edit: change doc 27 and re-run. Speakers come from the document's own `
        + `typography -- plain quotes are ${who.speaker}, italic quotes are Thad, and `
        + `an italic bracket is a stage direction nobody says.`,
      examine: layers[title] ?? (() => { throw new Error(`doc 27: ${title} has no examine layer`); })(),
      nodes: {
        root: {
          id: 'root',
          prompt: rootSpeech[0].line,
          // THE ROOT IS SAID, NOT CAPTIONED. Doc 30 section 14 stopped drawing
          // `prompt` anywhere, and a root line that lived only there was never
          // heard: Vessel's "You're the piano man." -- his whole opening, per
          // doc 27's "He opens" -- the undertaker's "Yes." and the clerk's
          // "Mr. Grubbe." all played as silence before the list. Carried as the
          // node's opening, the greeting is performed before the options, the
          // same route every act-root greeting already takes.
          opening: [rootSpeech[0]],
          options,
        },
        ...(actTwo ? { VES_B1: actTwo.node } : {}),
        ...(actThree ? { UND_C1: actThree.node } : {}),
      },
      ...(actTwo ? { entries: actTwo.entries } : {}),
      ...(actThree ? { entries: actThree.entries } : {}),
      start: 'root',
    }));
  }

  for (const note of directions) process.stderr.write(`  doc 27 staging: ${note}\n`);
  for (const note of unspoken) process.stderr.write(`  doc 27 UNSPOKEN: ${note}\n`);
  return written;
}

/**
 * The speech in a response cell, in order, each line with its speaker.
 *
 * The three forms are tried most-specific first, in one pass, so a bold span
 * is not read as a plain one that happens to have asterisks around it.
 */
function speech(cell, npc) {
  const out = [];
  for (const span of cell.matchAll(/\*\*"([^"]+)"\*\*|\*"([^"]+)"\*|"([^"]+)"/g)) {
    const [, bold, italic, plainSpan] = span;
    if (italic !== undefined) out.push({ speaker: 'thad', line: italic });
    else out.push({ speaker: npc, line: bold ?? plainSpan });
  }
  return out;
}

/** Italic brackets: staging, carried out of the data and reported. */
function stageDirections(cell) {
  return [...cell.matchAll(/\*\(([^)]+)\)\*/g)].map((match) => match[1]);
}

// ---------------------------------------------------------------------------

/**
 * ROOM 1'S OWN LINES, READ FROM THE DOCUMENTS THAT WRITE THEM.
 *
 * Room 1 predates the room compiler, and until errata 100 only its case was
 * extracted: every other line in stage-road.json was carried in the file, so
 * the voice pass rewrote doc 17 and the game did not change, and
 * check-room-lines-sourced said so. The sources, most specific first, are the
 * same ones the room file's own note names:
 *
 *   errata 19a  -- the coach present and gone, the team, the lamp crossing
 *                  (a full line set per state, which overrides the docs)
 *   doc 17      -- the sign, the mud and the road east (variants 2-3), both
 *                  ways west, and PART THREE's overrides
 *   doc 05      -- variant 1 of the mud and the road east, which doc 17 left
 *
 * Only `say` and `repeat` are written, on the response a line set already
 * has, so a flag the lamp writes or a gate a state carries is never touched.
 */
function roomOneLines(room, doc17) {
  const errata = read('docs/00-errata.md');
  const doc05 = read('docs/05-examine-layer.md');
  const target = (id) => {
    const found = [...room.hotspots, ...room.exits].find((entry) => entry.id === id);
    if (!found) throw new Error(`Room 1 has no "${id}" for its lines`);
    return found;
  };
  const write = (id, verb, said, where) => {
    if (said.length !== 3 || said.some((line) => line === undefined)) {
      throw new Error(`${where}: ${id} ${verb} has ${said.filter(Boolean).length} of 3 variants`);
    }
    const into = target(id);
    into.responses = into.responses ?? {};
    const rules = into.responses[verb] ?? [{}];
    if (rules.length !== 1) throw new Error(`${where}: ${id} ${verb} has ${rules.length} rules; Room 1 writes one`);
    rules[0].say = said[0];
    rules[0].repeat = said.slice(1);
    into.responses[verb] = rules;
  };
  const run = (text, heading) => {
    const found = text.match(new RegExp(`^>?\\s*(?:\\*\\*${heading}:?\\*\\*|${heading})\\s+(1\\s+".+)$`, 'm'));
    return found ? variants(found[1]) : [];
  };

  const canonical = errata.split('**Room 1, canonical:**')[1]?.split(/^## /m)[0];
  if (!canonical) throw new Error('errata 19a: no "Room 1, canonical" block');
  const block = (title) => {
    const start = canonical.indexOf(title);
    if (start < 0) throw new Error(`errata 19a: no ${title}`);
    return canonical.slice(start).split(/\n\*\*THE /)[0];
  };
  for (const [id, title] of [['coach', '**THE COACH — state A'], ['coach_gone', '**THE COACH — state B'], ['team', '**THE TEAM']]) {
    write(id, 'LOOK_AT', run(block(title), 'LOOK'), 'errata 19a');
    write(id, 'LISTEN_TO', run(block(title), 'LISTEN'), 'errata 19a');
  }
  const crossing = block("**THE WATCHMAN'S LAMP").split('**Gone:**')[0];
  write('lamp', 'LOOK_AT', run(crossing, '\\*\\*Crossing:\\*\\* LOOK'), 'errata 19a');
  write('lamp', 'LISTEN_TO', run(crossing, 'LISTEN'), 'errata 19a');

  const section17 = (heading) => {
    const part = doc17.split(new RegExp(`^## ${heading}.*$`, 'm'))[1]?.split(/^## |^---|^# /m)[0];
    if (!part) throw new Error(`doc 17: no "## ${heading}" section`);
    return part;
  };
  const room05 = doc05.split(/^## ROOM 1 — .*$/m)[1]?.split(/^## /m)[0] ?? '';
  const first05 = (title, heading) => {
    const part = room05.split(`**${title}**`)[1]?.split(/\n\*\*THE |\n\*\*HIS /)[0] ?? '';
    const found = part.match(new RegExp(`\\*\\*${heading}:\\*\\* "([^"]+)"`));
    if (!found) throw new Error(`doc 05 Room 1: no ${title} ${heading}`);
    return found[1];
  };
  write('town_sign', 'LOOK_AT', run(section17('THE TOWN SIGN'), 'LOOK'), 'doc 17');
  write('town_sign', 'LISTEN_TO', run(section17('THE TOWN SIGN'), 'LISTEN'), 'doc 17');
  for (const [id, title, heading] of [['mud', 'THE MUD', 'THE MUD'], ['road_east', 'THE ROAD EAST', 'THE ROAD EAST']]) {
    for (const [verb, word] of [['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
      const later = section17(heading).match(new RegExp(`^\\*\\*${word}\\*\\*(.+)$`, 'm'))?.[1] ?? '';
      const said = variants(`1 "${first05(title, word)}" · ${later}`);
      write(id, verb, said, 'docs 05 and 17');
    }
  }
  const westSection = section17('THE ROAD WEST → Room 2');
  write('road_west', 'LOOK_AT', run(westSection, 'LOOK'), 'doc 17');
  write('road_west', 'LISTEN_TO', run(westSection, 'LISTEN'), 'doc 17');
  const blocked = section17('THE ROAD WEST, BEFORE THE CASE');
  for (const [verb, word] of [['WALK_TO', 'WALK TO'], ['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
    write('road_west_blocked', verb, run(blocked, word), 'doc 17');
  }
  const fallback = run(blocked, 'ANY OTHER VERB');
  if (fallback.length !== 3) throw new Error('doc 17: road west before the case has no ANY OTHER VERB run');
  target('road_west_blocked').fallback = fallback;

  // PART THREE's overrides, by the name the document calls each thing.
  const NAMES = { 'THE SIGN': 'town_sign', 'THE MUD': 'mud', 'THE COACH': 'coach', 'THE LAMP': 'lamp', 'THE ROAD EAST': 'road_east' };
  const overrides = doc17.split(/^# PART THREE — OVERRIDES.*$/m)[1]?.split(/^## |^# /m)[0];
  if (!overrides) throw new Error('doc 17: no PART THREE — OVERRIDES');
  for (const row of overrides.matchAll(/^> \*\*([A-Z' ]+)\*\* · ([A-Z ]+?) — (?:\*\([^)]*\)\* )?"([^"]+)"/gm)) {
    const [, name, verb, line] = row;
    const id = NAMES[name.trim()];
    if (!id) continue;
    const into = target(id);
    into.overrides = { ...(into.overrides ?? {}), [verb.trim().replace(/ /g, '_')]: line };
  }
}

/**
 * Doc 17's HIS CASE, which now has THREE STATES and is the game's first PICK UP.
 *
 * The old single hotspot answered PICK UP with "I have it. I have had it the
 * entire time," which is false while the case is on the coach roof and false
 * again while it is lying in the mud. Doc 17 replaces it with a state per
 * place the case can be, and the third state is not a hotspot at all:
 *
 *   A  on the coach roof, beats 1-5   -- reaching for it is refused
 *   B  in the mud, from beat 6        -- PICK UP TAKES IT
 *   C  carried                        -- the hotspot is gone
 *
 * State C needs no data. GameState.targets already filters out anything the
 * actor owns -- doc 22 item 9, taking something is an ownership change -- so
 * `take: true` on state B's PICK UP is the whole of state C.
 *
 * The two drawn states follow ruling 19a's pattern exactly, the one the coach
 * already uses: two hotspots sharing a name, gated on one flag, rather than
 * one hotspot with two rule sets. The NAME does not change but the PLACE does,
 * and a hotspot is a rectangle before it is anything else.
 */
function openingCase() {
  const doc = read('docs/17-opening-sequence.md');
  const path = 'content/rooms/stage-road.json';
  const room = JSON.parse(read(path));

  const section = doc.split(/^## HIS CASE.*$/m)[1]?.split(/^## /m)[0];
  if (!section) throw new Error('doc 17: no HIS CASE section');

  // THE DOCUMENT MAY DESCRIBE MORE STATES THAN THE ROOM BUILDS, and this map
  // is the list of the ones it builds. Nothing else here needs to change when
  // doc 17 gains or loses a state: a letter that is not here has its lines
  // reported by name and dropped, which is exactly how state C -- "the hotspot
  // is gone" -- has always worked.
  //
  // A IS GONE BECAUSE THE CASE NO LONGER STARTS ON THE ROOF. The ruling is
  // that it is on the ground from the first frame, so "still up on the roof,
  // under the driver's hand" describes a place the case is never in.
  //
  // AND IT WAS NOT MERELY UNREACHABLE, IT WAS LIVE AND WRONG. `case_roof` was
  // gated `T_CASE_DOWN: true` and beat 6 writes that flag, so from beat 6
  // onward the roof hotspot switched ON -- at x1078 y341, eight feet up, with
  // the coach already gone -- and answered about a driver who had left. Two
  // hotspots named HIS CASE, live together, one of them over empty sky. The
  // gate had been inverted at some point from "while the case is NOT down" to
  // "while it is", and inverting a gate does not remove a state, it moves it.
  //
  // A STATE IS REMOVED BY REMOVING IT. Doc 17's state A prose is untouched and
  // is now a reported orphan, awaiting the revision that is the writer's.
  const STATES = { B: 'case_mud' };

  // AND THE HOTSPOT IS DELETED HERE RATHER THAN BY HAND, so it cannot come
  // back. Removing a letter from STATES stops the extractor WRITING to a
  // hotspot; it does not remove one already in the room, and a target nothing
  // writes to is a target nothing corrects either. Retiring it in the
  // generator makes the deletion idempotent and leaves a name to search for.
  const RETIRED = ['case_roof'];
  const before = room.hotspots.length;
  room.hotspots = room.hotspots.filter((entry) => !RETIRED.includes(entry.id));
  for (let gone = before - room.hotspots.length; gone > 0; gone -= 1) {
    process.stderr.write(`  doc 17 RETIRED: a case hotspot the design no longer has\n`);
  }
  const VERBS = { LOOK: 'LOOK_AT', LISTEN: 'LISTEN_TO' };
  const orphans = [];

  for (const block of section.matchAll(
    /^\*\*State ([ABC]) —(.*?)\*\*(.*)\n((?:(?:\*\*|>).*\n)*)/gm)) {
    const [, letter, label, tail, body] = block;
    const id = STATES[letter];
    if (!id) {
      // A STATE THE ROOM DOES NOT BUILD. Its lines belong to nothing -- a
      // hotspot that does not exist cannot answer LISTEN -- so they are
      // reported by name and dropped, never wired to the nearest thing.
      //
      // State C has always been one of these: "the hotspot is gone", carrying
      // two leftover LISTEN variants from the single-state version. State A
      // is one now. THE MESSAGE NAMES THE LETTER because it used to say
      // "state C" for every orphan regardless, and the moment a second state
      // was retired it began reporting A's lines under C's name -- a label
      // that was correct exactly as long as there was only one thing to
      // label, which is the whole R5k family in miniature.
      for (const line of quoted(body)) orphans.push({ letter, line });
      continue;
    }
    const target = room.hotspots.find((entry) => entry.id === id);
    if (!target) throw new Error(`doc 17: stage road has no hotspot "${id}"`);

    for (const [verb, heading] of [[VERBS.LOOK, 'LOOK'], [VERBS.LISTEN, 'LISTEN']]) {
      const run = body.match(new RegExp(`^\\*\\*${heading}\\*\\*(.+)$`, 'm'));
      if (!run) throw new Error(`doc 17: state ${letter} has no ${heading} run`);
      const said = variants(run[1]);
      if (said.length !== 3 || said.some((line) => line === undefined)) {
        throw new Error(`doc 17: state ${letter} ${heading} has ${said.length} variants`);
      }
      target.responses = target.responses ?? {};
      target.responses[verb] = [{ say: said[0], repeat: said.slice(1) }];
    }

    target.overrides = {};
    for (const entry of body.matchAll(/^> (.+)$/gm)) {
      // Two forms. A plain refusal is `VERB — "line"`. The one that TAKES the
      // object is written with the verb in bold and the line in italics --
      // `**PICK UP — takes it.** *"I have it."*` -- because it is a different
      // kind of thing and doc 17 marks it as one. "takes it" is the flag.
      const takes = entry[1].match(/^\*\*(\w[\w ]*?) — takes it\.\*\*\s*\*"(.+?)"\*/);
      if (takes) {
        // `take: true` ALONE TAKES NOTHING. It is a claim that something was
        // taken, not an instruction to take anything -- so PICK UP said "I
        // have it", the inventory stayed empty and the case stayed on the
        // ground. The three items and the flag are what actually happens.
        //
        // THE CASE IS A CONTAINER, NOT AN ITEM. Its CONTENTS enter the
        // inventory and the case itself does not, so Thad never carries it
        // around town -- which is Q11 answered by there being nothing to
        // carry. The letter, the tuning fork and four dollars: what a piano
        // tuner arriving to make his fortune has, and the driver's tree turns
        // on him having exactly four.
        //
        // T_CASE_TAKEN gates this hotspot, so the write removes the case from
        // the ground.
        target.responses[takes[1].trim().replace(/ /g, '_')] = [
          {
            say: takes[2],
            take: true,
            items: ['letter', 'tuning_fork', 'four_dollars'],
            set: { T_CASE_TAKEN: true },
          },
        ];
        continue;
      }
      const plain_ = entry[1].match(/^(\w[\w ]*?) — "(.+?)"/);
      if (!plain_) throw new Error(`doc 17: cannot read case override "${entry[1].slice(0, 40)}"`);
      target.overrides[plain_[1].trim().replace(/ /g, '_')] = plain_[2];
    }
    if (Object.keys(target.overrides).length === 0) delete target.overrides;
    target.note = `Doc 17, state ${letter}:${label.replace(/\*/g, '')}${tail.replace(/\*/g, '')}`
      .replace(/\s+/g, ' ').trim();
  }

  for (const { letter, line } of orphans) {
    process.stderr.write(`  doc 17 ORPHAN: state ${letter} has no hotspot in the room and `
      + `still carries a line -- "${line.slice(0, 52)}..."\n`);
  }

  // THE LAMP IS HOW YOU SPEAK TO HOB, so every response on it writes the flag
  // that lets doc 17 beat 9 begin.
  //
  // HE IS A MOVER AND NOT A TARGET. There is no rect on him, `targetAt` never
  // returns him, and TALK_TO cannot reach him at all -- so the lamp he is
  // carrying is the only part of him a player can address. Its hotspot already
  // sits at x480-600, which is where he now stands: it was authored for a man
  // crossing the road and it lands on a man standing still.
  //
  // ON BOTH VERBS RATHER THAN ONE, because which of LOOK and LISTEN a player
  // tries first is not something to be right about. The LINES are untouched --
  // they are doc 05's and doc 17's, extracted above; this adds only the write,
  // which is routing and not writing.
  //
  // IT LIVES IN THE EXTRACTOR because the room file is regenerated whole. Hand
  // -editing it survives until the next extraction and then vanishes silently,
  // which is the same trap the speakers table sets for a colour.
  // THE WEST EXIT STARTS THE ENDING RATHER THAN TAKING IT. Taking it writes
  // T_THAD_LEAVING, which releases doc 17 beat 11; the beat walks him through
  // the gap and does the travel itself when it ends. An exit that moves you
  // the instant you touch it cannot also be a departure you watch.
  //
  // Both here rather than hand-edited into the room, because the room file is
  // regenerated whole and a hand edit survives until the next extraction.
  const west = room.exits.find((entry) => entry.id === 'road_west');
  if (!west) throw new Error('stage road has no "road_west" exit to start the ending from');
  // THE GAP IS THE OPENING IN THE FENCE, WHICH IS ABOVE THE BAND. The rect ran
  // y480-700 and reached down into the walkable ground, where it sat on top of
  // THE WATCHMAN'S LAMP -- and `targetAt` returned the exit, so clicking Hob's
  // lantern started the ending instead of speaking to him. Found by the
  // gauntlet: its lamp click wrote no flag and beat 9 held until the deadline.
  //
  // MEASURED: Hob stands at (475, 700) drawn 224 tall, and the flame in his own
  // frames lands at world x510-517, y595-615 -- inside the gap's x500-650.
  // They are in the same column of the picture, so the fix is the exit's
  // HEIGHT: the fence's opening is what you walk through, and the lantern
  // hangs below it.
  // THE WHOLE TOWN IS THE TARGET, NOT THE GAP IN THE FENCE. 150x110 was the
  // opening you walk through, which is correct as a doorway and wrong as a
  // click target -- Tyler could not reliably hit it. Consolation itself is
  // what a player aims at: the lit buildings below and west, which the room's
  // own lightSources put at x0-444, y336-468.
  //
  // It cannot swallow the road: the walkable bands begin at y660 and this
  // stops at y580, so clicking the ground still walks.
  //
  // AND IT STOPS SHORT OF THE TOWN SIGN, which stands at x204-396. The first
  // widening covered it, and check-occlusion caught what that means: this exit
  // declares travelWhenTold, so it does not open a door -- it starts a
  // scripted departure. A click meant for the sign would have left town.
  // Everything west of the sign is town and is the target; the sign keeps its
  // own rect and its own LOOK line.
  west.rect = [400, 330, 260, 250];
  // GATED ON THE CASE AS WELL AS ON HOB. He could walk out of Room 1 leaving
  // his letter, his tuning fork and his four dollars in the mud -- everything
  // he owns -- and nothing stopped him.
  //
  // A GATE CANNOT SPEAK: a `when` that fails removes the target entirely. So
  // the refusal is a second target over the same rect with the opposite gate,
  // ruling 19a's pattern, as coach/coach_gone and lamp/lamp_gone already do.
  //
  // AND IT COULD NOT BE A GATED RESPONSE ON THE EXIT ITSELF. resolveExit
  // returns before the response resolves -- its own comment says so, which is
  // why `set` on an exit response never fires -- so a WALK_TO branch carrying
  // `when` here would never be reached.
  west.when = { T_HOB_GONE: true, T_CASE_TAKEN: true };
  // The sentence line should say where he is going. Its own LOOK line is
  // "Consolation. There are lamps on in about a third of it": what is at the
  // end of that road is the town, not a compass point.
  west.name = 'CONSOLATION';
  room.hotspots = room.hotspots.filter((entry) => entry.id !== 'road_west_blocked');
  room.hotspots.push({
    id: 'road_west_blocked',
    name: 'CONSOLATION',
    rect: west.rect,
    colour: west.colour,
    when: { T_HOB_GONE: true, T_CASE_TAKEN: false },
    defaultVerb: 'WALK_TO',
    note: 'THE ROAD WEST BEFORE HE HAS HIS CASE. Same rect and name as the exit, opposite '
      + 'gate, and it does not travel. The refusal does not reuse the case\'s own joke -- '
      + 'case_mud\'s LOOK already carries "Everything I own. It is not heavy and that is the '
      + 'whole difficulty" -- and it counts, because he counts: the case grants exactly three '
      + 'items.',
    // ITS LINES ARE DOC 17'S, read by roomOneLines below. They were typed
    // here when the case became required, which made the extractor the only
    // source of nine spoken lines (errata 100's Room 1 pass moved them).
    responses: {},
    fallback: [],
  });
  west.rectNote = 'THE FULL GAP, x500-650, measured off the plate with a ruler. It was narrowed '
    + 'to x500-590 so it could coexist with the lamp, which left Hob NEITHER BLOCKING NOR CLEAR '
    + '-- a man in a doorway you walk around. Q63: he blocks it, and clearing him is the way '
    + 'out.\n\ny470-580 IS THE OPENING IN THE FENCE and stops above the lantern, which is the '
    + 'separation that survives him leaving. The gate closes the exit while he is there, so the '
    + 'two are never live together WHILE HE STANDS -- but lamp_gone is live at exactly the same '
    + "time as the exit, at the lamp's own rect, and it would inherit the collision. Splitting "
    + 'them VERTICALLY is what makes that impossible: the fence opening is what you walk '
    + 'through and the lantern hangs below it, and no sideways nudge is honest because they '
    + 'share a column.';
  // SET HERE RATHER THAN LEFT WHERE IT WAS. `note` said "NARROWED FROM 150
  // WIDE TO 90 BECAUSE HOB STANDS IN THIS GAP", which stopped being true when
  // the separation went vertical and the width went back to 150. Nothing in
  // this file was setting it, so it survived two rect changes describing
  // neither -- a field the generator does not own cannot be kept honest by
  // the generator, and the extractor merges into the room rather than writing
  // it fresh, so a stranded string stays stranded forever.
  west.note = 'THE FULL WIDTH OF THE GAP, x500-650. It was cut to 90 wide to dodge the lamp '
    + 'sideways; that is not the shape of the problem. Hob and the lantern are in the SAME '
    + 'COLUMN of the picture as the way out, so the only honest separation is vertical: the '
    + 'opening in the fence is what you walk through and the lantern hangs below it.\n\n'
    + 'Thad walks through at 575. Q63 gates it on T_HOB_GONE so it is shut while he stands '
    + 'there -- but lamp_gone is live at the same time as the exit, so the geometry has to '
    + 'hold on its own and not lean on the gate. tools/check-exit-collisions.mjs asserts that '
    + 'it does.';
  west.setOnTransit = { T_THAD_LEAVING: true };
  west.travelWhenTold = true;
  west.endingNote = 'Doc 17 beat 11. Taking this writes T_THAD_LEAVING and goes nowhere; '
    + 'the beat that flag releases walks him through the gap and travels at its end. '
    + 'setOnTransit exists because doc 14 says transit produces no line -- and a flag write '
    + 'is not a line, which is the same argument stateOnTransit is made from.';

  roomOneLines(room, doc);

  const lamp = room.hotspots.find((entry) => entry.id === 'lamp');
  if (!lamp) throw new Error('stage road has no "lamp" hotspot for Hob to be spoken to through');
  // AND IT IS WHERE THE LANTERN ACTUALLY IS. The rect was x480-600 y444-612,
  // authored for a man CROSSING the road; he stands still at (475, 700) now
  // and the flame in his own idle frames lands at world x510-517, y595-615 at
  // his drawn 224. The old rect was mostly empty sky above it.
  // MEASURED AT HIS CURRENT POSITION, NOT RECONCILED WITH AN OLD ONE. He was at
  // (475, 700) when the last rect was derived and he is at (600, 720) now; the
  // depth curve puts him at 230 tall there and the flame in his own idle frames
  // lands at world x636-643, y612-632. Both rects came from where he stood, and
  // he moved, so both were re-measured rather than argued about.
  // LAMP_GONE IS DELETED, BY TYLER'S RULING, AND HE ASKED FOR IT REPEATEDLY.
  //
  // It was a designed paired state -- ruling 19a, the shape coach/coach_gone
  // uses -- with authored lines about watching the lantern recede: "The lamp,
  // away up the street. It has not once looked back at me."
  //
  // WHY IT READ AS A BUG ANYWAY. It sat on the SAME RECT as the lamp, which is
  // where Hob stood, not up the street where the lines look. So after he left,
  // hovering the empty fence still said THE WATCHMAN'S LAMP and the hotspot
  // was indistinguishable from one that had failed to clear. The gate was
  // working perfectly and the room read as though it were not.
  //
  // The lines are not lost -- they are in the history at this commit, and in
  // doc 36's table -- and if the beat is wanted back it wants a rect where the
  // lamp actually went, which is off frame right.
  room.hotspots = room.hotspots.filter((entry) => entry.id !== 'lamp_gone');
  for (const target of [lamp]) {
    if (!target) continue;
    target.rect = [610, 586, 60, 73];
    target.rectNote = 'Around the lantern: the flame in his own idle frames is at world '
      + 'x636-643 y612-632 with him at (600, 720) drawn 230 tall, plus 26px of grab. It must '
      + 'clear road_west, which stops at y580 -- lamp_gone especially, because that one is live '
      + 'at the same time as the exit and would otherwise take a click meant for the lamp and '
      + 'start the ending.';
    // THREE READINGS OF THE SAME LANTERN, AND THE RECT HOLDS ALL THREE.
    // x626-653 y593-618 was the lantern housing; x636-643 y612-632 was the
    // flame at a loose threshold. They do not nest -- the second runs 14px
    // below the first, which cannot be true of a flame inside a lamp -- so
    // rather than pick one, it was measured a third time from something
    // neither used: the rig's own `figure` box, [632, 1365], scaled by
    // 230/1365 about the feet at (600, 720), taking the brightest 0.05% of
    // opaque pixels in idle-00. That lands at world x638-643, y612-624.
    // It agrees with the flame reading on x and on its top edge, and says
    // the loose one over-ran at the bottom. x610-670 y586-659 contains all
    // three, so no reading changes the rect -- which is why this is a note
    // and not a correction.
    target.rectMeasuredNote = 'Third reading, from the rig rather than from a composed frame: '
      + 'brightest 0.05% of opaque pixels in hob-idle-right/idle-00.png, mapped through '
      + "rig.figure [632, 1365] at scale 230/1365 about the feet, is world x638-643 y612-624. "
      + 'The rect contains this, the flame reading and the housing reading alike.';
  }
  const speaking = ['LOOK_AT', 'LISTEN_TO'];
  for (const verb of speaking) {
    const said = lamp.responses?.[verb];
    if (!said?.length) throw new Error(`the lamp has no ${verb} response to carry the write`);
    for (const rule of said) rule.set = { ...(rule.set ?? {}), T_HOB_SPOKEN: true };
  }
  lamp.setNote = 'EVERY RESPONSE HERE WRITES T_HOB_SPOKEN, which is what holds doc 17 beat 9. '
    + 'Hob is a MOVER and not a target -- there is no rect on him and TALK_TO cannot reach him -- '
    + 'so the lamp he carries is the only part of him a player can address, and this hotspot '
    + 'already sits where he now stands. Looking at it or listening to it is speaking to him, and '
    + 'the exchange follows. Added by tools/extract-content.mjs: the lines are the document\'s, '
    + 'the write is routing.';
  // HIS BODY IS THE LAMP'S TOO (the bookends audit, finding 4; errata 129).
  // A click on him answers through this hotspot, so TALK TO plays the
  // override doc 17 wrote for him instead of nothing at all.
  lamp.heldBy = 'hob';
  lamp.heldByNote = 'A click on the figure who carries this (Hob, a mover with no rect of his own) is a '
    + 'click on it: LOOK and LISTEN speak to him as the lamp does, and TALK TO plays his written '
    + "override. Hovering him names the lamp. Errata 129.";

  return write(path, room);
}


/**
 * DOC 23, ACT II ITEMS: the submission log. Act I's eight items were written
 * into content/items by hand from the same document; this one is extracted,
 * so its words can only be the document's. The section is a `## THE ...`
 * heading, an italic acquisition line, and LOOK / LISTEN runs of three
 * numbered quoted lines: the first is `say`, the rest `repeat`, exactly the
 * shape the hand-written items carry. The full and display names come from
 * the section's table row.
 */
function actTwoItems() {
  const doc = read('docs/23-inventory-act1.md');
  const from = doc.indexOf('## Act II items');
  if (from < 0) throw new Error('doc 23: no Act II items section');
  const body = doc.slice(from, doc.indexOf('## Notes', from));
  const out = [];
  for (const row of body.matchAll(/^\| ([a-z_]+) \| (.+?) \| (.+?) \|$/gm)) {
    const [, id, fullName, display] = row;
    if (id === 'Item') continue;
    const heading = new RegExp(`^## ${display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n([\\s\\S]*?)(?=^## |^---)`, 'm');
    const section = heading.exec(body);
    if (!section) throw new Error(`doc 23: no section for ${display}`);
    const responses = {};
    for (const [verb, label] of [['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
      const line = new RegExp(`^\\*\\*${label}\\*\\* (.+)$`, 'm').exec(section[1]);
      if (!line) throw new Error(`doc 23: ${display} has no ${label} run`);
      const lines = [...line[1].matchAll(/\d "([^"]+)"/g)].map((m) => m[1]);
      if (lines.length !== 3) throw new Error(`doc 23: ${display} ${label} has ${lines.length} lines, not 3`);
      responses[verb] = [{ say: lines[0], repeat: lines.slice(1) }];
    }
    const acquired = /^\*(.+)\*$/m.exec(section[1])?.[1] ?? '';
    // ITEMS FOLLOW THE FLAG (doc 57 A3, doc 36 Q141 route 1). "Held from the
    // start. Traded at A3" is the watch's own acquisition line: carried from
    // a new game until the swindle, which is the flag T_SWINDLED. Its return
    // at B6 is the duel's grant, ordinary inventory.
    const held = /Held from the start\./.test(acquired) && /Traded at A3/.test(acquired)
      ? { heldWhen: { T_SWINDLED: false },
        heldNote: 'From doc 23\'s acquisition line: held from the start until A3 (T_SWINDLED), back at B6 by the duel\'s grant.' }
      : {};
    out.push(write(`content/items/${id.replace(/_/g, '-')}.json`, {
      schema: 1,
      id,
      name: fullName,
      short: display,
      // Errata 66 A is the submission log's ruling, and was stamped on every
      // item here -- the loan and the linen money among them, which are spent
      // and given (the items audit, errata 140).
      note: `EXTRACTED from docs/23-inventory-act1.md (Act II items) by tools/extract-content.mjs. Do not edit: change doc 23 and re-run. ${acquired}${id === 'padded_log' ? ' Errata 66 ruling A: shown to the character at C5 and kept; never consumed.' : ''}`,
      responses,
      ...held,
      ...(FILED_AT_F5.has(id) ? { lostWhen: { T_FILED: true }, lostNote: FILED_NOTE } : {}),
      ...(GIVEN_AWAY[id] ?? {}),
    }));
  }
  return out;
}

/**
 * WHAT IS LAID ON THE COUNTER AT F5 IS ON FILE AFTER IT (errata 133; the
 * bookends audit, finding 10, which Tyler agreed): items follow the flag, as
 * the watch and the four dollars do, so a save restores it by restoring
 * T_FILED. THE DEED is hand-written (content/items/deed.json) and says the
 * same; these three are written here.
 */
const FILED_AT_F5 = new Set(['death_certificate', 'document_c', 'sample']);

/**
 * WHAT IS HANDED OVER IN CONVERSATION FOLLOWS THE FLAG THE HANDING WRITES. A
 * tree may not write inventory (doc 36 Q141 route 1), so an item a character
 * takes in a conversation leaves by the flag that exchange sets, as the four
 * dollars leave by T_SWINDLED. Doc 23: THE LINEN MONEY is "Given to Sheng";
 * doc 57 D4: "SHE_D1 option 1′ — Sheng takes it", which writes T_PRATT_TRAIL.
 * It stayed in the inventory to the end of the game (the items audit, errata 140).
 */
const GIVEN_AWAY = {
  linen_money: { lostWhen: { T_PRATT_TRAIL: true },
    lostNote: 'Given to Sheng at SHE_D1 option 1′ (doc 23; doc 57 D4), which writes T_PRATT_TRAIL: it leaves the inventory with that flag (errata 140).' },
};
const FILED_NOTE = 'Laid on the counter at the filing (doc 57 F5) and on file after it: it leaves the inventory '
  + 'with T_FILED (Tyler agreed, 2026-11-06; errata 133).';

/**
 * The lines of a response cell, in order, with their speakers: an italic
 * quote `*"..."*` is THAD's (doc 04's convention inside another man's reply),
 * a plain quote is the node's own speaker. Emphasis inside a line is dropped
 * (the face has no italic). Italic directions are returned as staging.
 */
function spokenIn(cell, speaker) {
  const lines = [];
  for (const m of cell.matchAll(/\*"([^"]+)"\*|"([^"]+)"/g)) {
    lines.push({ speaker: m[1] !== undefined ? 'thad' : speaker, line: (m[1] ?? m[2]).replace(/\*/g, '') });
  }
  const staging = [...cell.matchAll(/\*\(([^)]+)\)\*/g)].map((m) => m[1]);
  return { lines, staging };
}

/**
 * DOC 04, REGISTRAR CADWALLADER SUMP: Room 7's tree (errata 80).
 *
 * Doc 04 writes Sump's nodes as bold `SUM_XX` lines rather than headings,
 * numbers a rephrase chain's options 1, 1-prime, 1-double-prime and
 * 1-triple-prime (ids sump1, sump1a, sump1b, sump1c), and puts an option's
 * state either in a fifth State column or inside the response after the
 * reply. Read the same way from either: `sets` a backticked flag writes it,
 * `req` a backticked flag gates on it, `req THE SURVEY` gates on carrying it
 * (DialogueOption.holds), `req E1` follows option 1, and a bold puzzle id is
 * the puzzle the option completes.
 *
 * WHAT IS NOT EXTRACTED YET, AND WHY (doc 36 Q150): SUM_B1's option
 * 1-triple-prime needs Documents B and D in hand, and both come from rooms not
 * built (C6, D6); SUM_C1 opens on the death certificate (E4); SUM_F1 is Act
 * IV's filing (doc 48 S6), after F4. Each is extracted when the room that
 * makes it playable is built. Nothing is invented: every string is the
 * document's.
 *
 * ENTRIES: SUM_E1 from Act III ("Open from Act III", errata 75 H's ACT 3),
 * SUM_B1 from Act II ("Act II -- the three documents"), else SUM_A1.
 */
function sumpTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('## REGISTRAR CADWALLADER SUMP');
  const to = doc.indexOf('## DEKE VESSEL', from);
  if (from < 0 || to < 0) throw new Error('doc 04: cannot find the SUMP section');
  const body = doc.slice(from, to);
  const SPEAKER = 'sump';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');
  const DEFER = {};
  const DEFER_OPTION = {};
  // SUM_C1 from E4 (the signing writes T_DEATH_CERTIFIED) until the decease is
  // recorded (doc 57 E5), then Act III's root again.
  // SUM_F1 once the four documents are down (doc 57 F5: "SUM_F1 (doc 04), once
  // all four are down"), until the filing is made.
  const ENTRIES = [
    { when: { F5_LAID: { atLeast: 4 }, T_FILED: false }, node: 'SUM_F1' },
    { when: { T_DEATH_CERTIFIED: true, T_DECEASED: false }, node: 'SUM_C1' },
    { when: { ACT: { atLeast: 3 } }, node: 'SUM_E1' },
    { when: { ACT: { atLeast: 2 } }, node: 'SUM_B1' },
  ];
  // WHAT DOC 57 WRITES THAT DOC 04'S ROWS DO NOT. E0: "SUM_B1 option 1''',
  // holding THE AFFIDAVIT, THE ASSAY OF RECORD and THE ATTESTATION -> THE
  // CERTIFICATE (the three are kept, stamped SEEN), and the viewing ... ->
  // T_CLAIM1_BLANK, E0." E5: "SUM_C1 option 1, presenting the certificate,
  // records the decease -> T_DECEASED."
  const DOC57 = read('docs/57-puzzle-completion.md');
  const viewingAt = DOC57.indexOf('## E0 · The Certificate of Contiguity');
  const viewing = [];
  for (const m of DOC57.slice(viewingAt, DOC57.indexOf('\n## ', viewingAt + 5)).matchAll(/^> \*\*(SUMP|THAD):\*\* (.+)$/gm)) {
    const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
    for (const span of m[2].matchAll(/\*\(([^)]+)\)\*|"([^"]+)"/g)) {
      if (span[1] !== undefined) {
        const shown = performedDirection(span[1]);
        if (shown) viewing.push({ speaker, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
      } else viewing.push({ speaker, line: span[2] });
    }
  }
  if (viewing.length < 4) throw new Error('doc 57 E0: the viewing was not found');
  // THE FILING (doc 57 F5): after the name, WIN_F2 as doc 04 writes it, then
  // beat 4's read-back; T_FILED and F5, and the room hands on to the dawn.
  const scene = (text, names) => {
    const out = [];
    for (const m of text.matchAll(/^> \*\*([A-Z]+):\*\* (.+)$/gm)) {
      const speaker = names[m[1]];
      if (!speaker) throw new Error(`the filing: unknown speaker ${m[1]}`);
      for (const span of m[2].matchAll(/\*\(([^)]+)\)\*|"([^"]+)"/g)) {
        if (span[1] !== undefined) {
          const shown = performedDirection(span[1]);
          if (shown) out.push({ speaker, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
        } else out.push({ speaker, line: span[2] });
      }
    }
    return out;
  };
  const wf2At = doc.indexOf('**`WIN_F2` — the certification');
  const winF2 = scene(doc.slice(wf2At, doc.indexOf('\n---', wf2At)), { WINNIE: 'winnie', THAD: 'thad' });
  const f5At = DOC57.indexOf('**Beat 4 — the read-back:**');
  const readBack = scene(DOC57.slice(f5At, DOC57.indexOf('\n## ', f5At)), { SUMP: SPEAKER, THAD: 'thad' });
  if (winF2.length < 5 || readBack.length < 6) throw new Error('doc 04 WIN_F2 / doc 57 F5 beat 4: the filing does not read');
  const STATE = {
    'SUM_B1:1‴': { holds: ['document_a', 'document_b', 'document_d'], gives: ['document_c'],
      set: { T_CLAIM1_BLANK: true }, puzzle: { E0: 'complete' }, then: viewing },
    'SUM_C1:1': { holds: ['death_certificate'], set: { T_DECEASED: true } },
    // The filing ends the conversation: doc 48 S6 beat 5, "T_FILED. Main Street dawn opens".
    // BEAT 3, THE COUNTY SEAL (doc 48 S6): "One stamp. It is the loudest sound in
    // the game and the score rests under it." A beat with the sound and two
    // seconds of rest, between WIN_F2 and the read-back (errata 99 P).
    'SUM_F1:1': { set: { T_FILED: true }, puzzle: { F5: 'complete' }, ends: true,
      then: [...winF2, { speaker: SPEAKER, line: '…', sound: { src: 'audio/sfx/county-seal.wav', gain: 1, rest: 2 } }, ...readBack] },
    // Doc 04 gives this reply to Winnie by name: "**WINNIE:** "Don't you dare."".
    'SUM_F1:3': { speakerAll: 'winnie' },
  };
  const ITEM = { 'THE SURVEY': 'survey' };
  const PRIME = { '': '', '′': 'a', '″': 'b', '‴': 'c' };
  const unplayed = [];
  const nodes = {};
  let poolIndex = 0;
  const parts = body.split(/^\*\*`(SUM_[A-Z0-9]+)`/m);
  for (let at = 1; at < parts.length; at += 2) {
    const id = parts[at];
    const text = parts[at + 1];
    if (DEFER[id]) { unplayed.push(`${id} not extracted yet: ${DEFER[id]}`); continue; }
    const ROW = /^\| (\d+)(′|″|‴)? \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|(?:[ \t]*(.*?)[ \t]*\|)?[ \t]*$/gm;
    const rows = [...text.matchAll(ROW)];
    if (!rows.length) throw new Error(`doc 04: ${id} has no option rows`);
    const opening = [...text.matchAll(/^> \*\*(SUMP|THAD):\*\* (.+)$/gm)].map((m) => {
      const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
      for (const d of m[2].matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} opening (${speaker}) staging: ${d[1]}`);
      const line = quoted(m[2]).join(' ').replace(/\*/g, '');
      if (!line) throw new Error(`doc 04: ${id} opening line by ${speaker} has no quoted speech`);
      return { speaker, line };
    });
    const lastSump = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    const options = [];
    let hasExit = false;
    for (const [, number, prime, optionCell, tagCell, responseCell, stateCell] of rows) {
      const label = `${number}${prime ?? ''}`;
      if (DEFER_OPTION[`${id}:${label}`]) { unplayed.push(`${id} option ${label} not extracted yet: ${DEFER_OPTION[`${id}:${label}`]}`); continue; }
      const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
      if (!tagged) throw new Error(`doc 04: ${id} option ${label} has no tag`);
      const option = { id: `${SPEAKER}${number}${PRIME[prime ?? '']}`, tag: tagged[1] };
      const optionText = quoted(optionCell)[0];
      if (tagged[1] === 'EXIT') {
        hasExit = true;
        option.text = optionText ?? POOL[poolIndex % POOL.length];
        if (!optionText) { option.universal = true; poolIndex += 1; }
        option.ends = true;
      } else {
        if (!optionText) throw new Error(`doc 04: ${id} option ${label} has no option text`);
        option.text = optionText;
      }
      if (tagged[2]) option.afterUse = tagged[2];
      // The reply, split on *(second)* for a counted repeat; anything after an arrow is state.
      const ORDINALS = { second: 2, third: 3 };
      const [replyCell] = responseCell.split('→');
      const pieces = replyCell.split(/\*\((second|third)\)\*/);
      const first = spokenIn(pieces[0], SPEAKER);
      const stateText = `${stateCell ?? ''} ${responseCell}`;
      for (const d of first.staging) if (!/sets `|\*\*[A-F]\d+\*\*/.test(d)) unplayed.push(`${id} option ${label} staging: ${d}`);
      if (first.lines.length === 1 && first.lines[0].speaker === SPEAKER) option.say = first.lines[0].line;
      else if (first.lines.length) option.exchange = first.lines;
      else throw new Error(`doc 04: ${id} option ${label} has no reply`);
      for (let k = 1; k < pieces.length; k += 2) {
        const later = spokenIn(pieces[k + 1] ?? '', SPEAKER);
        for (const d of later.staging) unplayed.push(`${id} option ${label} selection ${ORDINALS[pieces[k]]} staging: ${d}`);
        if (later.lines.length) (option.repeats ??= []).push({ selection: ORDINALS[pieces[k]], say: later.lines.map((l) => l.line).join(' ') });
      }
      const sets = [...stateText.matchAll(/sets ((?:`[A-Z_0-9]+`(?:, )?)+)/g)]
        .flatMap((m) => [...m[1].matchAll(/`([A-Z_0-9]+)`/g)].map((f) => f[1]));
      if (sets.length) option.set = Object.fromEntries(sets.map((f) => [f, true]));
      const reqFlag = /req `([A-Z_0-9]+)`/.exec(stateText);
      if (reqFlag) option.when = { [reqFlag[1]]: true };
      const reqItem = /req (THE [A-Z ]+?)(?:;|$|\s\*)/.exec(stateText);
      if (reqItem) {
        const item = ITEM[reqItem[1].trim()];
        if (!item) throw new Error(`doc 04: ${id} option ${label} requires "${reqItem[1]}", which has no item id`);
        option.holds = [item];
      }
      const reqPuzzle = /req ([A-F])(\d+)\b/.exec(stateText);
      if (reqPuzzle) option.after = [`${SPEAKER}${reqPuzzle[2]}`];
      const completes = /\*\*([A-F]\d+)\*\*/.exec(stateText);
      if (completes) option.puzzle = { [completes[1]]: 'complete' };
      const more = STATE[`${id}:${label}`];
      if (more?.speakerAll) {
        option.exchange = (option.exchange ?? [{ speaker: SPEAKER, line: option.say }]).map((l) => ({ ...l, speaker: more.speakerAll }));
        delete option.say;
      } else if (more) {
        const { then, ...rest } = more;
        Object.assign(option, rest);
        if (then) {
          option.exchange = [...(option.exchange ?? (option.say ? [{ speaker: SPEAKER, line: option.say }] : [])), ...then];
          delete option.say;
        }
      }
      options.push(option);
    }
    if (!hasExit) {
      options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[poolIndex % POOL.length], universal: true, ends: true });
      poolIndex += 1;
    }
    nodes[id] = { id, ...(lastSump ? { prompt: lastSump.line } : { noPrompt: true,
      exceptionReason: 'Doc 04 writes this node as a table only -- no opening exchange -- so '
        + 'the conversation opens on the choices.' }),
      ...(opening.length ? { opening } : {}), options };
  }
  if (!nodes.SUM_A1) throw new Error('doc 04: SUM_A1 was not extracted');
  const entries = ENTRIES.filter((one) => nodes[one.node]);
  for (const note of unplayed) process.stderr.write(`  doc 04 SUMP: ${note}\n`);
  return write('content/dialogue/sump.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'SUMP',
    speaker: SPEAKER,
    name: 'REGISTRAR SUMP',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (REGISTRAR CADWALLADER SUMP) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a reply are Sump\'s, italic quotes Thad\'s. '
      + 'SUM_F1 waits for F4 (see the extractor); SUM_B1\'s Document C option carries doc 57 E0\'s viewing '
      + '(see the extractor). Universal exit lines are doc 04 part one\'s pool.',
    entries,
    start: 'SUM_A1',
    nodes,
  });
}

/**
 * DOC 04, IGNATIUS FRAME: Room 9's tree (errata 82). Read the way Sump's is
 * (spokenIn, quoted, afterIds), with doc 04's Frame layout: nodes are
 * `## Root: \`FRA_A1\`` and `## \`FRA_B1\`` headings; option 4's later
 * answers are a block after the table ("Option 4 responses rotate and never
 * resolve"); FRA_B1's destination line sits in the State column after
 * `then:`. Every string is the document's.
 *
 * ROUTING THE PROSE NAMES IN WORDS, authored here as A8_CASES is: FRA_A1 1
 * "opens B1 trade" goes to FRA_B1; 6 "begins the funeral day -- C3" is
 * T_FUNERAL_DAY and C3 (doc 57 C3 step 4); 7's "pair 16" is ASSAY_PAIR_16
 * (errata 75 J: the character tells the story of the pair); FRA_B1 1 and 2
 * are B1 (doc 57 B1: "either story pays"); FRA_E1 1 gives THE OBITUARY, sets
 * T_OBITUARY and is E5 (doc 57 E5). FRA_E1 opens on the next TALK TO after
 * T_DECEASED (doc 57 E5).
 */
function frameTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# IGNATIUS FRAME');
  const to = doc.indexOf('## The misspelling gag', from);
  if (from < 0 || to < 0) throw new Error('doc 04: cannot find the IGNATIUS FRAME section');
  const body = doc.slice(from, to);
  const SPEAKER = 'frame';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');
  const ROUTE = {
    'FRA_A1:1': { goto: 'FRA_B1' },
    'FRA_A1:6': { set: { T_FUNERAL_DAY: true }, puzzle: { C3: 'complete' } },
    'FRA_A1:7': { set: { ASSAY_PAIR_16: true } },
    'FRA_B1:1': { puzzle: { B1: 'complete' } },
    'FRA_B1:2': { puzzle: { B1: 'complete' }, sameAs: 1 },
    'FRA_E1:1': { gives: ['obituary'], set: { T_OBITUARY: true }, puzzle: { E5: 'complete' } },
  };
  const ENTRY = { FRA_E1: { T_DECEASED: true } };
  const unplayed = [];
  const nodes = {};
  let poolIndex = 0;
  const parts = body.split(/^## (?:Root: )?`(FRA_[A-Z0-9]+)`.*$/m);
  for (let at = 1; at < parts.length; at += 2) {
    const id = parts[at];
    const text = parts[at + 1];
    const ROW = /^\| (\d+) \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|(?:[ \t]*(.*?)[ \t]*\|)?[ \t]*$/gm;
    const rows = [...text.matchAll(ROW)];
    if (!rows.length) throw new Error(`doc 04: ${id} has no option rows`);
    const opening = [...text.matchAll(/^> \*\*(FRAME|THAD):\*\* (.+)$/gm)].map((m) => {
      const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
      for (const d of m[2].matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} opening (${speaker}) staging: ${d[1]}`);
      const line = quoted(m[2]).join(' ').replace(/\*/g, '');
      if (!line) throw new Error(`doc 04: ${id} opening line by ${speaker} has no quoted speech`);
      return { speaker, line };
    });
    const lastFrame = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    const options = [];
    let hasExit = false;
    for (const [, number, optionCell, tagCell, responseCell, stateCell] of rows) {
      const route = ROUTE[`${id}:${number}`] ?? {};
      const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
      if (!tagged) throw new Error(`doc 04: ${id} option ${number} has no tag`);
      const option = { id: `${SPEAKER}${number}`, tag: tagged[1] };
      const optionText = quoted(optionCell)[0];
      if (tagged[1] === 'EXIT') {
        hasExit = true;
        option.text = optionText ?? POOL[poolIndex % POOL.length];
        if (!optionText) { option.universal = true; poolIndex += 1; }
        option.ends = true;
      } else {
        if (!optionText) throw new Error(`doc 04: ${id} option ${number} has no option text`);
        option.text = optionText;
      }
      if (tagged[2]) option.afterUse = tagged[2];
      const follows = afterIds(tagCell, SPEAKER);
      if (follows) option.after = follows;
      const ORDINALS = { second: 2, third: 3 };
      const [replyCell] = responseCell.split('→');
      const pieces = replyCell.split(/\*\((second|third)\)\*/);
      const first = spokenIn(pieces[0], SPEAKER);
      for (const d of first.staging) unplayed.push(`${id} option ${number} staging: ${d}`);
      // FRA_B1's destination: `then: "..."` in the State column is Frame's next line.
      const thenLine = /then: "([^"]+)"/.exec(stateCell ?? '')?.[1];
      let lines = first.lines;
      if (thenLine) lines = [...lines, { speaker: SPEAKER, line: thenLine }];
      if (route.sameAs) {
        const like = options.find((o) => o.id === `${SPEAKER}${route.sameAs}`);
        const tail = like?.exchange?.at(-1);
        if (!tail) throw new Error(`doc 04: ${id} option ${number} says "the same destination line" and option ${route.sameAs} has none`);
        lines = [...lines, tail];
        // "the same grant": what option N writes, this writes too.
        if (like.set) route.set = { ...like.set, ...(route.set ?? {}) };
      }
      if (lines.length === 1 && lines[0].speaker === SPEAKER) option.say = lines[0].line;
      else if (lines.length) option.exchange = lines;
      else if (first.staging.length) option.beat = first.staging.join(' ');
      else throw new Error(`doc 04: ${id} option ${number} has no reply`);
      for (let k = 1; k < pieces.length; k += 2) {
        const later = spokenIn(pieces[k + 1] ?? '', SPEAKER);
        for (const d of later.staging) unplayed.push(`${id} option ${number} selection ${ORDINALS[pieces[k]]} staging: ${d}`);
        if (later.lines.length) (option.repeats ??= []).push({ selection: ORDINALS[pieces[k]], say: later.lines.map((l) => l.line).join(' ') });
      }
      const state = `${stateCell ?? ''} ${responseCell.split('→').slice(1).join(' ')}`;
      const sets = [...state.matchAll(/sets `([A-Z_0-9]+)`/g)].map((m) => m[1]);
      const counter = /`([A-Z_0-9]+)` \+1/.exec(state);
      const req = /req `([A-Z_0-9]+)`/.exec(state);
      const flags = [...state.matchAll(/→ `([A-Z_0-9]+)`/g)].map((m) => m[1]);
      const set = { ...Object.fromEntries([...sets, ...flags].map((f) => [f, true])), ...(route.set ?? {}) };
      if (Object.keys(set).length) option.set = set;
      if (counter) option.add = { [counter[1]]: 1 };
      if (req) option.when = { [req[1]]: true };
      if (route.goto) option.goto = route.goto;
      if (route.gives) option.gives = route.gives;
      if (route.puzzle) option.puzzle = route.puzzle;
      options.push(option);
    }
    // "Option N responses rotate and never resolve:" -- its later answers, in order.
    const rotate = /\*\*Option (\d+) responses rotate[^*]*\*\*\s*\n((?:> .+\n?)+)/.exec(text);
    if (rotate) {
      const option = options.find((o) => o.id === `${SPEAKER}${rotate[1]}`);
      if (!option) throw new Error(`doc 04: ${id}'s rotating answers name option ${rotate[1]}, which it lacks`);
      const said = [...rotate[2].matchAll(/^> "([^"]+)"/gm)].map((m) => m[1]);
      for (const d of rotate[2].matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} option ${rotate[1]} rotation staging: ${d[1]}`);
      option.repeats = said.map((say, k) => ({ selection: k + 2, say }));
      unplayed.push(`${id} option ${rotate[1]}: "rotate and never resolve" -- the runner plays the three in order and then holds the last`);
    }
    if (!hasExit) {
      options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[poolIndex % POOL.length], universal: true, ends: true });
      poolIndex += 1;
    }
    nodes[id] = { id, ...(lastFrame ? { prompt: lastFrame.line } : { noPrompt: true,
      exceptionReason: 'Doc 04 writes this node as a table only.' }),
      ...(opening.length ? { opening } : {}), options };
  }
  if (!nodes.FRA_A1) throw new Error('doc 04: FRA_A1 was not extracted');
  const entries = Object.entries(ENTRY).filter(([node]) => nodes[node]).map(([node, when]) => ({ when, node }));
  for (const note of unplayed) process.stderr.write(`  doc 04 FRAME: ${note}\n`);
  return write('content/dialogue/frame.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'FRAME',
    speaker: SPEAKER,
    name: 'IGNATIUS FRAME',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (IGNATIUS FRAME) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a reply are Frame\'s, italic quotes Thad\'s. '
      + 'Universal exit lines are doc 04 part one\'s pool.',
    entries,
    start: 'FRA_A1',
    nodes,
  });
}

/**
 * DOC 04, WINNIE LEDGER: the first principal's tree, extracted for Room 5.
 *
 * Doc 04's shape differs from doc 27's in four ways this parser reads rather
 * than normalises: nodes are `## ACT N — ... \`WIN_XX\`` headings with the id
 * in backticks; a node opens on an EXCHANGE of `> **WINNIE:**` / `> **THAD:**`
 * lines, not one root line; the tag cell carries errata 57's aftermath
 * (`[PROGRESS · remove]`); and the State cell names what an option opens,
 * sets or requires in prose with the id in backticks.
 *
 * WHAT IS CARRIED AND WHAT IS NOT, said here because both are decisions:
 *
 *   - The opening exchange is carried whole as `opening`, and the node's
 *     `prompt` is the LAST Winnie line of it, which is the line the choices
 *     are answers to. The renderer draws a prompt as one line; the machinery
 *     to perform an opening exchange does not exist yet, and the words are
 *     kept in the data rather than dropped -- doc 27's Vessel beat sets the
 *     precedent.
 *   - `repeat` carries the second selection's line. A third-selection line
 *     (errata 45's counted-repeat) has no field yet; it stays in the document
 *     and is reported below as unplayed.
 *   - A node with no `[EXIT]` row gets one from doc 04's UNIVERSAL EXIT POOL,
 *     rotating by node, because the document says the pool is "available at
 *     every node" and the runner has no other way out. The doorframe direction
 *     on the third line is not performed.
 *   - `WIN_B3` (one option) and `WIN_C1` (no [COMIC]) do not satisfy doc 04's
 *     own node rules 1 and 2 as written and are NOT extracted; both are Acts
 *     II-III. Reported by name.
 *   - `entries` gate the act roots on the flags doc 04 names. `WIN_B2` names no
 *     flag ("after the padded log") and opens on nothing -- reported.
 *
 * Nothing is invented: every string below is the document's.
 */
function winnieTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# WINNIE LEDGER');
  const to = doc.indexOf('# COLONEL ABSALOM FANSHAWE');
  if (from < 0 || to < 0) throw new Error('doc 04: cannot find the WINNIE LEDGER section');
  const body = doc.slice(from, to);
  const SPEAKER = 'winnie';
  const POOL = [...body.length ? doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm) : []]
    .map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');

  const SKIP = { WIN_B3: 'one option -- a scene with a single [COMIC], below doc 04 rule 1' };
  // WIN_C1, E4 (doc 57: "WIN_C1 opens once T_FUNERAL_BOOKED is set and C5 is
  // complete. Option 4 and the signing -> THE DEATH CERTIFICATE -> E4"). Doc 04
  // calls it "The relationship scene" and writes no [COMIC]: declared, as the
  // letters' node is (check-dialogue-nodes reads `noComic`). The scene after
  // "Then:" is option 4's exchange; the signing hands over the certificate.
  const NO_COMIC = { WIN_C1: 'Doc 04 Act III: "The relationship scene. Six exchanges, and the correct path is not persuasion." Its four rows are the persuasion and the dropping of it; none is a joke option.' };
  const SIGNING = { 'WIN_C1:4': { gives: ['death_certificate'], puzzle: { E4: 'complete' }, set: { T_DEATH_CERTIFIED: true } } };
  // WIN_B4, doc 04: "Opened by the first TALK TO after WIN_B2 option 1 has left
  // C6 pending and Thad has been out of the office and back." The asking writes
  // T_ASSAY_ASKED (below); Room 5's onEnter writes T_ASSAY_BACK on the way back
  // in while that holds (the compiler, doc 57 C6). Before the C5 entry, which
  // stays complete.
  // WIN_C1 on T_FUNERAL_BOOKED alone: C5 is long complete by then (the funeral
  // is booked after the Act II turn, which needs Document B, which needs C5).
  const ENTRY = { WIN_F1: { T_STRIKE_FOUND: true }, WIN_C1: { T_FUNERAL_BOOKED: true }, WIN_B4: { T_ASSAY_BACK: true }, WIN_B1: { T_BORDERS_MOTT: true } };
  // "The opening completes C6 and issues Document B" -- once.
  const ON_OPEN = { WIN_B4: { once: 'T_ASSAY_RETURNED', onOpen: { puzzle: { C6: 'complete' }, gives: ['document_b'] } } };
  const ASKED = { 'WIN_B2:1': { T_ASSAY_ASKED: true } };
  // A PUZZLE-GATED ENTRY: doc 04 heads WIN_B2 "after the padded log (C5)".
  // Errata 66 B-C: C5's completion is puzzle progress, and the action that
  // completes it opens this node and performs its opening; TALK TO afterwards
  // opens the list. Ordered after F1 (Act IV) and before B1 (Act II's root).
  const PUZZLE_ENTRY = { WIN_B2: 'C5' };
  // A ROW THAT MOVES A PUZZLE: doc 04's State cell "grants assay → C6" on
  // WIN_B2's first row; doc 53 reads it as C6 pending (the assay is granted,
  // its return is off screen and later -- errata 66 F).
  // C1 AND C2 ARE THE TOPICS ARRIVING. Doc 57: "C1 · WIN_B1 option 1 ->
  // T_ASSAY_QUEUE. Complete as written." and "C2 · WIN_B1 option 2 ... and
  // option 6 ... -> T_OFFICE_TOPIC, C2" -- option 6 is the row that writes it.
  const PUZZLE_WRITE = { 'WIN_B2:1': { C6: 'pending' }, 'WIN_B1:1': { C1: 'complete' }, 'WIN_B1:6': { C2: 'complete' } };
  const unplayed = [];
  const nodes = {};
  let poolIndex = 0;

  // Node blocks: from a heading carrying a `WIN_XX` id to the next heading.
  const blocks = body.split(/^## /m).slice(1);
  const found = [];
  for (const block of blocks) {
    const idMatch = /`(WIN_[A-Z0-9]+)`/.exec(block.split('\n')[0]);
    if (idMatch) found.push({ id: idMatch[1], text: block });
    // Act IV's nodes sit under one heading as bold `WIN_F1` / `WIN_F2` lines.
    for (const grown of block.split(/^\*\*`(WIN_F\d)`/m).slice(1).reduce((acc, part, index, all) => {
      if (index % 2 === 0) acc.push({ id: part, text: all[index + 1] ?? '' });
      return acc;
    }, [])) found.push(grown);
  }

  for (const { id, text: whole } of found) {
    if (SKIP[id]) { unplayed.push(`${id} not extracted: ${SKIP[id]}`); continue; }
    // A SCENE AFTER THE ROWS: doc 04 WIN_C1 writes "Then:" and the exchange the
    // correct row leads to. It is not the node's opening.
    const [text, thenBlock] = whole.split(/^Then:$/m);
    const then = [];
    for (const m of (thenBlock ?? '').matchAll(/^> \*\*(WINNIE|THAD):\*\* (.+)$/gm)) {
      const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
      for (const span of m[2].matchAll(/\*\(([^)]+)\)\*|"([^"]+)"/g)) {
        if (span[1] !== undefined) {
          const shown = performedDirection(span[1]);
          if (shown) then.push({ speaker, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
        } else then.push({ speaker, line: span[2] });
      }
    }
    // `[ \t]*`, NOT `\s*`: a whitespace class that includes the newline let the
    // optional fifth cell of a four-column row run on into the next row, and
    // Act IV's option 1 came out carrying option 2 as its state.
    const ROW = /^\| (\d+) \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|(?:[ \t]*(.*?)[ \t]*\|)?[ \t]*$/gm;
    const rows = [...text.matchAll(ROW)].filter((r) => !/^#/.test(r[1]));
    if (!rows.length) {
      if (id === 'WIN_F2') { unplayed.push(`${id}: a scripted exchange with no options (doc 48 S6), not a node`); continue; }
      throw new Error(`doc 04: ${id} has no option rows`);
    }
    // THE OPENING IS SPOKEN, SO IT IS SPEECH. Each `> **WINNIE:**` line used to
    // be carried whole -- quote marks, italic directions and all -- because
    // nothing played it: the engine drew the node's last line as a caption
    // over the options and the exchange itself never reached the screen.
    // Tyler's playthrough (2026-09-04) asked for the exchange to play, so it
    // is carried the way an option's reply is: the quoted words, and any
    // italic direction reported as staging rather than spoken.
    const opening = [...text.matchAll(/^> \*\*(WINNIE|THAD):\*\* (.+)$/gm)]
      .map((m) => {
        const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
        for (const d of m[2].matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} opening (${speaker}) staging: ${d[1]}`);
        const line = quoted(m[2]).join(' ');
        if (!line) throw new Error(`doc 04: ${id} opening line by ${speaker} has no quoted speech`);
        return { speaker, line };
      });
    const lastWinnie = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    // A prompt is one drawn line: the quoted speech only, directions dropped
    // (they survive in `opening`).
    const promptText = lastWinnie?.line ?? null;
    const options = [];
    let hasExit = false;
    for (const [, number, optionCell, tagCell, responseCell, stateCell] of rows) {
      const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
      if (!tagged) throw new Error(`doc 04: ${id} option ${number} has no tag`);
      const tag = tagged[1];
      const afterUse = tagged[2] ?? null;
      const option = { id: `${SPEAKER}${number}`, tag };
      const follows = afterIds(tagCell, SPEAKER);
      if (follows) option.after = follows;
      const text = quoted(optionCell)[0];
      if (tag === 'EXIT') {
        hasExit = true;
        option.text = text ?? POOL[poolIndex % POOL.length];
        if (!text) { option.universal = true; poolIndex += 1; }
        option.ends = true;
      } else {
        if (!text) throw new Error(`doc 04: ${id} option ${number} has no option text`);
        option.text = text;
      }
      if (afterUse) option.afterUse = afterUse;
      // The response: directions in italics are kept as `beat`; the quoted
      // line is the reply. A rephrase direction names the replacement text.
      // LATER SELECTIONS, INLINE: doc 04 writes a counted-repeat's second and
      // third answers in the response cell after `*(second)*` / `*(third)*`
      // markers. Split on them: the first part is the first selection's, each
      // later part is that selection's `repeats` entry (errata 45, W1).
      const ORDINALS = { second: 2, third: 3, fourth: 4, fifth: 5 };
      const parts = responseCell.split(/\*\((second|third|fourth|fifth)\)\*/);
      const firstCell = parts[0];
      const laterCells = [];
      for (let at = 1; at < parts.length; at += 2) laterCells.push({ selection: ORDINALS[parts[at]], cell: parts[at + 1] ?? '' });
      const directions = [...firstCell.matchAll(/\*\(([^)]+)\)\*/g)].map((m) => m[1]);
      const rephrase = directions.find((d) => /^rephrases after/.test(d));
      const plainDirections = directions.filter((d) => !/^rephrases after/.test(d));
      const spoken = firstCell.replace(/\*\([^)]*\)\*/g, '');
      const lines = quoted(spoken);
      // EVERY QUOTED LINE IS SAID (errata 120). This kept the first and dropped
      // the rest, which lost WIN_F1's "File it. I'll be at the Registrar's when
      // you do." -- the only line that sends Thad to the last filing (F5).
      if (lines.length > 1) option.exchange = lines.map((line) => ({ speaker: SPEAKER, line }));
      else if (lines[0]) option.say = lines[0];
      for (const later of laterCells) {
        for (const d of later.cell.matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} option ${number} selection ${later.selection} staging: ${d[1]}`);
        const line = quoted(later.cell.replace(/\*\([^)]*\)\*/g, ''))[0];
        if (line) (option.repeats ??= []).push({ selection: later.selection, say: line });
      }
      // A DIRECTION BESIDE A LINE IS STAGING, NOT A BEAT. The schema allows an
      // option one or the other: a `beat` is what plays when there is no line
      // (doc 27's Vessel swindle). "(long pause) 'Congratulations.'" has a
      // line, so the pause is reported as staging exactly as doc 27's are,
      // and the words are what the option says.
      if (plainDirections.length && !lines[0]) option.beat = plainDirections.join(' ');
      else if (plainDirections.length) unplayed.push(`${id} option ${number} staging: ${plainDirections.join(' ')}`);
      if (rephrase) {
        const parts = /^rephrases after (\S+) to "(.+?)" → "(.+?)"$/.exec(rephrase);
        if (parts) option.rephrase = { after: parts[1], text: parts[2], say: parts[3] };
        else unplayed.push(`${id} option ${number}: rephrase direction not read: ${rephrase}`);
      }
      // State: opens / sets / req, by backticked id.
      const state = stateCell ?? '';
      const opens = /opens `(WIN_[A-Z0-9]+)`/.exec(state);
      // A write may sit in the response's own direction instead (doc 04 WIN_F1
      // option 1: "*(sets `T_ASSAY_RUN`; errata 75)*").
      const sets = /sets `([A-Z_0-9]+)`/.exec(state) ?? /\*\(sets `([A-Z_0-9]+)`/.exec(responseCell);
      const req = /req `([A-Z_0-9]+)`/.exec(state);
      if (opens) option.goto = opens[1];
      if (sets) option.set = { [sets[1]]: true };
      if (req) option.when = { [req[1]]: true };
      const puzzleWrite = PUZZLE_WRITE[`${id}:${number}`];
      if (puzzleWrite) option.puzzle = puzzleWrite;
      if (ASKED[`${id}:${number}`]) option.set = { ...option.set, ...ASKED[`${id}:${number}`] };
      const signing = SIGNING[`${id}:${number}`];
      if (signing) {
        if (!then.length) throw new Error(`doc 04: ${id} option ${number} leads to a scene with no lines`);
        Object.assign(option, signing);
        option.exchange = [...(option.exchange ?? (option.say ? [{ speaker: SPEAKER, line: option.say }] : [])), ...then];
        delete option.say;
      }
      // THE SPARRING (doc 57 C6): WIN_B4's teaching row, doc 03's exchange and pairs.
      if (tag === 'ASSAY' && /\bpairs? \d/.test(`${responseCell} ${state}`)) {
        teachingRow(option, `${responseCell} | ${state}`, { teacher: 'Winnie', owner: SPEAKER, sparring: 'Winnie' });
      } else if (state && !opens && !sets && !req && !puzzleWrite && state !== '—') {
        unplayed.push(`${id} option ${number} state "${state}" names no flag; nothing set`);
      }
      options.push(option);
    }
    // LATER SELECTIONS, BY LINE. `**Repeat on option N:**` / `**Option N,
    // repeat:**` is the second selection's answer; `**Third selection:**`
    // (unnumbered) continues the option most recently named; `**Option N,
    // fifth selection:**` is the fifth's, an exchange whose quoted lines are
    // hers and whose directions are staging. W1 carries all of them as
    // `repeats`, by selection number; the runner clamps at the last.
    let named = null;
    for (const line of text.split('\n')) {
      const second = /^\*\*(?:Repeat on option|Option) (\d+),? ?(?:repeat)?:\*\* (.+)$/.exec(line);
      const third = /^\*\*Third selection:\*\* (.+)$/.exec(line);
      const fifth = /^\*\*Option (\d+), fifth selection:\*\* (.+)$/.exec(line);
      const hit = second ? { number: second[1], selection: 2, cell: second[2] }
        : third && named ? { number: named, selection: 3, cell: third[1] }
          : fifth ? { number: fifth[1], selection: 5, cell: fifth[2] } : null;
      if (!hit) continue;
      named = hit.number;
      const option = options.find((o) => o.id === `${SPEAKER}${hit.number}`);
      if (!option) { unplayed.push(`${id}: a selection ${hit.selection} line names option ${hit.number}, which the node lacks`); continue; }
      for (const d of hit.cell.matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} option ${hit.number} selection ${hit.selection} staging: ${d[1]}`);
      const spokenLines = quoted(hit.cell.replace(/\*\([^)]*\)\*/g, ''));
      if (!spokenLines.length) continue;
      const entry = spokenLines.length === 1 ? { selection: hit.selection, say: spokenLines[0] }
        : { selection: hit.selection, exchange: spokenLines.map((l) => ({ speaker: SPEAKER, line: l })) };
      option.repeats = [...(option.repeats ?? []).filter((r) => r.selection !== hit.selection), entry]
        .sort((a, b) => a.selection - b.selection);
    }
    if (!hasExit) {
      options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[poolIndex % POOL.length], universal: true, ends: true });
      poolIndex += 1;
    }
    nodes[id] = { id, ...(NO_COMIC[id] ? { noComic: true, noComicReason: NO_COMIC[id] } : {}), ...(promptText ? { prompt: promptText } : { noPrompt: true,
      exceptionReason: 'Doc 04 writes this node as a table only -- no opening exchange -- so '
        + 'the conversation continues from the previous node\'s line rather than opening on one.' }),
      ...(opening.length ? { opening } : {}), options };
  }

  if (!nodes.WIN_A1) throw new Error('doc 04: WIN_A1 was not extracted');
  for (const [node, { once, onOpen }] of Object.entries(ON_OPEN)) {
    if (nodes[node]) Object.assign(nodes[node], { openingOnce: once, onOpen });
  }
  const entries = [];
  for (const [node, when] of Object.entries(ENTRY)) {
    if (!nodes[node]) continue;
    entries.push({ when, node });
    // The puzzle-gated entry sits after Act IV's and before Act II's root.
    if (node === 'WIN_B4') for (const [gated, puzzle] of Object.entries(PUZZLE_ENTRY)) if (nodes[gated]) entries.push({ puzzle, node: gated });
  }
  for (const note of unplayed) process.stderr.write(`  doc 04 WINNIE: ${note}\n`);

  return write('content/dialogue/winnie.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'WINNIE',
    speaker: SPEAKER,
    name: 'WINNIE LEDGER',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (WINNIE LEDGER) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a response are Winnie; the '
      + 'opening exchange is carried whole as `opening` and the prompt is its last Winnie line. '
      + 'WIN_B3 is not extracted (see the extractor). Universal exit lines are doc '
      + '04 part one\'s pool.',
    entries,
    start: 'WIN_A1',
    nodes,
  });
}

/**
 * HOB, from doc 04's `# HOB` section: HOB_A1 (Acts I–II), HOB_C1 (after the
 * coffin, E8) and HOB_C2 (the confession, E10).
 *
 * The same typography Winnie's tree is read by -- a `> **HOB:**` / `> **THAD:**`
 * opening, a four-column table whose tag carries its aftermath (`[TOPIC ·
 * retain]`), plain quotes in a response are Hob's, italic brackets are
 * staging -- with two forms of Hob's own:
 *
 * - `*(nothing)*` is the whole reply on three Act I options. Doc 04: "Hob
 *   keeps walking." It is carried as the option's `beat`, the form Tyler
 *   ruled for a reply that is a direction (2026-10-31, option A).
 * - `Thad: "…"` after a dash is THAD'S aside, not Hob's line -- "Thad's aside
 *   supplies the joke". Carried as a one-line exchange spoken by Thad.
 *
 * The state is in the response cell, after the arrow: a backticked flag is
 * set; `pair 21` is the Liar's Assay, reported (doc 03 machinery is not
 * built). Emphasis inside a quoted line is dropped -- the face has no italic
 * -- and reported, never silently.
 *
 * ENTRIES (errata 71 D). HOB_C2 after E9 and HOB_C1 after E8, each a
 * puzzle-gated entry in errata 66 C's sense: the action that completes the
 * puzzle performs the node's opening once -- Room 32's lid (E8), doc 48 S4's
 * shack scene (E10's frame) -- and a TALK TO afterwards opens the list.
 */
function hobTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('\n# HOB\n');
  if (from < 0) throw new Error('doc 04: cannot find the HOB section');
  const rest = doc.slice(from + 1);
  const end = rest.slice(1).search(/^# /m);
  const body = end < 0 ? rest : rest.slice(0, end + 1);
  const SPEAKER = 'hob';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)]
    .map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');
  // HOB_E6 (doc 04): "Open once `T_EXECUTOR_RULE` is set and until E6 is
  // complete" -- E6 writes `T_EXECUTOR_NAMED` (doc 57 E6), which closes it.
  const PUZZLE_ENTRY = [{ puzzle: 'E9', node: 'HOB_C2' }, { puzzle: 'E8', node: 'HOB_C1' },
    { when: { T_EXECUTOR_RULE: true, T_EXECUTOR_NAMED: false }, node: 'HOB_E6' }];
  // A STATE COLUMN (HOB_E6's fifth): "gives THE EXECUTOR'S FORM" names an item
  // by its short name, read from the item files.
  const ITEMS = new Map(readdirSync(resolve(ROOT, 'content/items')).filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(read(`content/items/${f}`))).map((item) => [item.short, item.id]));
  const unplayed = [];
  const nodes = {};
  let poolIndex = 0;
  const said = (text, where) => {
    if (/\*/.test(text)) unplayed.push(`${where}: emphasis dropped from "${text}"`);
    return plain(text);
  };

  for (const block of body.split(/^## /m).slice(1)) {
    const id = /`(HOB_[A-Z0-9]+)`/.exec(block.split('\n')[0])?.[1];
    if (!id) continue;
    const opening = [...block.matchAll(/^> \*\*(HOB|THAD):\*\* (.+)$/gm)].map((m) => {
      const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
      const line = quoted(m[2]).map((q) => said(q, `${id} opening`)).join(' ');
      if (!line) throw new Error(`doc 04: ${id} opening line by ${speaker} has no quoted speech`);
      return { speaker, line };
    });
    const lastHob = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    const ROW = /^\| (\d+) \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*$/gm;
    const options = [];
    for (const [, number, optionCell, tagCell, responseCell] of block.matchAll(ROW)) {
      const where = `${id} option ${number}`;
      const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
      if (!tagged) throw new Error(`doc 04: ${where} has no tag`);
      const text = quoted(optionCell)[0];
      if (!text) throw new Error(`doc 04: ${where} has no option text`);
      const option = { id: `${SPEAKER}${number}`, tag: tagged[1], text: said(text, where) };
      const follows = afterIds(tagCell, SPEAKER);
      if (follows) option.after = follows;
      if (tagged[2]) option.afterUse = tagged[2];
      // HOB_E6's table has a fifth column, State: the response cell ends at
      // its pipe, and what the state gives is read from it.
      const [responseOnly, stateCell = ''] = responseCell.split(/[ \t]*\|[ \t]*/);
      const gives = /^gives (THE [A-Z' ]+)$/.exec(plain(stateCell).trim());
      if (gives) {
        const item = ITEMS.get(gives[1]);
        if (!item) throw new Error(`doc 04: ${where} gives "${gives[1]}", which no item is called`);
        option.gives = [item];
      } else if (stateCell.trim() && stateCell.trim() !== '—') {
        throw new Error(`doc 04: ${where} has a state "${stateCell}" this reader does not know`);
      }
      const [spoken, ...after] = responseOnly.split('→');
      // Thad's aside: everything after `Thad:` is his.
      const [hobPart, thadPart] = spoken.split(/\bThad:/);
      const hobLines = quoted(hobPart.replace(/\*\([^)]*\)\*/g, '')).map((q) => said(q, where));
      const thadLines = thadPart ? quoted(thadPart).map((q) => said(q, where)) : [];
      const directions = [...hobPart.matchAll(/\*\(([^)]+)\)\*/g)].map((m) => m[1]);
      if (thadLines.length && hobLines.length) throw new Error(`doc 04: ${where} has both Hob's line and Thad's aside`);
      if (thadLines.length) {
        option.exchange = thadLines.map((line) => ({ speaker: 'thad', line }));
        unplayed.push(`${where} staging: ${directions.join(' ')} (Hob does not answer; Thad's aside plays)`);
      } else if (hobLines.length === 1) {
        option.say = hobLines[0];
        if (directions.length) unplayed.push(`${where} staging: ${directions.join(' ')}`);
      } else if (hobLines.length > 1) {
        option.exchange = hobLines.map((line) => ({ speaker: SPEAKER, line }));
      } else if (directions.length) {
        option.beat = directions.join(' ');
      } else {
        throw new Error(`doc 04: ${where} has no line and no direction`);
      }
      const state = after.join('→');
      const flag = /`(T_[A-Z_0-9]+)`/.exec(state);
      if (flag) option.set = { [flag[1]]: true };
      // A TEACHING ROW (doc 57: pair 21 is Hob's, HOB_A1 option 6). The flag is
      // written quietly; the row keeps doc 04's tag and nothing marks it.
      const pair = /pair (\d+)/.exec(state);
      if (pair && option.tag === 'ASSAY') teachingRow(option, state, { teacher: 'Hob', owner: SPEAKER });
      else if (pair) unplayed.push(`${where}: Liar's Assay pair ${pair[1]} on a ${option.tag} row; nothing set`);
      if (state.trim() && !flag && !pair) unplayed.push(`${where}: state "${plain(state)}" names no flag; nothing set`);
      options.push(option);
    }
    if (options.length < 3) throw new Error(`doc 04: ${id} has ${options.length} options`);
    if (!options.some((o) => o.tag === 'EXIT')) {
      options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[poolIndex % POOL.length], universal: true, ends: true });
      poolIndex += 1;
    }
    nodes[id] = { id, ...(lastHob ? { prompt: lastHob.line } : { noPrompt: true,
      exceptionReason: 'Doc 04 writes HOB_A1 as a table only -- no opening exchange. Hob is a man walking past; '
        + 'TALK TO offers the list and he does not stop to greet.' }),
      ...(opening.length ? { opening } : {}), options };
  }
  for (const want of ['HOB_A1', 'HOB_C1', 'HOB_C2']) if (!nodes[want]) throw new Error(`doc 04: ${want} was not extracted`);
  // DOC 48 S4 AROUND HOB_C2 (doc 57 E10, errata 94 E). "Entering the shack
  // after E9 plays doc 48 S4 beat 1, then HOB_C2's opening": beat 1's line is
  // the opening's first. And beat 3, "after settle", is the conversation's end:
  // its flags (`T_STRIKE_WAS_LIE` is doc 04's `T_NO_GOLD_EVER`, errata 75 K),
  // Hob's line, and ACT 4, whose rise brings the Part Four card.
  {
    const s4 = read('docs/48-act-turn-beats.md');
    const at = s4.indexOf('## S4 · THE CONFESSION');
    if (at < 0) throw new Error('doc 48: no S4');
    const section = s4.slice(at, s4.indexOf('\n## ', at + 5));
    const beat = (n) => {
      const m = new RegExp(`^\\| ${n} \\| (.+?) \\| [a-z]+ \\|$`, 'm').exec(section);
      if (!m) throw new Error(`doc 48 S4: no beat ${n}`);
      const lines = quoted(m[1]);
      if (lines.length !== 1) throw new Error(`doc 48 S4 beat ${n}: ${lines.length} quoted lines, not 1`);
      return lines[0];
    };
    nodes.HOB_C2.opening = [{ speaker: SPEAKER, line: said(beat(1), 'S4 beat 1') }, ...(nodes.HOB_C2.opening ?? [])];
    const leave = nodes.HOB_C2.options.find((one) => one.tag === 'EXIT');
    if (!leave) throw new Error('doc 04: HOB_C2 has no way out');
    leave.say = said(beat(3), 'S4 beat 3');
    // The act turn owes Act IV's opening (errata 101 B): its `due` flag is
    // written with ACT, so a load before the cut still makes it.
    leave.set = { T_HOB_IS_MOTT: true, T_NO_GOLD_EVER: true, ACT: 4, [actOpenings()[4].due]: true };
  }
  const running = /^\*\*Running:\*\*/m.test(body);
  if (running) unplayed.push('the "Running" lines (every fourth night, unprompted) are ambient barks, not this tree -- carried by the ambient layer when Hob is placed');
  for (const note of unplayed) process.stderr.write(`  doc 04 HOB: ${note}\n`);

  return write('content/dialogue/hob.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'HOB',
    speaker: SPEAKER,
    name: 'HOB',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (HOB) by tools/extract-content.mjs. Do not edit: '
      + 'change doc 04 and re-run. Plain quotes in a response are Hob\'s; "Thad:" marks Thad\'s aside; '
      + 'an italic bracket alone is a beat. Entries are errata 71 D\'s. Universal exit lines are doc 04 '
      + 'part one\'s pool.',
    entries: PUZZLE_ENTRY,
    start: 'HOB_A1',
    nodes,
  });
}

/**
 * DOC 04's VES_B1: Vessel found again, in the Nugget's back room (errata 73 B).
 *
 * Merged into the DEKE_VESSEL tree doc 27 already writes, as a second node the
 * tree OPENS ON once Vessel has been found (B3): one man, one tree file, the
 * Act I root and the Act II root, which is the shape doc 04 gives Winnie and
 * Hob. Option 3 starts Duel One and option 5 Duel Two -- the `duel` field names
 * the duel in content/assay/assay.json, and the runner plays it after the
 * option's own reply. Option 5's gate is errata 73 H's "offered once Duel One
 * is lost", and it closes once Duel Two is won, because a won duel has nothing
 * left to yield.
 */
function vesselActTwo() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('## DEKE VESSEL');
  if (from < 0) throw new Error('doc 04: cannot find the DEKE VESSEL section');
  const rest = doc.slice(from + 1);
  const body = rest.slice(0, rest.search(/^## /m) > 0 ? rest.search(/^## /m) : rest.length);
  const block = body.slice(body.indexOf('`VES_B1`'), body.indexOf('`VES_F1`'));
  if (!block.includes('VES_B1')) throw new Error('doc 04: VES_B1 not found');
  const SPEAKER = 'deke_vessel';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)]
    .map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');
  const notes = [];
  const said = (text, where) => {
    if (/\*/.test(text)) notes.push(`${where}: emphasis dropped from "${text}"`);
    return plain(text);
  };
  const ROW = /^\| (\d+) \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*$/gm;
  const options = [];
  for (const [, number, optionCell, tagCell, responseCell] of block.matchAll(ROW)) {
    const where = `VES_B1 option ${number}`;
    const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
    if (!tagged) throw new Error(`doc 04: ${where} has no tag`);
    const text = quoted(optionCell)[0];
    if (!text) throw new Error(`doc 04: ${where} has no option text`);
    const option = { id: `ves_b1_${number}`, tag: tagged[1], text: said(text, where) };
    if (tagged[2]) option.afterUse = tagged[2];
    const [spoken, ...after] = responseCell.split('→');
    // A counted-repeat writes its later answers after *(second)*, *(third)*.
    const runs = spoken.split(/\*\((second|third|fourth)\)\*/);
    const first = quoted(runs[0].replace(/\*\([^)]*\)\*/g, '')).map((q) => said(q, where));
    for (const direction of stageDirections(runs[0])) notes.push(`${where} staging: ${direction}`);
    if (first.length === 0) throw new Error(`doc 04: ${where} answers in no line`);
    // Two lines with a beat between them (option 6) are an exchange, both his.
    if (first.length === 1) option.say = first[0];
    else option.exchange = first.map((line) => ({ speaker: SPEAKER, line }));
    const ORDINAL = { second: 2, third: 3, fourth: 4 };
    for (let at = 1; at < runs.length; at += 2) {
      const line = quoted(runs[at + 1])[0];
      if (!line) throw new Error(`doc 04: ${where} ${runs[at]} selection has no line`);
      (option.repeats ??= []).push({ selection: ORDINAL[runs[at]], say: said(line, where) });
    }
    const state = after.join('→');
    const duel = /\*\*Duel (One|Two)\.?\*\*/.exec(state);
    if (duel) option.duel = duel[1] === 'One' ? 'duel_one' : 'duel_two';
    if (duel?.[1] === 'Two') option.when = { T_DUEL_ONE_LOST: true, T_DUEL_TWO_WON: false };
    // OPTION 3 IS THE REPLAY (errata 76 A: "Option 3 is the replay ('twice if
    // asked')"; doc 57 B5: "replays it for anyone who enjoys losing"). So it is
    // offered once Duel One is lost, which keeps B4 -- option 6 -- the way in
    // (errata 130 D), and not after Duel Two is won, when the judges have gone
    // home and there is no Assay left to sit.
    if (duel?.[1] === 'One' && !/\*\*B\d\*\*/.test(state)) option.when = { T_DUEL_ONE_LOST: true, T_DUEL_TWO_WON: false };
    // A PUZZLE THE ROW COMPLETES: option 6's "-> **B4**; **Duel One**" (errata 75).
    const puzzle = /\*\*(B\d)\*\*/.exec(state);
    if (puzzle) option.puzzle = { [puzzle[1]]: 'complete' };
    for (const direction of stageDirections(state)) notes.push(`${where} after: ${direction}`);
    if (state.trim() && !duel && !puzzle) notes.push(`${where}: state "${plain(state)}" names no duel; nothing set`);
    options.push(option);
  }
  if (options.length !== 6) throw new Error(`doc 04: VES_B1 has ${options.length} options, not 6`);
  if (!options.some((o) => o.tag === 'COMIC')) throw new Error('doc 04: VES_B1 has no [COMIC] option');
  options.push({ id: 'ves_b1_x', tag: 'EXIT', text: POOL[3 % POOL.length], universal: true, ends: true });
  for (const note of notes) process.stderr.write(`  doc 04 VES_B1: ${note}\n`);
  // ITS OPENING IS DOC 03'S DUEL ONE EXCHANGE (doc 04, errata 75: "Its opening
  // is doc 03's Duel One exchange"), played on the first TALK TO only (doc 57
  // B4: "The first TALK TO plays..."): `openingOnce` names the flag that
  // records it has been played.
  const three = read('docs/03-liars-assay.md');
  const duelOne = three.slice(three.indexOf('## DUEL ONE'), three.indexOf('## THE SPARRING'));
  const firstGroup = duelOne.split(/\n\n/).find((chunk) => /^> \*\*VESSEL:\*\*/m.test(chunk));
  const opening = [...firstGroup.matchAll(/^> \*\*([A-Z]+):\*\* "(.+?)"$/gm)]
    .map(([, who, line]) => ({ speaker: who === 'THAD' ? 'thad' : SPEAKER, line: plain(line) }));
  if (opening.length !== 3) throw new Error('doc 03: Duel One opening is not three lines');
  return {
    node: {
      id: 'VES_B1',
      prompt: opening[opening.length - 1].line,
      opening,
      openingOnce: 'T_VESSEL_GREETED',
      options,
    },
    entries: [{ when: { T_VESSEL_FOUND: true }, node: 'VES_B1' }],
  };
}

/**
 * DOC 03, THE LIAR'S ASSAY, as data the duel runner plays (errata 73).
 *
 * Every line here is the document's: the 23 boasts and counters, the three
 * wrong answers per pair with the reply each one gets (errata 73 A), the
 * standing mockery pool, and Duels One and Two's spoken scenes. Pair 24 is
 * Duel Four's and lives in its section; Duel Three's fifth exchange is the
 * Main Street duel's and is extracted when that duel is built.
 *
 * WHAT IS NOT TEXT is marked as a ruling and carries its source: Duel One's
 * sequence (errata 73 D), what Thad is offered (73 C), Duel Two's order and
 * threshold (73 E, errata 76 A). A reply's speaker is the document's own
 * attribution: Vessel and Reply are Vessel in Room 4's two duels; Fanshawe is
 * Fanshawe.
 */
/**
 * WHO TEACHES EACH PAIR, from doc 03's own tiers ("## Tier 2 — Learned from
 * Winnie Ledger (5)"), or the pair's own "(Frame)" note in Tier 4. The pair
 * table is assay()'s; this is the part a teaching row needs.
 */
function docThreeTeachers() {
  const doc = read('docs/03-liars-assay.md');
  const two = doc.slice(doc.indexOf('# PART TWO'), doc.indexOf('# PART THREE'));
  const out = new Map();
  for (const tier of two.split(/^## Tier /m).slice(1)) {
    const head = /^(\d) — (.+?) \((\d+)\)/.exec(tier);
    if (!head) throw new Error(`doc 03: unreadable tier heading "${tier.split('\n')[0]}"`);
    for (const [, n, who] of tier.matchAll(/^\*\*(\d+)\.\*\*(?: \*\((.+?)\)\*)?\n/gm)) {
      out.set(Number(n), { who: who ?? plain(head[2]).replace(/^Learned from /, ''), tier: Number(head[1]) });
    }
  }
  return out;
}

/**
 * A SPARRING, from doc 03 PART FOUR ("## THE SPARRING — Winnie (C6)"): the
 * exchange as written, each line by the speaker the document names, and each
 * italic direction through doc 58's rule (a bare pause is a held "…").
 */
function docThreeSparring(name, owner) {
  const doc = read('docs/03-liars-assay.md');
  const heading = `## THE SPARRING — ${name}`;
  const from = doc.indexOf(heading);
  if (from < 0) throw new Error(`doc 03: no "${heading}"`);
  const next = doc.indexOf('\n## ', from + heading.length);
  const lines = [];
  for (const raw of doc.slice(from, next < 0 ? undefined : next).split('\n')) {
    const spoken = /^> \*\*([A-Z]+):\*\* (.+)$/.exec(raw);
    const direction = /^> \*\(([^)]+)\)\*$/.exec(raw);
    if (spoken) {
      const speaker = spoken[1] === 'THAD' ? 'thad' : spoken[1].toLowerCase();
      if (speaker !== 'thad' && speaker !== owner) throw new Error(`doc 03: ${heading} has a line by ${spoken[1]}, not ${owner}`);
      for (const d of spoken[2].matchAll(/\*\(([^)]+)\)\*/g)) {
        const shown = performedDirection(d[1]);
        if (shown) lines.push({ speaker, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
      }
      const said = quoted(spoken[2].replace(/\*\([^)]*\)\*/g, ''));
      if (said.length !== 1) throw new Error(`doc 03: ${heading}: "${spoken[2]}" is not one line`);
      lines.push({ speaker, line: said[0].trimEnd() });
    } else if (direction) {
      const shown = performedDirection(direction[1]);
      if (shown) lines.push({ speaker: owner, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
    }
  }
  if (lines.length < 2) throw new Error(`doc 03: ${heading} has no exchange`);
  return lines;
}

/**
 * AN [ASSAY] ROW THAT TEACHES (doc 57's pair table; doc 04's own cell says
 * "pairs 5–9", "pair 21"). The pairs are read from the row, and doc 03 must
 * agree that this character teaches every one of them; the row then writes
 * their knowledge flags. Nothing is shown for it -- the row keeps doc 04's tag
 * and nothing else (invariant 7's rule for a row that sets something quietly).
 *
 * A row that names "**the Sparring** (doc 03)" performs that exchange after
 * the row's own reply; doc 03's sparring may open on the reply itself (Pratt's
 * "Try me."), which is then said once.
 */
function teachingRow(option, cells, { teacher, owner, sparring }) {
  const range = /\bpairs? (\d+)(?:\s*[–-]\s*(\d+))?/.exec(plain(cells));
  if (!range) throw new Error(`doc 04: ${owner} row "${option.text}" teaches no pairs it names`);
  const first = Number(range[1]);
  const last = Number(range[2] ?? range[1]);
  const teachers = docThreeTeachers();
  const set = {};
  for (let n = first; n <= last; n += 1) {
    const taught = teachers.get(n);
    if (!taught || !taught.who.toLowerCase().includes(teacher.toLowerCase())) {
      throw new Error(`doc 04 says ${teacher} teaches pair ${n}; doc 03 says ${taught?.who ?? 'nobody'}`);
    }
    set[`ASSAY_PAIR_${String(n).padStart(2, '0')}`] = true;
  }
  option.set = { ...option.set, ...set };
  if (sparring && /\*\*the Sparring\*\* \(doc 03\)/.test(cells)) {
    const exchange = docThreeSparring(sparring, owner);
    const reply = option.say ? [{ speaker: owner, line: option.say }] : (option.exchange ?? []);
    const opensOnReply = reply.length === 1 && exchange[0].speaker === owner && exchange[0].line === reply[0].line;
    // EVERY PAIR THE ROW GRANTS IS PERFORMED (errata 136 C; Tyler, 2026-11-06,
    // "Sparrings show every pair": the practice rounds perform each boast and
    // counter they grant, using existing lines only). Doc 03's sparring
    // performs one; the others are run through first, as the sparring itself
    // has them: Thad says the boast, the teacher says the counter. Every word
    // is doc 03 Part Two's. They come after the row's reply -- or after the
    // sparring's own first line where the sparring opens on it (Pratt's "Try
    // me.") -- and before the rest of the sparring, so Winnie's "Say it again."
    // and Pratt's astonishment land where doc 03 wrote them, at the end.
    const pairs = assayPairs();
    const said = exchange.filter((line) => line.speaker === 'thad').map((line) => line.line.replace(/\s*[—–-]+\s*$/, ''));
    const performed = (pair) => said.some((line) => line.length > 0 && pair.boast.startsWith(line));
    const run = [];
    for (let n = first; n <= last; n += 1) {
      const pair = pairs.find((one) => one.n === n);
      if (!pair) throw new Error(`doc 03: no pair ${n} to run through`);
      if (performed(pair)) continue;
      run.push({ speaker: 'thad', line: pair.boast }, { speaker: owner, line: pair.counter });
    }
    if (!pairs.some((pair) => pair.n >= first && pair.n <= last && performed(pair))) {
      throw new Error(`doc 03: ${heading(sparring)} performs none of pairs ${first}-${last}`);
    }
    option.exchange = opensOnReply
      ? [exchange[0], ...run, ...exchange.slice(1)]
      : [...reply, ...run, ...exchange];
    delete option.say;
  }
  return option;
}

/** A sparring's heading, for messages. */
function heading(name) {
  return `## THE SPARRING — ${name}`;
}

/** Doc 03 Part Two's pairs, boast and counter, as assay() reads them. */
function assayPairs() {
  const doc = read('docs/03-liars-assay.md');
  const two = doc.slice(doc.indexOf('# PART TWO'), doc.indexOf('# PART THREE'));
  return [...two.matchAll(/^\*\*(\d+)\.\*\*(?: \*\((.+?)\)\*)?\n> \*"(.+?)"\*\n> \*\*"(.+?)"\*\*/gm)]
    .map(([, n, , boast, counter]) => ({ n: Number(n), boast: plain(boast), counter: plain(counter) }));
}

function assay() {
  const doc = read('docs/03-liars-assay.md');
  const part = (heading, next) => {
    const from = doc.indexOf(heading);
    if (from < 0) throw new Error(`doc 03: no "${heading}"`);
    const to = next ? doc.indexOf(next, from + heading.length) : doc.length;
    return doc.slice(from, to < 0 ? doc.length : to);
  };

  // PART TWO: the pairs, by tier.
  const pairs = [];
  const two = part('# PART TWO', '# PART THREE');
  for (const tier of two.split(/^## Tier /m).slice(1)) {
    const head = /^(\d) — (.+?) \((\d+)\)/.exec(tier);
    if (!head) throw new Error(`doc 03: unreadable tier heading "${tier.split('\n')[0]}"`);
    const [, tierNumber, learned, count] = head;
    const found = [...tier.matchAll(/^\*\*(\d+)\.\*\*(?: \*\((.+?)\)\*)?\n> \*"(.+?)"\*\n> \*\*"(.+?)"\*\*/gm)];
    for (const [, n, who, boast, counter] of found) {
      pairs.push({
        n: Number(n), tier: Number(tierNumber), learnedFrom: who ?? plain(learned).replace(/^Learned from /, ''),
        boast: plain(boast), counter: plain(counter), wrong: [],
        // The knowledge flag (content/flags/flags.json). Fanshawe's tier is never Thad's to learn.
        ...(Number(tierNumber) <= 5 ? { flag: `ASSAY_PAIR_${String(n).padStart(2, '0')}` } : {}),
      });
    }
    const written = Number(count) - (tier.includes('*see Duel Four.*') ? 1 : 0);
    if (found.length !== written) throw new Error(`doc 03: Tier ${tierNumber} has ${found.length} pairs, not ${written}`);
  }
  if (pairs.length !== 23) throw new Error(`doc 03: ${pairs.length} pairs, not 23`);
  // FANSHAWE'S TIER IS LEARNED BY A PUZZLE, NOT A FLAG. Doc 57 E10: "Pairs 22,
  // 23 and 24 join: Thad now knows the truth" when the confession completes.
  for (const pair of pairs) if (pair.tier === 6) Object.assign(pair, { learnedAt: 'E10', learnedRuling: 'doc 57 E10 and its pair table: "22-24 | the truth | E10, the confession".' });

  // PART THREE: three wrong answers per pair, each with its reply.
  const three = part('# PART THREE', '# PART FOUR');
  const WRONG = /^> \*\*"(.+?)"\*\* — \*(Vessel|Reply|Fanshawe): "(.+?)"\*$/gm;
  const BY = { Vessel: 'deke_vessel', Reply: 'deke_vessel', Fanshawe: 'fanshawe' };
  const sample = three.slice(three.indexOf('Sample wrong answers for pair 1'), three.indexOf('## Wrong answers, pairs'));
  const blocks = [['1', sample],
    ...three.slice(three.indexOf('## Wrong answers, pairs')).split(/^\*\*(\d+)\.\*\* /m).slice(1)
      .reduce((acc, item, i, arr) => (i % 2 === 0 ? [...acc, [item, arr[i + 1]]] : acc), [])];
  for (const [n, text] of blocks) {
    const pair = pairs.find((p) => p.n === Number(n));
    if (!pair) throw new Error(`doc 03: wrong answers for unknown pair ${n}`);
    const body = text.split(/^\*\*Duel Three|^\*\*Standing mockery/m)[0];
    pair.wrong = [...body.matchAll(WRONG)].map(([, said, by, reply]) => ({
      text: plain(said), reply: plain(reply), by: BY[by], attribution: by,
    }));
    if (pair.wrong.length !== 3) throw new Error(`doc 03: pair ${n} has ${pair.wrong.length} wrong answers, not 3`);
  }
  for (const pair of pairs) if (pair.wrong.length !== 3) throw new Error(`doc 03: pair ${pair.n} has no wrong answers`);
  const seen = new Set();
  for (const pair of pairs) {
    for (const w of pair.wrong) {
      if (seen.has(w.text)) throw new Error(`doc 03: wrong answer reused: "${w.text}" (Part Five, note 1)`);
      seen.add(w.text);
    }
  }
  const mockery = [...three.slice(three.indexOf('**Standing mockery lines**')).matchAll(/^- \*"(.+?)"\*$/gm)]
    .map((m) => plain(m[1]));
  if (mockery.length !== 5) throw new Error(`doc 03: ${mockery.length} mockery lines, not 5`);
  // THE LAST OF THEM IS THE PLANT (doc 03: "That last one lands very differently
  // in Act IV."). Tyler, 2026-11-06 ("Use the unused mockery lines"): it closes
  // Duel One's loss, after "That's the trouble."; the other four turn, one per
  // lost Duel Two, after the reply that lost it (errata 136 B).
  if (!/That last one lands very differently in Act IV/.test(three)) throw new Error('doc 03: the mockery plant note has moved');
  const plant = mockery.length - 1;
  const jeers = mockery.map((_, i) => i).filter((i) => i !== plant);

  // PART FOUR: the spoken scenes, as groups of quoted lines.
  const SAYS = { VESSEL: 'deke_vessel', THAD: 'thad', SOWERBY: 'sowerby' };
  // THE HANDBILL'S FIVE RULES (Part One), which Sowerby reads before each of
  // Room 4's duels (errata 75). Read as the document lists them.
  const rulesAt = doc.indexOf('**The rules, as posted');
  const rules = [...doc.slice(rulesAt, doc.indexOf('Rule 3 is', rulesAt)).matchAll(/^> (\d\. .+)$/gm)]
    .map((m) => ({ speaker: 'sowerby', line: plain(m[1]) }));
  if (rules.length !== 5) throw new Error(`doc 03: ${rules.length} rules, not 5`);
  const groups = (section) => section.split(/\n(?!> )/).map((chunk) => [...chunk.matchAll(/^> \*\*([A-Z]+):\*\* "(.+?)"(?: \*\([^)]*\)\*)?$/gm)])
    .filter((g) => g.length).map((g) => g.map(([, who, line]) => {
      if (!SAYS[who]) throw new Error(`doc 03: unknown speaker ${who}`);
      return { speaker: SAYS[who], line: plain(line) };
    }));
  const one = groups(part('## DUEL ONE', '## THE SPARRING'));
  if (one.length !== 4) throw new Error(`doc 03: Duel One has ${one.length} spoken groups, not 4`);
  // The opening exchange is VES_B1's greeting now (doc 04, errata 75), not the duel's.
  const [, [notebook], others, duelOneLoss] = one;
  if (others.length !== 3) throw new Error('doc 03: Duel One writes the other three notebook lines as a group of three');
  const two2 = groups(part('## DUEL TWO', '## DUEL FOUR'));
  if (two2.length !== 2) throw new Error(`doc 03: Duel Two has ${two2.length} spoken groups, not 2`);
  const [duelTwoPreamble, duelTwoWin] = two2;

  // DUEL THREE, the Main Street duel (doc 03 "DUEL FOUR -- Colonel Absalom
  // Fanshawe"; doc 57 F4). Its spoken lines, in order, with their directions:
  // the challenge; the three lines after a lost exchange, in turn (errata 75:
  // "A lost exchange is thrown again"); the fifth boast and the truth (pair
  // 24); and the end. The three jokes beside pair 24 are Part Three's.
  const four = part('## DUEL FOUR', '# PART FIVE');
  const said = [...four.matchAll(/^> \*\*([A-Z]+):\*\* (?:\*\(([^)]+)\)\* )?"(.+?)"$/gm)]
    .map(([, who, direction, line]) => ({ who, direction, line: plain(line) }));
  const SAYS3 = { FANSHAWE: 'fanshawe', THAD: 'thad', SOWERBY: 'sowerby' };
  const spoken3 = (one) => {
    if (!SAYS3[one.who]) throw new Error(`doc 03 Duel Four: unknown speaker ${one.who}`);
    return [...(one.direction ? [{ speaker: SAYS3[one.who], line: plain(one.direction), direction: true }] : []),
      { speaker: SAYS3[one.who], line: one.line }];
  };
  if (said.length !== 10) throw new Error(`doc 03 Duel Four: ${said.length} spoken lines, not 10`);
  const [challenge, again1, again2, again3, fifth, truth, ...ending] = said;
  const jokes = three.slice(three.indexOf('**Duel Three, the fifth exchange**'), three.indexOf('**Standing mockery'));
  // THE RELEASE, AS DOC 03 STAGES IT (errata 131 D, E). Two prose directions
  // around the verdict are performed, not shown: "Silence on Main Street. Long.
  // Fanshawe does not move." is a held silence before Sowerby, with the duel's
  // music cut and everyone still; "The street erupts." is the crowd's cue on
  // the line after his verdict. Read from the document so they cannot drift.
  const silence = /^(Silence on Main Street\. Long\. .+)$/m.exec(four)?.[1];
  const erupts = /^(The street erupts\.)/m.exec(four)?.[1];
  if (!silence || !erupts) throw new Error('doc 03 Duel Four: the silence or the eruption is not where it was');
  const [verdict, ...afterVerdict] = ending.flatMap(spoken3);
  const release = [
    { speaker: verdict.speaker, line: '', rest: 3, quiet: true, staging: `doc 03: "${silence}"` },
    verdict,
    { ...afterVerdict[0], cue: 'F4-ERUPTS', staging: `doc 03: "${erupts}"` },
    ...afterVerdict.slice(1),
  ];
  const pair24 = {
    n: 24, tier: 6, learnedFrom: 'the ending', learnedAt: 'E10', boast: fifth.line, counter: truth.line,
    wrong: [...jokes.matchAll(WRONG)].map(([, text, by, reply]) => ({ text: plain(text), reply: plain(reply), by: BY[by], attribution: by })),
  };
  if (pair24.wrong.length !== 3) throw new Error(`doc 03: the fifth exchange has ${pair24.wrong.length} jokes, not 3`);
  pairs.push(pair24);
  const duelThree = {
    puzzle: 'F4',
    opponent: 'fanshawe',
    opening: [...spoken3(challenge), ...rules],
    openingRuling: 'doc 57 F4: "doc 03\'s challenge plays"; then doc 03 Part One: Sowerby reads the handbill "at unbearable '
      + 'length before every match", Rule 3 among them (errata 131 D).',
    sequence: [4, 9, 22, 23, 24],
    sequenceRuling: 'errata 75 and doc 57 F4: "in the order 4, 9, 22, 23, then the fifth".',
    rethrow: [again1, again2, again3].flatMap(spoken3),
    rethrowRuling: 'errata 75: "A lost exchange is thrown again ... After the reply to a wrong answer, one of these, in turn." So the duel cannot be lost, and ends when the fifth is answered.',
    knows: [4, 9, 24],
    knowsRuling: 'doc 03: "The player is offered four counters. Three are jokes. The fourth is pair 24, and it is not a lie." It is always on offer. '
      + 'Pairs 4 and 9 too: errata 75 I calls them "guaranteed in Act II", and pair 9\'s one source (WIN_B4) can be walked past for good, '
      + 'after which a re-thrown exchange 2 never ends (invariant 6; errata 120).',
    win: release,
    winRuling: 'errata 131 D, E: the silence held before the verdict (3 s, nothing clickable, the music cut), the judges\' '
      + 'pencil in it, and the street erupting as the verdict lands.',
    setsOnWin: { T_FANSHAWE_BEATEN: true },
    calledByOpponent: true,
    calledRuling: 'doc 03: "Fanshawe calls the duel himself"; doc 57 F4: on Main Street after T_ASSAY_RUN, Fanshawe is waiting.',
  };

  return write('content/assay/assay.json', {
    schema: 1,
    id: 'ASSAY',
    note: 'EXTRACTED from docs/03-liars-assay.md by tools/extract-content.mjs. Do not edit: change doc 03 and '
      + 're-run. Lines are the document\'s; fields marked "ruling" are the errata\'s mechanism, carried as data.',
    exchangesToWin: 5,
    exchangesToWinRuling: 'docs/03-liars-assay.md How it plays: "First to five exchanges wins the duel."',
    offerRuling: 'errata 73 C: a boast whose counter Thad has not learned offers its three wrong answers; a learned '
      + 'one adds the right counter as a fourth, in a slot that varies by pair.',
    bystander: 'assay_ring',
    bystanderRuling: 'errata 73 F: a voice from the ring of chairs, unnamed.',
    pencil: 'sowerby',
    pencilRuling: 'doc 03 Part Four: "Sowerby holds the pencil"; doc 45 U-ASSAY-PENCIL: each point the judges write down.',
    markSeconds: 0.6,
    markRuling: 'errata 130 B: a point is written down in a held beat after the line that won it and before the next boast.',
    pairs,
    mockery,
    duels: {
      duel_one: {
        puzzle: 'B5',
        opponent: 'deke_vessel',
        opening: rules,
        openingRuling: 'errata 75: before the first exchange, Sowerby reads the handbill\'s five rules aloud, all of them.',
        sequence: [1, 2, 3, 4, 1],
        sequenceRuling: 'errata 73 D: pairs 1, 2, 3 and 4, then pair 1 again; nobody mutters on the repeat.',
        notebook: { 1: notebook, 2: others[0], 3: others[1], 4: others[2] },
        notebookRuling: 'errata 73 D and 75: Thad writes each counter down as he hears it, and the notebook joins his '
          + 'repertoire when the duel is over.',
        learns: [1, 2, 3, 4],
        sets: { T_DUEL_ONE_LOST: true },
        loss: [...duelOneLoss, { speaker: 'deke_vessel', line: mockery[plant] }],
        lossRuling: 'doc 03 Duel One\'s loss dialogue, then the standing mockery\'s last line (errata 136 B; Tyler, '
          + '2026-11-06: "Son, you\'ve told the truth. In front of people." closes Duel One\'s loss after "That\'s the trouble.").',
        offersMuttered: true,
        offersMutteredRuling: 'errata 136 D (Tyler, 2026-11-06, "Offer the counter just learned"): the repeat of pair 1 offers '
          + 'the counter he has just written down. Five boasts are thrown, so the duel still cannot be won.',
        winnable: false,
      },
      duel_two: {
        puzzle: 'B6',
        opponent: 'deke_vessel',
        pool: Array.from({ length: 21 }, (_, i) => i + 1),
        threshold: 14,
        opening: [...duelTwoPreamble, ...rules],
        openingRuling: 'doc 03 Duel Two (errata 75): Sowerby, Vessel, Sowerby, and then "(He reads all five.)".',
        orderRuling: 'errata 73 E, doc 57 B6 and errata 76 A: Tier 1 first, never repeating. Then, holding fourteen '
          + 'or more, the pairs Thad knows before the rest; holding fewer, the rest first (doc 02 B6: ">=14 pairs"). '
          + 'The pairs he knows are thrown latest tier first (errata 130 C).',
        learnsByLosing: true,
        learnsByLosingRuling: 'doc 03 Part One, "Learning": "When an opponent uses a boast Thad has no answer to, Thad hears '
          + 'the correct counter from the crowd." The ring mutters each counter he lacks the first time it is thrown, and it '
          + 'joins his repertoire when the duel is over, won or lost (errata 130 A).',
        win: duelTwoWin,
        setsOnWin: { T_DUEL_TWO_WON: true },
        yields: ['document_a', 'watch'],
        lossRuling: 'errata 73 H, amended by errata 136 B: a lost Duel Two ends on the reply that lost it, the judges\' mark, and '
          + 'Vessel\'s jeer -- doc 03\'s standing mockery, "rotated on any loss" -- before the ring teaches what he lacked.',
        mocks: { pool: jeers, counter: 'T_DUEL_TWO_LOSSES' },
      },
      duel_three: duelThree,
    },
  });
}

/**
 * DOC 04, COLONEL ABSALOM FANSHAWE: Room 11's tree (errata 84). Read as
 * Frame's is (spokenIn, quoted, afterIds), from doc 04's Fanshawe layout:
 * nodes are `## ACT I — Root: \`FAN_A1\`` and `## ACT II — \`FAN_B1\`: ...`
 * headings, each a table whose fifth column is a State or a Rule ledger; the
 * `## THE WAR` section between A1 and A2 is not a node. Doc 57 writes the
 * dinner's frame (A10) and the offer's turn (E0b): their lines are read from
 * doc 57 here. Every string is a document's.
 *
 * ROUTING THE PROSE NAMES IN WORDS, authored here as A8_CASES is: FAN_A1 1
 * and 2 both give THE COMPANY MAP (doc 04: "Gives map"; "He gives the map
 * anyway"); FAN_A2 6 is A10 (doc 57: beat 3's line, THE HANDKERCHIEF,
 * `T_DINED`) and ends the dinner; FAN_A2's universal exit is doc 57's "Leaving
 * the table" line; FAN_B1 1 goes on to FAN_B2 (the introduction, then the
 * card: errata 84 D); FAN_C1 1 is E0b, with Thad's aside and `ACT` 3 (doc 57).
 * FAN_D1 is not built: three of the war's five contradictions are written but
 * no node offers them, so it cannot be reached (doc 36 Q154).
 *
 * ENTRIES (doc 57, doc 04): FAN_C1 after E0 until the clause is read; FAN_A2
 * while Thad holds THE INVITATION (`T_BORDERS_MOTT`) until `T_DINED`; FAN_B1
 * from Act II; FAN_A1 once swindled; else FAN_A0.
 */
function fanshaweTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# COLONEL ABSALOM FANSHAWE');
  const to = doc.indexOf('\n# HOB', from);
  if (from < 0 || to < 0) throw new Error('doc 04: cannot find the FANSHAWE section');
  const body = doc.slice(from, to);
  const d57 = read('docs/57-puzzle-completion.md');
  const section57 = (heading) => {
    const at = d57.indexOf(heading);
    if (at < 0) throw new Error(`doc 57: no section "${heading}"`);
    const rest = d57.slice(at + heading.length);
    return rest.slice(0, (/\n## |\n---\n/.exec(rest) ?? { index: rest.length }).index);
  };
  const a10 = section57('## A10 · Survive dinner at Fanshawe\'s');
  const bullet = (label) => {
    const m = new RegExp(`^- \\*\\*${label}\\*\\*.*$`, 'm').exec(a10);
    if (!m) throw new Error(`doc 57 A10: no "${label}" bullet`);
    return m[0];
  };
  const leaving = /\*\*FANSHAWE:\*\* "([^"]+)"/.exec(bullet('Leaving the table'))?.[1];
  const beat3 = /\*\*FANSHAWE:\*\* "([^"]+)"/.exec(bullet('Beat 3, after option 6 settles:'))?.[1];
  if (!leaving || !beat3) throw new Error('doc 57 A10: the leaving line or beat 3\'s line was not found');
  const turn = /\*\*The turn:\*\*[^*]*\*"([^"]+)"\*/.exec(body)?.[1];
  if (!turn) throw new Error('doc 04 FAN_C1: Thad\'s aside ("The turn") was not found');
  const SPEAKER = 'fanshawe';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  if (POOL.length < 3) throw new Error('doc 04: the universal exit pool was not found');
  const ROUTE = {
    // A4 IS THE MAP ARRIVING (doc 02 A4 yields "Company map"; doc 57 A4: "FAN_A1
    // gives THE COMPANY MAP ... The map is what finds Prosperity").
    'FAN_A1:1': { gives: ['company_map'], puzzle: { A4: 'complete' } },
    'FAN_A1:2': { gives: ['company_map'], puzzle: { A4: 'complete' } },
    'FAN_A2:6': { then: [{ speaker: SPEAKER, line: beat3 }], gives: ['handkerchief'], set: { T_DINED: true },
      puzzle: { A10: 'complete' }, ends: true },
    'FAN_B1:1': { goto: 'FAN_B2' },
    'FAN_C1:1': { then: [{ speaker: 'thad', line: turn }], set: { ACT: 3 }, puzzle: { E0b: 'complete' } },
  };
  const EXIT_SAY = { FAN_A2: leaving };
  const ENTRY = [
    ['FAN_C1', { T_CLAIM1_BLANK: true, T_EXCAVATION_CLAUSE: false }],
    ['FAN_A2', { T_BORDERS_MOTT: true, T_DINED: false }],
    ['FAN_B1', { ACT: { atLeast: 2 } }],
    ['FAN_A1', { T_SWINDLED: true }],
  ];
  const unplayed = [];
  const nodes = {};
  let poolIndex = 0;
  const sections = body.split(/^(?=## )/m);
  for (const section of sections) {
    const head = /^## ACT [IV]+ — (?:Root: )?`(FAN_[A-Z0-9]+)`/.exec(section);
    if (!head) continue;
    const id = head[1];
    const text = section;
    const ROW = /^\| (\d+) \|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|[ \t]*(.*?)[ \t]*\|(?:[ \t]*(.*?)[ \t]*\|)?[ \t]*$/gm;
    const rows = [...text.matchAll(ROW)];
    if (!rows.length) {
      unplayed.push(`${id}: no option table -- not built (doc 36 Q154)`);
      continue;
    }
    const opening = [...text.matchAll(/^> \*\*(FANSHAWE|THAD):\*\* (.+)$/gm)].map((m) => {
      const speaker = m[1] === 'THAD' ? 'thad' : SPEAKER;
      for (const d of m[2].matchAll(/\*\(([^)]+)\)\*/g)) unplayed.push(`${id} opening (${speaker}) staging: ${d[1]}`);
      const line = quoted(m[2].replace(/\*\([^)]*\)\*/g, '')).join(' ').replace(/\*/g, '');
      if (!line) throw new Error(`doc 04: ${id} opening line by ${speaker} has no quoted speech`);
      return { speaker, line };
    });
    const lastOwn = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    const options = [];
    let hasExit = false;
    for (const [, number, optionCell, tagCell, responseCell, stateCell] of rows) {
      const route = ROUTE[`${id}:${number}`] ?? {};
      const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(`${tagCell} ${optionCell}`);
      if (!tagged) throw new Error(`doc 04: ${id} option ${number} has no tag`);
      const option = { id: `${SPEAKER}${number}`, tag: tagged[1] };
      const optionText = quoted(optionCell)[0];
      if (tagged[1] === 'EXIT') {
        hasExit = true;
        option.text = optionText ?? POOL[poolIndex % POOL.length];
        if (!optionText) { option.universal = true; poolIndex += 1; }
        option.ends = true;
      } else {
        if (!optionText) throw new Error(`doc 04: ${id} option ${number} has no option text`);
        option.text = optionText;
      }
      if (tagged[2]) option.afterUse = tagged[2];
      const follows = afterIds(tagCell, SPEAKER);
      if (follows) option.after = follows;
      const ORDINALS = { second: 2, third: 3 };
      const [replyCell] = responseCell.split('→');
      const pieces = replyCell.split(/\*\((second|third)\)\*/);
      const first = spokenIn(pieces[0], SPEAKER);
      for (const d of first.staging) unplayed.push(`${id} option ${number} staging: ${d}`);
      const lines = [...first.lines, ...(route.then ?? [])];
      if (lines.length === 1 && lines[0].speaker === SPEAKER) option.say = lines[0].line;
      else if (lines.length) option.exchange = lines;
      else throw new Error(`doc 04: ${id} option ${number} has no reply`);
      for (let k = 1; k < pieces.length; k += 2) {
        const later = spokenIn(pieces[k + 1] ?? '', SPEAKER);
        for (const d of later.staging) unplayed.push(`${id} option ${number} selection ${ORDINALS[pieces[k]]} staging: ${d}`);
        if (later.lines.length) (option.repeats ??= []).push({ selection: ORDINALS[pieces[k]], say: later.lines.map((l) => l.line).join(' ') });
      }
      const state = `${stateCell ?? ''} ${responseCell.split('→').slice(1).join(' ')}`;
      const counter = /`([A-Z_0-9]+)` \+1/.exec(state);
      const sets = [...state.matchAll(/sets `([A-Z_0-9]+)`/g)].map((m) => m[1]);
      const set = { ...Object.fromEntries(sets.map((f) => [f, true])), ...(route.set ?? {}) };
      if (Object.keys(set).length) option.set = set;
      if (counter) option.add = { [counter[1]]: 1 };
      if (route.goto) option.goto = route.goto;
      if (route.gives) option.gives = route.gives;
      if (route.puzzle) option.puzzle = route.puzzle;
      if (route.ends) option.ends = true;
      options.push(option);
    }
    if (!hasExit) {
      const exit = { id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[poolIndex % POOL.length], universal: true, ends: true };
      if (EXIT_SAY[id]) exit.say = EXIT_SAY[id];
      options.push(exit);
      poolIndex += 1;
    }
    nodes[id] = { id, ...(lastOwn ? { prompt: lastOwn.line } : { noPrompt: true,
      exceptionReason: 'Doc 04 writes this node as a table only.' }),
      ...(opening.length ? { opening } : {}), options };
  }
  for (const want of ['FAN_A0', 'FAN_A1', 'FAN_A2', 'FAN_B1', 'FAN_B2', 'FAN_C1']) {
    if (!nodes[want]) throw new Error(`doc 04: ${want} was not extracted`);
  }
  for (const note of unplayed) process.stderr.write(`  doc 04 FANSHAWE: ${note}\n`);
  return write('content/dialogue/fanshawe.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'FANSHAWE',
    speaker: SPEAKER,
    name: 'COLONEL ABSALOM FANSHAWE',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (COLONEL ABSALOM FANSHAWE) and docs/57-puzzle-completion.md (A10, E0b) '
      + 'by tools/extract-content.mjs. Do not edit: change the documents and re-run. Plain quotes in a reply are '
      + 'Fanshawe\'s, italic quotes Thad\'s. Universal exit lines are doc 04 part one\'s pool.',
    entries: ENTRY.map(([node, when]) => ({ when, node })),
    start: 'FAN_A0',
    nodes,
  });
}

/**
 * THE ACT CARDS AFTER THE OPENING (errata 84 C). Doc 57 names each act turn's
 * card in bold: A10's "the act card, **PART TWO — ...**" (doc 48 S1 beat 5)
 * and E0b's "the act card, **PART THREE — ...**". Keyed by the ACT value the
 * turn sets; the engine shows a card when ACT rises to its number in play.
 */
/**
 * HOW AN ACT OPENS, where doc 57 says it opens somewhere: "**Act IV opens in
 * Room 19, morning**, ..." and the line under it. Errata 101 B: after the
 * act's card the game cuts to that room and Thad says the line, once. The
 * room is named by number in the doc and found by the room's own annotation.
 *
 * `due` is the flag the act turn writes with ACT (doc 48 S4 beat 3's way out,
 * hobTree below) and the opening clears: a save taken between the two still
 * owes the opening, and a fixture that merely starts in the act does not.
 */
const ROMAN = { II: 2, III: 3, IV: 4 };
function actOpenings() {
  const d57 = read('docs/57-puzzle-completion.md');
  const out = {};
  for (const m of d57.matchAll(/^\*\*Act ([IV]+) opens in Room (\d+)[^*]*\*\*[^\n]*\n\n> "(.+?)"$/gm)) {
    const act = ROMAN[m[1]];
    if (!act) throw new Error(`doc 57: an opening for Act ${m[1]}, which is not an act turn`);
    const annotation = `reference/room-${m[2].padStart(2, '0')}/annotation.json`;
    const room = JSON.parse(read(annotation)).room;
    if (!room) throw new Error(`doc 57: Act ${m[1]} opens in Room ${m[2]}, and ${annotation} names no room`);
    out[act] = { room, say: [m[3]], due: `T_ACT_${m[1]}_OPENING` };
  }
  return out;
}

function actCards() {
  const d57 = read('docs/57-puzzle-completion.md');
  const cards = {};
  // E10 writes its card as "then **PART FOUR -- ...**, and `ACT` = 4" (errata 94 E).
  for (const m of d57.matchAll(/(?:the act card,|then) \*\*(PART [A-Z]+ — [^*]+)\*\*, and `ACT` = (\d)/g)) cards[m[2]] = m[1];
  if (!cards['2'] || !cards['3'] || !cards['4']) throw new Error('doc 57: the act cards for ACT 2, 3 and 4 were not found');
  const openings = actOpenings();
  if (!openings[4]) throw new Error('doc 57: "Act IV opens in Room 19" was not found');
  return write('content/act-cards.json', {
    schema: 1,
    note: 'EXTRACTED from docs/57-puzzle-completion.md (A10, E0b, E10) by tools/extract-content.mjs. The card shown when '
      + 'ACT rises to the key in play; and, where doc 57 says an act opens in a room, that opening (errata 101 B): '
      + 'once the card is down he is in `room` and says `say`, while `due` holds, and the opening clears it.',
    cards,
    openings,
  });
}

/**
 * DOC 23'S ACT I STORE ITEMS: THE PICKLED EGGS and DR. PURVIS'S TONIC (Room
 * 12, errata 85). Doc 23's other Act I items were transcribed into
 * content/items by hand before this extractor existed; these two were written
 * later (doc 57) and are extracted, in the same grammar actTwoItems reads.
 */
function storeItems() {
  const doc = read('docs/23-inventory-act1.md');
  const body = doc.slice(0, doc.indexOf('## Act II items'));
  const out = [];
  for (const want of ['eggs', 'tonic', 'blanket']) {
    const row = new RegExp(`^\\| ${want} \\| (.+?) \\| (.+?) \\|$`, 'm').exec(body);
    if (!row) throw new Error(`doc 23: no table row for ${want}`);
    const [, fullName, display] = row;
    const heading = new RegExp(`^## ${display.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n([\\s\\S]*?)(?=^## |^---)`, 'm');
    const section = heading.exec(body);
    if (!section) throw new Error(`doc 23: no section for ${display}`);
    const responses = {};
    for (const [verb, label] of [['LOOK_AT', 'LOOK'], ['LISTEN_TO', 'LISTEN']]) {
      const line = new RegExp(`^\\*\\*${label}\\*\\* (.+)$`, 'm').exec(section[1]);
      if (!line) throw new Error(`doc 23: ${display} has no ${label} run`);
      const lines = [...line[1].matchAll(/\d "([^"]+)"/g)].map((m) => m[1]);
      if (lines.length !== 3) throw new Error(`doc 23: ${display} ${label} has ${lines.length} lines, not 3`);
      responses[verb] = [{ say: lines[0], repeat: lines.slice(1) }];
    }
    const acquired = /^\*(.+)\*$/m.exec(section[1])?.[1] ?? '';
    out.push(write(`content/items/${want}.json`, {
      schema: 1,
      id: want,
      name: fullName,
      short: display,
      note: `EXTRACTED from docs/23-inventory-act1.md (Act I items) by tools/extract-content.mjs. Do not edit: change doc 23 and re-run. ${acquired}`,
      responses,
    }));
  }
  return out;
}

/**
 * DOC 04, THE UNDERTAKER'S ACT III NODE, UND_C1 (errata 86 D): the coffin
 * fitting, "grown to a node in Batch C". Doc 57 E3 routes it: open once E2 is
 * done (`T_NEED_TO_DIE`), and option 1 sizes the coffin (`T_COFFIN_SIZED`).
 * Doc 04 writes the node as a table only, so it has no prompt; a universal
 * exit from doc 04's pool closes it. Every string is the document's.
 */
function undertakerActThree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('## THE UNDERTAKER — two nodes');
  const to = doc.indexOf('\n---', from);
  if (from < 0 || to < 0) throw new Error('doc 04: no UNDERTAKER section');
  const body = doc.slice(doc.indexOf('**`UND_C1`', from), to);
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const options = [];
  for (const [, number, optionCell, tagCell, responseCell] of body.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)) {
    const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
    const text = quoted(optionCell)[0];
    const said = spokenIn(responseCell, 'undertaker');
    if (!tag || !text || said.lines.length !== 1) throw new Error(`doc 04 UND_C1: option ${number} does not read`);
    for (const d of said.staging) process.stderr.write(`  doc 04 UND_C1 option ${number} staging: ${d}\n`);
    options.push({ id: `undertaker_c${number}`, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text,
      say: said.lines[0].line, ...(number === '1' ? { set: { T_COFFIN_SIZED: true } } : {}) });
  }
  if (options.length !== 3) throw new Error(`doc 04 UND_C1: ${options.length} options, not 3`);
  options.push({ id: 'undertaker_cx', tag: 'EXIT', text: POOL[0], universal: true, ends: true });
  return {
    node: { id: 'UND_C1', noPrompt: true, exceptionReason: 'Doc 04 writes UND_C1 as a table only.', options },
    entries: [{ when: { T_NEED_TO_DIE: true }, node: 'UND_C1' }],
  };
}

/**
 * DOC 04, THE LIVERY MAN: Room 15's tree, LIV_A1 (errata 75, 88 E). One node,
 * a table only. Routing, as doc 57 writes it: option 1 is Grievance's refusal
 * (B2 begins); 6, the man she moved for, sets `T_GRIEVANCE_MOTT` and is B2;
 * 4, the tune, waits for it ("req") and sets `T_HUM_HEARD`; 5 lends THE LIVERY
 * BLANKET (doc 23) and marks it borrowed (`T_BLANKET_BORROWED`, so the bin is
 * drawn without it until A5 brings it back); 7 is pair 20. A universal exit
 * from doc 04's pool closes it. Every string is the document's.
 */
function liveryTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('## THE LIVERY MAN');
  const to = doc.indexOf('\n## ', from + 5);
  if (from < 0 || to < 0) throw new Error('doc 04: no LIVERY MAN section');
  const body = doc.slice(from, to);
  const SPEAKER = 'livery_man';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const ROUTE = {
    5: { gives: ['blanket'], set: { T_BLANKET_BORROWED: true } },
    6: { puzzle: { B2: 'complete' } },
    7: { set: { ASSAY_PAIR_20: true } },
  };
  const options = [];
  for (const [, number, optionCell, tagCell, responseCell] of body.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)) {
    const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
    const text = quoted(optionCell)[0];
    const [reply, ...rest] = responseCell.split('→');
    const said = spokenIn(reply.replace(/\*\([^)]*\)\*/g, ''), SPEAKER);
    for (const d of spokenIn(responseCell, SPEAKER).staging) process.stderr.write(`  doc 04 LIV_A1 option ${number} staging: ${d}\n`);
    if (!tag || !text || !said.lines.length) throw new Error(`doc 04 LIV_A1: option ${number} does not read`);
    const state = rest.join(' ');
    const option = { id: `${SPEAKER}${number}`, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text };
    if (said.lines.length === 1 && said.lines[0].speaker === SPEAKER) option.say = said.lines[0].line;
    else option.exchange = said.lines;
    const flags = [...state.matchAll(/`([A-Z_0-9]+)`/g)].map((m) => m[1]).filter((f) => !/req `/.test(state) || !state.includes(`req \`${f}\``));
    const req = /req `([A-Z_0-9]+)`/.exec(state);
    const route = ROUTE[number] ?? {};
    const set = { ...Object.fromEntries(flags.map((f) => [f, true])), ...(route.set ?? {}) };
    if (Object.keys(set).length) option.set = set;
    if (req) option.when = { [req[1]]: true };
    if (route.gives) option.gives = route.gives;
    if (route.puzzle) option.puzzle = route.puzzle;
    options.push(option);
  }
  if (options.length !== 7) throw new Error(`doc 04 LIV_A1: ${options.length} options, not 7`);
  options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[1 % POOL.length], universal: true, ends: true });
  return write('content/dialogue/livery-man.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'LIVERY_MAN',
    speaker: SPEAKER,
    name: 'THE LIVERY MAN',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (THE LIVERY MAN) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a reply are his, italic quotes Thad\'s. '
      + 'The universal exit line is doc 04 part one\'s pool.',
    entries: [],
    start: 'LIV_A1',
    nodes: { LIV_A1: { id: 'LIV_A1', noPrompt: true, exceptionReason: 'Doc 04 writes LIV_A1 as a table only.', options } },
  });
}

/**
 * DOC 04, MADAME OZYMANDIA: Room 16's tree, OZY_A1 (errata 75, 89 E). Routing,
 * as doc 57 A7 writes it: option 1 waits for `T_SURVEY_NEEDED` (Sump's refusal,
 * A6) and names her price, which the filing fee then answers (`T_OZY_ASKED`);
 * 5 is pair 19. Option 4 plants the Act IV corroboration, which doc 04 says is
 * "never mentioned again", so it sets nothing. A universal exit from doc 04's
 * pool closes it. Every string is the document's.
 */
function ozymandiaTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# MADAME OZYMANDIA');
  const to = doc.indexOf('\n---', from);
  if (from < 0 || to < 0) throw new Error('doc 04: no MADAME OZYMANDIA section');
  const body = doc.slice(from, to);
  const SPEAKER = 'ozymandia';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const prompt = /^> \*\*OZYMANDIA:\*\* "([^"]+)"/m.exec(body)?.[1];
  if (!prompt) throw new Error('doc 04 OZY_A1: no opening line');
  const ROUTE = { 1: { set: { T_OZY_ASKED: true } }, 5: { set: { ASSAY_PAIR_19: true } } };
  const options = [];
  for (const [, number, optionCell, tagCell, responseCell] of body.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)) {
    const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
    const text = quoted(optionCell)[0];
    const [reply] = responseCell.split('→');
    const said = spokenIn(reply.replace(/\*\([^)]*\)\*/g, ''), SPEAKER);
    for (const d of spokenIn(responseCell, SPEAKER).staging) process.stderr.write(`  doc 04 OZY_A1 option ${number} staging: ${d}\n`);
    if (!tag || !text || !said.lines.length) throw new Error(`doc 04 OZY_A1: option ${number} does not read`);
    const option = { id: `${SPEAKER}${number}`, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text };
    if (said.lines.length === 1 && said.lines[0].speaker === SPEAKER) option.say = said.lines[0].line;
    else option.exchange = said.lines;
    const req = /req `([A-Z_0-9]+)`/.exec(responseCell);
    if (req) option.when = { [req[1]]: true };
    if (ROUTE[number]?.set) option.set = ROUTE[number].set;
    options.push(option);
  }
  if (options.length !== 5) throw new Error(`doc 04 OZY_A1: ${options.length} options, not 5`);
  options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[2 % POOL.length], universal: true, ends: true });
  return write('content/dialogue/ozymandia.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'OZYMANDIA',
    speaker: SPEAKER,
    name: 'MADAME OZYMANDIA',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (MADAME OZYMANDIA) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a reply are hers, italic quotes Thad\'s. '
      + 'The universal exit line is doc 04 part one\'s pool.',
    entries: [],
    start: 'OZY_A1',
    nodes: { OZY_A1: { id: 'OZY_A1', prompt, options } },
  });
}

/**
 * DOC 04, REVEREND SOWERBY: Room 17's tree, SOW_A1 and SOW_C1 (errata 75, 90 E).
 * Routing, as doc 57 writes it: SOW_A1 5 waits for `T_FANSHAWE_FUNERALS` and
 * `T_PIKE_DEAD` and asks who speaks for the deceased (`T_SOW_FUNERAL_ASKED`,
 * which the letter answers, C3); 6 waits for `T_SHENG_TASK`, not on a funeral
 * day (D4); 7, another service, waits for the memorial and for C4 or D4 not
 * done (`whenAny`); 8 is pair 17. SOW_C1, open once E2 is done
 * (`T_NEED_TO_DIE`) until the price is set: option 1 adds four adjectives,
 * option 3 sets `T_SOWERBY_PRICE` (E3 step 1). A universal exit from doc 04's
 * pool closes each node. Every string is the document's.
 */
/**
 * DOC 04 PART THREE, THE LETTERS HOME: Room 19's one choice (errata 92 E).
 * "Each act offers three versions of the letter to his mother: honest,
 * flattering, and flattering with a number in it. The player picks freely.
 * Nothing tracks it." One node per act, I to III. Its three options are the
 * document's own names for the versions (the headings after the act); the
 * letter itself is the option's ECHO (doc 30 section 6.2), the line Thad
 * speaks for the choice, and the node closes. Act IV is "the only version
 * offered. No choice." and is not a node: `actFour` holds its four lines, which
 * THE LETTERS HOME reads in Act IV (the room's annotation, `opensTree`).
 * Nothing is set, and nothing reads a choice (invariant 10).
 */
function lettersHome() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('## The letters, written');
  const to = doc.indexOf('\n---', from);
  if (from < 0 || to < 0) throw new Error('doc 04: no letters section');
  const body = doc.slice(from, to);
  const ROMAN = { I: 1, II: 2, III: 3, IV: 4 };
  const letters = [...body.matchAll(/^\*\*ACT (I|II|III|IV) — ([^*]+)\*\*\n((?:> .*\n?)+)/gm)].map((m) => ({
    act: ROMAN[m[1]],
    version: m[2].trim().replace(/\.$/, ''),
    lines: m[3].split('\n').map((line) => line.replace(/^> ?/, '').trim()).filter(Boolean),
  }));
  if (letters.length !== 10) throw new Error(`doc 04: ${letters.length} letters, not 10`);
  const unquote = (text) => {
    if (!text.startsWith('"') || !text.endsWith('"')) throw new Error(`doc 04: a letter is not one quotation: ${text.slice(0, 40)}`);
    return text.slice(1, -1);
  };
  const nodes = {};
  const entries = [];
  for (const act of [1, 2, 3]) {
    const three = letters.filter((one) => one.act === act);
    if (three.length !== 3) throw new Error(`doc 04: Act ${act} has ${three.length} letters`);
    const id = `LETTERS_${act}`;
    nodes[id] = {
      noPrompt: true,
      exceptionReason: 'Doc 04 Part Three: a parallel choice system, three versions of one letter, not a conversation. Nobody is spoken to.',
      noComic: true,
      noComicReason: 'Doc 04 Part Three: the three versions are the choice; none is a joke option.',
      noReply: true,
      noReplyReason: 'Doc 04 Part Three: the letter is the whole of it, written in his voice; nobody answers a letter here.',
      options: three.map((one, n) => {
        if (one.lines.length !== 1) throw new Error(`doc 04: Act ${act} ${one.version} is not one paragraph`);
        return { id: `letter${act}_${n + 1}`, tag: 'TOPIC', afterUse: 'retain', text: one.version, echo: unquote(one.lines[0]), ends: true };
      }),
    };
    entries.push({ when: { ACT: act }, node: id });
  }
  const last = letters.find((one) => one.act === 4);
  const four = [...last.lines];
  if (!four[0].startsWith('"') || !four.at(-1).endsWith('"')) throw new Error('doc 04: the Act IV letter is not one quotation');
  four[0] = four[0].slice(1);
  four[four.length - 1] = four.at(-1).slice(0, -1);
  return write('content/dialogue/letters-home.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'LETTERS_HOME',
    speaker: 'thad',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (PART THREE, the letters, written) by tools/extract-content.mjs. '
      + `Do not edit: change doc 04 and re-run. Act IV is not a node: ${JSON.stringify(last.version)}.`,
    actFour: four,
    entries,
    start: 'LETTERS_1',
    nodes,
  });
}

/**
 * DOC 04's RAC_A1: the raccoon's naming (errata 68 A, errata 96 E). "Opened by
 * the first TALK TO the raccoon. The raccoon does not speak; every response is
 * Thad's." Options 1-3 name him -- `T_RACCOON_NAMED`, and `RACCOON_NAME` 1-3,
 * which the hotspot and the figure read for the display name the row gives --
 * and close the node; option 4 is the [COMIC] refusal. An italic bracket
 * before a line is a beat, not spoken. Doc 04's universal exit pool gives the
 * way out, as Hob's tree does.
 */
function raccoonTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const at = doc.indexOf('## `RAC_A1`');
  if (at < 0) throw new Error('doc 04: no RAC_A1');
  const body = doc.slice(at, doc.indexOf('\n# ', at));
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)]
    .map((m) => m[1]);
  const opening = [...body.matchAll(/^> \*\*THAD:\*\* (.+)$/gm)].map((m) => ({ speaker: 'thad', line: quoted(m[1])[0] }));
  if (opening.length !== 1 || !opening[0].line) throw new Error('doc 04 RAC_A1: no opening line');
  const ROW = /^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm;
  const options = [];
  for (const [, number, optionCell, tagCell, responseCell] of body.matchAll(ROW)) {
    const tagged = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
    if (!tagged) throw new Error(`doc 04 RAC_A1 option ${number}: no tag`);
    const [spoken, state = ''] = responseCell.split('→');
    const lines = quoted(spoken.replace(/\*\([^)]*\)\*/g, '')).map((line) => plain(line));
    if (lines.length !== 1) throw new Error(`doc 04 RAC_A1 option ${number}: ${lines.length} lines`);
    const option = { id: `raccoon${number}`, tag: tagged[1], text: plain(quoted(optionCell)[0]), say: lines[0] };
    if (tagged[2]) option.afterUse = tagged[2];
    const named = /`T_RACCOON_NAMED`, display name ([A-Z]+)/.exec(state);
    if (named) {
      option.set = { T_RACCOON_NAMED: true, RACCOON_NAME: Number(number) };
      option.ends = true;
      option.displayName = named[1];
    }
    options.push(option);
  }
  if (options.length !== 4) throw new Error(`doc 04 RAC_A1: ${options.length} options`);
  options.push({ id: 'raccoonx', tag: 'EXIT', text: POOL[3 % POOL.length], universal: true, ends: true });
  return write('content/dialogue/raccoon.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'RACCOON',
    speaker: 'thad',
    name: 'THE RACCOON',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (RAC_A1) by tools/extract-content.mjs. Do not edit: change doc 04 and re-run. '
      + 'The raccoon does not speak: every line is Thad\'s. `displayName` on a naming option is the row\'s display name, '
      + 'read by the room (errata 96 E).',
    start: 'RAC_A1',
    nodes: { RAC_A1: { id: 'RAC_A1', noPrompt: true,
      exceptionReason: 'Doc 04 RAC_A1: the raccoon does not speak, and the opening is Thad\'s own line.',
      opening, options } },
  });
}

/**
 * DOC 04, NICKEL PRATT: Room 25's tree and Room 23's encounter (errata 97).
 *
 * Two files, one man. `pratt.json` is his own claim: PRA_A1 in Act I ("next
 * door", the first meeting, A5's "send Pratt"), PRA_B1 from Act II, PRA_D6
 * once he has turned. PRA_D5 is the turn itself -- no options, "arithmetic,
 * done out loud, slowly" -- so it is the exchange PRA_B1 option 7 plays, and
 * the conversation goes on to PRA_D6 (doc 57 D5: "PRA_D6 follows").
 * `pratt-jump.json` is PRA_D2, played as Thad arrives on Prosperity in Act II
 * (doc 57 D2). Both close on doc 04's offer run: "Every single conversation,
 * regardless of topic, ends with Pratt making an offer. It never stops."
 *
 * Routing that doc 04 states in prose rather than a backticked flag is the
 * table below, each row citing the line it reads: A1 1 is offered only while
 * the raccoon is in the hole (errata 75); D2 1 "D2 opens"; B1 7 sets
 * T_PRATT_TURNED and completes D5 (doc 57 D5); D6 5 sets the attestation in
 * motion for Room 7 (doc 57 D6). Plain quotes are his, italic quotes Thad's;
 * the italic stage directions are logged and not drawn, as in every tree.
 */
function prattTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# NICKEL PRATT');
  const to = doc.indexOf('\n# ', from + 5);
  if (from < 0 || to < 0) throw new Error('doc 04: no NICKEL PRATT section');
  const body = doc.slice(from, to);
  const SPEAKER = 'pratt';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const offerLine = body.slice(body.indexOf('## The offer')).split('\n').find((line) => line.startsWith('> "'));
  if (!offerLine) throw new Error('doc 04 PRATT: no offer run');
  const offers = offerLine.slice(2).split(' · ').map((one) => quoted(one));
  if (offers.length !== 6 || offers.some((one) => !one.length)) throw new Error(`doc 04 PRATT: ${offers.length} offers, not 6`);
  const closing = { lines: offers, counter: 'PRATT_OFFERS' };
  const section = (head) => {
    const at = body.indexOf(head);
    if (at < 0) throw new Error(`doc 04 PRATT: no "${head}"`);
    return body.slice(at, body.indexOf('\n## ', at + 5) < 0 ? undefined : body.indexOf('\n## ', at + 5));
  };
  const speakerOf = (name) => (name === 'THAD' ? 'thad' : SPEAKER);
  const script = (text) => [...text.matchAll(/^> \*\*([A-Z]+):\*\* (.+)$/gm)].map((m) => {
    const said = quoted(m[2].replace(/\*\([^)]*\)\*/g, ''));
    if (said.length !== 1) throw new Error(`doc 04 PRATT: "${m[2]}" is not one line`);
    return { speaker: speakerOf(m[1]), line: said[0] };
  });
  const ROUTE = {
    'PRA_A1 1': { when: { T_WARM_HOLE: false } },
    'PRA_D2 1': { set: { T_PRATT_STAKE: true }, puzzle: { D2: 'pending' } },
    'PRA_B1 6': { puzzle: { D2: 'complete' } },
    'PRA_B1 7': { set: { T_PRATT_TURNED: true }, puzzle: { D5: 'complete' }, goto: 'PRA_D6', script: '## `PRA_D5`' },
    'PRA_D6 5': { set: { T_PRATT_SWEARS: true } },
  };
  const node = (id, head, exitIndex) => {
    const text = section(head);
    const options = [];
    for (const [, number, optionCell, tagCell, responseCell] of text.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)) {
      const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
      const optionText = quoted(optionCell)[0];
      for (const d of spokenIn(responseCell, SPEAKER).staging) process.stderr.write(`  doc 04 ${id} option ${number} staging: ${d}\n`);
      const bare = responseCell.replace(/\*\([^)]*\)\*/g, '');
      const [reply, ...rest] = bare.split('→');
      let said = spokenIn(reply, SPEAKER).lines;
      if (!said.length) said = spokenIn(rest.join('→'), SPEAKER).lines.slice(0, 1);
      const route = ROUTE[`${id} ${number}`] ?? {};
      if (route.script) said = script(section(route.script).split('He signs.')[0]).concat(script(section(route.script).split('He signs.')[1] ?? ''));
      if (!tag || !optionText || !said.length) throw new Error(`doc 04 ${id}: option ${number} does not read`);
      const option = { id: `${SPEAKER}${number}`, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text: plain(optionText) };
      if (said.length === 1 && said[0].speaker === SPEAKER) option.say = said[0].line;
      else option.exchange = said;
      const after = afterIds(tagCell, SPEAKER);
      if (after) option.after = after;
      const reqs = [...responseCell.matchAll(/req `([A-Z_0-9]+)`/g)].map((m) => m[1]);
      const sets = [...rest.join('→').matchAll(/`([A-Z_0-9]+)`/g)].map((m) => m[1]).filter((flag) => !reqs.includes(flag));
      const when = { ...Object.fromEntries(reqs.map((flag) => [flag, true])), ...(route.when ?? {}) };
      if (Object.keys(when).length) option.when = when;
      const set = { ...Object.fromEntries(sets.map((flag) => [flag, true])), ...(route.set ?? {}) };
      if (Object.keys(set).length) option.set = set;
      if (route.puzzle) option.puzzle = route.puzzle;
      if (route.goto) option.goto = route.goto;
      // THE SPARRING (doc 57 D5): PRA_D6's teaching row, doc 03's exchange and pairs.
      if (tag[1] === 'ASSAY' && /\bpairs? \d/.test(responseCell)) {
        teachingRow(option, responseCell, { teacher: 'Pratt', owner: SPEAKER, sparring: 'Pratt' });
      }
      options.push(option);
    }
    if (!options.length) throw new Error(`doc 04 ${id}: no options`);
    options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[exitIndex % POOL.length], universal: true, ends: true });
    const opening = script(text.split('\n| #')[0]);
    return { id, noPrompt: true, exceptionReason: `Doc 04 writes ${id} as a table only.`, ...(opening.length ? { opening } : {}), options };
  };
  const A1 = node('PRA_A1', '## `PRA_A1`', 4);
  const B1 = node('PRA_B1', '## Root: `PRA_B1`', 4);
  const D6 = node('PRA_D6', '## `PRA_D6`', 4);
  const D2 = { ...node('PRA_D2', '## `PRA_D2`', 4), openingOnce: 'T_PRATT_JUMP_HEARD' };
  const counts = { PRA_A1: A1.options.length, PRA_B1: B1.options.length, PRA_D6: D6.options.length, PRA_D2: D2.options.length };
  if (counts.PRA_A1 !== 5 || counts.PRA_B1 !== 8 || counts.PRA_D6 !== 6 || counts.PRA_D2 !== 4) throw new Error(`doc 04 PRATT: option counts ${JSON.stringify(counts)}`);
  const note = 'EXTRACTED from docs/04-dialogue-trees.md (NICKEL PRATT) by tools/extract-content.mjs. Do not edit: change doc 04 and re-run. '
    + 'Plain quotes in a reply are his, italic quotes Thad\'s. `closing` is doc 04\'s offer run, "It never stops" (errata 97).';
  return [
    write('content/dialogue/pratt.json', {
      aftermathAuthored: true, schema: 1, id: 'PRATT', speaker: SPEAKER, name: 'NICKEL PRATT', note,
      entries: [{ when: { T_PRATT_TURNED: true }, node: 'PRA_D6' }, { when: { ACT: { atLeast: 2 } }, node: 'PRA_B1' }],
      start: 'PRA_A1', closing, nodes: { PRA_A1: A1, PRA_B1: B1, PRA_D6: D6 },
    }),
    write('content/dialogue/pratt-jump.json', {
      aftermathAuthored: true, schema: 1, id: 'PRATT_JUMP', speaker: SPEAKER, name: 'NICKEL PRATT', note,
      start: 'PRA_D2', closing, nodes: { PRA_D2: D2 },
    }),
  ];
}

/**
 * DOC 04, AH-LAM SHENG: Room 28's tree (errata 99 D).
 *
 * SHE_A1 is his root; SHE_D1, "the paper", opens on the business it is for and
 * only while that business is open, so A1's options -- pair 18 among them --
 * are never lost: from holding the paper (A1 option 1) until the Thursday
 * ledger is read (D4), and in Act III until the loan is taken (E3). Doc 57 D3
 * and D4 route it: D1 option 1 is Sheng's terms (D3, T_SHENG_TASK); 1-prime
 * needs THE LINEN MONEY and reads the ledger (D4, T_PRATT_TRAIL); option 2,
 * after it and once Thad needs to die, gives SHENG'S LOAN. A1 option 4 counts
 * a war contradiction; 5 is counted-repeat, its (second) and (third) the
 * repeats; 6 is pair 18. Plain quotes are his; staging is logged, not drawn.
 */
function shengTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# AH-LAM SHENG');
  const to = doc.indexOf('\n# ', from + 5);
  if (from < 0 || to < 0) throw new Error('doc 04: no AH-LAM SHENG section');
  const body = doc.slice(from, to);
  const SPEAKER = 'sheng';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const section = (head) => {
    const at = body.indexOf(head);
    if (at < 0) throw new Error(`doc 04 SHENG: no "${head}"`);
    const end = body.indexOf('\n## ', at + 5);
    return body.slice(at, end < 0 ? undefined : end);
  };
  const ROUTE = {
    'SHE_A1 1': { set: { T_SHENG_HOLDS_PAPER: true }, goto: 'SHE_D1' },
    'SHE_A1 4': { add: { WAR_CONTRADICTIONS: 1 } },
    'SHE_A1 6': { set: { ASSAY_PAIR_18: true } },
    'SHE_D1 1': { set: { T_SHENG_TASK: true }, puzzle: { D3: 'complete' } },
    "SHE_D1 1′": { holds: ['linen_money'], when: { T_SHENG_TASK: true }, set: { T_PRATT_TRAIL: true }, puzzle: { D4: 'complete' } },
    'SHE_D1 2': { when: { T_NEED_TO_DIE: true, T_PRATT_TRAIL: true }, gives: ['loan'], set: { T_SHENG_LOAN: true } },
  };
  const script = (text) => [...text.matchAll(/^> \*\*([A-Z]+):\*\* (.+)$/gm)].map((m) => ({
    speaker: m[1] === 'THAD' ? 'thad' : SPEAKER, line: quoted(m[2].replace(/\*\([^)]*\)\*/g, ''))[0] }));
  const node = (id, head, exitIndex) => {
    const text = section(head);
    const options = [];
    for (const m of text.matchAll(/^\| (\d+′?) \| (.+?) \| (.+?) \| (.+?) \|(?: (.+?) \|)?$/gm)) {
      const [, number, optionCell, tagCell, responseCell] = m;
      const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
      const optionText = quoted(optionCell)[0];
      for (const d of spokenIn(responseCell, SPEAKER).staging) process.stderr.write(`  doc 04 ${id} option ${number} staging: ${d}\n`);
      const route = ROUTE[`${id} ${number}`] ?? {};
      const optId = `${SPEAKER}${number.replace('′', 'a')}`;
      const option = { id: optId, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text: plain(optionText) };
      let said = spokenIn(responseCell.replace(/\*\([^)]*\)\*/g, '').split('→')[0], SPEAKER).lines;
      if (tag[2] === 'counted-repeat') {
        const parts = responseCell.split(/\*\((?:second|third)\)\*/);
        option.say = quoted(parts[0])[0];
        option.repeats = parts.slice(1).map((part, i) => ({ selection: i + 2, say: quoted(part)[0] }));
      } else if (said.length === 1 && said[0].speaker === SPEAKER) option.say = said[0].line;
      else option.exchange = said;
      if (!tag || !optionText || !(option.say || option.exchange?.length)) throw new Error(`doc 04 ${id}: option ${number} does not read`);
      const reqs = [...responseCell.matchAll(/req `([A-Z_0-9]+)`/g)].map((r) => r[1]);
      const when = { ...Object.fromEntries(reqs.map((flag) => [flag, true])), ...(route.when ?? {}) };
      if (Object.keys(when).length) option.when = when;
      if (route.set) option.set = route.set;
      if (route.add) option.add = route.add;
      if (route.holds) option.holds = route.holds;
      if (route.after) option.after = route.after;
      if (route.gives) option.gives = route.gives;
      if (route.puzzle) option.puzzle = route.puzzle;
      if (route.goto) option.goto = route.goto;
      options.push(option);
    }
    options.push({ id: `${SPEAKER}x`, tag: 'EXIT', text: POOL[exitIndex % POOL.length], universal: true, ends: true });
    const opening = script(text.split('\n| #')[0]);
    return { id, noPrompt: true, exceptionReason: `Doc 04 writes ${id} as a table only.`, ...(opening.length ? { opening, openingOnce: 'T_SHENG_PAPER_HEARD' } : {}), options };
  };
  const A1 = node('SHE_A1', '## Root: `SHE_A1`', 2);
  const D1 = node('SHE_D1', '## `SHE_D1`', 2);
  if (A1.options.length !== 7 || D1.options.length !== 7) throw new Error(`doc 04 SHENG: ${A1.options.length} and ${D1.options.length} options`);
  return write('content/dialogue/sheng.json', {
    aftermathAuthored: true, schema: 1, id: 'SHENG', speaker: SPEAKER, name: 'AH-LAM SHENG',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (AH-LAM SHENG) by tools/extract-content.mjs. Do not edit: change doc 04 and re-run. '
      + 'SHE_D1 opens only while its business is open, so SHE_A1\'s options are never lost (errata 99 D).',
    entries: [
      { when: { T_SHENG_HOLDS_PAPER: true, T_PRATT_TRAIL: false }, node: 'SHE_D1' },
      { when: { T_NEED_TO_DIE: true, T_PRATT_TRAIL: true, T_SHENG_LOAN: false }, node: 'SHE_D1' },
    ],
    start: 'SHE_A1', nodes: { SHE_A1: A1, SHE_D1: D1 },
  });
}

function sowerbyTree() {
  const doc = read('docs/04-dialogue-trees.md');
  const from = doc.indexOf('# REVEREND SOWERBY');
  const to = doc.indexOf('\n---', from);
  if (from < 0 || to < 0) throw new Error('doc 04: no REVEREND SOWERBY section');
  const whole = doc.slice(from, to);
  const SPEAKER = 'sowerby';
  const POOL = [...doc.slice(doc.indexOf('## Universal exit lines'), doc.indexOf('# PART TWO')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const ROUTE = {
    'SOW_A1:5': { set: { T_SOW_FUNERAL_ASKED: true }, when: { T_FANSHAWE_FUNERALS: true, T_PIKE_DEAD: true } },
    'SOW_A1:6': { when: { T_SHENG_TASK: true, T_FUNERAL_DAY: false } },
    'SOW_A1:7': { when: { T_MEMORIAL_BOOKED: true, T_FUNERAL_DAY: false },
      whenAny: [{ T_QUEUE_PADDED: false }, { T_PRATT_TRAIL: false }], set: { T_MEMORIAL_BOOKED: true } },
    'SOW_A1:8': { set: { ASSAY_PAIR_17: true } },
    'SOW_C1:1': { add: { SOWERBY_ADJECTIVES: 4 } },
    'SOW_C1:3': { set: { T_SOWERBY_PRICE: true } },
  };
  const nodes = {};
  for (const [index, id] of ['SOW_A1', 'SOW_C1'].entries()) {
    const at = whole.indexOf(`## \`${id}\``);
    if (at < 0) throw new Error(`doc 04: no ${id}`);
    const next = whole.indexOf('\n## ', at + 5);
    const body = whole.slice(at, next < 0 ? whole.length : next);
    const opening = [...body.matchAll(/^> \*\*(SOWERBY|THAD):\*\* (.+)$/gm)].map((m) => ({
      speaker: m[1] === 'THAD' ? 'thad' : SPEAKER, line: quoted(m[2].replace(/\*\([^)]*\)\*/g, '')).join(' ').replace(/\*/g, '') }));
    const options = [];
    for (const [, number, optionCell, tagCell, responseCell] of body.matchAll(/^\| (\d+) \| (.+?) \| (.+?) \| (.+?) \|$/gm)) {
      const tag = /\[([A-Z]+)(?:\s*·\s*([a-z-]+))?\]/.exec(tagCell);
      const text = quoted(optionCell)[0];
      // "(second, softer)" / "(third, ...)": the counted repeats, as frameTree reads them
      const pieces = responseCell.split(/\*\((second|third)[^)]*\)\*/);
      const said = spokenIn(pieces[0].replace(/\*\([^)]*\)\*/g, ''), SPEAKER);
      for (const d of spokenIn(responseCell, SPEAKER).staging) process.stderr.write(`  doc 04 ${id} option ${number} staging: ${d}\n`);
      if (!tag || !text || !said.lines.length) throw new Error(`doc 04 ${id}: option ${number} does not read`);
      const option = { id: `${SPEAKER}${index === 0 ? '' : '_c'}${number}`, tag: tag[1], ...(tag[2] ? { afterUse: tag[2] } : {}), text };
      if (said.lines.length === 1 && said.lines[0].speaker === SPEAKER) option.say = said.lines[0].line;
      else option.exchange = said.lines;
      for (let k = 1; k < pieces.length; k += 2) {
        const later = spokenIn((pieces[k + 1] ?? '').replace(/\*\([^)]*\)\*/g, ''), SPEAKER);
        if (later.lines.length) (option.repeats ??= []).push({ selection: pieces[k] === 'second' ? 2 : 3, say: later.lines.map((l) => l.line).join(' ') });
      }
      const route = ROUTE[`${id}:${number}`] ?? {};
      if (route.when) option.when = route.when;
      if (route.whenAny) option.whenAny = route.whenAny;
      if (route.set) option.set = route.set;
      if (route.add) option.add = route.add;
      options.push(option);
    }
    if (options.length < 3) throw new Error(`doc 04 ${id}: ${options.length} options`);
    options.push({ id: `${SPEAKER}${index === 0 ? '' : '_c'}x`, tag: 'EXIT', text: POOL[(3 + index) % POOL.length], universal: true, ends: true });
    const last = [...opening].reverse().find((u) => u.speaker === SPEAKER);
    nodes[id] = { id, ...(last ? { prompt: last.line } : { noPrompt: true, exceptionReason: 'Doc 04 writes this node as a table only.' }),
      ...(opening.length ? { opening } : {}), options };
  }
  return write('content/dialogue/sowerby.json', {
    aftermathAuthored: true,
    schema: 1,
    id: 'SOWERBY',
    speaker: SPEAKER,
    name: 'REVEREND SOWERBY',
    note: 'EXTRACTED from docs/04-dialogue-trees.md (REVEREND SOWERBY) by tools/extract-content.mjs. '
      + 'Do not edit: change doc 04 and re-run. Plain quotes in a reply are his, italic quotes Thad\'s. '
      + 'The universal exit line is doc 04 part one\'s pool.',
    entries: [{ when: { T_NEED_TO_DIE: true, T_SOWERBY_PRICE: false }, node: 'SOW_C1' }],
    start: 'SOW_A1',
    nodes,
  });
}

// ---------------------------------------------------------------------------
// THE TOWN'S REPUTATION BARKS (doc 07 Part Two; errata 109). Every single-voice
// bark table is read here into the `barks` of that townsperson's ambient file.
// Until errata 109 five were typed in by hand and the hotel clerk's file said
// "Doc 07 writes no barks for the clerk" while doc 07 section 8 wrote nine.
//
// THE TRANSFORMS, all of them, because a bark is one string over a head and
// carries only words:
//   - an italic direction -- *(beat)*, *(He shakes his head.)* -- is dropped,
//     inside the quotes or out;
//   - emphasis asterisks go, the words stay;
//   - two quotes from the same mouth are one line, in order;
//   - an exchange written "A." — "B." — "C." is a conversation with Thad, and
//     the bark is its first line, the townsperson's (the pie woman's R_DEAD).
// The quote marks are the document's. Two-voice tables (the boundary men, the
// boarding-house women) and tables of directions alone (the bell-ringer, the
// fiddler) are not single barks and are not read here.
const BARK_SECTIONS = JSON.parse(read('tools/town-barks.json')).extract;

function townBarks() {
  const doc = read('docs/07-ambient-layer.md');
  const states = JSON.parse(read('content/reputation.json')).states;
  const written = [];
  for (const [heading, file] of Object.entries(BARK_SECTIONS)) {
    const start = doc.indexOf(`\n## ${heading}\n`);
    if (start < 0) throw new Error(`doc 07: no section "## ${heading}"`);
    const end = doc.indexOf('\n## ', start + 4);
    const body = doc.slice(start, end < 0 ? undefined : end);
    const table = body.slice(body.indexOf('**Barks**'));
    const barks = {};
    for (const row of table.split('\n')) {
      const match = row.match(/^\| `(R_[A-Z_]+)` \| (.+) \|$/);
      if (!match) continue;
      let cell = match[2].replace(/\*\([^)]*\)\*/g, ' ');
      const exchange = cell.indexOf('" — "');
      if (exchange >= 0) cell = cell.slice(0, exchange + 1);
      const words = quoted(cell).map(plain).filter(Boolean);
      if (!words.length) throw new Error(`doc 07 ${heading} ${match[1]}: no quoted words`);
      barks[match[1]] = words.join(' ').replace(/\s+/g, ' ').trim();
    }
    const missing = states.filter((state) => !(state in barks));
    if (missing.length) throw new Error(`doc 07 ${heading}: no bark for ${missing.join(', ')}`);
    const path = `content/ambient/${file}.json`;
    const npc = JSON.parse(read(path));
    npc.barks = Object.fromEntries(states.map((state) => [state, barks[state]]));
    npc.barksNote = `EXTRACTED from docs/07-ambient-layer.md (## ${heading}) by tools/extract-content.mjs. `
      + 'Do not edit: change doc 07 and re-run. Directions are dropped, emphasis is plain, and an exchange '
      + 'with Thad is its first line (errata 109).';
    written.push(write(path, npc, 1));
  }
  return written;
}

// ---------------------------------------------------------------------------
// THE TOWNSPEOPLE'S MICRO-TREES AND THE PAIR'S BARKS (doc 07 Part Two;
// errata 110). The five placed in errata 110 -- the boundary men, the message
// boy, the man leaving tomorrow, the fiddler, the dog's owner -- are read from
// doc 07 here, never typed. The grammar is doc 07's NOTATION:
//   > "Q" → reply                 an option, TOPIC
//   > `[COMIC]` "Q" → reply       an option, COMIC
//   > ↳ "Q" → reply               a FOLLOW-UP: offered once the option above has been asked
//   >   *Thad:* "x"               an INTERJECTION inside the reply above
//   >   → "y"                     and the reply goes on
// In a reply, **A:** and **B:** name which of a pair is speaking, a quote is
// the speaker's, and an italic parenthetical is a direction, performed or
// hidden by doc 58's rules. An option line with no quoted words for Thad --
// the message boy's *(pay)* -- has nothing to put on the menu and is left
// out and reported, never worded here. *(after)* is a gate the routes in
// tools/town-barks.json say the meaning of.
function townTrees() {
  const doc = read('docs/07-ambient-layer.md');
  const routing = JSON.parse(read('tools/town-barks.json'));
  const pool = [...read('docs/04-dialogue-trees.md').slice(read('docs/04-dialogue-trees.md').indexOf('## Universal exit lines')).matchAll(/^> "(.+?)"/gm)].map((m) => m[1]);
  const section = (heading) => {
    const start = doc.indexOf(`\n## ${heading}\n`);
    if (start < 0) throw new Error(`doc 07: no section "## ${heading}"`);
    const end = doc.indexOf('\n## ', start + 4);
    return doc.slice(start, end < 0 ? undefined : end);
  };
  /** A reply's spans in order: [{speaker, line, direction?}]. */
  const spoken = (text, speakers, first) => {
    const out = [];
    let who = first;
    for (const span of text.matchAll(/\*\*([AB]):\*\*|\*\(([^)]+)\)\*|"([^"]+)"/g)) {
      const [, voice, direction, words] = span;
      if (voice) { who = speakers[voice]; continue; }
      if (direction !== undefined) {
        const shown = performedDirection(plain(direction));
        if (shown) out.push({ speaker: who, line: shown.line, ...(shown.direction ? { direction: true } : {}) });
        continue;
      }
      out.push({ speaker: who, line: plain(words) });
    }
    return out;
  };
  const written = [];
  const reported = [];
  let poolIndex = 0;
  for (const [heading, spec] of Object.entries(routing.trees)) {
    const body = section(heading);
    const tree = body.slice(body.indexOf('**Micro-tree**'), body.indexOf('**Barks**'));
    const speakers = spec.speakers ?? {};
    const routes = routing.treeRoutes?.[heading] ?? {};
    const options = [];
    let lastTop = null;
    for (const raw of tree.split('\n')) {
      if (!raw.startsWith('>')) continue;
      const line = raw.slice(1);
      const continuation = /^\s{2,}/.test(line);
      const text = line.trim();
      if (continuation) {
        const option = options.at(-1);
        if (!option) throw new Error(`doc 07 ${heading}: a continuation with no option above it`);
        const again = /^\*Asked again:\*\s*"([^"]+)"/.exec(text);
        if (again) { option.repeat = plain(again[1]); continue; }
        const thad = /^\*Thad:\*\s*"([^"]+)"/.exec(text);
        if (thad) { option.exchange.push({ speaker: 'thad', line: plain(thad[1]) }); continue; }
        const more = /^→\s*(.+)$/.exec(text);
        if (more) { option.exchange.push(...spoken(more[1], speakers, spec.speaker)); continue; }
        throw new Error(`doc 07 ${heading}: unread continuation "${text}"`);
      }
      const followUp = text.startsWith('↳');
      const comic = text.includes('`[COMIC]`');
      const arrow = text.indexOf('→');
      if (arrow < 0) throw new Error(`doc 07 ${heading}: an option with no reply: "${text}"`);
      const asked = /"([^"]+)"/.exec(text.slice(0, arrow))?.[1];
      if (!asked) { reported.push(`${heading}: "${text.slice(0, arrow).trim()}" has no words for Thad to say -- left out`); continue; }
      const id = `${spec.prefix}${options.length + 1}`;
      const option = { id, text: plain(asked), tag: comic ? 'COMIC' : 'TOPIC',
        ...(followUp && lastTop ? { after: [lastTop] } : {}), exchange: spoken(text.slice(arrow + 1), speakers, spec.speaker) };
      Object.assign(option, routes[option.text] ?? {});
      if (!followUp) lastTop = id;
      options.push(option);
    }
    for (const text of Object.keys(routes)) {
      if (!options.some((option) => option.text === text)) throw new Error(`doc 07 ${heading}: a route for "${text}", which no option says`);
    }
    for (const option of options) {
      if (option.exchange.length === 1 && option.exchange[0].speaker === spec.speaker && !option.exchange[0].direction) {
        option.say = option.exchange[0].line;
        delete option.exchange;
      }
    }
    options.push({ id: `${spec.prefix}x`, tag: 'EXIT', text: pool[poolIndex % 2], universal: true, ends: true });
    poolIndex += 1;
    written.push(write(`content/dialogue/${spec.file}.json`, {
      schema: 1,
      id: spec.tree,
      speaker: spec.speaker,
      note: `EXTRACTED from docs/07-ambient-layer.md (## ${heading}) by tools/extract-content.mjs. Do not edit: change doc 07 and re-run. `
        + 'Doc 07 writes no opening line; the character greets with his bark (greetsWithBark). The exit is doc 04 part one\'s pool (errata 110).',
      start: 'root',
      nodes: { root: { id: 'root', noPrompt: true, exceptionReason: 'Doc 07 writes the micro-tree as options only; the greeting is the bark.', options } },
    }));
  }
  // THE PAIR'S BARKS: one exchange per reputation, carried by the file named.
  const states = JSON.parse(read('content/reputation.json')).states;
  for (const [heading, spec] of Object.entries(routing.exchanges ?? {})) {
    const body = section(heading);
    const table = body.slice(body.indexOf('**Barks**'));
    const exchange = {};
    for (const row of table.split('\n')) {
      const match = row.match(/^\| `(R_[A-Z_]+)` \| (.+) \|$/);
      if (!match) continue;
      const lines = spoken(match[2], spec.speakers, null).filter((one) => !one.direction);
      if (lines.some((one) => !one.speaker)) throw new Error(`doc 07 ${heading} ${match[1]}: a line with no A or B`);
      exchange[match[1]] = lines;
    }
    const missing = states.filter((state) => !exchange[state]?.length);
    if (missing.length) throw new Error(`doc 07 ${heading}: no bark for ${missing.join(', ')}`);
    const path = `content/ambient/${spec.file}.json`;
    const npc = JSON.parse(read(path));
    npc.barkExchange = Object.fromEntries(states.map((state) => [state, exchange[state]]));
    npc.barksNote = `EXTRACTED from docs/07-ambient-layer.md (## ${heading}) by tools/extract-content.mjs, as \`barkExchange\`: `
      + 'the table is written in two voices, each line said over its own man. Directions are dropped (errata 110).';
    written.push(write(path, npc, 1));
  }
  for (const line of reported) process.stderr.write(`doc 07: ${line}\n`);
  return written;
}

// ---------------------------------------------------------------------------
// THE PROPAGATION ENGINE (doc 06; errata 116). Each reputation state and the
// puzzle whose headline sets it, read from doc 06's table into
// content/reputation.json's `setBy`. The ORDER of the states is errata 7's
// (doc 07 wins), and is the file's own; doc 06 lists BORDERS_MOTT before
// SURVEYED and its order is not used.
function reputation() {
  const doc = read('docs/06-technical-spec.md');
  const body = doc.slice(doc.indexOf('## The propagation engine'), doc.indexOf('## Ambient NPC roster'));
  const file = JSON.parse(read('content/reputation.json'));
  const setBy = {};
  for (const row of body.split('\n')) {
    const match = /^\| `(R_[A-Z_]+)` \| ([^|]+)\|/.exec(row);
    if (!match) continue;
    const puzzle = /\b([A-F]\d{1,2})\b/.exec(match[2])?.[1];
    if (puzzle) setBy[match[1]] = puzzle;
    else if (!/start/i.test(match[2])) throw new Error(`doc 06: ${match[1]} is set by "${match[2].trim()}", which names no puzzle`);
  }
  const unset = file.states.slice(1).filter((state) => !setBy[state]);
  if (unset.length) throw new Error(`doc 06's propagation table sets no puzzle for ${unset.join(', ')}`);
  return write('content/reputation.json', {
    schema: file.schema,
    note: file.note,
    states: file.states,
    setBy: Object.fromEntries(file.states.filter((state) => setBy[state]).map((state) => [state, setBy[state]])),
    setByNote: 'EXTRACTED from docs/06-technical-spec.md (The propagation engine) by tools/extract-content.mjs: the puzzle whose '
      + 'headline moves the town to each state. Reputation is the furthest state, in this order, whose puzzle is complete (errata 116).',
  });
}

// ---------------------------------------------------------------------------
// ACTED DIRECTIONS (doc 95; Tyler, 2026-11-06: "then let's do it? Lol"). Doc
// 95's table decides, for every shown stage direction, whether a figure acts
// it (A), whether it waits for a pose to be drawn (B), or whether it stays
// printed (C), and for an A row which figures act it with which frames. The
// class lives in the document and nowhere else; this carries it to the game.
function actedDirections() {
  const doc = read('docs/95-acted-directions.md');
  const cells = (row) => row.replace(/^\|/, '').replace(/\|\s*$/, '').split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'));
  const directions = [];
  for (const row of doc.split('\n')) {
    if (!/^\| \d+ \| [ABC] \|/.test(row)) continue;
    const [n, kind, speaker, words, where, by, frames, seconds, holds, cue] = cells(row);
    const entry = { n: Number(n), class: kind, speaker, words, where };
    if (kind === 'A') {
      const figures = by.split(',').map((one) => one.trim()).filter(Boolean);
      const sequence = frames.split(/\s+/).filter(Boolean).map(Number);
      const length = Number(seconds);
      if (!figures.length || !sequence.length || sequence.some((one) => !Number.isInteger(one)) || !(length > 0)) {
        throw new Error(`doc 95 row ${n}: an A row names its figures, its frames and its seconds ("${words}")`);
      }
      const sound = cue ? /^([A-Z0-9-]+) @(\d+)$/.exec(cue) : null;
      if (cue && !sound) throw new Error(`doc 95 row ${n}: the cue "${cue}" is not "<CUE> @<frame>"`);
      entry.performedBy = figures;
      entry.frames = sequence;
      entry.seconds = length;
      if (holds) entry.holds = Number(holds);
      if (sound) entry.cue = { id: sound[1], frame: Number(sound[2]) };
    } else if (frames || seconds || holds || cue) {
      throw new Error(`doc 95 row ${n}: a ${kind} row is not acted, and names no frames ("${words}")`);
    }
    directions.push(entry);
  }
  if (!directions.length) throw new Error('doc 95: no directions table');
  return write('content/acted-directions.json', {
    schema: 1,
    note: 'EXTRACTED from docs/95-acted-directions.md by tools/extract-content.mjs (errata 141). Every shown stage direction '
      + 'and its class: A is performed by the figures named, in the frames named, and not printed; B waits for a pose to be drawn '
      + 'and is printed; C is narration and is printed (doc 58). Change a class in doc 95 and re-extract, never here.',
    directions,
  });
}

const written = [opening(), stageDriver(), combinations(), ...rooms0507(), ...room02Exits(),
  ...roomsBatchA(), ...minorTrees(), openingCase(), winnieTree(), hobTree(), sumpTree(), frameTree(), fanshaweTree(), liveryTree(), ozymandiaTree(), sowerbyTree(), raccoonTree(), ...prattTree(), shengTree(), lettersHome(), actCards(), ...actTwoItems(), ...storeItems(), assay(), ...townBarks(), ...townTrees(), reputation(), actedDirections()];
if (!CHECKING) {
  for (const path of written) process.stdout.write(`extracted ${path}\n`);
  // Doc 58 rule 5: a reply whose spoken lines this pass reads differently is
  // left as it was, and named here so the gap is never silent.
  for (const line of directionReport) process.stderr.write(`doc 58: ${line}\n`);
} else {
  for (const path of stale) process.stdout.write(`stale: ${path}\n`);
  process.stdout.write(`${written.length} extracted file(s) checked, ${stale.length} stale\n`);
  if (stale.length > 0) process.exit(1);
}
