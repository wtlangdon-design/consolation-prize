"""Room 1 — the light field, applied after everything is drawn.

ONE SOURCE HAS A FALLOFF AND EVERY OTHER LIGHT IN THIS FRAME IS A BARE DOT.
That sentence is the whole module. The whole-frame study §2 ranks the seven
emitters by integrated luminous excess rather than by peak, because the
emitters SHARE PALETTE ENTRIES and peak cannot rank them:

    lantern 55.2%  town windows 27.1%  stars 5.8%  gantry lamp 4.3%
    coach door lamp 4.2%  coach roof lamp 2.1%  coach side lamps 1.4%

The lantern outweighs everything else in the frame combined, and it wins
ONLY because it has a pool. Take the pool away and it drops to roughly the
gantry lamp's weight. Town windows fit a bloom radius of 0.69 px — no halo
at all. So this pass evaluates exactly one falloff. The other six sources
are drawn as objects by the regions that own them, with the one-pixel rings
their specs allow, and this module does not touch them. §7.2 of the study:
if the rebuild ranks lights by brightness — giving the coach lamps or the
town windows their own bloom — the hierarchy inverts.

THE FALLOFF, from hob.md §5, fitted over the ground plane with a linear road
baseline removed:

    L(ρ) = 27 + 97 / (1 + (ρ/6.2)²),  flat at 123 for ρ ≤ 3
    ρ = sqrt( ((x−86)/2.4)² + (y−107)² )

Residual under 3 L across ρ = 3…11. Freeing the exponent gives p = 1.79 —
inverse-square within the noise. FITTED IN VALUE SPACE, NOT LINEAR LIGHT:
both fit about equally well, but in value space the exponent lands on 1.79
and in linear light it needs 2.75. The artist stepped palette values, which
is exactly what this pass does, so the number is a ramp position and not a
radiance. layout owns the fit; this file only walks it.

WHAT IS ADDED IS THE EXCESS, NEVER THE ABSOLUTE. road.md §4.2 measures the
pool as an excess over the depth model, and `road` has already authored the
depth model. Adding the absolute would flatten the road's own gradient
inside the pool and hand the region a plateau where it should have a floor
receding under a light.

TWO SUBTRACTIONS, AND BOTH ARE SUBTRACTIONS FROM THE POOL RATHER THAN
PAINTED SHAPES (hob.md §6). There is NO directional cast shadow: measured
symmetrically about x=86 at d = 4…40 across five ground rows, the right side
of the pool is BRIGHTER than the left at every distance. What exists is a
one-row contact darkening at y=106 across the boots, about four ramp steps
down and gone by y=107, and an occlusion notch behind the man where his body
blocks the lamp. Drawing a long silhouette shadow to the right would be
physically plausible and would put a hard black wedge across the brightest,
most legible part of the picture.

AND THE POOL IS CUT HARD ON ITS LEFT. road.md §4.2: it is cut off at
x ≈ 58-62 by the sign post standing there, and left of the post it drops
25-38 L within 15 px. To the right it takes 90 px to die. §10.5 — do not
make the pool symmetric, and do not make it round: it is 2.4:1 and a
circular pool turns the road into a vertical wall.

THREE THINGS THE PASS WILL NOT DO:

  It will not move a reserved index. layout.keep() is consulted on every
  pixel. A reserved index stepped along its ramp leaves the band, and the
  band is then reserved for pixels that are no longer in it -- which still
  animates, still looks like a lamp, and is exactly the sort of thing that
  is invisible until somebody counts the pixels.

  It will not lift a pixel INTO a reserved band. The sky is `accent_indigo`
  0-1 and the puddles are steps 2-4 of the same family; one step of light on
  the horizon band would enrol the sky in the water's cycle.
  cycling.reserve() would clamp it back afterwards, silently, which is worse
  than not doing it.

  It will not break the ceiling. The frame's maximum is L 121.9 — 47.8% of
  white — everywhere except the flame, and the histogram has a hard empty
  gap at 96-111 that isolates the top tier. Light in this frame does not
  blend up to its peak, it steps to it.
"""

from __future__ import annotations

from canvas import IndexedCanvas
from dither import BAYER4

from . import layout


#: hob.md §7. The pool maps to `mud` almost exactly and the ladder runs about
#: one mud step per six luminance points, core outward: 18, 15, 13, 11, 9, 7,
#: 6, 4, 3 -- nine steps, eight visible bands. Six is therefore the exchange
#: rate between a luminance target and a ramp step for this whole pass.
LUMINANCE_PER_STEP = 6.0

#: The frame's ceiling, everywhere except the reserved flame. Nothing this
#: pass produces may cross it.
CEILING = 126.0

#: road.md §4.2's hard left cut. The pool is at full strength right of the
#: post and gone by the time it clears it.
CUT_FULL_X = 62
CUT_DEAD_X = 50

#: hob.md §6. The contact row loses about four ramp steps; the occlusion
#: notch loses about one. Both are declared as attenuations of the field,
#: which is what they physically are.
CONTACT_SCALE = 0.25
NOTCH_SCALE = 0.75


def draw(canvas: IndexedCanvas, ctx: layout.Ctx) -> None:
    palette = ctx.palette
    lamp_x = ctx.lamp[0]
    drift = lamp_x - layout.FLAME_CENTRE[0]
    pool_x, pool_y = layout.POOL_CENTRE
    pool_x += drift

    notch_x, notch_y, notch_w, notch_h = layout.HOB_OCCLUSION_NOTCH
    contact_y = layout.HOB_CONTACT_ROW

    # The pool's visible reach, from hob.md §5's outermost measured contour:
    # 76 x 27 px, and the upper half is slightly shorter than the lower --
    # the ground recedes, so the ellipse is pushed a little toward the viewer.
    left = max(0, pool_x - 40)
    right = min(layout.WIDTH, pool_x + 92)
    top = max(0, pool_y - 16)
    bottom = min(layout.HEIGHT, pool_y + 20)

    for y in range(top, bottom):
        for x in range(left, right):
            excess = _excess(x, y, pool_x, pool_y)
            if excess <= 0.0:
                continue
            if notch_x <= x < notch_x + notch_w and notch_y <= y < notch_y + notch_h:
                excess *= NOTCH_SCALE
            if y == contact_y and 94 <= x <= 108:
                excess *= CONTACT_SCALE
            if ctx.is_shielded(x, y):
                continue
            index = canvas.get(x, y)
            if layout.keep(index):
                continue
            exact = excess / LUMINANCE_PER_STEP
            whole = int(exact)
            # The fractional step is resolved with the same ordered threshold
            # as every other dither in the project. hob.md §8 measures the
            # reference's pool edge as BROKEN BANDS rather than a dithered
            # gradient -- 5-7 px solid runs near the core, 1-2 px of mottle
            # between neighbours -- and reproducing that is DEFERRED; a 4x4
            # threshold is the closest a quantised falloff gets for free.
            steps = whole + (1 if exact - whole > BAYER4.threshold(x, y) else 0)
            if steps <= 0:
                continue
            canvas.put(x, y, _lift(palette, index, steps))


def _excess(x: int, y: int, pool_x: int, pool_y: int) -> float:
    """Luminance above the road's own ambient at a point, after the left cut."""
    dx = (x - pool_x) / layout.POOL_ASPECT
    dy = y - pool_y
    rho = (dx * dx + dy * dy) ** 0.5
    if rho <= layout.POOL_PLATEAU_RHO:
        excess = layout.POOL_PLATEAU_L - layout.POOL_AMBIENT
    else:
        excess = layout.POOL_EXCESS / (1.0 + (rho / layout.POOL_HALF) ** 2)
    if x < CUT_FULL_X:
        if x <= CUT_DEAD_X:
            return 0.0
        excess *= (x - CUT_DEAD_X) / (CUT_FULL_X - CUT_DEAD_X)
    return excess


def _lift(palette, index: int, steps: int) -> int:
    """Steps a colour up its OWN family, stopping at the band and the ceiling.

    The only legal way to move a colour in this project, plus the two guards
    that keep it legal: never land in a reserved index, never cross the
    frame's ceiling. Both walk back one step at a time rather than clamping
    to a computed limit, because a family's steps are not evenly spaced and
    arithmetic on ramp positions is not arithmetic on luminance.
    """
    lifted = index
    for _ in range(steps):
        candidate = palette.lighten(lifted, 1)
        if candidate == lifted:
            break
        if layout.keep(candidate):
            break
        if palette.luminance(candidate) > CEILING:
            break
        lifted = candidate
    return lifted
