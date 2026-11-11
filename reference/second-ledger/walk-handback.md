# Winnie's walk to the board: handed back (reference/second-ledger/walk-brief.md)

**The operation.** `room-05-second-ledger` stood at two of its three (ledger: attempts 1 and 2; 412 attempts in all).
This is **attempt 3, the last**; the asset has none left. `art/staging/caps.json` is not changed.

- Raw sheet: `art/staging/room-05/second-ledger/walk/sheet-03.png` (1536 x 1024, on magenta).
- Prompt and spec: `reference/second-ledger/walk-03.txt`, `walk-03.spec.json`.
- Inputs beside the sheet: `template.png` (her frame 0 seven times, the first left as the ruler), her whole sheet
  (`winnie-second-ledger.png`), Thad and her in Room 5 (`thad-and-winnie-in-room-5.png`, from
  `renders/room-05-second-ledger-retrieval.png`), and Thad's own six-frame walk to the left as the pose guide
  (`thad-walk-left-poses.png`, as Frame's six-frame walk was posed).

Not cut into `art/actors/`, and nothing in `content/` touched, as the brief says.

## What it is

Left to right: her frame 0 (the ruler, as given), then **six frames of Winnie walking to the left in profile**, her
charcoal blouse, long dark skirt and bun, hands low at her sides, the skirt swinging and the boot toes under the hem,
all on one ground line (soles at rows 704-707 of the sheet). Flat and soft-shaded, at her sheet's level of detail.

## What missed

Measured on the sheet (keyed on the distance from magenta):

1. **Height: about 5.5% short.** The ruler (her frame 0 as drawn on the template) is 404 px crown to boots; the six
   walkers are 380-383. One factor (about 1.06) for all six, in the cut, brings the tallest to her height, as Frame's
   walk was scaled (`tools/art/press-pull-cut.py`).
2. **The stride is mostly one pose.** The legs are hidden by the skirt, and the boots barely change between frames.
   Against `tests/walk-gait.test.mjs`'s own measures:
   - the feet pass in the second half (frame 5 of the six, spread 47% of the widest) but **not in the first half**
     (frames 1-3 never come under 84%);
   - consecutive frames share **75%** of their silhouette below the hem on average, where the test's limit is 60%:
     its "one pose pumped, not a cycle".
   So the sheet as drawn fails the walk test once it is wired. The builder's choices: reorder or repeat the frames that
   differ (frame 4 is the one passing pose; 1, 2 and 5 are the widest), derive a passing frame from frame 4 for the
   first half, or record a ruling that a figure in a long skirt is measured differently. With the asset's operations
   spent, a redraw needs a new operation from Tyler.
3. **The skirt is a shade lighter** than her shipping sheet: mean RGB about (53, 53, 50) at the skirt against (45, 46,
   45) on `winnie-second-ledger.png` frame 0, and a touch warmer. A light grade in the cut (or the room's
   `figureLight`) matches it.
4. **Out of step:** no frame is reversed, but frames 1, 2 and 5 are nearly the same open stride, which is the same
   finding as 2.

Mirrored, the same sheet is the walk back, as the brief says.
