# Room 1 — region spec: COACH

Region rect: **(210, 32, 110, 80)** native — x 210–319, y 32–111.

Bar: `reference/room-01/image-B-bar-320x144.png`. **Every measurement below is taken
from that file.** Luminance is `0.299R + 0.587G + 0.114B` on the raw bar. Palette
names come from `art/palette/consolation-256.json` via `tools/pixelart/palette.py`,
read off `image-B-in-locked-palette-320x144.png`. Study crops and the measurement
harness are in `work/room-01-study/coach/`.

Image A was consulted **only to identify blobs** — to learn what an ambiguous
four-pixel smear is meant to be. No geometry in this spec comes from A.

### A note on the A→B mapping, because it matters and a sibling spec has it wrong

B is a **straight full-frame resample of A** — all 1672×941 squashed to 320×144, no
crop. Measured: resizing the whole of A to 320×144 (Lanczos) differs from B by a
mean absolute error of **1.47 per channel**. The mapping quoted in `rail.md`
(`A.crop(0,120,1668,871)`) gives **13.6** and is not the mapping. Practical
consequence: A's pixel aspect is not B's. A is 16:9, B is 20:9, so **A is
vertically stretched relative to B by a factor of 1.25**. Anything measured off A
and carried across will come out too tall. This is exactly the trap the wheels set
— in A they look like vertical ellipses and they are not.

**Content overruns the rect on all four sides.** The coach's driver's box and front
boot run left past x=210 into the team region; the keg stack is cut by the frame
edge at x=319; the rear wheel's contact shadow drops to y=108; the reins leave the
rect at x=210 heading for the horses.

---

## 1. What this region is, and what it must communicate

A Concord-pattern stagecoach standing on the road at night, near side to us, front
to the left, hitched to a team that runs off left out of the region. A driver up on
the box. A man down at the open door, one hand on the door frame, half in and half
out. A strongbox on the ground by the front wheel. Behind and right, a fence line
and a stack of kegs at the frame edge.

It is the **largest single object in the frame** — about 91 × 68 px of the 320 × 144
— and structurally the most complex thing in the game so far. It is also the second
thing the eye reaches, after the lantern.

What it has to communicate, in order:

1. **A coach, immediately, in silhouette.** Roofline, body, two wheels, at a glance.
2. **A door standing open, with something dark inside it.** This is the story beat.
   The blackness of the doorway is the only large use of `void` in the region and it
   is the second-strongest value event after the lantern.
3. **Two men, and which one matters.** The man at the door is lit and facing us; the
   driver is a silhouette against the sky with four bright pixels of face.
4. **That it is about to leave.** Lamps lit, luggage lashed, strongbox still on the
   ground.

What it must **not** do is compete with the carried lantern at (85, 84). The lantern
is the brightest and only fully-warm thing in the frame and the coach must lose that
contest decisively. See §7 — that section is binding.

The region's own value statistics, for calibration:

| | L |
|---|---|
| min | 1.5 |
| p05 | 6.1 |
| p25 | 18.6 |
| **p50** | **24.6** |
| p75 | 33.0 |
| p95 | 51.0 |
| max | 122.8 |
| mean | 26.5 |

**This region alone uses all 54 palette indices that the entire 320×144 frame uses.**
It is the palette-widest region in Room 1. Twelve of the eighteen families appear in
it — `void`, `mud`, `umber`, `ochre`, `dust`, `pine_weathered`, `pine_fresh`,
`pine_green`, `sky`, `dusk`, `grey`, `accent_indigo`. The six that do **not** appear
are `sage`, `bone`, `accent_red`, `accent_rust`, `accent_gold` and `accent_teal`, and
none of them should be introduced here. Nothing else in the room stretches the palette
this far, and that is a reason to draw it early and let the rest of the room calibrate
against it.

---

## 2. Elements, extents, and draw order

Back to front. Boxes are native and inclusive.

### Behind the coach

1. **Sky and hills.** y 32–44 across the rect. L 19–32, p50 29.5, and only **10
   palette indices** — overwhelmingly `accent_indigo[0]` (L 21.7) and
   `accent_indigo[1]` (L 35.0). Owned by the sky region. Its value here is a
   constraint, not a choice: see §3.1.

2. **Fence line.** x 300–319, y 62–80. Lmed 22.0, p10 13.6, p90 33.0.
   `accent_indigo[0]` + `grey[1]` + `umber[5]`. Reads as two faint horizontal rails
   around y 66–70 and one barely-there post. Nothing else survives.

3. **Keg stack.** x 303–319, y 71–104. Lmed 24.6, p10 13.1, p90 31.6.
   `grey[0..1]` + `umber[4..5]` + `pine_weathered[0]`. In A this is a pyramid of
   round barrel ends. **At 320×144 not one keg resolves.** It is warm-brown texture
   at the frame edge with a total range of 18 L, and its p90 sits *below* the coach
   body's median. Keep it there.

### The coach — shell

4. **Rear boot (strapped trunk on the tail).** x 286–305, y 56–78. Lmed 20.1, only
   **23 indices** — the flattest large element in the region. `mud[0..2]` is 66% of
   it. Three features and no more:
   - lit top edge, y 57–58, L 33–59, brightest at x 289–291;
   - lit left corner, the column x 290–291, y 59–75, mean 25–37 with local maxima 46–56;
   - one brass buckle, **a single pixel at (298, 65), L 63**.
   The face x 292–304 is flat, mean 18–24, with strap banding at a contrast of about
   6 L. That is all.

5. **Boot platform / shelf.** y=78, x 283–305. One lighter row, L≈25, under the boot.

6. **Rear quarter panel.** x 278–284, y 58–84. The darkest large panel in the coach:
   Lmed **12.1**, composed 41% `mud[0]`, 26% `umber[0]`, 10% `void[0]`. The body
   goes to near-black at its rear because the warm key is on the left.

7. **Body shell, upper.** x 236–283, y 54–58. Row means climb 31.0 → 21.5 → 25.8 →
   31.2 → 35.1. `mud[0..5]` + `pine_fresh[0..3]` — a dark red-brown mahogany.

8. **Front corner post.** **The column x=238, y 57–79.** L 38–67, sustained for 23
   rows, with x=237 a dimmer support at L 16–52. This is the coach's leading edge
   taking the warm key from the left. It is one pixel wide and it is the second
   most important vertical in the region.

9. **Front quarter opening.** x 239–249, y 58–76. A dark recess, L 3–29, with a
   dead-black column at x=239. Mostly occluded by the standing man. **It is not a
   glazed window** — there is no frame, no glass event, nothing but a hole.

10. **Door pillar.** x 250–253, y 57–85. Mid warm, the vertical that separates the
    front quarter from the doorway.

11. **Open doorway.** x 254–262, y 59–85. **Lmed 2.6. Sixty per cent of it is
    `void[0]`**, the rest `umber[0]`. Its left edge is dead vertical at x=254 for 22
    unbroken rows, y 59–80. This is the darkest mass in the frame outside the deep
    sky, and it is the reason the coach reads as *open*.

12. **Coach lamp A — the interior lamp seen through the open doorway.** Core
    (261–262, 66–67). Three pixels at L 122.8, one at 86.8, a one-pixel ring at
    33–76, then straight into the doorway's void. Binding constraints in §7.

13. **Door leaf**, swung open toward us on its rear hinge so it reads nearly
    face-on. x 263–277, y 56–86.
    - **13a. Door window.** x 266–277, y 58–72. Lmed 16.8, 18% `void[0]`. The left
      column x 268–269 is the darkest and runs the full height. In A this opening has
      a rounded top corner; **at this size it is a plain rectangle**.
    - **13b. Coach lamp B — the lamp seen through the door glass.** Core (275–276, 65),
      two pixels at L 122.8, with a four-pixel ring at L 86.8 at (274–276, 64) and
      (274, 65). Slightly larger and slightly higher than lamp A. §7 applies.
    - **13c. Kick moulding and two studs.** y 74–76, x 266–275, L 40–59.
    - **13d. Gold scroll ornament.** In A this is a legible brass curl at
      x 266–273, y 78–81. **In the bar it survives as a 2–3 px lighter smudge** at
      about (269–272, 78–80), L 44–59. Draw the smudge. Do not draw the curl.

### The coach — roof

14. **Roof deck / cornice.** y 50–52, x 238–282, row means 27.6 / 30.8 / 25.6.

15. **Cornice shadow.** **y=53, x 238–282.** Row mean **16.9** — the darkest
    horizontal in the upper body, one row tall, running the full width. It is what
    makes the roof sit *on* the body instead of floating.

16. **Belt moulding.** **y=54, x 234–280.** Row mean 31.0, continuous. Read together
    with 15, this is a hard light-over-dark pair that separates roof from body in
    two rows.

17. **Roof rail.** **The single row y=49, x 239–279.** Row mean 46.8 — the brightest
    row anywhere in the coach. It is not flat: **L 82 at x 239–240, falling
    monotonically to 26 at x=279.** A partial second bright row exists at y=48,
    x 260–277 (L 44–70) where a lashed bundle behind it catches the same light.
    `dust[3..8]` + `pine_weathered[6]` + `umber[5..10]`.

18. **Roof cargo.** x 239–292, y 43–49, top edge undulating: y=44 at the crest
    (x 265–271), y=49 at the troughs.
    - **18a. Left crate.** x 239–251, y 44–49. Its lit left face peaks at L 82 at
      (239–240, 44).
    - **18b. The black trunk.** **x 252–259, y 44–48. L 2–16.** Eight pixels wide,
      five tall, and it is the darkest thing in the top half of the frame. It sits
      directly against a sky of L 20–21. It is a **negative shape — a notch bitten
      out of the skyline** — and it does half the silhouette work for the whole
      coach. Do not soften it, do not fill it, do not lose it to a re-block.
    - **18c. Lashed bundles.** x 260–292, y 44–49. `pine_fresh[0..2]`, `grey[2]`,
      with `accent_indigo[0]` showing through the gaps between them.

### The coach — running gear

19. **Rear wheel.** Centre **(271.5, 95.5)**, outer radius **10.5 in x, 11.5 in y**.
    Bbox x 261–282, y 84–107.
    - **19a. Rim. Two pixels thick.** Mean L in the rim annulus, by angle: **peaks at
      55–60 across the 30°–60° sector** (upper right), **bottoms at 29 at 180°**
      (left). Range 29–60. The cool key comes from up and to the right; the rim is
      the clearest statement of that in the region.
    - **19b. Spokes. Twelve, at ~30° pitch, one pixel wide.** Measured by polar
      sampling of the annulus r 4.5–9: twelve angular peaks averaging **L 39.5**
      against troughs averaging **L 15** — a separation of about **24 L**, three to
      four ramp steps. They only physically separate outside r≈5; inside that the
      pitch is under 2.5 px and they merge into the hub. They are broken, not
      continuous.
    - **19c. Hub.** Roughly 3 × 3 at (270–272, 94–96), a slightly lighter blob with a
      darker centre.
    - **19d. Axle.** The lit horizontal at y 95–96 continues right past the rim to
      about x=284.
    - **19e. Contact.** Bottom of the rim at y=107. A 5 × 2 dark patch at
      (276–280, 106–108), L 8–29. That is the whole contact shadow.

20. **Front wheel.** Centre **(233, 90)**, outer radius **≈6.5–7**. Bbox x 226–240,
    y 83–97. **This is not drawn as a wheel.** See §5.1 — it is the single most
    misdrawn thing in this region and it has its own section.

21. **Step board.** A broken lit diagonal: y=93 at x 239–247 (L 38–59), stepping down
    to y=94 at x 247–253 (L 41–59). The man's feet meet it at y≈92.

22. **Front boot and driver's box.** x 214–238, y 59–80. Warm, mid, with the boot's
    trimmed edge running down-right at L 38–51 from about (216, 69) to (224, 75).

### Figures

23. **Driver.** Bbox **x 216–236, y 43–70. Height 28 px** (seated).
    - hat crown x 227–231, y 43–45; brim x 226–235 at y=46;
    - **face x 228–231, y 47–51** — about 4 × 5 px, peaking at L 122.8 at (230, 48)
      and (230, 51). At y=47 the run reads bright–dark–bright–dark–bright: that is
      the moustache, and it is three pixels;
    - coat x 226–236, y 51–58, Lmed 38.2, `pine_fresh[0..3]` + `mud[4..5]` — **warm**;
    - hands on the reins, two clusters at x 220–223 and x 226–229, y 57–59, L 62–97;
    - trousers x 217–227, y 58–67, Lmed 24.4, `grey[0..3]` — **cool**;
    - boots x 216–223, y 66–70, near-black.
    He is **the only figure in the region read against the sky.** His warm silhouette
    starts at y=43; everything above is sky. Below the waist the warm/cool split
    between his coat and his trousers is what keeps his legs off the coach.

24. **Standing man.** Bbox **x 235–254, y 61–92. Height 32 px.**
    - hat x 239–246, y 61–64, near-black, L 2–24;
    - **face x 240–244, y 65–69**, four pixels at L 122.8 across (240–243, 67);
    - **neckcloth x 241–244, y 70–72**, four more at 122.8 — a cream cloth, not skin;
    - coat x 236–249, y 73–90, Lmed 30.5, `grey[0..3]` — **cool**;
    - raised right hand x 251–254, y 70–72, peaking L 122.8 at (253, 71), gripping the
      door frame and crossing the doorway's blackness;
    - left hand x 235–236, y 76–78, L 76–87;
    - legs x 238–247, y 82–90, `umber[0]` / `grey[0..1]` / `void[0]`, Lmed 22.
    Face and neckcloth together are a **5 × 8 mass with p50 46.3 and a p75 of 66.8**,
    set against a coat at 30.5 and a doorway at 2.6. It is the brightest sustained
    area of the coach and it is where the eye lands after the lantern.

### In front

25. **Strongbox.** x 219–236, y 96–106. Lit lid edge at y 96–97, L 40–63, with two
    brighter pixels at x 220 and x 222. Flat face L 19–32. **One warm lock pixel at
    (228, 101), L 54.** Sits on the road at y≈106.

### Draw order

```
sky / hills → fence → kegs → boot → rear quarter → body shell →
doorway void → lamp A → door leaf → lamp B → roof deck → cornice shadow →
belt moulding → cargo → black trunk → roof rail → driver → front boot /
driver's box → rear wheel → front wheel → step board → standing man →
strongbox → contact shadows
```

Two orderings are load-bearing. **The rail goes on last of the roof group**, over
the cargo, because it is a single row and any cargo drawn over it breaks the line.
**The standing man goes on after the wheels**, because his legs cross the front
wheel's right edge at x 237–240.

---

## 3. Value structure

### 3.1 The body against the sky — the thing everybody gets wrong

Sky mean behind the coach roof (y 36–44, x 240–300): **26.0**.
Cargo mean (y 45–48, x 260–280): **36.7**.

**The separation is 11 L.** The reference does not separate the coach's mass from the
sky by value at all. Everything in the coach's upper silhouette sits within about ten
luminance points of the sky behind it.

All the silhouette work is done by exactly two features, both tiny:

- **the roof rail**, one row at L 47–82, i.e. **+21 to +56 over the sky**;
- **the black trunk**, an 8 × 5 patch at L 2–16, i.e. **−10 to −24 under the sky**.

One pale line above and one black notch inside. That is the entire read. If you raise
the body's value to make it "read better", you get a coach-shaped grey slab, you
flatten the sky the sky region worked to keep at 10 indices, and the rail — which is
the object's whole top edge — stops being a line and becomes a bevel.

### 3.2 The horizontal banding of the body

Row means across x 240–280, top to bottom. This alternation is the coach's structure
and it survives at any size:

| rows | what | row mean L |
|---|---|---|
| 44–48 | cargo | 31–36 |
| **49** | **roof rail** | **46.8 — brightest row** |
| 50–52 | roof deck | 26–31 |
| **53** | **cornice shadow** | **16.9 — darkest upper row** |
| 54 | belt moulding | 31.0 |
| 55–58 | upper panel | 21.5 → 35.1 |
| **59–62** | **window band** | **13.5–19.4 — darkest body band** |
| 63–72 | the event band: lamps, face, neckcloth | 24–40, peaks 122.8 |
| 73–80 | lower panels | 20–33 |
| **81–83** | **undercarriage shadow** | **16–19** |
| 84–107 | wheels over road | 21–27 |

LIGHT → DARK → MID → DARK → *the bright events* → MID → DARK. Six alternations in
forty rows. Get this ladder right in graybox and the coach is legible before a single
texture pixel is laid.

### 3.3 The wheels against the road

Road under and around the coach: L 26–40, brightening downward toward the frame edge.

- Rear wheel rim: **29–60**, with the 30°–60° sector at **55–60** — that is
  **+20 to +30 over the road** and it is the only part of either wheel that clears
  the background.
- Front wheel lit arc: **45–60**, +15 to +30.
- Everything else in both wheels — hubs, lower rims, felloes, the whole right half of
  the front wheel — sits **inside the road's own range** and does not separate at all.

The wheels are not two discs. They are **two lit arcs and a lot of mottle.**

### 3.4 The dark of the door opening

Lmed **2.6**; 60% `void[0]`, 22% `umber[0]`. It is the only large use of `void` in the
region. Against the door leaf's lower panel at Lmed 28.5 and the door pillar at mid
warm, the doorway is a **26-point drop across one pixel** at x=254, held for 22 rows.
That hard vertical edge is the single most valuable line in the region after the rail,
and it should be drawn before any of the door's ornament.

### 3.5 The lamps

Both lamps peak at **L 122.8**. That is also the peak of both faces, the neckcloth,
the standing man's hand and the carried lantern — the bar caps every specular in the
frame at the same value, and 167 pixels frame-wide sit there. **Peak value is not
what separates anything in this frame.** Area is. See §7.

### 3.6 The figures against the coach

Neither figure separates from the coach by value mass. Both separate by two things:

- **A small very bright head.** Driver: 4 × 5 at up to 122.8. Standing man: 5 × 8 at
  p50 46.3, p75 66.8, peaks 122.8. In both cases the bright head sits directly under
  or beside a near-black hat (L 2–24), so the value jump is 100+ across one row.
- **Temperature.** Driver: warm coat (`pine_fresh` / `mud`) over cool trousers
  (`grey[0..3]`). Standing man: cool coat (`grey[0..3]`) against warm body panels
  (`mud` / `pine_fresh`). Take the temperature split out and both men dissolve into
  the coach at 2× viewing distance.

---

## 4. Palette — families and ramp steps per material

Read off the locked-palette quantisation. Region quantisation error: mean **6.5**,
p50 5.1, p95 15.3, max 18.0 — comfortably inside the frame-wide 8.9.

| material | families and steps | Lmed |
|---|---|---|
| body panels, front | `mud[0..5]`, `pine_fresh[0..3]` | 31.1 |
| body panels, rear | `mud[0]` 41%, `umber[0]` 26%, `void[0]` 10% | 12.1 |
| roof rail (moonlit weathered wood) | `dust[3..8]`, `pine_weathered[6]`, `umber[5..10]` | 46.9 |
| roof deck / cornice | `pine_fresh[0]`, `mud[1..4]`, `umber[0]` | 26.3 |
| roof cargo (sacking, canvas) | `pine_fresh[0..2]`, `grey[2]`, gaps in `accent_indigo[0]` | 27.8 |
| black trunk | `umber[0]`, `void[0]`, `grey[0]` | 20.1 |
| doorway / glass (the void) | `void[0]` 60%, `umber[0]` 22% | 2.6 |
| door leaf lower panel | `pine_fresh[0..3]` 55%, `mud[2..4]` 32% | 28.5 |
| boot canvas | `mud[0..2]` 66%, `pine_fresh[0]`, `umber[0]` | 22.0 |
| iron — wheel tyres, hardware | `grey[0..3]`, highlight to `dust[3]` | 30.6 |
| brass — buckle, lock, studs | `umber[7..10]`, `ochre[8]` at the brightest | 48–63 |
| lamp flame | **`ochre[8]` (L 85) and `ochre[13]` (L 126) only — two steps** | — |
| driver's coat | `pine_fresh[0..3]`, `mud[4..5]` — warm | 38.2 |
| driver's trousers | `grey[0..3]` — cool | 24.4 |
| standing man's coat | `grey[0..3]` 49% — cool | 30.5 |
| standing man's legs | `grey[0..1]`, `umber[0]`, `void[0]` | 22.2 |
| strongbox | `mud[1..5]`, `pine_fresh[0..2]` | 26.3 |
| kegs | `grey[0..1]`, `umber[4..5]`, `pine_weathered[0]` | 24.6 |
| fence | `accent_indigo[0]`, `grey[1]`, `umber[5]`, `mud[1..2]` | 22.0 |

Notes that matter:

- **`ochre` is the lamp family and nothing else.** It appears in this region only in
  the two lamp cores, the two faces, the neckcloth, the lit hand and the brass. If
  `ochre` shows up in a body panel, the panel is being lit by something that is not
  there.
- **`grey` is the cool family and it does all the temperature work** — wheel tyres,
  both men's lower halves, the fence, the kegs. It never appears in the body panels.
- **`accent_indigo[0]` is the sky, and it is allowed to show *through* the cargo** in
  the gaps between lashed bundles. That is the one place a background family belongs
  inside the object silhouette, and it is why the cargo's top edge reads as lumpy
  rather than as a solid.
- **`accent_gold` does not appear in this region at all**, and must not. See §7.

---

## 5. Technique

### 5.1 The wheels — read this before drawing either one

This is the thing everyone gets wrong, so it is spelled out.

**The rear wheel is a wheel.** Rim two pixels thick, brightest in the upper-right
sector at L 55–60, dimmest on the left at 29. Twelve one-pixel spokes at 30° pitch,
drawn at **L 39 against a disc interior of L 15** — a 24-point separation, three to
four ramp steps, *not* a full-contrast line. The spokes are broken. They resolve only
outside radius 5; inside that they merge, and the reference lets them merge rather
than fighting it. A 3 × 3 hub. That is the whole wheel.

**The front wheel is not a wheel.** It is an arc. Only the **90°–190° sector** is
drawn — the upper left — as a run of eight to ten pixels at L 45–60 tracing
(231, 83) → (228, 85) → (226, 88–89) → (227, 90). Measured mean L in the rim annulus
by sector: 33–47 across 90°–180°, and **10–26 across 0°–75°**. The right half of the
front wheel is simply absent, lost into the dark of the undercarriage. **There are no
spokes.** Polar sampling of its interior finds no angular periodicity at all — it is
mottle at L 14–52.

And the reason the arc reads: **immediately inside it there is a hard dark column at
x=228, y 87–90, at L 9–15.** Rim at 45–60, shadow at 9–15, adjacent columns. **A
40-point drop across one pixel.** The front wheel is legible because of that edge, not
because of its shape. Draw the arc without the dark column and it becomes a scratch.

### 5.2 There is no dither

Measured ABAB (checkerboard) rates in the bar: whole region **5.9% horizontal / 4.7%
vertical**; road under the coach 2.6% / 1.4%; rear wheel disc 1.6% / 1.0%; the highest
anywhere is the boot canvas at 11.1% / 7.6%. Those are noise floors, not patterns.
**Nothing in this region is deliberately dithered.**

The reference gets its gradation from having 208 distinct colours in a 110 × 80 area,
which quantises cleanly into 54 palette indices at a mean error of 6.5. Our job is to
reproduce that read with ramp steps, not with mixing. Two further reasons not to
dither here:

- the region is drawn at native 320×144 and displayed at a 3× or 4× integer upscale;
  a 50% checker across an 18 × 22 boot face shimmers;
- **the coach is a removable object layer** (§8). A dither that keys to the background
  behind it will tear when the coach departs.

If a surface needs to sit between two ramp steps, use the intervening step. Every
family in play here has 12–20 of them.

### 5.3 Hard edges — where the drawing is one pixel of commitment

- **The roof rail**, y=49, 41 px long, one row, with y=50 at Δ−19 beneath it.
- **The cornice shadow**, y=53, one row, 45 px, at Δ−14 under the deck.
- **The doorway's left edge**, x=254, dead vertical for 22 rows, Δ−26.
- **The front corner post**, x=238, 23 rows at L 38–67 against a dark recess at 3–29.
- **The front wheel's rim-to-shadow**, x=227 → 228, Δ40 in one step.
- **The boot's lit left corner**, x 290–291, 17 rows.

### 5.4 Single pixels doing structural work

The buckle at (298, 65). The strongbox lock at (228, 101). The rear wheel hub. The
two lamp cores. The driver's moustache — three pixels at y=47. Each of these is the
only thing telling you what its object is. None of them may be moved to a neighbouring
pixel "to tidy the shape".

### 5.5 The rail's falloff is the light direction

The rail is **not** flat: L 82 at x 239–240 → 26 at x=279. It falls off by 56 points
across 41 pixels. That gradient, plus the rear quarter panel sitting at Lmed 12.1
against the front quarter's 31.1, is the entire statement that **the warm key comes
from the left** — from the lantern and the town. Draw the rail at a constant value and
the coach loses its light source.

The **cool** key is separate and comes from **up and to the right** — that is the
rear wheel rim's 30°–60° peak, the fence, and the road ruts. Two keys, two
temperatures, two directions. Both must survive.

---

## 6. What the reference chooses NOT to draw

At this size, omission is a decision. The reference omits all of the following, and
each one is present and legible in image A:

- **All twelve spokes of the front wheel.** And its lower and right rim.
- **The arched top of the door window.** It is a plain rectangle here.
- **The door handle.** A clear brass bar in A. Gone.
- **The gold scroll on the door panel.** Reduced to a 2–3 px lighter smudge.
- **The roof rail's stanchions.** The rail is one continuous row; its uprights are not
  drawn.
- **Every individual strap on the rear boot.** Only faint banding at ~6 L, and one
  buckle pixel.
- **Every individual keg.** The stack is texture across an 18 L range.
- **The fence pickets.** Two faint rails only.
- **Any exterior coach lamp.** There is none anywhere on this coach. Both warm points
  are interior lamps — one seen through the open doorway, one through the door glass.
  Do not add a lamp at the front corner because a stagecoach ought to have one.
- **Eyes, mouths, hands with fingers.** The driver's face is 4 × 5 and his moustache is
  three pixels. The standing man's face is a flat bright mass.
- **The far-side wheels** as distinct objects.
- **Any coach-shaped cast shadow on the road.** Measured: road under the coach
  (x 250–295, y 107–111) means **36.3**, road right of the coach means **32.5**, and
  the road brightens continuously toward the bottom of frame regardless of what is
  standing on it. There are only two local contact darkenings: a 5 × 2 patch under the
  rear wheel and a flat L=19 run at (224–233, 98) under the front.
- **The reins, effectively.** They are drawn, but at **L 22–32 over a sky of L 21–35**
  — a separation of about ±5. They read as texture, not as lines. See §9.

---

## 7. BINDING — the lamps, and the reserved `accent_gold` band

**The coach lamps must stay dimmer than the carried lantern at (85, 84), which is the
brightest and only fully-warm thing in the frame. `accent_gold` steps 4–7 (indices
225–228) belong exclusively to that lantern's flame. The coach lamps must not use
them.**

### 7.1 What the reference actually does

Both coach lamps and the carried lantern top out at exactly the same bar colour,
`(155, 118, 63)`, L 122.8, which quantises to **`ochre[13]`, index 50, L 126.0**.
Frame-wide, 167 pixels sit at that value. **In the reference the peak luminance gap
between the coach lamps and the carried lantern is zero.**

The lantern wins entirely on **area** and on **spill**:

| | pixels at peak (L 122.8) | warm energy in its own box | falloff | ground pool |
|---|---|---|---|---|
| coach lamp A | **3** | 2,195 | 123 → <20 in 2–3 px | none |
| coach lamp B | **2** | 2,373 | 123 → <20 in 2–3 px | none |
| carried lantern | **22** | 9,847 | 123 → ~47 over 5–6 px | x 42–139, y 88–125 |

Ratios: **7.3× and 11× on peak-value pixel count**; **4.5× and 4.1× on warm energy**.
Once the lantern's ground pool is counted — 98 × 38 px, 2,651 warm pixels, 93 of them
at L ≥ 110, **warm energy 153,169** — the lantern outweighs either coach lamp by
**about 70×**.

### 7.2 What we must do instead, and the gap to state

Our locked palette can do better than the reference, and should. `accent_gold[4..7]`
runs **L 135.9 / 156.3 / 180.6 / 203.4** — every step of it is brighter than anything
in the entire reference bar, whose global maximum is 122.8.

So:

- **The carried lantern's flame core spends `accent_gold[4..7]` (225–228).**
- **The coach lamps stop at `ochre[13]` (index 50, L 126.0).** Their ramp is exactly
  two steps: `ochre[13]` core, one ring of `ochre[8]` (L 85), then a one-pixel
  transitional ring in `pine_fresh[4..6]` (L 62–76), then straight into the doorway's
  `void`. That is what the reference does and it is enough.
- **The mandated luminance gap in favour of the lantern is therefore at least +9.9 L**
  (`ochre[13]` → `accent_gold[4]`) **and up to +77.4 L** (`ochre[13]` →
  `accent_gold[7]`). **The reference's own gap is 0.0.** We are deliberately opening a
  gap the reference does not have, because we can, and because at 320×144 a two-pixel
  lamp that is the same value as the hero light will read as a second hero light.

### 7.3 Practical rules for drawing the lamps

- Lamp A: **three pixels** of `ochre[13]`, not four. Lamp B: **two**.
- One ring at `ochre[8]`. One transitional ring. Nothing beyond.
- **No bloom on the surrounding panels.** No light thrown on the door leaf's face, on
  the standing man, on the step, or on the ground. The reference throws none.
- **No cycling.** Design invariant 9: cycling never conveys information, and nothing
  stops or starts cycling because a state changed. These lamps sit on an object that
  departs — animating them would make the coach's state readable as motion. They are
  static.

---

## 8. BINDING — the coach is an OBJECT STATE, not background art

The coach departs during the game. The engine composites it as a separate layer, and
it must be drawable as a unit that can be removed cleanly — along with the team and
the light it throws.

### 8.1 What makes this easy (and it is mostly easy)

- **No cast shadow is baked into the road.** Measured in §6. Nothing coach-shaped
  survives removal.
- **The lantern's warm pool does not reach the coach.** Its bright pool (L ≥ 80) ends
  at **x≈139**, seventy-one pixels short of the rect. The entire region is lit by
  moonlight plus the coach's own two interior lamps, so removing the coach removes a
  self-contained lighting event and leaves nothing orphaned.
- **The team does not overlap the coach.** The nearest horse's rear silhouette is a
  near-black column at **x 220–221 (L 2–9)**; the front wheel's lit arc starts at
  **x=226**. Between them, x 222–225, is unobstructed moonlit road at L 19–45.
  **A clean 4-pixel seam.** Protect it — it is the reason the coach and the team can
  be separate layers at all.

### 8.2 What makes it hard, and must be authored deliberately

1. **The reins.** Two one-pixel warm chains leave the driver's hands at (220–229,
   57–59) and descend left across the **sky and the hill silhouette**, exiting the
   rect at about (210, 66) and (210, 70), continuing to the team. They belong to the
   coach layer — they go when it goes. **They must be authored on the coach layer, not
   painted into the sky**, and the sky and hills beneath them must be complete. At
   L 22–32 against a sky of 21–35 they are nearly free to lift, but only if the pixels
   underneath exist.
2. **The boot occludes the fence and the top of the keg stack** at x 300–306,
   y 56–80. That background must be complete under it.
3. **The coach occludes the road ruts** from y≈96 to y≈108 across x 240–305. The ruts
   are long continuous diagonals owned by the road region; they must run unbroken
   underneath.
4. **The strongbox at (219–236, 96–106) touches the front wheel.** Box top y=96, wheel
   bottom y=97. If the strongbox is a separate object that remains after the coach
   leaves, it needs its own layer and its silhouette must not depend on the wheel. At
   present only road sits behind its top edge, so it is safe — **re-check this seam
   after any re-block.**
5. **Everything else rides with the coach**: driver, standing man, step board, front
   boot, both wheels, contact shadows. The standing man's raised hand crosses into the
   doorway void at (251–254, 70–72) and his left hand sits over the front boot at
   (235–236, 76–78); neither crosses out of the coach's own silhouette, so the figure
   can live on the coach layer without a hole.
6. **The coach's own occlusion of the sky matters to the sky region.** Sky mean behind
   the roof is 26.0 against a cargo mean of 36.7. Whoever draws the hills must not
   brighten the band **y 36–44, x 240–300**, or the coach's silhouette disappears when
   it is composited. Flag this to the sky and range regions.

---

## 9. Where this region meets its neighbours

**Left — the team.** Two rein lines cross out at about (210, 66) and (210, 70) at
L 22–32. The coach pole runs left at y≈85–87. The horse's silhouette edge is the
near-black column at x 220–221. The 4-pixel road seam at x 222–225 must stay open.

**Below — the road.** The ruts run continuously under the coach and are covered, not
interrupted. Two contact darkenings belong to the coach: (276–280, 106–108) at L 8–29
and the flat L=19 run at (224–233, 98). The road is measurably brighter under the
coach (36.3) than to its right (32.5) — the depth gradient wins over the object, and
that is correct.

**Right — fence and kegs, then the frame edge.** The boot occludes the fence at
x 300–306. The keg stack runs to x=319 and is cut by the frame. Both are background
and must exist behind the coach.

**Above — sky and hills.** The roof line crosses the hill silhouette between x 240 and
x 300. Contrast there is 11 L. It is the tightest silhouette read in the region and it
is a shared constraint, not a local one.

---

## 10. What will go wrong

1. **Someone will draw the front wheel as a wheel.** It is an arc of eight to ten lit
   pixels in one quadrant. Close the circle or add spokes and it becomes the second
   brightest object in the region and steals the eye from the open door — which is the
   story beat. This is the single most likely failure in this region.
2. **Someone will draw the rear wheel's twelve spokes at full contrast.** They are
   Δ24 L, broken, and only separate outside r=5. Drawn cleanly they read as a
   pinwheel, and a radial pattern at 320×144 reads as **motion** — which design
   invariant 9 forbids on a static object.
3. **Someone will make the coach lamps compete with the lantern.** Three pixels and
   two pixels. Two ramp steps. No pool. §7 is binding.
4. **Someone will separate the coach from the sky by value.** The reference does not —
   Δ11. All of it is a one-row rail and an 8 × 5 black notch. Raising the body flattens
   the sky and kills the rail.
5. **Someone will draw the rail at a constant value.** It falls 82 → 26 across 41 px.
   That falloff *is* the light direction.
6. **Someone will lose the black trunk on the roof.** Eight by five pixels of L 2–16
   doing half the silhouette work. It looks like a hole because it is one.
7. **Someone will add an exterior coach lamp.** There is no exterior lamp. Both warm
   points are interior.
8. **Someone will detail the boot.** It is 23 palette indices, a flat mid slab, one lit
   top edge, one lit corner, one buckle pixel. Straps at readable contrast turn the
   tail of the coach into the busiest object in the frame, 25 px from the frame edge.
9. **Someone will dither.** Nothing here is dithered. At 3–4× integer upscale it
   shimmers, and it will tear when the coach layer lifts.
10. **Someone will give the figures faces.** 4 × 5 px and 5 × 8 px. Eyes at this size
    produce a skull.
11. **Someone will lose the temperature split.** Cool: wheel tyres, both men's lower
    halves, fence, kegs, road. Warm: body, cargo, boot, lamps, driver's coat, both
    faces. Drift warm and the wheels stop separating from the road; drift cool and the
    coach stops being wood.
12. **Someone will paint the reins into the sky.** They belong to the coach layer.
13. **Someone will bake a shadow under the coach.** There isn't one — only contact.
14. **Someone will make the kegs legible.** Their whole range is L 13–32, entirely
    below the coach body's median. They are frame-edge texture and must stay there.
15. **Someone will measure off image A and get everything 25% too tall.** A is 16:9,
    B is 20:9. See the note at the top.
