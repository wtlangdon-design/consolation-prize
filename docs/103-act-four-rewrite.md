# THE LAST CLAIM IN CONSOLATION
## 103 · The Act IV read, and the joke options game-wide — doc 99

*Errata 178. Tyler, 2026-11-08, after Act III's pass (doc 102): "Continue with act 4". This is the fourth writing exception (errata 171) applied to Act IV, and to the one thing all four acts still shared. Untouched: the puzzle graph, puzzle facts, flags a puzzle reads, the Assay pairs, the three load-bearing LISTEN lines and every invariant. Room 33's lamp and the score's detune (invariants 5 and 8) are unchanged, and so are the letters home (invariant 10).*

## What the read found

**Act IV is the quiet act, and it is written that way on purpose:**
- the Listening;
- the three swings;
- Winnie running the assay at her window, "Nine years I've waited to write down a number I believed.";
- Duel Three, which Thad wins with the truth because the town scores it as the greatest lie ever told;
- the filing, where the last puzzle is a form.

None of it was rewritten. Each step already says where the next one is:
- the opening sends him to his mud;
- the strike sends him to the assay;
- Winnie says "File it. I'll be at the Registrar's when you do.";
- Fanshawe is waiting on the street.

Act IV's rooms (33 to 36) were read for continuity: the twelve years of the strike, Winnie's nine, the 1851 portraits printed as Mott for seven. They agree.

**What the read did find runs through every act: the joke options.** Each act's pass gave every question a second answer. But a `[COMIC]` option that stays on the menu is exactly the one a player clicks twice, because it was funny the first time, and nineteen of them, outside Acts II and III, still replayed their first answer word for word. That is the robot Tyler heard on Main Street.

## What changed

Every `[COMIC]` option left on a menu, in every tree, now answers differently the second time, in the speaker's own bit (doc 99):

| Who | Asked twice | Second answer |
|---|---|---|
| The letter-writer | "I write my own." | "So you keep saying. They'd sell better with a lie or two in. Everybody else's do." |
| The boundary men | "Have you tried settling it?" | "You've asked twice now. He'll call that evidence." |
| The message boy | "Shouldn't you be in school?" | "A penny and I'll go. I'll come straight back, but I'll go." |
| The pie woman | "I'll take a pie." | "Course you will. A nickel, when you do." *(her gag kept, and still selling)* |
| The bell ringer | "Doesn't it bother you?" | "Ask me after the noon bell. I won't hear you. That's also the qualification." |
| The man leaving tomorrow | "Where will you go?" | "Tomorrow. I've told you. It's the one place I'm sure of." |
| The fiddler | "Do you want me to fix it?" | "Still no. In tune, I'd be playing on my own." |
| The one-strike man | "And since?" | "There's no since. There's '49, and then there's telling it." |
| The card sharp | "Are you any good?" | "Good enough not to play you. You'd lose, and I'd feel it." |
| The dog's owner | "How's Bill?" | "Still fine. Still on Main Street. I go and visit." |
| Vessel | "Is there gold on it?" | "There's a claim on it, son, and a claim is where every fortune starts." *(true, as everything he says is)* |
| Vessel | the poorly sister | "Still a long way off, son. That's the main thing wrong with her." |
| The hotel clerk | "Is there anything cheaper?" | "The road, as given. It keeps no register, which is its only appeal." |
| The undertaker | "Do you know everybody?" | "Everybody. Eventually." |
| Fanshawe | the warm office · the chairs · the wine | "A cold man counts his money, Mr. Grubb. I prefer them warm." · "Do sit, Mr. Grubb. You're standing again." · "Still delicious, and still a mystery. In my experience the two go together." |
| Pratt | "Lovely morning." | "Still is." |
| Sump, at the filing | "The raccoon." | "Still unlicensed, Mr. Grubb. It has never applied." |

The Act II and III rows were written in their own passes (docs 101 and 102).

**Left on purpose:**
- **Hob:** errata 174.
- **The raccoon's naming:** Thad narrating, not a conversation.
- **Pratt's "Healing wrong.":** doc 04 makes it the answer "every time, for the rest of the game, in every act, including the ending".

`tests/repeats.test.ts` now holds every `[COMIC]` option in the game to it, with those exemptions and their reasons in `tests/data/repeats-passed.json`.

## Found, and not built

**Vessel's Act IV node, VES_F1** ("Grubb! You'll want a room. I've had the stairs done." — he has bought the hotel with Thad's four dollars). It is written in doc 04 and has never been put in the game:
- no extractor reads it;
- no figure stands in the hotel lobby in Act IV;
- no errata mentions it.

Building it is a staging and art job (Vessel placed in Room 18 in Act IV), not a writing one. It waits for Tyler's word.
