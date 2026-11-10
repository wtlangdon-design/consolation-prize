# Objects, second pass: the art, handed back (reference/objects-second-pass/brief.md)

**Budget.** `objects-second-pass` is set at 4 in `art/staging/caps.json` (three operations and one in reserve, out of
the fifteen Tyler set aside overnight; done the morning after on his "complete the Not Done items if they're still not
done"). **Three are spent** (ledger: objects-second-pass attempts 1-3), one per section. **Operation 4 is held.**
Nothing was written and nothing in `content/` was touched. This branch is cut from `main`; the brief is copied in from
`notdone`, where the wiring (errata 250, doc 121) waits.

Before and after, at 3x round each patch: `renders/objects-second-pass-patches.png`.

## 1 · `art/ui/item-icons-objects-second-pass.png` (+ `.json`) -- seven item icons

Operation 1. Seven 60 x 40 cells in a row, `[60 i, 0, 60, 40]`, under the brief's ids: `nail` (a cut iron nail, square
head), `oats` (a small golden heap), `parsley` (a curled sprig), `capital_b` (a worn grey type block, its face a
backward B), `pikes_collar` (a starched white collar, standing), `button` (black, four holes, which show the panel
through them), `room_key` (an iron key on a ring with an oval brass tag stamped 3). Cut by
`tools/art/objects-second-pass-icons-cut.py` with `item-icons-cut.py`'s own reduction at ONE factor for all seven
(4.105, set by the key), so the nail and the button are small, as the chalk was. The tool refuses a cell
pixel-identical to any of the 46 cells already shipped or beside the shipping sheet. A side sheet, as Act II's was; the
wiring moves the cells in (`tools/art/act2-papers-icons-place.py` is the pattern) and takes `iconPending` off.

## 2 · `art/props/room-11-drawer-shut.png` -- the drawer, shut

Operation 2, an edit of the plate itself (a 768 x 512 crop at 2x, the marked layout beside it). The sideboard's lower
right drawer is pushed home, its face flush and level with the left drawer, one brass handle. Record:
`{"sheet": "art/props/room-11-drawer-shut.png", "x": 1523, "y": 641, "frame": [0, 0, 155, 142]}` (the renderer draws
from x - floor(w / 2), y - h + 1). Cut by `tools/art/objects-second-pass-patches.py` as one solid shape inside the box
x 1446-1612, y 500-642, and **asserted to change nothing outside that box.**

- The left drawer's face runs on to x ~1486 behind where the open drawer stood; the plate never showed that part.
- **A faint seam** in the plinth rail below the new drawer, where the operation's rail meets the plate's. At game size
  it is a one-pixel step; if it shows in play, the held operation can redo the drawer.

## 3 · `art/props/room-14-pike-envelope.png` -- the envelope on Mr. Pike's board

Operation 3, an edit of the plate (a crop at 2x, the marked layout, and a frame with Thad at the marker's walk-to).
A sealed cream envelope, night-lit, nailed by one corner to the face of Pike's headboard (hotspot `pike_s_marker`,
the upper right board), hanging a little crooked, no writing. Record:
`{"sheet": "art/props/room-14-pike-envelope.png", "x": 1580, "y": 258, "frame": [0, 0, 67, 91]}`; asserted to change
nothing outside x 1546-1622, y 168-266.

- **It hangs just under the carved cross** (about y 230-256), not over it where the layout asked: the operation put it
  there, and the cut's box was widened to take it rather than spend the reserve. The bottom of the cross is behind it.
- **The Colonel's wreath** (prop `colonel_s_wreath`, x 1567-1637, y 227-302) leans over the same part of the board.
  If both are shown at once, draw the envelope first: the wreath in front of the letter reads right.
