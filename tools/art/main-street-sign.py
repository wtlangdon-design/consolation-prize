"""Main Street redraw: the Consolation Improvement Company's lettering put back (Tyler, 2026-11-11: "It's missing the
Consolation Improvement Company sign"). No image operation.

The redraw (window 1, registered) kept the sign board where it was and drew it blank. The letters are taken from the
window itself (the shipping plate drawn down): inside the board, the pixels much lighter than the board are the
letters. Their mask is put on the redraw's own grid (BLOCK window pixels to a redraw pixel; a block is a letter if
most of it is), centred on the redraw's own board (the dark field's box in each picture, centre to centre), and painted the same
step lighter than the redraw's board as the old letters are above the old one, with a one-block shadow below and right.

  python3 tools/art/main-street-sign.py SOURCE OUT     e.g. out-1-registered.png out-1-signed.png
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGE = os.path.join(ROOT, 'art/staging/room-02/redraw')
BOARD = (430, 384, 640, 442)      # the lettered board in window 1 (x0, y0, x1, y1), at the window's 1536 x 1024
MARGIN = 9         # window pixels of field left at each end of the lower line (the frame reads as field too)
GILT = 1.15        # a little brighter than the plain darkening: the redraw's board is flatter than the old one
BLOCK = 2          # the letters' strokes are 2-4 window pixels: on a coarser grid they do not read


def main(source, out):
    w = np.asarray(Image.open(os.path.join(STAGE, 'window-1.png')).convert('RGB')).astype(float)
    o = np.asarray(Image.open(os.path.join(STAGE, source)).convert('RGB')).astype(float)
    x0, y0, x1, y1 = BOARD
    lw = w.mean(2)
    board = lw[y0:y1, x0:x1]
    # The gilt letters against the dark field: Otsu's threshold on the board, then only the pieces that do not touch
    # the board's edge (its frame and the planks round it).
    hist, edges = np.histogram(board, 64); mids = (edges[:-1] + edges[1:]) / 2; t, best_v = mids[0], -1
    for c in mids:
        lo = board <= c
        if lo.all() or not lo.any():
            continue
        v = lo.mean() * (1 - lo.mean()) * (board[lo].mean() - board[~lo].mean()) ** 2
        if v > best_v:
            best_v, t = v, c
    letters = board > t
    lab, n = ndi.label(letters)
    edge = set(np.unique(np.r_[lab[:2].ravel(), lab[-2:].ravel(), lab[:, :6].ravel(), lab[:, -6:].ravel()])) - {0}
    sizes = ndi.sum(letters, lab, range(1, n + 1))
    letters = np.isin(lab, [i for i in range(1, n + 1) if i not in edge and sizes[i - 1] >= 6])
    # The board's offset in the redraw: the dark field's box in each picture, centre to centre.
    def field_box(img):
        sub = img[y0 - 12:y1 + 12, x0 - 16:x1 + 16].mean(2)
        dark = sub < np.percentile(sub, 45)
        dark = ndi.binary_opening(dark, iterations=2)
        lab, n = ndi.label(dark)
        big = 1 + int(np.argmax(ndi.sum(dark, lab, range(1, n + 1))))
        ys, xs = np.nonzero(lab == big)
        return (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2, xs.max() - xs.min() + 1, ys.max() - ys.min() + 1
    cw, cn = field_box(w), field_box(o)
    dx, dy = int(round(cn[0] - cw[0])), int(round(cn[1] - cw[1]))
    best = (1.0, dx, dy)
    # The redraw's board is a little narrower: the lettering is scaled to fit it, about the board's centre. Measured on
    # the lower line (the wider): the dark field's run through the board's centre in the redraw, against the
    # lettering's width there.
    ys_l, xs_l = np.nonzero(letters)
    low = ys_l > (ys_l.min() + ys_l.max()) / 2
    lw0, lw1 = xs_l[low].min(), xs_l[low].max()
    row = int(round(np.median(ys_l[low]))) + y0 + dy
    line = o[row - 2:row + 3].mean((0, 2))
    field = line < np.percentile(o[y0 + dy:y1 + dy, x0 + dx:x1 + dx].mean(2), 50) + 6
    cx = int(round(x0 + dx + (lw0 + lw1) / 2))
    a_, b_ = cx, cx
    while a_ > 0 and (field[a_ - 1] or field[max(0, a_ - 4):a_].any()):
        a_ -= 1
    while b_ < len(field) - 1 and (field[b_ + 1] or field[b_ + 1:b_ + 5].any()):
        b_ += 1
    room = b_ - a_ + 1 - 2 * MARGIN
    fit = min(1.0, room / (lw1 - lw0 + 1))
    if fit < 1:
        h0, w0 = letters.shape
        cyl, cxl = (ys_l.min() + ys_l.max()) / 2, (lw0 + lw1) / 2
        big = Image.fromarray(letters.astype(np.uint8) * 255)
        small = np.asarray(big.resize((round(w0 * fit), round(h0 * fit)), Image.BOX)) > 110
        pad = np.zeros_like(letters)
        oy, ox = int(round(cyl - cyl * fit)), int(round(cxl - cxl * fit))
        pad[oy:oy + small.shape[0], ox:ox + small.shape[1]] = small[:h0 - oy, :w0 - ox]
        letters = pad
    # and centred on the field's run
    ys_l, xs_l = np.nonzero(letters)
    dx += int(round((a_ + b_) / 2 - (x0 + dx + (xs_l.min() + xs_l.max()) / 2)))
    # On the redraw's grid.
    h, wd = letters.shape
    gh, gw = h // BLOCK, wd // BLOCK
    grid = letters[:gh * BLOCK, :gw * BLOCK].reshape(gh, BLOCK, gw, BLOCK).mean((1, 3)) > 0.4
    gl, gn = ndi.label(grid)                                         # specks the scaling leaves are not letters
    grid &= np.isin(gl, 1 + np.nonzero(ndi.sum(grid, gl, range(1, gn + 1)) >= 3)[0])
    mask = np.zeros_like(letters)
    mask[:gh * BLOCK, :gw * BLOCK] = np.kron(grid, np.ones((BLOCK, BLOCK))).astype(bool)
    shadow = np.zeros_like(mask)
    shadow[BLOCK:, BLOCK:] = mask[:-BLOCK, :-BLOCK]
    shadow &= ~mask
    lit = w[y0:y1, x0:x1][letters]
    old_letter = lit[lit.mean(1) >= np.percentile(lit.mean(1), 85)].mean(0)       # the gilt's bright core, not its edges
    old_field = w[y0:y1, x0:x1][~letters].mean(0)
    ob = o[y0 + dy:y1 + dy, x0 + dx:x1 + dx]
    new_field = ob[~mask].mean(0)
    # The letters keep their gilt against the redraw's darker board: the same step above the field, a little less.
    # The old gilt, darkened as the whole redraw is darker than the old street (each channel's mean over the street
    # band of the two pictures), then lifted by GILT so it holds against the redraw's flatter board.
    k = o[170:854, 8:1528].reshape(-1, 3).mean(0) / w[170:854, 8:1528].reshape(-1, 3).mean(0)
    letter = np.clip(old_letter * k * GILT, 0, 255)
    shade = np.clip(new_field * 0.6, 0, 255)
    res = o.copy()
    region = res[y0 + dy:y1 + dy, x0 + dx:x1 + dx]
    region[shadow] = shade
    region[mask] = letter
    Image.fromarray(res.astype(np.uint8)).save(os.path.join(STAGE, out))
    print(json.dumps({'source': source, 'out': out, 'boardOffset': [dx, dy], 'match': round(best[0], 3),
                      'letterColour': [int(v) for v in letter], 'fit': round(fit, 3), 'block': BLOCK, 'letterPx': int(mask.sum())}))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
