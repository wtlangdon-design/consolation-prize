"""Thaddeus Grubb, drawn procedurally against the locked palette.

Same technique as the backgrounds: an indexed canvas, hard edges, ordered
dithering, and every colour reached through a family ramp rather than named
as an index. Index 0 (void) is reserved as transparency, which is what the
single-entry void family is for -- the darkest ink the figure actually uses
is umber step 0, so nothing in the sprite can collide with the key colour.

THE VALUE PROBLEM, measured before anything was drawn:

    boardwalk deck   mean luminance  80   (p90 126)
    mud, all bands   mean luminance  44-58

A dull bottle-green frock coat sits at 57 on the pine_green ramp. That is
the mud's value exactly. Rendered the obvious way, Thad would be invisible
in the street he spends the game standing in.

So the coat is taken down its own ramp until it is darker than any mud the
player will see him against, and the figure carries its own light instead:

    hair / outline   ~18    reads on the boardwalk, lost in the mud
    coat, shade      ~25    silhouette against the deck
    coat, body       ~33    still below the mud's p10
    coat, lit rim    ~73    a one-pixel edge, always above the mud
    face and hands   ~157   the anchor
    shirt            ~220   the anchor

The bright shirt wedge and the pale face are what make him readable in the
mud; the dark coat is what makes him readable on the boardwalk. Neither
alone works on both, which is why he is built from both. Light falls from
frame left throughout, matching the street's cast shadows.
"""

from __future__ import annotations

from dataclasses import dataclass

from canvas import IndexedCanvas
from dither import BAYER2, dither_pixel
from palette import Palette

TRANSPARENT = 0

FRONT, SIDE, BACK = "front", "side", "back"
VIEWS = (FRONT, SIDE, BACK)

#: The two surfaces he walks on, and they are not the same walk. Most of
#: this game happens in the street, so the mud gets the attention: a shorter
#: stride, weight landing rather than being placed, boots standing a pixel
#: or two into the surface instead of on top of it, and dried mud on the
#: leather that the boardwalk does not put there.
MUD, BOARDWALK = "mud", "boardwalk"
SURFACES = (MUD, BOARDWALK)


@dataclass(frozen=True)
class Build:
    """Row boundaries and widths for one drawn height.

    Written out per size rather than scaled from one master. A 40px figure
    reduced by 0.65 gives a 26px figure with a two-pixel head and no shirt;
    the proportions have to be re-budgeted at each size.

    ERRATA RULING 24: there are TWO of these, not three. Everything between
    them is decimated from the near build at run time, and 32 is no longer a
    drawn size.
    """

    height: int
    face_top: int       # first row of face below the hair
    neck: int
    shoulder: int
    waist: int
    skirt_top: int
    hem: int            # last row of the coat skirt
    boot_top: int
    head_w: int
    shoulder_w: int
    chest_w: int
    waist_w: int
    skirt_w: int
    leg_w: int
    boot_w: int
    shirt_w: int

    @property
    def width(self) -> int:
        """Canvas width. Wide enough for the skirt flare and a swung boot."""
        return self.skirt_w + 8


# 40px -- the near build, drawn, and the source every larger-than-threshold
# height is decimated from.
BUILD_40 = Build(
    height=40, face_top=2, neck=8, shoulder=9, waist=18, skirt_top=20, hem=25,
    boot_top=36, head_w=7, shoulder_w=11, chest_w=10, waist_w=8, skirt_w=12,
    leg_w=3, boot_w=4, shirt_w=3,
)

# 26px -- the far build, drawn, and NARROWER than the old one by a third.
#
# Ruling 24's mandatory width correction. The old 26 was the 32 build with
# rows dropped, so it kept 32's widths on 26's height: an 18-pixel canvas
# around a figure whose own height says 13. Swapping to it from a decimated
# 31 made him 38% wider in one step -- a man who gets shorter and fatter at
# a fixed row of the walk, which is a worse artefact than the one the snap
# exists to avoid.
#
# These widths are the decimation curve's, measured rather than chosen:
# decimating the 40 down to a 26px figure gives a 14-wide canvas around a
# 9-wide figure, so that is what this is. skirt_w + 8 == 14.
BUILD_26 = Build(
    height=26, face_top=2, neck=6, shoulder=7, waist=12, skirt_top=13, hem=17,
    boot_top=23, head_w=5, shoulder_w=7, chest_w=7, waist_w=5, skirt_w=6,
    leg_w=1, boot_w=2, shirt_w=1,
)

NEAR, FAR = 40, 26
BUILDS = {NEAR: BUILD_40, FAR: BUILD_26}


class Wardrobe:
    """Every colour Thad is made of, resolved once from the locked palette.

    Named by garment, never by index. The steps are the ones the measurement
    in the module docstring arrived at -- moving any of them is a decision
    about readability against Room 2, not a preference.
    """

    def __init__(self, palette: Palette) -> None:
        green = palette.family("pine_green")
        self.coat_shade = green.at(1)     # lum ~22
        self.coat = green.at(3)           # lum ~33, below the mud's p10
        self.coat_mid = green.at(5)
        self.coat_lit = green.at(8)       # lum ~73, the rim
        self.coat_ramp = green

        self.waistcoat = palette.family("ochre").at(4)
        self.waistcoat_lit = palette.family("ochre").at(7)

        bone = palette.family("bone")
        self.shirt = bone.at(10)
        self.shirt_shade = bone.at(6)
        self.collar = bone.at(11)

        dusk = palette.family("dusk")
        self.skin = dusk.at(8)
        self.skin_lit = dusk.at(10)
        self.skin_shade = dusk.at(4)

        umber = palette.family("umber")
        self.hair = umber.at(2)
        self.hair_lit = umber.at(5)
        self.ink = umber.at(0)

        # Trousers have to separate from the coat, not just be dark. At
        # grey step 2 they measured luminance 32.5 against the coat's 33.8
        # and the legs read as a continuation of the coat -- one dark column
        # from collar to boot, with no walk visible in it. Lifted until the
        # gap is real, which is still "dark trousers" on a 256-colour ramp.
        grey = palette.family("grey")
        self.trousers = grey.at(4)        # lum ~54
        self.trousers_lit = grey.at(6)    # lum ~74
        self.trousers_ramp = grey

        mud = palette.family("mud")
        self.boot = mud.at(3)
        self.boot_lit = mud.at(6)
        self.boot_caked = mud.at(9)       # the mud he cannot get off them


def _span(centre: int, width: int) -> tuple[int, int]:
    """Left and right-exclusive bounds of a run of `width` about `centre`."""
    left = centre - width // 2
    return left, left + width


#: How much narrower the body is seen side-on. A profile that is as wide as
#: the front view does not read as a turn -- it reads as the same drawing.
SIDE_NARROW = 0.72


def _torso_width(build: Build, row: int, view: str = FRONT) -> int:
    """Coat width at a row: shoulders, tapering to the waist, then flaring."""
    if view == SIDE:
        front_on = _torso_width(build, row, FRONT)
        return max(3, round(front_on * SIDE_NARROW))
    if row < build.shoulder:
        return build.shoulder_w
    if row <= build.shoulder + 1:
        return build.shoulder_w
    if row < build.waist:
        top, bottom = build.shoulder + 1, build.waist
        walk = (row - top) / max(1, bottom - top)
        return round(build.chest_w - (build.chest_w - build.waist_w) * walk)
    if row < build.skirt_top:
        return build.waist_w
    # The skirt: a frock coat's flare, and the one shape that says 1850s
    # rather than "man in a dark coat".
    walk = (row - build.skirt_top) / max(1, build.hem - build.skirt_top)
    return round(build.waist_w + (build.skirt_w - build.waist_w) * walk)


def _shade_body(
    canvas: IndexedCanvas, wardrobe: Wardrobe, x0: int, x1: int, y: int,
) -> None:
    """One row of coat: flat body, one lit pixel, a shaded edge.

    Deliberately NOT dithered across its width. A Bayer blend over a broad
    near-flat tone produces an even dot field, which at this size reads as
    printed cloth rather than as shading -- the first pass looked like he was
    wearing polka dots. Dithering is confined to the single terminator
    column, where two adjacent ramp steps genuinely meet.
    """
    width = x1 - x0
    canvas.rect(x0, y, width, 1, wardrobe.coat)
    if width >= 5:
        canvas.put(x1 - 2, y, wardrobe.coat_shade)
        dither_pixel(canvas, x1 - 3, y, wardrobe.coat_ramp, 0.20, BAYER2)
    canvas.put(x1 - 1, y, wardrobe.coat_shade)
    canvas.put(x0, y, wardrobe.coat_lit)


def _head(
    canvas: IndexedCanvas, build: Build, wardrobe: Wardrobe, cx: int, top: int, view: str,
    eye_shift: int = 0,
) -> None:
    """Bare head. No hat -- the one silhouette note that separates him from
    every other man on the street, all of whom have one."""
    # A head seen in profile is narrower than one seen face-on, and sits
    # forward on the neck. Drawing it at full width was most of why the side
    # view read as the front view with a pixel stuck to its nose.
    hw = build.head_w - (2 if view == SIDE and build.head_w >= 6 else 0)
    lead = 1 if view == SIDE else 0
    left, right = _span(cx + lead, hw)
    face_top = top + build.face_top
    chin = top + build.neck - 1

    # Skull, with the corners knocked off so it does not read as a brick.
    for y in range(top, chin):
        inset = 1 if y == top else 0
        canvas.rect(left + inset, y, hw - inset * 2, 1, wardrobe.skin)

    if view == BACK:
        # From behind, the whole head is hair. The skull was laid down in
        # skin above, so it has to be painted over completely: leaving the
        # bottom two rows bare gave him a full-width pale band under the
        # hair, which read as a beard seen from behind.
        # Hair_lit is the mass and hair is the shadow under it, not the other
        # way round: a head painted in the darkest umber from behind reads as
        # a black cap, and a cap is a hat.
        for y in range(top, chin):
            inset = 1 if y == top else 0
            canvas.rect(left + inset, y, hw - inset * 2, 1, wardrobe.hair_lit)
        canvas.hline(left + 1, chin - 1, hw - 2, wardrobe.hair)
        canvas.vline(right - 1, top + 1, chin - top - 1, wardrobe.hair)
        # Two pixels of neck between the hair and the collar. Any wider and
        # it is a scarf.
        canvas.rect(cx - 1, chin, 2, 1, wardrobe.skin_shade)
        return

    # Hair. Two rows only, and lifted off the temples so a hairline shows.
    #
    # The first pass wrapped a dark cap down both sides of the skull and read
    # as a hat, which is the one thing his silhouette cannot say: every other
    # man on this street wears one, and Thad not wearing one is how you pick
    # him out of a crowd at 26 pixels.
    canvas.rect(left + 1, top, hw - 2, 1, wardrobe.hair)
    canvas.rect(left + 1, top + 1, hw - 2, 1, wardrobe.hair)
    canvas.put(left, top + 1, wardrobe.skin)
    canvas.put(right - 1, top + 1, wardrobe.skin_shade)
    canvas.put(left + 1, top, wardrobe.hair_lit)
    if build.height >= 40:
        # A parting, and one lock that will not lie down.
        canvas.put(left + 2, top + 1, wardrobe.hair_lit)
        canvas.put(right - 2, top - 1 if top > 0 else top, wardrobe.hair)

    # Face. Lit side catches, shade side falls away.
    for y in range(face_top, chin):
        canvas.put(left, y, wardrobe.skin_lit if y < chin - 1 else wardrobe.skin)
        canvas.put(right - 1, y, wardrobe.skin_shade)

    if view == FRONT:
        # One row of face above the eyes wherever the face is three rows or
        # more. Eyes flush against the hair read as a heavy brow and, at the
        # far size, as no eyes at all -- which is the exact failure ruling 24
        # measures. This is the rule the old 32-to-26 reduction had to correct
        # for by hand; drawing 26 directly makes the correction unnecessary.
        eye = face_top + (1 if chin - face_top >= 3 else 0)
        # The dossier singles out a two-frame eye movement as the highest
        # economy reaction available -- it does the work of a full animation
        # for two pixels. `eye_shift` is that, and nothing else uses it.
        canvas.put(left + 1 + eye_shift, eye, wardrobe.ink)
        canvas.put(right - 2 + eye_shift, eye, wardrobe.ink)
        if build.height >= 40:
            # A mouth, but only one pixel of it, and not a happy one.
            canvas.put(cx, chin - 1, wardrobe.skin_shade)
    else:
        # Profile: brow, nose, and the eye set well forward. The nose has to
        # touch the face -- one pixel of gap and it reads as a fleck of dirt.
        nose = face_top + (1 if build.height >= 32 else 0)
        canvas.put(right, nose, wardrobe.skin)
        canvas.put(right - 1, nose, wardrobe.skin_lit)
        if build.height >= 40:
            # Only the 40px head is wide enough to hold an eye, a brow and a
            # nose. At 32 the profile is four pixels across and all three
            # land on top of each other as one dark blob beside his face, so
            # the smaller heads get the nose alone and nothing else.
            canvas.put(right, nose + 1, wardrobe.skin_shade)
            canvas.put(right - 2, nose, wardrobe.ink)
            canvas.put(right - 1, nose - 1, wardrobe.skin_shade)   # brow
            canvas.put(right - 1, chin - 1, wardrobe.skin_shade)   # jaw
        else:
            canvas.put(left + 1, nose, wardrobe.ink)               # eye


def _collar_and_shirt(
    canvas: IndexedCanvas, build: Build, wardrobe: Wardrobe, cx: int, top: int, view: str,
) -> None:
    """The bright wedge. This is the readability anchor in the mud, so it is
    drawn after the coat and never allowed to be squeezed out."""
    neck_y = top + build.neck
    shoulder_y = top + build.shoulder

    if view == BACK:
        # From behind, the shirt collar shows as one line above the coat --
        # in the shaded bone, not the bright. At full shoulder width and full
        # brightness it merged with the neck into a white band that read as a
        # clerical collar, so it stops short of the shoulder seams.
        width = max(2, build.chest_w // 2)
        left, _ = _span(cx, width)
        canvas.rect(left, neck_y, width, 1, wardrobe.shirt_shade)
        canvas.put(left, neck_y, wardrobe.collar)
        return

    if view == SIDE:
        # Seen side-on the stripe runs down the coat's front edge, not the
        # middle of him. Narrower than the front view because that is what a
        # shirt front does in profile -- but it is there, and it is the same
        # cue. A cue that only exists in one view is not persistent, and he
        # spends the whole game walking left and right.
        edge = cx + round(build.chest_w * SIDE_NARROW) // 2 - 1
        canvas.put(edge, neck_y, wardrobe.collar)
        for y in range(neck_y + 1, top + build.waist):
            canvas.put(edge, y, wardrobe.shirt)
        if build.height >= NEAR:
            canvas.vline(edge - 1, shoulder_y + 1, build.waist - build.shoulder - 1,
                         wardrobe.waistcoat)
        return

    # Front: the shirt as a BRIGHT VERTICAL STRIPE from the collar to the
    # waist. Doc 21 gap 2, and it is the identification cue, not a detail.
    #
    # The dossier's rule is one persistent high-contrast cue per principal and
    # never rely on facial detail, because facial detail is the first thing to
    # go. Thad used to be carried by a pale face and a dark coat, which works
    # at 40 and 32 and is gone by 8: at map-token scale the face is one pixel
    # and the coat is a smudge. A stripe is the one shape that survives being
    # reduced to a single column, which is Guybrush's answer and it is the
    # right one.
    #
    # The earlier note here said a column of white from collar to waist read
    # as a necktie. It did -- at ONE pixel wide, with ochre either side of it.
    # A stripe as wide as the shirt front, with the waistcoat pushed out to
    # two flanking columns, reads as an open coat over a shirt. The width is
    # what separates the two readings, not the length.
    stripe_w = build.shirt_w + (1 if build.height >= NEAR else 0)
    left, right = _span(cx, stripe_w)
    canvas.rect(left, neck_y, stripe_w, 1, wardrobe.collar)

    waist_y = top + build.waist
    for y in range(shoulder_y, waist_y):
        canvas.rect(left, y, stripe_w, 1, wardrobe.shirt)
        if stripe_w > 1:
            # One shaded column on the shade side, so the stripe has an edge
            # and does not read as a cut-out.
            canvas.put(right - 1, y, wardrobe.shirt_shade)

    # The waistcoat survives as two flanking columns. It is the only warm
    # colour on him and losing it entirely made the figure read cold.
    if build.chest_w >= stripe_w + 4:
        for y in range(shoulder_y + 1, waist_y):
            canvas.put(left - 1, y, wardrobe.waistcoat_lit)
            canvas.put(right, y, wardrobe.waistcoat)
    if build.height >= NEAR:
        # Two shirt buttons, dark against the bone. They sit ON the stripe
        # rather than beside it -- a button is what stops a broad pale mass
        # reading as a bib.
        canvas.put(cx, shoulder_y + 3, wardrobe.coat_shade)
        canvas.put(cx, shoulder_y + 6, wardrobe.coat_shade)

    if build.height >= 40:
        # Lapels, as two short diagonals off the collar.
        canvas.line(left - 1, neck_y + 1, left - 2, neck_y + 4, wardrobe.coat_lit)
        canvas.line(right, neck_y + 1, right + 1, neck_y + 4, wardrobe.coat_shade)


def _legs(
    canvas: IndexedCanvas, build: Build, wardrobe: Wardrobe, cx: int, top: int,
    view: str, stride: int = 0, lift: int = 0, surface: str = MUD,
) -> None:
    """Trousers and boots. `stride` swings the legs for the walk cycle:
    positive puts the near leg forward."""
    # The hip sits under the coat hem, so the thigh is hidden and only the
    # shank and boot show. That is what a knee-length frock coat does, and
    # it is why the hem had to come up: with the hem near the ankle there
    # was no leg left to swing and the walk cycle had nothing to animate.
    hip = top + build.hem - 2
    sole = top + build.height - 1
    lw = build.leg_w
    foot_top = top + build.boot_top
    boot_w = build.boot_w

    if view == SIDE:
        legs = [
            (cx - lw // 2 - stride, wardrobe.trousers, wardrobe.boot, -stride),
            (cx - lw // 2 + stride, wardrobe.trousers_lit, wardrobe.boot_lit, stride),
        ]
    else:
        legs = [
            (cx - lw - 1, wardrobe.trousers_lit, wardrobe.boot_lit, -stride),
            (cx + 1, wardrobe.trousers, wardrobe.boot, stride),
        ]

    for x, cloth, leather, swing in legs:
        # The swinging leg lifts its heel; the planted one stays down.
        raise_by = lift if swing > 0 else 0
        shank = foot_top - hip - raise_by
        canvas.rect(x, hip, lw, shank, cloth)
        canvas.vline(x + lw - 1, hip, shank, wardrobe.trousers)
        # Boot. Toe points the way he is facing.
        toe = 1 if view == SIDE and swing >= 0 else 0
        boot_h = sole - foot_top + 1 - raise_by
        canvas.rect(x, foot_top - raise_by, boot_w + toe, boot_h, leather)
        canvas.put(x, foot_top - raise_by, wardrobe.boot_lit)

        if surface is MUD or surface == MUD:
            # Dried mud, crusted up from the sole. On the boardwalk the same
            # boot is clean leather -- two surface states, not one boot.
            canvas.hline(x, sole - raise_by, boot_w + toe, wardrobe.boot_caked)
            crust = sole - raise_by - 1
            if boot_h >= 3:
                canvas.put(x + 1, crust, wardrobe.boot_caked)
                if boot_w + toe >= 4:
                    canvas.put(x + boot_w + toe - 2, crust, wardrobe.boot_caked)
            if build.height >= 40 and boot_h >= 4:
                canvas.put(x + boot_w + toe - 1, crust - 1, wardrobe.boot_caked)
        else:
            canvas.hline(x, sole - raise_by, boot_w + toe, wardrobe.boot)


def _arms(
    canvas: IndexedCanvas, build: Build, wardrobe: Wardrobe, cx: int, top: int,
    view: str, swing: int = 0,
) -> None:
    """Sleeves down the sides of the coat, with a cuff and a hand."""
    shoulder_y = top + build.shoulder + 1
    # The sleeve runs to just past the coat hem, so the cuff and hand clear
    # the skirt. Ending it at the waist -- the first pass -- left two skin
    # pixels stranded in the middle of the coat, reading as brass buttons.
    length = build.hem - build.shoulder
    aw = 2 if build.height >= 32 else 1

    def sleeve(x: int, edge: int, edge_x: int) -> None:
        canvas.rect(x, shoulder_y, aw, length, wardrobe.coat_mid)
        canvas.vline(edge_x, shoulder_y, length, edge)

    if view == SIDE:
        # Side-on, an arm swings fore-and-aft, not up and down. Moving the
        # hand vertically here made him look like he was shrugging in time
        # with his feet.
        x = cx + round(build.chest_w * SIDE_NARROW) // 2 - aw + swing
        sleeve(x, wardrobe.coat_lit, x + aw - 1)
        hand_y = shoulder_y + length
        canvas.rect(x, hand_y, aw, 2, wardrobe.skin)
        canvas.put(x, hand_y - 1, wardrobe.coat_shade)   # cuff
        return

    # Front and back: the sleeves sit at the outer edge of the torso and are
    # separated from it by their own shaded edge, so the arm reads as a tube
    # against the body rather than merging into one slab.
    left_x = cx - build.chest_w // 2 - aw + 1
    right_x = cx + build.chest_w // 2 - 1
    for x, edge, edge_x, hand_swing in (
        (left_x, wardrobe.coat_lit, left_x, -swing),
        (right_x, wardrobe.coat_shade, right_x + aw - 1, swing),
    ):
        sleeve(x, edge, edge_x)
        hand_y = shoulder_y + length + hand_swing
        canvas.rect(x, hand_y, aw, 2, wardrobe.skin)
        canvas.put(x, hand_y - 1, wardrobe.coat_shade)   # cuff


def _coat(
    canvas: IndexedCanvas, build: Build, wardrobe: Wardrobe, cx: int, top: int,
    view: str, skirt_lag: int = 0,
) -> None:
    """Body of the frock coat, from the shoulders to the hem."""
    for row in range(build.shoulder, build.hem):
        width = _torso_width(build, row, view)
        # Below the waist the skirt lags behind the walk, like cloth.
        shift = skirt_lag if row >= build.skirt_top else 0
        x0, x1 = _span(cx + shift, width)
        # Side-on, the skirt hangs behind him rather than evenly around: a
        # frock coat seen in profile is an asymmetric shape, and drawing it
        # symmetrically is most of why the first side view read as a front.
        #
        # The trailing edge grows row by row. A constant offset -- the first
        # attempt -- started the flare abruptly at one row and read as a
        # shelf bolted to his back rather than as cloth hanging.
        if view == SIDE and row >= build.skirt_top:
            reach = (build.skirt_w - build.waist_w) // 2
            walk = (row - build.skirt_top + 1) / max(1, build.hem - build.skirt_top)
            x0 -= round(reach * walk)
        y = top + row
        _shade_body(canvas, wardrobe, x0, x1, y)

    hem_y = top + build.hem - 1
    hem_w = _torso_width(build, build.hem - 1, view)
    hx0, hx1 = _span(cx + skirt_lag, hem_w)
    if view == SIDE:
        hx0 -= (build.skirt_w - build.waist_w) // 2
    canvas.hline(hx0 + 1, hem_y, hx1 - hx0 - 1, wardrobe.coat_shade)

    if view == BACK:
        # Enough structure to stop it reading as a slab, and no more. In a
        # lateral stage set he walks left and right; the back is for going
        # through doors and a few scripted beats, so it does not earn a pass
        # of its own.
        #
        # Centre vent, two waist buttons, a yoke seam across the shoulders,
        # and the two seams where the sleeves join. The value break comes
        # from lightening the lit half of the back panel by one ramp step,
        # which is the same trick the buildings use across a flat wall.
        for row in range(build.shoulder + 2, build.hem - 1):
            width = _torso_width(build, row, view)
            x0, _ = _span(cx, width)
            canvas.rect(x0 + 1, top + row, max(1, width // 2 - 1), 1, wardrobe.coat_mid)

        canvas.vline(cx, top + build.skirt_top, build.hem - build.skirt_top, wardrobe.coat_shade)
        canvas.put(cx - 2, top + build.waist, wardrobe.coat_lit)
        canvas.put(cx + 1, top + build.waist, wardrobe.coat_lit)

        yoke = top + build.shoulder + 2
        yoke_w = _torso_width(build, build.shoulder + 2, view)
        yx0, _ = _span(cx, yoke_w)
        canvas.hline(yx0 + 1, yoke, yoke_w - 2, wardrobe.coat_shade)

        seam_x = build.chest_w // 2 - 1
        seam_len = build.waist - build.shoulder - 2
        canvas.vline(cx - seam_x, yoke + 1, seam_len, wardrobe.coat_shade)
        canvas.vline(cx + seam_x - 1, yoke + 1, seam_len, wardrobe.coat_shade)
    elif view == SIDE:
        # Only the front edge is drawn here. The trailing edge is left to
        # _shade_body, which knows the per-row taper: drawing it as one
        # straight vline at the hem's offset left a detached one-pixel sliver
        # floating beside him for every row above the hem, which is what the
        # "shelf bolted to his back" actually was.
        canvas.vline(hx1 - 1, top + build.shoulder, build.hem - build.shoulder, wardrobe.coat_lit)


def draw(
    palette: Palette, view: str = FRONT, height: int = 40, surface: str = MUD,
    stride: int = 0, lift: int = 0, arm: int = 0, skirt_lag: int = 0,
    lean: int = 0, eye_shift: int = 0,
) -> IndexedCanvas:
    """One Thad, on a transparent canvas of his own, standing on nothing.

    How far he stands INTO a surface is not decided here -- see _submerge.
    An earlier version dropped the whole figure by a "bob" on the weight
    frames, which lowered the planted boot along with the body and read as
    the ground moving rather than the man.

    `lean` moves everything above the hip and leaves the boots planted, which
    is the whole of the recoil: a man who steps back has moved, a man who
    leans back has had an opinion. `eye_shift` moves the eyes and nothing
    else.
    """
    build = BUILDS[height]
    wardrobe = Wardrobe(palette)
    canvas = IndexedCanvas(build.width, height + 1, fill=TRANSPARENT)
    cx = build.width // 2
    top = 0
    body = cx + lean

    _legs(canvas, build, wardrobe, cx, top, view, stride=stride, lift=lift, surface=surface)
    _coat(canvas, build, wardrobe, body, top, view, skirt_lag=skirt_lag)
    _collar_and_shirt(canvas, build, wardrobe, body, top, view)
    _arms(canvas, build, wardrobe, body, top, view, swing=arm)
    _head(canvas, build, wardrobe, body, top, view, eye_shift=eye_shift)
    _outline(canvas, wardrobe)
    return canvas


def _outline(canvas: IndexedCanvas, wardrobe: Wardrobe) -> None:
    """A dark keyline around the figure, on the shade side and underneath.

    Not all the way round: a full outline at 26px eats the figure. The lit
    edge is left bare so the rim light survives, which is what carries him
    against the mud.
    """
    filled = [
        [canvas.pixels[y][x] != TRANSPARENT for x in range(canvas.width)]
        for y in range(canvas.height)
    ]
    for y in range(canvas.height):
        for x in range(canvas.width):
            if filled[y][x]:
                continue
            right_of_body = x > 0 and filled[y][x - 1]
            below_body = y > 0 and filled[y - 1][x]
            if right_of_body or below_body:
                canvas.put(x, y, wardrobe.ink)


# -- walk cycle -------------------------------------------------------------

#: Eight frames: contact, down, pass, up, and the same again on the other leg.
#: stride swings the legs, lift raises the trailing boot, arm counter-swings,
#: skirt_lag trails the coat, bob drops the body on the down frames.
#: On the boardwalk: a full stride on a hard surface, feet planted, nothing
#: sinking. Tuned down from ±3, where the legs split far enough to read as a
#: man straddling something. A 40px figure has about two pixels of stride.
WALK_BOARDWALK = [
    dict(stride=2, lift=0, arm=-1, skirt_lag=-1, sink=0),   # contact, left fwd
    dict(stride=1, lift=0, arm=-1, skirt_lag=-1, sink=0),   # down
    dict(stride=0, lift=1, arm=0, skirt_lag=0, sink=0),     # pass
    dict(stride=-1, lift=1, arm=1, skirt_lag=0, sink=0),    # up
    dict(stride=-2, lift=0, arm=1, skirt_lag=1, sink=0),    # contact, right fwd
    dict(stride=-1, lift=0, arm=1, skirt_lag=1, sink=0),    # down
    dict(stride=0, lift=1, arm=0, skirt_lag=0, sink=0),     # pass
    dict(stride=1, lift=1, arm=-1, skirt_lag=0, sink=0),    # up
]

#: In the mud: a shorter stride, because nobody strides in it, and weight
#: that lands rather than being placed. `sink` is how far the boot stands
#: into the surface -- deepest on the contact and down frames, where the
#: weight arrives, and back to one on the pass, where he is pulling a foot
#: out of it. He is never fully on top of the mud, which is the point.
#: A boot is four pixels tall at 40px, so the sink has to stay at one or two
#: or it stops reading as a boot standing in mud and starts reading as a man
#: with no boots. The one-pixel swing between the contact and the weight
#: frame is the drop; at this size one pixel is a real drop.
WALK_MUD = [
    dict(stride=1, lift=0, arm=-1, skirt_lag=-1, sink=1),   # contact, left fwd
    dict(stride=1, lift=0, arm=-1, skirt_lag=-1, sink=2),   # down, weight lands
    dict(stride=0, lift=1, arm=0, skirt_lag=0, sink=1),     # pass
    dict(stride=-1, lift=1, arm=1, skirt_lag=0, sink=1),    # up, foot clearing
    dict(stride=-1, lift=0, arm=1, skirt_lag=1, sink=1),    # contact, right fwd
    dict(stride=-1, lift=0, arm=1, skirt_lag=1, sink=2),    # down, weight lands
    dict(stride=0, lift=1, arm=0, skirt_lag=0, sink=1),     # pass
    dict(stride=1, lift=1, arm=-1, skirt_lag=0, sink=1),    # up, foot clearing
]

WALKS = {MUD: WALK_MUD, BOARDWALK: WALK_BOARDWALK}

#: The one bespoke reaction, and it is three frames because the dossier says
#: prefer the smallest readable reaction. He leans away, his eyes go with him,
#: and he comes back. No step, no arm flail, no second thought.
#:
#: Frame 2 is held twice as long as the others by the clip's frame list rather
#: than by a per-frame duration -- the hold IS the joke, and a duration field
#: on every frame everywhere to express one hold is not worth the schema.
RECOIL = [
    dict(lean=0, eye_shift=0),
    dict(lean=-2, eye_shift=-1),
    dict(lean=-2, eye_shift=-1),
    dict(lean=-1, eye_shift=-1),
]

#: How far a standing figure stands into each surface.
STANDING_SINK = {MUD: 1, BOARDWALK: 0}

#: Kept for callers that only want the frame count.
WALK = WALK_MUD


def walk_frame(
    palette: Palette, index: int, height: int = 40, view: str = SIDE,
    surface: str = MUD,
) -> IndexedCanvas:
    cycle = WALKS[surface]
    return at_height(
        palette, view=view, height=height, surface=surface, **cycle[index % len(cycle)]
    )


def at_height(
    palette: Palette, view: str = FRONT, height: int = 40,
    surface: str = MUD, sink: int | None = None, **motion,
) -> IndexedCanvas:
    """The canonical figure at a height. Use this, not draw().

    Ruling 24. Two heights are DRAWN -- 40 and 26 -- and everything between
    them is decimated from the 40, which is what SCUMM did and what keeps the
    figure crisp at every height in between. Ask for 33 and you get a
    decimated 33, not a rounded 32.

    `sink` is applied last, after any decimation, so a figure stands in the
    mud by one rule at every height rather than by a separately tuned number
    per size that would drift out of agreement with the others.
    """
    import decimation

    depth = STANDING_SINK[surface] if sink is None else sink
    if height in BUILDS:
        figure = draw(palette, view=view, height=height, surface=surface, **motion)
    else:
        source = draw(palette, view=view, height=NEAR, surface=surface, **motion)
        figure = decimation.decimate(source, decimation.scale_for(source.height, height + 1))
    if height != NEAR:
        # A figure further away sinks less of himself into the same mud.
        # Scaling the sink with the drawn height keeps him standing at the
        # same depth in world terms rather than the same pixel depth.
        depth = round(depth * height / NEAR)
    return _submerge(figure, depth)


def _submerge(figure: IndexedCanvas, depth: int) -> IndexedCanvas:
    """Removes the bottom `depth` rows of drawn content.

    Standing IN a surface rather than on it, expressed the only way an
    opaque sprite can express it: the buried rows are not drawn, so whatever
    the room put there -- mud, a puddle, a rut -- is what shows.
    """
    if depth <= 0:
        return figure
    bottom = _content_bottom(figure)
    if bottom is None:
        return figure
    keep = max(1, bottom + 1 - depth)
    out = IndexedCanvas(figure.width, keep, fill=TRANSPARENT)
    for y in range(keep):
        for x in range(figure.width):
            out.put(x, y, figure.pixels[y][x])
    return out


def _content_bottom(figure: IndexedCanvas) -> int | None:
    """Last row holding any drawn pixel."""
    for y in range(figure.height - 1, -1, -1):
        if any(figure.pixels[y][x] != TRANSPARENT for x in range(figure.width)):
            return y
    return None


def content_bottom(figure: IndexedCanvas) -> int:
    """Public: the row a caller should align with the ground."""
    return _content_bottom(figure) or figure.height - 1


# -- the snap threshold, measured ------------------------------------------


def eye_pixels(palette: Palette, figure: IndexedCanvas) -> list[tuple[int, int]]:
    """The drawn eyes: ink with skin on at least two sides.

    Not simply "ink", which was the first version of this and was useless --
    the keyline is ink too, so it reported that every column of the figure
    carried an eye and that the eyes always survived. The render showed the
    opposite. A check that cannot fail is not a check.
    """
    wardrobe = Wardrobe(palette)
    skin = (wardrobe.skin, wardrobe.skin_lit, wardrobe.skin_shade)
    found = []
    for y in range(1, figure.height - 1):
        for x in range(1, figure.width - 1):
            if figure.pixels[y][x] != wardrobe.ink:
                continue
            around = (figure.pixels[y][x - 1], figure.pixels[y][x + 1],
                      figure.pixels[y - 1][x], figure.pixels[y + 1][x])
            if sum(1 for pixel in around if pixel in skin) >= 2:
                found.append((x, y))
    return found


def eye_death_row(palette: Palette, view: str = FRONT, surface: str = BOARDWALK) -> int:
    """Ruling 24's threshold: the tallest decimation with no eyes left.

    MEASURED, per character, not chosen. A character with a wider face
    survives further down and gets a lower threshold; this is the number that
    decides where the snap goes, so it has to come out of the sprite rather
    than out of a table someone typed.
    """
    for height in range(NEAR - 1, FAR, -1):
        figure = at_height(palette, view=view, height=height, surface=surface, sink=0)
        if not eye_pixels(palette, figure):
            return height
    return FAR
