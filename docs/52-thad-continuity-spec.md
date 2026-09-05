# 52 · Thad — canonical continuity specification

*Written for Tyler's global protagonist audit (2026-09-04). Concise on purpose: this is the checklist a movement state is held against, not a character study. Doc 01 owns who he is; this owns what he looks like from any side, in any state.*

## The identity authority

**One drawing family, four views, mirrored for the fourth.** The standing casting stills in `reference/casting/` — `thad-stand-front-src.png`, `thad-stand-back-src.png`, `thad-stand-right-src.png`, and `thad-stand-left-src.png`, which is `thad-stand-right-src.png` mirrored (mean pixel difference 4/255) — are the identity. They are the Thad Tyler has been looking at standing in Rooms 1, 2, 3 and 5 and the profile he called convincing. `thad-walk-front-src.png` is that identity striding, head-on, and is the only movement generation the family has.

The earlier generations — `thad-profile-right-approved.png`, `thad-profile-left.png`, `thad-front.png`, `thad-back.png` — are a different drawing of the same man: wider at the shoulder, bigger in the head, shorter in the coat, different in the hair mass. They were the approved Thad when Room 1 shipped and they still drive every clip rigged from them. **They are not the identity any more**, and a clip rigged from them is a different person the moment it plays beside a clip rigged from the stills. That is the whole of what Tyler saw.

## Head
- **Size:** the head (hair top to chin) is about 27% of standing height in profile and head-on; the figure is roughly 3¾ heads tall from the crown, which is the deliberately big-headed adventure proportion, not a realistic 7½.
- **Hair silhouette:** a dark, loose, forward-falling mass; higher at the back of the crown than the front; one clean lobe over the forehead, no spikes, no parting drawn.
- **Hairline:** high; the forehead is a visible band about a third of the face.
- **Forehead:** flat, receding slightly under the fringe.
- **Nose profile:** short, straight, one pixel-step at the tip; it does not project past the hair's front lobe.
- **Chin / jaw:** a small, slightly pointed chin; the jawline is a single soft diagonal to the ear; no beard, no heavy jaw.
- **Ear:** where visible in profile, at the level of the eye line, half hidden by hair.

## Clothing
- **Coat length:** to just above the knee — the hem sits at about 69% of standing height in profile and 55–57% head-on (the head-on figures read shorter because the legs are drawn under the hem, not because the coat is shorter).
- **Coat width:** narrow; it hangs, it does not flare. Profile silhouette width is about 16% of height at the shoulder and never more than 17% anywhere.
- **Lapel / collar:** a plain turned collar, no wide lapel; a lighter shirt and a brown waistcoat show in a narrow V head-on.
- **Shoulder width:** head-on about 30% of height; sloped, not squared.
- **Waist / torso:** straight-sided under the coat; no waist definition.
- **Trousers:** dark, straight, narrow; visible only below the hem.
- **Boots / shoes:** brown, low, small; the foot is about 8% of height long in profile.

## Body
- **Head/body ratio:** ~3¾ heads (see above). This is the single most identity-carrying number: the earlier walk family is the same ratio but wider, which is why it reads as a different, heavier man rather than a different pose.
- **Shoulder/hip:** shoulders and hips the same width under the coat; the coat is a column.
- **Arm length:** hands reach mid-thigh, just below the hem.
- **Leg length:** legs are about 45% of height; the hem hides the top of them.
- **Overall build:** slight, upright, narrow. A thin man in a coat that is slightly too long for him.

## What movement may change
Limb positions, coat folds and swing, a vertical bob of at most one display pixel at 240 and proportionally more at larger drawn heights, the stance (feet apart, weight on one leg), the head turned within the glance.

## What movement may not change
Head size against body; the hair silhouette; the nose and chin profile; shoulder width; coat length and hem; torso width; foot size; the figure's overall width band. **A state that changes any of these is a different drawing, and is rejected on that ground regardless of how it animates.**

## Left / right policy
Thad has no authored asymmetry: the stand-left still is a mirror of the stand-right still. **One canonical side-facing family, mirrored deterministically for the other side.** Any future profile movement generation is made facing right and mirrored for left; two separately interpreted profile drawings are not accepted.

## Mechanically checked
`tools/check-stationary-family.mjs`: every clip that plays while he stands still (stand, idle, idle-break, recoil) is rigged from the same source as that facing's stand. The walks are reported by source on the same check and judged on the continuity sheet (`renders/thad-continuity-sheet.png`), by Tyler, not by a score.

## Walk grammar (Tyler's ruling of 2026-09-05, WITHDRAWN the same day; superseded by the authored-cycle rule below)
**Ruled and then withdrawn before the candidate was proved: the profile upper body, coat, shoulders and arms remain one intact authored silhouette while walking.** No arm is cut away from the torso, rotated, or layered over the coat; no hidden shoulder wedge; no anatomically ambitious arm swing. The legs animate beneath the coat -- separate, pass, return, alternate -- with the hip concealed, leg length, trouser width, boot size and ground contact preserved, and a restrained whole-body bob. A slightly stiff Thad who clearly remains Thad is preferable to a fluid Thad whose anatomy breaks. Lack of arm swing is not a defect.

## Walk authoring (Tyler's direction of 2026-09-05, in force)
**A profile walk is a family of complete authored poses, cropped whole.** The poses are generated together on one sheet, same identity, same baseline, no overlap, and each runtime frame is one whole figure keyed, scaled by one factor and placed on the stand canvas. No limb is cut, rotated, extended, transplanted or reattached, and no phase is manufactured by surgery; a phase the sheet did not draw is a missing frame to report, not a frame to build. Frames are chosen by quality: a malformed pose is dropped rather than repaired, and a frame is never duplicated to reach a count. The left facing is the right's frames mirrored whole. The candidate is `art/actors/thad-walk-right` / `-left` from `art/staging/thad/profile-walk-cycle-01.png` via `tools/rig/cut-cycle-sheet.py`; `visual_accepted` is unset until Tyler rules.

## Profile walk — FROZEN (owner acceptance, 2026-09-05)
**Tyler's ruling: THAD HYBRID PROFILE GAIT — VISUALLY APPROVED**, at deployed 3797684. The shipping profile walk is `art/actors/thad-walk-right` (six frames, `tools/rig/hybrid-walk.py` from `art/staging/thad/candidates/hybrid/spec.json`) and `art/actors/thad-walk-left` (the same frames mirrored whole). Each frame's upper body is one authored figure down to its own coat hem, pixel-identical: cycle-sheet poses 1, 2, 3 and opposite-half poses 2, 3. The legs are the cycle sheet's contact pose's own two legs, levelled, rooted under the coat and swung about the concealed hip, the far leg half a cycle behind. Frame order: contact A (near leg, near arm back) → transition A → pass A → contact B (far leg, near arm forward) → transition B → pass B. `strideLength` 141, two steps per cycle.

**Frozen.** Do not regenerate the profile-walk art, return to articulated-arm rigs, change an arm pose, the leg construction, the bob, the loop order, the cadence or the idle → walk → idle behaviour, or refine it further. The frame hashes of record are in `proofs/thad/profile-walk.json` §hybrid.acceptance. The walk-authoring rule above (complete authored poses, cropped whole) remains the rule for any FUTURE authored pose; the hybrid rule (authored upper bodies intact, only the legs beneath the coat constructed) is how those poses became a gait. Pace (A 1.0 / B 1.25 / C 1.5) is a separate ruling still open.

