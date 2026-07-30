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


@dataclass(frozen=True)
class Build:
    """Row boundaries and widths for one drawn height.

    Written out per size rather than scaled from one master. A 40px figure
    reduced by 0.65 gives a 26px figure with a two-pixel head and no shirt;
    the proportions have to be re-budgeted at each size, which is the whole
    reason errata ruling 15 fixes three sizes instead of allowing a scale.
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


# 40px -- the near zone, and the size everything else is corrected against.
BUILD_40 = Build(
    height=40, face_top=2, neck=8, shoulder=9, waist=18, skirt_top=20, hem=25,
    boot_top=36, head_w=7, shoulder_w=11, chest_w=10, waist_w=8, skirt_w=12,
    leg_w=3, boot_w=4, shirt_w=3,
)

# 32px -- the mid zone. Head loses one row, not two: at this size the face is
# already down to four rows and the eyes have to survive.
BUILD_32 = Build(
    height=32, face_top=2, neck=7, shoulder=8, waist=15, skirt_top=16, hem=20,
    boot_top=29, head_w=6, shoulder_w=9, chest_w=8, waist_w=7, skirt_w=10,
    leg_w=2, boot_w=4, shirt_w=2,
)

# 26px -- the far zone. Produced by reduction from 32 and then corrected;
# see reduce_and_correct(). This build is what the correction pass targets.
BUILD_26 = Build(
    height=26, face_top=2, neck=6, shoulder=7, waist=12, skirt_top=13, hem=17,
    boot_top=23, head_w=5, shoulder_w=7, chest_w=7, waist_w=6, skirt_w=9,
    leg_w=2, boot_w=3, shirt_w=1,
)

BUILDS = {40: BUILD_40, 32: BUILD_32, 26: BUILD_26}


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
        eye = face_top + (1 if build.height >= 32 else 0)
        canvas.put(left + 1, eye, wardrobe.ink)
        canvas.put(right - 2, eye, wardrobe.ink)
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
        # From behind, only the collar shows above the coat -- two pixels of
        # it, in the shaded bone rather than the bright. At full width and
        # full brightness it merged with the neck into a white band across
        # his shoulders that read as a clerical collar.
        left, _ = _span(cx, 2)
        canvas.rect(left, neck_y, 2, 1, wardrobe.shirt_shade)
        return

    if view == SIDE:
        # Buttoned, so the shirt is a sliver at the throat and a hint of
        # waistcoat below it.
        canvas.put(cx + 1, neck_y, wardrobe.collar)
        canvas.put(cx + 1, neck_y + 1, wardrobe.shirt)
        for y in range(shoulder_y + 2, top + build.waist):
            canvas.put(cx + build.chest_w // 2 - 1, y, wardrobe.waistcoat)
        return

    # Front: shirt at the throat, waistcoat filling the chest below it.
    #
    # The shirt narrows going down and the waistcoat is WIDER than it, which
    # is the wrong way round from the first attempt -- one column of white
    # running from collar to waist read as a necktie, not as an open coat
    # with a man's shirt front inside it.
    left, right = _span(cx, build.shirt_w)
    canvas.rect(left, neck_y, build.shirt_w, 1, wardrobe.collar)

    shirt_rows = 3 if build.height >= 40 else 2
    for step in range(shirt_rows):
        width = max(1, build.shirt_w - step)
        wl, wr = _span(cx, width)
        canvas.rect(wl, shoulder_y + step, width, 1, wardrobe.shirt)
        if width > 1:
            canvas.put(wr - 1, shoulder_y + step, wardrobe.shirt_shade)

    vest_w = min(build.chest_w - 4, build.shirt_w + 2)
    for y in range(shoulder_y + shirt_rows, top + build.waist):
        vl, vr = _span(cx, vest_w)
        canvas.rect(vl, y, vest_w, 1, wardrobe.waistcoat)
        canvas.put(vl, y, wardrobe.waistcoat_lit)
    if build.height >= 40:
        # Two waistcoat buttons, dark against the ochre.
        canvas.put(cx, shoulder_y + shirt_rows + 2, wardrobe.coat_shade)
        canvas.put(cx, shoulder_y + shirt_rows + 5, wardrobe.coat_shade)

    if build.height >= 40:
        # Lapels, as two short diagonals off the collar.
        canvas.line(left - 1, neck_y + 1, left - 2, neck_y + 4, wardrobe.coat_lit)
        canvas.line(right, neck_y + 1, right + 1, neck_y + 4, wardrobe.coat_shade)


def _legs(
    canvas: IndexedCanvas, build: Build, wardrobe: Wardrobe, cx: int, top: int,
    view: str, stride: int = 0, lift: int = 0,
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
        # Boot. Toe points the way he is facing, and it is always caked.
        toe = 1 if view == SIDE and swing >= 0 else 0
        canvas.rect(x - (0 if toe else 0), foot_top - raise_by, boot_w + toe,
                    sole - foot_top + 1 - raise_by, leather)
        canvas.hline(x, sole - raise_by, boot_w + toe, wardrobe.boot_caked)
        canvas.put(x, foot_top - raise_by, wardrobe.boot_lit)


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
        # Centre vent and two waist buttons: the back of a frock coat is
        # otherwise a featureless dark slab.
        canvas.vline(cx, top + build.skirt_top, build.hem - build.skirt_top, wardrobe.coat_shade)
        canvas.put(cx - 2, top + build.waist, wardrobe.coat_lit)
        canvas.put(cx + 1, top + build.waist, wardrobe.coat_lit)
    elif view == SIDE:
        # Only the front edge is drawn here. The trailing edge is left to
        # _shade_body, which knows the per-row taper: drawing it as one
        # straight vline at the hem's offset left a detached one-pixel sliver
        # floating beside him for every row above the hem, which is what the
        # "shelf bolted to his back" actually was.
        canvas.vline(hx1 - 1, top + build.shoulder, build.hem - build.shoulder, wardrobe.coat_lit)


def draw(
    palette: Palette, view: str = FRONT, height: int = 40,
    stride: int = 0, lift: int = 0, arm: int = 0, skirt_lag: int = 0, bob: int = 0,
) -> IndexedCanvas:
    """One Thad, on a transparent canvas of his own."""
    build = BUILDS[height]
    wardrobe = Wardrobe(palette)
    canvas = IndexedCanvas(build.width, height + 1, fill=TRANSPARENT)
    cx = build.width // 2
    top = bob

    _legs(canvas, build, wardrobe, cx, top, view, stride=stride, lift=lift)
    _coat(canvas, build, wardrobe, cx, top, view, skirt_lag=skirt_lag)
    _collar_and_shirt(canvas, build, wardrobe, cx, top, view)
    _arms(canvas, build, wardrobe, cx, top, view, swing=arm)
    _head(canvas, build, wardrobe, cx, top, view)
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
#: Tuned down from a wider stride: at ±3 the legs split far enough to read
#: as a man straddling something, and the swinging sleeve pulled clear of
#: the coat and floated. A 40px figure has about two pixels of stride in it.
WALK = [
    dict(stride=2, lift=0, arm=-1, skirt_lag=-1, bob=0),   # contact, left fwd
    dict(stride=1, lift=0, arm=-1, skirt_lag=-1, bob=1),   # down
    dict(stride=0, lift=1, arm=0, skirt_lag=0, bob=1),     # pass
    dict(stride=-1, lift=1, arm=1, skirt_lag=0, bob=0),    # up
    dict(stride=-2, lift=0, arm=1, skirt_lag=1, bob=0),    # contact, right fwd
    dict(stride=-1, lift=0, arm=1, skirt_lag=1, bob=1),    # down
    dict(stride=0, lift=1, arm=0, skirt_lag=0, bob=1),     # pass
    dict(stride=1, lift=1, arm=-1, skirt_lag=0, bob=0),    # up
]


def walk_frame(palette: Palette, index: int, height: int = 40, view: str = SIDE) -> IndexedCanvas:
    return at_height(palette, view=view, height=height, **WALK[index % len(WALK)])


def at_height(palette: Palette, view: str = FRONT, height: int = 40, **motion) -> IndexedCanvas:
    """The canonical figure at a drawn height. Use this, not draw().

    26px is not drawn from scratch: it is the 32px figure reduced and then
    corrected, which is what reduce_and_correct() does. Routing every caller
    through here is what stops two different 26px Thads existing -- one on
    the reference sheet and a different one in the room.
    """
    if height != 26:
        return draw(palette, view=view, height=height, **motion)
    source = draw(palette, view=view, height=32, **motion)
    _, corrected = reduce_and_correct(source, palette, view=view)
    return corrected


# -- the 26px reduction -----------------------------------------------------

#: Rows dropped when reducing a 32px figure to 26px. Chosen where the figure
#: is uniform -- coat body, trouser shank -- so nothing with a feature in it
#: is lost. Reducing by ratio instead would land on the eyes.
DROP_ROWS_32_TO_26 = (10, 12, 14, 21, 27, 29)


def reduce_and_correct(
    source: IndexedCanvas, palette: Palette, view: str = FRONT,
) -> tuple[IndexedCanvas, IndexedCanvas]:
    """32px down to 26px by dropping rows, then corrected by hand.

    Returns (raw reduction, corrected). Both are kept because the difference
    between them is the argument for doing it this way: the raw reduction is
    a shorter man with the same head, and the corrections are what make him
    read as the same man further away.
    """
    build = BUILDS[26]
    wardrobe = Wardrobe(palette)
    keep = [y for y in range(source.height - 1) if y not in DROP_ROWS_32_TO_26]

    raw = IndexedCanvas(source.width, build.height + 1, fill=TRANSPARENT)
    for target_y, source_y in enumerate(keep[: build.height + 1]):
        for x in range(source.width):
            raw.put(x, target_y, source.pixels[source_y][x])

    corrected = IndexedCanvas(raw.width, raw.height, fill=TRANSPARENT)
    for y in range(raw.height):
        for x in range(raw.width):
            corrected.put(x, y, raw.pixels[y][x])

    cx = source.width // 2

    # Correction 1 -- the shirt. Dropping coat rows collapses the wedge to
    # nothing, and the wedge is the whole reason he reads in the mud.
    neck_y = build.neck
    if view != BACK:
        corrected.put(cx, neck_y, wardrobe.collar)
        # Two rows of shirt and no more. Running it to the waist -- the first
        # attempt -- put a white stripe down his whole front that read as a
        # bib. At 26px the wedge only has to say "something pale at the
        # throat"; any more of it and it stops being a shirt.
        corrected.put(cx, neck_y + 1, wardrobe.shirt)
        corrected.put(cx, neck_y + 2, wardrobe.shirt_shade)

    # Correction 2 -- the eyes. The reduction leaves them touching the hair;
    # one row of face has to be given back above them.
    if view == FRONT:
        eye = build.face_top
        corrected.put(cx - 2, eye, wardrobe.ink)
        corrected.put(cx + 1, eye, wardrobe.ink)
        corrected.rect(cx - 2, eye - 1, 4, 1, wardrobe.skin)
    elif view == SIDE:
        corrected.put(cx + build.head_w // 2, build.face_top, wardrobe.skin)

    # Correction 3 -- the hem. A dropped skirt row leaves the flare ending in
    # a taper rather than a line, which loses the 1850s read entirely.
    hem_y = build.hem - 1
    hx0, hx1 = _span(cx, build.skirt_w)
    corrected.hline(hx0 + 1, hem_y, hx1 - hx0 - 2, wardrobe.coat_shade)
    _shade_body(corrected, wardrobe, hx0 + 1, hx1 - 1, hem_y - 1)

    # Correction 4 -- the boots. Two dropped trouser rows leave the sole
    # ambiguous; it has to be one clean dark line or he floats.
    sole = build.height - 1
    for x in range(raw.width):
        if corrected.pixels[sole - 1][x] != TRANSPARENT:
            corrected.put(x, sole, wardrobe.boot_caked)

    _outline(corrected, wardrobe)
    return raw, corrected
