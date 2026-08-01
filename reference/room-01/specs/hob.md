# Region spec — `hob`

Region rect: **(64, 56, 64, 64)** native — x 64–127, y 56–119.

Bar: `reference/room-01/image-B-bar-320x144.png`. Every measurement below is taken
from that file. Luminance is `0.299R + 0.587G + 0.114B` on the raw bar, quoted on
0–255. Palette names are from `art/palette/consolation-256.json` via
`tools/pixelart/palette.py`. Study crops: `work/room-01-study/hob/`.

Image A was consulted **only to identify blobs** — what the moustache is, how the
lantern is built, that the small warm mark at x 105–107 is a bare hand and not a
coat button. For this region the two frames register closely (B is very near a
straight resize of the whole of A; residual mean error 4.4/255), so A is reliable
for *identification*. It is not used for any number in this spec.

**Content overruns the rect on all four sides.** The light pool is 76 px wide and
leaves the rect at x=64 and again at x=124. The road plane it falls on belongs to
`road`. The signpost's own hanging lantern sits inside this rect at x 74–81 but
belongs to `left_yard`. The fence line behind the figure enters from `left_yard`
and leaves into `rail`. The town's lit windows occupy the top fourteen rows and
belong to `town`.

---

## 1. What this region is, and what it has to do

A man in a long coat standing on the stage road at night, holding a kerosene barn
lantern out to his left, and the pool of warm light he stands in.

This is where the eye lands first and it is **the only warm light source the player
is meant to walk toward.** Everything else warm in the frame — the town, the coach
lamp, the sign's lantern — is scenery. This one is a person holding a thing.

Three jobs, in order of importance:

1. **Be the value anchor.** The pool's core runs L 123 against a road ambient of
   L 24–27. Nothing else in the frame carries a 100-point range inside 30 pixels.
   The whole picture is legible because this corner of it is.
2. **Read as a man, at 17 × 36 pixels, with almost no contrast on one side of him.**
   His far side is L 16–33 against a backdrop of L 33–45 — a separation of under ten
   points. He does not read by silhouette. He reads by **the lit edge on his lamp
   side, the face, and the black hole between his legs.**
3. **Sit on the ground.** The single most load-bearing structure in the region is
   the lit wedge of road visible *between* his legs — five pixels at the frame's
   top value. Without it he is a sticker.

He is deliberately **unremarkable**. He is not lit like a hero; only seven pixels
of him touch the top value.

---

## 2. Elements, in draw order

Back to front. Bounding boxes native and inclusive.

1. **Town strip.** y 56–70, full width of the rect. Dark building masses with 1–2 px
   warm window lights, peak L 123. Owned by `town`. Relevant here only as a ceiling:
   see §7.

2. **Hillside / backdrop behind the figure.** x 88–127, y 62–99. Cool blue-grey,
   mean L 37, range 26–45. This is what the man's far side has to fail to separate
   from. Owned by `range`.

3. **Sign's hanging lantern.** x 74–81, y 64–71, hung on a hook from the signpost
   gantry above. Warm core, **12 px at L 123**, with a glow reaching ~5 px. Owned by
   `left_yard`, but it lands inside this rect and its ceiling is this region's
   problem — see §7. It is the same object as Hob's lamp, one size smaller.

4. **Fence, left.** Post at **x 71–72, y 79–99**, lit down its right edge (mean
   L 48, peaks 65–72 at the cap and where the rail meets it). Its rail leaves the
   rect at x=64; the rail's lit top is the single row **y=84**, L 58–82 across
   x 69–82, with a second and much weaker rail around y 90–91. Passes **behind**
   the lantern; the rail's right end runs into the lantern's glow at about x=80.
   Owned by `left_yard`.

5. **Fence post, right.** x 114–116, y 79–96 — three columns, lit / mid / dark left
   to right — with its top rail a **single row at y=82** running out of the rect.
   Owned by `rail` and specified there. It is the only vertical the eye finds on the
   man's dark side and it must not compete: lit column mean L ≈ 42.

6. **Road plane.** y ≥ 100 across the rect. Owned by `road`. Warm, 95 % of it in
   warm hue. The pool is painted into it, not on top of it.

7. **THE POOL.** Elliptical, centred **(86, 107)** — the ground point directly below
   the flame, **16 px left of the man's centre line.** Full extent to ambient:
   **x 50–122, y 94–120** (76 × 27 px). Semi-axes per value contour in §5.

8. **Lit wedge between the legs.** x 99–102, y 100–105, tapering upward. Contains
   five of the frame's L 123 pixels, at (99–102, 103) and (99, 104). This is the
   figure's contact with the ground.

9. **Contact shadow.** y=106, x 94–108. One row. The ground there measures L 25–48
   where the pool model predicts 77 — a drop of about four ramp steps, in one row,
   the width of both boots. There is **no other shadow** (see §6).

10. **Hob.** Overall bbox **x 92–108, y 71–106 — 17 wide, 36 tall.** Sub-parts:

    | # | part | box | note |
    |---|---|---|---|
    | 10a | hat crown | x 97–102, y 71–72 | 4 px at y=71, 6 px at y=72 |
    | 10b | hat brim | x 95–104, y 73–74 | 10 px on one row; left tip lit, right tip is the region's darkest pixel |
    | 10c | face | x 96–102, y 74–79 | 7 × 6 |
    | 10d | shirt collar | (98, 79) | **one pixel**, cool-neutral L 82 |
    | 10e | coat | x 92–108, y 80–99 | shoulders 12 px at y=80, widening to 17 px by y=89 |
    | 10f | coat front opening | x=99 at y 84–91, x 98–100 at y 92–99 | a black line 1 px wide that flares to 3 |
    | 10g | brass patch | (102, 82) | 1 px at L 87 |
    | 10h | right hand, hanging | x 105–107, y 89–91 | 2 px at L 123 |
    | 10i | left forearm / sleeve | x 88–93, y 81–84 | 2 rows, diagonal, the only thing joining man to lamp |
    | 10j | trousers | x 95–98 and x 103–107, y 100–104 | |
    | 10k | boots | x 94–98 and x 102–108, y 103–106 | right boot 1 px wider and set forward; both bottom out at y=106 |

11. **Hand on the bail.** x 84–87, y 78–81. Bare skin, brightest 2 px at L 123.
    Sits **above** the lantern and slightly above the shoulder — the arm is out and
    a little up, not hanging.

12. **Bail.** x 85–86, y 81–82. Two pixels. A wire loop, nothing more.

13. **Lantern hood / cap.** x 83–88, y 82–84. Dark against its own glow.

14. **Lantern globe.** x 82–89, y 85–89.

15. **Lantern base plate.** x 82–89, y 90–92. Wider than the globe by a pixel on
    each side; a lit strip at y=90, dulling to y=92.

16. **Flame.** The hot core of 14, roughly x 83–87, y 86–89. Painted in the reserved
    band — see §7.

Draw order note: **the lantern (items 12–16) is drawn after the lighting pass.** A
source is not a lit surface, and a reserved band assigned before the pass does not
survive it. Everything else in this region goes in before.

---

## 3. Value structure

All figures 0–255, `0.299/0.587/0.114`, measured on the bar.

**The frame's anchors**

| what | L |
|---|---|
| road ambient, outside the pool | 24–27 |
| backdrop behind the figure | 33–45 (mean 37) |
| pool core (flat plateau) | 123 |
| lantern globe / flame core | 123 |
| the region's darkest pixel (coat) | 1.5 |

In this reference the pool core and the flame are **the same value** — the bar's own
256-colour reduction clipped them together. In our build they must not be: the flame
lives in a reserved band that is brighter than anything else in the palette (§7), so
the pool core has to stay at or below L 123 and let the flame stand a step or two
above it. That is the correct relationship anyway; the reference just could not
express it.

**The figure — 449 px, seven value tiers**

| tier | L | share | what it is |
|---|---|---|---|
| black | 0–15 | 13 % | hat crown, coat opening, boot cores |
| deep | 15–28 | 23 % | far side of the coat, trousers |
| shadow | 28–41 | 27 % | coat body, near side of the trousers |
| mid | 41–53 | 19 % | coat's lit panel, brim's lit edge |
| lamp-side | 53–71 | 13 % | the warm rim down his left, sleeve, boot tops |
| light | 71–101 | 4 % | face mid-tones, brass patch, collar |
| highlight | 101–123 | **1.6 % — 7 pixels** | 5 on the face, 2 on the hand |

**Seven pixels.** Face at (97,75), (99,75), (100,76), (98,77), (99,79); hand at
(106,90) and (107,90). Nothing else on the man touches the top value. The
second-brightest value (L 87) covers 35 more.

**Separation, both sides of him**

| edge | figure L | against L | separation |
|---|---|---|---|
| far (right) contour, y 82–98 | 16–29 | 33–45 backdrop | **≤ 10 — melts, deliberately** |
| lamp-side (left) rim, y 82–98 | 46–66 | 33–45 backdrop | 20–33 — this is the reading edge |
| boots, y 100–106 | 8–25 | 86–123 lit road | 70–115 — this is why he plants |

The far contour dissolving is not a failure. It is how a man reads as *inside* a
night rather than pasted on one. The legibility gate is satisfied by the lit edge,
the face, and the feet-against-pool contrast, and by nothing else.

**The face, row by row** (x 96–102): brim shadow across y=74 with two lit pixels
punched through it; the widest lit band at y=75 (L 82–123, seven px); the moustache
darkening x 97–98 at y=76 while the cheek stays hot; jaw at y 77–78; chin plus the
one collar pixel at y=79. The eyes are not drawn — they are the gap between the
brim shadow and the cheek.

---

## 4. The lantern and its flame

Rings outward from the flame centre **(85, 87)**, mean luminance:

| r | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| all directions | 123 | 120 | 107 | 93 | 68 | 61 | 54 | 49 | 44 | 38 |
| against the backdrop only (the airborne halo) | — | — | — | — | 79 | 69 | 55 | 44 | 39 | 37 |

Two things follow.

**The falloff off the object is violent.** 123 → 68 in four pixels. The lantern is a
hard-edged object with a bright interior, not a soft blob. Rows r ≤ 3 are the glass;
r = 4 is already the hood, the base and the air.

**There is almost no glow in the air.** The airborne halo is back to backdrop
ambient (33–37) by r = 8–9. Straight up the column is interrupted rather than
graded — dark hood at y 83–84 (L 26–61), the lit hand at y 78–81, and by **y=77 the
backdrop is already at ambient, L 29.** The lamp throws its light *down*, onto the
road, and barely into the night at all. A soft radial bloom around the lantern is
the single easiest way to make this region look wrong.

**Construction, top to bottom:** bare hand gripping (x 84–87, y 78–81) → wire bail,
2 px (x 85–86, y 81–82) → dark hood (x 83–88, y 82–84) → glass globe, brightest
(x 82–89, y 85–89) → base plate, one px wider each side, with a lit strip on its top
row (x 82–89, y 90–92).

**Top-value pixel counts in the reference,** for scale calibration:

| where | px at L 123 |
|---|---|
| Hob's lantern, globe + base | **22** |
| hand on the bail | 2 |
| Hob's face | 5 |
| Hob's right hand | 2 |
| sign's lantern | 12 |
| the ground pool | 80 |
| town windows | 54 |
| coach half of the frame | 16 |
| **whole frame** | **167** |

---

## 5. The light pool — fitted falloff

This is the region's most important number set.

**Centre (86, 107).** Not under the man — under the *lamp*. His feet centre on
x ≈ 101; the pool centres fifteen pixels to their left.

**Aspect 2.4 : 1**, horizontal to vertical, measured consistently across six
contours. Define the elliptical radius

```
ρ = sqrt( ((x − 86) / 2.4)² + (y − 107)² )
```

**Fitted falloff:**

```
L(ρ) = 27  +  97 / ( 1 + (ρ / 6.2)² )        clamped flat at L 123 for ρ ≤ 3
```

Residual against the measured contours is under 3 L across ρ = 3 … 11; the real edge
falls off slightly faster than the fit past ρ ≈ 12, which is where the dither runs
out (§6). Ambient 27 is the road just outside the pool.

Read practically: **the pool's excess over ambient halves every 6.2 ρ-units** — that
is every 15 px horizontally, every 6 px vertically.

**Measured contours,** as semi-axes from centre (a = horizontal, b = vertical):

| L | a | b | mud step | reached at |
|---|---|---|---|---|
| 123 (plateau) | 7 | 3 | 18 | x 79–93, y 104–110 |
| 100 | 7 | 4 | 15 | |
| 86 | 9 | 5 | 13 | |
| 72 | 15 | 7 | 11 | |
| 60 | 20 | 9 | 9 | |
| 50 | 27 | 10 | 7 | |
| 42 | 32 | 11 | 6 | |
| 27 (ambient) | ~36 | ~13 | 3 | x 50–122, y 94–120 |

The upper half is slightly shorter than the lower half (b_up ≈ 11, b_down ≈ 13 at
the outermost contour) — the ground recedes, so the pool is a squashed ellipse
pushed a little toward the viewer.

**Hue and saturation across the pool.** Measured as median HSV per ρ bucket:

| ρ | 1–2 | 3–8 | 9–18 | 19–21 | 22+ |
|---|---|---|---|---|---|
| mean L | 120 → 111 | 97 → 64 | 57 → 43 | 37 → 33 | 33 |
| hue | 36° | 31 → 29° | 28–29° | 29° | **227–236°** |
| saturation | 0.59 | **0.62–0.66** | 0.49–0.60 | 0.57 | 0.30–0.48 |

**The pool does not desaturate as it falls off.** The hottest ring is the *least*
saturated (it washes toward pale gold); the most saturated ring is the mid-pool at
ρ 3–8; saturation stays above 0.49 all the way to ρ 21. Only past ρ ≈ 21 does the
hue flip cold, and that is not the pool fading — that is the moonlit road taking
over where the lamp stopped.

This is exactly what a lighting pass that steps along a family ramp produces, which
is fortunate: **the whole pool is one material at eight different value steps.**

---

## 6. Cast shadow, and the shadow that is not there

**There is no directional cast shadow.** Measured symmetrically about x=86 at
d = 4 … 40 across five ground rows, the right side of the pool is *brighter* than the
left at every distance — 78 vs 44 at d=28 on row 108, and so on. The ground to the
man's right is lit by the road and the coach, not darkened by him.

What actually exists is two things:

1. **A one-row contact shadow at y=106**, spanning the boots, x 94–108. It measures
   L 25–48 where the pool model wants 77 — about four ramp steps down, in a single
   row, and gone by y=107 which is back to L 86 across the whole width.
2. **An occlusion notch, not a shadow:** the man's body blocks the lamp, so the
   ground immediately behind him (x 108–115, y 100–106) sits a step below its
   neighbours. It is a subtraction from the pool, not a painted dark shape.

Drawing a long silhouette shadow stretching to the right would be physically
plausible and would destroy the frame — it would put a hard black wedge across the
brightest, most legible part of the picture.

---

## 7. Palette families and ramp steps

### The reserved band — read this before drawing anything

`content/rooms/stage-road.json` declares the `hobs_lamp` cycling element as
**accent_gold steps 4–7 = indices 225, 226, 227, 228**, bounds `(80, 76, 16, 16)`
(x 80–95, y 76–91). The engine rotates those four entries at runtime; that rotation
*is* the flame being alive.

- **Nothing else in the frame may use 225–228.** Not the sign's lantern. Not the
  town's windows. Not the coach lamp. Not the pool. Not the brass patch on his coat.
- **Every reserved-band pixel must be inside x 80–95, y 76–91.** The lantern's base
  plate reaches y=92 in the reference — that row must be painted in unreserved gold
  (224 or below), or the bounds and the object disagree.
- The band is *brighter than everything else in the palette*: 225–228 measure
  L 136 / 156 / 181 / 204, against a frame maximum of 123 everywhere else. So the
  flame will be genuinely the brightest object, which is right — but the band is
  loud, and **size is the only control we have over how loud.**

**Flame pixel budget,** calibrated to the reference's 22 top-value globe pixels:

| index | step | L | px |
|---|---|---|---|
| 228 | accent_gold 7 | 204 | 1–2 |
| 227 | accent_gold 6 | 181 | 3–5 |
| 226 | accent_gold 5 | 156 | 6–8 |
| 225 | accent_gold 4 | 136 | 10–14 |

Total 22–28 px, all inside x 82–89 / y 85–90. Anything larger and the cycle reads as
a strobe rather than a flame.

**The lantern's hardware** — hood, bail, glass frame, base plate, and the halo's
first ring — takes **accent_gold steps 0–3 (indices 221–224, L 41 / 66 / 90 / 113).**
Same family, below the reserve, so the object holds together and only the flame
moves.

### Everything else

Steps are ramp positions as `palette.family(name).at(step)` takes them — step 0 is
the darkest entry of the family.

| material | family | steps | measured L |
|---|---|---|---|
| road / the whole pool | **mud** | 3 → 18 | 27 → 123 |
| pool core, if a more golden note is wanted | ochre | 12–13 | 117–126 |
| face and hand | **ochre** | 2 → 12 | 40 → 117 |
| shirt collar (1 px) | dust | 8 | 82 — the one cool-neutral pixel on him |
| coat body, far side | **grey** | 0 → 3 | 16 → 41 |
| coat's blackest (opening, hat crown, boot cores) | void 0 / umber 0 | — | 0 / 9 |
| coat's lamp-side rim | **mud** | 7 → 10 | 49 → 66 |
| hat brim, lit tip | mud | 4 → 6 | 35 → 44 |
| brass patch (1 px) | accent_gold | 3 | 113 |
| fence rails, lit faces | **mud** or umber | 9 → 13 | 61 → 85 |
| fence rails, far faces | pine_weathered | 0 → 3 | 21 → 41 |
| sign's lantern | accent_gold | **≤ 3** | ≤ 113 — must sit below Hob's |

The pool maps to `mud` almost exactly: `mud.at(18)` is (150,117,81), L 122.8, which
is the reference's pool core to within a point, and the ladder runs about one mud
step per six luminance points down to `mud.at(3)` at ambient. The full ladder, core
outward: **18, 15, 13, 11, 9, 7, 6, 4, 3** — nine steps, eight visible bands.

### What must be warm-family from the start

Our lighting pass steps a colour along its own ramp and **cannot change hue.**
Anything the lantern warms therefore has to be authored warm before the pass. In
this region that is:

- **All of the road inside the rect** — y ≥ 100, x 64–127, every pixel. The pool
  spans x 50–122, so nothing on the ground in this rect is outside its reach. Author
  the whole band in `mud`. (The cool blue-grey flecks below y ≈ 112 are the `puddles`
  cycling element and belong to `road`; they are sources, not lit surfaces.)
- **The fence's lamp-facing faces**, x 64–92 — the left post's right edge and the
  top of both rails. `pine_weathered` cannot go golden; these faces must be `mud` or
  `umber`.
- **Hob's whole lamp side:** the coat's left two columns (x 92–95) from y 80 to the
  hem, the sleeve (x 88–93, y 81–84), the hat's left brim tip and crown edge
  (x 95–98, y 71–74), and the boots' left highlights.
- **The face, entire** — all of x 96–102, y 74–79, plus the right hand at
  x 105–107, y 89–91 and the brass patch at (102, 82).
- **The lantern and the hand on the bail**, x 82–90 / y 78–92.

The coat's right half, the backdrop, the sky and the far fence faces may and should
stay cool. That is the frame's only real colour event: one warm island in a cold
picture.

---

## 8. Technique

**Where a single pixel is doing structural work.** Six places. All of them are one
pixel and all of them are the difference between a man and a smudge:

- **(103, 74)** — the far tip of the hat brim, L 4, the darkest pixel in the region.
  It is what makes the brim a brim rather than a blob, because the near tip at
  (95, 73) is *lit* to L 46. The brim reads because its two ends are 42 points apart.
- **(98, 79)** — the shirt collar. The only cool-neutral pixel on the figure
  (L 82, saturation 0.30 against the face's 0.59). It sets the chin off the coat.
  Warm it and the head fuses to the body.
- **(102, 82)** — the brass patch. One pixel at L 87 on an otherwise dead-dark
  shoulder. It is the only ornament he has.
- **(106, 90) and (107, 90)** — the bare right hand. Two pixels at the top value,
  eighteen rows below the face and on the *dark* side of him. They are what tells
  the eye there is a second arm.
- **x = 99, y 84–91** — the coat's front opening, one pixel wide for eight rows,
  flaring to three by the hem. It is the only interior line on the coat and it is
  what stops him reading as a bell.
- **x 85–86, y 81–82** — the bail. Two pixels of wire. Without them the lantern is
  not being carried, it is floating.

**Where edges are hard.** The lantern's outline against the night (its whole
perimeter). The boots against the lit road at y 105–107. The brim's silhouette
against the sky. The lit wedge between the legs — all four of its sides.

**Where edges are soft, and must be.** The man's right contour from y 82 to y 99;
the top of the pool where it meets the far ground at y 94–98; the outermost pool
contour on the left.

**Dither.** Measured on the bar: at 320 × 144 the pool edge is **not** an ordered
checker. 2×2 checkerboard blocks account for 0–3 % of the transition zone. What the
reference actually does:

- Each value band is a solid horizontal run of **5–7 px** near the core, narrowing
  to **2–4 px** near the outside; vertically the bands are 2–3 rows.
- Between any two adjacent bands there is a **1–2 px mottle** in which roughly a
  third of the pixels belong to the neighbouring step. Mean run length falls from
  2.4 px at the core, to 1.6 px mid-pool, to 1.1 px at the edge.
- So: **broken bands, not dithered gradients.** By the outer contour the ground is
  nearly all single-pixel noise across three adjacent mud steps, which is what makes
  the pool die without a visible edge.

The heavy 1-px checker visible in image A's ground is at A's resolution. Reproduced
at ours it would be a 5-px checker and would crawl. Do not port it.

**Ambient animation.** The only moving thing in this region is the flame's four
reserved entries. The ground is not to cycle here; the `puddles` element stays below
y ≈ 112 and belongs to `road`.

---

## 9. Neighbour interactions

- **`left_yard` (x 64–87).** The pool crosses out of this rect at x=64 at L ≈ 50 and
  runs on to x=50 — the two regions must agree on the same contour table or a seam
  appears at the boundary. The signpost's hanging lantern (x 74–81, y 64–71) sits
  inside this rect; its ceiling is `accent_gold` step 3, and it must **not** enter
  the reserved band. The left fence's post and rails enter at x=64.
- **`rail` (x 104–127).** Hob's coat and boots occupy x 104–108 and are this
  region's; the fence post at x 111–118 is `rail`'s. The pool crosses out at x=124.
  The occlusion notch behind the man (x 108–115, y 100–106) is a shared edge: the
  pool must arrive there already a step down.
- **`road` (y 100–119).** The pool is painted into `road`'s surface. This region owns
  the falloff function; `road` owns the ruts, stones and puddles it modulates. The
  contact shadow at y=106 and the lit wedge at y 100–105 are this region's.
- **`town` (y 56–70).** The town's windows reach the same L 123 as the flame. They
  must be authored below the reserved band, and the region's peak brightness has to
  belong to the lantern, not to a window three pixels wide.
- **`range`.** The hillside behind him at L 33–45 is what his far side dissolves
  into. If `range` brightens that band, this figure stops reading and the fix is in
  `range`, not here.

---

## 10. What will go wrong

Specific to this region, in the order they are likely to happen.

1. **Centring the pool on the man.** It centres on the *lamp*, at x=86 — fifteen
   pixels left of his feet. Centre it on him and he appears to be glowing, which is
   both wrong and much worse.
2. **Making the pool round.** It is 2.4 : 1. A circular pool turns the road into a
   vertical wall.
3. **Making the flame too big.** The reserved band is brighter than anything else in
   the palette and it *moves*. Twenty-two to twenty-eight pixels, total, inside
   x 82–89 / y 85–90. A forty-pixel flame will pull the eye off the man it is
   supposed to introduce, and the cycle will read as a fault light.
4. **Putting a soft radial bloom around the lantern.** The airborne halo dies by
   r ≈ 8 and is entirely absent above the hand. The lamp lights the *ground*.
5. **Rim-lighting the whole figure.** Seven pixels on him are at the top value —
   five on the face, two on the hand. If a warm outline runs down his silhouette he
   becomes a decal.
6. **Painting a cast shadow.** There isn't one. One row of contact shadow at y=106
   and an occlusion notch behind him; nothing else.
7. **Losing the light between his legs.** Five top-value pixels at (99–102, 103) and
   (99, 104), a hard-edged wedge four wide. It is the only thing that plants him,
   and it is the first thing a tidy silhouette pass will fill in.
8. **Hardening his far contour.** x 105–108 from y 82 to y 99 is meant to sit within
   ten luminance points of the backdrop. Somebody will read that as a legibility
   failure and "fix" it. It is the design.
9. **Authoring the road, the fence's lit faces, or his lamp-side edge in a cool
   family.** The lighting pass cannot change hue. A grey road cannot be made warm
   later, and the failure appears only after the pass, by which time the cause is
   three steps back.
10. **Using the reserved band anywhere else.** The sign's lantern is the most
    tempting — it is the same object, twelve pixels at the same reference value, and
    it is *inside this rect*. It must sit at accent_gold ≤ 3.
11. **Dropping the sleeve.** Six pixels (x 88–93, y 81–84) join him to the lantern.
    Miss them and the lamp hangs in mid-air next to a man.
12. **Over-detailing the face.** Seven by six, with five bright pixels, a moustache
    that is a two-pixel darkening on one row, and eyes that are drawn by *not*
    drawing them. Anything more and it becomes a mask.
13. **Symmetrising the hat.** The brim is ten pixels on one row, its near tip lit to
    L 46 and its far tip the darkest pixel in the region. A symmetric dark ellipse
    loses the light direction that the whole region is built on.
14. **Dithering the pool edge as a 50 % checker.** The reference does not, at our
    resolution. Broken bands, 5–7 px wide near the core, 1–2 px of mottled overlap
    at each boundary.
