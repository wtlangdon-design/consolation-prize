# THE LAST CLAIM IN CONSOLATION
## 94 · The clue pass — a line where a puzzle asked the player to guess

*Tyler, 2026-11-06. The fairness audit found puzzles that can be solved but rely on a guess, each missing one clue line. He was asked: "Nine puzzles are solvable but rely on a guess, each missing one clue line… May I write them, under the same rules as the act-change lines, and show you before anything ships?" His answer: **"Yes, write and ship them."** Errata 127 records the ruling.*

## The rules of the pass

1. **What it writes:** one line, or two, in a state the player is already in, saying something the player needs and the game never said. That might be a goal ("I want that file read"), whose job a thing is ("signed by the assayer of record"), or what a thing lacks ("more than I have"). Each line is gated to the stretch of the story in which it is true and useful, and nowhere else.
2. **What it does not do:**
   - **It never states the action that solves.** It never says "use X on Y". The player still makes the connection.
   - **It is not a hint system** (invariant 4). There is no button, nothing is repeated on request, and nothing escalates. Each line is an ordinary LOOK or USE answer in a state.
   - It changes no puzzle, flag, gate, item or hotspot. It touches no load-bearing LISTEN line and no LISTEN at all. Nothing in it marks anything (invariant 3).
   - It does not touch the letters home (invariant 10).
3. **True whenever it can be read** (doc 59 rule 11): its gate is the whole of its truth.
4. **Doc 59's voice.** One writer, no subagents. Written here and extracted (`tools/compile-room.mjs` `verbRules`, by `ref`), never typed into /content.

## The lines

### E1 · why the archive (Room 7, Act III, until the hands are compared)

The audit found that after Fanshawe's offer no line says why Thad wants the sealed archive. Gated on `ACT` 3 and not `T_SAME_HAND`.

**THE ARCHIVE DOOR** · LOOK — "The archive. Mott's own file is behind this door: the whole of Claim One, not just the blank page." — "Fanshawe wants Claim One kept quiet. I'd like to know what it's being quiet about."

### E4 · who certifies a death (Room 7, once Thad must die, until he is certified)

The audit found that the only line saying Winnie certifies deaths is an optional Act I topic, gone after A9. Gated on `T_NEED_TO_DIE` and not `T_DEATH_CERTIFIED`.

**THE FORMS RACK** · LOOK — "Form 31-D, Certificate of Death: 'to be signed by the assayer of record.' That's Winnie. She's going to love this."

### D3 · where the money goes (Room 25, once Pratt says he's paid, until Sheng has said whom he holds paper on)

The audit found that every pointer to Sheng as the town's money is inside his own laundry. Gated on `T_PRATT_PAID` and not `T_SHENG_HOLDS_PAPER`.

**THE CLAIM** · LOOK — "Forty feet, raked, and somebody pays him two dollars a week to jump mine. Money that regular gets written down, and Sheng writes everything down."

### E3 · what a funeral costs (Room 13, once Thad must die, until it is booked)

The audit found that the price is never stated before Sheng states it. The joke that Sheng knows the exact figure before Thad does is kept: the board gives no total. Gated on `T_NEED_TO_DIE` and not `T_FUNERAL_BOOKED`.

**THE PRICE BOARD** · LOOK — "My funeral, priced in chalk, with the Reverend's words to come on top. I can't afford to die. I'm going to need a lender."

### E7 · the coffin, before the turnout (Room 31, until Hob's "Good turnout.")

The audit found that the coffin's refusal before the turnout ("It is in use. By me. Officially. The paperwork is immaculate.") reads as a final no. Gated on not `T_GOOD_TURNOUT`. The new line says "not yet", and says where to stand first. Doc 49's line stays in the coffin's ordinary answers.

**THE COFFIN** · USE — "Not yet. I should stand at my own graveside a moment first. A man only gets the one."

### The filing fee's own pool (doc 24)

Doc 24 headed one pool FOUR DOLLARS · THE FILING FEE. So the filing fee, which is two dollars, said "I have four dollars", and told the undertaker that money is "not a thing money buys". Doc 24 now heads the two pools separately. FOUR DOLLARS keeps its lines; THE FILING FEE has these.

## Not written, and why

- **A5, the raccoon's warmth.** The fact lives in the hole's LISTEN, which is load-bearing (invariant 3). A line saying it elsewhere sits too close to it. The three failures and the success line already carry the logic.
- **A6, filing the deed.** Low risk: the building is labelled CLAIMS REGISTRAR, with FILING on its rope. The deed's lines are doc 23's item lines, and an item has no state-gated line to add one to.
- **E6, asking before the form exists.** This needs a new dialogue option on five people, which is structure rather than a line. Errata 125 wired the three refusals doc 57 wrote.
- **E9, the hand.** The audit's two remedies are to describe the file's hand like the form's, or to accept the compare against the timesheet. Both sit beside invariant 3's timesheet LISTEN and invariant 7's `[COMIC]` path. That is a ruling, not a line.
- **B3, the hum.** It is performed as sound (errata 109), at a featured level (errata 117).
