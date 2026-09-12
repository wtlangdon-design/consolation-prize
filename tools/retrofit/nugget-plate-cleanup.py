#!/usr/bin/env python3
"""Repair the Nugget's rebuilt plate where the two generated clusters and the
grounding translation left environment behind. ZERO IMAGE OPERATIONS.

Tyler, 2026-09-12, with both characters now accepted and immovable: the floor
by the stove man's old place is not consistently dirt, the bar's far end
dissolves instead of resolving as furniture, and the foreground patron reads as
standing on an old wooden platform. "The patron is not the problem. The
background beneath him is."

THE AUDIT CAME FIRST AND IT MOVED THE DIAGNOSIS TWICE, so the record of what
each source actually contains is the most useful thing in this file.

  A  THE CARD CLUSTER PAVED ITS FLOOR. Plate x 1085-1186, y 405-600 is plank
     in the shipping plate and mottled dirt in the accepted cold-dirt plate,
     measured at the same coordinates. `nugget-card-salvage.py` repaired that
     cluster's floor from y 505 DOWN, on the reasoning that above 505 was dark
     shadow under the table. Right of the group it is open lit floor, and the
     stove man's body covered it until he moved to the back of the room.

  B  THE BAR CLUSTER DID NOT PAVE ITS FLOOR, and the first draft of this pass
     assumed it had. Side by side at x 1150-1900, y 600-864 the accepted plate
     and the shipping plate carry the same dirt, the same grain, the same
     clods; the generated output's own floor (bar-rebuild-01/source.png) is
     dirt too. A region built on that assumption restored dirt the room
     already had and, at its right end, pasted the ACCEPTED plate's bar over
     the near floor -- the accepted bar stands 130 px further forward there
     than the rebuilt one does. It was removed.

  C  THE PLATFORM IS THE TRANSLATION'S SLACK. `nugget-bar-grounding.py` lays
     the patron back down 82 rows by compositing the whole plate shifted 82
     rows inside his shifted outline. The outline is deliberately loose -- "a
     few pixels loose on purpose, because a loose edge costs nothing" -- and
     it does cost nothing where it covers him. Below his old outline's bottom
     edge at y 711 it covers FLOOR, and there the shifted plate brings the
     bar's kick-board, plinth and rail down 82 rows and lays them on the dirt
     behind his boots: a flat, wood-toned apron with a straight lower edge,
     which is exactly a wooden platform to stand on. The same slack beside his
     right leg drops a lit step and a hard black void into the bar's front
     panel at x 1780-1814, y 584-698.

     THE FIX IS NOT A REPAINT OF HIM. Below y 711 the shifted plate has no
     business being there at all, and rebuild-01 -- the same room, the same
     rebuilt bar, unshifted -- is the authority, because his old body ended at
     711 and everything below it is ordinary background. So the slack is given
     back its own floor, his boots are excluded by an authored mask, and the
     grounding's contact shadows are re-applied over what is restored. He does
     not move by one pixel and not one pixel of him is repainted.

  D  THE BAR'S FAR END. At 10x with the local contrast stretched, the terminus
     is three things: a counter top whose lit front edge ends cleanly at
     x 1185; a front face with stile, panel and plinth whose left edge is at
     x 1191; and between and below them a flat untextured smear from x 1180 to
     1189 running down to y 520 with no top, no plinth, no base line and no
     contact with the floor. The run stops being furniture nine pixels early.

     The first draft restored the ACCEPTED plate's end panel here, because
     that plate has the termination the generation omitted. That is the one
     thing this pass must not do: the accepted bar ends 22 px further right,
     so restoring it reinstates obsolete geometry over current geometry and
     shortens the current run. The current bar is the authority, so the end is
     built from the current bar's own front face.

THE DIRT REPAIR IS THE CARD SALVAGE'S METHOD, which takes its dirt from the
accepted plate AT THE SAME COORDINATES -- the room's own floor, at the room's
own depth, in register. No tiling and no synthesis:

    out = acceptedDirt x (shipping low-frequency / accepted low-frequency)

so the grain and colour are canonical and every cast shadow and lamp pool the
rebuilt room added survives as the ratio.

AND A RESTORE SOURCE IS ONLY A SOURCE FOR WHAT IT ACTUALLY CONTAINS. The
accepted plate stands its own stools, chairs and spittoon on that floor; the
phase-1.5C furniture mask takes them out, after which a flatness gate keeps
anything standing on the floor in the SHIPPING plate, and a connected-area gate
keeps the repair to the floor itself.
"""
import hashlib, json, os, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import uniform_filter, gaussian_filter, label

ACCEPTED  = 'art/staging/room-03/corrected-03/plate-cold-dirt.png'
FLOORMASK = 'art/staging/room-03/floor-03/floor-mask-plate.png'
FURNITURE = 'art/staging/room-03/corrected-03/furniture-tight-mask.png'
PRE_GROUND = 'art/staging/room-03/rebuild-01/plate-room-03-rebuilt.png'
SHIPPING  = 'art/staging/room-03/rebuild-02/plate-room-03-rebuilt.png'
OUT       = 'art/staging/room-03/rebuild-03/'

# --- A, the card cluster's planking -----------------------------------------
# THE WHOLE FOOTPRINT, not the part an owner happened to point at. The strip
# the stove man uncovered is at x 1085-1186; the same plank shows on the other
# side of the group as well, in the gaps between the piano stool and the near
# chair at x 690-760, and it is the same cluster and the same unrepaired band.
# Inspecting the entire cluster footprint is the lesson this pass records, so
# the region is the cluster's own floor window and not a patch around a
# complaint. The room's phase-1.5B floor mask says which of it is floor -- the
# whole public floor with no holes but the table top, which is the one large
# flat thing in here that a flatness gate would otherwise take for floor.
REGION_A   = (655, 385, 1195, 620)
# WHAT THE GATES LEAVE, AND WHY IT IS LEFT. Above y ~510, between x 700 and
# 1080, the cluster's plank also shows in the gaps between the chairs and
# beside the piano stool -- and there is NO ALIGNED DIRT SOURCE for it. The
# accepted plate stands its OWN card table and four chairs on exactly those
# coordinates, so the furniture gate removes them, correctly: a restore source
# is only a source for what it actually contains. Sourcing that dirt from
# anywhere else in the room is the pasted rectangle this pass is forbidden.
# It is left, and it is recorded. At gameplay tone that band is shadow under a
# table -- the plank was legible only where the stove man had been standing,
# which is open lit floor and is x 1085-1186, which this repairs.
FLAT_MAX   = 7.0        # local std above this is an object, not a floor
FEATHER    = 2.5
MIN_REGION = 4000       # a floor is one big region; a stool seat is not

# --- C, the translation's slack ---------------------------------------------
# Straight out of nugget-bar-grounding.py, because this repair has to describe
# the same shape that pass composited. Restated rather than imported: the tool
# is a script, and a copy that is checked against it is safer than an import
# that quietly follows it if it is ever re-run with a different outline.
SHIFT = 82
SILHOUETTE = [
    (1682, 220), (1688, 210), (1700, 203), (1722, 199), (1748, 202), (1762, 210),
    (1772, 222), (1774, 233), (1762, 241), (1754, 250), (1754, 276), (1772, 287),
    (1797, 304), (1807, 340), (1812, 400), (1810, 472), (1802, 532), (1797, 580),
    (1780, 602), (1777, 650), (1793, 672), (1798, 690), (1792, 704), (1745, 709),
    (1712, 703), (1707, 690), (1702, 702), (1660, 711), (1638, 708), (1633, 694),
    (1646, 678), (1650, 650), (1646, 600), (1628, 584), (1621, 520), (1619, 430),
    (1626, 378), (1638, 330), (1653, 300), (1670, 287), (1686, 276), (1684, 248),
]
OLD_BOTTOM = 711 + 3            # below his old outline, plus the 3 px feather
SLAB = (1780, 584, 1814, 698)   # the slack beside his right leg
# His boots where they now stand, read at 6x off the true-tone plate. Generous
# by a pixel or two on purpose: leaving a sliver of apron costs a sliver, and
# clipping an accepted boot is a repaint of a man this pass may not touch.
LEFT_BOOT = [(1657, 704), (1702, 704), (1704, 752), (1700, 770), (1692, 784),
             (1676, 789), (1662, 784), (1655, 766), (1654, 732)]
RIGHT_BOOT = [(1713, 704), (1786, 704), (1789, 748), (1786, 762), (1776, 774),
              (1758, 781), (1737, 782), (1719, 777), (1712, 760)]
BOOT_GROW = 2.0
# The grounding's own contact shadows, re-applied over what is restored.
BOOTS = [((1675, 700 + SHIFT), 40, 9), ((1748, 695 + SHIFT), 46, 10)]

# --- D, the bar's far end ----------------------------------------------------
# The slice at x 1196-1203 carries THIS bar's stile, panel rail, plinth and
# base moulding at THIS bar's heights. SHIFT is 11 px left and 3 px up: the
# run's own lit top edge falls 5 px over 18 (measured, x 1194 at y 385 and
# x 1212 at y 390), so the plinth and the base line rise by the same slope over
# the same distance. DARKEN is the end face turning away from the lamp.
END_CAP_SRC   = (1196, 398, 1203, 548)
END_CAP_DST_X = 1185
END_CAP_DY    = -3
END_CAP_DARK  = 0.72


def sha(p):
    return hashlib.sha256(open(p, 'rb').read()).hexdigest()


def lum(a):
    return .299 * a[:, :, 0] + .587 * a[:, :, 1] + .114 * a[:, :, 2]


def flatness(L):
    k = 9
    mu = uniform_filter(L, k, mode='nearest')
    var = np.maximum(uniform_filter(L * L, k, mode='nearest') - mu * mu, 0.0)
    return np.sqrt(var)


def poly(points, W, H):
    m = Image.new('L', (W, H), 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    return np.asarray(m) > 127


def main():
    os.makedirs(OUT, exist_ok=True)
    A = np.asarray(Image.open(ACCEPTED).convert('RGB')).astype(np.float32)
    D = np.asarray(Image.open(SHIPPING).convert('RGB')).astype(np.float32)
    P = np.asarray(Image.open(PRE_GROUND).convert('RGB')).astype(np.float32)
    H, W, _ = A.shape
    LA, LD = lum(A), lum(D)
    out = D.copy()

    # ---- A. the card cluster's planking, given the room's own dirt back -----
    x0, y0, x1, y1 = REGION_A
    regions = np.zeros((H, W), bool)
    regions[y0:y1, x0:x1] = True
    floor = np.asarray(Image.open(FLOORMASK).convert('L')) > 127
    regions &= floor
    furn = gaussian_filter((np.asarray(Image.open(FURNITURE).convert('L')) > 127
                            ).astype(np.float32), 2.0) > 0.05
    regions &= ~furn
    flat = flatness(LD) < FLAT_MAX
    lab, _ = label(flat & regions)
    sizes = np.bincount(lab.ravel())
    sizes[0] = 0
    keep = np.isin(lab, np.nonzero(sizes >= MIN_REGION)[0])

    m = gaussian_filter(keep.astype(np.float32), FEATHER)
    m = np.clip((m - 0.35) / 0.4, 0, 1)
    shade = np.clip(gaussian_filter(LD, 18.0) / np.maximum(gaussian_filter(LA, 18.0), 1.0),
                    0.30, 1.60)
    dirt = np.clip(A * shade[:, :, None], 0, 255)
    out = out * (1 - m[:, :, None]) + dirt * m[:, :, None]

    # ---- C. the translation's slack, given the room back -------------------
    sil = gaussian_filter(poly(SILHOUETTE, W, H).astype(np.float32), 3) > 0.5
    down = np.zeros_like(sil)
    down[SHIFT:, :] = sil[:-SHIFT, :]
    yy, xx = np.mgrid[0:H, 0:W]

    boots = poly(LEFT_BOOT, W, H) | poly(RIGHT_BOOT, W, H)
    boots = gaussian_filter(boots.astype(np.float32), BOOT_GROW) > 0.12

    slack = (down & (yy >= OLD_BOTTOM) & ~boots)
    sx0, sy0, sx1, sy1 = SLAB
    slab = np.zeros((H, W), bool)
    slab[sy0:sy1, sx0:sx1] = True
    slack |= slab & down

    s = gaussian_filter(slack.astype(np.float32), 1.6)
    s = np.clip((s - 0.35) / 0.35, 0, 1)
    out = out * (1 - s[:, :, None]) + P * s[:, :, None]

    # CONTACT. The grounding darkened the dirt under each boot; the floor this
    # pass hands back gets the same darkening, or the repair would undo half of
    # the grounding Tyler has already accepted.
    cs = np.zeros((H, W), np.float32)
    for (cx, cy), rx, ry in BOOTS:
        d = ((xx - cx) / float(rx)) ** 2 + ((yy - cy + 3) / float(ry)) ** 2
        cs = np.maximum(cs, np.clip(1.0 - d, 0, 1))
    cs = gaussian_filter(cs, 2.0) * 0.45 * s
    out *= (1 - cs[:, :, None])

    # ---- D. the bar's own end, built from the bar's own front --------------
    cx0, cy0, cx1, cy1 = END_CAP_SRC
    cap = out[cy0:cy1, cx0:cx1] * END_CAP_DARK
    dy0, dy1 = cy0 + END_CAP_DY, cy1 + END_CAP_DY
    e = np.zeros((H, W), np.float32)
    e[dy0:dy1, END_CAP_DST_X:END_CAP_DST_X + (cx1 - cx0)] = 1.0
    e = gaussian_filter(e, 1.2)
    e = np.clip((e - 0.25) / 0.5, 0, 1)
    lay = out.copy()
    lay[dy0:dy1, END_CAP_DST_X:END_CAP_DST_X + (cx1 - cx0)] = cap
    out = out * (1 - e[:, :, None]) + lay * e[:, :, None]

    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    dst = OUT + 'plate-room-03-rebuilt.png'

    if '--check' in sys.argv:
        vis = D.copy()
        vis = np.where(m[:, :, None] > 0.5, vis * .45 + np.array([0, 200, 90]) * .55, vis)
        vis = np.where(s[:, :, None] > 0.5, vis * .45 + np.array([255, 170, 0]) * .55, vis)
        vis = np.where(boots[:, :, None], vis * .45 + np.array([60, 120, 255]) * .55, vis)
        vis = np.where(e[:, :, None] > 0.5, vis * .45 + np.array([255, 60, 160]) * .55, vis)
        Image.fromarray(np.clip(vis, 0, 255).astype(np.uint8)).save('/tmp/cleanup-mask.png')
        print('wrote /tmp/cleanup-mask.png  dirt %.3f%%  slack %.3f%%'
              % (100 * (m > .5).mean(), 100 * (s > .5).mean()))
        return

    img.save(dst)
    changed = np.abs(np.asarray(img).astype(np.float32) - D).mean(2) > 4
    ys, xs = np.nonzero(changed)
    rec = {
        'schema': 1,
        'note': "Dirt restored where the card cluster paved the floor; the floor behind the "
                "foreground patron's boots given back after the grounding translation's slack "
                "laid the bar's kick-board on it; the bar's far end built from the current "
                "bar's own front face. No image operation; the ledger stands at 47/47.",
        'from': SHIPPING, 'fromSha256': sha(SHIPPING),
        'dirtSource': ACCEPTED, 'dirtSourceSha256': sha(ACCEPTED),
        'slackSource': PRE_GROUND, 'slackSourceSha256': sha(PRE_GROUND),
        'regionA': {'rect': list(REGION_A), 'flatMax': FLAT_MAX, 'feather': FEATHER,
                    'minRegion': MIN_REGION, 'furnitureMask': FURNITURE,
                    'floorMask': FLOORMASK,
                    'unsourceable': 'the plank in the gaps above y 510 between x 700 and '
                                    '1080: the accepted plate stands its own card group on '
                                    'those coordinates, so it is not a dirt source there',
                    'fraction': round(float((m > .5).mean()), 5)},
        'regionC': {'shift': SHIFT, 'belowRow': OLD_BOTTOM, 'slab': list(SLAB),
                    'bootMaskPoints': len(LEFT_BOOT) + len(RIGHT_BOOT),
                    'bootGrowPx': BOOT_GROW,
                    'fraction': round(float((s > .5).mean()), 5)},
        'endCap': {'src': list(END_CAP_SRC), 'dstX': END_CAP_DST_X, 'dy': END_CAP_DY,
                   'darken': END_CAP_DARK, 'geometry': 'the current rebuilt bar itself'},
        'changedPixels': int(len(ys)),
        'changedBox': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
        'out': dst,
    }
    rec['outSha256'] = sha(dst)
    json.dump(rec, open(OUT + 'cleanup.json', 'w'), indent=1)
    print(json.dumps({k: v for k, v in rec.items() if k != 'note'}, indent=1))


main()
