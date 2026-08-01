# Region spec — `range`

**Rect:** `(0, 20, 320, 40)` — native 320×144 coordinates, so rows y=20 through y=59.
**Bar:** `reference/room-01/image-B-bar-320x144.png`. Every number below is measured off that
file. Image A was used only to resolve what an ambiguous mass was, never for detail.

Luminance throughout is Rec.709 (`0.2126R + 0.7152G + 0.0722B`) on the 0–255 scale.
"Blueness" is the raw `B − R` difference, used as the atmospheric-perspective index — it
turns out to be the load-bearing measurement in this region, more than value is.

---

## 1. What this region is

The mountain ranges behind Consolation, seen at night from the stage road. They occupy the
middle band of the frame: sky above them, the lit town and the coach in front of them.

The rect is larger than the subject. Rows 20–28 are still sky; the terrain does not break the
sky anywhere above y=29, and it has been handed off to the town and the foreground by y=52.
**All the mountain lives in 23 rows, y=29 to y=52, and the average crest sits at y=38.**

What it has to communicate at 320×144, in order of importance:

1. **Depth.** Enough recession that the town reads as sitting in a bowl with country behind it.
2. **A quiet horizon.** This is the establishing shot of a comedy about a town nobody wanted to
   arrive at. The skyline is scenery, not drama. Nothing up here should attract the eye.
3. **A dark backdrop for the town lights.** The near range is what the ~90 warm window pixels
   read against. Its darkness is doing structural work for a neighbouring region.

It communicates all three with **two mountain layers and one lit face.** Not four ranges, not
six. Two.

---

## 2. Layers, in draw order

Each layer is a filled silhouette painted over the one behind it. There is no transparency, no
haze overlay, no gradient between layers.

### Layer 0 — sky (belongs to the `sky` region; listed for the boundary contract)

The sky brightens toward the horizon: mean L 22.5 at y=20 rising to 29.8 at y=36–38. Measured
sky immediately above the crest is L 30.3, blueness +59. That upward gradient is what gives the
skyline its edge, and it must survive: the crest is at its lowest in mid-frame, which is exactly
where the sky is brightest, so the contrast is highest where the mountains are least tall.

Stars stop at the skyline. Measured across y=20–50: no bright speck sits on a mountain
silhouette; the lowest star is at y=36 and it is over open sky.

### Layer 1 — far range

Runs edge to edge, x=0 to x=319, unbroken. One flat colour.

**Skyline as a function of x** (crest = topmost terrain row):

| statistic | value |
|---|---|
| mean height | y = 38.0 |
| highest point | y = 29 (at x ≈ 27) |
| lowest point | y = 43 (at x ≈ 195–210) |
| total amplitude | 14 px |
| standard deviation | 3.7 px |
| visible band thickness (crest to the near range below) | median 7 px, p10 3, p90 10, max 13 |

**Envelope by sixths** — the crest is not level; it has a pronounced left-high tilt with a
central recovery:

| x span | mean crest y |
|---|---|
| 0–60 | 31.9 (highest ground in the frame) |
| 60–110 | 38.7 |
| 110–140 | 40.9 |
| 140–178 | 36.6 (the central peak) |
| 178–222 | 41.9 (lowest ground in the frame) |
| 222–290 | 38.9 |
| 290–320 | 40.4 |

**Summits**, as (x, y): 27/29 · 49/31 · 81/38 · 101/38 · 132/39 · 143/36 · **155/34** ·
185/41 · 203/42 · 226/37 · 262/36 · 273/37 · 299/39.

Peak-to-peak spacing averages 22.7 px, range 11–36. Peak-to-saddle vertical amplitude averages
**3.0 px** and never exceeds 9 px. Read that twice: a typical "peak" on this range is three
pixels tall.

**Spectral content.** A DFT of the crest gives amplitudes of 2.9 px at wavelength 320 (the
overall tilt), 2.8 px at 107, 1.9 px at 160, 1.3 px at 64, 1.0 px at 53 — and **nothing above
0.8 px at any wavelength shorter than 36 px.** The silhouette is a sum of three or four broad,
slow humps. It has no high-frequency content at all.

**Character: smooth, not jagged.** 63% of adjacent column pairs are flat (dy = 0), 34% step one
pixel, ~1% step two, none step more than two. Flat runs along the crest have median length
2 px (mean 2.7, max 8). The mean slope over an 8-px window is 0.24 px/px (13°); the steepest
sustained slope anywhere is 0.62 px/px (32°), at x≈55–65 and x≈168–176. Summits are shallow
cones and rounded shoulders, never spikes.

**Body: flat.** Sampling 855 pixels immediately beneath the crest gives 22 nominal RGB values,
all within ±2 of each other and the top six within one luminance point. There is no gradient
down the mass, no ridge shading, no cast shadow, no texture. It is one colour.

### Layer 2 — near range, dark mass

Also runs edge to edge, but is visible only where the foreground doesn't eat it (see §6).

| statistic | value |
|---|---|
| mean crest height | y = 44.7 |
| highest point | y = 35 (at x ≈ 27, directly under the far range's highest peak) |
| lowest point | y = 49 |
| amplitude | 14 px |
| standard deviation | 3.4 px |
| mean crest step per column | 0.27 px — **smoother than the far range** |
| max crest step | 3 px |

**Envelope by band:** x0–60 mean 39.3 · x60–110 45.5 · x110–145 44.8 · x145–180 44.9 ·
x180–222 47.1 · x222–300 47.4 · x300–320 47.6. It rises to meet the frame on the left and lies
almost flat across the right two-thirds.

**Overlap with layer 1.** The vertical gap between the far crest and the near crest averages
**6.7 px**, range 1–13. That gap is the entire depth cue. The two crests are correlated (both
peak near x=27, both sag right of x=180) but not parallel — the near crest is flatter, so the
gap widens from ~4 px on the left to ~10 px on the right.

**Body:** flat, same as layer 1, with one exception.

### Layer 3 — the lit face (interior modelling on layer 2's central massif)

The one place in the region with more than one value inside a single mass. A triangular moonlit
face on the near range's central summit:

- **Apex at (157, 42)**, two pixels wide.
- Widens by roughly 2 px per row on each side: x=156–161 at y=43, x=153–163 at y=44,
  x=151–163 at y=45, reaching a base spanning x≈146–172 by y≈49.
- The upper-left of the triangle takes the bright step; the right flank takes a mid step one
  notch down. Two values, hard-edged between them.
- Darker layer-2 ridges cross **in front of** the base, entering from x≈138–147 on the left and
  x≈171 onward on the right, cutting the triangle off at the bottom.

Its apex sits **8 rows below** the far range's central summit at (155, 34) and is offset 2 px
right. That offset — a nearer, lower, brighter cone tucked under a farther, taller, darker one —
is what sells the recession in the middle of the frame. It is also the only place a viewer can
see three depths at once.

Nothing else in the region gets internal modelling.

---

## 3. Value structure and how depth is expressed

Measured layer colours (k-means over the terrain band, k=6, three sky clusters discarded):

| layer | RGB | L | blueness (B−R) | share of band |
|---|---|---|---|---|
| sky at the crest | (21, 28, 80) | **30.3** | **+59** | — |
| far range | (13, 19, 52) | **20.1** | **+38** | 25.4% |
| near range, dark | (10, 12, 30) | **13.2** | **+20** | 15.4% |
| near range, lit face (bright step) | (23, 22, 42) | **23.7** | **+19** | 7.7% |
| near range, lit face (mid step) | (18, 19, 41) | 20.4 | +23 | — |

**Value gaps:**

- sky → far range: **10.2 L**. The only hard value edge in the region, and the only one that
  needs to be legible.
- far range → near range: **6.9 L**. Deliberately weaker — about two-thirds the sky step.
- near dark → near lit: **+10.5 L**, upward.

**The mechanism is chroma, not value.** Blueness runs 59 → 38 → 20/19: it roughly halves at
each step back toward the viewer. Value only drops 10 then 7 and then goes *up* again — the lit
face at L 23.7 is **3.5 points brighter than the far range** and still unambiguously reads as
nearer, because it is neutral where the far range is blue. That inversion is the whole trick.
Atmospheric perspective here is "more air = more blue", with darkness as a secondary effect.

**The absolute range is tiny.** From the brightest sky in the region to the darkest mountain is
L 30.3 down to L 13.2 — seventeen points, under 7% of the 0–255 scale. Every colour named above
has channel values between 0x08 and 0x20. This is a picture made entirely of near-blacks.

---

## 4. Locked-palette families and ramp steps

Verified against `image-B-in-locked-palette-320x144.png` by classifying on the bar and tallying
the index the proof actually chose.

| layer | family | ramp step | index | hex | L | proof agreement |
|---|---|---|---|---|---|---|
| sky | `accent_indigo` | 1 | 238 | `#1c2045` | 33.8 | 98.7% |
| far range | `accent_indigo` | 0 | 237 | `#10142d` | 21.0 | 95.8% |
| near range, dark | `grey` | 0 | 177 | `#101010` | 16.0 | 44% (see below) |
| near range, lit mid | `grey` | 1 | 178 | `#18181c` | 24.3 | 22% |
| near range, lit bright | `grey` | 2 | 179 | `#202024` | 32.3 | 11%, apex pixels only |

**The palette constrains the layer count, and it constrains it correctly.** `accent_indigo`
step 0 (`#10142d`) is the darkest blue in the locked 256. There is nothing between it and black
in that family. Anything darker than the far range has to leave indigo and land in `grey`,
`umber` or `mud` — i.e. it has to go neutral or warm. That is precisely what the reference does
on its own: the near range measures at blueness +20 against the far range's +38. Palette and
target agree, which is why 54 indices reach this image at mean distance 8.9.

Step sizes the palette gives you: 238→237 is 12.9 L (target wants 10.2) and 237→177 is 5.0 L
(target wants 6.9). Both are within a couple of points. **Do not manufacture intermediate
colours to close those gaps.** The palette is locked and the approximation is already better
than the eye resolves at these luminances.

**The one ambiguity to guard against:** in the proof, near-range dark pixels split 44% to
`grey` 0 and 42% to `accent_indigo` 0 — the quantiser cannot reliably tell them apart, because
they are 5 luminance points and one hue family away from each other. When we draw this, the
near range must be *explicitly* `grey` 0 and the far range *explicitly* `accent_indigo` 0. If
we let a nearest-colour pass decide, half the near range will collapse into the far range's
index and the two layers will merge into one shapeless mass.

---

## 5. Technique

- **Hard-edged silhouettes throughout.** The crest transition from sky to far range is 0 or 1
  rows wide. The far-to-near boundary is likewise 0 or 1 rows. Where a single blend pixel
  appears it is an artifact of the source render, not a designed edge.
- **No dithering anywhere.** Checkerboard 2×2 blocks account for 0.67% of the terrain band —
  noise, not technique. There is no dithered gradient at the top of any range, no stipple where
  layers meet, no gradient dither into the sky.
- **No anti-aliasing.** Every silhouette is 1-bit against what's behind it.
- **Flat fills.** Layer 1 is one colour. Layer 2 is one colour plus the single lit face. No
  ridge lines, no scree, no snow, no rim light on the crest.
- **Stepping.** Crests advance in 1-px steps separated by flat runs of median 2 px. That
  cadence (step, run two, step, run two) is the texture of the whole region and is the only
  "detail" it has.

---

## 6. Boundaries with neighbouring regions

**Sky (above).** The sky's horizon-ward brightening is a shared dependency: flatten it and the
crest loses its edge in mid-frame, where the crest is lowest and the mountains are relying on
the sky being brightest. Stars terminate at the skyline — none may be drawn over terrain.

**Town (below, x ≈ 105–215).** The near range's dark mass does not stop at the town's roofline;
it continues down behind the town to y≈62 and the warm window lights are painted directly onto
it. It is the town's backdrop. If the near range is lightened by even a couple of steps, the
town's ~90 lit pixels lose their contrast and the town stops reading as a town.

**Where the range meets things, measured per column:**

| x span | what the range meets | median meeting row | spread |
|---|---|---|---|
| 0–105 | town roofline and the sign structure | y = 51 | 40–60 |
| 105–215 | town behind, lights sit on the mass | y = 62 | 50–69 |
| 215–320 | the stagecoach roof | y = 47 | 43–68 |

The base is therefore **not a line.** It is cut at three different heights by three different
things.

**Foreground occlusion.** The sign structure at x≈0–15 covers the near range from y≈42 down.
The stagecoach covers it from x≈226 to x≈300 — across that 74-px span **only the far range is
visible**, sitting above the coach roof between y≈37 and y≈45. The near range reappears at
x≈300–320 and runs off the right edge at y≈47–49.

**Frame edges.** Both mountain layers run off the left and right edges — neither closes inside
the frame. At the extreme left (x 0–6) and right (x 313–319) the far range body measures one
luminance point darker and seven points less blue than its interior, a slight edge darkening.
In the locked palette it collapses to the same index. Do not try to reproduce it.

---

## 7. What will go wrong

Specific, in the order they are likely to happen.

1. **Too many layers.** The instinct on a mountain backdrop is four or five ranges receding into
   haze. There are **two**, plus one lit face. The palette will not support a third — there is
   no indigo step between `#10142d` and black — so a third range either duplicates the far
   range's index (invisible) or jumps to neutral grey (which is the *near* range, so the depth
   order inverts). Count the layers before drawing anything.

2. **Too much value separation.** Everything here is between L 13 and L 30. Drawn "so the layers
   read clearly" this becomes a daylight range. The correct sky-to-far-range step is 10
   luminance points on a 255 scale; the correct far-to-near step is 7. Both will look
   insufficient in an editor at 8× and both are right on a Chromebook panel at native size.

3. **Expressing depth with value alone.** The measured mechanism is chroma halving: blueness
   59 → 38 → 20. If the near range is only made darker without being made greyer, it stops
   reading as a nearer hill and reads as a hole in the picture. The proof of this is the lit
   face: it is *brighter* than the far range and still reads nearer, purely because it is
   neutral.

4. **Jagged silhouettes.** Sawtooth peaks at 4–8 px spacing are the default mental image of a
   pixel-art mountain and they are wrong here. Measured: nothing above 0.8 px amplitude at any
   wavelength under 36 px, 63% of columns flat, mean slope 13°. At 320×144 a jagged crest
   degrades into what looks like dither noise, and it drags the eye up to the horizon — which
   is the opposite of what this shot wants.

5. **Peaks too tall.** The typical peak stands **3 px** above its neighbouring saddle; the
   tallest stands 9. The whole crest varies by 14 px across 320. Any summit taller than about
   6 px above its saddles is out of character.

6. **Dithering the skyline or the layer boundary.** Zero dithering measured. A dithered crest
   reads as a rendering fault at this resolution, and it introduces exactly the kind of
   pseudo-motion texture that the cycling doctrine (invariant 9) exists to keep out of
   backgrounds.

7. **Internal modelling on the far range.** It is one colour across 855 sampled body pixels.
   Adding ridge shading fills a 7-px-tall band with 1-px value noise that competes with the town
   lights immediately below it.

8. **Drawing the near range across the right third.** From x≈226 to x≈300 the stagecoach hides
   it completely. Time spent shaping it there is wasted, and — worse — if it is shaped as though
   visible and then occluded, the crest we *do* see above the coach will have been drawn to
   relate to something the player cannot see.

9. **A straight base line.** The near range's bottom is cut by the town roofline at y≈51 on the
   left, runs down behind the town to y≈62 in the centre, and is cut by the coach at y≈47 on the
   right. Terminating the mass at a constant y turns the mountains into a wallpaper strip.

10. **Letting the quantiser pick the near range's index.** Half of it will land on
    `accent_indigo` 0 and merge with the far range. Assign `grey` 0 explicitly.

11. **Stars over the mountains.** Measured: none, down to y=36. A star on a silhouette is the
    single most visible way to destroy the depth read in this region.
