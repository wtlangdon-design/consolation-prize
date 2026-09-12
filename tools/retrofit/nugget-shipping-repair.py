#!/usr/bin/env python3
"""
THE TWO OWNER-REJECTED ROOM 3 SHIPPING DEFECTS, REPAIRED DETERMINISTICALLY.

No generation. Every pixel written here is either copied from an existing
accepted source or is a local shading of pixels already present.

DEFECT B -- THE HALO AROUND THE FOREGROUND PATRON, and where it came from.
`nugget-bar-recompose.py` matted him with

    core  = gaussian_filter(poly, 5.0) > 0.80      # taken as CERTAINLY him
    outer = gaussian_filter(poly, 2.0) > 0.12
    alpha = core | (outer & (d > T_EDGE))

and `poly` is a GENEROUS bound drawn to contain him, not to trace him -- its
left side sits at x 1619-1628 where his trouser is at x 1650. Everything inside
that bound was taken as him unconditionally, so a 15-30px ring of his OLD
surroundings -- bar panelling, kick-board, dark floor -- travelled with him when
he was composited 82 rows down. That ring is the halo the owner sees.

THE REPAIR IS A RESTORE, NOT A REMATTE. His accepted pixels are not recomputed:
the repaired plate is the CURRENT plate inside a tightened silhouette and the
already-reconstructed `plate-room-03-empty.png` outside it. So every pixel of
the man the owner accepted is byte-identical by construction, and the halo is
replaced by the clean room that was built for that exact geometry in step A of
the same rebuild.

DEFECT A -- THE DISSOLVING STOVE-SIDE BAR END, and where it came from.
`rebuild-04/empty.json` records it in as many words: "terminus": "OPEN -- not
repaired in this pass". The bar's far end was never given a physical
termination, so the counter, its front panel and its foot rail each stop at a
ragged edge and fade into the dirt.

    python3 tools/retrofit/nugget-shipping-repair.py [--preview]
"""
import hashlib
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_dilation, binary_fill_holes, gaussian_filter

ROOT = Path(__file__).resolve().parents[2]
PLATE = ROOT / 'art/staging/room-03/rebuild-04/plate-room-03-recomposed.png'
EMPTY = ROOT / 'art/staging/room-03/rebuild-04/plate-room-03-empty.png'
RECORD = ROOT / 'art/staging/room-03/rebuild-05'

# HIS SILHOUETTE, TRACED RATHER THAN BOUNDED. Read off the shipping plate at 4x
# against the composite footprint, in SHIPPING coordinates (the recompose tool's
# own BOUND is in pre-shift coordinates and is 82 rows higher).
MAN = [
    (1690, 303), (1706, 297), (1722, 295), (1740, 297), (1756, 304), (1768, 316),
    (1776, 332), (1780, 345), (1772, 353), (1762, 358), (1758, 372), (1762, 388),
    (1778, 402), (1790, 418), (1797, 440), (1801, 470), (1803, 502), (1801, 536),
    (1795, 566), (1787, 590), (1780, 612), (1774, 648), (1768, 684), (1762, 712),
    # HIS RIGHT BOOT RUNS TO x 1785. The first trace stopped at 1726 and the
    # preview showed the whole boot staged for removal, which is exactly what
    # the preview is for -- the brass foot rail beyond x 1790 is the room's.
    (1758, 730), (1772, 738), (1786, 752), (1790, 764), (1784, 774), (1740, 779),
    (1712, 777), (1704, 770), (1700, 777), (1694, 781), (1668, 783), (1652, 781),
    (1644, 771), (1644, 742), (1648, 706), (1651, 668),
    (1650, 632), (1644, 602), (1638, 574), (1634, 540), (1635, 506), (1640, 472),
    (1648, 440), (1658, 416), (1670, 402), (1680, 388), (1684, 370), (1680, 356),
    (1678, 342), (1682, 324),
]
# A small grow, so a hand-traced line cannot bite into him. The composite
# footprint bounds it either way: this can only ever KEEP pixels the current
# plate already has, never invent one.
GROW = 3

# Re-applied because the restore removes them with the halo. The same two
# ellipses `nugget-bar-recompose.py` authored, at the same centres and radii.
BOOTS = [((1675, 782), 40, 9), ((1748, 777), 46, 10)]
SHADE = 0.45

# ---- DEFECT A: THE STOVE-SIDE END -----------------------------------------
#
# WHERE IT CAME FROM, measured rather than assumed. Block-mean |current -
# accepted cold-dirt plate| over the terminus is 0.3-5.1 for every row band at
# x 1160-1180 and 8-40 from x 1180 rightward. So the rebuild never touched the
# room left of x 1180: THE DISSOLVE IS IN THE SOURCE GENERATED PLATE and every
# step since has carried it forward. `rebuild-04/empty.json` says so in as many
# words -- "terminus": "OPEN -- not repaired in this pass". The authoritative
# pixels are therefore the CURRENT bar's own material from x 1189 rightward,
# and the current plate's own untouched wall and floor from x 1160 leftward.
#
# WHAT ACTUALLY DISSOLVES, read at 9-12x. The bar already HAS an end: the
# counter's lit nosing starts at (1189, 382), a dark end edge runs down from
# (1188, 398) to (1203, 425), and the front face carries a stile edge at
# x 1194 from y 480 to 545. Two things run PAST that end and fade out, and
# they are the whole of what the owner is seeing:
#
#   1  THE NOSING SMEARS LEFT. The cream top-edge highlight does not stop at
#      the end; it feathers out across x 1176-1189 over the flat blue-grey
#      wall behind. A bright edge that fades instead of stopping is what
#      reads as "the counter dissolves".
#
#   2  THE FOOT RAIL OUTRUNS THE BAR. Its brass highlight continues to
#      x 1176 -- eighteen pixels beyond the stile, with no bar above it --
#      and thins into bare dirt. A rail over nothing is the single most
#      visible part of the defect.
#
# THE REPAIR IS TO CUT BOTH BACK TO THE END THE BAR ALREADY HAS, so the
# terminus is one vertical line instead of three ragged ones. No new
# architecture is drawn: the bar keeps exactly the end it was built with.
#
# THE FILL IS A SHORT REGISTERED TRANSLATION FROM IMMEDIATELY ADJACENT, and
# both sources were read before being used. A first attempt moved 60px of
# floor across from x-60, brought the wall base and a stray object with it,
# and read as exactly the pasted patch this project has rejected before.
#   the nosing band's source, x 1128-1158 y 372-392, is flat wall carrying the
#   same dark horizontal line at y 391 and stopping well clear of the stove at
#   x 1125; the rail band's source, x 1120-1150 y 518-560, is open dirt at the
#   same depth with no furniture in it.
#
# EACH REGION IS HARD-CLAMPED ON ITS RIGHT so the feather cannot reach into
# bar_1's declared box, which begins at x 1195. Nothing here is allowed to
# touch a patron, and the gate in `nugget-shipping-gate.py` asserts it rather
# than trusting the clamp.
#
# THE NOSING BAND IS ALSO CLAMPED ON ITS LEFT, at x 1178, because the stove
# man's declared box runs to x 1177. He is an ACTOR and owns no pixel of the
# plate, so a change to the wall behind him would harm nothing -- but a gate
# that has to be argued with is not a gate, so the repair simply stays out of
# his box and the assertion is a flat zero.
NOSING = [(1176, 372), (1190, 372), (1190, 392), (1176, 392)]
NOSING_FROM = 30
NOSING_START = 1178
NOSING_STOP = 1191
RAIL = [(1164, 518), (1192, 518), (1192, 560), (1164, 560)]
RAIL_FROM = 44
RAIL_START = 0
RAIL_STOP = 1195
FEATHER = 1.4


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def man_mask(shape):
    m = Image.new('L', (shape[1], shape[0]), 0)
    ImageDraw.Draw(m).polygon(MAN, fill=255)
    poly = np.asarray(m) > 0
    return binary_dilation(poly, np.ones((GROW * 2 + 1, GROW * 2 + 1)))


def repair_bar_end(img):
    """
    CUT THE TWO OVERRUNS BACK TO THE END THE BAR ALREADY HAS. Nothing is
    invented: each region is filled with a short registered translation of the
    untouched wall or floor immediately beside it, at the same rows, the same
    depth and the same light.
    """
    out = img.astype(float)
    for poly, dx, start, stop in ((NOSING, NOSING_FROM, NOSING_START, NOSING_STOP),
                                  (RAIL, RAIL_FROM, RAIL_START, RAIL_STOP)):
        m = Image.new('L', (img.shape[1], img.shape[0]), 0)
        ImageDraw.Draw(m).polygon(poly, fill=255)
        a = gaussian_filter(np.asarray(m).astype(float) / 255.0, FEATHER)
        a[:, :start] = 0.0
        a[:, stop:] = 0.0
        a = a[:, :, None]
        out = out * (1 - a) + np.roll(out, dx, axis=1) * a
    return out


def main():
    cur = np.asarray(Image.open(PLATE).convert('RGB')).astype(float)
    emp = np.asarray(Image.open(EMPTY).convert('RGB')).astype(float)
    footprint = np.abs(cur - emp).max(axis=2) > 0
    keep = man_mask(cur.shape[:2]) & footprint

    if '--preview' in sys.argv:
        lit = np.clip((cur / 255) ** 0.42 * 255, 0, 255)
        halo = footprint & ~keep
        lit[halo] = lit[halo] * 0.4 + np.array([255, 60, 60]) * 0.6
        edge = keep & ~binary_dilation(~keep, np.ones((3, 3)))
        lit[keep & ~edge] = lit[keep & ~edge] * 0.75 + np.array([80, 255, 120]) * 0.25
        box = (1600, 270, 1840, 800)
        out = Path('/tmp/keep-preview.png')
        Image.fromarray(lit.astype('uint8')).crop(box).resize(
            ((box[2] - box[0]) * 3, (box[3] - box[1]) * 3), Image.NEAREST).save(out)
        print(f'GREEN kept as him, RED restored to the clean room -> {out}')
        print(f'  footprint {footprint.sum()}  keep {keep.sum()}  restored {(footprint & ~keep).sum()}')
        return

    out = cur.copy()
    out[~keep] = emp[~keep]

    # THE CONTACT SHADOW IS PUT BACK ON THE CLEAN DIRT, not inherited from the
    # halo: two soft ellipses, multiplied, and never over him.
    cs = np.zeros(cur.shape[:2])
    d = ImageDraw.Draw(Image.fromarray(np.zeros(cur.shape[:2], 'uint8')))
    stamp = Image.new('F', (cur.shape[1], cur.shape[0]), 0.0)
    sd = ImageDraw.Draw(stamp)
    for (cx, cy), rx, ry in BOOTS:
        sd.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=1.0)
    cs = gaussian_filter(np.asarray(stamp, dtype=float), 2.0) * SHADE
    cs[keep] = 0.0
    out = out * (1 - cs[:, :, None])

    out = repair_bar_end(out)

    out = np.clip(out, 0, 255).astype('uint8')
    RECORD.mkdir(parents=True, exist_ok=True)
    dest = RECORD / 'plate-room-03-repaired.png'
    Image.fromarray(out).save(dest)

    changed = np.abs(out.astype(int) - cur.astype(int)).max(axis=2) > 0

    # TWO REGIONS, REPORTED SEPARATELY. A union bounding box would span the
    # whole width of the room and would say nothing about where the pass
    # actually wrote, which is the one thing this number is for.
    regions = {}
    for name, lo, hi in (('A  stove-side bar end', 0, 1400),
                         ('B  foreground bar man', 1400, cur.shape[1])):
        sub = changed.copy()
        sub[:, :lo] = False
        sub[:, hi:] = False
        ys, xs = np.nonzero(sub)
        regions[name] = {
            'pixels': int(sub.sum()),
            'bbox': [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())],
        }

    before, after = sha(PLATE), sha(dest)
    print(f'BEFORE {before}')
    print(f'AFTER  {after}')
    print(f'changed {changed.sum()} px total')
    for name, r in regions.items():
        x0, y0, x1, y1 = r['bbox']
        print(f'  {name}: {r["pixels"]:6d} px   bbox x {x0}-{x1}  y {y0}-{y1}')

    RECORD.joinpath('repair.json').write_text(json.dumps({
        'note': ('ROOM 3 SHIPPING ART REPAIR, rebuild-05. The two defects Tyler '
                 'rejected in the deployed build, repaired deterministically from '
                 'sources already in the repository. No image generation: the '
                 'operation ledger is unchanged at 49 and operations 50 and 51 '
                 'stay withdrawn.'),
        'inputs': {
            'plate': str(PLATE.relative_to(ROOT)), 'plateSha256': before,
            'empty': str(EMPTY.relative_to(ROOT)), 'emptySha256': sha(EMPTY),
        },
        'output': {'plate': str(dest.relative_to(ROOT)), 'sha256': after},
        'defectB': {
            'what': 'residual background halo around the foreground bar man',
            'origin': ('nugget-bar-recompose.py matted him with an unconditional '
                       'core term over a GENEROUS 42-point bound, so a ring of his '
                       'old surroundings travelled with him through the 82-row shift'),
            'method': ('restore, not rematte: current plate inside a traced '
                       'silhouette, rebuild-04/plate-room-03-empty.png outside it, '
                       'so his accepted pixels are byte-identical by construction'),
            'silhouettePoints': len(MAN), 'grow': GROW,
            'contactShadows': BOOTS, 'shade': SHADE,
        },
        'defectA': {
            'what': 'the stove-side bar end dissolving into the floor',
            'origin': ('present in the SOURCE generated plate: block-mean '
                       '|current - corrected-03/plate-cold-dirt.png| is 0.3-5.1 at '
                       'x 1160-1180 for every row band of the terminus, so the '
                       'rebuild never touched it; rebuild-04/empty.json records the '
                       'terminus as "OPEN -- not repaired in this pass"'),
            'method': ('cut the two overruns back to the moulded end stile the bar '
                       'already carries at x 1193-1196; fill each with a short '
                       'registered translation of the untouched wall or floor '
                       'immediately beside it'),
            'nosing': {'poly': NOSING, 'sourceDx': -NOSING_FROM, 'clampX': [NOSING_START, NOSING_STOP]},
            'rail': {'poly': RAIL, 'sourceDx': -RAIL_FROM, 'clampX': [RAIL_START, RAIL_STOP]},
            'feather': FEATHER,
        },
        'changed': {'pixels': int(changed.sum()), 'regions': regions},
    }, indent=1) + '\n')
    print(f'wrote {dest}')
    print(f'wrote {RECORD / "repair.json"}')


if __name__ == '__main__':
    main()
