# 120 · Act I, by hand (2026-11-10)

Doc 114's rows **I-1, I-2 and I-3**, and three small things doc 116's yardstick asked for, designed and written under Tyler's overnight mandate (errata 245: "Yes, build it all"; "feel free to change the story too"). One voice, to doc 59. Every change to how a puzzle is solved is listed in `docs/119-what-changed-overnight.md`.

Nothing here touches a load-bearing line, HOB_C1, the letters home, or the ending.

## What changes for the player

| Row | Where | Today | Now |
|---|---|---|---|
| **I-2 · Pike's grave** | Boot Hill, Act I | He arrives in silence. The reason he came is two LOOK lines | He says why he came as he arrives, and can hold the letter out to the board. It is the last thing he does as a man with an errand |
| **I-1 · The dinner, played** | Fanshawe's office | A list of things to say; one of them ends it | He is at the table and the table can be tried. Under the silver cover is the contract, served. He ends the dinner by putting the cover back on it |
| **I-3 · The boundary, walked** | Madame Ozymandia's tent | She divines from the map while he watches | She hands him the rod. He walks the boundary on the map, leg by leg, and she takes the credit for each (errata 251) |
| **The eggs, improved** | Prosperity, Act I | Two things to try on the raccoon | A third: the tonic on the eggs, and the raccoon's opinion of it |
| **The card** | Act III | The wreath goes on his coffin bare | The obituary goes under its ribbon first, where a card goes, and leaves his pocket with it |
| **The invitation** | Act I | Carried to the end of the game | Left on the Colonel's table |

**Verbs.** CLOSE solves the dinner (doc 114 X-1): the cover goes back on the contract. OPEN finds it.
**Item on item.** The tonic on the eggs is the third; the obituary on the wreath the fourth (doc 114 X-2 asks five).

---

## What each row needs built

### I-2 · Pike's grave

- The first entry to Boot Hill says two lines (once).
- THE LETTER on PIKE'S MARKER: a beat, nothing written, nothing taken. The letter stays; it is wanted at the church in Act II.
- **Art:** none.

### I-1 · The dinner, played

- He is seated as now, and FAN_A2 opens as now. Leaving the conversation no longer leaves the table: he stays in his chair until the dinner is over (`T_DINED`) or he goes to the door.
- **The door, from the table:** the Colonel's own line for leaving ("Already? Then come back when you're hungry. The table will keep."), and he goes. The dinner starts again on the next entry, as now.
- **On the table, for the dinner only:** MY GLASS, THE BOTTLE, THE COVERED DISH.
- OPEN the dish: the contract is under it (`T_CONTRACT_SERVED`). The dish is THE CONTRACT from then on.
- **CLOSE the contract: the dinner ends.** Thad's own line ("I mean to work it myself."), the Colonel's ("Of course you do."), and doc 57 A10's beat 3, word for word: the glass, the handkerchief, `T_DINED`.
- FAN_A2's option 6 no longer ends it. It is said, the Colonel agrees, and the dish is still there.
- Everything else in FAN_A2 is as written. Five options still sell the claim in words Thad does not hear as a sale, and nothing is sold.
- **Art (brief below):** the dish uncovered, the contract on the plate. Until it is drawn the uncovering is told.

### I-3 · The boundary, walked

*Built 2026-11-10 (errata 251), on Tyler's "Do all the Not Done things." The first design here had the player draw any line and Sump record it faithfully. That was wrong: the survey's words are fixed (doc 57 A7), Sump reads them at A9, the third copy quotes them, and doc 108's mine is walked by them. So the player walks that boundary, and no other.*

- THE COMPANY MAP on Madame Ozymandia, once she is paid: she unrolls it (doc 57's own direction), hums, and the rod does not move. She gives Thad the rod. The map fills the view (`T_SURVEYING`).
- He points the rod at things on the map, and she announces each leg as the earth's: **the stake; uphill; the larger of the two rocks; along the line the rod preferred; home.** Each of her lines cues the next. A wrong place gets her answer and nothing else.
- The line is drawn on the map as he goes.
- Home: doc 57 A7's three lines, word for word, the form, THE SURVEY, **A7**.
- He cannot leave the table mid-survey, and there is nothing to get wrong for good.
- It is the first time the player walks "stake, uphill, big rock, the still one." The second is in the dark, in Act II, with nobody announcing it (doc 108).
- **Art:** the map large is in (`art/backgrounds/room-16-company-map.png`). The line is drawn by script (`tools/art/survey-line.py`).

### The small things

- **The eggs, improved:** DR. PURVIS'S TONIC on THE PICKLED EGGS, either way round. The tonic is not spent. The eggs on the hole then have their own answer, and are spent.
- **The card:** THE OBITUARY on THE COLONEL'S WREATH, either way round. The obituary leaves with it. Laid on the coffin, the undertaker has a second line.
- **The invitation** leaves when the dinner is over.

---

## THE LINES

*Each hotspot's LOOK and LISTEN rotate 1, 2, 3, then hold the last.*

### I-2 · Pike's grave: the lines

**ARRIVING** · *Boot Hill, the first time*
> "Boot Hill. Mr. Pike's board is at the back, where they put a man who is not expected to have callers."
> "A coach, four dollars, and my father's best handwriting. I had better at least knock."

**PIKE'S MARKER** · USE THE LETTER
- USE THE LETTER, *the first time* — "I am holding a letter out to a plank, as one would to a butler." "'To Mr. Ezra Pike, by the hand of my son.' I am the hand. I regret to say he is the late." *"I cannot leave it with him. The wind would have it at the Improvement Company by morning, and I may want an introduction yet."*
- USE THE LETTER, *again* — "He has been introduced to me once. I will not press the acquaintance."

### I-1 · The dinner: the lines

*Fanshawe's office, the dinner, from his chair.*

**MY GLASS**
**LOOK** 1 "My glass! Crystal. I've never drunk from crystal, and I'm trying to look as though I do it every Tuesday. It was full when I sat down and it has been full ever since, whatever I do to it." · 2 "The wine comes up to the same line each time, like a tide with a patron." · 3 "I have never seen him pour. I have only seen the bottle put down."
**LISTEN** 1 "A small note, when the bottle touches the rim. He plays it very well." · 2 "Wine, arriving. It does not glug. He would not allow it to glug." · 3 "Nothing. It is full, and full things are quiet."

**THE GLASS, TRIED**
- USE — "It was full again before I had set it down." "One glass, by my count. By the glass's count, none." *(second)* "Two. I am keeping the tally on my fingers, under the table, where he cannot refill them." "I have stopped counting. The glass never started."
- PICK UP — "I have it. So has he, in every way that signifies."
- PUSH — "I moved it away. He moved it back, with the air of a man returning my hat."

**THE BOTTLE**
**LOOK** 1 "A dark bottle with a label in French. I can't read French. I'm nodding at it knowledgeably anyway. It has been at this table longer than I have and knows the form." · 2 "It is never emptier. I am beginning to think there is a second one, and that they take turns." · 3 "The label has a château on it. The château has more windows than Consolation."
**LISTEN** 1 "Nothing, while it stands. It is biding his time for him." · 2 "A cork somewhere under the table, being managed." · 3 "The glass, ringing a little, the way a thing does when it knows what is coming."

**THE BOTTLE, TRIED**
- PICK UP — "He has it before I do. He has had it since before I thought of it."
- USE — "I don't pour at this table. I've looked for the chance."
- CLOSE — "It has no cork that I can find. I do not believe he has ever needed one."

**THE COVERED DISH**
**LOOK** 1 "A silver cover the size of a saddle. Whatever is under it has been kept warm for me." · 2 "I can see the whole table in it, bent, and the Colonel at the middle of the bend." · 3 "Everything else has been pressed on me twice. This he has not mentioned once."
**LISTEN** 1 "Nothing. A cover keeps the sound in with the heat." · 2 "A very small tick, as the silver cools. It is in no hurry and neither is he." · 3 "Nothing. It is the only quiet thing on the table, and I do not find that restful."

**THE DISH, TRIED**
- OPEN — "Under the cover, on a warmed plate, with a sprig of parsley: a contract." **FANSHAWE:** "Ah! You've found the fish. Take your time with it, Mr. Grubb. I never hurry a man at his fish." → `T_CONTRACT_SERVED`
- PICK UP — "It is the size of a saddle and it is his. I should need a horse and a reason."
- PUSH — "It does not slide. It has been set down by a man who meant it to stay."
- CLOSE — "It's closed. That's the difficulty with it."

**THE CONTRACT**
**LOOK** 1 "'The undersigned, being of sound mind and well dined.' My name is in it already, spelled correctly, which in this town amounts to a warning." · 2 "It is very warm, and very short, and the parsley is fresh. He has gone to more trouble over this than over the soup." · 3 "There is a line at the bottom with nothing on it. The whole dinner has been walking me toward that line, and I've been enjoying the walk."
**LISTEN** 1 "Paper, settling on hot china. It sounds comfortable there." · 2 "Nothing. It has said everything it means to, in small type." · 3 "The Colonel, not mentioning it. He is doing that quite loudly."

**THE CONTRACT, TRIED**
- USE — "He has not asked me to sign. He has only made it extremely convenient."
- PUSH — "I pushed it an inch away. He passed me the salt, and now it is two inches nearer." "It is nearer than when I began. I shall stop helping."
- OPEN — "It is one page. There is nothing to open. It took him one page."
- CLOSE — "I mean to work it myself." **FANSHAWE:** "Of course you do." → doc 57 A10, beat 3; `T_DINED`

*(PICK UP on the contract is doc 121's: the parsley.)*

**BEAT 3** *(doc 57 A10, word for word; said after the CLOSE)*
> **FANSHAWE:** "Steady! Not a drop on the cloth. Take my handkerchief." "Keep it. I have dozens."

**`FAN_A2` option 6**, *"I mean to work it myself."* — **FANSHAWE:** "Of course you do." **FANSHAWE:** "Don't let your fish go cold." *(second)* **FANSHAWE:** "Of course. Of course. Do try the fish."

**`FAN_A2`, leaving the conversation** — **FANSHAWE:** "Eat, eat. I can talk enough for two, and frequently do."

**THE DOOR** *(from the table, before the dinner is over)* — doc 04's line for leaving, word for word: "Already? Then come back when you're hungry. The table will keep."

### I-3 · The boundary: the lines

*Madame Ozymandia's tent, the map unrolled and filling the view, the rod in Thad's hand.*

**MADAME OZYMANDIA** · USE THE COMPANY MAP, *once she is paid* — doc 57 A7's direction as far as "The rod does not move.", then:
> **OZYMANDIA:** "Claim Two. Somebody has circled it already. How thoughtful." *(beat)* "Mmmmmmmmmmm." *(long pause)*
> **OZYMANDIA:** "The earth is shy today, darling. Take the rod. It only wants walking round the property."
> **THAD:** "I am to do the divining."
> **OZYMANDIA:** "You are to hold the stick. I shall do the divining. Commence."

**THE MAP, AGAIN**
- USE THE COMPANY MAP, *the survey drawn* — **OZYMANDIA:** "The earth has spoken once, darling. It does not repeat itself for the same two dollars."

**THE STAKE**
**LOOK** 1 "A post with a dot on it, at the corner of my claim. On paper it is the most definite thing I own." · 2 "Somebody drew it with one stroke and did not go back. I know the feeling." · 3 "The stake. Everything I have starts there, thereabouts."
**LISTEN** 1 "Paper, under the tip of the rod. A dry little scratch." · 2 "Madame Ozymandia, humming on one note. It is nearly an A, and nearly is the trouble." · 3 "Nothing from the stake. It has made its point."

**THE STAKE, WITH THE ROD**
- USE, *commencing* — "The tip of the rod, on the stake." **OZYMANDIA:** "Commencing at the stake. Thereabouts. The earth is not a pedant, darling. Now: which way does it go?"
- USE, *home* — **OZYMANDIA:** "Thence home." "The earth has spoken. The earth was brief." *"Is that a Form 12-C?"* **OZYMANDIA:** "The earth prefers them." → THE SURVEY, **A7**
- USE, *too soon* — **OZYMANDIA:** "Not home yet, darling. Nobody goes home from the doorstep."

**THE SLOPE**
**LOOK** 1 "Hatching, to show the ground going up. The draughtsman tired about halfway, and so, I expect, does the hill." · 2 "Uphill of my claim, in pencil. It looks steeper drawn than I hope it is walked." · 3 "A good deal of slope with nothing on it. That is what the Company calls prospect."
**LISTEN** 1 "The rod's tip, crossing the hatching. It ticks on every stroke, like a stick along a fence." · 2 "Her bracelets, when she leans in. The earth's voice has a quantity of brass in it." · 3 "Nothing. Drawn hills are quiet. I have no evidence about the real one."

**THE SLOPE, WITH THE ROD**
- USE, *uphill* — **OZYMANDIA:** "Thence uphill! With feeling, darling. More feeling than that." *"I am pushing a stick up a map."* **OZYMANDIA:** "And it shows."
- USE, *the line the rod preferred* — **OZYMANDIA:** "Mmmmmmmm." "There. Some forty feet." *"Forty feet of what?"* **OZYMANDIA:** "Of preference, darling. Thence home."
- USE, *out of turn* — **OZYMANDIA:** "Not the hill just now, darling. The earth keeps to an order. It is nearly the only thing here that does."

**THE LARGER ROCK**
**LOOK** 1 "The larger of two rocks. It has been drawn with shading, which the other has not. Rank tells, even in geology." · 2 "A rock, on a map, where a careful man would put a monument. This district puts rocks." · 3 "It is the only thing above my claim with a shadow. I take it for a landmark, having no choice."
**LISTEN** 1 "Nothing. It is a drawing of a rock, and has the reticence of both." · 2 "The lamp, ticking overhead. The rock makes no comment." · 3 "Her humming goes up a little when the rod comes near it. I think she likes this one."

**THE LARGER ROCK, WITH THE ROD**
- USE, *to the rock* — **OZYMANDIA:** "To the larger of the two rocks. The earth has always had taste. And thence, hum with me, darling, along whatever line the rod prefers."
- USE, *out of turn* — **OZYMANDIA:** "In its turn, darling. A rock will wait. It is their whole gift."

**THE SMALLER ROCK**
**LOOK** 1 "The smaller rock. It sits a little apart, like a man who was not asked." · 2 "No shading. Whoever drew this map had a favorite, and this was not it." · 3 "It is hardly a rock. In fairness, I am hardly a prospector."
**LISTEN** 1 "Nothing, and from the smaller rock I had expected less." · 2 "The humming drops when the rod passes over it. Even the earth cannot spare it the time." · 3 "Nothing. It is being brave about it."

**THE SMALLER ROCK, WITH THE ROD**
- USE — **OZYMANDIA:** "Not that one. Nobody surveys to the smaller rock. It would only get ideas."

**CLAIM ONE**
**LOOK** 1 "Claim One. Beside mine, and the same size, and nobody has circled it." · 2 "A square with a 1 in it. It got here first, which in this territory is most of the law." · 3 "It shares a line with mine. I have looked for a difference between the two, and the map does not record one."
**LISTEN** 1 "Nothing. A numeral in a box." · 2 "The rod goes quiet over it, or she does. With her I cannot always tell which." · 3 "Nothing. Whatever is said about Claim One is not said on this map."

**CLAIM ONE, WITH THE ROD**
- USE — **OZYMANDIA:** "The rod declines to trespass, darling. It is the only thing in the district with the scruple."

**CLAIM TWO**
**LOOK** 1 "Claim Two, in a red circle. Somebody marked it before I ever came, and I should like to know whether that is a welcome or a target." · 2 "A square with a 2 in it. I paid four dollars and a watch for that numeral." · 3 "Prosperity, from above. It looks drier."
**LISTEN** 1 "The red ink has a ridge to it. The rod catches on my own claim." · 2 "Her humming, steady, directly over my property. I am being billed for that." · 3 "Nothing. At this scale my mud is silent, which is an improvement."

**CLAIM TWO, WITH THE ROD**
- USE — **OZYMANDIA:** "One does not survey the middle, darling. One surveys the edge, and trusts the middle to follow."

**THE CREEK**
**LOOK** 1 "The creek, in three wavering lines. It is the best-drawn thing on the sheet, and it is leaving." · 2 "It runs past the foot of both claims and stops for neither." · 3 "A creek and, beyond it, a road. Two ways out of the district, drawn with great care."
**LISTEN** 1 "Nothing. She does not hum over water. I gather it interferes." · 2 "The rod, crossing the lines. Three ticks, like a man counting his change." · 3 "Nothing. It is a drawing of a noise."

**THE CREEK, WITH THE ROD**
- USE — **OZYMANDIA:** "Not downhill. Water goes downhill. The earth has more self-respect."

### The eggs, improved

**DR. PURVIS'S TONIC** · USE *on THE PICKLED EGGS*
- USE DR. PURVIS'S TONIC — "A drop of Dr. Purvis." *(beat)* "The brine has gone the color of a bruise. The eggs have been restored. I could not say to what, and I notice the label does not either." → the eggs, improved; the tonic is not spent.

**THE HOLE** · USE THE PICKLED EGGS, *improved, with the raccoon in*
- USE THE PICKLED EGGS, *improved* — "An egg at the entrance, with Dr. Purvis's compliments." *(beat)* *(Thad ducks.)* "He has sent it back, at speed. I did not know they could throw."

### The card

**THE OBITUARY** · USE *on THE COLONEL'S WREATH*
- USE THE OBITUARY — *(Thad folds the obituary and tucks it under the ribbon, where a card goes.)* "Every wreath wants a card. This one says THADEUS GRUBBE, twice wrong, and SINCERELY, which I shall take on trust." → THE OBITUARY leaves inventory.

**THE COFFIN** · USE THE COLONEL'S WREATH, *with the card in it* — doc 118's exchange, then:
> **THE UNDERTAKER:** "Card's spelled wrong."
> **THAD:** "It is the correct wrong spelling."

---

## The art brief

Written to `reference/act1-dinner/brief.md` for the image session: one prop for the dinner (the dish uncovered, the contract on its plate), and the map large for I-3. Both are in.
