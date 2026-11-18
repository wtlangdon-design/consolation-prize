# The Reverend redrawn in every sheet: handed back

Tyler, 2026-11-18, after the mourners: **"Great. But now the priest is the one character out of place."** Asked how to fix him, he chose **"All six sheets (Recommended)"**: "Redraw every Sowerby sheet against Thad, then line them up and measure like Fanshawe. Up to 12 operations (a drawing and a correction each); raise the token ceiling by 130,000 and the operation cap by 12."

**There are five sheets, not six.** I counted the shared master twice: the funeral, the procession and the gate all use `room-31-sowerby-master.png`.

## Budget

`art/staging/caps.json`, quoting him:
- five entries, `sowerby-master`, `sowerby-praying`, `sowerby-plate`, `sowerby-duel` and `sowerby-nugget`, each with cap 2;
- `spendTokensTotal` raised 4,840,000 → 4,970,000;
- `attemptsTotal` raised 471 → 483.

**Six operations are spent, 58,267 billed tokens in all:**

| Sheet | Operations | Tokens |
|---|---|---|
| master (funeral, procession, gate) | 2 (drawing + correction) | 19,046 |
| praying (procession) | 1 | 9,796 |
| plate (gate) | 1 | 9,818 |
| duel (Main Street) | 1 | 9,804 |
| Nugget, back room | 1 | 9,803 |

The ledger is at 477 attempts and 4,881,581 tokens, about 88,000 under the cap. Four sheets still have their correction in hand.

Nothing in `content/` or `docs/` is touched. Each sheet replaces the old one at its own path, with **the same frames, cells, soles and anchors**, so no record changes and nothing needs wiring beyond merging. **Not merged; the main session ships it.**

## How

**The inputs.** Each operation was given:
- its old sheet laid out in place on magenta, enlarged (`art/staging/sowerby/<job>-template.png`);
- Boot Hill with the redrawn mourners, Fanshawe and Thad (`renders/room-14-memorial-crowd-in-the-scene.png`);
- Thad's ruler frame;
- the new duel Fanshawe at 2x, as the older gentleman to match.

It was asked for a small head, his face no wider than Fanshawe's, about seven heads tall, at the same overall height, with every pose redrawn where it was. Prompts and specs are `reference/sowerby-art/<job>-op-N.txt` and `.spec.json`.

**The cut.** All five are cut by `python3 tools/art/duel-crowd-cut.py sow-<job> [--op N] --write`, the same tool and method as Fanshawe's:
- one scale for all poses, by the old rest height;
- soles on the old sole row, centred on his torso;
- snapped to the one level, despilled, and keyed clean at the rim.

**Nothing is regraded:** every colour is the operation's own. It re-runs from `art/staging/sowerby/` to the same pixels. The before-and-after renders are `renders/sow-<job>-before-after.png` (old above, new below).

**Three things the cut does beyond Fanshawe's:**
1. **The praying sheet, each pose to its own old height.** The operation drew his open-mouthed pose 7.5% taller than the rest pose (634 px against 590). He is the same man standing the same way, and the old sheet has both poses at rows 0-313. Under one scale, 637 px of his crown were cut off at the cell's top. Each pose is now scaled uniformly to its own old height, and nothing is lost.
2. **The Nugget sheet, re-snapped on the test's grid.** `tests/one-level.test.mjs` read his rest frame as 8.7% finer than the level: the test lays its grid from the figure's first opaque column, and the cut lays it from the cell's. The cut now runs `tools/art/one-level.py --only room-04-sowerby-master.png --resnap` (crisp, centre-sampled) on that one sheet. It moved 1.2% of his pixels.
3. **The plate sheet's whole six-cell layout** is cut from one list (`FRAMES`), because each of its two `spriteWhen` records shows only part of the sheet. Its breath frames 1 and 5 are derived from 0 and 4 by `ambient-breath.py`.

## The correction: the master was too bright

Operation 1 drew him right in shape, but **brighter than Thad in the funeral's night**. `tools/check-figure-light.mjs` failed for two records:
- the funeral: 1.19x Thad, against a limit of 1.12;
- the procession: 1.16x, against the same limit.

The correction was shown him beside Thad at the graveside (`art/staging/sowerby/sow-master-side-by-side.png`) and asked for the same man in the same dim light. His mean luminance fell from 48.8 to 34.4, below the old drawing's 41.7, and the check passes.

## Measured

**Head size.** The face width per 300 px of man (`python3 tools/art/fanshawe-lineup.py --sowerby`, `renders/sowerby-lineup.png`) reads:

| | face |
|---|---|
| Thad | 26.4 |
| Fanshawe, memorial | 26.5 |
| funeral | 21.0 |
| procession | 21.0 |
| gate (holds plate) | 21.0 |
| gate (linen in) | 23.9 |
| duel | 29.2 |
| Nugget | 18.5 |

His white beard and hair are not skin, so that measure under-reads him. On a ruler at the line-up's scale, every Reverend head runs crown to beard in about 15-17 px per 300, the same as Thad's and Fanshawe's. The duel head is a shade broader and the Nugget's a shade narrower, each within a couple of pixels, so **no further correction was spent.**

**Light and texture**, rest frame at game size:

| Sheet | texture | contrast | mean light | Thad there (texture / contrast / light) |
|---|---|---|---|---|
| master (op 2) | 3.26 | 29.3 | 34.4 | 4.96 / 32.9 / 60.4 |
| praying | 4.00 | 31.1 | 43.5 | 5.64 / 32.6 / 59.8 |
| plate | 6.18 | 44.8 | 59.6 | 5.63 / 32.6 / 59.9 |
| duel | 8.68 | 32.4 | 50.1 | 10.79 / 31.5 / 60.1 |
| Nugget | 4.04 | 34.8 | 55.1 | 3.93 / 33.0 / 60.0 |

## For Tyler's eye

1. **The gate's plate sheet** is a little crisper and higher in contrast than Thad: texture 6.18 against 5.63, contrast 44.8 against 32.6. It passes the light check, and in the scene it reads as the same man. Its correction is in hand if you see it as sharp.
2. **The master is now darker than the plate and praying sheets.** At the gate the sheet changes when he holds the plate or takes the linen in, so he lightens a little at that moment. The plate sheet's correction could darken it to match.
3. **The duel sheet's pencil:** in the pose with it raised, its tip runs 44 px past the cell's top (the old pencil ran to row 0), so the tip is a few pixels shorter.

## What to look at

- **`renders/room-14-reverend-in-the-scene.png`**: Boot Hill with Thad, the Reverend, Fanshawe and the redrawn mourners. The old Reverend is above, the new below. Re-run it with `python3 tools/art/sowerby-scene.py`.
- **`renders/sowerby-lineup.png`**: every sheet's rest frame at one man, beside Thad and Fanshawe.
- **`renders/sow-*-before-after.png`**: each sheet in its own room, every pose, before above and after below.

## Checks

- All 67 checks pass.
- All 2,096 tests pass.
