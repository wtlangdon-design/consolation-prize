"""Main Street redraw: an operation's window registered back onto its input (reference/main-street-redraw/brief.md).

The generator sometimes draws the whole window a few percent larger and shifted, the composition otherwise intact
(window 3: every building 20-40 px right and up, growing toward the right edge). That is an affine error, not a
re-composition, and is undone here with no image operation: local shifts are measured on a grid of tiles (edges of
both pictures, smoothed past the pixel grid, matched by correlation), an affine map from window to output is fitted
to them by least squares with outliers dropped, and the output is resampled through it with nearest-neighbour (the
square pixels are kept; at a scale near 1 a column is occasionally doubled or dropped). Where the map falls outside
the output -- a strip the operation pushed off its canvas -- the window's own street fills it, coarsened to the
redraw's pixel size, and the report says how much. Prints the residual shifts before and after.

  python3 tools/art/main-street-register.py N SOURCE OUT     e.g. 3 out-3-v2.png out-3-v2-registered.png
(paths in art/staging/room-02/redraw/)
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
STAGE = os.path.join(ROOT, 'art/staging/room-02/redraw')
Y0, Y1 = 230, 760
GRADE, FEATHER = 40, 16    # columns the fill's colour is matched on; pixels it is feathered over
BLOCK = 4                  # the redraw's pixel, about, at the window's size (the side streets' hand)          # the buildings' band in the 1536 x 1024 window (the sky and the near ground hold no edges)


def edges(a):
    a = ndi.gaussian_filter(a, 3)
    return np.hypot(ndi.sobel(a, 0), ndi.sobel(a, 1))


def shifts(w, o, tile=96, step=64, r=60):
    """(x, y, dx, dy, corr): where each tile of the window is found in the output."""
    out = []
    for y in range(Y0, Y1 - tile, step):
        for x in range(0, w.shape[1] - tile, step):
            a = w[y:y + tile, x:x + tile]
            if a.std() < 6:
                continue
            best = (-1, 0, 0)
            for dy in range(-r, r + 1, 4):
                for dx in range(-r, r + 1, 4):
                    yy, xx = y + dy, x + dx
                    if yy < 0 or xx < 0 or yy + tile > o.shape[0] or xx + tile > o.shape[1]:
                        continue
                    c = np.corrcoef(a.ravel(), o[yy:yy + tile, xx:xx + tile].ravel())[0, 1]
                    if c > best[0]:
                        best = (c, dx, dy)
            c, dx, dy = best
            for ddy in range(dy - 3, dy + 4):          # refine to the pixel
                for ddx in range(dx - 3, dx + 4):
                    yy, xx = y + ddy, x + ddx
                    if yy < 0 or xx < 0 or yy + tile > o.shape[0] or xx + tile > o.shape[1]:
                        continue
                    cc = np.corrcoef(a.ravel(), o[yy:yy + tile, xx:xx + tile].ravel())[0, 1]
                    if cc > c:
                        c, dx, dy = cc, ddx, ddy
            out.append((x + tile / 2, y + tile / 2, dx, dy, c))
    return np.array(out)


def fit(s, keep=None):
    keep = np.ones(len(s), bool) if keep is None else keep
    X = np.c_[s[keep, 0], s[keep, 1], np.ones(keep.sum())]
    ax, *_ = np.linalg.lstsq(X, s[keep, 0] + s[keep, 2], rcond=None)
    ay, *_ = np.linalg.lstsq(X, s[keep, 1] + s[keep, 3], rcond=None)
    return ax, ay


def main(n, source, out):
    w = np.asarray(Image.open(os.path.join(STAGE, f'window-{n}.png')).convert('L')).astype(float)
    o_img = Image.open(os.path.join(STAGE, source)).convert('RGB')
    o = np.asarray(o_img.convert('L')).astype(float)
    ew, eo = edges(w), edges(o)
    s = shifts(ew, eo)
    s = s[s[:, 4] > 0.3]
    keep = np.ones(len(s), bool)
    for _ in range(3):                               # drop the tiles the map does not explain
        ax, ay = fit(s, keep)
        X = np.c_[s[:, 0], s[:, 1], np.ones(len(s))]
        res = np.hypot(X @ ax - s[:, 0] - s[:, 2], X @ ay - s[:, 1] - s[:, 3])
        keep = res < max(6, np.percentile(res[keep], 80))
    # Resample: each window pixel (x, y) takes the output's pixel at the fitted (x', y').
    H, W = w.shape
    yy, xx = np.mgrid[0:H, 0:W]
    fx = np.rint(ax[0] * xx + ax[1] * yy + ax[2]).astype(int)
    fy = np.rint(ay[0] * xx + ay[1] * yy + ay[2]).astype(int)
    outside = (fx < 0) | (fx >= W) | (fy < 0) | (fy >= H)
    reg = np.asarray(o_img)[fy.clip(0, H - 1), fx.clip(0, W - 1)].copy()
    # WHAT THE OPERATION DID NOT DRAW: drawn larger than its window, the output loses a strip at an edge (window 3's
    # far road and hills). There the window's own street is used, coarsened to the redraw's pixel size (BLOCK).
    if outside.any():
        win = Image.open(os.path.join(STAGE, f'window-{n}.png')).convert('RGB')
        coarse = np.asarray(win.resize((W // BLOCK, H // BLOCK), Image.BOX).resize((W, H), Image.NEAREST))
        # Graded to the redraw, row by row: each row's colour in the strip is scaled by the redraw's mean over the
        # window's mean in the GRADE columns just inside the strip, smoothed down the rows; then feathered over FEATHER.
        graded = coarse.astype(float).copy()
        for side in (slice(0, W // 2), slice(W // 2, W)):          # each edge's strip on its own
            part = np.zeros_like(outside); part[:, side] = outside[:, side]
            cols = np.nonzero(part[170:854].any(0))[0]
            if not len(cols):
                continue
            inside = slice(cols.max() + 1, cols.max() + 1 + GRADE) if side.start == 0 else slice(cols.min() - GRADE, cols.min())
            r_in = reg[:, inside].astype(float).mean(1); w_in = coarse[:, inside].astype(float).mean(1)
            gain = ndi.gaussian_filter1d((r_in + 4) / (w_in + 4), 12, axis=0)[:, None, :]
            graded[:, side] = np.clip(coarse[:, side].astype(float) * gain, 0, 255)
        dist = ndi.distance_transform_edt(~outside)          # 0 inside the strip, growing into the drawn part
        a = np.clip(1 - dist / FEATHER, 0, 1)[..., None]
        reg = np.clip(reg * (1 - a) + graded * a, 0, 255).astype(np.uint8)
    Image.fromarray(reg).save(os.path.join(STAGE, out))
    after = shifts(ew, edges(np.asarray(Image.fromarray(reg).convert('L')).astype(float)))
    after = after[after[:, 4] > 0.3]
    band = np.zeros_like(outside); band[170:854, 8:1528] = True
    report = {'window': n, 'source': source, 'out': out, 'tiles': int(len(s)), 'used': int(keep.sum()),
              'filledFromWindowPx': int((outside & band).sum()),
              'filledColumns': [int(c) for c in np.nonzero((outside & band).any(0))[0][[0, -1]]] if (outside & band).any() else None,
              'map': {'x': [round(v, 4) for v in ax], 'y': [round(v, 4) for v in ay]},
              'before': {'median': float(np.median(np.hypot(s[:, 2], s[:, 3]))), 'p90': float(np.percentile(np.hypot(s[:, 2], s[:, 3]), 90))},
              'after': {'median': float(np.median(np.hypot(after[:, 2], after[:, 3]))), 'p90': float(np.percentile(np.hypot(after[:, 2], after[:, 3]), 90))}}
    json.dump(report, open(os.path.join(STAGE, out.replace('.png', '.json')), 'w'), indent=1)
    print(json.dumps(report))


if __name__ == '__main__':
    main(int(sys.argv[1]), sys.argv[2], sys.argv[3])
