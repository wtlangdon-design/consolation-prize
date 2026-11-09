# 110 · ACT III: FEWER COUNTERS, MORE SCENES

*Tyler, 2026-11-09. The feel review of the full playthrough (errata 221) found that Act III goes across a counter at 11 of its 17 destinations, five of them the Registrar's. Tyler asked for A, B and C together, with the paperwork condensed: "different, unique scenes vs in/out of the same rooms exchanging papers is soooo much more fun and interesting." He approved the plan, "Consolation: fewer counters, more scenes", with "I approve all of your decisions", and left Sheng to the builder. Errata 231 records the ruling.*

**The rule.** Every stretch of the game is a run of different scenes, and paperwork is the seasoning, not the meal. No step exists only to make the player leave a room and come back.

---

## 1 · The new order

| # | Step | Where | Today | After |
|---|---|---|---|---|
| 1 | Fanshawe's offer (E0b) | Room 11 | | Kept |
| 2 | The petition and the statute (E1, E2) | Room 7 | One visit already | Kept |
| 3 | The eulogy's price (E3.1) | Room 17 | | Kept |
| 4 | **C · The estate sale** | Pratt's claim | Sheng's loan, at his counter (E3.2) | New scene; replaces the loan |
| 5 | The undertaker (E3.3) | Room 13 | | Kept |
| 6 | Winnie signs (E4) | Room 5 | | Kept |
| 7 | Hob, at night (E6.1) | The back alley | | Kept |
| 8 | Death and executor recorded (E5.1, E6.2) | Room 7 | Two visits | One visit: the certificate and the form together |
| 9 | **B · The séance** | Ozymandia's tent, at night | Frame's obituary, at his desk (E5.2) | New scene; replaces the obituary |
| 10 | **A · The hearse won't go** | Room 14, Boot Hill | — | New puzzle |
| 11 | The coffin (E7, E8) | Rooms 31, 32 | | Kept |
| 12 | The archive (E9) | Rooms 7, 8 | | Kept |
| 13 | The confession (E10) | Room 21 | | Kept |

**Sheng** leaves Act III's main path. He is in his laundry for anyone who visits, and his Act II favour still pays off where it already does, in turning Pratt (D5). His Act III loan row stays in the tree for a save already past it, and is not offered to anyone else.

**The two merges** need no new lines. Row 8 is order: Hob's form can be had before the death is recorded, so the walkthrough takes both to Sump in one visit, and SUM_C1 and the executor's form already answer in one conversation.

**Untouched:** every load-bearing line, every invariant (Room 32 still has no interface; HOB_C1 option 4 is still unmarked; the three LISTEN lines are still indistinguishable), and every emotional beat: the offer, Winnie's signature, the coffin, the confession.

---

## 2 · Scene A · The hearse won't go

**Status: design for Tyler's approval. No lines are written until he approves it.**

### What the game already says

- Grievance has moved for nobody in twelve years, except a man who whistled at her, and Thad's corrected whistle in Act II (B3: "She has heard it. She does not need to hear it twice.").
- The hearse harness "is cut for Grievance and nobody else. She knows the road to Boot Hill … and does not stop at the gate unless asked." (doc 09)
- At the funeral: "She keeps her head turned a little toward the coffin. I do not think she is fooled." (Room 31, GRIEVANCE, IN BLACK)

**The scene is built on that last line.** Grievance is not fooled: she won't pull an empty coffin up Boot Hill. So the dead man has to be in it.

### The situation

Funeral day, after the séance. The procession has reached the foot of Boot Hill (Room 14) and stopped there. Grievance is in her black harness and won't take a step. The town stands about in its black coats, and the undertaker is embarrassed. Thad, hat low, is just another mourner. The examine layer gets a new state of Room 14: the hearse at the gate, the mourners, Sowerby, the undertaker, the coffin, Grievance.

### The puzzle

1. **Why she won't go.**
   - LOOK at Grievance gives her head turned toward the coffin.
   - The undertaker, asked, says she has never pulled an empty box and he doesn't know how she can tell.
   - Thad knows exactly how she can tell.
2. **The obvious answer is in front of the whole town.** USE THE COFFIN while the mourners are watching is refused. A man can't be seen climbing into his own coffin at his own funeral.
3. **Everyone has to look away at once.** Thad asks Sowerby, as a stranger, whether a hill can be blessed.
   - Sowerby has a rate for that.
   - The town bows its heads and shuts its eyes, and Sowerby begins, at length, with feeling.
   - **While the prayer runs, USE THE COFFIN works.** Thad climbs in, and Grievance sets off up the hill at once, mid-prayer.
4. **Over black: the ride up**, a few lines, the way the Gulch ride is told.
   - The town opens its eyes to an empty road and hurries after.
   - Inside the box, Thad notes that it's a smoother ride than the stagecoach.
5. **Room 31, beat 1, rewritten as staging.** The hearse is already at the grave when the town arrives out of breath. Thad has slipped out the back and is standing at the rear, hat low. From there the funeral plays exactly as written (S2 beats 2–4).

### The wrong tries

| Try | Answer, in short (lines to be written) |
|---|---|
| THE TUNING FORK on Grievance | The existing line: she has heard it, and doesn't need to hear it twice |
| PUSH the hearse | The deceased does not push |
| PULL Grievance | She considers the request and declines it |
| USE THE COFFIN, with the town watching | Not in front of everyone |
| TALK TO a mourner | Each of them has one remark about the late Mr. Grubb, and none recognizes him |
| Sowerby, before the hill's blessing is asked | He has his eulogy, priced, and won't start early |
| GRIEVANCE, after the climb | She is working (the existing PICK UP line) |

### States and flags

- The new puzzle, **E6b · The hearse**, comes between E6 and E7. The count goes from 52 to 53.
- `T_PROCESSION_STALLED`: set on the funeral day, by the séance's end once B is built. Until then, it is set by the first entry to Boot Hill after E6.
- `T_HILL_PRAYER`: Sowerby's prayer is running. It clears when the climb happens, or after the prayer's lines run out. Asking again starts it again, so nothing can be lost.
- `T_RODE_UP`: Thad has ridden up, so E6b is complete.
- **No dead end:** the prayer can always be asked again, and nothing is spent.

### Art and sound

- **Room 14 in its procession state:** the hearse at the gate, with Grievance in black, and the mourners. That is the room's plate plus a companion state, and up to 4 operations from `act3-hearse`.
- **Grievance's balk and walk** use her existing frames, plus one pose if the walk needs it.
- **Sound:** Sowerby's prayer is lines, not sound. Grievance's hooves on the climb are the R45 hooves already owed.

---

## 3 · Scenes B and C (outline; designed after Tyler rules on A)

**B · The séance.** Ozymandia sells the town a séance to reach "the late Mr. Grubb". Thad, under the table in a low hat, has to be his own ghost convincingly enough that the town is sure he's dead. Frame attends with his pencil, so the obituary still goes to print. Its puzzle and lines come after A has been played.

**C · The estate sale.** Pratt buys "the effects of the late Mr. Grubb" in advance, to pay for the funeral. The effects are the raccoon, and his price moves the way it always does. Its puzzle and lines come after A has been played.

---

## 4 · What stays out

- No new room plates. Every scene happens in a room already built, in a new state.
- No hint system, and nothing marked.
- No change to Act IV.
- The second Act II trim (Sowerby sending Pike's notice himself) is held back. The second trip to Frame is where "I've added refreshments. It doubles the turnout." lands (errata 232). It is Tyler's to rule on again.
