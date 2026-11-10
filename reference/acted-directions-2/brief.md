# Acted directions, the second pass: every pose still to draw, for the session with the image key

Tyler, 2026-11-10, told that 21 directions are printed for want of a pose and that it is "the biggest remaining gap to the Monkey Island feel": **"I want this funded too."** Errata 261.

`docs/95-acted-directions.md` sorts every stage direction the game shows: **A** is acted, **B** is physical and waits on a pose, **C** stays printed. The first brief (`reference/acted-directions/brief.md`, 2026-11-06) drew the nine that were B then. Twenty-one are B now, across twelve figures. This brief draws them. When a pose is cut and wired, its row moves from B to A and the game acts it.

**Budget: eighteen operations,** under the asset `acted-directions-2` in `art/staging/caps.json` (already recorded there, on Tyler's "I want this funded too", the size left to this session by his "I defer to you on how big of a budget you think we need"). Thirteen sheets, one for each figure below and two for Thad, and five held for corrections against Thad. Check `art/staging/ledger.json` before each operation and log each. If the eighteen run out, stop and say which rows are left; do not raise the cap.

**Do `reference/final-look/brief.md` first.** It redraws Mr. Pratt (both sheets) and the rule-keeper. Their new poses here are poses of the redrawn men, on the redrawn sheets.

**Nothing here may be written by the builder.** No lines. Do not touch `content/` or `docs/`. Never touch `wtlangdon-design/anchorage`.

Read first: `CLAUDE.md` (the character style gate; too sharp is the usual miss), `reference/acted-directions/brief.md` (its rules stand: the locked cast master, the in-game Thad on every board, one level of pixelation, the head measured by ruler, and how its hand-back recorded frames), `docs/95-acted-directions.md` (rule 4, and the table), and `reference/press-pull/handback.md` for how a new Thad clip was cut.

**Each new pose is added to the figure's own sheet as new frames after the last,** in cells of the sheet's own size, soles on the sheet's own row, the existing frames untouched pixel for pixel (assert it, as `tools/art/objects-second-pass-patches.py` does). Whatever a figure holds in his other frames he holds in these, so nothing appears or vanishes (errata 111). In the hand-back, for every row: the frame numbers, a suggested order and seconds for doc 95's Frames and Seconds columns, and the pose beside Thad at game size.

When done: commit to a branch named `acted-directions-2-art` with `reference/acted-directions-2/handback.md` beside this brief, push it, and stop. The wiring (doc 95's rows moved to A, the extraction, the tests, the replay) is done by the other session.

## The rows, by figure, in the order to draw them

### `pratt`

- **Sheet:** art/actors/room-25-pratt-master.png (after reference/final-look section 1 has redrawn it: these poses are of the redrawn man)
- **Row 120** (combinations (raccoon_in_coat on pratt, THE SALE)): *He opens the coat a little and looks in.*
- **Row 121** (combinations (raccoon_in_coat on pratt, THE SALE)): *He counts out the money, coin by coin.*
- **Row 122** (combinations (raccoon_in_coat on pratt, THE SALE)): *He holds out his other hand.*
- **Row 123** (combinations (raccoon_in_coat on pratt, THE SALE)): *Thad gives back the hen. Pratt gives back the coat, empty.*

### `pratt_jump`

- **Sheet:** art/actors/room-25-pratt-jump-master.png (after reference/final-look section 1)
- **Row 131** (combinations (chalk on claim_marker, the turn)): *Pratt holds out his hand. Thad gives him the chalk. Pratt writes underneath, slowly: 104.*

### `gulch_rule_keeper`

- **Sheet:** art/actors/room-52-rule-keeper.png (after reference/final-look section 2)
- **Row 84** (dialogue/gulch-rule-keeper RUL_G1 option 1): *He taps his head.*
- **Row 90** (combinations (tuning_fork on fiddle, G5)): *He tips a pinch of dust onto the plank in front of Thad.*

### `thad`

- **Sheet:** his shipping art; new clips beside art/actors/thad-*/, as the haul and the pick-fit clips were made (two sheets: the rod and the chalk standing; the crawl and the blanket low)
- **Row 80** (combinations (brass_rod on left_passage and right_passage, at the line, first)): *He holds the rod out down the left passage. It trembles in his hands like a plucked string. He turns it to the right passage. It goes still.*
- **Row 112** (rooms/ozymandias_tent seance_table USE (in the dark)): *Thad goes down on his hands and knees and under the cloth.*
- **Row 130** (combinations (chalk on claim_marker, the turn)): *Thad chalks it on his own stake, under the number: $11,000.*
- **Row 136** (rooms/livery grievance_s_blanket PICK_UP (with leave)): *Thad lifts the blanket off her, a corner at a time. Grievance watches each corner go.*
- Row 112 (under the cloth) is two frames at most: going down, and gone. Row 80 is two frames: the rod out to the left, trembling (a derived second frame may shake it), and to the right, still.

### `gulch_lookout`

- **Sheet:** art/actors/room-51-lookout.png
- **Row 81** (combinations (clarion on gulch_lookout, G3)): *He reads page one twice, moving his lips at the good part. Then he looks at Thad with something like envy.*
- **Row 82** (combinations (clarion on gulch_lookout, G3)): *He folds the paper into his shirt, over his heart, like a deed.*

### `gulch_deacon`

- **Sheet:** art/actors/room-52-deacon.png
- **Row 87** (dialogue/gulch-deacon DEA_G1 option 2): *He polishes a glass.*
- **Row 88** (dialogue/gulch-deacon VES_G1 option 6): *He points down the bank, at the bar.*

### `winnie`

- **Sheet:** art/actors/winnie-counter-sheet.png; errata 111 G and H (the counter people)
- **Row 74** (dialogue/winnie WIN_B2 option 3): *She produces it from under the floor.*
- Her row also needs the loose board lifted (reference/second-ledger, errata 181). If that cannot be had in the one sheet, draw her pose and say so; the row stays B until both exist.

### `ozymandia`

- **Sheet:** art/actors/room-16-ozymandia.png
- **Row 109** (dialogue/ozymandia OZY_E1 option 2): *She turns the lamp down to a bead.*

### `frame`

- **Sheet:** art/actors/room-09-frame-master.png
- **Row 132** (dialogue/frame FRA_A1 option 6): *He locks the type, inks it, and stands back from the press with his arms folded.*
- He now has a stood-back sheet (art/actors/room-09-frame-stood-back.png, errata 253). Wanted here: locking the type and inking it, at the press, two frames. The standing back is drawn.

### `deke_vessel`

- **Sheet:** his shipping art (errata 111 F)
- **Row 70** (dialogue/deke-vessel root option 9): *He raises his glass an inch.*

### `letter_writer`

- **Sheet:** art/actors/ambient-letter-writer-master.png
- **Row 69** (dialogue/amb-letter-writer root option 4): *He puts his pen down.*

### `gulch_panner`

- **Sheet:** art/actors/room-53-panner.png
- **Row 96** (dialogue/gulch-panner PAN_G1 option 7): *He snorts.*
- One frame: the snort, head back a little. Lowest priority.

## Two things a pose cannot be

- **Not a new idea.** The pose is what the direction says and no more. Nothing is added to a hand that the words do not put there.
- **Not a mark.** No pose draws the eye to a line that matters (invariant 3). These are gestures in ordinary talk and ordinary business; draw them at the size of the figure's other gestures.
