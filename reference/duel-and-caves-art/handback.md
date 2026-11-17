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

**Tyler's first look:** "Whoever it is, he has no feet."
- **Cause:** the cut's window for him was held to the template's cell (rows 252-772), but the operation drew him taller (rows 217-823). His shoes and the top of his hat were cut off.
- **Fix:** for a sheet of one row of poses, the window now reaches 150 px above and below. The tool asserts that no pose touches its window's top or bottom, so this cannot happen again unseen.
- **Result:** re-cut whole, with no new operation: hat to shoes, scaled to his old rest height (factor 0.6507). His figureHeight is still 363 (1.004 of Thad).

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
| Fanshawe: before / **after** / Thad | 8.18 / **11.33** / 8.77 | 40.0 / **38.5** / 31.9 | 51.5 / **53.2** / 60.1 |

Fanshawe's texture is a little above Thad's; at game size it reads as the cast's hand, with his face no longer the largest on the screen.

## Checks

- **As committed:** all 67 checks pass, and 2,081 of 2,083 tests pass.
  - The two failures are town-left read through its **old** frame rects (308 wide) over the new 402-wide sheet: the one-level test and the scale test.
- **With the records above applied** (tried, then reverted): **all 2,083 tests pass**.

---

# Fanshawe everywhere else, redrawn to match the duel Fanshawe

**Why.** Tyler asked: "Are you planning on changing him everywhere in the game?" The duel Fanshawe was then the only one drawn to Thad's proportions. Offered a redraw of the other four in-game sheets against him ("a drawing and possibly a correction each, so 4 to 8 operations"), he said **"Proceed"**.

**The sheets.** These are the four that a record uses:
- the office (`room-11-fanshawe.png`, record `fanshawe`);
- the office at dinner, turned to his guest (`room-11-fanshawe-turned.png`, the same record's `spriteWhen`);
- the memorial at Boot Hill (`room-14-fanshawe-hat-in-hand.png`, `memorial-fanshawe`);
- the wreath on Main Street (`room-02-fanshawe-wreath.png`, `wreath-fanshawe`).

`room-14-fanshawe-coming-down.png` is used by no record and is left as it is.

## Spent

**Caps.** `art/staging/caps.json` has four new entries, each with cap 2 and quoting him: `room-11-fanshawe-office`, `room-11-fanshawe-turned`, `room-14-memorial-fanshawe` and `room-02-wreath-fanshawe`.

**Ceilings.** `spendTokensTotal` is raised by 50,000 (→ 4,840,000) and `attemptsTotal` by 8 (→ 471), for up to eight operations.

**Four operations are spent**, one drawing each, with no correction needed. That is 48,660 billed tokens: 12,514, 11,294, 10,918 and 13,934.

**Ledger, all of this branch:** 464 attempts and 4,748,815 tokens against 4,840,000, about 91,200 left. Each sheet still has its correction in hand.

## How

Each operation was given:
- the sheet's distinct poses laid out in place, enlarged (`art/staging/duel-and-caves-art/fanshawe-all/<job>-template.png`);
- the sheet in its room beside Thad (`<job>-with-thad.png`);
- **the new duel Fanshawe** at 2x, as the man to match (`new-duel-fanshawe@2x.png`);
- Thad's ruler frame.

The prompts are `reference/duel-and-caves-art/fanshawe-<job>-op-1.txt`.

**The cut:** `tools/art/duel-crowd-cut.py office | office-turned | memorial | wreath --write`.
- **Same as Part A:** one scale for all poses, by the old rest frame's height; he is centred on his torso where the old torso was. Frame 1 is the derived breath. Nothing is regraded.
- **The office bust:** the crown stays on its row and the bottom stays on the desk's back edge (`waistOn` 495), so the smaller head gives a longer torso. The counter-surface test passes.

**Before and after** in each room: `renders/fanshawe-<job>-before-after.png`.

## For the wiring

| Record | Sheet | frames | figureHeight |
|---|---|---|---|
| `fanshawe.json` | `room-11-fanshawe.png` | **`[2+382i, 2, 380, 194]`**, i = 0-4 (was 246 wide: his welcoming hand reaches further) | — |
| `fanshawe.json` `spriteWhen[0]` | `room-11-fanshawe-turned.png` | unchanged | — |
| `memorial-fanshawe.json` | `room-14-fanshawe-hat-in-hand.png` | unchanged | unchanged, 385 (1.002 of Thad) |
| `wreath-fanshawe.json` | `room-02-fanshawe-wreath.png` | unchanged | unchanged, 371 (1.005 of Thad) |

## For Tyler's eye

- **The office pixel size.** Both office sheets are snapped at block 4.09, the level the one-level test reads for this desk figure and the level his old sheet shipped at. It is the coarser look he has at the desk today.
  - The man where he actually sits is 304 (block 2.64).
  - This is the lobby clerk's open question (`reference/act-one-art/handback.md`): the test reads a desk figure's man from the floor in front of the desk.
  - This brief does not settle it.
- **The wreath** is the old wreath redrawn with him. Its lilies are as bright as before; the texture and contrast numbers measure mostly the wreath.
- **The memorial** is at night at Boot Hill. He is a touch brighter than before (50.1 against 45.7) and still below Thad (60.2).

## Measured (rest frame at game size)

| | texture | contrast | mean light |
|---|---|---|---|
| office: before / **after** / Thad | 4.97 / **6.23** / 5.64 | 52.0 / **52.4** / 32.7 | 83.5 / **81.3** / 59.9 |
| office, turned | 4.31 / **5.60** / 5.64 | 50.8 / **51.2** / 32.7 | 82.7 / **76.7** / 59.9 |
| memorial | 4.06 / **4.88** / 5.60 | 36.9 / **40.7** / 32.7 | 45.7 / **50.1** / 60.2 |
| wreath (mostly the wreath) | 18.17 / **24.60** / 10.44 | 64.6 / **68.4** / 31.0 | 97.6 / **103.5** / 59.3 |

## Checks

- **As committed:** all 67 checks pass, and 2,080 of 2,083 tests pass. The three failures are records read through their old frame rects over the new sheets:
  - town-left: the one-level test and the scale test;
  - the office: the waist test, through its 246-wide rects.
- **With every record in this hand-back applied** (Part A's three and the office's; tried, then reverted): **all 2,083 tests pass**.

## The line-up (Tyler: "Line up fanshawe from every scene and make sure they all match")

**`tools/art/fanshawe-lineup.py`** draws every in-game Fanshawe's rest frame as the game sizes it:
- a standing sheet by its `figureHeight`;
- a desk sheet by the desk's man.

All are then shown at one man (300 px) beside Thad, and the tool measures his face width.

**Render:** `renders/fanshawe-lineup.png`.

| | Thad | duel | office | office, dinner | memorial | wreath |
|---|---|---|---|---|---|---|
| face, px per 300 px of man (first drawings) | 26.4 | 28.0 | 30.0 | 28.7 | 42.9 | 41.2 |
| **after the corrections** | 26.4 | 28.0 | 30.0 | 28.7 | **29.6** | **38.8** |

**The memorial's head was 1.4 times too big.** Its correction (attempt 2, 9,737 tokens) was shown itself beside the duel Fanshawe at one scale, and it now matches.

**The wreath's head was too big as well.** Its correction (attempt 2, 13,748 tokens) brought it from 41 to 39. It is **still about 1.35 times the others.** Its two operations are spent, and raising its cap is Tyler's call.

**The desk's man.** The office busts measure right only against the desk's real man, about 470, which is the level the one-level test reads.
- The room's curve at his `y` gives 304. That is a far floor that does not hold the desk.
- Shrunk to 304, he sat behind it like a child (tried, then reverted). His sheets are as first cut.

**Spent on this:** two corrections, 23,485 tokens. **Ledger:** 466 attempts and 4,772,300 tokens against 4,840,000.

## Matched (Tyler: "Memorial and dual versions seem to have slightly different bodies. Fix the wreath one too. Raise limits.")

**Limits raised** on his word, each quoting him:
- `room-14-memorial-fanshawe` 2 → 3, and then → 4 for the coat;
- `room-02-wreath-fanshawe` 2 → 3.

**Spent:** three operations, 34,748 tokens:
- **memorial attempt 3** (10,863): his build made the duel Fanshawe's. Shown the two side by side, with waist, coat skirt and legs measured 5-20% wider than the duel's.
- **wreath attempt 3** (13,770): his head made smaller against the wreath ("his face about two thirds of one lily's width").
- **memorial attempt 4** (10,115): his frock coat and trousers, which were olive and lighter, made the duel's dark charcoal. Nothing else changed.

**Ledger:** 469 attempts and 4,807,048 tokens against 4,840,000, about 33,000 left.

**Face width per 300 px of man, now:**

| Thad | duel | office | office, dinner | memorial | wreath |
|---|---|---|---|---|---|
| 26.4 | 28.0 | 30.0 | 28.7 | 26.5 | 29.1 |

- **Build:** the memorial's build is within about 8% of the duel's at every height. He stands with his hands and hat at his chest where the duel man has his thumbs in his waistcoat, which accounts for most of what is left.
- **Height:** figureHeights are unchanged; `tools/solve-figure-height.mjs` gives memorial 1.002 and wreath 1.005 of Thad.
- **Render:** `renders/fanshawe-lineup.png`.

**Checks.**
- **As committed:** all 67 checks pass, and 2,080 of 2,083 tests pass.
  - The three failures are the old frame rects of town-left (two) and the office (one).
- **With every record in this hand-back applied:** all 2,083 tests pass.
