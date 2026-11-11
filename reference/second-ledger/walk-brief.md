# Winnie walks to the loose board: for the session with the image key (errata 269)

Written 2026-11-10. Tyler, 2026-11-10, of the open items after the play-through: "handle the open items". This is the last drawing doc 95 row 74 waits on. **Budget: asset `room-05-second-ledger`, cap 3, two spent, one left (errata 181). This brief is that one operation. Check `art/staging/ledger.json` first; if the operation is not there, stop and say so. Do not change `art/staging/caps.json`.**

## Why

Everything else for the retrieval is drawn (errata 181): `art/actors/winnie-second-ledger.png` has her standing, kneeling at the board, reaching under it, and standing with the ledger open and closed; the board lifted is `art/objects/room-05/board-lifted.png`; the ledger on her counter is in the game from `T_SECOND_LEDGER` (errata 269). What is missing is how she gets from behind her counter to the board. Tyler's rules: nobody pops in or out of view, and a walk needs six frames. She has no walk.

## What to draw

**One sheet: Winnie walking, six frames, in profile, facing LEFT.** Full figure, head to boots, in the same dark charcoal blouse and long dark skirt as `art/actors/winnie-second-ledger.png` frame 0, the same height, the same head and hair. A plain, unhurried walk: the skirt swings, the boots show under its hem, her hands are at her sides or lightly holding the skirt. Six evenly spaced frames of one full stride, all on one ground line, on the key colour, each in its own cell.

Attach, as the style gate requires: `art/actors/winnie-second-ledger.png` (her, at this size), and a frame of Thad in Room 5 (`renders/room-05-second-ledger-retrieval.png` has both). Thad's look is the standard: flat, soft-shaded, low in texture. Too sharp is the usual miss.

The one sheet is used both ways by the builder: mirrored for the walk back.

## Hand back

- The raw sheet under `art/staging/room-05/second-ledger/walk/`, and the prompt and spec beside this brief as `walk-03.txt` and `walk-03.spec.json`.
- A note of anything that missed (height against frame 0, the skirt's colour, a frame out of step).
- Do not cut it into `art/actors/` or touch content: the builder does the staging (behind the counter to its left end, round it, down to the board, and back), the board's `lifted` state, and doc 95 row 74 from B to A.

Never touch `wtlangdon-design/anchorage`. Never print or write the image key.
