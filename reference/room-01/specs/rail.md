# Region spec — `rail`

Region rect: **(104, 58, 68, 52)** native — x 104–171, y 58–109.

Bar: `reference/room-01/image-B-bar-320x144.png`. Every measurement below is taken
from that file. Luminance is `0.299R + 0.587G + 0.114B` on the raw bar; palette
names are from `art/palette/consolation-256.json` via `tools/pixelart/palette.py`,
read off `image-B-in-locked-palette-320x144.png`. Study crops:
`work/room-01-study/rail/`.

Image A was consulted only to identify blobs. Its frame maps to the bar as
`A.crop(0, 120, 1668, 871)` scaled by 1/5.2125 — that mapping is approximate and
the two images are separately rendered, not resamples of each other. **Nothing in
this spec is measured from A.**

**Content overruns the rect on three sides.** The back fence's top rail leaves the
rect at x=104 and continues left toward the signpost. The lower rail leaves at
x=163 under the horse's jaw. The standing figure's coat and lit hand occupy
x 104–107 down to y≈103 and belong to the figure region. Blue-grey road flecks
begin at y≈106 and belong to the road region.

---

## 1. What this region is, and what it has to do

A hitching rail, a crate sitting on it, a low bench behind it and a box on the
ground beneath it, with an older fence line running away to the left behind all of
it. Sixty-eight pixels of middle distance between the lit figure and the coach team.

Its job is **transport, not arrival.** The eye is meant to leave Thad, travel right
along the rail, and land on the horses. Everything in this region is a road surface
for the eye. Nothing in it is a destination.

That produces an unusual constraint, and it is the whole problem of the region:
these objects are **neither lit nor silhouetted.** They are outside the lantern's
pool and in front of a backdrop that is almost exactly their own value. The region's
mean luminance is 37 and its median is 33; the crate's face averages 32.2, the
backdrop immediately to its left averages 34.1 and the backdrop immediately above it
averages 33.1. Nothing here separates by value mass.

Everything separates by **one lit pixel on top and one black pixel underneath.**
Get that discipline right and the region works at any brightness; get it wrong and
no amount of re-lighting will save it.

---

## 2. Elements, in draw order

Back to front. Bounding boxes native and inclusive.

1. **Backdrop.** x 104–171, y 58–~95. Owned by the town and range regions. Cool
   dark blue-grey, mean L≈35 in the band behind the rail (y 64–80), with the town's
   window lights scattered through y 59–70. Two features matter here: a pale
   distant roof band at **y 68–69, x 132–147** (L 51–69) and a tight cluster of
   window lights at **y 66–67, x 140–145** (peaks L≈123). Both sit directly above
   the crate and set what the crate's top edge has to survive.

2. **Back fence — top rail.** A **single pixel row at y=82**, entering from the left
   edge and running to x=124 where the near post interrupts it. Mean L≈49, and the
   row directly beneath it is L≈31. That one row is the entire back fence rail.
   There is no shadow row, no body, no highlight — one row of flat cool grey.

3. **Back fence — second rail.** y 86–87, x 117–124. L 35–42 against surroundings of
   27–30. A separation of about eight luminance points. It is meant to be almost
   invisible; it exists so the back fence is not a single stick.

4. **Back fence — post.** x 114–116, y 79–96. Three columns: lit x=114 (mean L 41.6),
   mid x=115 (mean L 34.4), dark x=116 (mean L 22.6). Brightest at its cap, y 79–81.
   Base meets the lamp-lit ground at y=96 — eight rows higher than the near posts.

5. **Near-left post.** x 126–129, y 73–104. **It changes polarity at the rail line,
   and this is deliberate.**
   - Above the bar (y 73–80) it is a dark silhouette against the pale distance: a
     lit left edge at x=126 (L 41–58) and a genuinely dark column at x=128 (L 13–23)
     against a backdrop of L 30–41. Eight rows of post standing proud of the rail.
   - Below the bar (y 85–104) it is the brightest sustained mark in the region: the
     highlight column **x=127 holds mean L 70.6 across twenty rows**, mid x=128 at
     L 45.8, dark x=129 at L 24.1.
   Base and contact at y=104.

6. **Right post.** x 152–155, y 81–103. Two lit columns rather than one — x=152
   (mean L 55.0) and x=153 (mean L 57.3) — then mid x=154 (L 34.6) and dark x=155
   (L 21.1). **It does not project above the rail**; the bar cuts it off at y=84.
   Base at y=103, one row higher than the near-left post.

7. **Dark ground pocket.** x 128–171, y 89–104. The enclosure under and behind the
   rail. Mean L 28.4 — darker than the hillside behind (35.2) and far darker than the
   road in front (64.7). This is not empty space, it is the element that makes both
   bright bars read. Draw it before anything sits in it.

8. **Lower boarding / bench.** x 122–163, y 90–94, read as four alternating rows:
   light y=90 (mean L 36.4), dark y=91 (25.7), light y=92 (36.1), dark y 93–94
   (22.0 / 19.5). A separation of ten to fifteen points, no more. These are the
   bench's back and seat seen through the rail; at this size they are texture, not
   structure.

9. **Bucket / low box.** x 138–150, y 95–102. A pale rim along the top row
   (y=95, mean L 43.1), a lit left face x 138–143 (mean L 39.3) and a dark right
   body x 144–151 (mean L 22.4). Base merges into the road at y 102–103. Roughly
   13 × 8 px.

10. **Bracket off the near post.** x 122–126, y 91–95. Four or five warm mid-tone
    pixels (L 49–70) reading as a short board or brace projecting left from the post.
    Its only job is to stop the ground between the two fences being empty.

11. **Lower rail bar.** x 125–153, continuing x 155–163 behind the horse. Three rows:
    ambient y=87 (mean L 44.9), **highlight y=88 (mean L 53.5, the flattest run of
    value in the region — min 23, max 62)**, shadow y=89 (mean L 20.9). Bright end
    cap at x 125–127.

12. **Top rail bar.** x 125–153, y 81–84. Drawn over both posts.
    - y=81 — ambient top, present only from x≈139 rightward (L 19–58).
    - **y=82 — the highlight, one pixel row.** Mean L 62.6, max 81.5. Four zones:
      x 125–127 mean 78 (the projecting end cap), x 128–138 mean 58 (flat),
      **x 139–146 mean 77 (the bright run under the crate)**, x 147–153 mean 48
      (falling away to the right).
    - y=83 — front face, mean L 36.3.
    - y=84 — cast shadow, mean L 23.5.

13. **Crate.** x 136–148, y 71–79, plus its contact shadow at y=80.
    - Top batten y=72, mean L 46.7, brighter over its right half than its left.
    - Left stile x=136 (L 34–58) with a **one-pixel inner shadow at x=137 that is a
      dead-flat single value** (umber, L≈25) for all seven rows.
    - Right stile x=148 (L 37–49) with a one-pixel dark edge outside it at x=149.
    - Face x 138–147, y 73–79 — ten by seven pixels, mean L 32.2.
    - **Contact shadow y=80, x 138–149. Mean L 20.8, minimum 6.1** — the darkest run
      anywhere in the region above the ground.
    Thirteen wide, nine tall including the shadow row.

14. **Road edge.** The lit road's near edge runs at y≈96 under the back fence
    (x 109–125) and drops to y≈104 under the hitching rail (x 128–155), rising again
    to y≈103 at the right. The step is caused by the fence's own shade, not by the
    ground.

---

## 3. Value structure — how the middle ground separates

Region percentiles: p10 = 18, p50 = 33, p90 = 63, max 123 (that maximum is the
figure's lit hand at x 106–107, not anything in this region).

The planes, measured:

| plane | mean L |
|---|---|
| distant backdrop behind the rail (x 106–125, y 64–79) | 35.2 |
| dark pocket inside the fence (x 130–151, y 89–102) | 28.4 |
| lit road, left of the fence (x 109–127, y 105–109) | 78.4 |
| lit road, under the fence (x 130–152, y 105–109) | 64.7 |
| road, far right (x 156–171, y 103–109) | 49.7 |

Read those numbers against the object means and the point becomes obvious:

| object | mean L |
|---|---|
| top rail bar (4 rows, y 81–84) | 40.5 |
| lower rail bar (3 rows, y 87–89) | 40.5 |
| near-left post (3 cols, y 85–104) | 46.8 |
| right post (4 cols, y 84–103) | 41.5 |
| back fence post (3 cols, y 79–95) | 35.5 |
| crate (with shadow row) | 34.3 |
| bucket | 32.3 |

**Every object in this region has a mean luminance between 32 and 47, and the
backdrop behind them is 35.** The crate's mean is within two points of the backdrop
on its left and above it. Nothing separates by mass.

What separates is internal range. Each object contains a value the backdrop never
reaches at the top and a value it never reaches at the bottom, and both are one
pixel thick:

- the top bar reaches L 81.5 on y=82 and L 15.9 on y=84;
- the lower bar reaches L 62.4 on y=88 and L 7.9 on y=89;
- the near post reaches L 76.0 on x=127 and L 16.8 on x=129;
- the crate reaches L 59.3 on its top batten and L 6.1 in its contact shadow.

The backdrop, by contrast, is a mush: its p10 is 21 and its p90 is 50, and it never
holds either extreme for more than a pixel or two.

**The brightness budget.** Take the fence structure alone — x 109–171, y 70–104,
setting aside the lamp-lit road that intrudes at the lower left — and that is 1,946
pixels. Of them:

- 36 reach L≥65 (1.8%)
- 29 reach L≥70 (1.5%) — **eleven of those are on row y=82 and eleven are in column
  x=127.** Two lines hold three-quarters of the region's light.
- 13 reach L≥75
- **7 reach L≥80, and all seven are on row y=82** (x = 125, 127, and 139–143).

The single brightest structural pixel is L 81.5. The lantern, its ground pool and
Thad's lit edge all peak at L 122.8. That forty-point gap is what keeps the fence a
road for the eye rather than a destination, and it is a budget, not a suggestion.

---

## 4. Perspective, spacing, and the two fences

There are **two separate structures at two depths**, and the region's entire sense of
place comes from the difference.

**The near hitching rail** runs almost parallel to the picture plane. Its two post
bases are at y=104 and y=103 — one pixel of recession across twenty-five pixels. The
highlight row of the top bar does not tilt at all: it stays on **y=82 for its whole
twenty-nine-pixel run.** What changes instead is how much of the bar's top face is
visible: one row on the left, two rows (y 81–82) from x≈139 rightward.

**The back fence** genuinely recedes, to the left, toward the signpost. Its post
measures fourteen pixels from rail to ground against the near post's twenty-two — a
depth ratio of 0.64 — and its base sits eight rows higher in frame. Its rail lands on
the same scanline, y=82, as the near bar's highlight.

That coincidence is the region's best trick and it must be preserved: **one unbroken
line of light at y=82 crosses the whole region, but on the left it is a flat grey
single pixel at L≈49 and on the right it is a warm three-row bar peaking at L 81.5.**
The eye reads a continuous rail; the value tells it that half of it is far away.

**Post spacing is deliberately unequal.** Post centres sit at x≈115, x≈127.5 and
x≈153 — gaps of 12.5 and 25.5 pixels, a ratio of almost exactly 1:2. Nothing here is
on a grid.

---

## 5. Locked-palette families and ramp steps

The region resolves into fifty-four indices in the quantised reference. The material
logic is simple and it is the most useful thing in this document:

**Horizontal timber is cool. Vertical timber is warm.** A bar's top face catches the
sky; a post's left face catches the lantern. Measured saturations back this up
exactly — bar highlights sit at 0.07–0.47, post highlights at 0.61–0.62.

| material | family | steps | notes |
|---|---|---|---|
| Backdrop behind the rail | `accent_indigo` 0–1, `grey` 1–3 | L 22–41 | cool, unsaturated, no warmth at all |
| Top bar — highlight row | `dust` 8 and `umber` 10 on the bright runs; `pine_weathered` 6 across the flat middle | L 59–82 | **near-neutral, sat 0.18–0.47** |
| Top bar — front face | `mud` 4–7 | L 27–49 | |
| Top bar — cast shadow | `mud` 1, `pine_weathered` 0 | L 18–21 | |
| Lower bar — highlight | `pine_weathered` 6, almost pure | L 59 | the single most consistent colour in the region |
| Lower bar — shadow | `mud` 1–2 | L 18–23 | |
| Near post — lit column | `pine_fresh` 5–6 | L 70–79 | **warm, sat 0.62** |
| Near post — mid | `pine_fresh` 2–3 | L 44–54 | |
| Near post — dark column | `umber` 3, `mud` 2 | L 23–26 | |
| Right post — lit | `pine_fresh` 3–4 | L 54–63 | one to two steps below the near post |
| Right post — dark | `mud` 1 | L 18 | |
| Back post — lit | `dust` 3, `dusk` 0 | L 46–50 | **cool family, not `pine_fresh`** |
| Back post — mid | `pine_fresh` 0–1 | L 28–37 | |
| Back post — dark | `dust` 0, `pine_weathered` 0 | L 21–25 | |
| Back fence rail | `grey` 4, almost pure | L 53 | flattest, coolest, most distant timber |
| Crate — frame | `mud` 5, `pine_weathered` 6, `umber` 7 | L 39–59 | |
| Crate — inner shadow line | `umber` 3, exclusively | L 25 | one column, one value, seven rows |
| Crate — face | `umber` 4–5 | L 29–35 | ±1 step of stipple |
| Crate — contact shadow | `mud` 3 → `grey` 0 → `umber` 0 | L 27 → 9 | |
| Bench / lower boarding | `umber` 5 lights, `umber` 3 / `mud` 1 darks | L 18–35 | one narrow family, no contrast |
| Bucket — rim | `dusk` 0, `grey` 3 | L 41–50 | cool, like the bars |
| Bucket — lit face | `pine_fresh` 3, `mud` 7 | L 49–54 | warm, like the posts |
| Bucket — dark body | `umber` 3, `grey` 0 | L 16–25 | |
| Dark pocket inside fence | `umber` 0–3, `grey` 0, `mud` 1 | L 9–26 | |
| Lit road | `pine_fresh` 2–6, `ochre` 8 | L 44–85 | |

The back fence's whole material vocabulary is drawn from `dust`, `dusk` and `grey` —
cool, desaturated families — while the near fence uses `pine_fresh` and `mud`. That
is aerial perspective done by **hue and saturation**, not just by value, and it is
why the back fence sits behind rather than merely appearing smaller.

---

## 6. Technique

**Bars are one pixel of light and one pixel of dark. No exceptions.**
The top bar's highlight is row y=82 and nothing else; row y=84 is its shadow. The
lower bar's highlight is row y=88 and row y=89 is its shadow. The back fence's rail
is row y=82 alone with no shadow at all. If any of these becomes two rows of light,
the region gains a horizontal stripe and loses a place.

**Posts are three columns: light, mid, dark.** Near post 127/128/129 at L 70/46/24.
Right post is the one variation — two lit columns (152, 153) then mid then dark, four
columns wide. Back post 114/115/116 at L 42/34/23. The dark column is doing as much
work as the light one; it is what holds the post off the pocket behind it.

**The crate is seated by a black line, not by a shadow.** Its contact shadow at y=80
drops to L 6.1, and the rail highlight two rows below runs at L 77 across x 139–146,
peaking at 81.5. That is a seventy-five-point swing across two pixel rows, and it is
why a thirteen-pixel
box with no silhouette contrast reads as sitting on something. Draw the black row
first; the bright run under the crate exists to serve it.

**The crate's face carries nothing legible.** Ten by seven pixels, twelve distinct
indices, almost all of them `umber` 3–5 within ±2 ramp steps of each other; the
longest same-value horizontal run is five pixels and the longest vertical run is
three. The composition brief shows a battened crate face with a stencilled shipping
mark on it. At 320×144 that mark resolves to six or eight darker pixels with no
shape. Draw the scatter; do not draw the mark.

**Texture is stipple, not dither.** Checkerboard bias across every sub-area of this
region measures 0.02–0.09, i.e. none. There is no ordered dither anywhere. What
there is: unstructured single-pixel scatter of ±1 ramp step. Mean horizontal step
between neighbouring pixels is 2.8–4.3 luminance on man-made surfaces (crate face,
bar rows, bench) and 4.6–4.9 on the road. The distance behind is noisier — 7.6 — but
that is the town's lights, not texture.

**Nothing is flat, and the flattest thing is the lower bar.** Row y=88 varies by only
6.6 standard deviation across twenty-two pixels. That evenness is what makes it read
as milled timber next to the ragged bench boards below it.

**Edges are hard everywhere.** There is no soft transition anywhere in this region.
The crate's inner shadow is a single column of a single index. The post's dark column
is a single column. Every one of these would be destroyed by a blend.

---

## 7. Boundaries with neighbouring regions

**Left (figure / lantern).** The back fence's rail must leave x=104 on **row y=82**
at `grey` 4 (L≈49) and be picked up at exactly that row by whoever draws toward the
signpost. Thad's coat and lit hand occupy x 104–107 down to y≈103; do not draw fence
into them. The lantern's ground pool is at its brightest *inside* this region — the
road at x 116–123 measures mean L 78 — and rolls off to L 47 by x 164–171. That roll-off
is roughly two luminance points every three pixels, about four `pine_fresh` ramp steps
across the region's width, and it must be continuous across both edges.

**Right (horse team / coach).** The **top bar dies at x≈154**, swallowed by the
horse's head; do not draw it further. The **lower bar survives to x≈163** in the gap
under the horse's jaw and must be handed to the team region at y 87–88. The horse's
dark mass begins around x=155 above y=90 and its lit muzzle (L 54–61) sits at
x 164–168, y 84–89 — the brightest thing at this region's right edge is not ours.

**Above (town / range).** The crate's top edge at y=71 sits two rows below a dark gap
and four rows below the pale distant roof band at y 68–69. Whoever draws that band
must not let it creep down to y=70, or the crate loses its top.

**Below (road).** The road's near edge under the fence is y 104–105 across
x 128–155. Cool blue-grey flecks (`sky` 1–3, `dust` 8) in two-to-four-pixel horizontal
runs begin at y≈106 and belong to the road; none of them should appear above y=105 or
they will read as frost on the fence.

---

## 8. What will go wrong

1. **The top bar gets drawn as a uniform two-pixel light bar the whole way across.**
   This is the most likely failure and it breaks four things at once: it blows the
   brightness budget (seven pixels at L≥80, not fifty); it removes the falloff to
   the right that keeps the eye moving toward the horses; it destroys the bright run
   at x 139–146 that seats the crate; and it converts a hitching rail into a graphic
   stripe. The bar's highlight has four distinct value zones along its length. Draw
   all four.

2. **The rails end up brighter than Thad.** The region's brightest structural pixel
   is L 81.5 against the lantern's L 122.8. Anything above about L 85 in this region
   competes with the only lit figure in the frame and the composition stops working.

3. **The posts get evenly spaced.** Measured gaps are 12.5 px and 25.5 px, and the
   three posts belong to two different structures at two different depths. Three posts
   at even spacing reads as fence wallpaper, and the region stops being a yard.

4. **The back fence becomes a small copy of the near fence.** The near post spans
   L 70.6 to L 24.1 — a 46-point range. The back post spans L 41.6 to L 22.6 — 19
   points. It is also built out of cool families (`dust`, `dusk`, `grey`) rather than
   warm ones. Shrink the near post without dropping its contrast and desaturating it,
   and it walks straight to the front of the picture.

5. **Someone makes the crate face readable.** It is ten by seven pixels. There is a
   stencil on it in the composition brief and it does not survive to this resolution.
   A legible mark here creates a second sign fighting the real signpost off the left
   edge, which is the one thing the player is supposed to read in this part of frame.

6. **The crate gets a silhouette.** Its face averages L 32.2; the backdrop it overlaps
   averages L 27–34. It has essentially zero value separation and that is correct. It
   reads through its lit frame and its black contact row, nothing else. Darkening it
   into a solid box or lightening it into a pale one both look like a mistake, and
   the second one turns it into a focal point.

7. **The dark pocket inside the fence gets lightened.** At mean L 28.4 it is darker
   than the hillside behind it. It looks like an unfinished area and invites filling
   in. It is the ground both bright bars are read against; lighten it and the fence
   dissolves into the backdrop.

8. **The bench boards get the same treatment as the rails.** The y=90 and y=92 bands
   sit ten to fifteen points above the darks between them; the real bars sit forty to
   sixty above. Give the bench the rails' contrast and the region becomes a ladder,
   with five equal horizontals and no hierarchy.

9. **Everything gets painted one warm brown.** Bar tops are cool and near-neutral
   (saturation 0.07–0.47, `dust` / `pine_weathered` / `grey`); post faces are warm
   (0.61–0.62, `pine_fresh`). The split is the lighting story: sky on the horizontals,
   lantern on the verticals. Collapse it and the region goes flat even at correct
   values.

10. **The near post is drawn at one polarity.** It is dark against the distance above
    the bar and bright against the pocket below it. Drawing it uniformly bright makes
    a light stick poking into the sky; drawing it uniformly dark loses the strongest
    vertical in the region.

11. **Ordered dither gets used.** There is none in the reference — checkerboard bias
    measures 0.02–0.09 region-wide. A 50% checker anywhere here will be the only
    regular pattern in the frame and the eye will find it instantly.

12. **The bars are anti-aliased or feathered.** One row of light, one row of dark. A
    softened bar is three rows of mid with no shadow, and it floats.
