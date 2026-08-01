"""Room 1 — THE SHARED CONTRACT. Nine authors, nine files, one picture.

Nothing in here draws. Everything in here is a number nine people have to
agree on, and every number carries the spec section and the measurement it
came from, because the only thing worse than an unshared number is a shared
one nobody can check.

WHY THIS FILE EXISTS. The nine region modules are written independently and
never see each other's pixels. Left to themselves that produces a collage:
nine correct drawings that do not stand on the same earth, do not share a
light, and meet at seams. Every cross-region fact therefore lives here and
only here -- band boundaries, the value ladder, the ground line, the light
falloff, the material table, the reserved bands. A region that needs a
number its neighbour also needs is a number that belongs in this file.

THE FOUR THINGS A REGION MUST NOT DO FOR ITSELF

1. Invent a value for a depth plane. §4 is the ladder and it is a U --
   value FALLS from the sky to the near ridge and RISES to the road. The
   near ridge is the darkest structural plane in the frame. Anything that
   assumes "further = lighter" inverts the ranges.
2. Author a warm surface cold, or a cold one warm. The lighting pass steps
   a colour along its own family ramp and CANNOT CHANGE HUE. A grey road
   cannot be made warm afterwards, and the failure only shows up after the
   pass, three steps from its cause. §6 is the map.
3. Touch a reserved index. §5. Two bands, four and three entries, owned by
   the lantern flame and the road puddles. Every later pass consults keep().
4. Guess where the ground is. §8.

THE ONE SENTENCE THE WHOLE FRAME IS BUILT ON, from the whole-frame study:
a frame whose entire tonal range lives in the bottom 48% of the scale,
built from two hue families 205 degrees apart, in which one small light
source supplies 55% of all the light and does it by lighting the ground
BEHIND the figure rather than the figure.

Luminance in this module is quoted the way the specs quote it. Where a
number came from a Rec.709 measurement and where from 0.299/0.587/0.114 is
noted at the number; the two differ by two or three units at these values
and no decision here turns on the difference.
"""

from __future__ import annotations

import math
import random
from contextlib import contextmanager, nullcontext
from dataclasses import dataclass, field

import cycling
from canvas import IndexedCanvas
from palette import Palette, Ramp

# ---------------------------------------------------------------------------
# 1. THE FRAME
# ---------------------------------------------------------------------------

#: Native, and never anything else. The play area is the whole of it; the
#: verb panel lives outside the room image.
WIDTH, HEIGHT = 320, 144

#: One seed for the room. Regions do not use it directly -- they ask for a
#: named stream (see Ctx.stream), so adding scatter to the town cannot move
#: the stars. The date on Thad's ticket.
SEED = 18580412


# ---------------------------------------------------------------------------
# 2. DEPTH BANDS -- the y of every boundary, measured
# ---------------------------------------------------------------------------
#
# These are the rows the whole-frame study bands the picture at, plus the
# per-region crest measurements that say where the bands really are per
# column. A band boundary is a fact about the composition; a crest is a fact
# about a silhouette, and the two are not the same thing.

#: Sky band. Study §1, "Sky, rows 0-37, 26.4% of frame".
SKY_ROWS = (0, 38)

# SKY_FLAT_TO, SKY_RAMP_ROWS and SKY_PLATEAU_FROM were here, and they
# described a three-segment gradient -- flat to row 16, ordered 4x4 ramp to
# 32, plateau after -- that `sky` no longer draws. Nothing else in the tree
# read them (grep: three hits, all three the definitions themselves), so a
# reader checking the sky against the contract was checking it against a
# shape it does not have. Removed at the region author's request rather than
# updated, because the sky's own module documents its ladder in one place and
# a second, stale copy of it in the shared contract is worse than none.

#: Far range. range.md §2: mean crest y=38.0, highest y=29 at x=27, lowest
#: y=43 at x=195-210, amplitude 14, sd 3.7.
FAR_RANGE_CREST_MEAN = 38
FAR_RANGE_CREST_HIGH = 29
FAR_RANGE_CREST_LOW = 43

#: Near range. range.md §2: mean crest y=44.7, high 35 at x=27, low 49.
#: The gap between the two crests averages 6.7 px and IS the depth cue.
NEAR_RANGE_CREST_MEAN = 45
NEAR_RANGE_CREST_HIGH = 35
NEAR_RANGE_CREST_LOW = 49

#: Town. town.md §2: dark trough y 45-49, roofline flat at y=51 +/-2 from
#: x=89 to x=140, base y=68, moonlit foot band y 67-68.
TOWN_TROUGH_ROWS = (45, 50)
TOWN_ROOF_Y = 51
TOWN_BASE_Y = 68
TOWN_FOOT_BAND = (67, 69)

#: Mid-ground. Study §1 bands it 80-99; the town's foot band at 67-68 is the
#: far bank it stands on, so the mid-ground proper is what lies between.
MIDGROUND_ROWS = (69, 94)

#: Road. Study §1: rows 100-143, 30.6% of frame. road.md's rect starts at
#: y=94 and says explicitly that y=94 is NOT a boundary in the picture -- the
#: ground plane runs up past it and is occluded by what stands on it.
ROAD_TOP = 94

#: The ground plane's horizon, from the rut fan. road.md §3.1: every rut,
#: extended, heads for (316, 82) -- twelve rows above the top of the road
#: band and off the region entirely. Horizontal spacing between two ruts at
#: row y is proportional to (y - 82). This single number is what makes the
#: bottom third recede.
RUT_VANISHING = (316, 82)
GROUND_HORIZON_Y = 82

#: The far range's crest, as (x, y) control points. Summits from range.md §2
#: -- 27/29, 49/31, 81/38, 101/38, 132/39, 143/36, 155/34, 185/41, 203/42,
#: 226/37, 262/36, 273/37, 299/39 -- with the saddles sky.md §2 measures
#: between them: x 8-16 at y 34-35, x 112-128 floor y 43, x 196-212 floor
#: y 43, x 244-250 at y 42, x 286-292 at y 41.
#:
#: The character is SMOOTH, NOT JAGGED. A DFT of the crest has nothing above
#: 0.8 px amplitude at any wavelength shorter than 36 px; 63% of adjacent
#: column pairs are flat, 34% step one pixel, none step more than two; the
#: mean slope over an 8 px window is 13 degrees. A typical peak stands THREE
#: pixels above its neighbouring saddle. Sawtooth peaks at 4-8 px spacing are
#: the default mental image of a pixel-art mountain and they are wrong here:
#: at 320x144 a jagged crest degrades into what looks like dither noise and
#: drags the eye up to the horizon, which is the opposite of what this
#: establishing shot wants.
FAR_CREST = ((0, 31), (4, 30), (12, 35), (27, 29), (40, 29), (49, 31),
             (60, 35), (81, 38), (101, 38), (120, 43), (132, 39), (143, 36),
             (155, 34), (170, 39), (185, 41), (203, 42), (208, 43), (226, 37),
             (247, 42), (262, 36), (273, 37), (289, 41), (299, 39), (319, 41))

#: The near range's crest. range.md §2: mean y 44.7, high 35 at x=27 directly
#: under the far range's highest peak, low 49, and SMOOTHER than the far
#: range -- mean crest step 0.27 px per column against the far range's own.
#: The vertical gap between the two crests averages 6.7 px and widens from
#: about 4 on the left to about 10 on the right. THAT GAP IS THE ENTIRE DEPTH
#: CUE. The lit face's apex at (157, 42) is on this crest.
#:
#: THE x 182-260 RUN IS NOT DEAD FLAT. It was: two control points 40 px
#: apart both at y=47, which drew a ruled line across the one stretch of the
#: near crest the coach does not hide. The bar wanders +/-3 px across
#: x 176-215 -- y 44-45 at x 178-190, y 49-50 at x 200-215 -- and that
#: wander is the only thing telling a viewer the ridge is ground rather than
#: a card. Two points restore it without moving the run's mean.
NEAR_CREST = ((0, 44), (14, 39), (27, 35), (44, 40), (60, 44), (85, 46),
              (110, 45), (130, 44), (145, 44), (157, 42), (170, 45),
              (182, 47), (188, 45), (208, 49), (222, 47), (260, 47),
              (300, 48), (319, 48))


#: The 40-70 px content `FAR_CREST` does not carry, as
#: (wavelength px, amplitude px, phase turns). range.md §2's DFT of the far
#: crest gives 2.9 px at wavelength 320, 2.8 at 107, 1.9 at 160 -- which the
#: polyline's own control points already are -- then 1.3 at 64, 1.0 at 53,
#: and nothing above 0.8 px below 36 px. The polyline carries the three long
#: components and none of the short ones, so drawn straight it measured 78%
#: of columns flat with ONE FLAT RUN 25 COLUMNS LONG against §2's measured
#: 63% / 34% / 1% cadence and flat runs of median 2, max 8. A twenty-five
#: column ruled line is 8% of the frame width, it is the crest the whole sky
#: is cut against, and it was the last mechanical staircase in the region.
#:
#: IT LIVES HERE AND NOT IN `range_` BECAUSE IT IS TWO REGIONS' BUSINESS.
#: `sky` fills down to far_crest(x) and `range_` fills from the same row: a
#: wobble added on the range side and not the sky side tears the seam open a
#: pixel at a time along its whole length. Both regions call this function,
#: so they cannot disagree about where the mountain starts. This is the same
#: treatment `range_.CREST_WANDER` gives the NEAR crest, which that region
#: may do alone precisely because nothing else reads it.
#:
#: Amplitudes are §2's own figures at 64 and 53 and sit under §2's 0.8 px
#: ceiling at 44 and 37. Phases were searched for cadence, not fitted to the
#: bar: §2 measures the crest's amplitude spectrum and says nothing about its
#: phase, so what is reproduced is the character, not the mountain.
#:
#: Measured on the drawn line: 70% of adjacent columns flat, 30% stepping
#: one, no step above one anywhere, mean |step| 0.30 px per column against
#: §2's 0.35, longest flat run 9 columns down from 25, median run 3. The
#: residual 70/30 against 63/34 is the polyline's, not the wander's -- §2's
#: 1% of two-pixel steps needs a slope this spectrum cannot reach without
#: breaking the 0.8 px ceiling, and a sawtooth is the failure §7.4 forbids.
FAR_CREST_WANDER = ((64.0, 1.20, 0.4988),
                    (53.0, 1.00, 0.9211),
                    (44.0, 0.70, 0.8053),
                    (37.0, 0.80, 0.4880))

#: The wandered crest's own bounds. §2 measures the far crest's highest point
#: at y=29 and its lowest at y=43; the wander is allowed one row outside each
#: because clamping it AT the measurement is what produces flat runs -- every
#: column the sum pushes past the limit lands on the same row, and the clamp
#: manufactures exactly the ruled line the wander exists to remove.
FAR_CREST_BOUNDS = (28, 44)


def _crest(points: tuple[tuple[int, int], ...], x: int) -> int:
    """Piecewise-linear through measured control points, rounded to a row.

    Rounding a shallow line is what produces the measured cadence by itself:
    a step, then a flat run of about two, then a step. No noise is added and
    none is wanted -- the silhouette has no high-frequency content at all.
    """
    x = max(0, min(WIDTH - 1, x))
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x <= x1:
            t = (x - x0) / max(1, x1 - x0)
            return int(round(y0 + (y1 - y0) * t))
    return points[-1][1]


def _crest_float(points: tuple[tuple[int, int], ...], x: float) -> float:
    """`_crest` without the rounding, so a wander can be added before it.

    ROUNDED ONCE, AT THE END, AND NEVER TWICE. `range_.CREST_WANDER` records
    what happens otherwise: a continuous offset added to an already-rounded
    row alternates wherever the two disagree by about half a pixel, and the
    line comes out as one-column teeth -- a 2 px sawtooth, which is the one
    thing §7.4 says degrades into dither noise at this resolution.
    """
    x = max(0.0, min(WIDTH - 1.0, x))
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x <= x1:
            t = (x - x0) / max(1, x1 - x0)
            return y0 + (y1 - y0) * t
    return float(points[-1][1])


def far_crest(x: int) -> int:
    """Topmost terrain row at column x. The sky owns this cut; range fills it.

    See FAR_CREST_WANDER: the polyline plus its missing mid-frequency
    content, summed in float and rounded exactly once.
    """
    x = max(0, min(WIDTH - 1, x))
    y = _crest_float(FAR_CREST, x)
    for length, amplitude, phase in FAR_CREST_WANDER:
        y += amplitude * math.sin(math.tau * (x / length + phase))
    low, high = FAR_CREST_BOUNDS
    return int(round(max(float(low), min(float(high), y))))


def near_crest(x: int) -> int:
    """Top of the near range's dark mass at column x."""
    return _crest(NEAR_CREST, x)


#: The warm/cold boundary is the GROUND LINE, not a horizontal. Study §3
#: measures it per column: median y=58, mean 59.9, range 38-97. It rides
#: high on the left (the timber is warm up into the sky) and high on the
#: right (the coach mass is warm to its roofline) and dips lowest in the
#: centre at x=96, y=71. Regions use it as a sanity check, not as a mask.
WARM_BOUNDARY = ((0, 41), (32, 58), (64, 54), (96, 71), (128, 56),
                 (160, 68), (192, 68), (224, 64), (256, 45), (288, 47))


# ---------------------------------------------------------------------------
# 3. LEGACY CONSTANTS -- kept because six other tools read them
# ---------------------------------------------------------------------------

#: The room file's declared horizon. Not a measurement of this drawing --
#: the engine uses it for actor scaling and the room JSON is authoritative.
HORIZON = 58

#: Where the walkable road begins, matching the room file's road_far zone.
ROAD_Y = 96

#: The old whole-frame lighting multiplier. The rebuild does not use a
#: global ambient: the sky is authored as a gradient, the ground as a graded
#: field, and the ONE light in the frame is the lantern pool (§7). Kept at
#: its old value so nothing that reads it changes meaning; nothing in the
#: room01 package consults it.
AMBIENT = 0.86


# ---------------------------------------------------------------------------
# 4. THE DEPTH VALUE LADDER -- and it is a U, not a ramp
# ---------------------------------------------------------------------------
#
# Study §5, measured RIDGE-RELATIVE rather than in horizontal bands, because
# a horizontal rectangle cuts across a ridge that varies from y=29 to y=48
# and reports sky, far range and near range as identical.
#
# Value FALLS from the sky down to the near range (29.1 -> 16.2) and then
# RISES all the way forward to the road (16.2 -> 37.4). THE DARKEST
# STRUCTURAL PLANE IN THE FRAME IS THE NEAR RANGE RIDGE -- not the sky, not
# the ground. This is night logic and it is the opposite of daylight
# atmospheric perspective: distance is the light source, so each successive
# range comes forward as a darker silhouette against the sky glow, and then
# the ground plane takes over as a lit surface and brightens forward.
#
# THE GAPS ARE DELIBERATELY UNEQUAL. Sky -> far range is -9.16, about four
# palette steps, and it is the single hard edge that establishes the whole
# horizon. Everything after it is 2.9 to 5.5, one to two steps. A rebuild
# that spaces its planes evenly -- the natural thing with a ramp and six
# planes -- flattens the horizon and over-separates the near ground.

#: (plane, rows below the local ridge crest, median Y, mean saturation,
#: local 5x5 sd). The last two columns are the other two depth channels:
#: saturation falls forward 0.75 -> 0.42 and texture density rises forward
#: 0.37 -> 7.33, both monotonically. Where value runs out below the valley
#: floor, those two and OCCLUSION carry the separation instead.
DEPTH_LADDER = (
    ("sky above ridge", -7, 29.13, 0.75, 0.37),
    ("far range top", 1, 19.97, 0.75, 0.37),
    ("far range body", 5, 19.55, 0.69, 2.43),
    ("near range", 11, 16.23, 0.58, 4.11),
    ("near range base", 17, 21.75, 0.56, 5.86),
    ("valley floor", 24, 24.60, 0.48, 4.28),
    ("mid ground", 34, 28.92, 0.54, 6.08),
    ("road", None, 37.39, 0.42, 7.33),
)

#: The one plane a rebuild must get below both its neighbours.
DARKEST_PLANE = "near range"

#: The one gap that must stay large. Everything after it is a whisper.
HORIZON_STEP = 9.16

#: Whole-frame targets, study §1 and §7. The most likely failure in the
#: whole rebuild is that the median lands high and the night reads as dusk:
#: a median of 35 instead of 26 is a nine-unit error no single region will
#: flag. Checked at the end of every compose, reported, never auto-corrected.
FRAME_MEDIAN = 26.1
FRAME_P75 = 37.1
FRAME_P90 = 49.9
FRAME_CEILING = 121.9     # 47.8% of white. There is no white in this frame.
FRAME_EMPTY_BAND = (96, 111)   # a hard histogram gap; the peak STEPS to itself


# ---------------------------------------------------------------------------
# 5. THE RESERVED CYCLING BANDS
# ---------------------------------------------------------------------------
#
# Doc 18 gives Room 1 exactly two cycling elements and CLAUDE.md invariant 9
# forbids motion that reads as information. These are the only moving things
# in the frame.
#
# Both bands are DERIVED from the same declaration the engine reads, never
# typed twice: two copies of a palette range is exactly the sort of thing
# that stays right for one commit.
#
# THE SECOND BAND MOVED. The puddles were sky 7-9 (indices 152-154, L 107 /
# 115 / 123) and are now accent_indigo 2-4 (239-241, L 44 / 61 / 74). The
# old band was chosen against the road AS IT WAS COMPOSITED, which sat at
# L 65-85; the rebuilt road sits at L 32-40 and at 152-154 the water would
# have read as chalk lines, 66 L above the measured 50. accent_indigo 2-4
# is the closest fit in the locked palette and is used essentially nowhere
# else -- safe only because the sky is drawn flat at steps 0-1 of the same
# family and never reaches step 2. THE SKY MUST NEVER REACH STEP 2.


def _band(element_id: str, palette: Palette) -> tuple[int, ...]:
    element = next(e for e in cycling.load("stage_road", palette) if e.id == element_id)
    return tuple(element.indices)


_PALETTE = Palette.load()

#: accent_gold steps 4-7. Hob's lantern flame, and nothing else anywhere.
#: L 136 / 156 / 181 / 204 -- brighter than every other entry the frame uses,
#: whose ceiling is 126. Budget: 22-28 px total, all inside x 82-89 /
#: y 85-90. A forty-pixel flame reads as a fault light rather than a lamp.
LAMP_BAND = _band("hobs_lamp", _PALETTE)
LAMP_BOUNDS = (80, 76, 16, 16)          # x 80-95, y 76-91, from the room file

#: accent_indigo steps 2-4. The standing water in the road ruts, and nothing
#: else. Each streak takes a DIFFERENT one of the three in turn: one rotation
#: then shows each streak at a different point in the cycle, which is where
#: the per-puddle phase offset comes from at no extra palette cost.
PUDDLE_BAND = _band("puddles", _PALETTE)
PUDDLE_BOUNDS = (0, 96, 320, 48)        # y 96 and below. Nothing at y 94-95.

RESERVED = frozenset(LAMP_BAND) | frozenset(PUDDLE_BAND)


def keep(index: int) -> bool:
    """True if this index belongs to a cycling band and must not be moved.

    The light pass, the void pass and every dither consult this. A reserved
    index that gets stepped along its ramp by the lighting pass leaves the
    band, and the band is then reserved for pixels that are no longer in it
    -- which still animates, still looks like a lamp, and is exactly the sort
    of thing that is invisible until somebody counts the pixels.
    """
    return index in RESERVED


def keep_at(canvas: IndexedCanvas, x: int, y: int) -> bool:
    """keep(), in the (canvas, x, y) shape lighting.collar and void want."""
    return keep(canvas.get(x, y))


# ---------------------------------------------------------------------------
# 6. THE MATERIAL TABLE, and the WARM / COLD MAP
# ---------------------------------------------------------------------------
#
# Named material -> (family, ramp step). Steps are positions as
# palette.family(name).at(step) takes them; step 0 is the darkest entry.
# Every entry carries the spec section that chose the family and the
# measured luminance it is standing in for.
#
# THE HUE RULE, which is the reason this table exists at all: the lighting
# pass steps a colour along its OWN family ramp and cannot cross hue. So
# every surface the lantern will ever touch -- the whole road plane, the
# fence, the sign, the timber, the boots, the hat brim -- must be authored
# in a WARM family from the start, at its UNLIT value. The lamp brightens
# it; it cannot warm it. And the ruts and puddles must be authored COLD and
# must STAY cold inside the pool: they are 27.9% of the ground and they are
# the reason the road reads as wet rather than as dusty.

MATERIALS: dict[str, tuple[str, int]] = {
    # -- sky. sky.md §4. The worst-served region in the frame: the locked
    #    palette holds exactly two blue-dominant entries below L 40, so the
    #    body and the horizon band are the only two blues available and there
    #    is nothing between them. Chase the relationships, not the absolutes.
    "night_sky": ("accent_indigo", 0),          # L 21.7 against a measured 22.7
    "night_sky_horizon": ("accent_indigo", 1),  # L 35.0; the step to the range is 13.4
    # The rung BETWEEN those two, which the palette does not offer and the
    # region has to build. `sky` was reaching both of these through
    # ctx.palette.family() with the citation in a comment, so temperature()
    # could not classify either -- and accent_teal had no material anywhere in
    # this table, which meant the one saturated cold entry in the palette was
    # invisible to the audit that exists to catch exactly that. Named at the
    # region's request; the choice of entries and the density they are laid at
    # remain sky.md §4's and the region's, not this file's.
    "night_sky_mid": ("grey", 1),               # L 24.5, (24,24,28): blue-leaning
    "night_sky_mid_chroma": ("accent_teal", 0),  # L 24.8, sat 0.75: the chroma bank
    # Stars are WARM, never white, never cool at the bright end. Capped one
    # step below ochre 13 on purpose (sky.md §6.2): the bar ties its brightest
    # star to the lamp and errata 18b protects the lamp's status as the
    # uniquely brightest object in the only night exterior in the game.
    "star_bright": ("umber", 14),               # L 98
    "star_mid": ("dust", 5),                    # L 61
    "star_faint": ("dust", 1),                  # L 33
    # ...and about one star in twenty is COOL, in the mid tiers only.
    # sky.md §5. Six of them. The whole-frame study §7 says there is no cold
    # or neutral star in the frame and it is right about the TIERS -- every
    # star shares a lamp's palette entry -- but the bar still puts a handful
    # of blue-greys in the field, at 52.7 and 61.2, sitting on the warm mid
    # tiers `dust` 4 and 5 at 53.3 and 61.3. Same value, different family:
    # the ONE place in the sky where hue does the work value cannot.
    # `sky` 0 and 1 are the two entries; the region reads them as steps of
    # this material, so all three star tiers are named and none is a naked
    # index. sky.md §4 also offers accent_indigo 2 for faint stars and that
    # one is REFUSED here rather than named: 239 is the first entry of the
    # puddles' reserved band (§5), and a star drawn in it would join the
    # road's cycle.
    "star_cool": ("sky", 0),                    # L 52.7, and step 1 at 61.2

    # -- ranges. range.md §4. The near range must be EXPLICITLY grey 0: left
    #    to a nearest-colour pass, half of it lands on accent_indigo 0 and the
    #    two layers merge into one shapeless mass.
    "far_rock": ("accent_indigo", 0),           # L 21.0 against a measured 20.1
    "near_rock": ("grey", 0),                   # L 16.0 against a measured 13.2
    "near_rock_lit_mid": ("grey", 1),           # L 24.3; the lit face's right flank
    "near_rock_lit": ("grey", 2),               # L 32.3; apex pixels only

    # -- town. town.md §5. The town is a GREY thing standing on a BLUE thing
    #    at nearly the same value, which is why it reads as material rather
    #    than as atmosphere. Author it cold and punch warm holes.
    # The two most-used cool colours in the whole band, per the locked-palette
    # proof, and neither had a name: `town` was stepping accent_indigo
    # directly in _mass_dark and _roof_ink with the citation in a comment.
    # A cited naked family step is still a naked family step -- the audit
    # below cannot see it, temperature() cannot classify it, and the next
    # author to read the table will not know the entries are spoken for.
    "town_mass_dark": ("accent_indigo", 0),     # L 21.0; the mass behind the roofs
    "town_roof_sky": ("accent_indigo", 1),      # L 33.8; roof planes facing the dome
    "town_trough": ("grey", 0),                 # L 16; the darkest band above the road
    "town_wall": ("grey", 1),                   # L 24.5; walls in shade
    "town_wall_lit": ("grey", 2),               # L 32.5
    "town_roof": ("grey", 3),                   # L 40.6; roof highlight stipple
    "town_roof_bright": ("grey", 4),            # L 53.5; and the headframe plume
    "lit_window_dim": ("mud", 6),               # L 44; outermost spill
    "lit_window": ("umber", 10),                # L 69; window body
    "lit_window_bright": ("ochre", 8),          # L 85
    "lit_window_hot": ("ochre", 13),            # L 126 -- THE CEILING OF THE PICTURE

    # -- the ground. road.md §6, hob.md §7. The pool maps to mud almost
    #    exactly: mud.at(18) is L 122.8, the pool core to within a point, and
    #    the ladder runs about one mud step per six luminance points down to
    #    mud.at(3) at ambient. Nine steps, eight visible bands.
    "dry_mud": ("mud", 6),                      # L 44; mid road crests
    "wet_mud": ("umber", 4),                    # L 29; near and right, cooler
    "lit_mud": ("pine_fresh", 4),               # L 63; the lit fringe
    "pool_core": ("mud", 18),                   # L 123; x 79-93, y 104-110 only
    "road_ambient": ("mud", 3),                 # L 27; the road just outside the pool
    "verge_mud": ("grey", 0),                   # L 16; x < 60, near-black
    # -- the mid-ground plane, and it is COLD. §8's ladder puts the valley
    #    floor and the mid-ground between the near range and the road, and
    #    they take the cold side of the ground line: measured on the bar's
    #    open ground at x 105-135, rows 70-81 run L 29-40 at warmth -19 to
    #    -20, and the backdrop above the team at x 196-233 runs L 13-29 at
    #    warmth -21 to 0. Authored warm it is the same hue AND the same value
    #    as the hide, the rails and the coach standing on it, and §9's whole
    #    separation scheme -- 40 units of hue across a 7-unit value step --
    #    has nothing left to work with.
    #
    #    TWO ENTRIES, DITHERED AT VALUE. dither.py's rule is two adjacent
    #    steps of one ramp, and the reason is speckle: mixing distant steps
    #    scatters. These two are mixed at MATCHED VALUE and differ only in
    #    hue -- grey 2 at L 32.3 against accent_indigo 1 at L 33.8, one and a
    #    half luminance apart -- which is the one case the rule is not about.
    #    The palette holds exactly one blue-dominant entry below L 40 and it
    #    is accent_indigo 0; there is no single index anywhere in the locked
    #    256 at L 30 and warmth -19, so the blueness has to be mixed or given
    #    up. The pairing is EXPLICIT rather than nearest-in-family, because
    #    nearest-in-family for grey 3 is accent_indigo 2 -- the first entry
    #    of the puddles' reserved band (§5).
    "valley_floor": ("grey", 1),                # L 24.3; the neutral half
    "valley_floor_blue": ("accent_indigo", 0),  # L 21.0; the blue half
    "stone": ("grey", 2),                       # sat 0.20 against mud's 0.48
    "stone_top": ("grey", 4),                   # the 1 px pale top edge IS the stone
    # standing_water has no entry here on purpose. It is PUDDLE_BAND and
    # nothing but PUDDLE_BAND -- see §5.

    # -- timber. left_yard.md §4: timber is not one family. The family
    #    carries the plane, the step carries the light.
    "timber_far": ("pine_weathered", 0),        # L 21; distant and shaded
    "timber_body": ("pine_weathered", 1),       # L 29; the lumber mass
    "timber_cap": ("grey", 3),                  # L 41; 1 px moonlit cap per tread
    "sign_board": ("umber", 10),                # L 69; board face, mean 51 to 67 at the top
    "sign_board_lit": ("dust", 8),              # L 82; its right end, under the lamp
    "sign_letter": ("mud", 3),                  # L 27; glyphs ride the board's own ramp
    "shadow_slot": ("void", 0),                 # L 0; x 28-29 measures 1.4

    # -- the rails. rail.md §5: HORIZONTAL TIMBER IS COOL, VERTICAL TIMBER IS
    #    WARM. A bar's top face catches the sky; a post's left face catches
    #    the lantern. Measured saturations: bar highlights 0.07-0.47, post
    #    highlights 0.61-0.62. Collapse the split and the region goes flat
    #    even at correct values.
    "weathered_rail": ("pine_weathered", 6),    # L 59; the flattest colour in the region
    "rail_highlight": ("dust", 8),              # L 82; seven pixels, all on row y=82
    "rail_shadow": ("mud", 1),                  # L 18; one row under each bar
    "post_lit": ("pine_fresh", 5),              # L 70; warm, sat 0.62
    "post_mid": ("pine_fresh", 2),              # L 44
    "post_dark": ("umber", 3),                  # L 25; doing as much work as the light
    "back_post_lit": ("dust", 3),               # L 46; COOL family -- aerial perspective
    "dark_pocket": ("umber", 1),                # L 14; the ground both bars are read against

    # -- the coach. coach.md §4.
    "coach_body": ("mud", 3),                   # L 27; front panels, Lmed 31
    "coach_body_rear": ("mud", 0),              # L 13; the rear quarter goes near-black
    "coach_roof_rail": ("dust", 6),             # L 66; the brightest row in the coach
    "coach_cargo": ("pine_fresh", 1),           # L 37; sacking and canvas
    "coach_iron": ("grey", 2),                  # L 32; tyres and hardware, COOL
    "coach_void": ("void", 0),                  # the doorway. 60% of it, Lmed 2.6
    "brass": ("umber", 8),                      # L 56; buckle, lock, studs
    "coach_lamp": ("ochre", 13),                # L 126 -- and it STOPS there
    "coach_lamp_ring": ("ochre", 8),            # L 85; one ring, then nothing

    # -- the team. team.md §6. Twenty indices is enough for three animals.
    "horse_hide": ("pine_fresh", 1),            # L 37; the warm chestnut
    "horse_hide_mid": ("mud", 3),               # L 27; interleaved 50/50 with the above
    "horse_hide_shadow": ("umber", 0),          # L 9; the far animal, in shadow
    "horse_black": ("void", 0),                 # crest, tail, chest shadow
    "horse_mane": ("pine_fresh", 3),            # L 54; six strokes, pitch 2-4
    "horse_rim": ("grey", 3),                   # L 41; ONE COOL ROW on a warm animal
    "bridle_spark": ("ochre", 8),               # L 85; three pixels, the near horse only

    # -- Hob. hob.md §7.
    "hob_coat": ("grey", 0),                    # L 16; the far side, which must MELT
    "hob_coat_lit": ("mud", 8),                 # L 55; the lamp-side rim, the reading edge
    "hob_brim": ("mud", 5),                     # L 39; lit tip only; the far tip is L 4
    "hob_face": ("ochre", 10),                  # L 102; five pixels reach ochre 12
    "hob_collar": ("dust", 8),                  # L 82; ONE pixel, the only cool-neutral on him
    # The lantern's hardware sits in the same family as its flame, one band
    # BELOW the reserve, so the object holds together and only the flame moves.
    "lamp_hardware": ("accent_gold", 2),        # L 90; hood, bail, frame, base plate
    "lamp_glass": ("accent_gold", 3),           # L 113; the ceiling below the reserve
}

#: Anything the lantern warms must be authored warm FROM THE START.
WARM_MATERIALS = frozenset({
    "star_bright", "star_mid", "star_faint",
    "lit_window_dim", "lit_window", "lit_window_bright", "lit_window_hot",
    "dry_mud", "wet_mud", "lit_mud", "pool_core", "road_ambient",
    "timber_far", "timber_body", "sign_board", "sign_board_lit", "sign_letter",
    "rail_shadow", "post_lit", "post_mid", "post_dark", "dark_pocket",
    "coach_body", "coach_body_rear", "coach_cargo", "brass",
    "coach_lamp", "coach_lamp_ring",
    "horse_hide", "horse_hide_mid", "horse_hide_shadow", "horse_mane",
    "bridle_spark",
    "hob_coat_lit", "hob_brim", "hob_face",
    "lamp_hardware", "lamp_glass",
})

#: 56.8% of the frame, and 27.9% of the GROUND. The cold below the boundary
#: is load-bearing: it is the wet ruts and Hob's coat, sitting 10.5 Y below
#: the warm ground around them, pooled in components of 30 px and up. A
#: lighting pass that lifts them along a warm ramp destroys the single most
#: characterful thing about the foreground.
COLD_MATERIALS = frozenset({
    "night_sky", "night_sky_horizon",
    "night_sky_mid", "night_sky_mid_chroma",
    # The cold counterpart to the three warm star tiers. WARM_MATERIALS is
    # not the whole star field: about one in twenty is a blue-grey at the
    # same value as the warm mid tier it sits beside. See MATERIALS.
    "star_cool",
    "far_rock", "near_rock", "near_rock_lit_mid", "near_rock_lit",
    "town_mass_dark", "town_roof_sky",
    "town_trough", "town_wall", "town_wall_lit", "town_roof", "town_roof_bright",
    "verge_mud", "valley_floor", "valley_floor_blue",
    "stone", "stone_top", "timber_cap",
    "weathered_rail", "rail_highlight", "back_post_lit",
    # The roof rail is a horizontal top surface and the only light reaching it
    # is the sky, exactly like the hitching rail's top face two regions left --
    # same family, same reason. Coach spec: it is one row at y=49 falling from
    # L 82 to L 26 along its run, and it is half of what separates the coach
    # from the night behind it.
    "coach_roof_rail",
    "coach_iron", "horse_rim", "hob_coat", "hob_collar",
})

#: Neither, and deliberately: void is the absence of both. Study §1 -- true
#: near-black is 1.73% of the frame and its largest pool is 136 px, the
#: coach doorway. Do not spend black anywhere else.
NEUTRAL_MATERIALS = frozenset({"shadow_slot", "coach_void", "horse_black"})


def temperature(material: str) -> str:
    if material in WARM_MATERIALS:
        return "warm"
    if material in COLD_MATERIALS:
        return "cold"
    return "neutral"


def _audit_material_table() -> None:
    """Every material is in exactly one temperature set. Checked at import.

    Cheap, and it catches the one mistake this table invites: adding a
    material and forgetting to say which family it belongs to, which is
    silent until the lighting pass turns a cold surface warm.
    """
    for name in MATERIALS:
        buckets = sum(name in group for group in
                      (WARM_MATERIALS, COLD_MATERIALS, NEUTRAL_MATERIALS))
        if buckets != 1:
            raise RuntimeError(
                f"material {name!r} is in {buckets} temperature sets; must be 1")
    for group in (WARM_MATERIALS, COLD_MATERIALS, NEUTRAL_MATERIALS):
        for name in group:
            if name not in MATERIALS:
                raise RuntimeError(f"{name!r} has a temperature but no material entry")


_audit_material_table()


# ---------------------------------------------------------------------------
# 7. THE LIGHT -- one source with a pool, and a tail of bare dots
# ---------------------------------------------------------------------------
#
# Study §2. The emitters SHARE PALETTE ENTRIES: the lantern flame, the pool
# core, the gantry lamp, one coach lamp and a handful of town windows are all
# the same colour. Peak luminance therefore cannot rank them. What ranks them
# is integrated luminous excess:
#
#     lantern 55.2%   town windows 27.1%   stars 5.8%   gantry lamp 4.3%
#     coach door lamp 4.2%   coach roof lamp 2.1%   coach side lamp 1.4%
#
# THE LANTERN OUTWEIGHS EVERYTHING ELSE COMBINED, and it wins ONLY because it
# has a pool. Take the pool away and it drops to roughly the gantry lamp's
# weight. So: one source has a falloff, and every other light in this frame
# is a bare dot. Town windows fit a bloom radius of 0.69 px -- no halo at
# all. No non-lantern source may have a fitted bloom over 4 px.


@dataclass(frozen=True)
class Source:
    """A light. `pool` is True for the one that lights the ground."""

    name: str
    x: int
    y: int
    #: Radius at which the airborne glow has died. hob.md §4: the lantern's
    #: own halo is back to backdrop ambient by r = 8-9, and there is NOTHING
    #: above the hand -- the lamp throws its light down, onto the road, and
    #: barely into the night at all.
    bloom: float
    #: Share of the frame's integrated luminous excess. Study §2.
    share: float
    pool: bool = False


#: hob.md §2 item 16 and §4: the flame's hot core. The pool is centred on
#: the ground point directly below it, NOT on the man.
FLAME_CENTRE = (85, 87)

SOURCES: tuple[Source, ...] = (
    Source("lantern", 85, 87, bloom=8.0, share=0.552, pool=True),
    Source("gantry lamp", 77, 67, bloom=2.7, share=0.043),
    Source("coach door lamp", 242, 69, bloom=3.5, share=0.042),
    Source("coach roof lamp", 230, 49, bloom=2.0, share=0.021),
    Source("coach side lamp", 261, 66, bloom=1.5, share=0.014),
    Source("coach side lamp", 275, 65, bloom=1.5, share=0.014),
)

# -- the pool, fitted. hob.md §5, and it is the region's most important
#    number set. CENTRED ON THE LAMP, fifteen pixels left of his feet.
#    Centre it on him and he appears to be glowing, which is both wrong and
#    much worse.

POOL_CENTRE = (86, 107)
#: Horizontal-to-vertical, measured consistently across six contours. A
#: circular pool turns the road into a vertical wall.
POOL_ASPECT = 2.4
#: The road just outside the pool.
#:
#: LEFT AT 27.0, AND TESTED. §7 above has re-fitted the plane this sits on to
#: 43.5 at the pool's own rows, which makes this fit's ambient 16 L below its
#: own floor, and `pool_excess` clips to zero as soon as the absolute falls
#: under the plane -- so on paper the whole outer shoulder is being thrown
#: away. It is not: `road`'s §4.2 fit is an EXCESS and its horizontal
#: half-distance is 45 px against this fit's 15, so the broad shoulder the
#: bar has out to x=140 is already drawn, by the region, before this pass
#: runs. Raising the ambient to meet the plane adds it a second time.
#: Measured over x 104-180, y 104-120: +4.1 at 27, +5.1 at 32, +6.7 at 37,
#: +9.7 at 43. Recorded because the argument for raising it is a good one
#: and the next reader will make it again.
POOL_AMBIENT = 27.0
POOL_EXCESS = 97.0        # peak above ambient
POOL_HALF = 6.2           # the excess HALVES every 6.2 rho-units
POOL_PLATEAU_RHO = 3.0    # clamped flat inside this
POOL_PLATEAU_L = 123.0
#: Full extent to ambient, hob.md §5: 76 x 27 px.
POOL_REACH = (50, 94, 73, 27)


def pool_rho(x: float, y: float) -> float:
    """The pool's elliptical radius at a point. hob.md §5."""
    dx = (x - POOL_CENTRE[0]) / POOL_ASPECT
    dy = y - POOL_CENTRE[1]
    return math.hypot(dx, dy)


def pool_luminance(x: float, y: float) -> float:
    """L(rho) = 27 + 97 / (1 + (rho / 6.2)^2), flat at 123 inside rho 3.

    Fitted over the ground plane with a linear road baseline removed;
    residual under 3 L across rho 3 to 11. Freeing the exponent gives
    p = 1.79 -- INVERSE-SQUARE WITHIN THE NOISE.

    Fitted in VALUE SPACE, not linear light: both fit about equally well,
    but in value space the exponent lands on 1.79 and in linear light it
    needs 2.75. The artist stepped palette values, which is exactly what our
    lighting pass does. So this number is a ramp position, not a radiance.
    """
    rho = pool_rho(x, y)
    if rho <= POOL_PLATEAU_RHO:
        return POOL_PLATEAU_L
    return POOL_AMBIENT + POOL_EXCESS / (1.0 + (rho / POOL_HALF) ** 2)


#: road.md §4.2's hard left cut. The pool is at full strength right of the
#: sign post and gone by the time it clears it; left of the post it drops
#: 25-38 L within 15 px. Lived in `lightpass` and, separately, in `road`.
#:
#: AND IT SHEARS RIGHT AS IT COMES FORWARD, because the thing making it is a
#: POST STANDING BETWEEN THE LAMP AND THE NEAR GROUND, and the shadow of a
#: near-vertical object standing in a low light widens toward the viewer.
#: Held as a column at x=50-62 it was right at the pool's own rows and wrong
#: below them: measured against the re-fitted plane the bar runs -1 to -9 at
#: x 62-74 by y=111 and -4 to -22 at x 44-74 by y=116, where an x-only cut
#: was still handing those pixels +15 to +29. That is the residual `road`
#: reported as "§4.2's own excess table goes NEGATIVE there and no ellipse
#: centred at POOL_CENTRE can produce it" -- it is not a fault in the
#: ellipse, it is an occluder the contract had not declared.
POOL_CUT_FULL_X = 62.0
POOL_CUT_DEAD_X = 50.0
#: The row the shear starts from, the columns per row it opens at, and WHERE
#: IT STOPS. Fitted to the dead line's own position, read off the bar's
#: excess field: x 50 at y 106, x 64 at y 111, x 74 at y 116, x 76 at y 121,
#: x 72 at y 126. It opens for about six rows and then holds.
#:
#: THE CAP IS NOT A DETAIL. Uncapped at 2 px/row the dead line reaches x=94
#: by y=126 and cuts the pool's own near edge off: the bar has +12 to +19
#: there, directly in front of the lamp, and the block diff went to -16
#: across x 80-103. A shadow that keeps widening forever is a wedge, and the
#: thing casting this one is eight px wide.
POOL_CUT_SHEAR_FROM_Y = 104.0
POOL_CUT_SHEAR = 2.0
POOL_CUT_SHEAR_MAX = 26.0

#: THE POOL HAS A TOP EDGE AND THE ELLIPSE DOES NOT GIVE IT ONE.
#:
#: The rows above the road's near plane are the valley floor BEHIND the road,
#: not the road plane, and the lamp does not reach them: measured on the bar
#: at columns clear of Hob and of the lantern, rows 92-96 are cold (warmth
#: -20 to 0) at L 23-29 and the warm lit plane does not begin until y 99-100.
#: The ellipse, which knows only screen rows, was lighting them anyway, and
#: two authors reported the same band independently -- hob's "the biggest
#: single error left in my rect", left_yard's "the pool is reaching about
#: eight rows too high and too bright at its left end".
#:
#: It is a knee rather than a step: quadratic from dead at y=92 to full at
#: y=102, which lands +7 / +18 / +36 / +64 at y 96 / 98 / 100 / 102 against a
#: measured +6 / +18 / +40 / +58. A hard step would put a ruled horizontal
#: line across the brightest part of the frame, which is the one thing §9 of
#: road.md counts as a hard edge and does not have.
POOL_TOP_DEAD_Y = 92.0
POOL_TOP_FULL_Y = 102.0


def pool_excess(x: float, y: float, drift: float = 0.0) -> float:
    """WHAT THE LIGHTING PASS ADDS AT A GROUND PIXEL. One number, one place.

    THIS FUNCTION EXISTS BECAUSE TWO REGIONS READ THE SAME CONSTANT AND MEANT
    DIFFERENT THINGS BY IT, which is the failure mode a shared contract is
    supposed to make impossible and this one did not.

    `pool_luminance` above is hob.md §5's fit and it is an ABSOLUTE ground
    luminance -- L = 27 + 97/(1+(rho/6.2)^2) -- because that is what the
    lamp's author needed and what the reference was measured as. But the
    lighting pass ADDS, and by the time it runs `road` has already authored
    the same pixels at road.md §4.1's depth model, which puts the open road
    at 48 at the top of the band and 34 at the bottom edge. Adding 97 to a
    road already at 44 reaches 141 where the reference reaches 122; road.md
    §4.2 fits the same light as an excess and peaks at +51, not +97.

    Measured on the composite before this function existed, the pool was
    +27 to +37 L over the bar along its whole upper edge (x 76-95, y 94-99)
    and its core was 17 L SHORT, because the fringe was double-counted and
    the core then saturated against the ceiling. Both errors are the same
    error: an absolute used as an increment.

    So the increment is derived rather than declared -- the absolute the
    reference was fitted at, less the value the road is already authored at,
    at that row. Nothing is added where the road already stands above the
    fit, which is what "the pool has an edge" means in a frame whose road is
    lit from behind as well.

    AND THE PER-PIXEL TEXTURE SURVIVES, which the alternative loses. Lifting
    each pixel TO the absolute would flatten every rut trough inside the pool
    to one plateau; subtracting the row's MODEL and adding the difference
    keeps each pixel's own deviation from that model -- §3.5's two-step rut
    amplitude, §9's grain, §2's scatter -- intact and simply lit.
    """
    excess = pool_luminance(x - drift, y) - road_luminance(y)
    if excess <= 0.0:
        return 0.0
    # The top edge, above the road's near plane. See POOL_TOP_DEAD_Y.
    if y < POOL_TOP_FULL_Y:
        if y <= POOL_TOP_DEAD_Y:
            return 0.0
        walk = (y - POOL_TOP_DEAD_Y) / (POOL_TOP_FULL_Y - POOL_TOP_DEAD_Y)
        excess *= walk * walk
    # The post's cut, sheared right as it comes forward. See POOL_CUT_SHEAR.
    shear = min(POOL_CUT_SHEAR_MAX,
                POOL_CUT_SHEAR * max(0.0, y - POOL_CUT_SHEAR_FROM_Y))
    dead = POOL_CUT_DEAD_X + shear + drift
    full = POOL_CUT_FULL_X + shear + drift
    if x < full:
        if x <= dead:
            return 0.0
        excess *= (x - dead) / (full - dead)
    return excess


# -- the road's own unlit value field.
#
#    RE-FITTED, AND IT IS THE LARGEST SINGLE CORRECTION IN THE LOWER HALF OF
#    THE FRAME. This was road.md §4.1's single line, L(y) = 75.4 - 0.291y,
#    stated as "the road gets darker as it comes toward the viewer" with a
#    total fall of 10.8 L. Re-measured on the composite's own terms -- median
#    luminance per row over the three genuinely open, lamp-free column bands
#    x 145-175, x 240-268 and x 286-302 -- the bar does something else
#    entirely:
#
#        y  88-98   flat at 23.0        the far end of the plane, in shadow
#        y  99-103  climbs 23 -> 43     a five-row shoulder
#        y 104-143  43.5 falling to 36.6 at -0.178/row
#
#    §4.1's own note says it was measured over x 175-300, and rows 94-105 of
#    that band are the team's legs, the strongbox and the coach's
#    undercarriage rather than mud -- which is how a rising shoulder got
#    fitted as a falling line. The old model was 25 L HOT at y=94 and about
#    right from y=115 down, and three region authors reported the same error
#    from three different rects without being able to reach it: coach's
#    "+12 to +28 everywhere under and right of the coach", left_yard's
#    "x 56-87 y 100-121 runs +24 to +30 over the bar", team's "take the road
#    under the team down about 15 L".
#
#    IT IS STILL A FIT, NOT A TABLE. Three segments and four constants, the
#    same shape the sky's gradient is declared in at §2. Max residual against
#    the measured profile is 4.8 L and the mean is 1.4, against 25.
#
#    AND IT IS READ TWICE. `road` authors the surface from it and
#    `pool_excess` below subtracts it to turn hob.md §5's absolute into an
#    increment, so both the ground and the light standing on it move
#    together. That is the whole reason this number is in this file.

ROAD_DEPTH_FAR_L = 23.0        # rows at and above the shoulder's top
ROAD_SHOULDER_ROWS = (98, 104)  # the climb, exclusive of the flat above it
ROAD_DEPTH_A = 62.07           # the tail, L = A - B*y, least squares y 104-143
ROAD_DEPTH_B = 0.178


def road_luminance(y: float) -> float:
    """The ground plane's unlit value at a row. Three segments, see above."""
    top, base = ROAD_SHOULDER_ROWS
    if y <= top:
        return ROAD_DEPTH_FAR_L
    near = ROAD_DEPTH_A - ROAD_DEPTH_B * base
    if y >= base:
        return ROAD_DEPTH_A - ROAD_DEPTH_B * y
    walk = (y - top) / float(base - top)
    return ROAD_DEPTH_FAR_L + (near - ROAD_DEPTH_FAR_L) * walk


# ---------------------------------------------------------------------------
# 8. ground_y(x) -- so nine regions stand on the same earth
# ---------------------------------------------------------------------------
#
# Measured contacts, each from its own spec, all on the NEAR RANK -- the row
# an object standing on the near edge of the traffic lane meets the ground:
#
#   x=0    y=102  left_yard.md §2.14, base shadow band rows 92-99 rising to
#                 the foreground shade at 115
#   x=50   y=104  left_yard.md §2.11, the sign post's foot dissolving at 118
#                 with its contact around 104
#   x=101  y=106  hob.md §2.10k, both boots bottom out at y=106
#   x=127  y=104  rail.md §2.5, the near-left post's base and contact
#   x=153  y=103  rail.md §2.6, the right post's base, one row higher
#   x=196  y=104  team.md §3.19 hoof 6, the nearest foot in that region
#   x=228  y=106  coach.md §2.25, the strongbox sits on the road at y=106
#   x=278  y=107  coach.md §2.19e, the rear wheel's contact at y=107
#
# It is NOT monotone, and that is measured rather than sloppy: the hitching
# rail stands two or three pixels further back than Hob does, so its feet sit
# higher. The wobble is the composition, not noise.
#
# WHAT THIS FUNCTION IS NOT. A ground plane's y depends on DISTANCE, not on
# x, so one curve can only describe one depth rank. Anything set back sits
# higher and its own region declares it: the team has two ranks 5 px apart,
# the coach stands at an angle so its front wheel contacts at y=98 while its
# rear contacts at 107, and the back fence's feet are eight rows above the
# near fence's. Use ground_y for things standing on the near rank. For
# anything else, use depth_scale.

GROUND_LINE = ((0, 102), (50, 104), (101, 106), (127, 104), (153, 103),
               (196, 104), (228, 106), (278, 107), (319, 110))


def ground_y(x: int) -> int:
    """The row an object standing on the near rank of the road meets it."""
    x = max(0, min(WIDTH - 1, x))
    for (x0, y0), (x1, y1) in zip(GROUND_LINE, GROUND_LINE[1:]):
        if x <= x1:
            t = (x - x0) / max(1, x1 - x0)
            return int(round(y0 + (y1 - y0) * t))
    return GROUND_LINE[-1][1]


def depth_scale(y: float) -> float:
    """How near a ground row is, 0 at the horizon and 1 at the bottom edge.

    road.md §3.3: horizontal spacing between two ruts at row y is
    proportional to (y - 82). Everything that recedes on this ground plane
    -- rut spacing, scrub size, grain wavelength -- scales with this and
    nothing else, so that nine regions recede at the same rate.
    """
    return max(0.0, (y - GROUND_HORIZON_Y) / (HEIGHT - 1 - GROUND_HORIZON_Y))


# ---------------------------------------------------------------------------
# 9. NAMED ANCHORS -- every rect and point a region needs from a neighbour
# ---------------------------------------------------------------------------
#
# Rects are (x, y, width, height), inclusive of the measured bbox, in native
# coordinates. Points are (x, y). Every one is quoted from a region spec and
# the citation is beside it. A region may draw outside its own rect -- the
# pool is 76 px wide and leaves the hob rect on both sides -- but it may not
# move an anchor its neighbour also reads.

# -- left_yard.md §2 --------------------------------------------------------
SIGN_BOARD = (30, 61, 45, 19)          # outer footprint; lit face x 31-73, y 62-78
SIGN_BOARD_FACE = (31, 62, 43, 17)     # 43 x 17, whole-board mean L 50.9
SIGN_LINE_1 = (33, 65, 38, 6)          # CONSOLATION, 11 caps, pitch 3.45, cap 6
SIGN_LINE_2 = (42, 73, 20, 4)          # 2 MILES, pitch 2.9, cap 4, never legible
GANTRY_BEAM = (29, 54, 54, 3)          # dark row at 54 over two lit rows 55-56
GANTRY_LAMP = (74, 63, 7, 10)          # body; hot core x 76-79, y 65-70, 12 px
GANTRY_LAMP_CORE = (77, 67)            # study §2.4
SIGN_CHAIN_LEFT = 42                   # 1 px, y 57-61, L 9.1 -- the darkest sustained
SIGN_CHAIN_RIGHT = 65                  # 1-2 px at x 65-66
LANTERN_HOOK = 76                      # 1 px, y 57-61
SIGN_POST = (50, 78, 7, 41)            # x 50-56, y 78-118; lit face x 55-56 at L 45-85
TIMBER_MASS = (0, 42, 25, 55)          # x 0-24, y 42-96, plus posts to y 122
SHADOW_SLOT = (25, 56, 5, 41)          # x 25-29; columns 28-29 fall to L 1.4
CORRAL_RAIL_ROWS = (81, 85, 89, 92)    # four 1 px lit edges, x 57-68, 4 px pitch
CORRAL_POST = (70, 78, 3, 22)          # capped; THE PANEL ENDS HERE, it does not run on
CRATE_UPPER = (42, 84, 7, 12)          # lit edge y=84 only
CRATE_LOWER = (33, 85, 9, 11)
OPEN_BARREL = (38, 95, 11, 9)
PLANK_LID = (30, 103, 13, 4)
SMALL_KEG = (28, 111, 9, 6)
#: Centre + radii; TYRE ARC ONLY, x 12-21.
#:
#: RECONCILED to the arc left_yard fitted to the bar. This constant said
#: (23, 104) and left_yard.md's fit says (26, 103) -- three pixels apart, so
#: the region drew the fit and `_void_pools` protected a box three pixels
#: left of it, which is the exact shape of bug that pass exists to prevent:
#: the far wheel is "the only evidence there are two wheels" and a shadow
#: pool aligned to the wrong centre eats its right-hand columns. The fit
#: wins, because it is a measurement and this was a guess.
WAGON_WHEEL_FAR = (26, 103, 11, 11)
WAGON_WHEEL_NEAR = (28, 103, 9, 10)    # centre + rx, ry; warm rim, dark disc

# -- hob.md §2 --------------------------------------------------------------
HOB = (92, 71, 17, 36)                 # 17 wide, 36 tall, and he is unremarkable
HOB_HAT = (95, 71, 10, 4)              # crown 97-102 at 71-72, brim 95-104 at 73-74
HOB_FACE = (96, 74, 7, 6)              # 7 x 6, five pixels at the top value
HOB_COAT = (92, 80, 17, 20)            # shoulders 12 px at y=80, 17 px by y=89
HOB_COAT_OPENING = 99                  # x=99, y 84-91, flaring to x 98-100 by the hem
HOB_LEGS = (95, 100, 13, 7)            # trousers and boots; both bottom out at y=106
HOB_LIT_WEDGE = (99, 100, 4, 6)        # the light BETWEEN his legs. Five top-value px.
HOB_CONTACT_ROW = 106                  # one row, x 94-108. There is no other shadow.
HOB_OCCLUSION_NOTCH = (108, 100, 8, 7) # a subtraction from the pool, not a painted shape
HOB_HAND_BAIL = (84, 78, 4, 4)         # bare skin, above the lantern and above the shoulder
HOB_SLEEVE = (88, 81, 6, 4)            # six pixels joining the man to the lamp
LANTERN_BAIL = (85, 81, 2, 2)          # two pixels of wire
LANTERN_HOOD = (83, 82, 6, 3)
LANTERN_GLOBE = (82, 85, 8, 5)
LANTERN_BASE = (82, 90, 8, 3)          # row 92 must be UNRESERVED gold: bounds end at 91
LANTERN_FLAME = (83, 86, 5, 4)         # the reserved band lives here and nowhere else

# -- rail.md §2 -------------------------------------------------------------
BACK_FENCE_RAIL_Y = 82                 # a single pixel row, left edge to x=124
BACK_FENCE_RAIL_2 = (117, 86, 8, 2)
BACK_FENCE_POST = (114, 79, 3, 18)     # lit/mid/dark; base at y=96, EIGHT rows higher
RAIL_NEAR_POST = (126, 73, 4, 32)      # changes polarity at the bar. Base y=104.
RAIL_RIGHT_POST = (152, 81, 4, 23)     # two lit columns; cut off by the bar at y=84
RAIL_TOP_BAR = (125, 81, 29, 4)        # highlight is row 82 ALONE. Dies at x=154.
RAIL_LOWER_BAR = (125, 87, 39, 3)      # highlight row 88; survives to x=163
RAIL_CRATE = (136, 71, 13, 9)          # plus its contact shadow row at y=80
RAIL_BENCH = (122, 90, 42, 5)
RAIL_BUCKET = (138, 95, 13, 8)
RAIL_BRACKET = (122, 91, 5, 5)
RAIL_DARK_POCKET = (128, 89, 44, 16)   # mean L 28.4. Draw it BEFORE anything sits in it.

# -- team.md §3 -------------------------------------------------------------
HORSE_C_HEAD = (153, 69, 7, 13)        # 7 x 13. The head is HALF the animal's height.
HORSE_C_EAR = (157, 69)                # two pixels, and the top of the whole group
HORSE_C_CREST = (160, 69, 12, 4)       # near-black bar, -26 L against sky: the hardest edge
HORSE_C_TOPLINE_Y = 70                 # flat from x 160 to x 193
SKY_WEDGE_UNDER_JAW = (159, 77, 6, 5)  # six cool pixels; a lowered head, not a thick neck
HORSE_B_HEAD = (161, 82, 10, 14)
HORSE_B_BRIDLE = (164, 85, 3, 4)       # peak L 61 -- one step dimmer, on purpose
HORSE_A_HEAD = (171, 82, 10, 14)
HORSE_A_BRIDLE = (172, 82, 5, 7)       # peak L 85. The brightest thing in the team.
HORSE_A_TOPLINE_Y = 75                 # 24 px, dead flat, and it does not sag
HORSE_A_BACK = (194, 75, 25, 2)
HORSE_A_BARREL = (194, 76, 25, 11)     # depth 11 against a leg of 16 -- that ratio is the horse
HORSE_A_CROUP = (218, 76, 4, 9)
HORSE_TAIL = (219, 78, 2, 19)          # the ONLY tail. Do not add a second.
HORSE_CHEST_SHADOW = (181, 84, 8, 8)   # Lmed 8.6, the darkest mass in the region
HORSE_UNDERLINE = (202, 86, 19, 3)     # straight; the curve is at the front end only
#: Nine ground contacts on TWO ground lines 5 px apart. Two horses can show
#: at most eight. (x span start, x span end, ground y).
HOOVES = ((172, 175, 100), (177, 181, 100), (182, 185, 103), (186, 190, 99),
          (191, 195, 103), (195, 198, 104), (201, 206, 101), (211, 214, 101),
          (215, 218, 102))
POLE_ROW = (195, 85, 18)               # x 195-212 at y=85. The only straight line inside.
TERRET = (195, 73, 2, 4)               # the only cool object standing above the near back
TRACE_1 = ((196, 71), (219, 59))       # 27 degrees
TRACE_2 = ((206, 71), (219, 61))       # 38 degrees; they converge at x 219-220
TRACE_CONVERGE = (219, 60)
#: ONE pooled shadow. No per-leg shadows.
#:
#: RECONCILED to y=90. This said (178, 99, 45, 7) -- the pool's own measured
#: bbox -- and `team` drew from a local SHADOW_TOP of 90, so the shared
#: anchor and the drawing disagreed by five rows and only the region knew.
#: team.md's measurement is the one that decides: the ground between the legs
#: at x 196-215 runs L 20-31 from y=90 down, against an unlit road of 47-50
#: in the same columns, and nine legs have to be told apart against it. The
#: rect now says what is drawn; the bottom edge is unchanged at y=105.
TEAM_SHADOW = (178, 90, 45, 16)

# -- coach.md §2 ------------------------------------------------------------
COACH_ROOF_RAIL = (239, 49, 41, 1)     # ONE row. L 82 at x 239-240 falling to 26 at 279.
COACH_ROOF_DECK = (238, 50, 45, 3)
COACH_CORNICE_SHADOW = (238, 53, 45, 1)   # row mean 16.9 -- the darkest upper row
COACH_BELT_MOULDING = (234, 54, 47, 1)
COACH_CARGO = (239, 43, 54, 7)
COACH_BLACK_TRUNK = (252, 44, 8, 5)    # a NEGATIVE SHAPE bitten out of the skyline
COACH_UPPER_PANEL = (236, 54, 48, 5)
COACH_WINDOW_BAND = (236, 59, 48, 4)   # rows 59-62, the darkest body band
COACH_DOORWAY = (254, 59, 9, 27)       # Lmed 2.6; left edge dead vertical for 22 rows
COACH_DOOR_LEAF = (263, 56, 15, 31)
COACH_DOOR_WINDOW = (266, 58, 12, 15)  # a plain rectangle at this size
COACH_FRONT_QUARTER = (239, 58, 11, 19)
COACH_FRONT_POST = (238, 57, 1, 23)    # one pixel wide, and the second most important vertical
COACH_DOOR_PILLAR = (250, 57, 4, 29)
COACH_REAR_QUARTER = (278, 58, 7, 27)  # Lmed 12.1, the darkest large panel
COACH_BOOT = (286, 56, 20, 23)
COACH_BOOT_SHELF = (283, 78, 23, 1)
COACH_BUCKLE = (298, 65)               # ONE pixel at L 63, and that is the whole strap set
COACH_FRONT_BOOT = (214, 59, 25, 22)   # driver's box
COACH_STEP_BOARD = (239, 93, 15, 2)    # a broken lit diagonal
#: (centre x, centre y, radius x, radius y). The two wheels are drawn to
#: DIFFERENT RULES and this is the single most misdrawn thing in the region.
COACH_REAR_WHEEL = (271.5, 95.5, 10.5, 11.5)   # a wheel: 2 px rim, 12 spokes at Dl 24
COACH_FRONT_WHEEL = (233, 90, 7, 7)            # NOT a wheel: an arc, 90-190 deg, no spokes
#: The hard dark column immediately inside the front wheel's arc. A 40-point
#: drop across one pixel, and the reason the arc reads at all.
COACH_FRONT_WHEEL_SHADOW = (228, 87, 1, 4)
COACH_REAR_CONTACT = (276, 106, 5, 3)
COACH_FRONT_CONTACT = (224, 98, 10, 1)
COACH_LAMP_A = (261, 66)               # THREE pixels of ochre 13, not four
COACH_LAMP_B = (275, 65)               # TWO
COACH_DRIVER = (216, 43, 21, 28)       # the only figure read against the sky
COACH_DRIVER_FACE = (228, 47, 4, 5)
COACH_STANDING_MAN = (235, 61, 20, 32)
COACH_STANDING_FACE = (240, 65, 5, 8)  # face plus neckcloth, p50 46.3, p75 66.8
COACH_STRONGBOX = (219, 96, 18, 11)    # lit lid edge y 96-97; one warm lock pixel
COACH_STRONGBOX_LOCK = (228, 101)
COACH_KEGS = (303, 71, 17, 34)         # not one keg resolves. Frame-edge texture.
COACH_FENCE = (300, 62, 20, 19)        # two faint rails and one barely-there post
#: coach.md §8.1. The nearest horse's rear silhouette is a near-black column
#: at x 220-221 and the front wheel's lit arc starts at x=226. Between them
#: is unobstructed moonlit road. PROTECT IT -- it is the reason the coach and
#: the team can be separate layers at all.
COACH_TEAM_SEAM = (222, 4)

# -- town.md §2 -------------------------------------------------------------
TOWN_MASS = (62, 50, 89, 19)           # visible portion; enters the rect in progress
#: ~60 lights, y 44-68.
#:
#: SETTLED AT x 74-174. town.md §4 states the field's measured extent as
#: x 74-165 and then, three paragraphs later, names the town's last light at
#: x=174; this anchor carried the first number and `town` unioned in the
#: second locally, so the two documents disagreed by nine columns and the
#: disagreement lived in two files. Layout is where that is settled and the
#: wider number is the one with a consequence: SKY_CEILING_EXEMPT quotes this
#: rect, so at 92 wide errata 33b crushed the five east lights the town's
#: thinning is made of. The field is a bounds, not a density -- nothing
#: scatters out there, BAND_COUNTS gives x 170-179 exactly one light.
TOWN_WINDOW_FIELD = (74, 44, 101, 25)
TOWN_SADDLE = (115, 42, 7, 1)          # sky visible down to y=42 in this gap and nowhere else
TOWN_DARK_TROUGH = (88, 45, 65, 5)     # an ELEMENT, not an absence
HEADFRAME = (82, 42, 8, 12)            # no silhouette contrast at all: dark on dark
HEADFRAME_CAP = (85, 42, 4, 1)         # a 4 px cool bar; the moonlit top edge
HEADFRAME_PLUME = (84, 40, 3, 2)       # the brightest cool value in the region, L 59
TRAMWAY = ((85, 44), (99, 52))         # +8 luminance and no more. Do not strengthen it.
#: The seven horizontal highlight runs of 6-9 px that are the only marks
#: reading as an individual building's ridge. (x, y, length). Everything else
#: in the town is 5 px or shorter.
TOWN_ROOF_STROKES = ((107, 55, 6), (102, 58, 8), (110, 59, 7), (122, 60, 9),
                     (92, 62, 6), (121, 62, 6), (140, 64, 6))

# -- road.md §3.2 -----------------------------------------------------------
#: Where the eleven strong ruts cross the bottom edge. Spacing is median
#: 18 px and DELIBERATELY IRREGULAR, range 8-31: the tight pairs read as one
#: cart having passed twice, and evenly-spaced ruts read as corduroy.
RUT_STARTS = (87, 117, 145, 200, 220, 238, 246, 257, 269, 283, 305)
#: Four faint intermediates. Half strength, and only if the fan looks sparse.
RUT_STARTS_FAINT = (45, 74, 164, 191)
#: The two outermost ruts wrap an elbow here and their tangent reverses sign.
#: This is where the road turns behind the coach and it is the most
#: distinctive shape in the region.
RUT_ELBOW = (272, 112)
#: No ruts at all left of this -- that is verge, not road.
ROAD_LEFT_EDGE = 60
#: Beyond this is a flatter, stonier verge on the far side of the track.
ROAD_RIGHT_EDGE = 302
#: The shadowed verge under the building: a third, independent falloff that
#: pulls the bottom-left corner to L 14-24.
VERGE_FALLOFF = (0, 118, 70, 26)

# -- the seam between `town` and `terrain` ----------------------------------
#: THE LIT VALLEY FLOOR THE TOWN STANDS ON. town.md §2.14's moonlit foot band
#: is the top two rows of it and `town` draws those; the rest belongs to
#: `terrain`, and both of them need to know where it is and how bright it
#: gets. Measured on the bar over x 96-144: rows 69-73 run L 20-69, median
#: near 41, brightening to the right, with no step at y=68 -- rows 67/68/69
#: over x 64-152 are 46.2 / 43.5 / 42.1, a plane.
#:
#: It is READ TWICE, which is why it is here rather than in either module.
#: `terrain` opens its band on it and eases off it over six rows, and
#: SKY_CEILING_EXEMPT above quotes it, because errata 33b's ceiling is the
#: sky's own p90 at 33.8 and this ground is measurably brighter than the sky.
#: 33b is about buildings and hills meeting the dome; ground in front of a
#: lit town is neither, and crushing it to the ceiling flattened the busiest
#: plane in the frame into two values.
#:
#: x 62-179 is town.md's own extent for the foot band -- MASS_LEFT to the
#: right edge of its rect -- carried down the eleven rows that
#: SKYLINE_ROWS still covers.
TOWN_FOOT_SPILL = (62, 69, 118, 11)


# ---------------------------------------------------------------------------
# 10. Ctx -- what every draw(canvas, ctx) is handed
# ---------------------------------------------------------------------------


def _stable_hash(name: str) -> int:
    """FNV-1a, 32 bit. A number that is the same in every process, forever."""
    value = 0x811C9DC5
    for byte in name.encode("utf-8"):
        value = ((value ^ byte) * 0x01000193) & 0xFFFFFFFF
    return value


@dataclass
class Ctx:
    """Everything a region is allowed to know about the rest of the room."""

    palette: Palette
    #: The room's own stream. Regions should use stream() instead, so that
    #: adding scatter to one region cannot move another's.
    rng: random.Random
    with_coach: bool
    #: The flame's hot core. The engine walks Hob across the room; this is
    #: where he is for the reference render.
    lamp: tuple[int, int] = FLAME_CENTRE
    #: Errata 35d. The lamp arm and the lit edge move together -- lighting
    #: him from a fixed side while the lamp swings is worse than not swinging.
    swing: int = 0
    #: Per horse, 0 for a head down and 1 for a head raised and chewing. The
    #: two are out of phase because two animals lifting together is a
    #: pantomime horse.
    graze: tuple[int, int] = (0, 0)
    tracked: bool = False
    sources: tuple[Source, ...] = SOURCES
    #: Pixels the lighting pass must leave alone. A region that authors its
    #: own lit values -- Hob's lamp-side rim, the sign post that stays at
    #: L 22-26 while the ground behind it climbs to 61 -- shields them here.
    shielded: set[tuple[int, int]] = field(default_factory=set)

    # -- materials ----------------------------------------------------------

    def ramp(self, material: str) -> Ramp:
        return self.palette.family(MATERIALS[material][0])

    def step(self, material: str) -> int:
        return MATERIALS[material][1]

    def ink(self, material: str, offset: int = 0) -> int:
        """The palette index for a named material, optionally stepped.

        `offset` is a step along the material's OWN family, which is the only
        legal way to move a colour in this project. Reaching for a naked
        index, or for a different family at a similar value, is how a warm
        surface becomes cold three passes later.
        """
        family, step = MATERIALS[material]
        return self.palette.family(family).at(step + offset)

    # -- randomness ---------------------------------------------------------

    def stream(self, name: str) -> random.Random:
        """A named, stable random stream.

        Nine authors edit nine files in one tree. If they all drew from one
        generator, adding a stone to the road would move every star in the
        sky, and the diff of a one-line change would be the whole frame.

        STABLE MEANS ACROSS PROCESSES, not just within one. This used
        Python's own hash() of the name, and CPython salts string hashing per
        interpreter run unless PYTHONHASHSEED is set -- so every render put
        the stars somewhere else, every render was a diff, and `npm run
        renders` could never be idempotent. Fixed to FNV-1a, which is four
        lines, has no import, and gives the same number in 2026 as it does
        today.
        """
        return random.Random(SEED ^ _stable_hash(name))

    # -- shielding and tracking ---------------------------------------------

    def shield(self, x: int, y: int) -> None:
        self.shielded.add((x, y))

    def shield_rect(self, x: int, y: int, width: int, height: int) -> None:
        for row in range(y, y + height):
            for col in range(x, x + width):
                self.shielded.add((col, row))

    def is_shielded(self, x: int, y: int) -> bool:
        return (x, y) in self.shielded

    @contextmanager
    def track(self, canvas: IndexedCanvas, name: str):
        """Tags an object, for errata 32a's overlap audit.

        Off unless the caller asked for it, and free when off.
        """
        if not self.tracked:
            with nullcontext():
                yield
            return
        with canvas.track(name):
            yield


def context(palette: Palette, with_coach: bool = True,
            lamp_x: int | None = None, swing: int = 0,
            graze: tuple[int, int] = (0, 0), tracked: bool = False) -> Ctx:
    """Builds the Ctx a compose() hands to all eleven draw() calls."""
    lamp = (FLAME_CENTRE[0] if lamp_x is None else lamp_x, FLAME_CENTRE[1])
    return Ctx(
        palette=palette,
        rng=random.Random(SEED),
        with_coach=with_coach,
        lamp=lamp,
        swing=swing,
        graze=graze,
        tracked=tracked,
    )


# ---------------------------------------------------------------------------
# 11. ERRATA 33b -- the sky ceiling, and what it may not be applied to
# ---------------------------------------------------------------------------
#
# No building and no hill may be lighter than the sky. The room file declares
# the two row bands and the compositor enforces it, because a rule nobody
# checks is already broken somewhere nobody has looked.
#
# THE EXEMPTIONS ARE DECLARED, NEVER INFERRED. A brightness test would excuse
# every mistake along with every source. Three of these come straight from
# the room file's lightSources; the rest are objects that the region specs
# measure ABOVE the ceiling and that are not hills or buildings meeting the
# sky, which is what 33b is about. Each carries the measurement that puts it
# there.
SKY_CEILING_ROWS = (0, 44)
SKYLINE_ROWS = (44, 80)
SKY_CEILING_EXEMPT = (
    (64, 66, 46, 42),      # room file: Hob's lamp
    (180, 76, 34, 30),     # room file: the coach lantern
    (0, 56, 74, 22),       # room file: the town downhill
    # left_yard.md §3: the signboard face runs to L 67 and its top three rows
    # to L 95, and it is the highest-contrast region in the whole frame. The
    # gantry lamp above it reaches L 122 in twelve pixels.
    (29, 54, 54, 27),
    # town.md §4: fourteen of sixty windows reach ochre 13 at L 126, and the
    # window field runs to y=68. The town MASS is cold and stays under the
    # ceiling; only the punched holes are exempt.
    (74, 44, 92, 25),
    # coach.md §3.1: the coach's separation from the sky is 11 L and ALL of
    # it is one row of roof rail at L 47-82 and one 8x5 black notch. Crush
    # the rail and the object loses its top edge; the reference does not
    # separate the coach from the sky by value at all.
    (210, 43, 110, 37),
    # team.md §5: A's back rim is one cool row at L 41.9 sitting on hide at
    # L 27.5, and it is the entire depth read between the near and far
    # animals. The bridle spark is L 85 in three pixels.
    (152, 69, 70, 11),
    # rail.md §7: the crate and the near post stand ABOVE the bar, inside
    # SKYLINE_ROWS, and the bar measures them at L 40-59 against a sky p90 of
    # 33.8 -- so 68 px of lit timber were being stepped down by 33b. They are
    # neither a hill nor a building meeting the sky: they are near-plane
    # objects six feet from the viewer, seen against the valley floor rather
    # than against the dome, and the rule 33b enforces has nothing to say
    # about them. Crushed, the crate loses its top edge and the post loses
    # the polarity change at the bar that is the region's depth read.
    (126, 69, 26, 11),
    # rail.md §7, the same case one object further back and one row tall.
    # enforce_sky_ceiling covers rows 44-79; the exemption above begins at
    # x=126, so row 79 of the BACK fence post composited 33/28/21 against a
    # measured 53/59/41 and the post lost its cap. Three columns, one row:
    # BACK_FENCE_POST's top edge and nothing else.
    (114, 79, 3, 1),
    # left_yard.md §2: the tread caps at rows 45-48 measure L 35-59 and the
    # two stack cap rows at y 53-54 measure L 47-59, against a sky p90 of
    # 33.8 -- 1040 px of the timber mass were being stepped down by 33b.
    # Same case as the rail exemption above, and not the case 33b is about:
    # the timber is a near-plane object six feet from the viewer, seen
    # against the valley floor rather than against the dome. Crushed, the
    # left structure loses every lit edge it has.
    (0, 44, 29, 12),
    # THE GROUND IN FRONT OF A LIT TOWN IS LIT, and it is neither a building
    # nor a hill. town.md §2.14's moonlit foot band ends at y=68 because that
    # is where `town`'s rect ends; the plane it is a band OF carries on down
    # into `terrain`. The bar measures it at x 96-144, rows 69-73, running
    # L 20-69 with a median near 41 and rising to the right -- against a sky
    # p90 of 33.8, so every pixel of it over `grey` 2 was being stepped down.
    # Crushed, rows 69-73 composited as two values, 32 and 34, across the
    # whole span: a dead flat plate under the one part of the valley study §6
    # measures at 0.0% flat, with a bright one-row rule along the top of it
    # where the foot band stopped. See TOWN_FOOT_SPILL.
    TOWN_FOOT_SPILL,
)
