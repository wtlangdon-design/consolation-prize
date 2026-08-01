# Room 1 — region spec: ROAD

**Region rect:** `(0, 94, 320, 50)` in native 320×144 coordinates. 16,000 px, 35% of the
play area.

**Measured against:** `reference/room-01/image-B-bar-320x144.png` (the bar). Cross-checked
for identification only against `image-A-composition-brief.png`. Palette families taken
from `image-B-in-locked-palette-320x144.png` against `art/palette/consolation-256.json`.

---

## 1. What this region is, and what it must communicate

The road surface at night: churned wet mud, cut by a fan of wheel ruts that sweep in from
the right, with moonlit standing water lying in the deeper ones. Along the left it is not
road at all but a dark stony verge.

At 320×144 this band has one job and it is not "look like mud". It has to **read as a
floor going away from the viewer** — a surface a character can be standing *on* rather than
*in front of*. Everything below is in service of that. There is exactly one structure in
the region that does the receding, and it is the rut fan; the mud texture, the stones and
the water are dressing hung on it. If the rut fan is wrong the region fails whatever else
is right, and it fails at the legibility gate, not at lighting.

Second job: it is dark. 80% of the region sits between luminance 10 and 50, and only 0.4%
of it (62 pixels) is above 110. The whole bright end of the region is one small pool of
lamp light near the top-left. The road is the frame's dark mass, not its subject.

**Measured value envelope for the whole region:** L 1.4 to 121.9, mean 37.7, median 36.0.

| L band | share of the region |
|---|---|
| 0–20 | 13.0% |
| 20–40 | 47.1% |
| 40–60 | 32.3% |
| 60–90 | 6.9% |
| 90+ | 0.9% |

---

## 2. Elements, extents, and draw order

Draw in this order. Each layer modulates what is under it; nothing here is a decal on a
flat fill.

| # | Element | Extent (native) | Notes |
|---|---|---|---|
| 1 | **Ground base value field** | whole region | Two gradients plus one falloff, §4. Flat, untextured, no grain yet. |
| 2 | **Rut fan** | x 60–302, y 94–144 | §3. Crest-and-trough modulation of layer 1. Strongest x 100–295. |
| 3 | **Mud grain** | whole region except the verge cores | §6. Horizontal-dash dither, density by zone. |
| 4 | **Dry scatter** | x 60–300, densest inside the lamp pool | 1–2 px pale gravel flecks and darker clods, ~1 ramp step either way. |
| 5 | **Stones** | cluster x 0–55 y 118–144; pair x 300–320 y 116–140; ~12 singles scattered x 90–260 | §7. |
| 6 | **Standing water** | x 74–305, y 104–143 | §5. Reserved cycling band. Painted last of the ground layers, into rut troughs only. |
| 7 | *(objects' own pass)* contact shadows | where feet, chest, wheels meet the ground | The road leaves room; it does not draw them. §8. |

The left verge (x < 60) skips layers 2 and 6 entirely. The right verge (x > 302) skips
layer 2 and keeps a little of 6.

---

## 3. RUT GEOMETRY — the load-bearing measurement

### 3.1 The construction

Every rut, extended, heads for a single convergence point.

> **Convergence point: (316, 82).**
> That is on the frame's right edge, **12 px above the top of the road band** — behind and
> above the near coach wheel, off the region entirely.

Fitting the local rut orientation across 48 high-coherence samples gives (315.9, 82.1) with
an angular residual of 6.9°. Fitting each traced rut as a chord and extending it to y = 82
independently gives x = 279 … 317, median 307. The two estimates agree; use **(316, 82)**,
and treat anything between 300 and 320 as within tolerance.

**To draw one rut:**

1. Pick its start x on the bottom edge (y = 143) from the list in §3.2.
2. Draw the straight line from that point to (316, 82), clipped to the band.
3. **Bow it.** Push the midpoint of that line 3% of its length perpendicular, toward the
   bottom-left (the near side). Measured sagitta over traced segments: +1 to +3% of chord
   length, i.e. 2–4 px on a 90–130 px rut. This is small and it is the entire difference
   between a curving road and a fan of stripes.
4. The two outermost ruts — bottom-edge start x ≥ 280 — are the exception and they bow
   **hard**: sagitta 6–15 px, 15–23% of chord. They wrap around an elbow at approximately
   **(272, 112)**, and past it their tangent reverses sign: the rut starting at x = 283
   runs at −55° at the bottom edge and +40° by the time it clears the elbow. This elbow is
   where the road turns behind the coach and it is the most distinctive shape in the region.

The straight-to-the-point construction is accurate to ~3° in the near half of the band and
~7° at worst. The bow is what a straight construction is missing.

### 3.2 How many ruts, and where they cross the bottom edge

**11 ruts reach the bottom edge**, at:

```
x = 87, 117, 145, 200, 220, 238, 246, 257, 269, 283, 305
```

A looser threshold also picks up four faint intermediates near x = 45, 74, 164 and 191 —
draw those as half-strength ruts if the fan looks sparse, not as full ones. Total legible
rut count across the band: **11 strong, 4 faint**.

Spacing along the bottom edge between adjacent strong ruts: **median 18 px**, range 8–31.
Note it is deliberately irregular — the tight pairs (238/246, 257/269) read as one cart
having passed twice, and evenly-spaced ruts read as corduroy.

### 3.3 How the fan changes with depth

The ruts are parallel lines on a ground plane whose horizon is y = 82. That gives one law,
and it is worth stating because it is the thing that makes the band recede:

> **Horizontal spacing between two ruts at row y is proportional to (y − 82).**

So a gap that is 18 px at y = 143 (where y − 82 = 61) is:

| row y | y − 82 | that 18 px gap becomes |
|---|---|---|
| 143 | 61 | 18 px |
| 130 | 48 | 14 px |
| 118 | 36 | 11 px |
| 106 | 24 | 7 px |
| 96 | 14 | 4 px |

Measured horizontal crossing spacing at y = 106 is 9–10 px median against a predicted 7;
at y = 142 it is 18–19 against 18. The law holds.

**Perpendicular** (true) spacing, which is what governs how many rut lines you actually
draw per inch of surface: **6–9 px at the bottom edge, 3–4 px at y ≈ 106**. Below about
4 px the individual rut stops being a rut and becomes a fine corrugation — at the top of
the band do not attempt to resolve separate ruts, lay in a 3–4 px ripple and let it go.

### 3.4 Rut angle — the sweep, tabulated

Angle of the rut direction, degrees from +x with screen y down (negative = climbing to the
right). This is the number that tells you the sweep has been drawn correctly:

| | x=104 | x=128 | x=176 | x=200 | x=224 | x=248 | x=272 | x=296 |
|---|---|---|---|---|---|---|---|---|
| **y = 143** | −9 | −21 | −15 | −19 | −31 | −43 | −50 | −69 |
| **y = 130** | −16 | −32 | −20 | −20 | −28 | −41 | −43 | — |
| **y = 120** | −2 | −17 | −19 | −11 | −16 | −36 | — | — |

Read that left-to-right: **the ruts start almost flat on the left of the frame and stand
nearly upright by the right edge.** At the bottom-left of the band they are within 20° of
horizontal; at the bottom-right they are within 20° of vertical. Nothing else in the region
communicates "receding surface" as strongly as that rotation, and it is the first thing a
uniform treatment destroys.

Read top-to-bottom: within a column, ruts steepen by roughly 5–10° as they come toward the
viewer. Secondary, but it is there.

### 3.5 Rut cross-section

Averaged over 589 detected trough samples, perpendicular to the rut, relative to the local
mean:

```
far side ──── crest +7 L (4–6 px wide, plateau) ──── trough −8 L (2–3 px) ──── water line
             ──── next crest ──── near side
```

* **Trough width at half depth: 2.5 px.** Measured median 3.5 px at the bottom edge,
  2.0–2.9 px in the y 110–125 band. So: 3 px wide near, 2 px wide at mid-depth, 1 px at
  the top of the band.
* **Crest sits 3–4 px to the far side of the trough** and is 4–6 px wide near the bottom
  edge, 2–3 px at mid-depth.
* **Trough-to-crest amplitude: ~15 L on the strong ruts, ~9 L on typical ones.** In ramp
  terms that is **3 steps of mud/umber for a strong rut, 2 steps for an ordinary one**
  (one mud or umber step is worth 5–6 L).
* **Inside the lamp pool the same corrugation is drawn at 2–3× the contrast** — measured
  rut-scale contrast std is 9.7 L in the pool against 3.0–3.7 L everywhere else. Absolute
  contrast is near-constant outside the pool regardless of depth. Do **not** taper the rut
  contrast with distance; taper it with *light*.

### 3.6 Where the ruts stop

* **Left:** faint down to x ≈ 60, strong from x ≈ 100. **No ruts at all left of x = 60** —
  that is verge, not road.
* **Right:** ruts run to x ≈ 300, then stop. Beyond x ≈ 302 is a flatter, stonier verge on
  the far side of the track.
* **Top:** the ruts do not terminate at a horizon inside the region. The ground continues up
  past y = 94 into the mid-ground and is simply occluded by things standing on it. There is
  no horizon line to draw. §8.

---

## 4. Value structure — two gradients and one falloff, measured separately

### 4.1 Depth gradient

Measured on mud only, in the column band x 175–300 where the lamp contributes nothing:

> **L(y) = 75.4 − 0.291 · y**

| row y | mud luminance |
|---|---|
| 106 | 44.6 |
| 120 | 40.5 |
| 132 | 37.0 |
| 143 | 33.8 |

**Total fall from the top of the band to the bottom edge: 10.8 L, about two ramp steps.**
The road gets *darker as it comes toward the viewer*, not lighter. That is the whole depth
gradient and it is gentle. It is not what makes the region recede; the rut fan is.

### 4.2 The lamp pool

Hob's lamp sits at **(88, 84)** — above this region — and its pool lands inside it.
Excess over the depth model, measured:

| | x=64 | x=80 | x=96 | x=112 | x=128 | x=144 | x=160 | x=176 | x=192+ |
|---|---|---|---|---|---|---|---|---|---|
| **y = 106** | +17 | +51 | +51 | +41 | +30 | +13 | +9 | +4 | ≈0 |
| **y = 110** | +14 | +42 | +52 | +42 | +22 | +14 | +8 | +2 | ≈0 |
| **y = 116** | −6 | +3 | +24 | +24 | +12 | +8 | +4 | +1 | ≈0 |
| **y = 122** | −14 | +4 | +18 | +10 | +11 | −3 | +5 | −1 | ≈0 |
| **y = 130** | −5 | +1 | +3 | +9 | +6 | +1 | 0 | −1 | ≈0 |
| **y = 140** | −5 | −1 | +1 | +5 | 0 | +1 | −1 | 0 | ≈0 |

* **Peak +50 L, centred near (92, 108).**
* **The hot core is tiny: 62 pixels above L 110, inside x 78–105, y 106–117.** Above L 90:
  114 px in x 74–126, y 106–117. Above L 70: 495 px in x 47–151, y 106–131.
* **Anisotropic — much wider than tall.** It reaches x = 176 (88 px out) horizontally but
  is gone by y = 132 (24 rows down). Ratio roughly 3:1, which is what a pool on a receding
  ground plane looks like. A circular pool will read as a spotlight on a wall.
* **Hard-edged on the left, soft everywhere else.** The pool is cut off at x ≈ 58–62 by the
  post standing there; left of the post it drops 25–38 L within 15 px. To the right it
  takes 90 px to die. Do not make the pool symmetric.
* The lit mud inside the pool is the **only** warm-bright material in the region and it must
  stay small. Everything above L 90 is 0.9% of the region.

### 4.3 Left-edge falloff

After subtracting both the above, the only region left with a large residual is the left
strip: **x 0–70, y 118–144, sitting 10 to 27 L below the model**. That is the shadowed
verge under the building. Treat it as a third, independent falloff — a wedge that pulls the
bottom-left corner down to L 14–24.

### 4.4 There are no cast shadows on this road

Worth stating because it is counter-intuitive and the region invites inventing them. After
[depth + lamp pool + left falloff], the residual is within −8 … +3 L everywhere in the
open road. **The coach casts nothing. The team casts nothing. The figures cast nothing.**
The only shadows are 1 px contact darkenings directly under feet, wheel rims and the chest.
The night is too diffuse and the lamp too small for anything else, and adding a coach shadow
across the ruts will read as a smear.

---

## 5. STANDING WATER — and the reserved cycling band

### 5.1 Project constraint (binding)

> The standing water is a **palette-cycling element**. It must be painted in the **reserved
> band: sky ramp steps 7, 8, 9 — palette indices 152, 153, 154**. The engine rotates those
> three entries at runtime to make the water shimmer.
>
> **Nothing else anywhere in the frame may use indices 152–154.** `cycling.reserve()` will
> clamp any trespasser out of the band and `cycling.verify()` will fail the build if one
> is left.
>
> **Each separate streak is painted with a *different one* of the three**, cycling
> round-robin through the band as you lay them down. One rotation then shows each streak at
> a different point in the cycle, which is where the per-puddle phase offset comes from at
> no extra palette cost.
>
> The declared element in `content/rooms/stage-road.json` is `puddles`: family `sky`,
> ramp start 7, count 3; mode `pingpong`, rate 0.25; **bounds (0, 96, 320, 48)**.

**Consequence for drawing: the element's bounds start at y = 96.** The top two rows of this
region, y = 94 and y = 95, are outside the puddle element, so **no reserved index may be
placed there**. Measured water in the reference at y 94–103 belongs to the mid-ground, not
to this region — leave it to whoever owns that band.

### 5.2 How much water, at what size

Measured inside the road proper (y ≥ 104):

* **1,162 water pixels = 9.1% of the road area.**
* **42 streaks of 4 px or more**, totalling 1,101 px, plus ~35 flecks of 1–3 px (57 px).
* Streak sizes, descending: 210, 153, 84, 73, 72, 52, 34, 34, 30, 30, 30, 24, 23, 23, 22,
  20, 18, 17, then a tail down to 4. **Median 10 px, mean 26 px.**
* A typical streak is **10–30 px long and 1–2 px wide**, following its rut. The two largest
  are chains of segments along a single rut, spanning 60–80 px of x with gaps.
* Water lies **in the trough, never on the crest**, and never between ruts.

**Budget for the reserved band:** round-robin across ~42 streaks gives roughly **370–390 px
per reserved index, 13–14 streaks each**. Hand-place the two largest streaks (210 px and
153 px) on *different* indices — a straight round-robin puts them 217 / 466 / 418, which is
lopsided enough that one third of the shimmer will visibly out-mass the others.

### 5.3 Where the water is, and where it is not

* Longest streaks: the two chains running x 150–230 / y 122–143 and x 96–157 / y 119–139 —
  both in the near-left of the rut fan.
* Steep short threads x 259–305, y 105–143, in the tight ruts around and past the elbow.
* Small isolated dashes, 2–6 px, scattered through the lamp pool's outskirts.
* **The pool's bright core carries no water at all.** x 70–118, y 100–118 is dry.
* Two or three lone flecks out on the dark left verge (x 16–28) — enough to say the ground
  is wet everywhere, not enough to draw the eye.

### 5.4 Value — and a conflict to resolve before drawing

Measured reference water: **RGB (44, 49, 82), L median 49.8** (p10 37.5, p90 68.6). Against
the mud immediately around it:

| band | water L | adjacent mud L | difference |
|---|---|---|---|
| y 106–115 (in the pool) | 51.5 | 65.9 | **−14** |
| y 116–125 | 51.4 | 39.2 | +12 |
| y 126–135 | 50.7 | 33.9 | **+17** |
| y 136–143 | 48.4 | 32.2 | +16 |

Two things follow. First: **water is only 12–17 L brighter than its mud — two to three ramp
steps, not a highlight.** Second, and less obvious: **inside the lamp pool the water is
*darker* than the mud around it.** In the lit zone the streaks read as small cool notches;
out in the dark they read as bright cool threads. Same colour, inverted relationship. That
inversion is free if the water is one value and the mud is graded, and it is worth having.

**The conflict, stated plainly, for Tyler to rule on before anything is drawn:**

The reserved band sky 7–9 is **(97,109,125) / (105,117,134) / (113,125,142), L 107 / 115 /
123**. The reference water measures L 50. Painting it in the reserved band puts the water
**66 L — about eleven ramp steps — above the reference, and 70 to 90 L above the mud it
sits in.** It will not read as standing water; it will read as chalk lines.

The band was chosen for good reasons that still hold: indices 152–154 are used **nowhere
else** in the re-quantised reference, which is exactly what a reserved band needs, and the
comment in `room01_stage_road.py` records that they were moved up off 149–151 precisely
because those were shared with the distant hills. The reasoning was sound against the road
*as currently composited* — the current render's road sits at L 65–85. **The reference road
sits at L 32–40.** The band is not wrong; the road under it is about to get 35 points darker.

For the record, the closest fit to the measured water is **accent_indigo steps 2–4**
(indices 239, 240, 241 — L 42.7, 59.1, 72.0), and the re-quantiser independently chose
accent_indigo 2–3 for 448 of the reference's water pixels. Those three entries are used
essentially nowhere else (220 px and 266 px frame-wide, of which 187 and 261 are in this
road band; step 4 is unused entirely). The obstacle is that accent_indigo steps 0–1 are the
night sky — 17,000 px of it — so reserving 2–4 means the sky must stay off those three,
which it already does.

**This spec does not change the band.** Draw to sky 7–9 as declared unless and until the
declaration is changed in `content/rooms/stage-road.json`. But do not draw it and call the
region done: at 152–154 the water will fail the legibility gate on its own, and the fix is a
one-line change to the room JSON, not a re-lighting of the road.

---

## 6. Palette families and ramp steps per zone

From the locked-palette re-quantisation of the reference. 54 distinct indices across the
whole region; 32–42 in any one zone.

| Zone | extent | L med / p10 / p90 | families and dominant ramp steps |
|---|---|---|---|
| **Lamp pool core** | x 70–118, y 100–116 | 75 / 37 / 122 | `pine_fresh` 3–6 (38%), `ochre` 8–13 (35%), `umber` 0–14, `mud` 0–7 |
| **Lit fringe** | x 118–175, y 104–125 | 51 / 37 / 69 | `pine_fresh` 2–5 (50%), `mud` 5–9 (21%), `umber` 4–10 |
| **Mid road** | x 175–270, y 112–134 | 41 / 30 / 52 | `mud` 5–7 (27%), `umber` 4–5 (22%), `pine_fresh` 2–3 (17%), `grey` 1–4 |
| **Near road** | x 120–260, y 132–144 | 38 / 28 / 50 | `umber` 4–5 (29%), `mud` 5–7 (21%), `grey` 1–3, `pine_weathered` 1–2 |
| **Dark left verge** | x 0–60, y 118–144 | 23 / 13 / 35 | `grey` 0–1 (47%), `pine_weathered` 0–1 (27%), `dust` 0–1, `umber` 0–5 |
| **Right verge** | x 296–320, y 112–144 | 32 / 24 / 43 | `umber` 4–5 (32%), `pine_weathered` 0–1 (23%), `mud` 5–6, `grey` 1–3 |
| **Standing water** | in the ruts | 49 / 29 / 59 | **reserved: `sky` 7–9** (see §5.4) |

### Per material

| Material | Family and steps | Notes |
|---|---|---|
| **Dry lit mud** (in the pool) | `pine_fresh` 3–6, brightest flecks `ochre` 8–13 | Warm. The only warm-bright material in the region. |
| **Dry mud** (mid road) | `mud` 5–7 with `pine_fresh` 2–3 for crests | Rut crests take the top step, troughs the bottom. |
| **Wet / shadowed mud** (near, right) | `umber` 4–5 with `grey` 1–3 pushed in | Cooler and lower-chroma than the mid road. |
| **Verge mud** (x < 60, y > 118) | `grey` 0–1, `pine_weathered` 0–1, `dust` 0–1 | Near-black. Chroma almost gone. |
| **Stones** | `grey` 1–4 body, one `grey`/`bone` step brighter on the top edge | Measured saturation **0.20 vs mud's 0.48** — stones are the region's only grey. |
| **Standing water** | `sky` 7–9 reserved (§5.4) | Coldest thing in the frame; must not compete with the lamp for being warm. |

One mud or umber ramp step ≈ 5–6 L. One `pine_fresh` step ≈ 9 L.

---

## 7. Stones

31 blobs of ≥ 3 px detected inside the road mask, 236 px total, plus a further 6–8 in the
right verge outside the mask.

* **Size:** median **4 × 2 px**; p90 **10 × 4 px**; largest 13 × 5. Always wider than tall,
  by roughly 2.5 : 1 — they are half-buried, not sitting on top.
* **Value:** **+8 L above the local mud** (median). At the far-left verge that is L 30–40
  against mud at L 20–26; in the mid road L 47–53 against mud at 37–42.
* **Chroma:** saturation 0.20 against the mud's 0.48. This is what makes them read as stone
  rather than as a light patch of mud, and it matters more than the value difference.
* **Construction at this size:** a **1 px pale cool highlight along the top edge** over a
  two-value dark body. That highlight line is the entire stone. Below the body the darkest
  available value, 1 px, for the seat.
* **Distribution:** heavily front-loaded to the left. 14 of 31 in x 0–39, 4 in x 40–79, then
  2–4 per 40-px band across the middle, and a pair in the far right verge x 300–320. The
  left cluster is dense enough to read as a stony verge; the mid-road singles are lone
  cobbles kicked out of the ruts and should stay lonely.

---

## 8. Where this region meets its neighbours

* **Top edge (y = 94) is not a boundary in the picture.** There is no horizon line in this
  region. The ground plane runs up past y = 94 into the mid-ground and is occluded from
  y ≈ 94–106 by whatever is standing on it — rail fence, crates, the chest, the figures,
  both coach wheels. Author the value field and the rut fan **continuously across y = 94**
  and let the mid-ground occlude. If the road is drawn as a self-contained band, the seam
  at y = 94 will show as a step in both the value gradient and the rut spacing.
* **The lamp pool crosses the same seam.** Its source is at (88, 84), above the region. The
  falloff has to be one function evaluated on both sides.
* **The puddle cycling element starts at y = 96**, two rows below the region's top. No
  reserved index at y 94–95.
* **Left coach wheel and clutter** (x 8–55) sit down to y ≈ 118; **right coach** (x 255–320)
  to y ≈ 114. The road and its ruts run *behind and under* them: draw the fan complete, then
  occlude. The elbow at (272, 112) is partly hidden by the near wheel and must still be drawn
  correctly, because the ruts either side of it have to line up.
* **Figures' feet contact the ground at y ≈ 100–108** with a 1 px contact shadow only.
* **The chest** at x 218–240, y 96–108 sits on the mud with a 1–2 px darker band under it.
* **Bottom-left corner** is a shared dark with whatever owns the verge/clutter left of
  x = 60. Neither side should try to carry a visible edge there; both should just go dark.

---

## 9. Technique notes

**Dither and grain.** The mud grain is **horizontally biased and not isotropic**. Same-sign
residual runs average **3.5 px horizontally against 2.0 px vertically**; lag-1
autocorrelation is +0.46 … +0.69 in x against −0.09 … +0.26 in y. In practice the grain is
made of **3–4 px wide, 1 px tall dashes**, scattered, never stacked into blocks. That
horizontal bias is doing real work: it lies along the ground plane and reinforces the
recession. Isotropic noise will not.

**Grain amplitude by zone** (std of the 1-px residual):

| zone | grain std |
|---|---|
| Lamp pool | 10.5 |
| Under the pool / lit mid | 5.9–6.7 |
| Mid and near road | 5.4 |
| Far-left verge | 4.8 |
| Right verge | 4.0 |

Grain scales with light, not with depth. The pool is twice as grainy as anything else,
because a lit surface shows its texture; the verge is nearly smooth because there is not
enough light there to show anything.

**No ordered dither anywhere.** No Bayer, no checkerboard, no regular 50% screen. The
reference has none and a regular screen at 320×144 reads as a fabric swatch.

**Hard edges — there are only two in this region.** The stones' top highlight, and the
pool's left cut at x ≈ 58–62 where the post shadows it. Everything else — the pool's other
three sides, the depth gradient, the verge falloff, the rut crests — is a dithered
transition of 3–6 px.

**Single pixels doing structural work:**

* The **1 px highlight on each stone's top edge**. Remove it and the stone is a smudge.
* The **water thread**: 1–2 px wide over its whole length. Widening it to 3 px turns the
  road into a river.
* The **trough line** at the top of the band, where the rut is 1 px wide and one value.
  Those single-pixel troughs are the far end of the perspective and they cannot be
  thickened for legibility without flattening the band.

---

## 10. What will go wrong

These are ranked. The first one is the one that will actually happen.

1. **A flat band with uniform noise that reads as a wall, not a floor.** This is what the
   current composite does: `renders/room-01-stage-road.png` has the road band at a near-
   uniform L median 72.4 with a regular checkerboard dither, no ruts, no perspective, no
   pool, and 34 short horizontal pale-blue dashes at L 114. It reads as a brown wall with
   chalk marks. The reference band is L median 36 with 47% of its pixels between 20 and 40.
   **If the region has no rut fan it has failed, and no amount of texture will save it.**

2. **Ruts as stripes.** Parallel lines at a constant angle, evenly spaced, will read as
   corduroy or as a ploughed field seen flat-on. Three things prevent it, all measured: the
   angle must rotate from about −15° at x = 104 to about −69° at x = 296 (§3.4); the spacing
   must scale with (y − 82) (§3.3); and the spacing must be *irregular* — median 18 px at
   the bottom edge but ranging 8 to 31, with tight pairs.

3. **Water too bright.** As drawn today it is L 114 against a road at L 36. The reference is
   L 50 against mud at 32–40 — **12 to 17 L, two or three ramp steps.** Water is not a
   highlight, it is a slightly-lighter cool line. See §5.4: the declared reserved band
   currently puts it 66 L too high and that needs a ruling before this region is drawn.

4. **Water in the wrong shape or the wrong place.** It goes **in the rut troughs**, following
   the rut's curve, 1–2 px wide, in streaks of 10–30 px. It is not horizontal dashes, it is
   not puddles, it is not in the flat between ruts, and there is none of it in the lamp
   pool's bright core.

5. **A round lamp pool.** The pool is 3:1 wider than tall, hard-cut on its left by the post
   and soft for 90 px to its right, and its hot core is 62 pixels. Drawing it as a circle,
   or drawing it big, turns a lamp into a spotlight and blows the region's value budget —
   only 0.9% of these pixels are above L 90.

6. **Inventing cast shadows.** The coach, the team and the figures cast nothing on this
   road; the measured residual after the light model is flat to within ±8 L across the whole
   open surface. Only 1 px contact shadows exist. A coach shadow laid across the rut fan
   will fight the perspective and win.

7. **Stones as light blobs.** What makes a stone at 4×2 px is the 1 px pale top edge and
   the drop in *chroma* — saturation 0.20 against the mud's 0.48. A brown blob 8 L lighter
   than the mud is a light patch of mud.

8. **Grading the rut contrast with depth.** Absolute rut contrast is near-constant at
   ~3.0–3.7 L std everywhere outside the pool — it does *not* fade with distance. It
   triples inside the pool. Fade it with light, never with depth, or the far half of the
   band will go flat and the recession will die exactly where it is needed most.

9. **Isotropic or ordered dither.** §9. Horizontal dashes, scattered.

10. **Trespassing on 152–154.** Any pixel outside the puddle element's bounds
    (0, 96, 320, 48) painted in the reserved band will be clamped out by `cycling.reserve()`
    — silently. And any *water* pixel drawn at y = 94 or 95 is outside those bounds and will
    be clamped too, leaving a hole in the streak. Keep water at y ≥ 96, and in practice
    y ≥ 104, which is where the road proper begins.
