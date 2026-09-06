"""PHASE 1.5G -- THE OCCLUSION MASK, CUT FROM THE ART INSTEAD OF DRAWN BY HAND (doc 36 Q123).

    python3 tools/retrofit/phase15g-masks.py

Tyler's second finding: the trough clips a man's feet and shins over an area
much larger than the trough. The cause is in the mask, not the engine: Phase
1.5E authored the trough as a six-point polygon, and a six-point polygon around
a box drawn in oblique projection is a convex hull -- it swallowed a wedge of
mud above the far rim and a skirt of mud below the near wall. This replaces
BOTH silhouettes with masks segmented from the plate's own pixels:

  THE TROUGH   dark water and dark front boards, plus the bright lit rim,
               against a per-row median of the mud beside it; closed, filled,
               largest component; then everything below the trough's own base
               line is dropped, which is what removes the contact shadow (a
               shadow is ground, not an occluder).
  THE RAIL     kept as authored quads, because the rail IS three straight
               members and a quad describes each one exactly -- and because the
               mud around it carries the saloon's light pool, which no per-row
               reference survives: segmenting there swallowed half the street.
               The bar quad is corrected down by the few pixels the Phase 1.5E
               overlay showed it missing at its west end.

One file, one source: art/staging/room-02/street-candidate-03/
plane-1-trough-rail.png, the only occluder the candidate room declares. The
record beside it carries both bounding boxes and the pixel counts, and
tools/check-occluder-bounds.mjs holds the mask to the art it was cut from.
"""
import hashlib, json, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()
PLATE = 'art/staging/room-02/street-candidate-03/candidate-plate.png'
OUT = 'art/staging/room-02/street-candidate-03/plane-1-trough-rail.png'
W, H = 3610, 864
# THE BASE LINES, measured off the plate at 8x: where each object meets the mud.
TROUGH_BASE = ((1983, 798), (2218, 750))
# The trough's own left and right ends, measured at 8x: the contact shadow
# spills a dozen pixels past the west end and is not part of the object.
TROUGH_SPAN = (1976, 2236)
RAIL_BASE = ((2300, 788), (2570, 814))
plate = np.array(Image.open(PLATE).convert('RGB')).astype(float)


def base_at(line, x):
    (x0, y0), (x1, y1) = line
    return y0 + (y1 - y0) * (x - x0) / (x1 - x0)


def cut(box, base, dark=0.72, bright=1.40, margin=2, span=None):
    """The object's own pixels: darker or brighter than the mud beside it."""
    x0, y0, x1, y1 = box
    sub = plate[y0:y1, x0:x1]
    lum = sub.mean(axis=2)
    mud = np.median(np.concatenate([sub[:, :12], sub[:, -12:]], axis=1), axis=1).mean(axis=1)[:, None]
    m = (lum < mud * dark) | (lum > mud * bright)
    m = ndimage.binary_closing(m, np.ones((5, 5)))
    m = ndimage.binary_fill_holes(m)
    label, n = ndimage.label(m)
    if n:
        sizes = ndimage.sum(m, label, range(1, n + 1))
        m = label == (int(np.argmax(sizes)) + 1)
    m = ndimage.binary_closing(m, np.ones((7, 7)))
    m = ndimage.binary_fill_holes(m)
    m = ndimage.binary_opening(m, np.ones((3, 3)))
    # A CONTACT SHADOW IS GROUND, NOT AN OCCLUDER: drop everything below the
    # object's own base line, which is also what keeps the mask off the mud.
    ys, xs = np.mgrid[y0:y1, x0:x1]
    m &= ys <= base_at(base, xs) + margin
    if span:
        m &= (xs >= span[0]) & (xs <= span[1])
    label, n = ndimage.label(m)
    if n:
        sizes = ndimage.sum(m, label, range(1, n + 1))
        m = label == (int(np.argmax(sizes)) + 1)
    return m


def place(mask, box):
    full = np.zeros((H, W), bool)
    full[box[1]:box[3], box[0]:box[2]] = mask
    return full


TROUGH_BOX = (1965, 660, 2255, 820)
# The rail's three members, read off the plate: two posts and the bar between
# them. The bar is a quad because it recedes -- 640..662 at its west end,
# 660..682 at its east.
RAIL_QUADS = {
    'near_post': [(2290, 615), (2320, 615), (2320, 790), (2290, 790)],
    'far_post': [(2555, 632), (2583, 632), (2583, 812), (2555, 812)],
    'bar': [(2268, 640), (2612, 660), (2612, 682), (2268, 662)],
}
trough = place(cut(TROUGH_BOX, TROUGH_BASE, span=TROUGH_SPAN), TROUGH_BOX)
railimg = Image.new('L', (W, H), 0)
draw = ImageDraw.Draw(railimg)
for quad in RAIL_QUADS.values():
    draw.polygon(quad, fill=255)
rail = np.array(railimg) > 0
both = trough | rail
image = Image.fromarray(np.dstack([np.zeros((H, W, 3), 'uint8'), (both * 255).astype('uint8')]), 'RGBA')
image.save(OUT)


def bbox(m):
    ys, xs = np.where(m)
    return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]


record = {'schema': 1, 'note': __doc__.strip(), 'source': {PLATE: sha(PLATE)},
          'method': {'dark': 0.72, 'bright': 1.40, 'againstMud': 'per-row median of the 12 columns at each side of the box',
                     'baseLineMarginPx': 2},
          'trough': {'box': list(TROUGH_BOX), 'baseLine': [list(p) for p in TROUGH_BASE], 'span': list(TROUGH_SPAN),
                     'bbox': bbox(trough), 'pixels': int(trough.sum())},
          'rail': {'quads': {k: [list(p) for p in v] for k, v in RAIL_QUADS.items()}, 'baseLine': [list(p) for p in RAIL_BASE],
                   'bbox': bbox(rail), 'pixels': int(rail.sum())},
          'output': {OUT: sha(OUT), 'pixels': int(both.sum())},
          'supersedes': 'art/staging/room-02/street-candidate-03/plane-1-silhouettes.json (Phase 1.5E hand-authored polygons)'}
json.dump(record, open('art/staging/room-02/street-candidate-03/plane-1-cut.json', 'w'), indent=1)
open('art/staging/room-02/street-candidate-03/plane-1-cut.json', 'a').write('\n')
print(f"trough {record['trough']['pixels']} px bbox {record['trough']['bbox']}; "
      f"rail {record['rail']['pixels']} px bbox {record['rail']['bbox']}; total {int(both.sum())}")
