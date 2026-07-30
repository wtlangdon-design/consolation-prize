# CONSOLATION PRIZE
## Story, Character & Game Design Bible — v2

*A comedy mystery adventure in the spirit of Monkey Island. Frontier gold rush, dry and deadpan, 2D point-and-click.*

---

# PART ONE — FOUNDATIONS

## Log line

A piano tuner from Rhode Island is swindled into buying forty feet of worthless mud, and slowly discovers that the entire town was built on a lie, that the man who told it is still alive, and that the lie accidentally came true directly underneath him.

## The three decisions, resolved

You didn't specify these, so I've made calls. Overturn any of them and I'll rework.

**Anachronism: permitted in institutions, forbidden in technology.** Nothing electric, nothing motorized, no modern objects. But every *institution* in Consolation behaves like a 1990s government office. The Claims Registrar has a take-a-number spindle. The assay window closes at four and there is a handwritten sign about it that has been there for six years. Forms exist in triplicate. There are two lines and both signs are wrong.

This is the sharper version of Monkey Island's anachronism. Grog vending machines are a spoof of the *world*; bureaucratic absurdity is a spoof of the *people*, which keeps the town sincere and keeps us out of Blazing Saddles territory.

**Text only. No voice acting.** Cheaper, more faithful to the era we're evoking, and AI-generated voice would be the single most obvious tell that this wasn't made by hand. Text also lets the player read at the speed of a joke.

**Length target: ten to twelve hours.** Roughly forty puzzles, thirty-five screens, forty inventory items, and something on the order of four to five thousand lines of text.

## Design pillars

1. **The town believes in itself.** No character is ever aware they are funny. Comedy comes from sincere people operating an absurd system with total gravity.
2. **You cannot die and you cannot make the game unwinnable.** The Monkey Island covenant, with one deliberate, signposted exception in Act III (see The Dark Beat).
3. **Absurd but fair.** Every solution must be strange and, in hindsight, the only possible answer.
4. **The wasted option is sacred.** A large share of dialogue choices and examine lines do nothing. They exist because they are funny. Do not optimize them away — they are the product.
5. **Every reveal recontextualizes.** The mystery doesn't add information, it re-explains what you already saw.

---

# PART TWO — THE INTERFACE

## The verb set

Nine verbs, SCUMM-style, in a panel at the bottom of the screen.

**LOOK AT · PICK UP · USE · OPEN · CLOSE · PUSH · PULL · TALK TO · LISTEN TO**

The last one is the game's signature and its whole design spine.

**LISTEN TO works on everything.** Every object, every person, every wall, every room. It is a full second examine layer running parallel to LOOK AT, and it is the largest single comedy resource in the game:

> LOOK AT the Colonel's portrait — *"Colonel Fanshawe, painted at approximately twice life size and one-third his actual age."*
> LISTEN TO the Colonel's portrait — *"Nothing. Which is the first honest thing about it."*

> LISTEN TO the saloon piano — *"C-sharp is a semitone flat and has been for years. Nobody here has noticed. I have made a note of it. I have made several notes of it."*

> LISTEN TO Grievance — *"Breathing. Slowly. In a way I would describe as editorial."*

It is treated by the entire town as a foolish parlor trick for the first two acts. It is the only reason the mystery is solved in the third. Plant it in the first ninety seconds; pay it off at the climax.

## Dialogue system

Topic-based trees, SCUMM style, with these rules:

- **Minimum three options per node**, four or five where the character is interesting.
- **At least one purely comic dead-end per node.** No state change, no information, no progress. It exists to be picked. This is non-negotiable and will be the first thing an implementation agent tries to delete.
- **Topics are a collectible currency.** Learning a fact from one character adds a new option to another's tree. This is how the mystery unfolds — assembled by the player in an order they chose, not delivered in cutscenes.
- **Every goodbye is a joke.** "I should go." / "I've taken enough of your time." / "I am going to leave now, in a dignified manner." (Thad then walks into the doorframe.)
- **The Fanshawe rule.** Every conversation with the Colonel is warm, generous, and courteous, and Thad leaves with less than he arrived with. Never once does Fanshawe refuse anything. The player should take three or four conversations to notice.

## The Liar's Assay

The insult-swordfighting slot. Consolation settles disputes with a formal bragging duel about the size of one's find — a real institution, with rules, judges, and etiquette, taken with total seriousness by everyone.

You win by out-lying your opponent. Each boast has one specific correct counter, and **you learn the counters by losing.** Thad gets thrashed across the territory collecting comebacks until he can beat the man who matters.

> *"I pulled a nugget out of the Feather River the size of a bishop's fist."*
> *"I've seen your bishop. He was malnourished."*

> *"My claim assayed at nine hundred dollars to the ton."*
> *"So did my grandmother, and she was mostly gravel."*

Target: twenty to twenty-four boast/counter pairs. Structural note — the entire town was founded on a lie about gold, and the skill the game teaches you is lying about gold. The final duel is with Fanshawe, and Thad wins it by telling the truth, which nobody recognizes as a legal move.

## The Listening (endgame mechanic)

Act IV converts LISTEN TO from a joke into an interface. Thad walks Prosperity and taps. The player hears it — pitch differences, hollow versus solid, the resonance of a void. No text hints. The last puzzle in a game about a town that never stopped talking is solved by being quiet.

---

# PART THREE — CHARACTER

## Thaddeus Grubb

Piano tuner, of Providence, Rhode Island. Age twenty-six. Owns one good coat and wears it in the mud.

**Voice.** An optimist who reports catastrophe in the flat, procedural tone of a man reading a train timetable. He is *not* weary and *not* sarcastic — that gap is the entire comedy. Sincere hope, delivered as inventory.

> "The mine has collapsed. I have decided to interpret this as a sign."
> "This is my claim. It is approximately forty percent mud, thirty percent rock, and thirty percent a substance I have not yet identified. I have named it Prosperity."
> "The man has taken all of my money. In fairness, I gave it to him."
> "I have been shot at. Not accurately, but with real feeling."

**Motive: gold.** Concrete, greedy, unromantic. This is load-bearing — because Thad is broke and greedy, *any character can move him anywhere* by implying there's a dollar in it. It's the engine of the plot.

**Arc.** He arrives wanting to be rich. He ends by giving away the largest gold strike in the territory, on purpose, in writing. What he becomes is the only honest man in a town built on a lie — which is, by the end, the only thing in Consolation actually worth anything. The final letter home is the first one that's entirely true.

**Skill.** The ear. A joke, then a tool, then the answer.

## Miss Winnie Ledger — the stake

**This is the correction v1 most needed.** Thad had nothing to lose, and a comedy with nothing at stake has no floor under it.

Winnie is not a clerk. She is the **acting Territorial Assayer** — the only person whose signature can certify or void a strike in four hundred miles. Everyone in Consolation, including Fanshawe, needs her and resents needing her. She is thirty-four, unimpressed, and better than Thad at everything, which is exactly the Elaine relationship and exactly why it works.

**Her secret:** for nine years she has been quietly building a private case that the Mott strike never existed. Not out of heroism — out of professional offense. She is an assayer in a town where the central fact has never been assayed. She has kept a second ledger. Keeping it has nearly gotten her killed twice and she has never told anyone.

**Why she matters to the ending:** whichever version of reality Thad chooses, **Winnie is the one who has to sign it.** If he proves the fraud, she signs the document that ruins two thousand people. If he announces the gold, she signs a certification that retroactively vindicates Mott and makes her nine years a waste. He cannot have what he wants without costing her something, and he has to look at her while he does it.

Not a romance in the kissing sense. A partnership that matters more than the gold, which is what makes the ending land.

## Colonel Absalom Fanshawe

President of the Consolation Improvement Company. Never a colonel. Never served. Nobody has ever asked.

**The inversion:** Fanshawe knows the strike was a fraud — he was an original investor and worked it out years ago. And **he does not want the gold found.** He wants the searching to continue forever. He sells the maps, the permits, the equipment, the filings, the assay fees, the lots, the lumber, the hope. The search is his entire business. A solved mystery is a bankrupt town.

He is not racing Thad to the treasure. He is preventing anyone from ever reaching it. He is warm, funny, generous, genuinely likeable, and does not raise his voice once in the entire game.

**Running gag:** details of his military service contradict themselves constantly and nobody notices. Optional dialogue, dug out over many conversations, eventually lets Thad prove the war itself did not happen.

## The Dark Beat

Monkey Island is not wall-to-wall comedy — LeChuck is frightening, and that's why the jokes have somewhere to fall from. v1 had no floor. Two dark elements:

**1. The coffin (Act III).** Thad's plan to be declared legally dead requires an actual funeral. It goes wrong. He is nailed in and lowered, and the sequence runs long — no music, no verb panel, no jokes, no narration, just the sound of dirt. The comedy simply stops for two or three minutes. It is the only sequence in the game where the player can genuinely believe something has broken.

Hob digs him out. That is where Hob's identity begins to surface, and it is the moment the game turns.

**2. The names that stop.** In Winnie's second ledger there is a short list of men who came close to the truth before Thad and then stopped coming to the window. Presented flatly, without comment, as entries in a book. No violence on screen. Fanshawe's body count is a bureaucratic artifact, which is far worse.

## Supporting cast

**Hob** — the night watchman. Speaks maybe forty words in the first two acts, all useless. He is Obadiah Mott. The game's best reveal is that the player walked past him in the opening scene and he had a line.

**Ignatius Frame** — editor and sole employee of the *Consolation Clarion*. Invented roughly half the Mott legend and has lost track of which half. Prints Thad's humiliations as front-page news within the hour. **Running gag:** Thad's name misspelled differently every single time — Grubbs, Grub, Grabb, Thaddeus Grubbe, "a Mr. Grubb of the East," and eventually just "the Piano Man."

**Cyrus "Nickel" Pratt** — claim jumper of remarkable persistence and no imagination. Wants Prosperity. Cannot articulate why. Is being paid by a man he can't name. Comic antagonist, then reluctant ally, then genuinely brave once, which surprises everyone including him.

**Madame Ozymandia** — professional gold diviner. A total fraud, with a brass rod, a great deal of humming, and an entrance fee. Her method also *works*, because what she is actually doing is reading ground resonance and doesn't know it. She and Thad are doing the same thing; only one of them charges.

**Ah-Lam Sheng** — runs the laundry and, quietly, the only functioning bank in Consolation, because he is the one man in town nobody thinks to rob. Holds paper on half the Improvement Company. Dry, precise, and the only character who finds Thad genuinely funny. Played with full dignity — he is the most competent person in the game after Winnie, and the town's inability to see it is the joke, at the town's expense.

**Reverend Sowerby** — presides over funerals with enormous feeling for men he has never met. Charges by the adjective.

**Grievance** — a mule. Will not move. Has moved for exactly one person under one specific condition, and finding that condition is a mid-game puzzle. Not a stubborn-mule joke; a puzzle object with an opinion of you.

**The raccoon** — lives in the hole at Prosperity. Thad names it (full Christian name, chosen by the player from three equally poor options). Cannot be harmed, removed, negotiated with, or reasoned with. Present in the final scene.

---

# PART FOUR — THE MYSTERY

## The surface

Twelve years ago a prospector named **Obadiah Mott** filed papers announcing the largest strike in territorial history. Then he vanished. The claim exists on paper. Nobody has ever found where it is. Consolation was built by the thousands who came looking and is, today, a town composed entirely of people searching for Mott's gold.

## The truth, in three layers

**Layer one — Mott never vanished.** He is Hob, the night watchman: a man whose job is to be somewhere nobody looks. He has spent twelve years standing in the street watching the town search for him.

**Layer two — Mott never found anything.** The strike was invented to raise a grubstake from Eastern investors. He meant to take the money and slip away. The lie worked catastrophically well — thousands came, a town grew on top of it, and he could neither confess (the investors would kill him) nor leave (leaving would prove it). So he buried himself alive in plain sight and stayed to watch what he had made.

**Layer three — the strike is real anyway.** Mott picked the location at random off a map. There is, by pure accident, gold there. He does not know. Nobody knows. It is directly beneath Thaddeus Grubb's forty feet of worthless mud.

**Theme:** a lie that enough people believe becomes a place you can live in.

## Reveal schedule

| Beat | Lands | Effect |
|---|---|---|
| Prosperity borders Mott's claim | End of Act I | Explains why everyone is suddenly friendly |
| Winnie's second ledger — no Mott gold ever assayed | Mid Act II | Reframes the whole town as a question |
| Fanshawe wants the search to continue, not to end | End of Act II | Inverts the antagonist |
| Hob is Mott | Act III, after the coffin | Reframes the opening scene |
| The strike was a lie from the start | Act III climax | Reframes the town's existence |
| The gold is real and it's under Prosperity | Act IV | Reframes Thad's swindle as the luckiest event in the territory |

## The ending

Thad ends Act IV holding three truths: the strike was a fraud, Mott is alive, and the gold is real.

**The dilemma:** Telling the truth ruins two thousand people and gets Hob lynched. Announcing the gold makes Thad rich, saves the town, retroactively vindicates Mott — and hands Fanshawe everything, since he owns most of Consolation.

**The solution, and the last puzzle in the game:** Thad files the strike **in Obadiah Mott's name.**

The gold is real, so the town is saved. The claim is filed to Mott, so the legend becomes retroactively, legally true. But a claim must be worked by its holder within thirty days — so Mott must come forward, publicly, into a town that now adores him, and account for himself in front of everyone. And Fanshawe is destroyed, because his entire business was the *search*, and the search is over.

It is a game about paperwork whose final move is a filing. Thad gets nothing but the worthless plot next door, Winnie's signature on something she can sign with a clear conscience, and a raccoon.

**Final beat:** the last letter home. For the first time, entirely true. It is very short.

---

# PART FIVE — STRUCTURE

## Acts

**Part One: In Which Our Hero Is Robbed, and Enjoys It**
Arrival, the swindle, taking possession of Prosperity. Teaches all nine verbs, plants LISTEN TO as a joke, establishes the town. Ends with Thad discovering his claim borders Mott's and the whole town abruptly becoming his friend. ~10 puzzles.

**Part Two: Three Pieces of Paper**
The Registrar's Ledger — and this is your Three Trials. Document C proves Prosperity borders Mott's claim. Document C requires A and B. **Document A** requires a witness who left town. **Document B** can only be issued to a deceased person. Three independent quest lines, each five to seven steps, attackable in any order — the anti-frustration structure Monkey Island uses, arrived at through frontier bureaucracy instead of pirate initiation. ~18 puzzles, the bulk of the game.

**Part Three: Thaddeus Grubb Is Legally Dead**
The funeral. The coffin. Hob talks. The truth about Mott. Everything the player believed about Consolation inverts. ~10 puzzles.

**Part Four: The Quietest Part of the Game**
The Listening. The Liar's Assay against Fanshawe. The filing. ~5 puzzles, mostly payoff.

## Room list

Thirty-five screens. **Hub: Main Street**, with the Bountiful Nugget as the social hub where the three trial-relevant characters are first met.

**Town (21)** — Stage road & coach stop · Main Street (hub) · The Bountiful Nugget · Nugget back room · Assay Office front · Assay Office records room · Claims Registrar · Registrar's archive · *Consolation Clarion* office · Improvement Company lobby · Fanshawe's office · Mercantile · Undertaker's · Boot Hill · Livery stable · Ozymandia's tent · Church & meeting hall · Hotel lobby · Thad's hotel room · Back alley · Watchman's shack

**Diggings (8)** — Road to the claims · Prosperity · The hole · Pratt's claim · The creek & sluice · Abandoned claim row · Sheng's laundry & the high ridge · Mott's supposed strike site (the fake one)

**Act III–IV (6)** — The funeral · Inside the coffin · Under Prosperity · The listening chamber · The Company vault · Main Street, dawn

Travel between town and diggings via a map screen. Grievance is required for one leg of it, which is why Grievance is a puzzle.

## Inventory

Around forty items. **Rule: every item must be funny to carry before it is useful to use.** A rubber chicken with a pulley in the middle is a joke you own before it's a solution.

Core: **the tuning fork** (his one tool, the game's totem, never leaves inventory) · a letter of introduction to a man who is dead · four dollars, an actively depleting resource in Act I · the deed to Prosperity, badly drawn, wrong side up · a mail-order catalog · Form 12-C · Form 12-C (Amended) · Form 12-C (Amended, Void) · a death certificate with his own name on it · Ozymandia's brass rod · a pickaxe with a loose head · a pocket watch that runs eleven minutes fast · Dr. Purvis's Restorative Bile Tonic · a hymnal · someone else's teeth · a photograph of a man who is definitely not Obadiah Mott · Fanshawe's monogrammed handkerchief · a torn ledger page · a jar of pickled eggs · assorted editions of the *Clarion* · a tin whistle · a stick of dynamite, comically inert · Grievance's blanket · a boot.

---

# PART SIX — PRESENTATION

## Music — the score is the arc

A large share of what people mean by "the Monkey Island feeling" is Michael Land's score and iMUSE transitioning it seamlessly room to room. v1 didn't mention sound at all.

**Do not write Morricone pastiche.** The point of view: **the entire score is performed on a badly tuned upright piano**, with fiddle, jaw harp, and a harmonica somewhere off in the dark. Consolation's theme drifts flat. Every room reharmonizes the same handful of melodies.

**And then:** in Part Four, as Thad listens, the score comes into tune. Not triumphantly — quietly, over about ninety seconds, one interval at a time. The player will feel it before they understand it. The tuning of the score is the emotional arc of the game, and it is only available to us because the protagonist is a piano tuner.

Dynamic transitions between rooms, iMUSE-style: no hard cuts, themes crossfade and reharmonize on entry.

## Art direction

Hand-painted 2D backgrounds, expressive slightly-caricatured sprites. Palette is mud, ochre, dust and pine — with the false fronts painted in absurdly optimistic colors that are visibly peeling. Every building is two storeys tall in front and one storey deep. Night scenes lit by oil lamp and window light. The town should look, in a single screenshot, like something pretending very hard.

## The examine layer

Every room carries roughly fifteen hotspots, each with a **LOOK AT** line and a **LISTEN TO** line. Thirty-five rooms × fifteen hotspots × two verbs is on the order of a thousand written lines before any dialogue, and this is where sixty percent of the game's charm actually lives.

This will not survive being generated. It has to be written.

## The opening ninety seconds

Night. A stage coach pulls away, revealing a young man in a good coat standing in mud, holding a case.

> **THAD:** "My name is Thaddeus Grubb. I have four dollars, a letter of introduction to a man who is dead, and a very good ear."

A lamp passes behind him — the night watchman, walking his round. He does not stop.

> **HOB:** "Wouldn't stand there."
> **THAD:** "Why not?"
> **HOB:** *(already gone)* "No reason."

Goal, voice, joke, mechanic, and the entire solution to the mystery — in ninety seconds. The player will walk past Obadiah Mott in the first screen of the game.

---

# PART SEVEN — WHAT'S NEXT

Still to build before any engine work:

1. **Puzzle dependency graph** — all ~40 puzzles, mapped, with item requirements and gating, verified for no dead ends
2. **Liar's Assay dialogue** — 20–24 boast/counter pairs
3. **Full dialogue trees** — eight named characters, topic-gated
4. **Room-by-room examine script** — the thousand lines
5. **Technical spec** — 2D, verb interface, hand-painted backgrounds. Not ThreeJS.

The graph depends on the verb set and room list, both of which are now fixed, so it can be built next without rework.
