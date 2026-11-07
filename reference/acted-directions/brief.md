# Acted directions: the poses still to draw (errata 141), for the session with the image key

**Tyler, 2026-11-06.** He was told "a few directions are still printed rather than acted, such as '(stamping)' during the filing. Acting them out needs new poses." He answered: **"then let's do it? Lol"**.

`docs/95-acted-directions.md` sorts every stage direction the game shows:
- **A** is acted now;
- **B** is physical but needs a pose nobody has drawn;
- **C** stays printed.

This brief draws the B poses. Nine directions are B, across five characters. When a pose is cut and wired, its row in doc 95 moves from B to A, and the game acts it.

## The budget

- **Five operations, one sheet per character, plus at most three corrections.** That is eight at most.
- They come from asset `cast-unify` in `art/staging/caps.json` (75, Tyler, 2026-11-06). Operations 1 to 66 are spent (errata 139), so 9 are left, and this fits inside them.
- **Do not edit `caps.json`.** If more than eight are needed, stop and ask Tyler.
- Leaner Frame and the judges (`reference/leaner-cast/brief.md`, errata 137 to 139) are done. Nothing here is Frame or a judge. Frame's acted look-up (doc 95 row 29) uses his frames 3 and 0 as errata 138 drew them, so it needs no new pose.

## Read first

- `CLAUDE.md`, especially the character style gate. **Too sharp is the usual miss.**
- Errata 111:
  - **B:** a new pose is drawn from the character's crop of the locked cast master (`art/staging/cast-master/master-02.png`), never from a later version;
  - **F:** Thad and Deke keep their shipping art;
  - **G and H:** the counter people.
- Errata 112: one level of pixelation; a man is 115 art pixels tall.
- **Errata 139: the board is the in-game Thad.** Every cast-unify board before it put Thad's cast-sheet drawing beside the character. That drawing's head is about 1.3× the in-game Thad's, and every figure drawn against it inherited the big head. These boards use `art/actors/thad-stand-front/stand-00.png`, scaled to the master Thad's height. **Measure each new pose's head against him, by ruler, crown to chin.** The automatic neck-finder fails on hats and beards (errata 138).
- `docs/95-acted-directions.md`: the rules and the table.
- Never touch `wtlangdon-design/anchorage`.

## The boards

`python3 tools/art/acted-boards.py reference/acted-directions` writes them. They are already in this folder:

| Board | What is on it |
|---|---|
| `winnie-board.png` | the in-game Thad and Winnie's master crop, at one scale on magenta |
| `sump-board.png` | the in-game Thad and Sump's master crop |
| `pratt-board.png` | the in-game Thad and Pratt's master crop |
| `deke-board.png` | the in-game Thad and Deke's master crop |
| `thad-board.png` | the in-game Thad from the front and from the back |

Attach each sheet's board first. Then attach the character's current shipping sheet, **for identity, build and pose register only**:
- Pratt's shipping sheets are leaner than the master (cast-unify 49, Tyler: "Leaner, still sturdy"), and the new poses take that build;
- Deke's and Thad's shipping art is canonical (errata 111 F).

## The five sheets

Each sheet is the same person, in the same clothes and colours, at the same size as the poses he has now. Draw only the new poses listed, each separate on magenta, with crisp pixel edges, no glow, no blur and no text. Ask for the hero's head size: one eighth of the man, measured on the in-game Thad on the board.

### 1 · Winnie at the Registrar's counter (`winnie_registrar`, Room 7)

- **Current sheet:** `art/actors/room-07-winnie.png`. Five frames, arms folded, cut at the waist on the far edge of the closed book at the counter's end (y 439 at x 1817).
- **New poses:**
  1. the county stamp raised in her right hand over a paper on that closed book;
  2. the stamp down on the paper;
  3. signing the paper with a pen, her head bent to it.
- **For** doc 95 row 60 (`stamping`, the filing) and row 10 (`She signs beside it.`, the sample laid on the counter).
- Waist and point of contact as errata 111 G: her hands on the book's top, nothing of her below its far edge.

### 2 · Registrar Sump (`sump`, Room 7)

- **Current sheet:** `art/actors/room-07-sump.png`. Five frames: rest, breath, writing, the stamp raised, looking up. Cut at the ledger's far edge (y 427 at x 1290).
- **New poses:**
  1. and 2. a rocker blotter rocked across the ledger page, at either end of its rock;
  3. Claim One's filing in a glazed frame, held up in both hands at the window, toward the customer's side of the counter.
- **For** row 62 (`He blots it.`, the filing) and row 58 (`He brings Claim One's filing to the window, under its glass.`).

### 3 · Nickel Pratt, in two places (`pratt` on his claim; `pratt_jump` at Prosperity)

- **Current sheets:**
  - `art/actors/room-25-pratt-master.png`, the rake row;
  - `art/actors/room-25-pratt-jump-master.png`, the mallet row.
- **New poses:**
  - **rake row:**
    1. his hat off, held at his chest, the rake leaning on him;
    2. the hat going back on;
  - **mallet row:**
    3. the mallet resting on the ground, his head bowed, looking at his own boots.
- **For** row 49 (`He puts his hat on.`, on his claim) and row 40 (`He looks at his feet, checking.`, at Prosperity).
- The build is his current one, leaner than the master's; it is attached for that. His hat is not counted in his height (`--hat`).

### 4 · Deke Vessel (`deke_vessel`, the Nugget)

- **Current sheet:** `art/actors/deke-vessel.png`. Five frames; his walk is `deke-vessel-walk.png`.
- **New pose:**
  1. his head bent, looking down to his right, at waist height, where Thad holds the watch out across the barrel. His hands stay at his belt.
- **For** row 12 (`He looks at the watch.`).

### 5 · Thad, with the Mercantile's pickaxe, from the back (Room 33)

- **Board:** `thad-board.png`. His shipping clips are the identity: `art/actors/thad-stand-back/`, `thad-reach-back/`, `thad-wrench-back/`.
- **New poses,** seen from behind as he faces the rock (he stands at 960,825 facing back):
  1. crouched, one hand feeling the ground for the pick's head in the dark;
  2. standing, fitting the head back onto the haft, one piece in each hand;
  3. standing, the mended pick held across him.
- **For** rows 4 (`He finds it and fits it back.`) and 6 (`He fits it back.`).
- **The swings themselves stay printed** (doc 95, for Tyler item 1). If Tyler rules the other way, the swings need their own sheet, which is outside this budget.

## Measure, then correct at most once each

1. **Measure each sheet before anyone looks:**
   - the head by ruler against the in-game Thad on the board (errata 139);
   - shoulders with `tools/art/build-vs-thad.py`;
   - texture with `tools/art/cast-vs-thad.py`, which flags at 1.35× Thad's.
   The numbers flag; they do not decide.
2. **A sheet that plainly misses gets one correction.** Plain misses are: too sharp, a head well over the hero's, a different face, poses touching, or magenta fringe.
   - Attach the board, the miss, and a side-by-side, and ask only for what missed.
   - Draw the correction from the master crop and the board, never from the miss (errata 111 B).
3. **Stop at eight operations in all.** Say which sheets still miss.

## Cut, one level, wire

1. **Cut** each pose as that character's sheet was cut:
   - `tools/art/cast-unify-cut.py --grid 1`, at the drawing's figure height, crown to sole (`tools/art/figure-height.py`, `--hat` for Pratt).
   - **Winnie and Sump** are cut at the waist on their surface (errata 111 G) and registered on the hands' row with `tools/art/bust-register.py --bottom`, so the resting hand does not pop between poses (111 H).
   - Then snap every sheet to one level with `tools/art/one-level.py`.
2. **Append the new frames to the existing sheet.** Every existing frame keeps its index. The new ones are 5, 6, … in the order above.
   - Update `frames` and `frameNote` in the ambient file.
   - Do not add them to `breaks`. An acted pose is played only by its direction.
3. **Move each row in doc 95 from B to A.** Fill in **Performed by**, **Frames** and **Seconds**, and a **Cue** where a sound lands. Suggested values:

   | Row | Performed by | Frames | Seconds | Cue |
   |---|---|---|---|---|
   | 60 `stamping` | winnie_registrar | `5 6 0` | 1.2 | `U-STAMP @2` |
   | 10 `She signs beside it.` | winnie_registrar | `7 7 0` | 1.5 | |
   | 62 `He blots it.` | sump | `5 6 5 0` | 1.6 | |
   | 58 `He brings Claim One's filing…` | sump | `7` (Holds `7`) | 1.2 | |
   | 49 `He puts his hat on.` | pratt | `5 6 0` | 1.5 | |
   | 40 `He looks at his feet, checking.` | pratt_jump | `5` | 1.5 | |
   | 12 `He looks at the watch.` | deke_vessel | `5` | 1.2 | |

   Then run `node tools/extract-content.mjs`.
   - Row 60's stamp now sounds from doc 95's cue. The `stamping` rule in `content/audio/sounds.json` then never fires. Leave it, or remove it in the same PR.
4. **Thad's two rows need one engine step first.** Today only an ambient figure can act a direction (`sprite.performs`; `engine/core/ActedDirections.ts`).
   - Thad's poses become a clip in `content/actors/thad.json` (for example `pick-fit`, facing back).
   - A doc 95 row naming the protagonist plays that clip on the actor (Actor.ts), as the opening's chores do (`content/sequences/opening.json`).
   - Extend `tests/acted-directions.test.ts` so that the protagonist's acted rows are held too.
5. **Prove it:**
   - `npm test`, especially `tests/acted-directions.test.ts`, `tests/master-cut-edges.test.mjs`, `tests/one-level.test.mjs`, `tests/movement.test.mjs`, `tests/scale.test.ts`, `tests/counter-surface.test.mjs` and `tests/staging-clear.test.ts`;
   - `npx tsc --noEmit`;
   - `node tools/run-all.mjs`;
   - in the running game, `node tools/gauntlet/acted-proof.mjs <out> filing-deed` and the other scenarios, after adding a scenario for each new row. The filing's fixture is `r7-f5`, and its counter click is world 1000,520.
6. **Record an errata entry:** the operations spent, the measurements, and anything left for Tyler's playthrough. Open a pull request and merge when green.
