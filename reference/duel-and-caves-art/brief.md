# The duel crowd, and Rooms 33 and 34 (after errata 363)

For the image session. **No operation is spent until Tyler pastes a prompt below into it.** At the time of writing about 43,500 tokens are left of the 4,625,000 ceiling (reference/acts-two-to-four-art/handback.md), which at that brief's rate (about 11,000 a picture) is three or four pictures. Part A fits it; Part B needs more, and says so.

Every figure is generated against a frame of Thad in the actual room (CLAUDE.md character style gate, step 1): flat, soft-shaded, low in texture, and never "too sharp". Key colour magenta. Nothing is a new character.

## Part A: the duel crowd and Fanshawe in the street (Act IV art finding 4)

- **Why:** at the climax, the people watching the last duel are drawn in another game's style: crisp, fully modelled faces, hard internal contrast, bigger heads than Thad's (Fanshawe's face is about one and a half times as wide as Thad's at the same depth; the boy's head is bigger than Thad's on a body three quarters his height), and the left group is brighter than Thad (mean luminance 66.8 against his 59.0).
- **What:** the same people, in the same clothes and the same arrangement, redrawn to Thad's look in Main Street at game size: about seven heads tall, small softly shaded heads, flat colour, no brighter than he is.
  1. **The town, left** (`art/actors/room-02-duel-town-left.png`, record `content/ambient/duel-town-left.json`): the old woman in the red shawl, the man in the brown coat and hat, the man in the apron with his arms folded, the barman with the towel, the woman in the blue bonnet, the boy in the cap. Poses: watching (rest), and three more in which a different few lean to each other.
  2. **The town, right** (`room-02-duel-town-right.png`, `duel-town-right.json`): the man with the rope and red neckerchief, Mr. Sheng in his apron, the man in the waistcoat with a hand to his chin, the gentleman in the top hat, the woman in spectacles holding a book. Poses as the left group's.
  3. **Colonel Fanshawe** (`room-02-duel-fanshawe-standing.png`, `duel-fanshawe.json`): top hat, grey hair and moustache, brown waistcoat and watch chain, long black coat. Poses: thumbs in his waistcoat, turned to Thad (rest); a hand held out; looking at his watch; tipping his hat.
- Each is one picture holding all its poses, so the figures stay the same people from pose to pose.

## Part B: Rooms 33 and 34, under Prosperity (Act IV art finding 5)

- **Why:** both caves are drawn on a coarse 8-pixel block grid with checker dithering over every stone; Prosperity above them and every other room are finer (Thad's room is about 5). The walk down from Prosperity is a visible change of artist. And the lamp Thad carries down (the one he took from his hotel room, a tall glass-chimney table lamp) is drawn in both as a barn lantern, so it is three different lamps.
- **What:** each plate redrawn at the same 1920 x 864 size with **the same composition**: the same camera, every object in the same place, so that the rooms' click areas still fit. Finer pixel, about Prosperity's; no checker dither; warm amber lamplight; flat and soft like Thad. In both rooms the lamp is the hotel's table lamp from Thad's room (`art/backgrounds/room-19-thads-room.png`, the lamp on the desk at about x 760-815, y 355-490), lit.
  1. **Room 33, the listening chamber** (`art/backgrounds/room-33-listening-chamber.png`): a chamber of rounded stones, a tunnel mouth at the left, the lamp standing on the floor at about the middle.
  2. **Room 33 after the break-through** (`room-33-listening-chamber-after.png`): the new Room 33 with the same dark opening broken through the wall right of centre that the current after-plate has. Made as an edit of the new 33, so the two match everywhere else.
  3. **Room 34, under Prosperity** (`room-34-under-prosperity.png`): the shaft at the left with its rope, the stump with the lamp and the tuning fork on it, the timber frame in the middle (two posts, a cap beam, braces), the dark tunnel and rock face at the right.
  4. **Room 34 after** (`room-34-under-prosperity-after.png`): the new Room 34 with exactly the current after-plate's differences, the gold seam running diagonally across the right rock face and the old lantern hanging on the left post. An edit of the new 34.

## Paste one of these into the image session

**Prompt A (the duel crowd; fits the budget that is left):**

> Read `reference/duel-and-caves-art/brief.md` on main and draw Part A, items 1 to 3, in that order. Add a cap entry for each to `art/staging/caps.json` (asset ids `room-02-duel-town-left`, `room-02-duel-town-right`, `room-02-duel-fanshawe`, cap 2 each); Tyler authorizes up to six operations for this brief. Stop at the token ceiling. Generate each against a frame of Thad standing in Main Street at game size, flat and soft-shaded like him, the same people in the same clothes and arrangement as the current sheets, every pose of a sheet in one picture. Put the results on a branch named `duel-and-caves-art` with a `reference/duel-and-caves-art/handback.md` saying what was spent, and do not wire anything into the game: the main session wires it.

**Prompt B (Rooms 33 and 34; needs the ceiling raised):**

> Read `reference/duel-and-caves-art/brief.md` on main and draw Part B, items 1 to 4, in that order. Tyler raises the token ceiling in `art/staging/caps.json` by 100,000 for this brief. Add a cap entry for each (asset ids `room-33-redraw`, `room-33-after`, `room-34-redraw`, `room-34-after`, cap 2 each); Tyler authorizes up to eight operations for Part B. Redraw each plate from the current one at the same size and composition, every object in place, at a finer pixel with no checker dither, the lamp the hotel's table lamp from Thad's room; make each after-plate as an edit of its new plate. Put the results on the branch `duel-and-caves-art` (with Part A's, if Part A ran) and add to its `handback.md`; do not wire anything.
