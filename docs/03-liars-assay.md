# CONSOLATION PRIZE
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
