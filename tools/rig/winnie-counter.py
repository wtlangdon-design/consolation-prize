#!/usr/bin/env python3
"""Winnie's BEHIND-COUNTER runtime sheet, derived from her lit ambient sheet.

Tyler's correction of 2026-09-04: in the live proof her hands stopped 15px
above the ledger's far edge and the ink pot hung 18px above the counter,
because the five frames are a full standing figure placed by her feet, with
the counter mask hiding everything below its back edge -- hands included,
had they ever reached it. This script does not redesign or regenerate her.
It takes the existing five frames (pixels untouched) and:

  1. LOWERS her by a measured amount, so the resting hands land on the open
     ledger's near page and the writing pen's tip meets the page;
  2. MATTES each frame against the plate's own occluders -- the ledger's far
     edge where the book is, the counter's back edge elsewhere -- removing the
     body that is physically behind them while keeping the hands, the cuffs
     at the wrist and the pen in hand, which rest ON the surface;
  3. REMOVES the ink stand from every frame and re-issues it as ONE prop at
     ONE plate coordinate, in two states cut from the same pixels: pen in the
     stand (frames 0-1) and pen out (frames 2-4, where her hand holds it);
  4. CROPS the frames to what is drawn, so the sheet is a behind-counter
     sheet and not a standing figure with a hidden skirt;
  5. MEASURES all of it and writes the numbers beside the art.

Every threshold below is a measurement of a named file and is recorded in
frames.json with the file hashes it was read from.

Correction 2 (Tyler, same day): the working forearms/hands/pen are a depth
class ABOVE the surface and are never cut by the ledger; each is lifted a
few whole pixels so paper shows under the hands; the pen shaft alone is
re-angled about its grip; and she stands 25px further right (x1035), because
the ledger is drawn 46px right of her centre and swinging the fist about the
elbow far enough to reach the page destroyed its pixels.

Usage: winnie-counter.py <lit sheet> <plate> <out_dir> --x 1035 --old-y 624 --dy 39
"""
import hashlib, json, sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, label

args = sys.argv[1:]
sheet_path, plate_path, out_dir = args[0], args[1], Path(args[2])
X = int(args[args.index('--x') + 1]); OLD_Y = int(args[args.index('--old-y') + 1])
DY = int(args[args.index('--dy') + 1])
out_dir.mkdir(parents=True, exist_ok=True)

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

FRAMES = [[2, 2, 444, 445], [448, 2, 444, 445], [894, 2, 444, 445], [1340, 2, 444, 445], [1786, 2, 444, 445]]
NAMES = ['rest', 'breath', 'writing', 'writing-scribble', 'looking-up']
FW, FH = 444, 445
sheet = np.array(Image.open(sheet_path).convert('RGBA'))
plate = np.array(Image.open(plate_path).convert('RGB')).astype(int)
lum = plate.sum(axis=2) // 3

LEFT = X - FW // 2                 # frame col 0 in plate x
TOP = OLD_Y + DY - FH              # frame row 0 in plate y, after lowering

def frame(i):
    x, y, w, h = FRAMES[i]
    return sheet[y:y + h, x:x + w].copy()

def skin_of(fr):
    a = fr[..., 3] > 0; r, g, b = (fr[..., k].astype(int) for k in range(3))
    return a & (r > 150) & (g > 100) & (b < 150) & (r - b > 40)

def warm_of(fr):
    a = fr[..., 3] > 0; r, g, b = (fr[..., k].astype(int) for k in range(3))
    return a & (r - b > 45) & (r > 95) & ~skin_of(fr)

# ---- 1. the plate's occluder line, per column ------------------------------
# The ledger: its far edge is the first bright (page) row scanning down from
# above it; measured only where the page is (a run of bright rows follows).
# Elsewhere the counter's back edge, measured as the first row from which the
# surface stays lit for three rows. Both are reads of the plate, not numbers.
BOOK_X = (968, 1150)
def book_far_edge(px):
    if not (BOOK_X[0] <= px < BOOK_X[1]): return None
    for py in range(355, 406):
        if lum[py, px] >= 100 and all(lum[py + k, px] >= 85 for k in range(1, 6)): return py
    return None
def back_edge(px):
    for py in range(384, 430):
        if all(lum[py + k, px] >= 60 for k in range(3)): return py
    return 390
occluder = {}
for px in range(LEFT, LEFT + FW):
    if not (0 <= px < 1920): continue
    edge = book_far_edge(px)
    occluder[px] = edge if edge is not None else back_edge(px)
# Smooth the back-edge reads outside the book (bars and pot shadows make
# single columns jump): clamp to the median of the non-book columns.
non_book = [occluder[px] for px in occluder if book_far_edge(px) is None]
back_median = int(np.median(non_book))
for px in list(occluder):
    if book_far_edge(px) is None: occluder[px] = back_median
# The ledger's near edge: the last lit page row scanning up from the shadow.
def book_near_edge(px):
    if not (BOOK_X[0] <= px < BOOK_X[1]): return None
    for py in range(430, 395, -1):
        if lum[py, px] >= 95: return py
    return None
FRONT_EDGE = 431   # the counter's front top edge, darkest row 425..440 across its width (measured)

# ---- 2. the ink stand, found once and removed everywhere ---------------------
rest = frame(0)
lab, n = label(rest[..., 3] > 0)
comps = sorted(range(1, n + 1), key=lambda k: -(lab == k).sum())
figure_mask = lab == comps[0]
stand_mask = None
for k in comps[1:]:
    ys, xs = np.where(lab == k)
    if xs.max() < 165 and 140 <= ys.min() and ys.max() <= 200 and len(xs) > 300:
        stand_mask = lab == k; break
assert stand_mask is not None, 'no stand blob beside the rest figure'
sy, sx = np.where(stand_mask)
STAND_BOX = (int(sx.min()) - 6, int(sy.min()) - 4, int(sx.max()) + 4, int(sy.max()) + 3)  # x0,y0,x1,y1, with margin
figure_guard = binary_dilation(figure_mask, iterations=2)

def erase_stand(fr):
    a = fr[..., 3] > 0
    box = np.zeros_like(a); box[STAND_BOX[1]:STAND_BOX[3] + 1, STAND_BOX[0]:STAND_BOX[2] + 1] = True
    gone = a & box & ~figure_guard
    fr[gone] = 0
    return int(gone.sum())

# The prop: the rest frame's stand, pen in. Pen out = the same pixels with
# the pen removed -- the pen is the warm (gold) part and whatever sits above
# the pot's own top row; the pot body is dark and is left exactly as drawn,
# so the two states differ only by the pen.
stand_rgba = rest[STAND_BOX[1]:STAND_BOX[3] + 1, STAND_BOX[0]:STAND_BOX[2] + 1].copy()
stand_rgba[~stand_mask[STAND_BOX[1]:STAND_BOX[3] + 1, STAND_BOX[0]:STAND_BOX[2] + 1]] = 0
sh, sw = stand_rgba.shape[:2]
pen_in = stand_rgba.copy()
# The pot is the wide part; the pen is the narrow part standing out of it.
# The pot's top rim is the first row at least half as wide as the widest row,
# and everything above it is pen -- plus EVERY warm (gold) pixel, because the
# pen's shaft continues down into the rim and a gold stub left in the mouth
# of the pot while she holds the pen is a second pen. The pot body is dark
# and grey and carries no gold, so what is left is the pot exactly as drawn.
opaque = pen_in[..., 3] > 0
widths = opaque.sum(axis=1); widest = int(widths.max())
pot_top = int(np.where(widths >= widest * 0.5)[0].min())
_r, _g, _b = (pen_in[..., k].astype(int) for k in range(3))
gold = opaque & (_r - _b > 45) & (_r > 95)      # every warm pixel, the bright shaft included (warm_of excludes skin tones, and the shaft is one)
shaft = opaque & (np.arange(sh)[:, None] < pot_top)
# The pen is the shaft plus the gold CONNECTED to it down into the rim's
# mouth -- not the pot's own warm highlights lower down, which a plain colour
# cut took out and left holes in the body.
comp, ncomp = label(shaft | (gold & (np.arange(sh)[:, None] < pot_top + 8)))
pen_ids = set(np.unique(comp[shaft])) - {0}
pen_px = np.isin(comp, list(pen_ids)) & opaque
pen_out = pen_in.copy(); pen_out[pen_px] = 0
# Where the shaft passed through the mouth of the pot, the pot's own ink shows
# now: those rows are filled with the rim's darkest neighbouring colour, so
# the pot-without-pen is closed, not holed. Rows above the rim stay empty.
mouth = pen_px & (np.arange(sh)[:, None] >= pot_top)
if mouth.any():
    rim_rows = slice(pot_top, pot_top + 8)
    rim_dark = pen_in[rim_rows][(pen_in[rim_rows][..., 3] > 0) & ~gold[rim_rows]]
    fill = rim_dark[rim_dark[..., :3].sum(axis=1).argsort()[:max(1, len(rim_dark) // 4)]].mean(axis=0)
    pen_out[mouth] = np.array([*fill[:3], 255], dtype=np.uint8)
assert (pen_out[..., 3] > 0).sum() > 0.6 * opaque.sum(), 'the pen-out state lost the pot itself'
pot_identical = bool(np.array_equal(pen_in[~pen_px], pen_out[~pen_px]))
mouth_filled = int(mouth.sum())
# Base of the stand in plate space: the frame's stand rows, lowered with her.
stand_bottom_row = int(sy.max()); stand_cols = (int(sx.min()), int(sx.max()))
PROP_X = LEFT + (stand_cols[0] + stand_cols[1] + 1) // 2
PROP_Y = TOP + stand_bottom_row
prop_sheet = np.zeros((sh, sw * 2 + 2, 4), dtype=np.uint8)
prop_sheet[:, :sw] = pen_in; prop_sheet[:, sw + 2:] = pen_out
Image.fromarray(prop_sheet).save(out_dir / 'inkstand.png')
prop_frames = [[0, 0, sw, sh], [sw + 2, 0, sw, sh]]

# ---- 3. articulate the working arms, then matte and crop every frame --------
#
# TWO DEPTH CLASSES (Tyler, visual correction 2). The body and upper arms are
# BEHIND the counter and the ledger, and are cut where the plate's occluders
# say. The working forearms, hands and pen are ON the surface: they occlude
# the page and are never cut by it. The generated poses hold the hands at
# waist height close to the body, which put the writing hand over the
# ledger's left corner and the resting hands' bottoms on the page's near edge
# -- geometrically touching, visually sunk. So each working arm is one local
# group (forearm from the elbow, hand, pen) pivoted about its elbow by a few
# degrees, with no scaling, so the nib lands INSIDE the writable page and the
# resting hands sit on the page with paper visible around them. Pixels are
# moved, not repainted; the sliver of dress the swung forearm uncovers is
# filled from the torso column beside it and counted.
#
# The writable page, measured off the plate: the lit page pixels eroded 4px.
page_lit = np.zeros(lum.shape, dtype=bool); page_lit[360:425, 955:1160] = lum[360:425, 955:1160] >= 100
_pl, _pn = label(page_lit); _sizes = [(_pl == k).sum() for k in range(1, _pn + 1)]
page_mask = np.isin(_pl, [k + 1 for k, n_ in enumerate(_sizes) if n_ > 800])
from scipy.ndimage import binary_erosion
writable = binary_erosion(page_mask, iterations=4)
_wy, _wx = np.where(writable)
WRITABLE_BBOX = [int(_wx.min()), int(_wy.min()), int(_wx.max()), int(_wy.max())]

# Per-frame articulation, frame coordinates. Pivots are the elbows read off
# the frames (5x grid renders, 2026-09-04). Angles are degrees, screen
# clockwise-positive; `dy` a whole-pixel lift applied after the pivot.
# The left group (screen left = her writing hand) also carries the pen's
# upper shaft, which is the only warm thing above the fist in those columns.
ARTICULATION = {
    #        left group: (rect x0,y0,x1,y1)        pivot     deg   dy | right group rect             pivot     deg  dy
    0: {'L': ((148, 146, 205, 190), (165, 150), 0.0, -9), 'R': ((226, 150, 278, 190), (264, 152), 0.0, -8)},
    1: {'L': ((148, 146, 205, 190), (165, 150), 0.0, -9), 'R': ((226, 150, 278, 190), (264, 152), 0.0, -8)},
    2: {'L': ((148, 146, 206, 190), (165, 150), 0.0, -8), 'R': ((226, 150, 278, 190), (264, 152), 0.0, -8)},
    3: {'L': ((148, 146, 208, 190), (165, 150), 0.0, -8), 'R': ((226, 150, 278, 190), (264, 152), 0.0, -8)},
    4: {'L': None, 'R': ((226, 150, 280, 190), (264, 152), 0.0, -8)},   # looking up: the raised pen hand stays as authored
}
# THE PEN ALONE IS RE-ANGLED in the writing frames: its shaft above the fist
# is rotated about the grip (where it enters the fist) so it meets the page
# at a writing slant instead of standing near-vertical. Degrees, screen
# clockwise-positive; measured against the authored 28 degrees from vertical.
PEN_ROTATE = {2: -17.0, 3: -17.0}
PEN_SHAFT_COLS = (166, 200); PEN_SHAFT_ROWS = (128, 150)

def articulate(fr, spec, side, skin, warm, pen_deg=0.0):
    """Move one arm group; returns (moved pixel count, filled pixel count, group mask after)."""
    if spec is None: return 0, 0, np.zeros(fr.shape[:2], dtype=bool)
    (x0, y0, x1, y1), (px, py), deg, dy = spec
    a = fr[..., 3] > 0
    group = np.zeros_like(a); group[y0:y1 + 1, x0:x1 + 1] = a[y0:y1 + 1, x0:x1 + 1]
    if side == 'L':   # the pen's upper shaft above the fist
        shaft = np.zeros_like(a)
        shaft[PEN_SHAFT_ROWS[0]:PEN_SHAFT_ROWS[1] + 1, PEN_SHAFT_COLS[0]:PEN_SHAFT_COLS[1] + 1] = True
        group |= a & shaft & warm
    layer = fr.copy(); layer[~group] = 0
    fr[group] = 0                                   # lift the group off the body
    # Nearest-neighbour rotation about the pivot, then the lift: inverse-map
    # every destination pixel in a generous box back into the layer.
    th = np.deg2rad(deg); c, s_ = np.cos(th), np.sin(th)
    ys, xs = np.where(group)
    dst = np.zeros_like(fr)
    H_, W_ = fr.shape[:2]
    for yd in range(max(0, ys.min() - 40), min(H_, ys.max() + 40)):
        for xd in range(max(0, xs.min() - 40), min(W_, xs.max() + 40)):
            # undo the lift, then the rotation
            yy = yd - dy; rx, ry = xd - px, yy - py
            xsrc = px + c * rx + s_ * ry; ysrc = py - s_ * rx + c * ry
            xi, yi = int(round(xsrc)), int(round(ysrc))
            if 0 <= xi < W_ and 0 <= yi < H_ and group[yi, xi]:
                dst[yd, xd] = layer[yi, xi]
    placed = dst[..., 3] > 0
    fr[placed] = dst[placed]                        # the arm draws over the body
    if side == 'L' and pen_deg:
        # the shaft: warm pixels above the fist's top row, in the pen columns
        fist = skin_of(fr) & (np.arange(fr.shape[0])[:, None] >= 120) & (np.arange(fr.shape[0])[:, None] <= 205)
        fist &= (np.arange(fr.shape[1])[None, :] < 210)
        ftop = int(np.where(fist.any(axis=1))[0].min())
        sh_mask = warm_of(fr) & (np.arange(fr.shape[0])[:, None] < ftop + 3)
        sh_mask[:, :PEN_SHAFT_COLS[0]] = False; sh_mask[:, PEN_SHAFT_COLS[1] + 1:] = False
        sys_, sxs_ = np.where(sh_mask)
        if len(sys_) > 6:
            g = (int(sxs_[sys_.argmax()]), int(sys_.max()))      # the grip: the shaft's lowest pixel
            layer2 = fr.copy(); layer2[~sh_mask] = 0; fr[sh_mask] = 0
            th2 = np.deg2rad(pen_deg); c2, s2 = np.cos(th2), np.sin(th2)
            for yd in range(max(0, sys_.min() - 30), min(H_, sys_.max() + 30)):
                for xd in range(max(0, sxs_.min() - 30), min(W_, sxs_.max() + 30)):
                    rx, ry = xd - g[0], yd - g[1]
                    xi, yi = int(round(g[0] + c2 * rx + s2 * ry)), int(round(g[1] - s2 * rx + c2 * ry))
                    if 0 <= xi < W_ and 0 <= yi < H_ and sh_mask[yi, xi] and fr[yd, xd, 3] == 0:
                        fr[yd, xd] = layer2[yi, xi]
    # The dress the forearm uncovered: pixels that were opaque, are now
    # empty, and lie INSIDE the body -- i.e. have body pixels on both sides
    # within 14px on that row. Filled from the nearer body pixel toward the
    # torso (right for the left arm, left for the right arm).
    hole = group & ~(fr[..., 3] > 0)
    filled = 0
    for y in range(y0, y1 + 1):
        row = fr[y]; opaque = row[:, 3] > 0
        for x in np.where(hole[y])[0]:
            left = opaque[max(0, x - 14):x]; right = opaque[x + 1:x + 15]
            if not (left.any() and right.any()): continue
            if side == 'L':
                src = x + 1 + int(np.argmax(right))
            else:
                src = x - 1 - int(np.argmax(left[::-1]))
            if skin[y, src]: continue               # never clone flesh into cloth
            fr[y, x] = row[src]; filled += 1
    return int(group.sum()), filled, placed

KEEP_ROWS = None
matted = []; measures = []
for i in range(5):
    fr = frame(i)
    erased = erase_stand(fr)
    skin0 = skin_of(fr); warm0 = warm_of(fr)
    spec = ARTICULATION[i]
    mL, fL, groupL = articulate(fr, spec['L'], 'L', skin0, warm0, PEN_ROTATE.get(i, 0.0))
    mR, fR, groupR = articulate(fr, spec['R'], 'R', skin0, warm0)
    a = fr[..., 3] > 0
    skin = skin_of(fr); warm = warm_of(fr)
    rows = np.arange(FH)[:, None]; cols = np.arange(FW)[None, :]
    cut = np.array([occluder.get(LEFT + c, back_median) - TOP for c in range(FW)])[None, :]
    above = rows < cut
    hands = skin & (rows >= 120) & (rows <= 205)
    hys, hxs = np.where(hands)
    hand_top, hand_bottom = int(hys.min()), int(hys.max())
    # THE WORKING ARMS ARE NEVER CUT: everything in the two arm zones -- the
    # hands' own rows, from each hand outward to the figure's edge, plus the
    # pen -- stays. Between the hands and below them the body is cut where
    # the occluder says. The zones are the moved groups' own rows, so a
    # raised hand (frame 4) keeps its whole forearm too.
    hl, hn = label(binary_dilation(hands, iterations=3))
    keep_below = np.zeros_like(a)
    inner = []
    for k in range(1, hn + 1):
        ys, xs = np.where((hl == k) & hands)
        if len(xs) == 0: continue
        centre = xs.mean(); top, bot = ys.min(), ys.max()
        if centre < FW / 2:
            keep_below[top - 14:bot + 3, :xs.max() + 1] = True; inner.append(xs.max())
        else:
            keep_below[top - 14:bot + 3, xs.min():] = True; inner.append(xs.min())
    pen_hand = warm & (rows >= 120) & (rows <= hand_bottom + 4) & (cols > STAND_BOX[2])
    keep_below |= pen_hand | hands
    keep = a & (above | keep_below)
    body_dropped = int((a & ~keep).sum())
    fr[~keep] = 0
    bottom = int(np.where((fr[..., 3] > 0).any(axis=1))[0].max())
    matted.append(fr)
    # ---- contact measurements, plate space ----
    per_hand = []
    for k in range(1, hn + 1):
        ys, xs = np.where((hl == k) & hands)
        if len(xs) == 0: continue
        hb = TOP + int(ys.max()); ht = TOP + int(ys.min())
        cx0, cx1 = LEFT + int(xs.min()), LEFT + int(xs.max())
        # paper visible below the hand: rows from the hand's bottom to the page's near edge, per column, min over the hand's columns
        margins = []
        for pxx in range(cx0, cx1 + 1):
            colp = np.where(page_mask[:, pxx])[0]
            margins.append(int(colp.max()) - hb if len(colp) else None)
        margins = [m for m in margins if m is not None]
        per_hand.append({'side': 'L' if xs.mean() < FW / 2 else 'R', 'plateX': [cx0, cx1], 'plateY': [ht, hb],
                         'paperBelowHandMin': min(margins) if margins else None, 'overPage': bool(margins),
                         'columnsOffPage': int(cx1 - cx0 + 1 - len(margins))})
    # the nib: the lowest, then rightmost, warm pen pixel that is not skin
    # The pen: warm pixels in the pen columns above and through the left
    # fist, as one connected thing with the shaft; the nib is its lowest pixel.
    nib = None; nib_in_writable = None; pen_axis = None
    penmask = warm & (cols >= PEN_SHAFT_COLS[0]) & (cols <= 215) & (rows >= 110) & (rows <= hand_bottom + 6)
    pl_, pn_ = label(binary_dilation(penmask, iterations=1))
    if pn_:
        best = max(range(1, pn_ + 1), key=lambda k: ((pl_ == k) & penmask).sum())
        pm = (pl_ == best) & penmask
        pys, pxs = np.where(pm)
        if len(pys) > 8:
            j = np.lexsort((pxs, pys))[-1]
            nib = [LEFT + int(pxs[j]), TOP + int(pys[j])]
            nib_in_writable = bool(writable[nib[1], nib[0]])
            cov = np.cov(np.vstack([pxs, pys]).astype(float)); w_, v_ = np.linalg.eigh(cov); vx, vy = v_[:, -1]
            pen_axis = float(abs(np.degrees(np.arctan2(vy, vx))))
            if pen_axis > 90: pen_axis = 180 - pen_axis
    measures.append({
        'frame': i, 'name': NAMES[i], 'standPixelsErased': erased,
        'articulation': {'L': spec['L'] and {'deg': spec['L'][2], 'dy': spec['L'][3], 'moved': mL, 'filled': fL},
                         'R': spec['R'] and {'deg': spec['R'][2], 'dy': spec['R'][3], 'moved': mR, 'filled': fR}},
        'bodyPixelsDropped': body_dropped, 'lowestDrawnRow': bottom, 'lowestDrawnPlateY': TOP + bottom,
        'hands': per_hand, 'nibPlateXY': nib, 'nibInsideWritablePage': nib_in_writable,
        'penAxisDegFromHorizontal': pen_axis,
    })
    KEEP_ROWS = max(KEEP_ROWS or 0, bottom)

H = KEEP_ROWS + 2
out_sheet = np.zeros((H + 4, 2 + 5 * (FW + 2), 4), dtype=np.uint8)
frames = []
for i, fr in enumerate(matted):
    x = 2 + i * (FW + 2)
    out_sheet[2:2 + H, x:x + FW] = fr[:H]
    frames.append([x, 2, FW, H])
Image.fromarray(out_sheet).save(out_dir / 'winnie-counter-sheet.png')

NEW_Y = TOP + H - 1   # the engine draws the frame's bottom row at y
record = {
    'note': 'BEHIND-COUNTER RUNTIME SHEET, derived by tools/rig/winnie-counter.py from the lit five-frame sheet with no pixel repainted: lowered, matted against the plate\'s ledger and counter edges, stand removed, cropped to what is drawn. The ink stand is a separate prop at one plate coordinate.',
    'sources': {'sheet': sheet_path, 'sheetSha256': sha(sheet_path), 'plate': plate_path, 'plateSha256': sha(plate_path)},
    'placement': {'x': X, 'oldY': OLD_Y, 'dy': DY, 'frameTopPlateY': TOP, 'y': NEW_Y,
                  'why': 'y is the frame\'s bottom row in plate space (the engine anchors an ambient at its bottom-centre); it is the row below her resting hands, not her feet, because the sheet has no feet'},
    'frames': frames, 'frameSize': [FW, H], 'order': NAMES,
    'writablePage': {'bbox': WRITABLE_BBOX, 'how': 'lit page pixels of the day plate (lum>=100, x955-1160 y360-425) eroded 4px'},
    'articulation': {str(k): v for k, v in ARTICULATION.items()}, 'penRotateDeg': PEN_ROTATE,
    'occluder': {'ledgerColumns': list(BOOK_X), 'ledgerFarEdgeRange': [min(occluder[p] for p in range(BOOK_X[0], BOOK_X[1])), max(occluder[p] for p in range(BOOK_X[0], BOOK_X[1]))],
                 'counterBackEdge': back_median, 'counterFrontEdge': FRONT_EDGE},
    'prop': {'sheet': str(out_dir / 'inkstand.png'), 'frames': prop_frames, 'x': PROP_X, 'y': PROP_Y,
             'states': ['pen in the stand', 'pen out (in her hand)'],
             'standBoxInFrame': list(STAND_BOX), 'potTopRowInStand': pot_top,
             'penPixelsRemovedForPenOut': int(pen_px.sum()), 'mouthPixelsFilledWithRimInk': mouth_filled, 'potBodyIdenticalAcrossStates': pot_identical,
             'basePlateY': PROP_Y, 'baseOnSurface': back_median <= PROP_Y <= FRONT_EDGE,
             'before': {'basePlateY': OLD_Y - FH + stand_bottom_row, 'gapToSurface': back_median - (OLD_Y - FH + stand_bottom_row)}},
    'before': {'note': 'the pilot sheet: hands bottom y362 against the ledger far edge y378 (16px above), stand base y370 against the counter back edge y399 (29px above); correction 1 put hand bottoms at y401-402 on the page near edge and the writing hand over the ledger corner'},
    'measurements': measures,
}
(out_dir / 'frames.json').write_text(json.dumps(record, indent=1) + '\n')
print(json.dumps({k: record[k] for k in ('placement', 'occluder', 'prop', 'before')}, indent=1))
for m in measures: print(m)
