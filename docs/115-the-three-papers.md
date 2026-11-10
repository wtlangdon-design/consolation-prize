# 115 · Act II, the three papers, to standard (2026-11-09)

Doc 114's rows **II-1, II-2, II-3 and II-5**, approved by Tyler ("All", errata 243). II-4 is built (errata 243). This document is those four rows' design and their lines, written by one voice to doc 59 under that ruling, and it covers these rows and nothing else.

Nothing here changes a flag the rest of the game reads, a puzzle's answer outside these rows, or a load-bearing line. Every line that is said in these places today is still said, in the place noted.

## What changes for the player

| Row | Where | Today | Now |
|---|---|---|---|
| **II-5 · The wreath** | Main Street, the funeral day | The street is empty and the office is simply empty | The Colonel is stuck in his own doorway behind his wreath. Thad PUSHES him through, is thanked for it, and goes in to rob him |
| **II-3 · The double, earned** | Fanshawe's office, empty | A ledger off the shelf, laid where the log lay | The ledger has a gilt date and has never been opened; both have to be put right before it will pass. One of them is done with the Colonel's own handkerchief |
| **II-2 · Pratt stays** | Prosperity | "That's my stake" sends him home, and the rest is said at his own claim | He stays on Thad's claim until he is turned. Everything he says in Act II he says standing on it, and the stake is there for every player |
| **II-1 · The collection** | Boot Hill | Arriving collects the money | The Reverend will not make change at the gate while the town watches. Thad gets into the line, ends up holding the plate, and does not let go |

**Verbs:** PUSH solves the wreath and PULL solves the plate (doc 114 X-1). The handkerchief on the ledger is the game's first item used on an item (X-2). CLOSE is left for the archive (III-1), where a drawer can honestly be shut.

**Order of play is unchanged:** the notice (C3) → the street → the office (C4) → the hill (D4) → Sheng → Winnie and Pratt.

---

## What each row needs built

### II-5 · The wreath

- On the funeral day, until he is pushed through (`T_COLONEL_OUT`), Fanshawe stands in the Company's doorway on Main Street with the wreath, and the way into the lobby is him.
- PUSH on him sets `T_COLONEL_OUT`: he goes up the street and out of the room. The office is empty from then, as it is today for the whole day.
- Doc 57's street line ("The street's quieter than usual…") is said first, as now; the new arrival line follows it.
- **Art (image session, brief below):** Fanshawe in the doorway behind the wreath. One operation; two if the wreath alone is wanted as a prop.

### II-3 · The double, earned

- The swap (errata 242) now needs the ledger made ready: `T_LEDGER_PLAIN` (the gilt rubbed off, the handkerchief used on the ledger) and `T_LEDGER_CRACKED` (its spine broken in, the ledger used on THE CHAIRS). Either order.
- Until both hold, the ledger on the log is refused, and the refusal says what is wrong with it.
- **Art:** none. The plate's green book is the log before and the ledger after, as errata 242 has it.

### II-2 · Pratt stays

- PRA_D2 option 1 no longer sends him home. From then until he swears (`T_PRATT_SWEARS`), he is on Prosperity, and TALK TO opens doc 04's PRA_B1 and then PRA_D5 and PRA_D6 there, every line as written.
- After "Sump closes at four." he is at the Registrar's, as now; after the attestation he is at his own claim, as now.
- His own claim is empty in between. Its sign and its LOOK lines stand.
- The cut-away "Still on it?" — "Yep." is cut to Prosperity, where he is in fact still on it.
- The stake (doc 113 B) holds for the whole of that time.
- **No new line.** Doc 04's and doc 57's notes on where he stands are corrected.
- **Art:** none.

### II-1 · The collection

- On the hill on the funeral day, with Sheng's task open: the Reverend is at the gate, and the plate is in the line of mourners (errata 242's town), going round a second time.
- TALK TO the Reverend: doc 57's three lines, then his refusal (`T_LINEN_ASKED`).
- USE the town, after that: Thad joins the end of the line and the plate stops with him (`T_HOLDS_PLATE`). The Reverend comes and takes hold of it.
- PULL the plate: the scene, ending in doc 57's own direction and line, the linen money, and `T_LINEN_COLLECTED`.
- The day ends on arriving, as now. The scene can be finished on that visit; a player who leaves first can hold the day again, as today (errata 87 C).
- **Art (brief below):** the Reverend with the plate; the plate in Thad's hands (a clip of Thad holding it); Fanshawe hat in hand, which the arrival line has always said. Three operations.

---

## THE LINES

*Each hotspot's LOOK and LISTEN rotate 1, 2, 3, then hold the last.*

### II-5 · The wreath

*Main Street on the funeral day, until the Colonel is through his door.*

**ARRIVING** · *Main Street, the funeral day, after the street's own line*
> "Not quite everyone. Colonel Fanshawe is in his own doorway, behind a wreath the size of a cartwheel. The doorway is the size of a door."

**THE COLONEL, IN HIS DOORWAY**
**LOOK** 1 "Black gloves, black hat, and a wreath of lilies he must have ordered by the acre. He has got it most of the way out, and himself none of the way." · 2 "He is pushing from inside, with great goodwill. The wreath is being reasonable about it and the door is not." · 3 "A ribbon across it says SINCERELY, in gilt. The rest of the word is still in the lobby."
**LISTEN** 1 "Lilies, creaking. And behind them a man apologizing to a door." · 2 "'After you,' he says, to the wreath. It does not go." · 3 "Wire, straining. Somebody was paid by the lily."

**THE COLONEL, IN HIS DOORWAY** · *the tries*
- TALK TO — **FANSHAWE:** "Mr. Grubb! A sad day. Pike was — I am told Pike was a great many things. You'll forgive my not shaking hands." *(second)* **FANSHAWE:** "No hurry, no hurry. They never start without me. I have seen to that."
- PULL — "From this side, pulling brings me the wreath, and the Colonel directly after it. I should prefer them to go the other way."
- PICK UP — "It took a florist and two boys to carry it here. I tune pianos."
- USE — "I put a hand on it, to look helpful. It is the kind of help he gives."
- PUSH — *(Thad puts his shoulder to the wreath. It goes through the door all at once, and the Colonel with it.)* **FANSHAWE:** "Obliged, Mr. Grubb! You are the only man in Consolation who has ever helped me out of my own office." *(He goes up the street with the wreath on his arm, like a man taking a wheel to be mended.)* "I have helped a man leave so that I can rob him, and he thanked me. I expect he will again." → `T_COLONEL_OUT`

**THE COMPANY'S DOOR** · *while the Colonel is in it*
- WALK TO, *or* OPEN, *or* USE — "The door is full of Colonel."

### II-3 · The double, earned

*Fanshawe's office on the funeral day, with A COMPANY LEDGER in hand.*

**THE SWAP, REFUSED** · USE A COMPANY LEDGER *on THE SUBMISSION LOG, before the ledger is ready*
- *with the gilt on it and the spine whole* — "A year in gilt on the spine, facing his chair. And it has never once been opened. He would know it from the door."
- *with the gilt gone and the spine whole* — "Plain enough now. But his opens flat at one place, like a hymnal at the favorite, and this one has never been asked to."
- *with the spine broken and the gilt on it* — "It lies open like the other. And it wears its year on its back, in gold, which the other has the modesty not to."

**THE GILT** · USE THE HANDKERCHIEF *on A COMPANY LEDGER*
- USE THE HANDKERCHIEF — *(Thad rubs the spine with the Colonel's handkerchief. The year comes away on the linen.)* "It was that kind of gold. Most of it here is." → `T_LEDGER_PLAIN`
- USE THE HANDKERCHIEF, *again* — "There is no more year to take off. The handkerchief has it now, and I notice it is the first thing of his I have ever marked."

**THE SPINE** · USE A COMPANY LEDGER *on THE CHAIRS*
- USE A COMPANY LEDGER — *(Thad lays the ledger open on the nearest chair and sits on it, briefly, as a visitor would.)* "Eleven chairs, and at last one of them has done something for me. The spine has gone in one place, as his has." → `T_LEDGER_CRACKED`
- USE A COMPANY LEDGER, *again* — "Once is consulted. Twice is studied, and nobody has ever studied these."

**THE WRONG TRIES**
- **THE SABRE** · USE A COMPANY LEDGER — "It has never cut anything. I will not ask it to start on bookbinding."
- **THE DECANTER** · USE A COMPANY LEDGER — "Whisky would take the gilt off, and leave a ring he would know by its year."
- **THE PORTRAIT** · USE A COMPANY LEDGER — "I held it up to him. In oils he did not recognize it either."

### II-1 · The collection

*Boot Hill on the funeral day, Sheng's task open, the town coming down and the plate going along it.*

**THE COLLECTION PLATE** · *in the line*
**LOOK** 1 "A pewter plate, going down the line of mourners hand to hand, for the second time. The first time, the Reverend was not satisfied." · 2 "It is heavier at every pair of hands. Nobody here knew Mr. Pike, and they are paying for it." · 3 "Silver, mostly, and one button. There is always one button."
**LISTEN** 1 "A coin, and a pause, and the next coin. The pause is the plate being looked into." · 2 "Somebody makes change out of it, quietly, and is watched doing it." · 3 "It rings lower each time it is passed. A full plate has a very comfortable note."

**REVEREND SOWERBY, AT THE GATE** · *the asking*
> **THAD:** "Reverend. Mr. Sheng's linens."
> **SOWERBY:** "Today? Today of all days?"
> **THAD:** "It's the only day you have it."
> **SOWERBY:** "And the only day I am watched, Mr. Grubb. A minister cannot be seen making change out of the plate. It would look like commerce."

Doc 57's three lines, then his. → `T_LINEN_ASKED`

**REVEREND SOWERBY, AT THE GATE** · *asked again*
- TALK TO — **SOWERBY:** "After, sir. There is always an after." *(second)* **SOWERBY:** "After. I have built a ministry on it."

**THE COLLECTION PLATE** · *the tries, in the line*
- PICK UP — "It is in the hands of a widow, and she has a firm grip on other people's generosity."
- USE THE TUNING FORK — "I rang it as it went by. It gave a full, round note. An empty one rings higher, and the Reverend has the ear for that."

**THE TOWN, COMING DOWN** · USE
- *before the Reverend is asked* — "If I stand in that line I shall be handed a plate, and expected to improve it."
- *after* — *(Thad takes off his hat and stands at the end of the line. The plate comes down it, hand to hand, and stops with him.)* "I am holding Mr. Pike's collection. It is the most money I have touched since Providence, and every eye on this hill knows whose it is not." → `T_HOLDS_PLATE`

**THE REVEREND COMES FOR IT** · *as soon as Thad holds the plate*
> **SOWERBY:** "Mr. Grubb. The plate."
> *(He takes hold of the rim.)*

**THE COLLECTION PLATE** · *in Thad's hands, the Reverend's hand on it*
- PUSH — "If I push, he has it. I have never won anything by pushing, except once today, and that was a wreath."
- USE — "It is not mine to use. That is rather the position I am pressing."
- TALK TO, *the Reverend* — **SOWERBY:** "Let go, Mr. Grubb, and we shall discuss it after." — *"There is always an after."*
- PULL — *(Thad does not let go. Neither does the Reverend. The town of Consolation watches two men hold a plate.)* *"Nine funerals of linen, Reverend."* — **SOWERBY:** "Not in front of the bereaved." — *"They are not bereaved. They never met him."* → doc 57's own ending: *(He looks at the collection plate for a long time. Then he counts out of it with his eyes shut.)* **SOWERBY:** "Nine funerals of linen. He starches with feeling." → THE LINEN MONEY, `T_LINEN_COLLECTED`

**COLONEL FANSHAWE, HAT IN HAND**
**LOOK** 1 "The Colonel, in front, hat in hand, grieving handsomely. He has left the wreath where it will be seen from the road." · 2 "He put a coin in the plate from high enough up that everybody heard it land." · 3 "He has been out of his office for an hour. I am the only man on this hill who knows exactly how long."
**LISTEN** 1 "'A great loss,' he is saying, to a man who has just asked him who Pike was." · 2 "His watch chain. He has looked at it twice and at the town below it once." · 3 "Nothing. He is being seen, which he does very quietly."

**COLONEL FANSHAWE, HAT IN HAND** · *the tries*
- TALK TO — **FANSHAWE:** "A beautiful service, Mr. Grubb. I wept. I always do. It is very good for the Company." *(second)* **FANSHAWE:** "Walk down with me! No? Another time. My door is always open." — *"I know."*

---

## The art briefs

Written to `reference/act2-papers/brief.md` for the image session. In short, four pictures, every figure generated against a frame of Thad in the room it stands in (CLAUDE.md, the character style gate):

1. **Fanshawe in the Company's doorway on Main Street, behind the wreath** (night, the street's lamps): rest, a breath, pushing, and the wreath through.
2. **Fanshawe on Boot Hill, hat in hand** (the hill's night): rest, a breath, the watch looked at.
3. **The Reverend at the gate with the plate held out,** and **with his hand on the plate's rim:** rest, a breath, the hand out.
4. **Thad holding the plate,** front, two frames, for his clip while the scene is said.

II-3 and II-2 need no picture and are built first.
