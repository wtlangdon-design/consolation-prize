# The duel crowd, and Rooms 33 and 34: handed back (reference/duel-and-caves-art/brief.md)

## Part A: drawn in another session, at the same time

Part A (the duel crowd and Fanshawe in the street) was not asked for in Part B's session. It was drawn in another session at the same time, and its hand-back is below, after Part B.

## Part B: Rooms 33 and 34, under Prosperity

### Spent

On Tyler's instruction (2026-11-17), `art/staging/caps.json` has these changes, each quoting him:
- four new entries, each with cap 2: `room-33-redraw`, `room-33-after`, `room-34-redraw` and `room-34-after`;
- `spendTokensTotal` raised by 100,000, from 4,625,000 to 4,725,000;
- `attemptsTotal` raised by the eight operations he authorized, from 451 to 459.

**Five of the eight operations are spent**, 41,556 billed tokens:

| Item | Asset | Attempt | Tokens |
|---|---|---|---|
| 1 | room-33-redraw | 1 | 4,477 |
| 1, at high quality | room-33-redraw | 2 | 9,676 |
| 2 | room-33-after | 1 | 8,816 |
| 3 | room-34-redraw | 1 | 9,742 |
| 4 | room-34-after | 1 | 8,845 |

- **Ledger:** 454 attempts and 4,622,994 tokens against `spendTokensTotal` 4,725,000, so about 102,000 is left.
- **Corrections in hand:** items 2, 3 and 4 each still have their second operation; item 1 has none left.
- **Nothing wired:** nothing in `content/`, `docs/` or `art/backgrounds/` is touched. The main session wires it.

Prompts and specs are `reference/duel-and-caves-art/<item>-op-<n>.txt` and `.spec.json`. Each redraw was given:
- the current plate in the generator's frame (`art/staging/duel-and-caves-art/<room>/current-plate.png`);
- Prosperity above (`prosperity-above.png`) for the pixel size;
- the hotel table lamp from Thad's room, enlarged (`hotel-table-lamp.png`).

Each after-plate was given its new plate and the current after-plate, and asked for the old plate's differences only.

### Item 1's correction, and a tool change

- **The miss.** Attempt 1 kept the composition and drew the hotel lamp, but its pixel was no finer than the old plate's, and the floor was still mottled.
- **The cause.** The API had chosen **low** quality on its own: 343 output tokens. The last six operations in the ledger before this brief came back at 343 or 158 as well.
- **The tool change.** `tools/art/char-op.mjs` now takes an optional `quality` in the spec, and records it in the ledger's `parameters`.
- **The fix.** Attempt 2 and every operation after it ran at `"quality": "high"` (5,488 output tokens, about 9,000 billed each). That is what gave the finer grid.
- **For later briefs.** Set `"quality": "high"` from the start for any whole plate. At the API's own choice, an operation can come back coarse.

### The four plates

`node tools/art/duel-and-caves-plates.mjs` derives each from its source by the standard fixed-room derivation (errata 63: crop x 8-1528, y 170-854, to 1920 x 864). Each is written beside its source, not over the shipping plate:

| Shipping path (untouched) | Candidate |
|---|---|
| `art/backgrounds/room-33-listening-chamber.png` | `art/staging/duel-and-caves-art/room-33/room-33-listening-chamber-1920x864.png` |
| `art/backgrounds/room-33-listening-chamber-after.png` | `art/staging/duel-and-caves-art/room-33/room-33-listening-chamber-after-1920x864.png` |
| `art/backgrounds/room-34-under-prosperity.png` | `art/staging/duel-and-caves-art/room-34/room-34-under-prosperity-1920x864.png` |
| `art/backgrounds/room-34-under-prosperity-after.png` | `art/staging/duel-and-caves-art/room-34/room-34-under-prosperity-after-1920x864.png` |

To wire one, the main session copies it over its shipping path.

**Before and after:** `renders/room-33-34-redraw-before-after.png`. Each row shows the old plate on the left and the new one on the right: 33, 33 after, 34, 34 after.

1. **Room 33, the listening chamber.**
   - The same chamber of rounded stones, tunnel mouth at the left, the lamp on the floor at about the middle (it moved about 20 px up).
   - The pixel is about half the old size. There is no checker dither, and the floor is smooth earth.
   - The lamp is the hotel's glass-chimney table lamp, lit.
2. **Room 33 after.**
   - An edit of the new 33, with the opening broken through right of centre in the old after-plate's place and a little rubble below it. The opening is a touch larger than the old one.
   - 1.3% of the picture differs from the new 33; everything else matches.
3. **Room 34, under Prosperity.**
   - Everything is where it was: the shaft and rope at the left, the stump with the lamp and the tuning fork, the timber frame (two posts, cap beam, braces), the back wall, and the rock face and tunnel at the right.
   - The finer pixel, no checker dither, and the hotel lamp on the stump.
4. **Room 34 after.**
   - An edit of the new 34: the gold seam runs diagonally across the right rock face, and the old barn lantern hangs on the left post, both in the old after-plate's places.
   - 1.4% of the picture differs from the new 34.

**Click areas:** `renders/room-34-redraw-after-with-hotspots.png` draws Room 34's hotspot rectangles on the new after-plate.
- Each object is still inside its area: lamp, tuning fork, old lantern, seam, timbering, rock face, tunnel, walls, floor.
- **One to check when wiring:** the new lamp's glass chimney is taller than the old lantern and rises about 30 px above the `lamp` rectangle (y 442). Its body and flame are inside it.
- Room 33 has one area, `every_rock_surface`, which still covers it.

### For Tyler's eye

- **Light.** The new plates are lighter overall: mean light 26.7 against 14.7 for Room 33, and 26.3 against 19.2 for Room 34. Their light is more even, and the pool of lamplight on the floor is softer. If the caves should stay as dark as they were, the main session can darken them without an operation.
- **The lamp's size.** The hotel lamp is taller and slimmer than the barn lantern it replaces. Judge whether it reads at Thad's scale when he stands beside it.
- **The tuning fork.** On the stump it is a small silver shape, as small as the old one; it does not read clearly as a fork at this size.

---

# Part A: the duel crowd and Fanshawe in the street

## Spent

**Caps.** On Tyler's instruction (2026-11-17), `art/staging/caps.json` has three new entries, each with cap 2 and quoting him: `room-02-duel-town-left`, `room-02-duel-town-right` and `room-02-duel-fanshawe`. He authorized up to six operations for Part A.

**Budget raised mid-brief.** Tyler said: **"Increase the budget to cover what you need to cover."** The ledger's overall count had reached its cap, and the guard refused the fourth operation.

**Part A ran at the same time as Part B,** in two sessions. This commit is rebased onto Part B's, and the two are merged:
- **the ledger:** Part B's rows, then Part A's six;
- **`spendTokensTotal`:** Part B's 4,725,000 + **65,000** for Part A = **4,790,000**;
- **`attemptsTotal`:** Part B's 459 + **4** for Part A = **463**;
- each raise quotes him.

**All six operations are spent**: a drawing and a correction for each sheet. That is 77,161 billed tokens:

| Sheet | Attempt 1 (drawing) | Attempt 2 (correction) |
|---|---|---|
| town, left | 12,861 | 13,263 |
| town, right | 12,878 | 13,153 |
| Fanshawe | 12,833 | 12,173 |

**Ledger, both parts:** 460 attempts and 4,700,155 tokens against 4,790,000, about 89,800 left.

**Nothing is wired.** Nothing in `content/` or `docs/` is touched. The sheets replace the old ones at their own paths.

## How

Each operation was given:
- the sheet's four distinct poses (frames 0, 2, 3, 4), laid out enlarged in place on magenta (`art/staging/duel-and-caves-art/<record>-template.png`);
- the group in Main Street at game size beside Thad (`<record>-with-thad.png`);
- Thad's ruler frame.

Each was asked for the same people, clothes, arrangement and poses, in Thad's hand, with every pose of a sheet in one picture.

Each correction was shown its first drawing beside Thad at game size, with the miss written on it (`<job>-side-by-side.png`). Prompts and specs are `reference/duel-and-caves-art/<job>-op-N.txt` and `.spec.json`.

**The cut: `tools/art/duel-crowd-cut.py JOB [--op N] [--write]`**, JOB being `town-left`, `town-right` or `fanshawe`.
- **What it does to each pose:** takes it whole from its window and scales it by one factor for all four. It keeps the poses' soles on the old sole row and centres each as the old drawing was.
- **Colour:** nothing is regraded; every colour is the operation's own.
- **Frame 1:** the breath, derived from frame 0 by `tools/rig/ambient-breath.py`, as the records say, then put back on the level's grid.
- **Snap:** to the one level, centre-sampled.
- **Rim cleaning:** a ring of magenta left on the outline is cleared (`tests/master-cut-edges.test.mjs`).
- **Re-running:** it reads the old sheets from `art/staging/duel-and-caves-art/<record>-old.png`, so it re-runs to the same pixels.

**Before and after, all three in the street beside Thad:** `renders/room-02-duel-crowd-before-after.png`, before above. Each sheet's four poses are in `renders/room-02-<job>-before-after.png`.

## 1. The town, left: `art/actors/room-02-duel-town-left.png`

**Drawn.** The same six people in the same places and clothes:
- the old woman in the red shawl;
- the man in the brown coat and hat;
- the apron man with his arms folded;
- the barman with the towel;
- the woman in the blue bonnet;
- the boy in the cap.

**The correction.** The first drawing still made everyone about five heads tall with big heads, the boy's bigger than an adult's. The correction made every adult **about seven heads tall with a small head**, like Thad, and the boy a child of about two thirds a man's height with a small head.

**What changed for the wiring.** The redrawn group stands more spread out:
- the cells are widened evenly, **308 → 402**;
- the record's x is the cell centre, so the group does not move;
- nothing is clipped.

## 2. The town, right: `art/actors/room-02-duel-town-right.png`

**Drawn.** The same five people:
- the man with the rope and red neckerchief;
- Mr. Sheng in his apron, arms folded;
- the man in the waistcoat with a hand to his chin;
- the gentleman in the top hat;
- the woman in spectacles holding a book.

They are drawn seven heads tall from the first try.

**Scale.** The sheet is 1:1 in the room. Its frontmost man is the room's man where the group stands, with 4% for his hat.

**The correction.** The first drawing was brighter than Thad (mean 68.8 against his 60.2). The correction dimmed it.

**What changed for the wiring.** The cells widen **307 → 329**.

**For Tyler's eye.** The correction dimmed the group further than asked: they are now darker than Thad (mean 42.8). The brief asks for "no brighter than he is", so this is within it. Beside the left group in the render they read as the far, darker side of the street.

## 3. Colonel Fanshawe: `art/actors/room-02-duel-fanshawe-standing.png`

**Drawn.** The same man: top hat, grey hair and moustache, brown waistcoat and watch chain, long black coat. His four poses are thumbs in his waistcoat, a hand held out, his watch, and tipping his hat.

**The correction.** The first drawing still had a face about 1.5 times the width of Thad's. The correction shrank his head and face to Thad's and lengthened the body: **seven heads tall**, at the same height.

**For the wiring.** His cells are unchanged (271 x 400).

**Facing.** `tests/faces.test.mjs` passes for his `faces: right`, but only just: his rest pose reads as near front-on. My first prompt asked for him "turned toward the viewer's left", which was wrong. The brief's "turned to Thad" is weak in the drawing, and both his operations are spent.

## For the wiring (records in `content/ambient/`)

| Record | frames | figureHeight |
|---|---|---|
| `duel-town-left.json` | `[2+404i, 2, 402, 255]`, i = 0-4 | **213** (was 197) |
| `duel-town-right.json` | `[2+331i, 2, 329, 250]`, i = 0-4 | **182** (it had none; the sheet was 1:1) |
| `duel-fanshawe.json` | unchanged, `[2+273i, 2, 271, 400]` | **363** (was 364); `levelMan` 352 unchanged |

- **figureHeight:** each comes from `node tools/solve-figure-height.mjs`, which puts each at 1.00 of Thad where it stands: town-left 1.002, town-right 1.000, Fanshawe 1.004.
- **Snap:** town-left and town-right are snapped at their new figureHeights, so the one-level test reads them as drawn.
- **`frameNote`:** unchanged in meaning.

## Measured (rest frame at game size; the gate flags, it does not decide)

| | texture | contrast | mean light |
|---|---|---|---|
| town left: before / **after** / Thad | 9.75 / **8.60** / 8.54 | 40.3 / **38.6** / 32.1 | 66.8 / **61.0** / 59.7 |
| town right: before / **after** / Thad | 8.41 / **4.96** / 8.59 | 38.4 / **25.5** / 32.0 | 63.0 / **42.8** / 60.2 |
| Fanshawe: before / **after** / Thad | 8.18 / **10.57** / 8.77 | 40.0 / **40.2** / 31.9 | 51.5 / **55.5** / 60.1 |

Fanshawe's texture is a little above Thad's; at game size it reads as the cast's hand, with his face no longer the largest on the screen.

## Checks

- **As committed:** all 67 checks pass, and 2,081 of 2,083 tests pass.
  - The two failures are town-left read through its **old** frame rects (308 wide) over the new 402-wide sheet: the one-level test and the scale test.
- **With the records above applied** (tried, then reverted): **all 2,083 tests pass**.
