# Main Street, redrawn in the side streets' hand: handed back (reference/main-street-redraw/brief.md)

> **Updated 2026-11-11, after "Raise both caps".** `room-02-redraw` 5 -> 7 and `spendTokensTotal` 4,250,000 ->
> 4,300,000 (both recorded in `caps.json` with the ruling). **Six of seven are spent; one is held.** 4,234,534 billed
> now (65,466 left); the ledger has 421 attempts. The section **The second round** below supersedes "The stitch" and
> "For Tyler and the builder": the street is now stitched whole, without ghosting.

**Budget.** `room-02-redraw`, cap 5: **all five spent** (ledger: room-02-redraw attempts 1-5) -- the three windows and
the two held corrections. `caps.json` not changed. The spend cap: 4,217,842 billed of 4,250,000 now (32,158 left;
`winnie-walk-2` took 2, this 5, together about 102,000). The ledger has 420 attempts.

**Not promoted.** `art/backgrounds/room-02-main-street.png` is untouched.

## Each window

Checked each output against its window by overlaying their edges (red: the window, green: the output, yellow where
they meet; `art/staging/room-02/redraw/checks/edges-*.png`) and by matching vertical strips (how far the output's
buildings sit from the window's, at the window's 1536 x 1024 size):

| Window | Operation | Moved | Hand | Verdict |
|---|---|---|---|---|
| 1, the west end (`out-1.png`) | attempt 1 | **up to ~12 px** right and down 8-12 px across the fronts; the far left 24 px down | chunkier, flatter: colour steps 0.19 of pixels against the window's 0.33, Lower Street 0.16, the Lane 0.21 | used as drawn. A little outside the brief's ~6 px; no correction was left to spend on it |
| 2, the middle (`out-2.png`) | attempt 2 | **every building ~40-50 px higher**, the right-hand fronts ~20 px left | 0.25 | missed: corrected |
| 2, corrected (`out-2-fix.png`) | attempt 5 | **within ~8-12 px**; the edges coincide | chunkier | **used** |
| 3, the east end (`out-3.png`) | attempt 3 | the hotel and assay office **drawn larger and 20-40 px right**, the saloon front raised; the road out moved | 0.22 | missed: corrected |
| 3, corrected (`out-3-fix.png`) | attempt 4 | **no better**: 20-56 px right, 16-32 px down; the assay office still large | | not used |

`out-3.png` (the less wrong of the two) is in the candidate.

**What else changed, in all three:**
- **The signs lost their letters.** CONSOLATION IMPROVEMENT COMPANY, the saloon's gilt and the assay office's board
  are blank boards in the outputs. The brief allows illegible marks; the night overlay (the gilt sign) the builder
  re-derives will need the lettering back from the old plate.
- **The puddles are dull dark sheens**, as the prompt asked, not the old bright blue.
- **Fewer stars** and calmer, darker ground. No new words, people or animals in any window.

## The stitch

`python3 tools/art/main-street-redraw.py stitch --use 2=out-2-fix.png` -> `art/staging/room-02/redraw/candidate-3700x864.png`
(the windows used are recorded in `candidate.json`). The tool gained `--use N=FILE` so a correction can stand in for a
window without overwriting the operation's own output.

- **x ~890-1925 (windows 1 and 2): clean.** Both sit within ~12 px of the street, so the feathered overlap is one
  picture.
- **x ~1785-2750 (windows 2 and 3): ghosted.** Window 3 sits up to ~40 px off where window 2 is, so the saloon's porch,
  posts and the trough appear twice in the overlap (`checks/seam-2-3-ghosting.png`). This candidate cannot ship as it
  stands.

## For Tyler and the builder

Window 3 is the one left undone. Two corrections did not hold it in place: asked to keep every building where it is,
the generator re-composed the east end both times (larger hotel and assay office, the porch moved). Options, all the
builder's or Tyler's:

1. A new operation for window 3 only (the cap and the spend cap are both spent: it needs both raised), perhaps with a
   narrower window that holds only the saloon to the assay office.
2. Ship window 1 and window 2's corrected drawing over x 0 to ~2240 of the street, and keep the old plate east of the
   saloon, with a hand-made seam in the saloon's own wall. The hands would differ across the saloon.
3. Leave Main Street as it is.

Every door, exit and stand still has to be checked against the room before any of it is promoted, as the brief says.


## The second round (after "Raise both caps")

**Operation 6, window 3 again** (`window-3-v2.txt`, `window-3-v2.spec.json` -> `out-3-v2.png`): the prompt plus a
tracing of the window's own outlines (`window-3-outlines.png`) as a fourth image. Closer, still not in place: 20-40 px
right and up, growing toward the right edge (`checks/edges-ov3v2.png`).

**What all three window-3 tries had in common** was not re-composed buildings but one smooth error: the whole window
drawn a few percent larger and shifted. That is undone by a tool, with no operation:
`tools/art/main-street-register.py N SOURCE OUT` measures local shifts on a grid of tiles, fits one affine map by least
squares (dropping tiles it does not explain), and resamples the output through it with nearest-neighbour. Where the
operation pushed a strip off its canvas, the window's own street fills it, coarsened to the redraw's pixel size and
graded to the redraw's colour row by row, feathered over 16 px. Each run writes `<out>.json`.

| Window | Source | Map (x, y scale) | Off before (median / 90%) | Off after | Filled from the window |
|---|---|---|---|---|---|
| 1 | `out-1.png` | 1.006, 1.148 | 21 / 27 px | **4 / 10 px** | a 9 px sliver at the left edge |
| 2 | `out-2-fix.png` | 1.012, 1.042 | 10 / 17 px | **4 / 10 px** | a 6 px sliver at the right edge |
| 3 | `out-3.png` | 1.069, 1.194 | 39 / 55 px | **4 / 9 px** | ~90 px at the right (the far road and hills) and 11 px at the left |
| 3 | `out-3-v2.png` | 1.064, 1.064 | 33 / 46 px | 5 / 12 px | (not used) |
| 3 | `out-3-fix.png` | 1.048, 1.063 | 55 / 62 px | 7 / 17 px | (not used) |

Window 3 uses the **first** try, registered: it lands closest and its pixels are crisper than v2's
(`checks/edges-ov3-registered.png`). Numbers are at the window's 1536 x 1024 size; on the 3700-wide street each is
x 1.263.

**The candidate:** `python3 tools/art/main-street-redraw.py stitch --use 1=out-1-registered.png 2=out-2-fix-registered.png 3=out-3-registered.png`
-> `candidate-3700x864.png` (`candidate.json` records the sources). **Both overlaps are clean now**
(`checks/seam-2-3-registered.png`: the saloon and the trough appear once). Beside the plate:
`renders/room-02-main-street-redraw-candidate-beside-the-plate.png`.

**For the builder, still, before it is promoted:**
- every door, exit and stand checked against the room: the fronts sit within ~5 px (median) of the plate at window
  size, ~6 px on the street; the worst tiles are ~10-12 px;
- **the y scales of windows 1 and 3 (1.15, 1.19)** mean those operations drew the street taller; registration
  squeezes them back by dropping a row in every six or seven. It does not show at game size; look at the planks;
- the far-right ~110 px of the street (the road out) is the old street coarsened, not redrawn;
- the signs are blank boards (the gilt overlay needs its lettering from the old plate), the puddles dull;
- the dawn plate and the funeral notice overlay are re-derived from whatever is promoted.

The seventh operation is held.

## The Company's sign put back (Tyler, 2026-11-11: "It's missing the Consolation Improvement Company sign")

All three window-1 drawings left the board blank. No operation spent: `tools/art/main-street-sign.py out-1-registered.png out-1-signed.png`
lifts the lettering from the window itself (the shipping plate drawn down; Otsu's threshold on the board, pieces
touching its frame dropped), puts it on a 2 px grid (the stitch draws it up 1.263x, so a letter pixel is ~2.5 px on the
street), scales it to the redraw's slightly narrower board (0.923) and centres it there, and paints it in the old gilt
darkened as the whole redraw is darker, lifted 15%, with a one-pixel shadow. The candidate is stitched from
`out-1-signed.png` now (`candidate.json`). Old and new at game size: `renders/room-02-main-street-redraw-company-sign.png`.

**Made more readable** (Tyler, 2026-11-11: "It's a bit hard to read now"): the letters are now kept at the old
plate's own resolution (BLOCK 1, not the redraw's 2 px grid), the gilt is brighter (GILT 1.4: colour 116,95,46) and
the shadow deeper. They are finer than the planks around them, which is the price of reading. The night overlay that
lights the sign (the gilt) still has to be re-derived against this board by the builder.
