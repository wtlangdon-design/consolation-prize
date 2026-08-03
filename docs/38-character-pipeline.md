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

### 2× IS A CEILING, NOT A TARGET — the coach broke it and reproduced the fault

**R5a is a rule about total bytes in the boot set, and it was written as a rule about a multiplier.** For a 240px man those are the same rule. For a 956px stagecoach they are not, and following the multiplier reproduced exactly the problem the multiplier exists to prevent.

The coach's idle went to 24 frames when the door-open clip turned out to have **one** — see below — and at 2× that is a 1912px-wide sheet: **26 MB a clip, ~70 MB across three, all of it in the REQUIRED boot set.** That is the 71.8 MB this rule was written to fix, arrived at by obeying it.

**The bound is the budget, and the multiplier is how you usually hit it.** The coach is at **1.15×** now — still resampled, still nothing sharpened out of nothing, at a third of the pixels. Nothing about the drawn image changed.

Why a wide object can afford less headroom: resampling headroom guards against *upscaling* at the largest size an object is ever drawn, and a stagecoach is drawn once, at one depth, at a size fixed by the room. A man is drawn at every depth in the band, from far up the road to the front of frame, and 2× is protecting the near end of that range. **Headroom scales with how much an object's drawn size varies, not with how big it is.**

> **Write at 2× the largest drawn height, or as much less as the boot budget requires — whichever binds first.** A clip that is only ever drawn at one size needs almost none. State the actual multiplier next to the art, because the next person will read "2×" as the rule and reproduce the 70 MB.

**And the fault that surfaced it is worth its own line: THE DOOR-OPEN CLIP HAD ONE FRAME.** The door opens at beat 2 and stays open through beat 6, so the coach was a **still photograph for the entire conversation** — no lamps, no horses, no driver's hands. Every frame of animation was on the shut-door clip, which is on screen for about a tenth of a second. **Animation lives on the clip that is on screen, and which clip that is is a question about the script, not about which one is the default.**

## R5b · GIF is not evidence about colour either

GIF carries **256 colours for the whole frame**. A character on a full-colour plate leaves nothing for small features: Thad's collar is 109 pixels out of 360,000, so the encoder spends no palette entry on it and merges it into the nearest frequent colour — **his face**. Measured: cream (211,197,156) in the PNG, skin (209,153,96) in the GIF, same frame.

**PNG contact sheets for anything where colour matters. GIF only for motion.**

*This is the second preview artifact diagnosed as an art problem in one session — the first was GIF's 1-bit alpha producing a dark rim. Both times the sprite was correct and the preview was not.*

## R5b2 · A THUMBNAIL IS NOT EVIDENCE ABOUT FACING, AND NEITHER IS A METRIC INVENTED TO REPLACE THE EYEBALL

R5b says GIF is not evidence about colour. This is the same failure at a different variable, and it happened twice in five minutes on the same question: **which way is this sprite facing?**

**First, a four-up thumbnail sheet** of `stand-left`, `stand-right`, `walk-right`, `walk-left`, each about 230px tall, read as *all four face left* — which would have meant every right-facing directory in the repository held mirrored art, and would have sent two people into the rig pipeline for nothing. At that size the head is roughly 14 × 17 display pixels and the hair mass reads as the silhouette. **The face is the evidence and it is a dozen pixels wide.**

**Then a metric invented on the spot to settle it** — the horizontal offset between the head band's alpha centroid and the torso's — agreed with the directory names for Thad and disagreed for Hob, and reported the coach as facing left, which is not a thing a coach does. It was measuring coat and limb mass, not a face. **A number is not more trustworthy than an eyeball merely because it is a number**; it is more trustworthy when it has been shown to separate the cases you care about, and this one never was.

**What settled it** was cropping the head band and magnifying it 3×, on screen and from the file, side by side. Unambiguous in one look: hair left and face right in `thad-idle-right`, hair right and face left in `thad-idle-left`, and the on-screen figure matching the first exactly.

> **Magnify the feature you are judging, and put the candidates next to each other.** A whole figure at draw size answers "does this look right"; it does not answer "which of these two is it". And a metric written to replace a judgement must be validated against known cases before it is believed — R5c's rule about measuring the feature, pointed at your own instrument.

*The third preview artifact diagnosed as an art problem, after GIF's 1-bit alpha and GIF's 256 colours. Every time, the art was correct and the way it was being looked at was not.*

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

> **Every one of them was a mechanism that agreed with itself until something outside it asked.**

That is the whole section in one line, and it was arrived at by counting. In a single session: a loader and three checks that all knew the same set of fields and all missed a character who was declared, valid and never loaded. A drawer that was wrong about its own vocabulary. A facing metric that disagreed with itself on two characters and was believed anyway. A beat tag that went on answering "3" after the runner had stopped, because "the last beat that played" is a defensible meaning for the field right up until something asks what is on screen now. A gauntlet whose schema, validator and engine all agreed that beats 4 to 6 were observable, and all three were wrong about the same thing. A clock divided by a thousand twice, which nothing would ever have failed on because every consumer compares it against itself.

None of those is a mistake in reasoning. Each is a closed loop that is internally consistent and has no contact with the outside. **The defect is never in the mechanism; it is in the absence of anything that could disagree with it.**

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

## R5i · A MECHANISM AGREEING WITH ITSELF IS THE FAILURE, AND IT HAS HAPPENED FOUR TIMES

Every fault below was found a different way and they are all one shape. Verbatim, because the value is in the third column being different every time:

| | agreed with itself | nothing checked it against |
|---|---|---|
| the stale actor record | `rig.json`, which the generator had just written | the frames on disk |
| the boot split | its own field-by-field helper | every declared image, found generically |
| the drawer | the steps it happened to know | the vocabulary the content actually uses |
| the key fringe | every frame the rig had ever written | the colour of the backdrop it keyed against |

Each was internally consistent and correct about everything it looked at. Each fix **enumerated from a different direction** — the PNG header, a regex over the records, the content's own `do` values, the pixels themselves.

**AND ONE OF THEM WAS CAUSED BY A GOOD RULE.** A staged `say` carries no `actor` *because* it names its line by index, which is exactly what keeps dialogue out of the staging table. The rule is right. Nobody traced what grouped-by-actor code would do with a step that has no actor, and the drawer silently dropped three of them.

> **Every constraint removes a field from somewhere, and something downstream was keying on it.** That is a different failure from an oversight, and it has a specific tell: the instinct after imposing a good rule is to feel finished. That is precisely the moment to ask what just stopped being available, and who was reading it.

## R5h · AN INSTRUMENT CAN CHANGE THE SYSTEM, NOT ONLY REPORT ON IT

R5d says the capture is not the render, and its apparatus clause says an experiment that did not happen returns "no effect". **This is the third position, and it is the one that reads as the opposite of the second.**

**A defect that disappears when the instrument comes off has TWO explanations, and only one of them is "the instrument caused it".** The other is that the instrument was a **load generator**, and removing it removed the load.

**The case.** `BODY_ONE_OWNER: thad@chore+walk` appeared while a wrapper around `drawImage` was measuring sprite sizes, and vanished when the wrapper came off. That was recorded as an artefact and reported as one. It reproduces on **every run at 5 Mbps with nothing instrumented at all** — a race between two clocks that needs one long frame, which the wrapper supplied by slowing the frame and throttling supplies by slowing the frame.

*"Only appears with the instrument attached"* was a correct observation. *"Therefore it is the instrument"* was a conclusion the evidence did not support.

> **Distinguish them by reproducing the CONDITION by other means.** Not the instrument — the condition it happened to create. A long frame, a slow disk, a cold cache, a full queue. If the defect survives a different cause of the same condition, the instrument was never the subject.

The two halves of this rule pull in opposite directions on purpose. R5d's is *do not trust a null the apparatus may have manufactured*. This one is *do not trust a null the apparatus may have manufactured by being removed*. Both are the same underlying caution: the apparatus is part of the system while it is attached, and its absence is a change too.

## R5g · A MOVER WITH NO PLACEMENT IS NOT AT THE ORIGIN

The same shape as R5f, and found by playing rather than by reading.

**The coach was only ever placed by beat 6b's `from` — the beat where it LEAVES.** Through beats 2 to 6 it stood wherever the mover happened to have been created. Thad alighted at the doorway's correct coordinates, measured against a coach at x1390, while the coach was somewhere else entirely.

**An unplaced mover is not at (0,0). It is wherever the last thing to touch it left it** — which is worse than the origin, because the origin looks like a bug and a plausible position looks deliberate. It is a **position borrowed from whatever ran last**, filled in by the most plausible thing to hand, which is R5f exactly.

> **Anything that must be somewhere needs a `move` in the EARLIEST beat it is seen, not the one where it happens to be needed.** A `from` on the beat that uses a mover says when it arrives; it says nothing about where it stood before.

## R5j · A CHECK THAT FAILS ON CORRECT WORK IS WORSE THAN NO CHECK

**R5e is the quiet error. This is the loud one, and it is the more dangerous of the two.**

R5e says a check written from its subject's understanding catches nothing — it passes, everyone believes it, and the belief closes the question. **This is the opposite failure: a check that goes red on work that is right.** It does not fail silently. It fails constantly, at people who know it is wrong, and what it teaches them is *this red line does not mean anything*. A check nobody believes has been switched off whether or not anybody edited the file, and a switched-off check catches nothing either — but it does it while still appearing in the suite.

**The case.** The exit-collision check was written as *no exit shares a rectangle with anything live at the same time*. It failed **seventeen times across six rooms** on a completely correct tree:

| Room | Exit | Overlaps |
|---|---|---|
| main_street | `to_hotel` | `boardwalk`, `false_fronts`, `mud` |
| main_street | `to_clarion` | `posted_notices`, `dog`, `false_fronts` |
| main_street | `to_assay_office` | `boardwalk`, `false_fronts` |
| main_street | `to_company` | `company_sign`, `false_fronts` |
| main_street | `to_nugget` | `false_fronts` |
| main_street | `to_claims_road` | `mud` |
| nugget, assay_office ×2, claims_registrar, thads_room | five more | scenery |

**Overlap is the composition, and the engine says so in its own words.** `GameState.targets` is `[...room.exits, ...room.hotspots]` and the comment above it reads *"scenery first made every exit in the room unclickable."* A door painted on the front of a building **belongs** inside `false_fronts`. The boardwalk and the mud run the full 1920 underneath everything. The check had mistaken the room's construction for a defect in it.

**The tell is the count.** Seventeen failures and no defects is not a check finding a lot of problems; it is a check that has misunderstood its subject. One or two would have been worth reading. Seventeen means the rule is wrong, and **a rule that is wrong seventeen times will be wrong about the eighteenth thing too — the real one.**

**What survived is narrower and both clauses are true**: a target with no pixels left after subtracting everything that answers before it, and *any* overlap where the exit carries `travelWhenTold` — because that one does not open a wrong door, it starts the closing shot. Both pass on the tree as built, and both fail on the defect that shipped.

> **Before writing a check, name the correct work it must stay quiet on.** If you cannot, you do not yet know what the rule is. And when a new check fails in bulk on existing work, the first hypothesis is that the check is wrong — not the work. R5e's remedy applies here too and in reverse: **make it fail on the real defect, then make sure it is silent on the real tree.** Neither half alone is evidence.

## R5k · A NUMBER THAT DESCRIBES SOMETHING THAT MOVED

**Derive the coordinate from the thing. Do not restate it beside the thing.**

Everything else in this project is named — beats by number, actors by id, clips by name, targets by id — and **a name survives the thing moving.** A coordinate does not. It is the only kind of value that refers to the world by position, and it is therefore the only kind that goes wrong when the world is edited, in silence, while remaining perfectly well-formed.

**Five in one session, all the same shape:**

| The number | Described | Which had |
|---|---|---|
| the gauntlet's beat-9 click | the lamp's centre | moved twice with Hob |
| `case_roof`'s rect | the case on the roof | moved with the coach |
| the `lamp` rect | Hob's lantern | stopped crossing and stood still |
| doc 43's staging tables | Thad's walk in beats 2–3 | been reversed |
| `road_west`'s note, "narrowed to 90" | the exit's width | been 150 for two changes |

**Not one of them failed a check.** Every one stayed a valid number of the right type in the right range. The gauntlet's click is the only one that produced a symptom at all, and the symptom was a beat holding to its deadline — which is that beat working exactly as designed, for a click that arrived nowhere.

**And note what the symptom was NOT.** Hob moved for good reasons both times. The content was right and the harness went red at it: **R5j's failure mode, inside the apparatus built to catch things.** A number that rots does not announce a defect when it rots. It announces one when somebody does correct work.

> **The mitigation is derivation, and it is usually cheap.** The lamp's rect is now measured from Hob's standing frame by the extractor and says so, so moving him moves it. The gauntlet's click is now `on: "lamp"` and reads that rect's centre, so it cannot miss a lamp that has moved. **A literal beside a rect is a copy, and a copy of something that moves is wrong from the first edit onward.**

**Derive from the CONTENT, not from the engine** — `clickPoint` reads the room JSON with its own parser rather than asking the running game where its lamp is. Asking the engine would click exactly where the engine believes the lamp to be and pass however wrong that belief was, which is R5i.

**And an unused field is never wrong about anything.** The gauntlet script's `room` said `stage-road` where the room calls itself `stage_road`. Doc 44 had specified *"must equal `manifest.startRoom`"* from the beginning. It had been wrong since the day it was written and nothing noticed, because nothing read it — it became wrong the moment a click resolved through it. **A restated identifier that nothing consumes is not safe; it is untested.**

### The limit, and it is not a small one

**This rule does not say derive every number. It says derive AIM, and never derive JUDGEMENT.**

The same gauntlet script carries `band: [660, 864]`, which restates Room 1's walkable band — a duplicated number by exactly the definition above. **It must stay duplicated.** `engine/dev/Watch.ts` takes the band from the harness and not from the room's own walk boxes precisely so that "is this mover outside the band" is not answered using the data that decided where the band is. Deriving it would make the check agree with its subject: R5i, R5e, and a green light that means nothing.

The two are told apart by one question: **if the content were wrong, would this number make the harness notice or make it agree?**

| | derived | restated |
|---|---|---|
| where to click | ✔ the hand goes where the object is | ✘ a copy that rots |
| the walkable band | ✘ the check would pass on any band | ✔ an independent second opinion |
| an expected position | ✘ the staging compared with itself | ✔ written by hand from doc 43 |

**Aim is where the harness reaches. Judgement is what it concludes.** Derive the first so a moving world cannot break it; write the second by hand so a wrong world cannot hide behind it.

## R5l · AN UNUSED FIELD IS NOT SAFE, IT IS UNTESTED

**Everything else in this section is about a mechanism that agrees with itself. This is about several mechanisms agreeing that something EXISTS while none of them agrees what it is FOR.**

`idleBreakRate` is the clean specimen. `tools/build-actor-record.mjs` wrote it into every actor record. `engine/core/types.ts` declared it, with a doc comment explaining it. `docs/40` specified its value. Three layers, in agreement, on a field **read by no code at all** — so the glance played at the breathing rate, and the number that was supposed to govern it sat one property away, correct, and inert.

**That is a different failure from a stale value.** A stale value is a right answer to a question that has changed. This is a value nobody ever asked for: it cannot go stale, because staleness requires a reader to be misled, and there was no reader.

**The tell is that everything looks finished.** The generator emits it, the type documents it, the schema validates it, the record shows it in every diff. Every artefact anybody inspects is present and correct. What is missing is the only thing that would have mattered — somebody consuming it — and absence of a consumer is invisible in every artefact.

**Verified positions in one session:**

| Field | Declared by | Written by | Read by |
|---|---|---|---|
| `idleBreakRate` | `types.ts`, doc 40 | `build-actor-record.mjs` | **nothing** |
| the gauntlet script's `room` | doc 44, *"must equal `manifest.startRoom`"* | by hand | **nothing** — and its value was wrong from the day it was typed |
| `art/effects/lantern-glow.json` | doc spec, in full | the art pipeline | **nothing** in `engine/`, `tools/` or `content/` |

**`room` is the sharpest of the three, because it was WRONG.** It said `stage-road` where the room calls itself `stage_road`, and doc 44 had specified the constraint from the beginning. It stayed wrong through every validation run this project has ever had, and it became wrong — detectably, instantly — the moment one line resolved a click through it. **A field acquires correctness the day something depends on it, and not before.**

> **When you add a field, name its reader in the same change.** If there is not one yet, the field is a plan and belongs in a document, not in a record — because in a record it will be indistinguishable from a working feature, to every check, in every diff, indefinitely.

**A check is possible and is not built.** The shape: a name that appears only in its declaration and its generator, and in nothing that reads. A plain identifier grep over `engine/` and `tools/` gets close — of 41 keys across the actor records, only three are named nowhere in code today, and two of those are state *values* rather than fields. What that heuristic misses is exactly the `idleBreakRate` case, where the name does appear twice, in the two places that do not count. Distinguishing *declares* and *writes* from *reads* is the work, and it is the difference between a useful check and a noisy one.

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
