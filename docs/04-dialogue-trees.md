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
| 1 | "I'd like to have some soil assayed." | `[PROGRESS · remove]` | "So would nine hundred men. Get in the book." | opens `WIN_A2` |
| 2 | "What is it you actually do here?" | `[TOPIC · retain]` | "I decide what things are. It's the only office in the territory that does." | — |
| 3 | "I tune pianos." | `[COMIC · counted-repeat]` | *(long pause)* "Congratulations." | req `T_TUNES_PIANOS` |
| 4 | "Do you know a man named Ezra Pike?" | `[TOPIC · retain]` | "I knew him. Then I certified him. Then I stopped." | req `T_PIKE_DEAD` |
| 5 | `[EXIT]` | | | |

**Repeat on option 3:** "Still congratulations."
**Third selection:** "Mr. Grubb, I have congratulated you twice. There is no third congratulation."


## ACT I — `WIN_A2`: the book *(W1 growth)*

The queue ledger, chained to the sill. Getting in the book is puzzle A2's paper half.

| # | Option | Tag | Response | State |
|---|---|---|---|---|
| 1 | "Where do I sign?" | `[PROGRESS · remove]` | "You don't sign. You *print*. Signatures are for people the next clerk has to believe." | enters the queue; A2 |
| 2 | "How long is the wait, honestly?" | `[TOPIC · rephrase]` | "Eight months." *(rephrases after C5 to "How long is the wait now?" → "Three weeks. It appears the queue has been on a diet.")* | — |
| 3 | "What number am I?" | `[COMIC · counted-repeat]` | "Nine hundred and six." *(second)* "Nine hundred and six." *(third)* "Mr. Grubb, the number does not refresh with enthusiasm." | — |
| 4 | `[EXIT · retain]` | | "Mind the window." *(It is ajar.)* | |

## ACT II — Root: `WIN_B1` (after `T_BORDERS_MOTT`)

> **WINNIE:** "You're the piano man with Claim Two."
> **THAD:** "Prosperity."
> **WINNIE:** "It's Claim Two."

| # | Option | Tag | Response | State |
|---|---|---|---|---|
| 1 | "I need a certified assay." | `[PROGRESS · remove]` | "You need to be in a queue that's eight months long and getting longer." | sets `T_ASSAY_QUEUE` |
| 2 | "Eight months? Who's ahead of me?" | `[TOPIC · retain]` | "The Improvement Company. Perpetually. Priority submissions." | opens C2 path |
| 3 | "Has anyone ever brought in Mott gold?" | `[PROGRESS · remove]` | *(She stops writing. It is the first time she has stopped writing.)* "Ask me that again when you've got something to trade." | flags her interest; required for C5 |
| 4 | "You have very good handwriting." | `[COMIC · retain]` | "I know." | — |
| 5 | "Would you like to hear about my raccoon?" | `[COMIC · counted-repeat]` | "No." | req `T_RACCOON_NAMED` |

**Option 5, repeat:** "The answer has not changed and will not change. The raccoon is not an assayable substance."
**Option 5, fifth selection:** *(She puts down the pen.)* "What's its name." *(Thad tells her. She picks the pen back up.)* "That's a terrible name." — **This is the first crack, it costs the player nothing but persistence, and it is missable.**

## ACT II — `WIN_B2`: after the padded log (C5)

> **THAD:** "Your queue is padded. Two-thirds of these submissions are the same sample."
> **WINNIE:** *(reading)* "…Nine years."
> **THAD:** "I'm sorry."
> **WINNIE:** "Don't be sorry. Be quiet. I'm counting."

| # | Option | Tag | Response | State |
|---|---|---|---|---|
| 1 | "Will you run my assay?" | `[PROGRESS · remove]` | "I'll run your assay. I'd run your assay if it were a bucket of rain." | grants assay → C6 |
| 2 | "Now can I ask about Mott gold?" | `[PROGRESS · remove]` | "No Mott gold has ever crossed this window. Not one flake. Not in nine years. Not one." | sets `T_NO_MOTT_GOLD` |
| 3 | "Has nobody ever noticed?" | `[PROGRESS · remove]` | "I noticed. I wrote it down. I've been writing it down since eighteen and forty-nine, in a book that is not this book." | sets `T_SECOND_LEDGER` |
| 4 | "Are you all right?" | `[COMIC · retain]` | "I am *professionally offended*, Mr. Grubb. It is the worst kind." | — |

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
| 1 | "It's the only way into the archive." | `[PROGRESS · retain]` | "I'm aware of the statute. The answer is no." |
| 2 | "It's just a form." | `[PROGRESS · retain]` | *(Wrong. Hard wrong.)* "It is *never* just a form. That is what this town is *made of*." |
| 3 | "Nineteen names, Miss Ledger." | `[PROGRESS · retain]` | *(Long silence.)* |
| 4 | "You're right. Forget it." | `[PROGRESS · remove] ✓` | "…Sit down, Mr. Grubb." |

**The correct answer is option 4.** Winnie cannot be argued into it. She can only be *stopped being argued at.* The one thing Thad has never done to anyone is drop it, and doing it here is the character beat. Options 1–3 are not failures — they can be exhausted freely — but only 4 advances.

Then:

> **WINNIE:** "If I sign this and you are wrong, I have ended my own office and killed you for nothing."
> **THAD:** "Yes."
> **WINNIE:** "You're not going to reassure me."
> **THAD:** "I don't think I can. I've checked."
> **WINNIE:** *(signing)* "That's the first honest transaction at this window in nine years."

## ACT IV — grown to nodes *(W1)*

**`WIN_F1` — after `T_STRIKE_FOUND` (F3):**

> **THAD:** "I need an assay certified."
> **WINNIE:** *(she looks at the sample for a long time)* "Where."
> **THAD:** "Claim Two."
> **WINNIE:** "…Get in the book." *(beat)* "You're the book."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "Run it." | `[PROGRESS · remove]` | *(She runs it herself, at the window, in front of him — the first assay the player ever watches happen. It is very good gold.)* |
| 2 | "You knew the nineteen names meant something." | `[TOPIC · retain]` | "I knew they meant *something*. Knowing what is your department. Mine is the book." |
| 3 | "Aren't you going to congratulate me?" | `[COMIC · counted-repeat]` | "No." *(second)* "I congratulated you about the pianos. Consult your records." |

**`WIN_F2` — the certification (F5)** is the scripted exchange above ("You're putting it in his name."), staged in doc 48's S6. No options; it plays as written.

Her final line, on being handed the filing:

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
| 1 | "Number two. Prosperity." | `[PROGRESS · remove]` | "Prosperity! You've *named* it. Nobody names them. I like you enormously." | **He now knows.** Gives map |
| 2 | "I'd rather not say." | `[PROGRESS · remove]` | "Very wise. Very wise indeed." *(He gives the map anyway. It has Claim Two circled.)* | Same outcome — **there is no way to withhold it, and the player will not notice until Act III** |
| 3 | "Were you really a colonel?" | `[TOPIC · remove]` | "Chapultepec, '47. Terrible business. Wonderful weather." | `WAR_CONTRADICTIONS` +1 |
| 4 | "You have a great many chairs." | `[COMIC · retain]` | "I do! I have found that a man will tell you anything if you sit him down. It's the standing ones you want to watch." | — |

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


## ACT II — `FAN_B1`: the introduction *(W1 growth)*

Per the Fanshawe Rule: Thad receives the Registrar introduction; gives up that he is pursuing contiguity.

> **FANSHAWE:** "Sump! A dear friend. I shall write you a note. Sump respects notes the way other men respect weather."

| # | Option | Tag | Response | Rule ledger |
|---|---|---|---|---|
| 1 | "I need to see the Registrar about my boundary." | `[PROGRESS · remove]` | "Your *boundary*! A man who knows where he ends. Rare. Here is your note." *(The note is warm, correct, and mentions the boundary. By Thursday the Company has filed three priority submissions on the parcels beside Claim One.)* | receives: the note. gives up: contiguity |
| 2 | "What do you want for it?" | `[TOPIC · retain]` | "Want? Mr. Grubb, a favor that costs something is a *transaction*. I deal only in favours." | — |
| 3 | "Your clock is slow." | `[COMIC · retain]` | "It is eleven minutes slow, and it has made me the most punctual man in the territory. Everyone else trusts it." | — |

## ACT II — `FAN_B2`: the index card *(W1 growth)*

Thad receives a copy of Claim One's index card; gives up confirmation he has seen the sealed filing.

> **FANSHAWE:** "The famous card! Take a copy. Take two. History belongs to everybody."

| # | Option | Tag | Response | Rule ledger |
|---|---|---|---|---|
| 1 | "I'd like to see Claim One's index card." | `[PROGRESS · remove]` | "Of course. You'll find it agrees with the sealed filing in every particular." *(Thad has not mentioned the sealed filing. He watches Thad not mention it. Both men note it.)* | receives: the card. gives up: what he's seen |
| 2 | "Why does the Company keep copies of claim records?" | `[TOPIC · retain]` | "Because the courthouse could burn down, Mr. Grubb. Buildings do." *(He says it with real warmth. It is not a threat. It is worse — it is preparedness.)* | — |
| 3 | "Buena Vista must have been something." | `[TOPIC · remove]` | "Buena Vista! Spring of '48. I shall never forget it." *(Buena Vista was February 1847.)* → `WAR_CONTRADICTIONS` +1 | — |
| 4 | "The chairs are new." | `[COMIC · retain]` | "They are! One must reinvest." | — |

## ACT III — `FAN_D1`: the payoff of the war *(all five contradictions)*

The scripted exchange above ("You were never a colonel."). One node, no other options live while it plays, and afterward it is `remove` — a thing that can only be said once, and is.

## ACT II — `FAN_C1`: the offer (E0b)

> **FANSHAWE:** "Eleven thousand dollars."
> **THAD:** "For forty feet of mud."
> **FANSHAWE:** "For forty feet of mud."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "May I read the contract?" | `[PROGRESS · remove] ✓` | "Of course! Read every word. I *want* you to read every word." *(Clause 9: the holder shall not excavate, sink shaft, tunnel, or otherwise disturb the subsurface.)* → sets `T_EXCAVATION_CLAUSE` |
| 2 | "Yes." | `[PROGRESS · retain]` | *(Not an ending. He hands Thad the pen, and the pen has no ink, and he apologises charmingly, and by the time ink is found the scene has moved on. **Fanshawe will never actually let Thad sell — because a sale would transfer a claim someone might dig.** The player cannot fail here and will not understand why until Act III.)* |
| 3 | "No." | `[PROGRESS · counted-repeat]` | "Twelve thousand." |
| 4 | "Why does a worthless claim cost eleven thousand dollars?" | `[TOPIC · retain]` | "Because you'd like it to be worth more, and I'd like you to be happy." |
| 5 | "I've named a raccoon after you." | `[COMIC · retain]` | *(genuine delight)* "Have you! What a splendid animal it must be." *(It is not.)* |

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
| 1 | "Good evening." | `[TOPIC · retain]` | *(nothing)* — Thad: "He is walking. I will consider that an evening." |
| 2 | "Do you know anything about Claim One?" | `[TOPIC · retain]` | *(nothing)* |
| 3 | "Did you know Obadiah Mott?" | `[TOPIC · retain]` | *(He stops. Then:)* "No." *(He does not walk on for four seconds.)* |
| 4 | "How long have you been in Consolation?" | `[TOPIC · retain]` | "Longer than it has." |
| 5 | "Do you ever sleep?" | `[COMIC · retain]` | *(nothing)* |
| 6 | "I know where Mott's strike is." | `[ASSAY · retain]` | "So does everybody. That's the town. Try again." → **pair 21** |

**Option 3 is the whole game.** A player who tries it in Act I gets a four-second pause from an NPC and nothing else, and will not think about it again for fifteen hours.

**Running:** every fourth night, unprompted, Hob says one of:
> "Wouldn't stand there." *(RULED, errata 60/R4: it is about the mud — a practical warning wearing gnomic clothes, paid off when the mud takes Thad's boot. It obligates nothing later.)* · "It'll rain." *(it does not)* · "That's not yours." *(about nothing identifiable)* · "You're the piano man." · "It's a bad claim." *(pause)* "They're all bad claims."

## ACT III — `HOB_C1`: after the coffin (E8)

He digs Thad out and speaks in complete sentences for the first time, and the effect should be genuinely disorienting.

> **HOB:** "You were down four minutes. I counted. I always count."
> **THAD:** "…You've done this before."
> **HOB:** "I've watched them do it. It's not the same."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "How did you know I was in there?" | `[PROGRESS · remove]` | "I know where every hole in this town is. It's the job." |
| 2 | "You said you didn't know Mott." | `[PROGRESS · remove]` | "I said no. I didn't say I didn't know him." → `T_HOB_KNOWS` |
| 3 | "Who *are* you?" | `[PROGRESS · retain]` | "The night watchman." *(True. Also the most complete lie in the game.)* |
| 4 | "You have very neat handwriting." | `[COMIC · retain]` | *(He looks at Thad for a long time.)* "…Yes." → **secretly sets `T_HOB_HANDWRITING`.** The `[COMIC]` option is the one that solves the mystery. It is the only time this happens in the game and it happens here. |

## ACT III — `HOB_C2`: the confession (E10)

> **THAD:** "Claim One is in your hand."
> **HOB:** "Yes."
> **THAD:** "Where's the gold, Mr. Mott?"
> **HOB:** "There isn't any."
> **THAD:** "Where is it."
> **HOB:** "There *isn't any*, son. There never was. I made it up in a room in Boston to get three hundred dollars out of a man in a good coat, and I picked the spot off a map with my thumb."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "Two thousand people live here." | `[PROGRESS · retain]` | "Two thousand and eleven. I count them too." |
| 2 | "Why didn't you leave?" | `[PROGRESS · retain]` | "Leaving proves it. Staying just looks like a man sweeping up." |
| 3 | "Twelve years." | `[PROGRESS · retain]` | "It's a long time to watch something you made." |
| 4 | "Did you ever think about telling them?" | `[PROGRESS · retain]` | "Every night. Then it gets light and there's a town there." |
| 5 | "You could have picked a better thumb." | `[COMIC · retain]` | *(He laughs. Once. It is the only laugh in the scene and it is awful.)* |

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
| 1 | "Where did Deke Vessel go?" | `[PROGRESS · remove]` | "I print the stage schedules! I know where everyone goes. Give me a story and I'll give you a coach." | opens B1 trade |
| 2 | "What do you know about Mott?" | `[TOPIC · retain]` | "Everything! I wrote most of it." *(beat)* "Some of it was told to me." *(beat)* "I'd have to check which." | sets `T_MOTT_FACE_UNKNOWN` groundwork |
| 3 | "Do you have a photograph of him?" | `[TOPIC · retain]` | "I have *the* photograph of him." *(It is a stock portrait. Sheng has the same one in his window, advertising collars.)* | |
| 4 | "You've spelled my name wrong." | `[COMIC · counted-repeat]` | "Have I! Which way?" | `MISSPELLINGS_SEEN` +1 |

**Option 4 responses rotate and never resolve:**
> "That's how it's spelled in Providence, is it? Extraordinary place."
> "I'll fix it in the next edition." *(He introduces a new error.)*
> "The type's worn. It's not my fault the letter B has opinions."


## `FRA_B1` — the trade *(W1 growth)*

Vessel's destination for a story. Frame does not want money; money is not printable.

> **FRAME:** "A story for a schedule. That's the rate. It's always been the rate."

| # | Option | Tag | Response | State |
|---|---|---|---|---|
| 1 | "A piano tuner bought the worst claim in the district on purpose." | `[PROGRESS · remove]` | "ON PURPOSE! Is it true?" *(beat)* "Don't tell me. It's better not knowing." *(He prints it. The headline misspells Grubb. The story is oddly kind.)* | gives Vessel's coach + date; B1 |
| 2 | "There's a raccoon in the Nugget with a name." | `[PROGRESS · remove]` | "A NAMED raccoon. Sir, you are a *wellspring*." *(Also accepted. Also printed. Page one.)* | same grant — either story pays |
| 3 | "What did you print about Vessel leaving?" | `[TOPIC · retain]` | "'BELOVED CITIZEN ANSWERS CALL OF COMMERCE.' He owed me for six advertisements. The headline was cheaper than forgiving the debt." | — |
| 4 | "Print a correction: my name." | `[COMIC · counted-repeat]` | "A correction! We run those in the spring." *(second)* "It is not spring." *(third)* "Persistent AND punctual-minded. I may do a profile. How do you spell it?" *(He knows. He has never once used it.)* | — |

## `FRA_E1` — the obituary (E5) *(W1 growth)*

The one piece Frame gets right. He does not know why he is careful with it. He is careful with it.

> **FRAME:** "An obituary. For the piano man." *(He does not reach for the pun. It is the only pun he has ever declined.)*
> **THAD:** *(as a stranger, hat low)* "Did you know him?"
> **FRAME:** "Everyone knew him. He was—" *(a long pause, the first in his life)* "—he was the only man in town who fixed anything."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "What will you write?" | `[PROGRESS · remove]` | "The truth. It's an obituary. There are *rules*." *(There have never been rules. There are now.)* → the printed obituary reads THADDEUS GRUBB, correct, for the first and only time. E5 |
| 2 | "He owed you a quote." | `[TOPIC · retain]` | "He never gave me one worth having." *(beat)* "I invented better. He never complained. That was the quote, probably." |
| 3 | "Spell it right." | `[COMIC · remove]` | *(He looks up. He looks at the stranger for a long moment.)* "…I always meant to." *(He does. The gag pays off by stopping, and this is where.)* |

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
| 1 | "Why do you want my claim?" | `[PROGRESS · remove]` | "Told to." *(He does not consider this strange.)* → `T_PRATT_PAID` |
| 2 | "Told by whom?" | `[PROGRESS · remove]` | "Fella." |
| 3 | "Which fella?" | `[PROGRESS · remove]` | "Didn't say. Paid, though. Regular." |
| 4 | "How much are they paying you?" | `[PROGRESS · remove]` | "Two dollars a week." *(This is the puzzle. He is being paid two dollars a week to acquire something being offered eleven thousand.)* |
| 5 | "How's the bite?" | `[COMIC · retain]` | "Healing wrong." *(Every time, for the rest of the game, in every act, including the ending.)* |


## `PRA_D2` — the first encounter *(W1 growth)*

Pratt discovered on Prosperity with a stake and a mallet, mid-jump, unhurried about it.

> **THAD:** "You're standing on my claim."
> **PRATT:** "Yep." *(He continues standing on it.)*

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "That's my stake you're pulling up." | `[PROGRESS · remove]` | "Was in the way." *(Of what?)* "The new stake." → D2 opens |
| 2 | "I'll fetch the law." | `[TOPIC · retain]` | "Sump closes at four." *(This is true, and it is the entire legal system.)* |
| 3 | "We got off on the wrong foot." | `[COMIC · retain]` | *(He looks at his feet, checking.)* "Nope." |

## `PRA_D6` — after the signing *(W1 growth)*

The quitclaim signed, the arithmetic done, the offers continuing regardless.

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "Who was the second man who paid you?" | `[PROGRESS · remove]` | "Never saw him. Money came under the laundry door." *(beat)* "Sheng's door. Thursdays." → corroborates D3; the trail runs through the Thursday ledger |
| 2 | "What will you do now?" | `[TOPIC · retain]` | "Keep the claim next to yours tidy." *(It is not his claim either. Nobody has ever had the heart to tell him, and by now it is his the way anything is anybody's here: by upkeep.)* |
| 3 | "Twenty dollars and the hen." | `[COMIC · retain]` | *(a long, respectful pause)* "…You're learning the market." |

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
| 1 | "I need a boundary divined." | `[PROGRESS · remove]` | "The *earth* will speak — two dollars — the earth will speak to me of *lines and limits* — in advance —" |
| 2 | "How does the rod work?" | `[TOPIC · retain]` | "It is drawn to the *hidden metal*." *(It is brass. Brass is not drawn to gold. She humphs when this is raised and does not address it.)* |
| 3 | "Does it ever not work?" | `[COMIC · retain]` | "It has never not worked." *(beat)* "It has occasionally been *early*." |
| 4 | "Do you ever hear anything?" | `[TOPIC · remove]` | *(genuinely puzzled)* "…Hear?" *(She has been reading ground resonance for eleven years and has never once considered that she is listening.)* → **the Act IV corroboration, planted here and never mentioned again** |

**Act IV:** if Thad returns after `T_VOID`, she is at Prosperity, holding the rod, staring at the ground, saying nothing. Her only line: *"…It's loud here."*

---

# AH-LAM SHENG
### Laundry; and, in practice, the bank

**Gates:** D3, D4. One Assay pair. War contradiction #5.
**Voice rule:** precise, economical, and drier than anyone. He is the most competent person in Consolation after Winnie, and the town's total inability to notice is the joke — a joke made entirely at the town's expense, never at his. He is the only character who finds Thad genuinely funny, and shows it by correcting his arithmetic.

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "Who's paying Nickel Pratt?" | `[PROGRESS · remove]` | "A man who pays through a second man, so that he has paid nobody. It is a common arrangement here. I hold paper on both of them." |
| 2 | "You hold paper on the Improvement Company?" | `[TOPIC · retain]` | "On rather a lot of it. They come in on Thursdays. They are very warm to me on Thursdays." |
| 3 | "Why does nobody know this?" | `[TOPIC · retain]` | "Because I do laundry." *(He returns to doing laundry.)* |
| 4 | "Was the Colonel in the Eleventh Ohio Mounted?" | `[TOPIC · remove]` | "There is no Eleventh Ohio Mounted. There is a Ninth. My brother was in it." → `WAR_CONTRADICTIONS` +1 |
| 5 | "I have four dollars." | `[COMIC · counted-repeat]` | "You have two dollars and forty cents. I have watched you spend the rest. You are not a careful man, Mr. Grubb, but you are an entertaining one." |


## `SHE_D1` — the paper *(W1 growth: D3, D4)*

The bank that does laundry. The loan scene, and the only due diligence in the territory.

> **SHENG:** "You want money."
> **THAD:** "I want information."
> **SHENG:** "Information is money that has learned to read. Sit down."

| # | Option | Tag | Response | State |
|---|---|---|---|---|
| 1 | "Show me the Thursday ledger." | `[PROGRESS · remove]` | "No. I will read it *to* you. A ledger leaves this room, my customers leave town." *(He reads. The second man's payments to Pratt trace, by amount and date, to a Company draft. He reads the amounts twice, because Thad's arithmetic is what it is.)* | D3; sets `T_PRATT_TRAIL` |
| 2 | "I need four dollars." | `[PROGRESS · remove]` | "You need two dollars and sixty cents, and you will have it at ten per cent, and you will pay it back, because I have watched you and you are honest in the one way that matters: absently." | D4; the stake money |
| 3 | "Why help me?" | `[TOPIC · retain]` | "You are the first customer in nine years whose collar and whose story got dirty in the same place. It suggests the story is true." | — |
| 4 | "What do you think is under Claim One?" | `[TOPIC · retain]` | "Nothing. What is under a story? More story." *(He is exactly right, one ridge to the left.)* | — |

---

# REVEREND SOWERBY
### Charges by the adjective

**Gates:** E3. One Assay pair. Holds the pencil at Duel Four.
**Voice rule:** enormous feeling, deployed at industrial scale for men he has never met. He is not a hypocrite; he genuinely feels all of it, every time, for money.
**Mechanic:** `SOWERBY_ADJECTIVES` — a live price counter visible on screen during E3. Negotiating a cheap funeral is a dialogue puzzle where the player is trying to make Thad sound *worse*.

## `SOW_A1` — the root *(W1 growth)*

Available from Act I. He assumes every visitor is bereaved until corrected, and is slightly disappointed when corrected.

> **SOWERBY:** "My deepest— are you *well*?"
> **THAD:** "Quite well."
> **SOWERBY:** "…How wonderful," *(recovering)* "how wonderful for you."

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "Tell me about the bell." | `[PROGRESS · remove]` | "A half-step flat since the day it was hung, and I have struck it every morning for six years, and I will tell you a secret, Mr. Grubb: I have stopped hearing it." *(Load-bearing for the funeral theme and the man does not know it.)* |
| 2 | "What do your services cost?" | `[TOPIC · retain]` | "Feeling is free. *Articulated* feeling is priced by the adjective. The board is by the door." |
| 3 | "Do you believe in Mott's gold?" | `[TOPIC · retain]` | "I believe in what fills my pews, and Mr. Mott fills them better than I do. I try not to examine the arrangement." |
| 4 | "You have a fine speaking voice." | `[COMIC · counted-repeat]` | "I KNOW." *(second, softer)* "I know." *(third, to himself, genuinely moved)* "…thank you." |

## `SOW_C1` — negotiating one's own funeral

> **SOWERBY:** "And how shall we remember the departed?"
> **THAD:** "Cheaply."

| Option | Effect |
|---|---|
| "He was a beloved and industrious young man of rare promise." `[retain]` | +4 adjectives — **$8** |
| "He was a man." `[retain]` | +0 — **$0.** *(Sowerby, wounded: "That is not a eulogy, that is a census.")* |
| "He was present." `[remove]` | +0 — accepted, grudgingly, at minimum rate — and the negotiation ends, having succeeded |
| "He tuned pianos." `[retain]` | +0, and Sowerby delivers forty minutes on it anyway, free, unprompted, weeping |

**Correct solution:** "He was present." The cheapest possible funeral in the history of the territory, and the sole reason Thad can afford to die.

**At the graveside, Sowerby departs from the agreed text and eulogises for eleven minutes about a man he met on Tuesday.** He is not billed for it. It is the kindest thing anyone does in the entire game and Thad is in the box and cannot hear it.

---

# MINOR TREES — grown *(W1)*

## REGISTRAR CADWALLADER SUMP — four nodes, act-gated

**Voice:** every response is a citation. Never corrupt, never unhelpful, completely immovable. The one man in Consolation the paperwork actually protects.

**`SUM_A1` (Act I — filing the deed, A8/A9):**

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "I need to file this deed." | `[PROGRESS · remove]` | "Form 12-C. The pen is chained for both our sakes." *(On completion he reads the boundary aloud, tonelessly, and mentions that Prosperity abuts Claim One, O. Mott — the Act I turn, delivered as filing procedure.)* |
| 2 | "The deed's drawn wrong side up." | `[TOPIC · retain]` | "Statute does not specify an orientation. You would be surprised how much statute does not specify. I would not. I have read it." |
| 3 | "Is there a form for that?" | `[COMIC · counted-repeat]` | "There is a form for everything, Mr. Grubb. That is the *point* of forms." *(second)* "12-F. Requests, Facetious." *(He is not joking. It exists. He files it.)* |

**`SUM_B1` (Act II — the three documents):** the trials' paper spine. One `[PROGRESS · rephrase]` option per document — "About Document A—" rephrasing as each is satisfied — and the citation for why B can only be issued to the deceased, delivered without the slightest acknowledgement that this is remarkable.

**`SUM_C1` (Act III — accepting the death certificate):**

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | *(present the certificate)* | `[PROGRESS · remove]` | *(He examines it. He examines Thad. He stamps it.)* "The office does not require the deceased to be absent. An oversight, possibly. I do not correct statute. I administer it." |
| 2 | "You know I'm not dead." | `[TOPIC · remove]` | "I know what is *certified*, Mr. Grubb. It is the only kind of knowing this window does." |

**`SUM_F1` (Act IV — the filing)** is doc 48's S6. His one human moment is scripted there: *"…That's a very old claim number."* He stamps it. He does not look up. He knows exactly what he is doing.

## DEKE VESSEL — three nodes and two duels

**Voice:** sunny, shameless, delighted by his own villainy — the only man in the game with no secret, because he tells everyone everything and they buy the claim anyway.

**`VES_A1` (Act I — the swindle, pre-departure):** the sale itself, staged in the opening's shadow: he is gone by the time the player can act, and this node exists as the *remembered* pitch, replayed at the coach stop hotspots. Not interactive; the con is already over. That is the joke of Act I.

**`VES_B1` (Act II — found again, Duel One):**

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "You sold me a worthless claim." | `[PROGRESS · remove]` | "I sold you a *claim*. Worth is your department. Mine's volume." *(He is genuinely pleased to see Thad. He remembers him fondly, the way a fisherman remembers a good fish.)* |
| 2 | "I want my four dollars back." | `[TOPIC · counted-repeat]` | "They're working, son. Money *works* out here." *(second)* "They've been promoted." *(third)* "They're in hospitality now." |
| 3 | "Teach me to lie like that." | `[ASSAY · remove]` | "Can't teach it. Can *demonstrate* it." → **Duel One.** He teaches Tier 1 by beating Thad with it, cheerfully, twice if asked |
| 4 | "You'll answer for this someday." | `[COMIC · retain]` | "I answer for it *constantly*. Nobody accepts the answer." |

**`VES_F1` (Act IV — the hotel):** he has bought the hotel. With, he explains proudly, Thad's four dollars, "and some other fellows' several thousand." One option, `[COMIC · retain]`: "Was it worth it?" — "The four dollars? Son, your four dollars *built the mezzanine*."

## THE LIVERY MAN — two nodes

**`LIV_A1`:**

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "I need the mule for the diggings road." | `[PROGRESS · remove]` | "You don't hire Grievance. You *apply*. She'll look at you. Then we'll know." *(She looks. A long moment.)* "…Huh. First time for everything." → D-travel opens |
| 2 | "Why 'Grievance'?" | `[TOPIC · retain]` | "Had a partner once. She took his side." |
| 3 | "Is the mule all right?" | `[COMIC · retain]` | "He's fine. He's just got a view." |
| 4 | "What's that tune?" | `[ASSAY · remove]` | *(He hums the pitch. Badly. It is recognisably the town theme and recognisably wrong, and Thad's ear files it.)* → his Assay pair |

## THE UNDERTAKER — two nodes

**`UND_A1` (Act I — the Pike news):**

| # | Option | Tag | Response |
|---|---|---|---|
| 1 | "I'm looking for Ezra Pike." | `[PROGRESS · remove]` | "Plot eleven." *(beat, with total indifference)* "He's not receiving." → `T_PIKE_DEAD`, and the letter of introduction becomes what it remains: a letter to a man who is dead |
| 2 | "How did he die?" | `[TOPIC · retain]` | "Owing me." *(This is the complete answer, and the only eulogy Pike gets until Thad reads the headboard.)* |
| 3 | "My condolences." | `[COMIC · retain]` | "Accepted on his behalf. He'd have wanted the credit." |

**`UND_C1` (Act III — arrangements):** the coffin fitting. One `[PROGRESS · remove]` — "I'll need your best pine, handles, plate" — met with the measuring wall, the pencil, and no questions at all: *"Sizing's free. It's the only thing that is. Stand straight."* He is the only person in Act III who is completely unsurprised, because in his trade everyone lies down eventually and half of them get up in the night to check on things.


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
> "Dear Mother — My estate — my SITUATION — is valued by knowledgeable men at $30,000 or better, and the whole town turned out on Tuesday to honor me. I could not be more warmly regarded if I were dead. — Your Thaddeus."

**ACT IV — the only version offered. Four lines, entirely true.**
> "Dear Mother.
> I was robbed, and it was the making of me.
> The gold is real. The story is better. I will tell you both in the spring.
> — Your Thaddeus."

---

# PART FOUR — VOLUME

| Component | Estimate |
|---|---|
| 8 core trees, act-gated, all branches | ~1,400 lines — **W1: spines grown to full nodes; every option carries its errata-57 aftermath. Remaining depth is repeat-variant volume, written per errata 37's surviving obligation as rooms are built** |
| Minor characters (5) | ~250 — **W1: all grown to real nodes** |
| Liar's Assay (24 pairs × 4 options + mockery) | ~200 |
| Letters home (4 acts × 3 versions) | ~90 — **W7: written, all ten** |
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
