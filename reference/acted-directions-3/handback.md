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

---

# The street people: handed back (the rest of the list)

**Scope.** Tyler, 2026-11-14: "Now draw the rest of reference/acted-directions-3/brief.md: the letter-writer, the
bell-ringer, the man leaving tomorrow and the map seller, each exactly as the brief describes (including the bottle and
the pencil added to every existing frame of those two sheets) ... You may use up to 6 more image operations for these.
I'm authorizing it: add an entry for them to art/staging/caps.json."

**Budget.** `caps.json` gains `acted-directions-3-street`, cap 6, quoting that. Six would not fit under the game's spend
cap (4,270,568 of 4,300,000 spent); asked, Tyler chose **"Raise to 4,400,000"**, recorded in `spendTokensWhy`. **All
six are spent** (ledger: acted-directions-3-street attempts 1-6): one sheet a figure and one correction each for the
bell-ringer and the map seller. Spend now 4,343,994 of 4,400,000; the ledger has 430 attempts. Nothing in `content/`
or `docs/` is touched, and nothing is wired.

## How

- **Style gate.** Every operation had the figure beside Thad in its own street at game size attached
  (`art/staging/acted-directions-3/beside-thad-*.png`, by `tools/art/beside-thad.py`), and Thad's standing frame on the
  template at his true height beside the figure (`tools/art/acted3-inputs.py`).
- **The cut**, `tools/art/acted3-cut.py KEY --write`, is `tools/art/acted2-cut.py`'s: one scale so the drawn rest is
  the sheet's rest height, the light matched, registered on the legs, despilled, snapped to the one level at the
  record's own man, new poses added as a new row below the sheet. Each cut's numbers:
  `art/staging/acted-directions-3/<key>/cut.json`.
  - **The letter-writer and the man leaving tomorrow keep every existing frame pixel for pixel** (asserted).
  - **The bell-ringer and the map seller are redrawn whole**, because the brief adds a prop to every frame: frames 0,
    2, 3 and 4 are replaced in place by their repaints, frame 1 (the breath) is derived again from the new rest, and
    the new poses follow.
- Every new pose beside Thad in its room: `renders/acted-directions-3-street-beside-thad.png`, one row a figure (for
  the two redrawn, the new rest frame first).

## The rows

| Row | Figure | New frames (index: rect) | Play | Seconds |
|---|---|---|---|---|
| 167 | letter_writer | **6** `[2,326,55,160]` the case open, head bent, the pen on the left of the page; **7** `[59,326,55,160]` the pen at the right | 6, 7, 6, 7 | 0.5 each |
| 172 | man_leaving_tomorrow | **6** `[2,156,74,152]` the bag lifted off the ground and hugged to his chest in both arms | 6 | 2.0, held through the line |
| 168 | bell_ringer | **5** `[2,280,118,276]` the bottle held up toward Thad at chest height, his face hopeful | 5 | 2.0 |
| 169 | bell_ringer | **6** `[122,280,118,276]` head tipped back, looking up at the bell; **7** `[242,280,118,276]` head bowed, looking down at the bottle in his hand | 6, then 7 | 1.2, 1.5 |
| 173 | map_seller | **5** `[2,164,60,160]` the map flat at his chest, the pencil on it, head bent; **6** `[64,164,60,160]` the pencil moved across | 5, 6, 5, 6 | 0.5 each |

**The props added to every frame (errata 111):**
- **The bell-ringer's bottle:** a small brown bottle in his waistcoat pocket in frames 0-4 (the mallet stays in his
  hand, through the strike); in his free hand in 5-7, the pocket empty, the mallet in the other hand.
- **The map seller's pencil:** a yellow pencil behind his ear in frames 0-4; in his hand in 5-6, nothing at the ear.

## What missed, and what was done

- **The bell-ringer, first drawing (attempt 3):** in the hopeful pose he had TWO bottles (one held up, one still in the
  pocket), and in the looking-down pose he had LOST THE MALLET. **The correction (attempt 5) fixed both**, and the cut
  uses it (`sheet-fix.png`). His sheet is drawn 0.7% smaller so the raised mallet fits its cell.
- **The map seller, first drawing (attempt 4):** two pencils in the drawing poses (one behind the ear, one in the hand)
  and a thin stray line beside the lowered map. **The correction (attempt 6) removed the line but kept the second
  pencil.** With no operations left, the tool takes it out: in the two drawing frames, the pencil-yellow pixels at the
  head (green at least 0.8 of red, which his skin is not) take the colour round them (21 pixels). A pixel or two of the
  pencil's dark outline is left beside his cap; at game size it is one pixel.
- **The letter-writer and the man leaving tomorrow** came right the first time.

## For the wiring session

Add the new rects to each record's `sprite.frames` in order, the acts to doc 95 rows 167, 168, 169, 172 and 173
(B to A), and take them off this brief's list (`tests/movements-to-draw.test.mjs`). The bell-ringer's and the map
seller's existing frames are new drawings in the old rects, so re-measure their heights; the bell-ringer's bottle now
shows in every idle, so row 168's printed bottle is no longer ahead of the picture.
