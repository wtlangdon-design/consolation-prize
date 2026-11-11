# Main Street, redrawn in the side streets' hand: handed back (reference/main-street-redraw/brief.md)

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
