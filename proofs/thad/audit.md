# Thad — global character + locomotion audit

*Tyler's manual Room 5 playthrough, 2026-09-04. Worked on `claude/last-claim-autonomy-audit-v3vsy6` from a clean tree at 055be41. Companion records: `proofs/thad/locomotion.json` (every measured leg), `proofs/thad/inventory.json` (every clip and its source), `renders/thad-family-current.png`, `renders/thad-continuity-sheet.png`, `renders/thad-idle-walk-idle-live.png`, the frame logs under `renders/proofs/*/stationary/`, `startstop/`, `profile-walk/`. Spec: `docs/52-thad-continuity-spec.md`. Issue: doc 36 Q107.*

## 1. Inventory and ancestry

Thad has 33 runtime clips in `art/actors/thad-*`, each with a `rig.json` naming its source. They fall into exactly two casting families:

| Family | Sources | Clips rigged from it |
|---|---|---|
| **A · the standing stills** (Q77's batch; figure ~625 px) | `thad-stand-front-src.png`, `thad-stand-back-src.png`, `thad-stand-right-src.png`, `thad-stand-left-src.png` (= right mirrored, pixel difference 4/255), `thad-walk-front-src.png` | stand ×4, idle ×4, idle-break left/right, recoil left/right, walk-front |
| **B · the earlier generations** (figure 526 px) | `thad-profile-right-approved.png`, `thad-profile-left.png` (a separate generation, not a mirror), `thad-front.png`, `thad-back.png` | walk-right, walk-left, walk-back, idle-break front/back, recoil front/back, farwalk-back (derived from walk-back), lookup, and every chore clip (use-near, give-offer, shrug, pickup-low, carry, alight/aboard-coach, tug, strain, wrench) |

Measured at one displayed height, family B is a different drawing of the same man: profile shoulder width 23% of height against A's 16%, coat hem at 55–65% against 69%, a larger head mass, a heavier jaw. **The stationary side profile (A) and the side walk (B) are from different generations. So are the back stand (A) and the back walk (B). Front stand and front walk are both A.**

Every room uses the same actor record; no room declares its own Thad or its own speed.

## 2. The stationary mid-stride frame — root cause and fix

`thad-idlebreak-back` was rigged from `thad-back.png` with `--pose striding`. Its twelve frames are the family-B figure standing mid-step (legs apart, one heel lifted) with the head glancing aside. `Actor.clip` plays `idle-break` on a randomised timer 7–18 s after he stops (`IDLE_BREAK_MIN_GAP`, `IDLE_BREAK_SPREAD`), for six seconds, then returns to idle. Facing the counter he faces **back**, so every idle break swapped him for a different drawing of a man mid-stride, then swapped him back. The state machine was correct throughout; the frame ownership was wrong. Global, not Room 5: any room where he stands facing back or front.

Fix: `idlebreak-front`, `idlebreak-back`, `recoil-front`, `recoil-back` re-rigged from the standing stills with the standard tool (`tools/rig/character.py --clip idle-break|recoil --view headon`), `walk-back` re-rigged from `thad-stand-back-src.png` with them and `farwalk-back` re-derived from it (`tools/rig/far_blob.py`), the actor record rebuilt (`tools/build-actor-record.mjs`). Two rig faults fixed on the way: the head-on recoil shifted the upper body with a wrapping `np.roll` (the head's top rows reappeared under the soles, 65 px below the feet on a 625 px figure), and the despill left half-spilled pixels over the fringe check's line. New validator `tools/check-stationary-family.mjs`: every clip that plays while standing still must name its facing's stand source; it failed on exactly the four offenders and passes now.

## 3. Locomotion — measurement, equation, classification

Measured live with the harness trace (1 Hz while `moving`; first and last partial seconds truncated, so the numbers read a little low) and confirmed at 100 ms by `frames.mjs`:

| Room | Drawn height | Before px/s | Before body-heights/s | Before strides/s | After px/s | After heights/s |
|---|---|---|---|---|---|---|
| Room 1 (stage_road) | 242–261 | 150–185 | 0.57–0.76 | 1.35–1.8 | 150–204 (unchanged) | 0.57–0.84 |
| Main Street | 111–195 | 154 (194 declared) | 1.03 | 2.4 | 96–119 | 0.61–0.86 |
| Bountiful Nugget | 228–446 | 124–172 | 0.28–0.73 | 0.65–1.7 | 93–296 | 0.21–0.86 |
| Room 5 (night) | 472–559 | 169–185 | **0.36** | **0.85** | 266–354 (416 by the equation) | 0.56–0.69 |

**The equation.** `Actor.advanceWalk` stepped `walkSpeed / 60` pixels per tick, time-based, as **screen** pixels at every drawn height. The gait advances from distance over a stride of `0.425 × drawn height`, capped at 2.6 strides/s. So screen speed was constant, body speed fell as he grew, and the leg rate fell with it: Room 5's 515 px Thad covered 0.36 of himself a second at 0.85 strides/s, half of Room 1's 0.77 and 1.8. Nothing room-specific: no multiplier, no walk-box effect, no path or approach effect; the depth model is correct (the scale route proved the curve, `proofs/room-05/live-scale.json`). The traced path (`advancePath`) already walked in `ds / height` for exactly this reason.

**Classification: A — global locomotion calibration**, with the cadence mismatch (C) as its consequence: one cause, two symptoms. Not B: Room 5's data is right. The Room 5 scale correction did not create the fault; it exposed a rule that had been wrong since the curve existed, at a height where it finally showed.

**Fix.** The declared 194 px/s is now his pace at the record's 240 px and scales with the drawn height (`speed × height / 240`). Room 1 is unchanged to the pixel. Strides per second is now 1.9 everywhere. `?pace=` (`engine/dev/Pace.ts`, dev-only, ignored when absent) multiplies the pace and the stride cap together so three candidates can be felt on one build.

**The taste question that remains.** Room 1's approved pace, 0.81 heights/s, is what every room now inherits. On Main Street that is 85–166 px/s (its figures are small), against 194 before. Whether that reads as perspective or as slow is Tyler's call; the A/B/C runtime comparison below exists for it.

## 4. Profile walk — STOP (art portion)

`CURRENT THAD MOVEMENT ASSETS CANNOT BE BROUGHT INTO CANONICAL CONTINUITY WITHOUT NEW CHARACTER ART` — for the profile walks only.

- **States requiring replacement:** `walk-right` and `walk-left` (and, to be fully one family, the profile chore clips: use-near, give-offer, shrug, pickup-low, carry, alight/aboard-coach, lookup).
- **Why existing pixels are insufficient:** the standing profile still has the legs together and the arms against the coat. `character.py` finds no hem to split ("no hem found — below the coat there must be two legs of roughly equal width") and no arm to swing ("arms: not separable"). A profile walk needs a far leg and a swinging arm that the still does not contain; drawing them is new art. Transplanting the still's head onto the family-B walk body was rejected: the proportions differ (shoulders 23% vs 16% of height) and the join reads as a paste.
- **Minimum useful image operation (one):** the family-A identity **striding, facing right, in profile, on magenta**, legs apart with background between them and both arms clear of the coat — the pose `character.py` rigs. One generation yields walk-right by rigging and walk-left by mirroring (the still family has no authored asymmetry), and is the source every profile chore can be re-rigged from later.
- **References to transmit:** `thad-stand-right-src.png` (the identity, profile), `thad-stand-front-src.png` and `thad-stand-back-src.png` (the same man head-on), `thad-walk-front-src.png` (the same man striding, head-on: the gait's shape), and `docs/52-thad-continuity-spec.md`'s numbers in the prompt.
- **No API call was made.**

Until then walk-right and walk-left ship as they are (byte-identical on the continuity sheet's Row B), and Tyler sees the same swap he reported when Thad walks sideways.

## 5. Regression — the frame logs (`tools/gauntlet/frames.mjs`, probe polled every 100 ms)

| Run | Duration | Frame changes | Idle breaks played | Locomotion frames while stationary |
|---|---|---|---|---|
| Room 5, stationary facing the counter, 64 s | 177 s incl. entry | 74 | 3 (`thad-idlebreak-back`, the re-rigged standing glance) | **0** |
| Room 5, six click-walks + four hotspot approaches with final facing | 195 s | 234 | 0 | **0**; 10 stops, every stop's first frame an `idle` frame in the arrival facing (right, left, front, back, right, front, front, back, back, back) |
| Room 1, 30 s still | 81 s | 31 | yes | **0** |
| Main Street, 30 s still | 132 s | 141 | yes | **0** |
| Nugget, 30 s still | 156 s | 29 | yes | **0** |

Cadence, live: during the Room 5 profile walk the frame log shows the walk cycle completing every 0.55–0.6 s (1.7–1.8 cycles/s) at 430 px/s — feet and ground agree, as the equation says they must.

Validators: `npm run validate` 48 of 49 green (the one failure is the pre-existing flag-order finding on ACT / T_RACCOON_NAMED, ruled out of scope); `npm test` 169 pass; typecheck clean. New: `check-stationary-family` (fails the old tree on exactly the four offending clips, passes now).
