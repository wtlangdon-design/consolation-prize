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

**Status: approved (Tyler, 2026-11-09: "Go"). The lines are below, under THE LINES (errata 233).**

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
- `T_HILL_PRAYER`: Sowerby's prayer is running. He is paid by the foot and does not stop, so it runs until the climb. If Thad leaves and comes back, it is still running.
- `T_RODE_UP`: Thad has ridden up, so E6b is complete.
- **No dead end:** the prayer can always be asked again, and nothing is spent.

### Art and sound

- **Room 14 in its procession state:** the hearse at the gate, with Grievance in black, the undertaker, Sowerby and the mourners. These are the funeral's own figures from Room 31 (`funeral_*`), placed at the gate, so the sample needs no new image. `act3-hearse`'s four operations are held for anything the staging can't do with them.
- **Grievance's balk and walk** use her existing frames, plus one pose if the walk needs it.
- **Sound:** Sowerby's prayer is lines, not sound. Grievance's hooves on the climb are the R45 hooves already owed.

### THE LINES

*Written by one voice under errata 225's pass and doc 59, for Tyler's "Go" (2026-11-09). Thad narrates. Each hotspot's LOOK and LISTEN rotate 1, 2, 3, then hold the last. In this state, the coffin is inside the hearse, behind its glass.*

**ARRIVING** · *the first entry while the procession is stalled*
> "The procession has stopped at the gate. Everyone is looking at the mule, and the mule is looking at my coffin."

**THE WAY ON** · *walk through, while stalled* — "The funeral is waiting on the mule. So am I."

**THE HEARSE**
**LOOK** 1 "My coffin is inside, behind the glass. The curtains are drawn, out of respect for a man who isn't there." · 2 "Black lacquer, brass lamps and a plume on the roof. I have never travelled in such style, and I am not travelling now." · 3 "The back door is on a latch. It is the kind of latch that assumes nobody inside will want out."
**LISTEN** 1 "The coffin shifts an inch every time the wind leans on the hearse. It weighs nothing, and she knows it." · 2 "A brass lamp ticking as it cools." · 3 "Nothing from inside. That is the whole problem."

**GRIEVANCE, AT THE GATE**
**LOOK** 1 "Grievance, in black harness, standing at the gate as if it were a wall. Her head is turned toward the hearse." · 2 "She has carried every coffin in Consolation up this hill. She has never once been fooled, and she does not mean to start with mine." · 3 "Her ears are flat. The livery man would call it professional."
**LISTEN** 1 "A long breath out through the nose, aimed at the coffin." · 2 "Her harness creaks as she shifts her weight. She shifts it away from the hill." · 3 "Nothing. She has said what she has to say."

**THE MOURNERS**
**LOOK** 1 "Half the town, in black, at the gate. Nobody here has buried me before, and they would like to get it right." · 2 "They are standing the way people stand at a stopped coach, politely, looking at their watches." · 3 "Not one of them has looked at me twice. A low hat does more than I would have guessed."
**LISTEN** 1 "Somebody says I was a quiet sort of fellow. Somebody else says I was new. They agree that will be it." · 2 "A watch being wound, and then a second watch, out of sympathy." · 3 "Somebody asks whether the mule always does this. The undertaker says she has never done it before. Everybody looks at the coffin."

**THE UNDERTAKER**
**LOOK** 1 "The undertaker, at Grievance's head in his good apron. He is the only man here who knows the coffin is empty, and he is sweating for both of us." · 2 "He keeps not looking at me, which is very nearly the same thing as looking at me." · 3 "He has a hand on her bridle. She allows it, the way she allows weather."
**LISTEN** 1 "He is murmuring to the mule. It sounds like an apology." · 2 "His boots shift on the gravel. He would like to be anywhere else, the box included." · 3 "Nothing. He has stopped murmuring. It was not working."

**REVEREND SOWERBY, AT THE GATE**
**LOOK** 1 "Reverend Sowerby, with his book open at the place, ready to see me off." · 2 "There is a pencil behind his ear, for the counting." · 3 "He has not looked at me once. The clergy see the soul, and I am wearing a hat."
**LISTEN** 1 "He is turning pages to find his place, and finding it twice." · 2 "He hums the opening of a hymn under his breath, to see if it still fits." · 3 "Nothing. He is saving it."

**TALK TO THE UNDERTAKER** · *while stalled*
> **UNDERTAKER:** *(low)* "She's never carried an empty box up this hill. I don't know how she can tell."
> **THAD:** "I know exactly how she can tell."
> *(second)* **UNDERTAKER:** "Nine years, sir, and she has never once stopped at this gate."

**TALK TO THE MOURNERS** · *while stalled*
> "One of them tells me it is a shame about the piano man, and asks whether I knew him. I say not well."
> *(second)* "Another tells me he was very quiet. I agree with her. I was."

**TALK TO GRIEVANCE** · *while stalled* — "I tell her, very quietly, that I am not in there. She knows."

**TALK TO REVEREND SOWERBY** · *while stalled, before the prayer*
> **THAD:** "Reverend. Can a hill be blessed?"
> **SOWERBY:** "A hill? Anything can be blessed, sir. There is a rate."
> **SOWERBY:** *(beat)* "Hills are by the foot."
> **THAD:** "It's a short hill."
> **SOWERBY:** "It is a long foot."
> **SOWERBY:** "Let us bow our heads." → `T_HILL_PRAYER`. The mourners bow their heads and shut their eyes.

**THE PRAYER** · *Sowerby's barks while `T_HILL_PRAYER` holds, in turn, then round again*
1. "O Lord, who made the hills, and saw fit to set this one at an incline…"
2. "…look down upon this creature, who has borne so many of our brothers upward…"
3. "…and give her strength to bear one more, though he weighs, by every account, very little…"
4. "…and her mother before her, who was also a mule, and also of firm opinions…"
5. "…the amen will be along shortly. I am paid to the foot."

**TALK TO REVEREND SOWERBY** · *while the prayer runs* — "He is mid-prayer, with his eyes shut and the whole town's shut with him. I have never had a better chance at anything."

**THE HEARSE** · USE, *or* OPEN
- *while stalled, before the prayer* — "Not with half the town watching. A man climbing into his own coffin draws a crowd, and I already have one."
- *while the prayer runs* — *(Thad opens the back of the hearse, climbs in and lies down in his own coffin. Grievance's ears come up.)* **THAD:** "Ahead of schedule." → `T_RODE_UP`, **E6b**, and the ride.

**THE RIDE** · *over black*
1. "Grievance went through the gate before the amen."
2. "Behind us, Reverend Sowerby asked the Lord to look kindly on this creature, and opened his eyes to find the creature gone."
3. "It was a smoother ride than the stagecoach. I recommend it to anyone, at the end."

**ARRIVING AT THE GRAVE** · *Room 31, the first entry after the ride*
> "By the time the town caught us up, the coffin was on its trestles and I was at the back with my hat down, as out of breath as anybody."

**THE WRONG TRIES** · *while stalled*
- **GRIEVANCE, AT THE GATE** · USE THE TUNING FORK — the existing line: "She has heard it. She does not need to hear it twice."
- **THE HEARSE** · PUSH — "The deceased does not push. It would look keen."
- **THE HEARSE** · PULL — "It is attached to the mule, and the mule is attached to the ground."
- **GRIEVANCE, AT THE GATE** · PULL — "She considers the request, declines it, and goes on looking at the coffin."
- **GRIEVANCE, AT THE GATE** · PUSH — "From behind? At a funeral? I would be the second thing they buried."
- **GRIEVANCE, AT THE GATE** · PICK UP — "She is in harness, and in no mood."
- **THE MOURNERS** · PICK UP — "They have come to carry me. It would confuse things to carry them."
- **THE UNDERTAKER** · PICK UP — "He is holding the mule. Somebody has to."
- **REVEREND SOWERBY, AT THE GATE** · PICK UP — "He would charge for it."
- **THE HEARSE** · PICK UP — "With what is in it, I very nearly could."

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
