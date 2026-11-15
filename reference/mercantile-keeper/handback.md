# The Mercantile's storekeeper: handed back (reference/mercantile-keeper/brief.md)

## Budget

On Tyler's instruction (2026-11-15), `art/staging/caps.json` has a new entry, `mercantile-keeper`, cap 2, quoting it.

**Both operations are spent** (ledger: mercantile-keeper attempts 1 and 2), so the asset has none left:
1. the drawing;
2. the correction, shown the side-by-side.

The ledger is 437 attempts and 4,432,714 billed tokens against `spendTokensTotal` 4,450,000. About 17,000 is left, under the guard's 20,000 floor, so the next operation is refused until the cap is raised.

Nothing in `content/` or `docs/` is touched, and nothing is wired.

## What to look at

- **`renders/room-12-storekeeper-with-thad.png`**: all four frames in the Mercantile at game size, behind the counter between the credit ledger and the pickle jar. Thad is at the counter at (1480, 740), facing right. The panels are room x 1240-1920, y 160-800, one per frame.
- **`art/actors/room-12-storekeeper.png`**: the sheet.

## How it was made

### Operation 1, the drawing

Prompt: `reference/mercantile-keeper/op-1.txt`. Attached, as the brief says:
1. Thad's standing frame on magenta, as the ruler;
2. `renders/room-12-mercantile-with-thad.png`, the light and the scale;
3. the barman's rest frame at 2x, named as the style to match.

It drew a narrow, pleasant storekeeper in a cream shirt, dark waistcoat and brown apron, with a pencil behind each ear. It missed the brief in four ways:
- **a moustache**, where the brief says clean-shaven;
- **a small grey stick between his hands** in frames 1 and 2;
- **a third pencil**: in frame 3 he writes with a pencil while both ear pencils stay;
- **brighter and higher in contrast than Thad**: mean light 91.7 against Thad's 60.2, and contrast 48.4 against Thad's 33.1.

### Operation 2, the correction

Prompt: `reference/mercantile-keeper/op-2.txt`. Attached:
1. operation 1's sheet, as the drawing to keep;
2. **the side-by-side**: him in the store behind the counter beside Thad at 3x, labelled with what to change (`art/staging/mercantile-keeper/op-2/side-by-side.png`);
3. the barman at 2x.

What it fixed:
- **clean-shaven** in every frame;
- **his hands empty** on the counter in frames 1, 2 and 4;
- a little darker overall.

What it did not fix:
- frame 3's third pencil (below);
- his contrast, which is still high (below).

It also took away most of frame 4's lean. **Operation 2 is what ships.**

### The cut: `tools/art/mercantile-keeper-cut.py --write`

The tool re-runs from staging. `--op 1` measures the first drawing and does not write.

**Nothing is regraded.** It scales, keys, places and snaps to the one level; every colour is the operation's own.
- **Scale:** his rest frame, crown to sole, is the brief's **390 px**. One factor (0.5685) is used for all four frames.
- **Where the band stops:** all four frames are cut at the foot of his hands resting on the counter in the rest frame. That row is put on the counter top's back edge, y 510.
- **Snap:** the tool snaps to the one level itself, at block 3.391 (390 / 115, errata 112).
- **`one-level.py --only room-12-storekeeper`** finds no sheet yet. It reads a sheet's man from its record, and the storekeeper has none until he is wired. Run it again then. Use `--dry` or `--only`: without them it re-snaps every sheet in the game.

## The sheet

Four frames, cell **126 x 190**, his hands' resting row on each cell's bottom row:

| Frame | Rect | Pose |
|---|---|---|
| 0 | `[2, 2, 126, 190]` | rest: both hands resting on the counter, looking out, pleasant |
| 1 | `[130, 2, 126, 190]` | rest B: head tilted |
| 2 | `[258, 2, 126, 190]` | writing: head down, a pencil in his right hand, writing on the counter (in the room, on the order form) |
| 3 | `[386, 2, 126, 190]` | the action: smiling at the customer, leaning a little on both hands |

- **Anchor:** room **(1660, 510)**, as the brief says; in the cell, **(63, 189)**, bottom-centre. Posture `band`.
- **Movement:** frames 1-3 each change 25-39% of the figure by more than the movement test's threshold, well past its 10% for an action.

## Height against the curve

- **The curve:** the room's man is 419 px at the counter's foot (y 720) and 432.8 where Thad stands at it (y 740).
- **The storekeeper:** drawn at **390 px** crown to hidden feet, as the brief asks. His feet would fall at about y 711.
- **His crown is at y 321** (321-327 across the four frames). That is 14 px below Thad's crown at the counter (y 307), as the brief wants.
- **The tonic stays visible:** his crown is well below the tonic shelf at y 265, so DR. PURVIS'S TONIC is uncovered.

## What he covers -- for the wiring

- **THE PICKLE JAR** (from x 1755): not overlapped in any frame. His right edge is at x 1715-1718.
- **THE CREDIT LEDGER** (to x 1620): **overlapped by 17-21 px at the brief's anchor.** His left edge is at x 1599-1603, where the ledger's rect runs to 1620. At game size it is his left arm against the ledger rect's right edge.
  - He is 116-120 px wide, and the gap between the ledger and the jar is 135 px.
  - **An anchor of x 1681 clears both.** He would span 1620-1739.
  - The brief names 1660, so the sheet and the render use 1660; the choice is the wiring's.
- **THE CATALOGUE -- ORDER FORM** (1600-1720, y 495-555): his hands rest on its top edge, y 495-510. In frame 2 he writes on it, which reads well. The brief does not ask for it to stay clear.

## Measured beside Thad and the barman (the gate flags; it does not decide)

These are on the rest frame at game size, against Thad's standing frame scaled to the same man and against the barman's rest frame (`room-03-barman.png`, as wired):

| | texture | contrast (lum s.d.) | mean luminance |
|---|---|---|---|
| operation 1 | 5.91 | 48.4 | 91.7 |
| **operation 2, shipped** | **5.94** | **47.7** | **83.4** |
| Thad, at this man's size | 4.42 | 33.1 | 60.2 |
| the barman | 7.07 | 37.7 | 86.1 |

- **Texture** is in the barman's range, and below him.
- **Mean luminance** is in the barman's range. He is brighter than Thad, whose dark blue coat pulls Thad's mean down.
- **Contrast** is above both (47.7 against 37.7 and 33.1). The correction asked for lower contrast and barely moved it.

In the room he reads as the store's own man, warm under its lamp and no whiter than the cream papers around him. His face and shirt are a little crisper than Thad's. With no operation left, a miss is yours to call; a further correction would need a new operation.

## Every frame checked for both pencils

Checked by eye on the operation's heads at 4x:

| Frame | Behind his right ear | Behind his left ear |
|---|---|---|
| 0 | ✓ | ✓ |
| 1 | ✓ | ✓ |
| 2 | ✓ | ✓ |
| 3 | ✓ | ✓ |

**One miss, for your eye -- frame 2's third pencil.** The brief asks for both things in this frame:
- a pencil behind each ear in every frame;
- taking the pencil from behind his right ear to write.

The correction was asked to write with the right-ear pencil, leaving that ear empty for this one frame. Instead it kept both ear pencils and put a third in his hand. So the writing pencil appears in frame 2 and is gone in the others.

## Other notes for your eye

- **Hair:** it reads as full, not thinning.
- **Frame 3's lean:** it is slight; he mostly smiles over his hands. It still clears the movement test easily.

## Checks

All 67 checks and all 1,956 tests pass on this branch.
