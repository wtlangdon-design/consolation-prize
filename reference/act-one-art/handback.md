# Act I's four figures: handed back (reference/act-one-art/brief.md)

**The brief was not on main.** It is on the branch `act-one-art-brief` (b3e96229). I read it there and copied it here beside this hand-back.

**Budget, on Tyler's instruction (2026-11-16).** `art/staging/caps.json` has four new entries, each with cap 2 and quoting him:
- `act1-street-horses`;
- `act1-lobby-clerk`;
- `act1-map-seller`;
- `act1-bar-man`.

`spendTokensTotal` is raised 4,475,000 → 4,625,000.

**Six operations are spent**, 80,553 billed tokens in all:

| Job | Operations | Tokens |
|---|---|---|
| horses | 1 (no correction needed) | 14,103 |
| clerk | 1 (no correction needed) | 12,929 |
| map seller | 2 (drawing + correction) | 27,074 |
| bar man | 2 (drawing + correction) | 26,447 |

The ledger is at 444 attempts and 4,524,520 tokens, about 100,000 under the new cap. The horses and the clerk each still have their correction in hand.

Nothing in `content/` or `docs/` is touched. Each sheet replaces the old one at its own path, with the same frames, cells and anchor. **Not merged; the main session wires and ships it.**

## How

All four jobs are cut by **`tools/art/act1-figures-cut.py JOB [--op N] [--write]`**, where JOB is `horses`, `clerk`, `mapseller` or `barman1`. Each job reads its old sheet from `art/staging/act-one-art/<job>/old-sheet.png`, so it re-runs to the same pixels.

**Nothing is regraded.** The tool registers each frame, keys it, places it and snaps it to the one level; every colour is the operation's own.

**One thing about the snap.** The tool uses `one-level.py`'s **crisp mode**: it samples each block's centre, as `--resnap` does (errata 235). Averaging a block of a non-whole size, such as 1.39 px, smeared the map seller's eyes into a dark band, as it once did the panner's.

**The inputs.** Each operation was given:
- the old sheet laid out in place, enlarged where the figure is small, so it redrew each frame where it was;
- the figure's room at game size with Thad in it;
- Thad's ruler frame (`art/staging/act-one-art/thad-ruler.png`);
- the barman at 2x as the style. For the clerk it was the storekeeper; for the bar man, the drinker `nugget_bar2`.

Prompts and specs are `reference/act-one-art/<job>-op-N.txt` and `.spec.json`. The before-and-after renders are `renders/act-one-art-*-before-after.png`.

## 1. The horses (`act1-street-horses`): `art/actors/room-02-horses.png`

**Drawn.** The same three horses, rail, hay and four poses, each frame redrawn in place:
- flat, chunky and soft-shaded, without the shiny coats and fine tack;
- a little dimmer, with the white markings a dim cream.

**Kept.** All four frames `[2+704i, 2, 702, 413]`, the anchor (1470, 746), `footRow` 396 and `figureHeight` 376:
- The operation drew the group about 5% taller, with the black's ears at row 3 instead of row 21.
- One factor for all four frames (0.952), about the hooves, puts the black's ears back on row 20 and his hooves on row 396.
- So `tests/scale.test.ts` holds (214/214 with the scale tests).
- **Cost:** the rail is about 5% shorter, so its left post sits about 10 game px further right than before.

**Measured**, rest frame at game size (×0.548):

| | texture | contrast | mean light | lit (Main Street's grade) |
|---|---|---|---|---|
| horses, after | 8.61 | 41.1 | 66.3 | 50.5 |
| horses, before | 8.43 | 43.6 | 71.8 | 54.6 |
| Thad, at this man | 9.25 | 31.8 | 60.4 | |
| barman | 7.07 | 37.7 | 86.1 | |

`tools/check-figure-light.mjs` passes. Beside Thad in the street they are not sharper or brighter than him, so **no correction was used.**

**One test now fails, for the main session to decide:** `tests/figure-light.test.mjs`, "errata 198's horses before the grade are brighter than their night".
- It asserts that the *ungraded* horses measure more than 1.12 of Thad. That was the reason Main Street's `figureLight` grades them.
- The redraw is drawn as dim as the brief asks, so ungraded they measure **1.09**.
- The test beside it, "the horses as errata 198 graded them are in the same night as Thad", passes.
- **The decision:** keep the grade and retire or adjust this test (through the check-friction record), or take the horses out of `figureLight`. That is a `content/` change, which this brief does not allow me. I loosened nothing.

## 2. The lobby clerk (`act1-lobby-clerk`): `art/actors/room-10-clerk.png`

**Drawn.** The same fair-haired clerk, in the grey waistcoat, cream shirt sleeves and black tie:
- **in pixels half the old size**, so his face is a face, not four blocks;
- in the lobby's warm light, the shirt cream rather than white.

Each frame:
- **Frame 0:** both hands on the bare desk, nothing on it his.
- **Frame 1:** the breath, derived from frame 0 by `tools/rig/ambient-breath.py`, as his `frameNote` says.
- **Frame 2:** the pen, and only in this frame.
- **Frame 3:** the watch, and only in this frame.
- **Frame 4:** looking up.

**Kept.** All five frames `[2+135i, 2, 133, 137]`, the anchor (1435, 387) and `waistOn` 377:
- The operation drew his hands level with his waist, so one shift of 6 rows lands the rest frame's waist on row 125 (y 377 within a pixel).
- His hands rest along the desk's back edge rather than a few pixels onto its top.
- `tests/counter-surface.test.mjs` passes (18/18).

**Measured**, rest frame at game size (1:1; the man there is 220.7):

| | texture | contrast | mean light |
|---|---|---|---|
| clerk, after | 8.71 | 53.4 | 112.8 |
| clerk, before | 6.19 | 57.5 | 103.1 |
| Thad, at this man | 7.38 | 32.5 | 59.4 |
| storekeeper | 5.76 | 48.5 | 86.4 |

Texture rises because the brief asked for finer pixels. In the lobby (`renders/act-one-art-lobby-clerk-before-after.png`, before above) he reads as the room's own man, no longer the pale coarse figure. **No correction was used.**

**One test now fails, and the main session has to decide it:** `tests/one-level.test.mjs` (and `one-level.py --dry --only room-10-clerk` says block 3.83).
- **The cause:** his record is a 1:1 sheet with no `figureHeight` or `levelMan`. So the level takes "the room's man at his feet" from the nearest floor box, which at the desk's y clamps to the far floor's **440**.
- So the test demands blocks of 3.83 px, the coarse 4 px grid the brief asks to remove. The man where he actually stands is about 221 (block 1.92), and that is what he is cut at.
- **Tried, and not committed:** with `sprite.levelMan: 221` in `content/ambient/lobby-clerk.json`, all five frames pass the level. But the breath frame's one-pixel lift then reads 9.8% finer than the level.
  - Worse, the test "a sheet drawn at a new height without a new snap stays within 5% of the level" fails, because it holds `levelMan` to 5% of that same 440.
  - Re-snapping the breath frame fixes the first only by jittering 66% of his pixels between breaths, so I did not keep it.
- **The decision:** how a desk figure's level man is declared (a field the 5% test understands, or the test taught that a behind-counter figure's man is not the floor's). Whoever wires it **must not run `one-level.py --only room-10-clerk` without `--dry` until then**: it would snap him back to 4 px blocks.

## 3. The map seller (`act1-map-seller`): `art/actors/ambient-map-seller-master.png`

**Drawn.** The same man: hat, tan jacket, red neckerchief, satchel strap and satchel, the map in his hand in every frame, and **the pencil behind his ear in all seven frames**. All of it is drawn at Thad's clarity:
- crisp edges;
- a grown man's breadth (his rest frame is 58 px wide, was 51).

In frames 5 and 6 he draws on the map with a pencil in his hand while the ear pencil stays, as the old sheet had it.

**Correction used (operation 2).** At game size, operation 1's face still read as a dark band under the hat brim. He was shown that beside Thad in the street (`art/staging/act-one-art/mapseller/side-by-side.png`). The correction tipped the hat back and lit the face: now eyes, nose and mouth read at game size. Nothing else changed.

**Kept.** All seven frames in the same order and cells (60 x 160), the anchor (3185, 668), crown row 0 and sole row 159:
- One factor for all seven frames makes the rest frame exactly as tall as the old one.
- Each frame is placed with its soles on the old sole row and its torso where the old torso was.
- Frame 1 is the breath, derived by `ambient-breath.py`.
- The snap is at his `levelMan` 160 (block 1.39), as the one-level test reads him. That test passes for him.

**Could not be kept whole:** the broader man spills past his 60 px cell in a few frames. The pixels lost at the cell edge, per frame, are 3, 3, 65, 36, 62, 0 and 0. Frame 2 is his offered map, whose tip is trimmed; frames 3 and 4 lose the map's edge. Widening the cells would change the record's frame rects, which is `content/`.

**Measured**, rest frame at game size:

| | texture | contrast | mean light |
|---|---|---|---|
| map seller, after | 10.45 | 41.1 | 124.0 |
| map seller, before | 10.06 | 36.3 | 117.5 |
| Thad, at this man | 10.40 | 31.7 | 59.7 |
| barman | 7.07 | 37.7 | 86.1 |

His raw light is the lantern's, as before. Main Street's per-figure grade (0.72) brings him into the night, as it did the old drawing. A magenta pocket left inside one frame was cleaned (despill only, not a grade), and `tests/master-cut-edges.test.mjs` passes. `tools/check-figure-light.mjs` passes.

## 4. The first man at the Nugget's bar (`act1-bar-man`): `art/actors/nugget-bar1.png`

**How it was drawn.** His sprite is a band laid over a drinker already painted into the plate, with a strip of counter where his arm lay. So this was **a masked edit of the room itself**: both frames, each in its own crop of the plate, with only his sprite's area (plus 2 px) open to repaint.

Each frame's pixels are taken back **inside his old outline exactly**, so the painted figure under him never shows: `outlineUnchanged: true`. He is the same man from behind on the same stool, in a dark coat, with no glass of his own.

**Correction used (operation 2).** Operation 1 drew him crisp but lost frame 1's action: it gave back the rest pose again, with no head turn. The correction was shown the old frame beside its redraw, and turned his head into profile again. It also redrew frame 0 with the same narrower-brimmed hat, so the **hat is a little different from the old drawing but the same in both frames.** The two frames differ on 8.4% of his pixels.

**Kept.** Both frames `[2,2,172,245]` and `[176,2,172,245]`, the anchor (1212, 601), and the outline to the pixel. The snap is at block 2.51 (`one-level.py --dry`).

**Measured**, frame 0, 1:1:

| | texture | contrast | mean light |
|---|---|---|---|
| bar man, after | 2.42 | 20.6 | 35.5 |
| bar man, before | 2.14 | 21.4 | 37.4 |
| `nugget_bar2` | 3.29 | 24.5 | 46.5 |
| Thad, at this man | 5.78 | 32.6 | 60.1 |

He now has the edges of the men beside him, not the blur (`renders/act-one-art-bar-man-before-after.png`, before above). The plate's own stool and legs below his band are still the plate's softer painting; the brief did not ask for those, and changing them is a plate job.

**Thad's standing place: done in part.**
- His elbow is drawn in, with his forearm on the bar in front of him, and the counter is painted where his arm lay. That frees about 10-15 px of counter at his end.
- **It does not clear (1484, 760).** That spot is the blue-shirted drinker's (`nugget_bar2`, x 1413, his band spanning x 1298-1528). In the render Thad still stands against that man's back.
- A clear place there needs `nugget_bar2` moved or redrawn, or Thad's stand moved. Both are outside this job.

## For Tyler's eye

1. **The horses' rail** is about 5% shorter, so the black stays at his ruled height.
2. **The clerk's hands** rest along the desk's back edge. The level question above is the main session's.
3. **The map seller's trimmed map tip** when he offers it (frame 2).
4. **The bar man's hat** is a slightly different shape from before. It is the same in both frames.
5. **Two tests fail on this branch**: the horses' "brighter before the grade" and the clerk's one level. Both are explained above and need a ruling, not a looser check.

## Checks

- All 67 checks pass.
- 1,978 of 1,980 tests pass; the two failures are explained above.
- `tools/check-figure-light.mjs` passes.
- `one-level.py --dry` gives: horses 2.62, clerk 3.83 (see above), map seller 1.33, bar man 2.51.
