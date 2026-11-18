# The Reverend redrawn in every sheet: handed back

Tyler, 2026-11-18, after the mourners: **"Great. But now the priest is the one character out of place."** Asked how to fix him, he chose **"All six sheets (Recommended)"**: "Redraw every Sowerby sheet against Thad, then line them up and measure like Fanshawe. Up to 12 operations (a drawing and a correction each); raise the token ceiling by 130,000 and the operation cap by 12."

**There are five sheets, not six.** I counted the shared master twice: the funeral, the procession and the gate all use `room-31-sowerby-master.png`.

## Budget

`art/staging/caps.json`, quoting him:
- five entries, `sowerby-master`, `sowerby-praying`, `sowerby-plate`, `sowerby-duel` and `sowerby-nugget`, each with cap 2;
- `spendTokensTotal` raised 4,840,000 → 4,970,000;
- `attemptsTotal` raised 471 → 483.

**Eight operations are spent, 77,495 billed tokens in all:**

| Sheet | Operations | Tokens |
|---|---|---|
| master (funeral, procession, gate) | 2 (drawing + correction) | 19,046 |
| praying (procession) | 1 | 9,796 |
| plate (gate) | 1 | 9,818 |
| duel (Main Street) | 2 (drawing + correction) | 18,856 |
| Nugget, back room | 2 (drawing + correction, **not used**) | 19,979 |

The ledger is at 479 attempts and 4,900,809 tokens, about 69,000 under the cap. The praying and plate sheets still have their correction in hand; the other three have none left.

Nothing in `content/` or `docs/` is touched. **Not merged; the main session ships it.**

**Three sheets replace the old ones with the same frames, cells, soles and anchors:** master, praying and plate. **Two need their records' frame rects changed in the same merge** (below): the duel and the Nugget sheets are taller at the top. Merged without that change, the game reads the taller sheets with the old cells and draws them wrong.

## The wiring: two records' frames

| Record | `sprite.frames` now | `sprite.frames` to set |
|---|---|---|
| `content/ambient/duel-sowerby.json` | `[2 + 196i, 2, 194, 400]`, i = 0-4 | **`[2 + 196i, 2, 194, 424]`** |
| `content/ambient/sowerby.json` | `[2 + 224i, 2, 222, 437]`, i = 0-4 | **`[2 + 224i, 2, 222, 493]`** |

Nothing else changes:
- `figureHeight` (380 and 437) and the anchors stay.
- The cells grow **upward only**: 24 and 56 rows of headroom above the old top, with the soles on the same bottom row. The engine draws an ambient at `figureHeight` and stands the frame on its bottom row, so he is the same size in the same place.
- The headroom holds his raised pencil hand. Without it, the top of the cell cut off the hand and the pencil in the raised pose, and the pencil would vanish in that one frame (errata 111).

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
| duel | 26.1 |
| Nugget | 26.1 |

His white beard and hair are not skin, so that measure under-reads the funeral, procession and gate sheets (21-24). On a ruler at the line-up's scale, those heads run crown to beard in about 15-17 px per 300, the same as Thad's and Fanshawe's. **The first hand-back said the same of the Nugget sheet at 18.5, and that was wrong** (below).

**Light and texture**, rest frame at game size:

| Sheet | texture | contrast | mean light | Thad there (texture / contrast / light) |
|---|---|---|---|---|
| master (op 2) | 3.26 | 29.3 | 34.4 | 4.96 / 32.9 / 60.4 |
| praying | 4.00 | 31.1 | 43.5 | 5.64 / 32.6 / 59.8 |
| plate | 6.18 | 44.8 | 59.6 | 5.63 / 32.6 / 59.9 |
| duel (op 2) | 8.81 | 35.2 | 54.3 | 10.79 / 31.5 / 60.1 |
| Nugget (from the duel's op 2) | 3.18 | 33.8 | 49.6 | 3.93 / 33.0 / 60.0 |

## For Tyler's eye

1. **The pencil** (duel and Nugget) is bold and bright yellow, nearer a crayon than a pencil, so that it survives at game size. Neither sheet has an operation left to thin it.
2. **The gate's plate sheet** is a little crisper and higher in contrast than Thad: texture 6.18 against 5.63, contrast 44.8 against 32.6. It passes the light check, and in the scene it reads as the same man. Its correction is in hand if you see it as sharp.
3. **The master is now darker than the plate and praying sheets.** At the gate the sheet changes when he holds the plate or takes the linen in, so he lightens a little at that moment. The plate sheet's correction could darken it to match.

## The Nugget's head, and the pencil (after Tyler's first look)

Tyler, 2026-11-18: **"The Nugget back image of the reverend has a comically small head."** He was right.

**The line-up flagged it and I overrode it.** It measured the Nugget face at 18.5 against Thad's 26.4. I read that as the beard fooling the measure, and checked the head in the line-up's strip rather than beside Thad in his own room. In the room it was plainly half-size.

**Lesson, for doc 55 §8** (the main session's; `docs/` is not this branch's): when the line-up flags a head, look at that sheet beside Thad in its own room before overriding the number.

**What was done:**
1. **The Nugget correction missed.** Operation 2 (`sow-nugget-op-2.txt`) was shown him beside Thad and asked for a head Thad's size. It drew the whole man bigger, so cut to his height the head was as small as before. That sheet's cap is spent.
2. **The Nugget sheet is cut from the duel's drawing instead.** The duel sheet is the same Reverend in the same four pencil poses (raised, at the chest, leaning, raised high), and its head measured right. `FROM` in the cut tool takes the duel's drawing and fits it to the Nugget sheet's cells, height and anchor. Its face now reads 26.1 against Thad's 26.4.
3. **That showed the pencil was lost.** In the duel drawing the pencil is a hairline, and at game size the snap left a floating speck in poses 0 and 1. That would break errata 111 in both the duel and the Nugget sheets, and **it was in the first push of the duel sheet**: I missed it there.
4. **The duel correction** (`sow-duel-op-2.txt`) was shown the frames as the game draws them. It redrew only the pencil, bold, and now it is in every frame of both sheets.
5. **Headroom.** The bold pencil, raised, stands above his crown. Hence the taller cells above. The cut also scales both sheets by **crown to sole**, read over the torso's columns, not to the pencil tip. Measured to the tip, he came out 1.8% short. Now the sheets measure 378 against 380 and 435 against 437, within a block.
6. **The Nugget sheet is re-snapped by `one-level.py`'s own `snap`**, crisp (`--resnap` mode), so the one-level test reads it on its own grid. The cut does this itself (`OL_RESNAP`).

**The line-up tool's face finder misread the raised hand too.** It took the topmost skin blob, the pencil hand, as the face (10.3). It now takes only a blob centred over the torso. Fanshawe's line-up numbers are unchanged by this: 28.1, 34.4, 33.8, 26.5, 29.1.

## One test for the main session to decide: `duel_sowerby faces front`

With the new frames wired, all 67 checks pass and 2,095 of 2,096 tests pass. The one failure is `tests/faces.test.mjs`, "duel_sowerby faces front": it reads **-7.8** against its limit of ±3.

- **It is the raised hand, not his face.** The test reads the top 16% of the figure, and with the bold pencil the top of the figure is the pencil tip. So his raised hand falls in the band and pulls the skin centroid left.
- **Measured over the head alone** (columns right of the hand), he reads **-1.5** (the Nugget sheet **-1.3**): to the front.
- The committed operation 1 sheet read 0.8, its thin pencil keeping the hand out of the band.

**I changed nothing in the test.** Either teach `facing()` to start its band at the crown over the torso (as the cut and the line-up now do), or Tyler rules it (`facesRuledBy`). Neither is a looser threshold.

**As pushed, with the old records,** four tests fail:
- that one;
- `tests/one-level.test.mjs`;
- the two "drawn 0.97-1.03 of Thad" height tests for these two records.

The last three are the taller sheets read with the old cells, and they pass once the frames above are set.

## What to look at

- **`renders/room-14-reverend-in-the-scene.png`**: Boot Hill with Thad, the Reverend, Fanshawe and the redrawn mourners. The old Reverend is above, the new below. Re-run it with `python3 tools/art/sowerby-scene.py`.
- **`renders/sowerby-lineup.png`**: every sheet's rest frame at one man, beside Thad and Fanshawe.
- **`renders/sow-*-before-after.png`**: each sheet in its own room, every pose, before above and after below.

## Checks

- **With the two records' frames set as above:** all 67 checks pass, and 2,095 of 2,096 tests pass. The failure is the faces misread above.
- **As pushed, with the old records:** all 67 checks pass, and 2,092 of 2,096 tests pass. The four failures are listed above.
