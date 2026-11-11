# Main Street, redrawn in the side streets' hand: for the session with the image key (errata 272)

Written 2026-11-10. Tyler, offered a same-composition redraw of Main Street at up to five operations and a new walk for Winnie at two: **"Fund both and go."** Caps in `art/staging/caps.json`: **`room-02-redraw` 5**, **`winnie-walk-2` 2** (its brief is `reference/winnie-walk-2/brief.md`). `tools/art/room-op.mjs` enforces them and records every operation in `art/staging/ledger.json`.

**The spend cap is close.** `spendTokensTotal` is 4,250,000 and 4,115,906 are spent: about 134,000 left. Operations have run 9,000-18,000 each. Seven at the most expensive would just fit. Check the ledger before every operation; if the next one could pass the cap, stop and say so. Do not change `caps.json`.

**Order:** Winnie first (one operation, `reference/winnie-walk-2/brief.md`), then the three windows below, then any correction.

Never touch `wtlangdon-design/anchorage`. Never print or write the image key. Do not touch `content/` or `docs/`.

## Why

Beside Lower Street, the Lane and the Back Alley, Main Street looks drawn by another hand: finer pixels, busier surfaces. Those three were painted at 1536 x 1024 and drawn up 1.263 times; Main Street was painted wider and finer. Errata 268's tool pass matched the colour and the ground. Only a redraw matches the hand.

**The composition does not change.** Every door, exit, porch, sign and figure's place in the game is measured on this plate. A redraw that moves them would mean re-placing the whole room. The inputs are the street itself, so the job is to redraw what is there, not to draw a new street.

## The inputs (already made; `tools/art/main-street-redraw.py prepare`)

The street before the tool pass, drawn down to the side streets' scale (2929 x 684), in three overlapping windows, each in a 1536 x 1024 canvas at exactly the place the side streets' plates were cropped from:

- `art/staging/room-02/redraw/window-1.png` (the west end: the mercantile, the Company, the chapel spire)
- `art/staging/room-02/redraw/window-2.png` (the middle: the notice board, the row of fronts, the trough)
- `art/staging/room-02/redraw/window-3.png` (the east end: the Nugget, the hotel, the assay office, the road out)

Each is sent with Lower Street and the Lane as the hand to match (`hand-lower-street.png`, `hand-the-lane.png`). The prompt is `reference/main-street-redraw/window.txt`, the same for all three.

## Steps

1. `NODE_USE_ENV_PROXY=1 node tools/art/room-op.mjs reference/main-street-redraw/window-1.spec.json`, then `-2`, then `-3`. Each writes `art/staging/room-02/redraw/out-N.png`.
2. **Check each before the next**, side by side with its window (open both at the same size and flick between them):
   - nothing has moved: doors, windows, porch posts and the roofline sit on the window's own, within about 6 px at this size;
   - the pixels are as large and the shading as flat as Lower Street's, and no finer;
   - no new words, no people, no animals.
   If one misses, **one correction** for that window: the same spec with the miss named at the end of the prompt (a copy of `window.txt` as `window-N-fix.txt`). Two corrections are held for the three windows.
3. `python3 tools/art/main-street-redraw.py stitch` and look at `art/staging/room-02/redraw/candidate-3700x864.png` whole, especially where the windows overlap (x about 890-1925 and 1785-2750 on the full street).

## Hand back

On a branch named `redraws-art`, with the Winnie sheet: the three outputs, any corrections, the stitched candidate, the prompts and specs, and `reference/main-street-redraw/handback.md` saying which window needed what, and anything that moved. **Do not promote the plate**: the builder checks every door, exit and stand against the room, re-derives the night overlays (the gilt sign, the funeral notice) and the dawn plate, and puts it in front of Tyler.
