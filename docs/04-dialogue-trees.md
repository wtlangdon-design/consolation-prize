# THE LAST CLAIM IN CONSOLATION
## Dialogue Architecture & Character Trees — v1

*Companion to Bible v2, the Puzzle Graph, and the Liar's Assay. Eight full trees · ~40 topic flags · act-gated variation · every node carries a mechanically worthless option, on purpose.*

---

# PART ONE — THE SYSTEM

## Topic flags

Global boolean state. Learning a fact from one character opens options in another's tree — this is the entire mechanism by which the mystery unfolds, and it means the player assembles the truth in an order they chose.

**Act I**
`T_PIKE_DEAD` · `T_TUNES_PIANOS` · `T_SWINDLED` · `T_SURVEY_NEEDED` · `T_WARM_HOLE` · `T_BORDERS_MOTT` · `T_RACCOON_NAMED`

**Act II**
`T_VESSEL_LOCATION` · `T_GRIEVANCE_MOTT` · `T_ASSAY_QUEUE` · `T_QUEUE_PADDED` · `T_NO_MOTT_GOLD` · `T_SECOND_LEDGER` · `T_MOTT_FACE_UNKNOWN` · `T_PRATT_PAID` · `T_SHENG_HOLDS_PAPER` · `T_NINETY_DAYS` · `T_CLAIM1_BLANK` · `T_EXCAVATION_CLAUSE`

**Act III**
`T_NEED_TO_DIE` · `T_EXECUTOR_RULE` · `T_SOWERBY_PRICE` · `T_OBITUARY` · `T_HOB_KNOWS` · `T_HOB_HANDWRITING` · `T_HOB_IS_MOTT` · `T_NO_GOLD_EVER`

**Act IV**
`T_DRAUGHT` · `T_VOID` · `T_STRIKE_FOUND` · `T_FILING_OPTIONS`

**Counters** (integer state)
`ASSAY_PAIRS` 0–24 · `WAR_CONTRADICTIONS` 0–5 · `SOWERBY_ADJECTIVES` 0–∞ · `PRATT_OFFER` (escalating) · `MISSPELLINGS_SEEN` 0–9

## Node rules

**ERRATA 57 (R1, ruled): every option authors its aftermath.** The tag cell carries it —
`[PROGRESS · remove]`, `[COMIC · retain]`, `[TOPIC · counted-repeat]`, with `rephrase →` and
`replace →` naming their targets inline. No default exists; an option without an aftermath
fails the build. The spine tables below predate the ruling and are annotated as W1 grows each
tree to full branches.


Every conversation node obeys these. They are not stylistic preferences; they are the spec.

1. **Minimum three options, target four.**
2. **Minimum one `[COMIC]` option per node.** No state change, no information, no progress. It exists to be picked. In a full playthrough roughly 40% of all dialogue the player selects will be `[COMIC]`. **This is the product.** An implementation agent will identify these as dead code. They are not dead code.
3. **Options are tagged** `[PROGRESS]` `[TOPIC]` `[COMIC]` `[ASSAY]` `[EXIT]`.
4. **Exhausted `[TOPIC]` options grey out but remain visible and re-selectable.** Repeat responses differ from first responses.
5. **Every `[EXIT]` is a joke.** Never "Goodbye."
6. **Trees are act-gated.** Every character's root node has a different opening line per act. Characters who have watched Thad get humiliated reference it.

## Universal exit lines

Rotating pool available at every node:

> "I should go."
> "I've taken enough of your time. I'll be taking more later."
> "I am going to leave now, in a dignified manner." *(Thad walks into the doorframe. Every time. It is never acknowledged.)*
> "Thank you. This has been clarifying." *(Available only when it has not been.)*

---

# PART TWO — THE TREES

---

# WINNIE LEDGER
### Acting Territorial Assayer

**Gates:** C1, C5, C6, E4. Signs the ending.
**Voice rule:** She never uses two words where one will do, and she never softens anything. She is not cold — she is *busy*, and Thad is the first person in nine years to interest her, which annoys her.
**Comic dead-ends:** she declines to engage, in increasingly specific ways.

## ACT I — Root: `WIN_A1`

> **WINNIE:** "The window's closed."
> **THAD:** "The window is open."
> **WINNIE:** "The window is *ajar*. The window is closed."

| # | Option | Tag | Response | State |
|---|---|---|---|---|
| 1 | "I'd like to have some soil assayed." | `[PROGRESS]` | "So would nine hundred men. Get in the book." | opens `WIN_A2` |
| 2 | "What is it you actually do here?" | `[TOPIC]` | "I decide what things are. It's the only office in the territory that does." | — |
| 3 | "I tune pianos." | `[COMIC]` | *(long pause)* "Congratulations." | req `T_TUNES_PIANOS` |
| 4 | "Do you know a man named Ezra Pike?" | `[TOPIC]` | "I knew him. Then I certified him. Then I stopped." | req `T_PIKE_DEAD` |
| 5 | `[EXIT]` | | | |

**Repeat on option 3:** "Still congratulations."
**Third selection:** "Mr. Grubb, I have congratulated you twice. There is no third congratulation."

## ACT II — Root: `WIN_B1` (after `T_BORDERS_MOTT`)

> **WINNIE:** "You're the piano man with Claim Two."
> **THAD:** "Prosperity."
> **WINNIE:** "It's Claim Two."

| # | Option | Tag | Response | State |
|---|---|---|---|---|
| 1 | "I need a certified assay." | `[PROGRESS]` | "You need to be in a queue that's eight months long and getting longer." | sets `T_ASSAY_QUEUE` |
| 2 | "Eight months? Who's ahead of me?" | `[TOPIC]` | "The Improvement Company. Perpetually. Priority submissions." | opens C2 path |
| 3 | "Has anyone ever brought in Mott gold?" | `[PROGRESS]` | *(She stops writing. It is the first time she has stopped writing.)* "Ask me that again when you've got something to trade." | flags her interest; required for C5 |
| 4 | "You have very good handwriting." | `[COMIC]` | "I know." | — |
| 5 | "Would you like to hear about my raccoon?" | `[COMIC]` | "No." | req `T_RACCOON_NAMED` |

**Option 5, repeat:** "The answer has not changed and will not change. The raccoon is not an assayable substance."
**Option 5, fifth selection:** *(She puts down the pen.)* "What's its name." *(Thad tells her. She picks the pen back up.)* "That's a terrible name." — **This is the first crack, it costs the player nothing but persistence, and it is missable.**

## ACT II — `WIN_B2`: after the padded log (C5)

> **THAD:** "Your queue is padded. Two-thirds of these submissions are the same sample."
> **WINNIE:** *(reading)* "…Nine years."
> **THAD:** "I'm sorry."
> **WINNIE:** "Don't be sorry. Be quiet. I'm counting."

| # | Option | Tag | Response | State |
|---|---|---|---|---|
| 1 | "Will you run my assay?" | `[PROGRESS]` | "I'll run your assay. I'd run your assay if it were a bucket of rain." | grants assay → C6 |
| 2 | "Now can I ask about Mott gold?" | `[PROGRESS]` | "No Mott gold has ever crossed this window. Not one flake. Not in nine years. Not one." | sets `T_NO_MOTT_GOLD` |
| 3 | "Has nobody ever noticed?" | `[PROGRESS]` | "I noticed. I wrote it down. I've been writing it down since eighteen and forty-nine, in a book that is not this book." | sets `T_SECOND_LEDGER` |
| 4 | "Are you all right?" | `[COMIC]` | "I am *professionally offended*, Mr. Grubb. It is the worst kind." | — |

## ACT II — `WIN_B3`: the second ledger

Available only with `T_SECOND_LEDGER`. She produces it from under the floor. This is the scene where the game turns from comedy to mystery, and her tone does not change at all, which is why it works.

> **WINNIE:** "Nineteen names. Men who came to this window with a question about Claim One."
> **THAD:** "What happened to them?"
> **WINNIE:** "They stopped coming to the window."
> **THAD:** "That's all it says."
> **WINNIE:** "That's all I know. I write down what I know. It's the entire discipline."

`[COMIC]` option here — and it must exist, because the scene is too heavy without it:

> "Am I in the book?"
> **WINNIE:** "You've been in the book since Tuesday."

## ACT III — `WIN_C1`: the death certificate (E4)

The relationship scene. Six exchanges, and the correct path is not persuasion.

> **THAD:** "I need you to certify that I'm dead."
> **WINNIE:** "No."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "It's the only way into the archive." | `[PROGRESS]` | "I'm aware of the statute. The answer is no." |
| 2 | "It's just a form." | `[PROGRESS]` | *(Wrong. Hard wrong.)* "It is *never* just a form. That is what this town is *made of*." |
| 3 | "Nineteen names, Miss Ledger." | `[PROGRESS]` | *(Long silence.)* |
| 4 | "You're right. Forget it." | `[PROGRESS] ✓` | "…Sit down, Mr. Grubb." |

**The correct answer is option 4.** Winnie cannot be argued into it. She can only be *stopped being argued at.* The one thing Thad has never done to anyone is drop it, and doing it here is the character beat. Options 1–3 are not failures — they can be exhausted freely — but only 4 advances.

Then:

> **WINNIE:** "If I sign this and you are wrong, I have ended my own office and killed you for nothing."
> **THAD:** "Yes."
> **WINNIE:** "You're not going to reassure me."
> **THAD:** "I don't think I can. I've checked."
> **WINNIE:** *(signing)* "That's the first honest transaction at this window in nine years."

## ACT IV

Two nodes. After F3 (`T_STRIKE_FOUND`) and at F5. Her final line, on being handed the filing:

> **WINNIE:** "You're putting it in his name."
> **THAD:** "Yes."
> **WINNIE:** "You understand you get nothing."
> **THAD:** "I get to stop lying. I've only just learned how and I'm already tired of it."
> **WINNIE:** *(stamping)* "…Certified."

---

# COLONEL ABSALOM FANSHAWE
### President, Consolation Improvement Company

**Gates:** A4, A10, E0b, F4.
**Voice rule:** warm, generous, expansive, unfailingly courteous. **He never refuses Thad anything.** He never raises his voice. He is genuinely good company. Every conversation, Thad leaves with less than he arrived with, and it takes the player three or four to notice.
**Comic dead-ends:** he is delighted by them. Delight costs him nothing.

## THE FANSHAWE RULE — implementation

Every Fanshawe node must satisfy: *the player receives something they asked for, and gives up something they did not know they were carrying.* Track it. If a node doesn't do both, rewrite it.

| Node | Thad receives | Thad gives up |
|---|---|---|
| `FAN_A1` (A4) | The Company map, free | His deed number, read aloud |
| `FAN_A2` (A10) | Dinner, wine, warmth | That he intends to work the claim |
| `FAN_B1` | Introduction to the Registrar | That he's pursuing contiguity |
| `FAN_B2` | A copy of Claim One's index card | Confirmation he's seen the sealed filing |
| `FAN_C1` (E0b) | A very large offer | Nothing — Thad finally gives nothing, and this is when it turns |

## ACT I — Root: `FAN_A1`

> **FANSHAWE:** "Mr. Grubb! Sit down, sit down. You've the look of a man who's been sold something."
> **THAD:** "I have been."
> **FANSHAWE:** "Everyone here has. It's how we get our start. Which claim?"

| # | Option | Tag | Response | State |
|---|---|---|---|---|
| 1 | "Number two. Prosperity." | `[PROGRESS]` | "Prosperity! You've *named* it. Nobody names them. I like you enormously." | **He now knows.** Gives map |
| 2 | "I'd rather not say." | `[PROGRESS]` | "Very wise. Very wise indeed." *(He gives the map anyway. It has Claim Two circled.)* | Same outcome — **there is no way to withhold it, and the player will not notice until Act III** |
| 3 | "Were you really a colonel?" | `[TOPIC]` | "Chapultepec, '47. Terrible business. Wonderful weather." | `WAR_CONTRADICTIONS` +1 |
| 4 | "You have a great many chairs." | `[COMIC]` | "I do! I have found that a man will tell you anything if you sit him down. It's the standing ones you want to watch." | — |

## THE WAR — five contradictions

Distributed across all Fanshawe nodes, all optional, all `[TOPIC]`. Only a player who keeps asking will collect them.

1. "Chapultepec, '47."
2. "Buena Vista, of course — spring of '48." *(Buena Vista was February 1847.)*
3. "I took the rank at twenty-three." *(His stated age puts him at nineteen.)*
4. "Under Commodore Pelham, God rest him." *(Frame's archive: Pelham was Navy. There were no commodores at Chapultepec.)*
5. "The Eleventh Ohio Mounted." *(Sheng, dryly, on being asked: "There is no Eleventh Ohio Mounted. There is a Ninth. My brother was in it.")*

**Payoff — available in Act III with all five:**

> **THAD:** "You were never a colonel."
> **FANSHAWE:** *(He stops. For the only time in the game, he is completely still.)* "No. I wasn't."
> **THAD:** "…"
> **FANSHAWE:** "Was there something else, Mr. Grubb?"

He does not deny it, does not explain it, and does not become hostile. It is far worse than a denial, and it is entirely optional content that most players will miss. That is correct.

## ACT II — `FAN_C1`: the offer (E0b)

> **FANSHAWE:** "Eleven thousand dollars."
> **THAD:** "For forty feet of mud."
> **FANSHAWE:** "For forty feet of mud."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "May I read the contract?" | `[PROGRESS] ✓` | "Of course! Read every word. I *want* you to read every word." *(Clause 9: the holder shall not excavate, sink shaft, tunnel, or otherwise disturb the subsurface.)* → sets `T_EXCAVATION_CLAUSE` |
| 2 | "Yes." | `[PROGRESS]` | *(Not an ending. He hands Thad the pen, and the pen has no ink, and he apologises charmingly, and by the time ink is found the scene has moved on. **Fanshawe will never actually let Thad sell — because a sale would transfer a claim someone might dig.** The player cannot fail here and will not understand why until Act III.)* |
| 3 | "No." | `[PROGRESS]` | "Twelve thousand." |
| 4 | "Why does a worthless claim cost eleven thousand dollars?" | `[TOPIC]` | "Because you'd like it to be worth more, and I'd like you to be happy." |
| 5 | "I've named a raccoon after you." | `[COMIC]` | *(genuine delight)* "Have you! What a splendid animal it must be." *(It is not.)* |

**The turn:** on reading Clause 9, Thad's aside — *"He doesn't want the claim. He wants it quiet."*

---

# HOB
### Night watchman

**Gates:** E6, E8, E9, E10. Pair 21.
**Voice rule:** Acts I–II, **forty words total, across the entire game.** Every one is short, flat, and retroactively devastating. He never answers a question he is asked; he answers a different one, correctly.
**Comic dead-ends:** he does not respond. The `[COMIC]` option in a Hob node is the funniest thing in the tree precisely because nothing happens.

## ACT I–II — Root: `HOB_A1`

Six options. **Five produce no response at all** — Hob keeps walking, and Thad's aside supplies the joke.

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "Good evening." | `[TOPIC]` | *(nothing)* — Thad: "He is walking. I will consider that an evening." |
| 2 | "Do you know anything about Claim One?" | `[TOPIC]` | *(nothing)* |
| 3 | "Did you know Obadiah Mott?" | `[TOPIC]` | *(He stops. Then:)* "No." *(He does not walk on for four seconds.)* |
| 4 | "How long have you been in Consolation?" | `[TOPIC]` | "Longer than it has." |
| 5 | "Do you ever sleep?" | `[COMIC]` | *(nothing)* |
| 6 | "I know where Mott's strike is." | `[ASSAY]` | "So does everybody. That's the town. Try again." → **pair 21** |

**Option 3 is the whole game.** A player who tries it in Act I gets a four-second pause from an NPC and nothing else, and will not think about it again for fifteen hours.

**Running:** every fourth night, unprompted, Hob says one of:
> "Wouldn't stand there." · "It'll rain." *(it does not)* · "That's not yours." *(about nothing identifiable)* · "You're the piano man." · "It's a bad claim." *(pause)* "They're all bad claims."

## ACT III — `HOB_C1`: after the coffin (E8)

He digs Thad out and speaks in complete sentences for the first time, and the effect should be genuinely disorienting.

> **HOB:** "You were down four minutes. I counted. I always count."
> **THAD:** "…You've done this before."
> **HOB:** "I've watched them do it. It's not the same."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "How did you know I was in there?" | `[PROGRESS]` | "I know where every hole in this town is. It's the job." |
| 2 | "You said you didn't know Mott." | `[PROGRESS]` | "I said no. I didn't say I didn't know him." → `T_HOB_KNOWS` |
| 3 | "Who *are* you?" | `[PROGRESS]` | "The night watchman." *(True. Also the most complete lie in the game.)* |
| 4 | "You have very neat handwriting." | `[COMIC]` | *(He looks at Thad for a long time.)* "…Yes." → **secretly sets `T_HOB_HANDWRITING`.** The `[COMIC]` option is the one that solves the mystery. It is the only time this happens in the game and it happens here. |

## ACT III — `HOB_C2`: the confession (E10)

> **THAD:** "Claim One is in your hand."
> **HOB:** "Yes."
> **THAD:** "Where's the gold, Mr. Mott?"
> **HOB:** "There isn't any."
> **THAD:** "Where is it."
> **HOB:** "There *isn't any*, son. There never was. I made it up in a room in Boston to get three hundred dollars out of a man in a good coat, and I picked the spot off a map with my thumb."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "Two thousand people live here." | `[PROGRESS]` | "Two thousand and eleven. I count them too." |
| 2 | "Why didn't you leave?" | `[PROGRESS]` | "Leaving proves it. Staying just looks like a man sweeping up." |
| 3 | "Twelve years." | `[PROGRESS]` | "It's a long time to watch something you made." |
| 4 | "Did you ever think about telling them?" | `[PROGRESS]` | "Every night. Then it gets light and there's a town there." |
| 5 | "You could have picked a better thumb." | `[COMIC]` | *(He laughs. Once. It is the only laugh in the scene and it is awful.)* |

---

# IGNATIUS FRAME
### Editor and sole employee, the *Consolation Clarion*

**Gates:** B1, E5.
**Voice rule:** enthusiastic, amoral, and permanently mid-sentence. He is not malicious; he simply cannot distinguish between a fact and a good line. He invented half the Mott legend and no longer knows which half.
**Comic dead-ends:** he asks Thad for a quote. Always. About anything.

## Root: `FRA_A1`

> **FRAME:** "You're new! Say something quotable."
> **THAD:** "I'd rather not."
> **FRAME:** *(writing)* "'I'd… rather… not,' says mystery man."

| # | Option | Tag | Response | State |
|---|---|---|---|---|
| 1 | "Where did Deke Vessel go?" | `[PROGRESS]` | "I print the stage schedules! I know where everyone goes. Give me a story and I'll give you a coach." | opens B1 trade |
| 2 | "What do you know about Mott?" | `[TOPIC]` | "Everything! I wrote most of it." *(beat)* "Some of it was told to me." *(beat)* "I'd have to check which." | sets `T_MOTT_FACE_UNKNOWN` groundwork |
| 3 | "Do you have a photograph of him?" | `[TOPIC]` | "I have *the* photograph of him." *(It is a stock portrait. Sheng has the same one in his window, advertising collars.)* | |
| 4 | "You've spelled my name wrong." | `[COMIC]` | "Have I! Which way?" | `MISSPELLINGS_SEEN` +1 |

**Option 4 responses rotate and never resolve:**
> "That's how it's spelled in Providence, is it? Extraordinary place."
> "I'll fix it in the next edition." *(He introduces a new error.)*
> "The type's worn. It's not my fault the letter B has opinions."

## The misspelling gag — the full run

| Edition | Rendering |
|---|---|
| Act I, the swindle | **GRUBBS** |
| Act I, the raccoon | **GRUB** |
| Act II, the survey | **GRABB** |
| Act II, the first duel | **"a Mr. Grubbe of the East"** |
| Act II, Vessel rematch | **T. GRUB** |
| Act II, the padded log | **GRUBBE** |
| Act III, the funeral notice | **"the Piano Man"** |
| Act III, **the obituary** | **THADDEUS GRUBB** |

The last one is spelled correctly. It is the first and only time. The gag pays off by stopping.

---

# NICKEL PRATT
### Claim jumper

**Gates:** D2, D5, D6. Six Assay pairs.
**Voice rule:** slow, dogged, no imagination whatsoever, and — it turns out — fundamentally decent. He is not stupid. He is *unhurried*, which everyone mistakes for stupid, including him.
**Comic dead-ends:** he repeats his offer at a new number.

## The offer — escalating

Every single conversation, regardless of topic, ends with Pratt making an offer. It never stops.

> "Nine dollars." · "Nine dollars and a hen." · "Eleven dollars, and I'll take the raccoon." · "Fourteen dollars, and you keep the raccoon." · "Twenty dollars." *(pause)* "That's my number. I've thought about it." · "Twenty dollars and the hen. The hen is back in."

## Root: `PRA_B1`

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "Why do you want my claim?" | `[PROGRESS]` | "Told to." *(He does not consider this strange.)* → `T_PRATT_PAID` |
| 2 | "Told by whom?" | `[PROGRESS]` | "Fella." |
| 3 | "Which fella?" | `[PROGRESS]` | "Didn't say. Paid, though. Regular." |
| 4 | "How much are they paying you?" | `[PROGRESS]` | "Two dollars a week." *(This is the puzzle. He is being paid two dollars a week to acquire something being offered eleven thousand.)* |
| 5 | "How's the bite?" | `[COMIC]` | "Healing wrong." *(Every time, for the rest of the game, in every act, including the ending.)* |

## `PRA_D5` — the turn

The solution is not persuasion. It is **arithmetic, done out loud, slowly, and the player must wait through it.**

> **THAD:** "They offered me eleven thousand dollars."
> **PRATT:** "For the mud."
> **THAD:** "For the mud."
> **PRATT:** "…"
> **THAD:** "…"
> **PRATT:** "Two dollars a week is a hundred and four dollars a year."
> **THAD:** "It is."
> **PRATT:** *(after a very long pause)* "That ain't the same number."

He signs. Then:

> **PRATT:** "Grubb."
> **THAD:** "Yes?"
> **PRATT:** "Eleven dollars for the claim."
> **THAD:** "…Still?"
> **PRATT:** "I like the claim."

---

# MADAME OZYMANDIA
### Diviner

**Gates:** A7. One Assay pair. Optional Act IV corroboration.
**Voice rule:** enormous theatrical authority deployed over total fraud, dropped instantly whenever money is discussed, then resumed mid-sentence.
**Comic dead-ends:** she charges for them.

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "I need a boundary divined." | `[PROGRESS]` | "The *earth* will speak — two dollars — the earth will speak to me of *lines and limits* — in advance —" |
| 2 | "How does the rod work?" | `[TOPIC]` | "It is drawn to the *hidden metal*." *(It is brass. Brass is not drawn to gold. She humphs when this is raised and does not address it.)* |
| 3 | "Does it ever not work?" | `[COMIC]` | "It has never not worked." *(beat)* "It has occasionally been *early*." |
| 4 | "Do you ever hear anything?" | `[TOPIC]` | *(genuinely puzzled)* "…Hear?" *(She has been reading ground resonance for eleven years and has never once considered that she is listening.)* → **the Act IV corroboration, planted here and never mentioned again** |

**Act IV:** if Thad returns after `T_VOID`, she is at Prosperity, holding the rod, staring at the ground, saying nothing. Her only line: *"…It's loud here."*

---

# AH-LAM SHENG
### Laundry; and, in practice, the bank

**Gates:** D3, D4. One Assay pair. War contradiction #5.
**Voice rule:** precise, economical, and drier than anyone. He is the most competent person in Consolation after Winnie, and the town's total inability to notice is the joke — a joke made entirely at the town's expense, never at his. He is the only character who finds Thad genuinely funny, and shows it by correcting his arithmetic.

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "Who's paying Nickel Pratt?" | `[PROGRESS]` | "A man who pays through a second man, so that he has paid nobody. It is a common arrangement here. I hold paper on both of them." |
| 2 | "You hold paper on the Improvement Company?" | `[TOPIC]` | "On rather a lot of it. They come in on Thursdays. They are very warm to me on Thursdays." |
| 3 | "Why does nobody know this?" | `[TOPIC]` | "Because I do laundry." *(He returns to doing laundry.)* |
| 4 | "Was the Colonel in the Eleventh Ohio Mounted?" | `[TOPIC]` | "There is no Eleventh Ohio Mounted. There is a Ninth. My brother was in it." → `WAR_CONTRADICTIONS` +1 |
| 5 | "I have four dollars." | `[COMIC]` | "You have two dollars and forty cents. I have watched you spend the rest. You are not a careful man, Mr. Grubb, but you are an entertaining one." |

---

# REVEREND SOWERBY
### Charges by the adjective

**Gates:** E3. One Assay pair. Holds the pencil at Duel Four.
**Voice rule:** enormous feeling, deployed at industrial scale for men he has never met. He is not a hypocrite; he genuinely feels all of it, every time, for money.
**Mechanic:** `SOWERBY_ADJECTIVES` — a live price counter visible on screen during E3. Negotiating a cheap funeral is a dialogue puzzle where the player is trying to make Thad sound *worse*.

## `SOW_C1` — negotiating one's own funeral

> **SOWERBY:** "And how shall we remember the departed?"
> **THAD:** "Cheaply."

| Option | Effect |
|---|---|
| "He was a beloved and industrious young man of rare promise." | +4 adjectives — **$8** |
| "He was a man." | +0 — **$0.** *(Sowerby, wounded: "That is not a eulogy, that is a census.")* |
| "He was present." | +0 — accepted, grudgingly, at minimum rate |
| "He tuned pianos." | +0, and Sowerby delivers forty minutes on it anyway, free, unprompted, weeping |

**Correct solution:** "He was present." The cheapest possible funeral in the history of the territory, and the sole reason Thad can afford to die.

**At the graveside, Sowerby departs from the agreed text and eulogises for eleven minutes about a man he met on Tuesday.** He is not billed for it. It is the kindest thing anyone does in the entire game and Thad is in the box and cannot hear it.

---

# MINOR TREES

**Registrar Cadwallader Sump** — four nodes, act-gated. Never corrupt, never unhelpful, and completely immovable. Every response is a citation. `[COMIC]`: "Is there a form for that?" → "There is a form for everything, Mr. Grubb. That is the *point* of forms." His one moment of humanity is in Act IV, on the filing: *(reading Mott's name)* "…That's a very old claim number." *(He stamps it. He does not look up. He knows exactly what he is doing.)*

**Deke Vessel** — three nodes plus two duels. Sunny, shameless, and delighted by his own villainy. Later reappears in Act IV having bought a hotel with Thad's four dollars.

**The livery man** — two nodes, Grievance, and one Assay pair. Hums the pitch badly. `[COMIC]`: "Is the mule all right?" → "He's fine. He's just got a view."

**The Undertaker** — two nodes. Delivers the Pike news in Act I with total indifference, and is the only person who is completely unsurprised by anything in Act III.

---

# PART THREE — THE LETTERS HOME

A parallel choice system, available in Thad's hotel room in every act. Costs nothing, gates nothing, has no puzzle function.

Each act offers three versions of the letter to his mother: **honest**, **flattering**, and **flattering with a number in it**. The player picks freely. Nothing tracks it. Nothing depends on it.

- **Act I:** honest is easy. There is nothing to hide yet.
- **Act II:** honest requires admitting the swindle. Most players will not.
- **Act III:** he is legally dead and has to write around it.
- **Act IV:** **the honest version is the only one offered.** No choice. Four lines.

The player will notice, somewhere around Act III, that they have been doing at small scale exactly what Obadiah Mott did at large — inventing a strike to make a distant person proud. Nothing in the game ever says this.

## The letters, written (W7 pass, doc 47)

**ACT I — honest**
> "Dear Mother — I have arrived. Consolation is smaller than its advertisements and deeper in mud. I have bought forty feet of the territory with nearly everything I had, and I am told this was foolish, chiefly by the people who sold it to me. I have my fork, my ear, and four dollars. — Your Thaddeus."

**ACT I — flattering**
> "Dear Mother — I have arrived safely in Consolation, a rising town of two thousand souls and considerable prospects. I have already acquired property and made the acquaintance of the leading men of the district. The air is very healthful. — Your Thaddeus."

**ACT I — flattering, with a number in it**
> "Dear Mother — Consolation prospers, and I with it. My holding adjoins the richest ground in the district, and men of experience assess my prospects at no less than $40,000. The air is very healthful. — Your Thaddeus."

**ACT II — honest**
> "Dear Mother — I must correct my last. The property was worthless and was sold to me as a joke I did not hear in time. I tune pianos to eat, there being one piano. I am well, which surprises everyone, including the mud. — Your Thaddeus."

**ACT II — flattering**
> "Dear Mother — My affairs advance on several fronts, chiefly of paper. I am much in demand at the registrar's, the assay office, and the newspaper, where my name appears with remarkable frequency. The air remains healthful. — Your Thaddeus."

**ACT II — flattering, with a number in it**
> "Dear Mother — I am engaged upon a matter of documents which, when concluded, will interest parties to the extent of $12,000. My standing grows daily; I was only yesterday the subject of the Clarion's front page. — Your Thaddeus."

**ACT III — honest**
> "Dear Mother — There has been a development which I am not, in the strictest legal sense, in a position to describe. Do not believe everything you may read of me — or, ideally, anything. I am in good health. This is truer than the town knows. — Your Thaddeus."

**ACT III — flattering**
> "Dear Mother — I write in haste; my affairs have taken a most exclusive turn, and I move now in circles so elevated I am scarcely seen in town at all. I am widely mour— ADMIRED. Widely admired. The air is healthful. — Your Thaddeus."

**ACT III — flattering, with a number in it**
> "Dear Mother — My estate — my SITUATION — is valued by knowledgeable men at $30,000 or better, and the whole town turned out on Tuesday to honour me. I could not be more warmly regarded if I were dead. — Your Thaddeus."

**ACT IV — the only version offered. Four lines, entirely true.**
> "Dear Mother.
> I was robbed, and it was the making of me.
> The gold is real. The story is better. I will tell you both in the spring.
> — Your Thaddeus."

---

# PART FOUR — VOLUME

| Component | Estimate |
|---|---|
| 8 core trees, act-gated, all branches | ~1,400 lines |
| Minor characters (5) | ~250 |
| Liar's Assay (24 pairs × 4 options + mockery) | ~200 |
| Letters home (4 acts × 3 versions) | ~90 |
| Barks, repeats, greetings, exits | ~300 |
| **Dialogue total** | **~2,250 lines** |
| Examine layer (separate document) | ~1,000 |
| **Written total** | **doc 05 Part Four is the count of record for the examine layer; this table owns dialogue only (~2,250)** |

## Implementation warnings

1. **The `[COMIC]` options are the product.** Roughly 40% of what the player selects does nothing. Any pass that "optimises dialogue" will delete them and the game will die.
2. **`HOB_C1` option 4 is a `[COMIC]` option that silently sets a critical flag.** It must not be tagged as progress in the data, because the player must not be able to tell.
3. **Repeat responses are not optional.** Winnie's raccoon refusals across five selections are a complete character arc delivered entirely through a player being annoying.
4. **Nothing in the letters home is ever tracked or referenced.** Resist every instinct to pay it off. The lack of payoff is the payoff.

## Next

- **Room-by-room examine script** — ~35 rooms × ~15 hotspots × LOOK and LISTEN. ~1,000 lines. The last large writing job.
- **Technical spec** — 2D, verb interface, hand-painted backgrounds, iMUSE-style dynamic score.
