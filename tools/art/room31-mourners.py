"""The seven mourners at the graveside, composed person by person on Room 31's hill.

Tyler, 2026-11-06 (one artist, one game): the mourners were the last of the
old drawings, and they faced the camera like a photograph. Cast-unify 30 drew
seven distinct mourners on magenta (reference/cast-unify-28.txt), every man
holding his hat (doc 10: "Every man here has taken his hat off"). Each face is
measured and the figure mirrored if needed so all seven look LEFT, toward the
grave and Sowerby; each stands at his own spot on the hill at its depth curve,
inside THE MOURNERS hotspot; then the band is relit into the funeral's night
as the rest of that cast is (tools/art/room31-relight-one.py).

Writes art/actors/room-31-mourners-master.png; prints frames, x, y.
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
B = os.path.join(ROOT, 'art/staging/cast-unify/batch-28')
MEN = (0, 1, 4, 6)
# (person, x, y, man at that spot): back row behind, front row before.
SPOTS = [(1, 1290, 624, 339), (4, 1395, 624, 339), (0, 1500, 624, 340), (6, 1610, 624, 339),
         (2, 1345, 664, 350), (5, 1455, 664, 350), (3, 1565, 664, 350)]
LEANS = [[(1, 4), (2, -4)], [(4, -4), (5, 4), (6, 3)], [(0, 4), (3, -4)]]


def facing(img):
    a = np.asarray(img).astype(int); m = a[..., 3] > 128
    rows = np.nonzero(m.any(1))[0]; top = rows[0]; H = rows[-1] - top
    hd = a[top:top + max(4, int(H * 0.16))]; ha = hd[..., 3] > 128
    r, g, b = hd[..., 0], hd[..., 1], hd[..., 2]
    skin = ha & (r > 150) & (g > 95) & (r - b > 45)
    return float(np.nonzero(skin)[1].mean() - np.nonzero(ha)[1].mean()) if skin.any() else 0.0


def lean(img, dx):
    a = np.asarray(img).copy(); h = a.shape[0]; out = np.zeros_like(a)
    for yy in range(h):
        s = int(round(dx * (h - 1 - yy) / (h - 1)))
        if s > 0: out[yy, s:] = a[yy, :-s]
        elif s < 0: out[yy, :s] = a[yy, -s:]
        else: out[yy] = a[yy]
    return Image.fromarray(out)


sh = Image.open(f'{B}/mourners.png').convert('RGBA')
figs = []
for x, y, w, h in json.load(open(f'{B}/mourners.json'))['frames']:
    c = sh.crop((x, y, x + w, y + h)); figs.append(c.crop(c.getbbox()))
figs = [f if facing(f) < 0 else f.transpose(Image.FLIP_LEFT_RIGHT) for f in figs]
away = [i for i, f in enumerate(figs) if facing(f) >= -1.0]
if away:
    raise SystemExit(f'mourners {away} do not clearly look left, toward the grave')
REF = float(np.median([figs[i].height for i in MEN]))
placed = []
for i, x, y, man in SPOTS:
    f = figs[i]; k = man / REF
    placed.append((y, i, x, f.resize((round(f.width * k), round(f.height * k)), Image.LANCZOS)))
x0 = min(x - p.width // 2 for _, _, x, p in placed) - 8; x1 = max(x - p.width // 2 + p.width for _, _, x, p in placed) + 8
y0 = min(y - p.height + 1 for y, _, _, p in placed) - 8; y1 = max(y for y, _, _, _ in placed) + 1
W, H = x1 - x0, y1 - y0


def frame(changes):
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for y, i, x, p in sorted(placed):
        canvas.alpha_composite(changes.get(i, p), (x - p.width // 2 - x0, y - p.height + 1 - y0))
    a = np.asarray(canvas).copy(); a[..., 3] = np.where(a[..., 3] >= 128, 255, 0)
    return a


by_person = {i: p for _, i, _, p in placed}
rest = frame({})
breath = rest.copy(); cut = int(H * 0.55); breath[:cut - 1] = rest[1:cut]
frames = [rest, breath] + [frame({i: lean(by_person[i], dx) for i, dx in grp}) for grp in LEANS]
GAP = 2
sheet = np.zeros((H + 2 * GAP, len(frames) * (W + GAP) + GAP, 4), np.uint8); rects = []
for n, f in enumerate(frames):
    fx = GAP + n * (W + GAP); sheet[GAP:GAP + H, fx:fx + W] = f; rects.append([fx, GAP, W, H])
day = f'{B}/mourners-day.png'
Image.fromarray(sheet).save(day)
json.dump({'frames': rects}, open(f'{B}/mourners-band.json', 'w'))
out = os.path.join(ROOT, 'art/actors/room-31-mourners-master.png')
subprocess.check_call([sys.executable, os.path.join(ROOT, 'tools/art/room31-relight-one.py'), day, f'{B}/mourners-band.json', str(x0 + W // 2), str(y1 - 1), out], stdout=subprocess.DEVNULL)
print(json.dumps({'frames': rects, 'x': x0 + W // 2, 'y': y1 - 1, 'ref': REF}))
