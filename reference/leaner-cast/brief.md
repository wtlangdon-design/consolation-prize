# Frame and the three judges, leaner: for the session with the image key (errata 137)

Written 2026-11-06. **No new authorization is needed.** These are redraws of recurring characters from the locked cast master, which is what asset `cast-unify` is for: Tyler authorized 75 operations "even if it means that lots of the characters need to be redrawn" (errata 111, 112 C). 61 were spent when this brief was written. **Take up to 4 here**: one sheet for Frame, one sheet for the three judges, and one correction for each if it plainly misses. The acted-directions brief (`reference/acted-directions/brief.md`, if present) draws from the same budget, so check `art/staging/ledger.json` before each operation.

## Why

Tyler, 2026-11-06: **"Ignatius and the 3 judges are all really thick compared to Thad. They look like dwarves vs characters from this same universe of characters."**

All four pass the height test, drawn within 5% of the room's man (`tests/scale.test.ts`). They fail on **build**: shoulders broader than Thad's, and heads larger than his at the same height, so they read short and squat beside him. The side-by-sides in this folder show each one in his room at game size, beside Thad at the same depth:

- `frame-beside-thad.png`: Frame in the Clarion.
- `judges-standing-beside-thad.png`: the three judges on the hotel porch for Duel Three, enlarged ×3 because they stand far back.
- `judges-seated-beside-thad.png`: the three judges at the table in the Nugget's back room.

Errata 111 D already says frontier people are of ordinary, mostly lean build, measured as torso width over height (Thad 0.32), with only Pratt and Fanshawe heavy. Pratt was redrawn "leaner, still sturdy" (errata 112 J) on the same complaint. Do the same here.

## Read first

- `CLAUDE.md`, the character style gate.
- Errata 111: B (versions come from the master, never from each other), D (builds), E (the three judges' designs), L (Frame's notebook in every pose), O (the seated judges), T and U (the standing judges on the porch boards).
- Errata 112 G: one level, a man is 115 art pixels.
- `docs/55-full-game-build.md` §8.

Never touch `wtlangdon-design/anchorage`.

## Operation 1: Frame (cast-unify, next free batch number)

- **Images:**
  1. His crop of the cast master (`art/staging/cast-master/master-02.png`, laid out by `tools/art/cast-master-sheet.py`), on a board with Thad's cast-sheet self beside him at the same scale.
  2. `frame-beside-thad.png`.
- **Prompt, in the cast-unify manner** (batch 18's prompt, `reference/cast-unify-18.txt`, is the model):
  - The same man, Ignatius Frame, the newspaper editor: the same face, untidy brown hair, pencil behind his ear, rolled sleeves, ink-stained apron and colours.
  - His four current poses, with his notebook in every one: rest, talking with a hand out, writing a quote, leaning in.
  - **Built like the hero: lean and narrow.** His shoulders no wider than the hero's, his head the same size as the hero's, and the same height as the hero, crown to sole.
  - The same pixel size, soft shading and dark outline. Crisp edges on magenta, no text.
- **Cut** as `tools/art/room09-frame.py` cuts him, then snap with `tools/art/one-level.py`. Overwrite `art/actors/room-09-frame-master.png`, keeping the frame rectangles in `content/ambient/frame.json` or updating them.

## Operation 2: the three judges, seated and standing, on one sheet

- **Images:**
  1. Their three crops of the cast master on a board with Thad.
  2. Both judge side-by-sides from this folder.
- **Prompt:**
  - The same three men (errata 111 E):
    - the bald judge with white mutton-chops;
    - the gaunt judge with the waxed moustache and green cravat;
    - the bearded former miner in the grey hat.
  - **Lean, ordinary builds like the hero.** "Gaunt" should read gaunt. Heads the same size as the hero's.
  - Two rows:
    - **Row 1, standing**, each in his two current porch poses: watching; and conferring, a nod, a hand to his beard. The full figure stands at the hero's height.
    - **Row 2, seated** behind nothing (the room's table is drawn by the plate). Each in his four current poses: hands folded, leaning to confer, a nod, drumming his fingers.
- **Cut:**
  - **Standing:** as the porch judges were cut (`tools/art/room02-duel-cast.py` and errata 111 T, U and V). They stand on the boards (`standsOn`) and the bearded judge faces the duel (`tests/faces.test.mjs`).
  - **Seated:** as `tools/art/room04-judges.py` / `cast-unify-judges.py` cut them, waists on the table's back edge (y 318).
  - Then snap with `one-level.py`.

## Measure before anyone looks

- **Side-by-side:** for each figure, run `python3 tools/art/cast-vs-thad.py` and `node --experimental-strip-types tools/art/figure-audit-sheets.mjs <out>`.
- **Build:** the head (crown to chin) within 10% of Thad's at that depth, and the shoulders no wider than 1.15× Thad's. Measure these on the side-by-side. They flag; they do not decide.
- **Tests:** `npm test`, especially:
  - `tests/scale.test.ts`
  - `tests/master-cut-edges.test.mjs`
  - `tests/one-level.test.mjs`
  - `tests/movement.test.mjs`
  - `tests/staging-clear.test.ts`
  - `tests/faces.test.mjs`
  - `tests/stands-on.test.mjs`

  Then run `node tools/run-all.mjs`.

## Record and merge

Write an errata entry at the next free number, with the measurements, the operations spent, and anything left for Tyler's playthrough. Open a pull request and merge it when green.
