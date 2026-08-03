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

**Its own features, in world coordinates, measured from the sprite:**

| | World x |
|---|---|
| The whole assembly | 912 – 1868 |
| The doorway | **1008 – 1341** |
| The driver on the box | **1332 – 1364** |
| The horses | **1485 – 1866** |

**There is no room to stand between the driver and the horses.** Thad speaks from *in front of* the box, nearer the camera, not beside it. He previously stood at (820, 760) — inside the vehicle's own span, eighteen pixels ahead of it, among the horses.

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

**FEET Y IS DEPTH, SO TWO MOVERS MUST NOT SHARE ONE.** Thad was placed at the coach's own y742 and drew *behind* it — `depthOrder` sorts by feet Y, correctly, and a stable sort keeps insertion order on a tie. The protagonist is constructed in `create()` and everyone else is placed by a beat, so he draws first and anything placed later draws over him. The only part of him clearing the coach body was his legs between the wheels: two dark bars, which at a glance is a black figure standing under a stagecoach. **He steps down out of a coach, so his feet land nearer than its wheels** — 794 against 742.

**A MOVER WITH NO PLACEMENT IS NOT AT THE ORIGIN.** It is wherever the last thing to touch it left it, which is worse than the origin because it looks deliberate. Anything that must be somewhere needs a `move` that puts it there, in the earliest beat it is seen.

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
| 1 | hob | walk | 60 → **1080**, and STOPS |
| 2 | — | `say 0` | Hob: *Wouldn't stand there.* |
| 3 | — | `say 1` | Thad: *Why not?* |
| 4 | — | `say 2` | Hob: *No reason.* |
| 5 | hob | walk | → 2100, off frame right |

**He stops, speaks, and goes on.** This is the beat that made `say` a staged step. A beat's lines used to be appended after **all** of its staging, so the shape above was inexpressible: he touched his mark for one tick, walked to 2100, and spoke all three lines from 180 units past the right edge of the frame — the words on screen and the man who says them off it. Played and captured before the fix.

**`say` NAMES ONE OF THE BEAT'S OWN LINES BY INDEX AND CARRIES NO TEXT.** 0, 1 and 2 are the lines doc 17 gives this beat, in its order: Hob, Thad, Hob. The words stay in the document; the staging says only when each lands. An index with no line behind it throws at extraction. A `say` holding a string would put dialogue in `tools/extract-content.mjs` and leave doc 17 as one of two places the words live.

**A beat that places any of its lines places all of them.** The rest are not appended, so a beat cannot half-schedule itself and play the remainder twice.

**His lantern glow travels with him**, additive, anchored to the flame in his own frames.

**Where does he stop?** **1080**, watched rather than guessed: he is drawn at h224 at y700 against Thad at h254 at y800, clear of him and near enough to be talking to him.

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

---
---

# PART TWO — EVERY ASSET, BY PATH, WITH ITS TIMING

*Part one says where people stand. This says **which file plays, for how long, at what size, drawn in what order**. Nothing below is a description: every row names a thing that exists on disk.*

---

# THE COMPLETE INVENTORY

## Thad — `content/actors/thad.json`, height **240**, facings front/back/left/right

| Clip | Facings | Frames | Rate | Purpose |
|---|---|---:|---|---|
| `stand` | 4 | 1 | — | The return pose. Every clip resolves to it |
| `idle` | 4 | 6 | 2.4/s | Breathing. The ordinary standing state |
| `idle-break` | 4 | 12 | 2/s | Occasional. Glance aside head-on, shoulder shrug in profile |
| `walk` | 4 | 8 | 8/s | Phase advances from **distance travelled**, not time |
| `recoil` | 4 | 4 | 7/s | Startle |
| `use-near` | right | 5 | 7/s | Reaching at chest height |
| `give-offer` | right | 5 | 7/s | Palm up, offering |
| `shrug` | right | 5 | 7/s | Both palms up |
| `pickup-low` | right | 5 | 7/s | Stooping to the ground |
| `alight-coach` | right | 5 | 7/s | Stepping down, leading foot landed |
| `aboard-coach` | right | 5 | 7/s | In the doorway, hand on a rail |
| `carry` | right | 5 | 7/s | Standing holding the case |

**Every clip declares `figureHeight` 526 and its facing's anchor.** They are all on the same canvas at the same scale, so a bent pose is shorter because the *pose* is shorter.

**The seven chores are RIGHT-FACING ONLY.** `face right` before any of them or it throws `CLIP_FALLBACK`. Nothing is substituted, by design.

**Chore markers, identical on all seven:** `begin 0 · contact 1 · commit 2 · recover 3 · complete 4`. Frames 0 and 4 **are** the stand frame byte for byte, so a chore cannot pop on either end.

## Thad's talk — head overlays, NOT body clips

| Facing | Overlay rect on the figure | Frames |
|---|---|---:|
| right | x383 y207, 64 × 68 | 3 — closed, half, open |
| left | x252 y192, 70 × 70 | 2 — closed, open |
| front | x266 y227, 66 × 34 | 2 — closed, open |
| back | — | **None. His mouth is not visible; reuse `stand`** |

**Composite at `overlay_rect` over whatever body clip is playing.** Frame 0 is the closed mouth taken from the master, so a loop ending on 0 restores the face exactly. **The body never swaps.** Loop irregularly — `0,1,0,2,1` — and **talk timing never controls line duration.**

## Hob — `content/actors/hob.json`, height **240**, facing **right only**

`stand` 1f · `idle` 6f · `idle-break` 12f · `walk` 8f.

**He cannot turn.** A left-facing request draws nothing and does not throw — that is data, not a defect. **He must always walk rightward.**

## The coach — `content/actors/coach.json`, height **389**, facing right

| Clip | Frames | Draws |
|---|---:|---|
| `idle` | 1 | Standing: door shut, case on the rack, driver on the box |
| `walk` | 1 | Departing: same, door shut |

**389 is its own art, NOT a point on the depth curve.** The curve runs 222–263 and describes how tall a *man* is at a depth; handing a coach to it drew it at 590 × 240, roof at head height.

**The driver and the team are drawn INSIDE these frames.** Errata 31d: splitting the team out puts a seam down the harness.

## The driver's head — `reference/casting/driver-head-*.png`, 786 × 1140 each

| State | Use |
|---|---|
| `neutral` | Default, looking out over the team |
| `speaking` | **Only while he speaks.** Differs from neutral by 1,240px, all mouth |
| `looking-down` | While Thad speaks up at him. Differs by 68,573px, of which only 2,202 below the collar |

**All three share one canvas**, so they swap without the body moving. Composite over the coach's own driver, at the coach's scale.

## Props and effects

| File | Size | Use |
|---|---:|---|
| `art/objects/thads-case.png` | 304 × 310 | The case, its own sprite. Socket on his hand |
| `art/effects/lantern-glow.png` | 512 × 512 | **ADDITIVE.** Intensity 0.85 |
| `art/objects/coach/wheel-rear.png` | 296 × 296 | Rotates about its centre, radius 144 |
| `art/objects/coach/wheel-front.png` | 236 × 236 | Radius 114 |
| `art/backgrounds/room-01-stage-road.png` | 1920 × 864 | The plate |

**The lantern glow is drawn AFTER the plate and BEFORE the characters**, anchored to the flame in Hob's own frames — at Thad's scale that is x658 y969 of a 740 × 1517 figure — and sized **2.6 × the drawn character height**. Baked into his sprite it would be a hard patch of lit ground moving with him; painted into the plate it would stay after he had gone.

**The wheels rotate by DISTANCE TRAVELLED**, one revolution per 2πr — so rear and front turn at different rates and both stop when the coach does. Currently composited into the body because nothing drives them.

**`art/objects/room-01-coach.png` (320 × 144) IS DEAD ART.** Errata 53 discarded it. Do not use it.

---

# DRAW ORDER, EVERY FRAME

1. The plate
2. **The lantern glow**, additive, if Hob is in the room
3. Movers, **sorted by feet Y** — the anchor is the only depth key. Never the sprite's top, centre or rectangle
4. **Head overlays** over their own bodies: Thad's talk, the driver's head
5. Foreground planes *(Room 1's does not exist — cut from art errata 53 discarded)*
6. The verb panel, 216 units, glyphs at **×4**

---

# BEAT BY BEAT, WITH ASSETS AND TIMINGS

| Beat | Actor | Clip / asset | Facing | Duration | Notes |
|---|---|---|---|---|---|
| 1 | — | — | — | menu | Title. Nothing staged |
| 2 | **coach** | *placed* at **1390, 742** | right | 0.1s | **The only place it is placed.** It was previously placed by beat 6b's `from` — the beat where it *leaves* — so through beats 2–6 it stood wherever the mover happened to be created, and Thad alighted at the door's correct coordinates while the coach was elsewhere |
| 2 | coach | `idle` | right | held | Door shut, case on the rack, driver on the box |
| 2 | thad | *placed* at 1290, 742 | — | 0.1s | A chore plays where the actor is |
| 2 | thad | `face` | **right** | — | **Before any chore, or it throws** |
| 2 | thad | `aboard-coach` | right | 5f @ 7/s ≈ **0.7s** | |
| 2 | thad | `alight-coach` | right | 5f @ 7/s ≈ **0.7s** | |
| 2 | thad | `walk` → 1180, 754 | right | ~110px @ 8/s | |
| 2 | thad | **`straighten-coat`** | right | — | **DOES NOT EXIST** |
| 3 | thad | `walk` → 1120, 762 | right | | |
| 3 | thad | talk overlay, right | — | line duration | Body holds `stand`/`idle` |
| 3 | driver | `looking-down` | — | while Thad speaks | |
| 3 | driver | `speaking` | — | on his line | Back to `neutral` after |
| 4–6 | thad | `idle` + talk overlay | right | player-paced | Four options, all four present at the end |
| 6 | case | roof → mud | — | ~1s | **Nothing moves it today** |
| 6 | thad | `pickup-low` | right | ≈0.7s | Only if he picks it up — see Q11 |
| 6 | driver | *climbs aboard* | — | — | **CANNOT HAPPEN** — head overlay only |
| 6b | coach | `walk`, move → 2600, 742 | right | **3s** | Wheels should turn |
| 7 | hob | *placed* −260 → 60, 700 | right | 2s | Off frame **left** |
| 8 | — | — | — | — | Panel appears |
| 9 | hob | `walk` → 1080 | right | | **Then STOPS** |
| 9 | — | `say 0` · `say 1` · `say 2` | — | line duration | The beat's own lines, by index. No text in the staging |
| 9 | hob | `walk` → 2100 | right | | Off frame right |
| 10 | — | — | — | — | **Nothing staged.** The player walks west |

---

# THE RULES THAT ARE EASY TO BREAK

**`face` before any chore.** Seven right-facing clips and he starts facing front.

**`move` places a mover; `walk` never does.** And `move` is legal only in a beat whose `control` is `none` — which is why Hob is placed in beat 7 and used in beat 9.

**A newly placed mover must be seeded with the current clock.** `Actor`'s clock starts at zero; a mover placed and glided on the same tick records `startedAt: 0` against a scene clock already twenty-five seconds old, and the glide is over before its first frame. They appear at their destinations having never been seen to move.

**Feet anchor is position and z-sort.** Never the sprite rectangle.

**Frames never supply root motion.** Translation comes from the movement system.

**Gait phase advances from distance travelled** and is **preserved across a facing change**. Do not reset it at a corner.

**No substitution, ever.** A missing clip throws `CLIP_FALLBACK` naming clip/facing/surface. That is Q20 as ruled and it is how three faults were found tonight.

**A staged `say` carries an INDEX, never a string.** It names one of its own beat's lines. The words live in doc 17 and nowhere else; a string here would make the staging table a second home for dialogue, and two places holding one fact is how every pair of documents in this project has drifted. An index out of range throws at extraction.

**The depth curve governs anyone it is true of, routed or not.** A staged crossing is a man walking, not a composition, so it samples the curve at its feet Y like everything else. The exemption is declared in the RECORD -- `scalesWithDepth: false` -- and not inferred from how a mover is being driven. The coach carries it; nothing else does.
