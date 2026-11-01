# THE LAST CLAIM IN CONSOLATION
## The Liar's Assay — Full Script

*Companion to Bible v2 and the Puzzle Graph. 24 boast/counter pairs · 4 duels · the calibration document for the game's entire voice.*

---

# PART ONE — THE INSTITUTION

## What it is, in-world

The Liar's Assay is how Consolation settles disputes over claims, debts, precedence, and seating. It is a formal bragging duel about the size of one's find. It has rules, judges, a fee, and a printed handbill of etiquette that Reverend Sowerby reads aloud at unbearable length before every match.

Nobody in Consolation finds it strange. It is treated with the gravity of a court, because it *is* the court — the nearest actual judge is four hundred miles away and does not want to come.

**The rules, as posted in the Bountiful Nugget:**

> 1. A man may not be interrupted in his account.
> 2. A man's account may be doubted only by a better one.
> 3. Truth is admissible but has never been raised.
> 4. The judges' decision is final, and may be appealed to the same judges.
> 5. No firearms. No knives. No arithmetic.

Rule 3 is the game's thesis, hiding in plain sight for fifteen hours.

## How it plays

Turn-based dialogue combat, SCUMM style.

- The opponent delivers a **boast**. The player picks from four available **counters**.
- Exactly one is correct. The correct counter always works by **claiming personal acquaintance with the specific thing boasted about, and then downgrading it.** This is the mechanical rule and every pair obeys it. "I've seen your bishop. He was malnourished."
- A correct counter wins the exchange, and the boast becomes available for Thad to use himself.
- A wrong counter loses the exchange and the opponent mocks it. **The wrong ones are funny too** — the player should sometimes pick one deliberately, and this must survive implementation.
- First to five exchanges wins the duel.

**Learning:** Thad acquires counters by losing. When an opponent uses a boast Thad has no answer to, Thad *hears the correct counter from the crowd* — some bystander mutters it, and Thad writes it down. This is why Duel One cannot be won.

---

# PART TWO — THE PAIRS

Twenty-four. Distribution matches the puzzle graph: 4 from Vessel's first duel, 5 from Winnie, 6 from Pratt, 5 from incidental townsfolk, 1 from Hob, 3 reserved for the final duel.

## Tier 1 — Learned from Vessel, Duel One (4)

**1.**
> *"I pulled a nugget out of the Feather River the size of a bishop's fist."*
> **"I've seen your bishop. He was malnourished."**

**2.**
> *"My claim assayed at nine hundred dollars to the ton."*
> **"So did my grandmother, and she was mostly gravel."**

**3.**
> *"I've washed more gold than you've washed shirts."*
> **"That's true of everyone here, and it's a matter of some concern."**

**4.**
> *"My luck is famous from here to Sacramento."*
> **"It's famous *in* Sacramento. That's why you're here."**

## Tier 2 — Learned from Winnie Ledger (5)

*She spars flatly, without enjoyment, and is the best in the territory. She has never entered a duel because she considers it beneath the office.*

**5.**
> *"My strike was so rich the assayer wept."*
> **"He weeps at everything. It's why we stopped inviting him."**

**6.**
> *"I've had three fortunes and lost two."*
> **"Then you've had one fortune and told it twice."**

**7.**
> *"I turned down ten thousand dollars for my claim."*
> **"I was there. He offered four, and you cried."**

**8.**
> *"I've never filed a claim that didn't pay."*
> **"You've never filed a claim."**

**9.**
> *"Every man in this territory owes me money."*
> **"Every man in this territory owes someone money. You have described the territory."**

## Tier 3 — Learned from Nickel Pratt (6)

*Pratt is a natural and does not know it. He is astonished every time he wins.*

**10.**
> *"There's more gold in my tailings than in your whole claim."*
> **"There's more gold in my boot, and I would like it back."**

**11.**
> *"My vein runs forty feet wide."*
> **"So does the road, and it's about as productive."**

**12.**
> *"I've dug through solid granite with my hands."*
> **"I have shaken your hands. They disagree."**

**13.**
> *"There's a mountain named for me."*
> **"There's a hole named for you. I have fallen in it."**

**14.**
> *"I hired forty men to work my claim."*
> **"I've met them. They are still waiting to be paid and they have formed opinions."**

**15.**
> *"The gold came up so fast it followed me home."*
> **"Everything follows you home. That is not gold. That is the dog."**

## Tier 4 — Collected around town (5)

*One each from Frame, Sowerby, Sheng, Ozymandia, and the livery man. Optional, missable, and two of them are the funniest in the game — which is the reward for talking to everyone.*

**16.** *(Frame)*
> *"I found a nugget shaped exactly like the President."*
> **"So did four men this month. It is a popular shape."**

**17.** *(Sowerby)*
> *"My father died rich."*
> **"Your father died owing me two dollars, and I have chosen to regard it as a legacy."**

**18.** *(Sheng)*
> *"The Improvement Company came to me on their knees."*
> **"The Company comes to everyone on their knees. It is how they get under the door."**

**19.** *(Ozymandia)*
> *"I panned a pound before breakfast."*
> **"You have never seen breakfast."**

**20.** *(Livery man)*
> *"I once bought a saloon with a single nugget."*
> **"I have been in it. You overpaid."**

## Tier 5 — Hob (1)

*Offered unprompted, in Act I, by the night watchman, to a man he has known for nine minutes. It is the only tactical thing Hob says in the first two acts and it does not make sense until Act III.*

**21.**
> *"I know where Mott's strike is."*
> **"So does everybody. That's the town. Try again."**

## Tier 6 — Reserved for Fanshawe (3)

*Cannot be used in any earlier duel. Two are acquired in Act III from Hob's confession; the third is the ending.*

**22.**
> *"I built this town."*
> **"You sold this town a map to a place that isn't there, and then sold it shovels."**

**23.**
> *"I have never been wrong about a claim in my life."*
> **"You have been right about exactly one, Colonel, and you have spent twelve years making sure nobody digs it."**

**24.** — *see Duel Four.*

---

# PART THREE — WRONG ANSWERS

Every node offers four counters. Three are wrong and all three must be funny. Sample wrong answers for pair 1 (*"the size of a bishop's fist"*):

> **"That is a very large fist."** — *Vessel: "It is. That's the point of the account."*
> **"I don't believe in bishops."** — *Vessel: "Nobody's asking you to worship it, son, only to be impressed."*
> **"I have a small nugget."** — *Vessel: "Then say so louder. That's how it's done."*

## Wrong answers, pairs 2–23 *(errata 73 A)*

*Three per pair, each answered by whoever threw the boast. A line marked **Vessel** is only ever thrown by Vessel (Duels One and Two). Pairs 4 and 9 are thrown by Vessel and by Fanshawe (Duel Three), so their answers are marked **Reply** and fit either man. Pairs 22 and 23 are Fanshawe's alone. No wrong answer claims acquaintance with the thing boasted about and downgrades it: that shape belongs to the right answer, and only to it.*

**2.** *("nine hundred dollars to the ton")*
> **"Assayed by whom?"** — *Vessel: "By a man I trust entirely. I see him every morning when I shave."*
> **"That is forty-five cents a pound. I have done the arithmetic."** — *Vessel: "Rule five, son. No arithmetic. It's on the wall."*
> **"Congratulations."** — *Vessel: "Don't congratulate a man in an Assay. It looks like losing, because it is."*

**3.** *("more gold than you've washed shirts")*
> **"I send my shirts out."** — *Vessel: "Then I've washed more gold than your laundress, and she won't mind hearing it."*
> **"I have four shirts. I am wearing the good one."** — *Vessel: "That's an inventory, Grubb. Nobody bets on an inventory."*
> **"Gold does not need washing. It is famously inert."** — *Vessel: "So's the audience, son. Look at them."*

**4.** *("famous from here to Sacramento")*
> **"I have never been to Sacramento."** — *Reply: "Then you'll have to take my word for it, and you just have."*
> **"Luck is what a man calls the parts he did not arrange."** — *Reply: "And the pencil calls it a point. Mark it."*
> **"I once found a dollar in a hymnal."** — *Reply: "Keep it. You'll want it for the fee."*

**5.** *("the assayer wept")*
> **"The assayer is a woman."** — *Vessel: "Then she wept prettily, and I lent her my handkerchief. Do keep up."*
> **"I would keep tears away from an assay. Salt affects the reading."** — *Vessel: "Everything affects the reading, Grubb. That's what I'm counting on."*
> **"Was he all right?"** — *Vessel: "He'll live. You, I'm less sure of."*

**6.** *("three fortunes and lost two")*
> **"Which one did you keep?"** — *Vessel: "The one I'm telling you. It's the only kind that lasts."*
> **"Then you have one left. Could you lend me four dollars?"** — *Vessel: "I could. I'd want a deed for it."*
> **"Two out of three is a poor rate of keeping."** — *Vessel: "It's a fine rate of telling, and telling's what's scored."*

**7.** *("turned down ten thousand dollars")*
> **"That was foolish of you."** — *Vessel: "It was. That's what makes it a good account. Nobody brags about the sensible thing."*
> **"I bought a claim from you for four dollars and a watch."** — *Vessel: "So you know I've been through hard times, Grubb. Thank you for raising it."*
> **"Who offered it?"** — *Vessel: "A gentleman. I didn't catch his name, on account of the weeping."*

**8.** *("never filed a claim that didn't pay")*
> **"I have filed one claim, and I regret it in detail."** — *Vessel: "Regret's not scored, Grubb. Only the size of the thing."*
> **"Never?"** — *Vessel: "Never is the strongest word in the territory, son. I use it sparingly and on purpose."*
> **"Some claims pay in experience."** — *Vessel: "That's what we tell the Eastern men, Grubb. Don't repeat it back to me."*

**9.** *("every man in this territory owes me money")*
> **"I do not owe you money."** — *Reply: "Not yet. The afternoon is young."*
> **"Would you like it in writing?"** — *Reply: "Nothing here is ever wanted in writing, Mr. Grubb. That's what keeps it cheerful."*
> **"Then you must be very rich, on paper."** — *Reply: "Paper's where all the money in this territory lives. It's the climate."*

**10.** *("more gold in my tailings")*
> **"You sold me my whole claim."** — *Vessel: "And I'd know, wouldn't I. That's why it's a strong account."*
> **"What are tailings?"** — *Vessel: "What's left over, Grubb. You'll be one shortly."*
> **"That is a low bar, and I will not pretend otherwise."** — *Vessel: "Pretending otherwise is the whole sport, son. You've just declined to play."*

**11.** *("forty feet wide")*
> **"Have you measured it?"** — *Vessel: "Measuring's for men who expect to be checked."*
> **"That is wider than this room."** — *Vessel: "Everything's wider than this room. That's why we come in here to say it."*
> **"I have a vein in my temple that does something similar when I am lied to."** — *Vessel: "Then you'll want to sit down, son. It's going to be a long afternoon."*

**12.** *("through solid granite with my hands")*
> **"Why would you not use a pick?"** — *Vessel: "A pick's for men with nothing to prove."*
> **"I tune pianos. My hands are the only part of me anyone has ever relied on."** — *Vessel: "Then keep them in your pockets, son. The judges can see them shaking."*
> **"Did it hurt?"** — *Vessel: "Only the granite."*

**13.** *("a mountain named for me")*
> **"Which one?"** — *Vessel: "The big one. You can't miss it, which is more than I can say for your counters."*
> **"I once had a dog named for me. It was a misunderstanding."** — *Vessel: "And did it come when you called it? Mine doesn't either."*
> **"Mountains are named by surveyors, as a rule, not for prospectors."** — *Vessel: "This one was named by me, son, which saved the surveyor a trip."*

**14.** *("forty men to work my claim")*
> **"Forty is a great many men for a small claim."** — *Vessel: "They were small men, Grubb. I hired them by the yard."*
> **"Are you hiring?"** — *Vessel: "Not tuners. Gold doesn't go flat."*
> **"I work my claim alone, with a raccoon in an advisory capacity."** — *Vessel: "Then you're over-staffed by one raccoon."*

**15.** *("it followed me home")*
> **"Gold has no legs."** — *Vessel: "Mine did. I'm sorry yours never learned."*
> **"Where do you live?"** — *Vessel: "Ask the gold. It found the place."*
> **"Nothing has ever followed me anywhere, except a bill."** — *Vessel: "Then the bill knows something the gold doesn't."*

**16.** *("shaped exactly like the President")*
> **"Which President?"** — *Vessel: "The one that's in, son. I'm a patriot."*
> **"Did it say anything?"** — *Vessel: "It said what Presidents say. I've forgotten it already."*
> **"I have a turnip shaped like the Vice President."** — *Vessel: "Nobody remembers the Vice President, Grubb. That's a turnip."*

**17.** *("my father died rich")*
> **"I am sorry for your loss."** — *Vessel: "Don't be sorry in an Assay, son. It's a forfeit."*
> **"My father died in debt, and he was very proud of how much."** — *Vessel: "That's a better account than mine, Grubb, and you've wasted it on a counter."*
> **"Of what?"** — *Vessel: "Richness. It runs in the family."*

**18.** *("the Improvement Company came to me on their knees")*
> **"The Company has been very courteous to me."** — *Vessel: "Then they've not finished with you yet."*
> **"Were they proposing?"** — *Vessel: "They were, and I said I'd think about it, and I'm still thinking. That's called leverage."*
> **"That is also how I tune the bottom octave."** — *Vessel: "Nobody here has heard a bottom octave, son, and the Company would charge it rent."*

**19.** *("a pound before breakfast")*
> **"What did you have for breakfast?"** — *Vessel: "Gold, Grubb. Weren't you listening?"*
> **"A pound troy, or a pound avoirdupois?"** — *Vessel: "A pound Vessel. It's heavier than both."*
> **"I am not at my best before breakfast either."** — *Vessel: "That's an admission, Grubb. We don't do those in here."*

**20.** *("bought a saloon with a single nugget")*
> **"This saloon?"** — *Vessel: "A better one. This one I won at cards, which is more respectable."*
> **"What did you buy with the change?"** — *Vessel: "The bartender. He's been very loyal."*
> **"I would not know what to do with a saloon."** — *Vessel: "You'd stand behind the bar, son, and the town would hand you its money. Hardest part's the apron."*

**21.** *("I know where Mott's strike is")*
> **"Where?"** — *Vessel: "If I told you, son, it'd be your account, and I'm using it."*
> **"So do I, approximately."** — *Vessel: "Approximately's where everybody keeps it. It's crowded."*
> **"Then why are you here and not there?"** — *Vessel: "Because there's no audience out there, Grubb, and a strike's no good without one."*

**22.** *("I built this town")*
> **"It is a very nice town."** — *Fanshawe: "Thank you, Mr. Grubb. I'll have that put on a plaque."*
> **"Some of it is level."** — *Fanshawe: "The important parts, Mr. Grubb. I see to the important parts."*
> **"With your own hands?"** — *Fanshawe: "With other people's, which is the modern way."*

**23.** *("never been wrong about a claim")*
> **"I have been wrong about several. I find it restful."** — *Fanshawe: "Then rest, Mr. Grubb. Some of us have a town to run."*
> **"Neither have I. I have only had the one."** — *Fanshawe: "Then we're both perfect, and only one of us owns the town."*
> **"That must be very lonely."** — *Fanshawe: "Not at all. Being right draws a crowd, Mr. Grubb. Look around you."*

**Duel Three, the fifth exchange** *("I have never told a lie in my life" — the three jokes beside pair 24)*
> **"Neither have I, and look where it got me."** — *Fanshawe: "Into a hole, by most accounts. Do try again, Mr. Grubb."*
> **"You just did."** — *Fanshawe: "That's not a counter, Mr. Grubb, that's an accusation, and we have no court for those."*
> **"I tune pianos."** — *Fanshawe: "And we are all very grateful. Was there anything else?"*

**Standing mockery lines** (rotated on any loss):

- *"That's not a lie, that's a remark."*
- *"You'll want to add a number to that."*
- *"There's a man in Sacramento who does that one properly."*
- *"I'll allow it, but the judges won't, and they're the ones with the pencil."*
- *"Son, you've told the truth. In front of people."*

That last one lands very differently in Act IV.

---

# PART FOUR — THE DUELS

## DUEL ONE — Deke Vessel (unwinnable by design)

*Puzzle B5. A camp two days out. Vessel is delighted to see Thad, which is the worst part.*

> **VESSEL:** "Grubb! You came all this way. Was the claim not to your liking?"
> **THAD:** "The claim contains a raccoon and an opinion."
> **VESSEL:** "It contained a raccoon when I sold it. You bought the whole thing."

Vessel opens with pair 1. Thad has no counters. He loses five straight exchanges. After each, a bystander mutters the correct line and Thad writes it in a notebook, out loud, deadpan:

> **THAD:** "Malnourished. Bishop. Yes."

*The other three, as he hears them (errata 75):*

> **THAD:** "Grandmother. Gravel. Yes."
> **THAD:** "Everyone. Shirts. Concern. Yes."
> **THAD:** "In Sacramento. Not from. Yes."

*Before the first exchange, Reverend Sowerby reads the handbill's five rules aloud, all of them, with feeling (errata 75). The judges sit in the dark beyond the lamp; Sowerby holds the pencil.*

Loss dialogue:

> **VESSEL:** "You've no account in you at all, have you."
> **THAD:** "I have an account. It is scrupulously accurate."
> **VESSEL:** "That's the trouble."

**Yields:** 4 pairs. Topic: *I must learn to lie.* This is the game's inciting skill beat, and it is a defeat.

## THE SPARRING — Winnie (C6)

*Not a duel. She corrects him the way one corrects a student, and it is the first time she is anything but curt.*

> **WINNIE:** "Say it again. And don't apologise in the middle of it."
> **THAD:** "I've had three fortunes and lost — "
> **WINNIE:** "No. You've had one fortune and told it twice. That's the answer. Say the answer."
> **THAD:** "Why do you know this so well?"
> **WINNIE:** "Because I sign the paper that says whether men are lying, Mr. Grubb, and I have never once been asked."

## THE SPARRING — Pratt (D5)

> **PRATT:** "Try me."
> **THAD:** "There's a mountain named for me."
> **PRATT:** "There's a hole named for you and I've fallen in it."
> *(pause)*
> **PRATT:** "Where'd that come from?"
> **THAD:** "You."
> **PRATT:** "Huh."

## DUEL TWO — Deke Vessel, rematch (winnable)

*Puzzle B6. Requires 14 pairs. Five exchanges, best-of.*

*Errata 75: first to five exchanges, as in Duel One (Part One, "How it plays"); "five exchanges, best-of" means the same thing here. Before the first exchange:*

> **SOWERBY:** "The rules of the Assay—"
> **VESSEL:** "He knows the rules, Reverend."
> **SOWERBY:** "Then he will enjoy them twice." *(He reads all five.)*

Vessel escalates. Thad answers flatly, without pleasure, like a man reading corrections. Winning line:

> **VESSEL:** "Fine. Fine! I'll sign the cursed affidavit."
> **THAD:** "Thank you."
> **VESSEL:** "You didn't enjoy that at all, did you."
> **THAD:** "I found it educational."
> **VESSEL:** "That's worse."

**Yields:** Document A. The pocket watch, returned, still eleven minutes fast.

## DUEL FOUR — Colonel Absalom Fanshawe (public, Main Street)

*Puzzle F4. Fanshawe calls the duel himself, to discredit Thad in front of the whole town before Thad can be heard. He is, as always, charming about it.*

> **FANSHAWE:** "No hard feelings, Mr. Grubb. It's simply how we settle things here. You'll find it very fair."

Exchanges one through four use pairs 22, 23, and two returning boasts — Fanshawe deploys pair 4 and pair 9 against Thad, which the player will recognise, because Fanshawe has been listening the whole game.

*Errata 75: in the order 4, 9, 22, 23, then the fifth. **A lost exchange is thrown again**, because Fanshawe would rather win convincingly than on a technicality — the Fanshawe rule, applied to the duel. After the reply to a wrong answer, one of these, in turn:*

> **FANSHAWE:** "Shall we have that one again? I'd hate to win on a technicality."
> **FANSHAWE:** "Again, I think. The judges have barely sharpened the pencil."
> **FANSHAWE:** "Once more. I want the town to remember this properly."

Then the fifth exchange.

> **FANSHAWE:** "I have never told a lie in my life."

The player is offered four counters. Three are jokes. The fourth is **pair 24**, and it is not a lie:

> **THAD:** "There is no gold in Mott's claim. There never was. Obadiah Mott invented it to raise a grubstake off men in Boston, and every one of you built a house on top of it."

Silence on Main Street. Long. Fanshawe does not move.

Then Reverend Sowerby, who is holding the pencil:

> **SOWERBY:** "...That's the biggest one I ever heard."

The street erupts. Thad wins the duel, unanimously, on the greatest lie ever told in the territory.

> **THAD:** "It's true."
> **SOWERBY:** "Better still!"

*Afterward (errata 75):*

> **FANSHAWE:** *(He puts on his hat.)* "Well played, Mr. Grubb."
*(He means it. He walks back up the street to his office, and for the first time in twelve years, he closes the door.)*

**And that is the point.** Thad wins the duel and fails completely at the thing he wanted, because Consolation is structurally incapable of hearing the truth — Rule 3 has been on the wall of the saloon since the first hour of the game. He has just proved that no amount of saying it will ever work.

Which is why the last puzzle in the game is not a speech. It's a form.

---

# PART FIVE — NOTES FOR IMPLEMENTATION

1. **The wrong answers are not filler.** Three funny wrong options per node × 24 nodes is 72 lines that do nothing mechanically. They are the reason the system is fun to lose at. An agent told to "implement dialogue combat" will generate one wrong option and reuse it. Do not permit this.
2. **The correct counter always claims acquaintance and downgrades.** Any new pair written later must obey this rule or the system stops feeling like a system.
3. **Thad never enjoys winning.** His delivery is identical whether he wins or loses. That is the character.
4. **Rule 3 must be visible early.** Post the handbill in the Nugget in Act I as an examinable object with a full LOOK AT and LISTEN TO line. Nobody will notice. Everybody will remember.
5. **Fanshawe uses Thad's own pairs in Duel Four.** He has been in the room for most of them. Implement this explicitly — it is the single best "he was always paying attention" beat in the game.

---

## Next

- **Dialogue trees** — eight named characters, topic-gated, mandatory comic dead-ends
- **Room-by-room examine script** — ~35 rooms × ~15 hotspots × LOOK and LISTEN
- **Technical spec** — 2D, verb interface, iMUSE-style dynamic score
