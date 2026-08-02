"""Room 1 — the coach team. Three horses, 69 x 36 px, at rest.

Three harnessed horses standing still with their heads down, drawn as ONE
horizontal dark mass 69 px long and 36 px tall whose only strong internal
information is a flat topline, a straight belly line, nine hooves on two
ground lines, and four warm sparks of bridle metal — and which is separated
from the sky behind it NOT BY VALUE but by hue and by two one-pixel rims of
opposite polarity.

WHY THREE AND NOT TWO. team.md §3 settles it with three independent
measurements, and records them because a rebuild will be tempted to
simplify: three separate lowered head shapes, each with its own furniture;
NINE HOOF CONTACTS between x 172 and x 218, where two horses can show at
most eight; and two toplines with a 5-px step plus a third back that is
neither of them. Two animals cannot produce nine feet.

THE PROPORTIONS ARE THE ANIMAL, not the outline (§4). Against a 27 px
withers height: barrel depth 11, LEG 16. A dog is the other way round, and
§9.1 says if those come out 14 and 13 the result is a mastiff and no amount
of mane will save it. The head is 13 px — HALF THE HEIGHT OF THE ANIMAL —
which feels wrong and is the single most under-drawn measurement here.

THE ANIMALS ARE NOT DARKER THAN THE SKY. Not usefully. Averaged along the
whole topline, background 2-3 px above the edge is L 28.1 and hide 2-3 px
below it is L 21.4 — a gap of 6.7, 2.6% of the scale. What separates them is
WARMTH: hide +14 to +28, sky −13 to −26. A 40-unit hue swing across a 7-unit
value step, and §9.5 warns that the 6.7 will feel far too subtle at 8x and
somebody will "fix" it by darkening the hides, which pushes them into the
chest shadow's family, kills the mane and turns the team into a hole.

THE TWO TOPLINES ARE LIT IN OPPOSITE DIRECTIONS AND THAT IS THE DEPTH CUE.
C's back at y 69-72 is a black cut-out, −26 against the sky. A's back at
y=75 is a BRIGHT COOL RIM, +14 against it — one row, 22 px long, warmth −7
sitting on hide at warmth +26. §9.4: it looks like an error in the data. It
is the only thing that puts the near horse in front of the far one.

AND THERE IS NO SEAM ACROSS THE TOP OF THE MASS. From x 160 to x 193 the far
and middle horses merge into one continuous silhouette with nothing between
them. §9.3: adding a separating line there produces two flat paper cut-outs,
which is precisely the failure the offset toplines exist to avoid.

THE HOLES ARE AS IMPORTANT AS THE SOLIDS. Six background gaps between the
legs and one sky wedge under C's jaw. §7: nine hooves are drawn and without
the holes they are one dark skirt; the wedge is six cool pixels and it is
the difference between a lowered head and a thick neck. Both are drawn here
by NOT drawing — every mass is built column by column with a measured top
and a measured bottom, and a hole is a column the loop never enters.

THE HIDE IS THE BUSIEST SURFACE IN THE FRAME AND IT IS NOT A DITHER. §7
measures a mean horizontal run of 1.27 px in the mane and 1.65 in the lit
barrel, 68-80% single-pixel runs, and no repeating motif anywhere: no
checkerboard, no ordered matrix, no 50% mix between two adjacent steps of
one ramp. What is actually there is per-pixel stipple alternating between
`pine_fresh` and `mud` AT THE SAME LUMINANCE, which is why the barrel reads
as hair while its value profile stays smooth top to bottom. `_Hide` below
copies the statistic rather than a pattern: a first-order Markov field whose
flip probability IS the reciprocal of the target mean run, so 0.61 gives
1.65 px on the barrel and 0.79 gives 1.27 px on the mane, and a second,
uncorrelated field resolves the fractional rung of the value ladder so the
gradient itself never bands.

IT RIDES WITH THE COACH. coach.md §8 makes the coach a removable object
layer and errata 31d makes the shipping background the departed
composition; the team is hitched to the vehicle and leaves with it, so this
region draws nothing when ctx.with_coach is False. That is also what makes
the coach layer come out of a difference of two composes.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


#: §4. C is the odd one out — set back, and standing with its head less far
#: down. B and A read as a pair at the same depth, separated only sideways,
#: and that asymmetry is why the group looks like animals rather than like a
#: repeating stamp. Heads begin at x 153, 161, 171: +8, then +10.
C_HEAD = layout.HORSE_C_HEAD
B_HEAD = layout.HORSE_B_HEAD
A_HEAD = layout.HORSE_A_HEAD

#: §3.5. The topline runs essentially flat from x=160 to x=193 and C's croup
#: is the step down at x 193→194.
MASS_LEFT, MASS_STEP, MASS_RIGHT = 160, 194, 221

#: §3.5, measured off the bar: the top row of the far mass, column by column,
#: for x 170 to 193. It is flat to within four pixels over twenty-four
#: columns and the wobble IS the edge — drawn dead straight the far animals
#: become a plank, drawn with a curve they become one animal with a
#: swayback. Left of x=170 the crest is a solid black bar and its top row is
#: CREST_TOP.
#: CLAMPED AT 70, and the clamp is a measurement rather than a smoothing.
#: §3.5's row lists five columns at 68 or 69, and at those columns the bar's
#: own pixels say the mass has not started: averaged over x 172-193 the bar
#: runs L 30.1 at y=69 and 25.1 at y=70, against a far hide §5 measures at a
#: median of 17.9 and a crest at 7.1. Nothing on this animal is L 30. Those
#: two rows are the town showing over its back, and drawing them as hide put
#: a two-pixel dark lip along the whole top of the mass — which is what the
#: silhouette was catching on above the middle horse.
TOPLINE = tuple(max(70, row) for row in
                (69, 69, 69, 70, 70, 71, 71, 69, 68, 71, 71, 72,
                 71, 70, 70, 70, 70, 68, 69, 70, 70, 71, 71, 72))
TOPLINE_FROM = 170
CREST_TOP = 69

#: §3.4. The near-black bar ends at x=171 and the topline goes on to x=193
#: without it. Measured, x 160-169 at y 70 is L 0-4 and x 172-193 at y 71 is
#: L 8-20 — one is a cut-out and the other is an edge, and drawing thirty-four
#: columns of the first is what turned three animals into a building.
CREST_RIGHT = 171

#: §3.4, measured across the bar's three crest rows. The bar is SOLID out to
#: x=169 and gone by x=171, and its top row only reaches black between x=161
#: and x=166 — the mane stands highest in the middle of the crest, which is
#: where a mane does stand highest.
CREST_SOLID = 169
CREST_CORE = (161, 166)

#: §3.3, measured. Six cool pixels widening downward from 2 px to 6 px, per
#: row y 77-81 as (left, right) inclusive. THE SINGLE MOST LOAD-BEARING
#: NEGATIVE SHAPE IN THE REGION — the difference between a lowered head and a
#: thick neck.
JAW_WEDGE_TOP = 77
JAW_WEDGE = ((162, 163), (162, 163), (160, 163), (159, 163), (159, 164))

#: §3.12. Six highlight peaks between x 180 and x 195 along a 19 px axis at
#: 28° above horizontal. Pitch 2-4 px, mean 3 — and §7 says do not comb them
#: into an even pattern, the measured pitch varies. The second number is how
#: far each stroke stands proud of the crest line, and it varies too.
MANE_POLL = (177, 84)
MANE_WITHERS = (194, 75)
#: Re-measured as column means over y 76-85, which is where the mane band
#: actually crosses those columns. The bright columns come out at 180, 182,
#: 185, 188, 190 and 192-193 against §3.12's "≈ 181, 183, 186, 188, 190, 194" —
#: within the ± the spec's own "≈" allows, and the beat matters more than the
#: absolute position: drawn a column off, the peaks landed on the reference's
#: TROUGHS and the mane read as an inverted comb.
MANE_PEAKS = ((180, 3), (182, 4), (185, 4), (188, 3), (190, 4), (193, 3))

#: §3.12's three levels. Peaks L 50-70, troughs L 30-44 by the spec's summary
#: and L 8-24 where the strokes are widest apart; the lit ridge they stand on
#: runs L 30-40. The swing per stroke is the 20-40 L §3.12 asks for and no
#: more: at a 50 L swing the strokes stop being hair and become a comb.
#:
#: RAISED, AND THE TROUGH MOST OF ALL. The 3x3 difference map put the whole
#: mane band 17 L under the bar — the worst block error left in the rect
#: after the topline — and it was the trough doing it: a column one away from
#: a peak took MANE_TROUGH, and the bar's columns one away from a peak are
#: (186, 78) at L 30, (186, 79) at L 70, (187, 79) at L 45. The band the
#: strokes stand on is bright HIDE, not a gap; only the columns two and three
#: away fall to L 21-33. Held at 18 the six strokes stood alone on a dark
#: neck, which is exactly the picket fence §7 warns about, arrived at from
#: the other side: the strokes were right and the ground between them was
#: black.
MANE_PEAK, MANE_BAND, MANE_TROUGH = 64.0, 42.0, 30.0

#: §4.5. The neck leaves the body at the withers and rises at 28°, and it is
#: NOT a constant thickness: measured on the bar the lit plane under the
#: crest is four rows deep behind the poll and twelve by the time it reaches
#: the shoulder. It runs a column past the withers at each end so that it
#: meets the head at one end and the back at the other with no seam.
NECK_FROM, NECK_TO = 175, 197

#: The lit ridge the six strokes stand on, measured x 178-196.
MANE_BAND_FROM, MANE_BAND_TO = 176, 196
NECK_DEPTH_POLL, NECK_DEPTH_SHOULDER = 4, 12

#: HEAD_BROW_POWER, HEAD_CHIN, HEAD_MUZZLE_LIFT and HEAD_THROAT_LIFT were
#: here, and between them they described ONE head shape — a power-curve brow
#: and a chin thirty per cent along — which all three animals then took. Two
#: of the three came out as the same rectangle nine columns apart, and at
#: 320x144 that is not a team, it is a stamp. Replaced by HEAD_EDGES above:
#: three measured outlines, one per animal. Nothing else read them.

#: `_face_light`'s four numbers for B then A — (rim, face, poll, nasal) —
#: fitted to the two measured column profiles quoted there. A carries a 32 L
#: hump on a 15 L poll and B carries 14 on 16: the near head is modelled and
#: the middle one is nearly flat, which is what puts them at different depths
#: without moving either of them. Both peaks sit a fifth to a third of the way
#: back from the muzzle, never at the muzzle itself.
#:
#: AND THE FIRST NUMBER IS NEAR-BLACK, NOT MID. B's leading rim was 26 — the
#: same value as the sky it stands against — and the bar puts it at L 1-11:
#: (164, 84) and (164, 85) are 1, (163, 85) is 11, (163, 86) is 6. That rim
#: is not shading, it is the CONTINUATION of §3.5's gullet: dark-pool census
#: over the region finds one connected near-black mass of 34 px running from
#: (161, 73) diagonally down to (164, 86), the front edge of C's neck handing
#: over to the front edge of B's face. Ours broke it into singles, and a
#: 34-px pool broken into singles is invisible two steps down the squint
#: ladder — which is where the head stopped reading. The poll end comes down
#: with it: measured x 169-170 runs L 6-16 where this said 15-18.
HEAD_PLANES = ((5.0, 34.0, 10.0, 0.33),       # B, the middle horse
               (12.0, 46.0, 12.0, 0.22))      # A, the near horse

#: §5. The hide ladder. Each rung is TWO entries at the SAME luminance, one
#: warm-chestnut `pine_fresh` and one `mud`, because §7 is explicit that the
#: barrel is not a mix of two steps of one ramp — it is stipple between two
#: FAMILIES at matched value. Written as (material, offset) pairs so that
#: nothing here names an index and every step is a move along a family the
#: shared material table already chose.
#:
#: AND ABOVE L 26 EVERY RUNG IS LED BY `pine_fresh`. This is a census, not a
#: taste. Counting the locked-palette proof of the bar over A's barrel
#: (x 196-218, y 76-86) the four commonest entries are
#:
#:     pine_fresh@1  22%      pine_fresh@0  15%
#:     mud@4         13%      mud@1         12%
#:
#: — the lit plane is pine at L 26.8 and 35.6 with mud@4 beside it, and the
#: only dark entry is the harness. The old ladder put `umber` 4-5 and `mud` 2-3
#: on the rungs the barrel actually lives on, and those carry warmth +16 to
#: +21 against a measured +26 to +28. That six-unit hue error is the whole of
#: §5's "40-unit hue swing across a 7-unit value step" being quietly spent:
#: the animals came out the right VALUE and the wrong COLOUR, and a warmth
#: deficit at matched luminance is exactly what a saturation ratio of 0.72
#: measures.
#:
#: Note the deliberate hole between L 28.0 and L 34.7. The reference has the
#: same one — it owns nothing between pine_fresh@0 and mud@4 in this region
#: and dithers the two — so a rung fitted into the gap would be a value our
#: source does not use.
#:
#: Every entry below is inside §6's twenty: `pine_fresh` 0-4, `mud` 0-7,
#: `umber` 0-5, `void` 0.
HIDE_TONES = (
    (("horse_black", 0), ("horse_hide_shadow", 0)),       # void 0    / umber 0
    (("horse_hide_shadow", 0), ("horse_hide_mid", -3)),   # umber 0   / mud 0
    (("horse_hide_shadow", 1), ("horse_hide_mid", -2)),   # umber 1   / mud 1
    (("horse_hide_mid", -1), ("horse_hide_shadow", 3)),   # mud 2     / umber 3
    (("horse_hide", -1), ("horse_hide_mid", 0)),          # pine 0    / mud 3
    (("horse_hide_mid", 1), ("horse_hide_shadow", 5)),    # mud 4     / umber 5
    (("horse_hide", 0), ("horse_hide_mid", 2)),           # pine 1    / mud 5
    (("horse_hide", 1), ("horse_hide_mid", 3)),           # pine 2    / mud 6
    (("horse_hide", 2), ("horse_hide_mid", 4)),           # pine 3    / mud 7
    (("horse_hide", 3), ("horse_hide", 2)),               # pine 4    / pine 3
)
TONE_LUMINANCE = (4.5, 10.8, 15.6, 23.7, 26.5, 34.0, 36.7, 43.0, 50.5, 56.9)

#: §3.5, THE FAR ANIMAL IN SECTION. Row means over x 161-177 — the columns
#: that are C and nothing else — from its own topline down:
#:
#:   14  12  18  21  17  15  14  14  18  24  20  21
#:
#: which is not a ramp and is not flat. It is four things: the near-black two
#: rows under the crest, a lit strip where the top of the neck turns up to the
#: sky, the shadowed body of the neck (the darkest part of the far animal, and
#: §5's L 17.9 median lives here), and then a lift through the lower neck and
#: the chest where the road throws light back up. The old model capped at 20
#: from the fourth row down, which is the same value for two thirds of the
#: animal, and no amount of stipple makes one value into a neck.
FAR_PROFILE = (5.0, 10.0, 17.0, 20.0, 17.0, 15.0, 14.0, 14.0, 18.0, 23.0,
               20.0, 21.0)

#: The floor the STIPPLE may reach. `void@0` is 21-31% of the crest, the tail
#: and the chest shadow and is used NOWHERE ELSE in the region (§6) — so the
#: mottled planes are clamped above it and only the four hard-edged masses,
#: which ask for it by name, ever get there. Unclamped, the wobble put 170
#: single black pixels through the hide against the reference's 99 pooled
#: ones, and a plane with black speckle through it reads as sawn timber.
STIPPLE_FLOOR = 10.0

#: §7's measured run lengths, as MEAN RUNS, one pair per surface: how long the
#: warm member holds and how long the cool one does. A first-order Markov chain
#: whose two states have mean runs (w, c) spends w/(w+c) of its length warm, so
#: the asymmetry is the chroma control and the mean of the pair is §7's
#: statistic: mane 1.27 px, legs 1.35 px, lit hide 1.65 px.
#:
#: WHY IT IS ASYMMETRIC. A symmetric chain gives the two families equal area,
#: which averages their warmth — and the two families are not equally warm at
#: matched value: `pine_fresh` runs +24 to +45 where `mud` runs +16 to +33. The
#: reference's barrel does not split evenly either; it is 37% pine_fresh
#: against 25% mud (see HIDE_TONES), so pine holds the longer run and mud is
#: the interruption. Same statistic, right colour.
RUN_MANE = (1.45, 1.10)
RUN_LEG = (1.55, 1.15)
RUN_HIDE = (1.95, 1.40)

#: §3.19 AND §9.7, RE-MEASURED COLUMN BY COLUMN. Nine legs and eight gaps,
#: as (first lit column, lit columns, dark columns behind, which lit column
#: is brightest). The last number is why this is a table and not an offset:
#: §9.7 refuses a comb, and a comb is what four identical columns stamped
#: nine times is — the light does not sit in the same place on every leg.
#:
#: WHERE THE NUMBERS CAME FROM. Column means over the nine rows above each
#: contact, taken off the bar and set beside the same means taken off this
#: module's own render. The bar has an unmistakable rhythm across x 170-219:
#:
#:   lit  171-173  176-178  181-182  185-187  190-192  195-197  199-202
#:        207-211  215-218
#:   dark 174      179-180  183      188-189  193      198      203-206
#:        212-214
#:
#: — lit columns at L 23-41, dark at L 8-20, and the alternation NEVER pauses.
#: Ours ran the same nine legs one and two columns to the left of every one of
#: them, so every dark trailing edge landed on hide and every lit column
#: landed in a gap. The distribution was right — the same count of light and
#: dark pixels in the same rect — and the drawing was a picket fence out of
#: phase with its own posts, which is the exact failure §9.7 names and the
#: exact failure a summary statistic cannot see.
#:
#: The two wide entries are measured too and are not slips: leg 7 is §3.19's
#: "two legs merged into one 6-px mass", and the four dark columns behind it
#: are the daylight between A's foreleg and its hind leg, which the bar runs
#: at L 1-12 for eight rows. Leg 8 is five columns because the gaskin stands
#: in front of it (§3.19's item 8 reads as the back rank).
LEGS = ((171, 3, 1, 2), (176, 3, 2, 0), (181, 2, 1, 0), (185, 3, 2, 1),
        (190, 3, 1, 2), (195, 3, 1, 1), (199, 4, 4, 0), (207, 5, 3, 1),
        (215, 4, 0, 1))

#: The lit plane at its peak, how far it falls per column away from the peak,
#: and the dark column behind. §7: 2-3 px of hide across, LIT ON THE LEADING
#: EDGE with 1 px of `umber@0` behind it — and it is the hard black line
#: rather than the light that separates nine legs into nine.
LEG_PEAK, LEG_FALL, LEG_DARK = 42.0, 5.0, 5.0

#: §3.20, measured, and §7 calls them as load-bearing as the legs: six cool
#: BACKGROUND holes between the legs, L 18-29 at warmth −7 to +2. They are the
#: hillside seen through the team, not the animals' own shade, and §9.8 is
#: explicit that painting them warm and dark closes the silhouette and loses
#: every leg. Each is (x0, x1, y0, y1) inclusive.
#:
#: THEY ARE DRAWN BY NOT BEING DRAWN, so every mass that could reach into one
#: has to ask. The whole lower half of this region used to be a solid apron
#: from the underline to the ground — x 197-215 filled black from y 86 to 91,
#: on the reasoning that a gap between the fore and hind legs would make the
#: animal read as a table. Measured, the reference has exactly that gap: holes
#: 5 and 6 are the daylight between A's foreleg and its hind leg, and closing
#: them is what turned nine legs into one dark skirt.
#:
#: AND THE LAST TWO ARE SHORTER THAN §3.20's BOUNDING BOXES. §3.20 gives them
#: as (198-202, 91-95) and (204-209, 90-93); measured cell by cell, only the
#: top of each is cold. x 199-202 is cold at warmth −12 to −30 on y 91-92 and
#: WARM at +15 to +48 on y 93-95, where it is the lit front of leg 7 — so the
#: box, drawn out in full, painted three rows of cold grey straight down the
#: middle of a leg. Same at x 204-205, which is warm and near-black from y=93
#: down: that is the shadow between A's fore and hind legs, not sky through
#: it, and LEGS above draws it as the dark side of leg 7.
HOLES = ((170, 172, 89, 97), (178, 179, 91, 96), (185, 187, 88, 96),
         (190, 192, 92, 95), (199, 202, 91, 92), (206, 209, 90, 92))

#: §3.17 exactly: the underline is ONE dark row. Measured across x 202-215 it
#: runs L 4-14 at y=86 and is back to L 16-32 by y=87 — the rows under it are
#: the stifle, the gaskin and the gap between them, not more shadow.
UNDERLINE_Y = 86
#: ...and it starts at x=202, not at the pole's left end. See `_tack`.
UNDERLINE_FROM = 202

#: §5.2's rim, measured end to end: it starts at the withers ramp and runs to
#: the far side of the croup, x 195-221, not the 22 px the summary quotes.
RIM_FROM, RIM_TO = 195, 221

#: The trace strap across the barrel, measured (see `_strap_x`).
STRAP_TOP, STRAP_LEAN = 205.0, 0.30

#: §3.14, THE LIGHT ON THE BARREL, measured as a cylinder rather than as a
#: ramp. Row means across x 196-218 run 38, 34, 32, 30, 30, 30, 28, 28, 25
#: from y=76 to y=84: a fall of thirteen luminance that is steepest in the
#: first two rows and flattens through the middle, which is what the side of a
#: barrel does under a light directly above it. §5.3 says there is no
#: left-to-right LIGHTING gradient, so this profile is the whole of the light
#: on this plane and every deviation across it below is harness or bone.
BARREL_TOP, BARREL_FALL, BARREL_CURVE = 38.0, 13.5, 0.75

#: §3.14, THE ANIMAL UNDER IT. Measured column means over y 76-85, x 194-218:
#:
#:   31 27 32 33 29 28 27 34 36 37 35 30 27 24 32 28 32 35 34 34 26 26 27 26 25
#:
#: — thirteen luminance of swing across a plane the spec calls unlit sideways,
#: which is the point: it is not light, it is five objects. Named here as the
#: planes they are, offsets from the row mean, so that the profile stays a
#: description of an animal rather than a row of numbers. Each is inclusive.
#:
#: THIS IS THE MODELLING THAT WAS MISSING. Without it the barrel is one flat
#: plate twenty-four pixels wide with a gradient down it, and a flat plate
#: with a gradient down it is a bale of hay. The ribs and the loin are what
#: make it a body, and the two dark verticals between them are what make it a
#: harnessed one.
BARREL_PLANES = (
    (194, 195, -1.0),   # the shoulder blade, turning away behind the neck
    (196, 197, +2.5),   # the point of the shoulder, catching the sky
    (198, 200, -3.0),   # the collar strap, crossing in front of the ribs
    (201, 204, +5.5),   # the sprung ribs — the widest part of the animal
    (205, 207, -5.0),   # the hame strap and the girth behind it
    (208, 209, -1.5),
    (210, 213, +4.0),   # the loin, the second lit plane
    (214, 218, -4.5),   # the point of the hip, falling into the flank
)

#: Where the flank starts losing light into the point of the hip. Measured,
#: columns 214-218 run four to eight luminance under 210-213 at every row
#: below y=82.
HIP_FROM = 214
#: The hind quarter under the barrel, RE-MEASURED row by row rather than as
#: three bands at one value each. The bar over x 202-218, y 87-91:
#:
#:   y87  21 26 33 26 14 30 | 23  6  1 | 14 32 33 26 32 31 26 | 11
#:   y88  25 26 32 18 25 20 |  6  1  1 |  8 37 41 26 26 26 18 |  1
#:   y89  21 25 11  6  8  4 |  6 11  1 |  1 11 41 37 32 31 21 |  6
#:   y90   8  8  1  8 12 15 | 19 14 11 |  6  1  8 41 41 26 25 | 11
#:   y91   4  1  1  8 21 24 | 21 20 19 |  8 14  6  6 32 31 21 | 25
#:
#: Three things this says that three flat bands did not. The stifle FALLS —
#: L 26 at y=87 to L 4 by y=91, a five-luminance-a-row collapse into the
#: shadow the forelegs stand in. The gaskin is x 213-217 and not x 211-218:
#: 211-212 are the dark gap's own columns and 218 is the outside of the hock,
#: near-black at L 1-11. And the dark gap between them LIFTS as it comes
#: down, 1 at y=88 and 19 by y=91.
#:
#: WHY IT MATTERS MORE THAN IT LOOKS. The dark-pool census puts the bar's
#: single largest near-black mass in this region at 63 px, x 199-214,
#: y 86-101 — the underline, the collapse under the stifle and the gap
#: between A's fore and hind legs, all ONE connected shape. Held at 16-27 the
#: band never joined up and ours came out as four separate pools of under 20
#: px each. §7 lists the underline among the four hard edges in the region;
#: this is the mass it is the top of.
GASKIN = (213, 217)
GASKIN_GAP = (208, 212)
STIFLE = (202, 207)
HOCK_X = 218

#: The hame strap, measured: one column about four L under its neighbours.
HAME_X = 198

#: §3.18's darkest mass, as a centre rather than as a rectangle.
CHEST_CORE = (184, 87)

#: Where the pooled shadow begins, and where it doubles. See `_cast_shadow`.
#: §3.24 puts the pool at y 99-105; it starts higher than that because the
#: body blocks the sky from y=90 down, but only at half the depth until
#: the feet are in it.
SHADOW_TOP = 90
HOOF_LINE = 100

#: §3.2. C's head, measured as an AXIS rather than as a box. The row the
#: measurements are anchored on, the centre of the lit nasal plane on that
#: row, and how far it walks left per row down: 158.8 at y=71 falling to
#: 153.8 by y=81. The left EDGE is no longer derived from this — see
#: HEAD_EDGES, which measures it.
HEAD_AXIS_ROW = 71
HEAD_NASAL_AT_71 = 158.8
HEAD_LEAN = -0.5

#: THE THREE HEADS ARE THREE OUTLINES, AND THE OUTLINE IS THE WHOLE READ.
#:
#: At 320x144 a horse's head is six to ten pixels across, and at that size an
#: object reads by SILHOUETTE before it reads by shading — the taper from
#: jaw to muzzle, the break at the poll, the angle the neck leaves at.
#: Interior modelling cannot rescue a wrong shape and adding it to one makes
#: the shape worse, so nothing below is shading: it is the measured first and
#: last row of every column of every head, and three heads at three depths
#: get three different profiles rather than one stamp moved twice.
#:
#: What each one is, and where it came from — warm/cold and value read off
#: the bar column by column, hide against the cold hillside behind it:
#:
#:   C  Two pixels of ear at x 157-158 on y=69 and NOTHING ELSE on that row;
#:      the head widens to six by y=73 and steps one column LEFT at y=80;
#:      the muzzle bottom is flat at y=81 against the rail, and the throat
#:      column at x=159 stops two rows short of it (§8: the muzzle abuts the
#:      end of the rail exactly). The ear is the top of the whole group and
#:      §7 says without it C's head is a post.
#:
#:   B  TEN columns wide at the poll and SIX below it. x 161-162 exist for
#:      one and two rows and then stop: measured, x 158-162 on y 84-86 is
#:      COLD at L 18-35 — background, the same channel the sky wedge above it
#:      opens, and the reason B's head is a head rather than the left end of
#:      a wall. Below the jowl the jaw falls away to x 163-168 with the chin
#:      at the FRONT (x 163-165, to y=95, where §3.8's bit mark sits) and the
#:      throat climbing behind it to x 170 at y=88.
#:
#:   A  Nine columns at the poll narrowing to seven, and its far cheek stops
#:      five rows above its muzzle. B and A are EXACTLY LEVEL (§4) and
#:      separated only sideways, so the only thing that can put A in front is
#:      the shape of its own outline against B's — a different taper on a
#:      different rhythm. Drawn as B's rectangle moved nine columns right,
#:      which is what it was, the two are one object.
#:
#: Each entry is (first row, last row) inclusive for one column, left to right.
C_HEAD_X = 153
C_HEAD_EDGES = ((80, 81), (73, 81), (70, 81), (71, 81),
                (69, 81), (69, 81), (70, 79))

B_HEAD_X = 161
B_HEAD_EDGES = ((82, 82), (82, 83), (82, 95), (82, 95), (83, 94),
                (83, 93), (83, 92), (82, 91), (82, 93), (82, 88))

A_HEAD_X = 172
A_HEAD_EDGES = ((82, 95), (82, 95), (82, 94), (82, 93),
                (82, 93), (82, 92), (82, 90), (82, 92), (82, 92))

#: The leading edge of B's face, as (row, column). It LEANS FORWARD, which is
#: down and to the left, at about three quarters of a pixel a row — the same
#: fifteen degrees off vertical §4 gives all three head axes. See `_heads`.
B_FACE_RIM = ((82, 166), (83, 165), (84, 164), (85, 164), (86, 163))

#: The near-black seam between B's head and A's, as (column, first, last).
#: Three columns, not one, and it steps forward as it descends.
HEAD_SEAM = ((171, 83, 88), (170, 85, 88), (169, 87, 92))

#: §3.5's gullet — the near-black diagonal down the front of C's neck.
#: Measured dark cells: (161, 74), (162, 76), (162, 77), (163, 78), (164, 78),
#: (165, 80), (166, 81), (167, 81) — nine rows, leaning about 0.7 px per row.
GULLET_FROM = (161, 73)
GULLET_ROWS = 10
GULLET_LEAN = 0.7

#: Where each leg becomes separable from the mass above it, measured. It is
#: NOT one line: the two behind the hanging heads only appear at y=93, the
#: forelegs at 90, and the hind pair leaves the underline at 88. §9.7 —
#: evenly spaced legs on a single baseline read as a fence, and that applies
#: to the top of the leg as much as to the bottom.
LEG_TOP = (93, 93, 93, 90, 90, 88, 90, 92, 88)

#: Errata 35d. `graze` is 0 for a head down and 1 for a head raised and
#: chewing, PER HORSE, and the two are out of phase because two animals
#: lifting together is a pantomime horse. It applies to B and A: they are
#: exactly level with each other (§4), so a lift on one is legible, while C
#: is 13 px higher already and lifting it would put the group above the
#: coach roof.
GRAZE_LIFT = 3

#: The region rect, which is where the stipple fields are generated. The
#: content is smaller than this — §0: the animals are x 153-221, y 69-104,
#: 46% of the rect — but the fields are addressed by absolute coordinate so
#: that moving a shape one pixel does not reshuffle its texture.
RECT = (142, 54, 92, 58)


# ---------------------------------------------------------------------------
# The hide surface
# ---------------------------------------------------------------------------


class _Hide:
    """The stipple, the value ladder, and the one call that joins them.

    Two independent noise fields, both generated once per compose from named
    streams so that adding a leg cannot move the texture of the barrel:

      `runs`  — Markov fields of booleans choosing WHICH FAMILY a pixel takes
                at its rung. Each flip probability is the reciprocal of the
                mean run length §7 measured for that surface.
      `fine`  — an uncorrelated uniform field choosing WHICH OF TWO ADJACENT
                RUNGS a fractional luminance lands on. Uncorrelated on
                purpose: the value gradient must not acquire the run
                structure of the family stipple, or the two would beat
                against each other and produce exactly the fabric §9.10
                warns about.
    """

    def __init__(self, ctx: layout.Ctx) -> None:
        self.ctx = ctx
        self.tones = tuple(
            (ctx.ink(warm, warm_step), ctx.ink(cool, cool_step))
            for (warm, warm_step), (cool, cool_step) in HIDE_TONES)
        self.runs = {
            "hide": self._markov("team hide stipple", RUN_HIDE),
            "mane": self._markov("team mane stipple", RUN_MANE),
            "leg": self._markov("team leg stipple", RUN_LEG),
        }
        self.fine = self._uniform("team hide rung")
        self.wobble = self._levels("team hide wobble", RUN_HIDE)

    def _markov(self, name: str, runs: tuple[float, float]) -> dict[tuple[int, int], bool]:
        warm_run, cool_run = runs
        leaving = (1.0 / warm_run, 1.0 / cool_run)
        rng = self.ctx.stream(name)
        x0, y0, width, height = RECT
        field: dict[tuple[int, int], bool] = {}
        for y in range(y0, y0 + height):
            state = rng.random() < warm_run / (warm_run + cool_run)
            for x in range(x0, x0 + width):
                if rng.random() < leaving[0 if state else 1]:
                    state = not state
                field[(x, y)] = state
        return field

    def _levels(self, name: str, runs: tuple[float, float]) -> dict[tuple[int, int], float]:
        """A −1…+1 field with the same run statistic as the family stipple.

        The value wobble has to CLUSTER. Drawn from an uncorrelated field it
        is salt and pepper, which at 320x144 reads as film grain rather than
        as hide; drawn from a chain with the same 1.65 px mean run as the
        colour stipple it reads as the broken, patchy surface the reference
        actually has — p10 to p90 across the far animals spans L 8 to 45, and
        no amount of a single flat value gets there.
        """
        flip = 2.0 / (runs[0] + runs[1])
        rng = self.ctx.stream(name)
        x0, y0, width, height = RECT
        field: dict[tuple[int, int], float] = {}
        for y in range(y0, y0 + height):
            level = rng.choice((-1.0, 0.0, 1.0))
            for x in range(x0, x0 + width):
                if rng.random() < flip:
                    level = rng.choice((-1.0, -0.5, 0.0, 0.5, 1.0))
                field[(x, y)] = level
        return field

    def _uniform(self, name: str) -> dict[tuple[int, int], float]:
        rng = self.ctx.stream(name)
        x0, y0, width, height = RECT
        return {(x, y): rng.random()
                for y in range(y0, y0 + height)
                for x in range(x0, x0 + width)}

    def index(self, x: int, y: int, luminance: float, grain: str = "hide") -> int:
        """The palette index for a hide pixel at a target luminance.

        `grain="flat"` turns the rung dither off. §7 names exactly four
        places where the edges are hard and the fill takes no dither at all —
        the crest, the back rim, the underline and chest shadow, and the
        tail — and those four are the only reason the rest reads as texture
        rather than as noise.
        """
        if grain != "flat":
            # Only the four hard-edged masses may spend `void`. See
            # STIPPLE_FLOOR: a stippled plane that reaches index 0 puts black
            # specks through hide, and the reference's black is pooled.
            luminance = max(STIPPLE_FLOOR, luminance)
        rung = 0
        while rung < len(TONE_LUMINANCE) - 2 and TONE_LUMINANCE[rung + 1] < luminance:
            rung += 1
        low, high = TONE_LUMINANCE[rung], TONE_LUMINANCE[rung + 1]
        blend = 0.0 if high <= low else (luminance - low) / (high - low)
        blend = max(0.0, min(1.0, blend))
        if grain == "flat":
            rung += 1 if blend > 0.5 else 0
        elif self.fine.get((x, y), 0.5) < blend:
            rung += 1
        warm, cool = self.tones[rung]
        field = self.runs.get(grain, self.runs["hide"])
        return warm if field.get((x, y), False) else cool

    def grain(self, x: int, y: int) -> float:
        """A signed −0.5…+0.5 wobble, for planes that carry their own noise.

        The far animals are the case this exists for. §5 gives their hide a
        median of 17.9, but the plane measures L 6-33 across it: at one value
        it stops being an animal and becomes a hole cut in the picture.
        """
        return self.wobble.get((x, y), 0.0) * 0.5

    def put(self, canvas: IndexedCanvas, x: int, y: int, luminance: float,
            grain: str = "hide") -> None:
        canvas.put(x, y, self.index(x, y, luminance, grain))

    def column(self, canvas: IndexedCanvas, x: int, top: int, bottom: int,
               at_top: float, at_bottom: float, grain: str = "hide",
               jitter: float = 0.0) -> None:
        """A column of hide with the light falling down it.

        §5.3: within A's barrel value falls monotonically top to bottom and
        does NOT vary left to right — 42, 34, 30, 27.5 down the rows, L 25-37
        across all twenty-four columns. Light comes from above, so every
        plane in this region is modelled top-to-bottom and nothing at all is
        modelled side-to-side.
        """
        if bottom < top:
            return
        span = max(1, bottom - top)
        for y in range(top, bottom + 1):
            # `jitter` is the hide's own broken surface, and without it the
            # stipple is invisible: the two families are chosen AT MATCHED
            # LUMINANCE, so alternating them alone moves hue and nothing
            # else. §7 measures 68-80% single-pixel runs after quantising to
            # eight VALUE bands, which is a statement about value.
            self.put(canvas, x, y,
                     at_top + (at_bottom - at_top) * (y - top) / span
                     + self.grain(x, y) * jitter, grain)


# ---------------------------------------------------------------------------


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    if not ctx.with_coach:
        # coach.md §8: the team is part of the removable layer. Nothing here
        # survives the coach's departure, and the shipping background is the
        # departed composition (errata 31d).
        return
    hide = _Hide(ctx)
    # THE SHADOW GOES DOWN BEFORE THE ANIMALS, not after. It is the ground
    # they stand on, and stamped last it darkened the nine feet standing in
    # it as well — measured on the bar the legs run L 30-48 at y 94-99 while
    # the ground between them runs 20-28, so a pass that takes both down two
    # steps deletes the only contrast the legs have left down there.
    _cast_shadow(canvas, ctx)
    with ctx.track(canvas, "the team"):
        _far_horse(canvas, ctx, hide)
        _near_horse(canvas, ctx, hide)
        _heads(canvas, ctx, hide)
        _holes(canvas, ctx, hide)
        _legs(canvas, ctx, hide)
        _tack(canvas, ctx, hide)
        _sparks(canvas, ctx)


# ---------------------------------------------------------------------------
# Geometry shared by the three animals
# ---------------------------------------------------------------------------


def _topline(x: int) -> int:
    """The top row of the mass at a column. TWO toplines, 5 px apart.

    §5.2 is the reason the number steps at x=194 rather than sliding: C's
    back at y 70 is a black cut-out against the sky and A's back at y 75 is a
    bright cool rim, and the eye finds two withers because there are two
    edges at two heights, not one edge that bends.
    """
    if x >= MASS_STEP:
        return layout.HORSE_A_TOPLINE_Y
    if x < TOPLINE_FROM:
        return CREST_TOP
    return TOPLINE[min(len(TOPLINE) - 1, x - TOPLINE_FROM)]


def _belly(x: int) -> int:
    """The last row of the mass at a column.

    Six sections, all from §3, and the steps between them are the anatomy:
    the two lowered heads hang past y=93 while the chest beside them stops at
    91, the barrel's underline is straight at 86-88, and the croup is cut off
    at 85 by the tail. A single belly line across the whole mass is what
    turns three animals into one dark skirt.

    The first step is the important one, and it now runs from x=160 rather
    than from x=161. C's chest used to be carried down to y=92 at x=160 on
    the reading that the far animal stands behind the middle one's head;
    measured, it does not. x 158-162 on y 84-86 is COLD on the bar at
    L 18-35, warmth −9 to −30 — the hillside, not hide — and it is the same
    channel §3.3's wedge opens four rows above it. Filled with hide it welded
    C's throat to B's jowl and the left third of the team became one curtain,
    which is exactly what §7's "six cool pixels" exist to prevent.
    """
    if x <= 164:
        return 81               # the wedge is carved out of these five rows
    if x <= 180:
        return 81               # the two hanging heads take over at y=82
    if x <= 188:
        # The chest and the elbow. This is the ONE place §9.11 allows a
        # curve: the underline is straight everywhere else and thickens into
        # the chest mass only at the front end.
        return 89 + (x - 180) // 3
    if x <= 193:
        return 88
    if x <= 217:
        # §4.1: barrel depth 11 against a leg of 16, and that ratio IS the
        # horse. The back is at y=75 so the hide has to stop at 86; carry it
        # to 88 and the depths come out 13 and 13, which is §9.1's mastiff.
        return 86
    return 85                   # flank and croup


def _face_light(column: int, width: int, rim: float, face: float,
                poll: float, nasal: float) -> float:
    """The luminance across a lowered head, front to back.

    THE HEADS ARE LIT ACROSS, NOT DOWN, and it is the one place in this
    region where that is true. Measured column means on the bar, muzzle to
    poll, over the fourteen rows each head occupies:

      A (x 171-180)   14  27  46  35  36  35  28  24  18  18
      B (x 161-170)   26  26  27  30  25  23  21  16  16  20

    — which is A HUMP, not a fall. There is a one-pixel dark rim on the
    outside of the nose, then the nasal plane a fifth of the way back
    catching the sky, then a long decline into the poll and the mane. Drawn
    as a monotonic fall from the muzzle the bright end came out four columns
    wide instead of one, and four bright columns on a ten-column head is not
    a head, it is a wedge of light with a horse behind it. The two heads are
    also not the same shape: A's hump is +32 over its poll and B's is +14,
    which is §9.12's depth stagger carried by the hide instead of by the
    sparks.
    """
    position = column / max(1, width - 1)
    if position < nasal:
        # The leading rim and the climb up the nose. The outer edge turns
        # away from the sky before the face does.
        return rim + (face - rim) * position / nasal
    fall = (position - nasal) / max(1e-6, 1.0 - nasal)
    return poll + (face - poll) * (1.0 - fall) ** 0.85


def _in_jaw_wedge(x: int, y: int) -> bool:
    """§3.3. Six cool pixels that are drawn by not being drawn."""
    row = y - JAW_WEDGE_TOP
    if not 0 <= row < len(JAW_WEDGE):
        return False
    left, right = JAW_WEDGE[row]
    return left <= x <= right


def _rim_step(x: int) -> int:
    """§5.2's cool rim, as a step off `horse_rim`, column by column.

    Measured on the bar along y=75, x 195 to 221:

      45 43 43 41 44 49 51 44 26 21 48 46 29 38 41 49 57 51 51 51 33 38 28 44 47 49 49

    — a swing of THIRTY-SIX luminance along one row. Drawn at one index, or at
    two a step apart, it is a ruled line, and a ruled pale line twenty-seven
    pixels long across the top of a warm mass reads as the edge of a shelf,
    which is exactly what it looked like. The swing is not noise: it is the
    back turning under three things and standing proud of four.
    """
    if 203 <= x <= 204 or 215 <= x <= 217:
        return -2                   # under the harness saddle; over the hip
    if x == 207 or x == 214:
        return -1                   # the girth, and the front of the hip
    if (200 <= x <= 201 or 205 <= x <= 206
            or 210 <= x <= 213 or x >= 219):
        return +1                   # withers crest, saddle, loin, croup
    return 0


def _strap_x(y: int) -> float:
    """The trace strap's centre column at a row.

    Measured: dark at x 204-205 on y 76, x 205-206 on y 77, and x 206-209
    from y 78 to y 85 — a strap two pixels wide leaning about half a pixel
    per row toward the tail. It is the only vertical in the barrel and it is
    what makes the near horse read as harnessed rather than as a shape.
    """
    return STRAP_TOP + STRAP_LEAN * (y - 76)


def _far_level(depth: int) -> float:
    """The far animal's value, that many rows below its own topline."""
    return FAR_PROFILE[min(depth, len(FAR_PROFILE) - 1)]


def _barrel_plane(x: int) -> float:
    """How far this column of the barrel sits off the row mean (§3.14)."""
    for left, right, offset in BARREL_PLANES:
        if left <= x <= right:
            return offset
    return 0.0


def _in_hole(x: int, y: int) -> bool:
    """§3.20. True inside one of the six cool background gaps between the legs.

    Nothing this region draws may enter one. They are the difference between
    nine legs and a skirt, and they are the reference's, not an omission.
    """
    return any(x0 <= x <= x1 and y0 <= y <= y1 for x0, x1, y0, y1 in HOLES)


def _mane_crest(x: float) -> float:
    """The 28° axis the standing mane sits on, poll to withers (§3.12)."""
    x0, y0 = MANE_POLL
    x1, y1 = MANE_WITHERS
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0)


# ---------------------------------------------------------------------------
# C — the far horse. Drawn first, entirely in shadow.
# ---------------------------------------------------------------------------


def _far_horse(canvas: IndexedCanvas, ctx: layout.Ctx, hide: _Hide) -> None:
    """§3.1-5. Head, ear, crest, and the neck and back behind everything.

    Everything here is under L 20 — §5 measures C's neck and back at a median
    of 17.9, DARKER than the sky it sits against, which is the whole reason
    §9.5 exists: the animal is not separated from the hill by value, and
    darkening it further only merges it with the chest shadow.
    """
    black = ctx.ink("horse_black")

    # The back and neck. ONE continuous silhouette from x 160 to x 193 with
    # no seam anywhere across the top of it (§9.3) — C's back and B's back
    # merge, deliberately, and a line drawn between them produces two flat
    # paper cut-outs.
    # THE TOP TWO ROWS ARE THE PICTURE'S HARDEST EDGE. §5.2 measures C's back
    # at L 7.5 against a sky of 34 — a −26 step, a black cut-out — and the
    # hide four rows below it at 17.9, which is DARKER THAN THE SKY it sits
    # against. So the edge is a wall and everything under it is one quiet
    # value; there is no modelling in the far animal at all.
    for x in range(MASS_LEFT, MASS_STEP):
        top = _topline(x)
        bottom = _belly(x)
        for y in range(top, bottom + 1):
            if _in_jaw_wedge(x, y):
                continue
            depth = y - top
            if x <= CREST_RIGHT and depth < 3:
                # The wall, and IT IS TWELVE PIXELS LONG, not thirty-four.
                # §3.4 puts the near-black bar at x 160-171 and §7 lists it as
                # one of the four hard edges in the region, so it takes no
                # grain: a single stray light pixel along a −26 L step is the
                # whole step gone. But carried on to x=193 the same wall drew
                # a ruled black line the width of the team, and at the squint
                # the animals stopped being animals and became a roof.
                hide.put(canvas, x, y, 2.0 + 4.0 * depth, "flat")
            elif depth < 2:
                # Right of the crest the top edge is a SOFT dark, not a wall —
                # AND IT IS NOT DARK AT ALL ON ITS FIRST ROW. Re-measured
                # across x 172-193, the bar's y=70 runs
                #
                #   35 23 23 33 33 34 29 29 29 29 24 24 21 23 21 16 16 16 16 24 29 24
                #
                # at warmth +7 to +34 for two thirds of it and −9 to −30 for
                # the other third: a LIT strip where the top of the neck turns
                # up to the sky, broken by columns where the sky comes through
                # it. y=71 is the first genuinely dark row, at L 8-21, and
                # y=72 the darkest, at L 6-25.
                #
                # This branch had it at 11 and 8 — near-black, twenty-two
                # columns wide, immediately under a crest that is also
                # near-black. That put a two-row black lip along the entire
                # top of the mass where the bar has its lit edge, and it is
                # the largest single block error left in the rect: −8 to −13 L
                # across x 171-190 on the 3x3 difference map, in the one place
                # a silhouette is decided. A dark line under a dark line does
                # not read as an edge, it reads as thickness, and thickness
                # along the top of three animals is a roof.
                hide.put(canvas, x, y,
                         24.0 - 9.0 * depth + hide.grain(x, y) * 7.0)
            else:
                # Mottled, not flat — and MODELLED, which is a different
                # claim. Held at one value from the fourth row down (which is
                # what `min(20, 5 + 4*depth)` did) the far animal was a flat
                # brown card with noise on it, and a card is what the critics
                # kept seeing. It has a neck: FAR_PROFILE is its section.
                hide.put(canvas, x, y,
                         _far_level(depth) + hide.grain(x, y) * 11.0)

    # §3.4. The near-black bar at the crest. `void@0` 31% + `umber@0` 29%, and
    # §7 says it takes no dither into the sky at all.
    #
    # BUT ITS TOP ROW IS BROKEN AND ITS RIGHT END IS NOT BLACK. Measured, three
    # rows of the bar read:
    #
    #   y69   22  6  1  6 16  6  1 | 19 24 12  6 16
    #   y70    1  1  1  1  1  1  1 |  1  1  1  6 37
    #   y71    1  6  1  6 11 11  1 |  8  6  6 31 32
    #
    # — one solid row and one nearly solid row, with a top row that only
    # reaches black in its middle six columns and a right end that is already
    # back at sky value by x=171. Stamped as twelve columns of `void` two rows
    # deep it was a ruled black rectangle, and a ruled black rectangle sitting
    # on top of a warm mass is a roof, not a mane. The crest carries thirty
    # per cent of the region's `void` and it is the hardest edge in the frame:
    # it has to be hard, and it has to end.
    cx, cy, cwidth, cheight = layout.HORSE_C_CREST
    for x in range(cx, cx + cwidth):
        top = _topline(x)
        hide.put(canvas, x, top, 3.0 if CREST_CORE[0] <= x <= CREST_CORE[1]
                 else 15.0, "flat")
        for row in (1, 2):
            hide.put(canvas, x, top + row,
                     1.0 if x <= CREST_SOLID else 8.0 + 11.0 * (x - CREST_SOLID),
                     "flat")

    # §3.2. 7 x 13, hanging almost vertically, the axis leaning ~15° forward.
    # The muzzle bottom row is y=81, which is EXACTLY the top rail of the
    # hitching fence (§8): they meet, with no gap and no overlap, and if the
    # rail moves this head moves with it. C's is the only head with a top
    # edge of its own — B's and A's merge upward into the mass.
    # THE HEAD IS LIT ALONG ITS OWN AXIS, NOT ACROSS THE COLUMNS. This is the
    # measurement that was being drawn wrong, and it is why the head read as a
    # lump of neck. The bright plane does not stay in one column: it walks
    # down and to the LEFT with the head's lean, half a pixel a row —
    #
    #   y 71  x 158-159 at L 26-32     y 77  x 155-156 at L 37-41
    #   y 74  x 157    at L 37         y 80  x 153-154 at L 37-40
    #
    # — with a one-pixel near-black rim (L 1-8) on its outside the whole way
    # down and the cheek falling off to L 13-18 behind it. That is a lit
    # NASAL STRIPE two pixels wide on a 13-px head: model it column by column
    # and every row gets the same value, which is a post with a light side.
    # AND ITS EDGE IS MEASURED, NOT DERIVED. See C_HEAD_EDGES: the head is
    # narrow at the poll, six wide through the face, and steps a column left
    # at y=80. Walked out from one left edge and one lean it reached x=151 by
    # the muzzle — two columns over the top rail, which §8 says the muzzle
    # ABUTS with no overlap — and the widening that produced was the whole
    # difference between a head and a wedge of neck.
    for column, (first, last) in enumerate(C_HEAD_EDGES):
        x = C_HEAD_X + column
        for y in range(first, last + 1):
            if _in_jaw_wedge(x, y):
                continue
            nose = HEAD_NASAL_AT_71 + HEAD_LEAN * (y - HEAD_AXIS_ROW)
            offset = x - nose
            if offset < -1.5:
                # The outside rim, against the sky. Measured it is L 1-11 and
                # BROKEN — (155,73) (156,73) (155,74) (154,76) are near-black
                # and the rows between them are 6-12 — so it takes the grain
                # like everything else. A dead-level dark edge thirteen rows
                # tall is a drawn outline, and §5 is explicit that there is no
                # drawn outline anywhere on these animals.
                level = 6.0
            elif offset <= 0.5:
                level = 38.0                # the lit nasal plane
            elif offset <= 1.5:
                # THE CHEEK IS PART OF THE LIGHT, not the far side of it.
                # Measured along y=77 the head runs 8, 41, 37, 32, 30, 13
                # across x 154-159: FOUR columns above L 30, not two. Held at
                # 24 and 14 the lit plane was two pixels wide on a seven-pixel
                # head, which is a stripe down a post — and a stripe down a
                # post is what the far head kept reading as.
                level = 30.0
            elif offset <= 2.5:
                level = 22.0                # the jaw, turning away
            else:
                level = 15.0                # the throat, running into the neck
            hide.put(canvas, x, y, level + hide.grain(x, y) * 9.0)

    # §3.5's gullet. A dark diagonal from (161, 73) down to (168, 82),
    # L 1-11 against a neck at 18-26 either side: the front edge of C's neck,
    # and the only thing that cuts its head off the mass behind it. Without
    # it the head and the neck are one value and the head is a lump — which
    # is exactly the reading the region has been failing.
    for step in range(GULLET_ROWS):
        x = GULLET_FROM[0] + round(step * GULLET_LEAN)
        y = GULLET_FROM[1] + step
        if _in_jaw_wedge(x, y):
            continue
        # ONE PIXEL, AND IT BREAKS. Measured, the gullet's dark cells are
        # (161,74) (162,76) (162,77) (164,78) (165,80) (166,81) (167,81) at
        # L 1-8 — seven pixels over nine rows, not eighteen. Drawn as a solid
        # two-pixel diagonal it was a black slash across the far animal's
        # throat, and a slash that hard reads as a strap rather than as the
        # groove in front of a neck.
        # AND IT TAKES NO RUNG DITHER. `hide.put` on a stippled plane is
        # floored at STIPPLE_FLOOR and then rounded to a rung, so a target of
        # 6 came out alternating L 9 and L 13 down the chain — and L 13 is
        # over the dark census's own threshold, which broke a mass the bar
        # holds as ONE 34-px pool into eleven singles. The pool is the point:
        # singles at this size vanish one step down the squint ladder, which
        # is precisely where §4's "horse, not dog" is decided.
        hide.put(canvas, x, y, 5.0 + hide.grain(x, y) * 4.0, "flat")
        # ...and the column beside it goes dark on about half the rows. The
        # bar's chain is one pixel wide in places and two in others — (161,74)
        # with (162,74), (163,75) with (163,76) — which is what makes ten
        # rows of a leaning diagonal touch at all instead of being ten
        # corner-to-corner cells that no eye and no census reads as a line.
        hide.put(canvas, x + 1, y, 8.0 + hide.grain(x + 1, y) * 8.0, "flat")

    # §3.1. Two pixels, and the top of the whole group. §7: without the ear,
    # C's head is a post — AND A BLACK EAR IS NOT AN EAR. Measured at
    # (157, 69) and (158, 69) the two pixels are L 26 and L 41 at warmth +29
    # and +35: they are LIT, standing against a sky at L 34 and cold. Drawn in
    # `void` they joined the crest bar behind them and the silhouette lost its
    # only bump.
    ex, ey = layout.HORSE_C_EAR
    hide.put(canvas, ex, ey, 27.0, "flat")
    hide.put(canvas, ex + 1, ey, 41.0, "flat")
    hide.put(canvas, ex + 1, ey + 1, 14.0, "flat")


# ---------------------------------------------------------------------------
# A — the near horse. The only complete animal.
# ---------------------------------------------------------------------------


def _near_horse(canvas: IndexedCanvas, ctx: layout.Ctx, hide: _Hide) -> None:
    """§3.10-18. Neck, mane, back, barrel, croup, tail, chest, underline."""
    black = ctx.ink("horse_black")

    # -- the neck, from the poll up to the withers -------------------------
    #
    # §4.5: the neck leaves the body AT THE WITHERS, at the top of the back,
    # and rises at 28°. Not from the chest. Below the crest line is the lit
    # shoulder plane; above it nothing of A exists — that is the far horse
    # showing over its neck.
    # It is A LIT WEDGE, and it is the single strongest horse-shape cue in
    # the region: one continuous bright diagonal from the poll to the top of
    # the back, WIDENING as it goes because a neck runs into a shoulder. Drawn
    # at the far animals' value it stops connecting the head to the body and
    # the near horse becomes a slab floating over a dark middle.
    for x in range(NECK_FROM, NECK_TO + 1):
        top = int(round(_mane_crest(x)))
        reach = (x - NECK_FROM) / max(1, NECK_TO - NECK_FROM)
        bottom = top + int(round(NECK_DEPTH_POLL
                                 + (NECK_DEPTH_SHOULDER - NECK_DEPTH_POLL) * reach))
        hide.column(canvas, x, top, min(bottom, _belly(x)), 44.0, 27.0, jitter=6.0)

    # §3.12. Six strokes across 19 px, each 1-2 px wide with a 1-2 px dark
    # trough beside it and a swing of 20-40 L. THE HIGHEST-CONTRAST TEXTURE
    # IN THE REGION, and §7 says do not comb them: the measured pitch varies
    # between 2 and 4 px and the peaks are unequal.
    # AND THE MANE IS A RIDGE BEFORE IT IS SIX STROKES. Measured, the two
    # rows immediately above the crest axis run L 30-58 for the whole length
    # from x=178 to the withers — a continuous lit band standing off the
    # neck, with the strokes as accents on top of it. Six isolated spikes on
    # a dark neck are a picket fence; the band is what makes them hair.
    for x in range(MANE_BAND_FROM, MANE_BAND_TO + 1):
        crest = int(round(_mane_crest(x)))
        # AND THE BAND CARRIES THE STROKES' RHYTHM, at half their amplitude.
        # Drawn as two flat rows at L 40-47 it was a painted stripe nineteen
        # pixels long — the flattest thing in the region, where the reference
        # measures the busiest: mean run 1.27 px, 80% single-pixel. Measured
        # along y=78, x 184-194 runs 8, 32, 28, 28, 68, 40, 48, 52, 32, 24, 44.
        # The troughs reach L 8. A band with no troughs in it is a stripe.
        near = min(abs(x - peak_x) for peak_x, _ in MANE_PEAKS)
        ridge = (MANE_PEAK if near == 0
                 else (MANE_TROUGH if near == 1 else MANE_BAND))
        # TWO ROWS, NOT THREE, AND THE STROKES ON TOP ARE TWO PIXELS, NOT SIX.
        # Three rows of ridge with four-pixel spikes standing on them made a
        # band six rows deep whose bright columns held their value for four or
        # five rows each — which at the half-squint is a row of teeth, exactly
        # §7's picket fence and exactly what the eye read. Measured, the bar's
        # bright mane pixels are ISOLATED: along y 78-82 the values over
        # x 180-193 are 25,16,58,25,8,34,30,30,70,43,50,54,33,25 and no
        # column above L 50 is above L 50 in the row beneath it. The mane is
        # sparks along a lit ridge, not columns standing on one.
        hide.put(canvas, x, crest, ridge - 10.0, "mane")
        hide.put(canvas, x, crest - 1, ridge, "mane")

    for index, (x, height) in enumerate(MANE_PEAKS):
        # Each stroke is one or two pixels standing proud of the ridge, and
        # half of them stand a column back from their own root so the six do
        # not line up on one edge. §7 refuses to let the pitch be even and
        # that applies to the phase as much as to the spacing.
        crest = int(round(_mane_crest(x)))
        lean = index % 2
        for step in range(max(1, min(2, height - 2))):
            hide.put(canvas, x + lean, crest - 2 - step,
                     MANE_PEAK - 14.0 * step, "mane")
        # The trough is what makes the stroke a stroke — one column behind,
        # because the mane falls to the near side.
        hide.put(canvas, x + 1 - lean, crest - 1, MANE_TROUGH, "mane")

    # -- the back, and the one row that carries the whole depth read -------
    #
    # §5.2: A's back at y=75 is L 41.9 against a sky of 27.7 — a BRIGHT COOL
    # RIM, warmth −7, sitting on hide at warmth +26. One row, 22 px, and §9.4
    # records that it looks like an error in the data. Draw it warm and the
    # near horse falls back into the far one.
    bx, by, _, _ = layout.HORSE_A_BACK
    for x in range(RIM_FROM, RIM_TO + 1):
        # One unbroken row (§7), but FOUR VALUES ALONG IT. See `_rim_step`.
        canvas.put(x, by, ctx.ink("horse_rim", _rim_step(x)))

    # -- the barrel --------------------------------------------------------
    #
    # §3.14 and §5.3: top-lit, L 40 at the top falling to L 26 by y 85, warmth
    # constant at +26 to +28.
    #
    # AND IT IS NOT FEATURELESS ACROSS. §5.3 says the barrel has no left-to-
    # right LIGHTING gradient and that is true — but it is not the same claim
    # as no structure, and modelled as a pure top-to-bottom fall the barrel
    # came out a flat plate twenty-four pixels wide, which at the squint is a
    # crate. The fall down is the light (BARREL_FALL); the deviation across is
    # the animal and the harness (BARREL_PLANES), and the two are added rather
    # than multiplied because one of them is illumination and the other is not.
    bxx, byy, bwidth, _ = layout.HORSE_A_BARREL
    for x in range(bxx, bxx + bwidth):
        bottom = _belly(x)
        across = _barrel_plane(x)
        for y in range(byy, bottom + 1):
            fall = (y - byy) / max(1, bottom - byy)
            level = BARREL_TOP - BARREL_FALL * fall ** BARREL_CURVE + across
            if abs(x - _strap_x(y)) <= 0.6:
                # The hame strap leans back across the ribs as it descends and
                # it is the darkest vertical on the animal: measured, the
                # column it is on runs L 14-24 against 33-41 either side.
                level = min(level, 17.0)
            hide.put(canvas, x, y, level + hide.grain(x, y) * 5.0)

    # §3.15. The topline drops from y 76 to y 80 over 3 px and the croup is
    # the last of the animal; behind it is the coach's front boot.
    cx, cy, cwidth, cheight = layout.HORSE_A_CROUP
    for column in range(cwidth):
        x = cx + column
        top = cy + min(cheight - 2, column + column // 2)
        hide.column(canvas, x, top, _belly(x), 30.0, 18.0, jitter=5.0)

    # §3.18. THE DARKEST MASS IN THE REGION, Lmed 8.6, `umber@0` 31% +
    # `void@0` 20%, and the anchor that holds the front of the animal down.
    # §7: solid dark, no dither.
    # AND IT IS A MASS, NOT A BLOCK. Measured across x 181-188, y 84-91 the
    # values run 0 at the core out to 24 at the corners — 8, 8, 0, 0, 0, 4, 8,
    # 28 along y=85 and 24, 20, 32, 16, 8, 4, 8, 8 along y=84. Stamped as a
    # flat 8 x 8 rectangle of `void` it was the one hard-edged black square in
    # the frame, and at 8x it read as a hole punched in the picture rather
    # than as the shadow the front of the animal stands in.
    sx, sy, swidth, sheight = layout.HORSE_CHEST_SHADOW
    for x in range(sx, sx + swidth):
        for y in range(sy, sy + sheight):
            if _in_hole(x, y):
                continue
            near = 0.9 * abs(x - CHEST_CORE[0]) + 0.75 * abs(y - CHEST_CORE[1])
            hide.put(canvas, x, y,
                     min(22.0, 2.0 + 4.5 * max(0.0, near - 1.5))
                     + hide.grain(x, y) * 4.0, "flat")

    # §3.17. Straight, and ONE ROW. §9.11 — the curve happens only at the front
    # end, where it thickens into the chest mass; curving the middle produces a
    # pot-bellied pony. §7 lists it as one of the four hard edges: solid dark,
    # no dither, and it is what the whole barrel above it is weighed against.
    ux, uy, uwidth, _ = layout.HORSE_UNDERLINE
    for x in range(ux, ux + uwidth):
        # Measured along y=86, x 202-215: 16, 12, 8, 4, 8, 12, 12, 8, 4, 4, 8,
        # 12, 8, 20. Hard-edged, but not one index — a dead-level row of
        # `void` nineteen pixels long is a drawn line under a slab.
        hide.put(canvas, x, UNDERLINE_Y,
                 7.0 + hide.grain(x, UNDERLINE_Y) * 9.0, "flat")

    # AND THE ROWS BELOW IT ARE NOT MORE SHADOW. Measured at x 202-218, y 87
    # runs 8, 12, 20, 24, 32, 24, 12, 28, 20, 4, 0, 12, 28, 32, 24, 28, 28 —
    # a lit gaskin, a dark gap and a lit stifle, in that order right to left.
    # Filled solid these become an apron, the daylight between the fore and
    # hind legs closes, and holes 5 and 6 of §3.20 stop existing.
    # AND THE STIFLE COLLAPSES. See GASKIN: L 26 at y=87 and L 4 by y=91, not
    # a 1.4-a-row drift — it is the top of the 63-px near-black mass the
    # forelegs stand in, and drawn as a drift it stayed at hide value and the
    # mass never formed.
    for x in range(STIFLE[0], HOCK_X + 1):
        for y in range(UNDERLINE_Y + 1, 92):
            if _in_hole(x, y):
                continue
            row = y - UNDERLINE_Y
            if x == HOCK_X:
                level = 6.0                                 # outside of the hock
            elif GASKIN[0] <= x <= GASKIN[1]:
                level = 34.0 - 1.5 * row                    # the gaskin, lit
            elif x <= STIFLE[1]:
                level = 28.0 - 6.0 * row                    # flank and stifle
            else:
                # The gap between them, and it LIFTS as it comes down: L 1 at
                # y=88 against L 19 by y=91, because the road behind it is
                # brighter than the barrel is.
                level = 2.0 + 4.5 * row
            hide.put(canvas, x, y, level + hide.grain(x, y) * 5.0)

    # §3.16. THE ONLY TAIL. 1-2 px, near-black, 19 px long, ending 5 px above
    # the hoof line. §9.9: three horses, one visible tail, and that is
    # correct — the other two are behind bodies.
    # AND IT IS NOT NINETEEN PIXELS OF `void`. Measured down x=220 from y=78:
    # 14, 8, 6, 6, 6, 2, 2, 1, 11, 14, 18, 11, 6, 6 — near-black at the dock
    # where it comes off the croup, deepest a third of the way down, and
    # lifting again through the switch. Nineteen rows of one index is a fence
    # post, and a fence post is what stood at the back of this animal.
    tx, ty, twidth, theight = layout.HORSE_TAIL
    for y in range(ty, ty + theight):
        run = (y - ty) / max(1, theight - 1)
        hide.put(canvas, tx + 1, y,
                 12.0 - 22.0 * run + 26.0 * run * run, "flat")
        if y >= ty + 6:
            canvas.put(tx, y, ctx.ink("horse_hide_shadow"))


# ---------------------------------------------------------------------------
# The two heads that hang in front
# ---------------------------------------------------------------------------


def _heads(canvas: IndexedCanvas, ctx: layout.Ctx, hide: _Hide) -> None:
    """B's and A's heads: same posture as C's, dropped 13 px, +8 then +10 px.

    §4: B and A are EXACTLY LEVEL with each other and both sit 13 px below C.
    C is the odd one out, and that asymmetry is the reason the group looks
    like animals rather than like a repeating stamp.
    """
    # AND THEY ARE NOT THE SAME SHAPE. B_HEAD_EDGES and A_HEAD_EDGES carry
    # each head's own measured outline: B is ten columns at the jowl and six
    # below it, with the chin at the front and the throat climbing behind;
    # A is nine narrowing to seven, with its far cheek stopping five rows
    # above its muzzle. Drawn as one 10 x 14 rectangle stamped twice — which
    # is what this was — the two heads have the same top edge, the same
    # bottom edge and the same width at every row, and two identical
    # rectangles nine columns apart are not two animals, they are a pattern.
    for index, (x0, edges) in enumerate(((B_HEAD_X, B_HEAD_EDGES),
                                         (A_HEAD_X, A_HEAD_EDGES))):
        lift = ctx.graze[index] * GRAZE_LIFT if index < len(ctx.graze) else 0
        # A is in front and catches more light than B. §9.12's depth stagger
        # is carried by the bridle sparks; the hide follows it quietly, and
        # the four parameters are `_face_light`'s measured hump: outside rim,
        # nasal peak, poll, and how far back along the head the peak sits.
        rim, face, poll, nasal = HEAD_PLANES[index]
        width = len(edges)
        for column, (first, last) in enumerate(edges):
            x = x0 + column
            top = first - lift
            if index and x >= MANE_POLL[0]:
                # A's head hangs FROM the poll, and behind the poll is neck,
                # not head. Drawn as a full rectangle it painted over the
                # bottom three columns of the mane band — which is why the
                # near horse's neck went dark exactly where the reference has
                # it brightest, and why the head and the body stopped being
                # joined by anything.
                top = max(top, int(round(_mane_crest(x))))
            bottom = last - lift
            for y in range(top, bottom + 1):
                hide.put(canvas, x, y,
                         _face_light(column, width, rim, face, poll, nasal)
                         - 7.0 * (y - top) / max(1, bottom - top)
                         + hide.grain(x, y) * 10.0)

    # §3.5's GULLET DOES NOT STOP AT C'S THROAT. `_far_horse` runs the dark
    # diagonal from (161, 73) down to (167, 82); the bar runs it on, leaning
    # the other way, down the front of B's face to (163, 86) — and the two
    # halves are ONE connected 34-px near-black pool in the dark census,
    # x 159-167, y 73-86. Measured cells: (165, 83) and (164, 84) and
    # (164, 85) at L 1, (163, 86) at L 6. Left out, B's leading edge sat at
    # the same value as the sky behind it and the middle head had no front.
    for y, x in B_FACE_RIM:
        hide.put(canvas, x, y, 4.0, "flat")

    # §5. The strongest of the near-black seams, at x=184: averaged over
    # y 70-96 that column measures L 12.3 against 17-24 either side, and from
    # y 84 to y 94 it is a solid 1-px run of L 1-9. It is the gap between A's
    # foreleg and B behind it, and it is a SEAM rather than an outline — the
    # only place one animal's edge is allowed to cut another.
    for y in range(84, 95):
        hide.put(canvas, 184, y, 5.0, "flat")
    # The same device between B's head and A's — AND IT LEANS. Held in one
    # column at x=171 it was a plumb line beside two heads that both hang
    # fifteen degrees off vertical, which is the one direction nothing else
    # in this region goes. The bar puts it at x 171 on y 83-88, x 170 on
    # y 85-88 and x 169 on y 87-92, all at L 1-8: a 25-px pool leaning down
    # and forward with the faces it separates.
    for x, first, last in HEAD_SEAM:
        for y in range(first, last + 1):
            hide.put(canvas, x, y, 6.0, "flat")


# ---------------------------------------------------------------------------


def _holes(canvas: IndexedCanvas, ctx: layout.Ctx, hide: _Hide) -> None:
    """§3.20. The six cool background gaps between the legs, and they are COLD.

    They used to be drawn by not being drawn, on §3.20's word that they are
    background and not this region's to paint. Measured, that does not
    survive contact with the composition. Over the six holes the bar runs
    **L 25.6 at warmth −0.4**; ours, with nothing at all drawn in them, runs
    L 26.4 at warmth **+13.4** — the right value and the wrong family, because
    what is behind the team in OUR frame at those rows is the road, and the
    road is warm. In the bar it is the hillside, seen under the barrel and
    between the legs, and §3.20 says so in as many words: *the hillside seen
    through the team, not the animals' own shade.*

    §9.8 names the consequence and it is the one this region kept failing:
    painting them warm and dark closes the silhouette and loses every leg. A
    hole at the same hue as the leg beside it is not a hole. So the team
    draws them, because the team is the only region that knows they exist —
    §7 lists them with the ear and the back rim among the six places where
    one pixel is doing structural work, and calls them as important as the
    legs.

    Cold, at value, and NOT flat: `grey` 0-2 stippled on the leg field, which
    puts them at L 16-32 about a mean of 24 against a measured 25.6, and
    keeps the busy 1.35 px surface the rest of this zone has.
    """
    # AND THE TWO UNDER THE BARREL ARE A STEP DARKER THAN THE FOUR BESIDE THE
    # LEGS. Measured, holes 1-4 run a mean of L 25 and holes 5 and 6 run
    # L 18 — because the four are hillside seen BETWEEN the animals and the
    # two are hillside seen UNDER one, with a barrel's worth of body between
    # them and the sky glow that lights everything in this frame. Drawn at one
    # value the pair under A read as two pale panes let into the shadow, which
    # is the "windows cut in a wall" failure below arrived at by value instead
    # of by edge.
    bright = tuple(ctx.ink("horse_rim", offset) for offset in (-3, -2, -1))
    shaded = tuple(ctx.ink("horse_rim", offset) for offset in (-3, -3, -2))
    for index, (x0, x1, y0, y1) in enumerate(HOLES):
        steps = shaded if index >= 4 else bright
        for y in range(y0, y1 + 1):
            edge_y = y in (y0, y1)
            for x in range(x0, x1 + 1):
                if layout.keep_at(canvas, x, y):
                    continue
                # A hole is a gap between two curved legs, so its corners are
                # hide and its edges are ragged. Stamped as six rectangles the
                # cool patches read as windows cut in a wall, which is the same
                # failure as the ruled rim one row up: the value was right and
                # the EDGE was a straight line nothing in an animal makes.
                edge = edge_y + (x in (x0, x1))
                if edge == 2 or (edge and hide.grain(x, y) < -0.15):
                    continue
                level = hide.grain(x, y)
                canvas.put(x, y, steps[0 if level < -0.22
                                       else (2 if level > 0.22 else 1)])


def _legs(canvas: IndexedCanvas, ctx: layout.Ctx, hide: _Hide) -> None:
    """§3.19. Nine contacts on TWO ground lines 5 px apart.

    §9.7: evenly spaced legs on a single baseline read as a fence. The five
    px of fall from back rank to front rank is this region's statement about
    where the ground plane is, and road.md's ruts run parallel to it.

    §7, exactly: 2-3 px of hide across, LIT ON THE LEADING (LEFT) EDGE with
    1 px of `umber@0` behind. Hooves are 3-4 px wide and 2-3 px tall and are
    NOT pure black — the near ones catch a little road bounce.

    And the six holes between them (§3.20) are as important as the legs, and
    `_holes` above draws them cold immediately before this runs. Nothing here
    may enter one.
    """
    hoof = ctx.ink("horse_hide_shadow")
    bounce = ctx.ink("horse_hide_shadow", 5)
    for index, (left, right, ground) in enumerate(layout.HOOVES):
        cannon, lit, dark, peak = LEGS[index]
        top = LEG_TOP[index]
        # THE LIGHT DOES NOT SIT IN THE SAME PLACE ON EVERY LEG. See LEGS:
        # the bar's peak column is the third on leg 1, the first on legs 2, 3
        # and 7, the second on legs 4, 6, 8 and 9. Stamped from one profile
        # the nine legs shared one highlight position, which at the squint is
        # a repeat and reads as railings — §9.7's fence by a different route
        # from the one it warns about.
        planes = [LEG_PEAK - LEG_FALL * abs(column - peak)
                  for column in range(lit)] + [LEG_DARK] * dark
        for column, luminance in enumerate(planes):
            x = cannon + column
            for y in range(top, ground - 1):
                if _in_hole(x, y):
                    continue
                # The top two rows are still belly: a leg does not begin at an
                # edge, it emerges from the dark the barrel ends in, which is
                # why the reference's cannons only become separable around
                # y=92. Two rows, not three — measured, the lit column is
                # already at L 30+ one row under the belly, and a longer ramp
                # was spending the top third of every leg at chest-shadow
                # value, which is where nine legs became one dark skirt.
                emerge = min(1.0, (y - top) / 2.0)
                hide.put(canvas, x, y, 9.0 + (luminance - 9.0) * emerge
                         + hide.grain(x, y) * 5.0, "leg")
        # The hoof is wider than the cannon and its toe points FORWARD, which
        # is left: the ground contact reaches past the leg on the near side
        # and stops level with it behind. Two rows, and the front one takes a
        # little bounce off the road.
        for x in range(left, right + 1):
            canvas.put(x, ground - 1, hoof)
            canvas.put(x, ground, bounce if x < left + 2 else hoof)


# ---------------------------------------------------------------------------


def _tack(canvas: IndexedCanvas, ctx: layout.Ctx, hide: _Hide) -> None:
    """§3.21-23. One straight row, one cool fleck, two hue lines.

    The pole is the flattest lit row in the barrel and THE ONLY STRAIGHT LINE
    INSIDE THE ANIMALS — it is what says "hitched to something" rather than
    "standing loose". In image A it is a timber bar with a brass ferrule; at
    320x144 it is one row and it must stay one row.
    """
    px, py, plength = layout.POLE_ROW
    for x in range(px, px + plength):
        # §3.21 measures it as the flattest lit row in the barrel — mean
        # absolute step 5.3 L against 6.7-8.9 for every hide row above it.
        # FLATTEST, not flat: a dead-level row of one index reads as a shelf
        # edge, and a shelf edge under a slab is a table.
        hide.put(canvas, x, py, 33.0 + hide.grain(x, py) * 7.0)
    # §3.21: directly beneath it is the near-black underline. One dark row is
    # what lifts a flat lit row off the hide it crosses — BUT ONLY WHERE THE
    # UNDERLINE IS. Measured along y=86 the bar runs 24, 24, 24, 24, 24, 21
    # across x 196-201 and only then drops to 16, 11, 14, 11, 6, 8 from x=202
    # on: §3.17 puts the belly at x 202-220 and the six columns in front of it
    # are the girth, still lit. Carried the whole length of the pole this row
    # welded the underline into one ruled black line twenty-five pixels wide,
    # which under a flat lit row is a shelf with a shadow under it.
    for x in range(px, px + plength):
        hide.put(canvas, x, py + 1,
                 12.0 if x >= UNDERLINE_FROM else 22.0)

    # §3.22. The only cool object standing ABOVE the near horse's back.
    tx, ty, twidth, theight = layout.TERRET
    # Four pixels, and four is the number: it is the only cool object
    # standing above the near horse's back and a solid pale block up there
    # out-reads the back rim it is supposed to sit on.
    canvas.rect(tx, ty, twidth, theight - 2, ctx.ink("horse_rim", 1))
    canvas.put(tx, ty + theight - 2, ctx.ink("horse_rim"))
    canvas.put(tx + 1, ty + theight - 1, ctx.ink("horse_rim", -1))
    # And the hame it stands on, running down the shoulder to the pole.
    # Measured, x=198 sits about four L under the columns either side of it.
    for y in range(ty + theight, layout.POLE_ROW[1]):
        hide.put(canvas, HAME_X, y, 24.0)

    # §3.23 and §9.6: the traces measure L 25.9 against a sky of L 23.6 — a
    # difference of nothing — but warmth +10.8 against −6.2. THEY ARE A HUE
    # LINE, NOT A VALUE LINE, for their whole run, and they only go bright in
    # the last 3 px at the driver's hands. A bright rein across the sky
    # becomes the most legible object in the frame and steals the read from
    # the coach lamp.
    thread = ctx.ink("horse_hide_shadow", 3)
    for (x0, y0), (x1, y1) in (layout.TRACE_1, layout.TRACE_2):
        canvas.line(x0, y0, x1, y1, thread)


def _sparks(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """The four bridle marks, which are unequal on purpose.

    §9.12: L 85 on the near horse, L 61 on the middle, NOTHING AT ALL on the
    far one. Four bright marks at two different heights are what make three
    heads count as three; giving all three heads a spark flattens the depth
    stagger, and removing them merges three heads into one.
    """
    lift_b = ctx.graze[0] * GRAZE_LIFT if ctx.graze else 0
    lift_a = ctx.graze[1] * GRAZE_LIFT if len(ctx.graze) > 1 else 0

    # THEY ARE CHEEKPIECES, NOT DOTS. Measured, both marks are short straps
    # running down and FORWARD across the jaw — B's from (166, 84) to
    # (164, 88), A's from (175, 82) to (173, 88) — brightening as they
    # descend to the bit. Stamped as rectangles they read as dominoes on a
    # black field; drawn as the two-pixel diagonals they are, they read as
    # buckled leather, which is the whole point of §1's "harnessed, not
    # loose".
    dim = ctx.ink("horse_mane")
    bx, by, bwidth, bheight = layout.HORSE_B_BRIDLE
    for row in range(5):
        x = bx + 2 - row // 2
        canvas.put(x, by - 1 + row - lift_b, dim if row < 2 else ctx.ink("horse_mane", 1))
        if row:
            canvas.put(x - 1, by - 1 + row - lift_b, dim)
    canvas.put(163, 92 - lift_b, dim)

    # §3.11. Peak L 85 at (173-174, 86-88), `ochre@8`. THE BRIGHTEST THING IN
    # THE TEAM, and the brightest thing in the rect that is not a town light
    # or a coach lamp — the only `ochre@8` anywhere in the region. Three
    # pixels, at the bottom of a strap that is otherwise one step dimmer than
    # itself.
    ax, ay, _, aheight = layout.HORSE_A_BRIDLE
    for row in range(aheight):
        x = ax + 3 - row // 3
        canvas.put(x, ay + row - lift_a, ctx.ink("horse_mane", 1))
        canvas.put(x - 1, ay + row - lift_a, dim)
    # THREE PIXELS (§3.11), and they are not a block: measured, `ochre@8`
    # lands at (174, 86), (173, 87) and (173, 88) — a spark running down and
    # forward with the strap, not a domino stamped on the jaw.
    spark = ctx.ink("bridle_spark")
    canvas.put(174, 86 - lift_a, spark)
    canvas.put(173, 87 - lift_a, spark)
    canvas.put(173, 88 - lift_a, spark)
    canvas.put(175, 87 - lift_a, ctx.ink("horse_mane", 1))
    canvas.put(172, 92 - lift_a, ctx.ink("horse_mane"))
    canvas.put(176, 92 - lift_a, ctx.ink("horse_mane", -1))


# ---------------------------------------------------------------------------


def _cast_shadow(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """§3.24. ONE pooled shadow. There are no per-leg shadows.

    L median 24 against open road at 54 — a 55% darkening — and it is THE
    ROAD'S OWN FAMILY DARKENED, not a grey wash, which is why it steps the
    index that is already there rather than painting one. Its front edge sits
    2-4 px in front of the deepest hoof and is broken and stippled, never a
    line.

    It skips the reserved bands. layout §5: the road's standing water is
    `accent_indigo` 2-4, and every pass that moves a colour has to consult
    keep(), because a reserved index stepped down its ramp leaves the band
    and the band is then reserved for pixels that are no longer in it.
    """
    x0, y0, width, height = layout.TEAM_SHADOW
    rng = ctx.stream("team shadow edge")
    # AND IT STARTS UNDER THE BELLY, not at the hooves. layout.TEAM_SHADOW
    # now begins at y=90 -- the anchor was at 99 and this module drew from
    # 90, and the contract has been reconciled to the drawing. Measured on
    # the bar, the ground between the legs at x 196-215 runs L 20-31 from
    # y=90 all the way down. It is one pooled shadow (§3.24 — there are
    # still no per-leg shadows) and nine legs are told apart against it.
    for y in range(SHADOW_TOP, y0 + height):
        # The pool is deepest under the belly and thins toward its front
        # edge; the last two rows break up into stipple.
        #
        # TWO STEPS, NOT THREE, AND THE REASON IS THE PLANE UNDERNEATH. This
        # was three because it was drawn against layout.road_luminance's old
        # model, which put the unlit road at 47-50 in these columns; the
        # model has since been re-fitted to the bar and puts them at 23, so
        # three steps of darkening now lands the ground between the legs at
        # 18.6 against a measured 28.7. Same shadow, same measurement, on a
        # plane that moved 24 luminance underneath it.
        # ONE STEP UNDER THE ANIMAL, TWO AT THE FEET. The pool is deepest
        # where the body blocks the sky and thins toward its front edge --
        # but the rows the LEGS stand in are also the rows the nine feet
        # are told apart in, and two steps there took the ground between
        # them from a measured 30-38 down to 17-21 and the lit fronts of
        # the cannons with it. Measured on the bar, x 196-218 runs L 29.6
        # at y 92-99 and L 24.4 only from y=100 down; ours ran 18.4 across
        # the whole of it. §5.3's whole point is that the animals are dark
        # objects ON A BRIGHT FLOOR, and a floor darkened to hide value is
        # not a floor, it is more horse.
        depth = 1 if y < HOOF_LINE else (2 if y < y0 + height - 3 else 1)
        for x in range(x0, x0 + width):
            if layout.keep_at(canvas, x, y):
                continue
            if y >= y0 + height - 2 and rng.random() < 0.45:
                continue
            ctx.shield(x, y)
            canvas.put(x, y, ctx.palette.darken(canvas.get(x, y), depth))
