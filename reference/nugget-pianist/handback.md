# The Nugget's pianist: handed back (reference/nugget-pianist/brief.md)

**Note on the brief.** It is not on main yet: it was read from `origin/playthrough-fixes-2` (errata 317, commit
addd6a6c) and copied beside this hand-back unchanged. This branch is cut from main (ee8dc4b6).

**Budget.** Tyler, 2026-11-15: "You may use 1 image operation for this. I'm authorizing it: add an entry
\"nugget-pianist\" with 1 attempt to art/staging/caps.json." The entry is added and **the one operation is spent**
(ledger: nugget-pianist attempt 1; 431 attempts in all; 4,356,731 of 4,400,000 billed). Nothing in `content/` or
`docs/` is touched, and nothing is wired.

## Style gate (CLAUDE.md)

- **Generated against Thad in the Nugget:** the operation had Thad standing beside the piano and its stool in the
  room (`art/staging/nugget-pianist/thad-by-the-piano@2x.png`), Thad's standing frame on the canvas as the ruler for a
  standing man, and a Nugget bar man (`nugget-bar-man@2x.png`) as the cast standard.
- **Measured:** below. **Seen in the room:** `renders/room-03-pianist-in-the-nugget.png`, the four frames on the stool
  beside Thad by the piano.

## The sheet

`art/actors/room-03-pianist.png`, four frames in cells of **92 x 160**, side by side 2 px apart:

| Frame | Rect | |
|---|---|---|
| 0 rest | `[2, 2, 92, 160]` | both hands on the keys, the glass on the lid |
| 1 play A | `[96, 2, 92, 160]` | one hand pressed down, the other lifted high, the glass on the lid |
| 2 play B | `[190, 2, 92, 160]` | the other way round, the glass on the lid |
| 3 the drink | `[284, 2, 92, 160]` | the same glass lifted to his mouth, head back, the other hand on the keys; nothing on the lid |

An older miner: grey stubble, a battered brown hat pushed back, dark waistcoat, rolled sleeves, boots, on the round
stool, which is drawn with him in every frame. He faces the piano (up and to the left), in profile with his back a
little to the room. **The glass is part of each frame, floating where the lid is** (on the lid in 0-2, in his hand in
3), so it never appears or vanishes (errata 111). Drawn with the stool at its foot point below, it lands on the piano's
lid, against the keys.

Cut by `tools/art/nugget-pianist-cut.py --write`: one scale for all four, from the drawn Thad as a standing man;
frames 1-3 registered on frame 0 by the legs and the stool; despilled; snapped to the one level at the room's man there.

## For the wiring session

- **Feet point:** in each cell, **(46, 157)**, the stool's foot and his boots on the cell's bottom row. Placed at the
  stool's foot, **(675, 525)** in the Nugget (the `piano_stool` obstacle is x 645-705, y 445-525), that is where the
  render draws him. The render scales him 1:1 and grades him with Thad's figureLight (the room grades Thad, Deke and the
  fiddler); his record wants the same grade.
- **Height against the curve:** the room's man at y 525 is **217.7**. He is drawn **156 px** seated, crown to sole:
  **0.716 of a standing man there.** For `tests/scale.test.ts`: posture `seated`, and figureHeight 156 with stature
  0.716, or the curve's man and a stature, whichever form the seated records use.
- **Texture and contrast** (`tools/art/cast-softer-measure.py`'s measures; texture depends on scale, so Thad is
  measured at a man of 218, the pianist as cut):

  | | texture | contrast |
  |---|---|---|
  | **the pianist** | **5.57** | **35.0** |
  | Thad's stand, at a man of 218 | 7.43 | 32.6 |
  | Nugget bar man 1, at the pianist's height | 2.08 | 21.4 |

  He is no sharper than Thad, and his contrast is Thad's within a few points.
- **Movement (errata 77):** every frame changes almost all of the figure from the rest (the drawings are separate),
  so 1 and 2 serve as the playing loop and 3 as the deliberate action at least every 30 s.
- **What may miss:** he faces the piano more in profile than with his back three-quarters to the room, as the brief
  asked; frame 2's lifted hand is the far one and reads smaller than frame 1's. Nothing about him is marked (invariant 9).
- Then his ambient record, the piano heard as his, and Thad's piano lines rewritten to match (doc 133).
