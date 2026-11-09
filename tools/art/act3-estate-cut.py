"""Scene C's hen and the raccoon halfway out of his hole, cut (reference/act3-estate-sale/brief.md, operation 1;
doc 111 part C).

act3-estate-sale operation 1 drew, on magenta, a row of the hen (rest, head cocked, pecking) and a row of the raccoon
emerging (rest, sniffing left, ducked by half) (art/staging/act3-estate-sale/op-1/sheet.png). Each row becomes a
shipping sheet: 0 rest, 1 breath (derived), 2 and 3 the actions.

  - ONE SCALE A ROW, set on its rest figure:
      hen      her height is HEN_OF_MAN of Room 23's man at the hole (the brief: "about a fifth");
      raccoon  the span across both ears is RACCOON_EARS px, as on the raccoon who already lives in the hole
               (art/actors/room-23-raccoon.png, frame 0) -- the same animal, the same size of head. (Ear tips to cheeks
               was tried first and read a quarter small: his head is turned to the left here, and that depth shifts.)
  - Each figure is keyed and resized by tools/art/cut-ambient-sheet.py ON ITS OWN at that scale (a pose lower than
    the rest -- the peck, the duck -- must stay lower, not be stretched to the rest's height).
  - Registered: bottoms on one line (her feet; his chest, where the hole cuts him), and across by the bottom band's
    overlap (her legs; his forepaws and chest).
  - A breath: the rows above the middle lifted a pixel. Snapped to one level at Room 23's man; despilled, and
    refused if any key spill is left.

Usage: act3-estate-cut.py [--write]
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'art/staging/act3-estate-sale/op-1/sheet.png')
MAN = 367                       # Room 23's man at the hole (walk boxes, x 1100-1250, y 490-520)
HEN_OF_MAN = 0.20
RACCOON_EARS = 32               # art/actors/room-23-raccoon.png frame 0: across both ears, outer edge to outer edge (x 13-44)
OUTS = {'hen': 'art/actors/room-23-hen.png', 'raccoon': 'art/actors/room-23-raccoon-emerging.png'}
src = open(os.path.join(ROOT, 'tools/art/one-level.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/one-level.py')}
exec(src[src.index('import json'):src.index('def man_at')], ns)
snap, N = ns['snap'], 115.0


def opaque_rgb(a):
    return np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2) >= 120


def despill(a, tolerance=6):
    a = a.copy(); c = a[..., :3].astype(int)
    ex = np.minimum(c[..., 0], c[..., 2]) - c[..., 1]
    hit = (a[..., 3] > 0) & (ex > tolerance)
    c[..., 0] -= np.where(hit, ex, 0); c[..., 2] -= np.where(hit, ex, 0)
    a[..., :3] = np.clip(c, 0, 255).astype(np.uint8)
    return a, int(hit.sum())


def spill_left(a, tolerance=6):
    c = a[..., :3].astype(int)
    return int(((a[..., 3] > 0) & (np.minimum(c[..., 0], c[..., 2]) - c[..., 1] > tolerance)).sum())


def runs(mask_1d, min_len):
    out, start = [], None
    for i, on in enumerate(mask_1d):
        if on and start is None: start = i
        if not on and start is not None:
            if i - start >= min_len: out.append((start, i))
            start = None
    if start is not None and len(mask_1d) - start >= min_len: out.append((start, len(mask_1d)))
    return out


sheet = np.asarray(Image.open(SRC).convert('RGB')).astype(int)
op = opaque_rgb(sheet)
rows = runs(op.any(1), 60)
assert len(rows) == 2, rows
figures = []
for y0, y1 in rows:
    cols = runs(op[y0:y1].any(0), 30)
    assert len(cols) == 3, cols
    figures.append([(y0, y1, x0, x1) for x0, x1 in cols])


def tall(box):
    y0, y1, x0, x1 = box
    r = np.nonzero(op[y0:y1, x0:x1].any(1))[0]; return r[-1] - r[0] + 1


def ear_span(box):
    """Across both ears: the opaque columns of the top tenth of the figure, outer edge to outer edge."""
    y0, y1, x0, x1 = box
    m = op[y0:y1, x0:x1]; r = np.nonzero(m.any(1))[0]; top = r[0]
    band = m[top:top + max(4, int(0.1 * (r[-1] - top)))]
    c = np.nonzero(band.any(0))[0]; return int(c[-1] - c[0] + 1)


def cut_one(box, k, tmp, tag):
    y0, y1, x0, x1 = box
    crop = sheet[y0:y1, x0:x1].astype(np.uint8)
    pad = np.zeros((crop.shape[0] + 80, crop.shape[1] + 160, 3), np.uint8); pad[...] = (255, 0, 255)
    pad[40:40 + crop.shape[0], 80:80 + crop.shape[1]] = crop
    p_in, p_out = os.path.join(tmp, f'{tag}.png'), os.path.join(tmp, f'{tag}-out.png')
    Image.fromarray(pad).save(p_in)
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cut-ambient-sheet.py'),
                                               p_in, str(max(8, round(tall(box) * k))), p_out, '--min-island', '40']))
    x, y, w, h = info['frames'][0]
    a = np.asarray(Image.open(p_out).convert('RGBA'))[y:y + h, x:x + w]
    mm = a[..., 3] > 128; rr = np.nonzero(mm.any(1))[0]; cc = np.nonzero(mm.any(0))[0]
    return a[rr[0]:rr[-1] + 1, cc[0]:cc[-1] + 1].copy()


def register(ref, pose, band=0.3):
    """pose's offset onto ref: bottoms on one line, then across by the bottom band's overlap."""
    H = max(ref.shape[0], pose.shape[0]); W = max(ref.shape[1], pose.shape[1]) + 40
    def pad(a):
        out = np.zeros((H, W), bool); out[H - a.shape[0]:, 20:20 + a.shape[1]] = a[..., 3] > 128; return out
    A, B = pad(ref), pad(pose); lo = int(H - min(ref.shape[0], pose.shape[0]) * band)
    best, at = -1, 0
    for dx in range(-20, 21):
        s = np.roll(B, dx, 1)[lo:]; sc = (A[lo:] & s).sum() / max(1, (A[lo:] | s).sum())
        if sc > best: best, at = sc, dx
    return at, round(float(best), 3)


report = {}
with tempfile.TemporaryDirectory() as tmp:
    for (name, boxes) in zip(('hen', 'raccoon'), figures):
        if name == 'hen':
            k = HEN_OF_MAN * MAN / tall(boxes[0])
        else:
            k = RACCOON_EARS / ear_span(boxes[0])
        cells = [cut_one(b, k, tmp, f'{name}{i}') for i, b in enumerate(boxes)]
        rest = cells[0]
        placed = [(0, 1.0)] + [register(rest, c) for c in cells[1:]]
        # one canvas for all: wide and tall enough for every pose, bottoms on one line
        left = max(0, -min(dx for dx, _ in placed)); right = max(c.shape[1] + dx for c, (dx, _) in zip(cells, placed))
        Wc = left + right + 2; Hc = max(c.shape[0] for c in cells)
        def on_canvas(c, dx):
            f = np.zeros((Hc, Wc, 4), np.uint8); x = left + dx
            f[Hc - c.shape[0]:, x:x + c.shape[1]] = c; return f
        frames = [on_canvas(c, dx) for c, (dx, _) in zip(cells, placed)]
        r0 = frames[0]; m = r0[..., 3] > 128; rr = np.nonzero(m.any(1))[0]; mid = rr[0] + (rr[-1] - rr[0]) // 2
        breath = r0.copy(); breath[:mid - 1] = r0[1:mid]; breath[mid - 1] = r0[mid]
        frames = [frames[0], breath, frames[1], frames[2]]
        b = MAN / N
        frames = [snap(f, b) for f in frames]
        fixed = 0
        for i, f in enumerate(frames):
            frames[i], n = despill(f); fixed += n
        assert all(spill_left(f) == 0 for f in frames), f'{name}: magenta survives the despill'
        fh = max(f.shape[0] for f in frames); fw = max(f.shape[1] for f in frames)
        out = np.zeros((fh + 4, len(frames) * (fw + 2) + 2, 4), np.uint8); rects = []
        for i, f in enumerate(frames):
            x = 2 + i * (fw + 2); out[2 + fh - f.shape[0]:2 + fh, x:x + f.shape[1]] = f; rects.append([x, 2, fw, fh])
        report[name] = {'scale': round(k, 4), 'restHeight': int(rest.shape[0]), 'fits': placed[1:], 'frames': rects,
                        'despilled': fixed, 'block': round(b, 2)}
        if name == 'hen': report[name]['ofMan'] = round(rest.shape[0] / MAN, 3)
        if '--write' in sys.argv:
            Image.fromarray(out).save(os.path.join(ROOT, OUTS[name]))
print(json.dumps(report))
