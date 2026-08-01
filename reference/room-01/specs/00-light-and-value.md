# Room 01 — Whole-Frame Light and Value Structure

**Study of `reference/room-01/image-B-bar-320x144.png` (the bar).**
Every number below is measured on the bar at native 320×144. Luminance `Y` is
perceptual value on gamma-encoded sRGB (`0.2126R + 0.7152G + 0.0722B`, 0–255) —
what a painter means by "value" and what a palette-ramp step moves. Where linear
light matters it is called out explicitly.

This is a drawing brief. It says what the frame *is*, so a rebuild can be
checked against it.

Study images (look at these, they carry more than the tables):

| File | What it shows |
|---|---|
| `work/room-01-study/light/value-map-8step@3x.png` | 8-step posterisation across the frame's real range |
| `work/room-01-study/light/warm-cold-mask@3x.png` | Two-colour warm/cold family mask |
| `work/room-01-study/light/squint-ladder.png` | The frame at 80×36 / 40×18 / 20×9 — the first-look read |
| `work/room-01-study/light/saliency@3x.png` | Centre-surround saliency (value + warmth + edge) |
| `work/room-01-study/light/ridge-line-overlay@3x.png` | Detected far-range silhouette, per column |

---

## 0. The one-sentence description

A frame whose **entire tonal range lives in the bottom 48% of the scale**, built
from **two hue families 205° apart**, in which **one small light source supplies
55% of all the light in the picture** and does it by lighting *the ground behind
the figure* rather than the figure.

---

## 1. The value map

### Global statistics

| | p1 | p10 | p25 | p50 | p75 | p90 | p99 | p100 |
|---|---|---|---|---|---|---|---|---|
| **Y** | 2.4 | 11.9 | 18.3 | **26.1** | 37.1 | 49.9 | 85.2 | **121.9** |
| **% of 255** | 0.9 | 4.6 | 7.2 | **10.2** | 14.5 | 19.6 | 33.4 | **47.8** |

Mean 29.1, sd 16.4.

Three facts dominate everything else:

1. **The frame never gets brighter than Y=121.9 — 47.8% of white.** There is no
   white, no near-white, nothing above mid-grey anywhere, including inside the
   lantern flame. The top half of the value scale is unused.
2. **67% of the frame sits below Y=32**, and 88% below Y=48. The picture is
   almost entirely built in the bottom fifth of the range.
3. **The histogram has a hard empty gap at Y=96–111.** Nothing occupies it. The
   brightest tier (Y=121.9) is *disconnected* from the body of the image by a
   ~36-unit jump above p99. Light in this frame does not blend up to its peak —
   it steps to it.

Coarse histogram, 16-wide bins:

```
  0- 15  19.34%  ########################
 16- 31  47.84%  ############################################################
 32- 47  21.16%  ##########################
 48- 63   8.07%  ##########
 64- 79   2.02%  ##
 80- 95   1.20%  #
 96-111   0.00%          <-- empty
112-127   0.36%
128-255   0.00%
```

### Band by band

Horizontal bands, in frame order:

| Band | rows | % frame | p10 | median | p90 | mean | sd | mean sat | warm % |
|---|---|---|---|---|---|---|---|---|---|
| Sky | 0–37 | 26.4 | 8.8 | 20.6 | 30.1 | 20.8 | 8.8 | 0.83 | 0.3 |
| Far range | 38–47 | 6.9 | 12.8 | 20.1 | 30.4 | 21.3 | 7.6 | 0.68 | 5.8 |
| Near range | 48–61 | 9.7 | 11.8 | 20.4 | 41.3 | 23.9 | 14.4 | 0.53 | 34.5 |
| Town / valley floor | 62–79 | 12.5 | 11.6 | 28.6 | 57.8 | 31.7 | 19.2 | 0.48 | 60.9 |
| Mid-ground | 80–99 | 13.9 | 11.0 | 25.8 | 48.1 | 28.3 | 16.4 | 0.43 | 64.9 |
| Road | 100–143 | 30.6 | 19.9 | 37.4 | 57.8 | 38.9 | 16.8 | 0.42 | 74.3 |

Note the pattern running down the last three columns: **as the frame comes
forward, saturation falls (0.83 → 0.42) and warmth rises (0.3% → 74.3%)**. That
is the whole colour architecture in one movement. See §3 and §5.

### Where the dark is

Darkest decile is `Y ≤ 11.85` — 4,690 px (10.2% of frame), in 432 connected
components.

- **It is pooled, not scattered.** Ten components of ≥50 px hold **64% of all
  dark-decile pixels**. The largest single pool is **1,382 px = 3.00% of the
  frame** — the top of the sky, `y 0–8`, running the full width.
- The remaining scatter is real but light: 280 components (65% of the count) are
  1–2 px specks, and together they hold only **8%** of the dark mass.
- **True near-black (`Y < 6`) is 1.73% of the frame** in 154 components. The
  largest is only 136 px (0.30% of frame) — the **stagecoach's open door and
  window interior at x 253–262, y 59–86**. That is the deepest hole in the
  picture and it is deliberately small.

The eight largest dark pools:

| px | location | what it is |
|---|---|---|
| 1382 | x 80–319, y 0–8 | top of sky (right half) |
| 429 | x 0–81, y 0–8 | top of sky (left half) |
| 363 | x 275–304, y 52–85 | coach rear body / boot |
| 188 | x 253–262, y 59–86 | coach door + window opening |
| 171 | x 8–24, y 92–122 | left timber structure base |
| 119 | x 11–31, y 35–47 | left structure against sky |
| 117 | x 159–177, y 69–94 | lead horse mass |
| 100 | x 25–37, y 64–92 | sign post / gantry upright |

Dark-decile share by band: sky 39.4%, mid-ground 20.1%, town/valley 13.9%, near
range 11.3%, road 9.6%, far range 5.7%. **The single darkest region of the frame
is the top of the sky, not any object.**

---

## 2. The light sources

### The ranking is not by peak — it is by pool

The emitters **share palette entries**. The lantern flame, the lantern's ground
pool core, the gantry lamp, one coach lamp and a handful of town windows are all
the *same colour*: `rgb(155,118,63)`, Y=121.9. Stars and the coach roof lamp are
all `rgb(122,91,60)`, Y=95.35. Ordinary town windows are `rgb(118,80,40)`,
Y=85.19.

Four emitter tiers, total 844 px = **1.83% of the frame**:

| tier | rgb | Y | px | % frame | above ridge | below |
|---|---|---|---|---|---|---|
| 1 | (155,118,63) | 121.90 | 167 | 0.36 | 1 | 166 |
| 2 | (122,91,60) | 95.35 | 124 | 0.27 | 11 | 113 |
| 3 | (118,80,40) | 85.19 | 312 | 0.68 | 0 | 312 |
| 4 | (103,70,36) | 74.56 | 241 | 0.52 | 0 | 241 |

So **peak luminance cannot rank the sources** — several are tied at the maximum.
What separates them is *integrated luminous excess*: how much light each one
actually puts into the frame, measured as Σ max(0, Y − local ambient).

| rank | source | integrated excess | share | local ambient |
|---|---|---|---|---|
| **1** | **Lantern (flame + ground pool)** | 64,056 | **55.2%** | 35.3 |
| 2 | Town windows (all 52) | 31,465 | 27.1% | 19.2 |
| 3 | Stars (all 74) | 6,675 | 5.8% | 20.4 |
| 4 | Gantry lamp | 4,996 | 4.3% | 33.8 |
| 5 | Coach door lamp | 4,857 | 4.2% | 22.5 |
| 6 | Coach roof lamp | 2,445 | 2.1% | 27.2 |
| 7 | Coach side lamp | 1,569 | 1.4% | 26.2 |

**The lantern outweighs everything else in the frame combined.** The gap from #1
to #2 is 2.0×; from #2 to #3 is 4.7×; #4 through #7 are all within 3× of each
other and together make up 12%. The hierarchy is: one dominant source, one
diffuse collective (the town), then a tail.

And it wins **only because it has a pool**. Per-pixel it is tied with four other
lights. Take the ground pool away and the lantern drops to roughly the gantry
lamp's weight.

### Source by source

**1 — The lantern.** Flame core at **(85, 87)**; the tier-1 body spans
(82,85)–(89,90), 25 px, with a 5 px hood highlight at (84,79)–(87,80). Reads as
hanging on the rail left of the figure, not carried.

*Air bloom* (the glow around the flame itself): half-width 6–8 px, gone by
r ≈ 12–14. Small and tight.

*Ground pool*: centre **(91, 108)** — 6 px right and **21 px below** the flame,
because the light is in the air and the pool is on the ground plane. Strongly
foreshortened: an ellipse with vertical squash **k = 2.70**.

Fitted over the ground plane (rows 96–144, x 8–150, figure excluded), with a
linear road baseline removed:

```
L(d) = 93.5 / (1 + (d / 16.4)^2) + 36.7        d = sqrt(dx^2 + (2.70 * dy)^2)
```

RMSE 5.29 Y units (nRMSE 6.0%). Freeing the exponent gives **p = 1.79** —
**inverse-square within the noise.** Alternatives fit worse: exponential 6.4%,
inverse-linear 6.4%, gaussian 7.5%, linear-clamp 8.4%.

- Half-power radii: **16.4 px horizontal, 6.1 px vertical**
- Radius of visible influence (contribution ≥ 10 Y ≈ two palette steps):
  **d ≈ 47** → about **±47 px horizontally, ±17 px vertically**
- Total footprint of the pool's visible reach: roughly x 44–138, y 90–126

**Fit it in value space, not linear light.** Both fit about equally well
(nRMSE 6.0% vs 5.8%), but in value space the exponent lands on 1.79 ≈ 2, while
in linear light it needs 2.75. The artist stepped *palette values*, not physical
radiance — which is exactly what our lighting pass does. Implement inverse-square
on the value index.

**2 — Town windows.** 52 discrete warm marks inside x 88–182, y 44–82, totalling
134 px = **3.8% of the town's area**. Size distribution: 19 are 1 px, 20 are
2 px, 8 are 3–4 px, 5 are ≥5 px (largest 18 px). Mean mark Y = 87.9 against a
town-body median of 25.7 — a **local pop-out of +62.2 Y units**, the largest
local contrast anywhere in the frame. **They have no bloom at all**: fitted
r0 = 0.69 px. They are bare dots punched into a cold mass.

**3 — Stars.** 74 of them, 157 px, 1.17% of the sky area, roughly one per 182 px
of sky. Mean Y = 62.9 against sky median 20.3. Mostly 1–2 px (52 of 74). No
bloom. **They are warm, not white** — drawn in tier 2, the same ochre family as
the lamps. There is no cold or neutral star in the frame.

**4 — Gantry lamp.** Core **(77, 67)**, 13 px of tier 1, bloom r0 ≈ 2.7 px. Its
job is not to light the scene but to **light the sign board** — see §4.

**5 — Coach door lamp.** Core **(242, 69)**, 14 px of tier 1, bloom r0 ≈ 3.5 px.

**6 — Coach roof lamp.** Core **(230, 49)**, 6 px of tier 2.

**7 — Coach side lamps.** (261, 66) and (275, 65), 3 px and 2 px of tier 1.

**8 — Sky ambient. There is no moon.** The sky is a pure vertical gradient with
**no horizontal structure whatsoever**: the column-median varies by
**0.79 Y units across the entire 320 px width** — less than one palette step.
No disc, no directional falloff, no side key.

```
Y(y) = 6.50 + 24.67 * (y / 37)^0.80          rows 0..37, RMSE 0.93
```

Top row Y = 8.0, rising to Y = 29.3 at the ridge — a **21.3-unit rise over 38
rows**, slightly decelerating (exponent 0.80). This dome glow is the *only*
light on the far ranges, and it is what they are silhouetted against.

---

## 3. The warm / cold split

**43.2% warm, 56.8% cold.** No third family — the hue histogram is bimodal and
the two lobes are **~205° apart**:

- **Cold**: hue 228–243, tightly clustered at **232°**. Indigo/blue. Saturation
  0.43–1.00, highest in the sky.
- **Warm**: hue 12–31, clustered at **26°**. Ochre/umber/mud. Saturation
  0.19–0.67.
- Only 2.2% of the frame is near-neutral (sat < 0.12), and it sits *between* the
  two families, not outside them.

### Where the boundary runs

The boundary is **the ground line, not a horizontal**. Measured per column as the
first row below which the next 10 rows are ≥60% warm:

| x | 0 | 32 | 64 | 96 | 128 | 160 | 192 | 224 | 256 | 288 |
|---|---|---|---|---|---|---|---|---|---|---|
| **y** | 41 | 58 | 54 | 71 | 56 | 68 | 68 | 64 | 45 | 47 |

Median **y = 58**, mean 59.9, range **38 → 97**. It rides high on the left
(x 0–16, y≈41–51: the timber structure is warm right up into the sky) and high
on the right (x 240–288, y≈41–47: the coach mass is warm up to its roofline),
and dips lowest in the centre (x 96, y=71) where cold valley floor pushes down.

### The two rules that matter for authoring

**Rule 1 — above the line, warm is only ever a mark.** Just **2.5%** of the
above-boundary zone is warm, and all of it is emitter tiers: stars, town windows,
lamp cores. The sky is **0.3% warm**; the far range **5.8%**. The mountain and
sky masses contain no warm pixels at all beyond those marks.

**Rule 2 — below the line, 27.9% is still cold, and that cold is load-bearing.**
These are the **wet ruts and puddles** in the road, plus the figure's coat. They
measure hue 234, saturation 0.36, and sit **10.5 Y units below the warm ground
around them** (26.8 vs 37.3). They are pooled, not dithered: 79% of the
cold-below mass is in components of ≥30 px, the largest 1,492 px.

**Consequence for our pipeline.** The lighting pass steps within a family and
cannot cross hue. So:

- Every surface the lantern will ever touch — the whole road plane, the fence,
  the sign, the timber, the figure's boots and hat brim — must be **authored in a
  warm family from the start**, at its *unlit* value. The lamp brightens it; it
  cannot warm it.
- The ruts and puddles must be **authored cold** and must stay cold *inside the
  lantern pool*. They are the reason the road reads as wet rather than as dusty.
  A lighting pass that lifts them along a warm ramp destroys the single most
  characterful thing about the foreground.
- The town **mass** is cold (79% of it) and only its 52 window marks are warm.
  Do not author the town warm and darken it — author it cold and punch warm
  holes.

---

## 4. The read

Squint ladder (`squint-ladder.png`) is the primary evidence; the tables support
it. At **20×9** — the coarsest look — only two things survive: the three-band
structure (indigo sky / warm middle / warm road), and **one bright warm patch
left of centre**. Everything else is gone.

Contrast against surround, measured at 40×18 (the "first look" scale):

| region | \|ΔY\| @40×18 | ΔY @native | Michelson | sat vs surround | edge density | warm % |
|---|---|---|---|---|---|---|
| Gantry lamp | 15.70 | +13.9 | 0.151 | +0.05 | 168.7 | 75.0 |
| Lantern ground pool | 14.91 | +15.6 | 0.167 | +0.08 | 87.4 | 89.3 |
| Mid fence + crate | 9.66 | −8.8 | 0.123 | −0.05 | 82.7 | 78.7 |
| Road ruts (right) | 7.96 | +8.7 | 0.126 | +0.01 | 49.7 | 78.3 |
| Stagecoach body | 7.47 | −7.6 | 0.138 | −0.07 | 64.2 | 56.5 |
| Horse team | 5.88 | −6.1 | 0.100 | −0.01 | 69.2 | 69.5 |
| Figure (Thad) | 5.77 | −0.3 | 0.003 | −0.03 | 102.2 | 64.1 |
| Town lights | 2.60 | −2.3 | 0.039 | −0.06 | 76.4 | 22.5 |
| Sign board | 1.50 | +15.8 | **0.213** | +0.05 | 108.2 | 81.7 |

### The order, and what wins each place

**1 — The lantern pool, with the flame in it.** Wins on **value contrast × mass**
and it is not close. +15.6 Y above its surround over 2,400 px; 89.3% warm against
a mixed field; holds 126 of the frame's 167 tier-1 pixels. It is the **only local
feature that survives the 20×9 squint**. Attention here is not shared.

**2 — The figure (Thad).** Wins on **isolation and silhouette**, not on value —
and this is the frame's cleverest move. His bbox mean differs from its surround
by **−0.3 Y (Michelson 0.003)**: as a *region* he is invisible. But his coat
averages **Y = 26.4** against lit ground of **Y = 58.0** behind him — a
**+31.6 Y silhouette separation**, the largest of any object in the picture.
Then his face is given a single tier-1 highlight at (98, 76), producing a
**95.5-unit internal range** inside a 26×50 px figure. His edge density (102.2)
is second only to the two lamps.

He reads because **the lantern lights the ground behind him, not him.** That is
the compositional reason the lamp is placed where it is, and it is the thing
most likely to be lost in a rebuild.

**3 — The sign board.** Wins on **local contrast and isolation**. Highest
Michelson contrast of any region in the frame (**0.213**), +15.8 Y above
surround, 81.7% warm, sitting alone in the dark left third with nothing
competing within 40 px. Its 168.7-edge-density lamp is stapled to its top
right — the gantry lamp exists to make this plane bright. At 40×18 the sign
itself dissolves (|ΔY| 1.50) but the lamp does not; the pair reads as one bright
incident.

**4 — The stagecoach mass.** Wins on **area and negative contrast**. 5,720 px =
12.4% of the frame, sitting **7.6 Y below** its surround — a dark block against
the lighter road and the sky-glow. It is the counterweight that stops the frame
tipping left into the lantern. Its own four lamps contribute only 7.7% of the
frame's light between them; they read as detail *inside* the mass, not as
attention targets.

**5 — The town lights.** Wins on **hue contrast and edge density**, and on
nothing else. Region value contrast is **−2.3 Y** (Michelson 0.039) — as a mass
the town is invisible. But it holds 52 discrete marks at Y ≈ 87.9 against a body
of 25.7 (**+62.2 pop-out per mark**) in a mass that is 79% cold. It reads as a
*texture of warm sparks in a cold field* — a place, not an object. Edge density
76.4 with almost no value contrast is the signature.

**6 — The road ruts.** Wins on **direction**. +8.7 Y over 6,800 px, and
critically **66% of its strong edges lie within 30° of horizontal** (orientation
histogram peaks at 150–180° with 23.5% and 0–15° with 14.6%; vertical edges are
only ~9%). The ruts sweep from the bottom-right corner up and left, and they
terminate at the lantern pool. They are the frame's only directional device and
they point at the winner.

---

## 5. Depth

Horizontal bands hide the depth structure — sky, far range and near range all
have medians within 0.5 Y of each other (20.1–20.6), because a horizontal
rectangle cuts across a ridge line that varies from y=29 to y=48. Measured
**ridge-relative** (offsets from each column's own far-range silhouette top, with
the town columns x 88–182 excluded), the structure is unambiguous:

| plane | offset | median Y | gap | mean sat | local sd |
|---|---|---|---|---|---|
| Sky, just above ridge | −7 | **29.13** | — | 0.75 | 0.37–1.06 |
| Far range, top | +1 | **19.97** | **−9.16** | 0.75 | 0.37 |
| Far range, body | +5 | 19.55 | −0.42 | 0.69 | 2.43 |
| Near range | +11 | **16.23** | −3.32 | 0.58 | 4.11 |
| Near range, base | +17 | 21.75 | +5.52 | 0.56 | 5.86 |
| Valley floor | +24 | 24.60 | +2.85 | 0.48 | 4.28 |
| Mid-ground | +34 | 28.92 | +4.32 | 0.54 | 6.08 |
| Road | — | **37.39** | +8.47 | 0.42 | 7.33 |

### The depth is a U, not a ramp

Value **falls** from the sky down to the near range (29.1 → 16.2), then **rises**
all the way forward to the road (16.2 → 37.4). **The darkest structural plane in
the frame is the near range ridge** — not the sky, not the ground.

This is night logic, and it is the opposite of daylight atmospheric perspective:
*distance is the light source*. The sky glow is the brightest large area behind
the ranges, so each successive range comes forward as a **darker silhouette
against it**. Then the ground plane takes over as a lit surface and brightens
forward.

The gaps are **deliberately unequal**. The one that does the real work is
**sky → far range at −9.16 Y**, about four to five palette steps — a single hard
edge that establishes the whole horizon. Everything after it is 2.9–5.5 Y,
roughly one to two steps.

### Where atmosphere works and where overlap works

Two other channels vary monotonically with depth and carry the separation where
value cannot:

- **Saturation falls forward: 0.75 → 0.42.** The most distant thing (the sky) is
  the most saturated thing in the frame. The nearest (the road) is the least.
- **Detail rises forward: local sd 0.37 → 7.33.** The far-range top is
  *completely flat* (sd 0.37 — a single colour). The road is the busiest plane.

**Atmosphere does the work above the valley floor.** Sky, far range and near
range are separated by value steps and saturation drops alone; there is no
overlap between them — the ridges meet edge to edge.

**Overlap does the work below it.** From the valley floor forward, the value gaps
collapse to 2.9–4.3 Y (one step or less, at the edge of legibility), and
separation is carried instead by objects crossing in front of each other: the
fence over the valley floor, the horse team over the fence, the coach over the
horses, the timber structure over everything on the left. **Where the reference
runs out of value range, it stops using value and starts using occlusion.** Any
rebuild that tries to separate the near planes by value alone will run out of
room, because there are only about four steps left between the valley floor and
the road.

---

## 6. Texture budget

### How much is flat

Measured as local 5×5 luminance standard deviation — a region "reads flat" at
320×144 if its sd is under about 2 Y units (one palette step).

| threshold | % of frame |
|---|---|
| sd < 1 | 3.0% |
| **sd < 2 (reads flat)** | **14.8%** |
| sd < 3 | 21.6% |
| sd < 4 | 27.9% |
| sd < 6 | 43.1% |

Median local sd across the frame: **6.85**.

### Where it chooses flat: the sky, and only the sky

| band | median local sd | % reading flat |
|---|---|---|
| Sky upper (0–20) | 2.49 | 33.3% |
| **Sky lower (20–42)** | **1.79** | **54.3%** |
| Ranges (42–62) | 7.29 | 12.3% |
| Town / valley (62–80) | 9.95 | 0.6% |
| Mid-ground (80–100) | 10.66 | **0.0%** |
| Road (100–144) | 7.33 | 0.2% |

Essentially all of the frame's flatness is sky, and the flattest part is the
*lower* sky nearer the horizon. The far-range silhouette top is flat too (sd
0.37) but it is a thin band. **Below the ridge line the reference is flat
nowhere.** The mid-ground is 0.0% flat.

This is the texture budget in one line: **one large calm area at the top,
everything else worked.** The calm is what makes the busy read as busy.

### What kind of noise

**It is not ordered.** Testing for an N×N dither matrix by measuring how much the
residual mean varies with pixel phase (x mod N, y mod N), normalised by residual
sd — a Bayer matrix scores >0.5, unstructured noise scores <0.15:

| region | N=2 | N=4 |
|---|---|---|
| Sky | 0.104 | 0.200 |
| Road | 0.042 | 0.127 |
| Valley | 0.155 | 0.525* |

*The valley's 0.525 is not dither — it is the horizontal rows of town windows
landing on a 4-row rhythm.

So the noise is **broadband and unstructured**, with no Bayer phase. Nyquist
(checkerboard) energy is only 3.6% of total spectral energy.

**Caveat, and it matters:** the bar is a 256-colour quantisation of a painted
image — 27.2 unique colours per 8×8 tile, 0% of tiles flat by colour count. Its
texture is quantisation noise, **not authored dither, and it is not reproducible
by our compositor.** Do not chase the noise. Chase the *statistics*: which areas
read flat, and how much local variation each plane carries.

### Density varies with depth, not with light or material

Local sd by plane runs 0.37 → 2.43 → 4.11 → 5.86 → 4.28 → 6.08 → 7.33 from far
to near — **monotonic with distance**. It does not track illumination (the
brightly-lit pool and the dark left structure carry similar densities) and it
does not track material (mud, timber and horsehide all sit in the 6–8 band at
the same depth). Texture density in this frame is a **depth cue**, and it is the
third one after value and saturation.

### Road direction

Strong-edge orientations in the road, 0° = horizontal:

```
  0- 15 deg  14.6%     150-165 deg  20.2%
 15- 30 deg   7.7%     165-180 deg  23.5%
 60-105 deg   9.4%  (vertical -- rare)
```

**66% of road edges lie within 30° of horizontal.** The rut texture is
directional and near-horizontal, sweeping in a shallow arc from bottom-right
toward the lantern pool. It is not isotropic noise.

---

## 7. What a rebuild will get wrong

Five whole-frame failures, in order of how likely and how damaging they are.

### 1. The median lands too high and the night reads as dusk

The target is **median Y = 26.1 and p75 = 37.1**, with **67% of the frame below
Y=32**. Every instinct in compositing — wanting the art to be legible, adding
ambient so nothing is "lost", lifting shadows to show the detail that was
modelled — pushes this up. A median of 35 instead of 26 is a nine-unit error that
no single region will flag, and the frame will read as late evening rather than
night. **This is the most likely failure and the hardest to see from inside.**

*Check:* frame median must be **26 ± 2**, p90 ≤ 52, and no more than 2% of pixels
above Y=85. The already-requantised `image-B-in-locked-palette` version is
median 29.1 / mean 31.5 — **already 3.0 and 2.4 units bright** before we build
anything. That drift is the shape of the error.

### 2. The ceiling gets broken and the lantern stops being decisively brightest

The frame's maximum is **Y=121.9 — 47.8% of white** — and there is an **empty
histogram band at 96–111** isolating it. Two ways to lose this: putting anything
above 122 in the frame at all (a specular, a white star, a hot window), or
filling the 96–111 gap so the peak blends in instead of stepping.

Worse is the ranking failure. The lantern holds **55.2% of the frame's
integrated light**, but its per-pixel peak is *tied* with four other lamps and
several town windows. If the rebuild ranks lights by brightness — giving the
coach lamps or the town windows their own bloom, or making the lantern flame
"hotter" to compensate — the hierarchy inverts. **The lantern must win by pool
area, not by peak.** Every other light in this frame is a bare dot: town windows
fit r0 = 0.69 px, i.e. **no halo at all**.

*Check:* max Y ≤ 122; zero pixels in 96–111; integrated excess of the lantern ≥
50% of the frame total; no non-lantern source with a fitted bloom radius over
4 px.

### 3. Uniform dither everywhere, and the sky loses its calm

**14.8% of the frame reads flat and essentially all of it is sky** (lower sky
54.3% flat, local sd 1.79). Below the ridge, flatness is 0–12% and the
mid-ground is **0.0%**. A compositor that applies one dither policy globally will
either texture the sky — destroying the only calm area and with it the contrast
that makes the ground read as worked — or flatten the ground into poster-like
plates.

Compounding it: the reference's noise is **unordered** (phase score 0.10–0.20,
Bayer would be >0.5). Ours will be a Bayer matrix. Do not try to match the
reference's noise *pattern* — match its **per-plane amplitude**: sky sd ≈ 1.8–2.5,
ranges ≈ 7.3, valley/mid-ground ≈ 10, road ≈ 7.3, and let density rise
monotonically with nearness.

### 4. Depth planes get equal value gaps, so nothing recedes

The gaps are not uniform: **sky → far range is −9.16 Y** and everything after it
is **2.9–5.5**. One hard step establishes the horizon; the rest are whispers. A
rebuild that spaces its planes evenly — the natural thing to do when you have a
ramp and six planes — flattens the horizon and over-separates the near ground.

Two further traps in the same place. First, **the depth is a U**: value falls
sky → near range (29.1 → 16.2) then rises to the road (37.4). Anything that
assumes "further = lighter" throughout will invert the near ranges. Second,
**below the valley floor the value gaps collapse to one step or less and
separation switches to overlap.** If the near planes are separated by value
instead, the frame runs out of range and the foreground goes chalky.

*Check:* sky-to-far-range median gap ≥ 8 Y; every subsequent gap ≤ 6 Y; near
range must be the **darkest** structural plane (below both the sky above it and
the valley below it); saturation must fall monotonically forward, 0.75 → 0.42.

### 5. The figure gets lit instead of the ground behind him

Thad's region contrast against his surround is **−0.3 Y (Michelson 0.003)** — as
a mass he does not contrast at all. He reads entirely because his coat (Y=26.4)
is cut against ground the lantern lit to Y=58.0, a **+31.6 silhouette
separation**, plus one tier-1 pixel on his face.

The instinct in a rebuild is to point the lamp at the character. Do that and the
coat lifts, the separation collapses, and the most important figure in the room
dissolves into the pool he is standing in — while every individual measurement
still looks plausible.

*Check:* the figure's dark-coat mean must sit **≥ 28 Y below** the mean of the
lit ground within 20 px of him, and his region-vs-surround Michelson contrast
should stay **near zero**. If the figure starts contrasting as a region, the
light is aimed wrong.

### Also worth guarding

- **No moon.** Sky horizontal variation is **0.79 Y across the full width**. Any
  disc or side gradient is wrong.
- **Stars are warm** (tier 2 ochre, mean Y 62.9), 74 of them, 1–2 px, no bloom.
  Not white, not cold, not twinkling into the top tier.
- **27.9% of the ground is cold** — the wet ruts, 10.5 Y below the warm mud
  around them, pooled in components of ≥30 px. Author them cold; the lighting
  pass cannot make them cold later, and it must not warm them inside the pool.
- **Near-black is scarce and placed**: `Y < 6` is 1.73% of the frame and its
  largest pool is 136 px, the coach doorway. Do not spend black anywhere else.
