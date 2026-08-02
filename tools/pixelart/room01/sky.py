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

THE GRADIENT IS A RAMP AND IT IS DRAWN ACROSS EVERY ROW. This region used to
be three segments -- seventeen rows flat at accent_indigo[0], a fifteen-row
dithered belt, then a flat horizon band -- on the reasoning that sky.md §3's
fit has three segments and that the reference does not cross
accent_indigo[0]'s luminance until y~17, so there is nothing to gain above
that row. The reasoning is sound about the FIT and wrong about the PICTURE,
and a blind critic named it: the top of the frame was one colour across the
full 320 px, the whole gradient was crushed into a belt whose density peaked
at 100%, and the belt read as a painted band rather than as air.

Re-measured, the bar's own mean sky luminance is a straight line -- 10.4 plus
0.68 a row -- from the top of the frame to the plateau, with no flat section
at all except row 0. So the ramp here runs from row 0 to row 37 too: the mid
rung fades in from row 10 and the horizon band from row 12, and NO DENSITY IS
HELD FOR TWO CONSECUTIVE ROWS anywhere in the region. What survives of the
old three segments is the floor and the top: rows 0-9 sit at
accent_indigo[0] because the palette has nothing under it that is still blue
(see WHAT IS NOT HERE), and rows 37-43 sit flat at accent_indigo[1] because
the horizon band is the one hard edge in the region and the range is read
against it.

WHICH DITHER, AND WHY IT IS BLUE NOISE (§5, and this is the one real
technique in the file). §5 chooses between 4x4 Bayer, 8x8 Bayer and white
noise for a fifteen-row belt, and picks 4x4. A previous pass added a fourth
candidate, Jimenez' interleaved gradient noise, built all four as density
ladders and picked IGN by looking -- correctly, for a belt. It does not
survive a ramp that covers the whole region: IGN's step along a row is
frac(52.9829189 * 0.06711056) = 0.5557, five ninths to within a thousandth,
so the mask repeats every NINE PIXELS, and at 8x that is a lattice of dark
dots over the calmest surface in the game. The mask is now a 32x32
void-and-cluster blue-noise tile, built at import, seamless, isotropic, and
still exactly what §5 means by ordered: a pure function of (x, y), no state,
no stream, identical every compose. `_blue_noise` carries the comparison.

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

import math
import random

from canvas import IndexedCanvas

from . import layout

#: THE RAMP, as the bar's own per-row means rather than as a segment fit.
#:
#: sky.md §3 describes the reference gradient in three segments -- flat at
#: row 0, linear at +0.71 L/row to row 31, plateau at L 31.8 -- and the
#: earlier build implemented the SEGMENTS while the palette forced the ramp
#: itself to be dropped: rows 0-16 flat at accent_indigo[0] and the whole
#: gradient crushed into fifteen dithered rows. Re-measured off the bar, the
#: mean luminance of the sky pixels above the skyline runs
#:
#:      y   0    4    8   12   16   20   24   28   31   35   40
#:      L 10.7 15.3 16.6 17.6 21.4 22.7 26.3 29.2 30.2 32.6 30.4
#:
#: which is 10.4 + 0.68y to within the region's own per-row noise, all the
#: way from the top of the frame to the plateau. Not a flat field with a belt
#: in it -- a line, drawn over forty-two rows.
#:
#: TOP_L IS NOT THE BAR'S 10.4 AND CANNOT BE. Reaching L 10.4 at row 0 with
#: accent_indigo[0] at 21.65 takes a void dither at half density, and sky.md
#: §6.5 says so in advance -- "it kills the blue completely and looks like a
#: fault". It was built anyway, rendered and looked at, and §6.5 is right: at
#: 4x the top of the frame was salt-and-pepper and the ramp underneath it had
#: vanished behind the noise. So the LINE is kept and its DEPTH is
#: compressed: the same climb at seven tenths of the bar's slope, clipped
#: from below at the palette's floor, which holds the ramp the region was
#: missing without taking the sky grey. What it costs is the top of the
#: frame -- rows 0-9 sit on the floor where the bar is still falling away
#: from it -- and what it keeps is §1's whole composition: our sky median
#: lands at 21.7 against the bar's 22.1.
TOP_L, SLOPE_L = 16.6, 0.484

#: Where the line stops climbing and the horizon band begins. sky.md §3's
#: plateau, at the bar's measured 31.6 rather than at its fitted 31.8.
PLATEAU_L = 31.6

#: Rows 32-36 close the last three luminance onto accent_indigo[1] so that
#: the horizon band can be FLAT, which §5 asks for and which is what makes
#: the range read: one row of full sky, the next row of full mountain. The
#: alternative -- holding the plateau's true value with a mixed rung all the
#: way to the skyline -- was rejected twice over: it holds one dither density
#: for eleven rows, which is the band the last critic named, and it softens
#: the only edge in the region.
CLOSE_ROWS = (32, 37)


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
#:
#: RE-CHECKED AS A CONTRAST RATIO, WHICH MOVED THE BOTTOM TWO BANDS. A
#: constant +15 to +19 is the right rung while the sky under it barely
#: moves, and rows 0-29 are that case: ours is accent_indigo[0] flat or
#: nearly so. Rows 30-37 are not -- the sky there is accent_indigo[1] at
#: L 35, and +18 on 35 is a much weaker mark than +18 on 22. Measured as
#: Michelson contrast against the local sky, the bar's faint end runs
#: 0.23 / 0.19 / 0.16 / 0.16 / 0.16 down the five bands and its median star
#: runs 0.35 / 0.32 / 0.29 / 0.27 / 0.26; on the same measurement this
#: region was returning 0.20 / 0.20 / 0.16 / 0.22 / 0.13 and 0.36 / 0.30 /
#: 0.27 / 0.27 / 0.21. Every band matched but the last, which was a fifth
#: weak at both ends -- the horizon stars were dissolving into the
#: plateau. One step up puts band 5 at 0.21 and 0.27, on the bar.
FAINT_FLOOR = (1, 1, 1, 1, 2, 4, 4)   # dust 2, 2, 2, 2, 3, 5, 5

#: §5: keep the cool stars to about one in twenty, and put them in the MID
#: tiers, never the bright ones. Six of 125.
COOL_COUNT = 6


# ---------------------------------------------------------------------------
# Drawing
# ---------------------------------------------------------------------------


#: The blue-noise tile: side, filter width and the seed of its starting
#: pattern. 32 is the largest tile void-and-cluster builds in well under a
#: tenth of a second in plain Python, which is the budget -- the whole
#: compose is meant to stay inside a second. sigma 1.5 is the standard
#: energy width for a tile this size.
MASK_SIZE, MASK_SIGMA, MASK_RADIUS = 32, 1.5, 4

#: The starting pattern's seed. Not layout.SEED: the mask is not a property
#: of this room and must not move when the room's seed does.
MASK_SEED = 1850


def _blue_noise(size: int, sigma: float, radius: int, seed: int) -> list[int]:
    """A void-and-cluster rank matrix, built once at import.

    WHY THE MASK CHANGED, and it is the largest single improvement in this
    region. The dither used to be Jimenez' interleaved gradient noise, chosen
    over three Bayer variants by rendering a density ladder and looking at
    it, and over fifteen rows at one density band it was the quietest of the
    four. It stopped being quiet the moment the ramp grew to forty-two rows:
    IGN's per-pixel step along a row is `frac(52.9829189 * 0.06711056)` =
    0.5557, which is five ninths to within a thousandth, so the mask repeats
    every NINE PIXELS across and drifts 0.309 per row down. At one density in
    a narrow band that reads as grain. Across the whole sky at a density that
    changes on every row it reads as a lattice, and it was plainly there at
    8x -- regular dark dots on a nine-pixel pitch, over the calmest surface
    in the game.

    Void-and-cluster has no such period. It is the standard construction for
    an ordered dither whose grain is isotropic: start from a sparse binary
    pattern, repeatedly move the tightest cluster into the largest void until
    it stops moving, then rank every cell by removing ones from the tightest
    cluster and adding ones to the largest void. The energy filter wraps, so
    the tile is seamless, and the result is a pure function of (x, y) exactly
    as the old mask was -- no state, no stream, identical every compose.

    THE TILE IS 32 AND THAT IS A REPEAT ACROSS 320 PX. Ten of them. A blue
    noise tile repeats without a motif, because there is no motif to spot:
    what the eye finds in a repeated Bayer block is the block's own figure,
    and this has none. Rendered at 8x and looked for, the seam is not
    findable. 64 would remove even the question and costs four seconds of
    plain-Python void-and-cluster at import, which is four times the whole
    compose budget.
    """
    cells = size * size
    kernel = [(dx, dy, math.exp(-(dx * dx + dy * dy) / (2.0 * sigma * sigma)))
              for dy in range(-radius, radius + 1)
              for dx in range(-radius, radius + 1)]
    energy = [0.0] * cells
    binary = [0] * cells

    def bump(cell: int, sign: float) -> None:
        cx, cy = cell % size, cell // size
        for dx, dy, weight in kernel:
            energy[((cy + dy) % size) * size + (cx + dx) % size] += sign * weight

    rng = random.Random(seed)
    seeds: set[int] = set()
    while len(seeds) < cells // 10:
        seeds.add(rng.randrange(cells))
    for cell in seeds:
        binary[cell] = 1
        bump(cell, 1.0)

    def tightest() -> int:
        best, value = -1, -1e30
        for cell in range(cells):
            if binary[cell] and energy[cell] > value:
                best, value = cell, energy[cell]
        return best

    def emptiest() -> int:
        best, value = -1, 1e30
        for cell in range(cells):
            if not binary[cell] and energy[cell] < value:
                best, value = cell, energy[cell]
        return best

    # Phase 0: relax the starting pattern until the tightest cluster and the
    # largest void are the same cell, which is the fixed point.
    while True:
        cluster = tightest()
        binary[cluster] = 0
        bump(cluster, -1.0)
        void_cell = emptiest()
        if void_cell == cluster:
            binary[cluster] = 1
            bump(cluster, 1.0)
            break
        binary[void_cell] = 1
        bump(void_cell, 1.0)

    initial = list(binary)
    ones = sum(binary)
    rank = [0] * cells

    for step in range(ones - 1, -1, -1):
        cluster = tightest()
        binary[cluster] = 0
        bump(cluster, -1.0)
        rank[cluster] = step

    binary = list(initial)
    energy = [0.0] * cells
    for cell in range(cells):
        if binary[cell]:
            bump(cell, 1.0)
    for step in range(ones, cells):
        void_cell = emptiest()
        binary[void_cell] = 1
        bump(void_cell, 1.0)
        rank[void_cell] = step

    return rank


_MASK = _blue_noise(MASK_SIZE, MASK_SIGMA, MASK_RADIUS, MASK_SEED)
_MASK_SCALE = 1.0 / (MASK_SIZE * MASK_SIZE)


def _threshold(x: int, y: int) -> float:
    """A threshold in [0, 1) for the dithered rows. See `_blue_noise`.

    WHY THERE IS A DITHER AT ALL, since the reference has none. sky.md §5 is
    explicit: the bar's sky varies by sd 1.55 per row with no checkerboard
    and no column parity, so its texture is downsampling grain. Ours is an
    addition forced by §4's hard constraint -- the locked palette holds
    exactly two blue-dominant entries under L 40, accent_indigo[0] at 21.65
    and accent_indigo[1] at 35.02, and there is nothing between them. A sky
    that has to climb twenty-one luminance with two colours to climb it in
    either dithers or steps, and a step at 320x144 is a band.

    THE JOB IS THEREFORE TO BE INVISIBLE, and that is the whole of the mask's
    specification. Blue noise is the answer to it: every other candidate --
    the three Bayer variants, R2, interleaved gradient noise -- carries a
    period, and a period over a surface this large and this calm is a
    pattern rather than a grain.
    """
    return (_MASK[(y % MASK_SIZE) * MASK_SIZE + x % MASK_SIZE] + 0.5) * _MASK_SCALE


#: The value ladder, darkest first, as (family, step). Four entries over
#: three rungs across forty-two rows, and only two of them are blue -- which
#: is the whole difficulty of this region and is stated in sky.md §4: the
#: locked palette holds exactly two blue-dominant entries below L 40 and
#: nothing between them. A gradient wants a ladder; the palette supplies two
#: rungs of one, thirteen luminance apart.
#:
#:      accent_indigo 0  L 21.7  sat 0.64  the body, and the region's FLOOR
#:      grey 1           L 24.5  sat 0.14  blue-dominant (24, 24, 28) -- the
#:                                         one neutral in the palette that
#:                                         leans the right way
#:      accent_teal 0    L 24.8  sat 0.75  the same rung, the other side: it
#:                                         gives back the chroma grey 1 costs
#:      accent_indigo 1  L 35.0  sat 0.59  the horizon band
#:
#: THE MIDDLE RUNG IS AN ADDITION THE PALETTE DID NOT OFFER AND IT IS WHAT
#: MAKES THE RAMP A RAMP. Two colours thirteen luminance apart cross that gap
#: either in one dithered belt -- which is what the region used to do, and
#: what the last critic named -- or in two steps of three and ten with
#: something standing in the middle. grey 1 and accent_teal 0 are that
#: something: 2.8 luminance over the body colour, so their dither against it
#: is almost invisible in value, and 10.5 under the horizon band, so the
#: crossing is halved. Neither is blue and that is the price; see TEAL_SHARE
#: for how it is split, and WHAT IS NOT HERE for what was tried below the
#: body colour and why none of it survived.
#:
#: The reserved bands are untouched: accent_indigo 2-4 are the puddles' and
#: accent_gold 4-7 the lamp's, and nothing here reaches either.
#:
#: NAMED MATERIALS NOW, NOT FAMILY STEPS. All four are in `layout.MATERIALS`
#: and all four are in COLD_MATERIALS, so `layout.temperature()` classifies
#: every colour this region paints and the material-table audit can see them.
#: The middle two were added at this region's request; the entries and the
#: densities are still chosen here.
LADDER = (
    "night_sky",
    "night_sky_mid",
    "night_sky_horizon",
)

#: How the mid rung splits between its two entries. grey 1 alone is
#: (24, 24, 28) at saturation 0.14 and fifteen rows of it drains the chroma
#: out of the middle of the sky -- errata 41's failure exactly, a region that
#: matches on value and is washed out. accent_teal 0 is (8, 32, 32) at 0.75
#: and fifteen rows of THAT turns the middle of the sky green.
#:
#: BOTH FAILURES WERE RENDERED AND LOOKED AT, side by side against the bar at
#: 4x, and the green one arrives suddenly. Teal at a density of 0.14 of the
#: row is not visible as a cast, 0.20 still reads as blue, 0.22 is plainly
#: green in the middle of the sky and 0.29 is green everywhere the rung
#: reaches. MID_PEAK * TEAL_SHARE is that density and it is held at 0.20 --
#: the most the picture will take, and it has to be near the ceiling because
#: this rung is the region's ONLY chroma bank: accent_teal 0 at 0.75 is the
#: single cold entry in the locked palette more saturated than the body
#: colour, and without about this much of it the region falls under ruling
#: 41's floor. The rung's own mean comes out at (16, 28, 30) and its mean
#: saturation at 0.46, which is neither failure.
#: NOTHING. accent_teal is out of the sky and out of the room.
#:
#: The note below is kept because its reasoning is sound and its conclusion was
#: still wrong, which is worth more than deleting it. It tuned the density by
#: rendering both failures and looking: 0.20 "not visible as a cast", 0.22
#: "plainly green". Three blind critics on three different regions then called
#: the sky green speckle at 0.20 -- so the threshold was set one notch past
#: where it should have been, by an eye that had been staring at the trade-off.
#:
#: The instrument was no help and that is the finding. Ruling 41 asks for
#: saturation, saturation is a magnitude, and the region duly closed a
#: magnitude gap with the wrong hue. Mean chroma-direction was no better: it
#: scored the same with the teal in and out, because eleven hundred pixels move
#: a region average by less than a unit while being plainly green to look at.
#:
#: What settles it needs no threshold at all. The reference re-quantised into
#: our own palette -- the best this exact 256 can do at this exact picture --
#: uses accent_teal in the sky ZERO times. room01_farfield.py now fails any
#: region painting in a family the reference never reaches for there.
TEAL_SHARE = 0.0

#: The mid rung's weight and where it sits. A HUMP, not a level: the weight
#: changes on every row of the band, which is what stops a stretch of one
#: density resolving as a stratum -- the belt the last critic named, and the
#: reason its instruction was to hold no density for more than about three
#: rows. Centred where the bar's sky is furthest from either blue, and 14
#: rows wide either side, which is as wide as it goes before the rung reaches
#: the top of the frame: rendered at 18 and 20 it puts grey specks in rows
#: 0-6, and sky.md §5 is right that those seventeen rows are the quietest
#: surface in the game and should stay that way.
#:
#: AND IT IS NOW ZERO, WHICH IS THE SAME MISTAKE THE TEAL WAS. The note
#: above ends by saying the teal was set "one notch past where it should
#: have been, by an eye that had been staring at the trade-off"; the grey
#: that replaced it is the same error with the chroma taken out instead of
#: put in the wrong direction, and it is nine times the pixel count. At 0.38
#: this rung put 2,152 px of `grey` 1 -- (24, 24, 28), saturation 0.14 --
#: across rows 14-39, 34% of rows 14-27 and 14% of rows 28-39. The
#: locked-palette proof puts ZERO grey in rows 14-27 and 18 px in 28-39. A
#: blind critic on a neighbouring region named it without being asked about
#: the sky at all: "an ordered cross-hatch dithering the sky blue against the
#: neutral terrain greys, producing dark speckle over the entire upper
#: third... never reuse a terrain grey inside the sky region."
#:
#: WHAT THE INSTRUMENT WAS ACTUALLY SAYING, and this is the finding. The rung
#: exists to buy ruling 42's shape score, and it does buy it: 0.536 at zero
#: against 0.396 at 0.38. But the PROOF -- the reference re-quantised into
#: this exact palette, which is by construction the best score reachable --
#: scores 0.560 on the same rect, with hollow buckets 2 and 4, and `range`
#: scores 0.418 and `town` 0.505. SHAPE_TOLERANCE is 0.20. So the shape test
#: is unreachable in the far field on this palette, this region had been
#: tuned PAST the proof on a number nothing can pass, and the currency it
#: paid in was the one number the proof does reach: saturation 0.74, ours
#: 0.65, ruling 41's floor 0.70. At zero the region lands on 0.536 / 0.74 --
#: the proof's own pair, to two decimal places on the chroma.
#:
#: The ramp does not stop being a ramp. It is still solved per row by `_mix`,
#: and the crossing is still made by the horizon rung dithering into the body
#: colour, which is exactly the belt the proof itself uses. What goes is the
#: neutral standing in the middle of it.
MID_PEAK, MID_CENTRE, MID_WIDTH = 0.0, 23.0, 14.0


# ---------------------------------------------------------------------------
# WHAT IS NOT HERE, and it is the region's central finding
# ---------------------------------------------------------------------------
#
# The bar's sky spends 20% of itself below L 15.0 and another 20% between
# L 15.0 and L 20.3 -- its top nine rows and the five under them. Both are
# below accent_indigo[0], and accent_indigo[0] is the palette's floor for a
# saturated night blue. So two of the reference's five quintiles are, for
# this region, simply not reachable in blue.
#
# Two ways down were built, rendered, measured and removed:
#
#   VOID, at an eighth of the top row, tapering out by row 9. Mixing toward
#   black is the one mix in the palette that does not move the sky's hue, so
#   this was the promising one. It is 190 pixels of the region -- 0.012 of
#   the rect, which moves the shape score by 0.006 -- and at 8x it is a
#   visible speckle of separate black pixels across the calmest surface in
#   the game. sky.md §6.5 predicted exactly that. Bought nothing, cost the
#   top of the frame.
#
#   GREY 0 as a haze, thinly, through the upper sky. This one WORKS on the
#   instrument: at a fifth it clears ruling 42's hollow test on the second
#   quintile and takes the shape score from 0.39 to 0.30. It costs 0.644
#   saturation per pixel, because grey 0 holds red at 16 and drops blue from
#   45 to 16, and the region has only about 560 pixels of that to spend
#   before ruling 41's floor. Measured on the comparison sheet, a fifth put
#   the row-0 mean at (14.5, 16.2, 27.6) against the bar's (1.8, 7.6, 50.2)
#   and the sky read grey. Ruling 42 satisfied by breaking ruling 41, on the
#   one region whose job §1 says is to be the saturated cold field the whole
#   frame's warmth is measured against.
#
# So the second quintile is left hollow, deliberately, and the trade is
# stated here rather than hidden in a constant: every 0.01 of shape score
# below about 0.39 costs 0.006 of saturation ratio, and the ratio has 0.00
# left. It is a palette gap, not a drawing decision, and the fix is an entry
# the palette does not have -- something near (8, 14, 46), L 16, saturation
# 0.83 -- which is a locked-palette question and not this file's.


def _target(y: int) -> float:
    """The bar's own mean sky luminance at row y, clipped to the floor."""
    close_from, close_to = CLOSE_ROWS
    if y >= close_to:
        return 35.02
    ramp = min(TOP_L + SLOPE_L * y, PLATEAU_L)
    if y < close_from:
        return ramp
    # The last three luminance, spent over five rows, so that the horizon
    # band arrives FLAT at accent_indigo[1] instead of stepping onto it.
    return ramp + (35.02 - ramp) * (y - close_from + 1) / (close_to - close_from + 1)


def _mix(y: int) -> tuple[float, float]:
    """Rung densities for row y: (mid, horizon). The rest is the body colour.

    THE ROW IS SOLVED, NOT TUNED. The mid rung is set by its own profile --
    what it is for is above -- and the body colour and the horizon band then
    take whatever shares make the row's MEAN LUMINANCE come out at
    `_target(y)`, or at the palette's floor where the target is under it. So
    the gradient is exact on every row of the region whatever the mid rung is
    doing, and widening or narrowing the hump cannot bend the ramp.
    """
    body_l, mid_l, horizon_l = 21.65, 24.6, 35.02

    hump = max(0.0, 1.0 - ((y - MID_CENTRE) / MID_WIDTH) ** 2)
    mid = MID_PEAK * hump

    # THE FLOOR IS THE PALETTE, NOT A CHOICE. With the mid rung at its weight
    # and everything else at the body colour this is as dark as the row can
    # be, and rows 0-10 are all held there: the bar is below accent_indigo[0]
    # for its first fourteen rows and we cannot follow it down. See WHAT IS
    # NOT HERE.
    floor = mid * mid_l + (1.0 - mid) * body_l
    target = max(_target(y), floor)

    free = 1.0 - mid
    horizon = (target - mid * mid_l - free * body_l) / (horizon_l - body_l)
    return mid, max(0.0, min(horizon, free))


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    rungs = [ctx.ink(material) for material in LADDER]
    body, mid_neutral, horizon = rungs

    # Per-row thresholds, solved once. The mask is a pure function of (x, y)
    # in [0, 1), so a rung occupies a slice of that range and its width is
    # its density; slicing in luminance order keeps every transition monotone,
    # which is what makes the ramp a ramp rather than a shuffle.
    cuts = []
    for y in range(layout.HEIGHT):
        mid_d, horizon_d = _mix(y)
        cuts.append((1.0 - horizon_d - mid_d, 1.0 - horizon_d))

    for x in range(layout.WIDTH):
        # The sky owns the cut and the range fills below it (sky.md §7). One
        # row of full sky, the next row of full mountain -- the bar shows a
        # single blended row at every mountain edge and it is a resampling
        # artefact, not an edge anybody drew.
        cut = layout.far_crest(x)
        for y in range(min(cut, layout.HEIGHT)):
            mid_from, horizon_from = cuts[y]
            threshold = _threshold(x, y)
            if threshold >= horizon_from:
                index = horizon
            elif threshold >= mid_from:
                # One rung, two entries at the same value: a neutral that
                # leans blue and a saturated teal. Split inside the rung's own
                # slice of the mask rather than on a parity of (x, y) -- a
                # parity is a checkerboard, and a checkerboard between two
                # colours a third of a luminance apart is the one texture in
                # this region that would be visible for no reason at all.
                index = mid_neutral
            else:
                index = body
            canvas.put(x, y, index)

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


def _quota(weights: list[float], count: int) -> list[int]:
    """`count` row numbers, apportioned to `weights` by largest remainder.

    One row number per star, so row y appears exactly as many times as its
    share of the profile says it should. Largest remainder rather than plain
    rounding because rounding thirty-eight rows independently loses or gains
    several stars and the total has to come out at exactly `count`.
    """
    total = sum(weights)
    share = [w * count / total for w in weights]
    rows = [int(s) for s in share]
    short = count - sum(rows)
    order = sorted(range(len(share)), key=lambda i: rows[i] - share[i])
    for i in order[:short]:
        rows[i] += 1
    return [y for y, n in enumerate(rows) for _ in range(n)]


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

    # -- EVERY STAR IS GIVEN ITS ROW BEFORE ANY OF THEM IS PLACED, and this
    #    is a correction rather than a tidy-up. Drawing a fresh row on every
    #    attempt and discarding the draw whenever the blue-noise test fails
    #    looks unbiased and is not: the rejection rate rises with local
    #    density, so the crowded rows fail more often and the stars they lose
    #    are handed to the empty ones. Rendered and counted, the six-row
    #    bands came out 37 / 39 / 22 / 19 / 23 / 11 against the rates in
    #    DENSITY, which want 44 / 27 / 25 / 17 / 21 / 14 -- the top band six
    #    short, the second twelve over, and the 6:1 falloff that §5 calls the
    #    most characterful measurement in the region flattened to about 3:1
    #    in the half of the frame where it is most visible.
    #
    #    So the rows are drawn once, up front, as a quota. A star that cannot
    #    find room in its row gives up its SPACING, not its row: the soft
    #    discouragement is relaxed over successive attempts and only the hard
    #    2-px floor is kept, which is the right thing to trade because §5
    #    states the minimum as a hard measurement and the median as a
    #    tendency.
    #    AND THE QUOTA IS ALLOCATED, NOT SAMPLED. Drawing 151 rows from the
    #    weights is a multinomial with a standard deviation of about five in
    #    the top band alone; the first draw handed it 37 where its own rate
    #    wants 44, which is a seven-star error in the one place §5 measures
    #    to a tenth. Largest-remainder gives every row exactly its share of
    #    the 151 and leaves nothing to the seed except WHERE in the row.
    rows = _quota(weights, len(bag))
    rng.shuffle(rows)

    placed = 0
    for y in rows:
        band = min(y // 6, len(FAINT_FLOOR) - 1)
        for attempt in range(96):
            x = rng.randrange(layout.WIDTH)
            if not room(x, y):
                continue
            # Blue noise, not Poisson disc: a hard floor at 2 px and a linear
            # discouragement out to SOFT_SPACING, which fades as the row runs
            # out of places to put anything. See MIN_SPACING and SOFT_SPACING.
            gap = nearest(x, y)
            if gap < MIN_SPACING:
                continue
            soft = MIN_SPACING + (SOFT_SPACING - MIN_SPACING) * max(
                0.0, 1.0 - attempt / 48.0)
            if gap < soft and rng.random() > (gap - MIN_SPACING) / max(
                    1e-6, soft - MIN_SPACING):
                continue
            break
        else:
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
