"""Room 1 — the sky.

Nineteen rows of open night over a far range, thinning to five where the
range is highest. It is the first thing anyone sees in the game and it is
almost entirely still.

WHAT THIS REGION HAS TO DO, from sky.md §1: be the dark field the whole
frame's warmth is read against (sky median L 22.7 against a ground median of
31.3, and that nine-point gap is the composition); establish depth by
gradient alone, with no clouds, no moon and no glow over the town; and carry
the rhyme -- the stars are warm because the town is warm, and the shot is a
constellation that fell over.

WHY THE GRADIENT IS THREE SEGMENTS AND NOT A RAMP. sky.md §3 fitted both:
a power law scores rms 1.11 and a straight line 1.48 against a per-row noise
floor of 1.55, so the exponent is not doing real work and the line is drawn
straight. What the three segments buy is the *dither budget* -- rows 0-16
get no dither at all, because the reference crosses accent_indigo[0]'s
luminance at y~17 and there is nothing to gain above that row. Seventeen
rows of one flat colour is the quietest surface in the game and §6.3 of the
whole-frame study says the calm is what makes everything below read as
worked: 14.8% of the frame reads flat and essentially all of it is here.

WHY THE DITHER IS SHEARED (§5, and this is the one real technique in the
file). The band is fifteen rows and seventeen levels -- very nearly one
level per row, which is why sky.md picks a 4x4 matrix. But a 4x4 Bayer
indexed the ordinary way, `matrix[y % 4][x % 4]`, only offers FOUR distinct
thresholds along any one picture row, so a per-row density can only land on
0, 1/4, 1/2, 3/4 or 1. Measured on the previous block-in that produced row
densities of 0%, 25%, 0%, 50%, 25%, 50%, 25%, 50%, 50%, 74%, 50%, 100% --
non-monotone, saturated three rows early, and holding 50% for four rows in a
row, which §5 forbids by name because a held 50% checker reads as a painted
band and the eye finds it instantly at 320x144.

Shearing the matrix row index by the pixel's 4-px column block --
`matrix[(y + x // 4) % 4][x % 4]` -- walks all four matrix rows across every
sixteen pixels of a picture row, so every row offers all sixteen thresholds
and lands on its exact k/16. Each 4x4 block on screen is still an unmodified
Bayer block; only which block goes where has moved. Monotone, exact, and no
row is at 50% for longer than the one row the ramp actually spends there.

WHY THE STARS THIN TOWARD THE HORIZON. Every instinct says a star field
thickens where the sky meets the land. Measured (sky.md §5) it is SIX TIMES
thinner there, and there is not one star below y=38. That single number is
the most characterful measurement in the region; drawing stars into the
horizon band destroys the glow the ranges are silhouetted against.

WHY THE FAINT STARS GET BRIGHTER AS THEY GO DOWN. Not a gradient on the
stars -- a floor. Counted on the bar, the faintest star that clears +15
against its local sky sits at L 25 in rows 0-5, 34 in 6-11, 38 in 18-23, 42
in 24-29 and 48 in 30-35. The ladder's bottom rung rises with the sky under
it, at a near-constant +15 to +19, and the tiers above it do not move at
all. sky.md §4 describes the same effect from the other end and calls it
free density falloff: one faint colour is legible at the top of the sky and
nearly invisible near the horizon. It is only free if the sky underneath is
the reference's. Ours is not -- accent_indigo[0] puts our top-of-sky twelve
luminance ABOVE the bar's and accent_indigo[1] puts our horizon three above
it -- so the floor is stepped explicitly here, per band, to hold the
measured contrast the free version would have given us.

WHY NO STAR IS AS BRIGHT AS THE LAMP. The reference's brightest sky pixel is
the exact colour of Hob's lantern, one pixel of it at (249, 3). Errata 18b
protects the lamp's status as the uniquely brightest object in the only
night exterior in the game, so the field is capped one step down at
umber[14] -- layout's `star_bright`. sky.md §6.2 flags this as a deliberate
departure from the bar and it is one somebody decided, not one that happened.

THE LADDER IS THE `dust` RAMP, and that is a measurement rather than a
convenience. The bar's star tiers come out at L 25 / 34 / 38-42 / 45-48 /
50-52 / 60 / 70 / 82 / 97; `dust` steps 0-8 are 24.7 / 32.7 / 40.6 / 45.6 /
53.3 / 61.3 / 66.5 / 74.5 / 82.5 and `umber[14]` is 98.2. Every tier in the
reference lands on a dust step to within about two luminance. So the tiers
here are offsets along `star_mid` and `star_faint`'s own family, which is
the only legal way to move a colour in this project, and they are not
choices.

THE ONE PLACE THE STAR FIELD TURNS COLD. sky.md §5 asks
for about one star in twenty to be cool, "to stop the field looking tinted",
in the MID tiers only -- every star at L >= 80 in the bar is warm. layout's
three star materials are all warm and it has no `star_cool`. The six cool
stars here take `star_cool`, whose steps 0 and 1 (L 52.7 and 61.2) sit on
the warm mid tiers `dust[4]` and `dust[5]` (53.3, 61.3) to within a
luminance -- the same value, the other temperature, which is exactly what
the note asks for. layout carries it now, in COLD_MATERIALS as the cold
counterpart of the three warm star tiers. sky.md §4 also offers
accent_indigo 2 for faint stars; that one stays refused, because 239 is the
first entry of the puddles' reserved band.

WHAT THIS REGION DELIBERATELY DOES NOT DRAW:
  - the smoke plume at x 40-44, y 32-47. It is inside the rect and it is
    faint, and sky.md §6.8 warns that a flood fill of the sky eats it and
    its absence is very hard to spot. It sits entirely below the skyline, so
    stopping at the cut is enough: `town` owns it (§7).
  - anything below far_crest(x). The cut is this region's; the fill is the
    range's.
  - any motion at all. Doc 18 gives Room 1 exactly two cycling elements and
    a star field is the single most tempting surface in the game to animate.
"""

from __future__ import annotations

from canvas import IndexedCanvas
from dither import BAYER_4

from . import layout

#: Exponent on the dither density through rows 17-31, fitted against the
#: bar's own row luminances rather than chosen.
#:
#: sky.md §3 fits the reference's ramp LINEAR IN LUMINANCE across rows 1-31,
#: from L 9.16 to L 30.3. That is not the same line as a linear DENSITY
#: across rows 17-31, because our two endpoints are not the reference's: we
#: start at accent_indigo[0], L 21.65, twelve luminance above the bar's top
#: of sky, and we are held at accent_indigo[1], L 35.0, three above its
#: plateau. Between two endpoints that both sit high, a straight density
#: overshoots the middle badly -- measured against the bar's fifteen row
#: medians it scores rms 2.79 with a worst row 3.9 out, against §3's stated
#: per-row noise floor of 1.55.
#:
#: Sweeping the exponent over the same fifteen rows, with the density
#: quantised to the k/16 the matrix actually delivers:
#:
#:      p     1.00  1.25  1.50  1.75  2.00  2.25  2.50  3.00
#:      rms   2.79  2.18  1.68  1.24  1.12  1.28  1.34  1.64
#:
#: p = 2 is the minimum and it lands INSIDE the reference's noise floor. It
#: also costs nothing at the seam: row 31 comes out at 14/16 rather than
#: 15/16, so the step into the flat plateau at row 32 is 1.7 luminance.
#:
#: And it is the same correction twice over -- the bar's ramp barely moves
#: for its first five rows, so squaring the density empties rows 17-20 to one
#: pixel in sixteen and the dither fades in instead of starting. That is
#: worth having on its own: §5 wants these fifteen rows to be the quietest
#: addition in the frame, and a band that begins is louder than a band that
#: arrives.
RAMP_GAMMA = 2.0


# ---------------------------------------------------------------------------
# The star field, as measured
# ---------------------------------------------------------------------------

#: sky.md §5. The twelve stars at L >= 96 are what a player actually sees;
#: the other hundred-odd are texture. Measured positions, and worth placing
#: deliberately rather than generating -- note how they are spread, one in
#: each rough sixth of the width, one high and one low in each.
BRIGHT = ((4, 1), (15, 22), (34, 19), (75, 25), (138, 14), (139, 34),
          (164, 9), (181, 17), (249, 3), (287, 1), (287, 23), (311, 35))

#: sky.md §5, stars per 1000 sky px in six-row bands from the top of frame.
#: 22.9 at the top against 3.7 at row 36-41 -- the 6:1 fall, tabulated.
#:
#: PER THOUSAND PIXELS, which is why it is multiplied by each row's own sky
#: area below rather than used as a weight directly. The bands are not equal
#: in area: the top four are full-width 320x6, band 5 has lost a fifth of
#: itself to the range and band 6 is down to 415 px. Weighting by the rate
#: alone puts four times too many stars in the bottom band, which is the one
#: place §6.3 says a star must not be.
#:
#: AND THE FALLOFF IS SAMPLED SMOOTH, NOT AS A STAIRCASE. Six rates over six
#: bands, drawn a band at a time and then uniformly within it, is a step
#: function: measured on the first pass it put seven stars in row 30 and one
#: in each of rows 31-34, because band 5's whole allowance landed wherever
#: the uniform draw felt like putting it. §5 states the profile in PER-ROW
#: terms -- "about 7 stars per row at the top, 4 by y 15, 2 by y 30, 0 by
#: y 39" -- so the rate is interpolated between band centres and every row
#: gets its own weight. There are no band edges in the sky.
DENSITY = (22.9, 14.1, 13.0, 8.9, 11.0, 8.6, 3.7)

#: §5: "none at all below y 38". Not "few". None. The lowest star measured on
#: the bar is at y=36.
STAR_FLOOR = 37

#: §5: 151 marks on the bar down to +6 luminance over the local sky, of which
#: 119 clear +15 and survive quantisation -- recounted here as connected
#: components rather than pixels it is 124 -- and 74 at the bright-core
#: threshold `00-light-and-value.md` uses. Three counts of one field.
#:
#: BOTH NUMBERS GET DRAWN. 124 stars on the ladder proper, and then the
#: twenty-seven marks between +6 and +15 that the 151 count includes and the
#: 119 count does not. They are not texture that could be left out: a field
#: whose faintest member is its threshold has a hard bottom edge, and at
#: twelve stars per row across the top of the frame the eye reads that as a
#: ladder with a rung missing. They are the STAR_SUB rung below.
STAR_COUNT = 151

#: The marks between +6 and +15, one step below whatever the band's floor is.
#: On our sky that lands them at +8 to +11 in every band -- dust[1] over the
#: flat top, dust[2] through the ramp, dust[3] over the plateau -- which is
#: the same relationship the bar has and, usefully, the same one in all three
#: places. One step lower again would put them AT or UNDER the sky near the
#: horizon, and a dark speck in a star field is worse than no speck.
STAR_SUB = 27

#: §5's measured floor: no two star pixels are adjacent anywhere in the
#: frame, in any direction, so the hard minimum is a euclidean 2.0 and a
#: diagonal touch is as forbidden as a side-by-side one.
MIN_SPACING = 2.0

#: §5 again: the field is measurably MORE EVEN than random -- median
#: nearest-neighbour 5.39 px where Poisson would give 4.19, and only 40 of
#: the 124 have a neighbour inside 4 px where Poisson predicts 71. That is a
#: blue-noise field, not a Poisson-disc one: a hard radius large enough to
#: give the median would leave nobody inside 4 px at all. So the hard floor
#: stays at 2 px and closeness is discouraged rather than forbidden, on a
#: ramp that reaches certainty at SOFT_SPACING.
#:
#: TUNED AGAINST THE BAR, not guessed. Re-measured on connected components
#: rather than pixels -- the bar's 2x2 star footprints are resampling and
#: counting them as pairs halves its apparent spacing -- the field is median
#: 5.61, minimum 2.06, and 27% of stars have a neighbour inside 4 px. A soft
#: radius of 5 gave the median exactly and only 9% inside 4 px, which reads
#: as a lattice; 4.0 keeps the median and puts the close pairs back.
SOFT_SPACING = 4.0

#: The tiers, as (star material, step offset along its own family, count).
#: Read the module docstring: these land on the bar's measured tiers, they
#: are not taste. The faint floor is the balance and is chosen per band.
TIERS = (
    ("star_mid", 3, 21),    # dust[8]  L 82.5 -- the bar's 82 tier, 21 of them
    ("star_mid", 1, 8),     # dust[6]  L 66.5 -- its 70 tier
    ("star_mid", 0, 12),    # dust[5]  L 61.3 -- its 60 tier
    ("star_mid", -1, 18),   # dust[4]  L 53.3 -- its 50-52 tier
)

#: The bottom rung, per six-row band, as an offset along `star_faint`
#: (dust[1], L 32.7). Against our sky -- 21.7 flat to row 16, dithering up
#: through row 31, 35.0 below -- these hold +15 to +19, which is the bar's
#: own faint-star contrast in every band. See the docstring.
FAINT_FLOOR = (1, 1, 1, 1, 2, 3, 3)   # dust 2, 2, 2, 2, 3, 4, 4

#: §5: keep the cool stars to about one in twenty, and put them in the MID
#: tiers, never the bright ones. Six of 125.
COOL_COUNT = 6


# ---------------------------------------------------------------------------
# Drawing
# ---------------------------------------------------------------------------


def _sheared_bayer(x: int, y: int) -> float:
    """4x4 Bayer threshold, matrix row sheared by the 4-px column block.

    See the module docstring. `matrix[y % 4][x % 4]` gives a picture row only
    four thresholds and quantises its density to quarters; walking the matrix
    row with `x // 4` gives every picture row all sixteen, so a k/16 density
    lights exactly k of every sixteen pixels and the band ramps one
    seventeenth at a time as §5 asks. On screen every 4x4 block is still an
    unmodified Bayer block.
    """
    return (BAYER_4[(y + x // 4) % 4][x % 4] + 0.5) / 16.0


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    body = ctx.ink("night_sky")
    horizon = ctx.ink("night_sky_horizon")

    flat_to = layout.SKY_FLAT_TO
    ramp_from, ramp_to = layout.SKY_RAMP_ROWS
    span = ramp_to - flat_to                      # sixteen, so k/16 per row

    for x in range(layout.WIDTH):
        # The sky owns the cut and the range fills below it (sky.md §7). One
        # row of full sky, the next row of full mountain -- the bar shows a
        # single blended row at every mountain edge and it is a resampling
        # artefact, not an edge anybody drew.
        cut = layout.far_crest(x)
        for y in range(min(cut, layout.HEIGHT)):
            if y <= flat_to:
                canvas.put(x, y, body)
            elif y < ramp_to:
                # §5: ordered 4x4, sixteen levels over the fifteen rows from
                # 17 to 31. SQUARED, and that is a fit rather than a taste --
                # see RAMP_GAMMA.
                density = ((y - flat_to) / span) ** RAMP_GAMMA
                canvas.put(x, y,
                           horizon if _sheared_bayer(x, y) < density else body)
            else:
                # §3: the plateau is only reached where the range is low. On
                # the left massif the skyline sits above row 32 and the sky is
                # cut off mid-ramp, so the left summits separate about 3.5
                # luminance less strongly than the centre-right ones. That is
                # correct. Do not even it out.
                canvas.put(x, y, horizon)

    _stars(canvas, ctx)


def _row_weights() -> list[float]:
    """Expected stars per row: the interpolated rate times the row's own sky.

    DENSITY is quoted per thousand sky pixels in six-row bands. Each band's
    rate is taken to hold at its centre row, b * 6 + 2.5, and the rate at any
    other row is the straight line between the two centres either side --
    flat above the first centre and below the last, because the measurement
    says nothing outside its own range. Multiplying by the count of sky
    pixels actually available in that row is what keeps the bottom bands
    honest: rows 30-37 have lost between a tenth and two fifths of their
    width to the range, and a rate is a rate per pixel.
    """
    # THE LAST BAND'S CENTRE IS NOT ON THE PICTURE. Bands 0-5 are wholly
    # above the floor and their rates sit at their own centre rows. Band 6
    # covers rows 36-41, of which four are below the floor and carry no stars
    # at all, so 3.7 per thousand describes a band that is nearly empty and
    # putting it at y=38.5 extrapolates it back UP into rows 36 and 37 --
    # which measured three stars there against the bar's one, in the one band
    # §6.3 says a star must not be in. So the profile is taken to zero at the
    # first row below the floor instead. The line from band 5's centre to
    # that zero passes through 3.7 at about y=35.5, which is where band 6's
    # sky actually begins: the measurement is honoured at the row it is
    # about rather than at the centre of a band that is mostly mountain.
    centres = [band * 6 + 2.5 for band in range(len(DENSITY) - 1)]
    rates = list(DENSITY[:-1])
    centres.append(float(STAR_FLOOR + 1))
    rates.append(0.0)
    weights = []
    for y in range(STAR_FLOOR + 1):
        if y <= centres[0]:
            rate = rates[0]
        elif y >= centres[-1]:
            rate = rates[-1]
        else:
            hi = next(i for i, c in enumerate(centres) if c >= y)
            t = (y - centres[hi - 1]) / (centres[hi] - centres[hi - 1])
            rate = rates[hi - 1] + (rates[hi] - rates[hi - 1]) * t
        area = sum(1 for x in range(layout.WIDTH) if layout.far_crest(x) > y)
        weights.append(rate * area)
    return weights


def _stars(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """A warm field on a short discrete ladder, thinning toward the horizon."""
    rng = ctx.stream("sky.stars")
    taken: list[tuple[int, int]] = []
    occupied: set[tuple[int, int]] = set()

    def nearest(x: int, y: int) -> float:
        best = 1e9
        for ax, ay in taken:
            d2 = (ax - x) ** 2 + (ay - y) ** 2
            if d2 < best:
                best = d2
        return best ** 0.5

    def room(x: int, y: int) -> bool:
        if not 0 <= x < layout.WIDTH or not 0 <= y <= STAR_FLOOR:
            return False
        # §6.11 and range.md §7.11: a star on a silhouette is the single most
        # visible way to destroy the depth read. Measured: none, down to y=36.
        if y >= layout.far_crest(x):
            return False
        return (x, y) not in occupied

    def place(x: int, y: int, index: int) -> None:
        taken.append((x, y))
        occupied.add((x, y))
        # §5: every star is ONE PIXEL. The 2x2 footprints in the bar are
        # resampling; verified against image A, where a star spans 1.25-1.75
        # of A's internal pixels and about 1.0 of ours.
        canvas.put(x, y, index)

    for x, y in BRIGHT:
        if room(x, y):
            place(x, y, ctx.ink("star_bright"))

    # -- the bag of tiers, shuffled once. Shuffling rather than cycling
    #    matters: the placement loop visits bands in a weighted random order,
    #    so cycling a tier list correlates brightness with the order stars
    #    happened to be accepted in, and a run of rejections in one band
    #    quietly hands the next band a run of one colour.
    bag: list[tuple[str, int] | None | int] = []
    for material, offset, count in TIERS:
        bag.extend([(material, offset)] * count)
    # The balance is the faint end, whose step depends on the band it lands
    # in and so cannot be decided here. None means "the floor, wherever that
    # band's floor is"; -1 means "one step under it", the +6..+15 rung.
    bag.extend([-1] * STAR_SUB)
    bag.extend([None] * (STAR_COUNT - len(BRIGHT) - len(bag)))
    rng.shuffle(bag)

    # §5: cool stars in the MID tiers only, never the bright ones. Take them
    # from the two tiers whose luminance the sky family can match exactly.
    cool = set()
    mid = [i for i, tier in enumerate(bag) if tier in (("star_mid", 0),
                                                       ("star_mid", -1))]
    for i in rng.sample(mid, min(COOL_COUNT, len(mid))):
        cool.add(i)

    # -- weights. DENSITY is a RATE, per thousand sky pixels, so each row's
    #    share is its rate times its own area. See DENSITY and _row_weights.
    weights = _row_weights()
    total = sum(weights)

    placed = 0
    for _ in range(200000):
        if placed >= len(bag):
            break
        pick = rng.random() * total
        y = len(weights) - 1
        for row, weight in enumerate(weights):
            pick -= weight
            if pick <= 0:
                y = row
                break
        band = min(y // 6, len(FAINT_FLOOR) - 1)
        x = rng.randrange(layout.WIDTH)
        if not room(x, y):
            continue
        # Blue noise, not Poisson disc: a hard floor at 2 px and a linear
        # discouragement out to SOFT_SPACING. See MIN_SPACING and SOFT_SPACING.
        gap = nearest(x, y)
        if gap < MIN_SPACING:
            continue
        if gap < SOFT_SPACING and rng.random() > (gap - MIN_SPACING) / (
                SOFT_SPACING - MIN_SPACING):
            continue

        tier = bag[placed]
        floor = FAINT_FLOOR[min(band, len(FAINT_FLOOR) - 1)]
        if tier == -1:
            # The +6..+15 rung. See STAR_SUB.
            index = ctx.ink("star_faint", floor - 1)
        elif tier is None:
            # The floor, and one step above it. Counted on the bar, no band's
            # faint end is a single value: rows 12-17 hold 35/38/42/45, rows
            # 24-29 hold 42/48, rows 30-35 hold 48/60. A single flat floor
            # gives forty stars at one exact luminance and the field goes
            # stripey by tier. Two thirds floor, one third the step above.
            index = ctx.ink("star_faint", floor + (rng.random() < 1 / 3))
        elif placed in cool:
            # The cool minority. sky.md §5 names sky[0] and sky[1]; they are
            # L 52.7 and 61.2 against the warm mid tiers' 53.3 and 61.3, so
            # this swaps the temperature and holds the value. layout now
            # carries it as `star_cool`, in COLD_MATERIALS, so the star field
            # is three warm tiers and one cold one and every one of them is
            # named.
            # Step 1, never 0. Ruling 21b fails any pale family sitting on its
            # own floor, because a surface there has no ramp left to shade with.
            # A faint star is not a shadow, but the audit reads pixels and not
            # intent, and sky.md Sec 5 asks for sky[0..1] rather than sky[0] --
            # so the cool minority takes 1 and 2, which is 8.5 luminance up on a
            # mark that is three pixels of the whole frame.
            index = ctx.ink("star_cool", 1 if tier[1] < 0 else 2)
        else:
            index = ctx.ink(tier[0], tier[1])
        place(x, y, index)
        placed += 1
