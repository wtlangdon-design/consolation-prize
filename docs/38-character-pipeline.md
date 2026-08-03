# THE LAST CLAIM IN CONSOLATION
## The Character Pipeline

*Written immediately after rigging Hob, which took fifteen rounds. Most of them were avoidable and this document is what they bought. Companion script: `tools/rig/character.py`.*

*This supersedes nothing. It records a method that did not exist before.*

---

# PART ONE — THE METHOD, IN ORDER

## 1 · One composition master, then one character at a time

**Do not describe a character in words and hope the style matches.** Two attempts did that and both came back photographic — realistic skin texture, rendered leather, fine wrinkles — against a stylised painted plate. They read as photo cutouts standing in a painting.

**What worked:** generate one composition master containing every character in the room at once, in the room, in one image. Everything in it belongs together because it was painted in one pass. Then request each character *alone* by pointing at them in the attached master: *"the man on the left holding the lantern — draw THAT character again, alone, larger."*

The master is a **casting sheet**. It is never used as an asset. Its whole job is to fix the style and the cast, once, so every subsequent request inherits both.

## 2 · The pose spec is the rig spec

The pose is not an aesthetic choice. Every joint the rig needs must be visible as its own shape in the source art, because **no amount of detection creates separation that was never drawn.**

Binding, in every character prompt:

- Full side profile, facing frame right.
- **Mid-stride with the legs clearly apart, and a visible gap between them running all the way up to the coat hem.**
- Near arm held down and away from the body; any carried object well clear of the coat and legs.
- Far arm hanging clear of the torso.
- No part of the figure overlapping any other part.

**The stride clause is the one that was missing.** Hob's prompt said *"feet slightly apart"* and he came back with his legs touching under the coat. That single weak phrase cost the entire v3–v7 detour: the legs merged into one connected component, an attempt to split them by label produced one leg swinging as a bell, and the seam had to be fitted by regression instead of read off the picture.

## 3 · Backdrop: not green

Green keys cleanly against a coach. Against **dark blue wool it sits too close to the shadows**, and Hob's despill touched roughly 19,000 pixels. Ask for **magenta (#FF00FF)** for any character in dark or cool clothing. Nothing in this game's palette is magenta.

---

# PART TWO — THE FIVE RULES THAT COST A ROUND EACH

## R1 · The rig line is the coat hem, found by where the SINGLE-RUN block ends

Three detection attempts failed before one worked:

| Attempt | Found | Actually |
|---|---|---|
| first row where the mask splits into 2 runs | 60% | the gap between the **lantern and the body** |
| lowest row with 2 leg-width runs | 84% | **mid-shin** — cut the leg in half |
| sharpest width drop | 66% | the **lantern arm ending** |
| **end of the last sustained single-run block** | **72%** | **the coat hem** ✓ |

**Width drop is not the signal, and the doc said it was for a day.** It assumes a standing pose where the coat is wider than the legs. In the mid-stride pose this pipeline *requires*, the leg span is as wide as the coat and there is no drop at all — measured **1.54 standing, 1.09 striding**. The rule worked on the character it was derived from and failed on the very next one.

**What holds for both:** the coat is one continuous shape, and below it there are two. Find the lowest sustained stretch of single-run rows; the hem is immediately below it. This also steps over the gap a carried lantern opens higher up, which is what defeated the first two attempts.

Verify by requiring that more than half the rows below the candidate contain exactly two runs. If they do not, the legs are not separated enough to rig and the character needs regenerating.

## R2 · Pivot above the hem; draw the coat over the joint

Rotate the legs about a virtual hip roughly 14% of figure height **above** the hem, then composite the coat on top. The rotation is never visible because there is coat in front of it.

Cutting at the hem and rotating about the hem produces the failure the project owner named exactly: *"he splits at the waist like he's being cut in half."*

Every character in this game wears a long coat. This works for all of them.

## R3 · Split the legs by seam, and only reassign SMALL strays

The legs merge into one connected component near the hem even when they separate lower down — on Hob, separate on 349 of 383 rows, merged only in the top 34.

- **Do not** assign by connected component. One blob → one leg → both legs swing together, *"like they're on a hinge."*
- **Do** fit a seam from the rows where they genuinely separate, extrapolate it up through the merged part, and split on it.
- **Then** reassign stray components **below 10% of leg mass** whole, to clean up boots the straight seam cut through. Hob had two, 1,255px and 3,020px — the *"small remnants of shoes between the shoes."*
- Applying the whole-component rule without the size limit sends the entire leg mass to one side and leaves the other empty.

## R3b · Which arm is NEAR is decided by MASS, not by side

Both arms hang clear of the torso, so across a band of rows the silhouette reads arm | coat | arm. The widest run is the coat; a narrow run outside it is an arm.

**Assigning near and far by which side of the coat a run sits on is wrong.** The near arm is drawn whole; the far one is partly behind the body and carries far less — on Thad, **31,302px against 11,748**. Assigning by side inverted them, so the fully drawn arm went behind the coat and the half-hidden one in front of it.

Draw order follows from the assignment: **far arm → coat → near arm.** The far arm then passes out of sight at the back of the stride, which is what it should do. Give it almost no elbow — it is mostly occluded anyway — and the near arm a full one.

## R3c · Auto-detection under-captures limbs. Paint the mask.

**This is the rule that closed the longest failure of the session.** Automatic segmentation can only see the part of a limb that clears the torso as its own run. On Thad that was **11,748px of a 27,535px arm — 43%**. Rotating that sliver while the rest stayed welded to the coat is exactly what reads as a hinge at the wrist, and three attempts at moving the joint could not fix it because the joint was never the problem.

**`tools/rig/mark-the-arm.html`** loads the figure on a canvas, the limb is painted by hand, and it emits an `ARMMASK` code that `character.py` takes via `--near-mask` / `--far-mask`. Thirty seconds of painting beats any amount of detection, and it will under-capture on every character whose arm rests near their coat.

## R3d · Head-on views need a different operation, not different numbers

**Rotation is wrong facing the viewer.** A leg swinging forward does not move sideways — it moves closer, which projects as a downward shift and a slight enlargement. Applying the profile rig head-on made the legs cross and the arms bounce out to the sides.

`--view headon` shifts and scales limbs toward and away from the camera instead of rotating them. Arms shift only — **do not scale them**, it distorts the hands.

**The hem rule broke three times, once per view it had not seen:**

| Rule | Assumed | Broke on |
|---|---|---|
| sharpest width drop | the coat is wider than the legs | a mid-stride pose: 1.54 standing, **1.09 striding** |
| end of the last single-run block | the coat reads as ONE run | head-on, where both arms clear the body and it reads arm-coat-arm — found the **feet crossing at 90%** |
| sustained band of two similar-width runs | — | a **lantern beside the torso** is also two runs of acceptable ratio |

What holds for all five sources: two runs, **similar width, and both narrow** relative to the figure's widest row. 57.3 / 62.4 / 65.3 / 64.3 / 70.6%.

**Each rule looked correct on the character it was derived from.** Test a new detection rule against every source before believing it.

## R3e · Do not invent what is not in the source art

Cutting the arms out of the coat leaves a hole; a shifted arm does not fully cover its own hole, so an edge shows behind it and the elbow gap opens. **Two attempts to fill that hole both made it worse:**

- nearest-colour fill — smeared the whole region flat
- row-wise copy from the nearest coat pixel — pulled dark pixels into rectangular blocks

They fail for the same reason: **there is no coat behind the arm in the source image.** Anything invented there is a guess, and a wrong guess is more visible than the gap.

**The fix is upstream.** Generate head-on views with the arms held further out from the body, so real coat exists behind them and nothing needs inventing. One regeneration beats any amount of inpainting.

## R3f · A limb belongs to exactly ONE layer, and the subtraction must run FIRST

A painted arm mask reaches below the coat hem — Thad's hands by 22px — so **1,576 hand pixels were being assigned to the near leg**. They moved with the stride, and `extend_up` replicated those skin-coloured rows upward. That was the hand stretching and the colour flashing, through five attempted fixes aimed at the arms, the resampling and the coat.

**Subtract the arms from the leg masks before the leg layers are built.** Doing it afterwards changes nothing and looks exactly like a fix.

**Verification that actually works:** count skin-coloured pixels per frame. If any skin changes shape, the spread is non-zero. It went 33,897–36,359 broken, and **0 across all eight frames** correct. One command, and it should have been written at the first report of flashing rather than the fifth.

## R3g · Verify that a change TOOK EFFECT, not that it exists

Three separate failures in one session, all the same shape:

- the arm subtraction ran *after* the layers were built
- the head-on branch moved arms by the leg's displacement and never read `--arm-swing`, so setting it to zero did nothing
- a filmstrip was regenerated and then the *stale* one presented alongside it

Each was reported as fixed on the strength of reading the code. **Measure the output.**

## R4 · Premultiply before every rotate, resize and composite

**Three separate defects had this one cause.** Transparent pixels are stored as black, so any interpolation near an edge averages visible colour toward black — or, with a green backdrop, toward green.

```
green fringe on the coach cut     -> resized RGB with green still in it
dark rim around Hob              -> rotated and resized RGBA unpremultiplied
dark edge on paste               -> composited with a hard alpha threshold
```

Always: multiply RGB by alpha → transform → divide back. And **bleed the edge colour a few pixels outward past the silhouette** before any transform, so the interpolator never samples empty space at all.

## R4b · Record the facing; do not remember it

`rig.json` carries `facing` and `walk_dx`. Translating a character the wrong way was got wrong on **both** characters — a figure walking backwards through the scene, twice. Anything that is got wrong twice belongs in the data, not in someone's head.

## R5a · Write frames at twice the drawn size, not at source size

The rig wrote frames at full generation resolution — figures around 1580px, drawn at 240. **Six times linear, thirty-six times the pixels anything can ever show.** `art/actors/` reached 71.8 MB, all of it downloaded before the first frame renders and resampled away on first use.

Measured on the deployed build: 15 seconds to first draw from local disk, and nothing within 30 seconds at 20 Mbps.

**Write at 2× the largest drawn height** — 263px in Room 1's near zone, so 526. That is 12.6 MB, 82% smaller, and every clip still draws at 240 exactly. The 2× is resampling headroom, not detail nobody sees.

Full-resolution generations stay in `reference/casting/` where the rig can re-derive from them.

## R5b · GIF is not evidence about colour either

GIF carries **256 colours for the whole frame**. A character on a full-colour plate leaves nothing for small features: Thad's collar is 109 pixels out of 360,000, so the encoder spends no palette entry on it and merges it into the nearest frequent colour — **his face**. Measured: cream (211,197,156) in the PNG, skin (209,153,96) in the GIF, same frame.

**PNG contact sheets for anything where colour matters. GIF only for motion.**

*This is the second preview artifact diagnosed as an art problem in one session — the first was GIF's 1-bit alpha producing a dark rim. Both times the sprite was correct and the preview was not.*

## R5c · Check geometry before declaring something impossible

The collar was declared unrecoverable at 233px on the strength of counting threshold hits across four resize filters. It is **14 × 17 display pixels with strokes up to 4.7 wide** — not remotely sub-pixel, and perfectly legible in PNG. Measure the feature before concluding the resolution cannot hold it.

## R5d · THE CAPTURE IS NOT THE RENDER

The general rule the other three are instances of. **Before reporting anything about a frame, verify the capture path independently of the frame's content.**

**The case that produced it.** A headless screenshot of the running game came back **pure black** — every pixel, 1920 × 1080. No console error, no page error, and every piece of state correct: room `stage_road`, actor height 205, canvas 1920 × 1080, textures loaded, the plate reporting its real size. The obvious report was *the game renders black*, and every decision after it would have been made against that.

It was a **WebGL capture artifact**. A Phaser canvas runs without `preserveDrawingBuffer`, so the drawing buffer is cleared once composited and reads back empty. The game was drawing correctly the whole time.

**The check that caught it, and it is the pattern.** Sample the thing the renderer actually writes into, not the thing the browser hands back. The engine composes every frame into one canvas texture; reading it gave **1,662 of 2,079 sampled pixels carrying Room 1's night blues** — (2,12,56), (1,11,61), (0,12,63) — against a capture that claimed the frame was empty. Two sources disagreeing is the finding; one source agreeing with itself is not evidence.

Frames for review are therefore dumped from the screen texture rather than screenshotted, and a frame is sanity-checked by **distinct colour count** before anything is concluded from it: 83,802 for a real Room 1 render, 1 for a black one.

**Why this is Part Two and not a footnote.** It is the third time a preview format has been mistaken for the thing it previews. GIF's 1-bit alpha produced a dark rim that cost two rounds inside a sprite that was correct (R5). GIF's 256-colour palette turned a collar to skin and produced a statement to the project owner that the collar could not survive at that resolution (R5b). Both times the art was right and the viewer was wrong. **The failure mode is not GIF. It is trusting a rendering of a rendering.**

**And the apparatus is a thing that can silently not run.** The same session produced the rule at one remove. A defect's mechanism was declared "not established" after instrumenting the game loop from the page and observing nothing — but the instrumentation had never executed, because Phaser does not dispatch through an overridden instance property. **An experiment that did not happen returns "no effect", and "no effect" is indistinguishable from a real null.** The conclusion drawn was that the cause could not be found; the cause was four lines away and the wrapper was simply never called.

> **Verify the apparatus before trusting the null.** Make the instrument prove it fired — a counter, a marker, a deliberately-triggered positive — before any absence it reports is treated as a finding. A measurement that reports nothing has two explanations and only one of them is about the thing being measured.

## R5e · A CHECK MUST NOT SHARE ITS SUBJECT'S ASSUMPTIONS

R5d is about not trusting a rendering of a rendering. This is the same error one level up: **do not trust a check that was written from the same understanding as the thing it checks.**

**A check that shares its subject's field knowledge agrees with it about a field neither of them knows exists.**

**The case that produced it.** Hob's actor record parsed. His art was on disk. `check-actor-clips` passed, `check-asset-paths` passed, the record's clips and facings and figure heights were all correct — and he drew nothing, because the loader asked for the protagonist's frames and no others. Every artefact any check looked at was right. The gap was in what nothing looked at: **declared, valid, and never loaded.** Three separate checks, all green, on a tree where a character could not appear.

**The fix is enumerate independently.** `tools/check-boot-assets.mjs` finds every declared image by walking the content records generically — a regex for anything shaped like an asset path — rather than by calling the loader's own field-by-field helper. The next `"image"` somebody adds to a schema is found by the regex, not by anybody remembering to update two places. Had it asked the loader what images exist, it would have been told exactly what the loader already knew, which was the bug.

**And a check is not proven by passing.** It is proven by being made to fail on the real defect. Reverting the loader to load only the protagonist made it fail **by name, on all 13 of Hob's frames**. A check nobody has watched fail is a check nobody has tested — the same rule as R5d's apparatus clause, applied to validation instead of instrumentation.

> **Enumerate from a different direction than the code you are checking, then break the code and watch the check catch it.** A green check that has only ever been green is an assertion about nothing.

## R5f · A FALLBACK TO ANOTHER ENTITY'S DATA IS ALWAYS A BUG

R5e is about a check sharing its subject's assumptions. This is the same error inside the code itself: **an engine decision must trace to a field on the thing it is deciding about, or to a named constant. Nothing else.**

A fallback to a literal says *nobody told me, here is the standard answer*. A fallback to another entity's field says *nobody told me, I will use somebody else's answer* — and that is **silent by construction**, because somebody else's answer always has the right type, the right magnitude, and comes from a record that is correct about itself.

**The case.** `Actor`'s height fell through to `state.content.actor.height`. The coach asked how tall it was, its own record was never consulted, and the engine answered with the protagonist's 240 against art of 389. The record was right. The generator was right. Every check was green. A stagecoach drew with its roof at a man's head height and nothing anywhere was wrong.

**The same shape, three times in one session:** a stale actor record answered for frames it no longer described; `FIXED_HEIGHT` was correct and unreachable because the engine had no field to ask; and `scalesWithDepth` did not exist, so *unrouted* stood in for *not a person*. Each time a generator knew something the engine could not, and each time the hole was filled by the most plausible thing to hand.

> **Enforced as far as a machine can hold it** by `tools/check-entity-fallback.mjs`, which flags any fallback reading the singular `content.actor`. It had to learn two evasions to be worth anything: a bare identifier assigned from that record, and a read already wrapped in its own tidy `?? ''`. Both were live in the tree.

## R5 · Never preview through GIF with alpha

GIF carries **1-bit** transparency. Every soft edge must snap to fully opaque or fully clear, and the ones that snap opaque keep whatever darkened colour they were blended toward.

**Flatten every preview frame onto an opaque background before encoding.** Two rounds were spent fixing a sprite that was already correct, because the artifact was in the preview encoder rather than in the art.

**None of this arises in the game.** Phaser composites RGBA directly.

---

# PART THREE — THE NUMBERS, FROM HOB

Starting points for the next character, not laws.

| Quantity | Value |
|---|---|
| Source figure | 647 × 1366 px on a keyed backdrop |
| Coat hem | **72%** of figure height |
| Virtual hip pivot | hem − **14%** of figure height |
| Canvas padding | **260px** each side, **60px** below |
| Measured foot travel past the standing silhouette | **116px** — *measure it, don't guess it* |
| Hip swing, 8 frames | 14, 10, 0, −10, −14, −10, 0, 10 degrees |
| Leg mass after split | 46,445 / 42,343 px — should be roughly symmetric |
| Final height on the plate | **233px**, ≈27% of an 864-tall play area |
| Arm swing, profile | **0.55** of the hip angle |
| Arm swing, head-on | **0.20** — a front-view arm barely moves at this size |
| Head-on limb travel | 3% of figure height, no scaling on arms |

**Measure the foot travel and set the padding from it.** Guessing at 70px sheared the heel off at full extension.

---

# PART FOUR — WHAT IS STILL MISSING

The rig is legs only. Everything below is unbuilt.

- **Foot planting.** The figure translates at a constant rate regardless of which foot is down, so the feet skate. Drive translation from the contact foot instead. **This is the largest remaining defect.**
- **Arm swing and carried-object sway.** The lantern is currently welded to the body.
- **Coat movement.** The hem should trail the stride.
- **Knees.** Attempted once and rejected as worse. A shin that lags its thigh is most of what separates a walk from a mannequin, but the first attempt over-bent. Revisit with a much smaller lag.
- **The other three facings.** Front, back, and the opposite profile. The alternate take rejected for the walk is most of a front-facing pose already.
- **Scale by depth.** 233px is the height *at a stated depth*, not the character's size. Each room needs a scale curve.

---

# PART FIVE — WHAT THIS COSTS PER CHARACTER, NOW

With the prompt corrected and the script written:

1. Point at the character in the composition master. **One generation.**
2. Run `tools/rig/character.py`. Key, despill, bleed, find hem, split legs, extend under the coat, emit eight frames.
3. Paint the arms in `mark-the-arm.html` and re-run with `--near-mask` / `--far-mask`. Assume this is needed; auto-detection under-captures.
4. Inspect and adjust the hip and arm angles.

## A process note, recorded because it cost more than any single bug

The script was edited through a dozen fragile string-replacement passes. By the end it carried **178 lines of uncommitted divergence** and constants that had no business existing, and I could no longer tell what was in it — briefly believing another author had touched the file. It was reset to the last commit and rewritten once, deliberately, after reading it.

**Edit this file by reading it, not by pattern-matching into it.** Two separate string replacements also failed silently on mismatched anchors earlier in the same session and were reported as successful.

The fifteen rounds were: two style failures, three hem-detection failures, one leg-split failure, one knee experiment, one direction error, and two preview-encoding failures. **Every one of them is closed by a rule above.**
