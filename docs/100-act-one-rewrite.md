# THE LAST CLAIM IN CONSOLATION
## 100 · The Act I rewrite — step 2 of doc 99

*Errata 171/172. Tyler, 2026-11-07: "Proceed with your 1-4", and doc 99 "Approved". Every Act I conversation, in the order a player meets them, rewritten to doc 99's character sheet in one voice, in the documents, and extracted. Tyler rules on Act I before any Act II–IV room is touched.*

## What every room got

1. **Asked again, never the same.** Every question now has a second answer that differs from the first, so nobody repeats themselves word for word (doc 04 rule 4). The answers escalate rather than deflate (doc 99 rule 4): Pratt's offer goes up, Ozymandia charges for the repeat, Winnie gets one word shorter. `tests/repeats.test.ts` holds every tree listed in `tests/data/repeats-passed.json`.
2. **The Pike thread, everywhere Thad can ask.** Thad arrives on Main Street with his errand, the letter for Ezra Pike (doc 98). Every person in Act I he can ask sends him to the undertaker in their own way, and nobody will say why. The joke runs and escalates across the whole town (doc 99 rule 8):
   - the letter-writer: "Very close. Closer every year";
   - the pie woman's three unpaid pies;
   - the fiddler: "every funeral in town … bar one";
   - the one-strike man, who knew Pike in '49;
   - the card sharp's forgiven eleven dollars;
   - Vessel, who "knew" him, past tense;
   - Winnie, who won't do the undertaker's job;
   - Frame's "old news";
   - Fanshawe's "somewhere very quiet";
   - Sump's "lapsed, on account of the claimant";
   - the livery man, through the mule;
   - Ozymandia, whom the undertaker undercuts;
   - Pratt, who says it straight without knowing he has;
   - Sheng's four pressed shirts;
   - Sowerby, who grieves Pike magnificently and never met him;
   - the bell-ringer, who "rang for him";
   - the dog's owner: "Did he have a dog?"

   **The undertaker pays it off**: "Everybody in town sent me to you." / "They would. I'm the one who says it." After that, each of them answers "You knew Pike was dead." in character.
3. **A greedy or over-familiar question on the menu** where a node lacked one (doc 99 rule 3):
   - Vessel: "Is there gold on it?" "There's a deed on it, son. Your name'll be on it shortly." He still never says anything untrue.
   - Fanshawe: "Is there gold under Prosperity?" "…depth, patience and paperwork. I sell all three."
   - Ozymandia: "Could the rod find gold on my claim?"
   - Winnie: "Are you always this busy?"
   - The hotel clerk: "Is this your hotel?" "The register is mine. The building is a formality."
4. **Lines Thad could not say on his first night now wait for the event** (doc 59 §11):
   - Frame's "Where did Deke Vessel go?" waits for the swindle. Before it, Vessel is sitting in the Nugget.
   - Sump's two deed questions wait for the swindle. Before it, Thad has no deed.
   - Sheng's two questions about the paper he holds wait until Sheng has said he holds any.

## What did not change

- **Untouched trees:** Hob's forty words; the driver's four options and "Wasn't for you."; the swindle; Fanshawe's dinner (A10's puzzle); the raccoon's naming.
- **Every flag write, puzzle gate, puzzle fact and Assay pair.**
- **Every Act II–IV row in the trees touched.** Those are named after `!` in the repeats list and are waiting for their own pass.

## New notation, for the documents

- **`*(again)*` / `*(second)*`** in a response cell is the answer to the same question twice. It works in doc 17's driver table, doc 27's tables and doc 04's tables. Doc 07's "*Asked again:*" lines were already read.
- **`unless FLAG`** beside `req FLAG` offers a row while the flag is NOT set: the Pike question before the undertaker has told him.
- **Doc 07's `[EXIT]`** with a reply is the character's own exit, as the card sharp's "Count your fingers on the way out." is. Without a reply it is doc 04's rotating pool.
- **Three directions** are new in doc 95:
  - Vessel raising his glass: class B, no pose yet;
  - Frame not writing Pike down: class C;
  - Pratt raking before he answers: class A, his own stroke frames.

---

## Step 3 — the first LOOK on what players click (errata 173)

Every first LOOK in Act I's rooms was read against doc 99. The examine layer is in much better shape than the conversations were: the first voice pass (docs 60–93) could change wording, and wording was what most examine lines needed. Most first LOOKs already do what doc 99 asks: noun first, a want or a joke, under 25 words. What the read found instead was **six lines that weren't true when they could first be read**, and those are fixed:

| Where | Before | After |
|---|---|---|
| The Nugget · MIRROR · LOOK 1 | I look like a man who has recently been robbed and is being brave about it. *(readable before the swindle)* | I look like a man about to make his fortune. The mirror's seen a great many of those, and it's still here. |
| The Company lobby · MAP OF HOLDINGS · LOOK 1 | …the map is mostly green. My claim is a small white apology near the edge. *(before he has a claim)* | …the map is mostly green. The white bits are what's left for the rest of us, and they look apologetic about it. |
| Pratt's claim · TOOL RACK · LOOK 2 | …Mine are in a pile and one of them is a raccoon's now. *(before he has met the raccoon)* | …A man who keeps tools like this means to stay, and means you to know it. |
| The Lane · EMPTY STOREFRONT · LOOK 3 | If my claim comes in, I'll buy this… | If I strike it rich, I'll buy this… |
| The claims road · the way up, without the map | …The deed says 'from the stake, thereabouts', and the whole hillside is stakes. *(before he has a deed)* | Claims up every one of these paths, and the whole hillside is stakes. A man would need a map to find anything up there, and a good one. |
| The hotel · REGISTER · LOOK 1 | 'Thadeus Grub.' The hotel has removed exactly the letters it considers extravagant. | 'Thaddeus Grubbe.' The hotel has added exactly the letter it felt I was missing. *(The clerk reads it aloud as "Mr. Grubbe", and doc 07 says the register's spelling is his. The book and the man now agree with each other, and with nobody else.)* |

`tests/first-night.test.ts` holds it. In the rooms open before the swindle (`tests/data/first-night-rooms.json`), no ungated line may speak of the swindle or of what it gives him: a deed, a claim of his own, the raccoon. It failed on the mirror.
