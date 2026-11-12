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
    id: 'compile-room-5',
    command: ['node', 'tools/compile-room.mjs', '5', '--write'],
    outputs: ['content/rooms/assay-office.json'],
    why: 'Room 5, the first autonomous pilot room. Its lines come from docs 05 (both of its '
      + 'sections -- the act block gates the queue bench), 25 and 49, and every rect, the '
      + 'walk box, the depth curve and the counter plane from reference/room-05/annotation.json. '
      + 'extract-content stands down for a room that has an annotation, so this is the one writer.',
  },
  {
    id: 'compile-room-3',
    command: ['node', 'tools/compile-room.mjs', '3', '--write'],
    outputs: ['content/rooms/nugget.json'],
    why: 'Room 3, the Bountiful Nugget. Its lines come from docs 05 and 16 and every rect from '
      + 'reference/room-03/annotation.json. It had no live writer until the opening-set retrofit '
      + '(doc 36 Q116): doc 16 writes its overrides by short name and the compiler refused them, so '
      + 'the room file carried a line doc 16 had already reworded. Registered the day it compiled.',
  },
  // EVERY COMPILED ROOM, AND THE EXAMINE LAYER THEY ARE COMPILED FROM (errata 290). Only Rooms 2, 3 and 5 were
  // registered, so a line rewritten in the documents for any other compiled room never reached its room file,
  // and nothing said so: Rooms 9, 10 and 18 went stale in Thad's voice pass, and Room 23 had been stale since
  // GIVE was added (errata 282). extract-examine stitches each room's lines; compile-room builds the room.
  {
    id: 'extract-examine',
    command: ['node', 'tools/extract-examine.mjs'],
    outputs: ['content/examine/'],
    why: 'Stitches each room\u2019s LOOK and LISTEN lines, act variants and wrong-verb lines from the documents '
      + 'its readiness sources name into content/examine/room-NN.json, which compile-room reads.',
  },
  {
    id: 'compile-room-4',
    command: ['node', 'tools/compile-room.mjs', '4', '--write'],
    outputs: ['content/rooms/nugget-back.json'],
    why: 'Room 4, compiled from content/examine/room-04.json and reference/room-04/annotation.json.',
  },
  {
    id: 'compile-room-6',
    command: ['node', 'tools/compile-room.mjs', '6', '--write'],
    outputs: ['content/rooms/assay-records.json'],
    why: 'Room 6, compiled from content/examine/room-06.json and reference/room-06/annotation.json.',
  },
  {
    id: 'compile-room-7',
    command: ['node', 'tools/compile-room.mjs', '7', '--write'],
    outputs: ['content/rooms/claims-registrar.json'],
    why: 'Room 7, compiled from content/examine/room-07.json and reference/room-07/annotation.json.',
  },
  {
    id: 'compile-room-8',
    command: ['node', 'tools/compile-room.mjs', '8', '--write'],
    outputs: ['content/rooms/archive.json'],
    why: 'Room 8, compiled from content/examine/room-08.json and reference/room-08/annotation.json.',
  },
  {
    id: 'compile-room-9',
    command: ['node', 'tools/compile-room.mjs', '9', '--write'],
    outputs: ['content/rooms/clarion.json'],
    why: 'Room 9, compiled from content/examine/room-09.json and reference/room-09/annotation.json.',
  },
  {
    id: 'compile-room-10',
    command: ['node', 'tools/compile-room.mjs', '10', '--write'],
    outputs: ['content/rooms/company-lobby.json'],
    why: 'Room 10, compiled from content/examine/room-10.json and reference/room-10/annotation.json.',
  },
  {
    id: 'compile-room-11',
    command: ['node', 'tools/compile-room.mjs', '11', '--write'],
    outputs: ['content/rooms/fanshawe-office.json'],
    why: 'Room 11, compiled from content/examine/room-11.json and reference/room-11/annotation.json.',
  },
  {
    id: 'compile-room-12',
    command: ['node', 'tools/compile-room.mjs', '12', '--write'],
    outputs: ['content/rooms/mercantile.json'],
    why: 'Room 12, compiled from content/examine/room-12.json and reference/room-12/annotation.json.',
  },
  {
    id: 'compile-room-13',
    command: ['node', 'tools/compile-room.mjs', '13', '--write'],
    outputs: ['content/rooms/undertaker.json'],
    why: 'Room 13, compiled from content/examine/room-13.json and reference/room-13/annotation.json.',
  },
  {
    id: 'compile-room-14',
    command: ['node', 'tools/compile-room.mjs', '14', '--write'],
    outputs: ['content/rooms/boot-hill.json'],
    why: 'Room 14, compiled from content/examine/room-14.json and reference/room-14/annotation.json.',
  },
  {
    id: 'compile-room-15',
    command: ['node', 'tools/compile-room.mjs', '15', '--write'],
    outputs: ['content/rooms/livery.json'],
    why: 'Room 15, compiled from content/examine/room-15.json and reference/room-15/annotation.json.',
  },
  {
    id: 'compile-room-16',
    command: ['node', 'tools/compile-room.mjs', '16', '--write'],
    outputs: ['content/rooms/ozymandias-tent.json'],
    why: 'Room 16, compiled from content/examine/room-16.json and reference/room-16/annotation.json.',
  },
  {
    id: 'compile-room-17',
    command: ['node', 'tools/compile-room.mjs', '17', '--write'],
    outputs: ['content/rooms/church.json'],
    why: 'Room 17, compiled from content/examine/room-17.json and reference/room-17/annotation.json.',
  },
  {
    id: 'compile-room-18',
    command: ['node', 'tools/compile-room.mjs', '18', '--write'],
    outputs: ['content/rooms/hotel-lobby.json'],
    why: 'Room 18, compiled from content/examine/room-18.json and reference/room-18/annotation.json.',
  },
  {
    id: 'compile-room-19',
    command: ['node', 'tools/compile-room.mjs', '19', '--write'],
    outputs: ['content/rooms/thads-room.json'],
    why: 'Room 19, compiled from content/examine/room-19.json and reference/room-19/annotation.json.',
  },
  {
    id: 'compile-room-20',
    command: ['node', 'tools/compile-room.mjs', '20', '--write'],
    outputs: ['content/rooms/back-alley.json'],
    why: 'Room 20, compiled from content/examine/room-20.json and reference/room-20/annotation.json.',
  },
  {
    id: 'compile-room-21',
    command: ['node', 'tools/compile-room.mjs', '21', '--write'],
    outputs: ['content/rooms/watchmans-shack.json'],
    why: 'Room 21, compiled from content/examine/room-21.json and reference/room-21/annotation.json.',
  },
  {
    id: 'compile-room-22',
    command: ['node', 'tools/compile-room.mjs', '22', '--write'],
    outputs: ['content/rooms/claims-road.json'],
    why: 'Room 22, compiled from content/examine/room-22.json and reference/room-22/annotation.json.',
  },
  {
    id: 'compile-room-23',
    command: ['node', 'tools/compile-room.mjs', '23', '--write'],
    outputs: ['content/rooms/prosperity.json'],
    why: 'Room 23, compiled from content/examine/room-23.json and reference/room-23/annotation.json.',
  },
  {
    id: 'compile-room-25',
    command: ['node', 'tools/compile-room.mjs', '25', '--write'],
    outputs: ['content/rooms/pratts-claim.json'],
    why: 'Room 25, compiled from content/examine/room-25.json and reference/room-25/annotation.json.',
  },
  {
    id: 'compile-room-26',
    command: ['node', 'tools/compile-room.mjs', '26', '--write'],
    outputs: ['content/rooms/creek.json'],
    why: 'Room 26, compiled from content/examine/room-26.json and reference/room-26/annotation.json.',
  },
  {
    id: 'compile-room-27',
    command: ['node', 'tools/compile-room.mjs', '27', '--write'],
    outputs: ['content/rooms/claim-row.json'],
    why: 'Room 27, compiled from content/examine/room-27.json and reference/room-27/annotation.json.',
  },
  {
    id: 'compile-room-28',
    command: ['node', 'tools/compile-room.mjs', '28', '--write'],
    outputs: ['content/rooms/laundry.json'],
    why: 'Room 28, compiled from content/examine/room-28.json and reference/room-28/annotation.json.',
  },
  {
    id: 'compile-room-29',
    command: ['node', 'tools/compile-room.mjs', '29', '--write'],
    outputs: ['content/rooms/high-ridge.json'],
    why: 'Room 29, compiled from content/examine/room-29.json and reference/room-29/annotation.json.',
  },
  {
    id: 'compile-room-30',
    command: ['node', 'tools/compile-room.mjs', '30', '--write'],
    outputs: ['content/rooms/motts-site.json'],
    why: 'Room 30, compiled from content/examine/room-30.json and reference/room-30/annotation.json.',
  },
  {
    id: 'compile-room-31',
    command: ['node', 'tools/compile-room.mjs', '31', '--write'],
    outputs: ['content/rooms/funeral.json'],
    why: 'Room 31, compiled from content/examine/room-31.json and reference/room-31/annotation.json.',
  },
  {
    id: 'compile-room-33',
    command: ['node', 'tools/compile-room.mjs', '33', '--write'],
    outputs: ['content/rooms/listening-chamber.json'],
    why: 'Room 33, compiled from content/examine/room-33.json and reference/room-33/annotation.json.',
  },
  {
    id: 'compile-room-34',
    command: ['node', 'tools/compile-room.mjs', '34', '--write'],
    outputs: ['content/rooms/under-prosperity.json'],
    why: 'Room 34, compiled from content/examine/room-34.json and reference/room-34/annotation.json.',
  },
  {
    id: 'compile-room-35',
    command: ['node', 'tools/compile-room.mjs', '35', '--write'],
    outputs: ['content/rooms/company-vault.json'],
    why: 'Room 35, compiled from content/examine/room-35.json and reference/room-35/annotation.json.',
  },
  {
    id: 'compile-room-36',
    command: ['node', 'tools/compile-room.mjs', '36', '--write'],
    outputs: ['content/rooms/main-street-dawn.json'],
    why: 'Room 36, compiled from content/examine/room-36.json and reference/room-36/annotation.json.',
  },
  {
    id: 'compile-room-37',
    command: ['node', 'tools/compile-room.mjs', '37', '--write'],
    outputs: ['content/rooms/boarding-house-parlour.json'],
    why: 'Room 37, compiled from content/examine/room-37.json and reference/room-37/annotation.json.',
  },
  {
    id: 'compile-room-38',
    command: ['node', 'tools/compile-room.mjs', '38', '--write'],
    outputs: ['content/rooms/photographers-studio.json'],
    why: 'Room 38, compiled from content/examine/room-38.json and reference/room-38/annotation.json.',
  },
  {
    id: 'compile-room-39',
    command: ['node', 'tools/compile-room.mjs', '39', '--write'],
    outputs: ['content/rooms/bakehouse.json'],
    why: 'Room 39, compiled from content/examine/room-39.json and reference/room-39/annotation.json.',
  },
  {
    id: 'compile-room-40',
    command: ['node', 'tools/compile-room.mjs', '40', '--write'],
    outputs: ['content/rooms/empty-storefront.json'],
    why: 'Room 40, compiled from content/examine/room-40.json and reference/room-40/annotation.json.',
  },
  {
    id: 'compile-room-41',
    command: ['node', 'tools/compile-room.mjs', '41', '--write'],
    outputs: ['content/rooms/schoolhouse.json'],
    why: 'Room 41, compiled from content/examine/room-41.json and reference/room-41/annotation.json.',
  },
  {
    id: 'compile-room-42',
    command: ['node', 'tools/compile-room.mjs', '42', '--write'],
    outputs: ['content/rooms/barbers.json'],
    why: 'Room 42, compiled from content/examine/room-42.json and reference/room-42/annotation.json.',
  },
  {
    id: 'compile-room-43',
    command: ['node', 'tools/compile-room.mjs', '43', '--write'],
    outputs: ['content/rooms/lower-street.json'],
    why: 'Room 43, compiled from content/examine/room-43.json and reference/room-43/annotation.json.',
  },
  {
    id: 'compile-room-44',
    command: ['node', 'tools/compile-room.mjs', '44', '--write'],
    outputs: ['content/rooms/the-lane.json'],
    why: 'Room 44, compiled from content/examine/room-44.json and reference/room-44/annotation.json.',
  },
  {
    id: 'compile-room-45',
    command: ['node', 'tools/compile-room.mjs', '45', '--write'],
    outputs: ['content/rooms/washout.json'],
    why: 'Room 45, compiled from content/examine/room-45.json and reference/room-45/annotation.json.',
  },
  {
    id: 'compile-room-46',
    command: ['node', 'tools/compile-room.mjs', '46', '--write'],
    outputs: ['content/rooms/mine-adit.json'],
    why: 'Room 46, compiled from content/examine/room-46.json and reference/room-46/annotation.json.',
  },
  {
    id: 'compile-room-47',
    command: ['node', 'tools/compile-room.mjs', '47', '--write'],
    outputs: ['content/rooms/mine-climb.json'],
    why: 'Room 47, compiled from content/examine/room-47.json and reference/room-47/annotation.json.',
  },
  {
    id: 'compile-room-48',
    command: ['node', 'tools/compile-room.mjs', '48', '--write'],
    outputs: ['content/rooms/mine-two-rocks.json'],
    why: 'Room 48, compiled from content/examine/room-48.json and reference/room-48/annotation.json.',
  },
  {
    id: 'compile-room-49',
    command: ['node', 'tools/compile-room.mjs', '49', '--write'],
    outputs: ['content/rooms/mine-line.json'],
    why: 'Room 49, compiled from content/examine/room-49.json and reference/room-49/annotation.json.',
  },
  {
    id: 'compile-room-50',
    command: ['node', 'tools/compile-room.mjs', '50', '--write'],
    outputs: ['content/rooms/ledge.json'],
    why: 'Room 50, compiled from content/examine/room-50.json and reference/room-50/annotation.json.',
  },
  {
    id: 'compile-room-51',
    command: ['node', 'tools/compile-room.mjs', '51', '--write'],
    outputs: ['content/rooms/gulch-tents.json'],
    why: 'Room 51, compiled from content/examine/room-51.json and reference/room-51/annotation.json.',
  },
  {
    id: 'compile-room-52',
    command: ['node', 'tools/compile-room.mjs', '52', '--write'],
    outputs: ['content/rooms/grog-tent.json'],
    why: 'Room 52, compiled from content/examine/room-52.json and reference/room-52/annotation.json.',
  },
  {
    id: 'compile-room-53',
    command: ['node', 'tools/compile-room.mjs', '53', '--write'],
    outputs: ['content/rooms/gulch-river.json'],
    why: 'Room 53, compiled from content/examine/room-53.json and reference/room-53/annotation.json.',
  },
  {
    id: 'compile-room-54',
    command: ['node', 'tools/compile-room.mjs', '54', '--write'],
    outputs: ['content/rooms/upstream.json'],
    why: 'Room 54, compiled from content/examine/room-54.json and reference/room-54/annotation.json.',
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
