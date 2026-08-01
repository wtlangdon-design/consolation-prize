"""Room 1 — the road surface.

Thirty-five per cent of the play area, and it has ONE job: read as a floor
going away from the viewer, a surface a character is standing *on* rather
than in front of. road.md §1 is unambiguous that there is exactly one
structure in the region that does the receding and it is the rut fan; the
mud, the stones and the water are dressing hung on it. If the fan is wrong
the region fails whatever else is right, and it fails at the legibility
gate, not at lighting.

THE FAN IS A COORDINATE, NOT A SET OF LINES. Everything here — the value
modulation, the water, the grain wavelength — is a function of ONE scalar
field:

    u(x, y) = 316 + (x − 316) · f(y),     f(y) = ((143 − 82) / (y − 82))^0.9

u is "which rut am I on", expressed as the column that rut crosses the
bottom edge at. Three of §3's measurements fall out of that one line and
none of them has to be drawn separately:

  * u is constant along a curve that converges on (316, 82) — §3.1's
    convergence point, layout.RUT_VANISHING, fitted at (315.9, 82.1) from 48
    high-coherence orientation samples.
  * ∂u/∂x = f(y), so a fixed spacing in u is a screen spacing proportional
    to (y − 82) — §3.3's law, the thing that actually makes the band recede.
  * The exponent is 0.9 rather than 1.0, and that IS §3.1's bow. A true
    projective fan is exponent 1 and gives straight ruts; 0.9 pushes each
    chord's midpoint about 4 px toward the bottom-left on a 130 px rut,
    which is 3.2% of chord against a measured 1–3%. §3.1: "small, and the
    entire difference between a curving road and a fan of stripes."

It also fixes §3.3's one disagreement with theory for free. Straight-line
perspective predicts a 7 px crossing spacing at y = 106 and the reference
measures 9–10; the damped exponent gives 7.8.

THE STARTS ARE IRREGULAR ON PURPOSE — §3.2, median 18 px, range 8–31, with
tight pairs at 238/246 and 257/269 that read as one cart having passed
twice. Evenly spaced ruts read as corduroy, which is §10.2. The eleven
measured strong ruts and four faint intermediates are layout's; the fan is
continued outside the measured range with the same irregular statistics,
because the top of the band shows ruts whose bottom-edge column is hundreds
of pixels off the left of the frame and they have to come from somewhere.

THE CROSS-SECTION IS MEASURED OFF THE BAR, not assumed. Binning 26 rows of
open road by distance-in-u from the nearest rut centre gives

    d      −10   −6    −3    −1     0    +2    +4    +7    +9
    L     43.4  40.8  34.8  33.7  34.6  38.0  39.7  42.1  42.1

— a trough about 4 u wide at half depth sitting 9 L below the crest, and
the crest is essentially the whole span between two troughs rather than a
separate 4-6 px plateau. So the profile drawn here is one trough kernel per
rut subtracted from a flat crest, which is what that table is.

THE ROAD GETS DARKER TOWARD THE VIEWER, not lighter: L(y) = 75.4 − 0.291y,
a fall of 10.8 across the band, about two ramp steps, and gentle. It is not
what makes the region recede. It is the fan.

AUTHORED WARM, ALL OF IT, from the start. The lantern pool spans x 50-122
with a lit fringe to x=175 and the lighting pass cannot change hue. §7 of
the whole-frame study: a grey road cannot be made warm afterwards and the
failure only shows up three passes from its cause. The two exceptions are
declared and both are cold on purpose — the left verge below y=118, which
is stone and shadow and outside the pool, and the standing water.

THE POOL IS AUTHORED IN THE FAMILY IT WILL END IN. §6 measures the lamp
pool core as `pine_fresh` 3-6 and `ochre` 8-13; the lighting pass steps a
pixel along its OWN ramp, so a pool core authored in `mud` arrives at mud 15
and never at pine_fresh however bright it gets. The lit zone is therefore
authored pine_fresh-dominant at its UNLIT value, five steps below where the
pass will leave it, with ochre reserved for the dry scatter that becomes
§6's "brightest flecks".

CONTRAST FADES WITH LIGHT, NEVER WITH DEPTH — §3.5 and §10.8. Measured
rut-scale contrast is 3.0–3.7 L std everywhere outside the pool regardless
of distance and 9.7 L inside it. Tapering the corrugation into the distance
is the natural thing to do and it kills the recession exactly where it is
needed most, so the amplitude here is flat in y and scaled by the pool.

THE WATER IS THE RESERVED BAND, and the band moved. road.md §5.1 still says
`sky` 7-9 (indices 152-154) and §5.4 spends a page explaining why that
cannot work: at L 107/115/123 against a rebuilt road at L 32-40 the water
reads as chalk lines, 66 L above the measured 50. The ruling landed:
content/rooms/stage-road.json now declares accent_indigo 2-4 (239-241, L
44/61/74), which is what §5.4 nominated, and layout derives PUDDLE_BAND from
that declaration rather than from any number typed here. Everything else in
§5 stands, including the bounds — no reserved index above y=95.

Water is placed by walking the trough of a rut, never by drawing a line at
an angle: §10.4's failure is water that is horizontal dashes rather than a
thread following the rut's own curve, and the only way to be sure it lies in
the trough and not on the crest is to let the same u field put it there.
"""

from __future__ import annotations

import math

from canvas import IndexedCanvas

from . import layout


#: road.md §8: the top edge of the region is NOT a boundary in the picture.
#: The ground plane runs up past y=94 and is occluded by what stands on it.
#:
#: THE FIELD AND THE FAN STOP AT DIFFERENT ROWS, and the split is what §8
#: actually asks for. The FIELD is authored from the region's own top row,
#: because §4.1's model is fitted on the ROAD SURFACE and extrapolating it
#: upward into the mid ground laid a straight bright horizontal across the
#: full width at y=88; `terrain` ramps up to meet it from the other side.
#: The FAN carries on six rows above the seam anyway, as a modulation of
#: whatever terrain already put there rather than as fresh paint, so the rut
#: rhythm is continuous across a join that has no line in the picture.
FIELD_TOP = layout.ROAD_TOP
FAN_TOP = 88

#: §3.6. Left of this is verge, not road, and it carries no ruts at all;
#: they fade out over the ten columns above it rather than stopping dead.
NO_RUTS_LEFT = layout.ROAD_LEFT_EDGE
RUT_FADE = 12

#: The perspective exponent. 1.0 is the exact projective fan and draws
#: straight ruts; 0.9 is that fan with §3.1's 3% bow already in it. See the
#: module docstring — this is the single most load-bearing constant here.
PERSPECTIVE_EXP = 0.9

#: §3.1's elbow, where the road turns behind the coach and the outermost
#: ruts' tangent reverses sign. Only ruts outboard of ELBOW_U wrap it, and
#: the wrap is an extra leftward push that grows with height above the
#: bottom edge — which is what "runs at −55° at the bottom edge and +40° by
#: the time it clears the elbow" is, written as a displacement.
ELBOW_FROM = 240.0        # screen column the bend starts to bite at
ELBOW_SPAN = 48.0         # and is at full strength by
ELBOW_RISE = 49.0         # rows above the bottom edge over which it grows in
ELBOW_GAIN = 27.0         # px of leftward displacement at full strength

#: §3.5, from the measured cross-section in the docstring. Depths are
#: trough-to-crest in luminance; the crest is flat between troughs.
#: THE TROUGH IS TWO KERNELS, and drawing it as one is what made the first
#: build of this module read as scratches on flat mud. §3.5 gives a 2.5 px
#: half-depth width and that is the CORE; the measured cross-section in the
#: module docstring takes eight to ten u to climb back to the crest, so most
#: of the surface is on a shoulder rather than on a plateau. A single narrow
#: kernel puts 78% of the road at one flat value and hangs a dark line in it,
#: and the fan then carries no shading at all — which is §10.1's flat band
#: wearing a different hat.
TROUGH_CORE = 2.0         # u units; half-depth width 3.3 px against 3.5 measured
TROUGH_SHOULDER = 5.0     # reaches the crest by d = 9-10, as measured
CORE_SHARE = 0.3
DEPTH_STRONG = 20.0       # §3.5: three ramp steps on the strong ruts
DEPTH_TYPICAL = 14.0      # two steps on an ordinary one
DEPTH_FAINT = 7.0         # §3.2's four intermediates, drawn at half strength
CREST_LIFT = 5.5

#: §3.5: "inside the lamp pool the same corrugation is drawn at 2-3x the
#: contrast" — 9.7 L std against 3.0-3.7 everywhere else.
POOL_CONTRAST = 2.2

#: §9's grain, by zone: std 10.5 in the pool, 5.9-6.7 under it, 5.4 mid and
#: near, 4.8 far-left verge, 4.0 right verge. It scales with LIGHT and not
#: with depth, because a lit surface shows its texture and the verge has not
#: enough light on it to show anything.
GRAIN_BASE = 2.0
GRAIN_LIT = 3.6
GRAIN_VERGE = 2.6
#: §9: 3-4 px wide, 1 px tall dashes. The horizontal bias is doing real work
#: — it lies along the ground plane and reinforces the recession, and
#: isotropic noise will not.
DASH_MIN = 3
DASH_MAX = 5

#: §5.2: a typical streak is 1-2 px wide. That is the trough CORE in u, and
#: it is deliberately narrower than the half-depth width the shading uses —
#: water pools in the bottom of the rut, not across it.
WATER_CORE = 1.15

#: §5.3. The pool's bright core carries no water at all. Dry.
DRY_CORE = (70, 100, 48, 18)

#: §5.1. The element's bounds start at y=96, and in practice the water is
#: all at y >= 104 where the road proper begins. A reserved index above that
#: is silently clamped by cycling.reserve(), leaving a hole in the streak.
WATER_TOP = 104

#: §5.2, descending. 42 streaks of 4 px or more, median 10, mean 26. The two
#: largest are chains of segments along a single rut spanning 60-80 px of x.
STREAK_SIZES = (210, 153, 84, 73, 72, 52, 34, 34, 30, 30, 30, 24, 23, 23, 22,
                20, 18, 17, 15, 14, 13, 12, 11, 10, 10, 9, 9, 8, 8, 7, 7, 6,
                6, 6, 5, 5, 5, 5, 4, 4, 4, 4)

#: A STREAK IS NOT ONE UNBROKEN RUN, and that is the whole of the carried-over
#: note on this region. Connected-component counts on the bar, taken inside
#: the road proper and outside the verge:
#:
#:     86 pieces, 1,144 px. FORTY of them are 1-3 px flecks. 46 are four or
#:     more, median 4, mean 13.3. The largest five are 158, 86, 79, 74, 72.
#:
#: The first build of this pass drew 33 pieces of which 31 were four or more
#: — one continuous thread per rut, right across the fan — and that is what
#: reads as sleepers or lane markings: a regular field of bright dashes at a
#: regular pitch. The bar reads as water lying in ruts because most ruts are
#: DRY, the wet ones are wet in bursts, and the bursts are separated by one
#: to four pixels of trough that is not wet.
#:
#: So a lane is walked as a chain of short segments with a 1-4 px dry gap
#: between them, then a long dry run, then another chain. Segment lengths are
#: drawn to the measured PIECE distribution and not to §5.2's streak sizes,
#: because a "streak" in §5.2 is one of these chains and a piece is what the
#: eye resolves at 320x144.
SEG_SHORT = (4, 9)        # 42% of pieces
SEG_MID = (9, 16)         # 38%
SEG_LONG = (16, 26)       # 15%
SEG_CHAIN = (26, 42)      # 5% -- the spans that build §5.3's two chains
CHAIN_GAP = (1, 6)        # dry trough inside a chain
CHAIN_LENGTH = (2, 7)     # segments per chain
LANE_GAP = (18, 78)       # dry run between two chains on one rut

#: §5.3's rightmost thread stops at x=305; past that is verge, and §7's pair
#: of stones is the only thing out there.
WATER_RIGHT_EDGE = 306

#: §5.2 counts about 35 flecks of 1-3 px against the bar's 40, and that count
#: is honest at the bar's saturation and too loud at ours -- see WATER_LANES.
#: A fleck is a single bright chromatic dot on dark mud, which is the most
#: eye-catching thing per pixel that this region can produce. They are placed
#: from the trough register the surface pass builds rather than by rolling
#: coordinates, so a fleck still cannot land on a crest.
FLECKS = 12

#: Which rut each of §5.3's streak groups rides, by bottom-edge column, and
#: HOW WET THAT RUT IS — the second number is the point. §5.3 names three
#: places water actually collects (the two near-left chains, the steep
#: threads around and past the elbow, small dashes on the pool's outskirts)
#: and by implication says everywhere else is damp mud. An equal ration per
#: lane is what turned the fan into corduroy in blue.
#:
#: THE TWO CHAINS ARE SOLVED FOR, NOT GUESSED. §5.3 puts them at x 96-157 /
#: y 119-139 and x 150-230 / y 122-143. Reading the first back through the u
#: field — (87, 139) and (157, 119) both sit on u = 74 — lands on one of
#: §3.2's FAINT intermediates rather than on any of the eleven strong ruts,
#: which is worth knowing: the deepest standing water in the picture is not
#: in the deepest rut. The second solves to u = 148, which is the strong rut
#: at 145. Riding them on 117 and 200 instead, which is what "the two
#: longest ruts" suggests, puts both chains 30 px right of where they were
#: measured.
#: (bottom-edge column, wetness, stretch). THE THIRD NUMBER IS THE ELBOW.
#: §3.4 rotates the ruts from 20 degrees off horizontal at the bottom left to
#: 20 degrees off vertical at the bottom right, and water behaves differently
#: in the two. A shallow rut holds a string of separate lens-shaped pools,
#: because the trough is nearly level and the water finds the low spots along
#: it. A steep one drains, and what stands in it is one continuous ribbon
#: running the whole visible length of the trough — which is exactly what the
#: bar shows past x=240: three or four unbroken threads of 30-40 rows, with
#: broad dry ruts between them. Drawn at the left-hand statistics the right
#: half came out as speckle scattered over every rut, which reads as rain on
#: the lens rather than as water in the road.
#:
#: So `stretch` multiplies the piece length and divides the gap inside a
#: chain: 1.0 on the near-left, 3.0 past the elbow. Wetness stays low there,
#: so the right half gets FEWER wet ruts, each of them continuous.
#: CUT BACK HARD, AND NOT BECAUSE THE COUNT WAS WRONG. Eleven wet lanes put
#: 1,272 px of water in the frame at a median of L 44.4, against the bar's
#: 1,144 at 49.8 -- fewer pixels than the reference and darker. Measured, it
#: was right. Looked at, the ruts had become the loudest thing in the picture
#: and were beating the town for the eye, which is a focal-point error and not
#: a statistics one.
#:
#: THE DIFFERENCE IS CHROMA. The bar's water is (44,49,82), saturation 0.46 --
#: a blue-grey. Our reserved band is accent_indigo 2-4 at saturation 0.55-0.60,
#: because that is where a THREE-ENTRY CYCLING RAMP could be reserved without
#: colliding with anything, not because it is the colour of the water. So each
#: of our pixels carries about a fifth more colour than the reference's, and
#: over a thousand of them spread across the whole lower half that compounds
#: into a blue corduroy. Luminance parity is not parity when the hue differs.
#:
#: There is no way to desaturate inside the band -- it is three fixed entries
#: and they are what the engine cycles. The only control left is HOW MANY
#: PIXELS TAKE IT, so the ration is cut to the four lanes doc 05 actually
#: names as places water collects, and everywhere else is damp mud.
WATER_LANES = ((74, 0.62, 1.0), (145, 0.55, 1.1), (200, 0.40, 1.3),
               (257, 0.22, 3.0))

#: THE VALUE LADDER INSIDE THE RESERVED BAND. accent_indigo 2-4 are L 42.7,
#: 59.1 and 72.0 and the bar's water measures L 49.8 median, p10 37.5, p90
#: 68.6 — so an even round-robin across the three lands the water's median on
#: 59, ten points high, and it goes straight back to being a highlight.
#: §5.4's whole argument is that water is 12-17 L above its mud and not a
#: highlight, and ten points is two of those seventeen.
#:
#: There is no entry at 50. So the value is reached the way a 256-colour
#: artist reaches a value that is not in the ramp: two adjacent entries mixed
#: along the thread. The bar supports it — its water is not one value either,
#: p10 37.5 against p90 68.6 across 1,144 px.
#:
#: THE PER-STREAK PHASE SURVIVES. §5.1's reason for three entries is that
#: each streak sits at a different point in one rotation, so each streak
#: still takes its own PRIMARY from the pattern below and the mix is a
#: minority partner within it. What rotates as a unit is still the streak.
#: Weighted hard toward the band's floor. An even round-robin lands the
#: water's median on 59 -- ten points above the bar's, which turns it back
#: into the highlight §5.4 spends a page arguing it is not. The rotation
#: still visits all three entries, because that is what the engine cycles and
#: an entry nothing paints is an entry that cannot animate; it just visits the
#: top one rarely.
BAND_PATTERN = (0, 0, 0, 1, 0, 0, 0, 0, 1, 2)
BAND_PARTNER = (1, 0, 1)     # who each primary mixes with
BAND_MIX = 3                 # partner takes 3 pixels in 10


# ---------------------------------------------------------------------------
# the fan, as a coordinate field
# ---------------------------------------------------------------------------


_VANISH_X, _VANISH_Y = layout.RUT_VANISHING
_BOTTOM = layout.HEIGHT - 1
_SPAN = float(_BOTTOM - _VANISH_Y)


def _f(y: float) -> float:
    """The perspective scale at a row. 1.0 at the bottom edge, growing up.

    layout.depth_scale is the same law written the other way round and every
    receding thing in the frame divides by it; this is its reciprocal with
    §3.1's bow folded in, and it is used only inside this region.
    """
    return (_SPAN / max(1.0, y - _VANISH_Y)) ** PERSPECTIVE_EXP


def _u_of(x: float, y: float) -> float:
    """Which rut the point (x, y) sits on, as a bottom-edge column."""
    warped = x - _elbow_bend(x, y)
    return _VANISH_X + (warped - _VANISH_X) * _f(y)


def _elbow_bend(x: float, y: float) -> float:
    """§3.1's elbow, as a leftward displacement of the whole fan in SCREEN px.

    §3.1's exception: the two outermost ruts bow 15-23% of chord rather than
    3%, wrap an elbow at (272, 112), and past it their tangent REVERSES —
    x=283 runs at −55° at the bottom edge and +40° once it clears the elbow.
    §3.1 calls it the most distinctive shape in the region, and it is the
    thing that says the road turns rather than merely receding.

    IT HAS TO BE A SCREEN DISPLACEMENT AND NOT A SHIFT IN u. The first
    attempt gated on u and did nothing at all, and the reason is worth
    recording: at the elbow the rut has already bent so far left that its
    UNBENT u is 233 — well inboard of the 270 the gate was testing — so the
    ruts that need the bend are exactly the ones the gate cannot see. The
    displacement is therefore keyed on where the pixel is, x toward the right
    of the band and y up it, and the fan is sampled at the displaced column.
    Both are smooth and monotone, so u stays a single-valued field and the
    water can still be inverted out of it.

    It is an approximation and it is under-bent at the very top: the measured
    +40° tangent wants 58 px of displacement at y=94 where this gives 27. The
    rows above y≈114 are behind the coach and its near wheel (§8) and the
    visible half of the elbow is the half this gets right.
    """
    if x < ELBOW_FROM:
        return 0.0
    reach = min(1.0, (x - ELBOW_FROM) / ELBOW_SPAN) ** 1.5
    height = min(1.0, max(0.0, (_BOTTOM - y) / ELBOW_RISE)) ** 1.5
    return ELBOW_GAIN * reach * height


def _x_of(u: float, y: float) -> float:
    """The screen column of rut `u` at row `y`. Inverts _u_of numerically.

    Two bisection steps on a monotone field are cheaper than carrying an
    analytic inverse of the elbow term, and the water is the only caller.
    """
    lo, hi = -900.0, 900.0
    for _ in range(40):
        mid = 0.5 * (lo + hi)
        if _u_of(mid, y) < u:
            lo = mid
        else:
            hi = mid
    return 0.5 * (lo + hi)


def _rut_centres(ctx: layout.Ctx) -> tuple[tuple[float, float], ...]:
    """(centre in u, trough depth in L) for every rut the band can show.

    §3.2's eleven strong and four faint are layout's and are measured. The
    rest are continuation: at y=94 the visible columns map to u from about
    −780 to +260, so most of what the top of the band shows is ruts whose
    bottom-edge column is off the left of the frame. They are generated with
    §3.2's own statistics — median spacing 18, range 8-31 — so the far half
    of the fan has the same irregular rhythm as the measured half and never
    settles into corduroy.
    """
    centres = [(float(c), DEPTH_STRONG) for c in layout.RUT_STARTS]
    centres += [(float(c), DEPTH_FAINT) for c in layout.RUT_STARTS_FAINT]

    rng = ctx.stream("road.fan")
    cursor = float(min(layout.RUT_STARTS_FAINT))
    while cursor > -820.0:
        cursor -= rng.randrange(8, 32)
        centres.append((cursor, DEPTH_TYPICAL if rng.random() > 0.3
                        else DEPTH_FAINT))
    cursor = float(max(layout.RUT_STARTS))
    while cursor < 360.0:
        cursor += rng.randrange(8, 32)
        centres.append((cursor, DEPTH_TYPICAL))
    centres.sort()
    return tuple(centres)


def _profile(centres, index: int, u: float) -> tuple[float, int, float]:
    """Rut modulation at a point, the nearest rut, and the distance to it.

    Two trough kernels per rut subtracted from a flat crest, which is the
    measured cross-section in the module docstring. Returns (dL, nearest,
    gap-in-u), and the third is what the water uses: §5's water lies in the
    trough and never on the crest, and the trough it means is the 2.5 px CORE
    and not the shoulder the shading rides on. Testing the shading value
    instead puts water across half the road.
    """
    deepest = 0.0
    nearest, best = index, None
    for step in (-2, -1, 0, 1, 2):
        probe = index + step
        if not 0 <= probe < len(centres):
            continue
        centre, depth = centres[probe]
        gap = abs(u - centre)
        if best is None or gap < best:
            nearest, best = probe, gap
        if gap < 3.0 * TROUGH_SHOULDER:
            cut = depth * (
                CORE_SHARE * math.exp(-(gap / TROUGH_CORE) ** 2)
                + (1.0 - CORE_SHARE) * math.exp(-(gap / TROUGH_SHOULDER) ** 2))
            deepest = max(deepest, cut)
    return CREST_LIFT - deepest, nearest, (best or 0.0)


def _bracket(centres, u: float, hint: int) -> int:
    """Index of the rut nearest `u`, walked from a hint. Rows are scanned in
    x order, so the hint is almost always right or one out."""
    index = min(max(hint, 0), len(centres) - 1)
    while index + 1 < len(centres) and centres[index + 1][0] <= u:
        index += 1
    while index > 0 and centres[index][0] > u:
        index -= 1
    return index


# ---------------------------------------------------------------------------
# materials -- the value ladder, and which family a pixel is authored in
# ---------------------------------------------------------------------------
#
# §6's per-zone family table, as weights. The lighting pass steps a pixel
# along its OWN ramp, so the family a pixel is authored in decides where it
# ends up as much as its value does, and the mix is what gives the surface
# its chroma variation without any of it being noise.

_ZONES: dict[str, tuple[tuple[str, int, int, float], ...]] = {
    # Lamp pool core and lit fringe: pine_fresh 3-6 (38%) and ochre 8-13
    # (35%) AFTER the pass, so authored five steps below that.
    "lit": (("pine_fresh", 0, 5, 0.50), ("mud", 2, 9, 0.32),
            ("ochre", 0, 4, 0.10), ("umber", 3, 8, 0.08)),
    # §6 mid road: mud 5-7 (27%), umber 4-5 (22%), pine_fresh 2-3 (17%),
    # grey 1-4. grey is the only low-chroma entry in the open road and it is
    # what stops the mud reading as one colour.
    "mid": (("mud", 2, 9, 0.34), ("umber", 2, 8, 0.30),
            ("pine_fresh", 0, 3, 0.20), ("grey", 0, 4, 0.16)),
    # §6 near road: umber 4-5 (29%), mud 5-7 (21%), grey 1-3,
    # pine_weathered 1-2. Cooler and lower-chroma than the mid road.
    "near": (("umber", 2, 8, 0.38), ("mud", 2, 9, 0.26),
             ("grey", 0, 4, 0.20), ("pine_weathered", 0, 4, 0.16)),
    # §6 dark left verge: grey 0-1 (47%), pine_weathered 0-1 (27%),
    # dust 0-1, umber 0-5. Near-black, chroma almost gone. §4.3's third
    # falloff lives here and it is the one place on this plane the lantern
    # never reaches, so nothing is lost by authoring it cold.
    "verge": (("grey", 0, 3, 0.44), ("pine_weathered", 0, 2, 0.26),
              ("dust", 0, 2, 0.12), ("umber", 0, 5, 0.18)),
    # §6 right verge: umber 4-5 (32%), pine_weathered 0-1 (23%), mud 5-6,
    # grey 1-3. Flatter and stonier than the road it borders.
    "right": (("umber", 2, 7, 0.34), ("pine_weathered", 0, 3, 0.24),
              ("mud", 3, 8, 0.24), ("grey", 0, 3, 0.18)),
}


#: How far off the requested luminance a family may be and still be allowed
#: to carry the pixel. THE FAMILY MIX IS CHROMA, NOT NOISE, and this is the
#: constant that keeps the difference. Choosing among four families by weight
#: alone and then taking each one's nearest step costs up to half a ramp step
#: of value error per pixel — `pine_fresh` moves nine luminance points at a
#: time and `grey` eight — and that error is uncorrelated between neighbours,
#: so it arrives as 1-px noise. The first build measured a 1-px residual of
#: 7.1 against the bar's 4.6 with §9's grain already turned down to half:
#: almost all of the excess was the family draw. Two and a half points is
#: under half a `mud` step, which is the smallest move anything here makes.
FAMILY_TOLERANCE = 2.5


def _build_ladders(palette) -> dict[str, tuple[tuple[float, tuple, float], ...]]:
    """Per zone: (family entries sorted by luminance, weight)."""
    built: dict[str, tuple] = {}
    for zone, families in _ZONES.items():
        table = []
        for family, low, high, weight in families:
            ramp = palette.family(family)
            entries = tuple(sorted(
                (palette.luminance(ramp.at(step)), ramp.at(step))
                for step in range(low, high + 1)))
            table.append((entries, weight))
        built[zone] = tuple(table)
    return built


def _nearest(entries, target: float) -> tuple[int, float]:
    best, gap = entries[0][1], None
    for luminance, index in entries:
        distance = abs(luminance - target)
        if gap is None or distance < gap:
            best, gap = index, distance
        elif luminance > target:
            break
    return best, (gap or 0.0)


def _pick(ladder, roll: float, target: float) -> int:
    """The index for a luminance, in a family chosen by the zone's weights.

    §6 gives every zone three or four families and the mix is what stops the
    mud reading as one colour. It is applied as a preference and not as a
    lottery: a family only gets the pixel if it can hit the value within
    FAMILY_TOLERANCE, so the surface keeps its chroma variation and the
    variation stops being a source of grain.
    """
    options = []
    floor = None
    for entries, weight in ladder:
        index, error = _nearest(entries, target)
        options.append((index, error, weight))
        floor = error if floor is None else min(floor, error)

    total = 0.0
    for _, error, weight in options:
        if error <= floor + FAMILY_TOLERANCE:
            total += weight
    cursor = roll * total
    for index, error, weight in options:
        if error > floor + FAMILY_TOLERANCE:
            continue
        cursor -= weight
        if cursor <= 0.0:
            return index
    return options[0][0]


def _pick_lit(palette, ladder, roll: float, wanted: float, applied: float) -> int:
    """The index that lands on `target + excess` AFTER the lighting pass.

    THE PASS IS CALIBRATED FOR ONE FAMILY AND THE POOL IS AUTHORED IN FOUR.
    lightpass converts an excess to `excess / 6` steps, and six luminance
    points is a `mud` step; a `pine_fresh` step is nine and an `ochre` step
    five. Authoring the pool naively in the families §6 measures therefore
    overshoots — the first build of this pass put the pool core at mean L 90
    against the bar's 73, entirely because half of it was pine_fresh being
    stepped at nine points a time by a pass that thought it was spending six.

    Two ways out. Restrict the pool to `mud` and lose §6's chroma census, or
    author each pixel at whatever step in its OWN family arrives at the right
    place. This is the second: it walks each candidate forward by the number
    of steps the pass will apply and keeps the one that lands nearest. §6's
    families survive, the value survives, and the arithmetic stays where the
    two facts meet instead of being split across two files.
    """
    steps = int(applied / 6.0)

    def landing(index: int) -> float:
        landed = index
        for _ in range(steps):
            nxt = palette.lighten(landed, 1)
            if nxt == landed or layout.keep(nxt) or palette.luminance(nxt) > 126.0:
                break
            landed = nxt
        return palette.luminance(landed)

    options = []
    floor = None
    for entries, weight in ladder:
        best, gap = entries[0][1], None
        for _, index in entries:
            distance = abs(landing(index) - wanted)
            if gap is None or distance < gap:
                best, gap = index, distance
        options.append((best, gap, weight))
        floor = gap if floor is None else min(floor, gap)

    total = 0.0
    for _, error, weight in options:
        if error <= floor + FAMILY_TOLERANCE:
            total += weight
    cursor = roll * total
    for index, error, weight in options:
        if error > floor + FAMILY_TOLERANCE:
            continue
        cursor -= weight
        if cursor <= 0.0:
            return index
    return options[0][0]


# ---------------------------------------------------------------------------
# the light this region is authored under
# ---------------------------------------------------------------------------


#: road.md §4.2's pool, fitted to the EXCESS TABLE in that section and not to
#: hob.md §5's absolute pool. The two are different measurements of the same
#: light and they disagree by the whole road ambient — see _pool_factor.
#:
#:   peak +51 L at (92, 108); half at 44 px horizontally and 8 rows
#:   vertically, which is §4.2's "much wider than tall" written as numbers.
#:
#: Check against the measured row y=106: x=112 predicts 38 against 41, x=128
#: 26 against 30, x=144 18 against 13, x=176 9 against 4. Fat in the last
#: 30 px of the tail and right everywhere the pool is legible.
POOL_PEAK = 51.0
POOL_HALF = 7.0
#: §4.2: HARD-EDGED ON THE LEFT, SOFT EVERYWHERE ELSE — "do not make the pool
#: symmetric", and one width for both sides is exactly that. The excess table
#: reaches +4 at x=176, 84 px right of the origin, and is already down to +17
#: at x=64, 22 px left of it: the two sides differ by a factor of two and a
#: half in reach, and the ratio is the whole reason the pool sits against the
#: post rather than floating on the road.
#:
#: Measured against §4.2's y=106 row with these two widths: x=64 predicts 25
#: against 17, x=80 44 against 51, x=112 36 against 41, x=128 26 against 30,
#: x=144 19 against 13, x=176 8 against 4. The left half was 18 too high at
#: x=64/y=116 with a single width and is 6 too high now, and the block-diff
#: against the bar over x 52-78, y 106-118 came down from +21..+28 with it.
POOL_WIDTH = 6.5
POOL_WIDTH_LEFT = 3.2
#: The origin follows layout.POOL_CENTRE's x rather than the excess table's
#: apparent peak: the table is sampled every 16 px and reports +51 at both
#: x=80 and x=96, so its peak is a plateau and the centre of that plateau is
#: 88, not 92. Two pixels off the contract's 86 is inside the sampling.
POOL_ORIGIN = (86, 108)
#: §4.2: hard-edged on the left, cut at x 58-62 by the sign post standing
#: there, and soft for 90 px to the right. Do not make it symmetric.
#:
#: THE NUMBERS ARE NO LONGER HELD HERE. They were 50.0 and 62.0 -- a private
#: copy of layout.POOL_CUT_DEAD_X and POOL_CUT_FULL_X, identical at the time
#: and therefore invisible. The contract has since given the cut a shear,
#: because the post casting it stands between the lamp and the near ground
#: and its shadow widens toward the viewer; the copy did not get it, so
#: `measured` here kept lighting x 62-80 at rows 106-120 while
#: `pool_excess` had already stopped. That band composited +16 to +26 over
#: the bar and is the residual left after the contract was fixed. Two copies
#: of one number is the exact failure the shared contract exists to prevent,
#: so this reads the contract.


def _pool_factor(x: float, y: float, lamp_drift: int) -> tuple[float, float, float]:
    """(0-1 how lit, what road.md §4.2 says lands here, what lightpass will add).

    THREE things on this surface are authored by light rather than by depth:
    §3.5's rut contrast, which triples inside the pool, §9's grain, which is
    twice as strong there because a lit surface shows its texture, and §2's
    dry scatter, which is densest in the same place. All three take the first
    number. The third number exists only so the pool can be authored at the
    value that survives the pass — see _pick_lit.

    THE TWO POOLS AGREE NOW, AND THE THIRD NUMBER IS NO LONGER GUESSED AT.
    hob.md §5 fits the pool as an ABSOLUTE ground luminance and §4.2 fits the
    same light as an EXCESS OVER THE DEPTH MODEL; the two differ by the
    road's own ambient, and lightpass used to add the absolute on top of a
    road this module had already authored at 44, reaching 141 where the
    reference reaches 122. That is fixed at the contract: layout.pool_excess
    is §5's absolute less §4.1's depth model at that row, it is the ONE
    implementation, and this line and the lighting pass now call it. The
    compensation below therefore lands where §4.2 says it should instead of
    chasing a number a second file computed differently.
    """
    origin_x = POOL_ORIGIN[0] + lamp_drift
    dx = (x - origin_x) / (POOL_WIDTH if x >= origin_x else POOL_WIDTH_LEFT)
    dy = y - POOL_ORIGIN[1]
    rho = math.hypot(dx, dy)
    measured = POOL_PEAK / (1.0 + (rho / POOL_HALF) ** 2)

    applied = layout.pool_excess(x, y, lamp_drift)

    shear = min(layout.POOL_CUT_SHEAR_MAX,
                layout.POOL_CUT_SHEAR
                * max(0.0, y - layout.POOL_CUT_SHEAR_FROM_Y))
    dead = layout.POOL_CUT_DEAD_X + shear + lamp_drift
    full = layout.POOL_CUT_FULL_X + shear + lamp_drift
    if x < full:
        measured *= max(0.0, (x - dead) / (full - dead))
    # And the same top edge the contract gives the excess: above the road's
    # near plane there is valley floor, not road, and the lamp does not
    # reach it. Without this the authored pool climbs eight rows past the
    # lit one and the two disagree along their whole upper edge.
    if y < layout.POOL_TOP_FULL_Y:
        if y <= layout.POOL_TOP_DEAD_Y:
            measured = 0.0
        else:
            walk = ((y - layout.POOL_TOP_DEAD_Y)
                    / (layout.POOL_TOP_FULL_Y - layout.POOL_TOP_DEAD_Y))
            measured *= walk * walk
    return min(1.0, measured / 30.0), measured, applied


def _verge_drop(x: float, y: float) -> float:
    """§4.3's third falloff: the shadowed verge under the building.

    A wedge, not a rectangle, sitting 10 to 27 L below the depth model and
    pulling the bottom-left corner to L 14-24. §8: neither this region nor
    whoever owns the clutter left of x=60 should try to carry a visible edge
    there — both just go dark.
    """
    x0, y0, width, height = layout.VERGE_FALLOFF
    if y < y0 - 10:
        return 0.0
    # §4.3 states the strip as x 0-70 FOR y 118-144, and the first build read
    # that as a wedge whose reach only arrives at 70 by the bottom row: at
    # y=124 it covered x<54 and left x 60-70 sitting on the open-road model.
    # The bar has that corner at L 15-27 against a model of 40, which is
    # §4.3's "10 to 27 L below" exactly, so the wedge opens to its full width
    # by y=120 and holds it, and only its DEPTH goes on growing after that.
    deep = min(1.0, max(0.0, (y - (y0 - 10)) / 12.0))
    reach = width * (0.37 + 0.63 * deep)
    if x >= reach:
        return 0.0
    edge = min(1.0, (reach - x) / 16.0)
    gain = 10.0 + 17.0 * min(1.0, max(0.0, (y - (y0 - 10)) / 30.0))
    return gain * edge


# ---------------------------------------------------------------------------
# draw
# ---------------------------------------------------------------------------


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    centres = _rut_centres(ctx)
    ladders = _build_ladders(ctx.palette)
    _seam(canvas, ctx, centres)
    troughs = _surface(canvas, ctx, centres, ladders)
    _scatter(canvas, ctx)
    _stones(canvas, ctx, ladders)
    _water(canvas, ctx, troughs)


#: How often a dash carries down into the row below. 0 gives §9's horizontal
#: run and a vertical run of 1; 1 would give columns. One in two lands the
#: mean vertical run on 2.0, which is what the bar measures.
GRAIN_CARRY = 0.5


def _grain_row(rng, previous: list[float] | None) -> list[float]:
    """One row of §9's dash field: 3-5 px wide, 1 px tall, scattered.

    Never an ordered screen — §9 counts no Bayer, no checkerboard and no
    regular 50% pattern in the bar, and a regular screen at 320x144 reads as
    a fabric swatch. The dash boundaries are rolled, the amplitudes are
    gaussian, and the only structure is the carry into the next row.
    """
    row = [0.0] * layout.WIDTH
    x = 0
    while x < layout.WIDTH:
        if previous is not None and rng.random() < GRAIN_CARRY:
            # Inherit the dash the row above has at this column, for as long
            # as that dash runs. The carried dash keeps its own extent, so
            # the two rows share an edge rather than a grid.
            amplitude = previous[x]
            span = 1
            while (x + span < layout.WIDTH
                   and previous[x + span] == amplitude
                   and span < DASH_MAX):
                span += 1
        else:
            span = rng.randrange(DASH_MIN, DASH_MAX)
            amplitude = rng.gauss(0.0, 1.0)
        for k in range(span):
            if x + k < layout.WIDTH:
                row[x + k] = amplitude
        x += span
    return row


def _surface(canvas: IndexedCanvas, ctx: layout.Ctx, centres, ladders):
    """Layers 1-3 in one pass: value field, rut fan, mud grain.

    §2 says each layer modulates what is under it and nothing here is a decal
    on a flat fill, so they are one arithmetic expression per pixel and only
    the result is quantised. Quantising three times over would put two extra
    rounding errors into a band whose whole rut amplitude is two ramp steps.
    """
    palette = ctx.palette
    drift = ctx.lamp[0] - layout.FLAME_CENTRE[0]
    rng = ctx.stream("road.grain")
    trough_rows: dict[int, list[tuple[int, int]]] = {}

    previous: list[float] | None = None

    for y in range(FIELD_TOP, layout.HEIGHT):
        base = layout.road_luminance(y)
        near = y >= 132
        hint = 0
        # §9's grain is ANISOTROPIC, and both numbers matter. Same-sign
        # residual runs average 3.5 px horizontally against 2.0 px
        # VERTICALLY, and lag-1 autocorrelation is +0.46..+0.69 in x against
        # −0.09..+0.26 in y. The first build honoured the first number and
        # rolled a fresh dash every row, which gives a vertical run of
        # exactly 1: at 4x that reads as scan lines over the mud rather than
        # as mud. So a dash carries down into the next row half the time,
        # which lands the vertical run on 2 and the y autocorrelation inside
        # the measured range without ever building a block — a carried dash
        # is one dash deep, not a column.
        row = _grain_row(rng, previous)
        previous = row
        for x in range(layout.WIDTH):
            lit, measured, applied = _pool_factor(x, y, drift)
            dash = row[x]

            drop = _verge_drop(x, y)
            # THE ZONES MUST NOT HAVE EDGES. §9 counts exactly two hard edges
            # in this region — the stones' top highlight and the pool's left
            # cut — and a zone boundary drawn as a column at x=56 adds a
            # third, running the full height of the band and visible as a
            # change of family rather than of value. So the verge is chosen
            # by how deep §4.3's falloff already is at this pixel, which is a
            # smooth function, and the boundary lands wherever the shading
            # has already put it.
            if drop > 11.0:
                zone = "verge"
            elif x > layout.ROAD_RIGHT_EDGE:
                zone = "right"
            elif lit > 0.18:
                zone = "lit"
            else:
                zone = "near" if near else "mid"

            target = base - drop

            fade = min(1.0, max(0.0, (x - NO_RUTS_LEFT) / RUT_FADE + 0.35))
            if fade > 0.0:
                u = _u_of(x, y)
                hint = _bracket(centres, u, hint)
                modulation, nearest, gap = _profile(centres, hint, u)
                target += modulation * fade * (1.0 + POOL_CONTRAST * lit)
                if (gap < WATER_CORE and fade > 0.9
                        and centres[nearest][1] > DEPTH_FAINT):
                    trough_rows.setdefault(nearest, []).append((x, y))

            grain = GRAIN_VERGE if zone == "verge" else GRAIN_BASE
            target += dash * (grain + GRAIN_LIT * lit)

            roll = rng.random()
            if zone == "lit":
                canvas.put(x, y, _pick_lit(palette, ladders[zone], roll,
                                           target + measured, applied))
            else:
                canvas.put(x, y, _pick(ladders[zone], roll, target))

    return trough_rows


def _seam(canvas: IndexedCanvas, ctx: layout.Ctx, centres) -> None:
    """The fan, continued six rows above the region's own top edge.

    §8: the top edge of the road is not a boundary in the picture, the ground
    runs up past y=94 and is occluded by whatever stands on it, and a road
    drawn as a self-contained band shows a step at the seam in both the value
    gradient and the rut spacing. `terrain` owns the value up there, so the
    fan is applied to what it drew as a step along each pixel's own family
    rather than as fresh paint — the one operation that cannot introduce a
    hue the mid ground did not already have.
    """
    palette = ctx.palette
    hint = 0
    for y in range(FAN_TOP, FIELD_TOP):
        hint = 0
        for x in range(NO_RUTS_LEFT, layout.ROAD_RIGHT_EDGE + 1):
            index = canvas.get(x, y)
            if layout.keep(index):
                continue
            u = _u_of(x, y)
            hint = _bracket(centres, u, hint)
            modulation, _, _ = _profile(centres, hint, u)
            steps = int(round(modulation / 5.0))
            if steps > 0:
                canvas.put(x, y, palette.lighten(index, steps))
            elif steps < 0:
                canvas.put(x, y, palette.darken(index, -steps))


# ---------------------------------------------------------------------------
# dry scatter -- §2 layer 4
# ---------------------------------------------------------------------------


def _scatter(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    """1-2 px pale gravel flecks and darker clods, about a ramp step either way.

    §2: densest inside the lamp pool, which is §9's rule again — a lit
    surface shows its texture. The pale ones are what §6 counts as `ochre`
    8-13 in the pool core; they get there by being authored in ochre and
    lifted with everything else.
    """
    palette = ctx.palette
    rng = ctx.stream("road.scatter")
    drift = ctx.lamp[0] - layout.FLAME_CENTRE[0]

    for _ in range(2200):
        x = rng.randrange(NO_RUTS_LEFT, 302)
        y = rng.randrange(FIELD_TOP, layout.HEIGHT)
        lit = _pool_factor(x, y, drift)[0]
        if rng.random() > 0.05 + 0.55 * lit:
            continue
        index = canvas.get(x, y)
        if layout.keep(index):
            continue
        pale = rng.random() < 0.62
        canvas.put(x, y, palette.lighten(index, 1) if pale
                   else palette.darken(index, 1))
        if rng.random() < 0.35:
            canvas.put(x + 1, y, palette.lighten(index, 1) if pale
                       else palette.darken(index, 1))


# ---------------------------------------------------------------------------
# stones -- §2 layer 5
# ---------------------------------------------------------------------------


def _stones(canvas: IndexedCanvas, ctx: layout.Ctx, ladders) -> None:
    """§7. Half-buried, always wider than tall, and grey rather than brown.

    What makes a stone at 4x2 px is the 1 px pale top edge and the drop in
    CHROMA — saturation 0.20 against the mud's 0.48. A brown blob 8 L lighter
    than the mud is a light patch of mud, which is §10.7's failure. So the
    body is picked from `grey` at the LOCAL mud's value plus §7's measured
    +8 L, not at a fixed step: the same stone is L 30-40 out on the verge and
    L 47-53 in the mid road, and a fixed step would be invisible in one place
    and a beacon in the other.
    """
    palette = ctx.palette
    rng = ctx.stream("road.stones")
    grey = palette.family("grey")

    def grey_at(target: float) -> int:
        best, gap = grey.at(0), None
        for step in range(grey.count):
            distance = abs(palette.luminance(grey.at(step)) - target)
            if gap is None or distance < gap:
                best, gap = grey.at(step), distance
        return best

    def size() -> tuple[int, int]:
        """§7's measured distribution: median 4x2, p90 10x4, largest 13x5.

        Drawn as a distribution rather than as a range because a uniform
        3..10 has a median of 6 and no small ones, and the small ones are
        most of them — a verge of nothing but p90 stones reads as rubble.
        """
        roll = rng.random()
        if roll < 0.55:
            return 3 + rng.randrange(2), 1 + rng.randrange(2)
        if roll < 0.88:
            return 5 + rng.randrange(3), 2
        return 9 + rng.randrange(5), 3 + rng.randrange(2)

    def stone(x: int, y: int) -> None:
        width, height = size()
        local = palette.luminance(canvas.get(x + width // 2, y + height - 1))
        body = grey_at(local + 4.0)
        canvas.rect(x, y, width, height, body)
        # A stone is half-buried and lit from above, so its own top row is a
        # step brighter than its face before the highlight goes on at all.
        if height > 1:
            canvas.hline(x, y, width, grey_at(local + 8.0))
        # The 1 px pale cool highlight along the top edge IS the stone. §9:
        # remove it and the stone is a smudge. It is inset by a pixel at each
        # end, so the stone has a shoulder rather than a square corner.
        canvas.hline(x + 1, y - 1, max(1, width - 2), grey_at(local + 12.0))
        # Below the body, the darkest value available, for the seat.
        canvas.hline(x + 1, y + height, max(1, width - 2), palette.darken(body, 3))

    # §7: heavily front-loaded to the left — 14 of 31 in x 0-39, dense enough
    # to read as a stony verge rather than as scattered cobbles.
    for _ in range(14):
        stone(rng.randrange(1, 40), rng.randrange(119, layout.HEIGHT - 3))
    for _ in range(4):
        stone(rng.randrange(40, 78), rng.randrange(120, layout.HEIGHT - 3))
    # §7: the mid-road singles are lone cobbles kicked out of the ruts and
    # they should stay lonely.
    for _ in range(11):
        stone(rng.randrange(90, 260), rng.randrange(112, layout.HEIGHT - 3))
    # §7: a pair in the far right verge, on the far side of the track.
    for _ in range(2):
        stone(302 + rng.randrange(12), 116 + rng.randrange(22))


# ---------------------------------------------------------------------------
# standing water -- the reserved band, and nothing else in the frame
# ---------------------------------------------------------------------------


def _trace(u: float) -> list[tuple[int, int]]:
    """Every pixel a rut's trough passes through, bottom edge upward, in order.

    WALKED, NOT ROW-SAMPLED. §3.4 has the ruts within 20° of HORIZONTAL at
    the bottom left of the band — one sample per row there leaves 6 px gaps
    between consecutive samples and the water comes out as a row of dashes,
    which is exactly §10.4's failure written in the shape of a bug. So the
    curve is sampled at half a row and rasterised as a connected chain, and a
    streak is then a run of consecutive chain pixels however the rut lies.
    """
    chain: list[tuple[int, int]] = []
    previous: tuple[int, int] | None = None
    step = 0.5
    y = float(layout.HEIGHT - 1)
    while y >= FIELD_TOP - 2:
        point = (int(round(_x_of(u, y))), int(round(y)))
        if previous is not None and point != previous:
            span = max(abs(point[0] - previous[0]), abs(point[1] - previous[1]))
            for i in range(1, span):
                chain.append((previous[0] + round((point[0] - previous[0]) * i / span),
                              previous[1] + round((point[1] - previous[1]) * i / span)))
        if point != previous:
            chain.append(point)
            previous = point
        y -= step
    return chain


#: THICKNESS, MEASURED, because "1-2 px wide" is the one number in §5 that
#: does not survive contact with the bar. Run lengths through the bar's water
#: mask, counted down each column:
#:
#:     1 px: 257 runs   2 px: 198   3 px: 93   4 px: 30   5 px: 12   6 px: 3
#:     mean 1.92, median 2. Across each row instead: mean 3.47, median 3.
#:
#: The first build measured 1.23 / median 1 — a one-pixel staircase — and at
#: 4x that is the difference between a puddle and a pencil line. §9 is still
#: right that a thread of constant three turns the road into a river; what
#: the bar actually does is TAPER. A piece is one pixel at each end, swells
#: to two or three across its middle, and the swell grows toward the viewer
#: with the trough it is lying in. That taper is why the reference water
#: reads as lens-shaped pools strung along a rut and the first build read as
#: a dashed line ruled along one.
SWELL_NEAR = 1.9          # extra pixels at the bottom edge, before wetness
SWELL_FAR = 0.55          # and at the top of the band
SWELL_WET = (0.55, 0.65)  # a dry rut holds a thinner film than a wet one


def _lay(wet, ink, segment, wetness: float, rng) -> None:
    """Paint one piece with a body: 1 px at the ends, 2-3 px at the middle.

    The thickening goes ACROSS the rut, and which screen axis that is depends
    on where in the fan the rut lies — §3.4 has them within 20 deg of
    horizontal at the bottom left and within 20 deg of vertical at the bottom
    right. So the local direction is read off the chain itself and the swell
    is laid perpendicular to it. Thickening in a fixed axis puts the extra
    pixels ALONG the steep ruts on the right, which lengthens them instead of
    widening them and is invisible except as a longer line.

    It grows on one side only, the near side. §3.5's cross-section is
    asymmetric — crest, trough, water line, next crest — so the water sits
    against the near wall of its rut rather than centred in it, and a
    symmetric swell reads as a tube.
    """
    count = len(segment)
    if not count:
        return
    for i, (x, y) in enumerate(segment):
        nxt = segment[min(i + 1, count - 1)]
        prv = segment[max(i - 1, 0)]
        steep = abs(nxt[1] - prv[1]) > abs(nxt[0] - prv[0])
        bulge = math.sin(math.pi * (i + 0.5) / count) ** 0.45
        near = layout.depth_scale(y)
        swell = (SWELL_FAR + (SWELL_NEAR - SWELL_FAR) * near) * (
            SWELL_WET[0] + SWELL_WET[1] * wetness)
        thick = 1 + int(bulge * swell + rng.random() * 0.6)
        for k in range(thick):
            if steep:
                wet(x + k, y, ink(x + k, y))
            else:
                wet(x, y + k, ink(x, y + k))


def _water(canvas: IndexedCanvas, ctx: layout.Ctx, troughs) -> None:
    """§5. In the troughs, following the rut's curve, 1-2 px wide.

    The lanes are the eleven measured ruts and the path is the same u field
    the shading uses, so the water cannot land on a crest or between two ruts
    — §10.4's two failures — however the fan is retuned later. Each lane is
    walked from the bottom edge up and cut into streaks with gaps, to §5.2's
    measured size distribution: 42 streaks of 4 px or more, median 10, mean
    26, the two largest chains of segments spanning 60-80 px of x.

    EACH STREAK TAKES A DIFFERENT ONE OF THE THREE reserved indices in turn.
    One rotation then shows each streak at a different point in the cycle,
    which is where the per-puddle phase offset comes from at no extra palette
    cost. That is how the technique did it in 1990 and it is why the element
    declares three entries rather than one. §5.2 asks for the two largest
    streaks to be hand-placed on DIFFERENT indices, so the two chains take
    band entries 0 and 1 and the round-robin starts after them.
    """
    rng = ctx.stream("road.water")
    band = layout.PUDDLE_BAND
    dry_x, dry_y, dry_w, dry_h = DRY_CORE
    bounds_x, bounds_y, bounds_w, bounds_h = layout.PUDDLE_BOUNDS

    painted: set[tuple[int, int]] = set()

    def wet(x: int, y: int, index: int) -> int:
        if y < WATER_TOP or x < 0 or x >= WATER_RIGHT_EDGE:
            return 0
        if dry_x <= x < dry_x + dry_w and dry_y <= y < dry_y + dry_h:
            return 0
        if not (bounds_x <= x < bounds_x + bounds_w
                and bounds_y <= y < bounds_y + bounds_h):
            return 0
        canvas.put(x, y, index)
        painted.add((x, y))
        return 1

    def piece() -> int:
        """One unbroken run, to the bar's measured piece distribution."""
        roll = rng.random()
        if roll < 0.42:
            lo, hi = SEG_SHORT
        elif roll < 0.80:
            lo, hi = SEG_MID
        elif roll < 0.95:
            lo, hi = SEG_LONG
        else:
            lo, hi = SEG_CHAIN
        return rng.randrange(lo, hi)

    slot = 0
    for start, wetness, stretch in WATER_LANES:
        chain = _trace(float(start))
        cursor = rng.randrange(0, 10)
        while cursor < len(chain):
            # A CHAIN, not a ribbon: two to six pieces with nothing or a few
            # pixels of dry trough between them, and then a long dry run
            # before the rut is wet again. Both spacings scale with the
            # lane's wetness, and that is what makes §5.2's two largest
            # streaks CHAINS spanning 60-80 px of x while a rut §5.3 does not
            # name carries one burst and then nothing: on the wettest lanes
            # the inner gap closes to nothing and the pieces fuse, on the
            # driest it opens to four and they read as separate dashes.
            primary = BAND_PATTERN[slot % len(BAND_PATTERN)]
            index = band[primary]
            other = band[BAND_PARTNER[primary]]

            def ink(x: int, y: int) -> int:
                return other if (x * 3 + y * 5) % 10 < BAND_MIX else index

            for _ in range(rng.randrange(*CHAIN_LENGTH)):
                run = int(piece() * stretch)
                if wetness > 0.8:
                    run += rng.randrange(0, 14)
                segment = chain[cursor:cursor + run]
                _lay(wet, ink, segment, wetness, rng)
                cursor += run + int(rng.randrange(*CHAIN_GAP)
                                    * (1.15 - wetness) / stretch)
                if cursor >= len(chain):
                    break
            gap_lo, gap_hi = LANE_GAP
            cursor += int(rng.randrange(gap_lo, gap_hi) / max(0.24, wetness))
            slot += 1

    # §5.2's ~35 flecks of 1-3 px. Drawn from the trough register the surface
    # pass built, so every one of them lies in the bottom of a rut — which is
    # what separates a fleck of standing water from a speck of noise. They
    # are half of the bar's piece count and 5% of its water mass, and they
    # are what stops the wet ruts reading as the only wet thing in the frame.
    seats: list[tuple[int, int]] = []
    for run in troughs.values():
        seats.extend(p for p in run if p[1] >= WATER_TOP)
    rng.shuffle(seats)

    def lonely(x: int, y: int) -> bool:
        """A fleck has to be ISOLATED or it is not a fleck, it is a gap that
        got filled in. Half the bar's water pieces are 1-3 px and they are
        what says the whole surface is wet rather than four ruts being wet;
        dropped next to an existing thread they merge into it and the count
        does not move."""
        for dy in range(-3, 4):
            for dx in range(-4, 5):
                if (x + dx, y + dy) in painted:
                    return False
        return True

    placed = 0
    for x, y in seats:
        if placed >= FLECKS:
            break
        if not lonely(x, y):
            continue
        index = band[BAND_PATTERN[(slot + placed) % len(BAND_PATTERN)]]
        if not wet(x, y, index):
            continue
        placed += 1
        if rng.random() < 0.5:
            wet(x + 1, y, index)
        if rng.random() < 0.2:
            wet(x + 2, y, index)

    # §5.3: two or three lone flecks out on the dark left verge — enough to
    # say the ground is wet everywhere, not enough to draw the eye.
    for x, y in ((17, 128), (23, 135), (27, 121)):
        canvas.put(x, y, band[(x + y) % len(band)])
