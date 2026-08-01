# Region spec — `left_yard`

**Rect:** `(0, 34, 88, 96)` — native 320×144 coordinates, so columns x=0–87, rows y=34–129.
**Bar:** `reference/room-01/image-B-bar-320x144.png`. Every number below is measured off that
file. Image A was used only to settle what an ambiguous mass *is* — the wheel count, the
gantry's construction, the wording on the sign — never for detail.

Luminance throughout is Rec.709 (`0.2126R + 0.7152G + 0.0722B`) on the 0–255 scale.
Palette families and ramp steps are read off
`reference/room-01/image-B-in-locked-palette-320x144.png` against
`art/palette/consolation-256.json`.

---

## 1. What this region is

The left third of the stage-road establishing shot: a yard of stacked timber, a hanging
signboard reading CONSOLATION / 2 MILES with a small lit lantern beside it, a corral fence
running back, and a pair of wagon wheels leaning in the dirt.

It is the frame's **left repoussoir**. Its job is structural before it is descriptive:

1. **Stop the composition running off the left edge.** The picture opens to the right — town,
   road, coach, light. Everything in this region leans against that and holds the eye in.
2. **Be the dark that the lit road is light against.** Half of this rect is below L 25. The
   value of the lamp pool at bottom right is only impressive because of what sits beside it.
3. **Say where we are, in words, once.** This is the one piece of type in the game's opening
   frame. It is also the only place in the room where a reader is asked to *read* anything.
4. **Establish that the near plane is timber and the far plane is night.** Every warm mass in
   this region is wood. Everything cool is either sky, moonlight on a wet edge, or distance.

Two facts frame everything below.

**The region is a monotonic left-to-right value ramp.** Mean luminance by eight-column band:

| x band | 0–7 | 8–15 | 16–23 | 24–31 | 32–39 | 40–47 | 48–55 | 56–63 | 64–71 | 72–79 | 80–87 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| mean L | 21.1 | 20.7 | 24.9 | 21.0 | 28.6 | 31.4 | 30.4 | 32.2 | 36.8 | 42.5 | 50.0 |
| max L | 58.9 | 58.9 | 58.9 | 80.3 | 80.3 | 95.4 | 85.2 | 85.2 | 95.4 | 121.9 | 121.9 |

Read the max row twice. **Nothing in the leftmost 24 columns exceeds L 59. Nothing in the
leftmost 32 columns exceeds L 80.** The top of the ramp — 69 pixels above L 110, 0.8% of the
region — lives entirely at x ≥ 76.

**The region exercises the whole palette.** It uses 54 distinct indices; the entire 320×144
room uses 54. Every colour the room owns is present in this 88×96 rect. That is not a licence
to spread them — it is a warning that the region is doing a lot of work in a narrow band, and
that a careless index here will not be caught by "it's off-palette".

Region luminance distribution: p0 1.4 · p25 18.2 · **p50 25.4** · p75 39.7 · p95 69.4 ·
p100 121.9. Mean 30.9. 49% of the rect sits below L 25.

---

## 2. Elements, in draw order

Back to front. Every box is native, inclusive, in 320×144 coordinates.

### Background plane (not this region's to author — boundary contract)

**1. Sky.** x 0–87, y 34–~44. Mean L 20.9, median 19.3. `accent_indigo` 0–1 with `grey` 0–2
mixed in. Flat; see §5 on dithering.

**2. Ridge crest.** x 0–87, y 34–47. Darker than the sky it sits against — `grey` 0 (L 16)
against `accent_indigo` 0 (L 21), a five-point step. The crest enters at y≈44 on the left edge,
climbs to **y=34 at x≈26–28** (it touches, and passes through, the top of this rect — the peak
belongs to the `range` region), and falls away to y 42–46 from x≈32 rightward, flattening to
y≈46 across x 70–87.

**3. Distant town band.** x 28–87, y 44–53. Mean L 22.8, but with isolated single-pixel warm
windows reaching L 80–122 (`ochre` 8 and 13). These are the `town` region's marks. What matters
here: **the gantry beam crosses in front of them, and several show through the gap between the
beam and the top of the signboard.** That 5-row slot (y 57–61) is the only place in this region
where distance is visible below the skyline, and it is what makes the sign read as *hanging*
rather than *painted on a wall*.

### Mid plane

**4. Corral fence.** One panel only. Rails x 57–68, at y = **81, 85, 89, 92** (mean L 32.7,
48.9, 36.7, 27.8) with gaps at y = 83, 87, 91, 93 falling to L 12.7–14.7. Below y=93 the panel
goes near-black. Capped post at x 70–72, y 78–99, mean L 37.5, brightening on its right face
toward the lantern. **The panel ends at that post — it does not continue past x=72.** The rails
read as 1-px lit edges (`mud` 7–9, `pine_weathered` 6) over `grey` 0–1 gaps; there is no rail
body at this size.

**5. Gantry beam.** x 29–82, y 54–56. A dark top row at y=54 (L 13–20) over two lit rows at
y 55–56 (L 41–61, `pine_fresh` 1–3). Three rows total, 54 px long. It emerges from behind the
timber mass at x≈29–30 and **stops at x≈82–83**, a few pixels past the lantern hook — it does
not reach the region's right edge and it does not cross into the town. At x 83–87 the lit rows
fall to L 13–33. Its junction with the timber falls away as a short diagonal from about (24,54)
to (29,61).

**6. Hangers.** Three single-pixel dark verticals dropping from the beam's underside, y 57–61:

| element | x | mean L over y 57–61 |
|---|---|---|
| sign chain, left | 42 | 9.1 |
| sign chain, right | 65–66 | 14.5 / 17.5 |
| lantern hook | 76 | 21.8 |

The left chain is the darkest sustained mark in the upper half of the region. All three are
**one pixel wide**. They are the entire mechanism by which the sign and lamp read as suspended.

**7. Signboard.** Outer footprint x 30–74, y 61–79. **Lit face x 31–73, y 62–78 — 43 × 17.**
Whole-board mean L 50.9; top three rows mean L 67.0. Detail in §6.

**8. Gantry lantern.** Body x 74–80, y 63–72; hot core x 76–79, y 65–70. Twelve pixels reach
`ochre` 13 (L 122); 31 pixels exceed L 85; 55 exceed L 60. The glow is gone within about four
pixels — it lights the board's right end (x 74–76 at y 66–68 jump to L 75–85) and nothing else.
It does **not** throw a pool on the ground; the pool at bottom right belongs to the man's
hand-held lantern.

### Near plane

**9. Timber mass (lumber stack and gate).** x 0–24, y 42–96, continuing as posts and a crate to
y≈122. This is the region's anchor and it is almost entirely one value band: body mean L 24.9,
p25 15.6, p75 33.0, `pine_weathered` 0–1 and `dust` 0–1. Its parts:

- **Stepped top edge**, a three-tread staircase, not a slope: y=42 across x 4–9, y=45 across
  x 11–14, y=46–47 across x 15–24. Each tread capped by a 1-px cool moonlit line at L 47–59
  — the brightest cool marks in the region's left half.
- **Body**, x 0–24, y 55–92, striped by vertical pole seams roughly every 3–4 px, the seams
  dropping to L 13–17 and the lit pole faces reaching L 33–40.
- **Rails**, near-horizontal pale runs at y≈70–71, y≈84 and y≈89, each 1 px, spanning most of
  the mass's width. Image A carries a wire X-brace across this face. **At 320×144 the X does
  not survive** — it degrades into the y=70–71 rail plus scattered pale pixels. See §7.
- **Lit right edge**, x 23–24, a warm 1-px vertical at L 34–47 running y 60–88.
- **Lower posts and crate**, x 0–10, y 96–122.

**10. Shadow slot.** x 25–29, y 56–96. The near-black channel between the timber mass and the
left end of the signboard. **Columns x=28–29 fall to L 1.4–8.4 — the darkest pixels in the
region.** Mean over the slot 18.8, but that average is misleading: the slot's core is void.

**11. Sign post.** x 50–56, y 78–118. A squared timber, seven pixels across, split hard:
x 51–52 is a near-black core (L 11.6–15.6, `mud` 0–2 / `umber` 0–1), x 53–54 is a mid step,
**x 55–56 is a lit face at L 45–85** (`pine_fresh` 2–6 into `ochre` 8). It stays at L 22–26 all
the way down while the ground behind it climbs from L 25 to L 61 — so it silhouettes hardest
from y≈100 down. Its foot dissolves into the dark foreground around y 118–120; it does not get
a base.

**12. Crate and barrel stack.** x 28–49, y 84–116. Whole-group mean L 27.3. Four lit top edges
carry the entire read:

| element | box | lit edge |
|---|---|---|
| upper crate | x 42–48, y 84–95 | y=84, x 43–47, L 45–70 |
| lower crate | x 33–41, y 85–95 | y=85, x 33–40, L 31–51 |
| open barrel | x 38–48, y 95–103 | rim at y 95–96, weak, L 30–52 |
| plank / lid | x 30–42, y 103–106 | y=103, x 30–40, L 57–69 |
| small keg | x 28–36, y 111–116 | rim at y 113–114, L 33–69 |

Below each edge the body is L 8–25. **These objects are drawn as horizontal highlights with
darkness under them, not as modelled boxes.**

**13. Wheel pair.** Group box x 12–38, y 93–115. Two wheels, not one:

- **Far wheel** — centre ≈ (23, 104), radius ≈ 11. Drawn **only** as its iron tyre: a cool 1-px
  arc down the outer left, x 12–21, y 95–113, at L 32–40. No spokes, no felloe, interior black.
- **Near wheel** — centre ≈ (28, 103), horizontal radius ≈ 8.5, vertical radius ≈ 9.5, box
  x 20–37, y 93–113. Warm rim (`pine_fresh` 2, `umber` 6, L 39–43), dark disc.

The disc interior sampled on rings at radius 4–8 gives **mean L 21, standard deviation 13–17,
minimum 2.4, maximum 69** with no angular periodicity. There is no legible spoke pattern at
this size — the spokes exist as scattered single warm pixels among near-black. See §7.

**14. Ground and road.** x 55–87, y 96–129, in four horizontal bands:

| band | rows | mean L | what it is |
|---|---|---|---|
| base shadow | 92–99 | ~25 | where the fence, post and clutter stand |
| lit road | 100–114 | 53–79 | the lantern pool washing in from the right |
| foreground shade | 115–124 | ~23 | the near strip, in front of the light |
| rut catch | 125–129 | ~30 | ruts picking up a little light again |

**15. Lantern pool.** x 74–87, y 100–115. Mean L 79.0, median 74.6, 34 pixels above L 110.
`ochre` 8 and 13, `pine_fresh` 4–6, `umber` 14. **This is the brightest sustained area in the
region and it belongs to the man to the right**; it enters at the rect's edge and must be
continuous with whatever the neighbouring region draws.

**16. Man's hand-held lantern.** Body x 80–89, y 78–92: a hanger loop at x 84–87, y 78–81, then
the flame core at x 81–89, y 84–91, reaching L 122 across roughly eighteen pixels. **It straddles
the seam** — about two-thirds of it falls inside this rect. The man's own silhouette does not
begin until x≈92, so the lantern reads as held out at arm's length, clear of him, and its light
is unobstructed on our side. He is not ours; the lantern is.

**17. Puddles.** Isolated cool marks in the mud, `sky` 3 (L 76) against L 20–40 road: around
(65–68, 110), (73–77, 110–111), (84–87, 120–121) and (79–87, 126–127). Four small clusters, all
in the right half. They are the only cool notes below y=100.

**18. Foreground rubble and grass.** x 0–60, y 116–129. Mean L 22.8, p95 42.4. `grey` 0,
`pine_weathered` 0, `pine_green` 0. Texture, not objects.

---

## 3. Value structure

The region has **three light masses and one hot point**, and everything else is a floor.

| mass | measured L | share of rect |
|---|---|---|
| gantry lantern core | 122 | 12 px |
| lantern pool on the road | mean 79, p50 75 | ~200 px |
| signboard face | mean 51, top rows 67 | 792 px, 9.4% |
| everything else | median 25 | ~90% |

The **five biggest steps**, in order of how much they matter:

1. **Signboard face against the shadow slot on its left.** L 67.0 against L 2.4–8.4 at x 28–29.
   A step of roughly sixty luminance points, delivered over three pixels (the board's own
   shadowed left edge ramps 5 → 20 → 25 → 55 across x 29–32). This is the single most important
   edge in the region and the reason the sign reads at all.
2. **Signboard face against the sky and distance above it.** L 67.0 against L 25.5 in the
   5-row slot at y 57–61.
3. **Sign post against the lit road.** Post L 22–26 against road L 55–61 from y≈100 down —
   a hard, unbroken, seven-pixel-wide vertical of near-black crossing the brightest ground in
   the frame's left half. This is the "near timber as dark mass against lit ground" read, and
   the post carries it almost by itself.
4. **Fence rails against their gaps.** Lit edges L 36–61 over gaps L 12–15. Four repetitions
   at 4-px pitch. At this size a rail *is* its lit edge.
5. **Lantern core against its own surround.** L 122 against L 25–35 two pixels away.

What is darkest: **x=28–29 in the shadow slot (L 1.4)**, the wheel disc interiors (down to
L 2.4), and the leftmost column x=0 (column mean L 10.8, the darkest column in the region by a
wide margin). What is lightest: the lantern core and the road pool, both at x ≥ 76.

The board itself is **not flat**. It carries a lateral gradient of about +13 L from its left
sixth (mean 47.2) to x 67–72 (mean 60.0), because the lantern hangs at its right end. The
letters ride that ramp; they do not sit on an even field.

---

## 4. Palette families and ramp steps

Measured from the locked-palette proof. Percentages are share of that material's pixels.

| material | families and steps | L range |
|---|---|---|
| sky | `accent_indigo` 0–1, `grey` 0–2 | 16–34 |
| ridge | `grey` 0 (58%), `accent_indigo` 0 | 14–24 |
| town band | `grey` 0–3, `accent_indigo` 0–1, isolated `ochre` 8 / 13 | 16–125 |
| gantry beam, lit face | `pine_fresh` 1–3, `dust` 3, `mud` 6 | 36–53 |
| signboard face | `umber` 10, `dust` 8, `pine_fresh` 5–6, `mud` 9–10 | 60–82 |
| sign lettering | `pine_fresh` 0, `mud` 2–5 | 22–38 |
| sign post, shade | `mud` 0–2, `umber` 0–1, `grey` 0 | 9–22 |
| sign post, lit face | `pine_fresh` 2–6, `ochre` 8 | 43–84 |
| timber mass body | `pine_weathered` 0–1, `dust` 0–1, `mud` 1 | 17–33 |
| timber moonlit caps | `grey` 0–1 with cool cast, `mud` 0 | 47–59 |
| shadow slot | `grey` 0–1, `umber` 0, `void` | 1–24 |
| wheel disc interior | `umber` 0, `mud` 1–3, `void` | 0–26 |
| wheel warm rim | `pine_fresh` 2, `umber` 6 | 39–43 |
| corral rails, lit edges | `mud` 7–9, `pine_weathered` 6 over `grey` 0–1 gaps | 16–60 |
| lantern core | `ochre` 13 (39%), `ochre` 8 (18%) | 84–125 |
| lantern pool on road | `ochre` 8, `ochre` 13, `pine_fresh` 4–6, `umber` 14 | 61–125 |
| road mid tone | `pine_fresh` 2–5, `mud` 6, `umber` 5 | 34–69 |
| foreground shadow | `grey` 0, `pine_weathered` 0, `pine_green` 0 | 9–25 |
| puddles | `sky` 3 | 76 |

Two working rules fall out of this table.

**Timber is not one family.** Distant/shaded timber is `pine_weathered` and `dust` low steps;
lit near timber is `pine_fresh` mid steps; the signboard is `umber` and `mud` upper steps. The
family carries the plane, the step carries the light. Painting all the wood out of one ramp
flattens the depth immediately.

**There is only one `ochre` in the region and it is fire.** `ochre` 8 and 13 appear in exactly
three places: the lantern, the pool it throws, and the distant town windows. Nothing structural
— no timber, no rail, no rim — may reach into `ochre`.

---

## 5. Technique

**No dithering. Anywhere.** Tested on the locked-palette proof with a 2×2 checkerboard metric:
sky 0.006, town band 0.017, timber mass 0.002, signboard 0.010, lit ground 0.020, foreground
0.029 — all at or below the level a noise field produces by accident, against a flat-sky control
of 0.016. The bar carries fine per-pixel value scatter but **no ordered pattern**. Texture here
is made by scattering values within a two-to-three-step band, not by weaving two colours.

The sky in particular is nearly flat: 19% horizontal change per pixel pair against 85% in the
timber mass. Do not dither it, do not gradient it inside this rect, and do not put a star on the
ridge.

**Where edges are hard.** Three, and only three:

- The board's **right** end at x=73→74 (L 74.6 → 18.3, one pixel).
- The **top** of the board, y=62, a continuous pale run at L 69–95 across x 31–73, broken only
  by the two chains crossing in front of it at x=42 and x=65–66.
- The **sign post's lit face**, x 55→57 (L 45–85 → L 13–32, one pixel).

Everything else is a two-to-three-pixel ramp. The board's left edge in particular ramps rather
than cutting, which is what stops the board looking pasted on.

**Where one pixel is doing structural work.** This region is unusually dependent on single
pixels, and each of the following is load-bearing:

- The two **sign chains** and the **lantern hook** — 1 px wide, 5 rows tall. Nothing else in the
  frame says the sign hangs.
- The **fence rails** — four 1-px lit edges at 4-px pitch. There is no rail body, only an edge.
- The **far wheel's tyre** — a single cool arc, x 12–21. It is the only evidence there are two
  wheels.
- The **moonlit caps on the timber tops** — 1 px per tread. They are what separates the timber
  silhouette from the ridge behind it, which is only 5–10 L points away.
- The **lit top edges of the crates, plank and keg** — a horizontal highlight with dark below is
  the whole object.
- The **timber mass's lit right edge**, x 23–24, which is what keeps the mass from bleeding into
  the shadow slot beside it.

**Occlusion order that must be respected.** The timber mass covers the beam's left end (the beam
appears at x≈29). The signboard covers nothing — it floats in the 5-px slot with the shadow
channel on its left and clear night on its right. The sign post crosses in front of the corral
fence's left end. The wheels cross in front of the timber mass's lower body. The crates cross in
front of the near wheel's lower right.

---

## 6. The lettering

This is the only type in the frame. Getting it wrong is the most visible failure available in
this region.

**What is measured.**

| | line 1 | line 2 |
|---|---|---|
| text | CONSOLATION | 2 MILES |
| rows | y 65–70 | y 73–76 |
| cap height | **6 px** | **4 px** |
| horizontal extent | x 33–70 (38 px) | x 42–61 (20 px) |
| letter pitch | 3.45 px | ~2.9 px |
| centre | x 51.5 | x 51.5 |
| glyph L | 22–38 (`pine_fresh` 0, `mud` 2–5) | 28–44 |
| board L behind | 60–75 | 60–68 |

Both lines are centred on the board (face centre x 52). Between them sits a plank seam at
y 71–72 that runs brighter than the field either side — it separates the lines and it is the
board's construction showing, not a rule.

**How it is rendered, and how it must be drawn.**

At 3.45 px pitch, eleven capitals across 38 pixels, the glyphs are about **three pixels wide by
six tall with roughly half the letter pairs touching**. This is not a legible typeface and it is
not meant to be one. What the reader gets is a **rhythm of eleven dark marks** — round shapes at
positions 1, 2, 5 and 10 (C, O, O, O), a single stem at 9 (I), a centre stem at 8 (T), paired
stems at 3 and 11 (N, N). At 1× the word is recognised by silhouette and length, not read
letter by letter. That is the correct behaviour: the player is *told* what it says by being able
to LOOK at it.

Line 2 is a texture. At 4 px tall and 2.9 px pitch, "2 MILES" resolves to a shorter, fainter row
of ticks under the main word. It is never legible and must not be made legible.

Consequences for drawing:

- **Draw the word, not the letters.** Set the eleven marks on their 3.45-px rhythm first, get
  the round/stem alternation right, and only then decide what each glyph's pixels are.
- **Keep the strokes one pixel.** Every glyph stem measures 1 px. A 2-px stroke at this cap
  height turns the word into a solid bar.
- **Do not use the UI font.** The hand-authored 5×7 interface font is 5 wide and 7 tall. It does
  not fit, and if it is squeezed to fit it will be *cleaner* than the board around it, which
  reads instantly as an overlay rather than as paint on wood.
- **Let the board's texture through.** The letter pixels vary from L 22 to L 45 across the word
  because the board under them ramps +13 L left to right. Flat black letters on a flat board
  would be the same drawing with all the age taken out.
- **Do not straighten the board.** The top edge is level at y=62, but with ±1 px of hand-cut
  wobble (it dips to y=63–64 around x 42–44 and lifts to y=61 around x 57–60), and the bottom
  edge steps from y=78 at the left to y=77 from x≈48 rightward. The board is **not tilted** —
  do not rotate it — it is *irregular*. Those are different mistakes and only one of them is
  correctable later.

---

## 7. What will go wrong

Specific to this region, in roughly the order it will happen.

1. **The sign will be made too readable.** The instinct on the one piece of type in the frame is
   to make sure the player can read it. At 6-px caps and 3.45-px pitch that means widening the
   glyphs, spacing them out, or squaring them up — and any of those turns a weathered painted
   board into a signpost decal. Measured: eleven letters in 38 pixels, half of them touching.
   Draw it that tight and let LOOK do the rest.

2. **The second line will be given the same treatment.** "2 MILES" is 4 px tall and 20 px wide
   and it is *supposed* to be a smudge. Rendering it crisply makes the board read as printed
   rather than painted, and it puts two legible things where the composition wants one.

3. **The board will be tilted.** It reads as a hanging sign, so it feels like it should hang at
   an angle. Its top edge is dead level at y=62 across all 43 columns. The looseness comes from
   ±1 px hand-cut wobble on the edges, not from rotation. A rotated board also destroys the
   chains, which are perfectly vertical single pixels.

4. **The chains will be thickened.** They are one pixel wide and five rows tall, at L 9 and
   L 15–18. At 2 px they become posts and the sign stops hanging. They are also the only marks
   that break the board's bright top row — get them at x=42 and x=65–66 exactly, or the break
   lands in the middle of a letter.

5. **The wheel will be drawn as a wheel.** The reference contains a twelve-spoke wagon wheel and
   at 320×144 it does not survive: disc interior mean L 21, standard deviation 15, **no angular
   periodicity at any radius**. Drawing a clean spoked hub produces a bicycle wheel, a moiré
   pattern at integer scaling, and — worse — a mechanically regular object in the darkest corner
   of the frame, which drags the eye straight to it. What is there is a dark disc, a partly lit
   rim, and a handful of warm accents where a spoke catches. Nothing more.

6. **The second wheel will be dropped, or promoted.** There are two. The far one exists only as
   a cool 1-px tyre arc at x 12–21 and has no interior at all. Omitting it makes the near wheel
   look like it is leaning on nothing; drawing it properly puts two competing circles in a
   16-pixel span.

7. **The X-brace will be drawn.** Image A carries a clear wire X across the gate. At the bar's
   resolution it is gone — what survives is a near-horizontal pale run at y 70–71, another at
   y=84, and scattered pixels. Two clean diagonals across the timber mass would be the only
   diagonal lines in the region and would cut the anchor mass in half.

8. **The left third will be lit.** Nothing in x 0–23 exceeds L 59; nothing in x 0–31 exceeds
   L 80. Every instinct while working at 8× zoom on a bright monitor says the timber is unreadably
   dark and needs a rim light, a moon edge, some visible grain. It does not. Its readability comes
   from the stepped moonlit caps at the top and the lit right edge at x 23–24, and from nothing
   else. Adding value here flattens the left-to-right ramp that is holding the whole composition.

9. **The shadow slot will be filled in.** x 25–29 falls to L 1.4–8.4 and it will look like a
   hole. It is the reason the signboard reads. If it comes up to L 20 "so the timber's edge
   shows", the board's left end loses forty luminance points of separation and starts to look
   glued to the lumber pile.

10. **The lantern will throw a pool.** The gantry lantern is 12 pixels of `ochre` 13 and its
    influence dies within four pixels — it lights the board's right end and stops. The big warm
    pool at bottom right comes from the *man's* lantern at x 81–89. Giving the gantry lamp its
    own ground pool puts two light sources in the left third and destroys the reason the road
    brightens to the right.

11. **`ochre` will leak.** It appears in exactly three places: lantern, pool, town windows. It is
    a tempting family for lit timber and it must not be used there — a rail or a rim in `ochre` 8
    will read as a light source at native size.

12. **The clutter will be modelled.** The crates, barrel, plank and keg are each a 1-px lit top
    edge over a near-black body. Given side planes, hoops, staves and cast shadows they become
    six small objects competing at L 30–45 in the region's darkest quarter, and the wheel — which
    is the shape that actually matters down there — disappears among them.

13. **The fence will be given rail bodies, or extended.** Four rails, each a single lit pixel row
    at y 81, 85, 89 and 92, over gaps that go to L 12–15. Two-pixel rails at 4-px pitch will alias
    into a striped block at integer upscale, and they will out-value the sign post that crosses in
    front of them. The panel is also **twelve pixels long** and stops dead at the capped post at
    x 70–72; running it on to the region edge fills the space the lantern pool needs.

14. **The sign post will be softened.** It is seven pixels wide with a two-pixel near-black core
    and a hard one-pixel step to a lit face at x 55–56. It stays at L 22–26 while the ground
    behind it climbs to L 61. That unbroken dark vertical crossing the lit road is the region's
    strongest depth cue; feathering it, or letting the lamp wrap around it, removes it.

15. **The region will be dithered.** Measured checkerboard content is zero everywhere. Dither on
    the sky, on the road pool's falloff, or on the timber will read as noise at native size — and
    a moving-looking texture in a background is precisely what invariant 9 exists to keep out.

---

## 8. Boundary contracts

Things in this rect that only work if the neighbouring region agrees.

- **Nothing structural crosses the right seam.** Both the corral fence (ends x=72) and the gantry
  beam (ends x≈82) terminate inside this rect. The next region starts clean at x=88 with open lit
  ground; the man does not begin until x≈92. Do not draw either element as if it continued, and
  check that neither has been *extended* to the edge to meet a neighbour that is not expecting it.
- **The man's lantern straddles the seam and is ours to draw.** Body x 80–89, y 78–92, flame core
  x 81–89, y 84–91 — two-thirds inside this rect. The man holds it out well clear of his body and
  **he** does not begin until x≈92. The lantern must be authored once, here, and must not be
  duplicated next door; the two-column overhang past x=87 has to match exactly or the flame will
  read as two lamps.
- **The lantern pool is continuous across the seam.** x 74–87, y 100–115, mean L 79. It is the
  brightest sustained area we own and it keeps brightening rightward.
- **The lit ground ramps across the seam.** Mean L climbs 42.5 → 50.0 across the last two column
  bands and keeps climbing to the right. Terminating the ramp at the rect edge will show.
- **The ridge crest passes through the top of the rect** at y=34, x 26–28. It belongs to `range`;
  this region only guarantees not to break the sky above y=34.
- **The distant town band shows through the slot at y 57–61**, between the beam and the top of
  the board, across roughly x 43–64. Whatever `town` puts there is visible, and it is the only
  distance visible below the skyline in this region.
- **The road ruts and puddles at y 118–129** run continuously left to right and belong to the
  ground pass, not to this region's objects.
