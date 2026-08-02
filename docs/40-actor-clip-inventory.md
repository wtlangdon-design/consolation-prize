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

**idle-break is view-dependent.** Head-on it is a glance aside; in profile it is a **shoulder shrug**. The same horizontal head move that reads as a glance facing the viewer slides the head forward and off the neck in profile, which nobody does. A profile head *turn* would need art that does not exist.

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

# PART SIX — THE COSTUME CONTRACT

*Folded in from an external costume specification. **Its technical art contract is discarded** — 320 × 144, 40px actors, 200 source pixels at 5×, the five-pixel grid, nearest-neighbour only, the locked 256-colour palette, and the two drawn tiers with a 32px switch are all voided by errata 54. What follows is what survives that, plus reconciliation with what is already built.*

## The vocabulary, settled

Three documents used three sets of words for the same things. This is the set:

| Term | What it is | Frames | Status |
|---|---|---|---|
| `stand` | The return pose. Indefinite hold. Every clip resolves to it | 1 | **free — frame 0 of idle** |
| `idle` | A breathing loop, played while standing | 6 | ✅ four facings |
| `idle-break` | An occasional one-shot: glance head-on, shrug in profile | 12 | ✅ four facings |
| `walk` | Locomotion | 8 | ✅ four facings |
| `recoil` | Startle, declared by the actor record | 4 | ❌ |

The external spec had `stand` as an indefinite hold and `idle` as an occasional one-shot, with nothing between. **At 233px a completely static figure reads as switched off** — the project owner said so directly. So the breathing loop stays as the ordinary standing state, and `idle-break` is the occasional one-shot. `stand` remains as the single settled frame every chore returns to.

## Arbitration — one owner at a time

Only one system drives the body:

1. atomic or custom chore
2. scripted cutscene locomotion
3. player locomotion
4. stand
5. idle

**Talk is a head overlay, not a body owner**, and may coexist with stand. A held prop is an attachment layer and never becomes a second body owner.

This is `BODY_ONE_OWNER` in `engine/core/Assertions.ts` stated as a policy. The guard enforces it; this is the order it enforces.

## Chore markers — the part worth the most

Every chore declares named markers, never a magic frame number:

```
begin      actor control locks
contact    sound and visible object reaction may occur
commit     the puzzle/inventory transaction becomes durable
recover    actor returns toward neutral
complete   handle resolves, stand resumes
```

`contact` and `commit` may share a frame but stay separate events.

**On skip:** before `commit`, fast-forward to the commit pose, apply the transaction exactly once, recover. After `commit`, never replay the mutation. A skipped chore may shorten visually but must never leave the actor, inventory, room object or save coordinator half-committed.

This is doc 34 step C's territory and it belongs to the engine, not the art.

## Facing — no turn frames

- Direction changes **snap**; there is no turn animation and none should be commissioned.
- Switching directional walk clips **preserves gait phase** — do not reset it at path corners.
- Diagonals use the dominant screen axis. No diagonal art exists.
- Hold the last facing until the other axis exceeds it by **20%**, so facing does not chatter at corners.

## Anchor and root motion

- The **feet anchor** is the actor's world position and its z-sort key. Never the sprite rectangle, never its top or centre.
- Frames never supply root motion. Translation comes from the movement system.
- Hat, hem, hands and feet may animate; the anchor may not drift.
- Gait phase advances from **distance travelled**, not wall-clock time.

## Sockets and props

Every frame carries attachment points for `left_hand`, `right_hand` and `mouth`, even where unused. **The case is a separate prop sprite attached to a socket** — it is never painted into body frames. `contact` attaches it; `commit` changes ownership once.

**Carrying is an unresolved binding choice** (Q11): either the case vanishes into inventory on pickup, or a separate `carry` locomotion family exists. The second costs a full stand-plus-walk set in four facings and cannot be faked by reusing the ordinary walk.

## Talk

Body holds the stand frame; a direction-specific head overlay loops while text is visible. Frame order irregularised so it does not look mechanical. **Talk timing never controls line duration** — the dialogue system owns that. Skipping a line ends the overlay immediately and restores the identical stand frame.

If a head overlay is not available, export full-body talk frames whose body pixels are **byte-identical** to stand.

## What not to build

Eight-direction or diagonal cycles · turn-in-place · walk-start and walk-stop clips · running or sneaking · a blink system · unique wrong-action animation per hotspot · case art painted into body frames · mirrored left/right art · physics coat tails.

**And: AI generation proposes a key pose; it is never the source of truth for in-betweens.** Independent generations drift in face, height, hem, limb length and lighting. This is what `tools/rig/character.py` exists for — one generated pose per facing, every frame derived from it.

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
