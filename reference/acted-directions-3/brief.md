# Acted directions, the third pass: the running list of movements the rewrite needs

**Tyler, 2026-11-11,** after the street people were rewritten (errata 286): "make a running list of new character movements that need to be created to bring the new dialogue to life, and we can create those via CC as a next step". Errata 287.

**This is a running list.** The rewrite goes character by character. When a rewritten line has a physical stage direction no figure has a pose for, the direction goes into `docs/95-acted-directions.md` as class **B**, and its pose is listed here in the same pull request. `tests/movements-to-draw.test.mjs` fails if a B row is missing from this list or a row here is not B. When a pose is drawn, cut and wired, its row in doc 95 moves to **A** and comes off this list.

**It is not drawn yet, and it has no budget yet.** Drawing it is the next step, in the session with the image key, once the rewrite has gone far enough that one batch is worth a session (Tyler's call). Ask Tyler for the operations first. **Do not edit `art/staging/caps.json`.** A fair size: one sheet per figure below, plus about a third again held for corrections against Thad.

**Nothing here may be written by the builder.** No lines. Do not touch `content/` or `docs/` while drawing. Never touch `wtlangdon-design/anchorage`.

## Read first

- `CLAUDE.md`: the character style gate. Too sharp is the usual miss.
- `reference/acted-directions-2/brief.md`: its rules stand, and so does its process:
  - the locked cast master;
  - the in-game Thad on every board;
  - one level of pixelation;
  - the head measured by ruler;
  - new poses appended after the last frame, with the existing frames untouched pixel for pixel;
  - the hand-back.
- `docs/95-acted-directions.md`: rule 4, and the table.

**Whatever a figure holds in his other frames, he holds in these, and the reverse (errata 111):** nothing appears or vanishes between poses. Where a new pose needs a prop the figure does not carry today, the prop is added to every frame of his sheet, and that is said under his entry below.

When done, commit to a branch named `acted-directions-3-art`, with `reference/acted-directions-3/handback.md` beside this brief. Push it, and stop. The wiring is done by the other session: the doc 95 rows moved to A, the extraction, the tests and the replay.

## The list, by figure

### `letter_writer` (Lower Street)

- **Sheet:** `art/actors/ambient-letter-writer-master.png`. Six frames:
  - 0 standing, his writing case under his arm;
  - 1 breath;
  - 2 the case held open;
  - 3 touching his hat;
  - 4 the case closed at his chest;
  - 5 the pen down on his board, his hand lifted.
- **Row 167** (his root list, option 7: Thad's "Thaddeus Grubb. Musician, of some reputation.", answered "'Gentleman of independent means, in music.'"): *He writes it down.*
  - **Needs:** the case held open as in frame 2, and his pen moving on the page, his head bent to it. Two frames, so the pen visibly travels.

### `bell_ringer` (Lower Street)

- **Sheet:** `art/actors/room-43-bell-ringer.png`. Five frames:
  - 0 rest, the mallet at his side;
  - 1 breath;
  - 2 the mallet raised;
  - 3 the blow;
  - 4 talking, a hand out.
- **He has no bottle today.** Doc 07 has always had him drunk, but nothing shows it. Both rows below are about his bottle, so the bottle is drawn into every frame: in his free hand, or in a vest pocket, wherever it can stay through the strike. Only then can these poses hold it.
  - Until it is drawn, both directions print a bottle the player cannot see. That is the one row on this list where the printed text is ahead of the picture.
- **Row 168** (his root list, option 6: "I've tuned a cathedral organ. A bell is nothing.", answered "Could you tune this?"): *He holds up his bottle, hopefully.*
  - **Needs:** the bottle raised toward Thad at chest height, his face hopeful. An acted direction prints nothing (doc 95 rule 1), so the face has to carry "hopefully"; "Could you tune this?" carries the rest.
- **Row 169** (his root list, option 7: "Doesn't it bother you?", answered "I'm the only man in town who can't hear it."): *He looks up at the bell, then down at the bottle.*
  - **Needs:** two frames, his head tipped up at the bell and then down at the bottle in his hand. The order of the two looks is the joke, so the frames play in that order.

### `man_leaving_tomorrow` (Main Street)

- **Sheet:** `art/actors/man-leaving-tomorrow.png`. Six frames:
  - 0 rest, hands in pockets, the bag at his feet;
  - 1 breath;
  - 2 reaching for the bag;
  - 3 lifting it in one hand;
  - 4 setting it down, a hand on the handle;
  - 5 talking.
- **Row 172** (his root list, option 6: "Could I carry your bag to the coach?", answered "It goes when I go."): *He grips it with both hands.*
  - **Needs:** the bag held up against his chest in both arms, protective, as a man holds something he will not be parted from. Frame 3 is one-handed and does not stand in.

### `map_seller` (Main Street)

- **Sheet:** `art/actors/ambient-map-seller-master.png`. Five frames:
  - 0 the map held up;
  - 1 breath;
  - 2 the map held out, offered;
  - 3 the map lowered;
  - 4 pointing at the map.
- **He has no pencil today.** The pencil goes behind his ear in every frame, so that it can come down to the map in these poses without appearing from nowhere.
- **Row 173** (his root list, option 6: "Do you have one with pianos on? I'm a tuner.", answered "I do now, sir!" and "There's your piano. Twelve feet down."): *He draws a small piano on a map, beside a cross.*
  - **Needs:** two frames, the map held flat at his chest and the pencil drawing on it, his head bent to it. The piano and the cross are too small to read at game size and are not drawn.
  - **For the wiring session:** acted, the direction prints nothing (doc 95 rule 1), so "beside a cross" is no longer read, and "Twelve feet down." carries the burial alone. If that reads thin in the replay, the row goes to C instead, and the drawn frames serve as an idle break.

## Done

Nothing yet.
