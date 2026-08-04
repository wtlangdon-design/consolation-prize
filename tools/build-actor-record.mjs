/**
 * Rebuilds content/actors/<id>.json from the per-clip frame directories.
 *
 * RULING: Q9 and Q14, answered. One drawn size, not two. Errata 24's tiers,
 * the decimation threshold and eye_death_row are void, and the record now
 * addresses the twenty directories under art/actors/ that the old schema
 * could not name.
 *
 * NOT actor_export.py. That module measured a composed 320x144 sprite sheet
 * and is refused by tools/pixelart/superseded.py for exactly that reason --
 * running it reverted errata 54's migration. This reads the rig, which is
 * where the new art describes itself, and never measures a sheet.
 *
 * WHAT IS READ AND WHAT IS NOT. Facing comes from the DIRECTORY NAME, never
 * from rig.json's `facing`: that field records which way the SOURCE art was
 * drawn, so thad-idle-back carries "right" and believing it would put the
 * back-facing frames on the right-facing clip. `walk_dx` is read as the
 * ruling requires and written through to the record, where a validator
 * checks it against the facing rather than anything inferring one from the
 * other.
 *
 * THE ANCHOR IS MEASURED, NOT ASSUMED. Verified across all twenty
 * directories: the figure's top is canvas row 0, its soles are at
 * rig.figure[1], its centre is at rig.padding + rig.figure[0] / 2, and the
 * canvas carries 65 rows below the soles and 260 columns either side so a
 * swinging limb is not clipped. A walk frame's alpha runs from x=79 to
 * x=1146 in a 1229-wide canvas -- well outside the figure box -- which is
 * what the padding is for and why the record stores the anchor rather than
 * letting the renderer take a bounding box per frame and jitter.
 *
 * Run: node tools/build-actor-record.mjs
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ART = 'art/actors';

/**
 * EVERY CHARACTER IS NAMED HERE, and the manifest names every record this
 * writes. Neither end discovers anything from a directory listing.
 *
 * The ruling is explicit-list-not-convention, and the reason is that
 * convention picks up a half-written file or something copied in to look at,
 * silently, and then the game either loads it or does not depending on what
 * happened to be on disk. A list is checkable; a directory is a fact about
 * someone's afternoon.
 */
const CHARACTERS = ['thad', 'hob', 'coach'];

/** Movers that are not people, and the height their own art is drawn at. */
const FIXED_HEIGHT = { coach: 389 };

/** clip id -> the frame-file prefix the rig wrote, and the directory infix. */
const CLIPS = [
  { id: 'stand', dir: 'stand', prefix: 'stand' },
  { id: 'idle', dir: 'idle', prefix: 'idle' },
  // The coach with its door open -- beats 3 to 6, after Thad has climbed out.
  // Resolved by ActorClip's `state`, the same discriminator as `surface`: a
  // mover with no state gets the stateless clip, which is the shut door.
  { id: 'idle', dir: 'idle-door-open', prefix: 'idle-door-open', state: 'door-open' },
  // The paw, with the door open. Without it the break falls back to the
  // stateless clip -- the closed door -- and takes the driver's rect with it.
  { id: 'idle-break', dir: 'idlebreak-door-open', prefix: 'idle-break-door-open', state: 'door-open' },
  { id: 'idle-break', dir: 'idlebreak', prefix: 'idle-break' },
  { id: 'walk', dir: 'walk', prefix: 'walk' },
  // BEAT 11'S FAR FIGURE, derived from the back walk's own alpha rather than
  // drawn -- a flat silhouette in the room's darkest value with a two-pixel
  // bob. It takes over below 22px, where the eight-frame walk drops from five
  // distinct pictures to four and the animation has lost a position. A
  // separate clip id rather than a `state`, because it is not a variant of the
  // walk: it is different art with a different frame count, handed off to at a
  // measured height. `tools/rig/far_blob.py`, doc 36 Q91.
  { id: 'farwalk', dir: 'farwalk', prefix: 'farwalk' },
  { id: 'recoil', dir: 'recoil', prefix: 'recoil' },
  // Doc 17's mud beat, three attempts at one boot. The sizes are the joke:
  // a discreet tug, a determined pull, and an undignified wrench.
  { id: 'tug', dir: 'tug', prefix: 'tug' },
  { id: 'strain', dir: 'strain', prefix: 'strain' },
  { id: 'wrench', dir: 'wrench', prefix: 'wrench' },
  // CHORES. Doc 40's contract: each is stand -> key pose -> stand, with
  // begin/contact/commit/recover/complete on named frames rather than magic
  // numbers, and frames 0 and 4 byte-identical to `stand` so it cannot pop on
  // either end. Right-facing only: every one was drawn as a right profile, and
  // a missing facing is data rather than a defect.
  { id: 'use-near', dir: 'use-near', prefix: 'use-near' },
  { id: 'give-offer', dir: 'give-offer', prefix: 'give-offer' },
  { id: 'shrug', dir: 'shrug', prefix: 'shrug' },
  { id: 'pickup-low', dir: 'pickup-low', prefix: 'pickup-low' },
  { id: 'alight-coach', dir: 'alight-coach', prefix: 'alight-coach' },
  { id: 'aboard-coach', dir: 'aboard-coach', prefix: 'aboard-coach' },
  { id: 'carry', dir: 'carry', prefix: 'carry' },
  // Standing still, LOOKING UP at the driver's box. Left only: he stands to
  // the driver's right, and the driver's own looking-down turns toward frame
  // right, so they face each other.
  // A STATE OF `idle`, NOT A CLIP OF ITS OWN -- the same shape the coach's
  // open door uses above. As `{id: 'lookup'}` nothing but a chore could ever
  // play it, and a chore is a one-shot; as a state of the clip he already
  // stands in, `setState` holds it for as long as a beat says.
  { id: 'idle', dir: 'lookup', prefix: 'lookup', state: 'lookup' },
  // AND ITS SHRUG, which check-state-coverage asked for by name. Without it
  // his head came down for six seconds every time the break fired: a state on
  // one clip and not another unsets itself whenever the other plays.
  { id: 'idle-break', dir: 'idlebreak-lookup', prefix: 'idle-break', state: 'lookup' },
  // THE COACH IS A MOVER, not a room layer. errata 38's `move` translates a
  // named mover; a hotspot's state image is drawn by drawPlate and cannot be
  // translated at all, so beat 6b could never have worked from one. Its two
  // clips are its two states -- one frame each, no animation, because the
  // wheels are separate sprites and nothing drives them yet.
  // The coach's two clips carry the names every mover is asked for. Actor.clip
  // returns `walk` while moving and `idle` when still, whatever the mover is.
  // Declaring `halted` and `unloaded` threw CLIP_FALLBACK: idle/right on the
  // first frame, which was Q20 working exactly as ruled.
];
const FACINGS = ['front', 'back', 'left', 'right'];

/** Per actor, per state: the clip ids that deliberately have no variant. */
const PARTIAL_STATES = {
  // He does not walk, recoil, strain or settle to `stand` while looking up:
  // beat 3 sets the state after he has arrived and beat 6 clears it before
  // anything moves him. Turning him is MEANT to drop it, which clipOf does for
  // free -- and `strain` is beat 11, long after beat 6 cleared it, reached
  // through a `face left` that would drop the state anyway.
  thad: { lookup: ['walk', 'recoil', 'tug', 'strain', 'wrench', 'stand'] },
  // THE DOOR IS CLOSED BY THE STAGING, NOT BY A MISSING VARIANT. Beat 6b
  // clears `door-open` BEFORE the move, so the driver shuts the door and then
  // pulls away, and the coach never plays `walk` with the state set. A door
  // closing is a thing a driver does; a door vanishing is a defect, and
  // generating a door-open walk would have shipped the second one.
  coach: { 'door-open': ['walk'] },
};

/**
 * A CHARACTER IS DRAWN IN THE FACINGS HE HAS AND NO OTHERS, and the record
 * says which. Hob is right-facing only -- four clips against Thad's twenty --
 * because he crosses the road once and never comes back, and that is the art
 * being right rather than the art being short.
 *
 * Declared rather than inferred at the draw call, so that asking Hob to face
 * left is answered by data instead of by a guard. Q20's ruling still holds
 * underneath it: no silent substitution, ever. A facing he does not have draws
 * nothing; a clip he SHOULD have and does not is still named.
 */
function facingsOf(id) {
  const found = new Set();
  for (const facing of FACINGS) {
    for (const clip of CLIPS) {
      if (existsSync(join(ART, `${id}-${clip.dir}-${facing}`))) found.add(facing);
    }
  }
  return FACINGS.filter((facing) => found.has(facing));
}

/**
 * OVERLAYS ARE NOT BODY CLIPS AND THE GENERATOR REFUSES TO CONFUSE THEM.
 *
 * `art/actors/` holds two kinds of directory that look identical from outside:
 * RGBA frames with a rig.json. A body clip is scaled to a character height
 * against its `figure`. A head overlay composites into a body frame at
 * `overlay_rect` -- and it carries a `figure` too, because the rig records
 * which body it belongs to. Scaling one by that figure produces a sprite four
 * to eight pixels tall. Thad's three `talk` directories do exactly that.
 *
 * So every directory is accounted for here, and anything that is neither a
 * listed body clip nor a marked overlay stops the build. `check-actor-clips`
 * asserts the same thing against the shipped record, for the case where this
 * is not re-run.
 */
const OVERLAY_KIND = 'head-overlay';
const wantedDirs = new Set(
  CHARACTERS.flatMap((id) => CLIPS.flatMap((clip) =>
    FACINGS.map((facing) => `${id}-${clip.dir}-${facing}`))),
);
for (const name of readdirSync(ART, { withFileTypes: true })
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name)) {
  const rigPath = join(ART, name, 'rig.json');
  if (!existsSync(rigPath)) throw new Error(`${ART}/${name} has no rig.json`);
  const rig = JSON.parse(readFileSync(rigPath, 'utf8'));
  const overlay = rig.kind === OVERLAY_KIND || rig.overlay_rect !== undefined;
  if (overlay && wantedDirs.has(name)) {
    throw new Error(`${name} is a ${OVERLAY_KIND}; it cannot be a body clip`);
  }
  if (!overlay && !wantedDirs.has(name)) {
    throw new Error(
      `${name} is neither a listed body clip of a listed character nor marked `
      + `"kind": "${OVERLAY_KIND}". Add its character to CHARACTERS, add its clip to `
      + 'CLIPS, or mark it in its rig.',
    );
  }
}

function recordFor(id) {
  const facings = facingsOf(id);
  if (facings.length === 0) throw new Error(`${id} has no clip directories`);
  const clips = [];
  for (const clip of CLIPS) {
    for (const facing of facings) {
      const dir = `${ART}/${id}-${clip.dir}-${facing}`;
      // A character need not have every clip. Hob has no recoil because
      // nothing ever makes him flinch.
      if (!existsSync(dir)) continue;
      const rig = JSON.parse(readFileSync(join(dir, 'rig.json'), 'utf8'));

      const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
      const expected = files.map((_, i) => `${clip.prefix}-${String(i).padStart(2, '0')}.png`);
      if (files.join() !== expected.join()) {
        throw new Error(`${dir}: frames are ${files.join(', ')}, expected ${expected.join(', ')}`);
      }
      if (rig.frames !== files.length) {
        throw new Error(`${dir}: rig says ${rig.frames} frames, directory has ${files.length}`);
      }

      const [figureWidth, figureHeight] = rig.figure;
      clips.push({
        id: clip.id,
        facing,
        frames: files.map((f) => `${dir}/${f}`),
        // The figure's own height in source pixels. Every clip of one facing
        // shares it, which is what keeps him the same size between standing
        // and walking rather than resizing to each clip's bounding box.
        figureHeight,
        // Where the soles and the centre line sit on the padded canvas.
        anchor: [rig.padding + Math.round(figureWidth / 2), figureHeight],
        // Only the walk clips carry one. Written through, never inferred.
        ...(rig.walk_dx === undefined || rig.walk_dx === null ? {} : { walkDx: rig.walk_dx }),
        // ActorClip's `state` discriminator, from the rig. Written through the
        // same way, and ABSENT rather than null when there is none -- clipOf
        // does exact-match-then-fall-back, so a stateless clip is the fallback
        // and a null would be a state nobody can ask for.
        ...(rig.state === undefined || rig.state === null ? {} : { state: rig.state }),
        // THE LANTERN, PER FRAME AND PER CLIP. Q81 ruled this before the work
        // started: Hob's stand holds the lamp at his side and his walk holds it
        // FORWARD, because a man carrying a lamp holds it out to see by. One
        // anchor per character would pin the light pool to one of those and let
        // the lamp walk out of its own light.
        //
        // Canvas coordinates, the same space as `anchor`, so the renderer
        // projects it through exactly the arithmetic it uses for the sprite.
        // Written through, never inferred -- the lamp is drawn UNLIT, so there
        // is nothing in the pixels to find it by.
        ...(rig.lantern_anchor === undefined ? {} : { lanternAnchor: rig.lantern_anchor }),
      });
      const lantern = rig.lantern_anchor;
      if (lantern !== undefined) {
        if (!Array.isArray(lantern) || lantern.length !== files.length) {
          throw new Error(`${dir}: lantern_anchor has `
            + `${Array.isArray(lantern) ? lantern.length : 'no'} entries for ${files.length} `
            + 'frames. It is a point PER FRAME; one short would light the wrong hand');
        }
        for (const [n, point] of lantern.entries()) {
          if (!Array.isArray(point) || point.length !== 2
            || !point.every((v) => Number.isFinite(v))) {
            throw new Error(`${dir}: lantern_anchor[${n}] is ${JSON.stringify(point)}, `
              + 'expected a [x, y] point on the padded canvas');
          }
        }
      }
    }
  }
  return { facings, clips };
}

const HEIGHT_NOTE =
  'MEASURED, and it replaces 205. That number came from reading Room 1\'s fence as '
  + 'chest-to-shoulder on a man -- an eye judgement treated as a measurement -- and it '
  + 'left the protagonist at 23.7% of the play area against Monkey Island\'s 27.8%. '
  + 'The wagon wheel is a second independent anchor and the two disagreeing is what '
  + 'exposed it. 240/864 matches. The room\'s curve is rescaled with its shape '
  + 'unchanged. Errata 54\'s original ~233 was arithmetic from Monkey Island\'s '
  + 'proportions and was never checked against the plate at all.';

/**
 * Build and compare instead of writing. THE RECORDS ARE GENERATED AND A
 * GENERATED FILE CAN BE STALE, which is not a hypothetical: `f8699d3`
 * rewrote every frame and every rig.json and did not re-run this, so the
 * records went on declaring figure heights in the old source space and the
 * protagonist drew at a third of his size. Q34.
 */
const CHECK = process.argv.includes('--check');
let stale = 0;

for (const id of CHARACTERS) {
  const out = `content/actors/${id}.json`;
  const { facings, clips } = recordFor(id);
  // Rates are authored, not measured, so they survive a regeneration. A
  // character with no record yet takes the protagonist's until someone times
  // his own -- and the note says so rather than the numbers pretending.
  const previous = existsSync(out) ? JSON.parse(readFileSync(out, 'utf8')) : null;
  const base = previous ?? JSON.parse(readFileSync(`content/actors/${CHARACTERS[0]}.json`, 'utf8'));

  const record = {
    schema: 2,
    id,
    note:
      'ERRATA 54, and Q9 and Q14 as ruled. ONE DRAWN SIZE. Errata 24\'s two tiers, its '
      + 'decimation threshold and the eye_death_row measurement behind it are all void: '
      + 'errata 54 replaced decimation with ordinary filtered resampling, so there is '
      + 'nothing for a threshold to switch between. Frames are individual RGBA files in '
      + 'the per-clip directories under art/actors/, which is what the old sheet-and-cell '
      + 'schema could not address -- that was the blocking half of Q14. Generated by '
      + 'tools/build-actor-record.mjs from each directory\'s rig.json; do not hand-edit.',
    // A CHARACTER'S HEIGHT IS A POINT ON THE ROOM'S DEPTH CURVE. A VEHICLE'S
    // IS NOT. That curve runs 222 to 263 and describes how tall a MAN is at a
    // given depth; handing a coach to it drew it at 590x240 against art of
    // 956x389, roof at head height, where a stagecoach stands half again over
    // a man. A mover that is not a person carries its own drawn height and
    // takes no scaling from the curve.
    height: FIXED_HEIGHT[id] ?? 240,
    // Declared in the RECORD, not just known here. The engine had no way to
    // tell a coach from a man, so it applied the protagonist's height to both.
    ...(FIXED_HEIGHT[id] ? { scalesWithDepth: false } : {}),
    heightNote: FIXED_HEIGHT[id]
      ? `${id} is not a person: its height is its own art at the scale the room `
        + 'was measured for, and it is NOT a point on the depth curve.'
      : HEIGHT_NOTE,
    /**
     * The facings this character is DRAWN in. Asking for another is answered
     * by data rather than by a guard -- see facingsOf.
     */
    facings,
    ...(previous ? {} : {
      ratesNote:
        `Taken from ${CHARACTERS[0]}'s record because nobody has timed ${id} separately. `
        + 'Stated rather than left to look measured.',
    }),
    walkRate: base.walkRate,
    // MEASURED FROM THE FRAMES AND AUTHORED, like the rates: it survives a
    // regeneration because it is a fact about the walk cycle rather than about
    // the directory listing. Omitted where a record has none -- the coach's
    // walk is one frame and has no gait -- and an absent stride keeps the
    // clock-driven advance rather than taking somebody else's number.
    ...(base.walkSpeed !== undefined
      ? { walkSpeed: base.walkSpeed, walkSpeedNote: base.walkSpeedNote }
      : {}),
    ...(base.strideLength !== undefined
      ? { strideLength: base.strideLength, strideNote: base.strideNote }
      : {}),
    reactRate: base.reactRate,
    idleRate: base.idleRate,
    idleBreakRate: base.idleBreakRate ?? 2.0,
    idleBreakNote:
      'Doc 40\'s idle-break, which the old record could not declare because it had no '
      + 'clip for it. Played on a timer while he is idle and returning to stand '
      + 'afterwards, never looped. 2/s over twelve frames is a six-second gesture.',
    // WHICH CLIPS DELIBERATELY LACK A STATE VARIANT, and why each one is a
    // decision rather than a gap. check-state-coverage reads this: a state
    // declared on one clip and absent from another UNSETS ITSELF whenever the
    // other plays, which is how the coach's door flashed shut every time the
    // horse pawed.
    //
    // Thad's `lookup` is genuinely partial for three of them. He does not
    // walk, recoil or settle to `stand` while he is looking up at the driver
    // -- beat 3 sets it after he has arrived and beat 6 clears it before
    // anything else moves him -- and turning him is meant to drop it, which
    // clipOf's fallback does for free.
    //
    // `idle-break` IS NOT LISTED, and that absence is the point: it fires on
    // its own timer while he stands through the whole conversation, so it is
    // the one clip that will actually play while the state is held.
    ...(PARTIAL_STATES[id] ? { partialStates: PARTIAL_STATES[id] } : {}),
    clips,
  };

  const wanted = `${JSON.stringify(record, null, 2)}\n`;
  const frames = clips.reduce((n, c) => n + c.frames.length, 0);
  const summary = `${out}: ${clips.length} clips, ${frames} frames, `
    + `facings ${facings.join('/')}, height ${record.height}`;

  // --check builds the record and COMPARES rather than writing, so a
  // validation pass never mutates the tree. Same convention and same output
  // grammar as tools/extract-content.mjs, because tools/check-generated.mjs
  // reads both the same way.
  if (CHECK) {
    if (!previous || readFileSync(out, 'utf8') !== wanted) {
      console.log(`stale: ${out}`);
      stale += 1;
    } else {
      console.log(`current: ${summary}`);
    }
    continue;
  }
  writeFileSync(out, wanted);
  console.log(`wrote ${summary}`);
}

if (CHECK && stale > 0) process.exit(1);
