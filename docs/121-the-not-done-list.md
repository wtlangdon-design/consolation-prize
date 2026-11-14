# 121 · The not-done list, done (2026-11-10)

Tyler, 2026-11-10, on the morning note's list of what was not done: **"Do all the Not Done things."** Designed, written and built under that and under errata 245's mandate ("Yes, build it all"; "feel free to change the story too"). One voice, to doc 59. Every change to how a puzzle is solved is a row of `docs/119-what-changed-overnight.md`.

Nothing here touches a load-bearing line, HOB_C1, the letters home, Room 32, Act IV's dig or the ending.

## What changes for the player

| Row | Where | Before | Now |
|---|---|---|---|
| **N-1 · The drawer, shut** | The Colonel's office, the burglary | He takes the photograph and walks out with the drawer open | The door will not have it. He shuts the drawer behind him. CLOSE solves a second thing |
| **N-2 · The letter, delivered** | Boot Hill, after the memorial is booked | The letter of introduction is carried to the end | With a nail from the mercantile he fixes it to Mr. Pike's board, sealed. It leaves his pocket where it was always going |
| **N-3 · The raccoon, dressed** | The claims, Act III | The raccoon goes to Mr. Pratt in a coat | And, if the player has them, in Mr. Pike's collar, with a button out of the church's plate and the Colonel's parsley in his lapel. Three things used on another thing |
| **N-4 · Seven objects** | Seven rooms | — | A nail, a handful of oats, the parsley, a capital B, Mr. Pike's collar, a button, his room key. Each is taken by hand and each has one place it goes |
| **N-5 · Packed** | Act IV | He carries every paper to the end | Act IV opens with his case packed. The papers that are done with are in it: the executor's form, the photograph, the third copy |

**Verbs.** CLOSE: the cover over the contract, and now the drawer.
**Item on item.** The oats on the hen; the button, the collar and the parsley on the raccoon in his coat. With the four before, eight.
**No dead end.** None of the seven is needed for anything. The drawer is in the room whose door asks for it. The letter is nailed up only once the church has had its use of it.

---

## What each row needs built

### N-1 · The drawer, shut

- Opening the drawer (or taking from it) on the funeral day leaves it open (`T_DRAWER_OPEN`).
- The door, with the drawer open: his line, and he stays.
- CLOSE the drawer: shut, and the door is a door again.
- **Art (brief `reference/objects-second-pass`):** the plate draws the drawer open at all times. A patch draws it shut until he opens it and again once he has shut it. The patch is in (errata 254).

### N-2 · The letter, delivered

- THE NAILS at the mercantile give one nail, once.
- THE LETTER on PIKE'S MARKER (or A NAIL on it), with both in hand and the memorial booked: the letter is fixed to the board with the nail, driven with the tuning fork. Both leave.
- Before the memorial is booked, doc 120's lines hold: the church still wants the letter.
- **Art:** a small patch, the envelope on the board. It is in (errata 254), and hangs behind the Colonel's wreath when both are there.

### N-3 · The raccoon, dressed

- With THE RACCOON, IN MY COAT in hand: A BUTTON, MR. PIKE'S COLLAR and A SPRIG OF PARSLEY each go on him, either way round, once each. Each leaves.
- Mr. Pratt buys him as before, word for word.

### N-4 · Seven objects

| Object | Taken from | Goes |
|---|---|---|
| A NAIL | THE NAILS, the mercantile | Mr. Pike's board, through the letter |
| A HANDFUL OF OATS | GRIEVANCE'S FEED BIN, the livery | THE HEN |
| A SPRIG OF PARSLEY | THE CONTRACT, the dinner | the raccoon's lapel |
| A CAPITAL B | THE TYPE CASE, the Clarion | his own coffin |
| MR. PIKE'S COLLAR | THE COLLARS, the laundry | the raccoon's neck |
| A BUTTON | THE COLLECTION PLATE, the church | the raccoon's coat |
| MY ROOM KEY | THE KEY RACK, the hotel lobby, once he has a room | THE WARDROBE in his room |

Icons for all seven are asked for in the brief; until they are drawn the panel shows each one's labelled box.

### N-5 · Packed

- From Act IV, THE EXECUTOR'S FORM, THE PHOTOGRAPH and THE THIRD COPY are not in his pockets. Doc 57's opening line for the act already says where they are: "Packed. It took four minutes; there was less to pack than there was to leave."
- No new line.

---

## THE LINES

*Each item's LOOK and LISTEN rotate 1, 2, 3, then hold the last.*

### N-1 · The drawer: the lines

**THE STOCK PORTRAIT DRAWER** · *open, on the funeral day*
- CLOSE, *open* — *(Thad slides the drawer home with one finger. It shuts like a bank.)* "Thirty-nine Obadiah Motts, back in the dark. He will not count them. Nobody counts a thing he keeps forty of." → `T_DRAWER_OPEN` cleared
- CLOSE, *shut* — "It is shut. It was built shut. That is what the joinery was for."

**THE DOOR, THE DRAWER OPEN** — "Not with that drawer hanging out like a tongue. He knows this room to the inch, and that is nine of them."

### N-2 · The letter: the lines

**THE NAILS** · *the mercantile*
- PICK UP, *the first time* — "One nail, on my account. He weighed it. It came to nothing, and he has written the nothing down." → A NAIL
- PICK UP, *again* — "One nail is a purchase. Two is carpentry, and I have nothing to build."

**A NAIL** *(item)*
**LOOK** 1 "One nail, out of a keg of every size mixed. I have no idea which size it is. Neither had the keg." · 2 "It is on my account at the mercantile, under EGGS and TONIC. My debts are becoming a household." · 3 "A nail wants a board and a reason. I have been carrying it about until it found both."
**LISTEN** 1 "Nothing. It expects to be hit, like most of us here." · 2 "A thin note against the tuning fork. Iron, and sharp with it." · 3 "Nothing. One nail does not rattle. It takes company for that."

**PIKE'S MARKER** · USE THE LETTER, *with a nail, the memorial booked*
- USE THE LETTER, *with a nail* — *(Thad sets the nail through the corner of the envelope and taps it into Mr. Pike's board with the tuning fork. Each tap is an A.)* "Delivered. Sealed, as my father sent it, by the hand of his son. It is only late." *"I shall not be wanting an introduction now. The town has met me."* → THE LETTER leaves inventory. A NAIL leaves inventory.

**PIKE'S MARKER** · USE A NAIL, *without the letter's leave*
- USE A NAIL — "Into a dead man's board, for nothing? I should want something to hang on it first."

**THE WRONG TRIES** · *with the nail*
- **THE POSTED NOTICES** · USE A NAIL — "They hold by habit. A nail would only encourage them."

### N-3 and N-4 · The objects: the lines

**GRIEVANCE'S FEED BIN** · *the livery*
- PICK UP, *the first time* — "One handful, off the top. Grievance watched it go, and then the level, and then me. It has been entered." → A HANDFUL OF OATS
- PICK UP, *again* — "She can count. I do not care to learn how high."

**A HANDFUL OF OATS** *(item)*
**LOOK** 1 "Grievance's oats, a handful, loose in my pocket with everything else I owe for." · 2 "Good oats. She eats better than the hotel serves, and with less comment." · 3 "Fewer than there were. My pocket has a hole in it, and so, I begin to think, has my character."
**LISTEN** 1 "A dry whisper, like a jury." · 2 "Nothing. Oats are patient. It is the mule who is not." · 3 "A trickle, down the lining of my coat."

**THE HEN** · USE A HANDFUL OF OATS
- USE A HANDFUL OF OATS — *(The hen eats out of Thad's hand, briskly, like a clerk stamping forms.)* "She has taken the lot, and looked at the hand afterwards as though it had come up short." → A HANDFUL OF OATS leaves inventory.

**THE CONTRACT** · PICK UP *(in place of doc 120's line)*
- PICK UP, *the first time* — "A man who picks up a contract at this table has as good as read it aloud. I have picked up the parsley." → A SPRIG OF PARSLEY
- PICK UP, *again* — "I have left it on its plate. I have left the plate nothing else."

**A SPRIG OF PARSLEY** *(item)*
**LOOK** 1 "The parsley off the Colonel's contract. It is the only part of that dinner I got away with." · 2 "Fresh, and curled, and grown under glass somewhere at great expense, to sit on a legal document." · 3 "It has not wilted. Nothing of the Colonel's does."
**LISTEN** 1 "Nothing. It was a garnish. It was never asked its views." · 2 "A small green squeak, between my fingers." · 3 "Nothing. It is keeping fresh out of spite."

**THE TYPE CASE** · *the Clarion*
- PICK UP, *the first time* — "The B is worn nearly flat, and my name has been spending it. I have taken one of the spent ones. I feel I have paid for it." → A CAPITAL B
- PICK UP, *again* — "One B is a keepsake. Two is how he spells me already."

**A CAPITAL B** *(item)*
**LOOK** 1 "A capital B, in lead, cast backward and worn nearly flat. It has been in every edition I have." · 2 "Backward, it looks like nothing at all. That is the whole secret of the trade." · 3 "Lead. It is the weightiest remark the Clarion has made about me."
**LISTEN** 1 "Nothing. It has been pressed into my name so often it has no more to say." · 2 "A dull click against the tuning fork. Lead does not ring. It was never meant to." · 3 "Nothing. One letter is not yet an opinion."

**THE COFFIN** · USE A CAPITAL B, *at the funeral*
- USE A CAPITAL B — *(Thad lays the B on the lid, beside the name plate.)* "My name has had more B's out of this town than it ever had from my family. I return one, with the rest of me." → A CAPITAL B leaves inventory.

**THE WRONG TRIES** · *with the B*
- **IGNATIUS FRAME** · USE A CAPITAL B — **FRAME:** "Keep it! I've a drawer of B's on order! You're the best thing that ever happened to the letter!"

**THE COLLARS** · *the laundry*
- PICK UP, *the first time* — "PIKE, E. At the back of the box, behind the important ones, starched, and never once collected. I am the nearest thing he has to a caller, so I have called for it." → MR. PIKE'S COLLAR
- PICK UP, *again* — "The other hundred and ninety-nine have owners with a pulse."

**MR. PIKE'S COLLAR** *(item)*
**LOOK** 1 "A detachable collar, starched to the hardness of a plate. PIKE, E., inked inside it, in two scripts." · 2 "All that while in a box, and not a crease. Mr. Sheng starches for the long term." · 3 "It was washed for a man who never came for it. It is the cleanest thing I carry, and it is not mine."
**LISTEN** 1 "It knocks, when I flick it. Linen should not knock." · 2 "Nothing. It is standing to attention." · 3 "A dry creak, when I bend it. I have stopped bending it."

**THE COLLECTION PLATE** · *the church*
- PICK UP, *the first time* — "It is bolted down, which I take to be doctrine informed by experience. The button in it is not. I have taken the button and left the doctrine." → A BUTTON
- PICK UP, *again* — "Bolted down, and empty now. We have each been relieved of something."

**A BUTTON** *(item)*
**LOOK** 1 "A black bone button, out of the church's plate. Somebody gave it in place of a dime and felt every bit as generous." · 2 "Four holes and no coat. It has been in and out of that plate for years, I should think, like a deacon." · 3 "In a poor light the Reverend would have banked it. In this town it very nearly is money."
**LISTEN** 1 "Nothing. A button says what it has to say by being missing from somewhere." · 2 "A click against the tuning fork. Bone." · 3 "Nothing. It is waiting for a coat."

**THE KEY RACK** · *the hotel lobby, once he has a room*
- PICK UP, *the first time* — "Number three. Mine, by arrangement with a piano. The clerk watched it leave the rack as if it might not come back, which shows how little he knows of my alternatives." → MY ROOM KEY
- PICK UP, *again* — "The other two belong to men I have never seen. I shall leave them their mystery."

**MY ROOM KEY** *(item)*
**LOOK** 1 "The key to number three, on a brass tag the size of a saucer, so that no guest may forget whose it is." · 2 "It would open any door in the hotel. I tried it in the wrong one, by accident, and it was delighted." · 3 "A key, to a room, with my things in it. I had not expected to find that affecting."
**LISTEN** 1 "It swings against its tag. A small, landed sound." · 2 "Nothing. Brass keeps its counsel." · 3 "A chime against the tuning fork. Flat, naturally."

**THE WARDROBE** · USE MY ROOM KEY
- USE MY ROOM KEY, *the first time* — "It fits. It fits everything in this hotel; I have stopped being surprised." "Locked. It may check on somebody else tonight." → `T_WARDROBE_LOCKED`
- USE MY ROOM KEY, *again* — "It is locked. I heard it try the door a moment ago, from the inside, and give up."

**THE RACCOON, DRESSED** · *with THE RACCOON, IN MY COAT in hand*
- USE A BUTTON — *(Thad works the button into the coat's empty top buttonhole. The raccoon permits it.)* "The coat has wanted that button since Sacramento. It took a raccoon to make me see to it." → A BUTTON leaves inventory.
- USE MR. PIKE'S COLLAR — *(Thad fastens Mr. Pike's collar round the raccoon's neck. The raccoon's expression does not change, which in a collar is correct.)* "Mr. Pike's collar, on a caller at last. He has the neck for it." → MR. PIKE'S COLLAR leaves inventory.
- USE A SPRIG OF PARSLEY — *(Thad puts the sprig in the coat's lapel.)* "A buttonhole. He came out of a hole in my claim, and he is now dressed for the Colonel's table." → A SPRIG OF PARSLEY leaves inventory.

---

## What is not built, and why

- **III-1, the archive searched.** Still withdrawn by its author, for Tyler to overrule in so many words. Room 8 already gives its three quiet clues, laying Hob's form beside the file is already the player's own act, and the room stands beside lines invariant 3 says must never be marked and the option invariant 7 says must never be seen to matter. Steps added there would point at them. Errata 250 gives the choice.
- **Anything in Act IV's dig,** which was never proposed.
