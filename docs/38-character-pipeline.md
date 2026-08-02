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
