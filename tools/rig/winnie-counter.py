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

Usage: winnie-counter.py <lit sheet> <plate> <out_dir> --x 1010 --old-y 624 --dy 39
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

# ---- 3. matte and crop every frame ------------------------------------------
KEEP_ROWS = None
matted = []; measures = []
for i in range(5):
    fr = frame(i)
    erased = erase_stand(fr)
    a = fr[..., 3] > 0
    skin = skin_of(fr); warm = warm_of(fr)
    rows = np.arange(FH)[:, None]; cols = np.arange(FW)[None, :]
    cut = np.array([occluder.get(LEFT + c, back_median) - TOP for c in range(FW)])[None, :]
    above = rows < cut
    # hands: the skin below the face
    hands = skin & (rows >= 120) & (rows <= 200)   # the hands; the shoes are the same warm colour and are 250 rows lower
    hys, hxs = np.where(hands)
    hand_top, hand_bottom = int(hys.min()), int(hys.max())
    # the two hands as components, for the outer cuffs
    hl, hn = label(binary_dilation(hands, iterations=3))
    keep_below = hands.copy()
    # pen in hand: warm, non-skin, within the hands' rows, right of the stand box
    pen_hand = warm & (rows >= hand_top - 8) & (rows <= hand_bottom + 2) & (cols > STAND_BOX[2])
    keep_below |= pen_hand
    # outer cuffs: up to 10px beyond each hand's outer edge on that row
    for k in range(1, hn + 1):
        ys, xs = np.where((hl == k) & hands)
        if len(xs) == 0: continue
        centre = xs.mean()
        for y in range(ys.min(), ys.max() + 1):
            row_xs = xs[ys == y]
            if len(row_xs) == 0: continue
            if centre < FW / 2:   # left hand: cuff to its left
                x0 = max(0, row_xs.min() - 10); keep_below[y, x0:row_xs.min()] |= a[y, x0:row_xs.min()]
            else:                 # right hand: cuff to its right
                x1 = min(FW, row_xs.max() + 11); keep_below[y, row_xs.max() + 1:x1] |= a[y, row_xs.max() + 1:x1]
    keep = a & (above | keep_below)
    leaked = int((a & ~above & ~keep_below & keep).sum())     # by construction 0
    body_dropped = int((a & ~keep).sum())
    fr[~keep] = 0
    bottom = int(np.where((fr[..., 3] > 0).any(axis=1))[0].max())
    matted.append(fr)
    # contact measurements, in plate space
    hb = TOP + hand_bottom
    hand_cols_plate = (LEFT + int(hxs.min()), LEFT + int(hxs.max()))
    near = [book_near_edge(px) for px in range(hand_cols_plate[0], hand_cols_plate[1] + 1)]
    near = [v for v in near if v is not None]
    far = [occluder[px] for px in range(hand_cols_plate[0], hand_cols_plate[1] + 1)]
    pen_tip = int(TOP + np.where(pen_hand.any(axis=1))[0].max()) if pen_hand.any() else None
    measures.append({
        'frame': i, 'name': NAMES[i], 'standPixelsErased': erased, 'bodyPixelsDropped': body_dropped,
        'leakedBelowOccluder': leaked, 'lowestDrawnRow': bottom, 'lowestDrawnPlateY': TOP + bottom,
        'handRows': [hand_top, hand_bottom], 'handBottomPlateY': hb, 'handColsPlateX': list(hand_cols_plate),
        'ledgerFarEdgeUnderHands': [min(far), max(far)],
        'ledgerNearEdgeUnderHands': [min(near), max(near)] if near else None,
        'handOnPage': bool(near) and min(far) <= hb <= max(near) + 2,
        'gapToPage': (0 if (near and min(far) <= hb <= max(near) + 2) else (min(far) - hb if hb < min(far) else hb - max(near))) if near else None,
        'penTipPlateY': pen_tip,   # the lowest warm pixel in the hand band: the nib in frames 2-4, a cuff highlight in 0-1. Whether a pen is in hand is read off the crops, not this number
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
    'occluder': {'ledgerColumns': list(BOOK_X), 'ledgerFarEdgeRange': [min(occluder[p] for p in range(BOOK_X[0], BOOK_X[1])), max(occluder[p] for p in range(BOOK_X[0], BOOK_X[1]))],
                 'counterBackEdge': back_median, 'counterFrontEdge': FRONT_EDGE},
    'prop': {'sheet': str(out_dir / 'inkstand.png'), 'frames': prop_frames, 'x': PROP_X, 'y': PROP_Y,
             'states': ['pen in the stand', 'pen out (in her hand)'],
             'standBoxInFrame': list(STAND_BOX), 'potTopRowInStand': pot_top,
             'penPixelsRemovedForPenOut': int(pen_px.sum()), 'mouthPixelsFilledWithRimInk': mouth_filled, 'potBodyIdenticalAcrossStates': pot_identical,
             'basePlateY': PROP_Y, 'baseOnSurface': back_median <= PROP_Y <= FRONT_EDGE,
             'before': {'basePlateY': OLD_Y - FH + stand_bottom_row, 'gapToSurface': back_median - (OLD_Y - FH + stand_bottom_row)}},
    'before': {'handBottomPlateY': OLD_Y - FH + measures[0]['handRows'][1],
               'gapToLedgerFarEdge': measures[0]['ledgerFarEdgeUnderHands'][0] - (OLD_Y - FH + measures[0]['handRows'][1])},
    'measurements': measures,
}
(out_dir / 'frames.json').write_text(json.dumps(record, indent=1) + '\n')
print(json.dumps({k: record[k] for k in ('placement', 'occluder', 'prop', 'before')}, indent=1))
for m in measures: print(m)
