# Frame's walk, as six frames: one operation, for the builder session with the image key

Written 2026-11-10. A correction to `reference/press-pull/brief.md`, and the mistake was the brief's: it asked for Frame's walk as **four** frames of one stride, and the game's standard for a walk is **six** (`tests/walk-gait.test.mjs`: "a walk needs six to show both strides and both passing poses"; Tyler, 2026-11-06, of the four-frame walks then in the game). The four you drew are good and cannot ship as a walk.

**Budget.** The operation `press-pull` holds in reserve (operation 4 of its cap of 4 in `art/staging/caps.json`). Nothing new is asked of the fifteen. Check `art/staging/ledger.json` first and log it under `press-pull`.

**Nothing here may be written by the builder.** No lines. Do not touch `content/`. Never touch `wtlangdon-design/anchorage`.

When done: commit to a branch named `press-walk-six-art` with `reference/press-walk-six/handback.md` beside this brief, push it, and stop.

## The one sheet

- **Ignatius Frame walking to his left in profile, six frames of one full cycle,** posed on Thad's own walk as WALK-C posed Deke's (`tools/art/walk-c.py`; cast-unify 40): contact, down, passing, contact on the other foot, down, passing. Attach Thad's walk frames as the pose guide, operation 1's sheet (`art/staging/press-pull/op-1/sheet.png`) as the man, and his rest frame as the ruler.
- The same man as operation 1 in every particular: apron, rolled sleeves, pencil behind his ear, his notebook in his hand in every frame.
- Cells of **269 x 502**, as operation 1's were cut, bottom-centred, soles on the same row in every frame, his tallest frame his standing height. Overwrite `art/actors/room-09-frame-walk.png` with the six (frames `[2 + i*271, 2, 269, 502]`), cut by `tools/art/press-pull-cut.py`, despilled and snapped to one level at his man.
- He walks about 450 px, once, from his press to his back editions.

## For the wiring (the main session's)

The rest of the press's staging is wired and waiting on this sheet, on the branch `press-staging`: he says his piece at the press, walks to his back editions and folds his arms; Thad goes to the press and hauls the bar.
