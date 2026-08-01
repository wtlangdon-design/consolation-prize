# Room 01 — region spec: TEAM

Region rect: **(142, 54, 92, 58)** native — x 142–233, y 54–111.

Bar: `reference/room-01/image-B-bar-320x144.png`. Every number below is measured
on that file. Luminance is `L = 0.2126R + 0.7152G + 0.0722B` on the raw bar
(Rec.709, same convention as `00-light-and-value.md`, so the numbers here are
directly comparable to the whole-frame doc). "Warmth" is `R − B` in 0–255 units.
Palette family names come from `art/palette/consolation-256.json` via
`tools/pixelart/palette.py`. Study crops: `work/room-01-study/team/`.

**Content is smaller than the rect.** The animals themselves occupy only
**x 153–221, y 69–104** — 69 × 36 px, 46% of the rect. The other 54% is
background the animals are read *against*, and it is owned by other regions:
sky/town above y=68, the hitching fence at x 142–153, the coach at x ≥ 219,
the road below y=104. All four matter to this region and are specified in §8.

Study images — look at these, they carry more than the tables:

| File | What it shows |
|---|---|
| `team-8x.png` / `team-12x.png` / `team-16x.png` | the region at native values, nearest-neighbour |
| `team-12x-levels.png` | auto-levelled — the only way to read the drawing by eye |
| `B-value-bands.png` | 8-step value posterisation with a native coordinate grid |
| `B-heads-fine.png` / `B-body-fine.png` | 20×/18× gamma-lifted tiles with a 2-px grid |
| `annotated-8x.png` | the measured toplines, head boxes, tail, pole, traces, hooves |
| `squint-ladder.png` | the region at 92×58 / 46×29 / 30×19 / 23×14 |
| `A-team-gamma.png`, `A-heads-fine.png`, `A-neck-fine.png`, `A-body-fine.png`, `A-harness.png`, `A-legband.png` | image A at 5–6× with a native grid — use **only** to identify what a blob is |

---

## 0. The one-sentence description

Three harnessed horses standing still with their heads down, drawn as **one
horizontal dark mass 69 px long and 36 px tall** whose only strong internal
information is a **flat topline, a straight belly line, nine legs and four
warm sparks of bridle metal** — and which is separated from the sky behind it
not by value but by *hue and by two one-pixel rims of opposite polarity*.

---

## 1. What this region is and what it must communicate

The stage has stopped. The team is standing, heads down, noses near the hitching
rail, waiting. Nothing in this region moves and nothing in it is a puzzle. Its
whole job is to be **unmistakably horses, unmistakably harnessed, and
unmistakably at rest** — because that is what tells the player, in the first
half-second of the game, that they have *arrived somewhere and been put off the
coach*, rather than that they are watching a coach drive past.

Three things must survive at 320×144:

1. **Horse, not dog.** This is the whole difficulty. See §4 — the ratios, not the
   outline, are what does it.
2. **Team, not horse.** More than one animal, standing in a stack that recedes to
   the left. Three heads, three toplines' worth of stagger.
3. **Harnessed, not loose.** Two traces running up to the driver and a straight
   pole line under the barrels. Four pixels of lit buckle.

It gets 69 × 36 px, of which about 750 px are hide. The head of a horse is 7 × 13
px. There is no room for anatomy; there is room for proportion.

---

## 2. A warning before any measurement is used

The bar is **image A resized to 320×144 with no crop** — Lanczos reproduces the
bar at mean |Δ| = 1.47 across the frame and 1.55 inside this rect. A is 1672×941
(16:9); the bar is 20:9. **Everything in the bar is 0.800× as tall, relative to
its width, as it is in image A.**

That does not mean the horses are squashed. Measured on the bar they come out at
textbook coach-horse proportions (§4). It means two things for whoever draws this:

- **Never take a height off image A and scale it by 320/1672.** Heights scale by
  144/941. Getting this wrong makes the horses 25% too tall, which is exactly the
  error that turns them back into a wall of legs.
- Image A is for *identification only* — which blob is a head, which leg belongs
  to which animal. Never for pixel detail, never for value.

---

## 3. Elements, in draw order

Numbered back to front. Bounding boxes are native and inclusive. The three
animals are lettered **C** (far), **B** (middle), **A** (near) so the letters
match the draw order: C first.

### The background they sit against (not this region's to draw)

0. **Sky / far hillside / town lights**, y 54–68 above the mass and visible in
   every gap through it. L median 23.2, warmth −13 to −26, `accent_indigo@0` 47%
   with `grey@0–3` 42%. The single brightest pixel anywhere in the rect —
   L = 121.9 at **(164, 60)** — is a town window, not part of the team.

### C — far horse (dark bay). Draw first, entirely in shadow.

1. **Ear / poll.** (157–158, 69). Two pixels. This is the top of the whole group.
2. **Head.** x 153–159, y 69–81 — **7 × 13 px.** Hanging almost vertically;
   the axis leans ~15° forward (top of the head at x≈157, muzzle at x≈154).
   Muzzle bottom row is y = 81, which is *exactly* the top rail of the hitching
   fence (§8). No lit bridle mark anywhere on this head — see §7.
3. **Sky wedge under the jaw.** x 159–164, y 77–81, widening downward from 2 px to
   6 px. Cool background, L 24–33. **This hole is the single most load-bearing
   negative shape in the region** — it is what separates the head from the chest
   and makes a lowered head read as a head rather than as a lump of neck.
4. **Crest / mane.** x 160–171, y 69–72. Near-black: L median 7.1,
   `void@0` 31% + `umber@0–1` 29%. A 12 × 3 px black bar. Against sky at L 34 this
   is a **−26 L step** — the hardest edge in the region.
5. **Neck and back.** The topline continues at y 69–72 from x 160 all the way to
   **x 193**, essentially flat (measured y: 69,69,69,70,70,71,71,69,68,71,71,72,
   71,70,70,70,70,68,69,70,70,71,71,72 across x 170–193). Hide below it is
   L median 17.9, warmth +14 — *darker than the sky it sits against*.
   C's croup is the step down at x 193→194.

### B — middle horse. Draw second. Only its head is legible.

6. **Head.** x 161–170, y 82–95. Same posture as C's, dropped 13 px and moved
   right 8 px.
7. **Bridle mark.** x 164–166, y 85–88 — 6 px, peak **L 61**, `pine_fresh@3–4`.
8. **Bit mark.** (163, 92), L 54. One pixel, 4 rows below the bridle mark.
9. **Neck.** Merges with A's mane band (item 12). B has no separately readable
   topline; its back is inside the mass between C's (y 70) and A's (y 75).

### A — near horse (lit chestnut). Draw last. The only complete animal.

10. **Head.** x 171–180, y 82–95. Same posture again, 9 px right of B's.
11. **Bridle mass.** x 172–176, y 82–88, 12 px, peak **L 85 at (173–174, 86–88)**,
    `ochre@8`. **This is the brightest thing in the team and the brightest thing
    in the rect that is not a town light or a coach lamp.** Bit mark at (172, 92)
    L 61 and (176, 92) L 50.
12. **Neck with standing mane.** A band of ~6 vertical highlight strokes running
    from the poll at (177, 84) up to the withers at (194, 75) — a 19 px axis at
    **28° above horizontal**. Strokes peak L 50–70 (max 70.4 at (186, 79) and
    (188, 78)), troughs L 30–44, **pitch ≈ 3 px**. Family `pine_fresh@2–3` over
    `mud@2–4`. This is the highest-contrast texture in the region.
13. **Back.** y 75–76, x 194–218 — **24 px, dead flat.** See §5 for the rim.
14. **Barrel.** x 194–218, y 76–86. L 34 at the top falling to L 27.5 by y 83.
    Warmth constant at +26 to +28. There is **no left-to-right lighting gradient**
    across the barrel (L stays 25–37 from x 194 to x 218); the modelling is all
    top-to-bottom.
15. **Croup and flank.** x 218–221, y 76–84; the topline drops from y 76 to y 80
    over 3 px.
16. **Tail.** x 219–220, y 78–96 — a **1–2 px near-black vertical stroke, 19 px
    long**, L median 7.1, `umber@0` 34% + `void@0` 21%, ending 5 px above the
    hoof line. It is the only tail drawn. Do not add a second.
17. **Underline.** y 86–88 from x 200 to x 220, L 6–16. Straight. To its left it
    thickens into item 18.
18. **Chest / forearm shadow.** x 181–190, y 84–91. L median **8.6**, `umber@0`
    31% + `void@0` 20%. **The darkest mass in the region** and the anchor that
    holds the front of the animal down.

### Legs — nine ground contacts

19. Nine hooves land between x 172 and x 218, on a ground line that **falls 5 px
    from back to front**:

    | # | x | ground y | reads as |
    |---|---|---|---|
    | 1 | 172–175 | 100 | back rank |
    | 2 | 177–181 | 100 | back rank |
    | 3 | 182–185 | 103 | front rank |
    | 4 | 186–190 | 99 | back rank |
    | 5 | 191–195 | 103 | front rank |
    | 6 | 195–198 | 104 | front rank, nearest foot in the region |
    | 7 | 201–206 | 101 | two legs merged into one 6-px mass |
    | 8 | 211–214 | 101 | back rank |
    | 9 | 215–218 | 102 | front rank |

    Legs are **2–3 px of hide wide**, occasionally 4 with their shadow edge.
    Lit fronts run L median 27 (warmth +15); shadowed backs L median 20
    (`umber@0` 22%). Hooves are `umber@0` and `umber@5` — L 7–37, i.e. **not
    uniformly black**; the near ones catch a little road bounce.

20. **Gaps between the legs.** Six cool holes: (170–172, 89–97), (178–179, 91–96),
    (185–187, 88–96), (190–192, 92–95), (198–202, 91–95), (204–209, 90–93).
    L 18–29, warmth −7 to +2. These are background, not shadow, and they are what
    make nine legs read as nine legs. **They are as important as the legs.**

### Tack

21. **Pole (coach tongue).** A single lit row at **y = 85, x 195–212**, L 30–37,
    `mud@4` + `pine_fresh@1`. It is measurably **smoother than anything else in
    the region** (row sd ≈ 3 against ≈ 10 for the hide above it) and it is the
    only straight line inside the animals. Directly beneath it is the near-black
    underline. In image A this is a distinct timber bar with a brass ferrule; at
    320×144 it is one row and it must stay one row.
22. **Terret / hame top.** (195–196, 73–76). A pale cool 4-px vertical fleck,
    L 51, `grey@4`. The only cool object standing *above* the near horse's back.
23. **Two traces / reins.** Stepped 1-px diagonals climbing right at ≈ 32°
    (about 1.5 px across per 1 px up):
    - upper: (196, 71) → (224, 55)
    - lower: (203, 75) → (222, 58)

    Measured over the sky the traces are **L 25.9 against sky L 23.6 — a
    difference of 2.3, which is nothing — but warmth +10.8 against sky −6.2.**
    They are a hue line, not a value line, for their whole run, and they only go
    bright (L 85, `ochre@8`) in the last 3 px at the driver's hands.

### Ground

24. **Cast shadow.** One pooled shadow, x 178–222, y 99–105, L median 24 against
    open road at L 54 — a **55% darkening**. Its front edge sits at y 104–106,
    2–4 px in front of the deepest hoof, and is broken/stippled, not a line.
    There are **no separate per-leg shadows.**

---

## 4. Proportions — the part that makes it a horse

All ratios are against **height at the withers = 27 px** (top of A's back at
y = 75, mean ground contact at y ≈ 102). These are the numbers to draw from;
they are what stops the animal reading as a large dog.

| Measure | px | ÷ withers height |
|---|---|---|
| Height at withers | 27 | 1.00 |
| Back, withers to croup | 24 | **0.89** |
| Depth of barrel, back to belly | 11 | **0.41** |
| Leg, belly to ground | 16 | **0.59** |
| Head length, poll to muzzle | 13 | **0.48** |
| Head depth across the jowl | 7 | 0.26 |
| Neck, poll to withers (along its axis) | 19 | 0.70 |
| Chest to point of buttock | 31 | 1.15 |

Read those as five rules:

1. **The legs are longer than the body is deep — 0.59 against 0.41.** A dog is the
   other way round. If the barrel ends up taller than the leg is long, the animal
   is a dog and no amount of mane will save it.
2. **The head is half the height of the animal.** 13 px, on a 27 px horse. It is
   enormous relative to what feels right, and it is the single most common thing
   to under-draw.
3. **Head length : head depth = 13 : 7, near enough 2 : 1.** A 7 px wide head is
   already generous. Anything wider is a donkey; anything narrower is a bird.
4. **The back is a level straight line 0.89 as long as the horse is tall, and it
   does not sag.** Measured across x 194–218 it varies by *one pixel*. The dip
   between withers and croup that reads as "horse" in a big drawing is below the
   resolution here, and faking it produces a swayback nag.
5. **The neck leaves the body at the withers, at the top of the back, and rises
   at 28°.** Not from the chest. The 5-px step between C's topline (y 70) and A's
   (y 75) exists precisely so the eye can find two withers.

Head-down posture, which all three animals share: the **head axis is within 15°
of vertical**, and the muzzle stops **14–16 px above the ground** — roughly one
head-length short of the road. Not grazing. Standing with the head dropped.

Stagger between the animals, which is what makes it a team rather than one horse
drawn thick: **each animal sits ~9 px to the right of and ~6 px below the one
behind it** (heads at x 153 / 161 / 171, y 69 / 82 / 82; toplines at y 70 and
y 75). Three offsets, one direction, no exceptions.

---

## 5. Value structure

The whole region lives between L 1 and L 122, but 90% of it is under L 50.
Region percentiles: p10 = 11.8, p50 = 26.2, p90 = 49.5.

### The measured ladder

| Material | L (median / mean) | warmth |
|---|---|---|
| Chest / forearm shadow (darkest mass) | **8.6** | +2 |
| C's crest, tail | 7.1 | +5 |
| Underline / belly | 6–16 | +7 |
| C's neck and back (far hide, shadow) | 17.9 | +14 |
| Legs, shadow side | 19.6 | +5 |
| Sky / hillside directly behind the mass | **23.2** | −13 |
| Cast shadow on the road | 24.2 | +11 |
| Legs, lit side | 27.0 | +15 |
| A's barrel, lower | 27.5 | +27 |
| Traces over the sky | 25.9 | +11 |
| A's mane strokes / barrel, upper | 31.7 | +26 |
| Pole line at y=85 | 33.0 | +25 |
| **A's back rim, y=75** | **41.9** | **−7** |
| Road under the team | 42.7 | +27 |
| Mane stroke peaks | 50–70 | +30 |
| A's bridle spark | 61 → **85** | +40 |
| Open road, left of the team | 53.8 | +42 |
| Hitching rail top (left neighbour) | 51.1 | +30 |

### The three facts that carry the region

**1. The animals are not darker than the sky. Not usefully.** Averaged across the
whole topline: background 2–3 px above the edge is L 28.1; hide 2–3 px below it
is L 21.4. **A gap of 6.7 L — 2.6% of the scale.** Anyone modelling this by
lightness alone will lose the animals into the hill. What actually separates them
is warmth: hide +14 to +28, sky −13 to −26. **A 40-unit hue swing across a
7-unit value step.**

**2. The two toplines are lit in opposite directions, and that is the depth cue.**

- **C's back, y 69–72:** L 7.5 against sky at L 34 → **−26**. A black cut-out.
- **A's back, y 75:** L 41.9 against sky at L 27.7 → **+14**. A bright rim.

And the rim is **cool** — warmth −7, quantising to `sky@0` / `grey@2–4` — while
the hide one pixel below it is warmth +26. **One row of cool skylight sitting on
top of a warm animal.** It is one pixel tall, it runs 22 px, and it is the only
thing that puts the near horse in front of the far one. Draw it warm and the
depth collapses.

**3. Light comes from above and the ground is brighter than anything on the
animals.** Within A's barrel, value falls monotonically top to bottom
(y 75 → 83: 42 → 34 → 30 → 27.5) and does *not* vary left to right (L 25–37
across all 24 columns). The road in front is L 54, above every hide value in the
region. The animals are dark objects on a bright floor, top-lit, with the coach
lamp contributing only the four bridle pixels and the last 3 px of the traces.

### Separation between overlapping animals

Not a drawn outline. Three devices, in this order of importance:

- **Value step at the toplines** — 5 px of vertical offset between C's y 70 and
  A's y 75, described above.
- **Near-black seams**, 1–2 px wide, where one animal's edge crosses another:
  the strongest is **x 183–185, y 84–94** (column mean L 12.3 against 17–24 either
  side), which is the gap between A's foreleg and B behind it.
- **Nothing at all** across the top of the mass. From x 160 to x 193 the far
  horse's back and the middle horse's back merge into one continuous silhouette
  with no seam. **This is correct.** Do not draw a line there.

---

## 6. Palette families and ramp steps

| Material | Family | Steps | Notes |
|---|---|---|---|
| Hide, lit (near animals) | `pine_fresh` | **0–3**, peaks at 4 | the warm chestnut. 26% of A's barrel is `pine_fresh@1` |
| Hide, mid / mottling | `mud` | **1–4** | interleaved with pine_fresh in the same plane, ~50/50 |
| Hide, shadow (far animal) | `umber` | **0–1** | with `mud@0–2` and `pine_fresh@0` |
| Manes, tail, crest, hooves | `umber` **0**, `void` **0** | — | `void@0` is 21–31% of these areas and is used nowhere else in the region except the deepest chest shadow |
| Mane stroke highlights | `pine_fresh` | **2–4** | up to `@5` at the two brightest |
| Back rim (cool) | `sky` **0**, `grey` **2–4** | — | the only cool family used *on* an animal |
| Terret | `grey` | **4** | |
| Bridle spark, near horse | `ochre` | **8** | 3 pixels; the only `ochre@8` in the region |
| Bridle spark, middle horse | `pine_fresh` | **3–4** | deliberately one step dimmer |
| Traces over the sky | `grey` **0–2**, `umber` **3**, `mud` **2** | — | warm-neutral thread, never brighter than the sky it crosses |
| Pole line | `mud` **4**, `pine_fresh` **1** | — | |
| Cast shadow on the road | `umber` **0, 4–5**, `pine_weathered` **1**, `dust` **0** | — | the road's own family darkened, not a grey wash |
| Road under the team | `pine_fresh` **2–3**, `mud` **5–7** | — | |
| Open road (reference) | `pine_fresh` **3–5**, `mud` **7–9** | — | |
| Background behind | `accent_indigo` **0–1**, `grey` **0–3** | — | not this region's to draw |

Fifty-four indices across the whole rect. The animals themselves need about
**twenty**: `pine_fresh@0–5`, `mud@0–7`, `umber@0–5`, `void@0`, `grey@2–4`,
`ochre@8`. That is enough. Reaching for more will produce mud, in the bad sense.

---

## 7. Technique

**The animals are the busiest surface in the frame.** Measured as horizontal run
lengths after quantising to 8 value bands:

| Area | mean run | % single-pixel runs |
|---|---|---|
| Mane band | **1.27 px** | 80% |
| Leg zone | 1.35 px | 74% |
| C's head and crest | 1.42 px | 72% |
| A's barrel (lit plane) | 1.65 px | 68% |
| Road below (comparison) | 2.20 px | 50% |
| Sky above (comparison) | 2.32 px | 52% |

So: **the hide is roughly twice as high-frequency as the sky or the road.** This
is not a dither pattern — there is no checkerboard, no ordered matrix, no 50%
mixing between two adjacent ramp steps. It is per-pixel stipple that alternates
between `pine_fresh` and `mud` at similar value, which is why the barrel reads as
*hair* rather than as a painted plane while its value profile stays smooth. Copy
the statistic, not a pattern: aim for a mean run of 1.5–1.7 px in the lit hide
and 1.3 px in the mane, with no two-pixel motif repeating.

**Where the edges are hard.** Only four places:

1. C's crest, y 69–72 — a solid `void`/`umber@0` bar, no dither into the sky.
2. A's back rim, y 75 — one unbroken cool row, no dither.
3. The underline and chest shadow, y 84–91 — solid dark, no dither.
4. The tail — a solid 1–2 px stroke.

Everything else, including the whole rear outline of the croup and the
front edges of the legs, is a stippled boundary 1–2 px wide.

**Where one pixel is doing structural work.** Six places. If any of these is
lost the region fails:

- **The 2-px ear at (157–158, 69).** The only ear in the team, and the top of the
  silhouette. Without it C's head is a post.
- **The sky wedge at (159–164, 77–81).** Six cool pixels. They are the difference
  between a lowered head and a thick neck.
- **The 1-px cool rim on A's back, y 75, x 197–218.** 22 pixels; the entire depth
  read between the near and far animals.
- **The four bridle sparks** — (173–174, 86–88) at L 85, (164–166, 85–88) at
  L 61, plus their bit pixels at (163, 92) and (172, 92). Four bright marks at
  two different heights are what make three heads count as three.
- **The pole row at y = 85.** One straight, smooth row. It is the only thing that
  says "hitched to something" rather than "standing loose".
- **The six background holes between the legs (§3.20).** Nine legs are drawn;
  without the holes they are one dark skirt.

**Legs, exactly.** 2–3 px of hide across, lit on the leading (left) edge with 1 px
of `umber@0` behind. Gaps between adjacent legs are 2–4 px. Hooves are 3–4 px
wide and 2–3 px tall, and are *not* pure black — `umber@0` with a couple of
`umber@5` pixels catching road bounce.

**Manes.** Six strokes across 19 px along a 28° axis. Each stroke is 1–2 px wide
with a 1–2 px dark trough beside it, and swings 20–40 L. Do not comb them into an
even pattern; the measured pitch varies between 2 and 4 px.

---

## 8. Neighbour interactions

**Left — the hitching fence (x 142–153).**
The top rail runs y 81–82 across x 142–152 at L 41–80 (brightest at x 142–143,
L 80). C's muzzle bottom row is **y = 81** and its left edge is **x = 153** — the
muzzle abuts the end of the rail exactly, with no gap and no overlap. The dark
muzzle (L 24–36) against the bright rail (L 51–80) is the strongest local contrast
at the left end of the region. The vertical post at x 152–153, L 47–65, runs
y 84–101 and passes in front of nothing; it starts 3 rows below the muzzle. **The
fence and the team meet, they do not overlap.** If the rail moves, C's head moves
with it.

**Right — the coach (x ≥ 219).**
The near horse's tail at x 219–220 is the last column of this region; the coach's
front boot begins immediately at x 219–225, topline y 66–67. The two traces
terminate at the driver's hands at (224, 55) and (222, 58) — **the traces leave
this region and their far ends belong to the coach region.** Whoever draws either
side must agree on those two endpoints and on the 32° slope.

**Below — the road.**
Ground contacts fall 5 px from back to front (y 99 at x 186, y 104 at x 196). That
5-px fall is this region's statement about where the ground plane is, and the
road's ruts must run parallel to it. The pooled cast shadow (x 178–222, y 99–105)
darkens the road by 55% and is the road's texture at a lower value, not a grey
overlay. Its front edge at y 104–106 is stippled and must not be drawn as a line.

**Above — sky, town, far range.**
The traces cross into the sky region as high as y 55. Behind the team the
background is L 23.2 and cool; §5 depends on that number. If the hillside behind
x 160–220, y 58–75 is ever lightened past about L 32, the far horse's black
topline becomes a hard graphic cut and the near horse's cool rim disappears —
both animals will flatten into one silhouette. **That band of hill is this
region's backing paper and cannot be repainted independently.**

---

## 9. What will go wrong

The specific mistakes this region invites, in the order they are likely.

1. **The animals will be drawn too tall in the body and too short in the leg.**
   The single most common way to draw a horse badly at small scale. Measured:
   barrel depth 11 px, leg 16. If those numbers come out 14 and 13, the result is
   a mastiff. Check the ratio before anything else is added.

2. **The heads will be drawn too small.** 13 px on a 27 px animal feels wrong and
   will get shaved to 9 or 10. At 10 px the head reads as a muzzle and the animal
   reads as a cow.

3. **Somebody will outline the animals against each other.** There is no seam
   across the top of the mass from x 160 to x 193 — the far and middle horses
   merge deliberately. Adding a separating line there produces two flat paper
   cut-outs, which is precisely the failure the offset toplines exist to avoid.

4. **The back rim at y=75 will be drawn warm.** It is `sky@0`/`grey@2–4`, warmth
   −7, one row, on top of hide at warmth +26. It looks like an error in the data.
   It is the depth cue.

5. **The value contrast against the sky will be exaggerated.** The measured gap is
   6.7 L. It will feel far too subtle while working at 8× and someone will
   "fix" it by darkening the hides. Darkening the hides pushes them into the same
   family as the chest shadow, kills the mane, and turns the team into a hole.
   The contrast is carried by warmth. Leave the values where they are.

6. **The traces will be drawn as bright lines.** They are L 25.9 against a sky of
   L 23.6. Only the last 3 px at the driver's hands are bright. A bright rein
   across the sky becomes the most legible object in the frame and steals the
   read from the coach lamp.

7. **The legs will be drawn as a comb.** Nine hooves, but on **two ground lines
   5 px apart**, and one of the nine (#7, x 201–206) is two legs merged into one
   6-px mass. Evenly spaced legs on a single baseline read as a fence.

8. **The gaps between the legs will be filled with shadow instead of background.**
   The six holes are cool (warmth −7 to +2) and mid-valued (L 18–29) — they are
   the hillside behind the horses, not the animals' own shade. Painting them warm
   and dark closes the silhouette and loses every leg.

9. **A second tail will appear.** There is one, at x 219–220. Three horses, one
   visible tail, and that is correct: the other two are behind bodies.

10. **The hide will get dithered in a pattern.** There is no ordered dither
    anywhere on these animals — 68–80% of the runs are one pixel long and nothing
    repeats. A Bayer or checkerboard fill at this density will read as fabric.

11. **Someone will try to draw a horse's belly curve.** At this size the underline
    is a straight near-black band, y 86–88, x 200–220. The curve happens only at
    the ends, in the chest mass at x 181–190. Curving the middle produces a
    pot-bellied pony.

12. **The four bridle sparks will be lost, evened out, or multiplied.** They are
    unequal on purpose: L 85 on the near horse, L 61 on the middle, **nothing at
    all on the far horse**. Giving all three heads a spark flattens the depth
    stagger; removing them merges three heads into one.
