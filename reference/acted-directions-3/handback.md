# Acted directions, the third pass: handed back, `thad` only (reference/acted-directions-3/brief.md)

**Scope.** Tyler, 2026-11-14: "Draw only the brief's `thad` section: his hand-over clip, facing right and facing left,
three frames each, exactly as the brief describes ... You may use up to 3 image operations for this. I'm authorizing
it: add an entry for it to art/staging/caps.json." The other four figures on the list (letter writer, bell ringer, man
leaving tomorrow, map seller) are **not drawn** and stay on the list.

**Budget.** `art/staging/caps.json` gains `acted-directions-3-thad`, cap 3, quoting the instruction; the brief's own
"do not edit caps.json" is overridden by it, as the entry says. **All three are spent** (ledger:
acted-directions-3-thad attempts 1-3): the right facing, the left facing, and one correction of the left. Spend now
4,257,404 of 4,300,000. Nothing in `content/` or `docs/` is touched, and nothing is wired.

## Style gate (CLAUDE.md)

1. **Generated against Thad in the Nugget**: every operation had `art/staging/acted-directions-3/thad/nugget-<facing>.png`
   attached -- Thad standing in profile across the whiskey barrel from Deke Vessel, as the engine draws them (the
   room's man, its figureLight grade and lamps; `tools/art/acted3-thad-inputs.py`), with his own stand frame three
   times as the template.
2. **Measured**: every frame is on his stand canvas, soles on his stand's row, at his stand's height; frame 0 is his
   stand byte for byte (asserted).
3. **Seen in the room**: `renders/thad-hand-over-in-the-nugget.png`: the three frames of each facing beside Deke at
   game size (top right-facing at Deke's walk-to, bottom left-facing from Deke's other side; that left spot is only
   for the picture and does not put the barrel between them).

## What is handed back

`art/actors/thad-hand-over-right.png` (663 x 691) and `art/actors/thad-hand-over-left.png` (663 x 690): strips of
three frames on his stand canvas, frame i at x = 663 i, cut by `tools/art/acted3-thad-cut.py --write`. Strips, not clip
directories, because a `thad-*` directory has to be declared in `content/` (as `thad-plate-front.png` and
`thad-haul-right.png` were handed over).

| Frame | Right | Left |
|---|---|---|
| 0 | `thad-stand-right/stand-00.png`, byte for byte | `thad-stand-left/stand-00.png`, byte for byte |
| 1 | the near arm straight out at chest height, the hand closed with a glint (the four dollars and the watch, too small to read) | the same, mirrored from the right (below) |
| 2 | the arm back at his side, empty: his stand frame again, byte for byte | the same |

- **Frame 1 is his stand with only the arm taken from the drawing** (the region where the drawn pose differs from the
  drawn ruler, below his collar), so his head, body and feet do not move between frames: a whole drawn frame would
  jump (doc 36 Q107, why `give-offer` does not stand in). 19,596 pixels change.
- **Frame 2 is the stand frame.** Both drawings put the arm back exactly as his stand has it (the arm hangs at his
  side, the hand empty), so nothing differed. If a visibly opened hand is wanted, that is a new operation.
- Suggested timing: 0 for 0.15 s, 1 held for the hand-over (about 0.8 s, while the other person's hand takes it,
  doc 95 row 174), 2 for 0.2 s, then his stand.

## What missed

- **The left facing was drawn twice and missed twice.** Operation 2 and its correction (operation 3, which named the
  miss) both reached with his FAR arm, from behind his body, and left the near hand at his hip; the brief asks for the
  near arm. Neither is used (`sheet-left.png`, `sheet-left-fix.png` stay in staging).
- **So the left clip's frame 1 is the right's, mirrored**, by the tool and no operation: Thad's left stand is close to
  the mirror of his right (silhouettes overlap 0.945 once aligned by 2 px), so the right clip's arm region is mirrored
  and laid onto the left stand. The light on that arm comes from the other side as a result; at game size it does not
  show.
- **A faint lighter patch on the coat** where the hand used to hang, in both facings (the drawing's coat under the
  raised arm is a shade lighter than the stand's). Small at game size.

## For the wiring session

- Split the strips into `art/actors/thad-hand-over-right/` and `-left/` (`tools/art/thad-coat-bundle-split.py` is the
  pattern), declare a `hand-over` clip in `content/actors/thad.json` per facing (figureHeight and anchor as his
  stand's: right 626 / [332, 626], left 625 / [332, 625]), and move doc 95 row 174 from B to A.
- Take `thad` off this brief's list in the same pull request (`tests/movements-to-draw.test.mjs`).
