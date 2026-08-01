# Room 1 — sky · rect (0, 0, 320, 48)

Drawing brief. All coordinates are native 320×144. All luminance figures are
`0.299R + 0.587G + 0.114B` on 0–255, measured off
`reference/room-01/image-B-bar-320x144.png` — the bar. Image A was consulted
only to identify shapes; nothing here is measured against it.

---

## 1 · What this region is, and what it has to communicate

Nineteen rows of open sky over a far mountain range, thinning to five rows where
the range is highest. It is the first thing anyone sees in the game and it is
almost entirely still.

It has three jobs and no others:

1. **Be the dark field.** Everything warm in this room — the lantern, the coach
   lamps, the town — reads as warm only because this region is cold and empty.
   Measured: sky median luminance **22.7**, everything below row 48 median
   **31.3**. The sky sits about **9 luminance below the ground**. That gap is
   the whole composition.
2. **Establish depth by gradient alone.** The sky brightens downward, toward a
   horizon that is nine tenths of the way to dawn and never gets there. No
   clouds, no moon, no Milky Way, no localised glow over the town.
3. **Carry the rhyme.** The stars are warm. The town is warm. They are the same
   colour ladder. The point of the shot is that the town is a constellation that
   fell over, and the star field has to be warm enough to make that land without
   anyone noticing it was arranged.

The sky proper is **12,042 px, 78.4% of the rect**. The remaining 21.6% is far
range, town roofs and the stagecoach, all owned by neighbouring specs.

---

## 2 · Elements, with measured bounding boxes, in draw order

| # | Element | Native bbox | Notes |
|---|---|---|---|
| 1 | **Vertical sky gradient** | (0, 0)–(319, 42) | Painted first, full width, down to the skyline. Function in §3. |
| 2 | **Star field** — 151 marks in the reference, 119 clearly visible | cores span x 0–317, y 1–38 | One pixel each. Never below y 38. |
| 3 | **Far-range skyline cut** | full width, crest y **29**, floor y **43** | This spec owns the *cut line*; the mountain region owns the fill below it. |
| 4 | *(neighbour)* Far-range fill | skyline → y 47 | Flat, no gradient. Reference fill ≈ (13,19,53), L 21.1. |
| 5 | *(neighbour)* Chimney smoke plume | x 40–44, y 32–47 | 1–3 px wide, cool blue-white, brightest at its base. See §7. |
| 6 | *(neighbour)* Derrick / sign structure | x 0–15, y 44–47 | Warm timber intruding into the bottom-left of the rect. |
| 7 | *(neighbour)* Coach roof and driver | x 226–284, y 43–47 | Warm; the driver's hat breaks the rect's bottom edge around x 226. |

Nothing else enters this rect. No town window reaches above y 48.

### The skyline profile

The range is **highest on the left and lowest centre-right**, so the visible sky
is wedge-shaped: 29 rows deep at the left frame edge, 5 rows deep at x ≈ 200.
Mean skyline y is 37.6.

Summits — x 24–40 crest **y 29** (highest ground in the frame, plus a shoulder
at x 0–4 cut by the frame edge); x 48–56 **y 29–31**; x 152–164 **y 33**;
x 224–236 **y 36**; x 260–272 **y 36**.

Saddles — x 8–16 **y 34–35**; x 112–128 floor **y 43**; x 196–212 **y 43**;
x 244–250 **y 42**; x 286–292 **y 41**.

Between those, the line wanders by ±1–2 rows per 8 px. It is a range seen from
twenty miles, not a mountain: no cliffs, no verticals, no run steeper than about
one row per pixel, and the longest flat run in the reference is nine pixels.

---

## 3 · Value structure

**Darkest thing in the region:** the top two rows of sky, L **9.1**, colour
(0, 6, 49) — a nearly black, fully saturated blue.

**Lightest thing:** a single star pixel at (249, 3), L **122.8**. The next
brightest tier is L 96.7. Everything else in the sky sits between L 8.5 and
34.5.

**Sky-only distribution (stars excluded):** min 8.5 · p25 16.5 · **median 22.7**
· mean 22.1 · p75 28.6 · max 34.5.

### The gradient — fit it, don't eyeball it

It is a **straight linear ramp**, and testing confirmed that; the best power-law
fit is `L(y) = 9.16 + 22.67·(y/37)^0.86` at rms 1.11, while plain linear scores
rms 1.48 against a per-row noise floor of 1.55. The exponent is not doing real
work. Draw it linear.

The best three-segment description (rms 0.91, at the noise floor):

- **y 0** — flat, (0, 6, 49), L 9.1
- **y 1 → y 31** — linear ramp to (19, 27, 77), L 30.3.
  Slope **+0.71 L/row**, i.e. **+0.63 R, +0.70 G, +0.93 B per row**.
- **y 32 → skyline** — flat plateau at (21, 28, 80), L **31.8**.

Two consequences worth holding onto:

- **The ramp desaturates as it brightens.** Saturation falls from 1.00 at the
  top to 0.74 at the horizon. R climbs 0→21 and G 6→28 — nearly the same
  absolute rise — while B climbs 49→80. The horizon is not "more blue", it is
  *more everything*, which is what airglow looks like.
- **The plateau is only reached where the range is low.** On the left massif the
  skyline sits at y 29–35, above the plateau start, so the sky there is cut off
  mid-ramp. Measured: mean sky luminance in the eight rows above the skyline is
  **27.6–28.8 across x 20–60** but **31.3–31.8 across x 180–320**. The left
  summits therefore separate from the sky about 3.5 luminance less strongly than
  the centre-right ones. That is correct. Do not even it out.

### The gradient is purely vertical

Sampled in 20-px columns along the whole width, the mean luminance of the eight
rows above the skyline varies by less than ±1.5 and shows no peak over the town.
**The town's amber does not bleed into the sky.** There is no vignette either;
edge columns match mid-frame columns to within 1 luminance.

---

## 4 · Palette

### The hard constraint

The locked palette contains exactly **two blue-dominant entries below L 40**:

| Entry | RGB | L | Role here |
|---|---|---|---|
| `accent_indigo[0]` #237 | (16, 20, 45) | **21.65** | the sky's body |
| `accent_indigo[1]` #238 | (28, 32, 69) | **35.02** | the horizon band |
| `accent_indigo[2]` #239 | (36, 40, 89) | 39.72 | faint stars, and only that |

There is **nothing blue between #237 and #238**. The intermediate-luminance
entries (`grey[1]` L 24.5, `accent_teal[0]` L 24.8, `grey[2]` L 32.5) are
neutral and will read as smoke, not sky.

This is the worst-served region in the frame. Quantising the bar into the locked
palette costs a **mean RGB distance of 15.6 here against 8.9 for the whole
image**, and that error rises to **20.5 at row 0**. The reference's top-of-sky
(1, 7, 50) is simply out of reach: `accent_indigo[0]` at distance 20.5 is the
best the palette can do, and an exhaustive search over every two-colour dither
in the palette found **nothing better** — mixing in `void` buys luminance but
destroys the blue, which is worse.

### What to do about it

Do not chase the absolute value. **Chase the relationships**, which all survive:

- `accent_indigo[0]` is L 21.65. The reference sky's measured median is 22.7.
  Painting the body of the sky flat in `accent_indigo[0]` reproduces the sky's
  **median luminance to within 1**, and therefore preserves the 9-luminance gap
  to the ground that the whole composition rests on. What is lost is the
  top-of-frame minimum and some of the internal range — the sky will read
  slightly less deep and slightly less saturated than the brief. Accept that;
  every alternative is worse.
- The horizon-to-mountain step survives intact. Reference: horizon sky 31.8 over
  mountain fill 21.1, a **10.7 step**. `accent_indigo[1]` over
  `accent_indigo[0]` is a **13.4 step** — slightly stronger, which helps.

### Materials

| Material | Family and steps |
|---|---|
| Sky body, rows 0–16 | `accent_indigo[0]`, flat |
| Sky ramp, rows 17–31 | `accent_indigo[0]` → `[1]`, ordered dither |
| Horizon band, row 32 → skyline | `accent_indigo[1]`, flat |
| Brightest star | `ochre[13]` #50 — **but read §6 first** |
| Bright stars (≈11) | `umber[14]` #35 |
| Upper-mid stars (≈21) | `dust[8]` #65 |
| Mid stars (≈29) | `dust[5]`, `dust[4]`; 4–5 of them cool at `sky[1]`, `sky[0]`, `accent_indigo[3]` |
| Faint stars (≈40) | `dust[2]`, `dust[1]`, `accent_indigo[2]` |

`accent_indigo[2]` is worth knowing: it reads **+23 luminance over
`accent_indigo[0]`** but only **+9.5 over `accent_indigo[1]`**. The same faint-star
colour is legible in the top of the sky and nearly invisible near the horizon.
That gives the measured density falloff (§5) for free, and it is the one place
where the palette's coarseness works in our favour.

---

## 5 · Technique

### Dither

**The reference has none.** Per-row luminance deviation in the sky is
sd **1.55**, with no checkerboard parity signal and no column parity signal —
it is downsampling grain, not a dither. Image A carries a fine hatch texture at
its own internal resolution (≈418×235), which is finer than our pixel; at
320×144 it lands below the noise floor. **Do not reproduce that hatch.** Drawn
at our scale it would be five times too coarse and would read as static.

Our dither is therefore an addition the reference does not have, forced by the
missing intermediate blue. Confine it:

- **Rows 0–16: no dither at all.** Flat `accent_indigo[0]`. Seventeen rows of
  one colour. This is the quietest surface in the game and it should stay that
  way. The reference crosses `accent_indigo[0]`'s luminance at y ≈ 17, so there
  is nothing to gain above that row anyway.
- **Rows 17–31: ordered 4×4, density rising about one sixteenth per row**, from
  1/16 `accent_indigo[1]` at row 17 to 15/16 at row 31. Fifteen rows, seventeen
  levels — very nearly one level per row, which is why 4×4 is the right matrix.
  8×8 was tried and reads as a distinct textured stratum; white noise reads
  gritty. 4×4 with a per-row density change is the quietest of the three.
- **Row 32 to the skyline: flat `accent_indigo[1]`.** On the left massif
  (x ≈ 0–60) this band does not exist, because the skyline is above row 32
  there. Correct — see §3.

Never hold the dither at 50% for more than one row. A held 50% checker reads as
a painted band, and at 320×144 the eye finds it instantly.

### Edges

**The skyline is hard.** One row of full sky, the next row of full mountain, no
fringe and no dithered transition. The bar shows a single intermediate row at
each column; that is a downsample artefact and must not be drawn. Nothing else
in this region has an edge.

### Where one pixel does structural work

- **Every star is one pixel.** Verified in image A: the bright star blobs there
  measure 5–7 device px across, which is 1.25–1.75 of A's internal pixels and
  **about 1.0 of ours**. The 2×2 star footprints in the bar are resampling, not
  drawing. No star is ever 2 px, and there are no star clusters.
- **Twelve pixels carry the whole star field.** The 12 stars at L ≥ 96 are what
  a player actually sees; the other 139 are texture. Their positions are
  measured and worth placing deliberately rather than generating: (4,1), (15,22),
  (34,19), (75,25), (138,14), (139,34), (164,9), (181,17), (249,3), (287,1),
  (287,23), (311,35). Note how they are spread — one in each rough sixth of the
  width, one high and one low in each.
- **The single hard row at the skyline** is the only edge in the region and does
  all the depth separation.

### Star placement

- **Density falls about 6:1 from the top of the frame to the horizon**:
  22.9 stars per 1000 sky px in rows 0–5, 14.1 in rows 6–11, 13.0 in 12–17,
  8.9 in 18–23, 11.0 in 24–29, 8.6 in 30–35, 3.7 in 36–41, and **none at all
  below y 38**. In per-row terms: about 7 stars per row at the top, 4 by y 15,
  2 by y 30, 0 by y 39. The horizon washes them out. This is the opposite of the
  usual instinct and it is the single most characterful measurement in the
  region.
- **Horizontally uniform.** Counted in eight 40-px bands: 15, 22, 16, 18, 20, 20,
  23, 17. No structure, no constellations, no denser side.
- **Blue noise, not random.** Measured median nearest-neighbour spacing is
  **5.39 px** where a Poisson field of the same density would give 4.19, and only
  40 stars have a neighbour within 4 px where Poisson predicts 71. The field is
  measurably *more even* than random, with a hard **minimum spacing of 2 px** —
  no two star pixels are adjacent anywhere in the frame. Use Poisson-disc or
  blue-noise sampling. Pure `random()` will clump and read as dirt on the screen.
- **Warm, almost without exception.** Of 151 stars, **138 add warm light** to the
  sky and only 8 add cool. Keep the cool ones (they stop the field looking
  tinted) but keep them to about 1 in 20, and put them in the mid tiers, not the
  bright ones — every star at L ≥ 80 in the reference is warm.
- **Use a short, discrete brightness ladder**, not a continuous range. The
  reference uses one: 11 stars share one exact colour, 21 share another, 8 share
  a third. Five or six steps is right.

> **On the star count.** `00-light-and-value.md` counts 74 stars; this spec
> counts 151. Both are correct at their thresholds — that one takes the bright
> cores, this one goes down to +6 luminance over the local sky, where the faintest
> marks are already at the edge of the reference's own grain. The number that
> matters for drawing is the **119** that clear +15 and survive quantisation into
> the locked palette. The same document reports most stars as 1–2 px; measured
> against image A, where a star spans 1.25–1.75 of A's internal pixels, they are
> **all 1 px at our resolution** and the 2-px footprints are resampling.
> Likewise, its sky median of 20.3 is taken over the whole 0–37 band including
> mountain; the 22.7 here is sky only, above the skyline. Neither is wrong.

---

## 6 · What will go wrong

1. **Twinkling the stars.** `docs/18-palette-cycling.md` gives Room 1 exactly two
   cycling elements — Hob's lamp and the puddles — and CLAUDE.md invariant 9
   forbids motion that reads as information. A star field is the single most
   tempting surface in the game to animate and it must stay completely still.
   The frame's only movement is a lamp and some water.

2. **A star as bright as the lamp.** The reference's brightest sky pixel is
   (155, 118, 63) — *exactly* the colour it uses for Hob's lantern, the coach
   lamps and the town windows, one pixel of it, at (249,3). Errata 18b protects
   "the lamp's status as the uniquely brightest object in the only night exterior
   in the game." The reference ties it. **Cap the star field one step down at
   `umber[14]`** and let the lamp own the top of the ramp outright — this is a
   deliberate, flagged departure from the bar, and it should be a decision
   somebody makes rather than something that happens.

3. **Stars packed toward the horizon.** Every instinct says the star field
   thickens where the sky meets the land. Measured, it is **six times thinner**
   there, and there is not a single star below y 38. Drawing them into that band
   destroys the horizon glow and flattens the depth read.

4. **Reproducing image A's sky hatch.** A carries a visible cross-hatch grain in
   the sky. That grain is at A's internal resolution, which is finer than our
   pixel. Drawn at our scale it becomes a coarse repeating pattern in the
   calmest 17 rows of the game. The rule the parent brief gave applies exactly
   here: A tells you *what* is up there, never *how big* it is.

5. **Fighting for the top-of-sky value.** Someone will notice that
   `accent_indigo[0]` is 12 luminance too light against the reference and reach
   for a `void` dither to fix it. It was tested. Reaching L 9 needs a 53%
   black checker across the top of the frame; it kills the blue completely and
   looks like a fault. The palette floor for a saturated night blue is
   `accent_indigo[0]` and that is that.

6. **Dithering the whole field.** A full-height gradient dither between the only
   two available blues is a 13-luminance step at every pixel and reads as noise
   across the entire sky. The dither belongs in fifteen rows and nowhere else.

7. **Fixing the left summits.** The sky above the left massif is genuinely
   darker than the sky above the centre-right ranges, so the left peaks separate
   less. That is the gradient working correctly against a higher skyline, not a
   contrast failure.

8. **Painting over the smoke plume.** It lives inside this rect (x 40–44,
   y 32–47) and it is faint. A flood fill of the sky region will eat it, and its
   absence is very hard to spot.

9. **Softening the skyline.** Anti-aliasing is forbidden project-wide, but the
   bar *shows* one blended row at every mountain edge, so it will get copied in
   good faith. It is a resampling artefact.

10. **Sizing stars off the bar.** Roughly a quarter of the bar's stars appear to
    have a 2-px core. None of them do. Every star is one pixel.

---

## 7 · Where this region touches its neighbours

**The skyline cut (mountains).** This spec owns the cut line, the mountain
region owns everything below it. Two measured facts the mountain spec needs:

- The horizon sky is L **31.8**; the far-range fill is L **21.1**. The step is
  **10.7**, and it is the only thing making the range read.
- **The far-range fill is *lighter* than the top of the sky** — 21.1 against 9.1.
  The mountains only read dark locally, against the bright horizon band. In our
  palette both the mountain fill and the sky body want `accent_indigo[0]`, which
  collapses that relationship from an 12-luminance inversion to a dead tie. If
  the mountain region wants the inversion back it must go *below*
  `accent_indigo[0]` — `grey[0]` (L 16.0) or `pine_green[0]` (L 13.1) — and
  should decide that knowingly, because it will also strengthen the silhouette
  more than the reference does.

**The smoke plume (town).** A 1–3 px cool blue-white column at x 40–44, running
from about y 47 up to y 32, brightest at its base (up to L 59, with B reaching
108 — bluer than the sky itself) and dissolving as it rises. It sits *entirely
below the skyline*, so it reads against the mountain and never against the sky.
It is the only vertical in the top third of the frame; at its top it is one
pixel wide.

**The lamp hierarchy (whole room).** The star ladder's top step and the room's
light sources are drawn from the same warm colours. See §6 item 2 — the sky must
concede the top of the ramp.

**The bottom edge of the rect.** Rows 43–47 contain the derrick at x 0–15 and
the coach and driver at x 226–284. Both are warm and both belong to other
specs. Anything this region draws must stop at the skyline.
