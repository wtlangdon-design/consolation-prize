# The Nugget's barman, the second drawing: handed back (reference/nugget-barman/brief.md, the second brief)

## Budget

On Tyler's instruction (2026-11-15), `art/staging/caps.json` now has:
- **`spendTokensTotal` 4,400,000 → 4,450,000**;
- **`nugget-barman` 1 → 3**: one new drawing and, if it missed, one correction shown the side-by-side.

Both entries quote the instruction. **Both operations are spent** (ledger: nugget-barman attempts 2 and 3), so the asset has none left.

The ledger is 435 attempts and 4,408,079 billed tokens, about 42,000 under the new cap. This branch carries the ledger and cap lines from `nugget-barman-art` and `mercantile-doorway-art` (neither is on main yet), so its count is the true one. The lines are the same as theirs, so the branches merge cleanly.

Nothing in `content/` or `docs/` is touched, and nothing is wired.

## What to look at

- **`renders/room-03-barman-between-the-drinkers.png`**: the rest frame in the room between the drinkers. Game size is on the left; the same crop at 3x is on the right.
- **`renders/room-03-barman-in-the-nugget.png`**: all four frames in the bar, with the drinkers and Thad.
- **`art/actors/room-03-barman.png`**: the sheet. It replaces the first attempt's file of the same name.

## How it was made

### Operation 2, the new drawing

Prompt: `reference/nugget-barman/op-2.txt`. Attached:
1. Thad's standing frame on magenta, as the ruler;
2. the bar at game size, with Thad and the three drinkers (`op-2/the-bar-with-the-drinkers.png`);
3. `nugget_bar2` and `nugget_bar3` at 2x, named as the style to match;
4. the first attempt in the bar, labelled "AVOID: too sharp, too white, too bright" (`op-2/first-attempt-avoid.png`).

What it drew is a different man from the first attempt:
- a warm cream shirt, a tan apron and a dark brown waistcoat;
- no towel on his shoulder;
- the cloth in every frame.

It still measured too bright and too sharp beside the drinkers (op 2 column below). In the room, his face and shirt stood out from the men around him. **That is the brief's miss, so the correction was used.**

### Operation 3, the correction

Prompt: `reference/nugget-barman/op-3.txt`. Attached:
1. operation 2's sheet, as the drawing to keep;
2. **the side-by-side**: him in the bar between the drinkers at 3x, labelled "still TOO BRIGHT and TOO SHARP" (`op-3/side-by-side.png`);
3. the two drinkers at 2x.

It redrew the same man, the same four poses in the same places:
- darker and warmer;
- softer and lower in contrast;
- the shirt a dimmer cream, the apron a soiled tan.

It left Thad off the sheet, which doesn't matter: the cut scales by the barman himself. **Operation 3 is what ships.**

### The cut: `tools/art/nugget-barman-cut-2.py --write`

The tool re-runs from staging to the same pixels; `--op 2` measures operation 2 and does not write.

**Nothing is regraded.** It scales, keys, places and snaps to the one level; every colour is the operation's own.
- **Scale:** his rest frame, crown to sole, is the room's standing man at the bar, **246.4 px** (feet hidden at y 560). One factor (0.4233) is used for all four frames.
- **Where the band stops:** all four frames are cut at the sheet row where frame 3's set-down glass meets the counter. That row is put on the counter's front edge, so his hands meet the counter, as the first hand-back found.
- **The counter top:** between its back edge and its front edge (about 10 game px), only what is on the counter shows: the glass, the cloth and his hands. His apron below the back edge is behind the counter.
- **Snap:** the tool snaps to the one level itself, at block 2.142 (246.4 / 115, errata 112).
- **`one-level.py --only room-03-barman`** finds no sheet yet. It reads each sheet's man from its record, and the barman has none until he is wired. Run it again after the wiring.

## The sheet

Four frames, cell **100 x 141**, the counter's front edge on each cell's bottom row:

| Frame | Rect | Pose |
|---|---|---|
| 0 | `[2, 2, 100, 141]` | rest: polishing, the glass in his left hand and the cloth in his right |
| 1 | `[104, 2, 100, 141]` | polish B: the glass turned, the cloth moved round it |
| 2 | `[206, 2, 100, 141]` | the glass set down on the counter, the cloth beside it |
| 3 | `[308, 2, 100, 141]` | the action: head turned along the bar, glass and cloth together at his chest |

Frames 1-3 each change over 99% of the figure against the rest, so frame 3 clears the movement test's 10% for an action easily.

- **Anchor:** room **(1580, 515)**; in the cell, **(50, 140)**, bottom-centre. Posture `band`.
- **Height against the curve:** the room's man at the bar is **246.4 px** (`reference/room-03/annotation.json`; the brief's "about 246"). His crown is at **y 375**, the band is **141 px** from crown to counter edge, and his hidden feet would be at about y 621.

## Measured beside Thad and the drinkers (the gate flags; it does not decide)

These are on the rest frame at game size, against:
- Thad's standing frame scaled to the same man;
- `nugget_bar2`, and `nugget_bar3` (the drinker in cream sleeves).

| | texture | contrast (lum s.d.) | mean luminance |
|---|---|---|---|
| first attempt (for the record) | 11.41 | 62.5 | |
| operation 2 | 9.51 | 49.2 | 100.1 |
| **operation 3, shipped** | **8.27** | **40.0** | **85.6** |
| Thad, at this man's size | 6.60 | 32.3 | 59.9 |
| `nugget_bar2` | 3.29 | 24.5 | 46.5 |
| `nugget_bar3` | 3.80 | 40.1 | 60.8 |

**He is still above the brief's aim.** The aim is texture 3-6 and contrast 25-33. He is at 8.27 and 40.0, and brighter than the drinkers.

Part of the gap is what is measured: his band is his face, shirt and hands seen from the front, while the drinkers are mostly backs of coats. His contrast now equals `nugget_bar3`'s.

In the room he reads as one of the bar's men, warm and dim, not pasted on. Beside the drinkers his face is still a little lighter and more drawn than theirs.

**No operation is left.** If you see a miss, it needs a new operation from you, shown this render. Per the brief, it should not be met with a filter.

## Every frame checked for the cloth

Checked by eye on the cut cells at 4x:
- **Frame 0:** cloth in his right hand (the viewer's left), against the glass. ✓
- **Frame 1:** cloth in his right hand, moved round the glass. ✓
- **Frame 2:** cloth on the counter beside the glass, under his other hand. ✓ (present)
- **Frame 3:** cloth with the glass at his chest. ✓

There is no towel and no second cloth in any frame, and the glass is in all four. Nothing appears or vanishes (errata 111).

**One continuity miss, for your eye:** in frame 2 the cloth and the glass have swapped hands. The glass is under his right hand (the viewer's left) and the cloth is in his left. The brief says the glass goes under his left hand and the cloth stays in his right. Operation 3 was asked to fix this and did not. When frame 2 plays, the cloth crosses from one hand to the other.

## For the wiring

- At x 1580, **the plate's bottle on the counter stands in front of him**. In frame 2 it hides most of his set-down glass (`renders/room-03-barman-in-the-nugget.png`, lower left). Moving his anchor a little along the bar clears it. That placement is the wiring's to choose.

## Checks

All 67 checks and all 1,935 tests pass on this branch.
