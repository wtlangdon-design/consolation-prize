# CONSOLATION PRIZE
## Palette Cycling — animation specification

*The 1990 technique for background motion. Supersedes nothing; adds the only animation system the game will have outside sprites.*

---

# WHY THIS AND NOT FRAME ANIMATION

Backgrounds in *The Secret of Monkey Island* were largely still. What motion existed came from sprites, plus a small number of looping background elements — fire, water, lamplight — and those were done by **palette cycling**: rotating colour entries within a ramp while every pixel index stays fixed.

**This costs almost nothing here, because the pipeline already stores indices.** `tools/pixelart/` draws palette indices to an indexed canvas and colour resolves only at export. Cycling is rotating entries in a ramp at runtime. No frames, no extra art, no change to how any room is composed.

**It is also the authentic technique**, which matters for a game whose entire proposition is that it looks like it was made in 1990.

---

# THE DISCIPLINE

**Restraint is the whole design.** A town where everything shimmers reads as a screensaver. A town where one lamp breathes and everything else holds perfectly still reads as period.

1. **No more than two cycling elements per room.** Most rooms have zero or one.
2. **Nothing cycles in the frame's focal area** unless it is the focus. Motion pulls the eye, and the eye should be pulled by hotspots and characters.
3. **Cycling never conveys information.** No object cycles because it is important, and nothing stops cycling because a puzzle changed. A player must never learn to read motion as a hint.
4. **Rates are slow.** Anything faster than about 4 Hz reads as a glitch at this resolution.
5. **Every cycling ramp is declared in room JSON**, not hard-coded — same rule as everything else.

---

# THE MECHANIC

A cycling element declares:

| Field | Meaning |
|---|---|
| `ramp` | Which palette family, and which contiguous indices within it |
| `mode` | `rotate` (entries shift along the ramp) · `pingpong` (up then back) · `pulse` (two-entry swap) |
| `rate` | Steps per second |
| `phase` | Optional offset, so two elements on the same ramp do not move in lockstep |

**Constraint: a cycled index range must not be used anywhere else in the room.** If the lamp's warm ramp also paints a window frame, the window frame will flicker. Cycling ranges are reserved at composition time and the build fails if a reserved range appears outside its declared element.

---

# THE ROOMS

Complete list. Rooms not named here have no cycling and should not acquire any.

## Room 1 · Stage road, night — **two elements**

The most important cycling in the game, because it is the first screen anyone plays and the frame is almost entirely still and dark.

| Element | Ramp | Mode | Rate | Note |
|---|---|---|---|---|
| **Hob's lamp** | warm, 4 entries | `pulse` | 0.6 Hz | Very slight. A carried flame in still air, not a torch. It is the brightest and only warm object in the frame and it must not draw more attention than a lamp deserves. |
| **The puddles** | sky family, 3 entries | `pingpong` | 0.25 Hz | Barely perceptible. Moonlight on standing water shifting as air moves over it. Phase-offset per puddle so they do not breathe together. |

*The coach lantern does **not** cycle. Ruling 18b established that the lamp is the uniquely brightest object in this room; a cycling lantern would compete for it.*

## Room 3 · The Bountiful Nugget — **two elements**

| Element | Ramp | Mode | Rate | Note |
|---|---|---|---|---|
| **Stove door** | fire, 5 entries | `rotate` | 3 Hz | The only fast cycle in the game. It is a fire, it is small, and it is at the edge of frame. |
| **Chandelier** | brass, 3 entries | `pulse` | 0.4 Hz | Doc 05 says it is unlit. This is candle-glow *reflected* off brass from the room below, not the chandelier burning. Keep it almost imperceptible. |

## Room 5 · Assay Office — **one element**

| Element | Ramp | Mode | Rate | Note |
|---|---|---|---|---|
| **The light shaft** | bone, 4 entries | `rotate` | 0.8 Hz | Dust drifting through a window shaft. It is the one soft thing in the most ordered room in the territory, and that contrast is the point. |

## Room 26 · Creek & sluice — **one element**

| Element | Ramp | Mode | Rate | Note |
|---|---|---|---|---|
| **Running water** | sky + grey, 6 entries | `rotate` | 2 Hz | The classic case. Doc 05: *"It is the only thing in this territory that is doing exactly what it appears to be doing."* It should be the most alive surface in the game. |

## Room 34 · Under Prosperity — **one element**

| Element | Ramp | Mode | Rate | Note |
|---|---|---|---|---|
| **The oil lamp** | warm, 4 entries | `pulse` | 0.8 Hz | Faster and less steady than Hob's, because it is being carried by a man who is digging. Four hours of oil in it and the game does not say so. |

## Room 33 · The listening chamber — **one element, and it stops**

| Element | Ramp | Mode | Rate | Note |
|---|---|---|---|---|
| **The lamp** | warm, 4 entries | `pulse` | 0.8 Hz | As Room 34. |

**At F2, when the void is located and the score begins coming into tune, the lamp's cycle rate ramps to zero over the same ninety seconds.** By the time the score resolves, the only moving thing in the frame has stopped.

Nothing says this and nothing marks it. It is the visual half of the tuning arc and it costs one automated parameter, exactly as the detune does.

## Rooms with no cycling

Everything else. Specifically and deliberately: **Room 2 and Room 36 do not cycle.** Main Street is the most-visited screen in the game and its stillness is what makes the town feel like a painted set that people live behind. The dawn version must be identically still, or the closing shot stops matching the opening one.

---

# TITLE SCREEN

**One element.** The lit windows in the town — `pulse`, warm ramp, 0.3 Hz, heavily phase-offset per window so a few breathe out of step. Nothing else moves.

Reason: a still title screen with no music reads as a screenshot. Until the score exists, this is the only thing telling a player the game is running.

---

# IMPLEMENTATION NOTES

1. **Reserve cycled index ranges at composition time.** The build fails if a reserved range appears outside its declared element — otherwise a lamp ramp reused on a window frame makes the window frame flicker.
2. **Cycling is decorative and must be disableable.** An Options toggle, defaulting on. Some players find it uncomfortable, and nothing in the game depends on it.
3. **Cycling is not part of the legibility check.** Rulings 16, 17c and 18 measure the static export. A cycled range must not move a surface across a legibility boundary — check the extremes of the cycle, not the base frame.
4. **Room 33's ramp-to-zero is scripted with the audio detune automation**, not independently timed. If the score is muted, the lamp still stops.
