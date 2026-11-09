"""Scene B's séance table, cut (reference/act3-seance/brief.md; doc 111 part B).

act3-seance drew the séance three times on magenta beside the in-game Thad as a ruler, at 0.7 of Room 16's man
(art/staging/act3-seance/op-<N>/sheet.png). This makes a shipping sheet from one operation's rows:

  1. The rows are found by the magenta between them; Thad (the ruler, right of RULER_X) is left out.
  2. One scale for every row: Thad's drawn height in the sheet is Room 16's man (MAN), so a seated figure keeps
     the size the generator gave it beside him.
  3. THE GROUP DOES NOT MOVE: every action frame is the rest frame with ONLY what changed pasted in -- the region
     where the action row differs from the rest row (after registering the two), grown a little, its largest
     cluster. So a glance is a head and a tap is a hand, and the table, the cloth and everyone else are the rest
     frame's own pixels.
  4. A breath is derived as tools/art/cast-unify-cut.py derives one: the rows above the tabletop lifted a pixel.
  5. Despilled (the key's red-and-blue-over-green signature) and refused if any is left; snapped to one level.

Usage: act3-seance-cut.py <op> <out.png> <action row:label> ... [--breath] [--split X] [--match <sheet>]
                         [--lamps <out.png>] [--write]
  op 1: act3-seance-cut.py 1 art/actors/room-16-seance-table.png 2:glance 3:pencil --breath --write
  op 2: act3-seance-cut.py 2 art/actors/room-16-seance-table-dark.png 2:turn:2 --breath --split 1000
        --match art/actors/room-16-seance-table.png --lamps art/props/room-16-seance-lamp.png --write
  --match: op 2 has no ruler; it is op 1's group in the dark, so its rest frame is scaled to op 1's rest frame's
  height and registered onto op 1's canvas -- the group does not jump when the lamp goes down.
  --lamps: the column right of --split holds the hanging lamp, lit and turned down; each is cut at the plate's own
  lamp's height (LAMP_H) into its own sheet.
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
def opt(name):
    return sys.argv[sys.argv.index(name) + 1] if name in sys.argv else None
SKIP = {sys.argv.index(n) + 1 for n in ('--match', '--lamps', '--split') if n in sys.argv}
args = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith('--') and i not in SKIP]
MATCH, LAMPS = opt('--match'), opt('--lamps')
LAMP_H = 180                    # the plate's own hanging lamp, ring to finial (art/backgrounds/room-16-tent.png)
OP, OUT = args[0], os.path.join(ROOT, args[1])
# row:label[:n] -- n is how many changed regions the action is (largest first): a glance is one, a turn can be two
ACTIONS = [(int(a.split(':')[0]), a.split(':')[1], int(a.split(':')[2]) if a.count(':') == 2 else 1) for a in args[2:]]
SRC = os.path.join(ROOT, f'art/staging/act3-seance/op-{OP}/sheet.png')
MAN = 450                       # Room 16's man on the floor before the table (walk boxes)
RULER_X = int(opt('--split') or 1300)  # right of this: the ruler (op 1) or the lamps (op 2)
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


def bands(mask):
    busy = mask.any(1); out, start = [], None
    for y, on in enumerate(busy):
        if on and start is None: start = y
        if not on and start is not None: out.append((start, y)); start = None
    if start is not None: out.append((start, len(busy)))
    return [(max(0, a - 4), min(len(busy), b + 4)) for a, b in out if b - a > 100]


sheet = np.asarray(Image.open(SRC).convert('RGB')).astype(int)
op = opaque_rgb(sheet)
rows = bands(op[:, :RULER_X])
ruler = []
for y0, y1 in rows:
    r = np.nonzero(op[y0:y1, RULER_X:].any(1))[0]
    ruler.append(r[-1] - r[0] + 1)
if MATCH:
    # No ruler: the group is the same drawing as MATCH's rest frame, so it takes that frame's height exactly.
    ref_sheet = np.asarray(Image.open(os.path.join(ROOT, MATCH)).convert('RGBA'))
    ref_full = ref_sheet[2:ref_sheet.shape[0] - 2, 2:2 + (ref_sheet.shape[1] - 2) // 4 - 2]
    mm = ref_full[..., 3] > 128; rr = np.nonzero(mm.any(1))[0]
    r0 = np.nonzero(op[rows[0][0]:rows[0][1], :RULER_X].any(1))[0]
    k = (rr[-1] - rr[0] + 1) / (r0[-1] - r0[0] + 1)
else:
    k = MAN / float(np.median(ruler))
crops = []
for y0, y1 in rows:
    c = np.nonzero(op[y0:y1, :RULER_X].any(0))[0]
    crops.append(sheet[y0:y1, max(0, c[0] - 6):c[-1] + 7].astype(np.uint8))


def cut_one(crop, tmp, i):
    """One row through tools/art/cut-ambient-sheet.py, at the shared scale."""
    m = opaque_rgb(crop.astype(int)); r = np.nonzero(m.any(1))[0]
    tall = r[-1] - r[0] + 1
    pad = np.zeros((crop.shape[0] + 80, crop.shape[1] + 160, 3), np.uint8); pad[...] = (255, 0, 255)
    pad[40:40 + crop.shape[0], 80:80 + crop.shape[1]] = crop
    p_in, p_out = os.path.join(tmp, f'in{i}.png'), os.path.join(tmp, f'out{i}.png')
    Image.fromarray(pad).save(p_in)
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cut-ambient-sheet.py'),
                                               p_in, str(round(tall * k)), p_out, '--min-island', '60']))
    x, y, w, h = info['frames'][0]
    a = np.asarray(Image.open(p_out).convert('RGBA'))[y:y + h, x:x + w]
    mm = a[..., 3] > 128; rr = np.nonzero(mm.any(1))[0]; cc = np.nonzero(mm.any(0))[0]
    return a[rr[0]:rr[-1] + 1, cc[0]:cc[-1] + 1].copy()


with tempfile.TemporaryDirectory() as tmp:
    cut = [cut_one(c, tmp, i) for i, c in enumerate(crops)]
rest = cut[0]


def place(pose, onto=None):
    """pose laid on rest's canvas where its opaque pixels best cover rest's (bottoms aligned, then a search)."""
    base = rest if onto is None else onto
    A = base[..., 3] > 128
    best, at = -1, (0, 0)
    reach = 30 if onto is not None else 12
    for dy in range(-reach, reach + 1):
        for dx in range(-reach, reach + 1):
            B = np.zeros_like(A)
            ys = slice(max(0, dy), min(A.shape[0], dy + pose.shape[0])); xs = slice(max(0, dx), min(A.shape[1], dx + pose.shape[1]))
            B[ys, xs] = pose[ys.start - dy:ys.stop - dy, xs.start - dx:xs.stop - dx, 3] > 128
            s = (A & B).sum() / max(1, (A | B).sum())
            if s > best: best, at = s, (dx, dy)
    dx, dy = at
    f = np.zeros_like(base)
    ys = slice(max(0, dy), min(f.shape[0], dy + pose.shape[0])); xs = slice(max(0, dx), min(f.shape[1], dx + pose.shape[1]))
    f[ys, xs] = pose[ys.start - dy:ys.stop - dy, xs.start - dx:xs.stop - dx]
    return f, at, round(float(best), 3)


def changed_regions(f, n_take):
    """The n_take largest clusters where f differs from rest, each grown by G px, as boxes: a turn can be a head AND
    a hand, and anything smaller that differs is the generator drifting between rows, which the rest frame keeps."""
    d = (np.abs(f[..., :3].astype(int) - rest[..., :3].astype(int)).sum(-1) > 120) | ((f[..., 3] > 128) != (rest[..., 3] > 128))
    from scipy import ndimage
    d = ndimage.binary_opening(d, iterations=1)
    lab, n = ndimage.label(ndimage.binary_dilation(d, iterations=6))
    if n == 0: return []
    sizes = ndimage.sum(d, lab, range(1, n + 1))
    G = 3; boxes = []
    for i in (1 + np.argsort(sizes)[::-1][:n_take]):
        ys, xs = np.nonzero(lab == i)
        boxes.append((max(0, ys.min() - G), min(f.shape[0], ys.max() + G + 1), max(0, xs.min() - G), min(f.shape[1], xs.max() + G + 1)))
    return boxes


report = {}
if MATCH:
    ref_rest = ref_full[:, :][np.ix_(np.nonzero((ref_full[..., 3] > 128).any(1))[0], np.nonzero((ref_full[..., 3] > 128).any(0))[0])] if False else None
    m = ref_full[..., 3] > 128; ry = np.nonzero(m.any(1))[0]; rx = np.nonzero(m.any(0))[0]
    ref_crop = ref_full[ry[0]:ry[-1] + 1, rx[0]:rx[-1] + 1]
    rest, at, fit = place(cut[0], onto=ref_crop)
    report['matched'] = {'to': MATCH, 'placed': at, 'fit': fit}
frames, labels = [rest], ['rest']
if '--breath' in sys.argv:
    # the table's far edge: the first row where the cloth (red over green and blue) spans a third of the group
    # (in the dark the cloth is near black, so a matched group reads the line off the lit group it is laid on)
    lit = ref_crop if MATCH else rest
    c = lit[..., :3].astype(int); m = lit[..., 3] > 128
    cloth = m & (c[..., 0] > c[..., 1] + 25) & (c[..., 0] > c[..., 2] + 15)
    top = int(np.nonzero(cloth.sum(1) > lit.shape[1] / 3)[0][0])
    b = rest.copy(); b[:top - 1] = rest[1:top]; b[top - 1] = rest[top]
    frames.append(b); labels.append('breath'); report['breathAbove'] = top
for row, label, n_take in ACTIONS:
    f, at, fit = place(cut[row - 1])
    boxes = changed_regions(f, n_take)
    out = rest.copy()
    for y0, y1, x0, x1 in boxes:
        out[y0:y1, x0:x1] = f[y0:y1, x0:x1]
    frames.append(out); labels.append(label)
    report[label] = {'placed': at, 'fit': fit, 'boxes': [[int(v) for v in b] for b in boxes]}
b = MAN / N
frames = [snap(f, b) for f in frames]
fixed = 0
for i, f in enumerate(frames):
    frames[i], n = despill(f); fixed += n
assert all(spill_left(f) == 0 for f in frames), 'magenta survives the despill'
fh = max(f.shape[0] for f in frames); fw = max(f.shape[1] for f in frames)
sheet_out = np.zeros((fh + 4, len(frames) * (fw + 2) + 2, 4), np.uint8)
rects = []
for i, f in enumerate(frames):
    x = 2 + i * (fw + 2)
    sheet_out[2 + fh - f.shape[0]:2 + fh, x:x + f.shape[1]] = f
    rects.append([x, 2, fw, fh])
report.update({'scale': round(k, 3), 'ruler': [int(r) for r in ruler], 'frames': dict(zip(labels, rects)), 'despilled': fixed,
               'block': round(b, 2)})
lamp_rects = None
if LAMPS:
    # the right-hand column: one lamp per row, each cut at the plate lamp's height
    lamp_cells = []
    with tempfile.TemporaryDirectory() as tmp:
        for i, (y0, y1) in enumerate(rows):
            sub = op[y0:y1, RULER_X:]
            if not sub.any(): continue
            yy = np.nonzero(sub.any(1))[0]; xx = np.nonzero(sub.any(0))[0]
            crop = sheet[y0 + yy[0] - 4:y0 + yy[-1] + 5, RULER_X + xx[0] - 4:RULER_X + xx[-1] + 5].astype(np.uint8)
            kk = LAMP_H / (yy[-1] - yy[0] + 1)
            k_saved = k
            globals()['k'] = kk
            lamp_cells.append(cut_one(crop, tmp, 100 + i))
            globals()['k'] = k_saved
    lamp_cells = [despill(snap(c, MAN / N))[0] for c in lamp_cells]
    assert all(spill_left(c) == 0 for c in lamp_cells)
    lh = max(c.shape[0] for c in lamp_cells); lw = max(c.shape[1] for c in lamp_cells)
    lamp_sheet = np.zeros((lh + 4, len(lamp_cells) * (lw + 2) + 2, 4), np.uint8); lamp_rects = []
    for i, c in enumerate(lamp_cells):
        x = 2 + i * (lw + 2) + (lw - c.shape[1]) // 2
        lamp_sheet[2:2 + c.shape[0], x:x + c.shape[1]] = c
        lamp_rects.append([2 + i * (lw + 2), 2, lw, lh])
    report['lamps'] = {'lit': lamp_rects[0], 'down': lamp_rects[1]} if len(lamp_rects) == 2 else lamp_rects
print(json.dumps(report))
if '--write' in sys.argv:
    Image.fromarray(sheet_out).save(OUT)
    if LAMPS: Image.fromarray(lamp_sheet).save(os.path.join(ROOT, LAMPS))
