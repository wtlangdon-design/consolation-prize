# The undertaker, redrawn to Thad's proportions: handed back (errata 380)

Tyler, 2026-11-19: **"It looks like the guy on the far right still has a big head?"** Asked whether to redraw both of the undertaker's drawings with the operation cap raised by 2, he answered **"1"** (to "Both drawings, with the operation cap raised by 2").

This answers `brief.md` beside it. **Nothing is wired;** the main session wires it.

## Budget

`art/staging/caps.json`, quoting him:
- `attemptsTotal` raised 483 → 485;
- `undertaker-hill` and `undertaker-shop`, each with cap 2;
- the token ceiling **not** raised.

**Three operations are spent, 30,636 billed tokens:**

| Sheet | Operations | Tokens |
|---|---|---|
| hill (`room-31-undertaker-master.png`) | 1 (no correction needed) | 11,769 |
| shop (`room-13-undertaker-master.png`) | 2 (drawing + correction for light) | 18,867 |

The ledger is at 484 attempts against 485, and 4,952,066 tokens against 4,970,000, about 18,000 left. The hill still has its correction in hand.

## Nothing to change in `content/`

Both sheets replace the old ones at their own paths, with **the same frames, cells, anchors and records**:
- hill: 5 × `[2+131i, 2, 129, 400]`, `figureHeight` 400;
- shop: 5 × `[2+168i, 2, 166, 192]`, his `y` 509.

The shop's waist is re-matted along the bench's slanted back edge (`waist-matte.py`, the guide `cast-softer.py` used). It returns his place as y 509, his record's own.

**Merging is the wiring.** Run `tools/art/one-level.py --dry --only room-13-undertaker-master room-31-undertaker-master`: it reads blocks 4.02 and 3.48, the levels the sheets are cut at.

## How

**`tools/art/duel-crowd-cut.py`** now has `ut-hill` and `ut-shop` beside the Reverend's jobs:
- `--prep` writes each job's template, layout and old sheet, so the inputs re-run;
- `--write` cuts, then mattes the shop and re-snaps each sheet with `one-level.py --resnap --only <sheet>`, as the brief says.

**Re-running.** To reproduce the sheets: `python3 tools/art/duel-crowd-cut.py ut-hill --write` and `python3 tools/art/duel-crowd-cut.py ut-shop --op 2 --write`.

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
| hill, new | 4.40 | 34.0 | 43.8 | 5.14 / 32.9 / 60.2 |
| hill, old | 3.11 | 32.5 | 36.0 | |
| shop, new (op 2) | 7.14 | 46.9 | 117.8 | 5.70 / 32.6 / 60.3 |
| shop, old | 6.58 | 49.9 | 124.4 | |

- The hill sheet is a little lighter than before (43.8 against 36.0), still well under Thad's 60 in the same light. `tools/check-figure-light.mjs` passes for both.
- The shop's raw light is the lamp's, as before; it is now under the old drawing's.

## What to look at

- **`renders/ut-hill-before-after.png`**: at the graveside beside Thad, every pose, old above and new below.
- **`renders/room-14-undertaker-at-the-gate.png`**: at the gate with the hearse, the Reverend and Thad, old above and new below. Re-run it with `python3 tools/art/undertaker-gate.py`.
- **`renders/ut-shop-before-after.png`**: in his shop with Thad at the talk stand, every pose, old above and new below.

## For Tyler's eye

- On the hill he is drawn leaner than before, with narrower shoulders under the smaller head.
- His hill sheet is a touch lighter than it was, still darker than Thad.

## Checks

- All 67 checks pass.
- All 2,092 tests pass.
