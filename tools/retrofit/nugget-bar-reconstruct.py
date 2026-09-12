#!/usr/bin/env python3
"""STEP A OF THE ROOM 3 RECOMPOSITION: put the room back, as if nobody had moved.

Tyler, 2026-09-12, rejecting the previous pass: "The problem is that people were
moved together with pixels from their OLD surroundings, and you are now
repeatedly trying to repair those surroundings after the fact. That approach
ends now." Background first; the actor afterwards; zero pixels of his old
environment travel with him.

THIS FILE BUILDS THE EMPTY ROOM ONLY. It starts from rebuild-01 -- the endpoint's
own bar, integrated, BEFORE any translation -- and removes the foreground patron
from it entirely, reconstructing the bar and the floor he stands in front of.
Nothing here composites a person. tools/retrofit/nugget-bar-recompose.py does
that, from this plate, afterwards.

THE BAR IS A STRAIGHT RUN IN PERSPECTIVE, AND THAT IS THE WHOLE METHOD. Its
horizontal lines converge on the room's own horizon, y 239 (the same horizon the
depth curve reaches zero at). Measured off the plate, the counter's lit front
edge is

    TOP(x) = 383 + 0.2135 (x - 1185)        rms 2 px from x 1190 to x 1910

so every horizontal line of the bar's front plane is y = 239 + v (TOP(x) - 239)
for a constant v -- v = 1 is the counter's lit edge, v = 1.945 is where the bar
meets the dirt -- and distance ALONG the run is w = ln(TOP(x) - 239), because
the plane's scale is proportional to its distance below the horizon. In (w, v)
the bar is an undistorted elevation: panels are upright rectangles, the plinth
and the rail are horizontal bands, and the bay repeats with a constant pitch.

SO THE RECONSTRUCTION IS THE BAR CONTINUING ITSELF, not a patch and not a paste
from another plate. The run is copied along its own axis by one bay, in (w, v),
and mapped back. Every line lands on the line it belongs to, the panel keeps the
CURRENT bar's pitch and proportions, and no geometry from the old plate enters.

WHY NOT THE ACCEPTED PLATE, WHICH IS PEOPLE-FREE. It was tried first and it is
the wrong source for the panelling. Warped into this geometry its counter lands
exactly on this counter (the warp is verified), but its bay pitch is roughly
half this bar's: pasting it would have made the furniture change design halfway
along the run, which is exactly the failure this pass exists to end. It is still
the right source for the two things it does share -- the dirt floor, which is in
register pixel for pixel, and the wall and back bar above the counter, which the
endpoint reproduced within 8 to 16 of 255.

TWO SOURCE BANDS, because no single stretch of this bar is unobstructed over its
whole height: three men and two stools stand along it. Above the panel's lower
moulding the copy comes from one bay to the left; below it, where the content is
plinth, base moulding and brass rail and is constant along the run, from a clean
stretch further left. The seam between them is the moulding itself.
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import gaussian_filter, uniform_filter, label

PRE   = 'art/staging/room-03/rebuild-01/plate-room-03-rebuilt.png'
ACC   = 'art/staging/room-03/corrected-03/plate-cold-dirt.png'
CANVAS= 'art/staging/room-03/bar-rebuild-01/canvas.png'
FLOORMASK = 'art/staging/room-03/floor-03/floor-mask-plate.png'
FURNITURE = 'art/staging/room-03/corrected-03/furniture-tight-mask.png'
CROP  = (896, 181, 1920, 864)          # the canvas's plate window
OUT   = 'art/staging/room-03/rebuild-04/'

HZ  = 239.0                            # the room's horizon
X0, Y0, SL = 1185.0, 383.0, 0.2135     # the counter's lit front edge
V_BACK = 0.95                          # above this, wall and back bar
V_SLAB = 1.18                          # the counter slab's lower edge
V_BASE = 1.945                         # below this, the dirt floor

# THREE BANDS, BECAUSE THREE MEN AND TWO STOOLS STAND ALONG THIS BAR and no one
# stretch of it is unobstructed over its whole height. Each band is sourced from
# a stretch that was looked at and is clean FOR THAT BAND.
#
#   the slab    v 0.95-1.18. A lit edge and a slab face, uniform along the run,
#               so it is continued along the run from the clean column beside
#               the hole. Continuing something genuinely constant is not a
#               smear; it is the shape of the thing.
#   the front   v 1.18-1.945. Apron, panel, pilasters, base moulding and plinth,
#               from the ACCEPTED cold-dirt plate -- and this is the one place
#               the reconstruction cannot use the rebuilt bar itself. THERE IS
#               NO CLEAN BAY IN IT. Three men and two stools stand along this
#               run and every stretch of it has a boot, a knee or a stool seat
#               across some part of its height; the widest window unobstructed
#               from apron to dirt is 25 px, a third of a bay. Two attempts to
#               continue the bar from itself duly copied a stool seat, a
#               trouser leg and a boot into the empty room.
#
#               The accepted plate's bar is people-free and fully panelled, and
#               in (w, v) it lands on THIS bar exactly: the warp is verified,
#               its counter edge falling on this counter edge along the whole
#               run. What it does not share is the bay pitch -- 0.117 in w
#               against this bar's 0.083 -- so the bay is RESCALED by 0.083 /
#               0.117 as it is mapped, and anchored on this bar's own pilaster
#               at plate x 1630. The reconstruction therefore has THIS bar's
#               pitch, THIS bar's height and THIS bar's line; what it borrows
#               is the panel's mouldings, and those it borrows from a bar that
#               is the same design in the same room.
SLAB_W = 5.4713                        # a clean counter column   (plate 1670)

# The accepted plate's counter lit front edge, measured the same way (rms 2 px).
AX0, AY0, ASL = 1220.0, 423.3, 0.22687
A_CLEAN = (5.6748, 5.7470)             # its one clean stretch (plate 1692-1788)
REB_ANCHOR, ACC_ANCHOR = 5.4765, 5.7470   # a pilaster in each, plate 1630 / 1788
PITCH_R, PITCH_A = 0.0832, 0.1171      # bay pitch in w, measured off each plate
VSPAN_R, VSPAN_A = 1.0, 1.0            # v needs no correction: measured, the panel's
                                       # bottom moulding is v 1.847 on this bar and
                                       # v 1.851 on the accepted one. Same design, same
                                       # size, same horizon, so v maps one to one.

# THE PATRON AS HE STANDS IN rebuild-01, restated from nugget-bar-grounding.py.
# Loose on purpose here and that is correct: this polygon says what to ERASE,
# and erasing a few pixels of bar that the bar itself then puts back costs
# nothing, while erasing too little leaves a rim of him in the empty room.
SILHOUETTE = [
    (1682, 220), (1688, 210), (1700, 203), (1722, 199), (1748, 202), (1762, 210),
    (1772, 222), (1774, 233), (1762, 241), (1754, 250), (1754, 276), (1772, 287),
    (1797, 304), (1807, 340), (1812, 400), (1810, 472), (1802, 532), (1797, 580),
    (1780, 602), (1777, 650), (1793, 672), (1798, 690), (1792, 704), (1745, 709),
    (1712, 703), (1707, 690), (1702, 702), (1660, 711), (1638, 708), (1633, 694),
    (1646, 678), (1650, 650), (1646, 600), (1628, 584), (1621, 520), (1619, 430),
    (1626, 378), (1638, 330), (1653, 300), (1670, 287), (1686, 276), (1684, 248),
]
GROW = 6.0
# AND HIS RIGHT SIDE, WHICH THE POLYGON CUTS THROUGH. It was authored to say
# where a man is, and it is a few pixels tight along his coat from the elbow
# down; with him composited back on top of it that cost nothing, and with him
# removed it leaves a lit sliver of his trousers standing on the bar. Erasing
# the whole strip costs nothing either: everything in it is bar, and the bar
# puts itself back.
EXTRA = (1768, 455, 1818, 714)

# THE RUN'S FAR END, WHICH IS THE OTHER HALF OF STEP A. The endpoint stopped the
# bar nine pixels early: a counter top whose lit edge ends at x 1185, a front
# face whose left edge is at x 1191, and between and below them a flat
# untextured smear with no top, no plinth, no base line and no contact with the
# floor. It does not read as a counter terminating in space because it is not
# one -- it is a texture running out of pixels.
#
# The accepted plate HAS a complete end section: counter top, its returned
# thickness, a shadowed end panel, the plinth, and the line where all of it
# meets the dirt. That whole section is brought over in (w, v) with a single
# shift, which lands it on THIS bar's counter line, at THIS bar's scale, and --
# because the shift is chosen so the accepted end arrives at the rebuilt end --
# terminating where THIS bar terminates. The old bar's LENGTH is not reinstated:
# its end is 22 px further right and going back to it would shorten this run.
#
# TWO BANDS AGAIN, and for the same reason: the accepted plate stands a stool in
# front of its own bar end, from v 1.40 down. Above that line the end section is
# clean and is taken whole -- counter top, its returned thickness, the shadowed
# end panel. Below it the plinth, the base moulding and the line where the bar
# meets the dirt are taken from the same bar's clean stretch further along the
# run, brought to the terminus. The join falls inside the end panel, which is
# one flat shadowed face on both sides of it.
TERM_W  = (4.880, 5.030)               # the rebuilt end, in w  (plate x ~1163-1213)
TERM_DW = 0.2309                       # accepted end w 5.2007 -> rebuilt end w 4.9698
TERM_V  = (0.90, 1.99)
TERM_VS = 1.40                         # where the accepted plate's own stool starts
# AND IT IS NOT DONE. The accepted plate's end section is clean only from v 0.90
# to v 1.37: below that its OWN first stool stands in front of its own bar end,
# seat and legs, from x 1205 to 1350. Every shift that reaches a stool-free
# plinth reaches it somewhere else along the run, where the bar has a front face
# and not an end, so the end's vertical edge is lost below v 1.4 -- and bringing
# the section anyway puts that stool in the middle of the room, which two
# attempts did. The remaining sources are an 8 px strip of the accepted end
# panel at x 1197-1205, which is the tiny-fragment repair this pass is forbidden
# to make. So the terminus is left as it is and REPORTED, not bodged.
TERMINUS_OPEN = True

# The card cluster's own floor window, and the gates that decide what in it is
# floor rather than furniture standing on it.
CARD = (655, 385, 1195, 620)
CARD_FLAT = 7.0
CARD_MIN = 4000
TERM_DW2 = 0.7055                      # to the accepted bar's clean plinth (x ~1740)


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def top(x):
    return Y0 + SL * (x - X0)


def sample(img, X, Y):
    """Bilinear, so a warp along the run does not step."""
    H, W, _ = img.shape
    X = np.clip(X, 0, W - 1.001); Y = np.clip(Y, 0, H - 1.001)
    x0 = np.floor(X).astype(int); y0 = np.floor(Y).astype(int)
    fx = (X - x0)[..., None]; fy = (Y - y0)[..., None]
    a = img[y0, x0] * (1 - fx) + img[y0, x0 + 1] * fx
    b = img[y0 + 1, x0] * (1 - fx) + img[y0 + 1, x0 + 1] * fx
    return a * (1 - fy) + b * fy


def main():
    os.makedirs(OUT, exist_ok=True)
    P = np.asarray(Image.open(PRE).convert('RGB')).astype(np.float32)
    A = np.asarray(Image.open(ACC).convert('RGB')).astype(np.float32)
    H, W, _ = P.shape
    cv = Image.open(CANVAS).convert('RGB').resize((CROP[2] - CROP[0], CROP[3] - CROP[1]), Image.LANCZOS)
    C = P.copy()
    C[CROP[1]:CROP[3], CROP[0]:CROP[2]] = np.asarray(cv).astype(np.float32)

    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon(SILHOUETTE, fill=255)
    hole = gaussian_filter((np.asarray(m) > 127).astype(np.float32), GROW) > 0.10
    hole[EXTRA[1]:EXTRA[3], EXTRA[0]:EXTRA[2]] = True
    # A 2 px cross-fade at the boundary. Both sides are the same bar, and a hard
    # edge between two renderings of it reads as a wave along his old outline.
    soft = np.clip((gaussian_filter(hole.astype(np.float32), 2.0) - 0.30) / 0.40, 0, 1)

    lumP = .299 * P[:, :, 0] + .587 * P[:, :, 1] + .114 * P[:, :, 2]
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    s = np.maximum(top(xx) - HZ, 1.0)
    v = (yy - HZ) / s
    w = np.log(s)

    out = P.copy()

    # ---- the wall and the back bar, in register from the plate this bar was
    #      composed into: the endpoint reproduced them, and they are not on the
    #      bar's own plane.
    zone_back = hole & (v < V_BACK)
    out[zone_back] = C[zone_back]

    # ---- the counter slab, continued along the run from the clean column
    #      beside the hole.
    z = hole & (v >= V_BACK) & (v < V_SLAB)
    if z.any():
        ss = np.exp(np.full(z.sum(), SLAB_W))
        Xs = X0 + (ss - (Y0 - HZ)) / SL
        Ys = HZ + v[z] * ss
        out[z] = sample(P, Xs, Ys)
        del z

    # ---- the bar's front, from the people-free accepted bar, mapped into this
    #      bar's geometry and rescaled to this bar's bay pitch.
    band = hole & (v >= V_SLAB) & (v < V_BASE)
    if band.any():
        ws = ACC_ANCHOR + (w - REB_ANCHOR) * (PITCH_A / PITCH_R)
        aspan = A_CLEAN[1] - A_CLEAN[0]
        t = np.mod((ws - A_CLEAN[0]) / aspan, 2.0)
        ws = A_CLEAN[0] + np.where(t <= 1.0, t, 2.0 - t) * aspan
        ss = np.exp(ws)
        vs = 1.0 + (v - 1.0) * (VSPAN_A / VSPAN_R)
        MAP = sample(A, AX0 + (ss - (AY0 - HZ)) / ASL, HZ + vs * ss)

        # AND PUT IT IN THIS ROOM'S LIGHT. The two plates are lit differently, so
        # the ratio is measured where BOTH are visible -- the bar either side of
        # the hole, at the same heights -- and carried in over the hole by a
        # masked blur. Nothing is matched against pixels of the man.
        lum = lambda a: .299 * a[:, :, 0] + .587 * a[:, :, 1] + .114 * a[:, :, 2]
        ref = ((v >= V_SLAB) & (v < V_BASE) & ~hole).astype(np.float32)
        num = gaussian_filter(ref * lum(P), 40.0)
        den = gaussian_filter(ref * lum(MAP), 40.0)
        ratio = np.clip(num / np.maximum(den, 1e-3), 0.55, 1.80)
        ratio = gaussian_filter(ratio, 12.0)
        fill = np.clip(MAP * ratio[:, :, None], 0, 255)
        a = (soft * band)[:, :, None]
        out = out * (1 - a) + fill * a

    # ---- the run's far end, the accepted bar's whole end section brought on to
    #      this bar's line and this bar's terminus.
    # NOT YET ENABLED -- see TERMINUS_OPEN below.
    term = np.zeros_like(hole) if TERMINUS_OPEN else (
        (w >= TERM_W[0]) & (w <= TERM_W[1]) & (v >= TERM_V[0]) & (v <= TERM_V[1]))
    if term.any():
        ss = np.exp(w + np.where(v < TERM_VS, TERM_DW, TERM_DW2))
        Xt = AX0 + (ss - (AY0 - HZ)) / ASL
        Yt = HZ + v * ss
        fillt = sample(A, Xt, Yt)
        lum2 = lambda a: .299 * a[:, :, 0] + .587 * a[:, :, 1] + .114 * a[:, :, 2]
        rt = np.clip(gaussian_filter(lum2(P), 30.0) / np.maximum(gaussian_filter(lum2(fillt), 30.0), 1.0),
                     0.55, 1.80)
        at = np.clip((gaussian_filter(term.astype(np.float32), 2.0) - 0.30) / 0.40, 0, 1)[:, :, None]
        out = out * (1 - at) + np.clip(fillt * rt[:, :, None], 0, 255) * at

    # ---- the floor, in register from the accepted cold-dirt plate, carrying
    #      this plate's own low-frequency light so the dirt is canonical and the
    #      lamp pool is not flattened.
    zone_floor = hole & (v >= V_BASE)
    if zone_floor.any():
        lp = lambda a: gaussian_filter(.299 * a[:, :, 0] + .587 * a[:, :, 1] + .114 * a[:, :, 2], 18.0)
        shade = np.clip(lp(P) / np.maximum(lp(A), 1.0), 0.30, 1.60)
        out[zone_floor] = np.clip(A * shade[:, :, None], 0, 255)[zone_floor]

    # ---- AND THE CARD CLUSTER'S FLOOR, which is the other thing this room's
    #      background needs and is the same kind of work: the card cluster drew
    #      a PLANK floor into a saloon whose floor is packed dirt, and its
    #      salvage repaired only from y 505 down, taking everything above for
    #      shadow under the table. Right of the group it is open lit floor, and
    #      the stove man stood on it until he moved to the back of the room.
    #      Dirt comes from the accepted plate AT THE SAME COORDINATES, carrying
    #      this plate's own low-frequency light, so the grain is canonical and
    #      the lamp pool is not flattened. The room's own floor mask says what is
    #      floor and the phase-1.5C furniture mask keeps the accepted plate's own
    #      chairs and stools from being used as a source for dirt.
    reg = np.zeros((H, W), bool)
    reg[CARD[1]:CARD[3], CARD[0]:CARD[2]] = True
    reg &= np.asarray(Image.open(FLOORMASK).convert('L')) > 127
    fmask = gaussian_filter((np.asarray(Image.open(FURNITURE).convert('L')) > 127
                             ).astype(np.float32), 2.0) > 0.05
    reg &= ~fmask
    k = 9
    mu = uniform_filter(lumP, k, mode='nearest')
    sd = np.sqrt(np.maximum(uniform_filter(lumP * lumP, k, mode='nearest') - mu * mu, 0.0))
    lab, _ = label((sd < CARD_FLAT) & reg)
    sizes = np.bincount(lab.ravel()); sizes[0] = 0
    keep = np.isin(lab, np.nonzero(sizes >= CARD_MIN)[0])
    km = np.clip((gaussian_filter(keep.astype(np.float32), 2.5) - 0.35) / 0.4, 0, 1)
    shade2 = np.clip(gaussian_filter(lumP, 18.0) / np.maximum(gaussian_filter(
        .299 * A[:, :, 0] + .587 * A[:, :, 1] + .114 * A[:, :, 2], 18.0), 1.0), 0.30, 1.60)
    out = out * (1 - km[:, :, None]) + np.clip(A * shade2[:, :, None], 0, 255) * km[:, :, None]

    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    dst = OUT + 'plate-room-03-empty.png'

    if '--check' in sys.argv:
        vis = np.where(hole[:, :, None], P * .35 + np.array([255, 0, 190]) * .65, P)
        Image.fromarray(np.clip(vis, 0, 255).astype(np.uint8)).save('/tmp/empty-hole.png')
        print('wrote /tmp/empty-hole.png ; erasing %d px' % hole.sum())
        return

    img.save(dst)
    rec = {
        'schema': 1,
        'note': 'The Nugget with the foreground bar patron removed and the bar and floor he '
                'stood in front of reconstructed. STEP A of the recomposition: no person is '
                'composited here. No image operation.',
        'from': PRE, 'fromSha256': sha(PRE),
        'floorSource': ACC, 'floorSourceSha256': sha(ACC),
        'wallSource': CANVAS, 'wallSourceSha256': sha(CANVAS),
        'geometry': {'horizon': HZ, 'counterTopEdge': [X0, Y0, SL],
                     'vBack': V_BACK, 'vSlab': V_SLAB, 'vBase': V_BASE,
                     'slabColumnW': SLAB_W,
                     'acceptedEdge': [AX0, AY0, ASL], 'acceptedCleanBayW': list(A_CLEAN),
                     'anchorW': [REB_ANCHOR, ACC_ANCHOR],
                     'pitchW': [PITCH_R, PITCH_A], 'vSpan': [VSPAN_R, VSPAN_A],
                     'terminusW': list(TERM_W), 'terminusShiftW': [TERM_DW, TERM_DW2],
                     'terminusV': list(TERM_V), 'terminusVSplit': TERM_VS},
        'erasedPixels': int(hole.sum()), 'extraErase': list(EXTRA),
        'cardFloor': {'window': list(CARD), 'flatMax': CARD_FLAT, 'minRegion': CARD_MIN,
                      'floorMask': FLOORMASK, 'furnitureMask': FURNITURE,
                      'fraction': None},
        'terminus': 'OPEN -- not repaired in this pass, see the tool header',
        'out': dst,
    }
    rec['outSha256'] = sha(dst)
    json.dump(rec, open(OUT + 'empty.json', 'w'), indent=1)
    print(json.dumps({k: val for k, val in rec.items() if k != 'note'}, indent=1))


main()
