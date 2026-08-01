# Room 01 — region spec: TOWN

Region rect: **(60, 30, 120, 38)** native — x 60–179, y 30–67.

Bar: `reference/room-01/image-B-bar-320x144.png`. All measurements below are taken
from that file. Luminance is `0.299R + 0.587G + 0.114B` on the raw bar; palette
names are from `art/palette/consolation-256.json` via `tools/pixelart/palette.py`.
Study crops: `work/room-01-study/town/`.

**Content overruns the rect in two directions.** The town's lowest lit windows sit
at y=68, one row below the rect. Two outlying lights at x=40–47, y=48–49 (a cabin
on the west ridge) belong to whoever owns x<60. Roughly seventeen stars fall inside
the rect at y=30–38; they belong to the sky region, not to this one.

---

## 1. What this region is, and what it has to do

Consolation, seen from two miles out and several hundred feet above, at night.
It is the destination named on the signpost in the foreground and it is the only
reason the scene has a subject. It must read, in one glance, as **a town** — not a
cluster, not a camp, not a constellation — and it must read as **far away and not
where the player is standing.**

The whole thing gets about 90 × 25 usable pixels. Roughly 60 lit windows stand in
for several hundred buildings.

The trap is that a town at night is made of the brightest marks in the frame, and
the brightest thing in this frame is Thad's lantern at x≈85, y≈84. The reference
solves this and it is worth stating up front how: **it does not make the town's
windows dimmer than the lantern.** They use the same top colour. It rations them.
See §7.

---

## 2. Elements, in draw order

Numbered back to front. Bounding boxes are native, inclusive.

1. **Hill backdrop.** x 60–179, y 38–68. Owned by the range region, but the town is
   painted onto it and cannot be composed without it. A flat, almost featureless
   dark mass. A sky notch — a saddle between two ridges — closes to a point at
   **(115–121, 42)**; the sky is visible down to y=42 in that gap and nowhere else
   across x 100–170. The town's densest window field sits directly under that saddle.

2. **Dark trough.** x 88–152, y 45–49. The darkest band in the upper half of the
   picture: mean L ≈ 15–16 at y 48–49, against sky L ≈ 30 above and town L ≈ 31
   below. Four to five rows of near-nothing. This is what makes the roofline read;
   without it the town has no top edge. It is an element, not an absence.

3. **Town mass silhouette.** x 62–150, y 50–68 (visible portion; it continues left
   behind the foreground and enters the rect already in progress at x=60).
   Top edge is nearly flat at **y = 51 ± 2** from x=89 to x=140, ragged by two or
   three pixels where chimneys and gable peaks poke up. From x=140 the edge falls
   away to y ≈ 57 at x=148 and y ≈ 62 at x=152. Base at y=68.

4. **Roof-highlight stipple.** Within the mass. About 320 pixels, ~157 horizontal
   runs, **mean run length 2.06 px** — 106 of the 157 runs are a single pixel,
   22 are two. This is the texture that reads as "hundreds of roofs".

5. **Legible roof strokes.** Seven horizontal highlight runs of 6–9 px, which are
   the only marks in the town that read as an individual building's ridge:
   x 107–112 y=55, x 102–109 y=58, x 110–116 y=59, x 122–130 y=60, x 92–97 y=62,
   x 121–126 y=62, x 140–145 y=64. Nothing else in the town is longer than 5 px.

6. **Mine headframe — tower.** x 82–89, y 42–53. Read carefully: the tower has
   **no silhouette contrast at all.** Its body measures mean L 17–22; the hill
   behind it measures 15–20. It is drawn dark-on-dark and made legible entirely
   by items 7–9.

7. **Headframe cap.** A 4-px cool bar at **x 85–88, y=42** (L 42–59), plus one
   stray at (82, 42). The moonlit top edge of the structure.

8. **Smoke plume.** Four pixels: (85, 40) at L 42, and (84, 41)(85, 41)(86, 41)
   at L 38 / 59 / 51. It leans very slightly left as it rises and stops. **L=59 is
   the brightest cool value anywhere in the region** — the plume outranks every roof.

9. **Aerial tramway.** A single-pixel stepped diagonal from **(85, 44) to (99, 52)** —
   about 14 across, 8 down, roughly 30°. Drawn at L 27–31 against hill at L 20–21:
   **+8 luminance, and no more.** It is meant to be almost invisible and to reward
   a second look. Do not strengthen it.

10. **Headframe windows.** Four stacked lights in a 6-px-wide column, y 43–50:
    (87–88, 43–44), (83–84, 46–47), (83–84, 50), (87–88, 50). This vertical stack
    over eight rows in a narrow column is the *only* one in the picture, and it is
    what makes the headframe read as tall rather than as more town.

11. **Window field.** x 74–165, y 44–68. See §4.

12. **Window haloes.** One pixel of warm bleed around the brighter windows only.
    See §3.

13. **Hot cores.** Twenty-four pixels of the frame's ceiling colour, scattered.
    See §7.

14. **Moonlit foot band.** y 67–68, brightest across x 139–155 and x 164–179
    (L 31–37, ~+8 over the rows either side). Shared boundary with the mid-ground
    region: this is the far bank the town stands on, and the town's lowest windows
    sit directly on top of it.

**Occluded by the foreground and therefore not drawn:** the rail/crossbeam covers
x ≤ 84 at y 53–58; the signboard covers x ≤ 78 below y=60; the hanging lamp and its
post cover x 75–81, y 62–72. The town behind all of that is simply absent from the
bar. Do not paint it in and then cover it.

---

## 3. Value structure

Measured means over cool (non-window) pixels. The whole region lives inside a
17-luminance-point band, and everything in §2 is achieved inside it.

| Band | Rect sampled | Mean L | Notes |
|---|---|---|---|
| Sky above the ridge | x60–179, y30–37 | **30.2** | flat, ±2 |
| Far range crest | x120–179, y38–43 | 22.8 | peaks to L 48–69 — neighbour's element |
| Hill backdrop behind town | x100–179, y44–51 | **17.7** | median 17 |
| Dark trough | x88–152, y48–49 | **14.9** | the darkest band above the road |
| Town mass, cool pixels only | x88–145, y52–68 | **26.1** | median 24 |
| Town mass, all pixels | x88–145, y52–68 | 35.3 | windows included |
| Roof highlights | in-mass | 32–52 | brightest single roof px L=52 |
| Plume | (84–86, 40–42) | up to **59** | brightest cool mark in the region |
| Foot band | x110–175, y67–68 | 31–37 | |
| Window ramp | — | 38 → **126** | five steps, see §5 |

**The single most important number in this table is that the town is only 5 to 8
luminance points brighter than the hill it sits on.** It is not separated by value.
It is separated by **texture frequency**:

| | mean abs neighbour-pixel ΔL, horizontal |
|---|---|
| Sky | 2.31 |
| Hill behind town | **1.35** |
| Town mass | **14.29** |
| Hill east of town (x150–179) | 4.05 |

A 10× difference in local roughness against near-identical mean value. That ratio,
not the silhouette and not the brightness, is what says "town".

**Glow.** Around the hottest window pixels: ring at r=1 averages L 40.5; ring at
r=2 averages 28.7; town background is 25.4. So each bright window gets **exactly one
pixel of warm bleed and then stops.** A window's total light footprint is 3×3.
For comparison, the lantern is still throwing L 40–50 at a radius of 19 pixels.

---

## 4. The window census

Counted as connected warm components (R−B ≥ 14). **57 cores at the bright threshold,
61 lights including their dim spill.** Call it sixty.

**Extent:** x 74–165, y 44–68.

**Footprints** (57 cores):

| shape | count | share |
|---|---|---|
| 1×1 | 24 | 42% |
| 2×1 | 12 | 21% |
| 1×2 | 11 | 19% |
| 2×2 | 5 | 9% |
| 3×2 / 2×3 / 2×4 | 4 | 7% |
| 6×2 (the one storefront strip, x140–145 y66–67) | 1 | 2% |

Nothing larger. Horizontal pairs and vertical pairs are used almost equally —
there is no orientation convention, and imposing one will look like a pattern.

**Spacing.** Median nearest-neighbour distance between window centres **3.2 px**;
minimum **2.0 px**. No two windows ever touch — there is always at least one dark
pixel between them. 56 distinct columns are used across a 91-px span, so only about
60% of columns carry a light at all.

**Alignment.** The most any single row holds is **7 of 57**. Rows y=50 through y=68
each carry between 1 and 7. There is no grid, no storey line, no repeat. Windows
within the four or five legible buildings loosely share an edge; everywhere else
they are placed individually.

**Density falls off eastward, hard.** Lights per 10-px column band, x=70 → x=179:

```
3   8   7   9   9   6   9   5   3   1   1
```

Uniform at 7–9 per band from x=80 to x=139, then 5, then 3, then singles. East of
x=150 there are just five isolated lights: x=148, 150–151, 156, 158, 164–165, 174.
The one at **(164–165, 59–60)** is the far outlier and it is one of the brightest —
a single lit building on the edge of the settlement, alone on a smooth dark hill.

**Density rises toward the bottom.** Bright window pixels per row climb from 5 at
y=50 to 11–13 at y=63–67. The near edge of town is brighter and busier than its
upper terraces; that is the perspective cue.

**Colour.** Median saturation of the bright window pixels is **0.59**; 96% are above
0.40. R:B ratio median 2.46. These are unambiguously amber. Four percent are
desaturated (a couple of pale, curtained-looking lights around L 58–82) and that
small handful is the entire colour variation — do not spread it.

**Brightness spread.** Peak luminance per light: min 44, quartile 70, median 87,
upper quartile 97, max 126. So the windows are genuinely varied in brightness across
a factor of three, and only **14 of 60** reach the top colour at all.

---

## 5. Locked-palette families

From the proof (`image-B-in-locked-palette-320x144.png`), which reaches this region
in a very small number of indices. The proof's entire frame uses 54 indices, and the
town band uses **51** — but 92% of the band's area is just five of them.

**Cool structure — 6 values, and they carry everything:**

| use | family / step | L |
|---|---|---|
| sky above the ridge | `accent_indigo` 1 | 35.0 |
| hill backdrop, dark wall mass | `accent_indigo` 0 | 21.7 |
| dark trough, deepest gaps between buildings | `grey` 0 | 16.0 |
| walls in shade | `grey` 1 | 24.5 |
| lit wall / mid-tone roof plane | `grey` 2 | 32.5 |
| roof highlight | `grey` 3 | 40.6 |
| the few brightest roof pixels, and the plume | `grey` 4 | 53.5 |

Note the hue split: the sky and the far hill are `accent_indigo` (saturation 0.6 —
genuinely blue); the buildings are `grey` (saturation 0.11 — almost neutral). That
difference is doing real work. The town is a *grey* thing standing on a *blue* thing
at nearly the same value, which is why it reads as material rather than atmosphere.

**Warm window ramp — five steps plus a rationed ceiling:**

| use | family / step | L |
|---|---|---|
| outermost spill / dimmest windows | `mud` 5–7 or `umber` 6–7 | 38–50 |
| window body, low | `mud` 9–10 / `umber` 10 | 60–69 |
| window body, mid | `pine_fresh` 5–6 | 70–79 |
| bright | `ochre` 8 | 85.0 |
| near-hot | `umber` 14 | 98.2 |
| **hot core — rationed** | **`ochre` 13** | **126.0** |

`ochre` 13 is the **ceiling of the entire picture**. Nothing in Room 01 — not the
lantern, not the coach lamps, not a star — goes above it. Six brighter steps of the
ochre ramp exist and are deliberately unused. Do not reach for them here.

The `umber` / `pine_fresh` / `ochre` steps are chosen to sit at similar values with
different saturation (umber 14 sat 0.46, ochre 8 sat 0.72, pine_fresh 6 sat 0.62),
which is how the reference gets sixty windows that all read as lamplight without
sixty of them being the same colour.

---

## 6. Technique — how the reference suggests hundreds of buildings

- **Texture, not drawing.** The town is a patch of high-frequency noise (ΔL ≈ 14 per
  pixel step) laid over a smooth field (ΔL ≈ 1.4). Nothing in it is drawn as an
  object except the headframe and about five buildings. Compose it as a *material*
  and then carve five landmarks out of it.

- **Highlights are stipple, not lines.** Two-thirds of all roof highlights are single
  isolated pixels. Mean run 2.06 px. The seven 6–9 px runs listed in §2.5 are the
  entire budget of "this is a specific roof". Every additional long run costs a
  building's worth of ambiguity.

- **Roof edges are hard, and there are almost none of them.** Where a highlight run
  does exist it is a clean horizontal run of one value with no ramp underneath —
  no soft roof planes, no gradients on a roof. But a roof only gets an edge if it is
  one of the seven.

- **No dither.** Tested for parity bias in the sky and hill: none. The sky and hill
  are flat fields with low-amplitude noise, not ordered patterns. The town has no
  dither either — its texture comes from placing individual pixels, not from a screen.

- **Nothing glows collectively.** There is no haze, no lift, no bloom over the town.
  The four rows immediately above the roofline are the *darkest* band in the top half
  of the frame. A town at night wants to be given an atmospheric glow. The reference
  explicitly does the opposite, and that is why the town sits back in space.

- **The headframe is built out of three marks, not a shape.** A 4-px cap, a 4-px
  plume, and a vertical stack of four small windows in a 6-px column. Its body is the
  same value as the hill. It works because nothing else in the picture stacks windows
  vertically.

- **The east end dissolves rather than ending.** Roughness drops from 14 to 4.5 at
  x≈150 and the mass stops, but five isolated lights continue to x=174 across smooth
  dark hill. The town has no right-hand edge; it has a thinning.

---

## 7. Brightness relative to the lantern — the governing constraint

Thad's carried lantern at x≈85, y≈84 must remain the brightest and only fully warm
thing in the frame. It is not achieved by making the windows dim. Measured:

| | warm px | hot px (`ochre` 13) | largest contiguous hot blob | integrated excess luminance* |
|---|---|---|---|---|
| **Whole town** | 227 | **24** | **2 px** | **11,094** |
| Lantern (lamp + ground pool) | 1,456 | **107** | **66 px** | **65,664** |
| Lantern lamp alone | 171 | 23 | 22 px | 8,074 |
| Signpost hanging lamp | 131 | 12 | 11 px | 5,678 |

\* sum of (L − 22) over warm pixels.

Read that as four separate facts, all of which must hold:

1. **Per-pixel peak is identical.** A town window and the lantern both top out at
   `ochre` 13, L=126. Darkening the windows to "keep them behind the lantern" is the
   wrong fix and will make the town look like it is under a different sky.

2. **The lantern outweighs the entire town by 6×** in integrated light, and one town
   window by roughly 360×. A 12 × 12 patch of the frame carries more warm light than
   the 100-px-wide town.

3. **The town is never allowed to pool.** Its 24 hot pixels sit in 21 separate blobs,
   and **the largest is two pixels.** The lantern's are in two blobs of 22 and 66.
   The rule is mechanical: *in this region, the ceiling colour never appears more
   than twice in a row and never in a 2×2.*

4. **Falloff.** A town window is back to background luminance at radius 2. The lantern
   is still at L 40–50 at radius 19.

Squint test (mean luminance per 4×4 cell): the town's brightest cell is **63** and its
typical bright cells are 40–50. The lantern's cells run **107–120**. If a 4× box-blur
of the finished region produces any cell above about 65, the town has taken light that
belongs to Thad.

---

## 8. Interactions with neighbouring regions

- **Range behind (above and right).** The town cannot be composed before the hill is,
  because the town's separation from it is 5 luminance points and depends entirely on
  the hill being smooth. If the hillside gets texture, the town disappears into it.
  The saddle at (115–121, 42) and the dark trough at y 45–49 are shared boundary
  features — the trough in particular reads as the range's foot and as the town's
  headroom at the same time, and neither region can move it alone.

- **Mid-ground below.** The moonlit foot band at y 67–68 is the seam. The town's
  lowest windows sit directly on it with no dark break. It runs one row past the
  bottom of this rect.

- **Foreground.** The rail (y 53–58, x ≤ 84), the signboard (x ≤ 78, below y=60) and
  the hanging lamp (x 75–81, y 62–72) occlude the town's western third. That hanging
  lamp is an 11-px hot blob sitting 6 pixels from the town's lower-left corner — the
  brightest neighbour this region has, and the reason the town's west end is written
  off rather than detailed.

- **Sky.** Seventeen stars fall inside this rect above y=38. They are not this
  region's marks, but they set the ceiling for how bright an isolated warm speck may
  be up there, and the town's isolated eastern lights must not be confused with them.

---

## 9. What will go wrong

Every item here is a mistake this specific region invites.

1. **The windows will be too bright as a field, and steal the lantern.** Not because
   any one is too bright — because there will be too many at the top of the ramp, or
   two of them will end up adjacent. Only 14 of 60 lights reach `ochre` 13, and only
   24 pixels total. Check the number, then check that no hot blob exceeds 2 px, then
   run the 4×4 squint and confirm nothing exceeds ~65.

2. **A grid will appear.** Placing windows by storey and bay is the natural way to
   draw a building and it is fatal here. Measured: max 7 lights on any one row out of
   57; only 60% of columns carry a light; median spacing 3.2 px with a hard minimum of
   2. Any two rows of four aligned windows will look like a hotel and break the scale.

3. **Buildings will be drawn as boxes.** The reference contains about five legible
   buildings and one storefront strip. Everything else is a texture field with no
   object boundaries. Drawing forty little houses at 3×4 px produces a toy village.

4. **Roof lines will be drawn as lines.** Two-thirds of highlight runs are one pixel.
   Long clean rooflines read as a modern skyline and, worse, as *aligned*, which
   destroys the "hundreds of buildings on a hillside" reading.

5. **Somebody will add a glow.** A haze over the town, a lift in the sky behind it, a
   warm bloom on the hill. All three are wrong. The band directly above the roofline
   is the darkest thing in the upper half of the picture, on purpose.

6. **The headframe will get a silhouette.** It is the most interesting object in the
   region and the instinct is to make it visible. It is dark-on-dark, within 2
   luminance points of the hill, and it reads only through its cap, its plume, and a
   vertical stack of four windows. Give it a rim light and the town becomes its
   backdrop instead of its subject.

7. **The tramway diagonal will get stronger.** It is +8 luminance over the hill. It is
   supposed to be a thing you notice on a second viewing. At +20 it becomes a
   compositional line pointing at nothing.

8. **The town will be given a right-hand edge.** It thins out over 30 pixels and
   terminates in five isolated lights, the last at x=174. A clean edge at x=150 makes
   it look like a stage flat.

9. **The value range will be widened.** The whole cool structure of this region lives
   between L 15 and L 53 — six palette steps. Reaching for `grey` 5–7 or `sky` 2–4 to
   "make the roofs read" will blow the region forward in depth and put it in the same
   plane as the coach.

10. **The occluded west end will be painted.** The bar simply has no town behind the
    signboard and rail. Painting it and then covering it wastes the pass and risks
    a pixel of it surviving at the edges of the foreground silhouettes.
