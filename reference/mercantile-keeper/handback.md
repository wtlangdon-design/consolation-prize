# The Mercantile's storekeeper: handed back (reference/mercantile-keeper/brief.md)

## Budget

On Tyler's instruction (2026-11-15), `art/staging/caps.json` has a new entry, `mercantile-keeper`, cap 2, quoting it.

Tyler then saw the first hand-back: **"The storekeeper isn't facing forward at the same diagonal as the counter."** Asked what he authorizes, he chose "1 op, cap 4,475,000". So:
- `mercantile-keeper` is raised 2 → 3;
- `spendTokensTotal` is raised 4,450,000 → 4,475,000.

Both quote him.

**All three operations are spent** (ledger: mercantile-keeper attempts 1-3), so the asset has none left:
1. the drawing;
2. the correction, shown the side-by-side;
3. the redraw turned to the counter.

The ledger is 438 attempts and 4,443,967 billed tokens against 4,475,000. About 31,000 is left.

Nothing in `content/` or `docs/` is touched, and nothing is wired.

## What to look at

- **`renders/room-12-storekeeper-with-thad.png`**: all four frames in the Mercantile at game size. He is behind the counter between the credit ledger and the pickle jar, with Thad at the counter at (1480, 740), facing right. The panels are room x 1240-1920, y 160-800, one per frame.
- **`art/actors/room-12-storekeeper.png`**: the sheet.

## How it was made

### Operation 1, the drawing

Prompt: `op-1.txt`. Attached, as the brief says:
1. Thad's standing frame on magenta, as the ruler;
2. `renders/room-12-mercantile-with-thad.png`, the light and the scale;
3. the barman's rest frame at 2x, named as the style.

It drew a narrow, pleasant storekeeper in a cream shirt, dark waistcoat and brown apron, with a pencil behind each ear. It missed in four ways:
- a moustache, where the brief says clean-shaven;
- a small grey stick between his hands;
- a third pencil when he writes;
- brighter and higher in contrast than Thad.

### Operation 2, the correction

Prompt: `op-2.txt`. It was shown him beside Thad in the store at 3x (`art/staging/mercantile-keeper/op-2/side-by-side.png`).

It made him clean-shaven and emptied his hands. But he still faced straight out.

### Operation 3, turned to the counter

Prompt: `op-3.txt`. It was given:
- operation 2's sheet, as the man to keep;
- **a guide**: him in the store, with the counter's front and back edges drawn in red and the way to face in blue (`art/staging/mercantile-keeper/op-3/the-counter-angle.png`). The counter's front edge drops about 120 px over 850, from (1060, 490) to (1910, 610). Its right end is nearer, so its front faces the lower left;
- the barman at 2x, as the three-quarter turn.

It redrew the same man **turned about 30° toward the viewer's left, square to the counter**: his shoulders follow its edge and he looks toward the customer's side. Frame 4's lean came back, with his shoulders lower and nearer. **Operation 3 is what ships.**

### The cut: `tools/art/mercantile-keeper-cut.py --write`

The tool re-runs from staging. `--op 1` and `--op 2` measure the earlier drawings and do not write.

**Nothing is regraded.** It scales, keys, places and snaps to the one level; every colour is the operation's own.
- **Scale:** his rest frame, crown to sole, is the brief's **390 px**. One factor (0.5821) is used for all four frames.
- **Where the band stops:** all four frames are cut at the foot of his hands resting on the counter in the rest frame (sheet row 529). That row is put on the counter top's back edge, y 510.
- **Finding the hands:** the tool takes the contiguous run of hand rows, not the lowest skin-coloured pixel. The apron has a few such flecks, and the first cut stopped 60 rows too low.
- **Snap:** the tool snaps to the one level itself, at block 3.391 (390 / 115, errata 112).
- **`one-level.py --only room-12-storekeeper`** finds no sheet until he has a record. Run it after the wiring. Use `--dry` or `--only`: without them it re-snaps every sheet in the game.

## The sheet

Four frames, cell **140 x 198**, his hands' resting row on each cell's bottom row:

| Frame | Rect | Pose |
|---|---|---|
| 0 | `[2, 2, 140, 198]` | rest: both hands resting on the counter, looking toward the customer, pleasant |
| 1 | `[144, 2, 140, 198]` | rest B: head tilted, right hand tapping |
| 2 | `[286, 2, 140, 198]` | writing: head down, writing on the counter (in the room, on the order form) |
| 3 | `[428, 2, 140, 198]` | the action: leaning forward over both hands, smiling at the customer |

- **Anchor:** room **(1688, 510)**; in the cell, **(70, 197)**, bottom-centre. Posture `band`.
  - The brief named x 1660. Tyler then asked: "Can we put the storekeeper directly behind that clip board? Like, centered behind it? Right now it feels like he's weirdly placed with his elbow a little bit on the book next to him."
  - x 1688 puts him centred behind the order form, whose far edge runs from about x 1647 to 1717.
- **Movement:** frames 1, 2 and 3 change 18%, 38% and 54% of the figure by more than 40 levels, so frame 3 clears the test's 10% easily.

## Height against the curve

- **The curve:** the room's man is 419 px at the counter's foot (y 720) and 432.8 where Thad stands at it (y 740).
- **The storekeeper:** drawn at **390 px** crown to hidden feet, as the brief asks. His feet would fall at about y 703.
- **His crown:** at rest it is at **y 313**, 6 px below Thad's crown at the counter (y 307), as the brief wants. Writing it is at 327, and leaning at 338.
- **The tonic stays visible:** all four frames are well below the tonic shelf at y 265, so DR. PURVIS'S TONIC is uncovered.

## What he covers -- for the wiring

At x 1688 he spans x 1623-1753 across his four frames and overlaps **nothing that can be clicked**:
- **THE CREDIT LEDGER** (to x 1620) is clear, and his elbow is off the book;
- **THE PICKLE JAR** (from x 1755) is clear.

That was tried at x 1660, 1682 and 1690:
- at 1660 and 1682 his elbow is on the book;
- at 1690 his lean touches the jar's box.

**THE CATALOGUE -- ORDER FORM** (1600-1720, y 495-555) is in front of him: his hands rest at its far edge, and in frame 2 he writes on it.

## Measured beside Thad and the barman (the gate flags; it does not decide)

These are on the rest frame at game size, against Thad's standing frame scaled to the same man and against the barman's rest frame (`room-03-barman.png`, as wired):

| | texture | contrast (lum s.d.) | mean luminance |
|---|---|---|---|
| operation 1 | 5.91 | 48.4 | 91.7 |
| operation 2 | 5.94 | 47.7 | 83.4 |
| **operation 3, shipped** | **5.76** | **48.5** | **86.4** |
| Thad, at this man's size | 4.42 | 33.1 | 60.2 |
| the barman | 7.07 | 37.7 | 86.1 |

- **Texture and mean luminance** are in the barman's range.
- **Contrast** is above both the barman and Thad. Two operations asked for it lower, and it has not come down.

In the room he reads as the store's own man, warm under its lamp. His face and shirt are a little crisper than Thad's.

## Every frame checked for both pencils

Checked by eye on the operation's heads at 4x:

| Frame | Behind his right ear (far, viewer's left) | Behind his left ear (near, viewer's right) |
|---|---|---|
| 0 | ✓ (its end past his head) | ✓ |
| 1 | ✓ | ✓ |
| 2 | ✓ | ✓ |
| 3 | ✓ | ✓ |

**One miss, for your eye -- the third pencil.** A third pencil is in his hand in frame 1 (tapping) and frame 2 (writing). All three operations were asked to write with the right-ear pencil, leaving that ear empty. Each kept both ear pencils instead and gave him another.

Frames 0 and 3 have nothing in his hands. If the wiring plays 0 and 3 most and 1 and 2 rarely, the extra pencil comes and goes with the tapping and the writing.

## Other notes for your eye

- His hair reads full, not thinning.

## Checks

All 67 checks and all 1,956 tests pass on this branch.
