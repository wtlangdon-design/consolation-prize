# The press, pulled: the art, handed back (reference/press-pull/brief.md)

**Budget.** `press-pull` is set at 4 in `art/staging/caps.json` (three operations and one in reserve, out of the
fifteen Tyler set aside overnight; this brings the night's spend to 6 of 15). **Three are spent**
(`art/staging/ledger.json`, press-pull attempts 1-3), one per sheet. **Operation 4 is held.** Each operation was drawn
on a template of the figure's own shipping rest frame (errata 144's method; the first figure is the ruler and is not
shipped), with a frame of Thad beside Frame in the Clarion (`renders/playthrough/act-2.webp`, row 16) and Frame's
sheet attached. Every sheet is cut by `tools/art/press-pull-cut.py` (re-runnable from staging: `--write`), despilled
and snapped to one level. Nothing was written and nothing in `content/` was touched.

In the Clarion at game size, beside Thad: `renders/room-09-the-press-pulled-with-thad.png` (the walk along his path;
Frame stood back with Thad at the bar; the haul's three frames beside Thad's standing frame). Made by
`tools/art/press-pull-render.py`, on the room's curve.

## 1 · `art/actors/room-09-frame-walk.png` -- Frame, walking

Four frames of one stride, in profile facing left (from the press toward his back editions): contact, passing,
contact on the other foot, passing. Frames `[2 + i*271, 2, 269, 502]`, bottom-centred, soles on row 501 in every one.

- **The cell is 269 x 502, not 201 x 502.** His two contact frames' stride is wider than his standing cell; the cell
  is widened evenly at both sides, so all four frames are one size and he is centred on his head and shoulders in
  each (no jitter).
- The operation drew the walker about 4% shorter than its ruler. All four are scaled by one factor (1.037) so his
  tallest frame is his standing height, 502; the contact frames dip to 499, as a stride does.
- His notebook is in his hand in every frame.

## 2 · `art/actors/room-09-frame-stood-back.png` -- Frame, stood back

Two frames, `[2, 2, 201, 506]` and `[205, 2, 201, 506]`: 0 three-quarter turned to the right (toward the press), arms
folded with his notebook under them, weight back, chin up; 1 the breath, derived as every ambient breath is. On his
own 201-wide cell, registered on his legs to his rest frame; the cell is 4 px taller than his rest cell (his head sits
a little higher with his chin up), and his soles are on its bottom row.

## 3 · `art/actors/thad-haul-right.png` -- Thad, hauling the bar

A strip of three frames on his idle-right canvas (663 x 691, frame i at x = 663 i), registered on his feet, soles on
row 625 in each, as `thad-plate-front.png` was handed over: 0 both hands on the bar, arms out, standing square;
1 weight going back, leaning from the ankles, the bar coming toward him; 2 the bar home, against his chest, elbows
back. The bar is in his hands and reaches right, toward the press; the press is the plate's.

- A strip, not a clip directory: declaring a `thad-*` directory touches `content/`, which this brief forbids. The
  wiring splits it as `tools/art/thad-coat-bundle-split.py` splits the coat bundle.
- At the press's left edge (where Frame stands now, x ~1379), the bar's end meets the press's side
  (the render's middle panel).

## For Tyler's decision

1. **The sleeve.** The brief asks for one sleeve pushed up clear of the bar. In frames 0 and 1 the near forearm is
   bare from about mid-way (the sleeve pushed up); the far arm is hidden behind it, so whether one or both are up
   cannot be seen. In frame 2 the arm is folded against his chest and the sleeve is not legible. If it should read
   more plainly, that is the held operation's.
2. **The bar is short** (about his forearm and hand), so it does not run into the press. If the wiring wants it to
   reach further, the plate's press handle can carry it.
3. **The walk's cell is wider than his own** (269, not 201), above. The engine draws bottom-centred, so the wider
   cell does not move him.

## Later: the walk is six frames

`reference/press-walk-six/brief.md` corrected section 1 (a walk is six frames). Operation 4, the reserve, redrew it;
`room-09-frame-walk.png` is now six frames of 327 x 502. See `reference/press-walk-six/handback.md`.
