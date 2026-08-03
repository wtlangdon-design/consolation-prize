# ROOM 1 — THE STAGING SCRIPT
## What happens, where, and in what order, from the title to the road west

*Doc 17 is the beat sheet: it says what occurs. This says **where everyone is standing while it occurs**, and it exists because that was being invented one commit at a time and discovered wrong one playthrough at a time.*

---

# READ THIS FIRST

**Every number here is measured or corrected, and the ones that are guesses say so.** Four faults in the last two sessions came from coordinates invented in a commit message that nothing could check against.

**This document is the thing to correct.** It is cheaper to be wrong here than in the running game, and every position below is a sentence you can disagree with.

---

# THE GROUND

| | |
|---|---|
| Play area | 1920 × 864 |
| Walkable band | y **660 – 864** — the open mud, measured where it becomes the surface |
| Walk box | x **256 – 1629** — the water tower and the woodpile hold the edges |
| Depth curve | 222 at the back, 240 at mid, **263** at the front |
| Thad | 240px at mid-depth — Monkey Island's 27.8% of the play area |

**Off-frame is a real place.** Anything at x < −200 or x > 2100 is outside the frame with room to spare, and a mover placed there can walk in.

---

# THE COACH'S POSITION IS WRONG AND MUST MOVE

**The coach hotspot is at x 1152 – 1632.** The sprite is placed at **x 646**. Clicking the coach targets empty road on the left while the coach stands on the right.

`case_roof` at x 1236 agrees with the hotspot. So does doc 17: the coach **departs east, frame right**, which is a shorter journey from the right side and reads as continuing the way it was already pointed.

**The coach stands at x 1390, wheels on the road at y 742.** That centres its 956px width on the hotspot's 1152–1632.

Everything below assumes that. **It is the single largest correction in this document.**

---

# BEAT 1 — TITLE
**control: menu · nothing staged**

Title over the ridge. Consolation below as scattered lamps in a great deal of darkness. Longing, not comedy.

---

# BEAT 2 — HE ARRIVES AND GETS DOWN
**control: none · 8 seconds**

> *The coach arrives and halts with Thad visibly aboard. He climbs down, straightens his coat, looks at the town.*

**The arrival must be seen.** The player-audit fix was that nobody saw him arrive, so there was no reason to think the man he talks to drove him.

| # | Who | Does | Where | Why |
|---|---|---|---|---|
| 1 | thad | **placed** | 1290, 742 | At the coach's door, on its near side. A chore plays wherever the actor is; without this he climbs down out of thin air at the frame's bottom centre |
| 2 | thad | face | right | The chore clips are drawn right-facing only. A chore before the face asks for `aboard-coach/front` and throws |
| 3 | thad | chore `aboard-coach` | — | Standing in the doorway, one hand on a rail that is not drawn |
| 4 | thad | chore `alight-coach` | — | Leading foot down, trailing leg still up behind |
| 5 | thad | walk | 1180, 754 | Clear of the door, a step forward and slightly nearer the camera |
| 6 | thad | chore **`straighten-coat`** | — | **DOES NOT EXIST.** Doc 17 asks for it and the clip was never generated — the one prompt in doc 42 we skipped. Either generate it or cut the line from doc 17 |
| 7 | thad | face | right | Looking up at the box |

**Open question:** should the coach *arrive*, or be halted when the beat opens? Doc 17 says "arrives and halts". Arriving means a `move` from off-frame right, which costs two of the eight seconds and makes the halt visible. Currently it is simply there.

---

# BEAT 3 — HE INTRODUCES HIMSELF
**control: none**

> **THAD:** My name is Thaddeus Grubb. I have come to Consolation to make my fortune.
> **DRIVER:** Course you have.

| # | Who | Does | Where |
|---|---|---|---|
| 1 | thad | walk | 1120, 762 |
| 2 | thad | face | right |
| 3 | driver | head overlay `speaking` | — |

**The driver has three head states** — neutral, speaking, looking down — and they swap over the coach without his body moving. He should be `speaking` on his line and `looking-down` while Thad talks up at him.

---

# BEATS 4, 5, 6 — THE DRIVER'S TREE
**control: player · carried by STAGE_DRIVER**

> **DRIVER:** Four dollars? — **THAD:** Four dollars. — **DRIVER:** You've all got four.
> **DRIVER:** Ask the undertaker. He knows everybody.
> **DRIVER:** Hotel's five dollars. — **THAD:** I have four.

Four options, all four still there at the end, three dimmed. **Errata 37 is revoked** — nothing is removed.

**Beat 6 stages two things and one of them cannot happen:**

| # | Who | Does | Where | Why |
|---|---|---|---|---|
| 1 | — | **the case comes off the roof** | 1236, 336 → 948, 780 | It goes in the mud. `case_roof` and `case_mud` are both hotspots and the case is its own sprite. **Nothing moves it today** |
| 2 | thad | face + chore `pickup-low` | — | He stoops to it |
| 3 | driver | **climbs aboard** | — | **CANNOT HAPPEN.** He is baked into the coach and exists as a head overlay. His `climbing` pose is from the four-up sheet and has nowhere to play |

**Does he pick the case up, or does it stay in the mud?** Doc 17 says it goes in; Q11 asks whether he visibly carries it. If it stays, `pickup-low` is wrong here and the beat is him looking at it.

---

# BEAT 6b — THE COACH LEAVES
**control: none · 3 seconds**

> *It DEPARTS — it does not vanish. Team walks, wheels turn, it leaves frame right.*

| # | Who | Does | Where |
|---|---|---|---|
| 1 | coach | move | 1390, 742 → **2600, 742** over 3s |

**The wheels should turn and do not.** They are cut and rotate by distance travelled — one revolution per 2πr, so rear and front turn at different rates — but nothing drives them. They are composited into the body for now.

**The door is shut while he stands outside it** (Q38: a mover has clips, not states) and **shut as it leaves**, which is correct — a driver closes the door.

---

# BEAT 7 — IT RECEDES, AND HOB IS PLACED
**control: none · 3 seconds**

> *The coach recedes east. A badly tuned piano, faint, from the town. ACT CARD.*

| # | Who | Does | Where | Why |
|---|---|---|---|---|
| 1 | hob | placed | −260, 700 → 60, 700 | **Off frame LEFT.** He is drawn right-facing only, so he must walk rightward. Placed here and not in beat 9 because `walk` never creates a mover and `move` is fenced to beats whose control is `none` |

---

# BEAT 8 — CONTROL
**control: player · nothing staged**

The verb panel appears. No announcement. The game has started.

---

# BEAT 9 — HOB CROSSES
**control: player**

> **HOB:** Wouldn't stand there. — **THAD:** Why not? — **HOB:** No reason.

| # | Who | Does | Where |
|---|---|---|---|
| 1 | hob | walk | 60 → **around 700**, and STOPS |
| 2 | hob | says his line, Thad answers, Hob answers | — |
| 3 | hob | walk | → 2100, off frame right |

**He currently walks straight across while the lines play.** An exchange needs him to stop, speak, and go on — three lines from a man who does not break stride is not the beat.

**His lantern glow travels with him**, additive, anchored to the flame in his own frames.

**Where does he stop?** 700 is a guess: near enough to Thad to be talking to him, far enough not to overlap. It wants a number from someone who has watched it.

---

# BEAT 10 — WEST, TOWARD TOWN
**control: player · nothing staged, deliberately**

Going west is the player's move to make. This beat previously walked Thad west during a player-control beat — the game moving the protagonist while the player held the mouse.

**Q2 is unresolved: which way Main Street lies.** If west is not the exit, this beat is wrong in a way no staging fixes.

---

# WHAT THIS SCRIPT CANNOT PLAY TODAY

| # | What | Needs |
|---|---|---|
| 1 | The coach is at x646 and its hotspot at x1152–1632 | Move the sprite. **Do this first** |
| 2 | `straighten-coat` does not exist | One generation, or cut it from doc 17 |
| 3 | The driver cannot climb aboard | A body sprite, or cut it |
| 4 | The case never comes off the roof | A mover for the case, or a state swap |
| 5 | Hob does not stop to speak | A `walk`, the lines, then another `walk` |
| 6 | The wheels do not turn | Something to drive them from distance travelled |
| 7 | The coach's door is shut throughout | Q38 — movers have clips, not states |
| 8 | Nothing marks him stepping down | Q37 — no flag between alighting and the case |

**Items 1 and 5 are the two that would most change how the scene reads.** The rest are polish or are already filed.

---

# HOW TO USE THIS

**Correct it here first.** Every position is a sentence to disagree with, and disagreeing costs a minute where discovering it in the running game costs a playthrough.

**Then it becomes the staging table** in `tools/extract-content.mjs`, which is where the marks live so that no `.ts` carries a coordinate and no prose document carries a pixel.

**Then it is played, and the numbers are corrected against what is seen** — because being right in a document is not the same as being right on screen, and this project has been reminded of that all night.
