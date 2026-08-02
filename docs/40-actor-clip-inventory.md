# THE ACTOR CLIP INVENTORY
## Everything every character has to be able to do

*Derived from `content/actors/thad.json`, the nine verbs in `content/ui/verbs.json`, doc 17's staging and doc 22's chore contract. Written because the list was being discovered one clip at a time, which is not the project owner's job.*

---

# PART ONE — THE CANONICAL SET

`thad.json` declares three clips per facing, and doc 22 states the contract they sit in: **every chore must settle cleanly into a directional idle.** Idle is therefore not decoration; it is the rest state everything else returns to.

| Clip | Frames | Rate | What it is | Status |
|---|---|---|---|---|
| **walk** | 8 | 8.0/s | Locomotion | ✅ four facings |
| **idle** | 6 | 2.4/s | Standing, breathing. The rest state | ✅ four facings |
| **recoil** | 4 | 7.0/s | Reacting to something | ❌ |
| **idle-break** | 12 | ~2/s | A glance left then right, played occasionally | ✅ four facings |

**idle-break is not in the actor record.** It was added because pure breathing reads as *too* still — a character who stands perfectly motionless for more than a few seconds looks switched off. It plays on a timer while idle and returns to it. The record needs a clip entry for it.

**Four facings each: front, back, left, right.** Errata 50 forbids runtime mirroring — costume asymmetry and lighting make a flipped sprite dishonest.

**12 clips per character. 8 exist for Thad.**

---

# PART TWO — WHAT THE VERBS REQUIRE

Nine verbs are live. They do not each need their own clip, but they do not collapse to none either.

| Verb | Needs | Notes |
|---|---|---|
| `WALK_TO` | walk | ✅ |
| `LOOK_AT` | idle | The line carries it; no clip |
| `LISTEN_TO` | idle | As above |
| `TALK_TO` | **talk** | Doc 35's sprite manifest lists it; `thad.json` does not. **Contradiction — needs a ruling** |
| `PICK_UP` | **pickup** | A reach-and-take, settling back to idle |
| `OPEN` / `CLOSE` | **reach** | One clip can serve both |
| `PUSH` / `PULL` | **reach** | Same clip, probably |
| — | **recoil** | Declared in the record, driven by content rather than a verb |

**Minimum additional set: recoil, pickup, reach.** Plus talk, once the contradiction is settled.

---

# PART THREE — WHAT DOC 17 REQUIRES OF THAD SPECIFICALLY

One-shot staging, not loops. These are Thad's alone and no other character needs them.

- **Climbs down from the coach** (beat 2)
- **Straightens his coat** (beat 2)
- **Looks at the town** (beat 2) — probably a facing change into idle rather than a clip
- **Picks the case out of the mud** (beat 6) — the `pickup` clip above

---

# PART FOUR — THE FULL COUNT

| | Per character | Thad |
|---|---|---|
| walk × 4 | 4 | ✅ 4 |
| idle × 4 | 4 | ✅ 4 |
| recoil × 4 | 4 | ❌ 0 |
| pickup | 1–4 | ❌ 0 |
| reach | 1–4 | ❌ 0 |
| talk | 0–4 | unresolved |
| **one-shot staging** | 0 | ❌ 2 (climb down, straighten coat) |

**Thad: 8 of roughly 20 done.** Background characters need far fewer — errata 50 says a room is satisfied by one or more calm persistent performances, not by every figure looping.

---

# PART FIVE — OPEN QUESTIONS THIS RAISES

**Q7 · Does `talk` exist?** Doc 35's sprite manifest lists it. `thad.json` does not declare it. One of the two is wrong.

**Q8 · Do `pickup` and `reach` need all four facings?** A pickup seen from behind is nearly invisible. Two facings may be enough, which halves the work across 27 characters.

**Q9 · `thad.json` still describes the voided spec.** It declares two drawn sizes, a decimation threshold of 30, and `40px` character height — all voided by errata 54. The file needs rewriting for 233px and depth scaling regardless of any new clip.

**Q10 · Surface variants.** The record declares mud and boardwalk variants of every clip, doubling the count. That was a footstep-appearance decision under the old spec. Whether it survives errata 54 is unresolved — and it is the difference between 12 and 24 clips per character.

---

# HOW CLIPS ARE MADE

`tools/rig/character.py`, one generation per facing, then:

```
--clip walk    8 frames   legs swing, arms counter-swing
--clip idle    6 frames   legs planted, everything above the hem breathes
```

Idle amplitude is 0.5% of figure height — about 8px at source, **1.2px on screen** at 233px. Smaller than that and it vanishes entirely.

## Two rules idle taught

**Never move anything by less than one DISPLAY pixel.** A sub-display-pixel shift is not a small motion, it is a resampling artifact: the downscale blends neighbouring colours differently every frame. On Thad it put skin tone on his pale collar. Quantise every offset to multiples of `figure_height / 233`.

**The head does not move when breathing.** Raising the chest is right; bobbing the head is not, and it smears any small high-contrast feature near the face — a collar, a badge, an earring — against skin. Split at 30% of figure height and hold everything above it still.

**Verify with the skin-pixel count.** If any skin-coloured region changes shape between frames the spread is non-zero; a correct clip reads 0. That check is what finally caught the hands being assigned to the leg layer.
