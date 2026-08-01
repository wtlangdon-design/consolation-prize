"""Room 1 — the mid-ground, between the town's foot and the road. GRAYBOX.

The band nobody wrote a spec for, because it is not an object: it is the
valley floor and the near bank the whole lower half of the picture stands
on. Its numbers come from the whole-frame study rather than from a region
brief, and they are the two rows of the depth ladder between the near
range's base and the road:

    near range base   +17 rows below crest   L 21.75   sat 0.56   sd 5.86
    valley floor      +24                    L 24.60   sat 0.48   sd 4.28
    mid ground        +34                    L 28.92   sat 0.54   sd 6.08
    road              --                     L 37.39   sat 0.42   sd 7.33

Read down the value column: this band is where the U turns. Value has
finished falling at the near range ridge and is climbing forward again, and
it climbs GENTLY -- 21.75 to 28.92 across twenty-five rows, about one and a
half mud steps. Study §5 is explicit that below the valley floor the gaps
collapse to one step or less and separation switches to OVERLAP: the fence
over the valley floor, the horse team over the fence, the coach over the
horses, the timber over everything on the left. Anything that tries to
separate these planes by value instead runs out of range and the foreground
goes chalky.

WHERE THE WARM BOUNDARY CROSSES IT. Study §3 measures the warm/cold line per
column and it is a GROUND LINE, not a horizontal: median y=58, dipping to
y=71 at x=96 where cold valley floor pushes down, riding high on the left
and right. So this band straddles it, and the straddle is drawn rather than
averaged -- cold `grey` above layout's WARM_BOUNDARY, warm `mud` below it.
That matters more than it looks: the lantern pool's outermost contour
reaches y=94, and the lighting pass cannot change hue. A cold pixel there
can never be warmed.

WHERE IT STOPS. Nominally layout.MIDGROUND_ROWS, y 69-93. In practice `road`
lays its own value field from a few rows above the seam and its rut fan from
higher still, because road.md §8 requires the ground plane and the fan to be
continuous across y=94 -- "if the road is drawn as a self-contained band, the
seam at y = 94 will show as a step in both the value gradient and the rut
spacing." So the bottom rows of this band are painted twice, on purpose, and
the second coat wins.

DEFERRED to whoever takes this band:
  - study §6 measures the mid-ground at 0.0% flat -- the busiest plane in
    the frame after the road. This is a flat graded fill and it is the one
    place in the composition where "no texture" is a real departure rather
    than a simplification.
  - the scrub, stones and clumps that carry that texture are not drawn.
  - the dark pocket under the hitching rail (rail.md §2.7, mean L 28.4,
    darker than the hillside behind it) belongs to `rail` and is drawn there.

THE BAND IS COLD, AND THAT IS THE INTEGRATION FIX OF THIS ROUND. It was
authored warm below layout.WARM_BOUNDARY, which put warm `mud` under
essentially the whole band, and four region authors independently reported
the same failure from four different rects: the backdrop behind the team,
behind the rail, behind Hob and behind the coach composited as flat warm
brown at the same value AND the same hue as the thing standing on it.

WARM_BOUNDARY IS NOT A MASK, and layout says so in the line that declares
it. Study §3 measured it as "the first row below which the next ten rows are
at least 60% warm" -- a statistic over a band that contains the timber (warm
up into the sky), the coach (warm to its roofline), the fence, the crate,
the horses and the top of the road. Those objects are what make the band 60%
warm. The GROUND they stand on is cold, and measured on the bar's open
ground it is not close:

    x 105-135, rows 70-81   L 29-40   warmth -19 to -20
    x 196-233, rows 56-74   L 13-29   warmth -21 to 0
    x 300-319, rows 44-70   L 12-21   warmth -20 to -39

against this module's own previous output of warmth +16 to +29 on every row
it owned. Study §5 is the reason it matters more than a hue error usually
would: below the valley floor the value gaps collapse to one step or less
and separation switches to hue and overlap. A warm ground at matched value
takes the hue channel away from every object in the lower half of the frame
at the moment it becomes the only channel left.

So the warm side of the ground line is drawn by `road`, which repaints this
band's bottom rows from a few rows above the seam anyway (see WHERE IT STOPS
below) -- and the hue seam lands where road's own coat begins, which is what
study §3's ground line is.
"""

from __future__ import annotations

from canvas import IndexedCanvas

from . import layout


#: The two ends of the band. The top is study §5's valley floor,
#: ridge-relative, at L 24.6. The bottom is the mid-ground plane easing into
#: the road: study §5's ladder runs valley floor 24.60 -> mid ground 28.92 ->
#: road 37.39, and the bar's open mid-ground at x 105-135 measures a median
#: of about 33 across rows 70-87.
#:
#: IT USED TO END AT 44.0 -- road.md §4.1's model at the road's own top row
#: less one step -- which chased seam continuity into a band the reference
#: measures at 24-38, and did it in the warm family, so the seam it was
#: smoothing was a seam that should be there. The ground line is a hue
#: boundary with a value step of about +8 across it (§5's ladder), not a
#: gradient that has to be levelled.
#:
#: TOP_L WAS 24.6 AND IS NOW 30.0. 24.6 is study §5's valley-floor number and
#: it is RIDGE-RELATIVE -- a value measured at a fixed offset below the near
#: crest, which is not the same thing as the value of these rows. Measured on
#: the bar over the rects three region authors named, this band's top is not
#: at 24.6: x 104-127 / y 64-88 is 35.7 (rail asked for 35.2, hob for a
#: mottled 33-45 and both measured about 28.5 in the composite), and the
#: genuinely open midground columns x 109-121 and x 165-175 run 24-31 across
#: rows 69-77 against this module's 21. The band is the thing every near
#: object in the lower half is READ AGAINST -- §5's separation switches from
#: value to overlap right here -- so five luminance of it is five luminance
#: off every silhouette standing on it.
#:
#: The bottom is unchanged: rows 84-93 already measure within +-5 of the bar.
#: So the ramp is shallower than it was, not shifted.
TOP_L = 30.0
BOTTOM_L = 33.0

#: Study §5's near-range-base rung, and how many rows the band takes to climb
#: off it. See the comment at the lead-in in draw(): this is the rung between
#: `range`'s mass and this band's own top, and without it the two met at a
#: fourteen-luminance step in a single row.
FOOT_L = 21.75
FOOT_ROWS = 5

#: THE TOWN'S SPILL, and it is the other end of the same seam.
#:
#: town.md's moonlit foot band is a LIGHT on the valley floor, not an edge of
#: the town: the ground in front of a lit town is lit. It ends at y=68
#: because that is where `town`'s rect ends, and this band opened at TOP_L
#: directly underneath it -- so the composite carried a one-row bright rule
#: across the middle of the valley. Measured as (row 68 mean) minus the mean
#: of its two neighbours, over the town's own columns: x 96-111 +20.3,
#: x 112-127 +12.7, x 128-143 +14.5, against a bar that measures -1.4, -4.6
#: and -3.4. The bar has no rule there at all -- its rows 67/68/69 over
#: x 64-152 run 46.2 / 43.5 / 42.1, a plane, while ours ran 40.7 / 48.8 /
#: 35.7.
#:
#: A light that stops at a region edge is the one defect no region author can
#: see, because each half of it is correct inside its own rect. So the band
#: opens under the town at the foot band's own value and eases off it, the
#: same shape as FOOT_ROWS above and for the same reason -- and only across
#: the town's columns, which is where the light is.
SPILL_L = 7.5
SPILL_ROWS = 6

#: THE MIX IS PER PIXEL, AND THE DENSITY IS A FIELD RATHER THAN A NUMBER.
#: This is the integration fix of the round and it is the second attempt at
#: it, so both failures are recorded.
#:
#: FIRST it was a 4x4 ordered dither at exactly 0.5, which is the one density
#: at which a Bayer matrix stops being a dither and becomes a lattice --
#: BAYER4 thresholded at 0.5 is the checkerboard, exactly. Four region
#: authors reported it from four different rects: rail's "a hard 2x2 blue
#: checkerboard alternating L24/L35", team's "an ordered checkerboard that
#: shows through the jaw wedge and the leg holes", coach's "showing at full
#: amplitude across x210-240 rows 78-92", left_yard's "spec section 5
#: measures zero checkerboard content anywhere here".
#:
#: THEN it was a hash over 3x2 and 2x3 CELLS, chosen so that an ABAB run
#: could not form -- and it traded a checkerboard for a screen door. A cell
#: is a repeating pattern the moment it has a size: measured on the open
#: mid-ground at x 104-136 / y 69-78 the cells put the mean horizontal run at
#: 2.80 px and the vertical at 2.04 against a bar that measures 1.37 and
#: 1.09, and two blind critics found the result independently from different
#: crops. Worse, the two fields were INDEPENDENT: the hue field chose the
#: family and the value field chose the step, so a 3x2 block of
#: accent_indigo 0 at L 21.0 could sit against a 3x2 block of grey 2 at
#: L 32.3 -- an eleven-luminance step, at block scale, across the whole band
#: at one unmodulated density. That eleven-luminance block alternation is
#: what read as a lattice; the hue mix was never the visible part.
#:
#: So: the value dither is PER PIXEL, which is what a dither is, and its
#: eleven luminance now live at pixel scale where they read as ground. The
#: hue mix is per pixel too, paired at matched value against whichever step
#: the value dither landed on, so the two fields can no longer disagree by a
#: step. Neither has a cell, so neither has a wavelength, so neither can read
#: as a pattern at 4x. Doc 11's "ordered, never error-diffused" is about
#: dithering a gradient across a large flat plane; this band's gradient is
#: three luminance over twenty-five rows and its texture budget (study §6:
#: the mid-ground is 0.0% flat, the busiest plane in the frame after the
#: road) is the thing being drawn.
#:
#: And the DENSITY IS NOT CONSTANT. Study §6: "density varies with depth, not
#: with light or material" is a statement about local sd, and §3's warm/cold
#: boundary is a ground line that dips to y=71 at x=96 and rides at y 41-47
#: at both edges. Measured on the bar over rows 69-93, the median warmth by
#: sixteen-column band runs +15 at x 72-87, +9 at x 88-103, -19 at x 104-119,
#: 0 at x 120-135, +11 at x 136-151 -- a cold tongue pushing down through the
#: centre with warm ground either side of it, exactly the shape §3 measures.
#: A flat 0.5 draws the average of that and none of it.

#: The blue share at the top of the band and at its foot. The band opens on
#: the near range's cold base and warms forward into the road; §5's ladder
#: and §3's eight-row turnover are the same movement seen in two channels.
#:
#: NOT 0.5, AND THE ARITHMETIC IS THE REASON. `grey` measures R-B = -4 and
#: `accent_indigo` about -33, so a mix at density d lands at -4 - 29d and
#: carries a local hue deviation of 29*sqrt(d(1-d)). The bar's cleanest open
#: mid-ground rect, x 104-136 / y 69-78, measures mean R-B = -13.1 with a 3x3
#: local deviation of 10.8. Density 0.31 hits the mean exactly; 0.5 lands at
#: -18.5 with a deviation of 14.5, which is half again the bar's and is what
#: made the per-pixel version read as confetti the moment the cells came out.
#: The two numbers cannot both be hit with two families 29 apart -- the mean
#: is the one that is chosen, because it is the one every silhouette in the
#: lower half is read against.
BLUE_AT_TOP = 0.46
BLUE_AT_FOOT = 0.22

#: The lantern's column, and how far its warmth is authored out from it.
#: Layout rule 2: the lighting pass steps within a family and CANNOT CHANGE
#: HUE, so every surface the lamp will ever touch has to be authored warm
#: first. The pool's own top edge is dead at y=92 (layout.POOL_TOP_DEAD_Y),
#: but the ground beside the lamp is warm well above it on the bar -- x 72-87
#: measures +15 against x 104-119's -19 -- because the gantry lamp is over
#: the sign at (77, 67) and the town's foot band is spilling onto the same
#: columns. Centred on the flame, reaching about as far as the sign board.
LAMP_WARM_X = 86
LAMP_WARM_REACH = 24.0
LAMP_WARM_DEPTH = 0.26

#: The material patch: how far the blue share wanders from its modelled value
#: over a low-frequency field, and the field's wavelength. Coarse enough to
#: read as one patch of ground being stonier than the next, far too coarse to
#: read as a pattern, and never aligned to anything -- 29 and 7 share no
#: factor with 23 and 9 below, or with the frame.
PATCH_DENSITY = 0.30
PATCH_DENSITY_WAVE = (29, 7)

#: The same idea in the value channel: the plane is not two flat plates with
#: a dither between them, it is ground. About one mud step of low-frequency
#: wander on the row's target, which is what takes the band's local 5x5
#: standard deviation from 9.3 to the bar's 10.3 without touching the ladder.
PATCH_L = 4.4
PATCH_L_WAVE = (23, 9)

#: THE GRAIN, and it is the module's oldest deferred item finally drawn.
#: Study §6 measures the mid-ground at 0.0% flat -- the busiest plane in the
#: frame after the road -- and this band was a flat graded fill whose only
#: variation was the ladder's own two-step dither. Measured as a 7x7 highpass
#: over the open rect at x 104-136 / y 69-78 that gives a fine-noise
#: luminance deviation of 5.0 against the bar's 7.3, while the same measure
#: on the HUE axis gives 16.9 against 13.5: the plane carried its texture
#: budget in the wrong channel, which is the other half of why it read as a
#: screen rather than as ground. Half a grey step of per-pixel jitter on the
#: target moves both the right way at once.
GRAIN_L = 10.0

#: ERRATA 33b, HONOURED AT THE SOURCE. No building and no hill may be lighter
#: than the sky, and the compositor enforces it across layout.SKYLINE_ROWS --
#: rows 44-79, which is the top eleven rows of this band. `grey` 3 at L 40.6
#: is over the measured ceiling of 33.8 and `grey` 2 at 32.5 is under it, so
#: the grain is capped at step 2 while the band is inside those rows.
#:
#: Capped HERE rather than left to the pass, because the pass has DECLARED
#: exemptions -- the lamp, the sign, the rail, the team, the coach -- and
#: correcting an uncapped grain afterwards would crush it in the sixteen
#: columns between two exemptions and nowhere else. A rule applied unevenly
#: across a continuous plane is a vertical seam in the picture; applied at
#: the source it is simply the ceiling.
#:
#: AND NOT UNDER THE TOWN. layout.TOWN_FOOT_SPILL is the lit valley floor the
#: town stands on, it is declared exempt from 33b for the reason recorded
#: there, and capping it here would have crushed it just the same -- from the
#: other side of the same pass. The exemption and the cap read one rect.
CEILING_MAX_STEP = 2


def _hash(x: int, y: int, salt: int) -> float:
    """A stable 0-1 per PIXEL. No lattice, no sequence, no draw-order coupling."""
    h = (x * 73856093) ^ (y * 19349663) ^ (salt * 83492791)
    h &= 0xFFFFFFFF
    h ^= h >> 15
    h = (h * 0x2C1B3C6D) & 0xFFFFFFFF
    h ^= h >> 12
    h = (h * 0x297A2D39) & 0xFFFFFFFF
    h ^= h >> 15
    return (h & 0xFFFFFF) / float(0x1000000)


def _field(x: int, y: int, wave: tuple[int, int], salt: int) -> float:
    """Smooth 0-1 value noise on a lattice `wave` pixels apart.

    Interpolated with a smoothstep rather than sampled per cell, because a
    cell is a wavelength and a wavelength is a pattern -- which is the
    mistake this module made last round. Nothing here has an edge; the field
    only decides how much of one family a neighbourhood leans toward, and the
    per-pixel hash decides the pixel.
    """
    wx, wy = wave
    gx, gy = x // wx, y // wy
    fx = (x - gx * wx) / float(wx)
    fy = (y - gy * wy) / float(wy)
    fx = fx * fx * (3.0 - 2.0 * fx)
    fy = fy * fy * (3.0 - 2.0 * fy)
    c00 = _hash(gx, gy, salt)
    c10 = _hash(gx + 1, gy, salt)
    c01 = _hash(gx, gy + 1, salt)
    c11 = _hash(gx + 1, gy + 1, salt)
    top = c00 + (c10 - c00) * fx
    bottom = c01 + (c11 - c01) * fx
    return top + (bottom - top) * fy


def _in(rect: tuple[int, int, int, int], x: int, y: int) -> bool:
    x0, y0, width, height = rect
    return x0 <= x < x0 + width and y0 <= y < y0 + height


def _blue_density(x: int, y: int, top: int, bottom: int) -> float:
    """The blue share at one pixel. Depth, then the lamp, then the material."""
    walk = max(0.0, min(1.0, (y - top) / float(max(1, bottom - 1 - top))))
    density = BLUE_AT_TOP + (BLUE_AT_FOOT - BLUE_AT_TOP) * walk
    near_lamp = max(0.0, 1.0 - abs(x - LAMP_WARM_X) / LAMP_WARM_REACH)
    density -= LAMP_WARM_DEPTH * near_lamp * near_lamp
    density += (_field(x, y, PATCH_DENSITY_WAVE, 7) - 0.5) * PATCH_DENSITY
    return max(0.04, min(0.88, density))

#: THE GROUND LINE, as a handover rather than an edge. Study §3's boundary is
#: the frame's principal structural line and it is a HUE boundary, but it is
#: not a step: measured across x 100-260 the bar's warmth runs -10 to +5
#: through rows 70-85, +10 to +15 by rows 88-93, and +10 to +21 in the road
#: below -- it turns over about eight rows. Handing a cold plane straight to
#: `road`'s warm one at y=94 put a +16-warmth jump into a single row across
#: 160 px, which is a line in the picture where the reference has none.
#:
#: So the last rows dissolve into the road's own family instead of meeting
#: it. Most of this span is overdrawn by `road` and by what stands on it --
#: this band keeps only 15-29 px a row down here -- but those leftovers are
#: exactly the pixels seen right beside the seam.
GROUND_LINE_FROM = 84

#: AND IT IS AN ARC, NOT A HORIZONTAL. Study §3 measures the boundary per
#: column and its shape is unambiguous even where its absolute rows are not:
#: it "rides high on the left (x 0-16, y 41-51) and high on the right
#: (x 240-288, y 41-47), and dips lowest in the centre (x 96, y=71)". This
#: module declined to read WARM_BOUNDARY as a mask, for the good reason
#: recorded at the top -- the statistic is taken over a band full of warm
#: OBJECTS -- and then drew the handover as one horizontal for all 320
#: columns, which throws the shape away with the contamination.
#:
#: The shape is measurable without the objects. Comparing ONLY the pixels
#: this module still owns in the finished composite against the bar at the
#: same coordinates, the mean R-B by 32-column band runs:
#:
#:   x   0-31  +6.3    x  96-127  -12.0    x 192-223   -4.8
#:   x  32-63  -4.3    x 128-159  -10.2    x 224-255   +3.3
#:   x  64-95 -11.9    x 160-191  -15.1    x 256-287  +11.8
#:
#: -- cold through the middle third and warm at both ends, which is §3's arc
#: and nothing else. Ours was -2.0 / -7.8 / -9.9 / -11.4 / -16.5 / -13.0 /
#: -11.9 / -9.8 / -13.4: right in the centre and up to 25 too cold at the
#: east end, where it put a blue speckle across the open ground beside the
#: coach that the bar draws as warm verge.
#:
#: So the handover starts higher the further it is from the centre. A
#: quadratic, because §3's per-column table is a smooth dip and not a step,
#: and because the one thing a hue boundary must not do in this frame is
#: arrive as a line.
#: The arc is SHALLOW -- six rows across half the frame, not the thirty §3's
#: per-column table would suggest. Swept against the same measurement, a top
#: of 74 / 78 / 80 gives a mean per-32-column hue error of 4.04 / 3.90 / 3.76
#: and a whole-band mean of +0.82 / +0.49 / +0.33 against the bar's +0.05:
#: the shape is worth having and its amplitude is not worth arguing about,
#: which is what a boundary measured through a field of warm objects should
#: be expected to give.
GROUND_LINE_CENTRE = 128
GROUND_LINE_REACH = 160.0
GROUND_LINE_TOP = 78


def _ground_line(x: int) -> float:
    """The row the warm handover begins at, in column x. See GROUND_LINE_FROM."""
    t = min(1.0, abs(x - GROUND_LINE_CENTRE) / GROUND_LINE_REACH)
    return GROUND_LINE_FROM - (GROUND_LINE_FROM - GROUND_LINE_TOP) * t * t

#: The blue entry paired with each `grey` step, at MATCHED VALUE. Explicit
#: rather than palette.nearest_in_family, because nearest-in-family for
#: grey 3 is accent_indigo 2 -- the first entry of the puddles' reserved
#: cycling band -- and it would be clamped back out silently by
#: cycling.reserve() after the picture had already been composed around it.
#:
#:   grey 1  L 24.3  <-  accent_indigo 0  L 21.0   (3.3 apart)
#:   grey 2  L 32.3  <-  accent_indigo 1  L 33.8   (1.5 apart)
#:   grey 3  L 40.4  <-  accent_indigo 1  L 33.8   (6.6 apart)
BLUE_FOR_GREY = {0: 0, 1: 0, 2: 1, 3: 1, 4: 1}


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    top, bottom = layout.MIDGROUND_ROWS
    grey = ctx.ramp("valley_floor")
    blue = ctx.ramp("valley_floor_blue")
    warm = ctx.ramp("wet_mud")
    palette = ctx.palette

    # Row 68 is drawn as well as rows 69-93, and only outside the town's own
    # horizontal extent. THAT ROW WAS A HOLE: `town` ends its moonlit foot
    # band at y=68 but only across its own rect, `range` stops at the same
    # row, and this band began at 69 -- so 49 px of row 68 out past the
    # town, mostly x 180-215, were never written by any region at all and
    # shipped as the canvas's initial fill. A hole that is one row tall and
    # the colour of the void reads as a hard black rule across the valley,
    # and it is invisible to every region author because it is nobody's row.
    # THE SKIP NO LONGER YIELDS TO A HOLE, because there is no longer a hole
    # for it to yield to. `town` was leaving (81, 68) unpainted -- its
    # occlusion rect for the hanging lamp claimed two columns wider than
    # `left_yard` actually covers -- and this loop grew an escape hatch that
    # filled any pixel in the town's columns still holding the void index.
    # That is a repair keyed on THE CANVAS FILL rather than on the drawing:
    # it made the compose depend on what the canvas started as, so
    # room01_seams.py -- which composes twice over two fills and diffs --
    # went on reporting the pixel as unwritten while the render looked fine.
    # The over-claim is fixed in `town.OCCLUDED`, where it was, and the skip
    # here is unconditional again.
    town_x, _, town_w, _ = layout.TOWN_MASS

    # The row's target luminance, and the two spans it can be reached by.
    # PER ROW, but the value the pixel chases is per pixel: PATCH_L wanders
    # the target over a low-frequency field so the plane is ground rather
    # than two flat plates with a dither between them, and `_step_at` below
    # re-brackets whenever the wander crosses into the next pair of steps.
    target_row = {}
    foot_target = {}
    warm_share = {}
    for y in range(layout.TOWN_BASE_Y, bottom):
        walk = (y - top) / max(1, bottom - 1 - top)
        target = TOP_L + (BOTTOM_L - TOP_L) * max(0.0, walk)
        # THE FOOT, and it is a seam nothing but the whole frame shows.
        # `range` fills its near mass at `near_rock`, L 16.0, down to its own
        # base at y=67; this band opens at y=68 at TOP_L. Those two numbers
        # were fourteen luminance apart, which put a hard horizontal rule
        # across 170 px of the valley in one row -- and it is INVISIBLE IN
        # THE REVIEW RENDER, because the coach and the team stand on exactly
        # the columns where it shows. It is fully exposed in the shipping
        # background, which is errata 31d's coach-departed composition, and
        # that is the file the engine actually loads. The bar steps about one
        # luminance across the same row.
        #
        # So the band opens at study §5's near-range-base rung, 21.75, and
        # reaches TOP_L over five rows. §5's ladder is exactly this: near
        # range base 21.75 -> valley floor 24.60 -> mid ground 28.92, and the
        # rung below the ridge was simply missing from this module.
        #
        # AND ONLY WHERE `range` IS WHAT IT MEETS. Across the town's own
        # columns the row above is town.md's moonlit foot band, which is
        # BRIGHTER than this band, not darker -- the bar has x 128-135 at
        # y 64-71 running to 49 -- so a lead-in there ramps down from a rung
        # that is not underneath it and darkens the one part of the valley
        # the town lights stand on. Two spans per row, and the column picks.
        # Under the town, the band opens on the foot band's own light and
        # eases off it over SPILL_ROWS. See SPILL_L. Only target_row carries
        # it -- foot_target is what the columns OUTSIDE the town take, and
        # out there the row above is `range`'s mass, which is not lit.
        spill = max(0.0, 1.0 - (y - layout.TOWN_BASE_Y) / float(SPILL_ROWS))
        foot_target[y] = target
        target_row[y] = target + SPILL_L * spill * spill
        if y < layout.TOWN_BASE_Y + FOOT_ROWS:
            lead = (y - layout.TOWN_BASE_Y) / float(FOOT_ROWS)
            foot_target[y] = FOOT_L + (target - FOOT_L) * lead
    # The handover is per COLUMN as well as per row -- see _ground_line.
    ground_line = [_ground_line(x) for x in range(layout.WIDTH)]
    for y in range(layout.TOWN_BASE_Y, bottom):
        warm_share[y] = [
            max(0.0, min(1.0, (y - start) / float(bottom - start)))
            for start in ground_line
        ]

    grey_ladder = _ladder(palette, grey)
    warm_ladder = _ladder(palette, warm)

    for y in range(layout.TOWN_BASE_Y, bottom):
        row_share = warm_share[y]
        for x in range(layout.WIDTH):
            share = row_share[x]
            if y < top and town_x <= x < town_x + town_w:
                continue
            # A patch of ground is a little darker or lighter than the row it
            # is in, and it is patches wide rather than pixels wide. One
            # field, shared by all three families, so a patch is a patch of
            # GROUND and not three unrelated mottles in register. The grain
            # on top of it is per pixel and is the plane's texture budget.
            wander = ((_field(x, y, PATCH_L_WAVE, 3) - 0.5) * PATCH_L
                      + (_hash(x, y, 29) - 0.5) * GRAIN_L)
            # The ground line first. Per pixel, on its own salt, so the three
            # families never lock into one pattern.
            if share > 0.0 and _hash(x, y, 13) < share:
                canvas.put(x, y, warm.at(
                    _step_at(warm_ladder, target_row[y] + wander, _hash(x, y, 17))))
                continue
            # Outside the town's columns this row meets `range`'s mass, not
            # the town's foot band, and takes the lead-in target.
            base = target_row[y] if town_x <= x < town_x + town_w else foot_target[y]
            step = _step_at(grey_ladder, base + wander, _hash(x, y, 19))
            if y < layout.SKYLINE_ROWS[1] and not _in(layout.TOWN_FOOT_SPILL, x, y):
                step = min(step, CEILING_MAX_STEP)
            if _hash(x, y, 23) < _blue_density(x, y, top, bottom):
                canvas.put(x, y, blue.at(BLUE_FOR_GREY.get(step, 1)))
            else:
                canvas.put(x, y, grey.at(step))


def _ladder(palette, ramp) -> tuple[tuple[float, int], ...]:
    """A ramp as (luminance, step), sorted. Built once per compose."""
    return tuple(sorted(((palette.luminance(ramp.at(s)), s)
                         for s in range(ramp.count))))


def _step_at(ladder, target: float, roll: float) -> int:
    """The ramp step one pixel takes, chasing a target luminance.

    Chasing the target rather than picking a step by eye, because this band's
    whole job is to land between two measured numbers seven luminance points
    apart. Picking by eye at 8x zoom is how a night becomes a dusk. The
    fraction is not rounded away -- it is the probability that this pixel
    takes the upper of the two steps it falls between, so twenty-five rows of
    an eight-luminance ramp do not come out as two flat plates.

    PER PIXEL, and that is the whole point. The two steps this brackets can
    be eleven luminance apart in `grey`; at pixel scale that is a dither and
    at cell scale it is a lattice, which is what this band shipped as last
    round.
    """
    below, above = ladder[0], ladder[-1]
    for entry in ladder:
        if entry[0] <= target:
            below = entry
        if entry[0] >= target:
            above = entry
            break
    if above[0] <= below[0]:
        return below[1]
    blend = (target - below[0]) / (above[0] - below[0])
    return above[1] if blend > roll else below[1]
