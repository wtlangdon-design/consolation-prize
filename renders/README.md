# renders/

Every render this project produces: room composites, character sheets,
scale checks and inspection crops.

Regenerate the lot with:

    npm run renders

**Files are overwritten in place.** There are no version suffixes and there
should never be any — git holds every previous version, and a second
versioning scheme in the filenames would only end up disagreeing with it.

`@4x` and `@8x` are review scales. A file with no suffix is native
resolution — 320×144 for a room, and that is what the game actually shows.
`@8x` exists because errata ruling 16 rule 5 requires character sprites to
be inspected at 8x; four separate defects in the Thad pass were invisible
at 4x.

## Not renders

`art/backgrounds/*.png` are **shipping assets**. The engine loads them at
runtime and room JSON references them by path, so they live apart from this
directory and keep their own names. Changing a filename in there breaks a
room; changing one in here breaks nothing.

`art/palette/consolation-256.json` is the locked palette. Also not a render.
