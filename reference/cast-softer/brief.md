# The undertaker and Madame Ozymandia, softer: for the session with the image key (errata 123)

Written 2026-11-06. **No new authorization is needed.** One operation from `cast-unify` (75 authorized by Tyler for redraws that make the cast one artist's work; 60 spent when this was written), plus one correction if it plainly misses.

## Why

Tyler, 2026-11-06, of the pre-playthrough art check:
- "The undertaker feels too short and stout with a giant body/head compared to Thad's. He also is too detailed compared to Thad."
- "Ozymandia has too much detail compared to Thad."

Those pictures predated the cast redraw (errata 111 J and K) and the one level (112). The current art answers part of each note:
- **The undertaker's head** is about Thad's size now, and he sits on Thad's grid.
- **Ozymandia** is on the same grid.

Looked at again beside Thad (`undertaker-beside-thad.png`, `ozymandia-beside-thad.png` in this folder, each in his or her own room at game size), both still read busier than Thad:
- **the undertaker:** harder shading in the face and arms, and shoulders much wider than Thad's;
- **Ozymandia:** a beaded necklace and pendant, rings, and modelled facial shading Thad does not have.

Tyler asked that the open items proceed on the recommendation, which is one softer redraw of both.

## Read first

- `CLAUDE.md`, especially the character style gate: **too sharp is the usual miss**.
- Errata 111: B (versions come from the master, never from each other), J (Ozymandia), K (the undertaker at his bench).
- Errata 112 (one level: a man is 115 art pixels).

Never touch `wtlangdon-design/anchorage`.

## The operation (cast-unify, next free batch number)

**Images:**
1. Their own crops of the locked cast master (`art/staging/cast-master/master-02.png`, laid out by `tools/art/cast-master-sheet.py`), on a board with Thad's cast-sheet self beside them at the same scale, as batches 16 and 17 built theirs (`art/staging/cast-unify/batch-17/board.png`).
2. The two side-by-sides in this folder, to show the miss.

**Prompt, in the cast-unify manner** (the batch-16 prompt is the model):
- the same two people, in the same poses their current sheets use:
  - the undertaker at his bench holding his plane at his chest: turning it, sighting along its sole, thumbing the blade, looking up;
  - Ozymandia seated, fingertips at her temples, and her other current poses;
- the same face, hair, age, clothes and colours as the master;
- **drawn as simply as the hero:**
  - flat, soft shading, with only one or two tones per surface;
  - no fine lines in the faces;
  - Ozymandia's necklace as a few plain beads, with no pendant detail and no rings;
  - the undertaker's shoulders no wider than an ordinary lean man's, as the hero's are.
- Crisp pixel edges against magenta, no glow, no blur, no text.

## Cut, measure, wire

1. **Cut** each pose as its current sheet was cut:
   - for the undertaker, `tools/art/cast-unify-cut.py`, then `tools/art/waist-matte.py` for his waist along the bench's slanted back edge (errata 111 K);
   - for Ozymandia, `tools/art/room16-ozymandia.py`'s layout (errata 111 J; the ball stays in front, plane 1).
   - Then snap both with `tools/art/one-level.py`.
2. **Overwrite** `art/actors/room-13-undertaker-master.png` and `art/actors/room-16-ozymandia.png`, keeping every frame rectangle in their ambient files, or updating them.
3. **Measure before anyone looks:** `python3 tools/art/cast-vs-thad.py` for each, recording texture against Thad's.
   - The flag is 1.35× Thad's.
   - The undertaker's head (crown to chin) should be within 10% of Thad's at that depth.
4. **Prove it:**
   - `npm test`, especially `tests/master-cut-edges.test.mjs`, `tests/one-level.test.mjs`, `tests/movement.test.mjs` and `tests/scale.test.ts`;
   - `node tools/run-all.mjs`;
   - `node --experimental-strip-types tools/art/figure-audit-sheets.mjs <out>` to see each beside Thad.
5. **Record** an errata entry: the measurements, the operations spent, and anything left for Tyler's playthrough. Open a pull request and merge when green.

**A sheet that plainly misses** (still busier than Thad, poses changed, edges fringed) gets one correction: attach the new side-by-side and ask only for what missed. Stop after two operations.
