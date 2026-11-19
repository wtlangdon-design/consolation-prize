# The undertaker, redrawn to Thad's proportions: handed back (errata 380)

Tyler, 2026-11-19: **"It looks like the guy on the far right still has a big head?"** Asked whether to redraw both of the undertaker's drawings with the operation cap raised by 2, he answered **"1"** (to "Both drawings, with the operation cap raised by 2").

This answers `brief.md` beside it. **Nothing is wired;** the main session wires it.

## Budget

`art/staging/caps.json`, quoting him:
- **`attemptsTotal`:** 483 → 485, as asked, then 485 → **486**. Asked whether to spend one more operation, darker, he chose "1 more op, darker (Recommended)".
- **`spendTokensTotal`:** 4,970,000 → **4,985,000**. Asked whether to raise it for the hill's prepared correction, he chose "Raise by 15,000 (Recommended)".
- **`undertaker-hill`:** cap 2, raised to **3** on the "1 more op, darker" answer.
- **`undertaker-shop`:** cap 2.

**Five operations are spent, 48,458 billed tokens:**

| Sheet | Operations | Tokens |
|---|---|---|
| hill (`room-31-undertaker-master.png`) | 3: drawing (**ships**); correction, his face lit evenly; correction, darker (both not used) | 29,591 |
| shop (`room-13-undertaker-master.png`) | 2: drawing; correction for light | 18,867 |

The ledger is at 486 attempts against 486, and 4,969,888 tokens against 4,985,000, about 15,000 left. **Neither sheet has an operation left.**

## Nothing to change in `content/`

Both sheets replace the old ones at their own paths, with **the same frames, cells, anchors and records**:
- hill: 5 × `[2+131i, 2, 129, 400]`, `figureHeight` 400;
- shop: 5 × `[2+168i, 2, 166, 192]`, his `y` 509.

The shop's waist is re-matted along the bench's slanted back edge (`waist-matte.py`, the guide `cast-softer.py` used). It returns his place as y 509, his record's own.

**Merging is the wiring.** Run `tools/art/one-level.py --dry --only room-13-undertaker-master room-31-undertaker-master`: it reads blocks 4.02 and 3.48, the levels the sheets are cut at.

## How

**`tools/art/duel-crowd-cut.py`** now has `ut-hill` and `ut-shop` beside the Reverend's jobs:
- `--prep` writes each job's template, layout and old sheet, so the inputs re-run;
- `--write` cuts without snapping, then mattes the shop and snaps each sheet once with `one-level.py --resnap --only <sheet>`, as the brief says.

**Re-running.** To reproduce the sheets: `python3 tools/art/duel-crowd-cut.py ut-hill --op 1 --write` and `python3 tools/art/duel-crowd-cut.py ut-shop --op 2 --write`.

**Nothing is regraded:** every colour is the operations' own.

**The template.** The four drawn poses (0, 2, 3, 4) are enlarged in one row on magenta:
- the hill at 1.7x;
- the shop at 2x.

**What each operation was given:**
1. the template;
2. the brief's scene images: for the hill, `graveside-as-it-is.png` and `gate-as-it-is.png`; for the shop, `shop-as-it-is.png`;
3. Thad's ruler;
4. the new duel Fanshawe at 2x.

The brief's two `…sheet-as-it-is@2x.png` are the same drawings the templates are built from, so they were not attached again. The previous redraw copied reference images onto its output, and fewer copies makes that less likely.

Prompts and specs are `reference/undertaker-heads/ut-<hill|shop>-op-N.txt` and `.spec.json`.

**Three adjustments in the cut, each recorded in the tool:**
1. **The hill: each pose scaled to its own old height**, as the Reverend's praying sheet was. The drawing made his looking-up pose (4) a little taller than his rest. The old sheet has both at rows 0-399, and one scale cut 15 px of his hair at the cell's top.
2. **The shop keeps its old 166 px cells.** The torso-centred reach estimate widened them to 202, but no pixel of any frame falls outside 166. Keeping them keeps his record.
3. **The level** of each sheet is read from `one-level.py --dry`, so the cut snaps where the test measures. For the shop that is the floor's man in front of the bench, block 4.02.

## The shop's correction

Operation 1 met the brief on head size, and was registered cleanly: outline overlap with the old frames about 0.90, nothing lost at any edge. But it was **brighter than the old drawing**: mean light 134 against 124, where the brief says "no brighter than now".

The correction (`ut-shop-op-2.txt`) was shown both in the shop beside Thad, old above and new below (`art/staging/undertaker-heads/ut-shop-side-by-side.png`). It was asked for the same man with the same small head, only darker. It kept everything else, and now measures 118.

## Measured

**Head size.** Head width over the torso, per 300 px of man, by one measure for all:

| | head |
|---|---|
| Thad | 28.8 |
| the Reverend (funeral) | 29.1 |
| Fanshawe (memorial, duel) | 29.6, 27.3 |
| **undertaker, hill: new** | **26.2** (old 41.6) |

He is drawn lean, so his head sits at the narrow end of the cast.

**The shop** is a waist-up figure, so that measure does not compare. By proportion:
- the new head is about 3.2 heads from crown to the bench cut (old 2.6), which is a man of about seven heads;
- head to shoulders is about 0.38 (old 0.45; Thad 0.32).

**Light and texture**, rest frame at game size:

| | texture | contrast | mean light | Thad there (texture / contrast / light) |
|---|---|---|---|---|
| hill, shipped (op 1) | 4.40 | 34.0 | 44.4 | 5.14 / 32.9 / 60.2 |
| hill, old | 3.11 | 32.5 | 36.0 | |
| shop, new (op 2) | 7.14 | 46.9 | 117.8 | 5.70 / 32.6 / 60.3 |
| shop, old | 6.58 | 49.9 | 124.4 | |

- The hill sheet is a little lighter than before (44.4 against 36.0), well under Thad's 60.2. `tools/check-figure-light.mjs` passes for both.
- The shop's raw light is the lamp's, as before; it is now under the old drawing's.

## After Tyler's first look: his face (2026-11-19)

Tyler: **"Looks like he's missing part of his face"** (the shop, the thumb-on-blade frame), then **"Here too"** (the graveside).

### The shop: the cut snapped him twice. Fixed, with no operation.

**The cause.** The cut snapped each cell to the level on the cell's own grid. Then `one-level.py --resnap` snapped the sheet again, on a grid fitted to the figure's box. The two grids lay a fraction of a block apart, so the second, centre-sampled snap dropped whole columns. In frame 3 that took a strip of his face.

**The fix.** The undertaker's cells now leave the cut unsnapped. The shop is matted, and `one-level.py --resnap --only` snaps each sheet **once**. Frame 3's face is whole again. Frames, cells, matte (y 509) and level (4.02) are unchanged.

**Lesson, for doc 55 §8** (the main session's; `docs/` is not this branch's): a sheet is snapped to the level once. A cut that snaps and then hands the sheet to `one-level.py` drops columns where the two grids disagree.

**Not checked here:** the Reverend's Nugget sheet was cut the same way (`OL_RESNAP`, already merged). It may have lost columns too.

### The hill: two corrections, then Tyler chose the first drawing

The snap fix barely changed the hill sheet, so it was not the cause there.

**The cause.** At the graveside he stands behind the coffin, so the game draws him smaller than the Reverend; his new small head is about 7 game pixels wide. Operation 1 shades his face dark down one side.

**Operation 2** (`ut-hill-op-2.txt`) lit his face evenly with both eyes clear.
- It first needed the token ceiling raised (above): `char-op.mjs` refused it with 17,934 tokens left, under its 20,000 floor.
- It then measured 1.16x Thad's night, against a limit of 1.12.
- **A room grade was tried, temporarily, and reverted.** Adding him to each room's `figureLight` cleared the light check but failed `tests/skin-tone.test.mjs`: the grade greyed his face.

**Operation 3** (`ut-hill-op-3.txt`) drew the same faces darker. It passed every check.

**Tyler's choice: operation 1.** Shown the gate with operation 1 above and the operations 2-3 sheet below, he said: **"The top rendering in this pic is soooo much better than the bottom rendering. Can we use the top rendering everywhere? ... I'm still not super impressed with the bottom rendering."**

So the hill sheet ships **operation 1 alone**, cut with the single snap: `duel-crowd-cut.py ut-hill --op 1 --write`.
- It is identical, pixel for pixel, to the sheet the render showed (commit 401e591c).
- It passes every check: mean light 44.4, against 36.0 before and Thad's 60.2.
- **Operations 2 and 3 are spent and not used.** Their drawings and the cut path that combined them (`--op 3`, `POSE_FROM_OP`) stay in staging and in the tool for the record.
- The graveside and the gate share this one sheet, so both are now the drawing Tyler chose.

**The shop is a separate drawing,** waist-up in shirt and apron, warmer than the hill. Redrawing it on the hill's model is a new operation, and neither the shop's cap, the operation cap nor the token floor has one left. That is Tyler's to decide.

## What to look at

- **`renders/ut-hill-before-after.png`**: at the graveside beside Thad, every pose, old above and new below.
- **`renders/room-14-undertaker-at-the-gate.png`**: at the gate with the hearse, the Reverend and Thad, old above and new below. Re-run it with `python3 tools/art/undertaker-gate.py`.
- **`renders/ut-shop-before-after.png`**: in his shop with Thad at the talk stand, every pose, old above and new below.

## For Tyler's eye

- On the hill he is drawn leaner than before, with narrower shoulders under the smaller head.

## Checks

- All 67 checks pass.
- All 2,092 tests pass.
