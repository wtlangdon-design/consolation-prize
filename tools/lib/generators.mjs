/**
 * EVERY GENERATED ARTEFACT IN THE REPOSITORY, AND WHAT REGENERATES IT.
 *
 * A generated file that was not regenerated is a defect with no symptom at
 * the point it is made and a bewildering one later. It has happened twice:
 *
 *   `f8699d3` rewrote every actor frame and every rig.json at a new size and
 *   did not re-run tools/build-actor-record.mjs. The records went on
 *   declaring figure heights in the old source space, the protagonist drew at
 *   a THIRD of his size with his soles 175 px above his feet, and every check
 *   in this directory passed. Q34.
 *
 *   Before that, hand-edits to /content that the documents did not know about,
 *   which is what tools/extract-content.mjs --check exists to catch.
 *
 * THE RULE THIS FILE ENFORCES: a generator with a checked-in output is
 * registered here, and a registered generator has a `--check` mode that
 * builds its output and COMPARES rather than writing. Validation must never
 * mutate the tree -- a check that writes is a check nobody can safely run on
 * a dirty branch, so it is a check that stops being run.
 *
 * WHY A LIST AND NOT A CONVENTION SCAN. Discovering generators by looking for
 * files that write into content/ finds the ones that exist today and cannot
 * distinguish a generator from a one-shot migration. `migrate-play-area-x6`
 * writes to the same directories and must NEVER be re-run: it multiplies
 * geometry by six, and running it twice multiplies by thirty-six. It is named
 * below so that the next person reads why it is absent rather than assuming
 * it was forgotten.
 */

/** @type {{id: string, command: string[], outputs: string[], why: string, coveredBy?: string}[]} */
export const GENERATORS = [
  {
    id: 'build-actor-record',
    command: ['node', 'tools/build-actor-record.mjs'],
    outputs: ['content/actors/thad.json', 'content/actors/hob.json'],
    why: 'Reads each art/actors/<clip>/rig.json and writes the actor record the engine '
      + 'loads. Any rig change -- a new figure height, a walk_dx, a facing, a clip '
      + 'directory added or removed -- changes what this produces.',
  },
  {
    id: 'compile-room-2',
    command: ['node', 'tools/compile-room.mjs', '2', '--write'],
    outputs: ['content/rooms/main-street.json'],
    // CAMERA-FOLLOW LANDED, so the reason this was dry-run only is gone. The
    // engine no longer asserts a 1920x864 room anywhere: the room declares its
    // own `size`, the renderer draws the plate at it, the hit test converts
    // into it and three validators measure rects against it. Room 2 is 3700
    // wide and legal.
    why: 'Doc 46\u2019s room compiler. Room 2\u2019s hotspots, their LOOK/LISTEN lines, their '
      + 'verb overrides and repeat variants, and every rect and the walk box, come from '
      + 'docs 05 and 13 and reference/room-02/annotation.json. Editing the room file '
      + 'directly loses the edit on the next compile and desynchronises it from the '
      + 'writing, which is the whole failure the compiler exists to prevent.',
  },
  {
    id: 'extract-content',
    command: ['node', 'tools/extract-content.mjs'],
    outputs: ['content/'],
    why: 'Parses every written line out of /docs. CLAUDE.md makes this binding: a line '
      + 'that needs changing is changed in the document and re-extracted, never edited '
      + 'in /content.',
    // Already asserted by its own check, whose failure messages say more about
    // documents than a generic staleness report could. Registered anyway, so
    // this list is the complete inventory rather than the leftovers.
    coveredBy: 'check-extraction',
  },
];

/**
 * NOT GENERATORS, though they write into the same directories.
 *
 * Listed because the reason each is excluded is a thing worth reading before
 * anybody adds it above.
 */
export const NOT_GENERATORS = [
  {
    id: 'migrate-play-area-x6',
    why: 'A ONE-SHOT MIGRATION, kept as the record of what errata 54 moved. It multiplies '
      + 'every play-area coordinate by six. Running it a second time multiplies by '
      + 'thirty-six.',
  },
  {
    id: 'actor_export.py',
    why: 'Superseded. It measures a composed 320x144 sheet and rewrites the actor record '
      + 'from it, reverting errata 54. Refused by tools/pixelart/superseded.py.',
  },
  {
    id: 'render-all.mjs',
    why: 'Writes review renders under renders/, which are looked at rather than loaded. '
      + 'It exits non-zero on purpose and three of its composers refuse to run at all.',
  },
  {
    id: 'render-music.mjs',
    why: 'EVERY RENDER IS A DIFFERENT PERFORMANCE. The synthesis uses Math.random() twice on '
      + 'purpose -- the noise source, and a per-note vibrato rate so two notes never line up '
      + '-- so two runs give files of identical length differing in half their samples, about '
      + '30 dB down. Byte comparison is the wrong question to ask of it. Seeding them would '
      + 'make it reproducible and make every note vibrate identically, which is the sound the '
      + 'jitter exists to avoid. It refuses to overwrite an existing stem without --force, '
      + 'because a stem that exists has been listened to.',
  },
];
