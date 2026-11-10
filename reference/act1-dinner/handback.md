# Act I, the dinner and the survey: the art, handed back (reference/act1-dinner/brief.md)

**Budget.** `act1-dinner` is set at 3 in `art/staging/caps.json` (two operations and one in reserve, out of the fifteen
Tyler set aside overnight for new briefs). **All three are spent** (`art/staging/ledger.json`, act1-dinner attempts
1-3): operation 1 for the dish, operation 2 for the map, and **the reserve, operation 3, for the dish again** (below).
Nothing was written and nothing in `content/` was touched.

## 1 · `art/props/room-11-dinner-uncovered.png` -- the dish uncovered (I-1)

The whole 598 x 152 table, to be drawn exactly where `room-11-dinner.png` is (content: `x` 1087, `y` 550, frame
`[0, 0, 598, 152]`), with only its left-end corner changed: **6,856 pixels, all inside table x 30-168, y 52-151.**
`tools/art/act1-dinner-uncovered-cut.py` cuts it from staging and **asserts that no pixel outside that corner differs
from the table's own picture.** The drape is unchanged and still drawn in front.

- The cover is lifted and set down tipped on its side, its rim on the tray's left edge and the cloth at the table's
  corner, its dark inside showing. The tray is the same tray, in the same place. On it, a folded cream page with rows of
  unreadable small print, an empty line at its foot, and a sprig of parsley. The candlestick's foot, hidden by the cover
  until now, is drawn whole; the candlestick and the Colonel's glass are where they were.
- The cover's rim reaches a few pixels past the table's left edge, as a thing standing on the corner would; those
  pixels were transparent and are now the cover's.
- **Operation 1 was not used.** Asked for the change alone, it re-laid the table's left half: it moved the candlestick,
  removed the Colonel's wine glass, and served the contract on the Colonel's own plate. Operation 3 was given a marked
  layout (`art/staging/act1-dinner/op-3/layout-guide.png`: the corner that may change, where the cover goes, where the
  page goes, what stays) and did it as asked.
- Beside the dinner as it plays: `renders/room-11-dinner-uncovered-with-thad.png` (before, after).

**For the wiring** (the main session's; not done here): a prop with the same rect as `dinner`, drawn when
`T_CONTRACT_SERVED` is set and in place of `dinner`, until `T_DINED`. CLOSE puts the cover back, so the dinner ends with
`T_DINED` and both go.

## 2 · `art/backgrounds/room-16-company-map.png` -- the Company's map, large (I-3)

A 1920 x 864 background: the map unrolled on Madame Ozymandia's red cloth, from above at a slight angle, held flat by
four brass weights, lit warm from the upper left and falling to dark at the lower right. Made from operation 2 by
`tools/art/act1-company-map-large.py` (no operation): the whole sheet kept and scaled to 864 tall, the cloth carried
out to 1920 at both sides from the operation's own cloth, matched to its light row by row, and brought to a 4 px grain.

Where things are, in the background's own pixels (for the line the player draws):

| | x | y |
|---|---|---|
| Claim One (the "1") | 801-979 | 321-485 |
| Claim Two (the "2"), its red circle | 979-1143; circle 962-1160 | 321-485; circle 325-481 |
| **The stake**, at Claim Two's lower right corner | ~1139 | ~480-502 |
| The two rocks, uphill: **the larger** | 831-932 | 173-236 |
| the smaller | 983-1025 | 203-230 |
| The creek | across | 477-612 |
| The road | across | 641-717 |

The only writing is the "1" and the "2". The only red is the circle. Open paper all round the claims, and between the
stake and the rocks.

## For Tyler's decision

1. **The map's look.** Operation 2 drew it as a painted close-up, smoother and finer than the room plates. It is brought
   to the game's grain and posterised, but it is still a softer, more painterly picture than the tent around it
   (`renders/room-16-company-map-beside-the-tent.png`). It is a full-screen close-up of paper, so this may be what you
   want; if you want it chunkier, that is a new operation, and `act1-dinner` has none left.
2. **The 150 px margin.** The rocks (top, 173) and the creek are inside it. The road's lower stroke reaches y 717, so
   147 px from the bottom edge: three pixels short of the brief's 150. Nothing anyone draws to is there.
3. **The rocks sit uphill of the line between the claims,** the larger nearer Claim One. Doc 120 needs only that a line
   from the stake can reach them, and it can, across open paper.
4. **The stake is small** (about 4 x 22 px): a post with a dot, as the brief asked. If the rod's line should start from
   something easier to see, the wiring can draw a marker there; that is the engine's, not the art's.

## Later: the map redrawn in the plates' style (operation 4)

Tyler, 2026-11-10, on decision 1 above: "You can do another redraw on the map if you still need it." `act1-dinner` is
raised 3 -> 4 in `art/staging/caps.json`, and **operation 4 is spent** (ledger: act1-dinner attempt 4, derived from
attempt 2). It was given operation 2's map as the layout to keep, and the tent plate (whole, and a 2x crop for its
pixels) as the style.

- `art/backgrounds/room-16-company-map.png` is now **pixel art in the tent plate's grain**: square pixels, stepped
  shades, dark pixel outlines on the weights and the paper's edge, one- and two-pixel ink lines. Nothing on it changed
  but the drawing: the same claims, "1" and "2", red circle, stake, two rocks, hill strokes, creek and road, the same
  lamp from the upper left. `tools/art/act1-company-map-large.py` builds it from operation 4 with no further
  pixelation (operation 2's coarsening and posterising are gone), and the cloth carried out at the sides is now rolled
  tile by tile and falls off into the tent's dark, so it no longer stripes.
- **The layout held.** The red circle measures 960-1156, 326-490 (operation 2's: 962-1160, 325-487), and the tool
  now asserts it stays within 12 px, because the I-3 wiring (errata 251, on the branch `notdone`) points at this
  picture: its hotspots for the stake, both rocks, both claims and the creek, drawn on the new map in
  `renders/room-16-company-map-with-the-survey-hotspots.png`, each still on its feature. Its survey-line overlays
  (`tools/art/survey-line.py`) are drawn to the same places.
- Beside the tent: `renders/room-16-company-map-beside-the-tent.png`.
