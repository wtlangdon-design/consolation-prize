# THE LAST CLAIM IN CONSOLATION
## 101 · The Act II rewrite — doc 99, room by room

*Errata 175. Tyler, 2026-11-08, asked whether the game would now feel more like Monkey Island and told Act I had the full pass and Acts II–IV only the asked-again answers: "Start act 2". The fourth writing exception (errata 171) for Act II, in doc 99's voice, in the documents, extracted. The puzzle graph, puzzle facts, flags a puzzle reads, the Assay pairs, the three load-bearing LISTEN lines and every invariant are untouched.*

## Part one — the conversations, and where the act starts

### What the read found

Act II's conversations were written later than Act I's (the W1 growth and Batch C, docs 04 and 54), and most of them already do what doc 99 asks. Winnie's rulings, Fanshawe's favours, Pratt's arithmetic, Sheng's accounts, Sowerby's adjectives and Sump's sections each have a bit, and each commits to it. The pass did not rewrite them for the sake of it.

**What was missing was direction.** Act II opened at Fanshawe's door with "I believe I own something." and the act card, and then Thad stood in the office at night with nothing to want. The whole act is stated by Sump (SUM_B1's opening: Document C, on A, B and D), but nothing sent Thad to Sump. Main Street's first night has the same problem solved (doc 98: the Pike errand), and Act IV already opens with a line (errata 101 B).

### What changed

1. **Act II opens on Main Street the next morning**, with Thad saying what he wants and where it starts (doc 57 A10; errata 101 B's mechanism, `T_ACT_II_OPENING`):

   > "I have decided. The richest strike in the territory is next door to my mud, and gold doesn't stop at a fence. Mr. Sump has Claim One's filing, and I am going to read it."

   It is true when said: A9 told him Prosperity abuts Claim One, the strike is the town's legend, and the sealed filing is Sump's. It is a reason, not a hint: it names the place every Act II trial starts from, which Sump then explains.

2. **Frame's trade (FRA_B1) says its price out loud.** The node opened on "A story for a schedule." The trade's real terms ("Thad must supply a humiliating one about himself", doc 02 B1) were only in the stage notes. Now:

   > **FRAME:** "A story for a schedule. That's the rate. It's always been the rate."
   > **THAD:** "I'd pay you instead, but Mr. Vessel has my four dollars."
   > **FRAME:** "Money doesn't PRINT, Mr. Grubbe. Tell me something humiliating about yourself."

   A new `[COMIC]` row for the joke menu (doc 99 rule 3), the vain answer: "I've never done anything humiliating in my life." → "'NEWCOMER CLAIMS SPOTLESS RECORD.' Nobody'll believe it. It'll sell out by noon."

3. **Winnie no longer shuts him down twice in a row** (doc 99 rule 4: one shut-down per character, as a signature). Her "No." to the raccoon stays; her "I know." to his compliment now goes one word too far, and she notices: "I know." *(beat)* "Nine years, and you're the first to mention it." Her queue line escalates instead of stating: "You need to be in a queue. It's eight months long, and it got longer while you were asking." The eight months is unchanged.

4. **Vessel stops borrowing the pie woman's gag.** His rematch answer was "Course you would.", one word from "Course you will.", which doc 99 gives to her alone. Now: "Every man does, son. It's what keeps me in practice. Pull up the chair; the judges are getting bored."

5. **Every `[COMIC]` row that stays on the menu answers differently the second time**, so nobody in Act II repeats himself word for word:
   - Vessel: "Still answering, son. I've got the answer down very nice by now."
   - Winnie: "Still legible." · "Still offended. I'll tell you when it stops. It won't." · "I have told you this twice now. I'm keeping count."
   - Fanshawe: the clock ("Reliability is the whole of punctuality"), the chairs ("I had them reupholstered while you were looking"), and the raccoon: "Still! You're very loyal, Mr. Grubb. I shall have to name something after you."
   - Pratt: "Still nope." · "Hen's not for sale."
   - Sheng: "Nobody believes me, which is also restful."
   - Ozymandia: "I am adding the question to your account."
   - Sump: "Still not a ground. I have consulted the statute, in case."
   - The livery man: "Still the same view. She's loyal to it."

   Pratt's own answers were not given offers: his offer run already closes every conversation he has (`closing`, errata 97), and a second ladder inside the answers would have run the numbers backwards.

### What did not change

- The duels (doc 03): the pairs, the wrong answers and the framing. They are the game's insult swordfighting and were built that way.
- Hob, for the reason errata 174 gives.
- Every puzzle fact: the eight months, Fiddler's Gulch two days out, the two dollars a week, Clause 9, the ninety days, the eleven thousand.

---

## Part two — Act II's rooms (errata 176)

### What the read found

Every first LOOK in the rooms Act II's trials run through was read against doc 99. The rooms were: the Nugget's back room, the assay office and its records room, Fanshawe's office by day, the church, Sheng's laundry, Boot Hill, Pratt's claim and the Clarion.

**The examine layer was already doing doc 99's work.** Most first LOOKs are a noun and then a joke, and the joke is split into its own spoken line (`then`), so a list of first sentences reads flatter than the game does: "One table, two chairs facing, and a great deal of floor for standing around it." is followed, in play, by "The architecture of an argument." Nothing was rewritten for the sake of it.

**What the read did find is three continuity errors in one room.** The strike is twelve years old, and Winnie has kept her window for nine (doc 01). Her second ledger's nineteen entries run from 1849 to this spring (doc 54). The records room disagreed with both:

| Where | Before | After |
|---|---|---|
| THE REGISTER OF ASSAYS · LOOK 1 | "…Nineteen names, twelve years." *(its own LOOK 2 says "Nine years of assays")* | "…Nineteen names in nine years." |
| THE NINETEEN NAMES · LOOK 2 | "…the dates are spread across twelve years like a slow leak." | "…spread across nine years like a slow leak." |
| THE STOOL · LISTEN 1 | "One loose joint. It announces him." *(the stool is hers, and its LISTEN 3 is "It's waiting for her.")* | "One loose joint. It announces her." |

`tests/continuity.test.ts` holds it: her two rooms may not give her office the strike's twelve years, and her furniture may not announce a man.
