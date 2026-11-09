"""Scene A's hitch, cut (reference/act3-hearse/brief.md, operation 1; doc 110 section 2).

act3-hearse operation 1 drew the hearse and Grievance three times on magenta, beside the in-game Thad as a ruler
(art/staging/act3-hearse/op-1/sheet.png): 1 her head turned back a little toward the hearse (rest), 2 turned fully
back, 3 a front hoof lifted. This makes the shipping sheet:

  1. Each row's hitch is laid side by side, boots on one line, and cut by tools/art/cut-ambient-sheet.py (key,
     despill, registered on the legs, premultiplied resize, rim fix) at HEIGHT, the height that puts her withers at
     0.82 of Room 14's man at the gate (298 px; content/scale-anchors.json's mules, 0.77-0.91). The generator drew
     her at 0.68 of its Thad, and the hearse a short 1.08 of a man; one factor for the whole hitch mends both.
  2. THE HEARSE DOES NOT MOVE: every frame takes the rest frame's pixels left of SEAM (the hearse and the shaft),
     and its own pixels right of it (Grievance). The seam is on the shaft, where nothing else crosses.
  3. A breath is derived for her alone, as tools/art/cast-unify-cut.py derives one: her rows above the barrel's
     middle lifted one pixel, right of the seam.
  4. Snapped to one level (tools/art/one-level.py's snap) at a man of 298 px.

Frames: 0 rest (her head turned a little back toward the hearse), 1 breath, 2 her head turned fully back, 3 a hoof
stamped. Errata 77: a breath that never stops, and the two actions as breaks.

Usage: act3-hearse-cut.py [--write]   (without --write, prints the measurements)
"""
import json, os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'art/staging/act3-hearse/op-1/sheet.png')
OUT = os.path.join(ROOT, 'art/actors/room-14-hearse-grievance.png')
MAN = 298                       # Room 14's man at the gate (walk boxes floor_3_0 / floor_4_2)
WITHERS = 0.82                  # of that man
X0, X1 = 150, 1010              # the hitch; Thad, the ruler, stands right of X1
src = open(os.path.join(ROOT, 'tools/art/one-level.py')).read()
ns = {'__file__': os.path.join(ROOT, 'tools/art/one-level.py')}
exec(src[src.index('import json'):src.index('def man_at')], ns)
snap, N = ns['snap'], 115.0


def opaque_rgb(a):
    return np.sqrt((a[..., 0] - 255) ** 2 + a[..., 1] ** 2 + (a[..., 2] - 255) ** 2) >= 120


def despill(a, tolerance=6):
    """Magenta left in thin pockets (between a wheel's spokes, inside a plume) that the cutter's own despill missed:
    red and blue standing above green TOGETHER is the key's signature (a blue-black lacquer has blue over green, but
    not red). Both are pulled down by that excess. Returns the frame and how many pixels were touched."""
    a = a.copy(); c = a[..., :3].astype(int)
    ex = np.minimum(c[..., 0], c[..., 2]) - c[..., 1]
    hit = (a[..., 3] > 0) & (ex > tolerance)
    c[..., 0] -= np.where(hit, ex, 0); c[..., 2] -= np.where(hit, ex, 0)
    a[..., :3] = np.clip(c, 0, 255).astype(np.uint8)
    return a, int(hit.sum())


def spill_left(a, tolerance=6):
    c = a[..., :3].astype(int)
    return int(((a[..., 3] > 0) & (np.minimum(c[..., 0], c[..., 2]) - c[..., 1] > tolerance)).sum())


sheet = np.asarray(Image.open(SRC).convert('RGB')).astype(int)
# The rows, found by the magenta between them (a fixed third of the sheet put row 3's roof ornament in row 2).
busy = opaque_rgb(sheet[:, X0:X1]).any(1)
BANDS, start = [], None
for y, on in enumerate(busy):
    if on and start is None: start = y
    if not on and start is not None: BANDS.append((start, y)); start = None
if start is not None: BANDS.append((start, len(busy)))
BANDS = [(max(0, y0 - 4), min(len(busy), y1 + 4)) for y0, y1 in BANDS if y1 - y0 > 100]
assert len(BANDS) == 3, BANDS
crops = [sheet[y0:y1, X0:X1] for y0, y1 in BANDS]
bots = [int(np.nonzero(opaque_rgb(c).any(1))[0][-1]) for c in crops]
# her withers in the rest row: the top of her back, over the hind half of her body
rest = opaque_rgb(crops[0])
back = [int(np.nonzero(rest[:, x - X0])[0][0]) for x in range(700, 860)]
withers_src = bots[0] - min(back) + 1
hitch_src = bots[0] - int(np.nonzero(rest.any(1))[0][0]) + 1
HEIGHT = round(hitch_src * WITHERS * MAN / withers_src)

def cut_one(crop, height, tmp, i):
    """One row through tools/art/cut-ambient-sheet.py on its own, so its scale is the shared factor, not its
    own bounding box's (the plume rides higher when her head is turned, and a per-pose height shrank that row)."""
    pad = np.zeros((crop.shape[0] + 80, crop.shape[1] + 160, 3), np.uint8); pad[...] = (255, 0, 255)
    pad[40:40 + crop.shape[0], 80:80 + crop.shape[1]] = crop
    src_p, out_p = os.path.join(tmp, f'in{i}.png'), os.path.join(tmp, f'out{i}.png')
    Image.fromarray(pad).save(src_p)
    info = json.loads(subprocess.check_output([sys.executable, os.path.join(ROOT, 'tools/art/cut-ambient-sheet.py'),
                                               src_p, str(height), out_p]))
    x, y, w, h = info['frames'][0]
    a = np.asarray(Image.open(out_p).convert('RGBA'))[y:y + h, x:x + w]
    m = a[..., 3] > 128; r = np.nonzero(m.any(1))[0]; c = np.nonzero(m.any(0))[0]
    return a[r[0]:r[-1] + 1, c[0]:c[-1] + 1].copy()


k = HEIGHT / hitch_src
talls = [bots[i] - int(np.nonzero(opaque_rgb(c).any(1))[0][0]) + 1 for i, c in enumerate(crops)]
with tempfile.TemporaryDirectory() as tmp:
    raw = [cut_one(c, round(tl * k), tmp, i) for i, (c, tl) in enumerate(zip(crops, talls))]


def her_cols(a, join):
    return a[:, join:]


def register(ref, pose, join):
    """Where pose goes on ref's canvas: her hooves on ref's (the lowest opaque row right of the join) and her
    hindquarters laid on ref's (best overlap over the lower half of her body, right of the join)."""
    def bottom(a): return int(np.nonzero((a[:, join:, 3] > 128).any(1))[0][-1])
    dy = bottom(ref) - bottom(pose)
    A = ref[..., 3] > 128
    best, at = -1, 0
    for dx in range(-60, 61):
        B = np.zeros_like(A)
        ys = slice(max(0, dy), min(A.shape[0], dy + pose.shape[0]))
        xs = slice(max(0, dx), min(A.shape[1], dx + pose.shape[1]))
        B[ys, xs] = pose[ys.start - dy:ys.stop - dy, xs.start - dx:xs.stop - dx, 3] > 128
        band = slice(join, join + 160)
        lo = A.shape[0] // 2
        s = (A[lo:, band] & B[lo:, band]).sum() / max(1, (A[lo:, band] | B[lo:, band]).sum())
        if s > best: best, at = s, dx
    return at, dy, round(float(best), 3)


cells = [raw[0]]
w, h = cells[0].shape[1], cells[0].shape[0]
op = cells[0][..., 3] > 128
count = op.sum(0)
lo, hi = int(w * .45), int(w * .75)
SEAM = lo + int(np.argmin(count[lo:hi]))
# her rump: the first column right of the seam where she is more than the shaft
rump = SEAM + int(np.nonzero(count[SEAM:] > count[SEAM] * 3)[0][0])
JOIN = rump - 4
placed = [register(cells[0], pose, JOIN) for pose in raw[1:]]
PAD = max([0] + [-dy + 0 for _, dy, _ in placed if dy < 0] + [-(dy) for _, dy, _ in placed])
PAD = max(0, max(-dy for _, dy, _ in placed))          # rows added on top, so a higher head or plume is kept
rest0 = np.zeros((cells[0].shape[0] + PAD, cells[0].shape[1], 4), np.uint8); rest0[PAD:] = cells[0]
frames = [rest0]
fits = []
for pose, (dx, dy, fit) in zip(raw[1:], placed):
    f = np.zeros_like(rest0)
    dy += PAD
    ys = slice(max(0, dy), min(f.shape[0], dy + pose.shape[0]))
    xs = slice(max(0, dx), min(f.shape[1], dx + pose.shape[1]))
    f[ys, xs] = pose[ys.start - dy:ys.stop - dy, xs.start - dx:xs.stop - dx]
    her_lost = int((pose[:, max(0, JOIN - dx):, 3] > 128).sum() - (f[:, JOIN:, 3] > 128).sum())
    fits.append([dx, dy - PAD, fit, her_lost])
    f[:, :JOIN] = rest0[:, :JOIN]
    frames.append(f)
# the breath, hers alone
her = frames[0][:, JOIN:]
rows = np.nonzero((her[..., 3] > 128).any(1))[0]
mid = rows[0] + (rows[-1] - rows[0]) * 55 // 100
breath = frames[0].copy()
breath[:mid - 1, JOIN:] = frames[0][1:mid, JOIN:]
breath[mid - 1, JOIN:] = frames[0][mid, JOIN:]
frames = [frames[0], breath, frames[1], frames[2]]
b = MAN / N
frames = [snap(f, b) for f in frames]
fixed = 0
for i, f in enumerate(frames):
    frames[i], n = despill(f); fixed += n
assert all(spill_left(f) == 0 for f in frames), 'magenta survives the despill'
fh = max(f.shape[0] for f in frames); fw = max(f.shape[1] for f in frames)
out = np.zeros((fh + 4, len(frames) * (fw + 2) + 2, 4), np.uint8)
rects = []
for i, f in enumerate(frames):
    x = 2 + i * (fw + 2)
    out[2 + fh - f.shape[0]:2 + fh, x:x + f.shape[1]] = f
    rects.append([x, 2, fw, fh])
withers_out = round(withers_src * HEIGHT / hitch_src)
report = {'despilled': fixed, 'height': HEIGHT, 'withers': withers_out, 'withersOfMan': round(withers_out / MAN, 3),
          'hitchOfMan': round(fh / MAN, 3), 'seam': SEAM, 'join': JOIN, 'poseFits': fits, 'padTop': PAD, 'block': round(b, 2), 'frames': rects}
print(json.dumps(report))
if '--write' in sys.argv:
    Image.fromarray(out).save(OUT)
