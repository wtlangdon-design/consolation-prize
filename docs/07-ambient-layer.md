# THE LAST CLAIM IN CONSOLATION
## The Ambient Layer — Script

*Companion to the Technical Spec. 18 background characters · 162 reputation barks · 6 ancillary interiors · ~500 lines. None of it gates anything.*

---

# PART ONE — VOICE RULES

Ambient characters are built differently from the core cast, and confusing the two is the main way this layer goes wrong.

1. **Each ambient character is one joke, and they run it forever.** The core cast has range. Ambient characters have a single premise, delivered nine slightly different ways across the game. The pleasure is recognition, not surprise.
2. **Barks are short.** One line. Rarely two. Never three.
3. **The bark changes but the premise never does.** The man leaving tomorrow is always leaving tomorrow. What changes is *when tomorrow is*.
4. **They react to Thad's reputation, never to the plot.** No ambient character knows about Mott, the fraud, or the gold. They know what was in the *Clarion*. That is the whole of their knowledge and it is the joke — the town's information system is one enthusiastic idiot with a press.
5. **Three of them arc.** The man leaving tomorrow, the one-strike man, and the map seller each change across nine barks in a way that means something. The other fifteen do not, and shouldn't.

## Reputation states

`R_NOBODY` → `R_SWINDLED` → `R_RACCOON` → `R_SURVEYED` → `R_BORDERS_MOTT` → `R_LOST_DUEL` → `R_WON_DUEL` → `R_DEAD` → `R_TRUTH`

---

# PART TWO — THE EIGHTEEN

---

## 1 · THE LETTER-WRITER
*Main Street. Writes letters home for men who can't. Charges by the page. Resolves the notice board hotspot.*

**Premise:** he is doing better than anyone in Consolation, because he sells the one thing that never runs out.

**Micro-tree**
> "What do you charge?" → "Ten cents the page. Fifteen if it's going well."
> "Going well?" → "If a man's had a good week I write more. If he's had a bad week I write *much* more. Bad weeks are my living."
> "Do you ever write the truth?" → "Once. Fella insisted. I charged him double and he cried the whole time."
> `[COMIC]` "I write my own." → "I know. I've read them over your shoulder. You're not bad. You're just honest, which is a phase."

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | "Letters home. Ten cents the page." |
| `R_SWINDLED` | "Letters home. Might want to leave a bit out." |
| `R_RACCOON` | "I could make the raccoon sound better." |
| `R_SURVEYED` | "'Had my land surveyed by a professional.' See? Free of charge." |
| `R_BORDERS_MOTT` | "*Now* you've got something to write about. Twenty cents." |
| `R_LOST_DUEL` | "I'd leave the duel out entirely." |
| `R_WON_DUEL` | "Beat Deke Vessel. That's a page and a half right there." |
| `R_DEAD` | "Do you want me to write to her, or would that be strange?" |
| `R_TRUTH` | "Twelve years I've been making things up on this street and you did it in one afternoon." |

---

## 2 & 3 · THE TWO BOUNDARY MEN
*Main Street. Have argued about the same forty feet for six years. Neither claim has any gold. Both know.*

**Premise:** the argument is the asset. Settling it would leave them with nothing.

**Micro-tree** *(they answer alternately and interrupt each other)*
> "What are you arguing about?" → **A:** "The line runs from the split pine —" **B:** "It runs from the *rock* —" **A:** "— which is what I said —" **B:** "— it is *not* what you said."
> "Is there gold on either claim?" → *(pause)* **A:** "No." **B:** "No." **A:** "Not a colour." **B:** "Never has been." *(They resume immediately.)*
> `[COMIC]` "Have you tried settling it?" → **A:** "And do *what*?"

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | **A:** "— from the split pine —" |
| `R_SWINDLED` | **B:** "Sold you Claim Two? Ha! *That's* not even disputed." |
| `R_RACCOON` | **A:** "At least yours has an animal on it." |
| `R_SURVEYED` | **B:** "You had it *surveyed*?" **A:** "Don't. Don't put ideas in it." |
| `R_BORDERS_MOTT` | **A:** "Borders Claim One!" **B:** "So does the *sky*, Clement." |
| `R_LOST_DUEL` | **B:** "We could've told you not to duel Vessel." |
| `R_WON_DUEL` | **A:** "Beat Vessel." **B:** "Wouldn't have beat *me*." **A:** "You've never entered." |
| `R_DEAD` | **A:** "…" **B:** "…" **A:** "— from the split *pine* —" *(They do not acknowledge it. They are the only two who don't.)* |
| `R_TRUTH` | **B:** "So there's no gold anywhere." **A:** "None." **B:** "…Line still runs from the rock." |

---

## 4 · THE BELL-RINGER
*Church steps. Strikes the bell by hand, half a step flat, drunk.*

**Premise:** he is the reason the town's one true note is wrong, and he will never be fixed.

**Micro-tree**
> "That bell is flat." → "It's loud, is what it is."
> "I could show you where to strike it." → "You could." *(He does not move.)*
> `[COMIC]` "Doesn't it bother you?" → "Nothing bothers me. That's the qualification."

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | *(strikes the bell, flat)* |
| `R_SWINDLED` | "Heard you got took. *(strikes)* That was for you." |
| `R_RACCOON` | "*(strikes)* Raccoon." |
| `R_SURVEYED` | "*(strikes)* Surveyed." |
| `R_BORDERS_MOTT` | "*(strikes twice)*" |
| `R_LOST_DUEL` | "*(strikes, half-heartedly)*" |
| `R_WON_DUEL` | "*(strikes four times, unasked, at eleven at night)*" |
| `R_DEAD` | "*(He rings the passing bell. It is the only thing he does correctly in the entire game, and it is for a man who is standing next to him.)*" |
| `R_TRUTH` | "*(strikes)* Still flat, ain't it." |

---

## 5 · THE MESSAGE BOY
*Everywhere. Runs notes for a penny. Knows more than anyone. Is nine.*

**Micro-tree**
> "What do you know?" → "Everything."
> "Tell me something." → "Penny."
> *(pay)* → "…The Colonel gets a letter from Boston every month and burns it in the stove." *(This is true, is never followed up, and is not needed for anything.)*
> `[COMIC]` "Shouldn't you be in school?" → "There's no teacher. There's a school." *(He runs off. This is the only explanation of the schoolhouse the game ever offers.)*

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | "Message? Penny." |
| `R_SWINDLED` | "I could've told you about Mr. Vessel. Penny." |
| `R_RACCOON` | "Everybody knows about the raccoon. That one's free." |
| `R_SURVEYED` | "She does that to everyone." |
| `R_BORDERS_MOTT` | "Three men paid me to find out where you're staying." |
| `R_LOST_DUEL` | "I watched. You were bad." |
| `R_WON_DUEL` | "I watched. You were less bad." |
| `R_DEAD` | "You're in the paper. You're dead in the paper." *(beat)* "Penny?" |
| `R_TRUTH` | "I *knew* it." *(He did not know it.)* |

---

## 6 · THE PIE WOMAN
*Main Street. Pies of unstated provenance.*

**Micro-tree**
> "What's in the pie?" → "Pie's a nickel."
> "That isn't what I asked." → "Pie's a nickel."
> `[COMIC]` "I'll take a pie." → "Course you will."

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | "Pie." |
| `R_SWINDLED` | "Pie. Half price for the newly poor." |
| `R_RACCOON` | "Heard about your animal. Pie?" |
| `R_SURVEYED` | "That woman charged you two dollars to point at dirt. Pie." |
| `R_BORDERS_MOTT` | "Pie, Mr. Grubb. On the house. On the house *today*." |
| `R_LOST_DUEL` | "Pie. You'll want the big one." |
| `R_WON_DUEL` | "Beat Deke Vessel! Pie's still a nickel." |
| `R_DEAD` | "Thought you'd passed." — "I did." — "Well." *(She sells him a pie.)* |
| `R_TRUTH` | "Biggest lie ever told in this territory and he still buys the nickel pie." |

---

## 7 · THE MAN LEAVING TOMORROW
*Outside the hotel. Has been leaving tomorrow for four years. **Arcs.***

**Micro-tree**
> "When are you leaving?" → "Tomorrow."
> "You said that last week." → "Did I."
> `[COMIC]` "Where will you go?" → *(long pause)* "Tomorrow."

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | "Leaving tomorrow." |
| `R_SWINDLED` | "Leaving tomorrow. You should too." |
| `R_RACCOON` | "Leaving tomorrow. Raccoon can have it." |
| `R_SURVEYED` | "Leaving tomorrow. She surveyed nothing, that woman." |
| `R_BORDERS_MOTT` | "…Leaving Thursday." |
| `R_LOST_DUEL` | "Leaving tomorrow." |
| `R_WON_DUEL` | "Leaving tomorrow. Probably." |
| `R_DEAD` | "Leaving tomorrow. You've gone already." |
| `R_TRUTH` | "…I might stay." |

---

## 8 · THE HOTEL CLERK
*Hotel lobby. Has Thad's name misspelled in the register, differently from the Clarion, and considers his own version authoritative.*

**Micro-tree**
> "You've spelled my name wrong." → "I've spelled it as given."
> "It wasn't given that way." → "It was given to *me* that way."
> `[COMIC]` "May I correct it?" → "The register is not corrected. The register is the register."

**Barks** — *(each is a new wrong spelling, read aloud from the book)*
| State | Line |
|---|---|
| `R_NOBODY` | "Mr. Grubbe." |
| `R_SWINDLED` | "Mr. Grubbs. Rate's still five dollars." |
| `R_RACCOON` | "Mr. Grubbe. No animals in the rooms." |
| `R_SURVEYED` | "Mr. Grabbe." |
| `R_BORDERS_MOTT` | "Mr. *Grubb*." *(Correct. Once. He never does it again and does not know he did it.)* |
| `R_LOST_DUEL` | "Mr. Grubbs." |
| `R_WON_DUEL` | "Mr. Grubbe. Congratulations." |
| `R_DEAD` | "I've struck you from the register." *(beat)* "You're standing in my lobby." |
| `R_TRUTH` | "Mr. Grubbes." |

---

## 9 · THE BARBER-DENTIST-SURGEON
*His shop. One man, three trades, one set of instruments. Period-accurate.*

**Micro-tree**
> "What do you do here?" → "Shave, extraction, amputation. Two bits, four bits, a dollar."
> "Do you use the same instruments?" → "I *clean* them."
> `[COMIC]` "I'd like a shave." → "Sit down. Don't look at the tray."

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | "Shave? Tooth? Limb?" |
| `R_SWINDLED` | "Shave? You've the face of a man who's been had." |
| `R_RACCOON` | "If it bites you, come straight here. Don't wait." |
| `R_SURVEYED` | "Shave, tooth, limb." |
| `R_BORDERS_MOTT` | "Free shave, Mr. Grubb! First one's free!" *(It is not.)* |
| `R_LOST_DUEL` | "Nothing I can do about pride." |
| `R_WON_DUEL` | "Shave on the house." *(It is not.)* |
| `R_DEAD` | "I'd have done the laying-out at a fair price. Nobody asked me." |
| `R_TRUTH` | "Shave, tooth, limb." *(He is entirely unmoved. He is the only one.)* |

---

## 10 · THE PHOTOGRAPHER
*His studio. Sells stock portraits by the gross. **Has the Mott photograph in his window.***

**Micro-tree**
> "Who is the man in the window?" → "Nobody. It's a portrait. Comes in the box, four dozen to the box."
> "That's Obadiah Mott." → "It's a *portrait*, sir. It's a man in Ohio in a good collar."
> `[COMIC]` "May I buy it?" → "Twenty-five cents. I've thirty-one more."

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | "Portrait? Fifty cents, sitting included." |
| `R_SWINDLED` | "Portrait? Something to send home?" |
| `R_RACCOON` | "I'll photograph the animal. I've done worse." |
| `R_SURVEYED` | "Portrait?" |
| `R_BORDERS_MOTT` | "Portrait, Mr. Grubb! History, this is!" |
| `R_LOST_DUEL` | "Portrait? …Perhaps not today." |
| `R_WON_DUEL` | "Stand *there*. Chin up. There's a man." |
| `R_DEAD` | "…I've done post-mortems. I'd rather not, with you talking." |
| `R_TRUTH` | "Should I take Mr. Mott's likeness, do you think? A *real* one?" *(He genuinely does not see it.)* |

---

## 11 · THE FIDDLER
*The Nugget. Tuned to the flat piano, therefore flat. **Corrects first in Act IV.***

**Micro-tree**
> "You're flat." → "I'm tuned to the piano."
> "The piano is flat." → "Then I'm tuned to the piano."
> `[COMIC]` "Do you want me to fix it?" → "God, no. Then I'd be the only one right."

**Barks** — *mostly just playing; three spoken*
| State | Line |
|---|---|
| `R_BORDERS_MOTT` | *(He plays something faster. Still flat.)* |
| `R_DEAD` | *(He plays the passing tune. Correctly. Flat.)* |
| `R_TRUTH` | *(In F2, twenty seconds into the tuning arc, he stops mid-phrase, tunes his A, and continues. He is the only character in Consolation who notices anything, and it is never remarked upon.)* |

---

## 12 · THE STAGE DRIVER
*Coach stop. Arrives, complains, departs. His is the axle Thad heard in the opening.*

**Micro-tree**
> "Your near axle is dry." → "It's been dry four years."
> "It will fail." → "It'll fail on somebody else's stretch."
> `[COMIC]` "I could listen to it properly." → "You could listen to it in Sacramento."

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | "Four days from Sacramento. Four *days*." |
| `R_SWINDLED` | "I brought you in. I'd have warned you if I liked you." |
| `R_RACCOON` | "Heard about the raccoon in Sacramento." *(He has not.)* |
| `R_SURVEYED` | "Four days." |
| `R_BORDERS_MOTT` | "Two men got off asking about you. Didn't like the look of either." |
| `R_LOST_DUEL` | "Four days." |
| `R_WON_DUEL` | "Four days. Heard about Vessel." |
| `R_DEAD` | "I don't carry the dead. Rate's different." |
| `R_TRUTH` | "…Reckon I'll have a full coach out of here Thursday." *(He is wrong. Nobody leaves.)* |

---

## 13 · THE ONE-STRIKE MAN
*The Nugget. Found colour once, in 1849. **Arcs — the strike shrinks every time and he never notices.***

**Micro-tree**
> "Tell me about it." → *(He does. At length. It is genuinely moving the first time.)*
> "When was this?" → "Forty-nine."
> `[COMIC]` "And since?" → *(He looks at his hands. Then tells the story again.)*

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | "Found colour in '49. Nugget the size of a fist." |
| `R_SWINDLED` | "Found colour in '49. Size of a fist." |
| `R_RACCOON` | "Found colour in '49. Size of a good apple." |
| `R_SURVEYED` | "Found colour in '49. Size of an apple." |
| `R_BORDERS_MOTT` | "Found colour in '49! Size of a walnut, mind." |
| `R_LOST_DUEL` | "Found colour in '49. Walnut." |
| `R_WON_DUEL` | "Found colour once. Size of a pea." |
| `R_DEAD` | "Found colour in '49." *(pause)* "Think I did." |
| `R_TRUTH` | "…I don't believe I found anything." |

---

## 14 & 15 · THE BOARDING HOUSE WOMEN
*The parlour. Run the only solvent business in town. Regard the gold rush as a temporary weather event.*

**Micro-tree**
> "How's business?" → **A:** "Steady." **B:** "It's men. Men are steady."
> "Have you ever prospected?" → **A:** *(She laughs for some time.)* **B:** "We've prospected the prospectors, dear."
> `[COMIC]` "Do you think there's gold here?" → **B:** "There's forty men upstairs at six dollars the week. That's the gold, dear."

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | **A:** "Six dollars the week, meals extra." |
| `R_SWINDLED` | **B:** "Oh, *love*." |
| `R_RACCOON` | **A:** "Better company than most of ours." |
| `R_SURVEYED` | **B:** "You paid *her*?" |
| `R_BORDERS_MOTT` | **A:** "Now don't let it change you." **B:** "It changes them, Martha." **A:** "It does." |
| `R_LOST_DUEL` | **B:** "Nobody wins their first." |
| `R_WON_DUEL` | **A:** "There now." |
| `R_DEAD` | **B:** "Will you be wanting the room still, or —" **A:** "*Martha.*" |
| `R_TRUTH` | **A:** "Six dollars the week." **B:** "Meals extra." *(Nothing has changed for them and nothing was ever going to.)* |

---

## 16 · THE MAP SELLER
*Main Street. Sells maps to Mott's strike. Unknowingly employed by the Improvement Company. Genuinely believes in them. **Arcs.***

**Premise:** the saddest character in the game, played entirely for laughs, and the truth changes nothing for him at all.

**Micro-tree**
> "Where do the maps come from?" → "I draw them."
> "From what?" → "From the *accounts*. There's dozens of accounts. You put them together and a picture comes out."
> "Have you ever dug where a map says?" → "I'd not dig my own map, sir. That'd be like a man eating his own dinner." *(This makes no sense and he is very firm about it.)*
> `[COMIC]` "Do they work?" → "They've not been *disproved*."

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | "Map to Mott's strike! Dollar!" |
| `R_SWINDLED` | "Map, sir? Turn it round for you?" |
| `R_RACCOON` | "Map! Dollar! Nothing about raccoons on it, I'll be honest." |
| `R_SURVEYED` | "You've had a survey! Now you want a *map*." |
| `R_BORDERS_MOTT` | "Sir — *sir* — you've land on it. You're on the map. You're **on the map**." |
| `R_LOST_DUEL` | "Map, sir. Cheer you up." |
| `R_WON_DUEL` | "Map for the champion. Ninety cents." |
| `R_DEAD` | "…Do you want one for the road?" |
| `R_TRUTH` | "Map to Mott's strike! Dollar!" *(Unchanged. Word for word. He is still there in the closing shot.)* |

---

## 17 · THE CARD SHARP
*The Nugget. Cheats openly. Everyone knows. Nobody minds.*

**Micro-tree**
> "You're dealing off the bottom." → "I am."
> "Doesn't anyone object?" → "They know what I am. They don't know what the Colonel is. Which of us is the problem?"
> `[COMIC]` "Deal me in." → "No. I like you."

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | "Sit down. Lose something." |
| `R_SWINDLED` | "You've already been dealt to today." |
| `R_RACCOON` | "I'd not play the raccoon either." |
| `R_SURVEYED` | "She's in my line of work. Worse hours." |
| `R_BORDERS_MOTT` | "Everybody at this table's your friend now. Think about that." |
| `R_LOST_DUEL` | "Lying's a skill, son. So's this." |
| `R_WON_DUEL` | "There it is." |
| `R_DEAD` | "Best hand I ever saw played." |
| `R_TRUTH` | "Told the truth in a lying contest. *(He shakes his head.)* And they gave him the pot." |

---

## 18 · THE DOG'S OWNER
*Back alley. Looking for the lost dog from the notice board. The dog is on Main Street.*

**Micro-tree**
> "Are you looking for a dog?" → "Six weeks."
> "There's a dog on Main Street." → "…That's Bill?" *(He goes. **This is the resolution. It is worth nothing. It takes twenty seconds and it is the nicest thing in the game.**)*
> `[COMIC]` *(after)* "How's Bill?" → "He'd been on Main Street the whole time. Six weeks. He'd been *fine*."

**Barks**
| State | Line |
|---|---|
| `R_NOBODY` | "You seen a dog?" |
| `R_SWINDLED` | "You seen a dog? …Sorry about your money." |
| `R_RACCOON` | "Not a raccoon. A *dog*." |
| `R_SURVEYED` | "You seen a dog?" |
| `R_BORDERS_MOTT` | "You seen a dog? Congratulations, by the way." |
| `R_LOST_DUEL` | "You seen a dog?" |
| `R_WON_DUEL` | "You seen a dog?" |
| `R_DEAD` | "You seen a — " *(He stops. He looks at Thad for a long moment. Then:)* "You seen a dog?" |
| `R_TRUTH` | *(If unresolved:)* "You seen a dog?" *(If resolved: he is on Main Street with Bill, and has no bark at all.)* |

---

# PART THREE — ANCILLARY INTERIORS

Six enterable buildings. No required items, no puzzle gates. 5–8 hotspots each.

## THE BARBER'S — 6 hotspots
**THE TRAY** — LOOK: "Instruments. I have identified the razor. I am choosing not to identify the others." · LISTEN: "Nothing. They are extremely still."
**THE CHAIR** · **THE STROP** · **THE JAR** *(do not look in the jar; there is a LOOK line for looking in the jar)* · **THE MIRROR** · **THE PRICE BOARD**

## THE BOARDING HOUSE PARLOUR — 7 hotspots
**THE ANTIMACASSARS** — LOOK: "Lace, on every chair, four hundred miles from anywhere. Somebody carried these here on purpose." · LISTEN: "Nothing. This is the quietest room in the territory."
**THE PIANO** *(a second piano — in tune, because these two women had it done)* — LISTEN: "…It's *correct*. Somebody paid to have this done properly. I may need a moment."
**THE FIRE** · **THE PORTRAIT OF A QUEEN** · **THE RUG** · **THE STAIRS** · **THE TEA THINGS**

## THE PHOTOGRAPHER'S STUDIO — 8 hotspots
**THE STOCK PORTRAIT BOX** — LOOK: "Four dozen strangers in good collars, sold as anybody you like." · LISTEN: "Nothing. Four dozen men in Ohio, not saying anything."
**THE CAMERA** · **THE HEADREST CLAMP** · **THE PAINTED BACKDROP** *(a Grecian colonnade; outside the window, mud)* · **THE CHEMICALS** · **THE WINDOW DISPLAY** · **THE SITTING CHAIR** · **THE PRICE CARD**

## THE BAKEHOUSE — 5 hotspots
**THE OVEN** — LISTEN: "Warm. Working. Something in this town is *working*."
**THE FLOUR** · **THE TABLE** · **THE BOY** · **THE BACK DOOR**

## THE EMPTY STOREFRONT — 5 hotspots
**THE SIGN** — LOOK: "HARDWARE & SUNDRIES. The paint is good. It was done by a professional, recently, at expense." · LISTEN: "Nothing."
**THE SWEPT FLOOR** — LOOK: "Somebody swept up before they left. On the last day, they swept." · LISTEN: "Nothing."
**THE COUNTER** · **THE WINDOW** · **THE BACK ROOM**

## THE SCHOOLHOUSE — 6 hotspots
**THE DESKS** — LOOK: "Fourteen desks, made by hand, well made. Nobody has ever sat in them." · LISTEN: "Nothing."
**THE BLACKBOARD** — LOOK: "Blank. It has been washed. Somebody washed a blackboard that has never been written on." · LISTEN: "Nothing."
**THE BELL ON THE DESK** — LISTEN: "…It's in tune. Of all the things in this town."
**THE STOVE** · **THE WINDOW** · **THE DOOR**

*The schoolhouse was the third building Consolation put up, before the assay office and before the church. Nothing in the game ever says this. The player can count the foundations from the high ridge if they want to.*

---

# PART FOUR — ACCOUNTING

| Component | Lines |
|---|---|
| 18 micro-trees | ~190 |
| 162 reputation barks | ~170 |
| 6 interiors, 37 hotspots × 2 verbs | ~74 |
| Idle/positional variants, day-night | ~60 |
| **Ambient total** | **~494** |

**Remaining across the whole project:** ~420 examine lines for the 23 manifest rooms. That is the last of the writing.

## Implementation notes

1. **Barks fire on approach, not on click.** Ambient characters speak as Thad walks past. Talking to them opens the micro-tree.
2. **One bark per reputation state per character, and it does not repeat within a state.** After it has fired once, approach produces the idle animation and nothing else. The town is not a soundboard.
3. **The three arcing characters** — leaving-tomorrow, one-strike, map seller — must have their barks delivered in state order, so a player who skips states still gets the shrinkage in sequence.
4. **The fiddler's Act IV correction is scripted to the tuning automation**, twenty seconds in. It is not a bark, it is an animation cue, and nobody comments on it.
